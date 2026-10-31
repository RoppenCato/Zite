// meadow_kit.js: paints the Sunny Meadow's two kits in code (Perry, AD, 2026-10-31; repainted the same day with the brushes
// in brush.js after Robin found the first pass too smooth and flat beside the reference): the fight kit's ground pieces on
// the grid and its planes, the board kit's ground plates, road pieces by mask, shore pieces, cliff faces, the gold space
// plate, and the horizon layers; writes every piece with its data into work/meadow/kit/ and the kit's data into kit.json
// (the props are added by meadow_props.js). Files are at 2x (docs/direction.md section 2).
//   node tools/meadow_kit.js [--out work/meadow/kit]
const P = require('./paint.js'); const B = require('./brush.js'); const fs = require('fs'); const path = require('path');
const { lin, rad, alpha, mix, lighten, darken } = P;
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const OUT = path.resolve(ROOT, a[a.indexOf('--out') + 1] || 'work/meadow/kit');
const PAL = {   // the Sunny Meadow's palette (mine, 2026-10-31; from the library's sunny meadow and grassy fields moods, brightened)
  sky: '#4a9ee8', skyLow: '#c3e8fb', far: '#a9d1c1', farShade: '#8fbcae', farLight: '#cfe6da',
  lip: '#d6f98c', grass: '#8fd84a', grassLight: '#a9e86a', grassShade: '#5fb04a', grassDeep: '#3f8a2e',
  earth: '#a87c4c', earthMid: '#7d5532', earthDeep: '#55381f', earthLight: '#c89a66',
  sand: '#efdfae', sandShade: '#d9c48a', sea: '#2f86d0', seaDeep: '#1f5fa8', seaLight: '#86cdf0',
  road: '#d9b874', roadLight: '#ecd394', roadShade: '#b8955a', plank: '#c58a4a', plankDark: '#8a5a2e',
  gold: '#f2c23a', goldLight: '#fff3b0', goldDeep: '#b8860b', cream: '#f8ecc6', ink: '#2b2320',
};
const KINDS = { town: '#e08a3b', battle: '#e8503e', shop: '#ffcc33', event: '#9b5de5', treasure: '#c98a3a', quest: '#4f8fe0', boss: '#3a3a3a', shrine: '#39b8a8' };
const GRID = { w: 276, h: 184 }, TOP = 96, UNDER = 50, SIDE = 60, SHARED = 777, M = 44;   // the fight grid, its edge sizes at 2x; the shared seed and the margin where every variant matches
const kit = { area: 'meadow', name: 'Sunny Meadow', scale: 2, palette: PAL, kinds: KINDS, grid: GRID, fight: { tiles: {}, background: [], objects: [] }, board: { ground: [], plateau: [], patches: [], road: {}, shore: {}, cliff: {}, space: {}, horizon: [], objects: [] } };
const put = (sub, name, cv, data) => { const file = sub + '/' + name + '.png'; P.save(cv, path.join(OUT, file)); return Object.assign({ name, file, w: cv.width, h: cv.height }, data); };
const wave = (x, W, k, amps) => amps.reduce((s, [n, am, ph]) => s + am * Math.sin(2 * Math.PI * n * x / W + ph), 0) * k;   // periodic in W: seamless
const LIP = { ...B.LEAF, hi: PAL.lip };

