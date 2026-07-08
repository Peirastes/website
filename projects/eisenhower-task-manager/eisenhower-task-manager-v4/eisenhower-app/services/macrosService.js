const fs = require('fs');
const path = require('path');

// Saved one-tap commands ("macros") for the Jobs panel — e.g. "Build ETM",
// "Deploy site". Stored server-side so they're shared across all of Cole's
// devices (phone / tablet / desktop). Each runs as a background job on tap.
const FILE = path.join(__dirname, '..', 'data', 'copilot-macros.json');

function list() {
  try { const a = JSON.parse(fs.readFileSync(FILE, 'utf8')); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
function save(arr) {
  try { fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
}
function add({ label, command, cwd }) {
  if (!command || !String(command).trim()) throw new Error('command required');
  const arr = list();
  const macro = {
    id: 'm_' + Date.now().toString(36),
    label: (label && String(label).trim().slice(0, 40)) || String(command).trim().slice(0, 40),
    command: String(command).trim(),
    cwd: cwd ? String(cwd) : undefined
  };
  arr.push(macro);
  save(arr);
  return macro;
}
function remove(id) { save(list().filter(m => m.id !== id)); }

module.exports = { list, add, remove };
