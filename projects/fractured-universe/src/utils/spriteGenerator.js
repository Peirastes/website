/**
 * Sprite Generator & Asset Loader
 * Loads Kenney.nl Sci-Fi RTS sprites and applies faction-based color overlays
 * Falls back to procedural generation if assets unavailable
 */

const spriteCache = {};
const assetCache = {}; // Cache loaded PNG assets

/**
 * Unit ID to sprite file mapping (OpenHV 90s pixel art assets)
 */
const UNIT_SPRITE_MAP = {
  // Infantry
  'trooper': '/assets/sprites/infantry/trooper.png',
  'heavyGunner': '/assets/sprites/infantry/heavy-gunner.png',
  'commando': '/assets/sprites/infantry/commando.png',
  'juggernaut': '/assets/sprites/infantry/juggernaut.png',
  // Mobile
  'scoutBike': '/assets/sprites/mobile/scout-bike.png',
  'lightTank': '/assets/sprites/mobile/light-tank.png',
  'battleTank': '/assets/sprites/mobile/battle-tank.png',
  'siegeWalker': '/assets/sprites/mobile/siege-walker.png',
  // Aviation
  'drone': '/assets/sprites/aviation/drone.png',
  'interceptor': '/assets/sprites/aviation/interceptor.png',
  'gunship': '/assets/sprites/aviation/gunship.png',
  'bomber': '/assets/sprites/aviation/bomber.png',
  // Organic
  'swarmling': '/assets/sprites/organic/swarmling.png',
  'stalker': '/assets/sprites/organic/stalker.png',
  'ravager': '/assets/sprites/organic/ravager.png',
  'leviathan': '/assets/sprites/organic/leviathan.png',
};

/**
 * Load an image asset from the public folder
 */
const loadImage = async (imagePath) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
    img.src = imagePath;
  });
};

/**
 * Get or create a sprite for a unit
 */
