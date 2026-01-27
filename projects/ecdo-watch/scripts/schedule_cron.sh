#!/bin/bash
# ECDO Watch - Linux/macOS Cron Job Setup
# Usage: bash schedule_cron.sh [HOUR] [MINUTE]
# Example: bash schedule_cron.sh 6 0   (for 06:00 UTC)
#          bash schedule_cron.sh 12 30 (for 12:30 UTC)

set -e

# Configuration
HOUR="${1:-6}"
MINUTE="${2:-0}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER_SCRIPT="$SCRIPT_DIR/run_daily_update.py"
PYTHON_EXE="$(which python3 || which python)"

echo ""
echo "============================================================"
echo "  ECDO Watch - Cron Job Configuration (Linux/macOS)"
echo "============================================================"
echo ""

# Validation
if [ ! -f "$WRAPPER_SCRIPT" ]; then
    echo "ERROR: Wrapper script not found at: $WRAPPER_SCRIPT"
    exit 1
fi

if [ -z "$PYTHON_EXE" ]; then
    echo "ERROR: Python 3 not found in PATH"
    echo "Please ensure Python 3 is installed and accessible"
    exit 1
fi

echo "Wrapper Script: $WRAPPER_SCRIPT"
echo "Python Executable: $PYTHON_EXE"
echo "Schedule: Daily at $HOUR:$(printf "%02d" "$MINUTE") UTC"
echo ""

# Create a dedicated runner script in /usr/local/bin
RUNNER_SCRIPT="/usr/local/bin/ecdo-watch-update"

echo "Creating runner script at: $RUNNER_SCRIPT"
echo "(This requires sudo/root privileges)"
echo ""

sudo tee "$RUNNER_SCRIPT" > /dev/null <<EOF
#!/bin/bash
# ECDO Watch Daily Update Runner
exec "$PYTHON_EXE" "$WRAPPER_SCRIPT"
EOF

sudo chmod +x "$RUNNER_SCRIPT"

echo "✓ Runner script created"
echo ""

# Create cron job entry
CRON_ENTRY="$MINUTE $HOUR * * * $RUNNER_SCRIPT"

echo "Creating cron job entry:"
echo "  $CRON_ENTRY"
echo ""

# Check if cron job already exists
CRON_TEMP=$(mktemp)
crontab -l > "$CRON_TEMP" 2>/dev/null || true

if grep -q "ecdo-watch-update" "$CRON_TEMP"; then
    echo "WARNING: Cron job for ECDO Watch already exists"
    echo "Updating existing entry..."
    grep -v "ecdo-watch-update" "$CRON_TEMP" > "${CRON_TEMP}.new"
    mv "${CRON_TEMP}.new" "$CRON_TEMP"
fi

# Add new cron entry
echo "$CRON_ENTRY" >> "$CRON_TEMP"

# Install cron job
crontab "$CRON_TEMP"
rm -f "$CRON_TEMP"

echo ""
echo "============================================================"
echo "  ✓ Cron job created successfully!"
echo "============================================================"
echo ""
echo "Cron Job: ECDO Watch Daily Update"
echo "Schedule: Daily at $HOUR:$(printf "%02d" "$MINUTE") UTC"
echo "Runner:   $RUNNER_SCRIPT"
echo "Action:   $PYTHON_EXE $WRAPPER_SCRIPT"
echo ""
echo "Logs will be saved to:"
echo "  $SCRIPT_DIR/../../logs/"
echo ""
echo "To view installed cron jobs:"
echo "  crontab -l"
echo ""
echo "To edit the cron job:"
echo "  crontab -e"
echo ""
echo "To remove the cron job:"
echo "  crontab -r"
echo ""
echo "To monitor logs in real-time:"
echo "  tail -f $SCRIPT_DIR/../../logs/ecdo_watch_*.log"
echo ""

exit 0
