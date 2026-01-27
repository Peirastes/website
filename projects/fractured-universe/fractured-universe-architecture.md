# FRACTURED UNIVERSE - Architecture & Implementation Guide

## Overview
A spiritual successor to Shattered Galaxy (2001 MMORTS). This document provides the complete architecture for building the game in manageable chunks.

---

## Project Structure

```
fractured-universe/
├── src/
│   ├── App.jsx                 # Main app, routing, global state
│   ├── index.css               # Global styles, CSS variables, animations
│   │
│   ├── data/
│   │   ├── factions.js         # 3 factions with colors, bonuses, lore
│   │   ├── divisions.js        # 4 divisions: Infantry, Mobile, Aviation, Organic
│   │   ├── stats.js            # 4 stats: Tactics, Clout, Education, Mech Aptitude
│   │   ├── units.js            # 16+ unit chassis across divisions (4 tiers each)
│   │   └── sectors.js          # 88 sector generation, names, properties
│   │
│   ├── hooks/
│   │   ├── useGameState.js     # Main game state management
│   │   ├── usePlayer.js        # Player data, stats, progression
│   │   ├── useBattle.js        # Battle state, timers, PoC capture
│   │   └── useNotifications.js # Toast notification system
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── HoloPanel.jsx   # Styled container with glow effects
│   │   │   ├── Button.jsx      # Styled buttons (primary/danger/secondary/warning)
│   │   │   ├── ProgressBar.jsx # XP bars, health bars, capture progress
│   │   │   ├── GlitchText.jsx  # Animated glitch text effect
│   │   │   └── CRTOverlay.jsx  # Scanline overlay effect
│   │   │
│   │   ├── screens/
│   │   │   ├── TitleScreen.jsx       # Animated title, faction preview
│   │   │   ├── CharacterCreate.jsx   # 3-step wizard (faction, division, identity)
│   │   │   └── MainGame.jsx          # Tab-based main interface
│   │   │
│   │   ├── game/
│   │   │   ├── PlayerStatusBar.jsx   # Top bar: portrait, XP, resources
│   │   │   ├── WarMap.jsx            # SVG map with 88 interactive sectors
│   │   │   ├── SectorDetails.jsx     # Selected sector info, join battle
│   │   │   ├── ArmyLoadout.jsx       # 3 loadouts, unit recruitment, squad view
│   │   │   ├── CharacterStats.jsx    # Stat allocation, division levels
│   │   │   ├── ClanPanel.jsx         # Clan overview, members, wars
│   │   │   └── BattleSimulator.jsx   # Real-time battle with PoC capture
│   │   │
│   │   └── notifications/
│   │       └── NotificationSystem.jsx # Toast notifications
│   │
│   └── utils/
│       ├── sectorGenerator.js  # Generate 88 sectors with connections
│       └── battleLogic.js      # Combat calculations, PoC mechanics
│
└── package.json
```

---

## Data Structures

### 1. Factions (data/factions.js)
```javascript
export const FACTIONS = {
  CRIMSON_DOMINION: {
    id: 'crimson',
    name: 'Crimson Dominion',
    color: '#ff3b3b',
    bgColor: 'rgba(255, 59, 59, 0.15)',
    description: 'Military supremacy through strength and discipline',
    motto: 'Victory Through Power',
    bonus: { type: 'hp', value: 0.15 }, // +15% Unit HP
  },
  AZURE_COALITION: {
    id: 'azure',
    name: 'Azure Coalition',
    color: '#3b9fff',
    bgColor: 'rgba(59, 159, 255, 0.15)',
    description: 'Technological advancement and strategic superiority',
    motto: 'Knowledge Is Victory',
    bonus: { type: 'damage', value: 0.15 }, // +15% Damage
  },
  GOLDEN_SOVEREIGNTY: {
    id: 'golden',
    name: 'Golden Sovereignty',
    color: '#ffc93b',
    bgColor: 'rgba(255, 201, 59, 0.15)',
    description: 'Economic dominance and resource control',
    motto: 'Prosperity Conquers All',
    bonus: { type: 'resources', value: 0.15 }, // +15% Resources
  },
};
```

