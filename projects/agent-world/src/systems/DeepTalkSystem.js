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
    this.currentTask = null;    // task object from directives (if executing a task)
    this.agentManager = null;   // set externally after construction

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
  start(agentTypeId, prompt, task = null) {
    this.currentAgent = agentTypeId;
    this.isActive = true;
    this.hasSession = false;
    this.currentTask = task;

    this.panel.open(agentTypeId);

    // Mark task as in-progress
    if (task) {
      task.status = 'In Progress (executing)';
      this._refreshDialog();
    }

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
          this.panel.appendSystemMessage('Connected.');
        }
        // Skip other system messages (noisy)
        break;

      case 'assistant':
        // Only show text blocks — skip tool_use and tool_result details
        if (event.content) {
          for (const block of event.content) {
            if (block.type === 'text') {
              this.panel.appendAssistantText(block.text);
            } else if (block.type === 'tool_use') {
              this.panel.appendToolUse(block.name);
            }
            // Skip tool_result — too verbose
          }
        }
        if (event.message && !event.content) {
          const msg = typeof event.message === 'string' ? event.message : JSON.stringify(event.message);
          this.panel.appendAssistantText(msg);
        }
        break;

      case 'content_block_start':
        if (event.content_block?.type === 'tool_use') {
          this.panel.appendToolUse(event.content_block.name);
        }
        break;

      case 'content_block_delta':
        if (event.delta?.type === 'text_delta') {
          this.panel.appendAssistantText(event.delta.text);
        }
        break;

      case 'result':
        if (event.result) {
          this.panel.appendAssistantText(event.result);
        }
        if (event.cost_usd !== undefined) {
          this.panel.appendSystemMessage(`Cost: $${event.cost_usd.toFixed(4)}`);
        }
        break;

      case 'error':
        this.panel.appendSystemMessage(event.message || 'Unknown error', true);
        break;

      // Skip raw, stderr, and unknown events — too noisy
      default:
        break;
    }
  }

  handleExit(exitCode) {
    this.panel.setRunning(false);
    if (exitCode === 0) {
      this.panel.appendSystemMessage('Agent finished successfully.');
      // Mark task complete
      if (this.currentTask) {
        this.currentTask.status = 'Complete';
        this.currentTask.isComplete = true;
        this._refreshDialog();
      }
    } else if (exitCode === null || exitCode === 143) {
      this.panel.appendSystemMessage('Agent stopped by player.');
      if (this.currentTask) {
        this.currentTask.status = 'Stopped by player';
        this._refreshDialog();
      }
    } else {
      this.panel.appendSystemMessage(`Agent exited with code ${exitCode}.`, true);
      if (this.currentTask) {
        this.currentTask.status = `Failed (exit ${exitCode})`;
        this._refreshDialog();
      }
    }
    this.currentTask = null;
  }

  /** Refresh the dialog panel if it exists */
  _refreshDialog() {
    if (this.agentManager) {
      this.agentManager.updateMood(this.currentAgent);
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
    // Hide the panel but let the agent keep running in the background
    this.panel.close();
    this.isActive = false;
    // Preserve currentAgent and hasSession so we can reopen
  }

  /**
   * Reopen the panel for a background-running agent (or start fresh).
   */
  reopen(agentTypeId) {
    if (this.currentAgent === agentTypeId && this.hasSession) {
      // Agent still running — just show the panel again with existing output
      this.isActive = true;
      this.panel.el.style.display = 'flex';
      this.panel.isOpen = true;
      return;
    }
    // No existing session — start fresh
    this.start(agentTypeId);
  }
}
