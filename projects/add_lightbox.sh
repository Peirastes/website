#!/bin/bash

# List of files to check and fix
files=(
    "certainty-inference-comprehension.html"
    "disk-cam.html"
    "dynamical-systems-lab.html"
    "envirosensing-microcontroller.html"
    "frame-center.html"
    "grav-det.html"
    "grav-rad.html"
    "inferential-dynamics.html"
    "on-analogies-of-dynamical-systems.html"
    "physical-analogies.html"
    "physical-analogies-continued.html"
    "pop-modeling.html"
    "rebound-pendulum.html"
    "two-body-problem.html"
    "univ-of-proportions.html"
)

for file in "${files[@]}"; do
    # Check if file exists and doesn't have the lightbox overlay div
    if [ -f "$file" ] && ! grep -q '<div id="lightbox-overlay"' "$file"; then
        echo "Adding lightbox overlay to $file"
        # Add the lightbox overlay div before </body>
        sed -i '/<\/body>/i\    <div id="lightbox-overlay">\n        <span id="lightbox-close">&times;</span>\n        <img id="lightbox-img" src="" alt="Full Image">\n    </div>' "$file"
    fi
done
