import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

// ═══════════════════════════════════════════════════════════════
// THERMOFLUIDIC FINANCE — Multi-Asset Interactive Simulation
// Companion to "Thermofluidic Finance" by Cole Prather
// ═══════════════════════════════════════════════════════════════

// ── Physics ──
const PHYSICS = { springK: 3.0, damping: 4.0, dt: 0.016, gasConstant: 1.0 };

function targetDepth(entryPrice, currentPrice, inflationFactor = 1.0, maxGainPct = 1.0) {
  const realEntry = entryPrice * inflationFactor;
  const pnlFraction = (currentPrice / realEntry) - 1; // e.g. +0.5 = 50% gain, -0.5 = 50% loss
  
  // Bottom half (depth 50-100): loss zone, always maps -100% to 0%
  // Top half (depth 0-50): profit zone, scales to maxGainPct
  if (pnlFraction >= 0) {
    // Profit: map 0..maxGainPct to depth 50..2
    const scale = Math.max(1, maxGainPct);
    const normalized = Math.min(pnlFraction / scale, 1);
    return Math.max(2, 50 - normalized * 48);
  } else {
    // Loss: map -1..0 to depth 98..50 (fixed scale)
    const normalized = Math.max(pnlFraction, -1);
    return Math.min(98, 50 - normalized * 48);
  }
}

function bubbleRadius(n, T, P) {
  if (P <= 0) return 4;
  // Scale by dollar value (n*P) so $1000 in any asset looks similar
  const dollarValue = n * P;
  return Math.max(6, Math.min(50, Math.pow(dollarValue / 100, 0.4) * 3));
}

function updateBubble(bubble, assetPrice, marketTemp, inflationFactor, dt, maxGainPct = 1.0) {
  if (bubble.popped) return bubble;
  const target = targetDepth(bubble.entryPrice, assetPrice, inflationFactor, maxGainPct);
  const displacement = bubble.depth - target;
  const springForce = -PHYSICS.springK * displacement;
  const dampingForce = -PHYSICS.damping * bubble.velocity;
  let newVel = bubble.velocity + (springForce + dampingForce) * dt;
  let newDepth = bubble.depth + newVel * dt;
  if (Math.abs(displacement) < 0.05 && Math.abs(newVel) < 0.01) { newVel = 0; newDepth = target; }
  return { ...bubble, velocity: newVel, depth: Math.max(0, Math.min(100, newDepth)) };
}

// ── Asset Colors — distinct, accessible palette ──
const ASSET_COLORS = [
  "#00d4ff", "#00ff88", "#ffd700", "#ff6b9d", "#a78bfa",
  "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#f43f5e",
  "#8b5cf6", "#14b8a6", "#eab308", "#e879f9", "#22d3ee",
];


// ── Default Assets — real prices as of Feb 14, 2026 ──
const DEFAULT_ASSETS = [
  { name: "USD",   startPrice: 1.00,     gamma: 0.0,  color: "#4ade80" },  // green
  { name: "Gold",  startPrice: 5041.00,  gamma: 0.3,  color: "#ffd700" },  // gold
  { name: "BTC",   startPrice: 70320.00, gamma: 2.5,  color: "#f7931a" },  // bitcoin orange
  { name: "AMD",   startPrice: 206.82,   gamma: 1.4,  color: "#00d4aa" },  // teal
  { name: "NVDA",  startPrice: 182.81,   gamma: 1.3,  color: "#76b900" },  // nvidia green
  { name: "AVGO",  startPrice: 325.36,   gamma: 1.2,  color: "#cc0000" },  // broadcom red
  { name: "MU",    startPrice: 411.66,   gamma: 1.5,  color: "#0071c5" },  // micron blue
];

function buildInitialAssets() {
  return DEFAULT_ASSETS.map((a, i) => ({
    id: i + 1,
    name: a.name,
    startPrice: a.startPrice,
    currentPrice: a.startPrice,
    gamma: a.gamma,
    color: a.color,
    manualOverride: false,
  }));
}
const C = {
  bg: "#0a0e1a", card: "#0f1424", cardHover: "#141a30",
  accent: "#00d4ff", accentDim: "#007a94",
  sell: "#ff4466", buy: "#00ff88", profit: "#00ff88", loss: "#ff4466",
  neutral: "#8899aa", gold: "#ffd700",
  text: "#c8d6e5", textDim: "#5c6b7a", textBright: "#e8f0f8",
  grid: "#1a2235", fluidSurface: "#1a3a5c", fluidDeep: "#050a14",
};

