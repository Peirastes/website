#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// ===== CONFIG =====
const DROPBOX_ROOT = 'C:\\Users\\Cole\\Dropbox';
const ETM_BASE = 'http://localhost:3001/api';

// ===== PATH SECURITY =====
function safePath(relativePath) {
  const cleaned = relativePath.replace(/\.\./g, '').replace(/^[/\\]+/, '');
  const resolved = path.resolve(DROPBOX_ROOT, cleaned);
  if (!resolved.startsWith(DROPBOX_ROOT)) {
    throw new Error('Access denied: path outside Dropbox');
  }
  return resolved;
}

// ===== ETM FETCH =====
async function etmFetch(endpoint, opts = {}) {
  const url = `${ETM_BASE}${endpoint}`;
  const resp = await fetch(url, {
    // Tag every mutation as agent-sourced so the task audit log can attribute it.
    headers: { 'Content-Type': 'application/json', 'X-ETM-Source': 'agent', ...opts.headers },
    ...opts
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`ETM ${resp.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

// ===== SHELL EXEC =====
function execShell(command, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, [], {
      cwd: cwd || DROPBOX_ROOT,
      shell: true,
      timeout: 60000,
      env: { ...process.env }
    });

    let stdout = '', stderr = '';
    proc.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 50000) { proc.kill(); stdout = stdout.slice(0, 50000) + '\n...[truncated]'; }
    });
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 10000) stderr = stderr.slice(0, 10000) + '\n...[truncated]';
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      resolve({ exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

// ===== PIPELINES DIR =====
const PIPELINES_DIR = path.join(DROPBOX_ROOT, 'Website', 'projects', 'agent-pipeline-ide', 'pipelines');

// ===== MCP SERVER =====
const server = new McpServer({
  name: 'peirastes-tools',
  version: '1.0.0'
});

// ────────────────────────────────────────
// ETM TOOLS
// ────────────────────────────────────────

server.tool('get_tasks', 'Get tasks from the Eisenhower Task Manager. Excludes trashed (soft-deleted) tasks by default; set include_deleted to also list the trash.', {
  include_deleted: z.boolean().optional().default(false).describe('Include soft-deleted (trashed) tasks in the result')
}, async (input) => {
  const tasks = await etmFetch('/tasks');
  const list = Array.isArray(tasks) ? tasks : [];
  const filtered = input.include_deleted ? list : list.filter(t => !t.deletedAt);
  return { content: [{ type: 'text', text: JSON.stringify(filtered) }] };
});

server.tool('add_task', 'Add a new task to the Eisenhower Task Manager', {
  task: z.string().describe('Task name/description'),
  domain: z.enum(['Teaching', 'Projects', 'Personal']).describe('Task domain'),
  scope: z.enum(['Professional', 'Personal']).describe('Professional or Personal scope'),
  subcategory: z.string().optional().default('').describe('Subcategory within domain'),
  isUrgent: z.boolean(),
  isNecessary: z.boolean(),
  rank: z.number().min(1).max(3).optional().default(2).describe('1=high, 2=medium, 3=low'),
  dueDate: z.string().optional().default('').describe('YYYY-MM-DD or empty'),
  notes: z.string().optional().default(''),
  isRecurring: z.boolean().optional().default(false),
  recurringPattern: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']).optional().default('once'),
  timeEstimateValue: z.number().optional().default(0),
  timeEstimateUnit: z.enum(['hours', 'days']).optional().default('hours')
}, async (input) => {
  const today = new Date().toISOString().split('T')[0];
  const task = {
    id: String(Date.now()),
    task: input.task,
    domain: input.domain,
    scope: input.scope,
    subcategory: input.subcategory,
    isUrgent: input.isUrgent,
    isNecessary: input.isNecessary,
    rank: input.rank,
    assignedDate: today,
    dueDate: input.dueDate,
    completedDate: null,
    percentComplete: 0,
    isRecurring: input.isRecurring,
    recurringPattern: input.recurringPattern,
    notes: input.notes,
    qualityRating: null,
    easeRating: null,
    timeEstimateValue: input.timeEstimateValue,
    timeEstimateUnit: input.timeEstimateUnit
  };
  const result = await etmFetch('/tasks/add', { method: 'POST', body: JSON.stringify(task) });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('update_task', 'Update fields on an existing task', {
  id: z.string().describe('Task ID'),
  fields: z.record(z.any()).describe('Partial fields to update')
}, async (input) => {
  const result = await etmFetch(`/tasks/${input.id}`, { method: 'PATCH', body: JSON.stringify(input.fields) });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('complete_task', 'Mark a task as complete', {
  id: z.string().describe('Task ID'),
  qualityRating: z.number().min(1).max(5).optional().describe('Quality rating 1-5'),
  easeRating: z.number().min(1).max(5).optional().describe('Ease rating 1-5')
}, async (input) => {
  const today = new Date().toISOString().split('T')[0];
  const fields = { completedDate: today, percentComplete: 100 };
  if (input.qualityRating) fields.qualityRating = input.qualityRating;
  if (input.easeRating) fields.easeRating = input.easeRating;
  const result = await etmFetch(`/tasks/${input.id}`, { method: 'PATCH', body: JSON.stringify(fields) });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('delete_task', 'Soft-delete a task: moves it to the trash. Recoverable via restore_task, or in the UI within a 24h grace window. Use this for normal deletes.', {
  id: z.string().describe('Task ID')
}, async (input) => {
  const result = await etmFetch(`/tasks/${input.id}`, { method: 'DELETE' });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('restore_task', 'Restore a soft-deleted (trashed) task — undoes delete_task. Use get_tasks with include_deleted to find trashed task IDs.', {
  id: z.string().describe('Task ID')
}, async (input) => {
  const result = await etmFetch(`/tasks/${input.id}/restore`, { method: 'POST' });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('purge_task', 'PERMANENTLY delete a task, bypassing the trash. Irreversible (recoverable only from tasks.json backups). Prefer delete_task unless permanent removal is explicitly intended.', {
  id: z.string().describe('Task ID')
}, async (input) => {
  const result = await etmFetch(`/tasks/${input.id}?hard=true`, { method: 'DELETE' });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('get_audit_log', 'Read the recent task-mutation audit log to answer who/what/when a task changed. Newest first. Each entry: ts, action (add/update/delete/restore/purge/import/bulk-save), source (ui=Cole in the browser, agent=this Copilot, api=other), taskId, task, details.', {
  limit: z.number().min(1).max(500).optional().default(50).describe('How many recent entries to return')
}, async (input) => {
  const result = await etmFetch(`/audit?limit=${input.limit}`);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

// ────────────────────────────────────────
// PROJECTS (first-class task containers)
// ────────────────────────────────────────

server.tool('list_projects', "List Cole's projects with rolled-up progress (percent complete, task counts, overdue count, next due date). Use to report project status or find a project id.", {}, async () => {
  const result = await etmFetch('/projects');
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('get_project', 'Get one project with its progress AND the list of its tasks.', {
  id: z.string().describe('Project ID')
}, async (input) => {
  const result = await etmFetch(`/projects/${input.id}`);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('create_project', 'Create a project — a goal-oriented container that groups tasks and rolls up their progress. Assign tasks to it afterward with assign_tasks_to_project.', {
  name: z.string().describe('Project name'),
  description: z.string().optional(),
  dueDate: z.string().optional().describe('YYYY-MM-DD'),
  status: z.enum(['active', 'paused', 'done', 'archived']).optional().default('active')
}, async (input) => {
  const result = await etmFetch('/projects', { method: 'POST', body: JSON.stringify(input) });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('update_project', 'Update a project (name, description, status active/paused/done/archived, dueDate).', {
  id: z.string(),
  fields: z.record(z.any()).describe('Partial fields to update')
}, async (input) => {
  const result = await etmFetch(`/projects/${input.id}`, { method: 'PATCH', body: JSON.stringify(input.fields) });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('delete_project', 'Delete a project. Its tasks are KEPT (just un-assigned from the project).', {
  id: z.string()
}, async (input) => {
  const result = await etmFetch(`/projects/${input.id}`, { method: 'DELETE' });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('assign_tasks_to_project', "Assign one or more existing tasks to a project (sets each task's projectId). Pass an empty projectId to UN-assign them.", {
  projectId: z.string().describe('Project ID, or "" to un-assign'),
  taskIds: z.array(z.string()).describe('Task IDs to assign')
}, async (input) => {
  const results = [];
  for (const id of input.taskIds) {
    try { await etmFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ projectId: input.projectId || null }) }); results.push({ id, ok: true }); }
    catch (e) { results.push({ id, ok: false, error: e.message }); }
  }
  return { content: [{ type: 'text', text: JSON.stringify({ assigned: results }) }] };
});

server.tool('import_tasks', 'Bulk import tasks with validation, normalization, and duplicate detection. Accepts flexible field names (urgent/isUrgent, necessary/isNecessary, status/percentComplete). Skips duplicates by name or ID.', {
  tasks: z.array(z.object({
    task: z.string().describe('Task name/description'),
    domain: z.enum(['Teaching', 'Projects', 'Personal']).optional().default('Teaching'),
    scope: z.enum(['Professional', 'Personal']).optional().default('Professional'),
    subcategory: z.string().optional().default(''),
    isUrgent: z.boolean().optional().default(false),
    isNecessary: z.boolean().optional().default(true),
    rank: z.number().min(1).max(3).optional().default(2),
    dueDate: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    status: z.enum(['incomplete', 'completed']).optional().default('incomplete')
  })).describe('Array of tasks to import')
}, async (input) => {
  const result = await etmFetch('/tasks/import', {
    method: 'POST',
    body: JSON.stringify(input.tasks)
  });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('get_settings', 'Get ETM settings including domains, scopes, and subcategories', {}, async () => {
  const result = await etmFetch('/settings');
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

// ────────────────────────────────────────
// FILE TOOLS
// ────────────────────────────────────────

server.tool('read_file', 'Read a file from Dropbox. Returns content (truncated to 10000 chars for large files)', {
  path: z.string().describe('Path relative to Dropbox root')
}, async (input) => {
  const filePath = safePath(input.path);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${input.path}`);
  const stat = fs.statSync(filePath);
  if (stat.size > 500000) throw new Error(`File too large (${(stat.size / 1024).toFixed(0)}KB). Max 500KB.`);
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.length > 10000) {
    content = content.slice(0, 10000) + `\n\n... [truncated, ${content.length} total chars]`;
  }
  return { content: [{ type: 'text', text: JSON.stringify({ path: input.path, size: stat.size, content }) }] };
});

