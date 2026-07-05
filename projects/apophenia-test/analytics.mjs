// ============================================================================
// The Apophenia Filter — population analytics
//   node analytics.mjs <sessions.json | directory-of-session-json>
//
// Pure over the instrument's contributed payloads (see buildPayload in the app).
// Excludes pilot sessions; pools within a PARAMS_HASH. Produces the population
// report: quadrant distribution, Brier + apophenia distributions, the class-wide
// sentinel check, per-mechanism×tier accuracy vs oracle ceiling, and a
// calibration/reliability curve (structured vs noise).
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";

export const CEILING = {
  momentum: { subtle: 63, standard: 73, sentinel: 88 },
  meanrev:  { subtle: 65, standard: 73, sentinel: 93 },
  regime:   { subtle: 66, standard: 77, sentinel: 94 },
};

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const pct = (n, d) => (d ? (100 * n) / d : 0);

export function analyze(payloads) {
  const all = payloads.filter(
    (p) => p && p.instrument === "apophenia-filter" && p.summary && Array.isArray(p.trials)
  );
  const pilot = all.filter((p) => p.pilot);
  const pool = all.filter((p) => !p.pilot);
  const hashes = [...new Set(pool.map((p) => p.paramsHash))];
  const participants = new Set(pool.map((p) => p.participantId)).size;
  const bySize = {};
  pool.forEach((p) => (bySize[p.sessionSize] = (bySize[p.sessionSize] || 0) + 1));

  // quadrant distribution
  const quad = { A: 0, B: 0, C: 0, D: 0, "—": 0 };
  pool.forEach((p) => (quad[p.summary.quadrant] = (quad[p.summary.quadrant] || 0) + 1));

  const briers = pool.map((p) => p.summary.meanBrier).filter((x) => x != null);
  const beat = briers.filter((b) => b < 0.25).length;
  const apos = pool.map((p) => p.summary.apopheniaIndex).filter((x) => x != null);
  const restrained = pool.filter(
    (p) => p.summary.apopheniaIndex <= 10 || p.summary.abstainRateNoise >= 0.4
  ).length;
  const sensitive = pool.filter((p) => ["A", "C"].includes(p.summary.quadrant)).length;

  // class-wide sentinel check (instrument self-diagnosis)
  let sentC = 0, sentN = 0;
  pool.forEach((p) =>
    p.trials.forEach((t) => {
      if (t.mech !== "noise" && t.tier === "sentinel" && t.correct !== null) {
        sentN++;
        if (t.correct) sentC++;
      }
    })
  );
  const sentHit = sentN ? sentC / sentN : null;

  // per mechanism × tier: pooled human accuracy vs oracle ceiling
  const mt = {};
  pool.forEach((p) =>
    p.trials.forEach((t) => {
      if (t.mech !== "noise" && t.correct !== null) {
        const k = `${t.mech}|${t.tier}`;
        (mt[k] = mt[k] || { c: 0, n: 0 });
        mt[k].n++;
        if (t.correct) mt[k].c++;
      }
    })
  );
  const order = { subtle: 0, standard: 1, sentinel: 2 };
  const mechTier = Object.entries(mt)
    .map(([k, v]) => {
      const [mech, tier] = k.split("|");
      return { mech, tier, acc: v.c / v.n, n: v.n, ceiling: CEILING[mech][tier] };
    })
    .sort((a, b) => a.mech.localeCompare(b.mech) || order[a.tier] - order[b.tier]);

  // calibration / reliability: committed calls binned by stated confidence
  const bins = {};
  pool.forEach((p) =>
    p.trials.forEach((t) => {
      if (t.dir === "abstain" || t.correct === null) return;
      const cat = t.mech === "noise" ? "noise" : "struct";
      (bins[t.conf] = bins[t.conf] || { struct: { c: 0, n: 0 }, noise: { c: 0, n: 0 } });
      bins[t.conf][cat].n++;
      if (t.correct) bins[t.conf][cat].c++;
    })
  );

  return {
    counts: { total: all.length, pilot: pilot.length, pool: pool.length, participants, bySize, hashes },
    quad,
    brier: { mean: mean(briers), median: median(briers), beatPct: pct(beat, pool.length) },
    apophenia: { mean: mean(apos), median: median(apos), restrainedPct: pct(restrained, pool.length) },
    sensitivePct: pct(sensitive, pool.length),
    sentinel: { hit: sentHit, n: sentN, classWideJump: sentHit !== null && sentHit < 0.75 },
    mechTier,
    reliability: bins,
  };
}

