// meadow_kit.js: paints the Sunny Meadow's two kits in code (Perry, AD, 2026-10-31): the fight kit's ground pieces on the
// grid and its planes, the board kit's ground plates, road pieces by mask, shore pieces, cliff faces, the gold space plate,
// and the horizon layers; writes every piece with its data into work/meadow/kit/ and the kit's data into kit.json there
// (the Blender props are added by props_finish.js). Files are at 2x (docs/direction.md section 2).
//   node tools/meadow_kit.js [--out work/meadow/kit]
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const OUT = path.resolve(ROOT, a[a.indexOf('--out') + 1] || 'work/meadow/kit');
const PAL = {   // the Sunny Meadow's palette (mine, 2026-10-31; from the library's sunny meadow and grassy fields moods, brightened)
  sky: '#4a9ee8', skyLow: '#c3e8fb', cloud: '#ffffff', cloudShade: '#d6e7f4',
  far: '#a9d1c1', farShade: '#8fbcae', farLight: '#cfe6da',
  mid: '#6fc25c', midShade: '#44953e', midLight: '#a8e37a', trunk: '#8a5f3a',
  lip: '#d6f98c', grass: '#8fd84a', grassLight: '#a9e86a', grassShade: '#5fb04a', grassDeep: '#3f8a2e',
  earth: '#a87c4c', earthMid: '#7d5532', earthDeep: '#55381f', earthLight: '#c89a66',
  sand: '#efdfae', sandShade: '#d9c48a', sea: '#2f86d0', seaDeep: '#1f5fa8', seaLight: '#86cdf0',
  road: '#dcbb74', roadLight: '#ecd394', roadShade: '#b8955a', plank: '#c58a4a', plankDark: '#8a5a2e',
  gold: '#f2c23a', goldLight: '#fff3b0', goldDeep: '#b8860b', cream: '#f8ecc6', ink: '#2b2320',
};
const KINDS = { town: '#e08a3b', battle: '#e8503e', shop: '#ffcc33', event: '#9b5de5', treasure: '#c98a3a', quest: '#4f8fe0', boss: '#3a3a3a', shrine: '#39b8a8' };
const GRID = { w: 276, h: 184 }, TOP = 96, UNDER = 50, SIDE = 60;   // the fight grid and its edge sizes at 2x
const kit = { area: 'meadow', name: 'Sunny Meadow', scale: 2, palette: PAL, kinds: KINDS, grid: GRID, fight: { tiles: {}, background: [], objects: [] }, board: { ground: [], patches: [], road: {}, shore: {}, cliff: {}, space: {}, horizon: [], objects: [] } };
const put = (sub, name, cv, data) => { const file = sub + '/' + name + '.png'; P.save(cv, path.join(OUT, file)); return Object.assign({ name, file, w: cv.width, h: cv.height }, data); };
const wave = (x, W, k, amps) => amps.reduce((s, [n, am, ph]) => s + am * Math.sin(2 * Math.PI * n * x / W + ph), 0) * k;   // periodic in W: seamless

