# ECDO Watch: One-Button Automation

Everything runs with a single command. Done.

---

## Setup (One Time Only)

**Option 1: Automatic (Recommended)**

```powershell
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
.\setup_master_scheduler.ps1
```

✓ Task scheduled for 06:00 UTC every day
✓ Runs automatically
✓ One command to rule them all

**Option 2: Manual Task Scheduler**

1. Open Windows Task Scheduler
2. Create New Task:
   - **Name:** ECDO Watch Master Daily Run
   - **Trigger:** Daily, 06:00 UTC
   - **Action:**
     - Program: `python.exe`
     - Arguments: `master_daily_run.py`
     - Start in: `C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\`

---

## Run It Manually (Anytime)

```bash
cd C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts
python master_daily_run.py
```

Done. Sits back. Watches logs scroll. Takes ~4 minutes.

---

## What It Does

Every time you run it (daily automatic or manual):

✓ **Generate new data** (Kp, LOD, magnetometer, C20)
✓ **Validate data freshness** (all files < 24h old)
✓ **Run validation study** (if Phase 2 data available)
✓ **Log everything** (timestamped log files)
✓ **Report status** (success/failure/warnings)

---

## Check Status

**Latest run:**
```bash
type C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\master_run_status.json
```

**Latest log:**
```bash
Get-ChildItem C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\master_daily_*.log -Newest 1
```

**Task status (if automated):**
```powershell
Get-ScheduledTask -TaskName "ECDO Watch Master Daily Run" | Select State, LastRunTime, LastTaskResult
```

---

## Options

**Skip validation analysis (Phase 1 mode):**
```bash
python master_daily_run.py --quick
```

**Validation analysis only (Phase 2 mode):**
```bash
python master_daily_run.py --validate-only
```

**Normal (both):**
```bash
python master_daily_run.py
```

---

## What Success Looks Like

```
2026-02-01 06:00:00 | INFO     | ======================================================================
2026-02-01 06:00:00 | INFO     | ECDO WATCH MASTER DAILY RUN
2026-02-01 06:00:00 | INFO     | [1/3] Daily Data Generation
2026-02-01 06:00:00 | INFO     | Running: Daily Data Generation
2026-02-01 06:01:45 | INFO     | ✓ Daily Data Generation completed successfully
2026-02-01 06:01:45 | INFO     | [2/3] Data Validation
2026-02-01 06:01:45 | INFO     | ✓ kp_30d.json is 0.1h old
2026-02-01 06:01:45 | INFO     | ✓ lod_30d.json is 0.1h old
2026-02-01 06:01:45 | INFO     | ✓ mag_30d.json is 0.1h old
2026-02-01 06:01:45 | INFO     | [SUMMARY]
2026-02-01 06:01:45 | INFO     | Status: ✓ All systems nominal
2026-02-01 06:02:00 | INFO     | ======================================================================
```

---

## That's It

- **Setup:** 2 minutes
- **Daily:** Automatic (you do nothing)
- **Manual checks:** 30 seconds

Everything flows from one button.

---

**Ready?**

```powershell
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
.\setup_master_scheduler.ps1
```

Then test it:

```powershell
python master_daily_run.py
```

Done. ✓
