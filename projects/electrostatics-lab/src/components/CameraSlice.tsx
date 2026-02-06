/**
 * CameraSlice.tsx
 * 
 * Renders a 2D planar slice through the field that is always orthonormal
 * to the camera's view direction. This creates a "live" heat map cross-section
 * that updates as the user rotates the camera.
 * 
 * The slice shows:
 * - Field magnitude as a heat map (blue → green → yellow → red)
 * - Equipotential contours as lines
 * - Optional field direction indicators
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FieldModel } from '../models/types';

interface CameraSliceProps {
  model: FieldModel;
  enabled: boolean;
  sliceOffset: number;      // Distance from camera target (0 = at target)
  resolution: number;       // Grid resolution (e.g., 100 = 100x100)
  size: number;             // Size of the slice plane
  opacity: number;          // Overall opacity
  showContours: boolean;    // Show equipotential contour lines
  contourCount: number;     // Number of contour levels
  logScale: boolean;        // Use logarithmic color scaling
}

// Heat map color function: value 0-1 → RGB
function heatMapColor(t: number): [number, number, number] {
  // Blue → Cyan → Green → Yellow → Red
  t = Math.max(0, Math.min(1, t));
  
  if (t < 0.25) {
    // Blue to Cyan
    const s = t / 0.25;
    return [0, s, 1];
  } else if (t < 0.5) {
    // Cyan to Green
    const s = (t - 0.25) / 0.25;
    return [0, 1, 1 - s];
  } else if (t < 0.75) {
    // Green to Yellow
    const s = (t - 0.5) / 0.25;
    return [s, 1, 0];
  } else {
    // Yellow to Red
    const s = (t - 0.75) / 0.25;
    return [1, 1 - s, 0];
  }
}

// Alternative: Viridis-like color map (more perceptually uniform)
function viridisColor(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  // Simplified viridis approximation
  const r = Math.max(0, Math.min(1, 0.267 + 0.329 * t + 2.766 * t * t - 2.362 * t * t * t));
  const g = Math.max(0, Math.min(1, 0.004 + 1.016 * t - 0.165 * t * t));
  const b = Math.max(0, Math.min(1, 0.329 + 1.442 * t - 1.771 * t * t));
  return [r, g, b];
}

export function CameraSlice({
  model,
  enabled,
  sliceOffset = 0,
  resolution = 80,
  size = 8,
  opacity = 0.85,
  showContours = true,
  contourCount = 10,
  logScale = true,
}: CameraSliceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.DataTexture | null>(null);
  const contourLinesRef = useRef<THREE.LineSegments | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const { camera } = useThree();
  
  // Create the texture data array
  const textureData = useMemo(() => {
    return new Uint8Array(resolution * resolution * 4);
  }, [resolution]);
  
  // Create the data texture
  const texture = useMemo(() => {
    const tex = new THREE.DataTexture(
      textureData,
      resolution,
      resolution,
      THREE.RGBAFormat
    );
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    textureRef.current = tex;
    return tex;
  }, [textureData, resolution]);
  
  // Create plane geometry
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(size, size, 1, 1);
  }, [size]);
  
  // Create material
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [texture, opacity]);
  
  // Contour line geometry (will be updated each frame)
  const contourGeometry = useMemo(() => {
    return new THREE.BufferGeometry();
  }, []);
  
  const contourMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      linewidth: 1,
    });
  }, []);
  
  // Store field values for contour computation
  const fieldValues = useRef<Float32Array>(new Float32Array(resolution * resolution));
  const potentialValues = useRef<Float32Array>(new Float32Array(resolution * resolution));
  
  // Update the slice every frame
  useFrame(() => {
    if (!enabled || !meshRef.current || !groupRef.current) return;
    
    // Get camera orientation
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    
    // Get camera target (where the camera is looking)
    // For OrbitControls, this is typically the origin or the controls target
    const target = new THREE.Vector3(0, 0, 0); // Default to origin
    
    // Position the slice plane
    const sliceCenter = target.clone().add(cameraDir.clone().multiplyScalar(-sliceOffset));
    
    // Orient the group to face the camera
    groupRef.current.position.copy(sliceCenter);
    groupRef.current.quaternion.copy(camera.quaternion);
    
    // Compute the slice plane's local coordinate system
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    
    // Right vector: camera's local X axis
    right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    // Up vector: camera's local Y axis  
    up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    
    // Sample the field on the slice plane
    const halfSize = size / 2;
    const step = size / resolution;
    
    let minMag = Infinity;
    let maxMag = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    
    // First pass: compute field values and find range
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        // Map pixel to local coordinates on the slice plane
        const u = -halfSize + (i + 0.5) * step;
        const v = -halfSize + (j + 0.5) * step;
        
        // World position on the slice
        const worldPos = sliceCenter.clone()
          .add(right.clone().multiplyScalar(u))
          .add(up.clone().multiplyScalar(v));
        
        // Sample the field
        const E = model.E(worldPos);
        const mag = Math.sqrt(E.x * E.x + E.y * E.y + E.z * E.z);
        
        const V = model.V(worldPos);
        
        const idx = j * resolution + i;
        fieldValues.current[idx] = mag;
        potentialValues.current[idx] = V;
        
        if (isFinite(mag)) {
          minMag = Math.min(minMag, mag);
          maxMag = Math.max(maxMag, mag);
        }
        if (isFinite(V)) {
          minV = Math.min(minV, V);
          maxV = Math.max(maxV, V);
        }
      }
    }
    
    // Clamp extreme values for better visualization
    if (logScale) {
      minMag = Math.max(0.01, minMag);
      maxMag = Math.min(maxMag, minMag * 1000); // Limit dynamic range
    }
    
    // Second pass: map to colors
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const idx = j * resolution + i;
        const pixelIdx = idx * 4;
        
        let mag = fieldValues.current[idx];
        
        // Normalize to 0-1 range
        let t: number;
        if (logScale && maxMag > minMag) {
          // Logarithmic scaling
          mag = Math.max(minMag, Math.min(maxMag, mag));
          t = (Math.log10(mag) - Math.log10(minMag)) / (Math.log10(maxMag) - Math.log10(minMag));
        } else if (maxMag > minMag) {
          // Linear scaling
          t = (mag - minMag) / (maxMag - minMag);
        } else {
          t = 0.5;
        }
        
        const [r, g, b] = heatMapColor(t);
        
        textureData[pixelIdx + 0] = Math.floor(r * 255);
        textureData[pixelIdx + 1] = Math.floor(g * 255);
        textureData[pixelIdx + 2] = Math.floor(b * 255);
        textureData[pixelIdx + 3] = 220; // Alpha
      }
    }
    
    texture.needsUpdate = true;
    
    // Update contour lines
    if (showContours && contourLinesRef.current) {
      updateContourLines(
        potentialValues.current,
        resolution,
        size,
        contourCount,
        minV,
        maxV,
        contourGeometry
      );
    }
  });
  
  if (!enabled) return null;
  
  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={geometry} material={material} />
      {showContours && (
        <lineSegments 
          ref={contourLinesRef}
          geometry={contourGeometry} 
          material={contourMaterial}
          position={[0, 0, 0.001]} // Slight offset to prevent z-fighting
        />
      )}
    </group>
  );
}

/**
 * Update contour lines using marching squares algorithm
 */
