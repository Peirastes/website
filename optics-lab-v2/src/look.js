// Product-shot look (from the Rankine Cycler's look.js): procedural surface finish. Purely visual - no physics here.
import * as THREE from "three";

function canvasTexture(size, draw, repeat = [1, 1]) {
  const c = document.createElement("canvas"); c.width = c.height = size; draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
}
const rnd = (() => { let a = 7654321; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();

const brushed = () => canvasTexture(512, (g, S) => {
  g.fillStyle = "#8a8a8a"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { const y = rnd() * S, v = 110 + rnd() * 60; g.strokeStyle = `rgba(${v},${v},${v},${0.25 + rnd() * 0.35})`; g.lineWidth = 0.5 + rnd(); g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (rnd() - 0.5) * 2); g.stroke(); }
});
const grain = () => canvasTexture(512, (g, S) => {          // dark worktop: fine fleck
  g.fillStyle = "#808080"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 12000; i++) { const v = 100 + rnd() * 60; g.fillStyle = `rgba(${v},${v},${v},.30)`; const r = rnd() * 2.2; g.fillRect(rnd() * S, rnd() * S, r, r); }
}, [4, 2]);
const concrete = () => canvasTexture(512, (g, S) => {
  g.fillStyle = "#7d7d7d"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) { const v = 90 + rnd() * 80; g.fillStyle = `rgba(${v},${v},${v},.35)`; const r = rnd() * 3; g.fillRect(rnd() * S, rnd() * S, r, r); }
}, [10, 10]);

export function applyFinish(M) {
  const br = brushed(), gr = grain(), co = concrete();
  const metal = (m, rough, bump = 0.0008) => { m.roughness = rough; m.roughnessMap = br; m.bumpMap = br; m.bumpScale = bump; m.needsUpdate = true; };
  metal(M.alu, 0.55); metal(M.steel, 0.5); metal(M.brass, 0.32, 0.0004); metal(M.anod, 0.5, 0.0004);
  M.table.roughnessMap = gr; M.table.bumpMap = gr; M.table.bumpScale = 0.0006; M.table.needsUpdate = true;
  M.floor.roughnessMap = co; M.floor.bumpMap = co; M.floor.bumpScale = 0.002; M.floor.needsUpdate = true;
}

// (The softboxes and the studio backdrop that lived here became the station rig in main.js and the room in room.js, R1.)
