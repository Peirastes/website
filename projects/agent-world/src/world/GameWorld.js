import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';
import { CampusBuilder } from './CampusBuilder.js';
import { TileLayer } from './TileLayer.js';
import { Player } from '../entities/Player.js';
import { AgentNPC } from '../entities/AgentNPC.js';
import { AgentManager } from '../systems/AgentManager.js';
import { InteriorSystem } from '../systems/InteriorSystem.js';
import { INTERIOR_PALETTES } from '../data/interiorPalettes.js';
import { AGENT_TYPES } from '../data/agentDefinitions.js';
import { UIManager } from '../ui/UIManager.js';

const MAP_W = 30;
const MAP_H = 24;

export class GameWorld {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.events = new EventBus();

    // ─── Camera orbit state ───
    this.orbit = {
      angle: Math.PI * 0.25,   // horizontal rotation
      elevation: 0.75,          // radians above horizon (~43°)
      distance: 18,             // distance from target
      minDist: 8,
      maxDist: 35,
    };
    this._isDragging = false;
    this._lastMouseX = 0;

    // ─── Build campus ───
    this.campusBuilder = new CampusBuilder(scene);
    const { wallTiles, doorTiles, buildings } = this.campusBuilder.build();
    this.wallTiles = wallTiles;
    this.doorTiles = doorTiles;
    this.buildingRefs = buildings;

    // Build compatible buildings array for InteriorSystem
    this.buildings = [
      { id: 'RA', x: 10, y: 1,  w: 10, h: 5 },
      { id: 'CD', x: 1,  y: 5,  w: 6,  h: 5 },
      { id: 'CE', x: 1,  y: 14, w: 6,  h: 5 },
      { id: 'PM', x: 20, y: 2,  w: 8,  h: 5 },
      { id: 'TA', x: 23, y: 9,  w: 6,  h: 5 },
      { id: 'SA', x: 23, y: 16, w: 6,  h: 5 },
    ];
    this.buildingMap = {};
    for (const b of this.buildings) this.buildingMap[b.id] = b;

    // ─── Detail layer (furniture) ───
    this.detailLayer = new TileLayer(scene);

    // ─── Agent Manager ───
    this.agentManager = new AgentManager();

    // ─── Player ───
    this.player = new Player(scene, 14.5, 10.5);

    // ─── Agent NPCs ───
    this.agentNPCs = {};
    for (const bldg of this.buildings) {
      const npcX = bldg.x + Math.floor(bldg.w / 2) + 0.5;
      const npcZ = bldg.y + Math.floor(bldg.h / 2) + 1 + 0.5;
      const npc = new AgentNPC(scene, npcX, npcZ, bldg.id);
      this.agentNPCs[bldg.id] = npc;
    }

    // ─── Interior setup ───
    this.interiorTimer = 0;
    this.interiorCheckIndex = 0;
    this.interiorReady = false;

    // Build default interiors
    for (const bldg of this.buildings) {
      this.drawBuildingInterior(bldg);
    }

    // Capture default interiors, then load saved state
    for (const bldg of this.buildings) {
      const agent = this.agentManager.getAgent(bldg.id);
      this.captureInterior(bldg, agent);
    }
    this.loadSavedState();

    // ─── Nearby agent tracking ───
    this.nearbyAgent = null;
    this.clickedAgent = null;

    // ─── Input ───
    this._bindInput();

    // ─── Raycaster for click-on-agent ───
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();

