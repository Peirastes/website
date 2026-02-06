import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Cell, Legend, ReferenceLine
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════════
// SPECTRUM v3 — Split-Panel Market Intelligence Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ASSET REGISTRY ──────────────────────────────────────────────────────────

const ASSETS = {
  // Tech Giants
  AAPL: { name: "Apple Inc.", sector: "Technology", type: "stock", color: "#a3a3a3", domain: "apple.com" },
  MSFT: { name: "Microsoft Corp.", sector: "Technology", type: "stock", color: "#38bdf8", domain: "microsoft.com" },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology", type: "stock", color: "#4ade80", domain: "google.com" },
  META: { name: "Meta Platforms", sector: "Technology", type: "stock", color: "#60a5fa", domain: "meta.com" },
  AMZN: { name: "Amazon.com Inc.", sector: "E-Commerce / Cloud", type: "stock", color: "#ff9900", domain: "amazon.com" },

  // AI & Semiconductors
  NVDA: { name: "NVIDIA Corp.", sector: "Semiconductors", type: "stock", color: "#84cc16", domain: "nvidia.com" },
  AMD: { name: "Advanced Micro Devices", sector: "Semiconductors", type: "stock", color: "#ed1c24", domain: "amd.com" },
  INTC: { name: "Intel Corp.", sector: "Semiconductors", type: "stock", color: "#0071c5", domain: "intel.com" },
  AVGO: { name: "Broadcom Inc.", sector: "Semiconductors", type: "stock", color: "#cc0000", domain: "broadcom.com" },
  TSM: { name: "Taiwan Semiconductor", sector: "Semiconductors", type: "stock", color: "#e03c31", domain: "tsmc.com" },
  MU: { name: "Micron Technology", sector: "Semiconductors", type: "stock", color: "#0077c8", domain: "micron.com" },
  MCHP: { name: "Microchip Technology", sector: "Semiconductors", type: "stock", color: "#cc2229", domain: "microchip.com" },
  ASML: { name: "ASML Holding", sector: "Semiconductors", type: "stock", color: "#0f238c", domain: "asml.com" },
  PLTR: { name: "Palantir Technologies", sector: "AI / Government Tech", type: "stock", color: "#1ae5a1", domain: "palantir.com" },
  SMCI: { name: "Super Micro Computer", sector: "AI Infrastructure", type: "stock", color: "#ef4444", domain: "supermicro.com" },
  CRWV: { name: "CoreWeave", sector: "AI Cloud / GPU", type: "stock", color: "#22d3ee", domain: "coreweave.com" },

  // Quantum Computing
  RGTI: { name: "Rigetti Computing", sector: "Quantum Computing", type: "stock", color: "#818cf8", domain: "rigetti.com" },
  QBTS: { name: "D-Wave Quantum", sector: "Quantum Computing", type: "stock", color: "#2dd4bf", domain: "dwavesys.com" },
  IONQ: { name: "IonQ Inc.", sector: "Quantum Computing", type: "stock", color: "#6366f1", domain: "ionq.com" },

  // Space & Aerospace & Defense
  RKLB: { name: "Rocket Lab USA", sector: "Aerospace / Launch", type: "stock", color: "#a78bfa", domain: "rocketlabusa.com" },
  ASTS: { name: "AST SpaceMobile", sector: "Satellite / Telecom", type: "stock", color: "#fb923c", domain: "ast-science.com" },
  LUNR: { name: "Intuitive Machines", sector: "Lunar / Space", type: "stock", color: "#c4b5fd", domain: "intuitivemachines.com" },
  RDW: { name: "Redwire Corp.", sector: "Space Infrastructure", type: "stock", color: "#f472b6", domain: "redwirespace.com" },
  KTOS: { name: "Kratos Defense & Security", sector: "Defense / Drones", type: "stock", color: "#1e3a5f", domain: "kratosdefense.com" },
  LMT: { name: "Lockheed Martin", sector: "Defense / Aerospace", type: "stock", color: "#003366", domain: "lockheedmartin.com" },
  GE: { name: "GE Aerospace", sector: "Aerospace / Industrial", type: "stock", color: "#3d5a80", domain: "geaerospace.com" },

  // EV & Energy
  TSLA: { name: "Tesla Inc.", sector: "EV / Energy", type: "stock", color: "#e11d48", domain: "tesla.com" },
  RIVN: { name: "Rivian Automotive", sector: "EV", type: "stock", color: "#fbbf24", domain: "rivian.com" },
  LCID: { name: "Lucid Group", sector: "EV", type: "stock", color: "#7dd3fc", domain: "lucidmotors.com" },
  QS: { name: "QuantumScape", sector: "EV Battery Tech", type: "stock", color: "#06b6d4", domain: "quantumscape.com" },
  ARRY: { name: "Array Technologies", sector: "Clean Energy", type: "stock", color: "#f59e0b", domain: "arraytechinc.com" },
  ENPH: { name: "Enphase Energy", sector: "Solar", type: "stock", color: "#f97316", domain: "enphase.com" },

  // Fintech & Finance
  SQ: { name: "Block Inc.", sector: "Fintech", type: "stock", color: "#00d632", domain: "block.xyz" },
  COIN: { name: "Coinbase Global", sector: "Crypto Exchange", type: "stock", color: "#0052ff", domain: "coinbase.com" },
  HOOD: { name: "Robinhood Markets", sector: "Fintech", type: "stock", color: "#00c805", domain: "robinhood.com" },
  SOFI: { name: "SoFi Technologies", sector: "Fintech", type: "stock", color: "#00d4aa", domain: "sofi.com" },

  // Biotech & Healthcare
  MRNA: { name: "Moderna Inc.", sector: "Biotech", type: "stock", color: "#00a1e0", domain: "modernatx.com" },
  CRSP: { name: "CRISPR Therapeutics", sector: "Gene Editing", type: "stock", color: "#10b981", domain: "crisprtx.com" },

  // Other Growth
  NET: { name: "Cloudflare Inc.", sector: "Cybersecurity / CDN", type: "stock", color: "#f48120", domain: "cloudflare.com" },
  SNOW: { name: "Snowflake Inc.", sector: "Cloud Data", type: "stock", color: "#29b5e8", domain: "snowflake.com" },
  DDOG: { name: "Datadog Inc.", sector: "Cloud Monitoring", type: "stock", color: "#632ca6", domain: "datadoghq.com" },

  // Entertainment & Consumer
  DIS: { name: "Walt Disney Co.", sector: "Entertainment", type: "stock", color: "#006e99", domain: "disney.com" },
  SPOT: { name: "Spotify Technology", sector: "Streaming / Music", type: "stock", color: "#1db954", domain: "spotify.com" },
  CHWY: { name: "Chewy Inc.", sector: "E-Commerce / Pets", type: "stock", color: "#0b72b9", domain: "chewy.com" },
  AMC: { name: "AMC Entertainment", sector: "Entertainment / Cinema", type: "stock", color: "#ff0000", domain: "amctheatres.com" },
  DJT: { name: "Trump Media & Technology", sector: "Social Media", type: "stock", color: "#c41e3a", domain: "tmtgcorp.com" },

  // Retail & Restaurants
  AEO: { name: "American Eagle Outfitters", sector: "Retail / Apparel", type: "stock", color: "#1c3f6e", domain: "ae.com" },
  GME: { name: "GameStop Corp.", sector: "Retail / Gaming", type: "stock", color: "#e01e26", domain: "gamestop.com" },
  CBRL: { name: "Cracker Barrel", sector: "Restaurant", type: "stock", color: "#6b4226", domain: "crackerbarrel.com" },
  CAVA: { name: "Cava Group", sector: "Restaurant", type: "stock", color: "#00a499", domain: "cava.com" },
  TSCO: { name: "Tractor Supply Co.", sector: "Retail", type: "stock", color: "#e31837", domain: "tractorsupply.com" },
  LULU: { name: "Lululemon Athletica", sector: "Retail / Apparel", type: "stock", color: "#d31334", domain: "lululemon.com" },

  // Real Estate & Industrial
  MPW: { name: "Medical Properties Trust", sector: "REIT / Healthcare", type: "stock", color: "#0066b2", domain: "medicalpropertiestrust.com" },
  COMP: { name: "Compass Inc.", sector: "Real Estate Tech", type: "stock", color: "#000000", domain: "compass.com" },
  LEG: { name: "Leggett & Platt", sector: "Manufacturing", type: "stock", color: "#004c97", domain: "leggett.com" },

  // Cryptocurrency
  BTC: { name: "Bitcoin", sector: "Cryptocurrency", type: "crypto", color: "#f7931a", domain: "bitcoin.org" },
  ETH: { name: "Ethereum", sector: "Cryptocurrency", type: "crypto", color: "#627eea", domain: "ethereum.org" },
  SOL: { name: "Solana", sector: "Cryptocurrency", type: "crypto", color: "#9945ff", domain: "solana.com" },
  XRP: { name: "Ripple", sector: "Cryptocurrency", type: "crypto", color: "#23292f", domain: "ripple.com" },
  ADA: { name: "Cardano", sector: "Cryptocurrency", type: "crypto", color: "#0033ad", domain: "cardano.org" },
  DOGE: { name: "Dogecoin", sector: "Cryptocurrency", type: "crypto", color: "#c2a633", domain: "dogecoin.com" },
  AVAX: { name: "Avalanche", sector: "Cryptocurrency", type: "crypto", color: "#e84142", domain: "avax.network" },
  LINK: { name: "Chainlink", sector: "Cryptocurrency", type: "crypto", color: "#375bd2", domain: "chain.link" },
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

  // Generate brief description
  const signal = r() > 0.6 ? "bullish" : r() > 0.3 ? "neutral" : "bearish";
  const briefing = generateBriefing(ticker, asset, signal, r);

  return {
    ticker, ...asset, price: +price.toFixed(2), changePercent: +changePercent.toFixed(2),
    marketCap: `$${(price * (5e7 + r() * 3e10) / 1e9).toFixed(1)}B`,
    volume24h: `${(0.5 + r() * 60).toFixed(1)}M`,
    ...dims, priceHistory, radarData,
    compositeScore: +avg(radarData.map(d => d.value)).toFixed(1),
    signal, briefing,
  };
}

