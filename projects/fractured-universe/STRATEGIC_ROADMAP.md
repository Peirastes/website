# Fractured Universe: Strategic Roadmap

**Document Date:** January 27, 2026
**Status:** Post-Analysis Planning

---

## Executive Summary

The Fractured Universe project has **structural foundation** but is missing the **gameplay core** of Shattered Galaxy. The immediate priority is not to polish what exists, but to decide: commit to building the real game, or ship a different experience.

Current state:
- ✓ 88-sector map exists but is cosmetic
- ✓ Squad management system exists but units have no depth
- ✓ Battle UI exists but is card-game-like (not RTS)
- ✗ 3D battlefield exists but is non-interactive
- ✗ No real-time unit control
- ✗ No meaningful progression systems
- ✗ No multiplayer backbone

---

## The Fork in the Road

### Path A: Full Shattered Galaxy Recreation
**Commitment:** Implement the complete original game with modern tech
- Real-time RTS squad control
- Full unit customization and progression
- Multiplayer faction warfare
- Persistent world economics
- Reincarnation and endgame systems

**Effort:** Significant (4-8 weeks for core features)
**Outcome:** Full-featured MMORTS spiritual successor
**Risk:** High complexity, but proven gameplay model

### Path B: Simplified Tactical Battles
**Commitment:** Keep current structure but add core interactivity
- Remove 3D, implement 2D tactical positioning
- Keep simple squad vs squad battles
- Local/offline only, no multiplayer
- Focus on unit positioning and basic tactics
- Skip customization depth, stick with 16 preset units

**Effort:** Moderate (2-3 weeks)
**Outcome:** Playable tactical battle game, not full MMO
**Risk:** Less ambitious, but achievable and polished

### Path C: "Smart" UI-Based Strategy Game
**Commitment:** Embrace the card-game approach
- Turn-based or partially real-time decisions
- Focus on squad composition and loadout variety
- 1v1 battles or tournament system
- Keep UI-based battle controls
- Add cosmetics, progression, social features

**Effort:** Low-Moderate (2-3 weeks)
- Remove 3D system
- Enhance UI buttons with more tactical depth
- Add cosmetics and progression

**Outcome:** Mobile-friendly strategy game
**Risk:** Diverges significantly from Shattered Galaxy

---

## What Needs to Happen First (All Paths)

### 1. **IMMEDIATE: Decide on Battle System** (Decision, not code)

The current situation is untenable: the 3D system is broken and the UI system is too simple. Pick one:

**Option A1: Fix 3D and Make Real-Time**
- Weeks 1-2: Implement raycasting and unit positioning
- Weeks 3-4: Add unit movement and tactical depth
- Weeks 5-6: Combat animations and feedback
- Outcome: Real RTS experience matching Shattered Galaxy

**Option A2: Remove 3D, Build 2D Tactical**
- Week 1: Remove 3D components
- Week 2: Implement 2D canvas with grid-based positioning
- Week 3: Unit movement and positioning logic
- Outcome: Cleaner implementation, easier to develop

**Option B: Lean Into UI, Remove 3D**
- Week 1: Remove 3D completely
- Week 2-3: Enhance UI buttons with sub-options
- Outcome: Faster to launch, less ambitious scope

### 2. **PARALLEL: Unit System Overhaul**

Current: 16 preset units, no progression
Needed: Customizable units with meaningful progression

**Week 1-2 Tasks:**
- Expand unit types from 16 to 30+
- Add unit customization (weapons, armor, configs)
- Implement unit experience and evolution
- Create unit upgrade trees

**Why this matters:**
- Original game had 50+ chassis types
- Customization was core to strategy
- Unit progression creates player investment
- Currently missing critical depth

### 3. **PARALLEL: Character Stat Impact**

Current: 4 stats, limited effect (Tactics only)
Needed: All 4 stats meaningfully impact gameplay

**Tasks:**
- **Tactics** → Squad capacity (ALREADY DONE)
- **Clout** → Unit upgrade access speed, faction reputation
- **Education** → Better unit equipment options, research discounts
- **Mechanical Aptitude** → Unit weight capacity, repair/recovery bonuses

**Why this matters:**
- Creates meaningful choice in character builds
- Affects squad composition strategy
- Differentiates playstyles
- Players feel their stat choices matter

### 4. **AFTER CORE IS FIXED: Unit Progression**

