// overworld_concept.js: the concept still of Cloverfield Meadows' board (Mitch, AD, 2026-11-01): a living map seen from the
// raised camera, in the hero's inked hand. Plates of meadow with chalk cliff faces where the land steps, worn paths joining
// stone spot plates that tell their kind by what stands on them, the hubs as landmarks (Puddlewick Village, Windmill
// Hill, Duck Pond, the Old Mill, Hedgerow, Clover Crossroads), props in clusters with one cast shadow each, a horizon band
// of far hills, sea and clouds, cloud shadows on the meadow, a closed area under cloud, and the Knight from the rig at 44 px.
// Phone size with the game's chrome (docs/state/client.md: the HUD to 100, the band to 740, the strip below).
//   node tools/overworld_concept.js  -> work/overworld/cloverfield.png / .jpg
const P = require('./paint.js'); const I = require('./ink.js'); const R = require('./hybrid/rig.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../work/overworld'); fs.mkdirSync(OUT, { recursive: true });
const { form, line, spline, pathOf, fill } = I;
const W = 412, H = 915, Y0 = 100, Y1 = 740;
const INK = '#2a2030', PROP = '#4a3324';   // the figures' ink, and the props' warmer line
const C = { sky: ['#6fb9ee', '#cdebfb'], far: '#9fcfb0', far2: '#7fbf98', sea: '#4fb0d8', seaLight: '#a9e2f4', foam: '#f4fbff',
            meadow: '#86cf5c', meadowShade: '#5fae45', clover: '#a4df6c', chalk: '#eee7d2', chalkShade: '#c9bfa4', path: '#dcbd7c', pathLight: '#efd79c', pathEdge: '#b8975a',
            leaf: '#5fc24e', leafShade: '#3c9238', leafLight: '#97e06a', trunk: '#8f6338', bush: '#55b84d', hedge: '#4aa842', rock: '#b9b3a2', rockShade: '#857e6c',
            plate: '#efe4c8', plateShade: '#cdbf9c', water: '#5ab6dd', waterLight: '#b6e6f5', roofRed: '#d65b45', roofOrange: '#e8924a', roofBrown: '#a86c3c', wall: '#f6efdc', wood: '#b07a46', woodShade: '#7c5230', gold: '#f4c14a', cloud: '#ffffff', cloudShade: '#cfe0f0', closed: '#a9b6c8' };
const rng = P.rng(11), r = () => rng();
function cast(g, x, y, w, h, k = 1) { g.save(); g.fillStyle = 'rgba(28,38,70,0.22)'; g.translate(x, y); g.transform(1, 0, 0.55 * k, 0.42, 0, 0); g.beginPath(); g.ellipse(w * 0.2, -h * 0.45, w * 0.5, h * 0.5, 0, 0, 7); g.fill(); g.restore(); }   // thrown to the lower right, the light from the upper left
const blob = (x, y, rx, ry, n, k, seed) => { const q = P.rng(seed); const pts = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, wob = 1 + (q() - 0.5) * k; pts.push([x + Math.cos(t) * rx * wob, y + Math.sin(t) * ry * wob]); } return pts; };

