// concepts.js: three visions of the look, as phone stills (Mitch, AD, 2026-11-01). The same scene three times (the meadows
// board from the raised camera, and the fight of the same hero and slime, with the game's chrome from docs/state/client.md),
// so what differs is the hand: A a storybook line (one black line, flat fills, one shade, noon), B a soft meadow (no line
// on the scenery, soft shade, warm late light), C an enchanted twilight (the line hand, a dusk palette, glows). Everything
// is painted in code, nothing from any reference. Draws in CSS units on a 2x canvas.
//   node tools/concepts.js [out dir]   -> <out>/A-board.png, A-fight.png, A.png (both side by side), ..., pick.png
const P = require('./paint.js'); const path = require('path');
const OUT = path.resolve(__dirname, '..', process.argv[2] || 'work/concepts');
const W = 412, H = 915, BAND = [100, 740];

// ---------------------------------------------------------------- the hands
const HANDS = {
  A: { key: 'A', name: 'Storybook line', line: true, soft: false, ink: '#1f1a26', inkW: 2.4, propInk: '#4a2d1b', propInkW: 1.8, shadeK: 0.22, shadeTint: '#3a4fa0',
       sky: ['#4faaf0', '#c6ebfb'], cloud: '#ffffff', cloudShade: '#cfe3f3', farHill: '#a9dcb0', farHill2: '#8ccf9a', sea: '#49b7e9', seaLight: '#9fe0f6',
       grass: '#7ed957', grassShade: '#5cb94a', lip: '#9cf06a', cliff: '#c08a52', cliffShade: '#8d5f34', road: '#f0d68f', roadShade: '#d8b76a', space: '#ffd54a', spaceShade: '#e9a825',
       leaf: '#5cc44e', leafShade: '#3f9a3a', leaf2: '#86d95a', trunk: '#9a6a3c', rock: '#b8b4a6', bush: '#4fb848', house: '#f4f1e6', cap: '#ff7a3d', capShade: '#d9552b', wood: '#c48a4a',
       skin: '#ffe3c4', hair: '#ff6a3d', hairShade: '#d84a2a', tunic: '#3f7fe0', tunicShade: '#2e5fb0', trousers: '#8a5a3a', boots: '#5a3a2a', steel: '#eef3f8', steelShade: '#9fb0c4', iris: '#2f8f4a',
       slime: '#6fd84a', slimeShade: '#45a83a', slimeLight: '#c8ff9a', cast: 0.26, castColor: '#1b3a5a', castLen: 1.0, glow: null, time: 'noon' },
  B: { key: 'B', name: 'Soft meadow', line: true, soft: true, ink: '#4a2e24', inkW: 2.0, propInk: null, propInkW: 0, shadeK: 0.26, shadeTint: '#8a4a30',
       sky: ['#6fb8ec', '#fbe7b8'], cloud: '#fff8ee', cloudShade: '#f0cfa8', farHill: '#bcd9a4', farHill2: '#9ac98a', sea: '#62b9dd', seaLight: '#bfe6ef',
       grass: '#8fd35a', grassShade: '#6aae44', lip: '#b2e86a', cliff: '#c99a60', cliffShade: '#95683c', road: '#f2dca0', roadShade: '#dcbd7c', space: '#ffd96a', spaceShade: '#e6ab2e',
       leaf: '#6cc94e', leafShade: '#4a9a3c', leaf2: '#9ae060', trunk: '#a3744a', rock: '#c2b9a5', bush: '#5dbb4e', house: '#f8f2e4', cap: '#ff8a4a', capShade: '#d9602e', wood: '#c99252',
       skin: '#ffe6c8', hair: '#ff7040', hairShade: '#d8502c', tunic: '#4a86e0', tunicShade: '#3464b4', trousers: '#8f5f3e', boots: '#5e3e2c', steel: '#f2f5f8', steelShade: '#a9b8c8', iris: '#2f8f4a',
       slime: '#7fdc55', slimeShade: '#52ad40', slimeLight: '#d8ffa8', cast: 0.18, castColor: '#5a3a2a', castLen: 1.3, glow: null, time: 'late' },
  C: { key: 'C', name: 'Enchanted twilight', line: true, soft: false, ink: '#1a1430', inkW: 2.4, propInk: '#2c1f4a', propInkW: 1.8, shadeK: 0.3, shadeTint: '#4030a0',
       sky: ['#1d2466', '#7a56c0', '#f5a86a'], cloud: '#d8c6f0', cloudShade: '#9c86d0', farHill: '#6a5aa8', farHill2: '#4a3f8a', sea: '#3a5fb8', seaLight: '#8fb4f0',
       grass: '#4fb86a', grassShade: '#2f8a52', lip: '#7fe08a', cliff: '#7a5a8a', cliffShade: '#4e3a66', road: '#d8c4a0', roadShade: '#b09a78', space: '#ffd86a', spaceShade: '#e0a030',
       leaf: '#3fa86a', leafShade: '#237a4c', leaf2: '#6fd08a', trunk: '#6a4a6a', rock: '#8e8aa8', bush: '#3aa060', house: '#ece6f4', cap: '#ff6a9a', capShade: '#c8406e', wood: '#a07a58',
       skin: '#ffe3c4', hair: '#ff6a3d', hairShade: '#d84a2a', tunic: '#3f7fe0', tunicShade: '#2e5fb0', trousers: '#8a5a3a', boots: '#5a3a2a', steel: '#eef3f8', steelShade: '#9fb0c4', iris: '#2f8f4a',
       slime: '#8f7af0', slimeShade: '#5e48c0', slimeLight: '#e0d4ff', cast: 0.3, castColor: '#10103a', castLen: 1.4, glow: '#ffd86a', time: 'dusk' },
};

