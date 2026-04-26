/**
 * Mission Tracker — Phase D
 * Artemis II Trajectory Precomputer
 *
 * Wraps the validated physics3d engine into a clean simulator that produces
 * a single self-contained JSON file consumed by the Storyteller UI and the
 * Engineer's Dashboard.
 *
 * Pipeline:
 *   1. Load Horizons reference data, burn list, and Chebyshev Moon ephemeris
 *   2. Configure physics3d in high-fidelity mode (Phase B+C)
 *   3. Integrate from WP0 forward, with state injection at every Horizons
 *      30-minute waypoint (the validated optimal cadence — 0.02 km RMS)
 *   4. Sample the resulting trajectory at 5-minute output cadence
 *   5. Append the mission events catalog
 *   6. Write artemis2_trajectory.json
 *
 * The output is the only data file the UI needs (besides the Chebyshev Moon
 * coefficients, which the UI can load separately for Earth/Moon rendering).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const physics = require('./physics3d');
const { V, CONST } = physics;

// =============================================================================
// Load reference data
// =============================================================================

const horizons = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_horizons_full.json'), 'utf8')
);
const burnsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_burns.json'), 'utf8')
);
const moonFit = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'moon_chebyshev.json'), 'utf8')
);

const wp = horizons.waypoints;
const burns = burnsData.burns;

// =============================================================================
// Fix Horizons data artifacts — WP 170 has a single-sample velocity spike
// (0.526 km/s discontinuity with no corresponding event). Interpolate from
// neighbors to remove the artifact before using as injection source.
// =============================================================================
function fixHorizonsArtifacts(waypoints) {
  // Detect single-sample velocity outliers: dV to both neighbors exceeds threshold
  // while both neighbors are smooth with each other
  const THRESHOLD = 0.1; // km/s — normal coast dV is ~0.006
  let fixed = 0;
  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i-1].vel_km_s;
    const curr = waypoints[i].vel_km_s;
    const next = waypoints[i+1].vel_km_s;
    const dvPrev = Math.sqrt(curr.map((v,j) => (v-prev[j])**2).reduce((a,b)=>a+b));
    const dvNext = Math.sqrt(next.map((v,j) => (v-curr[j])**2).reduce((a,b)=>a+b));
    const dvSpan = Math.sqrt(next.map((v,j) => (v-prev[j])**2).reduce((a,b)=>a+b));
    // Outlier: large jump in AND out, but neighbors are smooth with each other
    if (dvPrev > THRESHOLD && dvNext > THRESHOLD && dvSpan < THRESHOLD) {
      console.log(`  Fixing WP ${i} (${waypoints[i].utc}): dV_in=${dvPrev.toFixed(4)}, dV_out=${dvNext.toFixed(4)}, span=${dvSpan.toFixed(4)}`);
      // Interpolate position and velocity from neighbors
      waypoints[i].pos_km = prev.map((v,j) => (waypoints[i-1].pos_km[j] + waypoints[i+1].pos_km[j]) / 2);
      waypoints[i].vel_km_s = prev.map((v,j) => (v + next[j]) / 2);
      fixed++;
    }
  }
  if (fixed) console.log(`  Fixed ${fixed} Horizons artifact(s)`);
  else console.log('  No Horizons artifacts detected');
}

console.log('Checking Horizons data for artifacts...');
fixHorizonsArtifacts(wp);

// =============================================================================
// Configure physics3d in high-fidelity mode
// =============================================================================

physics.loadMoonChebyshev(moonFit);
physics.setEphemeris({
  applyObliquity:    false,    // ecliptic frame to match Horizons
  includeJ2:         true,     // Earth oblateness (Phase C)
  includeSRP:        true,     // Solar radiation pressure (Phase C)
  spacecraftMass_kg: 25400,    // Orion+ESM nominal
  spacecraftArea_m2: 32,       // effective cross-section
  spacecraftCR:      1.3,      // radiation pressure coefficient
  // Atmospheric entry parameters (Phase E) — only used when includeDrag is on
  spacecraftMassEntry_kg: 9300, // CM only (post-ESM-sep)
  spacecraftDragArea_m2:  19.5, // heat shield
  spacecraftCd:           1.4,
  spacecraftLD:           0.05, // empirical effective average lift
});

const wp0 = wp[0];

// =============================================================================
// Output configuration
// =============================================================================

const OUTPUT_STEP_SECONDS = 60;       // 1-minute output cadence
const RK4_STEP_SECONDS    = 5;        // integrator inner step
const T_START = wp0.jdtdb;            // first Horizons sample as start
const T_END = wp[wp.length - 1].jdtdb; // last Horizons sample
const DURATION_SECONDS = (T_END - T_START) * 86400;
const N_OUTPUT_SAMPLES = Math.floor(DURATION_SECONDS / OUTPUT_STEP_SECONDS) + 1;

console.log('='.repeat(82));
console.log('Phase D — Artemis II Trajectory Precomputer');
console.log('='.repeat(82));
console.log(`Mission span:    ${wp[0].utc}  →  ${wp[wp.length - 1].utc}`);
console.log(`Duration:        ${(DURATION_SECONDS / 86400).toFixed(2)} days (${(DURATION_SECONDS / 3600).toFixed(1)} h)`);
console.log(`Output cadence:  ${OUTPUT_STEP_SECONDS} s  (${N_OUTPUT_SAMPLES} samples)`);
console.log(`RK4 inner step:  ${RK4_STEP_SECONDS} s`);
console.log(`State injection: every Horizons waypoint (${wp.length} samples, 30-min cadence)`);
console.log();

// =============================================================================
// Integration with state injection
// =============================================================================
//
// At every output epoch, decide whether we're between Horizons waypoints or
// crossing one. Crossing → reset state to the new Horizons sample.
// Between → integrate forward from current state.

let state = { pos: [...wp0.pos_km], vel: [...wp0.vel_km_s] };
let simTime = 0; // seconds from T_START

const sampledTrajectory = [];   // [{ t, pos, vel }]
const sampledMoonPos = [];      // [[x, y, z]]

function integrate_to(t_target_seconds) {
  const dt = t_target_seconds - simTime;
  if (dt <= 0) return;
  // Update mission epoch so the integrator's internal t=0 is current
  physics.setMissionEpoch(T_START + simTime / 86400);
  const traj = physics.integrate(state, [], dt + RK4_STEP_SECONDS, RK4_STEP_SECONDS, { minDepartTime: 0 });
  // Find or interpolate to t = dt
  let lo = 0, hi = traj.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (traj[mid].t <= dt) lo = mid; else hi = mid;
  }
  const tA = traj[lo].t, tB = traj[hi].t;
  const f = tB > tA ? (dt - tA) / (tB - tA) : 0;
  state = {
    pos: [
      traj[lo].pos[0] + f * (traj[hi].pos[0] - traj[lo].pos[0]),
      traj[lo].pos[1] + f * (traj[hi].pos[1] - traj[lo].pos[1]),
      traj[lo].pos[2] + f * (traj[hi].pos[2] - traj[lo].pos[2]),
    ],
    vel: [
      traj[lo].vel[0] + f * (traj[hi].vel[0] - traj[lo].vel[0]),
      traj[lo].vel[1] + f * (traj[hi].vel[1] - traj[lo].vel[1]),
      traj[lo].vel[2] + f * (traj[hi].vel[2] - traj[lo].vel[2]),
    ],
  };
  simTime = t_target_seconds;
}

// Pre-compute the inject epochs (in seconds from T_START) and their states
const injectEpochs = wp.map((w, i) => ({
  t_seconds: (w.jdtdb - T_START) * 86400,
  pos: w.pos_km,
  vel: w.vel_km_s,
}));

let injectIdx = 0;
process.stdout.write('Integrating: ');

// Output samples are at regular intervals from T_START
for (let i = 0; i < N_OUTPUT_SAMPLES; i++) {
  const t_target = i * OUTPUT_STEP_SECONDS;

  // Process injections that occur at or before this output epoch.
  // Use a small epsilon (1 ms) to absorb JD↔seconds floating-point noise
  // — Horizons jdtdb values have ~50 μs of float jitter.
  while (injectIdx < injectEpochs.length && injectEpochs[injectIdx].t_seconds <= t_target + 0.001) {
    const inj = injectEpochs[injectIdx];
    // Integrate forward to the injection epoch
    integrate_to(inj.t_seconds);
    // Reset state from Horizons
    state = { pos: [...inj.pos], vel: [...inj.vel] };
    simTime = inj.t_seconds;
    injectIdx++;
  }

  // Integrate to this output epoch
  integrate_to(t_target);

  sampledTrajectory.push({
    t: t_target,
    pos: [...state.pos],
    vel: [...state.vel],
  });

  // Sample Moon position at this epoch
  // Note: mission epoch is already set to current time by integrate_to(),
  // so call moonPosition(0) to get Moon at the current epoch.
  physics.setMissionEpoch(T_START + t_target / 86400);
  const moonPos = physics.moonPosition(0);
  sampledMoonPos.push([...moonPos]);

  if (i % 1000 === 0) process.stdout.write('.');
}
console.log(' done');
console.log();

// =============================================================================
// Phase E continuation: integrate past last Horizons sample through entry
// to splashdown. Drag becomes active inside ATMO_TOP_KM (300 km).
// =============================================================================

console.log('Continuing through atmospheric entry to splashdown...');
physics.setEphemeris({ includeDrag: true });
physics.setMissionEpoch(T_START + simTime / 86400);

let entryT = simTime;            // mission seconds
let entrySimTime = 0;             // local seconds for the entry integrator
const ENTRY_DT_PRE  = 5;          // pre-entry coast step
const ENTRY_DT_ATMO = 0.5;        // atmospheric step
let inAtmosphere = false;
const ATMO_INTERFACE_KM = 120;
const MAX_ENTRY_T = 3000;         // 50 minutes of safety margin

// Sample at the same OUTPUT_STEP_SECONDS cadence
let nextOutputT = entryT + OUTPUT_STEP_SECONDS;

// Need to advance simTime each step
let splashdownReached = false;
while (entrySimTime < MAX_ENTRY_T) {
  const alt = V.mag(state.pos) - CONST.R_EARTH;
  if (!inAtmosphere && alt < ATMO_INTERFACE_KM) {
    inAtmosphere = true;
  }
  if (alt <= 0) {
    splashdownReached = true;
    break;
  }

  const dt_step = inAtmosphere ? ENTRY_DT_ATMO : ENTRY_DT_PRE;
  // Use the rk4Step helper directly so we can step past the integrate() interface
  state = physics.rk4Step(state, entrySimTime, dt_step);
  entrySimTime += dt_step;
  simTime += dt_step;

  // Output sample if we've crossed the next output epoch
  if (simTime >= nextOutputT) {
    sampledTrajectory.push({
      t: nextOutputT,
      pos: [...state.pos],
      vel: [...state.vel],
    });
    sampledMoonPos.push([...physics.moonPosition(entrySimTime)]);
    nextOutputT += OUTPUT_STEP_SECONDS;
  }
}

// Always add a final splashdown sample so the trajectory closes cleanly
if (splashdownReached) {
  sampledTrajectory.push({
    t: simTime,
    pos: [...state.pos],
    vel: [...state.vel],
  });
  sampledMoonPos.push([...physics.moonPosition(entrySimTime)]);
}

const finalAlt = V.mag(state.pos) - CONST.R_EARTH;
const finalT = simTime;
console.log(`  Entry phase complete: T+${(finalT/3600).toFixed(2)}h, ${(entrySimTime).toFixed(0)}s past last Horizons sample`);
console.log(`  Final altitude: ${finalAlt.toFixed(2)} km, total samples now ${sampledTrajectory.length}`);
console.log();

// Compute splashdown coordinates from final state
const splashJD = T_START + simTime / 86400;
const splashEq = physics.eclipticToEquatorial(state.pos);
const splashECEF = physics.eciToEcef(splashEq, splashJD);
const splashGeo = physics.ecefToGeodetic(splashECEF);
const splashUTC = new Date(
  new Date(wp[0].utc).getTime() + simTime * 1000
).toISOString();
console.log(`  Predicted splashdown: ${splashUTC}`);
console.log(`  Coordinates:          ${(splashGeo.lat * 180 / Math.PI).toFixed(3)}°N  ${(splashGeo.lon * 180 / Math.PI).toFixed(3)}°E`);
console.log();

// Update durations and sample count
const N_OUTPUT_SAMPLES_FINAL = sampledTrajectory.length;
const DURATION_SECONDS_FINAL = simTime;
console.log();

// =============================================================================
// Mission events catalog
// =============================================================================

function utcToOffsetSec(utc) {
  return (physics.julianDate(utc) - T_START) * 86400;
}

const events = [
  // Pre-mission events (before WP0, annotation only)
  {
    type: 'launch',
    name: 'Liftoff',
    epoch_utc: '2026-04-01T22:35:12Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-01T22:35:12Z'),
    description: 'SLS Block 1 lifted off from Kennedy Space Center LC-39B with the Artemis II crew on board.',
    annotation_only: true,
  },
  {
    type: 'separation',
    name: 'Core stage / ICPS sep',
    epoch_utc: '2026-04-01T22:43:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-01T22:43:00Z'),
    description: 'SLS core stage separated; ICPS coast began.',
    annotation_only: true,
  },
  {
    type: 'burn',
    name: 'ICPS perigee raise',
    epoch_utc: '2026-04-02T00:00:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-02T00:00:00Z'),
    description: 'ICPS performed the perigee raise burn to circularize Orion into a high Earth orbit (HEO) suitable for trans-lunar departure.',
    annotation_only: true,
  },
  {
    type: 'separation',
    name: 'Orion / ICPS sep',
    epoch_utc: '2026-04-02T01:30:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-02T01:30:00Z'),
    description: 'Orion separated from the ICPS upper stage and began its independent flight.',
    annotation_only: true,
  },
  // Mission start (first Horizons sample)
  {
    type: 'milestone',
    name: 'Tracking begins',
    epoch_utc: wp0.utc,
    epoch_offset_seconds: 0,
    description: 'JPL Horizons tracking begins for Orion at this epoch (~3.5 hours post-launch). All physics simulation starts here.',
  },
  // Real propulsive burns
  ...burns.map(b => ({
    type: 'burn',
    name: b.name,
    full_name: b.full_name,
    epoch_utc: b.epoch_utc,
    epoch_offset_seconds: utcToOffsetSec(b.epoch_utc),
    duration_seconds: b.duration_s,
    dv_magnitude_ms: b.published_dv_ms,
    description: b.notes,
  })),
  // Cancelled burns (storyteller annotation)
  {
    type: 'cancelled',
    name: 'OTC-1 (cancelled)',
    epoch_utc: '2026-04-03T15:00:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-03T15:00:00Z'),
    description: 'First outbound trajectory correction was cancelled — the trajectory was nominal and required no adjustment.',
  },
  {
    type: 'cancelled',
    name: 'OTC-2 (cancelled)',
    epoch_utc: '2026-04-04T18:00:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-04T18:00:00Z'),
    description: 'Second outbound trajectory correction was also cancelled.',
  },
  // Lunar perilune (closest approach)
  {
    type: 'perilune',
    name: 'Lunar perilune',
    epoch_utc: '2026-04-06T23:00:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-06T23:00:00Z'),
    description: 'Closest approach to the Moon — 6,546 km above the lunar surface (8,283 km from Moon center). Free-return slingshot complete.',
  },
  // Splashdown sequence
  {
    type: 'milestone',
    name: 'Atmospheric entry interface',
    epoch_utc: '2026-04-10T23:50:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-10T23:50:00Z'),
    description: 'Orion crossed the atmospheric entry interface at ~120 km altitude, beginning hypersonic re-entry.',
    annotation_only: true,
  },
  {
    type: 'splashdown',
    name: 'Splashdown (published)',
    epoch_utc: '2026-04-11T00:07:00Z',
    epoch_offset_seconds: utcToOffsetSec('2026-04-11T00:07:00Z'),
    description: 'Published Artemis II splashdown — Pacific Ocean ~50 miles off the coast of San Diego, California. Recovery by USS John P. Murtha.',
    target_lat_deg: 32.5,
    target_lon_deg: -118.0,
    annotation_only: true,
  },
  {
    type: 'splashdown_predicted',
    name: 'Splashdown (simulated)',
    epoch_utc: splashUTC,
    epoch_offset_seconds: simTime,
    predicted_lat_deg: splashGeo.lat * 180 / Math.PI,
    predicted_lon_deg: splashGeo.lon * 180 / Math.PI,
    description: 'Mission Tracker simulator prediction. Differs from published splashdown by ~800 km because Orion\'s precise bank-modulation schedule (which controls effective L/D during entry) is not publicly available. The simulator uses an empirical L/D = 0.05 average that produces a Pacific landing in the right region.',
  },
];

// Sort events by epoch
events.sort((a, b) => a.epoch_offset_seconds - b.epoch_offset_seconds);

console.log(`Cataloged ${events.length} mission events:`);
for (const e of events) {
  const offsetH = (e.epoch_offset_seconds / 3600).toFixed(1);
  console.log(`  ${e.epoch_utc}  T${offsetH >= 0 ? '+' : ''}${offsetH}h  [${e.type}] ${e.name}`);
}
console.log();

// =============================================================================
// Build output JSON
// =============================================================================

// Round numbers to reasonable precision to keep file size sane
const round = (x, dp = 2) => Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp);

const out = {
  metadata: {
    mission: 'Artemis II',
    spacecraft: 'Orion (CSM Integrity)',
    crew: ['Reid Wiseman', 'Victor Glover', 'Christina Koch', 'Jeremy Hansen'],
    generated_utc: new Date().toISOString(),
    physics_model: 'physics3d v1 (Earth point + J2, Chebyshev DE440 Moon, Sun tidal, SRP)',
    integrator: 'RK4 with 5-second inner step',
    state_injection: 'JPL Horizons 30-minute cadence',
    validation: 'Matches JPL Horizons within 0.02 km RMS / 0.34 km max (Phase D gate: 1 km RMS / 10 km max)',
    source: 'NASA JPL Horizons API + NASA mission update blogs (April 2026)',
    framework: 'Mission Tracker (Peirastes)',
  },
  frame: {
    name: 'ECI Ecliptic of J2000.0',
    center: 'Earth',
    units: { position: 'km', velocity: 'km/s', time: 'seconds since epoch_start' },
  },
  time: {
    epoch_start_utc: wp[0].utc,
    epoch_start_jdtdb: T_START,
    epoch_end_utc: splashUTC,
    epoch_end_jdtdb: splashJD,
    step_seconds: OUTPUT_STEP_SECONDS,
    n_samples: N_OUTPUT_SAMPLES_FINAL,
    duration_seconds: DURATION_SECONDS_FINAL,
  },
  spacecraft: {
    name: 'Orion',
    mass_kg: 25400,
    cross_section_m2: 32,
    trajectory_pos_km: sampledTrajectory.map(s => s.pos.map(v => round(v, 1))),
    trajectory_vel_km_s: sampledTrajectory.map(s => s.vel.map(v => round(v, 4))),
  },
  moon: {
    trajectory_pos_km: sampledMoonPos.map(p => p.map(v => round(v, 1))),
  },
  events,
};

// =============================================================================
// Write output
// =============================================================================

const outPath = path.join(__dirname, 'artemis2_trajectory.json');
fs.writeFileSync(outPath, JSON.stringify(out));  // no whitespace = compact

const outSize = fs.statSync(outPath).size;
console.log('-'.repeat(82));
console.log(`Wrote ${path.basename(outPath)}  (${(outSize / 1024).toFixed(0)} KB, ${N_OUTPUT_SAMPLES} samples)`);
console.log('-'.repeat(82));

// Write a pretty-printed events-only sidecar for human inspection
fs.writeFileSync(
  path.join(__dirname, 'artemis2_events.json'),
  JSON.stringify({ metadata: out.metadata, events }, null, 2)
);

console.log('Phase D precomputer complete.');
console.log('='.repeat(82));
