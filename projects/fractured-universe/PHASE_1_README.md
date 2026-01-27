# Phase 1: Battle System Reconstruction - START HERE

**Status:** Ready to begin
**Timeline:** 2 weeks (14 days)
**Goal:** Replace broken 3D system with functional 2D real-time tactical battles

---

## What You've Committed To

✓ **Path A: Full Shattered Galaxy Recreation**
- Building real game, not prototype
- Real-time squad positioning and control
- Enemy AI that adapts and attacks
- Unit damage, death, and combat
- PoC capture mechanics
- Clear victory/defeat conditions

**This is a real game system, not polish on existing code.**

---

## Current Status

**What's Broken:**
- 3D battlefield is non-interactive (rendering only)
- Battle system is card-game-like (click button, roll RNG)
- No unit movement or positioning possible
- No meaningful gameplay depth

**What Exists & Works:**
- Map system (88 sectors) ✓
- Squad management UI ✓
- Character progression UI ✓
- Notification system ✓
- Data structures for battle ✓
- Hook architecture ✓

**What Gets Built in Phase 1:**
- 2D tactical viewport with canvas rendering
- Real-time unit movement
- PoC capture system
- Enemy AI
- Combat and damage
- Integration into existing UI

---

## Documents You Have

1. **SHATTERED_GALAXY_COMPARISON.md** - What the original game had vs what you have
2. **3D_BATTLEFIELD_DIAGNOSTIC.md** - Technical analysis of why 3D doesn't work
3. **STRATEGIC_ROADMAP.md** - Overview of all 3 possible paths (you chose A)
4. **PHASE_1_IMPLEMENTATION.md** - Day-by-day breakdown of Phase 1 work
5. **PHASE_1_DECISIONS.md** - Critical design decisions to make before starting
6. **PHASE_1_README.md** - This file

**Total documentation:** ~40 pages of planning

---

## Before You Start: 3 Steps

### Step 1: Make Design Decisions
- Open **PHASE_1_DECISIONS.md**
- Answer 8 questions about game design
- Default to "Option A" if unsure
- Record your answers

### Step 2: Review The Plan
- Read **PHASE_1_IMPLEMENTATION.md**
- Understand what each day accomplishes
- Identify any questions or concerns
- Ask before starting if anything is unclear

### Step 3: Confirm Readiness
- Make sure you understand what Phase 1 entails
- Confirm you're ready for 2 weeks of focused development
- Let me know and we start Day 1

---

## What Phase 1 Produces

**At the end of 2 weeks, you'll have:**

✓ A playable 2D battlefield where you position units
✓ Enemy units that move and attack autonomously
✓ PoC capture mechanics that work tactically
✓ Unit combat with health/damage/death
✓ Clear win/loss conditions
✓ A game that feels like tactical strategy, not RNG simulator

**You'll be able to:**
- Play full 15-minute battles
- Position units strategically to win
- Feel your decisions matter
- Experience what Shattered Galaxy felt like

**You won't have yet:**
- Unit customization (Phase 2)
- Character progression depth (Phase 3)
- Multiplayer (Phase 4)
- Endgame systems (Phase 5)

---

## Time Estimate

**Total effort:** ~40 hours of focused coding
**Best schedule:**
- Full-time: 2 weeks consecutive
- Part-time: 4 weeks at 20 hrs/week
- Flexible: Whatever fits your schedule

**Breakdown:**
- Day 1: 3 hours (cleanup)
- Days 2-14: 3-5 hours each
- Average: 3 hours/day

---

## Dependencies & Setup

**Required:**
- Node.js and npm installed
- Text editor (VS Code recommended)
- Git for version control
- Understanding of React hooks

**What you already have:**
- Project structure
- Build system (Vite)
- Component framework
- UI component library
- Data structures

**What you're removing:**
- Three.js (entire 3D library)
- @react-three/fiber
- @react-three/drei
- @react-three/postprocessing

**What you're adding:**
- HTML5 Canvas (built-in, no install needed)
- requestAnimationFrame (built-in)
- Basic 2D geometry calculations (no library needed)

---

## Success Definition

Phase 1 is **DONE** when:

**Playability:**
- [ ] Can play a full 15-minute battle
- [ ] Battle ends with win or loss
- [ ] Doesn't crash or hang

**Core Mechanics:**
- [ ] Units move when you drag them
- [ ] Units deal damage to each other
- [ ] PoCs capture when you hold them
- [ ] Victory triggers at >50% PoCs
- [ ] Defeat triggers when squad dies or timer ends

**Quality:**
- [ ] No visual glitches
- [ ] UI responsive (no lag)
- [ ] Information clear and visible
- [ ] Matches Shattered Galaxy's feel

**You'll know it's done when you play a battle and think: "This feels like a real RTS, not a simulator."**

---

## Expected Challenges

**Things that might be tricky:**

1. **Canvas rendering loop** - Getting 60 FPS with smooth animation
   - *Solution:* Use requestAnimationFrame, batch draw calls

2. **Mouse coordinate mapping** - Canvas has its own coordinate system
   - *Solution:* Use getBoundingClientRect() to map click positions

