"""
Curvilinear Kinematics Animation Series
Follows 3B1B style guide and CH12 notation conventions
Animation of position, velocity, and acceleration in three coordinate systems:
1. Rectangular (Cartesian)
2. Cylindrical/Polar
3. Normal-Tangential (Path coordinates)
"""

from manim import *
import numpy as np

# Global configuration (3B1B style)
config.background_color = "#1C1C1C"
config.frame_width = 16
config.frame_height = 9

# Color Palette (following style guide)
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


# ============================================================================
# Scene 1: Introduction and Visual Hook
# ============================================================================

class Scene01_Introduction(ThreeDScene):
    """
    Visual hook: A particle traces a 3D helix while its position vector updates.
    No equations yet - pure visual intuition.
    """
    def construct(self):
        # Setup camera
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)

        # Create 3D axes (subtle, not dominant)
        axes = ThreeDAxes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            z_range=[-2, 4, 1],
            x_length=8, y_length=8, z_length=6,
            axis_config={"stroke_width": 2, "color": GRAY}
        )

        # Define the path: 3D helix
        def helix_path(t):
            return np.array([
                2 * np.cos(t),
                2 * np.sin(t),
                0.3 * t
            ])

        # Create the path curve
        path_curve = ParametricFunction(
            helix_path,
            t_range=[0, 4*PI],
            color=Colors.PATH,
            stroke_width=3
        )

        # Time tracker for animation
        t = ValueTracker(0)

        # Particle (small sphere)
        particle = always_redraw(lambda: Sphere(
            radius=0.15,
            color=Colors.POSITION
        ).move_to(helix_path(t.get_value())))

        # Position vector from origin to particle
        position_vector = always_redraw(lambda: Arrow3D(
            start=ORIGIN,
            end=helix_path(t.get_value()),
            color=Colors.POSITION,
            thickness=0.04
        ))

        # Label for position vector
        r_label = Text("r(t)", color=Colors.POSITION, font_size=36)
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


# ============================================================================
# Scene 2: Split-Screen Layout Setup
# ============================================================================

class Scene02_LayoutSetup(Scene):
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

        self.play(
            Create(divider),
            Write(left_label),
            Write(right_label),
            run_time=1.5
        )
        self.wait(2)


# ============================================================================
# Scene 3: Rectangular (Cartesian) Coordinates
# ============================================================================

class Scene03_RectangularCoordinates(ThreeDScene):
    """
    Rectangular coordinate system derivation.
    Key insight: Unit vectors î, ĵ, k̂ are FIXED in space.
    """
    def construct(self):
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)

        # ===== LEFT PANEL: 3D Visualization =====
        # Smaller axes for left panel
        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[-1, 2, 1],
            x_length=4, y_length=4, z_length=3,
        ).shift(LEFT * 4)

        # Unit vectors (FIXED - key point)
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

        # Path on left panel
        def helix_left(t):
            return np.array([
                -4 + 1.5 * np.cos(t),
                1.5 * np.sin(t),
                0.2 * t
            ])

        path = ParametricFunction(
            helix_left,
            t_range=[0, 3*PI],
            color=Colors.PATH,
            stroke_width=2
        )

        t = ValueTracker(PI/2)

        # Position function
        def get_pos():
            _t = t.get_value()
            return np.array([
                -4 + 1.5 * np.cos(_t),
                1.5 * np.sin(_t),
                0.2 * _t
            ])

        position_vec = always_redraw(lambda: Arrow3D(
            start=axes.c2p(0,0,0),
            end=axes.c2p(*get_pos()[:3]),
            color=Colors.POSITION,
            thickness=0.04
        ))

        # Velocity vector
        def get_vel():
            _t = t.get_value()
            return 0.5 * np.array([
                -1.5 * np.sin(_t),
                1.5 * np.cos(_t),
                0.2
            ])

        velocity_vec = always_redraw(lambda: Arrow3D(
            start=axes.c2p(*get_pos()[:3]),
            end=axes.c2p(*get_pos()[:3]) + get_vel(),
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
            start=axes.c2p(*get_pos()[:3]),
            end=axes.c2p(*get_pos()[:3]) + get_acc(),
            color=Colors.ACCELERATION,
            thickness=0.03
        ))

        particle = always_redraw(lambda: Sphere(
            radius=0.1, color=WHITE
        ).move_to(axes.c2p(*get_pos()[:3])))

        # ===== RIGHT PANEL: Equations =====

        # Title
        title = Text("Rectangular Coordinates", font_size=32, color=WHITE)
        title.move_to(RIGHT * 4 + UP * 3)
        self.add_fixed_in_frame_mobjects(title)

        # Position equation (simplified to avoid LaTeX rendering issues)
        pos_eq = Text("Position: r(t) = x(t)i + y(t)j + z(t)k", font_size=24)
        pos_eq.move_to(RIGHT * 4 + UP * 1.8)
        self.add_fixed_in_frame_mobjects(pos_eq)

        # Key insight box
        insight_text = Text("i, j, k are fixed", font_size=22, color=Colors.HIGHLIGHT)
        insight_text.move_to(RIGHT * 4 + UP * 0.5)
        insight_box = SurroundingRectangle(insight_text, color=Colors.HIGHLIGHT, buff=0.2)
        self.add_fixed_in_frame_mobjects(insight_text, insight_box)

        # Velocity equation
        vel_eq = Text("V = Vx*i + Vy*j + Vz*k", font_size=22)
        vel_eq.move_to(RIGHT * 4 + DOWN * 0.7)
        self.add_fixed_in_frame_mobjects(vel_eq)

        # Acceleration equation
        acc_eq = Text("a = ax*i + ay*j + az*k", font_size=22)
        acc_eq.move_to(RIGHT * 4 + DOWN * 2)
        self.add_fixed_in_frame_mobjects(acc_eq)

        # ===== ANIMATION SEQUENCE =====

        self.play(Create(axes), run_time=1)
        self.play(
            Create(i_hat), Create(j_hat), Create(k_hat),
            Write(title),
            run_time=1.5
        )
        self.wait(0.5)

        self.play(Create(path), run_time=1)
        self.add(particle, position_vec)
        self.wait(0.5)

        self.play(Write(pos_eq), run_time=2)
        self.wait(1)

        self.play(
            Create(insight_box),
            Write(insight_text),
            run_time=1.5
        )
        self.wait(1)

        self.play(Write(vel_eq))
        self.add(velocity_vec)
        self.wait(1)

        self.play(Write(acc_eq))
        self.add(accel_vec)
        self.wait(1)

        self.play(
            t.animate.set_value(2.5*PI),
            run_time=5,
            rate_func=linear
        )
        self.wait(2)


