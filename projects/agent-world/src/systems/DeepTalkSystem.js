import { DeepTalkPanel } from '../ui/DeepTalkPanel.js';
import { AGENT_TYPES } from '../data/agentDefinitions.js';

/**
 * Orchestrates Deep Talk sessions — panel + IPC bridge to Claude CLI.
 */
export class DeepTalkSystem {
  constructor() {
    this.isActive = false;
    this.currentAgent = null;
    this.hasSession = false;

    this.panel = new DeepTalkPanel();

    // Wire panel callbacks
    this.panel.onSend = (msg) => this.sendFollowUp(msg);
    this.panel.onStop = () => this.stopAgent();
    this.panel.onClose = () => this.close();

    // Register IPC listeners
    if (window.agentWorld) {
      window.agentWorld.onDeepTalkEvent((data) => {
        if (data.agentTypeId === this.currentAgent) {
          this.handleEvent(data.event);
        }
      });
      window.agentWorld.onDeepTalkExit((data) => {
        if (data.agentTypeId === this.currentAgent) {
          this.handleExit(data.exitCode);
        }
      });
    }
  }

  /**
   * Start a deep talk session.
   * @param {string} agentTypeId
   * @param {string} [prompt] - If provided, execute immediately. Otherwise wait for player input.
   */
  start(agentTypeId, prompt) {
    this.currentAgent = agentTypeId;
    this.isActive = true;
    this.hasSession = false;

    this.panel.open(agentTypeId);

    if (prompt) {
      this.executePrompt(prompt);
    } else {
      this.panel.appendSystemMessage('Type a message to begin the conversation.');
    }
  }

  executePrompt(prompt) {
    if (!window.agentWorld) {
      this.panel.appendSystemMessage('Cannot execute — not running in Electron.', true);
      return;
    }

    this.panel.setRunning(true);
    this.panel.appendUserMessage(prompt.length > 300 ? prompt.slice(0, 300) + '...' : prompt);

    const agentType = AGENT_TYPES[this.currentAgent];
    this.panel.appendSystemMessage(`Starting ${agentType.defaultNickname}...`);

    window.agentWorld.startDeepTalk(this.currentAgent, prompt);
    this.hasSession = true;
  }

  sendFollowUp(message) {
    if (!window.agentWorld) return;

    this.panel.appendUserMessage(message);

    if (!this.hasSession) {
      // First message in free-form mode — prepend hat instruction
      const agentType = AGENT_TYPES[this.currentAgent];
      const fullPrompt = `Put on your ${this.currentAgent} hat. ${message}`;
      this.panel.setRunning(true);
      this.panel.appendSystemMessage(`Starting ${agentType.defaultNickname}...`);
      window.agentWorld.startDeepTalk(this.currentAgent, fullPrompt);
      this.hasSession = true;
    } else {
      // Resume existing session
      this.panel.setRunning(true);
      window.agentWorld.resumeDeepTalk(this.currentAgent, message);
    }
  }

  handleEvent(event) {
    if (!event) return;

    switch (event.type) {
      case 'system':
        if (event.subtype === 'init') {
          this.panel.appendSystemMessage(`Session: ${event.session_id || 'connected'}`);
        } else {
          this.panel.appendSystemMessage(event.message || JSON.stringify(event));
        }
        break;

      case 'assistant':
        // Content block array
        if (event.content) {
          for (const block of event.content) {
            if (block.type === 'text') {
              this.panel.appendAssistantText(block.text);
            } else if (block.type === 'tool_use') {
              this.panel.appendToolUse(block.name, block.input);
            } else if (block.type === 'tool_result') {
              const text = typeof block.content === 'string'
                ? block.content
                : JSON.stringify(block.content);
              this.panel.appendToolResult(text, block.is_error);
            }
          }
        }
        // Single message field
        if (event.message) {
          this.panel.appendAssistantText(event.message);
        }
        break;

      case 'content_block_start':
        if (event.content_block) {
          if (event.content_block.type === 'tool_use') {
            this.panel.appendToolUse(event.content_block.name, event.content_block.input);
          }
        }
        break;

      case 'content_block_delta':
        if (event.delta) {
          if (event.delta.type === 'text_delta') {
            this.panel.appendAssistantText(event.delta.text);
          } else if (event.delta.type === 'input_json_delta') {
            // Tool input streaming — skip (we show it on tool_use)
          }
        }
        break;

      case 'result':
        // Final result from claude CLI
        if (event.result) {
          this.panel.appendAssistantText(event.result);
        }
        if (event.cost_usd !== undefined) {
          this.panel.appendSystemMessage(`Cost: $${event.cost_usd.toFixed(4)}`);
        }
        break;

      case 'raw':
        this.panel.appendSystemMessage(event.text);
        break;

      case 'stderr':
        this.panel.appendSystemMessage(event.text);
        break;

      case 'error':
        this.panel.appendSystemMessage(event.message || 'Unknown error', true);
        break;

      default:
        // Unknown event type — show as system message
        if (event.type) {
          this.panel.appendSystemMessage(`[${event.type}] ${event.message || ''}`);
        }
        break;
    }
  }

  handleExit(exitCode) {
    this.panel.setRunning(false);
    if (exitCode === 0) {
      this.panel.appendSystemMessage('Agent finished successfully.');
    } else if (exitCode === null || exitCode === 143) {
      this.panel.appendSystemMessage('Agent stopped by player.');
    } else {
      this.panel.appendSystemMessage(`Agent exited with code ${exitCode}.`, true);
    }
  }

  stopAgent() {
    if (window.agentWorld && this.currentAgent) {
      window.agentWorld.stopDeepTalk(this.currentAgent);
    }
    this.panel.setRunning(false);
    this.panel.appendSystemMessage('Stopping agent...');
  }

  close() {
    if (this.panel.running) {
      this.stopAgent();
    }
    this.panel.close();
    this.isActive = false;
    this.currentAgent = null;
    this.hasSession = false;
  }
}
