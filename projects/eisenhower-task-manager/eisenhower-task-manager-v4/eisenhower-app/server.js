require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Shared task data layer
const taskService = require('./services/taskService');
const audit = require('./services/auditService');
const { jobService } = require('./services/jobService');
const push = require('./services/pushService');
const workdir = require('./services/workdirService');
const macros = require('./services/macrosService');
const { approvalsService } = require('./services/approvalsService');
const { asksService } = require('./services/asksService');
const projectService = require('./services/projectService');
const briefing = require('./services/briefingService');
const fsNode = require('fs');

// Daily briefing: generate (agent or templated), push it, remember the latest.
let latestBriefing = null;
async function runBriefing(reason) {
  const cfg = briefing.getConfig();
  const title = '☀ Morning briefing';
  let mode = cfg.mode || 'agent', body, detail;
  if (mode === 'agent' && agent && typeof agent.runOnce === 'function') {
    try {
      detail = await agent.runOnce(briefing.briefingPrompt());
      // Push teaser = the deterministic counts (concise + reliable); the rich agent
      // synthesis is the detail shown in the chat.
      try { body = (await briefing.computeDigest()).body; } catch { body = 'Your briefing is ready'; }
    } catch (e) {
      console.error('Agent briefing failed, falling back to templated:', e.message);
      mode = 'templated';
    }
  } else if (mode === 'agent') {
    mode = 'templated'; // agent unavailable
  }
  if (mode === 'templated') {
    const d = await briefing.computeDigest();
    body = d.body; detail = d.detail;
  }
  latestBriefing = { title, body, detail, mode, generatedAt: new Date().toISOString() };
  try { push.sendToAll({ title, body, url: '/chat', tag: 'briefing' }); } catch {}
  console.log('Briefing (%s, %s): %s', reason, mode, body);
  return latestBriefing;
}
// Scheduler tick — once a minute, fire the briefing if it's due.
setInterval(() => { try { if (briefing.shouldFire(new Date())) runBriefing('scheduled'); } catch (e) { console.error('briefing tick:', e.message); } }, 60000);

// Phase 2: when a job finishes, push a notification to the phone (works even when
// the Copilot is closed) — in addition to the in-app toast for open clients.
jobService.on('done', (rec) => { try { push.notifyJobDone(rec); } catch {} });

// Compact a task to {id, task} for audit detail; cap a list and note overflow.
const briefTask = (t) => ({ id: t && t.id, task: t && t.task });
const capList = (arr, n = 50) => arr.length > n ? arr.slice(0, n).concat([{ task: `…+${arr.length - n} more` }]) : arr;
// Positional signature of the MEANINGFUL fields — order-stable and type-normalized,
// so a bulk-save "modified" is a real field change, not key reordering / formatting
// / a migration-added field. (deletedAt is handled separately as trash/restore.)
const taskSig = (t) => JSON.stringify([
  t.task, t.domain, t.scope, t.subcategory, !!t.isUrgent, !!t.isNecessary, t.rank,
  t.dueDate || null, t.completedDate || null, t.percentComplete || 0, t.notes || '',
  !!t.isRecurring, t.recurringPattern || 'once', t.qualityRating ?? null, t.easeRating ?? null,
  t.timeEstimateValue || 0, t.timeEstimateUnit || 'hours'
]);

// Copilot subsystem — headless mode (uses Claude Code subscription via MCP)
const { CopilotHeadless } = require('./services/CopilotHeadless');
const { TokenTracker } = require('./services/TokenTracker');
// Legacy imports (kept for rollback — set USE_HEADLESS=false in .env to revert)
const USE_HEADLESS = process.env.USE_HEADLESS !== 'false';
const { CopilotAgent } = require('./services/CopilotAgent');
const { PipelineEngine } = require('./services/pipelineEngine');
const { PipelineRunManager } = require('./services/pipelineRunManager');
const { ClaudeService } = require('./services/claudeService');
const { CommandService } = require('./services/commandService');
const { FileService } = require('./services/fileService');

