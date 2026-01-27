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
  TROOPER: { id: 'trooper', name: 'Trooper', division: 'infantry', tier: 1, hp: 100, damage: 15, baseSpeed: 120, cost: 50, icon: '🎖️', sprite: '/assets/sprites/infantry/trooper.png', size: 18, combatRange: 35 },
  HEAVY_GUNNER: { id: 'heavyGunner', name: 'Heavy Gunner', division: 'infantry', tier: 2, hp: 150, damage: 25, baseSpeed: 80, cost: 120, icon: '🔫', sprite: '/assets/sprites/infantry/heavy-gunner.png', size: 20, combatRange: 32 },
  COMMANDO: { id: 'commando', name: 'Commando', division: 'infantry', tier: 3, hp: 120, damage: 35, baseSpeed: 140, cost: 200, icon: '🥷', sprite: '/assets/sprites/infantry/commando.png', size: 16, combatRange: 38 },
  JUGGERNAUT: { id: 'juggernaut', name: 'Juggernaut', division: 'infantry', tier: 4, hp: 300, damage: 20, baseSpeed: 70, cost: 350, icon: '🛡️', sprite: '/assets/sprites/infantry/juggernaut.png', size: 26, combatRange: 28 },
  // Mobile
  SCOUT_BIKE: { id: 'scoutBike', name: 'Scout Bike', division: 'mobile', tier: 1, hp: 60, damage: 10, baseSpeed: 160, cost: 40, icon: '🏍️', sprite: '/assets/sprites/mobile/scout-bike.png', size: 16, combatRange: 40 },
  LIGHT_TANK: { id: 'lightTank', name: 'Light Tank', division: 'mobile', tier: 2, hp: 180, damage: 30, baseSpeed: 110, cost: 150, icon: '🛻', sprite: '/assets/sprites/mobile/light-tank.png', size: 22, combatRange: 35 },
  BATTLE_TANK: { id: 'battleTank', name: 'Battle Tank', division: 'mobile', tier: 3, hp: 280, damage: 45, baseSpeed: 90, cost: 280, icon: '🚛', sprite: '/assets/sprites/mobile/battle-tank.png', size: 28, combatRange: 30 },
  SIEGE_WALKER: { id: 'siegeWalker', name: 'Siege Walker', division: 'mobile', tier: 4, hp: 400, damage: 60, baseSpeed: 60, cost: 450, icon: '🤖', sprite: '/assets/sprites/mobile/siege-walker.png', size: 32, combatRange: 25 },
  // Aviation
  DRONE: { id: 'drone', name: 'Recon Drone', division: 'aviation', tier: 1, hp: 40, damage: 8, baseSpeed: 180, cost: 35, icon: '🛸', sprite: '/assets/sprites/aviation/drone.png', size: 14, combatRange: 45 },
  INTERCEPTOR: { id: 'interceptor', name: 'Interceptor', division: 'aviation', tier: 2, hp: 80, damage: 35, baseSpeed: 160, cost: 130, icon: '🛩️', sprite: '/assets/sprites/aviation/interceptor.png', size: 16, combatRange: 42 },
  GUNSHIP: { id: 'gunship', name: 'Gunship', division: 'aviation', tier: 3, hp: 150, damage: 50, baseSpeed: 130, cost: 260, icon: '🚁', sprite: '/assets/sprites/aviation/gunship.png', size: 20, combatRange: 40 },
  BOMBER: { id: 'bomber', name: 'Bomber', division: 'aviation', tier: 4, hp: 200, damage: 80, baseSpeed: 100, cost: 400, icon: '✈️', sprite: '/assets/sprites/aviation/bomber.png', size: 24, combatRange: 38 },
  // Organic
  SWARMLING: { id: 'swarmling', name: 'Swarmling', division: 'organic', tier: 1, hp: 30, damage: 12, baseSpeed: 150, cost: 25, icon: '🐛', sprite: '/assets/sprites/organic/swarmling.png', size: 12, combatRange: 30 },
  STALKER: { id: 'stalker', name: 'Stalker', division: 'organic', tier: 2, hp: 90, damage: 28, baseSpeed: 130, cost: 100, icon: '🦎', sprite: '/assets/sprites/organic/stalker.png', size: 18, combatRange: 35 },
  RAVAGER: { id: 'ravager', name: 'Ravager', division: 'organic', tier: 3, hp: 180, damage: 40, baseSpeed: 110, cost: 220, icon: '🦖', sprite: '/assets/sprites/organic/ravager.png', size: 24, combatRange: 32 },
  LEVIATHAN: { id: 'leviathan', name: 'Leviathan', division: 'organic', tier: 4, hp: 500, damage: 55, baseSpeed: 80, cost: 500, icon: '🐉', sprite: '/assets/sprites/organic/leviathan.png', size: 30, combatRange: 28 },
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
