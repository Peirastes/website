# Electrostatics Lab - Comprehensive Testing Checklist

**Purpose:** Validate all 11 charge configurations operate correctly before Phase 1 enhancements.

**Scope:** Physics accuracy, visualization modes, interactivity, performance, cross-browser compatibility.

**Last Updated:** January 29, 2026

---

## Quick Reference: All 11 Cases

| # | Configuration | Category | Key Physics | Status |
|----|--------------|----------|------------|--------|
| 1 | Single Positive Charge | Point Charges | E ∝ 1/r², radial | [ ] |
| 2 | Single Negative Charge | Point Charges | E ∝ 1/r², inward | [ ] |
| 3 | Electric Dipole | Point Charges | Field line curvature, E ∝ 1/r³ | [ ] |
| 4 | Two Like Charges | Point Charges | Null point, repulsion | [ ] |
| 5 | Quadrupole | Point Charges | Four charges, E ∝ 1/r⁴ | [ ] |
| 6 | Triangle | Point Charges | Three-body superposition | [ ] |
| 7 | Finite Rod | Extended Objects | Perpendicular bisector symmetry | [ ] |
| 8 | Charged Ring | Extended Objects | On-axis behavior, E=0 at center | [ ] |
| 9 | Charged Disk | Extended Objects | Near/far field transition | [ ] |
| 10 | Finite Plate | Plates | Edge effects, central uniformity | [ ] |
| 11 | Parallel Plates | Plates | Uniform field, capacitor behavior | [ ] |

---

## Testing Environment Setup

### Hardware Requirements
- **Primary:** Desktop/laptop with integrated GPU (Intel/AMD graphics acceptable)
- **Mobile:** iPad Air 2 or newer, or Android tablet (Android 10+)
- **Browser:** Chrome 120+, Firefox 120+, Safari 17+, Edge 120+

### Software Requirements
```bash
cd electrostatics-lab
npm install
npm run dev
# Opens http://localhost:5173
```

### Performance Baseline
Record baseline metrics for comparison:
- Target FPS: ≥30 FPS (desktop default settings)
- Mobile target: ≥20 FPS (with adaptive rendering)
- Load time: <3 seconds to interactive state

---

## Section A: Universal Checks (All 11 Cases)

These checks apply to every configuration. Use this as a template for systematic testing.

### A.1 UI Controls & Parameter Adjustment

- [ ] **Configuration selector** works and displays all 11 cases
- [ ] **Case selection** loads correct initial parameters for each case
- [ ] **Case description** displays accurate physics explanation in info panel
- [ ] **Parameter sliders** respond smoothly to user input (no lag/stutter)
  - [ ] Charge magnitude adjustment
  - [ ] Separation/distance adjustment (for multi-charge configs)
  - [ ] Length adjustment (for rod)
  - [ ] Radius adjustment (for ring/disk)
  - [ ] Width/height adjustment (for plates)
- [ ] **Parameter value display** shows numerical values correctly
- [ ] **Min/max parameter limits** prevent unphysical values (e.g., negative radius)
- [ ] **Reset button** restores default parameters for current configuration

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.2 Vector Field Visualization (3D Arrows)

- [ ] **Vector field renders** with appropriate density (default ~8 vectors per axis)
- [ ] **Arrow directions** point along field direction (outward for +q, inward for -q)
- [ ] **Arrow magnitudes** show color-coded strength (blue=weak, red=strong)
- [ ] **Vector density slider** adjusts number of arrows (8→14) smoothly
  - [ ] Lower density (5): Still visible, sparse
  - [ ] Higher density (12): Dense but readable
- [ ] **Vector scale slider** adjusts arrow size without distorting proportions
- [ ] **Log scale toggle** compresses dynamic range for large magnitude variations
- [ ] **Clamp min/max** allows manual range adjustment for better contrast
- [ ] **Toggle on/off** removes all vectors cleanly when disabled
- [ ] **No visual artifacts** (overlapping, clipping, weird colors)

