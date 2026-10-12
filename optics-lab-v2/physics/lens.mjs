// Thin-lens physics for the optics bench. Pure functions, no DOM, no three.js: the viewer only
// READS these, so every visual on the bench comes from here. Units: centimetres.
//
// Sign conventions follow the PSEII Chapter 30 notes:
//   1/d_o + 1/d_i = 1/f,   M = h_i/h_o = -d_i/d_o
//   f > 0 converging, f < 0 diverging; d_i > 0 real image (opposite side), d_i < 0 virtual (same side).

/** Image distance from the thin-lens equation. Object at the focal point -> Infinity (parallel rays out). */
export function imageDistance(f, dO) {
  const inv = 1 / f - 1 / dO;
  return Math.abs(inv) < 1e-12 ? Infinity : 1 / inv;
}

/** Lateral magnification M = -d_i/d_o (Infinity when the image is at infinity). */
export function magnification(f, dO) {
  const dI = imageDistance(f, dO);
  return Number.isFinite(dI) ? -dI / dO : Infinity;
}

/**
 * Where the chief ray (through the lens centre, undeviated) from an object point at height h lands on a
 * screen a distance s behind the lens: y = -h s/d_o. The blurred image on the screen is centred on these
 * points whatever the focus, so the screen picture is the object scaled by -s/d_o (inverted) and blurred.
 */
export function screenScale(dO, s) {
  return -s / dO;
}

/**
 * Blur-disc diameter on a screen a distance s behind a lens of clear aperture D. The cone from one object
 * point fills the aperture and converges toward (or diverges from) the image point at d_i:
 *   b = D |1 - s/d_i|
 * which covers every case: real image (d_i > 0, zero at s = d_i), virtual image (d_i < 0, never zero),
 * and image at infinity (b = D, a parallel beam).
 */
export function blurDiameter(D, f, dO, s) {
  const dI = imageDistance(f, dO);
  return Number.isFinite(dI) ? D * Math.abs(1 - s / dI) : D;
}

/**
 * Relative illuminance of the screen image. Light gathered from an object point scales as D^2/d_o^2; it is
 * spread over an image area that scales as (s/d_o)^2, so the d_o cancels: E ~ (D/s)^2. Normalised to 1 at sRef.
 */
export function illuminance(D, s, sRef = 30, DRef = 4) {
  return (D / DRef) ** 2 * (sRef / s) ** 2;
}

// ------------------------------------------------------------------ a REAL singlet: field curvature + astigmatism
// A real lens is a single piece of glass with spherical faces, not the ideal thin lens. Its sharp image does not lie
// on a plane: off-axis points focus closer to the lens (for f > 0), and the sagittal and tangential foci split.
// Third-order (Seidel) result for a thin lens with the stop at the lens. This is independent of the lens's bending
// and of the conjugates. Image-space curvatures, with phi = 1/f:
//   Petzval   c_p = -phi/n
//   sagittal  c_s = c_p - phi       = -(1 + 1/n) phi
//   tangential c_t = c_p - 3 phi    = -(3 + 1/n) phi
// So a point imaged at height h_i focuses at axial distance z = d_i + c h_i^2 / 2 (closer to the lens for f > 0).
// Spherical aberration is not modelled.
export const N_GLASS = 1.52;

/** Sagittal, tangential and medial focus distances (from the lens, cm) for an object point at radius rObj (cm). */
export function fieldFocus(f, dO, rObj, n = N_GLASS) {
  const dI = imageDistance(f, dO);
  if (!Number.isFinite(dI)) return { zs: Infinity, zt: Infinity, zm: Infinity, hI: Infinity };
  const hI = (-dI / dO) * rObj, q = (hI * hI) / (2 * f);
  const zs = dI - (1 + 1 / n) * q, zt = dI - (3 + 1 / n) * q;
  return { zs, zt, zm: (zs + zt) / 2, hI };
}

