import * as THREE from 'three';
import { VoxelCharacterBuilder, VoxelCharacterAnimator } from '../world/VoxelCharacter.js';
import { CHARACTER_CONFIGS } from '../data/characterConfigs.js';
import { AGENT_TYPES } from '../data/agentDefinitions.js';

export class AgentNPC {
  constructor(scene, x, z, agentTypeId) {
    this.scene = scene;
    this.agentTypeId = agentTypeId;
    this.agentType = AGENT_TYPES[agentTypeId];

    // Build articulated 3D voxel character
    const config = CHARACTER_CONFIGS[agentTypeId] || CHARACTER_CONFIGS.PLAYER;
    this.container = VoxelCharacterBuilder.build(config);
    this.container.position.set(x, 0, z);
    this.container.renderOrder = 9;
    this.container.userData.agentTypeId = agentTypeId;

    // Mark all child meshes for raycasting
    this.container.traverse(child => {
      if (child.isMesh) {
        child.userData.agentTypeId = agentTypeId;
        child.castShadow = true;
      }
    });

    scene.add(this.container);

    // Animator for walk cycle
    this.animator = new VoxelCharacterAnimator(this.container);
    if (config.walkAnimSpeed) this.animator.walkSpeed = config.walkAnimSpeed;

    // Name label (canvas sprite above head)
    this.nameSprite = this._createNameLabel();
    scene.add(this.nameSprite);

    // Movement state
    this.direction = 0;
    this.orbitAngle = 0;

    // Wander AI
    this.mood = 'idle';
    this.wanderTimer = 0;
    this.wanderInterval = 2 + Math.random() * 3;
    this.isWandering = false;
    this.wanderDirection = null;
    this.wanderDuration = 0;
    this.wanderElapsed = 0;
    this.wanderVx = 0;
    this.wanderVz = 0;

    this.speechBubble = null;
    this.speechTimer = 0;
    this.isPerformingAction = false;
  }

  _createNameLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.agentType.shortName, 64, 16);
    ctx.fillStyle = this.agentType.color;
    ctx.fillText(this.agentType.shortName, 64, 16);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1, 0.25, 1);
    sprite.renderOrder = 20;
    return sprite;
  }

  _createSpeechBubble(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.roundRect(0, 0, 256, 48, 6);
    ctx.fill();
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const display = text.length > 30 ? text.slice(0, 28) + '...' : text;
    ctx.fillText(display, 128, 24);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2, 0.4, 1);
    sprite.renderOrder = 21;
    return sprite;
  }

  update(delta, camera, collisionCheck, orbitAngle) {
    if (orbitAngle !== undefined) this.orbitAngle = orbitAngle;

    // Update name label position (1.5 units = character height, + 0.4 gap)
    this.nameSprite.position.set(
      this.container.position.x,
      1.9,
      this.container.position.z
    );

    // Update speech bubble
    if (this.speechBubble) {
      this.speechBubble.position.set(
        this.container.position.x,
        2.2,
        this.container.position.z
      );
      this.speechTimer -= delta;
      if (this.speechTimer <= 0) {
        this.scene.remove(this.speechBubble);
        this.speechBubble = null;
      }
    }

    let isMoving = false;

    if (this.isPerformingAction && !this.isWandering) {
      // Idle during action — animator handles smooth return to rest
      this.animator.update(delta, false, this.direction, this.orbitAngle);
      return;
    }

    // Wander AI
    if (this.isWandering) {
      this.wanderElapsed += delta;
      if (this.wanderElapsed >= this.wanderDuration) {
        this.isWandering = false;
        this.wanderVx = 0;
        this.wanderVz = 0;
        this.direction = 0;
        this.wanderTimer = 0;
        this.wanderInterval = 2 + Math.random() * 3;
      } else {
        // Move
        const nx = this.container.position.x + this.wanderVx * delta;
        const nz = this.container.position.z + this.wanderVz * delta;
        if (!collisionCheck || !collisionCheck(nx, nz)) {
          this.container.position.x = nx;
          this.container.position.z = nz;
        } else {
          this.isWandering = false;
          this.wanderVx = 0;
          this.wanderVz = 0;
        }
        this.container.position.x = Math.max(0.5, Math.min(29.5, this.container.position.x));
        this.container.position.z = Math.max(0.5, Math.min(23.5, this.container.position.z));
        isMoving = true;
      }
    } else {
      this.wanderTimer += delta;
      if (this.wanderTimer >= this.wanderInterval) {
        this.startWander();
      }
    }

    // Animate articulated character
    this.animator.update(delta, isMoving, this.direction, this.orbitAngle);
  }

  startWander() {
    const dirs = [
      { dir: 1, vx: -1, vz: 0 },
      { dir: 2, vx: 1, vz: 0 },
      { dir: 3, vx: 0, vz: -1 },
      { dir: 0, vx: 0, vz: 1 },
    ];
    const pick = dirs[Math.floor(Math.random() * dirs.length)];
    const speed = 1.25;
    this.direction = pick.dir;
    this.wanderVx = pick.vx * speed;
    this.wanderVz = pick.vz * speed;
    this.wanderDuration = 0.4 + Math.random() * 0.6;
    this.wanderElapsed = 0;
    this.isWandering = true;
  }

  performInteriorAction(targetX, targetZ, callback) {
    this.isPerformingAction = true;
    this.isWandering = false;
    this.wanderVx = 0;
    this.wanderVz = 0;

    const dx = targetX - this.container.position.x;
    const dz = targetZ - this.container.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const speed = 1.25;
    const duration = dist > 0 ? dist / speed : 0.1;

    if (Math.abs(dx) > Math.abs(dz)) {
      this.direction = dx > 0 ? 2 : 1;
    } else {
      this.direction = dz > 0 ? 0 : 3;
    }

    const vx = dist > 0 ? (dx / dist) * speed : 0;
    const vz = dist > 0 ? (dz / dist) * speed : 0;
    this.wanderVx = vx;
    this.wanderVz = vz;
    this.isWandering = true;
    this.wanderDuration = duration;
    this.wanderElapsed = 0;

    setTimeout(() => {
      this.isWandering = false;
      this.wanderVx = 0;
      this.wanderVz = 0;

      setTimeout(() => {
        callback();
        this.isPerformingAction = false;
        this.wanderTimer = 0;
        this.wanderInterval = 2 + Math.random() * 3;
      }, 500);
    }, Math.max(duration * 1000, 100));
  }

  showSpeechBubble(text, duration = 3) {
    if (this.speechBubble) this.scene.remove(this.speechBubble);
    this.speechBubble = this._createSpeechBubble(text);
    this.speechBubble.position.set(
      this.container.position.x,
      2.2,
      this.container.position.z
    );
    this.scene.add(this.speechBubble);
    this.speechTimer = duration;
  }

  get x() { return this.container.position.x; }
  get z() { return this.container.position.z; }
}