**Specific Test:**
For each case, enable vector field and verify:
- Vectors never point inward at positive charges (should point outward)
- Vectors never point outward at negative charges (should point inward)
- No vectors appear inside charge objects

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.3 Electric Field Lines Visualization

- [ ] **Field lines render** with appropriate count (default ~12 per positive charge)
- [ ] **Field line seeding** originates from positive charges only
  - [ ] Single Positive: 1 field line origin (or configurable count)
  - [ ] Dipole: 2 field line origins (one per +q)
  - [ ] Multiple sources: Field lines per positive charge
- [ ] **Field line termination:**
  - [ ] Lines end on negative charges (if present)
  - [ ] Lines extend to domain boundary (if no negative charge)
  - [ ] No lines terminate in empty space
- [ ] **Field line paths** follow physics:
  - [ ] Never cross each other
  - [ ] Perpendicular to equipotential surfaces (checked in 2D slices)
  - [ ] Correct directional curvature in multi-charge configs
- [ ] **Field lines per source slider** adjusts count (2→20) smoothly
- [ ] **Toggle on/off** removes all field lines cleanly
- [ ] **Line colors** differentiate from vectors/surfaces for clarity
- [ ] **No visual artifacts** (broken lines, discontinuities, weird curves)

**Specific Test Cases:**
- Dipole: Lines curve from + to - (check curvature is smooth)
- Two Like Charges: Lines repel from each other (no lines between charges)
- Ring on axis: Lines are symmetric and perpendicular to axis in symmetric regions
- Parallel plates: Lines are parallel between plates, spread outside

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.4 Equipotential Surfaces Visualization (3D Isosurfaces)

- [ ] **Equipotential surfaces render** with appropriate level count (default ~6 levels)
- [ ] **Surface appearance:**
  - [ ] Semi-transparent (can see through to background)
  - [ ] Smooth without visible discretization artifacts
  - [ ] Appropriate color gradient (blue→green→yellow→red)
- [ ] **Surface topology:**
  - [ ] Single Positive: Concentric spheres around charge
  - [ ] Dipole: Surfaces bulge toward/away from charges (asymmetric)
  - [ ] Ring: Surfaces elongated along axis
- [ ] **Equipotential levels slider** adjusts count (3→15) smoothly
  - [ ] Fewer levels: Simpler geometry, faster render
  - [ ] More levels: More detail, may show performance cost
- [ ] **Opacity/transparency slider** controls surface visibility
  - [ ] Low opacity: Faint, can see through clearly
  - [ ] High opacity: Solid looking, still semi-transparent
- [ ] **Toggle on/off** removes all surfaces cleanly
- [ ] **No visual artifacts** (overlapping surfaces causing confusion, missing levels)

**Specific Test:**
For each case, verify equipotentials are "nested" — moving outward, potential magnitude decreases smoothly.

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.5 2D Slice Views

- [ ] **"2D Slice View" button** opens modal dialog
- [ ] **Slice plane selection** works (XY, XZ, YZ planes)
- [ ] **Heat map** displays field magnitude with color gradient
- [ ] **Contour lines** overlay equipotential values on heat map
- [ ] **Contour labels** show potential values numerically
- [ ] **Field line traces** appear as lines within the 2D slice
  - [ ] Lines follow field direction (left/right/up/down in slice)
  - [ ] Lines perpendicular to contours (±90° within numerical tolerance)
- [ ] **Slice resolution slider** adjusts sampling density
  - [ ] Low: Fast, may show pixelation
  - [ ] High: Smooth, may be slower
- [ ] **Modal close button** dismisses dialog without errors
- [ ] **Zoom/pan** works within 2D slice view (if implemented)

**Specific Test:**
Select each plane (XY, XZ, YZ) for a dipole:
- Perpendicular bisector plane: E_x changes sign across center
- Field lines should be perpendicular to contours everywhere

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.6 Camera-Aligned Slice (NEW Feature)

- [ ] **"Enable Live Slice" toggle** activates the feature
- [ ] **Slice plane** renders and rotates with camera movement
  - [ ] As you rotate the view, slice rotates to stay perpendicular
  - [ ] Slice is always facing toward the camera
