#!/usr/bin/env python3
"""
ECDO Watch Health Check
Quick status verification without running full data generation
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# ===== CONFIG =====
PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
LOGS_DIR = PROJECT_ROOT / "logs"
STATUS_FILE = LOGS_DIR / "last_run_status.json"

# ===== HELPERS =====
def utcnow():
    return datetime.now(timezone.utc)

def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def print_status(label, status, detail=""):
    icon = "[OK]" if status else "[FAIL]"
    color_code = "\033[92m" if status else "\033[91m"  # Green or Red
    reset_code = "\033[0m"
    detail_str = f" ({detail})" if detail else ""
    print(f"{color_code}{icon} {label}{detail_str}{reset_code}")

def print_info(label, value):
    print(f"  {label}: {value}")

def check_file_exists(filepath, description):
    """Check if a file exists and report its age."""
    exists = filepath.exists()
    if exists:
        mtime = datetime.fromtimestamp(filepath.stat().st_mtime, tz=timezone.utc)
        age_hours = (utcnow() - mtime).total_seconds() / 3600

        if age_hours < 1:
            age_str = f"{int(age_hours * 60)} minutes"
            status = True
        elif age_hours < 24:
            age_str = f"{age_hours:.1f} hours"
            status = True
        elif age_hours < 48:
            age_str = f"{age_hours/24:.1f} days"
            status = False  # Warning
        else:
            age_str = f"{age_hours/24:.1f} days (STALE)"
            status = False  # Error

        print_status(description, status, age_str)
        return True
    else:
        print_status(description, False, "NOT FOUND")
        return False

def validate_json(filepath):
    """Validate JSON file structure."""
    try:
        with open(filepath) as f:
            data = json.load(f)

        # Check required fields
        required = ["labels", "data"]
        missing = [f for f in required if f not in data]

        if missing:
            return False, f"Missing fields: {missing}"

        if len(data["labels"]) != len(data["data"]):
            return False, f"Labels/data mismatch: {len(data['labels'])} vs {len(data['data'])}"

        return True, f"{len(data['data'])} data points"
    except json.JSONDecodeError as e:
        return False, f"JSON error: {e}"
    except Exception as e:
        return False, f"Error: {e}"

# ===== MAIN CHECKS =====

def check_status_file():
    """Check last run status."""
    print_header("Last Run Status")

    if not STATUS_FILE.exists():
        print_status("Status file exists", False, "NOT FOUND")
        return False

    try:
        status = json.load(open(STATUS_FILE))
        success = status.get("success", False)
        duration = status.get("duration_seconds", "?")
        timestamp = status.get("timestamp_utc", "?")

        print_status("Last run successful", success, f"{duration}s on {timestamp}")

        if not success:
            error = status.get("error", "Unknown error")
            print_info("Error", error)

        return success
    except Exception as e:
        print_status("Status file readable", False, str(e))
        return False

def check_data_files():
    """Check data file freshness and validity."""
    print_header("Data Files")

    essential_files = {
        "kp_data.json": "Kp Index (14-day)",
        "lod_data.json": "LOD (90-day)",
        "mag_data.json": "Magnetometer (60-day)",
    }

    all_ok = True
    for filename, description in essential_files.items():
        filepath = ASSETS_DIR / filename
        if check_file_exists(filepath, description):
            valid, detail = validate_json(filepath)
            if valid:
                print_info(f"  {filename}", detail)
            else:
                print_status(f"  {filename} valid", False, detail)
                all_ok = False
        else:
            all_ok = False

    return all_ok

def check_json_data_quality():
    """Sample-check JSON data quality."""
    print_header("Data Quality")

    try:
        # Check Kp
        with open(ASSETS_DIR / "kp_data.json") as f:
            kp = json.load(f)
        kp_values = kp.get("data", [])
        if kp_values:
            kp_range = (min(v for v in kp_values if v is not None),
                       max(v for v in kp_values if v is not None))
            kp_mean = sum(v for v in kp_values if v is not None) / len([v for v in kp_values if v is not None])
            print_info("Kp range", f"{kp_range[0]:.1f} to {kp_range[1]:.1f}")
            print_info("Kp mean", f"{kp_mean:.2f}")

            if kp_range[1] > 9:
                print_status("Kp range valid", False, f"Max > 9 (impossible)")
            else:
                print_status("Kp range valid", True, "0-9 range OK")

        # Check LOD
        with open(ASSETS_DIR / "lod_data.json") as f:
            lod = json.load(f)
        lod_values = lod.get("data", [])
        if lod_values:
            lod_valid = [v for v in lod_values if v is not None]
            if lod_valid:
                lod_range = (min(lod_valid), max(lod_valid))
                lod_mean = sum(lod_valid) / len(lod_valid)
                print_info("LOD range", f"{lod_range[0]:.2f} to {lod_range[1]:.2f} ms")
                print_info("LOD mean", f"{lod_mean:.2f} ms")

                if abs(lod_range[0]) > 10 or abs(lod_range[1]) > 10:
                    print_status("LOD range valid", False, f"Extreme values detected")
                else:
                    print_status("LOD range valid", True, "±10 ms OK")

        # Check Magnetometer
        with open(ASSETS_DIR / "mag_data.json") as f:
            mag = json.load(f)
        mag_composite = mag.get("composite", [])
        if mag_composite:
            mag_valid = [v for v in mag_composite if v is not None]
            if mag_valid:
                mag_range = (min(mag_valid), max(mag_valid))
                print_info("MAG composite range", f"{mag_range[0]:.2f} to {mag_range[1]:.2f} (z-score)")

                # Check for extreme spikes
                max_abs = max(abs(v) for v in mag_valid)
                if max_abs >= 2.5:
                    print_status("MAG extremes", True, f"Max {max_abs:.2f} sigma detected (anomaly candidate)")
                else:
                    print_status("MAG normal", True, f"All below 2.5 sigma")

        return True
    except Exception as e:
        print_status("Data quality check", False, str(e))
        return False

def check_logs():
    """Check for recent errors in logs."""
    print_header("Recent Log Status")

    if not LOGS_DIR.exists():
        print_status("Logs directory exists", False)
        return False

    log_files = sorted(LOGS_DIR.glob("ecdo_watch_*.log"), reverse=True)

    if not log_files:
        print_status("Log files exist", False, "NO LOGS FOUND")
        return False

    latest_log = log_files[0]
    print_status("Latest log found", True, latest_log.name)

    # Check for errors
    try:
        with open(latest_log) as f:
            content = f.read()

        error_count = content.count("ERROR")
        warning_count = content.count("WARNING")
        success = "SUCCESSFUL" in content

        print_info("Errors", error_count)
        print_info("Warnings", warning_count)
        print_status("Completed successfully", success)

        return success
    except Exception as e:
        print_status("Log readable", False, str(e))
        return False

# ===== SUMMARY =====

def main():
    """Run all checks."""
    print("\n" + "="*70)
    print(f"  ECDO Watch Health Check — {utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("="*70)

    results = []

    # Run checks
    results.append(("Status File", check_status_file()))
    results.append(("Data Files", check_data_files()))
    results.append(("Data Quality", check_json_data_quality()))
    results.append(("Logs", check_logs()))

    # Summary
    print_header("Summary")

    for name, result in results:
        print_status(name, result)

    all_ok = all(r for _, r in results)

    print("\n" + "="*70)
    if all_ok:
        print("  [OK] All checks passed — System healthy")
        exit_code = 0
    else:
        print("  [FAIL] Some checks failed — Review above for issues")
        exit_code = 1
    print("="*70 + "\n")

    return exit_code

if __name__ == "__main__":
    sys.exit(main())