// ---------- the fight kit: ground pieces on the grid ----------
// the soil in two passes: a shared pass over the whole piece (so every variant's edges match every other's), then the
// variant's own clods inside the margin
function soil(g, W, H, seed, wrapX, wrapY, stones = 3) {
  B.clods(g, 0, 0, W, H, SHARED, B.SOIL, { wrapX, wrapY, stones: 0 });
  if (W > 2 * M + 40 && H > 2 * M + 40) B.clods(g, M, M, W - 2 * M, H - 2 * M, seed, B.SOIL, { base: false, stones, cell: 190 });
}
function bsc(seed) { const cv = P.createCanvas(GRID.w, GRID.h), g = cv.getContext('2d'); soil(g, GRID.w, GRID.h, seed, GRID.w, GRID.h, 3); return cv; }
// the grass: the shared blades near the edges (wrapped), the variant's own inside
function grassTop(g, W, base, depth, h, seed, dens = 0.55) {
  B.grass(g, -34, 34, base, depth, h, SHARED, LIP, dens, W); B.grass(g, 44, W - 44, base, depth, h, seed, LIP, dens, 0);
}
function enH0(seed) {
  const cv = P.createCanvas(GRID.w, TOP), g = cv.getContext('2d'), r = P.rng(seed);
  g.fillStyle = lin(g, 0, 46, 0, TOP, [[0, B.SOIL.light], [0.3, B.SOIL.mid], [1, B.SOIL.deep]]); g.fillRect(0, 50, GRID.w, TOP - 50);   // the soil under the grass
  B.clods(g, 0, 60, GRID.w, 36, SHARED + 1, B.SOIL, { wrapX: GRID.w, base: false, cell: 150 });
  g.fillStyle = lin(g, 0, 50, 0, 72, [[0, alpha(B.SOIL.deep, 0.7)], [1, alpha(B.SOIL.deep, 0)]]); g.fillRect(0, 50, GRID.w, 22);
  grassTop(g, GRID.w, 50, 18, 46, seed);
  for (let i = 0; i < 2; i++) { const x = 50 + r() * (GRID.w - 100); g.beginPath(); g.arc(x, 56, 4, 0, 7); g.fillStyle = ['#ffd84a', '#ffb3c8', '#fff6e8'][i]; g.fill(); g.beginPath(); g.arc(x, 56, 1.6, 0, 7); g.fillStyle = '#c8701a'; g.fill(); }
  return cv;
}
function enH1(seed) {
  const cv = P.createCanvas(GRID.w, UNDER), g = cv.getContext('2d');
  const bot = x => 30 + wave(x, GRID.w, 1, [[4, 5, 0.5 + seed], [9, 4, 2], [17, 2, 1]]);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(GRID.w, 0); for (let x = GRID.w; x >= 0; x -= 3) g.lineTo(x, bot(x)); g.closePath(); g.save(); g.clip();
  B.clods(g, 0, -20, GRID.w, UNDER + 20, SHARED + 2, { ...B.SOIL, hi: B.SOIL.light, light: B.SOIL.mid, mid: B.SOIL.dark, dark: B.SOIL.deep }, { wrapX: GRID.w, cell: 150 });
  g.restore(); return cv;
}
function enV(seed, right) {
  const cv = P.createCanvas(SIDE, GRID.h), g = cv.getContext('2d');
  const edge = y => 22 + wave(y, GRID.h, 1, [[3, 5, 0.2 + seed], [8, 3, 1.7], [15, 2, 0.4]]);
  g.beginPath(); if (right) { g.moveTo(0, 0); g.lineTo(0, GRID.h); for (let y = GRID.h; y >= 0; y -= 3) g.lineTo(SIDE - edge(y), y); } else { g.moveTo(SIDE, 0); g.lineTo(SIDE, GRID.h); for (let y = GRID.h; y >= 0; y -= 3) g.lineTo(edge(y), y); } g.closePath(); g.save(); g.clip();
  B.clods(g, -20, 0, SIDE + 40, GRID.h, SHARED + 3, right ? { ...B.SOIL, hi: B.SOIL.light, light: B.SOIL.mid } : B.SOIL, { wrapY: GRID.h, cell: 150 });
  g.restore(); return cv;
}
function edU(right) {   // the rounded end of the grass top: a mound of soil under grass, curving down to the grid line
  const W = 100, cv = P.createCanvas(W, TOP), g = cv.getContext('2d');
  const top = x => { const xx = right ? W - x : x; const t = Math.max(0, Math.min(1, (xx - 8) / 56)); return 50 + (1 - Math.sin(t * Math.PI / 2)) * (TOP - 50); };
  g.beginPath(); g.moveTo(0, TOP); for (let x = 0; x <= W; x += 2) g.lineTo(x, top(x)); g.lineTo(W, TOP); g.closePath(); g.save(); g.clip();
  B.clods(g, 0, 40, W, TOP - 40, 31, B.SOIL, { cell: 150 }); g.restore();
  g.save(); g.beginPath(); g.rect(0, 0, W, TOP); g.clip(); B.grass(g, right ? 0 : 10, right ? W - 10 : W, x => top(x), 14, 40, right ? 33 : 32, LIP, 0.6, 0); g.restore();
  return cv;
}
function edD(right) {
  const W = 100, cv = P.createCanvas(W, UNDER + 20), g = cv.getContext('2d');
  const bot = x => { const xx = right ? W - x : x; const t = Math.max(0, Math.min(1, (xx - 4) / 60)); return Math.sin(t * Math.PI / 2) * 34 + wave(xx, 100, 0.6, [[6, 3, 0.4]]); };
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= 2) g.lineTo(x, bot(x)); g.closePath(); g.save(); g.clip();
  B.clods(g, -10, -20, W + 20, UNDER + 40, right ? 35 : 34, { ...B.SOIL, hi: B.SOIL.light, light: B.SOIL.mid, mid: B.SOIL.dark, dark: B.SOIL.deep }, { cell: 150 }); g.restore(); return cv;
}
function slope(kind) {   // slRU rises to the right (origin bottom-left at the low end); slLU rises to the left (origin bottom-right)
  const W = GRID.w, H = GRID.h + TOP, cv = P.createCanvas(W, H), g = cv.getContext('2d'), up = kind === 'slRU';
  const top = x => (up ? H - TOP + 50 - x * GRID.h / W : H - TOP + 50 - (W - x) * GRID.h / W);
  g.beginPath(); g.moveTo(0, H); g.lineTo(W, H); for (let x = W; x >= 0; x -= 3) g.lineTo(x, top(x)); g.closePath(); g.save(); g.clip();
  B.clods(g, 0, 0, W, H, up ? 61 : 62, B.SOIL, { stones: 4, cell: 190 }); g.fillStyle = lin(g, 0, 0, 0, 0, [[0, '#000'], [1, '#000']]);
  g.restore();
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip(); B.grass(g, 0, W, x => top(x), 16, 44, up ? 63 : 64, LIP, 0.55, 0); g.restore();
  return cv;
}
function slopeUnder(kind) {
  const W = GRID.w, H = GRID.h + UNDER, cv = P.createCanvas(W, H), g = cv.getContext('2d'), up = kind === 'slRD';
  const bot = x => (up ? H - 20 - x * GRID.h / W : H - 20 - (W - x) * GRID.h / W) + wave(x, W, 1, [[6, 4, 0.3], [13, 2, 1.1]]);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= 3) g.lineTo(x, bot(x)); g.closePath(); g.save(); g.clip();
  B.clods(g, 0, 0, W, H, up ? 71 : 72, B.SOIL, { stones: 3, cell: 190 }); g.restore(); return cv;
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
  P.save(P.tile3(bsc(100)), path.join(OUT, '_check', 'bsc-3x3.png')); P.save(P.tile3(enH0(200)), path.join(OUT, '_check', 'enH0-3x3.png'));
}