- [ ] **Slice offset slider** moves slice away from origin
  - [ ] Negative values: Behind center
  - [ ] Zero: At origin
  - [ ] Positive values: In front of center
- [ ] **Slice size slider** changes physical dimensions of slice plane
- [ ] **Resolution slider** controls sampling density of heat map
- [ ] **Opacity slider** controls transparency of heat map
- [ ] **Contour lines toggle** shows/hides equipotential contours
- [ ] **Contour count slider** adjusts number of contours displayed
- [ ] **Log color scale toggle** compresses color range for better visibility
- [ ] **Slice updates in real-time** as you adjust parameters
- [ ] **No visual artifacts** (flickering, tearing, color banding)

**Specific Test:**
1. Enable camera slice for Single Positive charge
2. Rotate camera 360° — slice should rotate smoothly with you
3. Adjust slice offset while rotating — should follow movement correctly
4. Verify heat map accurately represents field magnitude at that plane

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.7 3D Camera Controls

- [ ] **Left-click + drag** rotates view smoothly
  - [ ] Rotation responsive (no lag)
  - [ ] 360° rotation works without gimbal lock
- [ ] **Right-click + drag** (or Ctrl+drag on Mac) pans view
  - [ ] Pan moves all objects, not just camera zoom
- [ ] **Scroll wheel** zooms in/out
  - [ ] Smooth zooming
  - [ ] Minimum zoom doesn't clip into geometry
  - [ ] Maximum zoom doesn't zoom infinitely far away
- [ ] **Double-click** resets view to default
- [ ] **Middle-click** or orbit controls work correctly
- [ ] **No camera "flipping"** or unexpected rotations

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.8 Performance & Responsiveness

**Desktop (Chrome, integrated Intel GPU, ~5-year-old laptop):**

- [ ] **Default settings (vector density 8, field lines 12, equipotential levels 6):**
  - [ ] FPS: ≥30 (record actual number: _____ FPS)
  - [ ] Smooth interaction (no frame drops during rotation)
- [ ] **High quality settings (vector density 12, field lines 20, equipotential levels 10):**
  - [ ] FPS: ≥20 (acceptable degradation)
  - [ ] Still interactive without noticeable lag
- [ ] **Low performance mode (vector density 5, field lines 8, no equipotentials):**
  - [ ] FPS: ≥50 (should be very fast)
- [ ] **Parameter adjustment** doesn't cause frame drops (sliders remain smooth)
- [ ] **Configuration switching** transitions smoothly (<1 second load time)
- [ ] **No memory leaks** during extended use (5+ minute session, monitor task manager)

**Mobile (iPad or Android Tablet):**

- [ ] **Default settings load** without crash
- [ ] **FPS:** ≥20 (record actual number: _____ FPS)
- [ ] **Touch rotation** is responsive (no lag)
- [ ] **Touch zoom** (pinch) works smoothly
- [ ] **UI is readable** on tablet screen (controls not too small)
- [ ] **No crashes** after 2-3 minute session

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.9 Grid & Axes Display

- [ ] **"Show Grid" toggle** displays/hides ground plane grid
  - [ ] Grid is visible but not distracting
  - [ ] Grid doesn't obscure field visualizations
- [ ] **"Show Axes" toggle** displays/hides coordinate axes
  - [ ] X-axis: Red
  - [ ] Y-axis: Green
  - [ ] Z-axis: Blue
  - [ ] Axes labeled or clear from colors
- [ ] **Domain size slider** adjusts visualization boundary
  - [ ] Smaller domain: Zooms in on charge region
  - [ ] Larger domain: Shows far-field behavior
  - [ ] Adjustments are smooth and proportional

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

### A.10 Info Panel & Documentation

- [ ] **Configuration description** displays for each case
  - [ ] Description is accurate physics explanation
  - [ ] Text is readable (good contrast, appropriate font size)
- [ ] **Formula display** (if implemented) shows analytical expression
- [ ] **Physics principles** explained in info panel
- [ ] **Controls are self-explanatory** or have tooltips
- [ ] **No typos** in text descriptions

