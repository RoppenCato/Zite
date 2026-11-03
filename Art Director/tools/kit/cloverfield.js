// cloverfield.js: the Cloverfield Meadows board kit (Mitch, AD, 2026-11-01). Every piece is a function of where it stands,
// a variant and a seed, in the hero's inked hand: flat colour, one shade tone to the lower right, a small light on top, a
// tapered dark line, one cast shadow thrown to the lower right. The generator picks variants and seeds; each variant is
// later rendered once into the kit's atlas with its origin at the foot, so the game draws sprites, never vectors.
const P = require('../paint.js'); const I = require('../ink.js');
const { form, line, spline, pathOf, fill } = I;
const PROP = '#4a3324', INK = '#2a2030';
const C = { meadow: '#86cf5c', meadowShade: '#66b64a', clover: '#9fdb6a', worn: '#bfd36a', dirt: '#c9a86a', dirtShade: '#a98a52', chalk: '#efe8d4', chalkShade: '#cfc3a4', sand: '#e9d7a4',
            path: '#d9bb7e', pathLight: '#ecd49c', pathEdge: '#b4935a', pathShade: '#9c7d48', plate: '#efe4c8', plateShade: '#c9b990',
            leaf: '#5fc24e', leafShade: '#3b9238', leafLight: '#9ce36c', leaf2: '#4fb04a', leaf2Shade: '#2f7f33', leaf2Light: '#86d460', pine: '#3f9a4e', pineShade: '#2a6e3a', pineLight: '#6cc274', apple: '#6fc85a', appleShade: '#47993f', trunk: '#8f6338', trunkShade: '#5e3f22', bark: '#a8774a',
            bush: '#58b84f', bushShade: '#3a8c3a', bushLight: '#8fd86a', hedge: '#4ea845', hedgeShade: '#2f7a30', rock: '#bdb7a6', rockShade: '#857e6c', rockLight: '#e4dfd0', tuft: '#74c75a', tuftShade: '#4f9f44',
            water: '#55b3dc', waterDeep: '#3d93c0', waterLight: '#b8e7f6', foam: '#f6fcff', reed: '#6fae4a', reedShade: '#4a7f33', lily: '#73c66a',
            wall: '#f6efdc', wallShade: '#d9cdb0', timber: '#8a5a34', roofRed: '#d9604a', roofOrange: '#e8944e', roofBrown: '#a86f3e', thatch: '#d8b464', thatchShade: '#a98434', wood: '#b07a46', woodShade: '#7a5030', stone: '#c2bba8', stoneShade: '#8c8575', gold: '#f4c14a', glass: '#9fd3ec', glow: '#c8f2ff' };
