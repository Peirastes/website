# 3D Battlefield System: Diagnostic Report

**Date:** January 27, 2026
**Status:** NON-FUNCTIONAL

---

## Summary

The 3D battlefield visualization renders correctly but **is completely non-interactive**. Players can see the 3D environment but cannot interact with it. Clicking PoCs and units has no effect on the battle logic.

---

## What Works

✓ Three.js library loads correctly
✓ React Three Fiber Canvas renders without errors
✓ Lighting system initializes
✓ CameraController allows mouse/touch pan/zoom
✓ Battlefield grid renders
✓ PoC cylinders render with correct colors (yellow/green/red)
✓ Unit geometry renders
✓ Animation loops run (pulsing glows, rotations)
✓ Console doesn't show Three.js errors

---

## What Doesn't Work

✗ **PoC clicks don't register** - Clicking on PoC cylinders does nothing
✗ **Unit clicks don't register** - Clicking on units does nothing
✗ **No assault commands are sent** - `onAssaultPoC` never fires from 3D clicks
✗ **Battle logic doesn't respond to 3D actions** - Battle state unchanged by 3D interaction
✗ **Players can't control units** - No unit positioning or movement possible

---

## Root Causes

### 1. **Raycasting Not Implemented**
React Three Fiber uses pointer events on 3D objects, but they require proper raycasting setup:

```javascript
// This is set up in CaptureZone.jsx:
onClick={(e) => {
  e.stopPropagation();
  onClick(poc.id);  // This SHOULD fire, but doesn't reach the handler
}}
```

**Problem:** The Three.js objects have event listeners, but the raycasting environment may not be properly configured. The Canvas doesn't have an `onClick` handler to manage raycasting at the canvas level.

### 2. **No Intersection Detection**
For React Three Fiber clicks to work, the scene needs:
- A properly initialized Raycaster
- Updated pointer coordinates
- Intersection detection with clickable objects
- Event bubbling through the scene hierarchy

**Current state:** Objects have `onClick` handlers but no mechanism to detect when the pointer intersects them.

### 3. **Pointer Events Not Wired to Canvas**
The Canvas in Battle3DView.jsx:
```javascript
<Canvas
  camera={{...}}
  style={{ width: '100%', height: '100%' }}
  dpr={window.devicePixelRatio}
>
```

**Missing:**
- No `onPointerDown`, `onPointerMove`, `onPointerUp` handlers
- No `raycaster` configuration
- No event manager setup

### 3. **Event Handlers Reference Wrong Functions**
In BattleScene.jsx, the handlers are passed down but may not be properly connected:

```javascript
onObjectHover={(id) => onObjectHover(id ? `poc-${id}` : null)}
onClick={() => onAssaultPoC(poc.id)}
```

**Issue:** These are just closures that call the functions, but if the parent component doesn't actually implement raycasting, the events never fire from the 3D objects.

### 4. **Read-Only Visualization**
The 3D view is set up as a visualization layer, not an interactive control layer:
- PoCs render based on `battle.pocs` state
- Units render based on `loadout` and `battle.enemyUnits`
- But clicking them doesn't modify `battle` or `loadout` state
- The UI buttons on the right side are the actual controls

**Architecture Problem:** Two parallel battle systems:
1. **Right Panel** (Functional) - "Assault PoC" button actually works, updates battle state
2. **3D View** (Non-functional) - PoC cylinders render but aren't interactive

---

## Code Analysis

### Battle3DView.jsx Issues

**Lines 14-15: Local State Not Used**
```javascript
const [selectedUnits, setSelectedUnits] = useState([]);
const [hoveredObject, setHoveredObject] = useState(null);
```
These states are created but never actually used to affect gameplay. They're just tracking what's hovered in the 3D view.

**Lines 36-40: Event Handlers Pass to BattleScene**
```javascript
onUnitSelect={setSelectedUnits}
onObjectHover={setHoveredObject}
onAssaultPoC={onAssaultPoC}
onRetreat={onRetreat}
```
These are passed down, but if the 3D objects aren't firing click events due to raycasting issues, these handlers are never called.

### BattleScene.jsx Issues

**Line 29: Debug Log but No Interaction**
```javascript
console.log('BattleScene rendering:', {
  pocCount: battle.pocs?.length,
  loadoutCount: loadout?.length,
  enemyUnitCount: battle.enemyUnits?.length
});
```
The component logs data but doesn't actually enable interaction.

**Lines 39-45: PoCs Pass onClick but No Raycasting**
```javascript
<CaptureZones
  pocs={battle.pocs}
  hoveredObject={hoveredObject}
  onObjectHover={onObjectHover}
  onAssaultPoC={onAssaultPoC}
/>
```
The callback functions are passed, but without a raycaster, the clicks never reach them.

### CaptureZone.jsx: Correct Implementation, Wrong Environment

