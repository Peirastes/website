/**
 * Parse AI Knowledge Base files into nodes and links
 */

// ─── Agent Files (SOPs + Skills) ─────────────────────────────────────────────
export function parseAgentFile(markdown, agentKey) {
  const nodes = [];
  if (!markdown) return nodes;

  // Extract agent ID from header metadata
  const agentIdMatch = markdown.match(/\*\*Agent ID:\*\*\s*(\w+)/);
  const agentId = agentIdMatch ? agentIdMatch[1] : agentKey.replace('_agent', '').toUpperCase();

  // Parse SOPs: ### SOP-XX-NNN: Title
  const sopRegex = /### (SOP-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### (?:SOP|SKL)-|## Skills|$)/g;
  let match;
  while ((match = sopRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    nodes.push({
      id,
      type: 'sop',
      title: title.trim(),
      domain: agentId,
      layer: 'ai',
      status: extractField(body, 'Status') || 'Active',
      owner: extractField(body, 'Owner') || agentId,
      contributors: extractField(body, 'Contributors') || agentId,
      version: extractField(body, 'Version') || '1.0',
      lastUpdated: extractField(body, 'Last Updated') || '',
      dependencies: extractDependencies(body),
      requiresKnowledge: extractRequiresKnowledge(body),
      triggers: extractField(body, 'Triggers') || '',
      outputs: extractField(body, 'Outputs') || '',
      interfaces: extractInterfaces(body),
      description: extractBlock(body, 'Description'),
      steps: extractBlock(body, 'Steps'),
      qualityCriteria: extractBlock(body, 'Quality Criteria')
    });
  }

  // Parse Skills: ### SKL-XX-NNN: Title
  const sklRegex = /### (SKL-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### (?:SOP|SKL)-|$)/g;
  while ((match = sklRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    nodes.push({
      id,
      type: 'skl',
      title: title.trim(),
      domain: agentId,
      layer: 'ai',
      status: extractField(body, 'Status') || 'Active',
      owner: extractField(body, 'Owner') || agentId,
      proficiency: extractField(body, 'Proficiency') || '',
      dependencies: extractDependencies(body),
      appliedIn: extractAppliedIn(body),
      description: extractBlock(body, 'Description')
    });
  }

  return nodes;
}

// ─── Tools ───────────────────────────────────────────────────────────────────
export function parseTools(markdown) {
  const nodes = [];
  if (!markdown) return nodes;

  const regex = /### (TOOL-\d+): (.+)\n([\s\S]*?)(?=\n### TOOL-|\n## |$)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    nodes.push({
      id,
      type: 'tool',
      title: title.trim(),
      domain: 'ai_shared',
      layer: 'ai',
      category: extractField(body, 'Category') || '',
      contributors: extractField(body, 'Contributors') || '',
      usedBy: extractField(body, 'Used By') || '',
      purpose: extractField(body, 'Purpose') || ''
    });
  }
  return nodes;
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
export function parseInterfaces(markdown) {
  const nodes = [];
  if (!markdown) return nodes;

  const regex = /### (IFC-[A-Z]+-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### IFC-|\n## |$)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const source = extractField(body, 'Source') || '';
    const target = extractField(body, 'Target') || '';
    nodes.push({
      id,
      type: 'ifc',
      title: title.trim(),
      domain: 'ai_shared',
      layer: 'ai',
      source,
      target,
      mechanism: extractField(body, 'Mechanism') || '',
      contributors: extractField(body, 'Contributors') || '',
      description: extractBlock(body, 'Description')
    });
  }
  return nodes;
}

// ─── Build AI Links ──────────────────────────────────────────────────────────
export function buildAILinks(nodes) {
  const links = [];
  const nodeIndex = new Set(nodes.map(n => n.id));

  for (const node of nodes) {
    // SOP/SKL dependencies → SKL, TOOL nodes
    if (node.dependencies) {
      for (const depId of node.dependencies) {
        if (nodeIndex.has(depId)) {
          links.push({ source: depId, target: node.id, type: 'ai-dependency' });
        }
      }
    }
    // SKL appliedIn → SOP nodes (reverse link: skill supports SOP)
    if (node.appliedIn) {
      for (const sopId of node.appliedIn) {
        if (nodeIndex.has(sopId)) {
          links.push({ source: node.id, target: sopId, type: 'ai-supports' });
        }
      }
    }
    // IFC nodes → source/target agent SOPs (inferred from agent code)
    if (node.type === 'ifc' && node.interfaces) {
      for (const ifcId of node.interfaces) {
        if (nodeIndex.has(ifcId)) {
          links.push({ source: node.id, target: ifcId, type: 'ai-interface' });
        }
      }
    }
  }

  // SOP interface references → IFC nodes
  for (const node of nodes) {
    if (node.type === 'sop' && node.interfaces) {
      for (const ifcId of node.interfaces) {
        if (nodeIndex.has(ifcId)) {
          links.push({ source: ifcId, target: node.id, type: 'ai-interface' });
        }
      }
    }
  }

  return links;
}

// ─── Human Skills ───────────────────────────────────────────────────────────
export function parseHumanSkills(markdown) {
  const nodes = [];
  if (!markdown) return nodes;

  const regex = /### (HSK-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### HSK-|\n## |$)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    nodes.push({
      id,
      type: 'hsk',
      title: title.trim(),
      domain: 'human_skills',
      layer: 'human',
      status: extractField(body, 'Status') || 'Active',
      requiresKnowledge: extractRequiresKnowledge(body),
      delegatedTo: extractField(body, 'Delegated To') || '',
      delegateAgents: extractDelegateAgents(body),
      lastExercised: extractField(body, 'Last Exercised') || '',
      exerciseFrequency: extractField(body, 'Exercise Frequency') || '',
      skillDomain: extractField(body, 'Skill Domain') || '',
      description: extractBlock(body, 'Description')
    });
  }
  return nodes;
}

function extractDelegateAgents(body) {
  const line = extractField(body, 'Delegated To');
  if (!line) return [];
  const ids = line.match(/SOP-[A-Z]+-\d+/g);
  return ids || [];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function extractField(body, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.+)`);
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

function extractBlock(body, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`);
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function extractDependencies(body) {
  const depsLine = extractField(body, 'Dependencies');
  if (!depsLine) return [];
  const ids = depsLine.match(/(SOP-[A-Z]+-\d+|SKL-[A-Z]+-\d+|TOOL-\d+|IFC-[A-Z]+-[A-Z]+-\d+)/g);
  return ids || [];
}

function extractRequiresKnowledge(body) {
  const line = extractField(body, 'Requires Knowledge');
  if (!line) return [];
  const ids = line.match(/(FP-\d+|DA-[A-Z]+-\d+|[A-Z]+-\d+(?:\.\d+)?)/g);
  return ids || [];
}

function extractInterfaces(body) {
  const ifcLine = extractField(body, 'Interfaces');
  if (!ifcLine) return [];
  const ids = ifcLine.match(/IFC-[A-Z]+-[A-Z]+-\d+/g);
  return ids || [];
}

function extractAppliedIn(body) {
  const line = extractField(body, 'Applied In');
  if (!line) return [];
  const ids = line.match(/SOP-[A-Z]+-\d+/g);
  return ids || [];
}
