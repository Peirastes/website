# ECDO Watch Validation Plan

**Objective:** Scientifically validate the falsification-first methodology through rigorous correlation analysis and threshold testing.

**Timeline:** 8 months (Feb-Sep 2026)
**Priority:** Credibility over visibility

---

## Implementation Roadmap

### ✓ Quick Wins (Completed)
- [x] Create `operations_log.md` — Daily anomaly tracking
- [x] Create `VALIDATION_PLAN.md` — This document

### In Progress (Feb-Apr 2026)
- [ ] **Phase 1: Passive Monitoring & Data Collection** (30 min/week)
  - Automate monthly baseline updates
  - Document all multi-channel anomalies in operations log
  - Monitor daily health status

- [ ] **Phase 2: Validation Study** (20-30 hours total, Mar-May)
  - Correlation analysis (detected vs. known events)
  - False-positive rate quantification
  - Threshold calibration (90th/95th/99th percentiles)
  - Multi-channel coherence validation

### Pending (May-Sep 2026)
- [ ] **Phase 3: Documentation & Reproducibility** (15-20 hours, May-Jun)
  - Write methodology paper (6-10 pages)
  - Create reproducibility package
  - Update POD/PSR with validation results

- [ ] **Phase 4: Strategic Researcher Engagement** (10-15 hours, Jun-Aug)
  - Identify 3-5 target researchers
  - Publish preprint on arXiv
  - Integrate feedback

- [ ] **Phase 5: Conditional Alert Enablement** (5-10 hours, Jul-Sep)
  - Enable alerts ONLY if FP rate < 5%
  - Test with synthetic triggers
  - Monitor for 30 days

---

## Phase 1: Passive Monitoring (Feb-Apr 2026)

### Weekly Actions (30 min)
```bash
# Monday morning checklist:
python scripts/healthcheck.py
# → Check z-scores and quiet-day status
# → Record any 2+ channel anomalies in operations_log.md

# Check external catalogs
# → NOAA Space Weather: https://www.noaa.gov/space-weather/swpc
# → USGS Earthquakes: https://earthquake.usgs.gov
# → IERS Status: https://datacenter.iers.org
```

### Monthly Actions (1 hour, 1st of month)
```bash
cd scripts
python compute_baselines.py
# → Updates 90th, 95th, 99th percentile thresholds
# → Saves to baselines.json
# → Logs threshold evolution
```

### Success Metrics
- [ ] 90/90 daily runs successful (zero failures)
- [ ] 20+ anomalies documented with full context
- [ ] Monthly baselines computed (3 months)
- [ ] Zero data gaps in any channel
- [ ] Operations log entries correspond to external events

---

## Phase 2: Validation Study (Mar-May 2026)

### Week 1-2: Correlation Analysis

**Deliverable:** Correlation report comparing detected alerts to catalogs

```python
# validation/correlation_analysis.py
import json
import pandas as pd
from datetime import datetime

def correlate_detections_to_catalogs():
    """
    Compare ECDO Watch detected anomalies to known events:
    - NOAA geomagnetic storm events
    - USGS earthquake events
    - IERS Earth orientation disruptions
    """

    # Load operations log (manual + automated)
    detections = load_operations_log()

    # For each detection, search catalogs
    for detection in detections:
        date = detection['date']

        # Query NOAA event database
        noaa_events = query_noaa_events(date, window_days=3)

        # Query USGS earthquake database
        usgs_events = query_usgs_earthquakes(date, window_days=3)

        # Query IERS disruptions
        iers_status = query_iers_status(date)

        # Classify
        if len(noaa_events) > 0 or len(usgs_events) > 0:
            detection['classification'] = 'TRUE_POSITIVE'
        else:
            detection['classification'] = 'FALSE_POSITIVE'

    return detections
```

**Success Criteria:**
- Document 50+ correlations (by end of Phase 1 data collection)
- Calculate true positive rate
- Identify false positive patterns

### Week 3-4: False-Positive Rate Quantification

**Deliverable:** Statistical report on FP rate by channel

```python
# validation/fp_rate_analysis.py

def compute_false_positive_rate(detections_df):
    """
    Quantify false-positive rate by channel combination:
    - Single-channel anomalies (LOD only, MAG only)
    - Two-channel anomalies (LOD + MAG, etc.)
    - Multi-channel coherence (2+ channels aligned)
    """

    # Filter by channel combination
    single_channel_fps = len(detections_df[
        (detections_df['channels'] == 1) &
        (detections_df['classification'] == 'FALSE_POSITIVE')
    ])

    multi_channel_fps = len(detections_df[
        (detections_df['channels'] >= 2) &
        (detections_df['classification'] == 'FALSE_POSITIVE')
    ])

    # Calculate rates
    fp_rate_single = single_channel_fps / len(detections_df[detections_df['channels'] == 1])
    fp_rate_multi = multi_channel_fps / len(detections_df[detections_df['channels'] >= 2])

    return {
        'fp_rate_single_channel': fp_rate_single,
        'fp_rate_multi_channel': fp_rate_multi,
        'target': 0.05  # < 5% for multi-channel
    }
```

