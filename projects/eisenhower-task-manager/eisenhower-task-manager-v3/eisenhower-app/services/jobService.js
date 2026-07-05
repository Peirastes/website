const { spawn } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const EventEmitter = require('events');
const workdir = require('./workdirService');

// Background-jobs manager. The SERVER owns long-running child processes (not the
// per-turn `claude -p`), so a job the agent launches via the run_job MCP tool
// outlives the chat turn. Output is file-backed (off the Dropbox tree to avoid
// sync thrash); job metadata lives in data/jobs.json (low-churn, atomic write).
// Phase 1: in-process children (server restart marks running jobs 'interrupted');
// no detach/re-adopt, no push (in-app events only), auto-approve.

const DATA_DIR = path.join(__dirname, '..', 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const LOG_DIR = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'peirastes-etm', 'jobs');
const DROPBOX_ROOT = 'C:\\Users\\Cole\\Dropbox';

const MAX_CONCURRENT = 5;
const MAX_RUNTIME_MS = 6 * 60 * 60 * 1000;     // 6h auto-kill
const MAX_LOG_BYTES = 5 * 1024 * 1024;         // per-job output cap
const PRUNE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // drop finished jobs + logs after 7 days

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

class JobService extends EventEmitter {
  constructor() {
    super();
    this.jobs = this._load();   // array of records (persisted)
    this.procs = new Map();     // id -> live ChildProcess (this server process only)
    this.timers = new Map();    // id -> runtime watchdog timer
    this._reconcile();
    this._prune();
  }

  _load() {
    try { return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8')); } catch { return []; }
  }

  async _persist() {
    try {
      const tmp = JOBS_FILE + '.tmp';
      await fsp.writeFile(tmp, JSON.stringify(this.jobs, null, 2), 'utf8');
      await this._renameWithRetry(tmp, JOBS_FILE);
    } catch { /* best-effort metadata persist */ }
  }

  // tasks.json/jobs.json live in Dropbox → atomic rename intermittently hits EPERM
  // while the sync client holds a handle. Retry with backoff (see taskService).
  async _renameWithRetry(from, to, tries = 8) {
    for (let i = 0; i < tries; i++) {
      try { await fsp.rename(from, to); return; }
      catch (e) {
        if (['EPERM', 'EBUSY', 'EACCES'].includes(e.code) && i < tries - 1) {
          await new Promise(r => setTimeout(r, 60 * (i + 1)));
          continue;
        }
        throw e;
      }
    }
  }

  // Phase 1: children don't survive a server restart, so anything still marked
  // active on load was killed by the restart — mark it interrupted.
  _reconcile() {
    let changed = false;
    for (const j of this.jobs) {
      if (j.status === 'running' || j.status === 'queued') {
        j.status = 'interrupted';
        j.endedAt = j.endedAt || new Date().toISOString();
        changed = true;
      }
    }
    if (changed) this._persist();
  }

  _prune() {
    const cutoff = Date.now() - PRUNE_AFTER_MS;
    const keep = [];
    for (const j of this.jobs) {
      const ended = j.endedAt ? Date.parse(j.endedAt) : null;
      if (ended && ended < cutoff) { try { fs.unlinkSync(j.logFile); } catch {} }
      else keep.push(j);
    }
    if (keep.length !== this.jobs.length) { this.jobs = keep; this._persist(); }
  }

  _public(r) { const { _final, _capped, ...pub } = r; return pub; }
  _runningCount() { return this.jobs.filter(j => j.status === 'running').length; }

  launch({ command, cwd, label, source }) {
    if (!command || typeof command !== 'string' || !command.trim()) {
      throw new Error('command (non-empty string) required');
    }
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      id,
      command,
      cwd: cwd || workdir.get(),
      label: (label && String(label).slice(0, 80)) || command.slice(0, 60),
      source: source || 'api',
      status: 'queued',
      pid: null,
      exitCode: null,
      startedAt: null,
      endedAt: null,
      logFile: path.join(LOG_DIR, `${id}.log`),
      bytesOut: 0
    };
    this.jobs.push(record);
    this._persist();
    this._drain();
    return this._public(record);
  }

