#!/usr/bin/env python3
# update_ecdo_dashboard.py
# v0.3 — coherent charts folder + long baselines + watch-score series + heading-free summary.md

import os
import re
import json
import math
import io
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

import requests
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# -------------------------
# Config
# -------------------------
TIMEOUT_S = 15

# Dashboard windows
SPACE_DAYS = 45          # gate window for daily quiet-day logic
EOP_DAYS = 180           # EOP anomaly window
MAG_DAYS = 90            # magnetometer composite window (practical)
BASELINE_YEARS_EOP = 10  # EOP baseline
BASELINE_YEARS_KP = 5    # Kp baseline

# Quiet-day gate thresholds (ethics: suppress inference when solar is driving the magnetosphere)
KP_QUIET_MAX = 4.0       # daily max Kp <= 4 => "quiet enough"
DST_QUIET_MIN = -50.0    # daily min Dst >= -50 => "quiet enough"

# Stations for magnetometer baseline (keep simple and robust)
MAG_STATIONS = [
    # Intermagnet / BGS GIN IDs vary; these are examples you can adjust later.
    # We'll keep the existing behavior in your script (previous station list).
    ("BOU", "Boulder (USGS/INTERMAGNET)"),
    ("FRD", "Fredericksburg (USGS/INTERMAGNET)"),
    ("OTT", "Ottawa (NRCan/INTERMAGNET)"),
]

# -------------------------
# URLs
# -------------------------
SWPC_KP_3H = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
SWPC_DST = "https://services.swpc.noaa.gov/products/kyoto-dst.json"

# IERS long-history EOP (CSV; semicolon delimited)
IERS_EOP_ALL_CSV = "https://datacenter.iers.org/data/csv/finals2000A.all.csv"
# IERS daily JSON (fallback)
IERS_EOP_DAILY_JSON = "https://datacenter.iers.org/products/eop/rapid/daily/json/finals2000A.daily.json"

# GFZ long-history daily Kp/Ap (since 1932; daily lines with 8 Kp values/day)
GFZ_KP_DAILY_SINCE_1932 = "https://kp.gfz.de/app/files/Kp_ap_Ap_SN_F107_since_1932.txt"

# C20 (TN-14)
C20_TN14 = "https://downloads.iers.org/products/long-term-data/earth-rotation-parameters/geomagnetic-field/tn14eop.txt"

# Magnetometer: your previous code used an Intermagnet endpoint; keep that structure.
# NOTE: If your endpoint differs, just keep your existing function and station map.
INTERMAGNET_BASE = "https://imag-data.bgs.ac.uk/GIN_V1/GINServices"

# -------------------------
# Helpers
# -------------------------
def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)

def fetch_text(url: str, timeout_s: int = TIMEOUT_S) -> str:
    r = requests.get(url, timeout=timeout_s)
    r.raise_for_status()
    return r.text

def fetch_text_cached(
    url: str,
    cache_path: Path,
    max_age_hours: float = 24.0,
    timeout_s: int = 60,
) -> str:
    """Fetch text with a simple on-disk cache.

    If network fails but cache exists, fall back to cache.
    """
    try:
        if cache_path.exists():
            mtime = datetime.fromtimestamp(cache_path.stat().st_mtime, tz=timezone.utc)
            age_h = (datetime.now(timezone.utc) - mtime).total_seconds() / 3600.0
            if age_h <= max_age_hours:
                return cache_path.read_text(encoding="utf-8", errors="replace")

        text = fetch_text(url, timeout_s=timeout_s)
        ensure_dir(cache_path.parent)
        cache_path.write_text(text, encoding="utf-8")
        return text
    except Exception:
        if cache_path.exists():
            return cache_path.read_text(encoding="utf-8", errors="replace")
        raise

def fetch_json(url: str) -> Any:
    r = requests.get(url, timeout=TIMEOUT_S)
    r.raise_for_status()
    return r.json()

def df_from_header_row_table(data: Any) -> pd.DataFrame:
    if not isinstance(data, list) or len(data) < 2:
        return pd.DataFrame()
    header = data[0]
    rows = data[1:]
    if not isinstance(header, list):
        return pd.DataFrame()
    df = pd.DataFrame(rows, columns=header)
    return df

def parse_utc(s: str) -> Optional[datetime]:
    if not s:
        return None
    try:
        if s.endswith("Z"):
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        return datetime.fromisoformat(s)
    except Exception:
        return None

