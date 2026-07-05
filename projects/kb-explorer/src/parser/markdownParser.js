/**
 * Orchestrator: parse all KB markdown into a unified graph data structure
 * Supports two layers: Human KB (FP, DA, Claims, TES, HSK) and AI KB (SOP, SKL, TOOL, IFC)
 */
import { parseFoundation } from './foundationParser.js';
import { parseDomainFile } from './claimParser.js';
import { parseTesIndex } from './tesParser.js';
import { parseAgentFile, parseTools, parseInterfaces, parseHumanSkills, buildAILinks } from './aiParser.js';

export async function parseKnowledgeBase() {
  // ─── Human Layer ───────────────────────────────────────────────────────────
  const raw = await window.kbApi.readAll();

  const foundationNodes = parseFoundation(raw.foundation);

  const claimNodes = [];
  for (const [key, markdown] of Object.entries(raw.domains)) {
    claimNodes.push(...parseDomainFile(markdown, key));
  }

  const tesMap = parseTesIndex(raw.tesIndex);

  const referencedTesIds = new Set();
  for (const claim of claimNodes) {
    for (const ref of claim.tesRefs) {
      referencedTesIds.add(ref);
    }
  }

  const tesNodes = [];
  for (const id of referencedTesIds) {
    const info = tesMap.get(id);
    tesNodes.push({
      id,
      type: 'tes',
      concept: info ? info.concept : id,
      use: info ? info.use : '',
      domain: 'tes',
      layer: 'human'
    });
  }

  // Tag human nodes with layer
  for (const n of foundationNodes) n.layer = 'shared';
  for (const n of claimNodes) n.layer = 'human';

  // ─── AI Layer ──────────────────────────────────────────────────────────────
  const aiRaw = await window.kbApi.readAllAI();

  const agentNodes = [];
  for (const [key, markdown] of Object.entries(aiRaw.agents)) {
    agentNodes.push(...parseAgentFile(markdown, key));
  }
  const toolNodes = parseTools(aiRaw.tools);
  const ifcNodes = parseInterfaces(aiRaw.interfaces);

  // ─── Human Skills ─────────────────────────────────────────────────────────
  const hskNodes = parseHumanSkills(aiRaw.humanSkills);

  const allAINodes = [...agentNodes, ...toolNodes, ...ifcNodes];

  // ─── Combine ───────────────────────────────────────────────────────────────
  const humanNodes = [...foundationNodes, ...claimNodes, ...tesNodes, ...hskNodes];
  const nodes = [...humanNodes, ...allAINodes];
  const nodeIndex = new Map(nodes.map(n => [n.id, n]));

  // Human links
  const links = [];
  for (const claim of claimNodes) {
    for (const depId of claim.dependencies) {
      if (nodeIndex.has(depId)) {
        links.push({ source: depId, target: claim.id, type: 'dependency' });
      }
    }
    for (const tesId of claim.tesRefs) {
      if (nodeIndex.has(tesId)) {
        links.push({ source: tesId, target: claim.id, type: 'tes-reference' });
      }
    }
  }

  // AI links
  const aiLinks = buildAILinks(allAINodes);
  links.push(...aiLinks);

  // Requires-knowledge links (from SOPs and HSKs to FP/DA/claim nodes)
  for (const node of nodes) {
    if (node.requiresKnowledge) {
      for (const knId of node.requiresKnowledge) {
        if (nodeIndex.has(knId)) {
          links.push({ source: knId, target: node.id, type: 'requires-knowledge' });
        }
      }
    }
  }

  // Delegates-to links (from HSK nodes to agent SOPs)
  for (const node of hskNodes) {
    if (node.delegateAgents) {
      for (const sopId of node.delegateAgents) {
        if (nodeIndex.has(sopId)) {
          links.push({ source: node.id, target: sopId, type: 'delegates-to' });
        }
      }
    }
  }

  // Compute fan-out
  const fanOut = new Map();
  for (const link of links) {
    const srcId = typeof link.source === 'string' ? link.source : link.source.id;
    fanOut.set(srcId, (fanOut.get(srcId) || 0) + 1);
  }
  for (const node of nodes) {
    node.fanOut = fanOut.get(node.id) || 0;
  }

  return { nodes, links };
}
