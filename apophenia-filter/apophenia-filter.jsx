import { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   THE APOPHENIA FILTER — v0.4
   Retuned + participant identity build.

   New in v0.4:
   - Generators retuned per tier against Monte Carlo ORACLE
     CEILINGS (an observer that knows the latent state).
     Ceilings are displayed in the report so human performance
     is always read relative to what is achievable.
   - Pseudonymous participant ID: random UUID-ish token in
     localStorage (safe try/catch fallback to an ephemeral
     in-memory ID where storage is unavailable, e.g. previews).
   - Optional codename for cross-device continuity.
   - Pilot flag: sessions by the developer/testers are tagged
     pilot:true and excluded from the analysis pool by rule.

   NOTE: localStorage works on a normal website (peirastes.com)
   but not inside claude.ai artifact previews — there the ID
   gracefully degrades to ephemeral and the UI says so.

   BACKEND SETUP (Supabase example):
   1. Create a project at supabase.com (free tier).
   2. create table sessions (
        id uuid default gen_random_uuid() primary key,
        received_at timestamptz default now(),
        payload jsonb );
      Enable RLS; add policy allowing INSERT for anon role only.
   3. Fill in CONFIG below.
   ============================================================ */

const CONFIG = {
  CONTRIBUTE_ENDPOINT: "", // e.g. "https://xyz.supabase.co/rest/v1/sessions"
  API_KEY: "",             // Supabase anon key (insert-only via RLS)
};

const VERSION = "0.4.0";
const PARAMS_HASH =
  "v0.4|mom(phi .82/.92/.99, sd.25, obs.7)|mr(k.04 s0 / k.12 s1.5 / k.12 s8 @VIS-4)|reg(mu.30 p.06 / .45 p.04 / .90 p.01)";

// Monte Carlo oracle ceilings (N=30k) for the parameters below.
// Re-run the tuning harness and update these if params change.
const CEILING = {
  momentum: { subtle: 63, standard: 73, sentinel: 88 },
  meanrev: { subtle: 65, standard: 73, sentinel: 93 },
  regime: { subtle: 66, standard: 77, sentinel: 94 },
};

const MECH_PARAMS = {
  momentum: {
    sd: 0.25,
    obs: 0.7,
    subtle: { phi: 0.82 },
    standard: { phi: 0.92 },
    sentinel: { phi: 0.99 },
  },
  meanrev: {
    subtle: { k: 0.04, shock: 0 },
    standard: { k: 0.12, shock: 1.5 },
    sentinel: { k: 0.12, shock: 8 },
  },
  regime: {
    subtle: { mu: 0.3, pS: 0.06 },
    standard: { mu: 0.45, pS: 0.04 },
    sentinel: { mu: 0.9, pS: 0.01 },
  },
};

// ---------- palette (Peirastes v2 — Cinematic in-world instrument) ----------
const C = {
  ink: "transparent",                 // app sits on the wrapper's banner + void
  chamber: "#080d18",                 // recessed chart well / screen
  panel: "rgba(12, 18, 28, 0.60)",    // acrylic glass panel
  line: "rgba(255, 255, 255, 0.09)",  // hairline border
  text: "#e6ebf4",
  dim: "#8b97ab",
  brass: "#ffae20",                   // instrument gold — accent / CTA
  trace: "#7dd6ff",                   // cyan — data trace
  up: "#40d870",                      // green — confirmed / up
  down: "#ff7a6f",                    // coral — wrong / down
};

const VIS = 60;
const FUT = 12;

// ---------- seeded PRNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeGauss(rng) {
  return function () {
    let u = 0, v = 0;
    while (!u) u = rng();
    while (!v) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}
const newSeed = () => Math.floor(Math.random() * 4294967296);

// ---------- participant identity ----------
function loadIdentity() {
  try {
    const KP = "apophenia_pid", KC = "apophenia_codename";
    let pid = window.localStorage.getItem(KP);
    if (!pid) {
      pid = `p-${Date.now().toString(36)}-${newSeed().toString(36)}`;
      window.localStorage.setItem(KP, pid);
    }
    const codename = window.localStorage.getItem(KC) || "";
    return { pid, codename, persistent: true };
  } catch (e) {
    return {
      pid: `ephemeral-${newSeed().toString(36)}`,
      codename: "",
      persistent: false,
    };
  }
}
function saveCodename(name) {
  try {
    window.localStorage.setItem("apophenia_codename", name);
  } catch (e) {
    /* ephemeral context — ignore */
  }
}

const MECH_LABEL = {
  noise: "Pure noise (martingale)",
  momentum: "Momentum (AR drift)",
  meanrev: "Mean reversion (OU)",
  regime: "Regime switching (hidden Markov)",
};

const TIER_LABEL = { subtle: "SUBTLE", standard: "STANDARD", sentinel: "SENTINEL" };

function genSeries(mech, tierKey, seed) {
  const rng = mulberry32(seed);
  const gauss = makeGauss(rng);
  const n = VIS + FUT + 1;
  const xs = [0];
  if (mech === "noise") {
    for (let i = 1; i < n; i++) xs.push(xs[i - 1] + gauss());
  } else if (mech === "momentum") {
    const { sd, obs } = MECH_PARAMS.momentum;
    const { phi } = MECH_PARAMS.momentum[tierKey];
    let d = 0;
    for (let i = 1; i < n; i++) {
      d = phi * d + sd * gauss();
      xs.push(xs[i - 1] + d + obs * gauss());
    }
  } else if (mech === "meanrev") {
    const { k, shock } = MECH_PARAMS.meanrev[tierKey];
    const sh = shock * (rng() < 0.5 ? 1 : -1);
    for (let i = 1; i < n; i++) {
      let dx = -k * xs[i - 1] + gauss();
      if (shock && i === VIS - 4) dx += sh;
      xs.push(xs[i - 1] + dx);
    }
  } else {
    const { mu, pS } = MECH_PARAMS.regime[tierKey];
    let s = rng() < 0.5 ? 1 : -1;
    for (let i = 1; i < n; i++) {
      if (rng() < pS) s = -s;
      xs.push(xs[i - 1] + s * mu + gauss());
    }
  }
  return xs;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(size) {
  const deck = [];
  const push = (mech, tier, count) => {
    for (let i = 0; i < count; i++) deck.push({ mech, tier, seed: newSeed() });
  };
  if (size === "full") {
    push("noise", "standard", 9);
    ["momentum", "meanrev", "regime"].forEach((m) => {
      push(m, "sentinel", 1);
      push(m, "standard", 2);
      push(m, "subtle", 2);
    });
  } else {
    push("noise", "standard", 5);
    push("momentum", "sentinel", 1);
    push("regime", "sentinel", 1);
    push("momentum", "standard", 1);
    push("meanrev", "standard", 1);
    push("regime", "standard", 1);
    push("meanrev", "subtle", 1);
    push("momentum", "subtle", 1);
  }
  return shuffle(deck);
}

// ---------- chart ----------
function TraceChart({ series, revealIdx, outcome }) {
  const W = 560, H = 250, PAD = 12;
  const tubeW = 46;
  const plotW = W - tubeW - 18;
  const shown = series.slice(0, VIS + 1 + revealIdx);
  const lo = Math.min(...series) - 1;
  const hi = Math.max(...series) + 1;
  const y = (v) => PAD + (1 - (v - lo) / (hi - lo)) * (H - 2 * PAD);
  const x = (i) => PAD + (i / (VIS + FUT)) * (plotW - 2 * PAD);

  const histPts = shown.slice(0, VIS + 1).map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const futPts = shown.length > VIS + 1
    ? shown.slice(VIS).map((v, i) => `${x(VIS + i)},${y(v)}`).join(" ")
    : null;
  const cur = shown[shown.length - 1];
  const anchorY = y(series[VIS]);
  const ballY = y(cur);
  const tubeX = plotW + 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <defs>
        <linearGradient id="fluid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#142240" />
          <stop offset="1" stopColor="#0A101F" />
        </linearGradient>
        <radialGradient id="ball" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stopColor="#F6DE9B" />
          <stop offset="0.55" stopColor={C.brass} />
          <stop offset="1" stopColor="#8A6E2C" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={plotW} height={H} rx="10" fill={C.chamber} />
      <line x1={PAD} y1={anchorY} x2={plotW - PAD} y2={anchorY}
        stroke={C.dim} strokeWidth="1" strokeDasharray="3 5" opacity="0.6" />
      <line x1={x(VIS)} y1={PAD} x2={x(VIS)} y2={H - PAD}
        stroke={C.brass} strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      <polyline points={histPts} fill="none" stroke={C.trace} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
      {futPts && (
        <polyline points={futPts} fill="none"
          stroke={outcome === null ? C.brass : outcome ? C.up : C.down}
          strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      )}
      <rect x={tubeX} y="0" width={tubeW} height={H} rx="12"
        fill="url(#fluid)" stroke={C.line} strokeWidth="1" />
      <line x1={tubeX + 6} y1={anchorY} x2={tubeX + tubeW - 6} y2={anchorY}
        stroke={C.dim} strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
      <circle cx={tubeX + tubeW / 2} cy={ballY} r="11" fill="url(#ball)" />
      <circle cx={tubeX + tubeW / 2} cy={ballY} r="15" fill="none"
        stroke={C.brass} strokeWidth="1" opacity="0.25" />
    </svg>
  );
}

// ---------- quadrant compass (2x2) ----------
// Axes reproduce the classifier's own thresholds so the marker always lands
// in the labeled cell:  x = sensitivity (structAcc vs 0.60),
// y = restraint (max of the two OR-arms: apophenia<=10 OR noiseAbstain>=0.4).
function CompassGrid({ quadrant, structAcc, structN, apophenia, abstainRateNoise }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const gx = 52, gy = 18, gw = 232, gh = 232;
  const cx = gx + gw / 2, cy = gy + gh / 2, pad = 28;
  const unclass = structAcc === null || structN < 3;
  const nSens = structAcc === null ? 0 : clamp((structAcc - 0.6) / 0.4, -1, 1);
  const R = Math.max(
    clamp((10 - apophenia) / 10, -1, 1),
    clamp((abstainRateNoise - 0.4) / 0.4, -1, 1)
  );
  const mx = cx + nSens * (gw / 2 - pad);
  const my = cy - R * (gh / 2 - pad);
  const colorOf = { A: C.up, B: C.trace, C: C.brass, D: C.down };
  const cells = [
    { k: "B", name: "Calibrated", x: gx, y: gy, lx: gx + 20, anchor: "start" },
    { k: "A", name: "Discriminator", x: cx, y: gy, lx: gx + gw - 20, anchor: "end" },
    { k: "D", name: "Apophenic", x: gx, y: cy, lx: gx + 20, anchor: "start" },
    { k: "C", name: "Undecidable", x: cx, y: cy, lx: gx + gw - 20, anchor: "end" },
  ];
  const letterY = (c) => (c.y === gy ? gy + 40 : gy + gh - 30);
  const nameY = (c) => (c.y === gy ? gy + 54 : gy + gh - 16);
  return (
    <svg viewBox="0 0 320 278" style={{ width: "100%", maxWidth: 340, display: "block", margin: "4px auto 0" }}>
      {cells.map((c) => {
        const on = !unclass && quadrant === c.k;
        const col = colorOf[c.k];
        return (
          <g key={c.k}>
            <rect x={c.x} y={c.y} width={gw / 2} height={gh / 2}
              fill={col} opacity={on ? 0.14 : 0.03}
              stroke={on ? col : "none"} strokeWidth={on ? 1.5 : 0} />
            <text x={c.lx} y={letterY(c)} textAnchor={c.anchor}
              fontFamily="'Orbitron', sans-serif" fontWeight="700" fontSize="30"
              fill={col} opacity={on ? 1 : 0.38}>{c.k}</text>
            <text x={c.lx} y={nameY(c)} textAnchor={c.anchor}
              fontFamily="'Inter', sans-serif" fontSize="9" letterSpacing="0.06em"
              fill={col} opacity={on ? 0.9 : 0.32}>{c.name.toUpperCase()}</text>
          </g>
        );
      })}
      <rect x={gx} y={gy} width={gw} height={gh} fill="none" stroke={C.line} strokeWidth="1" rx="6" />
      <line x1={cx} y1={gy} x2={cx} y2={gy + gh} stroke={C.line} strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
      <line x1={gx} y1={cy} x2={gx + gw} y2={cy} stroke={C.line} strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
      <text x={gx + gw / 4} y={gy + gh + 16} textAnchor="middle" fontFamily="'Share Tech Mono', monospace" fontSize="8.5" fill={C.dim} letterSpacing="0.1em">INSENSITIVE</text>
      <text x={gx + 3 * gw / 4} y={gy + gh + 16} textAnchor="middle" fontFamily="'Share Tech Mono', monospace" fontSize="8.5" fill={C.dim} letterSpacing="0.1em">SENSITIVE →</text>
      <text x={16} y={gy + gh / 4} textAnchor="middle" transform={`rotate(-90 16 ${gy + gh / 4})`} fontFamily="'Share Tech Mono', monospace" fontSize="8.5" fill={C.dim} letterSpacing="0.1em">RESTRAINED</text>
      <text x={16} y={gy + 3 * gh / 4} textAnchor="middle" transform={`rotate(-90 16 ${gy + 3 * gh / 4})`} fontFamily="'Share Tech Mono', monospace" fontSize="8.5" fill={C.dim} letterSpacing="0.1em">UNRESTRAINED</text>
      {unclass ? (
        <>
          <circle cx={cx} cy={cy} r="7" fill="none" stroke={C.dim} strokeWidth="1.5" strokeDasharray="2 3" />
          <text x={cx} y={cy - 14} textAnchor="middle" fontFamily="'Share Tech Mono', monospace" fontSize="8" fill={C.dim}>TOO FEW CALLS</text>
        </>
      ) : (
        <>
          <circle cx={mx} cy={my} r="14" fill={colorOf[quadrant] || C.brass} opacity="0.22" />
          <circle cx={mx} cy={my} r="6" fill={C.brass} stroke="#fff" strokeWidth="1.5" />
          <text x={mx} y={my - 16} textAnchor="middle" fontFamily="'Share Tech Mono', monospace" fontSize="8.5" fill={C.text} letterSpacing="0.1em">YOU</text>
        </>
      )}
    </svg>
  );
}

// ---------- main ----------
export default function ApopheniaFilter() {
  const [phase, setPhase] = useState("intro");
  const [identity] = useState(loadIdentity);
  const [codename, setCodename] = useState(identity.codename);
  const [pilot, setPilot] = useState(false);
  const [sessionSize, setSessionSize] = useState(null);
  const [deck, setDeck] = useState([]);
  const [trialIdx, setTrialIdx] = useState(0);
  const [series, setSeries] = useState(null);
  const [revealIdx, setRevealIdx] = useState(0);
  const [dir, setDir] = useState(null);
  const [conf, setConf] = useState(65);
  const [records, setRecords] = useState([]);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [contribStatus, setContribStatus] = useState("idle");
  const timerRef = useRef(null);
  const trialStartRef = useRef(null);

  const reduceMotion = useMemo(
    () => typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const chooseSession = (size) => {
    setSessionSize(size);
    setPhase("disclosure");
  };

  const beginSession = () => {
    if (codename.trim()) saveCodename(codename.trim());
    const d = buildDeck(sessionSize);
    setDeck(d);
    setRecords([]);
    setTrialIdx(0);
    setContribStatus("idle");
    setSessionMeta({
      instrument: "apophenia-filter",
      version: VERSION,
      paramsHash: PARAMS_HASH,
      sessionId: `${Date.now().toString(36)}-${newSeed().toString(36)}`,
      participantId: identity.pid,
      participantPersistent: identity.persistent,
      codename: codename.trim() || null,
      pilot,
      sessionSize,
      startedAt: new Date().toISOString(),
    });
    loadTrial(d, 0);
  };

  const loadTrial = (d, i) => {
    setSeries(genSeries(d[i].mech, d[i].tier, d[i].seed));
    setRevealIdx(0);
    setDir(null);
    setConf(65);
    setPhase("predict");
    trialStartRef.current = performance.now();
  };

  const lockPrediction = (choice) => {
    setDir(choice);
    setPhase("reveal");
  };

  useEffect(() => {
    if (phase !== "reveal" || !series) return;
    if (reduceMotion) {
      setRevealIdx(FUT);
      setTimeout(() => setPhase("result"), 200);
      return;
    }
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      setRevealIdx(i);
      if (i >= FUT) {
        clearInterval(timerRef.current);
        setTimeout(() => setPhase("result"), 250);
      }
    }, 120);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "result" || !series || dir === null) return;
    if (records.length > trialIdx) return;
    const wentUp = series[VIS + FUT] > series[VIS];
    const usedConf = dir === "abstain" ? 50 : conf;
    const pUp = dir === "up" ? usedConf / 100 : dir === "down" ? 1 - usedConf / 100 : 0.5;
    const brier = Math.pow(pUp - (wentUp ? 1 : 0), 2);
    const correct = dir === "abstain" ? null : (pUp > 0.5) === wentUp;
    const rtMs = trialStartRef.current
      ? Math.round(performance.now() - trialStartRef.current)
      : null;
    setRecords((r) => [
      ...r,
      {
        trial: trialIdx + 1,
        seed: deck[trialIdx].seed,
        mech: deck[trialIdx].mech,
        tier: deck[trialIdx].tier,
        dir,
        conf: usedConf,
        wentUp,
        brier: +brier.toFixed(4),
        correct,
        rtMs,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const nextTrial = () => {
    const nxt = trialIdx + 1;
    if (nxt >= deck.length) setPhase("report");
    else {
      setTrialIdx(nxt);
      loadTrial(deck, nxt);
    }
  };

  // ---------- report ----------
  const report = useMemo(() => {
    if (!records.length) return null;
    const noise = records.filter((r) => r.mech === "noise");
    const struct = records.filter((r) => r.mech !== "noise");
    const meanBrier = records.reduce((s, r) => s + r.brier, 0) / records.length;

    const acc = (rs) => {
      const called = rs.filter((r) => r.correct !== null);
      return called.length
        ? { acc: called.filter((r) => r.correct).length / called.length, n: called.length }
        : { acc: null, n: 0 };
    };

    const structA = acc(struct);
    const noiseA = acc(noise);
    const apophenia = noise.length
      ? noise.reduce((s, r) => s + (r.conf - 50), 0) / noise.length
      : 0;
    const abstainRateNoise = noise.length
      ? noise.filter((r) => r.dir === "abstain").length / noise.length
      : 0;

    const curve = ["subtle", "standard", "sentinel"].map((t) => {
      const rs = struct.filter((r) => r.tier === t);
      const a = acc(rs);
      // average ceiling across mechanisms present in this tier's trials
      const ceil = rs.length
        ? rs.reduce((s, r) => s + CEILING[r.mech][r.tier], 0) / rs.length
        : null;
      return {
        tier: t, ...a, total: rs.length,
        abstained: rs.filter((r) => r.dir === "abstain").length,
        ceiling: ceil,
      };
    });

    const sentinels = struct.filter((r) => r.tier === "sentinel");
    const sentinelCalled = sentinels.filter((r) => r.correct !== null);
    const sentinelHit = sentinelCalled.length
      ? sentinelCalled.filter((r) => r.correct).length / sentinelCalled.length
      : null;
    const sentinelAbstains = sentinels.filter((r) => r.dir === "abstain").length;

    const sensitive = structA.acc !== null && structA.n >= 3 && structA.acc >= 0.6;
    const restrained = apophenia <= 10 || abstainRateNoise >= 0.4;
    let quadrant, qName, qDesc;
    if (structA.n < 3) {
      quadrant = "—";
      qName = "Unclassifiable";
      qDesc =
        "Too few committed calls on structured trajectories. The filter needs conviction to measure — abstention everywhere is calibrated, but it carries no discrimination signal.";
    } else if (sensitive && restrained) {
      quadrant = "A";
      qName = "Discriminator";
      qDesc =
        "Sensitive to embedded structure, restrained on martingales. This is the profile the instrument exists to find — and the one luck cannot sustain across repetition.";
    } else if (!sensitive && restrained) {
      quadrant = "B";
      qName = "Calibrated, insensitive";
      qDesc =
        "You knew what you didn't know — conviction was withheld where nothing was recoverable — but the embedded mechanisms weren't recovered either. Honest, and trainable: the limiting factor is perception, not judgment.";
    } else if (sensitive && !restrained) {
      quadrant = "C";
      qName = "Undecidable";
      qDesc =
        "Hits on structure, but conviction was also spent on pure noise. Real perception contaminated by apophenia — or luck. This profile cannot be resolved at this sample size. Only repetition separates it.";
    } else {
      quadrant = "D";
      qName = "Apophenic";
      qDesc =
        "Conviction everywhere, discrimination nowhere. Pattern perception is firing on martingales and missing real structure alike. This is the default human profile on financial charts.";
    }

    return {
      noise, struct, meanBrier, structA, noiseA, apophenia, abstainRateNoise,
      curve, sentinelHit, sentinelAbstains, sentinelN: sentinels.length,
      quadrant, qName, qDesc,
    };
  }, [records]);

  const instrumentNote = useMemo(() => {
    if (!report || report.sentinelN === 0) return null;
    if (report.sentinelHit !== null && report.sentinelHit < 0.5)
      return "Sentinel check: you missed the high-SNR trials near their oracle ceilings (88–94%). For a single subject this reads as an attention or perception signal — but if a population misses sentinels at this rate, the instrument's calibration is indicted, not the subjects.";
    if (report.sentinelAbstains === report.sentinelN)
      return "Sentinel check: you abstained on every sentinel. High-SNR structure was present and recoverable — abstention there is miscalibrated restraint, the mirror image of apophenia.";
    return "Sentinel check passed: high-SNR structure was recovered. The instrument is measuring you, not itself.";
  }, [report]);

  // ---------- data payload ----------
  const buildPayload = () => ({
    ...sessionMeta,
    completedAt: new Date().toISOString(),
    summary: report
      ? {
          quadrant: report.quadrant,
          meanBrier: +report.meanBrier.toFixed(4),
          structAcc: report.structA.acc,
          structN: report.structA.n,
          noiseAcc: report.noiseA.acc,
          apopheniaIndex: +report.apophenia.toFixed(2),
          abstainRateNoise: +report.abstainRateNoise.toFixed(3),
          sentinelHit: report.sentinelHit,
        }
      : null,
    trials: records,
  });

  const downloadResults = () => {
    const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apophenia-filter-${sessionMeta?.sessionId || "session"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const contribute = async () => {
    if (!CONFIG.CONTRIBUTE_ENDPOINT) {
      setContribStatus("error");
      return;
    }
    setContribStatus("sending");
    try {
      const headers = { "Content-Type": "application/json" };
      if (CONFIG.API_KEY) {
        headers["apikey"] = CONFIG.API_KEY;
        headers["Authorization"] = `Bearer ${CONFIG.API_KEY}`;
        headers["Prefer"] = "return=minimal";
      }
      const res = await fetch(CONFIG.CONTRIBUTE_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({ payload: buildPayload() }),
      });
      setContribStatus(res.ok ? "done" : "error");
    } catch (e) {
      setContribStatus("error");
    }
  };

  // ---------- styles ----------
  const S = {
    app: {
      minHeight: "100vh",
      background: C.ink,
      color: C.text,
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex",
      justifyContent: "center",
      padding: "84px 14px 72px", // top clears the fixed cinematic chrome row
    },
    col: { width: "100%", maxWidth: 620 },
    eyebrow: {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.22em",
      color: C.brass,
      textTransform: "uppercase",
      marginBottom: 6,
      textShadow: "0 0 8px rgba(255,174,32,0.35)",
    },
    title: {
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: 700,
      fontSize: "clamp(22px, 5.5vw, 32px)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      lineHeight: 1.1,
      margin: 0,
      color: C.brass,
      textShadow: "0 0 14px rgba(255,174,32,0.30)",
    },
    panel: {
      background: C.panel,
      backdropFilter: "blur(14px) saturate(1.3)",
      WebkitBackdropFilter: "blur(14px) saturate(1.3)",
      border: `1px solid ${C.line}`,
      borderRadius: 12,
      padding: 18,
      marginTop: 16,
      boxShadow:
        "0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    btn: (active, color) => ({
      flex: 1,
      padding: "13px 8px",
      borderRadius: 8,
      border: `1px solid ${active ? color || C.brass : "rgba(255,255,255,0.10)"}`,
      borderLeft: `2px solid ${active ? color || C.brass : "transparent"}`,
      background: active
        ? `linear-gradient(180deg, ${(color || C.brass)}26 0%, rgba(8,12,18,0.85) 100%)`
        : "linear-gradient(180deg, rgba(20,26,36,0.70) 0%, rgba(8,12,18,0.85) 100%)",
      color: active ? color || C.brass : "rgba(220,225,235,0.72)",
      fontFamily: "'Inter', sans-serif",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.14s ease",
      textShadow: active ? `0 0 6px ${(color || C.brass)}66` : "none",
      boxShadow: active
        ? `0 0 10px ${(color || C.brass)}22, inset 0 1px 0 rgba(255,255,255,0.05)`
        : "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.3)",
    }),
    primary: {
      width: "100%",
      padding: "14px",
      borderRadius: 9,
      border: "1px solid rgba(255,174,32,0.5)",
      background: "linear-gradient(180deg, #ffc250 0%, #ffae20 55%, #d98a10 100%)",
      color: "#1a1206",
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      cursor: "pointer",
      marginTop: 14,
      transition: "all 0.14s ease",
      boxShadow:
        "0 0 16px rgba(255,174,32,0.30), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.25)",
    },
    secondary: {
      width: "100%",
      padding: "13px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.12)",
      borderLeft: "2px solid transparent",
      background:
        "linear-gradient(180deg, rgba(20,26,36,0.72) 0%, rgba(8,12,18,0.88) 100%)",
      color: "rgba(220,225,235,0.82)",
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      fontSize: 12.5,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      cursor: "pointer",
      marginTop: 10,
      transition: "all 0.14s ease",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "11px 12px",
      borderRadius: 8,
      border: `1px solid ${C.line}`,
      background: "rgba(4,7,12,0.70)",
      color: C.text,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 13,
      marginTop: 8,
    },
    row: { display: "flex", gap: 8, marginTop: 12 },
    dataRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "9px 0",
      borderBottom: `1px solid ${C.line}`,
      fontSize: 13,
      gap: 12,
    },
    dim: { color: C.dim },
    p: { fontSize: 13.5, lineHeight: 1.65 },
    checkRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 14,
      fontSize: 12,
      color: C.dim,
      cursor: "pointer",
    },
  };

  const rec = records[trialIdx];

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&family=Inter:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
        input[type=range]{width:100%;accent-color:${C.brass};}
        input[type=checkbox]{accent-color:${C.brass};width:16px;height:16px;}
        button:focus-visible,input:focus-visible{outline:2px solid ${C.trace};outline-offset:2px;}`}</style>
      <div style={S.col}>

        {/* ---------------- INTRO ---------------- */}
        {phase === "intro" && (
          <div style={S.panel}>
            <p style={{ ...S.p, marginTop: 0 }}>
              A ball drifts in fluid, driven by hidden forces. Some trajectories
              contain real structure. Others are pure martingales: nothing to
              find. You call the ball's move — or admit you have no edge — and
              the instrument scores your calibration, not your bravado.
            </p>
            <p style={{ ...S.p, color: C.dim, fontSize: 12.5 }}>
              Luck cannot hold calibration across repetition. That is the entire
              design.
            </p>
            <div>
              <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em" }}>
                CODENAME (OPTIONAL) — reuse it to link your sessions across
                devices. Sessions stay anonymous either way.
              </div>
              <input
                style={S.input}
                value={codename}
                maxLength={32}
                placeholder="e.g. crimson-falcon"
                onChange={(e) => setCodename(e.target.value)}
              />
              {!identity.persistent && (
                <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>
                  Note: persistent storage unavailable in this preview — your
                  participant ID is ephemeral here. On the live site it persists
                  per browser.
                </div>
              )}
            </div>
            <label style={S.checkRow}>
              <input
                type="checkbox"
                checked={pilot}
                onChange={(e) => setPilot(e.target.checked)}
              />
              Pilot session (developer/tester — excluded from the analysis pool)
            </label>
            <div style={S.row}>
              <button style={S.btn(false)} onClick={() => chooseSession("quick")}>
                QUICK · 12 TRIALS
              </button>
              <button style={S.btn(false)} onClick={() => chooseSession("full")}>
                FULL LAB · 24 TRIALS
              </button>
            </div>
          </div>
        )}

        {/* ---------------- DISCLOSURE ---------------- */}
        {phase === "disclosure" && (
          <div style={S.panel}>
            <div style={{ ...S.eyebrow, marginBottom: 10 }}>
              Disclosure — what you're told before the exam
            </div>
            <p style={{ ...S.p, marginTop: 0 }}>
              The effort signal is only valid if you know what to study. So here
              is exactly what you will face:
            </p>
            <div style={S.dataRow}>
              <span style={S.dim}>Pure noise</span>
              <span style={{ textAlign: "right" }}>
                ~40% of trials. A martingale — no call can beat 50%. The correct
                action is <b>no edge</b>.
              </span>
            </div>
            <div style={S.dataRow}>
              <span style={S.dim}>Momentum</span>
              <span style={{ textAlign: "right" }}>
                Recent drift tends to persist. Read the slope.
              </span>
            </div>
            <div style={S.dataRow}>
              <span style={S.dim}>Mean reversion</span>
              <span style={{ textAlign: "right" }}>
                Displacement pulls back toward an anchor. Watch for a stretch
                or a spike that has begun to fade.
              </span>
            </div>
            <div style={{ ...S.dataRow, borderBottom: "none" }}>
              <span style={S.dim}>Regime switching</span>
              <span style={{ textAlign: "right" }}>
                A hidden drift that occasionally flips sign. Identify the
                current regime; respect that it can turn.
              </span>
            </div>
            <p style={{ ...S.p, fontSize: 12.5 }}>
              Structured trials come at three signal strengths:{" "}
              <span style={{ color: C.brass }}>subtle</span>,{" "}
              <span style={{ color: C.brass }}>standard</span>, and{" "}
              <span style={{ color: C.brass }}>sentinel</span>. Even a perfect
              observer cannot always be right — each tier has a known
              theoretical ceiling (roughly 65% / 75% / 90%), and your score is
              read against it.
            </p>
            <p style={{ ...S.p, fontSize: 12.5, color: C.dim, marginBottom: 0 }}>
              Abstaining is a legitimate, scored action — not a forfeit. A
              perpetual abstainer's Brier is 0.250. Every committed call is
              scored (confidence − outcome)², so overconfident randomness bleeds
              points. Mechanisms are revealed only in the final report.
            </p>
            <button style={S.primary} onClick={beginSession}>
              I know what to study — begin
            </button>
          </div>
        )}

        {/* ---------------- TRIAL ---------------- */}
        {(phase === "predict" || phase === "reveal" || phase === "result") &&
          series && (
            <>
              <div
                style={{
                  ...S.dataRow,
                  border: "none",
                  marginTop: 14,
                  fontSize: 12,
                  color: C.dim,
                }}
              >
                <span>
                  TRIAL {trialIdx + 1} / {deck.length}
                  {pilot ? " · PILOT" : ""}
                </span>
                <span>
                  RUNNING BRIER{" "}
                  {records.length
                    ? (
                        records.reduce((s, r) => s + r.brier, 0) / records.length
                      ).toFixed(3)
                    : "—"}
                </span>
              </div>

              <TraceChart
                series={series}
                revealIdx={revealIdx}
                outcome={phase === "result" && rec ? rec.correct : null}
              />

              {phase === "predict" && (
                <div style={S.panel}>
                  <div style={{ fontSize: 12, color: C.dim, letterSpacing: "0.1em" }}>
                    WHERE IS THE BALL IN {FUT} STEPS?
                  </div>
                  <div style={S.row}>
                    <button style={S.btn(dir === "up", C.up)} onClick={() => setDir("up")}>
                      ▲ HIGHER
                    </button>
                    <button style={S.btn(dir === "down", C.down)} onClick={() => setDir("down")}>
                      ▼ LOWER
                    </button>
                  </div>
                  {dir && dir !== "abstain" && (
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: C.dim,
                          marginBottom: 6,
                        }}
                      >
                        <span>CONFIDENCE</span>
                        <span style={{ color: C.brass, fontWeight: 600 }}>{conf}%</span>
                      </div>
                      <input
                        type="range"
                        min="55"
                        max="95"
                        step="5"
                        value={conf}
                        onChange={(e) => setConf(+e.target.value)}
                      />
                    </div>
                  )}
                  <div style={S.row}>
                    <button
                      style={S.btn(false, C.dim)}
                      onClick={() => lockPrediction("abstain")}
                    >
                      NO EDGE — ABSTAIN
                    </button>
                  </div>
                  {dir && dir !== "abstain" && (
                    <button style={S.primary} onClick={() => lockPrediction(dir)}>
                      Lock prediction
                    </button>
                  )}
                </div>
              )}

              {phase === "reveal" && (
                <div style={{ ...S.panel, textAlign: "center", color: C.dim, fontSize: 13 }}>
                  resolving…
                </div>
              )}

              {phase === "result" && rec && (
                <div style={S.panel}>
                  <div
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      color: rec.correct === null ? C.dim : rec.correct ? C.up : C.down,
                    }}
                  >
                    {rec.correct === null
                      ? "Abstained"
                      : rec.correct
                      ? "Correct call"
                      : "Wrong call"}
                  </div>
                  <div style={S.dataRow}>
                    <span style={S.dim}>Ball moved</span>
                    <span>{rec.wentUp ? "▲ higher" : "▼ lower"}</span>
                  </div>
                  <div style={S.dataRow}>
                    <span style={S.dim}>Your call</span>
                    <span>
                      {rec.dir === "abstain"
                        ? "no edge (50%)"
                        : `${rec.dir === "up" ? "▲" : "▼"} at ${rec.conf}%`}
                    </span>
                  </div>
                  <div style={{ ...S.dataRow, borderBottom: "none" }}>
                    <span style={S.dim}>Trial Brier</span>
                    <span style={{ color: C.brass }}>{rec.brier.toFixed(3)}</span>
                  </div>
                  <button style={S.primary} onClick={nextTrial}>
                    {trialIdx + 1 >= deck.length ? "See the report" : "Next trajectory"}
                  </button>
                </div>
              )}
            </>
          )}

        {/* ---------------- REPORT ---------------- */}
        {phase === "report" && report && (
          <>
            <div style={{ ...S.panel, borderColor: C.brass }}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>Classification</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontSize: 52,
                    color: C.brass,
                    lineHeight: 1,
                  }}
                >
                  {report.quadrant}
                </span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {report.qName}
                </span>
              </div>
              <p style={{ ...S.p, marginBottom: 0 }}>{report.qDesc}</p>
            </div>

            <div style={S.panel}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>The compass — where you landed</div>
              <CompassGrid
                quadrant={report.quadrant}
                structAcc={report.structA.acc}
                structN={report.structA.n}
                apophenia={report.apophenia}
                abstainRateNoise={report.abstainRateNoise}
              />
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 8, lineHeight: 1.5 }}>
                Horizontal — sensitivity to real structure (accuracy on structured
                trials, boundary 60%). Vertical — restraint on pure noise (low
                conviction, or high abstention). The dot is you; the lit cell is
                your classification.
              </div>
            </div>

            <div style={S.panel}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>Core metrics</div>
              <div style={S.dataRow}>
                <span style={S.dim}>
                  Mean Brier (yours){" "}
                  <span style={{ fontSize: 10.5, opacity: 0.7 }}>· lower is better</span>
                </span>
                <span style={{ color: report.meanBrier < 0.25 ? C.up : C.down, fontWeight: 600 }}>
                  {report.meanBrier.toFixed(3)} {report.meanBrier < 0.25 ? "✓" : "✗"}
                </span>
              </div>
              <div style={S.dataRow}>
                <span style={S.dim}>Perpetual abstainer <span style={{ fontSize: 10.5, opacity: 0.7 }}>· the bar to beat</span></span>
                <span>0.250</span>
              </div>
              <div style={S.dataRow}>
                <span style={S.dim}>Accuracy on structured</span>
                <span>
                  {report.structA.acc === null
                    ? "— (all abstained)"
                    : `${(report.structA.acc * 100).toFixed(0)}% (n=${report.structA.n})`}
                </span>
              </div>
              <div style={S.dataRow}>
                <span style={S.dim}>Accuracy on pure noise</span>
                <span>
                  {report.noiseA.acc === null
                    ? "— (all abstained)"
                    : `${(report.noiseA.acc * 100).toFixed(0)}% (chance: 50%)`}
                </span>
              </div>
              <div style={{ ...S.dataRow, borderBottom: "none" }}>
                <span style={S.dim}>Apophenia index</span>
                <span
                  style={{
                    color: report.apophenia > 15 ? C.down : C.up,
                    fontWeight: 600,
                  }}
                >
                  +{report.apophenia.toFixed(1)} conviction pts on noise
                </span>
              </div>
            </div>

            <div style={S.panel}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>
                Discrimination curve — you vs the oracle ceiling
              </div>
              {report.curve.map((c) => (
                <div key={c.tier} style={S.dataRow}>
                  <span style={S.dim}>{TIER_LABEL[c.tier]}</span>
                  <span>
                    {c.acc === null
                      ? c.total
                        ? "all abstained"
                        : "—"
                      : `you ${(c.acc * 100).toFixed(0)}%`}
                    {c.ceiling !== null && ` · ceiling ~${c.ceiling.toFixed(0)}%`}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 10, lineHeight: 1.5 }}>
                The ceiling is what an observer who knows the hidden state
                achieves — measured by Monte Carlo, not assumed. Your gap below
                it is the recoverable-but-unrecovered signal. Even perfection
                cannot exceed it: some of every trajectory is genuinely
                unknowable.
              </div>
              {instrumentNote && (
                <p style={{ ...S.p, fontSize: 12.5, marginBottom: 0 }}>
                  {instrumentNote}
                </p>
              )}
            </div>

            <div style={S.panel}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>Brier verdict</div>
              <p style={{ ...S.p, margin: 0 }}>
                {report.meanBrier < 0.25
                  ? "Your Brier beats the perpetual abstainer (0.250) — lower is better, and you came in under it. Calibration is holding; the question is whether it holds at n=100."
                  : "The perpetual abstainer — who never predicts anything — scored 0.250. Lower is better, and you came in above it, so you did not beat it. Sit with that before the next session."}
              </p>
            </div>

            <div style={S.panel}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>Your data</div>
              <p style={{ ...S.p, marginTop: 0, fontSize: 12.5, color: C.dim }}>
                Everything recorded this session: trial seeds (each trajectory
                is exactly reproducible), your calls, confidence, response
                times, participant ID ({identity.persistent ? "persistent, this browser only" : "ephemeral"}),
                codename if provided, and the instrument version. No name, no
                IP, no account. Contributing is optional and sends only what the
                download contains.
              </p>
              <button style={S.secondary} onClick={downloadResults}>
                ⬇ DOWNLOAD MY RESULTS (JSON)
              </button>
              <button
                style={{
                  ...S.secondary,
                  borderColor: contribStatus === "done" ? C.up : C.brass,
                  color: contribStatus === "done" ? C.up : C.brass,
                  opacity: contribStatus === "sending" ? 0.6 : 1,
                }}
                disabled={contribStatus === "sending" || contribStatus === "done"}
                onClick={contribute}
              >
                {contribStatus === "idle" && "CONTRIBUTE THIS SESSION TO THE RESEARCH DATASET"}
                {contribStatus === "sending" && "SENDING…"}
                {contribStatus === "done" && "✓ CONTRIBUTED — THANK YOU"}
                {contribStatus === "error" &&
                  (CONFIG.CONTRIBUTE_ENDPOINT
                    ? "FAILED — TAP TO RETRY"
                    : "ENDPOINT NOT CONFIGURED")}
              </button>
            </div>

            <div style={S.panel}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>
                The mechanisms, revealed
              </div>
              {records.map((r, i) => (
                <div key={i} style={S.dataRow}>
                  <span style={{ ...S.dim, fontSize: 12 }}>
                    {String(i + 1).padStart(2, "0")} · {MECH_LABEL[r.mech]}
                    {r.mech !== "noise" ? ` · ${TIER_LABEL[r.tier].toLowerCase()}` : ""}
                  </span>
                  <span
                    style={{
                      color: r.correct === null ? C.dim : r.correct ? C.up : C.down,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.dir === "abstain"
                      ? "abstained"
                      : `${r.dir === "up" ? "▲" : "▼"}${r.conf} ${r.correct ? "✓" : "✗"}`}
                  </span>
                </div>
              ))}
              <button style={S.primary} onClick={() => setPhase("intro")}>
                Run another session
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
