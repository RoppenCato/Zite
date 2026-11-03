// wobblewood.js: the Wobblewood Forest board kit (Mitch, AD, 2026-11-01), in the meadows' inked hand on a cooler palette: moss and teal, nothing stands straight,
// giant mushrooms and fallen logs, and a landmark for each of the area's named hubs. It borrows the meadows' small pieces (rocks, tufts, plates, fences) by swapping their palette.
const P = require('../paint.js'); const I = require('../ink.js'); const K = require('./cloverfield.js'); const { eyes } = require('../monsters/face.js');
const { form, line, spline, pathOf, fill } = I; const C = K.C, PROP = K.PROP, { cast, contact, lobes } = K;
Object.assign(C, { meadow: '#56ad72', meadowShade: '#3f9163', clover: '#74c489', worn: '#9dbd74', dirt: '#b89a66', dirtShade: '#94784c', leaf: '#3aa86e', leafShade: '#237a5c', leafLight: '#7ddb8e', leaf2: '#2f9a78', leaf2Shade: '#1c6e62', leaf2Light: '#6ad0a0', pine: '#2c8868', pineShade: '#1a5e52', pineLight: '#58b890', apple: '#3fae78', appleShade: '#267f60', bush: '#45ab6e', bushShade: '#2a7f5e', bushLight: '#86d88e', hedge: '#3d9e68', hedgeShade: '#267a58', rock: '#a9b0a6', rockShade: '#6f7a74', rockLight: '#d4dccb', tuft: '#5fba78', tuftShade: '#3a8f62', trunk: '#7a5540', trunkShade: '#523828', water: '#4fc0c8', waterDeep: '#2f98a8', waterLight: '#b8f0ee', sand: '#b9c48a' });
const ink = { ink: PROP, inkW: 1.6 }, thin = { ink: PROP, inkW: 1.2 }, GLOW = '#ffe27a', MOSS = '#6fbf5a', MOSSL = '#a4e27a', MOSSS = '#4a9a4e';
const bark = (g, pts, col = C.trunkShade) => line(g, pts, 0.9, col, { taper: 0.2 });
function canopy(g, cx, cy, spec, q, col = C.leaf, shadeCol = C.leafShade, lightCol = C.leafLight) { const L = lobes(cx, cy, spec, q); const R = Math.max(...spec.map(s => Math.hypot(s[0] - cx, s[1] - cy) + s[2])); form(g, L, col, { ...ink, shade: [[cx - R * 0.1, cy + R * 0.1], [cx + R * 1.1, cy - R * 0.1], [cx + R, cy + R], [cx - R * 0.7, cy + R]], shadeCol, glint: [[cx - R * 0.65, cy - R * 0.25], [cx - R * 0.15, cy - R * 0.72], [cx + R * 0.18, cy - R * 0.45], [cx - R * 0.42, cy - R * 0.02]], glintCol: lightCol, glintA: 0.65 }); }
// ---------------------------------------------------------------- trees: nothing stands straight
function wobble(g, x, y, s, seed, dir = 1) {   // a crooked trunk that leans one way and comes back, a lopsided crown
  const q = P.rng(seed), L = dir * (10 + q() * 8), b = dir * (3 + q() * 4); g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 52, 66);
  form(g, [[-7, 1], [7, 1], [6 + b, -14], [7 + L * 0.3, -30], [L + 3, -46], [L - 5, -47], [-4 + L * 0.2, -30], [-5 + b, -14]], C.trunk, { ...ink, shade: [[1 + b, -2], [7, 1], [6 + b, -14], [7 + L * 0.3, -30], [L + 3, -46], [L, -46], [1 + L * 0.3, -28]], shadeCol: C.trunkShade });
  bark(g, [[-2, -5], [b - 1, -18], [L * 0.3 + 1, -28]]); for (const sx of [-1, 1]) form(g, [[sx * 5, -3], [sx * 13, 1], [sx * 6, 1.5]], C.trunk, { ...thin, shade: false });
  const cx = L + 1, cy = -60; canopy(g, cx, cy, [[cx - 15 * dir, cy + 8, 14], [cx + 2, cy - 7, 18], [cx + 17 * dir, cy - 1, 13], [cx - 2, cy + 9, 12]], q, seed % 2 ? C.leaf : C.leaf2, seed % 2 ? C.leafShade : C.leaf2Shade, seed % 2 ? C.leafLight : C.leaf2Light); line(g, [[cx - 9, cy + 3], [cx, cy - 1], [cx + 8, cy + 5]], 1, C.leafShade, { taper: 0.3 });
  g.restore();
}
function tall(g, x, y, s, seed) {   // an old giant: a thick trunk, a branch stub, a high crown, moss on its foot
  const q = P.rng(seed), L = (q() - 0.5) * 12; g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 70, 90);
  form(g, [[-13, 1], [13, 1], [10, -18], [9 + L, -52], [8 + L, -74], [-8 + L, -74], [-9 + L, -52], [-10, -18]], C.trunk, { ...ink, shade: [[2, 1], [13, 1], [10, -18], [9 + L, -52], [8 + L, -74], [2 + L, -74], [2 + L, -40]], shadeCol: C.trunkShade });
  for (const p of [[[-6, -12], [-4, -26], [-5 + L, -42]], [[5, -22], [6 + L, -40], [5 + L, -60]]]) bark(g, p); for (const sx of [-1, 1]) form(g, [[sx * 10, -4], [sx * 20, 1], [sx * 9, 2]], C.trunk, { ...thin, shade: false });
  form(g, [[-13, 1], [-13, -7], [-7, -12], [0, -7], [5, 1]], MOSS, { ...thin, shade: false }); form(g, [[8 + L * 0.8, -48], [20 + L, -55], [21 + L, -51], [9 + L * 0.8, -42]], C.trunk, { ...thin, shade: false });
  const cx = L, cy = -92; canopy(g, cx, cy, [[cx - 22, cy + 9, 18], [cx, cy - 10, 24], [cx + 23, cy + 6, 18], [cx, cy + 12, 16]], q, C.leaf2, C.leaf2Shade, C.leaf2Light); line(g, [[cx - 14, cy + 5], [cx - 2, cy], [cx + 12, cy + 7]], 1, C.leaf2Shade, { taper: 0.3 });
  g.restore();
}
// ---------------------------------------------------------------- the forest floor
const MUSH = [['#c85ab8', '#8f3a90', '#ee9ae0'], ['#3ec4bc', '#238a90', '#9af0e4'], ['#e8703e', '#b0482a', '#ffb088']];
function bigMush(g, x, y, s, v, seed = 7) {   // twice a man's height, its stem bent, a domed cap with pale spots and a gilled underside
  const [cap, capS, capL] = MUSH[v], lean = v === 1 ? -5 : 5; g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 36, 40);
  form(g, [[-6, 1], [6, 1], [5, -12], [3 + lean, -27], [-3 + lean, -27], [-5, -12]], '#f3ead2', { ...ink, shade: [[1, 1], [6, 1], [5, -12], [3 + lean, -27], [lean, -27]], shadeCol: '#cdbf9e' });
  form(g, [[lean - 20, -28], [lean, -22], [lean + 20, -28], [lean + 14, -31], [lean - 14, -31]], '#e6d8b6', { ...thin, shade: false });
  const D = form(g, [[lean - 22, -28], [lean - 18, -40], [lean - 4, -48], [lean + 8, -47], [lean + 19, -39], [lean + 22, -28], [lean, -31]], cap, { ...ink, shade: [[lean + 3, -46], [lean + 19, -39], [lean + 22, -28], [lean, -31], [lean - 6, -30], [lean + 8, -36]], shadeCol: capS, glint: [[lean - 15, -37], [lean - 6, -45], [lean - 2, -42], [lean - 11, -34]], glintCol: capL, glintA: 0.8 });
  g.save(); pathOf(g, D); g.clip(); const q = P.rng(seed); for (const [sx, sy, r] of [[-11, -35, 3], [2, -41, 3.6], [11, -33, 2.8], [-3, -32, 2]]) { g.fillStyle = '#fff6e0'; g.beginPath(); g.ellipse(lean + sx, sy, r, r * 0.8, 0, 0, 7); g.fill(); } g.restore();
  g.restore();
}
function log(g, x, y, s, seed) {   // a fallen trunk with a ring at its near end, moss along its back, small mushrooms on it
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 80, 18);
  form(g, [[-34, -2], [-30, -19], [28, -21], [36, -11], [30, 0], [-28, 2]], C.trunk, { ...ink, shade: [[-30, -8], [30, -10], [36, -11], [30, 0], [-28, 2], [-32, -3]], shadeCol: C.trunkShade }); for (const p of [[[-14, -12], [4, -13], [18, -11]], [[-20, -6], [-2, -6]]]) bark(g, p);
  form(g, [[-26, -18], [-14, -24], [2, -22], [14, -25], [28, -21], [20, -16], [4, -16], [-12, -15]], MOSS, { ...thin, shade: false, glint: [[-18, -21], [-4, -22], [-2, -20], [-16, -19]], glintCol: MOSSL, glintA: 0.8 });
  const E = form(g, [[-40, -10], [-36, -19], [-29, -19], [-26, -10], [-29, -1], [-36, -1]], '#d4b078', { ...ink, shade: false }); for (const r of [0.6, 0.28]) { g.strokeStyle = '#94704a'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(-33, -10, 6.5 * r, 9 * r, 0, 0, 7); g.stroke(); }
  K.mushroom(g, 16, -21, 0.75, seed); K.mushroom(g, 22, -20, 0.6, seed + 1); g.restore();
}
function stump(g, x, y, s, seed) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 30, 18); form(g, [[-13, 1], [-22, 2], [-12, -3], [-11, -15], [11, -15], [12, -3], [22, 2], [13, 1]], C.trunk, { ...ink, shade: [[2, 1], [13, 1], [22, 2], [12, -3], [11, -15], [3, -15]], shadeCol: C.trunkShade }); form(g, [[-12, -15], [-7, -19], [7, -19], [12, -15], [7, -11], [-7, -11]], '#d4b078', { ...thin, shade: false }); g.strokeStyle = '#94704a'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(0, -15, 6, 2.2, 0, 0, 7); g.stroke(); form(g, [[-13, 1], [-13, -6], [-6, -9], [-2, -4], [0, 1]], MOSS, { ...thin, shade: false }); K.mushroom(g, 9, 0, 0.8, seed); g.restore(); }
function roots(g, x, y, s, seed) {   // roots breaking the ground, three arches and a tip
  g.save(); g.translate(x, y); g.scale(s, s); for (const [x0, x1, top, w0] of [[-32, -8, -13, 5], [-12, 16, -16, 6], [10, 34, -10, 4.5]]) { const P0 = [[x0, 1], [(x0 * 3 + x1) / 4, top], [(x0 + x1 * 3) / 4, top + 1], [x1, 1]]; contact(g, (x0 + x1) / 2, 1, (x1 - x0) * 0.45, 2.4); line(g, P0, w0 + 2.2, PROP, { taper: 0.25, taper2: 0.25, flat: true }); line(g, P0, w0, C.trunk, { taper: 0.25, taper2: 0.25, flat: true }); } g.restore();
}
function fern(g, x, y, s, seed) {   // a clump of arching fronds, each a row of small leaflets
  const q = P.rng(seed); g.save(); g.translate(x, y); g.scale(s, s); contact(g, 0, 0, 12, 3); for (const [a0, len, col] of [[-2.5, 22, C.tuftShade], [-0.65, 22, C.tuftShade], [-2.05, 26, C.tuft], [-1.1, 26, C.tuft], [-1.57, 25, '#7fd08a']]) { const ex = Math.cos(a0) * len, ey = Math.sin(a0) * len, mx = ex * 0.55, my = ey * 0.85 - 3, F = form(g, [[0, 0], [mx - 3.4, my - 1], [ex, ey + 3], [mx + 3.4, my + 1]], col, { ink: PROP, inkW: 0.9, shade: false }); line(g, [[0, 0], [mx, my], [ex, ey + 3]], 0.6, PROP, { taper: 0.2 }); } g.restore();
}
function bells(g, x, y, seed, s = 1) {   // small bell flowers that glow a little, blue and violet
  const q = P.rng(seed); g.save(); g.translate(x, y); g.scale(s, s); for (let i = 0; i < 5; i++) { const px = (q() - 0.5) * 22, h = 7 + q() * 6, col = i % 2 ? '#7ad0f4' : '#b08cf0'; line(g, [[px, 1], [px + 1, -h + 2], [px + 3, -h]], 0.9, C.tuftShade, { taper: 0.1 }); form(g, [[px + 0.6, -h + 3], [px + 1.6, -h], [px + 4.4, -h], [px + 5.4, -h + 3], [px + 3, -h + 2.4]], col, { ink: PROP, inkW: 0.7, shade: false, n: 5 }); } g.restore();
}
// ---------------------------------------------------------------- the landmarks
function treeHouse(g, x, y, s, v, seed) {   // Tumbletree's houses grow out of old trunks: a fat crooked body, a round door, a lit window, a mushroom or leaf roof, a crooked chimney
  const q = P.rng(seed), dir = v === 1 ? -1 : 1, roof = [MUSH[2], MUSH[0], ['#58b86a', '#35885a', '#9ae08a']][v]; g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 48, 44);
  form(g, [[-18, 1], [-26, 2], [-17, -3], [-16, -22], [-13 + dir * 2, -36], [13 + dir * 2, -36], [16, -22], [17, -3], [26, 2], [18, 1]], '#946a4a', { ...ink, shade: [[5, 1], [18, 1], [26, 2], [17, -3], [16, -22], [13 + dir * 2, -36], [5 + dir * 2, -36]], shadeCol: '#6a4832' }); for (const p of [[[-11, -6], [-10, -18]], [[11, -5], [10, -17]], [[-6, -28], [-4, -33]]]) bark(g, p, '#6a4832');
  form(g, [[-6.6, 0], [-6.6, -11], [0, -17], [6.6, -11], [6.6, 0]], '#4a3324', { ...thin, shade: false, n: 8 }); form(g, [[-5, 0], [-5, -10.4], [0, -15], [5, -10.4], [5, 0]], v === 1 ? '#3f8fb8' : '#c8503e', { ink: null, shade: false, n: 8 }); g.fillStyle = C.gold; g.beginPath(); g.arc(3, -6, 0.9, 0, 7); g.fill();
  g.fillStyle = PROP; g.beginPath(); g.arc(dir * 8.5, -25, 5, 0, 7); g.fill(); g.fillStyle = GLOW; g.beginPath(); g.arc(dir * 8.5, -25, 3.6, 0, 7); g.fill(); line(g, [[dir * 8.5 - 3.5, -25], [dir * 8.5 + 3.5, -25]], 0.7, PROP, { taper: 0.1 }); line(g, [[dir * 8.5, -28.5], [dir * 8.5, -21.5]], 0.7, PROP, { taper: 0.1 });
  const chx = -dir * 10; form(g, [[chx - 2.6, -36], [chx + 2.6, -36], [chx + 4, -50], [chx - 1.2, -50]], C.stone, { ...thin, inkW: 1, shade: false }); for (let i = 0; i < 3; i++) { g.fillStyle = P.alpha('#ffffff', 0.55 - i * 0.15); g.beginPath(); g.arc(chx + 3 + i * 3, -54 - i * 4, 2.2 + i, 0, 7); g.fill(); }
  form(g, [[-25, -34], [-20, -46], [-6 + dir * 3, -55], [8 + dir * 3, -54], [20, -45], [25, -34], [8, -31], [-8, -31]], roof[0], { ...ink, shade: [[6, -53], [20, -45], [25, -34], [8, -31], [-4, -31], [12, -40]], shadeCol: roof[1], glint: [[-18, -41], [-7, -50], [-3, -47], [-14, -37]], glintCol: roof[2], glintA: 0.8 }); if (v < 2) for (const [sx, sy, r] of [[-11, -40, 2.8], [3, -47, 3], [12, -38, 2.4]]) { g.fillStyle = '#fff6e0'; g.beginPath(); g.ellipse(sx + dir, sy, r, r * 0.8, 0, 0, 7); g.fill(); }
  g.restore();
}
function tumbletree(g, x, y, s) {   // the village's great tree: leaning far over, propped on a post, windows up its trunk, a ladder, lanterns on the bough, a huge crown
  const q = P.rng(61); g.save(); g.translate(x, y); g.scale(s, s); cast(g, 8, 0, 90, 90);
  form(g, [[-22, 1], [-36, 3], [-20, -5], [-16, -30], [-8, -56], [8, -80], [28, -92], [34, -82], [24, -64], [18, -34], [20, -6], [34, 3], [20, 2]], '#8a6246', { ...ink, shade: [[2, 1], [20, 2], [34, 3], [20, -6], [18, -34], [24, -64], [34, -82], [28, -86], [14, -60], [8, -30]], shadeCol: '#604230' }); for (const p of [[[-12, -10], [-9, -30], [0, -56]], [[8, -14], [7, -32], [14, -56]]]) bark(g, p, '#604230');
  form(g, [[-8, 1], [-8, -14], [0, -21], [8, -14], [8, 1]], '#4a3324', { ...thin, shade: false, n: 8 }); form(g, [[-6.2, 1], [-6.2, -13.4], [0, -19], [6.2, -13.4], [6.2, 1]], '#3f8fb8', { ink: null, shade: false, n: 8 }); g.fillStyle = C.gold; g.beginPath(); g.arc(3.6, -7, 1, 0, 7); g.fill();
  for (const [wx, wy] of [[-4, -36], [8, -56], [17, -74]]) { g.fillStyle = PROP; g.beginPath(); g.arc(wx, wy, 4.6, 0, 7); g.fill(); g.fillStyle = GLOW; g.beginPath(); g.arc(wx, wy, 3.3, 0, 7); g.fill(); line(g, [[wx - 3, wy], [wx + 3, wy]], 0.6, PROP, { taper: 0.1 }); }
  for (const [lx, ly0, ly1] of [[-19, 1, -36]]) { line(g, [[lx - 3, ly0], [lx - 1, ly1]], 1.2, C.woodShade, { taper: 0.02 }); line(g, [[lx + 3, ly0], [lx + 5, ly1]], 1.2, C.woodShade, { taper: 0.02 }); for (let i = 1; i < 6; i++) { const t = i / 6; line(g, [[lx - 3 + 2 * t, ly0 + (ly1 - ly0) * t], [lx + 3 + 2 * t, ly0 + (ly1 - ly0) * t]], 1, C.woodShade, { taper: 0.02 }); } }
  line(g, [[46, 1], [36, -52]], 3.6, PROP, { taper: 0.02 }); line(g, [[46, 1], [36, -52]], 2.2, C.wood, { taper: 0.02 }); line(g, [[32, -52], [40, -50]], 2.4, PROP, { taper: 0.02 });   // the prop that holds it up
  const cx = 32, cy = -114; canopy(g, cx, cy, [[cx - 34, cy + 8, 22], [cx - 8, cy - 14, 28], [cx + 24, cy - 4, 24], [cx + 40, cy + 14, 16], [cx, cy + 16, 22]], q); line(g, [[cx - 22, cy + 6], [cx - 6, cy], [cx + 12, cy + 8]], 1.1, C.leafShade, { taper: 0.3 });
  for (const [hx, hy] of [[-6, -92], [52, -92]]) { line(g, [[hx, hy - 6], [hx, hy]], 0.8, PROP, { taper: 0.05 }); g.fillStyle = P.alpha(GLOW, 0.3); g.beginPath(); g.arc(hx, hy + 3, 6, 0, 7); g.fill(); form(g, [[hx - 2.4, hy], [hx + 2.4, hy], [hx + 2.4, hy + 5], [hx - 2.4, hy + 5]], GLOW, { ...thin, inkW: 0.8, shade: false, n: 5 }); }
  g.restore();
}
function hollowLog(g, x, y, s) {   // the Hollow Log Shop: a huge fallen log, a round door in its cut end, a striped awning, a coin sign, moss along its back
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 96, 36);
  form(g, [[-40, 0], [-38, -30], [34, -34], [44, -18], [36, 1]], '#8a6246', { ...ink, shade: [[-38, -12], [36, -14], [44, -18], [36, 1], [-40, 0]], shadeCol: '#604230' }); for (const p of [[[-12, -24], [10, -25], [28, -24]], [[-4, -9], [16, -9]]]) bark(g, p, '#604230');
  form(g, [[-34, -30], [-18, -38], [4, -35], [22, -40], [36, -33], [20, -28], [-6, -27], [-24, -26]], MOSS, { ...thin, shade: false, glint: [[-24, -33], [-6, -35], [-4, -32], [-22, -30]], glintCol: MOSSL, glintA: 0.8 });
  form(g, [[-56, -16], [-50, -32], [-40, -34], [-32, -16], [-40, 1], [-50, 1]], '#d4b078', { ...ink, shade: false }); g.strokeStyle = '#94704a'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(-44, -16, 11, 16, 0, 0, 7); g.stroke();
  form(g, [[-49.5, 1], [-49.5, -12], [-44, -20], [-38.5, -12], [-38.5, 1]], '#4a3324', { ...thin, shade: false, n: 8 }); g.fillStyle = C.gold; g.beginPath(); g.arc(-41, -7, 0.9, 0, 7); g.fill();
  const st = ['#e8703e', '#fff0d4']; for (let i = 0; i < 6; i++) { const ax = -26 + i * 8; form(g, [[ax, -22], [ax + 8, -22.4], [ax + 9, -12.6], [ax + 1, -12]], st[i % 2], { ink: PROP, inkW: 0.9, shade: false, n: 4 }); }
  form(g, [[-22, -11], [18, -12], [18, -1], [-22, 0]], '#4a3324', { ...thin, shade: false, n: 4 }); for (const [gx, col] of [[-14, '#f4c14a'], [-4, '#e85a6a'], [8, '#5ab8e8']]) { g.fillStyle = col; g.beginPath(); g.arc(gx, -6, 2.6, 0, 7); g.fill(); g.strokeStyle = PROP; g.lineWidth = 0.7; g.stroke(); }
  line(g, [[26, -20], [26, 1]], 2.2, PROP, { taper: 0.02 }); g.fillStyle = PROP; g.beginPath(); g.arc(26, -26, 7, 0, 7); g.fill(); g.fillStyle = C.gold; g.beginPath(); g.arc(26, -26, 5.6, 0, 7); g.fill(); g.fillStyle = '#b8842a'; g.beginPath(); g.arc(26, -26, 2.6, 0, 7); g.fill();
  g.restore();
}
function upsideTree(g, x, y, s) {   // The Upside-Down Tree: its crown a mound on the ground, the trunk rising from it, its roots spreading in the air like branches, a few leaves caught in them
  const q = P.rng(71); g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 76, 64);
  form(g, [[-9, -18], [9, -18], [8, -44], [5, -62], [-5, -62], [-8, -44]], C.trunk, { ...ink, shade: [[1, -18], [9, -18], [8, -44], [5, -62], [1, -62]], shadeCol: C.trunkShade }); bark(g, [[-3, -26], [-3, -48]]);
  for (const [ex, ey, cxm, cym, w0] of [[-38, -92, -22, -66, 5.5], [-20, -104, -8, -78, 5], [4, -110, 4, -84, 5], [24, -102, 12, -76, 5], [42, -86, 26, -66, 5.5], [-46, -72, -26, -60, 4]]) { const R = [[ex * 0.08, -60], [cxm, cym], [ex, ey]]; line(g, R, w0 + 2, PROP, { taper: 0.04, flat: true }); line(g, R, w0, C.trunk, { taper: 0.04, flat: true }); }
  for (const [lx, ly] of [[-33, -86], [28, -98], [-14, -100]]) form(g, [[lx - 4, ly], [lx, ly - 4], [lx + 5, ly], [lx, ly + 3]], C.leafLight, { ...thin, inkW: 0.9, shade: false });
  canopy(g, 0, -12, [[-24, -8, 15], [0, -14, 18], [24, -8, 15], [-10, -2, 13], [12, -2, 13]], q); line(g, [[-14, -8], [0, -12], [14, -7]], 1, C.leafShade, { taper: 0.3 });
  g.restore();
}
function fungalRing(g, x, y, s) {   // Fungal Ring: mushrooms in a ring on a pale patch, glowing a little, the ones behind drawn first
  g.save(); g.translate(x, y); g.scale(s, s); const R = form(g, [[-32, -14], [-20, -25], [0, -29], [20, -25], [32, -14], [20, -3], [0, 1], [-20, -3]], C.worn, { ink: null, shade: false }); g.fillStyle = P.alpha('#c4f0ff', 0.28); g.beginPath(); g.ellipse(0, -14, 22, 9, 0, 0, 7); g.fill();
  const N = 9, list = []; for (let i = 0; i < N; i++) { const a = i / N * 6.283; list.push([Math.cos(a) * 30, -14 + Math.sin(a) * 13, i]); } list.sort((a, b) => a[1] - b[1]); for (const [mx, my, i] of list) bigMush(g, mx, my, 0.3 + (i % 3) * 0.06, i % 2 ? 0 : 1, 50 + i); g.restore();
}
function rootBridge(g, x, y, s) {   // Root Bridge: a brook with a great root arched over it, planks laid on the root, mossy stones
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 80, 22);
  const B = form(g, [[-44, -4], [-30, -14], [-6, -17], [20, -13], [44, -6], [30, 3], [4, 6], [-26, 4]], C.water, { ...thin, shade: [[-20, -2], [36, -8], [44, -6], [30, 3], [4, 6], [-20, 4]], shadeCol: C.waterDeep }); g.save(); pathOf(g, B); g.clip(); g.strokeStyle = P.alpha(C.waterLight, 0.8); g.lineWidth = 1; for (const [wx, wy] of [[-24, -8], [-2, -3], [20, -7]]) { g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + 5, wy - 2, wx + 10, wy); g.stroke(); } g.restore();
  const Rt = [[-40, 2], [-22, -22], [18, -26], [42, 0]]; line(g, Rt, 13, PROP, { taper: 0.25, taper2: 0.25, flat: true }); line(g, Rt, 10.4, '#8a6246', { taper: 0.25, taper2: 0.25, flat: true }); line(g, [[-30, -8], [-14, -21], [16, -24], [34, -6]], 2, '#604230', { taper: 0.2 });
  for (let i = 0; i < 6; i++) { const t = (i + 1) / 7, u = 1 - t, bx = u * u * u * -40 + 3 * u * u * t * -22 + 3 * u * t * t * 18 + t * t * t * 42, by = u * u * u * 2 + 3 * u * u * t * -22 + 3 * u * t * t * -26 + t * t * t * 0; g.save(); g.translate(bx, by - 2); g.rotate((t - 0.5) * 1.1); form(g, [[-3, -4.5], [3, -4.5], [3, 4.5], [-3, 4.5]], C.wood, { ...thin, inkW: 0.9, shade: false, n: 4 }); g.restore(); }
  form(g, [[-24, -21], [-12, -28], [-4, -26], [-14, -19]], MOSS, { ...thin, inkW: 1, shade: false }); K.rock(g, -36, 4, 0.7, 73, 0); K.rock(g, 36, 4, 0.8, 74, 1); g.restore();
}
function owlTree(g, x, y, s) {   // Owl Hollow: a wide old tree with a round hollow, and a sleepy owl looking out of it, on the Knight's eye
  const q = P.rng(81); g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 76, 76);
  form(g, [[-20, 1], [-32, 3], [-18, -4], [-17, -30], [-15, -58], [15, -58], [17, -30], [18, -4], [32, 3], [20, 1]], C.trunk, { ...ink, shade: [[4, 1], [20, 1], [32, 3], [18, -4], [17, -30], [15, -58], [6, -58], [8, -26]], shadeCol: C.trunkShade }); for (const p of [[[-12, -8], [-12, -24]], [[13, -8], [12, -20]]]) bark(g, p);
  form(g, [[-11, -30], [-8, -42], [0, -46], [8, -42], [11, -30], [7, -20], [-7, -20]], '#2a2030', { ...ink, shade: false });
  form(g, [[-8, -21], [-8, -33], [0, -39], [8, -33], [8, -21]], '#a98a66', { ink: PROP, inkW: 1, shade: false }); for (const [ex, top] of [[-6, 1], [6, 1]]) form(g, [[ex - 2.2, -36], [ex, -41], [ex + 2.2, -36]], '#a98a66', { ink: PROP, inkW: 0.9, shade: false, n: 3 }); eyes(g, -1, -30, 0.5, { mood: 'smug', iris: '#d89a2a', lid: '#a98a66' }); form(g, [[-3.4, -27], [-1, -27], [-2, -24]], '#e8a53a', { ink: PROP, inkW: 0.7, shade: false, n: 3 });
  const cx = 0, cy = -76; canopy(g, cx, cy, [[cx - 24, cy + 8, 19], [cx - 2, cy - 10, 24], [cx + 24, cy + 6, 19], [cx, cy + 12, 17]], q, C.leaf2, C.leaf2Shade, C.leaf2Light); line(g, [[cx - 15, cy + 5], [cx, cy], [cx + 14, cy + 7]], 1, C.leaf2Shade, { taper: 0.3 });
  g.restore();
}
function gladeGate(g, x, y, s) {   // Grumblebark's Glade: two old trees that bend together into an arch with a scowl in their knots, thorn vines, a dark way through
  const q = P.rng(91); g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 100, 70);
  form(g, [[-22, 1], [-20, -26], [-10, -44], [10, -44], [20, -26], [22, 1]], '#2a2a40', { ink: null, shade: false }); g.fillStyle = P.alpha('#a070e0', 0.35); g.beginPath(); g.ellipse(0, -14, 16, 18, 0, 0, 7); g.fill();
  for (const d of [-1, 1]) { form(g, [[d * 20, 2], [d * 40, 3], [d * 32, -6], [d * 34, -34], [d * 22, -60], [d * 2, -74], [d * -6, -66], [d * 12, -52], [d * 22, -32], [d * 21, -12]], d < 0 ? '#6a4c44' : '#54383a', { ...ink, shade: false }); bark(g, [[d * 28, -6], [d * 28, -26], [d * 20, -48]], '#3a2830'); form(g, [[d * 26, 2], [d * 50, 4], [d * 28, -6]], d < 0 ? '#6a4c44' : '#54383a', { ...thin, shade: false }); }
  for (const [vx, vy, sc] of [[-30, -22, 1], [30, -36, 1], [-16, -50, 0.8], [18, -56, 0.8], [33, -12, 0.9]]) { for (const a of [0.8, 2.6, 4.4]) form(g, [[vx + Math.cos(a + 1.2) * 2, vy + Math.sin(a + 1.2) * 2], [vx + Math.cos(a) * 6 * sc, vy + Math.sin(a) * 6 * sc, 1], [vx + Math.cos(a - 1.2) * 2, vy + Math.sin(a - 1.2) * 2]], '#8a3a6e', { ink: PROP, inkW: 0.8, shade: false, n: 3 }); }
  g.fillStyle = '#2a2030'; g.beginPath(); g.ellipse(-27, -41, 4, 3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(27, -41, 4, 3, 0, 0, 7); g.fill(); g.fillStyle = '#e8d060'; g.beginPath(); g.arc(-26, -41, 1.3, 0, 7); g.fill(); g.beginPath(); g.arc(26, -41, 1.3, 0, 7); g.fill(); line(g, [[-33, -48], [-21, -44]], 2.2, '#3a2830', { taper: 0.2 }); line(g, [[33, -48], [21, -44]], 2.2, '#3a2830', { taper: 0.2 });
  const cx = 0, cy = -86; canopy(g, cx, cy, [[cx - 30, cy + 8, 17], [cx - 8, cy - 6, 20], [cx + 16, cy - 7, 19], [cx + 34, cy + 8, 15]], q, '#2c7e68', '#1a5a50', '#5ab890');
  g.restore();
}
function chapel(g, x, y, s) {   // Oakshade Church: the same church as every map's, standing under a great oak, with moss on its roof and ivy up its tower
  const q = P.rng(101); g.save(); g.translate(x, y); g.scale(s, s);
  form(g, [[34, -30], [46, -30], [44, -56], [36, -56]], C.trunk, { ...ink, shade: false }); const cx = 30, cy = -80; canopy(g, cx, cy, [[cx - 26, cy + 8, 20], [cx, cy - 10, 26], [cx + 26, cy + 6, 20], [cx, cy + 14, 18]], q);
  K.church(g, 0, 0, 1);
  for (const [mx, my, r] of [[24, -44, 5], [38, -38, 6], [30, -30, 4]]) form(g, [[mx - r, my + 1], [mx - r * 0.3, my - r * 0.5], [mx + r, my], [mx + r * 0.3, my + r * 0.6]], MOSS, { ink: PROP, inkW: 0.8, shade: false }); for (const [ix, iy] of [[-30, -4], [-27, -12], [-30, -20], [-26, -27], [-29, -34], [-12, -5], [-10, -13]]) { g.fillStyle = MOSSS; g.beginPath(); g.ellipse(ix, iy, 3.2, 2.5, 0.4, 0, 7); g.fill(); g.fillStyle = MOSS; g.beginPath(); g.ellipse(ix - 0.5, iy - 0.5, 2, 1.5, 0.4, 0, 7); g.fill(); }
  g.restore();
}
module.exports = { C, PROP, wobble, tall, bigMush, log, stump, roots, fern, bells, treeHouse, tumbletree, hollowLog, upsideTree, fungalRing, rootBridge, owlTree, gladeGate, chapel, MOSS, MOSSL, MOSSS, MUSH, canopy };
