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
INTERMAGNET_HAPI = "https://imag-data.bgs.ac.uk/GIN_V1/hapi/data"
WDC_MAGNETOMETER = "https://www.ngdc.noaa.gov/products/data-access-system/data/datasets/earth-magnetic-field/"
USGS_EQ_FDSN = "https://earthquake.usgs.gov/fdsnws/event/1/query"
USGS_VHAP_ACTIVITY = "https://volcanoes.usgs.gov/hans-public/api/volcano/activityReport"
GVP_WFS_ERUPTIONS = "https://webservices.volcano.si.edu/geoserver/GVP-VOTW/wfs"

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

def clean_mag_history(df: pd.DataFrame) -> pd.DataFrame:
    """Clean accumulated magnetometer history: remove 99999 markers and statistical outliers."""
    df = df.copy()
    station_cols = [c for c in ["BOU", "FRD", "BRW", "HON"] if c in df.columns]

    for col in station_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        # Remove exact USGS missing data markers
        df.loc[df[col] >= 99999, col] = np.nan
        # Remove statistical outliers using median ± 5*MAD
        valid = df[col].dropna()
        if len(valid) > 10:
            median = valid.median()
            mad = (valid - median).abs().median()
            if mad > 0:
                threshold = 5 * 1.4826 * mad  # scaled MAD
                df.loc[(df[col] - median).abs() > threshold, col] = np.nan

    return df

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
    """Load C20 (degree-2 gravity harmonic) from NASA GSFC with caching.

    File format: Column 0 = year.fraction (e.g. 1976.4481),
    Column 4 = TSVD MM C20 (recommended by NASA).
    Data lines start after the "Product:" header line.
    """
    if cache_dir is None:
        cache_dir = Path(__file__).parent.parent / "assets" / "cache"

    cache_path = cache_dir / "gsfc_slr_c20_long_term.txt"
    # Cache for 30 days
    try:
        text = fetch_text_cached(GSFC_C20_LONG_TERM, cache_path, max_age_hours=720.0, timeout_s=120, max_retries=2)
    except Exception:
        return pd.DataFrame()

    rows = []
    past_header = False
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        # Skip everything until we pass the "Product:" line
        if line.startswith("Product:"):
            past_header = True
            continue
        if not past_header:
            continue

        parts = line.split()
        if len(parts) < 5:
            continue

        try:
            # Column 0: year.fraction (e.g. 1976.4481)
            year_frac = float(parts[0])
            year = int(year_frac)
            frac = year_frac - year
            dt = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=frac * 365.25)

            # Column 4: TSVD MM C20 (recommended solution)
            c20_value = float(parts[4])

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
    """Fetch H component from INTERMAGNET HAPI service (fallback source).

    Uses the HAPI standard endpoint with CSV format.
    Dataset ID format: {station}/best-avail/PT1M/HDZF
    """
    intermagnet_code = INTERMAGNET_STATIONS.get(station, station)
    start_s = start.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    end_s = end.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    url = (
        f"{INTERMAGNET_HAPI}"
        f"?id={intermagnet_code}/best-avail/PT1M/HDZF"
        f"&time.min={start_s}"
        f"&time.max={end_s}"
        f"&format=csv"
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

        parts = line.split(",")
        if len(parts) < 2:
            continue

        try:
            ts = pd.to_datetime(parts[0], utc=True, errors="coerce")
            h_val = float(parts[1])  # H is the first data column after timestamp

            if pd.isna(ts) or pd.isna(h_val):
                continue
            if h_val >= 99999:
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

        if pd.isna(v) or v >= 99999:
            continue

        rows.append({"timestamp": ts, "value": v})

    df = pd.DataFrame(rows)
    return df.sort_values("timestamp").reset_index(drop=True) if not df.empty else df

# -------------------------
# Haversine helper
# -------------------------
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km between two lat/lon points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# -------------------------
# Deep Seismicity
# -------------------------
def load_usgs_deep_seismicity(cache_dir: Path, years: int = 10) -> tuple:
    """Fetch deep earthquakes (>300km, M>=4.5) from USGS FDSN and aggregate to daily.

    Uses cached history file + live update for recent 30 days.
    Returns (daily_df, event_rows) where event_rows is a list of individual event dicts.
    """
    history_file = cache_dir / "deep_eq_history.csv"
    now = utcnow()

    # Load existing history
    history = pd.DataFrame()
    if history_file.exists():
        try:
            history = pd.read_csv(history_file, parse_dates=["date"])
            history["date"] = pd.to_datetime(history["date"]).dt.tz_localize(None)
            print(f"    Loaded {len(history)} days of deep EQ history")
        except Exception as e:
            print(f"    Warning: Could not load deep EQ history: {e}")

    # Determine what we need to fetch
    if history.empty:
        # Fetch full history in yearly chunks
        fetch_start = now - timedelta(days=years * 365)
        chunks = []
        current = fetch_start
        while current < now:
            chunk_end = min(current + timedelta(days=365), now)
            try:
                url = (
                    f"{USGS_EQ_FDSN}?format=geojson"
                    f"&mindepth=300&minmagnitude=4.5"
                    f"&starttime={current.strftime('%Y-%m-%d')}"
                    f"&endtime={chunk_end.strftime('%Y-%m-%d')}"
                    f"&orderby=time"
                )
                print(f"      Fetching deep EQ {current.strftime('%Y-%m-%d')} to {chunk_end.strftime('%Y-%m-%d')}...")
                data = fetch_json(url, timeout_s=60, max_retries=2)
                if data and "features" in data:
                    chunks.extend(data["features"])
                    print(f"        {len(data['features'])} events")
            except Exception as e:
                print(f"        Warning: Chunk failed: {type(e).__name__}")
            current = chunk_end
        events = chunks
    else:
        # Only fetch last 30 days to update
        fetch_start = now - timedelta(days=30)
        url = (
            f"{USGS_EQ_FDSN}?format=geojson"
            f"&mindepth=300&minmagnitude=4.5"
            f"&starttime={fetch_start.strftime('%Y-%m-%d')}"
            f"&endtime={now.strftime('%Y-%m-%d')}"
            f"&orderby=time"
        )
        data = fetch_json(url, timeout_s=60, max_retries=3)
        events = data.get("features", []) if data else []
        print(f"      Fetched {len(events)} recent deep EQ events")

    # Parse events into rows
    event_rows = []
    for feat in events:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [None, None, None])
        mag = props.get("mag")
        event_time = props.get("time")
        if mag is None or event_time is None or len(coords) < 3:
            continue
        try:
            dt = datetime.fromtimestamp(event_time / 1000, tz=timezone.utc)
            event_rows.append({
                "date": dt.strftime("%Y-%m-%d"),
                "datetime": dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "mag": float(mag),
                "depth_km": float(coords[2]),
                "lat": float(coords[1]),
                "lon": float(coords[0]),
            })
        except Exception:
            continue

    if not event_rows:
        if not history.empty:
            return history, []
        return pd.DataFrame(columns=["date", "eq_count", "energy_log10", "max_magnitude", "mean_depth_km"]), []

    events_df = pd.DataFrame(event_rows)
    events_df["date_dt"] = pd.to_datetime(events_df["date"])
    # Energy: 10^(1.5*M + 4.8) joules
    events_df["energy"] = 10 ** (1.5 * events_df["mag"] + 4.8)

    # Aggregate daily
    daily = events_df.groupby("date").agg(
        eq_count=("mag", "size"),
        energy_sum=("energy", "sum"),
        max_magnitude=("mag", "max"),
        mean_depth_km=("depth_km", "mean"),
    ).reset_index()
    daily["energy_log10"] = np.log10(daily["energy_sum"])
    daily["date"] = pd.to_datetime(daily["date"])
    daily = daily.drop(columns=["energy_sum"])

    # Compute spatial dispersion per day
    dispersions = []
    for d, group in events_df.groupby("date"):
        if len(group) < 2:
            dispersions.append({"date": pd.to_datetime(d), "dispersion_km": 0.0})
        else:
            dists = []
            lats = group["lat"].tolist()
            lons = group["lon"].tolist()
            for i in range(len(lats)):
                for j in range(i + 1, len(lats)):
                    dists.append(haversine_km(lats[i], lons[i], lats[j], lons[j]))
            dispersions.append({"date": pd.to_datetime(d), "dispersion_km": np.std(dists) if dists else 0.0})
    disp_df = pd.DataFrame(dispersions)
    daily = pd.merge(daily, disp_df, on="date", how="left")

    # Merge with existing history (prefer new data for overlapping dates)
    if not history.empty:
        history["date"] = pd.to_datetime(history["date"])
        combined = pd.concat([history, daily], ignore_index=True)
        combined = combined.sort_values("date").drop_duplicates(subset=["date"], keep="last")
        daily = combined.reset_index(drop=True)

    # Fill missing days with zeros
    full_range = pd.date_range(daily["date"].min(), now.replace(tzinfo=None), freq="D")
    daily = daily.set_index("date").reindex(full_range).rename_axis("date").reset_index()
    daily["eq_count"] = daily["eq_count"].fillna(0).astype(int)

    # Save history
    daily.to_csv(history_file, index=False, date_format="%Y-%m-%d")
    print(f"    Saved {len(daily)} days of deep EQ history")

    return daily, event_rows