export const getUnitSprite = (unitData, faction, size = 32) => {
  if (!unitData || !faction) {
    // Return a blank canvas if data is missing
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  const cacheKey = `${unitData.id}-${faction.id}-${size}`;

  if (spriteCache[cacheKey]) {
    return spriteCache[cacheKey];
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Try to load asset sprite, fall back to procedural
  if (UNIT_SPRITE_MAP[unitData.id]) {
    loadAssetSpriteWithOverlay(ctx, unitData.id, unitData, faction, size)
      .then(() => {
        spriteCache[cacheKey] = canvas;
      })
      .catch(() => {
        // Fall back to procedural generation
        const colors = getFactionColors(faction);
        drawUnitSprite(ctx, unitData, colors, size);
        spriteCache[cacheKey] = canvas;
      });
  } else {
    // Unknown unit, use procedural
    const colors = getFactionColors(faction);
    drawUnitSprite(ctx, unitData, colors, size);
  }

  spriteCache[cacheKey] = canvas;
  return canvas;
};

/**
 * Load asset sprite and apply faction color overlay
 * Extracts first frame from OpenHV spritesheets (which contain multiple directional/animation frames)
 */
const loadAssetSpriteWithOverlay = async (ctx, unitId, unitData, faction, size) => {
  try {
    const imagePath = UNIT_SPRITE_MAP[unitId];

    // Check cache first
    if (!assetCache[imagePath]) {
      assetCache[imagePath] = await loadImage(imagePath);
    }

    const img = assetCache[imagePath];

    // Use pixel-perfect rendering for retro look
    ctx.imageSmoothingEnabled = false;

    // OpenHV spritesheets contain multiple frames in a grid
    // Detect frame count and extract first frame
    const frameWidth = Math.round(img.width / 8); // Assume up to 8 frames horizontally
    const frameHeight = Math.round(img.height / 4); // Assume up to 4 rows

    // Use the first frame (top-left)
    const sourceX = 0;
    const sourceY = 0;

    // Calculate scaling to fit canvas
    const scale = Math.min(size / frameWidth, size / frameHeight);
    const scaledWidth = frameWidth * scale;
    const scaledHeight = frameHeight * scale;
    const drawX = (size - scaledWidth) / 2;
    const drawY = (size - scaledHeight) / 2;

    // Draw only the first frame from the spritesheet
    ctx.drawImage(
      img,
      sourceX, sourceY,           // Source position (first frame)
      frameWidth, frameHeight,    // Source size (one frame)
      drawX, drawY,               // Destination position (centered)
      scaledWidth, scaledHeight   // Destination size (scaled to fit)
    );

    // Apply faction color overlay
    applyFactionColorOverlay(ctx, faction, size);
  } catch (error) {
    console.warn(`Could not load sprite for unit ${unitId}: ${error.message}`);
    throw error;
  }
};

/**
 * Apply faction-based color tint/overlay to sprite
 */
const applyFactionColorOverlay = (ctx, faction, size) => {
  const colors = getFactionColors(faction);

  // Create a semi-transparent overlay using the faction's primary color
  ctx.fillStyle = colors.primary;
  ctx.globalAlpha = 0.15; // Subtle overlay, preserves original sprite detail
  ctx.fillRect(0, 0, size, size);

  // Add accent color highlights for visual distinction
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = 0.08;
  ctx.fillRect(0, 0, size / 4, size);
  ctx.fillRect(size * 0.75, 0, size / 4, size);

  ctx.globalAlpha = 1;
};

/**
 * Main sprite drawing dispatcher (procedural fallback)
 */
const drawUnitSprite = (ctx, unitData, colors, size) => {
  const unitId = unitData.id;

  // Infantry units
  if (unitId === 'trooper') drawTrooper(ctx, colors, size);
  else if (unitId === 'heavyGunner') drawHeavyGunner(ctx, colors, size);
  else if (unitId === 'commando') drawCommando(ctx, colors, size);
  else if (unitId === 'juggernaut') drawJuggernaut(ctx, colors, size);

  // Mobile units
  else if (unitId === 'scoutBike') drawScoutBike(ctx, colors, size);
  else if (unitId === 'lightTank') drawLightTank(ctx, colors, size);
  else if (unitId === 'battleTank') drawBattleTank(ctx, colors, size);
  else if (unitId === 'siegeWalker') drawSiegeWalker(ctx, colors, size);

  // Aviation units
  else if (unitId === 'drone') drawDrone(ctx, colors, size);
  else if (unitId === 'interceptor') drawInterceptor(ctx, colors, size);
  else if (unitId === 'gunship') drawGunship(ctx, colors, size);
  else if (unitId === 'bomber') drawBomber(ctx, colors, size);

  // Organic units
  else if (unitId === 'swarmling') drawSwarmling(ctx, colors, size);
  else if (unitId === 'stalker') drawStalker(ctx, colors, size);
  else if (unitId === 'ravager') drawRavager(ctx, colors, size);
  else if (unitId === 'leviathan') drawLeviathan(ctx, colors, size);

  // Add outline for clarity
  addOutline(ctx, colors, size);
};

/**
 * Clear both sprite and asset caches
 */
export const clearSpriteCache = () => {
  Object.keys(spriteCache).forEach((key) => {
    delete spriteCache[key];
  });
  Object.keys(assetCache).forEach((key) => {
    delete assetCache[key];
  });
};

// ============================================
// INFANTRY SPRITES
// ============================================

const drawTrooper = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Head
  fillRect(ctx, x - c, y - 3.5 * c, 2 * c, 1.5 * c, colors.primary);
  // Body
  fillRect(ctx, x - 1.2 * c, y - 2 * c, 2.4 * c, 2 * c, colors.primary);
  // Legs
  fillRect(ctx, x - 0.8 * c, y, 0.8 * c, 1.5 * c, colors.secondary);
  fillRect(ctx, x, y, 0.8 * c, 1.5 * c, colors.secondary);
  // Rifle arm
  fillRect(ctx, x + 1.2 * c, y - 1.2 * c, 0.6 * c, 1.8 * c, colors.secondary);
  fillRect(ctx, x + 1.5 * c, y - 1.5 * c, 1.5 * c, 0.5 * c, colors.accent);
};

const drawHeavyGunner = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Heavy armor plating
  fillRect(ctx, x - 1.5 * c, y - 3 * c, 3 * c, 4 * c, colors.primary);
  // Detailed armor
  fillRect(ctx, x - 1.2 * c, y - 2.8 * c, 2.4 * c, 0.6 * c, colors.accent);
  // Massive gun
  fillRect(ctx, x + 1.2 * c, y - 1 * c, 0.8 * c, 2.5 * c, colors.secondary);
  fillRect(ctx, x + 1.8 * c, y - 1.3 * c, 2 * c, 0.6 * c, colors.accent);
  // Legs (heavy stance)
  fillRect(ctx, x - 0.6 * c, y + 1 * c, 1.2 * c, 1.5 * c, colors.secondary);
};

