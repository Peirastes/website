import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as d3 from "d3";
import * as recharts from "recharts";

const {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Cell, Legend, ReferenceLine
} = recharts;

// ─── MOCK DATA ENGINE ────────────────────────────────────────────────────────
// In production, replace with real API calls (Alpha Vantage, Polygon.io, etc.)

const ASSETS = {
  AAPL: { name: "Apple Inc.", sector: "Technology", type: "stock", color: "#00d4aa" },
  MSFT: { name: "Microsoft Corp.", sector: "Technology", type: "stock", color: "#00b4f7" },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology", type: "stock", color: "#ff6b6b" },
  AMZN: { name: "Amazon.com Inc.", sector: "Consumer Cyclical", type: "stock", color: "#ffa94d" },
  TSLA: { name: "Tesla Inc.", sector: "Automotive", type: "stock", color: "#e64980" },
  NVDA: { name: "NVIDIA Corp.", sector: "Semiconductors", type: "stock", color: "#7950f2" },
  META: { name: "Meta Platforms", sector: "Technology", type: "stock", color: "#4dabf7" },
  JPM: { name: "JPMorgan Chase", sector: "Financial", type: "stock", color: "#20c997" },
  BTC: { name: "Bitcoin", sector: "Cryptocurrency", type: "crypto", color: "#f7931a" },
  ETH: { name: "Ethereum", sector: "Cryptocurrency", type: "crypto", color: "#627eea" },
  SOL: { name: "Solana", sector: "Cryptocurrency", type: "crypto", color: "#9945ff" },
  XRP: { name: "Ripple", sector: "Cryptocurrency", type: "crypto", color: "#00aae4" },
};

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateAssetData(ticker) {
  const rng = seededRandom(ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + Date.now() % 1000);
  const r = () => rng();

  const basePrice = ASSETS[ticker]?.type === "crypto"
    ? (ticker === "BTC" ? 67000 + r() * 30000 : ticker === "ETH" ? 2800 + r() * 1500 : 20 + r() * 200)
    : 50 + r() * 400;

  const changePercent = (r() - 0.45) * 8;
  const price = basePrice * (1 + changePercent / 100);

  // Multi-dimensional signals (0-100 scale)
  const fundamentals = {
    revenueGrowth: 30 + r() * 65,
    profitMargin: 20 + r() * 60,
    debtToEquity: r() * 80,
    freeCashFlow: 25 + r() * 70,
    bookValue: 30 + r() * 55,
    earningsQuality: 35 + r() * 60,
  };

  const technicals = {
    rsi: 20 + r() * 60,
    macdSignal: 25 + r() * 70,
    bollingerPosition: 15 + r() * 75,
    volumeTrend: 30 + r() * 65,
    movingAvgAlignment: 20 + r() * 75,
    supportResistance: 30 + r() * 60,
  };

  const sentiment = {
    newsScore: 25 + r() * 70,
    socialBuzz: 15 + r() * 80,
    analystConsensus: 30 + r() * 65,
    institutionalFlow: 20 + r() * 70,
    retailSentiment: 25 + r() * 65,
    fearGreedIndex: 15 + r() * 80,
  };

  const macro = {
    sectorMomentum: 30 + r() * 60,
    interestRateSensitivity: r() * 85,
    inflationHedge: 20 + r() * 70,
    geopoliticalRisk: r() * 75,
    regulatoryClimate: 30 + r() * 60,
    currencyExposure: 20 + r() * 60,
  };

  const esg = {
    environmentalScore: 25 + r() * 70,
    socialScore: 30 + r() * 60,
    governanceScore: 35 + r() * 60,
    controversyRisk: r() * 65,
    sustainabilityTrend: 30 + r() * 65,
  };

  // Time series data (90 days)
  const priceHistory = [];
  let p = price * (1 - changePercent / 50);
  for (let i = 90; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    p = p * (1 + (r() - 0.48) * 0.035);
    priceHistory.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: +p.toFixed(2),
      volume: Math.floor(1e6 + r() * 5e7),
      sma20: 0,
      sma50: 0,
    });
  }

  // Calculate SMAs
  for (let i = 0; i < priceHistory.length; i++) {
    if (i >= 19) {
      priceHistory[i].sma20 = +(priceHistory.slice(i - 19, i + 1).reduce((s, d) => s + d.price, 0) / 20).toFixed(2);
    }
    if (i >= 49) {
      priceHistory[i].sma50 = +(priceHistory.slice(i - 49, i + 1).reduce((s, d) => s + d.price, 0) / 50).toFixed(2);
    }
  }

  // News items
  const newsTemplates = [
    { title: `${ASSETS[ticker]?.name} Reports Strong Q4 Earnings Beat`, impact: "positive", category: "earnings" },
    { title: `Analysts Upgrade ${ticker} on Robust Growth Outlook`, impact: "positive", category: "analyst" },
    { title: `${ASSETS[ticker]?.name} Faces Regulatory Scrutiny in EU Markets`, impact: "negative", category: "regulatory" },
    { title: `${ticker} Shows Technical Breakout Above Key Resistance`, impact: "positive", category: "technical" },
    { title: `Institutional Investors Increase ${ticker} Holdings by 12%`, impact: "positive", category: "institutional" },
    { title: `Market Volatility Impacts ${ASSETS[ticker]?.sector} Sector`, impact: "neutral", category: "macro" },
    { title: `${ASSETS[ticker]?.name} Announces Strategic Partnership`, impact: "positive", category: "corporate" },
    { title: `Short Interest in ${ticker} Rises to 3-Month High`, impact: "negative", category: "technical" },
  ];
  const news = newsTemplates.sort(() => r() - 0.5).slice(0, 5).map((n, i) => ({
    ...n,
    time: `${Math.floor(1 + r() * 23)}h ago`,
    id: i,
  }));

  // Radar dimensions
  const radarData = [
    { dimension: "Fundamentals", value: avg(Object.values(fundamentals)), fullMark: 100 },
    { dimension: "Technicals", value: avg(Object.values(technicals)), fullMark: 100 },
    { dimension: "Sentiment", value: avg(Object.values(sentiment)), fullMark: 100 },
    { dimension: "Macro", value: avg(Object.values(macro)), fullMark: 100 },
    { dimension: "ESG", value: avg(Object.values(esg)), fullMark: 100 },
    { dimension: "Momentum", value: 30 + r() * 60, fullMark: 100 },
  ];

  const compositeScore = avg(radarData.map((d) => d.value));

  return {
    ticker,
    ...ASSETS[ticker],
    price: +price.toFixed(2),
    changePercent: +changePercent.toFixed(2),
    marketCap: `$${(price * (1e8 + r() * 2e10) / 1e9).toFixed(1)}B`,
    volume24h: `${(1 + r() * 50).toFixed(1)}M`,
    fundamentals,
    technicals,
    sentiment,
    macro,
    esg,
    priceHistory,
    news,
    radarData,
    compositeScore: +compositeScore.toFixed(1),
  };
}

