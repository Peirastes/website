// Pure physics module extracted from artemis2.html for calibration.
// No DOM dependencies. Import and call runTrajectory(params) to integrate
// the full mission and get back event times.
//
// This module is kept in strict parity with artemis2.html buildTrajectory()
// so that calibrated parameters can be ported back verbatim.

// ========== PHYSICAL CONSTANTS ==========
export const C = 299792.458;          // speed of light km/s
export const G = 6.674e-11;           // gravitational constant SI
export const ME = 5.972e24;           // Earth mass kg
export const MM = 7.342e22;           // Moon mass kg
export const RE = 6371;               // Earth radius km
export const RM = 1737;               // Moon radius km
export const LUNAR_DIST = 384400;     // mean Earth-Moon distance km
export const LEO_ALT = 185;           // LEO altitude km
export const MU_E = 398600.4418;      // Earth gravitational parameter km^3/s^2
export const MU_M = 4902.8;           // Moon gravitational parameter km^3/s^2
export const LUNAR_PERIOD = 27.322 * 86400; // Moon orbital period seconds

export const LAUNCH_UTC = new Date('2026-04-01T22:35:12Z').getTime();

// ========== DEFAULT TUNABLE PARAMETERS ==========
// All time constants are seconds from launch.
// Pass overrides to runTrajectory({ ... }) to change any of these.
export const DEFAULTS = {
  // Integrator
  TRAJ_DT: 10,              // integration timestep (seconds)
  T_MISSION_END: 864000,    // integration cap (10 days)

  // Ascent profile (interpolated, display-only for t < T_MECO)
  T_SRB: 126,               // SRB burnout/separation
  T_MECO: 480,              // Main engine cutoff
  // (ascent waypoints hardcoded below — can be exposed later)

  // ICPS burns
  T_HEO_BURN: 5400,         // ICPS burn time (s from launch)
  HEO_APOGEE: 74000,        // target apogee altitude after HEO burn (km)

  // TLI — currently detected dynamically at perigee return after HEO apogee.
  // Set TLI_MODE='fixed' and T_TLI_BURN to fire at a specific time instead.
  TLI_MODE: 'perigee',      // 'perigee' (current behavior) or 'fixed'
  T_TLI_BURN: 91500,        // used when TLI_MODE='fixed'
  TLI_DV: 0.360,            // TLI delta-v (km/s prograde)

  // Targeting
  T_FLYBY_TARGET: 432420,   // target perilune time used for launch-window phasing (NASA Apr 6 23:02 UTC)
  START_ANGLE_OFFSET: 3.00, // offset from moonAngle-at-flyby (radians)
};

// ========== MOON POSITION ==========
export function getMoonAngle(t) {
  return t * 2 * Math.PI / LUNAR_PERIOD + 0.4;
}
export function getMoonXY(t) {
  const a = getMoonAngle(t);
  return { x: LUNAR_DIST * Math.cos(a), y: LUNAR_DIST * Math.sin(a) };
}

// ========== RK4 GRAVITATIONAL INTEGRATOR ==========
function gravAccel(x, y, t) {
  const rE = Math.sqrt(x * x + y * y);
  const rE3 = rE * rE * rE;
  let ax = -MU_E * x / rE3;
  let ay = -MU_E * y / rE3;
  const moon = getMoonXY(t);
  const dxM = x - moon.x;
  const dyM = y - moon.y;
  const rM = Math.sqrt(dxM * dxM + dyM * dyM);
  const rM3 = rM * rM * rM;
  ax -= MU_M * dxM / rM3;
  ay -= MU_M * dyM / rM3;
  return { ax, ay };
}

