#!/usr/bin/env python3
# scripts/generate_ecdo_watch_data.py
# Generates real geophysics data JSON for ECDO Watch React dashboard
# Fetches from NOAA SWPC, IERS, GFZ, GSFC, and USGS scientific data sources

import io
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
import pandas as pd

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

# Quiet-day gate thresholds
KP_QUIET_MAX = 4.0       # daily max Kp <= 4 => "quiet enough"
DST_QUIET_MIN = -50.0    # daily min Dst >= -50 => "quiet enough"

# Magnetometers
MAG_STATIONS = [
    ("BOU", "Boulder (USGS)"),
    ("FRD", "Fredericksburg (USGS)"),
    ("BRW", "Barrow/Utqiaġvik (USGS)"),
    ("HON", "Honolulu (USGS)"),
]
MAG_SAMPLING_S = 60
MAG_TYPE = "variation"

# -------------------------
# URLs
# -------------------------
SWPC_KP_3H = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
SWPC_DST = "https://services.swpc.noaa.gov/products/kyoto-dst.json"
IERS_EOP_DAILY_JSON = "https://datacenter.iers.org/products/eop/rapid/daily/json/finals2000A.daily.json"
IERS_EOP_ALL_CSV = "https://datacenter.iers.org/data/csv/finals2000A.all.csv"
GFZ_KP_DAILY_SINCE_1932 = "https://kp.gfz.de/app/files/Kp_ap_Ap_SN_F107_since_1932.txt"
GSFC_C20_LONG_TERM = "https://earth.gsfc.nasa.gov/sites/default/files/geo/gsfc_slr_c20_long_term.txt"
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