const drawCommando = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Sleek body
  fillRect(ctx, x - 0.9 * c, y - 3.2 * c, 1.8 * c, 1.6 * c, colors.primary);
  // Chest armor detail
  fillRect(ctx, x - 0.7 * c, y - 2.5 * c, 1.4 * c, 0.8 * c, colors.accent);
  // Torso
  fillRect(ctx, x - 1 * c, y - 1.6 * c, 2 * c, 1.8 * c, colors.primary);
  // Dynamic leg pose
  fillRect(ctx, x - 0.5 * c, y, 0.8 * c, 1.8 * c, colors.secondary);
  fillRect(ctx, x + 0.3 * c, y + 0.3 * c, 0.8 * c, 1.5 * c, colors.secondary);
  // Specialized weapon
  fillRect(ctx, x + 1.2 * c, y - 0.8 * c, 0.7 * c, 2.2 * c, colors.secondary);
  fillRect(ctx, x + 1.7 * c, y - 1.2 * c, 1.8 * c, 0.5 * c, colors.accent);
};

const drawJuggernaut = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Massive shield
  fillRect(ctx, x - 2 * c, y - 2.5 * c, 1.5 * c, 3.5 * c, colors.accent);
  // Heavy body
  fillRect(ctx, x - 1 * c, y - 3.2 * c, 2 * c, 4 * c, colors.primary);
  // Reinforced plating
  fillRect(ctx, x - 0.8 * c, y - 3 * c, 1.6 * c, 0.7 * c, colors.secondary);
  fillRect(ctx, x - 0.8 * c, y - 1 * c, 1.6 * c, 0.7 * c, colors.secondary);
  fillRect(ctx, x - 0.8 * c, y + 0.8 * c, 1.6 * c, 0.7 * c, colors.secondary);
  // Heavy weapon
  fillRect(ctx, x + 1.2 * c, y - 0.5 * c, 0.8 * c, 2.5 * c, colors.secondary);
  // Legs (thick)
  fillRect(ctx, x - 0.7 * c, y + 1 * c, 0.7 * c, 1.8 * c, colors.primary);
  fillRect(ctx, x, y + 1 * c, 0.7 * c, 1.8 * c, colors.primary);
};

// ============================================
// MOBILE SPRITES
// ============================================

const drawScoutBike = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Sleek body
  fillRect(ctx, x - 1.5 * c, y - 1.5 * c, 3 * c, 1.2 * c, colors.primary);
  // Windscreen
  fillRect(ctx, x - 1 * c, y - 1.8 * c, 1.2 * c, 0.4 * c, colors.accent);
  // Front wheel
  fillCircle(ctx, x + 1.2 * c, y + 0.5 * c, 0.7 * c, colors.secondary);
  // Rear wheel
  fillCircle(ctx, x - 1.2 * c, y + 0.5 * c, 0.7 * c, colors.secondary);
  // Suspension detail
  fillRect(ctx, x - 1 * c, y + 0.2 * c, 0.5 * c, 0.4 * c, colors.accent);
  fillRect(ctx, x + 0.5 * c, y + 0.2 * c, 0.5 * c, 0.4 * c, colors.accent);
  // Rider
  fillRect(ctx, x - 0.4 * c, y - 1.8 * c, 0.8 * c, 0.8 * c, colors.secondary);
};

const drawLightTank = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Tank hull
  fillRect(ctx, x - 1.8 * c, y - 0.8 * c, 3.6 * c, 1.6 * c, colors.primary);
  // Turret base
  fillCircle(ctx, x, y - 1.2 * c, 1 * c, colors.primary);
  // Gun barrel
  fillRect(ctx, x + 0.8 * c, y - 1.5 * c, 1.8 * c, 0.5 * c, colors.secondary);
  // Gun tip
  fillRect(ctx, x + 2.5 * c, y - 1.3 * c, 0.8 * c, 0.3 * c, colors.accent);
  // Left track
  fillRect(ctx, x - 2 * c, y + 0.8 * c, 0.5 * c, 1.2 * c, colors.secondary);
  // Right track
  fillRect(ctx, x + 1.5 * c, y + 0.8 * c, 0.5 * c, 1.2 * c, colors.secondary);
  // Hatch detail
  fillRect(ctx, x - 0.4 * c, y - 0.3 * c, 0.8 * c, 0.6 * c, colors.accent);
};

