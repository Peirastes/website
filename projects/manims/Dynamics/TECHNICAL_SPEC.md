# Technical Specification: Curvilinear Kinematics Animation

## System Requirements

### Minimum Requirements
- **CPU:** Dual-core processor (2 GHz+)
- **RAM:** 4 GB
- **Storage:** 1 GB free (for rendering)
- **OS:** Linux, macOS, or Windows

### Recommended Requirements
- **CPU:** Quad-core processor (3 GHz+)
- **RAM:** 8+ GB
- **Storage:** 5 GB free
- **GPU:** Optional (speeds up rendering with certain configurations)

### Software Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Python | 3.8+ | Script runtime |
| Manim | 0.18+ | Animation framework |
| NumPy | 1.19+ | Numerical operations |
| Pillow | 6.0+ | Image processing |
| FFmpeg | 4.0+ | Video encoding |
| LaTeX | Any modern | Equation rendering |

---

## Installation & Configuration

### Python Environment Setup

#### Using Virtual Environment (Recommended)
```bash
# Create virtual environment
python3 -m venv manim_env

# Activate it
source manim_env/bin/activate  # Linux/macOS
# or
manim_env\Scripts\activate  # Windows

# Upgrade pip
pip install --upgrade pip

# Install Manim
pip install manim
```

#### Direct Installation
```bash
pip install manim
```

### System Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y \
    python3.9 \
    python3-pip \
    ffmpeg \
    texlive \
    texlive-fonts-recommended \
    texlive-latex-extra \
    cm-super \
    dvipng
```

#### macOS with Homebrew
```bash
brew install python3 ffmpeg texlive
pip install manim
```

#### Windows
1. Install Python 3.8+ from https://www.python.org
2. Install FFmpeg from https://ffmpeg.org/download.html
3. Install LaTeX from https://miktex.org or https://www.tug.org/texlive
4. Open Command Prompt as Administrator:
   ```cmd
   pip install manim
   ```

### Verify Installation
```bash
# Check Manim
manim --version

# Check LaTeX
latex --version

# Check FFmpeg
ffmpeg -version
```

---

## Script Architecture

### Module Structure
```python
# Color Constants (Lines 17-26)
VELOCITY_COLOR = "#58C4DD"
ACCELERATION_COLOR = "#FC6255"
# ... etc

# Scene Classes (Lines 29+)
class RectangularCoordinatesDerivation(Scene)
class CylindricalCoordinatesDerivation(Scene)
class NormalTangentialCoordinatesDerivation(Scene)
class ComparisonTable(Scene)
```

### Class Hierarchy
```
manim.Scene
├── RectangularCoordinatesDerivation
├── CylindricalCoordinatesDerivation
├── NormalTangentialCoordinatesDerivation
└── ComparisonTable
```

### Method Patterns

#### Standard Scene Structure
```python
class MyScene(Scene):
    def construct(self):
        # 1. Title
        title = Text("...", font_size=44)
        self.play(Write(title), run_time=1)
        self.wait(0.5)
        
        # 2. Content
        # Add equations, animations, visuals
        
        # 3. Cleanup
        self.play(Fade(...))
        self.wait(0.5)
```

#### Equation Animation Pattern
```python
eq1 = MathTex(r"equation_1", font_size=36, color=COLOR)
self.play(Write(eq1), run_time=1.5)
self.wait(0.8)

eq2 = MathTex(r"equation_2", font_size=36, color=COLOR)
self.play(TransformMatchingTex(eq1, eq2), run_time=1)
self.wait(0.8)
```

---

## Rendering Pipeline

### Rendering Process

```
Python Script
    ↓
Manim Parser (interprets Scene.construct())
    ↓
LaTeX Engine (renders equations)
    ↓
Renderer (creates frames)
    ↓
FFmpeg (encodes video)
    ↓
Output MP4
```

### Quality Settings

#### Resolution & Frame Rate
```bash
# Low Quality (480p, 30 FPS)
manim -ql scene_name

# Medium Quality (720p, 30 FPS)
manim -qm scene_name

# High Quality (1080p, 60 FPS)
manim -qh scene_name
```

#### Custom Resolution
Edit `config.pixel_height` and `config.pixel_width` in script:
```python
config.pixel_height = 1080
config.pixel_width = 1920
```

#### Frame Rate Control
```python
# In script (default 60)
from manim import config
config.frame_rate = 60  # fps
```

### Output Directory Structure
```
videos/
├── 1080p60/
│   ├── RectangularCoordinatesDerivation.mp4
│   ├── CylindricalCoordinatesDerivation.mp4
│   ├── NormalTangentialCoordinatesDerivation.mp4
│   └── ComparisonTable.mp4
├── 1080p30/  (if medium quality)
└── 480p30/   (if low quality)

