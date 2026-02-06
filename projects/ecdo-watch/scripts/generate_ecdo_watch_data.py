#!/usr/bin/env python3
# scripts/generate_ecdo_watch_data.py
# Generates real geophysics data JSON for ECDO Watch React dashboard
# Fetches from NOAA SWPC, IERS, GFZ, GSFC, and USGS scientific data sources

import io
import json
import math
import time
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
INTERMAGNET_API = "https://imag-data.bgs.ac.uk/GIN_V1/data"
WDC_MAGNETOMETER = "https://www.ngdc.noaa.gov/products/data-access-system/data/datasets/earth-magnetic-field/"

# INTERMAGNET station codes (map USGS codes to INTERMAGNET equivalents)
INTERMAGNET_STATIONS = {
    "BOU": "BOU",  # Boulder
    "FRD": "FRD",  # Fredericksburg
    "BRW": "BRW",  # Barrow
    "HON": "HON",  # Honolulu
}

# -------------------------
# Helpers
# -------------------------
def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)

def fetch_text(url: str, timeout_s: int = TIMEOUT_S, max_retries: int = 3) -> str:
    """Fetch text with exponential backoff retry logic."""
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            r = requests.get(url, timeout=timeout_s)
            r.raise_for_status()
            if attempt > 1:
                print(f"      Retry {attempt}/{max_retries}: SUCCESS")
            return r.text
        except Exception as e:
            last_exception = e
            if attempt < max_retries:
                wait_time = 2 ** (attempt - 1)  # exponential backoff: 1s, 2s, 4s
                print(f"      Retry {attempt}/{max_retries}: {type(e).__name__} - retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"      Retry {attempt}/{max_retries}: FAILED - {type(e).__name__}: {str(e)[:100]}")
    raise last_exception

def fetch_text_cached(url: str, cache_path: Path, max_age_hours: float = 24.0, timeout_s: int = 60, max_retries: int = 3) -> str:
    """Fetch text with a simple on-disk cache. Falls back to cache if network fails."""
    try:
        if cache_path.exists():
            mtime = datetime.fromtimestamp(cache_path.stat().st_mtime, tz=timezone.utc)
            age_h = (utcnow() - mtime).total_seconds() / 3600.0
            if age_h <= max_age_hours:
                return cache_path.read_text(encoding="utf-8", errors="replace")
        text = fetch_text(url, timeout_s=timeout_s, max_retries=max_retries)
        ensure_dir(cache_path.parent)
        cache_path.write_text(text, encoding="utf-8")
        return text
    except Exception as e:
        if cache_path.exists():
            age_h = (utcnow() - datetime.fromtimestamp(cache_path.stat().st_mtime, tz=timezone.utc)).total_seconds() / 3600.0
            print(f"      WARNING: Using stale cache ({age_h:.1f}h old) due to: {type(e).__name__}")
            return cache_path.read_text(encoding="utf-8", errors="replace")
        raise

def fetch_json(url: str, timeout_s: int = TIMEOUT_S, max_retries: int = 3) -> Any:
    """Fetch JSON with exponential backoff retry logic."""
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            r = requests.get(url, timeout=timeout_s)
            r.raise_for_status()
            if attempt > 1:
                print(f"      Retry {attempt}/{max_retries}: SUCCESS")
            return r.json()
        except Exception as e:
            last_exception = e
            if attempt < max_retries:
                wait_time = 2 ** (attempt - 1)
                print(f"      Retry {attempt}/{max_retries}: {type(e).__name__} - retrying in {wait_time}s...")
                import time
                time.sleep(wait_time)
            else:
                print(f"      Retry {attempt}/{max_retries}: FAILED - {type(e).__name__}: {str(e)[:100]}")
    raise last_exception

def robust_zscore(series: pd.Series, window: int = 180) -> pd.Series:
    """Rolling robust z-score using median and MAD."""
    x = pd.to_numeric(series, errors="coerce").astype(float)
    med = x.rolling(window, min_periods=max(20, window // 10)).median()
    mad = (x - med).abs().rolling(window, min_periods=max(20, window // 10)).median()
    denom = 1.4826 * mad.replace(0, float("nan"))
    return (x - med) / denom

def add_metadata(json_obj: Dict[str, Any], source: str, data_age_hours: float = 0.0, source_status: str = "ok") -> Dict[str, Any]:
    """Add freshness metadata to JSON object."""
    if "metadata" not in json_obj:
        json_obj["metadata"] = {}
    json_obj["metadata"]["generated_at"] = utcnow().isoformat()
    json_obj["metadata"]["data_age_hours"] = round(data_age_hours, 1)
    json_obj["metadata"]["source"] = source
    json_obj["metadata"]["source_status"] = source_status
    return json_obj

def load_mag_history(cache_dir: Path) -> pd.DataFrame:
    """Load accumulated magnetometer history from cache."""
    history_file = cache_dir / "mag_history.csv"
    if history_file.exists():
        try:
            df = pd.read_csv(history_file, parse_dates=["date"])
            df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
            print(f"    Loaded {len(df)} days of magnetometer history")
            return df
        except Exception as e:
            print(f"    Warning: Could not load mag history: {e}")
    return pd.DataFrame(columns=["date", "BOU", "FRD", "BRW", "HON"])

def save_mag_history(cache_dir: Path, history_df: pd.DataFrame) -> None:
    """Save accumulated magnetometer history to cache."""
    history_file = cache_dir / "mag_history.csv"
    # Ensure date column is datetime and sort
    history_df = history_df.copy()
    history_df["date"] = pd.to_datetime(history_df["date"])
    history_df = history_df.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    history_df.to_csv(history_file, index=False, date_format="%Y-%m-%d")
    print(f"    Saved {len(history_df)} days of magnetometer history")

def merge_mag_history(existing: pd.DataFrame, new_data: Dict[str, List], date_range: List[str]) -> pd.DataFrame:
    """Merge newly fetched magnetometer data with existing history."""
    # Create DataFrame from new data
    new_df = pd.DataFrame({"date": pd.to_datetime(date_range)})
    for station in ["BOU", "FRD", "BRW", "HON"]:
        if station in new_data and len(new_data[station]) == len(date_range):
            new_df[station] = new_data[station]
        else:
            new_df[station] = None

    if existing.empty:
        return new_df

    # Combine: prefer new data for overlapping dates
    existing["date"] = pd.to_datetime(existing["date"])
    combined = pd.concat([existing, new_df], ignore_index=True)
    combined = combined.sort_values("date")

    # For duplicate dates, keep the last (newer) value if it's not null
    result_rows = []
    for date, group in combined.groupby("date"):
        row = {"date": date}
        for station in ["BOU", "FRD", "BRW", "HON"]:
            # Take the last non-null value for each station
            values = group[station].dropna()
            row[station] = values.iloc[-1] if len(values) > 0 else None
        result_rows.append(row)

    return pd.DataFrame(result_rows)

def calculate_quiet_days(kp_data: pd.DataFrame, dst_data: Optional[pd.DataFrame] = None) -> Dict[str, List[bool]]:
    """
    Calculate quiet-day flags based on Kp and Dst thresholds.

    A day is "quiet" if:
    - Kp max <= 4.0 (geomagnetically quiet)
    - AND Dst min >= -50 nT (storm disturbance index threshold)

    Returns dict with:
    - "is_quiet": list of bool for each date in kp_data
    - "quiet_day_count": number of quiet days
    - "window_days": total days in window
    """
    is_quiet = []

    for idx, row in kp_data.iterrows():
        kp_max = row.get("kp_max", float("nan"))
        is_quiet_day = False

        if pd.notna(kp_max) and kp_max <= KP_QUIET_MAX:
            # If we have Dst data, check that too
            if dst_data is not None and not dst_data.empty:
                date = row.get("date")
                dst_match = dst_data[dst_data["date"] == date]
                if not dst_match.empty:
                    dst_min = dst_match.iloc[0].get("dst_min", float("nan"))
                    if pd.notna(dst_min) and dst_min >= DST_QUIET_MIN:
                        is_quiet_day = True
                else:
                    # No Dst data for this date, assume quiet based on Kp alone
                    is_quiet_day = True
            else:
                # No Dst data available, use Kp alone
                is_quiet_day = True

        is_quiet.append(is_quiet_day)

    quiet_count = sum(is_quiet)
    return {
        "is_quiet": is_quiet,
        "quiet_day_count": quiet_count,
        "window_days": len(is_quiet)
    }

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

def load_iers_eop_all_csv(cache_dir: Path = None) -> pd.DataFrame:
    """Load long-history EOP from IERS finals2000A.all.csv with weekly caching."""
    if cache_dir is None:
        cache_dir = Path(__file__).parent.parent / "assets" / "cache"

    cache_path = cache_dir / "finals2000A.all.csv"
    # Cache for 7 days (weekly)
    text = fetch_text_cached(IERS_EOP_ALL_CSV, cache_path, max_age_hours=168.0, timeout_s=120, max_retries=3)

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
    # Filter out prediction data - only keep rows with actual LOD values (not future predictions)
    out = out[out["lod_ms"].notna()].copy()
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

def load_gsfc_c20(cache_dir: Path = None) -> pd.DataFrame:
    """Load C20 (degree-2 gravity harmonic) from NASA GSFC with caching."""
    if cache_dir is None:
        cache_dir = Path(__file__).parent.parent / "assets" / "cache"

    cache_path = cache_dir / "gsfc_slr_c20_long_term.txt"
    # Cache for 30 days
    try:
        text = fetch_text_cached(GSFC_C20_LONG_TERM, cache_path, max_age_hours=720.0, timeout_s=120, max_retries=2)
    except Exception:
        return pd.DataFrame()

    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        if len(parts) < 3:
            continue

        try:
            # Format: YYYY MM.MMMMM value uncertainty
            year = int(parts[0])
            month_decimal = float(parts[1])
            month = int(month_decimal)
            day = int((month_decimal - month) * 30) + 1
            c20_value = float(parts[2])

            dt = datetime(year, month, day, tzinfo=timezone.utc)
            rows.append({
                "date": dt,
                "c20": c20_value
            })
        except Exception:
            continue

    df = pd.DataFrame(rows)
    return df.sort_values("date").reset_index(drop=True) if not df.empty else df

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

def load_intermagnet_mag_timeseries_H(station: str, start: datetime, end: datetime) -> pd.DataFrame:
    """Fetch H component from INTERMAGNET web service (fallback source)."""
    intermagnet_code = INTERMAGNET_STATIONS.get(station, station)
    start_s = start.strftime("%Y-%m-%d")
    end_s = end.strftime("%Y-%m-%d")

    # INTERMAGNET URL format: https://imag-data.bgs.ac.uk/GIN_V1/data?id=XXX&sampling_period=60&starttime=YYYY-MM-DD&endtime=YYYY-MM-DD
    url = (
        f"{INTERMAGNET_API}"
        f"?id={intermagnet_code}"
        f"&sampling_period={MAG_SAMPLING_S}"
        f"&starttime={start_s}"
        f"&endtime={end_s}"
    )

    try:
        raw = fetch_text(url, timeout_s=120, max_retries=2)
    except Exception:
        return pd.DataFrame()

    rows = []
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        if len(parts) < 4:
            continue

        try:
            date_str, time_str = parts[0], parts[1]
            h_val = float(parts[2])  # H component
            ts = pd.to_datetime(f"{date_str}T{time_str}", utc=True, errors="coerce")

            if pd.isna(ts) or pd.isna(h_val):
                continue
            if h_val > 1e5:  # Skip bad data
                continue

            rows.append({"timestamp": ts, "value": h_val})
        except Exception:
            continue

    df = pd.DataFrame(rows)
    return df.sort_values("timestamp").reset_index(drop=True) if not df.empty else df

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
def generate_time_range_datasets(kp_history, eop_all, mag_data_by_station, now, eop_baseline=None, lod_json=None, mag_json=None):
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
                # Calculate quiet-day flags for this range
                quiet_info = calculate_quiet_days(kp_subset)

                kp_json = {
                    "labels": kp_subset["date"].dt.strftime("%Y-%m-%d").tolist(),
                    "data": kp_subset["kp_max"].fillna(0).tolist(),
                    "is_quiet": quiet_info["is_quiet"]
                }
                results[f"kp_{range_name}"] = kp_json

        # EOP data - use eop_baseline (with z-scores) if available, else eop_all
        eop_source = eop_baseline if (eop_baseline is not None and not eop_baseline.empty) else eop_all
        if eop_source is not None and not eop_source.empty:
            eop_subset = eop_source[(eop_source["date"] >= cutoff) & (eop_source["date"] <= now)].copy()
            if not eop_subset.empty:
                lod_data_json = {
                    "labels": eop_subset["date"].dt.strftime("%Y-%m-%d").tolist(),
                    "data": eop_subset["lod_ms"].fillna(0).tolist()
                }
                # Include z-scores if available
                if "z_lod" in eop_subset.columns:
                    lod_data_json["z_lod"] = [round(v, 4) if pd.notna(v) else None for v in eop_subset["z_lod"].tolist()]
                if "z_pm_speed" in eop_subset.columns:
                    lod_data_json["z_pm_speed"] = [round(v, 4) if pd.notna(v) else None for v in eop_subset["z_pm_speed"].tolist()]
                if "eop_composite" in eop_subset.columns:
                    lod_data_json["eop_composite"] = [round(v, 4) if pd.notna(v) else None for v in eop_subset["eop_composite"].tolist()]
                results[f"lod_{range_name}"] = lod_data_json

        # Magnetometer data - use full history with date-based filtering
        if mag_data_by_station and "_labels" in mag_data_by_station:
            labels = mag_data_by_station["_labels"]
            cutoff_str = cutoff.strftime("%Y-%m-%d")

            # Find indices within the date range
            indices = [i for i, lbl in enumerate(labels) if lbl >= cutoff_str]

            if indices:
                start_idx = indices[0]
                mag_range_json = {
                    "labels": labels[start_idx:],
                    "bou": mag_data_by_station.get("BOU", [])[start_idx:],
                    "hon": mag_data_by_station.get("HON", [])[start_idx:],
                    "sjg": mag_data_by_station.get("BRW", [])[start_idx:],
                }
                # Compute composite for this range
                composite = []
                for i in range(len(mag_range_json["labels"])):
                    z_scores = []
                    for key in ["bou", "hon", "sjg"]:
                        if i < len(mag_range_json.get(key, [])):
                            z_scores.append(mag_range_json[key][i])
                    if z_scores:
                        composite.append(sum(z_scores) / len(z_scores))
                    else:
                        composite.append(0)
                mag_range_json["composite"] = composite
                results[f"mag_{range_name}"] = mag_range_json

    return results

def _generate_coherence_data(assets_dir: Path, eop_baseline: pd.DataFrame, mag_history: pd.DataFrame, kp_history: pd.DataFrame, now: datetime) -> None:
    """Generate cross-channel coherence JSON: EOP composite vs MAG composite on quiet days."""
    if eop_baseline.empty or mag_history.empty:
        raise ValueError("Need both EOP baseline and MAG history for coherence")

    # Get EOP composite (date-indexed)
    eop = eop_baseline[["date", "eop_composite"]].dropna(subset=["eop_composite"]).copy()
    eop["date"] = pd.to_datetime(eop["date"]).dt.tz_localize(None)

    # Compute MAG composite from history (average z-score across stations)
    mag = mag_history.copy()
    mag["date"] = pd.to_datetime(mag["date"]).dt.tz_localize(None)
    station_cols = [c for c in ["BOU", "FRD", "BRW", "HON"] if c in mag.columns]
    if not station_cols:
        raise ValueError("No magnetometer station columns found")

    # Compute z-scores for each station using robust method
    for col in station_cols:
        mag[col] = pd.to_numeric(mag[col], errors="coerce")
        # Filter bad data
        mag.loc[mag[col] > 90000, col] = np.nan
    # Use robust z-score on each station's daily mean, then composite
    for col in station_cols:
        z_col = f"z_{col}"
        mag[z_col] = robust_zscore(mag[col], window=min(180, max(30, len(mag) // 3)))
    z_cols = [f"z_{c}" for c in station_cols]
    mag["mag_composite"] = mag[z_cols].abs().max(axis=1)

    # Merge EOP and MAG on date
    merged = pd.merge(eop[["date", "eop_composite"]], mag[["date", "mag_composite"]], on="date", how="inner")
    merged = merged.sort_values("date").reset_index(drop=True)

    # Filter to last 90 days for primary analysis
    cutoff_90d = now.replace(tzinfo=None) - timedelta(days=90)
    merged_90d = merged[merged["date"] >= cutoff_90d].copy()

    if merged_90d.empty:
        raise ValueError("No overlapping EOP + MAG data in last 90 days")

    # Apply quiet-day flags from Kp history
    kp = kp_history[["date", "kp_max"]].copy()
    kp["date"] = pd.to_datetime(kp["date"]).dt.tz_localize(None)
    merged_90d = pd.merge(merged_90d, kp[["date", "kp_max"]], on="date", how="left")
    merged_90d["quiet"] = merged_90d["kp_max"].fillna(99).le(KP_QUIET_MAX)

    quiet_days = merged_90d[merged_90d["quiet"]].dropna(subset=["mag_composite", "eop_composite"])
    n_quiet = len(quiet_days)

    # Pearson correlation on quiet days (require N>=10)
    corr_quiet = None
    if n_quiet >= 10:
        corr_quiet = float(quiet_days["mag_composite"].corr(quiet_days["eop_composite"]))
        if pd.isna(corr_quiet):
            corr_quiet = None

    # Rolling 30-day trailing correlation (quiet days, N>=10)
    rolling_corr = []
    for _, row in merged_90d.iterrows():
        d = row["date"]
        window = merged_90d[(merged_90d["date"] >= d - timedelta(days=30)) & (merged_90d["date"] <= d)]
        w_quiet = window[window["quiet"]].dropna(subset=["mag_composite", "eop_composite"])
        if len(w_quiet) >= 10:
            c = float(w_quiet["mag_composite"].corr(w_quiet["eop_composite"]))
            rolling_corr.append(round(c, 4) if pd.notna(c) else None)
        else:
            rolling_corr.append(None)

    # Gated watch score: 100 * (0.6 * e_sig + 0.4 * m_sig) on quiet days, 0 on disturbed
    watch_scores = []
    for _, row in merged_90d.iterrows():
        if row["quiet"]:
            e_sig = min(1.0, abs(row["eop_composite"]) / 3.0) if pd.notna(row["eop_composite"]) else 0.0
            m_sig = min(1.0, abs(row["mag_composite"]) / 3.0) if pd.notna(row["mag_composite"]) else 0.0
            score = 100.0 * (0.6 * e_sig + 0.4 * m_sig)
            watch_scores.append(round(max(0.0, min(100.0, score)), 1))
        else:
            watch_scores.append(0.0)

    # Badge from latest quiet-day watch score
    latest_score = None
    latest_quiet = False
    for i in range(len(merged_90d) - 1, -1, -1):
        if merged_90d.iloc[i]["quiet"]:
            latest_score = watch_scores[i]
            latest_quiet = True
            break

    if not latest_quiet or latest_score is None:
        badge = "GRAY"
    elif latest_score < 35:
        badge = "GREEN"
    elif latest_score < 65:
        badge = "YELLOW"
    else:
        badge = "ORANGE"

    coherence_json = {
        "labels": merged_90d["date"].dt.strftime("%Y-%m-%d").tolist(),
        "eop_composite": [round(v, 4) if pd.notna(v) else None for v in merged_90d["eop_composite"].tolist()],
        "mag_composite": [round(v, 4) if pd.notna(v) else None for v in merged_90d["mag_composite"].tolist()],
        "quiet": merged_90d["quiet"].tolist(),
        "watch_score": watch_scores,
        "rolling_corr_30d": rolling_corr,
        "correlation": round(corr_quiet, 4) if corr_quiet is not None else None,
        "badge": badge,
        "quiet_day_count": n_quiet,
        "total_days": len(merged_90d),
        "latest_watch_score": latest_score,
    }
    coherence_json = add_metadata(coherence_json, "Derived (EOP x MAG coherence)", source_status="ok")

    (assets_dir / "coherence_data.json").write_text(json.dumps(coherence_json))
    print(f"    [OK] coherence_data.json ({n_quiet} quiet days, corr={corr_quiet}, badge={badge})")


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
        eop_all = load_iers_eop_all_csv(cache_dir)
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
        # Calculate data age (time since oldest record)
        oldest_date = kp_recent["date"].min()
        data_age_h = (now - oldest_date).total_seconds() / 3600.0

        # Calculate quiet-day flags
        quiet_info = calculate_quiet_days(kp_recent)

        kp_json = {
            "labels": kp_recent["date"].dt.strftime("%b %d").tolist(),
            "data": kp_recent["kp_max"].fillna(0).tolist(),
            "is_quiet": quiet_info["is_quiet"]
        }
        kp_json = add_metadata(kp_json, "GFZ (Kp index)", data_age_hours=data_age_h, source_status="ok")
        kp_json["metadata"]["quiet_day_count"] = quiet_info["quiet_day_count"]
        kp_json["metadata"]["window_days"] = quiet_info["window_days"]

        (assets_dir / "kp_data.json").write_text(json.dumps(kp_json))
        print(f"    [OK] kp_data.json ({quiet_info['quiet_day_count']}/{quiet_info['window_days']} quiet days)")

    # 2. LOD + Polar Motion data (10+ years historical) - fetch real IERS data
    # Use all-time CSV as primary source for historic data
    eop_baseline = pd.DataFrame()  # Will hold z-scored EOP for coherence analysis
    if not eop_all.empty:
        print("    [OK] Using IERS all-time EOP data")
        eop_synthetic = eop_all

        # Compute robust z-scores over the 10-year baseline
        baseline_cutoff = now - timedelta(days=int(BASELINE_YEARS_EOP * 365.25))
        eop_baseline = eop_all[eop_all["date"] >= baseline_cutoff].copy()
        eop_baseline = eop_baseline.dropna(subset=["lod_ms"]).sort_values("date").reset_index(drop=True)

        # Compute pm_speed if not already present
        if "pm_speed_arcsec_per_day" not in eop_baseline.columns:
            eop_baseline["pm_speed_arcsec_per_day"] = eop_baseline["pm_r_arcsec"].diff().abs()

        eop_baseline["z_lod"] = robust_zscore(eop_baseline["lod_ms"], window=180)
        eop_baseline["z_pm_speed"] = robust_zscore(eop_baseline["pm_speed_arcsec_per_day"], window=180)
        eop_baseline["eop_composite"] = eop_baseline[["z_lod", "z_pm_speed"]].abs().max(axis=1)

        # Generate JSON with all available history (raw LOD for backward compat)
        lod_json = {
            "labels": eop_all["date"].dt.strftime("%Y-%m-%d").tolist(),
            "data": eop_all["lod_ms"].fillna(0).tolist()
        }

        # For display, keep only recent 90 days in main file with z-scores
        eop_recent = eop_baseline.tail(90).copy()
        lod_recent_json = {
            "labels": eop_recent["date"].dt.strftime("%Y-%m-%d").tolist(),
            "data": eop_recent["lod_ms"].fillna(0).tolist(),
            "z_lod": [round(v, 4) if pd.notna(v) else None for v in eop_recent["z_lod"].tolist()],
            "z_pm_speed": [round(v, 4) if pd.notna(v) else None for v in eop_recent["z_pm_speed"].tolist()],
            "eop_composite": [round(v, 4) if pd.notna(v) else None for v in eop_recent["eop_composite"].tolist()],
        }

        # Add metadata
        if lod_recent_json["labels"]:
            oldest_label = lod_recent_json["labels"][0]
            oldest_date = pd.to_datetime(oldest_label, utc=True)
            data_age_h = (now - oldest_date).total_seconds() / 3600.0
            lod_recent_json = add_metadata(lod_recent_json, "IERS (EOP)", data_age_hours=data_age_h, source_status="ok")
    else:
        print("    [ERROR] IERS LOD data unavailable and no fallback available")
        print("    Please check IERS data source or manually provide data")
        eop_synthetic = pd.DataFrame()
        lod_json = {"labels": [], "data": []}
        lod_recent_json = {"labels": [], "data": []}

    if lod_json["labels"]:
        (assets_dir / "lod_data.json").write_text(json.dumps(lod_recent_json))
        print("    [OK] lod_data.json (90-day EOP view with z-scores)")

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

    # 4.5. C20 data (degree-2 gravity harmonic)
    print("  Fetching C20 data...")
    try:
        c20_all = load_gsfc_c20(cache_dir)
        if not c20_all.empty:
            # For display, keep only recent 90 days
            cutoff_date = now - timedelta(days=90)
            c20_recent = c20_all[c20_all["date"] >= cutoff_date].copy()

            if not c20_recent.empty:
                # Calculate z-scores (normalized relative to recent mean)
                c20_values = c20_recent["c20"].values
                c20_mean = np.mean(c20_values)
                c20_std = np.std(c20_values)
                if c20_std > 0:
                    c20_z = (c20_values - c20_mean) / c20_std
                else:
                    c20_z = np.zeros_like(c20_values)

                c20_json = {
                    "labels": c20_recent["date"].dt.strftime("%Y-%m-%d").tolist(),
                    "data": c20_z.tolist()
                }
                oldest_date = c20_recent["date"].min()
                data_age_h = (now - oldest_date).total_seconds() / 3600.0
                c20_json = add_metadata(c20_json, "NASA GSFC (C20)", data_age_hours=data_age_h, source_status="ok")

                (assets_dir / "c20_data.json").write_text(json.dumps(c20_json))
                print("    [OK] c20_data.json")
        else:
            print("    Warning: C20 data unavailable")
    except Exception as e:
        print(f"    Warning: C20 fetch failed: {e}")

    # 5. Magnetometer data (last 60 days fetch + accumulated history)
    print("  Fetching magnetometer data...")
    end_time = now
    start_time = end_time - timedelta(days=60)

    # Load existing magnetometer history
    mag_history = load_mag_history(cache_dir)

    # Dictionary to store newly fetched raw daily means (with dates)
    new_mag_data = {}  # station -> {date: value}
    mag_station_status = {}  # Track which stations succeeded
    mag_station_sources = {}  # Track which source was used

    # Attempt to fetch from multiple sources and time periods
    for station, label in MAG_STATIONS:
        all_mag_data = []
        station_status = "failed"
        station_source = "none"

        # Try recent 60 days from USGS (primary source)
        try:
            print(f"    Fetching {station} from {start_time.date()} to {end_time.date()} (USGS)...")
            df = load_usgs_mag_timeseries_H(station, start_time, end_time)
            if not df.empty:
                all_mag_data.append(df)
                n_records = len(df)
                print(f"      {station}: {n_records} records from USGS ✓")
                station_status = "ok"
                station_source = "USGS"
            else:
                print(f"      {station}: Empty response from USGS, trying INTERMAGNET...")
                # Try INTERMAGNET as fallback
                try:
                    df_intermagnet = load_intermagnet_mag_timeseries_H(station, start_time, end_time)
                    if not df_intermagnet.empty:
                        all_mag_data.append(df_intermagnet)
                        n_records = len(df_intermagnet)
                        print(f"      {station}: {n_records} records from INTERMAGNET ✓")
                        station_status = "ok"
                        station_source = "INTERMAGNET"
                    else:
                        print(f"      {station}: No data from INTERMAGNET either")
                except Exception as e:
                    print(f"      {station}: INTERMAGNET also failed: {type(e).__name__}")

        except requests.Timeout:
            print(f"    Warning: USGS {station} timeout, trying INTERMAGNET...")
            try:
                df_intermagnet = load_intermagnet_mag_timeseries_H(station, start_time, end_time)
                if not df_intermagnet.empty:
                    all_mag_data.append(df_intermagnet)
                    n_records = len(df_intermagnet)
                    print(f"      {station}: {n_records} records from INTERMAGNET ✓")
                    station_status = "ok"
                    station_source = "INTERMAGNET"
            except Exception as e2:
                print(f"      {station}: INTERMAGNET fallback also failed")

        except requests.ConnectionError:
            print(f"    Warning: USGS {station} connection error, trying INTERMAGNET...")
            try:
                df_intermagnet = load_intermagnet_mag_timeseries_H(station, start_time, end_time)
                if not df_intermagnet.empty:
                    all_mag_data.append(df_intermagnet)
                    n_records = len(df_intermagnet)
                    print(f"      {station}: {n_records} records from INTERMAGNET ✓")
                    station_status = "ok"
                    station_source = "INTERMAGNET"
            except Exception as e2:
                print(f"      {station}: INTERMAGNET fallback also failed")

        except Exception as e:
            print(f"    Warning: USGS {station} failed, trying INTERMAGNET...")
            try:
                df_intermagnet = load_intermagnet_mag_timeseries_H(station, start_time, end_time)
                if not df_intermagnet.empty:
                    all_mag_data.append(df_intermagnet)
                    n_records = len(df_intermagnet)
                    print(f"      {station}: {n_records} records from INTERMAGNET ✓")
                    station_status = "ok"
                    station_source = "INTERMAGNET"
            except Exception as e2:
                print(f"      {station}: INTERMAGNET fallback also failed")

        # Combine all data and compute daily means with dates
        if all_mag_data:
            combined = pd.concat(all_mag_data, ignore_index=True)
            combined = combined.drop_duplicates(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
            daily = combined.set_index("timestamp").resample("D")["value"].mean()
            # Store as dict of date -> value (raw means, not cleaned yet)
            new_mag_data[station] = {str(d.date()): v for d, v in daily.items() if pd.notna(v)}
            print(f"      {station}: Total {len(daily)} days of combined data")
        else:
            print(f"      {station}: No data retrieved from any source")
            new_mag_data[station] = {}

        mag_station_status[station] = station_status
        mag_station_sources[station] = station_source

    # Summary
    successful_stations = sum(1 for s in mag_station_status.values() if s == "ok")
    total_stations = len(MAG_STATIONS)
    print(f"    Magnetometer: {successful_stations}/{total_stations} stations successful")

    # Merge new data with history
    fetch_date_range = [str(d.date()) for d in pd.date_range(start_time.date(), end_time.date(), freq="D")]
    new_data_for_merge = {}
    for station in ["BOU", "FRD", "BRW", "HON"]:
        station_data = new_mag_data.get(station, {})
        new_data_for_merge[station] = [station_data.get(d) for d in fetch_date_range]

    mag_history = merge_mag_history(mag_history, new_data_for_merge, fetch_date_range)

    # Save accumulated history
    save_mag_history(cache_dir, mag_history)

    # Now process the full history for normalization and output
    normalized_mag_data = {}
    mag_json = None

    if not mag_history.empty and len(mag_history) > 0:
        # Sort history by date
        mag_history = mag_history.sort_values("date").reset_index(drop=True)
        full_date_range = [str(d.date()) for d in mag_history["date"]]

        # Normalize using full history (z-scores computed over entire dataset)
        normalized_data = {}
        for station in ["BOU", "FRD", "BRW", "HON"]:
            if station in mag_history.columns:
                values = mag_history[station].tolist()
                # Remove bad data (99999 is USGS missing data marker)
                clean_values = [v if v is not None and v < 90000 else None for v in values]

                # Convert to z-scores using full history statistics
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
            else:
                normalized_data[station] = [0] * len(full_date_range)

        # Store for time-range generation (uses full history)
        normalized_mag_data = normalized_data.copy()
        normalized_mag_data["_labels"] = full_date_range  # Include labels for time-range slicing

        # Composite is average of z-scores
        composite = []
        for i in range(len(full_date_range)):
            station_z_scores = [normalized_data[s][i] for s in ["BOU", "FRD", "BRW", "HON"] if s in normalized_data]
            if station_z_scores:
                composite.append(sum(station_z_scores) / len(station_z_scores))
            else:
                composite.append(0)

        # Determine overall status (based on this fetch, not history)
        mag_status = "ok" if successful_stations == total_stations else "partial" if successful_stations > 0 else "failed"

        # For mag_data.json, use recent 90 days from the full history
        recent_idx = max(0, len(full_date_range) - 90)
        recent_date_range = full_date_range[recent_idx:]

        mag_json = {
            "labels": recent_date_range,
            "bou": normalized_data.get("BOU", [])[recent_idx:],
            "hon": normalized_data.get("HON", [])[recent_idx:],
            "sjg": normalized_data.get("BRW", [])[recent_idx:],
            "composite": composite[recent_idx:]
        }
        # Add metadata with station info and sources
        mag_json = add_metadata(
            mag_json,
            f"Magnetometer ({successful_stations}/{total_stations} stations)",
            data_age_hours=0.0,
            source_status=mag_status
        )
        mag_json["metadata"]["station_statuses"] = mag_station_status
        mag_json["metadata"]["station_sources"] = mag_station_sources
        mag_json["metadata"]["history_days"] = len(full_date_range)

        (assets_dir / "mag_data.json").write_text(json.dumps(mag_json))
        print(f"    [OK] mag_data.json (90-day view from {len(full_date_range)} days of history)")
    else:
        print("    WARNING: No magnetometer data available")

    # 6. Generate time-range datasets (30d, 90d, 1y, 5y, 10y)
    print("  Generating multi-range datasets...")
    # Pass eop_baseline (with z-scores) for proper EOP data in time ranges
    time_range_data = generate_time_range_datasets(kp_history, eop_all, normalized_mag_data, now, eop_baseline=eop_baseline, lod_json=lod_json, mag_json=mag_json)

    for dataset_name, dataset in time_range_data.items():
        filepath = assets_dir / f"{dataset_name}.json"
        filepath.write_text(json.dumps(dataset))
        print(f"    [OK] {dataset_name}.json")

    # 7. Cross-channel coherence analysis
    print("  Computing cross-channel coherence...")
    try:
        _generate_coherence_data(assets_dir, eop_baseline, mag_history, kp_history, now)
    except Exception as e:
        print(f"    Warning: Coherence computation failed: {e}")
        # Write a minimal coherence file so the frontend doesn't break
        fallback = {
            "labels": [], "eop_composite": [], "mag_composite": [],
            "quiet": [], "watch_score": [],
            "correlation": None, "rolling_corr_30d": [],
            "badge": "GRAY", "quiet_day_count": 0, "total_days": 0,
        }
        (assets_dir / "coherence_data.json").write_text(json.dumps(fallback))
        print("    [OK] coherence_data.json (fallback)")

    print(f"[{utcnow().isoformat()}] Complete!")

if __name__ == "__main__":
    main()
