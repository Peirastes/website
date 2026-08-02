#!/usr/bin/env node
/**
 * Export the unified knowledge base to JSON for the web viewer.
 * Merged foundation (FPs shared), cross-boundary K→S edges, human skills.
 *
 * Usage: node scripts/export-kb.js
 * Output: ../../../kb-explorer/kb-data.json
 */

const fs = require('fs');
const path = require('path');

const KB_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'Agents', 'Scientist', 'knowledge-base');
const DOMAINS_DIR = path.join(KB_DIR, 'domains');
const AI_KB_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'Agents', 'knowledge-base');
const AI_AGENTS_DIR = path.join(AI_KB_DIR, 'agents');
const AI_SHARED_DIR = path.join(AI_KB_DIR, 'shared');
const HUMAN_DIR = path.join(AI_KB_DIR, 'human');
const QUOTES_FILE = path.resolve(__dirname, '..', '..', '..', 'quotes.html');
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', '..', 'kb-explorer');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'kb-data.json');

const DOMAIN_FILES = [
  'epistemology_and_method.md', 'ecdo_theory.md', 'thermofluidic_finance.md',
  'dynamical_systems.md', 'pedagogy_and_assessment.md', 'archaeoastronomy.md',
  'physics_content.md', 'biology.md', 'social_field_theory.md'
];
const AGENT_FILES = [
  'artist.md', 'engineer.md', 'scientist.md', 'professor.md',
  'web_admin.md', 'project_manager.md', 'personal_assistant.md'
];

// ─── Shared Helpers ─────────────────────────────────────────────────────────

function readFile(p) {
  try { return fs.readFileSync(p, 'utf-8'); }
  catch { return null; }
}

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

function extractKBIds(line) {
  if (!line) return [];
  return line.match(/(FP-\d+|DA-[A-Z]+-\d+|[A-Z]+-\d+)/g) || [];
}

// ─── Human KB Parsers ───────────────────────────────────────────────────────

