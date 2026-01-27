# Phase 1: Your Configuration & Implementation Details

**Your Decisions:** Recorded and locked in

---

## Configuration Summary

| Decision | Your Choice | Complexity | Notes |
|----------|-------------|------------|-------|
| Canvas Size | 1920 x 1080 | Medium | Large screen, more tactical depth |
| Unit Speeds | Variable by unit + player stats | High | Different units move at different speeds |
| PoC Capture | 60 seconds | Medium | Much longer, emphasizes holding territory |
| Unit Size/Range | Variable by unit type | High | Each unit has unique size and combat range |
| PoC Radius | 50px | Low | Standard, no special handling needed |
| Camera | Drag-pan | Medium | Click-drag to pan, enables zooming later |
| Selection | Single + Multi + Drag-box | High | Full RTS-style unit selection system |
| Difficulty | Fixed | Low | No scaling, no AI difficulty modes |

**Overall Complexity:** HIGH (more ambitious than defaults)
**Estimated Timeline:** Still 2 weeks, but tasks will be tighter
**Result:** Deep, strategic RTS-like game (not arcade)

---

## Specific Implementation Details

### 1. Canvas Size: 1920 x 1080

**Layout implications:**
```
┌────────────────────────────────────────────────────────────────┐
│ Header: Sector Name | Score | Timer (full width)              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Battlefield Viewport (1920x1080)                              │
│  - Much larger than 1200x700 recommendation                   │
│  - More room for unit positioning                             │
│  - More complex camera needed (pan + zoom)                    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Squad Info | Selected Unit | Retreat Button                    │
└────────────────────────────────────────────────────────────────┘
```

**Practical implications:**
- Battlefield takes full screen width
- Battle UI panels need to be overlaid or repositioned
- Need to accommodate both large units AND 12-unit squads without crowding
- Higher resolution = more precision needed, smoother rendering important

---

### 2. Variable Unit Speeds

**Implementation structure:**

```javascript
// Unit data structure (expanded)
{
  id: 'infantry-1',
  name: 'Infantry',
  division: 'Infantry',
  type: 'light',
  baseSpeed: 120,        // pixels/second (base for this unit type)
  baseDamage: 8,
  baseArmor: 3,
  size: 18,              // pixels (for rendering)
  combatRange: 35,       // pixels
  hp: 30,
  icon: '🚶'
}

// Speed calculation with player stats:
actualSpeed = unit.baseSpeed * (1 + player.stats.tactics / 100 * 0.2)
// Tactics stat increases speed by up to 20% at max stats
```

**Unit type speed tiers:**
- **Light units** (Infantry Scouts): 150 px/sec base
- **Standard units** (Infantry, Mobile): 120 px/sec base
- **Heavy units** (Tanks): 80 px/sec base
- **Air units** (Aviation): 180 px/sec base

**Where this is implemented:**
- `gameData.js` - Unit definitions with baseSpeed
- `useBattle.js` - Calculate actual speed based on player stats each frame
- `BattleViewport.js` - Use actual speed for movement calculations

**Code example:**
```javascript
// In game loop (each frame):
const speedMultiplier = 1 + (player.stats.tactics / 100) * 0.2;
const actualSpeed = unit.baseSpeed * speedMultiplier;
const distanceThisFrame = actualSpeed * deltaTime / 1000; // deltaTime in ms
unit.x += (targetX - unit.x) / distance * distanceThisFrame;
unit.y += (targetY - unit.y) / distance * distanceThisFrame;
```

---

### 3. PoC Capture: 60 Seconds

**Much longer than typical recommendation. Implications:**

**Game pacing:**
- Battles will last closer to 15 minutes full duration
- Capturing PoCs is major strategic commitment
- Holding territory matters more than rushing
- Players must leave units on PoCs for extended time

