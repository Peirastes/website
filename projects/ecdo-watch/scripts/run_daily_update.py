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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

# ===== CONFIG =====
PROJECT_ROOT = Path(__file__).parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
ASSETS_DIR = PROJECT_ROOT / "assets"
LOGS_DIR = PROJECT_ROOT / "logs"
DATA_SCRIPT = SCRIPTS_DIR / "generate_ecdo_watch_data.py"
STATUS_FILE = LOGS_DIR / "last_run_status.json"

TIMEOUT_SECONDS = 900  # 15 minutes max for script to complete (USGS/IERS can be slow)
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

def load_alert_config():
    """Load alert configuration."""
    config_file = SCRIPTS_DIR / "alert_config.json"
    if config_file.exists():
        try:
            return json.loads(config_file.read_text(encoding='utf-8'))
        except Exception as e:
            logger.warning(f"Failed to load alert config: {e}")
    return {}

def send_email_alert(subject: str, message: str, alert_config: dict):
    """Send email alert."""
    if not alert_config or not alert_config.get("email", {}).get("enabled"):
        return False

    try:
        email_config = alert_config["email"]
        recipients = email_config.get("to_addresses", [])
        if not recipients:
            logger.warning("No email recipients configured")
            return False

        msg = MIMEMultipart()
        msg["From"] = email_config["from_address"]
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.attach(MIMEText(message, "plain"))

        with smtplib.SMTP(email_config["smtp_server"], email_config["smtp_port"]) as server:
            if email_config.get("use_tls"):
                server.starttls()
            server.login(email_config["username"], email_config["password"])
            server.send_message(msg)

        logger.info(f"Email alert sent to {len(recipients)} recipient(s)")
        return True
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")
        return False

def send_webhook_alert(message: str, alert_config: dict):
    """Send webhook alerts (Slack/Discord)."""
    if not alert_config:
        return False

    success = False

    # Slack webhook
    slack_config = alert_config.get("webhooks", {}).get("slack", {})
    if slack_config.get("enabled") and slack_config.get("url"):
        try:
            payload = {
                "channel": slack_config.get("channel", "#alerts"),
                "username": slack_config.get("username", "ECDO Watch"),
                "text": message,
                "icon_emoji": ":warning:"
            }
            resp = requests.post(slack_config["url"], json=payload, timeout=10)
            if resp.status_code == 200:
                logger.info("Slack webhook sent successfully")
                success = True
        except Exception as e:
            logger.error(f"Failed to send Slack webhook: {e}")

    # Discord webhook
    discord_config = alert_config.get("webhooks", {}).get("discord", {})
    if discord_config.get("enabled") and discord_config.get("url"):
        try:
            payload = {
                "content": message,
                "username": "ECDO Watch"
            }
            resp = requests.post(discord_config["url"], json=payload, timeout=10)
            if resp.status_code in [200, 204]:
                logger.info("Discord webhook sent successfully")
                success = True
        except Exception as e:
            logger.error(f"Failed to send Discord webhook: {e}")

    return success

def send_alerts(alert_type: str, error_message: str = "", alert_config: dict = None, **kwargs):
    """Send alerts based on type and configuration.

    Template placeholders are filled from kwargs, with timestamp and error_message
    always available. Unknown placeholders are left as-is (no KeyError).
    """
    if alert_config is None:
        alert_config = load_alert_config()

    if not alert_config.get("alerts_enabled"):
        return

    alert_types = alert_config.get("alert_types", {})
    alert_def = alert_types.get(alert_type, {})

    if not alert_def.get("enabled"):
        return

    # Build format dict — kwargs override defaults
    fmt = {
        "timestamp": utcnow().isoformat(),
        "error_message": error_message[:200] if error_message else "Unknown error",
    }
    fmt.update(kwargs)

    # Safe format: leave unknown placeholders intact instead of raising KeyError
    template = alert_def.get("template", "ECDO Watch Alert")
    try:
        message = template.format(**fmt)
    except KeyError:
        # Fallback: use template as-is if formatting fails
        message = template

    logger.info(f"Sending alert: {alert_type} — {message}")

    # Send email
    if alert_def.get("email"):
        send_email_alert(f"ECDO Watch Alert: {alert_type}", message, alert_config)

    # Send webhooks
    if alert_def.get("webhook"):
        send_webhook_alert(f"*ECDO Watch*: {message}", alert_config)

WATCH_BADGE_FILE = LOGS_DIR / "last_watch_badge.json"

# Badge severity order for detecting elevations
BADGE_SEVERITY = {"GRAY": 0, "GREEN": 1, "YELLOW": 2, "ORANGE": 3, "RED": 4}

