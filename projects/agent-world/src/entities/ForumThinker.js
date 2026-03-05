import * as THREE from 'three';
import { VoxelCharacterBuilder, VoxelCharacterAnimator } from '../world/VoxelCharacter.js';
import { FORUM_THINKERS, TIER_COLORS } from '../data/forumDefinitions.js';

/**
 * Stationary character entity for a Great Mind in the Forum.
 * Fixed position, faces toward the podium, subtle idle animation.
 */
export class ForumThinker {
  constructor(scene, x, z, thinkerId, config, forumCenter) {
    this.scene = scene;
    this.thinkerId = thinkerId;
    this.thinker = FORUM_THINKERS[thinkerId];

    // Build articulated 3D character (reuses VoxelCharacterBuilder)
    this.container = VoxelCharacterBuilder.build(config);
    this.container.position.set(x, 0, z);
    this.container.renderOrder = 9;
    scene.add(this.container);

    // Face toward forum center (podium)
    if (forumCenter) {
      const dx = forumCenter.x - x;
      const dz = forumCenter.z - z;
      this.container.children[0].rotation.y = Math.atan2(dx, dz);
    }

    // Animator for idle sway
    this.animator = new VoxelCharacterAnimator(this.container);
    this.animator.walkSpeed = 2; // slow idle bob

    // Name label (full name, not shortName)
    this.nameSprite = this._createNameLabel();
    scene.add(this.nameSprite);

    // Era badge below name
    this.eraBadge = this._createEraBadge();
    scene.add(this.eraBadge);

    // Idle sway state
    this.idlePhase = Math.random() * Math.PI * 2;
    this.idleSpeed = 0.8 + Math.random() * 0.4;
  }

  _createNameLabel() {
    const name = this.thinker.name;
    const canvas = document.createElement('canvas');
    const width = Math.max(192, name.length * 11);
    canvas.width = width;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(name, width / 2, 16);
    ctx.fillStyle = this.thinker.color;
    ctx.fillText(name, width / 2, 16);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(width / 64, 0.25, 1);
    sprite.renderOrder = 20;
    return sprite;
  }

  _createEraBadge() {
    const text = `${this.thinker.era} · ${this.thinker.tier}`;
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(text, 96, 12);
    ctx.fillStyle = TIER_COLORS[this.thinker.tier] || '#888888';
    ctx.fillText(text, 96, 12);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 0.2, 1);
    sprite.renderOrder = 20;
    return sprite;
  }

  update(delta) {
    // Billboard labels
    this.nameSprite.position.set(
      this.container.position.x,
      1.9,
      this.container.position.z
    );
    this.eraBadge.position.set(
      this.container.position.x,
      1.68,
      this.container.position.z
    );

    // Subtle idle body bob (sine-based sway, no locomotion)
    this.idlePhase += delta * this.idleSpeed;
    const bobY = Math.sin(this.idlePhase) * 0.005;
    this.container.position.y = bobY;
  }

  get x() { return this.container.position.x; }
  get z() { return this.container.position.z; }
}
