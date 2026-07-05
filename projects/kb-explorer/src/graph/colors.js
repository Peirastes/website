// ─── Human Layer Colors ──────────────────────────────────────────────────────
export const DOMAIN_COLORS = {
  // Human KB domains
  foundation: '#8090b0',
  EPI: '#6ea8fe',
  ECDO: '#e07050',
  TF: '#50c878',
  DSL: '#c084fc',
  PED: '#fbbf24',
  ARCH: '#f87171',
  PHYS: '#60b8e0',
  tes: '#607080',
  // Human skills
  human_skills: '#e8a040',
  // AI KB agent domains
  ai_shared: '#7a8a9a',
  CE: '#00d4aa',
  CD: '#ff8866',
  PM: '#77aaff',
  RA: '#ffcc44',
  SA: '#cc88ff',
  TA: '#88ddaa',
  // Fallback
  unknown: '#555555'
};

export const STATUS_OPACITY = {
  Established: 1.0,
  Hypothesized: 0.85,
  Speculative: 0.45,
  Unknown: 0.3,
  Retracted: 0.15,
  // AI statuses
  Active: 1.0,
  Draft: 0.6,
  Deprecated: 0.25,
  Proposed: 0.7
};

export const CONFIDENCE_STROKE = {
  High: 2,
  Medium: 1.5,
  Low: 1
};

export const PROFICIENCY_OPACITY = {
  Expert: 1.0,
  Competent: 0.75,
  Learning: 0.5
};

export function nodeColor(node) {
  return DOMAIN_COLORS[node.domain] || DOMAIN_COLORS.unknown;
}

export function nodeOpacity(node) {
  // Human layer
  if (node.type === 'fp') return 1.0;
  if (node.type === 'da') return 0.95;
  if (node.type === 'tes') return 0.6;
  if (node.type === 'hsk') return 0.9;
  // AI layer
  if (node.type === 'tool') return 0.85;
  if (node.type === 'ifc') return 0.7;
  if (node.type === 'sop') return STATUS_OPACITY[node.status] || 0.8;
  if (node.type === 'skl') return PROFICIENCY_OPACITY[node.proficiency] || 0.75;
  // Claims
  return STATUS_OPACITY[node.status] || 0.5;
}

export function nodeRadius(node) {
  if (node.type === 'tes') return 3;
  if (node.type === 'fp') return 6 + Math.sqrt(node.fanOut) * 2.5;
  if (node.type === 'da') return 5 + Math.sqrt(node.fanOut) * 2;
  if (node.type === 'hsk') return 5 + Math.sqrt(node.fanOut) * 2;
  // AI types
  if (node.type === 'sop') return 6 + Math.sqrt(node.fanOut) * 2;
  if (node.type === 'skl') return 4 + Math.sqrt(node.fanOut) * 2;
  if (node.type === 'tool') return 4 + Math.sqrt(node.fanOut) * 2;
  if (node.type === 'ifc') return 3.5;
  // Claims
  return 5 + Math.sqrt(node.fanOut) * 3;
}

export function nodeShape(node) {
  if (node.type === 'fp') return 'diamond';
  if (node.type === 'da') return 'square';
  if (node.type === 'tes') return 'triangle';
  if (node.type === 'hsk') return 'octagon';
  // AI types
  if (node.type === 'sop') return 'hexagon';
  if (node.type === 'skl') return 'pentagon';
  if (node.type === 'tool') return 'square';
  if (node.type === 'ifc') return 'triangle';
  return 'circle';
}
