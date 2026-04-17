require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { ClaudeService } = require('./services/claudeService');
const { AgentExecutionService } = require('./services/agentExecutionService');
const { ForumService } = require('./services/forumService');

// ─── Config ──────────────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.resolve(PROJECT_ROOT, '..', '..', '..', 'Agents');
const SAVES_DIR = path.resolve(PROJECT_ROOT, 'saves');
const SAVE_PATH = path.join(SAVES_DIR, 'save.json');

const AGENT_FOLDERS = {
  CE: 'CE Agent',
  CD: 'CD Agent',
  PM: 'PM Agent',
  RA: 'RA Agent',
  SA: 'SA Agent',
  TA: 'TA Agent'
};

// ─── Agent File Service ──────────────────────────────────────────────────────
let fileWatcher = null;

function getDirectivesPath(agentTypeId) {
  const folder = AGENT_FOLDERS[agentTypeId];
  if (!folder) throw new Error(`Unknown agent type: ${agentTypeId}`);
  return path.join(AGENTS_DIR, folder, 'DIRECTIVES.md');
}

function readDirectives(agentTypeId) {
  const filePath = getDirectivesPath(agentTypeId);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content, path: filePath };
  } catch (err) {
    return { success: false, error: err.message, path: filePath };
  }
}

function readAllDirectives() {
  const results = {};
  for (const typeId of Object.keys(AGENT_FOLDERS)) {
    results[typeId] = readDirectives(typeId);
  }
  return results;
}

function writeDirectives(agentTypeId, content) {
  const filePath = getDirectivesPath(agentTypeId);
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function startWatching(callback) {
  let chokidar;
  try {
    chokidar = require('chokidar');
  } catch (e) {
    console.warn('chokidar not available, file watching disabled');
    return;
  }

  const watchPaths = Object.keys(AGENT_FOLDERS).map(typeId => getDirectivesPath(typeId));

  fileWatcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 }
  });

  fileWatcher.on('change', (filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    for (const [typeId, folder] of Object.entries(AGENT_FOLDERS)) {
      if (normalizedPath.includes(folder)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          callback(typeId, content);
        } catch (err) {
          console.error(`Error reading changed file ${filePath}:`, err);
        }
        break;
      }
    }
  });
}

function stopWatching() {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
}

