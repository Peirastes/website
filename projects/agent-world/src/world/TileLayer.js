import * as THREE from 'three';

/**
 * Sparse tile storage for InteriorSystem compatibility.
 * Maps tile coords → { index, mesh } and manages 3D meshes inside buildings.
 */

// Tile index → furniture factory function
const TILE_SIZE = 1; // 1 unit = 1 tile in world space

const FURNITURE_COLORS = {
  28: { color: '#e0ddd8', name: 'DESK' },
  29: { color: '#363648', name: 'SERVER' },
  30: { color: '#222230', name: 'MONITOR' },
  48: { color: '#f4f4f4', name: 'WHITEBOARD' },
  49: { color: '#1a1a22', name: 'LABBENCH' },
  50: { color: '#62627a', name: 'LOUNGE' },
  56: { color: '#1a5428', name: 'CIRCUIT' },
  57: { color: '#333340', name: 'DRAWTAB' },
  58: { color: '#e8e4dc', name: 'KANBAN' },
  59: { color: '#5a4030', name: 'BOOKSHELF' },
  60: { color: '#282838', name: 'NETSWITCH' },
  61: { color: '#585860', name: 'LECTERN' },
  62: { color: '#c8b898', name: 'TOOLWALL' },
  63: { color: '#ddd8d4', name: 'PROJECTOR' },
};

