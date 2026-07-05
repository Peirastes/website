/**
 * Mission Tracker — Horizons Planarity Test
 *
 * Strict test: is the Artemis II trajectory mathematically planar?
 * If YES, all 16 Horizons waypoints should lie on a single plane through
 * Earth's center, and the perpendicular residual should be ≈ 0.
 *
 * Method:
 *   1. Build the 3×3 outer-product matrix M = Σ r_i r_iᵀ
 *   2. Diagonalize M (power iteration + deflation, symmetric 3×3)
 *   3. The eigenvector with the smallest eigenvalue is the best-fit plane
 *      normal. The square root of that eigenvalue / N gives the RMS
 *      perpendicular distance from the plane.
 *   4. Compare against the trajectory's "width" (largest eigenvalue) to
 *      get a planarity ratio.
 *
 * Expected outcome based on prior diagnostic:
 *   Outbound and return legs sit on different planes (~23° apart), so
 *   a single best-fit plane should have residuals on the order of
 *   r * sin(23°/2) ≈ 80,000 km. That is "very 3D" — there is NO viewing
 *   angle from which the curve collapses to a line.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const horizons = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_horizons.json'), 'utf8')
);
const wp = horizons.waypoints;

// -----------------------------------------------------------------------------
// 3D linear algebra
// -----------------------------------------------------------------------------

const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const mag = (a) => Math.sqrt(dot(a, a));
const norm = (a) => { const m = mag(a); return [a[0]/m, a[1]/m, a[2]/m]; };
const cross = (a, b) => [
  a[1]*b[2] - a[2]*b[1],
  a[2]*b[0] - a[0]*b[2],
  a[0]*b[1] - a[1]*b[0],
];
const matVec = (M, v) => [
  M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
  M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
  M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2],
];

// -----------------------------------------------------------------------------
// Build covariance / outer-product matrix from positions
// -----------------------------------------------------------------------------

function outerProductMatrix(points) {
  const M = [[0,0,0],[0,0,0],[0,0,0]];
  for (const p of points) {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        M[i][j] += p[i] * p[j];
  }
  return M;
}

// -----------------------------------------------------------------------------
// Symmetric 3×3 eigendecomposition via power iteration + deflation
// -----------------------------------------------------------------------------

function powerIter(M, seed, iters = 500) {
  let v = norm(seed);
  for (let i = 0; i < iters; i++) v = norm(matVec(M, v));
  const lam = dot(v, matVec(M, v));
  return { vec: v, val: lam };
}

function deflate(M, vec, val) {
  const D = [[0,0,0],[0,0,0],[0,0,0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      D[i][j] = M[i][j] - val * vec[i] * vec[j];
  return D;
}

function eigen3sym(M) {
  // Largest eigenpair
  const e1 = powerIter(M, [1, 0.3, 0.7]);
  // Deflate and find second-largest
  const M2 = deflate(M, e1.vec, e1.val);
  let e2 = powerIter(M2, [0.4, 1, 0.2]);
  // Re-orthogonalize against e1 (numerical hygiene)
  const proj = dot(e1.vec, e2.vec);
  const v2 = norm([
    e2.vec[0] - proj * e1.vec[0],
    e2.vec[1] - proj * e1.vec[1],
    e2.vec[2] - proj * e1.vec[2],
  ]);
  e2 = { vec: v2, val: dot(v2, matVec(M, v2)) };
  // Third eigenvector by cross product
  const v3 = norm(cross(e1.vec, e2.vec));
  const e3 = { vec: v3, val: dot(v3, matVec(M, v3)) };
  return [e1, e2, e3];
}

// -----------------------------------------------------------------------------
// Run the test
// -----------------------------------------------------------------------------

console.log('='.repeat(80));
console.log('Horizons Planarity Test — is Artemis II trajectory mathematically planar?');
console.log('='.repeat(80));
console.log();

const points = wp.map((p) => p.pos_km);
const N = points.length;

const M = outerProductMatrix(points);
const eigs = eigen3sym(M);
// Sort descending
eigs.sort((a, b) => b.val - a.val);

console.log('Eigenvalues of Σ r_i r_iᵀ (descending):');
console.log(`  λ1 = ${eigs[0].val.toExponential(4)}   √(λ1/N) = ${Math.sqrt(eigs[0].val / N).toFixed(0).padStart(8)} km   (in-plane spread axis 1)`);
console.log(`  λ2 = ${eigs[1].val.toExponential(4)}   √(λ2/N) = ${Math.sqrt(eigs[1].val / N).toFixed(0).padStart(8)} km   (in-plane spread axis 2)`);
console.log(`  λ3 = ${eigs[2].val.toExponential(4)}   √(λ3/N) = ${Math.sqrt(eigs[2].val / N).toFixed(0).padStart(8)} km   (out-of-plane = perpendicular)`);
console.log();

const planeNormal = eigs[2].vec;
console.log(`Best-fit plane normal: [${planeNormal.map(v => v.toFixed(4)).join(', ')}]`);

// Per-point perpendicular residuals (signed: distance along normal)
console.log();
console.log('Perpendicular distance of each waypoint from the best-fit plane:');
console.log('  WP   UTC                       d_perp (km)    |r| (km)     d_perp/|r|');
console.log('  --   -------------------       -----------    ---------    ----------');
const residuals = [];
for (let k = 0; k < N; k++) {
  const d = dot(planeNormal, points[k]);  // signed
  const r = mag(points[k]);
  residuals.push(Math.abs(d));
  console.log(
    `  ${String(k).padStart(2)}   ${wp[k].utc}       ` +
    `${d.toFixed(0).padStart(11)}    ` +
    `${r.toFixed(0).padStart(9)}    ` +
    `${(Math.abs(d) / r * 100).toFixed(2).padStart(6)}%`
  );
}

const rmsResid = Math.sqrt(residuals.reduce((s, d) => s + d * d, 0) / N);
const maxResid = Math.max(...residuals);
const inPlaneScale = Math.sqrt((eigs[0].val + eigs[1].val) / N);
const planarityRatio = rmsResid / inPlaneScale;

console.log();
console.log('-'.repeat(80));
console.log('Planarity statistics');
console.log('-'.repeat(80));
console.log(`  RMS perpendicular residual:  ${rmsResid.toFixed(0).padStart(8)} km`);
console.log(`  Max perpendicular residual:  ${maxResid.toFixed(0).padStart(8)} km`);
console.log(`  In-plane RMS scale:          ${inPlaneScale.toFixed(0).padStart(8)} km`);
console.log(`  Planarity ratio (perp/in):   ${(planarityRatio * 100).toFixed(2)}%`);
console.log();

console.log('='.repeat(80));
const PLANAR_THRESHOLD = 0.01; // 1% of in-plane scale = effectively planar
if (planarityRatio < PLANAR_THRESHOLD) {
  console.log('VERDICT: trajectory IS mathematically planar.');
  console.log('         A single viewing angle exists from which the curve appears flat.');
} else if (planarityRatio < 0.05) {
  console.log('VERDICT: trajectory is NEARLY planar (within a few percent).');
  console.log('         From an edge-on view it may LOOK flat to the eye, but is not.');
} else {
  console.log('VERDICT: trajectory is GENUINELY 3D.');
  console.log('         No viewing angle collapses it to a line.');
  console.log(`         Best-fit plane has max residual of ${(maxResid/1000).toFixed(0)} Mm —`);
  console.log('         that\'s the bend at perilune, where the lunar gravity assist');
  console.log('         tilted the trajectory onto a different orbital plane.');
}
console.log('='.repeat(80));
