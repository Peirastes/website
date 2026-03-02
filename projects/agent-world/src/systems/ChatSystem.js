import { AGENT_TYPES, AGENT_TYPE_IDS } from '../data/agentDefinitions.js';
import { CHAT_MESSAGES } from '../data/chatMessages.js';

/**
 * Task-derived message templates.
 * Idle/working/blocked/cross-agent lines all reference real tasks.
 * Interior modification lines stay canned (event-driven, task-irrelevant).
 */
const WORKING_TEMPLATES = [
  (t) => `Working on ${t.title}.`,
  (t) => `Focused on ${t.title} right now.`,
  (t) => `Making progress on ${t.title}.`,
  (t) => `Heads down on ${t.title}.`,
  (t) => `${t.title} — ${t.status || 'in progress'}.`,
  (t) => `${t.priority} task: ${t.title}.`,
];

const BLOCKED_TEMPLATES = [
  (t) => `Stuck on ${t.title}. Can't move forward.`,
  (t) => `${t.title} is blocked. ${t.status || 'Waiting'}.`,
  (t) => `Can't proceed with ${t.title} yet.`,
  (t) => `Blocked on ${t.title}. Need help.`,
  (t) => `${t.title} — stalled. ${t.status || 'Dependencies pending'}.`,
];

const IDLE_LINES = [
  'Nothing on the board right now.',
  'All clear. Standing by for tasks.',
  'Queue is empty. Catching my breath.',
  'No active work at the moment.',
];

const CROSS_TEMPLATES = [
  (name, task) => `Hey ${name}, how's ${task.title} coming along?`,
  (name, task) => `${name} is on ${task.title} — keeping tabs.`,
  (name, task) => `Checking in — ${name}, any update on ${task.title}?`,
  (name, task) => `${name}, need a hand with ${task.title}?`,
];

const MOOD_TO_WORKING = [
  (t) => `Starting on ${t.title}. Let's go.`,
  (t) => `Picking up ${t.title}.`,
  (t) => `Got ${t.title} on my plate now.`,
];

const MOOD_TO_BLOCKED = [
  (t) => `Just hit a wall on ${t.title}.`,
  (t) => `${t.title} just got blocked.`,
  (t) => `Running into issues with ${t.title}.`,
];

const MOOD_TO_IDLE = [
  'Just wrapped up. Queue is clear.',
  'Done with my tasks for now.',
  'All caught up. Standing by.',
];

/**
 * Campus Chatter — persistent chat log showing agent activity.
 * Messages are derived from actual agent tasks and directives.
 * Interior modification lines remain canned (they're event-driven).
 */
export class ChatSystem {
  constructor(agentManager) {
    this.agentManager = agentManager;
    this.container = document.getElementById('chat-messages');
    this.messages = [];
    this.maxMessages = 50;

    // Anti-repeat: track recent messages per agent
    this.recentLines = {};
    for (const id of AGENT_TYPE_IDS) this.recentLines[id] = [];

    // Per-agent cooldown (timestamp of last post)
    this.lastPost = {};
    for (const id of AGENT_TYPE_IDS) this.lastPost[id] = 0;

    this.cooldownMs = 15000;

    // Suppress scripted chat after player sends a message
    this.lastPlayerChat = 0;
    this.playerChatCooldownMs = 30000;
  }

  /**
   * Append a message to the chat log.
   */
  addMessage(agentTypeId, text) {
    const msg = { agentTypeId, text, time: Date.now() };
    this.messages.push(msg);

    // Prune oldest if over cap
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
      if (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    }

    this.renderNewMessage(msg);
    this.lastPost[agentTypeId] = Date.now();
  }