// ─── Save Service ────────────────────────────────────────────────────────────
function loadSave() {
  try {
    if (!fs.existsSync(SAVE_PATH)) return { success: true, data: null };
    const raw = fs.readFileSync(SAVE_PATH, 'utf-8');
    return { success: true, data: JSON.parse(raw) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveSave(data) {
  try {
    if (!fs.existsSync(SAVES_DIR)) fs.mkdirSync(SAVES_DIR, { recursive: true });
    const payload = { ...data, savedAt: new Date().toISOString() };
    fs.writeFileSync(SAVE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Claude Chat Service ────────────────────────────────────────────────────
const claudeService = new ClaudeService();

// ─── Agent Execution Service ────────────────────────────────────────────────
const executionService = new AgentExecutionService();

// ─── Forum Service ──────────────────────────────────────────────────────────
const forumService = new ForumService();
const ROSTER_PATH = path.resolve(PROJECT_ROOT, '..', 'assembly_of_greatest_minds.md');

function buildWorkloadSummary() {
  const all = readAllDirectives();
  const workload = {};

  for (const [typeId, result] of Object.entries(all)) {
    const entry = { mood: 'idle', tasks: [] };

    if (result.success && result.content) {
      const lines = result.content.split('\n');
      for (const line of lines) {
        // Match active task headers like "### P1: Fix Something — Project"
        const taskMatch = line.match(/^### P\d: (.+)/);
        if (taskMatch && !line.startsWith('### ~~')) {
          entry.tasks.push(taskMatch[1]);
        }
        // Detect mood from status lines
        if (line.includes('**Status:** Blocked')) entry.mood = 'blocked';
        else if (line.includes('**Status:** In Progress') && entry.mood !== 'blocked') entry.mood = 'working';
        else if (line.includes('**Status:** Not Started') && entry.mood === 'idle') entry.mood = 'idle';
      }
      if (entry.tasks.length > 0 && entry.mood === 'idle') entry.mood = 'working';
    }

    workload[typeId] = entry;
  }

  return workload;
}

function insertTaskIntoDirectives(markdown, task) {
  const lines = markdown.split('\n');
  let insertIndex = -1;

  // Find "## Active Tasks" or "## Active Directives"
  for (let i = 0; i < lines.length; i++) {
    if (/^## Active (Tasks|Directives)/.test(lines[i])) {
      // Find the first task header or next section after this
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('### ')) {
          insertIndex = j;
          break;
        }
        if (lines[j].startsWith('## ') && j > i) {
          insertIndex = j;
          break;
        }
      }
      if (insertIndex === -1) insertIndex = i + 2; // after heading + blank line

      // Remove "No active tasks" placeholder if present
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        if (/no active (tasks|directives)/i.test(lines[j])) {
          lines.splice(j, 1);
          if (insertIndex > j) insertIndex--;
          break;
        }
      }
      break;
    }
  }

  if (insertIndex === -1) return markdown; // couldn't find section

  const priority = task.priority || 'P2';
  const title = task.title || 'Untitled Task';
  const project = task.project ? ` — ${task.project}` : '';
  const context = task.context || 'Assigned via Campus Chatter.';

  const block = [
    `### ${priority}: ${title}${project}`,
    '',
    `- **Status:** Not Started`,
    `- **Context:** ${context}`,
    '',
    '---',
    ''
  ];

  lines.splice(insertIndex, 0, ...block);

  // Update timestamp
  const now = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('**Last updated:**')) {
      lines[i] = `> **Last updated:** ${now} by Player (via chat)`;
      break;
    }
  }

  return lines.join('\n');
}

// ─── Window ──────────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Agent World',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ─── IPC ─────────────────────────────────────────────────────────────────────
function setupIPC() {
  ipcMain.handle('agent:readDirectives', (event, agentTypeId) => readDirectives(agentTypeId));
  ipcMain.handle('agent:readAllDirectives', () => readAllDirectives());
  ipcMain.handle('agent:writeDirectives', (event, agentTypeId, content) => writeDirectives(agentTypeId, content));
  ipcMain.handle('agent:getAgentsDir', () => AGENTS_DIR);
  ipcMain.handle('save:load', () => loadSave());
  ipcMain.handle('save:save', (event, data) => saveSave(data));

  // Player chat → Claude
  ipcMain.handle('chat:send', async (event, message) => {
    try {
      const workload = buildWorkloadSummary();
      const result = await claudeService.chat(message, workload);

      if (result.error) return result;

      // Insert any assigned tasks into DIRECTIVES.md files
      if (result.tasks && result.tasks.length > 0) {
        for (const task of result.tasks) {
          const agentId = task.agent;
          if (!AGENT_FOLDERS[agentId]) continue;

          const dirResult = readDirectives(agentId);
          if (!dirResult.success) continue;

          const updated = insertTaskIntoDirectives(dirResult.content, task);
          writeDirectives(agentId, updated);
        }
      }

      return result;
    } catch (err) {
      return { error: `Chat failed: ${err.message}` };
    }
  });

  // Deep Talk — Agent execution via Claude CLI
  ipcMain.handle('deepTalk:start', (event, agentTypeId, prompt) => {
    executionService.startSession(
      agentTypeId,
      prompt,
      (evt) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('deepTalk:event', { agentTypeId, event: evt });
        }
      },
      (exitCode) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('deepTalk:exit', { agentTypeId, exitCode });
        }
      }
    );
    return { success: true };
  });

  ipcMain.handle('deepTalk:resume', (event, agentTypeId, message) => {
    executionService.resumeSession(
      agentTypeId,
      message,
      (evt) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('deepTalk:event', { agentTypeId, event: evt });
        }
      },
      (exitCode) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('deepTalk:exit', { agentTypeId, exitCode });
        }
      }
    );
    return { success: true };
  });

  ipcMain.handle('deepTalk:stop', (event, agentTypeId) => {
    executionService.stopSession(agentTypeId);
    return { success: true };
  });

  ipcMain.handle('deepTalk:status', (event, agentTypeId) => {
    return executionService.getSessionInfo(agentTypeId);
  });

  // Forum debate
  ipcMain.handle('forum:loadRoster', () => forumService.loadRoster(ROSTER_PATH));
  ipcMain.handle('forum:startDebate', async (event, topic, thinkerIds, allowGuests) => {
    // Lazy-load roster on first debate
    if (!forumService.rosterData) {
      forumService.loadRoster(ROSTER_PATH);
    }
    return forumService.debate(topic, thinkerIds, allowGuests);
  });
  ipcMain.handle('forum:followUp', async (event, message) => {
    return forumService.followUp(message);
  });
  ipcMain.handle('forum:stop', () => {
    forumService.stop();
    return { success: true };
  });

  startWatching((agentTypeId, content) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:directivesChanged', { agentTypeId, content });
    }
  });
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  setupIPC();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  executionService.stopAll();
  stopWatching();
  if (process.platform !== 'darwin') app.quit();
});
