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

**Left Panel (3D):**
- Show particle on curved path
- Display $\hat{i}$, $\hat{j}$, $\hat{k}$ unit vectors (fixed basis)
- Animate position vector decomposed into x, y, z components
- Show velocity vector $\vec{V}$ (tangent to path)
- Show acceleration vector $\vec{a}$

**Right Panel (Equations) — Per CH12 Notation:**

```
Position:     r⃗(t) = x(t)î + y(t)ĵ + z(t)k̂

Velocity:     V⃗ = dr⃗/dt = (dx/dt)î + (dy/dt)ĵ + (dz/dt)k̂ = Vₓî + Vyĵ + Vzk̂

Acceleration: a⃗ = dV⃗/dt = ẍî + ÿĵ + z̈k̂ = aₓî + ayĵ + azk̂
```

**Key Point from CH12:** Unit vectors $\hat{i}$, $\hat{j}$, $\hat{k}$ are **FIXED** — their time derivatives are zero.

```python
class Scene03_RectangularCoordinates(ThreeDScene):
    """
    Rectangular coordinate system derivation.
    Key insight: Unit vectors î, ĵ, k̂ are FIXED in space.
    Notation follows CH12: V⃗ (capital), v (magnitude), a⃗ (acceleration)
    """
    def construct(self):
        # ===== LEFT PANEL: 3D Visualization =====
        # Scale and shift 3D content to left half
        
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)
        
        # Smaller axes for left panel
        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[-1, 2, 1],
            x_length=4, y_length=4, z_length=3,
        ).shift(LEFT * 4)
        
        # Unit vectors (FIXED - this is the key point)
        i_hat = Arrow3D(
            start=axes.c2p(0,0,0),
            end=axes.c2p(1,0,0),
            color=Colors.RECT_X,
            thickness=0.03
        )
        j_hat = Arrow3D(
            start=axes.c2p(0,0,0),
            end=axes.c2p(0,1,0),
            color=Colors.RECT_Y,
            thickness=0.03
        )
        k_hat = Arrow3D(
            start=axes.c2p(0,0,0),
            end=axes.c2p(0,0,1),
            color=Colors.RECT_Z,
            thickness=0.03
        )
        
        # Path on left panel (scaled helix)
        def helix_left(t):
            return axes.c2p(
                1.5 * np.cos(t),
                1.5 * np.sin(t),
                0.2 * t
            )
        
        path = ParametricFunction(
            lambda t: np.array([
                -4 + 1.5 * np.cos(t),
                1.5 * np.sin(t),
                0.2 * t
            ]),
            t_range=[0, 3*PI],
            color=Colors.PATH,
            stroke_width=2
        )
        
        t = ValueTracker(PI/2)  # Start at interesting position
        
        # Position vector with components
        def get_pos():
            _t = t.get_value()
            return np.array([
                -4 + 1.5 * np.cos(_t),
                1.5 * np.sin(_t),
                0.2 * _t
            ])
        
        position_vec = always_redraw(lambda: Arrow3D(
            start=axes.c2p(0,0,0),
            end=get_pos(),
            color=Colors.POSITION,
            thickness=0.04
        ))
        
        # Component lines (dashed)
        x_component = always_redraw(lambda: DashedLine(
            start=axes.c2p(0,0,0),
            end=np.array([-4 + 1.5*np.cos(t.get_value()), 0, 0]),
            color=Colors.RECT_X,
            stroke_width=2
        ))
        
        # Velocity vector (derivative) - using V⃗ notation
        def get_vel():
            _t = t.get_value()
            return 0.5 * np.array([
                -1.5 * np.sin(_t),
                1.5 * np.cos(_t),
                0.2
            ])
        
        velocity_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + get_vel(),
            color=Colors.VELOCITY,
            thickness=0.03
        ))
        
        # Acceleration vector
        def get_acc():
            _t = t.get_value()
            return 0.3 * np.array([
                -1.5 * np.cos(_t),
                -1.5 * np.sin(_t),
                0
            ])
        
        accel_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + get_acc(),
            color=Colors.ACCELERATION,
            thickness=0.03
        ))
        
        particle = always_redraw(lambda: Sphere(
            radius=0.1, color=WHITE
        ).move_to(get_pos()))
        
        # ===== RIGHT PANEL: Equations (CH12 Notation) =====
        
        # Title
        title = Text("Rectangular Coordinates", font_size=32, color=WHITE)
        title.move_to(RIGHT * 4 + UP * 3)
        self.add_fixed_in_frame_mobjects(title)
        
        # Position equation (CH12 style: x(t)î + y(t)ĵ + z(t)k̂)
        pos_eq = MathTex(
            r"\vec{r}(t) = ",
            r"x(t)", r"\hat{i}", r" + ",
            r"y(t)", r"\hat{j}", r" + ",
            r"z(t)", r"\hat{k}",
            font_size=36
        )
        pos_eq[1].set_color(Colors.RECT_X)
        pos_eq[2].set_color(Colors.RECT_X)
        pos_eq[4].set_color(Colors.RECT_Y)
        pos_eq[5].set_color(Colors.RECT_Y)
        pos_eq[7].set_color(Colors.RECT_Z)
        pos_eq[8].set_color(Colors.RECT_Z)
        pos_eq.move_to(RIGHT * 4 + UP * 1.5)
        self.add_fixed_in_frame_mobjects(pos_eq)
        
        # Key insight box
        insight = VGroup(
            Text("Key Insight:", font_size=24, color=Colors.HIGHLIGHT),
            MathTex(
                r"\hat{i}, \hat{j}, \hat{k} \text{ are } \textbf{fixed}",
                font_size=28
            )
        ).arrange(DOWN, buff=0.2)
        insight.move_to(RIGHT * 4 + UP * 0.3)
        insight_box = SurroundingRectangle(insight, color=Colors.HIGHLIGHT, buff=0.2)
        self.add_fixed_in_frame_mobjects(insight, insight_box)
        
        # Velocity derivation (CH12: V⃗ with capital V, components Vx, Vy, Vz)
        vel_eq1 = MathTex(
            r"\vec{V} = \frac{d\vec{r}}{dt}",
            font_size=36
        )
        vel_eq1.move_to(RIGHT * 4 + DOWN * 0.8)
        self.add_fixed_in_frame_mobjects(vel_eq1)
        
        vel_eq2 = MathTex(
            r"\vec{V} = ",
            r"V_x", r"\hat{i}", r" + ",
            r"V_y", r"\hat{j}", r" + ",
            r"V_z", r"\hat{k}",
            font_size=36
        )
        vel_eq2[1].set_color(Colors.RECT_X)
        vel_eq2[4].set_color(Colors.RECT_Y)
        vel_eq2[7].set_color(Colors.RECT_Z)
        vel_eq2.move_to(RIGHT * 4 + DOWN * 1.6)
        self.add_fixed_in_frame_mobjects(vel_eq2)
        
        # Acceleration (CH12: a⃗ = ẍî + ÿĵ + z̈k̂)
        acc_eq = MathTex(
            r"\vec{a} = ",
            r"\ddot{x}", r"\hat{i}", r" + ",
            r"\ddot{y}", r"\hat{j}", r" + ",
            r"\ddot{z}", r"\hat{k}",
            font_size=36
        )
        acc_eq[1].set_color(Colors.RECT_X)
        acc_eq[4].set_color(Colors.RECT_Y)
        acc_eq[7].set_color(Colors.RECT_Z)
        acc_eq.move_to(RIGHT * 4 + DOWN * 2.8)
        self.add_fixed_in_frame_mobjects(acc_eq)
        
        # ===== ANIMATION SEQUENCE =====
        
        # 1. Show axes and unit vectors
        self.play(Create(axes), run_time=1)
        self.play(
            Create(i_hat), Create(j_hat), Create(k_hat),
            Write(title),
            run_time=1.5
        )
        self.wait(0.5)
        
        # 2. Show path and particle
        self.play(Create(path), run_time=1)
        self.add(particle, position_vec)
        self.wait(0.5)
        
        # 3. Write position equation
        self.play(Write(pos_eq), run_time=2)
        self.wait(1)
        
        # 4. Highlight fixed unit vectors
        self.play(
            Create(insight_box),
            Write(insight),
            run_time=1.5
        )
        self.wait(1)
        
        # 5. Derive velocity
        self.play(Write(vel_eq1))
        self.wait(0.5)
        self.play(Write(vel_eq2))
        self.add(velocity_vec)
        self.wait(1)
        
        # 6. Derive acceleration
        self.play(Write(acc_eq))
        self.add(accel_vec)
        self.wait(1)
        
        # 7. Animate motion to show vectors updating
        self.play(
            t.animate.set_value(2.5*PI),
            run_time=5,
            rate_func=linear
        )
        self.wait(2)
```

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
