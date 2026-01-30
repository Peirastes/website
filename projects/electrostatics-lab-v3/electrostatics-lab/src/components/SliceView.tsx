import { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { FieldModel } from '../models/types';
import { FieldLineIntegrator } from '../utils/FieldLineIntegrator';

interface SliceViewProps {
  model: FieldModel;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };
  onClose: () => void;
  logScale: boolean;
}

type SlicePlane = 'XY' | 'XZ' | 'YZ';

export function SliceView({ model, bounds, onClose, logScale }: SliceViewProps) {
  const [plane, setPlane] = useState<SlicePlane>('XY');
  const [slicePosition, setSlicePosition] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const resolution = 150;
  const canvasSize = 600;
  
  // Generate field line data for 2D slice
  const fieldLines2D = useMemo(() => {
    // Create 2D bounds for the slice
    const sliceBounds = getSliceBounds(bounds, plane, slicePosition);
    
    // Create an integrator with restricted bounds
    const integrator = new FieldLineIntegrator(model, {
      bounds,
      stepSize: 0.03,
      maxSteps: 300,
      maxLength: 15,
      terminationRadius: 0.1,
    });
    
    const lines = integrator.generateFromSources(8);
    
    // Project lines onto the slice plane
    return lines.map(line => ({
      points: line.points.map(p => projectToSlice(p, plane)),
      terminated: line.terminated,
    }));
  }, [model, bounds, plane, slicePosition]);
  
  // Draw the slice
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    const { min, max } = bounds;
    const sliceBounds = getSliceBounds(bounds, plane, slicePosition);
    
    // Sample field magnitude for heat map
    const fieldData: number[][] = [];
    let minMag = Infinity;
    let maxMag = 0;
    
    for (let i = 0; i < resolution; i++) {
      fieldData[i] = [];
      for (let j = 0; j < resolution; j++) {
        const pos = get3DPosition(
          sliceBounds.min.x + (i / resolution) * (sliceBounds.max.x - sliceBounds.min.x),
          sliceBounds.min.y + (j / resolution) * (sliceBounds.max.y - sliceBounds.min.y),
          plane,
          slicePosition
        );
        
        const E = model.E(pos);
        let mag = E.length();
        
        if (logScale && mag > 0) {
          mag = Math.log10(mag + 1);
        }
        
        if (isFinite(mag)) {
          fieldData[i][j] = mag;
          minMag = Math.min(minMag, mag);
          maxMag = Math.max(maxMag, mag);
        } else {
          fieldData[i][j] = 0;
        }
      }
    }
    
    // Normalize and clamp
    const magRange = maxMag - minMag || 1;
    const clampedMax = minMag + magRange * 0.8;
    
    // Draw heat map
    const pixelSize = canvasSize / resolution;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const mag = fieldData[i][j];
        const normalized = Math.min((mag - minMag) / (clampedMax - minMag), 1);
        
        // Color map: dark blue -> cyan -> yellow -> red
        const color = getHeatMapColor(normalized);
        ctx.fillStyle = color;
        ctx.fillRect(i * pixelSize, (resolution - 1 - j) * pixelSize, pixelSize + 1, pixelSize + 1);
      }
    }
    
    // Draw field lines
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
    ctx.lineWidth = 1.5;
    
    for (const line of fieldLines2D) {
      if (line.points.length < 2) continue;
      
      ctx.beginPath();
      const firstPoint = toCanvasCoords(line.points[0], sliceBounds, canvasSize);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < line.points.length; i++) {
        const point = toCanvasCoords(line.points[i], sliceBounds, canvasSize);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
    }
    
    // Draw equipotential contours
    drawEquipotentialContours(ctx, model, sliceBounds, plane, slicePosition, canvasSize);
    
    // Draw charge positions
    const sources = model.getSourcePositions();
    for (const source of sources) {
      const projected = projectToSlice(source.position, plane);
      const canvasPos = toCanvasCoords(projected, sliceBounds, canvasSize);
      
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = source.charge > 0 ? '#e74c3c' : '#3498db';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw +/- symbol
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(source.charge > 0 ? '+' : '−', canvasPos.x, canvasPos.y);
    }
    
    // Draw axis labels
    ctx.fillStyle = '#888';
    ctx.font = '14px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    
    const [axis1, axis2] = getAxesForPlane(plane);
    ctx.fillText(axis1, canvasSize / 2, canvasSize - 10);
    ctx.save();
    ctx.translate(15, canvasSize / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(axis2, 0, 0);
    ctx.restore();
    
    // Draw color bar legend
    drawColorBar(ctx, canvasSize, minMag, clampedMax, logScale);
    
  }, [model, bounds, plane, slicePosition, fieldLines2D, logScale]);
  
  return (
    <div className="slice-modal" onClick={onClose}>
      <div className="slice-content" onClick={e => e.stopPropagation()}>
        <h3>
          2D Slice View
          <button className="close-btn" onClick={onClose}>×</button>
        </h3>
        
        <div className="slice-controls">
          {(['XY', 'XZ', 'YZ'] as SlicePlane[]).map(p => (
            <button
              key={p}
              className={plane === p ? 'active' : ''}
              onClick={() => setPlane(p)}
            >
              {p} Plane
            </button>
          ))}
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: '#888', fontSize: '0.9rem' }}>
            Slice Position ({getSliceAxis(plane)}): {slicePosition.toFixed(2)}
          </label>
          <input
            type="range"
            min={bounds.min.z}
            max={bounds.max.z}
            step={0.1}
            value={slicePosition}
            onChange={e => setSlicePosition(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '8px' }}
          />
        </div>
        
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="slice-canvas"
        />
        
        <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#888' }}>
          <strong>Legend:</strong> Heat map shows |E| magnitude. Green curves are field lines.
          Dashed lines are equipotential contours.
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getSliceBounds(
  bounds: { min: THREE.Vector3; max: THREE.Vector3 },
  plane: SlicePlane,
  _position: number
) {
  const { min, max } = bounds;
  
  switch (plane) {
    case 'XY':
      return { min: { x: min.x, y: min.y }, max: { x: max.x, y: max.y } };
    case 'XZ':
      return { min: { x: min.x, y: min.z }, max: { x: max.x, y: max.z } };
    case 'YZ':
      return { min: { x: min.y, y: min.z }, max: { x: max.y, y: max.z } };
  }
}

