/**
 * Parse a domain file into claim nodes with full metadata
 */
export function parseDomainFile(markdown, domainKey) {
  const claims = [];
  if (!markdown) return claims;

  // Split on claim headers: ### DOMAIN-NNN: Title
  const claimRegex = /### ([A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### [A-Z]+-\d+:|\n\*Last updated|$)/g;
  let match;
  while ((match = claimRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const claim = {
      id,
      type: 'claim',
      title: title.trim(),
      domain: domainFromId(id),
      status: extractField(body, 'Status') || 'Unknown',
      confidence: extractField(body, 'Confidence') || 'Low',
      inferenceMode: extractField(body, 'Inference Mode') || '',
      pscprStage: extractField(body, 'PSCPR Stage') || '',
      sourceType: extractField(body, 'Source Type') || '',
      firstAsserted: extractField(body, 'First Asserted') || '',
      lastReviewed: extractField(body, 'Last Reviewed') || '',
      dependencies: extractDependencies(body),
      statement: extractBlock(body, 'Statement'),
      evidence: extractBlock(body, 'Evidence'),
      counterEvidence: extractBlock(body, 'Counter-evidence / Tensions'),
      tesFilter: extractField(body, 'TES Filter') || '',
      notes: extractBlock(body, 'Notes'),
      tesRefs: extractTesRefs(body)
    };
    claims.push(claim);
  }

  return claims;
}

function extractField(body, fieldName) {
  // Match **Field:** value on a single line
  const regex = new RegExp(`\\*\\*${fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\*\\*\\s*(.+)`);
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

function extractBlock(body, fieldName) {
  // Match **Field:** followed by text/bullets until the next **Field:** or end
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`);
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function extractDependencies(body) {
  const depsLine = extractField(body, 'Dependencies');
  if (!depsLine) return [];
  // Match all ID patterns: FP-001, DA-ECDO-001, ECDO-004, TF-004, etc.
  const ids = depsLine.match(/(FP-\d+|DA-[A-Z]+-\d+|[A-Z]+-\d+)/g);
  return ids || [];
}

function extractTesRefs(body) {
  // Find all TES-XXX-NN references anywhere in the body
  const refs = body.match(/TES-[A-Z]+-\d+/g);
  return refs ? [...new Set(refs)] : [];
}

function domainFromId(id) {
  const prefix = id.match(/^([A-Z]+)-/);
  if (!prefix) return 'unknown';
  const map = {
    EPI: 'EPI', ECDO: 'ECDO', TF: 'TF', DSL: 'DSL', PED: 'PED', ARCH: 'ARCH', PHYS: 'PHYS'
  };
  return map[prefix[1]] || 'unknown';
}
