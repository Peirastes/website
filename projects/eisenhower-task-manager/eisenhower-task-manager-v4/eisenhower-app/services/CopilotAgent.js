const fs = require('fs');
const path = require('path');
const { safePath, DROPBOX_ROOT } = require('./pathSecurity');

class CopilotAgent {
  constructor(options = {}) {
    const Anthropic = require('@anthropic-ai/sdk');
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.historyFile = options.historyFile || null;
    this.pipelinesDir = options.pipelinesDir || null;
    this.taskService = options.taskService || null;
    this.pipelineEngine = options.pipelineEngine || null;
    this.history = this.historyFile ? this._loadHistory() : [];
  }

  _loadHistory() {
    try {
      if (this.historyFile && fs.existsSync(this.historyFile)) {
        return JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
      }
    } catch {}
    return [];
  }

  _saveHistory() {
    if (!this.historyFile) return;
    const dir = path.dirname(this.historyFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const trimmed = this.history.slice(-100);
    fs.writeFileSync(this.historyFile, JSON.stringify(trimmed, null, 2), 'utf-8');
  }

  get systemPrompt() {
    const today = new Date().toISOString().split('T')[0];
    return `You are Cole's AI Copilot — a multi-role assistant that can operate as any of his agents. You have direct access to his Eisenhower Task Manager, Dropbox filesystem, and can execute shell commands on his PC.

## Agent Hats
Cole's agent team was reframed (2026-06-15) as the roles he himself embodies. When he says
"put on your [Role] hat" (by full name or alias) or asks you to work as a specific agent, use the
read_agent_guide tool with the alias code to load that role's guide and adopt its persona, tone, and workflow.

| Alias | Role | Guide Path |
|-------|------|------------|
| ART  | Artist | Agents/Artist/ARTIST_GUIDE.md |
| ENG  | Engineer (lead; all technical building, software included) | Agents/Engineer/ENGINEER_GUIDE.md |
| PROF | Professor | Agents/Professor/PROFESSOR_GUIDE.md |
| SCI  | Scientist | Agents/Scientist/SCIENTIST_GUIDE.md |
| WEB  | Web Admin | Agents/Web Admin/WEB_ADMIN_GUIDE.md |
| PM   | Project Manager | Agents/Project Manager/PROJECT_MANAGER_GUIDE.md |
| PA   | Personal Assistant | Agents/Personal Assistant/PERSONAL_ASSISTANT_GUIDE.md |

When no specific hat is requested, default to the PM persona.

## Default Personality (PM)
Direct, witty, a little sassy — like Cortana with a project management degree. Concise (you're on a mobile screen). Push back on overcommitment. Celebrate wins briefly. No emojis unless Cole uses them first.

## PA Autonomy (when wearing the PA hat)
Reversibility-gated: act on internal/reversible things; propose-first on outward-facing or hard-to-reverse ones (sending email, booking, anything others see).

## Task Schema (Eisenhower Task Manager)
- **task**, **category** (Career/Personal), **subcategory**
- **isUrgent** + **isNecessary** → Q1 Do First, Q2 Schedule, Q3 Delegate, Q4 Eliminate
- **rank** (1-3), **assignedDate**, **dueDate**, **completedDate**, **percentComplete** (0-100)
- **isRecurring** + **recurringPattern**, **notes**, **qualityRating/easeRating** (1-5)
- Subcategories — Career: Dynamics, Statics, Intro to Engineering, Thermal Engineering Lab, Physics | Personal: Car, Home, Health, Finance
- Prioritization: Blocking impact → Deadline → Strategic alignment (Q2 > Q1) → Effort-to-value

## File System
You can read, write, list, search files, and run shell commands within Cole's Dropbox.
- Professional/Instructor/ — course materials
- Website/projects/ — web apps and tools
- Agents/ — AI agent configs and guides
- Shell commands execute from the Dropbox root. Use for git, python, pandoc, npm, etc.

## Context
- Today: ${today}
- Cole is a university instructor (Physics/PSE-I & II, Dynamics, Intro to Engineering, Electrical Science Lab)
- He runs peirastes.com and several Electron apps
- His time is the primary constraint — guard it fiercely

## Tool Use Guidelines
- Tasks: infer category from context, default Q2/rank 2, assignedDate = today
- When a task is done — whether you did it, Cole says he did it, or it's clear from context — call complete_task immediately. Don't just note it in chat; persist it to ETM.
- File paths: relative to Dropbox root
- Shell commands: scoped to Dropbox directory, 60s timeout, no interactive commands
- When asked to wear a hat: read the agent guide FIRST, then respond in character
- Keep responses concise — this is a mobile interface`;
  }

  get tools() {
    const toolList = [
      // ===== ETM TOOLS =====
      {
        name: 'get_tasks',
        description: 'Get all tasks from the Eisenhower Task Manager.',
        input_schema: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'add_task',
        description: 'Add a new task to the Eisenhower Task Manager.',
        input_schema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task name/description' },
            category: { type: 'string', enum: ['Career', 'Personal'] },
            subcategory: { type: 'string' },
            isUrgent: { type: 'boolean' },
            isNecessary: { type: 'boolean' },
            rank: { type: 'number', description: '1=high, 2=medium, 3=low' },
            dueDate: { type: 'string', description: 'YYYY-MM-DD or empty' },
            notes: { type: 'string' },
            isRecurring: { type: 'boolean' },
            recurringPattern: { type: 'string', enum: ['once', 'daily', 'weekly', 'monthly', 'yearly'] },
            timeEstimateValue: { type: 'number' },
            timeEstimateUnit: { type: 'string', enum: ['hours', 'days'] }
          },
          required: ['task', 'category', 'isUrgent', 'isNecessary']
        }
      },
      {
        name: 'update_task',
        description: 'Update fields on an existing task.',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID' },
            fields: { type: 'object', description: 'Partial fields to update' }
          },
          required: ['id', 'fields']
        }
      },
      {
        name: 'complete_task',
        description: 'Mark a task as complete.',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID' },
            qualityRating: { type: 'number', description: '1-5' },
            easeRating: { type: 'number', description: '1-5' }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_task',
        description: 'Delete a task permanently.',
        input_schema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      },
      {
        name: 'import_tasks',
        description: 'Bulk import tasks with validation, normalization, and duplicate detection. Accepts flexible field names. Skips duplicates by name or ID.',
        input_schema: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              description: 'Array of task objects to import',
              items: {
                type: 'object',
                properties: {
                  task: { type: 'string', description: 'Task name/description' },
                  category: { type: 'string', enum: ['Career', 'Personal'] },
                  subcategory: { type: 'string' },
                  isUrgent: { type: 'boolean' },
                  isNecessary: { type: 'boolean' },
                  rank: { type: 'number', description: '1=high, 2=medium, 3=low' },
                  dueDate: { type: 'string', description: 'YYYY-MM-DD or empty' },
                  notes: { type: 'string' },
                  status: { type: 'string', enum: ['incomplete', 'completed'] }
                },
                required: ['task']
              }
            }
          },
          required: ['tasks']
        }
      },
      {
        name: 'get_settings',
        description: 'Get ETM settings including categories and subcategories.',
        input_schema: { type: 'object', properties: {}, required: [] }
      },
      // ===== FILE TOOLS =====
      {
        name: 'read_file',
        description: 'Read a file from Dropbox. Returns the file content (truncated to 10000 chars for large files).',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path relative to Dropbox root' }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file in Dropbox. Creates directories as needed.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path relative to Dropbox root' },
            content: { type: 'string', description: 'File content to write' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'list_directory',
        description: 'List files and subdirectories in a Dropbox directory.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path relative to Dropbox root' },
            recursive: { type: 'boolean', description: 'List recursively (max 200 entries)' }
          },
          required: ['path']
        }
      },
      {
        name: 'search_files',
        description: 'Search for text within files in a directory.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory to search (relative to Dropbox root)' },
            query: { type: 'string', description: 'Text to search for (case-insensitive)' },
            filePattern: { type: 'string', description: 'File extension filter, e.g. ".md"' }
          },
          required: ['path', 'query']
        }
      },
      // ===== PIPELINE TOOLS =====
      {
        name: 'list_pipelines',
        description: 'List saved pipeline files from the Pipeline IDE.',
        input_schema: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'get_pipeline',
        description: 'Read a pipeline definition file.',
        input_schema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'Pipeline filename' }
          },
          required: ['filename']
        }
      },
      // ===== AGENT HAT =====
      {
        name: 'read_agent_guide',
        description: 'Read an agent guide to adopt that agent\'s persona and workflow.',
        input_schema: {
          type: 'object',
          properties: {
            agent: { type: 'string', enum: ['ART', 'ENG', 'PROF', 'SCI', 'WEB', 'PM', 'PA'] }
          },
          required: ['agent']
        }
      },
      // ===== SHELL =====
      {
        name: 'shell_command',
        description: 'Execute a shell command on Cole\'s PC. Runs from Dropbox root. 60s timeout. No interactive commands.',
        input_schema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Shell command to execute' },
            cwd: { type: 'string', description: 'Working directory relative to Dropbox root (optional)' }
          },
          required: ['command']
        }
      },
      // ===== KNOWLEDGE BASE =====
      {
        name: 'query_knowledge_base',
        description: 'Query the unified knowledge base. Can search nodes, get stats, run analysis queries (gap analysis, impact cascade, learning path, delegation readiness, highest leverage, decay detection, scope guard), list nodes by domain or method stage, or get details on a specific node.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['search', 'stats', 'node', 'domains', 'method_stages', 'gap', 'impact', 'learning', 'delegation', 'leverage', 'decay', 'scope'],
              description: 'The query action to perform'
            },
            query: { type: 'string', description: 'Search query (for action=search)' },
            node_id: { type: 'string', description: 'Node ID (for action=node, impact, learning, scope)' },
            limit: { type: 'number', description: 'Max results for search (default 20)' }
          },
          required: ['action']
        }
      }
    ];

    // Add run_pipeline tool if engine is available
    if (this.pipelineEngine) {
      toolList.push({
        name: 'run_pipeline',
        description: 'Execute a saved pipeline headlessly. Returns deliverables and execution log.',
        input_schema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'Pipeline JSON filename (e.g. "ta_pseii_lecture_pipeline.json")' },
            parameters: { type: 'object', description: 'Parameter overrides for {{PARAM}} substitution in node configs' }
          },
          required: ['filename']
        }
      });
    }

    return toolList;
  }

  async executeTool(name, input) {
    switch (name) {
      // ===== ETM (direct via taskService — no HTTP hop) =====
      case 'get_tasks':
        return await this.taskService.getTasks();

      case 'add_task': {
        const today = new Date().toISOString().split('T')[0];
        const task = {
          id: String(Date.now()),
          task: input.task,
          category: input.category || 'Career',
          subcategory: input.subcategory || '',
          isUrgent: input.isUrgent ?? false,
          isNecessary: input.isNecessary ?? true,
          rank: input.rank ?? 2,
          assignedDate: today,
          dueDate: input.dueDate || '',
          completedDate: null,
          percentComplete: 0,
          isRecurring: input.isRecurring ?? false,
          recurringPattern: input.recurringPattern || 'once',
          notes: input.notes || '',
          qualityRating: null,
          easeRating: null,
          timeEstimateValue: input.timeEstimateValue || 0,
          timeEstimateUnit: input.timeEstimateUnit || 'hours'
        };
        return await this.taskService.addTask(task);
      }

      case 'update_task':
        return await this.taskService.updateTask(input.id, input.fields);

      case 'complete_task': {
        const today = new Date().toISOString().split('T')[0];
        const fields = { completedDate: today, percentComplete: 100 };
        if (input.qualityRating) fields.qualityRating = input.qualityRating;
        if (input.easeRating) fields.easeRating = input.easeRating;
        return await this.taskService.updateTask(input.id, fields);
      }

      case 'delete_task':
        return await this.taskService.deleteTask(input.id);

      case 'import_tasks':
        return await this.taskService.importTasks(input.tasks);

      case 'get_settings':
        return await this.taskService.getSettings();

      // ===== FILES =====
      case 'read_file': {
        const filePath = safePath(input.path);
        if (!fs.existsSync(filePath)) throw new Error(`File not found: ${input.path}`);
        const stat = fs.statSync(filePath);
        if (stat.size > 500000) throw new Error(`File too large (${(stat.size / 1024).toFixed(0)}KB). Max 500KB.`);
        let content = fs.readFileSync(filePath, 'utf-8');
        if (content.length > 10000) {
          content = content.slice(0, 10000) + `\n\n... [truncated, ${content.length} total chars]`;
        }
        return { path: input.path, size: stat.size, content };
      }

      case 'write_file': {
        const filePath = safePath(input.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, input.content, 'utf-8');
        return { path: input.path, written: input.content.length };
      }

      case 'list_directory': {
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

        return { path: input.path, count: entries.length, entries };
      }

      case 'search_files': {
        const dirPath = safePath(input.path);
        if (!fs.existsSync(dirPath)) throw new Error(`Directory not found: ${input.path}`);
        const results = [];
        const maxResults = 20;
        const query = input.query.toLowerCase();
        const ext = input.filePattern || '';

        const walk = (dir) => {
          if (results.length >= maxResults) return;
          let entries;
          try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
          for (const entry of entries) {
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
        return { query: input.query, resultCount: results.length, results };
      }

      // ===== PIPELINES =====
      case 'list_pipelines': {
        if (!this.pipelinesDir || !fs.existsSync(this.pipelinesDir)) return { pipelines: [] };
        const files = fs.readdirSync(this.pipelinesDir).filter(f => f.endsWith('.json'));
        return { pipelines: files };
      }

      case 'get_pipeline': {
        if (!this.pipelinesDir) throw new Error('Pipelines directory not configured');
        const filePath = path.join(this.pipelinesDir, input.filename);
        if (!filePath.startsWith(this.pipelinesDir)) throw new Error('Invalid pipeline path');
        if (!fs.existsSync(filePath)) throw new Error(`Pipeline not found: ${input.filename}`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return { filename: input.filename, name: data.name, nodeCount: data.nodes?.length, edgeCount: data.edges?.length };
      }

      case 'run_pipeline': {
        if (!this.pipelineEngine) throw new Error('Pipeline engine not available');
        if (!this.pipelinesDir) throw new Error('Pipelines directory not configured');

        const filePath = path.join(this.pipelinesDir, input.filename);
        if (!filePath.startsWith(this.pipelinesDir)) throw new Error('Invalid pipeline path');
        if (!fs.existsSync(filePath)) throw new Error(`Pipeline not found: ${input.filename}`);

        const pipeline = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const parameters = input.parameters || {};
        const logEntries = [];

        const results = await this.pipelineEngine.run(
          pipeline,
          (nodeId, status, data) => {
            logEntries.push(`${nodeId}: ${status}`);
          },
          parameters
        );

        return {
          name: pipeline.name,
          duration: `${(results.duration / 1000).toFixed(1)}s`,
          deliverables: results.deliverables,
          tokenUsage: results.tokenUsage,
          nodesExecuted: logEntries.length,
          log: logEntries.slice(-20) // last 20 entries
        };
      }

      // ===== AGENT HAT =====
      case 'read_agent_guide': {
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
        if (!guidePath) throw new Error(`Unknown agent: ${input.agent}`);
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
        return { agent: input.agent, guide: content };
      }

      // ===== SHELL =====
      case 'shell_command': {
        const { spawn } = require('child_process');
        const cwd = input.cwd ? safePath(input.cwd) : DROPBOX_ROOT;

        return new Promise((resolve, reject) => {
          const proc = spawn(input.command, [], {
            cwd,
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
            resolve({
              exitCode: code,
              stdout: stdout.trim(),
              stderr: stderr.trim()
            });
          });
        });
      }

      // ===== KNOWLEDGE BASE =====
      case 'query_knowledge_base': {
        const { action, query, node_id, limit } = input;
        try {
          const baseUrl = 'http://localhost:3001/api/kb';
          let url;
          switch (action) {
            case 'search': url = `${baseUrl}/search?q=${encodeURIComponent(query || '')}&limit=${limit || 20}`; break;
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
            default: return { error: `Unknown KB action: ${action}` };
          }
          const resp = await fetch(url);
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: resp.statusText }));
            return { error: err.error || 'KB query failed' };
          }
          const result = await resp.json();
          // Truncate large results to avoid context overflow
          const json = JSON.stringify(result);
          if (json.length > 8000) {
            return { note: 'Results truncated to 8000 chars', data: JSON.parse(json.slice(0, 8000) + '..."]}') };
          }
          return result;
        } catch (e) {
          return { error: `KB query failed: ${e.message}` };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async chat(userMessage, opts = {}) {
    this.history.push({ role: 'user', content: userMessage });

    const MODEL_IDS = {
      sonnet: 'claude-sonnet-4-6',
      opus:   'claude-opus-4-8',
      haiku:  'claude-haiku-4-5-20251001'
    };
    const model = MODEL_IDS[opts.model] || MODEL_IDS.sonnet;

    let messages = [...this.history];
    let response;
    const toolCalls = [];

    while (true) {
      response = await this.client.messages.create({
        model,
        max_tokens: 4096,
        system: this.systemPrompt,
        tools: this.tools,
        messages
      });

      if (response.stop_reason === 'end_turn') break;

      if (response.stop_reason === 'tool_use') {
        const assistantContent = response.content;
        messages.push({ role: 'assistant', content: assistantContent });

        const toolResults = [];
        for (const block of assistantContent) {
          if (block.type === 'tool_use') {
            toolCalls.push({ tool: block.name, input: block.input });
            try {
              const result = await this.executeTool(block.name, block.input);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result)
              });
            } catch (err) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({ error: err.message }),
                is_error: true
              });
            }
          }
        }
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      break;
    }

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    this.history.push({ role: 'assistant', content: text });
    this._saveHistory();

    return { text, toolCalls, inputTokens, outputTokens };
  }

  clearHistory() {
    this.history = [];
    this._saveHistory();
  }

  getHistory() {
    const messages = [];
    for (const msg of this.history) {
      if (typeof msg.content === 'string') {
        messages.push({ role: msg.role, text: msg.content });
      }
    }
    return messages;
  }
}

module.exports = { CopilotAgent };
