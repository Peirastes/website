/**
 * Mission Tracker — build standalone HTML
 *
 * Reads artemis2_v2.html and artemis2_trajectory.json, injects the JSON
 * as an inline <script> setting window.__TRAJ_INLINE__, and writes
 * artemis2_v2_standalone.html.
 *
 * The standalone file works via file:// (no local server needed) because
 * the app code prefers inline data over fetch().
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HTML_IN  = path.join(__dirname, 'artemis2_v2.html');
const JSON_IN  = path.join(__dirname, 'artemis2_trajectory.json');
const HTML_OUT = path.join(__dirname, 'artemis2_v2_standalone.html');

const html = fs.readFileSync(HTML_IN, 'utf8');
const json = fs.readFileSync(JSON_IN, 'utf8');

// Inline the trajectory as a JavaScript object assigned to window.__TRAJ_INLINE__.
// Insert right before the main <script> block so it's defined before any code
// that checks for it.
const inlineScript =
  '<script>\n' +
  '/* Inlined trajectory data (build_standalone.js) */\n' +
  'window.__TRAJ_INLINE__ = ' + json + ';\n' +
  '</script>\n';

const marker = '<script>\n/* ═════════════════════════════════════════════════════════════════\n   Artemis II v2 — App JS';
const idx = html.indexOf(marker);
if (idx < 0) {
  console.error('ERROR: could not find main script block in artemis2_v2.html');
  process.exit(1);
}

const out = html.slice(0, idx) + inlineScript + html.slice(idx);
fs.writeFileSync(HTML_OUT, out);

const sizeKB = (fs.statSync(HTML_OUT).size / 1024).toFixed(0);
console.log(`Wrote ${path.basename(HTML_OUT)}  (${sizeKB} KB)`);
console.log('  Open this file directly in your browser — no server needed.');
