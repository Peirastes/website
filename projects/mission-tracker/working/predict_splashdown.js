/**
 * Mission Tracker — Phase E
 * Splashdown predictor
 *
 * Loads the precomputed Artemis II trajectory, picks up where the JPL
 * Horizons reference data ends (Apr 10 23:30 UTC, ~17 min before
 * splashdown), and integrates forward through the atmospheric entry phase
 * until the spacecraft reaches sea level. Reports the predicted splashdown
 * coordinates and time, and compares against the published Artemis II
 * splashdown zone (~50 mi off San Diego, 32.5°N, 118°W).
 *
 * Pipeline:
 *   1. Load artemis2_trajectory.json (Phase D output)
 *   2. Take the LAST sample's spacecraft state (Apr 10 23:30 UTC, ~13 Mm
 *      from Earth center, ~7.7 km/s)
 *   3. Configure physics3d for the entry phase: same gravity model as
 *      Phase D, plus atmospheric drag with Orion CM (post-ESM-sep) entry
 *      parameters
 *   4. Integrate forward in 1-second RK4 steps until altitude ≤ 0
 *   5. Convert final position to ECEF then geodetic for lat/lon
 *   6. Report results and gate against the target zone
 */

'use strict';

const fs = require('fs');
const path = require('path');
const physics = require('./physics3d');
const { V, CONST } = physics;

const RAD = 180 / Math.PI;
const DEG = Math.PI / 180;

// =============================================================================
// Load reference data
// =============================================================================

const traj = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_trajectory.json'), 'utf8')
);
const moonFit = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'moon_chebyshev.json'), 'utf8')
);

// Published splashdown target (approximate zone, NASA hasn't released exact lat/lon)
const TARGET_LAT_DEG = 32.5;
const TARGET_LON_DEG = -118.0;
const TARGET_UTC = '2026-04-11T00:07:00Z';

console.log('='.repeat(82));
console.log('Phase E — Splashdown Predictor');
console.log('='.repeat(82));
console.log();

// =============================================================================
// Configure physics
// =============================================================================

physics.loadMoonChebyshev(moonFit);
physics.setEphemeris({
  applyObliquity: false,        // ecliptic frame to match trajectory
  includeJ2:      true,
  includeSRP:     true,         // negligible during entry but harmless
  includeDrag:    true,         // ENABLE DRAG for entry
  spacecraftMassEntry_kg: 9300, // Orion CM only
  spacecraftDragArea_m2:  19.5, // heat shield
  spacecraftCd:           1.4,
  spacecraftLD:           0.05, // Effective average lift after bank modulation
});

// =============================================================================
// Initial state: last sample of the precomputed trajectory
// =============================================================================

const N = traj.time.n_samples;
const lastIdx = N - 1;
const initial = {
  pos: [...traj.spacecraft.trajectory_pos_km[lastIdx]],
  vel: [...traj.spacecraft.trajectory_vel_km_s[lastIdx]],
};
const startJD = traj.time.epoch_start_jdtdb + lastIdx * traj.time.step_seconds / 86400;
const startUTC = new Date(
  new Date(traj.time.epoch_start_utc).getTime() + lastIdx * traj.time.step_seconds * 1000
).toISOString();

physics.setMissionEpoch(startJD);

const r0 = V.mag(initial.pos);
const v0 = V.mag(initial.vel);
const alt0 = r0 - CONST.R_EARTH;

console.log('Initial state (handoff from Phase D):');
console.log(`  UTC:        ${startUTC}`);
console.log(`  JDTDB:      ${startJD.toFixed(8)}`);
console.log(`  pos (km):   [${initial.pos.map(v => v.toFixed(1)).join(', ')}]`);
console.log(`  vel (km/s): [${initial.vel.map(v => v.toFixed(4)).join(', ')}]`);
console.log(`  |r|:        ${r0.toFixed(1)} km   altitude: ${alt0.toFixed(1)} km`);
console.log(`  |v|:        ${v0.toFixed(4)} km/s`);
console.log();

// =============================================================================
// Integrate to splashdown
// =============================================================================

console.log('Integrating to splashdown...');
console.log();

let state = { pos: [...initial.pos], vel: [...initial.vel] };
let t = 0;
const ENTRY_INTERFACE_KM = 120;
const SPLASHDOWN_KM = 0;

const stages = [];
let inAtmosphere = false;
let lastReportTime = -Infinity;

// Two-phase integration:
//  Phase 1: pre-entry coast with dt = 5 s (alt > 120 km)
//  Phase 2: atmospheric entry with dt = 0.5 s (alt < 120 km, drag active)
let dt_step = 5;
const MAX_T = 3600; // 1 hour limit

