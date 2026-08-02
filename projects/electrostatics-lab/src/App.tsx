import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';

import { VectorFieldGlyphs } from './components/VectorFieldGlyphs';
import { FieldLines } from './components/FieldLines';
import { EquipotentialSurfaces } from './components/EquipotentialSurfaces';
import { ChargeGeometryRenderer } from './components/ChargeGeometryRenderer';
import { SliceView } from './components/SliceView';
import { CameraSlice } from './components/CameraSlice';
import { InfoPanel } from './components/InfoPanel';
import { ControlPanel, type Controls, type Section } from './components/ControlPanel';
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
    case 'single_positive': return createSingleCharge(Math.abs(charge));
    case 'single_negative': return createSingleCharge(-Math.abs(charge));
    case 'dipole': return createDipole(separation, Math.abs(charge));
    case 'like_charges': return createLikeCharges(separation, Math.abs(charge));
    case 'quadrupole': return createQuadrupole(separation, Math.abs(charge));
    case 'triangle': return createTriangle(separation, Math.abs(charge));
    case 'finite_rod': return createFiniteRod(length, charge, 'y');
    case 'ring': return createChargedRing(radius, charge, 'x');
    case 'disk': return createChargedDisk(radius, charge, 'x');
    case 'finite_plate': return createFinitePlate(width, height, charge);
    case 'parallel_plates': return createParallelPlates(width, height, separation, Math.abs(charge));
    default: return createSingleCharge(1);
  }
}

const CASE_OPTIONS: Record<string, string> = Object.fromEntries(
  (Object.entries(CASE_LABELS) as [CaseType, string][]).map(([k, v]) => [k, v])
);

const DEFAULTS: Controls = {
  caseType: 'dipole',
  charge: 1, separation: 2, length: 2, radius: 1, width: 2.5, height: 2.5,
  showVectors: true, showFieldLines: true, showEquipotentials: true,
  vectorDensity: 8, radialDensity: 6, azimuthalDensity: 2, equipotentialLevels: 5,
  vectorScale: 0.3, logScale: false, clampMin: 0.01, clampMax: 5,
  showGrid: true, showAxes: true, bounds: 4,
  showCameraSlice: false, sliceOffset: 0, sliceSize: 8, sliceResolution: 80,
  sliceOpacity: 0.85, sliceContours: true, sliceContourCount: 10, sliceLogScale: true,
};

