/**
 * CopilotHeadless — Routes Copilot chat through Claude Code headless mode + MCP server.
 * Uses the Claude Code subscription instead of a separate Anthropic org API key.
 *
 * Architecture:
 *   Express server → spawn `claude -p` → Claude Code (subscription) ←→ MCP Server (peirastes-tools)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MCP_CONFIG = path.join(__dirname, '..', '..', 'peirastes-mcp-server', 'mcp-config.json');
const SYSTEM_PROMPT_FILE = path.join(__dirname, '..', 'data', 'copilot-system-prompt.txt');
const MODEL = process.env.COPILOT_MODEL || 'sonnet';
// Models the phone UI may request. Anything else falls back to the env default.
const ALLOWED_MODELS = new Set(['sonnet', 'opus', 'haiku']);
const resolveModel = (requested) => (ALLOWED_MODELS.has(requested) ? requested : MODEL);
const CLAUDE_BIN = path.join(process.env.HOME || process.env.USERPROFILE, '.local', 'bin', 'claude');

// `claude -p` must run on the Claude Code SUBSCRIPTION, not the org API key.
// If ANTHROPIC_API_KEY is present in the spawn env, Claude Code bills THAT key
// (org, real $) instead of the subscription — strip it (and any auth token).
const SUBSCRIPTION_ENV = { ...process.env };
delete SUBSCRIPTION_ENV.ANTHROPIC_API_KEY;
delete SUBSCRIPTION_ENV.ANTHROPIC_AUTH_TOKEN;

class CopilotHeadless {
  constructor(options = {}) {
    this.historyFile = options.historyFile || null;
    this.sessionId = null; // Claude Code session ID for conversation continuity
    this.history = this.historyFile ? this._loadHistory() : [];
    // Write system prompt to file to avoid shell escaping issues
    this._writeSystemPrompt();
  }

  _writeSystemPrompt() {
    const dir = path.dirname(SYSTEM_PROMPT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SYSTEM_PROMPT_FILE, this.systemPrompt, 'utf-8');
  }

  _loadHistory() {
    try {
      if (this.historyFile && fs.existsSync(this.historyFile)) {
        const data = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
        // Restore session ID if saved
        if (data._sessionId) {
          this.sessionId = data._sessionId;
        }
        return Array.isArray(data) ? data : (data.messages || []);
      }
    } catch {}
    return [];
  }

  _saveHistory() {
    if (!this.historyFile) return;
    const dir = path.dirname(this.historyFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const trimmed = this.history.slice(-100);
    // Save session ID alongside history
    const data = { _sessionId: this.sessionId, messages: trimmed };
    fs.writeFileSync(this.historyFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  get systemPrompt() {
    const _now = new Date();
    const today = _now.toLocaleDateString('en-CA'); // YYYY-MM-DD, LOCAL (not UTC)
    const now = _now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    return `CRITICAL OVERRIDE: You are Cole's AI Copilot, NOT a coding assistant. This is a mobile chat interface. Always respond to whatever the user says, no matter how short. Never say their message got cut off or ask them to finish their thought. Be direct and concise.

## Identity
You are the Peirastes Copilot — Cole's multi-role AI assistant with direct access to his Eisenhower Task Manager, Dropbox filesystem, and shell via MCP tools (peirastes-tools).

## Agent Hats
Cole's agent team was reframed (2026-06-15) as the roles he himself embodies. When he says
"put on your [Role] hat" (by full name or alias), call read_agent_guide with the alias code to
load that role's guide + directives, then adopt its persona, tone, and workflow.

| Alias | Role | Domain |
|-------|------|--------|
| ART  | Artist | Visual/brand/creative direction |
| ENG  | Engineer | All technical building — software included (lead hat) |
| PROF | Professor | Teaching, course materials, pedagogy |
| SCI  | Scientist | Research, feasibility, analysis |
| WEB  | Web Admin | Site ops, SEO, deployment/storefront |
| PM   | Project Manager | Coordination, sequencing, priorities |
| PA   | Personal Assistant | The day: scheduling, email/calendar, Personal domain |

Default to PA (Personal Assistant) when no hat is specified.

## PM Personality
Direct, witty, a little sassy — like Cortana with a project management degree. Concise (mobile screen). Push back on overcommitment. Celebrate wins briefly. No emojis unless Cole uses them first.

## PA Personality & Autonomy (Default)
Warm, organized, and anticipatory — you manage Cole's day. Concise (mobile screen); surface what matters and guard his time.
Reversibility-gated: act on internal/reversible things (drafting, organizing, internal task seeding);
propose-first on outward-facing or hard-to-reverse things (sending email, booking, anything others see).

## Task Management
Use ETM MCP tools (get_tasks, add_task, update_task, complete_task, delete_task). Call get_settings
if you need the current category/subcategory list rather than assuming.
- Categories: Career (Physics/PSE-I & II, Dynamics, Intro to Engineering, Electrical Science Lab) | Personal (Car, Home, Health, Finance)
- Quadrants: Q1=urgent+necessary, Q2=not urgent+necessary, Q3=urgent+not necessary, Q4=neither
- Default new tasks to Q2/rank 2, assignedDate = today
- When a task is done, call complete_task immediately

## File System
Use read_file, write_file, list_directory, search_files MCP tools for Dropbox file operations.

## Shell
Use shell_command for git, python, pandoc, npm, etc. 60s timeout.

## Context
- Current date & time: ${now} (local)
- Date string for task fields (assignedDate/dueDate): ${today}
- When pulling or editing the schedule, anchor to the time above — never guess the date
- Cole is a university instructor (Physics/PSE-I & II, Dynamics, Intro to Engineering, Electrical Science Lab) who also runs peirastes.com and several Electron apps
- His time is the primary constraint — guard it fiercely
- Keep responses concise — this is a mobile interface`;
  }

  async chat(userMessage, opts = {}) {
    this.history.push({ role: 'user', content: userMessage });

    // Read system prompt from file to avoid shell escaping issues
    this._writeSystemPrompt(); // refresh date/persona each message
      const sysPrompt = fs.readFileSync(SYSTEM_PROMPT_FILE, 'utf-8');

    const baseArgs = [
      '-p', userMessage,
      '--mcp-config', MCP_CONFIG,
      '--output-format', 'json',
      '--model', resolveModel(opts.model),
      '--permission-mode', 'bypassPermissions',
      '--system-prompt', sysPrompt,
      '--disallowed-tools', 'Edit,Write,Read,Glob,Grep,Agent,NotebookEdit'
    ];

    let result;

    // Try to resume existing session for conversation continuity
    if (this.sessionId) {
      try {
        result = await this._spawnClaude([...baseArgs, '--resume', this.sessionId]);
      } catch (err) {
        // Session expired or not found — start fresh
        console.log('Session resume failed, starting fresh:', err.message.slice(0, 100));
        this.sessionId = null;
        result = await this._spawnClaude(baseArgs);
      }
    } else {
      result = await this._spawnClaude(baseArgs);
    }

    // Parse JSON output
    let parsed;
    try {
      parsed = JSON.parse(result.stdout);
    } catch (err) {
      throw new Error(`Failed to parse Claude output: ${result.stdout.slice(0, 200)}`);
    }

    if (parsed.is_error) {
      // If session error, retry without resume
      if (this.sessionId && /session/i.test(parsed.result || '')) {
        console.log('Session error in response, retrying fresh');
        this.sessionId = null;
        return this.chat(userMessage);
      }
      throw new Error(parsed.result || 'Claude returned an error');
    }

    // Save session ID for continuity
    if (parsed.session_id) {
      this.sessionId = parsed.session_id;
    }

    const text = parsed.result || '';
    const inputTokens = parsed.usage?.input_tokens || 0;
    const outputTokens = parsed.usage?.output_tokens || 0;
    const costUsd = parsed.total_cost_usd || 0;

    // Infer which MCP tools were used from num_turns and response content
    const toolCalls = this._inferToolCalls(parsed, text);

    this.history.push({ role: 'assistant', content: text });
    this._saveHistory();

    return {
      text,
      toolCalls,
      inputTokens,
      outputTokens,
      costUsd
    };
  }

  /**
   * Streaming variant of chat(). Spawns `claude -p` with stream-json output and
   * invokes onEvent({type, ...}) as events arrive:
   *   { type:'session', sessionId }       — resolved session id
   *   { type:'tool',    name }            — a tool the agent actually called
   *   { type:'text',    text }            — an incremental text delta
   *   { type:'done',    text, toolCalls, inputTokens, outputTokens, costUsd }
   *   { type:'error',   message }
   * Resolves once the process closes. Does not throw on agent errors — emits 'error'.
   */
  async chatStream(userMessage, opts = {}) {
    const onEvent = opts.onEvent || (() => {});
    this.history.push({ role: 'user', content: userMessage });
    this._writeSystemPrompt(); // refresh date/persona each message
      const sysPrompt = fs.readFileSync(SYSTEM_PROMPT_FILE, 'utf-8');

    const baseArgs = [
      '-p', userMessage,
      '--mcp-config', MCP_CONFIG,
      '--output-format', 'stream-json',
      '--include-partial-messages',
      '--verbose',
      '--model', resolveModel(opts.model),
      '--permission-mode', 'bypassPermissions',
      '--system-prompt', sysPrompt,
      '--disallowed-tools', 'Edit,Write,Read,Glob,Grep,Agent,NotebookEdit'
    ];

    const args = this.sessionId ? [...baseArgs, '--resume', this.sessionId] : baseArgs;

    const collected = { text: '', toolCalls: [], inputTokens: 0, outputTokens: 0, costUsd: 0, isError: false, errorMsg: '' };
    const seenTools = new Set();

    const handleEvent = (evt) => {
      if (!evt || typeof evt !== 'object') return;
      // Session id arrives on the system init event (and again on result)
      if (evt.session_id) this.sessionId = evt.session_id;

      if (evt.type === 'stream_event' && evt.event) {
        const e = evt.event;
        if (e.type === 'content_block_delta' && e.delta?.type === 'text_delta' && e.delta.text) {
          onEvent({ type: 'text', text: e.delta.text });
        }
      } else if (evt.type === 'assistant' && evt.message?.content) {
        // Authoritative tool_use blocks — report the real tool name once each
        for (const block of evt.message.content) {
          if (block.type === 'tool_use') {
            const name = (block.name || '').replace(/^mcp__[^_]+__/, '');
            if (name && !seenTools.has(name)) {
              seenTools.add(name);
              collected.toolCalls.push({ tool: name });
              onEvent({ type: 'tool', name });
            }
          }
        }
      } else if (evt.type === 'result') {
        collected.text = evt.result || collected.text;
        collected.inputTokens = evt.usage?.input_tokens || 0;
        collected.outputTokens = evt.usage?.output_tokens || 0;
        collected.costUsd = evt.total_cost_usd || 0;
        if (evt.is_error) { collected.isError = true; collected.errorMsg = evt.result || 'Claude returned an error'; }
      }
    };

    let aborted = false;
    await new Promise((resolve) => {
      const proc = spawn(CLAUDE_BIN, args, {
        cwd: 'C:\\Users\\Cole\\Dropbox',
        timeout: 120000,
        env: SUBSCRIPTION_ENV,
        windowsHide: true
      });

      // Kill the whole tree on Windows (`claude` may have node children) so a
      // Stop actually halts generation and stops spending the subscription.
      const killTree = () => {
        try {
          if (process.platform === 'win32') spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true });
          else proc.kill('SIGTERM');
        } catch {}
      };
      if (opts.signal) {
        if (opts.signal.aborted) { aborted = true; killTree(); }
        else opts.signal.addEventListener('abort', () => { aborted = true; killTree(); }, { once: true });
      }

      let buffer = '';
      const drain = () => {
        let nl;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          try { handleEvent(JSON.parse(line)); } catch { /* skip non-JSON noise */ }
        }
      };

      proc.stdout.on('data', (chunk) => { buffer += chunk.toString(); drain(); });
      proc.stderr.on('data', () => {});
      proc.on('error', (err) => { if (!aborted) { collected.isError = true; collected.errorMsg = err.message; } resolve(); });
      proc.on('close', () => {
        if (!aborted && buffer.trim()) { try { handleEvent(JSON.parse(buffer.trim())); } catch {} }
        resolve();
      });
    });

    if (aborted) {
      // User stopped mid-turn: keep their message, drop the partial assistant turn, no 'done'.
      this._saveHistory();
      return { text: collected.text, toolCalls: collected.toolCalls, inputTokens: collected.inputTokens, outputTokens: collected.outputTokens, aborted: true };
    }

    if (collected.isError) {
      // Session expired mid-stream — retry once from a fresh session.
      if (this.sessionId && /session/i.test(collected.errorMsg)) {
        this.history.pop(); // remove the user turn we pushed; chatStream re-pushes it
        this.sessionId = null;
        return this.chatStream(userMessage, opts);
      }
      onEvent({ type: 'error', message: collected.errorMsg });
      this.history.pop();
      return { text: '', toolCalls: collected.toolCalls, inputTokens: 0, outputTokens: 0, error: collected.errorMsg };
    }

    this.history.push({ role: 'assistant', content: collected.text });
    this._saveHistory();

    const result = {
      text: collected.text,
      toolCalls: collected.toolCalls,
      inputTokens: collected.inputTokens,
      outputTokens: collected.outputTokens,
      costUsd: collected.costUsd
    };
    onEvent({ type: 'done', ...result });
    return result;
  }

  _spawnClaude(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(CLAUDE_BIN, args, {
        cwd: 'C:\\Users\\Cole\\Dropbox',
        timeout: 120000, // 2 min max
        env: SUBSCRIPTION_ENV,
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err) => reject(err));
      proc.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) {
          reject(new Error(`Claude exited with code ${code}: ${stderr.slice(0, 500)}`));
        } else {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
        }
      });
    });
  }

  /**
   * Infer which MCP tools were called based on response content and metadata.
   * Headless mode doesn't report tool calls directly, so we detect them heuristically.
   */
  _inferToolCalls(parsed, text) {
    const tools = [];
    const numTurns = parsed.num_turns || 1;

    // If only 1 turn, no tools were used
    if (numTurns <= 1) return tools;

    // Pattern-match response text for tool signatures
    const patterns = [
      { pattern: /\btask/i, tool: 'get_tasks' },
      { pattern: /\badded.*task|created.*task|new task/i, tool: 'add_task' },
      { pattern: /\bupdated.*task|changed.*task/i, tool: 'update_task' },
      { pattern: /\bcompleted?.*task|marked.*complete|done/i, tool: 'complete_task' },
      { pattern: /\bimport.*task/i, tool: 'import_tasks' },
      { pattern: /\bread.*file|file.*content/i, tool: 'read_file' },
      { pattern: /\bwrote.*file|saved.*file|written/i, tool: 'write_file' },
      { pattern: /\bdirector|folder|listing/i, tool: 'list_directory' },
      { pattern: /\bshell|command|ran |executed/i, tool: 'shell_command' },
      { pattern: /\bagent.*guide|hat|persona/i, tool: 'read_agent_guide' },
      { pattern: /\bpipeline/i, tool: 'list_pipelines' },
    ];

    const seen = new Set();
    for (const { pattern, tool } of patterns) {
      if (pattern.test(text) && !seen.has(tool)) {
        seen.add(tool);
        tools.push({ tool });
      }
    }

    // If we detected nothing but num_turns > 1, at least show something
    if (tools.length === 0 && numTurns > 1) {
      tools.push({ tool: 'mcp_tools' });
    }

    return tools;
  }

  clearHistory() {
    this.history = [];
    this.sessionId = null;
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

module.exports = { CopilotHeadless };
