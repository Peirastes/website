import { DOMAIN_COLORS } from '../graph/colors.js';

export class SidePanel {
  constructor(panelElement) {
    this.el = panelElement;
    this.el.innerHTML = '<div class="panel-placeholder">Click a node to inspect</div>';
  }

  show(node) {
    this.el.classList.add('open');

    // Human layer types
    if (node.type === 'fp') this.renderFP(node);
    else if (node.type === 'da') this.renderDA(node);
    else if (node.type === 'tes') this.renderTES(node);
    else if (node.type === 'claim') this.renderClaim(node);
    else if (node.type === 'hsk') this.renderHSK(node);
    // AI layer types
    else if (node.type === 'sop') this.renderSOP(node);
    else if (node.type === 'skl') this.renderSKL(node);
    else if (node.type === 'tool') this.renderTOOL(node);
    else if (node.type === 'ifc') this.renderIFC(node);
    else this.renderClaim(node); // fallback
  }

  hide() {
    this.el.classList.remove('open');
  }

  // ─── Human Layer Renderers ─────────────────────────────────────────────

  renderClaim(c) {
    const color = DOMAIN_COLORS[c.domain] || '#888';
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${color}">${c.id}</div>
        <div class="panel-title">${c.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:${color}20;color:${color}">${c.domain}</span>
          <span class="badge badge-${(c.status || '').toLowerCase()}">${c.status}</span>
          <span class="badge">${c.confidence}</span>
        </div>
      </div>
      <div class="panel-body">
        <div class="panel-section">
          <div class="section-label">Statement</div>
          <div class="section-text">${c.statement}</div>
        </div>
        <div class="panel-meta">
          <div><span class="meta-key">Inference:</span> ${c.inferenceMode}</div>
          <div><span class="meta-key">PSCPR:</span> ${c.pscprStage}</div>
          <div><span class="meta-key">Source:</span> ${c.sourceType}</div>
          <div><span class="meta-key">Asserted:</span> ${c.firstAsserted}</div>
          <div><span class="meta-key">Reviewed:</span> ${c.lastReviewed}</div>
        </div>
        ${c.dependencies.length ? `
        <div class="panel-section">
          <div class="section-label">Dependencies</div>
          <div class="dep-list">${c.dependencies.map(d =>
            `<span class="dep-link" data-id="${d}">${d}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        ${c.evidence ? `
        <div class="panel-section">
          <div class="section-label">Evidence</div>
          <div class="section-text evidence">${formatBullets(c.evidence)}</div>
        </div>` : ''}
        ${c.counterEvidence ? `
        <div class="panel-section">
          <div class="section-label">Counter-evidence / Tensions</div>
          <div class="section-text counter">${formatBullets(c.counterEvidence)}</div>
        </div>` : ''}
        <div class="panel-section">
          <div class="section-label">TES Filter</div>
          <div class="section-text tes-filter ${(c.tesFilter || '').startsWith('Flagged') ? 'flagged' : ''}">${c.tesFilter}</div>
        </div>
        ${c.tesRefs && c.tesRefs.length ? `
        <div class="panel-section">
          <div class="section-label">TES Concepts Referenced</div>
          <div class="dep-list">${c.tesRefs.map(t =>
            `<span class="dep-link tes-ref" data-id="${t}">${t}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        ${c.notes ? `
        <div class="panel-section">
          <div class="section-label">Notes</div>
          <div class="section-text notes">${c.notes}</div>
        </div>` : ''}
      </div>
    `;
    this.wireCloseButton();
  }

  renderFP(node) {
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${DOMAIN_COLORS.foundation}">${node.id}</div>
        <div class="panel-title">${node.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:#8090b020;color:#8090b0">First Principle</span>
          <span class="badge badge-layer-human">Human</span>
        </div>
      </div>
      <div class="panel-body">
        <div class="panel-section">
          <div class="section-label">Statement</div>
          <div class="section-text">${node.statement}</div>
        </div>
        ${node.source ? `<div class="panel-meta"><span class="meta-key">Source:</span> ${node.source}</div>` : ''}
        <div class="panel-meta"><span class="meta-key">Fan-out:</span> ${node.fanOut} dependent(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  renderDA(node) {
    const color = DOMAIN_COLORS[node.domain] || '#888';
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${color}">${node.id}</div>
        <div class="panel-title">${node.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:${color}20;color:${color}">Domain Axiom</span>
          <span class="badge">${node.status}</span>
          <span class="badge badge-layer-human">Human</span>
        </div>
      </div>
      <div class="panel-body">
        <div class="panel-section">
          <div class="section-label">Statement</div>
          <div class="section-text">${node.statement}</div>
        </div>
        <div class="panel-meta"><span class="meta-key">Fan-out:</span> ${node.fanOut} dependent(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  renderTES(node) {
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${DOMAIN_COLORS.tes}">${node.id}</div>
        <div class="panel-title">${node.concept}</div>
        <div class="panel-badges">
          <span class="badge" style="background:#60708020;color:#607080">TES Concept</span>
          <span class="badge badge-layer-human">Human</span>
        </div>
      </div>
      <div class="panel-body">
        <div class="panel-section">
          <div class="section-label">Operational Use</div>
          <div class="section-text">${node.use}</div>
        </div>
        <div class="panel-meta"><span class="meta-key">Referenced by:</span> ${node.fanOut} claim(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  // ─── AI Layer Renderers ────────────────────────────────────────────────

  renderHSK(node) {
    const color = DOMAIN_COLORS.human_skills || '#e8a040';
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${color}">${node.id}</div>
        <div class="panel-title">${node.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:${color}20;color:${color}">Human Skill</span>
          ${node.skillDomain ? `<span class="badge">${node.skillDomain}</span>` : ''}
          <span class="badge badge-${(node.status || '').toLowerCase()}">${node.status}</span>
          <span class="badge badge-layer-human">Human</span>
        </div>
      </div>
      <div class="panel-body">
        ${node.description ? `
        <div class="panel-section">
          <div class="section-label">Description</div>
          <div class="section-text">${node.description}</div>
        </div>` : ''}
        <div class="panel-meta">
          ${node.exerciseFrequency ? `<div><span class="meta-key">Exercise Frequency:</span> ${node.exerciseFrequency}</div>` : ''}
          ${node.lastExercised ? `<div><span class="meta-key">Last Exercised:</span> ${node.lastExercised}</div>` : ''}
          ${node.delegatedTo ? `<div><span class="meta-key">Delegated To:</span> ${node.delegatedTo}</div>` : ''}
        </div>
        ${node.requiresKnowledge && node.requiresKnowledge.length ? `
        <div class="panel-section">
          <div class="section-label">Requires Knowledge</div>
          <div class="dep-list">${node.requiresKnowledge.map(d =>
            `<span class="dep-link" data-id="${d}">${d}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        ${node.delegateAgents && node.delegateAgents.length ? `
        <div class="panel-section">
          <div class="section-label">Delegates To</div>
          <div class="dep-list">${node.delegateAgents.map(d =>
            `<span class="dep-link" data-id="${d}">${d}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        <div class="panel-meta"><span class="meta-key">Fan-out:</span> ${node.fanOut} dependent(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  renderSOP(node) {
    const color = DOMAIN_COLORS[node.domain] || '#888';
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${color}">${node.id}</div>
        <div class="panel-title">${node.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:${color}20;color:${color}">${node.domain} Agent</span>
          <span class="badge badge-${(node.status || '').toLowerCase()}">${node.status}</span>
          <span class="badge badge-layer-ai">AI</span>
        </div>
      </div>
      <div class="panel-body">
        ${node.description ? `
        <div class="panel-section">
          <div class="section-label">Description</div>
          <div class="section-text">${node.description}</div>
        </div>` : ''}
        <div class="panel-meta">
          <div><span class="meta-key">Owner:</span> ${node.owner}</div>
          <div><span class="meta-key">Contributors:</span> ${node.contributors}</div>
          <div><span class="meta-key">Version:</span> ${node.version}</div>
          <div><span class="meta-key">Updated:</span> ${node.lastUpdated}</div>
          <div><span class="meta-key">Triggers:</span> ${node.triggers}</div>
          <div><span class="meta-key">Outputs:</span> ${node.outputs}</div>
        </div>
        ${node.dependencies && node.dependencies.length ? `
        <div class="panel-section">
          <div class="section-label">Dependencies</div>
          <div class="dep-list">${node.dependencies.map(d =>
            `<span class="dep-link" data-id="${d}">${d}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        ${node.interfaces && node.interfaces.length ? `
        <div class="panel-section">
          <div class="section-label">Interfaces</div>
          <div class="dep-list">${node.interfaces.map(d =>
            `<span class="dep-link" data-id="${d}">${d}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        ${node.steps ? `
        <div class="panel-section">
          <div class="section-label">Steps</div>
          <div class="section-text">${formatBullets(node.steps)}</div>
        </div>` : ''}
        ${node.qualityCriteria ? `
        <div class="panel-section">
          <div class="section-label">Quality Criteria</div>
          <div class="section-text evidence">${formatBullets(node.qualityCriteria)}</div>
        </div>` : ''}
        <div class="panel-meta"><span class="meta-key">Fan-out:</span> ${node.fanOut} dependent(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  renderSKL(node) {
    const color = DOMAIN_COLORS[node.domain] || '#888';
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${color}">${node.id}</div>
        <div class="panel-title">${node.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:${color}20;color:${color}">${node.domain} Agent</span>
          <span class="badge">${node.proficiency || 'N/A'}</span>
          <span class="badge badge-layer-ai">AI</span>
        </div>
      </div>
      <div class="panel-body">
        ${node.description ? `
        <div class="panel-section">
          <div class="section-label">Description</div>
          <div class="section-text">${node.description}</div>
        </div>` : ''}
        <div class="panel-meta">
          <div><span class="meta-key">Owner:</span> ${node.owner}</div>
          <div><span class="meta-key">Status:</span> ${node.status}</div>
        </div>
        ${node.dependencies && node.dependencies.length ? `
        <div class="panel-section">
          <div class="section-label">Dependencies</div>
          <div class="dep-list">${node.dependencies.map(d =>
            `<span class="dep-link" data-id="${d}">${d}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        ${node.appliedIn && node.appliedIn.length ? `
        <div class="panel-section">
          <div class="section-label">Applied In</div>
          <div class="dep-list">${node.appliedIn.map(d =>
            `<span class="dep-link" data-id="${d}">${d}</span>`
          ).join(' ')}</div>
        </div>` : ''}
        <div class="panel-meta"><span class="meta-key">Fan-out:</span> ${node.fanOut} dependent(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  renderTOOL(node) {
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${DOMAIN_COLORS.ai_shared}">${node.id}</div>
        <div class="panel-title">${node.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:#7a8a9a20;color:#7a8a9a">${node.category || 'Tool'}</span>
          <span class="badge badge-layer-ai">AI</span>
        </div>
      </div>
      <div class="panel-body">
        ${node.purpose ? `
        <div class="panel-section">
          <div class="section-label">Purpose</div>
          <div class="section-text">${node.purpose}</div>
        </div>` : ''}
        <div class="panel-meta">
          <div><span class="meta-key">Contributors:</span> ${node.contributors}</div>
          <div><span class="meta-key">Used By:</span> ${node.usedBy}</div>
        </div>
        <div class="panel-meta"><span class="meta-key">Fan-out:</span> ${node.fanOut} dependent(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  renderIFC(node) {
    this.el.innerHTML = `
      <div class="panel-header">
        <button class="panel-close">&times;</button>
        <div class="panel-id" style="color:${DOMAIN_COLORS.ai_shared}">${node.id}</div>
        <div class="panel-title">${node.title}</div>
        <div class="panel-badges">
          <span class="badge" style="background:#7a8a9a20;color:#7a8a9a">Interface</span>
          <span class="badge badge-layer-ai">AI</span>
        </div>
      </div>
      <div class="panel-body">
        ${node.description ? `
        <div class="panel-section">
          <div class="section-label">Description</div>
          <div class="section-text">${node.description}</div>
        </div>` : ''}
        <div class="panel-meta">
          <div><span class="meta-key">Source:</span> ${node.source}</div>
          <div><span class="meta-key">Target:</span> ${node.target}</div>
          <div><span class="meta-key">Mechanism:</span> ${node.mechanism}</div>
          <div><span class="meta-key">Contributors:</span> ${node.contributors}</div>
        </div>
        <div class="panel-meta"><span class="meta-key">Fan-out:</span> ${node.fanOut} dependent(s)</div>
      </div>
    `;
    this.wireCloseButton();
  }

  // ─── Shared ────────────────────────────────────────────────────────────

  wireCloseButton() {
    const btn = this.el.querySelector('.panel-close');
    if (btn) btn.addEventListener('click', () => this.hide());

    this.el.querySelectorAll('.dep-link').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        if (this.onNavigate) this.onNavigate(id);
      });
    });
  }
}

function formatBullets(text) {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<div class="bullet">${line.replace(/^[-\d.]+\s*/, '')}</div>`)
    .join('');
}
