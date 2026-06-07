import React, { useRef, useState, useEffect } from 'react';

/**
 * PHASE 4b: Inline-SVG smooth-area chart for the velocity widget.
 * Catmull-Rom → cubic bezier path, amber area gradient fill, today
 * line + today dot. Auto-sizes to its container via ResizeObserver.
 *
 * Props:
 *   data — array of { count } samples (oldest first, today last)
 */
export const VelocityChart = ({ data }) => {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 160 });

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        setDims({
          w: containerRef.current.clientWidth || 600,
          h: containerRef.current.clientHeight || 160
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = dims;
  const PAD_L = 26, PAD_R = 16, PAD_T = 12, PAD_B = 20;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const n = data.length;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const x = (i) => PAD_L + (i / Math.max(n - 1, 1)) * plotW;
  const y = (v) => PAD_T + plotH - (v / maxCount) * plotH;

  const pts = data.map((d, i) => ({ x: x(i), y: y(d.count) }));

  // Catmull-Rom -> cubic bezier
  let linePath = '';
  if (pts.length > 0) {
    linePath = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }
  const areaPath = pts.length === 0 ? '' :
    linePath
    + ` L ${pts[pts.length - 1].x} ${PAD_T + plotH}`
    + ` L ${pts[0].x} ${PAD_T + plotH} Z`;

  const xLabels = [
    { i: 0,        text: '30d ago' },
    { i: 15,       text: '15d ago' },
    { i: 22,       text: '7d ago'  },
    { i: 26,       text: '3d ago'  },
    { i: n - 1,    text: 'TODAY', today: true }
  ];
  const ySteps = [
    { v: maxCount, label: maxCount },
    { v: Math.round(maxCount / 2), label: Math.round(maxCount / 2) },
    { v: 0, label: 0 }
  ];

  return (
    <div className="velocity-chart" ref={containerRef}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(255, 174, 32, 0.38)" />
            <stop offset="100%" stopColor="rgba(255, 174, 32, 0.02)" />
          </linearGradient>
        </defs>
        {ySteps.map((s, i) => (
          <g key={i}>
            <line className="velocity-chart__gridline" x1={PAD_L} y1={y(s.v)} x2={W - PAD_R} y2={y(s.v)} />
            <text className="velocity-chart__axis-label" x={PAD_L - 6} y={y(s.v) + 3} textAnchor="end">{s.label}</text>
          </g>
        ))}
        {n > 0 && (
          <>
            <line className="velocity-chart__today-line" x1={x(n - 1)} y1={PAD_T} x2={x(n - 1)} y2={PAD_T + plotH} />
            <path className="velocity-chart__area" d={areaPath} />
            <path className="velocity-chart__line" d={linePath} />
            <circle className="velocity-chart__point" cx={x(n - 1)} cy={y(data[n - 1].count)} r="3" />
          </>
        )}
        {xLabels.map((l, i) => (
          <text
            key={i}
            className={`velocity-chart__axis-label ${l.today ? 'velocity-chart__axis-label--today' : ''}`}
            x={x(l.i)} y={H - 4} textAnchor="middle"
          >{l.text}</text>
        ))}
      </svg>
    </div>
  );
};
