/**
 * Static metadata for the 23 Great Minds (Forum thinkers).
 * Tiers based on stress-test scoring from assembly_of_greatest_minds.md.
 */

export const FORUM_THINKERS = {
  // ─── Elite (8.7+) ─────────────────────────────────────────────────────────
  ARENDT: {
    id: 'ARENDT', name: 'Hannah Arendt', era: '20th Century', tier: 'Elite',
    score: 9.3, color: '#cc4466',
    shortDescription: 'Political theorist — the banality of evil, natality, totalitarianism.',
  },
  AURELIUS: {
    id: 'AURELIUS', name: 'Marcus Aurelius', era: 'Ancient', tier: 'Elite',
    score: 8.7, color: '#b8944c',
    shortDescription: 'Philosopher-Emperor — Stoic duty, self-mastery, the inner citadel.',
  },
  HUME: {
    id: 'HUME', name: 'David Hume', era: 'Enlightenment', tier: 'Elite',
    score: 8.7, color: '#4488aa',
    shortDescription: 'The Skeptic\'s Skeptic — is-ought, induction, the bundle self.',
  },
  JUNG: {
    id: 'JUNG', name: 'Carl Jung', era: '20th Century', tier: 'Elite',
    score: 8.7, color: '#7755aa',
    shortDescription: 'Depth psychologist — the shadow, archetypes, individuation.',
  },

  // ─── Strong (8.0–8.5) ─────────────────────────────────────────────────────
  AQUINAS: {
    id: 'AQUINAS', name: 'Thomas Aquinas', era: 'Medieval', tier: 'Strong',
    score: 8.3, color: '#886644',
    shortDescription: 'Synthesizer of faith and reason — Five Ways, natural law.',
  },
  ARISTOTLE: {
    id: 'ARISTOTLE', name: 'Aristotle', era: 'Ancient', tier: 'Strong',
    score: 8.3, color: '#88774c',
    shortDescription: 'The Systematizer — telos, virtue ethics, the Golden Mean.',
  },
  DESCARTES: {
    id: 'DESCARTES', name: 'René Descartes', era: 'Renaissance', tier: 'Strong',
    score: 8.3, color: '#556688',
    shortDescription: 'The Radical Doubter — cogito ergo sum, mind-body dualism.',
  },
  HUXLEY: {
    id: 'HUXLEY', name: 'Aldous Huxley', era: '20th Century', tier: 'Strong',
    score: 8.3, color: '#669966',
    shortDescription: 'Prophet of comfortable tyranny — Brave New World, perennial philosophy.',
  },
  FEYNMAN: {
    id: 'FEYNMAN', name: 'Richard Feynman', era: '20th Century', tier: 'Strong',
    score: 8.3, color: '#cc7744',
    shortDescription: 'The Honest Physicist — intellectual honesty, the pleasure of finding out.',
  },
  SOCRATES: {
    id: 'SOCRATES', name: 'Socrates', era: 'Ancient', tier: 'Strong',
    score: 8.0, color: '#99886c',
    shortDescription: 'The Questioner — the examined life, Socratic method.',
  },
  LEONARDO: {
    id: 'LEONARDO', name: 'Leonardo da Vinci', era: 'Renaissance', tier: 'Strong',
    score: 8.0, color: '#88774c',
    shortDescription: 'The Observer — saper vedere, art as investigation.',
  },
  GALILEO: {
    id: 'GALILEO', name: 'Galileo Galilei', era: 'Renaissance', tier: 'Strong',
    score: 8.0, color: '#668844',
    shortDescription: 'The Empiricist Rebel — observation trumps authority.',
  },
  POPPER: {
    id: 'POPPER', name: 'Karl Popper', era: '20th Century', tier: 'Strong',
    score: 8.0, color: '#448866',
    shortDescription: 'The Falsificationist — open society, conjecture and refutation.',
  },

  // ─── Middle (7.0–7.7) ─────────────────────────────────────────────────────
  LEIBNIZ: {
    id: 'LEIBNIZ', name: 'Gottfried Wilhelm Leibniz', era: 'Renaissance', tier: 'Middle',
    score: 7.7, color: '#667788',
    shortDescription: 'Optimist-Metaphysician — best of all possible worlds, monads.',
  },
  VOLTAIRE: {
    id: 'VOLTAIRE', name: 'Voltaire', era: 'Enlightenment', tier: 'Middle',
    score: 7.7, color: '#aa7744',
    shortDescription: 'The Wit — satire, tolerance, demolishing dogma.',
  },
  CLEOPATRA: {
    id: 'CLEOPATRA', name: 'Cleopatra', era: 'Ancient', tier: 'Middle',
    score: 7.7, color: '#cc8844',
    shortDescription: 'The Strategist — power as currency, cultural fluency.',
  },
  NIETZSCHE: {
    id: 'NIETZSCHE', name: 'Friedrich Nietzsche', era: 'Enlightenment', tier: 'Middle',
    score: 7.7, color: '#884444',
    shortDescription: 'The Diagnostician — will to power, death of God, ressentiment.',
  },
  FRANKLIN: {
    id: 'FRANKLIN', name: 'Benjamin Franklin', era: 'Enlightenment', tier: 'Middle',
    score: 7.3, color: '#668855',
    shortDescription: 'The Pragmatist-Statesman — virtue as practice, applied wisdom.',
  },
  NEWTON: {
    id: 'NEWTON', name: 'Isaac Newton', era: 'Renaissance', tier: 'Middle',
    score: 7.0, color: '#555577',
    shortDescription: 'Mathematical Physicist — universal laws, hypotheses non fingo.',
  },
  MAXWELL: {
    id: 'MAXWELL', name: 'James Clerk Maxwell', era: 'Enlightenment', tier: 'Middle',
    score: 7.0, color: '#557788',
    shortDescription: 'The Unifier — electromagnetic theory, mathematical beauty.',
  },

  // ─── On Notice (<7.0) ─────────────────────────────────────────────────────
  HILDEGARD: {
    id: 'HILDEGARD', name: 'Hildegard von Bingen', era: 'Medieval', tier: 'On Notice',
    score: 6.7, color: '#886688',
    shortDescription: 'Mystic-Polymath — viriditas, divine revelation, feminine authority.',
  },
  HYPATIA: {
    id: 'HYPATIA', name: 'Hypatia', era: 'Ancient', tier: 'On Notice',
    score: 6.7, color: '#778877',
    shortDescription: 'Martyr-Scholar — knowledge transcends faction.',
  },
  TESLA: {
    id: 'TESLA', name: 'Nikola Tesla', era: '20th Century', tier: 'On Notice',
    score: 6.3, color: '#6688aa',
    shortDescription: 'Visionary Inventor — imagination as preview of the future.',
  },
};

export const FORUM_THINKER_IDS = Object.keys(FORUM_THINKERS);

export const TIER_COLORS = {
  Elite: '#ffcc44',
  Strong: '#c0c0c0',
  Middle: '#cd7f32',
  'On Notice': '#888888',
};

export const ERA_ORDER = ['Ancient', 'Medieval', 'Renaissance', 'Enlightenment', '20th Century'];
