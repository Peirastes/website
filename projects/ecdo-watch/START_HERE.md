# ECDO Watch: START HERE

**One button. Everything.**

---

## 30-Second Setup

```powershell
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
.\setup_master_scheduler.ps1
```

Done. Runs every day at 06:00 UTC automatically.

---

## How It Works

**Every day at 06:00 UTC (or run manually):**

```bash
python master_daily_run.py
```

**This does:**
1. ✓ Generates new data (Kp, LOD, magnetometer, C20)
2. ✓ Validates all files are fresh
3. ✓ Runs validation study (when Phase 2 data available)
4. ✓ Logs everything clearly
5. ✓ Reports success/warning/failure

**Time:** ~4 minutes
**Effort:** Zero (automatic)
**Result:** Timestamped status report

---

## Check Status

**Latest result:**
```bash
type C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\master_run_status.json
```

**Latest log:**
```bash
Get-ChildItem C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\master_daily_*.log -Newest 1 | Get-Content -Tail 50
```

---

## What's Running Right Now

The test automation is executing live. You should see:
- New log file created: `logs/master_daily_YYYYMMDD_HHMMSS.log`
- Data files generated: `assets/*.json`
- Status saved: `logs/master_run_status.json`

---

## Your Task: Just Let It Run

**Phase 1 (Feb-Apr 2026):**
- Every day: Daily automation runs (you do nothing)
- Every week: Document any anomalies in `operations_log.md` (if detected)
- Every month: Monthly summary update (15 min)
- Every month: Baseline computed automatically

**That's it.**

---

## Phase 2 (May 2026+)

When Phase 1 data collection complete:
```bash
python master_daily_run.py --validate-only
```

This runs the validation study analysis on accumulated data.

---

## Files

| File | Purpose |
|------|---------|
| `master_daily_run.py` | The one button |
| `setup_master_scheduler.ps1` | Schedule the button |
| `ONE_BUTTON_START.md` | Quick reference |
| `PHASE_1_QUICK_START.md` | Weekly/monthly tasks |
| `operations_log.md` | Document anomalies here |

---

## That's Literally It

- **Setup:** 30 seconds
- **Daily:** Automatic
- **Maintenance:** 15 min/month (one time)

Everything else is documentation and planning (already done).

---

**Next step:** Run setup

```powershell
.\setup_master_scheduler.ps1
```

Then test it:

```powershell
python master_daily_run.py
```

Then go about your day. It runs automatically.

✓ Done.
