"""
Simplified Curvilinear Kinematics Animation
Focus on core animations without complex text overlays to avoid file conflicts
"""

from manim import *
import numpy as np

# Global configuration
config.background_color = "#1C1C1C"
config.frame_width = 16
config.frame_height = 9

class Colors:
    RECT_X = "#FC6255"
    RECT_Y = "#83C167"
    RECT_Z = "#58C4DD"
    CYL_R = "#F0AC00"
    CYL_THETA = "#9A72AC"
    CYL_Z = "#58C4DD"
    PATH_T = "#FFFF00"
    PATH_N = "#FF6B6B"
    PATH_B = "#5CD0B3"
    POSITION = "#FFFFFF"
    VELOCITY = "#58C4DD"
    ACCELERATION = "#FC6255"
    PATH = "#888888"
    HIGHLIGHT = "#FFFF00"


class CurvilinearKinematicsIntro(ThreeDScene):
    """3D Helix animation - particle motion visualization"""
    def construct(self):
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)

        # Create axes
        axes = ThreeDAxes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            z_range=[-2, 4, 1],
            x_length=8, y_length=8, z_length=6,
            axis_config={"stroke_width": 2, "color": GRAY}
        )

        # Helix path
        def helix_path(t):
            return np.array([
                2 * np.cos(t),
                2 * np.sin(t),
                0.3 * t
            ])

        path_curve = ParametricFunction(
            helix_path,
            t_range=[0, 4*PI],
            color=Colors.PATH,
            stroke_width=3
        )

        t = ValueTracker(0)

        # Particle
        particle = always_redraw(lambda: Sphere(
            radius=0.15,
            color=Colors.POSITION
        ).move_to(helix_path(t.get_value())))

        # Position vector
        position_vector = always_redraw(lambda: Arrow3D(
            start=ORIGIN,
            end=helix_path(t.get_value()),
            color=Colors.POSITION,
            thickness=0.04
        ))

        # Title
        title = Text("Curvilinear Kinematics:", font_size=40, color=WHITE)
        title.to_corner(UL, buff=0.3)
        self.add_fixed_in_frame_mobjects(title)

        subtitle = Text("Position, Velocity, and Acceleration in Different Coordinate Systems",
                       font_size=28, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.2)
        self.add_fixed_in_frame_mobjects(subtitle)

        # Animate
        self.play(Create(axes), run_time=1)
        self.wait(0.5)
        self.play(Create(path_curve), run_time=2)
        self.wait(0.5)
        self.add(particle, position_vector)
        self.play(Write(title))
        self.play(Write(subtitle))
        self.wait(1)

        # Animate motion
        self.play(
            t.animate.set_value(4*PI),
            run_time=8,
            rate_func=linear
        )

        # Camera rotation
        self.begin_ambient_camera_rotation(rate=0.1)
        self.wait(3)
        self.stop_ambient_camera_rotation()
        self.wait(1)


class RectangularCoordinatesScene(ThreeDScene):
    """Rectangular coordinates with vectors"""
    def construct(self):
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)

        # Axes
        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[-1, 2, 1],
            x_length=4, y_length=4, z_length=3,
        )

        # Unit vectors
        i_hat = Arrow3D(start=ORIGIN, end=RIGHT, color=Colors.RECT_X, thickness=0.03)
        j_hat = Arrow3D(start=ORIGIN, end=UP, color=Colors.RECT_Y, thickness=0.03)
        k_hat = Arrow3D(start=ORIGIN, end=OUT, color=Colors.RECT_Z, thickness=0.03)

        # Path
        def helix_path(t):
            return np.array([
                1.5 * np.cos(t),
                1.5 * np.sin(t),
                0.2 * t
            ])

        path = ParametricFunction(
            helix_path,
            t_range=[0, 3*PI],
            color=Colors.PATH,
            stroke_width=2
        )

        t = ValueTracker(PI/2)

        def get_pos():
            _t = t.get_value()
            return np.array([
                1.5 * np.cos(_t),
                1.5 * np.sin(_t),
                0.2 * _t
            ])

        # Vectors
        position_vec = always_redraw(lambda: Arrow3D(
            start=ORIGIN,
            end=get_pos(),
            color=Colors.POSITION,
            thickness=0.04
        ))

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

        # Title
        title = Text("Rectangular (Cartesian) Coordinates", font_size=32, color=WHITE)
        title.to_corner(UL)
        self.add_fixed_in_frame_mobjects(title)

        # Animation
        self.play(Create(axes), Create(i_hat), Create(j_hat), Create(k_hat), run_time=1.5)
        self.play(Create(path), run_time=1)
        self.add(particle, position_vec)
        self.play(Write(title))
        self.wait(0.5)

        # Show vectors
        self.add(velocity_vec, accel_vec)
        self.wait(1)

        # Animate
        self.play(
            t.animate.set_value(2.5*PI),
            run_time=6,
            rate_func=linear
        )
        self.wait(2)


