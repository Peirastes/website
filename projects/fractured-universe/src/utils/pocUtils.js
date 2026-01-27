/**
 * PoC (Point of Contention) Utilities
 * Handles capture mechanics and distance calculations
 */

/**
 * Calculate distance between two points
 */
export const getDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Check if a unit is on a PoC (within capture radius)
 */
export const isUnitOnPoC = (unitPos, pocPos, pocRadius = 50) => {
  const distance = getDistance(unitPos.x, unitPos.y, pocPos.x, pocPos.y);
  return distance < pocRadius;
};

/**
 * Get all player units on a specific PoC
 */
export const getPlayerUnitsOnPoC = (pocPos, playerUnitPositions, pocRadius = 50) => {
  if (!playerUnitPositions) return [];

  return playerUnitPositions
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit }) => isUnitOnPoC(unit, pocPos, pocRadius));
};

/**
 * Get all enemy units on a specific PoC
 */
export const getEnemyUnitsOnPoC = (pocPos, enemyUnitPositions, pocRadius = 50) => {
  if (!enemyUnitPositions) return [];

  return enemyUnitPositions
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit }) => isUnitOnPoC(unit, pocPos, pocRadius));
};

/**
 * Calculate capture progress rate based on unit counts
 * Configuration: 60 seconds with 1 unit (player advantage)
 */
export const calculateCaptureRate = (playerUnits, enemyUnits) => {
  // Scaling formula:
  // 1 unit: 100% / 60s = 1.67% per second
  // 2 units: 100% / 46s = 2.17% per second
  // 3 units: 100% / 40s = 2.5% per second
  // 4+ units: 100% / 30s = 3.33% per second (minimum time)

  const getTotalCaptureTime = (unitCount) => {
    if (unitCount === 0) return Infinity;
    if (unitCount === 1) return 60;
    if (unitCount === 2) return 46;
    if (unitCount === 3) return 40;
    return 30; // 4+ units
  };

  // If no units, no capture
  if (playerUnits === 0 && enemyUnits === 0) {
    return { playerRate: 0, enemyRate: 0, contested: false };
  }

  // If only one side has units, they capture
  if (playerUnits > 0 && enemyUnits === 0) {
    const captureTime = getTotalCaptureTime(playerUnits);
    return {
      playerRate: 100 / captureTime,
      enemyRate: 0,
      contested: false,
    };
  }

  if (enemyUnits > 0 && playerUnits === 0) {
    const captureTime = getTotalCaptureTime(enemyUnits);
    return {
      playerRate: 0,
      enemyRate: 100 / captureTime,
      contested: false,
    };
  }

  // Both sides present = contested (no progress for either)
  return {
    playerRate: 0,
    enemyRate: 0,
    contested: true,
  };
};

/**
 * Determine PoC owner based on current owner and new capture
 */
export const determinePoCOwner = (currentOwner, playerRate, enemyRate) => {
  if (playerRate > enemyRate) return 'player';
  if (enemyRate > playerRate) return 'enemy';
  return currentOwner; // No change if equal or both zero
};

/**
 * Convert list of PoC positions to map by id for quick lookup
 */
export const createPoCPositionMap = (pocs, pocPositions) => {
  const map = {};
  pocs.forEach((poc, index) => {
    if (pocPositions[index]) {
      map[poc.id] = pocPositions[index];
    }
  });
  return map;
};
