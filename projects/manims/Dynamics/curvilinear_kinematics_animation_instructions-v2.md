# AI Agent Instructions: Curvilinear Kinematics Manim Animation

## Objective

Generate a comprehensive Manim animation that visualizes **curvilinear motion** and derives the **position, velocity, and acceleration vectors** in three coordinate systems:

1. **Rectangular (Cartesian) Coordinates** $(x, y, z)$ with unit vectors $\hat{i}$, $\hat{j}$, $\hat{k}$
2. **Cylindrical/Polar Coordinates** $(r, \theta, z)$ with unit vectors $\hat{u}_r$, $\hat{u}_\theta$, $\hat{u}_z$
3. **Normal-Tangential (Path) Coordinates** with unit vectors $\hat{u}_t$, $\hat{u}_n$ (and binormal $\hat{u}_b$)

## Notation Convention (Per Course Notes CH12)

**CRITICAL:** Use the following notation consistently throughout all animations:

| Quantity | Vector Notation | Magnitude | Notes |
|----------|----------------|-----------|-------|
| Position | $\vec{r}$ | $r$ | Arrow over lowercase r |
| Velocity | $\vec{V}$ | $v$ | Arrow over CAPITAL V, magnitude is lowercase |
| Acceleration | $\vec{a}$ | $a$ | Arrow over lowercase a |
| Unit vectors | $\hat{u}_r$, $\hat{u}_\theta$, $\hat{u}_t$, $\hat{u}_n$ | — | Hat notation with subscript |
| Cartesian unit vectors | $\hat{i}$, $\hat{j}$, $\hat{k}$ | — | Hat notation |
| Time derivatives | $\dot{r}$, $\ddot{r}$, $\dot{\theta}$, $\ddot{\theta}$ | — | Newton's dot notation |
| Path coordinate | $s$ | — | Arc length along path |
| Radius of curvature | $\rho$ | — | Greek rho |

The animation uses a **split-screen layout**: 3D visualization on the left, mathematical derivations on the right.

---

## Style Reference

Follow the **3Blue1Brown Animation Style Guide** for all aesthetic and pedagogical choices. Key principles:

- **Dark background**: `#1C1C1C`
- **Start with visual intuition**, then derive mathematics
- **Animate equations** using `TransformMatchingTex`
- **Color-coded vectors** with semantic consistency
- **Smooth pacing** with intentional pauses

---

## Global Configuration

```python
from manim import *
import numpy as np

# Global style configuration
config.background_color = "#1C1C1C"
config.frame_width = 16
config.frame_height = 9

# Color Palette (consistent throughout)
class Colors:
    # Coordinate system colors - Rectangular
    RECT_X = "#FC6255"      # Red for x/î
    RECT_Y = "#83C167"      # Green for y/ĵ
    RECT_Z = "#58C4DD"      # Blue for z/k̂
    
    # Cylindrical coordinates
    CYL_R = "#F0AC00"       # Gold for r/û_r
    CYL_THETA = "#9A72AC"   # Purple for θ/û_θ
    CYL_Z = "#58C4DD"       # Blue for z/û_z (same as rect)
    
    # Normal-tangential coordinates
    PATH_T = "#FFFF00"      # Yellow for tangent û_t
    PATH_N = "#FF6B6B"      # Coral for normal û_n
    PATH_B = "#5CD0B3"      # Teal for binormal û_b
    
    # General
    POSITION = "#FFFFFF"    # White for position vector r⃗
    VELOCITY = "#58C4DD"    # Blue for velocity V⃗
    ACCELERATION = "#FC6255" # Red for acceleration a⃗
    PATH = "#888888"        # Gray for trajectory path
    HIGHLIGHT = "#FFFF00"   # Yellow for emphasis
```

---

## Scene Structure

Create the following scenes in order. Each scene should be a separate class that can be rendered independently.

### Scene 1: Introduction and Visual Hook

**Purpose:** Establish the problem visually before any math.

**Duration:** ~30 seconds

**Content:**
1. Show a particle moving along a 3D curved path (helix or space curve)
2. Display the position vector $\vec{r}$ from origin to particle, updating in real-time
3. Pose the question: "How do we describe this motion mathematically?"
4. Introduce the three coordinate systems as overlays

```python
class Scene01_Introduction(ThreeDScene):
    """
    Visual hook: A particle traces a 3D helix while its position vector updates.
    No equations yet - pure visual intuition.
    """
    def construct(self):
        # Layout: Full screen 3D for intro
        
        # 1. Setup camera
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)
        
        # 2. Create 3D axes (subtle, not dominant)
        axes = ThreeDAxes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            z_range=[-2, 4, 1],
            x_length=8, y_length=8, z_length=6,
            axis_config={"stroke_width": 2, "color": GRAY}
        )
        
        # 3. Define the path: 3D helix
        # r(t) = (2cos(t), 2sin(t), 0.3t) for t in [0, 4π]
        def helix_path(t):
            return np.array([
                2 * np.cos(t),
                2 * np.sin(t),
                0.3 * t
            ])
        
        # 4. Create the path curve (traced ahead of particle)
        path_curve = ParametricFunction(
            helix_path,
            t_range=[0, 4*PI],
            color=Colors.PATH,
            stroke_width=3
        )
        
        # 5. Time tracker for animation
        t = ValueTracker(0)
        
        # 6. Particle (small sphere)
        particle = always_redraw(lambda: Sphere(
            radius=0.15,
            color=Colors.POSITION
        ).move_to(helix_path(t.get_value())))
        
        # 7. Position vector from origin to particle
        position_vector = always_redraw(lambda: Arrow3D(
            start=ORIGIN,
            end=helix_path(t.get_value()),
            color=Colors.POSITION,
            thickness=0.04
        ))
        
        # 8. Label for position vector (using course notation)
        r_label = MathTex(r"\vec{r}(t)", color=Colors.POSITION)
        self.add_fixed_in_frame_mobjects(r_label)
        r_label.to_corner(UL)
        
        # Animation sequence
        self.play(Create(axes), run_time=1.5)
        self.wait(0.5)
        
        self.play(Create(path_curve), run_time=2)
        self.wait(0.5)
        
        self.add(particle, position_vector)
        self.play(Write(r_label))
        
        # Animate particle along path
        self.play(
            t.animate.set_value(4*PI),
            run_time=8,
            rate_func=linear
        )
        
        # Slow camera rotation for perspective
        self.begin_ambient_camera_rotation(rate=0.1)
        self.wait(3)
        self.stop_ambient_camera_rotation()
        
        # Pose the question
        question = Text(
            "How do we describe this motion?",
            font_size=36
        ).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(question)
        self.play(Write(question))
        self.wait(2)
```

---

### Scene 2: Split-Screen Layout Setup

**Purpose:** Establish the split-screen format that will be used throughout.

**Duration:** ~15 seconds

**Layout Specification:**
- **Left half (x < 0):** 3D coordinate system with animated vectors
- **Right half (x > 0):** Equations and derivations
- **Dividing line:** Subtle vertical line at x = 0

```python
class Scene02_LayoutSetup(ThreeDScene):
    """
    Transition to split-screen layout.
    Left: 3D visualization (scaled and shifted)
    Right: Math panel
    """
    def construct(self):
        # Create dividing line
        divider = Line(
            start=UP * 4,
            end=DOWN * 4,
            color=GRAY,
            stroke_width=1
        )
        
        # Left panel label
        left_label = Text("Visualization", font_size=24, color=GRAY)
        left_label.move_to(LEFT * 4 + UP * 3.5)
        
        # Right panel label
        right_label = Text("Mathematics", font_size=24, color=GRAY)
        right_label.move_to(RIGHT * 4 + UP * 3.5)
        
        self.add_fixed_in_frame_mobjects(divider, left_label, right_label)
        self.play(
            Create(divider),
            Write(left_label),
            Write(right_label),
            run_time=1.5
        )
        self.wait(1)
```

---

### Scene 3: Rectangular (Cartesian) Coordinates

**Purpose:** Derive position, velocity, and acceleration in Cartesian coordinates.

**Duration:** ~90 seconds

---

## DETAILED PEDAGOGICAL FLOW FOR RECTANGULAR COORDINATES

### Phase 1: Establish the Stage (0:00 - 0:15)

**Goal:** Set up the visual environment before introducing any math.

| Time | Left Panel (3D) | Right Panel (Math) | Audio/Narration Cue |
|------|-----------------|--------------------|--------------------|
| 0:00 | Fade in 3D axes (subtle gray) | Empty | "Let's start with the most familiar system..." |
| 0:03 | **PAUSE** - Let axes settle | — | — |
| 0:05 | Draw curved path (gray, dashed) | Title fades in: "Rectangular Coordinates" | "...rectangular or Cartesian coordinates." |
| 0:10 | Particle appears at start of path | — | — |

**Animation Details:**
```
1. Axes: Create(axes), run_time=1.0, rate_func=smooth
2. Pause: self.wait(0.5)
3. Path: Create(path), run_time=1.5, rate_func=linear
4. Particle: FadeIn(particle), run_time=0.5
```

**Visual Notes:**
- Axes should be subtle (gray, thin lines) — they're scaffolding, not the focus
- Path should be clearly visible but not dominant (dashed gray)
- Particle should be bright white to draw the eye

---

### Phase 2: Introduce the Fixed Basis (0:15 - 0:35)

**Goal:** Establish that î, ĵ, k̂ are FIXED at the origin — this is the KEY insight for rectangular coordinates.

| Time | Left Panel (3D) | Right Panel (Math) | Highlight |
|------|-----------------|--------------------|--------------------|
| 0:15 | Draw î vector (RED) from origin | — | Flash î briefly |
| 0:18 | Draw ĵ vector (GREEN) from origin | — | Flash ĵ briefly |
| 0:21 | Draw k̂ vector (BLUE) from origin | — | Flash k̂ briefly |
| 0:24 | Add labels "î", "ĵ", "k̂" next to vectors | — | — |
| 0:27 | **CAMERA ORBIT** - Slow rotation to show 3D | — | "These unit vectors are fixed in space" |
| 0:32 | Return camera to standard view | Key Insight box appears | **HIGHLIGHT**: "î, ĵ, k̂ are FIXED" |

