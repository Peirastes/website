import { DOMAIN_COLORS } from '../graph/colors.js';

// Define which domains belong to which layer
const HUMAN_DOMAINS = ['foundation', 'EPI', 'ECDO', 'TF', 'DSL', 'PED', 'ARCH', 'PHYS', 'tes', 'human_skills'];
const AI_DOMAINS = ['CE', 'CD', 'PM', 'RA', 'SA', 'TA', 'ai_shared'];

const DOMAIN_LABELS = {
  foundation: 'FP/DA',
  tes: 'TES',
  human_skills: 'HSK',
  ai_shared: 'Shared'
};

export class Toolbar {
  constructor(toolbarElement, callbacks = {}) {
    this.el = toolbarElement;
    this.callbacks = callbacks; // { onModeChange, onLayerChange, onDomainToggle, onSearch, onFitAll }
    this.activeLayer = 'both';
    this.render();
  }

  render() {
    const humanFilters = this.buildFilterHTML(HUMAN_DOMAINS, 'human');
    const aiFilters = this.buildFilterHTML(AI_DOMAINS, 'ai');

    this.el.innerHTML = `
      <div class="toolbar-section modes">
        <button class="mode-btn active" data-mode="survey">Survey</button>
        <button class="mode-btn" data-mode="focus">Focus</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-section layers">
        <button class="layer-btn" data-layer="human">Human</button>
        <button class="layer-btn active" data-layer="both">Both</button>
        <button class="layer-btn" data-layer="ai">AI</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-section filters" id="human-filters">
        <span class="filter-group-label">H</span>
        ${humanFilters}
      </div>
      <div class="toolbar-section filters" id="ai-filters">
        <span class="filter-group-label">AI</span>
        ${aiFilters}
      </div>
      <div class="toolbar-section search">
        <input type="text" class="search-input" placeholder="Search ID or title...">
      </div>
      <div class="toolbar-section actions">
        <button class="action-btn" id="fitAll" title="Fit all (F)">Fit</button>
      </div>
    `;

    // Wire mode buttons
    this.el.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.el.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.callbacks.onModeChange) this.callbacks.onModeChange(btn.dataset.mode);
      });
    });

    // Wire layer buttons
    this.el.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.el.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeLayer = btn.dataset.layer;
        this.updateFilterVisibility();
        if (this.callbacks.onLayerChange) this.callbacks.onLayerChange(btn.dataset.layer);
      });
    });

    // Wire domain filters
    this.el.querySelectorAll('.domain-filter input').forEach(cb => {
      cb.addEventListener('change', () => {
        if (this.callbacks.onDomainToggle) {
          this.callbacks.onDomainToggle(cb.dataset.domain, cb.checked);
        }
      });
    });

    // Wire search
    const searchInput = this.el.querySelector('.search-input');
    searchInput.addEventListener('input', () => {
      if (this.callbacks.onSearch) this.callbacks.onSearch(searchInput.value);
    });

    // Wire fit all
    this.el.querySelector('#fitAll').addEventListener('click', () => {
      if (this.callbacks.onFitAll) this.callbacks.onFitAll();
    });

    this.updateFilterVisibility();
  }

  buildFilterHTML(domains, group) {
    return domains
      .map(domain => {
        const color = DOMAIN_COLORS[domain] || '#555';
        const label = DOMAIN_LABELS[domain] || domain;
        return `
          <label class="domain-filter" style="color:${color}" data-group="${group}">
            <input type="checkbox" checked data-domain="${domain}">
            <span class="filter-dot" style="background:${color}"></span>
            ${label}
          </label>`;
      }).join('');
  }

  updateFilterVisibility() {
    const humanEl = this.el.querySelector('#human-filters');
    const aiEl = this.el.querySelector('#ai-filters');
    if (this.activeLayer === 'human') {
      humanEl.style.display = '';
      aiEl.style.display = 'none';
    } else if (this.activeLayer === 'ai') {
      humanEl.style.display = 'none';
      aiEl.style.display = '';
    } else {
      humanEl.style.display = '';
      aiEl.style.display = '';
    }
  }

  setLayerMode(mode) {
    this.activeLayer = mode;
    this.el.querySelectorAll('.layer-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.layer === mode);
    });
    this.updateFilterVisibility();
  }
}
