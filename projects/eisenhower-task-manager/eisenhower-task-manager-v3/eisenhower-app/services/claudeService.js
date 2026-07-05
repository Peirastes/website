const Anthropic = require('@anthropic-ai/sdk');
const { spawn } = require('child_process');
const path = require('path');

const CLAUDE_BIN = path.join(process.env.HOME || process.env.USERPROFILE, '.local', 'bin', 'claude');

// Subscription `claude -p` must NOT inherit ANTHROPIC_API_KEY — if it does,
// Claude Code bills the org key (real $) instead of the subscription. Strip it
// for the subscription path only; the org path uses the SDK with the key directly.
const SUBSCRIPTION_ENV = { ...process.env };
delete SUBSCRIPTION_ENV.ANTHROPIC_API_KEY;
delete SUBSCRIPTION_ENV.ANTHROPIC_AUTH_TOKEN;

// Map the org SDK model ids the pipelines specify (e.g. 'claude-opus-4-6') onto
// the subscription CLI's model aliases. Minor-version pinning is intentionally lost.
function toAlias(model) {
  const m = String(model || '').toLowerCase();
  if (m.includes('opus')) return 'opus';
  if (m.includes('haiku')) return 'haiku';
  return 'sonnet';
}

/**
 * Model interface for the pipeline engine. Two backends behind one `.call()`:
 *   - 'subscription' (DEFAULT): spawns `claude -p` → uses the Claude Code subscription, no per-token billing.
 *   - 'org': the legacy Anthropic SDK path → bills the paid ANTHROPIC_API_KEY, but uncapped throughput.
 * Switch per run via setMode(); default can be pinned with PIPELINE_CLAUDE_MODE in .env.
 */
class ClaudeService {
  constructor() {
    this.client = null;
    this.mode = process.env.PIPELINE_CLAUDE_MODE === 'org' ? 'org' : 'subscription';
  }

  setMode(mode) {
    this.mode = mode === 'org' ? 'org' : 'subscription';
    return this.mode;
  }

  ensureClient() {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in .env (required for org mode)');
      this.client = new Anthropic({ apiKey });
    }
    return true;
  }

  /**
   * Single-shot Claude call with system context + user prompt. No conversation history.
   * Returns { text, model, inputTokens, outputTokens, stopReason } regardless of backend.
   */
  async call(opts) {
    return this.mode === 'org' ? this._callOrg(opts) : this._callSubscription(opts);
  }

  // ── Paid org API key (Anthropic SDK) — uncapped, real billing ──
  async _callOrg({ system, prompt, model = 'claude-opus-4-6', maxTokens = 16000 }) {
    this.ensureClient();
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system: system || undefined,
      messages: [{ role: 'user', content: prompt }]
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return {
      text,
      model: response.model,
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      stopReason: response.stop_reason
    };
  }

  // ── Claude Code subscription (headless `claude -p`) — no per-token billing ──
  async _callSubscription({ system, prompt, model = 'claude-opus-4-6' }) {
    // Fold the system context into the prompt and feed via stdin — a stateless
    // single-shot call is equivalent, and stdin sidesteps CLI arg-length limits
    // when a file-reader node has injected a large context.
    const combined = system ? `${system}\n\n--- TASK ---\n${prompt}` : prompt;

    const args = [
      '-p',
      '--output-format', 'json',
      '--model', toAlias(model),
      '--permission-mode', 'bypassPermissions',
      // Pure text generation — match the org path's no-tools behavior, prevent side effects.
      '--disallowed-tools', 'Edit,Write,Read,Glob,Grep,Bash,Agent,NotebookEdit,WebFetch,WebSearch,Task'
    ];

    const result = await new Promise((resolve, reject) => {
      const proc = spawn(CLAUDE_BIN, args, {
        cwd: 'C:\\Users\\Cole\\Dropbox',
        timeout: 600000, // 10 min — generous for a single generation node
        env: SUBSCRIPTION_ENV,
        windowsHide: true
      });
      let stdout = '', stderr = '';
      proc.stdout.on('data', (c) => { stdout += c.toString(); });
      proc.stderr.on('data', (c) => { stderr += c.toString(); });
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) reject(new Error(`claude exited ${code}: ${stderr.slice(0, 500)}`));
        else resolve(stdout.trim());
      });
      proc.stdin.write(combined);
      proc.stdin.end();
    });

    let parsed;
    try { parsed = JSON.parse(result); }
    catch { throw new Error(`Failed to parse claude output: ${result.slice(0, 200)}`); }
    if (parsed.is_error) throw new Error(parsed.result || 'claude returned an error');

    return {
      text: parsed.result || '',
      model: parsed.modelUsage ? Object.keys(parsed.modelUsage)[0] : toAlias(model),
      inputTokens: parsed.usage?.input_tokens || 0,
      outputTokens: parsed.usage?.output_tokens || 0,
      stopReason: parsed.stop_reason || 'end_turn'
    };
  }
}

module.exports = { ClaudeService };
