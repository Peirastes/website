/**
 * Enhanced Sector Generation Utility
 * Handles creation, connection, and management of game sectors
 */

// ============================================
// CONSTANTS
// ============================================
const FACTIONS = ['crimson', 'azure', 'golden'];
const FACTION_NAMES = {
  crimson: 'Crimson Dominion',
  azure: 'Azure Coalition',
  golden: 'Golden Sovereignty',
};

const SECTOR_NAMES = [
  'Nova Prime',
  'Iron Wastes',
  'Crystal Valley',
  'Shadow Depths',
  'Ember Fields',
  'Frozen Reach',
  'Thunder Plains',
  'Void Gate',
  'Storm Basin',
  'Rust Hollow',
  'Solar Ridge',
  'Dark Spire',
  'Echo Canyon',
  'Neon Harbor',
  'Ash Mountains',
  'Plasma Core',
  'Drift Station',
  'Obsidian Peaks',
  'Aurora Basin',
  'Deadzone Alpha',
  'Quantum Fields',
  'Scrap Yards',
  'Titan Falls',
  'Nexus Point',
  'Crimson Dunes',
  'Azure Depths',
  'Golden Heights',
  'Warp Gate',
  'Frontier Post',
  'Command Central',
  'Void Wastes',
  'Silent Spire',
  'Inferno Ridge',
  'Frozen Vale',
  'Storm Peak',
  'Shattered Isles',
  'Vortex Station',
  'Eclipse Fields',
  'Shadowfen',
  'Starfall Crater',
];

const MAX_CONNECTION_DISTANCE = 12;

// ============================================
// generateSectors()
// ============================================
/**
 * Creates 88 sectors with faction assignments
 * First 3 sectors are capitols (one per faction)
 * Remaining 85 sectors randomly assigned
 *
 * @returns {Array<Object>} Array of sector objects
 */
export const generateSectors = () => {
  const sectors = [];

  for (let i = 0; i < 88; i++) {
    const isCapitol = i < 3;
    const factionId = isCapitol ? FACTIONS[i] : FACTIONS[Math.floor(Math.random() * 3)];

    sectors.push({
      id: i,
      name: generateSectorName(i),
      x: (i % 11) * 9 + Math.random() * 3,
      y: Math.floor(i / 11) * 12 + Math.random() * 3,
      controlledBy: factionId,
      contested: !isCapitol && Math.random() > 0.7,
      pocCount: Math.floor(Math.random() * 4) + 3,
      playersInBattle: isCapitol ? 0 : Math.floor(Math.random() * 30),
      isCapitol,
      resources: Math.floor(Math.random() * 1000) + 200,
    });
  }

  return sectors;
};

/**
 * Helper function to generate unique sector names
 * @param {number} index - Sector index
 * @returns {string} Generated sector name
 */
function generateSectorName(index) {
  const baseName = SECTOR_NAMES[index % SECTOR_NAMES.length];
  const suffix = index >= SECTOR_NAMES.length ? ` ${Math.floor(index / SECTOR_NAMES.length) + 1}` : '';
  return baseName + suffix;
}

// ============================================
// generateConnections()
// ============================================
/**
 * Creates connections between sectors within distance threshold
 * Excludes capitol sectors from having tactical connections
 *
 * @param {Array<Object>} sectors - Array of sector objects
 * @returns {Array<Object>} Array of connection objects
 * @throws {Error} If sectors array is invalid or distance calculation fails
 */
export const generateConnections = (sectors) => {
  if (!Array.isArray(sectors)) {
    throw new Error('sectors parameter must be an array');
  }

  if (sectors.length === 0) {
    return [];
  }

  const connections = [];
  const capitolIds = new Set();

  // Identify capitol sectors
  sectors.forEach((sector) => {
    if (sector.isCapitol) {
      capitolIds.add(sector.id);
    }
  });

  // Create connections between nearby sectors
  for (let i = 0; i < sectors.length; i++) {
    for (let j = i + 1; j < sectors.length; j++) {
      const sector1 = sectors[i];
      const sector2 = sectors[j];

      // Skip if either sector is a capitol
      if (capitolIds.has(sector1.id) || capitolIds.has(sector2.id)) {
        continue;
      }

      // Validate coordinates
      if (
        typeof sector1.x !== 'number' ||
        typeof sector1.y !== 'number' ||
        typeof sector2.x !== 'number' ||
        typeof sector2.y !== 'number'
      ) {
        throw new Error(`Invalid coordinates for sectors ${sector1.id} or ${sector2.id}`);
      }

      // Calculate distance
      const distance = calculateDistance(sector1.x, sector1.y, sector2.x, sector2.y);

      // Create connection if within threshold
      if (distance <= MAX_CONNECTION_DISTANCE) {
        connections.push({
          from: sector1.id,
          to: sector2.id,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        });
      }
    }
  }

  return connections;
};

