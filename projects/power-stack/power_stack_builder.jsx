import { useState, useMemo, useCallback } from "react";

const FONT_MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";
const FONT_BODY = "'DM Sans', 'Helvetica Neue', sans-serif";

const COLORS = {
  bg: "#0a0c10",
  surface: "#12151c",
  surfaceHover: "#1a1e28",
  border: "#1e2330",
  borderActive: "#2a3040",
  text: "#c8cdd8",
  textMuted: "#6b7280",
  textDim: "#3d4350",
  accent: "#3b82f6",
  accentDim: "#1e3a5f",
  green: "#10b981",
  greenDim: "#064e3b",
  red: "#ef4444",
  redDim: "#5c1a1a",
  amber: "#f59e0b",
  amberDim: "#5c3d0a",
  purple: "#8b5cf6",
  purpleDim: "#3b1f7a",
  teal: "#14b8a6",
  tealDim: "#0d4f47",
  white: "#e8ecf2",
};

const MUSCLE_GROUPS = {
  chest: { label: "Chest", color: COLORS.red, tau_f: 18, tau_r: 36, window: [48, 72] },
  back: { label: "Back", color: COLORS.accent, tau_f: 20, tau_r: 40, window: [48, 80] },
  quads: { label: "Quads", color: COLORS.green, tau_f: 22, tau_r: 48, window: [56, 96] },
  hamstrings: { label: "Hamstrings", color: COLORS.teal, tau_f: 20, tau_r: 44, window: [48, 84] },
  shoulders: { label: "Shoulders", color: COLORS.amber, tau_f: 14, tau_r: 28, window: [36, 56] },
  arms: { label: "Arms", color: COLORS.purple, tau_f: 12, tau_r: 24, window: [24, 48] },
  core: { label: "Core", color: COLORS.textMuted, tau_f: 10, tau_r: 20, window: [20, 36] },
};

const EXERCISE_DB = {
  bench_press: { name: "Barbell bench press", primary: "chest", secondary: ["shoulders", "arms"], type: "compound" },
  incline_db: { name: "Incline DB press", primary: "chest", secondary: ["shoulders"], type: "compound" },
  cable_fly: { name: "Cable fly", primary: "chest", secondary: [], type: "isolation" },
  dip: { name: "Weighted dips", primary: "chest", secondary: ["arms", "shoulders"], type: "compound" },
  ohp: { name: "Overhead press", primary: "shoulders", secondary: ["arms", "chest"], type: "compound" },
  lateral_raise: { name: "Lateral raise", primary: "shoulders", secondary: [], type: "isolation" },
  face_pull: { name: "Face pulls", primary: "shoulders", secondary: ["back"], type: "isolation" },
  deadlift: { name: "Conventional deadlift", primary: "hamstrings", secondary: ["back", "quads", "core"], type: "compound" },
  rdl: { name: "Romanian deadlift", primary: "hamstrings", secondary: ["back"], type: "compound" },
  hip_thrust: { name: "Barbell hip thrust", primary: "hamstrings", secondary: [], type: "compound" },
  leg_curl: { name: "Lying leg curl", primary: "hamstrings", secondary: [], type: "isolation" },
  squat: { name: "Back squat", primary: "quads", secondary: ["hamstrings", "core"], type: "compound" },
  front_squat: { name: "Front squat", primary: "quads", secondary: ["core"], type: "compound" },
  leg_press: { name: "Leg press", primary: "quads", secondary: ["hamstrings"], type: "compound" },
  leg_ext: { name: "Leg extension", primary: "quads", secondary: [], type: "isolation" },
  pullup: { name: "Weighted pull-ups", primary: "back", secondary: ["arms"], type: "compound" },
  barbell_row: { name: "Barbell row", primary: "back", secondary: ["arms", "core"], type: "compound" },
  cable_row: { name: "Seated cable row", primary: "back", secondary: ["arms"], type: "compound" },
  lat_pulldown: { name: "Lat pulldown", primary: "back", secondary: ["arms"], type: "compound" },
  db_row: { name: "Single-arm DB row", primary: "back", secondary: ["arms"], type: "compound" },
  curl: { name: "Barbell curl", primary: "arms", secondary: [], type: "isolation" },
  hammer_curl: { name: "Hammer curls", primary: "arms", secondary: [], type: "isolation" },
  tricep_ext: { name: "Overhead tricep ext.", primary: "arms", secondary: [], type: "isolation" },
  pushdown: { name: "Rope pushdown", primary: "arms", secondary: [], type: "isolation" },
  calf_raise: { name: "Calf raise", primary: "core", secondary: [], type: "isolation" },
  back_ext: { name: "Back extension", primary: "core", secondary: ["hamstrings"], type: "isolation" },
  ab_wheel: { name: "Ab wheel rollout", primary: "core", secondary: [], type: "isolation" },
  plank: { name: "Weighted plank", primary: "core", secondary: [], type: "isolation" },
};