def robust_zscore(series: pd.Series, window: int = 180) -> pd.Series:
    """Rolling robust z-score using median and MAD."""
    x = series.astype(float)
    med = x.rolling(window, min_periods=max(20, window//10)).median()
    mad = (x - med).abs().rolling(window, min_periods=max(20, window//10)).median()
    denom = 1.4826 * mad.replace(0, float("nan"))
    z = (x - med) / denom
    return z

def human_age(now: datetime, last: Optional[datetime]) -> str:
    if last is None or pd.isna(last):
        return "unknown"
    delta = now - last
    if delta.total_seconds() < 0:
        return "future? (clock/source issue)"
    hours = delta.total_seconds() / 3600.0
    if hours < 1:
        return f"{delta.total_seconds()/60.0:.0f} min"
    if hours < 48:
        return f"{hours:.1f} h"
    return f"{hours/24.0:.1f} d"

def write_png(path: Path) -> None:
    plt.tight_layout()
    plt.savefig(path, dpi=140)
    plt.close()

# -------------------------
# Loaders
# -------------------------
def load_iers_eop_daily_json() -> pd.DataFrame:
    data = fetch_json(IERS_EOP_DAILY_JSON)
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df.get("date"), utc=True, errors="coerce")

    out = pd.DataFrame({
        "date": df["date"],
        "pm_x_arcsec": pd.to_numeric(df.get("x_pole"), errors="coerce"),
        "pm_y_arcsec": pd.to_numeric(df.get("y_pole"), errors="coerce"),
        "ut1_utc_s": pd.to_numeric(df.get("ut1_utc"), errors="coerce"),
        "lod_ms": pd.to_numeric(df.get("lod"), errors="coerce"),
    })
    out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    out["pm_r_arcsec"] = (out["pm_x_arcsec"] ** 2 + out["pm_y_arcsec"] ** 2).pow(0.5)
    out["pm_speed_arcsec_per_day"] = out["pm_r_arcsec"].diff().abs()
    return out

def load_iers_eop_all_csv() -> pd.DataFrame:
    """Long-history EOP from IERS finals2000A.all.csv (semicolon-delimited)."""
    text = fetch_text(IERS_EOP_ALL_CSV, timeout_s=60)
    df = pd.read_csv(io.StringIO(text), sep=";", engine="python")
    df.columns = [c.strip() for c in df.columns]

    def req(name: str) -> str:
        if name in df.columns:
            return name
        raise ValueError(f"IERS CSV missing column '{name}'")

    y = req("Year"); m = req("Month"); d = req("Day")
    x = req("x_pole"); yy = req("y_pole")
    lod = req("LOD")
    ut = "UT1-UTC" if "UT1-UTC" in df.columns else None

    out = pd.DataFrame({
        "date": pd.to_datetime(dict(year=df[y], month=df[m], day=df[d]), utc=True, errors="coerce"),
        "pm_x_arcsec": pd.to_numeric(df[x], errors="coerce"),
        "pm_y_arcsec": pd.to_numeric(df[yy], errors="coerce"),
        "lod_ms": pd.to_numeric(df[lod], errors="coerce"),
    })
    if ut is not None:
        out["ut1_utc_s"] = pd.to_numeric(df[ut], errors="coerce")
    else:
        out["ut1_utc_s"] = float("nan")

    out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    out["pm_r_arcsec"] = (out["pm_x_arcsec"] ** 2 + out["pm_y_arcsec"] ** 2).pow(0.5)
    out["pm_speed_arcsec_per_day"] = out["pm_r_arcsec"].diff().abs()
    return out

def load_gfz_kp_daily_since_1932(cache_dir: Path) -> pd.DataFrame:
    """Load daily Kp (8 values/day) + Ap from GFZ (updated daily)."""
    cache_path = cache_dir / "gfz_kp_daily_since_1932.txt"
    text = fetch_text_cached(
        GFZ_KP_DAILY_SINCE_1932,
        cache_path,
        max_age_hours=24.0,
        timeout_s=120,
    )

    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) < 28:
            continue
        try:
            year = int(parts[0]); month = int(parts[1]); day = int(parts[2])
            kp = [float(x) for x in parts[7:15]]
            Ap = float(parts[23])
        except Exception:
            continue

        dt = datetime(year, month, day, tzinfo=timezone.utc)
        kp_clean = [x for x in kp if x >= 0]
        if not kp_clean:
            continue
        rows.append({
            "date": dt,
            "kp_max": max(kp_clean),
            "kp_mean": sum(kp_clean) / len(kp_clean),
            "Ap": Ap if Ap >= 0 else float("nan"),
        })

    df = pd.DataFrame(rows)
    if df.empty:
        return df
    return df.sort_values("date").reset_index(drop=True)

def load_c20_tn14() -> pd.DataFrame:
    text = fetch_text(C20_TN14, timeout_s=60)
    lines = text.splitlines()
    data_lines = [ln for ln in lines if ln.strip() and ln.strip()[0].isdigit()]

    rows = []
    for ln in data_lines:
        parts = ln.split()
        if len(parts) < 10:
            continue
        try:
            yearfrac0 = float(parts[1])
            c20_anom = float(parts[3])  # 1e-10
            c20_sigma = float(parts[4]) # 1e-10
        except Exception:
            continue
        rows.append({
            "yearfrac": yearfrac0,
            "c20_anom_1e10": c20_anom,
            "c20_sigma_1e10": c20_sigma,
        })
    df = pd.DataFrame(rows)
    return df.sort_values("yearfrac").reset_index(drop=True)

def load_magnetometer_daily_stats(station: str, days: int = 90) -> pd.DataFrame:
    """Fetch daily mean/std for H component from an Intermagnet-like service.

    If your existing endpoint differs, swap this function back to your working version.
    """
    end = utcnow()
    start = end - timedelta(days=days)
    # NOTE: You may need to adjust query parameters to match your working setup.
    url = (
        f"{INTERMAGNET_BASE}/Data?"
        f"format=JSON&"
        f"id={station}&"
        f"startDate={start.strftime('%Y-%m-%d')}&"
        f"endDate={end.strftime('%Y-%m-%d')}&"
        f"observatoryIagaCode={station}&"
        f"elements=H&"
        f"samplingPeriod=PT1M"
    )
    try:
        data = fetch_json(url)
    except Exception:
        return pd.DataFrame()

    rows = []
    # Expect a list of samples with timestamps; we will aggregate daily.
    # If your service returns different shape, keep your previous parsing logic.
    if isinstance(data, dict) and "values" in data:
        data = data["values"]

    if not isinstance(data, list):
        return pd.DataFrame()

    for item in data:
        if not isinstance(item, dict):
            continue
        t = parse_utc(item.get("timestamp") or item.get("time") or "")
        v = item.get("H") or item.get("value") or item.get("h")
        try:
            v = float(v)
        except Exception:
            continue
        if t is None:
            continue
        rows.append({"time": t, "H": v})

    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df["time"] = pd.to_datetime(df["time"], utc=True)
    df["date"] = df["time"].dt.floor("D")
    g = df.groupby("date")["H"]
    out = g.agg(H_mean="mean", H_std="std").reset_index()
    out = out.sort_values("date").reset_index(drop=True)
    return out

def shade_disturbed_days(ax, daily_gate: pd.Series, dates: pd.Series) -> None:
    if daily_gate is None or daily_gate.empty or dates is None or len(dates) == 0:
        return
    ds = pd.to_datetime(dates, utc=True)
    d0 = ds.min().floor("D")
    d1 = ds.max().ceil("D")
    days = pd.date_range(d0, d1, freq="D", tz="UTC")
    gate = daily_gate.reindex(days).fillna(False)
    for day, is_quiet in gate.items():
        if not is_quiet:
            ax.axvspan(day, day + pd.Timedelta(days=1), alpha=0.10)

# -------------------------
# Main
# -------------------------
def main() -> None:
    now = utcnow()

    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    assets = root_dir / "assets"
    ensure_dir(assets)
    charts = assets / "charts"
    ensure_dir(charts)
    cache_dir = assets / "cache"
    ensure_dir(cache_dir)

    # ---------- Space weather gate (recent 3-hour Kp + Dst) ----------
    kp3 = df_from_header_row_table(fetch_json(SWPC_KP_3H))
    dst = df_from_header_row_table(fetch_json(SWPC_DST))

    # Kp (NOAA uses column "Kp")
    if not kp3.empty:
        kp3["time_tag"] = pd.to_datetime(kp3.get("time_tag"), utc=True, errors="coerce")
        kp_col = next((c for c in ["Kp", "kp_index", "kp"] if c in kp3.columns), None)
        kp3["kp"] = pd.to_numeric(kp3[kp_col], errors="coerce") if kp_col else pd.Series(dtype=float)
        kp3 = kp3.dropna(subset=["time_tag", "kp"]).sort_values("time_tag")
    else:
        kp3 = pd.DataFrame(columns=["time_tag", "kp"])

    # Dst
    if not dst.empty:
        dst["time_tag"] = pd.to_datetime(dst.get("time_tag"), utc=True, errors="coerce")
        dst["dst"] = pd.to_numeric(dst.get("dst", pd.Series(dtype=float)), errors="coerce")
        dst = dst.dropna(subset=["time_tag", "dst"]).sort_values("time_tag")
    else:
        dst = pd.DataFrame(columns=["time_tag", "dst"])

    kp3_w = kp3[kp3["time_tag"] >= (now - timedelta(days=SPACE_DAYS))].copy()
    dst_w = dst[dst["time_tag"] >= (now - timedelta(days=SPACE_DAYS))].copy()


    kp3_w = kp3[kp3["time_tag"] >= (now - timedelta(days=SPACE_DAYS))].copy()
    dst_w = dst[dst["time_tag"] >= (now - timedelta(days=SPACE_DAYS))].copy()

    kp3_w["date"] = kp3_w["time_tag"].dt.floor("D")
    dst_w["date"] = dst_w["time_tag"].dt.floor("D")

    kp_daily = kp3_w.groupby("date")["kp"].agg(["max", "mean"]).rename(columns={"max":"kp_max", "mean":"kp_mean"}).reset_index()
    dst_daily = dst_w.groupby("date")["dst"].agg(["min", "mean"]).rename(columns={"min":"dst_min", "mean":"dst_mean"}).reset_index()

    gate = pd.merge(kp_daily, dst_daily, on="date", how="outer").sort_values("date")
    gate["quiet"] = (gate["kp_max"] <= KP_QUIET_MAX) & (gate["dst_min"] >= DST_QUIET_MIN)
    gate = gate.dropna(subset=["date"]).reset_index(drop=True)

    kp_valid = kp3_w.dropna(subset=["kp", "time_tag"])
    kp_latest = float(kp_valid["kp"].iloc[-1]) if not kp_valid.empty else float("nan")
    kp_latest_t = kp_valid["time_tag"].iloc[-1].to_pydatetime() if not kp_valid.empty else None
    dst_valid = dst_w.dropna(subset=["dst", "time_tag"])
    dst_latest = float(dst_valid["dst"].iloc[-1]) if not dst_valid.empty else float("nan")
    dst_latest_t = dst_valid["time_tag"].iloc[-1].to_pydatetime() if not dst_valid.empty else None

    print("Kp rows:", len(kp3), "non-null Kp:", int(kp3["kp"].notna().sum()), "kp_col:", kp_col)
    
    # Plot: Kp (3-hour recent)
    plt.figure()
    ax = plt.gca()
    ax.plot(kp3_w["time_tag"], kp3_w["kp"])
    ax.set_title("Planetary Kp (3-hour) — recent")
    ax.set_xlabel("UTC")
    ax.set_ylabel("Kp")
    write_png(charts / "kp_recent.png")

    # Long-history context for Kp (GFZ daily)
    gfz_kp = load_gfz_kp_daily_since_1932(cache_dir)
    if not gfz_kp.empty:
        gfz_30d = gfz_kp[gfz_kp["date"] >= (now - timedelta(days=30))].copy()
        if not gfz_30d.empty:
            plt.figure(figsize=(10,4))
            ax = plt.gca()
            ax.plot(gfz_30d["date"], gfz_30d["kp_max"], linestyle="-", marker="o")
            ax.plot(gfz_30d["date"], gfz_30d["kp_max"].rolling(7, min_periods=1).mean(), linestyle="-")
            ax.set_title("Kp daily max (GFZ) — last 30 days")
            ax.set_xlabel("UTC date")
            ax.set_ylabel("Kp (daily max)")
            write_png(charts / "kp_30d.png")

        gfz_5y = gfz_kp[gfz_kp["date"] >= (now - timedelta(days=int(365.25*BASELINE_YEARS_KP)))].copy()
        if not gfz_5y.empty:
            plt.figure(figsize=(10,4))
            ax = plt.gca()
            ax.plot(gfz_5y["date"], gfz_5y["kp_max"], linestyle="-")
            ax.plot(gfz_5y["date"], gfz_5y["kp_max"].rolling(27, min_periods=1).mean(), linestyle="-")
            ax.set_title("Kp daily max (GFZ) — last 5 years")
            ax.set_xlabel("UTC date")
            ax.set_ylabel("Kp (daily max)")
            write_png(charts / "kp_5y.png")

    # Plot: Dst recent + 30d
    plt.figure()
    ax = plt.gca()
    ax.plot(dst_w["time_tag"], dst_w["dst"])
    ax.set_title("Kyoto Dst — recent")
    ax.set_xlabel("UTC")
    ax.set_ylabel("Dst (nT)")
    write_png(charts / "dst_recent.png")

    dst_30d = dst[dst["time_tag"] >= (now - timedelta(days=30))].copy()
    if not dst_30d.empty:
        plt.figure(figsize=(10,4))
        ax = plt.gca()
        ax.plot(dst_30d["time_tag"], dst_30d["dst"])
        ax.set_title("Kyoto Dst — last 30 days (or max available)")
        ax.set_xlabel("UTC")
        ax.set_ylabel("Dst (nT)")
        write_png(charts / "dst_30d.png")

    # Gate chart
    plt.figure()
    ax = plt.gca()
    ax.plot(gate["date"], gate["kp_max"], label="daily max Kp")
    ax.plot(gate["date"], gate["dst_min"], label="daily min Dst")
    ax.set_title("Daily Gate Inputs (quiet-day filter)")
    ax.set_xlabel("UTC date")
    ax.legend()
    write_png(charts / "gate_daily_inputs.png")

    daily_gate = pd.Series(gate["quiet"].values, index=pd.to_datetime(gate["date"], utc=True))
    # Gate strip (quiet=1, disturbed=0)
    plt.figure(figsize=(10, 2.2))
    ax = plt.gca()
    ax.plot(gate["date"], gate["quiet"].astype(int), drawstyle="steps-post")
    ax.set_yticks([0, 1])
    ax.set_yticklabels(["disturbed", "quiet"])
    ax.set_title("Gate state (quiet-day eligibility)")
    ax.set_xlabel("UTC date")
    write_png(charts / "gate_state.png")

    # ---------- EOP ----------
    try:
        eop = load_iers_eop_all_csv()
        eop_source = "IERS finals2000A.all.csv"
    except Exception:
        eop = load_iers_eop_daily_json()
        eop_source = "IERS daily JSON"

    eop = eop.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    eop_effective = eop[eop["date"] <= now].copy()
    if eop_effective.empty:
        eop_effective = eop.copy()

    eop_w = eop_effective[eop_effective["date"] >= (now - timedelta(days=EOP_DAYS))].copy()
    eop_baseline = eop_effective[eop_effective["date"] >= (now - timedelta(days=BASELINE_YEARS_EOP*365))].copy()
    eop_baseline = eop_baseline.dropna(subset=["lod_ms", "pm_speed_arcsec_per_day"]).sort_values("date")

    eop_baseline["z_lod"] = robust_zscore(eop_baseline["lod_ms"], window=180)
    eop_baseline["z_pm_speed"] = robust_zscore(eop_baseline["pm_speed_arcsec_per_day"], window=180)
    eop_baseline["eop_composite"] = eop_baseline[["z_lod", "z_pm_speed"]].abs().max(axis=1)

    eop_w = pd.merge(eop_w, eop_baseline[["date","z_lod","z_pm_speed","eop_composite"]], on="date", how="left")

    plt.figure()
    ax = plt.gca()
    ax.plot(eop_w["date"], eop_w["z_lod"], label="z(LOD)")
    ax.plot(eop_w["date"], eop_w["z_pm_speed"], label="z(polar motion speed)")
    shade_disturbed_days(ax, daily_gate, eop_w["date"])
    ax.set_title(f"EOP Robust z-scores (source: {eop_source}) — last {EOP_DAYS} days")
    ax.set_xlabel("UTC date")
    ax.legend()
    write_png(charts / "eop_anomaly_z.png")

    eop_10y = eop_effective[eop_effective["date"] >= (now - timedelta(days=3650))].copy()
    if not eop_10y.empty:
        plt.figure(figsize=(10,4))
        ax = plt.gca()
        ax.plot(eop_10y["date"], eop_10y["lod_ms"])
        shade_disturbed_days(ax, daily_gate, eop_10y["date"])
        ax.set_title("Length of Day (LOD) — last 10 years")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("LOD (ms)")
        write_png(charts / "lod_10y.png")

        plt.figure(figsize=(10,4))
        ax = plt.gca()
        ax.plot(eop_10y["date"], eop_10y["pm_x_arcsec"], label="x pole (arcsec)")
        ax.plot(eop_10y["date"], eop_10y["pm_y_arcsec"], label="y pole (arcsec)")
        ax.set_title("Polar Motion components — last 10 years")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("arcsec")
        ax.legend()
        write_png(charts / "polar_motion_10y.png")

    # ---------- C20 ----------
    c20 = load_c20_tn14()
    plt.figure(figsize=(10,4))
    ax = plt.gca()
    ax.plot(c20["yearfrac"], c20["c20_anom_1e10"])
    ax.set_title("C20 anomaly (TN-14) — full")
    ax.set_xlabel("fractional year")
    ax.set_ylabel("C20 (1e-10)")
    write_png(charts / "c20_level.png")

    c20_baseline = c20.tail(300).copy()
    c20_baseline["c20_z"] = robust_zscore(c20_baseline["c20_anom_1e10"], window=min(180, len(c20_baseline)))
    plt.figure(figsize=(10,4))
    ax = plt.gca()
    ax.plot(c20_baseline["yearfrac"], c20_baseline["c20_z"])
    ax.set_title("C20 robust z-score — recent (tail window)")
    ax.set_xlabel("fractional year")
    ax.set_ylabel("z-score (robust)")
    write_png(charts / "c20_z.png")

    try:
        year_now = now.year + (now.timetuple().tm_yday - 1) / 365.25
        c20_10y = c20[c20["yearfrac"] >= (year_now - 10)].copy()
    except Exception:
        c20_10y = c20.tail(300).copy()

    if not c20_10y.empty:
        plt.figure(figsize=(10,4))
        ax = plt.gca()
        ax.plot(c20_10y["yearfrac"], c20_10y["c20_anom_1e10"])
        ax.set_title("C20 anomaly — last ~10 years")
        ax.set_xlabel("fractional year")
        ax.set_ylabel("C20 (1e-10)")
        write_png(charts / "c20_10y.png")

    # ---------- Magnetometers ----------
    mag_frames = []
    mag_last_sample: Dict[str, datetime] = {}

    for code, label in MAG_STATIONS:
        dfm = load_magnetometer_daily_stats(code, days=MAG_DAYS)
        if dfm.empty:
            continue
        dfm = dfm.dropna(subset=["date", "H_mean"])
        dfm["z_H_mean"] = robust_zscore(dfm["H_mean"], window=min(90, len(dfm)))
        dfm["z_H_std"] = robust_zscore(dfm["H_std"].fillna(method="ffill"), window=min(90, len(dfm)))
        dfm["mag_composite"] = dfm[["z_H_mean","z_H_std"]].abs().max(axis=1)
        dfm["station"] = code
        dfm["label"] = label
        mag_frames.append(dfm)
        mag_last_sample[code] = dfm["date"].max().to_pydatetime()

    if mag_frames:
        mag_all = pd.concat(mag_frames, ignore_index=True)
        pivot = mag_all.pivot_table(index="date", columns="station", values="mag_composite", aggfunc="mean")
        comp = pivot.mean(axis=1).reset_index().rename(columns={0:"mag_composite"})
        comp = comp.sort_values("date").reset_index(drop=True)

        plt.figure(figsize=(10,4))
        ax = plt.gca()
        ax.plot(comp["date"], comp["mag_composite"])
        shade_disturbed_days(ax, daily_gate, comp["date"])
        ax.set_title("MAG composite (quiet-days shaded) — last 90 days")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("composite score (unitless)")
        write_png(charts / "mag_composite.png")

        plt.figure(figsize=(10,4))
        ax = plt.gca()
        for code, _label in MAG_STATIONS:
            s = mag_all[mag_all["station"] == code].sort_values("date")
            if not s.empty:
                ax.plot(s["date"], s["z_H_mean"], label=f"{code} z(H_mean)")
        shade_disturbed_days(ax, daily_gate, mag_all["date"])
        ax.set_title("MAG residual z-scores (H_mean) — last 90 days")
        ax.set_xlabel("UTC date")
        ax.legend(loc="upper right", fontsize=8)
        write_png(charts / "mag_anomaly_z.png")

    else:
        comp = pd.DataFrame(columns=["date","mag_composite"])

    # ---------- Merge + Coherence ----------
    if (not comp.empty) and (not eop_w.empty):
        comp2 = comp.copy()
        comp2["date"] = pd.to_datetime(comp2["date"], utc=True)

        eop2 = eop_w.copy()
        eop2["date"] = pd.to_datetime(eop2["date"], utc=True)

        merged = pd.merge(comp2, eop2[["date","eop_composite"]], on="date", how="inner")
        merged = merged[merged["date"] >= (now - timedelta(days=90))].copy()

        merged["quiet"] = merged["date"].map(lambda d: bool(daily_gate.reindex([d]).fillna(False).iloc[0]))
        q = merged[merged["quiet"]].dropna(subset=["mag_composite","eop_composite"])
        corr_quiet = float(q["mag_composite"].corr(q["eop_composite"])) if len(q) >= 10 else float("nan")
    else:
        merged = pd.DataFrame()
        corr_quiet = float("nan")

    # Composite plot (EOP + MAG)
    plt.figure()
    ax = plt.gca()
    if (not comp.empty) and (not eop_w.empty):
        merged_all = pd.merge(
            comp.assign(date=pd.to_datetime(comp["date"], utc=True)),
            eop_w.assign(date=pd.to_datetime(eop_w["date"], utc=True))[["date","eop_composite"]],
            on="date",
            how="inner",
        )
        merged_all = merged_all[merged_all["date"] >= (now - timedelta(days=90))].copy()
        ax.plot(merged_all["date"], merged_all["mag_composite"], label="MAG composite")
        ax.plot(merged_all["date"], merged_all["eop_composite"], label="EOP composite")
        shade_disturbed_days(ax, daily_gate, merged_all["date"])
        ax.set_title("Composite Signals (quiet-days shaded) — last 90 days")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("composite score (unitless)")
        ax.legend()
    else:
        ax.set_title("Composite Signals (insufficient data)")
    write_png(charts / "composites_90d.png")
    # Extra composites: all-days vs quiet-days-only (confounds removed)
    try:
        if (not comp.empty) and (not eop_w.empty):
            # Ensure we have a quiet mask per date
            merged_all["quiet"] = merged_all["date"].map(
                lambda d: bool(daily_gate.reindex([d]).fillna(False).iloc[0])
            )

            # Quiet-only view (set disturbed days to NaN so the line breaks)
            merged_quiet = merged_all.copy()
            merged_quiet.loc[~merged_quiet["quiet"], ["mag_composite", "eop_composite"]] = float("nan")

            # Plot: all days (no shading, just the raw composites)
            plt.figure()
            ax = plt.gca()
            ax.plot(merged_all["date"], merged_all["mag_composite"], label="MAG (all days)")
            ax.plot(merged_all["date"], merged_all["eop_composite"], label="EOP (all days)")
            ax.set_title("Composite signals — all days")
            ax.set_xlabel("UTC date")
            ax.set_ylabel("composite score")
            ax.legend()
            write_png(charts / "composites_all_90d.png")

            # Plot: quiet days only
            plt.figure()
            ax = plt.gca()
            ax.plot(merged_quiet["date"], merged_quiet["mag_composite"], label="MAG (quiet only)")
            ax.plot(merged_quiet["date"], merged_quiet["eop_composite"], label="EOP (quiet only)")
            ax.set_title("Composite signals — quiet days only")
            ax.set_xlabel("UTC date")
            ax.set_ylabel("composite score")
            ax.legend()
            write_png(charts / "composites_quiet_90d.png")
    except Exception:
        pass


    # Experimental watch-score series
    try:
        merged_score = merged_all if ("merged_all" in locals() and not merged_all.empty) else merged
        if merged_score is not None and not merged_score.empty:
            m2 = merged_score.copy()
            if "quiet" not in m2.columns:
                m2["quiet"] = m2["date"].map(lambda d: bool(daily_gate.reindex([d]).fillna(False).iloc[0]))
            qbool = m2["quiet"].fillna(False).astype(bool)

            s = (m2.get("mag_composite", pd.Series(index=m2.index)).fillna(0.0) +
                 m2.get("eop_composite", pd.Series(index=m2.index)).fillna(0.0)) / 6.0
            s = s.clip(lower=0.0, upper=1.0)
            m2["watch_score"] = (100.0 * s * qbool.astype(float)).clip(0.0, 100.0)

            plt.figure(figsize=(10,4))
            ax = plt.gca()
            ax.plot(m2["date"], m2["watch_score"], linestyle="-")
            ax.set_title("Watch Score (experimental; quiet-day gated) — last 90 days")
            ax.set_xlabel("UTC date")
            ax.set_ylabel("score (0–100)")
            write_png(charts / "watch_score_90d.png")
    except Exception:
        pass

    # ---------- Summary outputs ----------
    eop_past = eop[eop["date"] <= now]
    eop_last = eop_past["date"].max().to_pydatetime() if not eop_past.empty else None
    eop_last_dt = eop_effective["date"].max().to_pydatetime() if not eop_effective.empty else None
    freshness = {
        "Kp (3h)": human_age(now, kp_latest_t),
        "Dst": human_age(now, dst_latest_t),
        "EOP": human_age(now, eop_last_dt),
        "Magnetometers": ", ".join([f"{k}:{human_age(now, v)}" for k, v in mag_last_sample.items()]) if mag_last_sample else "none",
        "C20": "lagged (solution windows; not daily)",
    }

    gate_today = gate.iloc[-1] if not gate.empty else None
    gate_str = "✅ QUIET (interpretation allowed)" if (gate_today is not None and bool(gate_today["quiet"])) else "⚠️ DISTURBED (suppress internal inference)"

    try:
        eop_latest_comp = float(eop_w["eop_composite"].dropna().iloc[-1]) if (not eop_w.empty and "eop_composite" in eop_w.columns) else float("nan")
    except Exception:
        eop_latest_comp = float("nan")

    try:
        mag_latest_comp = float(comp["mag_composite"].dropna().iloc[-1]) if (not comp.empty and "mag_composite" in comp.columns) else float("nan")
    except Exception:
        mag_latest_comp = float("nan")

    # Data health warnings
    warnings: List[str] = []
    if math.isnan(kp_latest):
        warnings.append("Kp latest missing (NOAA JSON parse/source issue).")
    if math.isnan(dst_latest):
        warnings.append("Dst latest missing (NOAA JSON parse/source issue).")
    if eop_last_dt is None:
        warnings.append("EOP missing.")
    if mag_frames == []:
        warnings.append("Magnetometer feeds missing (station fetch/endpoint issue).")

    # Experimental watch score snapshot (0–100)
    gate_quiet = bool(gate_today["quiet"]) if gate_today is not None and "quiet" in gate_today else False
    base = 0.0
    if gate_quiet:
        e_sig = min(1.0, (0.0 if math.isnan(eop_latest_comp) else abs(eop_latest_comp)) / 3.0)
        m_sig = min(1.0, (0.0 if math.isnan(mag_latest_comp) else abs(mag_latest_comp)) / 3.0)
        base = 100.0 * (0.6 * e_sig + 0.4 * m_sig)
    watch_score = float(max(0.0, min(100.0, base)))

    badge = "GRAY (disturbed gate)" if not gate_quiet else ("GREEN" if watch_score < 35 else ("YELLOW" if watch_score < 65 else "ORANGE"))
    corr_str = "n/a" if (corr_quiet is None or math.isnan(corr_quiet)) else f"{corr_quiet:.2f}"

    summary_json = {
        "updated_utc": now.isoformat(),
        "gate_today_quiet": gate_quiet,
        "kp_latest_3h": kp_latest,
        "dst_latest": dst_latest,
        "kp_daily_source": "GFZ (Kp_ap_Ap_SN_F107_since_1932.txt)",
        "eop_source": eop_source,
        "corr_quiet_mag_vs_eop_90d": corr_quiet,
        "watch_score_experimental": watch_score,
        "badge": badge,
        "freshness": freshness,
        "warnings": warnings,
        "alarm_logic": "DISABLED — analysis only; no alerting",
    }
    (assets / "summary.json").write_text(json.dumps(summary_json, indent=2), encoding="utf-8")

    # Heading-free markdown (prevents Quarto TOC pollution)
    md: List[str] = []
    md.append(f"**Last update (UTC):** {now.strftime('%Y-%m-%d %H:%M')}  \n")
    md.append(f"**Gate status:** {gate_str}  \n")
    md.append(f"**Experimental watch score:** {watch_score:.0f}/100 — **{badge}**  \n")
    md.append(f"**Quiet-day MAG↔EOP coherence (90d corr):** {corr_str}  \n")
    md.append("")
    md.append("**Latest (recent):**")
    md.append(f"- Kp (3h): {kp_latest:.2f}" if not math.isnan(kp_latest) else "- Kp (3h): n/a")
    md.append(f"- Dst: {dst_latest:.0f} nT" if not math.isnan(dst_latest) else "- Dst: n/a")
    md.append(f"- EOP composite: {eop_latest_comp:.2f}" if not math.isnan(eop_latest_comp) else "- EOP composite: n/a")
    md.append(f"- MAG composite: {mag_latest_comp:.2f}" if not math.isnan(mag_latest_comp) else "- MAG composite: n/a")
    md.append("")
    md.append("**Data freshness:**")
    for k, v in freshness.items():
        md.append(f"- {k}: {v}")

    if warnings:
        md.append("")
        md.append("**Data health warnings:**")
        for w in warnings:
            md.append(f"- {w}")

    md.append("")
    md.append("**Interpretation discipline:**")
    md.append("- When the gate is *disturbed*, suppress inference (solar driving is a confound).")
    md.append("- This page is *diagnostic*, not an alarm system.")
    (assets / "summary.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"[OK] Updated dashboard assets in: {assets}")

if __name__ == "__main__":
    main()