**Notes/Issues Found:**
```
[Space for tester notes]
```

---

## Section B: Physics-Specific Validation Tests

Use VALIDATION.md as reference. These tests verify mathematical accuracy.

### B.1 Single Positive Charge

**Expected Behavior:**
- E ∝ 1/r² radially outward
- V ∝ 1/r, spherically symmetric
- Field lines radiating uniformly in all directions

**Validation Steps:**

1. [ ] **Visual inspection:** Field lines point uniformly outward from charge
2. [ ] **Equipotential spheres:** Surfaces are concentric spheres centered on charge
3. [ ] **Symmetry check:** Rotating view, field appears identical from all angles
4. [ ] **Far-field behavior:** Vectors far from charge are smaller than near-field vectors
5. [ ] **2D slice verification:** In any plane through charge, field points radially outward
6. [ ] **Parameter variation:**
   - [ ] Increase charge Q: Arrows grow larger, equipotentials remain concentric
   - [ ] Magnitude change should be proportional (double Q → double E)

**Measurement (if probe tool available in Phase 2):**
- At r=1: Record E magnitude
- At r=2: Record E magnitude, verify E(r=2) ≈ E(r=1)/4

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.2 Single Negative Charge

**Expected Behavior:**
- E ∝ 1/r² radially *inward*
- Identical field strength to positive charge (just opposite direction)
- Field lines pointing toward charge

**Validation Steps:**

1. [ ] **Field line direction:** All field lines point *toward* charge (not away)
2. [ ] **Vector directions:** All arrows point toward charge center
3. [ ] **Equipotential structure:** Same concentric spheres as positive charge
4. [ ] **Symmetry:** Identical to positive charge except field direction reversed
5. [ ] **Comparison test:** Side-by-side visual comparison with Single Positive
   - [ ] Same field magnitude at same distance
   - [ ] Opposite field direction

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.3 Electric Dipole

**Expected Behavior:**
- Two equal, opposite charges at ±d/2
- Field lines curve from + to -
- On perpendicular bisector: E points toward −q
- On axis (far from dipole): E ∝ 1/r³
- Dipole moment: p = qd pointing from − to +

**Validation Steps:**

1. [ ] **Field line topology:** Lines curve from positive to negative charge
   - [ ] No field lines between charges
   - [ ] Lines symmetric about perpendicular bisector
2. [ ] **Perpendicular bisector check:**
   - [ ] Select XY slice through dipole center
   - [ ] On y-axis (perpendicular to dipole): E points toward −q charge
   - [ ] E_x component points in −x direction on positive side
3. [ ] **On-axis behavior:** Along the dipole axis, field points along axis
4. [ ] **Equipotential surfaces:** Asymmetric, bulging toward +q and −q
5. [ ] **Null point check:** At origin (between charges), E should be very small
   - [ ] No visible field line at center
   - [ ] Vector field shows minimal arrows at center
6. [ ] **Parameter variation:**
   - [ ] Increase separation d: Null point moves along axis
   - [ ] Increase Q: Field magnitudes increase proportionally

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.4 Two Like Charges

**Expected Behavior:**
- Two positive charges at ±d/2
- Null point (E = 0) at origin
- Field lines repel from each other
- No field lines connect the two positive charges

**Validation Steps:**

1. [ ] **Null point at origin:**
   - [ ] View 2D slice through both charges
   - [ ] At center point, no visible field vector
   - [ ] Field lines do not pass through center
2. [ ] **Field line repulsion:**
   - [ ] Lines from left charge curve upward/downward
   - [ ] Lines from right charge curve upward/downward
   - [ ] No lines cross between the charges
3. [ ] **Symmetry:** Field pattern symmetric about perpendicular bisector
4. [ ] **Far-field:** Far from both charges, field resembles quadrupole
5. [ ] **Parameter variation:**
   - [ ] Decrease separation: Null point remains at center
   - [ ] Increase Q: Field magnitudes increase, null point stays at center

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.5 Quadrupole