// ---------- the fight kit: the planes ----------
function planes() {
  const W = 1648, add = (name, cv, data) => kit.fight.background.push(put('background', name, cv, data));
  { const cv = P.createCanvas(64, 1830), g = cv.getContext('2d'); g.fillStyle = lin(g, 0, 0, 0, 1830, [[0, PAL.sky], [0.55, '#a9dcf7'], [1, '#e8f6fd']]); g.fillRect(0, 0, 64, 1830); add('sky', cv, { type: 1, factor: 0, y: 0, note: 'repeats sideways; the sky, at infinity' }); }
  { const cv = P.createCanvas(W, 560), g = cv.getContext('2d'), r = P.rng(9); for (let i = 0; i < 7; i++) { const x = r() * W, y = 120 + r() * 260, s = 50 + r() * 60, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.cloud(g, x, y, s, sd, 0.92)); } add('clouds', cv, { type: 4, factor: 0.05, drift: 6, y: 60, note: 'repeats sideways and drifts slowly to the right (6 px a second at 1x)' }); }
  { const cv = P.createCanvas(W, 520), g = cv.getContext('2d'), r = P.rng(19);
    const FAR = { hi: '#dcebe2', light: '#c0dccd', mid: '#a6c9b8', dark: '#8fb7a4', deep: '#7aa28f', ink: '#6f9484' }, MIDF = { hi: '#cfe6c8', light: '#a9d2a6', mid: '#86bb88', dark: '#6aa072', deep: '#55875f', ink: '#4a7a56' };
    const ridge2 = x => 230 + wave(x, W, 1, [[2, 40, 0.3], [5, 22, 1.9], [11, 8, 0.7]]), ridge1 = x => 310 + wave(x, W, 1, [[3, 34, 2.1], [7, 16, 0.4], [13, 6, 1.5]]);
    g.beginPath(); g.moveTo(0, 520); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge2(x)); g.lineTo(W, 520); g.closePath(); g.fillStyle = lin(g, 0, 180, 0, 520, [[0, FAR.hi], [1, FAR.mid]]); g.fill();
    for (let i = 0; i < 18; i++) { const x = r() * W, y = ridge2(x) + 14 + r() * 40, s = 14 + r() * 14, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.crown(g, x, y, s * 1.6, s, sd, FAR, { n: 3, r: s * 0.7, sparse: true, edge: 0 })); }
    g.beginPath(); g.moveTo(0, 520); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge1(x)); g.lineTo(W, 520); g.closePath(); g.fillStyle = lin(g, 0, 280, 0, 520, [[0, MIDF.hi], [1, MIDF.mid]]); g.fill();
    for (let i = 0; i < 22; i++) { const x = r() * W, y = ridge1(x) + 16 + r() * 36, s = 18 + r() * 18, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.crown(g, x, y, s * 1.5, s, sd, MIDF, { n: 3, r: s * 0.7, sparse: true, edge: 0 })); }
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = lin(g, 0, 150, 0, 520, [[0, alpha(PAL.skyLow, 0.5)], [1, alpha(PAL.skyLow, 0.12)]]); g.fillRect(0, 0, W, 520); g.globalCompositeOperation = 'source-over';
    add('hills_far', cv, { type: 1, factor: 0.2, y: 560, note: 'repeats sideways; two pale ridges with soft tree masses, hazed toward the sky' }); }
  { const cv = P.createCanvas(W, 600), g = cv.getContext('2d'), r = P.rng(29);
    const line = x => 330 + wave(x, W, 1, [[4, 10, 0.3], [9, 5, 1.2]]);
    g.beginPath(); g.moveTo(0, 600); for (let x = 0; x <= W; x += 4) g.lineTo(x, line(x)); g.lineTo(W, 600); g.closePath(); g.fillStyle = lin(g, 0, 330, 0, 600, [[0, PAL.grass], [1, PAL.grassShade]]); g.fill();
    g.save(); g.clip(); for (let i = 0; i < 60; i++) { const x = r() * W, y = 336 + r() * 60; P.wrapped(g, W, 0, () => P.dab(g, x, y, 20 + r() * 26, i % 2 ? PAL.grassLight : PAL.grassShade, 0.3, 0.3)); } g.restore();   // the calm band where the fighters stand: a soft mottle only
    const trees = []; for (let i = 0; i < 13; i++) { const x = (i + 0.5) * W / 13 + (r() - 0.5) * 70, y = line(x) + 16 + r() * 14, s = 0.75 + r() * 0.5; trees.push([x, y, s, i % 3, Math.floor(r() * 1e6)]); }
    trees.sort((p, q) => p[1] - q[1]).forEach(([x, y, s, v, sd]) => P.wrapped(g, W, 0, () => { const cols = [B.LEAF, B.LEAF_YELLOW, B.LEAF_DARK][v]; B.trunk(g, x, y, 90 * s, 26 * s, sd); B.crown(g, x, y - 160 * s, 86 * s, 62 * s, sd + 1, cols, { n: 6, r: 34 * s }); }));
    for (let i = 0; i < 16; i++) { const x = r() * W, y = line(x) + 34 + r() * 20, s = 0.6 + r() * 0.5, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.crown(g, x, y - 26 * s, 52 * s, 28 * s, sd, i % 2 ? B.LEAF_DARK : B.LEAF, { n: 4, r: 22 * s })); }
    for (let i = 0; i < 30; i++) { const x = r() * W, y = line(x) + 40 + r() * 20, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.tuft(g, x, y, 12 + r() * 10, sd, B.LEAF, 7)); }
    add('treeline', cv, { type: 1, factor: 0.5, y: 700, note: 'repeats sideways; a row of leafy trees and bushes over plain grass; the bottom 270 px are calm for the fighters' }); }
  { const cv = P.createCanvas(W, 240), g = cv.getContext('2d'), r = P.rng(39);
    g.fillStyle = lin(g, 0, 120, 0, 240, [[0, PAL.grassShade], [1, PAL.grassDeep]]); g.fillRect(0, 150, W, 90);
    B.grass(g, 0, W, 156, 26, 52, 40, B.LEAF, 0.22, W);
    for (let i = 0; i < 10; i++) { const x = r() * W, y = 158 + r() * 18, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.tuft(g, x, y, 16 + r() * 12, sd, i % 2 ? B.LEAF_YELLOW : B.LEAF, 9)); }
    for (let i = 0; i < 14; i++) { const x = r() * W, y = 160 + r() * 18, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.flower(g, x, y, 22 + r() * 14, sd, i % 3)); }
    add('meadow_near', cv, { type: 1, factor: 0.8, y: 1130, note: 'repeats sideways; grass and flowers just behind the ground band, kept low so the fighters\' feet stay clear; its bottom hides under the ground' }); }
}

