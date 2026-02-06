# Curvilinear Kinematics: Coordinate Systems Animation

## Overview

This Manim animation script creates professional-quality educational videos demonstrating the derivation and comparison of three fundamental coordinate systems used in kinematics:

1. **Rectangular (Cartesian) Coordinates** - General 3D motion analysis
2. **Cylindrical/Polar Coordinates** - Radial and angular motion
3. **Normal/Tangential Coordinates** - Motion along known curves

Each animation follows the **3Blue1Brown animation style guide**, featuring:
- Dark sophisticated backgrounds
- Jewel-tone color palette
- Pedagogically-driven pacing
- Clear step-by-step derivations
- Smooth mathematical transformations

---

## Installation & Setup

### Prerequisites

You need to install:
1. **Python 3.8+**
2. **Manim Community Edition**
3. **FFmpeg**
4. **LaTeX distribution**

### Quick Installation (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3 python3-pip ffmpeg texlive texlive-fonts-recommended

# Install Manim
pip install manim

# Verify installation
manim --version
```

### Installation (macOS with Homebrew)

```bash
# Install system dependencies
brew install python3 ffmpeg texlive

# Install Manim
pip install manim

# Verify installation
manim --version
```

### Installation (Windows)

1. Install Python 3.8+ from [python.org](https://www.python.org)
2. Install FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
3. Install LaTeX (MikTeX or TeX Live)
4. Open Command Prompt and run:
   ```bash
   pip install manim
   manim --version
   ```

---

## Usage Guide

### Running Individual Scenes

```bash
# Render Rectangular Coordinates derivation
manim -pql kinematics_coordinate_systems.py RectangularCoordinatesDerivation

# Render Cylindrical/Polar Coordinates derivation
manim -pql kinematics_coordinate_systems.py CylindricalCoordinatesDerivation

# Render Normal/Tangential Coordinates derivation
manim -pql kinematics_coordinate_systems.py NormalTangentialCoordinatesDerivation

# Render Comparison Table
manim -pql kinematics_coordinate_systems.py ComparisonTable
```

### Running All Scenes

```bash
manim -pql kinematics_coordinate_systems.py
```

### Quality and Output Options

```bash
# Different quality levels (p = preview, q = quality, l = low, m = medium, h = high)

# Low quality (fast, for testing)
manim -ql kinematics_coordinate_systems.py RectangularCoordinatesDerivation

# Medium quality (default - good balance)
manim -qm kinematics_coordinate_systems.py RectangularCoordinatesDerivation

# High quality (slow, for final output)
manim -qh kinematics_coordinate_systems.py RectangularCoordinatesDerivation