def generate_seismic_events_json(events: list, assets_dir: Path) -> None:
    """Save recent individual seismic events for globe display (last 90 days, <=500 events)."""
    now = utcnow()
    cutoff = now - timedelta(days=90)
    cutoff_str = cutoff.strftime("%Y-%m-%d")

    recent = [e for e in events if e.get("date", "") >= cutoff_str]
    # Sort by date descending and cap at 500
    recent.sort(key=lambda e: e["date"], reverse=True)
    recent = recent[:500]

    out = {
        "events": recent,
    }
    out = add_metadata(out, "USGS FDSN", source_status="ok")

    (assets_dir / "seismic_events.json").write_text(json.dumps(out))
    print(f"    [OK] seismic_events.json ({len(recent)} events)")


def generate_polar_motion_json(eop_all: pd.DataFrame, assets_dir: Path) -> None:
    """Generate polar motion data JSON for spiral plot and Chandler wobble decomposition.

    Uses last 10 years of daily pm_x/pm_y from IERS finals2000A.
    Chandler separation: 365-day rolling mean captures annual + secular drift,
    residual approximates Chandler component (~433-day period).
    """
    if eop_all.empty:
        print("    Warning: No EOP data for polar motion JSON")
        return

    now = utcnow()
    cutoff = now - timedelta(days=10 * 365)
    subset = eop_all[eop_all["date"] >= cutoff].copy()
    subset = subset.dropna(subset=["pm_x_arcsec", "pm_y_arcsec"]).sort_values("date").reset_index(drop=True)

    if len(subset) < 400:
        print(f"    Warning: Only {len(subset)} polar motion points (need ~3650)")
        return

    # Chandler wobble separation via 365-day rolling mean
    subset["pm_x_annual"] = subset["pm_x_arcsec"].rolling(365, min_periods=180, center=True).mean()
    subset["pm_y_annual"] = subset["pm_y_arcsec"].rolling(365, min_periods=180, center=True).mean()
    subset["pm_x_chandler"] = subset["pm_x_arcsec"] - subset["pm_x_annual"]
    subset["pm_y_chandler"] = subset["pm_y_arcsec"] - subset["pm_y_annual"]

    # Drop rows where rolling mean is NaN (edges)
    valid = subset.dropna(subset=["pm_x_chandler", "pm_y_chandler"]).copy()

    out = {
        "labels": valid["date"].dt.strftime("%Y-%m-%d").tolist(),
        "pm_x": [round(v, 6) for v in valid["pm_x_arcsec"].tolist()],
        "pm_y": [round(v, 6) for v in valid["pm_y_arcsec"].tolist()],
        "pm_x_chandler": [round(v, 6) if pd.notna(v) else None for v in valid["pm_x_chandler"].tolist()],
        "pm_y_chandler": [round(v, 6) if pd.notna(v) else None for v in valid["pm_y_chandler"].tolist()],
    }
    out = add_metadata(out, "IERS finals2000A", source_status="ok")

    (assets_dir / "polar_motion_data.json").write_text(json.dumps(out))
    print(f"    [OK] polar_motion_data.json ({len(valid)} points)")


