// chest.js: the classic treasure chest (Mitch, AD, 2026-11-02; Robin: "update the chest to a better looking chest", "It should look more like a classic treasure chest").
// Seen at an angle: a square box, a domed barrel lid with its round end showing, iron straps over it, gold trim, a big lock, gold heaped inside.
// A small 3D build, so the lid swings on its real hinge. Same frames, same form as tools/loot.js made: closed, open (10), opened, body, lid. About 160 wide on screen, files at 2x, origin at the bottom.
//   node tools/chest.js && node tools/loot_pop.js  -> out/loot/chest/chest.{png,json}, out/loot/pop.jpg, out/loot/chest_look.jpg
const P = require('./paint.js'); const path = require('path'); const fs = require('fs'); const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), WORK = path.join(ROOT, 'work/loot'), S = 2;
const INK = '#2c1a1c', WOOD = ['#7e4324', '#9a5730', '#b56c3c', '#cc8650'], IRON = ['#34314a', '#4a4662', '#65617e', '#807c98'], GOLD = ['#b07c18', '#dfa52c', '#f6c445', '#ffe690'], INNER = '#4a2a1a', INNER2 = '#5c3620';
const X0 = -72, X1 = 38, Z = 46, RIM = 50, R = 34, STRAPS = [[-58, -42], [-24 + 16, 8], [18, 32]].slice(0, 0).concat([[-56, -40], [14, 30]]);
const pr = (x, z, u) => [x + 0.9 * z, -u - 0.4 * z], near = (x, z, u) => 0.9 * x - z + 0.4 * u;
const path2 = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
const fillP = (g, pts, col, ink) => { path2(g, pts); g.fillStyle = col; g.fill(); g.lineJoin = 'round'; if (ink) { g.lineWidth = ink; g.strokeStyle = INK; g.stroke(); } else { g.lineWidth = 0.7; g.strokeStyle = col; g.stroke(); } };
const area = pts => { let a = 0; pts.forEach(([x, y], i) => { const [p, q] = pts[(i + 1) % pts.length]; a += x * q - p * y; }); return a / 2; };
const hull = ps => { const a = [...ps].sort((p, q) => p[0] - q[0] || p[1] - q[1]), cr = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]), lo = [], up = []; for (const p of a) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of a.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
const rng = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const rivet = (g, [x, y], r = 2) => { g.fillStyle = INK; g.beginPath(); g.arc(x, y + 0.3, r + 0.8, 0, 7); g.fill(); g.fillStyle = GOLD[2]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = GOLD[3]; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.42, 0, 7); g.fill(); };
// ---------------------------------------------------------------- the lid: a half barrel on the hinge along the back of the box
function lid(g, phi, shadow) {
  const N = 26, Zr = Z / 2, at = (t, x) => { const th = Math.PI * t, dz = -Zr - Zr * Math.cos(th) * 1 + 0, du = R * Math.sin(th), z = Z + dz * Math.cos(phi) + du * Math.sin(phi), u = RIM - dz * Math.sin(phi) + du * Math.cos(phi); return [x, z, u]; };
  const faces = [], xs = [X0 - 2, ...STRAPS.flat(), X1 + 2], all = [];
  for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, tm = (t0 + t1) / 2, plank = Math.floor(tm * 5), rim = tm < 0.09 || tm > 0.91; for (let k = 0; k < xs.length - 1; k++) { const xa = xs[k], xb = xs[k + 1], strap = k % 2 === 1, q3 = [at(t0, xa), at(t0, xb), at(t1, xb), at(t1, xa)], q = q3.map(p => pr(...p)); all.push(...q); const fr = area(q) < 0, sh = Math.min(3, Math.max(0, Math.round(0.6 + 2.6 * Math.sin(Math.PI * tm) - (tm > 0.72 ? 0.6 : 0)))); let col; if (!fr) col = plank % 2 ? INNER : INNER2; else if (rim) col = GOLD[Math.min(3, sh + 1)]; else if (strap) col = IRON[sh]; else col = WOOD[Math.max(0, sh - (plank % 2 ? 0 : 1))]; const seam = fr && !rim && !strap && i % Math.round(N / 5) === 0 && i > 2; faces.push({ q, col, fr, key: q3.reduce((a, p) => a + near(...p), 0) / 4, seam, strap, t: tm, xa, xb, rim }); } }
  faces.sort((a, b) => a.key - b.key);
  const capOf = x => { const a = []; for (let i = 0; i <= N; i++) a.push(at(i / N, x)); return a; };
  const capDraw = (x, late) => { const c3 = capOf(x), c = c3.map(p => pr(...p)), fr = (x === X1 + 2 ? area(c) : -area(c)) > 0, key = c3.reduce((a, p) => a + near(...p), 0) / c3.length; return { key, fr, draw: () => { if (fr) { fillP(g, c, WOOD[1], 2.2); g.save(); path2(g, c); g.clip(); const mx = c.reduce((a, p) => a + p[0], 0) / c.length, my = c.reduce((a, p) => a + p[1], 0) / c.length; g.strokeStyle = 'rgba(44,26,28,0.55)'; g.lineWidth = 1.2; for (const k of [-0.34, 0.34]) { g.beginPath(); g.moveTo(mx + k * 60, my - 60); g.lineTo(mx + k * 60, my + 60); g.stroke(); } g.restore(); path2(g, c); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); path2(g, c); g.lineWidth = 3; g.strokeStyle = GOLD[2]; g.stroke(); } else fillP(g, c, INNER, 2); } }; };
  const cL = capDraw(X0 - 2), cR = capDraw(X1 + 2); if (!cL.fr) cL.draw(); if (!cR.fr) cR.draw();
  for (const f of faces) { fillP(g, f.q, f.col); }
  // the lines: planks, the straps' edges and rivets, only on what faces us
  g.lineCap = 'round'; const q = rng(29);
  for (const f of faces) if (f.fr) { g.strokeStyle = INK; if (f.seam) { g.lineWidth = 1.3; g.beginPath(); g.moveTo(...f.q[0]); g.lineTo(...f.q[1]); g.stroke(); } if (f.strap) { g.lineWidth = 1.7; for (const [a, b] of [[0, 3], [1, 2]]) { g.beginPath(); g.moveTo(...f.q[a]); g.lineTo(...f.q[b]); g.stroke(); } } if (f.rim && f.t < 0.5) { /* the rim's gold, its upper edge below */ } if (!f.strap && !f.rim && q() < 0.2) { const u0 = q(), L = 0.12 + q() * 0.2, [a, b] = [f.q[0], f.q[1]], pa = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], pb = [a[0] + (b[0] - a[0]) * Math.min(1, u0 + L), a[1] + (b[1] - a[1]) * Math.min(1, u0 + L)]; g.strokeStyle = 'rgba(70,36,20,0.55)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(pa[0], pa[1] + 2); g.lineTo(pb[0], pb[1] + 2); g.stroke(); } }
  for (const t of [0.09, 0.91]) { const a = pr(...at(t, X0 - 2)), b = pr(...at(t, X1 + 2)), vis = faces.find(f => Math.abs(f.t - (t < 0.5 ? t + 0.02 : t - 0.02)) < 0.03); if (vis && vis.fr) { g.strokeStyle = INK; g.lineWidth = 1.7; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } }
  for (const [a, b] of STRAPS) for (const t of [0.05, 0.3, 0.52]) { const p = at(t, (a + b) / 2), n = at(t + 0.02, (a + b) / 2), n0 = at(t, a), n1 = at(t, b), n2 = at(t + 0.03, a), qq = [n0, n1, at(t + 0.03, b), n2].map(w => pr(...w)); if (area(qq) < 0) rivet(g, pr(...p), 1.8); void n; }
  for (let i = 0; i < 5; i++) { const x = X0 + 8 + i * (X1 - X0 - 16) / 4, p3 = at(0.045, x); if (area([at(0.03, X0), at(0.03, X1), at(0.08, X1), at(0.08, X0)].map(w => pr(...w))) < 0 && (i === 0 || i === 2 || i === 4)) rivet(g, pr(...p3), 1.4); }
  if (cL.fr) cL.draw(); if (cR.fr) cR.draw();
  // the hasp, on the lid's front edge
  const hx = (X0 + X1) / 2, H = [[hx - 10, 0.13], [hx + 10, 0.13], [hx + 10, 0.0], [hx - 10, 0.0]].map(([x, t]) => pr(...at(t, x))); if (area(H) > 0) { const low = pr(...at(0, hx)); fillP(g, [...H, ], GOLD[2], 2); const e = [low[0] - 7, low[1] + 5]; void e; rivet(g, pr(...at(0.07, hx)), 2.2); }
  path2(g, hull(all.concat(capOf(X0 - 2).map(p => pr(...p)), capOf(X1 + 2).map(p => pr(...p))))); g.lineWidth = 2.8; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); void shadow;
}
// ---------------------------------------------------------------- the box
function box(g, open, k) {
  g.fillStyle = 'rgba(28,30,50,0.26)'; g.beginPath(); g.ellipse(4, -6, 92, 15, -0.08, 0, 7); g.fill();
  const F = [[X0, 0, 0], [X1, 0, 0], [X1, 0, RIM], [X0, 0, RIM]], Sd = [[X1, 0, 0], [X1, Z, 0], [X1, Z, RIM], [X1, 0, RIM]], fp = F.map(p => pr(...p)), sp = Sd.map(p => pr(...p));
  // the front: planks
  fillP(g, fp, WOOD[2]); g.save(); path2(g, fp); g.clip(); const q = rng(13); [[0, 17, WOOD[1]], [17, 34, WOOD[2]], [34, RIM, WOOD[2]]].forEach(([a, b, c], i) => { const P4 = [[X0, 0, a], [X1, 0, a], [X1, 0, b], [X0, 0, b]].map(p => pr(...p)); fillP(g, P4, c); g.strokeStyle = 'rgba(70,36,20,0.55)'; g.lineWidth = 1; for (let j = 0; j < 4; j++) { const x = X0 + 6 + q() * (X1 - X0 - 28), L = 8 + q() * 18, y = pr(x, 0, a + 4 + q() * (b - a - 8))[1]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke(); } if (i) { g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X0, -a); g.lineTo(X1, -a); g.stroke(); } }); g.fillStyle = 'rgba(70,36,20,0.28)'; g.fillRect(X0, -7, X1 - X0, 7); g.restore();
  // the side: darker
  fillP(g, sp, WOOD[0]); g.save(); path2(g, sp); g.clip(); g.strokeStyle = 'rgba(44,26,28,0.75)'; g.lineWidth = 1.3; for (const u of [17, 34]) { const a = pr(X1, 0, u), b = pr(X1, Z, u); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } g.restore();
  fillP(g, fp, 'rgba(0,0,0,0)', 2.6); fillP(g, sp, 'rgba(0,0,0,0)', 2.6);
  // the straps over the front
  for (const [a, b] of STRAPS) { const P4 = [[a, 0, 0], [b, 0, 0], [b, 0, RIM], [a, 0, RIM]].map(p => pr(...p)); fillP(g, P4, IRON[1], 1.8); fillP(g, [[a, 0, 0.8], [a + 4, 0, 0.8], [a + 4, 0, RIM - 0.8], [a, 0, RIM - 0.8]].map(p => pr(...p)), IRON[3]); for (const u of [9, 26, 42]) rivet(g, pr((a + b) / 2, 0, u), 1.7); }
  // the gold corners and foot
  const corner = (x, u, sx, su) => { const c = [[x, u], [x + sx * 18, u], [x + sx * 18, u + su * 6], [x + sx * 6, u + su * 6], [x + sx * 6, u + su * 18], [x, u + su * 18]].map(([a, b]) => pr(a, 0, b)); fillP(g, c, GOLD[2], 1.9); rivet(g, pr(x + sx * 3, 0, u + su * 3), 1.4); };
  corner(X0, 0, 1, 1); corner(X1, 0, -1, 1); corner(X0, RIM, 1, -1); corner(X1, RIM, -1, -1);
  { const a = [[0, 0], [Z, 0], [Z, 6], [0, 6]].map(([z, u]) => pr(X1, z, u)); fillP(g, a, GOLD[1], 1.9); const b = [[0, RIM - 6], [Z, RIM - 6], [Z, RIM], [0, RIM]].map(([z, u]) => pr(X1, z, u)); fillP(g, b, GOLD[1], 1.9); }
  // the top of the box, open: a rim, the dark inside, gold heaped and shining
  if (open) { const T = [[X0, 0], [X1, 0], [X1, Z], [X0, Z]].map(([x, z]) => pr(x, z, RIM)), I = [[X0 + 6, 5], [X1 - 6, 5], [X1 - 6, Z - 5], [X0 + 6, Z - 5]].map(([x, z]) => pr(x, z, RIM)); fillP(g, T, GOLD[1], 2.4); fillP(g, I, '#20120f', 1.6); if (k > 0) { g.save(); g.globalAlpha = k; const qq = rng(5), coins = []; for (let i = 0; i < 190; i++) { const x = X0 + 10 + qq() * (X1 - X0 - 20), z = 8 + qq() * (Z - 16), dx = (x - (X0 + X1) / 2) / ((X1 - X0) / 2), dz = (z - Z / 2) / (Z / 2), top = 15 * Math.max(0, 1 - dx * dx * 0.9 - dz * dz * 0.7); coins.push([x, z, RIM + qq() * top * 0.25 + top * 0.75]); } const base = hull(coins.map(p => pr(...p))); fillP(g, base, GOLD[1], 1.7); coins.sort((a, b) => near(...a) - near(...b)); for (const c of coins) { const [x, y] = pr(...c); g.fillStyle = INK; g.beginPath(); g.ellipse(x, y + 0.7, 5.1, 2.9, 0, 0, 7); g.fill(); g.fillStyle = qq() < 0.3 ? GOLD[3] : GOLD[2]; g.beginPath(); g.ellipse(x, y, 4.4, 2.3, 0, 0, 7); g.fill(); } g.restore(); } } else fillP(g, [[X0, 0], [X1, 0], [X1, Z], [X0, Z]].map(([x, z]) => pr(x, z, RIM)), WOOD[0], 2);
  // the lock
  const lx = (X0 + X1) / 2, y0 = -RIM + 1, Lk = [[lx - 14, y0], [lx + 14, y0], [lx + 14, y0 + 23], [lx, y0 + 32], [lx - 14, y0 + 23]]; fillP(g, Lk, GOLD[2], 2.3); fillP(g, [[lx + 2, y0 + 1], [lx + 13, y0 + 1], [lx + 13, y0 + 22.5], [lx + 2, y0 + 29]], GOLD[1]); g.fillStyle = GOLD[3]; g.fillRect(lx - 12, y0 + 2, 10, 2); g.fillStyle = INK; g.beginPath(); g.arc(lx, y0 + 12, 3.6, 0, 7); g.fill(); path2(g, [[lx - 2, y0 + 13], [lx + 2, y0 + 13], [lx + 3, y0 + 23], [lx - 3, y0 + 23]]); g.fill();
}
const DEG = Math.PI / 180;
function chest(g, open, k, part) {
  if (part === 'lid') { lid(g, 0); return; } if (part === 'body') { box(g, true, k); return; }
  if (open <= 0) { box(g, false, 0); lid(g, 0); return; }
  const phi = open * 108 * DEG; if (phi < 42 * DEG) { box(g, true, k); lid(g, phi); } else { lid(g, phi); box(g, true, k); }
}
(async () => {
  const dir = path.join(WORK, 'chest/render'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); const FW = 220, FH = 200, OX = 104, OY = 180;
  const shot = (o, l, part, sc = S) => { const cv = P.createCanvas(FW * sc, FH * sc), g = cv.getContext('2d'); g.scale(sc, sc); g.translate(OX, OY); chest(g, o, l, part); return cv; };
  const meta = { origin: [OX * S, OY * S], size: FW * S, px: 1, actions: { closed: { delay: 100, frames: [] }, open: { delay: 60, frames: [] }, opened: { delay: 100, frames: [] }, body: { delay: 100, frames: [] }, lid: { delay: 100, frames: [] } } };
  const swing = [0, 0.06, 0.2, 0.45, 0.75, 0.98, 1.12, 1.0, 1.0, 1.0], light = [0, 0, 0, 0, 0.15, 0.4, 0.7, 1, 1, 1], delays = [60, 60, 60, 60, 60, 60, 60, 100, 100, 200];
  for (let i = 0; i < 10; i++) { const f = `open_${String(i).padStart(2, '0')}.png`; P.save(shot(swing[i], light[i]), path.join(dir, f)); meta.actions.open.frames.push({ file: f, delay: delays[i] }); }
  for (const [a, o, l, part] of [['closed', 0, 0], ['opened', 1, 1], ['body', 1, 1, 'body'], ['lid', 0, 0, 'lid']]) { const f = `${a}_00.png`; P.save(shot(o, l, part), path.join(dir, f)); meta.actions[a].frames.push({ file: f, delay: 100 }); }
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
  const r = spawnSync('node', [path.join(ROOT, 'tools/pack.js'), 'chest', dir, path.join(WORK, 'out/chest')], { stdio: 'inherit' }); if (r.status) process.exit(r.status);
  // the look: shut and open, large enough to judge, and the old one beside it
  const LW = 1300, LH = 470, cv = P.createCanvas(LW, LH), g = cv.getContext('2d'); g.fillStyle = '#2f2a40'; g.fillRect(0, 0, LW, LH); g.fillStyle = '#4f8536'; g.fillRect(0, 400, LW, 70); g.drawImage(shot(0, 0), 20, 80, 440, 400); g.drawImage(shot(0.45, 0), 440, 80, 440, 400); g.drawImage(shot(1, 1), 860, 80, 440, 400); fs.writeFileSync(path.join(ROOT, 'out/loot/chest_look.jpg'), cv.toBuffer('image/jpeg', 90));
})();