**Capture formula:**
```
BaseCapture = 1 unit holding PoC alone = 60 seconds to 100%
Scaling:
- 1 unit: 60 seconds
- 2 units: 60 / 1.3 = 46 seconds
- 3 units: 60 / 1.5 = 40 seconds
- 4+ units: 60 / 2 = 30 seconds (minimum)

Enemy blocks:
- If enemy units on same PoC, progress stops
- Progress resets slowly if outnumbered for >2 seconds
```

**Visual feedback needed:**
- Progress ring around PoC (0-360 degrees)
- Update smoothly, not jumpy
- Color changes with owner (yellow=neutral, green=player, red=enemy)
- Label showing capture percentage

**Impact on battle:**
- Victory requires 50% of PoCs for extended time
- Can't flip PoCs quickly
- Defensive play is viable (hold 3-4 PoCs for 60+ seconds)
- Aggressive rushes won't work (need to hold long enough)

---

### 4. Variable Unit Size & Range

**Unit definitions needed in gameData.js:**

```javascript
// Each unit needs size and range
{
  id: 'infantry-1',
  name: 'Infantry Rifleman',
  size: 18,        // pixels (render size)
  range: 35,       // pixels (combat engagement distance)
  // ... other stats
}

// Examples:
{name: 'Infantry Scout', size: 14, range: 30},
{name: 'Infantry', size: 18, range: 35},
{name: 'Infantry Tank', size: 22, range: 25},
{name: 'Mobile Jeep', size: 20, range: 40},
{name: 'Mobile Tank', size: 26, range: 28},
{name: 'Air Fighter', size: 16, range: 45},
{name: 'Air Bomber', size: 18, range: 35},
{name: 'Organic Beast', size: 20, range: 40},
```

**Size rendering:**
```javascript
// In BattleViewport.js
function drawUnit(ctx, unit) {
  const size = unit.size; // Use unit's actual size
  ctx.fillRect(unit.x - size/2, unit.y - size/2, size, size);
  // Draw proportional health bar based on size
}
```

**Range implications:**
- Combat happens when distance < unit.range
- Different units engage at different distances
- Ranged units (Aviation, Tanks) have longer ranges
- Close-combat units (Organic) have shorter ranges
- Affects tactical positioning significantly

**Implementation:**
```javascript
// Combat check each frame:
for (let player of playerUnits) {
  for (let enemy of enemyUnits) {
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    const engagementRange = Math.max(player.range, enemy.range);
    if (distance < engagementRange) {
      // Combat!
      enemy.hp -= player.damage;
    }
  }
}
```

---

### 5. Drag-Pan Camera

**Camera system:**

```
Fixed view (1920x1080 canvas) shows center of battlefield
User can:
1. Click and drag canvas to pan view
2. Scroll wheel to zoom (0.5x - 2x)
3. Reset button to return to default center

Canvas coordinate system:
- World space: actual battlefield coordinates (units, PoCs)
- Screen space: what player sees (affected by pan/zoom)
- Input space: mouse coordinates on screen
```

**Implementation steps:**

```javascript
// Camera state
const [camera, setCamera] = useState({
  x: 0,      // Pan offset x
  y: 0,      // Pan offset y
  zoom: 1.0  // Zoom level (1.0 = full view)
});

// When user drags:
if (mouseDown) {
  const deltaX = currentMouseX - lastMouseX;
  const deltaY = currentMouseY - lastMouseY;
  setCamera(prev => ({
    ...prev,
    x: prev.x - deltaX / prev.zoom,
    y: prev.y - deltaY / prev.zoom
  }));
}

// When user scrolls:
if (wheelUp) {
  setCamera(prev => ({
    ...prev,
    zoom: Math.min(2.0, prev.zoom * 1.1)
  }));
}

// Convert world coordinates to screen:
function worldToScreen(worldX, worldY, camera) {
  const screenX = (worldX - camera.x) * camera.zoom;
  const screenY = (worldY - camera.y) * camera.zoom;
  return { screenX, screenY };
}

// Convert screen coordinates to world (for clicks):
function screenToWorld(screenX, screenY, camera) {
  const worldX = screenX / camera.zoom + camera.x;
  const worldY = screenY / camera.zoom + camera.y;
  return { worldX, worldY };
}
```

