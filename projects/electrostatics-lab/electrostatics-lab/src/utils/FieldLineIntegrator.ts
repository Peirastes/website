import * as THREE from 'three';
import { FieldModel, EXCLUSION_RADIUS } from '../models/types';

export interface FieldLineConfig {
  maxSteps: number;
  stepSize: number;
  maxLength: number;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };
  terminationRadius: number;
}

const DEFAULT_CONFIG: FieldLineConfig = {
  maxSteps: 500,
  stepSize: 0.05,
  maxLength: 20,
  bounds: {
    min: new THREE.Vector3(-5, -5, -5),
    max: new THREE.Vector3(5, 5, 5)
  },
  terminationRadius: EXCLUSION_RADIUS
};

export interface FieldLine {
  points: THREE.Vector3[];
  terminated: 'boundary' | 'sink' | 'stagnation' | 'maxLength';
}

export class FieldLineIntegrator {
  private model: FieldModel;
  private config: FieldLineConfig;
  private sinkPositions: THREE.Vector3[];
  
  constructor(model: FieldModel, config: Partial<FieldLineConfig> = {}) {
    this.model = model;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Cache sink positions (negative charges)
    this.sinkPositions = model.getSourcePositions()
      .filter(s => s.charge < 0)
      .map(s => s.position);
  }
  
  // RK4 integration step
  private rk4Step(pos: THREE.Vector3, direction: number): THREE.Vector3 | null {
    const h = this.config.stepSize * direction;
    
    // Get field direction (normalized)
    const getDirection = (p: THREE.Vector3): THREE.Vector3 | null => {
      const E = this.model.E(p);
      const mag = E.length();
      if (mag < 1e-10) return null;
      return E.divideScalar(mag);
    };
    
    const k1 = getDirection(pos);
    if (!k1) return null;
    
    const p2 = pos.clone().addScaledVector(k1, h / 2);
    const k2 = getDirection(p2);
    if (!k2) return null;
    
    const p3 = pos.clone().addScaledVector(k2, h / 2);
    const k3 = getDirection(p3);
    if (!k3) return null;
    
    const p4 = pos.clone().addScaledVector(k3, h);
    const k4 = getDirection(p4);
    if (!k4) return null;
    
    // Weighted average
    const delta = new THREE.Vector3()
      .addScaledVector(k1, 1)
      .addScaledVector(k2, 2)
      .addScaledVector(k3, 2)
      .addScaledVector(k4, 1)
      .multiplyScalar(h / 6);
    
    return pos.clone().add(delta);
  }
  
  // Check if position is within bounds
  private isInBounds(pos: THREE.Vector3): boolean {
    const { min, max } = this.config.bounds;
    return pos.x >= min.x && pos.x <= max.x &&
           pos.y >= min.y && pos.y <= max.y &&
           pos.z >= min.z && pos.z <= max.z;
  }
  
  // Check if position is near a sink (negative charge)
  private isNearSink(pos: THREE.Vector3): boolean {
    for (const sinkPos of this.sinkPositions) {
      if (pos.distanceTo(sinkPos) < this.config.terminationRadius) {
        return true;
      }
    }
    return false;
  }
  
  // Trace a field line from a starting position
  trace(startPos: THREE.Vector3, direction: number = 1): FieldLine {
    const points: THREE.Vector3[] = [startPos.clone()];
    let currentPos = startPos.clone();
    let totalLength = 0;
    let terminated: FieldLine['terminated'] = 'maxLength';
    
    for (let i = 0; i < this.config.maxSteps; i++) {
      const nextPos = this.rk4Step(currentPos, direction);
      
      // Check for stagnation
      if (!nextPos) {
        terminated = 'stagnation';
        break;
      }
      
      const stepLength = nextPos.distanceTo(currentPos);
      totalLength += stepLength;
      
      // Check bounds
      if (!this.isInBounds(nextPos)) {
        terminated = 'boundary';
        // Add the boundary intersection point
        points.push(this.clipToBounds(currentPos, nextPos));
        break;
      }
      
      // Check sinks
      if (this.isNearSink(nextPos)) {
        terminated = 'sink';
        points.push(nextPos);
        break;
      }
      
      // Check max length
      if (totalLength > this.config.maxLength) {
        terminated = 'maxLength';
        points.push(nextPos);
        break;
      }
      
      points.push(nextPos);
      currentPos = nextPos;
    }
    
    return { points, terminated };
  }
  
  // Clip line segment to bounds
  private clipToBounds(inside: THREE.Vector3, outside: THREE.Vector3): THREE.Vector3 {
    const { min, max } = this.config.bounds;
    const dir = outside.clone().sub(inside);
    let t = 1;
    
    // Check each boundary
    const checkAxis = (axis: 'x' | 'y' | 'z') => {
      if (dir[axis] > 0) {
        const tMax = (max[axis] - inside[axis]) / dir[axis];
        if (tMax < t) t = tMax;
      } else if (dir[axis] < 0) {
        const tMin = (min[axis] - inside[axis]) / dir[axis];
        if (tMin < t) t = tMin;
      }
    };
    
    checkAxis('x');
    checkAxis('y');
    checkAxis('z');
    
    return inside.clone().addScaledVector(dir, t);
  }
  
  // Generate field lines from source positions
  generateFromSources(linesPerSource: number = 8, offset: number = 0.15): FieldLine[] {
    const sources = this.model.getSourcePositions().filter(s => s.charge > 0);
    const lines: FieldLine[] = [];
    
    for (const source of sources) {
      // Generate seed positions around the source
      const seeds = this.generateSeedsAroundPoint(source.position, linesPerSource, offset);
      
      for (const seed of seeds) {
        const line = this.trace(seed, 1); // Trace in positive direction
        if (line.points.length > 2) {
          lines.push(line);
        }
      }
    }
    
    return lines;
  }
  
  // Generate seed positions in a spherical pattern around a point
  private generateSeedsAroundPoint(
    center: THREE.Vector3,
    count: number,
    offset: number
  ): THREE.Vector3[] {
    const seeds: THREE.Vector3[] = [];
    
    // Use Fibonacci sphere distribution for more even coverage
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const seed = new THREE.Vector3(
        center.x + offset * radius * Math.cos(theta),
        center.y + offset * y,
        center.z + offset * radius * Math.sin(theta)
      );
      
      seeds.push(seed);
    }
    
    return seeds;
  }
  
  // Generate field lines for extended objects (like rods, disks)
  generateFromExtendedSource(
    seedPositions: THREE.Vector3[],
    normalOffset: number = 0.1
  ): FieldLine[] {
    const lines: FieldLine[] = [];
    
    for (const pos of seedPositions) {
      // Get field direction at seed position for normal
      const E = this.model.E(pos);
      if (E.length() < 1e-10) continue;
      
      const normal = E.clone().normalize();
      const seed = pos.clone().addScaledVector(normal, normalOffset);
      
      const line = this.trace(seed, 1);
      if (line.points.length > 2) {
        lines.push(line);
      }
    }
    
    return lines;
  }
}
