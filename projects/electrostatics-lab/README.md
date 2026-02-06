# ⚡ Electrostatics Lab

An **interactive 3D visualization app** for exploring electrostatic fields, designed for Physics for Scientists and Engineers II (PSEII) students.

![Electrostatics Lab](docs/screenshot.png)

## 🎯 Overview

This web-based application allows students to visualize and explore electric fields from various charge distributions in real-time 3D. It supports:

- **3D vector field visualization** (arrows showing E direction and magnitude)
- **Electric field lines** (properly seeded from positive charges)
- **Equipotential surfaces** (3D isosurfaces of V)
- **Live camera-aligned slice view** ✨ NEW! (2D heat map that rotates with your view)
- **2D slice views** (XY, XZ, YZ planes with heat maps, field lines, and contours)
- **Multiple charge configurations** (point charges, rods, rings, disks, plates)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or download the repository
cd electrostatics-lab

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## 📚 Supported Charge Configurations

### Tier 1: Point Charges

| Configuration | Description |
|--------------|-------------|
| Single Positive | E ∝ 1/r², radial outward |
| Single Negative | E ∝ 1/r², radial inward |
| Electric Dipole | Two equal and opposite charges |
| Two Like Charges | Two positive charges (shows null point) |
| Quadrupole | Four alternating charges |
| Triangle | Three charges in triangular arrangement |

### Tier 2: Extended Objects

| Configuration | Description |
|--------------|-------------|
| Finite Rod | Uniformly charged line segment |
| Charged Ring | Uniformly charged circular ring |
| Charged Disk | Uniformly charged circular disk |

### Tier 3: Plates

| Configuration | Description |
|--------------|-------------|
| Finite Plate | Rectangular uniformly charged plate |
| Parallel Plates | Two plates with opposite charges (capacitor) |

## 🎮 Controls

### Configuration Panel

- **Case**: Select charge distribution type
- **Charge (Q)**: Magnitude of charge
- **Separation (d)**: Distance between charges (for multi-charge configs)
- **Length (L)**: Length of rod
- **Radius (R)**: Radius of ring/disk
- **Width/Height**: Dimensions of plates

### Visualization Panel

- **Vector Field**: Toggle 3D arrow glyphs
- **Field Lines**: Toggle electric field lines
- **Equipotentials**: Toggle 3D equipotential surfaces
- **Vector Density**: Number of arrows per axis
- **Field Lines/Source**: Number of field lines seeded per positive charge
- **Equipotential Levels**: Number of isosurface levels
- **Vector Scale**: Size of arrow glyphs
- **Log Scale |E|**: Use logarithmic scaling for magnitudes
- **Clamp Min/Max**: Set magnitude display range

### View Panel

- **Show Grid**: Toggle XZ ground plane grid
- **Show Axes**: Toggle coordinate axes
- **Domain Size**: Extent of visualization domain
- **2D Slice View**: Open interactive 2D slice modal

### Camera Slice Panel (NEW!)

The **Camera Slice** feature renders a live 2D heat map cross-section that is always perpendicular to your viewing direction. As you rotate the camera, the slice rotates with you!

- **Enable Live Slice**: Toggle the camera-aligned slice plane
- **Slice Offset**: Move the slice closer to or further from the target (0 = at origin)
- **Slice Size**: Physical size of the slice plane
- **Resolution**: Grid resolution for sampling (higher = smoother but slower)
- **Opacity**: Transparency of the heat map
- **Show Contours**: Toggle equipotential contour lines on the slice
- **Contour Lines**: Number of equipotential contour levels
- **Log Color Scale**: Use logarithmic scaling for better dynamic range

This feature solves the problem of visualizing equipotential "layers" in 3D — instead of semi-transparent surfaces that become muddy from certain angles, you get a beautiful heat map that's always facing you!

### 3D Navigation

- **Left-click + drag**: Rotate view
- **Right-click + drag**: Pan view
- **Scroll wheel**: Zoom in/out

## 🔬 Pedagogical Objectives

The app is designed to teach these key concepts:

### 1. Symmetry → Component Cancellation

Watch how symmetric charge distributions lead to certain field components canceling out. For example:
- On the axis of a ring, only the axial component survives
- On the perpendicular bisector of a rod, the parallel component cancels

### 2. E = −∇V Relationship

Field lines are always perpendicular to equipotential surfaces. Use the 2D slice view to clearly see this relationship.

### 3. Near Field vs Far Field

