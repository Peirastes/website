# Fractured Universe vs. Shattered Galaxy: Feature Comparison Review

**Document Date:** January 27, 2026
**Purpose:** Analyze the gap between the original Shattered Galaxy (2001) gameplay and current Fractured Universe implementation

---

## Executive Summary

Shattered Galaxy was a pioneering MMORTS (2001) that focused on **real-time squad micromanagement** and **frenetic combat action**. The current Fractured Universe implementation captures the structural elements (map, divisions, stats, PoCs) but is missing the **core real-time combat experience** that defined the original game. The 3D battlefield system is non-functional, and the battle system is currently a static UI-based card game rather than real-time tactical combat.

---

## SHATTERED GALAXY: Core Gameplay Features

### 1. Real-Time Squad Combat
- **Squad Control**: Players directly command 6-12 units in real-time
- **Frenetic Action**: Combat-oriented, fast-paced micromanagement
- **Unit Positioning**: Players control unit placement and movement during battles
- **Direct Engagement**: Players position units strategically on the battlefield
- **PoC Capture Mechanics**: ~30 seconds to capture/recapture each PoC
- **Battle Timer**: 20-minute matches for victory
- **Tactical Depth**: Weapon restrictions (air units vs ground units) create strategic layers

### 2. Unit System & Customization
- **50+ Chassis Types**: Extensive unit variety compared to preset units
- **Deep Customization**:
  - Weapons (multiple options per unit)
  - Armor types
  - Power sources
  - AI settings
  - Sensors
  - Equipment
  - All constrained by weight capacity and tech level
- **Unit Evolution**: Units gain experience and unlock specialized evolutions
- **4 Divisions**: Infantry, Mobile, Aviation, Organic

### 3. Character Progression
- **Hero Attributes**: 4 stats (Tactics, Clout, Education, Mechanical Aptitude)
- **Stat Effects**:
  - Tactics → Troop deployment capacity
  - Clout → Chassis access speed
  - Education → Equipment availability
  - Mechanical Aptitude → Weight bonuses
- **Reincarnation System**: Level 50 characters could reset to Level 1, earning permanent stat bonuses and unit slots
- **Persistent Progression**: Monthly/seasonal resets with bonuses

### 4. Multiplayer & Social
- **Large-Scale Battles**: Up to 50+ players with 500+ units total on a single map
- **Team Coordination**: Squad leaders coordinate multiple fire teams
- **Faction Warfare**: Persistent conflict across 88-sector map
- **PvE Content**: Cave battles against aliens alongside PvP
- **Persistent World**: Territory control and faction dominance

### 5. Unique Mechanics
- **"Control war robots with their minds"**: Immersive real-time command experience
- **Combat Currency**: Frenetic final-minute PoC captures create dramatic moments
- **Weapon Balance**: Air vs. ground weapon distinctions create tactical layers
- **Economic Depth**: Implied resource management for customization and progression

---

## FRACTURED UNIVERSE: Current Implementation

### 1. Squad Management ✓ (Structural Only)
- **Squad Loadouts**: 3 presets (Alpha, Beta, Gamma) implemented
- **Unit Recruitment**: Shop interface works, division filters work
- **Capacity System**: 6 + floor(tactics/2), max 12 units
- **Missing**: No unit movement, positioning, or real-time combat
- **Current Battle System**: Static UI-based card game with buttons
  - Click assault button to attack
  - Timer counts down
  - Enemy has fixed 30% counter-assault chance
  - No positioning, movement, or tactical depth

### 2. Unit System ✗ (Incomplete)
- **16 Unit Types**: 4 per division (much less than 50+ types)
- **No Customization**: Units are pre-made, no weapons/armor selection
- **No Unit Evolution**: No experience or progression for individual units
- **Basic Stats**: Fixed unit stats, no dynamic growth
- **Missing Weapon System**: No air vs. ground distinctions or tactical weapon choices

