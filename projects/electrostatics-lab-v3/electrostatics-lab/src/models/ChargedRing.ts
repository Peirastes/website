import * as THREE from 'three';
import { FieldModel, ChargeGeometry, SOFTENING_LENGTH } from './types';

export interface RingConfig {
  center: THREE.Vector3;
  radius: number;
  charge: number;
  normal: THREE.Vector3; // Normal to the plane of the ring
}

export class ChargedRingModel implements FieldModel {
  name = 'Charged Ring';
  description = 'A uniformly charged ring. On the axis, only the axial component survives due to symmetry. The field is zero at the center.';
  
  private config: RingConfig;
  private numSegments: number;
  
  constructor(config: RingConfig, numSegments: number = 64) {
    this.config = {
      ...config,
      normal: config.normal.clone().normalize()
    };
    this.numSegments = numSegments;
  }
  
  // For points on the axis, use analytical formula
  private axialE(x: number): number {
    const { radius, charge } = this.config;
    const a = radius;
    // E_x = k * Q * x / (a² + x²)^(3/2)
    const denom = Math.pow(a * a + x * x + SOFTENING_LENGTH * SOFTENING_LENGTH, 1.5);
    return charge * x / denom;
  }
  
  E(pos: THREE.Vector3): THREE.Vector3 {
    // General numerical integration
    const result = new THREE.Vector3(0, 0, 0);
    const { center, radius, charge, normal } = this.config;
    const dq = charge / this.numSegments;
    
    // Create basis vectors perpendicular to normal
    const u = new THREE.Vector3();
    if (Math.abs(normal.x) < 0.9) {
      u.crossVectors(new THREE.Vector3(1, 0, 0), normal).normalize();
    } else {
      u.crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    }
    const v = new THREE.Vector3().crossVectors(normal, u);
    
    for (let i = 0; i < this.numSegments; i++) {
      const theta = (2 * Math.PI * i) / this.numSegments;
      
      // Position on ring
      const sourcePos = new THREE.Vector3()
        .copy(center)
        .addScaledVector(u, radius * Math.cos(theta))
        .addScaledVector(v, radius * Math.sin(theta));
      
      const r = new THREE.Vector3().subVectors(pos, sourcePos);
      const rMag = r.length();
      
      if (rMag < SOFTENING_LENGTH * 0.5) continue;
      
      const rSoft = Math.sqrt(rMag * rMag + SOFTENING_LENGTH * SOFTENING_LENGTH);
      const deMag = dq / (rSoft * rSoft);
      const deVec = r.normalize().multiplyScalar(deMag);
      
      result.add(deVec);
    }
    
    return result;
  }
  
  V(pos: THREE.Vector3): number {
    const { center, radius, charge, normal } = this.config;
    let result = 0;
    const dq = charge / this.numSegments;
    
    const u = new THREE.Vector3();
    if (Math.abs(normal.x) < 0.9) {
      u.crossVectors(new THREE.Vector3(1, 0, 0), normal).normalize();
    } else {
      u.crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    }
    const v = new THREE.Vector3().crossVectors(normal, u);
    
    for (let i = 0; i < this.numSegments; i++) {
      const theta = (2 * Math.PI * i) / this.numSegments;
      
      const sourcePos = new THREE.Vector3()
        .copy(center)
        .addScaledVector(u, radius * Math.cos(theta))
        .addScaledVector(v, radius * Math.sin(theta));
      
      const r = pos.distanceTo(sourcePos);
      const rSoft = Math.sqrt(r * r + SOFTENING_LENGTH * SOFTENING_LENGTH);
      
      result += dq / rSoft;
    }
    
    return result;
  }
  
  getSourcePositions(): { position: THREE.Vector3; charge: number }[] {
    const { center, radius, charge, normal } = this.config;
    const positions: { position: THREE.Vector3; charge: number }[] = [];
    
    const u = new THREE.Vector3();
    if (Math.abs(normal.x) < 0.9) {
      u.crossVectors(new THREE.Vector3(1, 0, 0), normal).normalize();
    } else {
      u.crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    }
    const v = new THREE.Vector3().crossVectors(normal, u);
    
    // Seed points around the ring
    const numSeeds = 12;
    const seedCharge = charge / numSeeds;
    
    for (let i = 0; i < numSeeds; i++) {
      const theta = (2 * Math.PI * i) / numSeeds;
      positions.push({
        position: new THREE.Vector3()
          .copy(center)
          .addScaledVector(u, radius * Math.cos(theta))
          .addScaledVector(v, radius * Math.sin(theta)),
        charge: seedCharge
      });
    }
    
    return positions;
  }
  
  getGeometry(): ChargeGeometry[] {
    const { center, radius, charge, normal } = this.config;
    return [{
      type: 'ring',
      position: center.clone(),
      charge,
      dimensions: {
        radius,
        normal: normal.clone()
      }
    }];
  }
  
  getFormula(): string {
    return `E_x = \\frac{k_e Q x}{(a^2 + x^2)^{3/2}}`;
  }
}

// Factory function
export function createChargedRing(
  radius: number = 1,
  charge: number = 1,
  axis: 'x' | 'y' | 'z' = 'x'
): ChargedRingModel {
  const normal = new THREE.Vector3(
    axis === 'x' ? 1 : 0,
    axis === 'y' ? 1 : 0,
    axis === 'z' ? 1 : 0
  );
  
  return new ChargedRingModel({
    center: new THREE.Vector3(0, 0, 0),
    radius,
    charge,
    normal
  });
}