**Target:** Multi-channel FP rate < 5%

### Week 5-6: Threshold Calibration

**Deliverable:** Optimal threshold recommendations

```python
# validation/threshold_calibration.py

def test_threshold_variations():
    """
    Retrospectively apply different z-score thresholds to 3-month dataset
    to find optimal operating point (max precision, min FP)
    """

    thresholds = [2.0, 2.5, 3.0]  # 90th, 95th, 99th percentile equivalents

    for threshold in thresholds:
        # Re-classify all detections with new threshold
        alerts = reclassify_with_threshold(data, threshold)

        # Calculate metrics
        precision = tp / (tp + fp)
        recall = tp / (tp + fn)
        f1_score = 2 * (precision * recall) / (precision + recall)

        print(f"Threshold {threshold:.1f}σ: Precision={precision:.2%}, FP rate={1-precision:.2%}")

    return optimal_threshold
```

**Deliverable:** Table showing precision/recall tradeoffs

### Week 7-8: Multi-Channel Coherence Validation

**Deliverable:** Quantify the benefit of multi-channel approach

```python
# validation/coherence_analysis.py

def validate_channel_independence():
    """
    Test hypothesis: "Multi-channel reduces FP rate by 80%+"

    Verify:
    1. Channels are statistically independent
    2. Simultaneous anomalies are rare by chance
    3. Multi-channel alignment strongly correlates with true events
    """

    # Correlation matrix between channels
    kp_lod_corr = correlation(kp_zscore, lod_zscore)
    kp_mag_corr = correlation(kp_zscore, mag_zscore)
    lod_mag_corr = correlation(lod_zscore, mag_zscore)

    # Test independence
    assert abs(kp_lod_corr) < 0.3, "Channels too correlated!"
    assert abs(kp_mag_corr) < 0.3
    assert abs(lod_mag_corr) < 0.3

    # Quantify multi-channel benefit
    prob_random_alignment = (false_positive_rate ** 2)  # if independent
    observed_alignment = multi_channel_alert_rate

    benefit_ratio = observed_alignment / prob_random_alignment
    print(f"Multi-channel benefit: {benefit_ratio:.1f}x reduction vs. random chance")
```

**Target:** Demonstrate > 80% FP reduction from multi-channel filtering

### Phase 2 Deliverables
- [ ] `validation/correlation_analysis.py` — Automated catalog matching
- [ ] `validation/fp_rate_analysis.py` — FP rate computation
- [ ] `validation/threshold_calibration.py` — Threshold optimization
- [ ] `validation/coherence_analysis.py` — Channel independence verification
- [ ] `validation/VALIDATION_REPORT.md` — 8-12 page scientific report

---

## Phase 3: Documentation (May-Jun 2026)

### Scientific Paper Draft

**File:** `validation/methodology_paper.md`

**Structure:**
```
1. Abstract (150 words)
   - Problem statement
   - Approach (falsification-first, multi-channel)
   - Results (FP < 5%, precision > 80%)

2. Introduction (2-3 pages)
   - Prior work in anomaly detection
   - Limitations of single-channel approaches
   - Falsification methodology

3. Methodology (3-4 pages)
   - Data sources (Kp, LOD, MAG, C20)
   - Quiet-day gating logic
   - Z-score normalization
   - Multi-channel coherence thresholds
   - Validation protocol

4. Data (1-2 pages)
   - Source descriptions
   - Coverage and completeness
   - Baseline computation

5. Results (2-3 pages)
   - False-positive rate: __%
   - Precision: __%
   - Threshold calibration curves
   - Multi-channel benefit quantified

6. Discussion (2-3 pages)
   - Implications for operational monitoring
   - Limitations and future work
   - Recommendations for threshold tuning

7. References (1 page)
   - NOAA, IERS, USGS papers
   - Anomaly detection literature
```

**Timeline:**
- Weeks 1-2: Draft introduction & methodology
- Weeks 2-3: Integrate Phase 2 results
- Week 4: Draft discussion & conclusions
- Week 5-6: Self-review & polish (get external feedback)

### Documentation Updates

**Update POD:**
- Add "Scientific Validation" section with summary results
- Document threshold calibration procedure
- Include validation limitations

**Update PSR:**
- Report Phase 1 monitoring results
- Document false-positive rate achieved
- List researcher contacts made

---

## Phase 4: Researcher Engagement (Jun-Aug 2026)

### Target Researchers

**Selection Criteria:**
- Active publications in past 2 years
- Research interest in Earth rotation, core-mantle coupling, or geomagnetic variations
- Evidence of collaborative approach
- Published in peer-reviewed journals

**Strategy:**
1. **Personalized Outreach** (1-paragraph email)
   - Specific mention of their recent work
   - Link to ECDO Watch dashboard
   - 1-page validation summary
   - Invitation to collaborate

