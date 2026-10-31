// diorama_mock.js: the third world form, (c): a Dokapon-like board seen from a raised camera, drawn in 2D as a tilted
// ground with cliff faces and upright pieces sorted by depth (Perry, AD, 2026-10-31). Our own pieces, painted in code.
//   node tools/diorama_mock.js  ->  docs/pictures/world-form/C-diorama.png, A-B-C.png
const path = require('path');
const fs = require('fs');
const M = require('./world_form_mock.js');
const { W, H, S, INK, rng, phone, rr, lin, rad, label, ink, cloud, tree, house, hero, slime, badge, hud, roll, fightUi, board } = M;
const OUT = path.join(__dirname, '..', 'docs', 'pictures', 'world-form');
const COL = { battle: '#e8503e', shop: '#ffcc33', town: '#e08a3b', treasure: '#c98a3a', event: '#9b5de5', boss: '#3a3a3a' };

function horizon(g, seaTop, landTop) {
  g.fillStyle = lin(g, 0, 0, 0, seaTop, [[0, '#3f8fe0'], [1, '#c4e6fb']]); g.fillRect(0, 0, W, seaTop);
  cloud(g, 80, 60, 0.9, 0.9); cloud(g, 330, 44, 0.7, 0.8);
  g.fillStyle = lin(g, 0, seaTop, 0, landTop, [[0, '#1f5fa8'], [0.5, '#2f86d0'], [1, '#86cdf0']]); g.fillRect(0, seaTop, W, landTop - seaTop);
  g.save(); g.globalAlpha = 0.75; [[50, seaTop + 30, 46], [330, seaTop + 24, 60]].forEach(([x, y, w]) => { g.fillStyle = lin(g, 0, y - 12, 0, y + 10, [[0, '#c9ecb0'], [1, '#86bf80']]); g.beginPath(); g.ellipse(x, y, w, 9, 0, 0, 7); g.fill(); g.fillStyle = '#5fa860'; [[-20, 0], [0, -2], [22, 1]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + dx, y + dy - 8, 6, 0, 7); g.fill(); }); }); g.restore();
  const r = rng(4); g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 70; i++) g.fillRect(r() * W, seaTop + 8 + r() * (landTop - seaTop - 16), 2 + r() * 3, 1.2);
}
function land(g, top) {
  const shore = (dy, a, b) => { g.beginPath(); g.moveTo(-10, top + dy); for (let x = -10; x <= W + 10; x += 40) g.quadraticCurveTo(x + 20, top + ((x / 40) % 2 ? a : b), x + 40, top + dy); g.lineTo(W + 10, H + 10); g.lineTo(-10, H + 10); g.closePath(); };
  shore(14, 26, 4); g.fillStyle = '#efdfae'; g.fill(); ink(g, 2.5);
  shore(30, 42, 20); g.fillStyle = lin(g, 0, top, 0, H, [[0, '#93db7b'], [1, '#5fb04a']]); g.fill();
  const r = rng(8); for (let i = 0; i < 240; i++) { const x = r() * W, y = top + 40 + r() * (H - top - 40), rr2 = 6 + r() * 16; g.fillStyle = rad(g, x, y, x, y, rr2, [[0, 'rgba(180,235,125,0.5)'], [1, 'rgba(180,235,125,0)']]); g.beginPath(); g.arc(x, y, rr2, 0, 7); g.fill(); }
}
function plateau(g, pts, h) { // the land stepping up: a cliff face below the top surface, as a 2D extrusion
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y + h) : g.moveTo(x, y + h)); g.closePath(); g.fillStyle = '#6a492c'; g.fill(); ink(g, 2.5);
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x2, y2 + h); g.lineTo(x1, y1 + h); g.closePath(); g.fillStyle = lin(g, 0, Math.min(y1, y2), 0, Math.max(y1, y2) + h, [[0, '#b98f5c'], [1, '#6a492c']]); g.fill(); }
  const r = rng(pts[0][0] * 3 + pts[0][1]); g.strokeStyle = 'rgba(60,35,15,0.4)'; g.lineWidth = 1.5;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; if (y2 < y1 - 1 && y1 < y2 + 1) {} for (let k = 0; k < 7; k++) { const t = r(); const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t; g.beginPath(); g.moveTo(px, py + 5); g.lineTo(px + (r() - 0.5) * 5, py + h - 4); g.stroke(); } }
  const ys = pts.map(p => p[1]); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = lin(g, 0, Math.min(...ys), 0, Math.max(...ys), [[0, '#b2ea92'], [1, '#7fcb66']]); g.fill(); ink(g, 2.5);
  g.save(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip(); g.strokeStyle = 'rgba(220,255,170,0.9)'; g.lineWidth = 5; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y + 2) : g.moveTo(x, y + 2)); g.closePath(); g.stroke(); g.restore();
}
function river(g, pts, w) {
  const trace = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], [nx, ny] = pts[i + 1]; g.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2); } const [lx, ly] = pts[pts.length - 1]; g.lineTo(lx, ly); };
  g.lineCap = 'round'; g.lineJoin = 'round'; trace(); g.lineWidth = w + 8; g.strokeStyle = '#e9dca8'; g.stroke(); trace(); g.lineWidth = w; g.strokeStyle = '#3f8fd8'; g.stroke(); trace(); g.lineWidth = w * 0.4; g.strokeStyle = '#95d6f4'; g.stroke();
}
function road(g, pts) { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineWidth = 17; g.strokeStyle = INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#dcbb74'; g.stroke(); }
function goldSpace(g, x, y, t, open, s = 1) { // a Dokapon-like space: a gold ring set flat on the tilted ground
  g.beginPath(); g.ellipse(x, y + 2 * s, 25 * s, 12 * s, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fill();
  g.beginPath(); g.ellipse(x, y, 24 * s, 11 * s, 0, 0, 7); g.fillStyle = rad(g, x - 6 * s, y - 4 * s, x, y, 24 * s, [[0, '#fff3b0'], [0.55, '#f2c23a'], [1, '#b8860b']]); g.fill(); ink(g, 2.5);
  g.beginPath(); g.ellipse(x, y, 15 * s, 6.5 * s, 0, 0, 7); g.fillStyle = t === 'plain' ? '#f8ecc6' : COL[t]; g.fill(); ink(g, 1.5);
  if (open) { g.beginPath(); g.ellipse(x, y, 30 * s, 14 * s, 0, 0, 7); g.lineWidth = 3.5; g.strokeStyle = '#fff9b8'; g.stroke(); }
}
function castle(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 4, 74, 14, 0, 0, 7); g.fill();
  const wall = (x, y, w, h, c1, c2) => { g.beginPath(); g.rect(x, y, w, h); g.fillStyle = lin(g, x, 0, x + w, 0, [[0, c1], [1, c2]]); g.fill(); ink(g, 2.5); };
  const roof = (x, y, w, up) => { g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + w / 2, y - up); g.lineTo(x + w + 6, y); g.closePath(); g.fillStyle = lin(g, x, 0, x + w, 0, [[0, '#ee6a52'], [1, '#a8322a']]); g.fill(); ink(g, 2.5); };
  wall(-60, -60, 120, 60, '#efe5cf', '#c9b995'); for (let i = -58; i < 58; i += 20) wall(i, -70, 12, 10, '#f3eadb', '#cbbd9a');
  wall(-66, -112, 28, 112, '#f3eadb', '#c4b48f'); roof(-66, -112, 28, 32); wall(38, -112, 28, 112, '#f3eadb', '#c4b48f'); roof(38, -112, 28, 32);
  wall(-22, -126, 44, 66, '#f6eee0', '#c8b893'); roof(-22, -126, 44, 40);
  g.beginPath(); g.moveTo(0, -166); g.lineTo(0, -188); ink(g, 2); g.beginPath(); g.moveTo(0, -188); g.lineTo(20, -181); g.lineTo(0, -174); g.closePath(); g.fillStyle = '#ffcc33'; g.fill(); ink(g, 1.5);
  g.beginPath(); rr(g, -14, -34, 28, 34, 12); g.fillStyle = '#5a3a22'; g.fill(); ink(g, 2.5);
  [[-52, -40], [52, -40], [0, -100]].forEach(([wx, wy]) => { g.beginPath(); rr(g, wx - 5, wy - 8, 10, 14, 4); g.fillStyle = '#5a7fb0'; g.fill(); ink(g, 1.5); });
  g.restore();
}
function tag(g, x, y, text) { g.beginPath(); rr(g, x - 26, y - 10, 52, 18, 8); g.fillStyle = 'rgba(255,255,255,0.92)'; g.fill(); ink(g, 1.5); label(g, text, x, y - 1, 11, INK, { align: 'center' }); }
function scaled(g, x, y, s, fn) { g.save(); g.translate(x, y); g.scale(s, s); fn(); g.restore(); }

