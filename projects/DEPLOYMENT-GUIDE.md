# Electrostatics Lab - Deployment & Testing Guide

## Current Setup

The Electrostatics Lab is now configured for production deployment on your website, following the same structure as other projects (dynamical-systems-lab, eisenhower-task-manager, etc.).

### File Structure

```
projects/
├── electrostatics-lab.html                    [Landing page wrapper]
└── electrostatics-lab-v3/
    └── electrostatics-lab/
        ├── src/                               [Source code]
        ├── dist/                              [Production build]
        │   ├── index.html                     [Built app entry point]
        │   ├── assets/                        [CSS, JS bundles]
        │   └── [optimized assets]
        ├── package.json                       [Dependencies]
        ├── vite.config.ts                     [Build configuration]
        ├── tsconfig.json                      [TypeScript config]
        ├── README.md                          [Project documentation]
        ├── VALIDATION.md                      [Physics validation report]
        ├── TESTING.md                         [Comprehensive testing checklist]
        ├── electrostatics-POD.md              [Project roadmap document]
        └── [other project files]
```

---

## Local Testing (Before Deployment)

### Option 1: Python HTTP Server (Recommended)

**From the projects directory:**

```bash
cd ~/Dropbox/Website/projects
python3 -m http.server 8000
```

**Then open in browser:**
```
http://localhost:8000/electrostatics-lab.html
```

**On Windows Git Bash:**
```bash
cd /c/Users/Cole/Dropbox/Website/projects
python -m http.server 8000
```

### Option 2: Node.js HTTP Server

If you prefer Node.js:

```bash
npx http-server . -p 8000
```

### Option 3: Using the Built-in Dev Server

If you want to modify the source and rebuild:

```bash
cd electrostatics-lab-v3/electrostatics-lab
npm run dev
# Opens http://localhost:5173
```

---

## Testing Checklist Before Going Live

### ✓ Deployment Verification

- [ ] Landing page loads at `http://localhost:8000/electrostatics-lab.html`
- [ ] Header and navigation display correctly
- [ ] Footer displays correctly
- [ ] Iframe loads the app (allow 2-3 seconds for initial load)
- [ ] No console errors (open DevTools: F12)

### ✓ Application Functionality

- [ ] All 11 charge configurations load
- [ ] Vector field renders
- [ ] Field lines render
- [ ] Equipotentials render
- [ ] Camera rotation works smoothly
- [ ] Parameter sliders adjust values
- [ ] FPS is smooth (target ≥30 FPS on desktop)
- [ ] No visual artifacts or flickering

### ✓ Physics Validation

For detailed testing, see **TESTING.md** in the project directory. Quick checks:

- [ ] Single Positive: Vectors point outward
- [ ] Single Negative: Vectors point inward
- [ ] Dipole: Field lines curve from + to −
- [ ] Parallel Plates: Uniform field between plates

### ✓ Responsive Design

- [ ] Desktop (1920×1080): Full viewport
- [ ] Tablet (iPad width): Responsive layout
- [ ] Mobile (480px): Readable controls, scrollable if needed

### ✓ Cross-Browser Testing

- [ ] Chrome/Chromium: ✓
- [ ] Firefox: ✓
- [ ] Safari: ✓
- [ ] Edge: ✓

### ✓ Performance

- [ ] Initial load: < 3 seconds
- [ ] First interaction: Immediate response
- [ ] Sustained FPS: ≥30 (desktop default settings)
- [ ] Memory: Stable (no leaks after 5+ min usage)

---

## Performance Optimization Notes

### Build Artifacts

The production build includes:

```
dist/
├── index.html                    (1.07 kB, gzip: 0.57 kB)
├── assets/index-*.css            (4.26 kB, gzip: 1.38 kB)
└── assets/index-*.js             (1.32 MB, gzip: 391 kB)
```

**Note:** The JavaScript bundle is ~391 kB gzipped, which includes:
- React + React Three Fiber
- Three.js (full 3D graphics engine)
- Leva (UI controls)
- All physics calculations and visualizations

This is normal for a sophisticated 3D web application.

### Deployment Size

- Uncompressed: ~1.3 MB
- Gzipped (when served): ~392 kB
- Load time on 5G/fiber: ~0.5-1 second
- Load time on 4G: ~2-3 seconds

---

## Production Deployment

### For Website Server

1. **Verify the landing page exists:**
   ```bash
   ls -lh ~/Dropbox/Website/projects/electrostatics-lab.html
   ```

2. **Verify the build exists:**
   ```bash
   ls -lh ~/Dropbox/Website/projects/electrostatics-lab-v3/electrostatics-lab/dist/
   ```

3. **Deploy to server:**
   - Copy both the landing page and the entire `electrostatics-lab-v3/` directory to your server
   - Ensure file paths in `electrostatics-lab.html` match your server structure
   - Test in browser to confirm iframe loads correctly

4. **URL will be:**
   ```
   https://yourwebsite.com/projects/electrostatics-lab.html
   ```

### For GitHub Pages / Netlify / Vercel

Deploy the **entire `electrostatics-lab-v3/electrostatics-lab/` directory** as a standalone site:

```bash
# Build is already in ./dist/
# Deploy dist/ folder to your hosting
```

Or deploy with framework integrations:

**Netlify:**
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Vercel:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## Troubleshooting

### Issue: Blank iframe or "Failed to load"

**Solution:** Check iframe src path in `electrostatics-lab.html`
- Should point to: `electrostatics-lab-v3/electrostatics-lab/dist/index.html`
- Verify the relative path is correct for your server structure

### Issue: "Failed to fetch" or CORS errors

**Solution:** Ensure you're serving via HTTP server (not opening HTML as file)
- Use `python3 -m http.server 8000` as described above
- Files must be served from same origin

### Issue: App loads but buttons don't work

**Solution:** Check browser console for errors (F12)
- Look for TypeScript errors or missing dependencies
- Verify dist/ files are not corrupted

### Issue: Performance is slow (< 20 FPS)

**Solution:**
- Try "Low Performance Mode": Use browser console to inspect
- Reduce vector density slider to 5-6
- Reduce equipotential levels to 3-4
- Test on a different browser to isolate issue

### Issue: Three.js warnings about BatchedMesh

**Solution:** This is a known warning and doesn't affect functionality
- Appears in console but doesn't break the app
- Can be ignored for testing

---

## Build & Rebuild Instructions

If you modify source code and need to rebuild:

```bash
cd electrostatics-lab-v3/electrostatics-lab

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Dist/ will be updated with new files
```

The landing page will automatically use the new build (no changes needed).

---

## Documentation References

- **README.md** — Quick start and feature overview
- **electrostatics-lab-overview.md** — Educational objectives and pedagogy
- **VALIDATION.md** — Physics validation test results
- **TESTING.md** — Comprehensive testing checklist for all 11 configurations
- **electrostatics-POD.md** — Complete roadmap and development plan (all phases)

---

## Next Steps After Deployment

1. **Run the testing checklist** (TESTING.md) with all 11 configurations
2. **Gather instructor feedback** if deployed to institutions
3. **Monitor performance metrics** in production
4. **Plan Phase 1 enhancements** (export, mobile optimization)

---

## Support & Questions

If encountering issues, refer to:
- Browser console (F12) for error messages
- TESTING.md for systematic validation
- source code comments in `src/` directory

---

**Last Updated:** January 29, 2026
**Project Status:** Production-Ready (Core Objectives Complete)
**Next Phase:** Phase 1 (Enhanced Visualization & Export)
