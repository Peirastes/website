import * as d3 from 'd3';
import { nodeColor, nodeOpacity, nodeRadius } from './colors.js';
import { createForceLayout } from './forceLayout.js';

export class GraphRenderer {
  constructor(svgElement, data, callbacks = {}) {
    this.svg = d3.select(svgElement);
    this.data = data;
    this.callbacks = callbacks; // { onNodeClick, onNodeHover, onBackgroundClick }
    this.mode = 'survey'; // 'survey' | 'focus'
    this.layerMode = 'both'; // 'human' | 'ai' | 'both'
    this.focusedNode = null;
    this.focusedIds = new Set();
    this.hiddenDomains = new Set();

    this.init();
  }

  init() {
    const { width, height } = this.svg.node().getBoundingClientRect();
    this.width = width;
    this.height = height;

    // Arrow markers
    const defs = this.svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 12)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L7,0L0,3')
      .attr('fill', '#445');

    defs.append('marker')
      .attr('id', 'arrowhead-ai')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 12)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L7,0L0,3')
      .attr('fill', '#2a5a50');

    // Container for zoom/pan
    this.container = this.svg.append('g').attr('class', 'graph-container');

    // Zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        this.container.attr('transform', event.transform);
        this.currentTransform = event.transform;
      });
    this.svg.call(this.zoom);
    this.currentTransform = d3.zoomIdentity;

    // Background click
    this.svg.on('click', (event) => {
      if (event.target === this.svg.node()) {
        this.clearFocus();
        if (this.callbacks.onBackgroundClick) this.callbacks.onBackgroundClick();
      }
    });

    // Render
    this.renderGraph();
  }

  renderGraph() {
    // Clear previous render
    this.container.selectAll('*').remove();

    const visibleNodes = this.getVisibleNodes();
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = this.data.links.filter(l => {
      const srcId = typeof l.source === 'string' ? l.source : l.source.id;
      const tgtId = typeof l.target === 'string' ? l.target : l.target.id;
      return visibleNodeIds.has(srcId) && visibleNodeIds.has(tgtId);
    });

    // Links
    this.linkElements = this.container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(visibleLinks)
      .join('line')
      .attr('stroke', d => {
        if (d.type === 'tes-reference') return '#2a3040';
        if (d.type === 'ai-dependency') return '#1a4a40';
        if (d.type === 'ai-supports') return '#2a4a50';
        if (d.type === 'ai-interface') return '#3a3a50';
        if (d.type === 'requires-knowledge') return '#5a4a30';
        if (d.type === 'delegates-to') return '#6a5a20';
        return '#3a4560';
      })
      .attr('stroke-width', d => {
        if (d.type === 'tes-reference' || d.type === 'ai-interface') return 0.5;
        return 1;
      })
      .attr('stroke-opacity', d => {
        if (d.type === 'tes-reference') return 0.3;
        if (d.type === 'ai-interface') return 0.35;
        return 0.5;
      })
      .attr('marker-end', d => {
        if (d.type === 'dependency') return 'url(#arrowhead)';
        if (d.type === 'ai-dependency' || d.type === 'ai-supports') return 'url(#arrowhead-ai)';
        if (d.type === 'requires-knowledge' || d.type === 'delegates-to') return 'url(#arrowhead)';
        return null;
      });

    // Nodes
    this.nodeElements = this.container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(visibleNodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(this.drag())
      .on('click', (event, d) => {
        event.stopPropagation();
        if (this.mode === 'focus') this.setFocus(d);
        if (this.callbacks.onNodeClick) this.callbacks.onNodeClick(d);
      })
      .on('mouseenter', (event, d) => {
        if (this.callbacks.onNodeHover) this.callbacks.onNodeHover(d, event);
      })
      .on('mouseleave', () => {
        if (this.callbacks.onNodeHover) this.callbacks.onNodeHover(null);
      });

    // Node shapes
    this.nodeElements.each(function(d) {
      const g = d3.select(this);
      const r = nodeRadius(d);
      const color = nodeColor(d);
      const opacity = nodeOpacity(d);

      if (d.type === 'fp') {
        // Diamond
        g.append('path')
          .attr('d', `M0,${-r} L${r},0 L0,${r} L${-r},0 Z`)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.8);
      } else if (d.type === 'hsk') {
        // Octagon
        const oct = octPath(r);
        g.append('path')
          .attr('d', oct)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.8);
      } else if (d.type === 'da' || d.type === 'tool') {
        // Square
        g.append('rect')
          .attr('x', -r).attr('y', -r)
          .attr('width', r * 2).attr('height', r * 2)
          .attr('rx', d.type === 'tool' ? 3 : 2)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.8);
      } else if (d.type === 'sop') {
        // Hexagon
        const hex = hexPath(r);
        g.append('path')
          .attr('d', hex)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.8);
      } else if (d.type === 'skl') {
        // Pentagon
        const pent = pentPath(r);
        g.append('path')
          .attr('d', pent)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', 0.8);
      } else if (d.type === 'ifc') {
        // Small triangle (like TES but colored differently)
        const tri = triPath(r);
        g.append('path')
          .attr('d', tri)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', 0.5)
          .attr('stroke-opacity', 0.6);
      } else {
        // Circle (claims and TES)
        g.append('circle')
          .attr('r', r)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', d.type === 'tes' ? 0.5 : 1.5)
          .attr('stroke-opacity', 0.8);
      }
    });

    // Labels
    this.labelElements = this.container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(visibleNodes.filter(d =>
        d.type === 'fp' || d.type === 'da' || d.type === 'hsk' ||
        d.type === 'sop' || d.fanOut >= 2 || d.type === 'claim'
      ))
      .join('text')
      .text(d => d.id)
      .attr('font-size', d => {
        if (d.type === 'tes' || d.type === 'ifc') return 7;
        if (d.type === 'fp' || d.type === 'hsk') return 9;
        return 8;
      })
      .attr('fill', d => nodeColor(d))
      .attr('fill-opacity', d => (d.fanOut >= 2 || d.type === 'fp' || d.type === 'hsk' || d.type === 'sop') ? 0.9 : 0.5)
      .attr('text-anchor', 'middle')
      .attr('dy', d => -nodeRadius(d) - 4)
      .attr('pointer-events', 'none')
      .attr('font-family', 'monospace');

    // Pulsing animation for Hypothesized claims and Draft AI entries
    this.nodeElements.filter(d => d.status === 'Hypothesized' || d.status === 'Draft')
      .select('circle, path, rect')
      .classed('pulse', true);

    // Force simulation
    if (this.simulation) this.simulation.stop();
    this.simulation = createForceLayout(visibleNodes, visibleLinks, this.width, this.height, this.layerMode);
    this.simulation.on('tick', () => this.tick());
  }

  getVisibleNodes() {
    return this.data.nodes.filter(n => {
      // Layer filter (shared layer visible in both human and ai modes)
      if (this.layerMode === 'human' && n.layer === 'ai') return false;
      if (this.layerMode === 'ai' && n.layer !== 'ai' && n.layer !== 'shared') return false;
      // Domain filter
      if (this.hiddenDomains.has(n.domain)) return false;
      return true;
    });
  }

  tick() {
    this.linkElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    this.nodeElements
      .attr('transform', d => `translate(${d.x},${d.y})`);

    this.labelElements
      .attr('x', d => d.x)
      .attr('y', d => d.y - nodeRadius(d) - 4);
  }

  drag() {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  // ─── Layer Switching ─────────────────────────────────────────────────────
  setLayerMode(mode) {
    this.layerMode = mode;
    this.clearFocus();
    this.renderGraph();
  }

  // ─── Focus Mode ──────────────────────────────────────────────────────────
  setFocus(node) {
    this.focusedNode = node;
    this.focusedIds = this.getChain(node.id);
    this.applyFocusStyles();
  }

  clearFocus() {
    this.focusedNode = null;
    this.focusedIds.clear();
    this.applyFocusStyles();
  }

  getChain(nodeId) {
    const ids = new Set([nodeId]);
    const visibleLinks = this.data.links.filter(l => {
      const srcId = typeof l.source === 'string' ? l.source : l.source.id;
      const tgtId = typeof l.target === 'string' ? l.target : l.target.id;
      const visNodes = new Set(this.getVisibleNodes().map(n => n.id));
      return visNodes.has(srcId) && visNodes.has(tgtId);
    });

    // Dependency types to follow
    const depTypes = new Set(['dependency', 'ai-dependency', 'ai-supports', 'requires-knowledge', 'delegates-to']);

    // Ancestors
    const queue = [nodeId];
    while (queue.length) {
      const current = queue.shift();
      for (const link of visibleLinks) {
        const srcId = typeof link.source === 'string' ? link.source : link.source.id;
        const tgtId = typeof link.target === 'string' ? link.target : link.target.id;
        if (tgtId === current && !ids.has(srcId) && depTypes.has(link.type)) {
          ids.add(srcId);
          queue.push(srcId);
        }
      }
    }

    // Descendants
    const queue2 = [nodeId];
    while (queue2.length) {
      const current = queue2.shift();
      for (const link of visibleLinks) {
        const srcId = typeof link.source === 'string' ? link.source : link.source.id;
        const tgtId = typeof link.target === 'string' ? link.target : link.target.id;
        if (srcId === current && !ids.has(tgtId) && depTypes.has(link.type)) {
          ids.add(tgtId);
          queue2.push(tgtId);
        }
      }
    }

    return ids;
  }

  applyFocusStyles() {
    const focused = this.focusedIds;
    const inFocus = focused.size > 0;

    this.nodeElements.transition().duration(300)
      .style('opacity', d => {
        if (!inFocus) return 1;
        return focused.has(d.id) ? 1 : 0.08;
      });

    this.linkElements.transition().duration(300)
      .attr('stroke-opacity', d => {
        if (!inFocus) {
          if (d.type === 'tes-reference') return 0.3;
          if (d.type === 'ai-interface') return 0.35;
          return 0.5;
        }
        const srcId = typeof d.source === 'string' ? d.source : d.source.id;
        const tgtId = typeof d.target === 'string' ? d.target : d.target.id;
        return (focused.has(srcId) && focused.has(tgtId)) ? 0.8 : 0.03;
      });

    this.labelElements.transition().duration(300)
      .attr('fill-opacity', d => {
        if (!inFocus) return (d.fanOut >= 2 || d.type === 'fp' || d.type === 'hsk' || d.type === 'sop') ? 0.9 : 0.5;
        return focused.has(d.id) ? 1 : 0.05;
      });
  }

  // ─── Mode Switching ──────────────────────────────────────────────────────
  setMode(mode) {
    this.mode = mode;
    if (mode === 'survey') this.clearFocus();
  }

  // ─── Domain Filtering ────────────────────────────────────────────────────
  toggleDomain(domain, visible) {
    if (visible) {
      this.hiddenDomains.delete(domain);
    } else {
      this.hiddenDomains.add(domain);
    }
    this.renderGraph();
  }

  // ─── Fit All ─────────────────────────────────────────────────────────────
  fitAll() {
    const visibleNodes = this.getVisibleNodes();
    if (!visibleNodes.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const d of visibleNodes) {
      if (d.x == null) continue;
      if (d.x < x0) x0 = d.x;
      if (d.y < y0) y0 = d.y;
      if (d.x > x1) x1 = d.x;
      if (d.y > y1) y1 = d.y;
    }
    if (!isFinite(x0)) return;
    const padding = 60;
    const dx = x1 - x0 + padding * 2;
    const dy = y1 - y0 + padding * 2;
    const scale = Math.min(this.width / dx, this.height / dy, 2);
    const tx = this.width / 2 - (x0 + x1) / 2 * scale;
    const ty = this.height / 2 - (y0 + y1) / 2 * scale;
    this.svg.transition().duration(500)
      .call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }
}

// ─── Shape Generators ──────────────────────────────────────────────────────
function hexPath(r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  return `M${pts.join('L')}Z`;
}

function pentPath(r) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const angle = (2 * Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  return `M${pts.join('L')}Z`;
}

function triPath(r) {
  return `M0,${-r} L${r * 0.87},${r * 0.5} L${-r * 0.87},${r * 0.5}Z`;
}

function octPath(r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    pts.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  return `M${pts.join('L')}Z`;
}
