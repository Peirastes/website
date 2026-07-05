/**
 * Mission Tracker — Phase 3 Step 2 Validation
 *
 * Validates the 3D physics engine (physics3d.js) against real NASA JPL
 * Horizons state vectors for Artemis II / Orion (target -1024).
 *
 * Method:
 *   1. Load 16 Horizons waypoints (Ecliptic J2000, Earth-centered).
 *   2. Configure physics3d in ecliptic frame (applyObliquity = false) so
 *      both engine and reference data live in the same frame.
 *   3. Calibrate moonLaunchPhase using the WP0→WP1 segment, which is a
 *      pre-TLI free-coast leg (~T+6h to T+18h, no burns).
 *   4. Integrate every adjacent waypoint pair (12h each) and report the
 *      position error at the next waypoint.
 *   5. Coast segments should match within a few thousand km. Segments
 *      containing real burns (TLI, OPF, OTC-3, RTC-1, RTC-2) should
 *      stand out as huge outliers — we don't model those burns here.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const physics = require('./physics3d');
const { V, CONST } = physics;

// -----------------------------------------------------------------------------
// Load reference data
// -----------------------------------------------------------------------------

const horizons = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_horizons.json'), 'utf8')
);
const wp = horizons.waypoints;

console.log('='.repeat(76));
console.log('Phase 3 Step 2 — 3D Physics vs JPL Horizons (Artemis II / Orion)');
console.log('='.repeat(76));
console.log('Source:    ', horizons.source);
console.log('Frame:     ', horizons.reference_frame);
console.log('Center:    ', horizons.center_body);
console.log('Waypoints: ', wp.length);
console.log();

// -----------------------------------------------------------------------------
// Frame configuration
// -----------------------------------------------------------------------------
// Horizons returned ecliptic J2000.0 coordinates. physics3d normally rotates
// from ecliptic to equatorial via the obliquity. Disable that rotation to
// keep the engine's native frame aligned with the reference data.

physics.setEphemeris({
  applyObliquity: false,
  // moonInclination stays at default 5.145° relative to ecliptic
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// Compute Moon's launch-phase argument for a segment that starts at the given
// absolute mission elapsed time. The integrator's internal t starts at 0 for
// each segment, so the launch phase has to be advanced by the absolute MET.
function moonPhaseForSegment(moonAngleAtMET0, metStart) {
  return moonAngleAtMET0 + (2 * Math.PI * metStart) / CONST.LUNAR_PERIOD;
}

// Integrate a segment starting from `wpFrom` for the duration to `wpTo`.
function integrateSegment(wpFrom, wpTo, moonAngleAtMET0, dt = 30) {
  physics.setEphemeris({
    moonLaunchPhase: moonPhaseForSegment(moonAngleAtMET0, wpFrom.met_seconds),
  });

  const span = wpTo.met_seconds - wpFrom.met_seconds;
  const init = { pos: [...wpFrom.pos_km], vel: [...wpFrom.vel_km_s] };
  const traj = physics.integrate(init, [], span + dt, dt, {
    minDepartTime: 0, // already in HEO/cislunar — no reentry guard needed
  });

  // Find sample bracketing the segment end time and linearly interpolate.
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
  const vel = [
    traj[lo].vel[0] + f * (traj[hi].vel[0] - traj[lo].vel[0]),
    traj[lo].vel[1] + f * (traj[hi].vel[1] - traj[lo].vel[1]),
    traj[lo].vel[2] + f * (traj[hi].vel[2] - traj[lo].vel[2]),
  ];

  return { pos, vel };
}

// Position error after integrating a segment with the given calibration.
function segmentError(wpFrom, wpTo, moonAngleAtMET0) {
  const { pos } = integrateSegment(wpFrom, wpTo, moonAngleAtMET0);
  return V.mag(V.sub(pos, wpTo.pos_km));
}

// -----------------------------------------------------------------------------
// Step A — energy diagnostic on each waypoint
// -----------------------------------------------------------------------------
// Specific orbital energy (E = v²/2 − μ/r). For a free coast, E is constant.
// Sudden jumps mark burns.

console.log('-'.repeat(76));
console.log('Step A — Specific orbital energy at each waypoint');
console.log('         (jumps mark burns; smooth runs are coast)');
console.log('-'.repeat(76));
const energies = wp.map((p) => {
  const r = V.mag(p.pos_km);
  const v2 = V.dot(p.vel_km_s, p.vel_km_s);
  const E = 0.5 * v2 - CONST.MU_EARTH / r;
  return { utc: p.utc, met: p.met_seconds, r, E };
});
let prevE = null;
for (let i = 0; i < energies.length; i++) {
  const e = energies[i];
  const dE = prevE === null ? 0 : e.E - prevE;
  const flag = Math.abs(dE) > 0.5 ? '  *** burn segment' : '';
  console.log(
    `  WP${String(i).padStart(2)}  ${e.utc}  ` +
    `|r|=${(e.r / 1000).toFixed(1).padStart(7)}Mm  ` +
    `E=${e.E.toFixed(3).padStart(8)}  ` +
    `ΔE=${dE.toFixed(3).padStart(7)}${flag}`
  );
  prevE = e.E;
}
console.log();

// -----------------------------------------------------------------------------
// Step B — calibrate moonLaunchPhase on the WP0→WP1 free-coast segment
// -----------------------------------------------------------------------------

console.log('-'.repeat(76));
console.log('Step B — Calibrating moonLaunchPhase on WP0→WP1 coast segment');
console.log('-'.repeat(76));

const wpFrom = wp[0];
const wpTo = wp[1];
console.log(`  Segment: ${wpFrom.utc}  →  ${wpTo.utc}`);
console.log(`  Span:    ${(wpTo.met_seconds - wpFrom.met_seconds) / 3600} h`);
console.log();

// Coarse sweep over [0, 2π)
let bestPhase = 0;
let bestErr = Infinity;
const COARSE_N = 360;
for (let i = 0; i < COARSE_N; i++) {
  const phase = (2 * Math.PI * i) / COARSE_N;
  const err = segmentError(wpFrom, wpTo, phase);
  if (err < bestErr) { bestErr = err; bestPhase = phase; }
}
console.log(`  Coarse sweep (1° resolution): best phase = ${(bestPhase * 180 / Math.PI).toFixed(2)}°` +
            `, error = ${(bestErr / 1000).toFixed(3)} Mm`);

// Refine
let lo = bestPhase - (Math.PI / COARSE_N);
let hi = bestPhase + (Math.PI / COARSE_N);
for (let iter = 0; iter < 5; iter++) {
  const M = 100;
  for (let i = 0; i <= M; i++) {
    const phase = lo + ((hi - lo) * i) / M;
    const err = segmentError(wpFrom, wpTo, phase);
    if (err < bestErr) { bestErr = err; bestPhase = phase; }
  }
  const span = (hi - lo) / 8;
  lo = bestPhase - span;
  hi = bestPhase + span;
}
console.log(`  Refined:                       best phase = ${(bestPhase * 180 / Math.PI).toFixed(4)}°` +
            `, error = ${(bestErr / 1000).toFixed(4)} Mm`);
console.log(`  → calibrated moonAngleAtMET0 = ${bestPhase.toFixed(6)} rad`);
console.log();

// -----------------------------------------------------------------------------
// Step C — apply calibration to every segment, report errors
// -----------------------------------------------------------------------------

console.log('-'.repeat(76));
console.log('Step C — Per-segment integration vs Horizons reference');
console.log('-'.repeat(76));
console.log('  seg  start UTC                end UTC                 ' +
            'Δr (km)        Δr (Mm)   verdict');

const segmentResults = [];
for (let i = 0; i < wp.length - 1; i++) {
  const f = wp[i], t = wp[i + 1];
  const { pos, vel } = integrateSegment(f, t, bestPhase);
  const dPos = V.sub(pos, t.pos_km);
  const dVel = V.sub(vel, t.vel_km_s);
  const posErr = V.mag(dPos);
  const velErr = V.mag(dVel);
  const energyJump = Math.abs(energies[i + 1].E - energies[i].E);
  const isBurn = energyJump > 0.5;
  const verdict = isBurn
    ? '*** burn (expected)'
    : (posErr < 50000 ? 'COAST OK' : 'coast diverged');
  segmentResults.push({ i, posErr, velErr, isBurn });
  console.log(
    `  ${String(i).padStart(2)}→${String(i + 1).padStart(2)}  ` +
    `${f.utc}  ${t.utc}  ` +
    `${posErr.toFixed(1).padStart(12)}  ` +
    `${(posErr / 1000).toFixed(3).padStart(7)}   ${verdict}`
  );
}
console.log();

// -----------------------------------------------------------------------------
// Step D — verdict on coast-only segments
// -----------------------------------------------------------------------------

const coastSegments = segmentResults.filter((s) => !s.isBurn);
const burnSegments = segmentResults.filter((s) => s.isBurn);

console.log('-'.repeat(76));
console.log('Step D — Verdict (coast-only segments)');
console.log('-'.repeat(76));
console.log(`  Total segments:      ${segmentResults.length}`);
console.log(`  Coast segments:      ${coastSegments.length}`);
console.log(`  Burn segments:       ${burnSegments.length} (excluded from verdict)`);

if (coastSegments.length > 0) {
  const meanCoastErr = coastSegments.reduce((s, e) => s + e.posErr, 0) / coastSegments.length;
  const maxCoastErr = Math.max(...coastSegments.map((e) => e.posErr));
  const lunarFraction = meanCoastErr / CONST.LUNAR_DIST;
  console.log();
  console.log(`  Mean coast error:    ${(meanCoastErr / 1000).toFixed(3)} Mm  (${meanCoastErr.toFixed(0)} km)`);
  console.log(`  Max  coast error:    ${(maxCoastErr / 1000).toFixed(3)} Mm  (${maxCoastErr.toFixed(0)} km)`);
  console.log(`  Mean as fraction of lunar distance: ${(lunarFraction * 100).toFixed(2)}%`);
  console.log();

  // Pass criterion: < 5% of lunar distance for a 12h coast leg.
  // The Moon ephemeris is a circular Keplerian model so we don't expect
  // sub-1000-km accuracy without a real ephemeris.
  const PASS = 0.05;
  console.log('='.repeat(76));
  if (lunarFraction < PASS) {
    console.log(`PASS — 3D engine reproduces coast segments within ${(PASS * 100).toFixed(0)}% of lunar distance.`);
    console.log('       Burn segments diverge as expected (we did not model real burns).');
    console.log('       Phase 3 Step 2 validation: COMPLETE.');
  } else {
    console.log(`NEEDS WORK — coast error ${(lunarFraction * 100).toFixed(2)}% > ${(PASS * 100).toFixed(0)}% threshold.`);
    console.log();
    console.log('Likely causes:');
    console.log('  - Simplified Moon ephemeris (circular orbit; no eccentricity ≈ 0.055)');
    console.log('  - No J2 oblateness term');
    console.log('  - Calibrated only on phase, not radial position');
  }
  console.log('='.repeat(76));
}
