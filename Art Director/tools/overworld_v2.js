// overworld_v2.js: the polished Cloverfield Meadows still from the kit (Mitch, AD, 2026-11-01), the same layout and spot
// positions as the first concept; the spots are clean plates (Robin: no icons on the spots you walk on, a tooltip on touch),
// the hubs' landmarks stand beside their spots. Also writes the before/after page, the zoomed details and the kit preview.
//   node tools/overworld_v2.js  -> work/overworld/cloverfield2.png/.jpg, compare.jpg, details.jpg, kit.jpg
const P = require('../tools/paint.js'); const I = require('./ink.js'); const K = require('./kit/cloverfield.js'); const R = require('./hybrid/rig.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../work/overworld');
const { form, line, spline, pathOf, fill } = I; const C = K.C, PROP = K.PROP;
const W = 412, H = 915, Y0 = 100, Y1 = 740;
const blob = (x, y, rx, ry, n, k, seed) => { const q = P.rng(seed); const pts = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, wob = 1 + (q() - 0.5) * k; pts.push([x + Math.cos(t) * rx * wob, y + Math.sin(t) * ry * wob]); } return pts; };
const SKY = ['#6fb9ee', '#cdebfb'], FAR = '#9fcfb0', FAR2 = '#7fbf98', SEA = '#4fb0d8', SEA_DEEP = '#3a97c4', SEA_SHALLOW = '#8fd3ec', FOAM = '#f4fbff', CLOSED = '#aab7c9';

