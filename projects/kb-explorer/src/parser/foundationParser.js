/**
 * Parse FOUNDATION.md into FP and DA nodes
 */
export function parseFoundation(markdown) {
  const nodes = [];
  if (!markdown) return nodes;

  // Parse FP entries: ### FP-NNN: Title
  const fpRegex = /### (FP-\d+): (.+)\n([\s\S]*?)(?=\n### |\n---|\n## |$)/g;
  let match;
  while ((match = fpRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const statement = extractField(body, 'Statement');
    const source = extractField(body, 'Source');
    nodes.push({
      id,
      type: 'fp',
      title: title.trim(),
      statement: statement || '',
      source: source || '',
      domain: 'foundation'
    });
  }

  // Parse DA entries: #### DA-DOMAIN-NNN: Title
  const daRegex = /#### (DA-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n#### |\n### |\n---|\n\*|$)/g;
  while ((match = daRegex.exec(markdown)) !== null) {
    const [, id, title, body] = match;
    const status = extractField(body, 'Status') || 'Draft';
    const statement = extractField(body, 'Statement');
    // Extract domain from DA ID: DA-ECDO-001 -> ECDO
    const domainMatch = id.match(/DA-([A-Z]+)-/);
    const domain = domainMatch ? mapDomainCode(domainMatch[1]) : 'foundation';
    nodes.push({
      id,
      type: 'da',
      title: title.trim(),
      status: status.trim(),
      statement: statement || '',
      domain
    });
  }

  return nodes;
}

function extractField(body, fieldName) {
  const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n\\*\\*|$)`, 's');
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

function mapDomainCode(code) {
  const map = { ECDO: 'ECDO', TF: 'TF', DSL: 'DSL', PED: 'PED', EPI: 'EPI' };
  return map[code] || 'foundation';
}
