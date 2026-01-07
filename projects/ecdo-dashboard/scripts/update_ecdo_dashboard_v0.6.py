
#!/usr/bin/env python3
# scripts/update_ecdo_dashboard.py
# v0.6 — fixes Steps 3–5: USGS magnetometer feed + GSFC SLR C20 long-term file
#
# Outputs (written into ./assets):
#   summary.md, summary.json
#   kp_recent.png, dst_recent.png, gate_daily_inputs.png
#   eop_anomaly_z.png, lod_10y.png, polar_motion_10y.png
#   c20_level.png, c20_z.png, c20_10y.png
#   mag_anomaly_z.png, mag_composite.png
#   composites_90d.png, watch_score_90d.png

import io
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# -------------------------
# Config
# -------------------------
TIMEOUT_S = 20

# Dashboard windows
SPACE_DAYS = 45          # gate window for quiet-day logic
EOP_DAYS = 180           # EOP anomaly window (plot)
MAG_DAYS = 90            # magnetometer window (plot + composites)
BASELINE_YEARS_EOP = 10  # EOP baseline for z-scores
BASELINE_YEARS_KP = 5    # long baseline context (GFZ daily Kp max)

# Quiet-day gate thresholds (ethics: suppress inference when solar is driving the magnetosphere)
KP_QUIET_MAX = 4.0       # daily max Kp <= 4 => "quiet enough"
DST_QUIET_MIN = -50.0    # daily min Dst >= -50 => "quiet enough"

# Magnetometers: use USGS Geomagnetism web service (stable, easy JSON)
# Choose stations USGS actually serves (you can expand later).
MAG_STATIONS = [
    ("BOU", "Boulder (USGS)"),
    ("FRD", "Fredericksburg (USGS)"),
    ("BRW", "Barrow/Utqiaġvik (USGS)"),
    ("HON", "Honolulu (USGS)"),
]
MAG_SAMPLING_S = 60      # USGS allows 1, 60, 3600 only (use 60 for 1‑minute)
MAG_TYPE = "variation"  # real-time magnetic variation feed

# -------------------------
# URLs
# -------------------------
SWPC_KP_3H = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
SWPC_DST = "https://services.swpc.noaa.gov/products/kyoto-dst.json"

# IERS long-history EOP (CSV; semicolon-delimited)
IERS_EOP_ALL_CSV = "https://datacenter.iers.org/data/csv/finals2000A.all.csv"
# IERS daily JSON (fallback)
IERS_EOP_DAILY_JSON = "https://datacenter.iers.org/products/eop/rapid/daily/json/finals2000A.daily.json"

# GFZ long-history daily Kp/Ap (since 1932; daily lines with 8 Kp values/day)
GFZ_KP_DAILY_SINCE_1932 = "https://kp.gfz.de/app/files/Kp_ap_Ap_SN_F107_since_1932.txt"

# C20 (GSFC SLR) long-term file (has year-fraction + C20 anomaly columns)
# Source page: NASA/GSFC (SLR time-variable gravity)
GSFC_C20_LONG_TERM = "https://earth.gsfc.nasa.gov/sites/default/files/geo/gsfc_slr_c20_long_term.txt"

# USGS geomag web service
USGS_GEOMAG_WS = "https://geomag.usgs.gov/ws/data/"

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

def fetch_text_cached(url: str, cache_path: Path, max_age_hours: float = 24.0, timeout_s: int = 60) -> str:
    """Fetch text with a simple on-disk cache. Falls back to cache if network fails."""
    try:
        if cache_path.exists():
            mtime = datetime.fromtimestamp(cache_path.stat().st_mtime, tz=timezone.utc)
            age_h = (utcnow() - mtime).total_seconds() / 3600.0
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

def fetch_json(url: str, timeout_s: int = TIMEOUT_S) -> Any:
    r = requests.get(url, timeout=timeout_s)
    r.raise_for_status()
    return r.json()