const fmt = (v) => "$" + Math.abs(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtP = (v) => "$" + (v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";

// ═════════════ CANVAS 2D FLUID COLUMN ═════════════
function FluidColumn({ bubbles, assets, marketTemp, inflationFactor, height = 520, selectedBubble, onSelectBubble, maxGainPct = 1.0 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const rafRef = useRef(null);
  const bubblePositionsRef = useRef([]);

  // Click handler
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const positions = bubblePositionsRef.current;
    // Find closest bubble within radius
    let closest = null;
    let closestDist = Infinity;
    for (const bp of positions) {
      const dx = x - bp.x;
      const dy = y - bp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bp.r + 8 && dist < closestDist) {
        closest = bp.id;
        closestDist = dist;
      }
    }
    onSelectBubble(closest === selectedBubble ? null : closest);
  }, [selectedBubble, onSelectBubble]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.parentElement.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = height + "px";
      ctx.scale(dpr, dpr);

      frameRef.current++;
      const t = frameRef.current * 0.02;
      const positions = [];

      // Clear
      ctx.clearRect(0, 0, w, height);

      // Fluid background gradient
      const colW = w * 0.78;
      const colX = (w - colW) / 2;
      const grad = ctx.createLinearGradient(colX, 0, colX, height);
      const inf = Math.min(inflationFactor, 1.5);
      grad.addColorStop(0, `rgba(26,58,92,${0.7 + inf * 0.15})`);
      grad.addColorStop(0.3, `rgba(13,33,55,${0.8 + inf * 0.1})`);
      grad.addColorStop(0.7, `rgba(8,18,35,${0.85 + inf * 0.1})`);
      grad.addColorStop(1, `rgba(5,10,20,0.95)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(colX, 0, colW, height, 8);
      ctx.fill();

      // Density lines
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += height / 20) {
        const wobble = Math.sin(y * 0.1 + t * 0.5) * 2;
        ctx.beginPath();
        ctx.moveTo(colX + 10, y + wobble);
        ctx.lineTo(colX + colW - 10, y + wobble);
        ctx.stroke();
      }

      // Break-even line
      const beY = height * 0.5;
      ctx.strokeStyle = "rgba(136,153,170,0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(colX + 10, beY);
      ctx.lineTo(colX + colW - 10, beY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ambient particles
      ctx.fillStyle = "rgba(26,58,92,0.35)";
      for (let i = 0; i < 30; i++) {
        const px = colX + 20 + ((Math.sin(t * 0.3 + i * 1.7) + 1) / 2) * (colW - 40);
        const py = ((i * 37 + t * 8 + Math.sin(t + i) * 10) % height);
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw bubbles (all circles)
      bubbles.filter(b => !b.popped).forEach(bubble => {
        const asset = assets.find(a => a.id === bubble.assetId);
        if (!asset) return;
        const price = asset.currentPrice;
        const R = Math.max(6, Math.min(50, bubbleRadius(bubble.n, marketTemp, price)));
        const yPos = (bubble.depth / 100) * height;
        const xPos = w / 2 + Math.sin(t * 0.25 + bubble.id * 2.7) * 35 + (bubble.id % 7 - 3) * 14;
        const isSelected = bubble.id === selectedBubble;

        positions.push({ id: bubble.id, x: xPos, y: yPos, r: R });

        // Selection ring
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(xPos, yPos, R + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Outer glow
        ctx.save();
        ctx.globalAlpha = 0.15 + (isSelected ? 0.1 : 0) + Math.sin(t * 2 + bubble.id) * 0.03;
        ctx.shadowColor = bubble.color;
        ctx.shadowBlur = R * (isSelected ? 1.2 : 0.6);
        ctx.fillStyle = bubble.color;
        ctx.beginPath();
        ctx.arc(xPos, yPos, R * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Work extraction glow — warm gold (gain) or cool blue (loss)
        const rGain = bubble.realizedGain || 0;
        if (Math.abs(rGain) > 0.5) {
          const glowIntensity = Math.min(0.45, Math.abs(rGain) / (bubble.cashInvested + Math.abs(rGain)) * 0.6);
          const glowColor = rGain > 0 ? "255,200,50" : "80,160,255";
          const pulse = 0.85 + Math.sin(t * 1.5 + bubble.id * 1.3) * 0.15;
          ctx.save();
          ctx.globalAlpha = glowIntensity * pulse;
          const wGrad = ctx.createRadialGradient(xPos, yPos, R * 0.8, xPos, yPos, R * 1.8);
          wGrad.addColorStop(0, `rgba(${glowColor},${(glowIntensity * 0.8).toFixed(2)})`);
          wGrad.addColorStop(0.5, `rgba(${glowColor},${(glowIntensity * 0.3).toFixed(2)})`);
          wGrad.addColorStop(1, `rgba(${glowColor},0)`);
          ctx.fillStyle = wGrad;
          ctx.beginPath();
          ctx.arc(xPos, yPos, R * 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Main bubble body — radial gradient using asset color
        const bGrad = ctx.createRadialGradient(
          xPos - R * 0.25, yPos - R * 0.25, R * 0.05,
          xPos, yPos, R
        );
        bGrad.addColorStop(0, "rgba(255,255,255,0.55)");
        bGrad.addColorStop(0.25, bubble.color);
        
        // Darken or lighten based on P&L
        const profitRatio = Math.max(-1, Math.min(1, (price - bubble.entryPrice) / bubble.entryPrice));
        if (profitRatio > 0.05) {
          bGrad.addColorStop(0.7, bubble.color);
          bGrad.addColorStop(1, "rgba(0,80,40,0.0)");
        } else if (profitRatio < -0.05) {
          bGrad.addColorStop(0.7, bubble.color);
          bGrad.addColorStop(1, "rgba(80,0,0,0.0)");
        } else {
          bGrad.addColorStop(0.7, bubble.color);
          bGrad.addColorStop(1, "rgba(0,0,0,0.0)");
        }

        ctx.save();
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(xPos, yPos, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Specular highlight
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(xPos - R * 0.28, yPos - R * 0.28, R * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Asset label inside bubble (if big enough)
        if (R > 14) {
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.font = `bold ${Math.min(R * 0.55, 11)}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(asset.name, xPos, yPos + 1);
          ctx.restore();
        }
      });

      bubblePositionsRef.current = positions;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [bubbles, assets, marketTemp, inflationFactor, height, selectedBubble]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width: "100%", height: "100%", borderRadius: 12, cursor: "pointer" }}
      />
      {/* Depth gauge */}
      <div style={{
        position: "absolute", right: 6, top: 0, bottom: 0, width: 44,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "8px 0", pointerEvents: "none",
      }}>
        {(() => {
          const mg = Math.max(1, maxGainPct);
          const fmtG = (v) => `+${Math.round(v * 100)}%`;
          return [
            { label: fmtG(mg), c: C.profit + "88", major: true },
            { label: fmtG(mg * 0.75), c: C.profit + "44", major: false },
            { label: fmtG(mg * 0.5), c: C.profit + "55", major: true },
            { label: fmtG(mg * 0.25), c: C.profit + "44", major: false },
            { label: "0%", c: C.textDim, major: true },
            { label: "-25%", c: C.loss + "44", major: false },
            { label: "-50%", c: C.loss + "55", major: true },
            { label: "-75%", c: C.loss + "44", major: false },
            { label: "-100%", c: C.loss + "88", major: true },
          ].map(({ label, c, major }, i) => (
            <div key={i} style={{
              fontSize: major ? 9 : 7,
              color: c,
              textAlign: "right",
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: label === "0%" ? 600 : 400,
            }}>{label}</div>
          ));
        })()}
      </div>
      <div style={{ position: "absolute", left: 10, top: 6, fontSize: 9, color: C.profit, fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", pointerEvents: "none", opacity: .7 }}>
        ▲ profit zone
      </div>
      <div style={{ position: "absolute", left: 10, top: "48.5%", fontSize: 9, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".08em", pointerEvents: "none", opacity: .5 }}>
        ── break-even ──
      </div>
      <div style={{ position: "absolute", left: 10, bottom: 6, fontSize: 9, color: C.loss, fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", pointerEvents: "none", opacity: .5 }}>
        ▼ loss zone
      </div>
    </div>
  );
}

// ═════════════ SIGNAL PANEL ═════════════
function SignalPanel({ history }) {
  const recent = history.slice(-60);
  const data = recent.map((h, i) => {
    const prev = recent[i - 1], pp = recent[i - 2];
    const vel = prev ? h.totalValue - prev.totalValue : 0;
    const pVel = pp && prev ? prev.totalValue - pp.totalValue : 0;
    return { t: i, velocity: vel, acceleration: vel - pVel };
  });
  const lv = data.length > 1 ? data[data.length - 1].velocity : 0;
  const la = data.length > 2 ? data[data.length - 1].acceleration : 0;
  const q = lv >= 0 ? (la >= 0 ? ["I — Accel Growth", C.buy] : ["II — Decel Growth", C.gold]) : (la >= 0 ? ["IV — Recovery", C.accent] : ["III — ⚠ Crisis", C.loss]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ padding: "3px 8px", borderRadius: 4, background: q[1] + "11", border: `1px solid ${q[1]}33`, fontSize: 10, color: q[1], fontFamily: "'JetBrains Mono',monospace" }}>{q[0]}</span>
        <span style={{ padding: "3px 8px", borderRadius: 4, background: "#ffffff06", fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>v={lv >= 0 ? "+" : ""}{lv.toFixed(0)}</span>
        <span style={{ padding: "3px 8px", borderRadius: 4, background: "#ffffff06", fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>a={la >= 0 ? "+" : ""}{la.toFixed(0)}</span>
      </div>
      <div style={{ width: "100%", height: 90 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 2, right: 5, bottom: 2, left: 5 }}>
            <XAxis dataKey="t" tick={false} />
            <YAxis tick={{ fontSize: 8, fill: C.textDim }} width={30} />
            <ReferenceLine y={0} stroke={C.textDim} strokeDasharray="3 3" />
            <Area type="monotone" dataKey="velocity" stroke={C.accent} fill={C.accent + "22"} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═════════════ ASSET MANAGER ═════════════
function AssetManager({ assets, onAdd, onRemove, onUpdate }) {
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("100");
  const [newGamma, setNewGamma] = useState("1.0");
  const [expanded, setExpanded] = useState(null);

  const handleAdd = () => {
    const name = newName.trim() || ("Asset " + (assets.length + 1));
    const price = parseFloat(newPrice) || 100;
    const gamma = parseFloat(newGamma) || 1.0;
    onAdd(name, price, gamma);
    setNewName("");
    setNewPrice("100");
    setNewGamma("1.0");
  };

  const inputStyle = {
    background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 4,
    padding: "4px 8px", fontSize: 11, color: C.textBright, outline: "none",
    fontFamily: "'JetBrains Mono',monospace", width: "100%", boxSizing: "border-box",
  };

  return (
    <div>
      {/* Asset list */}
      {assets.map((a) => (
        <div key={a.id} style={{
          marginBottom: 4, borderRadius: 6, background: expanded === a.id ? "#ffffff08" : "#ffffff04",
          border: `1px solid ${a.color}22`, overflow: "hidden", transition: "background .15s",
        }}>
          {/* Header row */}
          <div
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            style={{
              padding: "6px 10px", cursor: "pointer", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: a.color, fontSize: 14 }}>
                ●
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textBright }}>{a.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
              <span style={{ color: C.text }}>{fmtP(a.currentPrice)}</span>
              <span style={{ color: a.currentPrice >= a.startPrice ? C.profit : C.loss }}>
                {fmtPct((a.currentPrice - a.startPrice) / a.startPrice)}
              </span>
            </div>
          </div>
          {/* Expanded controls */}
          {expanded === a.id && (
            <div style={{ padding: "4px 10px 10px", borderTop: "1px solid #ffffff08" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>Start Price</div>
                  <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{fmtP(a.startPrice)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>γ (volatility)</div>
                  <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{a.gamma.toFixed(2)}</div>
                </div>
              </div>
              {/* Manual price override */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>Manual Price</div>
                <input
                  type="range" min={a.startPrice * 0.01} max={a.startPrice * 4} step={a.startPrice * 0.01}
                  value={a.currentPrice}
                  onChange={(e) => onUpdate(a.id, { currentPrice: parseFloat(e.target.value), manualOverride: true })}
                  style={{ width: "100%", accentColor: a.color }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onUpdate(a.id, { manualOverride: false })} style={{
                  flex: 1, padding: "4px 0", fontSize: 9, borderRadius: 4, cursor: "pointer",
                  background: !a.manualOverride ? `${C.accent}22` : "#ffffff06",
                  border: `1px solid ${!a.manualOverride ? C.accent + "55" : "#ffffff0a"}`,
                  color: !a.manualOverride ? C.accent : C.textDim, fontFamily: "'JetBrains Mono',monospace",
                }}>Auto</button>
                <button onClick={() => onUpdate(a.id, { manualOverride: true })} style={{
                  flex: 1, padding: "4px 0", fontSize: 9, borderRadius: 4, cursor: "pointer",
                  background: a.manualOverride ? `${C.gold}22` : "#ffffff06",
                  border: `1px solid ${a.manualOverride ? C.gold + "55" : "#ffffff0a"}`,
                  color: a.manualOverride ? C.gold : C.textDim, fontFamily: "'JetBrains Mono',monospace",
                }}>Manual</button>
                <button onClick={() => onRemove(a.id)} style={{
                  padding: "4px 8px", fontSize: 9, borderRadius: 4, cursor: "pointer",
                  background: `${C.sell}11`, border: `1px solid ${C.sell}33`, color: C.sell,
                  fontFamily: "'JetBrains Mono',monospace",
                }}>Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new asset */}
      <div style={{
        marginTop: 8, padding: 10, borderRadius: 6,
        background: "#ffffff04", border: "1px dashed #ffffff15",
      }}>
        <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Add Asset</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input placeholder="Name (e.g. BTC)" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inputStyle, flex: 2 }}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} />
          <input placeholder="Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ ...inputStyle, flex: 1 }}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} />
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: C.textDim, marginBottom: 1 }}>γ (volatility response)</div>
            <input type="range" min="0.1" max="3" step="0.1" value={newGamma} onChange={e => setNewGamma(e.target.value)}
              style={{ width: "100%", accentColor: C.gold }} />
          </div>
          <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", minWidth: 28, textAlign: "right" }}>{parseFloat(newGamma).toFixed(1)}</span>
          <button onClick={handleAdd} style={{
            padding: "6px 14px", fontSize: 10, borderRadius: 4, cursor: "pointer",
            background: `${C.buy}22`, border: `1px solid ${C.buy}66`, color: C.buy,
            fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap",
          }}>+ Add</button>
        </div>
        <div style={{ fontSize: 8, color: C.textDim, marginTop: 4, lineHeight: 1.4 }}>
          γ=0.3 bonds | γ=0.5 gold | γ=1.0 stocks | γ=2.0+ crypto
        </div>
      </div>
    </div>
  );
}

// ═════════════ BUBBLE INSPECTOR ═════════════
function BubbleInspector({ bubble, asset }) {
  if (!bubble || !asset) return null;
  const value = bubble.n * asset.currentPrice;
  const pnl = value - bubble.cashInvested;
  const pnlPct = pnl / bubble.cashInvested;
  const logDepth = Math.log(bubble.entryPrice / asset.currentPrice);

  // Four phases: position (profit/loss) × motion (rising/sinking)
  // velocity > 0 means depth is increasing → sinking
  // velocity < 0 means depth is decreasing → rising
  const inProfit = pnl >= 0;
  const isSinking = bubble.velocity > 0.01;
  const isRising = bubble.velocity < -0.01;

  let phase, phaseColor, phaseIcon;
  if (inProfit && !isSinking) {
    phase = "Buoyant Profit";
    phaseColor = C.profit;
    phaseIcon = "⬆";
  } else if (inProfit && isSinking) {
    phase = "Sinking Profit";
    phaseColor = C.gold;
    phaseIcon = "⬇";
  } else if (!inProfit && isRising) {
    phase = "Buoyant Loss";
    phaseColor = C.accent;
    phaseIcon = "⬆";
  } else if (!inProfit && !isRising) {
    phase = "Sinking Loss";
    phaseColor = C.loss;
    phaseIcon = "⬇";
  }

  // At rest?
  if (Math.abs(bubble.velocity) <= 0.01) {
    phaseIcon = inProfit ? "◉" : "◎";
    if (Math.abs(pnlPct) < 0.005) {
      phase = "Neutral (Break-even)";
      phaseColor = C.neutral;
      phaseIcon = "⊜";
    }
  }

  return (
    <div style={{
      padding: 10, borderRadius: 6, background: "#ffffff06",
      border: `1px solid ${pnl >= 0 ? C.profit + "33" : C.loss + "33"}`,
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: asset.color }}>
          ● {asset.name} #{bubble.id}
        </span>
        <span style={{ color: pnl >= 0 ? C.profit : C.loss, fontWeight: 600 }}>
          {pnl >= 0 ? "+" : "-"}{fmt(pnl)} ({fmtPct(pnlPct)})
        </span>
      </div>
      {/* Phase badge */}
      <div style={{
        padding: "4px 8px", borderRadius: 4, marginBottom: 6,
        background: `${phaseColor}15`, border: `1px solid ${phaseColor}33`,
        color: phaseColor, fontSize: 11, fontWeight: 600,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{phaseIcon} {phase}</span>
        <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>
          v={bubble.velocity >= 0 ? "+" : ""}{bubble.velocity.toFixed(2)}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", color: C.text }}>
        <span>Entry: {fmtP(bubble.entryPrice)}</span>
        <span>Now: {fmtP(asset.currentPrice)}</span>
        <span>Units: {bubble.n.toFixed(4)}</span>
        <span>Value: {fmt(value)}</span>
        <span>d(t): {logDepth.toFixed(3)}</span>
        <span>Column: {bubble.depth.toFixed(1)}%</span>
      </div>
      {/* Thermodynamic work section */}
      {(bubble.realizedGain || bubble.sharesSold) ? (
        <div style={{
          marginTop: 6, paddingTop: 6, borderTop: "1px solid #ffffff0a",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", color: C.text,
        }}>
          <span style={{ fontSize: 9, color: C.textDim }}>δW extracted:</span>
          <span style={{ color: (bubble.realizedGain || 0) >= 0 ? C.profit : C.loss, fontWeight: 600 }}>
            {(bubble.realizedGain || 0) >= 0 ? "+" : ""}{fmt(bubble.realizedGain || 0)}
          </span>
          <span style={{ fontSize: 9, color: C.textDim }}>Shares sold:</span>
          <span>{(bubble.sharesSold || 0).toFixed(4)}</span>
        </div>
      ) : null}
    </div>
  );
}

// ═════════════ THERMODYNAMIC GAUGES ═════════════
function ThermodynamicGauges({ unrealizedGain, realizedGain }) {
  // Gauge helper: renders a horizontal bar with label
  const Gauge = ({ label, icon, value, maxAbs, positiveColor, negativeColor, description }) => {
    const absMax = Math.max(maxAbs, Math.abs(value), 100);
    const fraction = value / absMax; // -1 to 1
    const barWidth = Math.abs(fraction) * 50; // 0 to 50%
    const isPos = value >= 0;
    const color = isPos ? positiveColor : negativeColor;

    return (
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".08em" }}>
            {icon} {label}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700, color,
            fontFamily: "'JetBrains Mono',monospace",
          }}>
            {value >= 0 ? "+" : "-"}{fmt(value)}
          </span>
        </div>
        {/* Bar track */}
        <div style={{
          height: 10, borderRadius: 5, background: "#ffffff08",
          position: "relative", overflow: "hidden",
        }}>
          {/* Center line */}
          <div style={{
            position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
            background: "#ffffff20", zIndex: 2,
          }} />
          {/* Fill bar — grows from center */}
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: isPos ? "50%" : `${50 - barWidth}%`,
            width: `${barWidth}%`,
            background: `linear-gradient(${isPos ? "to right" : "to left"}, ${color}66, ${color}22)`,
            borderRadius: 5,
            transition: "all 0.3s ease",
            boxShadow: `0 0 8px ${color}33`,
          }} />
        </div>
        <div style={{ fontSize: 7, color: C.textDim, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
          {description}
        </div>
      </div>
    );
  };

  const maxScale = Math.max(Math.abs(unrealizedGain), Math.abs(realizedGain), 500);

  return (
    <div style={{
      display: "flex", gap: 16, padding: "8px 12px", borderRadius: 8,
      background: "#ffffff04", border: "1px solid #ffffff0a",
      marginBottom: 4,
    }}>
      <Gauge
        label="STORED ENERGY (δQ)" icon="🔥"
        value={unrealizedGain}
        maxAbs={maxScale}
        positiveColor="#fbbf24"
        negativeColor="#60a5fa"
        description="Unrealized gains — heat stored in bubbles"
      />
      <Gauge
        label="WORK EXTRACTED (δW)" icon="⚡"
        value={realizedGain}
        maxAbs={maxScale}
        positiveColor="#34d399"
        negativeColor="#f87171"
        description="Realized gains — work done on environment"
      />
    </div>
  );
}

// ═════════════ MAIN APP ═════════════
export default function CashBubbleSimulator() {
  const [assets, setAssets] = useState(() => buildInitialAssets());
  const [bubbles, setBubbles] = useState([]);
  const [history, setHistory] = useState([]);
  const [cash, setCash] = useState(10000);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [buyAssetId, setBuyAssetId] = useState(null);
  const [buyAmount, setBuyAmount] = useState(1000);
  const [sellPct, setSellPct] = useState(25);
  const [marketTemp, setMarketTemp] = useState(1.0);
  const [inflationFactor, setInflationFactor] = useState(1.0);
  const [globalMode, setGlobalMode] = useState("manual");
  const [isRunning, setIsRunning] = useState(true);
  const [showHelp, setShowHelp] = useState(true);
  const [totalWork, setTotalWork] = useState(0);
  const [tab, setTab] = useState("trade");
  const fileInputRef = useRef(null);

  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  // Save portfolio as JSON download
  const handleSave = useCallback(() => {
    const data = {
      version: 1,
      savedAt: new Date().toISOString(),
      assets: assets.map(a => ({ id: a.id, name: a.name, startPrice: a.startPrice, currentPrice: a.currentPrice, gamma: a.gamma, color: a.color, manualOverride: a.manualOverride })),
      bubbles: bubbles.filter(b => !b.popped).map(b => ({ id: b.id, n: b.n, entryPrice: b.entryPrice, cashInvested: b.cashInvested, assetId: b.assetId, depth: b.depth, velocity: b.velocity, color: b.color, realizedGain: b.realizedGain || 0, sharesSold: b.sharesSold || 0 })),
      cash,
      totalWork,
      settings: { marketTemp, inflationFactor, globalMode },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash-bubble-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [assets, bubbles, cash, totalWork, marketTemp, inflationFactor, globalMode]);

  // Load portfolio from JSON file
  const handleLoad = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.assets) setAssets(data.assets.map(a => ({ ...a, manualOverride: a.manualOverride || false })));
        if (data.bubbles) setBubbles(data.bubbles.map(b => ({ ...b, popped: false, birthTime: Date.now(), realizedGain: b.realizedGain || 0, sharesSold: b.sharesSold || 0 })));
        if (data.cash !== undefined) setCash(data.cash);
        if (data.totalWork !== undefined) setTotalWork(data.totalWork);
        if (data.settings) {
          if (data.settings.marketTemp !== undefined) setMarketTemp(data.settings.marketTemp);
          if (data.settings.inflationFactor !== undefined) setInflationFactor(data.settings.inflationFactor);
          if (data.settings.globalMode) setGlobalMode(data.settings.globalMode);
        }
        setHistory([]);
        setSelectedBubble(null);
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setAssets(buildInitialAssets());
    setBubbles([]);
    setCash(10000);
    setTotalWork(0);
    setHistory([]);
    setSelectedBubble(null);
    setMarketTemp(1.0);
    setInflationFactor(1.0);
    setGlobalMode("manual");
  }, []);

  // Auto-select first asset for buying
  useEffect(() => {
    if (assets.length > 0 && (!buyAssetId || !assets.find(a => a.id === buyAssetId))) {
      setBuyAssetId(assets[0].id);
    }
  }, [assets, buyAssetId]);

  // Add asset
  const addAsset = useCallback((name, startPrice, gamma) => {
    setAssets(prev => {
      const id = prev.length > 0 ? Math.max(...prev.map(a => a.id)) + 1 : 1;
      const colorIdx = (id - 1) % ASSET_COLORS.length;
      return [...prev, {
        id, name, startPrice, currentPrice: startPrice, gamma,
        color: ASSET_COLORS[colorIdx],
        manualOverride: false,
      }];
    });
  }, []);

  const removeAsset = useCallback((assetId) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    setBubbles(prev => prev.map(b => b.assetId === assetId ? { ...b, popped: true } : b));
  }, []);

  const updateAsset = useCallback((assetId, updates) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...updates } : a));
  }, []);

  // Buy
  const handleBuy = useCallback(() => {
    const asset = assetsRef.current.find(a => a.id === buyAssetId);
    if (!asset || cash < buyAmount || buyAmount <= 0) return;
    const n = buyAmount / asset.currentPrice;
    const eqDepth = targetDepth(asset.currentPrice, asset.currentPrice, inflationFactor);
    setBubbles(prev => {
      const id = prev.filter(b => !b.popped).length > 0 ? Math.max(...prev.map(b => b.id)) + 1 : 1;
      return [...prev, {
        id, n, entryPrice: asset.currentPrice,
        cashInvested: buyAmount, assetId: asset.id,
        birthTime: Date.now(), depth: eqDepth, velocity: 0,
        color: asset.color, popped: false,
        realizedGain: 0, sharesSold: 0,
      }];
    });
    setCash(prev => prev - buyAmount);
  }, [buyAssetId, buyAmount, cash, inflationFactor]);

  // Sell
  const handleSell = useCallback(() => {
    const activeBubbles = bubbles.filter(b => !b.popped);
    const target = selectedBubble !== null
      ? activeBubbles.find(b => b.id === selectedBubble)
      : activeBubbles.slice(-1)[0];
    if (!target) return;
    const asset = assetsRef.current.find(a => a.id === target.assetId);
    if (!asset) return;
    const fraction = sellPct / 100;
    const sharesToSell = target.n * fraction;
    const proceeds = sharesToSell * asset.currentPrice;
    const costBasisSold = target.cashInvested * fraction;
    const gain = proceeds - costBasisSold; // net realized gain (can be negative)
    setCash(prev => prev + proceeds);
    setTotalWork(prev => prev + proceeds);
    if (fraction >= 0.99) {
      setBubbles(prev => prev.map(b => b.id === target.id ? {
        ...b, popped: true,
        realizedGain: (b.realizedGain || 0) + gain,
        sharesSold: (b.sharesSold || 0) + sharesToSell,
      } : b));
      setSelectedBubble(null);
    } else {
      setBubbles(prev => prev.map(b =>
        b.id === target.id ? {
          ...b, n: b.n - sharesToSell,
          cashInvested: b.cashInvested * (1 - fraction),
          realizedGain: (b.realizedGain || 0) + gain,
          sharesSold: (b.sharesSold || 0) + sharesToSell,
        } : b
      ));
    }
  }, [bubbles, selectedBubble, sellPct]);

  // Simulation tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      // Evolve asset prices
      if (globalMode !== "manual") {
        setAssets(prev => prev.map(a => {
          if (a.manualOverride) return a;
          let drift = 0, vol = 0.015;
          if (globalMode === "random_walk") { drift = 0.0001; vol = 0.012; }
          if (globalMode === "bull") { drift = 0.003; vol = 0.008; }
          if (globalMode === "bear") { drift = -0.003; vol = 0.010; }
          if (globalMode === "crash") { drift = -0.015; vol = 0.03; }
          // γ modulates both drift AND volatility
          const effectiveDrift = drift * a.gamma;
          const effectiveVol = vol * a.gamma;
          const noise = (Math.random() - 0.5) * 2 * effectiveVol;
          const newPrice = Math.max(a.startPrice * 0.01, a.currentPrice * (1 + effectiveDrift + noise));
          return { ...a, currentPrice: newPrice };
        }));
      }

      // Update bubbles
      setBubbles(prev => {
        const currentAssets = assetsRef.current;
        // Compute max gain across all active bubbles for dynamic scale
        let maxGain = 1.0; // minimum 100% scale
        prev.filter(b => !b.popped).forEach(b => {
          const a = currentAssets.find(x => x.id === b.assetId);
          if (a) {
            const realEntry = b.entryPrice * inflationFactor;
            const gain = (a.currentPrice / realEntry) - 1;
            if (gain > maxGain) maxGain = gain;
          }
        });
        return prev.map(b => {
          if (b.popped) return b;
          const asset = currentAssets.find(a => a.id === b.assetId);
          if (!asset) return b;
          return updateBubble(b, asset.currentPrice, marketTemp, inflationFactor, PHYSICS.dt * 5, maxGain);
        });
      });

      // Record history
      const currentAssets = assetsRef.current;
      setBubbles(prev => {
        const totalValue = prev.filter(b => !b.popped).reduce((sum, b) => {
          const a = currentAssets.find(x => x.id === b.assetId);
          return sum + (a ? b.n * a.currentPrice : 0);
        }, 0);
        setHistory(h => {
          const entry = { totalValue, tick: h.length };
          const upd = [...h, entry];
          return upd.length > 300 ? upd.slice(-300) : upd;
        });
        return prev;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isRunning, globalMode, marketTemp, inflationFactor]);

  // Derived
  const active = bubbles.filter(b => !b.popped);
  const totalValue = active.reduce((s, b) => {
    const a = assets.find(x => x.id === b.assetId);
    return s + (a ? b.n * a.currentPrice : 0);
  }, 0);
  const totalInvested = active.reduce((s, b) => s + b.cashInvested, 0);
  const totalPnL = totalValue - totalInvested;

  // Dynamic profit scale: max gain across all active bubbles
  const maxGainPct = Math.max(1.0, ...active.map(b => {
    const a = assets.find(x => x.id === b.assetId);
    if (!a) return 0;
    return (a.currentPrice / (b.entryPrice * inflationFactor)) - 1;
  }));
  const netWorth = cash + totalValue;
  const selBubble = selectedBubble !== null ? active.find(b => b.id === selectedBubble) : null;
  const selAsset = selBubble ? assets.find(a => a.id === selBubble.assetId) : null;

  // Thermodynamic aggregates
  const totalUnrealizedGain = active.reduce((s, b) => {
    const a = assets.find(x => x.id === b.assetId);
    if (!a) return s;
    return s + (b.n * a.currentPrice - b.cashInvested);
  }, 0);
  const totalRealizedGain = active.reduce((s, b) => s + (b.realizedGain || 0), 0)
    + bubbles.filter(b => b.popped).reduce((s, b) => s + (b.realizedGain || 0), 0);

  const btnStyle = (isActive, color, extra = {}) => ({
    padding: "4px 0", fontSize: 10, borderRadius: 4, cursor: "pointer",
    background: isActive ? `${color}22` : "#ffffff06",
    border: `1px solid ${isActive ? color + "55" : "#ffffff0a"}`,
    color: isActive ? color : C.textDim,
    fontFamily: "'JetBrains Mono',monospace",
    ...extra,
  });

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.grid}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.textBright, letterSpacing: "-.02em" }}>
            <span style={{ color: C.accent }}>◉</span> Thermofluidic Finance
          </h1>
          <span style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>Multi-Asset Simulation</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
          {[
            ["Net Worth", fmt(netWorth), C.textBright, 600, 15],
            ["Cash", fmt(cash), C.accent],
            ["Invested", fmt(totalValue), C.gold],
            ["P&L", (totalPnL >= 0 ? "+" : "-") + fmt(totalPnL), totalPnL >= 0 ? C.profit : C.loss],
            ["Work Σ", fmt(totalWork), C.profit],
            ["Bubbles", active.length, C.textDim],
            ["Assets", assets.length, C.textDim],
          ].map(([label, val, color, fw, fs], i) => (
            <div key={i}>
              <span style={{ color: C.textDim }}>{label} </span>
              <span style={{ color, fontWeight: fw || 400, fontSize: fs || 11 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      {showHelp && (
        <div style={{
          margin: "10px 20px 0", padding: "10px 14px", borderRadius: 8,
          background: `${C.accent}08`, border: `1px solid ${C.accent}22`,
          fontSize: 11, lineHeight: 1.6, color: C.text, position: "relative",
        }}>
          <button onClick={() => setShowHelp(false)} style={{ position: "absolute", top: 6, right: 10, background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 13 }}>✕</button>
          <strong style={{ color: C.accent }}>Multi-Asset Mode:</strong> Seven assets are pre-loaded with today's real prices — USD (γ=0, incompressible baseline), Gold (γ=0.3), BTC (γ=2.5), and four semiconductor stocks.
          Each bubble tracks <em>its own asset's price</em>. γ controls how strongly each asset reacts to global market modes — low γ = stable, high γ = volatile.
          Column: top = +100% profit, middle = break-even, bottom = -100% loss. Add your own assets in the Assets tab.
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 260px", gap: 12, padding: "12px 20px 20px", minHeight: 500 }}>

        {/* ══ LEFT PANEL ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Hidden file input (always mounted) */}
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoad}
            style={{ display: "none" }} />

          {/* Tab selector */}
          <div style={{ display: "flex", gap: 2, background: "#ffffff06", borderRadius: 6, padding: 2 }}>
            {[["assets", "Assets"], ["trade", "Trade"], ["settings", "Settings"], ["portfolio", "File"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: "5px 0", fontSize: 10, borderRadius: 4, cursor: "pointer",
                background: tab === key ? "#ffffff0a" : "transparent",
                border: "none", color: tab === key ? C.textBright : C.textDim,
                fontFamily: "'JetBrains Mono',monospace", fontWeight: tab === key ? 600 : 400,
              }}>{label}</button>
            ))}
          </div>

          {/* Assets Tab */}
          {tab === "assets" && (
            <div style={{ background: C.card, borderRadius: 10, padding: 12, border: "1px solid #ffffff08", overflowY: "auto", maxHeight: 500 }}>
              <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Asset Registry</div>
              <AssetManager assets={assets} onAdd={addAsset} onRemove={removeAsset} onUpdate={updateAsset} />
            </div>
          )}

          {/* Trade Tab */}
          {tab === "trade" && (
            <div style={{ background: C.card, borderRadius: 10, padding: 12, border: "1px solid #ffffff08" }}>
              <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Trade</div>

              {assets.length === 0 ? (
                <div style={{ fontSize: 11, color: C.textDim, fontStyle: "italic", padding: "10px 0" }}>
                  Add an asset first in the Assets tab.
                </div>
              ) : (
                <>
                  {/* Asset selector */}
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 4 }}>Buy Into</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                    {assets.map(a => (
                      <button key={a.id} onClick={() => setBuyAssetId(a.id)} style={{
                        padding: "3px 8px", fontSize: 10, borderRadius: 4, cursor: "pointer",
                        background: buyAssetId === a.id ? `${a.color}22` : "#ffffff06",
                        border: `1px solid ${buyAssetId === a.id ? a.color + "66" : "#ffffff0a"}`,
                        color: buyAssetId === a.id ? a.color : C.textDim,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}>{a.name}</button>
                    ))}
                  </div>

                  {/* Amount */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {[500, 1000, 2500, 5000].map(amt => (
                      <button key={amt} onClick={() => setBuyAmount(amt)} style={{
                        ...btnStyle(buyAmount === amt, C.buy), flex: 1,
                      }}>${amt >= 1000 ? (amt / 1000) + "k" : amt}</button>
                    ))}
                  </div>
                  <button onClick={handleBuy} disabled={cash < buyAmount || !buyAssetId} style={{
                    width: "100%", padding: "7px 0", fontSize: 11, fontWeight: 600, borderRadius: 5,
                    cursor: cash >= buyAmount && buyAssetId ? "pointer" : "not-allowed",
                    background: cash >= buyAmount ? `${C.buy}22` : "#ffffff06",
                    border: `1px solid ${cash >= buyAmount ? C.buy + "88" : "#ffffff0a"}`,
                    color: cash >= buyAmount ? C.buy : C.textDim,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".04em", marginBottom: 10,
                  }}>BUY → INJECT BUBBLE ({fmt(buyAmount)})</button>

                  {/* Sell */}
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 4 }}>
                    Sell {selBubble ? `#${selBubble.id} (${selAsset?.name})` : "(select a bubble →)"}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {[25, 50, 75, 100].map(pct => (
                      <button key={pct} onClick={() => setSellPct(pct)} style={{
                        ...btnStyle(sellPct === pct, C.sell), flex: 1,
                      }}>{pct}%</button>
                    ))}
                  </div>
                  <button onClick={handleSell} disabled={active.length === 0} style={{
                    width: "100%", padding: "7px 0", fontSize: 11, fontWeight: 600, borderRadius: 5,
                    cursor: active.length > 0 ? "pointer" : "not-allowed",
                    background: active.length > 0 ? `${C.sell}22` : "#ffffff06",
                    border: `1px solid ${active.length > 0 ? C.sell + "88" : "#ffffff0a"}`,
                    color: active.length > 0 ? C.sell : C.textDim,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".04em",
                  }}>SELL → EXTRACT WORK ({sellPct}%)</button>
                </>
              )}

              {/* Cash tank */}
              <div style={{
                marginTop: 10, background: "#ffffff04", borderRadius: 6, padding: "6px 10px",
                border: "1px solid #ffffff08", position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: `${Math.min(100, (cash / 20000) * 100)}%`,
                  background: `linear-gradient(to top, ${C.accent}15, ${C.accent}05)`,
                  transition: "height .5s",
                }} />
                <div style={{ position: "relative" }}>
                  <div style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em" }}>Liquid Cash (Incompressible)</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.textBright, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(cash)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && (
            <div style={{ background: C.card, borderRadius: 10, padding: 12, border: "1px solid #ffffff08" }}>
              <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Global Market</div>

              <div style={{ fontSize: 9, color: C.textDim, marginBottom: 4 }}>Market Mode</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginBottom: 4 }}>
                {[
                  ["manual", "Manual", C.accent],
                  ["random_walk", "Random", C.accent],
                  ["bull", "🟢 Bull", C.buy],
                  ["bear", "🔴 Bear", C.sell],
                ].map(([k, l, c]) => (
                  <button key={k} onClick={() => setGlobalMode(k)} style={btnStyle(globalMode === k, c, { padding: "5px 0" })}>{l}</button>
                ))}
              </div>
              <button onClick={() => setGlobalMode("crash")} style={{
                ...btnStyle(globalMode === "crash", C.sell, { width: "100%", padding: "5px 0", marginBottom: 10 }),
              }}>💥 Crash</button>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: C.textDim }}>Sentiment (T)</span>
                  <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{marketTemp.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="3" step="0.05" value={marketTemp}
                  onChange={e => setMarketTemp(Number(e.target.value))} style={{ width: "100%", accentColor: C.gold }} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: C.textDim }}>Inflation</span>
                  <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{((inflationFactor - 1) * 100).toFixed(1)}%</span>
                </div>
                <input type="range" min="0.8" max="1.5" step="0.01" value={inflationFactor}
                  onChange={e => setInflationFactor(Number(e.target.value))} style={{ width: "100%", accentColor: C.sell }} />
              </div>

              <button onClick={() => setIsRunning(!isRunning)} style={{
                width: "100%", padding: "6px 0", fontSize: 10, borderRadius: 5, cursor: "pointer",
                background: "#ffffff06", border: "1px solid #ffffff0a", color: C.textDim,
                fontFamily: "'JetBrains Mono',monospace",
              }}>{isRunning ? "⏸ Pause" : "▶ Play"}</button>

              {/* γ reference */}
              <div style={{
                marginTop: 10, padding: 8, borderRadius: 6, background: "#ffffff04",
                fontSize: 9, color: C.textDim, lineHeight: 1.5, fontFamily: "'JetBrains Mono',monospace",
              }}>
                <div style={{ color: C.text, marginBottom: 4, fontWeight: 600 }}>γ Reference</div>
                <div>Global mode applies drift & vol</div>
                <div>Each asset's γ <strong>multiplies</strong> both:</div>
                <div style={{ marginTop: 2 }}>
                  γ=0.3 → 30% of market move<br />
                  γ=1.0 → 100% (tracks market)<br />
                  γ=2.5 → 250% amplified
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {tab === "portfolio" && (
            <div style={{ background: C.card, borderRadius: 10, padding: 12, border: "1px solid #ffffff08" }}>
              <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Portfolio File</div>

              <button onClick={handleSave} style={{
                width: "100%", padding: "8px 0", fontSize: 11, fontWeight: 600, borderRadius: 5,
                cursor: "pointer", background: "#00d4ff22", border: "1px solid #00d4ff66",
                color: "#00d4ff", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6,
              }}>Save Portfolio</button>

              <button onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }} style={{
                width: "100%", padding: "8px 0", fontSize: 11, fontWeight: 600, borderRadius: 5,
                cursor: "pointer", background: "#ffd70022", border: "1px solid #ffd70066",
                color: "#ffd700", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6,
              }}>Load Portfolio</button>

              <button onClick={handleReset} style={{
                width: "100%", padding: "8px 0", fontSize: 11, fontWeight: 600, borderRadius: 5,
                cursor: "pointer", background: "#ff446611", border: "1px solid #ff446644",
                color: "#ff4466", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12,
              }}>Reset to Defaults</button>

              <div style={{
                padding: 10, borderRadius: 6, background: "#ffffff04",
                border: "1px solid #ffffff08", fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                color: "#5c6b7a", lineHeight: 1.8,
              }}>
                <div style={{ color: "#c8d6e5", fontWeight: 600, marginBottom: 6 }}>Current State</div>
                <div>Assets: {assets.length}</div>
                <div>Bubbles: {active.length}</div>
                <div>Cash: {fmt(cash)}</div>
                <div>Invested: {fmt(totalValue)}</div>
                <div>Work extracted: {fmt(totalWork)}</div>
              </div>

              <div style={{
                marginTop: 8, fontSize: 8, color: "#5c6b7a", lineHeight: 1.5,
                fontFamily: "'JetBrains Mono',monospace",
              }}>
                Save exports assets, bubbles, cash and settings as JSON. Load restores full state. Reset returns to 7 defaults with $10k.
              </div>
            </div>
          )}
        </div>

        {/* ══ CENTER — FLUID COLUMN ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ThermodynamicGauges unrealizedGain={totalUnrealizedGain} realizedGain={totalRealizedGain} />
          <div style={{ background: C.card, borderRadius: 12, padding: 2, border: "1px solid #ffffff08", overflow: "hidden", flex: 1 }}>
            <FluidColumn bubbles={active} assets={assets} marketTemp={marketTemp} inflationFactor={inflationFactor} height={480} selectedBubble={selectedBubble} onSelectBubble={setSelectedBubble} maxGainPct={maxGainPct} />
          </div>
        </div>

        {/* ══ RIGHT PANEL — DIAGNOSTICS ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Bubble list */}
          <div style={{ background: C.card, borderRadius: 10, padding: 12, border: "1px solid #ffffff08" }}>
            <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
              Portfolio ({active.length} bubbles)
            </div>
            <div style={{ maxHeight: 180, overflow: "auto" }}>
              {active.length === 0 ? (
                <div style={{ fontSize: 11, color: C.textDim, fontStyle: "italic" }}>No bubbles yet.</div>
              ) : (
                active.map(b => {
                  const a = assets.find(x => x.id === b.assetId);
                  if (!a) return null;
                  const pnl = b.n * a.currentPrice - b.cashInvested;
                  const isSel = selectedBubble === b.id;
                  return (
                    <div key={b.id} onClick={() => setSelectedBubble(isSel ? null : b.id)} style={{
                      padding: "4px 8px", marginBottom: 2, borderRadius: 4, cursor: "pointer",
                      background: isSel ? "#ffffff0a" : "transparent",
                      border: `1px solid ${isSel ? a.color + "44" : "transparent"}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: 10, fontFamily: "'JetBrains Mono',monospace", transition: "background .1s",
                    }}>
                      <span>
                        <span style={{ color: a.color, marginRight: 5 }}>
                          ●
                        </span>
                        <span style={{ color: C.textDim }}>#{b.id}</span>
                        <span style={{ color: C.text, marginLeft: 4 }}>{a.name}</span>
                      </span>
                      <span style={{ color: pnl >= 0 ? C.profit : C.loss }}>
                        {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Inspector */}
          {selBubble && <BubbleInspector bubble={selBubble} asset={selAsset} />}

          {/* Per-asset breakdown */}
          {assets.length > 0 && (
            <div style={{ background: C.card, borderRadius: 10, padding: 12, border: "1px solid #ffffff08" }}>
              <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Asset Breakdown</div>
              {assets.map(a => {
                const assetBubbles = active.filter(b => b.assetId === a.id);
                const aVal = assetBubbles.reduce((s, b) => s + b.n * a.currentPrice, 0);
                const aCost = assetBubbles.reduce((s, b) => s + b.cashInvested, 0);
                const aPnl = aVal - aCost;
                return (
                  <div key={a.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "3px 0", fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                    borderBottom: "1px solid #ffffff06",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: a.color }}>
                        ●
                      </span>
                      <span style={{ color: C.text }}>{a.name}</span>
                      <span style={{ color: C.textDim }}>×{assetBubbles.length}</span>
                    </span>
                    <span>
                      <span style={{ color: C.text, marginRight: 8 }}>{fmt(aVal)}</span>
                      <span style={{ color: aPnl >= 0 ? C.profit : C.loss }}>{fmtPct(aCost > 0 ? aPnl / aCost : 0)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Signal Dynamics */}
          <div style={{ background: C.card, borderRadius: 10, padding: 12, border: "1px solid #ffffff08" }}>
            <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Signal Dynamics</div>
            <SignalPanel history={history} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 20px", borderTop: `1px solid ${C.grid}`,
        display: "flex", justifyContent: "space-between", flexWrap: "wrap",
        fontSize: 9, color: C.textDim, fontFamily: "'JetBrains Mono',monospace",
      }}>
        <span>Thermofluidic Finance — Cole Prather, 2026</span>
        <span>PV = nRT | ΔU = δQ − δW | γ modulates response | d(t) = ln(P_entry / P(t))</span>
      </div>
    </div>
  );
}
