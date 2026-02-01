# ECDO Watch Operations Log

**Purpose:** Document all multi-channel anomalies, external geophysical context, and validation observations.

**Tracking Period:** 2026-02-01 onwards (Phase 1: Passive Monitoring)

**Instructions:**
- Record any day where 2+ channels show anomalies (z-score > 2.0)
- Cross-reference with NOAA/USGS/IERS event catalogs
- Classify as: True Positive (correlates with event), False Positive (no known event), or Indeterminate (unclear)
- Use daily health check output to populate table

---

## Anomaly Log

| Date | Time (UTC) | Channels Triggered | Z-Scores | Quiet Day? | Known Event? | Classification | Notes |
|------|------------|-------------------:|-----------|-----------|--------------|------------------|--------|
| YYYY-MM-DD | HH:MM | Channel1, Channel2 | 2.8, 3.1 | Yes/No | Event name or "None found" | TP/FP/Indeterminate | Brief description of investigation |

---

## Monthly Summary Template

### Month: YYYY-MM

**Monitoring Period:** 2026-MM-01 to 2026-MM-31

**Key Metrics:**
- Total anomalies detected: ___ (2+ channels)
- True positives: ___
- False positives: ___
- Indeterminate: ___
- False-positive rate: ___% (FP / (TP + FP))
- Quiet days: ___ / 31

**Notable Events:**
- [List any confirmed geophysical events with dates]

**Data Quality:**
- API downtime: None / [list dates]
- Data gaps: None / [list dates]
- Baseline drift: [observations]

**Observations:**
- [Any patterns, seasonal effects, or threshold drifts observed?]

---

## Investigation Checklist

When recording an anomaly, verify against:

### NOAA/USGS Event Catalogs
- [ ] Check NOAA Space Weather Prediction Center: https://www.noaa.gov/space-weather/swpc
- [ ] Check USGS Earthquake Hazards: https://earthquake.usgs.gov
- [ ] Check NOAA Geophysical Events Calendar

### IERS Earth Orientation
- [ ] Check IERS rapid series updates: https://datacenter.iers.org
- [ ] Compare LOD z-score to official IERS status

### Magnetosphere
- [ ] Check IPS Space Weather: https://www.ips.gov.au/space-weather
- [ ] Check NOAA Dst index (geomagnetic storm level)
- [ ] Cross-reference with Kp quiet-day gate status

### Confirm Multi-Channel Coherence
- [ ] Verify at least 2 independent channels show > 2.0σ anomaly
- [ ] Check if anomalies occur on same day
- [ ] Assess temporal coherence (within hours vs. days apart)

---

## Data Collection Tools

### Daily Health Check Command
```bash
cd scripts
python healthcheck.py
```

### Extract Latest Anomalies
```bash
# View last run's metrics
type logs\last_run_status.json

# View detailed log with z-scores
Get-Content logs\ecdo_watch_*.log -Tail 50 | Select-String "z-score"
```

### Manual Data Query
```python
# Python script to extract anomalies from JSON
import json

with open('assets/mag_30d.json') as f:
    data = json.load(f)
    for i, point in enumerate(data['magnetometer']['data']):
        if abs(point['z_score']) > 2.0:
            print(f"{point['date']}: z={point['z_score']:.2f}")
```

---

## Phase 1 Success Criteria (Feb-Apr 2026)

- [ ] 90 consecutive days of successful daily runs (100% uptime)
- [ ] 20+ anomalies documented with context
- [ ] Monthly baselines computed (1st of each month)
- [ ] Zero data gaps
- [ ] External event cross-reference methodology proven

**Expected Timeline:**
- Feb: 5-10 anomalies expected
- Mar: 5-10 anomalies expected
- Apr: 5-10 anomalies expected

---

**Last Updated:** 2026-02-01
**Next Review:** 2026-03-01 (end of Month 1)