function rk4Step(state, t, dt) {
  const { x, y, vx, vy } = state;
  const a1 = gravAccel(x, y, t);
  const k1x = vx, k1y = vy, k1vx = a1.ax, k1vy = a1.ay;

  const x2 = x + 0.5 * dt * k1x, y2 = y + 0.5 * dt * k1y;
  const a2 = gravAccel(x2, y2, t + 0.5 * dt);
  const k2x = vx + 0.5 * dt * k1vx, k2y = vy + 0.5 * dt * k1vy;
  const k2vx = a2.ax, k2vy = a2.ay;

  const x3 = x + 0.5 * dt * k2x, y3 = y + 0.5 * dt * k2y;
  const a3 = gravAccel(x3, y3, t + 0.5 * dt);
  const k3x = vx + 0.5 * dt * k2vx, k3y = vy + 0.5 * dt * k2vy;
  const k3vx = a3.ax, k3vy = a3.ay;

  const x4 = x + dt * k3x, y4 = y + dt * k3y;
  const a4 = gravAccel(x4, y4, t + dt);
  const k4x = vx + dt * k3vx, k4y = vy + dt * k3vy;
  const k4vx = a4.ax, k4vy = a4.ay;

  return {
    x:  x  + (dt / 6) * (k1x  + 2 * k2x  + 2 * k3x  + k4x),
    y:  y  + (dt / 6) * (k1y  + 2 * k2y  + 2 * k3y  + k4y),
    vx: vx + (dt / 6) * (k1vx + 2 * k2vx + 2 * k3vx + k4vx),
    vy: vy + (dt / 6) * (k1vy + 2 * k2vy + 2 * k3vy + k4vy),
  };
}

// ========== TRAJECTORY BUILDER ==========
/**
 * Runs the full mission trajectory integration and returns a meta object
 * with detected event times and trajectory samples.
 *
 * @param {Object} params - optional parameter overrides (see DEFAULTS)
 * @returns {{ meta: Object, traj: Array }}
 */
