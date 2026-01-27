# Phase 1: Battle System Reconstruction - Implementation Plan

**Phase Duration:** Weeks 1-2 (14 days)
**Goal:** Replace 3D system with functional 2D tactical battles
**Outcome:** Real-time squad positioning and combat

---

## Overview

The current battle system is card-game-like (click button, hope for RNG success). Phase 1 replaces this with real-time tactical positioning where:

1. **Pre-Battle:** Player positions units on battlefield
2. **Battle Start:** Units auto-move to objectives, engage enemies
3. **Player Control:** Click units to reposition, hold strategic points
4. **Real-Time:** Everything happens simultaneously (not turn-based)
5. **Victory:** Capture majority PoCs before timer ends (15 min)

---

## Architecture Overview

```
Current Flow:
BattleSimulator
  ├─ Battle3DView (BROKEN, TO BE DELETED)
  └─ Right Panel with buttons

New Flow:
BattleSimulator
  ├─ BattleViewport (NEW 2D Canvas)
  │  ├─ Battlefield (grid background)
  │  ├─ PoCs (capture zones)
  │  ├─ PlayerUnits (draggable)
  │  ├─ EnemyUnits (AI-controlled)
  │  └─ SelectionUI (unit info panel)
  └─ BattleInfoPanel (timer, score, retreat)
```

---

## Week 1: Foundation

### Day 1: Project Setup & Cleanup

**Tasks:**
1. Delete `/src/components/game/battle3d/` directory entirely
2. Delete `/src/components/game/Battle3DView.jsx`
3. Update `BattleSimulator.jsx` to remove Battle3DView references
4. Remove Three.js, @react-three/fiber, @react-three/drei from package.json
5. Create new `/src/components/game/BattleViewport.jsx` (empty shell)

**Output:**
- Clean project without 3D dependencies
- Ready for 2D implementation

**Time:** 2-3 hours

---

### Days 2-3: 2D Canvas Foundation

**Task:** Create `BattleViewport.jsx` - the main 2D battle view

```javascript
// Core structure needed:
// - HTML5 Canvas (1200x700px)
// - Viewport wrapper component
// - Canvas context for 2D drawing
// - Frame loop using requestAnimationFrame
// - Mouse/touch input handling

Key capabilities:
✓ Render grid background (50x50px cells)
✓ Render static PoC circles
✓ Render player units as colored squares
✓ Render enemy units as colored squares
✓ Handle mouse events (click, drag)
✓ Update at 60 FPS
```

**What to build:**
```javascript
<BattleViewport
  battle={battle}           // PoCs, timer, scores
  loadout={loadout}         // Player unit data
  enemyUnits={enemyUnits}   // Enemy data
  onUnitCommand={...}       // Send movement command
  onAssaultPoC={...}        // Assault PoC
  onRetreat={...}           // Retreat
/>
```

**Key files:**
- `src/components/game/BattleViewport.jsx` (NEW, ~200 lines)
- `src/utils/battleRenderer.js` (NEW, ~300 lines for drawing logic)
- `src/utils/inputHandler.js` (NEW, ~150 lines for mouse/click)

**Output:**
- 2D canvas that renders PoCs and units
- Mouse interaction detection
- No gameplay logic yet (just rendering)

**Time:** 1 day

---

### Days 4-5: Unit Movement System

**Task:** Implement drag-to-move unit positioning

```
Player interaction:
1. Click on unit → unit is selected (highlight changes)
2. Drag to position → unit moves with mouse
3. Release → unit positioned at that location
4. Unit checks if on PoC:
   - If on PoC: unit contributes to capture
   - If not on PoC: unit is positioned but inactive
```

**What to build:**
- Unit selection state tracking
- Mouse drag detection and validation
- Unit movement constraints (stay on battlefield)
- Visual feedback (selection glow, drag preview)
- Store unit positions in battle state

**Key files:**
- Update `BattleViewport.jsx` to handle drag logic
- Update `useBattle.js` hook to track unit positions
- `src/utils/collisionDetection.js` (NEW, ~100 lines)

**Logic needed:**
```javascript
// When player drags unit to new position:
1. Check if new position is on battlefield (0-1200, 0-700)
2. Check if new position is occupied (no unit overlap for now)
3. Update unit.x and unit.y in battle state
4. Re-render with new position
5. Check if unit is on any PoC (distance < PoC radius)
6. If on PoC, start capturing (if enough units present)
```

**Output:**
- Player can drag units around battlefield
- Units snap into valid positions
- Visual feedback shows where units are

**Time:** 1.5 days

---

### Days 6-7: PoC Interaction & Capture Logic

**Task:** Implement PoC capture mechanics

```
Capture rules (from Shattered Galaxy):
- Capturing a PoC takes ~30 seconds
- Requires at least 1 player unit on the PoC
- More units = faster capture
- Enemy units on PoC block/counter capture
- Progress shown as ring around PoC
```

