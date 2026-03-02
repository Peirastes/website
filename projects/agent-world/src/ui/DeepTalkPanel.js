import { AGENT_TYPES } from '../data/agentDefinitions.js';

/**
 * Full-screen terminal overlay for Deep Talk sessions.
 * Renders streaming Claude CLI output with tool use badges.
 */
export class DeepTalkPanel {
  constructor() {
    this.isOpen = false;
    this.currentAgent = null;
    this.running = false;

    // Build DOM
    this.el = document.createElement('div');
    this.el.className = 'deep-talk-panel';

    this.header = document.createElement('div');
    this.header.className = 'dt-header';

    this.output = document.createElement('div');
    this.output.className = 'dt-output';

    this.inputRow = document.createElement('div');
    this.inputRow.className = 'dt-input-row';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'dt-input';
    this.input.placeholder = 'Send follow-up message...';
    this.input.autocomplete = 'off';

    this.inputRow.appendChild(this.input);
    this.el.appendChild(this.header);
    this.el.appendChild(this.output);
    this.el.appendChild(this.inputRow);

    document.getElementById('ui-overlay').appendChild(this.el);

    // Prevent Phaser from capturing keystrokes in input
    for (const evt of ['keydown', 'keyup', 'keypress']) {
      this.input.addEventListener(evt, (e) => e.stopPropagation());
    }

    // Callbacks (set by DeepTalkSystem)
    this.onSend = null;
    this.onStop = null;
    this.onClose = null;

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.input.value.trim()) {
        const msg = this.input.value.trim();
        this.input.value = '';
        if (this.onSend) this.onSend(msg);
      }
    });

    // Current assistant text block (for streaming accumulation)
    this._currentAssistantBlock = null;
  }

  open(agentTypeId) {
    this.currentAgent = agentTypeId;
    this.isOpen = true;
    const agentType = AGENT_TYPES[agentTypeId];

    this.header.innerHTML = `
      <div class="dt-agent-info">
        <div class="dt-avatar" style="background: ${agentType.color}">${agentType.shortName}</div>
        <div>
          <div class="dt-agent-name">${agentType.defaultNickname} — ${agentType.name}</div>
          <div class="dt-status" id="dt-status">Ready</div>
        </div>
      </div>
      <div class="dt-controls">
        <button class="dt-btn dt-stop-btn" id="dt-stop-btn" style="display:none;">Stop</button>
        <button class="dt-btn dt-close-btn" id="dt-close-btn">Close</button>
      </div>
    `;

    document.getElementById('dt-stop-btn').addEventListener('click', () => {
      if (this.onStop) this.onStop();
    });
    document.getElementById('dt-close-btn').addEventListener('click', () => {
      if (this.onClose) this.onClose();
    });

    this.output.innerHTML = '';
    this._currentAssistantBlock = null;
    this.el.style.display = 'flex';
    this.input.focus();
  }

  close() {
    this.isOpen = false;
    this.currentAgent = null;
    this.el.style.display = 'none';
    this._currentAssistantBlock = null;
  }

  setRunning(running) {
    this.running = running;
    const status = document.getElementById('dt-status');
    const stopBtn = document.getElementById('dt-stop-btn');
    if (status) status.textContent = running ? 'Working...' : 'Done';
    if (stopBtn) stopBtn.style.display = running ? 'inline-block' : 'none';
    this.input.placeholder = running ? 'Agent is working...' : 'Send follow-up message...';
  }

  appendUserMessage(text) {
    this._currentAssistantBlock = null;
    const div = document.createElement('div');
    div.className = 'dt-msg dt-msg-user';
    div.textContent = text;
    this.output.appendChild(div);
    this._scrollBottom();
  }

  appendAssistantText(text) {
    if (!this._currentAssistantBlock) {
      this._currentAssistantBlock = document.createElement('div');
      this._currentAssistantBlock.className = 'dt-msg dt-msg-assistant';
      this.output.appendChild(this._currentAssistantBlock);
    }
    this._currentAssistantBlock.textContent += text;
    this._scrollBottom();
  }

  appendToolUse(name, input) {
    this._currentAssistantBlock = null;
    const div = document.createElement('div');
    div.className = 'dt-msg dt-msg-tool';

    let summary = '';
    if (input) {
      if (name === 'Bash' && input.command) summary = input.command;
      else if (input.file_path) summary = input.file_path;
      else if (input.pattern) summary = input.pattern;
      else if (input.query) summary = input.query;
      else if (input.url) summary = input.url;
      else summary = JSON.stringify(input).slice(0, 200);
    }

    div.innerHTML = `<span class="dt-tool-badge">${this._escapeHtml(name)}</span> <span class="dt-tool-summary">${this._escapeHtml(summary)}</span>`;
    this.output.appendChild(div);
    this._scrollBottom();
  }

  appendToolResult(outputText, isError) {
    this._currentAssistantBlock = null;
    const div = document.createElement('div');
    div.className = 'dt-msg dt-msg-tool-result' + (isError ? ' dt-error' : '');
    const truncated = outputText && outputText.length > 500
      ? outputText.slice(0, 500) + '...'
      : (outputText || '(empty)');
    div.textContent = truncated;
    this.output.appendChild(div);
    this._scrollBottom();
  }

  appendSystemMessage(text, isError) {
    this._currentAssistantBlock = null;
    const div = document.createElement('div');
    div.className = 'dt-msg dt-msg-system' + (isError ? ' dt-error' : '');
    div.textContent = text;
    this.output.appendChild(div);
    this._scrollBottom();
  }

  _scrollBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  _escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
}
