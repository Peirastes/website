/**
 * kb-module.js — Shared Knowledge Base query module
 *
 * Extracts all KB query logic into a reusable Node.js module consumed by:
 *   1. The ETM server (API endpoints)
 *   2. The Copilot (tool execution)
 *   3. The export script (optionally)
 *
 * All algorithms ported from kb-explorer/app.html (the authoritative source).
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

/** Radial-layout sector angles (degrees, clockwise from top). */
const DOMAIN_ANGLES = {
  foundation: null,  // tier-0 FPs spread by data-driven domain assignment
  PHIL: 0,   PHYS: 40,  DSL: 80,   TF: 120,
  EPI: 160,  PED: 200,  ai_shared: 240,
  ARCH: 280, ECDO: 320
};

/** Human-readable domain labels. */
const DOMAIN_NAMES = {
  foundation: 'Foundation',
  PHIL: 'Philosophy & Ethics',
  EPI: 'Epistemology',
  ECDO: 'ECDO Theory',
  TF: 'Thermofluidic Finance',
  DSL: 'Dynamical Systems',
  PED: 'Pedagogy & Assessment',
  ARCH: 'Archaeoastronomy',
  PHYS: 'Physics',
  tes: 'TES Concepts',
  quotes: 'Quotes',
  unknown: 'Unknown',
  ai_shared: 'Computer Systems & AI',
  human_skills: 'Human Skills',
  CE: 'Computer Engineering',
  CD: 'Content & Communication',
  PM: 'Project Management',
  RA: 'Research',
  SA: 'Publishing & Distribution',
  TA: 'Teaching'
};

/** TES scientific-method ring labels (6 rings, 0–5). */
const METHOD_RING_LABELS = {
  0: 'First Principles',
  1: 'Observation / Intelligence',
  2: 'Analysis / Construct',
  3: 'Inference / Testing',
  4: 'Established / Theory',
  5: 'Applied Capability'
};