### 2. Units (data/units.js)
```javascript
// Each division has 4 tiers of units
// Structure: { id, name, division, tier, hp, damage, speed, cost, icon }

export const UNIT_CHASSIS = {
  // INFANTRY (ground troops)
  TROOPER:      { id: 'trooper', name: 'Trooper', division: 'infantry', tier: 1, hp: 100, damage: 15, speed: 2, cost: 50, icon: '🎖️' },
  HEAVY_GUNNER: { id: 'heavyGunner', name: 'Heavy Gunner', division: 'infantry', tier: 2, hp: 150, damage: 25, speed: 1, cost: 120, icon: '🔫' },
  COMMANDO:     { id: 'commando', name: 'Commando', division: 'infantry', tier: 3, hp: 120, damage: 35, speed: 3, cost: 200, icon: '🥷' },
  JUGGERNAUT:   { id: 'juggernaut', name: 'Juggernaut', division: 'infantry', tier: 4, hp: 300, damage: 20, speed: 1, cost: 350, icon: '🛡️' },

  // MOBILE (vehicles)
  SCOUT_BIKE:   { id: 'scoutBike', name: 'Scout Bike', division: 'mobile', tier: 1, hp: 60, damage: 10, speed: 5, cost: 40, icon: '🏍️' },
  LIGHT_TANK:   { id: 'lightTank', name: 'Light Tank', division: 'mobile', tier: 2, hp: 180, damage: 30, speed: 3, cost: 150, icon: '🛻' },
  BATTLE_TANK:  { id: 'battleTank', name: 'Battle Tank', division: 'mobile', tier: 3, hp: 280, damage: 45, speed: 2, cost: 280, icon: '🚛' },
  SIEGE_WALKER: { id: 'siegeWalker', name: 'Siege Walker', division: 'mobile', tier: 4, hp: 400, damage: 60, speed: 1, cost: 450, icon: '🤖' },

  // AVIATION (air units)
  DRONE:        { id: 'drone', name: 'Recon Drone', division: 'aviation', tier: 1, hp: 40, damage: 8, speed: 6, cost: 35, icon: '🛸' },
  INTERCEPTOR:  { id: 'interceptor', name: 'Interceptor', division: 'aviation', tier: 2, hp: 80, damage: 35, speed: 5, cost: 130, icon: '🛩️' },
  GUNSHIP:      { id: 'gunship', name: 'Gunship', division: 'aviation', tier: 3, hp: 150, damage: 50, speed: 3, cost: 260, icon: '🚁' },
  BOMBER:       { id: 'bomber', name: 'Bomber', division: 'aviation', tier: 4, hp: 200, damage: 80, speed: 2, cost: 400, icon: '✈️' },

  // ORGANIC (bio-units)
  SWARMLING:    { id: 'swarmling', name: 'Swarmling', division: 'organic', tier: 1, hp: 30, damage: 12, speed: 4, cost: 25, icon: '🐛' },
  STALKER:      { id: 'stalker', name: 'Stalker', division: 'organic', tier: 2, hp: 90, damage: 28, speed: 4, cost: 100, icon: '🦎' },
  RAVAGER:      { id: 'ravager', name: 'Ravager', division: 'organic', tier: 3, hp: 180, damage: 40, speed: 3, cost: 220, icon: '🦖' },
  LEVIATHAN:    { id: 'leviathan', name: 'Leviathan', division: 'organic', tier: 4, hp: 500, damage: 55, speed: 1, cost: 500, icon: '🐉' },
};
```

### 3. Player State Structure
```javascript
const playerState = {
  // Identity
  name: 'CommanderX',
  faction: FACTIONS.CRIMSON_DOMINION,
  appearance: { portrait: 0 }, // index into portrait array
  primaryDivision: 'infantry',

  // Progression
  level: 1,
  xp: 0,
  xpToNext: 1000,
  reincarnations: 0, // prestige system

  // Resources
  credits: 5000,
  resources: 1000,

  // Stats (allocate points on level up)
  stats: {
    tactics: 5,    // Unit capacity: 6 + floor(tactics/2), max 12
    clout: 5,      // Upgrade speed, capture effectiveness
    education: 5,  // Better weapons/equipment
    mechApt: 5,    // More weight capacity on units
  },
  statPoints: 10, // Unspent points

  // Division mastery (unlock higher tier units)
  divisionLevels: {
    infantry: 1,
    mobile: 1,
    aviation: 1,
    organic: 1,
  },

  // Army loadouts (3 presets, 6-12 units each)
  loadouts: [
    { id: 1, name: 'Alpha Squad', units: [] },
    { id: 2, name: 'Beta Squad', units: [] },
    { id: 3, name: 'Gamma Squad', units: [] },
  ],
  activeLoadout: 0,

  // Social
  clan: null, // { id, name, tag, rank }
};
```