server.tool('write_file', 'Write content to a file in Dropbox. Creates directories as needed', {
  path: z.string().describe('Path relative to Dropbox root'),
  content: z.string().describe('File content to write')
}, async (input) => {
  const filePath = safePath(input.path);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, input.content, 'utf-8');
  return { content: [{ type: 'text', text: JSON.stringify({ path: input.path, written: input.content.length }) }] };
});

server.tool('list_directory', 'List files and subdirectories in a Dropbox directory', {
  path: z.string().describe('Directory path relative to Dropbox root'),
  recursive: z.boolean().optional().default(false).describe('List recursively (max 200 entries)')
}, async (input) => {
  const dirPath = safePath(input.path);
  if (!fs.existsSync(dirPath)) throw new Error(`Directory not found: ${input.path}`);
  const entries = [];
  const maxEntries = 200;

  if (input.recursive) {
    const walk = (dir, prefix) => {
      if (entries.length >= maxEntries) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entries.length >= maxEntries) break;
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        entries.push({ name: rel, isDir: entry.isDirectory() });
        if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
      }
    };
    walk(dirPath, '');
  } else {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (entries.length >= maxEntries) break;
      entries.push({ name: entry.name, isDir: entry.isDirectory() });
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify({ path: input.path, count: entries.length, entries }) }] };
});