const drawBattleTank = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Large hull
  fillRect(ctx, x - 2 * c, y - 0.6 * c, 4 * c, 1.8 * c, colors.primary);
  // Hull detail
  fillRect(ctx, x - 1.8 * c, y - 0.4 * c, 3.6 * c, 0.6 * c, colors.accent);
  // Turret
  fillCircle(ctx, x, y - 1.3 * c, 1.2 * c, colors.primary);
  // Large cannon barrel
  fillRect(ctx, x + 1 * c, y - 1.6 * c, 2.2 * c, 0.6 * c, colors.secondary);
  // Muzzle brake
  fillRect(ctx, x + 3.2 * c, y - 1.4 * c, 0.6 * c, 0.4 * c, colors.accent);
  // Tracks
  fillRect(ctx, x - 2.2 * c, y + 1.2 * c, 0.6 * c, 1 * c, colors.secondary);
  fillRect(ctx, x + 1.6 * c, y + 1.2 * c, 0.6 * c, 1 * c, colors.secondary);
  // Track detail
  fillRect(ctx, x - 1.6 * c, y + 1.3 * c, 3.2 * c, 0.3 * c, colors.accent);
};

const drawSiegeWalker = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Main body
  fillRect(ctx, x - 1.5 * c, y - 2 * c, 3 * c, 2.2 * c, colors.primary);
  // Head/Turret
  fillCircle(ctx, x, y - 2.8 * c, 0.8 * c, colors.primary);
  // Massive cannon
  fillRect(ctx, x + 0.8 * c, y - 2.5 * c, 2 * c, 0.8 * c, colors.secondary);
  // Cannon detail
  fillRect(ctx, x + 2.8 * c, y - 2.2 * c, 0.8 * c, 0.4 * c, colors.accent);
  // Front left leg
  fillRect(ctx, x - 1 * c, y, 0.4 * c, 2 * c, colors.secondary);
  // Front right leg
  fillRect(ctx, x + 0.6 * c, y, 0.4 * c, 2 * c, colors.secondary);
  // Rear left leg
  fillRect(ctx, x - 1.8 * c, y + 0.2 * c, 0.4 * c, 2.2 * c, colors.secondary);
  // Rear right leg
  fillRect(ctx, x + 1.4 * c, y + 0.2 * c, 0.4 * c, 2.2 * c, colors.secondary);
  // Armor plating
  fillRect(ctx, x - 1.2 * c, y - 0.5 * c, 2.4 * c, 0.5 * c, colors.accent);
};

// ============================================
// AVIATION SPRITES
// ============================================

const drawDrone = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Main body
  fillRect(ctx, x - 0.8 * c, y - 1 * c, 1.6 * c, 1.8 * c, colors.primary);
  // Top rotor
  fillRect(ctx, x - 1.8 * c, y - 0.8 * c, 3.6 * c, 0.3 * c, colors.accent);
  // Bottom rotor detail
  fillRect(ctx, x - 1.6 * c, y + 0.8 * c, 3.2 * c, 0.3 * c, colors.accent);
  // Camera/sensor dome
  fillCircle(ctx, x, y - 1.4 * c, 0.4 * c, colors.secondary);
  // Sensor pod
  fillRect(ctx, x - 0.5 * c, y + 0.8 * c, 1 * c, 0.6 * c, colors.secondary);
};

const drawInterceptor = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Fuselage
  fillRect(ctx, x - 0.6 * c, y - 2.2 * c, 1.2 * c, 3.5 * c, colors.primary);
  // Pointed nose
  fillRect(ctx, x - 0.3 * c, y - 2.8 * c, 0.6 * c, 0.8 * c, colors.accent);
  // Left wing
  fillRect(ctx, x - 2 * c, y - 0.8 * c, 1.4 * c, 0.6 * c, colors.secondary);
  // Right wing
  fillRect(ctx, x + 0.6 * c, y - 0.8 * c, 1.4 * c, 0.6 * c, colors.secondary);
  // Cockpit
  fillRect(ctx, x - 0.3 * c, y - 1.5 * c, 0.6 * c, 0.6 * c, colors.accent);
  // Missile hardpoints
  fillRect(ctx, x - 1.8 * c, y, 0.4 * c, 0.6 * c, colors.secondary);
  fillRect(ctx, x + 1.4 * c, y, 0.4 * c, 0.6 * c, colors.secondary);
};

