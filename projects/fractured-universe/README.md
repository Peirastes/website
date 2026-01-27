# FRACTURED UNIVERSE

A spiritual successor to Shattered Galaxy (2001 MMORTS) built with React and Vite.

## Project Status: Phase 2 - Core Screens ✓ Complete

### Phase 1: Foundation ✓ Complete
**Documentation:**
- `fractured-universe-architecture.md` - Complete architecture guide with all specifications
- `fractured-universe-quickstart.md` - Quick start guide with all component prompts

### Phase 2: Core Screens ✓ Complete
**Screens Implemented:**
- `src/screens/TitleScreen.jsx` - Animated opening screen with faction preview
- `src/screens/CharacterCreate.jsx` - 3-step character creation wizard
- `src/screens/MainGame.jsx` - Tab-based main game interface (4 tabs: War Map, Army, Stats, Clan)

**Hooks Implemented:**
- `src/hooks/usePlayer.js` - Complete player state management with localStorage persistence

**App Integration:**
- `src/App.jsx` - Updated to orchestrate entire game flow (title → character create → main game)

**Project Structure:**
```
fractured-universe/
├── src/
│   ├── App.jsx                    # Main orchestrator, game state flow
│   ├── index.css                  # Global styles & color palette
│   ├── main.jsx                   # React entry point
│   │
│   ├── data/
│   │   └── gameData.js            # All game constants (factions, units, sectors)
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.jsx          # HoloPanel, Button, ProgressBar, GlitchText, CRTOverlay
│   │   ├── screens/
│   │   │   ├── TitleScreen.jsx    # ✓ Animated title screen with particles
│   │   │   ├── CharacterCreate.jsx # ✓ 3-step wizard
│   │   │   └── MainGame.jsx       # ✓ Main game layout with tabs
│   │   ├── game/                  # WarMap, SectorDetails, BattleSimulator (Phase 3+)
│   │   └── notifications/         # NotificationSystem (Phase 6)
│   │
│   ├── hooks/
│   │   └── usePlayer.js           # ✓ Player state with XP, stats, loadout management
│   │
│   └── utils/                     # sectorGenerator, battleLogic (Phase 3+)
│
├── package.json
├── vite.config.js
├── index.html
└── .gitignore
```

**Data Layer Included:**
- 3 Factions with colors, bonuses, descriptions
- 4 Divisions (Infantry, Mobile, Aviation, Organic)
- 4 Stats (Tactics, Clout, Education, Mech Aptitude)
- 16 Unit Chassis (4 per division across 4 tiers)
- Sector generator (88 procedural sectors)
- Initial player state factory

**UI Components Included:**
- **HoloPanel** - Styled container with gradient, glow border, accent line
- **Button** - 4 variants (primary, danger, secondary, warning) with glow effects
- **ProgressBar** - Animated progress with percentage display
- **GlitchText** - Text with random glitch effect animation
- **CRTOverlay** - Fixed scanline overlay effect

**Color Palette:**
```css
--crimson: #ff3b3b
--azure: #3b9fff
--golden: #ffc93b
--accent-green: #00ff9f
--bg-dark: #050810
--bg-medium: #0a0f18
--text-primary: #ffffff
--text-secondary: #8899aa
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will start at `http://localhost:5173` with hot module reloading.

### 3. Build for Production
```bash
npm run build
npm run preview
```

## Phase 2 Features

**TitleScreen.jsx:**
- Full viewport animated background with gradient and grid
- 20 floating particles with faction colors
- GlitchText effect on "FRACTURED" title
- "UNIVERSE" subtitle in Azure blue
- Three faction indicators at bottom with colored dots
- "INITIALIZE COMMAND" button to start character creation

**CharacterCreate.jsx:**
- Step 1: Faction selection (3 faction cards with colors, bonuses, mottos)
- Step 2: Division selection (4 division cards with descriptions)
- Step 3: Identity (callsign input, 8 portrait emoji options)
- Progress indicator showing step number
- Back/Next navigation
- Summary section showing selections
- Full faction-colored glow based on selection