Compare field behavior close to and far from extended charge distributions:
- A disk looks like an infinite plane up close (E = σ/2ε₀)
- Far away, all localized distributions look like point charges (E ∝ 1/r²)

### 4. Field Line Convention

Field lines:
- Start on positive charges (sources)
- End on negative charges (sinks) or extend to infinity
- Never cross each other
- Higher density = stronger field

### 5. Superposition

Multiple charges produce fields that add vectorially. Explore complex patterns from simple building blocks.

## 🔧 Technical Details

### Physics Implementation

- **E-field calculation**: Direct summation/integration over charge elements
- **Singularity handling**: Softened distance r → √(r² + ε²) with ε = 0.05
- **Field line integration**: 4th-order Runge-Kutta (RK4) with adaptive termination
- **Equipotentials**: Marching cubes algorithm on V(x,y,z) scalar field
- **Extended objects**: Discretized into point charge elements (configurable resolution)

### Performance

- **Instanced rendering**: Vector glyphs use GPU instancing for efficiency
- **Lazy computation**: Field lines and equipotentials computed on-demand
- **Target framerate**: ≥30 FPS on typical laptops with default settings
- **Performance presets**: Adjust density controls for slower machines

### Validation

The implementation has been validated against:
1. **Dipole symmetry**: E_x on perpendicular bisector points toward −q
2. **Far-field scaling**: E ∝ 1/r² far from localized distributions
3. **On-axis formulas**: Ring E_x = kQx/(a² + x²)^(3/2) verified numerically
4. **Perpendicularity**: Field lines cross equipotentials at 90°

## 📁 Project Structure

```
electrostatics-lab/
├── src/
│   ├── components/          # React visualization components
│   │   ├── VectorFieldGlyphs.tsx
│   │   ├── FieldLines.tsx
│   │   ├── EquipotentialSurfaces.tsx
│   │   ├── ChargeGeometryRenderer.tsx
│   │   ├── CameraSlice.tsx      # NEW: Live camera-aligned heat map
│   │   ├── SliceView.tsx
│   │   └── InfoPanel.tsx
│   ├── models/              # Physics field models
│   │   ├── types.ts         # Interfaces and constants
│   │   ├── PointCharge.ts
│   │   ├── FiniteRod.ts
│   │   ├── ChargedRing.ts
│   │   ├── ChargedDisk.ts
│   │   └── FinitePlate.ts
│   ├── utils/               # Numerical utilities
│   │   ├── FieldLineIntegrator.ts
│   │   └── MarchingCubes.ts
│   ├── presets/             # Teacher mode presets
│   │   └── teacher-presets.json
│   ├── App.tsx              # Main application
│   ├── App.css              # Styles
│   └── main.tsx             # Entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🔌 Adding New Charge Distributions

To add a new charge distribution:

1. Create a new file in `src/models/` implementing the `FieldModel` interface:

```typescript
import * as THREE from 'three';
import { FieldModel, ChargeGeometry } from './types';

export class MyNewModel implements FieldModel {
  name = 'My New Distribution';
  description = 'Description for the info panel';
  
  E(pos: THREE.Vector3): THREE.Vector3 {
    // Return electric field vector at position
  }
  
  V(pos: THREE.Vector3): number {
    // Return electric potential at position
  }
  
  getSourcePositions(): { position: THREE.Vector3; charge: number }[] {
    // Return positive charge positions for field line seeding
  }
  
  getGeometry(): ChargeGeometry[] {
    // Return geometry data for rendering
  }
  
  getFormula(): string {
    // Return LaTeX formula string (optional)
  }
}
```

2. Add factory function and export in `src/models/index.ts`

3. Add case to `App.tsx`:
   - Add to `CaseType` union
   - Add label to `CASE_LABELS`
   - Add description to `CASE_DESCRIPTIONS`
   - Add case to `createModel()` switch statement

## 🎓 Teacher Mode Presets

The `src/presets/teacher-presets.json` file contains pre-configured scenarios with pedagogical notes. Instructors can:

- Load specific configurations for classroom demonstrations
- Export current settings as JSON
- Add "What to Notice" annotations for students

## 📖 References

- Serway & Jewett, *Physics for Scientists and Engineers*, Chapters 22-24
- Griffiths, *Introduction to Electrodynamics*
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)

## 📄 License

MIT License - Free for educational use.

## 🙏 Acknowledgments

Developed for PSEII course materials at [Your Institution].

---

**Questions?** Open an issue or contact the course instructor.

*"The electric field is everywhere perpendicular to the equipotential surfaces."* — Michael Faraday