**Drawing with camera:**
```javascript
// Instead of:
ctx.fillRect(unit.x, unit.y, 20, 20);

// Do:
const { screenX, screenY } = worldToScreen(unit.x, unit.y, camera);
ctx.fillRect(screenX - 10, screenY - 10, 20, 20);
```

**Complexity note:** This requires updating ALL drawing and input code to use camera transforms. Doable but takes care.

---

### 6. Advanced Unit Selection System

**Three selection modes:**

**A) Single Select (Click on unit)**
```
- Click unit → select it (highlight with glow)
- Click empty space → deselect
- Visual: selected unit has bright glow/border
```

**B) Multi-Select (Ctrl/Cmd + Click)**
```
- Ctrl + click unit → add to selection
- Ctrl + click again → remove from selection
- Shift + click → select range between last and this
- Visual: all selected units highlighted
```

**C) Drag-Box Select (Click and drag to create box)**
```
- Click and drag → create selection box
- All units in box become selected
- Release → confirm selection
- Visual: translucent selection box, highlighted units
```

**Implementation:**

```javascript
const [selectedUnits, setSelectedUnits] = useState([]);
const [selectionBox, setSelectionBox] = useState(null);

// Click handling:
function handleCanvasClick(e, camera) {
  const { worldX, worldY } = screenToWorld(e.clientX, e.clientY, camera);

  if (e.ctrlKey) {
    // Multi-select mode
    const unit = getUnitAtPosition(worldX, worldY);
    if (unit) {
      toggleUnitSelection(unit);
    }
  } else if (e.shiftKey) {
    // Drag-box mode (start here, continue in mousemove)
    setSelectionBox({ startX: worldX, startY: worldY, endX: worldX, endY: worldY });
  } else {
    // Single select
    const unit = getUnitAtPosition(worldX, worldY);
    if (unit) {
      setSelectedUnits([unit]);
    } else {
      setSelectedUnits([]);
    }
  }
}

// Drag-box selection:
function handleMouseMove(e, camera) {
  if (selectionBox) {
    const { worldX, worldY } = screenToWorld(e.clientX, e.clientY, camera);
    setSelectionBox(prev => ({ ...prev, endX: worldX, endY: worldY }));
  }
}

function handleMouseUp() {
  if (selectionBox) {
    // Find all units within box
    const unitsInBox = playerUnits.filter(unit => {
      return isUnitInBox(unit, selectionBox);
    });
    setSelectedUnits(unitsInBox);
    setSelectionBox(null);
  }
}
```

**Multi-select movement:**
```javascript
// When dragging selected units
if (selectedUnits.length > 0) {
  // Calculate drag delta
  const deltaX = targetX - selectedUnits[0].x;
  const deltaY = targetY - selectedUnits[0].y;

  // Move all selected units by same delta (maintain formation)
  selectedUnits.forEach(unit => {
    unit.targetX = unit.x + deltaX;
    unit.targetY = unit.y + deltaY;
  });
}
```

**Visual feedback:**
- Single selected unit: bright glow around it
- Multi-selected units: green highlight/border on all
- Drag-box: semi-transparent rectangle showing selection area
- Selection info panel: "3 units selected"

---

### 7. System Integration

**How these systems work together:**

```
Player clicks on units
  ↓
Selection system detects (single/multi/box)
  ↓
Selected units highlighted visually
  ↓
Player drags to new position
  ↓
All selected units move together (maintain relative positions)
  ↓
Each unit moves at its own speed (baseSpeed * statModifier)
  ↓
Units reach target position and hold it
  ↓
If units are on PoC, capture timer starts
  ↓
Capture time: 60 seconds with 1 unit
  ↓
If enemy units arrive, capture progress stops/reverses
  ↓
Once captured, PoC owner changes (yellow → green/red)
  ↓
Victory when >50% PoCs controlled for duration
```

