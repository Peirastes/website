import { AGENT_TYPES } from '../data/agentDefinitions.js';

/**
 * Manages the dialog panel DOM overlay for quick agent interactions.
 */
export class DialogSystem {
  constructor(agentManager, deepTalkSystem) {
    this.agentManager = agentManager;
    this.deepTalkSystem = deepTalkSystem;
    this.panel = document.getElementById('dialog-panel');
    this.currentAgent = null;
    this.isOpen = false;
  }

  open(agentTypeId) {
    this.currentAgent = agentTypeId;
    this.isOpen = true;
    this.render();
    this.panel.classList.add('visible');
  }

  close() {
    this.currentAgent = null;
    this.isOpen = false;
    this.panel.classList.remove('visible');
  }

  toggle(agentTypeId) {
    if (this.isOpen && this.currentAgent === agentTypeId) {
      this.close();
    } else {
      this.open(agentTypeId);
    }
  }

  refresh() {
    if (this.isOpen && this.currentAgent) {
      this.render();
    }
  }

  render() {
    const typeId = this.currentAgent;
    const agentType = AGENT_TYPES[typeId];
    const directives = this.agentManager.getDirectives(typeId);
    const agent = this.agentManager.getAgent(typeId);

    if (!agentType) return;

    let html = '';

    // Agent header
    html += `
      <div class="agent-header">
        <div class="agent-avatar" style="background: ${agentType.color}">${agentType.shortName}</div>
        <div class="agent-info">
          <div class="agent-name">${agent ? agent.name : agentType.defaultNickname} — ${agentType.name}</div>
          <div class="agent-role">${agentType.building} · ${agentType.description}</div>
        </div>
      </div>
    `;

    if (!directives) {
      html += '<p style="color: #888;">No directives loaded. Running outside Electron?</p>';
      html += '<div class="close-hint">Press ESC to close</div>';
      this.panel.innerHTML = html;
      return;
    }

    // Active tasks
    const activeTasks = directives.activeTasks.filter(t => !t.isComplete);
    if (activeTasks.length > 0) {
      html += '<h3>Active Tasks</h3>';
      for (let i = 0; i < activeTasks.length; i++) {
        const task = activeTasks[i];
        const blockedClass = task.isBlocked ? ' blocked' : '';
        const execBtn = (task.prompt && !task.isBlocked)
          ? `<button class="task-execute-btn" data-task-index="${i}">Execute</button>`
          : '';
        html += `
          <div class="task-item${blockedClass}">
            ${execBtn}
            <span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span>
            <strong>${task.fullTitle}</strong>
            <div class="task-status">${task.status}${task.target ? ` · Target: ${task.target}` : ''}</div>
            ${task.context ? `<div style="color: #999; font-size: 12px; margin-top: 4px;">${task.context}</div>` : ''}
          </div>
        `;
      }
    } else {
      html += '<h3>Active Tasks</h3><p style="color: #666;">No active tasks.</p>';
    }

    // Completed tasks (recent, from active section strikethroughs)
    const completedActive = directives.activeTasks.filter(t => t.isComplete);
    if (completedActive.length > 0) {
      html += '<h3>Recently Completed</h3>';
      for (const task of completedActive) {
        html += `
          <div class="task-item completed">
            <span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span>
            <s>${task.fullTitle}</s>
            <div class="task-status">${task.status}</div>
          </div>
        `;
      }
    }

    // Backlog
    if (directives.backlogTasks.length > 0) {
      html += '<h3>Backlog</h3>';
      for (const task of directives.backlogTasks) {
        html += `
          <div class="task-item">
            <span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span>
            ${task.fullTitle}
            <div class="task-status">${task.status}${task.target ? ` · Target: ${task.target}` : ''}</div>
          </div>
        `;
      }
    }

    // Standing orders
    if (directives.standingOrders.length > 0) {
      html += '<h3>Standing Orders</h3>';
      for (const order of directives.standingOrders) {
        html += `<div class="task-item"><strong>${order.title}:</strong> ${order.description}</div>`;
      }
    }

    // Completed table summary
    if (directives.completedTasks.length > 0) {
      html += `<h3>Completed (${directives.completedTasks.length} total)</h3>`;
      // Show last 3
      const recent = directives.completedTasks.slice(-3);
      for (const task of recent) {
        html += `
          <div class="task-item completed">
            <strong>${task.task}</strong> — ${task.project}
            <div class="task-status">Completed: ${task.completed}</div>
          </div>
        `;
      }
    }

    html += '<div class="close-hint">Press ESC to close · Press T for Deep Talk</div>';

    this.panel.innerHTML = html;

    // Attach Execute button handlers
    if (this.deepTalkSystem) {
      const buttons = this.panel.querySelectorAll('.task-execute-btn');
      buttons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.taskIndex, 10);
          const task = activeTasks[idx];
          if (task && task.prompt) {
            this.close();
            this.deepTalkSystem.start(typeId, task.prompt);
          }
        });
      });
    }
  }
}