const drawGunship = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Fuselage
  fillRect(ctx, x - 1 * c, y - 1.2 * c, 2 * c, 2.2 * c, colors.primary);
  // Main rotor
  fillRect(ctx, x - 2.2 * c, y - 0.5 * c, 4.4 * c, 0.4 * c, colors.secondary);
  // Tail boom
  fillRect(ctx, x, y + 0.6 * c, 0.4 * c, 1.5 * c, colors.secondary);
  // Tail rotor
  fillRect(ctx, x + 0.2 * c, y + 1.8 * c, 1 * c, 0.3 * c, colors.accent);
  // Gun pods
  fillRect(ctx, x - 1.6 * c, y - 0.2 * c, 0.5 * c, 1.5 * c, colors.secondary);
  fillRect(ctx, x + 1.1 * c, y - 0.2 * c, 0.5 * c, 1.5 * c, colors.secondary);
  // Cockpit
  fillRect(ctx, x - 0.3 * c, y - 0.8 * c, 0.6 * c, 0.6 * c, colors.accent);
};

const drawBomber = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Large fuselage
  fillRect(ctx, x - 1 * c, y - 1.8 * c, 2 * c, 3.2 * c, colors.primary);
  // Nose cone
  fillRect(ctx, x - 0.4 * c, y - 2.4 * c, 0.8 * c, 0.8 * c, colors.accent);
  // Wings (large)
  fillRect(ctx, x - 2.8 * c, y - 0.6 * c, 5.6 * c, 0.8 * c, colors.secondary);
  // Tail wings
  fillRect(ctx, x - 2 * c, y + 1.2 * c, 4 * c, 0.5 * c, colors.secondary);
  // Engine pods
  fillRect(ctx, x - 2.2 * c, y - 0.5 * c, 0.5 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x + 1.7 * c, y - 0.5 * c, 0.5 * c, 1.2 * c, colors.secondary);
  // Bomb bay detail
  fillRect(ctx, x - 0.6 * c, y + 0.2 * c, 1.2 * c, 0.8 * c, colors.accent);
};

// ============================================
// ORGANIC SPRITES
// ============================================

const drawSwarmling = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Segmented body
  fillCircle(ctx, x, y - 1.2 * c, 0.6 * c, colors.primary);
  fillCircle(ctx, x, y, 0.7 * c, colors.primary);
  fillCircle(ctx, x, y + 1.2 * c, 0.6 * c, colors.secondary);
  // Front legs
  fillRect(ctx, x - 0.8 * c, y - 0.8 * c, 0.3 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x + 0.5 * c, y - 0.8 * c, 0.3 * c, 1.2 * c, colors.secondary);
  // Back legs
  fillRect(ctx, x - 0.8 * c, y + 0.4 * c, 0.3 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x + 0.5 * c, y + 0.4 * c, 0.3 * c, 1.2 * c, colors.secondary);
  // Mandibles
  fillRect(ctx, x - 0.5 * c, y - 1.6 * c, 0.2 * c, 0.5 * c, colors.accent);
  fillRect(ctx, x + 0.3 * c, y - 1.6 * c, 0.2 * c, 0.5 * c, colors.accent);
};

const drawStalker = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Head
  fillCircle(ctx, x, y - 2 * c, 0.7 * c, colors.primary);
  // Neck
  fillRect(ctx, x - 0.3 * c, y - 1.3 * c, 0.6 * c, 0.8 * c, colors.primary);
  // Body
  fillRect(ctx, x - 1 * c, y - 0.8 * c, 2 * c, 1.5 * c, colors.primary);
  // Tail
  fillRect(ctx, x + 0.8 * c, y + 0.5 * c, 0.4 * c, 1.8 * c, colors.secondary);
  // Front left leg
  fillRect(ctx, x - 1.2 * c, y + 0.2 * c, 0.4 * c, 1.8 * c, colors.secondary);
  // Front right leg
  fillRect(ctx, x + 0.8 * c, y + 0.2 * c, 0.4 * c, 1.8 * c, colors.secondary);
  // Back legs
  fillRect(ctx, x - 0.6 * c, y + 1 * c, 0.3 * c, 1.5 * c, colors.secondary);
  fillRect(ctx, x + 0.3 * c, y + 1 * c, 0.3 * c, 1.5 * c, colors.secondary);
  // Eye detail
  fillCircle(ctx, x - 0.2 * c, y - 2.2 * c, 0.2 * c, colors.accent);
};

