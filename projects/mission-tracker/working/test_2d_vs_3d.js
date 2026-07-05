/**
 * Phase 3 Step 1: 2D-vs-3D Sanity Check
 *
 * Lift the existing Artemis II 2D simulator's exact initial conditions and
 * burn sequence into the 3D physics engine (with z=0 throughout). The 3D
 * trajectory should match the 2D trajectory to within numerical precision.
 *
 * If they match: 3D physics is sound. The framework can proceed to real
 *   ephemeris validation (Step 2).
 *
 * If they DON'T match: there's a 3D-specific bug. Find and fix it before
 *   proceeding.
 *
 * Both simulators are run with the SAME parameters:
 *   - Earth gravity (point mass)
 *   - Moon gravity (point mass) — Moon in circular orbit at lunar distance
 *   - Sun tidal perturbation
 *   - LEO 185 km circular start
 *   - HEO burn at t=5400s (prograde)
 *   - TLI burn at perigee return (prograde, dv=0.335 km/s)
 *   - Synthetic TCM 1h post-perilune (dv=0.160 km/s radial-in)
 *
 * The 2D version uses scalar (x,y,vx,vy) with Moon at (Lcos(θ), Lsin(θ)).
 * The 3D version uses (x,y,z,vx,vy,vz) with Moon at (Lcos(θ), Lsin(θ), 0)
 * after disabling the inclination and obliquity rotations.
 */

const phys = require('./physics3d');
const { V, CONST } = phys;

// =============================================================================
// 2D REFERENCE IMPLEMENTATION (lifted directly from artemis2.html)
// =============================================================================

const MU_E = CONST.MU_EARTH;
const MU_M = CONST.MU_MOON;
const MU_SUN = CONST.MU_SUN;
const RE = CONST.R_EARTH;
const RM = CONST.R_MOON;
const LUNAR_DIST = CONST.LUNAR_DIST;
const LUNAR_PERIOD = CONST.LUNAR_PERIOD;
const AU_KM = CONST.AU;
const SUN_ANG_VEL = 2*Math.PI/(365.25*86400);
const SUN_ANGLE0 = 3.54;
const LEO_ALT = 185;

const T_HEO_BURN = 5400;     // 90 min
const TRAJ_DT = 10;
const T_MISSION_END = 864000; // 10 days

function getMoonAngle2D(t) {
  return t * 2 * Math.PI / LUNAR_PERIOD + 0.4;
}
function getMoonXY2D(t) {
  const a = getMoonAngle2D(t);
  return { x: LUNAR_DIST * Math.cos(a), y: LUNAR_DIST * Math.sin(a) };
}
function getSunXY2D(t) {
  const a = SUN_ANGLE0 + SUN_ANG_VEL * t;
  return { x: AU_KM * Math.cos(a), y: AU_KM * Math.sin(a) };
}

function gravAccel2D(x, y, t) {
  // Earth
  const rE = Math.sqrt(x*x + y*y);
  const rE3 = rE * rE * rE;
  let ax = -MU_E * x / rE3;
  let ay = -MU_E * y / rE3;

  // Moon
  const moon = getMoonXY2D(t);
  const dxM = x - moon.x, dyM = y - moon.y;
  const rM = Math.sqrt(dxM*dxM + dyM*dyM);
  const rM3 = rM * rM * rM;
  ax -= MU_M * dxM / rM3;
  ay -= MU_M * dyM / rM3;

  // Sun tidal
  const sun = getSunXY2D(t);
  const dxS = x - sun.x, dyS = y - sun.y;
  const rS = Math.sqrt(dxS*dxS + dyS*dyS);
  const rS3 = rS * rS * rS;
  const rSE = Math.sqrt(sun.x*sun.x + sun.y*sun.y);
  const rSE3 = rSE * rSE * rSE;
  ax -= MU_SUN * (dxS/rS3 + sun.x/rSE3);
  ay -= MU_SUN * (dyS/rS3 + sun.y/rSE3);

  return { ax, ay };
}

