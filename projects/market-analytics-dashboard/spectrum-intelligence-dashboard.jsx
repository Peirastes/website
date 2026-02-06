import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Cell, Legend, ReferenceLine, PieChart, Pie
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════════
// SPECTRUM v2 — Multi-Dimensional Market Analytics + Live Intelligence Briefings
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ASSET REGISTRY ──────────────────────────────────────────────────────────

const ASSETS = {
  PLTR: { name: "Palantir Technologies", sector: "AI / Government Tech", type: "stock", color: "#1ae5a1" },
  ARRY: { name: "Array Technologies", sector: "Clean Energy", type: "stock", color: "#f59e0b" },
  QS: { name: "QuantumScape", sector: "EV Battery Tech", type: "stock", color: "#06b6d4" },
  SMCI: { name: "Super Micro Computer", sector: "AI Infrastructure", type: "stock", color: "#ef4444" },
  RKLB: { name: "Rocket Lab USA", sector: "Aerospace / Launch", type: "stock", color: "#a78bfa" },
  CRWV: { name: "CoreWeave", sector: "AI Cloud / GPU", type: "stock", color: "#22d3ee" },
  ASTS: { name: "AST SpaceMobile", sector: "Satellite / Telecom", type: "stock", color: "#fb923c" },
  DJT: { name: "Trump Media & Tech", sector: "Media / Social", type: "stock", color: "#f43f5e" },
  RGTI: { name: "Rigetti Computing", sector: "Quantum Computing", type: "stock", color: "#818cf8" },
  QBTS: { name: "D-Wave Quantum", sector: "Quantum Computing", type: "stock", color: "#2dd4bf" },
  AAPL: { name: "Apple Inc.", sector: "Technology", type: "stock", color: "#a3a3a3" },
  MSFT: { name: "Microsoft Corp.", sector: "Technology", type: "stock", color: "#38bdf8" },
  NVDA: { name: "NVIDIA Corp.", sector: "Semiconductors", type: "stock", color: "#84cc16" },
  TSLA: { name: "Tesla Inc.", sector: "EV / Energy", type: "stock", color: "#e11d48" },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology", type: "stock", color: "#4ade80" },
  META: { name: "Meta Platforms", sector: "Technology", type: "stock", color: "#60a5fa" },
  BTC: { name: "Bitcoin", sector: "Cryptocurrency", type: "crypto", color: "#f7931a" },
  ETH: { name: "Ethereum", sector: "Cryptocurrency", type: "crypto", color: "#627eea" },
  SOL: { name: "Solana", sector: "Cryptocurrency", type: "crypto", color: "#9945ff" },
};

