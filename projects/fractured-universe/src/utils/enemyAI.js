/**
 * Enemy AI System
 * Handles autonomous movement and tactical decisions for enemy units
 */

import { getDistance } from './pocUtils.js';

/**
 * Calculate priority score for attacking a PoC
 * Higher score = higher priority
 */
export const calculatePoCAttackPriority = (poc, pocPos, playerUnitsOnPoC, enemyUnitsOnPoC, battleState) => {
  let priority = 0;

  // Neutral PoCs are highest priority (easy capture)
  if (poc.owner === 'neutral') {
    priority += 100;
  }
  // Player-owned PoCs are medium priority (take from player)
  else if (poc.owner === 'player') {
    priority += 80;
  }
  // Enemy-owned PoCs are lowest priority (but defend if needed)
  else if (poc.owner === 'enemy') {
    priority += 20;
  }

  // Nearby PoCs are slightly higher priority (closer = easier)
  // This encourages natural clustering
  priority -= Math.min(pocPos.x - 960, pocPos.y - 540) * 0.01;

  // If being captured by player, defend
  if (poc.owner === 'enemy' && poc.progress < 100) {
    priority += 150 - poc.progress; // Defend urgency based on progress
  }

  // If capturing, continue (momentum)
  if (poc.owner === 'neutral' && poc.progress > 0) {
    priority += 50;
  }

  return priority;
};

/**
 * Select target PoC for a unit or group
 * Returns the best PoC to attack based on priority
 */
export const selectPoCTarget = (enemyUnit, pocs, pocPositions, playerUnitPositions, enemyUnitPositions, battleState) => {
  if (!pocs || !pocPositions || pocs.length === 0) {
    return null;
  }

  let bestTarget = null;
  let bestPriority = -Infinity;

  pocs.forEach((poc, index) => {
    if (!pocPositions[index]) return;

    const pocPos = pocPositions[index];

    // Count units on this PoC
    const playerOnPoC = playerUnitPositions.filter((unit) => getDistance(unit.x, unit.y, pocPos.x, pocPos.y) < 50).length;
    const enemyOnPoC = enemyUnitPositions.filter((unit) => getDistance(unit.x, unit.y, pocPos.x, pocPos.y) < 50).length;

    const priority = calculatePoCAttackPriority(poc, pocPos, playerOnPoC, enemyOnPoC, battleState);

    if (priority > bestPriority) {
      bestPriority = priority;
      bestTarget = { pocIndex: index, pocPos, priority, pocData: poc };
    }
  });

  return bestTarget;
};

/**
 * Calculate spreading offset to avoid unit clumping
 * Adds a small random or formation-based offset to unit position
 */
export const calculateSpreadingOffset = (unitIndex, totalUnits, baseX, baseY, spreadRadius = 80) => {
  // Simple circular spreading pattern
  const angle = (unitIndex / Math.max(totalUnits, 1)) * Math.PI * 2;
  const radius = Math.min(spreadRadius, 20 + unitIndex * 10);

  return {
    x: baseX + Math.cos(angle) * radius,
    y: baseY + Math.sin(angle) * radius,
  };
};

/**
 * Get defensive action for enemy unit
 * If own PoC is being captured, defend it
 */
export const getDefensiveAction = (enemyUnit, pocs, pocPositions, playerUnitPositions, enemyUnitPositions) => {
  // Find enemy-owned PoCs that are being captured
  const threatenedPoCs = pocs
    .map((poc, index) => {
      if (poc.owner !== 'enemy' || poc.progress >= 100) return null;

      const pocPos = pocPositions[index];
      const playerOnPoC = playerUnitPositions.filter((unit) => getDistance(unit.x, unit.y, pocPos.x, pocPos.y) < 50).length;

      if (playerOnPoC > 0) {
        return {
          pocIndex: index,
          pocPos,
          pocData: poc,
          threat: playerOnPoC,
          distance: getDistance(enemyUnit.x, enemyUnit.y, pocPos.x, pocPos.y),
        };
      }

      return null;
    })
    .filter((p) => p !== null)
    .sort((a, b) => b.threat - a.threat || a.distance - b.distance); // Biggest threat first

  if (threatenedPoCs.length > 0) {
    return {
      action: 'defend',
      target: threatenedPoCs[0],
    };
  }

  return null;
};

