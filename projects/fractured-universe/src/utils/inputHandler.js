/**
 * Input Handling Utilities
 * Manages mouse/touch events for the battle viewport
 */

import { screenToWorld } from './battleRenderer.js';

/**
 * Get unit at a specific position
 */
export const getUnitAtPosition = (worldX, worldY, units, positions, unitDataMap) => {
  if (!units || !positions || !unitDataMap) return null;

  // Check units in reverse order (so units on top are selected first)
  for (let i = units.length - 1; i >= 0; i--) {
    const pos = positions[i];
    const unitData = unitDataMap[i];

    if (!pos || !unitData) continue;

    const dx = worldX - pos.x;
    const dy = worldY - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = (unitData.size || 18) / 2 + 5; // Add 5px tolerance

    if (distance < hitRadius) {
      return i;
    }
  }

  return null;
};

/**
 * Get all units within a box selection
 */
export const getUnitsInBox = (startX, startY, endX, endY, units, positions, unitDataMap) => {
  if (!units || !positions || !unitDataMap) return [];

  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);

  const selectedUnits = [];

  units.forEach((unit, index) => {
    const pos = positions[index];
    if (!pos) return;

    if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
      selectedUnits.push(index);
    }
  });

  return selectedUnits;
};

/**
 * Check if a position is valid (on battlefield)
 */
export const isValidPosition = (x, y, minX = 0, maxX = 1920, minY = 0, maxY = 1080) => {
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
};

/**
 * Create input state tracker
 */
export const createInputState = () => {
  return {
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    dragStartX: 0,
    dragStartY: 0,
    isDraggingUnit: false,
    isDraggingCamera: false,
    isDraggingBox: false,
    draggedUnitId: null,
  };
};

/**
 * Handle mouse down event
 */
export const handleMouseDown = (
  e,
  inputState,
  camera,
  selectedUnits,
  canvasElement
) => {
  const rect = canvasElement.getBoundingClientRect();

  // Account for canvas scaling (canvas is 1920x1080 but may be displayed at different size)
  const scaleX = canvasElement.width / rect.width;
  const scaleY = canvasElement.height / rect.height;

  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;

  inputState.mouseDown = true;
  inputState.lastMouseX = inputState.mouseX;
  inputState.lastMouseY = inputState.mouseY;
  inputState.mouseX = screenX;
  inputState.mouseY = screenY;

  const { worldX, worldY } = screenToWorld(screenX, screenY, camera);
  inputState.dragStartX = worldX;
  inputState.dragStartY = worldY;

  return { worldX, worldY, screenX, screenY };
};

/**
 * Handle mouse move event
 */
export const handleMouseMove = (
  e,
  inputState,
  camera,
  canvasElement
) => {
  const rect = canvasElement.getBoundingClientRect();

  // Account for canvas scaling (canvas is 1920x1080 but may be displayed at different size)
  const scaleX = canvasElement.width / rect.width;
  const scaleY = canvasElement.height / rect.height;

  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;

  inputState.lastMouseX = inputState.mouseX;
  inputState.lastMouseY = inputState.mouseY;
  inputState.mouseX = screenX;
  inputState.mouseY = screenY;

  const { worldX, worldY } = screenToWorld(screenX, screenY, camera);

  return { worldX, worldY, screenX, screenY };
};

/**
 * Handle mouse up event
 */
export const handleMouseUp = (inputState) => {
  inputState.mouseDown = false;
  inputState.isDraggingUnit = false;
  inputState.isDraggingCamera = false;
  inputState.isDraggingBox = false;
  inputState.draggedUnitId = null;
};

/**
 * Check if user is trying to drag unit (moved mouse while selecting unit)
 */
export const isDraggingUnit = (
  dragDistance = 5
) => {
  // In pixels
  return dragDistance > 5;
};

/**
 * Calculate distance between two points
 */
export const getDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Clamp unit position to valid battlefield area
 */
export const clampPosition = (x, y, unitSize = 18, minX = 0, maxX = 1920, minY = 0, maxY = 1080) => {
  const halfSize = unitSize / 2;
  return {
    x: Math.max(minX + halfSize, Math.min(maxX - halfSize, x)),
    y: Math.max(minY + halfSize, Math.min(maxY - halfSize, y)),
  };
};

/**
 * Handle camera pan (for drag-pan camera)
 */
export const handleCameraPan = (deltaX, deltaY, camera, canvasWidth = 1920, canvasHeight = 1080) => {
  const newX = camera.x - deltaX / camera.zoom;
  const newY = camera.y - deltaY / camera.zoom;

  // Clamp camera to battlefield bounds
  const minX = -200;
  const maxX = 1920 + 200;
  const minY = -200;
  const maxY = 1080 + 200;

  return {
    x: Math.max(minX, Math.min(maxX, newX)),
    y: Math.max(minY, Math.min(maxY, newY)),
    zoom: camera.zoom,
  };
};

/**
 * Handle camera zoom (for scroll wheel)
 */
export const handleCameraZoom = (zoomDelta, camera, minZoom = 0.5, maxZoom = 2.0) => {
  const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom * (1 + zoomDelta * 0.1)));

  return {
    x: camera.x,
    y: camera.y,
    zoom: newZoom,
  };
};

/**
 * Interpolate unit position toward target (smooth movement)
 */
export const moveUnitToward = (currentPos, targetPos, speed, deltaTime) => {
  // deltaTime is in milliseconds, convert to seconds
  const deltaSeconds = deltaTime / 1000;

  const dx = targetPos.x - currentPos.x;
  const dy = targetPos.y - currentPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1) {
    // Close enough, snap to target
    return targetPos;
  }

  const moveDistance = speed * deltaSeconds;

  if (moveDistance >= distance) {
    // Can reach target this frame
    return targetPos;
  }

  // Move toward target
  const ratio = moveDistance / distance;
  return {
    x: currentPos.x + dx * ratio,
    y: currentPos.y + dy * ratio,
  };
};

/**
 * Animate unit smooth movement
 * Call this each frame to update unit positions
 */
export const updateUnitPositions = (
  playerUnitPositions,
  loadout,
  enemyUnitPositions,
  enemyUnits,
  playerStats,
  deltaTime
) => {
  const updated = {
    playerUnitPositions: [...playerUnitPositions],
    enemyUnitPositions: [...enemyUnitPositions],
  };

  // Update player units
  playerUnitPositions.forEach((unit, index) => {
    const unitData = loadout[index];
    if (unitData) {
      const speedMultiplier = 1 + (playerStats.tactics / 100) * 0.2;
      const actualSpeed = (unitData.baseSpeed || 120) * speedMultiplier;

      const newPos = moveUnitToward(
        { x: unit.x, y: unit.y },
        { x: unit.targetX, y: unit.targetY },
        actualSpeed,
        deltaTime
      );

      updated.playerUnitPositions[index] = {
        ...unit,
        x: newPos.x,
        y: newPos.y,
      };
    }
  });

  // Update enemy units (use base speed, no stat modifiers)
  enemyUnitPositions.forEach((unit, index) => {
    const unitData = enemyUnits[index];
    if (unitData) {
      const actualSpeed = unitData.baseSpeed || 120;

      const newPos = moveUnitToward(
        { x: unit.x, y: unit.y },
        { x: unit.targetX, y: unit.targetY },
        actualSpeed,
        deltaTime
      );

      updated.enemyUnitPositions[index] = {
        ...unit,
        x: newPos.x,
        y: newPos.y,
      };
    }
  });

  return updated;
};
