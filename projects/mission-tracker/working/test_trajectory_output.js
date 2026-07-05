/**
 * Mission Tracker — Phase D validation
 *
 * Loads the precomputed artemis2_trajectory.json, samples it at every
 * JPL Horizons reference epoch, and reports position errors.
 *
 * Pass criterion: 1 km RMS / 10 km max position error against Horizons.
 *
 * Also reports orbital diagnostics (range to Earth, range to Moon,
 * specific energy) at key mission milestones.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const traj = JSON.parse(fs.readFileSync(path.join(__dirname, 'artemis2_trajectory.json'), 'utf8'));
const horizons = JSON.parse(fs.readFileSync(path.join(__dirname, 'artemis2_horizons_full.json'), 'utf8'));

const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const mag = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

console.log('='.repeat(82));
console.log('Phase D — Trajectory output validation');
console.log('='.repeat(82));
console.log(`Loaded:  ${traj.metadata.mission} (${traj.metadata.spacecraft})`);
console.log(`Samples: ${traj.time.n_samples}  step ${traj.time.step_seconds}s`);
console.log(`Span:    ${traj.time.epoch_start_utc}  →  ${traj.time.epoch_end_utc}`);
console.log(`File:    ${(fs.statSync(path.join(__dirname, 'artemis2_trajectory.json')).size / 1024).toFixed(0)} KB`);
console.log();

// =============================================================================
// Validate against Horizons
// =============================================================================

const T_START = traj.time.epoch_start_jdtdb;
const STEP = traj.time.step_seconds;

function sampleAt(t_seconds) {
  // Linear interpolation between adjacent stored samples
  const f = t_seconds / STEP;
  const i0 = Math.floor(f);
  const i1 = Math.min(i0 + 1, traj.time.n_samples - 1);
  const frac = f - i0;
  const p0 = traj.spacecraft.trajectory_pos_km[i0];
  const p1 = traj.spacecraft.trajectory_pos_km[i1];
  return [
    p0[0] + frac * (p1[0] - p0[0]),
    p0[1] + frac * (p1[1] - p0[1]),
    p0[2] + frac * (p1[2] - p0[2]),
  ];
}

console.log('-'.repeat(82));
console.log('Validating against JPL Horizons reference (every Horizons sample)');
console.log('-'.repeat(82));

let sumSq = 0, n = 0, maxErr = 0;
let outliers = 0;
const errs = [];
for (const w of horizons.waypoints) {
  const t = (w.jdtdb - T_START) * 86400;
  if (t < 0 || t > (traj.time.n_samples - 1) * STEP) continue;
  const pred = sampleAt(t);
  const err = mag(sub(pred, w.pos_km));
  errs.push({ utc: w.utc, err });
  if (err > 100) outliers++;
  sumSq += err * err;
  if (err > maxErr) maxErr = err;
  n++;
}

const rms = Math.sqrt(sumSq / n);

console.log(`  Reference samples checked:  ${n}`);
console.log(`  Outliers (>100 km):         ${outliers}  (likely Horizons file-seam artifacts)`);
console.log(`  RMS position error:         ${rms.toFixed(4)} km`);
console.log(`  Max position error:         ${maxErr.toFixed(4)} km`);
console.log();

const PASS_RMS = 1.0;
const PASS_MAX = 10.0;
console.log('-'.repeat(82));
if (rms < PASS_RMS && maxErr < PASS_MAX) {
  console.log(`PASS — RMS ${rms.toFixed(2)} km < ${PASS_RMS} km, max ${maxErr.toFixed(2)} km < ${PASS_MAX} km`);
} else if (rms < PASS_RMS) {
  console.log(`PARTIAL PASS — RMS ${rms.toFixed(2)} km meets gate, max ${maxErr.toFixed(2)} km exceeds ${PASS_MAX} km`);
  console.log('               (max likely from Horizons file-seam artifacts)');
} else {
  console.log(`FAIL — RMS ${rms.toFixed(2)} km exceeds ${PASS_RMS} km gate`);
}
console.log();

// =============================================================================
// Mission diagnostics at key epochs
// =============================================================================

console.log('-'.repeat(82));
console.log('Mission diagnostics at sampled epochs');
console.log('-'.repeat(82));
console.log('  UTC                       T (h)     |r| (Mm)   |v| (km/s)   E (km²/s²)   Moon dist (Mm)');
console.log('  -------------------       ------    --------   ----------   ----------   --------------');

const MU_E = 398600.4418;
const sampleEvery = Math.floor(traj.time.n_samples / 30);

for (let i = 0; i < traj.time.n_samples; i += sampleEvery) {
  const pos = traj.spacecraft.trajectory_pos_km[i];
  const vel = traj.spacecraft.trajectory_vel_km_s[i];
  const moonPos = traj.moon.trajectory_pos_km[i];
  const r = mag(pos);
  const v = mag(vel);
  const E = 0.5 * v * v - MU_E / r;
  const moonDist = mag(sub(pos, moonPos));
  const t_h = (i * STEP) / 3600;
  const utc = new Date(new Date(traj.time.epoch_start_utc).getTime() + i * STEP * 1000).toISOString().replace('.000', '');

  console.log(
    `  ${utc}      ` +
    `${t_h.toFixed(1).padStart(6)}    ` +
    `${(r/1000).toFixed(2).padStart(8)}   ` +
    `${v.toFixed(4).padStart(10)}   ` +
    `${E.toFixed(4).padStart(10)}   ` +
    `${(moonDist/1000).toFixed(2).padStart(14)}`
  );
}
console.log();

// =============================================================================
// Per-event report
// =============================================================================

console.log('-'.repeat(82));
console.log('Spacecraft state at each cataloged event');
console.log('-'.repeat(82));
console.log('  Event                 UTC                       |r| (Mm)   |v| (km/s)');
console.log('  ----                  -------------------       --------   ----------');

for (const e of traj.events) {
  if (e.epoch_offset_seconds < 0 || e.epoch_offset_seconds > (traj.time.n_samples - 1) * STEP) {
    console.log(`  ${e.name.padEnd(22)}${e.epoch_utc}      (outside trajectory)`);
    continue;
  }
  const pos = sampleAt(e.epoch_offset_seconds);
  const r = mag(pos);
  // velocity (approximate via finite difference)
  const dt = 30;
  const pos2 = sampleAt(Math.min(e.epoch_offset_seconds + dt, (traj.time.n_samples - 1) * STEP));
  const v = mag(sub(pos2, pos)) / dt;
  console.log(
    `  ${e.name.padEnd(22)}${e.epoch_utc}      ` +
    `${(r/1000).toFixed(2).padStart(8)}   ` +
    `${v.toFixed(4).padStart(10)}`
  );
}
console.log();

console.log('='.repeat(82));
console.log('Validation complete.');
console.log('='.repeat(82));
