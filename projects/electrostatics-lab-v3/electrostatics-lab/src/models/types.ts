import * as THREE from 'three';

// Vector3 type alias for clarity
export type Vec3 = THREE.Vector3;

// Field model interface - all charge distributions must implement this
export interface FieldModel {
  name: string;
  description: string;
  
  // Compute electric field E at position
  E(pos: Vec3): Vec3;
  
  // Compute electric potential V at position
  V(pos: Vec3): number;
  
  // Get source positions for field line seeding
  getSourcePositions(): { position: Vec3; charge: number }[];
  
  // Get geometry for rendering the charge distribution
  getGeometry(): ChargeGeometry[];
  
  // Optional: analytical formula for display
  getFormula?(): string;
}

// Geometry types for rendering charge distributions
export interface ChargeGeometry {
  type: 'point' | 'line' | 'ring' | 'disk' | 'plate';
  position: THREE.Vector3;
  charge: number;
  // For extended objects
  dimensions?: {
    length?: number;
    radius?: number;
    width?: number;
    height?: number;
    normal?: THREE.Vector3;
  };
}

// Physics constants
export const COULOMB_CONSTANT = 8.99e9; // k_e in N·m²/C²
export const EPSILON_0 = 8.854e-12; // ε₀ in C²/(N·m²)

// Numerical stability parameters
export const SOFTENING_LENGTH = 0.05; // ε for singularity softening
export const EXCLUSION_RADIUS = 0.1; // Termination radius near sources

// Utility: compute distance with softening
export function softenedDistance(r: number): number {
  return Math.sqrt(r * r + SOFTENING_LENGTH * SOFTENING_LENGTH);
}

// Utility: compute 1/r² with softening
export function softenedInverseSquare(r: number): number {
  const rSoft = softenedDistance(r);
  return 1 / (rSoft * rSoft);
}

// Utility: compute 1/r with softening
export function softenedInverse(r: number): number {
  return 1 / softenedDistance(r);
}
