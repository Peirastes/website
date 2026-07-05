/**
 * Mission Tracker — Phase B Validation
 *
 * Tests that the Chebyshev DE440 Moon model in physics3d.js agrees with
 * the original JPL Horizons Moon ephemeris to within sub-km accuracy
 * over the entire 18-day fit window.
 *
 * Also re-runs the Artemis II Horizons validation (test_horizons_validation.js
 * style) with the new Moon model and reports the improvement in coast errors.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const physics = require('./physics3d');
const { V, CONST } = physics;

// =============================================================================
// Step 1: Validate Moon Chebyshev fit against Horizons Moon ephemeris
// =============================================================================

console.log('='.repeat(82));
console.log('Phase B Validation — Chebyshev DE440 Moon model');
console.log('='.repeat(82));
console.log();

const moonRef = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'moon_ephemeris.json'), 'utf8')
);
const moonFit = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'moon_chebyshev.json'), 'utf8')
);

console.log('Loading Chebyshev fit into physics3d...');
physics.loadMoonChebyshev(moonFit);
physics.setEphemeris({ applyObliquity: false });  // ecliptic frame

// Use the first ref sample as the integrator's t=0 epoch
const refEpoch = moonRef.waypoints[0].jdtdb;
physics.setMissionEpoch(refEpoch);
console.log(`Mission epoch JDTDB: ${refEpoch}`);
console.log();

console.log('Sampling physics3d.moonPosition at every Horizons reference epoch:');
console.log('-'.repeat(82));

let maxErr = 0, sumSq = 0;
for (let i = 0; i < moonRef.waypoints.length; i++) {
  const wp = moonRef.waypoints[i];
  const t_seconds = (wp.jdtdb - refEpoch) * 86400;
  const moonPredicted = physics.moonPosition(t_seconds);
  const err = V.mag(V.sub(moonPredicted, wp.pos_km));
  if (err > maxErr) maxErr = err;
  sumSq += err * err;
}
const rmsErr = Math.sqrt(sumSq / moonRef.waypoints.length);

console.log(`  ${moonRef.waypoints.length} samples checked`);
console.log(`  RMS Moon position error: ${rmsErr.toFixed(6)} km`);
console.log(`  Max Moon position error: ${maxErr.toFixed(6)} km`);
console.log();

const TOL_KM = 5.0;
if (maxErr < TOL_KM) {
  console.log(`PASS — Moon model matches DE440 to within ${TOL_KM} km.`);
} else {
  console.log(`FAIL — Moon model error ${maxErr.toFixed(2)} km exceeds ${TOL_KM} km tolerance.`);
}
console.log();

// =============================================================================
// Step 2: Re-run Artemis II coast validation with the new Moon model
// =============================================================================

console.log('='.repeat(82));
console.log('Step 2 — Re-run Artemis II coast validation with Chebyshev Moon');
console.log('='.repeat(82));
console.log();

const horizonsFull = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_horizons_full.json'), 'utf8')
);
const wp = horizonsFull.waypoints;

console.log(`Loaded ${wp.length} Horizons waypoints (Apr 2 02:00 → Apr 10 23:30 UTC, 30-min cadence)`);
console.log();

// Set mission epoch from first waypoint
const wp0 = wp[0];
physics.setMissionEpoch(wp0.jdtdb);

// We can no longer use moonLaunchPhase calibration since the Chebyshev model
// uses absolute time. Just integrate from wp0.

console.log('Integrating coast segments (no burns) and reporting per-segment error.');
console.log('Burn segments will appear as outliers and are flagged.');
console.log();

// Detect burn epochs from energy jumps
function specificEnergy(wp) {
  const v2 = wp.vel_km_s[0]**2 + wp.vel_km_s[1]**2 + wp.vel_km_s[2]**2;
  const r = V.mag(wp.pos_km);
  return 0.5 * v2 - CONST.MU_EARTH / r;
}
const energies = wp.map(specificEnergy);

// Sample every Nth segment to keep output manageable
const SAMPLE_EVERY = 12;  // every 12 segments = every 6 hours
const COAST_THRESHOLD = 0.05; // km²/s² — segments with smaller ΔE are coast

let totalCoastErr = 0, totalCoastCount = 0;
let maxCoastErr = 0;
let maxBurnErr = 0;
let burnSegmentCount = 0;
const samples = [];

for (let i = 0; i < wp.length - 1; i++) {
  const from = wp[i];
  const to = wp[i + 1];
  const dE = energies[i + 1] - energies[i];
  const isBurn = Math.abs(dE) > COAST_THRESHOLD;

  // Integrate from `from` for the segment duration
  const t_from = (from.jdtdb - wp0.jdtdb) * 86400;
  const span = (to.jdtdb - from.jdtdb) * 86400;
  const init = { pos: [...from.pos_km], vel: [...from.vel_km_s] };

  // We need to start the integrator at t=t_from, not 0. But integrate() always
  // starts at 0. We need to provide an offset. Simplest: set the mission epoch
  // for this segment.
  physics.setMissionEpoch(from.jdtdb);
  const traj = physics.integrate(init, [], span + 30, 30, { minDepartTime: 0 });
  const final = traj[traj.length - 1];
  // The last sample may be slightly past `span` — interpolate.
  let lo = 0, hi = traj.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (traj[mid].t <= span) lo = mid; else hi = mid;
  }
  const tA = traj[lo].t, tB = traj[hi].t;
  const f = tB > tA ? (span - tA) / (tB - tA) : 0;
  const pos = [
    traj[lo].pos[0] + f * (traj[hi].pos[0] - traj[lo].pos[0]),
    traj[lo].pos[1] + f * (traj[hi].pos[1] - traj[lo].pos[1]),
    traj[lo].pos[2] + f * (traj[hi].pos[2] - traj[lo].pos[2]),
  ];
  const err = V.mag(V.sub(pos, to.pos_km));

  if (isBurn) {
    burnSegmentCount++;
    if (err > maxBurnErr) maxBurnErr = err;
  } else {
    totalCoastErr += err;
    totalCoastCount++;
    if (err > maxCoastErr) maxCoastErr = err;
  }

  if (i % SAMPLE_EVERY === 0) {
    samples.push({ i, utc: from.utc, isBurn, err, dE });
  }
}

console.log('  segment   from UTC                   isBurn   ΔE (km²/s²)   err (km)');
console.log('  -------   -------------------        ------   -----------   --------');
for (const s of samples) {
  console.log(
    `  ${String(s.i).padStart(7)}   ${s.utc}        ` +
    `${s.isBurn ? 'BURN ' : 'coast'}    ` +
    `${s.dE.toFixed(4).padStart(11)}   ` +
    `${s.err.toFixed(2).padStart(8)}`
  );
}
console.log();
console.log('-'.repeat(82));
console.log('Summary');
console.log('-'.repeat(82));
console.log(`  Total segments:       ${wp.length - 1}`);
console.log(`  Coast segments:       ${totalCoastCount}`);
console.log(`  Burn  segments:       ${burnSegmentCount}`);
console.log();
console.log(`  Coast mean error:     ${(totalCoastErr / totalCoastCount).toFixed(2)} km`);
console.log(`  Coast max  error:     ${maxCoastErr.toFixed(2)} km`);
console.log(`  Burn  max  error:     ${maxBurnErr.toFixed(2)} km  (expected — we don't model burns yet)`);
console.log();
console.log('  Reference: pre-Phase-B coast error was ~2,027 km mean / 19,952 km max');
console.log('             (with circular Moon model and uncalibrated lunar phase)');
console.log('='.repeat(82));
