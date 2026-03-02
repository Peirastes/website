/**
 * Manages autonomous agent interior modifications.
 * Static utility class (follows EvolutionSystem pattern).
 */
export class InteriorSystem {
  /**
   * Returns valid interior tile positions for a building.
   * Interior cells: columns x+2 to x+w-2, rows y+2 to y+h-2.
   */
  static getInteriorCells(building) {
    const cells = [];
    const minX = building.x + 2;
    const maxX = building.x + building.w - 2;
    const minY = building.y + 2;
    const maxY = building.y + building.h - 2;

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        cells.push({
          rx: tx - building.x,
          ry: ty - building.y,
          tileX: tx,
          tileY: ty
        });
      }
    }
    return cells;
  }

  /**
   * Decision engine: determines if and what an agent should modify.
   * Returns { type, rx, ry, tileX, tileY, newTile, oldTile, flavorText } or null.
   */
  static tryModification(agent, building, palette) {
    // Cooldown: 60-300s, randomized each check
    const now = Date.now();
    const cooldown = 60000 + Math.random() * 240000;
    if (now - (agent.lastInteriorChange || 0) < cooldown) return null;

    // Mood gate: only idle or working agents modify
    if (agent.mood === 'blocked') return null;

    const cells = this.getInteriorCells(building);
    const interior = agent.interior || {};
    const placedCount = Object.keys(interior).length;

    // Categorize cells
    const emptyCells = cells.filter(c => !interior[`${c.rx},${c.ry}`]);
    const occupiedCells = cells.filter(c => interior[`${c.rx},${c.ry}`]);

    // Determine action with fallbacks
    const roll = Math.random();
    let action;
    if (roll < 0.6) action = 'add';
    else if (roll < 0.9) action = 'swap';
    else action = 'remove';

    // Fallback logic
    if (action === 'add' && emptyCells.length === 0) action = 'swap';
    if (action === 'swap' && occupiedCells.length === 0) action = 'add';
    if (action === 'remove' && placedCount <= 2) action = 'swap';
    if (action === 'remove' && occupiedCells.length === 0) return null;
    if (action === 'add' && emptyCells.length === 0) return null;
    if (action === 'swap' && occupiedCells.length === 0) return null;

    // Pick a tile weighted toward preferred
    const pickTile = () => {
      if (Math.random() < 0.7 && palette.preferred.length > 0) {
        return palette.preferred[Math.floor(Math.random() * palette.preferred.length)];
      }
      return palette.allowed[Math.floor(Math.random() * palette.allowed.length)];
    };

    if (action === 'add') {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newTile = pickTile();
      return {
        type: 'add', ...cell, newTile, oldTile: null,
        flavorText: palette.flavorText[newTile] || 'Redecorating...'
      };
    }

    if (action === 'swap') {
      const cell = occupiedCells[Math.floor(Math.random() * occupiedCells.length)];
      const oldTile = interior[`${cell.rx},${cell.ry}`];
      let newTile = pickTile();
      let attempts = 0;
      while (newTile === oldTile && attempts < 5) { newTile = pickTile(); attempts++; }
      return {
        type: 'swap', ...cell, newTile, oldTile,
        flavorText: palette.flavorText[newTile] || 'Rearranging...'
      };
    }

    // action === 'remove'
    const cell = occupiedCells[Math.floor(Math.random() * occupiedCells.length)];
    const oldTile = interior[`${cell.rx},${cell.ry}`];
    return {
      type: 'remove', ...cell, newTile: null, oldTile,
      flavorText: 'Clearing some space...'
    };
  }
}
