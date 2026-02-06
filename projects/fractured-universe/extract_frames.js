/**
 * Extract first frame from OpenHV spritesheets
 * OpenHV spritesheets typically have 8 directional sprites in a row (or grid)
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const spriteDir = './public/assets/sprites';

const divisions = ['infantry', 'mobile', 'aviation', 'organic'];

async function extractFrames() {
  for (const division of divisions) {
    const divPath = path.join(spriteDir, division);
    
    if (!fs.existsSync(divPath)) continue;
    
    const files = fs.readdirSync(divPath).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
      const filePath = path.join(divPath, file);
      try {
        const img = await loadImage(filePath);
        
        // OpenHV sprites are typically arranged as 8 directions (horizontal strip)
        // or 4 directions x 4 frames (grid)
        // We'll assume the sprite is divided into 8 equal horizontal sections
        const frameWidth = Math.round(img.width / 8);
        const frameHeight = img.height;
        
        // Create canvas for first frame
        const canvas = createCanvas(frameWidth, frameHeight);
        const ctx = canvas.getContext('2d');
        
        // Draw only first frame (leftmost section)
        ctx.drawImage(img, 0, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
        
        // Save back to same file
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filePath, buffer);
        
        console.log(`✓ Extracted frame from ${division}/${file}`);
      } catch (error) {
        console.error(`✗ Error processing ${division}/${file}: ${error.message}`);
      }
    }
  }
  
  console.log('\nFrame extraction complete!');
}

extractFrames().catch(console.error);
