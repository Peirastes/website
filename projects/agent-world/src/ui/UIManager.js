import { DialogSystem } from '../systems/DialogSystem.js';
import { ChatSystem } from '../systems/ChatSystem.js';
import { DeepTalkSystem } from '../systems/DeepTalkSystem.js';
import { ForumSystem } from '../systems/ForumSystem.js';
import { AGENT_TYPES } from '../data/agentDefinitions.js';

/**
 * DOM UI manager — replaces Phaser UIScene.
 * All DOM manipulation, no Phaser dependency.
 */
export class UIManager {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    this.expandedPip = null;
    this.allTasksOpen = false;

    this.deepTalkSystem = new DeepTalkSystem();
    this.deepTalkSystem.agentManager = gameWorld.agentManager;
    this.forumSystem = new ForumSystem();
    this.dialogSystem = new DialogSystem(gameWorld.agentManager, this.deepTalkSystem);
    this.chatSystem = new ChatSystem(gameWorld.agentManager);
    this.chatSystem.initInput();

    // ─── Event wiring ───
    gameWorld.events.on('openDialog', (agentTypeId) => {
      if (this.deepTalkSystem.isActive) return;
      this.dialogSystem.toggle(agentTypeId);
    });

    gameWorld.events.on('closeDialog', () => {
      this.dialogSystem.close();
    });

    // Forum events
    gameWorld.events.on('openForum', () => {
      if (this.deepTalkSystem.isActive) return;
      if (this.dialogSystem.isOpen) this.dialogSystem.close();
      this.forumSystem.open();
    });
    gameWorld.events.on('closeForum', () => {
      this.forumSystem.close();
    });

