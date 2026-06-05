# Styling Architecture

ETM uses a hybrid approach: Tailwind CSS utilities for layout + custom CSS component classes for the Peirastes instrument aesthetic.

## CSS Structure

**`src/index.css`** contains:
1. Google Fonts import (Space Grotesk + JetBrains Mono)
2. `:root` design tokens from Peirastes Style Guide v2.1
3. Component classes (`etm-chassis`, `etm-monitor`, `etm-pushbutton`, etc.)
4. CRT monitor construction (hood, bezel, well, glass, scanlines, vignette)
5. SVG noise textures for metallic surfaces
6. Animations (LED pulse, modal transitions, reveal sequence)
7. Dark scrollbar styling

**`tailwind.config.js`** — default config, no custom extensions. Colors use arbitrary values (`bg-[#1e2428]`) that match the `:root` tokens.

## If Styles Look Wrong

1. Hard refresh (Ctrl+Shift+R)
2. Check that `dist/` was rebuilt: `npm run build`
3. Verify the Express server is serving the latest dist: restart with `npm run server`
4. Check browser DevTools Network tab for cached CSS files

## Font Dependencies

The app loads fonts via Google Fonts CDN (in `index.css`). If fonts don't load:
- Space Grotesk falls back to `system-ui, sans-serif`
- JetBrains Mono falls back to `Consolas, monospace`
- Courier New (CRT screens) is a system font, always available
