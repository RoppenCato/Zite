// world_form_mock.js: the two forms the world could take, as phone screens drawn in code (Perry, AD, 2026-10-31).
// (a) the world is a side-view place with the board's spaces along its ground; (b) a top-down map with separate fight scenes.
// Painted in code, no assets, nothing from the reference library. node tools/world_form_mock.js -> docs/pictures/world-form/
const { createCanvas } = require('C:/dev/SG/Game Developer/node_modules/@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'pictures', 'world-form');
fs.mkdirSync(OUT, { recursive: true });
const W = 412, H = 915, S = 1.5, INK = '#2b2320';

function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function phone(draw) { const cv = createCanvas(W * S, H * S); const g = cv.getContext('2d'); g.scale(S, S); draw(g); return cv; }
function rr(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function rad(g, x, y, x2, y2, r, stops) { const gr = g.createRadialGradient(x, y, 0, x2, y2, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function label(g, text, x, y, size, color, o = {}) { g.save(); g.font = `${o.weight || 'bold'} ${size}px ${o.font || 'Arial'}`; g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; if (o.stroke) { g.lineWidth = o.strokeW || 4; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(text, x, y); } g.fillStyle = color; g.fillText(text, x, y); g.restore(); }
function ink(g, w = 2.5) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }

// ---------- painted pieces ----------
function sky(g) { g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#4f9fe8'], [0.55, '#b9e0fa'], [1, '#ecf7ff']]); g.fillRect(0, 0, W, H); }
function cloud(g, x, y, s, a) {
  g.save(); g.globalAlpha = a; [[0, 0, 26], [-24, 8, 18], [24, 8, 20], [-8, -10, 18], [12, -12, 16]].forEach(([dx, dy, r]) => {
    const cx = x + dx * s, cy = y + dy * s, cr = r * s; g.fillStyle = rad(g, cx, cy - cr * 0.5, cx, cy, cr, [[0, '#ffffff'], [0.75, '#f3f7fb'], [1, '#cfdfec']]); g.beginPath(); g.arc(cx, cy, cr, 0, 7); g.fill();
  }); g.restore();
}
function plane(g, y, c1, c2, seed, alpha) { // a hazy far plane with a wavy top and no outline
  const r = rng(seed); g.save(); g.globalAlpha = alpha; g.beginPath(); g.moveTo(-10, H); g.lineTo(-10, y);
  let x = -10; while (x < W + 20) { const nx = x + 50 + r() * 50; g.quadraticCurveTo(x + (nx - x) / 2, y - 18 - r() * 40, nx, y + r() * 8); x = nx; }
  g.lineTo(W + 20, H); g.closePath(); g.fillStyle = lin(g, 0, y - 50, 0, y + 160, [[0, c1], [1, c2]]); g.fill(); g.restore();
}
function tree(g, x, y, s) {
  const trunk = () => { g.beginPath(); g.moveTo(x - 6 * s, y); g.lineTo(x - 4 * s, y - 24 * s); g.lineTo(x + 4 * s, y - 24 * s); g.lineTo(x + 6 * s, y); g.closePath(); };
  trunk(); ink(g, 3); trunk(); g.fillStyle = lin(g, x - 6 * s, 0, x + 6 * s, 0, [[0, '#5a3a22'], [0.5, '#8f5f38'], [1, '#4a2e1c']]); g.fill();
  const blobs = [[0, -40, 21], [-15, -31, 15], [15, -31, 15], [0, -53, 13]];
  blobs.forEach(([dx, dy, r]) => { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); ink(g, 3); });
  blobs.forEach(([dx, dy, r]) => { const cx = x + dx * s, cy = y + dy * s, cr = r * s; g.fillStyle = rad(g, cx - cr * 0.3, cy - cr * 0.45, cx, cy, cr, [[0, '#b4ee82'], [0.45, '#62b847'], [1, '#2c6f2a']]); g.beginPath(); g.arc(cx, cy, cr, 0, 7); g.fill(); });
}
function ground(g, x, y, w, h) { // the grid line is y: an earth body below, a grass top edge above
  g.fillStyle = lin(g, 0, y, 0, y + h, [[0, '#8f6b43'], [1, '#55391f']]); g.fillRect(x, y, w, h);
  const r = rng(x * 7 + y); for (let i = 0; i < w * h / 500; i++) { const px = x + r() * w, py = y + 12 + r() * (h - 12), pr = 3 + r() * 6; g.fillStyle = rad(g, px - pr * 0.3, py - pr * 0.3, px, py, pr, [[0, '#ad8a5c'], [1, '#6a4a2b']]); g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill(); }
  g.beginPath(); g.moveTo(x, y + 6); for (let px = x; px < x + w; px += 12) { g.lineTo(px + 6, y + ((px / 12) % 2 ? 11 : 4)); g.lineTo(px + 12, y + 7); } g.lineTo(x + w, y - 14); g.lineTo(x, y - 14); g.closePath();
  g.fillStyle = lin(g, 0, y - 14, 0, y + 11, [[0, '#c6f48a'], [0.45, '#73c74c'], [1, '#3b8a2e']]); g.fill();
  for (let px = x + 3; px < x + w - 6; px += 9) { g.beginPath(); g.moveTo(px, y - 12); g.lineTo(px + 3, y - 20 - (px % 3) * 2); g.lineTo(px + 6, y - 12); g.closePath(); g.fillStyle = '#9ae264'; g.fill(); }
  g.beginPath(); g.moveTo(x, y - 13); g.lineTo(x + w, y - 13); ink(g, 2.5); g.beginPath(); g.moveTo(x, y - 13); g.lineTo(x, y + h); g.moveTo(x + w, y - 13); g.lineTo(x + w, y + h); ink(g, 2.5);
}
function ladder(g, x, y0, y1) { g.beginPath(); g.moveTo(x - 9, y0); g.lineTo(x - 9, y1); g.moveTo(x + 9, y0); g.lineTo(x + 9, y1); ink(g, 4); g.strokeStyle = '#b07a3e'; g.lineWidth = 2; g.stroke(); for (let y = y0 + 12; y < y1; y += 16) { g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x + 9, y); ink(g, 4); g.strokeStyle = '#d9a65a'; g.lineWidth = 2; g.stroke(); } }
function house(g, x, y) { // a mushroom house: stem with a door, a spotted cap
  g.beginPath(); rr(g, x - 26, y - 48, 52, 48, 10); ink(g, 3); g.fillStyle = lin(g, x - 26, 0, x + 26, 0, [[0, '#e9dcc0'], [0.5, '#fff6e4'], [1, '#d6c6a4']]); g.fill();
  g.beginPath(); rr(g, x - 9, y - 26, 18, 26, 8); ink(g, 2.5); g.fillStyle = '#7a4a2a'; g.fill();
  g.beginPath(); g.ellipse(x, y - 52, 44, 26, 0, Math.PI, 0); g.closePath(); ink(g, 3); g.fillStyle = rad(g, x - 14, y - 72, x, y - 58, 48, [[0, '#ff9a86'], [0.5, '#e8503e'], [1, '#9c2a22']]); g.fill();
  [[-22, -60, 6], [2, -70, 7], [24, -58, 5]].forEach(([dx, dy, r]) => { g.fillStyle = '#fff2e8'; g.beginPath(); g.arc(x + dx, y + dy, r, 0, 7); g.fill(); });
}
function hero(g, x, y, s) { // feet at (x, y); about 104 tall at s = 1; the head half the height
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 2, 22, 6, 0, 0, 7); g.fill();
  g.beginPath(); rr(g, -12, -18, 10, 18, 3); rr(g, 2, -18, 10, 18, 3); g.fillStyle = '#3a2d2a'; g.fill(); ink(g, 2.5);
  g.beginPath(); rr(g, -13, -50, 26, 34, 8); g.fillStyle = lin(g, -13, 0, 13, 0, [[0, '#2f5fb8'], [0.5, '#5590e6'], [1, '#2a4f9a']]); g.fill(); ink(g, 2.5);
  g.fillStyle = '#8a5a35'; g.fillRect(-13, -24, 26, 5);
  g.beginPath(); rr(g, 16, -66, 6, 42, 2); g.fillStyle = lin(g, 16, 0, 22, 0, [[0, '#f4f7fa'], [1, '#aeb9c6']]); g.fill(); ink(g, 2);
  g.beginPath(); g.arc(0, -76, 25, 0, 7); g.fillStyle = rad(g, -8, -86, 0, -76, 25, [[0, '#ffe8cc'], [1, '#e8b68c']]); g.fill(); ink(g, 2.5);
  g.beginPath(); g.moveTo(-26, -80); g.quadraticCurveTo(-20, -112, 0, -106); g.quadraticCurveTo(22, -112, 26, -80); g.lineTo(20, -88); g.lineTo(12, -82); g.lineTo(4, -90); g.lineTo(-4, -82); g.lineTo(-12, -90); g.lineTo(-20, -84); g.closePath();
  g.fillStyle = rad(g, -6, -102, 0, -94, 30, [[0, '#ff9a66'], [1, '#c23f2a']]); g.fill(); ink(g, 2.5);
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-9, -72, 5, 7, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(9, -72, 5, 7, 0, 0, 7); g.fill();
  g.fillStyle = INK; g.beginPath(); g.ellipse(-8, -71, 3, 5, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(10, -71, 3, 5, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(0, -62, 5, 0.2, Math.PI - 0.2); ink(g, 2);
  g.restore();
}
function slime(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 2, 26, 7, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(-30, -36, -4, -44); g.quadraticCurveTo(6, -50, 10, -42); g.quadraticCurveTo(30, -34, 26, 0); g.closePath();
  g.fillStyle = rad(g, -8, -30, 0, -20, 34, [[0, '#d2ff86'], [0.5, '#6fd845'], [1, '#2a7f2a']]); g.fill(); ink(g, 2.5);
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(-10, -31, 6, 4, -0.6, 0, 7); g.fill();
  g.beginPath(); g.moveTo(8, -42); g.quadraticCurveTo(18, -62, 29, -55); ink(g, 2); g.beginPath(); g.arc(30, -56, 3.5, 0, 7); g.fillStyle = '#8fe66a'; g.fill(); ink(g, 2);
  g.fillStyle = INK; g.beginPath(); g.arc(-9, -16, 2.6, 0, 7); g.fill(); g.beginPath(); g.arc(7, -16, 2.6, 0, 7); g.fill(); g.beginPath(); g.arc(-1, -10, 4, 0.2, Math.PI - 0.2); ink(g, 2);
  g.restore();
}
const BADGE = { battle: ['#e8503e', 'x'], shop: ['#ffcc33', '$'], town: ['#e08a3b', 'T'], treasure: ['#c98a3a', 'C'], event: ['#9b5de5', '?'], boss: ['#3a3a3a', 'B'] };
function badge(g, t, x, y, s = 1) { const [col, ch] = BADGE[t]; g.beginPath(); g.arc(x, y, 9 * s, 0, 7); g.fillStyle = rad(g, x - 3 * s, y - 3 * s, x, y, 9 * s, [[0, '#ffffff'], [0.35, col], [1, col]]); g.fill(); ink(g, 2); label(g, ch, x, y + 0.5, 11 * s, '#fff', { align: 'center', stroke: INK, strokeW: 3 }); }
function plate(g, x, y, t, open, s = 1) { // a round stone plate set into the ground: a space of the board
  g.beginPath(); g.ellipse(x, y + 2 * s, 18 * s, 8 * s, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fill();
  g.beginPath(); g.ellipse(x, y, 17 * s, 7 * s, 0, 0, 7); g.fillStyle = lin(g, 0, y - 7 * s, 0, y + 7 * s, [[0, '#f6ead0'], [1, '#c4ad83']]); g.fill(); ink(g, 2);
  if (open) { g.beginPath(); g.ellipse(x, y, 21 * s, 9.5 * s, 0, 0, 7); g.lineWidth = 3; g.strokeStyle = '#ffd23f'; g.stroke(); }
  if (t !== 'plain') badge(g, t, x, y - 15 * s, s);
}
function hud(g, title) {
  g.beginPath(); rr(g, 12, 44, 388, 54, 12); g.fillStyle = lin(g, 0, 44, 0, 98, [[0, '#fff8e6'], [1, '#e9d9b6']]); g.fill(); ink(g, 2.5);
  hero(g, 42, 94, 0.42); label(g, 'Robin  Lv 4', 70, 62, 15, INK); label(g, 'HP', 70, 84, 12, INK); g.beginPath(); rr(g, 94, 78, 130, 12, 6); g.fillStyle = '#fff'; g.fill(); ink(g, 2); g.fillStyle = '#5cd65c'; g.fillRect(96, 80, 100, 8);
  label(g, '120', 332, 72, 16, INK, { align: 'right' }); g.beginPath(); g.arc(350, 72, 9, 0, 7); g.fillStyle = '#ffcc33'; g.fill(); ink(g, 2);
  g.beginPath(); rr(g, 96, 108, 220, 30, 15); g.fillStyle = 'rgba(255,248,230,0.92)'; g.fill(); ink(g, 2); label(g, title, 206, 123, 15, INK, { align: 'center' });
}
function roll(g) { g.beginPath(); g.arc(206, 850, 44, 0, 7); g.fillStyle = rad(g, 192, 834, 206, 850, 44, [[0, '#ffe680'], [0.6, '#ffcc33'], [1, '#d99a12']]); g.fill(); ink(g, 3.5); label(g, 'ROLL', 206, 852, 22, INK, { align: 'center' }); g.beginPath(); rr(g, 318, 822, 56, 56, 12); g.fillStyle = '#fff'; g.fill(); ink(g, 3); [[332, 836], [360, 864], [346, 850]].forEach(([x, y]) => { g.fillStyle = INK; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }); }
function fightUi(g) {
  const panel = (x, name, hp, max, col) => { g.beginPath(); rr(g, x, 48, 180, 56, 12); g.fillStyle = lin(g, 0, 48, 0, 104, [[0, '#fff8e6'], [1, '#e9d9b6']]); g.fill(); ink(g, 2.5); label(g, name, x + 12, 66, 14, INK); g.beginPath(); rr(g, x + 12, 80, 156, 12, 6); g.fillStyle = '#fff'; g.fill(); ink(g, 2); g.fillStyle = col; g.fillRect(x + 14, 82, 152 * hp / max, 8); label(g, `${hp}/${max}`, x + 168, 66, 12, INK, { align: 'right' }); };
  panel(14, 'Robin  Lv 4', 32, 40, '#5cd65c'); panel(218, 'Meadow Slime', 18, 30, '#e8503e');
  g.beginPath(); rr(g, 8, 690, 396, 200, 20); g.fillStyle = lin(g, 0, 690, 0, 890, [[0, '#fff8e6'], [1, '#e9d9b6']]); g.fill(); ink(g, 3);
  [[20, 702, 'ATTACK', '#e8503e'], [210, 702, 'SKILL', '#3f8ae0'], [20, 790, 'ITEM', '#5cb85c'], [210, 790, 'DEFEND', '#8d99ae']].forEach(([x, y, t, col]) => { g.beginPath(); rr(g, x, y, 182, 72, 16); g.fillStyle = lin(g, 0, y, 0, y + 72, [[0, col], [1, col]]); g.fill(); ink(g, 3.5); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); rr(g, x + 6, y + 6, 170, 26, 10); g.fill(); label(g, t, x + 91, y + 37, 22, '#fff', { align: 'center', stroke: INK, strokeW: 5 }); });
}

// ---------- the place: planes, ground, props (used by the side-view world and by both fights) ----------
function placeBack(g, groundY) {
  sky(g); cloud(g, 70, 150, 1.1, 0.9); cloud(g, 310, 110, 0.9, 0.85); cloud(g, 390, 220, 0.7, 0.7);
  plane(g, groundY - 300, '#a9d7ea', '#d4ebf5', 3, 0.9);
  plane(g, groundY - 220, '#86c988', '#b7e0ad', 5, 0.95);
  plane(g, groundY - 150, '#3f8f55', '#6fb876', 9, 0.85);
}

// (a) the world as a side-view place: the board's spaces are plates along its ground
function worldA(g) {
  const gy = 640; placeBack(g, gy);
  ground(g, 228, 436, 190, 60); ground(g, -5, gy, W + 10, H - gy);
  tree(g, 56, gy, 1.3); tree(g, 372, gy, 1.1); tree(g, 395, 436, 0.85); house(g, 318, gy);
  ladder(g, 212, 436, gy);
  const walk = gy - 7;
  [[40, 'plain'], [110, 'shop'], [180, 'plain'], [250, 'battle'], [320, 'plain'], [390, 'treasure']].forEach(([x, t], i) => plate(g, x, walk, t, i >= 2 && i <= 4));
  [[262, 'plain'], [332, 'event'], [398, 'boss']].forEach(([x, t]) => plate(g, x, 436 - 7, t, false));
  hero(g, 110, walk - 2, 1); slime(g, 250, walk - 2, 0.9);
  hud(g, 'Sunny Meadow'); roll(g);
}
// a fight: the same place, closer; the same function serves (b), where the scene is built apart from the map
function fight(g, caption) {
  const gy = 650; placeBack(g, gy); ground(g, -5, gy, W + 10, H - gy);
  tree(g, 40, gy, 2.1); house(g, 362, gy); tree(g, 395, gy, 1.9);
  hero(g, 118, gy - 9, 1.55); slime(g, 300, gy - 9, 1.45);
  label(g, '-12', 300, 500, 36, '#ffd23f', { align: 'center', stroke: INK, strokeW: 6 });
  fightUi(g);
}
// (a) the overview map: where you are in the world, like a world-map screen
function overviewA(g) {
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#2c4a7a'], [1, '#17304f']]); g.fillRect(0, 0, W, H);
  g.beginPath(); rr(g, 16, 120, 380, 700, 14); g.fillStyle = '#f1e7cc'; g.fill(); ink(g, 3);
  const blob = (x, y, r, c1, c2) => { g.fillStyle = rad(g, x - r * 0.3, y - r * 0.3, x, y, r, [[0, c1], [1, c2]]); g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, 7); g.fill(); };
  blob(150, 640, 90, '#b5e58a', '#6fb85a'); blob(290, 500, 85, '#4f9e5c', '#2c6a3a'); blob(130, 380, 80, '#f0d79a', '#d6b26c'); blob(290, 250, 90, '#f7fbff', '#bcd3e6'); blob(220, 740, 60, '#9fd7f0', '#4f9fd0');
  const nodes = [[150, 700], [120, 630], [170, 580], [250, 540], [300, 480], [330, 420], [250, 390], [150, 360], [120, 290], [200, 250], [290, 220], [340, 160]];
  g.setLineDash([5, 5]); g.beginPath(); nodes.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); ink(g, 2); g.setLineDash([]);
  nodes.forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fillStyle = i < 3 ? '#ffcc33' : '#fff6dc'; g.fill(); ink(g, 2); });
  const [hx, hy] = nodes[2]; g.beginPath(); g.arc(hx, hy, 14, 0, 7); g.lineWidth = 3; g.strokeStyle = '#e8503e'; g.stroke(); hero(g, hx, hy - 6, 0.45);
  [['Sunny Meadow', 150, 690], ['Blackroot Wood', 300, 560], ['Dry Hollows', 110, 440], ['The Chilly Pass', 300, 300]].forEach(([t, x, y]) => label(g, t, x, y, 13, INK, { align: 'center', font: 'Georgia', weight: 'italic' }));
  label(g, 'World map', 206, 80, 24, '#fff6dc', { align: 'center' }); label(g, 'You are here', hx, hy + 32, 12, '#e8503e', { align: 'center' });
}
// (b) a top-down painted world map: the spaces are seen from above; a fight opens a separate scene
function mapB(g) {
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#7fc96f'], [0.5, '#8fd27a'], [1, '#6fb860']]); g.fillRect(0, 0, W, H);
  const r = rng(13); for (let i = 0; i < 140; i++) { const x = r() * W, y = 150 + r() * 760, rr2 = 10 + r() * 24; g.fillStyle = rad(g, x, y, x, y, rr2, [[0, 'rgba(120,190,100,0.55)'], [1, 'rgba(120,190,100,0)']]); g.beginPath(); g.arc(x, y, rr2, 0, 7); g.fill(); }
  g.beginPath(); g.moveTo(330, 150); g.bezierCurveTo(260, 300, 420, 420, 330, 560); g.bezierCurveTo(260, 660, 360, 760, 300, 915); g.lineWidth = 22; g.strokeStyle = '#4f9fd0'; g.lineCap = 'round'; g.stroke(); g.lineWidth = 14; g.strokeStyle = '#8fd1f0'; g.stroke();
  const topTree = (x, y, s) => { g.beginPath(); g.arc(x, y, 14 * s, 0, 7); ink(g, 2.5); g.fillStyle = rad(g, x - 4 * s, y - 5 * s, x, y, 14 * s, [[0, '#a6e37c'], [0.5, '#5aa843'], [1, '#2e6e2b']]); g.fill(); };
  const r2 = rng(21); for (let i = 0; i < 40; i++) topTree(60 + r2() * 160, 150 + r2() * 220, 0.7 + r2() * 0.6);
  const mountain = (x, y, s) => { g.beginPath(); g.moveTo(x - 40 * s, y); g.lineTo(x, y - 60 * s); g.lineTo(x + 40 * s, y); g.closePath(); ink(g, 3); g.fillStyle = lin(g, x - 40 * s, 0, x + 40 * s, 0, [[0, '#9c8b78'], [0.5, '#c9b9a3'], [1, '#6f6050']]); g.fill(); g.beginPath(); g.moveTo(x - 12 * s, y - 42 * s); g.lineTo(x, y - 60 * s); g.lineTo(x + 12 * s, y - 42 * s); g.closePath(); g.fillStyle = '#fff'; g.fill(); };
  mountain(110, 560, 1.1); mountain(170, 580, 0.8);
  const road = [[60, 880], [130, 820], [120, 740], [200, 700], [250, 640], [200, 560], [250, 480], [330, 420], [300, 340], [210, 300], [250, 220], [340, 180]];
  g.beginPath(); road.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineWidth = 16; g.strokeStyle = INK; g.stroke(); g.lineWidth = 11; g.strokeStyle = '#d9b36b'; g.stroke();
  const types = ['plain', 'shop', 'plain', 'battle', 'plain', 'event', 'battle', 'plain', 'town', 'plain', 'treasure', 'boss'];
  road.forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, types[i] === 'plain' ? 12 : 15, 0, 7); g.fillStyle = lin(g, 0, y - 12, 0, y + 12, [[0, '#fff8e6'], [1, '#d9c69a']]); g.fill(); ink(g, 2.5); if (types[i] !== 'plain') badge(g, types[i], x, y, 0.95); if (i >= 3 && i <= 5) { g.beginPath(); g.arc(x, y, 20, 0, 7); g.lineWidth = 3.5; g.strokeStyle = '#ffd23f'; g.stroke(); } });
  const townAt = (x, y) => { [[-18, 0], [0, -14], [16, 2]].forEach(([dx, dy]) => { g.beginPath(); rr(g, x + dx - 8, y + dy - 6, 16, 12, 2); g.fillStyle = '#f3e3c3'; g.fill(); ink(g, 2); g.beginPath(); g.moveTo(x + dx - 10, y + dy - 6); g.lineTo(x + dx, y + dy - 15); g.lineTo(x + dx + 10, y + dy - 6); g.closePath(); g.fillStyle = '#c84a3a'; g.fill(); ink(g, 2); }); };
  townAt(330, 300); townAt(60, 760);
  hero(g, road[2][0], road[2][1] - 4, 0.6);
  g.fillStyle = 'rgba(40,40,60,0.55)'; g.fillRect(0, 140, W, 110); label(g, 'unexplored', 206, 195, 14, 'rgba(255,255,255,0.7)', { align: 'center', weight: 'normal' });
  [['Sunny Meadow', 120, 640], ['Blackroot Wood', 150, 410], ['Dry Hollows', 330, 520]].forEach(([t, x, y]) => label(g, t, x, y, 14, '#fff', { align: 'center', font: 'Georgia', weight: 'italic', stroke: INK, strokeW: 4 }));
  hud(g, 'The World'); roll(g);
}