**What to build:**
- PoC capture progress tracking
- Unit occupancy detection (which units are on which PoCs)
- Auto-capture when units are present
- Counter-assault system (enemy blocks capture)
- Visual feedback (progress rings, status colors)

**Key files:**
- Update `useBattle.js` with capture logic
- `src/utils/pocMechanics.js` (NEW, ~200 lines)

**Logic needed:**
```javascript
// Each frame:
1. For each PoC:
   a. Count player units on PoC (within radius)
   b. Count enemy units on PoC
   c. If player units > enemy units:
      - Capture progress += (unit count / 100) per second
      - When progress = 100, player owns PoC
   d. If enemy units > player units:
      - Capture progress stops (blocked)
      - Enemy counter-assaults (30% chance per second)
   e. Draw progress ring (0-360 degrees)

2. Calculate score = (player PoCs / total PoCs)
3. Victory if player > 50% for 2+ seconds
4. Defeat if timer runs out and player < 50%
```

**Output:**
- PoCs can be captured by positioning units
- Visual progress rings show capture status
- Battle logic checks for victory conditions

**Time:** 1.5 days

---

## Week 2: AI & Polish

### Days 8-9: Enemy AI Movement

**Task:** Implement enemy unit AI

```
Enemy behavior:
1. Identify nearest uncaptured PoC
2. Move all units toward that PoC
3. If PoC being captured, move to defend
4. Avoid clumping (spread out to cover more area)
5. If outnumbered at PoC, retreat and regroup
```