// ---------------------------------------------------------------- the one form: fill, one shade, one line
// pathFn(g) builds the path (beginPath inside). c = [cx, cy, r] gives the soft hand its gradient. The flat hand's shade is
// the fill's own darker, cooler tone showing where the lit copy (shifted toward the light) does not cover.
function form(g, hand, pathFn, fill, o = {}) {
  const shadeC = o.shadeColor || P.mix(P.darken(fill, hand.shadeK), hand.shadeTint, 0.22);
  g.save(); pathFn(g); g.fillStyle = fill; g.fill();
  if (o.shade !== false) {
    g.save(); pathFn(g); g.clip();
    if (hand.soft && o.c) { const [cx, cy, r] = o.c; g.fillStyle = P.rad(g, cx - r * 0.35, cy - r * 0.45, cx, cy, r * 1.15, [[0, P.alpha(shadeC, 0)], [0.55, P.alpha(shadeC, 0)], [1, P.alpha(shadeC, 0.95)]]); g.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4); }
    else { const [dx, dy] = o.offset || [-3, -4]; g.fillStyle = shadeC; g.fillRect(-2000, -2000, 4000, 4000); g.translate(dx, dy); pathFn(g); g.fillStyle = fill; g.fill(); }
    g.restore();
  }
  if (o.highlight) { g.save(); pathFn(g); g.clip(); const [hx, hy, hr] = o.highlight; g.fillStyle = P.alpha('#ffffff', hand.soft ? 0.35 : 0.55); g.beginPath(); g.ellipse(hx, hy, hr, hr * 0.5, -0.5, 0, 7); g.fill(); g.restore(); }
  const ink = o.ink === undefined ? hand.ink : o.ink; if (ink && hand.line) { pathFn(g); P.ink(g, o.inkW || hand.inkW, ink); }
  g.restore();
}
const circ = (x, y, r) => g => { g.beginPath(); g.arc(x, y, r, 0, 7); };
const ell = (x, y, rx, ry, rot = 0) => g => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); };
const poly = pts => g => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
const blob = (x, y, rx, ry, n, k, seed) => g => P.blobPath(g, x, y, rx, ry, n, k, P.rng(seed));
const rrect = (x, y, w, h, r) => g => { g.beginPath(); P.rr(g, x, y, w, h, r); };
// a prop's ink: the thinner coloured line (the sticker cure), or none in the soft hand
const propInk = hand => ({ ink: hand.propInk, inkW: hand.propInkW });

// ---------------------------------------------------------------- shadows
function castShadow(g, hand, x, y, w, h, o = {}) {   // on the board: a flat shadow thrown to the lower right, the light from the upper left
  g.save(); g.fillStyle = P.alpha(hand.castColor, hand.cast); g.translate(x, y); g.transform(1, 0, -0.9 * hand.castLen, 0.45, 0, 0);   // sheared, squashed
  g.beginPath(); g.ellipse(w * 0.1 * (o.k || 1), -h * 0.35, w * 0.5, h * 0.5, 0, 0, 7); g.fill(); g.restore();
}
function contactShadow(g, hand, x, y, rx, ry = rx * 0.28) { g.fillStyle = P.alpha(hand.castColor, hand.cast); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }

// ---------------------------------------------------------------- props (x, y = the foot; s = scale, 1 is the fight's size)
function tree(g, hand, x, y, s = 1, seed = 1, o = {}) {
  const r = P.rng(seed), lean = (r() - 0.5) * 8 * s, hs = 1 + (r() - 0.5) * 0.3;
  g.save(); g.translate(x, y); g.scale(s, s * hs);
  form(g, hand, poly([[-7, 0], [7, 0], [5, -40], [-4, -40]]), hand.trunk, { ...propInk(hand), offset: [-2, 0], c: [0, -20, 14] });
  const cx = lean, cy = -62;
  form(g, hand, blob(cx, cy, 36, 30, 11, 0.16, seed + 1), hand.leaf, { ...propInk(hand), offset: [-5, -6], c: [cx, cy, 36] });
  form(g, hand, blob(cx - 12, cy - 12, 20, 15, 8, 0.2, seed + 2), hand.leaf2, { ink: null, shade: false });
  if (o.fruit) for (let i = 0; i < 4; i++) { form(g, hand, circ(cx - 20 + r() * 40, cy - 10 + r() * 24, 3.2), hand.cap, { ink: hand.ink, inkW: 1.2, shade: false }); }
  g.restore();
}
function bush(g, hand, x, y, s = 1, seed = 2) {
  g.save(); g.translate(x, y); g.scale(s, s);
  form(g, hand, blob(0, -14, 24, 15, 9, 0.2, seed), hand.bush, { ...propInk(hand), offset: [-4, -5], c: [0, -14, 24] });
  form(g, hand, blob(-6, -20, 11, 8, 7, 0.2, seed + 1), hand.leaf2, { ink: null, shade: false });
  g.restore();
}
function rock(g, hand, x, y, s = 1, seed = 3) {
  g.save(); g.translate(x, y); g.scale(s, s);
  form(g, hand, poly([[-18, 0], [-14, -14], [-4, -20], [10, -17], [18, -6], [16, 0]]), hand.rock, { ...propInk(hand), offset: [-4, -4], c: [0, -9, 18] });
  g.restore();
}
function mushroom(g, hand, x, y, s = 1, col) {
  g.save(); g.translate(x, y); g.scale(s, s);
  form(g, hand, rrect(-4, -12, 8, 12, 3), '#f6efdc', { ...propInk(hand), offset: [-1, 0], c: [0, -6, 6] });
  form(g, hand, ell(0, -13, 11, 7), col || hand.cap, { ...propInk(hand), offset: [-2, -3], c: [0, -13, 11], highlight: [-3, -16, 4] });
  g.restore();
}
function house(g, hand, x, y, s = 1) {   // the town: a mushroom-cap house, seen a touch from above
  g.save(); g.translate(x, y); g.scale(s, s);
  form(g, hand, rrect(-20, -34, 40, 34, 8), hand.house, { ...propInk(hand), offset: [-4, 0], c: [0, -17, 22] });
  form(g, hand, rrect(-5, -16, 10, 16, 4), hand.wood, { ink: hand.propInk, inkW: 1.4, shade: false });
  form(g, hand, circ(12, -24, 4), hand.sky[0], { ink: hand.propInk, inkW: 1.2, shade: false });
  form(g, hand, ell(0, -40, 34, 16), hand.cap, { ...propInk(hand), offset: [-5, -5], c: [0, -40, 34], highlight: [-12, -46, 8] });
  for (const [dx, dy, r] of [[-14, -40, 4], [8, -46, 3], [18, -36, 3]]) form(g, hand, circ(dx, dy, r), '#fff2d8', { ink: null, shade: false });
  if (hand.glow) { g.fillStyle = P.alpha(hand.glow, 0.9); g.beginPath(); g.arc(12, -24, 3.5, 0, 7); g.fill(); g.fillStyle = P.alpha(hand.glow, 0.25); g.beginPath(); g.arc(12, -24, 10, 0, 7); g.fill(); }
  g.restore();
}
function signpost(g, hand, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  form(g, hand, rrect(-3, -40, 6, 40, 2), hand.wood, { ...propInk(hand), offset: [-1, 0], c: [0, -20, 5] });
  form(g, hand, poly([[-16, -38], [12, -38], [18, -32], [12, -26], [-16, -26]]), hand.wood, { ...propInk(hand), offset: [-2, -2], c: [0, -32, 16] });
  g.restore();
}
function lantern(g, hand, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  form(g, hand, rrect(-2, -44, 4, 44, 1.5), '#4a3a5a', { ...propInk(hand), shade: false });
  form(g, hand, rrect(-7, -56, 14, 16, 3), '#5a4a6a', { ...propInk(hand), offset: [-2, -2], c: [0, -48, 8] });
  if (hand.glow) { g.fillStyle = P.alpha(hand.glow, 0.22); g.beginPath(); g.arc(0, -48, 22, 0, 7); g.fill(); g.fillStyle = hand.glow; g.beginPath(); g.arc(0, -48, 4, 0, 7); g.fill(); }
  else { g.fillStyle = '#ffe8a0'; g.beginPath(); g.arc(0, -48, 3.5, 0, 7); g.fill(); }
  g.restore();
}
function flowers(g, hand, x, y, n, seed, s = 1) { const r = P.rng(seed); for (let i = 0; i < n; i++) { const fx = x + (r() - 0.5) * 60 * s, fy = y + (r() - 0.5) * 24 * s, c = ['#ff6b8a', '#ffd04a', '#ffffff', '#ff9a4a'][Math.floor(r() * 4)]; g.fillStyle = c; g.beginPath(); g.arc(fx, fy, 2.2 * s, 0, 7); g.fill(); } }
function tufts(g, hand, x0, x1, y, seed, s = 1) { const r = P.rng(seed); for (let x = x0; x < x1; x += 14 * s) { const h = (6 + r() * 6) * s, lean = (r() - 0.5) * 6 * s; form(g, hand, poly([[x - 4 * s, y], [x + lean, y - h], [x + 4 * s, y]]), hand.lip, { ink: null, shade: false }); } }

