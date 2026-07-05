import { useState, useEffect, useRef, useCallback } from "react";

const EPS_0 = 8.854e-12;
const DIELECTRICS = {
  vacuum:     { kappa: 1.0000, label: "VACUUM",  full: "Vacuum — κ = 1.0",   fill: "#0a0e14" },
  air:        { kappa: 1.0006, label: "AIR",     full: "Air — κ ≈ 1.0006",   fill: "#0c1018" },
  paper:      { kappa: 3.7,    label: "PAPER",   full: "Paper — κ = 3.7",    fill: "#18140e" },
  glass:      { kappa: 4.7,    label: "GLASS",   full: "Glass — κ = 4.7",    fill: "#0c1420" },
  mica:       { kappa: 5.4,    label: "MICA",    full: "Mica — κ = 5.4",     fill: "#14101c" },
  rubber:     { kappa: 7.0,    label: "RUBBER",  full: "Rubber — κ = 7.0",   fill: "#161210" },
  water:      { kappa: 80.0,   label: "H₂O",    full: "Water — κ = 80",     fill: "#081420" },
  titanate:   { kappa: 300.0,  label: "BaTiO₃", full: "BaTiO₃ — κ ≈ 300",  fill: "#1a1208" },
  srtitanate: { kappa: 310.0,  label: "SrTiO₃", full: "SrTiO₃ — κ ≈ 310", fill: "#1c1408" },
};
function computeC(a, d, k) { return k * EPS_0 * (a * 1e-4) / (d * 1e-3); }
function fmtSI(v, u) {
  if (v === 0) return `0 ${u}`;
  const p = [{t:1e-12,s:"p",d:1e-12},{t:1e-9,s:"n",d:1e-9},{t:1e-6,s:"μ",d:1e-6},{t:1e-3,s:"m",d:1e-3},{t:1,s:"",d:1},{t:1e3,s:"k",d:1e3}];
  const a2 = Math.abs(v);
  for (let i = 0; i < p.length-1; i++) { if (a2 < p[i+1].t) return `${(v/p[i].d).toFixed(3)} ${p[i].s}${u}`; }
  return `${(v/p[p.length-1].d).toFixed(3)} ${p[p.length-1].s}${u}`;
}

const T = {
  bg: "#090a0c", hull: "#1e2024", hullMid: "#282c30", hullHi: "#383e44", hullLo: "#111418",
  bevel: "#3e444a", bevelHi: "#4e565e", bevelLo: "#1c2026",
  recess: "#060810",
  cyan: "#00ddee", cyanBr: "#55ffff", cyanDm: "#0088aa", cyanGl: "#00ccdd50",
  amber: "#ffaa22", amberBr: "#ffcc44", amberDm: "#cc8818", amberGl: "#ffaa2250",
  red: "#ff2244", redDm: "#bb1830", redGl: "#ff224440",
  green: "#33ee55", greenBr: "#66ff88", greenDm: "#22aa44", greenGl: "#33ee5540",
  blue: "#4488ff", blueDm: "#2255aa",
  pos: "#ee4444", neg: "#4466dd",
  txt: "#8899aa", txtBr: "#b0c0d0", txtDm: "#506070", txtFn: "#2a3444",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box}
@keyframes hum{0%,100%{opacity:.92}50%{opacity:1}}
@keyframes warmup{0%{opacity:0;filter:brightness(.2)}50%{opacity:.7}100%{opacity:1;filter:brightness(1)}}
@keyframes blink{0%,85%,100%{opacity:1}90%{opacity:.3}}

/* Toggle switch — physical rocker */
.tog{
  display:inline-flex;align-items:center;gap:0;cursor:pointer;
  border:2px solid ${T.bevelLo};border-top:2px solid ${T.bevel};
  background:linear-gradient(180deg,${T.hullMid},${T.hullLo});
  padding:2px;position:relative;
}
.tog .cap{
  display:block;width:22px;height:14px;border-radius:2px;
  border:1px solid #00000040;
  transition:all .12s;
}
.tog .label{
  font-family:'Rajdhani',sans-serif;font-size:8px;font-weight:700;
  letter-spacing:1.5px;color:${T.txtDm};padding:0 5px;
  text-transform:uppercase;
}
`;

// ─── LED (round indicator) ──────────────────────────────────────────────────
const LED = ({ color, size = 5, on = true, style = {} }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: on ? `radial-gradient(circle at 40% 35%, #fff 0%, ${color} 40%, ${color}88 100%)` : "#1a1e22",
    boxShadow: on ? `0 0 ${size}px ${color}aa, 0 0 ${size*2.5}px ${color}40` : "inset 0 1px 2px #000",
    border: `1px solid ${on ? color + "50" : "#2a2e33"}`,
    ...style,
  }} />
);

// ─── LED bar graph (vertical) ───────────────────────────────────────────────
const LEDBar = ({ value = 0, max = 1, count = 8, width = 6, height = 40, color = T.green, warnColor = T.amber, critColor = T.red }) => {
  const frac = Math.min(1, Math.max(0, value / max));
  const lit = Math.round(frac * count);
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", gap: 1, width, height, justifyContent: "flex-start" }}>
      {Array.from({ length: count }, (_, i) => {
        const on = i < lit;
        const c = i >= count * 0.85 ? critColor : i >= count * 0.65 ? warnColor : color;
        return <div key={i} style={{
          flex: 1, borderRadius: 1,
          background: on ? c : `${c}10`,
          boxShadow: on ? `0 0 3px ${c}80` : "none",
          border: `0.5px solid ${on ? c + "40" : "#1a1e2240"}`,
        }} />;
      })}
    </div>
  );
};