function updateContourLines(
  values: Float32Array,
  resolution: number,
  size: number,
  contourCount: number,
  minV: number,
  maxV: number,
  geometry: THREE.BufferGeometry
) {
  const segments: number[] = [];
  const halfSize = size / 2;
  const cellSize = size / (resolution - 1);
  
  // Generate contour levels
  const levels: number[] = [];
  
  // Use symmetric levels around zero if range spans zero
  if (minV < 0 && maxV > 0) {
    const maxAbs = Math.max(Math.abs(minV), Math.abs(maxV)) * 0.9;
    const step = maxAbs / Math.floor(contourCount / 2);
    for (let i = 1; i <= Math.floor(contourCount / 2); i++) {
      levels.push(i * step);
      levels.push(-i * step);
    }
  } else {
    const step = (maxV - minV) / (contourCount + 1);
    for (let i = 1; i <= contourCount; i++) {
      levels.push(minV + i * step);
    }
  }
  
  // Marching squares for each contour level
  for (const level of levels) {
    for (let j = 0; j < resolution - 1; j++) {
      for (let i = 0; i < resolution - 1; i++) {
        // Get corner values
        const v00 = values[j * resolution + i];
        const v10 = values[j * resolution + (i + 1)];
        const v01 = values[(j + 1) * resolution + i];
        const v11 = values[(j + 1) * resolution + (i + 1)];
        
        // Skip if any value is not finite
        if (!isFinite(v00) || !isFinite(v10) || !isFinite(v01) || !isFinite(v11)) {
          continue;
        }
        
        // Determine cell case (which corners are above the level)
        let caseIndex = 0;
        if (v00 >= level) caseIndex |= 1;
        if (v10 >= level) caseIndex |= 2;
        if (v11 >= level) caseIndex |= 4;
        if (v01 >= level) caseIndex |= 8;
        
        // Skip empty or full cells
        if (caseIndex === 0 || caseIndex === 15) continue;
        
        // Cell corner positions in local coordinates
        const x0 = -halfSize + i * cellSize;
        const x1 = -halfSize + (i + 1) * cellSize;
        const y0 = -halfSize + j * cellSize;
        const y1 = -halfSize + (j + 1) * cellSize;
        
        // Interpolate edge crossings
        const edges: { x: number; y: number }[] = [];
        
        // Bottom edge (between v00 and v10)
        if ((caseIndex & 1) !== (caseIndex & 2) >> 1) {
          const t = (level - v00) / (v10 - v00);
          edges.push({ x: x0 + t * (x1 - x0), y: y0 });
        }
        // Right edge (between v10 and v11)
        if ((caseIndex & 2) >> 1 !== (caseIndex & 4) >> 2) {
          const t = (level - v10) / (v11 - v10);
          edges.push({ x: x1, y: y0 + t * (y1 - y0) });
        }
        // Top edge (between v01 and v11)
        if ((caseIndex & 8) >> 3 !== (caseIndex & 4) >> 2) {
          const t = (level - v01) / (v11 - v01);
          edges.push({ x: x0 + t * (x1 - x0), y: y1 });
        }
        // Left edge (between v00 and v01)
        if ((caseIndex & 1) !== (caseIndex & 8) >> 3) {
          const t = (level - v00) / (v01 - v00);
          edges.push({ x: x0, y: y0 + t * (y1 - y0) });
        }
        
        // Connect edges (simplified - works for most cases)
        if (edges.length >= 2) {
          segments.push(edges[0].x, edges[0].y, 0);
          segments.push(edges[1].x, edges[1].y, 0);
        }
        if (edges.length === 4) {
          // Saddle point - need to connect correctly
          segments.push(edges[2].x, edges[2].y, 0);
          segments.push(edges[3].x, edges[3].y, 0);
        }
      }
    }
  }
  
  // Update geometry
  if (segments.length > 0) {
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(segments, 3)
    );
  } else {
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)
    );
  }
  geometry.attributes.position.needsUpdate = true;
}

export default CameraSlice;
