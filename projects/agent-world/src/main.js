import * as THREE from 'three';
import { GameWorld } from './world/GameWorld.js';

// ─── Renderer ───
const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.insertBefore(renderer.domElement, container.firstChild);

// ─── Scene ───
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a1a2e');
scene.fog = new THREE.FogExp2('#1a1a2e', 0.008);

// ─── Camera ───
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
// Start camera at a sensible orbit position (above and behind player spawn at 14.5, 10.5)
camera.position.set(24, 13, 20);
camera.lookAt(14.5, 0, 10.5);

// ─── Lighting ───
const ambient = new THREE.AmbientLight('#4a4a6a', 0.5);
scene.add(ambient);

const hemi = new THREE.HemisphereLight('#87ceeb', '#1a1a2e', 0.4);
scene.add(hemi);

const sun = new THREE.DirectionalLight('#ffe8c0', 1.2);
sun.position.set(15, 25, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 35;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -5;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.bias = -0.001;
scene.add(sun);
scene.add(sun.target);

// ─── Game World ───
let gameWorld;
try {
  gameWorld = new GameWorld(scene, camera, renderer);
  console.log('GameWorld initialized. Scene children:', scene.children.length);
} catch (e) {
  console.error('GameWorld init failed:', e);
}

// ─── Animation Loop ───
let prevTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - prevTime) / 1000; // seconds
  prevTime = now;
  if (gameWorld) gameWorld.update(Math.min(delta, 0.1)); // clamp to avoid spiral
  renderer.render(scene, camera);
}
animate();

// ─── Resize ───
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose for debugging
window.__AGENT_WORLD_GAME = gameWorld;