// ---------------------------------------------------------------- the hero (a chibi person, two and a half heads; the Warrior)
// h is the height in CSS px from the feet to the top of the hair. Side view faces right; the front view is the board token.
function heroSide(g, hand, x, y, h) {
  const s = h / 100; g.save(); g.translate(x, y); g.scale(s, s);
  const K = { ink: hand.ink, inkW: hand.inkW / s * Math.min(1, s * 1.1) };
  // the far arm, behind the body
  form(g, hand, poly([[-6, -54], [-13, -40], [-11, -32], [-5, -34], [-2, -46]]), hand.tunic, { ...K, offset: [-2, -2], c: [-7, -43, 10] });
  form(g, hand, circ(-9, -30, 4.2), hand.skin, { ...K, shade: false });
  // the legs: two short stubs to big boots
  for (const [lx, boot] of [[-7, true], [5, true]]) {
    form(g, hand, rrect(lx - 5, -26, 10, 20, 3), hand.trousers, { ...K, offset: [-2, 0], c: [lx, -16, 7] });
    form(g, hand, poly([[lx - 7, -9], [lx + 9, -9], [lx + 11, -2], [lx + 9, 0], [lx - 7, 0]]), hand.boots, { ...K, offset: [-2, -2], c: [lx, -4, 9] });
  }
  // the body: one contour, the tunic flaring at the hem
  form(g, hand, poly([[-12, -60], [12, -60], [14, -44], [12, -36], [15, -24], [-15, -24], [-12, -36], [-14, -44]]), hand.tunic, { ...K, offset: [-3, -3], c: [0, -42, 16] });
  form(g, hand, rrect(-15, -34, 30, 5, 1.5), hand.trousers, { ...K, shade: false });
  form(g, hand, circ(0, -31.5, 2.2), '#ffd24a', { ink: null, shade: false });
  // the near arm, forward, holding the sword
  form(g, hand, poly([[6, -56], [16, -48], [22, -40], [16, -36], [10, -44], [2, -48]]), hand.tunic, { ...K, offset: [-2, -2], c: [12, -46, 10] });
  const sw = [[19, -38], [26, -46], [40, -78], [46, -84], [48, -78], [34, -44]];
  form(g, hand, poly(sw), hand.steel, { ...K, offset: [-1.5, -1.5], c: [34, -62, 22] });
  form(g, hand, rrect(16, -46, 14, 5, 1.5), '#ffd24a', { ...K, shade: false }); // the guard
  form(g, hand, circ(19, -38, 4.6), hand.skin, { ...K, shade: false });        // the fist over the grip
  // the head
  form(g, hand, circ(2, -80, 22), hand.skin, { ...K, offset: [-3, -4], c: [2, -80, 22] });
  // the hair: a cap with a swept fringe and spikes to the back, one mass
  form(g, hand, poly([[24, -86], [23, -96], [14, -104], [2, -106], [-8, -104], [-20, -100], [-34, -98], [-26, -92], [-38, -84], [-27, -82], [-34, -70], [-24, -76], [-22, -84], [-10, -90], [-2, -87], [4, -94], [10, -88], [16, -92], [20, -86], [22, -80]]), hand.hair, { ...K, offset: [-3, -4], c: [-4, -92, 26] });
  // the face: the near eye big, the far eye smaller, both looking forward; a brow; a small mouth; a cheek
  for (const [ex, w, hgt] of [[12, 5.2, 8], [-1, 4.2, 7.4]]) {
    form(g, hand, ell(ex, -78, w, hgt), '#ffffff', { ink: hand.ink, inkW: 1.4, shade: false });
    g.fillStyle = hand.iris; g.beginPath(); g.ellipse(ex + 1.2, -77.5, w * 0.62, hgt * 0.68, 0, 0, 7); g.fill();
    g.fillStyle = hand.ink; g.beginPath(); g.ellipse(ex + 1.6, -77, w * 0.36, hgt * 0.42, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex - 0.6, -80.5, 1.6, 1.9, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(ex - w, -78 - hgt - 2.5); g.quadraticCurveTo(ex, -78 - hgt - 5, ex + w, -78 - hgt - 2); P.ink(g, 1.8, hand.hairShade);
  }
  g.beginPath(); g.moveTo(10, -66); g.quadraticCurveTo(13, -63, 16, -66); P.ink(g, 1.4, hand.ink);
  g.fillStyle = P.alpha('#ff7a6a', 0.45); g.beginPath(); g.ellipse(18, -70, 3.5, 2, 0, 0, 7); g.fill();
  g.restore();
}
function heroFront(g, hand, x, y, h) {   // the board token: facing the camera, the sword at the side
  const s = h / 100; g.save(); g.translate(x, y); g.scale(s, s);
  const K = { ink: hand.ink, inkW: hand.inkW / s * Math.min(1, s * 1.6) };
  for (const lx of [-7, 7]) { form(g, hand, rrect(lx - 5, -26, 10, 20, 3), hand.trousers, { ...K, offset: [-2, 0], c: [lx, -16, 7] }); form(g, hand, rrect(lx - 7, -9, 14, 9, 3), hand.boots, { ...K, offset: [-2, -2], c: [lx, -4, 8] }); }
  form(g, hand, poly([[-14, -60], [14, -60], [16, -36], [18, -24], [-18, -24], [-16, -36]]), hand.tunic, { ...K, offset: [-3, -3], c: [0, -42, 18] });
  form(g, hand, rrect(-17, -34, 34, 5, 1.5), hand.trousers, { ...K, shade: false });
  for (const sx of [-1, 1]) { form(g, hand, poly([[sx * 14, -58], [sx * 24, -44], [sx * 22, -32], [sx * 15, -34], [sx * 10, -46]]), hand.tunic, { ...K, offset: [-2, -2], c: [sx * 18, -45, 9] }); form(g, hand, circ(sx * 21, -31, 4.4), hand.skin, { ...K, shade: false }); }
  form(g, hand, poly([[22, -34], [26, -34], [27, -2], [23, 0]]), hand.steel, { ...K, offset: [-1, 0], c: [24, -18, 14] });
  form(g, hand, circ(0, -80, 22), hand.skin, { ...K, offset: [-3, -4], c: [0, -80, 22] });
  form(g, hand, poly([[-24, -84], [-26, -96], [-16, -104], [-4, -108], [8, -106], [18, -100], [26, -92], [24, -82], [16, -88], [8, -84], [0, -90], [-8, -84], [-16, -90]]), hand.hair, { ...K, offset: [-3, -4], c: [0, -94, 26] });
  for (const ex of [-8, 8]) { form(g, hand, ell(ex, -78, 5, 7.6), '#ffffff', { ink: hand.ink, inkW: 1.4, shade: false }); g.fillStyle = hand.iris; g.beginPath(); g.ellipse(ex, -77.5, 3.2, 5.2, 0, 0, 7); g.fill(); g.fillStyle = hand.ink; g.beginPath(); g.ellipse(ex, -77, 1.9, 3.2, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex - 1.5, -80.5, 1.6, 1.9, 0, 0, 7); g.fill(); }
  g.beginPath(); g.moveTo(-3, -66); g.quadraticCurveTo(0, -63, 3, -66); P.ink(g, 1.4, hand.ink);
  g.restore();
}

// ---------------------------------------------------------------- the slime (one round shape with a big face; faces left in the fight)
function slime(g, hand, x, y, h, o = {}) {
  const s = h / 90, f = o.flip ? -1 : 1; g.save(); g.translate(x, y); g.scale(s * f, s);
  const K = { ink: hand.ink, inkW: hand.inkW / s * Math.min(1, s * 1.2) };
  const body = g2 => { g2.beginPath(); g2.moveTo(-52, 0); g2.quadraticCurveTo(-58, -40, -30, -72); g2.quadraticCurveTo(-10, -92, 6, -84); g2.quadraticCurveTo(14, -96, 16, -84); g2.quadraticCurveTo(44, -78, 52, -40); g2.quadraticCurveTo(58, 0, 0, 0); g2.closePath(); };
  form(g, hand, body, hand.slime, { ...K, offset: [-5, -7], c: [0, -40, 52], highlight: [-22, -64, 12] });
  if (hand.glow) { g.fillStyle = P.alpha(hand.slimeLight, 0.35); g.beginPath(); g.ellipse(-6, -36, 30, 24, 0, 0, 7); g.fill(); }
  for (const [ex, w] of [[-26, 10], [2, 8.5]]) {
    form(g, hand, ell(ex, -46, w, w * 1.3), '#ffffff', { ink: hand.ink, inkW: 1.6, shade: false });
    g.fillStyle = hand.ink; g.beginPath(); g.ellipse(ex - 2.5, -45, w * 0.62, w * 0.85, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex - 5, -50, 2.6, 3.2, 0, 0, 7); g.fill();
  }
  form(g, hand, g2 => { g2.beginPath(); g2.moveTo(-30, -28); g2.quadraticCurveTo(-12, -10, 8, -28); g2.quadraticCurveTo(-12, -22, -30, -28); g2.closePath(); }, '#8a2a3a', { ink: hand.ink, inkW: 1.6, shade: false });
  g.fillStyle = '#ff8aa0'; g.beginPath(); g.ellipse(-12, -20, 7, 3.5, 0, 0, 7); g.fill();
  g.fillStyle = P.alpha('#ff7a8a', 0.4); g.beginPath(); g.ellipse(-40, -34, 6, 3.5, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(16, -34, 6, 3.5, 0, 0, 7); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- the chrome (docs/state/client.md: the HUD to y 100, the band to 740, the strip below)
function chrome(g, hand, mode) {
  const cream = '#f8ecc6', dark = '#2a2436';
  g.fillStyle = dark; g.fillRect(0, 0, W, BAND[0]); g.fillRect(0, BAND[1], W, H - BAND[1]);
  g.fillStyle = cream; g.beginPath(); P.rr(g, 10, 10, W - 20, 82, 12); g.fill(); P.ink(g, 2.5, P.INK);
  P.label(g, 'Robin · Warrior', 24, 32, 15, P.INK); P.label(g, 'Lv 2 · HP 41/132 · MP 10/22', 24, 54, 12, '#5a5048', { weight: 'normal' });
  g.fillStyle = '#fff'; g.beginPath(); P.rr(g, 24, 66, 150, 10, 5); g.fill(); P.ink(g, 1.2, P.INK); g.fillStyle = '#6ed34a'; g.beginPath(); P.rr(g, 25, 67, 46, 8, 4); g.fill();
  g.beginPath(); g.arc(200, 70, 6, 0, 7); g.fillStyle = '#ffcc33'; g.fill(); P.ink(g, 1.2, P.INK); P.label(g, '127', 212, 70, 13, P.INK);
  P.label(g, mode === 'board' ? 'Ashford Meadows · a wild spot' : 'Ashford Meadows · a fight', 24, 82, 11, '#5a5048', { weight: 'normal' });
  g.fillStyle = '#fff'; g.beginPath(); P.rr(g, 340, 22, 52, 52, 10); g.fill(); P.ink(g, 2, P.INK); for (const [dx, dy] of [[-12, -12], [12, 12], [12, -12], [-12, 12], [0, 0]]) { g.fillStyle = P.INK; g.beginPath(); g.arc(366 + dx, 48 + dy, 4, 0, 7); g.fill(); }
  if (mode === 'board') {
    P.label(g, 'You landed on a wild spot. A slime is near.', W / 2, 776, 12, '#e8e0d0', { align: 'center', weight: 'normal' });
    for (const [t, x] of [['Map', 72], ['Bag', 206], ['Log', 340]]) { g.fillStyle = '#4a4258'; g.beginPath(); P.rr(g, x - 56, 818, 112, 36, 10); g.fill(); P.ink(g, 1.5, '#1a1624'); P.label(g, t, x, 836, 14, '#f0e8d8', { align: 'center' }); }
    g.fillStyle = P.lin(g, 0, 858, 0, 910, [[0, '#ffe680'], [1, '#e6a820']]); g.beginPath(); P.rr(g, 56, 858, 300, 52, 14); g.fill(); P.ink(g, 2.5, P.INK); P.label(g, 'ROLL', 206, 884, 20, P.INK, { align: 'center' });
  } else {
    P.label(g, 'The slime winds up a bounce.', W / 2, 760, 12, '#e8e0d0', { align: 'center', weight: 'normal' });
    [['ATTACK', 14, 776, '#e8503e'], ['SKILL', 210, 776, '#3f7fd8'], ['ITEM', 14, 844, '#6ab85a'], ['DEFEND', 210, 844, '#8a8f98']].forEach(([t, x, y, c]) => { g.fillStyle = c; g.beginPath(); P.rr(g, x, y, 188, 58, 12); g.fill(); P.ink(g, 2.5, P.INK); P.label(g, t, x + 94, y + 30, 17, '#fff', { align: 'center', stroke: P.INK, strokeW: 4 }); });
  }
}

// ---------------------------------------------------------------- the sky and the far
function sky(g, hand, y0, y1) { g.fillStyle = P.lin(g, 0, y0, 0, y1, hand.sky.map((c, i, a) => [i / (a.length - 1), c])); g.fillRect(0, y0, W, y1 - y0); if (hand.time === 'dusk') { const r = P.rng(9); g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.4 + r() * 0.6; g.beginPath(); g.arc(r() * W, y0 + r() * (y1 - y0) * 0.5, 0.8 + r(), 0, 7); g.fill(); } g.globalAlpha = 1; } }
function cloud(g, hand, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); const lobes = [[0, 0, 22], [-24, 6, 15], [22, 4, 17], [-8, -8, 16], [10, -6, 14]]; const pathFn = g2 => { g2.beginPath(); for (const [lx, ly, lr] of lobes) { g2.moveTo(lx + lr, ly); g2.arc(lx, ly, lr, 0, 7); } g2.moveTo(-40, 12); g2.lineTo(40, 12); g2.lineTo(40, 2); g2.lineTo(-40, 2); g2.closePath(); };
  if (hand.line && hand.propInk) { pathFn(g); P.ink(g, 2.4 / s, P.alpha(hand.propInk, 0.45)); }   // the line under the fills: only the silhouette shows
  g.fillStyle = hand.cloudShade; pathFn(g); g.fill(); g.save(); pathFn(g); g.clip(); g.fillStyle = hand.cloud; g.translate(-3, -5); pathFn(g); g.fill(); g.restore(); g.restore(); }
function castle(g, hand, x, y, s) {   // a far silhouette in the hill's tone, no line: towers with pointed roofs
  g.save(); g.translate(x, y); g.scale(s, s); const c = P.mix(hand.farHill2, hand.sky[0], 0.25), roof = P.mix(hand.cap, hand.sky[0], 0.45);
  g.fillStyle = c; for (const [tx, tw, th] of [[-34, 12, 40], [-10, 16, 60], [16, 12, 44], [36, 10, 30]]) { g.fillRect(tx - tw / 2, -th, tw, th); g.fillStyle = roof; g.beginPath(); g.moveTo(tx - tw / 2 - 2, -th); g.lineTo(tx, -th - tw * 1.3); g.lineTo(tx + tw / 2 + 2, -th); g.closePath(); g.fill(); g.fillStyle = c; }
  g.fillRect(-40, -22, 82, 22); g.restore();
}
function island(g, hand, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); form(g, hand, poly([[-40, 0], [40, 0], [26, 26], [4, 40], [-18, 28]]), hand.cliff, { ...propInk(hand), offset: [-3, -3], c: [0, 14, 30] }); form(g, hand, ell(0, -2, 44, 12), hand.grass, { ...propInk(hand), offset: [-3, -3], c: [0, -2, 40] }); tree(g, hand, -10, -6, 0.5, 31); bush(g, hand, 18, -2, 0.5, 32); g.restore(); }

