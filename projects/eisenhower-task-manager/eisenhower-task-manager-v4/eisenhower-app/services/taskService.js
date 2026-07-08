const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BACKUP_METADATA_FILE = path.join(DATA_DIR, 'backup-metadata.json');

fs.ensureDirSync(DATA_DIR);

async function readTasks() {
  if (await fs.pathExists(TASKS_FILE)) {
    return await fs.readJson(TASKS_FILE);
  }
  return [];
}

async function writeTasks(tasks) {
  // GUARD: never overwrite tasks.json with anything but an array. A bare object
  // (e.g. a single task POSTed to /api/tasks) used to clobber every task — refuse it.
  if (!Array.isArray(tasks)) {
    throw new Error(`writeTasks refused: expected an array, got ${tasks === null ? 'null' : typeof tasks}`);
  }
  // BACKUP-BEFORE-OVERWRITE: snapshot the current file first so any bad write
  // (even a valid-but-wrong array) is locally recoverable. Best-effort + pruned.
  try {
    if (await fs.pathExists(TASKS_FILE)) {
      const backupDir = path.join(DATA_DIR, 'task-backups');
      await fs.ensureDir(backupDir);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.copy(TASKS_FILE, path.join(backupDir, `tasks-${stamp}.json`));
      const files = (await fs.readdir(backupDir)).filter(f => f.startsWith('tasks-')).sort();
      for (const old of files.slice(0, -40)) await fs.remove(path.join(backupDir, old)).catch(() => {});
    }
  } catch { /* backup is best-effort — never block a write on it */ }

  const tmpFile = TASKS_FILE + '.tmp';
  await fs.writeJson(tmpFile, tasks, { spaces: 2 });
  await renameWithRetry(tmpFile, TASKS_FILE);
}

// tasks.json lives inside the Dropbox folder, so Dropbox (and AV / the search
// indexer) intermittently hold a transient handle on it. On Windows that makes
// the atomic rename-over fail with EPERM/EBUSY/EACCES seemingly at random —
// which previously surfaced as silent "my change didn't save" write failures.
// Retry with a short backoff; the lock clears in tens of ms.
async function renameWithRetry(from, to, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      const transient = err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES';
      if (transient && i < tries - 1) {
        await new Promise(r => setTimeout(r, 60 * (i + 1))); // 60,120,...,420ms
        continue;
      }
      throw err;
    }
  }
}

async function getTasks() {
  const tasks = await readTasks();
  // Auto-migrate old category→domain+scope
  let migrated = false;
  for (const t of tasks) {
    if (t.category && !t.domain) {
      if (t.category === 'Career') { t.domain = 'Teaching'; t.scope = 'Professional'; }
      else if (t.category === 'Personal') { t.domain = 'Personal'; t.scope = 'Personal'; }
      else { t.domain = t.category; t.scope = 'Professional'; }
      delete t.category;
      migrated = true;
    }
    if (!t.scope) { t.scope = 'Professional'; migrated = true; }
  }
  if (migrated) await writeTasks(tasks);
  return tasks;
}

// Minimal shape guard so a malformed task can't be written and break a view
// (the bulk array guard in writeTasks catches wrong *containers*; this catches
// wrong *items*). Kept light on purpose — importTasks does the heavy normalizing.
function validateTask(task) {
  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    throw new Error('Task must be an object');
  }
  if (!task.task || typeof task.task !== 'string' || !task.task.trim()) {
    throw new Error('Task must have a non-empty "task" name');
  }
}

async function addTask(task) {
  validateTask(task);
  const tasks = await readTasks();
  if (!task.id) {
    task.id = String(Date.now());
  }
  tasks.push(task);
  await writeTasks(tasks);
  return task;
}

async function updateTask(id, fields) {
  const tasks = await readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Task not found');
  }
  tasks[index] = { ...tasks[index], ...fields };
  await writeTasks(tasks);
  return tasks[index];
}

// SOFT delete: mark the task with a `deletedAt` tombstone instead of removing
// it. This matches the UI (App.jsx deleteTask) so an agent/API delete is just
// as recoverable as a click delete — restoreTask undoes it, the views filter
// out tombstones (liveTasks), and the UI reclaims trash after a 24h grace
// window. For a genuine permanent removal use purgeTask. Idempotent.
async function deleteTask(id) {
  const tasks = await readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Task not found');
  }
  if (tasks[index].deletedAt) {
    return tasks[index]; // already in trash — no-op
  }
  tasks[index] = { ...tasks[index], deletedAt: new Date().toISOString() };
  await writeTasks(tasks);
  return tasks[index];
}

// Undo a soft delete: clear the tombstone.
async function restoreTask(id) {
  const tasks = await readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Task not found');
  }
  const { deletedAt, ...rest } = tasks[index];
  tasks[index] = rest;
  await writeTasks(tasks);
  return tasks[index];
}