# ============================================================================
# Scene 4: Cylindrical Coordinates
# ============================================================================

class Scene04_CylindricalCoordinates(ThreeDScene):
    """
    Cylindrical coordinate system.
    CRITICAL: Show that û_r and û_θ ROTATE with the particle.
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

        # Rotating unit vectors
        def get_u_r():
            th = theta_val.get_value()
            return np.array([np.cos(th), np.sin(th), 0])

        def get_u_theta():
            th = theta_val.get_value()
            return np.array([-np.sin(th), np.cos(th), 0])

        u_r_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * axes.c2p(*get_u_r()[:3]) - axes.c2p(0,0,0),
            color=Colors.CYL_R,
            thickness=0.03
        ))

        u_theta_vec = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * axes.c2p(*get_u_theta()[:3]) - axes.c2p(0,0,0),
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

        # ===== RIGHT PANEL =====

        title = Text("Cylindrical Coordinates", font_size=32)
        title.move_to(RIGHT * 4 + UP * 3.2)
        self.add_fixed_in_frame_mobjects(title)

        # Critical insight
        insight1 = Text("u_r, u_theta ROTATE!", font_size=24, color=Colors.HIGHLIGHT)
        insight1.move_to(RIGHT * 4 + UP * 2.5)
        self.add_fixed_in_frame_mobjects(insight1)

        # Unit vector derivatives
        deriv1 = Text("u_r' = theta_dot * u_theta", font_size=20)
        deriv1.move_to(RIGHT * 4 + UP * 1.8)
        self.add_fixed_in_frame_mobjects(deriv1)

        deriv2 = Text("u_theta' = -theta_dot * u_r", font_size=20)
        deriv2.move_to(RIGHT * 4 + UP * 1.2)
        self.add_fixed_in_frame_mobjects(deriv2)

        # Position
        pos_eq = Text("r = r*u_r + z*u_z", font_size=22)
        pos_eq.move_to(RIGHT * 4 + UP * 0.4)
        self.add_fixed_in_frame_mobjects(pos_eq)

        # Velocity
        vel_eq = Text("V = r_dot*u_r + r*theta_dot*u_theta + z_dot*u_z", font_size=18)
        vel_eq.move_to(RIGHT * 4 + DOWN * 0.5)
        self.add_fixed_in_frame_mobjects(vel_eq)

        # Acceleration (simplified notation)
        acc_eq = Text("a_r = (r_ddot - r*theta_dot^2)", font_size=18, color=Colors.CYL_R)
        acc_eq.move_to(RIGHT * 4 + DOWN * 1.3)
        self.add_fixed_in_frame_mobjects(acc_eq)

        acc_theta = Text("a_theta = (r*theta_ddot + 2*r_dot*theta_dot)", font_size=18, color=Colors.CYL_THETA)
        acc_theta.move_to(RIGHT * 4 + DOWN * 2)
        self.add_fixed_in_frame_mobjects(acc_theta)

        # ===== ANIMATION SEQUENCE =====

        self.play(Create(axes), run_time=1)
        self.play(Write(title))
        self.wait(0.5)

        self.add(particle, radial_line, theta_arc)
        self.wait(0.5)

        self.play(Write(insight1))
        self.wait(0.5)

        self.play(
            Create(u_r_vec),
            Create(u_theta_vec),
            Create(u_z_vec),
            run_time=1.5
        )

        self.play(
            theta_val.animate.set_value(PI/4 + PI/2),
            run_time=3,
            rate_func=smooth
        )
        self.wait(0.5)

        self.play(Write(deriv1))
        self.play(Write(deriv2))
        self.wait(1)

        self.play(Write(pos_eq))
        self.wait(0.5)

        self.play(Write(vel_eq))
        self.wait(0.5)

        self.play(Write(acc_eq))
        self.play(Write(acc_theta))
        self.wait(0.5)

        self.play(
            theta_val.animate.set_value(PI/4 + 2*PI),
            run_time=5,
            rate_func=linear
        )
        self.wait(2)


# ============================================================================
# Scene 5: Normal-Tangential (Path) Coordinates
# ============================================================================

class Scene05_NormalTangentialCoordinates(ThreeDScene):
    """
    Normal-tangential (path/intrinsic) coordinates.
    Unit vectors are defined by PATH GEOMETRY.
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

        # Path function
        def path_func(s):
            return np.array([
                2 * np.cos(s),
                2 * np.sin(s),
                0.2 * s
            ])

        def tangent_vec(s):
            raw = np.array([
                -2 * np.sin(s),
                2 * np.cos(s),
                0.2
            ])
            return raw / np.linalg.norm(raw)

        def normal_vec(s):
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
            lambda s: axes.c2p(
                2 * np.cos(s),
                2 * np.sin(s),
                0.2 * s
            ),
            t_range=[0, 3*PI],
            color=Colors.PATH,
            stroke_width=2
        )

        s = ValueTracker(PI)

        def get_pos():
            return axes.c2p(*path_func(s.get_value())[:3])

        particle = always_redraw(lambda: Sphere(
            radius=0.1, color=WHITE
        ).move_to(get_pos()))

        # Tangent vector
        u_t = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * axes.c2p(*tangent_vec(s.get_value())[:3]) - axes.c2p(0,0,0),
            color=Colors.PATH_T,
            thickness=0.03
        ))

        # Normal vector
        u_n = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * axes.c2p(*normal_vec(s.get_value())[:3]) - axes.c2p(0,0,0),
            color=Colors.PATH_N,
            thickness=0.03
        ))

        # Binormal vector
        u_b = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * axes.c2p(*binormal_vec(s.get_value())[:3]) - axes.c2p(0,0,0),
            color=Colors.PATH_B,
            thickness=0.03
        ))

        # ===== RIGHT PANEL =====

        title = Text("Normal-Tangential Coordinates", font_size=28)
        title.move_to(RIGHT * 4.2 + UP * 3.2)
        self.add_fixed_in_frame_mobjects(title)

        # Key insight
        insight = Text("Basis defined by path geometry", font_size=22, color=Colors.HIGHLIGHT)
        insight.move_to(RIGHT * 4.2 + UP * 2.3)
        self.add_fixed_in_frame_mobjects(insight)

        # Unit vector definitions
        u_t_def = Text("u_t = tangent direction", font_size=18)
        u_t_def.move_to(RIGHT * 4.2 + UP * 1.7)
        self.add_fixed_in_frame_mobjects(u_t_def)

        u_n_def = Text("u_n = toward center O'", font_size=18)
        u_n_def.move_to(RIGHT * 4.2 + UP * 1.2)
        self.add_fixed_in_frame_mobjects(u_n_def)

        # Arc length relation
        arc_eq = Text("ds = rho * dtheta", font_size=20)
        arc_eq.move_to(RIGHT * 4.2 + UP * 0.5)
        self.add_fixed_in_frame_mobjects(arc_eq)

        # Velocity
        vel_title = Text("Velocity:", font_size=22)
        vel_title.move_to(RIGHT * 4.2 + DOWN * 0.2)
        self.add_fixed_in_frame_mobjects(vel_title)

        vel_eq = Text("V = v*u_t = s_dot*u_t", font_size=20)
        vel_eq.move_to(RIGHT * 4.2 + DOWN * 0.7)
        self.add_fixed_in_frame_mobjects(vel_eq)

        # Acceleration
        acc_title = Text("Acceleration:", font_size=22)
        acc_title.move_to(RIGHT * 4.2 + DOWN * 1.5)
        self.add_fixed_in_frame_mobjects(acc_title)

        acc_eq = Text("a = a_t*u_t + a_n*u_n", font_size=20)
        acc_eq.move_to(RIGHT * 4.2 + DOWN * 2)
        self.add_fixed_in_frame_mobjects(acc_eq)

        components = VGroup(
            Text("a_t = v_dot", font_size=18, color=Colors.PATH_T),
            Text("a_n = v^2/rho", font_size=18, color=Colors.PATH_N),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        components.move_to(RIGHT * 4.2 + DOWN * 2.8)
        self.add_fixed_in_frame_mobjects(components)

        # ===== ANIMATION SEQUENCE =====

        self.play(Create(axes), run_time=1)
        self.play(Write(title))
        self.play(Create(path_curve), run_time=1.5)
        self.add(particle)
        self.wait(0.5)

        self.play(Write(insight))
        self.wait(0.5)

        self.play(Create(u_t), Write(u_t_def))
        self.wait(0.3)
        self.play(Create(u_n), Write(u_n_def))
        self.wait(0.3)
        self.play(Create(u_b))
        self.wait(0.5)

        self.play(Write(arc_eq))
        self.wait(0.5)

        self.play(Write(vel_title), Write(vel_eq))
        self.wait(0.5)

        self.play(Write(acc_title), Write(acc_eq))
        self.wait(0.5)
        self.play(Write(components))
        self.wait(0.5)

        self.play(
            s.animate.set_value(2.5*PI),
            run_time=6,
            rate_func=linear
        )
        self.wait(2)


# ============================================================================
# Scene 6: Comparison and Summary
# ============================================================================

class Scene06_ComparisonSummary(Scene):
    """
    Side-by-side comparison of all three coordinate systems.
    """
    def construct(self):
        # Title
        title = Text("Coordinate System Comparison", font_size=40, color=WHITE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))
        self.wait(1)

        # Three columns
        col_width = 4.8

        # Column 1: Rectangular
        rect_title = Text("Rectangular", font_size=28, color=Colors.RECT_X)
        rect_title.move_to(LEFT * 5.2 + UP * 2)

        rect_eqs = VGroup(
            Text("r = x*i + y*j + z*k", font_size=16),
            Text("V = Vx*i + Vy*j + Vz*k", font_size=16),
            Text("a = ax*i + ay*j + az*k", font_size=16),
        ).arrange(DOWN, buff=0.3)
        rect_eqs.move_to(LEFT * 5.2 + UP * 0.2)

        rect_use = Text("Use: Straight-line\nmotion", font_size=16, line_spacing=1.2)
        rect_use.move_to(LEFT * 5.2 + DOWN * 2)

        # Column 2: Cylindrical
        cyl_title = Text("Cylindrical", font_size=28, color=Colors.CYL_R)
        cyl_title.move_to(UP * 2)

        cyl_eqs = VGroup(
            Text("r = r*u_r + z*u_z", font_size=16),
            Text("V = r_dot*u_r + r*theta_dot*u_theta", font_size=14),
            Text("a = (r_ddot - r*theta_dot^2)*u_r + ...", font_size=14),
        ).arrange(DOWN, buff=0.3)
        cyl_eqs.move_to(UP * 0.2)

        cyl_use = Text("Use: Circular or\nspiral motion", font_size=16, line_spacing=1.2)
        cyl_use.move_to(DOWN * 2)

        # Column 3: Normal-Tangential
        nt_title = Text("Normal-Tangential", font_size=28, color=Colors.PATH_T)
        nt_title.move_to(RIGHT * 5.2 + UP * 2)

        nt_eqs = VGroup(
            Text("V = v*u_t", font_size=16),
            Text("a = v_dot*u_t + v^2/rho*u_n", font_size=16),
        ).arrange(DOWN, buff=0.4)
        nt_eqs.move_to(RIGHT * 5.2 + UP * 0.5)

        nt_use = Text("Use: Known path\nshape and curvature", font_size=16, line_spacing=1.2)
        nt_use.move_to(RIGHT * 5.2 + DOWN * 2)

        # Dividing lines
        line1 = Line(UP * 3 + LEFT * 2.4, DOWN * 2.5 + LEFT * 2.4, color=GRAY, stroke_width=1)
        line2 = Line(UP * 3 + RIGHT * 2.4, DOWN * 2.5 + RIGHT * 2.4, color=GRAY, stroke_width=1)

        # Animation
        self.play(Create(line1), Create(line2), run_time=1)

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

        self.wait(2)

        # Key takeaway
        takeaway = Text(
            "Choose the coordinate system\nthat matches your problem's symmetry!",
            font_size=28,
            color=Colors.HIGHLIGHT,
            line_spacing=1.2
        )
        takeaway.to_edge(DOWN, buff=0.5)
        self.play(Write(takeaway))
        self.wait(3)
