// meadow_props.js: the Sunny Meadow's props, painted in code with the brushes (Perry, AD, 2026-10-31; the Blender route
// of the morning gave smooth balls, and Robin asked for the reference's painted look). Each prop is painted twice: side on
// for the fight kit at full scale, and a touch from above for the board kit at 0.6 (the board's camera is pulled back).
// Every piece is trimmed, given a soft contact shadow at the foot, and written into the kit with origin (centre), foot
// (the base), layer and z. Reads and rewrites kit.json.
//   node tools/meadow_props.js [--kit work/meadow/kit]
const P = require('./paint.js'); const B = require('./brush.js'); const fs = require('fs'); const path = require('path');
const { lin, rad, alpha, lighten, darken, mix, INK } = P;
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const KIT = path.resolve(ROOT, a.includes('--kit') ? a[a.indexOf('--kit') + 1] : 'work/meadow/kit');
const BOARD = 0.6;
// ---- the props: each paints with the foot at (0, 0), facing the camera; v is 'side' or 'board' ----
const PROPS = {
  tree: { layer: 2, size: [560, 560], paint: (g, v) => { B.trunk(g, 0, 0, v === 'side' ? 190 : 120, 46, 11); B.crown(g, 0, v === 'side' ? -330 : -260, 150, v === 'side' ? 108 : 130, 12, B.LEAF, { n: 9, r: 56 }); } },
  tree_round: { layer: 2, size: [520, 520], paint: (g, v) => { B.trunk(g, 0, 0, v === 'side' ? 150 : 95, 40, 13); B.crown(g, 0, v === 'side' ? -300 : -240, 130, v === 'side' ? 118 : 135, 14, B.LEAF_DARK, { n: 8, r: 52 }); } },
  tree_small: { layer: 2, size: [360, 360], paint: (g, v) => { B.trunk(g, 0, 0, v === 'side' ? 110 : 70, 30, 15); B.crown(g, 0, v === 'side' ? -200 : -160, 100, v === 'side' ? 74 : 90, 16, B.LEAF_YELLOW, { n: 6, r: 40 }); } },
  bush: { layer: 3, size: [260, 200], paint: (g, v) => B.crown(g, 0, -48, 92, v === 'side' ? 50 : 58, 21, B.LEAF_DARK, { n: 6, r: 40 }) },
  bush_wide: { layer: 3, size: [360, 180], paint: (g, v) => B.crown(g, 0, -42, 150, v === 'side' ? 44 : 52, 22, B.LEAF, { n: 9, r: 36 }) },
  bush_yellow: { layer: 3, size: [240, 180], paint: (g, v) => B.crown(g, 0, -44, 84, v === 'side' ? 46 : 54, 23, B.LEAF_YELLOW, { n: 5, r: 36 }) },
  house: { layer: 2, size: [460, 460], paint: (g, v) => house(g, v, '#e0503c', 31) },
  house_yellow: { layer: 2, size: [460, 460], paint: (g, v) => house(g, v, '#f0b830', 32, true) },
  signpost: { layer: 3, z: 1, size: [240, 300], paint: (g, v) => { B.rock(g, 0, 0, 36, 24, 41, B.STONE, { shadow: false }); B.pole(g, 0, -4, 230, 24, 42); board(g, -62, -200, 120, 36, 'left', 43); board(g, 40, -145, 100, 32, 'right', 44); } },
  fence: { layer: 3, size: [320, 200], paint: (g, v) => { for (const x of [-120, 120]) B.pole(g, x, 0, 150, 22, 51 + x); for (const y of [-62, -112]) B.pole(g, -140, y + 8, 280, 16, 52 + y, false); } },
  fence_post: { layer: 3, size: [60, 200], paint: (g, v) => B.pole(g, 0, 0, 150, 22, 53) },
  rock: { layer: 3, size: [220, 180], paint: (g, v) => B.rock(g, 0, 0, 82, v === 'side' ? 68 : 76, 61, B.STONE, { moss: true }) },
  rock_small: { layer: 3, size: [120, 100], paint: (g, v) => B.rock(g, 0, 0, 42, 36, 62) },
  rocks: { layer: 3, size: [200, 110], paint: (g, v) => { B.rock(g, -50, 0, 30, 26, 63); B.rock(g, 40, 4, 40, 34, 64); B.rock(g, -5, -10, 22, 18, 65, B.STONE, { shadow: false }); } },
  stump: { layer: 3, size: [180, 150], paint: (g, v) => stump(g, v) },
  haystack: { layer: 2, size: [260, 240], paint: (g, v) => { B.crown(g, 0, -90, 100, 80, 71, B.HAY, { n: 6, r: 48, sparse: true, edge: 1.5 }); g.fillStyle = lin(g, 0, -40, 0, 0, [[0, alpha(B.HAY.deep, 0)], [1, alpha(B.HAY.deep, 0.5)]]); g.beginPath(); g.ellipse(0, -8, 96, 30, 0, 0, 7); g.fill(); } },
  mushrooms: { layer: 4, size: [160, 120], paint: (g, v) => { for (const [x, h, r, s] of [[-34, 62, 34, 81], [26, 44, 26, 82], [4, 30, 18, 83]]) { B.pole(g, x, 0, h, r * 0.55, s, true, { hi: '#fff6e8', light: '#f3e6cf', mid: '#d9c7a4', dark: '#b39f7a', deep: '#8a7756', ink: '#4a3f2c' }); B.dome(g, x, -h + r * 0.35, r, r * 0.6, '#e0623c', s + 9, { spots: 3 }); } } },
  grass_tuft: { layer: 4, size: [120, 90], paint: (g, v) => B.tuft(g, 0, 0, 32, 91, B.LEAF, 11) },
  grass_tuft2: { layer: 4, size: [100, 80], paint: (g, v) => B.tuft(g, 0, 0, 26, 92, B.LEAF_YELLOW, 9) },
  grass_tuft3: { layer: 4, size: [90, 70], paint: (g, v) => B.tuft(g, 0, 0, 22, 93, B.LEAF_DARK, 8) },
  flowers: { layer: 4, size: [160, 120], paint: (g, v) => { B.tuft(g, 10, 0, 22, 101, B.LEAF, 7); B.flower(g, -30, 0, 56, 102, 0); B.flower(g, 20, -4, 48, 103, 0); B.flower(g, 52, 2, 40, 104, 0); } },
  flowers2: { layer: 4, size: [160, 120], paint: (g, v) => { B.tuft(g, -10, 0, 22, 105, B.LEAF_DARK, 7); B.flower(g, -34, 0, 50, 106, 1); B.flower(g, 12, -2, 58, 107, 1); B.flower(g, 46, 2, 44, 108, 2); } },
  flowers3: { layer: 4, size: [120, 100], paint: (g, v) => { B.flower(g, -20, 0, 46, 109, 2); B.flower(g, 22, 0, 40, 110, 2); B.tuft(g, 0, 2, 18, 111, B.LEAF, 6); } },
  well: { layer: 2, size: [260, 300], paint: (g, v) => well(g, v) },
  crate: { layer: 3, size: [120, 120], paint: (g, v) => crate(g, 0, 0, 92, 121) },
  crates: { layer: 3, size: [200, 190], paint: (g, v) => { crate(g, -40, 0, 92, 122); crate(g, 52, 0, 80, 123); crate(g, 0, -92, 84, 124); } },
  barrel: { layer: 3, size: [120, 140], paint: (g, v) => barrel(g, v) },
  lamp: { layer: 3, z: 1, size: [120, 320], paint: (g, v) => lamp(g, v) },
  log: { layer: 3, size: [240, 110], paint: (g, v) => { B.pole(g, -100, 36, 200, 56, 131, false); g.beginPath(); g.ellipse(-100, 8, 15, 28, 0, 0, 7); g.fillStyle = rad(g, -104, 4, -100, 8, 26, [[0, '#f3dcb0'], [0.5, '#d9b47a'], [1, '#a8783c']]); g.fill(); g.lineWidth = 2; g.strokeStyle = alpha(B.WOOD.ink, 0.7); g.stroke(); for (let r = 6; r < 24; r += 6) { g.beginPath(); g.ellipse(-100, 8, r * 0.55, r, 0, 0, 7); g.strokeStyle = alpha(B.WOOD.deep, 0.5); g.lineWidth = 1; g.stroke(); } } },
  bench: { layer: 3, size: [200, 110], paint: (g, v) => { for (const x of [-60, 60]) B.pole(g, x, 0, 52, 16, 141 + x); B.pole(g, -90, -44, 180, 22, 143, false); B.pole(g, -90, -62, 180, 10, 144, false); } },
};
// a mushroom house: a bulging stem with stone patches and a woven band, an arched door, a round window, a spotted cap
function house(g, v, capCol, seed, tall = false) {
  const rr = P.rng(seed), sw = 110, sh = tall ? 230 : 200, capY = -sh - 10, capRx = tall ? 170 : 190, capRy = v === 'side' ? (tall ? 95 : 110) : (tall ? 120 : 135);
  const stem = () => { g.beginPath(); g.moveTo(-sw * 0.85, 0); g.quadraticCurveTo(-sw * 1.15, -sh * 0.5, -sw * 0.8, -sh); g.lineTo(sw * 0.8, -sh); g.quadraticCurveTo(sw * 1.15, -sh * 0.5, sw * 0.85, 0); g.closePath(); };
  stem(); g.fillStyle = lin(g, -sw, 0, sw, 0, [[0, '#fff8ea'], [0.3, '#f6ecd8'], [0.75, '#d9c8a8'], [1, '#b5a383']]); g.fill();
  g.save(); stem(); g.clip();
  for (let i = 0; i < 5; i++) { const px = (rr() - 0.5) * sw * 1.6, py = -sh * (0.25 + rr() * 0.6); B.lump(g, px, py, 14 + rr() * 16, 10 + rr() * 10, seed + i, 7, 0.4); g.fillStyle = lin(g, px, py - 12, px, py + 12, [[0, '#d9c49a'], [1, '#b39a6e']]); g.fill(); g.lineWidth = 1.2; g.strokeStyle = alpha('#6a5a3a', 0.5); g.stroke(); }
  g.fillStyle = lin(g, 0, -30, 0, 0, [[0, '#9ac24a'], [0.5, '#7fa83a'], [1, '#5f8a2a']]); g.fillRect(-sw * 1.2, -30, sw * 2.4, 30); for (let x = -sw; x < sw; x += 14) { g.strokeStyle = alpha('#4a6a1e', 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(x, -30); g.quadraticCurveTo(x + 5, -15, x, 0); g.stroke(); }   // the woven band
  g.fillStyle = lin(g, 0, -sh * 0.2, 0, -30, [[0, alpha('#6a5a3a', 0)], [1, alpha('#6a5a3a', 0.25)]]); g.fillRect(-sw * 1.2, -sh * 0.2, sw * 2.4, sh * 0.2 - 30);
  g.restore();
  // the door: an arch of planks with a bright frame
  const dx = -30, dw = 62, dh = 110; g.beginPath(); g.moveTo(dx - dw / 2, -30); g.lineTo(dx - dw / 2, -30 - dh + dw / 2); g.arc(dx, -30 - dh + dw / 2, dw / 2, Math.PI, 0); g.lineTo(dx + dw / 2, -30); g.closePath(); g.fillStyle = lin(g, dx - dw / 2, 0, dx + dw / 2, 0, [[0, '#a8713a'], [0.5, '#c58a4a'], [1, '#7a4a24']]); g.fill();
  g.save(); g.clip(); for (let x = dx - dw / 2 + 12; x < dx + dw / 2; x += 14) { g.strokeStyle = alpha('#5e3a18', 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(x, -30); g.lineTo(x, -30 - dh); g.stroke(); } g.fillStyle = lin(g, 0, -30 - dh, 0, -30 - dh + 40, [[0, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(dx - dw, -30 - dh, dw * 2, 40); g.restore();
  g.lineWidth = 3; g.strokeStyle = alpha(INK, 0.8); g.stroke(); g.beginPath(); g.arc(dx + 18, -30 - dh * 0.45, 4, 0, 7); g.fillStyle = '#f2c23a'; g.fill();
  // the window: a round pane with a wooden cross
  const wx = 52, wy = -sh * 0.62, wr = 24; g.beginPath(); g.arc(wx, wy, wr, 0, 7); g.fillStyle = rad(g, wx - 8, wy - 8, wx, wy, wr, [[0, '#cfe9ff'], [1, '#5f9ad8']]); g.fill(); g.lineWidth = 6; g.strokeStyle = '#a8713a'; g.stroke(); g.lineWidth = 2.5; g.strokeStyle = alpha(INK, 0.8); g.stroke(); g.lineWidth = 4; g.strokeStyle = '#a8713a'; g.beginPath(); g.moveTo(wx - wr, wy); g.lineTo(wx + wr, wy); g.moveTo(wx, wy - wr); g.lineTo(wx, wy + wr); g.stroke();
  stem(); g.lineWidth = 2.5; g.strokeStyle = alpha(INK, 0.75); g.stroke();
  // the cap, with a gill band under its rim
  g.beginPath(); g.ellipse(0, capY + 14, capRx * 0.98, 26, 0, 0, 7); g.fillStyle = lin(g, 0, capY, 0, capY + 40, [[0, '#8a6a4a'], [1, '#4a3424']]); g.fill(); g.lineWidth = 2; g.strokeStyle = alpha(INK, 0.7); g.stroke();
  B.dome(g, 0, capY, capRx, capRy, capCol, seed + 20, { spots: 7, spotCol: tall ? '#fff0b8' : '#fff3dc' });
}
// a wooden arrow board for the signpost
function board(g, x, y, w, h, dir, seed) {
  const rr = P.rng(seed); const path = () => { g.beginPath(); if (dir === 'left') { g.moveTo(x - w / 2, y); g.lineTo(x - w / 2 + 18, y - h / 2); g.lineTo(x + w / 2, y - h / 2); g.lineTo(x + w / 2, y + h / 2); g.lineTo(x - w / 2 + 18, y + h / 2); } else { g.moveTo(x + w / 2, y); g.lineTo(x + w / 2 - 18, y - h / 2); g.lineTo(x - w / 2, y - h / 2); g.lineTo(x - w / 2, y + h / 2); g.lineTo(x + w / 2 - 18, y + h / 2); } g.closePath(); };
  path(); g.fillStyle = lin(g, 0, y - h / 2, 0, y + h / 2, [[0, B.WOOD.hi], [0.3, B.WOOD.light], [1, B.WOOD.dark]]); g.fill();
  g.save(); path(); g.clip(); for (let i = 0; i < 6; i++) { g.strokeStyle = alpha(B.WOOD.deep, 0.4); g.lineWidth = 1; g.beginPath(); g.moveTo(x - w / 2, y - h / 2 + rr() * h); g.lineTo(x + w / 2, y - h / 2 + rr() * h); g.stroke(); } g.restore();
  path(); g.lineWidth = 2.5; g.strokeStyle = alpha(B.WOOD.ink, 0.8); g.stroke();
  for (const nx of [-0.3, 0.3]) { g.beginPath(); g.arc(x + nx * w * 0.5, y, 2.5, 0, 7); g.fillStyle = '#5a4a3a'; g.fill(); }
}
function stump(g, v) {
  const w = 110, h = 80, ry = v === 'side' ? 16 : 24;
  g.beginPath(); g.moveTo(-w / 2, -h); g.lineTo(-w / 2 - 8, 0); g.lineTo(w / 2 + 8, 0); g.lineTo(w / 2, -h); g.closePath(); g.fillStyle = lin(g, -w / 2, 0, w / 2, 0, [[0, B.BARK.light], [0.4, B.BARK.mid], [1, B.BARK.deep]]); g.fill();
  g.save(); g.clip(); const rr = P.rng(77); for (let i = 0; i < 16; i++) { const x = -w / 2 + rr() * w; g.strokeStyle = alpha(rr() > 0.5 ? B.BARK.deep : B.BARK.hi, 0.5); g.lineWidth = 1 + rr() * 2; g.beginPath(); g.moveTo(x, -h + rr() * 20); g.lineTo(x + (rr() - 0.5) * 4, -rr() * 20); g.stroke(); } g.restore(); g.lineWidth = 2; g.strokeStyle = alpha(B.BARK.ink, 0.7); g.stroke();
  for (let i = 0; i < 3; i++) { const x = (i - 1) * 42; g.beginPath(); g.ellipse(x, -2, 22, 9, 0, 0, 7); g.fillStyle = lin(g, 0, -10, 0, 6, [[0, B.BARK.light], [1, B.BARK.dark]]); g.fill(); g.lineWidth = 1.5; g.strokeStyle = alpha(B.BARK.ink, 0.6); g.stroke(); }
  g.beginPath(); g.ellipse(0, -h, w / 2, ry, 0, 0, 7); g.fillStyle = rad(g, -10, -h - 4, 0, -h, w / 2, [[0, '#f3dcb0'], [0.6, '#d9b47a'], [1, '#b38a4a']]); g.fill(); g.lineWidth = 2; g.strokeStyle = alpha(B.BARK.ink, 0.7); g.stroke();
  for (let r = 10; r < w / 2 - 6; r += 11) { g.beginPath(); g.ellipse(0, -h, r, r * ry / (w / 2), 0, 0, 7); g.strokeStyle = alpha(B.WOOD.deep, 0.45); g.lineWidth = 1.2; g.stroke(); }
}
function well(g, v) {
  const rx = 74, ry = v === 'side' ? 22 : 30, h = 70; const rr = P.rng(99);
  for (const x of [-56, 56]) B.pole(g, x, -h + 6, 150, 16, 150 + x);
  g.beginPath(); g.moveTo(-96, -h - 130); g.lineTo(0, -h - 185); g.lineTo(96, -h - 130); g.lineTo(96, -h - 118); g.lineTo(0, -h - 172); g.lineTo(-96, -h - 118); g.closePath(); g.fillStyle = lin(g, -96, 0, 96, 0, [[0, B.WOOD.light], [0.5, B.WOOD.mid], [1, B.WOOD.deep]]); g.fill(); g.lineWidth = 2.5; g.strokeStyle = alpha(B.WOOD.ink, 0.8); g.stroke();
  for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(-96 + i * 10, -h - 140 - i * 6); g.lineTo(0, -h - 192 + i * 7); g.lineTo(96 - i * 10, -h - 140 - i * 6); g.strokeStyle = alpha(B.WOOD.deep, 0.5); g.lineWidth = 1.5; g.stroke(); }
  B.pole(g, -56, -h - 92, 112, 9, 160, false);
  g.beginPath(); P.rr(g, -12, -h - 86, 24, 26, 4); g.fillStyle = lin(g, -12, 0, 12, 0, [[0, '#b7b7b7'], [1, '#6a6a6a']]); g.fill(); g.lineWidth = 2; g.strokeStyle = alpha(INK, 0.7); g.stroke(); g.strokeStyle = '#5a4a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -h - 92); g.lineTo(0, -h - 86); g.stroke();   // the bucket
  // the stone ring: a drum of stones
  g.beginPath(); g.moveTo(-rx, -h); g.lineTo(-rx, 0); g.ellipse(0, 0, rx, ry, 0, Math.PI, 0, true); g.lineTo(rx, -h); g.closePath(); g.fillStyle = lin(g, -rx, 0, rx, 0, [[0, B.STONE.light], [0.5, B.STONE.mid], [1, B.STONE.deep]]); g.fill();
  g.save(); g.clip(); for (let i = 0; i < 18; i++) { const x = -rx + rr() * rx * 2, y = -h + rr() * h; B.lump(g, x, y, 14 + rr() * 10, 9 + rr() * 6, 200 + i, 7, 0.35); g.fillStyle = lin(g, 0, y - 10, 0, y + 10, [[0, B.STONE.hi], [1, B.STONE.dark]]); g.fill(); g.lineWidth = 1.2; g.strokeStyle = alpha(B.STONE.ink, 0.5); g.stroke(); } g.restore(); g.lineWidth = 2.5; g.strokeStyle = alpha(INK, 0.75); g.stroke();
  g.beginPath(); g.ellipse(0, -h, rx, ry, 0, 0, 7); g.fillStyle = lin(g, 0, -h - ry, 0, -h + ry, [[0, B.STONE.hi], [1, B.STONE.light]]); g.fill(); g.lineWidth = 2.5; g.strokeStyle = alpha(INK, 0.75); g.stroke();
  g.beginPath(); g.ellipse(0, -h, rx * 0.72, ry * 0.68, 0, 0, 7); g.fillStyle = rad(g, 0, -h - ry * 0.3, 0, -h, rx * 0.7, [[0, '#3a5a7a'], [1, '#101c2a']]); g.fill(); g.lineWidth = 2; g.strokeStyle = alpha(INK, 0.7); g.stroke();
}
function crate(g, x, y, s, seed) {
  const rr = P.rng(seed), path = () => { g.beginPath(); P.rr(g, x - s / 2, y - s, s, s, 4); };
  path(); g.fillStyle = lin(g, x - s / 2, y - s, x + s / 2, y, [[0, B.WOOD.light], [0.5, B.WOOD.mid], [1, B.WOOD.dark]]); g.fill();
  g.save(); path(); g.clip(); for (let i = 1; i < 4; i++) { g.strokeStyle = alpha(B.WOOD.deep, 0.55); g.lineWidth = 2; g.beginPath(); g.moveTo(x - s / 2, y - s + i * s / 4); g.lineTo(x + s / 2, y - s + i * s / 4); g.stroke(); } for (let i = 0; i < 8; i++) { g.strokeStyle = alpha(rr() > 0.5 ? B.WOOD.hi : B.WOOD.deep, 0.35); g.lineWidth = 1; const gy = y - s + rr() * s; g.beginPath(); g.moveTo(x - s / 2 + rr() * s * 0.4, gy); g.lineTo(x + s / 2 - rr() * s * 0.4, gy); g.stroke(); } g.restore();
  g.lineWidth = 5; g.strokeStyle = B.WOOD.dark; g.beginPath(); g.moveTo(x - s / 2 + 6, y - s + 6); g.lineTo(x + s / 2 - 6, y - 6); g.moveTo(x + s / 2 - 6, y - s + 6); g.lineTo(x - s / 2 + 6, y - 6); g.stroke(); g.lineWidth = 3; g.strokeStyle = B.WOOD.light; g.stroke();
  path(); g.lineWidth = 2.5; g.strokeStyle = alpha(B.WOOD.ink, 0.8); g.stroke(); g.beginPath(); P.rr(g, x - s / 2 + 6, y - s + 6, s - 12, s - 12, 3); g.lineWidth = 1.5; g.strokeStyle = alpha(B.WOOD.ink, 0.5); g.stroke();
}
function barrel(g, v) {
  const w = 76, h = 108, ry = v === 'side' ? 10 : 16; const path = () => { g.beginPath(); g.moveTo(-w / 2 + 6, -h); g.quadraticCurveTo(-w / 2 - 10, -h / 2, -w / 2 + 6, 0); g.lineTo(w / 2 - 6, 0); g.quadraticCurveTo(w / 2 + 10, -h / 2, w / 2 - 6, -h); g.closePath(); };
  path(); g.fillStyle = lin(g, -w / 2, 0, w / 2, 0, [[0, B.WOOD.hi], [0.25, B.WOOD.light], [0.6, B.WOOD.mid], [1, B.WOOD.deep]]); g.fill();
  g.save(); path(); g.clip(); for (let i = -2; i <= 2; i++) { g.strokeStyle = alpha(B.WOOD.deep, 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(i * 14, -h); g.quadraticCurveTo(i * 17, -h / 2, i * 14, 0); g.stroke(); }
  for (const y of [-h * 0.22, -h * 0.78]) { g.fillStyle = lin(g, -w / 2, 0, w / 2, 0, [[0, '#8a8a8a'], [0.4, '#5a5a5a'], [1, '#2e2e2e']]); g.fillRect(-w, y - 6, w * 2, 12); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-w, y - 6, w * 2, 3); } g.restore();
  g.beginPath(); g.ellipse(0, -h, w / 2 - 6, ry, 0, 0, 7); g.fillStyle = lin(g, 0, -h - ry, 0, -h + ry, [[0, B.WOOD.hi], [1, B.WOOD.mid]]); g.fill(); g.lineWidth = 2; g.strokeStyle = alpha(B.WOOD.ink, 0.7); g.stroke();
  path(); g.lineWidth = 2.5; g.strokeStyle = alpha(B.WOOD.ink, 0.8); g.stroke();
}
function lamp(g, v) {
  B.rock(g, 0, 0, 30, 22, 171, B.STONE, { shadow: false }); B.pole(g, 0, -6, 250, 18, 172, true, { hi: '#8a8f98', light: '#6a6f78', mid: '#4a4f58', dark: '#2e3238', deep: '#1a1c20', ink: '#0e1012' });
  const y = -262; g.beginPath(); g.moveTo(-26, y); g.lineTo(26, y); g.lineTo(18, y - 54); g.lineTo(-18, y - 54); g.closePath(); g.fillStyle = rad(g, 0, y - 27, 0, y - 27, 34, [[0, '#fff6c0'], [0.6, '#ffd860'], [1, '#e8a020']]); g.fill(); g.lineWidth = 2.5; g.strokeStyle = alpha(INK, 0.8); g.stroke();
  g.beginPath(); g.moveTo(-30, y - 54); g.lineTo(0, y - 72); g.lineTo(30, y - 54); g.closePath(); g.fillStyle = '#3a3e46'; g.fill(); g.stroke();
}
// ---- paint, trim, shadow, write ----
(async () => {
  const kit = JSON.parse(fs.readFileSync(path.join(KIT, 'kit.json'), 'utf8')); kit.fight.objects = []; kit.board.objects = [];
  for (const [name, p] of Object.entries(PROPS)) {
    for (const view of ['side', 'board']) {
      const k = view === 'side' ? 1 : BOARD, [w, h] = p.size, cv = P.createCanvas(Math.round(w * k) + 40, Math.round(h * k) + 40), g = cv.getContext('2d');
      g.translate(cv.width / 2, cv.height - 20); g.scale(k, k); p.paint(g, view);
      const t = P.trim(cv, 2), fx = cv.width / 2 - t.x, fy = cv.height - 20 - t.y;
      const rx = Math.round(t.cv.width * (view === 'board' ? 0.42 : 0.40)), ry = view === 'board' ? Math.round(rx * 0.36) : 6;
      const padL = Math.max(0, rx - fx), padR = Math.max(0, fx + rx - t.cv.width), padB = Math.max(0, fy + ry + 2 - t.cv.height);
      const out = P.createCanvas(t.cv.width + padL + padR, t.cv.height + padB), og = out.getContext('2d'), sx = fx + padL, sy = fy;
      if (p.layer <= 3 && !name.startsWith('grass') && !name.startsWith('flowers')) { og.save(); og.translate(sx, sy); og.scale(1, ry / rx); og.fillStyle = rad(og, 0, 0, 0, 0, rx, [[0, 'rgba(20,30,10,0.32)'], [0.7, 'rgba(20,30,10,0.22)'], [1, 'rgba(20,30,10,0)']]); og.beginPath(); og.arc(0, 0, rx, 0, 7); og.fill(); og.restore(); }
      og.drawImage(t.cv, padL, 0);
      const file = `objects/${view === 'side' ? 'fight' : 'board'}/${name}.png`; P.save(out, path.join(KIT, file));
      (view === 'side' ? kit.fight.objects : kit.board.objects).push({ name, file, w: out.width, h: out.height, origin: [Math.round(out.width / 2), Math.round(out.height / 2)], foot: [Math.round(sx), Math.round(sy)], layer: p.layer, z: p.z || 0, view: view === 'side' ? 'side on' : 'a touch from above, at 0.6' });
    }
  }
  fs.writeFileSync(path.join(KIT, 'kit.json'), JSON.stringify(kit, null, 1));
  console.log('painted', Object.keys(PROPS).length, 'props into', KIT, '(objects/fight, objects/board)');
})();
