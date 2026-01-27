# ECDO Watch — Operations, Maintenance & Upgrade Plan

**Project:** ECDO Watch (Exothermic Core Decoupling Oscillation Monitor)
**Type:** Falsification-first geophysics observer (React frontend + Python data pipeline)
**Date:** 2026-01-26
**Status:** Production with synthetic LOD fallback

---

## 1. PROJECT OVERVIEW

### Mission
Monitor internal Earth-system anomalies (rotation/orientation, mass distribution, ground magnetic field) via daily automated data ingestion and real-time dashboard rendering. Purpose: **early warning + falsification**, not prediction.

### Architecture
- **Frontend:** React 18 (Babel transpilation in-browser) + Chart.js visualization
- **Backend:** Python 3 data pipeline that fetches real scientific data
- **Data Sources:** NOAA SWPC, IERS, GFZ, USGS, NASA GSFC
- **Delivery:** Standalone HTML + JSX (deployable to any web server)

### 5-Step Logic
1. **External Forcing Gate** (Kp/Dst) — suppress internal inference if magnetosphere is disturbed
2. **Earth Orientation (LOD)** — rotation rate anomalies
3. **Mass Distribution (C20)** — slow confirmatory signal
4. **Ground Magnetic (multi-station)** — station-normalized residuals + composite
5. **Cross-Channel Coherence** — only flag when multiple independent channels agree

---

## 2. CURRENT STATE ASSESSMENT

### ✅ What Works
- React dashboard renders correctly with dark theme + responsive UI
- HTML/JSX asset loading with fallback synthetic data
- Multi-time-range buttons (30d, 90d, 1y, 5y, 10y) in UI
- Kp/Dst gating logic implemented
- 4-station magnetometer support (BOU, HON, BRW/SJG)
- Status banners (NOMINAL, ELEVATED_DIAGNOSTIC, WATCH) with color-coded alerts
- Robust z-score calculations in Python script

### ⚠️ Known Limitations
1. **LOD Data:** Currently synthetic (generated with mathematical patterns, not real IERS data)
   - Status: Fallback mode active
   - Impact: Long-baseline (5y, 10y) views are mathematical, not observational

2. **IERS EOP API Issues:** Script attempts both IERS JSON (daily) + CSV (all-time)
   - Daily endpoint sometimes fails; CSV fallback less frequent
   - No automatic retry logic with exponential backoff

3. **USGS Magnetometer Limitations:** API only reliably serves ~60–90 days of recent data
   - Cannot backfill historical multi-station composite
   - Chunking mechanism in place but limited by source availability

4. **C20 (Mass Distribution):** Not yet integrated
   - Script placeholder exists but GSFC fetch not wired
   - Needed for "lagged confirmatory" step 3

5. **Missing Features:**
   - No data freshness timestamps in JSON (hard to know age of magnetometer observations)
   - No quiet-day sample counts displayed (required for coherence validation)
   - No percentile/rarity scoring against historic distributions
   - Hardcoded status badges (GATE OPEN, NOMINAL) regardless of actual data

### 🔴 Data Pipeline Issues
1. **Path Handling:** Assets assumed at `./assets/` from browser
   - Works if HTML is served from project root
   - Fails if HTML is in subdirectory or iframe

2. **Error Handling:** Python script lacks graceful degradation for partial failures
   - If one station fails, composite may not compute
   - Should skip failed sources and warn, not crash

3. **Cache Strategy:** GFZ Kp cache only (other sources have no cache)
   - Network timeouts on slow/intermittent connections
   - No fallback to previous day's data

---

## 3. OPERATIONAL PROCEDURES

### Daily Update Workflow

#### 3.1 Automated Data Generation
**When:** Daily, ~06:00 UTC (after NOAA/IERS publish daily values)

**Command:**
```bash
cd /path/to/projects/ecdo-watch/scripts
python3 generate_ecdo_watch_data.py
```

**Expected Output:**
- `assets/kp_data.json` — Last 14 days of Kp
- `assets/kp_{30d,90d,1y,5y,10y}.json` — Multi-range subsets
- `assets/lod_data.json` — Last 90 days (currently synthetic)
- `assets/lod_{30d,90d,1y,5y,10y}.json` — Multi-range subsets
- `assets/mag_data.json` — Last 60 days (multi-station + composite)
- `assets/mag_{30d,90d,1y,5y,10y}.json` — Multi-range subsets
- `assets/historical_aa.json` — Annual Kp mean (50 years)
- `assets/historical_pm.json` — Annual Polar Motion (50 years)