// ---------------------------------------------------------------- props (x, y the foot; s the scale, 1 = a tree about 60 px tall at the board's 0.8)
function tree(g, x, y, s = 1, seed = 1) {
  const q = P.rng(seed), lean = (q() - 0.5) * 6, hs = 0.9 + q() * 0.25; g.save(); g.translate(x, y); g.scale(s, s * hs);
  cast(g, 0, 0, 44, 50);
  form(g, [[-4, 0], [4, 0], [3, -22], [-3, -22]], C.trunk, { inkW: 1.6, ink: PROP, shade: [[0, 0], [4, 0], [3, -22], [0, -22]], shadeCol: C.woodShade });
  const cx = lean, cy = -40; form(g, blob(cx, cy, 24, 20, 10, 0.18, seed + 1), C.leaf, { inkW: 1.8, ink: PROP, shade: [[cx - 4, cy + 4], [cx + 24, cy - 2], [cx + 22, cy + 18], [cx - 10, cy + 18]], shadeCol: C.leafShade, glint: [[cx - 14, cy - 14], [cx + 2, cy - 18], [cx + 4, cy - 10], [cx - 10, cy - 8]], glintCol: C.leafLight, glintA: 0.55 });
  form(g, blob(cx - 8, cy - 8, 11, 8, 7, 0.2, seed + 2), C.leafLight, { ink: null, shade: false }); g.restore();
}
function bush(g, x, y, s = 1, seed = 2) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 22, 18); form(g, blob(0, -9, 14, 9, 8, 0.2, seed), C.bush, { inkW: 1.6, ink: PROP, shade: [[-2, -6], [14, -8], [12, 2], [-8, 2]], shadeCol: C.leafShade, glint: [[-8, -14], [0, -16], [2, -11], [-7, -9]], glintCol: C.leafLight, glintA: 0.5 }); g.restore(); }
function hedge(g, x, y, len, s = 1, seed = 3) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, len, 16); const pts = []; const q = P.rng(seed); for (let i = 0; i <= 8; i++) pts.push([i / 8 * len, -9 - (i % 2 ? 6 : 1) - q() * 3]); for (let i = 8; i >= 0; i--) pts.push([i / 8 * len, -2 + q() * 2]); form(g, pts, C.hedge, { inkW: 1.6, ink: PROP, shade: [[0, -6], [len, -7], [len, 0], [0, 0]], shadeCol: C.leafShade }); g.restore(); }
function rock(g, x, y, s = 1, seed = 4) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 16, 12); form(g, [[-9, 0], [-7, -7], [-2, -10], [5, -9], [9, -3], [8, 0]], C.rock, { inkW: 1.5, ink: PROP, shade: [[0, -5], [9, -3], [8, 0], [-2, 0]], shadeCol: C.rockShade }); g.restore(); }
function flowers(g, x, y, n, seed, s = 1) { const q = P.rng(seed); for (let i = 0; i < n; i++) { const fx = x + (q() - 0.5) * 36 * s, fy = y + (q() - 0.5) * 14 * s, c = ['#ff7a9a', '#ffe066', '#ffffff', '#ffa94d'][Math.floor(q() * 4)]; g.fillStyle = c; g.beginPath(); g.arc(fx, fy, 1.6 * s, 0, 7); g.fill(); } }
function signpost(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 10, 24); form(g, [[-1.6, 0], [1.6, 0], [1.6, -22], [-1.6, -22]], C.wood, { inkW: 1.3, ink: PROP, shade: false }); form(g, [[-8, -21], [7, -21], [10, -17.5], [7, -14], [-8, -14]], C.wood, { inkW: 1.3, ink: PROP, shade: [[-8, -17], [10, -17.5], [7, -14], [-8, -14]], shadeCol: C.woodShade }); g.restore(); }
function house(g, x, y, s = 1, roof = C.roofRed, seed = 5) {   // seen a touch from above: the wall below, the roof's two slopes above it
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 34, 30);
  form(g, [[-14, 0], [14, 0], [14, -14], [-14, -14]], C.wall, { inkW: 1.6, ink: PROP, shade: [[2, -14], [14, -14], [14, 0], [2, 0]], shadeCol: '#d8ccb0' });
  form(g, [[-4, 0], [4, 0], [4, -9], [-4, -9]], C.woodShade, { inkW: 1.2, ink: PROP, shade: false });
  form(g, [[-17, -13], [17, -13], [11, -30], [-11, -30]], roof, { inkW: 1.7, ink: PROP, shade: [[0, -13], [17, -13], [11, -30], [0, -30]], shadeCol: P.darken(roof, 0.25), glint: [[-14, -16], [-4, -16], [-8, -27], [-10, -27]], glintA: 0.3 });
  form(g, [[5, -27], [9, -27], [9, -35], [5, -35]], C.rockShade, { inkW: 1.2, ink: PROP, shade: false }); g.restore();
}
function windmill(g, x, y, s = 1, turn = 0.4) {
  g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 36, 70);
  form(g, [[-12, 0], [12, 0], [8, -46], [-8, -46]], C.chalk, { inkW: 1.8, ink: PROP, shade: [[1, -46], [8, -46], [12, 0], [1, 0]], shadeCol: C.chalkShade });
  form(g, [[-10, -45], [10, -45], [0, -58]], C.roofBrown, { inkW: 1.6, ink: PROP, shade: [[0, -45], [10, -45], [0, -58]], shadeCol: P.darken(C.roofBrown, 0.3) });
  form(g, [[-3.5, 0], [3.5, 0], [3.5, -8], [-3.5, -8]], C.woodShade, { inkW: 1.2, ink: PROP, shade: false });
  g.translate(2, -50); g.rotate(turn); for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); form(g, [[-1.5, 0], [1.5, 0], [4, -30], [-4, -30]], C.wood, { inkW: 1.3, ink: PROP, shade: false }); form(g, [[0, -6], [4, -8], [4.5, -28], [0.5, -28]], C.wall, { inkW: 1.1, ink: PROP, shade: false }); g.restore(); }
  g.fillStyle = C.gold; g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill(); g.strokeStyle = PROP; g.lineWidth = 1; g.stroke(); g.restore();
}
function mill(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); house(g, 0, 0, 1.1, C.roofBrown); g.translate(22, -4); cast(g, 0, 4, 20, 20); g.strokeStyle = C.woodShade; g.lineWidth = 4; g.beginPath(); g.arc(0, -12, 11, 0, 7); g.stroke(); g.strokeStyle = PROP; g.lineWidth = 1.3; g.beginPath(); g.arc(0, -12, 13, 0, 7); g.stroke(); g.beginPath(); g.arc(0, -12, 9, 0, 7); g.stroke(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(Math.cos(a) * 9, -12 + Math.sin(a) * 9); g.lineTo(Math.cos(a) * -9, -12 + Math.sin(a) * -9); g.stroke(); } g.restore(); }
function pond(g, x, y, rx, ry, seed = 7) {
  form(g, blob(x, y, rx + 5, ry + 3, 12, 0.1, seed), C.meadowShade, { ink: null, shade: false });   // the damp rim
  const S = form(g, blob(x, y, rx, ry, 12, 0.1, seed), C.water, { inkW: 1.4, ink: PROP, shade: [[x - rx * 0.2, y - ry * 0.3], [x + rx, y - ry * 0.4], [x + rx, y + ry], [x - rx * 0.6, y + ry]], shadeCol: '#3e95bd', shadeA: 0.6 });
  g.save(); pathOf(g, S); g.clip(); for (let i = 0; i < 4; i++) line(g, [[x - rx * 0.6 + i * 8, y - ry * 0.4 + i * 7], [x - rx * 0.2 + i * 8, y - ry * 0.5 + i * 7], [x + rx * 0.2 + i * 6, y - ry * 0.4 + i * 7]], 0.9, C.waterLight, { taper: 0.3 }); g.restore();
  for (const [dx, dy] of [[-6, 2], [8, -3], [2, 7]]) { form(g, [[dx - 3, y + dy], [dx + 3, y + dy], [dx + 2, y + dy - 3], [dx - 2, y + dy - 3]].map(([a, b]) => [a + x, b]), '#fff8e8', { inkW: 1, ink: PROP, shade: false }); g.fillStyle = C.roofOrange; g.fillRect(x + dx + 2.5, y + dy - 4, 1.6, 1.2); }   // ducks
  form(g, blob(x - rx * 0.7, y + ry * 0.6, 7, 4, 7, 0.2, seed + 1), '#6fbf5a', { ink: null, shade: false }); form(g, blob(x + rx * 0.6, y - ry * 0.7, 6, 3.5, 7, 0.2, seed + 2), '#6fbf5a', { ink: null, shade: false });   // reeds' tufts
}
function shrine(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 16, 26); form(g, [[-8, 0], [8, 0], [6, -4], [-6, -4]], C.rock, { inkW: 1.3, ink: PROP, shade: false }); form(g, [[-4, -4], [4, -4], [4, -18], [-4, -18]], C.rock, { inkW: 1.3, ink: PROP, shade: [[0, -18], [4, -18], [4, -4], [0, -4]], shadeCol: C.rockShade }); form(g, [[-8, -18], [8, -18], [0, -26]], C.roofBrown, { inkW: 1.3, ink: PROP, shade: false }); g.fillStyle = '#ffe28a'; g.beginPath(); g.arc(0, -11, 2.2, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,120,0.3)'; g.beginPath(); g.arc(0, -11, 6, 0, 7); g.fill(); g.restore(); }
function chest(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 14, 10); form(g, [[-7, 0], [7, 0], [7, -7], [-7, -7]], C.wood, { inkW: 1.3, ink: PROP, shade: [[0, -7], [7, -7], [7, 0], [0, 0]], shadeCol: C.woodShade }); form(g, [[-7, -7], [7, -7], [6, -11], [-6, -11]], C.woodShade, { inkW: 1.3, ink: PROP, shade: false }); g.fillStyle = C.gold; g.fillRect(-1.5, -8.5, 3, 3); g.restore(); }
function gate(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); cast(g, 0, 0, 30, 34); for (const sx of [-1, 1]) form(g, [[sx * 14 - 4, 0], [sx * 14 + 4, 0], [sx * 14 + 3, -26], [sx * 14 - 3, -26]], C.rock, { inkW: 1.5, ink: PROP, shade: [[sx * 14, -26], [sx * 14 + 4, -26], [sx * 14 + 4, 0], [sx * 14, 0]], shadeCol: C.rockShade }); form(g, [[-18, -24], [18, -24], [16, -31], [-16, -31]], C.rock, { inkW: 1.5, ink: PROP, shade: false }); g.fillStyle = 'rgba(60,40,90,0.5)'; g.fillRect(-10, -24, 20, 24); g.restore(); }
function plate(g, x, y, kind) {   // the spot: a stone plate set into the path, its kind told by what stands on it
  const rx = kind === 'town' ? 22 : kind === 'gate' ? 18 : 12, ry = rx * 0.5;
  form(g, [[x - rx, y], [x - rx * 0.7, y - ry], [x + rx * 0.7, y - ry], [x + rx, y], [x + rx * 0.7, y + ry], [x - rx * 0.7, y + ry]], C.plate, { inkW: 1.6, ink: PROP, shade: [[x, y - ry * 0.2], [x + rx, y], [x + rx * 0.7, y + ry], [x - rx * 0.7, y + ry]], shadeCol: C.plateShade, shadeA: 0.7, n: 8 });
  if (kind === 'wild') signpost(g, x + 6, y - 2, 0.8);
  if (kind === 'spring') { form(g, blob(x, y - 1, 7, 3.5, 8, 0.1, 21), C.water, { inkW: 1.2, ink: PROP, shade: false }); g.fillStyle = C.waterLight; g.beginPath(); g.ellipse(x - 2, y - 2, 2.5, 1, 0, 0, 7); g.fill(); form(g, [[x - 11, y + 2], [x - 5, y + 2], [x - 6, y - 8], [x - 10, y - 8]], C.rock, { inkW: 1.1, ink: PROP, shade: false }); }
  if (kind === 'shrine') shrine(g, x, y, 0.8);
  if (kind === 'chest') chest(g, x, y, 0.9);
  if (kind === 'gate') gate(g, x, y - 2, 0.9);
}

