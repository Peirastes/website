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
    headers: { 'Content-Type': 'application/json', ...opts.headers },
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

server.tool('get_tasks', 'Get all tasks from the Eisenhower Task Manager', {}, async () => {
  const tasks = await etmFetch('/tasks');
  return { content: [{ type: 'text', text: JSON.stringify(tasks) }] };
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

server.tool('delete_task', 'Delete a task permanently', {
  id: z.string().describe('Task ID')
}, async (input) => {
  const result = await etmFetch(`/tasks/${input.id}`, { method: 'DELETE' });
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
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
  agent: z.enum(['PM', 'CE', 'CD', 'RA', 'SA', 'TA']).describe('Agent hat to load')
}, async (input) => {
  const agentMap = {
    PM: 'PM Agent/PM_AGENT_GUIDE.md',
    CE: 'CE Agent/CE_AGENT_GUIDE.md',
    CD: 'CD Agent/CD_AGENT_GUIDE.md',
    RA: 'RA Agent/RA_AGENT_GUIDE.md',
    SA: 'SA Agent/SA_AGENT_GUIDE.md',
    TA: 'TA Agent/TA_AGENT_GUIDE.md'
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

server.tool('shell_command', "Execute a shell command on Cole's PC. Runs from Dropbox root. 60s timeout. No interactive commands.", {
  command: z.string().describe('Shell command to execute'),
  cwd: z.string().optional().describe('Working directory relative to Dropbox root')
}, async (input) => {
  const cwd = input.cwd ? safePath(input.cwd) : DROPBOX_ROOT;
  const result = await execShell(input.command, cwd);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
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
