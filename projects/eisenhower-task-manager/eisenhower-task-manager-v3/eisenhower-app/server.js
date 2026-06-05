require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Shared task data layer
const taskService = require('./services/taskService');

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
const PORT = 3001;

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
  try {
    await taskService.writeTasks(req.body);
    console.log('Tasks saved (%d items)', req.body.length);
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
    const removed = await taskService.deleteTask(req.params.id);
    console.log('Task deleted: %s', removed.task);
    res.json({ success: true, deleted: removed });
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.post('/api/tasks/import', bearerAuth, async (req, res) => {
  try {
    const tasks = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ error: 'Expected an array of tasks' });
    const result = await taskService.importTasks(tasks);
    console.log('Tasks imported: %d added, %d skipped, %d errors', result.added.length, result.skipped.length, result.errors.length);
    res.json(result);
  } catch (error) {
    console.error('Error importing tasks:', error);
    res.status(500).json({ error: 'Failed to import tasks' });
  }
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

  const { message } = req.body;
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
    const result = await agent.chat(message);
    tokenTracker.record(result.inputTokens, result.outputTokens);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
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
  const { filename, parameters } = req.body;
  if (!filename) return res.status(400).json({ error: 'No filename provided' });
  try {
    const result = pipelineRunManager.launch(filename, parameters || {});
    console.log('Pipeline launched: %s (id: %s)', result.pipelineName, result.id);
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