while (t < MAX_T) {
  // Switch to fine timestep below entry interface
  const alt = V.mag(state.pos) - CONST.R_EARTH;
  if (!inAtmosphere && alt < ENTRY_INTERFACE_KM) {
    // Report entry interface location in lat/lon
    const ei_jd = startJD + t / 86400;
    const ei_eq = physics.eclipticToEquatorial(state.pos);
    const ei_ecef = physics.eciToEcef(ei_eq, ei_jd);
    const ei_geo = physics.ecefToGeodetic(ei_ecef);
    console.log(`  T+${t.toFixed(1)} s — entry interface (alt ${alt.toFixed(1)} km), v=${V.mag(state.vel).toFixed(4)} km/s`);
    console.log(`           lat ${(ei_geo.lat * RAD).toFixed(3)}°  lon ${(ei_geo.lon * RAD).toFixed(3)}°`);
    stages.push({ event: 'entry interface', t, alt, v: V.mag(state.vel),
                  lat_deg: ei_geo.lat * RAD, lon_deg: ei_geo.lon * RAD });
    inAtmosphere = true;
    dt_step = 0.5;
  }

  // Splashdown check
  if (alt <= SPLASHDOWN_KM) {
    console.log(`  T+${t.toFixed(1)} s — splashdown (alt ${alt.toFixed(1)} km)`);
    break;
  }

  // Periodic progress in atmosphere
  if (inAtmosphere && t - lastReportTime > 30) {
    console.log(`  T+${t.toFixed(0)} s — alt ${alt.toFixed(1)} km, v ${V.mag(state.vel).toFixed(3)} km/s`);
    lastReportTime = t;
  }

  state = physics.rk4Step(state, t, dt_step);
  t += dt_step;
}

console.log();

// =============================================================================
// Final state → splashdown lat/lon
// =============================================================================

const finalJD = startJD + t / 86400;
const finalUTC = new Date(
  new Date(startUTC).getTime() + t * 1000
).toISOString();

console.log('-'.repeat(82));
console.log('Final state');
console.log('-'.repeat(82));
console.log(`  Elapsed:      ${t.toFixed(1)} s  (${(t / 60).toFixed(1)} min)`);
console.log(`  UTC:          ${finalUTC}`);
console.log(`  JDTDB:        ${finalJD.toFixed(8)}`);
console.log(`  pos (km):     [${state.pos.map(v => v.toFixed(1)).join(', ')}]`);
console.log(`  vel (km/s):   [${state.vel.map(v => v.toFixed(4)).join(', ')}]`);
console.log(`  |r|:          ${V.mag(state.pos).toFixed(1)} km`);
console.log(`  altitude:     ${(V.mag(state.pos) - CONST.R_EARTH).toFixed(1)} km`);
console.log();

// Convert ecliptic ECI → equatorial ECI → ECEF → geodetic
const finalEq = physics.eclipticToEquatorial(state.pos);
const finalECEF = physics.eciToEcef(finalEq, finalJD);
const geo = physics.ecefToGeodetic(finalECEF);

const lat_deg = geo.lat * RAD;
const lon_deg = geo.lon * RAD;

console.log('-'.repeat(82));
console.log('Splashdown coordinates');
console.log('-'.repeat(82));
console.log(`  Latitude:     ${lat_deg.toFixed(4)}°  ${lat_deg > 0 ? 'N' : 'S'}`);
console.log(`  Longitude:    ${lon_deg.toFixed(4)}°  ${lon_deg > 0 ? 'E' : 'W'}`);
console.log(`  Altitude:     ${geo.alt.toFixed(2)} km (above WGS84 ellipsoid)`);
console.log();

// =============================================================================
// Compare to published target
// =============================================================================

console.log('-'.repeat(82));
console.log('Published Artemis II splashdown (~50 mi off San Diego)');
console.log('-'.repeat(82));
console.log(`  Target lat:   ${TARGET_LAT_DEG}°N`);
console.log(`  Target lon:   ${TARGET_LON_DEG}°W`);
console.log(`  Target time:  ${TARGET_UTC}`);
console.log();

const dLat = (lat_deg - TARGET_LAT_DEG) * DEG;
const dLon = (lon_deg - TARGET_LON_DEG) * DEG;
const meanLat = ((lat_deg + TARGET_LAT_DEG) / 2) * DEG;
const km_per_deg = CONST.R_EARTH * DEG;
const offsetN = dLat * RAD * km_per_deg;
const offsetE = dLon * RAD * km_per_deg * Math.cos(meanLat);
const offsetTotal = Math.sqrt(offsetN * offsetN + offsetE * offsetE);

const tDiff = (new Date(finalUTC).getTime() - new Date(TARGET_UTC).getTime()) / 1000;

console.log('-'.repeat(82));
console.log('Comparison vs target');
console.log('-'.repeat(82));
console.log(`  N–S offset:   ${offsetN.toFixed(1)} km  (${offsetN > 0 ? 'north' : 'south'})`);
console.log(`  E–W offset:   ${offsetE.toFixed(1)} km  (${offsetE > 0 ? 'east' : 'west'})`);
console.log(`  Total offset: ${offsetTotal.toFixed(1)} km`);
console.log(`  Time offset:  ${tDiff.toFixed(0)} s  (${tDiff > 0 ? 'late' : 'early'})`);
console.log();

const POS_GATE_KM = 50;
const TIME_GATE_S = 30;
console.log('='.repeat(82));
const posPass = offsetTotal < POS_GATE_KM;
const timePass = Math.abs(tDiff) < TIME_GATE_S;
if (posPass && timePass) {
  console.log(`PASS — splashdown within ${POS_GATE_KM} km / ${TIME_GATE_S} s of published target`);
} else if (posPass) {
  console.log(`PARTIAL PASS — position within ${POS_GATE_KM} km but timing off by ${Math.abs(tDiff).toFixed(0)} s`);
} else if (timePass) {
  console.log(`PARTIAL PASS — timing within ${TIME_GATE_S} s but position off by ${offsetTotal.toFixed(0)} km`);
} else {
  console.log(`NEEDS WORK — position off by ${offsetTotal.toFixed(0)} km, timing off by ${Math.abs(tDiff).toFixed(0)} s`);
  console.log('             (Target zone is approximate; published exact lat/lon would tighten this.)');
}
console.log('='.repeat(82));
