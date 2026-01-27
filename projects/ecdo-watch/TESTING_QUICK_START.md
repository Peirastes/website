# ECDO Watch — Testing Quick Start Guide

**Last Updated:** 2026-01-27
**Purpose:** Quick reference for testing all 7 phases

---

## Prerequisites

```bash
# Verify Python installation
python --version  # Should be 3.8+

# Verify dependencies
pip list | grep -E "pandas|numpy|requests"
```

---

## Phase 1: Data Pipeline Resilience

### Test 1: Verify Retry Logic Works
```bash
# Run script - should complete despite network delays
cd projects/ecdo-watch/scripts
python generate_ecdo_watch_data.py

# Check logs for retry messages
grep -i "retry" ../logs/ecdo_watch_*.log
```

### Test 2: Verify IERS CSV Caching
```bash
# Check cache file exists and is < 7 days old
ls -lh assets/cache/finals2000A.all.csv

# Verify age is less than 7 days
# (current time - file modification time < 604800 seconds)
```

### Test 3: Verify Metadata in JSON
```bash
# Check that all JSON files have metadata
python3 -c "
import json
for fname in ['kp_data.json', 'lod_data.json', 'mag_data.json']:
    with open(f'assets/{fname}') as f:
        data = json.load(f)
        if 'metadata' in data:
            print(f'✓ {fname} has metadata')
            print(f'  generated_at: {data[\"metadata\"].get(\"generated_at\")}')
        else:
            print(f'✗ {fname} MISSING metadata')
"
```

---

## Phase 2: Quiet-Day Logic

### Test 1: Verify Quiet-Day Flags in Output
```bash
# Check that kp_data.json includes is_quiet array
python3 -c "
import json
with open('assets/kp_data.json') as f:
    data = json.load(f)
    if 'is_quiet' in data:
        quiet_count = sum(data['is_quiet'])
        total = len(data['is_quiet'])
        print(f'✓ Quiet-day flags present: {quiet_count}/{total} quiet days')
    else:
        print('✗ No is_quiet field in kp_data.json')
"
```

### Test 2: Check Different Time Ranges
```bash
# Verify all time ranges have quiet-day flags
for range in 30d 90d 1y 5y 10y; do
    python3 -c "
import json
try:
    with open(f'assets/kp_{range}.json') as f:
        data = json.load(f)
        if 'is_quiet' in data:
            print(f'✓ kp_{range}.json has is_quiet')
        else:
            print(f'✗ kp_{range}.json missing is_quiet')
except:
    print(f'! kp_{range}.json not found (may not be generated yet)')
"
done
```

### Test 3: Check Frontend Display
```bash
# Open ecdo-watch.html in browser
# Check Step 1 (Kp) card
# Should show "Quiet Days: X/Y" metric
# Chart should have subtle green background on quiet days
```

---

## Phase 3: Data Quality Indicators

### Test 1: Check Header Freshness Badge
```bash
# Open ecdo-watch.html
# Look at top-right corner
# Should show "✓ X minutes ago" or "⚠ Y hours ago"
# Color should be: Green (<1h), Yellow (1-24h), Red (>24h)
```

### Test 2: Check Source Attribution Footer
```bash
# Scroll to bottom of dashboard
# Should see:
# ✓ GFZ (Kp index)
# ✓ IERS (LOD)
# ✓ USGS Magnetometer (N/M stations) or ⚠ (if partial)
```

### Test 3: Verify Metadata Timestamps
```bash
# Check that generated_at is recent
python3 -c "
import json
from datetime import datetime, timezone, timedelta

with open('assets/kp_data.json') as f:
    data = json.load(f)
    gen_time = datetime.fromisoformat(data['metadata']['generated_at'])
    age = (datetime.now(timezone.utc) - gen_time).total_seconds() / 3600
    if age < 24:
        print(f'✓ Data is fresh ({age:.1f} hours old)')
    elif age < 168:
        print(f'⚠ Data is somewhat stale ({age:.1f} hours old)')
    else:
        print(f'✗ Data is STALE ({age:.1f} hours old)')
"
```

---

## Phase 4: Magnetometer Fallback

### Test 1: Check Station Sources
```bash
# Verify which source was used for each station
python3 -c "
import json
with open('assets/mag_data.json') as f:
    data = json.load(f)
    sources = data['metadata'].get('station_sources', {})
    statuses = data['metadata'].get('station_statuses', {})
    for station, source in sources.items():
        status = statuses.get(station, 'unknown')
        print(f'{station}: {source} ({status})')
"
```

### Test 2: Simulate USGS Failure (Advanced)
```bash
# Edit generate_ecdo_watch_data.py temporarily
# Change USGS_GEOMAG_WS to invalid URL
# Run script
# Should fall back to INTERMAGNET
# Check logs for "Using INTERMAGNET fallback" message
```

---

## Phase 5: Percentile Thresholds

### Test 1: Generate Baselines
```bash
cd scripts
python compute_baselines.py

# Check output
cat ../assets/baselines.json
```

### Test 2: Verify Percentile Values
```bash
python3 -c "
import json
with open('assets/baselines.json') as f:
    baseline = json.load(f)
    lod = baseline['lod']
    print(f'LOD Percentiles (ms):')
    print(f'  p50:  {lod[\"p50\"]:.3f}')
    print(f'  p90:  {lod[\"p90\"]:.3f}')
    print(f'  p95:  {lod[\"p95\"]:.3f}')
    print(f'  p99:  {lod[\"p99\"]:.3f}')
    # Verify ordering
    if lod['p50'] < lod['p90'] < lod['p95'] < lod['p99']:
        print('✓ Percentiles are correctly ordered')
    else:
        print('✗ ERROR: Percentiles out of order!')
"
```

