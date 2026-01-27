# ECDO Watch Automation — Quick Reference

## What Was Created

### 1. Core Wrapper Script
**File:** `scripts/run_daily_update.py`

A production-ready Python wrapper that:
- ✅ Executes data generation with timeout protection
- ✅ Captures and logs all output (stdout/stderr)
- ✅ Validates generated JSON files
- ✅ Checks data freshness (flags if > 24h old)
- ✅ Creates timestamped logs in `logs/` directory
- ✅ Saves last-run status to `last_run_status.json`
- ✅ Returns proper exit codes for shell integration
- ✅ Handles timeouts and exceptions gracefully

**Key Features:**
- Log rotation (new file per run)
- Data validation (checks for required JSON fields)
- Multi-file freshness checks
- Detailed error reporting
- Compatible with cron/Task Scheduler

---

## Quick Start (Choose Your Platform)

### Windows — Easiest Method
```cmd
cd C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts
schedule_windows_task.bat
```
✅ Task runs daily at 06:00 local time

### Windows — PowerShell Alternative
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\schedule_windows_task.ps1
```
✅ More flexibility; can specify custom time

### Linux/macOS
```bash
bash ~/Dropbox/Website/projects/ecdo-watch/scripts/schedule_cron.sh 6 0
```
✅ Creates cron job (arguments: hour minute in UTC)

---

## File Structure

```
projects/ecdo-watch/
├── scripts/
│   ├── generate_ecdo_watch_data.py      (existing main script)
│   ├── run_daily_update.py              ← NEW wrapper
│   ├── schedule_windows_task.bat        ← NEW Windows batch setup
│   ├── schedule_windows_task.ps1        ← NEW PowerShell setup
│   └── schedule_cron.sh                 ← NEW Linux/macOS cron setup
├── logs/                                ← NEW (created by wrapper)
│   └── ecdo_watch_YYYYMMDD_HHMMSS.log  (timestamped logs)
│   └── last_run_status.json             (status summary)
├── assets/                              (existing data JSON)
├── OPERATIONS_MAINTENANCE_PLAN.md       (existing ops guide)
├── QUICKSTART_AUTOMATION.md             ← NEW detailed setup guide
└── AUTOMATION_SUMMARY.md                ← NEW this file
```

---

## How It Works (Technical Overview)

### Daily Execution Flow

```
[Task Scheduler / Cron]
        ↓
    run_daily_update.py
        ↓
    1. Log setup (create timestamped log file)
        ↓
    2. Execute generate_ecdo_watch_data.py
        ├─ Capture stdout/stderr
        ├─ Log all output
        └─ Timeout after 5 minutes
        ↓
    3. Validate output JSON files
        ├─ Check file exists
        ├─ Parse JSON syntax
        ├─ Verify labels + data fields
        └─ Report point counts
        ↓
    4. Check data freshness
        ├─ Verify files < 24h old
        ├─ Report age of each file
        └─ Return success/failure
        ↓
    5. Save status report
        ├─ Save to last_run_status.json
        └─ Include duration + timestamp
        ↓
    Exit code 0 (success) or 1 (failure)
```

---

## Verification Checklist

After setup, verify with these tests:

### Test 1: Manual Execution
```bash
# Run the wrapper directly
python run_daily_update.py
```
Expected: Completes in 1–3 minutes, "SUCCESSFUL" message in logs

### Test 2: Check Logs
```bash
# Find latest log file
ls -lt logs/ecdo_watch_*.log | head -1

# View it
cat logs/ecdo_watch_YYYYMMDD_HHMMSS.log
```
Expected: See data generation output, no errors

### Test 3: Check Status
```bash
# View last run status
cat logs/last_run_status.json
```
Expected: `"success": true` with duration and timestamp

### Test 4: Schedule Verification
**Windows:** Open Task Scheduler → Right-click task → Run → Monitor
**Linux/macOS:** Watch logs in real-time with `tail -f logs/ecdo_watch_*.log`

---

## Monitoring Commands

### Check Task Status (Windows)
```powershell
# List all ECDO tasks
Get-ScheduledTask -TaskName "*ECDO*" | Select TaskName, State, LastRunTime, LastTaskResult