// ─── SEEDED RNG + DATA GENERATION ────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateAssetData(ticker) {
  const rng = seededRandom(ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + Math.floor(Date.now() / 86400000));
  const r = () => rng();
  const asset = ASSETS[ticker];
  const isCrypto = asset?.type === "crypto";

  const basePrice = isCrypto
    ? (ticker === "BTC" ? 85000 + r() * 25000 : ticker === "ETH" ? 2500 + r() * 1500 : 100 + r() * 200)
    : 5 + r() * 400;
  const changePercent = (r() - 0.42) * 10;
  const price = basePrice * (1 + changePercent / 100);

  const dims = {
    fundamentals: {
      revenueGrowth: 20 + r() * 75, profitMargin: 10 + r() * 70, debtToEquity: r() * 85,
      freeCashFlow: 15 + r() * 75, earningsQuality: 25 + r() * 65, bookValue: 20 + r() * 60,
    },
    technicals: {
      rsi: 20 + r() * 60, macdSignal: 20 + r() * 70, bollingerPos: 15 + r() * 75,
      volumeTrend: 25 + r() * 65, maAlignment: 20 + r() * 75, supportResistance: 25 + r() * 65,
    },
    sentiment: {
      newsScore: 20 + r() * 75, socialBuzz: 10 + r() * 85, analystConsensus: 25 + r() * 65,
      institutionalFlow: 20 + r() * 70, retailSentiment: 15 + r() * 75, fearGreedIdx: 10 + r() * 80,
    },
    macro: {
      sectorMomentum: 25 + r() * 65, rateExposure: r() * 80, inflationHedge: 15 + r() * 70,
      geopoliticalRisk: r() * 75, regulatoryClimate: 25 + r() * 65, currencyExposure: 15 + r() * 65,
    },
    esg: {
      environmental: 20 + r() * 70, social: 25 + r() * 65, governance: 30 + r() * 60,
      controversyRisk: r() * 70, sustainabilityTrend: 25 + r() * 65,
    },
  };

  const priceHistory = [];
  let p = price * 0.85;
  for (let i = 90; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    p *= 1 + (r() - 0.47) * 0.04;
    priceHistory.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: +p.toFixed(2),
      volume: Math.floor(5e5 + r() * 8e7),
      sma20: 0, sma50: 0,
    });
  }
  for (let i = 0; i < priceHistory.length; i++) {
    if (i >= 19) priceHistory[i].sma20 = +(priceHistory.slice(i - 19, i + 1).reduce((s, d) => s + d.price, 0) / 20).toFixed(2);
    if (i >= 49) priceHistory[i].sma50 = +(priceHistory.slice(i - 49, i + 1).reduce((s, d) => s + d.price, 0) / 50).toFixed(2);
  }

  const avg = (obj) => { const vals = Object.values(obj); return vals.reduce((s, v) => s + v, 0) / vals.length; };

  const radarData = [
    { dimension: "Fundamentals", value: avg(dims.fundamentals), fullMark: 100 },
    { dimension: "Technicals", value: avg(dims.technicals), fullMark: 100 },
    { dimension: "Sentiment", value: avg(dims.sentiment), fullMark: 100 },
    { dimension: "Macro", value: avg(dims.macro), fullMark: 100 },
    { dimension: "ESG", value: avg(dims.esg), fullMark: 100 },
    { dimension: "Momentum", value: 25 + r() * 65, fullMark: 100 },
  ];

  return {
    ticker, ...asset, price: +price.toFixed(2), changePercent: +changePercent.toFixed(2),
    marketCap: `$${(price * (5e7 + r() * 3e10) / 1e9).toFixed(1)}B`,
    volume24h: `${(0.5 + r() * 60).toFixed(1)}M`,
    ...dims, priceHistory, radarData,
    compositeScore: +avg(radarData.map(d => d.value)).toFixed(1),
  };
}

// ─── LIVE INTELLIGENCE ENGINE (Anthropic API + Web Search) ───────────────────

async function fetchIntelligenceBriefing(ticker, assetName, sector) {
  const systemPrompt = `You are SPECTRUM, an elite market intelligence analyst. Produce a concise, hard-hitting daily briefing for the given asset. Be specific with numbers, dates, and sources. No fluff. Structure your response as valid JSON with this exact schema:
{
  "headline": "One-line thesis (max 15 words)",
  "signal": "BULLISH" | "BEARISH" | "NEUTRAL" | "VOLATILE",
  "confidence": 1-100,
  "briefing": "2-3 paragraph investigative analysis covering: recent material developments (earnings, contracts, regulatory), key risks and catalysts, and near-term outlook. Be specific with numbers and dates.",
  "keyDevelopments": [
    {"title": "short title", "impact": "positive|negative|neutral", "detail": "1-2 sentences"},
    ...3-5 items
  ],
  "watchTriggers": ["trigger 1", "trigger 2", "trigger 3"],
  "riskFactors": ["risk 1", "risk 2", "risk 3"],
  "sectorContext": "1-2 sentences on broader sector dynamics"
}
Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `Produce today's intelligence briefing for: ${ticker} (${assetName}), Sector: ${sector}. Search for the latest news, earnings, regulatory actions, analyst ratings, and any material developments from the past 7 days. Focus on actionable intelligence.`
        }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map(i => i.type === "text" ? i.text : "").filter(Boolean).join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Intel fetch error:", err);
    return null;
  }
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

const COLORS = {
  bg: "#06080e", card: "#0b0f18", cardBorder: "#131a2b", cardHover: "#161e30",
  accent: "#00e5a0", accentDim: "#00e5a033", danger: "#ff4d6a", warn: "#ffb347",
  textPrimary: "#e8edf8", textSecondary: "#7a86a6", textDim: "#3d4663",
  gridLine: "#111827", glow: "rgba(0,229,160,0.08)",
};

