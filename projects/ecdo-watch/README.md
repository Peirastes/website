# ECDO Watch — Geophysics Monitor

**Status:** Production with Daily Automation
**Last Updated:** 2026-01-27
**Updated Data:** Daily at 06:00 UTC (via Task Scheduler)

---

## 📍 Quick Links

- **Dashboard:** `ecdo-watch.html` (open in browser)
- **Daily Operations:** See [`DAILY_OPERATIONS_CHECKLIST.md`](#daily-operations-checklist) below or view full guide in `OPERATIONS_MAINTENANCE_PLAN.md`
- **Setup & Automation:** `QUICKSTART_AUTOMATION.md`
- **Project Design:** `ecdo-watch.md`

---

## 🎯 What This Project Does

ECDO Watch is a **falsification-first geophysics observer** that monitors internal Earth-system anomalies:

- **Kp Index (External Forcing Gate)** — Solar wind energy input; suppresses internal inference during storms
- **Earth Orientation (LOD)** — Rotation rate anomalies relative to 10-year baselines
- **Ground Magnetometer** — Multi-station magnetic field variations (z-score normalized)
- **Cross-Channel Coherence** — Flags when independent systems show correlated anomalies

**Philosophy:** Require quiet-day gating + baseline-normalized anomalies + cross-channel agreement before escalating watch level.

---

## 🚀 Getting Started

### 1. Enable Daily Automation
```cmd
cd scripts
schedule_windows_task.bat
```
✅ Sets up Windows Task Scheduler to run daily at 06:00 UTC

### 2. Monitor Your First Run
Check logs after 06:00 AM:
```cmd
# View status summary
type logs\last_run_status.json

# View detailed log
Get-Content logs\ecdo_watch_*.log | Select-Object -Last 30
```

### 3. View the Dashboard
Open `ecdo-watch.html` in your browser to see:
- 14-day Kp plot
- 90-day LOD plot
- 60-day magnetometer composite (4 stations)
- Historical context (50+ years)
- Time-range buttons (30d, 90d, 1y, 5y, 10y)

---

## 📋 Daily Operations Checklist

### Every Morning (5 minutes)

**Step 1: Check Status**
```cmd
type logs\last_run_status.json
```
- ✅ `"success": true` → Proceed to Step 2
- ❌ `"success": false` → See **Emergency Procedures** below

**Step 2: Verify Data Freshness**
```cmd
dir assets\*.json /O-D
```
- ✅ All modified today → Proceed to Step 3
- ⚠️ Any > 24h old → Check latest log for errors
- ❌ All > 48h old → **CRITICAL** — Force manual run (see Emergency Procedures)

**Step 3: Review Latest Log**
```cmd
Get-Content logs\ecdo_watch_*.log -Tail 30
```
Look for:
- ✅ Final line: `✓ ECDO Watch Update SUCCESSFUL`
- ⚠️ `WARNING:` lines (usually OK — e.g., "IERS LOD unavailable")
- ❌ `ERROR:` lines (investigate)

**Step 4: Visual Check**
1. Open `ecdo-watch.html` in browser
2. Verify "Updated:" timestamp is today
3. Check Kp plot has data (not flat)
4. Test one time-range button
5. Open browser console (F12) — no red errors

✅ If all pass → Daily verification complete!

---

## 🔧 Common Tasks

### Check Full Logs
```cmd
# View latest log file
dir logs\ecdo_watch_*.log /O-D | head -1

# View in PowerShell
Get-Content (Get-ChildItem logs\ecdo_watch_*.log | Sort-Object LastWriteTime -Desc | Select-Object -First 1)
```

### Force Manual Data Generation
```cmd
cd scripts
python run_daily_update.py
```
Runs all checks: data fetch → validation → status report

### Test Health Check
```cmd
python scripts\healthcheck.py
```
Quick status report without generating new data

### View Data Quality Metrics
```cmd
python scripts\data_quality_metrics.py
```
Per-source stats, data completeness, trending

### Verify Dashboard Works
1. Open `ecdo-watch.html` in browser
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Verify:
   - No red errors
   - All JSON files fetched (200 OK)
   - All charts render
   - Time-range buttons work

---

## 🚨 Emergency Procedures

### Scenario 1: Script Failed (status shows "success": false)

**Step 1:** Review error message
```cmd
type logs\last_run_status.json
```

**Step 2:** Check error details in log
```cmd
# Find ERROR lines from today
Get-Content logs\ecdo_watch_*.log | Select-String "ERROR"
```

**Step 3:** Quick fixes by error type:

| Error Message | Fix |
|---------------|-----|
| "Script timeout" | Increase TIMEOUT_SECONDS in run_daily_update.py (line 25) |
| "IERS timeout" | IERS API down; wait 24h (synthetic data used as fallback) |
| "Output validation failed" | Check generate_ecdo_watch_data.py for bugs |
| "Data health check failed" | Force manual run: `python run_daily_update.py` |
| "Python not found" | Verify Task Scheduler action path is correct |

**Step 4:** Recover
```cmd
cd scripts
python run_daily_update.py
```

**Step 5:** If still failing, document and check:
- Internet connectivity (`ping 1.1.1.1`)
- NOAA/IERS/USGS API status online
- Python dependencies (`pip list`)

---

### Scenario 2: Data Files Not Updating

**Check Task Scheduler:**
```powershell
Get-ScheduledTask -TaskName "ECDO Watch Daily Update" | Select-Object State, LastRunTime, LastTaskResult
```

**If task is Disabled or LastRunTime is old:**
1. Right-click task in Task Scheduler → "Run"
2. Monitor task for completion
3. Check logs

**If task runs but files don't update:**
1. Verify working directory
2. Check Python path in task action
3. Run manually to test: `python scripts\run_daily_update.py`

---

### Scenario 3: Dashboard Shows Old Data

**If JSON files are fresh (<24h) but dashboard shows old timestamp:**
- Hard refresh browser: `Ctrl+Shift+R`
- Clear browser cache
- Check Network tab (F12) for 404 errors on JSON files

**If JSON files are old (>24h):**
- Follow Scenario 1 above (script failed)

---

### Scenario 4: Magnetometer Spike Detected

1. **Check if it's real:**
   ```cmd
   python scripts\healthcheck.py
   ```
   Look for "MAG composite z-score" value

2. **Verify gate status (Kp quiet?):**
   - If Kp ≤ 4 and MAG > 2.5σ → Genuine candidate
   - If Kp > 4 and MAG anomalous → Storm-driven (gated, expected)

3. **Check multi-station coherence:**
   - Open browser developer tools
   - Look at magnetometer plot
   - If spike appears across BOU, HON, SJG → Coherent signal

4. **Cross-check with LOD:**
   - If both MAG and LOD anomalous same day → Significant event
   - Document with timestamps and z-scores

---

## 📊 Weekly Maintenance (15 min - Every Monday)

```cmd
# 1. Review logs for errors
Get-Content logs\ecdo_watch_*.log | Select-String "ERROR" | Sort-Object | Get-Unique

# 2. Check log file count
(Get-ChildItem logs\ecdo_watch_*.log).Count

# 3. Archive old logs (>30 days)
Get-ChildItem logs\ecdo_watch_*.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Move-Item -Destination logs\archive\

# 4. Spot-check Kp value against NOAA
# Visit: https://www.noaa.gov/space-weather/swpc
# Compare one random day from past week
```

---

## 📈 Monthly Maintenance (30 min - 1st of Month)

```cmd
# 1. Check data freshness
Get-ChildItem assets\*.json | ForEach-Object {
    $age = (Get-Date) - $_.LastWriteTime
    "$($_.Name): $($age.TotalDays.ToString('F1')) days old"
}

# 2. Verify production URL works (if deployed)
# Test dashboard from production URL (not localhost)
# Verify all 5 time-range buttons load

# 3. Check Python dependencies for updates
pip list --outdated

# 4. Check API status pages:
# - NOAA SWPC: https://www.noaa.gov/space-weather/swpc
# - IERS: https://datacenter.iers.org
# - USGS Geomag: https://geomag.usgs.gov
# - GFZ Kp: https://kp.gfz.de
```

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| `ecdo-watch.md` | Project philosophy, design principles, 5-step logic |
| `OPERATIONS_MAINTENANCE_PLAN.md` | Complete ops guide (daily/weekly/monthly/quarterly/annual tasks, all emergency procedures) |
| `QUICKSTART_AUTOMATION.md` | How to set up automation (Windows, Linux, macOS) |
| `AUTOMATION_SUMMARY.md` | Quick reference for automation |
| `README.md` | This file |

---

## 📂 Project Structure

```
ecdo-watch/
├── ecdo-watch.html              # Dashboard (open in browser)
├── ecdo-watch.jsx               # React dashboard component
├── ecdo-watch.md                # Project philosophy & design
├── README.md                    # This file
├── OPERATIONS_MAINTENANCE_PLAN.md
├── QUICKSTART_AUTOMATION.md
├── AUTOMATION_SUMMARY.md
├── scripts/
│   ├── generate_ecdo_watch_data.py          # Main data pipeline
│   ├── run_daily_update.py                  # Automation wrapper
│   ├── healthcheck.py                       # Health check script (NEW)
│   ├── data_quality_metrics.py              # Data metrics script (NEW)
│   ├── schedule_windows_task.bat            # Windows setup
│   ├── schedule_windows_task.ps1            # PowerShell setup
│   └── schedule_cron.sh                     # Linux/macOS setup
├── assets/
│   ├── *.json                               # Generated data files
│   └── cache/                               # Cached source data
├── logs/
│   ├── ecdo_watch_YYYYMMDD_HHMMSS.log      # Daily logs
│   ├── last_run_status.json                 # Current status
│   └── archive/                             # Old logs
└── .claude/
    └── plans/goofy-forging-cake.md         # Daily operations plan
```

---

## 🔄 Data Pipeline

```
[06:00 UTC Every Day]
        ↓
run_daily_update.py (Wrapper)
        ↓
generate_ecdo_watch_data.py (Core Pipeline)
        ├─ Fetch NOAA SWPC Kp (3-hour values)
        ├─ Fetch IERS EOP (LOD, polar motion)
        ├─ Fetch GFZ Kp historical (since 1932)
        ├─ Fetch USGS magnetometer (4 stations)
        └─ Generate JSON files (14 main + 15 time-range variants)
        ↓
Validation & Status Report
        ├─ Verify JSON files exist & valid
        ├─ Check freshness (<24h)
        └─ Save status to last_run_status.json
        ↓
Browser loads ecdo-watch.html
        ├─ Fetches JSON files from assets/
        ├─ Renders React dashboard
        └─ Shows 5-step inference pipeline
```

---

## ✨ Features

- ✅ **Daily Automation** — Windows Task Scheduler / Linux cron
- ✅ **Comprehensive Logging** — Timestamped logs with full audit trail
- ✅ **Data Validation** — JSON syntax check, freshness validation
- ✅ **Error Recovery** — Fallbacks to cached/synthetic data
- ✅ **Multi-Platform** — Windows, Linux, macOS support
- ✅ **Responsive Dashboard** — Dark theme, mobile-friendly
- ✅ **Multiple Time Ranges** — 30d, 90d, 1y, 5y, 10y views
- ✅ **Historical Context** — 50+ year geomagnetic and polar motion data

---

## 🎯 Success Indicators

**Daily:**
- ✅ `last_run_status.json` shows `"success": true`
- ✅ All data files < 24 hours old
- ✅ Dashboard timestamp is today's date

**Weekly:**
- ✅ 7/7 days successful (100% uptime)
- ✅ No repeated errors in logs
- ✅ Data matches official sources

**Monthly:**
- ✅ All APIs operational
- ✅ Dashboard works on production URL
- ✅ No stale data files

**Quarterly:**
- ✅ Full regeneration succeeds
- ✅ All APIs stable
- ✅ >95% success rate over 90 days

---

## 🚀 Next Steps

1. **Set up automation:** Run `schedule_windows_task.bat`
2. **Monitor first run:** Check logs at 06:00 AM tomorrow
3. **Daily check:** Follow 5-minute morning checklist
4. **Phase 1 upgrade:** Integrate real IERS LOD data (coming next)

---

## 📞 Support

**Routine Questions?** → See `OPERATIONS_MAINTENANCE_PLAN.md`
**Setup Issues?** → See `QUICKSTART_AUTOMATION.md`
**Emergency?** → Follow Emergency Procedures above
**Plan details?** → See `.claude/plans/goofy-forging-cake.md`

---

**Version:** 1.0
**Created:** 2026-01-27
**Status:** Production Ready
**Automation:** Enabled (Daily at 06:00 UTC)
