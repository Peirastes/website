const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Human-in-the-loop approval queue. When approvals are ON, the agent's risky tool
// uses (file writes, shell, jobs, permanent deletes) are routed here: the MCP
// permission-prompt tool creates a pending approval and blocks polling for the
// decision; the phone shows an Approve/Deny card. Pending records are in-memory
// (ephemeral — only meaningful while a turn is blocked); a server restart kills
// the blocked turn anyway. The enabled flag is persisted.
const SETTING_FILE = path.join(__dirname, '..', 'data', 'copilot-approvals.json');
const TTL_MS = 120 * 1000;      // auto-deny if not answered in 2 min
const KEEP_DECIDED_MS = 60 * 1000;

class ApprovalsService extends EventEmitter {
  constructor() {
    super();
    this.records = new Map(); // id -> record
    this._seq = 0;
  }

  isEnabled() {
    try { return !!JSON.parse(fs.readFileSync(SETTING_FILE, 'utf8')).enabled; } catch { return false; }
  }
  setEnabled(on) {
    try {
      fs.mkdirSync(path.dirname(SETTING_FILE), { recursive: true });
      fs.writeFileSync(SETTING_FILE, JSON.stringify({ enabled: !!on }, null, 2), 'utf8');
    } catch {}
    return !!on;
  }

  create({ tool, input, summary }) {
    const id = 'apr_' + Date.now().toString(36) + (++this._seq).toString(36);
    const rec = { id, tool: tool || 'unknown', input: input || {}, summary: summary || '', status: 'pending', createdAt: Date.now(), decidedAt: null };
    this.records.set(id, rec);
    rec._timer = setTimeout(() => {
      const r = this.records.get(id);
      if (r && r.status === 'pending') { r.status = 'expired'; r.decidedAt = Date.now(); this.emit('decided', this._public(r)); this._scheduleCleanup(id); }
    }, TTL_MS);
    this.emit('new', this._public(rec));
    return this._public(rec);
  }

  get(id) { const r = this.records.get(id); return r ? this._public(r) : null; }
  listPending() { return [...this.records.values()].filter(r => r.status === 'pending').map(r => this._public(r)); }

  decide(id, decision) {
    const r = this.records.get(id);
    if (!r) throw new Error('Approval not found');
    if (r.status !== 'pending') return this._public(r);
    r.status = (decision === 'approve' || decision === 'allow') ? 'approved' : 'denied';
    r.decidedAt = Date.now();
    if (r._timer) { clearTimeout(r._timer); r._timer = null; }
    this.emit('decided', this._public(r));
    this._scheduleCleanup(id);
    return this._public(r);
  }

  _scheduleCleanup(id) { setTimeout(() => this.records.delete(id), KEEP_DECIDED_MS); }
  _public(r) { const { _timer, ...pub } = r; return pub; }
}

module.exports = { approvalsService: new ApprovalsService() };