// ------------------------------------------------------------------ spherical aberration
// Rays through the outer zones of a spherical lens focus closer than the paraxial rays (for f > 0). Third-order
// result for a thin lens (Jenkins & White, Fundamentals of Optics, sec. 9.3), for a ray at height rho on the lens:
//   1/z(rho) - 1/z(0) = rho^2/(8 f^3 n(n-1)) [ (n+2)/(n-1) q^2 + 4(n+1) p q + (3n+2)(n-1) p^2 + n^3/(n-1) ]
// with shape factor q = 0 (the bench lenses are symmetric bi-convex / bi-concave) and position factor
// p = (d_i - d_o)/(d_i + d_o). It is checked against an exact Snell's-law trace in lens.test.mjs.
/** A in 1/z(rho) = 1/z(0) + A rho^2 (cm^-3); zero for an image at infinity. */
export function saCoefficient(f, dO, n = N_GLASS, q = 0) {
  const dI = imageDistance(f, dO);
  if (!Number.isFinite(dI)) return 0;
  const p = (dI - dO) / (dI + dO);
  return ((n + 2) / (n - 1) * q * q + 4 * (n + 1) * p * q + (3 * n + 2) * (n - 1) * p * p + n ** 3 / (n - 1)) / (8 * f ** 3 * n * (n - 1));
}

/**
 * Where the rays through one zone of the lens land on the screen. Returns rho -> landing radius (cm) about the
 * chief-ray point, for a ray through the lens at height rho (0 .. D/2).
 *  - Ideal thin lens: rho |1 - s/d_i|, every zone focusing at d_i.
 *  - Real singlet: each zone focuses at its own sagittal and tangential distances, from field curvature +
 *    astigmatism (fieldFocus) plus spherical aberration (saCoefficient). The two directions are combined as an RMS
 *    (the azimuthal average of the astigmatic ellipse).
 * For the ideal lens the rays from all zones fill a uniform disc. For the real lens the outer zones spread wider,
 * which gives the bright core and faint halo of an aberrated spot.
 */
export function zoneMap(D, f, dO, s, rObj, ideal = false, sa = true, n = N_GLASS) {
  const dI = imageDistance(f, dO);
  if (!Number.isFinite(dI)) return (rho) => rho;                      // parallel beam: lands at the same height
  if (ideal) return (rho) => rho * Math.abs(1 - s / dI);
  const { zs, zt } = fieldFocus(f, dO, rObj, n), A = sa ? saCoefficient(f, dO, n) : 0;
  return (rho) => {
    const k = A * rho * rho, ms = 1 - s * (1 / zs + k), mt = 1 - s * (1 / zt + k);
    return rho * Math.sqrt((ms * ms + mt * mt) / 2);
  };
}

/**
 * Blur on a screen at s for an object point at radius rObj, as an equivalent disc diameter: the HALF-LIGHT measure.
 * Take the smallest circle around the chief-ray point that holds half the light, with diameter d50; report
 * b = sqrt2 d50, so a uniform disc of diameter b gives back b. Half-light tracks what an eye calls sharp. An RMS
 * measure is dominated by the faint spherical-aberration halo and puts best focus too near the lens.
 *  - ideal = true: the thin-lens disc D|1 - s/d_i|.
 *  - Real singlet: field curvature + astigmatism + spherical aberration (sa = false leaves SA out).
 * The pupil is sampled uniformly by area (uniform in rho^2).
 */
export function blurAt(D, f, dO, s, rObj, ideal = false, n = N_GLASS, sa = true) {
  if (ideal) return blurDiameter(D, f, dO, s);
  if (!Number.isFinite(imageDistance(f, dO))) return D;
  const map = zoneMap(D, f, dO, s, rObj, false, sa, n), R = D / 2, N = 64, L = new Float64Array(N);
  for (let i = 0; i < N; i++) L[i] = map(R * Math.sqrt((i + 0.5) / N));
  L.sort();
  return Math.SQRT2 * (L[N / 2 - 1] + L[N / 2]);       // sqrt2 * d50, with d50 = 2 * median landing radius
}

/** Everything the bench shows, from the three carrier positions on the rail (cm) and the mounted lens. */
export function benchState({ xObj, xLens, xScreen, f, D, hO }) {
  const dO = xLens - xObj, s = xScreen - xLens;
  const dI = imageDistance(f, dO);
  const M = Number.isFinite(dI) ? -dI / dO : Infinity;
  return {
    dO, s, dI, M,
    hI: Number.isFinite(M) ? M * hO : Infinity,
    real: Number.isFinite(dI) && dI > 0,
    scale: screenScale(dO, s),
    blur: blurDiameter(D, f, dO, s),
    E: illuminance(D, s),
    focusError: Number.isFinite(dI) ? s - dI : Infinity,   // screen minus image position (cm)
  };
}
