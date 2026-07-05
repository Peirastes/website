/**
 * Parse TES_INDEX.md to extract concept IDs and names
 */
export function parseTesIndex(markdown) {
  const concepts = new Map();
  if (!markdown) return concepts;

  // Match table rows: | TES-XXX-NN | Concept Name | Operational Use |
  const rowRegex = /\|\s*(TES-[A-Z]+-\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
  let match;
  while ((match = rowRegex.exec(markdown)) !== null) {
    const [, id, concept, use] = match;
    // Skip header rows
    if (concept === 'Concept' || concept.startsWith('---')) continue;
    concepts.set(id, {
      id,
      type: 'tes',
      concept: concept.trim(),
      use: use.trim(),
      domain: 'tes'
    });
  }

  return concepts;
}
