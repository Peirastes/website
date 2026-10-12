// Fraunhofer diffraction for the wave modules: double slit, single slit, grating. Same formulas as the 2D Optics Lab
// (Website/optics-lab/index.html), on a screen at distance L with exact angles sin(theta) = y/sqrt(y^2 + L^2).
// Pure functions. Lengths in metres, wavelengths in nm unless a name says otherwise.

const sinc = (x) => (Math.abs(x) < 1e-10 ? 1 : Math.sin(x) / x);

/** sin(theta) for a point y on a screen at distance L (exact, not small-angle). */
export const sinTheta = (y, L) => y / Math.sqrt(y * y + L * L);

/** Relative intensity (1 at the centre) for slit width a, spacing d, N slits, at sin(theta), wavelength lam (nm). */
export function intensity(kind, { a, d = 0, N = 1 }, sinT, lam) {
  const L = lam * 1e-9, alpha = (Math.PI * a * sinT) / L, env = sinc(alpha) ** 2;
  if (kind === "single") return env;
  const beta = (Math.PI * d * sinT) / L;
  if (kind === "double") return Math.cos(beta) ** 2 * env;
  // grating (N slits): [sin(N beta)/(N sin beta)]^2 sinc^2(alpha); N = 2 reduces to the double slit
  const sb = Math.sin(beta), inter = Math.abs(sb) < 1e-12 ? 1 : Math.sin(N * beta) / (N * sb);
  return inter * inter * env;
}

/** Positions (m) of the m-th bright order on the screen: d sin(theta) = m lam. null past 90 degrees. */
export function orderY(d, m, lam, L) {
  const s = (m * lam * 1e-9) / d;
  return Math.abs(s) >= 1 ? null : (L * s) / Math.sqrt(1 - s * s);
}
/** m-th dark fringe of a single slit (m != 0): a sin(theta) = m lam. */
export function singleMinY(a, m, lam, L) {
  const s = (m * lam * 1e-9) / a;
  return Math.abs(s) >= 1 ? null : (L * s) / Math.sqrt(1 - s * s);
}

// Light sources: lasers (the core) and the 2D lab's gas-discharge tubes + white light. lines = [{w (nm), I (rel.)}]
// H Balmer lines and He 587.562 nm (the Exp 214 calibration line) are NIST air wavelengths.
export const SOURCES = {
  red:      { name: "Red laser 650 nm",   kind: "laser", lines: [{ w: 650, I: 1 }] },
  green:    { name: "Green laser 532 nm", kind: "laser", lines: [{ w: 532, I: 1 }] },
  violet:   { name: "Violet laser 405 nm", kind: "laser", lines: [{ w: 405, I: 1 }] },
  white:    { name: "White light",        kind: "lamp", lines: Array.from({ length: 17 }, (_, i) => ({ w: 380 + 20 * i, I: 1 })) },
  hydrogen: { name: "Hydrogen tube",      kind: "tube", lines: [{ w: 656.279, I: 100 }, { w: 486.135, I: 35 }, { w: 434.047, I: 18 }, { w: 410.174, I: 9 }] },
  helium:   { name: "Helium tube",        kind: "tube", lines: [{ w: 667.8, I: 10 }, { w: 587.562, I: 80 }, { w: 501.6, I: 30 }, { w: 492.2, I: 20 }, { w: 471.3, I: 25 }, { w: 447.1, I: 60 }, { w: 438.8, I: 15 }, { w: 402.6, I: 8 }] },
  mercury:  { name: "Mercury tube",       kind: "tube", lines: [{ w: 579.0, I: 45 }, { w: 577.0, I: 40 }, { w: 546.1, I: 100 }, { w: 435.8, I: 60 }, { w: 404.7, I: 40 }] },
  sodium:   { name: "Sodium tube",        kind: "tube", lines: [{ w: 589.0, I: 100 }, { w: 589.6, I: 50 }] },
  neon:     { name: "Neon tube",          kind: "tube", lines: [{ w: 640.2, I: 100 }, { w: 621.7, I: 50 }, { w: 614.3, I: 60 }, { w: 585.2, I: 30 }, { w: 576.4, I: 15 }, { w: 540.1, I: 20 }, { w: 659.9, I: 10 }] },
};

/** Wavelength (nm) -> sRGB 0..1, the 2D lab's piecewise CIE approximation (wlRGB). */
export function wavelengthRGB(wl) {
  let r = 0, g = 0, b = 0;
  if (wl >= 380 && wl < 440) { r = -(wl - 440) / 60; b = 1; }
  else if (wl < 490 && wl >= 440) { g = (wl - 440) / 50; b = 1; }
  else if (wl < 510 && wl >= 490) { g = 1; b = -(wl - 510) / 20; }
  else if (wl < 580 && wl >= 510) { r = (wl - 510) / 70; g = 1; }
  else if (wl < 645 && wl >= 580) { r = 1; g = -(wl - 645) / 65; }
  else if (wl >= 645 && wl <= 700) { r = 1; }
  let f = 1;
  if (wl >= 380 && wl < 420) f = 0.3 + (0.7 * (wl - 380)) / 40;
  else if (wl >= 645 && wl <= 700) f = 0.3 + (0.7 * (700 - wl)) / 55;
  return [r, g, b].map((c) => Math.pow(c * f, 0.8));
}