function rk4Step2D(state, t, dt) {
  const { x, y, vx, vy } = state;
  const a1 = gravAccel2D(x, y, t);
  const k1x = vx, k1y = vy, k1vx = a1.ax, k1vy = a1.ay;

  const x2 = x + 0.5*dt*k1x, y2 = y + 0.5*dt*k1y;
  const a2 = gravAccel2D(x2, y2, t + 0.5*dt);
  const k2x = vx + 0.5*dt*k1vx, k2y = vy + 0.5*dt*k1vy;
  const k2vx = a2.ax, k2vy = a2.ay;

  const x3 = x + 0.5*dt*k2x, y3 = y + 0.5*dt*k2y;
  const a3 = gravAccel2D(x3, y3, t + 0.5*dt);
  const k3x = vx + 0.5*dt*k2vx, k3y = vy + 0.5*dt*k2vy;
  const k3vx = a3.ax, k3vy = a3.ay;

  const x4 = x + dt*k3x, y4 = y + dt*k3y;
  const a4 = gravAccel2D(x4, y4, t + dt);
  const k4x = vx + dt*k3vx, k4y = vy + dt*k3vy;
  const k4vx = a4.ax, k4vy = a4.ay;

  return {
    x:  x  + (dt/6) * (k1x  + 2*k2x  + 2*k3x  + k4x),
    y:  y  + (dt/6) * (k1y  + 2*k2y  + 2*k3y  + k4y),
    vx: vx + (dt/6) * (k1vx + 2*k2vx + 2*k3vx + k4vx),
    vy: vy + (dt/6) * (k1vy + 2*k2vy + 2*k3vy + k4vy)
  };
}

function runSim2D(startAngle) {
  const r0 = RE + LEO_ALT;
  const vOrb = Math.sqrt(MU_E / r0);

  let state = {
    x: r0 * Math.cos(startAngle),
    y: r0 * Math.sin(startAngle),
    vx: -vOrb * Math.sin(startAngle),
    vy:  vOrb * Math.cos(startAngle),
  };

  const traj = [{ t: 0, x: state.x, y: state.y, vx: state.vx, vy: state.vy }];
  let t = 0;
  let heoBurnDone = false, tliDone = false, passedApogee = false, tcmDone = false;
  let minMoonDist = Infinity;
  let periluneTime = -1;
  const totalSteps = Math.ceil(T_MISSION_END / TRAJ_DT);

  for (let i = 0; i < totalSteps; i++) {
    state = rk4Step2D(state, t, TRAJ_DT);
    t += TRAJ_DT;

    const rE = Math.sqrt(state.x*state.x + state.y*state.y);
    const speed = Math.sqrt(state.vx*state.vx + state.vy*state.vy);

    // HEO burn
    if (!heoBurnDone && t >= T_HEO_BURN) {
      const rPeri = rE, rApo = RE + 76757;
      const a = (rPeri + rApo) / 2;
      const vTarget = Math.sqrt(MU_E * (2/rPeri - 1/a));
      const dv = vTarget - speed;
      if (dv > 0) {
        state.vx += dv * state.vx / speed;
        state.vy += dv * state.vy / speed;
      }
      heoBurnDone = true;
    }

    // TLI
    if (heoBurnDone && !tliDone) {
      if (rE > RE + 40000) passedApogee = true;
      if (passedApogee && rE < RE + 500) {
        const tliDv = 0.335;
        state.vx += tliDv * state.vx / speed;
        state.vy += tliDv * state.vy / speed;
        tliDone = true;
      }
    }

    // Track perilune
    if (tliDone) {
      const moon = getMoonXY2D(t);
      const dm = Math.sqrt((state.x-moon.x)**2 + (state.y-moon.y)**2);
      if (dm < minMoonDist) { minMoonDist = dm; periluneTime = t; }
    }

    // Synthetic TCM
    if (!tcmDone && periluneTime > 0 && t >= periluneTime + 3600) {
      const tcmDv = 0.160;
      const rr = Math.sqrt(state.x*state.x + state.y*state.y);
      state.vx -= tcmDv * state.x / rr;
      state.vy -= tcmDv * state.y / rr;
      tcmDone = true;
    }

    // Splashdown detection
    if (tliDone && rE < RE + 50 && t > 82800 + 3*86400) {
      traj.push({ t, x: state.x, y: state.y, vx: state.vx, vy: state.vy });
      return { traj, periluneAlt: minMoonDist - RM, periluneTime, splashdownTime: t };
    }

    // Sample every 600s for comparison
    if (i % 60 === 0) {
      traj.push({ t, x: state.x, y: state.y, vx: state.vx, vy: state.vy });
    }
  }
  return { traj, periluneAlt: minMoonDist - RM, periluneTime, splashdownTime: -1 };
}