// ---------------------------------------------------------------- the board (the meadows from the raised camera)
function board(g, hand) {
  const [y0, y1] = BAND; g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip();
  sky(g, hand, y0, y0 + 190);
  cloud(g, hand, 70, y0 + 48, 0.9); cloud(g, hand, 300, y0 + 36, 1.1); cloud(g, hand, 190, y0 + 92, 0.6);
  if (hand.time === 'dusk') island(g, hand, 330, y0 + 70, 0.7);
  // the far hills and the sea
  form(g, hand, blob(90, y0 + 190, 170, 42, 12, 0.08, 41), hand.farHill2, { ink: null, shade: false });
  form(g, hand, blob(330, y0 + 196, 150, 36, 12, 0.08, 42), hand.farHill, { ink: null, shade: false });
  g.fillStyle = hand.sea; g.fillRect(0, y0 + 196, W, y1 - y0 - 196); g.fillStyle = P.alpha(hand.seaLight, 0.5); for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(30 + i * 48, y0 + 214 + (i % 3) * 10, 14, 1.6, 0, 0, 7); g.fill(); }
  // the land: one plate with a soft edge toward the sea, a plateau at the right with a cliff face
  const land = blob(206, y0 + 440, 260, 230, 16, 0.07, 43);
  g.save(); land(g); g.clip(); g.fillStyle = hand.grass; g.fillRect(0, y0, W, y1 - y0);
  if (hand.soft) { const r = P.rng(5); for (let i = 0; i < 260; i++) { P.dab(g, r() * W, y0 + 230 + r() * 420, 10 + r() * 18, i % 2 ? hand.grassShade : hand.lip, 0.16, 0.4); } }
  else { const r = P.rng(5); g.fillStyle = P.alpha(hand.grassShade, 0.5); for (let i = 0; i < 70; i++) { g.beginPath(); g.ellipse(r() * W, y0 + 240 + r() * 420, 6 + r() * 10, 3 + r() * 3, 0, 0, 7); g.fill(); } }
  g.restore();
  // the shore: a pale sand rim where the land meets the sea
  g.save(); land(g); P.ink(g, 10, hand.road); g.restore(); g.save(); land(g); if (hand.line && hand.propInk) P.ink(g, 1.6, P.alpha(hand.propInk, 0.6)); g.restore();
  // the plateau: a step up with a cliff face below its near edge
  const top = blob(300, y0 + 330, 110, 62, 12, 0.08, 44);
  g.save(); g.translate(0, 26); top(g); g.fillStyle = hand.cliffShade; g.fill(); g.restore();
  g.save(); top(g); g.clip(); g.translate(0, 26); top(g); g.clip(); g.restore();
  g.save(); g.beginPath(); g.rect(170, y0 + 330, 260, 60); g.clip(); g.translate(0, 26); form(g, hand, top, hand.cliff, { ...propInk(hand), offset: [-3, -3], c: [300, y0 + 330, 110] }); g.restore();
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(215 + i * 22, y0 + 372 + (i % 2) * 6); g.lineTo(222 + i * 22, y0 + 384 + (i % 3) * 4); P.ink(g, 1.4, P.alpha(hand.cliffShade, 0.8)); }
  form(g, hand, top, hand.grass, { ...propInk(hand), offset: [-4, -5], c: [300, y0 + 330, 110] });
  g.save(); top(g); P.ink(g, 5, hand.lip); g.restore(); g.save(); top(g); if (hand.line && hand.propInk) P.ink(g, 1.6, P.alpha(hand.propInk, 0.8)); g.restore();
  // the road and the spaces
  const spots = [[70, y0 + 600, 'wild'], [150, y0 + 556, 'wild'], [232, y0 + 530, 'wild'], [312, y0 + 560, 'chest'], [340, y0 + 478, 'wild'], [262, y0 + 436, 'town'], [176, y0 + 456, 'wild'], [100, y0 + 404, 'wild'], [148, y0 + 348, 'spring'], [250, y0 + 300, 'wild'], [330, y0 + 296, 'gate']];
  g.beginPath(); spots.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineJoin = 'round'; g.lineCap = 'round';
  if (hand.line && hand.propInk) { g.lineWidth = 22; g.strokeStyle = hand.propInk; g.stroke(); }
  g.lineWidth = 19; g.strokeStyle = hand.roadShade; g.stroke(); g.lineWidth = 14; g.strokeStyle = hand.road; g.stroke();
  for (const [x, y, k] of spots) { const r = k === 'town' ? 17 : k === 'gate' ? 18 : 12; castShadow(g, hand, x, y, r * 2, r * 0.6, { k: 0.3 }); form(g, hand, ell(x, y, r, r * 0.55), k === 'wild' ? hand.space : k === 'chest' ? '#e8a84a' : k === 'spring' ? '#8fe0ff' : hand.space, { ink: hand.ink, inkW: 1.6, offset: [-2, -2], c: [x, y, r] }); }
  // props, in clusters, each with a cast shadow; drawn in depth order (y)
  const items = [];
  const add = (y, fn) => items.push({ y, fn });
  add(y0 + 258, () => { castShadow(g, hand, 40, y0 + 262, 60, 70); tree(g, hand, 40, y0 + 262, 0.78, 11); });
  add(y0 + 268, () => { castShadow(g, hand, 86, y0 + 272, 60, 70); tree(g, hand, 86, y0 + 272, 0.86, 12, { fruit: true }); });
  add(y0 + 282, () => { castShadow(g, hand, 60, y0 + 284, 26, 24); bush(g, hand, 60, y0 + 284, 0.7, 13); });
  add(y0 + 300, () => { castShadow(g, hand, 392, y0 + 304, 60, 70); tree(g, hand, 392, y0 + 304, 0.8, 14); });
  add(y0 + 322, () => { castShadow(g, hand, 232, y0 + 326, 60, 70); tree(g, hand, 232, y0 + 326, 0.82, 15); });
  add(y0 + 330, () => { castShadow(g, hand, 196, y0 + 332, 20, 18); rock(g, hand, 196, y0 + 332, 0.7, 16); });
  add(y0 + 296, () => { castShadow(g, hand, 330, y0 + 296, 40, 44); form(g, hand, poly([[318, y0 + 296], [318, y0 + 262], [324, y0 + 254], [336, y0 + 254], [342, y0 + 262], [342, y0 + 296], [336, y0 + 296], [336, y0 + 270], [324, y0 + 270], [324, y0 + 296]]), hand.rock, { ...propInk(hand), offset: [-2, -2], c: [330, y0 + 275, 20] }); });
  add(y0 + 436, () => { castShadow(g, hand, 262, y0 + 430, 70, 60); house(g, hand, 262, y0 + 430, 0.9); });
  add(y0 + 410, () => { castShadow(g, hand, 60, y0 + 414, 60, 70); tree(g, hand, 60, y0 + 414, 0.9, 17); });
  add(y0 + 424, () => { castShadow(g, hand, 34, y0 + 428, 26, 24); bush(g, hand, 34, y0 + 428, 0.8, 18); });
  add(y0 + 348, () => { form(g, hand, ell(148, y0 + 348, 15, 7), hand.seaLight, { ink: hand.propInk, inkW: 1.4, shade: false }); });
  add(y0 + 470, () => { castShadow(g, hand, 384, y0 + 474, 20, 18); rock(g, hand, 384, y0 + 474, 0.8, 19); flowers(g, hand, 360, y0 + 490, 10, 20, 0.8); });
  add(y0 + 500, () => { castShadow(g, hand, 210, y0 + 500, 30, 36); signpost(g, hand, 210, y0 + 500, 0.75); });
  add(y0 + 520, () => { castShadow(g, hand, 380, y0 + 524, 60, 70); tree(g, hand, 380, y0 + 524, 0.9, 21); });
  add(y0 + 540, () => { castShadow(g, hand, 350, y0 + 544, 26, 24); bush(g, hand, 350, y0 + 544, 0.8, 22); flowers(g, hand, 300, y0 + 600, 12, 23, 0.8); });
  add(y0 + 580, () => { castShadow(g, hand, 24, y0 + 584, 60, 70); tree(g, hand, 24, y0 + 584, 0.95, 24); mushroom(g, hand, 56, y0 + 592, 0.7); mushroom(g, hand, 44, y0 + 600, 0.5, hand.leaf2); });
  add(y0 + 590, () => { castShadow(g, hand, 120, y0 + 596, 26, 24); bush(g, hand, 120, y0 + 596, 0.75, 25); flowers(g, hand, 180, y0 + 586, 8, 26, 0.8); });
  if (hand.time === 'dusk') { add(y0 + 470, () => lantern(g, hand, 300, y0 + 470, 0.8)); add(y0 + 540, () => lantern(g, hand, 196, y0 + 544, 0.8)); }
  add(y0 + 457, () => { contactShadow(g, hand, 176, y0 + 457, 11, 4); slime(g, hand, 176, y0 + 456, 30, { flip: true }); });
  add(y0 + 531, () => { contactShadow(g, hand, 232, y0 + 531, 11, 4); heroFront(g, hand, 232, y0 + 528, 44); });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  if (hand.time === 'dusk') { const r = P.rng(77); for (let i = 0; i < 26; i++) { g.fillStyle = P.alpha(hand.glow, 0.5 + r() * 0.5); g.beginPath(); g.arc(r() * W, y0 + 260 + r() * 440, 1 + r() * 1.4, 0, 7); g.fill(); } }
  if (hand.time === 'late') { g.fillStyle = P.lin(g, 0, y0, 0, y1, [[0, 'rgba(255,200,120,0)'], [1, 'rgba(255,170,90,0.14)']]); g.fillRect(0, y0, W, y1 - y0); }
  g.restore();
}

