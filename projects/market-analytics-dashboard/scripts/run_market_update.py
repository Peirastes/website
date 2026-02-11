#!/usr/bin/env python3
"""
SPECTRUM Market Analytics - Scheduled Update Runner
Wrapper script with logging, error handling, status tracking, and git push.

Run this via Task Scheduler for automatic market data updates.

Usage:
    python run_market_update.py              # Full update + git push
    python run_market_update.py --no-push    # Update without pushing
    python run_market_update.py --quick      # Skip historical data
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
WEBSITE_ROOT = PROJECT_ROOT.parent.parent  # C:\Users\Cole\Dropbox\Website
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
LOGS_DIR = PROJECT_ROOT / "logs"
ASSETS_DIR = PROJECT_ROOT / "assets"

DATA_SCRIPT = SCRIPTS_DIR / "generate_market_data.py"
STATUS_FILE = LOGS_DIR / "last_run_status.json"

TIMEOUT_SECONDS = 300  # 5 minutes max
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# ===== LOGGING SETUP =====
log_filename = LOGS_DIR / f"market_update_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.log"

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


def is_market_hours():
    """Check if US markets are currently open (roughly)."""
    from datetime import time
    now = datetime.now()
    # US Eastern time approximation (not accounting for DST perfectly)
    # Markets: 9:30 AM - 4:00 PM ET, Mon-Fri
    weekday = now.weekday()
    if weekday >= 5:  # Saturday or Sunday
        return False
    # Rough check - adjust for your timezone
    hour = now.hour
    return 6 <= hour <= 20  # Wide window to catch market activity


def run_data_generator():
    """Run the data generation script."""
    logger.info("=" * 60)
    logger.info("SPECTRUM Market Data Update")
    logger.info("=" * 60)
    logger.info(f"Start time: {datetime.now(timezone.utc).isoformat()}")
    logger.info(f"Log file: {log_filename}")

    start_time = datetime.now(timezone.utc)
    success = False
    error_msg = None

    try:
        result = subprocess.run(
            [sys.executable, str(DATA_SCRIPT)],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            cwd=str(SCRIPTS_DIR)
        )

        if result.returncode == 0:
            logger.info("[OK] Data generation completed successfully")
            success = True
        else:
            logger.warning(f"[WARN] Data generation exited with code {result.returncode}")
            if result.stderr:
                error_msg = result.stderr[:500]
                logger.warning(f"Error output: {error_msg}")

        # Log output
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                logger.info(f"  {line}")

    except subprocess.TimeoutExpired:
        error_msg = f"Timeout after {TIMEOUT_SECONDS} seconds"
        logger.error(f"[ERROR] {error_msg}")
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[ERROR] Failed to run data generator: {e}")

    # Calculate duration
    duration = (datetime.now(timezone.utc) - start_time).total_seconds()

    # Write status file
    status = {
        "lastRun": start_time.isoformat(),
        "duration": round(duration, 1),
        "success": success,
        "error": error_msg,
        "logFile": str(log_filename.name),
        "marketHours": is_market_hours(),
    }

    try:
        with open(STATUS_FILE, 'w') as f:
            json.dump(status, f, indent=2)
    except Exception as e:
        logger.warning(f"Failed to write status file: {e}")

    logger.info("=" * 60)
    logger.info(f"Completed in {duration:.1f}s - {'SUCCESS' if success else 'FAILED'}")
    logger.info("=" * 60)

    return 0 if success else 1


def cleanup_old_logs(keep_days=7):
    """Remove log files older than keep_days."""
    cutoff = datetime.now() - timedelta(days=keep_days)
    removed = 0

    for log_file in LOGS_DIR.glob("market_update_*.log"):
        try:
            # Parse date from filename
            date_str = log_file.stem.replace("market_update_", "")[:8]
            file_date = datetime.strptime(date_str, "%Y%m%d")
            if file_date < cutoff:
                log_file.unlink()
                removed += 1
        except (ValueError, OSError):
            pass

    if removed > 0:
        logger.info(f"Cleaned up {removed} old log files")


def git_commit_and_push():
    """Commit and push the updated data to GitHub."""
    logger.info("Committing and pushing to GitHub...")

    try:
        # Change to website root for git operations
        os.chdir(WEBSITE_ROOT)

        # Check if there are changes to commit (assets, dist, or logs)
        paths_to_stage = [
            "projects/market-analytics-dashboard/assets/",
            "projects/market-analytics-dashboard/dist/market_data.json",
            "projects/market-analytics-dashboard/dist/intel_briefs.json",
            "projects/market-analytics-dashboard/logs/",
        ]
        status_result = subprocess.run(
            ["git", "status", "--porcelain", "--"] + paths_to_stage,
            capture_output=True,
            text=True,
            timeout=30
        )

        if not status_result.stdout.strip():
            logger.info("No changes to commit")
            return True

        # Stage assets, dist data files, and logs
        subprocess.run(
            ["git", "add", "--"] + paths_to_stage,
            check=True,
            timeout=30
        )

        # Create commit message with timestamp
        now = datetime.now()
        commit_msg = f"SPECTRUM data update: {now.strftime('%Y-%m-%d %H:%M')}"

        subprocess.run(
            ["git", "commit", "-m", commit_msg],
            check=True,
            timeout=30
        )

        # Push to origin
        result = subprocess.run(
            ["git", "push", "origin", "master"],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            logger.info("[OK] Changes pushed to GitHub")
            return True
        else:
            logger.warning(f"[WARN] Push may have failed: {result.stderr}")
            return False

    except subprocess.CalledProcessError as e:
        logger.error(f"[ERROR] Git operation failed: {e}")
        return False
    except subprocess.TimeoutExpired:
        logger.error("[ERROR] Git operation timed out")
        return False
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error during git push: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="SPECTRUM Market Data Updater")
    parser.add_argument("--quick", action="store_true", help="Quick update (skip historical)")
    parser.add_argument("--no-push", action="store_true", help="Don't push to GitHub")
    args = parser.parse_args()

    # Cleanup old logs first
    cleanup_old_logs()

    # Run the update
    result = run_data_generator()

    # If successful and not --no-push, commit and push
    if result == 0 and not args.no_push:
        git_commit_and_push()

    return result


if __name__ == "__main__":
    sys.exit(main())