/**
 * Helper function to calculate Euclidean distance between two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {number} Euclidean distance
 * @throws {Error} If any coordinate is not a valid number
 */
function calculateDistance(x1, y1, x2, y2) {
  if (![x1, y1, x2, y2].every((val) => typeof val === 'number' && isFinite(val))) {
    throw new Error('All coordinates must be finite numbers');
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ============================================
// getSectorConnections()
// ============================================
/**
 * Gets all connected sector IDs for a given sector
 *
 * @param {number} sectorId - The sector ID to look up
 * @param {Array<Object>} connections - Array of connection objects
 * @returns {Array<number>} Array of connected sector IDs
 * @throws {Error} If parameters are invalid
 */
export const getSectorConnections = (sectorId, connections) => {
  if (typeof sectorId !== 'number') {
    throw new Error('sectorId must be a number');
  }

  if (!Array.isArray(connections)) {
    throw new Error('connections parameter must be an array');
  }

  const connectedIds = new Set();

  connections.forEach((connection) => {
    if (connection.from === sectorId) {
      connectedIds.add(connection.to);
    } else if (connection.to === sectorId) {
      connectedIds.add(connection.from);
    }
  });

  return Array.from(connectedIds).sort((a, b) => a - b);
};

// ============================================
// calculateFactionControl()
// ============================================
/**
 * Calculates how many sectors each faction controls
 *
 * @param {Array<Object>} sectors - Array of sector objects
 * @returns {Object} Object with faction counts { crimson: number, azure: number, golden: number }
 * @throws {Error} If sectors array is invalid
 */
export const calculateFactionControl = (sectors) => {
  if (!Array.isArray(sectors)) {
    throw new Error('sectors parameter must be an array');
  }

  const control = {
    crimson: 0,
    azure: 0,
    golden: 0,
  };

  sectors.forEach((sector) => {
    if (sector.controlledBy && control.hasOwnProperty(sector.controlledBy)) {
      control[sector.controlledBy]++;
    }
  });

  return control;
};

// ============================================
// getContestedSectors()
// ============================================
/**
 * Returns array of all contested sectors
 *
 * @param {Array<Object>} sectors - Array of sector objects
 * @returns {Array<Object>} Array of contested sector objects
 * @throws {Error} If sectors array is invalid
 */
export const getContestedSectors = (sectors) => {
  if (!Array.isArray(sectors)) {
    throw new Error('sectors parameter must be an array');
  }

  return sectors.filter((sector) => sector.contested === true);
};

// ============================================
// getCapitolSectors()
// ============================================
/**
 * Returns array of all capitol sectors
 *
 * @param {Array<Object>} sectors - Array of sector objects
 * @returns {Array<Object>} Array of capitol sector objects
 * @throws {Error} If sectors array is invalid
 */
export const getCapitolSectors = (sectors) => {
  if (!Array.isArray(sectors)) {
    throw new Error('sectors parameter must be an array');
  }

  return sectors.filter((sector) => sector.isCapitol === true);
};

// ============================================
// EXPORT SUMMARY
// ============================================
/**
 * Utility functions for sector generation and management:
 *
 * generateSectors() - Creates 88 sectors with faction assignments
 * generateConnections(sectors) - Creates connections between nearby sectors
 * getSectorConnections(sectorId, connections) - Gets connected sector IDs
 * calculateFactionControl(sectors) - Counts sectors per faction
 * getContestedSectors(sectors) - Returns contested sectors only
 * getCapitolSectors(sectors) - Returns capitol sectors only
 */
