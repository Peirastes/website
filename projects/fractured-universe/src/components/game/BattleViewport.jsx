import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UNIT_CHASSIS } from '../../data/gameData.js';
import {
  worldToScreen,
  screenToWorld,
  drawGrid,
  drawPoCs,
  drawPlayerUnits,
  drawEnemyUnits,
  drawHUD,
  drawSelectionBox,
} from '../../utils/battleRenderer.js';
import {
  createInputState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  getUnitAtPosition,
  getUnitsInBox,
  updateUnitPositions,
  clampPosition,
  handleCameraPan,
  handleCameraZoom,
  getDistance,
} from '../../utils/inputHandler.js';
import { getUnitsInActiveCombat } from '../../utils/combatUtils.js';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const POC_RADIUS = 50;
const BATTLEFIELD_BOUNDS = { minX: 0, maxX: 1920, minY: 0, maxY: 1080 };

export default function BattleViewport({
  battle,
  loadout,
  player,
  onUnitCommand,
  onReturnToMap,
  addNotification,
  moveUnitsTowardTargets,
  updatePoCCapture,
  updateEnemyAI,
  executeCombat,
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const inputStateRef = useRef(createInputState());
  const lastFrameTimeRef = useRef(Date.now());

  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);
  const [hoveredUnit, setHoveredUnit] = useState(null);
  const boxSelectStartRef = useRef(null); // Track box selection start position

  if (!battle || !loadout) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading battle...
      </div>
    );
  }

  // Create unit data map for quick lookup
  const unitDataMap = {};
  loadout.forEach((unit, idx) => {
    unitDataMap[idx] = { ...UNIT_CHASSIS[unit.id.toUpperCase()], icon: unit.icon, isPlayer: true };
  });
  battle.enemyUnits.forEach((unit, idx) => {
    unitDataMap[`enemy-${idx}`] = { ...UNIT_CHASSIS[unit.id.toUpperCase()], icon: unit.icon, isPlayer: false };
  });

  // Calculate PoC positions in circular formation
  const pocPositions = battle.pocs.map((poc, index) => {
    const angle = (index / battle.pocs.length) * Math.PI * 2;
    const radius = 400;
    return {
      x: 960 + Math.cos(angle) * radius,
      y: 540 + Math.sin(angle) * radius,
    };
  });

  /**
   * Handle canvas click for unit selection
   */
  const handleCanvasClick = useCallback((e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    // Account for canvas scaling (canvas is 1920x1080 but may be displayed at different size)
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    const { worldX, worldY } = screenToWorld(screenX, screenY, battle.camera);

    const clickedUnit = getUnitAtPosition(worldX, worldY, loadout, battle.playerUnitPositions, unitDataMap);

    if (e.ctrlKey) {
      // Multi-select: toggle unit
      if (clickedUnit !== null) {
        if (selectedUnits.includes(clickedUnit)) {
          setSelectedUnits(selectedUnits.filter((id) => id !== clickedUnit));
        } else {
          setSelectedUnits([...selectedUnits, clickedUnit]);
        }
      }
    } else if (!selectionBox) {
      // This was a click (not a drag/box selection)
      if (clickedUnit !== null) {
        setSelectedUnits([clickedUnit]);
      } else {
        setSelectedUnits([]);
      }
    }
  }, [battle, loadout, selectedUnits, unitDataMap]);

  /**
   * Handle canvas mouse down
   */
  const handleCanvasMouseDown = useCallback((e) => {
    handleMouseDown(e, inputStateRef.current, battle.camera, selectedUnits, canvasRef.current);

    const rect = canvasRef.current.getBoundingClientRect();

    // Account for canvas scaling (canvas is 1920x1080 but may be displayed at different size)
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    const { worldX, worldY } = screenToWorld(screenX, screenY, battle.camera);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+left = camera pan
      inputStateRef.current.isDraggingCamera = true;
    } else if (e.button === 0) {
      // Left click - store start position for potential box selection
      const clickedUnit = getUnitAtPosition(worldX, worldY, loadout, battle.playerUnitPositions, unitDataMap);

      // Store the drag start position
      boxSelectStartRef.current = {
        worldX,
        worldY,
        clickedUnit,
        wasCtrlKey: e.ctrlKey,
      };

      if (clickedUnit !== null && !e.ctrlKey) {
        // Clicked on a unit (and not ctrl), select it
        setSelectedUnits([clickedUnit]);
      }
    }
  }, [battle, loadout, selectedUnits, unitDataMap]);

  /**
   * Handle canvas mouse move
   */
  const handleCanvasMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;

    const { worldX, worldY } = handleMouseMove(e, inputStateRef.current, battle.camera, canvasRef.current);

    // Handle camera panning
    if (inputStateRef.current.isDraggingCamera) {
      const deltaX = inputStateRef.current.mouseX - inputStateRef.current.lastMouseX;
      const deltaY = inputStateRef.current.mouseY - inputStateRef.current.lastMouseY;
      const newCamera = handleCameraPan(deltaX, deltaY, battle.camera);
      onUnitCommand?.('updateCamera', newCamera.x, newCamera.y, newCamera.zoom);
    }

    // Detect drag for box selection
    if (boxSelectStartRef.current && !selectionBox && !inputStateRef.current.isDraggingCamera) {
      const dx = worldX - boxSelectStartRef.current.worldX;
      const dy = worldY - boxSelectStartRef.current.worldY;
      const dragDistance = Math.sqrt(dx * dx + dy * dy);

      // If we've dragged far enough (10+ pixels in world space), start box selection
      if (dragDistance > 10) {
        setSelectionBox({
          startX: boxSelectStartRef.current.worldX,
          startY: boxSelectStartRef.current.worldY,
          endX: worldX,
          endY: worldY,
        });
      }
    }

    // Handle box selection
    if (selectionBox) {
      setSelectionBox({ ...selectionBox, endX: worldX, endY: worldY });
    }

    // Update hovered unit
    const hoveredUnit = getUnitAtPosition(worldX, worldY, loadout, battle.playerUnitPositions, unitDataMap);
    setHoveredUnit(hoveredUnit);
  }, [battle, loadout, selectionBox, unitDataMap, onUnitCommand]);

  /**
   * Handle canvas mouse up
   */
  const handleCanvasMouseUp = useCallback((e) => {
    if (selectionBox) {
      const unitsInBox = getUnitsInBox(selectionBox.startX, selectionBox.startY, selectionBox.endX, selectionBox.endY, loadout, battle.playerUnitPositions, unitDataMap);
      setSelectedUnits(unitsInBox);
      setSelectionBox(null);
    }

    // Clear box select start tracking
    boxSelectStartRef.current = null;

    handleMouseUp(inputStateRef.current);
  }, [selectionBox, loadout, battle, unitDataMap]);

  /**
   * Handle scroll wheel for zoom
   */
  const handleCanvasWheel = useCallback((e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -1 : 1;
    const newCamera = handleCameraZoom(zoomDelta, battle.camera);
    onUnitCommand?.('updateCamera', newCamera.x, newCamera.y, newCamera.zoom);
  }, [battle.camera, onUnitCommand]);

  /**
   * Handle right-click to move selected units
   */
  const handleCanvasRightClick = useCallback((e) => {
    e.preventDefault();

    if (!canvasRef.current || selectedUnits.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();

    // Account for canvas scaling (canvas is 1920x1080 but may be displayed at different size)
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    const { worldX, worldY } = screenToWorld(screenX, screenY, battle.camera);

    // Move all selected units to the right-click position
    selectedUnits.forEach((unitId) => {
      onUnitCommand?.('updatePosition', unitId, worldX, worldY);
    });
  }, [selectedUnits, battle.camera, onUnitCommand]);

  /**
   * Main render loop
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // Update enemy AI targets first (before movement)
      if (updateEnemyAI) {
        updateEnemyAI(pocPositions);
      }

      // Update unit positions each frame (move toward targets)
      if (moveUnitsTowardTargets && loadout && player) {
        moveUnitsTowardTargets(loadout, player.stats || { tactics: 0 }, deltaTime);
      }

      // Execute combat each frame (units deal damage)
      if (executeCombat) {
        executeCombat(unitDataMap);
      }

      // Update PoC capture progress each frame
      if (updatePoCCapture) {
        updatePoCCapture(pocPositions, POC_RADIUS, deltaTime);
      }

      // Clear canvas
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw background
      drawGrid(ctx, battle.camera, CANVAS_WIDTH, CANVAS_HEIGHT, 50);

      // Draw PoCs
      drawPoCs(ctx, battle.pocs, pocPositions, battle.camera, POC_RADIUS);

      // Calculate which units are in active combat
      const combatUnits = getUnitsInActiveCombat(
        battle.playerUnitPositions,
        loadout,
        battle.enemyUnitPositions,
        battle.enemyUnits,
        unitDataMap
      );

      // Draw units
      drawPlayerUnits(ctx, loadout, battle.playerUnitPositions, battle.camera, player.faction, selectedUnits, combatUnits.player);
      drawEnemyUnits(ctx, battle.enemyUnits, battle.enemyUnitPositions, battle.camera, battle.enemyFaction, combatUnits.enemy);

      // Draw selection box if active
      if (selectionBox) {
        drawSelectionBox(ctx, selectionBox.startX, selectionBox.startY, selectionBox.endX, selectionBox.endY, battle.camera);
      }

      // Draw HUD
      const factionColor = player?.faction?.color || '#00ff9f';
      drawHUD(
        ctx,
        battle.sector.name,
        battle.score,
        battle.timer,
        (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`,
        battle.playerSquadHP,
        battle.maxSquadHP,
        factionColor,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battle, loadout, player, selectedUnits, selectionBox, unitDataMap, pocPositions, moveUnitsTowardTargets, updatePoCCapture, updateEnemyAI, executeCombat]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    canvas.addEventListener('contextmenu', handleCanvasRightClick);

    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseup', handleCanvasMouseUp);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('wheel', handleCanvasWheel);
      canvas.removeEventListener('contextmenu', handleCanvasRightClick);
    };
  }, [handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp, handleCanvasClick, handleCanvasWheel, handleCanvasRightClick]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: inputStateRef.current.isDraggingUnit ? 'grabbing' : 'grab',
        }}
      />
    </div>
  );
}