def get_current_watch_badge():
    """Read the current watch badge from the 90-day coherence file."""
    coherence_file = ASSETS_DIR / "coherence_90d.json"
    if not coherence_file.exists():
        return None, None
    try:
        data = json.loads(coherence_file.read_text(encoding='utf-8'))
        return data.get("badge", "GRAY"), data.get("latest_watch_score")
    except Exception as e:
        logger.warning(f"Failed to read coherence badge: {e}")
        return None, None

def load_previous_badge():
    """Load the badge from the previous run."""
    if WATCH_BADGE_FILE.exists():
        try:
            data = json.loads(WATCH_BADGE_FILE.read_text(encoding='utf-8'))
            return data.get("badge", "GRAY")
        except Exception:
            pass
    return "GRAY"

def save_current_badge(badge, score):
    """Persist the current badge for next-run comparison."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    WATCH_BADGE_FILE.write_text(json.dumps({
        "badge": badge,
        "score": score,
        "timestamp": utcnow().isoformat()
    }, indent=2), encoding='utf-8')

def check_watch_level_transition(alert_config):
    """Compare current badge to previous. Alert on elevation (not de-escalation)."""
    current_badge, current_score = get_current_watch_badge()
    if current_badge is None:
        logger.info("No coherence badge available — skipping watch-level check")
        return

    previous_badge = load_previous_badge()
    save_current_badge(current_badge, current_score)

    prev_sev = BADGE_SEVERITY.get(previous_badge, 0)
    curr_sev = BADGE_SEVERITY.get(current_badge, 0)

    if curr_sev > prev_sev and curr_sev >= BADGE_SEVERITY["YELLOW"]:
        logger.warning(f"WATCH LEVEL ELEVATED: {previous_badge} -> {current_badge} (score: {current_score})")
        send_alerts(
            "watch_level_triggered",
            alert_config=alert_config,
            previous_badge=previous_badge,
            current_badge=current_badge,
            score=f"{current_score:.1f}" if current_score is not None else "N/A",
        )
    elif curr_sev < prev_sev:
        logger.info(f"Watch level de-escalated: {previous_badge} -> {current_badge} (score: {current_score})")
    else:
        logger.info(f"Watch level unchanged: {current_badge} (score: {current_score})")

def test_alerts():
    """Send a test alert through all configured channels to verify the setup."""
    alert_config = load_alert_config()

    if not alert_config.get("alerts_enabled"):
        logger.error("Alerts are disabled in alert_config.json — set alerts_enabled: true")
        return 1

    logger.info("=" * 70)
    logger.info("ECDO Watch Alert Test")
    logger.info("=" * 70)

    # Test script_failure alert
    logger.info("Testing: script_failure alert...")
    send_alerts("script_failure", "THIS IS A TEST — no actual failure occurred", alert_config)

    # Test watch_level_triggered alert
    logger.info("Testing: watch_level_triggered alert...")
    send_alerts(
        "watch_level_triggered",
        alert_config=alert_config,
        previous_badge="GREEN",
        current_badge="YELLOW",
        score="58.3",
    )

    logger.info("=" * 70)
    logger.info("Test complete. Check your configured channels for messages.")
    logger.info("=" * 70)
    return 0

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
                required_fields = {"bou", "hon", "frd", "composite"}
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
    alert_config = load_alert_config()

    try:
        # 1. Run data generation
        success = run_data_generation()

        if not success:
            logger.error("Data generation FAILED")
            error_msg = "Data generation script failed - see logs for details"
            save_status({
                "success": False,
                "error": error_msg,
                "duration_seconds": (utcnow() - start_time).total_seconds()
            })
            # Send alert
            send_alerts("script_failure", error_msg, alert_config)
            return 1

        # 2. Validate output
        if not validate_output():
            logger.error("Output validation FAILED")
            error_msg = "Output validation failed - generated files are incomplete or malformed"
            save_status({
                "success": False,
                "error": error_msg,
                "duration_seconds": (utcnow() - start_time).total_seconds()
            })
            # Send alert
            send_alerts("script_failure", error_msg, alert_config)
            return 1

        # 3. Check watch-level transitions (before freshness check)
        check_watch_level_transition(alert_config)

        # 4. Check data health
        check_data_freshness()

        if not is_data_healthy():
            logger.warning("Data health check FAILED (some files are stale)")
            save_status({
                "success": False,
                "error": "Data health check failed - files are stale",
                "duration_seconds": (utcnow() - start_time).total_seconds()
            })
            return 1

        # 5. Success
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
    if "--test-alerts" in sys.argv:
        sys.exit(test_alerts())
    else:
        sys.exit(main())
