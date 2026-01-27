import { useMemo } from 'react';

export default function useUnitPositions(loadout) {
  const unitPositions = useMemo(() => {
    if (!loadout) return {};

    const positions = {};

    // Player units on near side (Z = -35)
    loadout.forEach((unit, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      positions[unit.id || `player-${index}`] = {
        x: (col - 1) * 15,
        y: 2,
        z: -35 + row * 15,
        isPlayer: true
      };
    });

    return positions;
  }, [loadout]);

  return unitPositions;
}
