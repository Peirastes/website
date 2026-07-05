/**
 * Mission Tracker — Phase A: Burn data extraction
 *
 * This script does NOT try to extract impulsive ΔV vectors via velocity
 * differencing — that approach failed because gravity contributions during
 * the burn window dominate the small RTC burns, and TLI's velocity vector
 * rotates rapidly near perigee.
 *
 * INSTEAD, we treat the JPL Horizons state vectors as the authoritative
 * source. For each NASA-confirmed burn epoch, we record the pre-burn and
 * post-burn state vectors directly from Horizons. The Phase D simulator
 * will use these by:
 *   1. Propagating between burns under high-fidelity gravity (physics3d
 *      with Chebyshev Moon, J2, SRP, etc.)
 *   2. RESETTING the state at each burn epoch to the Horizons post-burn
 *      state.
 *
 * This means the Phase D validation gate (1 km RMS / 10 km max) measures
 * ONLY the propagator's accuracy between burns. Burn application is exact
 * by construction.
 *
 * Display ΔV magnitudes use the NASA-published values where available.
 *
 * NOTE: The simulation starts at the first Horizons sample (Apr 2 02:00
 * UTC), which is ~3.5 hours after launch. All pre-WP0 burns (apogee raise,
 * perigee raise, ICPS sep) are baked into the WP0 initial state. They
 * appear in the Storyteller UI as annotations only.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const mag = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);

// =============================================================================
// Burn definitions
// =============================================================================
//
// Each burn has:
//   - name: human-readable identifier
//   - epoch_utc: NASA-published burn start time (best available)
//   - duration_s: NASA-published burn duration in seconds
//   - published_dv_ms: NASA-published ΔV magnitude in m/s (where known)
//   - file: 1-minute Horizons fetch around the burn
//   - notes: source attribution
//
// The simulator uses pre/post state vectors from Horizons. Published ΔV
// is for display only.

const BURNS = [
  {
    name: 'TLI',
    full_name: 'Trans-Lunar Injection',
    epoch_utc: '2026-04-02T23:49:00Z',
    duration_s: 350,         // 5 min 50 s
    published_dv_ms: 388,    // ~388 m/s prograde from HEO; matches energy-jump method
    file: 'burn2_TLI.json',
    notes: 'ESM AJ10 main engine burn at HEO perigee. Source: NASA blog Apr 2 + energy method on Horizons.',
  },
  {
    name: 'OTC-3',
    full_name: 'Outbound Trajectory Correction 3',
    epoch_utc: '2026-04-06T03:05:00Z',  // Data shows 03:05, NASA blog said 03:03 ±2min
    duration_s: 17.5,
    published_dv_ms: null,   // Not in NASA blogs; estimated from data ~3 m/s
    file: 'burn3_OTC3.json',
    notes: 'Only OTC that fired (OTC-1 and OTC-2 cancelled). Source: NASA blog Apr 5 + Horizons.',
  },
  {
    name: 'RTC-1',
    full_name: 'Return Trajectory Correction 1',
    epoch_utc: '2026-04-08T00:06:00Z',  // Data shows distributed signature 00:06-00:09
    duration_s: 15,
    published_dv_ms: 0.488,  // 1.6 ft/s
    file: 'burn4_RTC1.json',
    notes: 'First return correction. Source: NASA blog Apr 7 (FD7 8:03 PM EDT).',
  },
  {
    name: 'RTC-2',
    full_name: 'Return Trajectory Correction 2',
    epoch_utc: '2026-04-10T02:53:00Z',
    duration_s: 9,
    published_dv_ms: 1.615,  // 5.3 ft/s
    file: 'burn5_RTC2.json',
    notes: 'Second return correction. Source: NASA blog Apr 9 (FD9 10:53 PM EDT).',
  },
  {
    name: 'RTC-3',
    full_name: 'Return Trajectory Correction 3',
    epoch_utc: '2026-04-10T18:53:00Z',
    duration_s: 8,
    published_dv_ms: 1.280,  // 4.2 ft/s
    file: 'burn6_RTC3.json',
    notes: 'Final entry alignment burn. Source: NASA blog Apr 10 (FD10 2:53 PM EDT).',
  },
];

// =============================================================================
// Helpers
// =============================================================================

/**
 * Find the Horizons sample closest to a given UTC time.
 */