/** Canonical node-type colors (hex). */
const COLORS = {
  foundation: '#d0d8e8', PHIL: '#b8a0d8', EPI: '#6ea8fe', ECDO: '#e07050',
  TF: '#50c878', DSL: '#c084fc', PED: '#fbbf24', ARCH: '#f87171',
  PHYS: '#60b8e0', tes: '#607080', quotes: '#a08850', unknown: '#555',
  ai_shared: '#7a8a9a', human_skills: '#e8a040',
  CE: '#00d4aa', CD: '#ff8866', PM: '#77aaff', RA: '#ffcc44',
  SA: '#cc88ff', TA: '#88ddaa'
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve a link endpoint to its ID string, handling both raw strings
 * and D3-hydrated objects with an `.id` property.
 */
function linkId(endpoint) {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
}

// ─── Data Loading ────────────────────────────────────────────────────────────

/**
 * Load and parse kb-data.json.
 *
 * @param {string} [kbDataPath] — absolute path to kb-data.json.
 *   Defaults to Website/kb-explorer/kb-data.json relative to this file.
 * @returns {{ nodes: object[], links: object[], stats: object, generated: string }}
 */
function loadKBData(kbDataPath) {
  const resolved = kbDataPath ||
    path.resolve(__dirname, '..', '..', '..', 'kb-explorer', 'kb-data.json');
  const raw = fs.readFileSync(resolved, 'utf-8');
  return JSON.parse(raw);
}

// ─── Domain Mapping ──────────────────────────────────────────────────────────

/**
 * Compute data-driven FP → domain assignments by counting which domains
 * reference each FP node via `requires-knowledge` or `dependency` links.
 *
 * @returns {Map<string, string>} fpId → radial domain code
 */
function buildFPDomainMap(nodes, links) {
  const fpDomainMap = new Map();

  for (const n of nodes) {
    if (n.type !== 'fp') continue;

    const domainCounts = {};
    for (const l of links) {
      if (l.type !== 'requires-knowledge' && l.type !== 'dependency') continue;
      const srcId = linkId(l.source);
      const tgtId = linkId(l.target);
      if (srcId !== n.id) continue;

      const tgtNode = nodes.find(nn => nn.id === tgtId);
      if (!tgtNode) continue;
      // Only count proper knowledge domains, not agent/owner/source domains
      const d = tgtNode.domain;
      const knowledgeDomains = ['EPI','ECDO','TF','DSL','PED','ARCH','PHYS'];
      if (d && knowledgeDomains.includes(d)) {
        domainCounts[d] = (domainCounts[d] || 0) + 1;
      }
    }

    let bestDomain = 'PHIL';  // default: FPs are philosophical axioms
    let bestCount = 0;
    for (const [d, c] of Object.entries(domainCounts)) {
      if (c > bestCount) { bestCount = c; bestDomain = d; }
    }
    fpDomainMap.set(n.id, bestDomain);
  }

  return fpDomainMap;
}

/**
 * Map any node to one of the 9 radial knowledge-domain sectors.
 *
 * Port of the full `getRadialDomain()` from app.html, including:
 *   FP → data-driven, HSK → by skillDomain, agent SOPs/SKLs → by owner+title,
 *   IFC → EPI, TES → by prefix, Quotes → by tag, claims/DAs → original domain.
 *
 * @param {object} node
 * @param {Map<string, string>} [fpDomainMap] — pre-computed FP domain map.
 *   If omitted, FPs default to 'EPI'.
 * @returns {string} domain code (e.g. 'PHIL', 'PHYS', 'ai_shared')
 */
function getRadialDomain(node, fpDomainMap) {
  const n = node;

  // FP nodes: data-driven
  if (n.type === 'fp') {
    return (fpDomainMap && fpDomainMap.get(n.id)) || 'EPI';
  }

  // HSK nodes: skills go in the domain of the PRACTICE, not the subject matter
  if (n.type === 'hsk') {
    const t = (n.title || '').toLowerCase();
    if (n.skillDomain === 'PHYS') return 'PED';
    if (n.skillDomain === 'PED')  return 'PED';
    if (n.skillDomain === 'RES')  return 'EPI';
    if (n.skillDomain === 'ENG')  return 'DSL';
    if (n.skillDomain === 'BIZ') {
      if (t.includes('agent') || t.includes('orchestrat')) return 'ai_shared';
      return 'TF';
    }
    if (n.skillDomain === 'DEV') {
      if (t.includes('simulation') || t.includes('python scientific')) return 'PHYS';
      if (t.includes('dashboard') || t.includes('monitoring')) return 'TF';
      return 'ai_shared';
    }
    return 'ai_shared';
  }

  // Agent SOPs and Skills — map to knowledge domain by owner + title keywords
  if (n.type === 'sop' || n.type === 'skl') {
    // TA → mostly Pedagogy
    if (n.owner === 'TA') {
      const t = (n.title || '').toLowerCase();
      if (t.includes('physics content') || t.includes('figure')) return 'PHYS';
      if (t.includes('pipeline') || t.includes('document')) return 'ai_shared';
      return 'PED';
    }
    // RA → Epistemology
    if (n.owner === 'RA') return 'EPI';
    // CE → by skill content
    if (n.owner === 'CE') {
      const t = (n.title || '').toLowerCase();
      if (t.includes('simulation') || t.includes('numerical') || t.includes('scientific') || t.includes('physics')) return 'PHYS';
      if (t.includes('ta agent') || t.includes('katex') || t.includes('manim') || t.includes('quarto') || t.includes('pipeline')) return 'PED';
      if (t.includes('cesium') || t.includes('geospatial')) return 'ECDO';
      if (t.includes('d3')) return 'EPI';
      if (t.includes('claude')) return 'ai_shared';
      if (t.includes('version control')) return 'ai_shared';
      if (t.includes('chart') || t.includes('time-series')) return 'TF';
      return 'ai_shared';
    }
    // CD → by content type
    if (n.owner === 'CD') {
      const t = (n.title || '').toLowerCase();
      if (t.includes('pedagogy') || t.includes('course') || t.includes('lesson') || t.includes('ebook')) return 'PED';
      if (t.includes('debate') || t.includes('philosophical')) return 'PHIL';
      if (t.includes('marketing') || t.includes('brand') || t.includes('audience')) return 'ai_shared';
      return 'PED';
    }
    // PM → ai_shared
    if (n.owner === 'PM') return 'ai_shared';
    // SA → by function
    if (n.owner === 'SA') {
      const t = (n.title || '').toLowerCase();
      if (t.includes('youtube') || t.includes('publish')) return 'PED';
      if (t.includes('seo') || t.includes('analytics') || t.includes('storefront') || t.includes('payment') || t.includes('web')) return 'ai_shared';
      return 'ai_shared';
    }
  }

  // IFC interfaces → EPI (coordination methodology)
  if (n.type === 'ifc') return 'EPI';

  // TES concepts: distribute into proper fields by prefix
  if (n.type === 'tes') {
    const prefix = (n.id.match(/^TES-([A-Z]+)/) || [])[1] || '';
    if (prefix === 'ECDO' || prefix === 'EXO' || prefix === 'ACAN') return 'ECDO';
    if (prefix === 'COH' || prefix === 'HPS') return 'PHIL';
    if (prefix === 'INT' || prefix === 'SAI') return 'PHIL';
    if (prefix === 'EXP') return 'PED';
    return 'EPI';
  }

  // Quotes: map by primary tag to knowledge domain
  if (n.type === 'quote') {
    const tags = n.tags || [];
    if (tags.includes('science')) return 'PHYS';
    if (tags.includes('education')) return 'PED';
    // All other philosophical/ethical/moral tags → PHIL
    if (tags.includes('philosophy') || tags.includes('truth') || tags.includes('knowledge')) return 'PHIL';
    if (tags.includes('psychology') || tags.includes('transformation') || tags.includes('suffering')) return 'PHIL';
    if (tags.includes('discipline') || tags.includes('stoicism') || tags.includes('virtue')) return 'PHIL';
    if (tags.includes('freedom') || tags.includes('tyranny') || tags.includes('courage')) return 'PHIL';
    if (tags.includes('action')) return 'PHIL';
    if (tags.includes('love')) return 'PHIL';
    return 'PHIL';  // default: philosophical
  }

  // Everything else: use original domain
  return n.domain;
}

// ─── Tier / Stage Computation ────────────────────────────────────────────────

/**
 * Compute dependency-depth tiers for all nodes.
 *
 * Tiers are 0-based: nodes with no incoming dependencies are tier 0,
 * their direct dependents are tier 1, etc.  TES and quote nodes are
 * pushed to maxTier + 1 (peripheral ring).
 *
 * @returns {Map<string, number>} nodeId → tier
 */
function computeTiers(nodes, links) {
  const incoming = new Map();
  for (const n of nodes) incoming.set(n.id, new Set());

  for (const l of links) {
    if (l.type === 'quote-resonance' || l.type === 'tes-reference') continue;
    const srcId = linkId(l.source);
    const tgtId = linkId(l.target);
    if (incoming.has(tgtId) && incoming.has(srcId)) {
      incoming.get(tgtId).add(srcId);
    }
  }

  const tier = new Map();
  const nodeIds = new Set(nodes.map(n => n.id));

  function getTier(id, visited) {
    if (tier.has(id)) return tier.get(id);
    if (visited.has(id)) return 0;  // cycle guard
    visited.add(id);
    const deps = incoming.get(id);
    if (!deps || deps.size === 0) { tier.set(id, 0); return 0; }
    let maxDep = 0;
    for (const depId of deps) {
      if (nodeIds.has(depId)) maxDep = Math.max(maxDep, getTier(depId, visited));
    }
    const t = maxDep + 1;
    tier.set(id, t);
    return t;
  }

  for (const n of nodes) getTier(n.id, new Set());

  const maxTier = Math.max(...tier.values(), 0);
  for (const n of nodes) {
    if (n.type === 'tes' || n.type === 'quote') tier.set(n.id, maxTier + 1);
  }

  return tier;
}

/**
 * Assign nodes to TES scientific-method rings (PSCPR mapping, 6 stages).
 *
 * | Ring | Stage                          |
 * |------|--------------------------------|
 * |  0   | First Principles (FPs)         |
 * |  1   | Observation / Intelligence     |
 * |  2   | Analysis / Construct           |
 * |  3   | Inference / Testing            |
 * |  4   | Established / Theory           |
 * |  5   | Applied Capability             |
 *
 * @returns {Map<string, number>} nodeId → stage (0–5)
 */
function computeMethodStages(nodes) {
  const stage = new Map();

  for (const n of nodes) {
    // Ring 0: First Principles
    if (n.type === 'fp') { stage.set(n.id, 0); continue; }

    // Ring 5: Applied capability
    if (n.type === 'sop' || n.type === 'skl' || n.type === 'hsk' ||
        n.type === 'tool' || n.type === 'ifc') {
      stage.set(n.id, 5);
      continue;
    }

    // Ring 1: TES concepts and Quotes
    if (n.type === 'tes' || n.type === 'quote') { stage.set(n.id, 1); continue; }

    // Claims and DAs: use pscprStage field
    const pscpr = (n.pscprStage || '').toLowerCase();
    if (pscpr.includes('observation')) { stage.set(n.id, 1); continue; }
    if (pscpr.includes('analysis'))    { stage.set(n.id, 2); continue; }
    if (pscpr.includes('inference'))   { stage.set(n.id, 3); continue; }
    if (pscpr.includes('exploration')) { stage.set(n.id, 4); continue; }

    // Fallback: use status as proxy
    if (n.type === 'da')                { stage.set(n.id, 4); continue; }
    if (n.status === 'Established')     { stage.set(n.id, 4); continue; }
    if (n.status === 'Hypothesized')    { stage.set(n.id, 3); continue; }
    if (n.status === 'Speculative')     { stage.set(n.id, 2); continue; }

    stage.set(n.id, 2);  // default: analysis
  }

  return stage;
}

// ─── Query Algorithms ────────────────────────────────────────────────────────

/**
 * Gap Analysis — find skills with weak/missing knowledge foundations.
 *
 * Examines every SOP, SKL, and HSK that declares `requiresKnowledge`.
 * A knowledge dependency is "weak" if the referenced node is missing or
 * has a status other than Established (FPs are always solid and skipped).
 *
 * @returns {object[]} Sorted by score (worst gaps first).
 *   Each entry: { skill: {id, title, type, domain}, weakCount, total,
 *                  weakDeps: [{id, reason}], score }
 */
function queryGapAnalysis(data) {
  const { nodes, links } = data;
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));

  const skillNodes = nodes.filter(n =>
    n.type === 'sop' || n.type === 'skl' || n.type === 'hsk'
  );

  const results = [];

  for (const skill of skillNodes) {
    const reqK = skill.requiresKnowledge || [];
    if (reqK.length === 0) continue;

    let weak = 0;
    const weakDeps = [];

    for (const kId of reqK) {
      const kNode = nodeIndex.get(kId);
      if (!kNode) {
        weak++;
        weakDeps.push({ id: kId, reason: 'missing' });
        continue;
      }
      if (kNode.type === 'fp') continue;  // FPs are axiomatic
      if (kNode.status && kNode.status !== 'Established') {
        weak++;
        weakDeps.push({ id: kId, reason: kNode.status });
      }
    }

    if (weak > 0) {
      results.push({
        skill: { id: skill.id, title: skill.title, type: skill.type, domain: skill.domain },
        weakCount: weak,
        total: reqK.length,
        weakDeps,
        score: weak / reqK.length
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Impact Cascade — BFS downstream from a node through dependency edges.
 *
 * Follows: dependency, requires-knowledge, ai-dependency, ai-supports.
 *
 * @param {object} data — { nodes, links }
 * @param {string} nodeId — ID of the source node
 * @returns {{ source: {id, title}, affected: object[], totalAffected: number }}
 */
function queryImpactCascade(data, nodeId) {
  const { nodes, links } = data;
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));
  const sourceNode = nodeIndex.get(nodeId);
  if (!sourceNode) {
    return { source: { id: nodeId, title: '(not found)' }, affected: [], totalAffected: 0 };
  }

  const depTypes = new Set(['dependency', 'requires-knowledge', 'ai-dependency', 'ai-supports']);
  const visited = new Map();  // id → depth
  visited.set(nodeId, 0);
  const queue = [{ id: nodeId, depth: 0 }];

  while (queue.length) {
    const { id: cId, depth } = queue.shift();
    for (const l of links) {
      if (!depTypes.has(l.type)) continue;
      const s = linkId(l.source);
      const t = linkId(l.target);
      // Forward: source=current → target is downstream
      if (s === cId && !visited.has(t)) {
        visited.set(t, depth + 1);
        queue.push({ id: t, depth: depth + 1 });
      }
    }
  }

  // Group affected nodes by type
  const affected = [];
  for (const [id, depth] of visited) {
    if (id === nodeId) continue;
    const n = nodeIndex.get(id);
    if (!n) continue;
    affected.push({ id: n.id, title: n.title, type: n.type, depth });
  }
  affected.sort((a, b) => a.depth - b.depth);

  return {
    source: { id: sourceNode.id, title: sourceNode.title },
    affected,
    totalAffected: affected.length
  };
}

/**
 * Learning Path — walk backward from a skill to find all prerequisite knowledge.
 *
 * Follows backward: requires-knowledge, dependency, ai-dependency.
 * Filters out Established nodes and FPs (already learned / axiomatic).
 * Result is ordered deepest-first (learn first → learn last).
 *
 * @param {object} data — { nodes, links }
 * @param {string} skillNodeId
 * @returns {{ target: {id, title}, path: object[], gapCount: number }}
 */
function queryLearningPath(data, skillNodeId) {
  const { nodes, links } = data;
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));
  const startNode = nodeIndex.get(skillNodeId);
  if (!startNode) {
    return { target: { id: skillNodeId, title: '(not found)' }, path: [], gapCount: 0 };
  }

  const depTypes = new Set(['requires-knowledge', 'dependency', 'ai-dependency']);
  const visited = new Map();  // id → depth
  visited.set(skillNodeId, 0);
  const queue = [{ id: skillNodeId, depth: 0 }];

  while (queue.length) {
    const { id: cId, depth } = queue.shift();
    for (const l of links) {
      if (!depTypes.has(l.type)) continue;
      const s = linkId(l.source);
      const t = linkId(l.target);
      // Walk backward: target=current → source is prerequisite
      if (t === cId && !visited.has(s)) {
        visited.set(s, depth + 1);
        queue.push({ id: s, depth: depth + 1 });
      }
    }
  }

  // Filter to nodes that still need learning
  const needToLearn = [];
  for (const [id, depth] of visited) {
    if (id === skillNodeId) continue;
    const n = nodeIndex.get(id);
    if (!n) continue;
    if (n.type === 'fp') continue;          // axiomatic
    if (n.status === 'Established') continue; // already solid
    needToLearn.push({
      id: n.id,
      title: n.title,
      type: n.type,
      status: n.status || 'Unknown',
      depth
    });
  }
  // Deepest first = learn first
  needToLearn.sort((a, b) => b.depth - a.depth);

  return {
    target: { id: startNode.id, title: startNode.title },
    path: needToLearn,
    gapCount: needToLearn.length
  };
}

