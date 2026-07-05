/**
 * Debug: print velocity table around each burn epoch to see what's happening.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILES = [
  'burn1_perigee_raise.json',
  'burn2_TLI.json',
  'burn3_OTC3.json',
  'burn4_RTC1.json',
  'burn5_RTC2.json',
  'burn6_RTC3.json',
];

const mag = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];

for (const file of FILES) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
  const wp = data.waypoints;

  console.log('='.repeat(90));
  console.log(file);
  console.log('='.repeat(90));
  console.log('  i   UTC                       |r| (Mm)    |v| (km/s)    Δ|v| (m/s)    |Δv⃗| (m/s)');
  console.log('  -   -------------------       --------    ----------    ----------    ----------');

  for (let i = 0; i < wp.length; i++) {
    const r = mag(wp[i].pos_km);
    const v = mag(wp[i].vel_km_s);

    let dvScalar = '', dvVector = '';
    if (i > 0) {
      const ds = (mag(wp[i].vel_km_s) - mag(wp[i-1].vel_km_s)) * 1000;
      const dv = sub(wp[i].vel_km_s, wp[i-1].vel_km_s);
      const dvm = mag(dv) * 1000;
      dvScalar = ds.toFixed(2).padStart(10);
      dvVector = dvm.toFixed(2).padStart(10);
    } else {
      dvScalar = '       —';
      dvVector = '       —';
    }

    console.log(
      `  ${String(i).padStart(2)}  ${wp[i].utc}      ` +
      `${(r/1000).toFixed(3).padStart(8)}    ` +
      `${v.toFixed(6).padStart(10)}    ` +
      `${dvScalar}    ${dvVector}`
    );
  }
  console.log();
}
