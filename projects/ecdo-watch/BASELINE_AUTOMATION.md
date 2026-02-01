# Monthly Baseline Automation Setup

**Purpose:** Automatically compute baseline thresholds every month (1st at 07:00 UTC)

**Why?** Baseline percentiles should be updated monthly to track threshold evolution and detect seasonal effects.

---

## Setup Instructions

### Windows Task Scheduler

**Option 1: PowerShell (Recommended)**
```powershell
# Run as Administrator
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
.\schedule_baseline_task.ps1
```

**Option 2: Manual Setup**
1. Open Windows Task Scheduler (tasksched.msc)
2. Create New Task:
   - **Name:** ECDO Watch Monthly Baselines
   - **Description:** Compute 90th/95th/99th percentile thresholds
   - **Trigger:** Monthly, 1st day at 07:00 UTC
   - **Action:** Run program
     - Program: `python.exe`
     - Arguments: `compute_baselines.py`
     - Start in: `C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\`
   - **Conditions:** Run only if network available
   - **Settings:** Allow task to run for up to 1 hour

### Linux/macOS Cron

```bash
# Edit crontab
crontab -e

# Add this line (runs 1st of month at 07:00 UTC)
0 7 1 * * cd /path/to/ecdo-watch/scripts && python compute_baselines.py >> ../logs/baseline_computation.log 2>&1
```

---

## Verification

### After First Run (1st of next month)

**Check log file:**
```bash
# View latest baseline log
Get-Content "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\baseline_computation.log" -Tail 30
```

**Verify output:**
```bash
# Check baselines.json was generated
Get-ChildItem "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\baselines.json"

# View baseline values
type "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\baselines.json"
```

### Expected Output Example

```json
{
  "computed_at": "2026-03-01T07:00:00+00:00",
  "period": "2026-02-01 to 2026-03-01",
  "lod_baselines": {
    "90th_percentile": 0.4,
    "95th_percentile": 0.6,
    "99th_percentile": 1.2
  },
  "kp_baselines": {
    "90th_percentile": 5.2,
    "95th_percentile": 6.1,
    "99th_percentile": 7.5
  },
  "alert_thresholds": {
    "NOMINAL": "z-score < 2.0σ",
    "ELEVATED_DIAGNOSTIC": "2.0σ < z < 2.5σ",
    "WATCH": "z-score > 2.5σ"
  }
}
```

---

## Monthly Baseline Checklist

**1st of each month at 07:30 UTC (after scheduled run):**

```bash
# 1. Verify task ran
Get-ScheduledTask -TaskName "ECDO Watch Monthly Baselines" | Select-Object State, LastRunTime, LastTaskResult

# 2. Check baseline file was created
ls -la C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts\baselines.json

# 3. View baseline values
python -c "
import json
with open('scripts/baselines.json') as f:
    data = json.load(f)
    print(f'Computed: {data[\"computed_at\"]}')
    print(f'LOD 90th: {data[\"lod_baselines\"][\"90th_percentile\"]:.2f}')
    print(f'KP 90th: {data[\"kp_baselines\"][\"90th_percentile\"]:.2f}')
"

# 4. Archive previous month's baseline
Copy-Item -Path scripts/baselines.json -Destination "logs/baselines_$(Get-Date -Format 'yyyyMM').json"
```

---

## Threshold Evolution Tracking

Over 8 months (Feb-Sep 2026), thresholds will reveal:

**Expected observations:**
- Seasonal patterns in Earth rotation (polar motion)
- Geomagnetic activity cycles (11-year solar)
- Drift in baseline values (validates anomaly detection)

**Monthly Baseline Log:**

| Month | LOD 90th | KP 90th | Notes |
|-------|----------|----------|--------|
| Feb | 0.35 | 4.8 | Starting baseline |
| Mar | 0.38 | 5.1 | Slight increase |
| Apr | 0.40 | 5.0 | Stabilizing |
| May | 0.41 | 5.2 | Spring pattern |
| ... | ... | ... | ... |

---

## Disabling Baseline Automation

**If needed (not recommended):**

```powershell
# Disable task
Disable-ScheduledTask -TaskName "ECDO Watch Monthly Baselines"

# To re-enable
Enable-ScheduledTask -TaskName "ECDO Watch Monthly Baselines"

# To delete task
Unregister-ScheduledTask -TaskName "ECDO Watch Monthly Baselines" -Confirm:$false
```

---

**Status:** Ready to automate
**Verification:** Will confirm after first run (2026-03-01)
