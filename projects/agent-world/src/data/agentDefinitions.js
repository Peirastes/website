/**
 * Static metadata for all 6 agent types.
 * Building zones correspond to the campus map layout.
 */
export const AGENT_TYPES = {
  CE: {
    id: 'CE',
    name: 'Computer Engineer',
    shortName: 'CE',
    defaultNickname: 'CHIP',
    color: '#4a9eff',       // Blue
    building: 'Lab / Shop',
    zone: 'workshop',
    description: 'Firmware, pipelines, infrastructure, and technical implementation.',
    mapPosition: { x: 5, y: 22 },  // Bottom-left building
    avatar: 'CE'
  },
  CD: {
    id: 'CD',
    name: 'Creative Director',
    shortName: 'CD',
    defaultNickname: 'MUSE',
    color: '#e066ff',       // Purple
    building: 'Studio',
    zone: 'studio',
    description: 'Visual design, branding, creative strategy, and aesthetics.',
    mapPosition: { x: 5, y: 12 },  // Left-middle building
    avatar: 'CD'
  },
  PM: {
    id: 'PM',
    name: 'Project Manager',
    shortName: 'PM',
    defaultNickname: 'LEAD',
    color: '#ffcc44',       // Gold
    building: 'Command Center',
    zone: 'command',
    description: 'Task coordination, sprint planning, inter-agent workflow.',
    mapPosition: { x: 18, y: 17 },  // Center building
    avatar: 'PM'
  },
  RA: {
    id: 'RA',
    name: 'Research Assistant',
    shortName: 'RA',
    defaultNickname: 'SAGE',
    color: '#44ddaa',       // Teal
    building: 'Library / Archive',
    zone: 'library',
    description: 'Literature review, data analysis, and empirical investigation.',
    mapPosition: { x: 18, y: 4 },   // Top-center building
    avatar: 'RA'
  },
  SA: {
    id: 'SA',
    name: 'Site Administrator',
    shortName: 'SA',
    defaultNickname: 'GATE',
    color: '#ff6b6b',       // Red
    building: 'Control Room',
    zone: 'control',
    description: 'Deployment, hosting, DNS, CI/CD, and site infrastructure.',
    mapPosition: { x: 32, y: 22 },  // Bottom-right building
    avatar: 'SA'
  },
  TA: {
    id: 'TA',
    name: 'Teaching Assistant',
    shortName: 'TA',
    defaultNickname: 'PROF',
    color: '#7bc67e',       // Green
    building: 'Classroom',
    zone: 'classroom',
    description: 'Course materials, lecture notes, pedagogy, and student support.',
    mapPosition: { x: 32, y: 12 },  // Right-middle building
    avatar: 'TA'
  }
};

export const AGENT_TYPE_IDS = Object.keys(AGENT_TYPES);
