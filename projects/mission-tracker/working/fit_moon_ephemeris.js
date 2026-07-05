/**
 * Mission Tracker — Fit Chebyshev to JPL Horizons Moon ephemeris
 *
 * Reads moon_ephemeris.json (433 hourly samples over 18 days), fits
 * Chebyshev polynomials to (x, y, z) components in the ecliptic J2000
 * frame, validates residuals, and writes moon_chebyshev.json.
 *
 * Tries several orders to find the smallest one that meets the accuracy
 * target (sub-1 km RMS, sub-5 km max).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { fitChebyshev3D, evalChebyshev3D } = require('./chebyshev');

// Load Moon ephemeris
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'moon_ephemeris.json'), 'utf8')
);
const wp = data.waypoints;

console.log('='.repeat(82));
console.log('Phase B — Chebyshev fit to JPL Moon ephemeris (DE440 source)');
console.log('='.repeat(82));
console.log(`  ${wp.length} samples from ${wp[0].utc} to ${wp[wp.length - 1].utc}`);
console.log(`  span: ${(wp[wp.length - 1].jdtdb - wp[0].jdtdb).toFixed(4)} days`);
console.log();

const times = wp.map(p => p.jdtdb);
const positions = wp.map(p => p.pos_km);

const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const mag = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);

// Try increasing orders until we hit sub-km RMS
console.log('Order   max err (km)   rms err (km)   c_max');
console.log('-----   ------------   ------------   -----');

let best = null;
for (const order of [16, 20, 24, 28, 32, 36, 40, 48, 56]) {
  const fit3 = fitChebyshev3D(times, positions, order);
  let maxErr = 0, sumSq = 0;
  for (let i = 0; i < wp.length; i++) {
    const fitted = evalChebyshev3D(fit3, times[i]);
    const err = mag(sub(fitted, positions[i]));
    if (err > maxErr) maxErr = err;
    sumSq += err * err;
  }
  const rmsErr = Math.sqrt(sumSq / wp.length);
  const cMax = Math.max(
    Math.max(...fit3.x.c.map(Math.abs)),
    Math.max(...fit3.y.c.map(Math.abs)),
    Math.max(...fit3.z.c.map(Math.abs))
  );
  console.log(
    `${String(order).padStart(5)}   ${maxErr.toFixed(4).padStart(12)}   ${rmsErr.toFixed(4).padStart(12)}   ${cMax.toExponential(2)}`
  );
  if (rmsErr < 1.0 && best === null) best = { order, fit3, maxErr, rmsErr };
}

if (best === null) {
  console.log();
  console.log('Could not reach sub-km RMS with single-piece fit. Try piecewise or higher order.');
  process.exit(1);
}

console.log();
console.log(`Selected order ${best.order}: max ${best.maxErr.toFixed(3)} km, RMS ${best.rmsErr.toFixed(3)} km`);
console.log();

// =============================================================================
// Save the fit
// =============================================================================

const out = {
  source: 'Fit to JPL Horizons Moon ephemeris (DE440 underlying), target=301, center=399',
  reference_frame: 'Ecliptic of J2000.0, Earth-centered',
  units: 'km, JDTDB',
  domain_jdtdb: [best.fit3.x.t_min, best.fit3.x.t_max],
  domain_utc: [wp[0].utc, wp[wp.length - 1].utc],
  order: best.order,
  fit_max_err_km: best.maxErr,
  fit_rms_err_km: best.rmsErr,
  source_samples: wp.length,
  coefficients: {
    x: best.fit3.x.c,
    y: best.fit3.y.c,
    z: best.fit3.z.c,
  },
};

fs.writeFileSync(
  path.join(__dirname, 'moon_chebyshev.json'),
  JSON.stringify(out, null, 2)
);
console.log(`Wrote moon_chebyshev.json (${best.order + 1} coefficients per axis)`);
console.log('='.repeat(82));