/**
 * Delegation Readiness — compare HSK knowledge deps vs agent SOP knowledge deps.
 *
 * For each HSK that delegates to an agent, checks what fraction of the
 * HSK's required knowledge is also required by that agent's SOPs.
 * Low coverage = risky delegation.
 *
 * @returns {object[]} Sorted by score ascending (lowest coverage first = riskiest).
 */
function queryDelegationReadiness(data) {
  const { nodes, links } = data;

  const hskNodes = nodes.filter(n =>
    n.type === 'hsk' && n.delegateAgents && n.delegateAgents.length > 0
  );

  const results = [];

  for (const hsk of hskNodes) {
    const hskKnowledge = new Set(hsk.requiresKnowledge || []);
    if (hskKnowledge.size === 0) continue;

    for (const agent of hsk.delegateAgents) {
      // Find agent's SOPs
      const agentSOPs = nodes.filter(n => n.type === 'sop' && n.domain === agent);

      // Collect all knowledge deps of those SOPs
      const agentKnowledge = new Set();
      for (const sop of agentSOPs) {
        for (const dep of (sop.requiresKnowledge || [])) agentKnowledge.add(dep);
        for (const dep of (sop.dependencies || []))       agentKnowledge.add(dep);
      }

      // Calculate overlap
      let overlap = 0;
      const missing = [];
      for (const kId of hskKnowledge) {
        if (agentKnowledge.has(kId)) overlap++;
        else missing.push(kId);
      }

      const score = overlap / hskKnowledge.size;
      results.push({
        hsk: { id: hsk.id, title: hsk.title },
        agent,
        coverage: score,
        totalDeps: hskKnowledge.size,
        coveredDeps: overlap,
        gaps: missing,
        sopCount: agentSOPs.length
      });
    }
  }

  // Low coverage first = most risky
  results.sort((a, b) => a.coverage - b.coverage);
  return results;
}