// ─── Hex bolt (pure div) ────────────────────────────────────────────────────
const HexBolt = ({ size = 8, style = {} }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: `radial-gradient(circle at 35% 35%, ${T.hullHi}, ${T.hullLo})`,
    border: `1px solid ${T.bevel}`,
    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.4)`,
    ...style,
  }} />
);

// ─── Physical push button — raised when idle, depressed when active ─────────
const PushButton = ({ label, active, onClick, color = T.amber }) => (
  <button onClick={onClick} style={{
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 10,
    letterSpacing: 0.5,
    padding: active ? "5px 7px 3px" : "3px 7px 5px",
    minWidth: 42,
    border: "none",
    borderRadius: 2,
    cursor: "pointer",
    color: active ? color : T.txtDm,
    textShadow: active ? `0 0 6px ${color}80` : "none",
    position: "relative",
    transition: "all 0.08s ease-out",
    background: active
      ? `linear-gradient(180deg, ${T.hullLo} 0%, ${T.hull} 100%)`
      : `linear-gradient(180deg, ${T.hullHi} 0%, ${T.hullMid} 40%, ${T.hull} 100%)`,
    boxShadow: active
      ? `inset 0 2px 4px rgba(0,0,0,0.5), inset 0 0 8px ${color}10, 0 0 8px ${color}25, 0 1px 1px rgba(0,0,0,0.3)`
      : `inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 1px ${T.bevelLo}, 0 4px 6px rgba(0,0,0,0.4), 0 2px 2px rgba(0,0,0,0.3)`,
    transform: active ? "translateY(1px)" : "translateY(0px)",
  }}>
    <div style={{
      position: "absolute",
      top: 2, left: "50%", transform: "translateX(-50%)",
      width: active ? 10 : 6, height: 2, borderRadius: 1,
      background: active ? color : T.bevelLo,
      boxShadow: active ? `0 0 4px ${color}aa, 0 0 8px ${color}40` : "none",
      transition: "all 0.08s",
    }} />
    <span style={{ display: "block", marginTop: 3 }}>{label}</span>
  </button>
);

// ─── Dome button — round mushroom-cap for action buttons ────────────────────
const DomeButton = ({ label, onClick, disabled, color = T.green, size = 44, pressed = false }) => {
  const dead = disabled || pressed; // visual: either can't press or is currently held down
  const lit = !pressed && !disabled;
  return (
    <button onClick={onClick} disabled={disabled && !pressed} style={{
      width: size, height: size, borderRadius: "50%", border: "none",
      cursor: (disabled && !pressed) ? "default" : "pointer",
      opacity: disabled && !pressed ? 0.3 : 1,
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 0,
      transition: "all 0.1s ease-out",
      // Pressed: flatten the dome, kill the lift shadow
      transform: pressed ? "translateY(2px)" : "translateY(0px)",
      background: pressed
        ? `radial-gradient(circle at 50% 50%, ${T.hullLo} 0%, ${T.bevelLo} 60%, ${T.bevelLo} 100%)`
        : `radial-gradient(circle at 50% 45%, ${color}30 0%, ${T.hullLo} 60%, ${T.bevelLo} 100%)`,
      boxShadow: pressed
        ? `inset 0 3px 6px rgba(0,0,0,0.6), inset 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)`
        : `
          inset 0 -2px 4px rgba(0,0,0,0.4),
          inset 0 2px 3px ${color}10,
          0 3px 1px ${T.bevelLo},
          0 5px 10px rgba(0,0,0,0.5),
          0 2px 4px rgba(0,0,0,0.3),
          0 0 12px ${color}15
        `,
    }}>
      {/* Dome cap */}
      <div style={{
        width: size - 10, height: size - 10, borderRadius: "50%",
        background: lit
          ? `radial-gradient(circle at 45% 38%, ${color}cc 0%, ${color} 40%, ${color}88 100%)`
          : `radial-gradient(circle at 50% 50%, ${T.hullMid} 0%, ${T.hull} 60%, ${T.hullLo} 100%)`,
        boxShadow: lit
          ? `inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.3), 0 0 8px ${color}60`
          : `inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(255,255,255,0.02)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.1s ease-out",
      }}>
        {/* Specular highlight — only when lit */}
        {lit && <div style={{
          width: size * 0.3, height: size * 0.15, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          position: "absolute", top: "22%", left: "30%",
          filter: "blur(1px)",
        }} />}
      </div>
      <span style={{
        position: "absolute", bottom: -14,
        fontSize: 8, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
        letterSpacing: 1.5, color: pressed ? color : T.txtDm, textTransform: "uppercase",
        whiteSpace: "nowrap",
        textShadow: pressed ? `0 0 4px ${color}40` : "none",
      }}>{label}</span>
    </button>
  );
};

// ─── Status indicator strip — row of colored square lights ──────────────────
const StatusStrip = ({ items }) => (
  <div style={{
    display: "flex", gap: 2, padding: "3px 4px",
    background: T.hullLo, border: `1px solid ${T.bevelLo}`, borderRadius: 1,
  }}>
    {items.map((item, i) => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: 1,
        background: item.on
          ? `linear-gradient(135deg, ${item.color}cc, ${item.color})`
          : T.bevelLo,
        boxShadow: item.on ? `0 0 4px ${item.color}80, inset 0 1px 1px rgba(255,255,255,0.2)` : `inset 0 1px 2px rgba(0,0,0,0.3)`,
        border: `0.5px solid ${item.on ? item.color + "40" : T.bevelLo}`,
      }} />
    ))}
  </div>
);


// ─── Tiled SVG textures as data URIs (same approach as Cash Bubble Simulator) ──
const TEX = {
  // Fine metal grain — fractalNoise, desaturated
  metal: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`,
  // Flowing brush strokes — stretched turbulence for directional grain
  brush: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.005 0.05' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='200' filter='url(%23b)' opacity='0.12'/%3E%3C/svg%3E")`,
  // Warm rust/patina tint — low-freq noise with warm color matrix
  rust: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.25' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0.12 0.5 0 0 0 0.04 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23r)' opacity='0.1'/%3E%3C/svg%3E")`,
  // Ultra-fine grain — high freq for sandy grit
  grain: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E")`,
};

