// ============================================================================
// The Apophenia Filter — tuning / validation harness  (v0.4)
//
//   node tuning-harness.js
//
// Reproduces the EXACT v0.4 generators (mirrors MECH_PARAMS + genSeries in
// apophenia-filter-v0-4.jsx), then Monte-Carlos, for every mechanism × tier:
//   • the ORACLE ceiling  — an observer that knows the latent state, and
//   • a PRACTICAL baseline — a history-only observer (EWMA slope / anchor),
// and checks the oracle ceilings against the CEILING table the app ships.
//
// This is the §7 guard: ANY change to generator parameters, VIS/FUT, or the
// oracle definition must be validated here, the CEILING table updated to the
// measured values, and a new PARAMS_HASH written — before deploy.
//
// (Replaces the earlier exploratory scratch file, which concatenated three
//  snippets with duplicate top-level `const` declarations and did not run.)
// ============================================================================

const VIS = 60, FUT = 12;
const N = Number(process.argv[2]) || 60000;   // trials per cell; override: node tuning-harness.js 100000

function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// --- v0.4 generator parameters (must match the app's MECH_PARAMS) ---
const MECH_PARAMS = {
  momentum: { sd: 0.25, obs: 0.7, subtle: { phi: 0.82 }, standard: { phi: 0.92 }, sentinel: { phi: 0.99 } },
  meanrev:  { subtle: { k: 0.04, shock: 0 }, standard: { k: 0.12, shock: 1.5 }, sentinel: { k: 0.12, shock: 8 } },
  regime:   { subtle: { mu: 0.3, pS: 0.06 }, standard: { mu: 0.45, pS: 0.04 }, sentinel: { mu: 0.9, pS: 0.01 } },
};

// --- CEILING table the app ships (apophenia-filter-v0-4.jsx) ---
const CEILING = {
  momentum: { subtle: 63, standard: 73, sentinel: 88 },
  meanrev:  { subtle: 65, standard: 73, sentinel: 93 },
  regime:   { subtle: 66, standard: 77, sentinel: 94 },
};

// --- exact mirror of genSeries, returning the series AND the latent state @VIS ---
function gen(mech, tier) {
  const n = VIS + FUT + 1, xs = [0];
  let latent = null;
  if (mech === "noise") {
    for (let i = 1; i < n; i++) xs.push(xs[i - 1] + gauss());
  } else if (mech === "momentum") {
    const { sd, obs } = MECH_PARAMS.momentum, { phi } = MECH_PARAMS.momentum[tier];
    let d = 0;
    for (let i = 1; i < n; i++) { d = phi * d + sd * gauss(); xs.push(xs[i - 1] + d + obs * gauss()); if (i === VIS) latent = d; }
  } else if (mech === "meanrev") {
    const { k, shock } = MECH_PARAMS.meanrev[tier], sh = shock * (Math.random() < 0.5 ? 1 : -1);
    for (let i = 1; i < n; i++) { let dx = -k * xs[i - 1] + gauss(); if (shock && i === VIS - 4) dx += sh; xs.push(xs[i - 1] + dx); if (i === VIS) latent = xs[i]; }
  } else {
    const { mu, pS } = MECH_PARAMS.regime[tier]; let s = Math.random() < 0.5 ? 1 : -1;
    for (let i = 1; i < n; i++) { if (Math.random() < pS) s = -s; xs.push(xs[i - 1] + s * mu + gauss()); if (i === VIS) latent = s; }
  }
  return { xs, latent };
}

// oracle: sign of the expected 12-step displacement given the latent state
function oracleCall(mech, latent) {
  if (mech === "momentum") return Math.sign(latent);   // AR drift persists
  if (mech === "meanrev")  return -Math.sign(latent);  // displacement reverts
  if (mech === "regime")   return Math.sign(latent);   // current regime sign
  return 0;
}

// practical observer: visible history only
function practicalCall(mech, xs) {
  if (mech === "meanrev") {
    let m = 0; for (let i = 0; i <= VIS; i++) m += xs[i]; m /= (VIS + 1);
    return Math.sign(m - xs[VIS]);                      // pull back toward the window mean
  }
  let s = 0; for (let i = 1; i <= VIS; i++) s = 0.8 * s + 0.2 * (xs[i] - xs[i - 1]);
  return Math.sign(s);                                  // EWMA slope
}

function measure(mech, tier) {
  let oOK = 0, oN = 0, pOK = 0, pN = 0;
  for (let t = 0; t < N; t++) {
    const { xs, latent } = gen(mech, tier);
    const up = xs[VIS + FUT] > xs[VIS] ? 1 : -1;
    const oc = oracleCall(mech, latent), pc = practicalCall(mech, xs);
    if (oc !== 0) { oN++; if (oc === up) oOK++; }
    if (pc !== 0) { pN++; if (pc === up) pOK++; }
  }
  return { oracle: 100 * oOK / oN, practical: 100 * pOK / pN };
}

console.log(`Apophenia Filter — ceiling validation (N=${N}/cell, MC 95% CI ~±${(98 / Math.sqrt(N)).toFixed(2)} pts)\n`);
console.log("mech      tier      shipped  oracle   Δ       practical");
let maxDelta = 0;
for (const mech of ["momentum", "meanrev", "regime"]) {
  for (const tier of ["subtle", "standard", "sentinel"]) {
    const { oracle, practical } = measure(mech, tier);
    const ship = CEILING[mech][tier], d = oracle - ship;
    maxDelta = Math.max(maxDelta, Math.abs(d));
    console.log(
      mech.padEnd(10) + tier.padEnd(10) + String(ship).padEnd(9) +
      oracle.toFixed(1).padEnd(9) + ((d >= 0 ? "+" : "") + d.toFixed(1)).padEnd(8) + practical.toFixed(1)
    );
  }
}
// noise sanity: no oracle; a practical slope-follower must sit at ~50
{
  let pOK = 0, pN = 0;
  for (let t = 0; t < N; t++) {
    const { xs } = gen("noise");
    const up = xs[VIS + FUT] > xs[VIS] ? 1 : -1, pc = practicalCall("momentum", xs);
    if (pc !== 0) { pN++; if (pc === up) pOK++; }
  }
  console.log("noise     —         50       —        —       " + (100 * pOK / pN).toFixed(1) + "  (must be ~50)");
}
console.log(`\nMax |Δ| oracle vs shipped: ${maxDelta.toFixed(1)} pts`);
console.log(maxDelta <= 2.0
  ? "PASS — shipped CEILING table matches the v0.4 generators."
  : "FAIL — a ceiling drifted >2 pts; update the CEILING table (and PARAMS_HASH) before deploy.");
