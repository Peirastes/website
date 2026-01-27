/**
 * Battle Rendering Utilities
 * Handles all 2D canvas drawing for the battlefield
 */

import { getUnitSprite } from './spriteGenerator.js';

/**
 * Convert world coordinates to screen coordinates (accounting for camera pan/zoom)
 */
export const worldToScreen = (worldX, worldY, camera) => {
  if (!camera) {
    return { screenX: worldX, screenY: worldY };
  }

  const screenX = (worldX - camera.x) * camera.zoom + 960;
  const screenY = (worldY - camera.y) * camera.zoom + 540;
  return { screenX, screenY };
};

/**
 * Convert screen coordinates to world coordinates
 */
export const screenToWorld = (screenX, screenY, camera) => {
  if (!camera) {
    return { worldX: screenX, worldY: screenY };
  }

  const worldX = (screenX - 960) / camera.zoom + camera.x;
  const worldY = (screenY - 540) / camera.zoom + camera.y;
  return { worldX, worldY };
};

/**
 * Draw grid background
 */
export const drawGrid = (ctx, camera, canvasWidth, canvasHeight, gridSize = 50) => {
  ctx.strokeStyle = 'rgba(100, 150, 100, 0.1)';
  ctx.lineWidth = 1;

  const startX = Math.floor((camera.x - canvasWidth / (2 * camera.zoom)) / gridSize) * gridSize;
  const startY = Math.floor((camera.y - canvasHeight / (2 * camera.zoom)) / gridSize) * gridSize;
  const endX = startX + canvasWidth / camera.zoom + gridSize;
  const endY = startY + canvasHeight / camera.zoom + gridSize;

  // Vertical lines
  for (let x = startX; x < endX; x += gridSize) {
    const { screenX: sx } = worldToScreen(x, startY, camera);
    const { screenX: sx2 } = worldToScreen(x, endY, camera);
    const { screenY: sy1 } = worldToScreen(x, startY, camera);
    const { screenY: sy2 } = worldToScreen(x, endY, camera);

    ctx.beginPath();
    ctx.moveTo(sx, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = startY; y < endY; y += gridSize) {
    const { screenX: sx1 } = worldToScreen(startX, y, camera);
    const { screenX: sx2 } = worldToScreen(endX, y, camera);
    const { screenY: sy } = worldToScreen(startX, y, camera);

    ctx.beginPath();
    ctx.moveTo(sx1, sy);
    ctx.lineTo(sx2, sy);
    ctx.stroke();
  }
};

/**
 * Draw a single PoC (Point of Contention)
 */
export const drawPoC = (ctx, poc, x, y, camera, pocRadius = 50) => {
  const { screenX, screenY } = worldToScreen(x, y, camera);

  // PoC color based on owner
  let pocColor = '#ffff00'; // neutral (yellow)
  if (poc.owner === 'player') pocColor = '#00ff9f'; // player (green)
  if (poc.owner === 'enemy') pocColor = '#ff3b3b'; // enemy (red)

  // Draw main PoC circle
  ctx.fillStyle = pocColor;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(screenX, screenY, pocRadius * camera.zoom, 0, Math.PI * 2);
  ctx.fill();

  // Draw PoC border
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = pocColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX, screenY, pocRadius * camera.zoom, 0, Math.PI * 2);
  ctx.stroke();

  // Draw capture progress ring
  if (poc.progress > 0) {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = pocColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (poc.progress / 100) * Math.PI * 2;
    ctx.arc(screenX, screenY, (pocRadius + 10) * camera.zoom, startAngle, endAngle);
    ctx.stroke();
  }

  // Draw PoC name label
  ctx.globalAlpha = 1;
  ctx.fillStyle = pocColor;
  ctx.font = 'bold 14px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(poc.name, screenX, screenY - (pocRadius + 20) * camera.zoom);

  // Draw progress percentage
  if (poc.progress > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.fillText(`${Math.round(poc.progress)}%`, screenX, screenY);
  }

  ctx.globalAlpha = 1;
};

/**
 * Draw all PoCs
 */
export const drawPoCs = (ctx, pocs, pocPositions, camera, pocRadius = 50) => {
  if (!pocs || !pocPositions) return;

  pocs.forEach((poc, index) => {
    if (pocPositions[index]) {
      drawPoC(ctx, poc, pocPositions[index].x, pocPositions[index].y, camera, pocRadius);
    }
  });
};

/**
 * Draw a single unit
 */