// ---------- the fight kit: ground pieces on the grid ----------
function pebble(g, x, y, rad, k = 1) {
  g.fillStyle = P.alpha(PAL.earthDeep, 0.5); g.beginPath(); g.ellipse(x, y + rad * 0.4, rad * 1.05, rad * 0.7, 0, 0, 7); g.fill();
  g.fillStyle = P.rad(g, x - rad * 0.3, y - rad * 0.45, x, y, rad, [[0, PAL.earthLight], [0.55, PAL.earth], [1, PAL.earthMid]]); g.beginPath(); g.ellipse(x, y, rad, rad * 0.72, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(x, y, rad, rad * 0.72, 0, 0, 7); P.ink(g, 1.4 * k, P.alpha(PAL.earthDeep, 0.7));
}
function earthFill(g, W, H, seed, wrapX, wrapY, margin = 26) {
  // the body's paint: a mid earth, soft mottle (shared near the edges so every variant meets every other), pebbles lit from above
  const r = P.rng(seed), rs = P.rng(777);
  g.fillStyle = PAL.earthMid; g.fillRect(0, 0, W, H);
  P.wrapped(g, wrapX, wrapY, () => { for (let i = 0; i < 44; i++) { const x = rs() * W, y = rs() * H, rad = 16 + rs() * 30; P.dab(g, x, y, rad, i % 2 ? PAL.earth : PAL.earthDeep, 0.30, 0.3); } });
  for (let i = 0; i < 26; i++) { const rad = 10 + r() * 22, x = margin + rad + r() * (W - 2 * (margin + rad)), y = margin + rad + r() * (H - 2 * (margin + rad)); P.dab(g, x, y, rad, i % 2 ? PAL.earth : PAL.earthDeep, 0.28, 0.3); }
  P.wrapped(g, wrapX, wrapY, () => { for (let i = 0; i < 12; i++) { const x = rs() * W, y = rs() * H, rad = 6 + rs() * 8; if (x > margin && x < W - margin && y > margin && y < H - margin) continue; pebble(g, x, y, rad); } });
  for (let i = 0; i < 8; i++) { const rad = 5 + r() * 9, x = margin + r() * (W - 2 * margin), y = margin + r() * (H - 2 * margin); pebble(g, x, y, rad); }
}
function bsc(seed) { const cv = P.createCanvas(GRID.w, GRID.h), g = cv.getContext('2d'); earthFill(g, GRID.w, GRID.h, seed, GRID.w, GRID.h); return cv; }
const topLine = x => 40 + wave(x, GRID.w, 1, [[3, 4, 0], [7, 3, 1.3], [13, 2, 2.1]]);          // the grass band's top, periodic
function grassBand(g, W, top, bottom, seed, tufts = true, wrapX = true) {
  // the grass: a bright lip at the top, the grass below, a cool shade at the bottom; blades along the top, shared near the edges
  const r = P.rng(seed), rs = P.rng(555);
  g.beginPath(); g.moveTo(0, bottom); for (let x = 0; x <= W; x += 3) g.lineTo(x, top(x)); g.lineTo(W, bottom); g.closePath();
  g.fillStyle = P.lin(g, 0, 20, 0, bottom, [[0, PAL.lip], [0.25, PAL.grass], [0.75, PAL.grassShade], [1, PAL.grassDeep]]); g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 30; i++) { const x = r() * W, y = top(x) + 16 + r() * (bottom - top(x) - 20); P.dab(g, x, y, 10 + r() * 14, i % 2 ? PAL.grassLight : PAL.grassDeep, 0.22, 0.3); }
  g.restore();
  const blade = (x, y, h, w, lean, col) => { g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x + lean * 0.3, y - h * 0.5, x + lean, y - h); g.quadraticCurveTo(x + lean * 0.4, y - h * 0.5, x + w / 2, y); g.closePath(); g.fillStyle = col; g.fill(); };
  if (tufts) {
    const draw = (rr, n, edge) => { for (let i = 0; i < n; i++) { const x = rr() * W; if (edge ? (x > 24 && x < W - 24) : (x <= 24 || x >= W - 24)) continue; const y = top(x) + 6, h = 12 + rr() * 20, w = 7 + rr() * 6, lean = (rr() - 0.5) * 14, col = rr() > 0.5 ? PAL.grass : PAL.grassLight; if (y > bottom - 10) continue; P.wrapped(g, wrapX ? W : 0, 0, () => { blade(x, y, h, w, lean, col); }); } };
    if (wrapX) draw(rs, 26, true); draw(r, 34, !wrapX);
  }
  g.beginPath(); for (let x = 0; x <= W; x += 3) x ? g.lineTo(x, top(x) + 1) : g.moveTo(x, top(x) + 1); P.ink(g, 2.2, P.alpha(PAL.grassDeep, 0.55));   // a soft dark edge line, not ink: tiles are painted, not outlined
}
function enH0(seed) { const cv = P.createCanvas(GRID.w, TOP), g = cv.getContext('2d'); grassBand(g, GRID.w, topLine, TOP, seed); g.fillStyle = P.lin(g, 0, TOP - 10, 0, TOP, [[0, P.alpha(PAL.earthDeep, 0)], [1, P.alpha(PAL.earthDeep, 0.45)]]); g.fillRect(0, TOP - 10, GRID.w, 10); return cv; }
function enH1(seed) {
  const cv = P.createCanvas(GRID.w, UNDER), g = cv.getContext('2d'), r = P.rng(seed);
  const bot = x => 30 + wave(x, GRID.w, 1, [[4, 5, 0.5], [9, 4, 2], [17, 2, 1]]);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(GRID.w, 0); for (let x = GRID.w; x >= 0; x -= 3) g.lineTo(x, bot(x)); g.closePath(); g.save(); g.clip();
  g.fillStyle = P.lin(g, 0, 0, 0, UNDER, [[0, PAL.earthMid], [1, PAL.earthDeep]]); g.fillRect(0, 0, GRID.w, UNDER);
  for (let i = 0; i < 16; i++) P.dab(g, r() * GRID.w, 4 + r() * 20, 8 + r() * 12, PAL.earthDeep, 0.3, 0.3);
  for (let i = 0; i < 6; i++) { const x = 20 + r() * (GRID.w - 40); pebble(g, x, 6 + r() * 12, 4 + r() * 5); }
  g.restore(); return cv;
}
function enV(seed, right) {
  const cv = P.createCanvas(SIDE, GRID.h), g = cv.getContext('2d'), r = P.rng(seed);
  const edge = y => 22 + wave(y, GRID.h, 1, [[3, 5, 0.2], [8, 3, 1.7], [15, 2, 0.4]]);   // from the outer side
  g.beginPath(); if (right) { g.moveTo(0, 0); g.lineTo(0, GRID.h); for (let y = GRID.h; y >= 0; y -= 3) g.lineTo(SIDE - edge(y), y); } else { g.moveTo(SIDE, 0); g.lineTo(SIDE, GRID.h); for (let y = GRID.h; y >= 0; y -= 3) g.lineTo(edge(y), y); } g.closePath(); g.save(); g.clip();
  g.fillStyle = P.lin(g, 0, 0, SIDE, 0, right ? [[0, PAL.earthMid], [1, PAL.earthDeep]] : [[0, PAL.earthLight], [0.5, PAL.earth], [1, PAL.earthMid]]); g.fillRect(0, 0, SIDE, GRID.h);
  P.wrapped(g, 0, GRID.h, () => { for (let i = 0; i < 14; i++) P.dab(g, r() * SIDE, r() * GRID.h, 8 + r() * 10, i % 2 ? PAL.earth : PAL.earthDeep, 0.3, 0.3); for (let i = 0; i < 4; i++) pebble(g, 14 + r() * (SIDE - 28), r() * GRID.h, 4 + r() * 5); });
  g.restore(); return cv;
}
function edU(right) {   // the rounded end of the grass top: 100 wide, the band's end curving down to the grid line
  const W = 100, cv = P.createCanvas(W, TOP), g = cv.getContext('2d');
  const top = x => { const xx = right ? W - x : x; const t = Math.max(0, Math.min(1, (xx - 8) / 56)); return 40 + (1 - Math.sin(t * Math.PI / 2)) * (TOP - 40) + wave(xx, 100, 0.5, [[3, 2, 0]]); };
  g.save(); g.beginPath(); g.rect(0, 0, W, TOP); g.clip(); grassBand(g, W, x => Math.min(TOP - 2, top(x)), TOP, right ? 31 : 30, true, false); g.restore();
  return cv;
}
function edD(right) {   // the rounded bottom corner of the body: earth with a curved outer edge
  const W = 100, cv = P.createCanvas(W, UNDER + 20), g = cv.getContext('2d'), r = P.rng(right ? 41 : 40);
  const bot = x => { const xx = right ? W - x : x; const t = Math.max(0, Math.min(1, (xx - 4) / 60)); return Math.sin(t * Math.PI / 2) * 34 + wave(xx, 100, 0.6, [[6, 3, 0.4]]); };
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= 2) g.lineTo(x, bot(x)); g.closePath(); g.save(); g.clip();
  g.fillStyle = P.lin(g, 0, 0, 0, 40, [[0, PAL.earthMid], [1, PAL.earthDeep]]); g.fillRect(0, 0, W, UNDER + 20);
  for (let i = 0; i < 8; i++) P.dab(g, r() * W, r() * 24, 8 + r() * 10, PAL.earthDeep, 0.3, 0.3); g.restore(); return cv;
}
function slope(kind) {   // slRU rises to the right (origin bottom-left at the low end); slLU rises to the left (origin bottom-right)
  const W = GRID.w, H = GRID.h + TOP, cv = P.createCanvas(W, H), g = cv.getContext('2d'), up = kind === 'slRU';
  const base = x => (up ? H - TOP + 40 - x * GRID.h / W : H - TOP + 40 - (W - x) * GRID.h / W);
  const top = x => base(x) + wave(x, W, 1, [[5, 3, 0], [11, 2, 1]]);
  g.beginPath(); g.moveTo(0, H); g.lineTo(W, H); g.lineTo(W, top(W)); for (let x = W; x >= 0; x -= 3) g.lineTo(x, top(x) + 50); g.lineTo(0, top(0) + 50); g.closePath();
  g.fillStyle = PAL.earthMid; g.fill(); g.save(); g.clip(); earthFill(g, W, H, up ? 61 : 62, 0, 0, 10); g.restore();
  g.save(); g.beginPath(); g.moveTo(0, H); g.lineTo(W, H); g.lineTo(W, 0); g.lineTo(0, 0); g.closePath(); g.clip();
  grassBand(g, W, top, H, up ? 63 : 64, true);
  // the band is only 56 deep: cover the earth below the band's bottom with the earth again
  g.restore(); return cv;
}
function slopeUnder(kind) {   // slRD / slLD: the underside along a slope: earth over a ragged diagonal edge
  const W = GRID.w, H = GRID.h + UNDER, cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(kind === 'slRD' ? 71 : 72), up = kind === 'slRD';
  const bot = x => (up ? H - 20 - x * GRID.h / W : H - 20 - (W - x) * GRID.h / W) + wave(x, W, 1, [[6, 4, 0.3], [13, 2, 1.1]]);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= 3) g.lineTo(x, bot(x)); g.closePath(); g.save(); g.clip();
  g.fillStyle = PAL.earthMid; g.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) P.dab(g, r() * W, r() * H, 10 + r() * 20, i % 2 ? PAL.earth : PAL.earthDeep, 0.3, 0.3);
  for (let i = 0; i < 10; i++) pebble(g, 20 + r() * (W - 40), r() * H, 5 + r() * 8); g.restore(); return cv;
}
function fightTiles() {
  const T = kit.fight.tiles; const add = (name, cv, data) => (T[name] = T[name] || []).push(put('tiles', name + ' ' + T[name].length, cv, data));
  for (let i = 0; i < 6; i++) add('bsc', bsc(100 + i), { origin: 'top-left', repeat: 'both' });
  for (let i = 0; i < 3; i++) add('enH0', enH0(200 + i), { origin: 'bottom-left', repeat: 'x', walk: 20 });   // walk: the feet stand this many px below the piece's top band
  for (let i = 0; i < 3; i++) add('enH1', enH1(300 + i), { origin: 'top-left', repeat: 'x' });
  for (let i = 0; i < 2; i++) add('enV0', enV(400 + i, false), { origin: 'top-right', repeat: 'y' });
  for (let i = 0; i < 2; i++) add('enV1', enV(500 + i, true), { origin: 'top-left', repeat: 'y' });
  add('edU', edU(false), { origin: 'bottom-right', side: 'left' }); add('edU', edU(true), { origin: 'bottom-left', side: 'right' });
  add('edD', edD(false), { origin: 'top-right', side: 'left' }); add('edD', edD(true), { origin: 'top-left', side: 'right' });
  add('slRU', slope('slRU'), { origin: 'bottom-left', rise: GRID.h }); add('slLU', slope('slLU'), { origin: 'bottom-right', rise: GRID.h });
  add('slRD', slopeUnder('slRD'), { origin: 'top-left' }); add('slLD', slopeUnder('slLD'), { origin: 'top-right' });
  // the seam check: the body and the top edge tiled 3 by 3
  P.save(P.tile3(bsc(100)), path.join(OUT, '_check', 'bsc-3x3.png')); P.save(P.tile3(enH0(200)), path.join(OUT, '_check', 'enH0-3x3.png'));
}