const drawRavager = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Large head
  fillCircle(ctx, x, y - 2.2 * c, 0.9 * c, colors.primary);
  // Jaw detail
  fillRect(ctx, x - 0.8 * c, y - 1.5 * c, 1.6 * c, 0.5 * c, colors.secondary);
  // Neck
  fillRect(ctx, x - 0.5 * c, y - 1.2 * c, 1 * c, 0.6 * c, colors.primary);
  // Large body
  fillRect(ctx, x - 1.2 * c, y - 0.5 * c, 2.4 * c, 2 * c, colors.primary);
  // Back spikes
  fillRect(ctx, x - 1.3 * c, y - 1 * c, 0.3 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x + 1 * c, y - 1 * c, 0.3 * c, 1.2 * c, colors.secondary);
  // Front leg
  fillRect(ctx, x - 1.2 * c, y + 1.3 * c, 0.5 * c, 1.2 * c, colors.secondary);
  // Back leg
  fillRect(ctx, x + 0.7 * c, y + 1.3 * c, 0.5 * c, 1.2 * c, colors.secondary);
  // Tail
  fillRect(ctx, x + 1 * c, y + 1.5 * c, 0.3 * c, 1.5 * c, colors.secondary);
};

const drawLeviathan = (ctx, colors, size) => {
  const c = size / 8;
  const x = size / 2;
  const y = size / 2;

  // Massive head
  fillCircle(ctx, x, y - 2.5 * c, 1.2 * c, colors.primary);
  // Horns
  fillRect(ctx, x - 1 * c, y - 3.4 * c, 0.3 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x + 0.7 * c, y - 3.4 * c, 0.3 * c, 1.2 * c, colors.secondary);
  // Eye
  fillCircle(ctx, x - 0.3 * c, y - 2.8 * c, 0.3 * c, colors.accent);
  // Neck with spikes
  fillRect(ctx, x - 0.7 * c, y - 1.5 * c, 1.4 * c, 0.8 * c, colors.primary);
  fillRect(ctx, x - 0.8 * c, y - 1.4 * c, 0.3 * c, 0.7 * c, colors.secondary);
  fillRect(ctx, x + 0.5 * c, y - 1.4 * c, 0.3 * c, 0.7 * c, colors.secondary);
  // Large body
  fillRect(ctx, x - 1.5 * c, y - 0.6 * c, 3 * c, 2.5 * c, colors.primary);
  // Body spikes
  fillRect(ctx, x - 1.6 * c, y - 0.2 * c, 0.3 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x - 1.6 * c, y + 1 * c, 0.3 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x + 1.3 * c, y - 0.2 * c, 0.3 * c, 1.2 * c, colors.secondary);
  fillRect(ctx, x + 1.3 * c, y + 1 * c, 0.3 * c, 1.2 * c, colors.secondary);
  // Tail
  fillRect(ctx, x + 1.2 * c, y + 1.8 * c, 0.4 * c, 1.2 * c, colors.secondary);
  // Wing hints
  fillRect(ctx, x - 1.5 * c, y + 0.5 * c, 0.4 * c, 1 * c, colors.accent);
  fillRect(ctx, x + 1.1 * c, y + 0.5 * c, 0.4 * c, 1 * c, colors.accent);
};

// ============================================
// DRAWING UTILITIES
// ============================================

const fillRect = (ctx, x, y, w, h, color, outlineColor = null) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
};

const fillCircle = (ctx, x, y, r, color, outlineColor = null) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
};

const addOutline = (ctx, colors, size) => {
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = Math.max(1, size / 32);
  ctx.strokeRect(2, 2, size - 4, size - 4);
};

/**
 * Get faction-specific colors
 */
const getFactionColors = (faction) => {
  switch (faction.id) {
    case 'crimson':
      return {
        primary: '#ff3b3b',
        secondary: '#cc0000',
        accent: '#ffaa00',
      };
    case 'azure':
      return {
        primary: '#3b9fff',
        secondary: '#0066cc',
        accent: '#00ff9f',
      };
    case 'golden':
      return {
        primary: '#ffc93b',
        secondary: '#cc9900',
        accent: '#ffff66',
      };
    default:
      return {
        primary: '#888888',
        secondary: '#555555',
        accent: '#dddddd',
      };
  }
};
