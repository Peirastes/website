import { useState, useCallback, useEffect } from 'react';
import {
  getPlayerUnitsOnPoC,
  getEnemyUnitsOnPoC,
  calculateCaptureRate,
  determinePoCOwner,
} from '../utils/pocUtils.js';
import { makeEnemyAIDecisions } from '../utils/enemyAI.js';
import {
  resolveCombat,
  removeDeadUnits,
  calculateSquadHealth,
  getUnitsInActiveCombat,
} from '../utils/combatUtils.js';
import { FACTIONS } from '../data/gameData.js';

const useBattle = () => {
  const [battle, setBattle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pocNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Foxtrot'];

  // Helper: Convert seconds to MM:SS format
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Helper: Get PoC letter acronym
  const getPoCAcronym = useCallback((index) => {
    return pocNames[index] || 'Unknown';
  }, []);

  // Helper: Add timestamped combat log entry
  const addCombatLog = useCallback((battle, message) => {
    if (!battle) return battle;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `[${hours}:${minutes}]`;

    return {
      ...battle,
      combatLog: [...battle.combatLog, `${timestamp} ${message}`],
    };
  }, []);

  // Initialize battle with sector and loadout
  const initializeBattle = useCallback((sector, loadout) => {
    setIsLoading(true);

    // Generate PoCs based on sector.pocCount
    const pocCount = Math.min(
      Math.max(sector.pocCount, 3),
      6
    ); // Clamp between 3-6

    const pocs = Array.from({ length: pocCount }, (_, index) => ({
      id: index + 1,
      name: pocNames[index],
      owner: 'neutral',
      progress: 0,
    }));

    // Calculate total squad HP from loadout
    const maxSquadHP = loadout.reduce((total, unit) => total + unit.hp, 0);

    // Generate enemy units (mirror of player units for now)
    const enemyUnits = loadout.map((unit, index) => ({
      ...unit,
      id: `enemy-${index}`,
      name: `Enemy ${unit.name}`,
    }));

    // Initialize unit positions on battlefield (1920x1080)
    // Player units spawn on left side, enemy on right side
    const playerUnitPositions = loadout.map((unit, index) => ({
      id: index,
      x: 200 + (index % 3) * 100,
      y: 150 + Math.floor(index / 3) * 100,
      targetX: 200 + (index % 3) * 100,
      targetY: 150 + Math.floor(index / 3) * 100,
      hp: unit.hp,
    }));

    const enemyUnitPositions = enemyUnits.map((unit, index) => ({
      id: index,
      x: 1720 - (index % 3) * 100,
      y: 150 + Math.floor(index / 3) * 100,
      targetX: 1720 - (index % 3) * 100,
      targetY: 150 + Math.floor(index / 3) * 100,
      hp: unit.hp,
    }));

    // Determine enemy faction from sector
    const enemyFactionId = sector.controlledBy;
    const enemyFaction = Object.values(FACTIONS).find((f) => f.id === enemyFactionId) || Object.values(FACTIONS)[0];

    const newBattle = {
      sector,
      loadout,
      enemyUnits,
      enemyFaction,
      status: 'deploying',
      timer: 900, // 15 minutes in seconds
      pocs,
      score: { player: 0, enemy: 0 },
      combatLog: [],
      playerSquadHP: maxSquadHP,
      maxSquadHP,
      startTime: null,
      playerUnitPositions,
      enemyUnitPositions,
      camera: { x: 960, y: 540, zoom: 1.0 }, // Center of 1920x1080
    };

    setBattle(newBattle);
    setIsLoading(false);

    return newBattle;
  }, []);

  // Start battle - change status from deploying to active
  const startBattle = useCallback(() => {
    setBattle((prevBattle) => {
      if (!prevBattle || prevBattle.status !== 'deploying') {
        return prevBattle;
      }

      return {
        ...prevBattle,
        status: 'active',
        startTime: Date.now(),
      };
    });
  }, []);

  // Assault a PoC - increase progress
  const assaultPoC = useCallback((pocId) => {
    setBattle((prevBattle) => {
      if (!prevBattle) return prevBattle;

      let updatedBattle = { ...prevBattle };
      const pocIndex = updatedBattle.pocs.findIndex((p) => p.id === pocId);

      if (pocIndex === -1) return updatedBattle;

      // Update the PoC with new progress
      const pocToUpdate = updatedBattle.pocs[pocIndex];
      const newProgress = Math.min(pocToUpdate.progress + 25, 100);

      updatedBattle.pocs = [
        ...updatedBattle.pocs.slice(0, pocIndex),
        { ...pocToUpdate, progress: newProgress },
        ...updatedBattle.pocs.slice(pocIndex + 1),
      ];

      // Check if PoC was captured
      if (newProgress === 100 && pocToUpdate.owner !== 'player') {
        updatedBattle.pocs[pocIndex].owner = 'player';
        updatedBattle.score = {
          ...updatedBattle.score,
          player: updatedBattle.score.player + 1,
        };
        updatedBattle = addCombatLog(
          updatedBattle,
          `PoC-${pocToUpdate.name} captured by player`
        );
      }

      // Simulate enemy capture
      if (Math.random() > 0.7) {
        // Find a random neutral or enemy PoC
        const enemyTargets = updatedBattle.pocs.filter(
          (p) => p.owner !== 'player'
        );

        if (enemyTargets.length > 0) {
          const targetPoC =
            enemyTargets[Math.floor(Math.random() * enemyTargets.length)];
          const targetIndex = updatedBattle.pocs.findIndex(
            (p) => p.id === targetPoC.id
          );

          if (targetIndex !== -1) {
            const newEnemyProgress = Math.min(targetPoC.progress + 25, 100);
            updatedBattle.pocs = [
              ...updatedBattle.pocs.slice(0, targetIndex),
              { ...targetPoC, progress: newEnemyProgress },
              ...updatedBattle.pocs.slice(targetIndex + 1),
            ];

            // Check if enemy captured this PoC
            if (newEnemyProgress === 100 && targetPoC.owner !== 'enemy') {
              updatedBattle.pocs[targetIndex].owner = 'enemy';
              updatedBattle.score = {
                ...updatedBattle.score,
                enemy: updatedBattle.score.enemy + 1,
              };
              updatedBattle = addCombatLog(
                updatedBattle,
                `PoC-${targetPoC.name} captured by enemy`
              );
            }
          }
        }
      }

      return updatedBattle;
    });
  }, [addCombatLog]);

  // Take damage to squad
  const takeDamage = useCallback(
    (damage) => {
      setBattle((prevBattle) => {
        if (!prevBattle) return prevBattle;

        let updatedBattle = {
          ...prevBattle,
          playerSquadHP: Math.max(prevBattle.playerSquadHP - damage, 0),
        };

        if (updatedBattle.playerSquadHP <= 0) {
          updatedBattle.status = 'defeat';
          updatedBattle = addCombatLog(
            updatedBattle,
            'Squad eliminated - Battle lost'
          );
        } else {
          updatedBattle = addCombatLog(
            updatedBattle,
            `Squad took ${damage} damage`
          );
        }

        return updatedBattle;
      });
    },
    [addCombatLog]
  );

  // Retreat from battle
  const retreat = useCallback(() => {
    setBattle((prevBattle) => {
      if (!prevBattle) return prevBattle;

      let updatedBattle = {
        ...prevBattle,
        status: 'defeat',
      };

      updatedBattle = addCombatLog(updatedBattle, 'Retreat ordered - Battle abandoned');

      return updatedBattle;
    });

    return true;
  }, [addCombatLog]);

  // Check victory condition
  const checkVictory = useCallback(() => {
    setBattle((prevBattle) => {
      if (!prevBattle) return prevBattle;

      const playerPoCs = prevBattle.pocs.filter((p) => p.owner === 'player').length;
      const majorityNeeded = prevBattle.pocs.length / 2;

      if (playerPoCs > majorityNeeded && prevBattle.status === 'active') {
        return {
          ...prevBattle,
          status: 'victory',
        };
      }

      return prevBattle;
    });

    return battle?.status === 'victory';
  }, [battle?.status]);

  // Update timer (countdown)
  const updateTimer = useCallback(() => {
    setBattle((prevBattle) => {
      if (!prevBattle) return prevBattle;

      let updatedBattle = {
        ...prevBattle,
        timer: Math.max(prevBattle.timer - 1, 0),
      };

      // When timer reaches 0
      if (updatedBattle.timer === 0) {
        // Check victory first
        const playerPoCs = updatedBattle.pocs.filter(
          (p) => p.owner === 'player'
        ).length;
        const majorityNeeded = updatedBattle.pocs.length / 2;

        if (playerPoCs > majorityNeeded) {
          updatedBattle.status = 'victory';
        } else if (updatedBattle.status === 'active') {
          updatedBattle.status = 'defeat';
          updatedBattle = addCombatLog(updatedBattle, 'Time expired - Battle lost');
        }
      }

      return updatedBattle;
    });
  }, [addCombatLog]);

  // Timer effect - runs interval when battle is active
  useEffect(() => {
    if (!battle || battle.status !== 'active') {
      return;
    }

    const interval = setInterval(() => {
      updateTimer();
    }, 1000); // Run every 1 second

    return () => clearInterval(interval);
  }, [battle, updateTimer]);

  // Calculate rewards based on battle outcome
  const calculateRewards = useCallback((sector, battleState) => {
    if (!sector || !battleState) {
      return { xp: 0, credits: 0 };
    }

    if (battleState.status === 'victory') {
      return {
        xp: 500 + Math.floor(sector.resources / 10),
        credits: sector.resources,
      };
    }

    return {
      xp: 100,
      credits: 0,
    };
  }, []);

  // Update player unit position (for 2D battle viewport)
  const updateUnitPosition = useCallback((unitId, x, y) => {
    setBattle((prevBattle) => {
      if (!prevBattle || !prevBattle.playerUnitPositions) return prevBattle;

      const updatedPositions = prevBattle.playerUnitPositions.map((unit) => {
        if (unit.id === unitId) {
          return { ...unit, targetX: x, targetY: y };
        }
        return unit;
      });

      return {
        ...prevBattle,
        playerUnitPositions: updatedPositions,
      };
    });
  }, []);

  // Update PoC capture progress (called each frame)
  const updatePoCCapture = useCallback((pocPositions, pocRadius = 50, deltaTime = 16) => {
    setBattle((prevBattle) => {
      if (!prevBattle || prevBattle.status !== 'active' || !pocPositions) {
        return prevBattle;
      }

      let updatedBattle = { ...prevBattle };
      let scoreChanged = false;
      let pocChanges = [];

      // Update each PoC
      updatedBattle.pocs = prevBattle.pocs.map((poc, pocIndex) => {
        const pocPos = pocPositions[pocIndex];
        if (!pocPos) return poc;

        // Get units on this PoC
        const playerUnitsOnPoC = getPlayerUnitsOnPoC(pocPos, prevBattle.playerUnitPositions, pocRadius);
        const enemyUnitsOnPoC = getEnemyUnitsOnPoC(pocPos, prevBattle.enemyUnitPositions, pocRadius);

        const playerCount = playerUnitsOnPoC.length;
        const enemyCount = enemyUnitsOnPoC.length;

        // Calculate capture rates
        const { playerRate, enemyRate, contested } = calculateCaptureRate(playerCount, enemyCount);

        // Apply capture progress based on rates
        let newProgress = poc.progress;

        if (playerRate > 0 && !contested) {
          newProgress = Math.min(100, newProgress + playerRate * (deltaTime / 1000));
        } else if (enemyRate > 0 && !contested) {
          newProgress = Math.min(100, newProgress + enemyRate * (deltaTime / 1000));
        } else if (contested) {
          // Contested: no progress for either side
          // Progress stays same
        } else if (playerCount === 0 && enemyCount === 0) {
          // No units on PoC: decay progress back toward neutral (50%)
          const decayRate = 20; // % per second
          const decayAmount = decayRate * (deltaTime / 1000);

          if (newProgress > 50) {
            newProgress = Math.max(50, newProgress - decayAmount);
          } else if (newProgress < 50) {
            newProgress = Math.min(50, newProgress + decayAmount);
          }
        }

        newProgress = Math.max(0, Math.min(100, newProgress));

        // Determine owner based on progress
        let newOwner = poc.owner;
        if (newProgress >= 100) {
          if (playerCount > enemyCount || (playerCount > 0 && enemyCount === 0)) {
            newOwner = 'player';
          } else if (enemyCount > playerCount || (enemyCount > 0 && playerCount === 0)) {
            newOwner = 'enemy';
          }
        } else if (newProgress <= 0) {
          newOwner = 'neutral';
        }

        // Track if ownership changed
        if (newOwner !== poc.owner) {
          pocChanges.push({ pocName: poc.name, oldOwner: poc.owner, newOwner });
          scoreChanged = true;
        }

        return {
          ...poc,
          progress: newProgress,
          owner: newOwner,
        };
      });

      // Recalculate scores
      if (scoreChanged || true) {
        // Always recalculate to be safe
        const playerPoCs = updatedBattle.pocs.filter((p) => p.owner === 'player').length;
        const enemyPoCs = updatedBattle.pocs.filter((p) => p.owner === 'enemy').length;

        updatedBattle.score = {
          player: playerPoCs,
          enemy: enemyPoCs,
        };

        // Add combat log entries for captured PoCs
        pocChanges.forEach((change) => {
          const message =
            change.newOwner === 'player'
              ? `PoC-${change.pocName} captured by player!`
              : `PoC-${change.pocName} captured by enemy!`;
          updatedBattle = addCombatLog(updatedBattle, message);
        });

        // Check victory condition: player has majority
        const majorityNeeded = updatedBattle.pocs.length / 2;
        if (playerPoCs > majorityNeeded && updatedBattle.status === 'active') {
          updatedBattle.status = 'victory';
          updatedBattle = addCombatLog(updatedBattle, 'VICTORY! Majority PoCs secured!');
        }
      }

      return updatedBattle;
    });
  }, [addCombatLog]);

  // Resolve combat between units (called each frame)
  const executeCombat = useCallback((unitDataMap) => {
    setBattle((prevBattle) => {
      if (!prevBattle || prevBattle.status !== 'active' || !unitDataMap) {
        return prevBattle;
      }

      // Resolve combat for this frame
      const combatResult = resolveCombat(
        prevBattle.playerUnitPositions,
        prevBattle.loadout,
        prevBattle.enemyUnitPositions,
        prevBattle.enemyUnits,
        unitDataMap,
        prevBattle.combatLog,
        addCombatLog
      );

      // Remove dead units
      const deathResult = removeDeadUnits(
        combatResult.playerUnitPositions,
        prevBattle.loadout,
        combatResult.enemyUnitPositions,
        prevBattle.enemyUnits,
        addCombatLog
      );

      // Calculate new squad health
      const newSquadHealth = calculateSquadHealth(deathResult.playerUnitPositions);

      let updatedBattle = {
        ...prevBattle,
        playerUnitPositions: deathResult.playerUnitPositions,
        enemyUnitPositions: deathResult.enemyUnitPositions,
        loadout: deathResult.playerUnits,
        enemyUnits: deathResult.enemyUnits,
        playerSquadHP: newSquadHealth,
        combatLog: deathResult.combatLog || combatResult.combatLog,
      };

      // Check defeat condition: all player units dead
      if (deathResult.playerUnitPositions.length === 0 && prevBattle.status === 'active') {
        updatedBattle.status = 'defeat';
        updatedBattle = addCombatLog(updatedBattle, 'All units destroyed - DEFEAT!');
      }

      return updatedBattle;
    });
  }, [addCombatLog]);

  // Update enemy AI targets (called each frame before movement)
  const updateEnemyAI = useCallback((pocPositions) => {
    setBattle((prevBattle) => {
      if (!prevBattle || prevBattle.status !== 'active' || !pocPositions || pocPositions.length === 0) {
        return prevBattle;
      }

      // Make AI decisions for enemy units
      const updatedEnemyPositions = makeEnemyAIDecisions(
        prevBattle.enemyUnitPositions,
        prevBattle.enemyUnits,
        prevBattle.pocs,
        pocPositions,
        prevBattle.playerUnitPositions,
        prevBattle.playerSquadHP,
        prevBattle.maxSquadHP
      );

      return {
        ...prevBattle,
        enemyUnitPositions: updatedEnemyPositions,
      };
    });
  }, []);

  // Move units toward their targets (called each frame)
  const moveUnitsTowardTargets = useCallback((loadout, playerStats, deltaTime) => {
    setBattle((prevBattle) => {
      if (!prevBattle || prevBattle.status !== 'active') return prevBattle;

      const updatedBattle = { ...prevBattle };

      // Update player units
      updatedBattle.playerUnitPositions = prevBattle.playerUnitPositions.map((unit, index) => {
        const unitData = loadout[index];
        if (!unitData) return unit;

        // Calculate actual speed with stat multiplier
        const speedMultiplier = 1 + (playerStats.tactics / 100) * 0.2;
        const actualSpeed = (unitData.baseSpeed || 120) * speedMultiplier;

        // Calculate distance to target
        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If close enough, snap to target
        if (distance < 2) {
          return { ...unit, x: unit.targetX, y: unit.targetY };
        }

        // Move toward target
        const moveDistance = actualSpeed * (deltaTime / 1000);

        if (moveDistance >= distance) {
          // Can reach target this frame
          return { ...unit, x: unit.targetX, y: unit.targetY };
        }

        // Move partway toward target
        const ratio = moveDistance / distance;
        return {
          ...unit,
          x: unit.x + dx * ratio,
          y: unit.y + dy * ratio,
        };
      });

      // Update enemy units (no stat multiplier)
      updatedBattle.enemyUnitPositions = prevBattle.enemyUnitPositions.map((unit, index) => {
        const unitData = prevBattle.enemyUnits[index];
        if (!unitData) return unit;

        const actualSpeed = unitData.baseSpeed || 120;

        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 2) {
          return { ...unit, x: unit.targetX, y: unit.targetY };
        }

        const moveDistance = actualSpeed * (deltaTime / 1000);

        if (moveDistance >= distance) {
          return { ...unit, x: unit.targetX, y: unit.targetY };
        }

        const ratio = moveDistance / distance;
        return {
          ...unit,
          x: unit.x + dx * ratio,
          y: unit.y + dy * ratio,
        };
      });

      return updatedBattle;
    });
  }, []);

  // Update camera position and zoom
  const updateCamera = useCallback((x, y, zoom) => {
    setBattle((prevBattle) => {
      if (!prevBattle) return prevBattle;

      return {
        ...prevBattle,
        camera: { x, y, zoom },
      };
    });
  }, []);

  // Reset camera to center
  const resetCamera = useCallback(() => {
    setBattle((prevBattle) => {
      if (!prevBattle) return prevBattle;

      return {
        ...prevBattle,
        camera: { x: 960, y: 540, zoom: 1.0 },
      };
    });
  }, []);

  return {
    battle,
    isLoading,
    initializeBattle,
    startBattle,
    assaultPoC,
    takeDamage,
    retreat,
    checkVictory,
    updateTimer,
    formatTime,
    calculateRewards,
    updateUnitPosition,
    updateCamera,
    resetCamera,
    moveUnitsTowardTargets,
    updatePoCCapture,
    updateEnemyAI,
    executeCombat,
  };
};

export default useBattle;