**Expected Behavior:**
- Four charges: +q, −q, +q, −q in square arrangement
- E ∝ 1/r⁴ at large distances (faster falloff than dipole)
- High degree of symmetry

**Validation Steps:**

1. [ ] **Charge arrangement:** Four charges visible, alternating signs
2. [ ] **Field line topology:** Lines connect + to − charges
   - [ ] Complex pattern with multiple loops
3. [ ] **Symmetry check:** 4-fold rotational symmetry about center
   - [ ] Rotating 90°, pattern looks identical
4. [ ] **Null points:** Multiple null points (at center and possibly others)
5. [ ] **Far-field falloff:** Compare vector magnitudes far from origin to near-field
   - [ ] Should fall off faster than dipole (1/r⁴ vs 1/r³)

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.6 Triangle Configuration

**Expected Behavior:**
- Three charges arranged in triangle
- Superposition of three-charge system
- May have null points depending on charge signs

**Validation Steps:**

1. [ ] **Charge positions:** Three charges visible at triangle vertices
2. [ ] **Field line topology:** Lines connect + to − charges appropriately
3. [ ] **Superposition principle:** Pattern shows vector addition of three-charge contributions
4. [ ] **Symmetry (if applicable):** Check if triangle is equilateral
   - [ ] If equilateral: 3-fold rotational symmetry
5. [ ] **Parameter variation:** Changing separation or charge adjusts all three charges

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.7 Finite Rod (Line Charge)

**Expected Behavior:**
- Uniformly charged line segment of length L
- On perpendicular bisector: E_parallel = 0 (symmetry), only E_perpendicular
- At rod center: E = 0 on axis
- Far-field (r >> L): Behaves like point charge

**Validation Steps:**

1. [ ] **Rod geometry:** Visible line segment with finite length
2. [ ] **Field line pattern:**
   - [ ] Lines perpendicular to perpendicular bisector plane
   - [ ] No field lines along rod axis at center (by symmetry)
   - [ ] Lines extend from rod ends
3. [ ] **2D slice through rod center (perpendicular bisector):**
   - [ ] E points radially away from rod axis
   - [ ] E_parallel (along rod) = 0 everywhere on bisector plane
4. [ ] **2D slice along rod axis:**
   - [ ] E points along axis on axis (along rod direction)
   - [ ] E perpendicular = 0 on axis
5. [ ] **Parameter variation:**
   - [ ] Length slider changes rod length, field pattern adjusts
   - [ ] Longer rod: Field extends further along axis
   - [ ] Shorter rod: Field becomes more localized

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.8 Charged Ring

**Expected Behavior:**
- Uniformly charged ring of radius R in plane perpendicular to axis
- On-axis field: E_axis = kQx/(R² + x²)^(3/2)
- At ring center (x=0): E = 0
- At x = R/√2: E_axis is maximum
- Off-axis perpendicular components cancel by symmetry

**Validation Steps:**

1. [ ] **Ring geometry:** Visible circular ring with specified radius
2. [ ] **Field line topology:**
   - [ ] All lines perpendicular to ring plane
   - [ ] Lines point along axis, from ring center outward both directions
3. [ ] **At ring center (on axis, x=0):**
   - [ ] No field vectors visible at center
   - [ ] Equipotentials are most densely packed at center
4. [ ] **On-axis symmetry:**
   - [ ] Equal magnitude field on both sides of ring
   - [ ] Directions opposite (pointing outward from ring on both sides)
5. [ ] **2D slice through ring center (perpendicular to axis):**
   - [ ] Perpendicular components of field cancel (by radial symmetry)
   - [ ] Show nearly zero field in this plane
6. [ ] **Parameter variation:**
   - [ ] Radius slider: Larger ring → field pattern extends further
   - [ ] Charge slider: Magnitude increases with charge

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.9 Charged Disk

**Expected Behavior:**
- Uniformly charged circular disk of radius R
- Near-field (x << R): E ≈ σ/(2ε₀) = constant
- Far-field (x >> R): E ≈ kQ/x² (point charge behavior)
- Continuous transition between near and far field