**What to build:**
- Simple pathfinding (move toward target)
- Target selection (which PoC to attack)
- Unit grouping logic (don't all stack on one spot)
- Attack/defend priority

**Key files:**
- `src/utils/enemyAI.js` (NEW, ~250 lines)

**Logic needed:**
```javascript
// Each frame for each enemy unit:
1. If unit.target === null:
   a. Find nearest uncaptured or enemy-controlled PoC
   b. Set as target
2. Move unit toward target at unit.speed
3. Stop moving if reached target position
4. If another enemy unit within distance:
   a. Spread out (move perpendicular to target)
5. If attacked, damage unit.hp
```

**Output:**
- Enemy units move toward objectives
- Battles become actually interactive (not predetermined)
- Player must position units strategically to counter enemy

**Time:** 1.5 days

---

### Days 10-11: Combat Mechanics

**Task:** Implement unit damage and death

```
Combat system:
- When player unit and enemy unit are close, they engage
- Damage dealt each frame based on unit stats
- Unit dies when HP reaches 0
- Dead units removed from battlefield
- Player units have health bars
```

**What to build:**
- Collision detection between player/enemy units
- Damage calculation based on unit types
- Death/removal system
- Health visualization

**Key files:**
- Update `useBattle.js` with combat logic
- Update `BattleViewport.jsx` to render health bars

**Logic needed:**
```javascript
// Each frame for combat:
1. For each player unit:
   a. Check distance to all enemy units
   b. If distance < combat_range (e.g., 30px):
      - Calculate damage based on unit.damage vs unit.armor
      - enemy.hp -= damage
      - If enemy.hp <= 0, remove enemy unit
   c. Take damage from enemy units
   d. If unit.hp <= 0, remove unit and update squad HP

2. Update squad HP in battle state (sum of all unit HPs)
3. Check defeat condition: if squad HP = 0, lose
```

**Output:**
- Units can damage each other
- Battles have meaningful outcomes (not predetermined)
- Squad health tracking works

**Time:** 1.5 days

---

### Days 12-14: UI Integration & Polish

**Task:** Integrate 2D viewport with rest of battle UI

**What to build:**
- Remove old button-based UI elements
- Integrate new 2D canvas into BattleSimulator layout
- Add unit selection info panel (shows selected unit stats)
- Add retreat button
- Add stats display (PoCs, squad HP, morale)
- Add camera reset button
- Error handling and edge cases

**Key files:**
- Update `BattleSimulator.jsx` layout
- Update `index.css` for 2D viewport styling
- Update `useBattle.js` to handle all new state

**UI elements needed:**
```
Layout:
┌────────────────────────────────────────────────┐
│ Sector Name | Score: YOUR 3 vs ENEMY 2 | Timer │
├────────────────────────────────────────────────┤
│                                                │
│   2D BATTLEFIELD CANVAS (1200x700)             │
│   - PoCs (yellow circles)                      │
│   - Player units (green squares)               │
│   - Enemy units (red squares)                  │
│                                                │
├────────────────────────────────────────────────┤
│ Squad HP: ████░ | Selected Unit: Infantry-1   │
│ [RETREAT]                    [RESET CAMERA]    │
└────────────────────────────────────────────────┘
```

**Output:**
- Functional 2D battle system
- All UI elements working
- Ready for playtesting

**Time:** 1.5 days

---

## Testing Checklist (End of Week 2)

- [ ] Game loads without errors
- [ ] Can see 2D battlefield with PoCs and units
- [ ] Can drag units around (they move smoothly)
- [ ] Units stay within battlefield bounds
- [ ] Can position units on PoCs
- [ ] PoC capture progress shows visually
- [ ] Enemy units move toward objectives
- [ ] Units take damage when near each other
- [ ] Squad HP decreases as units die
- [ ] Victory triggers when player > 50% PoCs
- [ ] Defeat triggers when timer expires
- [ ] Retreat button works
- [ ] Battle completes without crashing

---

## Code Changes Summary

### Files to Delete
- `/src/components/game/battle3d/` (entire directory)
- `/src/components/game/Battle3DView.jsx`

### Files to Create
- `src/components/game/BattleViewport.jsx` (~400 lines)
- `src/utils/battleRenderer.js` (~300 lines)
- `src/utils/inputHandler.js` (~150 lines)
- `src/utils/collisionDetection.js` (~100 lines)
- `src/utils/pocMechanics.js` (~200 lines)
- `src/utils/enemyAI.js` (~250 lines)

### Files to Modify
- `src/components/game/BattleSimulator.jsx` (remove Battle3DView, add BattleViewport)
- `src/hooks/useBattle.js` (add unit positioning, capture logic, AI)
- `src/index.css` (adjust layout for 2D canvas)
- `package.json` (remove Three.js dependencies)

### Total New Code: ~1,400 lines
### Estimated Time: 2 weeks full-time

---

## Day-by-Day Breakdown

| Day | Task | Hours | Deliverable |
|-----|------|-------|-------------|
| 1 | Cleanup & setup | 3 | Clean project structure |
| 2-3 | 2D Canvas foundation | 8 | Renders PoCs and units |
| 4-5 | Unit drag-to-move | 6 | Player can position units |
| 6-7 | PoC capture logic | 6 | PoCs can be captured |
| 8-9 | Enemy AI | 6 | Enemy units move and attack |
| 10-11 | Combat & damage | 6 | Units take damage and die |
| 12-14 | UI integration & polish | 5 | Everything connected |
| **TOTAL** | | **40 hours** | **Working 2D battle system** |

---

## Critical Decisions to Make Now

### 1. Canvas Size
- **Current suggestion:** 1200 x 700 pixels
- **Rationale:** Fits nicely in UI, room for ~10-15 units per side
- **Alternative:** Larger (1600x900) for more positioning nuance

### 2. Unit Speed
- **How fast do units move?** ~100 pixels/second (crosses battlefield in ~12 seconds)
- **How quickly is PoC captured?** ~3-5 seconds with 1 unit (matches Shattered Galaxy's 30 seconds with better tools)

### 3. Unit Size & Range
- **Unit size:** 15-20 pixels (visible but doesn't clutter)
- **Combat range:** 40 pixels (units engage when this close)
- **PoC radius:** 50 pixels (capture area visible)

### 4. Camera/Zoom
- **Zoom level:** Fixed (no zooming initially)
- **Pan:** Can drag canvas to move view (like dragging a map)
- **Reset:** Button to return to default view

---

## Success Metrics

Phase 1 is **COMPLETE** when:

✓ **Playability**
- [ ] Can play a full 15-minute battle without crashes
- [ ] Battle ends with clear win/loss condition
- [ ] Player feels in control of units, not watching RNG

✓ **Interactivity**
- [ ] Dragging units feels responsive (no lag)
- [ ] Unit positioning directly affects battle outcome
- [ ] Enemy behavior is intelligible (you can read their tactics)

✓ **Quality**
- [ ] No visual glitches or overlapping elements
- [ ] Information (scores, timer, unit HP) is always visible
- [ ] Retreat button and error states handled

✓ **Comparison to Original**
- [ ] Battle feels like tactical positioning, not button clicking
- [ ] Matches Shattered Galaxy's real-time squad control feel
- [ ] Player skill (positioning) matters more than RNG

---

## Post-Phase 1 Notes

After Phase 1 is complete:
- Don't add new features to Phase 1 code
- Test extensively before moving to Phase 2
- Gather feedback: "Is this fun? What feels wrong?"
- Phase 2 focuses on unit depth and customization
- Phase 3 adds character progression
- Phase 4 brings multiplayer

**Do not proceed to Phase 2 until Phase 1 feels polished and plays well.**

---

## Commands to Run

```bash
# Delete 3D dependencies
npm uninstall three @react-three/fiber @react-three/drei @react-three/postprocessing

# Create file structure
mkdir -p src/utils

# Create initial files (see Day 1 section)
```

---

## Questions Before Starting?

- Camera controls: Should we allow zoom? Pan by dragging map edge?
- Unit selection: One at a time, or multi-select (click+drag to select multiple)?
- Grid: Should we show grid overlay or keep it clean?
- Difficulty: Should enemy AI scale with difficulty setting?

These can be decided as you build, but thinking about them now saves rework later.

---

**Next Step:** Get approval on critical decisions above, then start Day 1 cleanup.
