/**
 * Mission Tracker — Chebyshev polynomial fit and evaluation
 *
 * Single-piece Chebyshev approximation for smooth functions of time.
 * Used to represent the Moon's geocentric ecliptic position over the
 * Artemis II mission window with sub-km accuracy.
 *
 * Fit method: least squares on a uniformly-sampled grid (not Chebyshev
 * nodes, but with N >> order the difference is negligible).
 *
 * Evaluation: Clenshaw recursion (O(N) and numerically stable).
 */

'use strict';

// =============================================================================
// Chebyshev polynomials of the first kind
// =============================================================================

/**
 * T_k(x) for k ≥ 0, x in [-1, 1].
 */
function chebT(k, x) {
  if (k === 0) return 1;
  if (k === 1) return x;
  let t0 = 1, t1 = x;
  for (let i = 2; i <= k; i++) {
    const t2 = 2 * x * t1 - t0;
    t0 = t1;
    t1 = t2;
  }
  return t1;
}

// =============================================================================
// Linear solver — Gaussian elimination with partial pivoting
// =============================================================================

function solveLinear(A, b) {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[pivot][i])) pivot = k;
    }
    [aug[i], aug[pivot]] = [aug[pivot], aug[i]];
    if (Math.abs(aug[i][i]) < 1e-14) {
      throw new Error(`Singular matrix at column ${i}`);
    }
    for (let k = i + 1; k < n; k++) {
      const f = aug[k][i] / aug[i][i];
      for (let j = i; j <= n; j++) aug[k][j] -= f * aug[i][j];
    }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = aug[i][n];
    for (let j = i + 1; j < n; j++) s -= aug[i][j] * x[j];
    x[i] = s / aug[i][i];
  }
  return x;
}

// =============================================================================
// Fit
// =============================================================================

/**
 * Fit a Chebyshev series of given order to (times, values).
 * Returns { t_min, t_max, c } where c is the coefficient array.
 *
 * The series approximates values[i] as Σ_k c_k T_k(τ_i), where
 * τ_i = 2 (t_i - t_min) / (t_max - t_min) - 1.
 */
function fitChebyshev(times, values, order) {
  const t_min = times[0];
  const t_max = times[times.length - 1];
  const N = times.length;
  const M = order + 1;

  // Map times to [-1, +1]
  const taus = times.map(t => 2 * (t - t_min) / (t_max - t_min) - 1);

  // Build (A^T A) and (A^T y) where A[i][k] = T_k(τ_i)
  const ATA = Array.from({ length: M }, () => new Array(M).fill(0));
  const ATy = new Array(M).fill(0);
  const row = new Array(M);

  for (let i = 0; i < N; i++) {
    for (let k = 0; k < M; k++) row[k] = chebT(k, taus[i]);
    for (let r = 0; r < M; r++) {
      for (let c = r; c < M; c++) ATA[r][c] += row[r] * row[c];
      ATy[r] += row[r] * values[i];
    }
  }
  // Symmetrize
  for (let r = 0; r < M; r++) {
    for (let c = 0; c < r; c++) ATA[r][c] = ATA[c][r];
  }

  const c = solveLinear(ATA, ATy);
  return { t_min, t_max, c };
}

// =============================================================================
// Evaluate
// =============================================================================

/**
 * Evaluate a Chebyshev fit at time t. Uses Clenshaw recursion for stability.
 *
 * For a series f(τ) = c_0/2 + Σ_{k=1}^{N} c_k T_k(τ), Clenshaw computes:
 *   b_{N+1} = b_N = 0
 *   b_k = 2τ b_{k+1} - b_{k+2} + c_k     for k = N..1
 *   f(τ) = c_0 + τ b_1 - b_2              (using full c_0 since we did NOT halve it)
 *
 * Note: our `fitChebyshev` does NOT halve c_0 (treats it as a regular
 * coefficient), so the Clenshaw formula is f = c_0 + τ b_1 - b_2.
 */
function evalChebyshev(fit, t) {
  const { t_min, t_max, c } = fit;
  const tau = 2 * (t - t_min) / (t_max - t_min) - 1;
  const N = c.length;
  let b1 = 0, b2 = 0;
  for (let k = N - 1; k >= 1; k--) {
    const bk = 2 * tau * b1 - b2 + c[k];
    b2 = b1;
    b1 = bk;
  }
  return c[0] + tau * b1 - b2;
}

/**
 * Fit a 3D vector-valued function: returns three independent fits
 * for the x, y, z components.
 */
function fitChebyshev3D(times, vectors, order) {
  const xs = vectors.map(v => v[0]);
  const ys = vectors.map(v => v[1]);
  const zs = vectors.map(v => v[2]);
  return {
    x: fitChebyshev(times, xs, order),
    y: fitChebyshev(times, ys, order),
    z: fitChebyshev(times, zs, order),
  };
}

function evalChebyshev3D(fit3, t) {
  return [
    evalChebyshev(fit3.x, t),
    evalChebyshev(fit3.y, t),
    evalChebyshev(fit3.z, t),
  ];
}

module.exports = {
  chebT,
  solveLinear,
  fitChebyshev,
  evalChebyshev,
  fitChebyshev3D,
  evalChebyshev3D,
};