export function formatReport(r) {
  const L = [];
  const p1 = (x) => (x == null ? "—" : x.toFixed(1));
  const p3 = (x) => (x == null ? "—" : x.toFixed(3));
  L.push("╔═══ THE APOPHENIA FILTER — POPULATION REPORT ═══════════════════════╗");
  L.push(`  sessions: ${r.counts.total}  (pilot excluded: ${r.counts.pilot}, analysis pool: ${r.counts.pool})`);
  L.push(`  unique participants: ${r.counts.participants}   by deck: ${JSON.stringify(r.counts.bySize)}`);
  L.push(`  params hashes pooled: ${r.counts.hashes.length} ${r.counts.hashes.length > 1 ? "⚠ MULTIPLE — do not pool across hashes!" : ""}`);
  L.push("");
  L.push("  QUADRANT DISTRIBUTION");
  for (const q of ["A", "B", "C", "D", "—"]) {
    const n = r.quad[q] || 0;
    const bar = "█".repeat(Math.round(pct(n, r.counts.pool) / 3));
    const name = { A: "Discriminator", B: "Calibrated-insensitive", C: "Undecidable", D: "Apophenic", "—": "Unclassifiable" }[q];
    L.push(`    ${q}  ${String(n).padStart(4)}  ${pct(n, r.counts.pool).toFixed(1).padStart(5)}%  ${bar}  ${name}`);
  }
  L.push("");
  L.push(`  BRIER      mean ${p3(r.brier.mean)}  median ${p3(r.brier.median)}   beat 0.250: ${r.brier.beatPct.toFixed(1)}%`);
  L.push(`  APOPHENIA  mean ${p1(r.apophenia.mean)}  median ${p1(r.apophenia.median)}   restrained: ${r.apophenia.restrainedPct.toFixed(1)}%`);
  L.push(`  SENSITIVE (significant): ${r.sensitivePct.toFixed(1)}%`);
  L.push("");
  const sj = r.sentinel;
  L.push(`  SENTINEL SELF-CHECK  population hit rate ${sj.hit == null ? "—" : (100 * sj.hit).toFixed(1) + "%"} (n=${sj.n})  ${sj.classWideJump ? "⚠ CLASS-WIDE JUMP — instrument may be indicted" : "✓ healthy"}`);
  L.push("");
  L.push("  HUMAN vs ORACLE CEILING (pooled committed calls)");
  L.push("    mech        tier      you     ceiling  gap    n");
  for (const m of r.mechTier) {
    L.push(`    ${m.mech.padEnd(10)}  ${m.tier.padEnd(8)}  ${(100 * m.acc).toFixed(1).padStart(5)}%   ${String(m.ceiling).padStart(3)}%    ${(m.ceiling - 100 * m.acc).toFixed(1).padStart(5)}  ${m.n}`);
  }
  L.push("");
  L.push("  CALIBRATION (empirical accuracy vs stated confidence)");
  L.push("    conf   structured(acc/n)     noise(acc/n)   [noise flat ≈ 50% while conf climbs = apophenia]");
  for (const c of Object.keys(r.reliability).map(Number).sort((a, b) => a - b)) {
    const b = r.reliability[c];
    const s = b.struct.n ? `${(100 * b.struct.c / b.struct.n).toFixed(0)}% / ${b.struct.n}` : "—";
    const nz = b.noise.n ? `${(100 * b.noise.c / b.noise.n).toFixed(0)}% / ${b.noise.n}` : "—";
    L.push(`    ${String(c).padStart(3)}%   ${s.padEnd(20)} ${nz}`);
  }
  L.push("╚════════════════════════════════════════════════════════════════════╝");
  return L.join("\n");
}

// CLI (robust cross-platform main-module check)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fs = await import("node:fs");
  const path = process.argv[2];
  if (!path) { console.error("usage: node analytics.mjs <sessions.json | dir>"); process.exit(1); }
  // Accepts: a bare payload, an array of payloads, an array of Supabase rows
  // ({id, received_at, payload}), or {rows:[...]}. Unwraps .payload as needed.
  const unwrap = (x) => (x && x.payload && !x.instrument ? x.payload : x);
  const toList = (j) => (Array.isArray(j) ? j : Array.isArray(j.rows) ? j.rows : [j]).map(unwrap);
  const readAny = (file) => {
    const txt = fs.readFileSync(file, "utf8");
    if (file.endsWith(".jsonl")) // one JSON object per line (the Pi's append-only format)
      return txt.split("\n").filter((l) => l.trim()).map((l) => unwrap(JSON.parse(l)));
    return toList(JSON.parse(txt));
  };
  let payloads = [];
  const st = fs.statSync(path);
  if (st.isDirectory()) {
    for (const f of fs.readdirSync(path).filter((f) => /\.jsonl?$/.test(f)))
      payloads.push(...readAny(`${path}/${f}`));
  } else {
    payloads = readAny(path);
  }
  console.log(formatReport(analyze(payloads)));
}
