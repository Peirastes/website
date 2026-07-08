/**
 * Eisenhower quadrant ↔ CSS-class-id mapping. Used everywhere that
 * needs to colour-code a task pip, list-row stripe, calendar pill,
 * or matrix tile by its quadrant.
 *
 *   do-first  → q1 (Critical / urgent + necessary)
 *   schedule  → q2 (Strategic / not urgent + necessary)
 *   delegate  → q3 (Delegate  / urgent + not necessary)
 *   eliminate → q4 (Eliminate / not urgent + not necessary)
 */
export const QID_BY_QUAD = {
  'do-first':  'q1',
  'schedule':  'q2',
  'delegate':  'q3',
  'eliminate': 'q4',
};
