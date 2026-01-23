# Physics Timeline Images - Download Instructions

## Quick Start

You now have several tools to help download images for your Physics Timeline:

### Option 1: Interactive Download Helper (Easiest)
1. Open `download-timeline-images.html` in your web browser
2. Click "HIGH PRIORITY" to see the most important figures first
3. Click "View on Commons" to open each image's Wikimedia Commons page
4. Save the largest version of the image with the suggested filename
5. Save to: `C:\Users\Cole\Dropbox\Website\images\`

### Option 2: Manual Download from Guide
1. Open `TIMELINE_IMAGES_GUIDE.md` in your editor
2. Visit each Wikimedia Commons link
3. Download the largest available image
4. Rename to match the suggested filename
5. Save to: `C:\Users\Cole\Dropbox\Website\images\`

### Option 3: Batch Download Script
Run the included batch file (if you prefer command-line):
```bash
download_images.bat
```
This will attempt automated downloads with proper delays and retry logic.

---

## Complete Image List

### Current Status
- **Already have:** 3 images
- **High priority:** 10 images (most famous figures)
- **Medium priority:** 5+ images
- **Total missing:** 57+ images

### High Priority Images to Download First

These are the most well-documented and important figures:

| Filename | Person | Time Period | Why Important |
|----------|--------|-------------|---------------|
| `leonardo-thumb.jpg` | Leonardo da Vinci | 1452-1519 | Renaissance polymath |
| `galileo-thumb.jpg` | Galileo Galilei | 1564-1642 | Experimental method founder |
| `newton-thumb.jpg` | Isaac Newton | 1643-1727 | Classical mechanics founder |
| `kepler-thumb.jpg` | Johannes Kepler | 1571-1630 | Planetary motion laws |
| `einstein.jpg` | Albert Einstein | 1879-1955 | Relativity & modern physics |
| `feynman.jpg` | Richard Feynman | 1918-1988 | Quantum mechanics & physics education |
| `plato-thumb.jpg` | Plato | 428-348 BC | Ancient Greek philosophy |
| `aristotle-thumb.jpg` | Aristotle | 384-322 BC | Ancient Greek science |
| `pythagoras-thumb.jpg` | Pythagoras | 570-495 BC | Mathematics & geometry |
| `euclid-thumb.jpg` | Euclid | 325-270 BC | Geometry founder |

### Medium Priority Images

Additional important figures (secondary priority):

| Filename | Person | Commons Link |
|----------|--------|--------------|
| `maxwell-thumb.jpg` | James Clerk Maxwell | https://commons.wikimedia.org/wiki/James_Clerk_Maxwell |
| `faraday-thumb.jpg` | Michael Faraday | https://commons.wikimedia.org/wiki/Michael_Faraday |
| `bohr.jpg` | Niels Bohr | https://commons.wikimedia.org/wiki/Niels_Bohr |
| `born.jpg` | Max Born | https://commons.wikimedia.org/wiki/Max_Born |
| `archimedes-thumb.jpg` | Archimedes | https://commons.wikimedia.org/wiki/Archimedes |
| `dirac.jpg` | Paul Dirac | https://commons.wikimedia.org/wiki/Paul_Dirac |
| `pauli.jpg` | Wolfgang Pauli | https://commons.wikimedia.org/wiki/Wolfgang_Pauli |
| `rutherford.jpg` | Ernest Rutherford | https://commons.wikimedia.org/wiki/Ernest_Rutherford |
| `tesla.jpg` | Nikola Tesla | https://commons.wikimedia.org/wiki/Nikola_Tesla |
| `thomson.jpg` | J.J. Thomson | https://commons.wikimedia.org/wiki/J.J._Thomson |

---

## Step-by-Step Manual Download

### For Each Image:

1. **Open the Wikimedia Commons page**
   - Click the Commons link for your desired scientist
   - Example: https://commons.wikimedia.org/wiki/Albert_Einstein

2. **Find the best image**
   - Look for professional portraits (busts or paintings)
   - Prefer high-resolution versions
   - Most ancient figures have multiple classical representations

3. **Get the full-size image URL**
   - Click on the thumbnail to open the file description page
   - Look for "Original file" or the largest thumbnail option
   - Right-click → "Copy image link"

4. **Download and rename**
   - Right-click image → "Save image as..."
   - Rename using the suggested filename (e.g., `einstein-thumb.jpg`)
   - Save to: `C:\Users\Cole\Dropbox\Website\images\timeline_images\`

5. **Verify**
   - Check that the file appears in the directory
   - Image should be at least 200x200 pixels (preferably larger)

---

## Directory Structure

Your timeline images should be organized as:

```
C:\Users\Cole\Dropbox\Website\
└── images\
    ├── timeline_images\
    │   ├── Rhind_Mathematical_Papyrus.jpg    (existing)
    │   └── Thales_of_Miletus.jpg             (existing)
    ├── leonardo-thumb.jpg                    (download here)
    ├── galileo-thumb.jpg                     (download here)
    ├── newton-thumb.jpg                      (download here)
    ├── einstein.jpg                          (download here)
    ├── feynman.jpg                           (download here)
    ├── pythagoras-thumb.jpg                  (download here)
    ├── plato-thumb.jpg                       (download here)
    ├── aristotle-thumb.jpg                   (download here)
    └── ... (more images)
