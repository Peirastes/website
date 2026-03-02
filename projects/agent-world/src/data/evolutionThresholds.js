/**
 * Evolution system thresholds.
 * Maps to the Three Types of Expert from AI_Agent_Philosophical_Debriefing.md:
 *   Stage 1 (Type 1): Follows procedures, fills templates, executes within guidelines
 *   Stage 2 (Type 2): Identifies implicit assumptions, adapts procedures, innovates within domain
 *   Stage 3 (Type 3): Generates novel frameworks, questions foundations, creates new procedures
 *
 * Evolution is a quality gate: quantitative thresholds are necessary but not sufficient.
 * The player must confirm qualitative advancement.
 */
export const EVOLUTION_STAGES = {
  1: {
    name: 'Base',
    expertType: 'Type 1 — Procedural',
    description: 'Follows procedures, fills templates, executes within guidelines.',
    visual: 'base',       // Normal sprite
    xpRequired: 0
  },
  2: {
    name: 'Evolved',
    expertType: 'Type 2 — Adaptive',
    description: 'Identifies implicit assumptions, adapts procedures, innovates within domain.',
    visual: 'glow',       // Glow outline effect
    xpRequired: 500,
    tasksRequired: 10,
    qualitativeGate: true  // Player must confirm
  },
  3: {
    name: 'Final',
    expertType: 'Type 3 — Generative',
    description: 'Generates novel frameworks, questions foundations, creates new procedures.',
    visual: 'aura',       // Particle aura effect
    xpRequired: 2000,
    tasksRequired: 30,
    novelContributionsRequired: 5,
    qualitativeGate: true
  }
};

export const XP_REWARDS = {
  taskComplete: {
    P1: 100,
    P2: 75,
    P3: 50,
    P4: 30,
    P5: 15
  },
  novelContribution: 200
};