server.tool('search_files', 'Search for text within files in a directory', {
  path: z.string().describe('Directory to search (relative to Dropbox root)'),
  query: z.string().describe('Text to search for (case-insensitive)'),
  filePattern: z.string().optional().default('').describe('File extension filter, e.g. ".md"')
}, async (input) => {
  const dirPath = safePath(input.path);
  if (!fs.existsSync(dirPath)) throw new Error(`Directory not found: ${input.path}`);
  const results = [];
  const maxResults = 20;
  const query = input.query.toLowerCase();
  const ext = input.filePattern || '';

  const walk = (dir) => {
    if (results.length >= maxResults) return;
    let dirEntries;
    try { dirEntries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of dirEntries) {
      if (results.length >= maxResults) break;
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (!ext || entry.name.endsWith(ext)) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size > 200000) continue;
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          const matches = [];
          for (let i = 0; i < lines.length && matches.length < 3; i++) {
            if (lines[i].toLowerCase().includes(query)) {
              matches.push({ line: i + 1, text: lines[i].trim().slice(0, 120) });
            }
          }
          if (matches.length > 0) {
            const relPath = path.relative(DROPBOX_ROOT, fullPath).replace(/\\/g, '/');
            results.push({ file: relPath, matches });
          }
        } catch {}
      }
    }
  };
  walk(dirPath);
  return { content: [{ type: 'text', text: JSON.stringify({ query: input.query, resultCount: results.length, results }) }] };
});

