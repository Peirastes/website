import * as THREE from 'three';
import { FieldModel, ChargeGeometry, SOFTENING_LENGTH } from './types';

export interface PlateConfig {
  center: THREE.Vector3;
  width: number;  // x-direction
  height: number; // y-direction
  charge: number;
  normal: THREE.Vector3; // Direction perpendicular to plate
}

export class FinitePlateModel implements FieldModel {
  name = 'Finite Plate';
  description = 'A uniformly charged rectangular plate. Near the center, the field approaches σ/(2ε₀). Edge effects become significant near the boundaries.';
  
  private config: PlateConfig;
  private numX: number;
  private numY: number;
  private sigma: number;
  
  constructor(config: PlateConfig, numX: number = 20, numY: number = 20) {
    this.config = {
      ...config,
      normal: config.normal.clone().normalize()
    };
    this.numX = numX;
    this.numY = numY;
    this.sigma = config.charge / (config.width * config.height);
  }
  
  E(pos: THREE.Vector3): THREE.Vector3 {
    const result = new THREE.Vector3(0, 0, 0);
    const { center, width, height, normal } = this.config;
    
    // Create basis vectors for the plate plane
    const u = new THREE.Vector3();
    const v = new THREE.Vector3();
    
    if (Math.abs(normal.z) > 0.9) {
      u.set(1, 0, 0);
      v.set(0, 1, 0);
    } else if (Math.abs(normal.y) > 0.9) {
      u.set(1, 0, 0);
      v.set(0, 0, 1);
    } else {
      u.set(0, 1, 0);
      v.set(0, 0, 1);
    }
    
    const dx = width / this.numX;
    const dy = height / this.numY;
    const dA = dx * dy;
    const dq = this.sigma * dA;
    
    for (let i = 0; i < this.numX; i++) {
      const x = (i + 0.5) / this.numX - 0.5; // -0.5 to 0.5
      
      for (let j = 0; j < this.numY; j++) {
        const y = (j + 0.5) / this.numY - 0.5;
        
        const sourcePos = new THREE.Vector3()
          .copy(center)
          .addScaledVector(u, x * width)
          .addScaledVector(v, y * height);
        
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
    const { center, width, height, normal } = this.config;
    let result = 0;
    
    const u = new THREE.Vector3();
    const v = new THREE.Vector3();
    
    if (Math.abs(normal.z) > 0.9) {
      u.set(1, 0, 0);
      v.set(0, 1, 0);
    } else if (Math.abs(normal.y) > 0.9) {
      u.set(1, 0, 0);
      v.set(0, 0, 1);
    } else {
      u.set(0, 1, 0);
      v.set(0, 0, 1);
    }
    
    const dx = width / this.numX;
    const dy = height / this.numY;
    const dA = dx * dy;
    const dq = this.sigma * dA;
    
    for (let i = 0; i < this.numX; i++) {
      const x = (i + 0.5) / this.numX - 0.5;
      
      for (let j = 0; j < this.numY; j++) {
        const y = (j + 0.5) / this.numY - 0.5;
        
        const sourcePos = new THREE.Vector3()
          .copy(center)
          .addScaledVector(u, x * width)
          .addScaledVector(v, y * height);
        
        const r = pos.distanceTo(sourcePos);
        const rSoft = Math.sqrt(r * r + SOFTENING_LENGTH * SOFTENING_LENGTH);
        
        result += dq / rSoft;
      }
    }
    
    return result;
  }
  
  getSourcePositions(): { position: THREE.Vector3; charge: number }[] {
    const { center, width, height, charge, normal } = this.config;
    const positions: { position: THREE.Vector3; charge: number }[] = [];
    
    const u = new THREE.Vector3();
    const v = new THREE.Vector3();
    
    if (Math.abs(normal.z) > 0.9) {
      u.set(1, 0, 0);
      v.set(0, 1, 0);
    } else if (Math.abs(normal.y) > 0.9) {
      u.set(1, 0, 0);
      v.set(0, 0, 1);
    } else {
      u.set(0, 1, 0);
      v.set(0, 0, 1);
    }
    
    // Seed grid on plate
    const numSeedsX = 5;
    const numSeedsY = 5;
    const seedCharge = charge / (numSeedsX * numSeedsY);
    
    for (let i = 0; i < numSeedsX; i++) {
      const x = (i + 0.5) / numSeedsX - 0.5;
      
      for (let j = 0; j < numSeedsY; j++) {
        const y = (j + 0.5) / numSeedsY - 0.5;
        
        positions.push({
          position: new THREE.Vector3()
            .copy(center)
            .addScaledVector(u, x * width)
            .addScaledVector(v, y * height),
          charge: seedCharge
        });
      }
    }
    
    return positions;
  }
  
  getGeometry(): ChargeGeometry[] {
    const { center, width, height, charge, normal } = this.config;
    return [{
      type: 'plate',
      position: center.clone(),
      charge,
      dimensions: {
        width,
        height,
        normal: normal.clone()
      }
    }];
  }
  
  getFormula(): string {
    return `E \\approx \\frac{\\sigma}{2\\varepsilon_0} \\text{ (near center)}`;
  }
}

// Parallel plate capacitor model
export class ParallelPlatesModel implements FieldModel {
  name = 'Parallel Plates';
  description = 'Two parallel plates with opposite charges, modeling a capacitor. The field is nearly uniform between the plates.';
  
  private plate1: FinitePlateModel;
  private plate2: FinitePlateModel;
  private separation: number;
  
  constructor(
    width: number = 3,
    height: number = 3,
    separation: number = 2,
    charge: number = 1,
    resolution: number = 15
  ) {
    this.separation = separation;
    
    this.plate1 = new FinitePlateModel({
      center: new THREE.Vector3(separation / 2, 0, 0),
      width,
      height,
      charge: charge,
      normal: new THREE.Vector3(-1, 0, 0) // Faces inward
    }, resolution, resolution);
    
    this.plate2 = new FinitePlateModel({
      center: new THREE.Vector3(-separation / 2, 0, 0),
      width,
      height,
      charge: -charge,
      normal: new THREE.Vector3(1, 0, 0) // Faces inward
    }, resolution, resolution);
  }
  
  E(pos: THREE.Vector3): THREE.Vector3 {
    const e1 = this.plate1.E(pos);
    const e2 = this.plate2.E(pos);
    return e1.add(e2);
  }
  
  V(pos: THREE.Vector3): number {
    return this.plate1.V(pos) + this.plate2.V(pos);
  }
  
  getSourcePositions(): { position: THREE.Vector3; charge: number }[] {
    return [
      ...this.plate1.getSourcePositions(),
      ...this.plate2.getSourcePositions()
    ];
  }
  
  getGeometry(): ChargeGeometry[] {
    return [
      ...this.plate1.getGeometry(),
      ...this.plate2.getGeometry()
    ];
  }
  
  getFormula(): string {
    return `E = \\frac{\\sigma}{\\varepsilon_0} \\text{ (between plates)}`;
  }
}

// Factory functions
export function createFinitePlate(
  width: number = 2,
  height: number = 2,
  charge: number = 1
): FinitePlateModel {
  return new FinitePlateModel({
    center: new THREE.Vector3(0, 0, 0),
    width,
    height,
    charge,
    normal: new THREE.Vector3(1, 0, 0)
  });
}

export function createParallelPlates(
  width: number = 3,
  height: number = 3,
  separation: number = 2,
  charge: number = 1
): ParallelPlatesModel {
  return new ParallelPlatesModel(width, height, separation, charge);
}
