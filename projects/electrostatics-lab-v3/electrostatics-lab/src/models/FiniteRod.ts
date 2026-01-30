import * as THREE from 'three';
import { FieldModel, ChargeGeometry, SOFTENING_LENGTH } from './types';

export interface RodConfig {
  center: THREE.Vector3;
  length: number;
  charge: number; // Total charge
  axis: THREE.Vector3; // Direction of rod (will be normalized)
}

export class FiniteRodModel implements FieldModel {
  name = 'Finite Rod';
  description = 'A uniformly charged finite rod. On the perpendicular bisector, the y-component of E cancels by symmetry.';
  
  private config: RodConfig;
  private numSegments: number;
  private lambda: number; // Linear charge density
  
  constructor(config: RodConfig, numSegments: number = 50) {
    this.config = {
      ...config,
      axis: config.axis.clone().normalize()
    };
    this.numSegments = numSegments;
    this.lambda = config.charge / config.length;
  }
  
  E(pos: THREE.Vector3): THREE.Vector3 {
    // Use numerical integration (discretized point charges)
    const result = new THREE.Vector3(0, 0, 0);
    const { center, length, axis } = this.config;
    const dq = this.config.charge / this.numSegments;
    const dl = length / this.numSegments;
    
    for (let i = 0; i < this.numSegments; i++) {
      // Position along the rod
      const t = (i + 0.5) / this.numSegments - 0.5; // -0.5 to 0.5
      const sourcePos = new THREE.Vector3()
        .copy(center)
        .addScaledVector(axis, t * length);
      
      const r = new THREE.Vector3().subVectors(pos, sourcePos);
      const rMag = r.length();
      
      if (rMag < SOFTENING_LENGTH) continue;
      
      // dE = k * dq / r² * r̂
      const rSoft = Math.sqrt(rMag * rMag + SOFTENING_LENGTH * SOFTENING_LENGTH);
      const deMag = dq / (rSoft * rSoft);
      const deVec = r.normalize().multiplyScalar(deMag);
      
      result.add(deVec);
    }
    
    return result;
  }
  
  V(pos: THREE.Vector3): number {
    // Analytical formula for finite line charge potential:
    // V = λ/(4πε₀) * ln((√(a² + r²) + a) / (√(b² + r²) - b))
    // where a and b are distances to endpoints along the rod direction
    
    // For simplicity, use numerical integration
    const { center, length, axis } = this.config;
    let result = 0;
    const dq = this.config.charge / this.numSegments;
    
    for (let i = 0; i < this.numSegments; i++) {
      const t = (i + 0.5) / this.numSegments - 0.5;
      const sourcePos = new THREE.Vector3()
        .copy(center)
        .addScaledVector(axis, t * length);
      
      const r = pos.distanceTo(sourcePos);
      const rSoft = Math.sqrt(r * r + SOFTENING_LENGTH * SOFTENING_LENGTH);
      
      result += dq / rSoft;
    }
    
    return result;
  }
  
  getSourcePositions(): { position: THREE.Vector3; charge: number }[] {
    // Return endpoints and center for field line seeding
    const { center, length, axis, charge } = this.config;
    const positions: { position: THREE.Vector3; charge: number }[] = [];
    
    // Seed along the rod
    const numSeeds = 10;
    const seedCharge = charge / numSeeds;
    
    for (let i = 0; i < numSeeds; i++) {
      const t = (i + 0.5) / numSeeds - 0.5;
      positions.push({
        position: new THREE.Vector3()
          .copy(center)
          .addScaledVector(axis, t * length),
        charge: seedCharge
      });
    }
    
    return positions;
  }
  
  getGeometry(): ChargeGeometry[] {
    const { center, length, axis, charge } = this.config;
    return [{
      type: 'line',
      position: center.clone(),
      charge,
      dimensions: {
        length,
        normal: axis.clone()
      }
    }];
  }
  
  getFormula(): string {
    return `E_\\perp = \\frac{k_e Q}{a\\sqrt{a^2 + (L/2)^2}}`;
  }
}

// Factory function
export function createFiniteRod(
  length: number = 2,
  charge: number = 1,
  axis: 'x' | 'y' | 'z' = 'y'
): FiniteRodModel {
  const axisVec = new THREE.Vector3(
    axis === 'x' ? 1 : 0,
    axis === 'y' ? 1 : 0,
    axis === 'z' ? 1 : 0
  );
  
  return new FiniteRodModel({
    center: new THREE.Vector3(0, 0, 0),
    length,
    charge,
    axis: axisVec
  });
}