// ---------- the boards ----------
function board(title, lines, items, file) {
  const gutter = 36, top = 180, pw = W * S, ph = H * S; const cv = createCanvas(items.length * (pw + gutter) + gutter, ph + top + 70); const g = cv.getContext('2d');
  g.fillStyle = '#f2efe8'; g.fillRect(0, 0, cv.width, cv.height); label(g, title, gutter, 48, 40, '#222'); lines.forEach((l, i) => label(g, l, gutter, 92 + i * 26, 20, '#444', { weight: 'normal' }));
  items.forEach(([name, cvs], i) => { const x = gutter + i * (pw + gutter); g.drawImage(cvs, x, top); g.lineWidth = 3; g.strokeStyle = '#222'; g.strokeRect(x, top, pw, ph); label(g, name, x + pw / 2, top + ph + 30, 20, '#333', { align: 'center' }); });
  fs.writeFileSync(path.join(OUT, file), cv.toBuffer('image/png')); console.log('wrote', file); return cv;
}
const aWorld = phone(worldA), aFight = phone(g => fight(g)), aMap = phone(overviewA), bMap = phone(mapB), bFight = phone(g => fight(g));
board('(a) The world is a side-view place', ['The board\'s spaces are plates along the ground of a MapleStory-like place built from kits: ground tiles, parallax planes, props.', 'A roll moves your token along the ground (and up ladders); a fight happens right where you stand, the camera just comes closer.', 'An overview map shows where you are in the whole world.'], [['The world: your token on its space', aWorld], ['A fight: the same place, closer', aFight], ['The overview map', aMap]], 'A-side-view-world.png');
board('(b) A top-down world map', ['The board is a painted map seen from above: spaces and roads, towns, forests, rivers; your token stands on the map.', 'A fight opens a separate side-view scene built from the kits, one per area, then returns to the map.'], [['The world map, from above', bMap], ['A fight: a separate scene', bFight]], 'B-top-down-map.png');
board('(a) side-view place  or  (b) top-down map', ['Same game, same kits, same fight. What differs is what you look at while you roll and move, and how much art it takes.'], [['(a) the world', aWorld], ['(a) the overview map', aMap], ['(b) the world map', bMap], ['the fight, in both', aFight]], 'A-vs-B.png');