### 3. Character Progression ✓ (Partial)
- **4 Stats Implemented**: Tactics, Clout, Education, Mech Aptitude
- **Stat Allocation**: Players can add points, but...
- **Limited Impact**: Only Tactics affects squad capacity; other stat effects unclear
- **No Reincarnation System**: No endgame progression mechanism
- **XP System**: Exists but progression feels disconnected from gameplay

### 4. Multiplayer & Social ✗ (Not Implemented)
- **No Multiplayer**: Single-player only
- **Clan System**: UI exists but non-functional (mock data only)
- **No PvE**: No alien encounters or alternative content
- **No Persistent Warfare**: Map control is cosmetic
- **No Real Battles**: Players fight mock AI, not other players

### 5. Map & Sectors ✓ (Structural)
- **88 Sectors**: Implemented and procedurally generated
- **Faction Colors**: Visual representation works
- **Map Navigation**: Works as intended
- **Missing Strategic Value**: Sectors don't meaningfully affect gameplay; no supply lines or logistics

---

## THE CRITICAL GAP: Real-Time Combat

### What Shattered Galaxy Had
The original game's core experience was **direct, real-time control of units on a tactical battlefield**:
- Player issues movement commands and watches units respond
- Enemy units react and create dynamic tactical situations
- Capturing PoCs requires positioning units optimally
- Quick reflexes and tactical thinking determine outcomes
- 20-minute matches create escalating tension (final-minute PoC captures)

### What Fractured Universe Currently Has
A **static battle interface** that simulates combat narratively:
- Click "Assault" button → roll chance → unit health decreases
- Click "Counter-Assert" to defend PoCs
- Fixed 30% enemy counter-assault rate
- No unit positioning or movement
- No tactical decisions once battle starts
- 15-minute countdown is window dressing

### The 3D Battlefield Problem
The exploration agent reported the 3D battlefield as "working," but you indicated it **does not actually function**. This represents:
- **Unfinished Implementation**: 3D components exist but don't integrate with battle logic
- **Read-Only Visualization**: PoCs render but aren't interactive
- **No Unit Control**: Can't command units in 3D space
- **Breaks the Game Loop**: Players can't see what they're doing in battle
- **False Completion**: The visual infrastructure exists but the game-critical functionality doesn't

---

## FEATURE COMPARISON TABLE

| Feature | Shattered Galaxy | Fractured Universe | Status |
|---------|------------------|-------------------|--------|
| Real-time squad combat | ✓ Full | ✗ None | **Critical Gap** |
| Unit positioning/movement | ✓ Full | ✗ None | **Critical Gap** |
| Tactical PoC capture | ✓ 30s captures | ✓ UI button-based | **Simplified** |
| 50+ unit types | ✓ Yes | ✗ 16 total | **Incomplete** |
| Unit customization | ✓ Extensive | ✗ None | **Missing** |
| Unit evolution/XP | ✓ Yes | ✗ No | **Missing** |
| 4 Character attributes | ✓ Full impact | ✓ Limited impact | **Partial** |
| Reincarnation/endgame | ✓ Yes | ✗ No | **Missing** |
| Persistent warfare | ✓ 88 sectors PvP | ✗ 88 sectors cosmetic | **Non-functional** |
| Faction PvP battles | ✓ 50+ players | ✗ Single player | **Not Implemented** |
| PvE alien encounters | ✓ Yes | ✗ No | **Missing** |
| Large squad coordination | ✓ Yes | ✗ No | **Not Implemented** |
| 3D battlefield | ✗ No (2001 tech) | ✓ Attempted, broken | **Non-functional** |
| 88 Sectors | ✓ Yes | ✓ Yes | **✓ Match** |
| 4 Divisions | ✓ Yes | ✓ Yes | **✓ Match** |

---

## Root Cause Analysis: Why Fractured Universe Feels Incomplete

### 1. **Battle System Wrong Type**
The current turn-based card-game approach (click buttons, roll chances) is fundamentally different from Shattered Galaxy's real-time RTS experience. It needs:
- Real-time unit positioning/movement
- Player-issued commands during battle
- Interactive 3D or 2D tactical view
- Unit response to player actions (not predetermined rolls)

