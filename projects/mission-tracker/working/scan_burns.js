/**
 * Scan the full Horizons mission file for burn signatures.
 *
 * Method: at each sample, compute the second-difference of velocity (i.e.,
 * the difference between the actual Δv from the previous sample and the
 * Δv that would be expected from continuing the prior trend). For a smooth
 * gravitational coast, this second-difference is small. At a burn epoch it
 * spikes by the magnitude of the impulsive ΔV.
 *
 * For each spike, report the epoch and approximate magnitude.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_horizons_full.json'), 'utf8')
);
const wp = data.waypoints;

const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const mag = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);

// Compute |Δv⃗| between consecutive samples (= burn + dt × gravity)
const dvSeries = [];
for (let i = 1; i < wp.length; i++) {
  const dv = sub(wp[i].vel_km_s, wp[i-1].vel_km_s);
  const dt_s = (wp[i].jdtdb - wp[i-1].jdtdb) * 86400;
  dvSeries.push({
    i,
    utc: wp[i].utc,
    dv_mag_ms: mag(dv) * 1000,
    dt_s,
    r_Mm: mag(wp[i].pos_km) / 1000,
  });
}

// Compute the local "baseline" Δv (median of nearby samples in a window).
// A burn appears as a spike well above this baseline.
const WINDOW = 5;
function localMedian(idx) {
  const lo = Math.max(0, idx - WINDOW);
  const hi = Math.min(dvSeries.length - 1, idx + WINDOW);
  const slice = [];
  for (let j = lo; j <= hi; j++) {
    if (Math.abs(j - idx) <= 1) continue; // skip the sample itself and immediate neighbors
    slice.push(dvSeries[j].dv_mag_ms);
  }
  slice.sort((a, b) => a - b);
  return slice[Math.floor(slice.length / 2)];
}

console.log('Scanning full mission Horizons data for burn signatures');
console.log('='.repeat(82));
console.log(`  ${wp.length} waypoints, ${dvSeries.length} intervals`);
console.log();
console.log('Looking for samples where |Δv⃗| significantly exceeds local median...');
console.log();

const candidates = [];
for (let i = 0; i < dvSeries.length; i++) {
  const baseline = localMedian(i);
  const ratio = dvSeries[i].dv_mag_ms / Math.max(baseline, 1e-6);
  if (ratio > 2.0 && dvSeries[i].dv_mag_ms > 0.05) {
    candidates.push({ ...dvSeries[i], baseline, ratio });
  }
}

console.log(`Found ${candidates.length} burn candidate samples:`);
console.log();
console.log('  i      UTC                       |Δv⃗| (m/s)    baseline    ratio    |r| (Mm)');
console.log('  ----   -------------------       ----------    --------    -----    --------');
for (const c of candidates) {
  console.log(
    `  ${String(c.i).padStart(4)}   ${c.utc}      ` +
    `${c.dv_mag_ms.toFixed(2).padStart(10)}    ` +
    `${c.baseline.toFixed(2).padStart(8)}    ` +
    `${c.ratio.toFixed(1).padStart(5)}    ` +
    `${c.r_Mm.toFixed(2).padStart(8)}`
  );
}
console.log();

// Group adjacent candidates into burn windows (separated by > 5 samples)
const burns = [];
let cur = [];
for (const c of candidates) {
  if (cur.length === 0 || c.i - cur[cur.length - 1].i <= 3) {
    cur.push(c);
  } else {
    burns.push(cur);
    cur = [c];
  }
}
if (cur.length > 0) burns.push(cur);

console.log(`Grouped into ${burns.length} burn epochs:`);
console.log();
for (let k = 0; k < burns.length; k++) {
  const group = burns[k];
  const startUtc = group[0].utc;
  const endUtc = group[group.length - 1].utc;
  const totalMag = group.reduce((s, c) => s + c.dv_mag_ms, 0);
  const baselineSum = group.reduce((s, c) => s + c.baseline, 0);
  const burnExcess = totalMag - baselineSum;
  console.log(`  Burn #${k + 1}: ${startUtc} → ${endUtc}`);
  console.log(`    samples: ${group.length}`);
  console.log(`    summed |Δv⃗|: ${totalMag.toFixed(2)} m/s`);
  console.log(`    baseline sum: ${baselineSum.toFixed(2)} m/s`);
  console.log(`    burn excess: ${burnExcess.toFixed(2)} m/s`);
  console.log(`    altitude:    ${(group[0].r_Mm).toFixed(1)} Mm`);
  console.log();
}