function board(g) {
  g.save(); g.beginPath(); g.rect(0, Y0, W, Y1 - Y0); g.clip();
  // the sky, the far hills in haze, the sea: deep far out, shallow and lighter along the shore
  g.fillStyle = P.lin(g, 0, Y0, 0, Y0 + 150, [[0, SKY[0]], [1, SKY[1]]]); g.fillRect(0, Y0, W, 150);
  form(g, blob(80, Y0 + 132, 150, 26, 12, 0.08, 31), FAR, { ink: null, shade: false }); form(g, blob(330, Y0 + 128, 140, 32, 12, 0.08, 32), FAR2, { ink: null, shade: false }); form(g, blob(200, Y0 + 140, 120, 18, 10, 0.08, 33), FAR, { ink: null, shade: false });
  g.fillStyle = SEA_DEEP; g.fillRect(0, Y0 + 136, W, Y1 - Y0 - 136); g.fillStyle = SEA; g.fillRect(0, Y0 + 150, W, Y1 - Y0 - 150);
  for (let i = 0; i < 9; i++) { g.strokeStyle = P.alpha(FOAM, 0.55); g.lineWidth = 1.1; g.beginPath(); g.moveTo(14 + i * 46, Y0 + 146 + (i % 3) * 5); g.quadraticCurveTo(24 + i * 46, Y0 + 143 + (i % 3) * 5, 38 + i * 46, Y0 + 146 + (i % 3) * 5); g.stroke(); }
  for (const [cx, cy, s] of [[70, Y0 + 40, 1.0], [250, Y0 + 28, 1.3], [370, Y0 + 60, 0.8], [160, Y0 + 76, 0.6]]) { g.save(); g.translate(cx, cy); g.scale(s, s); const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([-40 + t * 80, -Math.sin(t * Math.PI) * (16 + 8 * Math.sin(t * 9))]); } pts.push([40, 6], [-40, 6]); form(g, pts, '#ffffff', { inkW: 1.2, ink: P.alpha(PROP, 0.35), shade: [[-40, 0], [40, 0], [40, 6], [-40, 6]], shadeCol: '#cfe0f0', shadeA: 0.9 }); g.restore(); }
  // the island: a shallow ring in the water, a sand rim, then the meadow; the edge thickens to a low chalk face on the near side
  const land = blob(206, Y0 + 440, 262, 300, 18, 0.06, 41), LS = spline(land, true, 8);
  g.save(); pathOf(g, LS); g.lineWidth = 26; g.strokeStyle = P.alpha(SEA_SHALLOW, 0.5); g.stroke(); g.restore();
  g.save(); g.translate(0, 5); pathOf(g, LS); g.fillStyle = C.chalkShade; g.fill(); g.restore();   // the low face below the near edge
  pathOf(g, LS); g.fillStyle = C.sand; g.fill();
  const inner = land.map(([x, y]) => [206 + (x - 206) * 0.975, Y0 + 440 + (y - Y0 - 440) * 0.975]), IS = spline(inner, true, 8);
  g.save(); pathOf(g, IS); g.clip(); g.fillStyle = C.meadow; g.fillRect(0, Y0, W, Y1 - Y0);
  // the ground: patches of lighter and darker grass in deliberate groups, damp ground round the pond, worn grass round the village and the crossroads
  for (const [x, y, rx, ry, col, seed] of [[150, Y0 + 300, 70, 30, C.clover, 1], [300, Y0 + 460, 80, 34, C.clover, 2], [90, Y0 + 560, 50, 22, C.clover, 3], [250, Y0 + 220, 60, 26, C.meadowShade, 4], [340, Y0 + 560, 60, 30, C.meadowShade, 5], [60, Y0 + 350, 56, 36, C.meadowShade, 6], [200, Y0 + 400, 40, 18, C.clover, 7]]) { for (let k = 2; k >= 0; k--) { g.save(); g.globalAlpha = 0.3; g.translate(x, y); g.scale(1 + k * 0.1, 1 + k * 0.1); g.translate(-x, -y); fill(g, spline(blob(x, y, rx, ry, 10, 0.4, seed), true, 6), col); g.restore(); } }
  K.wornPatch(g, 206, Y0 + 612, 70, 34, 11, C.worn); K.wornPatch(g, 218, Y0 + 336, 36, 18, 12, C.worn); K.wornPatch(g, 332, Y0 + 262, 30, 14, 13, C.worn); K.wornPatch(g, 72, Y0 + 404, 46, 26, 14, '#79c25a');
  for (const [x, y, s] of [[120, Y0 + 290, 1], [310, Y0 + 500, 1.1], [60, Y0 + 600, 0.8], [250, Y0 + 180, 0.9], [160, Y0 + 460, 0.9], [360, Y0 + 460, 0.8]]) K.cloverPatch(g, x, y, s, 20 + x);
  g.restore();
  g.save(); pathOf(g, LS); g.lineWidth = 1.5; g.strokeStyle = PROP; g.stroke(); g.restore();
  g.save(); pathOf(g, IS); g.lineWidth = 0.9; g.strokeStyle = P.alpha(C.meadowShade, 0.9); g.stroke(); g.restore();
  for (let i = 0; i < 7; i++) { const t = 0.42 + i * 0.03, p = LS[Math.floor(t * LS.length)]; g.fillStyle = P.alpha(FOAM, 0.8); g.beginPath(); g.ellipse(p[0] + 3, p[1] + 9, 3, 1.2, 0, 0, 7); g.fill(); }   // foam at the near shore
  // Windmill Hill: the plateau, its chalk face below the near edge, the step's strata
  const plateau = blob(318, Y0 + 262, 86, 46, 12, 0.08, 42), PS = spline(plateau, true, 8);
  g.save(); g.translate(0, 20); pathOf(g, PS); g.fillStyle = C.chalkShade; g.fill(); g.restore(); g.save(); g.translate(0, 14); pathOf(g, PS); g.fillStyle = C.chalk; g.fill(); g.restore();
  g.save(); g.beginPath(); g.rect(226, Y0 + 262, 190, 50); g.clip(); for (let i = 0; i < 9; i++) line(g, [[244 + i * 20, Y0 + 300 + (i % 2) * 3], [250 + i * 20, Y0 + 309 + (i % 3) * 2]], 0.9, P.alpha(C.chalkShade, 0.9), { taper: 0.3 }); g.restore();
  form(g, plateau, '#92d868', { ink: P.alpha(PROP, 0.8), inkW: 1.3, shade: false }); g.save(); pathOf(g, PS); g.clip(); K.cloverPatch(g, 300, Y0 + 250, 1.0, 44); K.cloverPatch(g, 350, Y0 + 280, 0.8, 45); g.restore();
  g.save(); g.translate(0, 14); pathOf(g, PS); g.lineWidth = 1.2; g.strokeStyle = P.alpha(PROP, 0.6); g.stroke(); g.restore();
  // the paths: the same graph and spots as before; a plaza at Clover Crossroads; the village path widens into its square
  const road = [[206, Y0 + 596], [206, Y0 + 548], [160, Y0 + 500], [118, Y0 + 440], [150, Y0 + 380], [218, Y0 + 336], [286, Y0 + 300], [330, Y0 + 262], [348, Y0 + 214]];
  const branch = [[218, Y0 + 336], [172, Y0 + 290], [128, Y0 + 250], [110, Y0 + 200]];
  const branch2 = [[286, Y0 + 300], [330, Y0 + 340], [356, Y0 + 398]];
  for (const rd of [road, branch, branch2]) K.pathStroke(g, rd);
  K.plaza(g, 218, Y0 + 336, 24); K.plaza(g, 206, Y0 + 612, 30);
  const spots = [[206, Y0 + 596, 'town'], [206, Y0 + 548, 'wild'], [160, Y0 + 500, 'wild'], [118, Y0 + 440, 'spring'], [150, Y0 + 380, 'wild'], [218, Y0 + 336, 'wild'], [286, Y0 + 300, 'wild'], [348, Y0 + 214, 'wild'], [172, Y0 + 290, 'shrine'], [110, Y0 + 200, 'chest'], [356, Y0 + 398, 'gate'], [128, Y0 + 250, 'wild'], [330, Y0 + 340, 'wild']];
  for (const [x, y, k] of spots) K.plate(g, x, y, k === 'town' ? 'town' : k, 1);
  for (const [x, y] of [[180, Y0 + 522], [135, Y0 + 470], [250, Y0 + 318], [304, Y0 + 282], [150, Y0 + 268]]) K.pebbles(g, x, y, x + y, 3);
  // everything that stands on the land, in depth order
  const items = []; const add = (y, fn) => items.push({ y, fn });
  // Puddlewick Village: four houses round the square with a well, fences, a barrel, a signpost
  add(Y0 + 580, () => { K.fence(g, 128, Y0 + 596, 46, 0.9); K.fence(g, 240, Y0 + 588, 40, 0.9); });
  add(Y0 + 590, () => K.house(g, 160, Y0 + 592, 1.0, 0, 51));
  add(Y0 + 594, () => K.house(g, 254, Y0 + 596, 0.95, 2, 52));
  add(Y0 + 614, () => K.well(g, 206, Y0 + 616, 0.9));
  add(Y0 + 628, () => { K.house(g, 134, Y0 + 630, 0.9, 1, 53); K.barrel(g, 160, Y0 + 632, 1); K.barrel(g, 166, Y0 + 636, 0.9); });
  add(Y0 + 634, () => { K.house(g, 270, Y0 + 636, 1.0, 1, 54); K.signpost(g, 236, Y0 + 640, 1.0, 2); K.flowers(g, 206, Y0 + 640, 57, 1.1, 6); });
  add(Y0 + 644, () => { K.appleTree(g, 96, Y0 + 646, 0.9, 58); K.bush(g, 306, Y0 + 648, 0.8, 59); K.tuft(g, 120, Y0 + 650, 1, 60); });
  // Windmill Hill: the mill on the plateau with a fence, sacks and flowers; pines on the hill's back
  add(Y0 + 244, () => { K.pine(g, 372, Y0 + 246, 0.8, 61); K.pine(g, 390, Y0 + 262, 0.95, 62); K.pine(g, 282, Y0 + 236, 0.75, 63); });
  add(Y0 + 258, () => { K.fence(g, 300, Y0 + 268, 30, 0.9); K.windmill(g, 332, Y0 + 262, 0.95); K.flowers(g, 312, Y0 + 270, 64, 0.9, 5); K.tuft(g, 356, Y0 + 272, 0.9, 65); });
  // Duck Pond with its shore; the copse of oaks beside it
  add(Y0 + 406, () => K.pond(g, 72, Y0 + 404, 34, 18, 7));
  add(Y0 + 340, () => { K.oak(g, 42, Y0 + 342, 1.0, 71); K.bush(g, 20, Y0 + 350, 0.8, 72, 1); });
  add(Y0 + 362, () => { K.oak(g, 70, Y0 + 364, 1.15, 73); K.mushroom(g, 86, Y0 + 368, 1, 74); K.mushroom(g, 92, Y0 + 372, 0.8, 75); K.rock(g, 100, Y0 + 376, 0.9, 76, 1); });
  add(Y0 + 380, () => { K.oak(g, 28, Y0 + 382, 0.85, 77); K.tuft(g, 54, Y0 + 388, 1.1, 78); });
  // Dewdrop Spring beside its spot; the Old Mill by a brook; the gate at the road's end
  add(Y0 + 446, () => { K.spring(g, 96, Y0 + 452, 1.0); K.tuft(g, 118, Y0 + 460, 0.9, 81); });
  add(Y0 + 372, () => { line(g, [[322, Y0 + 356], [338, Y0 + 372], [360, Y0 + 380], [392, Y0 + 392]], 7, C.water, { taper: 0.05, taper2: 0.4 }); line(g, [[324, Y0 + 358], [340, Y0 + 372], [362, Y0 + 380]], 1.6, C.waterLight, { taper: 0.1 }); K.oldMill(g, 300, Y0 + 376, 0.95); K.rock(g, 368, Y0 + 384, 0.7, 82, 0); K.tuft(g, 346, Y0 + 388, 0.9, 83); });
  add(Y0 + 396, () => { K.gate(g, 356, Y0 + 394, 0.95); K.bush(g, 386, Y0 + 404, 0.9, 84); });
  add(Y0 + 290, () => { K.shrine(g, 190, Y0 + 288, 0.85); K.flowers(g, 196, Y0 + 300, 85, 0.9, 4); });
  add(Y0 + 196, () => { K.chest(g, 126, Y0 + 196, 0.9); K.rock(g, 96, Y0 + 204, 0.8, 86, 2); });
  // Clover Crossroads: the plaza, a three-armed signpost and a milestone, the gnarled oak as the junction's landmark
  add(Y0 + 324, () => { K.signpost(g, 236, Y0 + 326, 1.1, 3); K.rock(g, 200, Y0 + 332, 0.7, 87, 2); });
  add(Y0 + 528, () => K.gnarledOak(g, 252, Y0 + 530, 0.82, 88));
  // Hedgerow: a row of hedges along the lower path with a stile, and the orchard beyond
  add(Y0 + 522, () => { K.hedgeRow(g, 176, Y0 + 526, 64, 0.95, 91); K.stile(g, 244, Y0 + 526, 0.9); });
  add(Y0 + 466, () => { K.hedgeRow(g, 86, Y0 + 470, 40, 0.85, 92); });
  add(Y0 + 546, () => { K.appleTree(g, 296, Y0 + 548, 0.95, 93); K.appleTree(g, 330, Y0 + 568, 1.05, 94); K.appleTree(g, 360, Y0 + 540, 0.85, 95); K.bush(g, 316, Y0 + 582, 0.7, 96, 1); });
  // the rest of the land: a poplar pair at the cove, a copse at the lower left, a lone pine at the far right, rocks where the ground breaks
  add(Y0 + 176, () => { K.poplar(g, 262, Y0 + 178, 0.9, 101); K.poplar(g, 278, Y0 + 186, 1.05, 102); K.bush(g, 246, Y0 + 186, 0.7, 103); });
  add(Y0 + 560, () => { K.oak(g, 48, Y0 + 562, 0.95, 104); K.bush(g, 70, Y0 + 570, 0.8, 105, 1); K.mushroom(g, 30, Y0 + 574, 0.9, 106); });
  add(Y0 + 594, () => { K.poplar(g, 36, Y0 + 596, 0.9, 107); K.tuft(g, 58, Y0 + 602, 1, 108); });
  add(Y0 + 470, () => { K.pine(g, 384, Y0 + 472, 1.0, 109); K.rock(g, 372, Y0 + 476, 0.9, 110, 1); K.rock(g, 392, Y0 + 486, 0.6, 111, 2); });
  add(Y0 + 420, () => { K.rock(g, 128, Y0 + 418, 1.0, 112, 0); K.tuft(g, 144, Y0 + 422, 0.9, 113); K.flowers(g, 136, Y0 + 426, 114, 1, 5); });
  add(Y0 + 440, () => { K.tuft(g, 250, Y0 + 444, 1.1, 115); K.flowers(g, 262, Y0 + 448, 116, 1.1, 6); K.tuft(g, 296, Y0 + 452, 0.9, 117); });
  add(Y0 + 500, () => { K.flowers(g, 356, Y0 + 500, 118, 1, 5); K.tuft(g, 340, Y0 + 506, 1, 119); });
  add(Y0 + 240, () => { K.tuft(g, 176, Y0 + 236, 1, 120); K.flowers(g, 164, Y0 + 244, 121, 0.9, 4); K.rock(g, 200, Y0 + 226, 0.7, 122, 0); });
  // the Knight on his spot
  add(Y0 + 501, () => { g.save(); g.fillStyle = 'rgba(28,38,70,0.3)'; g.beginPath(); g.ellipse(160, Y0 + 502, 10, 3.5, 0, 0, 7); g.fill(); g.translate(160, Y0 + 500); g.scale(0.44, 0.44); R.drawOutfit(g, R.restPose(R.OUTFITS.tunic), R.OUTFITS.tunic); g.restore(); });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  // cloud shadows, and the closed area under soft cloud
  for (const [x, y, rx, ry] of [[130, Y0 + 300, 90, 40], [330, Y0 + 520, 70, 30]]) { g.fillStyle = 'rgba(28,38,70,0.09)'; pathOf(g, spline(blob(x, y, rx, ry, 10, 0.2, 121), true, 8)); g.fill(); }
  for (const [cx, cy, s] of [[28, Y0 + 176, 1.5], [62, Y0 + 206, 1.2], [10, Y0 + 222, 1.1], [44, Y0 + 150, 1.0]]) { for (let k = 3; k >= 0; k--) { g.fillStyle = P.alpha(k ? CLOSED : '#c4cfdd', k ? 0.18 : 0.9); pathOf(g, spline(blob(cx, cy, (34 + k * 7) * s, (16 + k * 4) * s, 10, 0.22, 131 + cx), true, 8)); g.fill(); } }
  // the names, each below its landmark, clear of the paths and the Knight
  for (const [t, x, y] of [['Puddlewick Village', 206, Y0 + 556], ['Windmill Hill', 332, Y0 + 282], ['Duck Pond', 72, Y0 + 432], ['Old Mill', 306, Y0 + 404], ['Hedgerow', 150, Y0 + 544], ['Clover Crossroads', 166, Y0 + 356], ['Dewdrop Spring', 96, Y0 + 474]]) P.label(g, t, x, y, 10, '#fffaf0', { align: 'center', stroke: '#2a2436', strokeW: 3 });
  g.restore();
}
function chrome(g) {
  g.fillStyle = '#1e1c26'; g.fillRect(0, 0, W, Y0); g.fillRect(0, Y1, W, H - Y1);
  P.label(g, 'Robin the Knight', 16, 24, 20, '#f4efe6'); P.label(g, 'Lv 2 · HP 46/120 · MP 20/20 · Gold 66', 16, 52, 13, '#b9b3c4', { weight: 'normal' }); P.label(g, 'Cloverfield Meadows · Wilds', 16, 76, 13, '#b9b3c4', { weight: 'normal' });
  g.fillStyle = '#f4efe6'; g.beginPath(); P.rr(g, 336, 14, 56, 56, 10); g.fill(); P.label(g, '3', 364, 44, 26, '#1e1c26', { align: 'center' }); P.label(g, 'solo', 316, 86, 10, '#b9b3c4', { align: 'center', weight: 'normal' });
  g.fillStyle = '#252330'; g.fillRect(0, Y1, W, 60);
  P.label(g, 'Tap Roll to move Robin. Tap any spot to hear about it.', W / 2, 784, 12, '#e8e2d8', { align: 'center', weight: 'normal' });
  [['Map', 58], ['World', 157], ['Bag', 255], ['Log', 353]].forEach(([t, x]) => { g.fillStyle = '#343044'; g.beginPath(); P.rr(g, x - 44, 818, 88, 36, 18); g.fill(); P.label(g, t, x, 836, 14, '#f4efe6', { align: 'center' }); });
  g.fillStyle = '#4caf6e'; g.beginPath(); P.rr(g, 56, 860, 300, 50, 12); g.fill(); P.label(g, 'Roll', 206, 885, 20, '#f4efe6', { align: 'center' });
}
// ---------------------------------------------------------------- the kit preview: every piece on a neutral ground with its name
function kitPage() {
  const S = 2, Wk = 1000, Hk = 760, cv = P.createCanvas(Wk * S, Hk * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, Wk, Hk); P.label(g, 'The Cloverfield Meadows kit: every piece is a function of its place, a variant and a seed', Wk / 2, 24, 17, '#f0e8d8', { align: 'center' });
  g.fillStyle = '#8fd164'; g.fillRect(16, 40, Wk - 32, Hk - 60);
  const cell = (x, y, name, fn, sc = 1.6) => { g.save(); g.translate(x, y); g.scale(sc, sc); fn(); g.restore(); P.label(g, name, x, y + 16, 10, '#2a2436', { align: 'center', weight: 'normal' }); };
  const row1 = [['oak', () => K.oak(g, 0, 0, 1, 1)], ['oak, another seed', () => K.oak(g, 0, 0, 1, 9)], ['poplar', () => K.poplar(g, 0, 0, 1, 2)], ['apple tree', () => K.appleTree(g, 0, 0, 1, 3)], ['pine', () => K.pine(g, 0, 0, 1, 4)], ['the gnarled oak', () => K.gnarledOak(g, 0, 0, 0.8, 5)]];
  row1.forEach(([n, f], i) => cell(90 + i * 160, 180, n, f));
  const row2 = [['bush', () => K.bush(g, 0, 0, 1, 6, 0)], ['low bush', () => K.bush(g, 0, 0, 1, 7, 1)], ['hedge row', () => K.hedgeRow(g, -28, 0, 56, 1, 8)], ['boulder', () => K.rock(g, 0, 0, 1, 9, 0)], ['split rock', () => K.rock(g, 0, 0, 1, 10, 1)], ['pebble', () => K.rock(g, 0, 0, 1, 11, 2)], ['tuft', () => K.tuft(g, 0, 0, 1.2, 12)], ['flowers', () => K.flowers(g, 0, -3, 13, 1.3, 5)], ['clover patch', () => K.cloverPatch(g, 0, -4, 1, 14)], ['mushrooms', () => { K.mushroom(g, -5, 0, 1.1, 15); K.mushroom(g, 5, 2, 0.9, 16); }], ['pebbles', () => K.pebbles(g, 0, -2, 17, 5)]];
  row2.forEach(([n, f], i) => cell(60 + i * 86, 300, n, f, 1.5));
  const row3 = [['house, tiles', () => K.house(g, 0, 0, 1, 0, 18)], ['house, thatch', () => K.house(g, 0, 0, 1, 1, 19)], ['house, loft', () => K.house(g, 0, 0, 1, 2, 20)], ['the well', () => K.well(g, 0, 0, 1)], ['fence', () => K.fence(g, -20, 0, 40, 1)], ['barrel, sacks', () => { K.barrel(g, -6, 0, 1); K.sack(g, 6, 0, 1); }], ['signposts', () => { K.signpost(g, -8, 0, 1, 1); K.signpost(g, 8, 0, 1, 3); }], ['stile', () => K.stile(g, 0, 0, 1)]];
  row3.forEach(([n, f], i) => cell(80 + i * 120, 440, n, f, 1.5));
  const row4 = [['the windmill', () => K.windmill(g, 0, 0, 0.9)], ['the old mill', () => K.oldMill(g, 0, 0, 0.9)], ['the spring', () => K.spring(g, 0, 0, 1)], ['the shrine', () => K.shrine(g, 0, 0, 1)], ['the chest', () => K.chest(g, 0, 0, 1)], ['the gate', () => K.gate(g, 0, 0, 1)]];
  row4.forEach(([n, f], i) => cell(90 + i * 110, 600, n, f, 1.4));
  cell(800, 600, 'the pond', () => K.pond(g, 0, -10, 30, 16, 21), 1.3);
  // the path pieces and the spot plates
  g.save(); g.translate(0, 0); K.pathStroke(g, [[560, 690], [620, 690], [660, 700], [700, 720]]); K.pathStroke(g, [[700, 690], [740, 690], [770, 690]]); K.pathStroke(g, [[740, 690], [760, 720]]); K.plaza(g, 850, 700, 22); K.plaza(g, 850, 700, 22); g.restore();
  ['wild', 'town', 'spring', 'shrine', 'chest', 'gate', 'shop'].forEach((k, i) => { K.plate(g, 60 + i * 60, 700, k, 1); P.label(g, k, 60 + i * 60, 722, 10, '#2a2436', { align: 'center', weight: 'normal' }); });
  P.label(g, 'path: straight, bend, fork', 640, 736, 10, '#2a2436', { align: 'center', weight: 'normal' }); P.label(g, 'junction plaza', 850, 736, 10, '#2a2436', { align: 'center', weight: 'normal' });
  P.label(g, 'Mitch, AD, 2026-11-01.', Wk / 2, Hk - 6, 10, '#b8b0a4', { align: 'center', weight: 'normal' });
  return cv;
}
(async () => {
  await R.loadMasters();
  const S = 2, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  board(g); chrome(g);
  P.save(cv, path.join(OUT, 'cloverfield2.png')); fs.writeFileSync(path.join(OUT, 'cloverfield2.jpg'), cv.toBuffer('image/jpeg', 90));
  // before and after, side by side
  const before = await P.loadImage(path.join(OUT, 'before.png'));
  const cmp = P.createCanvas((W * 2 + 48) * 2, (H + 60) * 2), cg = cmp.getContext('2d'); cg.scale(2, 2); cg.fillStyle = '#1c1a22'; cg.fillRect(0, 0, W * 2 + 48, H + 60); cg.imageSmoothingEnabled = true; cg.imageSmoothingQuality = 'high';
  cg.drawImage(before, 0, 0, W * 2, H * 2, 16, 44, W, H); cg.drawImage(cv, 0, 0, W * 2, H * 2, W + 32, 44, W, H);
  P.label(cg, 'before', 16 + W / 2, 24, 16, '#f0e8d8', { align: 'center' }); P.label(cg, 'after', W + 32 + W / 2, 24, 16, '#f0e8d8', { align: 'center' });
  fs.writeFileSync(path.join(OUT, 'compare.jpg'), cmp.toBuffer('image/jpeg', 88));
  // the details, three times: terrain and path, the village, the pond and the spring, Windmill Hill and the Old Mill
  const crops = [['terrain and the path', 120, Y0 + 300, 170, 120], ['Puddlewick Village', 100, Y0 + 556, 220, 84], ['Duck Pond and Dewdrop Spring', 20, Y0 + 380, 170, 110], ['Windmill Hill and the Old Mill', 240, Y0 + 220, 170, 190]];
  const Z = 3, dW = 1160, dH = crops.length * 190 + 60, det = P.createCanvas(dW, dH), dg = det.getContext('2d'); dg.fillStyle = '#1c1a22'; dg.fillRect(0, 0, dW, dH); dg.imageSmoothingEnabled = true; dg.imageSmoothingQuality = 'high';
  crops.forEach(([name, x, y, w, h], i) => { const yy = 40 + i * 190, k = Math.min(Z, 170 / h, 560 / w); dg.drawImage(before, x * 2, y * 2, w * 2, h * 2, 16, yy, w * k, h * k); dg.drawImage(cv, x * 2, y * 2, w * 2, h * 2, 600, yy, w * k, h * k); P.label(dg, name + ': before', 16, yy - 8, 12, '#f0e8d8'); P.label(dg, name + ': after', 600, yy - 8, 12, '#f0e8d8'); });
  fs.writeFileSync(path.join(OUT, 'details.jpg'), det.toBuffer('image/jpeg', 88));
  const kit = kitPage(); P.save(kit, path.join(OUT, 'kit.png')); fs.writeFileSync(path.join(OUT, 'kit.jpg'), kit.toBuffer('image/jpeg', 88));
  console.log('wrote', OUT);
})();