media/
└── Tex/  (intermediate LaTeX files)
```

---

## Code API Reference

### Core Classes

#### Scene Base Class (Inherited)
```python
class MyScene(Scene):
    def construct(self):
        """Main animation construction method (required)"""
        pass
    
    def play(*animations, **kwargs):
        """Execute animations"""
        # run_time: float - animation duration
        # rate_func: callable - easing function
        
    def wait(duration=1):
        """Pause for specified duration"""
        pass
    
    def add(*mobjects):
        """Add objects to scene without animation"""
        pass
    
    def remove(*mobjects):
        """Remove objects from scene"""
        pass
```

### Animation Classes Used

| Class | Purpose | Syntax |
|-------|---------|--------|
| `Write` | Animate equation writing | `Write(equation)` |
| `Create` | Draw object | `Create(shape)` |
| `Transform` | Morph one object to another | `Transform(obj1, obj2)` |
| `TransformMatchingTex` | Match LaTeX and transform | `TransformMatchingTex(eq1, eq2)` |
| `Fade` | Fade out | `Fade(object)` |
| `FadeIn` | Fade in | `FadeIn(object)` |
| `animate` | Chainable animation | `obj.animate.shift(UP)` |

### Mobject (Mathematical Object) Classes

| Class | Purpose | Example |
|-------|---------|---------|
| `MathTex` | LaTeX equations | `MathTex(r"\vec{V} = \dot{x}\hat{i}")` |
| `Text` | Plain text | `Text("Position Vector")` |
| `Arrow` | Vectors/arrows | `Arrow(START, END)` |
| `Dot` | Point | `Dot(position, color=BLUE)` |
| `Line` | Line segment | `Line(start, end)` |
| `Arc` | Arc | `Arc(radius=1, angle=PI/4)` |
| `Axes` | 2D coordinate system | `Axes(x_range=[-2,2], y_range=[-2,2])` |
| `ThreeDAxes` | 3D coordinate system | `ThreeDAxes()` |
| `ParametricFunction` | Curve | `ParametricFunction(func, t_range=[0,1])` |
| `VGroup` | Group of objects | `VGroup(obj1, obj2, obj3)` |
| `SurroundingRectangle` | Box around object | `SurroundingRectangle(obj, color=YELLOW)` |

### Vector Functions

```python
# Positioning
obj.move_to(ORIGIN)           # Absolute position
obj.shift(UP * 2)             # Relative position
obj.next_to(other, UP)        # Position relative to another object
obj.to_edge(UP)               # Position at edge of screen
obj.to_corner(UL)             # Position at corner (UL, UR, DL, DR)

# Scaling
obj.scale(2)                  # 2x larger
obj.scale_to_fit_width(2)     # Fit to width

# Colors
obj.set_color(BLUE)           # Change color
obj.set_color_by_gradient(BLUE, RED)  # Gradient

# Opacity
obj.set_opacity(0.5)          # 50% transparent

# Line properties
obj.set_stroke(color=BLUE, width=4)   # Line style
```

### Scene Positioning Constants
```python
ORIGIN = np.array([0, 0, 0])
UP = np.array([0, 1, 0])
DOWN = np.array([0, -1, 0])
LEFT = np.array([-1, 0, 0])
RIGHT = np.array([1, 0, 0])

# Corners (for 2D)
UL = np.array([-1, 1, 0])     # Up-Left
UR = np.array([1, 1, 0])      # Up-Right
DL = np.array([-1, -1, 0])    # Down-Left
DR = np.array([1, -1, 0])     # Down-Right
```

### Rate Functions (Easing)
```python
# Linear interpolation (default)
rate_func=linear

# Smooth easing
rate_func=smooth             # Slow start, smooth end
rate_func=ease_in_quad       # Accelerating from zero
rate_func=ease_out_quad      # Decelerating to zero
rate_func=ease_in_out_quad   # Both

# Special
rate_func=squish_rate_func(func, ...)  # Custom easing
```

Example:
```python
self.play(
    equation.animate.shift(RIGHT),
    run_time=2,
    rate_func=smooth
)
```

---

## LaTeX Rendering

### MathTex vs Tex

```python
# MathTex: Optimized for equations
eq = MathTex(r"\vec{F} = m\vec{a}")

