# The 3Blue1Brown Animation Style Guide for Engineering Physics

## A Comprehensive Framework for Creating Manim Animations in Kinematics, Dynamics, Electromagnetic Fields, Vibrations, and Engineering Physics

---

## Table of Contents

1. [Philosophy and Pedagogy](#1-philosophy-and-pedagogy)
2. [The Manim Ecosystem](#2-the-manim-ecosystem)
3. [Visual Aesthetic: The 3B1B Look](#3-visual-aesthetic-the-3b1b-look)
4. [Animation Rhythm and Pacing](#4-animation-rhythm-and-pacing)
5. [Equation Animation Techniques](#5-equation-animation-techniques)
6. [Vector Fields and Flow Visualization](#6-vector-fields-and-flow-visualization)
7. [3D Scenes for Engineering Physics](#7-3d-scenes-for-engineering-physics)
8. [Course-Specific Implementation](#8-course-specific-implementation)
9. [Production Workflow](#9-production-workflow)
10. [Code Templates and Patterns](#10-code-templates-and-patterns)

---

## 1. Philosophy and Pedagogy

### 1.1 The Core Principle: Inventing Math

Grant Sanderson describes his approach as **"inventing math"**—a process of discovery and inquiry-based learning. The viewer should feel as though they are discovering concepts alongside the narrator, not being lectured at.

> *"The goal is for explanations to be driven by animations and for difficult problems to be made simple with changes in perspective."*  
> — 3Blue1Brown

### 1.2 Inversion of Traditional Teaching

**The 3B1B pedagogical inversion:**

| Traditional Approach | 3B1B Approach |
|---------------------|---------------|
| Start with definition | Start with motivating example |
| Abstract → Concrete | Concrete → Abstract |
| Formula first | Visual intuition first |
| "Here's what it is" | "Here's why you'd care" |

**For Engineering Physics:**
- Begin with a **physical phenomenon** (a swinging pendulum, a charged particle, a vibrating string)
- Let the viewer **see the behavior** before naming it
- Introduce mathematics as a **language to describe** what they've already witnessed
- End with the formal definition as a **conclusion**, not a starting point

### 1.3 Storytelling in Mathematics

Treat mathematical concepts as **characters in a story**:

- **Introduce characters gradually** (variables, constants, operators)
- **Build relationships** (how does changing one variable affect another?)
- **Create tension** (what happens at boundaries? What if we push to extremes?)
- **Deliver a climax** (the "aha!" moment when concepts combine)
- **Resolve** (the generalized principle emerges)

### 1.4 The Visual Hook

Every video needs a **visual hook**—an image or animation that:
- Sparks curiosity
- Represents the core concept
- Is referenced throughout
- Pays off at the end

**Engineering Physics Examples:**
- Kinematics: A ball tracing a parabola with velocity vectors continuously updating
- Dynamics: Phase space trajectories converging to attractors
- EM Fields: Field lines bending around conductors
- Vibrations: Standing waves emerging from interference

---

## 2. The Manim Ecosystem

### 2.1 Choosing Your Version

| Version | Package Name | Best For | Documentation |
|---------|-------------|----------|---------------|
| **ManimGL** | `manimgl` | 3B1B-exact style, OpenGL rendering, interactive preview | [3b1b.github.io/manim](https://3b1b.github.io/manim) |
| **Manim Community** | `manim` | Better documentation, stability, community support | [docs.manim.community](https://docs.manim.community) |

**Recommendation for Course Development:** Start with Manim Community Edition for its superior documentation and stability. Migrate specific scenes to ManimGL if you need exact 3B1B aesthetics.

### 2.2 Installation

```bash
# Manim Community Edition
pip install manim

# ManimGL (3Blue1Brown's version)
pip install manimgl
```

**Requirements:**
- Python 3.7+
- FFmpeg
- LaTeX distribution (for equation rendering)
- OpenGL (for ManimGL)

### 2.3 Project Structure

```
engineering_physics_animations/
├── custom_config.yml          # Global style settings
├── shared/
│   ├── colors.py              # Consistent color palette
│   ├── styles.py              # Reusable formatting
│   └── physics_mobjects.py    # Custom physics objects
├── kinematics/
│   ├── projectile_motion.py
│   ├── circular_motion.py
│   └── relative_velocity.py
├── dynamics/
│   ├── newtons_laws.py
│   ├── work_energy.py
│   └── momentum.py
├── electromagnetics/
│   ├── coulombs_law.py
│   ├── electric_fields.py
│   └── magnetic_fields.py
└── vibrations/
    ├── simple_harmonic.py
    ├── damped_oscillations.py
    └── wave_equation.py
```

---

## 3. Visual Aesthetic: The 3B1B Look

### 3.1 The Dark Background Philosophy

The signature 3B1B look uses a **dark gray/blue-black background** (`#1C1C1C` to `#262626`), not pure black. This:
- Reduces eye strain
- Makes colors pop without harsh contrast
- Creates depth and sophistication
- Feels like a digital chalkboard

```python
# Setting background color
from manim import *

config.background_color = "#1C1C1C"  # Dark gray, not pure black
```

### 3.2 The Color Palette

The 3B1B palette emphasizes **jewel tones** against the dark background:

| Color Name | Hex Code | Use Case |
|-----------|----------|----------|
| **Primary Blue** | `#58C4DD` (BLUE_C) | Main elements, positive quantities |
| **Teal** | `#5CD0B3` (TEAL) | Secondary elements, fields |
| **Yellow** | `#FFFF00` (YELLOW) | Highlights, emphasis |
| **Gold** | `#F0AC00` | Important variables |
| **Red** | `#FC6255` (RED) | Negative quantities, warnings |
| **Green** | `#83C167` (GREEN) | Growth, positive change |
| **Purple** | `#9A72AC` (PURPLE) | Tertiary elements |
| **White** | `#FFFFFF` (WHITE) | Text, axes, labels |
| **Gray** | `#888888` (GRAY) | De-emphasized elements |

**Color Principles:**
1. **Semantic consistency**: Once a color represents a concept, keep it throughout
2. **Limited palette per scene**: 3-4 colors maximum
3. **High saturation**: Rich, vibrant colors against dark backgrounds
4. **Gradual transitions**: Animate color changes smoothly

```python
# Custom color scheme for physics
class PhysicsColors:
    VELOCITY = "#58C4DD"      # Blue
    ACCELERATION = "#FC6255"  # Red
    FORCE = "#FFFF00"         # Yellow
    ENERGY = "#83C167"        # Green
    ELECTRIC = "#FFD700"      # Gold
    MAGNETIC = "#9A72AC"      # Purple
    FIELD_LINES = "#5CD0B3"   # Teal
```

### 3.3 Typography

**Equations:** LaTeX via `MathTex` or `Tex`
```python
equation = MathTex(r"\vec{F} = m\vec{a}", font_size=48)
```

**Text:** Clean sans-serif (default) or with specific font
```python
label = Text("Velocity", font_size=24, color=WHITE)
```

**Design Principles:**
- Equations are heroes—give them space
- Labels are supporting characters—keep them small but readable
- Avoid clutter—one concept per frame

### 3.4 Line Weights and Strokes

| Element | Stroke Width | Notes |
|---------|-------------|-------|
| Vectors/Arrows | 4-6 | Bold, prominent |
| Axes | 2-3 | Visible but not dominant |
| Grid lines | 1-2 | Subtle reference |
| Curves/Graphs | 3-4 | Clear trajectory |
| Field lines | 2-3 | Suggest flow |

```python
arrow = Arrow(start=ORIGIN, end=2*RIGHT, stroke_width=5, color=BLUE)
axes = Axes(axis_config={"stroke_width": 2})
```

### 3.5 Minimalism

**The 3B1B rule:** Show only what serves understanding.

- Remove default gridlines unless needed
- Fade out elements when attention shifts
- Use negative space intentionally
- One animation, one idea

---

## 4. Animation Rhythm and Pacing

### 4.1 The Breath of a Video

Grant Sanderson describes animation pacing like **breathing**—moments of activity (inhale) followed by moments of pause (exhale).

```
[Animation] → [Pause] → [Animation] → [Longer Pause] → [Major Animation] → [Reflection Pause]
```

### 4.2 Timing Guidelines

| Action | Duration | Purpose |
|--------|----------|---------|
| Simple transformation | 0.5-1.0s | Quick, doesn't interrupt thought |
| Standard animation | 1.0-2.0s | Main content |
| Complex transformation | 2.0-3.0s | Give viewer time to follow |
| Pause after animation | 0.3-0.5s | Processing time |
| Pause before key point | 0.5-1.0s | Build anticipation |
| Pause after reveal | 1.0-2.0s | Let it sink in |

```python
# Standard rhythm
self.play(Write(equation), run_time=1.5)
self.wait(0.5)  # Brief processing
self.play(Transform(equation, simplified), run_time=1.0)
self.wait(1.0)  # Longer pause for important result
```

### 4.3 Animation Easing

Use **rate functions** to make motion feel natural:

```python
from manim import *

# Smooth acceleration and deceleration (default)
self.play(obj.animate.shift(RIGHT), rate_func=smooth)

# For emphasis at the end
self.play(obj.animate.scale(1.5), rate_func=there_and_back)

# For continuous flow
self.play(obj.animate.rotate(TAU), rate_func=linear)
```

### 4.4 Simultaneous vs. Sequential

**Sequential:** For cause and effect
```python
self.play(Create(force_arrow))
self.wait(0.3)
self.play(obj.animate.shift(RIGHT))  # Force causes motion
```

**Simultaneous:** For related concepts
```python
self.play(
    Create(velocity_vector),
    Create(acceleration_vector),
    run_time=1.5
)
```

**Staggered:** For multiple similar elements
```python
self.play(
    LaggedStart(*[Create(v) for v in vectors], lag_ratio=0.2),
    run_time=2.0
)
```

---

## 5. Equation Animation Techniques

### 5.1 Writing Equations

The `Write` animation mimics handwriting—use it for first appearances:

```python
kinematic_eq = MathTex(r"x = x_0 + v_0 t + \frac{1}{2}at^2")
self.play(Write(kinematic_eq), run_time=2.0)
```

### 5.2 Highlighting Parts

Use double braces `{{ }}` to isolate parts for selective animation:

```python
equation = MathTex(
    r"{{F}} = {{m}} {{a}}"
)
self.play(Write(equation))
self.wait(0.5)

# Highlight force
self.play(equation[r"F"].animate.set_color(YELLOW))
self.wait(0.5)
```

### 5.3 TransformMatchingTex

The signature 3B1B move—morphing equations while preserving matching parts:

```python
eq1 = MathTex(r"{{F}} = {{m}} {{a}}")
eq2 = MathTex(r"{{a}} = \frac{{{F}}}{{{m}}}")

self.play(Write(eq1))
self.wait(0.5)
self.play(
    TransformMatchingTex(eq1, eq2, path_arc=90*DEGREES),
    run_time=2.0
)
```

**Key Parameters:**
- `path_arc`: Makes parts rotate into position (feels like rearranging)
- `key_map`: Maps parts that change appearance (`"a^2": "a"`)
- `transform_mismatches=True`: Morphs non-matching parts

### 5.4 TransformMatchingShapes

For more complex transformations where TeX matching fails:

```python
self.play(
    TransformMatchingShapes(source, target, path_arc=PI/2),
    run_time=3.0
)
```

### 5.5 Equation Derivation Flow

**Pattern for showing derivations:**

```python
def show_derivation(self):
    # Step 1: Starting point
    step1 = MathTex(r"F = ma")
    self.play(Write(step1))
    self.wait(1.0)
    
    # Step 2: Manipulation
    step2 = MathTex(r"F = m \frac{dv}{dt}")
    self.play(TransformMatchingTex(step1, step2))
    self.wait(0.5)
    
    # Step 3: Integration
    step3 = MathTex(r"\int F \, dt = m \Delta v")
    self.play(TransformMatchingShapes(step2, step3))
    self.wait(0.5)
    
    # Final: Box the result
    box = SurroundingRectangle(step3, color=YELLOW, buff=0.2)
    self.play(Create(box))
    self.wait(1.0)
```

---

## 6. Vector Fields and Flow Visualization

### 6.1 ArrowVectorField

For discrete arrow representations of fields:

```python
from manim import *

class ElectricFieldVisualization(Scene):
    def construct(self):
        # Electric field from point charge at origin
        def e_field(pos):
            r = pos - ORIGIN
            r_mag = np.linalg.norm(r)
            if r_mag < 0.1:
                return np.zeros(3)
            return r / (r_mag ** 3)
        
        field = ArrowVectorField(
            e_field,
            x_range=[-6, 6, 1],
            y_range=[-4, 4, 1],
            length_func=lambda x: min(x, 0.8),  # Cap arrow length
            colors=[BLUE, TEAL, GREEN, YELLOW],  # Gradient by magnitude
        )
        
        charge = Dot(ORIGIN, color=RED, radius=0.15)
        charge_label = MathTex("+q").next_to(charge, DOWN)
        
        self.play(FadeIn(charge), Write(charge_label))
        self.wait(0.5)
        self.play(Create(field), run_time=2.0)
        self.wait(1.0)
```

### 6.2 StreamLines

For continuous flow visualization (fluid dynamics, field lines):

```python
class MagneticFieldFlow(Scene):
    def construct(self):
        def b_field(pos):
            # Simplified magnetic dipole field
            x, y, z = pos
            r = np.sqrt(x**2 + y**2)
            if r < 0.5:
                return np.array([0, 1, 0])  # Vertical inside
            return np.array([-y, x, 0]) / (r**2)
        
        stream_lines = StreamLines(
            b_field,
            x_range=[-5, 5, 0.5],
            y_range=[-3, 3, 0.5],
            stroke_width=2,
            color=TEAL,
            max_anchors_per_line=30,
            virtual_time=2,
        )
        
        self.add(stream_lines)
        stream_lines.start_animation(warm_up=True, flow_speed=1.5)
        self.wait(4)
        self.play(stream_lines.end_animation())
```

### 6.3 Animated Field Evolution

Show how fields change over time:

```python
class TimeVaryingField(Scene):
    def construct(self):
        t_tracker = ValueTracker(0)
        
        def dynamic_field(pos):
            t = t_tracker.get_value()
            return np.array([
                np.sin(pos[1] + t),
                np.cos(pos[0] - t),
                0
            ])
        
        field = always_redraw(lambda: ArrowVectorField(
            dynamic_field,
            x_range=[-4, 4, 0.8],
            y_range=[-3, 3, 0.8],
        ))
        
        self.add(field)
        self.play(t_tracker.animate.set_value(2*PI), run_time=4, rate_func=linear)
```

### 6.4 Color Gradients for Magnitude

```python
field = ArrowVectorField(
    func,
    color_scheme=lambda pos: np.linalg.norm(func(pos)),  # Color by magnitude
    min_color_scheme_value=0,
    max_color_scheme_value=2,
    colors=[BLUE_E, TEAL, GREEN, YELLOW, RED],
)
```

---

## 7. 3D Scenes for Engineering Physics

### 7.1 Setting Up 3D

```python
from manim import *

class Physics3DScene(ThreeDScene):
    def construct(self):
        # Camera setup
        self.set_camera_orientation(
            phi=75 * DEGREES,    # Elevation angle
            theta=-45 * DEGREES  # Azimuth angle
        )
        
        # 3D axes
        axes = ThreeDAxes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            z_range=[-3, 3, 1],
            x_length=8,
            y_length=8,
            z_length=6,
        )
        
        labels = axes.get_axis_labels(
            Tex("x"), Tex("y"), Tex("z")
        )
        
        self.play(Create(axes), Write(labels))
        self.wait()
```

### 7.2 Camera Motion

```python
# Rotate camera continuously
self.begin_ambient_camera_rotation(rate=0.2)
self.wait(5)
self.stop_ambient_camera_rotation()

# Animated camera movement
self.move_camera(
    phi=60 * DEGREES,
    theta=30 * DEGREES,
    run_time=2.0
)
```

### 7.3 3D Vector Fields

```python
class ThreeDVectorField(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=60*DEGREES, theta=45*DEGREES)
        
        axes = ThreeDAxes()
        self.add(axes)
        
        # 3D vector field (e.g., velocity field)
        def velocity_field(pos):
            x, y, z = pos
            return np.array([
                -y,
                x,
                0.5  # Upward spiral
            ])
        
        field = ArrowVectorField(
            velocity_field,
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-2, 2, 1],
            three_dimensions=True,
        )
        
        self.play(Create(field), run_time=3)
        self.begin_ambient_camera_rotation(rate=0.1)
        self.wait(5)
```

### 7.4 Fixed-in-Frame Elements

Keep labels readable as camera moves:

```python
title = Text("3D Electric Field").to_corner(UL)
self.add_fixed_in_frame_mobjects(title)  # Won't rotate with camera
```

---

## 8. Course-Specific Implementation

### 8.1 Kinematics

**Key Visualizations:**
- Position vs. time graphs with corresponding motion
- Velocity and acceleration vectors updating in real-time
- Projectile motion with decomposed components
- Relative velocity diagrams

```python
class ProjectileMotion(Scene):
    def construct(self):
        # Setup axes
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 6, 1],
            axis_config={"color": WHITE}
        )
        
        # Time parameter
        t = ValueTracker(0)
        
        # Initial conditions
        v0, theta = 8, 60 * DEGREES
        vx, vy = v0 * np.cos(theta), v0 * np.sin(theta)
        g = 9.8
        
        # Projectile position
        def get_pos(time):
            x = vx * time
            y = vy * time - 0.5 * g * time**2
            return axes.c2p(x, max(y, 0))
        
        # Ball and trajectory
        ball = always_redraw(lambda: Dot(get_pos(t.get_value()), color=YELLOW))
        path = TracedPath(ball.get_center, stroke_color=BLUE, stroke_width=3)
        
        # Velocity vector
        vel_vector = always_redraw(lambda: Arrow(
            get_pos(t.get_value()),
            get_pos(t.get_value()) + 0.3 * np.array([vx, vy - g*t.get_value(), 0]),
            color=RED,
            buff=0
        ))
        
        self.add(axes, ball, path, vel_vector)
        self.play(t.animate.set_value(2*vy/g), run_time=3, rate_func=linear)
```

### 8.2 Dynamics

**Key Visualizations:**
- Force diagrams with net force
- Work-energy theorem animations
- Phase space trajectories
- Constraint forces and free-body diagrams

```python
class FreeBodyDiagram(Scene):
    def construct(self):
        # Object
        block = Square(side_length=1.5, color=WHITE, fill_opacity=0.3)
        
        # Forces
        forces = {
            "Weight": Arrow(ORIGIN, DOWN * 2, color=RED, buff=0),
            "Normal": Arrow(ORIGIN, UP * 2, color=BLUE, buff=0),
            "Friction": Arrow(ORIGIN, LEFT * 1.5, color=YELLOW, buff=0),
            "Applied": Arrow(ORIGIN, RIGHT * 2.5, color=GREEN, buff=0),
        }
        
        labels = VGroup()
        for name, arrow in forces.items():
            arrow.shift(block.get_center())
            label = MathTex(r"\vec{" + name[0] + "}").next_to(arrow.get_end(), 
                           arrow.get_unit_vector(), buff=0.2)
            labels.add(label)
        
        self.play(Create(block))
        for arrow in forces.values():
            self.play(GrowArrow(arrow), run_time=0.5)
        self.play(Write(labels))
```

### 8.3 Electromagnetic Fields

**Key Visualizations:**
- Electric field lines from charges
- Magnetic field loops
- Gauss's law surfaces
- Wave propagation

```python
class GaussLaw(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=70*DEGREES, theta=30*DEGREES)
        
        # Point charge
        charge = Sphere(radius=0.2, color=RED)
        
        # Gaussian surface (transparent sphere)
        gaussian_surface = Sphere(
            radius=2,
            resolution=(24, 48),
            fill_opacity=0.2,
            stroke_color=BLUE,
            stroke_width=1,
        )
        
        # Electric field arrows pointing radially outward
        field_arrows = VGroup()
        for phi in np.linspace(0, PI, 6):
            for theta in np.linspace(0, TAU, 12):
                direction = np.array([
                    np.sin(phi) * np.cos(theta),
                    np.sin(phi) * np.sin(theta),
                    np.cos(phi)
                ])
                arrow = Arrow3D(
                    start=2.1 * direction,
                    end=2.6 * direction,
                    color=YELLOW,
                )
                field_arrows.add(arrow)
        
        self.play(FadeIn(charge))
        self.play(Create(gaussian_surface))
        self.play(LaggedStart(*[Create(a) for a in field_arrows], lag_ratio=0.05))
        
        # Flux equation
        flux_eq = MathTex(r"\Phi_E = \oint \vec{E} \cdot d\vec{A} = \frac{Q}{\epsilon_0}")
        flux_eq.to_corner(UL)
        self.add_fixed_in_frame_mobjects(flux_eq)
        self.play(Write(flux_eq))
```

### 8.4 Vibrations and Waves

**Key Visualizations:**
- Simple harmonic motion with phase space
- Damped and driven oscillations
- Standing waves and resonance
- Wave superposition

```python
class StandingWave(Scene):
    def construct(self):
        axes = Axes(x_range=[0, 2*PI, PI/2], y_range=[-1.5, 1.5, 0.5])
        
        t = ValueTracker(0)
        n = 3  # Mode number
        
        # Standing wave = sum of traveling waves
        standing_wave = always_redraw(lambda: axes.plot(
            lambda x: np.sin(n * x) * np.cos(2 * t.get_value()),
            color=BLUE,
            stroke_width=4,
        ))
        
        # Nodes and antinodes
        nodes = VGroup(*[
            Dot(axes.c2p(k * PI / n, 0), color=RED)
            for k in range(2 * n + 1)
        ])
        
        self.add(axes, standing_wave, nodes)
        self.play(t.animate.set_value(2 * PI), run_time=4, rate_func=linear)
```

---

## 9. Production Workflow

### 9.1 The Sanderson Method

Grant Sanderson's workflow (demonstrated with Ben Sparks):

1. **Write scenes in Python** with Sublime Text
2. **Interactive preview** using `checkpoint_paste()` for rapid iteration
3. **Render individual clips** (not full videos)
4. **Edit in traditional video software** (add narration, music, timing adjustments)

### 9.2 Scene Organization

```python
# kinematics/projectile_motion.py

from manim import *
from shared.colors import PhysicsColors
from shared.styles import DEFAULT_AXES_CONFIG

class Introduction(Scene):
    """Hook: Show the parabolic path mystery"""
    def construct(self):
        ...

class ComponentBreakdown(Scene):
    """Decompose into horizontal and vertical"""
    def construct(self):
        ...

class Derivation(Scene):
    """Derive the equations of motion"""
    def construct(self):
        ...

class SpecialCases(Scene):
    """Maximum height, range, etc."""
    def construct(self):
        ...

class Summary(Scene):
    """Bring it all together"""
    def construct(self):
        ...
```

### 9.3 Rendering Commands

```bash
# Low quality preview
manim -pql scene.py SceneName

# Medium quality
manim -pqm scene.py SceneName

# High quality (production)
manim -pqh scene.py SceneName

# 4K quality
manim -pqk scene.py SceneName

# Save last frame as image
manim -pql --save_last_frame scene.py SceneName
```

### 9.4 Quality Control Checklist

Before finalizing a scene:

- [ ] Colors are consistent with palette
- [ ] Timing feels natural (not rushed, not draggy)
- [ ] Equations are readable at export resolution
- [ ] Animations have purpose (no gratuitous motion)
- [ ] Key moments have adequate pauses
- [ ] Camera moves smoothly (if 3D)
- [ ] Labels don't overlap with elements

---

## 10. Code Templates and Patterns

### 10.1 Base Scene Template

```python
from manim import *

# Configure globally
config.background_color = "#1C1C1C"

class PhysicsScene(Scene):
    """Base class for physics animations"""
    
    # Color palette
    VELOCITY_COLOR = "#58C4DD"
    ACCELERATION_COLOR = "#FC6255"
    FORCE_COLOR = "#FFFF00"
    
    def setup(self):
        """Called before construct()"""
        pass
    
    def create_axes(self, x_range, y_range, **kwargs):
        """Standard axes with physics styling"""
        return Axes(
            x_range=x_range,
            y_range=y_range,
            axis_config={
                "color": WHITE,
                "stroke_width": 2,
                "include_tip": True,
            },
            **kwargs
        )
    
    def write_equation(self, tex_string, position=ORIGIN):
        """Animate writing an equation"""
        eq = MathTex(tex_string)
        eq.move_to(position)
        self.play(Write(eq))
        self.wait(0.5)
        return eq
    
    def highlight_term(self, equation, term, color=YELLOW):
        """Highlight a term in an equation"""
        self.play(equation[term].animate.set_color(color))
        self.wait(0.3)
```

### 10.2 Vector Animation Pattern

```python
def create_vector_with_label(self, start, end, label_text, color=BLUE):
    """Create a vector with automatic label placement"""
    vec = Arrow(start, end, color=color, buff=0, stroke_width=5)
    
    # Position label at midpoint, offset perpendicular to vector
    midpoint = (start + end) / 2
    direction = end - start
    perp = np.array([-direction[1], direction[0], 0])
    perp = perp / np.linalg.norm(perp) * 0.3
    
    label = MathTex(label_text).move_to(midpoint + perp)
    
    return VGroup(vec, label)
```

### 10.3 Equation Transformation Pattern

```python
def derive_equation(self, steps, position=ORIGIN):
    """Show a multi-step derivation"""
    current = MathTex(steps[0]).move_to(position)
    self.play(Write(current))
    self.wait(1.0)
    
    for next_step in steps[1:]:
        next_eq = MathTex(next_step).move_to(position)
        self.play(TransformMatchingTex(current, next_eq, path_arc=30*DEGREES))
        self.wait(0.8)
        current = next_eq
    
    # Box final result
    box = SurroundingRectangle(current, color=YELLOW, buff=0.2)
    self.play(Create(box))
    self.wait(1.0)
    return VGroup(current, box)
```

### 10.4 Phase Space Animation Pattern

```python
class PhaseSpaceVisualization(Scene):
    def construct(self):
        # Configuration space (left)
        config_axes = Axes(x_range=[-2, 2], y_range=[-2, 2]).scale(0.8)
        config_axes.shift(LEFT * 3.5)
        
        # Phase space (right)
        phase_axes = Axes(x_range=[-2, 2], y_range=[-2, 2]).scale(0.8)
        phase_axes.shift(RIGHT * 3.5)
        
        config_label = Text("Configuration Space").scale(0.5).next_to(config_axes, UP)
        phase_label = Text("Phase Space").scale(0.5).next_to(phase_axes, UP)
        
        self.add(config_axes, phase_axes, config_label, phase_label)
        
        # Time evolution
        t = ValueTracker(0)
        
        # Harmonic oscillator
        omega = 2
        
        # Position in config space
        config_dot = always_redraw(lambda: Dot(
            config_axes.c2p(np.cos(omega * t.get_value()), 0),
            color=BLUE
        ))
        
        # Position in phase space (x, v)
        phase_dot = always_redraw(lambda: Dot(
            phase_axes.c2p(
                np.cos(omega * t.get_value()),
                -omega * np.sin(omega * t.get_value())
            ),
            color=RED
        ))
        
        # Traced paths
        config_path = TracedPath(config_dot.get_center, stroke_color=BLUE, stroke_width=2)
        phase_path = TracedPath(phase_dot.get_center, stroke_color=RED, stroke_width=2)
        
        self.add(config_dot, phase_dot, config_path, phase_path)
        self.play(t.animate.set_value(2*PI/omega), run_time=4, rate_func=linear)
```

---

## Appendix A: Manim Color Constants

```python
# Blues
BLUE_A = "#C7E9F1"
BLUE_B = "#9CDCEB"
BLUE_C = "#58C4DD"
BLUE_D = "#29ABCA"
BLUE_E = "#236B8E"

# Teals
TEAL_A = "#ACEAD7"
TEAL_B = "#76DDC0"
TEAL_C = "#5CD0B3"
TEAL_D = "#55C1A7"
TEAL_E = "#49A88F"

# Greens
GREEN_A = "#C9E2AE"
GREEN_B = "#A6CF8C"
GREEN_C = "#83C167"
GREEN_D = "#77B05D"
GREEN_E = "#699C52"

# Yellows
YELLOW_A = "#FFF1B6"
YELLOW_B = "#FFEA94"
YELLOW_C = "#FFFF00"
YELLOW_D = "#F4D345"
YELLOW_E = "#E8C11C"

# Golds
GOLD_A = "#F7C797"
GOLD_B = "#F9B775"
GOLD_C = "#F0AC00"
GOLD_D = "#E1A158"
GOLD_E = "#C78D46"

# Reds
RED_A = "#F7A1A3"
RED_B = "#FF8080"
RED_C = "#FC6255"
RED_D = "#E65A4C"
RED_E = "#CF5044"

# Maroons
MAROON_A = "#ECABC1"
MAROON_B = "#EC92AB"
MAROON_C = "#C55F73"
MAROON_D = "#A24D61"
MAROON_E = "#94424F"

# Purples
PURPLE_A = "#CAA3E8"
PURPLE_B = "#B189C6"
PURPLE_C = "#9A72AC"
PURPLE_D = "#715582"
PURPLE_E = "#644172"
```

---

## Appendix B: Key Manim Classes for Physics

| Class | Use Case |
|-------|----------|
| `Arrow`, `Vector` | Force, velocity, acceleration vectors |
| `Axes`, `ThreeDAxes` | Coordinate systems |
| `NumberPlane` | Background grid |
| `ParametricFunction` | Trajectories, curves |
| `ArrowVectorField` | Discrete field visualization |
| `StreamLines` | Continuous flow visualization |
| `TracedPath` | Path of moving object |
| `ValueTracker` | Animate parameters over time |
| `always_redraw()` | Dynamic updating objects |
| `MathTex`, `Tex` | LaTeX equations |
| `SurroundingRectangle` | Highlight regions |
| `Brace` | Indicate lengths/intervals |
| `DashedLine` | Construction lines |
| `Dot` | Point particles |
| `Circle`, `Sphere` | Particles, sources |
| `Surface` | 3D surfaces |

---

## Appendix C: Resources

### Official Documentation
- **Manim Community:** https://docs.manim.community
- **ManimGL (3b1b):** https://3b1b.github.io/manim

### Source Code
- **3b1b/manim:** https://github.com/3b1b/manim
- **3b1b/videos:** https://github.com/3b1b/videos
- **ManimCommunity/manim:** https://github.com/ManimCommunity/manim

### Tutorials and Examples
- **Manim Community Examples:** https://docs.manim.community/en/stable/examples.html
- **Todd Zimmerman's Manim Series:** https://talkingphysics.wordpress.com

### Grant Sanderson's Pedagogical Philosophy
- **3Blue1Brown FAQ:** https://www.3blue1brown.com/faq
- **How I animate 3Blue1Brown (with Ben Sparks):** https://3blue1brown.substack.com/p/how-i-animate-3blue1brown

---

## Final Notes

The essence of the 3Blue1Brown style is not merely aesthetic—it's pedagogical. The dark backgrounds, jewel-tone colors, and smooth animations exist in service of one goal: **making the viewer feel that they understand**.

For engineering physics courses, this means:

1. **Show the physics before the math** — Let students see phenomena first
2. **Make vectors come alive** — Animate them, show them changing
3. **Transform equations meaningfully** — Every manipulation should feel earned
4. **Use 3D sparingly but powerfully** — Reserve it for concepts that demand it
5. **Pause for understanding** — Silence is as important as motion

Remember Grant Sanderson's guiding principle:

> *"Where programmatic animations work best is when you have a situation where the code directly reflects the math you're trying to explain."*

In engineering physics, the equations *are* the phenomena. Animate them accordingly.

---

*This style guide was compiled from analysis of 3Blue1Brown videos, Grant Sanderson's writings and interviews, Manim documentation, and established principles of educational animation.*