/**
 * Highest Leverage — rank non-Established knowledge by downstream skill impact.
 *
 * Finds DA and claim nodes that are NOT Established, then counts how many
 * skills depend on them (via requires-knowledge) and how many downstream
 * claims they feed (via dependency).
 *
 * @returns {object[]} Sorted by total impact descending.
 */
function queryHighestLeverage(data) {
  const { nodes, links } = data;
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));

  const weakKnowledge = nodes.filter(n =>
    (n.type === 'da' || n.type === 'claim') &&
    n.status && n.status !== 'Established'
  );

  const results = [];

  for (const kNode of weakKnowledge) {
    const depSkills = [];

    // Count skills depending on this knowledge via requires-knowledge (both directions)
    for (const l of links) {
      if (l.type !== 'requires-knowledge') continue;
      const s = linkId(l.source);
      const t = linkId(l.target);

      if (t === kNode.id) {
        const skillNode = nodeIndex.get(s);
        if (skillNode) depSkills.push({ id: skillNode.id, title: skillNode.title, type: skillNode.type });
      }
      if (s === kNode.id) {
        const skillNode = nodeIndex.get(t);
        if (skillNode) depSkills.push({ id: skillNode.id, title: skillNode.title, type: skillNode.type });
      }
    }

    // Count downstream claims
    let downstreamCount = 0;
    for (const l of links) {
      if (l.type !== 'dependency') continue;
      if (linkId(l.source) === kNode.id) downstreamCount++;
    }

    if (depSkills.length > 0 || downstreamCount > 0) {
      results.push({
        knowledge: { id: kNode.id, title: kNode.title, status: kNode.status },
        dependentSkills: depSkills.length,
        dependentClaims: downstreamCount,
        total: depSkills.length + downstreamCount,
        skills: depSkills
      });
    }
  }

  results.sort((a, b) => b.total - a.total);
  return results;
}

