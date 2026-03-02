/**
 * Parses DIRECTIVES.md files into structured data.
 * Handles Active Tasks, Backlog, Standing Orders, Completed table.
 */
export class DirectivesParser {
  /**
   * @param {string} markdown - Raw DIRECTIVES.md content
   * @returns {object} Parsed directives structure
   */
  static parse(markdown) {
    if (!markdown) return { activeTasks: [], backlogTasks: [], standingOrders: [], completedTasks: [], lastUpdated: null };

    const result = {
      lastUpdated: this.extractLastUpdated(markdown),
      activeTasks: [],
      backlogTasks: [],
      standingOrders: [],
      completedTasks: []
    };

    // Split into major sections
    const sections = this.splitSections(markdown);

    if (sections.active) {
      result.activeTasks = this.parseTasks(sections.active);
    }
    if (sections.backlog) {
      result.backlogTasks = this.parseTasks(sections.backlog);
    }
    if (sections.standing) {
      result.standingOrders = this.parseStandingOrders(sections.standing);
    }
    if (sections.completed) {
      result.completedTasks = this.parseCompletedTable(sections.completed);
    }

    return result;
  }

  static extractLastUpdated(markdown) {
    const match = markdown.match(/\*\*Last updated:\*\*\s*(.+?)(?:\s+by|$)/m);
    return match ? match[1].trim() : null;
  }

  static splitSections(markdown) {
    const sections = {};
    const sectionPatterns = [
      { key: 'active', pattern: /^## Active Tasks\s*$/m },
      { key: 'backlog', pattern: /^## Backlog\s*$/m },
      { key: 'standing', pattern: /^## Standing Orders\s*$/m },
      { key: 'completed', pattern: /^## Completed\s*$/m }
    ];

    // Find each section's start position
    const positions = sectionPatterns.map(({ key, pattern }) => {
      const match = markdown.match(pattern);
      return { key, index: match ? match.index : -1 };
    }).filter(p => p.index >= 0).sort((a, b) => a.index - b.index);

    // Extract content between sections
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index;
      const end = i + 1 < positions.length ? positions[i + 1].index : markdown.length;
      sections[positions[i].key] = markdown.slice(start, end);
    }

    return sections;
  }

  static parseTasks(sectionText) {
    const tasks = [];
    // Match ### headings that represent tasks
    const taskBlocks = sectionText.split(/(?=^### )/m).filter(b => b.startsWith('### '));

    for (const block of taskBlocks) {
      const task = this.parseTaskBlock(block);
      if (task) tasks.push(task);
    }

    return tasks;
  }

  static parseTaskBlock(block) {
    // Extract priority and title from ### heading
    // Handles: ### P1: Title, ### ~~P3: Title~~ (strikethrough = completed)
    const headingMatch = block.match(/^### (?:~~)?(P\d):\s*(.+?)(?:~~)?\s*$/m);
    if (!headingMatch) return null;

    const priority = headingMatch[1];
    const title = headingMatch[2].trim();
    const isStrikethrough = block.match(/^### ~~/m) !== null;

    // Extract status
    const statusMatch = block.match(/\*\*Status:\*\*\s*(.+?)$/m);
    let status = statusMatch ? statusMatch[1].trim() : 'Unknown';

    // If strikethrough, override to Complete
    if (isStrikethrough) status = 'Complete';

    // Extract target date
    const targetMatch = block.match(/\*\*Target:\*\*\s*(.+?)$/m);
    const target = targetMatch ? targetMatch[1].trim() : null;

    // Extract context
    const contextMatch = block.match(/\*\*Context:\*\*\s*(.+?)$/m);
    const context = contextMatch ? contextMatch[1].trim() : null;

    // Detect blocked status
    const isBlocked = /blocked/i.test(status);

    // Extract project from title (text after em-dash or from context)
    const projectMatch = title.match(/[—–]\s*(.+)$/);
    const project = projectMatch ? projectMatch[1].trim() : null;
    const shortTitle = projectMatch ? title.replace(/\s*[—–]\s*.+$/, '') : title;

    // Extract Prompt block (blockquoted text after **Prompt:**)
    let prompt = null;
    const promptMatch = block.match(/\*\*Prompt:\*\*\s*\n([\s\S]*?)(?:\n---|\n###|$)/);
    if (promptMatch) {
      prompt = promptMatch[1].trim()
        .split('\n').map(l => l.replace(/^>\s?/, '')).join('\n').trim();
    }

    return {
      priority,
      title: shortTitle,
      fullTitle: title,
      status,
      target,
      context,
      project,
      prompt,
      isBlocked,
      isComplete: status.toLowerCase().includes('complete') || isStrikethrough
    };
  }

  static parseStandingOrders(sectionText) {
    const orders = [];
    const lines = sectionText.split('\n');

    for (const line of lines) {
      const match = line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)$/);
      if (match) {
        orders.push({ title: match[1], description: match[2] });
      }
    }

    return orders;
  }

  static parseCompletedTable(sectionText) {
    const tasks = [];
    const lines = sectionText.split('\n');

    // Skip header rows (first two lines after ## Completed)
    let inTable = false;
    for (const line of lines) {
      if (line.startsWith('|') && !line.includes('---')) {
        if (!inTable) {
          // This is the header row
          inTable = true;
          continue;
        }
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 3) {
          tasks.push({
            task: cells[0],
            project: cells[1],
            completed: cells[2],
            notes: cells[3] || ''
          });
        }
      }
    }

    return tasks;
  }
}
