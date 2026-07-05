const fs = require('fs-extra');
const path = require('path');
const taskService = require('./taskService');

// Projects = first-class containers that group tasks toward a goal, with rolled-up
// progress computed from their tasks. A task belongs to a project via task.projectId
// (optional — unassigned tasks are fine). Stored in data/projects.json with the same
// backup-before-overwrite + atomic-write-with-retry safety as tasks.
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const BACKUP_DIR = path.join(DATA_DIR, 'project-backups');
const STATUSES = ['active', 'paused', 'done', 'archived'];
const PALETTE = ['#7dd6ff', '#ffae20', '#79e08a', '#c08cff', '#ff8c7d', '#5ad0c0', '#f0c060', '#9aa7ff'];

fs.ensureDirSync(DATA_DIR);

function read() {
  try { const a = fs.readJsonSync(PROJECTS_FILE); return Array.isArray(a) ? a : []; }
  catch { return []; }
}

async function write(projects) {
  if (!Array.isArray(projects)) throw new Error('projects must be an array');
  try {
    if (await fs.pathExists(PROJECTS_FILE)) {
      await fs.ensureDir(BACKUP_DIR);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.copy(PROJECTS_FILE, path.join(BACKUP_DIR, `projects-${stamp}.json`));
      const files = (await fs.readdir(BACKUP_DIR)).filter(f => f.startsWith('projects-')).sort();
      for (const old of files.slice(0, -20)) await fs.remove(path.join(BACKUP_DIR, old)).catch(() => {});
    }
  } catch { /* backup best-effort */ }
  const tmp = PROJECTS_FILE + '.tmp';
  await fs.writeJson(tmp, projects, { spaces: 2 });
  for (let i = 0; i < 8; i++) {
    try { await fs.rename(tmp, PROJECTS_FILE); return; }
    catch (e) {
      if (['EPERM', 'EBUSY', 'EACCES'].includes(e.code) && i < 7) { await new Promise(r => setTimeout(r, 60 * (i + 1))); continue; }
      throw e;
    }
  }
}

function list() { return read(); }
function get(id) { return read().find(p => p.id === id) || null; }

async function create({ name, description, status, dueDate, color, type, url, portfolioId, manualPercent, tracked }) {
  if (!name || !String(name).trim()) throw new Error('Project name required');
  const projects = read();
  const project = {
    // random suffix so a tight batch-import loop (same ms) can't collide on id
    id: 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
    name: String(name).trim().slice(0, 120),
    description: description ? String(description).slice(0, 1000) : '',
    status: STATUSES.includes(status) ? status : 'active',
    dueDate: dueDate || null,
    color: color || PALETTE[projects.length % PALETTE.length],
    // portfolio mirror metadata (optional) — type/url/portfolioId link an ETM
    // project back to its peirastes.com entry; manualPercent gives task-less
    // portfolio projects a real, sortable completion % (0–100, or null = unset).
    type: type || null,
    url: url || null,
    portfolioId: portfolioId || null,
    manualPercent: (typeof manualPercent === 'number') ? Math.max(0, Math.min(100, Math.round(manualPercent))) : null,
    // "tracked" = an explicit quest the user is following. A project shows in the
    // Projects list when it's tracked OR has linked tasks (task-bearing ones are
    // tracked implicitly).
    tracked: tracked === true,
    createdAt: new Date().toISOString()
  };
  projects.push(project);
  await write(projects);
  return project;
}

async function update(id, fields) {
  const projects = read();
  const i = projects.findIndex(p => p.id === id);
  if (i === -1) throw new Error('Project not found');
  const allowed = {};
  if (fields.name !== undefined) allowed.name = String(fields.name).trim().slice(0, 120);
  if (fields.description !== undefined) allowed.description = String(fields.description).slice(0, 1000);
  if (fields.status !== undefined && STATUSES.includes(fields.status)) allowed.status = fields.status;
  if (fields.dueDate !== undefined) allowed.dueDate = fields.dueDate || null;
  if (fields.color !== undefined) allowed.color = fields.color;
  if (fields.type !== undefined) allowed.type = fields.type || null;
  if (fields.url !== undefined) allowed.url = fields.url || null;
  if (fields.manualPercent !== undefined) allowed.manualPercent = (fields.manualPercent === null) ? null : Math.max(0, Math.min(100, Math.round(Number(fields.manualPercent))));
  if (fields.tracked !== undefined) allowed.tracked = !!fields.tracked;
  projects[i] = { ...projects[i], ...allowed };
  await write(projects);
  return projects[i];
}

async function remove(id) {
  const projects = read();
  const i = projects.findIndex(p => p.id === id);
  if (i === -1) throw new Error('Project not found');
  const removed = projects.splice(i, 1)[0];
  await write(projects);
  // unlink tasks from the deleted project (best-effort)
  try {
    const tasks = await taskService.readTasks();
    let changed = false;
    for (const t of tasks) if (t.projectId === id) { delete t.projectId; changed = true; }
    if (changed) await taskService.writeTasks(tasks);
  } catch {}
  return removed;
}

// Rolled-up progress for a project from its tasks. Accepts a project object or
// an id (back-compat). When a project has NO tasks (e.g. a mirrored portfolio
// entry), percent falls back to its manualPercent, else to its status
// (done → 100, otherwise null = "unset / in progress").
function progressFor(projectOrId, tasks) {
  const project = (projectOrId && typeof projectOrId === 'object') ? projectOrId : get(projectOrId);
  const id = project ? project.id : projectOrId;
  const today = new Date().toLocaleDateString('en-CA');
  const mine = tasks.filter(t => !t.deletedAt && t.projectId === id);
  const done = mine.filter(t => (t.percentComplete || 0) >= 100 || t.completedDate);
  const open = mine.filter(t => !done.includes(t));
  const overdue = open.filter(t => t.dueDate && t.dueDate < today);
  const nextDue = open.filter(t => t.dueDate).map(t => t.dueDate).sort()[0] || null;
  let percent, source;
  if (mine.length) {
    percent = Math.round(mine.reduce((s, t) => s + (t.completedDate ? 100 : (t.percentComplete || 0)), 0) / mine.length);
    source = 'tasks';
  } else if (project && typeof project.manualPercent === 'number') {
    percent = project.manualPercent; source = 'manual';
  } else if (project && project.status === 'done') {
    percent = 100; source = 'status';
  } else {
    percent = null; source = 'unset';
  }
  return { total: mine.length, done: done.length, open: open.length, overdue: overdue.length, percent, source, nextDue };
}

async function listWithProgress() {
  const tasks = await taskService.readTasks();
  return read().map(p => ({ ...p, progress: progressFor(p, tasks) }));
}

async function getWithTasks(id) {
  const project = get(id);
  if (!project) return null;
  const tasks = await taskService.readTasks();
  const mine = tasks.filter(t => !t.deletedAt && t.projectId === id);
  return { ...project, progress: progressFor(project, tasks), tasks: mine };
}

module.exports = { list, get, create, update, remove, listWithProgress, getWithTasks, progressFor, STATUSES };
