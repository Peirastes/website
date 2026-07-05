import { DOMAIN_COLORS } from '../graph/colors.js';

const TYPE_LABELS = {
  fp: 'First Principle',
  da: 'Domain Axiom',
  tes: 'TES Concept',
  claim: 'Claim',
  ap: 'Agent Principle',
  sop: 'SOP',
  skl: 'Skill',
  tool: 'Tool',
  ifc: 'Interface'
};

export class Tooltip {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'tooltip';
    document.body.appendChild(this.el);
  }

  show(node, event) {
    if (!node) {
      this.el.style.display = 'none';
      return;
    }

    const color = DOMAIN_COLORS[node.domain] || '#888';
    const typeLabel = TYPE_LABELS[node.type] || node.type;
    let content = `<span style="color:${color};font-weight:bold">${node.id}</span>`;

    if (node.type === 'tes') {
      content += `<br>${node.concept}`;
    } else {
      content += `<br>${node.title}`;
    }

    // Status/meta line
    if (node.type === 'claim') {
      content += `<br><span class="tt-meta">${node.status} / ${node.confidence}</span>`;
    } else if (node.type === 'sop') {
      content += `<br><span class="tt-meta">${typeLabel} / ${node.owner} / ${node.status}</span>`;
    } else if (node.type === 'skl') {
      content += `<br><span class="tt-meta">${typeLabel} / ${node.owner} / ${node.proficiency}</span>`;
    } else if (node.type === 'tool') {
      content += `<br><span class="tt-meta">${node.category || 'Tool'} / Used by: ${node.usedBy}</span>`;
    } else if (node.type === 'ifc') {
      content += `<br><span class="tt-meta">${node.source} → ${node.target}</span>`;
    } else {
      content += `<br><span class="tt-meta">${typeLabel}</span>`;
    }

    if (node.fanOut > 0) {
      content += `<br><span class="tt-meta">${node.fanOut} dependent(s)</span>`;
    }

    this.el.innerHTML = content;
    this.el.style.display = 'block';
    this.el.style.left = (event.clientX + 12) + 'px';
    this.el.style.top = (event.clientY - 10) + 'px';
  }

  hide() {
    this.el.style.display = 'none';
  }
}
