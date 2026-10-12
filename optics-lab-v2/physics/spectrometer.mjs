// Exp 214: the grating spectrometer. Collimated light from a discharge tube meets a transmission grating square to the
// collimator (normal incidence); the telescope, on an arm that turns with the graduated circle, finds each order where
//   d sin(theta) = m lambda
// Circle: degrees 0-360 read at a FIXED vernier (10 divisions over 9 deg: 0.1 deg). The reading falls as the arm turns
// counter-clockwise from above: R = THETA0 - phi, phi = the arm's turn from straight through (deg, CCW positive).
// Pure functions; angles in degrees, wavelengths in nm.
import { SOURCES } from "./wave.mjs";

export const SPEC = {
  label: 600,                 // the grating's label: lines per mm
  d: 1e6 / 596,               // its real spacing (nm): a replica grating is not exactly its label; calibration finds it
  theta0: 141.6,              // circle reading with the telescope straight through (the zero angle)
  fov: 3.0,                   // telescope field of view (deg across)
  slitDeg: 0.032,             // the slit's image (deg): 0.10 mm slit / 178 mm collimator
  aOverD: 0.4,                // grating slit width / spacing: sets how bright each order is
  armMax: 75,                 // the arm stops at +-75 deg (the collimator and the vernier bracket)
};
export const TUBES = ["helium", "hydrogen", "mercury", "sodium", "neon"];

const rad = Math.PI / 180, sinc = (x) => (Math.abs(x) < 1e-12 ? 1 : Math.sin(x) / x);
/** Relative brightness of order m: the single-slit envelope at d sin(theta) = m lambda, sinc^2(pi (a/d) m). */
export const orderEnvelope = (m) => sinc(Math.PI * SPEC.aOverD * m) ** 2;

/** Every line a tube shows through the grating: [{ w, I, m, theta }], theta = the diffraction angle (deg, sign = side). */
export function spectrum(tube, d = SPEC.d, mMax = 3) {
  const out = [], src = SOURCES[tube];
  for (let m = -mMax; m <= mMax; m++) for (const L of src.lines) {
    const s = (m * L.w) / d; if (Math.abs(s) >= 1) continue;
    const theta = Math.asin(s) / rad; if (Math.abs(theta) > SPEC.armMax + SPEC.fov) continue;
    out.push({ w: L.w, I: L.I * orderEnvelope(m), m, theta });   // m = 0: every line at theta = 0, the tube's own colour
  }
  return out;
}

/** Circle reading (deg, 0-360) for an arm turn phi (deg). */
export const reading = (phi) => (((SPEC.theta0 - phi) % 360) + 360) % 360;
/** Arm turn (deg) that puts the crosshair on a line at diffraction angle theta: the telescope looks along it. */
export const armFor = (theta) => theta;
/** Where a line sits in the eyepiece (deg from the crosshair, + = right). The telescope inverts the image, so a line
 *  at a larger angle than the arm shows on the right. */
export const fieldOffset = (theta, phi) => theta - phi;

/** Read a vernier the way a student does: the main-scale degree just below the vernier zero, plus 0.1 x the vernier
 *  line that lines up best with a main-scale line. From a reading R (deg). Returns { main, j, value }. */
export function vernierRead(R) {
  let best = { j: 0, k: Math.round(R), err: Infinity };
  for (let j = 0; j <= 10; j++) {
    const at = R + 0.9 * j, k = Math.round(at), err = Math.abs(at - k);   // vernier line j against the nearest main line k
    if (err < best.err) best = { j, k, err };
  }
  const value = Math.round((best.k - 0.9 * best.j) * 10) / 10;            // that pair fixes the reading: R = k - 0.9 j
  return { main: Math.floor(value + 1e-9), j: best.j, value: ((value % 360) + 360) % 360 };
}

/** The Exp 214 data reduction from circle readings: calibrate d on He 587.562, then lambda = d sin(theta) for H.
 *  cal = { r0, rR, rL }, rows = [{ n, r0, rR, rL }]. Returns d, the wavelengths, and the 1/lambda vs 1/n^2 fit. */
export function reduce(cal, rows, lamCal = 587.562) {
  const ang = (r) => (Math.abs(r.rR - r.r0) + Math.abs(r.rL - r.r0)) / 2;
  const d = lamCal / Math.sin(ang(cal) * rad);
  const pts = rows.map((r) => { const lam = d * Math.sin(ang(r) * rad); return { n: r.n, lam, x: 1 / (r.n * r.n), y: 1 / lam }; });
  const N = pts.length, mx = pts.reduce((a, p) => a + p.x, 0) / N, my = pts.reduce((a, p) => a + p.y, 0) / N;
  const sxy = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0), sxx = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  const slope = sxy / sxx;
  return { d, pts, slope, intercept: my - slope * mx, R: -slope };     // R in 1/nm (accepted 0.010973731)
}
export const RYDBERG = 0.010973731568;   // 1/nm