**usePlayer.js Hook:**
- Loads/saves player data to localStorage
- `addXP(amount)` - With automatic level-up handling
- `addCredits(amount)` / `addResources(amount)` - Resource management
- `allocateStat(statName, points)` - Distribute stat points
- `addUnit(unit, loadoutIndex)` / `removeUnit(unitId, loadoutIndex)` - Squad management
- `switchLoadout(loadoutIndex)` - Change active loadout (3 presets)
- `maxUnitCapacity()` - Calculate: 6 + floor(tactics/2), capped at 12
- `increaseDivisionLevel(divisionId)` - Unlock higher tier units
- `savePlayer()` / `resetPlayer()` - Persistence control

**MainGame.jsx:**
- PlayerStatusBar showing portrait, name, faction, level, XP bar
- Tab navigation (War Map, Army, Stats, Clan) with active state styling
- Placeholder content for each tab with phase indicators
- Dynamic faction color applied throughout
- Credits, Resources, and Stat Points display

## Phase 3: War System ✓ Complete

**Sector Generator Utility:**
- `src/utils/sectorGenerator.js` - Enhanced sector generation and connection logic
- `generateSectors()` - Creates 88 procedural sectors (3 capitol, 85 random)
- `generateConnections()` - Calculates tactical connections within 12-unit distance
- `calculateFactionControl()` - Counts sectors per faction
- Helper functions: `getSectorConnections()`, `getContestedSectors()`, `getCapitolSectors()`

**WarMap Component:**
- `src/components/game/WarMap.jsx` - Interactive SVG map (100x100 viewBox)
- Displays all 88 sectors as faction-colored nodes
- Connection lines between adjacent sectors (dotted, faction-colored)
- Contested sector pulsing animation (2s ease-in-out)
- Capitol sector star indicators (★)
- Battle indicators (red pulse) when players in combat
- Selection ring with rotation animation (3s) on selected sector
- Hover tooltip showing sector details (name, ID, faction, players, status)
- Faction control legend in header (sector counts)

**SectorDetails Component:**
- `src/components/game/SectorDetails.jsx` - Right-side detail panel
- Empty state: "SELECT A SECTOR" when no sector chosen
- Header: Sector name (24px, faction color), ID, status badges
- Status badges: "CAPITOL" (red), "CONTESTED" (yellow), "YOUR FACTION" (green)
- Control info card: Faction name with emoji icon (⚔️ Crimson, 🔬 Azure, 💎 Golden)
- 2x2 stats grid: PoC Count, Players in Battle, Resource Value, Battle Timer
- Recent activity section: 3 hardcoded combat log entries
- Action footer: "DEFEND SECTOR" (gold) or "ATTACK SECTOR" (red) button
- Capitol sectors show "Cannot be attacked" message

**MainGame Integration:**
- Updated `src/screens/MainGame.jsx` with War Map tab implementation
- Flexbox layout: WarMap (flex: 2) | Divider | SectorDetails (flex: 1)
- `selectedSector` state management
- `handleSelectSector(sectorId)` - Select sector from map
- `handleJoinBattle()` - Stub for Phase 5 battle implementation
- Divider styled with faction color at 40% opacity

## Phase 4: Army System ✓ Complete

**ArmyLoadout Component:**
- `src/components/game/ArmyLoadout.jsx` - Comprehensive army management interface
- 3 loadout tabs: Alpha Squad, Beta Squad, Gamma Squad
- Each loadout shows: Squad name and unit count (X / Y capacity)
- Two view modes: Squad View and Recruitment Shop

**Squad View:**
- Lists all recruited units in current loadout
- Each unit shows: icon, name, stats (HP/DMG/SPD), level, and remove button
- Empty state message when no units recruited
- Squad summary card displaying:
  - Total HP (sum of all units)
  - Total Damage (sum of all units)
  - Average Speed (average of all units)
  - Unit Capacity indicator (X / Y, green if room, red if full)

**Recruitment Shop:**
- Division filter tabs: Infantry, Mobile, Aviation, Organic
- Unit cards grid showing all 16 unit chassis
- Each unit card displays:
  - Unit emoji icon and name
  - Stats: HP, Damage, Speed
  - Tier and cost in credits (CR)
  - Recruit button with validation:
    - Checks sufficient credits
    - Checks unit capacity (6 + floor(tactics/2), capped at 12)
    - Shows error messages if constraints not met
- Click recruit to deduct credits and add unit to loadout