// ---------------------------------------------------------------- the fight (the side view of the same place)
function fight(g, hand, heroH) {
  const [y0, y1] = BAND, ground = y0 + 520; g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip();
  sky(g, hand, y0, ground);
  cloud(g, hand, 80, y0 + 60, 1.2); cloud(g, hand, 320, y0 + 40, 0.9); cloud(g, hand, 230, y0 + 110, 0.7);
  if (hand.time === 'dusk') island(g, hand, 320, y0 + 150, 0.6);
  // the far plane: soft hills, no line, paler; a far castle on the hill (an enchanted kingdom), low clouds at the horizon
  cloud(g, hand, 40, ground - 150, 0.8); cloud(g, hand, 380, ground - 170, 1.0);
  form(g, hand, blob(120, ground - 60, 230, 120, 14, 0.06, 51), hand.farHill, { ink: null, shade: false });
  form(g, hand, blob(360, ground - 50, 220, 95, 14, 0.06, 52), hand.farHill2, { ink: null, shade: false });
  castle(g, hand, 150, ground - 128, 0.9);
  // the mid plane: a tree line, less saturated, thinner line
  const mid = { ...hand, leaf: P.mix(hand.leaf, hand.sky[hand.sky.length - 1], 0.3), leaf2: P.mix(hand.leaf2, hand.sky[hand.sky.length - 1], 0.3), trunk: P.mix(hand.trunk, hand.sky[hand.sky.length - 1], 0.3), propInk: hand.propInk && P.alpha(hand.propInk, 0.45), propInkW: 1.2 };
  for (let i = 0; i < 7; i++) { const x = 20 + i * 64, s = 0.9 + (i % 3) * 0.15; tree(g, mid, x, ground - 40 + (i % 2) * 8, s * 0.8, 60 + i); }
  g.fillStyle = P.alpha(hand.sky[hand.sky.length - 1], 0.25); g.fillRect(0, ground - 140, W, 140);
  // the ground: a bright grass lip over a dark cliff body
  form(g, hand, poly([[0, ground + 8], [W, ground + 8], [W, y1], [0, y1]]), hand.cliffShade, { ink: null, shade: false });
  const r = P.rng(8); for (let i = 0; i < 40; i++) { const x = r() * W, y = ground + 24 + r() * (y1 - ground - 30), w = 8 + r() * 22, h = 5 + r() * 9; form(g, hand, blob(x, y, w, h, 7, 0.25, 100 + i), hand.cliff, { ...propInk(hand), inkW: 1.2, offset: [-2, -3], c: [x, y, w] }); }
  form(g, hand, g2 => { g2.beginPath(); g2.moveTo(0, ground + 14); for (let x = 0; x <= W; x += 24) g2.lineTo(x + 12, ground - 4 + ((x / 24) % 2) * 6); g2.lineTo(W, ground + 14); g2.closePath(); }, hand.grass, { ...propInk(hand), offset: [0, -4], c: [W / 2, ground, W] });
  g.fillStyle = hand.lip; g.fillRect(0, ground - 2, W, 5); tufts(g, hand, 6, W, ground - 2, 9, 1.1);
  // the near props
  castShadow(g, hand, 60, ground + 2, 10, 4); tree(g, hand, 48, ground + 2, 1.5, 70, { fruit: true });
  contactShadow(g, hand, 372, ground + 4, 36, 8); bush(g, hand, 372, ground + 2, 1.3, 71); mushroom(g, hand, 340, ground + 4, 1.1); mushroom(g, hand, 356, ground + 8, 0.8, hand.leaf2);
  contactShadow(g, hand, 300, ground + 4, 18, 5); signpost(g, hand, 300, ground + 2, 1.1); flowers(g, hand, 220, ground + 10, 10, 72, 1.1);
  if (hand.time === 'dusk') lantern(g, hand, 150, ground + 2, 1.1);
  // the fighters
  contactShadow(g, hand, 120, ground + 6, heroH * 0.36, heroH * 0.1); heroSide(g, hand, 120, ground + 4, heroH);
  contactShadow(g, hand, 300, ground + 6, 48, 12); slime(g, hand, 300, ground + 4, heroH * 0.72);
  if (hand.time === 'dusk') { const r2 = P.rng(78); for (let i = 0; i < 18; i++) { g.fillStyle = P.alpha(hand.glow, 0.5 + r2() * 0.5); g.beginPath(); g.arc(r2() * W, ground - 200 + r2() * 220, 1.2 + r2() * 1.4, 0, 7); g.fill(); } }
  if (hand.time === 'late') { g.fillStyle = P.lin(g, 0, y0, 0, y1, [[0, 'rgba(255,200,120,0)'], [1, 'rgba(255,170,90,0.14)']]); g.fillRect(0, y0, W, y1 - y0); }
  g.restore();
}

