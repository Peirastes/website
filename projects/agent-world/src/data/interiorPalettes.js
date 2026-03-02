// Tile indices (matching CampusScene T constants)
const DESK = 28;
const SERVER = 29;
const MONITOR = 30;
const WHITEBOARD = 48;
const LABBENCH = 49;
const LOUNGE = 50;
const CIRCUIT = 56;
const DRAWTAB = 57;
const KANBAN = 58;
const BOOKSHELF = 59;
const NETSWITCH = 60;
const LECTERN = 61;
const TOOLWALL = 62;
const PROJECTOR = 63;

export const INTERIOR_PALETTES = {
  CE: {
    preferred: [LABBENCH, CIRCUIT, MONITOR, TOOLWALL],
    allowed: [LABBENCH, CIRCUIT, MONITOR, TOOLWALL, DESK, WHITEBOARD],
    flavorText: {
      [LABBENCH]: 'Setting up a new bench...',
      [CIRCUIT]: 'Wiring a new board...',
      [MONITOR]: 'Another screen online!',
      [TOOLWALL]: 'Organizing the tools...',
      [DESK]: 'Need a workstation here.',
      [WHITEBOARD]: 'Whiteboard for schematics!'
    }
  },
  CD: {
    preferred: [DRAWTAB, WHITEBOARD, LOUNGE, PROJECTOR],
    allowed: [DRAWTAB, WHITEBOARD, LOUNGE, PROJECTOR, MONITOR, DESK],
    flavorText: {
      [DRAWTAB]: 'New mood board!',
      [WHITEBOARD]: 'Sketching some ideas...',
      [LOUNGE]: 'Creative lounge installed!',
      [PROJECTOR]: 'Setting up a projector...',
      [MONITOR]: 'Reference screen going up!',
      [DESK]: 'Drafting table in place.'
    }
  },
  PM: {
    preferred: [KANBAN, MONITOR, DESK],
    allowed: [KANBAN, MONITOR, DESK, WHITEBOARD, PROJECTOR],
    flavorText: {
      [KANBAN]: 'Reorganizing the board...',
      [MONITOR]: 'Dashboard monitor online!',
      [DESK]: 'New planning station.',
      [WHITEBOARD]: 'Strategy board mounted!',
      [PROJECTOR]: 'Standup projector ready.'
    }
  },
  RA: {
    preferred: [BOOKSHELF, MONITOR, DESK, LOUNGE],
    allowed: [BOOKSHELF, MONITOR, DESK, LOUNGE, WHITEBOARD],
    flavorText: {
      [BOOKSHELF]: 'More shelf space...',
      [MONITOR]: 'Digital archive terminal!',
      [DESK]: 'Reading desk assembled.',
      [LOUNGE]: 'Comfy reading nook!',
      [WHITEBOARD]: 'Notes board going up...'
    }
  },
  SA: {
    preferred: [SERVER, NETSWITCH, MONITOR],
    allowed: [SERVER, NETSWITCH, MONITOR, DESK, WHITEBOARD],
    flavorText: {
      [SERVER]: 'Racking a new server...',
      [NETSWITCH]: 'Patching in a switch...',
      [MONITOR]: 'Monitoring station live!',
      [DESK]: 'Ops desk deployed.',
      [WHITEBOARD]: 'Network diagram board!'
    }
  },
  TA: {
    preferred: [LECTERN, PROJECTOR, WHITEBOARD, DESK],
    allowed: [LECTERN, PROJECTOR, WHITEBOARD, DESK, MONITOR, LOUNGE],
    flavorText: {
      [LECTERN]: 'Setting up a podium...',
      [PROJECTOR]: 'Lecture projector ready!',
      [WHITEBOARD]: 'Fresh whiteboard up!',
      [DESK]: 'Student desk placed.',
      [MONITOR]: 'Demo screen installed!',
      [LOUNGE]: 'Office hours seating!'
    }
  }
};
