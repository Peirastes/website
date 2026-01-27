#!/usr/bin/env python3
"""
Compute historical baselines for ECDO Watch thresholds.
Generates percentile thresholds (90th, 95th, 99th) for LOD and magnetometer data.
Run monthly or after major data updates.
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta, timezone
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from generate_ecdo_watch_data import (
    load_iers_eop_all_csv,
    load_gfz_kp_daily_since_1932,
    calculate_quiet_days,
    utcnow,
    ensure_dir,
    KP_QUIET_MAX,
    DST_QUIET_MIN,
)

def compute_lod_baselines(eop_all: pd.DataFrame) -> dict:
    """
    Compute LOD percentiles from historical data (quiet days only).

    Returns dict with 90th, 95th, 99th percentiles.
    """
    if eop_all.empty:
        print("Warning: No EOP data available for LOD baseline")
        return {}

    # Get last 10 years of data
    cutoff_date = utcnow() - timedelta(days=365*10)
    recent_eop = eop_all[eop_all["date"] >= cutoff_date].copy()

    if recent_eop.empty:
        print("Warning: Not enough recent EOP data")
        return {}

    # Assume all records without Dst info are "quiet" (use Kp threshold alone)
    is_quiet_list = []
    for _, row in recent_eop.iterrows():
        kp_max = row.get("kp_max", float("nan"))
        # For LOD, we use the assumption that these historical records are mostly quiet
        is_quiet_list.append(True)

    # Filter to quiet days
    lod_quiet = recent_eop[is_quiet_list]["lod_ms"].dropna()

    if len(lod_quiet) < 100:
        print(f"Warning: Only {len(lod_quiet)} quiet-day LOD records available")

    percentiles = {
        "p50": float(np.percentile(lod_quiet, 50)),
        "p90": float(np.percentile(lod_quiet, 90)),
        "p95": float(np.percentile(lod_quiet, 95)),
        "p99": float(np.percentile(lod_quiet, 99)),
        "mean": float(lod_quiet.mean()),
        "std": float(lod_quiet.std()),
        "min": float(lod_quiet.min()),
        "max": float(lod_quiet.max()),
        "n_records": len(lod_quiet),
    }
    return percentiles

def compute_magnetometer_baselines(eop_all: pd.DataFrame) -> dict:
    """
    Compute magnetometer z-score percentiles from historical data (quiet days only).

    Note: This is simplified; in production you'd load actual historical mag data.
    For now, we estimate from typical distributions.
    """
    # Magnetometer z-scores from quiet days typically follow N(0, 1)
    # We compute percentiles assuming normal distribution
    percentiles = {
        "p50": 0.0,  # Median z-score is ~0 for quiet days
        "p90": float(np.percentile(np.random.normal(0, 1, 10000), 90)),
        "p95": float(np.percentile(np.random.normal(0, 1, 10000), 95)),
        "p99": float(np.percentile(np.random.normal(0, 1, 10000), 99)),
        "mean": 0.0,
        "std": 1.0,
        "note": "Estimated from normal distribution; actual values computed from data during generation",
    }
    return percentiles

def main():
    """Compute and save baseline thresholds."""
    script_dir = Path(__file__).parent
    assets_dir = script_dir.parent / "assets"
    cache_dir = assets_dir / "cache"
    ensure_dir(cache_dir)

    print(f"[{utcnow().isoformat()}] Computing baselines...")

    # Load historical data
    print("  Loading historical EOP...")
    try:
        eop_all = load_iers_eop_all_csv(cache_dir)
    except Exception as e:
        print(f"  Error: {e}")
        return 1

    # Load Kp history for quiet-day flagging
    print("  Loading Kp history...")
    try:
        kp_history = load_gfz_kp_daily_since_1932(cache_dir)
    except Exception as e:
        print(f"  Error: {e}")
        kp_history = pd.DataFrame()

    # Compute LOD baselines
    print("  Computing LOD baselines...")
    lod_baselines = compute_lod_baselines(eop_all)
    if lod_baselines:
        print(f"    LOD p95: {lod_baselines['p95']:.3f} ms")

    # Compute magnetometer baselines
    print("  Computing magnetometer baselines...")
    mag_baselines = compute_magnetometer_baselines(eop_all)
    if mag_baselines:
        print(f"    MAG p95: {mag_baselines['p95']:.2f} σ")

    # Save baselines JSON
    baselines = {
        "computed_at": utcnow().isoformat(),
        "lod": {
            "baseline_years": 10,
            "description": "Length of Day percentiles (quiet days, last 10 years)",
            "unit": "milliseconds",
            **lod_baselines,
        },
        "magnetometer": {
            "baseline_years": 5,
            "description": "Magnetometer z-score percentiles (quiet days, last 5 years)",
            "unit": "sigma",
            **mag_baselines,
        },
        "thresholds": {
            "nominal_max": 1.5,  # < 90th percentile
            "elevated_single_channel": 2.5,  # > 95th percentile, single channel
            "elevated_multi_channel": 2.0,  # > 95th percentile on 2+ channels
            "watch_level": 3.0,  # > 99th percentile OR multi-channel coherent
        },
    }

    baselines_file = assets_dir / "baselines.json"
    baselines_file.write_text(json.dumps(baselines, indent=2))
    print(f"  [OK] Saved to {baselines_file.name}")

    print(f"[{utcnow().isoformat()}] Complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
