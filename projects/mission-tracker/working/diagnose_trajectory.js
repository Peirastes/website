/**
 * Diagnostic: replicate the test_render_inline.html trajectory build and
 * print where the spacecraft actually goes.
 */

const phys = require('./physics3d');
const { V, CONST } = phys;

const r_leo = CONST.R_EARTH + 185;
const v_circ_leo = Math.sqrt(CONST.MU_EARTH / r_leo);

console.log(`LEO circular velocity: ${v_circ_leo.toFixed(3)} km/s`);

const initialState = {
  pos: [r_leo, 0, 0],
  vel: [0, v_circ_leo, 0],
};
const burns = [{
  met: 0,
  dv_magnitude: 3160,
  frame: 'RTN',
  components: [0, 1, 0],
}];

const r_perigee = r_leo;
const v_after = v_circ_leo + 3.160;
console.log(`Velocity after TLI: ${v_after.toFixed(3)} km/s`);
console.log(`Specific energy: ${(v_after*v_after/2 - CONST.MU_EARTH/r_perigee).toFixed(3)} km²/s²`);
console.log(`(Negative = bound to Earth, positive = escape)`);

const energy = v_after*v_after/2 - CONST.MU_EARTH/r_perigee;
if (energy < 0) {
  const a = -CONST.MU_EARTH / (2 * energy);
  const r_apogee_predicted = 2*a - r_perigee;
  console.log(`Predicted semi-major axis: ${a.toFixed(0)} km`);
  console.log(`Predicted apogee: ${r_apogee_predicted.toFixed(0)} km`);
  console.log(`Predicted period: ${(2*Math.PI*Math.sqrt(a*a*a/CONST.MU_EARTH)/86400).toFixed(2)} days`);
}

// Coplanar setup: zero inclination so Moon is in the equatorial plane
phys.setEphemeris({ moonInclination: 0, applyObliquity: false });

// Pass 1: park Moon far out of the way
phys.setEphemeris({ moonLaunchPhase: 100 });
const traj_pass1 = phys.integrate(initialState, burns, 16 * 86400, 60);

console.log(`\nPass 1: ${traj_pass1.length} points over 7 days (Moon parked far away)`);

// Find where the spacecraft is at every day
console.log('\nSpacecraft trajectory snapshots (Earth-only gravity):');
for (let day = 0; day <= 7; day++) {
  const idx = Math.min(day * 1440, traj_pass1.length - 1);
  const pt = traj_pass1[idx];
  const r = V.mag(pt.pos);
  const theta = Math.atan2(pt.pos[1], pt.pos[0]) * 180 / Math.PI;
  console.log(`  Day ${day}: r=${r.toFixed(0)} km, angle=${theta.toFixed(1)}°, pos=(${pt.pos[0].toFixed(0)}, ${pt.pos[1].toFixed(0)}, ${pt.pos[2].toFixed(0)})`);
}

// Find max distance and when
let max_r = 0;
let max_t = 0;
for (const pt of traj_pass1) {
  const r = V.mag(pt.pos);
  if (r > max_r) { max_r = r; max_t = pt.t; }
}
console.log(`\nMax distance from Earth: ${max_r.toFixed(0)} km at day ${(max_t/86400).toFixed(2)}`);

// Find when spacecraft crosses lunar distance (outbound)
let crossing_t = -1;
let crossing_pos = null;
for (let i = 1; i < traj_pass1.length; i++) {
  const r_prev = V.mag(traj_pass1[i-1].pos);
  const r_curr = V.mag(traj_pass1[i].pos);
  if (r_prev < CONST.LUNAR_DIST && r_curr >= CONST.LUNAR_DIST) {
    crossing_t = traj_pass1[i].t;
    crossing_pos = traj_pass1[i].pos;
    break;
  }
}

if (crossing_t < 0) {
  console.log(`\n*** SPACECRAFT NEVER REACHES LUNAR DISTANCE ***`);
  console.log(`Max reached: ${max_r.toFixed(0)} km vs lunar distance ${CONST.LUNAR_DIST} km`);
  console.log(`Difference: ${(CONST.LUNAR_DIST - max_r).toFixed(0)} km`);
  console.log(`This means the 388 m/s burn from HEO perigee is INSUFFICIENT to reach the Moon.`);
  console.log(`Need to either:\n  1. Use a larger TLI burn\n  2. Start from a higher orbit\n  3. Use Apollo-style 3+ km/s TLI from circular LEO`);
} else {
  console.log(`\nCrosses lunar distance at day ${(crossing_t/86400).toFixed(2)}`);
  console.log(`Position at crossing: (${crossing_pos[0].toFixed(0)}, ${crossing_pos[1].toFixed(0)}, ${crossing_pos[2].toFixed(0)})`);
  const angle = Math.atan2(crossing_pos[1], crossing_pos[0]);
  console.log(`Angle: ${(angle*180/Math.PI).toFixed(1)}°`);

  // Compute required moon phase
  const required_phase = angle - 2*Math.PI*crossing_t/CONST.LUNAR_PERIOD;
  console.log(`Required moon launch phase: ${required_phase.toFixed(3)} rad`);

  // Pass 2 with engineered phase
  phys.setEphemeris({ moonLaunchPhase: required_phase });
  const traj2 = phys.integrate(initialState, burns, 10 * 86400, 60);

  let perilune = Infinity;
  let perilune_t = 0;
  let max_r2 = 0;
  for (const pt of traj2) {
    const moon = phys.moonPosition(pt.t);
    const dr = V.sub(pt.pos, moon);
    const rm = V.mag(dr);
    if (rm < perilune) { perilune = rm; perilune_t = pt.t; }
    const re = V.mag(pt.pos);
    if (re > max_r2) max_r2 = re;
  }
  console.log(`\nPass 2 (with Moon engineered):`);
  console.log(`  Perilune: ${perilune.toFixed(0)} km (alt ${(perilune-CONST.R_MOON).toFixed(0)} km) at day ${(perilune_t/86400).toFixed(2)}`);
  console.log(`  Max Earth distance: ${max_r2.toFixed(0)} km`);

  // Check: does the spacecraft return to Earth (re-enter perigee)?
  let returns_to_earth = false;
  for (let i = traj2.length - 1; i > traj2.length / 2; i--) {
    if (V.mag(traj2[i].pos) < CONST.R_EARTH + 5000) {
      returns_to_earth = true;
      console.log(`  Returns to Earth altitude at day ${(traj2[i].t/86400).toFixed(2)}`);
      break;
    }
  }
  if (!returns_to_earth) {
    const final_r = V.mag(traj2[traj2.length-1].pos);
    console.log(`  Does NOT return to Earth — final position at day 10: ${final_r.toFixed(0)} km`);
  }
}
