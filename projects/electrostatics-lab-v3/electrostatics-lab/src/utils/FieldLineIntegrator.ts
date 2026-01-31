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
  
  // Generate field lines with axial + intermediate + azimuthal structure
  // 2 axial field lines (along symmetry axis) + M intermediate layers + N azimuthal field lines (revolved around axis)
  generateFromSources(radialDensity: number = 6, azimuthalDensity: number = 2): FieldLine[] {
    const allSources = this.model.getSourcePositions();
    const positiveSources = allSources.filter(s => s.charge > 0);
    const negativeSources = allSources.filter(s => s.charge < 0);
    const lines: FieldLine[] = [];

    // Determine symmetry axis
    const symmetryAxis = this.getSymmetryAxis(allSources);
    const { u, v } = this.createOrthonormalBasis(symmetryAxis);

    // Generate field lines FROM positive charges (outward)
    for (const source of positiveSources) {
      lines.push(...this.generateAxialFieldLines(source.position, symmetryAxis, 1));
      lines.push(...this.generateAllAzimuthalFieldLines(source.position, radialDensity, azimuthalDensity, u, v, 1));
    }

    // Generate field lines TO negative charges (inward)
    for (const source of negativeSources) {
      lines.push(...this.generateAxialFieldLines(source.position, symmetryAxis, -1));
      lines.push(...this.generateAllAzimuthalFieldLines(source.position, radialDensity, azimuthalDensity, u, v, -1));
    }

    return lines;
  }

  // Generate 2 axial field lines: one toward opposite charge, one away
  private generateAxialFieldLines(sourcePosition: THREE.Vector3, axis: THREE.Vector3, direction: number): FieldLine[] {
    const lines: FieldLine[] = [];
    const axisNorm = axis.clone().normalize();
    const axialOffset = 0.1; // Small offset from source along axis

    // Axial line 1: toward the other charge (along axis direction)
    const seed1 = sourcePosition.clone().addScaledVector(axisNorm, axialOffset * direction);
    const line1 = this.trace(seed1, direction);
    if (direction === -1 && line1.points.length > 0) {
      line1.points.reverse();
    }
    if (line1.points.length >= 2) {
      lines.push(line1);
    }

    // Axial line 2: away from the other charge (opposite axis direction)
    const seed2 = sourcePosition.clone().addScaledVector(axisNorm, axialOffset * -direction);
    const line2 = this.trace(seed2, direction);
    if (direction === -1 && line2.points.length > 0) {
      line2.points.reverse();
    }
    if (line2.points.length >= 2) {
      lines.push(line2);
    }

    return lines;
  }

  // Generate azimuthal field lines with intermediate meridian spacing
  // Radial Density controls base meridian count; Azimuthal Density adds intermediate meridians
  private generateIntermediateFieldLines(
    sourcePosition: THREE.Vector3,
    radialDensity: number,
    azimuthalDensity: number,
    u: THREE.Vector3,
    v: THREE.Vector3,
    direction: number
  ): FieldLine[] {
    // Intermediate meridians are generated by azimuthalFieldLines when azimuthalDensity > 0
    // This method is kept for API consistency but returns empty when called with azimuthalDensity > 0
    return [];
  }

  // Generate N azimuthal field lines (at 90° to axis), with Azimuthal Density adding intermediate meridians
  private generateAzimuthalFieldLines(
    sourcePosition: THREE.Vector3,
    radialDensity: number,
    u: THREE.Vector3,
    v: THREE.Vector3,
    direction: number
  ): FieldLine[] {
    const lines: FieldLine[] = [];
    const azimuthalRadius = 0.15; // Distance from axis for azimuthal seeds

    // Note: azimuthalDensity is not passed here, but we handle it in the caller
    // Generate radialDensity azimuthal field lines, evenly distributed around the axis
    for (let i = 0; i < radialDensity; i++) {
      const azimuth = (2 * Math.PI * i) / radialDensity;

      // Seed at 90° to the axis (perpendicular)
      const seed = sourcePosition
        .clone()
        .addScaledVector(u, azimuthalRadius * Math.cos(azimuth))
        .addScaledVector(v, azimuthalRadius * Math.sin(azimuth));

      const line = this.trace(seed, direction);
      if (direction === -1 && line.points.length > 0) {
        line.points.reverse();
      }
      if (line.points.length >= 2) {
        lines.push(line);
      }
    }

    return lines;
  }

  // Helper to generate all azimuthal field lines (concentric shells at different radii)
  private generateAllAzimuthalFieldLines(
    sourcePosition: THREE.Vector3,
    radialDensity: number,
    azimuthalDensity: number,
    u: THREE.Vector3,
    v: THREE.Vector3,
    direction: number
  ): FieldLine[] {
    const lines: FieldLine[] = [];

    // Azimuthal Density controls the number of concentric shells
    // Total shells = azimuthalDensity + 1
    const totalShells = azimuthalDensity + 1;
    const minRadius = 0.08;
    const maxRadius = 0.15;

    // Generate concentric shells, each with radialDensity meridians
    for (let shellIdx = 0; shellIdx < totalShells; shellIdx++) {
      // Interpolate radius between minRadius and maxRadius
      const shellRadius = minRadius + (maxRadius - minRadius) * (shellIdx / (totalShells - 1 || 1));

      // For each shell, generate radialDensity field lines distributed around the axis
      for (let i = 0; i < radialDensity; i++) {
        const azimuth = (2 * Math.PI * i) / radialDensity;

        // Seed at 90° to the axis (perpendicular) at this shell's radius
        const seed = sourcePosition
          .clone()
          .addScaledVector(u, shellRadius * Math.cos(azimuth))
          .addScaledVector(v, shellRadius * Math.sin(azimuth));

        const line = this.trace(seed, direction);
        if (direction === -1 && line.points.length > 0) {
          line.points.reverse();
        }
        if (line.points.length >= 2) {
          lines.push(line);
        }
      }
    }

    return lines;
  }

  // Determine symmetry axis from charge configuration
  private getSymmetryAxis(sources: Array<{ position: THREE.Vector3; charge: number }>): THREE.Vector3 {
    if (sources.length === 0) {
      return new THREE.Vector3(0, 0, 1); // Default to Z-axis
    }

    if (sources.length === 1) {
      return new THREE.Vector3(0, 0, 1); // Single charge: use Z-axis
    }

    // For multiple charges, use the first two to define the axis
    const pos1 = sources[0].position;
    const pos2 = sources[1].position;
    const axis = pos2.clone().sub(pos1).normalize();

    // Ensure non-zero axis
    if (axis.length() < 1e-6) {
      return new THREE.Vector3(0, 0, 1);
    }

    return axis;
  }

  // Create orthonormal basis with given primary direction
  private createOrthonormalBasis(
    primary: THREE.Vector3
  ): { u: THREE.Vector3; v: THREE.Vector3 } {
    const primaryNorm = primary.clone().normalize();

    // Find a vector not parallel to primary
    let other: THREE.Vector3;
    if (Math.abs(primaryNorm.x) < 0.9) {
      other = new THREE.Vector3(1, 0, 0);
    } else {
      other = new THREE.Vector3(0, 1, 0);
    }

    // Create orthonormal basis
    const u = new THREE.Vector3().crossVectors(primaryNorm, other).normalize();
    const v = new THREE.Vector3().crossVectors(primaryNorm, u).normalize();

    return { u, v };
  }

  // Generate grid of seeds: numDirections (azimuthal) × numShells (radial)
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