Add a progression system for individual units:
- Units gain XP from battles
- Units level up and unlock abilities
- Units evolve into stronger variants
- Players can reset units for resources
- Creates long-term goals

---

## Detailed Roadmap by Path

---

## PATH A: Full Shattered Galaxy Recreation (RECOMMENDED)

### Phase 1: Battle System Reconstruction (Weeks 1-2)

**1.1 Choose 3D vs 2D (Day 1)**
- Recommendation: 2D first (easier), add 3D later as visualization

**1.2 Implement Real-Time Battle Loop (Days 2-5)**
```
Current loop:
1. Click "Assault PoC" button
2. Random number roll
3. Unit health -5
4. Repeat

New loop:
1. Player commands unit to move to PoC
2. Unit walks across battlefield (1-3 seconds)
3. Unit automatically attacks when in range
4. PoC captures as player units stay on it
5. Enemy units intercept and block
6. Player repositions squad to defend/capture
7. Battle ends when timer runs out or one side defeated
```

**1.3 2D Tactical Canvas (Days 6-10)**
- Implement grid-based 2D battlefield
- Units render as sprites/simple shapes
- PoCs render as large circles
- Drag-to-command unit movement
- Show ranges and attack radiuses
- Real-time collision and positioning

**1.4 Unit AI and Pathfinding (Days 11-14)**
- Implement enemy unit movement AI
- Basic pathfinding (avoid obstacles, other units)
- Enemy targeting logic (priority selection)
- Squad tactics (focus fire, positioning)

**Deliverable:** A playable real-time battle system where the player issues movement commands and engages the enemy

---

### Phase 2: Unit System Expansion (Weeks 3-4)

**2.1 Unit Database (Days 1-3)**
- Expand from 16 to 30 unit types
- Define 4-5 variants per division
- Add unit stats (speed, armor, damage, range)
- Create unit evolution chains

**2.2 Customization System (Days 4-7)**
- Weapon selection (5-8 options per unit)
- Armor selection (3-4 levels)
- Equipment slots (sensor, power, special)
- Weight/capacity constraints

**2.3 Unit Progression (Days 8-10)**
- Unit XP system per unit class
- Level-up unlocks better configs
- Elite variants of units
- Persistence of unit experience

**Deliverable:** Players can customize units deeply and build varied squads

---

### Phase 3: Character Progression (Weeks 5-6)

**3.1 Stat Impact System (Days 1-3)**
- Tactics → Squad size + unit capacity
- Clout → Faction favor, unit unlock speed
- Education → Equipment options, research bonuses
- Mech Aptitude → Weight limits, repair bonuses

**3.2 Skill Trees (Days 4-7)**
- Infantry specialization path
- Mobile specialization path
- Aviation specialization path
- Organic specialization path
- 3-5 levels per path with meaningful bonuses

**3.3 Reincarnation/Reset System (Days 8-10)**
- Level cap at 50
- Reincarnation resets to level 1
- Keeps permanent stat bonuses
- Unlocks new unit slots each cycle

**Deliverable:** Character progression feels meaningful and impacts squad building

---

### Phase 4: Multiplayer Backbone (Weeks 7-8)

**4.1 Backend Architecture (Days 1-3)**
- WebSocket server setup
- Battle room creation
- Player matchmaking queue
- Real-time battle state sync

**4.2 Persistent World (Days 4-7)**
- Sector ownership persistence
- Territory control mechanics
- Faction war status
- Leaderboards and rankings

**4.3 Clan System (Days 8-10)**
- Create/join clans
- Clan roster and ranks
- War declarations
- Territory conquest

**Deliverable:** Players can battle each other in persistent faction warfare

---

### Phase 5: Polish & Content (Weeks 9+)

**5.1 Battle Animations**
- Unit movement animations
- Attack animations
- Damage feedback
- Victory/defeat cinematics

**5.2 Content Creation**
- 20+ unit types with unique models
- 10+ weapon types with distinct visuals
- Sound effects and music
- Visual effects for abilities

**5.3 Balance & Tuning**
- Unit balance pass
- Faction balance
- Economy balance
- PvP ladder refinement

---

## PATH B: Simplified Tactical Battles

### Phase 1: Foundation (Weeks 1-2)

**Week 1: Remove 3D, Implement 2D**
- Delete `/battle3d/` directory
- Implement 2D canvas tactical view
- Drag-to-move units
- Click-to-attack enemies
- PoCs highlight when captured