def generate_deep_seismicity_json(daily: pd.DataFrame, days: int = 90) -> dict:
    """Generate JSON output for deep seismicity channel."""
    if daily.empty:
        return {"labels": [], "eq_count": [], "energy_log10": [], "max_magnitude": [],
                "mean_depth_km": [], "z_eq_count": [], "z_energy": [], "rolling_30d_count": []}

    # Compute z-scores on full history, then slice
    daily = daily.copy()
    daily["z_eq_count"] = robust_zscore(daily["eq_count"].astype(float), window=180)
    daily["z_energy"] = robust_zscore(daily["energy_log10"], window=180)
    daily["rolling_30d_count"] = daily["eq_count"].rolling(30, min_periods=1).mean()

    # Slice to requested window
    subset = daily.tail(days).copy()

    return {
        "labels": subset["date"].dt.strftime("%Y-%m-%d").tolist(),
        "eq_count": subset["eq_count"].tolist(),
        "energy_log10": [round(v, 2) if pd.notna(v) else None for v in subset["energy_log10"]],
        "max_magnitude": [round(v, 1) if pd.notna(v) else None for v in subset["max_magnitude"]],
        "mean_depth_km": [round(v, 0) if pd.notna(v) else None for v in subset["mean_depth_km"]],
        "z_eq_count": [round(v, 4) if pd.notna(v) else None for v in subset["z_eq_count"]],
        "z_energy": [round(v, 4) if pd.notna(v) else None for v in subset["z_energy"]],
        "rolling_30d_count": [round(v, 2) if pd.notna(v) else None for v in subset["rolling_30d_count"]],
    }