# Without preview window
manim -q kinematics_coordinate_systems.py RectangularCoordinatesDerivation
```

### Save to Specific Location

```bash
# Save videos to a custom directory
manim -o output_videos.mp4 kinematics_coordinate_systems.py RectangularCoordinatesDerivation
```

---

## Scene Descriptions

### Scene 1: Rectangular Coordinates Derivation

**Duration:** ~2-3 minutes

**What's Covered:**
- Position vector in 3D space: **r⃗(t) = x(t)î + y(t)ĵ + z(t)k̂**
- Velocity as first derivative: **V⃗(t) = ẋî + ẏĵ + żk̂**
- Acceleration as second derivative: **a⃗(t) = ẍî + ÿĵ + z̈k̂**

**Key Insights:**
- Unit vectors (î, ĵ, k̂) are constant in rectangular coordinates
- Simple component-wise differentiation
- Direct application of calculus to position components

**Visual Features:**
- 3D coordinate axes with moving particle
- Animated vector transformations
- Highlighted equation derivation steps
- Color-coded components

---

### Scene 2: Cylindrical/Polar Coordinates Derivation

**Duration:** ~3-4 minutes

**What's Covered:**
- Coordinate definition: r (radial), θ (angular)
- Position vector: **r⃗(t) = r(t)ûᵣ**
- Unit vector derivatives: **dûᵣ/dt = θ̇ûθ**, **dûθ/dt = -θ̇ûᵣ**
- Velocity: **V⃗ = ṙûᵣ + rθ̇ûθ**
- Acceleration: **a⃗ = (r̈ - rθ̇²)ûᵣ + (rθ̈ + 2ṙθ̇)ûθ**

**Key Insights:**
- Unit vectors ROTATE as the particle moves
- Centrifugal acceleration term: **-rθ̇²**
- Coriolis-like term: **2ṙθ̇**
- Natural for problems with radial/angular components

**Visual Features:**
- 2D polar coordinate system
- Rotating unit vector visualization
- Component decomposition of acceleration
- Labeled radial and tangential components

---

### Scene 3: Normal/Tangential Coordinates Derivation

**Duration:** ~3-4 minutes

**What's Covered:**
- Coordinate system aligned with path: ût (tangent), ûₙ (normal)
- Velocity purely tangential: **V⃗ = vût = ṡût**
- Radius of curvature: **ρ** (path-dependent)
- Unit vector rotation: **dût/ds = (1/ρ)ûₙ**
- Acceleration components:
  - Tangential: **dv/dt** (speed change)
  - Normal: **v²/ρ** (curvature effect)
- Full acceleration: **a⃗ = (dv/dt)ût + (v²/ρ)ûₙ**

**Key Insights:**
- Velocity always tangent to path
- Acceleration has two distinct roles
- Centripetal acceleration depends on speed AND curvature
- Natural for analyzing motion along known paths

**Visual Features:**
- Curved path animation
- Tangent and normal vector visualization
- Derivation showing product rule and chain rule
- Component interpretation diagram

---

### Scene 4: Comparison Table

**Duration:** ~2-3 minutes

**What's Presented:**
- Side-by-side comparison of all three systems
- Position equations in each coordinate system
- Velocity expressions
- Acceleration expressions
- Best-use-case for each system

**Comparison Structure:**

| Aspect | Rectangular | Cylindrical/Polar | Normal/Tangential |
|--------|-------------|-------------------|-------------------|
| **Position** | r⃗ = xî + yĵ + zk̂ | r⃗ = rûᵣ | s(t) along path |
| **Velocity** | V⃗ = ẋî + ẏĵ + żk̂ | V⃗ = ṙûᵣ + rθ̇ûθ | V⃗ = vût |
| **Acceleration** | a⃗ = ẍî + ÿĵ + z̈k̂ | Complex radial/tangential | a⃗ = (dv/dt)ût + (v²/ρ)ûₙ |
| **Best For** | General 3D motion | Radial/angular motion | Motion along curves |

---

## Color Scheme (3Blue1Brown Style)

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Position** | #5CD0B3 (Teal) | Position vectors |
| **Velocity** | #58C4DD (Blue) | Velocity equations |
| **Acceleration** | #FC6255 (Red) | Acceleration equations |
| **Time/Angular** | #FFD700 (Gold) | Time derivatives, angles |
| **Emphasis** | #FFFF00 (Yellow) | Key results, highlights |
| **Green** | #83C167 | Secondary concepts |
| **Purple** | #9A72AC | Tertiary concepts |

---

## Customization Guide

### Changing Animation Duration

In the script, modify `run_time` parameters:
```python
# Default: 1 second
self.play(Write(title), run_time=1)

# For slower/faster animation
self.play(Write(title), run_time=2)  # Slower
self.play(Write(title), run_time=0.5)  # Faster
```

### Changing Colors

Modify the color constants at the top of the script:
```python
VELOCITY_COLOR = "#58C4DD"  # Change this hex code
ACCELERATION_COLOR = "#FC6255"  # Change this hex code
```

### Changing Font Sizes

```python
# Default font size is 36
title = Text("My Title", font_size=44)  # Larger
title = Text("My Title", font_size=20)  # Smaller
```

### Adding/Removing Equations

Simply modify the `MathTex` objects:
```python
# Remove a step by commenting it out
# eq = MathTex(r"...", font_size=36, color=COLOR)
# self.play(Write(eq), run_time=1)

