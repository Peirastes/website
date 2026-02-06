import { useMemo } from 'react';
import * as THREE from 'three';
import { FieldModel } from '../models/types';
import { marchingCubes } from '../utils/MarchingCubes';

interface EquipotentialSurfacesProps {
  model: FieldModel;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };
  numLevels: number;
  resolution?: number;
}

export function EquipotentialSurfaces({
  model,
  bounds,
  numLevels,
  resolution = 30,
}: EquipotentialSurfacesProps) {
  const surfaces = useMemo(() => {
    // Sample potential to find range
    const sampleCount = 10;
    const samples: number[] = [];
    const { min, max } = bounds;
    
    for (let i = 0; i < sampleCount; i++) {
      for (let j = 0; j < sampleCount; j++) {
        for (let k = 0; k < sampleCount; k++) {
          const pos = new THREE.Vector3(
            min.x + (i / sampleCount) * (max.x - min.x),
            min.y + (j / sampleCount) * (max.y - min.y),
            min.z + (k / sampleCount) * (max.z - min.z)
          );
          const V = model.V(pos);
          if (isFinite(V) && Math.abs(V) < 100) {
            samples.push(V);
          }
        }
      }
    }
    
    if (samples.length === 0) return [];
    
    // Sort and find reasonable levels
    samples.sort((a, b) => a - b);
    const minV = samples[Math.floor(samples.length * 0.05)];
    const maxV = samples[Math.floor(samples.length * 0.95)];
    
    // Generate iso-levels
    const levels: number[] = [];
    const hasPositive = maxV > 0.1;
    const hasNegative = minV < -0.1;
    
    if (hasPositive && hasNegative) {
      // Both positive and negative: create symmetric levels
      const absMax = Math.max(Math.abs(minV), Math.abs(maxV));
      for (let i = 1; i <= numLevels; i++) {
        const level = (i / (numLevels + 1)) * absMax;
        levels.push(level);
        levels.push(-level);
      }
    } else if (hasPositive) {
      // Only positive
      for (let i = 1; i <= numLevels; i++) {
        levels.push(minV + (i / (numLevels + 1)) * (maxV - minV));
      }
    } else if (hasNegative) {
      // Only negative
      for (let i = 1; i <= numLevels; i++) {
        levels.push(minV + (i / (numLevels + 1)) * (maxV - minV));
      }
    }
    
    // Create geometries for each level
    const geometries: { geometry: THREE.BufferGeometry; level: number; positive: boolean }[] = [];
    
    for (const level of levels) {
      if (Math.abs(level) < 0.01) continue; // Skip near-zero
      
      try {
        const geometry = marchingCubes(
          (x, y, z) => model.V(new THREE.Vector3(x, y, z)),
          bounds,
          resolution,
          level
        );
        
        if (geometry.attributes.position.count > 0) {
          geometries.push({
            geometry,
            level,
            positive: level > 0,
          });
        }
      } catch (e) {
        console.warn(`Failed to generate isosurface for V=${level}`);
      }
    }
    
    return geometries;
  }, [model, bounds, numLevels, resolution]);
  
  return (
    <group>
      {surfaces.map(({ geometry, level, positive }, idx) => (
        <mesh key={idx} geometry={geometry}>
          <meshStandardMaterial
            color={positive ? '#e74c3c' : '#3498db'}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