**CharacterStats Component:**
- `src/components/game/CharacterStats.jsx` - Full character stat management
- Stat point allocation interface:
  - 4 stat cards (2x2 grid): Tactics, Clout, Education, Mech Aptitude
  - Each card shows: current value, description, effect bonus, +/- buttons
  - Increment/decrement with statPoints validation
  - Stat effects displayed:
    - Tactics: Unit capacity calculation
    - Clout: Capture effectiveness %
    - Education: Equipment quality %
    - Mech Aptitude: Weight capacity %
  - Minimum stat value: 5 (prevents deallocating below start)

**Division Mastery Section:**
- 4 division cards (one per division)
- Each shows: icon, name, current level, tier availability
- Increase Mastery button upgrades division level
- Costs 1 stat point per upgrade
- Notifications show progression ("Infantry mastery increased to level X")

**MainGame Integration:**
- Updated Army tab with full ArmyLoadout component
- Updated Stats tab with full CharacterStats component
- Both components integrated with player state management
- Notifications show on recruitment, stat allocation, and mastery upgrades

## Phase 5: Battle System ✓ Complete

**useBattle Hook:**
- `src/hooks/useBattle.js` - Complete battle state management
- `initializeBattle(sector, loadout)` - Creates battle from sector and squad
- `startBattle()` - Transitions from deploying to active
- `assaultPoC(pocId)` - Capture PoC with 25% progress per assault
- `takeDamage(damage)` - Reduce squad HP, trigger defeat if <= 0
- `retreat()` - Abandon battle with defeat status
- `checkVictory()` - Check majority PoC control (> pocCount/2)
- `updateTimer()` - 15-minute countdown with victory check at zero
- `formatTime()` - Convert seconds to MM:SS format
- `calculateRewards()` - XP/credit calculation based on outcome

**BattleSimulator Component:**
- `src/components/game/BattleSimulator.jsx` - Full battle UI and mechanics
- **Header Section:** Sector name, score display (YOUR PoCs vs ENEMY PoCs), countdown timer
- **PoC Cards Grid:** 2-column layout, 3-6 PoCs (Alpha, Beta, Gamma, Delta, Echo, Foxtrot)
  - Each PoC shows: Owner badge, capture progress bar (0-100%), assault counter (X/4)
  - ASSAULT button (green when can assault, disabled when captured)
  - Owner badges: Neutral (gray), Enemy (red), Captured (green)
- **Squad Status Panel:** Health bar, unit list with individual HP, morale indicator
- **Combat Log:** Timestamped [HH:MM] battle events, scrollable with fade effect
- **Battle States:**
  - Deploying: Squad preview with "BEGIN BATTLE" button
  - Active: Full UI with interactive PoCs, timer countdown, retreat button
  - Victory: Modal with rewards (XP + credits), "RETURN TO MAP" button
  - Defeat: Modal with minimal rewards (100 XP only), return button

**Battle Mechanics:**
- 15-minute timer (900 seconds) with MM:SS display
- Victory condition: Control > 50% of PoCs at time zero
- PoC capture: 4 assaults per PoC (25% progress each)
- Enemy AI: 30% chance to counter-assault on player capture
- Squad HP tracking with morale based on remaining health
- Rewards: Victory gives 500 + (resources/10) XP and full resources in credits
- Defeat gives 100 XP and 0 credits
- Retreat option available during active battle

**MainGame Integration:**
- Updated `src/screens/MainGame.jsx` with battle flow management
- Battle state: `activeBattle` (sector + loadout), `battleActive` (boolean)
- `handleJoinBattle()` - Get active loadout, validate, initiate battle
- `handleBattleEnd(victory, rewards)` - Apply rewards, return to map
- `handleReturnToMap()` - Reset battle state, return to War Map tab
- Tab disabling during battle: Only War Map accessible, other tabs 50% opacity
- Conditional rendering: BattleSimulator replaces main content during active battle

## Phase 6: Social Features & Polish ✓ Complete