// PERMANENT removal — bypasses the trash. Irreversible (recoverable only via
// the tasks.json backups in task-backups/). Use deleteTask for normal deletes.
async function purgeTask(id) {
  const tasks = await readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Task not found');
  }
  const removed = tasks.splice(index, 1)[0];
  await writeTasks(tasks);
  return removed;
}

async function getSettings() {
  if (await fs.pathExists(SETTINGS_FILE)) {
    return await fs.readJson(SETTINGS_FILE);
  }
  return null;
}

async function saveSettings(settings) {
  await fs.writeJson(SETTINGS_FILE, settings, { spaces: 2 });
}

async function getBackupMetadata() {
  if (await fs.pathExists(BACKUP_METADATA_FILE)) {
    return await fs.readJson(BACKUP_METADATA_FILE);
  }
  return null;
}

async function saveBackupMetadata(metadata) {
  await fs.writeJson(BACKUP_METADATA_FILE, metadata, { spaces: 2 });
}

/**
 * Import tasks with validation, normalization, and duplicate detection.
 * Accepts flexible field names (urgent/isUrgent, necessary/isNecessary, etc.)
 * Returns { added: [], skipped: [], errors: [] }
 */
async function importTasks(incoming) {
  if (!Array.isArray(incoming)) {
    throw new Error('importTasks expects an array');
  }

  const existing = await readTasks();
  const existingIds = new Set(existing.map(t => String(t.id)));
  const existingNames = new Set(existing.map(t => t.task.toLowerCase().trim()));

  const today = new Date().toISOString().split('T')[0];
  const added = [];
  const skipped = [];
  const errors = [];

  for (let i = 0; i < incoming.length; i++) {
    const raw = incoming[i];
    try {
      if (!raw.task || typeof raw.task !== 'string') {
        errors.push({ index: i, reason: 'Missing or invalid task name' });
        continue;
      }

      const nameKey = raw.task.toLowerCase().trim();

      // Duplicate check: skip if name matches an existing task
      if (existingNames.has(nameKey)) {
        skipped.push({ task: raw.task, reason: 'duplicate name' });
        continue;
      }

      // Duplicate check: skip if ID matches
      const id = raw.id ? String(raw.id) : String(Date.now() + i);
      if (existingIds.has(id)) {
        skipped.push({ task: raw.task, reason: 'duplicate id' });
        continue;
      }

      // Normalize field names
      const isUrgent = raw.isUrgent ?? raw.urgent ?? false;
      const isNecessary = raw.isNecessary ?? raw.necessary ?? true;
      const percentComplete = raw.percentComplete ?? raw.completionPercentage ?? 0;
      const isCompleted = raw.status === 'completed' || percentComplete === 100;

      // Migration: map old category field to domain + scope
      let domain = raw.domain || raw.category || 'Teaching';
      let scope = raw.scope || 'Professional';
      if (!raw.domain && raw.category) {
        if (raw.category === 'Career') { domain = 'Teaching'; scope = 'Professional'; }
        else if (raw.category === 'Personal') { domain = 'Personal'; scope = 'Personal'; }
        else { domain = raw.category; }
      }

      const task = {
        id,
        task: raw.task,
        domain,
        scope,
        subcategory: raw.subcategory || '',
        isUrgent: !!isUrgent,
        isNecessary: !!isNecessary,
        rank: raw.rank ?? 2,
        assignedDate: raw.assignedDate || today,
        dueDate: raw.dueDate || null,
        completedDate: isCompleted ? (raw.completedDate || today) : null,
        percentComplete: isCompleted ? 100 : (percentComplete || 0),
        isRecurring: raw.isRecurring ?? false,
        recurringPattern: raw.recurringPattern || 'once',
        notes: raw.notes || '',
        qualityRating: raw.qualityRating ?? null,
        easeRating: raw.easeRating ?? null,
        timeEstimateValue: raw.timeEstimateValue || 0,
        timeEstimateUnit: raw.timeEstimateUnit || 'hours'
      };

      existing.push(task);
      existingIds.add(id);
      existingNames.add(nameKey);
      added.push({ id, task: raw.task });
    } catch (err) {
      errors.push({ index: i, task: raw.task, reason: err.message });
    }
  }

  if (added.length > 0) {
    await writeTasks(existing);
  }

  return { added, skipped, errors, total: existing.length };
}

module.exports = {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  restoreTask,
  purgeTask,
  validateTask,
  importTasks,
  getSettings,
  saveSettings,
  getBackupMetadata,
  saveBackupMetadata,
  readTasks,
  writeTasks,
  DATA_DIR,
  TASKS_FILE
};