**Animation Details:**
```python
# Staggered creation of unit vectors
self.play(Create(i_hat), run_time=0.8)
self.play(Create(j_hat), run_time=0.8)
self.play(Create(k_hat), run_time=0.8)

# Labels appear together
self.play(Write(i_label), Write(j_label), Write(k_label), run_time=0.8)

# Camera orbit to emphasize 3D nature
self.move_camera(theta=-45*DEGREES + 30*DEGREES, run_time=2)
self.move_camera(theta=-45*DEGREES, run_time=1.5)

# Key insight box with emphasis
self.play(
    Create(insight_box),
    Write(insight_text),
    Flash(i_hat), Flash(j_hat), Flash(k_hat),  # Quick flash on unit vectors
    run_time=1.5
)
```

**Why This Matters Pedagogically:**
- Students often miss that the FIXED nature of î, ĵ, k̂ is what makes rectangular coordinates "simple"
- The camera orbit reinforces that these vectors don't move regardless of viewing angle
- The flash draws attention back to the 3D panel when the insight appears

---

### Phase 3: Position Vector and Decomposition (0:35 - 0:55)

**Goal:** Show how the position vector r⃗ decomposes into x, y, z components.

| Time | Left Panel (3D) | Right Panel (Math) | Sync Point |
|------|-----------------|--------------------|--------------------|
| 0:35 | Draw r⃗ from origin to particle (WHITE) | — | — |
| 0:38 | — | Write: $\vec{r}(t) = $ | Start equation |
| 0:40 | Show x-component (dashed RED line along x-axis) | Write: $x(t)\hat{i}$ in RED | **SYNC**: x-component appears on both sides |
| 0:43 | Show y-component (dashed GREEN line along y-axis) | Write: $+ y(t)\hat{j}$ in GREEN | **SYNC**: y-component appears on both sides |
| 0:46 | Show z-component (dashed BLUE line along z-axis) | Write: $+ z(t)\hat{k}$ in BLUE | **SYNC**: z-component appears on both sides |
| 0:50 | **ANIMATE**: Move particle slightly, show r⃗ updating | Components update dynamically | "As the particle moves, x, y, z change..." |

**Animation Details:**
```python
# Position vector
self.play(Create(position_vec), run_time=1.0)

# Synchronized component decomposition
self.play(
    Create(x_component_line),  # Left panel
    Write(pos_eq_x_part),       # Right panel: "x(t)î"
    run_time=1.0
)
self.play(
    Create(y_component_line),
    Write(pos_eq_y_part),       # "+ y(t)ĵ"
    run_time=1.0
)
self.play(
    Create(z_component_line),
    Write(pos_eq_z_part),       # "+ z(t)k̂"
    run_time=1.0
)

# Brief animation to show dynamic update
self.play(t.animate.set_value(PI), run_time=2, rate_func=smooth)
```

**Visual Hierarchy:**
1. Position vector r⃗: WHITE, thick (0.04), prominent
2. Component lines: Colored (R/G/B), dashed, medium thickness (0.02)
3. Unit vectors: Colored, solid, thin (0.03), at origin

---

### Phase 4: Velocity Derivation (0:55 - 1:15)

**Goal:** Derive velocity by differentiating position. Emphasize that î, ĵ, k̂ have ZERO derivatives.

| Time | Left Panel (3D) | Right Panel (Math) | Key Teaching Point |
|------|-----------------|--------------------|--------------------|
| 0:55 | — | Write: $\vec{V} = \frac{d\vec{r}}{dt}$ | "Velocity is the time derivative of position" |
| 0:58 | — | **TRANSFORM** equation to show derivative | — |
| 1:00 | — | Show: $\vec{V} = \frac{dx}{dt}\hat{i} + \frac{dy}{dt}\hat{j} + \frac{dz}{dt}\hat{k}$ | — |
| 1:03 | — | **HIGHLIGHT** with box: "Since î, ĵ, k̂ are constant: $\frac{d\hat{i}}{dt} = 0$" | **THIS IS KEY** |
| 1:07 | Velocity vector V⃗ appears (BLUE) at particle | Simplify to: $\vec{V} = V_x\hat{i} + V_y\hat{j} + V_z\hat{k}$ | — |
| 1:10 | **ANIMATE**: Move particle, show V⃗ tangent to path | — | "Velocity is always tangent to the path" |

**Animation Details:**
```python
# Derivative definition
self.play(Write(vel_definition), run_time=1.0)
self.wait(0.5)

# Transform to show expansion (use TransformMatchingTex)
self.play(
    TransformMatchingTex(vel_definition, vel_expanded),
    run_time=1.5
)

# Highlight the key insight about constant unit vectors
derivative_note = MathTex(r"\frac{d\hat{i}}{dt} = \frac{d\hat{j}}{dt} = \frac{d\hat{k}}{dt} = 0")
note_box = SurroundingRectangle(derivative_note, color=YELLOW)
self.play(Write(derivative_note), Create(note_box), run_time=1.0)
self.wait(1.0)
self.play(FadeOut(derivative_note), FadeOut(note_box))

# Add velocity vector to 3D panel
self.play(Create(velocity_vec), run_time=0.8)

# Animate motion to show velocity tangent
self.play(t.animate.set_value(2*PI), run_time=3, rate_func=linear)
```

**Pedagogical Emphasis:**
- The fact that $\frac{d\hat{i}}{dt} = 0$ is WHY rectangular coordinates are "simple"
- This sets up the contrast with cylindrical coordinates later (where unit vector derivatives are NOT zero)

---

### Phase 5: Acceleration Derivation (1:15 - 1:30)

**Goal:** Complete the derivation with acceleration. Reinforce the pattern.

| Time | Left Panel (3D) | Right Panel (Math) | Notes |
|------|-----------------|--------------------|--------------------|
| 1:15 | — | Write: $\vec{a} = \frac{d\vec{V}}{dt}$ | "Acceleration is the derivative of velocity" |
| 1:18 | — | **TRANSFORM** to: $\vec{a} = \ddot{x}\hat{i} + \ddot{y}\hat{j} + \ddot{z}\hat{k}$ | Use double-dot notation |
| 1:22 | Acceleration vector a⃗ appears (RED) at particle | — | — |
| 1:25 | **ANIMATE**: Move particle, show a⃗ pointing toward concave side | — | "Acceleration points toward concave side" |

**Animation Details:**
```python
# Acceleration definition and simplification
self.play(Write(acc_definition), run_time=0.8)
self.play(TransformMatchingTex(acc_definition, acc_expanded), run_time=1.2)

# Add acceleration vector
self.play(Create(accel_vec), run_time=0.8)

# Animate to show acceleration direction
self.play(t.animate.set_value(2.5*PI), run_time=2.5, rate_func=linear)
```

---

### Phase 6: Summary Animation (1:30 - 1:45)

**Goal:** Show all three vectors together, updating dynamically as particle moves.

| Time | Left Panel (3D) | Right Panel (Math) | Visual Effect |
|------|-----------------|--------------------|--------------------|
| 1:30 | All vectors visible: r⃗ (white), V⃗ (blue), a⃗ (red) | All equations visible | — |
| 1:32 | **FULL ANIMATION**: Particle traverses path | Equations highlighted in sequence | Color pulse on each equation as vector updates |
| 1:40 | **CAMERA ROTATION**: Slow orbit to show 3D | — | Emphasize 3D nature |
| 1:45 | Return to standard view, fade non-essentials | Summary box appears | — |

**Animation Details:**
```python
# Ensure all vectors are visible
self.add(position_vec, velocity_vec, accel_vec)

# Full traversal animation
self.play(
    t.animate.set_value(3*PI),
    run_time=5,
    rate_func=linear
)

# Summary highlight
summary_box = SurroundingRectangle(
    VGroup(pos_eq, vel_eq, acc_eq),
    color=WHITE,
    buff=0.3
)
self.play(Create(summary_box), run_time=1.0)

# Gentle camera motion
self.begin_ambient_camera_rotation(rate=0.1)
self.wait(3)
self.stop_ambient_camera_rotation()
```

---

## COMPLETE CODE WITH PEDAGOGICAL ANNOTATIONS

