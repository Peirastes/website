const fs = require('fs-extra');
const path = require('path');

// Append-only JSONL record of every task mutation, so "a task changed and I
// don't know why / who" is answerable. One line per mutation:
//   { ts, action, source, taskId, task, details }
// source = 'ui' (browser, same-origin) | 'agent' (Copilot via MCP) | 'api' (other).
const DATA_DIR = path.join(__dirname, '..', 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'task-audit.log');
const MAX_BYTES = 5 * 1024 * 1024; // rotate past 5MB, keep one previous generation

fs.ensureDirSync(DATA_DIR);

// Classify the caller from request headers without touching the UI/agent code
// paths: the MCP fetch sets X-ETM-Source: agent; browsers send Sec-Fetch-Site.
function sourceOf(req) {
  const explicit = req && req.headers && req.headers['x-etm-source'];
  if (explicit) return String(explicit).slice(0, 24);
  if (req && req.headers && req.headers['sec-fetch-site'] === 'same-origin') return 'ui';
  return 'api';
}

async function logMutation(entry) {
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    try {
      const st = await fs.stat(AUDIT_FILE);
      if (st.size > MAX_BYTES) await fs.move(AUDIT_FILE, AUDIT_FILE + '.1', { overwrite: true });
    } catch { /* file doesn't exist yet — fine */ }
    await fs.appendFile(AUDIT_FILE, line);
  } catch { /* audit is best-effort — never block or fail a mutation on it */ }
}

// Read the most recent N entries (newest first). Tolerates a half-written last line.
async function readRecent(limit = 100) {
  try {
    if (!(await fs.pathExists(AUDIT_FILE))) return [];
    const raw = await fs.readFile(AUDIT_FILE, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    const slice = lines.slice(-Math.max(1, Math.min(limit, 1000)));
    const out = [];
    for (const l of slice) { try { out.push(JSON.parse(l)); } catch { /* skip bad line */ } }
    return out.reverse();
  } catch {
    return [];
  }
}

module.exports = { logMutation, readRecent, sourceOf, AUDIT_FILE };
