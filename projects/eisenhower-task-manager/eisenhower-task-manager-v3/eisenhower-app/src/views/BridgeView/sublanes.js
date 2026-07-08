/* ── Sublane registry ──────────────────────────────────────────────────────
   The persistent, append-only source of truth for how each domain lane
   subdivides into tracked sub-columns ("tracks"). Stored in
   `settings.sublanes` (server-persisted); this module supplies the seed
   defaults + the matching + stats helpers shared by the Bridge globe
   (BridgeView) and the Sublane Manager modal.

   A track never rewrites a task tag — it BINDS to existing `subcategory`
   tags and/or title keywords, so a track can be untracked (hidden from the
   globe) and re-tracked later without losing history. The Projects domain is
   special: its tracks are the TRACKED projects (matched by projectId), managed
   in the Projects view, so it lives outside this registry. ── */

export const DEFAULT_SUBLANES = {
  Instructor: [
    /* `matches` are exact `subcategory` tags; `titleMatches` are case-insensitive
       substrings of the task TITLE. Title matching disambiguates the coarse
       "Schedule" tag, which lumps PSE-I Lectures, Office Hours, and Electrical
       Science Lab meetings together. Match order is priority (first wins). */
    { name: 'PSE-I',        matches: ['PSEI Notes', 'PSEI HW', 'PSEI Exam', 'PSEI Drill', 'PSEI Lecture', 'PSEI Grading'],
                            titleMatches: ['PSE-I'] },
    { name: 'Elec Sci Lab', matches: ['Electrical Science Lab', 'Thermal Engineering Lab', 'TE Lab'],
                            titleMatches: ['Electrical Science', 'Thermal Engineering'] },
    { name: 'Duties',       matches: ['Schedule', 'Service'],
                            titleMatches: ['Office Hours'] },
  ],
  Coordinator: [
    { name: 'Ignition',     matches: ['Ignition'], titleMatches: ['Ignition'] },
  ],
  Personal: [
    { name: 'Bills',        matches: ['Finance'] },
    { name: 'Chores',       matches: ['Home', 'Car'] },
    { name: 'Family',       matches: ['Family'] },
    { name: 'Friends',      matches: ['Friends'] },
  ],
};

let _seq = 0;
export const newSublaneId = () => `sl_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

/* Normalize a raw seed/registry entry to a full record (stable id + tracked). */
const normalizeEntry = (s) => ({
  id: s.id || newSublaneId(),
  name: s.name,
  matches: [...(s.matches || [])],
  titleMatches: [...(s.titleMatches || [])],
  tracked: s.tracked !== false,
});

/* The registry for one domain — from settings if present, else seeded from the
   defaults. Always returns full records. */
export const domainRegistry = (settings, domain) => {
  const stored = settings && settings.sublanes && settings.sublanes[domain];
  const src = Array.isArray(stored) ? stored : (DEFAULT_SUBLANES[domain] || []);
  return src.map(normalizeEntry);
};

/* A complete editable registry object for the given (non-Projects) domains —
   used by the manager to bootstrap a draft the first time. */
export const seedRegistry = (settings, domains) => {
  const out = {};
  for (const d of domains) out[d] = domainRegistry(settings, d);
  return out;
};

/* Does a track claim this task? subcategory exact OR title substring. */
export const sublaneMatches = (s, t) => {
  if ((s.matches || []).includes(t.subcategory)) return true;
  const title = (t.task || '').toLowerCase();
  return (s.titleMatches || []).some(k => title.includes(k.toLowerCase()));
};

/* Per-track stats over a task list: total matched, open vs done, completion %,
   and the earliest activity year ("since"). Feeds the manager's density/longevity
   readout (most-trafficked = highest total; longest-around = earliest since). */
export const sublaneStats = (s, tasks) => {
  let total = 0, done = 0, earliest = null;
  for (const t of tasks) {
    if (!sublaneMatches(s, t)) continue;
    total++;
    if (t.percentComplete === 100) done++;
    const d = t.assignedDate || t.dueDate;
    if (d && (!earliest || d < earliest)) earliest = d;
  }
  return {
    total, done, open: total - done,
    pct: total ? Math.round((done / total) * 100) : 0,
    since: earliest ? earliest.slice(0, 4) : null,
  };
};
