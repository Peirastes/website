import { VoxelCharacterBuilder, VoxelCharacterAnimator } from '../world/VoxelCharacter.js';
import { CHARACTER_CONFIGS } from '../data/characterConfigs.js';

export class Player {
  constructor(scene, x, z) {
    this.scene = scene;

    // Build articulated 3D voxel character
    this.container = VoxelCharacterBuilder.build(CHARACTER_CONFIGS.PLAYER);
    this.container.position.set(x, 0, z);
    this.container.renderOrder = 10;

    // Mark all child meshes for raycasting
    this.container.traverse(child => {
      if (child.isMesh) {
        child.userData.isPlayer = true;
        child.castShadow = true;
      }
    });

    scene.add(this.container);

    // Animator for walk cycle
    this.animator = new VoxelCharacterAnimator(this.container);

    // Movement state
    this.direction = 0; // 0=down, 1=left, 2=right, 3=up
    this.isMoving = false;
    this.orbitAngle = 0;
    this.speed = 4;
    this.vx = 0;
    this.vz = 0;

    // Path-following
    this.path = null;
    this.pathIndex = 0;

    // Input state
    this.keys = { up: false, down: false, left: false, right: false };
    this._bindKeys();
  }

  _bindKeys() {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                  w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right' };
    this._onKeyDown = (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (map[e.key]) this.keys[map[e.key]] = true;
    };
    this._onKeyUp = (e) => {
      if (map[e.key]) this.keys[map[e.key]] = false;
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  followPath(path) {
    if (!path || path.length === 0) { this.cancelPath(); return; }
    this.path = path;
    this.pathIndex = 0;
  }

  cancelPath() {
    this.path = null;
    this.pathIndex = 0;
  }

  update(delta, camera, collisionCheck, orbitAngle, fpYaw) {
    if (orbitAngle !== undefined) this.orbitAngle = orbitAngle;

    const { left, right, up, down } = this.keys;
    const keyboardActive = left || right || up || down;

    if (keyboardActive && this.path) this.cancelPath();

    let vx = 0, vz = 0;

    if (keyboardActive && fpYaw !== null && fpYaw !== undefined) {
      // First-person: WASD relative to camera yaw
      let moveX = 0, moveZ = 0;
      if (up) moveZ += 1;
      if (down) moveZ -= 1;
      if (left) moveX += 1;
      if (right) moveX -= 1;
      if (moveX !== 0 && moveZ !== 0) { moveX *= 0.707; moveZ *= 0.707; }

      // Rotate input by camera yaw
      const sinY = Math.sin(fpYaw);
      const cosY = Math.cos(fpYaw);
      vx = (moveX * cosY + moveZ * sinY) * this.speed;
      vz = (-moveX * sinY + moveZ * cosY) * this.speed;

      // Direction for animation (even though hidden in FP, keeps state consistent)
      if (Math.abs(vx) > Math.abs(vz)) {
        this.direction = vx > 0 ? 2 : 1;
      } else {
        this.direction = vz > 0 ? 0 : 3;
      }
    } else if (keyboardActive) {
      if (left) { vx = -this.speed; this.direction = 1; }
      else if (right) { vx = this.speed; this.direction = 2; }
      if (up) { vz = -this.speed; this.direction = 3; }
      else if (down) { vz = this.speed; this.direction = 0; }
      if (vx !== 0 && vz !== 0) { vx *= 0.707; vz *= 0.707; }
    } else if (this.path && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.container.position.x;
      const dz = target.z - this.container.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.15) {
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) this.path = null;
      } else {
        vx = (dx / dist) * this.speed;
        vz = (dz / dist) * this.speed;
        if (Math.abs(dx) > Math.abs(dz)) {
          this.direction = dx > 0 ? 2 : 1;
        } else {
          this.direction = dz > 0 ? 0 : 3;
        }
      }
    }

    // Apply movement with collision
    if (vx !== 0 || vz !== 0) {
      const nx = this.container.position.x + vx * delta;
      const nz = this.container.position.z + vz * delta;

      if (!collisionCheck || !collisionCheck(nx, this.container.position.z)) {
        this.container.position.x = nx;
      }
      if (!collisionCheck || !collisionCheck(this.container.position.x, nz)) {
        this.container.position.z = nz;
      }

      this.container.position.x = Math.max(0.5, Math.min(29.5, this.container.position.x));
      this.container.position.z = Math.max(0.5, Math.min(23.5, this.container.position.z));
    }

    this.vx = vx;
    this.vz = vz;
    this.isMoving = vx !== 0 || vz !== 0;

    // Animate articulated character
    this.animator.update(delta, this.isMoving, this.direction, this.orbitAngle);
  }

  get x() { return this.container.position.x; }
  get z() { return this.container.position.z; }
  get tileX() { return Math.floor(this.container.position.x); }
  get tileZ() { return Math.floor(this.container.position.z); }
}