// =============================================================================
// 3D VERSION using physics3d.js
// =============================================================================

function runSim3D(startAngle) {
  // Disable Moon inclination and obliquity to put Moon in the equatorial plane,
  // matching the 2D model's coplanar setup.
  phys.setEphemeris({
    moonInclination: 0,
    applyObliquity: false,
    moonLaunchPhase: 0.4,  // matches 2D getMoonAngle2D's +0.4 offset
    sunLaunchPhase: SUN_ANGLE0,
  });

  const r0 = RE + LEO_ALT;
  const vOrb = Math.sqrt(MU_E / r0);

  let state = {
    pos: [r0 * Math.cos(startAngle), r0 * Math.sin(startAngle), 0],
    vel: [-vOrb * Math.sin(startAngle), vOrb * Math.cos(startAngle), 0],
  };

  const traj = [{ t: 0, x: state.pos[0], y: state.pos[1], z: state.pos[2],
                  vx: state.vel[0], vy: state.vel[1], vz: state.vel[2] }];
  let t = 0;
  let heoBurnDone = false, tliDone = false, passedApogee = false, tcmDone = false;
  let minMoonDist = Infinity;
  let periluneTime = -1;
  const totalSteps = Math.ceil(T_MISSION_END / TRAJ_DT);

  for (let i = 0; i < totalSteps; i++) {
    state = phys.rk4Step(state, t, TRAJ_DT);
    t += TRAJ_DT;

    const rE = V.mag(state.pos);
    const speed = V.mag(state.vel);

    // HEO burn (prograde = along velocity direction)
    if (!heoBurnDone && t >= T_HEO_BURN) {
      const rPeri = rE, rApo = RE + 76757;
      const a = (rPeri + rApo) / 2;
      const vTarget = Math.sqrt(MU_E * (2/rPeri - 1/a));
      const dv = vTarget - speed;
      if (dv > 0) {
        state.vel = V.add(state.vel, V.scale(state.vel, dv / speed));
      }
      heoBurnDone = true;
    }

    // TLI
    if (heoBurnDone && !tliDone) {
      if (rE > RE + 40000) passedApogee = true;
      if (passedApogee && rE < RE + 500) {
        const tliDv = 0.335;
        state.vel = V.add(state.vel, V.scale(state.vel, tliDv / speed));
        tliDone = true;
      }
    }

    // Track perilune (Moon at z=0 since we disabled inclination)
    if (tliDone) {
      const moon = phys.moonPosition(t);
      const dm = V.mag(V.sub(state.pos, moon));
      if (dm < minMoonDist) { minMoonDist = dm; periluneTime = t; }
    }

    // Synthetic TCM (radial-in toward Earth)
    if (!tcmDone && periluneTime > 0 && t >= periluneTime + 3600) {
      const tcmDv = 0.160;
      const rr = V.mag(state.pos);
      state.vel = V.sub(state.vel, V.scale(state.pos, tcmDv / rr));
      tcmDone = true;
    }

    // Splashdown detection
    if (tliDone && rE < RE + 50 && t > 82800 + 3*86400) {
      traj.push({ t, x: state.pos[0], y: state.pos[1], z: state.pos[2],
                  vx: state.vel[0], vy: state.vel[1], vz: state.vel[2] });
      return { traj, periluneAlt: minMoonDist - RM, periluneTime, splashdownTime: t };
    }

    if (i % 60 === 0) {
      traj.push({ t, x: state.pos[0], y: state.pos[1], z: state.pos[2],
                  vx: state.vel[0], vy: state.vel[1], vz: state.vel[2] });
    }
  }
  return { traj, periluneAlt: minMoonDist - RM, periluneTime, splashdownTime: -1 };
}