const app = express();
// v4 (cockpit re-architecture) runs on :3002 so it never collides with the
// live v3 app on :3001. Override with PORT env if needed.
const PORT = Number(process.env.PORT) || 3002;

const HISTORY_FILE = path.join(__dirname, 'data', 'copilot-conversation.json');
const USAGE_FILE = path.join(__dirname, 'data', 'copilot-token-usage.json');
const PIPELINES_DIR = path.join(__dirname, '..', '..', '..', 'agent-pipeline-ide', 'pipelines');
const AUTH_TOKEN = process.env.COPILOT_AUTH_TOKEN;
const MONTHLY_BUDGET = parseFloat(process.env.COPILOT_MONTHLY_BUDGET || '10');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ========================================
// ETM API Routes (no auth — backward compatible)
// ========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await taskService.getTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error reading tasks:', error);
    res.status(500).json({ error: 'Failed to read tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  // Bulk-replace endpoint: the body MUST be the full task array. Reject anything
  // else so a stray single-object payload can never clobber every task.
  if (!Array.isArray(req.body)) {
    console.warn('Rejected /api/tasks bulk save: body was %s, not an array', req.body === null ? 'null' : typeof req.body);
    return res.status(400).json({ error: 'Expected an array of tasks' });
  }
  try {
    // Diff against the current file BEFORE overwriting so UI-driven changes
    // (the UI persists deletes/edits via this bulk endpoint, not the per-task
    // routes) are captured in the audit log.
    let delta = null;
    try {
      const prev = await taskService.readTasks();
      const prevById = new Map(prev.map(t => [t.id, t]));
      const nextById = new Map(req.body.map(t => [t.id, t]));
      const added = [], removed = [], trashed = [], restored = [], modified = [];
      for (const [id, t] of nextById) {
        const p = prevById.get(id);
        if (!p) { added.push(t); continue; }
        const pDel = !!p.deletedAt, nDel = !!t.deletedAt;
        if (!pDel && nDel) trashed.push(t);
        else if (pDel && !nDel) restored.push(t);
        else if (taskSig(p) !== taskSig(t)) modified.push(t);
      }
      for (const [id, t] of prevById) if (!nextById.has(id)) removed.push(t);
      if (added.length + removed.length + trashed.length + restored.length + modified.length > 0) {
        delta = {
          added: capList(added.map(briefTask)), removed: capList(removed.map(briefTask)),
          trashed: capList(trashed.map(briefTask)), restored: capList(restored.map(briefTask)),
          modified: capList(modified.map(briefTask))
        };
      }
    } catch { /* diff is best-effort */ }

    await taskService.writeTasks(req.body);
    console.log('Tasks saved (%d items)', req.body.length);
    if (delta) audit.logMutation({ action: 'bulk-save', source: audit.sourceOf(req), count: req.body.length, details: delta });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const tasks = await taskService.getTasks();
    const task = tasks.find(t => t.id === req.params.id);
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error reading task:', error);
    res.status(500).json({ error: 'Failed to read task' });
  }
});