// ---------- the fight kit: the planes ----------
function cloudPuff(g, x, y, s, soft) {
  const parts = [[0, 0, 1], [-0.9, 0.15, 0.7], [0.95, 0.2, 0.65], [-0.4, -0.35, 0.75], [0.45, -0.4, 0.7], [0.1, 0.3, 0.8]];
  g.fillStyle = soft ? P.alpha(PAL.cloud, 0.85) : PAL.cloud;
  parts.forEach(([dx, dy, k]) => { g.beginPath(); g.ellipse(x + dx * s, y + dy * s * 0.9, s * k, s * k * 0.78, 0, 0, 7); g.fill(); });
  g.fillStyle = P.lin(g, 0, y - s * 0.2, 0, y + s * 0.75, [[0, P.alpha(PAL.cloudShade, 0)], [1, P.alpha(PAL.cloudShade, 0.7)]]);
  parts.forEach(([dx, dy, k]) => { g.beginPath(); g.ellipse(x + dx * s, y + dy * s * 0.9, s * k, s * k * 0.78, 0, 0, 7); g.fill(); });
}
function roundTree(g, x, y, s, soft, r, v = 0, tint = 0) {   // a soft tree for the planes (no ink): a trunk and a cluster of leafy balls, lit from above; v the shape, tint the colour
  g.fillStyle = PAL.trunk; g.fillRect(x - 5 * s, y - 24 * s, 10 * s, 26 * s);
  const balls = [[[0, -40, 22], [-15, -31, 15], [16, -31, 15], [0, -53, 13]], [[0, -46, 18], [-12, -34, 14], [13, -36, 14], [-4, -62, 14], [8, -58, 11]], [[0, -36, 24], [-22, -30, 16], [22, -32, 15], [-10, -50, 12], [12, -48, 12]]][v % 3];
  const cols = [[PAL.midLight, PAL.mid, PAL.midShade], ['#c9ec7a', '#9bd45a', '#5fa548'], ['#8fd66a', '#4fae48', '#2f7f36']][tint % 3];
  balls.forEach(([dx, dy, rr]) => { const cx = x + dx * s, cy = y + dy * s, cr = rr * s; g.fillStyle = P.rad(g, cx - cr * 0.3, cy - cr * 0.45, cx, cy, cr, [[0, cols[0]], [0.5, cols[1]], [1, cols[2]]]); g.beginPath(); g.arc(cx, cy, cr, 0, 7); g.fill(); });
  if (!soft) { g.beginPath(); balls.forEach(([dx, dy, rr]) => { g.moveTo(x + dx * s + rr * s, y + dy * s); g.arc(x + dx * s, y + dy * s, rr * s, 0, 7); }); P.ink(g, 1.4, P.alpha(PAL.midShade, 0.6)); }
}
function planes() {
  const W = 1648, add = (name, cv, data) => kit.fight.background.push(put('background', name, cv, data));
  { const cv = P.createCanvas(64, 1830), g = cv.getContext('2d'); g.fillStyle = P.lin(g, 0, 0, 0, 1830, [[0, PAL.sky], [0.55, '#a9dcf7'], [1, '#e8f6fd']]); g.fillRect(0, 0, 64, 1830); add('sky', cv, { type: 1, factor: 0, y: 0, note: 'repeats sideways; the sky, at infinity' }); }
  { const cv = P.createCanvas(W, 560), g = cv.getContext('2d'), r = P.rng(9); P.wrapped(g, W, 0, () => { for (let i = 0; i < 7; i++) cloudPuff(g, r() * W, 90 + r() * 260, 50 + r() * 60, true); }); add('clouds', cv, { type: 4, factor: 0.05, drift: 6, y: 60, note: 'repeats sideways and drifts slowly to the right (6 px a second at 1x)' }); }
  { const cv = P.createCanvas(W, 520), g = cv.getContext('2d'), r = P.rng(19);
    const ridge2 = x => 230 + wave(x, W, 1, [[2, 40, 0.3], [5, 22, 1.9], [11, 8, 0.7]]), ridge1 = x => 310 + wave(x, W, 1, [[3, 34, 2.1], [7, 16, 0.4], [13, 6, 1.5]]);
    g.beginPath(); g.moveTo(0, 520); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge2(x)); g.lineTo(W, 520); g.closePath(); g.fillStyle = P.lin(g, 0, 180, 0, 520, [[0, PAL.farLight], [1, PAL.far]]); g.fill();
    P.wrapped(g, W, 0, () => { for (let i = 0; i < 90; i++) { const x = r() * W, y = ridge2(x) + 6 + r() * 30, s = 5 + r() * 7; g.fillStyle = P.alpha(PAL.farShade, 0.35); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); } });
    g.beginPath(); g.moveTo(0, 520); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge1(x)); g.lineTo(W, 520); g.closePath(); g.fillStyle = P.lin(g, 0, 280, 0, 520, [[0, P.mix(PAL.far, PAL.mid, 0.25)], [1, P.mix(PAL.farShade, PAL.mid, 0.2)]]); g.fill();
    P.wrapped(g, W, 0, () => { for (let i = 0; i < 70; i++) { const x = r() * W, y = ridge1(x) + 8 + r() * 24, s = 7 + r() * 9; g.fillStyle = P.alpha(P.mix(PAL.farShade, PAL.midShade, 0.4), 0.45); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); } });
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = P.lin(g, 0, 150, 0, 520, [[0, P.alpha(PAL.skyLow, 0.55)], [1, P.alpha(PAL.skyLow, 0.15)]]); g.fillRect(0, 0, W, 520); g.globalCompositeOperation = 'source-over';   // the haze: far planes shifted toward the sky (on the hills only)
    add('hills_far', cv, { type: 1, factor: 0.2, y: 560, note: 'repeats sideways; two pale ridges with soft tree dots, hazed toward the sky' }); }
  { const cv = P.createCanvas(W, 600), g = cv.getContext('2d'), r = P.rng(29);
    g.fillStyle = P.lin(g, 0, 300, 0, 600, [[0, PAL.grass], [1, PAL.grassShade]]); g.fillRect(0, 330, W, 270);   // the calm band where the fighters stand: plain grass, no detail
    const line = x => 330 + wave(x, W, 1, [[4, 10, 0.3], [9, 5, 1.2]]);
    g.beginPath(); g.moveTo(0, 600); for (let x = 0; x <= W; x += 4) g.lineTo(x, line(x)); g.lineTo(W, 600); g.closePath(); g.fillStyle = PAL.grass; g.fill();
    const trees = []; for (let i = 0; i < 14; i++) { const x = (i + 0.5) * W / 14 + (r() - 0.5) * 70, y = line(x) + 14 + r() * 12, s = 2.2 + r() * 1.6; trees.push([x, y, s, i % 3, (i * 2) % 3]); }
    trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, s, v, t]) => P.wrapped(g, W, 0, () => roundTree(g, x, y, s, false, r, v, t)));
    for (let i = 0; i < 22; i++) { const x = r() * W, y = line(x) + 30 + r() * 14, s = 18 + r() * 14; P.wrapped(g, W, 0, () => { g.fillStyle = P.rad(g, x - s * 0.3, y - s * 0.5, x, y, s, [[0, PAL.midLight], [0.5, PAL.mid], [1, PAL.midShade]]); g.beginPath(); g.ellipse(x, y, s, s * 0.7, 0, 0, 7); g.fill(); }); }
    add('treeline', cv, { type: 1, factor: 0.5, y: 700, note: 'repeats sideways; a row of round trees and bushes over plain grass; the bottom 270 px are calm for the fighters' }); }
  { const cv = P.createCanvas(W, 240), g = cv.getContext('2d'), r = P.rng(39);
    g.fillStyle = P.lin(g, 0, 120, 0, 240, [[0, PAL.grassShade], [1, PAL.grassDeep]]); g.fillRect(0, 130, W, 110);
    const blade = (x, y, h, w, lean, col) => { g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x + lean * 0.3, y - h * 0.5, x + lean, y - h); g.quadraticCurveTo(x + lean * 0.4, y - h * 0.5, x + w / 2, y); g.closePath(); g.fillStyle = col; g.fill(); };
    P.wrapped(g, W, 0, () => { for (let i = 0; i < 260; i++) { const x = r() * W, y = 136 + r() * 30, h = 30 + r() * 60, w = 10 + r() * 8, lean = (r() - 0.5) * 30; blade(x, y, h, w, lean, [PAL.grassShade, PAL.grass, PAL.grassDeep][i % 3]); } });
    P.wrapped(g, W, 0, () => { for (let i = 0; i < 40; i++) { const x = r() * W, y = 100 + r() * 60, c = ['#fff6e0', '#ffd74a', '#ff9ab0'][i % 3]; g.fillStyle = c; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.fillStyle = '#e08a3b'; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); } });
    add('meadow_near', cv, { type: 1, factor: 0.8, y: 1130, note: 'repeats sideways; tall grass and flowers just behind the ground band; its bottom hides under the ground' }); }
}

