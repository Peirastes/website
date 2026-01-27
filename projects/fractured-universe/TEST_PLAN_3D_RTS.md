# 3D RTS Battle System - Test Plan

## Implementation Summary

### Completed Components
1. **Battle3DView.jsx** - Main 3D viewport wrapper with Canvas
2. **BattleScene.jsx** - Scene orchestrator combining all 3D elements
3. **Battlefield.jsx** - Ground plane with grid and faction edge markers
4. **Lighting.jsx** - Three-point lighting setup with directional and point lights
5. **CameraController.jsx** - OrbitControls with pan/rotate/zoom constraints
6. **CaptureZone.jsx** - Individual PoC with glow effects and progress rings
7. **CaptureZones.jsx** - Arranges PoCs in circular formation around center
8. **Unit.jsx** - Individual unit with division-specific geometry and health rings
9. **UnitGroup.jsx** - Renders player and enemy unit collections
10. **useUnitPositions.js** - Hook for calculating unit positions
11. **BattleSimulator.jsx** - Modified to integrate 3D view in left panel

### Integration Points
- 3D view renders in place of PoC card grid (left 60% of battle screen)
- Squad status panel and combat log remain unchanged (right side and footer)
- All battle callbacks (onAssaultPoC, onRetreat) properly wired
- Battle state flows read-only from useBattle to 3D visualization

---

## Test Checklist

### Phase 1: Rendering and Display
- [ ] 3D viewport loads without errors
- [ ] Ground plane visible with grid pattern
- [ ] Faction edge markers display (green/red/blue/orange borders)
- [ ] Center battlefield marker visible
- [ ] Lighting properly illuminates scene

### Phase 2: PoC Visualization
- [ ] PoCs appear in circular formation around center
- [ ] All PoCs render as cylinders with glowing halos
- [ ] Neutral PoCs show yellow color
- [ ] Player-captured PoCs show green color
- [ ] Enemy-captured PoCs show red color
- [ ] PoC names display above each point
- [ ] Progress rings show capture progress correctly

### Phase 3: Unit Visualization
- [ ] Player units appear on near side (Z = -30)
- [ ] Enemy units appear on far side (Z = +30)
- [ ] Infantry units render as boxes (1x2x1)
- [ ] Mobile units render as wide boxes (2x1x2)
- [ ] Aviation units render as cones
- [ ] Organic units render as spheres
- [ ] Units have faction color (green for player, red for enemy)
- [ ] Health rings display above units
- [ ] Units have subtle bobbing animation

### Phase 4: Camera Controls
- [ ] Camera starts at reasonable viewing angle
- [ ] Left-click drag rotates camera around battlefield
- [ ] Right-click drag pans camera
- [ ] Scroll wheel zooms in/out
- [ ] Camera has minimum/maximum zoom distance
- [ ] Camera cannot rotate below ground level
- [ ] Camera smoothly follows constraints (no jittering)

### Phase 5: Interaction
- [ ] Hovering over PoC highlights it with glow effect
- [ ] Hovering over unit highlights it with glow and selection ring
- [ ] Clicking on PoC triggers assault (notification appears)
- [ ] Clicking on PoCs advances their capture progress
- [ ] PoC colors change as ownership changes
- [ ] Multiple clicks on same PoC accumulate progress

### Phase 6: Animation and Polish
- [ ] PoC glow pulses smoothly
- [ ] Unit bobbing animation is smooth
- [ ] Selection glow effects are visible
- [ ] Color transitions for PoC ownership are smooth
- [ ] No visible flickering or rendering artifacts

### Phase 7: Battle Integration
- [ ] Battle timer counts down in header (unchanged)
- [ ] Squad health bar updates correctly (right panel, unchanged)
- [ ] Squad status shows all units
- [ ] Combat log updates with assault actions
- [ ] PoC scores update in header
- [ ] Victory modal appears when player controls >50% of PoCs
- [ ] Defeat modal appears when timer expires or HP reaches 0