**Validation Steps:**

1. [ ] **Disk geometry:** Visible circular disk with specified radius
2. [ ] **Field line pattern:** Lines perpendicular to disk, radiating outward from faces
3. [ ] **Near-field region (close to disk surface):**
   - [ ] Field magnitude appears approximately constant
   - [ ] Equipotential surfaces roughly parallel to disk
4. [ ] **Far-field region (far from disk):**
   - [ ] Field pattern resembles point charge
   - [ ] Equipotential surfaces appear spherical
   - [ ] Vectors decrease in magnitude with distance
5. [ ] **At disk center (on axis, x=0):**
   - [ ] Non-zero field (unlike ring)
   - [ ] Maximum field strength
6. [ ] **2D slice perpendicular to disk (through center):**
   - [ ] Axial symmetry visible
   - [ ] Field pointing perpendicular to disk
7. [ ] **Parameter variation:**
   - [ ] Radius slider: Larger disk → near-field region extends further
   - [ ] Charge slider: Proportional field increase

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.10 Finite Rectangular Plate

**Expected Behavior:**
- Uniformly charged rectangular plate with width W and height H
- Near center: E ≈ σ/(2ε₀) = constant
- Near edges: Edge effects visible
- Far-field (r >> plate size): Behaves like point charge

**Validation Steps:**

1. [ ] **Plate geometry:** Visible rectangular plate with specified dimensions
2. [ ] **Field uniformity in center:**
   - [ ] Take 2D slice through plate center (perpendicular to plate)
   - [ ] Field magnitude approximately constant in central region
3. [ ] **Edge effects:**
   - [ ] Field lines curve outward at plate edges
   - [ ] Field magnitude decreases approaching edges
4. [ ] **Far-field behavior:**
   - [ ] Far from plate, field pattern resembles point charge
   - [ ] Equipotentials appear spherical at distance >> plate size
5. [ ] **Parameter variation:**
   - [ ] Width and height sliders: Larger plate → larger uniform field region
   - [ ] Charge slider: Proportional field increase

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

### B.11 Parallel Plates (Capacitor)

**Expected Behavior:**
- Two parallel rectangular plates with opposite charges (±Q) separated by distance d
- Between plates (away from edges): E ≈ σ/ε₀ = uniform
- Outside plates: E ≈ 0 (fields cancel)
- Uniform equipotentials parallel to plates between plates

**Validation Steps:**

1. [ ] **Plate geometry:** Two parallel plates with specified separation visible
2. [ ] **Field between plates:**
   - [ ] Take 2D slice between plates (perpendicular to plates)
   - [ ] Field uniform and pointing from + to − plate
   - [ ] Equipotential contours are straight lines parallel to plates
3. [ ] **Field outside plates:**
   - [ ] Select 2D slice outside plates
   - [ ] Field magnitude much weaker than between plates
   - [ ] Field nearly zero far from both plates
4. [ ] **Symmetry:**
   - [ ] Equal and opposite charges on plates
   - [ ] Field pattern symmetric about midpoint
5. [ ] **Edge effects:**
   - [ ] Near plate edges, field lines curve outward
   - [ ] Field spreading visible at plate boundaries
6. [ ] **Parameter variation:**
   - [ ] Separation slider: Smaller gap → stronger interior field
   - [ ] Plate dimensions: Larger plates → more uniform interior field
   - [ ] Charge slider: Proportional field increase

**Specific Measurement (conceptual):**
- Interior field: E ≈ σ/ε₀
- Exterior field: E ≈ 0

**Status:** [ ] Pass / [ ] Fail / [ ] Needs Investigation

**Notes:**
```
[Space for detailed notes]
```

---

## Section C: Cross-Browser Compatibility

Test on each browser with default settings:

| Browser | Version | Desktop | Mobile | Notes |
|---------|---------|---------|--------|-------|
| Chrome | 120+ | [ ] | [ ] | |
| Firefox | 120+ | [ ] | [ ] | |
| Safari | 17+ | [ ] | [ ] | |
| Edge | 120+ | [ ] | [ ] | |