function createFurnitureMesh(tileIndex) {
  const info = FURNITURE_COLORS[tileIndex];
  if (!info) return null;

  const color = new THREE.Color(info.color);
  let mesh;

  switch (tileIndex) {
    case 29: // SERVER — tall box with LED dots
    case 59: { // BOOKSHELF — tall box
      const geo = new THREE.BoxGeometry(0.7, 1.4, 0.7);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.7;
      // LED dots for server
      if (tileIndex === 29) {
        const ledGeo = new THREE.BoxGeometry(0.05, 0.05, 0.01);
        const ledMat = new THREE.MeshStandardMaterial({ color: '#44ee44', emissive: '#44ee44', emissiveIntensity: 2 });
        for (let i = 0; i < 4; i++) {
          const led = new THREE.Mesh(ledGeo, ledMat);
          led.position.set(-0.15 + i * 0.1, 0.3 - i * 0.2, 0.36);
          mesh.add(led);
        }
      }
      // Colored stripes for bookshelf
      if (tileIndex === 59) {
        const stripeGeo = new THREE.BoxGeometry(0.6, 0.08, 0.01);
        const colors = ['#2255aa', '#cc3344', '#22aa55', '#dd8833'];
        for (let i = 0; i < 4; i++) {
          const stripe = new THREE.Mesh(stripeGeo,
            new THREE.MeshStandardMaterial({ color: colors[i] }));
          stripe.position.set(0, 0.5 - i * 0.3, 0.36);
          mesh.add(stripe);
        }
      }
      break;
    }
    case 28: // DESK — flat surface + monitor on top
    case 49: { // LABBENCH
      const group = new THREE.Group();
      // Surface
      const surfGeo = new THREE.BoxGeometry(0.8, 0.05, 0.6);
      const surfMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
      const surf = new THREE.Mesh(surfGeo, surfMat);
      surf.position.y = 0.5;
      surf.castShadow = true;
      group.add(surf);
      // Legs
      const legGeo = new THREE.BoxGeometry(0.05, 0.5, 0.05);
      const legMat = new THREE.MeshStandardMaterial({ color: '#808088' });
      for (const [lx, lz] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.25, lz);
        group.add(leg);
      }
      // Small monitor on desk
      const monGeo = new THREE.BoxGeometry(0.3, 0.25, 0.03);
      const monMat = new THREE.MeshStandardMaterial({ color: '#2a2a34' });
      const mon = new THREE.Mesh(monGeo, monMat);
      mon.position.set(0, 0.66, 0);
      group.add(mon);
      // Screen glow
      const scrGeo = new THREE.BoxGeometry(0.26, 0.2, 0.01);
      const scrMat = new THREE.MeshStandardMaterial({ color: '#223355', emissive: '#223355', emissiveIntensity: 0.5 });
      const scr = new THREE.Mesh(scrGeo, scrMat);
      scr.position.set(0, 0.66, 0.02);
      group.add(scr);
      mesh = group;
      break;
    }
    case 30: { // MONITOR — thin wide screen
      const group = new THREE.Group();
      const monGeo = new THREE.BoxGeometry(0.6, 0.4, 0.04);
      const monMat = new THREE.MeshStandardMaterial({ color: '#222230' });
      const mon = new THREE.Mesh(monGeo, monMat);
      mon.position.y = 0.7;
      group.add(mon);
      const scrGeo = new THREE.BoxGeometry(0.55, 0.35, 0.01);
      const scrMat = new THREE.MeshStandardMaterial({ color: '#223355', emissive: '#334466', emissiveIntensity: 0.6 });
      const scr = new THREE.Mesh(scrGeo, scrMat);
      scr.position.set(0, 0.7, 0.03);
      group.add(scr);
      // Stand
      const standGeo = new THREE.BoxGeometry(0.05, 0.4, 0.05);
      const stand = new THREE.Mesh(standGeo, new THREE.MeshStandardMaterial({ color: '#444' }));
      stand.position.y = 0.3;
      group.add(stand);
      mesh = group;
      break;
    }
    case 58: { // KANBAN — vertical board with colored squares
      const group = new THREE.Group();
      const boardGeo = new THREE.BoxGeometry(0.7, 0.9, 0.04);
      const boardMat = new THREE.MeshStandardMaterial({ color: '#e8e4dc', roughness: 0.9 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.y = 0.7;
      group.add(board);
      const cardColors = ['#ee5555', '#ddaa33', '#44bb66'];
      for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 3; row++) {
          const cGeo = new THREE.BoxGeometry(0.15, 0.12, 0.01);
          const cMat = new THREE.MeshStandardMaterial({ color: cardColors[col] });
          const card = new THREE.Mesh(cGeo, cMat);
          card.position.set(-0.2 + col * 0.2, 0.9 - row * 0.2, 0.03);
          group.add(card);
        }
      }
      mesh = group;
      break;
    }
    case 61: { // LECTERN — podium shape
      const group = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: '#585860', roughness: 0.6 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.4;
      group.add(body);
      // Reading surface
      const topGeo = new THREE.BoxGeometry(0.6, 0.05, 0.5);
      const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ color: '#6a6a72' }));
      top.position.y = 0.85;
      top.rotation.x = -0.2;
      group.add(top);
      // LED accent
      const ledGeo = new THREE.BoxGeometry(0.4, 0.03, 0.01);
      const ledMat = new THREE.MeshStandardMaterial({ color: '#66bb66', emissive: '#66bb66', emissiveIntensity: 1 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 0.05, 0.21);
      group.add(led);
      mesh = group;
      break;
    }
    default: { // Generic colored box for remaining types
      const geo = new THREE.BoxGeometry(0.7, 0.5, 0.7);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.25;
      break;
    }
  }

  if (mesh.isMesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  } else {
    mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  return mesh;
}

export class TileLayer {
  constructor(scene) {
    this.scene = scene;
    this.tiles = new Map(); // "x,y" → { index, mesh }
  }

  _key(x, y) { return `${x},${y}`; }

  getTileAt(x, y) {
    const entry = this.tiles.get(this._key(x, y));
    return entry ? { index: entry.index } : null;
  }

  putTileAt(index, x, y) {
    this.removeTileAt(x, y);
    const mesh = createFurnitureMesh(index);
    if (mesh) {
      mesh.position.x = x + 0.5;
      mesh.position.z = y + 0.5;
      if (mesh.isGroup) {
        // Group already has y offsets set per-child
      }
      this.scene.add(mesh);
    }
    this.tiles.set(this._key(x, y), { index, mesh });
  }

  removeTileAt(x, y) {
    const key = this._key(x, y);
    const entry = this.tiles.get(key);
    if (entry) {
      if (entry.mesh) this.scene.remove(entry.mesh);
      this.tiles.delete(key);
    }
  }
}