### Phase 8: UI Integration
- [ ] 3D view fits properly in left panel (60% width)
- [ ] Squad status panel visible on right (40% width)
- [ ] Combat log scrollable at bottom
- [ ] Header with timer and scores visible
- [ ] RETREAT button functional
- [ ] All existing 2D UI elements styled correctly
- [ ] Layout responsive to window size

### Phase 9: Battle Flow
- [ ] Start new battle from War Map
- [ ] Deployment phase shows squad ready
- [ ] Begin Battle button transitions to active battle
- [ ] 3D view loads during active battle
- [ ] Can assault PoCs from 3D view
- [ ] Battle progresses correctly
- [ ] Victory or defeat transitions work
- [ ] Rewards screen displays correctly

---

## Performance Targets

- **FPS**: Target 60 FPS with 12 units + 6 PoCs
- **Response Time**: <100ms for PoC click interaction
- **Load Time**: <2 seconds for 3D scene to render
- **Memory**: No memory leaks on repeated battles

---

## Known Limitations (Prototype Phase)

- Units cannot be commanded/moved (future phase)
- No projectiles or combat animations (future phase)
- No fog of war (future phase)
- Enemy units are not dynamically generated (use placeholder array)
- No pathfinding (future phase)
- Text rendering for PoC names is simple geometry (future phase)

---

## Debugging Tips

If 3D view doesn't appear:
1. Check browser console for errors
2. Verify Canvas component mounted in BattleSimulator
3. Check that battle state is being passed correctly
4. Verify Three.js and R3F dependencies installed

If camera doesn't respond:
1. Check OrbitControls initialization
2. Verify camera constraints are reasonable
3. Check for mouse event conflicts with other UI elements

If PoCs don't respond to clicks:
1. Verify raycast intersection detection
2. Check onAssaultPoC callback is being called
3. Verify assaultPoC function in useBattle is updating state

---

## Test Scenarios

### Scenario 1: Basic Visualization
1. Deploy battle with 3-4 unit squad to any sector
2. Click "Begin Battle"
3. Observe 3D view loads with PoCs and units
4. Rotate camera around scene
5. Zoom in/out
6. Pan camera around

**Expected**: Smooth camera controls, clear unit and PoC visualization

### Scenario 2: PoC Interaction
1. From 3D view, click on a neutral PoC multiple times
2. Watch progress ring increase
3. After 4 clicks, PoC should turn green and capture complete
4. Check combat log for assault messages
5. Verify PoC score updates in header

**Expected**: PoC ownership changes, colors update, score increases

### Scenario 3: Long Battle
1. Deploy and begin battle
2. Assault multiple PoCs alternately
3. Watch timer count down in real-time
4. When timer reaches <1 minute, verify text pulses red
5. Let timer expire or reach victory condition
6. Verify modal appears with rewards

**Expected**: Battle flows normally, timer updates, victory/defeat triggers

### Scenario 4: Squad Management
1. Deploy battle with max squad units (12)
2. Observe all units render on correct sides
3. Verify different unit types have different shapes
4. Hover over units to see highlights
5. Continue battle and verify squad status panel updates

**Expected**: All units visible, health bars work, squad management functional

---

## Success Criteria

✅ Implementation is complete when:
1. 3D viewport renders without errors
2. All core components (units, PoCs, camera) functional
3. PoC clicks trigger assaults correctly
4. Camera controls respond smoothly
5. Battle flow complete end-to-end
6. Victory/defeat conditions trigger properly
7. No console errors
8. Build completes successfully

---

## Next Steps (Post-Prototype)

- [ ] Unit movement commands (click-to-move)
- [ ] Pathfinding for unit movement
- [ ] Combat animations and effects
- [ ] Projectile visualization
- [ ] Advanced UI overlays
- [ ] Minimap
- [ ] Fog of war
- [ ] Performance optimization for larger battles
- [ ] Detailed 3D models for units
- [ ] Faction-specific unit visual styles