  /**
   * Create and append a single chat message DOM element.
   */
  renderNewMessage(msg) {
    const agentType = AGENT_TYPES[msg.agentTypeId];
    const agent = this.agentManager.getAgent(msg.agentTypeId);
    const name = agent ? agent.name : agentType.defaultNickname;

    const el = document.createElement('div');
    el.className = 'chat-msg';
    el.innerHTML = `<span class="chat-name" style="color:${agentType.color}">${name}</span> ${this.escapeHtml(msg.text)}`;
    this.container.appendChild(el);

    // Auto-scroll to bottom
    this.container.scrollTop = this.container.scrollHeight;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Check per-agent cooldown.
   */
  isOnCooldown(agentTypeId) {
    return Date.now() - this.lastPost[agentTypeId] < this.cooldownMs;
  }

  /**
   * Generate a line from templates + task, checking for repeats.
   * Returns null if it would repeat a recent line for this agent.
   */
  generateLine(agentTypeId, templates, task) {
    const tmpl = templates[Math.floor(Math.random() * templates.length)];
    const line = task ? tmpl(task) : tmpl;
    const recent = this.recentLines[agentTypeId];
    if (recent.includes(line)) return null;
    recent.push(line);
    if (recent.length > 5) recent.shift();
    return line;
  }

  /**
   * Post a task-derived line from one random agent.
   * Working agents mention their active task; blocked agents mention the blocker.
   */
  generateIdleChat() {
    if (Date.now() - this.lastPlayerChat < this.playerChatCooldownMs) return;

    const shuffled = [...AGENT_TYPE_IDS].sort(() => Math.random() - 0.5);

    for (const typeId of shuffled) {
      if (this.isOnCooldown(typeId)) continue;

      const directives = this.agentManager.getDirectives(typeId);
      if (!directives) continue;

      const active = directives.activeTasks.filter(t => !t.isComplete);
      const blocked = active.filter(t => t.isBlocked);
      const working = active.filter(t => !t.isBlocked);

      let line = null;

      if (blocked.length > 0 && Math.random() < 0.6) {
        const task = blocked[Math.floor(Math.random() * blocked.length)];
        line = this.generateLine(typeId, BLOCKED_TEMPLATES, task);
      } else if (working.length > 0) {
        const task = working[Math.floor(Math.random() * working.length)];
        line = this.generateLine(typeId, WORKING_TEMPLATES, task);
      } else {
        const pick = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
        const recent = this.recentLines[typeId];
        if (!recent.includes(pick)) {
          recent.push(pick);
          if (recent.length > 5) recent.shift();
          line = pick;
        }
      }

      if (line) {
        this.addMessage(typeId, line);
        return;
      }
    }
  }

  /**
   * Post a cross-agent line referencing another agent's actual task.
   */
  generateCrossAgentChat() {
    if (Date.now() - this.lastPlayerChat < this.playerChatCooldownMs) return;

    const shuffled = [...AGENT_TYPE_IDS].sort(() => Math.random() - 0.5);

    for (const speakerId of shuffled) {
      if (this.isOnCooldown(speakerId)) continue;

      const others = AGENT_TYPE_IDS
        .filter(id => id !== speakerId)
        .sort(() => Math.random() - 0.5);

      for (const targetId of others) {
        const directives = this.agentManager.getDirectives(targetId);
        if (!directives) continue;

        const active = directives.activeTasks.filter(t => !t.isComplete);
        if (active.length === 0) continue;

        const task = active[Math.floor(Math.random() * active.length)];
        const targetAgent = this.agentManager.getAgent(targetId);
        const targetName = targetAgent ? targetAgent.name : AGENT_TYPES[targetId].defaultNickname;

        const tmpl = CROSS_TEMPLATES[Math.floor(Math.random() * CROSS_TEMPLATES.length)];
        const line = tmpl(targetName, task);

        const recent = this.recentLines[speakerId];
        if (recent.includes(line)) continue;
        recent.push(line);
        if (recent.length > 5) recent.shift();

        this.addMessage(speakerId, line);
        return;
      }
    }
  }

  /**
   * Called when an agent modifies their interior. Uses canned lines.
   */
  onInteriorModification(agentTypeId, type) {
    const categoryMap = { add: 'interiorAdd', swap: 'interiorSwap', remove: 'interiorRemove' };
    const category = categoryMap[type] || 'interiorAdd';

    const bank = CHAT_MESSAGES[agentTypeId];
    if (!bank || !bank[category]) return;

    const lines = bank[category];
    const recent = this.recentLines[agentTypeId];
    const available = lines.filter(l => !recent.includes(l));
    const pool = available.length > 0 ? available : lines;
    const pick = pool[Math.floor(Math.random() * pool.length)];

    recent.push(pick);
    if (recent.length > 5) recent.shift();

    this.addMessage(agentTypeId, pick);
  }

  /**
   * Called when an agent's mood changes. References actual tasks.
   */
  onMoodChange(agentTypeId, oldMood, newMood) {
    const directives = this.agentManager.getDirectives(agentTypeId);
    const active = directives
      ? directives.activeTasks.filter(t => !t.isComplete)
      : [];
    const blocked = active.filter(t => t.isBlocked);
    const working = active.filter(t => !t.isBlocked);

    let line = null;

    if (newMood === 'working' && working.length > 0) {
      const task = working[Math.floor(Math.random() * working.length)];
      line = this.generateLine(agentTypeId, MOOD_TO_WORKING, task);
    } else if (newMood === 'blocked' && blocked.length > 0) {
      const task = blocked[Math.floor(Math.random() * blocked.length)];
      line = this.generateLine(agentTypeId, MOOD_TO_BLOCKED, task);
    } else if (newMood === 'idle') {
      const pick = MOOD_TO_IDLE[Math.floor(Math.random() * MOOD_TO_IDLE.length)];
      line = pick;
    }

    if (line) this.addMessage(agentTypeId, line);
  }

  // ─── Player Chat Input ──────────────────────────────────────────────────────

  initInput() {
    this.input = document.getElementById('chat-input');
    if (!this.input) return;

    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // prevent Phaser from eating keystrokes
      if (e.key === 'Enter' && this.input.value.trim()) {
        this.sendToAgents(this.input.value.trim());
        this.input.value = '';
      }
    });