function SignalBadge({ signal }) {
  const map = {
    BULLISH: { bg: "#00e5a018", color: "#00e5a0", icon: "▲" },
    BEARISH: { bg: "#ff4d6a18", color: "#ff4d6a", icon: "▼" },
    NEUTRAL: { bg: "#ffb34718", color: "#ffb347", icon: "◆" },
    VOLATILE: { bg: "#a78bfa18", color: "#a78bfa", icon: "⚡" },
  };
  const s = map[signal] || map.NEUTRAL;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px",
      background: s.bg, color: s.color, borderRadius: 6, fontSize: 11,
      fontWeight: 800, fontFamily: "'Azeret Mono', monospace", letterSpacing: "0.06em",
    }}>{s.icon} {signal}</span>
  );
}

function ConfidenceMeter({ value }) {
  const color = value > 70 ? COLORS.accent : value > 45 ? COLORS.warn : COLORS.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 5, background: COLORS.gridLine, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'Azeret Mono', monospace" }}>{value}%</span>
    </div>
  );
}

function GaugeArc({ value, label, size = 56 }) {
  const color = value > 70 ? COLORS.accent : value > 45 ? COLORS.warn : COLORS.danger;
  const circ = Math.PI * (size - 10);
  const off = circ * (1 - value / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
        <path d={`M 5,${size / 2} A ${size / 2 - 5},${size / 2 - 5} 0 0 1 ${size - 5},${size / 2}`}
          fill="none" stroke={COLORS.gridLine} strokeWidth={5} strokeLinecap="round" />
        <path d={`M 5,${size / 2} A ${size / 2 - 5},${size / 2 - 5} 0 0 1 ${size - 5},${size / 2}`}
          fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} style={{ transition: "all 1s ease" }} />
        <text x={size / 2} y={size / 2 - 1} textAnchor="middle" fill={color}
          style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Azeret Mono', monospace" }}>{value.toFixed(0)}</text>
      </svg>
      <span style={{ fontSize: 8, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function MetricBar({ label, value }) {
  const color = value > 70 ? COLORS.accent : value > 45 ? COLORS.warn : COLORS.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 10, color: COLORS.textSecondary, width: 110, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: COLORS.gridLine, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 800, fontFamily: "'Azeret Mono', monospace", width: 28, textAlign: "right" }}>{value.toFixed(0)}</span>
    </div>
  );
}

function HeatCell({ value, label }) {
  const color = value > 65 ? `rgba(0,229,160,${0.15 + value / 200})` : value > 40 ? `rgba(255,179,71,${0.15 + value / 200})` : `rgba(255,77,106,${0.15 + value / 200})`;
  return (
    <div style={{
      background: color, borderRadius: 6, padding: "7px 4px", textAlign: "center",
      border: "1px solid rgba(255,255,255,0.03)", flex: 1, minWidth: 60,
    }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.textPrimary, fontFamily: "'Azeret Mono', monospace" }}>{value.toFixed(0)}</div>
      <div style={{ fontSize: 7, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function ScoreRing({ score, size = 130 }) {
  const radius = size / 2 - 14;
  const circ = 2 * Math.PI * radius;
  const off = circ * (1 - score / 100);
  const color = score > 70 ? COLORS.accent : score > 50 ? COLORS.warn : COLORS.danger;
  const grade = score > 80 ? "A+" : score > 70 ? "A" : score > 60 ? "B+" : score > 50 ? "B" : score > 40 ? "C" : "D";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={COLORS.gridLine} strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "all 1.2s ease" }} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`${color}25`} strokeWidth={18}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "all 1.2s ease", filter: "blur(8px)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Azeret Mono', monospace", lineHeight: 1 }}>{score.toFixed(0)}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: `${color}99`, marginTop: 1 }}>{grade}</div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
      <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 11, color: p.color || COLORS.textPrimary, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}

// ─── INTELLIGENCE BRIEFING PANEL ─────────────────────────────────────────────