function parseFoundation(markdown) {
  const nodes = [];
  // FPs serve as shared foundation for both layers
  const fpRegex = /### (FP-\d+): (.+)\n([\s\S]*?)(?=\n### |\n---|\n## |$)/g;
  let match;
  while ((match = fpRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    nodes.push({
      id, type: 'fp', title: title.trim(),
      statement: extractField(body, 'Statement') || '',
      source: extractField(body, 'Source') || '',
      domain: 'foundation', layer: 'shared'  // shared across both layers
    });
  }
  const daRegex = /#### (DA-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n#### |\n### |\n---|\n\*|$)/g;
  while ((match = daRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const domainCode = id.match(/DA-([A-Z]+)-/);
    const domainMap = { ECDO: 'ECDO', TF: 'TF', DSL: 'DSL', PED: 'PED', EPI: 'EPI' };
    nodes.push({
      id, type: 'da', title: title.trim(),
      status: extractField(body, 'Status') || 'Draft',
      statement: extractField(body, 'Statement') || '',
      domain: domainCode ? (domainMap[domainCode[1]] || 'foundation') : 'foundation',
      layer: 'human'
    });
  }
  return nodes;
}

function parseDomainFile(markdown) {
  const claims = [];
  const claimRegex = /### ([A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### [A-Z]+-\d+:|\n\*Last updated|$)/g;
  let match;
  while ((match = claimRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const prefixMap = { EPI:'EPI', ECDO:'ECDO', TF:'TF', DSL:'DSL', PED:'PED', ARCH:'ARCH', PHYS:'PHYS', BIO:'BIO', SFT:'SFT' };
    const prefix = id.match(/^([A-Z]+)-/);
    const depsLine = extractField(body, 'Dependencies') || '';
    const deps = depsLine.match(/(FP-\d+|DA-[A-Z]+-\d+|[A-Z]+-\d+)/g) || [];
    const tesRefs = [...new Set(body.match(/TES-[A-Z]+-\d+/g) || [])];
    claims.push({
      id, type: 'claim', title: title.trim(),
      domain: prefix ? (prefixMap[prefix[1]] || 'unknown') : 'unknown',
      status: extractField(body, 'Status') || 'Unknown',
      confidence: extractField(body, 'Confidence') || 'Low',
      inferenceMode: extractField(body, 'Inference Mode') || '',
      pscprStage: extractField(body, 'PSCPR Stage') || '',
      sourceType: extractField(body, 'Source Type') || '',
      firstAsserted: extractField(body, 'First Asserted') || '',
      lastReviewed: extractField(body, 'Last Reviewed') || '',
      dependencies: deps,
      statement: extractBlock(body, 'Statement'),
      evidence: extractBlock(body, 'Evidence'),
      counterEvidence: extractBlock(body, 'Counter-evidence / Tensions'),
      tesFilter: extractField(body, 'TES Filter') || '',
      notes: extractBlock(body, 'Notes'),
      tesRefs,
      layer: 'human'
    });
  }
  return claims;
}

function parseTesIndex(markdown) {
  const concepts = new Map();
  let currentArticle = '';
  for (const line of markdown.split('\n')) {
    const art = line.match(/^####\s+\d+\.\s+(.+?)\s*$/);
    if (art) { currentArticle = art[1].trim(); continue; }
    const m = line.match(/^\|\s*(TES-[A-Z]+-\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (!m) continue;
    const [, id, concept, use] = m;
    if (concept === 'Concept' || concept.startsWith('---')) continue;
    concepts.set(id, { id, type: 'tes', concept: concept.trim(), use: use.trim(), article: currentArticle, domain: 'tes', layer: 'human' });
  }
  return concepts;
}

// ─── Quotes Parser ──────────────────────────────────────────────────────────

const TAG_TO_FPS = {
  science:['FP-005','FP-008','FP-010'], knowledge:['FP-003','FP-014'],
  philosophy:['FP-001','FP-010'], truth:['FP-009','FP-004','FP-002'],
  education:['FP-011','FP-012','FP-013'], freedom:['FP-003','FP-002'],
  transformation:['FP-006','FP-012'], suffering:['FP-006','FP-012'],
  psychology:['FP-006','FP-013'], discipline:['FP-010','FP-007'],
  stoicism:['FP-010','FP-007'], virtue:['FP-010','FP-015'],
  action:['FP-003','FP-007'], tyranny:['FP-002','FP-013'],
  love:['FP-015','FP-016'], courage:['FP-006','FP-003'],
};

function parseQuotes(html) {
  const quotes = [];
  // Matches the current quotes.html structure (restyled 2026-05-17):
  //   <article class="quote" data-tags="..."><blockquote class="quote__text">...</blockquote><cite class="quote__cite">Author<em>?optional source</em>?</cite></article>
  // The em-dash before author now lives in CSS (::before), so it's no longer in markup.
  const cardRegex = /<article class="quote" data-tags="([^"]+)">\s*<blockquote class="quote__text">([\s\S]*?)<\/blockquote>\s*<cite class="quote__cite">([\s\S]*?)<\/cite>/g;
  let match;
  let idx = 1;
  while ((match = cardRegex.exec(html)) !== null) {
    const [, tagsStr, rawText, rawAuthor] = match;
    const tags = tagsStr.trim().split(/\s+/);
    const id = `Q-${String(idx).padStart(3, '0')}`;
    const text = rawText.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/[\u201C\u201D""]/g, '').replace(/[\u2018\u2019'']/g, "'").replace(/^\s*["']|["']\s*$/g, '').trim();
    const author = rawAuthor.replace(/<\/?em>/g, '').trim();
    const fpSet = new Set();
    for (const tag of tags) { for (const fp of (TAG_TO_FPS[tag] || [])) fpSet.add(fp); }
    quotes.push({ id, type: 'quote', text, author, tags, fpLinks: [...fpSet], domain: 'quotes', layer: 'human' });
    idx++;
  }
  return quotes;
}

// ─── AI KB Parsers ──────────────────────────────────────────────────────────

function parseAgentFile(markdown, agentKey) {
  const nodes = [];
  if (!markdown) return nodes;
  const agentIdMatch = markdown.match(/\*\*Agent ID:\*\*\s*(\w+)/);
  const agentId = agentIdMatch ? agentIdMatch[1] : agentKey.replace('_agent', '').toUpperCase();

  // SOPs
  const sopRegex = /### (SOP-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### (?:SOP|SKL)-|## Skills|$)/g;
  let match;
  while ((match = sopRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const depsLine = extractField(body, 'Dependencies') || '';
    const deps = depsLine.match(/(SOP-[A-Z]+-\d+|SKL-[A-Z]+-\d+|TOOL-\d+|IFC-[A-Z]+-[A-Z]+-\d+)/g) || [];
    const reqKnowledge = extractKBIds(extractField(body, 'Requires Knowledge'));
    const ifcLine = extractField(body, 'Interfaces') || '';
    const ifcs = ifcLine.match(/IFC-[A-Z]+-[A-Z]+-\d+/g) || [];
    nodes.push({
      id, type: 'sop', title: title.trim(), domain: agentId, layer: 'ai',
      status: extractField(body, 'Status') || 'Active',
      owner: extractField(body, 'Owner') || agentId,
      contributors: extractField(body, 'Contributors') || agentId,
      version: extractField(body, 'Version') || '1.0',
      lastUpdated: extractField(body, 'Last Updated') || '',
      dependencies: deps, requiresKnowledge: reqKnowledge,
      triggers: extractField(body, 'Triggers') || '',
      outputs: extractField(body, 'Outputs') || '', interfaces: ifcs,
      description: extractBlock(body, 'Description'),
      steps: extractBlock(body, 'Steps'),
      qualityCriteria: extractBlock(body, 'Quality Criteria')
    });
  }

  // Skills
  const sklRegex = /### (SKL-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### (?:SOP|SKL)-|$)/g;
  while ((match = sklRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const depsLine = extractField(body, 'Dependencies') || '';
    const deps = depsLine.match(/(FP-\d+|SOP-[A-Z]+-\d+|SKL-[A-Z]+-\d+|TOOL-\d+)/g) || [];
    const appliedLine = extractField(body, 'Applied In') || '';
    const appliedIn = appliedLine.match(/SOP-[A-Z]+-\d+/g) || [];
    nodes.push({
      id, type: 'skl', title: title.trim(), domain: agentId, layer: 'ai',
      status: extractField(body, 'Status') || 'Active',
      owner: extractField(body, 'Owner') || agentId,
      proficiency: extractField(body, 'Proficiency') || '',
      dependencies: deps, appliedIn,
      description: extractBlock(body, 'Description')
    });
  }
  return nodes;
}

function parseTools(markdown) {
  const nodes = [];
  if (!markdown) return nodes;
  const regex = /### (TOOL-\d+): (.+)\n([\s\S]*?)(?=\n### TOOL-|\n## |$)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    nodes.push({
      id, type: 'tool', title: title.trim(), domain: 'ai_shared', layer: 'ai',
      category: extractField(body, 'Category') || '',
      contributors: extractField(body, 'Contributors') || '',
      usedBy: extractField(body, 'Used By') || '',
      purpose: extractField(body, 'Purpose') || ''
    });
  }
  return nodes;
}

function parseInterfaces(markdown) {
  const nodes = [];
  if (!markdown) return nodes;
  const regex = /### (IFC-[A-Z]+-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### IFC-|\n## |$)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    nodes.push({
      id, type: 'ifc', title: title.trim(), domain: 'ai_shared', layer: 'ai',
      ifcSource: extractField(body, 'Source') || '',
      ifcTarget: extractField(body, 'Target') || '',
      mechanism: extractField(body, 'Mechanism') || '',
      contributors: extractField(body, 'Contributors') || '',
      description: extractBlock(body, 'Description')
    });
  }
  return nodes;
}

// ─── Human Skills Parser ────────────────────────────────────────────────────

function parseHumanSkills(markdown) {
  const nodes = [];
  if (!markdown) return nodes;
  const regex = /### (HSK-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### HSK-|$)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const reqKnowledge = extractKBIds(extractField(body, 'Requires Knowledge'));
    const delegatedTo = extractField(body, 'Delegated To') || 'None';
    // Extract agent codes from delegatedTo for delegation links
    const delegateAgents = delegatedTo.match(/\b(CE|CD|PM|RA|SA|TA)\b/g) || [];
    // Domain from ID: HSK-PHYS-001 → PHYS
    const domainMatch = id.match(/HSK-([A-Z]+)-/);
    const domain = domainMatch ? domainMatch[1] : 'unknown';
    nodes.push({
      id, type: 'hsk', title: title.trim(),
      domain: 'human_skills', layer: 'human',
      skillDomain: domain,
      status: extractField(body, 'Status') || 'Active',
      owner: 'Human',
      proficiency: extractField(body, 'Proficiency') || '',
      requiresKnowledge: reqKnowledge,
      delegatedTo, delegateAgents,
      lastExercised: extractField(body, 'Last Exercised') || '',
      exerciseFrequency: extractField(body, 'Exercise Frequency') || '',
      description: extractBlock(body, 'Description')
    });
  }
  return nodes;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('Reading Human KB from:', KB_DIR);
  console.log('Reading AI KB from:', AI_KB_DIR);

  // ─── Human KB ──────────────────────────────────────────────────────────
  const foundation = fs.readFileSync(path.join(KB_DIR, 'FOUNDATION.md'), 'utf-8');
  const tesIndex = fs.readFileSync(path.join(KB_DIR, 'TES_INDEX.md'), 'utf-8');

  const foundationNodes = parseFoundation(foundation);
  const claimNodes = [];
  for (const file of DOMAIN_FILES) {
    const md = fs.readFileSync(path.join(DOMAINS_DIR, file), 'utf-8');
    claimNodes.push(...parseDomainFile(md));
  }
  const tesMap = parseTesIndex(tesIndex);

  const referencedTesIds = new Set();
  for (const claim of claimNodes) { for (const ref of claim.tesRefs) referencedTesIds.add(ref); }

  // Surface the full TES corpus as browsable nodes (not only claim-referenced concepts)
  const tesNodes = [];
  for (const [id, info] of tesMap) {
    tesNodes.push({
      id, type: 'tes', concept: info.concept, use: info.use,
      article: info.article || '', referenced: referencedTesIds.has(id),
      domain: 'tes', layer: 'human'
    });
  }

  const quotesHtml = fs.readFileSync(QUOTES_FILE, 'utf-8');
  const quoteNodes = parseQuotes(quotesHtml);

  // ─── Human Skills ──────────────────────────────────────────────────────
  const hskMd = readFile(path.join(HUMAN_DIR, 'skills.md'));
  const hskNodes = parseHumanSkills(hskMd);

  // ─── AI KB (no more AP — FPs are the shared foundation) ────────────────
  const agentNodes = [];
  for (const file of AGENT_FILES) {
    const md = fs.readFileSync(path.join(AI_AGENTS_DIR, file), 'utf-8');
    agentNodes.push(...parseAgentFile(md, file.replace('.md', '')));
  }

  const toolNodes = parseTools(fs.readFileSync(path.join(AI_SHARED_DIR, 'tools.md'), 'utf-8'));
  const ifcNodes = parseInterfaces(fs.readFileSync(path.join(AI_SHARED_DIR, 'interfaces.md'), 'utf-8'));

  // ─── Combine ───────────────────────────────────────────────────────────
  const allAINodes = [...agentNodes, ...toolNodes, ...ifcNodes];
  const nodes = [...foundationNodes, ...claimNodes, ...tesNodes, ...quoteNodes, ...hskNodes, ...allAINodes];
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));

  // ─── Build Links ───────────────────────────────────────────────────────
  const links = [];

  // Human knowledge dependency chain
  for (const claim of claimNodes) {
    for (const depId of claim.dependencies) {
      if (nodeIndex.has(depId)) links.push({ source: depId, target: claim.id, type: 'dependency' });
    }
    for (const tesId of claim.tesRefs) {
      if (nodeIndex.has(tesId)) links.push({ source: tesId, target: claim.id, type: 'tes-reference' });
    }
  }
  for (const q of quoteNodes) {
    for (const fpId of q.fpLinks) {
      if (nodeIndex.has(fpId)) links.push({ source: fpId, target: q.id, type: 'quote-resonance' });
    }
  }

  // TES internal cross-references (parsed from each concept's "use" text — "Connects to FP-… / TES-…").
  // Typed as 'tes-reference' so they render as peripheral connective tissue without reshaping the radial layout.
  for (const t of tesNodes) {
    const refs = new Set((t.use.match(/(FP-\d+|TES-[A-Z]+-\d+)/g) || []).filter(r => r !== t.id));
    for (const ref of refs) {
      if (nodeIndex.has(ref)) links.push({ source: t.id, target: ref, type: 'tes-reference' });
    }
  }

  // AI skill dependency chain (within AI layer)
  for (const node of allAINodes) {
    if (node.dependencies) {
      for (const depId of node.dependencies) {
        if (nodeIndex.has(depId)) links.push({ source: depId, target: node.id, type: 'ai-dependency' });
      }
    }
    if (node.appliedIn) {
      for (const sopId of node.appliedIn) {
        if (nodeIndex.has(sopId)) links.push({ source: node.id, target: sopId, type: 'ai-supports' });
      }
    }
    if (node.type === 'sop' && node.interfaces) {
      for (const ifcId of node.interfaces) {
        if (nodeIndex.has(ifcId)) links.push({ source: ifcId, target: node.id, type: 'ai-interface' });
      }
    }
  }

  // ─── Cross-boundary K→S edges ──────────────────────────────────────────
  // SOPs that require human knowledge
  for (const node of allAINodes) {
    if (node.requiresKnowledge) {
      for (const kId of node.requiresKnowledge) {
        if (nodeIndex.has(kId)) links.push({ source: kId, target: node.id, type: 'requires-knowledge' });
      }
    }
  }
  // Human skills that require human knowledge
  for (const hsk of hskNodes) {
    if (hsk.requiresKnowledge) {
      for (const kId of hsk.requiresKnowledge) {
        if (nodeIndex.has(kId)) links.push({ source: kId, target: hsk.id, type: 'requires-knowledge' });
      }
    }
    // Delegation links: human skill → AI SOPs via agent code
    for (const agentCode of hsk.delegateAgents) {
      // Find SOPs owned by this agent
      const agentSOPs = allAINodes.filter(n => n.type === 'sop' && n.owner === agentCode);
      // Link to first SOP as delegation indicator (lightweight)
      if (agentSOPs.length > 0) {
        links.push({ source: hsk.id, target: agentSOPs[0].id, type: 'delegates-to' });
      }
    }
  }

  // Compute fan-out
  const fanOut = new Map();
  for (const link of links) { fanOut.set(link.source, (fanOut.get(link.source) || 0) + 1); }
  for (const node of nodes) { node.fanOut = fanOut.get(node.id) || 0; }

  const sopNodes = allAINodes.filter(n => n.type === 'sop');
  const sklNodes = allAINodes.filter(n => n.type === 'skl');

  const data = {
    generated: new Date().toISOString(),
    stats: {
      nodes: nodes.length, links: links.length,
      claims: claimNodes.length,
      established: claimNodes.filter(c => c.status === 'Established').length,
      hypothesized: claimNodes.filter(c => c.status === 'Hypothesized').length,
      speculative: claimNodes.filter(c => c.status === 'Speculative').length,
      quotes: quoteNodes.length,
      tesConcepts: tesNodes.length,
      humanSkills: hskNodes.length,
      sops: sopNodes.length, skills: sklNodes.length, tools: toolNodes.length,
      interfaces: ifcNodes.length
    },
    nodes,
    links
  };

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

  const humanCount = foundationNodes.length + claimNodes.length + tesNodes.length + quoteNodes.length + hskNodes.length;
  const aiCount = allAINodes.length;
  const crossLinks = links.filter(l => l.type === 'requires-knowledge' || l.type === 'delegates-to').length;
  console.log(`Exported: ${nodes.length} nodes (${humanCount} human+shared, ${aiCount} AI), ${links.length} links (${crossLinks} cross-boundary) → ${OUTPUT_FILE}`);
}

main();
