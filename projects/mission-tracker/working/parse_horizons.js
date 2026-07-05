/**
 * Mission Tracker — Horizons text parser
 *
 * Parses NASA JPL Horizons API responses (CSV_FORMAT='YES', VEC_TABLE='2')
 * into structured JSON. Handles the $$SOE/$$EOE delimiters and the
 * standard Horizons row format:
 *
 *   JDTDB, "calendar date", X, Y, Z, VX, VY, VZ
 *
 * Position in km, velocity in km/s. Reference frame is whatever was
 * requested in the API call (we use Ecliptic J2000.0, Earth-centered).
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse a Horizons text response file into an array of state-vector records.
 *
 * Each record: { jdtdb, utc, pos_km: [x,y,z], vel_km_s: [vx,vy,vz] }
 */
function parseHorizonsFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');

  // Find $$SOE / $$EOE markers
  let startIdx = -1, endIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '$$SOE') startIdx = i + 1;
    if (lines[i].trim() === '$$EOE') { endIdx = i; break; }
  }
  if (startIdx < 0 || endIdx < 0) {
    throw new Error(`No $$SOE/$$EOE block found in ${filePath}`);
  }

  const records = [];
  for (let i = startIdx; i < endIdx; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split on commas, trim whitespace
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 8) continue;

    // Parts: [JDTDB, "A.D. 2026-Apr-02 02:00:00.0000", X, Y, Z, VX, VY, VZ, ...]
    const jdtdb = parseFloat(parts[0]);
    const calStr = parts[1];
    const x = parseFloat(parts[2]);
    const y = parseFloat(parts[3]);
    const z = parseFloat(parts[4]);
    const vx = parseFloat(parts[5]);
    const vy = parseFloat(parts[6]);
    const vz = parseFloat(parts[7]);

    if ([jdtdb, x, y, z, vx, vy, vz].some(v => !Number.isFinite(v))) continue;

    // Convert "A.D. 2026-Apr-02 02:00:00.0000" → "2026-04-02T02:00:00Z"
    const utc = parseHorizonsCalDate(calStr);

    records.push({
      jdtdb,
      utc,
      pos_km: [x, y, z],
      vel_km_s: [vx, vy, vz],
    });
  }
  return records;
}

const MONTHS = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function parseHorizonsCalDate(s) {
  // "A.D. 2026-Apr-02 02:00:00.0000"
  const m = s.match(/A\.D\.\s+(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!m) return null;
  const [, yyyy, mon, dd, hh, mm, ss] = m;
  const month = MONTHS[mon];
  const secInt = Math.floor(parseFloat(ss));
  const ssStr = String(secInt).padStart(2, '0');
  return `${yyyy}-${month}-${dd}T${hh}:${mm}:${ssStr}Z`;
}

// =============================================================================
// CLI usage
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node parse_horizons.js <file.txt> [out.json]');
    process.exit(1);
  }
  const inFile = args[0];
  const outFile = args[1] || inFile.replace(/\.txt$/, '.json');

  const records = parseHorizonsFile(inFile);
  console.log(`Parsed ${records.length} records from ${path.basename(inFile)}`);

  const out = {
    source: 'NASA JPL Horizons API, COMMAND=\'-1024\' (Artemis II / Orion)',
    reference_frame: 'Ecliptic of J2000.0',
    center_body: 'Earth (399)',
    units: {
      time: 'JDTDB (Julian Day Number, Barycentric Dynamical Time)',
      position: 'km',
      velocity: 'km/s',
    },
    waypoint_count: records.length,
    waypoints: records,
  };
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outFile}`);
}

if (require.main === module) main();

module.exports = { parseHorizonsFile, parseHorizonsCalDate };