3. **Unit collision detection** - Many units, many checks per frame
   - *Solution:* Only check nearby units (spatial hashing if needed later)

4. **AI pathfinding** - Enemy units choosing targets and moving
   - *Solution:* Start simple (move toward closest enemy PoC), improve later

5. **Simultaneous animations** - Units moving at different speeds
   - *Solution:* Use deltaTime (elapsed time) for frame-rate-independent movement

**None of these are blockers. They're standard game dev problems with standard solutions.**

---

## How to Get Help

**During Phase 1, if you get stuck:**

1. **Check existing code** - Similar patterns likely exist elsewhere
2. **Console.log debugging** - Log unit positions, distances, state
3. **Break down the problem** - "Why isn't capture working?" → test each step
4. **Ask me** - I'm here to unblock you, not judge the questions

**Common issues I can help with:**
- "The canvas isn't rendering" → Debug render pipeline
- "Units aren't moving" → Check deltaTime and position updates
- "Collisions feel wrong" → Review collision calculation
- "Performance is choppy" → Profile and optimize render calls
- "Design decisions unclear" → Back to PHASE_1_DECISIONS.md

---

## Development Tips

**While building:**

- **Test incrementally** - After each sub-task, test that it works
- **One thing at a time** - Don't try to build combat and AI simultaneously
- **Separate concerns** - Keep rendering logic separate from game logic
- **Use console.log** - Log unit positions, collision results, AI decisions
- **Commit frequently** - Save working versions as you go
- **Don't over-engineer** - Simple 2D math is fine, don't build game engines

---

## Architecture Overview

```
BattleSimulator (existing component)
├─ BattleViewport (NEW, 2D canvas)
│  ├─ Canvas element (1200x700)
│  ├─ Draw loop (60 FPS)
│  ├─ Input handling (drag, click)
│  └─ Render pipeline
│
├─ Rendering (utility functions)
│  ├─ drawGrid()
│  ├─ drawPoC()
│  ├─ drawUnit()
│  ├─ drawHealthBar()
│  └─ drawHUD()
│
├─ Input handling (utility functions)
│  ├─ isClickOnUnit()
│  ├─ mapCanvasCoordinates()
│  └─ trackDragState()
│
├─ Game logic (in useBattle hook)
│  ├─ Unit positioning
│  ├─ PoC capture
│  ├─ Damage calculation
│  ├─ Enemy AI
│  └─ Victory/defeat checks
│
└─ Info panel (existing or modified)
   ├─ Timer display
   ├─ Score display
   ├─ Squad health
   └─ Retreat button
```

---

## Files You'll Create

```
src/
├─ components/game/
│  ├─ BattleViewport.jsx (NEW, 400 lines)
│  ├─ BattleSimulator.jsx (MODIFY)
│  └─ battle3d/ (DELETE ENTIRE)
│
└─ utils/
   ├─ battleRenderer.js (NEW, 300 lines)
   ├─ inputHandler.js (NEW, 150 lines)
   ├─ collisionDetection.js (NEW, 100 lines)
   ├─ pocMechanics.js (NEW, 200 lines)
   └─ enemyAI.js (NEW, 250 lines)
```

**Total new code:** ~1,400 lines
**Code to delete:** ~500 lines (3D system)
**Code to modify:** ~200 lines (BattleSimulator, hooks)

---

## Communication Expectations

**I'll be available to:**
- Answer design questions
- Help debug rendering issues
- Review code structure
- Suggest optimizations
- Discuss gameplay feel

**What I need from you:**
- Confirmation you've read the documents
- Your design decisions from PHASE_1_DECISIONS.md
- Status updates as you complete sections
- Questions when stuck (don't guess, ask)
- Honest feedback on how gameplay feels

---

## Ready?

**Before we start, confirm:**

- [ ] I've read PHASE_1_DECISIONS.md
- [ ] I've answered all 8 design questions
- [ ] I've read PHASE_1_IMPLEMENTATION.md
- [ ] I understand the scope and timeline
- [ ] I'm ready to commit 2 weeks (or equivalent part-time)
- [ ] I know how to ask for help when stuck

**Once confirmed, we start with Day 1: Cleanup**

---

## Next Actions

### Right Now:
1. Open **PHASE_1_DECISIONS.md**
2. Read through all 8 decisions
3. Answer each one (use defaults if unsure)
4. Reply with your answers

### Once Confirmed:
1. Open **PHASE_1_IMPLEMENTATION.md**
2. Review the Day 1 tasks
3. Start the cleanup process
4. Begin building the 2D system

### Timeline:
```
Today: Decisions
Tomorrow: Start Day 1 cleanup
Next 2 weeks: Build Phase 1
End of Phase 1: Have a playable game
```

---

## Final Thoughts

This is **real work**, not polish. You're building the core gameplay loop that defines the entire game. Get this right, and everything else builds on solid foundation. Get this wrong, and you'll be fighting core design issues later.

**But it's doable.** 40 hours of focused work. Proven game mechanics. Clear roadmap.

You've got this.

**Now go read PHASE_1_DECISIONS.md and tell me your answers.**
