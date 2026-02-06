import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { FieldModel } from '../models/types';

interface VectorFieldGlyphsProps {
  model: FieldModel;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };
  density: number;
  scale: number;
  logScale: boolean;
  clampMin: number;
  clampMax: number;
}

export function VectorFieldGlyphs({
  model,
  bounds,
  density,
  scale,
  logScale,
  clampMin,
  clampMax,
}: VectorFieldGlyphsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate sample positions and field vectors
  const { positions, directions, magnitudes, count } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const directions: THREE.Vector3[] = [];
    const magnitudes: number[] = [];
    
    const { min, max } = bounds;
    const size = new THREE.Vector3().subVectors(max, min);
    const step = new THREE.Vector3(
      size.x / density,
      size.y / density,
      size.z / density
    );
    
    // Get source positions to exclude
    const sources = model.getSourcePositions();
    const exclusionRadius = 0.25;
    
    for (let i = 0; i <= density; i++) {
      for (let j = 0; j <= density; j++) {
        for (let k = 0; k <= density; k++) {
          const pos = new THREE.Vector3(
            min.x + i * step.x,
            min.y + j * step.y,
            min.z + k * step.z
          );
          
          // Skip positions near sources
          let nearSource = false;
          for (const source of sources) {
            if (pos.distanceTo(source.position) < exclusionRadius) {
              nearSource = true;
              break;
            }
          }
          if (nearSource) continue;
          
          const E = model.E(pos);
          const mag = E.length();
          
          if (mag < clampMin || mag > clampMax * 10) continue;
          
          positions.push(pos);
          directions.push(E.clone().normalize());
          magnitudes.push(mag);
        }
      }
    }
    
    return { positions, directions, magnitudes, count: positions.length };
  }, [model, bounds, density, clampMin, clampMax]);
  
  // Create arrow geometry
  const arrowGeometry = useMemo(() => {
    const geometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    geometry.translate(0, 0.1, 0);
    geometry.rotateX(Math.PI / 2);
    
    // Add shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    shaftGeometry.translate(0, -0.15, 0);
    shaftGeometry.rotateX(Math.PI / 2);
    
    // Merge geometries
    const mergedGeometry = new THREE.BufferGeometry();
    const positionArrays: number[][] = [];
    const normalArrays: number[][] = [];
    
    // Cone
    positionArrays.push(Array.from(geometry.attributes.position.array));
    normalArrays.push(Array.from(geometry.attributes.normal.array));
    
    // Shaft
    positionArrays.push(Array.from(shaftGeometry.attributes.position.array));
    normalArrays.push(Array.from(shaftGeometry.attributes.normal.array));
    
    const positions = new Float32Array(positionArrays.flat());
    const normals = new Float32Array(normalArrays.flat());
    
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    return mergedGeometry;
  }, []);
  
  // Update instance matrices
  useMemo(() => {
    if (!meshRef.current || count === 0) return;
    
    const mesh = meshRef.current;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    
    // Compute magnitude range for coloring
    const minMag = Math.min(...magnitudes);
    const maxMag = Math.max(...magnitudes);
    const magRange = maxMag - minMag || 1;
    
    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      const dir = directions[i];
      let mag = magnitudes[i];
      
      // Apply log scale if requested
      if (logScale) {
        mag = Math.log10(mag + 1);
      }
      
      // Clamp and normalize magnitude
      const clampedMag = Math.min(Math.max(mag, clampMin), clampMax);
      const normalizedMag = (clampedMag - clampMin) / (clampMax - clampMin);
      
      // Create rotation to align with field direction
      quaternion.setFromUnitVectors(up, dir);
      
      // Scale based on magnitude
      const arrowScale = scale * (0.3 + 0.7 * normalizedMag);
      
      matrix.compose(
        pos,
        quaternion,
        new THREE.Vector3(arrowScale, arrowScale, arrowScale)
      );
      
      mesh.setMatrixAt(i, matrix);
      
      // Set color based on magnitude (blue -> green -> yellow -> red)
      const t = normalizedMag;
      const color = new THREE.Color();
      if (t < 0.5) {
        color.setHSL(0.55 - t * 0.4, 0.8, 0.5);
      } else {
        color.setHSL(0.15 - (t - 0.5) * 0.3, 0.9, 0.5);
      }
      mesh.setColorAt(i, color);
    }
    
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions, directions, magnitudes, count, scale, logScale, clampMin, clampMax]);
  
  if (count === 0) return null;
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[arrowGeometry, undefined, count]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        vertexColors
        metalness={0.3}
        roughness={0.7}
      />
    </instancedMesh>
  );
}