/**
 * Decay Detection — flag HSK nodes past exercise thresholds and stale AI skills.
 *
 * Thresholds (days since lastExercised):
 *   Expert    > 90   → warning / critical
 *   Competent > 60
 *   Learning  > 30
 *   Active AI > 120  (stale AI skill, based on lastUpdated)
 *
 * @param {object} data
 * @param {Date}   [now] — override for testability. Defaults to current date.
 * @returns {object[]} Sorted by daysSince descending (most overdue first).
 */
function queryDecayDetection(data, now) {
  const currentDate = now || new Date();
  const { nodes } = data;
  const results = [];

  // HSK nodes
  const hskNodes = nodes.filter(n => n.type === 'hsk' && n.lastExercised);
  for (const n of hskNodes) {
    const lastDate = new Date(n.lastExercised);
    if (isNaN(lastDate.getTime())) continue;

    const daysSince = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
    let threshold;
    if (n.proficiency === 'Expert')     threshold = 90;
    else if (n.proficiency === 'Competent') threshold = 60;
    else threshold = 30;  // Learning or unspecified

    if (daysSince > threshold) {
      results.push({
        skill: { id: n.id, title: n.title, proficiency: n.proficiency },
        lastExercised: n.lastExercised,
        daysSince,
        threshold,
        status: daysSince > threshold * 2 ? 'critical' : 'warning'
      });
    }
  }

  // AI skills (SOPs / SKLs) that are Active but stale
  const aiSkills = nodes.filter(n =>
    (n.type === 'sop' || n.type === 'skl') && n.status === 'Active'
  );
  for (const n of aiSkills) {
    if (!n.lastUpdated) continue;
    const lastDate = new Date(n.lastUpdated);
    if (isNaN(lastDate.getTime())) continue;

    const daysSince = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
    if (daysSince > 120) {
      results.push({
        skill: { id: n.id, title: n.title, proficiency: n.status },
        lastExercised: n.lastUpdated,
        daysSince,
        threshold: 120,
        status: daysSince > 240 ? 'critical' : 'warning'
      });
    }
  }

  results.sort((a, b) => b.daysSince - a.daysSince);
  return results;
}