function generateBriefing(ticker, asset, signal, r) {
  const catalysts = [
    "upcoming earnings report", "new product launch", "regulatory decision pending",
    "partnership announcement expected", "sector rotation dynamics", "institutional accumulation",
    "technical breakout pattern", "analyst upgrades", "market sentiment shift"
  ];
  const risks = [
    "elevated volatility", "sector headwinds", "valuation concerns",
    "competitive pressures", "macro uncertainty", "liquidity constraints"
  ];

  const catalyst = catalysts[Math.floor(r() * catalysts.length)];
  const risk = risks[Math.floor(r() * risks.length)];

  return `${asset?.name} (${asset?.sector}) showing ${signal} signals. Key catalyst: ${catalyst}. Monitor for ${risk}. Composite score indicates ${signal === "bullish" ? "favorable" : signal === "bearish" ? "cautious" : "mixed"} risk-reward profile.`;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function relativeTime(date, now) {
  if (!date) return "";
  const diff = Math.floor((now - date) / 1000);
  if (diff < 0) return "just now";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── THEME ───────────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#06080e",
  bgPanel: "#080b12",
  card: "#0b0f18",
  cardBorder: "#131a2b",
  cardHover: "#161e30",
  accent: "#00e5a0",
  accentDim: "#00e5a033",
  danger: "#ff4d6a",
  warn: "#ffb347",
  textPrimary: "#e8edf8",
  textSecondary: "#7a86a6",
  textDim: "#3d4663",
  gridLine: "#111827",
};

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

function MetricBar({ label, value }) {
  const color = value > 70 ? COLORS.accent : value > 45 ? COLORS.warn : COLORS.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: COLORS.textSecondary, width: 100, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: COLORS.gridLine, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", width: 28, textAlign: "right" }}>{value.toFixed(0)}</span>
    </div>
  );
}