// ---------- the board kit ----------
function grassPlate(seed, flowers, raised) {
  const S = 256, cv = P.createCanvas(S, S), g = cv.getContext('2d'), cols = raised ? { ...B.LEAF, mid: mix(B.LEAF.mid, B.LEAF.light, 0.22), light: mix(B.LEAF.light, B.LEAF.hi, 0.2) } : B.LEAF;
  B.meadow(g, 0, 0, S, S, SHARED + (raised ? 5 : 4), cols, { wrapX: S, wrapY: S, flowers: 0 });
  B.meadow(g, M, M, S - 2 * M, S - 2 * M, seed, cols, { base: false, flowers: flowers ? 7 : 0 });
  return cv;
}
function patch(kind) {
  const W = 240, H = 150, cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(kind.length * 7);
  if (kind === 'flowers') { for (let i = 0; i < 9; i++) B.flower(g, 30 + r() * (W - 60), 40 + r() * (H - 50), 26 + r() * 16, 300 + i, i % 3); for (let i = 0; i < 4; i++) B.tuft(g, 30 + r() * (W - 60), 40 + r() * (H - 50), 14, 320 + i, B.LEAF, 7); return cv; }
  if (kind === 'dirt') { const t = P.createCanvas(W, H), tg = t.getContext('2d'); B.clods(tg, 0, 0, W, H, 330, { ...B.SOIL, hi: '#d9c49a', light: '#c4a878', mid: '#ab8e5c', dark: '#8f7448', deep: '#6e5838' }, { cell: 260 }); tg.globalCompositeOperation = 'destination-in'; tg.fillStyle = rad(tg, W / 2, H / 2, W / 2, H / 2, Math.min(W, H) * 0.55, [[0, 'rgba(0,0,0,0.6)'], [0.5, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]); tg.fillRect(0, 0, W, H); g.drawImage(t, 0, 0); return cv; }
  const col = kind === 'light' ? B.LEAF.light : B.LEAF.dark; for (let i = 0; i < 14; i++) P.dab(g, W / 2 + (r() - 0.5) * 140, H / 2 + (r() - 0.5) * 80, 30 + r() * 30, col, 0.35, 0.25); return cv;
}
function road(mask) {   // bits: N 1, E 2, S 4, W 8; a tile 256 by 128 on the tilted ground: a road along the depth is 40 wide, across it 26 tall
  const W = 256, H = 128, cv = P.createCanvas(W, H), g = cv.getContext('2d'), cx = 128, cy = 64, wx = 40, wy = 26, r = P.rng(mask * 13);
  const arms = []; if (mask & 1) arms.push([cx, 0]); if (mask & 2) arms.push([W, cy]); if (mask & 4) arms.push([cx, H]); if (mask & 8) arms.push([0, cy]);
  const shape = (grow) => { g.beginPath(); arms.forEach(([x, y]) => { const vert = x === cx; const hw = (vert ? wx : wy) / 2 + grow; if (vert) g.rect(cx - hw, Math.min(y, cy), wx + grow * 2, Math.abs(y - cy)); else g.rect(Math.min(x, cx), cy - hw, Math.abs(x - cx), wy + grow * 2); }); g.ellipse(cx, cy, wx / 2 + grow, wy / 2 + grow, 0, 0, 7); };
  g.fillStyle = 'rgba(0,0,0,0.16)'; shape(7); g.fill();
  g.fillStyle = '#6e4f2a'; shape(3); g.fill(); g.fillStyle = PAL.roadShade; shape(1); g.fill(); g.fillStyle = PAL.road; shape(-1.5); g.fill();
  g.save(); shape(-1.5); g.clip(); for (let i = 0; i < 24; i++) P.dab(g, r() * W, r() * H, 8 + r() * 12, i % 2 ? PAL.roadLight : PAL.roadShade, 0.35, 0.3); for (let i = 0; i < 10; i++) { const x = r() * W, y = r() * H; g.beginPath(); g.ellipse(x, y, 3 + r() * 3, 2 + r() * 2, 0, 0, 7); g.fillStyle = lin(g, 0, y - 3, 0, y + 3, [[0, PAL.roadLight], [1, '#8a6a40']]); g.fill(); } g.restore();
  // pebbles and tufts along the edge
  const onEdge = () => { const [x, y] = arms[Math.floor(r() * arms.length)], vert = x === cx; const t = r(); return vert ? [cx + (r() > 0.5 ? 1 : -1) * (wx / 2 + 3), Math.min(y, cy) + t * Math.abs(y - cy)] : [Math.min(x, cx) + t * Math.abs(x - cx), cy + (r() > 0.5 ? 1 : -1) * (wy / 2 + 3)]; };
  for (let i = 0; i < 7; i++) { const [x, y] = onEdge(); B.rock(g, x, y + 2, 3.5 + r() * 3, 3 + r() * 2, Math.floor(r() * 1e6), B.SOILSTONE, { shadow: false }); }
  for (let i = 0; i < 5; i++) { const [x, y] = onEdge(); B.tuft(g, x, y + 3, 7 + r() * 5, Math.floor(r() * 1e6), B.LEAF, 6); }
  return cv;
}
function bridge(ns) {
  const W = 256, H = 128, cv = P.createCanvas(W, H), g = cv.getContext('2d');
  if (ns) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(90, 0, 76, H); for (let y = -6; y < H; y += 14) B.pole(g, 96, y + 12, 64, 12, 500 + y, false); for (const x of [92, 162]) { B.pole(g, x, H + 4, H + 8, 5, 520 + x); for (let y = 8; y < H; y += 32) B.pole(g, x, y + 8, 14, 9, 540 + y + x); } }
  else { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 40, W, 50); for (let x = -6; x < W; x += 14) B.pole(g, x + 6, 84, 40, 12, 560 + x); for (const y of [40, 86]) { B.pole(g, -4, y, W + 8, 5, 580 + y, false); for (let x = 12; x < W; x += 40) B.pole(g, x, y + 6, 14, 8, 600 + x + y); } }
  return cv;
}
function shore(sides) {   // sides: the water sides, n e s w, ne nw se sw; a sand band along the water with a wavy grass edge and foam at the water
  const W = 256, H = 128, cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(sides.length + sides.charCodeAt(0));
  const band = 46, bandY = 30, gX = (t, n) => band + wave(t, n, 1, [[2, 6, 0.4], [5, 3, 1.3]]), gY = (t, n) => bandY + wave(t, n, 1, [[2, 4, 0.9], [5, 2, 0.2]]);
  const path = () => { g.beginPath();
    if (sides.includes('n')) { g.moveTo(0, 0); for (let x = 0; x <= W; x += 4) g.lineTo(x, gY(x, W)); g.lineTo(W, 0); g.closePath(); }
    if (sides.includes('s')) { g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, H - gY(x, W)); g.lineTo(W, H); g.closePath(); }
    if (sides.includes('w')) { g.moveTo(0, 0); for (let y = 0; y <= H; y += 4) g.lineTo(gX(y, H), y); g.lineTo(0, H); g.closePath(); }
    if (sides.includes('e')) { g.moveTo(W, 0); for (let y = 0; y <= H; y += 4) g.lineTo(W - gX(y, H), y); g.lineTo(W, H); g.closePath(); } };
  path(); g.fillStyle = B.SAND.mid; g.fill(); g.save(); path(); g.clip();
  for (let i = 0; i < 36; i++) P.dab(g, r() * W, r() * H, 8 + r() * 14, [B.SAND.light, B.SAND.dark, B.SAND.hi][i % 3], 0.4, 0.3);
  for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H; g.beginPath(); g.ellipse(x, y, 2 + r() * 2.5, 1.5 + r() * 1.5, 0, 0, 7); g.fillStyle = lin(g, 0, y - 3, 0, y + 3, [[0, B.SAND.hi], [1, B.SAND.deep]]); g.fill(); }
  for (let i = 0; i < 3; i++) { const x = 20 + r() * (W - 40), y = 20 + r() * (H - 40); g.beginPath(); g.arc(x, y, 4, Math.PI, 0); g.lineWidth = 2; g.strokeStyle = '#fff8ea'; g.stroke(); g.beginPath(); g.arc(x, y, 2, Math.PI, 0); g.strokeStyle = alpha('#c8a070', 0.7); g.lineWidth = 1; g.stroke(); }   // shells
  const foam = (x0, y0, x1, y1, vert) => { g.lineCap = 'round'; g.strokeStyle = alpha('#9ad0f0', 0.7); g.lineWidth = 9; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3.5; g.beginPath(); for (let t = 0; t <= 1; t += 0.01) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, w = Math.abs(Math.sin(t * 28)) * 5; vert ? (t ? g.lineTo(x + w, y) : g.moveTo(x + w, y)) : (t ? g.lineTo(x, y + w) : g.moveTo(x, y + w)); } g.stroke(); };
  if (sides.includes('n')) foam(0, 5, W, 5, false); if (sides.includes('s')) foam(0, H - 5, W, H - 5, false); if (sides.includes('w')) foam(5, 0, 5, H, true); if (sides.includes('e')) foam(W - 5, 0, W - 5, H, true);
  g.restore(); return cv;
}
function cliffFace(g, W, H, foot, seed) {   // the lip of grass, then soil clods with stones and roots, a ragged foot and its shadow on the lower ground
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); for (let x = W; x >= 0; x -= 3) g.lineTo(x, foot(x)); g.closePath(); g.save(); g.clip();
  B.clods(g, 0, 10, W, H, seed, B.SOIL, { stones: 3, cell: 150, wrapX: W });
  const r = P.rng(seed); for (let i = 0; i < 6; i++) { const x = r() * W; g.strokeStyle = alpha(B.SOIL.deep, 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(x, 16); g.quadraticCurveTo(x + (r() - 0.5) * 20, 40, x + (r() - 0.5) * 30, 50 + r() * 30); g.stroke(); }
  g.fillStyle = lin(g, 0, 10, 0, 34, [[0, alpha(B.SOIL.deep, 0.75)], [1, alpha(B.SOIL.deep, 0)]]); g.fillRect(0, 10, W, 24); g.restore();
  g.fillStyle = lin(g, 0, 0, 0, 14, [[0, PAL.lip], [0.6, PAL.grass], [1, PAL.grassShade]]); g.fillRect(0, 0, W, 14); B.grass(g, 0, W, 6, 8, 16, seed + 1, LIP, 0.4, W);
  const sh = P.createCanvas(W, H), sg = sh.getContext('2d');   // the foot's shadow on the lower ground: a band hugging the foot, fading down
  sg.beginPath(); sg.moveTo(0, foot(0) - 2); for (let x = 0; x <= W; x += 3) sg.lineTo(x, foot(x) - 2); for (let x = W; x >= 0; x -= 3) sg.lineTo(x, Math.min(H, foot(x) + 20)); sg.closePath(); sg.fillStyle = 'rgba(0,0,0,0.3)'; sg.fill();
  sg.globalCompositeOperation = 'destination-in'; sg.fillStyle = lin(sg, 0, 0, 0, H, [[0, 'rgba(0,0,0,1)'], [0.8, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); sg.fillRect(0, 0, W, H);
  g.drawImage(sh, 0, 0);
}
function cliffFront(seed) { const W = 256, H = 96, cv = P.createCanvas(W, H), g = cv.getContext('2d'); cliffFace(g, W, H, x => 78 + wave(x, W, 1, [[3, 3, 0.2], [8, 2, 1.4]]), seed); return cv; }
function cliffCorner(right) { const W = 96, H = 96, cv = P.createCanvas(W, H), g = cv.getContext('2d'); cliffFace(g, W, H, x => { const xx = right ? W - x : x; return 78 - Math.max(0, 1 - xx / 70) ** 2 * 62 + wave(xx, W, 0.6, [[4, 2, 0]]); }, right ? 51 : 50); return cv; }
function cliffEdge(side) {   // the plateau's other edges seen from above: a thin lip of lit grass on the north and west (toward the light), the step's shadow on the lower ground to the east
  const vert = side !== 'n', W = vert ? 28 : 256, H = vert ? 128 : 28, cv = P.createCanvas(W, H), g = cv.getContext('2d');
  if (side === 'e') { g.fillStyle = lin(g, 0, 0, W, 0, [[0, alpha(PAL.grassDeep, 0.55)], [1, alpha(PAL.grassDeep, 0)]]); g.fillRect(0, 0, W, H); return cv; }
  const stops = [[0, alpha(PAL.grassDeep, 0.5)], [0.25, alpha(PAL.grassDeep, 0.5)], [0.3, PAL.lip], [0.5, alpha(PAL.lip, 0.8)], [1, alpha(PAL.lip, 0)]];
  if (!vert) { g.fillStyle = lin(g, 0, 0, 0, H, stops); g.fillRect(0, 0, W, 14); B.grass(g, 0, W, 6, 6, 12, 760, LIP, 0.3, W); }
  else { g.fillStyle = lin(g, 0, 0, W, 0, stops); g.fillRect(0, 0, 14, H); const r = P.rng(761); for (let i = 0; i < 10; i++) B.tuft(g, 5 + r() * 6, r() * H, 6 + r() * 4, 770 + i, LIP, 5); }
  return cv;
}
function spacePlate() {
  const W = 128, H = 64, cv = P.createCanvas(W, H), g = cv.getContext('2d'), x = 64, y = 30;
  g.beginPath(); g.ellipse(x, y + 4, 52, 25, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fill();
  g.beginPath(); g.ellipse(x, y, 50, 23, 0, 0, 7); g.fillStyle = rad(g, x - 12, y - 9, x, y, 50, [[0, PAL.goldLight], [0.55, PAL.gold], [1, PAL.goldDeep]]); g.fill(); P.ink(g, 2.5);
  g.beginPath(); g.ellipse(x, y, 32, 14, 0, 0, 7); g.fillStyle = PAL.cream; g.fill(); P.ink(g, 1.6);
  g.beginPath(); g.ellipse(x - 6, y - 8, 22, 5, 0, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.stroke();
  return cv;
}
function spaceLit() { const W = 160, H = 80, cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.beginPath(); g.ellipse(80, 38, 62, 29, 0, 0, 7); g.lineWidth = 7; g.strokeStyle = 'rgba(255,249,184,0.95)'; g.stroke(); g.beginPath(); g.ellipse(80, 38, 68, 33, 0, 0, 7); g.lineWidth = 10; g.strokeStyle = 'rgba(255,230,120,0.35)'; g.stroke(); return cv; }
function disc(col) { const W = 72, H = 34, cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.beginPath(); g.ellipse(36, 17, 32, 14, 0, 0, 7); g.fillStyle = rad(g, 28, 10, 36, 17, 32, [[0, lighten(col, 0.45)], [0.5, col], [1, darken(col, 0.25)]]); g.fill(); P.ink(g, 1.6); return cv; }
function horizon() {
  const W = 1648, add = (name, cv, data) => kit.board.horizon.push(put('horizon', name, cv, data));
  { const cv = P.createCanvas(64, 400), g = cv.getContext('2d'); g.fillStyle = lin(g, 0, 0, 0, 400, [[0, '#3f8fe0'], [1, '#c4e6fb']]); g.fillRect(0, 0, 64, 400); add('sky', cv, { type: 1, factor: 0, factorY: 0, y: 0 }); }
  { const cv = P.createCanvas(W, 240), g = cv.getContext('2d'), r = P.rng(5); for (let i = 0; i < 6; i++) { const x = r() * W, y = 100 + r() * 80, s = 36 + r() * 40, sd = Math.floor(r() * 1e6); P.wrapped(g, W, 0, () => B.cloud(g, x, y, s, sd, 0.92)); } add('clouds', cv, { type: 4, factor: 0.05, factorY: 0, drift: 5, y: 20 }); }
  { const cv = P.createCanvas(W, 520), g = cv.getContext('2d'), r = P.rng(6); g.fillStyle = lin(g, 0, 0, 0, 520, [[0, PAL.seaDeep], [0.5, PAL.sea], [1, PAL.seaLight]]); g.fillRect(0, 0, W, 520);
    for (let i = 0; i < 160; i++) { const x = r() * W, y = 30 + r() * 480, w = 14 + r() * 30; P.wrapped(g, W, 0, () => { g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x, y - 4 - (y / 520) * 4, x + w / 2, y); g.lineWidth = 1.5 + (y / 520) * 1.5; g.strokeStyle = alpha('#ffffff', 0.25 + (y / 520) * 0.4); g.stroke(); }); }   // the waves, larger and brighter nearer
    g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 200; i++) g.fillRect(r() * W, 20 + r() * 480, 3 + r() * 6, 2); add('sea', cv, { type: 1, factor: 0.3, factorY: 0, y: 360, note: 'the sea band under the sky; pinned to the top of the screen (factorY 0), slides a little sideways' }); }
  for (let k = 0; k < 2; k++) { const cv = P.createCanvas(360, 160), g = cv.getContext('2d'), r = P.rng(7 + k), x = 180, y = 110, w = 130 + k * 30; g.beginPath(); g.ellipse(x, y, w, 22, 0, 0, 7); g.fillStyle = lin(g, 0, y - 20, 0, y + 20, [[0, B.SAND.hi], [1, B.SAND.dark]]); g.fill(); g.beginPath(); g.ellipse(x, y - 8, w * 0.8, 16, 0, 0, 7); g.fillStyle = lin(g, 0, y - 24, 0, y + 8, [[0, PAL.grassLight], [1, PAL.grassShade]]); g.fill(); for (let i = 0; i < 2 + k; i++) { const tx = x + (r() - 0.5) * w * 1.1, ty = y - 10; B.trunk(g, tx, ty, 18, 7, 900 + i); B.crown(g, tx, ty - 34, 22, 16, 910 + i + k * 5, B.LEAF, { n: 3, r: 10, sparse: true, edge: 1 }); } add('island_' + k, cv, { type: 0, factor: 0.2, factorY: 0, y: 330 + k * 30, note: 'an accent placed once, two pictures in turn, spaced 600 to 1200 px apart' }); }
}
function boardKit() {
  for (let i = 0; i < 3; i++) kit.board.ground.push(put('board', 'grass ' + i, grassPlate(600 + i, i === 2), { origin: 'top-left', repeat: 'both', grid: [256, 256] }));
  kit.board.plateau = [0, 1].map(i => put('board', 'plateau ' + i, grassPlate(650 + i, false, true), { origin: 'top-left', repeat: 'both', grid: [256, 256], note: 'the plates of a raised cell' }));
  for (const k of ['light', 'dark', 'flowers', 'dirt']) kit.board.patches.push(put('board', 'patch_' + k, patch(k), { origin: 'centre', note: 'a soft-edged overlay placed freely on the plates' }));
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