**Failure Modes:**
| Issue | Symptom | Resolution |
|-------|---------|-----------|
| IERS timeout | LOD JSON older than 1 day | Synthetic data activates; check network |
| USGS 404 | MAG station code mismatch | Verify station codes (BOU, HON, BRW) with USGS docs |
| GFZ cache stale | Kp stops updating | Delete `assets/cache/` and rerun |
| Network down | All fetches fail | Script exits; previous JSON remain (stale but functional) |

#### 3.2 Manual Verification (Post-Update)
1. Open `ecdo-watch.html` in browser
2. Verify "Updated:" timestamp is today's date (UTC)
3. Spot-check Kp plot shows plausible daily values (0–9 range)
4. LOD plot should show ±2–3 ms variation (not flat, not extreme swings)
5. Magnetometer composite should center near 0 with occasional spikes

#### 3.3 Alert Triage
**If status changes to ELEVATED_DIAGNOSTIC or WATCH:**
1. Check Kp gate — if Kp > 4 on day of alert, alert is suppressed (expected)
2. Review which channel(s) flagged (LOD, MAG, or both)
3. Inspect raw values in dev console: `window.alignedData`
4. Cross-reference with USGS/NOAA raw data sources
5. Log observation with timestamp and raw z-scores

---

## 4. MAINTENANCE SCHEDULE

### Weekly
- [ ] Verify script runs without errors (check logs)
- [ ] Spot-check one random day's Kp and LOD values against source data
- [ ] Review browser console for JavaScript errors (open dev tools)

### Monthly
- [ ] Review data freshness — ensure no JSON files older than 7 days
- [ ] Check IERS and USGS API status pages for known outages
- [ ] Verify asset paths (`./assets/`) work from production server location
- [ ] Test time-range buttons in UI (all 5 buttons load correctly)

### Quarterly
- [ ] Full end-to-end test: Delete all `assets/*.json`, rerun script, verify render
- [ ] Audit data sources for deprecations:
  - NOAA SWPC Kp endpoint
  - IERS EOP API
  - USGS GEOMAG web service
  - GFZ Kp file format
- [ ] Review script logs for warnings or partial failures

### Annually
- [ ] Archive previous year's alerts and anomalies
- [ ] Audit quiet-day sample counts (should grow; track coverage %)
- [ ] Perform baselined percentile recalculation (for phase 6)
- [ ] Review documentation and update assumptions

---

## 5. UPGRADE ROADMAP

### Phase 1: Data Pipeline Robustness (NEXT)
**Goal:** Eliminate synthetic LOD fallback; add error recovery

**Tasks:**
1. [ ] Integrate IERS all-time CSV fetch with retry logic (exponential backoff, max 3 attempts)
2. [ ] Cache IERS CSV locally; update weekly instead of on-demand
3. [ ] Add data freshness metadata to all JSON files:
   ```json
   {
     "metadata": {
       "generated_utc": "2026-01-26T06:15:00Z",
       "sources": ["IERS", "USGS"],
       "age_hours": 2.5
     },
     "labels": [...],
     "data": [...]
   }
   ```
4. [ ] Implement station-level error reporting:
   - If BOU fails, still compute composite from HON+BRW+SJG
   - Log failed stations but don't crash
5. [ ] Add GFZ Kp retry + fallback to NOAA SWPC archive

**Success Criteria:**
- Script runs daily with zero failures for 30 days
- Real IERS LOD replaces synthetic data
- All JSON include freshness timestamps

**Effort:** 2–3 days

---

### Phase 2: Frontend Data Validation & UI Feedback
**Goal:** Show data quality indicators; prevent stale data from silently misleading

**Tasks:**
1. [ ] Display "Data Age" badges next to each section:
   - "Kp: 2 hours old" (green if < 24h, yellow if < 7d, red if older)
   - "LOD: 3 days old"
   - "MAG: 1 hour old"