# View detailed task info
(Get-ScheduledTask -TaskName "ECDO Watch Daily Update").Triggers

# View history (last 10 runs)
Get-ScheduledTask -TaskName "ECDO Watch Daily Update" | Get-ScheduledTaskInfo
```

### Check Cron Status (Linux/macOS)
```bash
# List all cron jobs
crontab -l

# Watch syslog for cron execution
tail -f /var/log/syslog | grep CRON

# View specific log line
grep ecdo-watch /var/log/syslog
```

### Monitor Real-Time Logs
```bash
# Windows PowerShell
Get-Content logs/ecdo_watch_*.log -Tail 20 -Wait

# Linux/macOS
tail -f logs/ecdo_watch_*.log
```

---

## Troubleshooting at a Glance

| Problem | Solution |
|---------|----------|
| **Task doesn't run** | Check Task Scheduler / crontab; verify Python path |
| **Logs not created** | Ensure `logs/` directory exists and is writable |
| **Data not updating** | Run wrapper manually; check data source status |
| **Python not found** | Add Python to PATH or use full Python executable path |
| **Timeout errors** | Increase `TIMEOUT_SECONDS` in `run_daily_update.py` |
| **Stale data files** | Check network connectivity to IERS/USGS/NOAA |

For detailed troubleshooting, see **QUICKSTART_AUTOMATION.md**.

---

## Daily Operations

### Every Morning (After Setup)
✅ Check `logs/last_run_status.json` — should say `"success": true`

### If Status Says `"success": false`
1. Open the latest log file
2. Look for error message (usually near the end)
3. Common causes:
   - IERS timeout → check network
   - USGS magnetometer fetch failed → check USGS status page
   - Missing output files → check logs for validation errors
4. Re-run manually if needed: `python run_daily_update.py`

### Weekly Review
- Check logs directory (should have 7 new files)
- Verify all show `"success": true`
- Spot-check one log for warnings (prefixed with "WARNING:")

---

## Configuration Options

### Change Schedule Time
**Windows (PowerShell):**
```powershell
schtasks /change /tn "ECDO Watch Daily Update" /st 12:30
```

**Linux/macOS:**
```bash
crontab -e
# Change first two fields: minute hour * * *
```

### Customize Timeout
Edit `run_daily_update.py` line 25:
```python
TIMEOUT_SECONDS = 300  # Change to 600 for 10 minutes, etc.
```

### Add Email Alerts (Optional)
See "Alerting & Notifications" in **QUICKSTART_AUTOMATION.md**.

---

## Success Criteria

You'll know it's working when:

- ✅ Logs appear in `logs/` directory daily
- ✅ `last_run_status.json` updates each morning
- ✅ Dashboard data files refresh (check modification times)
- ✅ No errors in logs for 7+ consecutive days
- ✅ Web dashboard shows current data when refreshed

---

## Files Included in This Setup

| File | Purpose |
|------|---------|
| `run_daily_update.py` | Main wrapper script (Python) |
| `schedule_windows_task.bat` | Windows Task Scheduler setup (batch) |
| `schedule_windows_task.ps1` | Windows Task Scheduler setup (PowerShell) |
| `schedule_cron.sh` | Linux/macOS cron setup (bash) |
| `QUICKSTART_AUTOMATION.md` | Detailed setup guide |
| `AUTOMATION_SUMMARY.md` | This file |

---

## Next Steps

1. ✅ **Complete:** Set up automated daily updates
2. **Today:** Run first manual test with `python run_daily_update.py`
3. **Tomorrow:** Verify task ran automatically (check logs)
4. **This week:** Monitor for errors; adjust schedule if needed
5. **Phase 1 (Next):** Integrate real IERS LOD data; improve error recovery

See **OPERATIONS_MAINTENANCE_PLAN.md** for the full upgrade roadmap.

---

**Version:** 1.0
**Created:** 2026-01-26
**Status:** Ready for deployment
**Support:** See QUICKSTART_AUTOMATION.md for detailed troubleshooting