**Lines 63-66: onClick Handler IS Properly Implemented**
```javascript
onClick={(e) => {
  e.stopPropagation();
  onClick(poc.id);
}}
```

**Issue:** This handler works perfectly in React Three Fiber *when raycasting is enabled*. It's not broken code—it's correct code in a broken environment.

---

## Why It LOOKS Like It Works

1. **Visual Rendering is Fine** - Three.js renders the 3D objects without errors
2. **No Console Errors** - React Three Fiber doesn't error if raycasting isn't set up
3. **Exploration Tool Found No Issues** - Automated code review found syntactically correct event handlers
4. **Silent Failure** - Clicks simply don't trigger events; there's no error message

This is the deceptive nature of incomplete implementations—the visual part works but the interaction doesn't.

---

## What Needs to Happen

To make the 3D battlefield interactive:

### Option A: Fix the 3D Interactivity (Recommended)

1. **Add Raycasting to Canvas**
   - Implement `onPointerDown`, `onPointerMove`, `onPointerUp` handlers
   - Create a Raycaster that translates pointer coordinates to world space
   - Detect intersections with PoC and Unit objects

2. **Enable Click Detection**
   - When a PoC is clicked, call `onAssaultPoC(pocId)` and immediately update `battle` state
   - When a unit is clicked, track selection and allow positioning commands

3. **Connect Actions to Battle Logic**
   - Clicking a PoC in 3D should have the same effect as clicking "Assault PoC" button
   - This requires passing the actual battle state update functions, not just callbacks

4. **Add Unit Movement**
   - Allow players to drag units to new positions
   - Send unit movement commands that update unit positions and affect battle outcome

### Option B: Remove 3D and Use 2D Tactical View (Faster)

1. **Remove 3D Components** - Delete `/battle3d/` directory
2. **Create 2D Canvas** - Implement a 2D tactical map using HTML5 Canvas or SVG
3. **Easier Interaction** - 2D raycasting is simpler and more performant
4. **Aligned with Original** - Shattered Galaxy used 2D tactical views
5. **Quicker Implementation** - Can be done in 1-2 days

---

## Current Battle Flow (Why 3D Doesn't Work)

```
User clicks "Assault PoC" button on right panel
  ↓
handleAssaultPoC() is called
  ↓
assaultPoC(pocId) updates useBattle hook state
  ↓
battle.score and battle.playerSquadHP update
  ↓
BattleSimulator re-renders
  ↓
3D view re-renders with new PoC ownership colors

BUT:

User clicks PoC cylinder in 3D
  ↓
CaptureZone.onClick handler SHOULD fire
  ↓
BUT: No raycaster → click events don't propagate
  ↓
onAssaultPoC never called
  ↓
battle state unchanged
  ↓
No effect on game
```

---

## Evidence This Is Broken

1. **You reported it doesn't work** ← Most reliable source
2. **No unit control possible** - Can't move units in 3D (no movement commands)
3. **No way to test it** - Try clicking PoCs in 3D battle and nothing happens
4. **Dual UI systems** - Right panel buttons work, 3D interaction doesn't
5. **Incomplete feature** - All the 3D rendering code is there, but the interaction layer is missing

---

## Recommendation

**The 3D battlefield should either be:**
1. **Completed with full interactivity** - Full raycasting, unit positioning, movement commands (High effort, high reward)
2. **Removed entirely** - Delete 3D components and replace with 2D tactical view (Lower effort, meets original design)
3. **Disabled as a feature** - Hide the 3D view and only use the right-panel UI (No effort, poor UX)

The current state of "renders but doesn't work" is the worst option because it:
- Suggests the feature is complete when it's not
- Takes up 2.5 screen real estate showing non-interactive content
- Confuses players about how to actually play
- Blocks the core gameplay loop

---

## Files Involved

- `src/components/game/BattleSimulator.jsx` - Main battle controller
- `src/components/game/Battle3DView.jsx` - 3D canvas wrapper
- `src/components/game/battle3d/BattleScene.jsx` - Scene orchestrator
- `src/components/game/battle3d/CaptureZone.jsx` - PoC interactive mesh
- `src/components/game/battle3d/CaptureZones.jsx` - PoC renderer
- `src/components/game/battle3d/UnitGroup.jsx` - Unit renderer
- `src/components/game/battle3d/Unit.jsx` - Individual unit mesh
- `src/components/game/battle3d/Battlefield.jsx` - Ground plane
- `src/components/game/battle3d/Lighting.jsx` - 3-point lighting
- `src/components/game/battle3d/CameraController.jsx` - Orbit camera

---

## Conclusion

The 3D battlefield is a **beautiful but non-functional** visual layer. The rendering pipeline works perfectly, but the interaction pipeline is incomplete. Every interactive element has the callback functions defined correctly, but those callbacks are never invoked due to missing raycasting infrastructure.

This is a classic case of "the drawing is done, but the controls aren't wired."
