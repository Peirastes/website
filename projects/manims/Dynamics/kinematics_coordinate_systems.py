"""
Curvilinear Kinematics: Coordinate Systems Animation
Rectangular, Cylindrical/Polar, and Normal/Tangential Coordinate Systems

Following 3Blue1Brown Animation Style Guide
Run with: manim -pql kinematics_coordinate_systems.py
"""

from manim import *
import numpy as np

# Configuration
config.background_color = "#1C1C1C"
config.pixel_height = 1080
config.pixel_width = 1920

# Color palette following 3B1B style
VELOCITY_COLOR = "#58C4DD"      # Primary blue
ACCELERATION_COLOR = "#FC6255"  # Red
POSITION_COLOR = "#5CD0B3"      # Teal
TIME_COLOR = "#FFD700"          # Gold
EMPHASIS_COLOR = "#FFFF00"      # Yellow
HIGHLIGHT_COLOR = "#83C167"     # Green
SECONDARY_COLOR = "#9A72AC"     # Purple


# ============================================================================
# SCENE 1: RECTANGULAR COORDINATES (CARTESIAN)
# ============================================================================

class RectangularCoordinatesDerivation(Scene):
    """
    Rectangular Coordinates Derivation.
    Shows concrete animation on left (position, velocity, acceleration vectors moving).
    Derives equations on right side.
    Follows 3B1B pedagogical inversion: concrete first, then abstract.
    Better flow with clearer transitions and pacing.
    """

    def construct(self):
        # ===== TITLE SEQUENCE =====
        title = Text("Rectangular Coordinates", font_size=48, color=WHITE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1.5)
        self.wait(1)

        subtitle = Text("Cartesian Coordinate System", font_size=32, color=EMPHASIS_COLOR)
        subtitle.next_to(title, DOWN, buff=0.5)
        self.play(Write(subtitle), run_time=1)
        self.wait(2)

        # Fade out smoothly
        self.play(FadeOut(title), FadeOut(subtitle), run_time=1)
        self.wait(1)

        # ===== SETUP: Split screen layout =====
        # Create visual divider line
        divider = Line(
            start=UP * 4,
            end=DOWN * 4,
            color=GRAY,
            stroke_width=1.5,
            stroke_opacity=0.5
        )
        self.play(Create(divider), run_time=1)
        self.wait(0.5)

        # ===== LEFT PANEL: 3D Visualization =====
        # Create 3D axes scaled for left panel
        axes_3d = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[-0.5, 2, 1],
            axis_config={"color": GRAY, "stroke_width": 2},
            tips=False,
        )
        axes_3d.scale(0.6).shift(LEFT * 3.5 + DOWN * 0.3)

        self.play(Create(axes_3d), run_time=1.5)
        self.wait(1)

        # ===== TIME PARAMETER AND TRAJECTORY FUNCTIONS =====
        t = ValueTracker(0)

        # Parametric helix trajectory
        def get_position(time):
            x = 2 * np.cos(time)
            y = 2 * np.sin(time)
            z = time / PI
            return axes_3d.c2p(x, y, z)

        def get_velocity(time):
            # dr/dt for helix
            dx_dt = -2 * np.sin(time)
            dy_dt = 2 * np.cos(time)
            dz_dt = 1 / PI
            return np.array([dx_dt, dy_dt, dz_dt]) * 0.35

        def get_acceleration(time):
            # d²r/dt² for helix
            d2x_dt2 = -2 * np.cos(time)
            d2y_dt2 = -2 * np.sin(time)
            d2z_dt2 = 0
            return np.array([d2x_dt2, d2y_dt2, d2z_dt2]) * 0.2

        # ===== POSITION VECTOR ANIMATION =====
        position_dot = always_redraw(lambda: Dot(
            get_position(t.get_value()),
            color=POSITION_COLOR,
            radius=0.08
        ))

        position_vector = always_redraw(lambda: Arrow(
            axes_3d.c2p(0, 0, 0),
            get_position(t.get_value()),
            color=POSITION_COLOR,
            stroke_width=3,
            buff=0,
            max_tip_length_to_length_ratio=0.08
        ))

        self.add(position_dot, position_vector)
        self.wait(0.5)

        # ===== RIGHT PANEL: POSITION EQUATION =====
        pos_eq = MathTex(
            r"\vec{r}(t) = x(t)\,\hat{i} + y(t)\,\hat{j} + z(t)\,\hat{k}",
            font_size=28,
            color=POSITION_COLOR
        )
        pos_eq.move_to(RIGHT * 3 + UP * 2.2)

        pos_label = Text("Position Vector", font_size=24, color=POSITION_COLOR)
        pos_label.next_to(pos_eq, UP, buff=0.4)

        self.play(Write(pos_label), run_time=0.8)
        self.play(Write(pos_eq), run_time=1.5)
        self.wait(0.5)

        # First animation: just position
        self.play(t.animate.set_value(PI / 2), run_time=5, rate_func=smooth)
        self.wait(1.5)

        # ===== VELOCITY VECTOR AND EQUATION =====
        velocity_vector = always_redraw(lambda: Arrow(
            get_position(t.get_value()),
            get_position(t.get_value()) + get_velocity(t.get_value()),
            color=VELOCITY_COLOR,
            stroke_width=2.5,
            buff=0,
            max_tip_length_to_length_ratio=0.08
        ))

        # Fade in velocity vector
        self.play(FadeIn(velocity_vector), run_time=1)
        self.wait(0.5)

        # Add velocity equations
        vel_label = Text("Velocity Vector", font_size=24, color=VELOCITY_COLOR)
        vel_label.move_to(RIGHT * 3 + UP * 0.8)

        vel_eq = MathTex(
            r"\vec{V}(t) = \frac{d\vec{r}}{dt} = \dot{x}\,\hat{i} + \dot{y}\,\hat{j} + \dot{z}\,\hat{k}",
            font_size=26,
            color=VELOCITY_COLOR
        )
        vel_eq.next_to(vel_label, DOWN, buff=0.3)

        self.play(Write(vel_label), run_time=0.6)
        self.play(Write(vel_eq), run_time=1.5)
        self.wait(0.5)

        # Animate with position and velocity visible
        self.play(t.animate.set_value(PI), run_time=5, rate_func=smooth)
        self.wait(1.5)

        # ===== ACCELERATION VECTOR AND EQUATION =====
        acceleration_vector = always_redraw(lambda: Arrow(
            get_position(t.get_value()),
            get_position(t.get_value()) + get_acceleration(t.get_value()),
            color=ACCELERATION_COLOR,
            stroke_width=2.5,
            buff=0,
            max_tip_length_to_length_ratio=0.08
        ))

        # Fade in acceleration vector
        self.play(FadeIn(acceleration_vector), run_time=1)
        self.wait(0.5)

        # Add acceleration equations
        acc_label = Text("Acceleration Vector", font_size=24, color=ACCELERATION_COLOR)
        acc_label.move_to(RIGHT * 3 + DOWN * 0.6)

        acc_eq = MathTex(
            r"\vec{a}(t) = \frac{d\vec{V}}{dt} = \ddot{x}\,\hat{i} + \ddot{y}\,\hat{j} + \ddot{z}\,\hat{k}",
            font_size=26,
            color=ACCELERATION_COLOR
        )
        acc_eq.next_to(acc_label, DOWN, buff=0.3)

        self.play(Write(acc_label), run_time=0.6)
        self.play(Write(acc_eq), run_time=1.5)
        self.wait(0.5)

        # Final animation: all three vectors visible
        self.play(t.animate.set_value(1.8 * PI), run_time=6, rate_func=smooth)
        self.wait(2)

        # ===== CLOSING: Key insight box =====
        insight = MathTex(
            r"\text{Unit vectors } \hat{i}, \hat{j}, \hat{k} \text{ are FIXED}",
            font_size=24,
            color=EMPHASIS_COLOR
        )
        insight.move_to(RIGHT * 3 + DOWN * 2.5)
        insight_box = SurroundingRectangle(insight, color=EMPHASIS_COLOR, buff=0.2, stroke_width=2)

        self.play(Create(insight_box), run_time=0.8)
        self.play(Write(insight), run_time=1.5)
        self.wait(2)


