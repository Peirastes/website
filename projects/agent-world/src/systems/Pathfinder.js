// Grid-based A* pathfinder operating on the walls tilemap layer.
// 4-directional (no diagonals) — matches the tile grid aesthetic.

const DOOR_INDEX = 16;

export class Pathfinder {
  constructor(wallsLayer, mapW, mapH) {
    this.walls = wallsLayer;
    this.mapW = mapW;
    this.mapH = mapH;
    this.tileSize = 32;
  }

  /** Returns true if the tile at (tx, ty) can be walked on. */
  isWalkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.mapW || ty >= this.mapH) return false;
    const tile = this.walls.getTileAt(tx, ty);
    if (!tile) return true;            // no wall tile → walkable
    if (tile.index === DOOR_INDEX) return true;  // doors are passable
    return false;
  }

  /**
   * Find a path from (sx,sy) to (ex,ey) in tile coordinates.
   * Returns array of {x, y} world-pixel positions (tile centers), or null.
   */
  findPath(sx, sy, ex, ey) {
    // Clamp to map bounds
    sx = Math.max(0, Math.min(this.mapW - 1, sx));
    sy = Math.max(0, Math.min(this.mapH - 1, sy));
    ex = Math.max(0, Math.min(this.mapW - 1, ex));
    ey = Math.max(0, Math.min(this.mapH - 1, ey));

    // If destination is unwalkable, find nearest walkable neighbor
    if (!this.isWalkable(ex, ey)) {
      const alt = this.nearestWalkable(ex, ey);
      if (!alt) return null;
      ex = alt.x;
      ey = alt.y;
    }

    if (!this.isWalkable(sx, sy)) return null;
    if (sx === ex && sy === ey) return [];

    // A* with Manhattan heuristic
    const key = (x, y) => y * this.mapW + x;
    const heuristic = (x, y) => Math.abs(x - ex) + Math.abs(y - ey);

    const open = [{ x: sx, y: sy, g: 0, f: heuristic(sx, sy) }];
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(key(sx, sy), 0);

    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    while (open.length > 0) {
      // Pop node with lowest f
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[bestIdx].f) bestIdx = i;
      }
      const cur = open[bestIdx];
      open.splice(bestIdx, 1);

      if (cur.x === ex && cur.y === ey) {
        return this.reconstructPath(cameFrom, cur);
      }

      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!this.isWalkable(nx, ny)) continue;

        const ng = cur.g + 1;
        const k = key(nx, ny);
        if (gScore.has(k) && ng >= gScore.get(k)) continue;

        gScore.set(k, ng);
        cameFrom.set(k, { x: cur.x, y: cur.y });
        open.push({ x: nx, y: ny, g: ng, f: ng + heuristic(nx, ny) });
      }
    }

    return null; // no path found
  }

  /** Reconstruct path and convert to world-pixel centers. */
  reconstructPath(cameFrom, end) {
    const tiles = [];
    let cur = { x: end.x, y: end.y };
    const key = (x, y) => y * this.mapW + x;

    while (cameFrom.has(key(cur.x, cur.y))) {
      tiles.push(cur);
      cur = cameFrom.get(key(cur.x, cur.y));
    }
    // Don't include start tile
    tiles.reverse();

    const half = this.tileSize / 2;
    return tiles.map(t => ({
      x: t.x * this.tileSize + half,
      y: t.y * this.tileSize + half
    }));
  }

  /** Spiral outward from (tx, ty) to find the nearest walkable tile. */
  nearestWalkable(tx, ty) {
    for (let r = 1; r <= 5; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // only ring
          if (this.isWalkable(tx + dx, ty + dy)) {
            return { x: tx + dx, y: ty + dy };
          }
        }
      }
    }
    return null;
  }
}