---

## Phase 1 Timeline Adjustment

Your choices are more complex than defaults. Estimated impact:

| Task | Default | Your Choices | Extra Time |
|------|---------|--------------|-----------|
| Canvas foundation | 8 hrs | 10 hrs | Camera system |
| Drag-to-move | 6 hrs | 8 hrs | Multi-select system |
| PoC capture | 6 hrs | 8 hrs | 60-second timer complexity |
| Enemy AI | 6 hrs | 7 hrs | Variable speeds |
| Combat | 6 hrs | 7 hrs | Variable sizes/ranges |
| UI integration | 5 hrs | 7 hrs | Complex overlays |
| **TOTAL** | **40 hrs** | **47 hrs** | **+7 hours** |

**Recommendation:** 2.5 weeks instead of 2 weeks (extra buffer for complexity)

Or: Stay at 2 weeks but plan for late nights some days

---

## Risk Assessment

**Complexity Risks (all manageable):**

🟡 **Camera Pan/Zoom** - Medium complexity
- Many drawing operations need camera transform
- Input coordinate mapping needs careful math
- Mitigation: Start with fixed camera, add pan/zoom as "nice to have"

🟡 **Multi-Select System** - Medium complexity
- Need clear visual feedback (which units selected?)
- Drag-box selection requires box drawing
- Mitigation: Implement single-select first, add multi/box later

🟡 **Variable Unit Speeds** - Low complexity
- Just a multiplier on movement
- But need unit database expanded
- Mitigation: Define unit speeds in gameData.js clearly

🟡 **60-Second Capture** - Low complexity
- Just a longer timer
- More visual feedback needed
- Mitigation: Progress ring animation

🟢 **Variable Sizes/Ranges** - Low complexity
- Just store size/range in unit data
- Use in rendering and combat
- Easy to balance later

**Biggest risk:** Camera pan/zoom system + multi-select system both being in Phase 1
**Mitigation:** These can move to Phase 1.5 if Phase 1 gets tight

---

## Implementation Priority

**In case time gets tight, implement in this order:**

1. ✓ **Critical** (must have)
   - Canvas rendering at 1920x1080
   - Variable unit speeds
   - PoC capture at 60 seconds
   - Variable unit size (just for rendering)
   - Single-select units only (no multi/box yet)

2. 🟡 **Important** (add before Phase 1 done)
   - Variable combat range
   - Multi-select system
   - Drag-box selection
   - Drag-pan camera

3. 🟢 **Polish** (can add later)
   - Zoom functionality
   - Selection box visual
   - Smooth camera transitions
   - Unit formation maintenance

**If Phase 1 gets tight:** Keep 1 & 2a, defer 2b+3 to Phase 1.5

---

## Summary

Your configuration is **ambitious but solid**:

✓ **1920x1080** - More tactical depth, but needs careful UI
✓ **Variable speeds** - Good design, adds depth
✓ **60-second capture** - Matches original, emphasizes positioning
✓ **Variable sizes/ranges** - Realistic unit differentiation
✓ **Drag-pan camera** - Better for large screen
✓ **Full selection system** - RTS-style control
✓ **Fixed difficulty** - Smart to keep simple

**Trade-off:** More complex than defaults, but results in deeper, better game
**Timeline:** Add 1 week buffer (2.5 weeks instead of 2)
**Outcome:** Real RTS game with meaningful tactical decisions

---

## Ready to Start?

Now that we've locked in your configuration, ready to start **Day 1: Cleanup**?

Next steps:
1. Confirm timeline (2 weeks? 2.5 weeks? Other?)
2. Confirm you understand the complexity
3. Ask any clarifying questions
4. We start Day 1 cleanup

Let me know!