# -------------------------
# Volcanic Activity
# -------------------------
def load_volcanic_activity(cache_dir: Path) -> dict:
    """Fetch current volcanic activity from USGS VHAP API with GVP fallback.

    Returns dict with current_volcanoes list and historical weekly snapshots.
    """
    history_file = cache_dir / "volcanic_history.csv"
    cache_file = cache_dir / "volcanic_activity_cache.json"
    now = utcnow()

    # Load existing weekly history
    history = pd.DataFrame()
    if history_file.exists():
        try:
            history = pd.read_csv(history_file, parse_dates=["date"])
            history["date"] = pd.to_datetime(history["date"]).dt.tz_localize(None)
            print(f"    Loaded {len(history)} weeks of volcanic history")
        except Exception as e:
            print(f"    Warning: Could not load volcanic history: {e}")

    # Check cache (7-day)
    current_volcanoes = []
    source = "none"

    if cache_file.exists():
        mtime = datetime.fromtimestamp(cache_file.stat().st_mtime, tz=timezone.utc)
        age_h = (now - mtime).total_seconds() / 3600.0
        if age_h <= 168.0:  # 7 days
            try:
                cached = json.loads(cache_file.read_text(encoding="utf-8"))
                current_volcanoes = cached.get("volcanoes", [])
                source = cached.get("source", "cache")
                print(f"    Using cached volcanic data ({age_h:.0f}h old, {len(current_volcanoes)} volcanoes)")
                # Still need to append new weekly snapshot if needed
                if not history.empty:
                    latest_date = history["date"].max()
                    if (now.replace(tzinfo=None) - latest_date).days < 7:
                        return {"current_volcanoes": current_volcanoes, "history": history, "source": source}
            except Exception:
                pass

    # Primary: Smithsonian GVP WFS (continuing eruptions)
    if not current_volcanoes:
        try:
            print("    Trying Smithsonian GVP WFS API...")
            url = (
                f"{GVP_WFS_ERUPTIONS}?service=WFS&version=1.1.0"
                f"&request=GetFeature&typeName=GVP-VOTW:E3WebApp_Eruptions1960"
                f"&outputFormat=application%2Fjson&maxFeatures=200"
                f"&CQL_FILTER=ContinuingEruption=%27True%27"
            )
            data = fetch_json(url, timeout_s=60, max_retries=3)
            features = data.get("features", [])
            for feat in features:
                props = feat.get("properties", {})
                name = props.get("VolcanoName", "Unknown")
                lat = props.get("LatitudeDecimal")
                lon = props.get("LongitudeDecimal")
                start_date_raw = props.get("StartDate", "")
                start_date = ""
                if start_date_raw and len(str(start_date_raw)) >= 8:
                    sd = str(start_date_raw)
                    start_date = f"{sd[:4]}-{sd[4:6]}-{sd[6:8]}"
                if lat is not None and lon is not None:
                    entry = {
                        "name": name,
                        "lat": float(lat),
                        "lon": float(lon),
                        "status": "erupting",
                        "alert": "CONTINUING",
                    }
                    if start_date:
                        entry["start_date"] = start_date
                    current_volcanoes.append(entry)
            source = "Smithsonian GVP"
            print(f"      GVP WFS: {len(current_volcanoes)} continuing eruptions")
        except Exception as e:
            print(f"      GVP WFS failed: {type(e).__name__}: {str(e)[:100]}")

    # Fallback: USGS VHAP API
    if not current_volcanoes:
        try:
            print("    Trying USGS VHAP API...")
            data = fetch_json(USGS_VHAP_ACTIVITY, timeout_s=30, max_retries=2)
            if isinstance(data, list):
                for entry in data:
                    name = entry.get("volcanoName") or entry.get("name", "Unknown")
                    lat = entry.get("latitude") or entry.get("lat")
                    lon = entry.get("longitude") or entry.get("lon")
                    if lat is not None and lon is not None:
                        current_volcanoes.append({
                            "name": name, "lat": float(lat), "lon": float(lon),
                            "status": "elevated", "alert": "UNKNOWN",
                        })
                source = "USGS VHAP"
                print(f"      USGS VHAP: {len(current_volcanoes)} volcanoes")
        except Exception as e:
            print(f"      USGS VHAP failed: {type(e).__name__}")

    # Cache result
    if current_volcanoes:
        ensure_dir(cache_file.parent)
        cache_file.write_text(json.dumps({"volcanoes": current_volcanoes, "source": source}), encoding="utf-8")

    # Count eruptions started in last 90 days (truly "new")
    new_eruption_count = 0
    if source == "Smithsonian GVP":
        try:
            cutoff_date = (now - timedelta(days=90)).strftime("%Y%m%d")
            url_recent = (
                f"{GVP_WFS_ERUPTIONS}?service=WFS&version=1.1.0"
                f"&request=GetFeature&typeName=GVP-VOTW:E3WebApp_Eruptions1960"
                f"&outputFormat=application%2Fjson&maxFeatures=100"
                f"&CQL_FILTER=StartDate>='{cutoff_date}'"
            )
            recent_data = fetch_json(url_recent, timeout_s=30, max_retries=2)
            new_eruption_count = len(recent_data.get("features", []))
            print(f"      New eruptions (last 90d): {new_eruption_count}")
        except Exception:
            pass

    # Compute dispersion
    dispersion_km = 0.0
    if len(current_volcanoes) >= 2:
        valid = [v for v in current_volcanoes if v["lat"] != 0 or v["lon"] != 0]
        if len(valid) >= 2:
            dists = []
            for i in range(len(valid)):
                for j in range(i + 1, len(valid)):
                    dists.append(haversine_km(valid[i]["lat"], valid[i]["lon"], valid[j]["lat"], valid[j]["lon"]))
            dispersion_km = np.mean(dists) if dists else 0.0

    # Append weekly snapshot
    new_row = pd.DataFrame([{
        "date": now.replace(tzinfo=None),
        "active_count": len(current_volcanoes),
        "new_eruptions": new_eruption_count,
        "dispersion_km": round(dispersion_km, 0),
    }])

    if history.empty:
        history = new_row
    else:
        history = pd.concat([history, new_row], ignore_index=True)
        history = history.sort_values("date").drop_duplicates(subset=["date"], keep="last").reset_index(drop=True)

    # Save history
    history.to_csv(history_file, index=False, date_format="%Y-%m-%d")
    print(f"    Saved {len(history)} weeks of volcanic history")

    return {"current_volcanoes": current_volcanoes, "history": history, "source": source}