// ─── Beveled panel frame with tiled texture overlays ────────────────────────
const Panel = ({ children, style = {}, label, labelColor = T.cyan, leds = [], className = "" }) => {
  // Deterministic scratch marks per panel
  const seed = (label || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const scratches = Array.from({ length: 6 }, (_, i) => {
    const s = seed * (i + 1);
    return {
      x1: (s * 7 + i * 40) % 90 + 5,
      y1: (s * 3 + i * 20) % 80 + 5,
      x2: (s * 7 + i * 40) % 90 + 5 + ((s * 11) % 30) - 10,
      y2: (s * 3 + i * 20) % 80 + 5 + ((s * 13) % 20) - 5,
      opacity: 0.02 + (i % 3) * 0.01,
    };
  });

  return (
    <div className={className} style={{
      background: `linear-gradient(178deg, ${T.hullMid} 0%, ${T.hull} 35%, ${T.hullLo} 100%)`,
      border: `1px solid ${T.bevel}`,
      borderTop: `2px solid ${T.hullHi}`,
      borderBottom: `3px solid ${T.bevelLo}`,
      position: "relative", overflow: "hidden",
      boxShadow: `inset 0 1px 0 ${T.hullHi}30, 0 3px 10px rgba(0,0,0,0.4)`,
      padding: 0, ...style,
    }}>
      {/* Texture layer 1: Metal grain — fine noise */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: TEX.metal, backgroundSize: "300px", opacity: 0.6,
      }} />
      {/* Texture layer 2: Flowing brush strokes — stretched, directional */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: TEX.brush, backgroundSize: "400px 200px", opacity: 0.5,
      }} />
      {/* Texture layer 3: Warm rust patina */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: TEX.rust, backgroundSize: "200px", opacity: 0.3, mixBlendMode: "overlay",
      }} />
      {/* Texture layer 4: Ultra-fine grit */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: TEX.grain, backgroundSize: "150px", opacity: 0.45,
      }} />

      {/* Scratch marks — unique per panel */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {scratches.map((s, i) => (
          <line key={i} x1={`${s.x1}%`} y1={`${s.y1}%`} x2={`${s.x2}%`} y2={`${s.y2}%`}
            stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} opacity={s.opacity * 12} />
        ))}
      </svg>

      {/* Vignette — darker edges */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 30%, transparent 40%, rgba(0,0,0,0.12) 100%)`,
      }} />

      {/* Top edge highlight */}
      <div style={{ position: "absolute", top: 0, left: 10, right: 10, height: 1,
        background: `linear-gradient(90deg, transparent, ${T.hullHi}60, transparent)`, pointerEvents: "none" }} />
      {/* Bottom panel seam */}
      <div style={{ position: "absolute", bottom: 0, left: 4, right: 4, height: 1,
        background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.2), transparent)`, pointerEvents: "none" }} />

      {/* Corner bolts */}
      <HexBolt size={7} style={{ position: "absolute", top: 5, left: 5, zIndex: 1 }} />
      <HexBolt size={7} style={{ position: "absolute", top: 5, right: 5, zIndex: 1 }} />

      {/* Panel label bar */}
      {label && (
        <div style={{
          padding: "5px 10px 4px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${T.bevelLo}`,
          background: `linear-gradient(180deg, ${T.hullMid}80 0%, transparent 100%)`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LED color={labelColor} size={5} />
            <span style={{
              fontSize: 10, color: labelColor, fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, letterSpacing: 3, textShadow: `0 0 6px ${labelColor}40`,
            }}>{label}</span>
          </div>
          {leds.length > 0 && (
            <div style={{ display: "flex", gap: 3 }}>
              {leds.map((c, i) => <LED key={i} color={c} size={4} />)}
            </div>
          )}
        </div>
      )}
      {/* Content */}
      <div style={{ padding: label ? "8px 10px 10px" : "10px", position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
};

// ─── Recessed screen housing ────────────────────────────────────────────────
const ScreenHousing = ({ children, glowColor = T.amberDm }) => (
  <div style={{
    background: T.recess,
    border: `3px solid ${T.bevelLo}`,
    borderTop: `4px solid ${T.bevel}`,
    borderRadius: 3,
    padding: 4,
    position: "relative",
    boxShadow: `
      inset 0 3px 10px rgba(0,0,0,0.7),
      inset 0 0 30px ${glowColor}08,
      0 0 20px ${glowColor}06,
      0 2px 6px rgba(0,0,0,0.5)
    `,
  }}>
    {/* Bezel bolts */}
    <HexBolt size={6} style={{ position: "absolute", top: 3, left: 4, zIndex: 2 }} />
    <HexBolt size={6} style={{ position: "absolute", top: 3, right: 4, zIndex: 2 }} />
    <HexBolt size={6} style={{ position: "absolute", bottom: 3, left: 4, zIndex: 2 }} />
    <HexBolt size={6} style={{ position: "absolute", bottom: 3, right: 4, zIndex: 2 }} />
    {/* Glass highlight */}
    <div style={{ position: "absolute", top: 7, left: "8%", width: "28%", height: 10,
      background: "linear-gradient(180deg, rgba(255,220,160,0.04), transparent)",
      borderRadius: "50%", pointerEvents: "none", zIndex: 1 }} />
    {children}
  </div>
);

// ─── Round gauge knob with rotating knurled grip ────────────────────────────
function Knob({ value, min, max, step, onChange, label, unit, color = T.cyan, size = 68 }) {
  const dragging = useRef(false), startY = useRef(0), startVal = useRef(0);
  const frac = (value - min) / (max - min);
  const angle = -135 + frac * 270;
  const r = size / 2 - 4;
  const rad = (angle - 90) * Math.PI / 180;
  const ccx = size / 2, ccy = size / 2;
  const ptrR = r - 11;
  const ix = ccx + ptrR * Math.cos(rad), iy = ccy + ptrR * Math.sin(rad);

  // Knurl band dimensions
  const knurlOuter = r - 1;
  const knurlInner = r - 6;
  const knurlMid = (knurlOuter + knurlInner) / 2;
  const toothCount = 48;
  const toothLen = knurlOuter - knurlInner;
  const toothWidth = 1.2;

  const onDown = e => { dragging.current = true; startY.current = e.clientY; startVal.current = value; e.target.setPointerCapture(e.pointerId); };
  const onMove = e => { if (!dragging.current) return; let v = startVal.current + (startY.current - e.clientY) * ((max-min)/150); v = Math.round(v/step)*step; onChange(Math.max(min, Math.min(max, v))); };
  const onUp = () => { dragging.current = false; };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, userSelect: "none" }}>
      <span style={{ fontSize: 8, color: T.txtDm, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{label}</span>
      <div style={{
        width: size + 10, height: size + 10, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: `radial-gradient(circle at 50% 35%, ${T.hullHi} 0%, ${T.hullMid} 30%, ${T.hullLo} 70%, ${T.bevelLo} 100%)`,
        border: `2px solid ${T.bevel}`,
        borderTop: `2px solid ${T.hullHi}`,
        borderBottom: `3px solid ${T.bevelLo}`,
        boxShadow: `
          inset 0 3px 5px rgba(255,255,255,0.04),
          inset 0 -2px 4px rgba(0,0,0,0.3),
          0 4px 8px rgba(0,0,0,0.5),
          0 2px 3px rgba(0,0,0,0.3),
          0 8px 16px rgba(0,0,0,0.25)
        `,
      }}>
        <svg width={size} height={size} style={{ cursor: "ns-resize", touchAction: "none", overflow: "visible" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>

          {/* Outer bezel */}
          <circle cx={ccx} cy={ccy} r={knurlOuter + 1.5} fill="none" stroke={T.bevelLo} strokeWidth={1} />

          {/* Knurl band base — dark ring */}
          <circle cx={ccx} cy={ccy} r={knurlMid} fill="none" stroke={T.hull} strokeWidth={toothLen + 1} />

          {/* Knurl teeth — radial lines that rotate with the knob */}
          <g transform={`rotate(${angle}, ${ccx}, ${ccy})`}>
            {Array.from({ length: toothCount }, (_, i) => {
              const a = (i * 360 / toothCount) * Math.PI / 180;
              const x1 = ccx + knurlInner * Math.cos(a), y1 = ccy + knurlInner * Math.sin(a);
              const x2 = ccx + knurlOuter * Math.cos(a), y2 = ccy + knurlOuter * Math.sin(a);
              // Alternate light/dark for diamond-cut look
              const bright = i % 2 === 0;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={bright ? T.hullHi : T.bevelLo} strokeWidth={toothWidth} />;
            })}
          </g>

          {/* Knurl ring edges */}
          <circle cx={ccx} cy={ccy} r={knurlOuter} fill="none" stroke={T.bevelLo} strokeWidth={0.5} />
          <circle cx={ccx} cy={ccy} r={knurlInner} fill="none" stroke={T.bevelLo} strokeWidth={0.5} />

          {/* Position notch on the knurl ring — bright dot */}
          {(() => {
            const nx = ccx + knurlMid * Math.cos(rad), ny = ccy + knurlMid * Math.sin(rad);
            return <circle cx={nx} cy={ny} r={2.5} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />;
          })()}

          {/* Lit arc indicators — just outside the knurl */}
          {Array.from({ length: 28 }, (_, i) => {
            const a = (-135 + i * (270/27) - 90) * Math.PI / 180;
            const active = i / 27 <= frac;
            return <circle key={`a${i}`} cx={ccx + (knurlOuter + 4) * Math.cos(a)} cy={ccy + (knurlOuter + 4) * Math.sin(a)}
              r={active ? 1.5 : 0.5} fill={active ? color : T.bevelLo} />;
          })}

          {/* Inner face */}
          <circle cx={ccx} cy={ccy} r={knurlInner - 2} fill={T.hullLo} stroke={T.bevelLo} strokeWidth={0.5} />

          {/* Pointer */}
          <line x1={ccx} y1={ccy} x2={ix} y2={iy} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={ix} cy={iy} r={2.5} fill={color} />

          {/* Center hex cap */}
          {(() => {
            const br = 5;
            const pts = Array.from({ length: 6 }, (_, i) => {
              const a2 = (i * 60 - 30) * Math.PI / 180;
              return `${ccx + br * Math.cos(a2)},${ccy + br * Math.sin(a2)}`;
            }).join(" ");
            return <>
              <polygon points={pts} fill={T.hull} stroke={T.bevel} strokeWidth={0.8} />
              <circle cx={ccx} cy={ccy} r={2} fill={`${color}50`} />
            </>;
          })()}
        </svg>
      </div>
      <div style={{ textAlign: "center", marginTop: -2 }}>
        <span style={{ fontSize: 16, color, fontFamily: "'VT323', monospace", textShadow: `0 0 8px ${color}60, 0 0 18px ${color}20` }}>
          {value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)}
        </span>
        <span style={{ fontSize: 10, color: T.txtDm, fontFamily: "'Rajdhani'", fontWeight: 600, marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

// ─── Readout row ────────────────────────────────────────────────────────────
const Readout = ({ label, value, unit, color = T.amber }) => (
  <div style={{ padding: "4px 0", borderBottom: `1px solid ${T.bevelLo}40`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
    <span style={{ fontSize: 10, color: T.txt, fontFamily: "'Rajdhani'", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <LED color={color} size={3} />
      <span style={{ fontFamily: "'VT323', monospace", fontSize: 17, color, animation: "hum 3s infinite", textShadow: `0 0 8px ${color}60, 0 0 16px ${color}20` }}>
        {value} <span style={{ fontSize: 11, opacity: 0.5 }}>{unit}</span>
      </span>
    </div>
  </div>
);

// ─── CRT Scope ──────────────────────────────────────────────────────────────
function Scope({ traceData, timeWindow, maxVoltage, tau, isCharging, scopeChannel }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); const W = c.width, H = c.height;
    const pad = { top: 30, bottom: 32, left: 54, right: 16 };
    const pW = W-pad.left-pad.right, pH = H-pad.top-pad.bottom;
    // Amber CRT
    const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.55);
    bg.addColorStop(0,"#141008"); bg.addColorStop(0.6,"#0e0a04"); bg.addColorStop(1,"#080602");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const gl=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.35);
    gl.addColorStop(0,"rgba(255,170,40,0.03)"); gl.addColorStop(1,"transparent");
    ctx.fillStyle=gl; ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=2){ctx.fillStyle=y%4===0?"rgba(255,180,60,0.01)":"rgba(0,0,0,0.06)";ctx.fillRect(0,y,W,1);}
    const vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.6);
    vig.addColorStop(0,"transparent"); vig.addColorStop(1,"rgba(0,0,0,0.35)");
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
    // Grid
    ctx.strokeStyle="rgba(255,170,60,0.05)";ctx.lineWidth=0.5;
    for(let i=0;i<=10;i++){const x=pad.left+(i/10)*pW;ctx.beginPath();ctx.moveTo(x,pad.top);ctx.lineTo(x,pad.top+pH);ctx.stroke();}
    for(let i=0;i<=8;i++){const y=pad.top+(i/8)*pH;ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+pW,y);ctx.stroke();}
    ctx.strokeStyle="rgba(255,170,60,0.12)";ctx.lineWidth=0.8;
    ctx.beginPath();ctx.moveTo(pad.left+pW/2,pad.top);ctx.lineTo(pad.left+pW/2,pad.top+pH);ctx.stroke();
    ctx.beginPath();ctx.moveTo(pad.left,pad.top+pH/2);ctx.lineTo(pad.left+pW,pad.top+pH/2);ctx.stroke();
    // Axes
    ctx.fillStyle="#aa8844";ctx.font="11px 'VT323',monospace";ctx.textAlign="center";
    for(let i=0;i<=5;i++){const t=(i/5)*timeWindow,x=pad.left+(i/5)*pW;let l;if(timeWindow<1e-3)l=`${(t*1e6).toFixed(0)}μs`;else if(timeWindow<1)l=`${(t*1e3).toFixed(0)}ms`;else l=`${t.toFixed(1)}s`;ctx.fillText(l,x,pad.top+pH+20);}
    ctx.textAlign="right";for(let i=0;i<=4;i++)ctx.fillText(`${((1-i/4)*maxVoltage).toFixed(0)}V`,pad.left-6,pad.top+(i/4)*pH+4);
    // τ
    if(tau>0&&tau<timeWindow){for(let n=1;n<=5;n++){const tX=pad.left+(n*tau/timeWindow)*pW;if(tX<pad.left+pW){ctx.strokeStyle=`${T.cyan}30`;ctx.setLineDash([3,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(tX,pad.top);ctx.lineTo(tX,pad.top+pH);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=T.cyan;ctx.font="10px 'Rajdhani',sans-serif";ctx.textAlign="center";ctx.fillText(`${n}τ`,tX,pad.top-7);}}}
    // Traces
    const drawT=(data,key,br,mid,dm)=>{if(data.length<2)return;ctx.strokeStyle=dm;ctx.lineWidth=10;ctx.globalAlpha=0.1;ctx.beginPath();for(let i=0;i<data.length;i++){const x=pad.left+(data[i].t/timeWindow)*pW,y=pad.top+(1-data[i][key]/maxVoltage)*pH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.lineWidth=5;ctx.globalAlpha=0.25;ctx.strokeStyle=mid;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle=br;ctx.lineWidth=2;ctx.shadowColor=br;ctx.shadowBlur=10;ctx.beginPath();for(let i=0;i<data.length;i++){const x=pad.left+(data[i].t/timeWindow)*pW,y=pad.top+(1-data[i][key]/maxVoltage)*pH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.shadowBlur=0;const last=data[data.length-1],lx=pad.left+(last.t/timeWindow)*pW,ly=pad.top+(1-last[key]/maxVoltage)*pH;if(lx<=pad.left+pW){ctx.beginPath();ctx.arc(lx,ly,6,0,Math.PI*2);ctx.fillStyle=br;ctx.shadowColor=br;ctx.shadowBlur=25;ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(lx,ly,2.5,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();}};
    const sC=scopeChannel==="cap"||scopeChannel==="both",sR=scopeChannel==="resistor"||scopeChannel==="both";
    if(sC)drawT(traceData,"vCap","#55ff55","#33cc33","#22aa22");
    if(sR)drawT(traceData,"vR",T.amberBr,T.amber,T.amberDm);
    ctx.font="bold 12px 'Rajdhani',sans-serif";ctx.textAlign="left";const cl=isCharging?"CHG":"DIS";
    if(sC){ctx.fillStyle="#55ff55";ctx.shadowColor="#55ff55";ctx.shadowBlur=8;ctx.fillText(`CH1  V_CAP  [${cl}]`,pad.left+6,pad.top+14);ctx.shadowBlur=0;}
    if(sR){ctx.fillStyle=T.amberBr;ctx.shadowColor=T.amberBr;ctx.shadowBlur=8;ctx.fillText(`CH2  V_R  [${cl}]`,pad.left+6,pad.top+(sC?28:14));ctx.shadowBlur=0;}
  },[traceData,timeWindow,maxVoltage,tau,isCharging,scopeChannel]);
  return <canvas ref={ref} width={560} height={300} style={{display:"block",width:"100%",height:"auto",borderRadius:1,animation:"warmup 1.2s ease-out"}}/>;
}

// ─── Apparatus SVG ──────────────────────────────────────────────────────────
function Apparatus({ separation_mm, plateArea_cm2, dielectric, showPolarization, supplyVoltage, resistance }) {
  const diel=DIELECTRICS[dielectric],plateH=80+Math.sqrt(plateArea_cm2/100)*40,gapW=20+(separation_mm/20)*60;
  const cx=180,cy=180,thick=8;
  const pols=[];
  if(showPolarization&&diel.kappa>1.01){const nR=Math.min(6,Math.floor(plateH/18)),nC=Math.min(4,Math.floor(gapW/18)),aL=Math.min(12,gapW/(nC+1)*0.6);for(let r=0;r<nR;r++)for(let c=0;c<nC;c++)pols.push({x:cx-gapW/2+(c+1)*gapW/(nC+1),y:cy-plateH/2+(r+1)*plateH/(nR+1),len:aL});}
  return (
    <svg viewBox="0 0 360 310" style={{width:"100%",height:"auto",display:"block"}}>
      <defs>
        <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cc4433"/><stop offset="100%" stopColor="#882218"/></linearGradient>
        <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3355bb"/><stop offset="100%" stopColor="#183366"/></linearGradient>
        <marker id="aE" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill={T.cyan} opacity={0.5}/></marker>
        <marker id="aP" markerWidth="4" markerHeight="3" refX="3" refY="1.5" orient="auto"><path d="M0,0 L4,1.5 L0,3" fill={T.amberBr}/></marker>
      </defs>
      <rect x={cx-gapW/2} y={cy-plateH/2} width={gapW} height={plateH} fill={diel.fill} stroke={`${T.cyan}15`} strokeWidth={0.5}/>
      <rect x={cx-gapW/2-thick} y={cy-plateH/2} width={thick} height={plateH} fill="url(#gP)"/>
      {Array.from({length:Math.min(5,Math.floor(plateH/20))},(_,i)=>{const yy=cy-plateH/2+(i+1)*plateH/(Math.min(5,Math.floor(plateH/20))+1);return <text key={`p${i}`} x={cx-gapW/2-thick/2} y={yy+3} textAnchor="middle" fontSize="9" fill="#ffaaaa" fontWeight="bold">+</text>;})}
      <rect x={cx+gapW/2} y={cy-plateH/2} width={thick} height={plateH} fill="url(#gN)"/>
      {Array.from({length:Math.min(5,Math.floor(plateH/20))},(_,i)=>{const yy=cy-plateH/2+(i+1)*plateH/(Math.min(5,Math.floor(plateH/20))+1);return <text key={`n${i}`} x={cx+gapW/2+thick/2} y={yy+3} textAnchor="middle" fontSize="9" fill="#aabbff" fontWeight="bold">−</text>;})}
      {!showPolarization&&Array.from({length:Math.min(4,Math.floor(plateH/25))},(_,i)=>{const yy=cy-plateH/2+(i+1)*plateH/(Math.min(4,Math.floor(plateH/25))+1);return <line key={`e${i}`} x1={cx-gapW/2+6} y1={yy} x2={cx+gapW/2-6} y2={yy} stroke={T.cyan} strokeWidth={1} markerEnd="url(#aE)" opacity={0.4}/>;})}
      {showPolarization&&pols.map((a,i)=><g key={`po${i}`}><circle cx={a.x-a.len/2} cy={a.y} r={2.5} fill={T.neg} opacity={0.5}/><circle cx={a.x+a.len/2} cy={a.y} r={2.5} fill={T.pos} opacity={0.5}/><line x1={a.x-a.len/2+2.5} y1={a.y} x2={a.x+a.len/2-2.5} y2={a.y} stroke={T.amberBr} strokeWidth={0.8} markerEnd="url(#aP)" opacity={0.6}/></g>)}
      {(()=>{const lx=cx-gapW/2-thick-30,rx=cx+gapW/2+thick+30,wTop=cy-plateH/2+10,sY=12,sH=34;const rCY=(wTop+sY+sH)/2,zN=7,zH=44,zW=6,zTop=rCY-zH/2,zStep=zH/zN;let zP=`M${lx} ${zTop}`;for(let i=0;i<zN;i++){const yy=zTop+i*zStep;zP+=` L${lx+(i%2===0?1:-1)*zW} ${yy+zStep/2} L${lx} ${yy+zStep}`;}return(<><path d={`M${cx-gapW/2-thick} ${wTop} L${lx} ${wTop} L${lx} ${zTop}`} fill="none" stroke={T.pos} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/><path d={zP} fill="none" stroke={T.amberBr} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/><text x={lx-zW-4} y={rCY-1} textAnchor="end" fontSize="10" fill={T.amber} fontFamily="'Rajdhani',sans-serif" fontWeight="700">R</text><text x={lx-zW-4} y={rCY+10} textAnchor="end" fontSize="10" fill={T.txt} fontFamily="'VT323',monospace">{resistance>=1?`${resistance.toFixed(1)}kΩ`:`${(resistance*1000).toFixed(0)}Ω`}</text><path d={`M${lx} ${zTop+zH} L${lx} ${sY+sH}`} fill="none" stroke={T.pos} strokeWidth={2} strokeLinecap="round" opacity={0.5}/><path d={`M${cx+gapW/2+thick} ${wTop} L${rx} ${wTop} L${rx} ${sY+sH}`} fill="none" stroke={T.neg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/><rect x={lx} y={sY} width={rx-lx} height={sH} rx={1} fill="#0a0e14" stroke={T.bevel} strokeWidth={1.5}/><text x={(lx+rx)/2} y={sY+14} textAnchor="middle" fontSize="8" fill={T.txtDm} fontFamily="'Rajdhani',sans-serif" fontWeight="600" letterSpacing="2">DC SUPPLY</text><text x={(lx+rx)/2} y={sY+28} textAnchor="middle" fontSize="14" fill={T.amberBr} fontFamily="'VT323',monospace">{supplyVoltage.toFixed(1)} V</text><circle cx={lx} cy={sY+sH} r={3} fill={T.pos} opacity={0.7}/><circle cx={rx} cy={sY+sH} r={3} fill={T.neg} opacity={0.7}/></>);})()}
      <text x={cx} y={cy+plateH/2+18} textAnchor="middle" fontSize="11" fill={T.txt} fontFamily="'VT323',monospace">d = {separation_mm.toFixed(1)} mm</text>
      <text x={cx} y={cy+plateH/2+30} textAnchor="middle" fontSize="11" fill={T.txt} fontFamily="'VT323',monospace">A = {plateArea_cm2.toFixed(0)} cm²</text>
      <text x={cx} y={cy+plateH/2+46} textAnchor="middle" fontSize="12" fill={T.amberBr} fontFamily="'Rajdhani',sans-serif" fontWeight="700" letterSpacing="1">{diel.full}</text>
    </svg>
  );
}

// ─── Guided ─────────────────────────────────────────────────────────────────
function GuidedPanel({ step, onNext, onBack, onReset, capacitance, dielectric }) {
  const steps=[
    {title:"01 CALIBRATE",inst:"Set dielectric to AIR. Record baseline capacitance.",chk:dielectric==="air",msg:dielectric==="air"?"▹ AIR LOCKED":"▸ SELECT AIR"},
    {title:"02 BASELINE",inst:`C₀ (air) = ${fmtSI(capacitance,"F")}. CHARGE. Observe τ.`,chk:true,msg:`C₀ = ${fmtSI(capacitance,"F")}`},
    {title:"03 INSERT MATERIAL",inst:"Select dielectric. Observe C jump by factor κ.",chk:dielectric!=="air"&&dielectric!=="vacuum",msg:dielectric!=="air"&&dielectric!=="vacuum"?`▹ ${DIELECTRICS[dielectric].label}  κ=${DIELECTRICS[dielectric].kappa}`:"▸ AWAITING"},
    {title:"04 COMPARE",inst:"CHARGE again. Larger C → larger τ → slower curve.",chk:true,msg:`C = ${fmtSI(capacitance,"F")}`},
    {title:"05 EXPLORE",inst:"All unlocked. Predict, then test.",chk:true,msg:"▹ SYSTEMS NOMINAL"},
  ];
  const s=steps[Math.min(step,steps.length-1)];
  return (
    <Panel label={s.title} labelColor={T.amber} leds={[s.chk?T.green:T.red,T.amber]}>
      <p style={{fontSize:14,color:T.txtBr,margin:"0 0 6px",lineHeight:1.5,fontFamily:"'VT323',monospace"}}>{s.inst}</p>
      <div style={{fontSize:13,color:s.chk?T.green:T.amber,fontFamily:"'VT323',monospace",marginBottom:8,textShadow:`0 0 6px ${s.chk?T.greenGl:T.amberGl}`}}>{s.msg}</div>
      <div style={{display:"flex",gap:5}}>
        <button className="cockpit-btn" onClick={onBack} disabled={step===0} style={{background:`linear-gradient(180deg,${T.hullMid},${T.hullLo})`,border:`2px solid ${T.bevel}`,borderTop:`2px solid ${T.hullHi}`,borderBottom:`2px solid ${T.bevelLo}`,fontFamily:"'Rajdhani'",fontSize:11,fontWeight:700,letterSpacing:1.5,padding:"4px 12px",color:T.txt,cursor:"pointer",textTransform:"uppercase",opacity:step===0?.3:1}}>◂ BACK</button>
        <button onClick={onNext} disabled={step>=4} style={{background:`linear-gradient(180deg,${T.hullMid},${T.hullLo})`,border:`2px solid ${T.amberDm}40`,borderTop:`2px solid ${T.amberDm}60`,borderBottom:`2px solid ${T.bevelLo}`,fontFamily:"'Rajdhani'",fontSize:11,fontWeight:700,letterSpacing:1.5,padding:"4px 12px",color:T.amber,cursor:"pointer",textTransform:"uppercase",textShadow:`0 0 6px ${T.amberGl}`,opacity:step>=4?.3:1}}>NEXT ▸</button>
        <button onClick={onReset} style={{marginLeft:"auto",background:`linear-gradient(180deg,${T.hullMid},${T.hullLo})`,border:`2px solid ${T.redDm}40`,borderBottom:`2px solid ${T.bevelLo}`,fontFamily:"'Rajdhani'",fontSize:11,fontWeight:700,letterSpacing:1.5,padding:"4px 12px",color:T.red,cursor:"pointer",textTransform:"uppercase",textShadow:`0 0 6px ${T.redGl}`}}>RESET</button>
      </div>
    </Panel>
  );
}

// ─── Toggle button ──────────────────────────────────────────────────────────
const Btn = ({ children, color = T.cyan, active, onClick, disabled, style: s = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: active ? `linear-gradient(180deg, ${color}18 0%, ${color}08 100%)` : `linear-gradient(180deg, ${T.hullMid}, ${T.hullLo})`,
    border: `2px solid ${active ? color + "60" : T.bevel}`,
    borderTop: `2px solid ${active ? color + "40" : T.hullHi}`,
    borderBottom: `2px solid ${T.bevelLo}`,
    fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
    padding: "4px 12px", color: active ? color : T.txtDm, cursor: disabled ? "default" : "pointer",
    textTransform: "uppercase", position: "relative", transition: "all .12s",
    textShadow: active ? `0 0 8px ${color}60` : "none",
    boxShadow: active ? `0 0 10px ${color}30, inset 0 0 16px ${color}06` : "none",
    opacity: disabled ? 0.3 : 1, ...s,
  }}>{children}</button>
);

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function CapacitorLab() {
  const [supV,setSV]=useState(12),[res,setR]=useState(10),[area,setA]=useState(400),[sep,setS]=useState(2);
  const [diel,setDiel]=useState("air"),[pol,setPol]=useState(false),[running,setRun]=useState(false);
  const [charging,setChrg]=useState(true),[simT,setSimT]=useState(0),[trace,setTrace]=useState([{t:0,vCap:0,vR:0}]);
  const [vCap,setVCap]=useState(0),[mode,setMode]=useState("explore"),[gStep,setGS]=useState(0),[sCh,setSCh]=useState("both");
  const animRef=useRef(null),lastRef=useRef(null);
  const R=res*1e3,C=computeC(area,sep,DIELECTRICS[diel].kappa),tau=R*C;
  const tw=Math.max(tau*5,1e-6),maxV=Math.ceil(supV/5)*5||5;
  const simulate=useCallback(ts=>{if(!lastRef.current)lastRef.current=ts;const dt=((ts-lastRef.current)/1000)*(tw/4);lastRef.current=ts;setSimT(p=>{const t=p+dt;let v=charging?supV*(1-Math.exp(-t/tau)):supV*Math.exp(-t/tau);const vR2=charging?supV-v:v;setVCap(v);setTrace(tr=>[...tr,{t,vCap:v,vR:vR2}].filter(pt=>pt.t<=tw*1.05));if(t>=tw){setRun(false);return t;}return t;});animRef.current=requestAnimationFrame(simulate);},[tau,supV,tw,charging]);
  useEffect(()=>{if(running){lastRef.current=null;animRef.current=requestAnimationFrame(simulate);}return()=>{if(animRef.current)cancelAnimationFrame(animRef.current);};},[running,simulate]);
  const charge=()=>{setChrg(true);setSimT(0);setTrace([{t:0,vCap:0,vR:supV}]);setVCap(0);setRun(true);};
  const discharge=()=>{setChrg(false);setSimT(0);setTrace([{t:0,vCap:supV,vR:supV}]);setVCap(supV);setRun(true);};
  const stop=()=>{setRun(false);if(animRef.current)cancelAnimationFrame(animRef.current);};
  const Q=C*vCap,U=0.5*C*vCap**2,I=(charging?1:-1)*(supV/R)*Math.exp(-simT/tau),VR=charging?supV-vCap:vCap,PR=I*I*R;

  return (
    <div style={{background:T.bg,minHeight:"100vh",color:T.txt,margin:0,padding:0,fontFamily:"'Rajdhani',sans-serif"}}>
      <style>{CSS}</style>

      {/* ─── HEADER BAR ─── */}
      <div style={{
        background:`linear-gradient(180deg, ${T.hullHi} 0%, ${T.hull} 40%, ${T.hullLo} 100%)`,
        padding:"6px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",
        borderBottom:`3px solid ${T.bevelLo}`,borderTop:`2px solid ${T.bevelHi||T.hullHi}`,
        boxShadow:"0 3px 12px rgba(0,0,0,0.5)",position:"relative",
      }}>
        {/* Row of scattered LEDs across top — like the X-wing red indicator bar */}
        <div style={{position:"absolute",top:4,left:"20%",right:"20%",display:"flex",justifyContent:"center",gap:4}}>
          {[T.red,T.red,T.amber,T.green,T.green,T.red,T.amber,T.blue,T.green,T.red,T.amber,T.green].map((c,i)=><LED key={i} color={c} size={3}/>)}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <LED color={T.green} size={9}/>
          <div>
            <h1 style={{margin:0,fontSize:16,fontWeight:700,color:T.cyan,letterSpacing:4,textShadow:`0 0 10px ${T.cyanGl}`}}>CAPACITOR DIELECTRIC LAB</h1>
            <span style={{fontSize:11,color:T.txtDm,fontFamily:"'VT323',monospace",letterSpacing:2}}>PSE-II ◆ RC CIRCUIT ◆ DIELECTRIC MODULE</span>
          </div>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <LED color={mode==="explore"?T.cyan:T.txtFn} size={5}/>
          <Btn color={T.cyan} active={mode==="explore"} onClick={()=>setMode("explore")}>EXPLORE</Btn>
          <LED color={mode==="guided"?T.amber:T.txtFn} size={5}/>
          <Btn color={T.amber} active={mode==="guided"} onClick={()=>{setMode("guided");setGS(0);}}>GUIDED</Btn>
        </div>
      </div>

      {/* ─── MAIN GRID ─── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,padding:"6px 8px",maxWidth:1160,margin:"0 auto"}}>

        {/* LEFT COL */}
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {mode==="guided"&&<GuidedPanel step={gStep} onNext={()=>setGS(s=>Math.min(s+1,4))} onBack={()=>setGS(s=>Math.max(s-1,0))} onReset={()=>setGS(0)} capacitance={C} dielectric={diel}/>}

          {/* Apparatus */}
          <Panel label="CROSS SECTION" labelColor={T.cyan} leds={[T.cyan,T.blue]}>
            <Apparatus separation_mm={sep} plateArea_cm2={area} dielectric={diel} showPolarization={pol} supplyVoltage={supV} resistance={res}/>
          </Panel>

          {/* Controls */}
          <Panel label="CONTROL INTERFACE" labelColor={T.cyan} leds={[T.green,T.amber,T.red]}>
            <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:6,marginBottom:12}}>
              <Knob label="Supply V" value={supV} min={1} max={50} step={0.5} unit="V" onChange={setSV} color={T.cyan}/>
              <Knob label="Resistance" value={res} min={0.1} max={100} step={0.1} unit="kΩ" onChange={setR} color={T.amber}/>
              <Knob label="Plate Area" value={area} min={25} max={2500} step={25} unit="cm²" onChange={setA} color={T.green}/>
              <Knob label="Separation" value={sep} min={0.5} max={20} step={0.5} unit="mm" onChange={setS} color={T.amberBr}/>
            </div>

            {/* Bar graphs next to knobs */}
            <div style={{display:"flex",justifyContent:"space-around",marginBottom:12}}>
              <LEDBar value={supV} max={50} color={T.cyan}/>
              <LEDBar value={res} max={100} color={T.amber}/>
              <LEDBar value={area} max={2500} color={T.green}/>
              <LEDBar value={sep} max={20} color={T.amberBr}/>
            </div>

            {/* Material select */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <LED color={T.amber} size={5}/>
              <span style={{fontSize:10,color:T.amber,fontWeight:700,letterSpacing:2,textShadow:`0 0 4px ${T.amberGl}`}}>DIELECTRIC</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
              {Object.entries(DIELECTRICS).map(([k,d])=>(
                <PushButton key={k} label={d.label} active={diel===k} onClick={()=>setDiel(k)} color={T.amber} />
              ))}
            </div>

            {/* Action dome buttons + status strip */}
            <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap",paddingTop:4}}>
              <DomeButton label="CHARGE" onClick={charge} disabled={running} color={T.green} size={42}/>
              <DomeButton label="DISCH" onClick={discharge} disabled={running} color={T.amber} size={42}/>
              <DomeButton label="HALT" onClick={stop} disabled={!running} color={T.red} size={38} pressed={!running}/>

              <div style={{display:"flex",flexDirection:"column",gap:4,marginLeft:"auto",alignItems:"flex-end"}}>
                <StatusStrip items={[
                  {color:T.green, on:running&&charging},
                  {color:T.amber, on:running&&!charging},
                  {color:T.red, on:running},
                  {color:T.cyan, on:!running},
                  {color:T.blue, on:true},
                ]}/>
                <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:10,color:T.txtDm,fontWeight:600,letterSpacing:1}}>
                  <input type="checkbox" checked={pol} onChange={e=>setPol(e.target.checked)} style={{accentColor:T.amber}}/>POLAR
                </label>
              </div>
            </div>
          </Panel>
        </div>

        {/* RIGHT COL */}
        <div style={{display:"flex",flexDirection:"column",gap:5}}>

          {/* Scope — in recessed screen housing */}
          <Panel label="OSCILLOSCOPE" labelColor={T.green} leds={[T.green,T.green,T.amber]}>
            <div style={{display:"flex",gap:4,marginBottom:6}}>
              {[{k:"cap",l:"CH1",c:T.green},{k:"resistor",l:"CH2",c:T.amber},{k:"both",l:"DUAL",c:T.cyan}].map(ch=>(
                <Btn key={ch.k} color={ch.c} active={sCh===ch.k} onClick={()=>setSCh(ch.k)} style={{padding:"2px 10px",fontSize:10}}>{ch.l}</Btn>
              ))}
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
                <StatusStrip items={[
                  {color:T.red, on:running},
                  {color:T.red, on:running},
                  {color:T.amber, on:true},
                  {color:T.green, on:true},
                  {color:T.green, on:true},
                  {color:T.green, on:!running},
                  {color:T.blue, on:true},
                ]}/>
                <LED color={running?T.green:T.txtFn} size={4}/><LED color={running?T.red:T.txtFn} size={4}/>
                <span style={{fontSize:10,color:running?T.green:T.txtDm,fontFamily:"'VT323',monospace",animation:running?"blink 2s infinite":"none"}}>{running?"REC":"IDLE"}</span>
              </div>
            </div>
            <ScreenHousing glowColor={T.amberDm}>
              <Scope traceData={trace} timeWindow={tw} maxVoltage={maxV} tau={tau} isCharging={charging} scopeChannel={sCh}/>
            </ScreenHousing>
          </Panel>

          {/* Telemetry */}
          <Panel label="TELEMETRY" labelColor={T.cyan} leds={[T.cyan,T.green,T.amber]}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
              <Readout label="Capacitance" value={fmtSI(C,"F").split(" ")[0]} unit={fmtSI(C,"F").split(" ").slice(1).join(" ")} color={T.amberBr}/>
              <Readout label="Time Const τ" value={fmtSI(tau,"s").split(" ")[0]} unit={fmtSI(tau,"s").split(" ").slice(1).join(" ")} color={T.amber}/>
              <Readout label="V_cap" value={vCap.toFixed(3)} unit="V" color={T.green}/>
              <Readout label="Current" value={fmtSI(Math.abs(I),"A").split(" ")[0]} unit={fmtSI(Math.abs(I),"A").split(" ").slice(1).join(" ")} color={T.cyan}/>
              <Readout label="Charge Q" value={fmtSI(Q,"C").split(" ")[0]} unit={fmtSI(Q,"C").split(" ").slice(1).join(" ")} color={T.green}/>
              <Readout label="Energy U" value={fmtSI(U,"J").split(" ")[0]} unit={fmtSI(U,"J").split(" ").slice(1).join(" ")} color={T.red}/>
            </div>
          </Panel>

          {/* Load Resistor */}
          <Panel label={`LOAD RESISTOR — R = ${res>=1?`${res.toFixed(1)} kΩ`:`${(res*1000).toFixed(0)} Ω`}`} labelColor={T.amber} leds={[T.amber,T.red]}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
              <Readout label="V_R" value={Math.abs(VR).toFixed(3)} unit="V" color={T.amber}/>
              <Readout label="I through R" value={fmtSI(Math.abs(I),"A").split(" ")[0]} unit={fmtSI(Math.abs(I),"A").split(" ").slice(1).join(" ")} color={T.amberBr}/>
              <Readout label="Power P_R" value={fmtSI(PR,"W").split(" ")[0]} unit={fmtSI(PR,"W").split(" ").slice(1).join(" ")} color={T.red}/>
              <Readout label="V_R + V_cap" value={(Math.abs(VR)+vCap).toFixed(3)} unit={`V (≈${supV.toFixed(1)})`} color={T.txtDm}/>
            </div>
            <div style={{fontSize:13,color:T.txt,fontFamily:"'VT323',monospace",marginTop:5,opacity:0.7}}>KVL ▸ V_SUPPLY = V_R + V_CAP</div>
          </Panel>

          {/* Equations */}
          <Panel label="EQUATIONS" labelColor={T.cyan} leds={[T.blue,T.cyan]}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              {[{l:"Capacitance",eq:"C = κε₀A/d",c:T.amberBr},{l:"Time Constant",eq:"τ = RC",c:T.amber},{l:"Charging",eq:"V(t) = V₀(1 − e⁻ᵗ/τ)",c:T.greenBr},{l:"Discharging",eq:"V(t) = V₀e⁻ᵗ/τ",c:T.amber}].map(({l,eq,c})=>(
                <div key={l} style={{
                  background:T.recess,border:`2px solid ${T.bevelLo}`,borderTop:`1px solid ${T.bevel}`,
                  padding:"5px 8px",boxShadow:`inset 0 2px 6px rgba(0,0,0,0.4), inset 0 0 14px ${c}05`
                }}>
                  <div style={{fontSize:9,color:T.txt,fontWeight:600,letterSpacing:1,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:15,color:c,fontFamily:"'VT323',monospace",textShadow:`0 0 8px ${c}40`}}>{eq}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:8,fontSize:13,fontFamily:"'VT323',monospace"}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${T.bevelLo}40`}}><span style={{color:T.txt}}>κ ({DIELECTRICS[diel].label})</span><span style={{color:T.amberBr,textShadow:`0 0 8px ${T.amberGl}`}}>{DIELECTRICS[diel].kappa}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${T.bevelLo}40`}}><span style={{color:T.txt}}>C / C_vacuum</span><span style={{color:T.amberBr,textShadow:`0 0 8px ${T.amberGl}`}}>×{DIELECTRICS[diel].kappa.toFixed(1)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{color:T.txt}}>τ / τ_vacuum</span><span style={{color:T.amber,textShadow:`0 0 8px ${T.amberGl}`}}>×{DIELECTRICS[diel].kappa.toFixed(1)}</span></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
