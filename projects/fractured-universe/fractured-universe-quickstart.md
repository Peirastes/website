# FRACTURED UNIVERSE - Quick Start Files

Copy these files to get started with the project.

---

## package.json

```json
{
  "name": "fractured-universe",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fractured Universe</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        background: #050810; 
        font-family: 'Orbitron', monospace;
        overflow-x: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## src/main.jsx

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## src/data/gameData.js

```javascript
// ============================================
// FACTIONS
// ============================================
export const FACTIONS = {
  CRIMSON_DOMINION: {
    id: 'crimson',
    name: 'Crimson Dominion',
    color: '#ff3b3b',
    bgColor: 'rgba(255, 59, 59, 0.15)',
    borderColor: 'rgba(255, 59, 59, 0.4)',
    description: 'Military supremacy through strength and discipline',
    motto: 'Victory Through Power',
    bonus: '+15% Unit HP',
  },
  AZURE_COALITION: {
    id: 'azure',
    name: 'Azure Coalition',
    color: '#3b9fff',
    bgColor: 'rgba(59, 159, 255, 0.15)',
    borderColor: 'rgba(59, 159, 255, 0.4)',
    description: 'Technological advancement and strategic superiority',
    motto: 'Knowledge Is Victory',
    bonus: '+15% Unit Damage',
  },
  GOLDEN_SOVEREIGNTY: {
    id: 'golden',
    name: 'Golden Sovereignty',
    color: '#ffc93b',
    bgColor: 'rgba(255, 201, 59, 0.15)',
    borderColor: 'rgba(255, 201, 59, 0.4)',
    description: 'Economic dominance and resource control',
    motto: 'Prosperity Conquers All',
    bonus: '+15% Resource Gain',
  },
};

// ============================================
// DIVISIONS
// ============================================
export const DIVISIONS = {
  INFANTRY: { id: 'infantry', name: 'Infantry', icon: '⚔️', description: 'Ground forces specialists' },
  MOBILE: { id: 'mobile', name: 'Mobile', icon: '🚀', description: 'Fast assault vehicles' },
  AVIATION: { id: 'aviation', name: 'Aviation', icon: '✈️', description: 'Air superiority units' },
  ORGANIC: { id: 'organic', name: 'Organic', icon: '🧬', description: 'Bio-engineered creatures' },
};

// ============================================
// STATS
// ============================================
export const STATS = {
  TACTICS: { id: 'tactics', name: 'Tactics', description: 'Increases unit capacity (6-12 units)', icon: '📊' },
  CLOUT: { id: 'clout', name: 'Clout', description: 'Faster unit upgrades, better capture', icon: '💎' },
  EDUCATION: { id: 'education', name: 'Education', description: 'Better weapons and equipment', icon: '📚' },
  MECH_APT: { id: 'mechApt', name: 'Mech. Aptitude', description: 'More weight capacity for units', icon: '⚙️' },
};

// ============================================
// UNIT CHASSIS
// ============================================
export const UNIT_CHASSIS = {
  // Infantry
  TROOPER: { id: 'trooper', name: 'Trooper', division: 'infantry', tier: 1, hp: 100, damage: 15, speed: 2, cost: 50, icon: '🎖️' },
  HEAVY_GUNNER: { id: 'heavyGunner', name: 'Heavy Gunner', division: 'infantry', tier: 2, hp: 150, damage: 25, speed: 1, cost: 120, icon: '🔫' },
  COMMANDO: { id: 'commando', name: 'Commando', division: 'infantry', tier: 3, hp: 120, damage: 35, speed: 3, cost: 200, icon: '🥷' },
  JUGGERNAUT: { id: 'juggernaut', name: 'Juggernaut', division: 'infantry', tier: 4, hp: 300, damage: 20, speed: 1, cost: 350, icon: '🛡️' },
  // Mobile
  SCOUT_BIKE: { id: 'scoutBike', name: 'Scout Bike', division: 'mobile', tier: 1, hp: 60, damage: 10, speed: 5, cost: 40, icon: '🏍️' },
  LIGHT_TANK: { id: 'lightTank', name: 'Light Tank', division: 'mobile', tier: 2, hp: 180, damage: 30, speed: 3, cost: 150, icon: '🛻' },
  BATTLE_TANK: { id: 'battleTank', name: 'Battle Tank', division: 'mobile', tier: 3, hp: 280, damage: 45, speed: 2, cost: 280, icon: '🚛' },
  SIEGE_WALKER: { id: 'siegeWalker', name: 'Siege Walker', division: 'mobile', tier: 4, hp: 400, damage: 60, speed: 1, cost: 450, icon: '🤖' },
  // Aviation
  DRONE: { id: 'drone', name: 'Recon Drone', division: 'aviation', tier: 1, hp: 40, damage: 8, speed: 6, cost: 35, icon: '🛸' },
  INTERCEPTOR: { id: 'interceptor', name: 'Interceptor', division: 'aviation', tier: 2, hp: 80, damage: 35, speed: 5, cost: 130, icon: '🛩️' },
  GUNSHIP: { id: 'gunship', name: 'Gunship', division: 'aviation', tier: 3, hp: 150, damage: 50, speed: 3, cost: 260, icon: '🚁' },
  BOMBER: { id: 'bomber', name: 'Bomber', division: 'aviation', tier: 4, hp: 200, damage: 80, speed: 2, cost: 400, icon: '✈️' },
  // Organic
  SWARMLING: { id: 'swarmling', name: 'Swarmling', division: 'organic', tier: 1, hp: 30, damage: 12, speed: 4, cost: 25, icon: '🐛' },
  STALKER: { id: 'stalker', name: 'Stalker', division: 'organic', tier: 2, hp: 90, damage: 28, speed: 4, cost: 100, icon: '🦎' },
  RAVAGER: { id: 'ravager', name: 'Ravager', division: 'organic', tier: 3, hp: 180, damage: 40, speed: 3, cost: 220, icon: '🦖' },
  LEVIATHAN: { id: 'leviathan', name: 'Leviathan', division: 'organic', tier: 4, hp: 500, damage: 55, speed: 1, cost: 500, icon: '🐉' },
};