app.post('/api/tasks/add', async (req, res) => {
  try {
    const newTask = await taskService.addTask(req.body);
    console.log('Task added: %s', newTask.task);
    audit.logMutation({ action: 'add', source: audit.sourceOf(req), taskId: newTask.id, task: newTask.task });
    res.json(newTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const updated = await taskService.updateTask(req.params.id, req.body);
    console.log('Task updated: %s', updated.task);
    audit.logMutation({ action: 'update', source: audit.sourceOf(req), taskId: updated.id, task: updated.task, details: { fields: Object.keys(req.body || {}) } });
    res.json(updated);
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    // Soft delete by default (recoverable via /restore). `?hard=true` purges.
    const hard = req.query.hard === 'true' || req.query.hard === '1';
    if (hard) {
      const removed = await taskService.purgeTask(req.params.id);
      console.log('Task PURGED (permanent): %s', removed.task);
      audit.logMutation({ action: 'purge', source: audit.sourceOf(req), taskId: removed.id, task: removed.task });
      return res.json({ success: true, purged: removed });
    }
    const trashed = await taskService.deleteTask(req.params.id);
    console.log('Task moved to trash: %s', trashed.task);
    audit.logMutation({ action: 'delete', source: audit.sourceOf(req), taskId: trashed.id, task: trashed.task });
    res.json({ success: true, deleted: trashed, recoverable: true });
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.post('/api/tasks/:id/restore', async (req, res) => {
  try {
    const restored = await taskService.restoreTask(req.params.id);
    console.log('Task restored from trash: %s', restored.task);
    audit.logMutation({ action: 'restore', source: audit.sourceOf(req), taskId: restored.id, task: restored.task });
    res.json({ success: true, restored });
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('Error restoring task:', error);
    res.status(500).json({ error: 'Failed to restore task' });
  }
});

app.post('/api/tasks/import', bearerAuth, async (req, res) => {
  try {
    const tasks = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ error: 'Expected an array of tasks' });
    const result = await taskService.importTasks(tasks);
    console.log('Tasks imported: %d added, %d skipped, %d errors', result.added.length, result.skipped.length, result.errors.length);
    audit.logMutation({ action: 'import', source: audit.sourceOf(req), details: { added: result.added.length, skipped: result.skipped.length, errors: result.errors.length, tasks: capList(result.added.map(briefTask)) } });
    res.json(result);
  } catch (error) {
    console.error('Error importing tasks:', error);
    res.status(500).json({ error: 'Failed to import tasks' });
  }
});

app.get('/api/audit', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const entries = await audit.readRecent(limit);
    res.json({ count: entries.length, entries });
  } catch (error) {
    console.error('Error reading audit log:', error);
    res.status(500).json({ error: 'Failed to read audit log' });
  }
});

// ── Projects (first-class task containers with rolled-up progress) ──
app.get('/api/projects', async (req, res) => {
  try { res.json({ projects: await projectService.listWithProgress() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/projects', async (req, res) => {
  try {
    const p = await projectService.create(req.body || {});
    audit.logMutation({ action: 'project-create', source: audit.sourceOf(req), taskId: p.id, task: p.name });
    res.status(201).json(p);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/api/projects/:id', async (req, res) => {
  const p = await projectService.getWithTasks(req.params.id);
  if (!p) return res.status(404).json({ error: 'Project not found' });
  res.json(p);
});
app.patch('/api/projects/:id', async (req, res) => {
  try { res.json(await projectService.update(req.params.id, req.body || {})); }
  catch (e) { res.status(e.message === 'Project not found' ? 404 : 400).json({ error: e.message }); }
});
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const r = await projectService.remove(req.params.id);
    audit.logMutation({ action: 'project-delete', source: audit.sourceOf(req), taskId: r.id, task: r.name });
    res.json({ success: true, removed: r });
  } catch (e) { res.status(e.message === 'Project not found' ? 404 : 400).json({ error: e.message }); }
});

// ========================================
// Background Jobs — long-running shell work launched by the agent (run_job MCP
// tool) or the UI. Open like the /api/tasks routes; the perimeter is Tailscale,
// and the Phase-3 approval hook is where tighter per-launch control will go.
// ========================================

app.post('/api/jobs', async (req, res) => {
  try {
    const { command, cwd, label } = req.body || {};
    if (!command || typeof command !== 'string' || !command.trim()) {
      return res.status(400).json({ error: 'command (non-empty string) required' });
    }
    const src = audit.sourceOf(req);
    const job = jobService.launch({ command, cwd, label, source: src });
    audit.logMutation({ action: 'job-launch', source: src, taskId: job.id, task: job.label, details: { command: job.command } });
    console.log('Job launched [%s] (%s): %s', job.id, src, job.label);
    res.status(202).json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/jobs', (req, res) => {
  res.json({ jobs: jobService.list(req.query.status) });
});

// Global lifecycle stream (drives the UI badge + completion toasts). Registered
// BEFORE /api/jobs/:id so "events" isn't captured as an :id.
app.get('/api/jobs/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const send = (event, data) => { try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {} };
  send('hello', { ok: true });
  const onStarted = (rec) => send('started', rec);
  const onDone = (rec) => send('done', rec);
  jobService.on('started', onStarted);
  jobService.on('done', onDone);
  const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch {} }, 25000);
  const cleanup = () => { clearInterval(ka); jobService.removeListener('started', onStarted); jobService.removeListener('done', onDone); try { res.end(); } catch {} };
  res.on('close', cleanup);
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = jobService.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const output = await jobService.readLog(req.params.id);
  res.json({ ...job, output });
});