### 4. Sector Structure
```javascript
const sector = {
  id: 0,
  name: 'Nova Prime',
  x: 15.5,  // Map position (0-100)
  y: 22.3,
  controlledBy: 'crimson', // faction id
  contested: false,        // battle in progress?
  isCapitol: false,        // capitol sectors can't be attacked
  pocCount: 5,             // Points of Contention (3-6)
  playersInBattle: 0,      // current player count
  resources: 500,          // reward value
};
```

### 5. Battle State
```javascript
const battleState = {
  sector: sector,
  loadout: loadout,
  status: 'deploying', // deploying | active | victory | defeat
  timer: 900,          // 15 minutes in seconds
  pocs: [
    { id: 1, name: 'Alpha', owner: 'enemy', progress: 0 },
    { id: 2, name: 'Beta', owner: 'neutral', progress: 0 },
    // ...
  ],
  combatLog: [],
  allies: [],  // other players on your team
  enemies: [], // opposing players
};
```

---

## Key Components Specification

### WarMap.jsx
- SVG-based map rendering 88 sectors
- Faction-colored nodes with animated borders for contested sectors
- Click to select, hover for tooltip
- Connection lines between adjacent sectors
- Legend showing faction control counts
- Zoom/pan controls (optional)

### ArmyLoadout.jsx
- 3 tab loadouts (Alpha, Beta, Gamma)
- Unit shop with division filter tabs
- Shows: unit icon, name, stats (HP/DMG/SPD), cost, tier requirement
- Current squad list with remove button
- Squad stats summary (total HP, total DMG, avg speed)
- Max units = 6 + floor(tactics/2), capped at 12

### BattleSimulator.jsx
- Header: sector name, score (your PoCs vs enemy), countdown timer
- Main area: Grid of PoC capture points (click to assault)
- Sidebar: Your squad units with health bars, combat log
- States: deploying → active → victory/defeat
- PoC capture: click increases progress by 25%, 100% = captured
- Win condition: capture majority of PoCs or timer expires with lead

### CharacterStats.jsx
- 4 stat cards with current value and +/- buttons
- Shows effect description for each stat
- Division levels grid (determines unit tier access)
- Stat points remaining indicator

---

## Styling Guidelines

### Color Palette
```css
:root {
  /* Backgrounds */
  --bg-dark: #050810;
  --bg-medium: #0a0f18;
  --bg-panel: rgba(10, 15, 20, 0.95);
  
  /* Faction colors */
  --crimson: #ff3b3b;
  --azure: #3b9fff;
  --golden: #ffc93b;
  
  /* UI accents */
  --accent-green: #00ff9f;
  --accent-red: #ff3b3b;
  --accent-blue: #3b9fff;
  --accent-yellow: #ffc93b;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #8899aa;
  --text-muted: #556677;
}
```

### Typography
- Primary font: 'Orbitron' (Google Fonts) - headers, UI
- Fallback: 'Courier New', monospace
- Use letter-spacing: 1-4px on headers
- All-caps for labels and small text

### Effects
- CRT scanlines overlay (CSS repeating-linear-gradient)
- Glow effects (box-shadow with faction colors)
- Glitch text animation (random skew + color shadow)
- Pulsing animations for contested sectors
- Grid background with subtle animation

---

## Implementation Order

### Phase 1: Foundation
1. Set up React project with Vite
2. Create data files (factions, divisions, stats, units)
3. Build UI components (HoloPanel, Button, ProgressBar)
4. Implement TitleScreen with animations

### Phase 2: Character System
5. Build CharacterCreate wizard (3 steps)
6. Implement usePlayer hook with state management
7. Create PlayerStatusBar component

### Phase 3: War Map
8. Build sector generator utility
9. Create WarMap SVG component
10. Add SectorDetails panel
11. Implement sector selection and tooltips

### Phase 4: Army System
12. Build ArmyLoadout component
13. Implement unit recruitment flow
14. Add loadout management (add/remove units)
15. Squad stats calculation

### Phase 5: Battle System
16. Create BattleSimulator component
17. Implement PoC capture mechanics
18. Add battle timer and win conditions
19. Combat log and results screen