// ---------------------------------------------------------------- the pages
function phone(draw) { const cv = P.createCanvas(W * 2, H * 2), g = cv.getContext('2d'); g.scale(2, 2); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; draw(g); return cv; }
function page(parts, caption) {   // the phones side by side at 1x, with a caption
  const gap = 24, pad = 24, cw = W, ch = H, cv = P.createCanvas(pad * 2 + parts.length * cw + (parts.length - 1) * gap, pad * 2 + ch + 44), g = cv.getContext('2d');
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  parts.forEach((p, i) => { const x = pad + i * (cw + gap); g.drawImage(p.cv, x, pad + 44, cw, ch); P.label(g, p.title, x + cw / 2, pad + 20, 18, '#f0e8d8', { align: 'center' }); });
  if (caption) P.label(g, caption, cv.width / 2, cv.height - 10, 13, '#b8b0a4', { align: 'center', weight: 'normal' });
  return cv;
}
(async () => {
  const HERO_H = 130;   // the fight's hero: between the old 100 and the game's 160; the height is Robin's to set
  const pages = [];
  for (const hand of Object.values(HANDS)) {
    const b = phone(g => { board(g, hand); chrome(g, hand, 'board'); }), f = phone(g => { fight(g, hand, HERO_H); chrome(g, hand, 'fight'); });
    P.save(b, path.join(OUT, `${hand.key}-board.png`)); P.save(f, path.join(OUT, `${hand.key}-fight.png`));
    const pg = page([{ cv: b, title: `${hand.key}. ${hand.name}: the board` }, { cv: f, title: `${hand.key}. ${hand.name}: the fight` }], 'Phone size, 412 by 915, the game\'s chrome on. Mitch, AD, 2026-11-01.');
    P.save(pg, path.join(OUT, `${hand.key}.png`)); pages.push({ cv: f, title: `${hand.key}. ${hand.name}` });
  }
  P.save(page(pages, 'Three hands, the same fight. Pick one, or say what to mix. Mitch, AD, 2026-11-01.'), path.join(OUT, 'pick.png'));
  // the hero and the slime close, at 3x, in each hand, for the faces
  const z = P.createCanvas(3 * 300 * 3, 190 * 3), zg = z.getContext('2d'); zg.scale(3, 3); zg.fillStyle = '#e8e0d0'; zg.fillRect(0, 0, 900, 190);
  Object.values(HANDS).forEach((hand, i) => { const x = i * 300; zg.fillStyle = hand.grass; zg.fillRect(x, 150, 300, 40); contactShadow(zg, hand, x + 90, 152, 40, 10); heroSide(zg, hand, x + 90, 150, 130); contactShadow(zg, hand, x + 215, 152, 48, 12); slime(zg, hand, x + 215, 150, 94); P.label(zg, `${hand.key}. ${hand.name}`, x + 150, 176, 14, '#f0e8d8', { align: 'center', stroke: '#2a2436', strokeW: 3 }); });
  P.save(z, path.join(OUT, 'close.png'));
  console.log('wrote', OUT);
})();