**NotificationSystem Component:**
- `src/components/notifications/NotificationSystem.jsx` - Toast notification display
- Fixed position at top-right (20px from edges)
- Auto-dismiss after configurable duration (default: 3 seconds)
- Supports 4 notification types with dynamic colors:
  - `info`: Blue (#3b9fff) with ℹ️ icon
  - `success`: Green (#00ff9f) with ✓ checkmark
  - `warning`: Yellow (#ffc93b) with ⚠️ icon
  - `error`: Red (#ff3b3b) with ✕ icon
- Smooth slide-in and fade-out animations
- Manual close button on each toast
- Z-index: 10000 (above CRT overlay)
- Integrates with App.jsx notifications state

**ClanPanel Component:**
- `src/components/game/ClanPanel.jsx` - Clan management and overview
- Empty state when no clan:
  - "NO CLAN" message with join/create buttons (stubs)
  - CREATE CLAN button (primary)
  - JOIN CLAN button (secondary)
- Full clan view when in a clan:
  - Clan header: Tag, name, leader, faction, established date
  - Clan stats: Member count, wars won/total, treasury credits
  - Members list: Scrollable table with rank icon, name, level, faction, join date
  - Current player row highlighted with faction background
  - Recent wars section: Enemy clan, date, result (WON/LOST), XP rewards
  - Treasury section: Total credits, weekly income, maintenance cost, net income
  - Action buttons: Contribute Credits, View Wars, Leave Clan (if not leader)
- Color-coded war results: Green for wins, red for losses
- Leave clan confirmation modal

**App.jsx Integration:**
- NotificationSystem component rendered globally
- Displays all active notifications from notifications state
- Auto-removes notifications via onRemove callback
- Works across all game screens

**MainGame.jsx Integration:**
- Clan tab now shows full ClanPanel component
- Receives: player, updatePlayer, addNotification props
- All other tabs remain functional and unchanged

**Notification Events Triggered Throughout Game:**
- Character creation: "Welcome to Fractured Universe, [Commander Name]"
- Unit recruitment: "Recruited [Unit Name]"
- Unit removal: "Unit removed from squad"
- Stat allocation: "Allocated X points to [Stat Name]"
- Division mastery: "[Division Name] mastery increased to level X"
- Sector selection: "Selected [Sector Name]"
- Battle entry: "Entering battle..."
- PoC capture: "Captured Point of Contention"
- Battle victory: "Victory! Earned X XP and X CR"
- Battle defeat: "Battle lost. Earned 100 XP"
- Clan actions: Various clan-related notifications (stubs for Phase 7)

## Phase 6 Summary

**Complete Game Implementation:**
- All 4 main game tabs fully functional (War Map, Army, Stats, Clan)
- Complete character progression system
- Battle system with real-time combat
- Squad management with multiple loadouts
- Stat allocation and division mastery
- Global notification system
- Persistent player data via localStorage
- Smooth UI transitions and animations

**Total Files Created:**
- 7 screens/components (TitleScreen, CharacterCreate, MainGame, WarMap, SectorDetails, ArmyLoadout, CharacterStats, BattleSimulator, ClanPanel, NotificationSystem)
- 2 custom hooks (usePlayer, useBattle)
- 1 utility module (sectorGenerator)
- 5 UI components (HoloPanel, Button, ProgressBar, GlitchText, CRTOverlay)
- Complete data layer (gameData.js)

## Next Steps: Phase 7 - Multiplayer & Advanced Features

Future enhancements:
1. **WebSocket Integration** - Real-time multiplayer battles
2. **Clan Wars System** - Full implementation with matching
3. **Leaderboards** - Global rankings
4. **Advanced Cosmetics** - Character skins, unit variants
5. **Performance Optimization** - Code splitting, lazy loading

All architecture is ready for multiplayer expansion.

## Development Notes

- **State Management**: Using React hooks (useState/useContext)
- **Styling**: CSS-in-JS + CSS custom properties for theming
- **Font**: Orbitron from Google Fonts (retro-futuristic aesthetic)
- **Build Tool**: Vite for fast development and optimized builds
- **Target**: Browser-based (responsive layout deferred to Phase 6)

## Technology Stack

- React 18.2
- Vite 5.0
- ES6 Modules
- CSS3 (Flexbox, Grid, Animations)

---

**Project initialized:** January 23, 2025
**Current Phase:** 6 of 7 ✓ (Core game complete)
**Phase 1 (Foundation):** ✓ Complete
**Phase 2 (Core Screens):** ✓ Complete
**Phase 3 (War System):** ✓ Complete
**Phase 4 (Army System):** ✓ Complete
**Phase 5 (Battle System):** ✓ Complete
**Phase 6 (Social & Polish):** ✓ Complete
**Phase 7 (Multiplayer & Advanced):** Future enhancement
