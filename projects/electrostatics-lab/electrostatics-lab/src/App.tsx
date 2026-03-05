import { useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { Leva, useControls, folder, button } from 'leva';
import * as THREE from 'three';

import { VectorFieldGlyphs } from './components/VectorFieldGlyphs';
import { FieldLines } from './components/FieldLines';
import { EquipotentialSurfaces } from './components/EquipotentialSurfaces';
import { ChargeGeometryRenderer } from './components/ChargeGeometryRenderer';
import { SliceView } from './components/SliceView';
import { CameraSlice } from './components/CameraSlice';
import { InfoPanel } from './components/InfoPanel';
import { FieldModel } from './models/types';
import {
  createSingleCharge,
  createDipole,
  createLikeCharges,
  createQuadrupole,
  createTriangle,
} from './models/PointCharge';
import { createFiniteRod } from './models/FiniteRod';
import { createChargedRing } from './models/ChargedRing';
import { createChargedDisk } from './models/ChargedDisk';
import { createFinitePlate, createParallelPlates } from './models/FinitePlate';

import './App.css';

// Case definitions
type CaseType = 
  | 'single_positive' | 'single_negative'
  | 'dipole' | 'like_charges' | 'quadrupole' | 'triangle'
  | 'finite_rod' | 'ring' | 'disk'
  | 'finite_plate' | 'parallel_plates';

const CASE_LABELS: Record<CaseType, string> = {
  single_positive: 'Single Positive Charge',
  single_negative: 'Single Negative Charge',
  dipole: 'Electric Dipole',
  like_charges: 'Two Like Charges',
  quadrupole: 'Quadrupole',
  triangle: 'Triangle Configuration',
  finite_rod: 'Finite Rod (Line Charge)',
  ring: 'Charged Ring',
  disk: 'Charged Disk',
  finite_plate: 'Finite Rectangular Plate',
  parallel_plates: 'Parallel Plates (Capacitor)',
};

const CASE_DESCRIPTIONS: Record<CaseType, string> = {
  single_positive: 'A single positive point charge. Field lines radiate outward uniformly in all directions (radial symmetry). E ∝ 1/r².',
  single_negative: 'A single negative point charge. Field lines point inward toward the charge. E ∝ 1/r².',
  dipole: 'Two equal and opposite charges. Field lines curve from + to −. On the perpendicular bisector, E points toward the negative charge.',
  like_charges: 'Two positive charges. Field lines repel each other. There is a null point (E = 0) between them.',
  quadrupole: 'Four charges in alternating arrangement. Field falls off as 1/r³ at large distances.',
  triangle: 'Three charges in a triangular arrangement. Shows superposition of multiple fields.',
  finite_rod: 'A uniformly charged finite rod. On the perpendicular bisector, symmetry causes the parallel component to cancel.',
  ring: 'A uniformly charged ring. On the axis, only the axial component survives. E = 0 at the center.',
  disk: 'A uniformly charged disk. Near the disk, E approaches σ/(2ε₀). Far away, it behaves like a point charge.',
  finite_plate: 'A rectangular plate with uniform charge. Near the center, E ≈ σ/(2ε₀). Edge effects appear near boundaries.',
  parallel_plates: 'Two parallel plates with opposite charges (capacitor). The field is nearly uniform between plates.',
};

function createModel(caseType: CaseType, params: Record<string, number>): FieldModel {
  const { charge, separation, length, radius, width, height } = params;
  
  switch (caseType) {
    case 'single_positive':
      return createSingleCharge(Math.abs(charge));
    case 'single_negative':
      return createSingleCharge(-Math.abs(charge));
    case 'dipole':
      return createDipole(separation, Math.abs(charge));
    case 'like_charges':
      return createLikeCharges(separation, Math.abs(charge));
    case 'quadrupole':
      return createQuadrupole(separation, Math.abs(charge));
    case 'triangle':
      return createTriangle(separation, Math.abs(charge));
    case 'finite_rod':
      return createFiniteRod(length, charge, 'y');
    case 'ring':
      return createChargedRing(radius, charge, 'x');
    case 'disk':
      return createChargedDisk(radius, charge, 'x');
    case 'finite_plate':
      return createFinitePlate(width, height, charge);
    case 'parallel_plates':
      return createParallelPlates(width, height, separation, Math.abs(charge));
    default:
      return createSingleCharge(1);
  }
}

export default function App() {
  const [showSlice, setShowSlice] = useState(false);
  
  // Main controls
  const { caseType, charge, separation, length, radius, width, height } = useControls('Configuration', {
    caseType: {
      value: 'dipole' as CaseType,
      options: Object.fromEntries(Object.entries(CASE_LABELS).map(([k, v]) => [v, k])),
      label: 'Case',
    },
    charge: { value: 1, min: 0.1, max: 3, step: 0.1, label: 'Charge (Q)' },
    separation: { value: 2, min: 0.5, max: 4, step: 0.1, label: 'Separation (d)' },
    length: { value: 2, min: 0.5, max: 4, step: 0.1, label: 'Length (L)' },
    radius: { value: 1, min: 0.3, max: 3, step: 0.1, label: 'Radius (R)' },
    width: { value: 2.5, min: 1, max: 4, step: 0.1, label: 'Width' },
    height: { value: 2.5, min: 1, max: 4, step: 0.1, label: 'Height' },
  });
  
  // Visualization controls
  const {
    showVectors,
    showFieldLines,
    showEquipotentials,
    vectorDensity,
    fieldLineCount,
    equipotentialLevels,
    vectorScale,
    logScale,
    clampMin,
    clampMax,
  } = useControls('Visualization', {
    showVectors: { value: true, label: 'Vector Field' },
    showFieldLines: { value: true, label: 'Field Lines' },
    showEquipotentials: { value: true, label: 'Equipotentials' },
    vectorDensity: { value: 8, min: 4, max: 15, step: 1, label: 'Vector Density' },
    fieldLineCount: { value: 12, min: 4, max: 24, step: 1, label: 'Field Lines/Source' },
    equipotentialLevels: { value: 5, min: 1, max: 10, step: 1, label: 'Equipotential Levels' },
    vectorScale: { value: 0.3, min: 0.1, max: 1, step: 0.05, label: 'Vector Scale' },
    logScale: { value: false, label: 'Log Scale |E|' },
    clampMin: { value: 0.01, min: 0.001, max: 0.5, step: 0.01, label: 'Clamp Min' },
    clampMax: { value: 5, min: 1, max: 20, step: 0.5, label: 'Clamp Max' },
  });
  
  // View controls
  const { showGrid, showAxes, bounds } = useControls('View', {
    showGrid: { value: true, label: 'Show Grid' },
    showAxes: { value: true, label: 'Show Axes' },
    bounds: { value: 4, min: 2, max: 8, step: 0.5, label: 'Domain Size' },
    '2D Slice View': button(() => setShowSlice(s => !s)),
  });
  
  // Camera Slice controls (the new live cross-section feature)
  const {
    showCameraSlice,
    sliceOffset,
    sliceSize,
    sliceResolution,
    sliceOpacity,
    sliceContours,
    sliceContourCount,
    sliceLogScale,
  } = useControls('Camera Slice', {
    showCameraSlice: { value: false, label: 'Enable Live Slice' },
    sliceOffset: { value: 0, min: -5, max: 5, step: 0.1, label: 'Slice Offset' },
    sliceSize: { value: 8, min: 4, max: 15, step: 0.5, label: 'Slice Size' },
    sliceResolution: { value: 80, min: 40, max: 150, step: 10, label: 'Resolution' },
    sliceOpacity: { value: 0.85, min: 0.3, max: 1, step: 0.05, label: 'Opacity' },
    sliceContours: { value: true, label: 'Show Contours' },
    sliceContourCount: { value: 10, min: 4, max: 20, step: 1, label: 'Contour Lines' },
    sliceLogScale: { value: true, label: 'Log Color Scale' },
  });
  
  // Create model
  const model = useMemo(() => {
    return createModel(caseType, { charge, separation, length, radius, width, height });
  }, [caseType, charge, separation, length, radius, width, height]);
  
  // Compute bounds
  const domainBounds = useMemo(() => ({
    min: new THREE.Vector3(-bounds, -bounds, -bounds),
    max: new THREE.Vector3(bounds, bounds, bounds),
  }), [bounds]);
  
  return (
    <div className="app">
      <Leva 
        collapsed={false}
        titleBar={{ title: '⚡ Electrostatics Lab' }}
        theme={{
          colors: {
            accent1: '#3498db',
            accent2: '#2ecc71',
            accent3: '#e74c3c',
          },
        }}
      />
      
      <div className="canvas-container">
        <Canvas>
          <color attach="background" args={['#0a0a0f']} />
          <PerspectiveCamera makeDefault position={[6, 4, 6]} />
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={20}
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          
          {/* Grid */}
          {showGrid && (
            <Grid 
              args={[bounds * 2, bounds * 2]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#1a1a2e"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#2a2a4e"
              fadeDistance={bounds * 3}
              fadeStrength={1}
              followCamera={false}
              position={[0, -0.01, 0]}
            />
          )}
          
          {/* Axes helper */}
          {showAxes && <axesHelper args={[bounds]} />}
          
          {/* Charge geometry */}
          <ChargeGeometryRenderer model={model} />
          
          {/* Vector field glyphs */}
          {showVectors && (
            <VectorFieldGlyphs
              model={model}
              bounds={domainBounds}
              density={vectorDensity}
              scale={vectorScale}
              logScale={logScale}
              clampMin={clampMin}
              clampMax={clampMax}
            />
          )}
          
          {/* Field lines */}
          {showFieldLines && (
            <FieldLines
              model={model}
              bounds={domainBounds}
              linesPerSource={fieldLineCount}
            />
          )}
          
          {/* Equipotential surfaces */}
          {showEquipotentials && (
            <EquipotentialSurfaces
              model={model}
              bounds={domainBounds}
              numLevels={equipotentialLevels}
            />
          )}
          
          {/* Camera-aligned live slice */}
          <CameraSlice
            model={model}
            enabled={showCameraSlice}
            sliceOffset={sliceOffset}
            resolution={sliceResolution}
            size={sliceSize}
            opacity={sliceOpacity}
            showContours={sliceContours}
            contourCount={sliceContourCount}
            logScale={sliceLogScale}
          />
        </Canvas>
      </div>
      
      {/* Info panel */}
      <InfoPanel
        title={CASE_LABELS[caseType]}
        description={CASE_DESCRIPTIONS[caseType]}
        formula={model.getFormula?.()}
      />
      
      {/* 2D Slice view modal */}
      {showSlice && (
        <SliceView
          model={model}
          bounds={domainBounds}
          onClose={() => setShowSlice(false)}
          logScale={logScale}
        />
      )}
    </div>
  );
}
