import * as THREE from 'three';

/**
 * Procedural pixel-art character sprite generation.
 * Extracted from BootScene — same palettes, same drawChar logic.
 * Output: THREE.CanvasTexture spritesheets (128×192 = 4 frames × 4 directions).
 */

// ─── Drawing primitives (standalone) ────────────────────────────────────────

function px(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }

function ellipse(c, cx, cy, rx, ry, col) {
  c.fillStyle = col;
  for (let dy = -ry; dy <= ry; dy++) {
    const halfW = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry)));
    c.fillRect(cx - halfW, cy + dy, halfW * 2 + 1, 1);
  }
}

function hexToRGB(hex) {
  const v = parseInt(hex.replace('#', ''), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

// ─── Character drawing (same as BootScene.drawChar) ─────────────────────────

function drawChar(ctx, ox, oy, dir, fr, p) {
  const _px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); };
  const _rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };
  const _ellipse = (cx, cy, rx, ry, c) => { ellipse(ctx, ox + cx, oy + cy, rx, ry, c); };

  const legPhase = [0, 1, 0, -1][fr];
  const armPhase = [0, -1, 0, 1][fr];
  const bodyBob = [0, -1, 0, -1][fr];
  const by = bodyBob;

  // ── HAIR / HEAD (y 3–16) ──
  if (dir === 0) {
    _ellipse(16, 7 + by, 7, 5, p.hair);
    _ellipse(16, 10 + by, 6, 6, p.skin);
    _ellipse(14, 8 + by, 3, 2, p.skinHi);
    _rect(10, 3 + by, 12, 4, p.hair);
    _rect(9, 5 + by, 3, 4, p.hair);
    _rect(20, 5 + by, 3, 4, p.hair);
    _rect(12, 4 + by, 4, 2, p.hairHi);
    _rect(12, 10 + by, 3, 2, '#ffffff');
    _rect(18, 10 + by, 3, 2, '#ffffff');
    _px(13, 11 + by, '#222');
    _px(19, 11 + by, '#222');
    _px(13, 10 + by, '#334');
    _px(19, 10 + by, '#334');
    _rect(11, 9 + by, 4, 1, p.hair);
    _rect(17, 9 + by, 4, 1, p.hair);
    _px(16, 13 + by, p.skinSh);
    _px(15, 13 + by, p.skinSh);
    _rect(14, 14 + by, 4, 1, p.skinSh);
    _px(11, 12 + by, p.skinHi);
    _rect(13, 15 + by, 6, 1, p.skinSh);
    _px(9, 10 + by, p.skin);
    _px(22, 10 + by, p.skinSh);
  } else if (dir === 3) {
    _ellipse(16, 8 + by, 7, 6, p.hair);
    _rect(10, 3 + by, 12, 6, p.hair);
    _rect(9, 6 + by, 14, 8, p.hair);
    _rect(12, 4 + by, 3, 2, p.hairHi);
    _px(15, 7 + by, p.hairHi);
    _px(9, 10 + by, p.skin);
    _px(22, 10 + by, p.skin);
  } else if (dir === 1) {
    _ellipse(15, 8 + by, 6, 6, p.hair);
    _ellipse(14, 10 + by, 5, 6, p.skin);
    _rect(12, 3 + by, 8, 5, p.hair);
    _rect(18, 5 + by, 3, 6, p.hair);
    _rect(13, 4 + by, 3, 2, p.hairHi);
    _rect(11, 10 + by, 3, 2, '#ffffff');
    _px(12, 11 + by, '#222');
    _rect(10, 9 + by, 4, 1, p.hair);
    _px(9, 12 + by, p.skin);
    _px(8, 12 + by, p.skinSh);
    _rect(10, 14 + by, 3, 1, p.skinSh);
    _px(19, 9 + by, p.skinSh);
  } else {
    _ellipse(17, 8 + by, 6, 6, p.hair);
    _ellipse(18, 10 + by, 5, 6, p.skin);
    _rect(12, 3 + by, 8, 5, p.hair);
    _rect(11, 5 + by, 3, 6, p.hair);
    _rect(16, 4 + by, 3, 2, p.hairHi);
    _rect(18, 10 + by, 3, 2, '#ffffff');
    _px(19, 11 + by, '#222');
    _rect(18, 9 + by, 4, 1, p.hair);
    _px(23, 12 + by, p.skin);
    _px(24, 12 + by, p.skinSh);
    _rect(19, 14 + by, 3, 1, p.skinSh);
    _px(13, 9 + by, p.skinSh);
  }

  // ── NECK ──
  _rect(14, 16 + by, 4, 2, p.skin);
  if (dir !== 3) _rect(14, 16 + by, 2, 2, p.skinHi);

  // ── TORSO ──
  _rect(8, 18 + by, 16, 14, p.shirt);
  _rect(12, 17 + by, 8, 2, p.shirt);
  _rect(13, 17 + by, 6, 1, p.shirtHi);
  _rect(8, 18 + by, 4, 14, p.shirtHi);
  _rect(20, 18 + by, 4, 14, p.shirtSh);
  if (dir === 0) {
    for (let y = 19; y < 31; y += 3) _px(16, y + by, p.shirtHi);
    _rect(10, 24 + by, 4, 3, p.shirtSh);
    _rect(10, 24 + by, 4, 1, p.shirt);
  }
  if (dir === 1) _rect(18, 18 + by, 3, 14, p.shirtSh);
  if (dir === 2) _rect(11, 18 + by, 3, 14, p.shirtSh);

  // ── ARMS ──
  if (dir === 0 || dir === 3) {
    const armSwing = armPhase * 3;
    _rect(5, 18 + by + armSwing, 3, 12, p.shirt);
    _rect(5, 18 + by + armSwing, 3, 2, p.shirtHi);
    _rect(5, 28 + by + armSwing, 3, 3, p.skin);
    _rect(5, 28 + by + armSwing, 2, 2, p.skinHi);
    _rect(24, 18 + by - armSwing, 3, 12, p.shirtSh);
    _rect(24, 18 + by - armSwing, 3, 2, p.shirt);
    _rect(24, 28 + by - armSwing, 3, 3, p.skinSh);
    _rect(24, 28 + by - armSwing, 2, 2, p.skin);
  } else if (dir === 1) {
    const sw = armPhase * 2;
    _rect(16, 18 + by + sw, 3, 11, p.shirtSh);
    _rect(16, 28 + by + sw, 3, 3, p.skinSh);
  } else {
    const sw = armPhase * 2;
    _rect(13, 18 + by - sw, 3, 11, p.shirtHi);
    _rect(13, 28 + by - sw, 3, 3, p.skinHi);
  }

  // ── BELT ──
  _rect(8, 31 + by, 16, 2, '#222230');
  _rect(14, 31 + by, 4, 2, '#606070');
  _px(15, 31 + by, '#808090');

  // ── LEGS ──
  const legOff = legPhase * 2;
  if (dir === 0 || dir === 3) {
    _rect(9 - legOff, 33 + by, 5, 10, p.pants);
    _rect(9 - legOff, 33 + by, 2, 10, p.pantsHi);
    _rect(18 + legOff, 33 + by, 5, 10, p.pants);
    _rect(21 + legOff, 33 + by, 2, 10, '#262c3c');
    _rect(8 - legOff, 43 + by, 7, 4, p.shoes);
    _rect(8 - legOff, 43 + by, 3, 2, p.shoeHi);
    _rect(17 + legOff, 43 + by, 7, 4, p.shoes);
    _rect(17 + legOff, 43 + by, 3, 2, p.shoeHi);
  } else if (dir === 1) {
    _rect(11 + legOff, 33 + by, 5, 10, p.pants);
    _rect(14 - legOff, 33 + by, 5, 10, p.pants);
    _rect(14 - legOff, 33 + by, 2, 10, p.pantsHi);
    _rect(10 + legOff, 43 + by, 7, 4, p.shoes);
    _rect(13 - legOff, 43 + by, 7, 4, p.shoes);
    _rect(13 - legOff, 43 + by, 3, 2, p.shoeHi);
  } else {
    _rect(13 + legOff, 33 + by, 5, 10, p.pants);
    _rect(16 - legOff, 33 + by, 5, 10, p.pants);
    _rect(16 - legOff, 33 + by, 2, 10, p.pantsHi);
    _rect(12 + legOff, 43 + by, 7, 4, p.shoes);
    _rect(15 - legOff, 43 + by, 7, 4, p.shoes);
    _rect(15 - legOff, 43 + by, 3, 2, p.shoeHi);
  }

  // ── OUTLINE ──
  const imgData = ctx.getImageData(ox, oy, 32, 48);
  const d = imgData.data;
  const filled = (x, y) => x >= 0 && x < 32 && y >= 0 && y < 48 && d[(y * 32 + x) * 4 + 3] > 0;
  const outPx = [];
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 32; x++) {
      if (!filled(x, y) && (filled(x-1,y)||filled(x+1,y)||filled(x,y-1)||filled(x,y+1))) {
        outPx.push([x, y]);
      }
    }
  }
  ctx.fillStyle = p.outline;
  for (const [x, y] of outPx) ctx.fillRect(ox + x, oy + y, 1, 1);
}