```

**Important:** Most timeline images go directly in the `images/` folder, NOT in `timeline_images/`

---

## Tips for Finding Images

### For Ancient Figures (Thales, Plato, Aristotle, etc.)
- Most images are classical sculptures and busts
- Look for "bust" or "sculpture" in Wikimedia Commons
- These are public domain (ancient originals photographed)
- Example: Plato appears in Raphael's "School of Athens"

### For Renaissance/Early Modern (Leonardo, Galileo, Newton)
- Professional portraits from contemporary artists
- High-quality oil paintings available
- Look for the most formal/official portrait
- Examples: Godfrey Kneller's Newton portrait, Sustermans' Galileo

### For Modern Figures (Einstein, Feynman, Maxwell)
- Photographs are preferred over paintings
- Many well-documented portraits available
- Higher resolution often possible
- Examples: Einstein's iconic wild-hair photo, Feynman at Caltech

### For Difficult-to-Find Figures
- Use Wikimedia Commons search: https://commons.wikimedia.org/wiki/Special:Search
- Try variations of the name (with/without accents, etc.)
- Check related categories (e.g., "18th-century physicists")
- If no image found, it's okay to skip - the timeline will display without it

---

## What to Do After Downloading

1. **Save images to the correct directory**
   - `C:\Users\Cole\Dropbox\Website\images\`
   - (Note: Most images go here, NOT in the `timeline_images/` subfolder)

2. **Use the correct filenames**
   - Must match exactly as listed in the guide
   - Example: `einstein.jpg` (not `einstein-thumb.jpg` or `Einstein.jpg`)
   - Filenames are case-sensitive on GitHub Pages

3. **Verify timeline.html displays images**
   - Open `timeline.html` in a browser
   - Images should appear alongside each scientist's entry
   - If an image doesn't appear, check the filename spelling (case-sensitive)

4. **Commit and push**
   - Once you've downloaded a batch, commit to git:
     ```bash
     git add images/
     git commit -m "Add physics timeline portrait images"
     git push
     ```
   - Check your GitHub Pages deployment to verify images display correctly

---

## Common Issues

### Image Not Appearing on Timeline
- **Cause:** Filename mismatch
- **Fix:** Check that filename exactly matches the timeline's reference

### Can't Find Image on Wikimedia Commons
- **Solution:** Use search at https://commons.wikimedia.org/wiki/Special:Search
- **Fallback:** The timeline works fine without some images (they just won't display)

### Rate Limiting Errors
- **Cause:** Too many rapid downloads from Wikimedia
- **Solution:** Wait a few minutes between downloads, or use the batch file which includes delays

### Image Quality Too Low
- **Solution:** Look for "original file" or highest resolution option on Commons
- **Tip:** Many portraits exist in multiple resolutions - always grab the largest

---

## Full Image List (All Needed)

See `TIMELINE_IMAGES_GUIDE.md` for the complete list of 57+ images with detailed descriptions and Wikimedia Commons links for every figure on the timeline.

---

## Questions?

- **File locations:** All scripts assume the website folder structure
- **Naming convention:** Use exactly the names listed (case-sensitive on Linux/GitHub)
- **Image formats:** JPG and PNG are both fine
- **Resolution:** Higher is better, but 200+ pixels minimum recommended

Good luck! The Physics Timeline will be much richer with these portraits.
