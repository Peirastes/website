import React from 'react';
import { QID_BY_QUAD } from '../../lib/quadrant';

/**
 * RadarScene — top-down PPI rendering of tasks in polar coords.
 * Concentric range rings (time horizons) + sectored pie (one wedge
 * per domain lane). Ship at centre. Companion to HorizonScene, both
 * rendered inside BridgeView depending on the mode toggle.
 */
export const RadarScene = ({ tasks, lanes, laneOf, dayOffset, maxDays, getQuadrant, onPick }) => {
  const SIZE = 700;
  const CX = SIZE / 2, CY = SIZE / 2;
  const MAX_R = 295;

  /* Polar→cartesian with 12 o'clock as 0 radians (compass convention). */
  const polar = (r, theta) => ({
    x: CX + r * Math.cos(theta - Math.PI / 2),
    y: CY + r * Math.sin(theta - Math.PI / 2)
  });

  const rings = [
    { d: 7,  label: '1w'  },
    { d: 30, label: '1m'  },
    { d: 90, label: '3m'  },
    { d: maxDays, label: `${Math.round(maxDays/30)}m` }
  ];

  const N = lanes.length;
  const sectorAngle = (2 * Math.PI) / N;

  /* Deterministic jitter inside a sector so multiple tasks in the same lane
     don't render on top of each other. djb2-style hash on the task id. */
  const hash = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h;
  };
  const jitter = (id) => ((hash(String(id)) % 1000) / 1000 - 0.5) * 0.7;

  // Compass markers
  const compass = ['N','E','S','W'];

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="bridge-scene bridge-scene--radar"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="radar-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor="rgba(125, 214, 255, 0.08)" />
          <stop offset="60%"  stopColor="rgba(125, 214, 255, 0.02)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={MAX_R + 30} fill="url(#radar-glow)" />

      {/* Sector dividers */}
      {lanes.map((laneName, i) => {
        const aEdge = i * sectorAngle;
        const pEdge = polar(MAX_R, aEdge);
        const pLabel = polar(MAX_R + 24, aEdge + sectorAngle / 2);
        return (
          <g key={laneName}>
            <line x1={CX} y1={CY} x2={pEdge.x} y2={pEdge.y}
                  className="bridge-sector-divider" />
            <text x={pLabel.x} y={pLabel.y + 4}
                  textAnchor="middle"
                  className="bridge-lane-label">
              {laneName.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Range rings */}
      {rings.map(({ d, label }) => {
        const r = (d / maxDays) * MAX_R;
        return (
          <g key={d}>
            <circle cx={CX} cy={CY} r={r} className="bridge-range-ring" />
            <text x={CX + 5} y={CY - r + 3} className="bridge-range-label">{label}</text>
          </g>
        );
      })}

      {/* Outer rim */}
      <circle cx={CX} cy={CY} r={MAX_R} className="bridge-radar-rim" />

      {/* Compass markers (N/E/S/W) */}
      {compass.map((label, i) => {
        const a = (i * Math.PI) / 2;   // 0, π/2, π, 3π/2 from north
        const p = polar(MAX_R + 14, a);
        return (
          <text key={label} x={p.x} y={p.y + 3} textAnchor="middle"
                className="bridge-compass-label">{label}</text>
        );
      })}

      {/* Task pips */}
      {tasks.map(t => {
        const li = laneOf(t);
        const d = Math.max(0, dayOffset(t.dueDate, t.dueTime));
        const r = (d / maxDays) * MAX_R;
        const angle = li * sectorAngle + sectorAngle / 2 + jitter(t.id) * (sectorAngle * 0.35);
        const { x, y } = polar(r, angle);
        const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
        const isDone = (Number(t.percentComplete) || 0) >= 100;
        return (
          <g key={t.id}
             className={`bridge-pip bridge-pip--${qid} ${isDone ? 'bridge-pip--done' : ''}`}
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => { e.stopPropagation(); onPick(t); }}
             style={{ cursor: 'pointer' }}>
            {!isDone && (
              <circle cx={x} cy={y} r={9} className="bridge-pip__ring" />
            )}
            <circle cx={x} cy={y} r={4} className="bridge-pip__core" />
            <title>{t.task} · due {new Date(t.dueDate).toLocaleDateString()}</title>
          </g>
        );
      })}

      {/* Ship at center */}
      <circle cx={CX} cy={CY} r={7} className="bridge-ship-core" />
      <circle cx={CX} cy={CY} r={14} className="bridge-ship-ring" />
      <text x={CX} y={CY + 30} textAnchor="middle" className="bridge-ship-label">TODAY</text>

      {/* Outer HUD frame */}
      <rect x={0.5} y={0.5} width={SIZE-1} height={SIZE-1} className="bridge-frame" />
    </svg>
  );
};