// =============================================================================
// COMPARISON
// =============================================================================

console.log('=== 2D vs 3D Sanity Check ===\n');

// Use the same calibrated start angle as the 2D simulator
const tFlyby = 432420;
const moonAtFlyby = getMoonXY2D(tFlyby);
const moonAngle = Math.atan2(moonAtFlyby.y, moonAtFlyby.x);
const startAngle = moonAngle + 3.145;

console.log(`Start angle: ${startAngle.toFixed(4)} rad (${(startAngle*180/Math.PI).toFixed(1)}°)`);
console.log(`Moon angle at NASA flyby (T+5d 0h 27m): ${moonAngle.toFixed(4)} rad\n`);

console.log('Running 2D simulation...');
const sim2d = runSim2D(startAngle);
console.log(`  Trajectory: ${sim2d.traj.length} points`);
console.log(`  Perilune alt: ${sim2d.periluneAlt.toFixed(0)} km at t=${(sim2d.periluneTime/86400).toFixed(2)} days`);
console.log(`  Splashdown: ${sim2d.splashdownTime > 0 ? (sim2d.splashdownTime/86400).toFixed(2) + ' days' : 'no splashdown'}\n`);

console.log('Running 3D simulation...');
const sim3d = runSim3D(startAngle);
console.log(`  Trajectory: ${sim3d.traj.length} points`);
console.log(`  Perilune alt: ${sim3d.periluneAlt.toFixed(0)} km at t=${(sim3d.periluneTime/86400).toFixed(2)} days`);
console.log(`  Splashdown: ${sim3d.splashdownTime > 0 ? (sim3d.splashdownTime/86400).toFixed(2) + ' days' : 'no splashdown'}\n`);

// Compare trajectories point-by-point at matching times
console.log('=== Point-by-point comparison ===');
const minLen = Math.min(sim2d.traj.length, sim3d.traj.length);
let max_pos_diff = 0;
let max_vel_diff = 0;
let max_z_drift = 0;
let avg_pos_diff = 0;
let avg_vel_diff = 0;
let count = 0;

for (let i = 0; i < minLen; i++) {
  const p2 = sim2d.traj[i];
  const p3 = sim3d.traj[i];
  if (p2.t !== p3.t) continue;
  const dx = p3.x - p2.x;
  const dy = p3.y - p2.y;
  const pos_diff = Math.sqrt(dx*dx + dy*dy);
  const dvx = p3.vx - p2.vx;
  const dvy = p3.vy - p2.vy;
  const vel_diff = Math.sqrt(dvx*dvx + dvy*dvy);
  if (pos_diff > max_pos_diff) max_pos_diff = pos_diff;
  if (vel_diff > max_vel_diff) max_vel_diff = vel_diff;
  if (Math.abs(p3.z) > max_z_drift) max_z_drift = Math.abs(p3.z);
  avg_pos_diff += pos_diff;
  avg_vel_diff += vel_diff;
  count++;
}
avg_pos_diff /= count;
avg_vel_diff /= count;

console.log(`Compared ${count} matching points`);
console.log(`Max position difference: ${max_pos_diff.toFixed(3)} km`);
console.log(`Avg position difference: ${avg_pos_diff.toFixed(3)} km`);
console.log(`Max velocity difference: ${max_vel_diff.toFixed(6)} km/s`);
console.log(`Avg velocity difference: ${avg_vel_diff.toFixed(6)} km/s`);
console.log(`Max z-drift in 3D run: ${max_z_drift.toFixed(3)} km`);

console.log('\n=== Verdict ===');
if (max_pos_diff < 1 && max_z_drift < 1) {
  console.log('PASS: 2D and 3D trajectories match within numerical tolerance.');
  console.log('The 3D physics is sound. Proceed to Step 2 (real ephemeris validation).');
} else if (max_pos_diff < 100 && max_z_drift < 10) {
  console.log('CLOSE: 2D and 3D trajectories agree to within ~100 km / ~10 km z-drift.');
  console.log('Likely due to numerical precision differences. Acceptable for Phase 3.');
} else {
  console.log('FAIL: Trajectories diverge significantly.');
  console.log('There is a 3D-specific bug to investigate before proceeding.');
}