// ============================================
// SECTOR GENERATOR
// ============================================
export const generateSectors = () => {
  const sectors = [];
  const factionIds = ['crimson', 'azure', 'golden'];
  const names = [
    'Nova Prime', 'Iron Wastes', 'Crystal Valley', 'Shadow Depths', 'Ember Fields',
    'Frozen Reach', 'Thunder Plains', 'Void Gate', 'Storm Basin', 'Rust Hollow',
    'Solar Ridge', 'Dark Spire', 'Echo Canyon', 'Neon Harbor', 'Ash Mountains',
    'Plasma Core', 'Drift Station', 'Obsidian Peaks', 'Aurora Basin', 'Deadzone Alpha',
    'Quantum Fields', 'Scrap Yards', 'Titan Falls', 'Nexus Point', 'Crimson Dunes',
    'Azure Depths', 'Golden Heights', 'Warp Gate', 'Frontier Post', 'Command Central',
  ];
  
  for (let i = 0; i < 88; i++) {
    const isCapitol = i < 3;
    sectors.push({
      id: i,
      name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
      x: (i % 11) * 9 + Math.random() * 3,
      y: Math.floor(i / 11) * 12 + Math.random() * 3,
      controlledBy: isCapitol ? factionIds[i] : factionIds[Math.floor(Math.random() * 3)],
      contested: !isCapitol && Math.random() > 0.7,
      pocCount: Math.floor(Math.random() * 4) + 3,
      playersInBattle: isCapitol ? 0 : Math.floor(Math.random() * 30),
      isCapitol,
      resources: Math.floor(Math.random() * 1000) + 200,
    });
  }
  return sectors;
};

// ============================================
// INITIAL PLAYER STATE
// ============================================
export const createInitialPlayer = (characterData) => {
  const faction = Object.values(FACTIONS).find(f => f.id === characterData.faction);
  return {
    ...characterData,
    faction,
    level: 1,
    xp: 0,
    xpToNext: 1000,
    credits: 5000,
    resources: 1000,
    stats: { tactics: 5, clout: 5, education: 5, mechApt: 5 },
    statPoints: 10,
    divisionLevels: { infantry: 1, mobile: 1, aviation: 1, organic: 1 },
    loadouts: [
      { id: 1, name: 'Alpha Squad', units: [] },
      { id: 2, name: 'Beta Squad', units: [] },
      { id: 3, name: 'Gamma Squad', units: [] },
    ],
    activeLoadout: 0,
    clan: null,
    reincarnations: 0,
  };
};
```

---

## Prompt Sequence for Building Components

Use these prompts with Claude Code to build each component file:

### 1. UI Components
```
Read src/data/gameData.js then create src/components/ui/index.jsx with these components:

