/**
 * Mission Tracker — 3D Physics Engine
 *
 * Foundational module for the Mission Tracker framework. Computes spacecraft
 * trajectories under N-body gravity using a 3D RK4 integrator. State vectors
 * are 6D: [x, y, z, vx, vy, vz] in km and km/s, J2000-like inertial frame
 * with Earth at origin.
 *
 * This is the validation gate from SPEC §11 Phase 3: it must reproduce the
 * Artemis II free-return trajectory using only real burns (no synthetic TCM).
 *
 * Usage:
 *   const physics = require('./physics3d');
 *   const traj = physics.integrate(initialState, burns, t_end, dt);
 *
 * Status: Phase 1 — initial implementation, awaiting standalone tests
 */

'use strict';

// =============================================================================
// PHYSICAL CONSTANTS
// =============================================================================

const CONST = {
  // Gravitational parameters (km^3/s^2)
  MU_EARTH: 398600.4418,
  MU_MOON:  4902.8,
  MU_SUN:   132712440018,

  // Bodies (km)
  R_EARTH: 6371,
  R_MOON:  1737,
  R_SUN:   695700,

  // Distances (km)
  LUNAR_DIST: 384400,        // mean Earth-Moon
  AU:         149597870.7,   // 1 AU

  // Periods (seconds)
  LUNAR_PERIOD:  27.321661 * 86400,  // sidereal lunar month
  EARTH_YEAR:    365.25 * 86400,

  // Inclinations (radians)
  MOON_INCL_ECLIPTIC: 5.145 * Math.PI / 180,  // Moon orbit to ecliptic
  ECLIPTIC_OBLIQUITY: 23.44 * Math.PI / 180,  // ecliptic to equator (J2000)
};

// =============================================================================
// 3D VECTOR UTILITIES
// =============================================================================

const V = {
  add:   (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
  sub:   (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]],
  scale: (a, s) => [a[0]*s, a[1]*s, a[2]*s],
  dot:   (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
  cross: (a, b) => [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ],
  mag:   (a) => Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]),
  norm:  (a) => {
    const m = V.mag(a);
    return m > 0 ? [a[0]/m, a[1]/m, a[2]/m] : [0,0,0];
  },
};

// =============================================================================
// EPHEMERIS — Moon and Sun positions in 3D (Earth-centered inertial frame)
// =============================================================================
//
// Coordinate convention: Earth-centered inertial (ECI), J2000-like.
// X-axis: vernal equinox direction (toward Sun at vernal equinox)
// Z-axis: Earth's rotation axis (north pole)
// Y-axis: completes right-handed frame
//
// Moon orbit: simplified Keplerian circular orbit in a plane inclined
// 5.145° to the ecliptic, which itself is inclined 23.44° to the equator.
// This is sufficient for trajectory accuracy at the ~minutes level.
//
// Sun position: apparent geocentric position assuming circular Earth orbit
// in the ecliptic plane.
// =============================================================================

/**
 * Rotate a vector by an angle around the X axis.
 * Used to transform from ecliptic to equatorial coordinates.
 */
function rotX(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
}

/**
 * Get Moon position in 3D (ECI frame, km).
 * t is mission elapsed time in seconds from launch.
 *
 * The launch_phase parameter sets the Moon's position at t=0 — this is
 * tunable to align the model with NASA's mission parameters.
 */
function moonPosition(t, launchPhase = 0.4) {
  // Moon position in its own orbital plane (inclined to ecliptic)
  const meanAnomaly = launchPhase + 2 * Math.PI * t / CONST.LUNAR_PERIOD;
  const x_orbit = CONST.LUNAR_DIST * Math.cos(meanAnomaly);
  const y_orbit = CONST.LUNAR_DIST * Math.sin(meanAnomaly);
  const z_orbit = 0;

  // Apply Moon orbital inclination (5.145° to ecliptic)
  // Rotate around the X axis (line of nodes simplified as fixed)
  const ecliptic = rotX([x_orbit, y_orbit, z_orbit], CONST.MOON_INCL_ECLIPTIC);

  // Apply ecliptic-to-equatorial rotation (Earth axial tilt)
  return rotX(ecliptic, CONST.ECLIPTIC_OBLIQUITY);
}

