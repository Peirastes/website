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

console.log('📁 Data directory:', DATA_DIR);

// Get tasks
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

// Save tasks
app.post('/api/tasks', async (req, res) => {
  try {
    await fs.writeJson(TASKS_FILE, req.body, { spaces: 2 });
    console.log('✅ Tasks saved');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
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
