const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ─── Config ──────────────────────────────────────────────────────────────────
const KB_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'Agents', 'RA Agent', 'knowledge-base');
const DOMAINS_DIR = path.join(KB_DIR, 'domains');
const AI_KB_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'Agents', 'knowledge-base');
const AI_AGENTS_DIR = path.join(AI_KB_DIR, 'agents');
const AI_SHARED_DIR = path.join(AI_KB_DIR, 'shared');

const DOMAIN_FILES = [
  'epistemology_and_method.md',
  'ecdo_theory.md',
  'thermofluidic_finance.md',
  'dynamical_systems.md',
  'physics_content.md',
  'pedagogy_and_assessment.md',
  'archaeoastronomy.md'
];

const AGENT_FILES = [
  'ce_agent.md',
  'cd_agent.md',
  'pm_agent.md',
  'ra_agent.md',
  'sa_agent.md',
  'ta_agent.md'
];

// ─── File Reading ────────────────────────────────────────────────────────────
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err.message);
    return null;
  }
}

function readAllKB() {
  const foundation = readFile(path.join(KB_DIR, 'FOUNDATION.md'));
  const tesIndex = readFile(path.join(KB_DIR, 'TES_INDEX.md'));
  const domains = {};
  for (const file of DOMAIN_FILES) {
    const name = file.replace('.md', '');
    domains[name] = readFile(path.join(DOMAINS_DIR, file));
  }
  return { foundation, tesIndex, domains };
}

function readAllAIKB() {
  const agents = {};
  for (const file of AGENT_FILES) {
    const name = file.replace('.md', '');
    agents[name] = readFile(path.join(AI_AGENTS_DIR, file));
  }
  const tools = readFile(path.join(AI_SHARED_DIR, 'tools.md'));
  const interfaces = readFile(path.join(AI_SHARED_DIR, 'interfaces.md'));
  const humanSkills = readFile(path.join(AI_KB_DIR, 'human', 'skills.md'));
  return { agents, tools, interfaces, humanSkills };
}

// ─── Electron App ────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Knowledge Base Explorer',
    backgroundColor: '#0c0e18',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.handle('kb:readAll', () => readAllKB());
ipcMain.handle('kb:readAllAI', () => readAllAIKB());

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