const GOAL_PRESETS = {
  strength: {
    label: "Strength",
    desc: "Maximize force production. Heavy compounds, low reps, long rest.",
    repRange: [1, 5],
    intensity: [80, 92],
    setsPerMuscle: [10, 15],
    restRange: [180, 300],
    icon: "⚡",
  },
  hypertrophy: {
    label: "Hypertrophy",
    desc: "Maximize muscle growth. Moderate load, moderate-high volume, metabolic stress.",
    repRange: [6, 12],
    intensity: [65, 80],
    setsPerMuscle: [15, 22],
    restRange: [90, 180],
    icon: "◆",
  },
  recomp: {
    label: "Recomposition",
    desc: "Build muscle, lose fat. Mixed intensity, strategic conditioning.",
    repRange: [3, 15],
    intensity: [65, 85],
    setsPerMuscle: [12, 18],
    restRange: [60, 180],
    icon: "◎",
  },
};

const SPLIT_TEMPLATES = {
  ul_5: {
    label: "Upper / Lower (5-day)",
    days: 5,
    structure: [
      { label: "Upper push", primary: ["chest", "shoulders", "arms"], focus: "push" },
      { label: "Lower compound", primary: ["quads", "hamstrings", "core"], focus: "squat" },
      { label: "Rest", primary: [], focus: "rest" },
      { label: "Upper pull", primary: ["back", "shoulders", "arms"], focus: "pull" },
      { label: "Lower focused", primary: ["hamstrings", "quads", "core"], focus: "hinge" },
      { label: "Full upper", primary: ["chest", "back", "shoulders", "arms"], focus: "full" },
      { label: "Rest", primary: [], focus: "rest" },
    ],
  },
  ppl_6: {
    label: "Push / Pull / Legs (6-day)",
    days: 6,
    structure: [
      { label: "Push A", primary: ["chest", "shoulders", "arms"], focus: "push" },
      { label: "Pull A", primary: ["back", "arms"], focus: "pull" },
      { label: "Legs A", primary: ["quads", "hamstrings", "core"], focus: "squat" },
      { label: "Push B", primary: ["shoulders", "chest", "arms"], focus: "push" },
      { label: "Pull B", primary: ["back", "arms"], focus: "pull" },
      { label: "Legs B", primary: ["hamstrings", "quads", "core"], focus: "hinge" },
      { label: "Rest", primary: [], focus: "rest" },
    ],
  },
  ul_4: {
    label: "Upper / Lower (4-day)",
    days: 4,
    structure: [
      { label: "Upper A (push)", primary: ["chest", "shoulders", "arms"], focus: "push" },
      { label: "Lower A (squat)", primary: ["quads", "hamstrings", "core"], focus: "squat" },
      { label: "Rest", primary: [], focus: "rest" },
      { label: "Upper B (pull)", primary: ["back", "shoulders", "arms"], focus: "pull" },
      { label: "Lower B (hinge)", primary: ["hamstrings", "quads", "core"], focus: "hinge" },
      { label: "Rest", primary: [], focus: "rest" },
      { label: "Rest", primary: [], focus: "rest" },
    ],
  },
};

const SEED_MAXES = {
  bench_press: { weight: 275, reps: 1 },
  deadlift: { weight: 455, reps: 1 },
  squat: { weight: 350, reps: 1 },
  ohp: { weight: 135, reps: 4 },
  barbell_row: { weight: 225, reps: 10 },
};