function avg(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function SignalGauge({ value, label, size = 48 }) {
  const color = value > 70 ? "#00d4aa" : value > 45 ? "#ffa94d" : "#ff6b6b";
  const circumference = Math.PI * (size - 8);
  const offset = circumference * (1 - value / 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + 4}`}>
        <path
          d={`M 4,${size / 2} A ${size / 2 - 4},${size / 2 - 4} 0 0 1 ${size - 4},${size / 2}`}
          fill="none" stroke="#1a1f2e" strokeWidth={6} strokeLinecap="round"
        />
        <path
          d={`M 4,${size / 2} A ${size / 2 - 4},${size / 2 - 4} 0 0 1 ${size - 4},${size / 2}`}
          fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill={color}
          style={{ fontSize: size > 60 ? 16 : 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {value.toFixed(0)}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: "#6b7394", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}

function MetricBar({ label, value, color = "#00d4aa" }) {
  const barColor = value > 70 ? "#00d4aa" : value > 45 ? "#ffa94d" : "#ff6b6b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "#8892b0", width: 130, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "#141824", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${value}%`, height: "100%", background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
          borderRadius: 3, transition: "width 0.8s ease",
        }} />
      </div>
      <span style={{ fontSize: 11, color: barColor, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", width: 30, textAlign: "right" }}>
        {value.toFixed(0)}
      </span>
    </div>
  );
}

