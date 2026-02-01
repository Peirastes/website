#!/usr/bin/env python3
"""
ECDO Watch Master Daily Run
One-button automation for everything:
  - Daily data generation
  - Validation study check (if Phase 2 data available)
  - Status report
  - Logging

Run this daily via Task Scheduler or manually from command line.

Usage:
    python master_daily_run.py              # Run all tasks
    python master_daily_run.py --quick      # Skip validation analysis
    python master_daily_run.py --validate   # Validation study only
"""

import os
import sys
import json
import logging
import subprocess
from pathlib import Path
from datetime import datetime, timezone, timedelta
import argparse

# ===== CONFIG =====
PROJECT_ROOT = Path(__file__).parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
LOGS_DIR = PROJECT_ROOT / "logs"
ASSETS_DIR = PROJECT_ROOT / "assets"
VALIDATION_DIR = PROJECT_ROOT / "validation"

DATA_SCRIPT = SCRIPTS_DIR / "run_daily_update.py"
VALIDATION_SCRIPT = VALIDATION_DIR / "validation_study.py"
HEALTHCHECK_SCRIPT = SCRIPTS_DIR / "healthcheck.py"
OPERATIONS_LOG = PROJECT_ROOT / "operations_log.md"

STATUS_FILE = LOGS_DIR / "master_run_status.json"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# ===== LOGGING SETUP =====
log_filename = LOGS_DIR / f"master_daily_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(log_filename, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# ===== MAIN EXECUTION =====

def run_command(name, script_path, timeout_seconds=600):
    """Run a Python script and return success/failure."""
    logger.info(f"Running: {name}")

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            cwd=str(SCRIPTS_DIR)
        )

        if result.returncode == 0:
            logger.info(f"✓ {name} completed successfully")
            return True
        else:
            logger.warning(f"⚠ {name} exited with code {result.returncode}")
            if result.stderr:
                logger.warning(f"  Error: {result.stderr[:200]}")
            return False

    except subprocess.TimeoutExpired:
        logger.error(f"✗ {name} timed out after {timeout_seconds}s")
        return False
    except Exception as e:
        logger.error(f"✗ {name} failed: {str(e)}")
        return False

def check_data_freshness():
    """Verify all data files are fresh and valid."""
    logger.info("Checking data freshness...")

    critical_files = [
        ASSETS_DIR / "kp_30d.json",
        ASSETS_DIR / "lod_30d.json",
        ASSETS_DIR / "mag_30d.json",
    ]

    max_age_hours = 24
    now = datetime.now(timezone.utc)
    all_fresh = True

    for filepath in critical_files:
        if not filepath.exists():
            logger.warning(f"  Missing: {filepath.name}")
            all_fresh = False
            continue

        age_hours = (now - datetime.fromtimestamp(filepath.stat().st_mtime, tz=timezone.utc)).total_seconds() / 3600

        if age_hours < max_age_hours:
            logger.info(f"  ✓ {filepath.name} is {age_hours:.1f}h old")
        else:
            logger.warning(f"  ⚠ {filepath.name} is {age_hours:.1f}h old (threshold: {max_age_hours}h)")
            all_fresh = False

    return all_fresh

def get_anomaly_summary():
    """Extract latest anomalies from operations_log.md if available."""
    if not OPERATIONS_LOG.exists():
        return None

    try:
        with open(OPERATIONS_LOG, 'r') as f:
            content = f.read()

        # Count entries in main anomaly log table
        import re
        pattern = r'\| (202\d-\d{2}-\d{2})'
        matches = re.findall(pattern, content)

        if matches:
            latest_date = sorted(matches)[-1]
            count = len(matches)
            return {
                'total_anomalies_documented': count,
                'latest_documentation': latest_date
            }
    except Exception as e:
        logger.warning(f"Could not read operations_log.md: {e}")

    return None

def run_master_cycle(skip_validation=False):
    """Run complete daily automation cycle."""

    logger.info("=" * 70)
    logger.info("ECDO WATCH MASTER DAILY RUN")
    logger.info(f"Started: {datetime.now(timezone.utc).isoformat()}")
    logger.info("=" * 70)

    results = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'steps': {},
        'summary': {}
    }

    # Step 1: Daily Data Generation
    logger.info("\n[1/3] Daily Data Generation")
    logger.info("-" * 70)
    step1_success = run_command("Daily Data Generation", DATA_SCRIPT, timeout_seconds=600)
    results['steps']['data_generation'] = step1_success

    if not step1_success:
        logger.error("✗ Data generation failed - aborting")
        results['summary']['status'] = 'FAILED'
        return results

    # Step 2: Data Freshness Check
    logger.info("\n[2/3] Data Validation")
    logger.info("-" * 70)
    freshness_ok = check_data_freshness()
    results['steps']['data_freshness'] = freshness_ok

    if not freshness_ok:
        logger.warning("⚠ Some data files are stale or missing")

    # Step 3: Optional - Validation Study Analysis (Phase 2+)
    if not skip_validation:
        logger.info("\n[3/3] Validation Analysis (Optional)")
        logger.info("-" * 70)

        if VALIDATION_SCRIPT.exists() and OPERATIONS_LOG.exists():
            step3_success = run_command("Validation Study", VALIDATION_SCRIPT, timeout_seconds=300)
            results['steps']['validation_analysis'] = step3_success
        else:
            logger.info("  (Skipped - Phase 1 data collection ongoing)")
            results['steps']['validation_analysis'] = 'skipped'

    # Health Summary
    logger.info("\n[SUMMARY]")
    logger.info("-" * 70)

    anomaly_summary = get_anomaly_summary()
    if anomaly_summary:
        logger.info(f"Operations Log: {anomaly_summary['total_anomalies_documented']} anomalies documented")
        logger.info(f"Latest entry: {anomaly_summary['latest_documentation']}")
        results['summary']['operations_log'] = anomaly_summary

    # Overall Status
    overall_success = step1_success and freshness_ok
    results['summary']['status'] = 'SUCCESS' if overall_success else 'PARTIAL'
    results['summary']['message'] = (
        '✓ All systems nominal' if overall_success
        else '⚠ Completed with warnings - check logs'
    )

    logger.info(f"Status: {results['summary']['message']}")
    logger.info(f"Log: {log_filename}")
    logger.info("=" * 70)

    return results

def save_status(results):
    """Save execution results to JSON."""
    try:
        with open(STATUS_FILE, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Status saved: {STATUS_FILE}")
    except Exception as e:
        logger.error(f"Failed to save status: {e}")

def main():
    parser = argparse.ArgumentParser(description='ECDO Watch Master Daily Run')
    parser.add_argument('--quick', action='store_true', help='Skip validation analysis')
    parser.add_argument('--validate-only', action='store_true', help='Run validation analysis only')
    args = parser.parse_args()

    try:
        if args.validate_only:
            logger.info("Running validation analysis only...")
            results = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'mode': 'validation_only'
            }
            success = run_command("Validation Study", VALIDATION_SCRIPT, timeout_seconds=300)
            results['validation_analysis'] = 'SUCCESS' if success else 'FAILED'
        else:
            results = run_master_cycle(skip_validation=args.quick)

        save_status(results)

        # Exit code
        if results['summary'].get('status') == 'SUCCESS':
            sys.exit(0)
        else:
            sys.exit(1)

    except Exception as e:
        logger.error(f"Master cycle failed: {e}")
        save_status({
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'status': 'FAILED',
            'error': str(e)
        })
        sys.exit(1)

if __name__ == '__main__':
    main()