/**
 * Scope Guard — BFS all directions (depth 3) from anchor node.
 *
 * Classifies every node in the dataset as:
 *   - In scope  (depth <= 2)
 *   - Adjacent  (depth == 3)
 *   - Out of scope (unreached)
 *
 * @param {object} data
 * @param {string} nodeId — anchor node ID
 * @returns {{ anchor: {id, title}, inScope: object[], adjacent: object[], outOfScope: number }}
 */
function queryScopeGuard(data, nodeId) {
  const { nodes, links } = data;
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));
  const anchor = nodeIndex.get(nodeId);
  if (!anchor) {
    return {
      anchor: { id: nodeId, title: '(not found)' },
      inScope: [], adjacent: [], outOfScope: nodes.length
    };
  }

  const allTypes = new Set([
    'dependency', 'ai-dependency', 'ai-supports', 'requires-knowledge',
    'delegates-to', 'quote-resonance', 'tes-reference', 'ai-interface'
  ]);

  const visited = new Map();  // id → depth
  visited.set(nodeId, 0);
  const queue = [{ id: nodeId, depth: 0 }];

  while (queue.length) {
    const { id: cId, depth } = queue.shift();
    if (depth >= 3) continue;

    for (const l of links) {
      if (!allTypes.has(l.type)) continue;
      const s = linkId(l.source);
      const t = linkId(l.target);

      // Both directions
      if (s === cId && !visited.has(t)) {
        visited.set(t, depth + 1);
        queue.push({ id: t, depth: depth + 1 });
      }
      if (t === cId && !visited.has(s)) {
        visited.set(s, depth + 1);
        queue.push({ id: s, depth: depth + 1 });
      }
    }
  }

  const inScope = [];
  const adjacent = [];
  let outOfScope = 0;

  for (const n of nodes) {
    const depth = visited.get(n.id);
    if (depth !== undefined && depth <= 2) {
      inScope.push({ id: n.id, title: n.title || n.concept || n.id, type: n.type, depth });
    } else if (depth === 3) {
      adjacent.push({ id: n.id, title: n.title || n.concept || n.id, type: n.type });
    } else {
      outOfScope++;
    }
  }

  return {
    anchor: { id: anchor.id, title: anchor.title || anchor.concept || anchor.id },
    inScope,
    adjacent,
    outOfScope
  };
}

