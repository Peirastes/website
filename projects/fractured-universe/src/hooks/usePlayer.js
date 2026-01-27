import { useState, useCallback, useEffect } from 'react';
import { createInitialPlayer } from '../data/gameData.js';

const STORAGE_KEY = 'fractured-universe-player';

export const usePlayer = () => {
  const [player, setPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize player from localStorage or create new
  useEffect(() => {
    const savedPlayer = localStorage.getItem(STORAGE_KEY);
    if (savedPlayer) {
      try {
        setPlayer(JSON.parse(savedPlayer));
      } catch (error) {
        console.error('Failed to parse saved player data:', error);
        const newPlayer = createInitialPlayer({});
        setPlayer(newPlayer);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer));
      }
    } else {
      const newPlayer = createInitialPlayer({});
      setPlayer(newPlayer);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer));
    }
    setIsLoading(false);
  }, []);

  // Helper: Calculate max unit capacity
  const maxUnitCapacity = useCallback(() => {
    if (!player) return 6;
    const baseCapacity = 6 + Math.floor(player.stats.tactics / 2);
    return Math.min(baseCapacity, 12);
  }, [player]);

  // Helper: Get current unit count in active loadout
  const currentUnitCount = useCallback(() => {
    if (!player) return 0;
    return player.loadouts[player.activeLoadout]?.units?.length || 0;
  }, [player]);

  // Update player state and save to localStorage
  const updatePlayer = useCallback((updates) => {
    setPlayer((prevPlayer) => {
      const updatedPlayer = { ...prevPlayer, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Add XP and handle level-ups
  const addXP = useCallback((amount) => {
    setPlayer((prevPlayer) => {
      let newXP = prevPlayer.xp + amount;
      let newLevel = prevPlayer.level;
      let newXPToNext = prevPlayer.xpToNext;
      let newStatPoints = prevPlayer.statPoints;

      // Handle level-ups
      while (newXP >= newXPToNext) {
        newXP -= newXPToNext;
        newLevel += 1;
        newXPToNext = Math.floor(1000 * Math.pow(1.1, newLevel - 1));
        newStatPoints += 1;
      }

      const updatedPlayer = {
        ...prevPlayer,
        xp: newXP,
        level: newLevel,
        xpToNext: newXPToNext,
        statPoints: newStatPoints,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Add credits to player
  const addCredits = useCallback((amount) => {
    setPlayer((prevPlayer) => {
      const updatedPlayer = {
        ...prevPlayer,
        credits: Math.max(0, prevPlayer.credits + amount),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Add resources to player
  const addResources = useCallback((amount) => {
    setPlayer((prevPlayer) => {
      const updatedPlayer = {
        ...prevPlayer,
        resources: Math.max(0, prevPlayer.resources + amount),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Allocate stat points to a specific stat
  const allocateStat = useCallback((statName, points) => {
    setPlayer((prevPlayer) => {
      // Validate stat name
      const validStats = ['tactics', 'clout', 'education', 'mechApt'];
      if (!validStats.includes(statName)) {
        console.warn(`Invalid stat name: ${statName}`);
        return prevPlayer;
      }

      // Check if enough stat points available
      if (prevPlayer.statPoints < points) {
        console.warn('Not enough stat points available');
        return prevPlayer;
      }

      const updatedPlayer = {
        ...prevPlayer,
        stats: {
          ...prevPlayer.stats,
          [statName]: prevPlayer.stats[statName] + points,
        },
        statPoints: prevPlayer.statPoints - points,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Increase division mastery level
  const increaseDivisionLevel = useCallback((divisionId) => {
    setPlayer((prevPlayer) => {
      const validDivisions = ['infantry', 'mobile', 'aviation', 'organic'];
      if (!validDivisions.includes(divisionId)) {
        console.warn(`Invalid division ID: ${divisionId}`);
        return prevPlayer;
      }

      const updatedPlayer = {
        ...prevPlayer,
        divisionLevels: {
          ...prevPlayer.divisionLevels,
          [divisionId]: prevPlayer.divisionLevels[divisionId] + 1,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Add unit to specified loadout
  const addUnit = useCallback((unit, loadoutIndex) => {
    setPlayer((prevPlayer) => {
      // Validate loadout index
      if (loadoutIndex < 0 || loadoutIndex >= prevPlayer.loadouts.length) {
        console.warn(`Invalid loadout index: ${loadoutIndex}`);
        return prevPlayer;
      }

      const activeLoadout = prevPlayer.loadouts[loadoutIndex];
      const currentCapacity = maxUnitCapacity();
      const currentCount = activeLoadout.units.length;

      // Check capacity
      if (currentCount >= currentCapacity) {
        console.warn('Unit capacity exceeded');
        return prevPlayer;
      }

      // Check if unit is valid
      if (!unit || !unit.id) {
        console.warn('Invalid unit object');
        return prevPlayer;
      }

      const updatedLoadouts = [...prevPlayer.loadouts];
      updatedLoadouts[loadoutIndex] = {
        ...activeLoadout,
        units: [...activeLoadout.units, unit],
      };

      const updatedPlayer = {
        ...prevPlayer,
        loadouts: updatedLoadouts,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, [maxUnitCapacity]);

  // Remove unit from loadout
  const removeUnit = useCallback((unitId, loadoutIndex) => {
    setPlayer((prevPlayer) => {
      // Validate loadout index
      if (loadoutIndex < 0 || loadoutIndex >= prevPlayer.loadouts.length) {
        console.warn(`Invalid loadout index: ${loadoutIndex}`);
        return prevPlayer;
      }

      const activeLoadout = prevPlayer.loadouts[loadoutIndex];
      const unitExists = activeLoadout.units.some((u) => u.id === unitId);

      if (!unitExists) {
        console.warn(`Unit not found: ${unitId}`);
        return prevPlayer;
      }

      const updatedLoadouts = [...prevPlayer.loadouts];
      updatedLoadouts[loadoutIndex] = {
        ...activeLoadout,
        units: activeLoadout.units.filter((u) => u.id !== unitId),
      };

      const updatedPlayer = {
        ...prevPlayer,
        loadouts: updatedLoadouts,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Switch active loadout
  const switchLoadout = useCallback((loadoutIndex) => {
    setPlayer((prevPlayer) => {
      // Validate loadout index
      if (loadoutIndex < 0 || loadoutIndex >= prevPlayer.loadouts.length) {
        console.warn(`Invalid loadout index: ${loadoutIndex}`);
        return prevPlayer;
      }

      const updatedPlayer = {
        ...prevPlayer,
        activeLoadout: loadoutIndex,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
      return updatedPlayer;
    });
  }, []);

  // Explicitly save player to localStorage
  const savePlayer = useCallback(() => {
    if (player) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    }
  }, [player]);

  // Reset player and clear localStorage
  const resetPlayer = useCallback(() => {
    const newPlayer = createInitialPlayer({});
    setPlayer(newPlayer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer));
  }, []);

  return {
    player,
    isLoading,
    updatePlayer,
    addXP,
    addCredits,
    addResources,
    allocateStat,
    increaseDivisionLevel,
    addUnit,
    removeUnit,
    switchLoadout,
    maxUnitCapacity,
    currentUnitCount,
    savePlayer,
    resetPlayer,
  };
};
