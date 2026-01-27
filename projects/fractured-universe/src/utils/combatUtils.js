/**
 * Combat System Utilities
 * Handles damage calculation, combat detection, and unit death
 */

import { getDistance } from './pocUtils.js';

/**
 * Check if two units are in combat range
 */
export const areUnitsInCombat = (unit1, unit2, unit1Data, unit2Data) => {
  if (!unit1 || !unit2 || !unit1Data || !unit2Data) return false;

  const distance = getDistance(unit1.x, unit1.y, unit2.x, unit2.y);
  const combatRange = Math.max(unit1Data.combatRange || 35, unit2Data.combatRange || 35);

  return distance < combatRange;
};

/**
 * Calculate damage from attacker to defender
 * Simple formula: attacker.damage - defender.armor
 * With some randomness (±20%)
 */
export const calculateDamage = (attackerData, defenderData) => {
  if (!attackerData || !defenderData) return 0;

  const baseDamage = attackerData.damage || 15;
  // Simple armor system: reduce damage
  const armor = Math.floor((defenderData.hp || 30) * 0.15); // Armor ~15% of max HP
  let damage = Math.max(1, baseDamage - armor); // At least 1 damage

  // Add randomness (±20%)
  const variance = damage * 0.2;
  damage += (Math.random() - 0.5) * variance * 2;

  return Math.round(Math.max(1, damage));
};

/**
 * Find all enemy units in combat range of a player unit
 */
export const getEnemiesInRange = (playerUnit, playerUnitData, enemyUnits, enemyUnitPositions, unitDataMap) => {
  if (!playerUnit || !playerUnitData || !enemyUnits || !enemyUnitPositions) {
    return [];
  }

  const enemiesInRange = [];

  enemyUnitPositions.forEach((enemyUnit, index) => {
    const enemyData = unitDataMap[`enemy-${index}`] || { combatRange: 35 };

    if (areUnitsInCombat(playerUnit, enemyUnit, playerUnitData, enemyData)) {
      enemiesInRange.push({
        index,
        unit: enemyUnit,
        data: enemyData,
        distance: getDistance(playerUnit.x, playerUnit.y, enemyUnit.x, enemyUnit.y),
      });
    }
  });

  return enemiesInRange;
};

/**
 * Find all player units in combat range of an enemy unit
 */
export const getPlayersInRange = (enemyUnit, enemyUnitData, playerUnitPositions, loadout, unitDataMap) => {
  if (!enemyUnit || !enemyUnitData || !playerUnitPositions || !loadout) {
    return [];
  }

  const playersInRange = [];

  playerUnitPositions.forEach((playerUnit, index) => {
    const playerData = loadout[index];

    if (playerData && areUnitsInCombat(enemyUnit, playerUnit, enemyUnitData, playerData)) {
      playersInRange.push({
        index,
        unit: playerUnit,
        data: playerData,
        distance: getDistance(enemyUnit.x, enemyUnit.y, playerUnit.x, playerUnit.y),
      });
    }
  });

  return playersInRange;
};

/**
 * Resolve combat for one frame
 * Units deal damage to enemies they're in range of
 */