# ============================================================================
# SCENE 2: CYLINDRICAL/POLAR COORDINATES
# ============================================================================

class CylindricalCoordinatesDerivation(Scene):
    """
    Derives velocity and acceleration in cylindrical/polar coordinates.
    Shows unit vector changes and resulting acceleration components.
    """
    
    def construct(self):
        # Title
        title = Text("Cylindrical/Polar Coordinates: Derivation", font_size=42, color=WHITE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)
        self.wait(0.5)
        
        # ===== Step 1: Coordinate Definition =====
        self.play(FadeOut(title))
        self.wait(0.3)
        
        step1_title = Text("Step 1: Coordinate Definition", font_size=32, color=EMPHASIS_COLOR)
        step1_title.to_edge(UP)
        self.play(Write(step1_title), run_time=1)
        self.wait(0.5)
        
        # Draw 2D coordinate system with polar representation
        ax = Axes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            axis_config={
                "color": GRAY,
                "stroke_width": 2,
            },
            tips=True,
        )
        ax.scale(0.9)
        ax.shift(DOWN * 1.5)
        
        self.play(Create(ax), run_time=1.5)
        
        # Point in polar coordinates
        r_val, theta_val = 2.0, np.pi / 4
        point_pos = np.array([r_val * np.cos(theta_val), r_val * np.sin(theta_val)])
        point = Dot(ax.c2p(*point_pos, 0), color=POSITION_COLOR, radius=0.1)
        
        # Radial vector
        radial_vec = Arrow(
            ax.c2p(0, 0, 0),
            ax.c2p(*point_pos, 0),
            color=POSITION_COLOR,
            stroke_width=4,
            buff=0
        )
        
        # Angle arc
        angle_arc = Arc(
            radius=0.8,
            angle=theta_val,
            color=TIME_COLOR,
            stroke_width=3
        )
        angle_arc = angle_arc.shift(ax.c2p(0, 0, 0))
        
        self.play(Create(radial_vec), run_time=1)
        self.play(Create(angle_arc), run_time=1)
        self.play(Create(point), run_time=0.5)
        self.wait(0.5)
        
        # Position equation in polar
        pos_eq_polar = MathTex(
            r"\vec{r}(t) = r(t)\hat{u}_r",
            font_size=36,
            color=POSITION_COLOR
        )
        pos_eq_polar.to_edge(LEFT)
        pos_eq_polar.shift(UP * 2.5)
        
        coord_label = MathTex(
            r"r \text{ (radial)}, \theta \text{ (angular)}",
            font_size=28,
            color=GRAY
        )
        coord_label.next_to(pos_eq_polar, DOWN, buff=0.3)
        
        self.play(Write(pos_eq_polar), run_time=1.5)
        self.play(Write(coord_label), run_time=1)
        self.wait(1.0)
        
        self.remove(radial_vec, angle_arc, point, ax)
        self.play(FadeOut(step1_title))
        self.wait(0.3)
        
        # ===== Step 2: Unit Vector Relationships =====
        step2_title = Text("Step 2: Unit Vector Time Derivatives", font_size=32, color=TIME_COLOR)
        step2_title.to_edge(UP)
        self.play(Write(step2_title), run_time=1)
        self.wait(0.5)
        
        # Position equation stays visible
        pos_eq_polar.shift(DOWN * 0.5)
        self.play(pos_eq_polar.animate.shift(DOWN * 0.5), run_time=0.5)
        
        # Key insight about unit vectors
        key_insight = Text(
            "Unit vectors rotate as particle moves!",
            font_size=28,
            color=EMPHASIS_COLOR,
            font="monospace"
        )
        key_insight.next_to(pos_eq_polar, DOWN, buff=1.0)
        
        self.play(Write(key_insight), run_time=1.5)
        self.wait(0.8)
        
        # Unit vector derivatives
        uv_eq1 = MathTex(
            r"\frac{d\hat{u}_r}{dt} = \dot{\theta}\hat{u}_{\theta}",
            font_size=34,
            color=TIME_COLOR
        )
        uv_eq1.next_to(key_insight, DOWN, buff=0.8)
        
        uv_eq2 = MathTex(
            r"\frac{d\hat{u}_{\theta}}{dt} = -\dot{\theta}\hat{u}_{r}",
            font_size=34,
            color=TIME_COLOR
        )
        uv_eq2.next_to(uv_eq1, DOWN, buff=0.5)
        
        self.play(Write(uv_eq1), run_time=1.5)
        self.wait(0.5)
        self.play(Write(uv_eq2), run_time=1.5)
        self.wait(1.0)
        
        self.play(FadeOut(key_insight), FadeOut(step2_title))
        self.wait(0.3)
        
        # ===== Step 3: Velocity Derivation =====
        step3_title = Text("Step 3: Velocity in Polar Coordinates", font_size=32, color=VELOCITY_COLOR)
        step3_title.to_edge(UP)
        self.play(Write(step3_title), run_time=1)
        self.wait(0.5)
        
        # Velocity derivation
        vel_step1 = MathTex(
            r"\vec{V} = \frac{d\vec{r}}{dt} = \frac{d}{dt}(r\hat{u}_r)",
            font_size=32,
            color=VELOCITY_COLOR
        )
        vel_step1.next_to(uv_eq2, DOWN, buff=1.0)
        
        self.play(Write(vel_step1), run_time=1.5)
        self.wait(0.8)
        
        # Product rule application
        vel_step2 = MathTex(
            r"\vec{V} = \dot{r}\hat{u}_r + r\frac{d\hat{u}_r}{dt}",
            font_size=32,
            color=VELOCITY_COLOR
        )
        vel_step2.next_to(vel_step1, DOWN, buff=0.5)
        
        self.play(Write(vel_step2), run_time=1.5)
        self.wait(0.8)
        
        # Substitute unit vector derivative
        vel_step3 = MathTex(
            r"\vec{V} = \dot{r}\hat{u}_r + r\dot{\theta}\hat{u}_{\theta}",
            font_size=34,
            color=VELOCITY_COLOR
        )
        vel_step3.next_to(vel_step2, DOWN, buff=0.5)
        
        self.play(Write(vel_step3), run_time=1.5)
        self.wait(1.0)
        
        vel_box = SurroundingRectangle(vel_step3, color=EMPHASIS_COLOR, buff=0.15)
        self.play(Create(vel_box), run_time=0.8)
        self.wait(0.8)
        
        self.play(FadeOut(vel_step1), FadeOut(vel_step2), FadeOut(vel_box))
        self.wait(0.3)
        
        # ===== Step 4: Acceleration Derivation =====
        self.play(FadeOut(step3_title))
        
        step4_title = Text("Step 4: Acceleration in Polar Coordinates", font_size=32, color=ACCELERATION_COLOR)
        step4_title.to_edge(UP)
        self.play(Write(step4_title), run_time=1)
        self.wait(0.5)
        
        # Scale down previous equations to make room
        pos_eq_polar.scale(0.7)
        uv_eq1.scale(0.7)
        uv_eq2.scale(0.7)
        vel_step3.scale(0.85)
        
        # Acceleration derivation
        acc_step1 = MathTex(
            r"\vec{a} = \frac{d\vec{V}}{dt} = \frac{d}{dt}\left(\dot{r}\hat{u}_r + r\dot{\theta}\hat{u}_{\theta}\right)",
            font_size=28,
            color=ACCELERATION_COLOR
        )
        acc_step1.next_to(vel_step3, DOWN, buff=0.8)
        
        self.play(Write(acc_step1), run_time=1.5)
        self.wait(0.8)
        
        # Expand derivatives
        acc_step2 = MathTex(
            r"\vec{a} = (\ddot{r} - r\dot{\theta}^2)\hat{u}_{r} + (r\ddot{\theta} + 2\dot{r}\dot{\theta})\hat{u}_{\theta}",
            font_size=30,
            color=ACCELERATION_COLOR
        )
        acc_step2.next_to(acc_step1, DOWN, buff=0.6)
        
        self.play(Write(acc_step2), run_time=2)
        self.wait(1.0)
        
        # Box with components labeled
        acc_box = SurroundingRectangle(acc_step2, color=EMPHASIS_COLOR, buff=0.15)
        self.play(Create(acc_box), run_time=0.8)
        self.wait(1.0)
        
        # Label components
        radial_label = Text("Radial component", font_size=20, color=POSITION_COLOR)
        radial_label.to_edge(RIGHT)
        radial_label.shift(UP * 0.3)
        
        tangential_label = Text("Tangential component", font_size=20, color=SECONDARY_COLOR)
        tangential_label.to_edge(RIGHT)
        tangential_label.shift(DOWN * 0.3)
        
        self.play(Write(radial_label), run_time=1)
        self.play(Write(tangential_label), run_time=1)
        self.wait(1.0)


