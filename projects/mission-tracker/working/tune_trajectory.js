/**
 * Trajectory tuner for Artemis II validation.
 *
 * Goal: find initial conditions (HEO perigee position + TLI velocity vector
 * + Moon launch phase) that produce a free-return trajectory matching NASA's
 * Artemis II within reasonable tolerance:
 *   - Perilune altitude: 6,546 km (target)
 *   - Trans-lunar coast: ~3 days
 *   - Total mission: ~10 days (with return to Earth)
 *
 * Strategy: brute-force search over a small parameter space, score each
 * candidate by perilune distance and total mission duration, pick the best.
 */

const phys = require('./physics3d');
const { V, CONST } = phys;

const TARGET_PERILUNE = CONST.R_MOON + 6546; // 8,283 km from Moon center
const TARGET_FLYBY_DAY = 5.0; // FD6 lunar flyby

function simulateAndScore(burn_dv_kms, burn_angle_deg, moonPhase, t_max_days = 10) {
  // Set the moon phase
  phys.setEphemeris({ moonLaunchPhase: moonPhase });

  // Start from Earth-Moon Hohmann-like initial state at HEO perigee.
  // Use a circular LEO start with a TLI burn to make this simpler.
  // LEO: 200 km circular, equatorial plane (Z=0)
  const r_leo = CONST.R_EARTH + 200;
  const v_leo = Math.sqrt(CONST.MU_EARTH / r_leo);

  // Place spacecraft at +X position, moving in +Y direction (prograde)
  const initialState = {
    pos: [r_leo, 0, 0],
    vel: [0, v_leo, 0],
  };

  // TLI burn: prograde + slight off-axis component to match the Moon's
  // out-of-plane position. burn_angle is the inclination of the burn vector
  // relative to the equator (radians).
  const ba = burn_angle_deg * Math.PI / 180;
  const burns = [{
    met: 0,
    dv_magnitude: burn_dv_kms * 1000, // m/s
    frame: 'RTN',
    components: [0, Math.cos(ba), Math.sin(ba)], // tangential + normal
  }];

  // Integrate
  const traj = phys.integrate(initialState, burns, t_max_days * 86400, 60);

  // Find perilune
  let perilune_r = Infinity;
  let perilune_t = -1;
  let max_earth_r = 0;
  for (const pt of traj) {
    const moon = phys.moonPosition(pt.t);
    const dr = V.sub(pt.pos, moon);
    const r_to_moon = V.mag(dr);
    if (r_to_moon < perilune_r) {
      perilune_r = r_to_moon;
      perilune_t = pt.t;
    }
    const r_to_earth = V.mag(pt.pos);
    if (r_to_earth > max_earth_r) max_earth_r = r_to_earth;
  }

  // Score: how close to NASA target?
  const perilune_err = Math.abs(perilune_r - TARGET_PERILUNE);
  const flyby_err = Math.abs(perilune_t / 86400 - TARGET_FLYBY_DAY) * 86400;
  const score = perilune_err + flyby_err * 10; // weight time error 10x

  return {
    burn_dv_kms,
    burn_angle_deg,
    moonPhase,
    perilune_r,
    perilune_t,
    perilune_day: perilune_t / 86400,
    perilune_alt: perilune_r - CONST.R_MOON,
    max_earth_r,
    score,
  };
}

console.log('=== Trajectory Tuner ===');
console.log(`Target: perilune ${TARGET_PERILUNE} km (alt 6,546 km), flyby day ${TARGET_FLYBY_DAY}\n`);

// Coarse search
let best = null;
const dv_range = [3.10, 3.12, 3.14, 3.15, 3.16, 3.18, 3.20];
const angle_range = [0, 5, 10, 15, 20, 25, 28, 30];
const phase_range = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];

let count = 0;
for (const dv of dv_range) {
  for (const angle of angle_range) {
    for (const phase of phase_range) {
      count++;
      const r = simulateAndScore(dv, angle, phase, 8);
      if (!best || r.score < best.score) {
        best = r;
        console.log(`  [${count}] dv=${dv.toFixed(2)} angle=${angle}° phase=${phase.toFixed(2)} → perilune=${r.perilune_r.toFixed(0)} km (alt ${r.perilune_alt.toFixed(0)}) at day ${r.perilune_day.toFixed(2)} (score ${r.score.toFixed(0)})`);
      }
    }
  }
}

console.log(`\nSearched ${count} combinations.`);
console.log('\n=== Best result ===');
console.log(`burn_dv_kms:     ${best.burn_dv_kms}`);
console.log(`burn_angle_deg:  ${best.burn_angle_deg}`);
console.log(`moonPhase:       ${best.moonPhase}`);
console.log(`Perilune alt:    ${best.perilune_alt.toFixed(0)} km (target 6,546 km)`);
console.log(`Perilune day:    ${best.perilune_day.toFixed(2)} (target ${TARGET_FLYBY_DAY})`);
console.log(`Max Earth dist:  ${best.max_earth_r.toFixed(0)} km`);