2. [ ] Add data source attribution footer (which IERS/USGS/GFZ version)
3. [ ] Show quiet-day sample count on coherence card:
   - "18 quiet days in last 90d" (required for valid coherence)
4. [ ] Alert if time-range data incomplete:
   - "10y view: only 7 years available"

**Success Criteria:**
- Users know immediately if dashboard is showing stale data
- No confusion about data freshness

**Effort:** 1 day

---

### Phase 3: Quiet-Day Logic Implementation
**Goal:** Proper gating; suppress internal inference when magnetosphere is active

**Tasks:**
1. [ ] Implement quiet-day definition in Python:
   - Day is "quiet" if `kp_max ≤ 4.0` AND `dst_min ≥ -50.0`
   - Store quiet-day flag in all JSON
2. [ ] Frontend: filter LOD + MAG z-scores to quiet days only
3. [ ] Coherence: only compute correlation for quiet-day pairs
4. [ ] Quiet-day counter visible on coherence card

**Success Criteria:**
- Coherence metric only changes on quiet days
- Storm days don't pollute the signal

**Effort:** 2 days

---

### Phase 4: C20 (Step 3) Integration
**Goal:** Add lagged mass-distribution confirmatory signal

**Tasks:**
1. [ ] Fetch NASA GSFC SLR C20 time series
2. [ ] Detrend C20 relative to GIA model (post-glacial rebound)
3. [ ] Compute z-scores relative to 10-year baseline
4. [ ] Add C20 card to UI (similar to LOD)
5. [ ] Include in coherence analysis (optional; lower weight due to lag)

**Success Criteria:**
- C20 plot renders; z-scores in ±3 range
- Documented lag relative to other channels

**Effort:** 2–3 days

---

### Phase 5: Percentile & Watch Level Calibration
**Goal:** Replace hardcoded thresholds with data-driven rarity percentiles

**Tasks:**
1. [ ] Compute historic distributions for:
   - LOD z-scores (quiet days only, 10y baseline)
   - MAG composite z-scores (quiet days only, 5y baseline)
   - EOP↔MAG correlation (rolling 30d, N ≥ 10 quiet days)
2. [ ] Define watch levels by percentile:
   - NOMINAL: LOD z < 2σ, MAG z < 2σ, coherence r < 0.3
   - ELEVATED_DIAGNOSTIC: One channel > 2.5σ
   - WATCH: LOD + MAG both > 2.5σ OR coherence r > 0.5 (quiet-gate open)
3. [ ] Report "99th percentile vs quiet-day history" on each metric

**Success Criteria:**
- All thresholds justified by 10+ year baselines
- <1% false positive rate on quiet days

**Effort:** 3–4 days (requires backtesting)

---

### Phase 6: Historical Archive & Seasonal Correction
**Goal:** Reduce false positives from seasonal/lunar cycles

**Tasks:**
1. [ ] Archive daily JSON snapshots (one file per day)
2. [ ] Analyze seasonal patterns in LOD, MAG (Fourier analysis)
3. [ ] Detrend z-scores for known seasonal signals
4. [ ] Document Earth-Moon-Sun cycle effects on LOD

**Success Criteria:**
- Seasonal peaks filtered out; true anomalies stand out
- Archive searchable by date

**Effort:** 2 weeks (research-heavy)

---

### Phase 7: API Stability & High Availability
**Goal:** Production-ready reliability

**Tasks:**
1. [ ] Containerize script (Docker)
2. [ ] Deploy with cron job (or systemd timer) for daily runs
3. [ ] Implement Sentry/logging for error tracking
4. [ ] Add data validation schema (JSON Schema for all asset files)
5. [ ] Health check endpoint (`/health` returns freshness + error summary)

**Success Criteria:**
- 99.5% uptime over 3 months
- All failures logged with remediation instructions

**Effort:** 1 week

---

## 6. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All Python dependencies in `requirements.txt` pinned and tested
- [ ] Script runs without errors on fresh environment
- [ ] All asset files validated (JSON schema check)
- [ ] Browser console clean (no JS errors)
- [ ] Time-range buttons load all 5 ranges correctly
- [ ] Status badges update based on data