function ScoreRing({ score, size = 100 }) {
  const radius = size / 2 - 10;
  const circ = 2 * Math.PI * radius;
  const off = circ * (1 - score / 100);
  const color = score > 70 ? COLORS.accent : score > 50 ? COLORS.warn : COLORS.danger;
  const grade = score > 80 ? "A+" : score > 70 ? "A" : score > 60 ? "B+" : score > 50 ? "B" : score > 40 ? "C" : "D";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={COLORS.gridLine} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "all 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{score.toFixed(0)}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: `${color}99`, marginTop: 2 }}>{grade}</div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 6, padding: "6px 10px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 2 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 10, color: p.color || COLORS.textPrimary, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}

function TickerLogo({ ticker, color, size = 36 }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const asset = ASSETS[ticker];
  const domain = asset?.domain;

  // Fallback letters
  const letters = ticker.length <= 2 ? ticker : ticker.slice(0, 2);
  const fontSize = letters.length === 1 ? size * 0.45 : size * 0.38;

  // Logo URL from Google Favicon service (less likely to be blocked by ad blockers)
  // Request 128px for crisp display
  const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 8,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: `0 2px 8px ${color}30`,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Always show letters as base layer */}
      <span style={{
        fontSize,
        fontWeight: 900,
        color: "#fff",
        fontFamily: "'JetBrains Mono', monospace",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        letterSpacing: "-0.02em",
        position: "absolute",
        opacity: imgLoaded && !imgError ? 0 : 1,
        transition: "opacity 0.2s ease",
      }}>{letters}</span>

      {/* Logo overlay when loaded */}
      {logoUrl && !imgError && (
        <img
          src={logoUrl}
          alt={ticker}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            width: size * 0.65,
            height: size * 0.65,
            objectFit: "contain",
            position: "absolute",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.2s ease",
            borderRadius: 4,
            background: "#fff",
            padding: 2,
          }}
        />
      )}
    </div>
  );
}

// ─── TICKER ROW CARD ─────────────────────────────────────────────────────────

