const fs = require('fs');
const path = require('path');

// The Copilot's "active project" working directory. Sets the cwd for the agent's
// native tools (Read/Edit/Write/Grep/Glob/Bash run by `claude -p`) and the default
// cwd for background jobs — so dev work is scoped to one project instead of all of
// Dropbox. Persisted; defaults to the Dropbox root.
const DATA_DIR = path.join(__dirname, '..', 'data');
const WORKDIR_FILE = path.join(DATA_DIR, 'copilot-workdir.json');
const DEFAULT_WORKDIR = 'C:\\Users\\Cole\\Dropbox';

function get() {
  try {
    const { workdir } = JSON.parse(fs.readFileSync(WORKDIR_FILE, 'utf8'));
    if (workdir && fs.existsSync(workdir) && fs.statSync(workdir).isDirectory()) return workdir;
  } catch {}
  return DEFAULT_WORKDIR;
}

// Accepts an absolute path, or one relative to the CURRENT workdir (natural "cd").
function set(dir) {
  if (!dir || typeof dir !== 'string' || !dir.trim()) throw new Error('path required');
  const resolved = path.isAbsolute(dir) ? path.normalize(dir) : path.resolve(get(), dir);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error('Not a directory: ' + resolved);
  }
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  fs.writeFileSync(WORKDIR_FILE, JSON.stringify({ workdir: resolved }, null, 2), 'utf8');
  return resolved;
}

module.exports = { get, set, DEFAULT_WORKDIR };