---

## Phase 6: Alerting System

### Test 1: Configure Alerts (Optional)
```bash
# Edit alert_config.json
nano scripts/alert_config.json

# Change "alerts_enabled": true
# Fill in email settings (SMTP server, credentials, recipients)
# Or configure Slack/Discord webhooks
```

### Test 2: Test Email Alert
```bash
# Force a script failure to trigger email
# Edit generate_ecdo_watch_data.py temporarily
# Add: raise Exception("TEST ALERT") at the start of main()
# Run: python scripts/run_daily_update.py
# Check email inbox for alert (may take 30 seconds)
```

### Test 3: Test Webhook Alert
```bash
# If Slack/Discord configured:
# Same as email test - check that message appears in channel
```

---

## Phase 7: C20 Integration

### Test 1: Verify C20 Data Generated
```bash
# Check that c20_data.json exists
ls -l assets/c20_data.json

# Verify structure
python3 -c "
import json
with open('assets/c20_data.json') as f:
    data = json.load(f)
    print(f'C20 labels: {len(data[\"labels\"])} days')
    print(f'C20 data: {len(data[\"data\"])} values')
    print(f'Sample z-score: {data[\"data\"][-1]:.2f}')
    if -3 <= data['data'][-1] <= 3:
        print('✓ Z-score in expected range (±3σ)')
    else:
        print('⚠ Z-score outside expected range')
"
```

### Test 2: Check Time Ranges
```bash
# Verify all time ranges have C20 data
for range in 30d 90d 1y 5y; do
    if [ -f "assets/c20_${range}.json" ]; then
        echo "✓ c20_${range}.json exists"
    else
        echo "! c20_${range}.json not found (will be generated on next run)"
    fi
done
```

### Test 3: Check Frontend Display
```bash
# Open ecdo-watch.html
# Go to Step 3 (C20 card)
# Should show:
# - Green chart with C20 z-scores
# - Data age badge ("X days ago")
# - "C20 z (recent)" metric
# - "vs GIA" metric
```

---

## Full System Test

### Test 1: Run Complete Pipeline
```bash
cd projects/ecdo-watch/scripts
python generate_ecdo_watch_data.py 2>&1 | tee test_run.log

# Check exit code
echo "Exit code: $?"  # Should be 0

# Review log for any warnings
grep -i "warning\|error\|failed" test_run.log
```

### Test 2: Verify All Outputs
```bash
# Check that all expected files exist
cd assets
for f in kp_data.json lod_data.json mag_data.json c20_data.json; do
    if [ -f "$f" ]; then
        size=$(wc -c < "$f")
        echo "✓ $f ($size bytes)"
    else
        echo "✗ $f MISSING"
    fi
done
```

### Test 3: Check Dashboard
```bash
# Open ecdo-watch.html in browser
# Verify:
# 1. All 5 steps render (Kp, LOD, C20, MAG, Coherence)
# 2. Freshness badge shows in header
# 3. Source footer shows at bottom
# 4. Time range buttons work (30d, 90d, 1y, 5y, 10y)
# 5. Charts display data
# 6. No console errors (F12 > Console)
```

---

## Troubleshooting

### Script Fails to Run
```bash
# Check Python syntax
python -m py_compile scripts/generate_ecdo_watch_data.py

# Check dependencies
python -c "import requests; import pandas; import numpy"

# Check file permissions
ls -l scripts/*.py

# Run with verbose error output
python -u scripts/generate_ecdo_watch_data.py
```

### Data Not Showing in Dashboard
```bash
# Hard refresh browser
Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# Check browser console for errors
F12 > Console tab

# Check that JSON files exist and have data
python3 -c "
import json
for f in ['kp_data.json', 'lod_data.json', 'mag_data.json', 'c20_data.json']:
    try:
        with open(f'assets/{f}') as file:
            data = json.load(file)
            print(f'✓ {f}: {len(data.get(\"labels\", []))} points')
    except Exception as e:
        print(f'✗ {f}: {e}')
"
```

### Magnetometer Missing
```bash
# Check which source had issues
python3 -c "
import json
with open('assets/mag_data.json') as f:
    data = json.load(f)
    statuses = data['metadata'].get('station_statuses', {})
    sources = data['metadata'].get('station_sources', {})
    for station in ['BOU', 'FRD', 'BRW', 'HON']:
        print(f'{station}: {statuses.get(station, \"unknown\")} via {sources.get(station, \"none\")}')
"

# Check logs for specific errors
tail -50 logs/ecdo_watch_*.log | grep -i "magnetometer\|usgs\|intermagnet"
```

---

## Success Criteria

### All Tests Passing ✓
- [ ] Phase 1: Metadata present in all JSON files
- [ ] Phase 2: Quiet-day flags accurate and displayed
- [ ] Phase 3: Freshness badge and source footer visible
- [ ] Phase 4: Magnetometer fallback working (if needed)
- [ ] Phase 5: Baselines computed successfully
- [ ] Phase 6: Alerts configured (if enabled)
- [ ] Phase 7: C20 data generating and displaying

### Ready for Production ✓
- [ ] All 7 phases pass their tests
- [ ] No warnings in logs
- [ ] Dashboard displays all data
- [ ] Task Scheduler runs daily without errors
- [ ] Alerts configured (if alerting desired)

---

**Happy testing!**
