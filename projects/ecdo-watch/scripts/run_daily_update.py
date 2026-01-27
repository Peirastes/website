#!/usr/bin/env python3
"""
ECDO Watch Daily Update Wrapper
Handles scheduled data generation with logging, error recovery, and notifications
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
import subprocess
import traceback

# ===== CONFIG =====
PROJECT_ROOT = Path(__file__).parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
ASSETS_DIR = PROJECT_ROOT / "assets"
LOGS_DIR = PROJECT_ROOT / "logs"
DATA_SCRIPT = SCRIPTS_DIR / "generate_ecdo_watch_data.py"
STATUS_FILE = LOGS_DIR / "last_run_status.json"

TIMEOUT_SECONDS = 600  # 10 minutes max for script to complete (USGS/IERS can be slow)
HEALTHY_MAX_AGE_HOURS = 24

# ===== LOGGING SETUP =====
LOGS_DIR.mkdir(parents=True, exist_ok=True)

log_filename = LOGS_DIR / f"ecdo_watch_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s UTC] %(levelname)-8s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(log_filename, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# ===== HELPERS =====

def utcnow():
    return datetime.now(timezone.utc)

def is_data_healthy():
    """Check if essential data files are fresh (< 24 hours old)."""
    essential_files = [
        ASSETS_DIR / "kp_data.json",
        ASSETS_DIR / "lod_data.json",
        ASSETS_DIR / "mag_data.json",
    ]

    for fpath in essential_files:
        if not fpath.exists():
            logger.warning(f"Missing file: {fpath}")
            return False

        mtime = datetime.fromtimestamp(fpath.stat().st_mtime, tz=timezone.utc)
        age_hours = (utcnow() - mtime).total_seconds() / 3600

        if age_hours > HEALTHY_MAX_AGE_HOURS:
            logger.warning(f"File stale ({age_hours:.1f}h): {fpath.name}")
            return False

    return True

def save_status(status_dict):
    """Save last run status to JSON."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    status_dict["timestamp"] = utcnow().isoformat()
    STATUS_FILE.write_text(json.dumps(status_dict, indent=2), encoding='utf-8')

def load_status():
    """Load last run status."""
    if STATUS_FILE.exists():
        try:
            return json.loads(STATUS_FILE.read_text(encoding='utf-8'))
        except Exception as e:
            logger.error(f"Failed to load status file: {e}")
    return {}

def run_data_generation():
    """Execute the main data generation script."""
    logger.info("=" * 70)
    logger.info("ECDO Watch Daily Update Started")
    logger.info("=" * 70)

    if not DATA_SCRIPT.exists():
        logger.error(f"Data script not found: {DATA_SCRIPT}")
        return False

    logger.info(f"Running: {DATA_SCRIPT}")

    try:
        result = subprocess.run(
            [sys.executable, str(DATA_SCRIPT)],
            cwd=str(SCRIPTS_DIR),
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS
        )

        # Log stdout
        if result.stdout:
            for line in result.stdout.splitlines():
                logger.info(line)

        # Log stderr
        if result.stderr:
            for line in result.stderr.splitlines():
                logger.warning(line)

        if result.returncode != 0:
            logger.error(f"Script exited with code {result.returncode}")
            return False

        logger.info("Data generation completed successfully")
        return True

    except subprocess.TimeoutExpired:
        logger.error(f"Script timeout after {TIMEOUT_SECONDS} seconds")
        return False
    except Exception as e:
        logger.error(f"Exception during script execution: {e}")
        logger.error(traceback.format_exc())
        return False

def validate_output():
    """Validate that essential output files exist and contain data."""
    logger.info("Validating output files...")

    essential_files = [
        ASSETS_DIR / "kp_data.json",
        ASSETS_DIR / "lod_data.json",
        ASSETS_DIR / "mag_data.json",
    ]

    all_valid = True
    for fpath in essential_files:
        if not fpath.exists():
            logger.error(f"Missing output: {fpath.name}")
            all_valid = False
            continue

        try:
            data = json.loads(fpath.read_text(encoding='utf-8'))

            # Check for labels (required in all files)
            if "labels" not in data:
                logger.error(f"Invalid format: {fpath.name} (missing labels)")
                all_valid = False
                continue

            # Validate file-specific structure
            if fpath.name == "mag_data.json":
                # Magnetometer has station fields instead of generic "data"
                required_fields = {"bou", "hon", "sjg", "composite"}
                if not all(field in data for field in required_fields):
                    logger.error(f"Invalid format: {fpath.name} (missing station fields)")
                    all_valid = False
                else:
                    n_points = len(data.get("composite", []))
                    logger.info(f"[OK] {fpath.name}: {n_points} data points")
            else:
                # Kp and LOD have generic "data" field
                if "data" not in data:
                    logger.error(f"Invalid format: {fpath.name} (missing data field)")
                    all_valid = False
                else:
                    n_points = len(data.get("data", []))
                    logger.info(f"[OK] {fpath.name}: {n_points} data points")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {fpath.name} ({e})")
            all_valid = False
        except Exception as e:
            logger.error(f"Error reading {fpath.name}: {e}")
            all_valid = False

    return all_valid

def check_data_freshness():
    """Report on data freshness."""
    logger.info("Data freshness check:")

    for fpath in sorted(ASSETS_DIR.glob("*.json")):
        try:
            mtime = datetime.fromtimestamp(fpath.stat().st_mtime, tz=timezone.utc)
            age_hours = (utcnow() - mtime).total_seconds() / 3600
            age_str = f"{age_hours:.1f}h" if age_hours < 24 else f"{age_hours/24:.1f}d"
            logger.info(f"  {fpath.name:30s} {age_str:>8s}")
        except Exception as e:
            logger.error(f"  {fpath.name:30s} ERROR: {e}")

def main():
    """Main entry point."""
    start_time = utcnow()

    try:
        # 1. Run data generation
        success = run_data_generation()

        if not success:
            logger.error("Data generation FAILED")
            save_status({
                "success": False,
                "error": "Data generation script failed",
                "duration_seconds": (utcnow() - start_time).total_seconds()
            })
            return 1

        # 2. Validate output
        if not validate_output():
            logger.error("Output validation FAILED")
            save_status({
                "success": False,
                "error": "Output validation failed",
                "duration_seconds": (utcnow() - start_time).total_seconds()
            })
            return 1

        # 3. Check data health
        check_data_freshness()

        if not is_data_healthy():
            logger.warning("Data health check FAILED (some files are stale)")
            save_status({
                "success": False,
                "error": "Data health check failed - files are stale",
                "duration_seconds": (utcnow() - start_time).total_seconds()
            })
            return 1

        # 4. Success
        duration = (utcnow() - start_time).total_seconds()
        logger.info("=" * 70)
        logger.info(f"[OK] ECDO Watch Update SUCCESSFUL ({duration:.1f}s)")
        logger.info("=" * 70)

        save_status({
            "success": True,
            "duration_seconds": duration,
            "timestamp_utc": utcnow().isoformat()
        })

        return 0

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        logger.error(traceback.format_exc())
        save_status({
            "success": False,
            "error": str(e),
            "duration_seconds": (utcnow() - start_time).total_seconds()
        })
        return 1

if __name__ == "__main__":
    sys.exit(main())
