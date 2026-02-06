# Electrostatics Lab — Project Overview

## Executive Summary

**Electrostatics Lab** is an interactive 3D web application designed to help students visualize and understand electrostatic fields from various charge distributions. Built for Physics for Scientists and Engineers II (PSEII), this tool bridges the gap between mathematical formulas and intuitive understanding of electric fields and potentials.

---

## Project Goals

### Primary Educational Objectives

1. **Make Invisible Physics Visible**
   - Electric fields are inherently invisible — students struggle to develop intuition about their spatial structure
   - This tool renders fields in real-time 3D, allowing students to "see" what equations describe

2. **Connect Mathematical Formulas to Physical Reality**
   - Students often memorize E = kQ/r² without understanding what it *looks like*
   - The visualization shows how the 1/r² dependence manifests as field line density decreasing with distance

3. **Demonstrate the E = −∇V Relationship**
   - Field lines are always perpendicular to equipotential surfaces
   - Students can visually verify this fundamental relationship in any configuration

4. **Teach Symmetry and Superposition**
   - Shows how symmetric charge distributions lead to component cancellation
   - Demonstrates vector addition of fields from multiple sources

5. **Bridge Near-Field and Far-Field Behavior**
   - Extended objects (disks, plates) behave like infinite surfaces nearby
   - Far away, all localized distributions look like point charges

---

## Target Audience

| Audience | Use Case |
|----------|----------|
| **PSEII Students** | Self-study, homework visualization, conceptual exploration |
| **Instructors** | Classroom demonstrations, lecture supplements |
| **Teaching Assistants** | Office hours, explaining complex concepts |
| **Textbook Authors** | Generating accurate field visualizations |

---

## Core Features

### 1. 3D Vector Field Visualization
- Arrow glyphs showing electric field direction and magnitude
- Configurable density, scale, and color mapping
- Logarithmic scaling option for large dynamic ranges

### 2. Electric Field Lines
- Properly seeded from positive charge sources
- Runge-Kutta (RK4) integration with adaptive termination
- Lines end on negative charges or extend to domain boundary

### 3. Equipotential Surfaces
- 3D isosurfaces computed via marching cubes algorithm
- Multiple voltage levels displayed simultaneously
- Semi-transparent rendering to show nested structure

### 4. Camera-Aligned Slice View ✨
- **The innovation**: A 2D heat map cross-section that stays perpendicular to your view
- Rotates with the camera — always shows a "clean" slice
- Solves the problem of muddy overlapping 3D surfaces
- Includes contour lines for equipotential values

### 5. Static 2D Slice Views
- XY, XZ, YZ plane cross-sections
- Heat map coloring for field magnitude
- Contour lines overlaid for potential values
- Field line traces within the plane

### 6. Multiple Charge Configurations

#### Tier 1: Point Charges
| Configuration | Physics Concept |
|--------------|-----------------|
| Single Positive/Negative | Radial field, 1/r² dependence |
| Electric Dipole | Opposing charges, field shape |
| Two Like Charges | Null point, repulsion |
| Quadrupole | Higher multipole, faster falloff |
| Triangle | Superposition of three sources |

#### Tier 2: Extended Objects
| Configuration | Physics Concept |
|--------------|-----------------|
| Finite Rod | Line charge, axis vs off-axis behavior |
| Charged Ring | On-axis formula, symmetry cancellation |
| Charged Disk | Transition from plane to point charge |

#### Tier 3: Plates
| Configuration | Physics Concept |
|--------------|-----------------|
| Finite Plate | Edge effects, uniformity in center |
| Parallel Plates | Capacitor field, uniform E between plates |

---

## Technical Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React 18 | Component architecture, state management |
| **3D Rendering** | Three.js via React Three Fiber | WebGL-based 3D graphics |
| **Build Tool** | Vite | Fast development server, optimized builds |
| **Language** | TypeScript | Type safety, better IDE support |
| **UI Controls** | Leva | Interactive parameter panels |

### Physics Implementation

```
Field Calculation Pipeline:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Charge      │ ──▶ │ Field Model │ ──▶ │ E(x,y,z)    │
│ Configuration│    │ (discretized)│    │ V(x,y,z)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Visualization        │
              │   • Vector glyphs      │
              │   • Field lines (RK4)  │
              │   • Isosurfaces (MC)   │
              │   • Heat maps          │
              └────────────────────────┘
```

### Key Algorithms