# ============================================================================
# SCENE 3: NORMAL AND TANGENTIAL COORDINATES
# ============================================================================

class NormalTangentialCoordinatesDerivation(Scene):
    """
    Derives velocity and acceleration in normal/tangential coordinates.
    Shows how these relate to path curvature and speed changes.
    """
    
    def construct(self):
        # Title
        title = Text("Normal & Tangential Coordinates: Derivation", font_size=40, color=WHITE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)
        self.wait(0.5)
        
        # ===== Step 1: Coordinate System Definition =====
        self.play(FadeOut(title))
        self.wait(0.3)
        
        step1_title = Text("Step 1: Coordinate System Definition", font_size=32, color=EMPHASIS_COLOR)
        step1_title.to_edge(UP)
        self.play(Write(step1_title), run_time=1)
        self.wait(0.5)
        
        # Draw a curved path
        ax = Axes(
            x_range=[-1, 5, 1],
            y_range=[-1, 4, 1],
            axis_config={"color": GRAY, "stroke_width": 2},
            tips=False,
        )
        ax.scale(0.8)
        ax.shift(DOWN * 1.2)
        
        # Curved path
        def curve_func(t):
            return np.array([t, 0.3 * t**2 - 0.5, 0])
        
        path = ParametricFunction(
            curve_func,
            t_range=[0, 4],
            color=HIGHLIGHT_COLOR,
            stroke_width=4,
        )
        
        self.play(Create(ax), run_time=1)
        self.play(Create(path), run_time=2)
        self.wait(0.5)
        
        # Point on path
        t_point = 2.0
        point_pos = curve_func(t_point)
        point = Dot(ax.c2p(*point_pos), color=POSITION_COLOR, radius=0.1)
        
        # Tangent direction (approximation)
        dt = 0.1
        tangent_dir = (curve_func(t_point + dt) - curve_func(t_point)) / dt
        tangent_dir = tangent_dir / np.linalg.norm(tangent_dir)
        
        tangent_vec = Arrow(
            ax.c2p(*point_pos),
            ax.c2p(*(point_pos + 0.8 * tangent_dir)),
            color=VELOCITY_COLOR,
            stroke_width=4,
            buff=0
        )
        
        # Normal direction (perpendicular)
        normal_dir = np.array([-tangent_dir[1], tangent_dir[0], 0])
        normal_vec = Arrow(
            ax.c2p(*point_pos),
            ax.c2p(*(point_pos + 0.6 * normal_dir)),
            color=ACCELERATION_COLOR,
            stroke_width=4,
            buff=0
        )
        
        self.play(Create(point), run_time=0.5)
        self.play(Create(tangent_vec), run_time=1)
        self.wait(0.5)
        self.play(Create(normal_vec), run_time=1)
        self.wait(0.5)
        
        # Labels
        t_label = MathTex(r"\hat{u}_t", font_size=28, color=VELOCITY_COLOR)
        t_label.next_to(tangent_vec, UP, buff=0.2)
        
        n_label = MathTex(r"\hat{u}_n", font_size=28, color=ACCELERATION_COLOR)
        n_label.next_to(normal_vec, RIGHT, buff=0.2)
        
        self.play(Write(t_label), Write(n_label), run_time=1)
        self.wait(1.0)
        
        # Coordinate system description
        desc_text = Text(
            "Tangent along path, Normal toward center of curvature",
            font_size=24,
            color=WHITE,
            font="monospace"
        )
        desc_text.to_edge(RIGHT)
        desc_text.shift(UP * 2)
        
        self.play(Write(desc_text), run_time=1.5)
        self.wait(1.0)
        
        self.remove(ax, path, point, tangent_vec, normal_vec, t_label, n_label, desc_text)
        self.play(FadeOut(step1_title))
        self.wait(0.3)
        
        # ===== Step 2: Velocity Decomposition =====
        step2_title = Text("Step 2: Velocity is Purely Tangential", font_size=32, color=VELOCITY_COLOR)
        step2_title.to_edge(UP)
        self.play(Write(step2_title), run_time=1)
        self.wait(0.5)
        
        # Key insight
        key_text = Text(
            "Velocity must point along the path!",
            font_size=28,
            color=EMPHASIS_COLOR,
            font="monospace"
        )
        key_text.to_edge(UP)
        key_text.shift(DOWN * 1)
        
        self.play(Write(key_text), run_time=1.5)
        self.wait(0.8)
        
        # Velocity equation
        vel_eq = MathTex(
            r"\vec{V} = v\hat{u}_t = \dot{s}\hat{u}_t",
            font_size=40,
            color=VELOCITY_COLOR
        )
        vel_eq.shift(DOWN * 1)
        
        self.play(Write(vel_eq), run_time=1.5)
        self.wait(1.0)
        
        # Where s is arc length
        arc_text = MathTex(
            r"s \text{ = arc length along path}",
            font_size=28,
            color=GRAY
        )
        arc_text.next_to(vel_eq, DOWN, buff=0.5)
        
        self.play(Write(arc_text), run_time=1)
        self.wait(1.0)
        
        vel_box = SurroundingRectangle(vel_eq, color=EMPHASIS_COLOR, buff=0.2)
        self.play(Create(vel_box), run_time=0.8)
        self.wait(1.0)
        
        self.play(FadeOut(step2_title), FadeOut(key_text), FadeOut(vel_box), FadeOut(arc_text))
        self.wait(0.3)
        
        # ===== Step 3: Curvature and Radius =====
        step3_title = Text("Step 3: Radius of Curvature", font_size=32, color=TIME_COLOR)
        step3_title.to_edge(UP)
        self.play(Write(step3_title), run_time=1)
        self.wait(0.5)
        
        # Keep velocity equation visible
        vel_eq_small = vel_eq.copy()
        vel_eq_small.scale(0.8)
        vel_eq_small.shift(UP * 2)
        
        self.play(
            TransformFromCopy(vel_eq, vel_eq_small),
            FadeOut(vel_eq)
        )
        self.wait(0.5)
        
        # Curvature concept
        curvature_text = MathTex(
            r"\rho \text{ = radius of curvature (path-dependent)}",
            font_size=28,
            color=TIME_COLOR
        )
        curvature_text.shift(DOWN * 0.5)
        
        self.play(Write(curvature_text), run_time=1.5)
        self.wait(0.8)
        
        # Unit vector rotation
        rotation_eq = MathTex(
            r"\frac{d\hat{u}_t}{ds} = \frac{1}{\rho}\hat{u}_n",
            font_size=36,
            color=TIME_COLOR
        )
        rotation_eq.next_to(curvature_text, DOWN, buff=0.8)
        
        self.play(Write(rotation_eq), run_time=1.5)
        self.wait(1.0)
        
        self.play(FadeOut(step3_title), FadeOut(curvature_text))
        self.wait(0.3)
        
        # ===== Step 4: Acceleration Derivation =====
        step4_title = Text("Step 4: Acceleration Decomposition", font_size=32, color=ACCELERATION_COLOR)
        step4_title.to_edge(UP)
        self.play(Write(step4_title), run_time=1)
        self.wait(0.5)
        
        # Acceleration derivation
        acc_step1 = MathTex(
            r"\vec{a} = \frac{d\vec{V}}{dt} = \frac{d(v\hat{u}_t)}{dt}",
            font_size=32,
            color=ACCELERATION_COLOR
        )
        acc_step1.next_to(rotation_eq, DOWN, buff=1.0)
        
        self.play(Write(acc_step1), run_time=1.5)
        self.wait(0.8)
        
        # Product rule
        acc_step2 = MathTex(
            r"\vec{a} = \frac{dv}{dt}\hat{u}_t + v\frac{d\hat{u}_t}{dt}",
            font_size=32,
            color=ACCELERATION_COLOR
        )
        acc_step2.next_to(acc_step1, DOWN, buff=0.6)
        
        self.play(Write(acc_step2), run_time=1.5)
        self.wait(0.8)
        
        # Use chain rule: d/dt = (ds/dt) * d/ds
        acc_step3 = MathTex(
            r"\vec{a} = \frac{dv}{dt}\hat{u}_t + v\frac{d\hat{u}_t}{ds}\frac{ds}{dt}",
            font_size=32,
            color=ACCELERATION_COLOR
        )
        acc_step3.next_to(acc_step2, DOWN, buff=0.6)
        
        self.play(Write(acc_step3), run_time=1.5)
        self.wait(0.8)
        
        # Substitute d(hat u_t)/ds and v = ds/dt
        acc_final = MathTex(
            r"\vec{a} = \frac{dv}{dt}\hat{u}_t + \frac{v^2}{\rho}\hat{u}_n",
            font_size=36,
            color=ACCELERATION_COLOR
        )
        acc_final.next_to(acc_step3, DOWN, buff=0.8)
        
        self.play(Write(acc_final), run_time=2)
        self.wait(1.0)
        
        # Component labels
        comp_box = SurroundingRectangle(acc_final, color=EMPHASIS_COLOR, buff=0.2)
        self.play(Create(comp_box), run_time=0.8)
        self.wait(0.5)
        
        tangential_comp = Text(
            "Tangential:\nspeed change",
            font_size=20,
            color=VELOCITY_COLOR,
            font="monospace"
        )
        tangential_comp.to_edge(LEFT)
        tangential_comp.shift(DOWN * 0.5)
        
        normal_comp = Text(
            "Normal:\ncurvature effect",
            font_size=20,
            color=ACCELERATION_COLOR,
            font="monospace"
        )
        normal_comp.to_edge(RIGHT)
        normal_comp.shift(DOWN * 0.5)
        
        self.play(Write(tangential_comp), Write(normal_comp), run_time=1.5)
        self.wait(1.5)