// ---------------------------------------------------------------- the picture
function board(g) {
  g.save(); g.beginPath(); g.rect(0, Y0, W, Y1 - Y0); g.clip();
  // the horizon: sky, far hills in haze, the sea with foam lines, clouds
  g.fillStyle = P.lin(g, 0, Y0, 0, Y0 + 150, [[0, C.sky[0]], [1, C.sky[1]]]); g.fillRect(0, Y0, W, 150);
  form(g, blob(80, Y0 + 132, 150, 26, 12, 0.08, 31), C.far, { ink: null, shade: false }); form(g, blob(330, Y0 + 128, 140, 32, 12, 0.08, 32), C.far2, { ink: null, shade: false }); form(g, blob(200, Y0 + 140, 120, 18, 10, 0.08, 33), C.far, { ink: null, shade: false });
  g.fillStyle = C.sea; g.fillRect(0, Y0 + 136, W, Y1 - Y0 - 136); for (let i = 0; i < 10; i++) { g.strokeStyle = P.alpha(C.foam, 0.6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(20 + i * 42, Y0 + 146 + (i % 3) * 6); g.quadraticCurveTo(30 + i * 42, Y0 + 143 + (i % 3) * 6, 44 + i * 42, Y0 + 146 + (i % 3) * 6); g.stroke(); }
  for (const [cx, cy, s] of [[70, Y0 + 40, 1.0], [250, Y0 + 28, 1.3], [370, Y0 + 60, 0.8], [160, Y0 + 76, 0.6]]) { g.save(); g.translate(cx, cy); g.scale(s, s); const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, x = -40 + t * 80, y = -Math.sin(t * Math.PI) * (16 + 8 * Math.sin(t * 9)); pts.push([x, y]); } pts.push([40, 6], [-40, 6]); form(g, pts, C.cloud, { inkW: 1.2, ink: P.alpha(PROP, 0.35), shade: [[-40, 0], [40, 0], [40, 6], [-40, 6]], shadeCol: C.cloudShade, shadeA: 0.9 }); g.restore(); }
  // the land: the main plate with a chalk shore where it meets the sea, a plateau up-right with a cliff face, a terrace at the bottom
  const land = blob(206, Y0 + 440, 262, 300, 18, 0.06, 41);
  g.save(); pathOf(g, spline(land, true, 8)); g.clip(); g.fillStyle = C.meadow; g.fillRect(0, Y0, W, Y1 - Y0);
  for (let i = 0; i < 160; i++) { const x = r() * W, y = Y0 + 160 + r() * 520; g.fillStyle = P.alpha(i % 3 ? C.clover : C.meadowShade, 0.35); g.beginPath(); g.ellipse(x, y, 8 + r() * 14, 3 + r() * 4, 0, 0, 7); g.fill(); }
  g.restore();
  g.save(); pathOf(g, spline(land, true, 8)); g.lineWidth = 7; g.strokeStyle = C.chalk; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = PROP; g.stroke(); g.restore();
  const plateau = blob(318, Y0 + 262, 86, 46, 12, 0.08, 42);
  g.save(); g.translate(0, 22); form(g, plateau, C.chalk, { inkW: 1.6, ink: PROP, shade: [[300, Y0 + 262], [404, Y0 + 262], [404, Y0 + 300], [240, Y0 + 300]], shadeCol: C.chalkShade }); g.restore();
  for (let i = 0; i < 7; i++) line(g, [[250 + i * 24, Y0 + 300 + (i % 2) * 4], [254 + i * 24, Y0 + 310 + (i % 3) * 3]], 1, P.alpha(PROP, 0.5), { taper: 0.3 });
  form(g, plateau, '#95da69', { inkW: 1.2, ink: P.alpha(PROP, 0.7), shade: false }); g.save(); pathOf(g, spline(plateau, true, 8)); g.clip(); for (let i = 0; i < 20; i++) { g.fillStyle = P.alpha(C.clover, 0.4); g.beginPath(); g.ellipse(240 + r() * 160, Y0 + 220 + r() * 90, 8 + r() * 10, 3, 0, 0, 7); g.fill(); } g.restore();
  // the paths, worn into the meadow, and the spots on them
  const road = [[206, Y0 + 596], [206, Y0 + 548], [160, Y0 + 500], [118, Y0 + 440], [150, Y0 + 380], [218, Y0 + 336], [286, Y0 + 300], [330, Y0 + 262], [348, Y0 + 214]];
  const branch = [[218, Y0 + 336], [172, Y0 + 290], [128, Y0 + 250], [110, Y0 + 200]];
  const branch2 = [[286, Y0 + 300], [330, Y0 + 340], [356, Y0 + 398]];
  for (const rd of [road, branch, branch2]) { const S = spline(rd, false, 8); g.lineCap = 'round'; g.lineJoin = 'round'; pathOf(g, S, false); g.lineWidth = 15; g.strokeStyle = C.pathEdge; g.stroke(); pathOf(g, S, false); g.lineWidth = 12; g.strokeStyle = C.path; g.stroke(); pathOf(g, S, false); g.lineWidth = 5; g.strokeStyle = C.pathLight; g.stroke(); }
  const spots = [[206, Y0 + 596, 'town'], [206, Y0 + 548, 'wild'], [160, Y0 + 500, 'wild'], [118, Y0 + 440, 'spring'], [150, Y0 + 380, 'wild'], [218, Y0 + 336, 'wild'], [286, Y0 + 300, 'wild'], [348, Y0 + 214, 'wild'], [172, Y0 + 290, 'shrine'], [110, Y0 + 200, 'chest'], [356, Y0 + 398, 'gate'], [128, Y0 + 250, 'wild'], [330, Y0 + 340, 'wild']];
  // what stands on the land, drawn in depth order; the hubs as landmarks
  const items = [];
  const add = (y, fn) => items.push({ y, fn });
  for (const [x, y, k] of spots) if (k !== 'town') add(y - 4, () => plate(g, x, y, k)); else add(y - 30, () => plate(g, x, y, k));
  // Puddlewick Village at the bottom, Windmill Hill on the plateau, Duck Pond left, the Old Mill right, Hedgerow along the lower path, Clover Crossroads at the fork
  add(Y0 + 600, () => { house(g, 168, Y0 + 606, 0.95, C.roofRed, 51); house(g, 246, Y0 + 610, 0.9, C.roofOrange, 52); house(g, 206, Y0 + 636, 1.05, C.roofBrown, 53); house(g, 130, Y0 + 632, 0.8, C.roofRed, 54); bush(g, 100, Y0 + 626, 0.9, 55); bush(g, 282, Y0 + 640, 0.9, 56); flowers(g, 200, Y0 + 656, 10, 57); });
  add(Y0 + 236, () => windmill(g, 332, Y0 + 238, 0.95));
  add(Y0 + 420, () => pond(g, 72, Y0 + 404, 34, 18));
  add(Y0 + 372, () => mill(g, 300, Y0 + 372, 0.9));
  add(Y0 + 525, () => { hedge(g, 182, Y0 + 526, 70, 0.9, 61); hedge(g, 100, Y0 + 470, 40, 0.8, 62); });
  add(Y0 + 338, () => { signpost(g, 236, Y0 + 326, 1.1); signpost(g, 200, Y0 + 322, 0.9); flowers(g, 218, Y0 + 350, 12, 63); });
  // trees and bushes in clusters, rocks where the ground breaks
  for (const [x, y, s, seed] of [[40, Y0 + 330, 0.9, 71], [64, Y0 + 350, 1.1, 72], [26, Y0 + 372, 0.7, 73], [250, Y0 + 400, 1.0, 74], [228, Y0 + 426, 0.85, 75], [380, Y0 + 470, 1.05, 76], [352, Y0 + 494, 0.8, 77], [60, Y0 + 560, 1.0, 78], [34, Y0 + 590, 0.8, 79], [392, Y0 + 300, 0.9, 80], [270, Y0 + 170, 0.8, 81], [240, Y0 + 182, 0.65, 82], [300, Y0 + 560, 0.9, 83], [330, Y0 + 586, 1.1, 84]]) add(y, () => tree(g, x, y, s, seed));
  for (const [x, y, s, seed] of [[90, Y0 + 372, 0.9, 91], [268, Y0 + 418, 0.8, 92], [370, Y0 + 520, 0.9, 93], [50, Y0 + 610, 0.7, 94], [300, Y0 + 596, 0.8, 95], [140, Y0 + 300, 0.8, 96], [362, Y0 + 250, 0.7, 97]]) add(y, () => bush(g, x, y, s, seed));
  for (const [x, y, s, seed] of [[118, Y0 + 418, 1.0, 101], [376, Y0 + 430, 0.9, 102], [66, Y0 + 520, 0.8, 103], [330, Y0 + 312, 0.7, 104]]) add(y, () => rock(g, x, y, s, seed));
  for (const [x, y, seed] of [[130, Y0 + 390, 111], [200, Y0 + 470, 112], [320, Y0 + 450, 113], [70, Y0 + 470, 114], [260, Y0 + 540, 115]]) add(y, () => flowers(g, x, y, 9, seed, 1.1));
  // the Knight on his spot, from the rig at the board's size
  add(Y0 + 501, () => { g.save(); g.fillStyle = 'rgba(28,38,70,0.3)'; g.beginPath(); g.ellipse(160, Y0 + 502, 10, 3.5, 0, 0, 7); g.fill(); g.translate(160, Y0 + 500); g.scale(0.44, 0.44); R.drawOutfit(g, R.restPose(R.OUTFITS.tunic), R.OUTFITS.tunic); g.restore(); });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  // cloud shadows drifting over the meadow, and the closed area under cloud at the top left
  for (const [x, y, rx, ry] of [[120, Y0 + 300, 90, 40], [330, Y0 + 520, 70, 30]]) { g.fillStyle = 'rgba(28,38,70,0.10)'; pathOf(g, spline(blob(x, y, rx, ry, 10, 0.2, 121), true, 8)); g.fill(); }
  for (const [cx, cy, s] of [[28, Y0 + 176, 1.5], [62, Y0 + 206, 1.2], [10, Y0 + 222, 1.1], [44, Y0 + 150, 1.0]]) { for (let k = 3; k >= 0; k--) { g.fillStyle = P.alpha(k ? C.closed : '#c4cfdd', k ? 0.18 : 0.9); pathOf(g, spline(blob(cx, cy, (34 + k * 7) * s, (16 + k * 4) * s, 10, 0.22, 131 + cx), true, 8)); g.fill(); } }   // the closed area under soft cloud
  // the names of the hubs, as the game writes them
  for (const [t, x, y] of [['Puddlewick Village', 206, Y0 + 574], ['Windmill Hill', 332, Y0 + 256], ['Duck Pond', 72, Y0 + 436], ['Old Mill', 300, Y0 + 392], ['Hedgerow', 230, Y0 + 548], ['Clover Crossroads', 218, Y0 + 362], ['Dewdrop Spring', 96, Y0 + 466]]) P.label(g, t, x, y, 10, '#fffaf0', { align: 'center', stroke: '#2a2436', strokeW: 3 });
  g.restore();
}
function chrome(g) {   // the game's chrome as it looks today (docs/state/client.md)
  g.fillStyle = '#1e1c26'; g.fillRect(0, 0, W, Y0); g.fillRect(0, Y1, W, H - Y1);
  P.label(g, 'Robin the Knight', 16, 24, 20, '#f4efe6'); P.label(g, 'Lv 2 · HP 46/120 · MP 20/20 · Gold 66', 16, 52, 13, '#b9b3c4', { weight: 'normal' }); P.label(g, 'Cloverfield Meadows · Wilds', 16, 76, 13, '#b9b3c4', { weight: 'normal' });
  g.fillStyle = '#f4efe6'; g.beginPath(); P.rr(g, 336, 14, 56, 56, 10); g.fill(); P.label(g, '3', 364, 44, 26, '#1e1c26', { align: 'center' }); P.label(g, 'solo', 316, 86, 10, '#b9b3c4', { align: 'center', weight: 'normal' });
  g.fillStyle = '#252330'; g.fillRect(0, Y1, W, 60);
  P.label(g, 'Tap Roll to move Robin. Tap any spot to hear about it.', W / 2, 784, 12, '#e8e2d8', { align: 'center', weight: 'normal' });
  [['Map', 58], ['World', 157], ['Bag', 255], ['Log', 353]].forEach(([t, x]) => { g.fillStyle = '#343044'; g.beginPath(); P.rr(g, x - 44, 818, 88, 36, 18); g.fill(); P.label(g, t, x, 836, 14, '#f4efe6', { align: 'center' }); });
  g.fillStyle = '#4caf6e'; g.beginPath(); P.rr(g, 56, 860, 300, 50, 12); g.fill(); P.label(g, 'Roll', 206, 885, 20, '#f4efe6', { align: 'center' });
}
(async () => {
  await R.loadMasters();
  const S = 2, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  board(g); chrome(g);
  P.save(cv, path.join(OUT, 'cloverfield.png')); fs.writeFileSync(path.join(OUT, 'cloverfield.jpg'), cv.toBuffer('image/jpeg', 90)); console.log('wrote', OUT);
})();