  _drain() {
    while (this._runningCount() < MAX_CONCURRENT) {
      const next = this.jobs.find(j => j.status === 'queued');
      if (!next) break;
      this._start(next);
    }
  }

  _start(record) {
    record.status = 'running';
    record.startedAt = new Date().toISOString();

    const out = fs.createWriteStream(record.logFile, { flags: 'a' });
    let proc;
    try {
      proc = spawn(record.command, { shell: true, cwd: record.cwd, windowsHide: true });
    } catch (err) {
      out.write(`[failed to spawn: ${err.message}]\n`); out.end();
      record.status = 'failed'; record.endedAt = new Date().toISOString(); record.exitCode = -1;
      this._persist(); this.emit('done', this._public(record));
      return;
    }
    record.pid = proc.pid;
    this.procs.set(record.id, proc);
    this._persist();
    this.emit('started', this._public(record));

    const onData = (chunk) => {
      record.bytesOut += chunk.length;
      if (record.bytesOut <= MAX_LOG_BYTES) out.write(chunk);
      else if (!record._capped) { record._capped = true; out.write(`\n[output truncated at ${MAX_LOG_BYTES} bytes]\n`); }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);

    this.timers.set(record.id, setTimeout(() => this.stop(record.id, 'timed-out'), MAX_RUNTIME_MS));

    const finish = (code) => {
      if (record.status !== 'running') return; // already finalized
      const t = this.timers.get(record.id); if (t) clearTimeout(t); this.timers.delete(record.id);
      this.procs.delete(record.id);
      out.end();
      record.endedAt = new Date().toISOString();
      record.exitCode = (typeof code === 'number') ? code : null;
      record.status = record._final || (code === 0 ? 'completed' : 'failed');
      this._persist();
      this.emit('done', this._public(record));
      this._drain();
    };
    proc.on('exit', (code) => finish(code));
    proc.on('error', (err) => { try { out.write(`\n[process error: ${err.message}]\n`); } catch {} ; record._final = 'failed'; finish(-1); });
  }

  stop(id, reason = 'stopped') {
    const record = this.jobs.find(j => j.id === id);
    if (!record) throw new Error('Job not found');
    if (record.status === 'queued') {
      record.status = 'stopped'; record.endedAt = new Date().toISOString();
      this._persist(); this.emit('done', this._public(record));
      return this._public(record);
    }
    if (record.status !== 'running') return this._public(record); // already finished
    record._final = reason;
    const proc = this.procs.get(id);
    if (proc && proc.pid) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true });
      } else {
        try { proc.kill('SIGKILL'); } catch {}
      }
    }
    return this._public(record);
  }

  list(status) {
    const arr = status ? this.jobs.filter(j => j.status === status) : this.jobs;
    // newest first
    return arr.slice().reverse().map(j => this._public(j));
  }

  get(id) { const r = this.jobs.find(j => j.id === id); return r ? this._public(r) : null; }

  async readLog(id, maxBytes = 64 * 1024) {
    const r = this.jobs.find(j => j.id === id);
    if (!r) return '';
    try {
      const buf = await fsp.readFile(r.logFile);
      return (buf.length > maxBytes ? buf.slice(-maxBytes) : buf).toString('utf8');
    } catch { return ''; }
  }

  logPath(id) { const r = this.jobs.find(j => j.id === id); return r ? r.logFile : null; }

  async remove(id) {
    const i = this.jobs.findIndex(j => j.id === id);
    if (i === -1) throw new Error('Job not found');
    const r = this.jobs[i];
    if (r.status === 'running' || r.status === 'queued') throw new Error('Job still active — stop it first');
    this.jobs.splice(i, 1);
    await this._persist();
    try { await fsp.unlink(r.logFile); } catch {}
    return true;
  }
}

module.exports = { jobService: new JobService(), JobService };
