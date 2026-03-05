import { FORUM_THINKERS, FORUM_THINKER_IDS, TIER_COLORS, ERA_ORDER } from '../data/forumDefinitions.js';

/**
 * Forum UI system — manages the debate panel overlay.
 * Handles topic submission, thinker selection, debate display, and follow-ups.
 */
export class ForumSystem {
  constructor() {
    this.isOpen = false;
    this.selectedThinkers = new Set();
    this.debateLog = [];
    this.isDebating = false;
    this.panel = null;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this._ensurePanel();
    this._renderRoster();
    this._renderDebateLog();
    this.panel.classList.add('visible');
    // Focus topic input
    setTimeout(() => {
      const input = document.getElementById('forum-topic-input');
      if (input) input.focus();
    }, 50);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.panel) this.panel.classList.remove('visible');
  }

  _ensurePanel() {
    this.panel = document.getElementById('forum-panel');
  }

  async submitTopic(topic) {
    if (!topic.trim() || this.isDebating) return;
    if (this.selectedThinkers.size === 0) {
      this._addSystemMessage('Select at least one thinker from the roster.');
      return;
    }

    this.isDebating = true;
    this.debateLog = [];
    this._addSystemMessage(`Topic: "${topic}"`);
    this._renderDebateLog();
    this._setInputState(true);

    try {
      const thinkerIds = [...this.selectedThinkers];
      const result = await window.agentWorld.startForumDebate(topic, thinkerIds);

      if (result.error) {
        this._addSystemMessage(`Error: ${result.error}`);
      } else if (result.responses) {
        for (const resp of result.responses) {
          this._addResponse(resp.thinker, resp.text, resp.responds_to);
        }
        if (result.suggested_followups) {
          this._renderFollowUps(result.suggested_followups);
        }
      }
    } catch (err) {
      this._addSystemMessage(`Failed: ${err.message}`);
    }

    this.isDebating = false;
    this._setInputState(false);
    this._renderDebateLog();
  }

  async followUp(message) {
    if (!message.trim() || this.isDebating) return;
    this.isDebating = true;
    this._addSystemMessage(`Follow-up: "${message}"`);
    this._renderDebateLog();
    this._setInputState(true);

    try {
      const result = await window.agentWorld.forumFollowUp(message);

      if (result.error) {
        this._addSystemMessage(`Error: ${result.error}`);
      } else if (result.responses) {
        for (const resp of result.responses) {
          this._addResponse(resp.thinker, resp.text, resp.responds_to);
        }
        if (result.suggested_followups) {
          this._renderFollowUps(result.suggested_followups);
        }
      }
    } catch (err) {
      this._addSystemMessage(`Failed: ${err.message}`);
    }

    this.isDebating = false;
    this._setInputState(false);
    this._renderDebateLog();
  }

  _addSystemMessage(text) {
    this.debateLog.push({ type: 'system', text });
  }

  _addResponse(thinkerName, text, respondsTo) {
    this.debateLog.push({ type: 'response', thinkerName, text, respondsTo });
  }

  _setInputState(loading) {
    const topicInput = document.getElementById('forum-topic-input');
    const followInput = document.getElementById('forum-followup-input');
    const submitBtn = document.getElementById('forum-submit-btn');
    if (topicInput) topicInput.disabled = loading;
    if (followInput) followInput.disabled = loading;
    if (submitBtn) submitBtn.disabled = loading;
  }

  _renderRoster() {
    const sidebar = document.getElementById('forum-roster');
    if (!sidebar) return;

    // Group by era
    const byEra = {};
    for (const era of ERA_ORDER) byEra[era] = [];
    for (const id of FORUM_THINKER_IDS) {
      const t = FORUM_THINKERS[id];
      if (byEra[t.era]) byEra[t.era].push(t);
    }

    let html = '';
    for (const era of ERA_ORDER) {
      const thinkers = byEra[era];
      if (thinkers.length === 0) continue;

      html += `<div class="forum-era-header">${era}</div>`;
      for (const t of thinkers) {
        const checked = this.selectedThinkers.has(t.id) ? 'checked' : '';
        const tierColor = TIER_COLORS[t.tier];
        html += `
          <label class="forum-thinker-row" data-thinker="${t.id}">
            <input type="checkbox" class="forum-thinker-cb" data-id="${t.id}" ${checked} />
            <span class="forum-tier-badge" style="background: ${tierColor}">${t.tier[0]}</span>
            <span class="forum-thinker-name" style="color: ${t.color}">${t.name}</span>
          </label>
        `;
      }
    }

    sidebar.innerHTML = html;

    // Bind checkbox changes
    sidebar.querySelectorAll('.forum-thinker-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          this.selectedThinkers.add(id);
        } else {
          this.selectedThinkers.delete(id);
        }
      });
    });
  }

  _renderDebateLog() {
    const log = document.getElementById('forum-debate-log');
    if (!log) return;

    let html = '';
    for (const entry of this.debateLog) {
      if (entry.type === 'system') {
        html += `<div class="forum-sys-msg">${this._escapeHtml(entry.text)}</div>`;
      } else if (entry.type === 'response') {
        // Find thinker color
        const thinker = Object.values(FORUM_THINKERS).find(t => t.name === entry.thinkerName);
        const color = thinker ? thinker.color : '#888888';
        const replyTo = entry.respondsTo
          ? `<span class="forum-reply-to">replying to ${this._escapeHtml(entry.respondsTo)}</span>`
          : '';
        html += `
          <div class="forum-response" style="border-left-color: ${color}">
            <div class="forum-resp-header">
              <span class="forum-resp-name" style="color: ${color}">${this._escapeHtml(entry.thinkerName)}</span>
              ${replyTo}
            </div>
            <div class="forum-resp-text">${this._escapeHtml(entry.text)}</div>
          </div>
        `;
      }
    }

    if (this.isDebating) {
      html += `<div class="forum-sys-msg forum-loading">The thinkers are deliberating...</div>`;
    }

    log.innerHTML = html;
    log.scrollTop = log.scrollHeight;
  }

  _renderFollowUps(suggestions) {
    const container = document.getElementById('forum-followups');
    if (!container) return;

    let html = '';
    for (const s of suggestions) {
      html += `<span class="forum-followup-chip">${this._escapeHtml(s)}</span>`;
    }
    container.innerHTML = html;

    // Bind clicks
    container.querySelectorAll('.forum-followup-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const followInput = document.getElementById('forum-followup-input');
        if (followInput) {
          followInput.value = chip.textContent;
          followInput.focus();
        }
      });
    });
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  bindEvents() {
    // Topic submit
    const submitBtn = document.getElementById('forum-submit-btn');
    const topicInput = document.getElementById('forum-topic-input');
    if (submitBtn && topicInput) {
      submitBtn.addEventListener('click', () => {
        this.submitTopic(topicInput.value);
        topicInput.value = '';
      });
      topicInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitTopic(topicInput.value);
          topicInput.value = '';
        }
      });
    }

    // Follow-up input
    const followInput = document.getElementById('forum-followup-input');
    if (followInput) {
      followInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.followUp(followInput.value);
          followInput.value = '';
        }
      });
    }

    // Close button
    const closeBtn = document.getElementById('forum-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }
}
