# Quick Start Guide - Kinematics Animations

## TL;DR - Get Started in 60 Seconds

### 1. Install Manim (one-time)
```bash
pip install manim
```

### 2. Render a Scene
```bash
# From the directory containing kinematics_coordinate_systems.py
manim -pql kinematics_coordinate_systems.py RectangularCoordinatesDerivation
```

The `-pql` flags mean:
- `-p` = Preview (automatically open video when done)
- `-q` = Quality
- `-l` = Low (fast rendering, good for testing)

---

## Common Rendering Commands

### Render Individual Scenes
```bash
# Scene 1: Rectangular Coordinates
manim -pql kinematics_coordinate_systems.py RectangularCoordinatesDerivation

# Scene 2: Cylindrical/Polar Coordinates  
manim -pql kinematics_coordinate_systems.py CylindricalCoordinatesDerivation

# Scene 3: Normal/Tangential Coordinates
manim -pql kinematics_coordinate_systems.py NormalTangentialCoordinatesDerivation

# Scene 4: Comparison Table
manim -pql kinematics_coordinate_systems.py ComparisonTable
```

### Render All Scenes
```bash
manim -pql kinematics_coordinate_systems.py
```

### Higher Quality (Slower)
```bash
manim -pqm kinematics_coordinate_systems.py RectangularCoordinatesDerivation
```
(`m` = medium quality, higher than `l`)

### Highest Quality (Very Slow)
```bash
manim -pqh kinematics_coordinate_systems.py RectangularCoordinatesDerivation
```
(`h` = high quality for final presentations)

---

## Quality vs. Speed

| Flag | Speed | Quality | Use Case |
|------|-------|---------|----------|
| `-ql` | ~30 sec | 480p | Testing, development |
| `-qm` | ~2-3 min | 720p | Balanced |
| `-qh` | ~10-15 min | 1080p | Final output |

---

## Where's the Output?

After rendering, find your videos here:
```
videos/
└── 1080p60/
    ├── RectangularCoordinatesDerivation.mp4
    ├── CylindricalCoordinatesDerivation.mp4
    ├── NormalTangentialCoordinatesDerivation.mp4
    └── ComparisonTable.mp4
```

---

## Troubleshooting

### "Manim command not found"
```bash
# Try this instead
python -m manim -pql kinematics_coordinate_systems.py RectangularCoordinatesDerivation
```

### "LaTeX not found"
```bash
# Ubuntu
sudo apt-get install texlive texlive-fonts-recommended

# macOS
brew install texlive

# Windows - Install MikTeX from https://miktex.org/
```

### "FFmpeg not found"
```bash
# Ubuntu
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows - Download from https://ffmpeg.org/download.html
```

### Rendering is VERY slow
- Switch to lower quality: use `-ql` instead of `-qm` or `-qh`
- Close other applications
- Check disk space (needs ~500MB free)

---

## Next Steps

1. **Render all scenes** with low quality to see what you get
2. **Pick your favorite scene** and render it with high quality
3. **Customize colors** by editing hex codes in the script (see README.md)
4. **Adjust timings** by changing `run_time` values (see README.md)
5. **Use in presentation** or educational materials

---

## Quick Customization

### Change a Title
```python
# Line ~60, change:
title = Text("Rectangular Coordinates: Derivation", font_size=44, color=WHITE)

# To:
title = Text("YOUR CUSTOM TITLE HERE", font_size=44, color=WHITE)
```

### Change an Animation Speed
```python
# Find this:
self.play(Write(title), run_time=1)

# Change the number (higher = slower):
self.play(Write(title), run_time=2)  # Takes 2 seconds instead of 1
```

---

## Pro Tips

### Tip 1: Render Overnight
For high-quality videos, render overnight:
```bash
# Render all scenes in high quality
manim -qh kinematics_coordinate_systems.py &
```

### Tip 2: Edit Specific Scene
Only edit the class you want (e.g., `RectangularCoordinatesDerivation`) and render just that one

### Tip 3: Combine with Other Tools
- Use **FFmpeg** to concatenate videos
- Use **DaVinci Resolve** or **Kdenlive** (free) for adding narration
- Use **Shotcut** (free) for simple editing

### Tip 4: Create Variants
Save the script as different files:
```bash
cp kinematics_coordinate_systems.py my_custom_version.py
# Edit my_custom_version.py as desired
manim -pql my_custom_version.py CustomSceneName
```

---

## What Each Scene Shows

### RectangularCoordinatesDerivation
- How to write position in x, y, z coordinates
- Velocity by taking the derivative
- Acceleration by taking the second derivative
- Simple, fundamental approach

### CylindricalCoordinatesDerivation
- Polar/cylindrical coordinates: r, θ, z
- Why unit vectors rotate (hard part!)
- Components of velocity
- Components of acceleration (radial + tangential)

### NormalTangentialCoordinatesDerivation
- Coordinates that follow a curved path
- Why velocity is only tangential
- What the radius of curvature means
- How acceleration splits into speed-change and direction-change

### ComparisonTable
- All three systems side by side
- Easy reference for which to use when
- Complete equations for each
- Real-world applications

---

## Recording Narration

After you have the video, add your voice:

### Using Kdenlive (Free)
1. File → Open Project → Select your .mp4 file
2. Track → Add Audio Track
3. Project → Add Audio File (your recorded narration)
4. Adjust timing to match video
5. Export as MP4

### Using FFmpeg (Command Line)
```bash
ffmpeg -i video.mp4 -i narration.mp3 -c:v copy -c:a aac output.mp4
```

---

## Questions?

Check the full **README.md** for:
- Complete installation instructions
- All customization options
- Detailed pedagogy notes
- Advanced usage
- Further reading resources

---

**Happy Animating!** 🎬