/**
 * Get Sun position in 3D (ECI frame, km).
 * Earth in circular orbit around Sun; we represent the Sun's apparent
 * geocentric position.
 *
 * The sunPhase parameter sets the Sun's position at t=0.
 */
function sunPosition(t, sunPhase = 3.54) {
  // Sun apparent motion in the ecliptic
  const meanLongitude = sunPhase + 2 * Math.PI * t / CONST.EARTH_YEAR;
  const x_ecliptic = CONST.AU * Math.cos(meanLongitude);
  const y_ecliptic = CONST.AU * Math.sin(meanLongitude);
  const z_ecliptic = 0;

  // Convert from ecliptic to equatorial frame
  return rotX([x_ecliptic, y_ecliptic, z_ecliptic], CONST.ECLIPTIC_OBLIQUITY);
}

// =============================================================================
// GRAVITY MODEL
// =============================================================================

/**
 * Compute 3D gravitational acceleration on a spacecraft at position pos,
 * at mission time t.
 *
 * Includes Earth gravity (point mass), Moon gravity (point mass), and
 * Sun tidal perturbation (Earth-centered non-inertial frame correction).
 *
 * Returns acceleration vector [ax, ay, az] in km/s^2.
 */
function gravityAccel(pos, t) {
  // Earth gravity
  const rE = V.mag(pos);
  const rE3 = rE * rE * rE;
  let a = V.scale(pos, -CONST.MU_EARTH / rE3);

  // Moon gravity
  const moon = moonPosition(t);
  const dM = V.sub(pos, moon);
  const rM = V.mag(dM);
  const rM3 = rM * rM * rM;
  a = V.add(a, V.scale(dM, -CONST.MU_MOON / rM3));

  // Sun tidal perturbation
  // The Sun's direct pull on the spacecraft is mostly canceled by the
  // Earth's free-fall toward the Sun (we're in a rotating Earth-centered
  // frame). The residual tidal acceleration is the difference.
  const sun = sunPosition(t);
  const dS = V.sub(pos, sun);
  const rS = V.mag(dS);
  const rS3 = rS * rS * rS;
  const rSE = V.mag(sun);
  const rSE3 = rSE * rSE * rSE;
  // Tidal: -mu_sun * (dS/rS^3 + sun/rSE^3)
  // First term: Sun's pull on spacecraft
  // Second term: Sun's pull on Earth (subtracted to get relative accel)
  const tidal = V.add(
    V.scale(dS,  -CONST.MU_SUN / rS3),
    V.scale(sun, -CONST.MU_SUN / rSE3)
  );
  a = V.add(a, tidal);

  return a;
}

// =============================================================================
// RK4 INTEGRATOR — 6D state vector
// =============================================================================

/**
 * State: { pos: [x,y,z], vel: [vx,vy,vz] }
 *
 * Advance the state by one timestep using the classic RK4 method.
 */