1. **Singularity Softening**: `r → √(r² + ε²)` with ε = 0.05 prevents division by zero
2. **Field Line Integration**: 4th-order Runge-Kutta with adaptive step sizing
3. **Equipotential Surfaces**: Marching cubes algorithm on discretized V(x,y,z)
4. **Camera Slice**: Real-time plane orientation via camera quaternion extraction

### Performance Optimizations

- **GPU Instancing**: Thousands of arrow glyphs rendered efficiently
- **Lazy Computation**: Field lines/surfaces computed on-demand, not every frame
- **Configurable Resolution**: Users can trade accuracy for performance
- **Target**: ≥30 FPS on typical student laptops

---

## Pedagogical Design Principles

### 1. Progressive Complexity
Start with a single point charge → add second charge → explore extended objects → parallel plates. Each step builds on previous understanding.

### 2. Interactive Exploration
Students aren't passive observers — they can:
- Rotate the view to see 3D structure
- Adjust charge magnitudes and positions
- Toggle different visualization modes
- Explore "what if" scenarios

### 3. Multiple Representations
The same physical system can be shown as:
- Vector arrows (E direction and magnitude)
- Field lines (flux visualization)
- Equipotential surfaces (energy landscape)
- Heat maps (2D cross-section)

### 4. Instant Feedback
All changes update in real-time. No waiting, no re-running simulations.

### 5. Connection to Textbook
Configurations match standard PSEII examples:
- Electric dipole (Serway 22-24)
- Ring on axis (Gauss's law applications)
- Parallel plates (capacitor introduction)

---

## Key Learning Outcomes

After using this tool, students should be able to:

| Skill | Assessment |
|-------|------------|
| Sketch field lines for basic configurations | Draw from memory |
| Predict where E is strongest/weakest | Qualitative reasoning |
| Identify symmetry axes and planes | Geometry analysis |
| Explain why equipotentials are perpendicular to E | Conceptual understanding |
| Estimate far-field behavior | Asymptotic analysis |
| Apply superposition principle | Multiple sources |

---

## Validation

The implementation has been verified against:

1. **Analytical Formulas**
   - Point charge: E = kQ/r²
   - Ring on axis: E_x = kQx/(a² + x²)^(3/2)
   - Disk near center: E → σ/(2ε₀) as R → ∞

2. **Symmetry Properties**
   - Dipole: E_x on perpendicular bisector points toward −q
   - Ring: E perpendicular components cancel on axis

3. **Geometric Constraints**
   - Field lines start on + charges, end on − charges
   - Field lines never cross
   - Field lines perpendicular to equipotentials

---

## Future Enhancements

### Planned Features
- [ ] Magnetic field visualization (moving charges)
- [ ] Time-varying fields (AC sources)
- [ ] Export images/animations for presentations
- [ ] Mobile touch controls
- [ ] VR/AR mode for immersive exploration

### Integration Possibilities
- Embed in LMS (Canvas, Blackboard)
- Link from e-textbook
- Use in online assessments (visual questions)

---

## Relationship to PSEII Curriculum

| Chapter | Concepts | Configurations to Explore |
|---------|----------|---------------------------|
| Ch 22 | Coulomb's Law, E field | Point charges, dipole |
| Ch 23 | Gauss's Law, symmetry | Ring, disk, plates |
| Ch 24 | Electric potential | Equipotentials, V contours |
| Ch 25 | Capacitors | Parallel plates |

---

## Getting Started

### For Students
1. Download the application
2. Run `npm install` then `npm run dev`
3. Start with "Single Positive" configuration
4. Explore all visualization modes
5. Try predicting the field before enabling displays

### For Instructors
1. Use "Teacher Mode" presets for prepared demonstrations
2. Project the app during lecture
3. Assign "Exploration Exercises" using specific configurations
4. Export screenshots for exams/homework

---

## Conclusion

**Electrostatics Lab** transforms abstract electromagnetic concepts into tangible, explorable visualizations. By allowing students to interact with electric fields in real-time 3D, it develops the spatial intuition that textbook diagrams alone cannot provide.

The tool embodies the principle that *physics is best learned by doing* — not just solving equations, but seeing how those equations shape the invisible world around us.

---

*"The electric field is everywhere perpendicular to the equipotential surfaces."*  
— Michael Faraday

---

**Project Repository**: electrostatics-lab/  
**Technology**: React + Three.js + TypeScript + Vite  
**License**: MIT (Free for educational use)  
**Developed for**: Physics for Scientists and Engineers II (PSEII)
