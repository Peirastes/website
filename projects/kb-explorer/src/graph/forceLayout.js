import * as d3 from 'd3';

// Human layer cluster positions (left hemisphere)
const HUMAN_CLUSTER = {
  foundation: { x: -300, y: -200 },
  EPI: { x: -500, y: -80 },
  ECDO: { x: -100, y: -80 },
  TF: { x: -450, y: 150 },
  DSL: { x: -300, y: 200 },
  PED: { x: -150, y: 150 },
  ARCH: { x: -50, y: 50 },
  PHYS: { x: -450, y: -150 },
  tes: { x: -300, y: 0 },
  human_skills: { x: 0, y: 250 }
};

// AI layer cluster positions (right hemisphere)
const AI_CLUSTER = {
  ai_shared: { x: 300, y: 0 },
  CE: { x: 150, y: -80 },
  CD: { x: 450, y: -80 },
  PM: { x: 300, y: -120 },
  RA: { x: 150, y: 150 },
  SA: { x: 450, y: 150 },
  TA: { x: 300, y: 200 }
};

// When showing only one layer, center it
const HUMAN_ONLY_CLUSTER = {
  foundation: { x: 0, y: -200 },
  EPI: { x: -250, y: -80 },
  ECDO: { x: 250, y: -80 },
  TF: { x: -200, y: 150 },
  DSL: { x: -50, y: 200 },
  PED: { x: 200, y: 150 },
  ARCH: { x: 300, y: 50 },
  PHYS: { x: -300, y: -150 },
  tes: { x: 0, y: 0 },
  human_skills: { x: 0, y: 250 }
};

const AI_ONLY_CLUSTER = {
  ai_shared: { x: 0, y: 0 },
  CE: { x: -250, y: -80 },
  CD: { x: 250, y: -80 },
  PM: { x: 0, y: -120 },
  RA: { x: -200, y: 150 },
  SA: { x: 200, y: 150 },
  TA: { x: 0, y: 200 }
};

function getClusterPos(node, layerMode) {
  if (layerMode === 'both') {
    if (node.layer === 'ai') return AI_CLUSTER[node.domain] || { x: 300, y: 0 };
    // 'human' and 'shared' layers both use human cluster positions
    return HUMAN_CLUSTER[node.domain] || { x: -300, y: 0 };
  }
  if (layerMode === 'ai') return AI_ONLY_CLUSTER[node.domain] || { x: 0, y: 0 };
  return HUMAN_ONLY_CLUSTER[node.domain] || { x: 0, y: 0 };
}

export function createForceLayout(nodes, links, width, height, layerMode = 'both') {
  const cx = width / 2;
  const cy = height / 2;

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id(d => d.id)
      .distance(d => {
        if (d.type === 'tes-reference') return 80;
        if (d.type === 'ai-supports') return 40;
        if (d.type === 'ai-interface') return 70;
        if (d.type === 'requires-knowledge') return 60;
        if (d.type === 'delegates-to') return 55;
        return 50;
      })
      .strength(d => {
        if (d.type === 'tes-reference') return 0.1;
        if (d.type === 'ai-supports') return 0.4;
        if (d.type === 'ai-interface') return 0.15;
        if (d.type === 'requires-knowledge') return 0.2;
        if (d.type === 'delegates-to') return 0.25;
        return 0.3;
      })
    )
    .force('charge', d3.forceManyBody()
      .strength(d => {
        if (d.type === 'tes' || d.type === 'ifc') return -30;
        return -120 - d.fanOut * 20;
      })
    )
    .force('center', d3.forceCenter(cx, cy).strength(0.05))
    .force('clusterX', d3.forceX(d => {
      const pos = getClusterPos(d, layerMode);
      return cx + pos.x;
    }).strength(0.12))
    .force('clusterY', d3.forceY(d => {
      const pos = getClusterPos(d, layerMode);
      return cy + pos.y;
    }).strength(0.12))
    .force('collide', d3.forceCollide()
      .radius(d => {
        if (d.type === 'tes' || d.type === 'ifc') return 5;
        if (d.type === 'hsk') return 7 + Math.sqrt(d.fanOut) * 2.5;
        return 8 + Math.sqrt(d.fanOut) * 3;
      })
      .strength(0.7)
    )
    .alphaDecay(0.02)
    .velocityDecay(0.3);

  return simulation;
}