def df_from_header_row_table(data: Any) -> pd.DataFrame:
    """NOAA SWPC 'products' JSON often comes as [header_row, row1, row2, ...]."""
    if not isinstance(data, list) or len(data) < 2:
        return pd.DataFrame()
    header = data[0]
    rows = data[1:]
    if not isinstance(header, list):
        return pd.DataFrame()
    return pd.DataFrame(rows, columns=header)

def robust_zscore(series: pd.Series, window: int = 180) -> pd.Series:
    """Rolling robust z-score using median and MAD."""
    x = pd.to_numeric(series, errors="coerce").astype(float)
    med = x.rolling(window, min_periods=max(20, window // 10)).median()
    mad = (x - med).abs().rolling(window, min_periods=max(20, window // 10)).median()
    denom = 1.4826 * mad.replace(0, float("nan"))
    return (x - med) / denom

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

def shade_disturbed_days(ax, daily_gate: pd.Series, dates: pd.Series) -> None:
    """Shade non-quiet days to make confounds visually obvious."""
    if daily_gate is None or daily_gate.empty:
        return
    if dates is None or len(dates) == 0:
        return
    ds = pd.to_datetime(dates, utc=True)
    d0 = ds.min().floor("D")
    d1 = ds.max().ceil("D")
    days = pd.date_range(d0, d1, freq="D", tz="UTC")
    gate = daily_gate.reindex(days).fillna(False)
    for day, is_quiet in gate.items():
        if not bool(is_quiet):
            ax.axvspan(day, day + pd.Timedelta(days=1), alpha=0.10)

# -------------------------
# Loaders
# -------------------------
def load_iers_eop_daily_json() -> pd.DataFrame:
    data = fetch_json(IERS_EOP_DAILY_JSON, timeout_s=60)
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
    text = fetch_text(IERS_EOP_ALL_CSV, timeout_s=120)
    df = pd.read_csv(io.StringIO(text), sep=";", engine="python")
    df.columns = [c.strip() for c in df.columns]

    # Required columns
    for name in ["Year", "Month", "Day", "x_pole", "y_pole", "LOD"]:
        if name not in df.columns:
            raise ValueError(f"IERS CSV missing column '{name}'")

    out = pd.DataFrame({
        "date": pd.to_datetime(dict(year=df["Year"], month=df["Month"], day=df["Day"]), utc=True, errors="coerce"),
        "pm_x_arcsec": pd.to_numeric(df["x_pole"], errors="coerce"),
        "pm_y_arcsec": pd.to_numeric(df["y_pole"], errors="coerce"),
        "lod_ms": pd.to_numeric(df["LOD"], errors="coerce"),
        "ut1_utc_s": pd.to_numeric(df["UT1-UTC"], errors="coerce") if "UT1-UTC" in df.columns else float("nan"),
    })
    out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    out["pm_r_arcsec"] = (out["pm_x_arcsec"] ** 2 + out["pm_y_arcsec"] ** 2).pow(0.5)
    out["pm_speed_arcsec_per_day"] = out["pm_r_arcsec"].diff().abs()
    return out

def load_gfz_kp_daily_since_1932(cache_dir: Path) -> pd.DataFrame:
    """Load daily Kp (8 values/day) + Ap from GFZ (updated daily)."""
    cache_path = cache_dir / "gfz_kp_daily_since_1932.txt"
    text = fetch_text_cached(GFZ_KP_DAILY_SINCE_1932, cache_path, max_age_hours=24.0, timeout_s=120)

    rows: List[Dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        # GFZ format has lots of columns; we only need:
        # year month day ... 8*Kp ... ... Ap
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
    return df.sort_values("date").reset_index(drop=True) if not df.empty else df

def load_c20_gsfc_long_term() -> pd.DataFrame:
    """GSFC SLR C20 long-term file.

    Columns documented in-file (paraphrased):
      yearfrac, C20_TSVD, C20_anom_TSVD(1e-10), sigma_TSVD(1e-10),
      C20_TSVDMM, C20_anom_TSVDMM(1e-10), sigma_TSVDMM(1e-10), AOD
    """
    text = fetch_text(GSFC_C20_LONG_TERM, timeout_s=120)
    rows: List[Dict[str, Any]] = []

    for ln in text.splitlines():
        ln = ln.strip()
        if not ln:
            continue
        # data lines start with a year-fraction like 1976.243836
        if not (ln[0].isdigit() or ln[0] == "-"):
            continue
        parts = ln.split()
        if len(parts) < 8:
            continue
        try:
            yearfrac = float(parts[0])
            c20_anom_mm = float(parts[5])  # TSVDMM anomaly in 1e-10 (this is what we plot)
            sigma_mm = float(parts[6])
        except Exception:
            continue
        rows.append({
            "yearfrac": yearfrac,
            "c20_anom_1e10": c20_anom_mm,
            "c20_sigma_1e10": sigma_mm,
        })

    df = pd.DataFrame(rows)
    return df.sort_values("yearfrac").reset_index(drop=True) if not df.empty else df

def load_usgs_mag_timeseries_H(station: str, start: datetime, end: datetime) -> pd.DataFrame:
    """Fetch H component from USGS geomag web service via IAGA2002 text.

    Important: even when requesting elements=H, the IAGA2002 response can include extra
    NUL columns (e.g., BOUNUL). We MUST select the correct <STATION>H column (e.g., BOUH),
    not the last column.
    """
    start_s = start.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_s = end.strftime("%Y-%m-%dT%H:%M:%SZ")
    url = (
        f"{USGS_GEOMAG_WS}?"
        f"id={station}"
        f"&elements=H"
        f"&sampling_period={MAG_SAMPLING_S}"
        f"&type={MAG_TYPE}"
        f"&starttime={start_s}"
        f"&endtime={end_s}"
        f"&format=iaga2002"
    )

    try:
        raw = fetch_text(url, timeout_s=120)
    except Exception:
        return pd.DataFrame()

    lines = raw.splitlines()

    # Find the header line that starts the data table
    header_idx = None
    header_tokens = None
    for i, ln in enumerate(lines):
        s = ln.strip()
        if s.startswith("DATE") and "TIME" in s and "DOY" in s:
            header_idx = i
            header_tokens = s.replace("|", "").split()
            break

    if header_idx is None or not header_tokens:
        return pd.DataFrame()

    # Choose the correct value column:
    # Prefer exact <STATION>H (e.g., BOUH). Fallback to any token ending in 'H'.
    target = f"{station}H"
    if target in header_tokens:
        val_idx = header_tokens.index(target)
    else:
        val_idx = None
        for j, tok in enumerate(header_tokens):
            if tok.endswith("H"):
                val_idx = j
                break
        if val_idx is None:
            return pd.DataFrame()

    rows = []
    for ln in lines[header_idx + 1 :]:
        s = ln.strip()
        if not s or s.startswith("#"):
            continue

        parts = s.replace("|", "").split()
        # Expect at least: DATE TIME DOY <VAL> ...
        if len(parts) <= val_idx:
            continue

        date_str, time_str = parts[0], parts[1]
        ts = pd.to_datetime(f"{date_str}T{time_str}", utc=True, errors="coerce")
        if pd.isna(ts):
            continue

        try:
            v = float(parts[val_idx])
        except Exception:
            continue

        # Missing value code commonly 99999 / 99999.00
        if v >= 90000:
            continue

        rows.append({"time": ts, "H": v})

    df = pd.DataFrame(rows)
    if df.empty:
        return df

    df = df.dropna(subset=["time"]).sort_values("time").reset_index(drop=True)
    return df

def load_magnetometer_daily_stats_usgs(station: str, days: int) -> pd.DataFrame:
    """Daily mean/std of H from USGS feed."""
    end = utcnow()
    start = end - timedelta(days=days)
    ts = load_usgs_mag_timeseries_H(station, start=start, end=end)
    if ts.empty:
        return ts
    ts["date"] = ts["time"].dt.floor("D")
    g = ts.groupby("date")["H"]
    out = g.agg(H_mean="mean", H_std="std").reset_index()
    return out.sort_values("date").reset_index(drop=True)

# -------------------------
# Main
# -------------------------
def main() -> None:
    now = utcnow()

    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    assets = root_dir / "assets"
    ensure_dir(assets)
    cache_dir = assets / "cache"
    ensure_dir(cache_dir)

    # ---------- Step 1: Space weather gate (recent 3-hour Kp + Dst) ----------
    kp3 = df_from_header_row_table(fetch_json(SWPC_KP_3H))
    dst = df_from_header_row_table(fetch_json(SWPC_DST))

    if not kp3.empty:
        kp3["time_tag"] = pd.to_datetime(kp3.get("time_tag"), utc=True, errors="coerce")
        kp_col = next((c for c in ["kp_index", "Kp", "kp"] if c in kp3.columns), None)
        kp3["kp"] = pd.to_numeric(kp3[kp_col], errors="coerce") if kp_col else pd.Series(dtype=float)
        kp3 = kp3.dropna(subset=["time_tag", "kp"]).sort_values("time_tag")
    else:
        kp3 = pd.DataFrame(columns=["time_tag", "kp"])

    if not dst.empty:
        dst["time_tag"] = pd.to_datetime(dst.get("time_tag"), utc=True, errors="coerce")
        dst_col = next((c for c in ["dst", "Dst"] if c in dst.columns), None)
        dst["dst"] = pd.to_numeric(dst[dst_col], errors="coerce") if dst_col else pd.Series(dtype=float)
        dst = dst.dropna(subset=["time_tag", "dst"]).sort_values("time_tag")
    else:
        dst = pd.DataFrame(columns=["time_tag", "dst"])

    kp3_w = kp3[kp3["time_tag"] >= (now - timedelta(days=SPACE_DAYS))].copy()
    dst_w = dst[dst["time_tag"] >= (now - timedelta(days=SPACE_DAYS))].copy()

    # daily gate inputs
    kp3_w["date"] = kp3_w["time_tag"].dt.floor("D")
    dst_w["date"] = dst_w["time_tag"].dt.floor("D")

    kp_daily = kp3_w.groupby("date")["kp"].agg(["max", "mean"]).rename(columns={"max": "kp_max", "mean": "kp_mean"}).reset_index()
    dst_daily = dst_w.groupby("date")["dst"].agg(["min", "mean"]).rename(columns={"min": "dst_min", "mean": "dst_mean"}).reset_index()

    gate = pd.merge(kp_daily, dst_daily, on="date", how="outer").sort_values("date")
    gate["quiet"] = (gate["kp_max"] <= KP_QUIET_MAX) & (gate["dst_min"] >= DST_QUIET_MIN)
    gate = gate.dropna(subset=["date"]).reset_index(drop=True)
    daily_gate = pd.Series(gate["quiet"].values, index=pd.to_datetime(gate["date"], utc=True)) if not gate.empty else pd.Series(dtype=bool)

    # latest values for summary
    kp_latest = float(kp3_w["kp"].iloc[-1]) if not kp3_w.empty else float("nan")
    kp_latest_t = kp3_w["time_tag"].iloc[-1].to_pydatetime() if not kp3_w.empty else None
    dst_latest = float(dst_w["dst"].iloc[-1]) if not dst_w.empty else float("nan")
    dst_latest_t = dst_w["time_tag"].iloc[-1].to_pydatetime() if not dst_w.empty else None

    # Plot: Kp (3-hour recent)
    plt.figure(figsize=(10, 4))
    ax = plt.gca()
    if not kp3_w.empty:
        ax.plot(kp3_w["time_tag"], kp3_w["kp"])
    ax.set_title("Planetary Kp (3-hour) — recent")
    ax.set_xlabel("UTC")
    ax.set_ylabel("Kp")
    write_png(assets / "kp_recent.png")

    # Plot: Dst recent
    plt.figure(figsize=(10, 4))
    ax = plt.gca()
    if not dst_w.empty:
        ax.plot(dst_w["time_tag"], dst_w["dst"])
    ax.set_title("Kyoto Dst — recent")
    ax.set_xlabel("UTC")
    ax.set_ylabel("Dst (nT)")
    write_png(assets / "dst_recent.png")

    # Gate chart
    plt.figure(figsize=(10, 4))
    ax = plt.gca()
    if not gate.empty:
        ax.plot(gate["date"], gate["kp_max"], label="daily max Kp")
        ax.plot(gate["date"], gate["dst_min"], label="daily min Dst")
        ax.legend()
    ax.set_title("Daily Gate Inputs (quiet-day filter)")
    ax.set_xlabel("UTC date")
    write_png(assets / "gate_daily_inputs.png")

    # Optional long-history context for Kp (GFZ daily)
    try:
        gfz_kp = load_gfz_kp_daily_since_1932(cache_dir)
        gfz_5y = gfz_kp[gfz_kp["date"] >= (now - timedelta(days=int(365.25 * BASELINE_YEARS_KP)))].copy()
        if not gfz_5y.empty:
            plt.figure(figsize=(10, 4))
            ax = plt.gca()
            ax.plot(gfz_5y["date"], gfz_5y["kp_max"], linestyle="-")
            ax.plot(gfz_5y["date"], gfz_5y["kp_max"].rolling(27, min_periods=1).mean(), linestyle="-")
            ax.set_title(f"Kp daily max (GFZ) — last {BASELINE_YEARS_KP} years")
            ax.set_xlabel("UTC date")
            ax.set_ylabel("Kp (daily max)")
            write_png(assets / "kp_5y.png")
    except Exception:
        pass

    # ---------- Step 2: Earth rotation / orientation (EOP) ----------
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
    eop_baseline = eop_effective[eop_effective["date"] >= (now - timedelta(days=int(BASELINE_YEARS_EOP * 365.25)))].copy()
    eop_baseline = eop_baseline.dropna(subset=["lod_ms", "pm_speed_arcsec_per_day"]).sort_values("date")

    eop_baseline["z_lod"] = robust_zscore(eop_baseline["lod_ms"], window=180)
    eop_baseline["z_pm_speed"] = robust_zscore(eop_baseline["pm_speed_arcsec_per_day"], window=180)
    eop_baseline["eop_composite"] = eop_baseline[["z_lod", "z_pm_speed"]].abs().max(axis=1)

    eop_w = pd.merge(eop_w, eop_baseline[["date", "z_lod", "z_pm_speed", "eop_composite"]], on="date", how="left")

    plt.figure(figsize=(10, 4))
    ax = plt.gca()
    ax.plot(eop_w["date"], eop_w["z_lod"], label="z(LOD)")
    ax.plot(eop_w["date"], eop_w["z_pm_speed"], label="z(polar motion speed)")
    shade_disturbed_days(ax, daily_gate, eop_w["date"])
    ax.set_title(f"EOP robust z-scores (source: {eop_source}) — last {EOP_DAYS} days")
    ax.set_xlabel("UTC date")
    ax.legend()
    write_png(assets / "eop_anomaly_z.png")

    # long baseline plots
    eop_10y = eop_effective[eop_effective["date"] >= (now - timedelta(days=3650))].copy()
    if not eop_10y.empty:
        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        ax.plot(eop_10y["date"], eop_10y["lod_ms"])
        shade_disturbed_days(ax, daily_gate, eop_10y["date"])
        ax.set_title("Length of Day (LOD) — last 10 years")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("LOD (ms)")
        write_png(assets / "lod_10y.png")

        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        ax.plot(eop_10y["date"], eop_10y["pm_x_arcsec"], label="x pole (arcsec)")
        ax.plot(eop_10y["date"], eop_10y["pm_y_arcsec"], label="y pole (arcsec)")
        ax.set_title("Polar Motion components — last 10 years")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("arcsec")
        ax.legend()
        write_png(assets / "polar_motion_10y.png")

    # ---------- Step 3: Mass distribution proxy (C20 — lagged) ----------
    c20 = load_c20_gsfc_long_term()
    if c20.empty:
        # write blank charts with explanatory titles
        for fn, title in [
            ("c20_level.png", "C20 anomaly (GSFC SLR) — NO DATA (source down/format changed)"),
            ("c20_z.png", "C20 robust z-score — NO DATA"),
            ("c20_10y.png", "C20 anomaly — last ~10 years — NO DATA"),
        ]:
            plt.figure(figsize=(10, 4))
            ax = plt.gca()
            ax.set_title(title)
            ax.text(0.02, 0.20, "NO DATA", transform=ax.transAxes, fontsize=14)
            ax.set_axis_off()
            write_png(assets / fn)
    else:
        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        ax.plot(c20["yearfrac"], c20["c20_anom_1e10"])
        ax.set_title("C20 anomaly (GSFC SLR TSVDMM) — full")
        ax.set_xlabel("fractional year")
        ax.set_ylabel("C20 anomaly (1e-10)")
        write_png(assets / "c20_level.png")

        # robust z-score over a long tail window
        tail_n = min(600, len(c20))
        c20_tail = c20.tail(tail_n).copy()
        c20_tail["c20_z"] = robust_zscore(c20_tail["c20_anom_1e10"], window=min(180, max(30, tail_n // 3)))
        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        ax.plot(c20_tail["yearfrac"], c20_tail["c20_z"])
        ax.set_title("C20 robust z-score — recent (tail window)")
        ax.set_xlabel("fractional year")
        ax.set_ylabel("z-score (robust)")
        write_png(assets / "c20_z.png")

        year_now = now.year + (now.timetuple().tm_yday - 1) / 365.25
        c20_10y = c20[c20["yearfrac"] >= (year_now - 10)].copy()
        if not c20_10y.empty:
            plt.figure(figsize=(10, 4))
            ax = plt.gca()
            ax.plot(c20_10y["yearfrac"], c20_10y["c20_anom_1e10"])
            ax.set_title("C20 anomaly — last ~10 years")
            ax.set_xlabel("fractional year")
            ax.set_ylabel("C20 anomaly (1e-10)")
            write_png(assets / "c20_10y.png")

    # ---------- Step 4: Ground magnetic field residuals (multi-station) ----------
    mag_frames: List[pd.DataFrame] = []
    mag_last_sample: Dict[str, datetime] = {}

    for code, label in MAG_STATIONS:
        try:
            dfm = load_magnetometer_daily_stats_usgs(code, days=MAG_DAYS)
        except Exception:
            dfm = pd.DataFrame()

        if dfm.empty:
            continue

        dfm = dfm.dropna(subset=["date", "H_mean"]).sort_values("date").reset_index(drop=True)
        dfm["z_H_mean"] = robust_zscore(dfm["H_mean"], window=min(90, max(30, len(dfm))))
        dfm["z_H_std"] = robust_zscore(dfm["H_std"].fillna(method="ffill"), window=min(90, max(30, len(dfm))))
        dfm["mag_composite"] = dfm[["z_H_mean", "z_H_std"]].abs().max(axis=1)

        dfm["station"] = code
        dfm["label"] = label
        mag_frames.append(dfm)

        mag_last_sample[code] = dfm["date"].max().to_pydatetime()

    if mag_frames:
        mag_all = pd.concat(mag_frames, ignore_index=True)
        pivot = mag_all.pivot_table(index="date", columns="station", values="mag_composite", aggfunc="mean")
        comp = pivot.mean(axis=1).reset_index().rename(columns={0: "mag_composite"})
        comp = comp.sort_values("date").reset_index(drop=True)

        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        ax.plot(comp["date"], comp["mag_composite"])
        shade_disturbed_days(ax, daily_gate, comp["date"])
        ax.set_title("MAG composite (quiet-days shaded) — last 90 days")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("composite score (unitless)")
        write_png(assets / "mag_composite.png")

        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        for code, _label in MAG_STATIONS:
            s = mag_all[mag_all["station"] == code].sort_values("date")
            if not s.empty:
                ax.plot(s["date"], s["z_H_mean"], label=f"{code} z(H_mean)")
        shade_disturbed_days(ax, daily_gate, mag_all["date"])
        ax.set_title("MAG residual z-scores (H_mean) — last 90 days")
        ax.set_xlabel("UTC date")
        ax.legend(loc="upper right", fontsize=8)
        write_png(assets / "mag_anomaly_z.png")
    else:
        mag_all = pd.DataFrame()
        comp = pd.DataFrame(columns=["date", "mag_composite"])

        # still emit placeholder images so the page doesn't look broken
        for fn, title in [
            ("mag_composite.png", "MAG composite — NO DATA (mag feeds missing)"),
            ("mag_anomaly_z.png", "MAG residual z-scores — NO DATA (mag feeds missing)"),
        ]:
            plt.figure(figsize=(10, 4))
            ax = plt.gca()
            ax.set_title(title)
            ax.text(0.02, 0.20, "NO DATA", transform=ax.transAxes, fontsize=14)
            ax.set_axis_off()
            write_png(assets / fn)

    # ---------- Step 5: Cross-channel coherence + watch score ----------
    corr_quiet = float("nan")
    merged_all = pd.DataFrame()

    if (not comp.empty) and (not eop_w.empty):
        merged_all = pd.merge(
            comp.assign(date=pd.to_datetime(comp["date"], utc=True)),
            eop_w.assign(date=pd.to_datetime(eop_w["date"], utc=True))[["date", "eop_composite"]],
            on="date",
            how="inner",
        )
        merged_all = merged_all[merged_all["date"] >= (now - timedelta(days=90))].copy()

        if not merged_all.empty and not daily_gate.empty:
            merged_all["quiet"] = merged_all["date"].map(lambda d: bool(daily_gate.reindex([d]).fillna(False).iloc[0]))
            q = merged_all[merged_all["quiet"]].dropna(subset=["mag_composite", "eop_composite"])
            corr_quiet = float(q["mag_composite"].corr(q["eop_composite"])) if len(q) >= 10 else float("nan")

        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        ax.plot(merged_all["date"], merged_all["mag_composite"], label="MAG composite")
        ax.plot(merged_all["date"], merged_all["eop_composite"], label="EOP composite")
        shade_disturbed_days(ax, daily_gate, merged_all["date"])
        ax.set_title("Composite Signals (quiet-days shaded) — last 90 days")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("composite score (unitless)")
        ax.legend()
        write_png(assets / "composites_90d.png")

        # watch-score series (quiet-day gated)
        m2 = merged_all.copy()
        qbool = m2["quiet"].fillna(False).astype(bool) if "quiet" in m2.columns else pd.Series(False, index=m2.index)

        s = (m2["mag_composite"].fillna(0.0) + m2["eop_composite"].fillna(0.0)) / 6.0
        s = s.clip(lower=0.0, upper=1.0)
        m2["watch_score"] = (100.0 * s * qbool.astype(float)).clip(0.0, 100.0)

        plt.figure(figsize=(10, 4))
        ax = plt.gca()
        ax.plot(m2["date"], m2["watch_score"], linestyle="-")
        ax.set_title("Watch Score (experimental; quiet-day gated) — last 90 days")
        ax.set_xlabel("UTC date")
        ax.set_ylabel("score (0–100)")
        write_png(assets / "watch_score_90d.png")

    else:
        # placeholder images when MAG is missing (or EOP missing)
        for fn, title in [
            ("composites_90d.png", "Composite Signals — NO DATA (need MAG + EOP)"),
            ("watch_score_90d.png", "Watch Score — NO DATA (need MAG + EOP)"),
        ]:
            plt.figure(figsize=(10, 4))
            ax = plt.gca()
            ax.set_title(title)
            ax.text(0.02, 0.20, "NO DATA", transform=ax.transAxes, fontsize=14)
            ax.set_axis_off()
            write_png(assets / fn)

    # ---------- Summary outputs ----------
    eop_last_dt = eop_effective["date"].max().to_pydatetime() if not eop_effective.empty else None

    freshness = {
        "Kp (3h)": human_age(now, kp_latest_t),
        "Dst": human_age(now, dst_latest_t),
        "EOP": human_age(now, eop_last_dt),
        "Magnetometers": ", ".join([f"{k}:{human_age(now, v)}" for k, v in mag_last_sample.items()]) if mag_last_sample else "none",
        "C20": "lagged (28-day solutions; not daily)",
    }

    gate_today = gate.iloc[-1] if not gate.empty else None
    gate_quiet = bool(gate_today["quiet"]) if gate_today is not None and "quiet" in gate_today else False

    gate_str = "✅ QUIET (interpretation allowed)" if gate_quiet else "⚠️ DISTURBED (suppress internal inference)"

    # latest composites for snapshot
    try:
        eop_latest_comp = float(eop_w["eop_composite"].dropna().iloc[-1]) if (not eop_w.empty and "eop_composite" in eop_w.columns) else float("nan")
    except Exception:
        eop_latest_comp = float("nan")

    try:
        mag_latest_comp = float(comp["mag_composite"].dropna().iloc[-1]) if (not comp.empty and "mag_composite" in comp.columns) else float("nan")
    except Exception:
        mag_latest_comp = float("nan")

    # Experimental watch-score snapshot (0–100)
    base = 0.0
    if gate_quiet:
        e_sig = min(1.0, (0.0 if math.isnan(eop_latest_comp) else abs(eop_latest_comp)) / 3.0)
        m_sig = min(1.0, (0.0 if math.isnan(mag_latest_comp) else abs(mag_latest_comp)) / 3.0)
        base = 100.0 * (0.6 * e_sig + 0.4 * m_sig)
    watch_score = float(max(0.0, min(100.0, base)))

    badge = "GRAY (disturbed gate)" if not gate_quiet else ("GREEN" if watch_score < 35 else ("YELLOW" if watch_score < 65 else "ORANGE"))
    corr_str = "n/a" if math.isnan(corr_quiet) else f"{corr_quiet:.2f}"

    warnings: List[str] = []
    if math.isnan(kp_latest):
        warnings.append("Kp latest missing (NOAA JSON parse/source issue).")
    if math.isnan(dst_latest):
        warnings.append("Dst latest missing (NOAA JSON parse/source issue).")
    if eop_last_dt is None:
        warnings.append("EOP missing.")
    if not mag_frames:
        warnings.append("Magnetometer feeds missing (USGS parse/station issue).")
    if c20.empty:
        warnings.append("C20 missing (GSFC SLR file fetch/parse issue).")

    summary_json = {
        "updated_utc": now.isoformat(),
        "gate_today_quiet": gate_quiet,
        "kp_latest_3h": kp_latest,
        "dst_latest": dst_latest,
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
    md.append(f"**Last update (UTC):** {now.strftime('%Y-%m-%d %H:%M')}  ")
    md.append(f"**Gate status:** {gate_str}  ")
    md.append(f"**Experimental watch score:** {watch_score:.0f}/100 — **{badge}**  ")
    md.append(f"**Quiet-day MAG↔EOP coherence (90d corr):** {corr_str}  ")
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