1. HoloPanel - A container div with:
   - Background: linear-gradient(135deg, rgba(10,15,20,0.95), rgba(5,8,12,0.98))
   - Border: 1px solid with glow color (default #00ff9f) at 40% opacity
   - Box shadow with glow effect
   - Top accent line (1px gradient)
   - Props: children, style, glow (color)

2. Button - Styled button with variants:
   - primary: bg #00ff9f, text dark
   - danger: bg #ff3b3b, text white
   - secondary: bg #3b9fff, text white  
   - warning: bg #ffc93b, text dark
   - Disabled state (gray)
   - Glow box-shadow, uppercase, Orbitron font
   - Props: children, onClick, variant, disabled, style

3. ProgressBar - Animated progress bar:
   - Dark background with border
   - Colored fill with gradient and glow
   - Optional label above
   - Props: value, max, color, height, label

4. GlitchText - Text with random glitch effect:
   - useEffect with interval that randomly triggers glitch
   - Glitch: textShadow with red/green offset, slight skew
   - Props: children, style

5. CRTOverlay - Fixed overlay with scanlines:
   - Position fixed, full screen, pointer-events none
   - repeating-linear-gradient for scanline effect

Export all components.
```

### 2. Title Screen
```
Read src/data/gameData.js and src/components/ui/index.jsx, then create src/screens/TitleScreen.jsx:

- Full viewport height, dark gradient background
- Animated grid background (CSS animation moving diagonal)
- 20 floating particles in faction colors with float animation
- "TACTICAL COMMAND INTERFACE" header text
- Large "FRACTURED" title using GlitchText
- "UNIVERSE" subtitle in blue
- Description paragraph about the war
- "INITIALIZE COMMAND" Button that calls onStart prop
- Three faction indicators at bottom (colored dots with names)
- Include all keyframe animations in a <style> tag
- Use Orbitron font throughout
```

### 3. Character Creation
```
Read src/data/gameData.js and src/components/ui/index.jsx, then create src/screens/CharacterCreate.jsx:

A 3-step wizard with useState for step (1-3) and character data.

Step 1 - Faction Selection:
- Grid of 3 faction cards from FACTIONS data
- Each card shows: colored circle icon, name, description, bonus badge, motto
- Selected card has faction background color and border glow
- Next button (disabled until selection)

Step 2 - Division Selection:  
- Grid of 4 division cards from DIVISIONS data
- Each shows: large emoji icon, name, description
- Back and Next buttons

Step 3 - Identity:
- Text input for callsign (max 16 chars) with character counter
- Portrait selection: 8 emoji options in a flex row
- Summary section showing chosen faction/division/callsign
- Back button, "DEPLOY TO NEXUS PRIME" button (calls onComplete with character data)

Use HoloPanel for the main container, show step progress at top.
```

### 4. Main Game Layout
```
Read all existing files, then create src/screens/MainGame.jsx:

Layout:
- PlayerStatusBar at top (player portrait, name, faction, level, XP bar, credits, resources, stat points)
- Tab navigation bar (War Map, Army, Stats, Clan)
- Main content area that switches based on active tab

For now, create placeholder content for each tab that just shows the tab name.
The component receives: player, updatePlayer, sectors, addNotification as props.

PlayerStatusBar should show:
- 40px portrait (emoji from appearance.portrait index)
- Name in faction color, faction name and level below
- XP progress bar
- Credits with ¢ symbol
- Resources count
- Stat points available
```

### 5. War Map
```
Create src/components/game/WarMap.jsx:

Props: sectors, selectedSector, onSelectSector, playerFaction

Structure:
- HoloPanel container, flex column, full height
- Header: "NEXUS PRIME WAR MAP" title, faction control counts
- SVG viewBox="0 0 100 100" filling remaining space

SVG contents:
- Connection lines between sectors within 12 units distance (stroke color by faction match)
- For each sector, a group with:
  - Outer pulsing circle for contested/capitol sectors
  - Selection ring (dashed, rotating) if selected
  - Main circle colored by controlledBy faction
  - Star text for capitols
  - Red dot indicator if playersInBattle > 0
  - onClick -> onSelectSector(sector.id)
  - onMouseEnter/Leave for hover state

- Tooltip div (position absolute) showing hovered sector name and status

Use FACTIONS colors: crimson=#ff3b3b, azure=#3b9fff, golden=#ffc93b
```

### 6. Sector Details
```
Create src/components/game/SectorDetails.jsx:

Props: sector, player, onJoinBattle

If no sector selected, show placeholder with map icon and "Select a sector" message.

When sector selected:
- Header with sector name (in faction color), sector ID, status badges
- "CONTROLLED BY" card showing faction name, "YOUR FACTION" badge if matches
- 2x2 grid of stat cards: PoC Count, Players in Battle, Resource Value, Battle Timer
- "RECENT ACTIVITY" mock combat log (3 hardcoded entries)
- Footer: 
  - If capitol: "Capitol sectors cannot be attacked" message
  - Else: DEFEND (if player faction) or ATTACK (if enemy) button calling onJoinBattle

Use HoloPanel with glow color matching controlling faction.
```

Continue this pattern for remaining components...
