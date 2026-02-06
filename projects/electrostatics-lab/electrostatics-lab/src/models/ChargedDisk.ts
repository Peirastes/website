import * as THREE from 'three';
import { FieldModel, ChargeGeometry, SOFTENING_LENGTH } from './types';

export interface DiskConfig {
  center: THREE.Vector3;
  radius: number;
  charge: number;
  normal: THREE.Vector3;
}

export class ChargedDiskModel implements FieldModel {
  name = 'Charged Disk';
  description = 'A uniformly charged disk. Near the disk (x << R), the field approaches σ/(2ε₀), like an infinite plane. Far away, it behaves like a point charge.';
  
  private config: DiskConfig;
  private numRadial: number;
  private numAngular: number;
  private sigma: number; // Surface charge density
  
  constructor(config: DiskConfig, numRadial: number = 20, numAngular: number = 32) {
    this.config = {
      ...config,
      normal: config.normal.clone().normalize()
    };
    this.numRadial = numRadial;
    this.numAngular = numAngular;
    this.sigma = config.charge / (Math.PI * config.radius * config.radius);
  }
  
  E(pos: THREE.Vector3): THREE.Vector3 {
    const result = new THREE.Vector3(0, 0, 0);
    const { center, radius, normal } = this.config;
    
    // Create basis vectors
    const u = new THREE.Vector3();
    if (Math.abs(normal.x) < 0.9) {
      u.crossVectors(new THREE.Vector3(1, 0, 0), normal).normalize();
    } else {
      u.crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    }
    const v = new THREE.Vector3().crossVectors(normal, u);
    
    // Integrate in polar coordinates
    for (let i = 0; i < this.numRadial; i++) {
      // Use trapezoidal weighting for radial
      const r_inner = (i / this.numRadial) * radius;
      const r_outer = ((i + 1) / this.numRadial) * radius;
      const r_mid = (r_inner + r_outer) / 2;
      const dr = r_outer - r_inner;
      
      for (let j = 0; j < this.numAngular; j++) {
        const theta = (2 * Math.PI * j) / this.numAngular;
        const dTheta = 2 * Math.PI / this.numAngular;
        
        // Area element: r * dr * dθ
        const dA = r_mid * dr * dTheta;
        const dq = this.sigma * dA;
        
        // Position on disk
        const sourcePos = new THREE.Vector3()
          .copy(center)
          .addScaledVector(u, r_mid * Math.cos(theta))
          .addScaledVector(v, r_mid * Math.sin(theta));
        
        const rVec = new THREE.Vector3().subVectors(pos, sourcePos);
        const rMag = rVec.length();
        
        if (rMag < SOFTENING_LENGTH * 0.5) continue;
        
        const rSoft = Math.sqrt(rMag * rMag + SOFTENING_LENGTH * SOFTENING_LENGTH);
        const deMag = dq / (rSoft * rSoft);
        const deVec = rVec.normalize().multiplyScalar(deMag);
        
        result.add(deVec);
      }
    }
    
    return result;
  }
  
  V(pos: THREE.Vector3): number {
    const { center, radius, normal } = this.config;
    let result = 0;
    
    const u = new THREE.Vector3();
    if (Math.abs(normal.x) < 0.9) {
      u.crossVectors(new THREE.Vector3(1, 0, 0), normal).normalize();
    } else {
      u.crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    }
    const v = new THREE.Vector3().crossVectors(normal, u);
    
    for (let i = 0; i < this.numRadial; i++) {
      const r_inner = (i / this.numRadial) * radius;
      const r_outer = ((i + 1) / this.numRadial) * radius;
      const r_mid = (r_inner + r_outer) / 2;
      const dr = r_outer - r_inner;
      
      for (let j = 0; j < this.numAngular; j++) {
        const theta = (2 * Math.PI * j) / this.numAngular;
        const dTheta = 2 * Math.PI / this.numAngular;
        
        const dA = r_mid * dr * dTheta;
        const dq = this.sigma * dA;
        
        const sourcePos = new THREE.Vector3()
          .copy(center)
          .addScaledVector(u, r_mid * Math.cos(theta))
          .addScaledVector(v, r_mid * Math.sin(theta));
        
        const r = pos.distanceTo(sourcePos);
        const rSoft = Math.sqrt(r * r + SOFTENING_LENGTH * SOFTENING_LENGTH);
        
        result += dq / rSoft;
      }
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
    
    // Seed points on disk surface
    const numRadialSeeds = 3;
    const numAngularSeeds = 8;
    
    for (let i = 0; i < numRadialSeeds; i++) {
      const r = ((i + 0.5) / numRadialSeeds) * radius;
      const ringCharge = charge * (2 * (i + 0.5) / numRadialSeeds) / (numRadialSeeds);
      
      for (let j = 0; j < numAngularSeeds; j++) {
        const theta = (2 * Math.PI * j) / numAngularSeeds;
        positions.push({
          position: new THREE.Vector3()
            .copy(center)
            .addScaledVector(u, r * Math.cos(theta))
            .addScaledVector(v, r * Math.sin(theta)),
          charge: ringCharge / numAngularSeeds
        });
      }
    }
    
    return positions;
  }
  
  getGeometry(): ChargeGeometry[] {
    const { center, radius, charge, normal } = this.config;
    return [{
      type: 'disk',
      position: center.clone(),
      charge,
      dimensions: {
        radius,
        normal: normal.clone()
      }
    }];
  }
  
  getFormula(): string {
    return `E_x = \\frac{\\sigma}{2\\varepsilon_0}\\left[1 - \\frac{x}{\\sqrt{R^2 + x^2}}\\right]`;
  }
}

// Factory function
export function createChargedDisk(
  radius: number = 1.5,
  charge: number = 1,
  axis: 'x' | 'y' | 'z' = 'x'
): ChargedDiskModel {
  const normal = new THREE.Vector3(
    axis === 'x' ? 1 : 0,
    axis === 'y' ? 1 : 0,
    axis === 'z' ? 1 : 0
  );
  
  return new ChargedDiskModel({
    center: new THREE.Vector3(0, 0, 0),
    radius,
    charge,
    normal
  });
}
