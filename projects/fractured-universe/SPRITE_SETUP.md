# Sprite Asset Setup Guide

## Step 1: Download Kenney RTS Sci-Fi Sprites

1. Go to: https://opengameart.org/content/sci-fi-rts-120-sprites
2. Click "Download" to get `kenney_rtssci-fi.zip` (2 MB)
3. Extract the ZIP file

## Step 2: Organize Sprites

1. Create folder: `public/assets/sprites/`
2. Copy sprite PNGs from Kenney pack to `public/assets/sprites/kenney/`

**Expected structure:**
```
public/
  assets/
    sprites/
      kenney/
        scifiUnit_1.png
        scifiUnit_2.png
        ... (all unit sprites)
```

## Step 3: Sprite Mapping

The game will automatically map your 16 unit types to available Kenney sprites:

### Infantry
- Trooper → scifiUnit_01.png
- Heavy Gunner → scifiUnit_02.png
- Commando → scifiUnit_03.png
- Juggernaut → scifiUnit_04.png

### Mobile
- Scout Bike → scifiUnit_05.png
- Light Tank → scifiUnit_06.png
- Battle Tank → scifiUnit_07.png
- Siege Walker → scifiUnit_08.png

### Aviation
- Drone → scifiUnit_09.png
- Interceptor → scifiUnit_10.png
- Gunship → scifiUnit_11.png
- Bomber → scifiUnit_12.png

### Organic
- Swarmling → scifiUnit_13.png
- Stalker → scifiUnit_14.png
- Ravager → scifiUnit_15.png
- Leviathan → scifiUnit_16.png

## Step 4: Faction Coloring

The system will automatically apply faction colors by:
1. Loading the base sprite
2. Applying a color shift overlay for faction theming
3. Caching the result

**Crimson Dominion:** Red tint
**Azure Coalition:** Blue tint
**Golden Sovereignty:** Gold tint

No additional setup needed - just place the sprites!

## Notes

- Sprites are cached in memory after first use
- Color overlays are applied procedurally (no additional files needed)
- If sprites don't load, check browser console for errors