    // T key → free-form Deep Talk
    document.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T') {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (this.deepTalkSystem.isActive) return;
        if (this.dialogSystem.isOpen && this.dialogSystem.currentAgent) {
          const agentTypeId = this.dialogSystem.currentAgent;
          this.dialogSystem.close();
          this.deepTalkSystem.reopen(agentTypeId);
        }
      }
      if (e.key === 'Escape' && this.deepTalkSystem.isActive) {
        this.deepTalkSystem.close();
      }
      if (e.key === 'Escape' && this.forumSystem.isOpen) {
        this.forumSystem.close();
      }
    });

    // Bind Forum UI events (submit, follow-up, close)
    this.forumSystem.bindEvents();

    gameWorld.events.on('directivesUpdated', (agentTypeId) => {
      this.dialogSystem.refresh();
      this.updateHUD(gameWorld.agentManager);
    });

    gameWorld.events.on('allDirectivesLoaded', () => {
      this.updateHUD(gameWorld.agentManager);
    });

    gameWorld.events.on('interiorModified', ({ agentTypeId, type }) => {
      this.chatSystem.onInteriorModification(agentTypeId, type);
    });

    gameWorld.events.on('agentMoodChanged', ({ agentTypeId, oldMood, newMood }) => {
      this.chatSystem.onMoodChange(agentTypeId, oldMood, newMood);
    });

    // Idle chat timer
    this._scheduleIdleChat();
    // Cross-agent chat timer
    this._scheduleCrossChat();

    // Build initial HUD
    this.updateHUD(gameWorld.agentManager);
  }

  updateHUD(agentManager) {
    const hud = document.getElementById('status-hud');
    if (!hud) return;

    const summary = agentManager.getSummary();
    const moodColors = {
      idle: '#888888',
      working: '#44dd44',
      blocked: '#ff4444',
      celebrating: '#ffcc44'
    };

    let html = `
      <div class="agent-pip${this.allTasksOpen ? ' expanded' : ''}" data-pip="ALL" style="margin-bottom: 4px;">
        <div class="pip-dot" style="background: #aaaaaa"></div>
        <span style="color: #ccc; font-weight: bold;">ALL</span>
        <span class="pip-chevron">▼</span>
      </div>
    `;

    for (const [typeId, info] of Object.entries(summary)) {
      const dotColor = moodColors[info.mood] || '#888888';
      const expanded = this.expandedPip === typeId;

      const directives = agentManager.getDirectives(typeId);
      const activeTasks = directives
        ? directives.activeTasks.filter(t => !t.isComplete)
        : [];

      let ddHtml = '';
      if (activeTasks.length > 0) {
        ddHtml += `<div class="dd-header">Active Tasks</div>`;
        for (const task of activeTasks) {
          const blockedCls = task.isBlocked ? ' blocked' : '';
          const execBtn = (task.prompt && !task.isBlocked)
            ? `<span class="dd-exec" data-agent="${typeId}" data-prompt="${task.prompt.replace(/"/g, '&quot;')}">▶</span>`
            : '';
          ddHtml += `
            <div class="dd-task${blockedCls}" data-agent="${typeId}">
              <div class="dd-task-title">
                <span class="task-priority ${task.priority.toLowerCase()}" style="font-size:9px;padding:0 4px;margin-right:4px;">${task.priority}</span>
                ${execBtn}
                ${task.title}
              </div>
              <div class="dd-task-meta">${task.status}${task.target ? ` · ${task.target}` : ''}</div>
            </div>
          `;
        }
      } else {
        ddHtml += `<div class="dd-empty">No active tasks</div>`;
      }
      ddHtml += `<div class="dd-view-all" data-agent="${typeId}">View full profile</div>`;

      html += `
        <div class="agent-pip${expanded ? ' expanded' : ''}" data-pip="${typeId}">
          <div class="pip-dot" style="background: ${dotColor}"></div>
          <span style="color: ${info.color}; font-weight: bold;">${typeId}</span>
          <span>${info.activeTaskCount} tasks</span>
          ${info.blockedCount > 0 ? `<span style="color: #ff6b6b;">(${info.blockedCount} blocked)</span>` : ''}
          <span class="pip-chevron">▼</span>
          <div class="pip-dropdown${expanded ? ' visible' : ''}">${ddHtml}</div>
        </div>
      `;
    }

    hud.innerHTML = html;
    this.bindHUDEvents(agentManager);

    if (this.allTasksOpen) {
      this.renderAllTasks(agentManager);
    }
  }

  bindHUDEvents(agentManager) {
    const hud = document.getElementById('status-hud');
    if (!hud) return;

    hud.querySelectorAll('.agent-pip').forEach(pip => {
      pip.addEventListener('click', (e) => {
        if (e.target.closest('.pip-dropdown')) return;
        e.stopPropagation();
        const typeId = pip.dataset.pip;

        if (typeId === 'ALL') {
          this.allTasksOpen = !this.allTasksOpen;
          this.expandedPip = null;
          if (this.allTasksOpen) {
            this.renderAllTasks(agentManager);
            this.bindAllTasksEvents(agentManager);
          } else {
            const panel = document.getElementById('all-tasks-panel');
            if (panel) panel.classList.remove('visible');
          }
          this.updateHUD(agentManager);
        } else {
          if (this.allTasksOpen) {
            this.allTasksOpen = false;
            const panel = document.getElementById('all-tasks-panel');
            if (panel) panel.classList.remove('visible');
          }
          this.expandedPip = this.expandedPip === typeId ? null : typeId;
          this.updateHUD(agentManager);
        }
      });
    });

    hud.querySelectorAll('.dd-exec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const typeId = btn.dataset.agent;
        const prompt = btn.dataset.prompt;
        this.expandedPip = null;
        this.updateHUD(agentManager);
        this.deepTalkSystem.start(typeId, prompt);
      });
    });

    hud.querySelectorAll('.dd-task').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const typeId = row.dataset.agent;
        this.expandedPip = null;
        this.updateHUD(agentManager);
        this.gameWorld.events.emit('openDialog', typeId);
      });
    });

    hud.querySelectorAll('.dd-view-all').forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        const typeId = link.dataset.agent;
        this.expandedPip = null;
        this.updateHUD(agentManager);
        this.gameWorld.events.emit('openDialog', typeId);
      });
    });

    if (!this._hudOutsideHandler) {
      this._agentManagerRef = agentManager;
      this._hudOutsideHandler = (e) => {
        const outsideHud = !e.target.closest('.status-hud');
        const outsidePanel = !e.target.closest('.all-tasks-panel');
        if (this.expandedPip && outsideHud) {
          this.expandedPip = null;
          this.updateHUD(this._agentManagerRef);
        }
        if (this.allTasksOpen && outsideHud && outsidePanel) {
          this.allTasksOpen = false;
          const panel = document.getElementById('all-tasks-panel');
          if (panel) panel.classList.remove('visible');
          this.updateHUD(this._agentManagerRef);
        }
      };
      document.addEventListener('click', this._hudOutsideHandler);
    }
  }

  renderAllTasks(agentManager) {
    const panel = document.getElementById('all-tasks-panel');
    if (!panel) return;

    const summary = agentManager.getSummary();
    const allTasks = [];

    for (const [typeId, info] of Object.entries(summary)) {
      const directives = agentManager.getDirectives(typeId);
      if (!directives) continue;
      for (const task of directives.activeTasks.filter(t => !t.isComplete)) {
        allTasks.push({ ...task, typeId, agentColor: info.color });
      }
    }

    const priOrder = { p1: 1, p2: 2, p3: 3, p4: 4, p5: 5 };
    allTasks.sort((a, b) => {
      const pa = priOrder[a.priority.toLowerCase()] || 9;
      const pb = priOrder[b.priority.toLowerCase()] || 9;
      if (pa !== pb) return pa - pb;
      return (a.isBlocked ? 1 : 0) - (b.isBlocked ? 1 : 0);
    });

    const groups = {};
    for (const t of allTasks) {
      const key = t.priority.toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }

    let html = `
      <div class="atp-header">
        <span class="atp-header-title">All Tasks (${allTasks.length} active)</span>
        <span class="atp-close" id="atp-close">✕</span>
      </div>
    `;

    if (allTasks.length === 0) {
      html += `<div class="atp-empty">No active tasks across any agent</div>`;
    } else {
      for (const [pri, tasks] of Object.entries(groups)) {
        html += `<div class="atp-section-header">${pri} — ${tasks.length} task${tasks.length > 1 ? 's' : ''}</div>`;
        for (const task of tasks) {
          const blockedCls = task.isBlocked ? ' blocked' : '';
          const execBtn = (task.prompt && !task.isBlocked)
            ? `<span class="atp-exec" data-agent="${task.typeId}" data-prompt="${task.prompt.replace(/"/g, '&quot;')}">▶</span>`
            : '';
          html += `
            <div class="atp-task${blockedCls}" data-agent="${task.typeId}">
              <div class="atp-agent-dot" style="background: ${task.agentColor}"></div>
              <div class="atp-task-body">
                <div class="atp-task-title">
                  <span class="task-priority ${task.priority.toLowerCase()}" style="font-size:9px;padding:0 4px;margin-right:4px;">${task.priority}</span>
                  <span style="color:${task.agentColor};font-size:10px;font-weight:700;margin-right:4px;">${task.typeId}</span>
                  ${task.title}
                </div>
                <div class="atp-task-meta">${task.status}${task.target ? ` · ${task.target}` : ''}</div>
              </div>
              ${execBtn}
            </div>
          `;
        }
      }
    }

    panel.innerHTML = html;
    panel.classList.add('visible');
  }

  bindAllTasksEvents(agentManager) {
    const panel = document.getElementById('all-tasks-panel');
    if (!panel) return;

    const closeBtn = document.getElementById('atp-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.allTasksOpen = false;
        panel.classList.remove('visible');
        this.updateHUD(agentManager);
      });
    }

    panel.querySelectorAll('.atp-task').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.atp-exec')) return;
        e.stopPropagation();
        const typeId = row.dataset.agent;
        this.allTasksOpen = false;
        panel.classList.remove('visible');
        this.updateHUD(agentManager);
        this.gameWorld.events.emit('openDialog', typeId);
      });
    });

    panel.querySelectorAll('.atp-exec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const typeId = btn.dataset.agent;
        const prompt = btn.dataset.prompt;
        this.allTasksOpen = false;
        panel.classList.remove('visible');
        this.updateHUD(agentManager);
        this.deepTalkSystem.start(typeId, prompt);
      });
    });
  }

  _scheduleIdleChat() {
    const delay = 8000 + Math.random() * 7000;
    setTimeout(() => {
      this.chatSystem.generateIdleChat();
      this._scheduleIdleChat();
    }, delay);
  }

  _scheduleCrossChat() {
    const delay = 25000 + Math.random() * 20000;
    setTimeout(() => {
      this.chatSystem.generateCrossAgentChat();
      this._scheduleCrossChat();
    }, delay);
  }
}