// ---------- the board kit ----------
function grassPlate(seed, flowers, raised) {
  const S = 256, cv = P.createCanvas(S, S), g = cv.getContext('2d'), r = P.rng(seed), rs = P.rng(888);
  g.fillStyle = raised ? P.mix(PAL.grass, PAL.grassLight, 0.55) : PAL.grass; g.fillRect(0, 0, S, S);   // a raised plateau's plates are a touch lighter: the step reads from above
  P.wrapped(g, S, S, () => { for (let i = 0; i < 30; i++) { const x = rs() * S, y = rs() * S, rad = 18 + rs() * 34; P.dab(g, x, y, rad, i % 2 ? PAL.grassLight : PAL.grassShade, 0.28, 0.3); } });
  for (let i = 0; i < 20; i++) { const rad = 12 + r() * 20, x = 30 + rad + r() * (S - 60 - 2 * rad), y = 30 + rad + r() * (S - 60 - 2 * rad); P.dab(g, x, y, rad, i % 2 ? PAL.grassLight : PAL.grassShade, 0.26, 0.3); }
  for (let i = 0; i < 40; i++) { const x = 30 + r() * (S - 60), y = 30 + r() * (S - 60); g.strokeStyle = P.alpha(i % 2 ? PAL.grassLight : PAL.grassDeep, 0.45); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y - 4 - r() * 5); g.stroke(); }
  if (flowers) for (let i = 0; i < 9; i++) { const x = 30 + r() * (S - 60), y = 30 + r() * (S - 60); g.fillStyle = ['#fff6e0', '#ffd74a', '#ff9ab0'][i % 3]; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.fillStyle = '#e08a3b'; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
  return cv;
}
function patch(kind) {
  const W = 240, H = 150, cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(kind.length * 7);
  if (kind === 'flowers') { for (let i = 0; i < 16; i++) { const x = 30 + r() * (W - 60), y = 25 + r() * (H - 50); g.fillStyle = ['#fff6e0', '#ffd74a', '#ff9ab0'][i % 3]; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.fillStyle = '#e08a3b'; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); } return cv; }
  const col = kind === 'light' ? PAL.grassLight : PAL.grassShade; for (let i = 0; i < 14; i++) P.dab(g, W / 2 + (r() - 0.5) * 140, H / 2 + (r() - 0.5) * 80, 30 + r() * 30, col, 0.35, 0.25); return cv;
}
function road(mask) {   // bits: N 1, E 2, S 4, W 8; a tile 256 by 128 on the tilted ground: a road along the depth is 44 wide, across it 24 tall
  const W = 256, H = 128, cv = P.createCanvas(W, H), g = cv.getContext('2d'), cx = 128, cy = 64, wx = 40, wy = 26;
  const arms = []; if (mask & 1) arms.push([cx, 0]); if (mask & 2) arms.push([W, cy]); if (mask & 4) arms.push([cx, H]); if (mask & 8) arms.push([0, cy]);
  const shape = (grow) => { g.beginPath(); arms.forEach(([x, y]) => { const vert = x === cx; const hw = (vert ? wx : wy) / 2 + grow; if (vert) g.rect(cx - hw, Math.min(y, cy), wx + grow * 2, Math.abs(y - cy)); else g.rect(Math.min(x, cx), cy - hw, Math.abs(x - cx), wy + grow * 2); }); g.ellipse(cx, cy, wx / 2 + grow, wy / 2 + grow, 0, 0, 7); };
  g.fillStyle = 'rgba(0,0,0,0.16)'; shape(6); g.fill();                       // a soft dark edge where the road sinks into the grass
  g.fillStyle = '#6e4f2a'; shape(3); g.fill(); g.fillStyle = PAL.roadShade; shape(1); g.fill(); g.fillStyle = PAL.road; shape(-1.5); g.fill();   // a dark brown edge so the road reads on the grass, as the mock-up's did
  g.save(); shape(0); g.clip(); g.fillStyle = PAL.roadLight; shape(-6); g.fill(); const r = P.rng(mask); for (let i = 0; i < 10; i++) { g.fillStyle = P.alpha(PAL.roadShade, 0.5); g.beginPath(); g.ellipse(r() * W, r() * H, 3 + r() * 4, 2 + r() * 2, 0, 0, 7); g.fill(); } g.restore();
  g.fillStyle = PAL.road; shape(-1); // smooth the edge of the light centre
  return cv;
}
function bridge(ns) {
  const W = 256, H = 128, cv = P.createCanvas(W, H), g = cv.getContext('2d');
  if (ns) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(90, 0, 76, H); g.fillStyle = PAL.plank; g.fillRect(96, 0, 64, H); for (let y = 0; y < H; y += 14) { g.fillStyle = P.alpha(PAL.plankDark, 0.5); g.fillRect(96, y, 64, 2); g.fillStyle = P.alpha('#ffffff', 0.12); g.fillRect(96, y + 2, 64, 3); }
    [92, 160].forEach(x => { g.fillStyle = PAL.plankDark; g.fillRect(x, 0, 4, H); for (let y = 8; y < H; y += 32) { g.fillStyle = PAL.plankDark; g.fillRect(x - 2, y - 8, 8, 12); g.fillStyle = PAL.plank; g.fillRect(x - 1, y - 7, 6, 4); } }); }
  else { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 40, W, 50); g.fillStyle = PAL.plank; g.fillRect(0, 44, W, 40); for (let x = 0; x < W; x += 14) { g.fillStyle = P.alpha(PAL.plankDark, 0.5); g.fillRect(x, 44, 2, 40); g.fillStyle = P.alpha('#ffffff', 0.12); g.fillRect(x + 2, 44, 3, 40); }
    [[38, 1], [84, 0]].forEach(([y, back]) => { g.fillStyle = PAL.plankDark; g.fillRect(0, y, W, 4); for (let x = 12; x < W; x += 40) { g.fillStyle = PAL.plankDark; g.fillRect(x - 3, y - 8, 6, 14); g.fillStyle = PAL.plank; g.fillRect(x - 2, y - 7, 4, 5); } }); }
  return cv;
}
function shore(sides) {   // sides: a string of water sides, n e s w, ne nw se sw; the sand band along the water with a wavy grass edge and foam at the water
  const W = 256, H = 128, cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(sides.length + sides.charCodeAt(0));
  const band = 46, bandY = 30;   // the band's depth along x sides and y sides (the y sides are foreshortened)
  const grassEdgeX = (t, n) => band + wave(t, n, 1, [[2, 6, 0.4], [5, 3, 1.3]]), grassEdgeY = (t, n) => bandY + wave(t, n, 1, [[2, 4, 0.9], [5, 2, 0.2]]);
  g.beginPath();
  if (sides.includes('n')) { g.rect(0, 0, W, 0); for (let x = 0; x <= W; x += 4) g.lineTo(x, grassEdgeY(x, W)); g.lineTo(W, 0); g.lineTo(0, 0); g.closePath(); }
  if (sides.includes('s')) { g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, H - grassEdgeY(x, W)); g.lineTo(W, H); g.closePath(); }
  if (sides.includes('w')) { g.moveTo(0, 0); for (let y = 0; y <= H; y += 4) g.lineTo(grassEdgeX(y, H), y); g.lineTo(0, H); g.closePath(); }
  if (sides.includes('e')) { g.moveTo(W, 0); for (let y = 0; y <= H; y += 4) g.lineTo(W - grassEdgeX(y, H), y); g.lineTo(W, H); g.closePath(); }
  g.fillStyle = PAL.sand; g.fill(); g.save(); g.clip();
  for (let i = 0; i < 30; i++) P.dab(g, r() * W, r() * H, 10 + r() * 16, i % 2 ? PAL.sandShade : '#fff8dc', 0.3, 0.3);
  g.fillStyle = PAL.sandShade; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(r() * W, r() * H, 2.5, 1.6, 0, 0, 7); g.fill(); }
  // the wet line and the foam at the water's side
  const foam = (x0, y0, x1, y1, vert) => { g.lineCap = 'round'; g.strokeStyle = P.alpha(PAL.sandShade, 0.8); g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.beginPath(); for (let t = 0; t <= 1; t += 0.02) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, w = Math.sin(t * 40) * 2; vert ? (t ? g.lineTo(x + w, y) : g.moveTo(x + w, y)) : (t ? g.lineTo(x, y + w) : g.moveTo(x, y + w)); } g.stroke(); };
  if (sides.includes('n')) foam(0, 4, W, 4, false); if (sides.includes('s')) foam(0, H - 4, W, H - 4, false); if (sides.includes('w')) foam(4, 0, 4, H, true); if (sides.includes('e')) foam(W - 4, 0, W - 4, H, true);
  g.restore(); return cv;
}
function cliffFront(seed) {   // the face below a plateau's front edge: the lip, a dark line, the face with streaks, a ragged foot and its shadow on the ground
  const W = 256, H = 96, cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(seed), rs = P.rng(999);
  const foot = x => 78 + wave(x, W, 1, [[3, 3, 0.2], [8, 2, 1.4]]);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= 3) g.lineTo(x, foot(x)); g.closePath(); g.save(); g.clip();
  g.fillStyle = P.lin(g, 0, 0, 0, H, [[0, PAL.earthLight], [0.5, PAL.earth], [1, PAL.earthDeep]]); g.fillRect(0, 0, W, H);
  P.wrapped(g, W, 0, () => { for (let i = 0; i < 22; i++) { const x = rs() * W, y = 14 + rs() * 60; P.dab(g, x, y, 10 + rs() * 14, i % 2 ? PAL.earthLight : PAL.earthDeep, 0.25, 0.3); } });
  for (let i = 0; i < 18; i++) { const x = 20 + r() * (W - 40), y0 = 16 + r() * 20, h = 20 + r() * 40; g.strokeStyle = P.alpha(i % 3 ? PAL.earthDeep : PAL.earthLight, 0.45); g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (r() - 0.5) * 6, y0 + h); g.stroke(); }
  g.restore();
  g.fillStyle = P.lin(g, 0, 0, 0, 14, [[0, PAL.lip], [0.6, PAL.grass], [1, PAL.grassShade]]); g.fillRect(0, 0, W, 14);   // the lip: the top edge's bright grass seen over the face
  g.fillStyle = P.alpha(PAL.grassDeep, 0.7); g.fillRect(0, 13, W, 3);
  g.fillStyle = P.lin(g, 0, 76, 0, H, [[0, 'rgba(0,0,0,0.28)'], [1, 'rgba(0,0,0,0)']]); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 3) g.lineTo(x, foot(x) - 2); g.lineTo(W, H); g.closePath(); g.fill();   // the shadow at the foot, on the ground
  return cv;
}
function cliffCorner(right) {   // the front face's end: the lip and the face curving round and up to the side edge
  const W = 96, H = 96, cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(right ? 51 : 50);
  const foot = x => { const xx = right ? W - x : x; return 78 - Math.max(0, 1 - xx / 70) ** 2 * 62 + wave(xx, W, 0.6, [[4, 2, 0]]); };
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= 2) g.lineTo(x, foot(x)); g.closePath(); g.save(); g.clip();
  g.fillStyle = P.lin(g, 0, 0, 0, H, [[0, PAL.earthLight], [0.5, PAL.earth], [1, PAL.earthDeep]]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 10; i++) P.dab(g, r() * W, 14 + r() * 60, 8 + r() * 12, i % 2 ? PAL.earthLight : PAL.earthDeep, 0.25, 0.3);
  g.fillStyle = P.lin(g, 0, 0, 0, 14, [[0, PAL.lip], [0.6, PAL.grass], [1, PAL.grassShade]]); g.fillRect(0, 0, W, 14); g.fillStyle = P.alpha(PAL.grassDeep, 0.7); g.fillRect(0, 13, W, 3);
  g.restore(); return cv;
}
function cliffEdge(side) {   // the thin bright lip along the plateau's north, west and east edges (no face shows there from this camera)
  const vert = side !== 'n', W = vert ? 24 : 256, H = vert ? 128 : 24, cv = P.createCanvas(W, H), g = cv.getContext('2d');
  const stops = [[0, P.alpha(PAL.grassDeep, 0.75)], [0.18, P.alpha(PAL.grassDeep, 0.75)], [0.22, PAL.lip], [0.5, PAL.lip], [1, P.alpha(PAL.lip, 0)]];
  if (!vert) { g.fillStyle = P.lin(g, 0, 0, 0, H, stops); g.fillRect(0, 0, W, H); }
  else { const l = side === 'w'; g.fillStyle = P.lin(g, l ? 0 : W, 0, l ? W : 0, 0, stops); g.fillRect(0, 0, W, H); }
  return cv;
}
function spacePlate() {
  const W = 128, H = 64, cv = P.createCanvas(W, H), g = cv.getContext('2d'), x = 64, y = 30;
  g.beginPath(); g.ellipse(x, y + 4, 52, 25, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fill();
  g.beginPath(); g.ellipse(x, y, 50, 23, 0, 0, 7); g.fillStyle = P.rad(g, x - 12, y - 9, x, y, 50, [[0, PAL.goldLight], [0.55, PAL.gold], [1, PAL.goldDeep]]); g.fill(); P.ink(g, 2.5);
  g.beginPath(); g.ellipse(x, y, 32, 14, 0, 0, 7); g.fillStyle = PAL.cream; g.fill(); P.ink(g, 1.6);
  return cv;
}
function spaceLit() { const W = 160, H = 80, cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.beginPath(); g.ellipse(80, 38, 62, 29, 0, 0, 7); g.lineWidth = 7; g.strokeStyle = 'rgba(255,249,184,0.95)'; g.stroke(); g.beginPath(); g.ellipse(80, 38, 68, 33, 0, 0, 7); g.lineWidth = 10; g.strokeStyle = 'rgba(255,230,120,0.35)'; g.stroke(); return cv; }
function disc(col) { const W = 72, H = 34, cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.beginPath(); g.ellipse(36, 17, 32, 14, 0, 0, 7); g.fillStyle = P.rad(g, 28, 10, 36, 17, 32, [[0, P.lighten(col, 0.45)], [0.5, col], [1, P.darken(col, 0.25)]]); g.fill(); P.ink(g, 1.6); return cv; }
function horizon() {
  const W = 1648, add = (name, cv, data) => kit.board.horizon.push(put('horizon', name, cv, data));
  { const cv = P.createCanvas(64, 400), g = cv.getContext('2d'); g.fillStyle = P.lin(g, 0, 0, 0, 400, [[0, '#3f8fe0'], [1, '#c4e6fb']]); g.fillRect(0, 0, 64, 400); add('sky', cv, { type: 1, factor: 0, factorY: 0, y: 0 }); }
  { const cv = P.createCanvas(W, 240), g = cv.getContext('2d'), r = P.rng(5); P.wrapped(g, W, 0, () => { for (let i = 0; i < 6; i++) cloudPuff(g, r() * W, 70 + r() * 90, 36 + r() * 40, true); }); add('clouds', cv, { type: 4, factor: 0.05, factorY: 0, drift: 5, y: 20 }); }
  { const cv = P.createCanvas(W, 520), g = cv.getContext('2d'), r = P.rng(6); g.fillStyle = P.lin(g, 0, 0, 0, 520, [[0, PAL.seaDeep], [0.5, PAL.sea], [1, PAL.seaLight]]); g.fillRect(0, 0, W, 520);
    g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 300; i++) g.fillRect(r() * W, 20 + r() * 480, 3 + r() * 6, 2); add('sea', cv, { type: 1, factor: 0.3, factorY: 0, y: 360, note: 'the sea band under the sky; pinned to the top of the screen (factorY 0), slides a little sideways' }); }
  for (let k = 0; k < 2; k++) { const cv = P.createCanvas(320, 120), g = cv.getContext('2d'), r = P.rng(7 + k), x = 160, y = 70, w = 120 + k * 30; g.save(); g.globalAlpha = 0.8; g.fillStyle = P.lin(g, 0, y - 14, 0, y + 12, [[0, '#c9ecb0'], [1, '#86bf80']]); g.beginPath(); g.ellipse(x, y, w, 16, 0, 0, 7); g.fill(); g.fillStyle = '#5fa860'; for (let i = 0; i < 4 + k; i++) { g.beginPath(); g.arc(x + (r() - 0.5) * w * 1.2, y - 8 - r() * 8, 7 + r() * 5, 0, 7); g.fill(); } g.restore(); add('island_' + k, cv, { type: 0, factor: 0.2, factorY: 0, y: 330 + k * 30, note: 'an accent placed once, two pictures in turn, spaced 600 to 1200 px apart' }); }
}
function boardKit() {
  for (let i = 0; i < 3; i++) kit.board.ground.push(put('board', 'grass ' + i, grassPlate(600 + i, i === 2), { origin: 'top-left', repeat: 'both', grid: [256, 256] }));
  kit.board.plateau = [0, 1].map(i => put('board', 'plateau ' + i, grassPlate(650 + i, false, true), { origin: 'top-left', repeat: 'both', grid: [256, 256], note: 'the plates of a raised cell' }));
  for (const k of ['light', 'dark', 'flowers']) kit.board.patches.push(put('board', 'patch_' + k, patch(k), { origin: 'centre', note: 'a soft-edged overlay placed freely on the plates' }));
  for (let m = 1; m < 16; m++) { const n = (m & 1 ? 'N' : '') + (m & 2 ? 'E' : '') + (m & 4 ? 'S' : '') + (m & 8 ? 'W' : ''); kit.board.road[n] = put('board', 'road_' + n, road(m), { origin: 'top-left', mask: m, grid: [256, 128] }); }
  kit.board.road.bridge_NS = put('board', 'bridge_NS', bridge(true), { origin: 'top-left', grid: [256, 128] }); kit.board.road.bridge_EW = put('board', 'bridge_EW', bridge(false), { origin: 'top-left', grid: [256, 128] });
  for (const s of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) kit.board.shore[s] = put('board', 'shore_' + s, shore(s), { origin: 'top-left', water: s, grid: [256, 128] });
  kit.board.cliff.front = [0, 1, 2].map(i => put('board', 'cliff_front ' + i, cliffFront(700 + i), { origin: 'top-left', repeat: 'x', note: 'its top at the plateau\'s front edge; 14 px of lip, the face, the foot shadow on the lower ground' }));
  kit.board.cliff.corner_sw = put('board', 'cliff_corner_sw', cliffCorner(false), { origin: 'top-left' }); kit.board.cliff.corner_se = put('board', 'cliff_corner_se', cliffCorner(true), { origin: 'top-left' });
  for (const s of ['n', 'w', 'e']) kit.board.cliff['edge_' + s] = put('board', 'cliff_edge_' + s, cliffEdge(s), { origin: 'top-left', repeat: s === 'n' ? 'x' : 'y' });
  kit.board.space.plate = put('board', 'space', spacePlate(), { origin: [64, 30], note: 'the gold ring; the origin is the plate\'s centre on the ground; a token stands at it' });
  kit.board.space.lit = put('board', 'space_lit', spaceLit(), { origin: [80, 38], note: 'the ring that lights a reachable space; pulse its alpha' });
  kit.board.space.discs = {}; for (const [k, c] of Object.entries(KINDS)) kit.board.space.discs[k] = put('board', 'disc_' + k, disc(c), { origin: [36, 17], kind: k });
  horizon();
  P.save(P.tile3(grassPlate(600, false)), path.join(OUT, '_check', 'grass-3x3.png'));
}
fightTiles(); planes(); boardKit();
fs.writeFileSync(path.join(OUT, 'kit.json'), JSON.stringify(kit, null, 1));
console.log('wrote the meadow kit into', OUT, ': fight tiles', Object.keys(kit.fight.tiles).length, 'kinds; planes', kit.fight.background.length, '; board pieces', Object.keys(kit.board.road).length, 'roads,', Object.keys(kit.board.shore).length, 'shores');