# ============================================================================
# SCENE 4: COMPARISON TABLE
# ============================================================================

class ComparisonTable(Scene):
    """
    Presents all three coordinate systems side by side
    for easy comparison and reference.
    """
    
    def construct(self):
        # Title
        title = Text(
            "Curvilinear Coordinates: Side-by-Side Comparison",
            font_size=42,
            color=EMPHASIS_COLOR
        )
        title.to_edge(UP)
        self.play(Write(title), run_time=1.5)
        self.wait(1.0)
        
        # Create comparison table with three columns
        col_width = 5.5
        row_height = 0.8
        
        # Headers
        rect_header = Text("Rectangular", font_size=28, color=POSITION_COLOR)
        cyl_header = Text("Cylindrical/Polar", font_size=28, color=TIME_COLOR)
        norm_header = Text("Normal/Tangential", font_size=28, color=HIGHLIGHT_COLOR)
        
        rect_header.move_to(LEFT * 5.5)
        cyl_header.move_to(ORIGIN)
        norm_header.move_to(RIGHT * 5.5)
        
        rect_header.shift(UP * 3)
        cyl_header.shift(UP * 3)
        norm_header.shift(UP * 3)
        
        self.play(Write(rect_header), Write(cyl_header), Write(norm_header), run_time=1.5)
        self.wait(0.8)
        
        # Separator lines
        v_sep1 = Line(start=LEFT * 2.75 + UP * 3.5, end=LEFT * 2.75 + DOWN * 4, color=GRAY, stroke_width=2)
        v_sep2 = Line(start=RIGHT * 2.75 + UP * 3.5, end=RIGHT * 2.75 + DOWN * 4, color=GRAY, stroke_width=2)
        
        h_sep = Line(start=LEFT * 5.75 + UP * 2.5, end=RIGHT * 5.75 + UP * 2.5, color=GRAY, stroke_width=2)
        
        self.play(Create(v_sep1), Create(v_sep2), Create(h_sep), run_time=1)
        self.wait(0.5)
        
        # Row 1: Position
        y_pos = UP * 2
        
        pos_label = Text("Position", font_size=24, color=WHITE)
        pos_label.to_edge(LEFT)
        pos_label.shift(UP * 0.3)
        self.play(Write(pos_label), run_time=0.8)
        
        # Rectangular
        rect_pos = MathTex(r"\vec{r} = x\hat{i} + y\hat{j} + z\hat{k}", font_size=24, color=POSITION_COLOR)
        rect_pos.move_to(LEFT * 5.5 + y_pos)
        self.play(Write(rect_pos), run_time=1)
        
        # Cylindrical
        cyl_pos = MathTex(r"\vec{r} = r\hat{u}_r", font_size=24, color=TIME_COLOR)
        cyl_pos.move_to(ORIGIN + y_pos)
        self.play(Write(cyl_pos), run_time=1)
        
        # Normal/Tangential
        norm_pos = MathTex(r"\vec{r} = s(t)\text{ along path}", font_size=24, color=HIGHLIGHT_COLOR)
        norm_pos.move_to(RIGHT * 5.5 + y_pos)
        self.play(Write(norm_pos), run_time=1)
        self.wait(0.8)
        
        # Row 2: Velocity
        y_vel = y_pos + DOWN * 1.2
        
        vel_label = Text("Velocity", font_size=24, color=WHITE)
        vel_label.to_edge(LEFT)
        vel_label.shift(y_vel + RIGHT * 0.5)
        self.play(Write(vel_label), run_time=0.8)
        
        # Rectangular
        rect_vel = MathTex(r"\vec{V} = \dot{x}\hat{i} + \dot{y}\hat{j} + \dot{z}\hat{k}", font_size=22, color=VELOCITY_COLOR)
        rect_vel.move_to(LEFT * 5.5 + y_vel)
        self.play(Write(rect_vel), run_time=1)
        
        # Cylindrical
        cyl_vel = MathTex(r"\vec{V} = \dot{r}\hat{u}_r + r\dot{\theta}\hat{u}_{\theta}", font_size=22, color=VELOCITY_COLOR)
        cyl_vel.move_to(ORIGIN + y_vel)
        self.play(Write(cyl_vel), run_time=1)
        
        # Normal/Tangential
        norm_vel = MathTex(r"\vec{V} = v\hat{u}_t = \dot{s}\hat{u}_t", font_size=22, color=VELOCITY_COLOR)
        norm_vel.move_to(RIGHT * 5.5 + y_vel)
        self.play(Write(norm_vel), run_time=1)
        self.wait(0.8)
        
        # Row 3: Acceleration
        y_acc = y_vel + DOWN * 1.5
        
        acc_label = Text("Acceleration", font_size=24, color=WHITE)
        acc_label.to_edge(LEFT)
        acc_label.shift(y_acc + RIGHT * 0.5)
        self.play(Write(acc_label), run_time=0.8)
        
        # Rectangular
        rect_acc = MathTex(
            r"\vec{a} = \ddot{x}\hat{i} + \ddot{y}\hat{j} + \ddot{z}\hat{k}",
            font_size=20,
            color=ACCELERATION_COLOR
        )
        rect_acc.move_to(LEFT * 5.5 + y_acc)
        self.play(Write(rect_acc), run_time=1)
        
        # Cylindrical
        cyl_acc_text = r"(\ddot{r} - r\dot{\theta}^2)\hat{u}_r"
        cyl_acc_text2 = r"(r\ddot{\theta} + 2\dot{r}\dot{\theta})\hat{u}_{\theta}"
        
        cyl_acc1 = MathTex(cyl_acc_text, font_size=18, color=ACCELERATION_COLOR)
        cyl_acc2 = MathTex(cyl_acc_text2, font_size=18, color=ACCELERATION_COLOR)
        
        cyl_acc1.move_to(ORIGIN + y_acc + UP * 0.3)
        cyl_acc2.move_to(ORIGIN + y_acc + DOWN * 0.3)
        
        self.play(Write(cyl_acc1), Write(cyl_acc2), run_time=1)
        
        # Normal/Tangential
        norm_acc_text = r"\frac{dv}{dt}\hat{u}_t + \frac{v^2}{\rho}\hat{u}_n"
        norm_acc = MathTex(norm_acc_text, font_size=22, color=ACCELERATION_COLOR)
        norm_acc.move_to(RIGHT * 5.5 + y_acc)
        self.play(Write(norm_acc), run_time=1)
        self.wait(1.0)
        
        # Row 4: Best Use Case
        y_use = y_acc + DOWN * 1.5
        
        use_label = Text("Best For", font_size=24, color=WHITE)
        use_label.to_edge(LEFT)
        use_label.shift(y_use + RIGHT * 0.5)
        self.play(Write(use_label), run_time=0.8)
        
        # Rectangular use case
        rect_use = Text(
            "General motion\nin 3D space",
            font_size=18,
            color=POSITION_COLOR,
            font="monospace"
        )
        rect_use.move_to(LEFT * 5.5 + y_use)
        self.play(Write(rect_use), run_time=1)
        
        # Cylindrical use case
        cyl_use = Text(
            "Radial/angular\nmotion, spinning",
            font_size=18,
            color=TIME_COLOR,
            font="monospace"
        )
        cyl_use.move_to(ORIGIN + y_use)
        self.play(Write(cyl_use), run_time=1)
        
        # Normal/Tangential use case
        norm_use = Text(
            "Following known\npaths, curves",
            font_size=18,
            color=HIGHLIGHT_COLOR,
            font="monospace"
        )
        norm_use.move_to(RIGHT * 5.5 + y_use)
        self.play(Write(norm_use), run_time=1)
        self.wait(1.5)
        
        # Final note
        final_note = Text(
            "Choose coordinates that match your problem's geometry!",
            font_size=24,
            color=EMPHASIS_COLOR,
            
            font="monospace"
        )
        final_note.to_edge(DOWN)
        final_note.shift(UP * 0.3)
        
        note_box = SurroundingRectangle(final_note, color=EMPHASIS_COLOR, buff=0.3)
        
        self.play(Create(note_box), run_time=0.8)
        self.play(Write(final_note), run_time=1.5)
        self.wait(2.0)


# ============================================================================
# MAIN: Render Configuration
# ============================================================================

if __name__ == "__main__":
    """
    To render individual scenes:
    manim -pql kinematics_coordinate_systems.py RectangularCoordinatesDerivation
    manim -pql kinematics_coordinate_systems.py CylindricalCoordinatesDerivation
    manim -pql kinematics_coordinate_systems.py NormalTangentialCoordinatesDerivation
    manim -pql kinematics_coordinate_systems.py ComparisonTable
    
    To render all scenes:
    manim -pql kinematics_coordinate_systems.py
    """
    pass