```python
class Scene03_RectangularCoordinates(ThreeDScene):
    """
    Rectangular coordinate system derivation.
    Key insight: Unit vectors î, ĵ, k̂ are FIXED in space.
    Notation follows CH12: V⃗ (capital), v (magnitude), a⃗ (acceleration)
    
    PEDAGOGICAL STRUCTURE:
    Phase 1: Establish stage (axes, path, particle)
    Phase 2: Introduce fixed basis (î, ĵ, k̂)
    Phase 3: Position decomposition
    Phase 4: Velocity derivation (emphasize dî/dt = 0)
    Phase 5: Acceleration derivation
    Phase 6: Summary animation
    """
    def construct(self):
        # ===== SETUP: LEFT PANEL (3D Visualization) =====
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)
        
        # Axes (subtle, gray)
        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[-1, 2, 1],
            x_length=4, y_length=4, z_length=3,
            axis_config={"color": GRAY, "stroke_width": 2}
        ).shift(LEFT * 4)
        
        # Unit vectors at origin (FIXED - key point)
        i_hat = Arrow3D(
            start=axes.c2p(0,0,0), end=axes.c2p(1,0,0),
            color=Colors.RECT_X, thickness=0.03
        )
        j_hat = Arrow3D(
            start=axes.c2p(0,0,0), end=axes.c2p(0,1,0),
            color=Colors.RECT_Y, thickness=0.03
        )
        k_hat = Arrow3D(
            start=axes.c2p(0,0,0), end=axes.c2p(0,0,1),
            color=Colors.RECT_Z, thickness=0.03
        )
        
        # Unit vector labels
        i_label = MathTex(r"\hat{i}", color=Colors.RECT_X, font_size=24)
        j_label = MathTex(r"\hat{j}", color=Colors.RECT_Y, font_size=24)
        k_label = MathTex(r"\hat{k}", color=Colors.RECT_Z, font_size=24)
        # Position labels near arrow tips
        
        # Path (helix)
        path = ParametricFunction(
            lambda t: np.array([-4 + 1.5*np.cos(t), 1.5*np.sin(t), 0.2*t]),
            t_range=[0, 3*PI],
            color=Colors.PATH, stroke_width=2, stroke_opacity=0.7
        )
        
        # Time parameter
        t = ValueTracker(PI/2)
        
        # Position function
        def get_pos():
            _t = t.get_value()
            return np.array([-4 + 1.5*np.cos(_t), 1.5*np.sin(_t), 0.2*_t])
        
        # Particle
        particle = always_redraw(lambda: Sphere(
            radius=0.12, color=WHITE
        ).move_to(get_pos()))
        
        # Position vector r⃗
        position_vec = always_redraw(lambda: Arrow3D(
            start=axes.c2p(0,0,0), end=get_pos(),
            color=Colors.POSITION, thickness=0.04
        ))
        
        # Component projections (dashed lines)
        x_proj = always_redraw(lambda: DashedLine(
            axes.c2p(0,0,0),
            axes.c2p(1.5*np.cos(t.get_value()), 0, 0),
            color=Colors.RECT_X, stroke_width=2
        ))
        y_proj = always_redraw(lambda: DashedLine(
            axes.c2p(1.5*np.cos(t.get_value()), 0, 0),
            axes.c2p(1.5*np.cos(t.get_value()), 1.5*np.sin(t.get_value()), 0),
            color=Colors.RECT_Y, stroke_width=2
        ))
        z_proj = always_redraw(lambda: DashedLine(
            axes.c2p(1.5*np.cos(t.get_value()), 1.5*np.sin(t.get_value()), 0),
            get_pos(),
            color=Colors.RECT_Z, stroke_width=2
        ))
        
        # Velocity vector V⃗
        def get_vel():
            _t = t.get_value()
            return 0.5 * np.array([-1.5*np.sin(_t), 1.5*np.cos(_t), 0.2])
        
        velocity_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(), end=get_pos() + get_vel(),
            color=Colors.VELOCITY, thickness=0.035
        ))
        
        # Acceleration vector a⃗
        def get_acc():
            _t = t.get_value()
            return 0.3 * np.array([-1.5*np.cos(_t), -1.5*np.sin(_t), 0])
        
        accel_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(), end=get_pos() + get_acc(),
            color=Colors.ACCELERATION, thickness=0.035
        ))
        
        # ===== SETUP: RIGHT PANEL (Equations) =====
        title = Text("Rectangular Coordinates", font_size=32)
        title.move_to(RIGHT * 4 + UP * 3.2)
        self.add_fixed_in_frame_mobjects(title)
        
        # Position equation (built in parts for synchronized animation)
        pos_eq_start = MathTex(r"\vec{r}(t) = ", font_size=34)
        pos_eq_x = MathTex(r"x(t)", r"\hat{i}", font_size=34)
        pos_eq_y = MathTex(r"+ y(t)", r"\hat{j}", font_size=34)
        pos_eq_z = MathTex(r"+ z(t)", r"\hat{k}", font_size=34)
        pos_eq_x[0].set_color(Colors.RECT_X)
        pos_eq_x[1].set_color(Colors.RECT_X)
        pos_eq_y[0][1:].set_color(Colors.RECT_Y)  # Skip the +
        pos_eq_y[1].set_color(Colors.RECT_Y)
        pos_eq_z[0][1:].set_color(Colors.RECT_Z)
        pos_eq_z[1].set_color(Colors.RECT_Z)
        
        pos_eq = VGroup(pos_eq_start, pos_eq_x, pos_eq_y, pos_eq_z).arrange(RIGHT, buff=0.1)
        pos_eq.move_to(RIGHT * 4 + UP * 2)
        self.add_fixed_in_frame_mobjects(pos_eq)
        
        # Key insight box
        insight_text = VGroup(
            Text("Key Insight:", font_size=22, color=Colors.HIGHLIGHT),
            MathTex(r"\hat{i}, \hat{j}, \hat{k} \text{ are } \textbf{fixed}", font_size=26),
            MathTex(r"\Rightarrow \frac{d\hat{i}}{dt} = \frac{d\hat{j}}{dt} = \frac{d\hat{k}}{dt} = 0", font_size=24)
        ).arrange(DOWN, buff=0.15)
        insight_text.move_to(RIGHT * 4 + UP * 0.5)
        insight_box = SurroundingRectangle(insight_text, color=Colors.HIGHLIGHT, buff=0.2)
        self.add_fixed_in_frame_mobjects(insight_text, insight_box)
        
        # Velocity equations
        vel_def = MathTex(r"\vec{V} = \frac{d\vec{r}}{dt}", font_size=32)
        vel_def.move_to(RIGHT * 4 + DOWN * 0.8)
        self.add_fixed_in_frame_mobjects(vel_def)
        
        vel_expanded = MathTex(
            r"\vec{V} = ", r"V_x", r"\hat{i}", r" + ", r"V_y", r"\hat{j}", r" + ", r"V_z", r"\hat{k}",
            font_size=32
        )
        vel_expanded[1].set_color(Colors.RECT_X)
        vel_expanded[2].set_color(Colors.RECT_X)
        vel_expanded[4].set_color(Colors.RECT_Y)
        vel_expanded[5].set_color(Colors.RECT_Y)
        vel_expanded[7].set_color(Colors.RECT_Z)
        vel_expanded[8].set_color(Colors.RECT_Z)
        vel_expanded.move_to(RIGHT * 4 + DOWN * 1.5)
        self.add_fixed_in_frame_mobjects(vel_expanded)
        
        # Acceleration equation
        acc_eq = MathTex(
            r"\vec{a} = ", r"\ddot{x}", r"\hat{i}", r" + ", r"\ddot{y}", r"\hat{j}", r" + ", r"\ddot{z}", r"\hat{k}",
            font_size=32
        )
        acc_eq[1].set_color(Colors.RECT_X)
        acc_eq[2].set_color(Colors.RECT_X)
        acc_eq[4].set_color(Colors.RECT_Y)
        acc_eq[5].set_color(Colors.RECT_Y)
        acc_eq[7].set_color(Colors.RECT_Z)
        acc_eq[8].set_color(Colors.RECT_Z)
        acc_eq.move_to(RIGHT * 4 + DOWN * 2.5)
        self.add_fixed_in_frame_mobjects(acc_eq)
        
        # Tangent note
        tangent_note = MathTex(r"\vec{V} \text{ always tangent to path}", font_size=24, color=GRAY)
        tangent_note.move_to(RIGHT * 4 + DOWN * 3.3)
        self.add_fixed_in_frame_mobjects(tangent_note)
        
        # ========== PHASE 1: ESTABLISH THE STAGE ==========
        self.play(Create(axes), run_time=1.0)
        self.wait(0.3)
        self.play(Create(path), run_time=1.5)
        self.play(FadeIn(particle), Write(title), run_time=0.8)
        self.wait(0.5)
        
        # ========== PHASE 2: INTRODUCE FIXED BASIS ==========
        # Staggered unit vector creation
        self.play(Create(i_hat), run_time=0.6)
        self.play(Create(j_hat), run_time=0.6)
        self.play(Create(k_hat), run_time=0.6)
        self.wait(0.3)
        
        # Camera orbit to show 3D nature
        self.move_camera(theta=-15*DEGREES, run_time=1.5)
        self.wait(0.5)
        self.move_camera(theta=-45*DEGREES, run_time=1.0)
        
        # Key insight appears with emphasis
        self.play(
            Write(insight_text),
            Create(insight_box),
            run_time=1.5
        )
        # Flash unit vectors to reinforce they are fixed
        self.play(
            i_hat.animate.set_color(WHITE), j_hat.animate.set_color(WHITE), k_hat.animate.set_color(WHITE),
            rate_func=there_and_back,
            run_time=0.5
        )
        self.wait(1.0)
        
        # ========== PHASE 3: POSITION DECOMPOSITION ==========
        # Show position vector
        self.add(position_vec)
        self.play(Write(pos_eq_start), run_time=0.5)
        self.wait(0.3)
        
        # Synchronized: x-component on both panels
        self.play(
            Create(x_proj),
            Write(pos_eq_x),
            run_time=1.0
        )
        
        # Synchronized: y-component
        self.play(
            Create(y_proj),
            Write(pos_eq_y),
            run_time=1.0
        )
        
        # Synchronized: z-component
        self.play(
            Create(z_proj),
            Write(pos_eq_z),
            run_time=1.0
        )
        
        # Brief motion to show dynamic update
        self.play(t.animate.set_value(PI), run_time=2, rate_func=smooth)
        self.wait(0.5)
        
        # ========== PHASE 4: VELOCITY DERIVATION ==========
        self.play(Write(vel_def), run_time=0.8)
        self.wait(0.5)
        
        # Add velocity vector with emphasis
        self.add(velocity_vec)
        self.play(
            Write(vel_expanded),
            velocity_vec.animate.set_color(WHITE),  # Flash
            rate_func=there_and_back,
            run_time=1.2
        )
        self.play(Write(tangent_note), run_time=0.5)
        
        # Animate to show velocity tangent to path
        self.play(t.animate.set_value(1.8*PI), run_time=2.5, rate_func=linear)
        self.wait(0.5)
        
        # ========== PHASE 5: ACCELERATION DERIVATION ==========
        self.add(accel_vec)
        self.play(
            Write(acc_eq),
            accel_vec.animate.set_color(WHITE),  # Flash
            rate_func=there_and_back,
            run_time=1.2
        )
        self.wait(0.5)
        
        # ========== PHASE 6: SUMMARY ANIMATION ==========
        # Full traversal with all vectors visible
        self.play(
            t.animate.set_value(2.8*PI),
            run_time=4,
            rate_func=linear
        )
        
        # Gentle camera orbit for finale
        self.begin_ambient_camera_rotation(rate=0.08)
        self.wait(3)
        self.stop_ambient_camera_rotation()
        self.wait(1)
```

---

## VISUAL SYNCHRONIZATION GUIDE