function estimate1RM(weight, reps) {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function prescribeLoad(e1rm, goal) {
  const preset = GOAL_PRESETS[goal];
  const [lo, hi] = preset.intensity;
  const mid = (lo + hi) / 2;
  return Math.round((e1rm * mid) / 100 / 5) * 5;
}

function prescribeSetsReps(goal, isPrimary) {
  const p = GOAL_PRESETS[goal];
  if (isPrimary) {
    const sets = goal === "strength" ? 5 : 4;
    const reps = goal === "strength" ? `${p.repRange[0]}-${p.repRange[1]}` : `${p.repRange[0]}-${p.repRange[1]}`;
    return { sets, reps };
  }
  return { sets: 3, reps: `${p.repRange[0] + 2}-${p.repRange[1] + 2}` };
}

function generateProgram(goal, splitKey, maxes) {
  const split = SPLIT_TEMPLATES[splitKey];
  const preset = GOAL_PRESETS[goal];

  return split.structure.map((day) => {
    if (day.focus === "rest") {
      return { ...day, exercises: [] };
    }

    const exercises = [];
    const exerciseKeys = Object.keys(EXERCISE_DB);

    day.primary.forEach((muscleId, idx) => {
      const candidates = exerciseKeys.filter(
        (k) => EXERCISE_DB[k].primary === muscleId && !exercises.find((e) => e.id === k)
      );

      const compounds = candidates.filter((k) => EXERCISE_DB[k].type === "compound");
      const isolations = candidates.filter((k) => EXERCISE_DB[k].type === "isolation");

      if (idx === 0 && compounds.length > 0) {
        const pick = compounds[0];
        const ex = EXERCISE_DB[pick];
        const max = maxes[pick];
        const e1rm = max ? estimate1RM(max.weight, max.reps) : null;
        const sr = prescribeSetsReps(goal, true);
        exercises.push({
          id: pick,
          name: ex.name,
          sets: sr.sets,
          reps: sr.reps,
          load: e1rm ? prescribeLoad(e1rm, goal) : null,
          e1rm,
          primary: muscleId,
          type: "compound",
        });
        if (compounds.length > 1) {
          const pick2 = compounds[1];
          const ex2 = EXERCISE_DB[pick2];
          const max2 = maxes[pick2];
          const e1rm2 = max2 ? estimate1RM(max2.weight, max2.reps) : null;
          const sr2 = prescribeSetsReps(goal, false);
          exercises.push({
            id: pick2,
            name: ex2.name,
            sets: sr2.sets,
            reps: sr2.reps,
            load: e1rm2 ? prescribeLoad(e1rm2, goal) : null,
            e1rm: e1rm2,
            primary: muscleId,
            type: "compound",
          });
        }
      } else if (compounds.length > 0) {
        const pick = compounds[0];
        const ex = EXERCISE_DB[pick];
        const max = maxes[pick];
        const e1rm = max ? estimate1RM(max.weight, max.reps) : null;
        const sr = prescribeSetsReps(goal, false);
        exercises.push({
          id: pick,
          name: ex.name,
          sets: sr.sets,
          reps: sr.reps,
          load: e1rm ? prescribeLoad(e1rm, goal) : null,
          e1rm,
          primary: muscleId,
          type: "compound",
        });
      }

      if (isolations.length > 0 && exercises.length < 6) {
        const pick = isolations[0];
        const ex = EXERCISE_DB[pick];
        exercises.push({
          id: pick,
          name: ex.name,
          sets: 3,
          reps: goal === "strength" ? "6-8" : "12-15",
          load: null,
          e1rm: null,
          primary: muscleId,
          type: "isolation",
        });
      }
    });

    return { ...day, exercises: exercises.slice(0, 6) };
  });
}

function computeFrequencyMap(program) {
  const freq = {};
  Object.keys(MUSCLE_GROUPS).forEach((k) => (freq[k] = { direct: 0, indirect: 0 }));
  program.forEach((day) => {
    if (day.focus === "rest") return;
    day.exercises.forEach((ex) => {
      if (freq[ex.primary]) freq[ex.primary].direct++;
      const exDef = EXERCISE_DB[ex.id];
      if (exDef) exDef.secondary.forEach((s) => { if (freq[s]) freq[s].indirect++; });
    });
  });
  return freq;
}

function computePhaseAnalysis(program) {
  const phases = {};
  Object.keys(MUSCLE_GROUPS).forEach((k) => {
    const hitDays = [];
    program.forEach((day, i) => {
      if (day.focus === "rest") return;
      const hits = day.exercises.filter((ex) => {
        if (ex.primary === k) return true;
        const def = EXERCISE_DB[ex.id];
        return def && def.secondary.includes(k);
      });
      if (hits.length > 0) hitDays.push(i);
    });
    const spacings = [];
    for (let i = 1; i < hitDays.length; i++) {
      spacings.push((hitDays[i] - hitDays[i - 1]) * 24);
    }
    const mg = MUSCLE_GROUPS[k];
    const inWindow = spacings.map((s) => s >= mg.window[0] && s <= mg.window[1]);
    phases[k] = { hitDays, spacings, inWindow, window: mg.window };
  });
  return phases;
}

// ---- Styles ----
const S = {
  app: {
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: FONT_BODY,
    minHeight: "100vh",
    padding: "0",
  },
  header: {
    padding: "32px 24px 24px",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  title: {
    fontFamily: FONT_MONO,
    fontSize: "13px",
    fontWeight: 500,
    color: COLORS.textMuted,
    letterSpacing: "2px",
    textTransform: "uppercase",
    margin: 0,
  },
  subtitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: COLORS.white,
    margin: "8px 0 0",
    letterSpacing: "-0.5px",
  },
  section: {
    padding: "24px",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  sectionTitle: {
    fontFamily: FONT_MONO,
    fontSize: "11px",
    fontWeight: 500,
    color: COLORS.textMuted,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    margin: "0 0 16px",
  },
  goalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  goalCard: (active) => ({
    background: active ? COLORS.accentDim : COLORS.surface,
    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
    borderRadius: "8px",
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  }),
  goalIcon: {
    fontSize: "20px",
    marginBottom: "8px",
    display: "block",
  },
  goalLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: COLORS.white,
    margin: "0 0 4px",
  },
  goalDesc: {
    fontSize: "11px",
    color: COLORS.textMuted,
    lineHeight: 1.4,
    margin: 0,
  },
  splitGrid: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  splitBtn: (active) => ({
    background: active ? COLORS.surface : "transparent",
    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    color: active ? COLORS.accent : COLORS.textMuted,
    transition: "all 0.15s ease",
  }),
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "6px",
    marginBottom: "20px",
  },
  dayCard: (isRest, isSelected) => ({
    background: isRest ? "transparent" : isSelected ? COLORS.surface : COLORS.surface,
    border: `1px solid ${isSelected ? COLORS.accent : isRest ? COLORS.border : COLORS.border}`,
    borderRadius: "8px",
    padding: "10px 8px",
    cursor: isRest ? "default" : "pointer",
    transition: "all 0.15s ease",
    opacity: isRest ? 0.4 : 1,
    minHeight: "80px",
  }),
  dayLabel: {
    fontFamily: FONT_MONO,
    fontSize: "10px",
    color: COLORS.textMuted,
    letterSpacing: "1px",
    textTransform: "uppercase",
    margin: "0 0 6px",
  },
  dayFocus: {
    fontSize: "12px",
    fontWeight: 600,
    color: COLORS.white,
    margin: "0 0 4px",
    lineHeight: 1.3,
  },
  dayMuscles: {
    display: "flex",
    flexWrap: "wrap",
    gap: "3px",
    marginTop: "6px",
  },
  musclePill: (color) => ({
    background: color + "20",
    color: color,
    fontSize: "9px",
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: "3px",
    letterSpacing: "0.3px",
  }),
  detailPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "10px",
    padding: "20px",
  },
  exerciseRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto auto",
    gap: "12px",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  exerciseName: {
    fontSize: "13px",
    fontWeight: 500,
    color: COLORS.white,
  },
  exerciseMeta: {
    fontFamily: FONT_MONO,
    fontSize: "12px",
    color: COLORS.textMuted,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  loadBadge: {
    fontFamily: FONT_MONO,
    fontSize: "12px",
    fontWeight: 600,
    color: COLORS.accent,
    background: COLORS.accentDim,
    padding: "2px 8px",
    borderRadius: "4px",
  },
  freqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "8px",
  },
  freqCard: (color) => ({
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    padding: "12px",
    borderLeft: `3px solid ${color}`,
  }),
  freqLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: COLORS.white,
    margin: "0 0 6px",
  },
  freqValue: {
    fontFamily: FONT_MONO,
    fontSize: "20px",
    fontWeight: 700,
    color: COLORS.white,
    margin: 0,
  },
  freqSub: {
    fontFamily: FONT_MONO,
    fontSize: "10px",
    color: COLORS.textMuted,
    margin: "2px 0 0",
  },
  phaseRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 0",
    fontSize: "12px",
  },
  phaseLabel: {
    width: "80px",
    fontWeight: 600,
    color: COLORS.white,
    fontSize: "12px",
  },
  phaseDot: (color, active) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: active ? color : COLORS.border,
    flexShrink: 0,
  }),
  phaseSpacing: (inWindow) => ({
    fontFamily: FONT_MONO,
    fontSize: "11px",
    color: inWindow ? COLORS.green : COLORS.amber,
    padding: "2px 6px",
    background: inWindow ? COLORS.greenDim : COLORS.amberDim,
    borderRadius: "3px",
  }),
  maxesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "8px",
  },
  maxCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    padding: "12px",
  },
  maxLabel: {
    fontSize: "11px",
    color: COLORS.textMuted,
    margin: "0 0 4px",
    fontWeight: 500,
  },
  maxInputRow: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  maxInput: {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "4px",
    padding: "6px 8px",
    color: COLORS.white,
    fontFamily: FONT_MONO,
    fontSize: "14px",
    fontWeight: 600,
    width: "70px",
    textAlign: "center",
    outline: "none",
  },
  maxUnit: {
    fontSize: "11px",
    color: COLORS.textMuted,
    fontFamily: FONT_MONO,
  },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PowerStackBuilder() {
  const [goal, setGoal] = useState("strength");
  const [splitKey, setSplitKey] = useState("ul_5");
  const [selectedDay, setSelectedDay] = useState(0);
  const [maxes, setMaxes] = useState(SEED_MAXES);

  const updateMax = useCallback((exId, field, value) => {
    setMaxes((prev) => ({
      ...prev,
      [exId]: { ...prev[exId], [field]: Number(value) || 0 },
    }));
  }, []);

  const program = useMemo(() => generateProgram(goal, splitKey, maxes), [goal, splitKey, maxes]);
  const freqMap = useMemo(() => computeFrequencyMap(program), [program]);
  const phases = useMemo(() => computePhaseAnalysis(program), [program]);

  const selectedDayData = program[selectedDay];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <p style={S.title}>Power Stack</p>
        <h1 style={S.subtitle}>Program Builder</h1>
      </div>

      {/* Goal selection */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Training goal</p>
        <div style={S.goalGrid}>
          {Object.entries(GOAL_PRESETS).map(([key, preset]) => (
            <div key={key} style={S.goalCard(goal === key)} onClick={() => setGoal(key)}>
              <span style={S.goalIcon}>{preset.icon}</span>
              <p style={S.goalLabel}>{preset.label}</p>
              <p style={S.goalDesc}>{preset.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Known maxes */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Known maxes</p>
        <div style={S.maxesGrid}>
          {Object.entries(SEED_MAXES).map(([exId]) => {
            const ex = EXERCISE_DB[exId];
            const m = maxes[exId] || { weight: 0, reps: 1 };
            const e1 = estimate1RM(m.weight, m.reps);
            return (
              <div key={exId} style={S.maxCard}>
                <p style={S.maxLabel}>{ex.name}</p>
                <div style={S.maxInputRow}>
                  <input
                    style={S.maxInput}
                    value={m.weight}
                    onChange={(e) => updateMax(exId, "weight", e.target.value)}
                  />
                  <span style={S.maxUnit}>lbs</span>
                  <span style={{ ...S.maxUnit, color: COLORS.textDim }}>×</span>
                  <input
                    style={{ ...S.maxInput, width: "36px" }}
                    value={m.reps}
                    onChange={(e) => updateMax(exId, "reps", e.target.value)}
                  />
                </div>
                <p style={{ ...S.maxUnit, marginTop: "6px" }}>
                  e1RM: <span style={{ color: COLORS.accent, fontWeight: 600 }}>{e1}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split selection */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Split template</p>
        <div style={S.splitGrid}>
          {Object.entries(SPLIT_TEMPLATES).map(([key, tmpl]) => (
            <button key={key} style={S.splitBtn(splitKey === key)} onClick={() => { setSplitKey(key); setSelectedDay(0); }}>
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly overview */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Weekly split</p>
        <div style={S.weekGrid}>
          {program.map((day, i) => {
            const isRest = day.focus === "rest";
            return (
              <div
                key={i}
                style={S.dayCard(isRest, selectedDay === i)}
                onClick={() => !isRest && setSelectedDay(i)}
              >
                <p style={S.dayLabel}>{DAYS[i]}</p>
                <p style={S.dayFocus}>{day.label}</p>
                {!isRest && (
                  <div style={S.dayMuscles}>
                    {day.primary.map((m) => (
                      <span key={m} style={S.musclePill(MUSCLE_GROUPS[m]?.color || COLORS.textMuted)}>
                        {MUSCLE_GROUPS[m]?.label || m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day detail */}
        {selectedDayData && selectedDayData.focus !== "rest" && (
          <div style={S.detailPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: COLORS.white, margin: 0 }}>
                  {selectedDayData.label}
                </p>
                <p style={{ fontSize: "12px", color: COLORS.textMuted, margin: "4px 0 0" }}>
                  {DAYS[selectedDay]} — {GOAL_PRESETS[goal].label} protocol
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: FONT_MONO, fontSize: "11px", color: COLORS.textMuted, margin: 0 }}>
                  {selectedDayData.exercises.length} exercises
                </p>
                <p style={{ fontFamily: FONT_MONO, fontSize: "11px", color: COLORS.textMuted, margin: "2px 0 0" }}>
                  rest: {GOAL_PRESETS[goal].restRange[0]}–{GOAL_PRESETS[goal].restRange[1]}s
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "12px", padding: "8px 0", borderBottom: `1px solid ${COLORS.borderActive}` }}>
              <span style={{ fontSize: "10px", color: COLORS.textDim, fontFamily: FONT_MONO, letterSpacing: "1px", textTransform: "uppercase" }}>Exercise</span>
              <span style={{ fontSize: "10px", color: COLORS.textDim, fontFamily: FONT_MONO, letterSpacing: "1px", textTransform: "uppercase", textAlign: "right" }}>Sets</span>
              <span style={{ fontSize: "10px", color: COLORS.textDim, fontFamily: FONT_MONO, letterSpacing: "1px", textTransform: "uppercase", textAlign: "right" }}>Reps</span>
              <span style={{ fontSize: "10px", color: COLORS.textDim, fontFamily: FONT_MONO, letterSpacing: "1px", textTransform: "uppercase", textAlign: "right" }}>Load</span>
            </div>

            {selectedDayData.exercises.map((ex, i) => (
              <div key={i} style={{ ...S.exerciseRow, borderBottom: i === selectedDayData.exercises.length - 1 ? "none" : `1px solid ${COLORS.border}` }}>
                <div>
                  <span style={S.exerciseName}>{ex.name}</span>
                  <span style={{ ...S.musclePill(MUSCLE_GROUPS[ex.primary]?.color || COLORS.textMuted), marginLeft: "8px", fontSize: "9px" }}>
                    {MUSCLE_GROUPS[ex.primary]?.label}
                  </span>
                </div>
                <span style={S.exerciseMeta}>{ex.sets}</span>
                <span style={S.exerciseMeta}>{ex.reps}</span>
                <span style={ex.load ? S.loadBadge : { ...S.exerciseMeta, color: COLORS.textDim }}>
                  {ex.load ? `${ex.load} lbs` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Frequency analysis */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Weekly frequency (direct + indirect stimulus)</p>
        <div style={S.freqGrid}>
          {Object.entries(MUSCLE_GROUPS).map(([key, mg]) => {
            const f = freqMap[key];
            return (
              <div key={key} style={S.freqCard(mg.color)}>
                <p style={S.freqLabel}>{mg.label}</p>
                <p style={S.freqValue}>{f.direct}</p>
                <p style={S.freqSub}>
                  +{f.indirect} indirect
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase analysis */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Phase analysis — supercompensation window alignment</p>
        {Object.entries(phases).map(([key, ph]) => {
          const mg = MUSCLE_GROUPS[key];
          if (ph.hitDays.length === 0) return null;
          return (
            <div key={key} style={S.phaseRow}>
              <span style={S.phaseLabel}>{mg.label}</span>
              <div style={{ display: "flex", gap: "3px", width: "140px" }}>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <div key={d} style={S.phaseDot(mg.color, ph.hitDays.includes(d))} />
                ))}
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {ph.spacings.map((s, i) => (
                  <span key={i} style={S.phaseSpacing(ph.inWindow[i])}>
                    {s}h
                  </span>
                ))}
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: "10px", color: COLORS.textDim, marginLeft: "auto" }}>
                window: {mg.window[0]}–{mg.window[1]}h
              </span>
            </div>
          );
        })}
        <p style={{ fontSize: "11px", color: COLORS.textMuted, marginTop: "12px", lineHeight: 1.5 }}>
          <span style={{ color: COLORS.green }}>●</span> spacing within supercompensation window &nbsp;
          <span style={{ color: COLORS.amber }}>●</span> spacing outside optimal window
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: "10px", color: COLORS.textDim, letterSpacing: "1px" }}>
          POWER STACK v0.1 — PROGRAM BUILDER — POLYPHASE SPLIT OPTIMIZATION
        </p>
      </div>
    </div>
  );
}
