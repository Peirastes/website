import * as THREE from 'three';

const MAP_W = 30;
const MAP_H = 24;

/**
 * Builds all static 3D geometry for the campus. Called once by GameWorld.
 * Coordinate system: x = east, z = south (matching tile coords), y = up.
 * 1 tile = 1 world unit.
 */
export class CampusBuilder {
  constructor(scene) {
    this.scene = scene;
    this.wallTiles = new Set(); // "x,z" blocked tile coords
    this.doorTiles = new Set(); // "x,z" door tile coords
    this.buildingRefs = {};     // id → { x, z, w, h, group }
  }

  build() {
    this.buildGround();
    this.buildBuildings();
    this.buildTrees();
    this.buildDecorations();
    this.buildFountain();
    return {
      wallTiles: this.wallTiles,
      doorTiles: this.doorTiles,
      buildings: this.buildingRefs,
    };
  }

  // ─── Ground Plane ─────────────────────────────────────────────────────────

  buildGround() {
    const canvas = document.createElement('canvas');
    canvas.width = MAP_W * 16;
    canvas.height = MAP_H * 16;
    const c = canvas.getContext('2d');
    const S = 16; // pixels per tile in texture

    // Seeded RNG for lawn variety
    const rng = (seed) => {
      let s = seed | 0 || 1;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };

    // Base: lawn
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const h = (x * 31 + y * 17) % 10;
        let baseColor;
        if (h < 4) baseColor = '#509858';
        else if (h < 7) baseColor = '#4a9050';
        else if (h < 9) baseColor = '#48884a';
        else baseColor = '#468848';
        c.fillStyle = baseColor;
        c.fillRect(x * S, y * S, S, S);
        // Grass detail
        const r = rng(x * 31 + y * 17);
        for (let i = 0; i < 4; i++) {
          const gx = x * S + Math.floor(r() * S);
          const gy = y * S + Math.floor(r() * S);
          c.fillStyle = r() > 0.5 ? '#5aa860' : '#3a7a40';
          c.fillRect(gx, gy, 1, 1);
        }
      }
    }

    // Walkways
    const paintConc = (x, y) => {
      c.fillStyle = '#b4b0ac';
      c.fillRect(x * S, y * S, S, S);
      c.fillStyle = '#a8a4a0';
      c.fillRect(x * S, y * S, S, 1);
      c.fillRect(x * S, y * S, 1, S);
    };

    // Central horizontal
    for (let x = 0; x < MAP_W; x++) { paintConc(x, 11); paintConc(x, 12); }
    // Central vertical
    for (let y = 0; y < MAP_H; y++) { paintConc(14, y); paintConc(15, y); }
    // West connector
    for (let y = 3; y < 21; y++) paintConc(6, y);
    // East connector
    for (let y = 3; y < 21; y++) paintConc(23, y);
    // North cross
    for (let x = 6; x <= 23; x++) paintConc(x, 5);
    // South cross
    for (let x = 6; x <= 23; x++) paintConc(x, 18);
    // Building approaches
    for (let x = 2; x <= 6; x++) { paintConc(x, 9); paintConc(x, 18); }
    for (let x = 23; x <= 27; x++) { paintConc(x, 7); paintConc(x, 15); }
    for (let x = 10; x <= 19; x++) paintConc(x, 5);
    for (let x = 20; x <= 27; x++) paintConc(x, 6);
    // Central plaza pavers
    for (let x = 12; x <= 17; x++) {
      for (let y = 9; y <= 14; y++) {
        c.fillStyle = '#9a9490';
        c.fillRect(x * S, y * S, S, S);
        c.fillStyle = '#a49e9a';
        c.fillRect(x * S, y * S, S, 1);
        c.fillRect(x * S, y * S, 1, S);
        c.fillStyle = '#868280';
        c.fillRect(x * S, (y + 1) * S - 1, S, 1);
      }
    }

    // Create ground mesh
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipmapLinearFilter;
    const geo = new THREE.PlaneGeometry(MAP_W, MAP_H);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(MAP_W / 2, 0, MAP_H / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // ─── Buildings ─────────────────────────────────────────────────────────────

  buildBuildings() {
    const defs = [
      { id: 'RA', x: 10, y: 1,  w: 10, h: 5, color: '#44ccaa', floorType: 'polish' },
      { id: 'CD', x: 1,  y: 5,  w: 6,  h: 5, color: '#c066ee', floorType: 'carpet' },
      { id: 'CE', x: 1,  y: 14, w: 6,  h: 5, color: '#4a9eff', floorType: 'tile' },
      { id: 'PM', x: 20, y: 2,  w: 8,  h: 5, color: '#ddaa33', floorType: 'carpet' },
      { id: 'TA', x: 23, y: 9,  w: 6,  h: 5, color: '#66bb66', floorType: 'tile' },
      { id: 'SA', x: 23, y: 16, w: 6,  h: 5, color: '#ee5555', floorType: 'dark' },
    ];

    for (const def of defs) {
      const group = this.buildOneBuilding(def);
      this.scene.add(group);
      this.buildingRefs[def.id] = { x: def.x, y: def.y, w: def.w, h: def.h, group };
    }

    // Forum building — classical amphitheater
    const forumGroup = this.buildForumBuilding();
    this.scene.add(forumGroup);
    this.buildingRefs['FORUM'] = { x: 9, y: 18, w: 12, h: 6, group: forumGroup };
  }

  buildOneBuilding({ id, x, y, w, h, color, floorType }) {
    const group = new THREE.Group();
    const wallHeight = 2.5;
    const wallThickness = 0.12;
    const agentColor = new THREE.Color(color);
    const doorX = x + Math.floor(w / 2);
    const doorZ = y + h - 1;

    // Glass wall material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: agentColor,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Steel frame material
    const frameMat = new THREE.MeshStandardMaterial({
      color: agentColor.clone().multiplyScalar(0.4),
      roughness: 0.3,
      metalness: 0.8,
    });

    // Floor material
    const floorColors = { polish: '#9e9ea6', carpet: '#52526a', tile: '#b8b6b2', dark: '#262630' };
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColors[floorType] || '#9e9ea6',
      roughness: floorType === 'polish' ? 0.2 : 0.8,
    });

    // Interior floor
    const floorGeo = new THREE.PlaneGeometry(w - 0.3, h - 0.3);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x + w / 2, 0.01, y + h / 2);
    floor.receiveShadow = true;
    group.add(floor);

    // Build walls and register collision tiles
    for (let wy = y; wy < y + h; wy++) {
      for (let wx = x; wx < x + w; wx++) {
        const isRoof = wy === y;
        const isEdge = wx === x || wx === x + w - 1 || wy === y + 1 || wy === y + h - 1;
        const isDoor = wx === doorX && wy === doorZ;

        if (isRoof) {
          // Roof accent — colored strip
          this.wallTiles.add(`${wx},${wy}`);
        } else if (isEdge) {
          if (isDoor) {
            this.doorTiles.add(`${wx},${wy}`);
          } else {
            this.wallTiles.add(`${wx},${wy}`);
          }
        }
      }
    }

    // Wall meshes — 4 sides as thin boxes
    const buildWall = (cx, cz, ww, wd) => {
      const geo = new THREE.BoxGeometry(ww, wallHeight, wd);
      const wall = new THREE.Mesh(geo, glassMat);
      wall.position.set(cx, wallHeight / 2, cz);
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
      // Frame edges
      const edgeGeo = new THREE.BoxGeometry(ww + 0.04, 0.08, wd + 0.04);
      const topEdge = new THREE.Mesh(edgeGeo, frameMat);
      topEdge.position.set(cx, wallHeight, cz);
      group.add(topEdge);
      const botEdge = new THREE.Mesh(edgeGeo, frameMat);
      botEdge.position.set(cx, 0, cz);
      group.add(botEdge);
    };

    const cx = x + w / 2;
    const cz = y + h / 2;

    // Back wall (north)
    buildWall(cx, y + 1 + wallThickness / 2, w, wallThickness);
    // Front wall (south) — gap for door
    const frontZ = y + h - 1 + 0.5;
    // Left section of front wall
    const leftW = (doorX - x);
    if (leftW > 0) {
      buildWall(x + leftW / 2, frontZ, leftW, wallThickness);
    }
    // Right section of front wall
    const rightW = (x + w - doorX - 1);
    if (rightW > 0) {
      buildWall(doorX + 1 + rightW / 2, frontZ, rightW, wallThickness);
    }
    // Left wall (west)
    buildWall(x + wallThickness / 2, cz, wallThickness, h - 1);
    // Right wall (east)
    buildWall(x + w - wallThickness / 2, cz, wallThickness, h - 1);

    // Roof
    const roofGeo = new THREE.BoxGeometry(w, 0.1, h);
    const roofMat = new THREE.MeshStandardMaterial({
      color: '#44485a',
      roughness: 0.7,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(cx, wallHeight + 0.05, y + h / 2);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // Roof accent strip (colored LED)
    const stripGeo = new THREE.BoxGeometry(w + 0.2, 0.06, 0.2);
    const stripMat = new THREE.MeshStandardMaterial({
      color: agentColor,
      emissive: agentColor,
      emissiveIntensity: 0.8,
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(cx, wallHeight + 0.13, y + 1);
    group.add(strip);

    // Interior point light
    const light = new THREE.PointLight(agentColor, 0.6, 8, 2);
    light.position.set(cx, 1.5, y + h / 2);
    group.add(light);

    return group;
  }

  // ─── Forum (Open-Air Amphitheater Sector) ──────────────────────────────────

  buildForumBuilding() {
    const group = new THREE.Group();
    const cx = 15;         // center x of sector
    const stageZ = 23;     // stage/podium at south end
    const halfArc = 70 * Math.PI / 180; // ±70° from north = 140° sector

    // After rotation.x = -PI/2: ring angle 0 = +X (east), PI/2 = north (-Z)
    const thetaStart = Math.PI / 2 - halfArc;
    const thetaLength = halfArc * 2;

    // Materials
    const stoneMat = new THREE.MeshStandardMaterial({
      color: '#b8a888', roughness: 0.85, metalness: 0.05,
    });
    const stoneAccent = new THREE.MeshStandardMaterial({
      color: '#a09070', roughness: 0.8, metalness: 0.05,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#c8b898', roughness: 0.7,
    });
    const podiumMat = new THREE.MeshStandardMaterial({
      color: '#d4c8a8', roughness: 0.5, metalness: 0.1,
    });
    const columnMat = new THREE.MeshStandardMaterial({
      color: '#ccc0a0', roughness: 0.6, metalness: 0.1,
    });
    const seatMat = new THREE.MeshStandardMaterial({
      color: '#a09478', roughness: 0.8,
    });

    // Sector-shaped stone floor (pie slice from stage outward)
    const sectorFloor = new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 48, thetaStart, thetaLength),
      floorMat
    );
    sectorFloor.rotation.x = -Math.PI / 2;
    sectorFloor.position.set(cx, 0.01, stageZ);
    sectorFloor.receiveShadow = true;
    group.add(sectorFloor);

    // Stage circle floor (covers southern half around podium)
    const stageFloor = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 16),
      floorMat
    );
    stageFloor.rotation.x = -Math.PI / 2;
    stageFloor.position.set(cx, 0.01, stageZ);
    stageFloor.receiveShadow = true;
    group.add(stageFloor);

    // Podium
    const podGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.35, 12);
    const podium = new THREE.Mesh(podGeo, podiumMat);
    podium.position.set(cx, 0.175, stageZ);
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    // Lectern
    const lecternGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const lectern = new THREE.Mesh(lecternGeo, stoneAccent);
    lectern.position.set(cx, 0.65, stageZ);
    lectern.castShadow = true;
    group.add(lectern);

    // Podium wall tile (only collision in the forum)
    this.wallTiles.add(`${Math.floor(cx)},${Math.floor(stageZ)}`);

    // 3 curved seat rows fanning northward from the stage
    const rows = [
      { radius: 2.5, count: 6,  tierHeight: 0.15 },
      { radius: 3.5, count: 8,  tierHeight: 0.30 },
      { radius: 4.0, count: 10, tierHeight: 0.45 },
    ];

    for (const row of rows) {
      // Stepped stone tier platform
      const stepGeo = new THREE.RingGeometry(
        row.radius - 0.35, row.radius + 0.35, 32, 1,
        thetaStart, thetaLength
      );
      const step = new THREE.Mesh(stepGeo, floorMat);
      step.rotation.x = -Math.PI / 2;
      step.position.set(cx, row.tierHeight, stageZ);
      step.receiveShadow = true;
      group.add(step);

      // Individual stone seat blocks
      for (let i = 0; i < row.count; i++) {
        const t = (i + 0.5) / row.count;
        const angle = -halfArc + t * halfArc * 2;
        const sx = cx + row.radius * Math.sin(angle);
        const sz = stageZ - row.radius * Math.cos(angle);

        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.3, 0.35),
          seatMat
        );
        seat.position.set(sx, row.tierHeight + 0.15, sz);
        seat.rotation.y = angle;
        seat.castShadow = true;
        seat.receiveShadow = true;
        group.add(seat);
      }
    }

    // Doric columns along outer arc (back row perimeter)
    const colRadius = 0.18;
    const colHeight = 3.0;
    const colGeo = new THREE.CylinderGeometry(colRadius, colRadius * 1.15, colHeight, 10);
    const capGeo = new THREE.BoxGeometry(0.5, 0.12, 0.5);
    const colArcRadius = 4.8;

    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7;
      const angle = -halfArc + t * halfArc * 2;
      const colX = cx + colArcRadius * Math.sin(angle);
      const colZ = stageZ - colArcRadius * Math.cos(angle);

      const col = new THREE.Mesh(colGeo, columnMat);
      col.position.set(colX, colHeight / 2, colZ);
      col.castShadow = true;
      group.add(col);

      const capital = new THREE.Mesh(capGeo, stoneAccent);
      capital.position.set(colX, colHeight, colZ);
      group.add(capital);

      const base = new THREE.Mesh(capGeo, stoneAccent);
      base.position.set(colX, 0.06, colZ);
      group.add(base);
    }

    // Low stone curb along outer arc edge
    for (let i = 0; i < 20; i++) {
      const t = (i + 0.5) / 20;
      const angle = -halfArc + t * halfArc * 2;
      const bx = cx + 4.5 * Math.sin(angle);
      const bz = stageZ - 4.5 * Math.cos(angle);

      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 0.15),
        stoneMat
      );
      curb.position.set(bx, 0.15, bz);
      curb.rotation.y = angle;
      curb.castShadow = true;
      group.add(curb);
    }

    // Warm amber point lights at ground level
    const warmColor = '#ffcc88';
    const lightPositions = [
      [cx, 0.5, stageZ],
      [cx - 3, 0.5, stageZ - 3],
      [cx + 3, 0.5, stageZ - 3],
      [cx, 0.5, stageZ - 4.5],
    ];
    for (const [lx, ly, lz] of lightPositions) {
      const light = new THREE.PointLight(warmColor, 0.6, 8, 2);
      light.position.set(lx, ly, lz);
      group.add(light);
    }

    return group;
  }

  // ─── Trees ─────────────────────────────────────────────────────────────────

  buildTrees() {
    const positions = [
      [0, 0], [29, 0], [0, 23], [29, 23],
      [8, 1], [8, 22],
      [8, 7], [8, 15], [21, 8], [21, 15],
      [12, 8], [17, 8], [12, 15], [17, 15]
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#7a6040', roughness: 0.9 });
    const canopyGeo = new THREE.SphereGeometry(0.8, 8, 6);
    canopyGeo.scale(1, 0.75, 1);
    const canopyMat = new THREE.MeshStandardMaterial({ color: '#3a8a48', roughness: 0.8 });

    for (const [tx, tz] of positions) {
      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      tree.add(trunk);

      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 1.9;
      canopy.castShadow = true;
      tree.add(canopy);

      // Light-side highlight canopy
      const hiGeo = new THREE.SphereGeometry(0.55, 6, 4);
      hiGeo.scale(1, 0.7, 1);
      const hiMat = new THREE.MeshStandardMaterial({ color: '#4a9a58', roughness: 0.8 });
      const hi = new THREE.Mesh(hiGeo, hiMat);
      hi.position.set(-0.2, 2.1, -0.15);
      tree.add(hi);

      tree.position.set(tx + 0.5, 0, tz + 0.5);
      this.scene.add(tree);

      // Tree trunks block movement
      this.wallTiles.add(`${tx},${tz}`);
    }
  }

  // ─── Decorations ───────────────────────────────────────────────────────────

  buildDecorations() {
    this.buildBenches();
    this.buildBollards();
    this.buildHedges();
    this.buildPlanters();
    this.buildDigitalSigns();
  }

  buildBenches() {
    const positions = [[13, 10], [16, 13]];
    const benchGeo = new THREE.BoxGeometry(0.8, 0.3, 0.4);
    const benchMat = new THREE.MeshStandardMaterial({ color: '#9a7a50', roughness: 0.8 });
    const legGeo = new THREE.BoxGeometry(0.8, 0.05, 0.4);
    const legMat = new THREE.MeshStandardMaterial({ color: '#888890', roughness: 0.5 });

    for (const [bx, bz] of positions) {
      const group = new THREE.Group();
      // Seat
      const seat = new THREE.Mesh(benchGeo, benchMat);
      seat.position.y = 0.35;
      seat.castShadow = true;
      group.add(seat);
      // Base
      const base = new THREE.Mesh(legGeo, legMat);
      base.position.y = 0.15;
      group.add(base);
      group.position.set(bx + 0.5, 0, bz + 0.5);
      this.scene.add(group);
    }
  }

  buildBollards() {
    const positions = [[12, 11], [17, 12], [6, 8], [6, 16], [23, 8], [23, 16]];
    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#606068', roughness: 0.4, metalness: 0.5 });
    const headGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: '#ffeeaa',
      emissive: '#ffeeaa',
      emissiveIntensity: 1.5,
    });

    for (const [bx, bz] of positions) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.4;
      body.castShadow = true;
      group.add(body);
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.85;
      group.add(head);
      // Small warm point light
      const light = new THREE.PointLight('#ffeeaa', 0.3, 3, 2);
      light.position.y = 0.9;
      group.add(light);
      group.position.set(bx + 0.5, 0, bz + 0.5);
      this.scene.add(group);
      this.wallTiles.add(`${bx},${bz}`);
    }
  }

  buildHedges() {
    const positions = [
      [12, 8], [17, 8], [12, 15], [17, 15],
      [0, 4], [0, 11], [0, 13], [0, 20]
    ];
    const hedgeGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
    const hedgeMat = new THREE.MeshStandardMaterial({ color: '#3a8a44', roughness: 0.9 });

    for (const [hx, hz] of positions) {
      const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
      hedge.position.set(hx + 0.5, 0.35, hz + 0.5);
      hedge.castShadow = true;
      this.scene.add(hedge);
    }
  }

  buildPlanters() {
    const planters = [
      { x: 13, z: 9, color: '#3a9a50' },
      { x: 16, z: 9, color: '#cc5588' },
      { x: 13, z: 14, color: '#3a9a50' },
      { x: 16, z: 14, color: '#cc5588' },
    ];
    const potGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.3, 8);
    const potMat = new THREE.MeshStandardMaterial({ color: '#888890', roughness: 0.7 });

    for (const p of planters) {
      const group = new THREE.Group();
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.y = 0.15;
      group.add(pot);
      const plantGeo = new THREE.SphereGeometry(0.3, 6, 4);
      const plantMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.8 });
      const plant = new THREE.Mesh(plantGeo, plantMat);
      plant.position.y = 0.5;
      plant.castShadow = true;
      group.add(plant);
      group.position.set(p.x + 0.5, 0, p.z + 0.5);
      this.scene.add(group);
    }
  }

  buildDigitalSigns() {
    const signs = [[14, 8], [9, 11]];
    for (const [sx, sz] of signs) {
      const group = new THREE.Group();
      // Post
      const postGeo = new THREE.BoxGeometry(0.08, 1.2, 0.08);
      const postMat = new THREE.MeshStandardMaterial({ color: '#505058', roughness: 0.4, metalness: 0.5 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.6;
      group.add(post);
      // Screen
      const screenGeo = new THREE.BoxGeometry(0.8, 0.5, 0.06);
      const screenMat = new THREE.MeshStandardMaterial({
        color: '#141420',
        emissive: '#4a9eff',
        emissiveIntensity: 0.3,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.y = 1.4;
      screen.castShadow = true;
      group.add(screen);
      group.position.set(sx + 0.5, 0, sz + 0.5);
      this.scene.add(group);
    }
  }

  // ─── Fountain ──────────────────────────────────────────────────────────────

  buildFountain() {
    const group = new THREE.Group();
    const cx = 14.5 + 0.5;
    const cz = 11 + 0.5;

    // Basin
    const basinGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.5, 16);
    const basinMat = new THREE.MeshStandardMaterial({ color: '#888890', roughness: 0.4 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.y = 0.25;
    basin.castShadow = true;
    basin.receiveShadow = true;
    group.add(basin);

    // Water surface
    const waterGeo = new THREE.CircleGeometry(1.1, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#3288bb',
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.48;
    group.add(water);

    // Center pedestal
    const pedGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
    const pedMat = new THREE.MeshStandardMaterial({ color: '#a0a0a8', roughness: 0.3 });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = 0.7;
    ped.castShadow = true;
    group.add(ped);

    // Water spray particles (simple spheres)
    const sprayMat = new THREE.MeshStandardMaterial({
      color: '#aaddff',
      transparent: true,
      opacity: 0.6,
    });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.1;
      const spray = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 3),
        sprayMat
      );
      spray.position.set(Math.cos(angle) * r, 1.2 + Math.random() * 0.3, Math.sin(angle) * r);
      spray.userData.sprayAngle = angle;
      spray.userData.sprayPhase = Math.random() * Math.PI * 2;
      group.add(spray);
    }

    group.position.set(cx, 0, cz);
    group.userData.isFountain = true;
    this.scene.add(group);

    // Fountain blocks tiles
    this.wallTiles.add('14,11');
    this.wallTiles.add('15,11');
  }
}