function projectToSlice(pos: THREE.Vector3, plane: SlicePlane): { x: number; y: number } {
  switch (plane) {
    case 'XY':
      return { x: pos.x, y: pos.y };
    case 'XZ':
      return { x: pos.x, y: pos.z };
    case 'YZ':
      return { x: pos.y, y: pos.z };
  }
}

function get3DPosition(x: number, y: number, plane: SlicePlane, slicePos: number): THREE.Vector3 {
  switch (plane) {
    case 'XY':
      return new THREE.Vector3(x, y, slicePos);
    case 'XZ':
      return new THREE.Vector3(x, slicePos, y);
    case 'YZ':
      return new THREE.Vector3(slicePos, x, y);
  }
}

function getSliceAxis(plane: SlicePlane): string {
  switch (plane) {
    case 'XY': return 'z';
    case 'XZ': return 'y';
    case 'YZ': return 'x';
  }
}

function getAxesForPlane(plane: SlicePlane): [string, string] {
  switch (plane) {
    case 'XY': return ['x', 'y'];
    case 'XZ': return ['x', 'z'];
    case 'YZ': return ['y', 'z'];
  }
}

function toCanvasCoords(
  point: { x: number; y: number },
  bounds: { min: { x: number; y: number }; max: { x: number; y: number } },
  canvasSize: number
): { x: number; y: number } {
  const x = ((point.x - bounds.min.x) / (bounds.max.x - bounds.min.x)) * canvasSize;
  const y = canvasSize - ((point.y - bounds.min.y) / (bounds.max.y - bounds.min.y)) * canvasSize;
  return { x, y };
}

function getHeatMapColor(t: number): string {
  // Dark blue -> cyan -> green -> yellow -> red
  const r = Math.round(Math.min(255, t < 0.5 ? 0 : (t - 0.5) * 2 * 255));
  const g = Math.round(Math.min(255, t < 0.25 ? t * 4 * 180 : t < 0.75 ? 180 : (1 - t) * 4 * 180));
  const b = Math.round(Math.min(255, t < 0.5 ? (0.5 - t) * 2 * 200 + 55 : 0));
  
  return `rgb(${r}, ${g}, ${b})`;
}