function NewsCard({ item }) {
  const impactColors = { positive: "#00d4aa", negative: "#ff6b6b", neutral: "#ffa94d" };
  return (
    <div style={{
      padding: "12px 14px", background: "#0e1117", borderRadius: 8, borderLeft: `3px solid ${impactColors[item.impact]}`,
      marginBottom: 8, transition: "background 0.2s", cursor: "pointer",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#141824"}
      onMouseLeave={(e) => e.currentTarget.style.background = "#0e1117"}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#ccd6f6", lineHeight: 1.4, marginBottom: 6 }}>{item.title}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{
          fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700,
          color: impactColors[item.impact], background: `${impactColors[item.impact]}15`, padding: "2px 6px", borderRadius: 3,
        }}>{item.impact}</span>
        <span style={{ fontSize: 10, color: "#4a5275" }}>{item.category}</span>
        <span style={{ fontSize: 10, color: "#4a5275", marginLeft: "auto" }}>{item.time}</span>
      </div>
    </div>
  );
}

function HeatmapCell({ value, label }) {
  const intensity = value / 100;
  const color = value > 65 ? `rgba(0,212,170,${0.2 + intensity * 0.6})` :
    value > 40 ? `rgba(255,169,77,${0.2 + intensity * 0.5})` :
      `rgba(255,107,107,${0.2 + intensity * 0.6})`;
  return (
    <div style={{
      background: color, borderRadius: 6, padding: "8px 6px", textAlign: "center",
      border: "1px solid rgba(255,255,255,0.04)", minWidth: 70, flex: 1,
    }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#e6f1ff", fontFamily: "'JetBrains Mono', monospace" }}>
        {value.toFixed(0)}
      </div>
      <div style={{ fontSize: 8, color: "#8892b0", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

function CompositeScoreRing({ score, size = 140 }) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = score > 70 ? "#00d4aa" : score > 50 ? "#ffa94d" : "#ff6b6b";
  const grade = score > 80 ? "A+" : score > 70 ? "A" : score > 60 ? "B+" : score > 50 ? "B" : score > 40 ? "C" : "D";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#141824" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease, stroke 0.5s ease" }}
        />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`${color}30`} strokeWidth={16}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease", filter: "blur(6px)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
          {score.toFixed(0)}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: `${color}aa`, marginTop: 2 }}>{grade}</div>
      </div>
    </div>
  );
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1a1f2e", border: "1px solid #2a3050", borderRadius: 8, padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontSize: 11, color: "#6b7394", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color || "#ccd6f6", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function MarketAnalyticsDashboard() {
  const [selectedTickers, setSelectedTickers] = useState(["AAPL", "BTC", "NVDA"]);
  const [activeTicker, setActiveTicker] = useState("AAPL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [assetDataCache, setAssetDataCache] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const loadAsset = useCallback((ticker) => {
    setIsLoading(true);
    setTimeout(() => {
      setAssetDataCache((prev) => ({ ...prev, [ticker]: generateAssetData(ticker) }));
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    selectedTickers.forEach((t) => {
      if (!assetDataCache[t]) loadAsset(t);
    });
  }, [selectedTickers, loadAsset]);

  const activeData = assetDataCache[activeTicker];

  const addTicker = (ticker) => {
    if (!selectedTickers.includes(ticker)) {
      setSelectedTickers((prev) => [...prev, ticker]);
    }
    setActiveTicker(ticker);
    if (!assetDataCache[ticker]) loadAsset(ticker);
    setShowSearch(false);
    setSearchQuery("");
  };

  const removeTicker = (ticker) => {
    setSelectedTickers((prev) => prev.filter((t) => t !== ticker));
    if (activeTicker === ticker) {
      setActiveTicker(selectedTickers.find((t) => t !== ticker) || "");
    }
  };

  const filteredAssets = Object.entries(ASSETS).filter(([ticker, info]) =>
    (ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      info.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !selectedTickers.includes(ticker)
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "fundamentals", label: "Fundamentals" },
    { id: "technicals", label: "Technicals" },
    { id: "sentiment", label: "Sentiment" },
    { id: "macro", label: "Macro" },
    { id: "news", label: "News" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b12",
      color: "#ccd6f6",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      overflow: "auto",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 3px; }
        input::placeholder { color: #4a5275; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .card { background: #0d1119; border: 1px solid #161d2e; border-radius: 12px; padding: 20px; animation: fadeIn 0.4s ease; }
        .card:hover { border-color: #1e2740; }
        .glow-line { height: 1px; background: linear-gradient(90deg, transparent, #00d4aa33, transparent); margin: 0 -20px; }
      `}</style>

      {/* ─── HEADER ─────────────────────────────────────── */}
      <header style={{
        padding: "16px 24px", borderBottom: "1px solid #111827",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        background: "linear-gradient(180deg, #0d1119 0%, #080b12 100%)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #00d4aa, #00b4f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#080b12",
          }}>S</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", color: "#e6f1ff" }}>
              SPECTRUM
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.15em", color: "#4a5275", textTransform: "uppercase" }}>
              Multi-Dimensional Analytics
            </div>
          </div>
        </div>

        {/* Watchlist chips */}
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap", marginLeft: 16 }}>
          {selectedTickers.map((ticker) => {
            const asset = ASSETS[ticker];
            const data = assetDataCache[ticker];
            const isActive = ticker === activeTicker;
            return (
              <button key={ticker} onClick={() => setActiveTicker(ticker)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                background: isActive ? `${asset?.color}18` : "#0e1117",
                border: `1px solid ${isActive ? `${asset?.color}40` : "#1a1f2e"}`,
                borderRadius: 8, cursor: "pointer", color: isActive ? asset?.color : "#8892b0",
                fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                transition: "all 0.2s",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: asset?.color, flexShrink: 0 }} />
                {ticker}
                {data && (
                  <span style={{ color: data.changePercent >= 0 ? "#00d4aa" : "#ff6b6b", fontSize: 10 }}>
                    {data.changePercent >= 0 ? "+" : ""}{data.changePercent}%
                  </span>
                )}
                <span onClick={(e) => { e.stopPropagation(); removeTicker(ticker); }}
                  style={{ marginLeft: 2, opacity: 0.4, fontSize: 14, lineHeight: 1 }}>×</span>
              </button>
            );
          })}

          {/* Add button */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowSearch(!showSearch)} style={{
              padding: "6px 12px", background: "#0e1117", border: "1px dashed #2a3050",
              borderRadius: 8, cursor: "pointer", color: "#4a5275", fontSize: 18, lineHeight: 1,
              fontWeight: 400, transition: "all 0.2s",
            }}>+</button>

            {showSearch && (
              <div style={{
                position: "absolute", top: "100%", left: 0, marginTop: 6,
                background: "#0d1119", border: "1px solid #1e2740", borderRadius: 10,
                padding: 8, width: 260, zIndex: 200, boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              }}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticker or name..."
                  style={{
                    width: "100%", padding: "8px 12px", background: "#141824",
                    border: "1px solid #1e2740", borderRadius: 6, color: "#ccd6f6",
                    fontSize: 12, outline: "none", fontFamily: "inherit",
                  }}
                />
                <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 6 }}>
                  {filteredAssets.map(([ticker, info]) => (
                    <div key={ticker} onClick={() => addTicker(ticker)} style={{
                      padding: "8px 10px", cursor: "pointer", borderRadius: 6,
                      display: "flex", alignItems: "center", gap: 8, transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#141824"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: info.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#e6f1ff", fontFamily: "'JetBrains Mono', monospace" }}>
                        {ticker}
                      </span>
                      <span style={{ fontSize: 11, color: "#6b7394" }}>{info.name}</span>
                      <span style={{
                        fontSize: 9, marginLeft: "auto", padding: "1px 5px", borderRadius: 3,
                        background: info.type === "crypto" ? "#f7931a18" : "#00d4aa18",
                        color: info.type === "crypto" ? "#f7931a" : "#00d4aa",
                        fontWeight: 600, textTransform: "uppercase",
                      }}>{info.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4aa", animation: "pulse 2s ease infinite" }} />
          <span style={{ fontSize: 10, color: "#4a5275", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Live
          </span>
        </div>
      </header>

      {/* ─── MAIN CONTENT ──────────────────────────────── */}
      {!activeData ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: "linear-gradient(135deg, #00d4aa20, #00b4f720)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 36 }}>📊</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e6f1ff" }}>Select an Asset to Analyze</div>
          <div style={{ fontSize: 13, color: "#6b7394" }}>Add stocks or cryptocurrencies to your watchlist above</div>
        </div>
      ) : (
        <div style={{ padding: "20px 24px", animation: "fadeIn 0.3s ease" }}>
          {/* Asset Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{
                  fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  background: activeData.type === "crypto" ? "#f7931a18" : "#00d4aa18",
                  color: activeData.type === "crypto" ? "#f7931a" : "#00d4aa",
                }}>{activeData.sector}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#e6f1ff", letterSpacing: "-0.02em" }}>
                {activeData.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#e6f1ff" }}>
                  ${activeData.price.toLocaleString()}
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 700,
                  color: activeData.changePercent >= 0 ? "#00d4aa" : "#ff6b6b",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {activeData.changePercent >= 0 ? "▲" : "▼"} {Math.abs(activeData.changePercent)}%
                </span>
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#4a5275", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Mkt Cap</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#8892b0", fontFamily: "'JetBrains Mono', monospace" }}>{activeData.marketCap}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#4a5275", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>24h Vol</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#8892b0", fontFamily: "'JetBrains Mono', monospace" }}>{activeData.volume24h}</div>
                </div>
              </div>
            </div>

            {/* Composite Score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 9, color: "#4a5275", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 8 }}>
                Composite Score
              </div>
              <CompositeScoreRing score={activeData.compositeScore} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: 2, marginBottom: 20, background: "#0a0e17",
            borderRadius: 10, padding: 3, border: "1px solid #141824",
          }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                background: activeTab === tab.id ? "#1a1f2e" : "transparent",
                color: activeTab === tab.id ? "#e6f1ff" : "#4a5275",
                transition: "all 0.2s",
              }}>{tab.label}</button>
            ))}
          </div>

          {/* ─── TAB: OVERVIEW ─────────────────── */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Radar Chart */}
              <div className="card" style={{ gridColumn: "1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Multi-Dimensional Signal Map</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 12 }}>Full-spectrum assessment across 6 core dimensions</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={activeData.radarData}>
                    <PolarGrid stroke="#1a1f2e" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: "#6b7394", fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#4a5275", fontSize: 9 }} />
                    <Radar name="Score" dataKey="value" stroke={activeData.color} fill={activeData.color}
                      fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: activeData.color }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Dimension Heatmap */}
              <div className="card" style={{ gridColumn: "2" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Signal Heatmap</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 16 }}>Sub-dimension breakdown per category</div>

                {[
                  { label: "Fundamentals", data: activeData.fundamentals },
                  { label: "Technicals", data: activeData.technicals },
                  { label: "Sentiment", data: activeData.sentiment },
                ].map(({ label, data }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8892b0", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {label}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {Object.entries(data).map(([key, val]) => (
                        <HeatmapCell key={key} value={val}
                          label={key.replace(/([A-Z])/g, " $1").trim().slice(0, 12)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Chart */}
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff" }}>Price Action & Moving Averages</div>
                    <div style={{ fontSize: 10, color: "#4a5275" }}>90-day price with SMA-20 and SMA-50</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={activeData.priceHistory.slice(-60)}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeData.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={activeData.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#141824" />
                    <XAxis dataKey="date" tick={{ fill: "#4a5275", fontSize: 9 }} axisLine={{ stroke: "#141824" }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: "#4a5275", fontSize: 10 }} axisLine={{ stroke: "#141824" }}
                      tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="price" stroke={activeData.color} strokeWidth={2}
                      fill="url(#priceGrad)" name="Price" />
                    <Line type="monotone" dataKey="sma20" stroke="#ffa94d" strokeWidth={1.5}
                      dot={false} strokeDasharray="4 2" name="SMA 20" />
                    <Line type="monotone" dataKey="sma50" stroke="#7950f2" strokeWidth={1.5}
                      dot={false} strokeDasharray="6 3" name="SMA 50" />
                    <Bar dataKey="volume" fill="#1a1f2e" yAxisId="right" opacity={0.3} name="Volume" />
                    <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Signal Gauges */}
              <div className="card" style={{ gridColumn: "1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 16 }}>Quick Signal Gauges</div>
                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
                  {activeData.radarData.map((d) => (
                    <SignalGauge key={d.dimension} value={d.value} label={d.dimension} size={64} />
                  ))}
                </div>
              </div>

              {/* Latest News */}
              <div className="card" style={{ gridColumn: "2" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Market Intelligence</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 12 }}>Latest news & events</div>
                {activeData.news.slice(0, 4).map((n) => <NewsCard key={n.id} item={n} />)}
              </div>
            </div>
          )}

          {/* ─── TAB: FUNDAMENTALS ─────────────────── */}
          {activeTab === "fundamentals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 16 }}>Fundamental Metrics</div>
                {Object.entries(activeData.fundamentals).map(([key, val]) => (
                  <MetricBar key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={val} />
                ))}
              </div>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Fundamental Radar</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 12 }}>Relative strength across fundamental categories</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={Object.entries(activeData.fundamentals).map(([k, v]) => ({
                    metric: k.replace(/([A-Z])/g, " $1").trim(), value: v, fullMark: 100,
                  }))}>
                    <PolarGrid stroke="#1a1f2e" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#6b7394", fontSize: 9, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Fundamental Assessment</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 16 }}>Composite view across all fundamental sub-dimensions</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(activeData.fundamentals).map(([k, v]) => ({
                    name: k.replace(/([A-Z])/g, " $1").trim().slice(0, 14), value: +v.toFixed(1),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#141824" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7394", fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#4a5275", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {Object.values(activeData.fundamentals).map((v, i) => (
                        <Cell key={i} fill={v > 70 ? "#00d4aa" : v > 45 ? "#ffa94d" : "#ff6b6b"} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── TAB: TECHNICALS ─────────────────── */}
          {activeTab === "technicals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 16 }}>Technical Indicators</div>
                {Object.entries(activeData.technicals).map(([key, val]) => (
                  <MetricBar key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={val} />
                ))}
              </div>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Volume Profile</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 12 }}>30-day volume distribution</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={activeData.priceHistory.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#141824" />
                    <XAxis dataKey="date" tick={{ fill: "#4a5275", fontSize: 9 }} />
                    <YAxis tick={{ fill: "#4a5275", fontSize: 9 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" name="Volume" radius={[2, 2, 0, 0]}>
                      {activeData.priceHistory.slice(-30).map((d, i) => (
                        <Cell key={i} fill={i > 0 && d.price >= activeData.priceHistory.slice(-30)[i - 1]?.price ? "#00d4aa44" : "#ff6b6b44"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Price with Bollinger Context</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 12 }}>Price action relative to SMA-20 envelope</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={activeData.priceHistory.slice(-60)}>
                    <defs>
                      <linearGradient id="techGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7950f2" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7950f2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#141824" />
                    <XAxis dataKey="date" tick={{ fill: "#4a5275", fontSize: 9 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: "#4a5275", fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="price" stroke="#7950f2" fill="url(#techGrad)" strokeWidth={2} name="Price" />
                    <Line type="monotone" dataKey="sma20" stroke="#ffa94d" strokeWidth={1} dot={false} name="SMA 20" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── TAB: SENTIMENT ─────────────────── */}
          {activeTab === "sentiment" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 16 }}>Sentiment Indicators</div>
                {Object.entries(activeData.sentiment).map(([key, val]) => (
                  <MetricBar key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={val} />
                ))}
              </div>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Sentiment Radar</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={Object.entries(activeData.sentiment).map(([k, v]) => ({
                    metric: k.replace(/([A-Z])/g, " $1").trim(), value: v, fullMark: 100,
                  }))}>
                    <PolarGrid stroke="#1a1f2e" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#6b7394", fontSize: 9, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#e64980" fill="#e64980" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>ESG & Societal Profile</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 16 }}>Environmental, Social & Governance assessment</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {Object.entries(activeData.esg).map(([key, val]) => (
                    <HeatmapCell key={key} value={val} label={key.replace(/([A-Z])/g, " $1").trim().slice(0, 16)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: MACRO ─────────────────── */}
          {activeTab === "macro" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 16 }}>Macroeconomic Factors</div>
                {Object.entries(activeData.macro).map(([key, val]) => (
                  <MetricBar key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={val} />
                ))}
              </div>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Macro Radar</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={Object.entries(activeData.macro).map(([k, v]) => ({
                    metric: k.replace(/([A-Z])/g, " $1").trim(), value: v, fullMark: 100,
                  }))}>
                    <PolarGrid stroke="#1a1f2e" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#6b7394", fontSize: 9, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#00b4f7" fill="#00b4f7" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 16 }}>Macro Factor Comparison</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(activeData.macro).map(([k, v]) => ({
                    name: k.replace(/([A-Z])/g, " $1").trim().slice(0, 16), value: +v.toFixed(1),
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#141824" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#4a5275", fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#6b7394", fontSize: 9 }} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {Object.values(activeData.macro).map((v, i) => (
                        <Cell key={i} fill={v > 60 ? "#00b4f7" : v > 40 ? "#ffa94d" : "#ff6b6b"} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── TAB: NEWS ─────────────────── */}
          {activeTab === "news" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ gridColumn: "1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Market Intelligence Feed</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 14 }}>
                  Latest news, events, and signals for {activeData.ticker}
                </div>
                {activeData.news.map((n) => <NewsCard key={n.id} item={n} />)}
              </div>
              <div className="card" style={{ gridColumn: "2" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e6f1ff", marginBottom: 4 }}>Signal Summary</div>
                <div style={{ fontSize: 10, color: "#4a5275", marginBottom: 16 }}>
                  Aggregated intelligence assessment
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#8892b0", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Dimension Scores
                  </div>
                  {activeData.radarData.map((d) => (
                    <MetricBar key={d.dimension} label={d.dimension} value={d.value} />
                  ))}
                </div>

                <div className="glow-line" style={{ margin: "16px 0" }} />

                <div style={{ padding: "12px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#8892b0", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Key Takeaway
                  </div>
                  <div style={{
                    fontSize: 12, color: "#a8b2d1", lineHeight: 1.7, padding: 14,
                    background: "#0a0e17", borderRadius: 8, border: "1px solid #141824",
                  }}>
                    {activeData.compositeScore > 65
                      ? `${activeData.name} shows strong multi-dimensional signals with a composite score of ${activeData.compositeScore.toFixed(0)}/100. The asset demonstrates particular strength in ${activeData.radarData.sort((a, b) => b.value - a.value)[0].dimension.toLowerCase()} (${activeData.radarData.sort((a, b) => b.value - a.value)[0].value.toFixed(0)}). Monitor for continued momentum.`
                      : activeData.compositeScore > 45
                        ? `${activeData.name} presents a mixed signal profile with a composite score of ${activeData.compositeScore.toFixed(0)}/100. Relative strength in ${activeData.radarData.sort((a, b) => b.value - a.value)[0].dimension.toLowerCase()} is offset by weakness in ${activeData.radarData.sort((a, b) => a.value - b.value)[0].dimension.toLowerCase()}. Exercise measured positioning.`
                        : `${activeData.name} shows caution signals across multiple dimensions with a composite score of ${activeData.compositeScore.toFixed(0)}/100. Weakness in ${activeData.radarData.sort((a, b) => a.value - b.value)[0].dimension.toLowerCase()} (${activeData.radarData.sort((a, b) => a.value - b.value)[0].value.toFixed(0)}) warrants careful monitoring and risk management.`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer disclaimer */}
          <div style={{
            marginTop: 24, padding: "12px 16px", background: "#0a0e17",
            borderRadius: 8, border: "1px solid #141824",
            fontSize: 10, color: "#3a4265", lineHeight: 1.6, textAlign: "center",
          }}>
            SPECTRUM Analytics Dashboard — Data shown is simulated for demonstration purposes. In production, connect to
            real-time data providers (Alpha Vantage, Polygon.io, CoinGecko) for live market intelligence. This is not
            financial advice. Always conduct your own research before making investment decisions.
          </div>
        </div>
      )}
    </div>
  );
}