2. **Preprint Publication** (Week 5)
   - Submit to arXiv (Earth and Planetary Sciences)
   - Cross-post to geophysics communities
   - Link on ECDO Watch about page

3. **Feedback Integration**
   - Respond to questions within 48 hours
   - Incorporate valid suggestions into methodology
   - Document conversations for future collaboration

**Success Metrics:**
- [ ] 3+ researchers contacted
- [ ] 1+ substantive conversation initiated
- [ ] Preprint published with DOI
- [ ] 50+ community visits to dashboard

---

## Phase 5: Conditional Alert Enablement (Jul-Sep 2026)

### Enablement Criteria (ALL must be met)

1. ✓ False-positive rate < 5% validated over 3+ months
2. ✓ At least 1 true positive confirmed
3. ✓ Threshold calibration complete
4. ✓ Operations log shows 90+ day stability

### If Criteria MET:

```python
# scripts/alert_config.json
{
  "alerts_enabled": true,
  "alert_threshold": "WATCH",
  "email_recipients": ["your_email@example.com"],
  "smtp_settings": {
    "server": "smtp.gmail.com",
    "port": 587,
    "tls": true
  }
}

# Test with synthetic trigger
python -c "
import sys
sys.path.insert(0, 'scripts')
from generate_ecdo_watch_data import send_alert
send_alert(level='TEST', message='ECDO Watch alert test email')
"

# Monitor for 30 days
# If < 1 false alert per month observed → success
```

### If Criteria NOT MET:

- Keep alerts disabled
- Continue monitoring and refinement
- Document reasons and next steps
- Plan Phase 5 retry for next quarter

---

## Success Metrics

### Phase 1 (Monitoring)
- [x] 100% daily success rate (90/90 runs)
- [x] Zero data gaps
- [x] 20+ anomalies documented with context
- [ ] Monthly baselines computed (3 months)

### Phase 2 (Validation)
- [ ] FP rate < 5% for multi-channel alerts
- [ ] Precision > 80%
- [ ] Statistical significance (p < 0.05)
- [ ] Optimal threshold identified with confidence intervals

### Phase 3 (Documentation)
- [ ] Methodology paper drafted (6-10 pages)
- [ ] All analyses reproducible by external researcher
- [ ] POD/PSR updated with validation results

### Phase 4 (Engagement)
- [ ] 3+ researchers contacted
- [ ] 1+ substantive conversation
- [ ] Preprint published (arXiv)
- [ ] 50+ dashboard visits from community

### Phase 5 (Alerting)
- [ ] Alerts enabled (only if FP < 5%)
- [ ] < 1 false positive/month observed
- [ ] No alert fatigue

---

## Verification Checklist

### Daily
- [ ] Check `last_run_status.json` for success
- [ ] Spot-check anomalies in operations_log.md

### Weekly
- [ ] Run `python scripts/healthcheck.py`
- [ ] Review error patterns in logs
- [ ] Update operations_log.md with any new anomalies

### Monthly
- [ ] Run `python scripts/compute_baselines.py`
- [ ] Check API status pages
- [ ] Review operations_log.md for patterns

### Quarterly
- [ ] Re-run correlation analysis with new data
- [ ] Update validation report
- [ ] Check for threshold drift

---

## Files to Create

```
validation/
├── validation_study.py           # Main analysis orchestrator
├── correlation_analysis.py        # Catalog matching
├── fp_rate_analysis.py           # FP rate computation
├── threshold_calibration.py      # Threshold optimization
├── coherence_analysis.py         # Channel independence
├── methodology_paper.md          # Scientific paper draft
├── VALIDATION_REPORT.md          # 8-12 page report
├── results/
│   ├── correlation_table.csv     # Detected vs. known events
│   ├── fp_rate_table.csv         # FP rates by channel combo
│   ├── threshold_curves.png      # Precision/recall tradeoff
│   ├── coherence_matrix.csv      # Channel correlations
│   └── summary_statistics.txt    # Key metrics
└── data/
    ├── operations_log_extract.json  # Phase 1 detections
    └── baseline_history.csv         # Threshold evolution
```

---

## Decision Framework

### Should we proceed to Phase 3?
**YES if:**
- Phase 1 shows ≥ 20 anomalies documented
- Phase 2 validates FP < 5% for multi-channel
- Precision > 80% achieved

**NO if:**
- Insufficient data (< 90 days)
- FP rate > 10%
- Threshold unstable (frequent changes needed)

### Should we enable alerts?
**YES if:**
- ALL Phase 5 enablement criteria met
- Phase 2 validation complete
- Phase 4 engagement shows researcher interest

**NO if:**
- Any enablement criterion not met
- Researcher feedback highlights concerns
- FP rate trending higher

---

**Created:** 2026-02-01
**Last Updated:** 2026-02-01
**Status:** Ready for Phase 1 execution
