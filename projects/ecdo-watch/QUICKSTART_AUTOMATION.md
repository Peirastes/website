# ECDO Watch — Quick-Start Automation Guide

**Purpose:** Set up automated daily updates for ECDO Watch data generation with logging and error monitoring.

**Last Updated:** 2026-01-26

---

## Overview

Three components work together to automate daily data updates:

1. **`run_daily_update.py`** — Python wrapper that:
   - Executes the main data generation script
   - Captures output and logs with timestamps
   - Validates generated data
   - Reports success/failure with timing
   - Saves status to JSON for monitoring

2. **`schedule_windows_task.bat`** — Windows Task Scheduler setup (Windows only)
3. **`schedule_windows_task.ps1`** — PowerShell alternative setup (Windows only)
4. **`schedule_cron.sh`** — Cron job setup (Linux/macOS only)

---

## Windows Setup (Choose One Method)

### Method 1: Batch Script (Easiest for Windows)

**Step 1:** Open Command Prompt as Administrator
- Press `Win+R`
- Type `cmd`
- Right-click and select "Run as Administrator"

**Step 2:** Navigate to scripts directory
```cmd
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
```

**Step 3:** Run the batch setup script
```cmd
schedule_windows_task.bat
```

**Step 4:** Confirm the task was created
- Open Task Scheduler (`Win+R`, type `taskschd.msc`)
- Look for "ECDO Watch Daily Update" in the task library
- Right-click → "Properties" to adjust time if needed

---

### Method 2: PowerShell (More Flexible)

**Step 1:** Open PowerShell as Administrator
- Press `Win+X`
- Select "Windows PowerShell (Admin)"

**Step 2:** Enable script execution for this session
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

**Step 3:** Navigate and run the setup
```powershell
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
.\schedule_windows_task.ps1
```

**Step 4:** To customize the schedule time (e.g., 12:30 PM):
```powershell
.\schedule_windows_task.ps1 -ScheduleTime "12:30"
```

---

### Method 3: Manual Task Scheduler Configuration

**Step 1:** Open Task Scheduler
- Press `Win+R`
- Type `taskschd.msc`
- Click OK

**Step 2:** Create a new task
- Right-click "Task Scheduler Library" → "Create Basic Task"
- Name: `ECDO Watch Daily Update`
- Description: `Auto-update ECDO Watch geophysics data`
- Click Next

**Step 3:** Set trigger
- Select "Daily"
- Set time to **06:00** (adjust to your preference)
- Click Next

**Step 4:** Set action
- Select "Start a program"
- Program/script: `C:\Users\[YourUsername]\AppData\Local\Programs\Python\Python3XX\python.exe`
  - (Replace `3XX` with your Python version, e.g., `python311`)
  - Or: `python.exe` if Python is in your PATH
- Arguments: `C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\run_daily_update.py`
- Click Next

**Step 5:** Finish
- Review settings
- Check "Open the Properties dialog for this task when I click Finish"
- Click Finish

**Step 6:** In Properties dialog, set additional options:
- **General tab:** Check "Run with highest privileges"
- **Triggers tab:** Check "Enabled"
- **Conditions tab:** Uncheck "Start the task only if the computer is on AC power" (optional)
- Click OK

---

## Linux/macOS Setup

**Step 1:** Make the cron setup script executable
```bash
chmod +x ~/Dropbox/Website/projects/ecdo-watch/scripts/schedule_cron.sh
```

**Step 2:** Run the setup script
```bash
bash ~/Dropbox/Website/projects/ecdo-watch/scripts/schedule_cron.sh 6 0
```
- First argument: hour (24-hour format, UTC)
- Second argument: minute
- Example: `schedule_cron.sh 6 0` = 06:00 UTC daily

**Step 3:** Verify the cron job was created
```bash
crontab -l
```
You should see an entry for `ecdo-watch-update`.

**Step 4:** (Optional) To modify the schedule later:
```bash
crontab -e
```
Edit the time and save.

---

## Verifying Your Setup

### Windows: Task Scheduler

1. Open Task Scheduler (`taskschd.msc`)
2. Right-click "ECDO Watch Daily Update" → "Run"
3. Monitor the task for ~5 minutes (should complete quickly)
4. Check the **logs** directory for output

### Linux/macOS: Cron

1. Manually run the task to test:
   ```bash
   /usr/local/bin/ecdo-watch-update
   ```
2. Check for log files in `~/Dropbox/Website/projects/ecdo-watch/logs/`

### All Platforms: Check Logs

After the first automated run, verify logs:

```bash
# Windows
dir "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs"

# Linux/macOS
ls ~/Dropbox/Website/projects/ecdo-watch/logs
```

Look for files named `ecdo_watch_YYYYMMDD_HHMMSS.log`.

**Expected log content:**
```
[2026-01-26 06:00:15 UTC] INFO     ======================================================================
[2026-01-26 06:00:15 UTC] INFO     ECDO Watch Daily Update Started
[2026-01-26 06:00:15 UTC] INFO     Running: /path/to/generate_ecdo_watch_data.py
[2026-01-26 06:00:20 UTC] INFO       Fetching EOP...
[2026-01-26 06:00:25 UTC] INFO       Fetching Kp history...
...
[2026-01-26 06:02:10 UTC] INFO     ✓ ECDO Watch Update SUCCESSFUL (115.3s)
```

---

## Status Monitoring

### Last Run Status

