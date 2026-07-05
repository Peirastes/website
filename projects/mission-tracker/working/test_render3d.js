/**
 * Headless tests for render3d.js
 *
 * These exercise the camera math and projection without a real canvas.
 */

const render = require('./render3d');
const phys = require('./physics3d');
const { V } = render;

let pass = 0, total = 0;
function test(name, fn) {
  total++;
  try {
    if (fn() !== false) { console.log(`  ✓ ${name}`); pass++; }
    else console.log(`  ✗ ${name}`);
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}
function close(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

console.log('\n=== Camera math ===');

(function() {
  // Default camera: nearly polar elevation, looking down +Z
  const cam = render.makeCamera({ azimuth: 0, elevation: Math.PI/2 - 0.0001, distance: 800000 });
  const basis = render.cameraBasis(cam);

  test('Camera position is roughly above origin', () => {
    return basis.cam_pos[2] > 700000; // mostly +Z
  });

  test('Forward vector points roughly toward origin (negative Z)', () => {
    return basis.forward[2] < -0.99;
  });

  test('Right and up vectors are unit length', () => {
    return close(V.mag(basis.right), 1, 1e-6) && close(V.mag(basis.up), 1, 1e-6);
  });

  test('Right and up are orthogonal', () => {
    return close(V.dot(basis.right, basis.up), 0, 1e-6);
  });

  test('Right is orthogonal to forward', () => {
    return close(V.dot(basis.right, basis.forward), 0, 1e-6);
  });
})();

console.log('\n=== Projection ===');

(function() {
  const cam = render.makeCamera({ azimuth: 0, elevation: Math.PI/2 - 0.0001, distance: 800000 });
  const basis = render.cameraBasis(cam);
  const scale = 0.001; // 1 km = 0.001 px

  // Origin should project to (0, 0) on screen
  const origin_proj = render.project([0, 0, 0], cam, basis, scale);
  test('Origin projects to (0, 0)', () => {
    return close(origin_proj.x, 0, 0.01) && close(origin_proj.y, 0, 0.01);
  });

  // A point along +X at lunar distance should project to a non-trivial screen position
  const lunar_x = render.project([384400, 0, 0], cam, basis, scale);
  test('Point at +X projects to non-zero screen position', () => {
    return Math.abs(lunar_x.x) > 100 || Math.abs(lunar_x.y) > 100;
  });

  // A point along +Z (above) should project very near origin in top-down view
  const polar = render.project([0, 0, 100000], cam, basis, scale);
  test('Polar point projects near origin in top-down view', () => {
    return Math.abs(polar.x) < 10 && Math.abs(polar.y) < 10;
  });
})();

console.log('\n=== Auto-fit scale ===');

(function() {
  // Trajectory extending to lunar distance, on an 800x600 canvas
  const scale = render.autoFitScale(800, 600, 384400);
  // Expected: smaller dimension (600) * 0.85 / (2 * 384400) ≈ 0.000663 px/km
  test('Auto-fit produces sensible scale for lunar trajectory', () => {
    return scale > 0 && scale < 0.001;
  });

  // Lunar distance in screen pixels at this scale
  const r_px_lunar = 384400 * scale;
  test('Lunar distance fits within canvas', () => {
    return r_px_lunar < 300; // half of 600 = 300, with margin
  });
})();

console.log('\n=== Integration with physics ===');

(function() {
  // Build a small trajectory from physics
  const initialState = {
    pos: [phys.CONST.R_EARTH + 200, 0, 0],
    vel: [0, Math.sqrt(phys.CONST.MU_EARTH / (phys.CONST.R_EARTH + 200)), 0],
  };
  const traj = phys.integrate(initialState, [], 5400, 60); // 90 minutes

  test('Physics trajectory has expected number of points', () => {
    return traj.length > 50;
  });

  // Render math: project the trajectory to screen
  const cam = render.makeCamera({ azimuth: 0, elevation: Math.PI/2 - 0.0001, distance: 50000 });
  const basis = render.cameraBasis(cam);
  const scale = render.autoFitScale(800, 600, 7000);

  let any_in_view = false;
  for (const pt of traj) {
    const p = render.project(pt.pos, cam, basis, scale);
    if (Math.abs(p.x) < 400 && Math.abs(p.y) < 300) {
      any_in_view = true;
      break;
    }
  }
  test('Some trajectory points project within canvas bounds', () => any_in_view);
})();

console.log(`\n${pass}/${total} render tests passed`);
if (pass !== total) process.exit(1);