    // ─── Pathfinder grid ───
    // Simple A* that uses wallTiles/doorTiles sets
    this.pathfinder = {
      isWalkable: (tx, tz) => {
        if (tx < 0 || tz < 0 || tx >= MAP_W || tz >= MAP_H) return false;
        const key = `${tx},${tz}`;
        if (this.doorTiles.has(key)) return true;
        if (this.wallTiles.has(key)) return false;
        return true;
      },
      findPath: (sx, sz, ex, ez) => {
        sx = Math.max(0, Math.min(MAP_W - 1, sx));
        sz = Math.max(0, Math.min(MAP_H - 1, sz));
        ex = Math.max(0, Math.min(MAP_W - 1, ex));
        ez = Math.max(0, Math.min(MAP_H - 1, ez));
        if (!this.pathfinder.isWalkable(ex, ez)) {
          const alt = this._nearestWalkable(ex, ez);
          if (!alt) return null;
          ex = alt.x; ez = alt.z;
        }
        if (!this.pathfinder.isWalkable(sx, sz)) return null;
        if (sx === ex && sz === ez) return [];

        const key = (x, z) => z * MAP_W + x;
        const h = (x, z) => Math.abs(x - ex) + Math.abs(z - ez);
        const open = [{ x: sx, z: sz, g: 0, f: h(sx, sz) }];
        const cameFrom = new Map();
        const gScore = new Map();
        gScore.set(key(sx, sz), 0);
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];

        while (open.length > 0) {
          let bi = 0;
          for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
          const cur = open[bi];
          open.splice(bi, 1);
          if (cur.x === ex && cur.z === ez) {
            const tiles = [];
            let c = { x: cur.x, z: cur.z };
            while (cameFrom.has(key(c.x, c.z))) {
              tiles.push(c);
              c = cameFrom.get(key(c.x, c.z));
            }
            tiles.reverse();
            return tiles.map(t => ({ x: t.x + 0.5, z: t.z + 0.5 }));
          }
          for (const [dx, dz] of dirs) {
            const nx = cur.x + dx, nz = cur.z + dz;
            if (!this.pathfinder.isWalkable(nx, nz)) continue;
            const ng = cur.g + 1;
            const k = key(nx, nz);
            if (gScore.has(k) && ng >= gScore.get(k)) continue;
            gScore.set(k, ng);
            cameFrom.set(k, { x: cur.x, z: cur.z });
            open.push({ x: nx, z: nz, g: ng, f: ng + h(nx, nz) });
          }
        }
        return null;
      }
    };

    // ─── UI Manager ───
    this.uiManager = new UIManager(this);

    // ─── Directives ───
    this.loadAllDirectives();
    if (window.agentWorld) {
      window.agentWorld.onDirectivesChanged(({ agentTypeId, content }) => {
        const oldMood = this.agentManager.getAgent(agentTypeId).mood;
        this.agentManager.updateDirectives(agentTypeId, content);
        const newMood = this.agentManager.getAgent(agentTypeId).mood;
        this.events.emit('directivesUpdated', agentTypeId);
        if (oldMood !== newMood) {
          this.events.emit('agentMoodChanged', { agentTypeId, oldMood, newMood });
        }
      });
    }
  }

  // ─── Input Binding ──────────────────────────────────────────────────────────

  _bindInput() {
    // E to interact, ESC to close
    document.addEventListener('keydown', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.key === 'e' || e.key === 'E') {
        if (this.nearbyAgent) this.events.emit('openDialog', this.nearbyAgent);
      }
      if (e.key === 'Escape') {
        this.events.emit('closeDialog');
      }
      // Q/E for camera rotation (only Q since E is interact)
      if (e.key === 'q' || e.key === 'Q') {
        this.orbit.angle -= 0.15;
      }
    });

    // Right-click: pathfind movement
    const canvas = this.renderer.domElement;
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 2) {
        // Right-click → pathfind
        this._handleRightClick(e);
      } else if (e.button === 0) {
        // Left-click → check for agent
        this._handleLeftClick(e);
      } else if (e.button === 1) {
        // Middle-click → start camera drag
        this._isDragging = true;
        this._lastMouseX = e.clientX;
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (this._isDragging) {
        const dx = e.clientX - this._lastMouseX;
        this.orbit.angle -= dx * 0.005;
        this._lastMouseX = e.clientX;
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      if (e.button === 1) this._isDragging = false;
    });

    // Mouse wheel → zoom
    canvas.addEventListener('wheel', (e) => {
      this.orbit.distance += e.deltaY * 0.01;
      this.orbit.distance = Math.max(this.orbit.minDist, Math.min(this.orbit.maxDist, this.orbit.distance));
    });
  }

  _handleLeftClick(e) {
    // Raycast to find agent meshes (recursive into voxel container children)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);

    const agentContainers = Object.values(this.agentNPCs).map(n => n.container);
    const hits = this.raycaster.intersectObjects(agentContainers, true);
    if (hits.length > 0) {
      const typeId = hits[0].object.userData.agentTypeId;
      if (typeId) this.events.emit('openDialog', typeId);
    }
  }

  _handleRightClick(e) {
    // Convert screen to world ground plane intersection
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(groundPlane, target);

    if (!target) return;

    const tileX = Math.floor(target.x);
    const tileZ = Math.floor(target.z);
    const startX = Math.floor(this.player.x);
    const startZ = Math.floor(this.player.z);

    const path = this.pathfinder.findPath(startX, startZ, tileX, tileZ);
    if (path) {
      // Check if clicked near an agent
      this.clickedAgent = null;
      for (const [typeId, npc] of Object.entries(this.agentNPCs)) {
        const dx = target.x - npc.x;
        const dz = target.z - npc.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
          this.clickedAgent = typeId;
          break;
        }
      }
      this.player.followPath(path);
    }
  }

  _nearestWalkable(tx, tz) {
    for (let r = 1; r <= 5; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          if (this.pathfinder.isWalkable(tx + dx, tz + dz)) {
            return { x: tx + dx, z: tz + dz };
          }
        }
      }
    }
    return null;
  }

  // ─── Collision Check ───────────────────────────────────────────────────────

  _collisionCheck(x, z) {
    const tx = Math.floor(x);
    const tz = Math.floor(z);
    const key = `${tx},${tz}`;
    if (this.doorTiles.has(key)) return false;
    if (this.wallTiles.has(key)) return true;
    if (tx < 0 || tz < 0 || tx >= MAP_W || tz >= MAP_H) return true;
    return false;
  }

  // ─── Interior ──────────────────────────────────────────────────────────────

  drawBuildingInterior(bldg) {
    const { x, y, w, h, id } = bldg;
    const ix = x + 2, iy = y + 2;

    const put = (tile, tx, ty) => {
      if (tx < x + w - 1 && ty < y + h - 1) {
        this.detailLayer.putTileAt(tile, tx, ty);
      }
    };

    // Tile indices from CampusScene
    const T = {
      DESK: 28, SERVER: 29, MONITOR: 30, WHITEBOARD: 48, LABBENCH: 49,
      LOUNGE: 50, CIRCUIT: 56, DRAWTAB: 57, KANBAN: 58, BOOKSHELF: 59,
      NETSWITCH: 60, LECTERN: 61, TOOLWALL: 62, PROJECTOR: 63
    };

    switch (id) {
      case 'CE':
        put(T.LABBENCH, ix, iy);
        put(T.CIRCUIT, ix + 1, iy);
        put(T.TOOLWALL, ix + 2, iy);
        put(T.MONITOR, ix, iy + 1);
        break;
      case 'CD':
        put(T.DRAWTAB, ix, iy);
        put(T.WHITEBOARD, ix + 1, iy);
        put(T.MONITOR, ix + 2, iy);
        put(T.LOUNGE, ix, iy + 1);
        break;
      case 'PM':
        put(T.KANBAN, ix, iy);
        put(T.MONITOR, ix + 1, iy);
        put(T.MONITOR, ix + 2, iy);
        put(T.DESK, ix + 3, iy);
        put(T.KANBAN, ix + 2, iy + 1);
        break;
      case 'RA':
        put(T.BOOKSHELF, ix, iy);
        put(T.BOOKSHELF, ix + 1, iy);
        put(T.MONITOR, ix + 2, iy);
        put(T.BOOKSHELF, ix + 3, iy);
        put(T.BOOKSHELF, ix + 4, iy);
        put(T.DESK, ix + 5, iy);
        put(T.LOUNGE, ix + 2, iy + 1);
        break;
      case 'SA':
        put(T.SERVER, ix, iy);
        put(T.NETSWITCH, ix + 1, iy);
        put(T.SERVER, ix + 2, iy);
        put(T.MONITOR, ix + 1, iy + 1);
        break;
      case 'TA':
        put(T.LECTERN, ix, iy);
        put(T.PROJECTOR, ix + 1, iy);
        put(T.WHITEBOARD, ix + 2, iy);
        put(T.DESK, ix, iy + 1);
        put(T.DESK, ix + 2, iy + 1);
        break;
    }
  }

  captureInterior(building, agent) {
    const cells = InteriorSystem.getInteriorCells(building);
    agent.interior = {};
    for (const cell of cells) {
      const tile = this.detailLayer.getTileAt(cell.tileX, cell.tileY);
      if (tile) {
        agent.interior[`${cell.rx},${cell.ry}`] = tile.index;
      }
    }
  }

  applySavedInterior(building, agent) {
    const cells = InteriorSystem.getInteriorCells(building);
    for (const cell of cells) {
      this.detailLayer.removeTileAt(cell.tileX, cell.tileY);
    }
    for (const [key, tileIndex] of Object.entries(agent.interior)) {
      const [rx, ry] = key.split(',').map(Number);
      this.detailLayer.putTileAt(tileIndex, building.x + rx, building.y + ry);
    }
  }

  async loadSavedState() {
    try {
      if (window.agentWorld) {
        const result = await window.agentWorld.loadGame();
        if (result.success && result.data) {
          this.agentManager.loadState(result.data);
          for (const bldg of this.buildings) {
            const agent = this.agentManager.getAgent(bldg.id);
            if (agent.interior && Object.keys(agent.interior).length > 0) {
              this.applySavedInterior(bldg, agent);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load saved state:', err);
    }
    this.interiorReady = true;
  }

  async loadAllDirectives() {
    if (!window.agentWorld) return;
    try {
      const all = await window.agentWorld.readAllDirectives();
      for (const [typeId, result] of Object.entries(all)) {
        if (result.success) {
          const oldMood = this.agentManager.getAgent(typeId).mood;
          this.agentManager.updateDirectives(typeId, result.content);
          const newMood = this.agentManager.getAgent(typeId).mood;
          if (oldMood !== newMood) {
            this.events.emit('agentMoodChanged', { agentTypeId: typeId, oldMood, newMood });
          }
        }
      }
      this.events.emit('allDirectivesLoaded');
    } catch (err) { console.error('Failed to load directives:', err); }
  }

  checkInteriorModification() {
    if (!this.interiorReady) return;

    const agentIds = Object.keys(this.agentNPCs);
    const typeId = agentIds[this.interiorCheckIndex % agentIds.length];
    this.interiorCheckIndex++;

    const agent = this.agentManager.getAgent(typeId);
    const npc = this.agentNPCs[typeId];
    const building = this.buildingMap[typeId];
    const palette = INTERIOR_PALETTES[typeId];

    if (!agent || !npc || !building || !palette) return;
    if (npc.isPerformingAction) return;

    const action = InteriorSystem.tryModification(agent, building, palette);
    if (!action) return;

    const targetX = action.tileX + 0.5;
    const targetZ = action.tileY + 0.5;

    npc.performInteriorAction(targetX, targetZ, () => {
      if (action.type === 'remove') {
        this.detailLayer.removeTileAt(action.tileX, action.tileY);
        delete agent.interior[`${action.rx},${action.ry}`];
      } else {
        this.detailLayer.putTileAt(action.newTile, action.tileX, action.tileY);
        agent.interior[`${action.rx},${action.ry}`] = action.newTile;
      }

      agent.lastInteriorChange = Date.now();
      npc.showSpeechBubble(action.flavorText);

      this.events.emit('interiorModified', { agentTypeId: typeId, type: action.type, flavorText: action.flavorText });

      if (window.agentWorld) {
        window.agentWorld.saveGame(this.agentManager.getState());
      }
    });
  }

  // ─── Update Loop ───────────────────────────────────────────────────────────

  update(delta) {
    const collCheck = (x, z) => this._collisionCheck(x, z);

    // Player
    this.player.update(delta, this.camera, collCheck, this.orbit.angle);

    // Agents
    for (const npc of Object.values(this.agentNPCs)) {
      npc.update(delta, this.camera, collCheck, this.orbit.angle);
    }

    // Nearby agent detection
    let closest = null, closestDist = Infinity;
    for (const [typeId, npc] of Object.entries(this.agentNPCs)) {
      const dx = this.player.x - npc.x;
      const dz = this.player.z - npc.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.5 && dist < closestDist) {
        closest = typeId;
        closestDist = dist;
      }
    }

    const prompt = document.getElementById('interact-prompt');
    const panel = document.getElementById('dialog-panel');
    const dialogOpen = panel && panel.classList.contains('visible');

    if (closest && !dialogOpen) {
      prompt.textContent = `Press E to talk to ${AGENT_TYPES[closest].shortName}`;
      prompt.classList.add('visible');
      this.nearbyAgent = closest;
    } else {
      prompt.classList.remove('visible');
      if (!closest) this.nearbyAgent = null;
    }

    // Auto-interact after right-click pathfinding to agent
    if (this.clickedAgent && this.player.path) {
      const npc = this.agentNPCs[this.clickedAgent];
      if (npc) {
        const dx = this.player.x - npc.x;
        const dz = this.player.z - npc.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
          this.events.emit('openDialog', this.clickedAgent);
          this.player.cancelPath();
          this.clickedAgent = null;
        }
      }
    }
    if (!this.player.path) this.clickedAgent = null;

    // Interior modification timer (10s)
    this.interiorTimer += delta;
    if (this.interiorTimer >= 10) {
      this.interiorTimer = 0;
      this.checkInteriorModification();
    }

    // Camera follow player (orbit)
    this._updateCamera(delta);

    // Animate fountain spray
    this._animateFountain(delta);
  }

  _updateCamera(delta) {
    // Orbit around player position
    const target = new THREE.Vector3(this.player.x, 0, this.player.z);
    const d = this.orbit.distance;
    const elev = this.orbit.elevation;
    const angle = this.orbit.angle;

    const cx = target.x + d * Math.cos(elev) * Math.sin(angle);
    const cy = d * Math.sin(elev);
    const cz = target.z + d * Math.cos(elev) * Math.cos(angle);

    // Smooth follow
    this.camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
    this.camera.lookAt(target.x, 0.5, target.z);
  }

  _animateFountain(delta) {
    this.scene.traverse(obj => {
      if (obj.userData && obj.userData.isFountain) {
        const time = performance.now() * 0.001;
        obj.children.forEach(child => {
          if (child.userData.sprayAngle !== undefined) {
            const a = child.userData.sprayAngle;
            const ph = child.userData.sprayPhase;
            const r = 0.15 + Math.sin(time * 3 + ph) * 0.05;
            child.position.x = Math.cos(a + time * 0.5) * r;
            child.position.z = Math.sin(a + time * 0.5) * r;
            child.position.y = 1.2 + Math.sin(time * 4 + ph) * 0.15;
          }
        });
      }
    });
  }
}
