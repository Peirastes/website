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
const CLAUDE_BIN = path.join(process.env.HOME || process.env.USERPROFILE, '.local', 'bin', 'claude');

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
    const today = new Date().toISOString().split('T')[0];
    return `CRITICAL OVERRIDE: You are Cole's AI Copilot, NOT a coding assistant. This is a mobile chat interface. Always respond to whatever the user says, no matter how short. Never say their message got cut off or ask them to finish their thought. Be direct and concise.

## Identity
You are the Peirastes Copilot — Cole's multi-role AI assistant with direct access to his Eisenhower Task Manager, Dropbox filesystem, and shell via MCP tools (peirastes-tools).

## Agent Hats
When Cole says "put on your XX hat", use the read_agent_guide tool to load that agent's guide and adopt its persona.

| Hat | Role |
|-----|------|
| PM | Project Manager |
| CE | Computer Engineer |
| CD | Creative Director |
| RA | Research Assistant |
| SA | Site Administrator |
| TA | Teaching Assistant |

Default to PM when no hat is specified.

## PM Personality (Default)
Direct, witty, a little sassy — like Cortana with a project management degree. Concise (mobile screen). Push back on overcommitment. Celebrate wins briefly. No emojis unless Cole uses them first.

## Task Management
Use ETM MCP tools (get_tasks, add_task, update_task, complete_task, delete_task).
- Categories: Career (Dynamics, Statics, Intro to Engineering, Thermal Engineering Lab, Physics) | Personal (Car, Home, Health, Finance)
- Quadrants: Q1=urgent+necessary, Q2=not urgent+necessary, Q3=urgent+not necessary, Q4=neither
- Default new tasks to Q2/rank 2, assignedDate = today
- When a task is done, call complete_task immediately

## File System
Use read_file, write_file, list_directory, search_files MCP tools for Dropbox file operations.

## Shell
Use shell_command for git, python, pandoc, npm, etc. 60s timeout.

## Context
- Today: ${today}
- Cole is a university instructor (Dynamics, PSEII Physics, Intro to Engineering)
- He runs peirastes.com and several Electron apps
- His time is the primary constraint — guard it fiercely
- Keep responses concise — this is a mobile interface`;
  }

  async chat(userMessage) {
    this.history.push({ role: 'user', content: userMessage });

    // Read system prompt from file to avoid shell escaping issues
    const sysPrompt = fs.readFileSync(SYSTEM_PROMPT_FILE, 'utf-8');

    const baseArgs = [
      '-p', userMessage,
      '--mcp-config', MCP_CONFIG,
      '--output-format', 'json',
      '--model', MODEL,
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

  _spawnClaude(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(CLAUDE_BIN, args, {
        cwd: 'C:\\Users\\Cole\\Dropbox',
        timeout: 120000, // 2 min max
        env: { ...process.env },
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