The wrapper script saves status to:
```
projects/ecdo-watch/logs/last_run_status.json
```

**Example:**
```json
{
  "success": true,
  "duration_seconds": 115.3,
  "timestamp_utc": "2026-01-26T06:02:10.123456+00:00",
  "timestamp": "2026-01-26T06:02:10.123456+00:00"
}
```

**To check the last run status:**

Windows:
```cmd
type "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\last_run_status.json"
```

Linux/macOS:
```bash
cat ~/Dropbox/Website/projects/ecdo-watch/logs/last_run_status.json
```

### Real-Time Log Monitoring

**Windows (PowerShell):**
```powershell
Get-Content -Path "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\ecdo_watch_*.log" -Tail 20 -Wait
```

**Linux/macOS:**
```bash
tail -f ~/Dropbox/Website/projects/ecdo-watch/logs/ecdo_watch_*.log
```

---

## Troubleshooting

### Task doesn't run

**Windows:**
1. Check Task Scheduler History: Right-click task → View → History
2. Look for "Last Result" column — should be 0 (success)
3. If error code shown, check the logs directory

**Linux/macOS:**
```bash
# Check if cron is running
ps aux | grep cron

# Check system logs
sudo tail -n 50 /var/log/system.log  # macOS
sudo journalctl -u cron --no-pager   # Linux
```

### Python not found

**Windows:**
1. Verify Python is installed: `python --version`
2. If error, add Python to PATH:
   - Open "Environment Variables"
   - Add Python directory to PATH
   - Restart the scheduling script

**Linux/macOS:**
```bash
which python3
which python
```

### Log file not created

1. Verify logs directory exists:
   ```bash
   mkdir -p ~/Dropbox/Website/projects/ecdo-watch/logs
   ```
2. Check folder permissions:
   - Logs directory should be writable by the user running the task

### Data files not updating

1. Run wrapper script manually:
   ```bash
   python run_daily_update.py
   ```
2. Check output — look for error messages
3. Verify data sources are online:
   - NOAA SWPC: https://www.noaa.gov/space-weather/swpc
   - IERS: https://datacenter.iers.org
   - USGS: https://geomag.usgs.gov

---

## Advanced Configuration

### Adjust Schedule Time

**Windows (Task Scheduler):**
1. Right-click task → "Properties"
2. Click "Triggers" tab
3. Double-click the daily trigger
4. Edit "Start time" field
5. Click OK twice

**Windows (PowerShell):**
```powershell
schtasks /change /tn "ECDO Watch Daily Update" /st 12:30
```

**Linux/macOS:**
```bash
crontab -e
# Edit the first two fields (minute and hour)
# Format: MM HH * * * /usr/local/bin/ecdo-watch-update
```

### Change Python Interpreter

**Windows:**
1. Open Task Scheduler
2. Right-click task → "Properties"
3. Click "Actions" tab
4. Edit the "Program/script" field with full path to desired Python

**Linux/macOS:**
```bash
sudo nano /usr/local/bin/ecdo-watch-update
# Change the shebang or Python path
```

### Run Immediately (for testing)

**Windows:**
```powershell
Start-ScheduledTask -TaskName "ECDO Watch Daily Update"
```

**Linux/macOS:**
```bash
/usr/local/bin/ecdo-watch-update
```

### View Complete Task History

**Windows:**
```powershell
Get-ScheduledTask -TaskName "ECDO Watch Daily Update" | Get-ScheduledTaskInfo
```

**Linux/macOS:**
```bash
grep ecdo-watch /var/log/syslog  # Some Linux systems
# or check application log viewer on macOS
```

---

## Removing Scheduled Tasks

If you need to remove the automated task:

**Windows (Task Scheduler):**
1. Right-click task → "Delete"
2. Confirm

**Windows (PowerShell):**
```powershell
Unregister-ScheduledTask -TaskName "ECDO Watch Daily Update" -Confirm:$false
```

**Windows (Command Prompt):**
```cmd
schtasks /delete /tn "ECDO Watch Daily Update" /f
```

**Linux/macOS:**
```bash
crontab -e
# Delete the line for ecdo-watch-update and save
```

---

## Alerting & Notifications (Optional)

The wrapper script saves status to `last_run_status.json`. You can extend it with:

### Email Alerts

Add to `run_daily_update.py` before `sys.exit()`:

```python
if not success:
    import smtplib
    from email.mime.text import MIMEText

    msg = MIMEText(f"ECDO Watch update failed: {status}")
    msg['Subject'] = 'ECDO Watch Alert'
    msg['From'] = 'noreply@example.com'
    msg['To'] = 'your-email@example.com'

    with smtplib.SMTP('localhost') as server:
        server.send_message(msg)
```

### Webhook Notifications

Add to `save_status()`:

```python
import requests
requests.post(
    "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    json={"text": f"ECDO Watch: {status['success']}"}
)
```

---

## Next Steps

1. ✅ Set up automated daily updates (you are here)
2. Monitor logs for one week to ensure reliability
3. Proceed to **Phase 1** upgrades in main operations plan
4. Consider Phase 2 (data freshness badges)

---

## Support & Troubleshooting

**Questions?** Check the main **OPERATIONS_MAINTENANCE_PLAN.md** in the project root.

**Still stuck?** Gather:
- Last 5 lines of latest log file
- Python version (`python --version`)
- Operating system and version
- Task scheduler history (if Windows)

---

**Version:** 1.0
**Last Updated:** 2026-01-26