function findClosestSample(samples, targetUtc) {
  const target = new Date(targetUtc).getTime();
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const diff = Math.abs(new Date(samples[i].utc).getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Compute a "naive ΔV" magnitude as the velocity-vector difference between
 * pre-burn and post-burn samples. This is an UPPER BOUND that includes
 * gravity contribution over the sampling interval. For small RTC burns,
 * gravity may dominate; for TLI, vector rotation makes magnitude misleading.
 *
 * Use this only for sanity-checking, not as the canonical ΔV.
 */
function naiveDelta(samples, idxPre, idxPost) {
  const dv = sub(samples[idxPost].vel_km_s, samples[idxPre].vel_km_s);
  return {
    dv_kms: dv,
    dv_magnitude_ms: mag(dv) * 1000,
    dt_s: (samples[idxPost].jdtdb - samples[idxPre].jdtdb) * 86400,
  };
}

// =============================================================================
// Process each burn
// =============================================================================

console.log('='.repeat(82));
console.log('Phase A — Burn data extraction (state injection method)');
console.log('='.repeat(82));
console.log();

const results = [];

for (const burnDef of BURNS) {
  const filePath = path.join(__dirname, burnDef.file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP ${burnDef.name}: ${burnDef.file} not found`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const samples = data.waypoints;

  // Find closest sample to NASA-published epoch
  const epochIdx = findClosestSample(samples, burnDef.epoch_utc);

  // Pre-burn: 2 minutes before the epoch (for short burns)
  // Post-burn: 2 minutes after the epoch + duration
  const preMargin = 120; // seconds
  const postMargin = 120;
  const preTime = new Date(burnDef.epoch_utc).getTime() - preMargin * 1000;
  const postTime = new Date(burnDef.epoch_utc).getTime() + (burnDef.duration_s + postMargin) * 1000;

  const preIdx = findClosestSample(samples, new Date(preTime).toISOString());
  const postIdx = findClosestSample(samples, new Date(postTime).toISOString());

  const pre = samples[preIdx];
  const post = samples[postIdx];

  const naive = naiveDelta(samples, preIdx, postIdx);

  console.log('-'.repeat(82));
  console.log(`${burnDef.name} — ${burnDef.full_name}`);
  console.log('-'.repeat(82));
  console.log(`  epoch:           ${burnDef.epoch_utc}`);
  console.log(`  duration:        ${burnDef.duration_s} s`);
  console.log(`  published ΔV:    ${burnDef.published_dv_ms !== null ? burnDef.published_dv_ms.toFixed(3) + ' m/s' : '(not published)'}`);
  console.log(`  Horizons file:   ${burnDef.file} (${samples.length} samples)`);
  console.log(`  pre  sample:     ${pre.utc}  |r| = ${(mag(pre.pos_km)/1000).toFixed(1)} Mm`);
  console.log(`  post sample:     ${post.utc}  |r| = ${(mag(post.pos_km)/1000).toFixed(1)} Mm`);
  console.log(`  naive |Δv⃗|:      ${naive.dv_magnitude_ms.toFixed(3)} m/s  (over ${naive.dt_s.toFixed(0)}s; includes gravity)`);
  console.log();

  results.push({
    name: burnDef.name,
    full_name: burnDef.full_name,
    epoch_utc: burnDef.epoch_utc,
    epoch_jdtdb: pre.jdtdb + (post.jdtdb - pre.jdtdb) / 2, // approximate
    duration_s: burnDef.duration_s,
    published_dv_ms: burnDef.published_dv_ms,
    naive_dv_kms: naive.dv_kms,
    naive_dv_magnitude_ms: naive.dv_magnitude_ms,
    state_pre: {
      utc: pre.utc,
      jdtdb: pre.jdtdb,
      pos_km: pre.pos_km,
      vel_km_s: pre.vel_km_s,
    },
    state_post: {
      utc: post.utc,
      jdtdb: post.jdtdb,
      pos_km: post.pos_km,
      vel_km_s: post.vel_km_s,
    },
    frame: 'ECI_ecliptic_J2000',
    notes: burnDef.notes,
  });
}

// =============================================================================
// Save canonical burn list
// =============================================================================

const canonical = {
  source: 'NASA JPL Horizons API + NASA mission update blogs (April 2026)',
  reference_frame: 'Ecliptic of J2000.0, Earth-centered',
  units: { dv: 'km/s (vectors), m/s (magnitudes)', position: 'km', time: 'JDTDB' },
  extraction_method: 'State injection from JPL Horizons. Pre/post state vectors are exact Horizons samples bracketing the NASA-published burn epoch with ±2 minute margin (plus burn duration).',
  simulation_usage: 'Phase D simulator propagates between burns using physics3d. At each burn epoch, the spacecraft state is reset to state_post. Display ΔV uses published_dv_ms where known.',
  notes_on_pre_WP0: 'Simulation begins at first Horizons sample (~Apr 2 02:00 UTC, T+3.5h). Earlier mission events (launch, apogee raise, perigee raise, ICPS sep) are baked into the initial state and appear in the Storyteller UI as annotations only.',
  burns: results,
};

fs.writeFileSync(
  path.join(__dirname, 'artemis2_burns.json'),
  JSON.stringify(canonical, null, 2)
);

console.log('='.repeat(82));
console.log(`Wrote artemis2_burns.json with ${results.length} burns.`);
console.log();
console.log('Phase A complete. Burn data is ready for Phase D state-injection simulator.');
console.log('Display ΔV magnitudes use NASA-published values where available; the naive');
console.log('Horizons-derived magnitudes are stored alongside as an upper-bound sanity check.');
console.log('='.repeat(82));
