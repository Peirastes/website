# Phase 1: Quick Start Guide

**Timeline:** February 1 - April 30, 2026 (3 months)
**Effort:** 30 minutes per week
**Goal:** Document 20+ anomalies with full context

---

## ✓ Already Done

- [x] `operations_log.md` — Daily tracking template created
- [x] `VALIDATION_PLAN.md` — Phase 2 roadmap created
- [x] `validation_study.py` — Analysis framework created
- [x] `BASELINE_AUTOMATION.md` — Automation setup guide created

---

## ⏳ Do This First (By Feb 28)

### Task 1: Schedule Monthly Baseline Automation (30 min)

**What it does:** Automatically updates threshold percentiles every 1st of month at 07:00 UTC

**How to set it up:**

**Option A: PowerShell (Easiest)**
```powershell
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
python schedule_baseline_task.ps1
```

**Option B: Manual (If PowerShell script doesn't work)**
1. Open Windows Task Scheduler (tasksched.msc)
2. Create New Task:
   - **Name:** ECDO Watch Monthly Baselines
   - **Trigger:** Monthly, 1st day, 07:00 UTC
   - **Action:** Run program
     - Program: `python.exe`
     - Arguments: `compute_baselines.py`
     - Start in: `C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\`

**Verify it worked:**
```bash
# On March 1st at 08:00 UTC (after run), check:
Get-ChildItem C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\baselines.json

# View baseline values:
type C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\baselines.json
```

---

## ⏳ Do This Daily (Starting Feb 1)

### Daily Task: Quick Health Check (5 minutes)

**Every morning, run:**

```bash
# Check if overnight run succeeded
type C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\last_run_status.json
```

**Expected output:**
```json
{
  "success": true,
  "duration_seconds": 231.253435,
  "timestamp_utc": "2026-01-27T08:45:07.624314+00:00"
}
```

**If "success": true → Continue to step 2**
**If "success": false → Investigate:**
```bash
# View latest log
Get-Content C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\ecdo_watch_*.log -Tail 50
```

---

## ⏳ Do This Weekly (Starting Feb 1)

### Weekly Task: Check for Anomalies (1 hour, any day)

**Every week, check if any anomalies occurred:**

```bash
# View health check output
cd C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts
python healthcheck.py
```

**Look for:**
- Kp index value
- LOD z-score
- Magnetometer z-score
- Multi-channel status

**If any z-score > 2.5 AND quiet day = Yes:**

→ **Record in operations_log.md:**

| Date | Time | Channels | Z-Scores | Quiet Day? | Known Event? | Classification |
|------|------|----------|----------|-----------|--------------|-----------------|
| 2026-02-15 | 06:30 | LOD, MAG | 2.8, 3.1 | Yes | ??? | TBD |

**Then investigate (30 min):**

1. Check NOAA space weather: https://www.noaa.gov/space-weather/swpc
2. Check USGS earthquakes: https://earthquake.usgs.gov
3. Check IERS status: https://datacenter.iers.org
4. Update "Known Event?" column with findings
5. Update "Classification" column:
   - **TP** = Found corresponding event
   - **FP** = No event found
   - **Indeterminate** = Unclear

**Example investigation result:**
| Date | Time | Channels | Z-Scores | Quiet Day? | Known Event? | Classification |
|------|------|----------|----------|-----------|--------------|-----------------|
| 2026-02-15 | 06:30 | LOD, MAG | 2.8, 3.1 | Yes | Kp spike on 2/16 | TP |

---

## ⏳ Do This Monthly (1st of each month)

### Monthly Task: Review Progress (15 minutes)

**On the 1st of each month (after automated baseline run):**

```bash
# 1. Check that baselines were computed
Get-ChildItem C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\baselines.json

# 2. Archive the baseline for trend tracking
Copy-Item -Path scripts\baselines.json -Destination "logs\baseline_$(Get-Date -Format 'yyyyMM').json"

# 3. Review operations_log.md for the past month
# Count anomalies found

# 4. Update monthly summary in operations_log.md:
```

**Add to operations_log.md monthly summary section:**

```markdown
### Month: 2026-02 (Feb 1-28)

**Key Metrics:**
- Total anomalies detected: ___ (2+ channels)
- True positives: ___
- False positives: ___
- Indeterminate: ___
- False-positive rate: ___% (if enough data)
- Quiet days: ___ / 28

**Notable Events:**
- [List any confirmed events]

**Data Quality:**
- API downtime: None / [list dates]
- Data gaps: None / [list dates]
- Baseline drift: [observations]

**Observations:**
- [Any patterns noticed?]
```

---

## 📊 Expected Results by Month

### February 2026
- **Anomalies Expected:** 2-5
- **Operations Log Entries:** 2-5
- **False-Positive Rate:** Too early to calculate
- **Baseline Updates:** 1 (March 1st)
- **Success Indicator:** Consistent daily runs, first anomalies documented

### March 2026
- **Anomalies Expected:** 3-7 (cumulative: 5-12)
- **Operations Log Entries:** 5-12 total
- **False-Positive Rate:** Emerging pattern (~70% data)
- **Baseline Updates:** 1 (April 1st)
- **Success Indicator:** External event correlations verified

### April 2026
- **Anomalies Expected:** 4-8 (cumulative: 9-20)
- **Operations Log Entries:** 20+ total
- **False-Positive Rate:** Calculated (~90% data)
- **Baseline Updates:** 1 (May 1st)
- **Success Indicator:** Ready to transition to Phase 2 validation

---

## Phase 1 Success Checklist

- [ ] **Consistency:** 100% daily automation success (90/90 runs)
- [ ] **Data Quality:** Zero data gaps, all channels operational
- [ ] **Documentation:** 20+ anomalies recorded with classification
- [ ] **External Validation:** All anomalies cross-referenced with catalogs
- [ ] **Monthly Updates:** Baseline computed 1st of Feb, Mar, Apr
- [ ] **Operations Log:** Monthly summaries completed (3 months)

**When ALL checked:** Proceed to Phase 2 (Validation Study)

---

## Commands for Quick Reference

### Check daily status
```bash
type C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\last_run_status.json
```

### Run weekly health check
```bash
cd C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts
python healthcheck.py
```

### View latest logs (troubleshooting)
```bash
Get-Content C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\ecdo_watch_*.log -Tail 50
```

### Check automation is working
```bash
Get-ScheduledTask -TaskName "ECDO Watch Daily Update" | Select-Object State, LastRunTime
```

### Manual data update (if needed)
```bash
cd C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts
python run_daily_update.py
```

---

## If Something Goes Wrong

### Problem: No daily update (status file old)
**Solution:**
1. Check internet connection (`ping 1.1.1.1`)
2. Check APIs are up: https://www.noaa.gov/space-weather/swpc
3. Run manual update: `python scripts\run_daily_update.py`
4. Check logs for error message

### Problem: Found anomaly but not sure how to classify
**Solution:**
1. Search NOAA: https://www.noaa.gov/space-weather/swpc (geomagnetic events)
2. Search USGS: https://earthquake.usgs.gov (earthquakes)
3. Search IERS: https://datacenter.iers.org (Earth rotation changes)
4. If found event within ±3 days → TP (True Positive)
5. If no event found → FP (False Positive)
6. If unclear → Indeterminate

### Problem: Baseline task didn't run on 1st of month
**Solution:**
1. Check task scheduler: `Get-ScheduledTask | grep "Baseline"`
2. If disabled: `Enable-ScheduledTask -TaskName "ECDO Watch Monthly Baselines"`
3. Run manually: `cd scripts && python compute_baselines.py`

---

## Resources

| Document | When to Read | Purpose |
|----------|-------------|---------|
| `operations_log.md` | Daily | Template for anomaly documentation |
| `VALIDATION_PLAN.md` | Weekly | Understanding Phase 2 goals |
| `BASELINE_AUTOMATION.md` | By Feb 28 | Setting up monthly automation |
| `FORWARD_PLAN_SUMMARY.md` | Monthly | Overall progress tracking |
| `README.md` | As needed | Daily operations reference |
| `OPERATIONS_MAINTENANCE_PLAN.md` | Troubleshooting | Detailed procedures |

---

## Monthly Checklist Template

**Copy this to your calendar for 1st of each month:**

```
[ ] Check baselines.json was created (verify with ls command)
[ ] Archive baseline to logs/baseline_yyyyMM.json
[ ] Count anomalies in operations_log.md for past month
[ ] Update monthly summary section in operations_log.md
[ ] Review any failures or data gaps in logs
[ ] Verify Kp, LOD, MAG data quality
[ ] Note any patterns or trends observed
```

---

## Timeline to Phase 2

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-02-01 | Phase 1 starts | ✓ TODAY |
| 2026-02-28 | Month 1 complete | ⏳ Track anomalies |
| 2026-03-01 | First baseline computed | ⏳ Check result |
| 2026-03-31 | Month 2 complete | ⏳ Update summary |
| 2026-04-01 | Second baseline computed | ⏳ Check result |
| 2026-04-30 | Month 3 complete + Phase 1 ends | ⏳ Ready for Phase 2 |
| 2026-05-01 | Phase 2 validation begins | ⏳ Run validation_study.py |

---

**Questions?** See full `FORWARD_PLAN_SUMMARY.md` or `VALIDATION_PLAN.md`

**Ready to start?** Begin with daily health checks today, then schedule baseline automation by Feb 28!