// ────────────────────────────────────────
// PIPELINE TOOLS
// ────────────────────────────────────────

server.tool('list_pipelines', 'List saved pipeline files from the Pipeline IDE', {}, async () => {
  if (!fs.existsSync(PIPELINES_DIR)) return { content: [{ type: 'text', text: JSON.stringify({ pipelines: [] }) }] };
  const files = fs.readdirSync(PIPELINES_DIR).filter(f => f.endsWith('.json'));
  return { content: [{ type: 'text', text: JSON.stringify({ pipelines: files }) }] };
});

server.tool('get_pipeline', 'Read a pipeline definition file', {
  filename: z.string().describe('Pipeline filename')
}, async (input) => {
  const filePath = path.join(PIPELINES_DIR, input.filename);
  if (!filePath.startsWith(PIPELINES_DIR)) throw new Error('Invalid pipeline path');
  if (!fs.existsSync(filePath)) throw new Error(`Pipeline not found: ${input.filename}`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return { content: [{ type: 'text', text: JSON.stringify({ filename: input.filename, name: data.name, nodeCount: data.nodes?.length, edgeCount: data.edges?.length }) }] };
});

// ────────────────────────────────────────
// AGENT HAT TOOL
// ────────────────────────────────────────

server.tool('read_agent_guide', "Read an agent guide to adopt that agent's persona and workflow", {
  agent: z.enum(['ART', 'ENG', 'PROF', 'SCI', 'WEB', 'PM', 'PA']).describe('Agent hat to load')
}, async (input) => {
  // Roster renamed 2026-06-15: roles Cole embodies (was CD/TA/RA/CE/SA/PM).
  const agentMap = {
    ART:  'Artist/ARTIST_GUIDE.md',
    ENG:  'Engineer/ENGINEER_GUIDE.md',
    PROF: 'Professor/PROFESSOR_GUIDE.md',
    SCI:  'Scientist/SCIENTIST_GUIDE.md',
    WEB:  'Web Admin/WEB_ADMIN_GUIDE.md',
    PM:   'Project Manager/PROJECT_MANAGER_GUIDE.md',
    PA:   'Personal Assistant/PERSONAL_ASSISTANT_GUIDE.md'
  };
  const guidePath = agentMap[input.agent];
  const fullPath = path.join(DROPBOX_ROOT, 'Agents', guidePath);
  if (!fs.existsSync(fullPath)) throw new Error(`Guide not found: ${guidePath}`);
  let content = fs.readFileSync(fullPath, 'utf-8');
  const dirPath = path.join(path.dirname(fullPath), 'DIRECTIVES.md');
  if (fs.existsSync(dirPath)) {
    const directives = fs.readFileSync(dirPath, 'utf-8');
    content += '\n\n---\n\n# DIRECTIVES\n\n' + directives;
  }
  if (content.length > 15000) {
    content = content.slice(0, 15000) + '\n\n... [truncated]';
  }
  return { content: [{ type: 'text', text: JSON.stringify({ agent: input.agent, guide: content }) }] };
});

// ────────────────────────────────────────
// SHELL TOOL
// ────────────────────────────────────────

server.tool('shell_command', "Execute a QUICK shell command on Cole's PC (under ~30s). Runs from Dropbox root. Hard 60s timeout. For anything longer — builds, installs, npm/pip, pipelines, git, long scripts — use run_job instead (it runs in the background and won't time out).", {
  command: z.string().describe('Shell command to execute'),
  cwd: z.string().optional().describe('Working directory relative to Dropbox root')
}, async (input) => {
  const cwd = input.cwd ? safePath(input.cwd) : DROPBOX_ROOT;
  const result = await execShell(input.command, cwd);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

// ────────────────────────────────────────
// BACKGROUND JOBS (long-running work)
// ────────────────────────────────────────

server.tool('run_job', "Run a shell command as a BACKGROUND JOB on Cole's PC. Use this (not shell_command) for anything that may take more than ~30s: builds, installs, npm/pip, pipelines, git operations, long scripts, multi-step work. Returns IMMEDIATELY with a job id; the job keeps running after this turn ends and Cole is notified on completion. Tell Cole the job started and its id; check progress later with get_job. Runs from the Dropbox root unless an absolute cwd is given.", {
  command: z.string().describe('Shell command to run in the background'),
  cwd: z.string().optional().describe('Absolute working directory (defaults to Dropbox root)'),
  label: z.string().optional().describe('Short human label, e.g. "Build ETM" or "Rebuild PSE-I Ch 5"')
}, async (input) => {
  const body = { command: input.command };
  if (input.cwd) body.cwd = input.cwd;
  if (input.label) body.label = input.label;
  const result = await etmFetch('/jobs', { method: 'POST', body: JSON.stringify(body) });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('get_job', 'Get a background job\'s status and recent output — to check progress or report results. Status is one of: queued, running, completed, failed, stopped, interrupted, timed-out.', {
  id: z.string().describe('Job ID (from run_job)')
}, async (input) => {
  const result = await etmFetch(`/jobs/${input.id}`);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('list_jobs', 'List background jobs, newest first. Optionally filter by status.', {
  status: z.string().optional().describe('Filter: running | completed | failed | stopped | queued')
}, async (input) => {
  const q = input.status ? `?status=${encodeURIComponent(input.status)}` : '';
  const result = await etmFetch(`/jobs${q}`);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('stop_job', 'Stop/cancel a running background job (tree-kills its process).', {
  id: z.string().describe('Job ID')
}, async (input) => {
  const result = await etmFetch(`/jobs/${input.id}/stop`, { method: 'POST' });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('get_workdir', 'Get the current working directory (active project) that your native tools (Read/Edit/Grep/Glob/Bash) and background jobs run in.', {}, async () => {
  const result = await etmFetch('/copilot/workdir');
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('set_workdir', "Set the working directory (active project) for your native tools and background jobs. Absolute path, or relative to the current workdir. Takes effect on the NEXT turn — for the CURRENT turn, use absolute paths. Confirm the new directory to Cole.", {
  path: z.string().describe('Absolute directory path, or a path relative to the current workdir')
}, async (input) => {
  const result = await etmFetch('/copilot/workdir', { method: 'POST', body: JSON.stringify({ path: input.path }) });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

server.tool('ask_cole', "Ask Cole a question and get his decision. Pushes a notification to his phone with tap-able options and BLOCKS until he answers (or ~5 min timeout). Use ONLY when a choice is genuinely Cole's to make — a fork in a task, a confirmation before something impactful, a preference you can't infer (don't use it for things you can decide yourself). Provide 2-5 short options. Returns {answered, answer}; if he doesn't respond, returns answered:false — then pick a safe default or stop and report.", {
  question: z.string().describe('The question for Cole — concise and specific'),
  options: z.array(z.string()).optional().describe('2-5 short options he can tap (defaults to Yes / No)')
}, async (input) => {
  const created = await etmFetch('/copilot/asks', { method: 'POST', body: JSON.stringify({ question: input.question, options: input.options }) });
  const id = created.id;
  const deadline = Date.now() + 290000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1500));
    const cur = await etmFetch(`/copilot/asks/${id}`).catch(() => null);
    if (!cur || cur.status === 'pending') continue;
    if (cur.status === 'answered') return { content: [{ type: 'text', text: JSON.stringify({ answered: true, answer: cur.answer }) }] };
    return { content: [{ type: 'text', text: JSON.stringify({ answered: false, reason: 'Cole did not respond in time' }) }] };
  }
  return { content: [{ type: 'text', text: JSON.stringify({ answered: false, reason: 'timed out' }) }] };
});

// ────────────────────────────────────────
// PERMISSION PROMPT (human-in-the-loop approvals)
// Claude Code calls this (via --permission-prompt-tool) before a gated tool use.
// Defensive schema (field names are under-documented — accept both conventions);
// logs what it actually receives so the contract can be confirmed empirically.
// ────────────────────────────────────────
// SAFE tools auto-run without asking. Everything else (writes, shell, jobs,
// permanent deletes, outward actions) routes to a human approval.
const SAFE_TOOLS = new Set([
  'Read', 'Grep', 'Glob', 'LS', 'NotebookRead', 'TodoWrite', 'WebFetch', 'WebSearch',
  'get_tasks', 'get_settings', 'get_audit_log', 'get_job', 'list_jobs', 'get_workdir',
  'read_file', 'list_directory', 'search_files', 'list_pipelines', 'get_pipeline',
  'read_agent_guide', 'query_knowledge_base'
]);
server.tool('approval_prompt', 'Internal: permission handler invoked by Claude Code before a gated tool use. Not for direct use.', {
  tool_name: z.string().optional(),
  toolName: z.string().optional(),
  input: z.any().optional(),
  tool_input: z.any().optional()
}, async (args) => {
  const toolName = args.tool_name || args.toolName || 'unknown';
  const toolInput = (args.input !== undefined ? args.input : args.tool_input) || {};
  const bareName = String(toolName).split('__').pop(); // strip any mcp__<server>__ prefix
  const allow = (beh) => ({ content: [{ type: 'text', text: JSON.stringify(beh) }] });

  if (SAFE_TOOLS.has(toolName) || SAFE_TOOLS.has(bareName)) {
    return allow({ behavior: 'allow', updatedInput: toolInput });
  }
  // Risky tool — ask the human. Create a pending approval and block-poll for the decision.
  try {
    const created = await etmFetch('/copilot/approvals', { method: 'POST', body: JSON.stringify({ tool: toolName, input: toolInput }) });
    const id = created.id;
    const deadline = Date.now() + 125000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 1000));
      const cur = await etmFetch(`/copilot/approvals/${id}`).catch(() => null);
      if (!cur || cur.status === 'pending') continue;
      if (cur.status === 'approved') return allow({ behavior: 'allow', updatedInput: toolInput });
      return allow({ behavior: 'deny', message: `Cole ${cur.status === 'expired' ? 'did not respond to' : 'denied'} the request to use ${toolName}.` });
    }
    return allow({ behavior: 'deny', message: `Approval for ${toolName} timed out.` });
  } catch (e) {
    // If the approval system is unreachable, fail safe = deny.
    return allow({ behavior: 'deny', message: `Approval system error: ${e.message}` });
  }
});

// ────────────────────────────────────────
// KNOWLEDGE BASE TOOL
// ────────────────────────────────────────

server.tool('query_knowledge_base',
  'Query the unified knowledge base. Search nodes, get stats, run analysis queries, list by domain or method stage.',
  {
    action: z.enum(['search', 'stats', 'node', 'domains', 'method_stages', 'gap', 'impact', 'learning', 'delegation', 'leverage', 'decay', 'scope']).describe('Query action'),
    query: z.string().optional().describe('Search query (for action=search)'),
    node_id: z.string().optional().describe('Node ID (for action=node/impact/learning/scope)'),
    limit: z.number().optional().default(20).describe('Max results for search')
  },
  async (input) => {
    const { action, query, node_id, limit } = input;
    try {
      const baseUrl = `${ETM_BASE}/kb`;
      let url;
      switch (action) {
        case 'search': url = `${baseUrl}/search?q=${encodeURIComponent(query || '')}&limit=${limit}`; break;
        case 'stats': url = `${baseUrl}/stats`; break;
        case 'node': url = `${baseUrl}/node/${encodeURIComponent(node_id || '')}`; break;
        case 'domains': url = `${baseUrl}/domains`; break;
        case 'method_stages': url = `${baseUrl}/method-stages`; break;
        case 'gap': url = `${baseUrl}/query/gap`; break;
        case 'impact': url = `${baseUrl}/query/impact/${encodeURIComponent(node_id || '')}`; break;
        case 'learning': url = `${baseUrl}/query/learning/${encodeURIComponent(node_id || '')}`; break;
        case 'delegation': url = `${baseUrl}/query/delegation`; break;
        case 'leverage': url = `${baseUrl}/query/leverage`; break;
        case 'decay': url = `${baseUrl}/query/decay`; break;
        case 'scope': url = `${baseUrl}/query/scope/${encodeURIComponent(node_id || '')}`; break;
        default: return { content: [{ type: 'text', text: JSON.stringify({ error: 'Unknown action' }) }] };
      }
      const resp = await fetch(url);
      const result = await resp.json();
      const text = JSON.stringify(result, null, 2);
      return { content: [{ type: 'text', text: text.length > 8000 ? text.slice(0, 8000) + '\n...(truncated)' : text }] };
    } catch (e) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: e.message }) }] };
    }
  }
);

// ===== START =====
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP server error: ${err.message}\n`);
  process.exit(1);
});