const ink = { ink: PROP, inkW: 1.6 }, thin = { ink: PROP, inkW: 1.2 };
function cast(g, x, y, w, h, k = 1) { g.save(); g.fillStyle = 'rgba(28,38,70,0.2)'; g.translate(x, y); g.transform(1, 0, 0.5 * k, 0.4, 0, 0); g.beginPath(); g.ellipse(w * 0.2, -h * 0.45, w * 0.5, h * 0.5, 0, 0, 7); g.fill(); g.restore(); }
function contact(g, x, y, rx, ry) { g.fillStyle = 'rgba(28,38,70,0.18)'; g.beginPath(); g.ellipse(x + 2, y + 1, rx, ry, 0, 0, 7); g.fill(); }
const wob = (q, k) => 1 + (q() - 0.5) * k;
function lobes(cx, cy, spec, q, k = 0.14) {   // a canopy from overlapping lobes: one closed spline round their union, by sampling the outermost point per angle
  const pts = []; const n = 22;
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; let best = 0; for (const [lx, ly, lr] of spec) { const dx = cx + Math.cos(t) * 200 - lx, dy = cy + Math.sin(t) * 200 - ly; const px = lx - cx, py = ly - cy; const b = -(px * Math.cos(t) + py * Math.sin(t)); const c = px * px + py * py - lr * lr; const disc = b * b - c; if (disc >= 0) { const r = -b + Math.sqrt(disc); if (r > best) best = r; } } pts.push([cx + Math.cos(t) * best * wob(q, k), cy + Math.sin(t) * best * wob(q, k)]); }
  return pts;
}
// ---------------------------------------------------------------- trees: five designs, each with controlled variation from its seed
function oak(g, x, y, s, seed) {   // broad, three lobes, a thick trunk with a fork, roots that flare
  const q = P.rng(seed), k = s * (0.9 + q() * 0.25), lean = (q() - 0.5) * 6; g.save(); g.translate(x, y); g.scale(k, k); cast(g, 0, 0, 56, 60);
  form(g, [[-7, 0], [7, 0], [5, -14], [9, -24], [4, -26], [1, -18], [-3, -26], [-8, -24], [-5, -14]], C.trunk, { ...ink, shade: [[0, 0], [7, 0], [5, -14], [9, -24], [4, -26], [1, -18], [0, -14]], shadeCol: C.trunkShade });
  for (const sx of [-1, 1]) form(g, [[sx * 6, -2], [sx * 12, 0], [sx * 7, 1]], C.trunk, { ...thin, shade: false });
  const cx = lean, cy = -44, L = lobes(cx, cy, [[cx - 14, cy + 4, 15], [cx + 2, cy - 8, 17], [cx + 16, cy + 4, 14], [cx - 2, cy + 8, 13]], q);
  form(g, L, C.leaf, { ...ink, shade: [[cx - 2, cy + 2], [cx + 32, cy - 2], [cx + 30, cy + 22], [cx - 16, cy + 22]], shadeCol: C.leafShade, glint: [[cx - 18, cy - 10], [cx - 2, cy - 22], [cx + 8, cy - 14], [cx - 12, cy - 2]], glintCol: C.leafLight, glintA: 0.55 });
  line(g, [[cx - 10, cy + 6], [cx - 2, cy + 2], [cx + 6, cy + 8]], 1.0, C.leafShade, { taper: 0.3 });   // one inner lobe line
  g.restore();
}
function poplar(g, x, y, s, seed) {   // tall and narrow, a pointed top, a slim trunk
  const q = P.rng(seed), k = s * (0.9 + q() * 0.25), lean = (q() - 0.5) * 4; g.save(); g.translate(x, y); g.scale(k, k); cast(g, 0, 0, 30, 76);
  form(g, [[-3.5, 0], [3.5, 0], [2.5, -22], [-2.5, -22]], C.trunk, { ...thin, shade: [[0, 0], [3.5, 0], [2.5, -22], [0, -22]], shadeCol: C.trunkShade });
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, yy = -20 - t * 56, w = 13 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 2; pts.push([lean * t + w * wob(q, 0.25), yy]); } for (let i = 10; i >= 0; i--) { const t = i / 10, yy = -20 - t * 56, w = 13 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 2; pts.push([lean * t - w * wob(q, 0.25), yy]); }
  form(g, pts, C.leaf2, { ...ink, shade: [[lean, -30], [lean + 16, -50], [lean + 4, -76], [lean + 2, -30]], shadeCol: C.leaf2Shade, glint: [[lean - 8, -40], [lean - 2, -64], [lean + 1, -56], [lean - 5, -36]], glintCol: C.leaf2Light, glintA: 0.5 });
  g.restore();
}
function appleTree(g, x, y, s, seed) {   // low and round, a short forked trunk, fruit on the lit side
  const q = P.rng(seed), k = s * (0.9 + q() * 0.2); g.save(); g.translate(x, y); g.scale(k, k); cast(g, 0, 0, 44, 42);
  form(g, [[-5, 0], [5, 0], [4, -10], [8, -16], [5, -17], [1, -12], [-4, -17], [-7, -16], [-4, -10]], C.trunk, { ...thin, shade: [[0, 0], [5, 0], [4, -10], [8, -16], [5, -17], [1, -12], [0, -10]], shadeCol: C.trunkShade });
  const cy = -30, L = lobes(0, cy, [[-10, cy + 2, 13], [8, cy - 2, 14], [0, cy - 8, 12], [2, cy + 7, 11]], q);
  form(g, L, C.apple, { ...ink, shade: [[-2, cy + 2], [24, cy - 2], [22, cy + 18], [-14, cy + 18]], shadeCol: C.appleShade, glint: [[-14, cy - 8], [-2, cy - 18], [6, cy - 12], [-10, cy - 2]], glintCol: C.leafLight, glintA: 0.45 });
  for (let i = 0; i < 5; i++) { const fx = -14 + q() * 24, fy = cy - 12 + q() * 20; g.fillStyle = '#e8453c'; g.beginPath(); g.arc(fx, fy, 2, 0, 7); g.fill(); g.strokeStyle = PROP; g.lineWidth = 0.8; g.stroke(); g.fillStyle = '#ff9a90'; g.beginPath(); g.arc(fx - 0.6, fy - 0.7, 0.7, 0, 7); g.fill(); }
  g.restore();
}
function pine(g, x, y, s, seed) {   // three tiers, a straight trunk
  const q = P.rng(seed), k = s * (0.9 + q() * 0.25); g.save(); g.translate(x, y); g.scale(k, k); cast(g, 0, 0, 34, 70);
  form(g, [[-3, 0], [3, 0], [2, -16], [-2, -16]], C.trunk, { ...thin, shade: false });
  for (const [ty, tw, th] of [[-14, 18, 20], [-28, 15, 18], [-42, 11, 18]]) form(g, [[-tw * wob(q, 0.2), ty], [-tw * 0.45, ty - 4], [-tw * 0.55, ty - 2], [-tw * 0.2, ty - th * 0.6], [0, ty - th], [tw * 0.2, ty - th * 0.6], [tw * 0.55, ty - 2], [tw * 0.45, ty - 4], [tw * wob(q, 0.2), ty]], C.pine, { ...ink, shade: [[0, ty - th * 0.4], [tw, ty], [tw * 0.2, ty], [0, ty - 2]], shadeCol: C.pineShade, glint: [[-tw * 0.5, ty - 4], [-tw * 0.1, ty - th * 0.7], [0, ty - th * 0.5], [-tw * 0.3, ty - 2]], glintCol: C.pineLight, glintA: 0.4 });
  g.restore();
}
function gnarledOak(g, x, y, s, seed) {   // the landmark tree: twice an oak, a hollow, a heavy limb, roots
  const q = P.rng(seed); g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 84, 84, 1.1);
  form(g, [[-12, 0], [12, 0], [9, -14], [16, -26], [24, -34], [20, -36], [10, -30], [4, -36], [-2, -30], [-10, -38], [-14, -34], [-8, -24], [-9, -14]], C.trunk, { ...ink, shade: [[0, 0], [12, 0], [9, -14], [16, -26], [24, -34], [20, -36], [10, -30], [4, -36], [0, -30], [0, -14]], shadeCol: C.trunkShade });
  for (const sx of [-1, 1]) form(g, [[sx * 10, -3], [sx * 20, 1], [sx * 11, 2]], C.trunk, { ...thin, shade: false });
  form(g, [[-4, -10], [2, -12], [3, -20], [-3, -20]], C.trunkShade, { ...thin, shade: false });   // the hollow
  const cy = -62, L = lobes(0, cy, [[-24, cy + 6, 20], [2, cy - 12, 24], [26, cy + 4, 20], [0, cy + 12, 18], [-10, cy - 4, 18]], q, 0.12);
  form(g, L, C.leaf, { ...ink, inkW: 1.9, shade: [[-2, cy + 2], [48, cy - 2], [44, cy + 30], [-24, cy + 30]], shadeCol: C.leafShade, glint: [[-26, cy - 14], [-4, cy - 32], [12, cy - 22], [-16, cy - 4]], glintCol: C.leafLight, glintA: 0.5 });
  line(g, [[-16, cy + 10], [-4, cy + 2], [10, cy + 12]], 1.1, C.leafShade, { taper: 0.3 }); line(g, [[6, cy - 10], [18, cy - 2]], 1.0, C.leafShade, { taper: 0.3 });
  g.restore();
}
const TREES = { oak, poplar, apple: appleTree, pine, gnarled: gnarledOak };
// ---------------------------------------------------------------- bushes, rocks, ground details
function bush(g, x, y, s, seed, v = 0) {
  const q = P.rng(seed), k = s * (0.9 + q() * 0.2); g.save(); g.translate(x, y); g.scale(k, k); contact(g, 0, 0, 16, 5);
  const L = v ? lobes(0, -7, [[-12, -5, 8], [0, -10, 9], [12, -5, 8]], q, 0.12) : lobes(0, -9, [[-8, -7, 9], [6, -11, 10], [4, -3, 8]], q, 0.14);
  form(g, L, C.bush, { ...thin, shade: [[-2, -6], [20, -8], [18, 2], [-10, 2]], shadeCol: C.bushShade, glint: [[-10, -14], [-2, -18], [2, -13], [-8, -9]], glintCol: C.bushLight, glintA: 0.5 }); g.restore();
}
function rock(g, x, y, s, seed, v = 0) {
  const q = P.rng(seed); g.save(); g.translate(x, y); g.scale(s, s); contact(g, 0, 0, 12, 4);
  const shapes = [[[-10, 0], [-9, -6], [-3, -10], [5, -9], [10, -3], [9, 0]], [[-12, 0], [-10, -5], [-4, -7], [0, -4], [3, -9], [9, -8], [12, 0]], [[-6, 0], [-5, -4], [0, -6], [5, -4], [6, 0]]];
  const S = shapes[v % 3].map(([a, b]) => [a * wob(q, 0.15), b * wob(q, 0.15)]);
  form(g, S, C.rock, { ...thin, shade: [[0, -5], [12, -3], [12, 0], [-2, 0]], shadeCol: C.rockShade, glint: [[-7, -6], [-3, -9], [-1, -6], [-6, -4]], glintCol: C.rockLight, glintA: 0.6 });
  if (v === 1) line(g, [[-2, -7], [1, -2]], 0.9, C.rockShade, { taper: 0.3 }); g.restore();
}
function tuft(g, x, y, s, seed) { const q = P.rng(seed); g.save(); g.translate(x, y); g.scale(s, s); const n = 4 + Math.floor(q() * 3); const pts = [[-7, 0]]; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, bx = -7 + t * 14; pts.push([bx - 2, -1], [bx + (q() - 0.5) * 4, -6 - q() * 6, 1]); } pts.push([7, 0]); form(g, pts, C.tuft, { ink: P.alpha(PROP, 0.8), inkW: 1.0, shade: [[0, -3], [7, -2], [7, 0], [0, 0]], shadeCol: C.tuftShade }); g.restore(); }
function flowers(g, x, y, seed, s = 1, n = 5) { const q = P.rng(seed); const cols = ['#ff7a9a', '#ffe066', '#ffffff', '#ffa94d', '#c9a0ff']; for (let i = 0; i < n; i++) { const fx = x + (q() - 0.5) * 18 * s, fy = y + (q() - 0.5) * 8 * s, c = cols[Math.floor(q() * cols.length)]; g.strokeStyle = C.tuftShade; g.lineWidth = 0.8; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy + 3 * s); g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(fx, fy, 1.7 * s, 0, 7); g.fill(); g.fillStyle = '#ffd86a'; g.beginPath(); g.arc(fx, fy, 0.6 * s, 0, 7); g.fill(); } }
function cloverPatch(g, x, y, s, seed) { const q = P.rng(seed); const L = []; for (let i = 0; i < 9; i++) { const t = i / 9 * 6.283; L.push([x + Math.cos(t) * 16 * s * wob(q, 0.5), y + Math.sin(t) * 7 * s * wob(q, 0.5)]); } fill(g, spline(L, true, 6), C.clover); for (let i = 0; i < 4; i++) { const cx = x + (q() - 0.5) * 22 * s, cy = y + (q() - 0.5) * 8 * s; g.fillStyle = '#7fc455'; for (const a of [0, 2.1, 4.2]) { g.beginPath(); g.arc(cx + Math.cos(a) * 1.3, cy + Math.sin(a) * 1.3, 1.2, 0, 7); g.fill(); } } }
function pebbles(g, x, y, seed, n = 4) { const q = P.rng(seed); for (let i = 0; i < n; i++) { const px = x + (q() - 0.5) * 16, py = y + (q() - 0.5) * 6; g.fillStyle = C.rock; g.beginPath(); g.ellipse(px, py, 1.6, 1.1, 0, 0, 7); g.fill(); g.strokeStyle = P.alpha(PROP, 0.7); g.lineWidth = 0.6; g.stroke(); } }
function wornPatch(g, x, y, rx, ry, seed, col = C.worn) { const q = P.rng(seed); const L = []; for (let i = 0; i < 10; i++) { const t = i / 10 * 6.283; L.push([x + Math.cos(t) * rx * wob(q, 0.4), y + Math.sin(t) * ry * wob(q, 0.4)]); } for (let k = 2; k >= 0; k--) { g.save(); g.globalAlpha = 0.35; g.translate(x, y); g.scale(1 + k * 0.12, 1 + k * 0.12); g.translate(-x, -y); fill(g, spline(L, true, 6), col); g.restore(); } }
function mushroom(g, x, y, s, seed) { const q = P.rng(seed); g.save(); g.translate(x, y); g.scale(s, s); form(g, [[-2, 0], [2, 0], [1.8, -5], [-1.8, -5]], '#f3ead6', { ink: P.alpha(PROP, 0.8), inkW: 0.9, shade: false }); form(g, [[-6, -5], [6, -5], [4, -9], [0, -10.5], [-4, -9]], q() > 0.5 ? '#e8503e' : '#d9a05a', { ink: P.alpha(PROP, 0.9), inkW: 1.0, shade: [[0, -7], [6, -5], [0, -5]], shadeCol: '#9a3a2a' }); g.fillStyle = '#fff4e0'; g.beginPath(); g.arc(-2, -8, 1, 0, 7); g.fill(); g.restore(); }
// ---------------------------------------------------------------- the landmarks' pieces
function house(g, x, y, s, v, seed) {   // v 0: gabled tile roof; v 1: round thatch; v 2: tall with a loft; each with a door, windows, shutters, a chimney
  const q = P.rng(seed), roof = [C.roofRed, C.thatch, C.roofOrange][v], roofShade = [P.darken(C.roofRed, 0.25), C.thatchShade, P.darken(C.roofOrange, 0.25)][v], wh = v === 2 ? 20 : 15, ww = v === 1 ? 17 : 15;
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, ww * 2.4, wh + 20);
  form(g, [[-ww, 0], [ww, 0], [ww, -wh], [-ww, -wh]], C.wall, { ...ink, shade: [[3, -wh], [ww, -wh], [ww, 0], [3, 0]], shadeCol: C.wallShade });
  for (const tx of [-ww + 3, ww - 3]) line(g, [[tx, -1], [tx, -wh + 1]], 1.1, C.timber, { taper: 0.1 });
  form(g, [[-3.5, 0], [3.5, 0], [3.5, -8], [0, -10], [-3.5, -8]], C.woodShade, { ...thin, shade: false }); g.fillStyle = C.gold; g.beginPath(); g.arc(2, -4.5, 0.7, 0, 7); g.fill();
  for (const wx of [-ww + 7.5, ww - 7.5]) { form(g, [[wx - 3, -6], [wx + 3, -6], [wx + 3, -11], [wx - 3, -11]], C.glass, { ...thin, inkW: 1.0, shade: false }); line(g, [[wx, -6], [wx, -11]], 0.6, PROP, { taper: 0.1 }); form(g, [[wx - 5, -5], [wx - 3.2, -5], [wx - 3.2, -12], [wx - 5, -12]], C.woodShade, { ink: null, shade: false }); form(g, [[wx + 3.2, -5], [wx + 5, -5], [wx + 5, -12], [wx + 3.2, -12]], C.woodShade, { ink: null, shade: false }); form(g, [[wx - 4, -5], [wx + 4, -5], [wx + 4, -3.5], [wx - 4, -3.5]], C.timber, { ink: null, shade: false }); for (let i = 0; i < 3; i++) { g.fillStyle = ['#ff7a9a', '#ffe066', '#ffffff'][i]; g.beginPath(); g.arc(wx - 2 + i * 2, -4.6, 0.9, 0, 7); g.fill(); } }   // flower boxes
  if (v === 1) { const pts = [[-ww - 3, -wh + 1], [ww + 3, -wh + 1], [ww + 1, -wh - 6], [ww * 0.5, -wh - 13], [0, -wh - 15], [-ww * 0.5, -wh - 13], [-ww - 1, -wh - 6]]; form(g, pts, roof, { ...ink, shade: [[0, -wh], [ww + 3, -wh + 1], [ww + 1, -wh - 6], [ww * 0.5, -wh - 13], [0, -wh - 15]], shadeCol: roofShade, glint: [[-ww, -wh - 3], [-ww * 0.5, -wh - 11], [-ww * 0.3, -wh - 8], [-ww + 2, -wh - 2]], glintA: 0.3 }); for (let i = 0; i < 4; i++) line(g, [[-ww + 4 + i * 8, -wh - 2], [-ww + 7 + i * 8, -wh - 8]], 0.8, C.thatchShade, { taper: 0.3 }); }
  else { const pk = v === 2 ? 18 : 15; form(g, [[-ww - 3, -wh + 1], [ww + 3, -wh + 1], [ww * 0.55, -wh - pk], [-ww * 0.55, -wh - pk]], roof, { ...ink, shade: [[0, -wh], [ww + 3, -wh + 1], [ww * 0.55, -wh - pk], [0, -wh - pk]], shadeCol: roofShade, glint: [[-ww, -wh - 2], [-ww * 0.4, -wh - pk + 2], [-ww * 0.25, -wh - pk + 5], [-ww + 2, -wh - 1]], glintA: 0.3 }); for (let i = 1; i < 4; i++) line(g, [[-ww - 2 + i * 2, -wh + 1 - i * 4], [ww + 2 - i * 2, -wh + 1 - i * 4]], 0.7, roofShade, { taper: 0.05 }); if (v === 2) { form(g, [[-4, -wh - 4], [4, -wh - 4], [4, -wh - 10], [0, -wh - 13], [-4, -wh - 10]], C.wall, { ...thin, inkW: 1.0, shade: false }); form(g, [[-2, -wh - 5], [2, -wh - 5], [2, -wh - 9], [-2, -wh - 9]], C.glass, { ink: null, shade: false }); } }
  const chx = v === 1 ? ww * 0.4 : ww * 0.35, chy = v === 1 ? -wh - 9 : -wh - 8; form(g, [[chx - 2.5, chy], [chx + 2.5, chy], [chx + 2.5, chy - 8], [chx - 2.5, chy - 8]], C.stone, { ...thin, inkW: 1.0, shade: [[chx, chy - 8], [chx + 2.5, chy - 8], [chx + 2.5, chy], [chx, chy]], shadeCol: C.stoneShade });
  if (q() > 0.4) for (let i = 0; i < 3; i++) { g.fillStyle = P.alpha('#ffffff', 0.55 - i * 0.15); g.beginPath(); g.arc(chx + 2 + i * 3, chy - 12 - i * 4, 2.2 + i, 0, 7); g.fill(); }   // smoke
  g.restore();
}
function fence(g, x, y, len, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); const n = Math.max(2, Math.round(len / 10)); for (let i = 0; i <= n; i++) { const px = i / n * len; form(g, [[px - 1.3, 0], [px + 1.3, 0], [px + 1.3, -8], [px, -9.5], [px - 1.3, -8]], C.wood, { ink: P.alpha(PROP, 0.9), inkW: 0.9, shade: false }); } for (const ry of [-3, -6.5]) line(g, [[0, ry], [len, ry]], 1.6, C.wood, { taper: 0.02 }); line(g, [[0, -6.5], [len, -6.5]], 0.6, PROP, { taper: 0.02 }); g.restore(); }
function barrel(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); contact(g, 0, 0, 5, 2); form(g, [[-4, 0], [4, 0], [4.6, -5], [4, -10], [-4, -10], [-4.6, -5]], C.wood, { ...thin, inkW: 1.0, shade: [[1, -10], [4, -10], [4.6, -5], [4, 0], [1, 0]], shadeCol: C.woodShade }); for (const ry of [-2.5, -7.5]) line(g, [[-4.4, ry], [4.4, ry]], 0.9, C.stoneShade, { taper: 0.05 }); g.restore(); }
function well(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 20, 24); form(g, [[-8, 0], [8, 0], [8, -7], [-8, -7]], C.stone, { ...thin, shade: [[1, -7], [8, -7], [8, 0], [1, 0]], shadeCol: C.stoneShade }); for (const [sx, sy] of [[-7, -3], [-2, -5], [3, -2], [6, -5]]) line(g, [[sx, sy], [sx + 3, sy]], 0.6, C.stoneShade, { taper: 0.2 }); for (const px of [-6, 6]) form(g, [[px - 1.2, -7], [px + 1.2, -7], [px + 1.2, -18], [px - 1.2, -18]], C.wood, { ink: P.alpha(PROP, 0.9), inkW: 0.9, shade: false }); form(g, [[-9, -17], [9, -17], [0, -23]], C.roofBrown, { ...thin, inkW: 1.0, shade: [[0, -17], [9, -17], [0, -23]], shadeCol: P.darken(C.roofBrown, 0.3) }); g.fillStyle = C.woodShade; g.fillRect(-1, -14, 2, 5); g.restore(); }
function sack(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); form(g, [[-4, 0], [4, 0], [4.5, -5], [2, -8], [-2, -8], [-4.5, -5]], C.sand, { ...thin, inkW: 0.9, shade: [[0, -8], [4.5, -5], [4, 0], [0, 0]], shadeCol: '#c4ad7a' }); line(g, [[-2.5, -7.5], [2.5, -7.5]], 0.8, C.woodShade, { taper: 0.2 }); g.restore(); }
function signpost(g, x, y, s, arms = 1) {   // a slim post with flat planks that end in a point, each with one grain line
  g.save(); g.translate(x, y); g.scale(s, s); contact(g, 0, 0, 4, 1.6); form(g, [[-1.3, 0, 1], [1.3, 0, 1], [1.3, -27, 1], [-1.3, -27, 1]], C.wood, { ink: PROP, inkW: 1.0, shade: false, n: 2 });
  for (let i = 0; i < arms; i++) { const ay = -26 + i * 6.5, dir = i % 2 ? -1 : 1, len = 13 - i; form(g, [[-3 * dir, ay, 1], [dir * len, ay, 1], [dir * (len + 3.5), ay + 2.4, 1], [dir * len, ay + 4.8, 1], [-3 * dir, ay + 4.8, 1]], i === 1 ? C.bark : C.wood, { ink: PROP, inkW: 1.0, shade: false, n: 2 }); line(g, [[-1 * dir, ay + 2.4], [dir * (len - 2), ay + 2.4]], 0.6, C.woodShade, { taper: 0.1 }); }
  g.restore();
}
function hill(g, x, y, s) {   // a low plateau a landmark stands on: a chalk face on its near side, a lighter top, a soft shadow on the ground below; the foot is the bottom centre, the top's centre 34 above it
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(28,38,70,0.16)'; g.beginPath(); g.ellipse(6, -6, 68, 13, 0, 0, 7); g.fill();
  const top = [[-62, -36], [-46, -54], [-12, -62], [28, -60], [56, -46], [62, -32], [44, -18], [4, -14], [-40, -20]];
  form(g, top.map(([a, b]) => [a * 1.02, b + 12]), C.chalk, { ink: PROP, inkW: 1.4, shade: [[-10, -14], [60, -20], [46, -6], [-30, -8]], shadeCol: C.chalkShade });
  for (const [lx, ly] of [[-40, -14], [-20, -9], [6, -8], [28, -11], [46, -18]]) line(g, [[lx, ly], [lx + 2, ly + 5]], 0.9, C.chalkShade, { taper: 0.3 });
  form(g, top, '#92d868', { ink: PROP, inkW: 1.2, shade: false }); K_clover(g); g.restore();
}
function K_clover(g) { cloverPatch(g, -24, -38, 0.8, 91); cloverPatch(g, 26, -32, 0.7, 92); }
function windmill(g, x, y, s, turn = 0.5) {   // a tapered stone tower, a door with sacks, a window, a gallery fence round the base, lattice sails
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 40, 84, 1.1);
  form(g, [[-14, 0], [14, 0], [9, -52], [-9, -52]], C.chalk, { ...ink, inkW: 1.8, shade: [[1, -52], [9, -52], [14, 0], [1, 0]], shadeCol: C.chalkShade, glint: [[-12, -6], [-7, -6], [-6, -46], [-8, -46]], glintA: 0.35 });
  for (const ry of [-14, -28, -42]) line(g, [[-12 + (52 + ry) * 0.08, ry], [12 - (52 + ry) * 0.08, ry]], 0.7, C.chalkShade, { taper: 0.05 });
  form(g, [[-11, -51], [11, -51], [0, -64]], C.roofBrown, { ...ink, shade: [[0, -51], [11, -51], [0, -64]], shadeCol: P.darken(C.roofBrown, 0.3) });
  form(g, [[-4, 0], [4, 0], [4, -9], [0, -11.5], [-4, -9]], C.woodShade, { ...thin, shade: false }); form(g, [[-3, -30], [3, -30], [3, -35], [0, -37], [-3, -35]], C.glass, { ...thin, inkW: 1.0, shade: false });
  g.save(); g.translate(0, -56); g.rotate(turn); for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); form(g, [[-1.6, 0], [1.6, 0], [1.6, -36], [-1.6, -36]], C.wood, { ...thin, inkW: 1.1, shade: false }); form(g, [[1.6, -8], [8, -10], [8.5, -34], [1.6, -34]], C.wall, { ...thin, inkW: 1.0, shade: [[5, -10], [8, -10], [8.5, -34], [5, -34]], shadeCol: C.wallShade }); for (let k = 1; k < 5; k++) line(g, [[1.6, -8 - k * 5.2], [8.2, -10 - k * 5]], 0.5, C.timber, { taper: 0.05 }); g.restore(); } g.fillStyle = C.gold; g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill(); g.strokeStyle = PROP; g.lineWidth = 1; g.stroke(); g.restore();
  sack(g, 10, 1, 0.9); sack(g, 17, 0, 0.8); g.restore();
}
function oldMill(g, x, y, s) {   // stone and timber, a mossy roof, the wheel on its side in the brook, a cracked wall
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 50, 36);
  form(g, [[-16, 0], [16, 0], [16, -18], [-16, -18]], C.stone, { ...ink, shade: [[3, -18], [16, -18], [16, 0], [3, 0]], shadeCol: C.stoneShade });
  for (const [sx, sy] of [[-14, -4], [-8, -9], [-13, -14], [2, -4], [9, -12], [-3, -15]]) line(g, [[sx, sy], [sx + 4, sy]], 0.6, C.stoneShade, { taper: 0.2 }); line(g, [[-6, -17], [-4, -10], [-7, -5]], 0.8, C.stoneShade, { taper: 0.2 });   // the crack
  form(g, [[-3.5, 0], [3.5, 0], [3.5, -9], [-3.5, -9]], C.woodShade, { ...thin, shade: false }); form(g, [[7, -8], [12, -8], [12, -13], [7, -13]], C.glass, { ...thin, inkW: 1.0, shade: false });
  form(g, [[-19, -17], [19, -17], [12, -32], [-12, -32]], C.roofBrown, { ...ink, shade: [[0, -17], [19, -17], [12, -32], [0, -32]], shadeCol: P.darken(C.roofBrown, 0.3) });
  form(g, [[-17, -18], [-4, -18], [-2, -24], [-9, -28], [-14, -24]], '#7fb356', { ink: null, shade: false }); form(g, [[4, -20], [13, -19], [9, -27], [3, -25]], '#7fb356', { ink: null, shade: false });   // moss
  g.translate(24, 2); form(g, [[-4, 0], [4, 0], [4, -16], [-4, -16]], C.timber, { ...thin, inkW: 1.0, shade: false });   // the axle post
  g.strokeStyle = C.woodShade; g.lineWidth = 5; g.beginPath(); g.arc(0, -14, 13, 0, 7); g.stroke(); g.strokeStyle = PROP; g.lineWidth = 1.3; g.beginPath(); g.arc(0, -14, 15.5, 0, 7); g.stroke(); g.beginPath(); g.arc(0, -14, 10.5, 0, 7); g.stroke();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.strokeStyle = C.wood; g.lineWidth = 1.8; g.beginPath(); g.moveTo(Math.cos(a) * 10.5, -14 + Math.sin(a) * 10.5); g.lineTo(Math.cos(a) * -10.5, -14 + Math.sin(a) * -10.5); g.stroke(); g.strokeStyle = PROP; g.lineWidth = 0.6; g.stroke(); }
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillStyle = C.wood; g.fillRect(Math.cos(a) * 13 - 1.5, -14 + Math.sin(a) * 13 - 1.5, 3, 3); }
  g.fillStyle = C.gold; g.beginPath(); g.arc(0, -14, 2, 0, 7); g.fill(); g.restore();
}
function pond(g, x, y, rx, ry, seed) {   // a sandy shore with stones, reeds in clumps, lily pads, ripples, three ducks
  const q = P.rng(seed), shore = []; for (let i = 0; i < 14; i++) { const t = i / 14 * 6.283; shore.push([x + Math.cos(t) * (rx + 6) * wob(q, 0.12), y + Math.sin(t) * (ry + 4) * wob(q, 0.12)]); }
  form(g, shore, C.sand, { ink: null, shade: false });
  const S = form(g, shore.map(([a, b]) => [x + (a - x) * 0.88, y + (b - y) * 0.86]), C.water, { ...thin, inkW: 1.3, shade: [[x - rx * 0.1, y - ry * 0.4], [x + rx, y - ry * 0.4], [x + rx, y + ry], [x - rx * 0.5, y + ry]], shadeCol: C.waterDeep, shadeA: 0.55 });
  g.save(); pathOf(g, S); g.clip(); g.fillStyle = P.alpha(C.waterLight, 0.45); g.beginPath(); g.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.5, ry * 0.4, -0.3, 0, 7); g.fill(); for (let i = 0; i < 3; i++) line(g, [[x - rx * 0.5 + i * 10, y + i * 5], [x - rx * 0.2 + i * 10, y - 1 + i * 5], [x + i * 10, y + i * 5]], 0.8, C.waterLight, { taper: 0.3 }); g.restore();
  for (const [dx, dy] of [[-rx * 0.5, ry * 0.3], [rx * 0.35, -ry * 0.1]]) { form(g, [[x + dx - 4, y + dy], [x + dx, y + dy - 2.6], [x + dx + 4, y + dy], [x + dx + 1, y + dy + 2.2], [x + dx - 2, y + dy + 2.2]], C.lily, { ink: P.alpha(PROP, 0.8), inkW: 0.8, shade: false }); g.fillStyle = '#ff9ab8'; g.beginPath(); g.arc(x + dx + 1, y + dy - 0.5, 1.2, 0, 7); g.fill(); }
  for (const [dx, dy, n] of [[-rx * 0.9, -ry * 0.3, 5], [rx * 0.8, ry * 0.5, 4], [rx * 0.2, -ry * 1.05, 4]]) for (let i = 0; i < n; i++) { const bx = x + dx + i * 3 - 4, by = y + dy; line(g, [[bx, by + 3], [bx + (q() - 0.5) * 3, by - 7 - q() * 5]], 1.3, i % 2 ? C.reed : C.reedShade, { taper: 0.05, taper2: 0.6 }); if (i % 2) { g.fillStyle = '#8a5a3a'; g.beginPath(); g.ellipse(bx + 0.5, by - 8, 1, 2.2, 0, 0, 7); g.fill(); } }
  for (const [dx, dy, v] of [[-rx * 0.95, ry * 0.7, 2], [rx * 0.6, -ry * 0.9, 0], [rx * 0.95, ry * 0.2, 2]]) rock(g, x + dx, y + dy, 0.6, seed + v, v);
  for (const [dx, dy] of [[-8, 1], [6, -4], [2, 6]]) { g.save(); g.translate(x + dx, y + dy); form(g, [[-3.5, 0], [3.5, 0], [2.5, -2.5], [0, -3], [-2, -2.5]], '#fff8e8', { ink: P.alpha(PROP, 0.9), inkW: 0.8, shade: false }); form(g, [[2, -2.5], [4, -2.5], [4.5, -5], [2.5, -5.5], [1.5, -4]], '#fff8e8', { ink: P.alpha(PROP, 0.9), inkW: 0.8, shade: false }); g.fillStyle = C.roofOrange; g.fillRect(4.2, -4.6, 1.6, 1.1); g.fillStyle = PROP; g.fillRect(3, -5, 0.8, 0.8); g.restore(); }
}
function spring(g, x, y, s = 1) {   // a stone basin with clear water, a small mossy arch, flowers, a soft sparkle
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = P.alpha(C.glow, 0.25); g.beginPath(); g.ellipse(0, -3, 20, 11, 0, 0, 7); g.fill();
  form(g, [[-12, 2], [12, 2], [13, -2], [11, -5], [-11, -5], [-13, -2]], C.stone, { ...thin, shade: [[0, -5], [11, -5], [13, -2], [12, 2], [0, 2]], shadeCol: C.stoneShade });
  form(g, [[-9, -3], [9, -3], [8, -6], [-8, -6]], C.water, { ink: P.alpha(PROP, 0.7), inkW: 0.9, shade: false }); g.fillStyle = P.alpha(C.waterLight, 0.8); g.beginPath(); g.ellipse(-3, -4.5, 3.5, 1, 0, 0, 7); g.fill();
  form(g, [[-9, -5], [-5, -5], [-5, -14], [-2, -17], [2, -17], [5, -14], [5, -10], [2, -10], [1, -13], [-1, -13], [-2, -10], [-2, -5]], C.stone, { ...thin, inkW: 1.1, shade: [[-2, -14], [2, -17], [5, -14], [5, -10], [2, -10]], shadeCol: C.stoneShade });   // the arch the water comes from
  line(g, [[0, -12], [0, -7]], 1.4, C.waterLight, { taper: 0.1, taper2: 0.4 }); form(g, [[-9, -8], [-5, -9], [-4, -13], [-8, -13]], '#7fb356', { ink: null, shade: false });
  flowers(g, -13, -6, 77, 0.9, 4); flowers(g, 13, -6, 78, 0.9, 4);
  for (const [sx, sy, r] of [[-6, -20, 2.2], [9, -15, 1.6], [3, -22, 1.2]]) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(sx, sy - r); g.lineTo(sx + r * 0.35, sy - r * 0.35); g.lineTo(sx + r, sy); g.lineTo(sx + r * 0.35, sy + r * 0.35); g.lineTo(sx, sy + r); g.lineTo(sx - r * 0.35, sy + r * 0.35); g.lineTo(sx - r, sy); g.lineTo(sx - r * 0.35, sy - r * 0.35); g.closePath(); g.fill(); }
  g.restore();
}
function shrine(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 16, 26); form(g, [[-8, 0], [8, 0], [6, -4], [-6, -4]], C.stone, { ...thin, shade: false }); form(g, [[-4, -4], [4, -4], [4, -18], [-4, -18]], C.stone, { ...thin, shade: [[0, -18], [4, -18], [4, -4], [0, -4]], shadeCol: C.stoneShade }); form(g, [[-8, -18], [8, -18], [0, -26]], C.roofBrown, { ...thin, shade: false }); g.fillStyle = '#ffe28a'; g.beginPath(); g.arc(0, -11, 2.2, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,120,0.3)'; g.beginPath(); g.arc(0, -11, 6, 0, 7); g.fill(); g.restore(); }
function chest(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); contact(g, 0, 0, 8, 3); form(g, [[-7, 0], [7, 0], [7, -7], [-7, -7]], C.wood, { ...thin, shade: [[0, -7], [7, -7], [7, 0], [0, 0]], shadeCol: C.woodShade }); form(g, [[-7, -7], [7, -7], [6, -11], [-6, -11]], C.woodShade, { ...thin, shade: false }); for (const ry of [-2, -9.5]) line(g, [[-7, ry], [7, ry]], 1, C.gold, { taper: 0.05 }); g.fillStyle = C.gold; g.fillRect(-1.5, -8.5, 3, 3); g.restore(); }
function gate(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 34, 36); for (const sx of [-1, 1]) { form(g, [[sx * 15 - 4.5, 0], [sx * 15 + 4.5, 0], [sx * 15 + 3.5, -26], [sx * 15 - 3.5, -26]], C.stone, { ...ink, shade: [[sx * 15, -26], [sx * 15 + 4.5, -26], [sx * 15 + 4.5, 0], [sx * 15, 0]], shadeCol: C.stoneShade }); for (const sy of [-6, -14, -21]) line(g, [[sx * 15 - 3, sy], [sx * 15 + 3, sy]], 0.6, C.stoneShade, { taper: 0.2 }); } form(g, [[-19, -24], [19, -24], [17, -31], [-17, -31]], C.stone, { ...ink, shade: false }); g.fillStyle = 'rgba(60,40,100,0.55)'; g.fillRect(-10.5, -24, 21, 24); g.fillStyle = 'rgba(190,120,255,0.35)'; g.beginPath(); g.ellipse(0, -12, 9, 11, 0, 0, 7); g.fill(); g.fillStyle = C.gold; g.beginPath(); g.arc(0, -27.5, 1.6, 0, 7); g.fill(); g.restore(); }
function stile(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); for (const px of [-5, 5]) form(g, [[px - 1.2, 0], [px + 1.2, 0], [px + 1.2, -11], [px - 1.2, -11]], C.wood, { ink: P.alpha(PROP, 0.9), inkW: 0.9, shade: false }); for (const ry of [-4, -8]) line(g, [[-6, ry], [6, ry]], 1.4, C.wood, { taper: 0.02 }); line(g, [[-8, -1], [8, -1]], 1.6, C.wood, { taper: 0.02 }); g.restore(); }
function hedgeRow(g, x, y, len, s, seed) {   // a row of lobed bushes grown into one, taller in the middle
  const q = P.rng(seed); g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, len, 14); const n = Math.round(len / 12); const spec = []; for (let i = 0; i <= n; i++) spec.push([i / n * len, -8 - Math.sin(i / n * Math.PI) * 3, 7 + q() * 3]);
  const L = lobes(len / 2, -8, spec, q, 0.1); form(g, L, C.hedge, { ...thin, shade: [[len * 0.1, -4], [len, -6], [len, 2], [0, 2]], shadeCol: C.hedgeShade, glint: [[len * 0.1, -12], [len * 0.4, -16], [len * 0.45, -12], [len * 0.15, -8]], glintCol: C.bushLight, glintA: 0.45 });
  for (let i = 1; i < n; i += 2) line(g, [[i / n * len, -10], [i / n * len + 2, -3]], 0.8, C.hedgeShade, { taper: 0.3 }); for (let i = 0; i < 4; i++) { g.fillStyle = '#e8453c'; g.beginPath(); g.arc(len * (0.15 + i * 0.22), -6 - (i % 2) * 4, 1.1, 0, 7); g.fill(); } g.restore();
}
// ---------------------------------------------------------------- paths and spot plates
function pathStroke(g, pts, closed = false) {   // one worn path: a shadowed lower edge, a flat body, a lighter trodden centre; the same width everywhere
  const S = spline(pts, closed, 10); g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.translate(0.8, 1.6); pathOf(g, S, closed); g.lineWidth = 13.5; g.strokeStyle = P.alpha(C.pathShade, 0.55); g.stroke(); g.restore();
  pathOf(g, S, closed); g.lineWidth = 13.5; g.strokeStyle = C.pathEdge; g.stroke(); pathOf(g, S, closed); g.lineWidth = 11; g.strokeStyle = C.path; g.stroke(); pathOf(g, S, closed); g.lineWidth = 4; g.strokeStyle = P.alpha(C.pathLight, 0.8); g.stroke();
}
function plaza(g, x, y, r) { form(g, [[x - r, y], [x - r * 0.7, y - r * 0.55], [x + r * 0.7, y - r * 0.55], [x + r, y], [x + r * 0.7, y + r * 0.55], [x - r * 0.7, y + r * 0.55]], C.path, { ink: C.pathEdge, inkW: 1.4, shade: [[x, y], [x + r, y], [x + r * 0.7, y + r * 0.55], [x - r * 0.7, y + r * 0.55]], shadeCol: C.pathEdge, shadeA: 0.5, n: 8 }); const q = P.rng(5); for (let i = 0; i < 7; i++) { g.strokeStyle = P.alpha(C.pathEdge, 0.7); g.lineWidth = 0.7; g.beginPath(); g.ellipse(x + (q() - 0.5) * r * 1.3, y + (q() - 0.5) * r * 0.7, 3.5, 1.8, 0, 0, 7); g.stroke(); } }
function church(g, x, y, s = 1) {   // Little Clover Church: a white gable with a clover window, a slate roof running back to the right, a belfry and spire at the left; slate so it never reads as one of the village's red houses. A building's edges are straight, so they are one joined line with round corners, never a brush stroke that overshoots
  const WALL = '#f6f0de', WALLS = '#d3c8ac', SLATE = '#5f7fc0', SLATES = '#3f5a98', SLATEL = '#8fb0e6', GLASS = '#8fd0f0', DOOR = C.woodShade, LW = 1.5;
  const path = (pts) => { g.beginPath(); pts.forEach((q, i) => { if (q.length === 4) g.quadraticCurveTo(q[0], q[1], q[2], q[3]); else if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); };
  const poly = (pts, col, o = {}) => { path(pts); g.fillStyle = col; g.fill(); if (o.shade) { g.save(); path(pts); g.clip(); path(o.shade); g.fillStyle = o.shadeCol; g.fill(); g.restore(); } if (o.lw !== 0) { path(pts); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = o.lw || LW; g.strokeStyle = PROP; g.stroke(); } };
  const arch = (ax, ay, aw, ah, col, lw = 1) => poly([[ax - aw, ay], [ax - aw, ay - ah * 0.55], [ax - aw, ay - ah * 0.9, ax, ay - ah], [ax + aw, ay - ah * 0.9, ax + aw, ay - ah * 0.55], [ax + aw, ay]], col, { lw });
  const bar = (a0, b0, lw, col) => { g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(b0[0], b0[1]); g.lineCap = 'round'; g.lineWidth = lw; g.strokeStyle = col; g.stroke(); };
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 8, 0, 74, 44);
  // the nave's side, in shade, running back to the right; its roof above it
  poly([[27, 0], [47, -5], [47, -27], [27, -23]], WALLS); for (const wx of [33, 41]) arch(wx, -8 - (wx - 33) * 0.1, 2.4, 9, P.mix(GLASS, '#3f5a98', 0.3), 0.9);
  poly([[7, -47], [31, -22], [50, -27], [28, -51]], SLATES); for (const k of [0.33, 0.66]) bar([7 + 24 * k, -47 + 25 * k], [28 + 22 * k, -51 + 24 * k], 0.6, P.darken(SLATES, 0.25));
  // the bell tower, set behind the gable's left edge
  poly([[-31, 0], [-9, 0], [-9, -52], [-31, -52]], WALL, { shade: [[-15, -52], [-9, -52], [-9, 0], [-15, 0]], shadeCol: WALLS });
  for (const qy of [-5, -17, -29, -41]) poly([[-30.2, qy], [-26, qy], [-26, qy - 5], [-30.2, qy - 5]], C.chalkShade, { lw: 0 });
  arch(-20, -35, 6, 14, '#3a3248'); poly([[-23, -37], [-22, -42], [-20, -44.5], [-18, -42], [-17, -37]], C.gold, { lw: 0.8 }); g.fillStyle = C.gold; g.beginPath(); g.arc(-20, -36, 1.2, 0, 7); g.fill();
  arch(-20, -13, 3.2, 10, GLASS);
  poly([[-33, -51], [-7, -51], [-9, -55], [-31, -55]], SLATES, { lw: 1.2 });
  poly([[-31, -55], [-9, -55], [-20, -86]], SLATE, { shade: [[-20, -86], [-9, -55], [-17, -55]], shadeCol: SLATES }); poly([[-27, -57], [-24, -57], [-21, -74]], SLATEL, { lw: 0 });
  bar([-20, -86], [-20, -99], 2.8, PROP); bar([-25, -94], [-15, -94], 2.8, PROP); bar([-20, -86], [-20, -99], 1.5, C.gold); bar([-25, -94], [-15, -94], 1.5, C.gold);
  // the gable: white, an arched door, a four-leaf clover window, two side windows; the roof's edge over it
  poly([[-13, 0], [27, 0], [27, -22], [7, -44], [-13, -22]], WALL, { shade: [[20, -40], [27, -22], [27, 0], [20, 0]], shadeCol: WALLS });
  for (const wx of [-5.5, 19.5]) arch(wx, -7, 2.8, 10, GLASS);
  arch(7, 0, 7.6, 18, C.chalkShade, 1.1); arch(7, 0, 5.4, 15, DOOR); bar([7, -1], [7, -14], 0.7, P.darken(DOOR, 0.3)); g.fillStyle = C.gold; for (const dx of [-1.8, 1.8]) { g.beginPath(); g.arc(7 + dx, -6.5, 0.8, 0, 7); g.fill(); }
  g.fillStyle = PROP; g.beginPath(); g.arc(7, -29, 6.4, 0, 7); g.fill(); for (const [dx, dy] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) { g.fillStyle = '#7fd86a'; g.beginPath(); g.arc(7 + dx, -29 + dy, 2.3, 0, 7); g.fill(); } g.fillStyle = C.gold; g.beginPath(); g.arc(7, -29, 1.3, 0, 7); g.fill();
  poly([[-17, -20], [7, -47], [31, -20], [28, -18.5], [7, -41.5], [-14, -18.5]], SLATE); bar([-13, -21.5], [7, -44.5], 0.8, SLATEL);
  // the steps
  poly([[-3, 3.5], [17, 3.5], [15, 0], [-1, 0]], C.chalkShade, { lw: 1 });
  g.restore();
}
function questBoard(g, x, y, s = 1) {   // the quest board: two posts, a little roof, parchment notes pinned to planks, one with a red seal
  const LW = 1.4, path = pts => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); }, poly = (pts, col, lw = LW) => { path(pts); g.fillStyle = col; g.fill(); if (lw) { g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = PROP; g.stroke(); } };
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 2, 0, 32, 30);
  for (const px of [-13, 13]) poly([[px - 1.8, 0], [px + 1.8, 0], [px + 1.8, -32], [px - 1.8, -32]], '#8a5e3a');
  poly([[-16, -29], [16, -29], [16, -9], [-16, -9]], '#b07a46'); for (const py of [-22.5, -16]) { g.beginPath(); g.moveTo(-15.5, py); g.lineTo(15.5, py); g.lineWidth = 0.7; g.strokeStyle = '#7a5030'; g.stroke(); }
  poly([[-13, -27], [-3, -27.5], [-2.5, -15], [-12.5, -14.5]], '#f7efdc', 0.9); for (const ly of [-24, -21.5, -19]) { g.beginPath(); g.moveTo(-11, ly); g.lineTo(-5, ly); g.lineWidth = 0.6; g.strokeStyle = '#a89878'; g.stroke(); }
  poly([[0, -26], [12, -26.5], [12.5, -18], [0.5, -17.5]], '#fff8e8', 0.9); for (const ly of [-24, -21.5]) { g.beginPath(); g.moveTo(2, ly); g.lineTo(10, ly); g.lineWidth = 0.6; g.strokeStyle = '#a89878'; g.stroke(); } g.fillStyle = '#d8443c'; g.beginPath(); g.arc(9.5, -19.5, 1.5, 0, 7); g.fill();
  poly([[-6, -15], [4, -15.5], [4.5, -10], [-5.5, -10]], '#efe4c8', 0.9); g.fillStyle = C.gold; for (const [nx, ny] of [[-8, -27], [6, -26.5], [-1, -15]]) { g.beginPath(); g.arc(nx, ny, 0.8, 0, 7); g.fill(); }
  poly([[-20, -30], [0, -38], [20, -30], [18, -28], [-18, -28]], '#a85a3e'); poly([[-20, -30], [0, -38], [0, -34], [-18, -28]], '#c8724e', 0); g.restore();
}
function apothecary(g, x, y, s, v) {   // the magic shop, a different house on each map: v 0 a green-thatched cottage, v 1 a mushroom house, v 2 an orchard cottage; a hanging flask sign, bottles on a sill, a glowing window
  const q = P.rng(40 + v), W_ = v === 1 ? '#f3e6cc' : C.wall, WS = v === 1 ? '#d4bf9a' : C.wallShade, ROOF = ['#5aa86a', '#8a5ad0', '#d9803e'][v], RS = ['#357a48', '#5e3a9a', '#a85a28'][v], RL = ['#9ae08a', '#c4a0f4', '#f4b078'][v]; g.save(); g.translate(x, y); g.scale(s, s); cast(g, 2, 0, 52, 40);
  form(g, [[-19, 0], [19, 0], [20, -16], [18, -24], [-18, -24], [-20, -16]], W_, { ...ink, shade: [[6, -24], [18, -24], [20, -16], [19, 0], [6, 0]], shadeCol: WS });
  form(g, [[-14, 0], [-14, -11], [-9, -17], [-4, -11], [-4, 0]], C.woodShade, { ...thin, shade: false }); g.fillStyle = C.gold; g.beginPath(); g.arc(-6, -6, 0.9, 0, 7); g.fill();
  form(g, [[2, -6], [15, -6], [15, -19], [2, -19]], '#ffe29a', { ...thin, shade: false }); line(g, [[8.5, -19], [8.5, -6]], 0.8, PROP, { taper: 0.05 }); form(g, [[1, -6], [16, -6], [16, -3.6], [1, -3.6]], C.wood, { ...thin, inkW: 1, shade: false }); for (const [bx, col, h] of [[4, '#e8503e', 4.4], [8, '#5ab8e8', 5.2], [12, '#7fd86a', 4]]) { form(g, [[bx - 1.5, -6], [bx + 1.5, -6], [bx + 1.5, -6 - h * 0.6], [bx + 0.6, -6 - h], [bx - 0.6, -6 - h], [bx - 1.5, -6 - h * 0.6]], col, { ink: PROP, inkW: 0.7, shade: false, n: 3 }); }
  if (v === 1) { form(g, [[-30, -22], [-26, -38], [-12, -50], [8, -51], [24, -40], [30, -22], [8, -18], [-10, -18]], ROOF, { ...ink, shade: [[8, -49], [24, -40], [30, -22], [8, -18], [-4, -18], [12, -30]], shadeCol: RS, glint: [[-22, -33], [-10, -45], [-5, -41], [-17, -29]], glintCol: RL, glintA: 0.8 }); for (const [sx, sy, r] of [[-15, -30, 4], [4, -40, 4.4], [17, -29, 3.4]]) { g.fillStyle = '#d4f4ff'; g.beginPath(); g.ellipse(sx, sy, r, r * 0.8, 0, 0, 7); g.fill(); } }
  else { form(g, [[-25, -22], [-18, -38], [-4, -48], [6, -48], [18, -38], [25, -22], [8, -20], [-10, -20]], ROOF, { ...ink, shade: [[4, -46], [18, -38], [25, -22], [8, -20], [-2, -20], [10, -32]], shadeCol: RS, glint: [[-18, -30], [-8, -42], [-3, -38], [-13, -26]], glintCol: RL, glintA: 0.65 }); for (let i = 0; i < 3; i++) line(g, [[-16 + i * 12, -24], [-12 + i * 10, -37 + (i === 1 ? -4 : 0)]], 0.9, RS, { taper: 0.2 }); form(g, [[12, -40], [17, -40], [17.5, -51], [12.5, -51]], C.stone, { ...thin, inkW: 1, shade: false }); for (let i = 0; i < 3; i++) { g.fillStyle = P.alpha(['#c8f0d0', '#d8c8ff', '#fff0c8'][v], 0.6 - i * 0.15); g.beginPath(); g.arc(16 + i * 3, -55 - i * 4, 2.2 + i, 0, 7); g.fill(); } }
  line(g, [[-20, -19], [-29, -19]], 1.7, PROP, { taper: 0.02 }); line(g, [[-27, -19], [-27, -16]], 0.8, PROP, { taper: 0.02 }); form(g, [[-30.4, -9], [-29.6, -14], [-28.6, -14], [-28.6, -16], [-25.4, -16], [-25.4, -14], [-24.4, -14], [-23.6, -9], [-24.6, -6], [-29.4, -6]], '#b08cf0', { ink: PROP, inkW: 1.1, shade: false, n: 3 }); form(g, [[-29, -10], [-25, -10], [-25, -7], [-29, -7]], '#e85a9a', { ink: null, shade: false, n: 3 });
  if (v === 2) { K_tree(g, 34, 2); } g.restore();
}
function K_tree(g, x, seed) { appleTree(g, x, 0, 0.8, seed + 30); }
const KIND = { wild: '#d9c07a', town: '#6fcf7a', spring: '#6ec4e8', shrine: '#c9a3ff', chest: '#f4c14a', gate: '#b07be0', shop: '#ff9d5c', church: '#ff9ec4', board: '#4fc8b8', shop_magic: '#b06ae8', gear: '#8fa8c0' };
// the symbols on the plates (Robin, 2026-11-02): one bold shape standing on the plate, ink round it, so it reads at the plate's size on a phone. Drawn at about 22 units tall about (0, 0); the wild spot has none
const P2 = (g, pts, col, lw = 1.5) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fillStyle = col; g.fill(); g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = '#2a2030'; g.stroke(); };
const D2 = (g, x, y, r, col, lw = 1.5) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = '#2a2030'; g.stroke(); } };
const FLASK = (g, liquid, liquidS) => { P2(g, [[-2.8, -11], [2.8, -11], [2.8, -5], [8, 4], [8, 8], [5, 11], [-5, 11], [-8, 8], [-8, 4], [-2.8, -5]], '#eaf6fa'); g.save(); g.beginPath(); [[8, 4], [8, 8], [5, 11], [-5, 11], [-8, 8], [-8, 4], [-5, -1], [5, -1]].forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.clip(); g.fillStyle = liquid; g.fillRect(-9, -2, 18, 14); g.fillStyle = liquidS; g.fillRect(2, -2, 8, 14); g.restore(); P2(g, [[-3.6, -13.5], [3.6, -13.5], [3.6, -10.5], [-3.6, -10.5]], '#a87848', 1.2); D2(g, -3, 5, 1.2, '#ffffff', 0); };
const SYMBOLS = {
  town: g => { P2(g, [[-9, 11], [9, 11], [9, -2], [-9, -2]], '#fff4dc'); P2(g, [[-12, -1], [0, -12], [12, -1]], '#d9604a'); P2(g, [[-3, 11], [3, 11], [3, 3], [-3, 3]], '#7a5030', 1.2); },
  shop: g => { P2(g, [[-1.8, 9], [-8.2, 13], [-10, 11], [-4, 6]], '#8a5e3a', 1.2); P2(g, [[1.8, 9], [8.2, 13], [10, 11], [4, 6]], '#8a5e3a', 1.2); P2(g, [[-5.5, 7.5], [-8, 5], [7, -12], [11, -13], [10, -9]], '#e4eaf0', 1.4); P2(g, [[5.5, 7.5], [8, 5], [-7, -12], [-11, -13], [-10, -9]], '#e4eaf0', 1.4); P2(g, [[-7, 2], [-8.8, 7], [-4, 9], [-2, 5]], '#f4c14a', 0); P2(g, [[-6.5, 3], [6.5, 3], [6.5, 6], [-6.5, 6]], '#f4c14a', 1.1); },
  shop_magic: g => { FLASK(g, '#b06ae8', '#7e3ec0'); for (const [x, y, r] of [[10, -10, 3], [-10, -7, 2.4]]) { P2(g, [[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], '#fff0a0', 0.9); } },
  chest: g => { P2(g, [[-11, 11], [11, 11], [11, -1], [-11, -1]], '#b07a46'); P2(g, [[-11, -1], [11, -1], [11, -6], [7, -10], [-7, -10], [-11, -6]], '#c98e54'); P2(g, [[-2.8, 5], [2.8, 5], [2.8, -3], [-2.8, -3]], '#f4c14a', 1.2); for (const x of [-7, 7]) { g.fillStyle = '#7a5030'; g.fillRect(x - 1, -10, 2, 21); } },
  spring: g => FLASK(g, '#e8403a', '#a81e2a'),
  gear: g => { P2(g, [[-11, 3], [-10, -4], [-5, -10], [5, -10], [10, -4], [11, 3], [11, 6], [-11, 6]], '#c2ccd6'); P2(g, [[-1.6, -11], [1.6, -11], [1.6, 2], [-1.6, 2]], '#f4c14a', 1); P2(g, [[-9, 6], [-3, 6], [-3, 12], [-9, 10]], '#c2ccd6', 1.3); P2(g, [[9, 6], [3, 6], [3, 12], [9, 10]], '#c2ccd6', 1.3); g.fillStyle = '#2a2030'; g.fillRect(-7.5, 7, 3, 1.6); g.fillRect(4.5, 7, 3, 1.6); },
  shrine: g => { P2(g, [[0, -13], [3.4, -4], [12, -4], [5, 2], [8, 11], [0, 6], [-8, 11], [-5, 2], [-12, -4], [-3.4, -4]], '#c9a3ff'); D2(g, 0, -1, 2.4, '#fff4c8', 1); },
  church: g => { P2(g, [[-3, 12], [3, 12], [3, -2], [9, -2], [9, -8], [3, -8], [3, -13], [-3, -13], [-3, -8], [-9, -8], [-9, -2], [-3, -2]], '#fff8e8'); },
  gate: g => { P2(g, [[-13, 9], [-16, -9], [-7, -2], [0, -13], [7, -2], [16, -9], [13, 9]], '#f4c14a', 1.8); P2(g, [[-12.4, 9], [12.4, 9], [12.4, 12.5], [-12.4, 12.5]], '#e8922a', 1.5); D2(g, 0, 3, 2.8, '#e8345a', 1.2); D2(g, -8, 3.4, 1.5, '#7ad0f4', 0.9); D2(g, 8, 3.4, 1.5, '#7ad0f4', 0.9); },
  board: g => { P2(g, [[-9, -11], [9, -11], [9, 11], [-9, 11]], '#fff4dc'); for (const y of [-6, -1.5, 3]) { g.fillStyle = '#7a6a58'; g.fillRect(-6, y, 12, 1.6); } D2(g, 5, 8, 2.2, '#d8443c', 1); D2(g, 0, -11, 1.8, '#f4c14a', 1); },
};
function plate(g, x, y, kind, s = 1) {   // the spot: a stone plate set into the path with a rim in its kind's colour; a wild spot is plain and recedes; every other kind carries its symbol
  const rx = (kind === 'town' ? 22 : kind === 'gate' ? 18 : 12) * s, ry = rx * 0.5, wild = kind === 'wild';
  g.save(); g.fillStyle = 'rgba(28,38,70,0.18)'; g.beginPath(); g.ellipse(x + 1.5, y + 2, rx, ry, 0, 0, 7); g.fill(); g.restore();
  const rim = wild ? C.pathEdge : (KIND[kind === 'shop_magic' ? 'shop_magic' : kind] || KIND.wild);
  form(g, [[x - rx, y], [x - rx * 0.7, y - ry], [x + rx * 0.7, y - ry], [x + rx, y], [x + rx * 0.7, y + ry], [x - rx * 0.7, y + ry]], rim, { ink: wild ? P.alpha(PROP, 0.55) : PROP, inkW: wild ? 1 : 1.5, shade: false, n: 8 });
  form(g, [[x - rx * 0.8, y], [x - rx * 0.56, y - ry * 0.75], [x + rx * 0.56, y - ry * 0.75], [x + rx * 0.8, y], [x + rx * 0.56, y + ry * 0.75], [x - rx * 0.56, y + ry * 0.75]], wild ? C.path : C.plate, { ink: null, shade: [[x, y - ry * 0.2], [x + rx * 0.8, y], [x + rx * 0.56, y + ry * 0.75], [x - rx * 0.56, y + ry * 0.75]], shadeCol: wild ? C.pathEdge : C.plateShade, shadeA: 0.6, n: 8 });
  if (SYMBOLS[kind]) { const k = (kind === 'town' ? 0.62 : kind === 'gate' ? 0.72 : kind === 'shop' || kind === 'shop_magic' ? 0.62 : 0.46); g.save(); g.translate(x, y - ry * 0.55); g.scale(k * (s >= 1 ? s : s) * (kind === 'town' ? 1 : 1), k * s); g.lineCap = 'round'; SYMBOLS[kind](g); g.restore(); }
}
module.exports = { hill, C, PROP, cast, contact, TREES, oak, poplar, appleTree, pine, gnarledOak, bush, rock, tuft, flowers, cloverPatch, pebbles, wornPatch, mushroom, house, fence, barrel, well, sack, signpost, windmill, oldMill, pond, spring, shrine, church, questBoard, apothecary, chest, gate, stile, hedgeRow, pathStroke, plaza, plate, KIND, lobes };
