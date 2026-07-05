const fs = require('fs');
const path = require('path');
const taskService = require('./taskService');

// Proactive daily briefing: a digest of the day computed from task data and pushed
// to the phone on a schedule (and on demand). Deterministic + cheap (no agent run);
// tapping the push opens the Copilot to act. Config persisted.
const CONFIG_FILE = path.join(__dirname, '..', 'data', 'copilot-briefing.json');
// mode: 'agent' = the Copilot synthesizes a natural-language briefing; 'templated'
// = a deterministic digest from task data (fast fallback, no agent run).
const DEFAULT_CONFIG = { enabled: false, time: '07:00', mode: 'agent', detailLevel: 'standard', instructions: '', lastRunDate: null };

const DETAIL_GUIDANCE = {
  brief: 'Keep it VERY short — 3-4 bullets max, only the most pressing items.',
  standard: 'Keep it scannable for a phone — a one-line summary, then tight bullets.',
  detailed: 'Be thorough — cover everything noteworthy, with brief context and your reasoning.'
};

// Prompt for the agent-generated briefing (mode 'agent'). Read-only, no questions.
function briefingPrompt() {
  const cfg = getConfig();
  let p = `Generate Cole's daily briefing. Use the get_tasks tool to read his current tasks, then write a briefing for a phone screen covering:
- what's due today, and what's overdue (note how stale the worst ones are)
- what's quietly slipping (important but not urgent, untouched)
- your recommendation: what he should focus on FIRST and why
Name the actual tasks; be direct and specific.
${DETAIL_GUIDANCE[cfg.detailLevel] || DETAIL_GUIDANCE.standard}
Output ONLY the briefing itself — NO preamble or meta ("here's your briefing", "writing the briefing", "got what I need"). Your VERY FIRST line is the one-line summary, then tight bullets.
IMPORTANT: this runs UNATTENDED — do NOT ask any questions, do NOT use ask_cole, and do NOT modify anything (read-only).`;
  if (cfg.instructions && cfg.instructions.trim()) {
    p += `\n\nCole's custom instructions for HIS briefing — follow these (they override the defaults above where they conflict):\n${cfg.instructions.trim()}`;
  }
  return p;
}

function getConfig() {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) }; }
  catch { return { ...DEFAULT_CONFIG }; }
}
function saveConfig(cfg) {
  try { fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true }); fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8'); } catch {}
}
function setConfig({ enabled, time, mode, detailLevel, instructions }) {
  const cfg = getConfig();
  if (enabled !== undefined) cfg.enabled = !!enabled;
  if (time !== undefined && /^\d{2}:\d{2}$/.test(time)) cfg.time = time;
  if (mode === 'agent' || mode === 'templated') cfg.mode = mode;
  if (['brief', 'standard', 'detailed'].includes(detailLevel)) cfg.detailLevel = detailLevel;
  if (instructions !== undefined) cfg.instructions = String(instructions).slice(0, 1000);
  saveConfig(cfg);
  return cfg;
}

// Returns true (and stamps lastRunDate) if the briefing is due right now.
function shouldFire(now) {
  const cfg = getConfig();
  if (!cfg.enabled) return false;
  const hhmm = now.toTimeString().slice(0, 5);     // local HH:MM
  const today = now.toLocaleDateString('en-CA');    // local YYYY-MM-DD
  if (hhmm !== cfg.time) return false;
  if (cfg.lastRunDate === today) return false;       // already ran today
  cfg.lastRunDate = today;
  saveConfig(cfg);
  return true;
}

async function computeDigest() {
  const all = await taskService.getTasks();
  const tasks = all.filter(t => !t.deletedAt);
  const today = new Date().toLocaleDateString('en-CA');
  const open = tasks.filter(t => (t.percentComplete || 0) < 100 && !t.completedDate);
  const overdue = open.filter(t => t.dueDate && t.dueDate < today);
  const dueToday = open.filter(t => t.dueDate === today);
  const q1 = open.filter(t => t.isUrgent && t.isNecessary);

  const body = `${dueToday.length} due today · ${overdue.length} overdue · ${q1.length} do-first`;
  const cap = { brief: 4, standard: 7, detailed: 14 }[getConfig().detailLevel] || 7;
  const seen = new Set();
  const top = [];
  for (const t of [...overdue, ...dueToday, ...q1]) {
    if (seen.has(t.id)) continue; seen.add(t.id);
    const tag = (t.dueDate && t.dueDate < today) ? 'OVERDUE' : (t.dueDate === today ? 'today' : 'Q1');
    top.push(`• [${tag}] ${t.task}`);
    if (top.length >= cap) break;
  }
  const detail = top.length ? top.join('\n') : 'Nothing pressing — clear runway. ☕';
  return {
    title: '☀ Morning briefing',
    body,
    detail,
    counts: { dueToday: dueToday.length, overdue: overdue.length, q1: q1.length, open: open.length },
    generatedAt: new Date().toISOString()
  };
}

module.exports = { getConfig, setConfig, shouldFire, computeDigest, briefingPrompt };