### 2. **3D Battlefield Never Finished**
The Three.js integration was added but:
- Doesn't connect to battle logic
- No interactivity (can't click units or PoCs)
- No unit control/movement commands
- Read-only visualization only
- Creates the illusion of progress while breaking core gameplay

### 3. **Missing Unit Depth**
Original had:
- 50+ customizable chassis types
- Weapon/armor/power combinations
- Unit experience and evolution
- Weight/tech constraints

Current has:
- 16 fixed unit types
- No customization
- No progression
- No tactical variety

### 4. **Multiplayer Never Started**
Without WebSocket/backend, the persistent faction warfare is impossible. Currently:
- Everything is single-player
- Clan system is mock data
- No other players exist
- Map control is meaningless

### 5. **Game Loop Broken by 3D**
The 3D visualization doesn't actually enable the core gameplay—it's a visual layer that doesn't connect:
- Can see units in 3D but can't command them
- Can see PoCs but can't interact with them
- Creates confusion about what the player should do
- Makes battles feel unresponsive

---

## PRIORITY ISSUES TO RESOLVE

### **CRITICAL - Blocks Core Gameplay:**
1. **Fix/Remove 3D Battlefield** - Either make it functional with full interactivity or remove it and use 2D tactical view
2. **Implement Real-Time Combat** - Replace card-game battle system with actual RTS-style unit control
3. **Add Unit Movement/Positioning** - Core mechanic from original that's completely missing
4. **Restore Unit-PoC Interaction** - Capturing PoCs should require positioning units at them

### **HIGH - Missing Core Features:**
5. **Expand Unit Types** - Increase from 16 to 30+ with customization options
6. **Add Unit Progression** - Individual unit XP and evolution system
7. **Character Stat Impact** - All 4 stats should have meaningful gameplay effects
8. **PvE Content** - Alien cave encounters for solo/team play

### **MEDIUM - Multiplayer Foundation:**
9. **Multiplayer Backend** - WebSocket server for real battles
10. **Functional Clan System** - Make it real, not mock data
11. **Persistent Territory Control** - Map control affects gameplay
12. **Player Ranking System** - Leaderboards and progression

### **POLISH:**
13. **Reincarnation Mechanic** - Endgame progression for max-level players
14. **Battle Animations** - Visual feedback for combat actions
15. **Mobile Optimization** - Responsive design

---

## CONCLUSION

The Fractured Universe project has solid structural foundations (map, divisions, stats, UI aesthetic) but is missing the **soul of Shattered Galaxy**: real-time tactical combat with unit positioning and player agency.

The 3D battlefield system, while impressive as a technical addition, has inadvertently made the game **less playable** by:
1. Breaking the battle interface without providing functional alternatives
2. Suggesting the game is "complete" when core mechanics are broken
3. Creating visual confusion about how to actually play

**Next steps should focus on:**
1. **Triage the 3D system** - Fix it or remove it completely
2. **Reimplement the battle core** - Go back to what works: real-time unit control on a tactical field
3. **Expand unit system** - Add depth through customization and progression
4. **Lay multiplayer groundwork** - Enable the persistent faction warfare that defined the original

The codebase is clean enough to support these changes. The architecture just needs refocus on core gameplay rather than polish.

---

## Sources

- [The Game Archaeologist: Shattered Galaxy - Massively Overpowered](https://massivelyop.com/2018/03/24/the-game-archaeologist-shattered-galaxy/)
- [Shattered Galaxy - Grokipedia](https://grokipedia.com/page/shattered_galaxy)
- [Shattered Galaxy Review - RPGFan](https://www.rpgfan.com/review/shattered-galaxy/)
- [Shattered Galaxy - TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/ShatteredGalaxy)
- [Shattered Galaxy - MMORPG.com](https://www.mmorpg.com/shattered-galaxy)