// (c) the board: a raised camera over a tilted land; everything standing on it upright and sorted by depth
function boardC(g) {
  const seaTop = 100, landTop = 232;
  horizon(g, seaTop, landTop); land(g, landTop);
  plateau(g, [[226, 306], [392, 296], [404, 428], [322, 482], [226, 436]], 34);
  plateau(g, [[-20, 556], [142, 542], [182, 630], [112, 712], [-20, 700]], 30);
  river(g, [[400, 236], [416, 330], [440, 420], [408, 500], [418, 600], [392, 700], [424, 800], [402, 940]], 20);
  const sp = [[50, 870, 'plain'], [120, 810, 'shop'], [190, 750, 'plain'], [250, 680, 'battle'], [200, 610, 'plain'], [280, 560, 'event'], [370, 560, 'plain'], [330, 452, 'town'], [372, 392, 'treasure'], [290, 352, 'boss']];
  road(g, sp.map(([x, y]) => [x, y]));
  sp.forEach(([x, y, t], i) => goldSpace(g, x, y, t, i >= 3 && i <= 5));
  const items = [];
  const put = (y, fn) => items.push({ y, fn });
  // badges above special spaces stand upright, so they sort with the pieces
  sp.forEach(([x, y, t]) => { if (t !== 'plain') put(y - 1, () => badge(g, t, x, y - 26, 1)); });
  [[40, 330, 0.75], [120, 300, 0.7], [180, 296, 0.6], [60, 440, 0.8], [150, 470, 0.7], [320, 640, 0.85], [100, 940, 0.9], [392, 920, 0.9], [60, 620, 0.6], [30, 690, 0.65], [120, 690, 0.62], [240, 450, 0.55], [372, 500, 0.6]].forEach(([x, y, s]) => put(y, () => tree(g, x, y, s)));
  put(615, () => scaled(g, 70, 615, 0.55, () => house(g, 0, 0)));
  put(452, () => scaled(g, 290, 452, 0.5, () => house(g, 0, 0))); put(458, () => scaled(g, 368, 458, 0.5, () => house(g, 0, 0)));
  put(340, () => castle(g, 290, 340, 0.55));
  put(750, () => hero(g, 190, 748, 0.72)); put(680, () => slime(g, 250, 678, 0.7));
  put(560, () => { hero(g, 280, 558, 0.6); tag(g, 280, 488, 'Sam'); });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  hud(g, 'Sunny Meadow'); roll(g);
}
// the fight, in place: the camera comes down to the space; the board's own scenery is the background
function fightC(g) {
  horizon(g, 170, 330); land(g, 330);
  plateau(g, [[-20, 332], [440, 322], [440, 430], [-20, 442]], 44);
  road(g, [[-20, 700], [420, 630]]);
  goldSpace(g, 120, 668, 'plain', false, 1.7); goldSpace(g, 300, 648, 'battle', true, 1.7);
  const items = [];
  const put = (y, fn) => items.push({ y, fn });
  [[36, 600, 1.5], [396, 588, 1.4], [230, 500, 1.1]].forEach(([x, y, s]) => put(y, () => tree(g, x, y, s)));
  put(560, () => scaled(g, 330, 560, 0.9, () => house(g, 0, 0)));
  put(666, () => hero(g, 120, 662, 1.35)); put(646, () => slime(g, 300, 642, 1.3));
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  label(g, '-12', 300, 520, 36, '#ffd23f', { align: 'center', stroke: INK, strokeW: 6 });
  fightUi(g);
}

const cBoard = phone(boardC), cFight = phone(fightC);
board('(c) A board seen from a raised camera, in 2D', ['The ground is drawn from above at a tilt, with cliff faces where the land steps up; roads, rivers and the gold spaces lie flat on it.', 'Everything that stands on it (trees, houses, the castle, you, the other players, the monsters) is drawn upright and sorted by depth.', 'A fight brings the camera down to your space; the board\'s own scenery is the background.'], [['The board: your token on its space', cBoard], ['A fight: the camera comes down', cFight]], 'C-diorama.png');
if (M.worldA && M.mapB) board('(a) side-view place, (b) top-down map, (c) raised-camera board', ['The same board, the same pieces, three cameras.'], [['(a) side view', phone(M.worldA)], ['(b) top down', phone(M.mapB)], ['(c) raised camera', cBoard]], 'A-B-C.png');