def robust_zscore(series: pd.Series, window: int = 180) -> pd.Series:
    """Rolling robust z-score using median and MAD."""
    x = pd.to_numeric(series, errors="coerce").astype(float)
    med = x.rolling(window, min_periods=max(20, window // 10)).median()
    mad = (x - med).abs().rolling(window, min_periods=max(20, window // 10)).median()
    denom = 1.4826 * mad.replace(0, float("nan"))
    return (x - med) / denom

# -------------------------
# Data Loaders
# -------------------------
def load_iers_eop_daily_json() -> pd.DataFrame:
    """Load daily EOP from IERS."""
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
    """Load long-history EOP from IERS finals2000A.all.csv."""
    text = fetch_text(IERS_EOP_ALL_CSV, timeout_s=120)
    df = pd.read_csv(io.StringIO(text), sep=";", engine="python")
    df.columns = [c.strip() for c in df.columns]

    for name in ["Year", "Month", "Day", "x_pole", "y_pole", "LOD"]:
        if name not in df.columns:
            raise ValueError(f"IERS CSV missing column '{name}'")

    out = pd.DataFrame({
        "date": pd.to_datetime(dict(year=df["Year"], month=df["Month"], day=df["Day"]), utc=True, errors="coerce"),
        "pm_x_arcsec": pd.to_numeric(df["x_pole"], errors="coerce"),
        "pm_y_arcsec": pd.to_numeric(df["y_pole"], errors="coerce"),
        "lod_ms": pd.to_numeric(df["LOD"], errors="coerce"),
    })
    out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    out["pm_r_arcsec"] = (out["pm_x_arcsec"] ** 2 + out["pm_y_arcsec"] ** 2).pow(0.5)
    return out

def load_gfz_kp_daily_since_1932(cache_dir: Path) -> pd.DataFrame:
    """Load daily Kp from GFZ (updated daily)."""
    cache_path = cache_dir / "gfz_kp_daily_since_1932.txt"
    text = fetch_text_cached(GFZ_KP_DAILY_SINCE_1932, cache_path, max_age_hours=24.0, timeout_s=120)

    rows: List[Dict[str, Any]] = []
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
    return df.sort_values("date").reset_index(drop=True) if not df.empty else df

def load_swpc_kp_dst() -> tuple:
    """Load recent Kp and Dst from NOAA SWPC."""
    try:
        kp_data = fetch_json(SWPC_KP_3H, timeout_s=30)
        dst_data = fetch_json(SWPC_DST, timeout_s=30)
    except Exception:
        return None, None

    return kp_data, dst_data

def load_usgs_mag_timeseries_H(station: str, start: datetime, end: datetime) -> pd.DataFrame:
    """Fetch H component from USGS geomag web service."""
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

    # Find header
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

    # Find correct column
    target = f"{station}H"
    val_idx = None
    if target in header_tokens:
        val_idx = header_tokens.index(target)
    else:
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

        if pd.isna(v) or v > 1e5:
            continue

        rows.append({"timestamp": ts, "value": v})

    df = pd.DataFrame(rows)
    return df.sort_values("timestamp").reset_index(drop=True) if not df.empty else df

# -------------------------
# Main Script
# -------------------------
def main():
    script_dir = Path(__file__).parent
    assets_dir = script_dir.parent / "assets"
    cache_dir = assets_dir / "cache"
    ensure_dir(assets_dir)
    ensure_dir(cache_dir)

    now = utcnow()

    print(f"[{now.isoformat()}] Generating ECDO Watch data...")

    # Load data
    print("  Fetching EOP...")
    eop_daily = load_iers_eop_daily_json()
    eop_all = load_iers_eop_all_csv()

    print("  Fetching Kp history...")
    kp_history = load_gfz_kp_daily_since_1932(cache_dir)

    print("  Fetching recent Kp/Dst...")
    kp_dst = load_swpc_kp_dst()

    # Generate JSON for React app

    # 1. Recent Kp data (last 14 days)
    if not kp_history.empty:
        kp_recent = kp_history.tail(14).copy()
        kp_json = {
            "labels": kp_recent["date"].dt.strftime("%b %d").tolist(),
            "data": kp_recent["kp_max"].fillna(0).tolist()
        }
        (assets_dir / "kp_data.json").write_text(json.dumps(kp_json))
        print("    ✓ kp_data.json")

    # 2. LOD data (last 90 days)
    if not eop_daily.empty:
        eop_recent = eop_daily.tail(90).copy()
        lod_json = {
            "labels": eop_recent["date"].dt.strftime("%Y-%m-%d").tolist(),
            "data": eop_recent["lod_ms"].fillna(0).tolist()
        }
        (assets_dir / "lod_data.json").write_text(json.dumps(lod_json))
        print("    ✓ lod_data.json")

    # 3. Historical AA index (last 50 years)
    if not kp_history.empty:
        kp_annual = kp_history.set_index("date").resample("Y")["kp_max"].mean()
        end_year = kp_annual.index[-1].year
        start_year = end_year - 50
        aa_subset = kp_annual[str(start_year):str(end_year)]
        aa_json = {
            "labels": [str(year) for year in aa_subset.index.year],
            "data": aa_subset.fillna(0).tolist()
        }
        (assets_dir / "historical_aa.json").write_text(json.dumps(aa_json))
        print("    ✓ historical_aa.json")

    # 4. Historical PM (last 50 years)
    if not eop_all.empty:
        eop_annual = eop_all.set_index("date").resample("Y")["pm_r_arcsec"].mean()
        end_year = eop_annual.index[-1].year
        start_year = end_year - 50
        pm_subset = eop_annual[str(start_year):str(end_year)]
        pm_json = {
            "labels": [str(year) for year in pm_subset.index.year],
            "data": pm_subset.fillna(0).tolist()
        }
        (assets_dir / "historical_pm.json").write_text(json.dumps(pm_json))
        print("    ✓ historical_pm.json")

    # 5. Magnetometer data (last 60 days)
    print("  Fetching magnetometer data...")
    end_time = now
    start_time = end_time - timedelta(days=60)

    mag_data_by_station = {}
    for station, label in MAG_STATIONS:
        try:
            df = load_usgs_mag_timeseries_H(station, start_time, end_time)
            if not df.empty:
                # Daily aggregation
                daily = df.set_index("timestamp").resample("D")["value"].mean()
                mag_data_by_station[station] = daily.fillna(0).tolist()
        except Exception as e:
            print(f"    Warning: {station} failed: {e}")

    if mag_data_by_station:
        mag_json = {
            "labels": [str(d.date()) for d in pd.date_range(start_time.date(), end_time.date(), freq="D")],
            "bou": mag_data_by_station.get("BOU", []),
            "hon": mag_data_by_station.get("HON", []),
            "sjg": mag_data_by_station.get("BRW", []),  # Use BRW as sjg for now
            "composite": [sum(vals) / len([v for v in vals if v]) for vals in zip(*mag_data_by_station.values())]
        }
        (assets_dir / "mag_data.json").write_text(json.dumps(mag_json))
        print("    ✓ mag_data.json")

    print(f"[{utcnow().isoformat()}] Complete!")

if __name__ == "__main__":
    main()