// ─── Stats & Overview ────────────────────────────────────────────────────────

/**
 * Return comprehensive KB statistics.
 */
function getKBStats(data) {
  const { nodes, links, stats: rawStats, generated } = data;

  // By type
  const byType = {};
  for (const n of nodes) {
    byType[n.type] = (byType[n.type] || 0) + 1;
  }

  // By layer
  const byLayer = {};
  for (const n of nodes) {
    const layer = n.layer || 'unknown';
    byLayer[layer] = (byLayer[layer] || 0) + 1;
  }

  // By link type
  const byLinkType = {};
  for (const l of links) {
    byLinkType[l.type] = (byLinkType[l.type] || 0) + 1;
  }

  // Claims by status
  const claimsByStatus = {};
  for (const n of nodes) {
    if (n.type === 'claim') {
      const s = n.status || 'Unknown';
      claimsByStatus[s] = (claimsByStatus[s] || 0) + 1;
    }
  }

  // Build FP domain map for domain grouping
  const fpDomainMap = buildFPDomainMap(nodes, links);

  // By radial domain
  const byDomain = {};
  for (const n of nodes) {
    const d = getRadialDomain(n, fpDomainMap);
    byDomain[d] = (byDomain[d] || 0) + 1;
  }

  // By method stage
  const stages = computeMethodStages(nodes);
  const byMethodStage = {};
  for (const [, stageNum] of stages) {
    const label = METHOD_RING_LABELS[stageNum] || `Stage ${stageNum}`;
    byMethodStage[label] = (byMethodStage[label] || 0) + 1;
  }

  return {
    generated,
    totalNodes: nodes.length,
    totalLinks: links.length,
    byType,
    byLayer,
    byLinkType,
    claimsByStatus,
    byDomain,
    byMethodStage,
    // Pass through export-time stats for convenience
    exportStats: rawStats || null
  };
}

/**
 * Group all nodes by their radial domain (using getRadialDomain).
 *
 * @returns {Object<string, {id, title, type}[]>}
 */
function getNodesByDomain(data) {
  const { nodes, links } = data;
  const fpDomainMap = buildFPDomainMap(nodes, links);
  const groups = {};

  for (const n of nodes) {
    const d = getRadialDomain(n, fpDomainMap);
    if (!groups[d]) groups[d] = [];
    groups[d].push({
      id: n.id,
      title: n.title || n.concept || n.id,
      type: n.type
    });
  }

  return groups;
}

/**
 * Group all nodes by method stage.
 *
 * @returns {Object<string, {id, title, type}[]>}
 */
function getNodesByMethodStage(data) {
  const { nodes } = data;
  const stages = computeMethodStages(nodes);
  const groups = {};

  for (const n of nodes) {
    const stageNum = stages.get(n.id);
    const label = METHOD_RING_LABELS[stageNum] || `Stage ${stageNum}`;
    if (!groups[label]) groups[label] = [];
    groups[label].push({
      id: n.id,
      title: n.title || n.concept || n.id,
      type: n.type
    });
  }

  return groups;
}

/**
 * Get a single node with full context.
 *
 * Returns the raw node plus:
 *   - radialDomain, methodStage, tier
 *   - dependsOn: nodes this node depends on (outgoing dependency edges FROM this node's deps)
 *   - dependedOnBy: nodes that depend on this node
 *   - requiresKnowledgeNodes: resolved requires-knowledge link targets
 *
 * @param {object} data
 * @param {string} nodeId
 * @returns {object|null}
 */