export const resolveCombat = (
  playerUnitPositions,
  playerUnits,
  enemyUnitPositions,
  enemyUnits,
  unitDataMap,
  combatLog,
  addCombatLog
) => {
  let updatedPlayerPositions = [...playerUnitPositions];
  let updatedEnemyPositions = [...enemyUnitPositions];
  let newCombatLog = [...combatLog];

  // Players attack enemies
  updatedPlayerPositions.forEach((playerUnit, playerIndex) => {
    const playerUnitData = playerUnits[playerIndex];
    const enemiesInRange = getEnemiesInRange(playerUnit, playerUnitData, enemyUnits, enemyUnitPositions, unitDataMap);

    enemiesInRange.forEach(({ index: enemyIndex, unit: enemyUnit, data: enemyData }) => {
      const damage = calculateDamage(playerUnitData, enemyData);

      updatedEnemyPositions[enemyIndex] = {
        ...updatedEnemyPositions[enemyIndex],
        hp: Math.max(0, updatedEnemyPositions[enemyIndex].hp - damage),
      };

      // Log major damage events (every 20+ damage)
      if (damage >= 20) {
        newCombatLog = addCombatLog(
          { combatLog: newCombatLog },
          `Player unit dealt ${damage} damage to enemy ${enemyData.icon}`
        ).combatLog;
      }
    });
  });

  // Enemies attack players
  updatedEnemyPositions.forEach((enemyUnit, enemyIndex) => {
    const enemyUnitData = enemyUnits[enemyIndex];
    const playersInRange = getPlayersInRange(enemyUnit, enemyUnitData, playerUnitPositions, playerUnits, unitDataMap);

    playersInRange.forEach(({ index: playerIndex, unit: playerUnit, data: playerData }) => {
      const damage = calculateDamage(enemyUnitData, playerData);

      updatedPlayerPositions[playerIndex] = {
        ...updatedPlayerPositions[playerIndex],
        hp: Math.max(0, updatedPlayerPositions[playerIndex].hp - damage),
      };

      // Log major damage events
      if (damage >= 20) {
        newCombatLog = addCombatLog(
          { combatLog: newCombatLog },
          `Enemy unit dealt ${damage} damage to player ${playerData.icon}`
        ).combatLog;
      }
    });
  });

  return {
    playerUnitPositions: updatedPlayerPositions,
    enemyUnitPositions: updatedEnemyPositions,
    combatLog: newCombatLog,
  };
};

/**
 * Remove dead units from battle
 * Units with hp <= 0 are removed
 */
export const removeDeadUnits = (playerPositions, playerUnits, enemyPositions, enemyUnits, addCombatLog) => {
  const playerDeaths = playerPositions.filter((u) => u.hp <= 0).length;
  const enemyDeaths = enemyPositions.filter((u) => u.hp <= 0).length;

  let updatedPlayerPositions = playerPositions.filter((u) => u.hp > 0);
  let updatedEnemyPositions = enemyPositions.filter((u) => u.hp > 0);
  let updatedPlayerUnits = playerUnits.filter((_, i) => playerPositions[i].hp > 0);
  let updatedEnemyUnits = enemyUnits.filter((_, i) => enemyPositions[i].hp > 0);

  let combatLog = null;
  if (playerDeaths > 0) {
    combatLog = addCombatLog(null, `${playerDeaths} player unit(s) destroyed!`);
  }
  if (enemyDeaths > 0) {
    combatLog = addCombatLog(combatLog, `${enemyDeaths} enemy unit(s) destroyed!`);
  }

  return {
    playerUnitPositions: updatedPlayerPositions,
    playerUnits: updatedPlayerUnits,
    enemyUnitPositions: updatedEnemyPositions,
    enemyUnits: updatedEnemyUnits,
    combatLog,
  };
};

/**
 * Calculate total squad health from unit positions
 */
export const calculateSquadHealth = (unitPositions) => {
  return Math.max(0, unitPositions.reduce((total, unit) => total + Math.max(0, unit.hp), 0));
};

/**
 * Get units in active combat (for visual feedback)
 */
export const getUnitsInActiveCombat = (playerPositions, playerUnits, enemyPositions, enemyUnits, unitDataMap) => {
  const combatUnitIndices = {
    player: new Set(),
    enemy: new Set(),
  };

  // Check which units are actively fighting
  playerPositions.forEach((playerUnit, playerIndex) => {
    const playerData = playerUnits[playerIndex];
    const enemiesInRange = getEnemiesInRange(playerUnit, playerData, enemyUnits, enemyPositions, unitDataMap);

    if (enemiesInRange.length > 0) {
      combatUnitIndices.player.add(playerIndex);
      enemiesInRange.forEach(({ index: enemyIndex }) => {
        combatUnitIndices.enemy.add(enemyIndex);
      });
    }
  });

  return combatUnitIndices;
};
