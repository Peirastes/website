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
  const tmpFile = TASKS_FILE + '.tmp';
  await fs.writeJson(tmpFile, tasks, { spaces: 2 });
  await fs.rename(tmpFile, TASKS_FILE);
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

async function addTask(task) {
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

async function deleteTask(id) {
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