function getNode(data, nodeId) {
  const { nodes, links } = data;
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));
  const node = nodeIndex.get(nodeId);
  if (!node) return null;

  // Compute radial domain
  const fpDomainMap = buildFPDomainMap(nodes, links);
  const radialDomain = getRadialDomain(node, fpDomainMap);

  // Compute method stage
  const stages = computeMethodStages(nodes);
  const methodStage = stages.get(nodeId);
  const methodStageLabel = METHOD_RING_LABELS[methodStage] || `Stage ${methodStage}`;

  // Compute tier
  const tiers = computeTiers(nodes, links);
  const tier = tiers.get(nodeId) || 0;

  // Find dependencies: nodes this node depends on (this node is the TARGET)
  const dependsOn = [];
  for (const l of links) {
    const s = linkId(l.source);
    const t = linkId(l.target);
    if (t === nodeId) {
      const srcNode = nodeIndex.get(s);
      if (srcNode) {
        dependsOn.push({
          id: srcNode.id,
          title: srcNode.title || srcNode.concept || srcNode.id,
          type: srcNode.type,
          linkType: l.type
        });
      }
    }
  }

  // Find dependents: nodes that depend on this node (this node is the SOURCE)
  const dependedOnBy = [];
  for (const l of links) {
    const s = linkId(l.source);
    const t = linkId(l.target);
    if (s === nodeId) {
      const tgtNode = nodeIndex.get(t);
      if (tgtNode) {
        dependedOnBy.push({
          id: tgtNode.id,
          title: tgtNode.title || tgtNode.concept || tgtNode.id,
          type: tgtNode.type,
          linkType: l.type
        });
      }
    }
  }

  // Requires-knowledge links specifically (for skills that reference knowledge nodes)
  const requiresKnowledgeNodes = [];
  for (const l of links) {
    if (l.type !== 'requires-knowledge') continue;
    const s = linkId(l.source);
    const t = linkId(l.target);
    if (t === nodeId) {
      const srcNode = nodeIndex.get(s);
      if (srcNode) requiresKnowledgeNodes.push({
        id: srcNode.id,
        title: srcNode.title || srcNode.concept || srcNode.id,
        type: srcNode.type
      });
    }
    if (s === nodeId) {
      const tgtNode = nodeIndex.get(t);
      if (tgtNode) requiresKnowledgeNodes.push({
        id: tgtNode.id,
        title: tgtNode.title || tgtNode.concept || tgtNode.id,
        type: tgtNode.type
      });
    }
  }

  return {
    ...node,
    radialDomain,
    radialDomainName: DOMAIN_NAMES[radialDomain] || radialDomain,
    methodStage,
    methodStageLabel,
    tier,
    color: COLORS[node.domain] || COLORS.unknown,
    dependsOn,
    dependedOnBy,
    requiresKnowledgeNodes
  };
}

/**
 * Search nodes by ID, title, concept, description, or statement.
 *
 * Case-insensitive. Results sorted by relevance:
 *   1. Exact ID match
 *   2. ID starts with query
 *   3. Title starts with query
 *   4. Title contains query
 *   5. Body fields contain query (concept, description, statement)
 *
 * @param {object} data
 * @param {string} query — search string
 * @param {number} [limit=20] — max results to return
 * @returns {object[]}
 */
function searchNodes(data, query, limit) {
  if (limit === undefined || limit === null) limit = 20;
  const { nodes } = data;
  if (!query || !query.trim()) return [];

  const q = query.trim().toLowerCase();

  const scored = [];

  for (const n of nodes) {
    const id    = (n.id || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const concept     = (n.concept || '').toLowerCase();
    const description = (n.description || '').toLowerCase();
    const statement   = (n.statement || '').toLowerCase();
    const text        = (n.text || '').toLowerCase();       // quote text
    const author      = (n.author || '').toLowerCase();     // quote author

    let score = 0;

    // Exact ID match
    if (id === q) score = 100;
    // ID starts with query
    else if (id.startsWith(q)) score = 80;
    // ID contains query
    else if (id.includes(q)) score = 60;
    // Title starts with query
    else if (title.startsWith(q)) score = 50;
    // Title contains query
    else if (title.includes(q)) score = 40;
    // Body fields contain query
    else if (concept.includes(q)) score = 30;
    else if (description.includes(q)) score = 20;
    else if (statement.includes(q)) score = 15;
    else if (text.includes(q)) score = 12;
    else if (author.includes(q)) score = 10;

    if (score > 0) {
      scored.push({
        id: n.id,
        title: n.title || n.concept || n.text || n.id,
        type: n.type,
        domain: n.domain,
        layer: n.layer,
        score
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return scored.slice(0, limit);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Data loading
  loadKBData,

  // Domain mapping
  getRadialDomain,
  buildFPDomainMap,

  // Tier / stage computation
  computeTiers,
  computeMethodStages,

  // Query algorithms
  queryGapAnalysis,
  queryImpactCascade,
  queryLearningPath,
  queryDelegationReadiness,
  queryHighestLeverage,
  queryDecayDetection,
  queryScopeGuard,

  // Stats & overview
  getKBStats,
  getNodesByDomain,
  getNodesByMethodStage,
  getNode,
  searchNodes,

  // Constants
  DOMAIN_ANGLES,
  DOMAIN_NAMES,
  METHOD_RING_LABELS,
  COLORS
};
