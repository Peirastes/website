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
import numpy as np

# -------------------------
# Config
# -------------------------
TIMEOUT_S = 20

# Dashboard windows
SPACE_DAYS = 45          # gate window for quiet-day logic
EOP_DAYS = 180           # EOP anomaly window (plot)
MAG_DAYS = 90            # magnetometer window (plot + composites) - USGS API limited to ~60-90 days
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
WDC_MAGNETOMETER = "https://www.ngdc.noaa.gov/products/data-access-system/data/datasets/earth-magnetic-field/"

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

def load_usgs_mag_timeseries_H_chunked(station: str, start: datetime, end: datetime, chunk_days: int = 90) -> pd.DataFrame:
    """Fetch magnetometer data in chunks to work around API limitations."""
    all_data = []
    current_end = end

    while current_end > start:
        chunk_start = max(start, current_end - timedelta(days=chunk_days))
        try:
            df = load_usgs_mag_timeseries_H(station, chunk_start, current_end)
            if not df.empty:
                all_data.append(df)
        except Exception as e:
            print(f"      Chunk {chunk_start.date()} to {current_end.date()} failed: {e}")

        current_end = chunk_start
        if current_end <= start:
            break

    if all_data:
        combined = pd.concat(all_data, ignore_index=True).drop_duplicates(subset=['timestamp']).sort_values('timestamp')
        return combined.reset_index(drop=True)
    else:
        return pd.DataFrame()

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
def generate_time_range_datasets(kp_history, eop_all, mag_data_by_station, now, lod_json=None, mag_json=None):
    """Generate JSON files for multiple time ranges."""
    time_ranges = {
        "30d": 30,
        "90d": 90,
        "1y": 365,
        "5y": 365 * 5,
        "10y": 365 * 10,
    }

    results = {}

    for range_name, days in time_ranges.items():
        cutoff = now - timedelta(days=days)

        # Kp data (filter by date range, not beyond "now")
        if not kp_history.empty:
            kp_subset = kp_history[(kp_history["date"] >= cutoff) & (kp_history["date"] <= now)].copy()
            if not kp_subset.empty:
                kp_json = {
                    "labels": kp_subset["date"].dt.strftime("%Y-%m-%d").tolist(),
                    "data": kp_subset["kp_max"].fillna(0).tolist()
                }
                results[f"kp_{range_name}"] = kp_json

        # EOP data - slice from main lod_json data if available
        if lod_json and "labels" in lod_json and "data" in lod_json:
            labels = lod_json["labels"]
            data = lod_json["data"]
            # Slice to requested range (most recent N days)
            cutoff_idx = max(0, len(labels) - days)
            sliced_json = {
                "labels": labels[cutoff_idx:],
                "data": data[cutoff_idx:]
            }
            results[f"lod_{range_name}"] = sliced_json
        elif not eop_all.empty:
            # Fallback to filtering eop_all if available
            eop_subset = eop_all[(eop_all["date"] >= cutoff) & (eop_all["date"] <= now)].copy()
            if not eop_subset.empty:
                lod_data_json = {
                    "labels": eop_subset["date"].dt.strftime("%Y-%m-%d").tolist(),
                    "data": eop_subset["lod_ms"].fillna(0).tolist()
                }
                results[f"lod_{range_name}"] = lod_data_json

        # Magnetometer data - slice from main mag_json if available
        if mag_json and "labels" in mag_json:
            labels = mag_json["labels"]
            # Slice to requested range (most recent N days)
            cutoff_idx = max(0, len(labels) - days)
            mag_range_json = {
                "labels": labels[cutoff_idx:],
                "bou": mag_json.get("bou", [])[cutoff_idx:],
                "hon": mag_json.get("hon", [])[cutoff_idx:],
                "sjg": mag_json.get("sjg", [])[cutoff_idx:],
                "composite": mag_json.get("composite", [])[cutoff_idx:]
            }
            results[f"mag_{range_name}"] = mag_range_json

    return results

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
    try:
        eop_daily = load_iers_eop_daily_json()
    except Exception as e:
        print(f"    Warning: Daily EOP failed: {e}, trying all-time CSV...")
        eop_daily = pd.DataFrame()

    try:
        eop_all = load_iers_eop_all_csv()
    except Exception as e:
        print(f"    Warning: All-time EOP failed: {e}")
        eop_all = pd.DataFrame()

    print("  Fetching Kp history...")
    kp_history = load_gfz_kp_daily_since_1932(cache_dir)

    print("  Fetching recent Kp/Dst...")
    kp_dst = load_swpc_kp_dst()

    # Generate JSON for React app - Recent data (for backward compatibility)

    # 1. Recent Kp data (last 14 days)
    if not kp_history.empty:
        kp_recent = kp_history.tail(14).copy()
        kp_json = {
            "labels": kp_recent["date"].dt.strftime("%b %d").tolist(),
            "data": kp_recent["kp_max"].fillna(0).tolist()
        }
        (assets_dir / "kp_data.json").write_text(json.dumps(kp_json))
        print("    [OK] kp_data.json")

    # 2. LOD data (10+ years historical) - fetch real IERS data
    # Use all-time CSV as primary source for historic data
    if not eop_all.empty:
        print("    [OK] Using IERS all-time LOD data")
        eop_synthetic = eop_all

        # Generate JSON with all available history
        lod_json = {
            "labels": eop_all["date"].dt.strftime("%Y-%m-%d").tolist(),
            "data": eop_all["lod_ms"].fillna(0).tolist()
        }

        # For display, keep only recent 90 days in main file
        recent_idx = max(0, len(lod_json["labels"]) - 90)
        lod_recent_json = {
            "labels": lod_json["labels"][recent_idx:],
            "data": lod_json["data"][recent_idx:]
        }
    else:
        print("    [ERROR] IERS LOD data unavailable and no fallback available")
        print("    Please check IERS data source or manually provide data")
        eop_synthetic = pd.DataFrame()
        lod_json = {"labels": [], "data": []}
        lod_recent_json = {"labels": [], "data": []}

    if lod_json["labels"]:
        (assets_dir / "lod_data.json").write_text(json.dumps(lod_recent_json))
        print("    [OK] lod_data.json (90-day recent view from real IERS data)")

    # 3. Historical AA index (last 50 years)
    if not kp_history.empty:
        kp_annual = kp_history.set_index("date").resample("YE")["kp_max"].mean()
        end_year = kp_annual.index[-1].year
        start_year = end_year - 50
        aa_subset = kp_annual[str(start_year):str(end_year)]
        aa_json = {
            "labels": [str(year) for year in aa_subset.index.year],
            "data": aa_subset.fillna(0).tolist()
        }
        (assets_dir / "historical_aa.json").write_text(json.dumps(aa_json))
        print("    [OK] historical_aa.json")

    # 4. Historical PM (last 50 years)
    if not eop_all.empty:
        eop_annual = eop_all.set_index("date").resample("YE")["pm_r_arcsec"].mean()
        end_year = eop_annual.index[-1].year
        start_year = end_year - 50
        pm_subset = eop_annual[str(start_year):str(end_year)]
        pm_json = {
            "labels": [str(year) for year in pm_subset.index.year],
            "data": pm_subset.fillna(0).tolist()
        }
        (assets_dir / "historical_pm.json").write_text(json.dumps(pm_json))
        print("    [OK] historical_pm.json")

    # 5. Magnetometer data (last 60 days - USGS API limitation)
    print("  Fetching magnetometer data...")
    end_time = now
    start_time = end_time - timedelta(days=60)

    mag_data_by_station = {}

    # Attempt to fetch from multiple sources and time periods
    for station, label in MAG_STATIONS:
        all_mag_data = []

        # Try recent 60 days from USGS (primary source)
        try:
            print(f"    Fetching {station} from {start_time.date()} to {end_time.date()} (USGS)...")
            df = load_usgs_mag_timeseries_H(station, start_time, end_time)
            if not df.empty:
                all_mag_data.append(df)
                print(f"      {station}: {len(df)} records from USGS")
        except Exception as e:
            print(f"    Warning: USGS {station} failed: {e}")

        # Note: Historical data fetch attempts disabled due to USGS API limitations
        # (USGS GEOMAG WS only reliably serves ~60-90 days of recent data)
        # Future enhancement: Integrate secondary source like INTERMAGNET or WDC Kyoto

        # Combine all data if we have any
        if all_mag_data:
            combined = pd.concat(all_mag_data, ignore_index=True)
            combined = combined.drop_duplicates(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
            daily = combined.set_index("timestamp").resample("D")["value"].mean()
            mag_data_by_station[station] = daily.fillna(0).tolist()
            print(f"      {station}: Total {len(daily)} days of combined data")
        else:
            print(f"      {station}: No data retrieved from any source")

    normalized_mag_data = {}
    if mag_data_by_station:
        # Normalize magnetometer data: convert to z-scores
        date_range = [str(d.date()) for d in pd.date_range(start_time.date(), end_time.date(), freq="D")]

        normalized_data = {}
        for station, values in mag_data_by_station.items():
            # Remove bad data (99999 is USGS missing data marker)
            clean_values = [v if v < 90000 else None for v in values]

            # Convert to z-scores
            valid_values = [v for v in clean_values if v is not None]
            if valid_values:
                mean = sum(valid_values) / len(valid_values)
                std_dev = (sum((v - mean) ** 2 for v in valid_values) / len(valid_values)) ** 0.5
                if std_dev > 0:
                    z_scores = [(v - mean) / std_dev if v is not None else 0 for v in clean_values]
                else:
                    z_scores = [0 for _ in clean_values]
            else:
                z_scores = [0] * len(clean_values)

            normalized_data[station] = z_scores
            normalized_mag_data[station] = z_scores  # Store normalized data for time-range generation

        # Composite is average of z-scores
        composite = []
        for i in range(len(date_range)):
            station_z_scores = [normalized_data[s][i] for s in normalized_data.keys()]
            composite.append(sum(station_z_scores) / len(station_z_scores))

        mag_json = {
            "labels": date_range,
            "bou": normalized_data.get("BOU", []),
            "hon": normalized_data.get("HON", []),
            "sjg": normalized_data.get("BRW", []),
            "composite": composite
        }
        (assets_dir / "mag_data.json").write_text(json.dumps(mag_json))
        print("    [OK] mag_data.json")

    # 6. Generate time-range datasets (30d, 90d, 1y, 5y, 10y)
    print("  Generating multi-range datasets...")
    # Pass main LOD and Mag JSON data for clean slicing
    time_range_data = generate_time_range_datasets(kp_history, eop_all, normalized_mag_data, now, lod_json, mag_json)

    for dataset_name, dataset in time_range_data.items():
        filepath = assets_dir / f"{dataset_name}.json"
        filepath.write_text(json.dumps(dataset))
        print(f"    [OK] {dataset_name}.json")

    print(f"[{utcnow().isoformat()}] Complete!")

if __name__ == "__main__":
    main()