### Color Coding (Must Be Consistent)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| x-component | Red | `#FC6255` | x(t), î, Vₓ, ẍ, x-projection line |
| y-component | Green | `#83C167` | y(t), ĵ, Vᵧ, ÿ, y-projection line |
| z-component | Blue | `#58C4DD` | z(t), k̂, Vᵤ, z̈, z-projection line |
| Position r⃗ | White | `#FFFFFF` | Position vector |
| Velocity V⃗ | Blue | `#58C4DD` | Velocity vector (same as z for visual harmony) |
| Acceleration a⃗ | Red | `#FC6255` | Acceleration vector |
| Highlight | Yellow | `#FFFF00` | Key insights, emphasis |

### Timing Synchronization Points

```
[0:40] LEFT: x-projection appears  ←→  RIGHT: "x(t)î" writes
[0:43] LEFT: y-projection appears  ←→  RIGHT: "+ y(t)ĵ" writes
[0:46] LEFT: z-projection appears  ←→  RIGHT: "+ z(t)k̂" writes
[1:07] LEFT: V⃗ appears at particle ←→  RIGHT: Velocity equation completes
[1:22] LEFT: a⃗ appears at particle ←→  RIGHT: Acceleration equation completes
```

### What to Highlight (Visual Emphasis)

1. **FLASH** unit vectors when stating they are "fixed"
2. **BOX** around the key insight: $\frac{d\hat{i}}{dt} = 0$
3. **COLOR PULSE** on equation terms when corresponding 3D element appears
4. **CAMERA ORBIT** after introducing unit vectors (shows they don't move)

---

## ANIMATION OUTLINE: OBJECT MOVEMENT, BEHAVIOR & TRANSITIONS

This section provides explicit instructions for how each Manim object should move, behave, and transition throughout the Rectangular Coordinates scene. Use this as a shot-by-shot guide.

---

### OBJECT CATALOG

#### 3D Panel Objects (Left Side)

| Object ID | Type | Initial State | Behavior | Update Rule |
|-----------|------|---------------|----------|-------------|
| `axes` | ThreeDAxes | Hidden | Static after creation | None |
| `path` | ParametricFunction | Hidden | Static curve | None |
| `particle` | Sphere | At t=π/2 on path | Moves along path | `always_redraw` tied to `t` ValueTracker |
| `i_hat` | Arrow3D | Hidden | Static at origin | None |
| `j_hat` | Arrow3D | Hidden | Static at origin | None |
| `k_hat` | Arrow3D | Hidden | Static at origin | None |
| `position_vec` | Arrow3D | Hidden | Dynamic: origin → particle | `always_redraw` tied to `t` |
| `x_proj` | DashedLine | Hidden | Dynamic: shows x-component | `always_redraw` tied to `t` |
| `y_proj` | DashedLine | Hidden | Dynamic: shows y-component | `always_redraw` tied to `t` |
| `z_proj` | DashedLine | Hidden | Dynamic: shows z-component | `always_redraw` tied to `t` |
| `velocity_vec` | Arrow3D | Hidden | Dynamic: at particle, tangent | `always_redraw` tied to `t` |
| `accel_vec` | Arrow3D | Hidden | Dynamic: at particle | `always_redraw` tied to `t` |

#### 2D Panel Objects (Right Side)

| Object ID | Type | Initial State | Behavior |
|-----------|------|---------------|----------|
| `title` | Text | Hidden | Static after Write |
| `pos_eq_start` | MathTex | Hidden | Static after Write |
| `pos_eq_x` | MathTex | Hidden | Static; color-coded RED |
| `pos_eq_y` | MathTex | Hidden | Static; color-coded GREEN |
| `pos_eq_z` | MathTex | Hidden | Static; color-coded BLUE |
| `insight_box` | SurroundingRectangle | Hidden | Static; YELLOW border |
| `insight_text` | VGroup | Hidden | Static after Write |
| `vel_def` | MathTex | Hidden | Static after Write |
| `vel_expanded` | MathTex | Hidden | Static; color-coded components |
| `acc_eq` | MathTex | Hidden | Static; color-coded components |
| `tangent_note` | MathTex | Hidden | Static; GRAY color |

#### Control Objects

| Object ID | Type | Initial Value | Purpose |
|-----------|------|---------------|---------|
| `t` | ValueTracker | π/2 | Controls particle position along path |
| `camera` | ThreeDCamera | phi=70°, theta=-45° | Viewpoint control |

---

### SHOT-BY-SHOT ANIMATION SEQUENCE

#### SHOT 1: Axes Emergence (0:00 - 0:01)
```python
# Object: axes
# Animation: Create (draws axes from origin outward)
# Movement: Lines extend from origin along +x, -x, +y, -y, +z, -z
# Duration: 1.0 seconds
# Rate Function: smooth (ease in/out)
# Transition: None (first element)

self.play(Create(axes), run_time=1.0, rate_func=smooth)
```
**Visual Behavior:** Axes lines grow outward from the origin simultaneously. Grid lines (if any) fade in.

---

#### SHOT 2: Pause for Orientation (0:01 - 0:01.5)
```python
# No animation - let viewer orient to 3D space
self.wait(0.5)
```

---

#### SHOT 3: Path Drawing (0:01.5 - 0:03)
```python
# Object: path (helix curve)
# Animation: Create (traces the curve)
# Movement: Curve draws from t=0 to t=3π along helix
# Duration: 1.5 seconds
# Rate Function: linear (constant speed tracing)
# Visual: Gray dashed line appears progressively

self.play(Create(path), run_time=1.5, rate_func=linear)
```
**Visual Behavior:** The helix path traces itself as if being drawn by an invisible pen, starting from the bottom and spiraling upward.

---

#### SHOT 4: Particle & Title Entrance (0:03 - 0:03.8)
```python
# Objects: particle, title
# Animation: FadeIn (particle), Write (title)
# Movement: Particle fades in at position t=π/2 on path
#           Title writes left-to-right on right panel
# Duration: 0.8 seconds
# Rate Function: smooth

self.play(
    FadeIn(particle),
    Write(title),
    run_time=0.8,
    rate_func=smooth
)
```
**Visual Behavior:** Particle materializes (opacity 0→1) at its starting position. Title text writes character by character.

---

#### SHOT 5: Brief Pause (0:03.8 - 0:04.3)
```python
self.wait(0.5)
```

---

#### SHOT 6-8: Unit Vectors Staggered Creation (0:04.3 - 0:06.1)
```python
# Objects: i_hat, j_hat, k_hat (created sequentially)
# Animation: Create (arrow grows from origin to tip)
# Movement: Each arrow extends from origin outward
# Duration: 0.6 seconds each
# Rate Function: smooth
# Stagger Delay: Each starts after previous completes

# SHOT 6: î vector (RED)
self.play(Create(i_hat), run_time=0.6, rate_func=smooth)

# SHOT 7: ĵ vector (GREEN)  
self.play(Create(j_hat), run_time=0.6, rate_func=smooth)

# SHOT 8: k̂ vector (BLUE)
self.play(Create(k_hat), run_time=0.6, rate_func=smooth)
```
**Visual Behavior:** Each unit vector arrow grows from the origin point outward to its tip. The arrowhead forms as the shaft reaches full length. Staggered timing creates a "1-2-3" rhythm.

---

#### SHOT 9: Brief Pause Before Camera Move (0:06.1 - 0:06.4)
```python
self.wait(0.3)
```

---

#### SHOT 10: Camera Orbit Right (0:06.4 - 0:07.9)
```python
# Object: camera
# Animation: move_camera
# Movement: theta rotates from -45° to -15° (30° rightward)
# Duration: 1.5 seconds
# Rate Function: smooth (built into move_camera)
# Purpose: Show unit vectors from different angle to prove they're 3D

self.move_camera(theta=-15*DEGREES, run_time=1.5)
```
**Visual Behavior:** The entire 3D scene rotates as if viewer is walking around it to the right. Unit vectors maintain their orientation relative to axes, demonstrating they are fixed in space.

---

#### SHOT 11: Pause at New Angle (0:07.9 - 0:08.4)
```python
self.wait(0.5)
```

---

#### SHOT 12: Camera Return (0:08.4 - 0:09.4)
```python
# Object: camera
# Animation: move_camera
# Movement: theta rotates from -15° back to -45°
# Duration: 1.0 seconds

self.move_camera(theta=-45*DEGREES, run_time=1.0)
```
**Visual Behavior:** Scene rotates back to standard viewing angle.

---

#### SHOT 13: Key Insight Box Appearance (0:09.4 - 0:10.9)
```python
# Objects: insight_text, insight_box
# Animation: Write (text), Create (box)
# Movement: Text writes line by line, box draws around it
# Duration: 1.5 seconds
# Special Effect: Unit vectors flash WHITE briefly

self.play(
    Write(insight_text),
    Create(insight_box),
    run_time=1.5
)
```
**Visual Behavior:** The insight box border draws itself (like a rectangle being traced). Text inside writes simultaneously. This draws attention to the key concept.

---

#### SHOT 14: Unit Vector Flash (0:10.9 - 0:11.4)
```python
# Objects: i_hat, j_hat, k_hat
# Animation: Color change (there_and_back)
# Movement: None (color only)
# Duration: 0.5 seconds
# Effect: All three vectors flash WHITE then return to original colors

self.play(
    i_hat.animate.set_color(WHITE),
    j_hat.animate.set_color(WHITE),
    k_hat.animate.set_color(WHITE),
    rate_func=there_and_back,
    run_time=0.5
)
```
**Visual Behavior:** Unit vectors briefly turn white (flash) then return to red/green/blue. This visually connects the 3D vectors to the insight box.

---

#### SHOT 15: Pause for Reading (0:11.4 - 0:12.4)
```python
self.wait(1.0)
```

---

#### SHOT 16: Position Vector Appearance (0:12.4 - 0:12.4)
```python
# Object: position_vec
# Animation: Add (instant) - we want it to just appear
# Note: Using self.add() for instant appearance, then animating equation

self.add(position_vec)
```
**Visual Behavior:** Position vector instantly appears from origin to particle. No animation - this creates visual surprise that draws attention.

---

#### SHOT 17: Position Equation Start (0:12.4 - 0:12.9)
```python
# Object: pos_eq_start ("r⃗(t) = ")
# Animation: Write
# Duration: 0.5 seconds

self.play(Write(pos_eq_start), run_time=0.5)
```

---

#### SHOT 18: Pause (0:12.9 - 0:13.2)
```python
self.wait(0.3)
```

---

#### SHOT 19: X-Component Synchronized (0:13.2 - 0:14.2)
```python
# Objects: x_proj (3D), pos_eq_x (2D)
# Animation: Create (3D), Write (2D) - SIMULTANEOUS
# Movement: Dashed red line appears along x-axis
#           "x(t)î" writes in red on right panel
# Duration: 1.0 seconds
# CRITICAL: Both animations must run together for visual connection

self.play(
    Create(x_proj),      # 3D: dashed line along x
    Write(pos_eq_x),     # 2D: "x(t)î" in red
    run_time=1.0
)
```
**Visual Behavior:** The x-component dashed line draws from origin along x-axis while simultaneously the equation term writes. This creates a visual link between the geometric and algebraic representations.

---

#### SHOT 20: Y-Component Synchronized (0:14.2 - 0:15.2)
```python
# Objects: y_proj (3D), pos_eq_y (2D)
# Same pattern as SHOT 19 but for y-component (GREEN)

self.play(
    Create(y_proj),      # 3D: dashed line along y
    Write(pos_eq_y),     # 2D: "+ y(t)ĵ" in green
    run_time=1.0
)
```

---

#### SHOT 21: Z-Component Synchronized (0:15.2 - 0:16.2)
```python
# Objects: z_proj (3D), pos_eq_z (2D)
# Same pattern as SHOT 19 but for z-component (BLUE)

self.play(
    Create(z_proj),      # 3D: dashed line along z
    Write(pos_eq_z),     # 2D: "+ z(t)k̂" in blue
    run_time=1.0
)
```

---

#### SHOT 22: Dynamic Position Update (0:16.2 - 0:18.2)
```python
# Object: t (ValueTracker)
# Animation: animate.set_value
# Movement: Particle moves along path, ALL dynamic objects update:
#           - particle position
#           - position_vec end point
#           - x_proj, y_proj, z_proj lengths
# Duration: 2.0 seconds
# Rate Function: smooth (ease in/out for gentle motion)

self.play(
    t.animate.set_value(PI),  # Move from π/2 to π
    run_time=2.0,
    rate_func=smooth
)
```
**Visual Behavior:** Particle glides along the helix. Position vector smoothly follows. Component projection lines stretch/shrink to match new position. This demonstrates that x(t), y(t), z(t) are functions of time.

---

#### SHOT 23: Pause (0:18.2 - 0:18.7)
```python
self.wait(0.5)
```

---

#### SHOT 24: Velocity Definition (0:18.7 - 0:19.5)
```python
# Object: vel_def ("V⃗ = dr⃗/dt")
# Animation: Write
# Duration: 0.8 seconds

self.play(Write(vel_def), run_time=0.8)
```

---

#### SHOT 25: Pause for Reading (0:19.5 - 0:20.0)
```python
self.wait(0.5)
```

---

#### SHOT 26: Velocity Vector + Equation (0:20.0 - 0:21.2)
```python
# Objects: velocity_vec (3D), vel_expanded (2D)
# Animation: Add (3D instant), Write (2D), Flash effect
# Movement: Velocity arrow appears at particle, tangent to path
# Special: Brief white flash on velocity vector

self.add(velocity_vec)
self.play(
    Write(vel_expanded),
    velocity_vec.animate.set_color(WHITE),
    rate_func=there_and_back,  # Flash effect
    run_time=1.2
)
```
**Visual Behavior:** Blue velocity arrow appears instantly at particle position, pointing tangent to path. It flashes white briefly while equation writes, then returns to blue.

---

#### SHOT 27: Tangent Note (0:21.2 - 0:21.7)
```python
# Object: tangent_note ("V⃗ always tangent to path")
# Animation: Write
# Duration: 0.5 seconds

self.play(Write(tangent_note), run_time=0.5)
```

---

#### SHOT 28: Velocity Tangent Demonstration (0:21.7 - 0:24.2)
```python
# Object: t (ValueTracker)
# Animation: animate.set_value
# Movement: Particle moves further along path
#           Velocity vector visibly stays tangent to curve
# Duration: 2.5 seconds
# Rate Function: linear (constant speed to emphasize tangent property)

self.play(
    t.animate.set_value(1.8*PI),
    run_time=2.5,
    rate_func=linear
)
```
**Visual Behavior:** Particle moves at constant speed. Velocity vector rotates smoothly to always point along the path direction. This visually proves the "tangent to path" statement.

---

#### SHOT 29: Pause (0:24.2 - 0:24.7)
```python
self.wait(0.5)
```

---

#### SHOT 30: Acceleration Vector + Equation (0:24.7 - 0:25.9)
```python
# Objects: accel_vec (3D), acc_eq (2D)
# Animation: Add (3D instant), Write (2D), Flash effect
# Movement: Acceleration arrow appears at particle
# Special: Brief white flash on acceleration vector

self.add(accel_vec)
self.play(
    Write(acc_eq),
    accel_vec.animate.set_color(WHITE),
    rate_func=there_and_back,
    run_time=1.2
)
```
**Visual Behavior:** Red acceleration arrow appears at particle. For the helix, this points toward the z-axis (centripetal). It flashes white, then returns to red.

---

#### SHOT 31: Pause (0:25.9 - 0:26.4)
```python
self.wait(0.5)
```

---

#### SHOT 32: Full Traversal Animation (0:26.4 - 0:30.4)
```python
# Object: t (ValueTracker)
# Animation: animate.set_value
# Movement: Particle completes traversal of visible path
#           ALL vectors update continuously:
#           - position_vec follows particle
#           - velocity_vec stays tangent
#           - accel_vec points toward center
#           - projection lines update
# Duration: 4.0 seconds
# Rate Function: linear (constant speed for clear observation)

self.play(
    t.animate.set_value(2.8*PI),
    run_time=4.0,
    rate_func=linear
)
```
**Visual Behavior:** This is the "payoff" animation. All vectors move together in a coordinated dance. Student can observe how position, velocity, and acceleration relate geometrically.

---

#### SHOT 33: Camera Orbit Finale (0:30.4 - 0:33.4)
```python
# Object: camera
# Animation: begin_ambient_camera_rotation
# Movement: Continuous slow rotation around z-axis
# Duration: 3.0 seconds of rotation
# Rate: 0.08 radians/second (very slow, ~4.5° per second)

self.begin_ambient_camera_rotation(rate=0.08)
self.wait(3)
self.stop_ambient_camera_rotation()
```
**Visual Behavior:** The entire scene slowly rotates, giving a final 3D perspective. All objects maintain their relative positions. This reinforces the 3D nature of the coordinate system.

---

#### SHOT 34: Final Pause (0:33.4 - 0:34.4)
```python
self.wait(1)
```

---

### TRANSITION TYPES REFERENCE

| Transition | Manim Method | Use Case | Visual Effect |
|------------|--------------|----------|---------------|
| Fade In | `FadeIn(obj)` | Gentle appearance | Opacity 0→1 |
| Fade Out | `FadeOut(obj)` | Gentle disappearance | Opacity 1→0 |
| Create | `Create(obj)` | Drawing effect | Traces outline/path |
| Write | `Write(obj)` | Text/equations | Character by character |
| Transform | `Transform(a, b)` | Morph shape | Smooth interpolation |
| TransformMatchingTex | `TransformMatchingTex(a, b)` | Equation changes | Matches similar terms |
| Flash | `Flash(obj)` | Emphasis | Brief bright pulse |
| Indicate | `Indicate(obj)` | Draw attention | Scale up/down + color |
| Circumscribe | `Circumscribe(obj)` | Highlight | Drawing circle around |
| Instant Add | `self.add(obj)` | Sudden appearance | No animation |

### RATE FUNCTIONS REFERENCE

| Rate Function | Effect | Use Case |
|---------------|--------|----------|
| `smooth` | Ease in/out | Default for most animations |
| `linear` | Constant speed | Particle motion, tracing paths |
| `rush_into` | Slow start, fast end | Building anticipation |
| `rush_from` | Fast start, slow end | Settling into position |
| `there_and_back` | Forward then reverse | Flash/pulse effects |
| `double_smooth` | Extra smooth | Long camera movements |
| `ease_in_sine` | Gentle start | Beginning of sequences |
| `ease_out_sine` | Gentle end | Ending of sequences |

### OBJECT BEHAVIOR RULES

1. **Dynamic Objects (always_redraw):**
   - `particle`, `position_vec`, `velocity_vec`, `accel_vec`, `x_proj`, `y_proj`, `z_proj`
   - These AUTOMATICALLY update when `t` ValueTracker changes
   - No explicit animation needed for their movement — just animate `t`

2. **Static Objects:**
   - `axes`, `path`, `i_hat`, `j_hat`, `k_hat`, all equation objects
   - Created once, never move
   - Use `Create()` or `Write()` for initial appearance

3. **Camera:**
   - Use `move_camera()` for discrete position changes
   - Use `begin/stop_ambient_camera_rotation()` for continuous rotation
   - Always `add_fixed_in_frame_mobjects()` for 2D elements that shouldn't rotate

4. **Synchronization Rule:**
   - When showing a concept on BOTH panels, use a SINGLE `self.play()` call with multiple animations
   - This guarantees they start and end together

---

### Scene 4: Cylindrical/Polar Coordinates

**Purpose:** Derive position, velocity, and acceleration in cylindrical coordinates.

**Duration:** ~120 seconds

**Key Pedagogical Point (from CH12):** The unit vectors $\hat{u}_r$ and $\hat{u}_\theta$ **rotate with the particle** — they are NOT fixed! This is why derivatives of unit vectors appear in the velocity and acceleration.

**Left Panel (3D):**
- Show particle on curved path
- Display $\hat{u}_r$, $\hat{u}_\theta$, $\hat{u}_z$ unit vectors **attached to and rotating with the particle**
- Animate the rotation of these basis vectors
- Show how $\hat{u}_r$ changes direction as particle moves

**Right Panel (Equations) — Per CH12 Notation:**

```
Unit Vector Derivatives:
  u̇_r = θ̇ û_θ
  u̇_θ = -θ̇ û_r
  u̇_z = 0

Position:     r⃗ = r û_r + z û_z

Velocity:     V⃗ = ṙ û_r + rθ̇ û_θ + ż û_z

Acceleration: a⃗ = (r̈ - rθ̇²) û_r + (rθ̈ + 2ṙθ̇) û_θ + z̈ û_z
```

```python
class Scene04_CylindricalCoordinates(ThreeDScene):
    """
    Cylindrical coordinate system.
    CRITICAL: Show that û_r and û_θ ROTATE with the particle.
    This is why velocity/acceleration have extra terms.
    Notation follows CH12: V⃗ (capital), û notation for unit vectors.
    """
    def construct(self):
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)
        
        # ===== LEFT PANEL =====
        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[0, 2, 1],
            x_length=4, y_length=4, z_length=2,
        ).shift(LEFT * 4)
        
        # Time/angle tracker
        theta_val = ValueTracker(PI/4)
        r_val = 1.5
        z_val = 0.5
        
        def get_pos():
            th = theta_val.get_value()
            return axes.c2p(
                r_val * np.cos(th),
                r_val * np.sin(th),
                z_val
            )
        
        # Rotating unit vectors (KEY VISUALIZATION)
        def get_u_r():
            th = theta_val.get_value()
            return np.array([np.cos(th), np.sin(th), 0])
        
        def get_u_theta():
            th = theta_val.get_value()
            return np.array([-np.sin(th), np.cos(th), 0])
        
        u_r_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * get_u_r(),
            color=Colors.CYL_R,
            thickness=0.03
        ))
        
        u_theta_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * get_u_theta(),
            color=Colors.CYL_THETA,
            thickness=0.03
        ))
        
        u_z_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + np.array([0, 0, 0.8]),
            color=Colors.CYL_Z,
            thickness=0.03
        ))
        
        # Radial line from z-axis to particle
        radial_line = always_redraw(lambda: Line(
            start=axes.c2p(0, 0, z_val),
            end=get_pos(),
            color=Colors.CYL_R,
            stroke_width=2
        ))
        
        # Arc showing angle theta
        theta_arc = always_redraw(lambda: Arc(
            radius=0.5,
            start_angle=0,
            angle=theta_val.get_value(),
            color=Colors.CYL_THETA,
        ).shift(axes.c2p(0, 0, z_val)))
        
        particle = always_redraw(lambda: Sphere(
            radius=0.1, color=WHITE
        ).move_to(get_pos()))
        
        # ===== RIGHT PANEL (CH12 Notation) =====
        
        title = Text("Cylindrical Coordinates", font_size=32)
        title.move_to(RIGHT * 4 + UP * 3.2)
        self.add_fixed_in_frame_mobjects(title)
        
        # Critical insight: rotating basis (from CH12 derivation)
        insight1 = MathTex(
            r"\hat{u}_r, \hat{u}_\theta \text{ rotate with particle!}",
            font_size=28,
            color=Colors.HIGHLIGHT
        )
        insight1.move_to(RIGHT * 4 + UP * 2.5)
        self.add_fixed_in_frame_mobjects(insight1)
        
        # Unit vector derivatives (CH12: u̇_r = θ̇ û_θ)
        deriv_title = Text("Unit Vector Derivatives:", font_size=24)
        deriv_title.move_to(RIGHT * 4 + UP * 1.8)
        self.add_fixed_in_frame_mobjects(deriv_title)
        
        deriv1 = MathTex(
            r"\dot{\hat{u}}_r = \dot{\theta} \hat{u}_\theta",
            font_size=30
        )
        deriv1.move_to(RIGHT * 4 + UP * 1.2)
        self.add_fixed_in_frame_mobjects(deriv1)
        
        deriv2 = MathTex(
            r"\dot{\hat{u}}_\theta = -\dot{\theta} \hat{u}_r",
            font_size=30
        )
        deriv2.move_to(RIGHT * 4 + UP * 0.6)
        self.add_fixed_in_frame_mobjects(deriv2)
        
        # Position (CH12: r⃗ = r û_r + z û_z)
        pos_eq = MathTex(
            r"\vec{r} = r\hat{u}_r + z\hat{u}_z",
            font_size=32
        )
        pos_eq.move_to(RIGHT * 4 + DOWN * 0.2)
        self.add_fixed_in_frame_mobjects(pos_eq)
        
        # Velocity (CH12: V⃗ = ṙ û_r + rθ̇ û_θ + ż û_z)
        vel_eq = MathTex(
            r"\vec{V} = ",
            r"\dot{r}\hat{u}_r",
            r" + r\dot{\theta}\hat{u}_\theta",
            r" + \dot{z}\hat{u}_z",
            font_size=30
        )
        vel_eq[1].set_color(Colors.CYL_R)
        vel_eq[2].set_color(Colors.CYL_THETA)
        vel_eq[3].set_color(Colors.CYL_Z)
        vel_eq.move_to(RIGHT * 4 + DOWN * 1.0)
        self.add_fixed_in_frame_mobjects(vel_eq)
        
        # Acceleration (CH12: a⃗ = (r̈ - rθ̇²)û_r + (rθ̈ + 2ṙθ̇)û_θ + z̈û_z)
        acc_label = MathTex(r"\vec{a} = ", font_size=30)
        acc_label.move_to(RIGHT * 4 + DOWN * 1.8)
        self.add_fixed_in_frame_mobjects(acc_label)
        
        acc_r = MathTex(
            r"(\ddot{r} - r\dot{\theta}^2)\hat{u}_r",
            font_size=26,
            color=Colors.CYL_R
        )
        acc_r.next_to(acc_label, RIGHT, buff=0.1)
        self.add_fixed_in_frame_mobjects(acc_r)
        
        acc_theta = MathTex(
            r"+ (r\ddot{\theta} + 2\dot{r}\dot{\theta})\hat{u}_\theta",
            font_size=26,
            color=Colors.CYL_THETA
        )
        acc_theta.move_to(RIGHT * 4 + DOWN * 2.4)
        self.add_fixed_in_frame_mobjects(acc_theta)
        
        acc_z = MathTex(
            r"+ \ddot{z}\hat{u}_z",
            font_size=26,
            color=Colors.CYL_Z
        )
        acc_z.next_to(acc_theta, RIGHT, buff=0.1)
        self.add_fixed_in_frame_mobjects(acc_z)
        
        # Labels for physical meaning of terms (from CH12)
        centripetal_label = MathTex(
            r"\underbrace{-r\dot{\theta}^2}_{\text{centripetal}}",
            font_size=22
        ).move_to(RIGHT * 2.5 + DOWN * 3.2)
        self.add_fixed_in_frame_mobjects(centripetal_label)
        
        coriolis_label = MathTex(
            r"\underbrace{2\dot{r}\dot{\theta}}_{\text{Coriolis}}",
            font_size=22
        ).move_to(RIGHT * 5.5 + DOWN * 3.2)
        self.add_fixed_in_frame_mobjects(coriolis_label)
        
        # ===== ANIMATION SEQUENCE =====
        
        self.play(Create(axes), run_time=1)
        self.play(Write(title))
        self.wait(0.5)
        
        # Add particle and radial line
        self.add(particle, radial_line, theta_arc)
        self.wait(0.5)
        
        # Show rotating unit vectors (KEY MOMENT)
        self.play(Write(insight1))
        self.wait(0.5)
        
        self.play(
            Create(u_r_vec),
            Create(u_theta_vec),
            Create(u_z_vec),
            run_time=1.5
        )
        
        # Animate rotation to show unit vectors rotate
        self.play(
            theta_val.animate.set_value(PI/4 + PI/2),
            run_time=3,
            rate_func=smooth
        )
        self.wait(0.5)
        
        # Write unit vector derivatives
        self.play(Write(deriv_title))
        self.play(Write(deriv1))
        self.play(Write(deriv2))
        self.wait(1)
        
        # Write position
        self.play(Write(pos_eq))
        self.wait(0.5)
        
        # Write velocity
        self.play(Write(vel_eq))
        self.wait(0.5)
        
        # Write acceleration (piece by piece)
        self.play(Write(acc_label))
        self.play(Write(acc_r))
        self.play(Write(acc_theta))
        self.play(Write(acc_z))
        self.wait(0.5)
        
        # Highlight physical meaning
        self.play(
            Write(centripetal_label),
            Write(coriolis_label),
            run_time=1.5
        )
        
        # Continue animating to show vectors updating
        self.play(
            theta_val.animate.set_value(PI/4 + 2*PI),
            run_time=5,
            rate_func=linear
        )
        self.wait(2)
```

---

### Scene 5: Normal-Tangential (Path) Coordinates

**Purpose:** Derive position, velocity, and acceleration in intrinsic/path coordinates.

**Duration:** ~120 seconds

**Key Pedagogical Points (from CH12 Section 4.2):**
- Unit vectors are defined by the **path geometry**, not a fixed coordinate system
- $\hat{u}_t$ is always tangent to the path (velocity direction)
- $\hat{u}_n$ points toward the center of curvature O' (always perpendicular to $\hat{u}_t$)
- The radius of curvature $\rho$ naturally appears
- The curve is constructed from differential arc segments $ds$

**Left Panel (3D):**
- Show particle on curved path
- Display $\hat{u}_t$, $\hat{u}_n$ unit vectors **attached to particle, aligned with path**
- Show the osculating circle (circle of curvature) with center O' and radius $\rho$
- Animate how $\hat{u}_n$ always points toward center of curvature

**Right Panel (Equations) — Per CH12 Notation:**

```
Arc Length Relation:  ds = ρ dθ  →  ṡ = ρθ̇

Velocity:     V⃗ = v û_t = ṡ û_t     (speed times tangent)
             where v = |dr⃗/dt| = ds/dt = ṡ

Acceleration: a⃗ = a_t û_t + a_n û_n

             a_t = v̇ = s̈  (tangential - speed change)
             a_n = ṡ²/ρ = v²/ρ  (normal - direction change)
```

```python
class Scene05_NormalTangentialCoordinates(ThreeDScene):
    """
    Normal-tangential (path/intrinsic) coordinates.
    Unit vectors are defined by PATH GEOMETRY.
    Notation follows CH12 Section 4.2: û_t, û_n, ρ, v = ṡ
    """
    def construct(self):
        self.set_camera_orientation(phi=75*DEGREES, theta=-30*DEGREES)
        
        # ===== LEFT PANEL =====
        axes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-1, 2, 1],
            x_length=5, y_length=5, z_length=2.5,
        ).shift(LEFT * 3.5)
        
        # Use a curve with varying curvature (spiral/helix)
        def path_func(s):
            # Parameterized by arc length approximation
            return np.array([
                2 * np.cos(s),
                2 * np.sin(s),
                0.2 * s
            ])
        
        def tangent_vec(s):
            # Derivative of path (û_t direction)
            raw = np.array([
                -2 * np.sin(s),
                2 * np.cos(s),
                0.2
            ])
            return raw / np.linalg.norm(raw)
        
        def normal_vec(s):
            # Points toward center of curvature (û_n direction)
            # For helix, normal is radially inward
            raw = np.array([
                -np.cos(s),
                -np.sin(s),
                0
            ])
            return raw / np.linalg.norm(raw)
        
        def binormal_vec(s):
            return np.cross(tangent_vec(s), normal_vec(s))
        
        # Path
        path_curve = ParametricFunction(
            lambda s: axes.c2p(*path_func(s)[:3]) + LEFT * 3.5,
            t_range=[0, 3*PI],
            color=Colors.PATH,
            stroke_width=2
        )
        
        # Arc length parameter tracker
        s = ValueTracker(PI)
        
        def get_pos():
            return axes.c2p(*path_func(s.get_value()))
        
        particle = always_redraw(lambda: Sphere(
            radius=0.1, color=WHITE
        ).move_to(get_pos()))
        
        # Tangent vector (û_t)
        u_t = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * tangent_vec(s.get_value()),
            color=Colors.PATH_T,
            thickness=0.03
        ))
        
        # Normal vector (û_n)
        u_n = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * normal_vec(s.get_value()),
            color=Colors.PATH_N,
            thickness=0.03
        ))
        
        # Binormal vector (û_b) - optional for 3D
        u_b = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * binormal_vec(s.get_value()),
            color=Colors.PATH_B,
            thickness=0.03
        ))
        
        # Osculating circle (radius of curvature ρ)
        rho = 2  # For helix, radius of curvature
        osc_circle = always_redraw(lambda: Circle(
            radius=0.5,  # Scaled for display
            color=Colors.PATH_N,
            stroke_width=1,
            stroke_opacity=0.5
        ).move_to(get_pos() + 0.5 * normal_vec(s.get_value())))
        
        # ===== RIGHT PANEL (CH12 Notation) =====
        
        title = Text("Normal and Tangential Components", font_size=28)
        title.move_to(RIGHT * 4 + UP * 3.2)
        self.add_fixed_in_frame_mobjects(title)
        
        subtitle = Text("(n-t Coordinates, Path Coordinates)", font_size=20, color=GRAY)
        subtitle.move_to(RIGHT * 4 + UP * 2.7)
        self.add_fixed_in_frame_mobjects(subtitle)
        
        # Key insight (from CH12)
        insight = MathTex(
            r"\text{Basis defined by } \textbf{path geometry}",
            font_size=26,
            color=Colors.HIGHLIGHT
        )
        insight.move_to(RIGHT * 4 + UP * 2.1)
        self.add_fixed_in_frame_mobjects(insight)
        
        # Unit vector definitions (CH12 notation: û_t, û_n)
        u_t_def = MathTex(
            r"\hat{u}_t = \text{tangent (direction of motion)}",
            font_size=24
        )
        u_t_def[0][:3].set_color(Colors.PATH_T)
        u_t_def.move_to(RIGHT * 4 + UP * 1.4)
        self.add_fixed_in_frame_mobjects(u_t_def)
        
        u_n_def = MathTex(
            r"\hat{u}_n = \text{normal (toward center O')}",
            font_size=24
        )
        u_n_def[0][:3].set_color(Colors.PATH_N)
        u_n_def.move_to(RIGHT * 4 + UP * 0.9)
        self.add_fixed_in_frame_mobjects(u_n_def)
        
        # Arc length relation (CH12: ds = ρ dθ)
        arc_eq = MathTex(
            r"ds = \rho \, d\theta \quad \Rightarrow \quad \dot{s} = \rho \dot{\theta}",
            font_size=26
        )
        arc_eq.move_to(RIGHT * 4 + UP * 0.3)
        self.add_fixed_in_frame_mobjects(arc_eq)
        
        # Velocity (CH12: V⃗ = v û = ṡ û)
        vel_title = Text("Velocity:", font_size=24)
        vel_title.move_to(RIGHT * 4 + DOWN * 0.4)
        self.add_fixed_in_frame_mobjects(vel_title)
        
        vel_eq = MathTex(
            r"\vec{V} = v \hat{u}_t = \dot{s} \hat{u}_t",
            font_size=32
        )
        vel_eq.move_to(RIGHT * 4 + DOWN * 0.9)
        self.add_fixed_in_frame_mobjects(vel_eq)
        
        speed_eq = MathTex(
            r"v = \left|\frac{d\vec{r}}{dt}\right| = \frac{ds}{dt} = \dot{s}",
            font_size=26
        )
        speed_eq.move_to(RIGHT * 4 + DOWN * 1.5)
        self.add_fixed_in_frame_mobjects(speed_eq)
        
        # Acceleration (CH12: a⃗ = a_t û_t + a_n û_n)
        acc_title = Text("Acceleration:", font_size=24)
        acc_title.move_to(RIGHT * 4 + DOWN * 2.1)
        self.add_fixed_in_frame_mobjects(acc_title)
        
        acc_eq = MathTex(
            r"\vec{a} = ",
            r"a_t",
            r"\hat{u}_t",
            r" + ",
            r"a_n",
            r"\hat{u}_n",
            font_size=30
        )
        acc_eq[1].set_color(Colors.PATH_T)
        acc_eq[2].set_color(Colors.PATH_T)
        acc_eq[4].set_color(Colors.PATH_N)
        acc_eq[5].set_color(Colors.PATH_N)
        acc_eq.move_to(RIGHT * 4 + DOWN * 2.6)
        self.add_fixed_in_frame_mobjects(acc_eq)
        
        # Component formulas (CH12: a_t = v̇ = s̈, a_n = ṡ²/ρ = v²/ρ)
        components = VGroup(
            MathTex(r"a_t = \dot{v} = \ddot{s}", font_size=24, color=Colors.PATH_T),
            MathTex(r"a_n = \frac{\dot{s}^2}{\rho} = \frac{v^2}{\rho}", font_size=24, color=Colors.PATH_N),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        components.move_to(RIGHT * 4 + DOWN * 3.4)
        self.add_fixed_in_frame_mobjects(components)
        
        # ===== ANIMATION SEQUENCE =====
        
        self.play(Create(axes), run_time=1)
        self.play(Write(title), Write(subtitle))
        self.play(Create(path_curve), run_time=1.5)
        self.add(particle)
        self.wait(0.5)
        
        # Show insight
        self.play(Write(insight))
        self.wait(0.5)
        
        # Add basis vectors one by one
        self.play(Create(u_t), Write(u_t_def))
        self.wait(0.3)
        self.play(Create(u_n), Write(u_n_def))
        self.wait(0.3)
        self.play(Create(u_b))
        self.wait(0.5)
        
        # Show osculating circle (center of curvature)
        self.add(osc_circle)
        self.wait(0.5)
        
        # Write arc length relation
        self.play(Write(arc_eq))
        self.wait(0.5)
        
        # Write velocity
        self.play(Write(vel_title), Write(vel_eq))
        self.play(Write(speed_eq))
        self.wait(0.5)
        
        # Write acceleration
        self.play(Write(acc_title), Write(acc_eq))
        self.wait(0.5)
        self.play(Write(components))
        self.wait(0.5)
        
        # Animate along path to show basis rotating with path
        self.play(
            s.animate.set_value(2.5*PI),
            run_time=6,
            rate_func=linear
        )
        self.wait(2)
```

---

### Scene 6: Comparison and Summary

**Purpose:** Side-by-side comparison of all three systems.

**Duration:** ~60 seconds

**Layout:** Three-column comparison using CH12 notation

```python
class Scene06_ComparisonSummary(Scene):
    """
    Side-by-side comparison of all three coordinate systems.
    When to use each system.
    Uses CH12 notation: V⃗ (capital), û notation for unit vectors.
    """
    def construct(self):
        # Title
        title = Text("Coordinate System Comparison", font_size=36)
        title.to_edge(UP)
        
        # Three columns
        col_width = 4.5
        
        # Column 1: Rectangular (CH12 Section 4.1)
        rect_title = Text("Rectangular", font_size=28, color=Colors.RECT_X)
        rect_title.move_to(LEFT * 4.5 + UP * 2.3)
        
        rect_eqs = VGroup(
            MathTex(r"\vec{r} = x\hat{i} + y\hat{j} + z\hat{k}", font_size=24),
            MathTex(r"\vec{V} = V_x\hat{i} + V_y\hat{j} + V_z\hat{k}", font_size=24),
            MathTex(r"\vec{a} = \ddot{x}\hat{i} + \ddot{y}\hat{j} + \ddot{z}\hat{k}", font_size=24),
        ).arrange(DOWN, buff=0.3)
        rect_eqs.move_to(LEFT * 4.5 + UP * 0.5)
        
        rect_use = Text("Use when:\n• Straight-line motion\n• Known x(t), y(t), z(t)\n• Projectile motion", 
                       font_size=18, line_spacing=1.3)
        rect_use.move_to(LEFT * 4.5 + DOWN * 1.8)
        
        # Column 2: Cylindrical (CH12 Section 4.3)
        cyl_title = Text("Cylindrical", font_size=28, color=Colors.CYL_R)
        cyl_title.move_to(UP * 2.3)
        
        cyl_eqs = VGroup(
            MathTex(r"\vec{r} = r\hat{u}_r + z\hat{u}_z", font_size=24),
            MathTex(r"\vec{V} = \dot{r}\hat{u}_r + r\dot{\theta}\hat{u}_\theta + \dot{z}\hat{u}_z", font_size=22),
            MathTex(r"\vec{a} = (\ddot{r} - r\dot{\theta}^2)\hat{u}_r + ...", font_size=22),
        ).arrange(DOWN, buff=0.3)
        cyl_eqs.move_to(UP * 0.5)
        
        cyl_use = Text("Use when:\n• Circular/spiral motion\n• Rotational symmetry\n• Angular data given", 
                      font_size=18, line_spacing=1.3)
        cyl_use.move_to(DOWN * 1.8)
        
        # Column 3: Normal-Tangential (CH12 Section 4.2)
        nt_title = Text("Normal-Tangential", font_size=28, color=Colors.PATH_T)
        nt_title.move_to(RIGHT * 4.5 + UP * 2.3)
        
        nt_eqs = VGroup(
            MathTex(r"\vec{V} = v\hat{u}_t = \dot{s}\hat{u}_t", font_size=24),
            MathTex(r"\vec{a} = \dot{v}\hat{u}_t + \frac{v^2}{\rho}\hat{u}_n", font_size=24),
        ).arrange(DOWN, buff=0.3)
        nt_eqs.move_to(RIGHT * 4.5 + UP * 0.7)
        
        nt_use = Text("Use when:\n• Known path shape\n• Focus on speed/curvature\n• ρ is given or calculable", 
                     font_size=18, line_spacing=1.3)
        nt_use.move_to(RIGHT * 4.5 + DOWN * 1.8)
        
        # Dividing lines
        line1 = Line(UP * 2.8 + LEFT * 2.2, DOWN * 2.8 + LEFT * 2.2, color=GRAY, stroke_width=1)
        line2 = Line(UP * 2.8 + RIGHT * 2.2, DOWN * 2.8 + RIGHT * 2.2, color=GRAY, stroke_width=1)
        
        # Animation
        self.play(Write(title))
        self.play(Create(line1), Create(line2))
        
        # Column 1
        self.play(Write(rect_title))
        self.play(Write(rect_eqs), run_time=1.5)
        self.play(Write(rect_use))
        
        # Column 2
        self.play(Write(cyl_title))
        self.play(Write(cyl_eqs), run_time=1.5)
        self.play(Write(cyl_use))
        
        # Column 3
        self.play(Write(nt_title))
        self.play(Write(nt_eqs), run_time=1.5)
        self.play(Write(nt_use))
        
        self.wait(3)
        
        # Key takeaway
        takeaway = Text(
            "Choose the coordinate system that matches your problem's symmetry!",
            font_size=28,
            color=Colors.HIGHLIGHT
        )
        takeaway.to_edge(DOWN)
        self.play(Write(takeaway))
        self.wait(2)
```

---

## Technical Specifications

### Rendering Settings

```bash
# For preview during development
manim -pql curvilinear_kinematics.py Scene01_Introduction

# For final production (1080p)
manim -pqh curvilinear_kinematics.py Scene01_Introduction

# For 4K output
manim -pqk curvilinear_kinematics.py Scene01_Introduction
```

### Output Structure

Generate each scene as a separate video file:
```
output/
├── Scene01_Introduction.mp4
├── Scene02_LayoutSetup.mp4
├── Scene03_RectangularCoordinates.mp4
├── Scene04_CylindricalCoordinates.mp4
├── Scene05_NormalTangentialCoordinates.mp4
└── Scene06_ComparisonSummary.mp4
```

### Timing Summary

| Scene | Duration | Content Focus |
|-------|----------|---------------|
| 1 | ~30s | Visual hook, particle motion |
| 2 | ~15s | Layout transition |
| 3 | ~90s | Rectangular coordinates derivation |
| 4 | ~120s | Cylindrical coordinates (rotating basis) |
| 5 | ~120s | Normal-tangential (path geometry) |
| 6 | ~60s | Summary and comparison |
| **Total** | **~7-8 min** | |

---

## Animation Checklist

Before finalizing each scene, verify:

### Visual Quality
- [ ] Background color is `#1C1C1C`
- [ ] Colors are consistent with the palette
- [ ] Vectors have appropriate stroke width (3-5)
- [ ] Labels are readable but not dominant
- [ ] 3D camera angle shows depth clearly

### Pedagogical Flow
- [ ] Visual demonstration precedes mathematical formalization
- [ ] Key insights are highlighted with boxes/colors
- [ ] Physical interpretation accompanies each term
- [ ] Pauses allow processing time (0.5-2s depending on complexity)

### Technical Accuracy
- [ ] All equations are dimensionally correct
- [ ] Unit vector derivatives are accurate
- [ ] Velocity/acceleration expressions match standard textbooks
- [ ] Vector directions in 3D visualization match equations

### Animation Rhythm
- [ ] No animation is faster than 0.5s
- [ ] Complex derivations unfold piece by piece
- [ ] Camera movements are smooth (rate=0.1-0.2 for rotation)
- [ ] Final pause before scene end (~2s)

---

## Helper Functions

Include these utilities in a shared module:

```python
# shared/physics_helpers.py
# Helper functions using CH12 notation conventions

from manim import *
import numpy as np

def create_3d_vector(start, end, color, thickness=0.04, label=None):
    """Create a labeled 3D vector (e.g., r⃗, V⃗, a⃗)."""
    vec = Arrow3D(start=start, end=end, color=color, thickness=thickness)
    if label:
        label_obj = MathTex(label, color=color, font_size=24)
        label_obj.next_to(vec.get_end(), UP + RIGHT, buff=0.1)
        return VGroup(vec, label_obj)
    return vec

def create_unit_vector_triad(origin, u1, u2, u3, colors, labels, scale=0.8):
    """
    Create a triad of unit vectors at a given origin.
    CH12 notation: û_r, û_θ, û_z for cylindrical
                   û_t, û_n for n-t coordinates
                   î, ĵ, k̂ for rectangular
    """
    arrows = VGroup()
    for direction, color, label in zip([u1, u2, u3], colors, labels):
        arrow = Arrow3D(
            start=origin,
            end=origin + scale * direction,
            color=color,
            thickness=0.03
        )
        arrows.add(arrow)
    return arrows

def helix_path(t, radius=2, pitch=0.3):
    """
    Standard helix parameterization.
    r⃗(t) = (R·cos(t), R·sin(t), c·t)
    """
    return np.array([
        radius * np.cos(t),
        radius * np.sin(t),
        pitch * t
    ])

def helix_velocity(t, radius=2, pitch=0.3):
    """
    Velocity vector for helix: V⃗ = dr⃗/dt
    CH12: Capital V for velocity vector
    """
    return np.array([
        -radius * np.sin(t),
        radius * np.cos(t),
        pitch
    ])

def helix_acceleration(t, radius=2, pitch=0.3):
    """
    Acceleration vector for helix: a⃗ = dV⃗/dt
    For helix: purely centripetal (points toward z-axis)
    """
    return np.array([
        -radius * np.cos(t),
        -radius * np.sin(t),
        0
    ])

def cylindrical_basis(theta):
    """
    Return û_r, û_θ, û_z for given angle θ.
    CH12 Section 4.3 notation.
    Note: These rotate with the particle!
    """
    u_r = np.array([np.cos(theta), np.sin(theta), 0])
    u_theta = np.array([-np.sin(theta), np.cos(theta), 0])
    u_z = np.array([0, 0, 1])
    return u_r, u_theta, u_z

def normal_tangential_basis(tangent):
    """
    Given a tangent vector, return n-t basis (û_t, û_n, û_b).
    CH12 Section 4.2 notation.
    Note: Full implementation requires curvature calculation.
    """
    u_t = tangent / np.linalg.norm(tangent)
    # Approximate normal (assuming roughly planar motion)
    if abs(u_t[2]) < 0.9:
        u_n = np.cross(np.array([0, 0, 1]), u_t)
    else:
        u_n = np.cross(np.array([1, 0, 0]), u_t)
    u_n = u_n / np.linalg.norm(u_n)
    u_b = np.cross(u_t, u_n)
    return u_t, u_n, u_b

def radius_of_curvature(y_func, x):
    """
    Calculate radius of curvature ρ from path y = f(x).
    CH12 formula: ρ = [1 + (dy/dx)²]^(3/2) / |d²y/dx²|
    """
    import scipy.misc as misc
    dy_dx = misc.derivative(y_func, x, dx=1e-6, n=1)
    d2y_dx2 = misc.derivative(y_func, x, dx=1e-6, n=2)
    if abs(d2y_dx2) < 1e-10:
        return float('inf')
    return (1 + dy_dx**2)**(3/2) / abs(d2y_dx2)
```

---

## Final Notes for AI Agent

1. **Generate complete, runnable code** for each scene class
2. **Test each scene independently** before combining
3. **Prioritize pedagogical clarity** over visual complexity
4. **Ensure all LaTeX compiles** correctly (escape backslashes)
5. **Use `always_redraw()` liberally** for dynamic elements
6. **Add `self.add_fixed_in_frame_mobjects()`** for all 2D elements in 3D scenes
7. **Include brief comments** explaining non-obvious code sections
8. **CRITICAL: Follow CH12 notation exactly:**
   - Velocity vector: $\vec{V}$ (capital V), magnitude $v$ (lowercase)
   - Acceleration vector: $\vec{a}$ (lowercase)
   - Unit vectors: $\hat{u}_r$, $\hat{u}_\theta$, $\hat{u}_t$, $\hat{u}_n$ (hat with subscript)
   - Cartesian: $\hat{i}$, $\hat{j}$, $\hat{k}$
   - Time derivatives: $\dot{r}$, $\ddot{r}$, $\dot{\theta}$, $\ddot{\theta}$ (dot notation)
   - Radius of curvature: $\rho$
   - Arc length: $s$, with $\dot{s} = v$

The goal is an animation that a student can watch and gain genuine intuition for why different coordinate systems exist and when each is useful—not just memorize formulas. The notation must match exactly what students see in CH12 course notes.