export const drawUnit = (
  ctx,
  unit,
  unitData,
  x,
  y,
  camera,
  faction,
  isSelected = false,
  isHovered = false,
  isInCombat = false
) => {
  const { screenX, screenY } = worldToScreen(x, y, camera);
  const size = unitData.size || 18;
  const scaledSize = size * camera.zoom;

  // Get the generated sprite for this unit (larger size for better visibility)
  const sprite = getUnitSprite(unitData, faction, 96);

  // Draw the sprite scaled to the unit size
  ctx.globalAlpha = isInCombat ? 0.95 : 0.85;
  ctx.drawImage(sprite, screenX - scaledSize / 2, screenY - scaledSize / 2, scaledSize, scaledSize);

  // Draw combat indicator (flashing red glow)
  if (isInCombat) {
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.strokeRect(screenX - scaledSize / 2, screenY - scaledSize / 2, scaledSize, scaledSize);
  }

  // Draw selection glow if selected
  if (isSelected) {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1;
    ctx.strokeRect(screenX - scaledSize / 2 - 4, screenY - scaledSize / 2 - 4, scaledSize + 8, scaledSize + 8);
  }

  // Draw hover highlight if hovered
  if (isHovered) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(screenX - scaledSize / 2 - 2, screenY - scaledSize / 2 - 2, scaledSize + 4, scaledSize + 4);
  }

  // Draw health bar below unit
  if (unit.hp !== undefined) {
    const maxHp = unitData.hp || unit.hp;
    const healthPercent = Math.max(0, unit.hp / maxHp);
    const barWidth = scaledSize * 1.5;
    const barHeight = 4;
    const barX = screenX - barWidth / 2;
    const barY = screenY + scaledSize / 2 + 6;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff9f' : healthPercent > 0.25 ? '#ffc93b' : '#ff3b3b';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  ctx.globalAlpha = 1;
};

/**
 * Draw player units
 */
export const drawPlayerUnits = (ctx, loadout, playerUnitPositions, camera, playerFaction, selectedUnits = [], combatUnits = new Set()) => {
  if (!loadout || !playerUnitPositions) return;

  loadout.forEach((unitData, index) => {
    const position = playerUnitPositions[index];
    if (position) {
      const isSelected = selectedUnits.includes(index);
      const isInCombat = combatUnits.has(index);
      drawUnit(ctx, position, unitData, position.x, position.y, camera, playerFaction, isSelected, false, isInCombat);
    }
  });
};

/**
 * Draw enemy units
 */
export const drawEnemyUnits = (ctx, enemyUnits, enemyUnitPositions, camera, enemyFaction, combatUnits = new Set()) => {
  if (!enemyUnits || !enemyUnitPositions) return;

  enemyUnits.forEach((unitData, index) => {
    const position = enemyUnitPositions[index];
    if (position) {
      const isInCombat = combatUnits.has(index);
      drawUnit(ctx, position, unitData, position.x, position.y, camera, enemyFaction, false, false, isInCombat);
    }
  });
};

/**
 * Draw HUD (heads-up display) - text overlays
 */
export const drawHUD = (
  ctx,
  sectorName,
  score,
  timer,
  formatTime,
  squadHealth,
  maxSquadHealth,
  factionColor,
  canvasWidth,
  canvasHeight
) => {
  ctx.globalAlpha = 1;
  ctx.fillStyle = factionColor;
  ctx.font = 'bold 18px Orbitron';
  ctx.textAlign = 'left';

  // Sector name (top left)
  ctx.fillText(sectorName, 20, 35);

  // Score (top center)
  ctx.textAlign = 'center';
  ctx.fillStyle = factionColor;
  ctx.fillText(`YOUR PoCs: ${score.player}`, canvasWidth / 2 - 100, 35);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillText(`ENEMY PoCs: ${score.enemy}`, canvasWidth / 2 + 100, 35);

  // Timer (top right)
  const timerColor = timer < 60 ? '#ff3b3b' : factionColor;
  ctx.fillStyle = timerColor;
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(formatTime(timer), canvasWidth - 20, 40);

  // Squad health (bottom left)
  ctx.font = '14px Orbitron';
  ctx.textAlign = 'left';
  ctx.fillStyle = factionColor;
  ctx.fillText(`Squad HP: ${squadHealth}/${maxSquadHealth}`, 20, canvasHeight - 20);

  // Helper text (bottom right)
  ctx.font = '12px Orbitron';
  ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
  ctx.textAlign = 'right';
  ctx.fillText('Drag units • Ctrl+Click multi-select • Shift+Drag box-select', canvasWidth - 20, canvasHeight - 20);
};

/**
 * Draw selection box for box-select tool
 */
export const drawSelectionBox = (ctx, startX, startY, endX, endY, camera) => {
  const { screenX: sx, screenY: sy } = worldToScreen(startX, startY, camera);
  const { screenX: ex, screenY: ey } = worldToScreen(endX, endY, camera);

  ctx.fillStyle = 'rgba(0, 255, 159, 0.1)';
  ctx.fillRect(sx, sy, ex - sx, ey - sy);

  ctx.strokeStyle = 'rgba(0, 255, 159, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, ex - sx, ey - sy);
};

/**
 * Draw combat range indicators (debug)
 */
export const drawCombatRanges = (ctx, units, positions, camera, unitDataMap) => {
  units.forEach((unit, index) => {
    if (positions[index]) {
      const pos = positions[index];
      const unitData = unitDataMap[unit.id];
      if (unitData && unitData.combatRange) {
        const { screenX, screenY } = worldToScreen(pos.x, pos.y, camera);
        const radius = unitData.combatRange * camera.zoom;

        ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
};