    // Also stop keyup/keypress from reaching Phaser
    this.input.addEventListener('keyup', (e) => e.stopPropagation());
    this.input.addEventListener('keypress', (e) => e.stopPropagation());
  }

  addPlayerMessage(text) {
    const el = document.createElement('div');
    el.className = 'chat-msg player-msg';
    el.innerHTML = `<span class="chat-name">You</span> ${this.escapeHtml(text)}`;
    this.container.appendChild(el);
    this.container.scrollTop = this.container.scrollHeight;

    this.messages.push({ agentTypeId: 'PLAYER', text, time: Date.now() });
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
      if (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    }
  }

  showTypingIndicator() {
    this.typingEl = document.createElement('div');
    this.typingEl.className = 'chat-typing';
    this.typingEl.textContent = 'Agents are typing...';
    this.container.appendChild(this.typingEl);
    this.container.scrollTop = this.container.scrollHeight;
  }

  hideTypingIndicator() {
    if (this.typingEl && this.typingEl.parentNode) {
      this.typingEl.parentNode.removeChild(this.typingEl);
      this.typingEl = null;
    }
  }

  addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'chat-system-msg';
    el.textContent = text;
    this.container.appendChild(el);
    this.container.scrollTop = this.container.scrollHeight;
  }

  async sendToAgents(text) {
    this.lastPlayerChat = Date.now();
    this.addPlayerMessage(text);
    this.input.disabled = true;
    this.showTypingIndicator();

    try {
      const result = await window.agentWorld.sendChat(text);
      this.hideTypingIndicator();

      if (result.error) {
        this.addSystemMessage(result.error);
      } else if (result.messages) {
        for (const msg of result.messages) {
          if (AGENT_TYPE_IDS.includes(msg.agent)) {
            this.addMessage(msg.agent, msg.text);
          }
        }
      }
    } catch (err) {
      this.hideTypingIndicator();
      this.addSystemMessage('Failed to reach agents.');
    }

    this.input.disabled = false;
    this.input.focus();
  }
}
