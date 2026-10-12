// The lab-PC benchmark (R3): open the lab with ?bench=1 on the machine to test. It runs a fixed tour by itself (the room
// view, each station's overview, a turn of the Snell table, every flight room -> station -> room), in Balanced and then
// Low, and shows a table of frame rates with the GPU and screen it ran on. "Copy results" puts the table on the
// clipboard (and it is selectable text too) so it can be pasted back. Nothing is sent anywhere.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runBench(B) {
  const box = document.createElement("div"); box.className = "gl-overlay show"; box.style.cursor = "default"; box.style.background = "rgba(6,8,12,.55)";
  box.innerHTML = '<div class="gl-box" style="max-width:560px;text-align:left"><div class="ip-label">Lab-PC benchmark</div><p id="bxMsg">Starting…</p>' +
    '<pre id="bxOut" style="white-space:pre-wrap;font:11px/1.45 \'Share Tech Mono\',monospace;color:#cfe7ff;max-height:52vh;overflow:auto;user-select:text;margin:8px 0"></pre>' +
    '<div style="display:flex;gap:8px"><button class="es-btn" id="bxCopy" style="width:auto;padding:6px 12px" disabled>Copy results</button>' +
    '<button class="es-btn" id="bxClose" style="width:auto;padding:6px 12px">Close</button></div></div>';
  document.body.appendChild(box);
  const msg = (t) => { box.querySelector("#bxMsg").textContent = t; }, out = box.querySelector("#bxOut");
  box.querySelector("#bxClose").onclick = () => box.remove();
  // frame times from requestAnimationFrame
  const ft = []; let last = 0, on = true; const tick = (t) => { if (last) ft.push(t - last); last = t; if (on) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  const stats = (f) => { const s = [...f].sort((a, b) => a - b), mean = s.reduce((a, b) => a + b, 0) / s.length;
    return { fps: 1000 / mean, p95: s[Math.floor(s.length * 0.95)] || 0, worst: s[s.length - 1] || 0, n: s.length }; };
  const hold = async (ms) => { await wait(400); ft.length = 0; await wait(ms); return stats(ft.slice(1)); };
  const flight = async () => { ft.length = 0; await wait(50); while (B.flying()) await wait(50); return stats(ft.slice(1)); };
  const g = B.renderer.getContext(), ext = g.getExtension("WEBGL_debug_renderer_info");
  const gpu = ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
  const head = [`GPU: ${gpu}`, `screen ${innerWidth}x${innerHeight} css px, devicePixelRatio ${devicePixelRatio}`, `first frame ${B.perf().firstFrame?.toFixed(0)} ms · ${navigator.userAgent.match(/(Edg|Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || ""}`, ""];
  const rows = [], fpsOf = []; const line = (mode, what, s) => fpsOf.push(s.fps) && rows.push(`${mode.padEnd(9)}${what.padEnd(26)}${s.fps.toFixed(0).padStart(5)} fps  p95 ${s.p95.toFixed(1).padStart(5)} ms  worst ${s.worst.toFixed(1).padStart(6)} ms`);
  const show = () => { out.textContent = [...head, ...rows].join("\n"); };
  for (const mode of ["balanced", "low"]) {
    B.setPerfMode(mode); await wait(500);
    msg(`${mode}: the room view…`); B.enterRoom(true); line(mode, "room view", await hold(3000)); show();
    for (const [st, mod] of [["ray", "snell"], ["lens", "lens"], ["wave", "double"], ["spec", "spec"]]) {
      msg(`${mode}: flying to the ${st} station…`); B.enterRoom(true); await wait(300); B.goStation(st); line(mode, `flight room -> ${st}`, await flight()); show();
      if (B.module() !== mod) B.setModule(mod);
      msg(`${mode}: ${mod} overview…`); line(mode, `${mod} overview`, await hold(3000)); show();
      if (st === "ray") { msg(`${mode}: turning the table…`); const S = B.modules.snell; const id = setInterval(() => S.setPhi(S.S.phi + 0.5), 16);
        line(mode, "snell table turning", await hold(3000)); clearInterval(id); S.setPhi(30); show(); }
      msg(`${mode}: back to the room…`); B.enterRoom(); line(mode, `flight ${st} -> room`, await flight()); show();
    }
  }
  on = false; B.setPerfMode("balanced");
  const slow = fpsOf.filter((f) => f < 55);
  msg(slow.length ? `Done. ${slow.length} case(s) under 55 fps: see the table. Copy it and send it back.` : "Done. Every case at 55 fps or better. Copy the table and send it back.");
  const copy = box.querySelector("#bxCopy"); copy.disabled = false;
  copy.onclick = async () => { try { await navigator.clipboard.writeText(out.textContent); copy.textContent = "Copied"; } catch { const r = document.createRange(); r.selectNodeContents(out); getSelection().removeAllRanges(); getSelection().addRange(r); copy.textContent = "Selected: Ctrl+C"; } };
  return rows;
}