### Deployment
- [ ] Copy `ecdo-watch.html` to web root
- [ ] Copy `ecdo-watch.jsx` to project directory
- [ ] Copy `scripts/generate_ecdo_watch_data.py` to scripts
- [ ] Verify asset paths resolve correctly from deployed location
- [ ] Set up daily cron job for data generation
- [ ] Test from live URL (not localhost)

### Post-Deployment
- [ ] Verify "Updated:" timestamp reflects current time
- [ ] Spot-check all 5 time-range buttons
- [ ] Test on mobile/tablet
- [ ] Share with stakeholders for feedback

---

## 7. TROUBLESHOOTING REFERENCE

### Problem: Dashboard shows "Experimental analysis tool" but no data
**Cause:** Assets not found
**Fix:**
1. Check browser console for 404 errors on JSON fetch
2. Verify asset paths are correct (relative to HTML location)
3. Ensure `assets/` directory exists and contains JSON files
4. If iframe: ensure CORS headers allow asset loading

### Problem: Kp plot flat or unrealistic
**Cause:** Data not refreshed, or fetch failed silently
**Fix:**
1. Check `assets/kp_data.json` modification date
2. Rerun `python3 generate_ecdo_watch_data.py`
3. Check GFZ Kp source status online
4. If failed: review script stdout/stderr logs

### Problem: LOD shows perfectly synthetic sine waves
**Cause:** IERS fetch failed; synthetic fallback activated
**Fix:**
1. Check IERS JSON API status
2. Verify network connectivity
3. Try IERS CSV fetch manually
4. If persistent: integrate alternative source (e.g., SOMOS)

### Problem: Magnetometer shows only zeros
**Cause:** USGS API outage or station code mismatch
**Fix:**
1. Verify USGS GEOMAG service online
2. Check USGS station codes: `bou`, `hon`, `brw` (lowercase)
3. Test fetch manually: curl USGS API with date range
4. Check script logs for HTTP error codes

### Problem: Time-range buttons don't load different data
**Cause:** Multi-range JSON not generated
**Fix:**
1. Verify `kp_30d.json`, `lod_90d.json`, etc. exist
2. Check `generate_time_range_datasets()` runs without error
3. Confirm JSON files have content (not empty)
4. Reload browser cache (Ctrl+Shift+R)

---

## 8. DOCUMENTATION & REFERENCES

### Key Files
- `ecdo-watch.md` — Project synthesis & philosophy
- `ecdo-watch.jsx` — React component (render logic)
- `generate_ecdo_watch_data.py` — Data pipeline
- `requirements.txt` — Python dependencies

### External Resources
- [NOAA SWPC Kp Index](https://www.noaa.gov/space-weather/swpc)
- [IERS EOP Data](https://datacenter.iers.org)
- [USGS Geomag Services](https://geomag.usgs.gov)
- [GFZ Kp Historical](https://kp.gfz.de)
- [NASA GSFC SLR C20](https://earth.gsfc.nasa.gov)

### Governance
- **Falsification-First:** Assume benign explanations; require multiple channels + gating before escalation
- **Deontological Doubt:** Moral obligation to avoid false positives
- **Transparency:** Always show sample sizes, data age, and null interpretation

---

## 9. SUCCESS METRICS

### Operational Health
- ✅ Script runs daily with 95%+ success rate
- ✅ All JSON files < 24 hours old
- ✅ Dashboard renders in < 2 seconds
- ✅ Zero unhandled JavaScript errors

### Scientific Quality
- ✅ Quiet-day sample counts visible and tracked
- ✅ Watch levels correspond to < 1% rarity vs. baseline
- ✅ No alerts triggered by known seasonal patterns
- ✅ Cross-channel coherence validated

### User Experience
- ✅ Data freshness clear (timestamps shown)
- ✅ Alert messages unambiguous (not narrative-driven)
- ✅ Time-range buttons functional and responsive
- ✅ Mobile-friendly rendering

---

## 10. CONTACT & ESCALATION

**Questions about data sources?** Check external resource links (Section 8).

**Data fetch failures?** Review logs; consult source documentation.

**Want to add a new channel?** Plan Phase task; estimate effort; document assumptions.

**Report a bug?** Log with timestamp, affected component, and expected vs. actual behavior.

---

**Plan Version:** 1.0
**Last Updated:** 2026-01-26
**Next Review:** 2026-02-26
