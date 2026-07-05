import { parseKnowledgeBase } from './parser/markdownParser.js';
import { GraphRenderer } from './graph/graphRenderer.js';
import { SidePanel } from './ui/sidePanel.js';
import { Toolbar } from './ui/toolbar.js';
import { Tooltip } from './ui/tooltip.js';

async function init() {
  // Parse both KB layers
  const data = await parseKnowledgeBase();

  const humanNodes = data.nodes.filter(n => n.layer === 'human');
  const aiNodes = data.nodes.filter(n => n.layer === 'ai');
  console.log(`KB loaded: ${humanNodes.length} human nodes, ${aiNodes.length} AI nodes, ${data.links.length} links`);

  // UI elements
  const svgEl = document.getElementById('graph');
  const panelEl = document.getElementById('side-panel');
  const toolbarEl = document.getElementById('toolbar');
  const statsEl = document.getElementById('stats');

  // Initialize components
  const tooltip = new Tooltip();
  const sidePanel = new SidePanel(panelEl);

  const graph = new GraphRenderer(svgEl, data, {
    onNodeClick: (node) => {
      sidePanel.show(node);
    },
    onNodeHover: (node, event) => {
      if (node) tooltip.show(node, event);
      else tooltip.hide();
    },
    onBackgroundClick: () => {
      sidePanel.hide();
    }
  });

  // Wire side panel navigation
  sidePanel.onNavigate = (id) => {
    const node = data.nodes.find(n => n.id === id);
    if (node) {
      sidePanel.show(node);
      if (graph.mode === 'focus') graph.setFocus(node);
    }
  };

  const toolbar = new Toolbar(toolbarEl, {
    onModeChange: (mode) => graph.setMode(mode),
    onLayerChange: (layer) => {
      graph.setLayerMode(layer);
      updateStats(data, statsEl, layer);
      setTimeout(() => graph.fitAll(), 800);
    },
    onDomainToggle: (domain, visible) => graph.toggleDomain(domain, visible),
    onSearch: (query) => {
      if (!query) {
        graph.clearFocus();
        // Reset opacity on visible nodes
        graph.nodeElements.transition().duration(200).style('opacity', 1);
        return;
      }
      const q = query.toLowerCase();
      const matches = data.nodes.filter(n =>
        n.id.toLowerCase().includes(q) ||
        (n.title || '').toLowerCase().includes(q) ||
        (n.concept || '').toLowerCase().includes(q)
      );
      if (matches.length === 1) {
        sidePanel.show(matches[0]);
        if (graph.mode === 'focus') graph.setFocus(matches[0]);
      }
      graph.nodeElements.transition().duration(200)
        .style('opacity', d => {
          if (!query) return 1;
          const id = d.id.toLowerCase();
          const title = (d.title || d.concept || '').toLowerCase();
          return (id.includes(q) || title.includes(q)) ? 1 : 0.1;
        });
    },
    onFitAll: () => graph.fitAll()
  });

  // Initial stats
  updateStats(data, statsEl, 'both');

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sidePanel.hide();
      graph.clearFocus();
    }
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'f' || e.key === 'F') graph.fitAll();
    if (e.key === '1') {
      graph.setMode('survey');
      toolbarEl.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === 'survey');
      });
    }
    if (e.key === '2') {
      graph.setMode('focus');
      toolbarEl.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === 'focus');
      });
    }
    // Layer shortcuts
    if (e.key === '3') {
      graph.setLayerMode('human');
      toolbar.setLayerMode('human');
      updateStats(data, statsEl, 'human');
      setTimeout(() => graph.fitAll(), 800);
    }
    if (e.key === '4') {
      graph.setLayerMode('both');
      toolbar.setLayerMode('both');
      updateStats(data, statsEl, 'both');
      setTimeout(() => graph.fitAll(), 800);
    }
    if (e.key === '5') {
      graph.setLayerMode('ai');
      toolbar.setLayerMode('ai');
      updateStats(data, statsEl, 'ai');
      setTimeout(() => graph.fitAll(), 800);
    }
  });

  // Initial fit after simulation settles
  setTimeout(() => graph.fitAll(), 2000);
}

function updateStats(data, statsEl, layer) {
  const nodes = data.nodes.filter(n => {
    if (layer === 'human') return n.layer === 'human';
    if (layer === 'ai') return n.layer === 'ai';
    return true;
  });

  const claims = nodes.filter(n => n.type === 'claim');
  const established = claims.filter(n => n.status === 'Established').length;
  const hypothesized = claims.filter(n => n.status === 'Hypothesized').length;
  const speculative = claims.filter(n => n.status === 'Speculative').length;

  const sops = nodes.filter(n => n.type === 'sop');
  const skills = nodes.filter(n => n.type === 'skl');
  const tools = nodes.filter(n => n.type === 'tool');

  const humanStats = claims.length ? `
    <span class="sep">|</span>
    <span>${claims.length} claims</span>
    <span style="color:#50c878">${established} est</span>
    <span style="color:#fbbf24">${hypothesized} hyp</span>
    <span style="color:#f87171">${speculative} spec</span>
  ` : '';

  const aiStats = sops.length ? `
    <span class="sep">|</span>
    <span style="color:#00d4aa">${sops.length} SOPs</span>
    <span style="color:#77aaff">${skills.length} skills</span>
    <span style="color:#7a8a9a">${tools.length} tools</span>
  ` : '';

  const links = data.links.length;

  statsEl.innerHTML = `
    <span>${nodes.length} nodes</span>
    <span>${links} edges</span>
    ${humanStats}
    ${aiStats}
  `;
}

init().catch(err => {
  console.error('Failed to initialize KB Explorer:', err);
  document.body.innerHTML = `<div style="color:#f87171;padding:2em;font-family:monospace">
    Failed to load knowledge base:<br>${err.message}
  </div>`;
});