# Tex: More flexible, full LaTeX
eq = Tex(r"\textbf{Bold} and \textit{italic}")
```

### LaTeX Command Examples

| Symbol | LaTeX | Renders As |
|--------|-------|------------|
| Greek | `\alpha, \beta, \theta` | α, β, θ |
| Vector | `\vec{x}` | **x⃗** |
| Dot (derivative) | `\dot{x}, \ddot{x}` | ẋ, ẍ |
| Subscript | `x_{i}, v_{r}` | xᵢ, vᵣ |
| Superscript | `v^2, x^{(n)}` | v², x⁽ⁿ⁾ |
| Fraction | `\frac{a}{b}` | a/b |
| Integral | `\int_0^t` | ∫₀ᵗ |
| Hat | `\hat{u}, \hat{i}` | û, î |

### Common Equation Patterns Used

```python
# Vectors
r"\vec{r}(t) = x(t)\hat{i} + y(t)\hat{j}"

# Derivatives
r"\vec{V} = \frac{d\vec{r}}{dt}"

# Time derivatives (dot notation)
r"V = \dot{s}, a = \ddot{s}"

# Magnitude with bars
r"|\vec{V}| = v"

# Parentheses
r"\left(\ddot{r} - r\dot{\theta}^2\right)"

# Complex expressions
r"\vec{a} = \frac{dv}{dt}\hat{u}_t + \frac{v^2}{\rho}\hat{u}_n"
```

---

## Performance Optimization

### Rendering Speed

**Factors Affecting Speed:**

1. **Quality Level** (biggest impact)
   - `-ql`: 30 sec per scene
   - `-qm`: 3-5 min per scene
   - `-qh`: 10-20 min per scene

2. **System Performance**
   - More RAM = faster
   - Faster CPU = faster
   - SSD vs HDD = faster

3. **Scene Complexity**
   - More objects = slower
   - More animations = slower
   - Complex math = slower

### Optimization Strategies

#### Strategy 1: Reduce Quality for Development
```bash
# Fast iteration
manim -ql kinematics_coordinate_systems.py

# Final production
manim -qh kinematics_coordinate_systems.py
```

#### Strategy 2: Render Individual Scenes
```bash
# Only render what you need
manim -pql kinematics_coordinate_systems.py RectangularCoordinatesDerivation
```

#### Strategy 3: Cache Intermediate LaTeX
Manim automatically caches LaTeX compilations. First run is slowest.

#### Strategy 4: Monitor Resources
```bash
# Linux/macOS: Monitor during rendering
watch -n 1 'ps aux | grep manim'

# Or use system monitor (htop, Activity Monitor, Task Manager)
```

### Memory Usage Estimation

| Quality | RAM Used | Cache Size |
|---------|----------|-----------|
| `-ql` | 500 MB - 1 GB | 100 MB |
| `-qm` | 1 GB - 2 GB | 200 MB |
| `-qh` | 2 GB - 4 GB | 400 MB |

---

## Customization Guide for Developers

### Adding a New Scene

```python
class MyNewScene(Scene):
    def construct(self):
        # Step 1: Title
        title = Text("My Scene Title", font_size=44, color=WHITE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)
        self.wait(0.5)
        
        # Step 2: Animate content
        equation = MathTex(r"\vec{F} = m\vec{a}", font_size=36, color=EMPHASIS_COLOR)
        self.play(Write(equation), run_time=1.5)
        self.wait(1.0)
        
        # Step 3: Highlight and transform
        self.play(equation.animate.shift(UP * 2), run_time=1)
        self.wait(0.5)
        
        # Step 4: Fade out
        self.play(Fade(equation), Fade(title), run_time=1)
        self.wait(0.5)
```

### Modifying Colors

**Global Color Change (All Scenes):**
```python
# Edit at top of script (lines 16-26)
VELOCITY_COLOR = "#YOUR_NEW_HEX"
```

**Local Color Change (Single Object):**
```python
equation = MathTex(r"equation", color="#CUSTOM_HEX")
obj.set_color("#CUSTOM_HEX")
```

**Gradient Colors:**
```python
obj.set_color_by_gradient(BLUE, RED)
```

### Modifying Timing

**Change Run Time:**
```python
# Slower (2 seconds instead of 1)
self.play(Write(obj), run_time=2)

# Faster (0.5 seconds)
self.play(Write(obj), run_time=0.5)
```

**Change Wait Time:**
```python
# Longer pause
self.wait(2.0)

