import * as THREE from 'three';
import { FieldModel, ChargeGeometry, softenedDistance, softenedInverseSquare, softenedInverse } from './types';

export interface PointChargeConfig {
  position: THREE.Vector3;
  charge: number; // In units where k_e * q gives convenient magnitudes
}

export class PointChargeModel implements FieldModel {
  name = 'Point Charge';
  description = 'A single point charge creates a radially symmetric electric field that falls off as 1/r².';
  
  private charges: PointChargeConfig[];
  
  constructor(charges: PointChargeConfig[]) {
    this.charges = charges;
  }
  
  E(pos: THREE.Vector3): THREE.Vector3 {
    const result = new THREE.Vector3(0, 0, 0);
    
    for (const charge of this.charges) {
      const r = new THREE.Vector3().subVectors(pos, charge.position);
      const rMag = r.length();
      
      if (rMag < 0.001) continue; // Skip if at charge position
      
      // E = k * q / r² * r̂
      // Using softened distance for numerical stability
      const eMag = charge.charge * softenedInverseSquare(rMag);
      const eVec = r.normalize().multiplyScalar(eMag);
      
      result.add(eVec);
    }
    
    return result;
  }
  
  V(pos: THREE.Vector3): number {
    let result = 0;
    
    for (const charge of this.charges) {
      const r = pos.distanceTo(charge.position);
      
      // V = k * q / r (with softening)
      result += charge.charge * softenedInverse(r);
    }
    
    return result;
  }
  
  getSourcePositions(): { position: THREE.Vector3; charge: number }[] {
    return this.charges.map(c => ({
      position: c.position.clone(),
      charge: c.charge
    }));
  }
  
  getGeometry(): ChargeGeometry[] {
    return this.charges.map(c => ({
      type: 'point',
      position: c.position.clone(),
      charge: c.charge
    }));
  }
  
  getFormula(): string {
    return `E = k_e \\frac{q}{r^2} \\hat{r}`;
  }
}

// Factory functions for common configurations
export function createSingleCharge(charge: number = 1): PointChargeModel {
  return new PointChargeModel([
    { position: new THREE.Vector3(0, 0, 0), charge }
  ]);
}

export function createDipole(separation: number = 2, charge: number = 1): PointChargeModel {
  return new PointChargeModel([
    { position: new THREE.Vector3(-separation / 2, 0, 0), charge: charge },
    { position: new THREE.Vector3(separation / 2, 0, 0), charge: -charge }
  ]);
}

export function createLikeCharges(separation: number = 2, charge: number = 1): PointChargeModel {
  return new PointChargeModel([
    { position: new THREE.Vector3(-separation / 2, 0, 0), charge },
    { position: new THREE.Vector3(separation / 2, 0, 0), charge }
  ]);
}

export function createQuadrupole(size: number = 1.5, charge: number = 1): PointChargeModel {
  return new PointChargeModel([
    { position: new THREE.Vector3(-size / 2, -size / 2, 0), charge: charge },
    { position: new THREE.Vector3(size / 2, -size / 2, 0), charge: -charge },
    { position: new THREE.Vector3(size / 2, size / 2, 0), charge: charge },
    { position: new THREE.Vector3(-size / 2, size / 2, 0), charge: -charge }
  ]);
}

export function createTriangle(size: number = 2, charge: number = 1): PointChargeModel {
  const h = size * Math.sqrt(3) / 2;
  return new PointChargeModel([
    { position: new THREE.Vector3(0, h / 2, 0), charge: charge },
    { position: new THREE.Vector3(-size / 2, -h / 2, 0), charge: charge },
    { position: new THREE.Vector3(size / 2, -h / 2, 0), charge: -charge }
  ]);
}