function rk4Step(state, t, dt) {
  // k1
  const k1_pos = state.vel;
  const k1_vel = gravityAccel(state.pos, t);

  // k2 (midpoint estimate)
  const pos2 = V.add(state.pos, V.scale(k1_pos, 0.5*dt));
  const vel2 = V.add(state.vel, V.scale(k1_vel, 0.5*dt));
  const k2_pos = vel2;
  const k2_vel = gravityAccel(pos2, t + 0.5*dt);

  // k3 (midpoint refined)
  const pos3 = V.add(state.pos, V.scale(k2_pos, 0.5*dt));
  const vel3 = V.add(state.vel, V.scale(k2_vel, 0.5*dt));
  const k3_pos = vel3;
  const k3_vel = gravityAccel(pos3, t + 0.5*dt);

  // k4 (endpoint)
  const pos4 = V.add(state.pos, V.scale(k3_pos, dt));
  const vel4 = V.add(state.vel, V.scale(k3_vel, dt));
  const k4_pos = vel4;
  const k4_vel = gravityAccel(pos4, t + dt);

  // Weighted sum
  const dPos = V.scale(
    V.add(V.add(k1_pos, V.scale(k2_pos, 2)),
          V.add(V.scale(k3_pos, 2), k4_pos)),
    dt / 6
  );
  const dVel = V.scale(
    V.add(V.add(k1_vel, V.scale(k2_vel, 2)),
          V.add(V.scale(k3_vel, 2), k4_vel)),
    dt / 6
  );

  return {
    pos: V.add(state.pos, dPos),
    vel: V.add(state.vel, dVel)
  };
}

// =============================================================================
// BURNS — 3D delta-v application
// =============================================================================

/**
 * Apply an impulsive burn to a state vector.
 *
 * burn = {
 *   met: number,            // mission elapsed time (seconds)
 *   dv_magnitude: number,   // m/s (will be converted to km/s internally)
 *   frame: 'RTN' | 'ECI',   // reference frame
 *   components: [r, t, n]   // direction unit vector in the chosen frame
 * }
 *
 * RTN frame:
 *   R = Radial    (unit vector from Earth center to spacecraft, outward)
 *   T = Tangential (in orbital plane, perpendicular to R, in direction of motion)
 *   N = Normal    (perpendicular to orbital plane, R × T direction)
 *
 * Returns a new state with updated velocity.
 */
function applyBurn(state, burn) {
  const dv_kms = burn.dv_magnitude / 1000; // m/s → km/s

  let dv_eci;
  if (burn.frame === 'ECI') {
    // Direct ECI components
    dv_eci = V.scale(burn.components, dv_kms);
  } else {
    // RTN frame: convert to ECI
    const R = V.norm(state.pos);
    const h = V.cross(state.pos, state.vel);  // angular momentum direction
    const N = V.norm(h);
    const T = V.cross(N, R);                  // R × N would be wrong direction; N × R gives prograde

    const [cR, cT, cN] = burn.components;
    dv_eci = [
      cR * R[0] + cT * T[0] + cN * N[0],
      cR * R[1] + cT * T[1] + cN * N[1],
      cR * R[2] + cT * T[2] + cN * N[2],
    ];
    dv_eci = V.scale(dv_eci, dv_kms);
  }

  return {
    pos: state.pos,
    vel: V.add(state.vel, dv_eci),
  };
}

// =============================================================================
// TRAJECTORY INTEGRATION
// =============================================================================

/**
 * Integrate a trajectory from initial state to t_end, applying burns at
 * scheduled times.
 *
 * Returns an array of {t, pos, vel} samples.
 */
function integrate(initialState, burns, t_end, dt = 10) {
  const trajectory = [];
  let state = { pos: [...initialState.pos], vel: [...initialState.vel] };
  let t = 0;

  // Sort burns by MET
  const sortedBurns = [...burns].sort((a, b) => a.met - b.met);
  let burnIdx = 0;

  trajectory.push({ t, pos: [...state.pos], vel: [...state.vel] });

  while (t < t_end) {
    // Apply any burns due at or before the current time
    while (burnIdx < sortedBurns.length && sortedBurns[burnIdx].met <= t) {
      state = applyBurn(state, sortedBurns[burnIdx]);
      burnIdx++;
    }

    // Advance one RK4 step
    state = rk4Step(state, t, dt);
    t += dt;

    trajectory.push({ t, pos: [...state.pos], vel: [...state.vel] });
  }

  return trajectory;
}

// =============================================================================
// EXPORTS
// =============================================================================

window.MissionPhysics = {
  CONST,
  V,
  moonPosition,
  sunPosition,
  gravityAccel,
  rk4Step,
  applyBurn,
  integrate,
};