# Shorter pause
self.wait(0.3)
```

### Adding New Elements

**Add Vectors:**
```python
vec = Arrow(
    start=np.array([0, 0, 0]),
    end=np.array([2, 1, 0]),
    color=VELOCITY_COLOR,
    stroke_width=4,
    buff=0
)
self.play(Create(vec), run_time=1.5)
```

**Add Grid Background:**
```python
plane = NumberPlane(
    x_range=[-10, 10, 1],
    y_range=[-10, 10, 1],
    background_line_style={
        "stroke_color": GRAY,
        "stroke_width": 1,
    }
)
self.add(plane)
```

**Add Animated Text Updates:**
```python
time_text = Text("t = 0", font_size=24)
self.add(time_text)

for t in range(10):
    new_text = Text(f"t = {t}", font_size=24)
    self.play(
        Transform(time_text, new_text),
        run_time=0.5,
        rate_func=linear
    )
```

---

## Debugging & Troubleshooting

### Common Errors and Fixes

#### Error: "ModuleNotFoundError: No module named 'manim'"
```bash
# Solution 1: Install Manim
pip install manim

# Solution 2: Use python -m
python -m manim -pql script.py SceneName

# Solution 3: Check virtual environment
source venv/bin/activate  # Linux/macOS
```

#### Error: "LaTeX file not found"
```bash
# Solution: Install LaTeX
# Ubuntu
sudo apt-get install texlive texlive-latex-extra

# macOS
brew install texlive

# Windows
# Download from https://miktex.org
```

#### Error: "ffmpeg not found or broken"
```bash
# Solution: Install FFmpeg
# Ubuntu
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

#### Error: Scene renders but video is black
```python
# Check background color
config.background_color = "#1C1C1C"  # Add this

# Check object colors contrast with background
obj.set_color(WHITE)  # Use contrasting color

# Check z-depth
obj.move_to(ORIGIN)  # Center on screen
```

### Debug Print Statements

```python
# Print during rendering
import sys

class MyScene(Scene):
    def construct(self):
        print("Starting construction", file=sys.stderr)
        
        equation = MathTex(r"...", font_size=36)
        print(f"Equation created: {equation}", file=sys.stderr)
        
        self.play(Write(equation), run_time=1)
        print("Animation complete", file=sys.stderr)
```

Run with output captured:
```bash
manim -pql script.py SceneName 2>&1 | tee debug.log
```

---

## Testing & Validation

### Unit Testing Mindset
While Manim scenes are primarily visual, you can test:

```python
class TestSceneCreation:
    def test_rectangular_coordinates(self):
        scene = RectangularCoordinatesDerivation()
        assert scene is not None
        # Call construct() would render
```

### Visual Validation Checklist
- [ ] All text readable (font size adequate)
- [ ] Colors distinct and intentional
- [ ] No objects cut off at edges
- [ ] Timing allows understanding
- [ ] Equations display correctly
- [ ] Smooth transitions between scenes
- [ ] Final video plays without artifacts

### Performance Validation
```bash
# Time the rendering
time manim -ql kinematics_coordinate_systems.py RectangularCoordinatesDerivation

# Monitor resources
top -p $(pgrep -f manim)  # Linux
```

---

## Deployment Recommendations

### For Online Course Platforms

```
Recommended Format:
- Resolution: 1920×1080 (16:9)
- Frame Rate: 60 FPS
- Codec: H.264
- Bitrate: 5-10 Mbps (for good quality)
- File Size: ~500-1000 MB per 10 minutes
```

### For Playback Optimization

```bash
# Transcode for better compatibility
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k output.mp4
```

### For Archival

```bash
# High quality version for archival
manim -qh kinematics_coordinate_systems.py

# Store in lossless format
ffmpeg -i video.mp4 -c:v libx264 -crf 18 archive.mp4
```

---

## Version History & Maintenance

### Current Version: 1.0
- 4 complete scenes
- Full documentation
- 3B1B style implementation
- Production-ready

### Potential Updates
- Spherical coordinates scene
- Interactive variants
- Narration support
- Multi-language support
- Additional applications

---

## References & Standards

### Followed Standards
- **Python:** PEP 8 Style Guide
- **Manim:** Official API documentation (0.18+)
- **Physics:** Standard engineering mechanics notation
- **Animation:** 3Blue1Brown pedagogical principles

### Reference Materials
- Manim Documentation: https://docs.manim.community
- Manim Source: https://github.com/ManimCommunity/manim
- Engineering Mechanics texts (standard notation)

---

## Support & Contact

For technical issues:
1. Check Manim documentation
2. Review troubleshooting section above
3. Check GitHub issues
4. Post on Manim Discord/forums

---

**Technical Specification v1.0**  
**Last Updated:** January 2026  
**Maintained by:** Animation Development Team