// Live output: backlog, then live appends, then a 'done' event.
app.get('/api/jobs/:id/stream', async (req, res) => {
  const job = jobService.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const send = (event, data) => { try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {} };

  const logFile = job.logFile;
  let offset = 0;
  let closed = false;
  let poll = null; // declared up front so cleanup() never hits a TDZ on early exit

  const pump = async () => {
    try {
      const st = await fsNode.promises.stat(logFile).catch(() => null);
      if (!st || st.size <= offset) return;
      const stream = fsNode.createReadStream(logFile, { start: offset, end: st.size - 1 });
      let chunk = '';
      for await (const c of stream) chunk += c.toString('utf8');
      offset = st.size;
      if (chunk) send('output', { text: chunk });
    } catch {}
  };
  const cleanup = () => {
    if (closed) return; closed = true;
    if (poll) clearInterval(poll);
    jobService.removeListener('done', onDone);
    try { res.end(); } catch {}
  };
  const onDone = async (rec) => {
    if (rec.id !== req.params.id || closed) return;
    await pump();
    send('done', { status: rec.status, exitCode: rec.exitCode });
    cleanup();
  };

  res.on('close', cleanup);

  await pump(); // backlog
  const cur = jobService.get(req.params.id);
  if (cur && cur.status !== 'running' && cur.status !== 'queued') {
    send('done', { status: cur.status, exitCode: cur.exitCode });
    cleanup();
    return;
  }
  jobService.on('done', onDone);
  poll = setInterval(pump, 600);
});