export function runTrajectory(params = {}) {
  const p = { ...DEFAULTS, ...params };
  const meta = {};
  const TRAJ = [];

  // Launch-window phasing: pick start angle so Moon is in the right place at flyby target
  const moonAtFlyby = getMoonXY(p.T_FLYBY_TARGET);
  const moonAngle = Math.atan2(moonAtFlyby.y, moonAtFlyby.x);
  const startAngle = moonAngle + p.START_ANGLE_OFFSET;

  const r0 = RE + LEO_ALT;
  const vOrb = Math.sqrt(MU_E / r0);

  // ---- Phase 1: Interpolated powered ascent (t=0 → T_MECO) ----
  const ascentProfile = [
    { t: 0,        alt: 0,       spd: 0 },
    { t: 30,       alt: 1,       spd: 0.30 },
    { t: 60,       alt: 5,       spd: 0.65 },
    { t: 90,       alt: 15,      spd: 1.10 },
    { t: p.T_SRB,  alt: 45,      spd: 1.80 },
    { t: 180,      alt: 70,      spd: 2.20 },
    { t: 240,      alt: 100,     spd: 3.10 },
    { t: 300,      alt: 120,     spd: 4.20 },
    { t: 360,      alt: 140,     spd: 5.40 },
    { t: 420,      alt: 155,     spd: 6.70 },
    { t: p.T_MECO, alt: LEO_ALT, spd: vOrb },
  ];

  for (let t = 0; t < p.T_MECO; t += p.TRAJ_DT) {
    let lo = 0;
    for (let j = 1; j < ascentProfile.length; j++) {
      if (ascentProfile[j].t > t) break;
      lo = j;
    }
    const hi = Math.min(lo + 1, ascentProfile.length - 1);
    const frac = lo === hi ? 0 : (t - ascentProfile[lo].t) / (ascentProfile[hi].t - ascentProfile[lo].t);

    const alt = ascentProfile[lo].alt + frac * (ascentProfile[hi].alt - ascentProfile[lo].alt);
    const spd = ascentProfile[lo].spd + frac * (ascentProfile[hi].spd - ascentProfile[lo].spd);
    const r = RE + alt;

    const pitchFrac = Math.min(1, t / p.T_MECO);
    let easeP = pitchFrac < 0.1 ? pitchFrac * 5 : 0.5 + 0.5 * ((pitchFrac - 0.1) / 0.9);
    easeP = Math.min(1, easeP);

    const arcAngle = startAngle + easeP * (spd / vOrb) * 0.04;

    const x = r * Math.cos(arcAngle);
    const y = r * Math.sin(arcAngle);

    const radDir = { x: Math.cos(arcAngle), y: Math.sin(arcAngle) };
    const tanDir = { x: -Math.sin(arcAngle), y: Math.cos(arcAngle) };
    const vx = spd * (radDir.x * (1 - easeP) + tanDir.x * easeP);
    const vy = spd * (radDir.y * (1 - easeP) + tanDir.y * easeP);

    TRAJ.push({ t, x, y, vx, vy });
  }

  // ---- Phase 2: RK4 integration from t=0 (LEO circular → HEO → TLI → Moon → return) ----
  let state = {
    x: r0 * Math.cos(startAngle),
    y: r0 * Math.sin(startAngle),
    vx: -vOrb * Math.sin(startAngle),
    vy:  vOrb * Math.cos(startAngle),
  };

  let t = 0;
  let heoBurnDone = false, tliDone = false, passedApogee = false;
  let minMoonDist = Infinity;
  let maxEarthDist = 0;
  const totalSteps = Math.ceil(p.T_MISSION_END / p.TRAJ_DT);

  for (let i = 0; i < totalSteps; i++) {
    state = rk4Step(state, t, p.TRAJ_DT);
    t += p.TRAJ_DT;

    const rE = Math.sqrt(state.x ** 2 + state.y ** 2);
    const speed = Math.sqrt(state.vx ** 2 + state.vy ** 2);

    // ICPS HEO burn: raises apogee to target
    if (!heoBurnDone && t >= p.T_HEO_BURN) {
      const rPeri = rE;
      const rApo = RE + p.HEO_APOGEE;
      const a = (rPeri + rApo) / 2;
      const vTarget = Math.sqrt(MU_E * (2 / rPeri - 1 / a));
      const dv = vTarget - speed;
      if (dv > 0) {
        state.vx += dv * state.vx / speed;
        state.vy += dv * state.vy / speed;
      }
      heoBurnDone = true;
      meta.heoBurn = { t, alt: Math.round(rE - RE), dv: +dv.toFixed(3) };
    }

    // TLI: two detection modes
    if (heoBurnDone && !tliDone) {
      let fire = false;
      if (p.TLI_MODE === 'fixed') {
        if (t >= p.T_TLI_BURN) fire = true;
      } else {
        // perigee mode: fire at first perigee return after HEO apogee
        if (rE > RE + 40000) passedApogee = true;
        if (passedApogee && rE < RE + 500) fire = true;
      }
      if (fire) {
        const dv = p.TLI_DV;
        state.vx += dv * state.vx / speed;
        state.vy += dv * state.vy / speed;
        tliDone = true;
        const newSpeed = Math.sqrt(state.vx ** 2 + state.vy ** 2);
        meta.tli = {
          t,
          alt: Math.round(rE - RE),
          vBefore: +speed.toFixed(3),
          vAfter: +newSpeed.toFixed(3),
          dv,
        };
      }
    }

    if (t >= p.T_MECO && (i % 6 === 0 || i === totalSteps - 1)) {
      TRAJ.push({ t, x: state.x, y: state.y, vx: state.vx, vy: state.vy });
    }

    // Track perilune, max distance, and splashdown
    if (tliDone) {
      const moon = getMoonXY(t);
      const dm = Math.sqrt((state.x - moon.x) ** 2 + (state.y - moon.y) ** 2);
      if (dm < minMoonDist) { minMoonDist = dm; meta.periluneTime = t; }
      if (rE > maxEarthDist) { maxEarthDist = rE; meta.maxDistTime = t; meta.maxDist = rE; }
      if (rE < RE + 50 && t > (meta.tli?.t ?? 0) + 3 * 86400) {
        meta.splashdown = { t, day: +(t / 86400).toFixed(2) };
        TRAJ.push({ t, x: state.x, y: state.y, vx: state.vx, vy: state.vy });
        break;
      }
    }
  }

  meta.periluneAlt = Math.round(minMoonDist - RM);
  meta.maxDistFromEarth = Math.round(maxEarthDist);
  meta.points = TRAJ.length;
  meta.params = p;

  return { meta, traj: TRAJ };
}