/**
 * Update enemy unit targets and movement
 * Called each frame for enemy AI decisions
 */
export const updateEnemyAITargets = (enemyUnitPositions, enemyUnits, pocs, pocPositions, playerUnitPositions, battleState) => {
  if (!enemyUnitPositions || enemyUnitPositions.length === 0) {
    return enemyUnitPositions;
  }

  // Group enemy units by current target to create squad-like behavior
  const updatedPositions = enemyUnitPositions.map((unit, index) => {
    // Check if should defend
    const defensive = getDefensiveAction(unit, pocs, pocPositions, playerUnitPositions, enemyUnitPositions);

    let target;
    if (defensive && defensive.target) {
      // Defend threatened PoC
      target = defensive.target;
    } else {
      // Select attack target
      target = selectPoCTarget(unit, pocs, pocPositions, playerUnitPositions, enemyUnitPositions, battleState);
    }

    if (!target || !target.pocPos) {
      // No valid target, stay in place
      return unit;
    }

    // Add spreading offset based on unit index to avoid clumping
    const spreadOffset = calculateSpreadingOffset(index, enemyUnitPositions.length, target.pocPos.x, target.pocPos.y, 60);

    return {
      ...unit,
      targetX: spreadOffset.x,
      targetY: spreadOffset.y,
      currentTarget: target.pocIndex,
    };
  });

  return updatedPositions;
};

/**
 * Retreat decision: if outnumbered 3:1 at a PoC, consider retreating
 * Simple heuristic for now
 */
export const shouldRetreat = (enemyUnits, playerUnits, pocPositions, pocIndex) => {
  if (!pocPositions[pocIndex]) return false;

  const pocPos = pocPositions[pocIndex];
  const enemyOnPoC = enemyUnits.filter((unit) => getDistance(unit.x, unit.y, pocPos.x, pocPos.y) < 50).length;
  const playerOnPoC = playerUnits.filter((unit) => getDistance(unit.x, unit.y, pocPos.x, pocPos.y) < 50).length;

  // If heavily outnumbered, retreat
  return playerOnPoC > 0 && enemyOnPoC > 0 && playerOnPoC / enemyOnPoC > 2;
};

/**
 * Get safe retreat position (away from player units)
 */
export const getRetreatPosition = (unit, playerUnitPositions) => {
  if (playerUnitPositions.length === 0) {
    return { x: unit.x, y: unit.y }; // Nowhere to retreat
  }

  // Calculate average player position
  const avgPlayerPos = {
    x: playerUnitPositions.reduce((sum, u) => sum + u.x, 0) / playerUnitPositions.length,
    y: playerUnitPositions.reduce((sum, u) => sum + u.y, 0) / playerUnitPositions.length,
  };

  // Move away from players (back toward spawn area)
  const dirX = unit.x - avgPlayerPos.x;
  const dirY = unit.y - avgPlayerPos.y;
  const distance = Math.sqrt(dirX * dirX + dirY * dirY);

  if (distance === 0) {
    // On top of players, move to right side of map
    return { x: 1700, y: 540 };
  }

  const retreatDist = 300;
  return {
    x: unit.x + (dirX / distance) * retreatDist,
    y: unit.y + (dirY / distance) * retreatDist,
  };
};

/**
 * Simple aggressive push: if player is weak, push toward their spawn
 * Encourages aggressive play
 */
export const getAggressiveTarget = () => {
  // Player spawn area is left side of map
  return { x: 200, y: 540 };
};

/**
 * Overall enemy AI decision maker
 * Returns updated enemy unit positions based on AI logic
 */
export const makeEnemyAIDecisions = (enemyUnitPositions, enemyUnits, pocs, pocPositions, playerUnitPositions, playerSquadHP, maxSquadHP) => {
  if (!enemyUnitPositions || enemyUnitPositions.length === 0) {
    return enemyUnitPositions;
  }

  const battleState = {
    playerSquadHP,
    maxSquadHP,
    playerHealthPercent: playerSquadHP / maxSquadHP,
  };

  // Let AI select targets
  return updateEnemyAITargets(enemyUnitPositions, enemyUnits, pocs, pocPositions, playerUnitPositions, battleState);
};