**Test Procedure:**
For each browser, verify:
1. [ ] Application loads without errors (check console)
2. [ ] All 11 cases available and selectable
3. [ ] Vector field renders correctly
4. [ ] Field lines render correctly
5. [ ] Equipotentials render correctly
6. [ ] Camera controls responsive
7. [ ] FPS meets target
8. [ ] No visual artifacts or color anomalies

**Known Issues by Browser:**
```
[Record any browser-specific issues here]
```

---

## Section D: Regression Testing Checklist

After any code changes, run these quick tests to ensure nothing broke:

### D.1 Quick Smoke Test (5 minutes)

- [ ] Application loads to start page
- [ ] Configuration selector works
- [ ] Can cycle through all 11 cases
- [ ] Vector field renders
- [ ] Field lines render
- [ ] Equipotentials render
- [ ] Camera rotation works
- [ ] Parameter sliders work
- [ ] No console errors

### D.2 Physics Spot Check (10 minutes)

- [ ] Single Positive: Field points outward ✓
- [ ] Single Negative: Field points inward ✓
- [ ] Dipole: Lines curve from + to − ✓
- [ ] Two Like Charges: Null point visible at center ✓
- [ ] Ring: No field at ring center on axis ✓
- [ ] Parallel Plates: Uniform field between, zero outside ✓

### D.3 Performance Check (5 minutes)

- [ ] Default settings: ≥30 FPS
- [ ] High settings: ≥20 FPS
- [ ] No obvious frame drops during camera rotation

---

## Section E: Testing Results Summary

### Overall Status: _____ / 11 Cases Verified

**Completion Checklist:**

| Case | A.1 UI | A.2 Vec | A.3 Lines | A.4 Equip | A.5 Slice | A.6 CamSlice | Physics | Status |
|------|--------|--------|-----------|-----------|-----------|--------------|---------|--------|
| 1. Single Pos | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2. Single Neg | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3. Dipole | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 4. Like Charges | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 5. Quadrupole | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 6. Triangle | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 7. Finite Rod | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 8. Charged Ring | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 9. Charged Disk | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 10. Finite Plate | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 11. Parallel Plates | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## Section F: Critical Issues Found

**CRITICAL (blocks use):**
```
[List any issues that prevent the tool from functioning]
```

**HIGH (affects physics accuracy):**
```
[List physics validation failures]
```

**MEDIUM (affects usability):**
```
[List UI/interaction issues]
```

**LOW (cosmetic/minor):**
```
[List visual or minor issues]
```

---

## Section G: Recommendations Before Phase 1

Based on testing results, recommend:

1. **Must fix before Phase 1:**
   ```
   [List blockers for proceeding]
   ```

2. **Should fix before Phase 1:**
   ```
   [List high-priority improvements]
   ```

3. **Nice to have before Phase 1:**
   ```
   [List enhancements that would help but aren't critical]
   ```

4. **Can defer to Phase 1 or later:**
   ```
   [List improvements that can wait]
   ```

---

## Testing Metadata

| Field | Value |
|-------|-------|
| **Test Date** | [YYYY-MM-DD] |
| **Tested By** | [Name] |
| **Browser/OS** | [e.g., Chrome 120/Windows 11] |
| **Duration** | [Hours spent testing] |
| **Total Cases Verified** | [X/11] |
| **Pass Rate** | [X%] |
| **Recommendation** | [ ] Ready for Phase 1 / [ ] Needs fixes / [ ] Needs investigation |

---

## Notes for Future Testers

This checklist is comprehensive and systematic. For quick regression testing during development, focus on **Section D** (5-10 minutes). For complete validation, work through **Sections A-B** (2-3 hours).

**Pro Tips:**
- Test on multiple browsers — Safari sometimes has WebGL quirks
- Test on actual mobile device if possible — browser emulation can hide issues
- Record FPS numbers — helps track performance regressions
- Take screenshots of any unexpected behavior for bug reports
- Use the 2D slice views liberally — they reveal field structure clearly