def generate_volcanic_activity_json(volcanic_data: dict) -> dict:
    """Generate JSON output for volcanic activity channel."""
    history = volcanic_data.get("history", pd.DataFrame())
    current = volcanic_data.get("current_volcanoes", [])
    source = volcanic_data.get("source", "unknown")

    if history.empty:
        return {
            "labels": [], "active_count": [], "new_eruptions": [],
            "dispersion_km": [], "z_active_count": [], "current_volcanoes": [],
        }

    history = history.copy()
    history["z_active_count"] = robust_zscore(history["active_count"].astype(float), window=max(20, len(history) // 3))

    return {
        "labels": history["date"].dt.strftime("%Y-%m-%d").tolist(),
        "active_count": history["active_count"].tolist(),
        "new_eruptions": history["new_eruptions"].tolist(),
        "dispersion_km": [round(v, 0) if pd.notna(v) else None for v in history["dispersion_km"]],
        "z_active_count": [round(v, 4) if pd.notna(v) else None for v in history["z_active_count"]],
        "current_volcanoes": current[:50],  # Cap at 50 for JSON size
    }


# -------------------------
# Main Script
# -------------------------
def generate_time_range_datasets(kp_history, eop_all, mag_data_by_station, now, eop_baseline=None, lod_json=None, mag_json=None, deep_eq_daily=None):
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
                    "frd": mag_data_by_station.get("FRD", [])[start_idx:],
                    "brw": mag_data_by_station.get("BRW", [])[start_idx:],
                    "hon": mag_data_by_station.get("HON", [])[start_idx:],
                }
                # Compute composite for this range
                composite = []
                for i in range(len(mag_range_json["labels"])):
                    z_scores = []
                    for key in ["bou", "frd", "brw", "hon"]:
                        if i < len(mag_range_json.get(key, [])):
                            z_scores.append(mag_range_json[key][i])
                    if z_scores:
                        composite.append(sum(z_scores) / len(z_scores))
                    else:
                        composite.append(0)
                mag_range_json["composite"] = composite
                results[f"mag_{range_name}"] = mag_range_json

        # Deep seismicity data
        if deep_eq_daily is not None and not deep_eq_daily.empty:
            seis_json = generate_deep_seismicity_json(deep_eq_daily, days=days)
            if seis_json["labels"]:
                results[f"seis_{range_name}"] = seis_json

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
        # Filter bad data (99999 markers and statistical outliers)
        mag.loc[mag[col] >= 99999, col] = np.nan
        valid = mag[col].dropna()
        if len(valid) > 10:
            median_val = valid.median()
            mad_val = (valid - median_val).abs().median()
            if mad_val > 0:
                threshold = 5 * 1.4826 * mad_val
                mag.loc[(mag[col] - median_val).abs() > threshold, col] = np.nan
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

    # 3. Historical Ap index (last 50 years, from GFZ daily Ap)
    if not kp_history.empty and "Ap" in kp_history.columns:
        ap_annual = kp_history.set_index("date").resample("YE")["Ap"].mean()
        end_year = ap_annual.index[-1].year
        start_year = end_year - 50
        ap_subset = ap_annual[str(start_year):str(end_year)]
        aa_json = {
            "labels": [str(year) for year in ap_subset.index.year],
            "data": ap_subset.fillna(0).tolist()
        }
        (assets_dir / "historical_aa.json").write_text(json.dumps(aa_json))
        print("    [OK] historical_aa.json (Ap index)")

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
            # Compute robust z-scores over the full C20 history
            c20_all["z_c20"] = robust_zscore(c20_all["c20"], window=min(180, max(30, len(c20_all) // 3)))

            # For display, show last 5 years (C20 is ~monthly, so 90 days gives only ~3 points)
            cutoff_date = now - timedelta(days=5 * 365)
            c20_recent = c20_all[c20_all["date"] >= cutoff_date].copy()

            if not c20_recent.empty:
                c20_json = {
                    "labels": c20_recent["date"].dt.strftime("%Y-%m-%d").tolist(),
                    "data": [round(v, 4) if pd.notna(v) else None for v in c20_recent["z_c20"].tolist()]
                }
                oldest_date = c20_recent["date"].min()
                data_age_h = (now - oldest_date).total_seconds() / 3600.0
                c20_json = add_metadata(c20_json, "NASA GSFC (C20)", data_age_hours=data_age_h, source_status="ok")

                (assets_dir / "c20_data.json").write_text(json.dumps(c20_json))
                print(f"    [OK] c20_data.json ({len(c20_recent)} data points)")
        else:
            print("    Warning: C20 data unavailable")
    except Exception as e:
        print(f"    Warning: C20 fetch failed: {e}")

    # 5. Magnetometer data (last 60 days fetch + accumulated history)
    print("  Fetching magnetometer data...")
    end_time = now
    start_time = end_time - timedelta(days=60)

    # Load existing magnetometer history and clean bad data
    mag_history = load_mag_history(cache_dir)
    if not mag_history.empty:
        mag_history = clean_mag_history(mag_history)

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

        # Normalize using robust z-scores (median/MAD) over full history
        normalized_data = {}
        for station in ["BOU", "FRD", "BRW", "HON"]:
            if station in mag_history.columns:
                series = pd.to_numeric(mag_history[station], errors="coerce")
                z = robust_zscore(series, window=min(180, max(30, len(mag_history) // 3)))
                normalized_data[station] = [round(v, 4) if pd.notna(v) else 0 for v in z.tolist()]
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
            "frd": normalized_data.get("FRD", [])[recent_idx:],
            "brw": normalized_data.get("BRW", [])[recent_idx:],
            "hon": normalized_data.get("HON", [])[recent_idx:],
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

    # 6. Deep Seismicity (mantle stress proxy)
    print("  Fetching deep seismicity data...")
    deep_eq_daily = pd.DataFrame()
    try:
        deep_eq_daily, deep_eq_events = load_usgs_deep_seismicity(cache_dir, years=10)
        if not deep_eq_daily.empty:
            seis_json = generate_deep_seismicity_json(deep_eq_daily, days=90)
            seis_json = add_metadata(seis_json, "USGS FDSN (deep EQ)", source_status="ok")
            (assets_dir / "deep_seismicity_data.json").write_text(json.dumps(seis_json))
            print(f"    [OK] deep_seismicity_data.json ({len(seis_json['labels'])} days)")
        else:
            deep_eq_events = []
            print("    Warning: No deep seismicity data")

        # Generate individual events JSON for globe display
        if deep_eq_events:
            generate_seismic_events_json(deep_eq_events, assets_dir)
    except Exception as e:
        print(f"    Warning: Deep seismicity fetch failed: {e}")

    # 7. Volcanic Activity (global eruptions)
    print("  Fetching volcanic activity data...")
    try:
        volcanic_data = load_volcanic_activity(cache_dir)
        volc_json = generate_volcanic_activity_json(volcanic_data)
        volc_json = add_metadata(volc_json, volcanic_data.get("source", "USGS VHAP / Smithsonian GVP"), source_status="ok" if volcanic_data.get("current_volcanoes") else "failed")
        (assets_dir / "volcanic_activity_data.json").write_text(json.dumps(volc_json))
        n_volc = len(volcanic_data.get("current_volcanoes", []))
        print(f"    [OK] volcanic_activity_data.json ({n_volc} active volcanoes)")
    except Exception as e:
        print(f"    Warning: Volcanic activity fetch failed: {e}")

    # 8. Polar Motion (spiral plot + Chandler wobble)
    print("  Generating polar motion data...")
    try:
        generate_polar_motion_json(eop_all, assets_dir)
    except Exception as e:
        print(f"    Warning: Polar motion generation failed: {e}")

    # 9. Generate time-range datasets (30d, 90d, 1y, 5y, 10y)
    print("  Generating multi-range datasets...")
    # Pass eop_baseline (with z-scores) for proper EOP data in time ranges
    time_range_data = generate_time_range_datasets(kp_history, eop_all, normalized_mag_data, now, eop_baseline=eop_baseline, lod_json=lod_json, mag_json=mag_json, deep_eq_daily=deep_eq_daily)

    for dataset_name, dataset in time_range_data.items():
        filepath = assets_dir / f"{dataset_name}.json"
        filepath.write_text(json.dumps(dataset))
        print(f"    [OK] {dataset_name}.json")

    # 10. Cross-channel coherence analysis
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