# Add new equations
new_eq = MathTex(r"\vec{F} = m\vec{a}", font_size=36, color=FORCE_COLOR)
self.play(Write(new_eq), run_time=1.5)
```

---

## Output Files

After rendering, the script creates:

```
videos/
├── 1080p60/
│   ├── RectangularCoordinatesDerivation.mp4
│   ├── CylindricalCoordinatesDerivation.mp4
│   ├── NormalTangentialCoordinatesDerivation.mp4
│   └── ComparisonTable.mp4
└── partial_movie_file_list/
    └── (temporary files)
```

### Video Format
- **Resolution:** 1920×1080 (Full HD)
- **Frame Rate:** 60 FPS
- **Format:** MP4 (H.264)
- **File Size:** ~50-100 MB per scene

---

## Troubleshooting

### "LaTeX not found"
Install LaTeX:
- **Ubuntu:** `sudo apt-get install texlive texlive-fonts-recommended`
- **macOS:** `brew install texlive`
- **Windows:** Download from [MikTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/)

### "FFmpeg not found"
Install FFmpeg:
- **Ubuntu:** `sudo apt-get install ffmpeg`
- **macOS:** `brew install ffmpeg`
- **Windows:** Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### "ImportError: No module named 'manim'"
Reinstall Manim:
```bash
pip uninstall manim -y
pip install manim --upgrade
```

### Slow Rendering
- Use low quality for testing: `manim -ql`
- Reduce `run_time` values in the script
- Close other applications

### Memory Issues
Reduce quality level or split into smaller scenes

---

## Pedagogical Notes

This animation follows best practices from 3Blue1Brown's educational philosophy:

### Why This Approach Works

1. **Concrete → Abstract**
   - Start with visual coordinate systems
   - Then introduce mathematical notation
   - End with formal equations

2. **Step-by-Step Derivations**
   - Each step is a transformation from the previous
   - Uses color to highlight new information
   - Pauses allow processing time

3. **Multiple Representations**
   - Shows geometric interpretation
   - Displays algebraic equations
   - Connects physics meaning to math

4. **Spaced Repetition**
   - Returns to key equations multiple times
   - Different contexts reinforce understanding
   - Comparison table ties all together

### For Instructors

- **Use individual scenes** as discussion starters
- **Pause at key steps** to derive equations yourself
- **Comparison table** works as a reference guide
- **Encourage students** to modify and create variations

---

## Further Reading

### Kinematics Resources
- **Engineering Mechanics: Dynamics** by J.L. Meriam & L.G. Kraige
- **Classical Mechanics** by H. Goldstein
- **Mechanics** by L. Landau & E. Lifshitz (advanced)

### Animation Resources
- **3Blue1Brown FAQ:** https://www.3blue1brown.com/faq
- **Manim Community Docs:** https://docs.manim.community
- **Manim Examples:** https://github.com/ManimCommunity/manim/tree/main/examples

### Related Videos
- 3Blue1Brown's "Essence of Calculus" series
- 3Blue1Brown's "Essence of Linear Algebra" series
- Kinematics and Dynamics courses on MIT OpenCourseWare

---

## License & Attribution

This script is designed to accompany undergraduate engineering mechanics courses, particularly those covering kinematics of particles.

**Style Guide:** Based on 3Blue1Brown's pedagogical approach as documented in "The 3Blue1Brown Animation Style Guide for Engineering Physics"

**Physics Content:** Chapter 12 - "Kinematics of a Particle" from Engineering Mechanics textbooks

---

## Tips for Best Results

1. **First Run:** Use `manim -ql` for quick testing
2. **Preview:** Use `-p` flag to automatically open video after rendering
3. **High Quality:** Use `manim -qh` for final presentation videos
4. **Customization:** Modify colors and timings for your course style
5. **Combine Scenes:** Use video editing software to create custom sequences

---

## Support & Feedback

For issues or improvements:
1. Check the Manim documentation: https://docs.manim.community
2. Review 3Blue1Brown's video explanations of kinematics concepts
3. Experiment with the script parameters in a test environment

---

**Last Updated:** January 2026  
**Manim Version:** Community Edition 0.18+  
**Python Version:** 3.8+