// ─── Public API ─────────────────────────────────────────────────────────────

const W = 32, H = 48, FRAMES = 4, DIRS = 4;

export function generatePlayerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = W * FRAMES;
  canvas.height = H * DIRS;
  const ctx = canvas.getContext('2d');

  const pal = {
    skin: '#ecc8a0', skinHi: '#f4d8b4', skinSh: '#c8a070',
    hair: '#2a2838', hairHi: '#3a3848',
    shirt: '#2a3040', shirtHi: '#363c4c', shirtSh: '#1e2430',
    pants: '#323848', pantsHi: '#3e4458',
    shoes: '#1e1e28', shoeHi: '#2a2a34',
    outline: '#141420'
  };

  for (let dir = 0; dir < DIRS; dir++) {
    for (let fr = 0; fr < FRAMES; fr++) {
      drawChar(ctx, fr * W, dir * H, dir, fr, pal);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

const AGENT_PALETTES = {
  CE: { skin:'#ecc8a0', skinHi:'#f4d8b4', skinSh:'#c8a070', hair:'#1e2030', hairHi:'#2e3040',
        shirt:'#3a6eaa', shirtHi:'#4a80bb', shirtSh:'#2a5e99', pants:'#2a3040', pantsHi:'#363c50',
        shoes:'#1e1e28', shoeHi:'#2a2a34', outline:'#141420' },
  CD: { skin:'#e4c098', skinHi:'#f0d0aa', skinSh:'#c0a078', hair:'#aa3070', hairHi:'#bb4080',
        shirt:'#7844aa', shirtHi:'#8855bb', shirtSh:'#683499', pants:'#282838', pantsHi:'#343448',
        shoes:'#1a1a28', shoeHi:'#262634', outline:'#141420' },
  PM: { skin:'#ecc8a0', skinHi:'#f4d8b4', skinSh:'#c8a070', hair:'#303030', hairHi:'#404040',
        shirt:'#aa8020', shirtHi:'#bb9030', shirtSh:'#9a7010', pants:'#2a3040', pantsHi:'#363c50',
        shoes:'#1e1e28', shoeHi:'#2a2a34', outline:'#141420' },
  RA: { skin:'#d8b888', skinHi:'#e4c898', skinSh:'#b89868', hair:'#4a3018', hairHi:'#5a4028',
        shirt:'#208070', shirtHi:'#309080', shirtSh:'#107060', pants:'#2a3040', pantsHi:'#363c50',
        shoes:'#1e1e28', shoeHi:'#2a2a34', outline:'#141420' },
  SA: { skin:'#ecc8a0', skinHi:'#f4d8b4', skinSh:'#c8a070', hair:'#802020', hairHi:'#903030',
        shirt:'#bb3030', shirtHi:'#cc4040', shirtSh:'#aa2020', pants:'#2a3040', pantsHi:'#363c50',
        shoes:'#1e1e28', shoeHi:'#2a2a34', outline:'#141420' },
  TA: { skin:'#e4c8a8', skinHi:'#f0d8b8', skinSh:'#c0a888', hair:'#4a3820', hairHi:'#5a4830',
        shirt:'#2e7830', shirtHi:'#3e8840', shirtSh:'#1e6820', pants:'#2a3040', pantsHi:'#363c50',
        shoes:'#1e1e28', shoeHi:'#2a2a34', outline:'#141420' },
};

export function generateAgentTexture(typeId) {
  const pal = AGENT_PALETTES[typeId];
  if (!pal) return null;

  const canvas = document.createElement('canvas');
  canvas.width = W * FRAMES;
  canvas.height = H * DIRS;
  const ctx = canvas.getContext('2d');

  for (let dir = 0; dir < DIRS; dir++) {
    for (let fr = 0; fr < FRAMES; fr++) {
      drawChar(ctx, fr * W, dir * H, dir, fr, pal);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