function drawEquipotentialContours(
  ctx: CanvasRenderingContext2D,
  model: FieldModel,
  sliceBounds: { min: { x: number; y: number }; max: { x: number; y: number } },
  plane: SlicePlane,
  slicePosition: number,
  canvasSize: number
) {
  const resolution = 60;
  const potentialData: number[][] = [];
  
  // Sample potential
  for (let i = 0; i < resolution; i++) {
    potentialData[i] = [];
    for (let j = 0; j < resolution; j++) {
      const pos = get3DPosition(
        sliceBounds.min.x + (i / resolution) * (sliceBounds.max.x - sliceBounds.min.x),
        sliceBounds.min.y + (j / resolution) * (sliceBounds.max.y - sliceBounds.min.y),
        plane,
        slicePosition
      );
      potentialData[i][j] = model.V(pos);
    }
  }
  
  // Find reasonable contour levels
  const flatData = potentialData.flat().filter(v => isFinite(v) && Math.abs(v) < 50);
  if (flatData.length === 0) return;
  
  flatData.sort((a, b) => a - b);
  const minV = flatData[Math.floor(flatData.length * 0.1)];
  const maxV = flatData[Math.floor(flatData.length * 0.9)];
  
  const numContours = 8;
  const levels: number[] = [];
  
  for (let i = 1; i < numContours; i++) {
    levels.push(minV + (i / numContours) * (maxV - minV));
  }
  
  // Draw contours using marching squares (simplified)
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  
  for (const level of levels) {
    ctx.strokeStyle = level > 0 ? 'rgba(231, 76, 60, 0.5)' : 'rgba(52, 152, 219, 0.5)';
    
    // Simple contour: find cells that cross the level
    for (let i = 0; i < resolution - 1; i++) {
      for (let j = 0; j < resolution - 1; j++) {
        const v00 = potentialData[i][j];
        const v10 = potentialData[i + 1][j];
        const v01 = potentialData[i][j + 1];
        const v11 = potentialData[i + 1][j + 1];
        
        // Check if level crosses this cell
        const min = Math.min(v00, v10, v01, v11);
        const max = Math.max(v00, v10, v01, v11);
        
        if (level >= min && level <= max) {
          const cellX = sliceBounds.min.x + (i / resolution) * (sliceBounds.max.x - sliceBounds.min.x);
          const cellY = sliceBounds.min.y + (j / resolution) * (sliceBounds.max.y - sliceBounds.min.y);
          const cellSize = (sliceBounds.max.x - sliceBounds.min.x) / resolution;
          
          const canvasPos = toCanvasCoords({ x: cellX + cellSize / 2, y: cellY + cellSize / 2 }, sliceBounds, canvasSize);
          
          // Draw a small mark at approximate contour position
          ctx.beginPath();
          ctx.arc(canvasPos.x, canvasPos.y, 1, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
  
  ctx.setLineDash([]);
}

function drawColorBar(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  minVal: number,
  maxVal: number,
  logScale: boolean
) {
  const barWidth = 20;
  const barHeight = 150;
  const x = canvasSize - barWidth - 50;
  const y = 20;
  
  // Draw gradient
  for (let i = 0; i < barHeight; i++) {
    const t = 1 - i / barHeight;
    ctx.fillStyle = getHeatMapColor(t);
    ctx.fillRect(x, y + i, barWidth, 1);
  }
  
  // Border
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, barWidth, barHeight);
  
  // Labels
  ctx.fillStyle = '#888';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  
  const prefix = logScale ? 'log₁₀(|E|+1)' : '|E|';
  ctx.fillText(prefix, x + barWidth + 5, y - 5);
  ctx.fillText(maxVal.toFixed(2), x + barWidth + 5, y + 10);
  ctx.fillText(((maxVal + minVal) / 2).toFixed(2), x + barWidth + 5, y + barHeight / 2);
  ctx.fillText(minVal.toFixed(2), x + barWidth + 5, y + barHeight);
}
