import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { FieldModel } from '../models/types';
import { FieldLineIntegrator } from '../utils/FieldLineIntegrator';

interface FieldLinesProps {
  model: FieldModel;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };
  numDirections: number;
  numShells: number;
  spacingMode: 'linear' | 'logarithmic';
  offset?: number;
  stepSize?: number;
  maxSteps?: number;
}

export function FieldLines({
  model,
  bounds,
  numDirections,
  numShells,
  spacingMode,
  offset = 0.15,
  stepSize = 0.05,
  maxSteps = 500,
}: FieldLinesProps) {
  const fieldLines = useMemo(() => {
    const integrator = new FieldLineIntegrator(model, {
      bounds,
      stepSize,
      maxSteps,
      maxLength: Math.max(
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y,
        bounds.max.z - bounds.min.z
      ) * 1.5,
      terminationRadius: 0.12,
    });

    return integrator.generateFromSources(numDirections, numShells, spacingMode, offset);
  }, [model, bounds, numDirections, numShells, spacingMode, offset, stepSize, maxSteps]);
  
  return (
    <group>
      {fieldLines.map((line, idx) => {
        if (line.points.length < 2) return null;

        // Convert to array of [x, y, z] tuples
        const points = line.points.map(p => [p.x, p.y, p.z] as [number, number, number]);

        // Color based on termination type
        let color = '#2ecc71'; // Default green
        if (line.terminated === 'sink') {
          color = '#3498db'; // Blue for reaching negative charge
        } else if (line.terminated === 'boundary') {
          color = '#27ae60'; // Slightly different green for boundary
        }

        // Generate arrow markers along the field line
        const arrows: JSX.Element[] = [];
        const arrowSpacing = Math.max(1, Math.floor(line.points.length / 4)); // 3-4 arrows per line

        for (let i = arrowSpacing; i < line.points.length; i += arrowSpacing) {
          const p1 = line.points[i - 1];
          const p2 = line.points[i];

          // Direction vector
          const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
          const arrowLength = 0.15;

          arrows.push(
            <primitive
              key={`arrow-${idx}-${i}`}
              object={
                new THREE.ArrowHelper(
                  dir,
                  p1,
                  arrowLength,
                  parseInt(color.replace('#', ''), 16),
                  0.1,
                  0.08
                )
              }
            />
          );
        }

        return (
          <group key={idx}>
            <Line
              points={points}
              color={color}
              lineWidth={1.5}
              transparent
              opacity={0.85}
            />
            {arrows}
          </group>
        );
      })}
    </group>
  );
}
