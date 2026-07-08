const EventEmitter = require('events');

// "Asks" — the agent proactively asks Cole a question with tap-able options and
// gets his decision (pushed to the phone). Like approvals, but for arbitrary
// decisions, not tool-permission gating. In-memory + ephemeral (an ask is only
// meaningful while the agent turn that posted it is alive).
const TTL_MS = 5 * 60 * 1000;     // auto-expire if unanswered in 5 min
const KEEP_MS = 60 * 1000;

class AsksService extends EventEmitter {
  constructor() { super(); this.records = new Map(); this._seq = 0; }

  create({ question, options }) {
    const id = 'ask_' + Date.now().toString(36) + (++this._seq).toString(36);
    const opts = (Array.isArray(options) && options.length)
      ? options.map(o => String(o).slice(0, 60)).slice(0, 6)
      : ['Yes', 'No'];
    const rec = {
      id, question: String(question || 'Cole, a decision is needed.').slice(0, 400),
      options: opts, status: 'pending', answer: null, createdAt: Date.now(), answeredAt: null
    };
    this.records.set(id, rec);
    rec._timer = setTimeout(() => {
      const r = this.records.get(id);
      if (r && r.status === 'pending') { r.status = 'expired'; r.answeredAt = Date.now(); this.emit('answered', this._public(r)); this._cleanup(id); }
    }, TTL_MS);
    this.emit('new', this._public(rec));
    return this._public(rec);
  }

  get(id) { const r = this.records.get(id); return r ? this._public(r) : null; }
  listPending() { return [...this.records.values()].filter(r => r.status === 'pending').map(r => this._public(r)); }

  answer(id, answer) {
    const r = this.records.get(id);
    if (!r) throw new Error('Ask not found');
    if (r.status !== 'pending') return this._public(r);
    r.answer = (answer == null ? '' : String(answer));
    r.status = 'answered';
    r.answeredAt = Date.now();
    if (r._timer) { clearTimeout(r._timer); r._timer = null; }
    this.emit('answered', this._public(r));
    this._cleanup(id);
    return this._public(r);
  }

  _cleanup(id) { setTimeout(() => this.records.delete(id), KEEP_MS); }
  _public(r) { const { _timer, ...pub } = r; return pub; }
}

module.exports = { asksService: new AsksService() };
