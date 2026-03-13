import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BACKUP_METADATA_FILE = path.join(DATA_DIR, 'backup-metadata.json');

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Helper: read-modify-write with atomic rename to prevent corruption
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

console.log('Data directory:', DATA_DIR);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (await fs.pathExists(TASKS_FILE)) {
      const tasks = await fs.readJson(TASKS_FILE);
      res.json(tasks);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading tasks:', error);
    res.status(500).json({ error: 'Failed to read tasks' });
  }
});

// Save all tasks (bulk — used by app UI)
app.post('/api/tasks', async (req, res) => {
  try {
    await writeTasks(req.body);
    console.log('Tasks saved (%d items)', req.body.length);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
  }
});

// Get single task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
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

// Add a single task
app.post('/api/tasks/add', async (req, res) => {
  try {
    const tasks = await readTasks();
    const newTask = req.body;
    if (!newTask.id) {
      newTask.id = String(Date.now());
    }
    tasks.push(newTask);
    await writeTasks(tasks);
    console.log('Task added: %s', newTask.task);
    res.json(newTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// Update a single task (partial update)
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    tasks[index] = { ...tasks[index], ...req.body };
    await writeTasks(tasks);
    console.log('Task updated: %s', tasks[index].task);
    res.json(tasks[index]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a single task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const removed = tasks.splice(index, 1)[0];
    await writeTasks(tasks);
    console.log('Task deleted: %s', removed.task);
    res.json({ success: true, deleted: removed });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    if (await fs.pathExists(SETTINGS_FILE)) {
      const settings = await fs.readJson(SETTINGS_FILE);
      res.json(settings);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Save settings
app.post('/api/settings', async (req, res) => {
  try {
    await fs.writeJson(SETTINGS_FILE, req.body, { spaces: 2 });
    console.log('✅ Settings saved');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Get backup metadata
app.get('/api/backup-metadata', async (req, res) => {
  try {
    if (await fs.pathExists(BACKUP_METADATA_FILE)) {
      const metadata = await fs.readJson(BACKUP_METADATA_FILE);
      res.json(metadata);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error reading backup metadata:', error);
    res.status(500).json({ error: 'Failed to read backup metadata' });
  }
});

// Save backup metadata
app.post('/api/backup-metadata', async (req, res) => {
  try {
    await fs.writeJson(BACKUP_METADATA_FILE, req.body, { spaces: 2 });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving backup metadata:', error);
    res.status(500).json({ error: 'Failed to save backup metadata' });
  }
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🚀 Eisenhower Task Manager API                        ║
║                                                        ║
║  📡 Server:  http://localhost:${PORT}                    ║
║  📁 Data:    ${DATA_DIR.padEnd(30)}║
║                                                        ║
║  Ready to save your tasks! 📝                          ║
╚════════════════════════════════════════════════════════╝
  `);
});