function IntelBriefingPanel({ ticker, assetName, sector, onClose }) {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIntel(null);
    fetchIntelligenceBriefing(ticker, assetName, sector).then(data => {
      if (cancelled) return;
      if (data) { setIntel(data); }
      else { setError("Unable to fetch live intelligence. API may be unavailable."); }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [ticker, assetName, sector]);

  const impactColors = { positive: COLORS.accent, negative: COLORS.danger, neutral: COLORS.warn };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(6,8,14,0.85)", backdropFilter: "blur(12px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(720px, 92vw)", maxHeight: "88vh", overflow: "auto",
        background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16,
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "slideUp 0.3s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: `1px solid ${COLORS.cardBorder}`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          background: `linear-gradient(180deg, ${COLORS.glow}, transparent)`,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: COLORS.accent, fontFamily: "'Azeret Mono', monospace" }}>⟐ LIVE INTELLIGENCE BRIEFING</span>
              <span style={{
                fontSize: 8, padding: "2px 6px", borderRadius: 3, fontWeight: 700,
                background: `${COLORS.accent}15`, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em",
              }}>AI-POWERED</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.textPrimary }}>{assetName}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{ticker} · {sector} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: COLORS.textDim, fontSize: 22,
            cursor: "pointer", padding: "4px 8px", lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ display: "inline-block", width: 32, height: 32, border: `3px solid ${COLORS.gridLine}`, borderTopColor: COLORS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 12 }}>Scanning markets, news feeds, and regulatory filings...</div>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>Synthesizing investigative intelligence via web search</div>
            </div>
          )}

          {error && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
              <div style={{ fontSize: 13, color: COLORS.warn, fontWeight: 600 }}>{error}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8, lineHeight: 1.6, maxWidth: 400, margin: "8px auto 0" }}>
                The live intelligence feed requires an active Anthropic API connection with web search. Ensure the artifact environment supports API calls.
              </div>
            </div>
          )}

          {intel && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              {/* Headline + Signal */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary, flex: 1, minWidth: 200, lineHeight: 1.3 }}>
                  "{intel.headline}"
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <SignalBadge signal={intel.signal} />
                  <ConfidenceMeter value={intel.confidence} />
                </div>
              </div>

              {/* Briefing */}
              <div style={{
                fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.75,
                padding: "16px 18px", background: COLORS.bg, borderRadius: 10,
                border: `1px solid ${COLORS.cardBorder}`, marginBottom: 20,
                whiteSpace: "pre-wrap",
              }}>{intel.briefing}</div>

              {/* Key Developments */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                  ● Key Developments
                </div>
                {intel.keyDevelopments?.map((dev, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, padding: "10px 12px", marginBottom: 4,
                    background: i % 2 === 0 ? "transparent" : `${COLORS.bg}80`, borderRadius: 6,
                    borderLeft: `3px solid ${impactColors[dev.impact] || COLORS.warn}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{dev.title}</div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5 }}>{dev.detail}</div>
                    </div>
                    <span style={{
                      fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0,
                      color: impactColors[dev.impact], alignSelf: "flex-start", marginTop: 2,
                    }}>{dev.impact}</span>
                  </div>
                ))}
              </div>

              {/* Watch Triggers + Risk Factors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div style={{ padding: "14px 16px", background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.cardBorder}` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                    ◎ Watch Triggers
                  </div>
                  {intel.watchTriggers?.map((t, i) => (
                    <div key={i} style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6, paddingLeft: 12, position: "relative", lineHeight: 1.5 }}>
                      <span style={{ position: "absolute", left: 0, color: COLORS.accent, fontSize: 8, top: 3 }}>▸</span>{t}
                    </div>
                  ))}
                </div>
                <div style={{ padding: "14px 16px", background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.cardBorder}` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.danger, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                    ⚠ Risk Factors
                  </div>
                  {intel.riskFactors?.map((r, i) => (
                    <div key={i} style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6, paddingLeft: 12, position: "relative", lineHeight: 1.5 }}>
                      <span style={{ position: "absolute", left: 0, color: COLORS.danger, fontSize: 8, top: 3 }}>▸</span>{r}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Context */}
              {intel.sectorContext && (
                <div style={{
                  fontSize: 11, color: COLORS.textDim, padding: "10px 14px",
                  background: `${COLORS.cardBorder}40`, borderRadius: 8,
                  borderLeft: `2px solid ${COLORS.textDim}`, lineHeight: 1.6, fontStyle: "italic",
                }}>
                  <span style={{ fontWeight: 700, fontStyle: "normal", color: COLORS.textSecondary }}>Sector: </span>
                  {intel.sectorContext}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────

export default function SpectrumDashboard() {
  const [watchlist, setWatchlist] = useState(["PLTR", "ARRY", "QS", "SMCI", "RKLB", "CRWV", "ASTS", "DJT", "RGTI", "QBTS"]);
  const [active, setActive] = useState("PLTR");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [tab, setTab] = useState("overview");
  const [cache, setCache] = useState({});
  const [intelTicker, setIntelTicker] = useState(null);

  const load = useCallback((t) => {
    setCache(prev => ({ ...prev, [t]: generateAssetData(t) }));
  }, []);

  useEffect(() => { watchlist.forEach(t => { if (!cache[t]) load(t); }); }, [watchlist, load]);

  const data = cache[active];

  const addTicker = (t) => {
    if (!watchlist.includes(t)) setWatchlist(prev => [...prev, t]);
    setActive(t);
    if (!cache[t]) load(t);
    setShowSearch(false);
    setSearch("");
  };

  const removeTicker = (t) => {
    setWatchlist(prev => prev.filter(x => x !== t));
    if (active === t) setActive(watchlist.find(x => x !== t) || "");
  };

  const filtered = Object.entries(ASSETS).filter(([t, info]) =>
    (t.toLowerCase().includes(search.toLowerCase()) || info.name.toLowerCase().includes(search.toLowerCase())) && !watchlist.includes(t)
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "fundamentals", label: "Fundamentals" },
    { id: "technicals", label: "Technicals" },
    { id: "sentiment", label: "Sentiment & ESG" },
    { id: "macro", label: "Macro" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800;900&family=Azeret+Mono:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.cardBorder}; border-radius: 3px; }
        input::placeholder { color: ${COLORS.textDim}; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .scard { background: ${COLORS.card}; border: 1px solid ${COLORS.cardBorder}; border-radius: 10px; padding: 18px; animation: fadeIn 0.35s ease; transition: border-color 0.2s; }
        .scard:hover { border-color: ${COLORS.cardHover}; }
      `}</style>

      {/* Intelligence Briefing Modal */}
      {intelTicker && (
        <IntelBriefingPanel
          ticker={intelTicker}
          assetName={ASSETS[intelTicker]?.name}
          sector={ASSETS[intelTicker]?.sector}
          onClose={() => setIntelTicker(null)}
        />
      )}

      {/* ═══ HEADER ═══ */}
      <header style={{
        padding: "12px 20px", borderBottom: `1px solid ${COLORS.cardBorder}`,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        background: `linear-gradient(180deg, ${COLORS.card} 0%, ${COLORS.bg} 100%)`,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: `linear-gradient(135deg, ${COLORS.accent}, #00b4f7)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: COLORS.bg,
          }}>S</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", color: COLORS.textPrimary, fontFamily: "'Azeret Mono', monospace" }}>SPECTRUM</div>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.2em", color: COLORS.textDim, textTransform: "uppercase" }}>Intelligence · Analytics · Signals</div>
          </div>
        </div>

        {/* Watchlist */}
        <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap", marginLeft: 10, alignItems: "center" }}>
          {watchlist.map(t => {
            const a = ASSETS[t];
            const d = cache[t];
            const isActive = t === active;
            return (
              <button key={t} onClick={() => setActive(t)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                background: isActive ? `${a?.color}12` : "transparent",
                border: `1px solid ${isActive ? `${a?.color}35` : COLORS.cardBorder}`,
                borderRadius: 6, cursor: "pointer", color: isActive ? a?.color : COLORS.textSecondary,
                fontSize: 11, fontWeight: 700, fontFamily: "'Azeret Mono', monospace", transition: "all 0.2s",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: a?.color, flexShrink: 0 }} />
                {t}
                {d && <span style={{ color: d.changePercent >= 0 ? COLORS.accent : COLORS.danger, fontSize: 9 }}>
                  {d.changePercent >= 0 ? "+" : ""}{d.changePercent}%
                </span>}
                <span onClick={e => { e.stopPropagation(); removeTicker(t); }} style={{ opacity: 0.3, fontSize: 12, marginLeft: 1 }}>×</span>
              </button>
            );
          })}

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowSearch(!showSearch)} style={{
              padding: "5px 10px", background: "transparent", border: `1px dashed ${COLORS.cardBorder}`,
              borderRadius: 6, cursor: "pointer", color: COLORS.textDim, fontSize: 16, lineHeight: 1, transition: "all 0.2s",
            }}>+</button>
            {showSearch && (
              <div style={{
                position: "absolute", top: "110%", left: 0, background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`, borderRadius: 10, padding: 8,
                width: 250, zIndex: 200, boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              }}>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search ticker or name..."
                  style={{
                    width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: 6, color: COLORS.textPrimary, fontSize: 11, outline: "none", fontFamily: "inherit",
                  }} />
                <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 4 }}>
                  {filtered.map(([t, info]) => (
                    <div key={t} onClick={() => addTicker(t)} style={{
                      padding: "6px 8px", cursor: "pointer", borderRadius: 5,
                      display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s",
                    }} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: info.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Azeret Mono', monospace" }}>{t}</span>
                      <span style={{ fontSize: 10, color: COLORS.textDim, flex: 1 }}>{info.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.accent, animation: "pulse 2s ease infinite" }} />
          <span style={{ fontSize: 9, color: COLORS.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>Live</span>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      {!data ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>◈</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary }}>Select an Asset</div>
          <div style={{ fontSize: 12, color: COLORS.textDim }}>Choose from your watchlist above to begin analysis</div>
        </div>
      ) : (
        <div style={{ padding: "16px 20px", animation: "fadeIn 0.3s ease" }}>
          {/* Asset Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 8, padding: "2px 6px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  background: data.type === "crypto" ? "#f7931a15" : `${data.color}15`, color: data.type === "crypto" ? "#f7931a" : data.color,
                }}>{data.sector}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>{data.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Azeret Mono', monospace", color: COLORS.textPrimary }}>
                  ${data.price.toLocaleString()}
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 800, fontFamily: "'Azeret Mono', monospace",
                  color: data.changePercent >= 0 ? COLORS.accent : COLORS.danger,
                }}>
                  {data.changePercent >= 0 ? "▲" : "▼"} {Math.abs(data.changePercent)}%
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                {[["Mkt Cap", data.marketCap], ["24h Vol", data.volume24h]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 8, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, fontFamily: "'Azeret Mono', monospace" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* INTELLIGENCE BRIEFING BUTTON */}
              <button onClick={() => setIntelTicker(active)} style={{
                marginTop: 14, padding: "10px 18px", borderRadius: 8, cursor: "pointer",
                background: `linear-gradient(135deg, ${COLORS.accent}20, ${COLORS.accent}08)`,
                border: `1px solid ${COLORS.accent}40`, color: COLORS.accent,
                fontSize: 11, fontWeight: 800, fontFamily: "'Azeret Mono', monospace",
                letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${COLORS.accent}25`; e.currentTarget.style.borderColor = COLORS.accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.accent}20, ${COLORS.accent}08)`; e.currentTarget.style.borderColor = `${COLORS.accent}40`; }}
              >
                <span style={{ fontSize: 14 }}>⟐</span>
                RUN INTELLIGENCE BRIEFING
                <span style={{ fontSize: 8, opacity: 0.6, fontWeight: 600 }}>LIVE AI + WEB</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 8, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 800, marginBottom: 6 }}>Composite</div>
              <ScoreRing score={data.compositeScore} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: 1, marginBottom: 16, background: COLORS.bg,
            borderRadius: 8, padding: 2, border: `1px solid ${COLORS.cardBorder}`,
          }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                background: tab === t.id ? COLORS.cardHover : "transparent",
                color: tab === t.id ? COLORS.textPrimary : COLORS.textDim, transition: "all 0.2s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* ═══ TAB: OVERVIEW ═══ */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>Multi-Dimensional Signal Map</div>
                <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 10 }}>Full-spectrum assessment across 6 core dimensions</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={data.radarData}>
                    <PolarGrid stroke={COLORS.gridLine} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: COLORS.textSecondary, fontSize: 9, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: COLORS.textDim, fontSize: 8 }} />
                    <Radar dataKey="value" stroke={data.color} fill={data.color} fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: data.color }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>Signal Heatmap</div>
                <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 14 }}>Sub-dimension breakdown per category</div>
                {[
                  { label: "Fundamentals", d: data.fundamentals },
                  { label: "Technicals", d: data.technicals },
                  { label: "Sentiment", d: data.sentiment },
                ].map(({ label, d }) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.textDim, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {Object.entries(d).map(([k, v]) => <HeatCell key={k} value={v} label={k.replace(/([A-Z])/g, " $1").trim().slice(0, 10)} />)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="scard" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>Price Action & Moving Averages</div>
                <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 10 }}>90-day price with SMA-20 / SMA-50</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={data.priceHistory.slice(-60)}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={data.color} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={data.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                    <XAxis dataKey="date" tick={{ fill: COLORS.textDim, fontSize: 8 }} axisLine={{ stroke: COLORS.gridLine }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: COLORS.textDim, fontSize: 9 }} axisLine={{ stroke: COLORS.gridLine }} tickFormatter={v => `$${v.toLocaleString()}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="price" stroke={data.color} strokeWidth={2} fill="url(#pg)" name="Price" />
                    <Line type="monotone" dataKey="sma20" stroke={COLORS.warn} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="SMA 20" />
                    <Line type="monotone" dataKey="sma50" stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="6 3" name="SMA 50" />
                    <Bar dataKey="volume" fill={COLORS.gridLine} yAxisId="right" opacity={0.4} name="Volume" />
                    <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 14 }}>Dimension Gauges</div>
                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 10 }}>
                  {data.radarData.map(d => <GaugeArc key={d.dimension} value={d.value} label={d.dimension} />)}
                </div>
              </div>

              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>Signal Summary</div>
                <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 12 }}>Aggregated assessment</div>
                {data.radarData.map(d => <MetricBar key={d.dimension} label={d.dimension} value={d.value} />)}
                <div style={{ height: 1, background: COLORS.cardBorder, margin: "12px 0" }} />
                <div style={{
                  fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.7, padding: 12,
                  background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.cardBorder}`,
                }}>
                  {data.compositeScore > 65
                    ? `${data.name} shows strong multi-dimensional signals (${data.compositeScore.toFixed(0)}/100). Strength in ${data.radarData.sort((a, b) => b.value - a.value)[0].dimension.toLowerCase()} (${data.radarData.sort((a, b) => b.value - a.value)[0].value.toFixed(0)}). Run an Intelligence Briefing for live investigative analysis.`
                    : data.compositeScore > 45
                      ? `${data.name} shows mixed signals (${data.compositeScore.toFixed(0)}/100). Strength in ${data.radarData.sort((a, b) => b.value - a.value)[0].dimension.toLowerCase()} offset by ${data.radarData.sort((a, b) => a.value - b.value)[0].dimension.toLowerCase()} weakness. Run a briefing for deeper context.`
                      : `${data.name} flags caution (${data.compositeScore.toFixed(0)}/100). Weakness in ${data.radarData.sort((a, b) => a.value - b.value)[0].dimension.toLowerCase()} (${data.radarData.sort((a, b) => a.value - b.value)[0].value.toFixed(0)}) warrants investigation. Run a live briefing for risk details.`
                  }
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: FUNDAMENTALS ═══ */}
          {tab === "fundamentals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 14 }}>Fundamental Metrics</div>
                {Object.entries(data.fundamentals).map(([k, v]) => <MetricBar key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={v} />)}
              </div>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 10 }}>Fundamental Radar</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={Object.entries(data.fundamentals).map(([k, v]) => ({ metric: k.replace(/([A-Z])/g, " $1").trim(), value: v, fullMark: 100 }))}>
                    <PolarGrid stroke={COLORS.gridLine} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.textSecondary, fontSize: 8, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.12} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="scard" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 14 }}>Fundamental Assessment</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(data.fundamentals).map(([k, v]) => ({ name: k.replace(/([A-Z])/g, " $1").trim().slice(0, 14), value: +v.toFixed(1) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: COLORS.textSecondary, fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: COLORS.textDim, fontSize: 9 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {Object.values(data.fundamentals).map((v, i) => <Cell key={i} fill={v > 70 ? COLORS.accent : v > 45 ? COLORS.warn : COLORS.danger} fillOpacity={0.75} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══ TAB: TECHNICALS ═══ */}
          {tab === "technicals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 14 }}>Technical Indicators</div>
                {Object.entries(data.technicals).map(([k, v]) => <MetricBar key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={v} />)}
              </div>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 10 }}>Volume Profile (30d)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.priceHistory.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                    <XAxis dataKey="date" tick={{ fill: COLORS.textDim, fontSize: 8 }} />
                    <YAxis tick={{ fill: COLORS.textDim, fontSize: 8 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="volume" name="Volume" radius={[2, 2, 0, 0]}>
                      {data.priceHistory.slice(-30).map((d, i) => (
                        <Cell key={i} fill={i > 0 && d.price >= data.priceHistory.slice(-30)[i - 1]?.price ? `${COLORS.accent}55` : `${COLORS.danger}55`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="scard" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 10 }}>Price with SMA Envelope</div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.priceHistory.slice(-60)}>
                    <defs>
                      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                    <XAxis dataKey="date" tick={{ fill: COLORS.textDim, fontSize: 8 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: COLORS.textDim, fontSize: 9 }} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="price" stroke="#a78bfa" fill="url(#tg)" strokeWidth={2} name="Price" />
                    <Line type="monotone" dataKey="sma20" stroke={COLORS.warn} strokeWidth={1} dot={false} name="SMA 20" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══ TAB: SENTIMENT & ESG ═══ */}
          {tab === "sentiment" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 14 }}>Sentiment Indicators</div>
                {Object.entries(data.sentiment).map(([k, v]) => <MetricBar key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={v} />)}
              </div>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 10 }}>Sentiment Radar</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={Object.entries(data.sentiment).map(([k, v]) => ({ metric: k.replace(/([A-Z])/g, " $1").trim(), value: v, fullMark: 100 }))}>
                    <PolarGrid stroke={COLORS.gridLine} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.textSecondary, fontSize: 8, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#e64980" fill="#e64980" fillOpacity={0.12} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="scard" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>ESG & Societal Profile</div>
                <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 14 }}>Environmental, Social & Governance assessment</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(data.esg).map(([k, v]) => <HeatCell key={k} value={v} label={k.replace(/([A-Z])/g, " $1").trim().slice(0, 14)} />)}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: MACRO ═══ */}
          {tab === "macro" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 14 }}>Macroeconomic Factors</div>
                {Object.entries(data.macro).map(([k, v]) => <MetricBar key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={v} />)}
              </div>
              <div className="scard">
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 10 }}>Macro Radar</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={Object.entries(data.macro).map(([k, v]) => ({ metric: k.replace(/([A-Z])/g, " $1").trim(), value: v, fullMark: 100 }))}>
                    <PolarGrid stroke={COLORS.gridLine} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.textSecondary, fontSize: 8, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.12} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="scard" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 14 }}>Macro Factor Comparison</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(data.macro).map(([k, v]) => ({ name: k.replace(/([A-Z])/g, " $1").trim().slice(0, 14), value: +v.toFixed(1) }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: COLORS.textDim, fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textSecondary, fontSize: 8 }} width={100} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {Object.values(data.macro).map((v, i) => <Cell key={i} fill={v > 60 ? "#38bdf8" : v > 40 ? COLORS.warn : COLORS.danger} fillOpacity={0.7} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 20, padding: "10px 14px", background: COLORS.card,
            borderRadius: 8, border: `1px solid ${COLORS.cardBorder}`,
            fontSize: 9, color: COLORS.textDim, lineHeight: 1.6, textAlign: "center",
          }}>
            SPECTRUM v2 — Intelligence briefings powered by Claude AI with live web search. Quantitative signals are simulated for demonstration.
            Connect real data providers (Alpha Vantage, Polygon.io, CoinGecko) for production use. Not financial advice.
          </div>
        </div>
      )}
    </div>
  );
}
