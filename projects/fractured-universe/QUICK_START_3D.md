# 3D RTS Battle System - Quick Start Guide

## Running the Project

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Testing the 3D Battle System

### Step 1: Navigate to War Map
- From main game menu, select "War Map" tab
- Choose any sector to attack

### Step 2: Deploy Battle
- Click "Join Battle" on a sector
- Review your squad (deployment phase)
- Click "BEGIN BATTLE"

### Step 3: View 3D Battlefield
- The 3D viewport should appear on the left side
- You'll see:
  - Grid ground plane with faction borders
  - Points of Contention (PoCs) as glowing cylinders in a circle
  - Your units on the near side (green)
  - Enemy units on the far side (red)

### Step 4: Test Camera Controls
- **Rotate**: Click and drag with left mouse button
- **Pan**: Click and drag with right mouse button
- **Zoom**: Scroll mouse wheel
- Camera bounces to prevent going below ground

### Step 5: Interact with PoCs
- **Hover**: PoC glows brighter
- **Click**: Assault the PoC
  - Watch progress ring grow
  - After 4 successful assaults (100% progress), PoC turns green
  - Check combat log for action confirmation

### Step 6: Monitor Battle
- Watch timer count down in header (top right)
- Check squad health on right panel
- View combat log at bottom
- Battle ends when:
  - You control >50% of PoCs → Victory
  - Timer reaches 0 without majority → Defeat
  - Squad HP reaches 0 → Defeat
  - You click RETREAT → Defeat

## Troubleshooting

### 3D View Doesn't Appear
- Check browser console (F12) for errors
- Verify JavaScript is enabled
- Try refreshing the page
- Check that battle has transitioned to "active" state

### Camera Won't Respond
- Make sure you're not hovering over other UI elements
- Try adjusting mouse sensitivity
- Verify no other mouse event handlers are interfering

### PoCs Won't Respond to Clicks
- Ensure you're clicking directly on the cylinder
- Check that battle status is "active" (not deploying)
- Verify assaults are logged in combat log
- Check that PoC progress ring increases

### Performance Issues
- Close other browser tabs
- Disable background apps
- Try refreshing the page
- Check that GPU driver is up to date

## Feature Checklist

### What's Implemented ✅
- [x] 3D viewport with grid and boundaries
- [x] PoC visualization with circular layout
- [x] Unit rendering with faction colors
- [x] Camera controls (rotate, pan, zoom)
- [x] PoC interaction with assault
- [x] Hover effects and visual feedback
- [x] Animation system (bobbing, pulsing)
- [x] Integration with battle system
- [x] Victory/defeat detection
- [x] Combat logging

### Coming Soon 🚀
- [ ] Unit movement commands
- [ ] Combat animations
- [ ] Projectile effects
- [ ] Fog of war
- [ ] Advanced UI overlays
- [ ] Minimap
- [ ] Sound effects

## Camera Tips

1. **Explore the Battlefield**:
   - Start with default view
   - Rotate to see PoCs from different angles
   - Zoom in on units to see details

2. **Optimal Battle Viewing**:
   - Zoom out to see entire battlefield
   - Rotate to face direction of engagement
   - Pan to center on specific PoCs

3. **Advanced Control**:
   - Use combination of rotate + zoom to follow action
   - Pan when you need to see off-screen areas
   - Reset view by refreshing page

## Controls Reference

| Action | Control |
|--------|---------|
| Rotate Camera | Left-click + Drag |
| Pan Camera | Right-click + Drag |
| Zoom In/Out | Scroll Wheel |
| Assault PoC | Click on PoC cylinder |
| Select Unit | Click on unit (hover to highlight) |
| Retreat | Click RETREAT button |
| Begin Battle | Click BEGIN BATTLE button |

## Performance Notes

- Smooth 60 FPS on modern hardware
- Slight slowdown with many units (>20)
- Shadows are enabled (can be disabled if needed)
- No LOD system yet (future optimization)

## File Locations

- Main 3D Component: `src/components/game/Battle3DView.jsx`
- 3D Scene: `src/components/game/battle3d/`
- Battle Hook: `src/hooks/useBattle.js`
- BattleSimulator (modified): `src/components/game/BattleSimulator.jsx`

## Common Questions

**Q: Can I move units?**
A: Not yet. This is planned for Phase 2. Currently units are stationary.

**Q: Can units attack each other?**
A: Not yet. Combat is planned for Phase 3.

**Q: Why can't I see enemy units moving?**
A: Enemy units are placeholders in this prototype. Full AI is planned later.

**Q: Is there fog of war?**
A: Not in the prototype. This is planned for Phase 4.

**Q: Can I rotate the camera past 180 degrees?**
A: No, there are constraints to prevent disorienting views.

**Q: Why does my computer slow down?**
A: 3D rendering uses more GPU than 2D UI. Close other apps and check GPU drivers.

## Next Steps

1. **Test the prototype** with the steps above
2. **Report issues** to help identify bugs
3. **Provide feedback** on camera controls and UI layout
4. **Suggest features** for future phases

## Support

If you encounter issues:
1. Check the TEST_PLAN_3D_RTS.md for detailed test cases
2. Review IMPLEMENTATION_SUMMARY.md for architecture details
3. Check browser console for error messages
4. Verify all files are in place: `src/components/game/battle3d/`

---

Happy battling! 🎮