**Week 2: Unit Positioning & AI**
- Enemy AI moves toward objectives
- Basic combat resolution
- Health tracking per unit
- Battle resolution at timer end

**Deliverable:** Playable tactical battles with positioning

---

### Phase 2: Unit Depth (Weeks 3-4)

**Week 3: Unit Variety**
- Expand units to 25-30 types
- Each unit has unique stats and role
- Balance unit matchups
- Players experiment with compositions

**Week 4: Progression**
- Unit experience system
- Level-up unlocks cosmetics
- Clan cosmetics
- Leaderboard cosmetics

**Deliverable:** Unit variety and progression systems

---

### Phase 3: Polish (Week 5+)

- UI improvements
- Sound effects
- Visual effects
- Balance tweaks

---

## PATH C: Smart UI Strategy Game

### Phase 1: Enhanced UI (Weeks 1-2)

**Week 1: Remove 3D**
- Delete `/battle3d/`
- Redesign battle UI with more buttons
- Pre-battle: squad positioning setup
- Battle: tactical ability selection each turn

**Week 2: Depth via UI**
- Unit special abilities
- Squad formations (defensive, aggressive, balanced)
- Spell/power system
- Resource management per turn

**Deliverable:** More strategic depth via turn-based buttons

---

### Phase 2: Progression Systems (Weeks 3-4)

- Cosmetics unlocks
- Battle pass
- Season rankings
- Achievement system

---

---

## CRITICAL DECISION: Which Path?

### Recommendation: **PATH A (Full Game)** with **2D Tactical First**

**Why:**
1. **It's what Shattered Galaxy was** - Proven gameplay loop
2. **Most interesting to play** - Real-time strategy is engaging
3. **Most scalable** - Can grow to multiplayer later
4. **Most rewarding** - Actual spiritual successor

**Implementation approach:**
1. Commit to 2D tactical view (easier than 3D)
2. Build real-time battle system
3. Expand unit customization
4. Add character progression depth
5. Implement multiplayer when core is solid

**Timeline:** 8-10 weeks for core playable game

---

## What NOT to Do

❌ **Don't keep the 3D broken** - It's worse than not having it
❌ **Don't try to fix 3D and simplify battles** - Wasted effort on complex system for simple gameplay
❌ **Don't launch with card-game battles** - Not what players expect from "Shattered Galaxy successor"
❌ **Don't postpone unit system overhaul** - It's core to strategy, not optional
❌ **Don't implement multiplayer without solid single-player** - Multiplayer reveals game design flaws quickly

---

## Success Criteria by Path

### Path A Success:
- [ ] Player can position units on 2D battlefield
- [ ] Units move and attack in real-time
- [ ] Battles are tactically interesting (not just button mashing)
- [ ] Unit customization affects squad composition choices
- [ ] Players have long-term progression goals
- [ ] 2+ players can battle simultaneously
- [ ] No game balance exploits

### Path B Success:
- [ ] 2D tactical positioning works smoothly
- [ ] Battles complete in 10-15 minutes
- [ ] Each unit type feels unique
- [ ] Player can be #1 on global leaderboard
- [ ] Game is fun for 5-10 matches before repetitive

### Path C Success:
- [ ] UI looks polished and professional
- [ ] Battle decisions matter (not random)
- [ ] Progression is clear and satisfying
- [ ] Game works great on mobile
- [ ] Can be played in 5-minute sessions

---

## Next Action Items

**TODAY:**
- [ ] Choose which path above (A, B, or C)
- [ ] If A or B: decide 3D vs 2D
- [ ] Create issues/PRs for chosen path

**THIS WEEK:**
- [ ] Start Phase 1 of chosen path
- [ ] Delete 3D components if path doesn't include them
- [ ] Set up development branches

**ONGOING:**
- [ ] Weekly progress check-ins
- [ ] Playtesting as features complete
- [ ] Balance adjustments based on feedback

---

## Conclusion

Fractured Universe has solid groundwork but needs **clear direction and focused execution**. The 3D battlefield should be either fixed completely or removed. The battle system should match an intentional design goal, not be a compromise between multiple ideas.

Once you decide which game you want to build, the implementation becomes straightforward. The hard part is the decision, not the code.

**Next step: Pick your path.**
