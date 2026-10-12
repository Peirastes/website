// Refraction at a plane surface: Snell's law, the critical angle, Fresnel reflectance, and dispersion.
// Pure functions, no DOM. Angles in radians unless a name says Deg; wavelengths in nm.

// Cauchy dispersion n(lambda) = B + C/lambda^2 (lambda in nm), each fitted through the standard indices at the Fraunhofer
// F (486.1 nm) and C (656.3 nm) lines: water 1.3371 / 1.3311 (20 C), crown (BK7) 1.5224 / 1.5143, diamond 2.4354 / 2.4100.
// Crown reproduces the 2D Optics Lab's coefficients (1.5046 / 4200). The 2D lab's WATER coefficients gave n = 1.340 at
// 589 nm (true 1.333) and are replaced here. Acrylic (PMMA): two-term fit to Sultanova et al. (2009), n_d = 1.4917.
export const MEDIA = {
  air:     { name: "air",          n: 1.000, B: 1.000,  C: 0 },
  water:   { name: "water",        n: 1.333, B: 1.3238, C: 3141 },
  acrylic: { name: "acrylic",      n: 1.492, B: 1.4797, C: 4539 },
  crown:   { name: "crown glass",  n: 1.520, B: 1.5046, C: 4200 },
  diamond: { name: "diamond",      n: 2.417, B: 2.3791, C: 13296 },
};

/** Refractive index of a medium at a wavelength (nm). */
export function indexAt(medium, wl = 589) {
  const m = MEDIA[medium];
  return m.C ? m.B + m.C / (wl * wl) : m.B;
}

/** Refraction angle from n1 sin(t1) = n2 sin(t2); null when the light is totally internally reflected. */
export function refract(n1, n2, t1) {
  const s = (n1 / n2) * Math.sin(t1);
  return Math.abs(s) > 1 ? null : Math.asin(s);
}

/** Critical angle going from n1 into n2 (only when n1 > n2), else null. */
export function criticalAngle(n1, n2) {
  return n1 > n2 ? Math.asin(n2 / n1) : null;
}

/** Brewster angle: reflected light fully s-polarised (Rp = 0). */
export function brewster(n1, n2) {
  return Math.atan(n2 / n1);
}

/**
 * Fresnel power reflectances for unpolarised light (the ray box is unpolarised): Rs, Rp and their mean R.
 * Total internal reflection gives R = 1. T = 1 - R (no absorption).
 */
export function fresnel(n1, n2, t1) {
  const t2 = refract(n1, n2, t1);
  if (t2 === null) return { Rs: 1, Rp: 1, R: 1, T: 0, tir: true };
  const c1 = Math.cos(t1), c2 = Math.cos(t2);
  const rs = (n1 * c1 - n2 * c2) / (n1 * c1 + n2 * c2), rp = (n2 * c1 - n1 * c2) / (n2 * c1 + n1 * c2);
  const Rs = rs * rs, Rp = rp * rp, R = (Rs + Rp) / 2;
  return { Rs, Rp, R, T: 1 - R, tir: false };
}

/**
 * Plane mirror (the ray table's front-surface mirror). Law of reflection: the reflected ray leaves at the angle it came
 * in, on the other side of the normal, in the plane of incidence: r = d - 2 (d . n) n for a unit direction d and a unit
 * normal n (either side). Front-surface aluminium reflects about 90 % across the visible, nearly independent of
 * wavelength, so white light stays white (the rest is absorbed; nothing is transmitted).
 */
export const MIRROR_R = 0.90;
export function reflect(d, n) {
  const k = 2 * (d[0] * n[0] + d[1] * n[1] + (d[2] || 0) * (n[2] || 0));
  return d.length === 3 ? [d[0] - k * n[0], d[1] - k * n[1], d[2] - k * n[2]] : [d[0] - k * n[0], d[1] - k * n[1]];
}