export default function App() {
  const [showSlice, setShowSlice] = useState(false);
  const [c, setC] = useState<Controls>(DEFAULTS);
  const set = (k: string, v: number | boolean | string) => setC(prev => ({ ...prev, [k]: v }));

  // Typed views into the control state
  const caseType = c.caseType as CaseType;
  const charge = c.charge as number, separation = c.separation as number, length = c.length as number,
    radius = c.radius as number, width = c.width as number, height = c.height as number, bounds = c.bounds as number;

  const sections: Section[] = useMemo(() => [
    { title: 'Configuration', fields: [
      { key: 'caseType', type: 'select', label: 'Case', options: CASE_OPTIONS },
      { key: 'charge', type: 'slider', label: 'Charge (Q)', min: 0.1, max: 3, step: 0.1 },
      { key: 'separation', type: 'slider', label: 'Separation (d)', min: 0.5, max: 4, step: 0.1 },
      { key: 'length', type: 'slider', label: 'Length (L)', min: 0.5, max: 4, step: 0.1 },
      { key: 'radius', type: 'slider', label: 'Radius (R)', min: 0.3, max: 3, step: 0.1 },
      { key: 'width', type: 'slider', label: 'Width', min: 1, max: 4, step: 0.1 },
      { key: 'height', type: 'slider', label: 'Height', min: 1, max: 4, step: 0.1 },
    ] },
    { title: 'Visualization', fields: [
      { key: 'showVectors', type: 'toggle', label: 'Vector Field' },
      { key: 'showFieldLines', type: 'toggle', label: 'Field Lines' },
      { key: 'showEquipotentials', type: 'toggle', label: 'Equipotentials' },
      { key: 'vectorDensity', type: 'slider', label: 'Vector Density', min: 4, max: 15, step: 1 },
      { key: 'radialDensity', type: 'slider', label: 'Radial Field Line Density', min: 1, max: 16, step: 1 },
      { key: 'azimuthalDensity', type: 'slider', label: 'Azimuthal Density', min: 0, max: 8, step: 1 },
      { key: 'equipotentialLevels', type: 'slider', label: 'Equipotential Levels', min: 1, max: 10, step: 1 },
      { key: 'vectorScale', type: 'slider', label: 'Vector Scale', min: 0.1, max: 1, step: 0.05 },
      { key: 'logScale', type: 'toggle', label: 'Log Scale |E|' },
      { key: 'clampMin', type: 'slider', label: 'Clamp Min', min: 0.001, max: 0.5, step: 0.01 },
      { key: 'clampMax', type: 'slider', label: 'Clamp Max', min: 1, max: 20, step: 0.5 },
    ] },
    { title: 'View', fields: [
      { key: 'showGrid', type: 'toggle', label: 'Show Grid' },
      { key: 'showAxes', type: 'toggle', label: 'Show Axes' },
      { key: 'bounds', type: 'slider', label: 'Domain Size', min: 2, max: 8, step: 0.5 },
      { key: '__slice', type: 'button', label: '2D Slice View', onClick: () => setShowSlice(s => !s) },
    ] },
    { title: 'Camera Slice', fields: [
      { key: 'showCameraSlice', type: 'toggle', label: 'Enable Live Slice' },
      { key: 'sliceOffset', type: 'slider', label: 'Slice Offset', min: -5, max: 5, step: 0.1 },
      { key: 'sliceSize', type: 'slider', label: 'Slice Size', min: 4, max: 15, step: 0.5 },
      { key: 'sliceResolution', type: 'slider', label: 'Resolution', min: 40, max: 150, step: 10 },
      { key: 'sliceOpacity', type: 'slider', label: 'Opacity', min: 0.3, max: 1, step: 0.05 },
      { key: 'sliceContours', type: 'toggle', label: 'Show Contours' },
      { key: 'sliceContourCount', type: 'slider', label: 'Contour Lines', min: 4, max: 20, step: 1 },
      { key: 'sliceLogScale', type: 'toggle', label: 'Log Color Scale' },
    ] },
  ], []);

  const model = useMemo(
    () => createModel(caseType, { charge, separation, length, radius, width, height }),
    [caseType, charge, separation, length, radius, width, height]
  );

  const domainBounds = useMemo(() => ({
    min: new THREE.Vector3(-bounds, -bounds, -bounds),
    max: new THREE.Vector3(bounds, bounds, bounds),
  }), [bounds]);

  return (
    <div className="app">
      {/* Three-tier canon title (tracks the active case) */}
      <div className="es-title">
        <div className="es-title__name">Electrostatics Lab</div>
        <div className="es-title__mode">{CASE_LABELS[caseType]}</div>
        <div className="es-title__scope">PSE-II &middot; Electric Fields &amp; Potential</div>
      </div>

      {/* Right rail: control panel (scrolls internally) + info frame below it */}
      <div className="es-rail">
        <ControlPanel controls={c} set={set} sections={sections} />
        <InfoPanel
          description={CASE_DESCRIPTIONS[caseType]}
          formula={model.getFormula?.()}
        />
      </div>

      <div className="canvas-container">
        <Canvas>
          <color attach="background" args={['#0a0a0f']} />
          <PerspectiveCamera makeDefault position={[6, 4, 6]} />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={20} />

          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />

          {(c.showGrid as boolean) && (
            <Grid
              args={[bounds * 2, bounds * 2]}
              cellSize={0.5} cellThickness={0.5} cellColor="#1a1a2e"
              sectionSize={2} sectionThickness={1} sectionColor="#2a2a4e"
              fadeDistance={bounds * 3} fadeStrength={1} followCamera={false}
              position={[0, -0.01, 0]}
            />
          )}

          {(c.showAxes as boolean) && <axesHelper args={[bounds]} />}

          <ChargeGeometryRenderer model={model} />

          {(c.showVectors as boolean) && (
            <VectorFieldGlyphs
              model={model} bounds={domainBounds}
              density={c.vectorDensity as number}
              scale={c.vectorScale as number}
              logScale={c.logScale as boolean}
              clampMin={c.clampMin as number}
              clampMax={c.clampMax as number}
            />
          )}

          {(c.showFieldLines as boolean) && (
            <FieldLines
              model={model} bounds={domainBounds}
              radialDensity={c.radialDensity as number}
              azimuthalDensity={c.azimuthalDensity as number}
            />
          )}

          {(c.showEquipotentials as boolean) && (
            <EquipotentialSurfaces
              model={model} bounds={domainBounds}
              numLevels={c.equipotentialLevels as number}
            />
          )}

          <CameraSlice
            model={model}
            enabled={c.showCameraSlice as boolean}
            sliceOffset={c.sliceOffset as number}
            resolution={c.sliceResolution as number}
            size={c.sliceSize as number}
            opacity={c.sliceOpacity as number}
            showContours={c.sliceContours as boolean}
            contourCount={c.sliceContourCount as number}
            logScale={c.sliceLogScale as boolean}
          />
        </Canvas>
      </div>

      {showSlice && (
        <SliceView
          model={model} bounds={domainBounds}
          onClose={() => setShowSlice(false)}
          logScale={c.logScale as boolean}
        />
      )}
    </div>
  );
}
