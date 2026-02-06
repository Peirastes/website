"""
Curvilinear Kinematics: Coordinate Systems Animation
Rectangular Coordinates - FIXED VERSION
Using MathTex only to avoid Text rendering issues on Windows
"""

from manim import *
import numpy as np

# Configuration
config.background_color = "#1C1C1C"
config.pixel_height = 1080
config.pixel_width = 1920

# Color palette
VELOCITY_COLOR = "#58C4DD"
ACCELERATION_COLOR = "#FC6255"
POSITION_COLOR = "#5CD0B3"
EMPHASIS_COLOR = "#FFFF00"


class RectangularCoordinatesDerivation(Scene):
    """
    Rectangular Coordinates - simplified to avoid Text rendering issues
    Uses only MathTex for labels
    """

    def construct(self):
        # ===== TITLE SEQUENCE =====
        title = MathTex(r"\text{Rectangular Coordinates}", font_size=56, color=WHITE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1.5)
        self.wait(1)

        subtitle = MathTex(r"\text{Cartesian Coordinate System}", font_size=40, color=EMPHASIS_COLOR)
        subtitle.next_to(title, DOWN, buff=0.5)
        self.play(Write(subtitle), run_time=1)
        self.wait(2)

        # Fade out
        self.play(FadeOut(title), FadeOut(subtitle), run_time=1)
        self.wait(1)

        # ===== SETUP: Split screen layout =====
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

        # ===== TIME PARAMETER AND TRAJECTORY =====
        t = ValueTracker(0)

        # Parametric helix trajectory
        def get_position(time):
            x = 2 * np.cos(time)
            y = 2 * np.sin(time)
            z = time / PI
            return axes_3d.c2p(x, y, z)

        def get_velocity(time):
            dx_dt = -2 * np.sin(time)
            dy_dt = 2 * np.cos(time)
            dz_dt = 1 / PI
            return np.array([dx_dt, dy_dt, dz_dt]) * 0.35

        def get_acceleration(time):
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
        pos_label = MathTex(r"\text{Position Vector}", font_size=28, color=POSITION_COLOR)
        pos_label.move_to(RIGHT * 3 + UP * 2.3)

        pos_eq = MathTex(
            r"\vec{r}(t) = x(t)\,\hat{i} + y(t)\,\hat{j} + z(t)\,\hat{k}",
            font_size=28,
            color=POSITION_COLOR
        )
        pos_eq.next_to(pos_label, DOWN, buff=0.4)

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

        self.play(FadeIn(velocity_vector), run_time=1)
        self.wait(0.5)

        # Add velocity equations
        vel_label = MathTex(r"\text{Velocity Vector}", font_size=28, color=VELOCITY_COLOR)
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

        self.play(FadeIn(acceleration_vector), run_time=1)
        self.wait(0.5)

        # Add acceleration equations
        acc_label = MathTex(r"\text{Acceleration Vector}", font_size=28, color=ACCELERATION_COLOR)
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
            r"\text{Unit vectors } \hat{i}, \hat{j}, \hat{k} \text{ are } \mathbf{FIXED}",
            font_size=24,
            color=EMPHASIS_COLOR
        )
        insight.move_to(RIGHT * 3 + DOWN * 2.5)
        insight_box = SurroundingRectangle(insight, color=EMPHASIS_COLOR, buff=0.2, stroke_width=2)

        self.play(Create(insight_box), run_time=0.8)
        self.play(Write(insight), run_time=1.5)
        self.wait(2)