### Phase 6: Social Features
20. Build ClanPanel component
21. Add mock clan data and member list
22. Implement clan wars display

### Phase 7: Polish
23. Add notification system
24. Implement sound effects (optional)
25. Add more animations and transitions
26. Performance optimization

---

## Prompts for Claude Code

Use these prompts to build each component:

### Prompt 1: Project Setup
```
Create a new React + Vite project called "fractured-universe". Set up the folder 
structure as outlined in the architecture doc. Install dependencies: 
react, react-dom. Add Google Font 'Orbitron' to index.html.
```

### Prompt 2: Data Layer
```
Create the data files for Fractured Universe:
- src/data/factions.js - 3 factions (Crimson, Azure, Golden) with colors, bonuses
- src/data/divisions.js - 4 divisions (Infantry, Mobile, Aviation, Organic)
- src/data/stats.js - 4 stats (Tactics, Clout, Education, Mech Aptitude)
- src/data/units.js - 16 unit chassis (4 per division, 4 tiers)
Use the exact structures from the architecture document.
```

### Prompt 3: UI Components
```
Create reusable UI components for Fractured Universe with a retro-futuristic 
military terminal aesthetic:
- HoloPanel: Container with gradient background, glowing border, top accent line
- Button: Styled button with variants (primary/danger/secondary/warning)
- ProgressBar: Animated bar with glow effect, optional label
- GlitchText: Text with random glitch animation effect
- CRTOverlay: Fixed overlay with scanline effect
Use the color palette from the architecture doc.
```

### Prompt 4: Title Screen
```
Create TitleScreen.jsx for Fractured Universe with:
- Animated grid background
- Floating particle effects in faction colors
- Large "SHATTERED" title with glitch effect
- "NEXUS" subtitle in blue
- Tagline about 3 factions and 88 sectors
- "INITIALIZE COMMAND" button
- Faction color indicators at bottom
Include all animations in the component.
```

### Prompt 5: Character Creation
```
Create CharacterCreate.jsx - a 3-step wizard:
Step 1: Choose faction (3 cards with icon, name, description, bonus, motto)
Step 2: Choose primary division (4 cards with icon, name, description)
Step 3: Enter callsign (16 char max) and select portrait (8 options as emojis)
Include progress indicator, back/next navigation, and summary before deploy.
```

### Prompt 6: War Map
```
Create WarMap.jsx that renders 88 sectors on an SVG map:
- Generate sectors in a grid with slight randomization
- Color nodes by controlling faction
- Animate contested sectors with pulsing border
- Draw connection lines between adjacent sectors
- Show selection ring on clicked sector
- Battle indicator (red dot) for active battles
- Tooltip on hover showing sector name and status
- Header with faction control counts
```

### Prompt 7: Army Loadout
```
Create ArmyLoadout.jsx with:
- 3 loadout tabs (Alpha, Beta, Gamma Squad)
- Toggle between squad view and recruitment shop
- Shop: Filter by division, show unit cards with stats and cost
- Recruit button (checks credits and capacity)
- Squad view: List units with index, icon, name, level, XP bar, remove button
- Footer: Total HP, Total Damage, Avg Speed stats
- Max capacity based on Tactics stat: 6 + floor(tactics/2), max 12
```

### Prompt 8: Battle System
```
Create BattleSimulator.jsx with:
- Header: Sector name, score display, countdown timer, retreat button
- Main area: 4 PoC cards in grid (Alpha, Beta, Gamma, Delta)
- Click PoC to assault (adds 25% progress each click)
- PoC states: enemy (red), neutral (gray), player (green)
- Win at 3 PoCs captured
- States: deploying (show squad, begin button) → active → victory/defeat
- Sidebar: Squad units with health bars, combat log
- Results: XP and credits earned
```

---

## Notes for Development

1. **State Management**: Start with React useState/useContext. Consider Zustand if complexity grows.

2. **Persistence**: Add localStorage save/load for player progress.

3. **Multiplayer Ready**: Structure data to eventually support WebSocket updates for real multiplayer.

4. **Testing**: The battle simulator can be tested in single-player mode by simulating enemy actions on a timer.

5. **Mobile**: The UI uses CSS Grid and Flexbox, should adapt reasonably. May need a simplified mobile layout later.

6. **Performance**: The SVG map with 88 sectors should perform fine. Use React.memo on sector nodes if needed.

This architecture allows building the game incrementally while maintaining a clear vision of the final product.