app.post('/api/jobs/:id/stop', (req, res) => {
  try {
    jobService.stop(req.params.id);
    audit.logMutation({ action: 'job-stop', source: audit.sourceOf(req), taskId: req.params.id });
    res.json({ success: true, job: jobService.get(req.params.id) });
  } catch (e) {
    res.status(e.message === 'Job not found' ? 404 : 500).json({ error: e.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await jobService.remove(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(e.message === 'Job not found' ? 404 : 400).json({ error: e.message });
  }
});

// Web Push (job completion notifications). Open routes, same posture as /api/jobs.
app.get('/api/push/vapid', (req, res) => {
  res.json({ publicKey: push.getPublicKey() });
});
app.post('/api/push/subscribe', (req, res) => {
  try { res.json({ success: true, ...push.addSubscription(req.body) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/api/push/unsubscribe', (req, res) => {
  try { push.removeSubscription((req.body || {}).endpoint); res.json({ success: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/api/push/test', async (req, res) => {
  // force:true so the SW shows it even if a Copilot window is focused (you tapped Test on purpose).
  try { res.json(await push.sendToAll({ title: '🔔 Copilot', body: 'Test notification — push is working.', url: '/chat', tag: 'push-test', force: true })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Copilot working directory ("active project") — scopes the agent's native tools + jobs.
app.get('/api/copilot/workdir', (req, res) => {
  res.json({ workdir: workdir.get(), default: workdir.DEFAULT_WORKDIR });
});
app.post('/api/copilot/workdir', (req, res) => {
  try { res.json({ success: true, workdir: workdir.set((req.body || {}).path) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Saved one-tap job macros (shared across devices).
app.get('/api/copilot/macros', (req, res) => res.json({ macros: macros.list() }));
app.post('/api/copilot/macros', (req, res) => {
  try { res.json({ success: true, macro: macros.add(req.body || {}) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/copilot/macros/:id', (req, res) => { macros.remove(req.params.id); res.json({ success: true }); });

// ── Human-in-the-loop approvals ──
app.get('/api/copilot/approvals-config', (req, res) => res.json({ enabled: approvalsService.isEnabled() }));
app.post('/api/copilot/approvals-config', (req, res) => res.json({ enabled: approvalsService.setEnabled((req.body || {}).enabled) }));

app.get('/api/copilot/approvals', (req, res) => res.json({ approvals: approvalsService.listPending() }));
app.post('/api/copilot/approvals', (req, res) => {
  try { res.status(201).json(approvalsService.create(req.body || {})); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
// SSE registered before /:id so "events" isn't captured as an id.
app.get('/api/copilot/approvals/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const send = (event, data) => { try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {} };
  send('hello', { pending: approvalsService.listPending() });
  const onNew = (r) => send('new', r);
  const onDecided = (r) => send('decided', r);
  approvalsService.on('new', onNew);
  approvalsService.on('decided', onDecided);
  const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch {} }, 25000);
  const cleanup = () => { clearInterval(ka); approvalsService.removeListener('new', onNew); approvalsService.removeListener('decided', onDecided); try { res.end(); } catch {} };
  res.on('close', cleanup);
});
app.get('/api/copilot/approvals/:id', (req, res) => {
  const a = approvalsService.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Approval not found' });
  res.json(a);
});
app.post('/api/copilot/approvals/:id/decide', (req, res) => {
  try { res.json(approvalsService.decide(req.params.id, (req.body || {}).decision)); }
  catch (e) { res.status(e.message === 'Approval not found' ? 404 : 400).json({ error: e.message }); }
});

// ── Agent "asks" (proactive decision prompts, pushed to the phone) ──
app.get('/api/copilot/asks', (req, res) => res.json({ asks: asksService.listPending() }));
app.post('/api/copilot/asks', (req, res) => {
  try {
    const a = asksService.create(req.body || {});
    try { push.sendToAll({ title: '💬 Copilot needs your input', body: a.question.slice(0, 140), url: '/chat', tag: 'ask-' + a.id, force: true }); } catch {}
    res.status(201).json(a);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/api/copilot/asks/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const send = (event, data) => { try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {} };
  send('hello', { pending: asksService.listPending() });
  const onNew = (r) => send('new', r);
  const onAnswered = (r) => send('answered', r);
  asksService.on('new', onNew);
  asksService.on('answered', onAnswered);
  const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch {} }, 25000);
  const cleanup = () => { clearInterval(ka); asksService.removeListener('new', onNew); asksService.removeListener('answered', onAnswered); try { res.end(); } catch {} };
  res.on('close', cleanup);
});
app.get('/api/copilot/asks/:id', (req, res) => {
  const a = asksService.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Ask not found' });
  res.json(a);
});
app.post('/api/copilot/asks/:id/answer', (req, res) => {
  try { res.json(asksService.answer(req.params.id, (req.body || {}).answer)); }
  catch (e) { res.status(e.message === 'Ask not found' ? 404 : 400).json({ error: e.message }); }
});

// ── Daily briefing (proactive digest) ──
app.get('/api/copilot/briefing/config', (req, res) => res.json(briefing.getConfig()));
app.post('/api/copilot/briefing/config', (req, res) => res.json(briefing.setConfig(req.body || {})));
app.get('/api/copilot/briefing/latest', (req, res) => res.json({ briefing: latestBriefing }));
app.post('/api/copilot/briefing/run', async (req, res) => {
  try { res.json(await runBriefing('manual')); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await taskService.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    await taskService.saveSettings(req.body);
    console.log('Settings saved');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/api/backup-metadata', async (req, res) => {
  try {
    const metadata = await taskService.getBackupMetadata();
    res.json(metadata);
  } catch (error) {
    console.error('Error reading backup metadata:', error);
    res.status(500).json({ error: 'Failed to read backup metadata' });
  }
});

app.post('/api/backup-metadata', async (req, res) => {
  try {
    await taskService.saveBackupMetadata(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving backup metadata:', error);
    res.status(500).json({ error: 'Failed to save backup metadata' });
  }
});

// ─── KB API ──────────────────────────────────────────────────────────────────

const kbModule = (() => {
  try {
    return require(path.resolve(__dirname, '..', '..', '..', '..', 'projects', 'kb-explorer', 'scripts', 'kb-module.js'));
  } catch (e) {
    console.warn('KB module not available:', e.message);
    return null;
  }
})();

let kbData = null;
function getKBData() {
  if (!kbData && kbModule) {
    kbData = kbModule.loadKBData();
  }
  return kbData;
}

// Reload KB data
app.post('/api/kb/reload', (req, res) => {
  kbData = null;
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB module not available' });
  res.json({ success: true, nodes: data.nodes.length, links: data.links.length });
});

// KB stats
app.get('/api/kb/stats', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.getKBStats(data));
});

// Get single node
app.get('/api/kb/node/:id', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  const node = kbModule.getNode(data, req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });
  res.json(node);
});

// Search nodes
app.get('/api/kb/search', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q required' });
  res.json(kbModule.searchNodes(data, q, parseInt(limit) || 20));
});

// Nodes by domain
app.get('/api/kb/domains', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.getNodesByDomain(data));
});

// Nodes by method stage
app.get('/api/kb/method-stages', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.getNodesByMethodStage(data));
});

// ─── KB Queries ──────────────────────────────────────────────────────────────

app.get('/api/kb/query/gap', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.queryGapAnalysis(data));
});

app.get('/api/kb/query/impact/:nodeId', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.queryImpactCascade(data, req.params.nodeId));
});

app.get('/api/kb/query/learning/:nodeId', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.queryLearningPath(data, req.params.nodeId));
});

app.get('/api/kb/query/delegation', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.queryDelegationReadiness(data));
});

app.get('/api/kb/query/leverage', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.queryHighestLeverage(data));
});

app.get('/api/kb/query/decay', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.queryDecayDetection(data));
});

app.get('/api/kb/query/scope/:nodeId', (req, res) => {
  const data = getKBData();
  if (!data) return res.status(500).json({ error: 'KB not loaded' });
  res.json(kbModule.queryScopeGuard(data, req.params.nodeId));
});

// ========================================
// Copilot Auth Middleware (only /api/copilot/*)
// ========================================

function bearerAuth(req, res, next) {
  if (!AUTH_TOKEN) return next(); // No token configured = open access
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === AUTH_TOKEN) return next();
  // Trust same-origin browser requests: already behind Tailscale + ETM's PIN, and
  // Sec-Fetch-Site is a forbidden header (JS can't forge 'same-origin'). This lets
  // the embedded Copilot tab (and the standalone /chat) work without a second token.
  if (req.headers['sec-fetch-site'] === 'same-origin') return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ========================================
// Pipeline Engine (always initialized — uses org API key for Claude nodes)
// ========================================

let claudeService = null;
let pipelineRunManager = null;

try {
  claudeService = new ClaudeService();
  const commandService = new CommandService();
  const fileService = new FileService();
  const pipelineEngine = new PipelineEngine(claudeService, commandService, fileService);
  pipelineRunManager = new PipelineRunManager(pipelineEngine, claudeService, PIPELINES_DIR);
  console.log('Pipeline engine initialized (org API key)');
} catch (err) {
  console.warn('Pipeline engine init failed:', err.message);
}

// ========================================
// Copilot Initialization
// ========================================

const tokenTracker = new TokenTracker(USAGE_FILE, MONTHLY_BUDGET);

let agent = null;
let copilotReady = false;

if (USE_HEADLESS) {
  // Headless mode — uses Claude Code subscription via MCP, no org API key needed
  try {
    agent = new CopilotHeadless({
      historyFile: HISTORY_FILE
    });
    copilotReady = true;
    console.log('Copilot initialized (headless mode — Claude Code subscription)');
  } catch (err) {
    console.warn('Copilot headless init failed (ETM still works):', err.message);
  }
} else {
  // Legacy mode — uses Anthropic org API key directly
  try {
    if (!claudeService) claudeService = new ClaudeService();
    const commandService = new CommandService();
    const fileService = new FileService();
    const pipelineEngine = new PipelineEngine(claudeService, commandService, fileService);

    agent = new CopilotAgent({
      historyFile: HISTORY_FILE,
      pipelinesDir: PIPELINES_DIR,
      taskService,
      pipelineEngine
    });
    copilotReady = true;
    console.log('Copilot initialized (legacy mode — org API key)');
  } catch (err) {
    console.warn('Copilot init failed (ETM still works):', err.message);
  }
}

// ========================================
// Copilot API Routes (bearer auth required)
// ========================================

app.post('/api/copilot/chat', bearerAuth, async (req, res) => {
  if (!copilotReady) return res.status(503).json({ error: 'Copilot not initialized' });

  const { message, model } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  if (tokenTracker.isOverBudget() && !USE_HEADLESS) {
    // Only hard-block on org API key (real billing). Max subscription = unlimited.
    return res.json({
      text: `Monthly budget of $${MONTHLY_BUDGET} reached. Adjust COPILOT_MONTHLY_BUDGET in .env or wait for the next month.`,
      toolCalls: [],
      inputTokens: 0,
      outputTokens: 0,
      budgetExceeded: true
    });
  }

  try {
    const result = await agent.chat(message, { model });
    tokenTracker.record(result.inputTokens, result.outputTokens);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Streaming chat (Server-Sent Events). Emits { type:'tool'|'text'|'done'|'error', ... }.
// Falls back to a single buffered turn if the active agent has no chatStream().
app.post('/api/copilot/chat/stream', bearerAuth, async (req, res) => {
  if (!copilotReady) return res.status(503).json({ error: 'Copilot not initialized' });

  const { message, model } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  // When the client disconnects mid-stream (Stop button / navigated away),
  // abort the agent so the spawned claude process is killed. Use res 'close'
  // (fires on response end / real disconnect) — NOT req 'close', which fires as
  // soon as the POST body is consumed and would abort every turn instantly.
  const ac = new AbortController();
  let finished = false;
  res.on('close', () => { if (!finished) ac.abort(); });

  if (tokenTracker.isOverBudget() && !USE_HEADLESS) {
    send({ type: 'done', text: `Monthly budget of $${MONTHLY_BUDGET} reached.`, toolCalls: [], inputTokens: 0, outputTokens: 0, budgetExceeded: true });
    return res.end();
  }

  try {
    if (typeof agent.chatStream === 'function') {
      const result = await agent.chatStream(message, { model, onEvent: send, signal: ac.signal });
      if (result && !result.error && !result.aborted) tokenTracker.record(result.inputTokens, result.outputTokens);
    } else {
      // Legacy buffered agent — replay the finished turn as stream events.
      const result = await agent.chat(message, { model });
      tokenTracker.record(result.inputTokens, result.outputTokens);
      for (const tc of (result.toolCalls || [])) send({ type: 'tool', name: tc.tool || tc.name });
      send({ type: 'done', ...result });
    }
  } catch (err) {
    console.error('Chat stream error:', err);
    send({ type: 'error', message: err.message });
  } finally {
    finished = true;
    res.end();
  }
});

app.post('/api/copilot/clear', bearerAuth, (req, res) => {
  if (!copilotReady) return res.status(503).json({ error: 'Copilot not initialized' });
  agent.clearHistory();
  res.json({ success: true });
});

app.get('/api/copilot/health', bearerAuth, (req, res) => {
  const budget = tokenTracker.getSummary();
  res.json({
    status: copilotReady ? 'ok' : 'unavailable',
    etm: true, // Always true — we ARE the ETM
    // 'subscription' = headless `claude -p` (no per-token billing; cost is notional).
    // 'org' = legacy SDK path billing ANTHROPIC_API_KEY (real $).
    mode: USE_HEADLESS ? 'subscription' : 'org',
    historyLength: agent ? agent.history.length : 0,
    budget: {
      todayCost: budget.today.cost,
      monthCost: budget.month.cost,
      monthBudget: budget.month.budget,
      budgetPct: budget.month.budgetPct
    }
  });
});

app.get('/api/copilot/budget', bearerAuth, (req, res) => {
  res.json(tokenTracker.getSummary());
});

app.get('/api/copilot/history', bearerAuth, (req, res) => {
  if (!copilotReady) return res.json({ messages: [] });
  res.json({ messages: agent.getHistory() });
});

// ========================================
// Pipeline Execution API (bearer auth required)
// ========================================

app.get('/api/pipeline/list', bearerAuth, (req, res) => {
  if (!pipelineRunManager) return res.status(503).json({ error: 'Pipeline engine not initialized' });
  try {
    const pipelines = pipelineRunManager.listPipelines();
    res.json(pipelines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pipeline/launch', bearerAuth, (req, res) => {
  if (!pipelineRunManager) return res.status(503).json({ error: 'Pipeline engine not initialized' });
  const { filename, parameters, mode } = req.body;
  if (!filename) return res.status(400).json({ error: 'No filename provided' });
  try {
    const result = pipelineRunManager.launch(filename, parameters || {}, mode);
    console.log('Pipeline launched: %s (id: %s, mode: %s)', result.pipelineName, result.id, mode === 'org' ? 'org' : 'subscription');
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/pipeline/status', bearerAuth, (req, res) => {
  if (!pipelineRunManager) return res.status(503).json({ error: 'Pipeline engine not initialized' });
  res.json(pipelineRunManager.getStatus());
});

app.post('/api/pipeline/continue', bearerAuth, async (req, res) => {
  if (!pipelineRunManager) return res.status(503).json({ error: 'Pipeline engine not initialized' });
  const { nodeId, revisionInstruction } = req.body;
  if (!nodeId) return res.status(400).json({ error: 'No nodeId provided' });
  try {
    await pipelineRunManager.continueBreakpoint(nodeId, revisionInstruction);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/pipeline/abort', bearerAuth, (req, res) => {
  if (!pipelineRunManager) return res.status(503).json({ error: 'Pipeline engine not initialized' });
  try {
    pipelineRunManager.abortRun();
    console.log('Pipeline aborted');
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========================================
// Static File Serving
// ========================================

// Copilot PWA at /chat
app.use('/chat', express.static(path.join(__dirname, 'chat')));

// ETM React app at /etm
app.use('/etm', express.static(path.join(__dirname, 'dist')));

// Root redirect
app.get('/', (req, res) => res.redirect('/etm'));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/chat')) {
    res.sendFile(path.join(__dirname, 'chat', 'index.html'));
  } else if (req.path.startsWith('/etm')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.redirect('/etm');
  }
});

// ========================================
// Start
// ========================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Eisenhower Task Manager + Copilot                     ║
║                                                        ║
║  ETM:      http://localhost:${PORT}/etm                   ║
║  Copilot:  http://localhost:${PORT}/chat                 ║
║  Data:     ${taskService.DATA_DIR.padEnd(30)}║
║  Copilot:  ${copilotReady ? 'ready' : 'unavailable (check API key)'}${' '.repeat(copilotReady ? 24 : 6)}║
║                                                        ║
║  Ready!                                                ║
╚════════════════════════════════════════════════════════╝
  `);
});