function TickerCard({ ticker, data, isSelected, isExpanded, isFavorite, compact, onSelect, onToggleExpand, onToggleFavorite }) {
  const asset = ASSETS[ticker];
  const changeColor = data?.changePercent >= 0 ? COLORS.accent : COLORS.danger;

  // ── Compact mode: logo + ticker + price/change only ──
  if (compact) {
    return (
      <div
        onClick={onSelect}
        style={{
          background: isSelected ? `${asset?.color}10` : COLORS.card,
          border: `1px solid ${isSelected ? `${asset?.color}40` : COLORS.cardBorder}`,
          borderRadius: 8,
          marginBottom: 4,
          cursor: "pointer",
          transition: "all 0.2s ease",
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <TickerLogo ticker={ticker} color={asset?.color || COLORS.accent} size={28} />
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          color: COLORS.textPrimary,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{ticker}</span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.textPrimary,
          fontFamily: "'JetBrains Mono', monospace",
        }}>${data?.price != null ? (data.price >= 1000 ? `${(data.price / 1000).toFixed(1)}k` : data.price >= 100 ? data.price.toFixed(0) : data.price.toFixed(2)) : "—"}</span>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: changeColor,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {data?.changePercent >= 0 ? "+" : ""}{data?.changePercent?.toFixed(1) || "0.0"}%
        </span>
      </div>
    );
  }

  // ── Full mode ──
  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? `${asset?.color}08` : COLORS.card,
        border: `1px solid ${isSelected ? `${asset?.color}40` : COLORS.cardBorder}`,
        borderRadius: 8,
        marginBottom: 6,
        cursor: "pointer",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Main row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 14px",
        gap: 12,
      }}>
        {/* Ticker Logo */}
        <TickerLogo ticker={ticker} color={asset?.color || COLORS.accent} size={36} />

        {/* Ticker & Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 14,
              fontWeight: 800,
              color: COLORS.textPrimary,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{ticker}</span>
            <span style={{
              fontSize: 9,
              color: COLORS.textDim,
              background: COLORS.bgPanel,
              padding: "2px 6px",
              borderRadius: 3,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>{asset?.type}</span>
          </div>
          <div style={{
            fontSize: 10,
            color: COLORS.textSecondary,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>{asset?.name}</div>
        </div>

        {/* Price & Change */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontFamily: "'JetBrains Mono', monospace",
          }}>${data?.price?.toLocaleString() || "—"}</div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: changeColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {data?.changePercent >= 0 ? "+" : ""}{data?.changePercent?.toFixed(2) || "0.00"}%
          </div>
        </div>

        {/* Score indicator */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: COLORS.bgPanel,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            color: data?.compositeScore > 60 ? COLORS.accent : data?.compositeScore > 45 ? COLORS.warn : COLORS.danger,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{data?.compositeScore?.toFixed(0) || "—"}</span>
        </div>

        {/* Favorite toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          style={{
            background: "none",
            border: "none",
            color: isFavorite ? "#f5c542" : COLORS.textDim,
            cursor: "pointer",
            fontSize: 14,
            padding: 4,
            transition: "color 0.15s ease",
            flexShrink: 0,
          }}
        >{isFavorite ? "\u2605" : "\u2606"}</button>

        {/* Expand toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          style={{
            background: "none",
            border: "none",
            color: COLORS.textDim,
            cursor: "pointer",
            fontSize: 12,
            padding: 4,
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >▼</button>
      </div>

      {/* Expanded briefing */}
      {isExpanded && data && (
        <div style={{
          padding: "0 14px 12px 30px",
          borderTop: `1px solid ${COLORS.cardBorder}`,
          marginTop: 0,
          paddingTop: 10,
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            fontSize: 10,
            color: COLORS.textSecondary,
            lineHeight: 1.6,
            marginBottom: 8,
          }}>{data.briefing}</div>
          <div style={{ display: "flex", gap: 12, fontSize: 9, color: COLORS.textDim }}>
            <span>Cap: {data.marketCap}</span>
            <span>Vol: {data.volume24h}</span>
            <span>Sector: {data.sector}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DETAIL PANEL ────────────────────────────────────────────────────────────

function DetailPanel({ data, tab, setTab, priceRange, setPriceRange }) {
  if (!data) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.textDim,
        fontSize: 13,
      }}>
        Select a ticker to view analytics
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "fundamentals", label: "Fundamentals" },
    { id: "technicals", label: "Technicals" },
    { id: "sentiment", label: "Sentiment" },
    { id: "macro", label: "Macro" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Ticker header */}
      <div className="spectrum-detail-header" style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{
          width: 6,
          height: 40,
          borderRadius: 3,
          background: data.color,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
              {data.ticker}
            </span>
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{data.name}</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{data.sector}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
            ${data.price?.toLocaleString()}
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: data.changePercent >= 0 ? COLORS.accent : COLORS.danger,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {data.changePercent >= 0 ? "▲" : "▼"} {Math.abs(data.changePercent).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="spectrum-tab-bar" style={{
        display: "flex",
        gap: 4,
        padding: "10px 18px",
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        background: COLORS.bgPanel,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "6px 14px",
              background: tab === t.id ? COLORS.card : "transparent",
              border: `1px solid ${tab === t.id ? COLORS.cardBorder : "transparent"}`,
              borderRadius: 5,
              color: tab === t.id ? COLORS.textPrimary : COLORS.textSecondary,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="spectrum-detail-content" style={{ flex: 1, overflow: "auto", padding: 18 }}>
        {tab === "overview" && <OverviewTab data={data} priceRange={priceRange} setPriceRange={setPriceRange} />}
        {tab === "fundamentals" && <MetricsTab title="Fundamentals" metrics={data.fundamentals} color={COLORS.accent} />}
        {tab === "technicals" && <MetricsTab title="Technicals" metrics={data.technicals} color="#a78bfa" />}
        {tab === "sentiment" && <MetricsTab title="Sentiment" metrics={data.sentiment} color="#f59e0b" />}
        {tab === "macro" && <MetricsTab title="Macro Factors" metrics={data.macro} color="#38bdf8" />}
      </div>
    </div>
  );
}

const PRICE_RANGES = [
  { id: "1W", label: "1W", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
  { id: "ALL", label: "ALL", days: Infinity },
];

function OverviewTab({ data, priceRange, setPriceRange }) {
  const rangeConfig = PRICE_RANGES.find(r => r.id === priceRange) || PRICE_RANGES[2];
  const chartData = rangeConfig.days === Infinity
    ? data.priceHistory
    : data.priceHistory.slice(-rangeConfig.days);
  return (
    <div className="spectrum-overview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Score + Radar */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 10,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Composite Score
        </div>
        <ScoreRing score={data.compositeScore} size={110} />
        <div style={{ width: "100%", marginTop: 16 }}>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={data.radarData}>
              <PolarGrid stroke={COLORS.gridLine} />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: COLORS.textSecondary, fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={data.color} fill={data.color} fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Price chart */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 10,
        padding: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Price History
          </div>
          <div style={{ display: "flex", gap: 2, background: COLORS.bgPanel, borderRadius: 5, padding: 2 }}>
            {PRICE_RANGES.map(r => (
              <button
                key={r.id}
                onClick={() => setPriceRange(r.id)}
                style={{
                  padding: "3px 10px",
                  background: priceRange === r.id ? COLORS.card : "transparent",
                  border: priceRange === r.id ? `1px solid ${COLORS.cardBorder}` : "1px solid transparent",
                  borderRadius: 4,
                  color: priceRange === r.id ? COLORS.textPrimary : COLORS.textDim,
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >{r.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={data.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={data.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
            <XAxis dataKey="date" tick={{ fill: COLORS.textDim, fontSize: 8 }} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: COLORS.textDim, fontSize: 9 }} tickFormatter={v => `$${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="price" stroke={data.color} fill="url(#priceGrad)" strokeWidth={2} />
            <Line type="monotone" dataKey="sma20" stroke={COLORS.warn} strokeWidth={1} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Key metrics */}
      <div style={{
        gridColumn: "1 / -1",
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 10,
        padding: 18,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
          Key Metrics
        </div>
        <div className="spectrum-key-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "Market Cap", value: data.marketCap },
            { label: "24h Volume", value: data.volume24h },
            { label: "RSI", value: data.technicals.rsi.toFixed(1) },
            { label: "Profit Margin", value: `${data.fundamentals.profitMargin.toFixed(0)}%` },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                {m.value}
              </div>
              <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 2, textTransform: "uppercase" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricsTab({ title, metrics, color }) {
  const formatLabel = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 10,
      padding: 18,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 16 }}>
        {title}
      </div>
      <div className="spectrum-metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          {Object.entries(metrics).slice(0, Math.ceil(Object.keys(metrics).length / 2)).map(([key, value]) => (
            <MetricBar key={key} label={formatLabel(key)} value={value} />
          ))}
        </div>
        <div>
          {Object.entries(metrics).slice(Math.ceil(Object.keys(metrics).length / 2)).map(([key, value]) => (
            <MetricBar key={key} label={formatLabel(key)} value={value} />
          ))}
        </div>
      </div>

      {/* Radar for this dimension */}
      <div style={{ marginTop: 20 }}>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={Object.entries(metrics).map(([k, v]) => ({ metric: formatLabel(k), value: v, fullMark: 100 }))}>
            <PolarGrid stroke={COLORS.gridLine} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.textSecondary, fontSize: 8 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────

export default function SpectrumDashboard() {
  // Stakes = positions I own
  const [stakes] = useState([
    // Semiconductors
    "AVGO", "AMD", "MU", "MCHP", "NVDA", "INTC", "ASML",
    // AI & Tech
    "PLTR", "SMCI", "CRWV", "AMZN",
    // Quantum
    "QBTS", "RGTI",
    // Space & Defense
    "RKLB", "KTOS", "ASTS", "LMT", "GE",
    // EV & Energy
    "TSLA", "QS", "ARRY",
    // Entertainment & Consumer
    "SPOT", "CHWY", "DIS", "AMC", "DJT", "LULU",
    // Retail & Restaurant
    "AEO", "GME", "CBRL", "CAVA", "TSCO",
    // Real Estate & Industrial
    "MPW", "COMP", "LEG",
  ]);
  // Watchlist = tracking but don't own
  const [watchlist] = useState(["AAPL", "MSFT", "GOOGL", "META", "IONQ", "COIN", "BTC", "ETH", "SOL"]);
  const [selected, setSelected] = useState("PLTR");
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState("overview");
  const [cache, setCache] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [dataSource, setDataSource] = useState("loading"); // "live", "synthetic", "loading"
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("3M");
  const [now, setNow] = useState(Date.now());
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("spectrum-favorites")) || []; } catch { return []; }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const isCompact = windowWidth < 768;

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem("spectrum-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((ticker) => {
    setFavorites(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]);
  }, []);

  // Merge live data with asset metadata
  const mergeWithAsset = useCallback((ticker, liveData) => {
    const asset = ASSETS[ticker];
    if (!asset) return null;

    // Generate synthetic metrics for now (these could come from a separate analysis API)
    const rng = seededRandom(ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + Math.floor(Date.now() / 86400000));
    const r = () => rng();

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

    const avg = (obj) => { const vals = Object.values(obj); return vals.reduce((s, v) => s + v, 0) / vals.length; };

    const radarData = [
      { dimension: "Fundamentals", value: avg(dims.fundamentals), fullMark: 100 },
      { dimension: "Technicals", value: avg(dims.technicals), fullMark: 100 },
      { dimension: "Sentiment", value: avg(dims.sentiment), fullMark: 100 },
      { dimension: "Macro", value: avg(dims.macro), fullMark: 100 },
      { dimension: "ESG", value: avg(dims.esg), fullMark: 100 },
      { dimension: "Momentum", value: 25 + r() * 65, fullMark: 100 },
    ];

    const signal = liveData.changePercent > 2 ? "bullish" : liveData.changePercent < -2 ? "bearish" : "neutral";
    const briefing = generateBriefing(ticker, asset, signal, r);

    // Format market cap
    const formatMarketCap = (mc) => {
      if (!mc) return "N/A";
      if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
      if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`;
      if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`;
      return `$${mc.toLocaleString()}`;
    };

    // Format volume
    const formatVolume = (vol) => {
      if (!vol) return "N/A";
      if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
      if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
      if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
      return vol.toLocaleString();
    };

    return {
      ticker,
      ...asset,
      price: liveData.price || 0,
      changePercent: liveData.changePercent || 0,
      previousClose: liveData.previousClose,
      open: liveData.open,
      dayHigh: liveData.dayHigh,
      dayLow: liveData.dayLow,
      marketCap: formatMarketCap(liveData.marketCap),
      volume24h: formatVolume(liveData.volume),
      priceHistory: liveData.priceHistory || [],
      ...dims,
      radarData,
      compositeScore: +avg(radarData.map(d => d.value)).toFixed(1),
      signal,
      briefing,
      lastUpdated: liveData.lastUpdated,
    };
  }, []);

  // Load data from JSON file or fall back to synthetic
  useEffect(() => {
    const loadData = async () => {
      setDataSource("loading");

      try {
        // Try to fetch live data from assets (with cache bust)
        const cacheBust = Date.now();
        const response = await fetch(`./market_data.json?v=${cacheBust}`);
        console.log("Fetch response:", response.status, response.statusText);
        if (response.ok) {
          const data = await response.json();
          const newCache = {};

          // Process stocks
          if (data.stocks) {
            Object.entries(data.stocks).forEach(([ticker, stockData]) => {
              if (!stockData.error) {
                const merged = mergeWithAsset(ticker, stockData);
                if (merged) newCache[ticker] = merged;
              }
            });
          }

          // Process crypto
          if (data.crypto) {
            Object.entries(data.crypto).forEach(([ticker, cryptoData]) => {
              const merged = mergeWithAsset(ticker, cryptoData);
              if (merged) newCache[ticker] = merged;
            });
          }

          // Fill in any missing tickers with synthetic data
          [...stakes, ...watchlist].forEach(ticker => {
            if (!newCache[ticker]) {
              newCache[ticker] = generateAssetData(ticker);
            }
          });

          setCache(newCache);
          setLastUpdated(data.generated ? new Date(data.generated) : null);
          setDataSource("live");
          console.log(`Loaded live data for ${Object.keys(newCache).length} assets`);
          return;
        }
      } catch (err) {
        console.log("No live data available, using synthetic:", err.message);
      }

      // Fall back to synthetic data
      const newCache = {};
      [...stakes, ...watchlist].forEach(ticker => {
        newCache[ticker] = generateAssetData(ticker);
      });
      setCache(newCache);
      setDataSource("synthetic");
    };

    loadData();
  }, [stakes, watchlist, refreshKey, mergeWithAsset]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Track window width for responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep relative time display fresh (tick every 30s)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort ticker lists
  const filterAndSort = useCallback((tickers) => {
    let filtered = tickers;
    if (showFavoritesOnly) {
      filtered = filtered.filter(ticker => favorites.includes(ticker));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ticker => {
        const asset = ASSETS[ticker];
        return ticker.toLowerCase().includes(q) ||
          asset?.name?.toLowerCase().includes(q) ||
          asset?.sector?.toLowerCase().includes(q);
      });
    }
    if (sortBy !== "default") {
      filtered = [...filtered].sort((a, b) => {
        const da = cache[a], db = cache[b];
        switch (sortBy) {
          case "score": return (db?.compositeScore || 0) - (da?.compositeScore || 0);
          case "change": return (db?.changePercent || 0) - (da?.changePercent || 0);
          case "alpha": return a.localeCompare(b);
          case "price": return (db?.price || 0) - (da?.price || 0);
          default: return 0;
        }
      });
    }
    return filtered;
  }, [searchQuery, sortBy, cache, showFavoritesOnly, favorites]);

  const filteredStakes = useMemo(() => filterAndSort(stakes), [filterAndSort, stakes]);
  const filteredWatchlist = useMemo(() => filterAndSort(watchlist), [filterAndSort, watchlist]);

  const selectedData = cache[selected];

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: COLORS.bg,
      color: COLORS.textPrimary,
      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bgPanel}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.cardBorder}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.textDim}; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 767px) {
          .spectrum-header-title { display: none !important; }
          .spectrum-header-center { display: none !important; }
          .spectrum-overview-grid { grid-template-columns: 1fr !important; }
          .spectrum-metrics-grid { grid-template-columns: 1fr !important; }
          .spectrum-key-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .spectrum-tab-bar { overflow-x: auto; flex-wrap: nowrap; }
          .spectrum-tab-bar button { white-space: nowrap; font-size: 10px !important; padding: 5px 8px !important; }
          .spectrum-detail-header { padding: 10px 12px !important; }
          .spectrum-detail-content { padding: 12px !important; }
        }
      `}</style>

      {/* ═══ TOP HEADER PANEL ═══ */}
      <header style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: COLORS.bgPanel,
        flexShrink: 0,
      }}>
        {/* Logo & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.accent}, #00b4f7)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 16,
            color: COLORS.bg,
            fontFamily: "'JetBrains Mono', monospace",
          }}>S</div>
          <div className="spectrum-header-title">
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: COLORS.textPrimary,
              fontFamily: "'JetBrains Mono', monospace",
            }}>SPECTRUM</div>
            <div style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.15em",
              color: COLORS.textDim,
              textTransform: "uppercase",
            }}>Market Intelligence Dashboard</div>
          </div>
        </div>

        {/* Center: Data source indicator */}
        <div className="spectrum-header-center" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dataSource === "live" ? COLORS.accent : dataSource === "loading" ? COLORS.warn : COLORS.textDim,
              animation: dataSource === "loading" ? "pulse 1s ease infinite" : dataSource === "live" ? "pulse 2s ease infinite" : "none",
              boxShadow: dataSource === "live" ? `0 0 10px ${COLORS.accent}` : "none",
            }} />
            <span style={{
              fontSize: 10,
              color: dataSource === "live" ? COLORS.accent : dataSource === "loading" ? COLORS.warn : COLORS.textSecondary,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              {dataSource === "live" ? "Live Data" : dataSource === "loading" ? "Loading..." : "Simulated"}
            </span>
          </div>
          {lastUpdated && dataSource === "live" && (
            <span style={{
              fontSize: 9,
              color: COLORS.textDim,
              fontFamily: "'JetBrains Mono', monospace",
            }}
              title={lastUpdated.toLocaleString()}
            >
              Updated {relativeTime(lastUpdated, now)} &middot; auto-refresh 5m
            </span>
          )}
          {dataSource === "synthetic" && (
            <span style={{
              fontSize: 9,
              color: COLORS.warn,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Run RUN_MARKET_UPDATE.bat for real data
            </span>
          )}
        </div>

        {/* Right: Settings */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { setCache({}); setRefreshKey(k => k + 1); }}
            style={{
              padding: "6px 12px",
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 6,
              color: COLORS.textSecondary,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >↻ Reload</button>
          <div style={{
            fontSize: 10,
            color: COLORS.textDim,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{new Date().toLocaleDateString()}</div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT: LEFT/RIGHT SPLIT ═══ */}
      <div style={{
        flex: 1,
        display: "flex",
        minHeight: 0,
      }}>
        {/* LEFT PANEL: Ticker List */}
        <div style={{
          flex: isCompact ? "none" : 1,
          width: isCompact ? 140 : "auto",
          borderRight: `1px solid ${COLORS.cardBorder}`,
          background: COLORS.bgPanel,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* ─── SEARCH & SORT TOOLBAR ─── */}
          {!isCompact && <div style={{
            padding: "10px 10px 6px",
            borderBottom: `1px solid ${COLORS.cardBorder}`,
            background: COLORS.bgPanel,
            flexShrink: 0,
          }}>
            {/* Search input */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 12,
                color: COLORS.textDim,
                pointerEvents: "none",
              }}>&#x2315;</span>
              <input
                type="text"
                placeholder="Search ticker, name, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 28px",
                  background: COLORS.card,
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 6,
                  color: COLORS.textPrimary,
                  fontSize: 11,
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.accent + "66"}
                onBlur={(e) => e.target.style.borderColor = COLORS.cardBorder}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: COLORS.textDim,
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 2,
                    lineHeight: 1,
                  }}
                >&times;</button>
              )}
            </div>
            {/* Sort options */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {/* Favorites filter */}
              <button
                onClick={() => setShowFavoritesOnly(prev => !prev)}
                title={showFavoritesOnly ? "Show all tickers" : "Show favorites only"}
                style={{
                  padding: "5px 8px",
                  background: showFavoritesOnly ? "#f5c54218" : "transparent",
                  border: `1px solid ${showFavoritesOnly ? "#f5c54244" : COLORS.cardBorder}`,
                  borderRadius: 4,
                  color: showFavoritesOnly ? "#f5c542" : COLORS.textDim,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >{showFavoritesOnly ? "\u2605" : "\u2606"}</button>
              {[
                { id: "default", label: "Default" },
                { id: "score", label: "Score" },
                { id: "change", label: "Change%" },
                { id: "price", label: "Price" },
                { id: "alpha", label: "A-Z" },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(sortBy === opt.id ? "default" : opt.id)}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    background: sortBy === opt.id ? `${COLORS.accent}18` : "transparent",
                    border: `1px solid ${sortBy === opt.id ? COLORS.accent + "44" : COLORS.cardBorder}`,
                    borderRadius: 4,
                    color: sortBy === opt.id ? COLORS.accent : COLORS.textDim,
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>}

          <div style={{ flex: 1, overflow: "auto" }}>
            {/* STAKES SECTION */}
            <div
              onClick={() => toggleSection("stakes")}
              style={{
                padding: isCompact ? "8px 6px" : "12px 14px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: isCompact ? "center" : "space-between",
                cursor: "pointer",
                background: COLORS.card,
              }}
            >
              {isCompact ? (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: COLORS.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>Stakes</span>
              ) : (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>Stakes</span>
                <span style={{
                  fontSize: 9,
                  color: COLORS.textDim,
                  background: COLORS.bgPanel,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}>Owned</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: COLORS.textSecondary }}>
                  {filteredStakes.length !== stakes.length ? `${filteredStakes.length}/` : ""}{stakes.length}
                </span>
                <span style={{
                  color: COLORS.textDim,
                  fontSize: 10,
                  transform: collapsedSections.stakes ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}>▼</span>
              </div>
              </>)}
            </div>
            {!collapsedSections.stakes && (
              <div style={{ padding: isCompact ? "6px 4px" : "10px 10px" }}>
                {filteredStakes.map(ticker => (
                  <TickerCard
                    key={ticker}
                    ticker={ticker}
                    data={cache[ticker]}
                    isSelected={selected === ticker}
                    isExpanded={!isCompact && expanded === ticker}
                    isFavorite={favorites.includes(ticker)}
                    compact={isCompact}
                    onSelect={() => setSelected(ticker)}
                    onToggleExpand={() => setExpanded(expanded === ticker ? null : ticker)}
                    onToggleFavorite={() => toggleFavorite(ticker)}
                  />
                ))}
              </div>
            )}

            {/* WATCHLIST SECTION */}
            <div
              onClick={() => toggleSection("watchlist")}
              style={{
                padding: isCompact ? "8px 6px" : "12px 14px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: isCompact ? "center" : "space-between",
                cursor: "pointer",
                background: COLORS.card,
              }}
            >
              {isCompact ? (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>Watch</span>
              ) : (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>Watchlist</span>
                <span style={{
                  fontSize: 9,
                  color: COLORS.textDim,
                  background: COLORS.bgPanel,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}>Tracking</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: COLORS.textSecondary }}>
                  {filteredWatchlist.length !== watchlist.length ? `${filteredWatchlist.length}/` : ""}{watchlist.length}
                </span>
                <span style={{
                  color: COLORS.textDim,
                  fontSize: 10,
                  transform: collapsedSections.watchlist ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}>▼</span>
              </div>
              </>)}
            </div>
            {!collapsedSections.watchlist && (
              <div style={{ padding: isCompact ? "6px 4px" : "10px 10px" }}>
                {filteredWatchlist.map(ticker => (
                  <TickerCard
                    key={ticker}
                    ticker={ticker}
                    data={cache[ticker]}
                    isSelected={selected === ticker}
                    isExpanded={!isCompact && expanded === ticker}
                    isFavorite={favorites.includes(ticker)}
                    compact={isCompact}
                    onSelect={() => setSelected(ticker)}
                    onToggleExpand={() => setExpanded(expanded === ticker ? null : ticker)}
                    onToggleFavorite={() => toggleFavorite(ticker)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Detail View */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: COLORS.bg,
          minHeight: 0,
          minWidth: 0,
        }}>
          <DetailPanel
            data={selectedData}
            tab={tab}
            setTab={setTab}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: "8px 20px",
        borderTop: `1px solid ${COLORS.cardBorder}`,
        background: COLORS.bgPanel,
        fontSize: 9,
        color: COLORS.textDim,
        textAlign: "center",
        flexShrink: 0,
      }}>
        SPECTRUM v3 — {dataSource === "live"
          ? "Live market data from Yahoo Finance & CoinGecko. Composite scores are analytical estimates."
          : "Run RUN_MARKET_UPDATE.bat to fetch live market data. Currently showing simulated prices."}
      </footer>
    </div>
  );
}