class CylindricalCoordinatesScene(ThreeDScene):
    """Cylindrical coordinates with rotating basis"""
    def construct(self):
        self.set_camera_orientation(phi=70*DEGREES, theta=-45*DEGREES)

        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[0, 2, 1],
            x_length=4, y_length=4, z_length=2,
        )

        theta_val = ValueTracker(PI/4)
        r_val = 1.5
        z_val = 0.5

        def get_pos():
            th = theta_val.get_value()
            return np.array([
                r_val * np.cos(th),
                r_val * np.sin(th),
                z_val
            ])

        # Rotating unit vectors
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

        radial_line = always_redraw(lambda: Line(
            start=axes.c2p(0, 0, z_val),
            end=axes.c2p(*get_pos()[:3]),
            color=Colors.CYL_R,
            stroke_width=2
        ))

        particle = always_redraw(lambda: Sphere(
            radius=0.1, color=WHITE
        ).move_to(axes.c2p(*get_pos()[:3])))

        title = Text("Cylindrical Coordinates", font_size=32, color=WHITE)
        title.to_corner(UL)
        self.add_fixed_in_frame_mobjects(title)

        # Animation
        self.play(Create(axes), run_time=1)
        self.add(particle, radial_line)
        self.play(Write(title))
        self.wait(0.5)

        self.play(
            Create(u_r_vec),
            Create(u_theta_vec),
            Create(u_z_vec),
            run_time=1.5
        )

        # Rotate to show basis vectors rotate with particle
        self.play(
            theta_val.animate.set_value(PI/4 + 2*PI),
            run_time=6,
            rate_func=linear
        )
        self.wait(2)


class NormalTangentialScene(ThreeDScene):
    """Normal-tangential coordinates - intrinsic basis"""
    def construct(self):
        self.set_camera_orientation(phi=75*DEGREES, theta=-30*DEGREES)

        axes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-1, 2, 1],
            x_length=5, y_length=5, z_length=2.5,
        )

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

        # Path
        path_curve = ParametricFunction(
            lambda s: axes.c2p(*path_func(s)[:3]),
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

        # Basis vectors
        u_t = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * axes.c2p(*tangent_vec(s.get_value())[:3]) - axes.c2p(0,0,0),
            color=Colors.PATH_T,
            thickness=0.03
        ))

        u_n = always_redraw(lambda: Arrow3D(
            start=get_pos(),
            end=get_pos() + 0.8 * axes.c2p(*normal_vec(s.get_value())[:3]) - axes.c2p(0,0,0),
            color=Colors.PATH_N,
            thickness=0.03
        ))

        title = Text("Normal-Tangential (Path) Coordinates", font_size=28, color=WHITE)
        title.to_corner(UL)
        self.add_fixed_in_frame_mobjects(title)

        # Animation
        self.play(Create(axes), run_time=1)
        self.play(Create(path_curve), run_time=1.5)
        self.add(particle)
        self.play(Write(title))
        self.wait(0.5)

        self.play(Create(u_t), run_time=0.5)
        self.wait(0.3)
        self.play(Create(u_n), run_time=0.5)
        self.wait(0.5)

        # Animate along path
        self.play(
            s.animate.set_value(2.5*PI),
            run_time=6,
            rate_func=linear
        )
        self.wait(2)


class Summary(Scene):
    """Summary slide comparing all three coordinate systems"""
    def construct(self):
        title = Text("Curvilinear Kinematics Summary", font_size=40, color=WHITE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))
        self.wait(1)

        content = VGroup(
            Text("Three Coordinate Systems:", font_size=32, color=Colors.HIGHLIGHT),
            Text("", font_size=16),
            Text("1. Rectangular: Best for straight-line motion", font_size=24),
            Text("   Fixed basis vectors i, j, k", font_size=20, color=Colors.RECT_X),
            Text("", font_size=16),
            Text("2. Cylindrical: Best for circular/spiral motion", font_size=24),
            Text("   Rotating basis vectors u_r, u_theta, u_z", font_size=20, color=Colors.CYL_R),
            Text("", font_size=16),
            Text("3. Normal-Tangential: Best for curved paths", font_size=24),
            Text("   Intrinsic basis aligned with path: u_t, u_n", font_size=20, color=Colors.PATH_T),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)

        content.center()

        self.play(Write(content), run_time=3)
        self.wait(2)

        takeaway = Text(
            "Choose the coordinate system that matches your problem's symmetry!",
            font_size=28,
            color=Colors.HIGHLIGHT
        )
        takeaway.to_edge(DOWN, buff=0.5)
        self.play(Write(takeaway))
        self.wait(3)
