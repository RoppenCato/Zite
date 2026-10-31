// direction_mock.js: mock phone screens for the three art directions proposed on 2026-10-31 (Perry, AD).
// Everything is drawn in code, no assets: the pictures show palette, line, shapes and layout, not finished art.
//   node tools/direction_mock.js   ->  docs/pictures/direction/*.png
const { createCanvas } = require('C:/dev/SG/Game Developer/node_modules/@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs', 'pictures', 'direction');
fs.mkdirSync(OUT, { recursive: true });
const W = 412, H = 915, S = 2; // an Android phone in CSS pixels, drawn at 2x

function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function phone(draw) { const cv = createCanvas(W * S, H * S); const g = cv.getContext('2d'); g.scale(S, S); draw(g); return cv; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function grain(g, w, h, alpha, seed) { const r = rng(seed); g.save(); g.globalAlpha = alpha; for (let i = 0; i < w * h / 6; i++) { g.fillStyle = r() < 0.5 ? '#000' : '#fff'; g.fillRect(r() * w, r() * h, 1, 1); } g.restore(); }
function label(g, text, x, y, size, color, o = {}) { g.save(); g.font = `${o.weight || 'bold'} ${size}px ${o.font || 'Arial'}`; g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; if (o.stroke) { g.lineWidth = o.strokeW || 4; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(text, x, y); } g.fillStyle = color; g.fillText(text, x, y); g.restore(); }

// The board shown on every map: 14 spaces on a winding path up the screen; the hero stands on the fourth, a roll of 3 is open.
const TYPES = ['plain', 'battle', 'plain', 'shop', 'plain', 'event', 'battle', 'plain', 'town', 'plain', 'treasure', 'battle', 'plain', 'boss'];
const SPACES = TYPES.map((t, i) => ({ t, x: 206 + Math.sin(i * 0.9 + 0.5) * 120, y: 770 - i * 45 }));
const HERO = 2, OPEN = [3, 4, 5];

// ---------- A. Sunny cel: MapleStory's cheer, thick ink, chibi figures, two-tone shading ----------
const A = { ink: '#3a2a28', sky1: '#9fdcff', sky2: '#e9f8ff', grass: '#86d35e', grass2: '#5db342', road: '#e0bd77', cream: '#fff4d8', red: '#e5513f', gold: '#ffcc33', blue: '#3f8ae0', purple: '#9b5de5', skin: '#ffd8b0', hair: '#d7483c', tunic: '#3f74d6' };
function outlined(g, fill, lw = 3) { g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = A.ink; g.lineJoin = 'round'; g.stroke(); }
function treeA(g, x, y, s) {
  g.beginPath(); rr(g, x - 5 * s, y - 14 * s, 10 * s, 18 * s, 3 * s); outlined(g, '#8a5a35');
  g.beginPath(); g.arc(x, y - 26 * s, 18 * s, 0, 7); outlined(g, '#45a63d');
  g.fillStyle = '#7fd466'; g.beginPath(); g.arc(x - 4 * s, y - 32 * s, 12 * s, 0, 7); g.fill();
}
function hillA(g, x, y, w, h, c1, c2) {
  g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); outlined(g, c1);
  g.save(); g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.clip(); g.fillStyle = c2; g.beginPath(); g.ellipse(x, y + h * 0.55, w, h, 0, 0, 7); g.fill(); g.restore();
}
function dot(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function iconA(g, t, x, y) {
  g.lineCap = 'round';
  if (t === 'battle') { g.strokeStyle = A.red; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - 6, y - 6); g.lineTo(x + 6, y + 6); g.moveTo(x + 6, y - 6); g.lineTo(x - 6, y + 6); g.stroke(); }
  if (t === 'shop') { g.beginPath(); g.arc(x, y, 7, 0, 7); outlined(g, A.gold, 2); label(g, '$', x, y + 0.5, 10, A.ink, { align: 'center' }); }
  if (t === 'event') label(g, '?', x, y + 1, 17, A.purple, { align: 'center' });
  if (t === 'town') { g.beginPath(); g.moveTo(x - 8, y + 1); g.lineTo(x, y - 8); g.lineTo(x + 8, y + 1); g.closePath(); outlined(g, A.red, 2); g.beginPath(); g.rect(x - 5, y + 1, 10, 7); outlined(g, A.cream, 2); }
  if (t === 'treasure') { g.beginPath(); rr(g, x - 8, y - 5, 16, 11, 2); outlined(g, '#c98a3a', 2); g.fillStyle = A.gold; g.fillRect(x - 2, y - 3, 4, 4); }
  if (t === 'boss') { g.beginPath(); g.arc(x, y, 8, 0, 7); outlined(g, '#2a2a2a', 2); dot(g, x - 3, y - 1, 1.8, A.red); dot(g, x + 3, y - 1, 1.8, A.red); }
}
function heroA(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(0, 2, 13, 5, 0, 0, 7); g.fill();
  g.beginPath(); rr(g, -8, -22, 16, 20, 5); outlined(g, A.tunic);
  g.beginPath(); rr(g, -7, -6, 6, 8, 2); outlined(g, '#4a3a3a'); g.beginPath(); rr(g, 1, -6, 6, 8, 2); outlined(g, '#4a3a3a');
  g.beginPath(); g.arc(0, -32, 13, 0, 7); outlined(g, A.skin);
  g.beginPath(); g.arc(0, -35, 13, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(9, -35); g.lineTo(-9, -35); g.closePath(); outlined(g, A.hair);
  g.fillStyle = A.ink; g.beginPath(); g.ellipse(-4, -30, 1.8, 2.6, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(4, -30, 1.8, 2.6, 0, 0, 7); g.fill();
  g.beginPath(); rr(g, 9, -30, 4, 22, 1.5); outlined(g, '#d8dde6', 2);
  g.restore();
}
function slimeA(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(0, 2, 22, 6, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-24, -28, 0, -30); g.quadraticCurveTo(24, -28, 22, 0); g.closePath(); outlined(g, '#6ad45f');
  g.fillStyle = '#a8ef9a'; g.beginPath(); g.ellipse(-7, -20, 6, 4, -0.5, 0, 7); g.fill();
  dot(g, -7, -12, 4, '#fff'); dot(g, 7, -12, 4, '#fff'); dot(g, -6, -12, 2, A.ink); dot(g, 8, -12, 2, A.ink);
  g.restore();
}
function mapA(g) {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, A.sky1); sky.addColorStop(1, A.sky2); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  hillA(g, 120, 250, 260, 70, '#a9e39a', '#8bd07c'); hillA(g, 380, 235, 220, 75, '#a9e39a', '#8bd07c');
  hillA(g, 206, 760, 420, 520, A.grass, A.grass2);
  g.save(); g.beginPath(); g.rect(0, 0, W, 420); g.clip(); hillA(g, 206, 560, 420, 300, '#5fae57', '#3f8f2e'); g.restore();
  const r = rng(7); for (let i = 0; i < 26; i++) { const x = r() * W, y = 190 + r() * 640; if (SPACES.some(s => Math.hypot(s.x - x, s.y - y) < 44)) continue; treeA(g, x, y, y < 420 ? 1.25 : 1); }
  g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); SPACES.forEach((s, i) => i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y));
  g.lineWidth = 22; g.strokeStyle = A.ink; g.stroke(); g.lineWidth = 16; g.strokeStyle = A.road; g.stroke();
  SPACES.forEach(s => { g.beginPath(); g.arc(s.x, s.y, s.t === 'plain' ? 15 : 19, 0, 7); outlined(g, s.t === 'plain' ? A.cream : '#fffbe8', 3); if (s.t !== 'plain') iconA(g, s.t, s.x, s.y); });
  OPEN.forEach(i => { const s = SPACES[i]; g.beginPath(); g.arc(s.x, s.y, 24, 0, 7); g.lineWidth = 4; g.strokeStyle = A.gold; g.stroke(); });
  heroA(g, SPACES[HERO].x, SPACES[HERO].y - 6, 1);
  g.beginPath(); rr(g, 86, 108, 240, 34, 17); outlined(g, A.cream); label(g, 'Sunny Meadow', 206, 125, 17, A.ink, { align: 'center' });
  g.beginPath(); rr(g, 12, 44, 388, 54, 14); outlined(g, A.cream);
  heroA(g, 44, 92, 0.85); label(g, 'Robin  Lv 4', 76, 62, 15, A.ink); label(g, 'HP', 76, 84, 12, A.ink); g.beginPath(); rr(g, 100, 78, 130, 12, 6); outlined(g, '#fff', 2); g.fillStyle = '#5cd65c'; rr(g, 102, 80, 100, 8, 4); g.fill();
  label(g, '120', 332, 72, 16, A.ink, { align: 'right' }); g.beginPath(); g.arc(350, 72, 9, 0, 7); outlined(g, A.gold, 2);
  g.beginPath(); g.arc(206, 850, 44, 0, 7); outlined(g, A.gold, 4); label(g, 'ROLL', 206, 852, 22, A.ink, { align: 'center' });
  g.beginPath(); rr(g, 318, 822, 56, 56, 12); outlined(g, '#fff', 3); [[332, 836], [360, 864], [346, 850]].forEach(([x, y]) => dot(g, x, y, 4, A.ink));
}
function fightA(g) {
  const sky = g.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, A.sky1); sky.addColorStop(1, '#eef9ff'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  hillA(g, 100, 440, 240, 90, '#b7e8a8', '#9ad88c'); hillA(g, 360, 450, 260, 110, '#b7e8a8', '#9ad88c');
  g.fillStyle = A.grass; g.fillRect(0, 470, W, H); g.lineWidth = 3; g.strokeStyle = A.ink; g.beginPath(); g.moveTo(0, 470); g.lineTo(W, 470); g.stroke(); g.fillStyle = A.grass2; g.fillRect(0, 600, W, H);
  [40, 130, 300, 390].forEach((x, i) => treeA(g, x, 470 - (i % 2) * 10, 2.2));
  heroA(g, 110, 620, 2.6); slimeA(g, 300, 620, 2.4);
  label(g, '-12', 300, 500, 34, A.gold, { align: 'center', stroke: A.ink, strokeW: 6 });
  const panel = (x, name, hp, max, col) => { g.beginPath(); rr(g, x, 48, 180, 56, 14); outlined(g, A.cream); label(g, name, x + 12, 66, 14, A.ink); g.beginPath(); rr(g, x + 12, 80, 156, 12, 6); outlined(g, '#fff', 2); g.fillStyle = col; rr(g, x + 14, 82, 152 * hp / max, 8, 4); g.fill(); label(g, `${hp}/${max}`, x + 168, 66, 12, A.ink, { align: 'right' }); };
  panel(14, 'Robin  Lv 4', 32, 40, '#5cd65c'); panel(218, 'Meadow Slime', 18, 30, A.red);
  g.beginPath(); rr(g, 8, 690, 396, 200, 22); outlined(g, A.cream);
  const btn = (x, y, t, col) => { g.beginPath(); rr(g, x, y, 182, 72, 18); outlined(g, col, 4); label(g, t, x + 91, y + 37, 22, '#fff', { align: 'center', stroke: A.ink, strokeW: 5 }); };
  btn(20, 702, 'ATTACK', A.red); btn(210, 702, 'SKILL', A.blue); btn(20, 790, 'ITEM', '#5cb85c'); btn(210, 790, 'DEFEND', '#8d99ae');
}

// ---------- B. Ink and paper: the world is a board game on a table, standees and cards ----------
const B = { ink: '#3b2f2a', paper: '#ecdcb6', paper2: '#f6ecd2', wash: '#d9c99c', wax: '#b8322b', teal: '#2f7f86', wood: '#8a5a35' };
function paper(g, w, h, seed) { g.fillStyle = B.paper; g.fillRect(0, 0, w, h); grain(g, w, h, 0.07, seed); const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,40,20,0.22)'); g.fillStyle = v; g.fillRect(0, 0, w, h); }
function inkLine(g, lw = 1.6) { g.lineWidth = lw; g.strokeStyle = B.ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function treeB(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 12 * s); inkLine(g, 2); g.beginPath(); g.arc(x, y - 20 * s, 9 * s, 0, 7); g.fillStyle = B.paper2; g.fill(); inkLine(g, 1.6);
  g.save(); g.beginPath(); g.arc(x, y - 20 * s, 9 * s, 0, 7); g.clip(); for (let k = -1; k < 2; k++) { g.beginPath(); g.moveTo(x - 9 * s, y - 14 * s + k * 3 * s); g.lineTo(x + 9 * s, y - 24 * s + k * 3 * s); inkLine(g, 0.9); } g.restore();
}
function hillB(g, x, y, w, h) { g.beginPath(); g.ellipse(x, y, w, h, 0, Math.PI, 0); g.fillStyle = B.wash; g.fill(); inkLine(g, 1.6); for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(x, y, w * (1 - k * 0.2), h * (1 - k * 0.2), 0, Math.PI * 1.1, Math.PI * 1.9); inkLine(g, 0.9); } }
function hex(g, x, y, r) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); }
function iconB(g, t, x, y) {
  g.lineWidth = 1.8; g.strokeStyle = B.ink; g.fillStyle = B.ink; g.lineCap = 'round';
  if (t === 'battle') { g.beginPath(); g.moveTo(x - 6, y - 6); g.lineTo(x + 6, y + 6); g.moveTo(x + 6, y - 6); g.lineTo(x - 6, y + 6); g.stroke(); }
  if (t === 'shop') { g.beginPath(); g.arc(x, y, 7, 0, 7); g.stroke(); label(g, '$', x, y + 0.5, 10, B.ink, { align: 'center', font: 'Georgia' }); }
  if (t === 'event') label(g, '?', x, y + 1, 17, B.ink, { align: 'center', font: 'Georgia' });
  if (t === 'town') { g.beginPath(); g.moveTo(x - 8, y + 1); g.lineTo(x, y - 8); g.lineTo(x + 8, y + 1); g.lineTo(x + 5, y + 1); g.lineTo(x + 5, y + 8); g.lineTo(x - 5, y + 8); g.lineTo(x - 5, y + 1); g.closePath(); g.stroke(); }
  if (t === 'treasure') { g.beginPath(); g.rect(x - 8, y - 5, 16, 11); g.stroke(); g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + 8, y); g.stroke(); }
  if (t === 'boss') { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fillStyle = B.wax; g.fill(); g.stroke(); dot(g, x - 3, y - 1, 1.8, B.paper2); dot(g, x + 3, y - 1, 1.8, B.paper2); }
}
function standeeB(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(2, 3, 14, 4, 0, 0, 7); g.fill();
  g.beginPath(); rr(g, -12, -4, 24, 7, 2); g.fillStyle = B.wood; g.fill(); inkLine(g, 1.5);
  g.beginPath(); g.moveTo(-9, -4); g.lineTo(-9, -24); g.lineTo(-5, -30); g.lineTo(-5, -34); g.arc(0, -36, 7, Math.PI * 0.9, Math.PI * 2.1); g.lineTo(5, -30); g.lineTo(9, -24); g.lineTo(9, -4); g.closePath(); g.fillStyle = B.paper2; g.fill(); inkLine(g, 1.6);
  g.fillStyle = B.teal; g.fillRect(-7, -22, 14, 14); g.fillStyle = B.wax; g.beginPath(); g.arc(0, -39, 7, Math.PI, 0); g.fill();
  g.fillStyle = B.ink; g.fillRect(-3, -37, 1.5, 2); g.fillRect(2, -37, 1.5, 2);
  g.beginPath(); g.moveTo(9, -22); g.lineTo(16, -34); inkLine(g, 2);
  g.restore();
}
function mapB(g) {
  paper(g, W, H, 3);
  g.fillStyle = 'rgba(80,60,30,0.12)'; g.fillRect(0, 0, W, 430);
  g.setLineDash([8, 6]); g.beginPath(); g.moveTo(0, 436); g.quadraticCurveTo(206, 410, W, 440); inkLine(g, 2); g.setLineDash([]);
  hillB(g, 90, 330, 110, 60); hillB(g, 340, 300, 120, 70); hillB(g, 330, 700, 140, 60);
  const r = rng(11); for (let i = 0; i < 22; i++) { const x = r() * W, y = 190 + r() * 650; if (SPACES.some(s => Math.hypot(s.x - x, s.y - y) < 42)) continue; treeB(g, x, y, y < 430 ? 1.3 : 1); }
  g.setLineDash([6, 7]); g.beginPath(); SPACES.forEach((s, i) => i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y)); inkLine(g, 2.2); g.setLineDash([]);
  SPACES.forEach(s => { hex(g, s.x, s.y, s.t === 'plain' ? 15 : 19); g.fillStyle = s.t === 'plain' ? B.paper2 : '#fbf3dd'; g.fill(); inkLine(g, 2); if (s.t !== 'plain') iconB(g, s.t, s.x, s.y); });
  OPEN.forEach(i => { const s = SPACES[i]; hex(g, s.x, s.y, 24); g.lineWidth = 3; g.strokeStyle = B.wax; g.stroke(); });
  standeeB(g, SPACES[HERO].x, SPACES[HERO].y, 1);
  label(g, 'Blackroot Wood', 206, 150, 20, B.ink, { align: 'center', font: 'Georgia', weight: 'italic' });
  label(g, 'The Meadows', 300, 600, 20, B.ink, { align: 'center', font: 'Georgia', weight: 'italic' });
  g.beginPath(); rr(g, 12, 44, 388, 54, 4); g.fillStyle = B.paper2; g.fill(); inkLine(g, 2);
  standeeB(g, 44, 92, 0.8); label(g, 'Robin, level 4', 76, 62, 15, B.ink, { font: 'Georgia' }); label(g, 'HP 32 / 40', 76, 84, 13, B.ink, { font: 'Georgia', weight: 'normal' }); label(g, '120 gold', 388, 72, 15, B.ink, { align: 'right', font: 'Georgia' });
  g.beginPath(); g.arc(206, 850, 44, 0, 7); g.fillStyle = B.wax; g.fill(); inkLine(g, 2); g.beginPath(); g.arc(206, 850, 34, 0, 7); g.strokeStyle = '#7d1f1a'; g.lineWidth = 2; g.stroke(); label(g, 'ROLL', 206, 852, 20, B.paper2, { align: 'center', font: 'Georgia' });
  g.beginPath(); rr(g, 318, 822, 56, 56, 6); g.fillStyle = B.paper2; g.fill(); inkLine(g, 2); [[332, 836], [360, 864], [346, 850]].forEach(([x, y]) => dot(g, x, y, 4, B.ink));
}
function fightB(g) {
  g.fillStyle = '#7b5230'; g.fillRect(0, 0, W, H); const r = rng(5); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; for (let i = 0; i < 60; i++) { const y = r() * H; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W / 3, y + r() * 10 - 5, 2 * W / 3, y + r() * 10 - 5, W, y); g.stroke(); }
  g.save(); g.translate(14, 120); g.beginPath(); rr(g, 0, 0, W - 28, 540, 6); g.clip(); paper(g, W - 28, 540, 9); g.restore(); g.beginPath(); rr(g, 14, 120, W - 28, 540, 6); inkLine(g, 2.5);
  g.beginPath(); g.moveTo(30, 420); g.lineTo(W - 30, 420); inkLine(g, 1.6); for (let x = 30; x < W - 30; x += 14) { g.beginPath(); g.moveTo(x, 420); g.lineTo(x + 8, 640); inkLine(g, 0.7); }
  hillB(g, 120, 418, 90, 50); treeB(g, 330, 418, 2); treeB(g, 60, 418, 1.5);
  g.save(); g.translate(236, 300); g.rotate(0.05); g.beginPath(); rr(g, 0, 0, 130, 170, 6); g.fillStyle = B.paper2; g.fill(); inkLine(g, 2.5);
  g.beginPath(); g.moveTo(25, 120); g.quadraticCurveTo(20, 50, 65, 48); g.quadraticCurveTo(110, 50, 105, 120); g.closePath(); g.fillStyle = '#d9e3c2'; g.fill(); inkLine(g, 2);
  for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(30 + k * 9, 118); g.lineTo(40 + k * 9, 95); inkLine(g, 0.8); }
  dot(g, 50, 85, 4, B.ink); dot(g, 80, 85, 4, B.ink);
  label(g, 'Meadow Slime', 65, 145, 13, B.ink, { align: 'center', font: 'Georgia', weight: 'italic' }); g.restore();
  standeeB(g, 110, 470, 3);
  label(g, '-12', 300, 270, 30, B.wax, { align: 'center', font: 'Georgia' });
  const bar = (x, name, hp, max) => { label(g, name, x, 60, 14, B.paper2, { font: 'Georgia' }); label(g, `${hp}/${max}`, x + 170, 60, 12, B.paper2, { align: 'right', font: 'Georgia' }); g.beginPath(); rr(g, x, 74, 170, 12, 2); g.fillStyle = B.paper2; g.fill(); inkLine(g, 1.5); g.fillStyle = B.wax; g.fillRect(x + 2, 76, 166 * hp / max, 8); };
  bar(20, 'Robin', 32, 40); bar(222, 'Meadow Slime', 18, 30);
  const tok = (x, y, t, accent) => { g.beginPath(); rr(g, x, y, 182, 72, 4); g.fillStyle = B.paper2; g.fill(); inkLine(g, 2); if (accent) dot(g, x + 24, y + 36, 12, accent); label(g, t, x + 100, y + 37, 20, B.ink, { align: 'center', font: 'Georgia' }); };
  tok(20, 700, 'Attack', B.wax); tok(210, 700, 'Skill', B.teal); tok(20, 790, 'Item', null); tok(210, 790, 'Defend', null);
}

// ---------- C. Pixel: a 16-bit handheld, drawn at a quarter size and scaled up with hard pixels ----------
const C = { sky: '#6fb9ff', sky2: '#a9dcff', g1: '#4caf50', g2: '#3d9a43', g3: '#2f7d35', path: '#d8b76a', path2: '#b8964f', ink: '#1b1b2b', white: '#f4f4f4', red: '#e04040', gold: '#f2c23a', blue: '#3b6fd6', skin: '#f3c9a0', hair: '#c23b2f', tunic: '#3b6fd6', boot: '#3a2a2a', slime: '#56d44f', slime2: '#2f9a3a', trunk: '#7a4a2a', leaf: '#3b9e3f', leaf2: '#2a7a30' };
const HEROPX = ['..RRRR..', '.RRRRRR.', '.RSSSSR.', '.RSKSKR.', '..SSSS..', '..BBBB..', '.BBBBBB.', '.SBBBBS.', '..BBBB..', '..B..B..', '..D..D..'];
const SLIMEPX = ['...GGGG...', '..GGGGGG..', '.GGWGGWGG.', '.GGKGGKGG.', 'GGGGGGGGGG', 'GMMMMMMMMG', '.GGGGGGGG.'];
const TREEPX = ['..LLLL..', '.LLLLLL.', 'LLLELLLL', 'LLLLLLEL', '.LLLLLL.', '..LTTL..', '...TT...', '...TT...'];
const PAL = { R: C.hair, S: C.skin, K: C.ink, B: C.tunic, D: C.boot, G: C.slime, M: C.slime2, L: C.leaf, E: C.leaf2, T: C.trunk, W: C.white };
function sprite(p, rows, x, y, k = 1) { rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { p.fillStyle = PAL[ch]; p.fillRect(x + i * k, y + j * k, k, k); } })); }
function pixels(draw) { const pc = createCanvas(103, 229); draw(pc.getContext('2d')); return pc; }
function blit(g, pc) { g.imageSmoothingEnabled = false; g.drawImage(pc, 0, 0, 103, 229, 0, 0, 412, 916); g.imageSmoothingEnabled = true; }
function mapC(g) {
  blit(g, pixels(p => {
    for (let y = 0; y < 229; y += 4) for (let x = 0; x < 103; x += 4) { const dark = y < 108; p.fillStyle = ((x + y) / 4) % 2 ? (dark ? C.g2 : C.g1) : (dark ? C.g3 : C.g2); p.fillRect(x, y, 4, 4); }
    const sp = SPACES.map(s => ({ t: s.t, x: Math.round(s.x / 4), y: Math.round(s.y / 4) }));
    for (let i = 1; i < sp.length; i++) { const a = sp[i - 1], b = sp[i]; for (let k = 0; k <= 12; k++) { const x = Math.round(a.x + (b.x - a.x) * k / 12), y = Math.round(a.y + (b.y - a.y) * k / 12); p.fillStyle = C.path2; p.fillRect(x - 2, y - 2, 4, 4); p.fillStyle = C.path; p.fillRect(x - 1, y - 1, 3, 3); } }
    const r = rng(21); for (let i = 0; i < 26; i++) { const x = Math.floor(r() * 95), y = 44 + Math.floor(r() * 160); if (sp.some(s => Math.hypot(s.x - x - 4, s.y - y - 6) < 11)) continue; sprite(p, TREEPX, x, y); }
    const col = { battle: C.red, shop: C.gold, event: '#a66be0', town: '#e08a3b', treasure: '#c98a3a', boss: '#2a2a2a' };
    sp.forEach(s => { p.fillStyle = C.ink; p.fillRect(s.x - 4, s.y - 4, 8, 8); p.fillStyle = s.t === 'plain' ? C.white : col[s.t]; p.fillRect(s.x - 3, s.y - 3, 6, 6); });
    OPEN.forEach(i => { const s = sp[i]; p.fillStyle = C.gold; p.fillRect(s.x - 5, s.y - 5, 10, 1); p.fillRect(s.x - 5, s.y + 4, 10, 1); p.fillRect(s.x - 5, s.y - 5, 1, 10); p.fillRect(s.x + 4, s.y - 5, 1, 10); });
    sprite(p, HEROPX, sp[HERO].x - 4, sp[HERO].y - 12);
    p.fillStyle = C.ink; p.fillRect(2, 10, 99, 15); p.fillStyle = '#2b2b45'; p.fillRect(3, 11, 97, 13); p.fillStyle = '#444'; p.fillRect(20, 19, 40, 3); p.fillStyle = '#5cd65c'; p.fillRect(20, 19, 32, 3); sprite(p, HEROPX, 6, 12);
    p.fillStyle = C.ink; p.fillRect(30, 200, 43, 20); p.fillStyle = C.gold; p.fillRect(31, 201, 41, 18);
    p.fillStyle = C.ink; p.fillRect(80, 200, 16, 16); p.fillStyle = C.white; p.fillRect(81, 201, 14, 14); p.fillStyle = C.ink; [[83, 203], [91, 211], [87, 207]].forEach(([x, y]) => p.fillRect(x, y, 2, 2));
  }));
  label(g, 'ROBIN LV4', 92, 60, 13, C.white, { font: 'Courier New' }); label(g, 'HP 32/40', 92, 84, 12, C.white, { font: 'Courier New' }); label(g, '120G', 392, 72, 13, C.gold, { align: 'right', font: 'Courier New' });
  label(g, 'ROLL', 206, 840, 20, C.ink, { align: 'center', font: 'Courier New' });
  label(g, 'SUNNY MEADOW', 206, 150, 16, C.white, { align: 'center', font: 'Courier New', stroke: C.ink, strokeW: 5 });
}
function fightC(g) {
  blit(g, pixels(p => {
    p.fillStyle = C.sky; p.fillRect(0, 0, 103, 229); p.fillStyle = C.sky2; p.fillRect(0, 60, 103, 60);
    for (let x = 0; x < 103; x++) { const h = 100 + Math.round(Math.sin(x / 9) * 6 + Math.sin(x / 3.1) * 2); p.fillStyle = C.g2; p.fillRect(x, h, 1, 229 - h); p.fillStyle = C.g1; p.fillRect(x, h, 1, 1); }
    p.fillStyle = C.g1; p.fillRect(0, 118, 103, 111); for (let y = 118; y < 229; y += 2) for (let x = (y / 2) % 2; x < 103; x += 2) { p.fillStyle = C.g2; p.fillRect(x, y, 1, 1); }
    p.fillStyle = C.g3; p.fillRect(0, 150, 103, 79);
    [8, 30, 70, 88].forEach((x, i) => sprite(p, TREEPX, x, 100 - (i % 2) * 4, 2));
    sprite(p, HEROPX, 16, 118, 3); sprite(p, SLIMEPX, 62, 134, 3);
    p.fillStyle = C.ink; p.fillRect(2, 10, 47, 16); p.fillRect(54, 10, 47, 16); p.fillStyle = '#2b2b45'; p.fillRect(3, 11, 45, 14); p.fillRect(55, 11, 45, 14);
    p.fillStyle = '#444'; p.fillRect(6, 20, 39, 3); p.fillRect(58, 20, 39, 3); p.fillStyle = '#5cd65c'; p.fillRect(6, 20, 31, 3); p.fillStyle = C.red; p.fillRect(58, 20, 23, 3);
    p.fillStyle = C.ink; p.fillRect(2, 172, 99, 52); p.fillStyle = '#2b2b45'; p.fillRect(3, 173, 97, 50);
    [[5, 176, C.red], [52, 176, C.blue], [5, 199, '#4aa84a'], [52, 199, '#777']].forEach(([x, y, c]) => { p.fillStyle = c; p.fillRect(x, y, 46, 21); p.fillStyle = C.ink; p.fillRect(x, y + 19, 46, 2); });
  }));
  label(g, 'ROBIN', 20, 62, 12, C.white, { font: 'Courier New' }); label(g, '32/40', 180, 62, 11, C.white, { align: 'right', font: 'Courier New' });
  label(g, 'SLIME', 228, 62, 12, C.white, { font: 'Courier New' }); label(g, '18/30', 388, 62, 11, C.white, { align: 'right', font: 'Courier New' });
  [['ATTACK', 112, 746], ['SKILL', 300, 746], ['ITEM', 112, 838], ['DEFEND', 300, 838]].forEach(([t, x, y]) => label(g, t, x, y, 18, C.white, { align: 'center', font: 'Courier New', stroke: C.ink, strokeW: 4 }));
  label(g, '-12', 320, 500, 30, C.gold, { align: 'center', font: 'Courier New', stroke: C.ink, strokeW: 6 });
}

// ---------- the boards ----------
function twoUp(name, lines, mapFn, fightFn, file) {
  const gutter = 40, top = 170; const cv = createCanvas(W * S * 2 + gutter * 3, H * S + top + 50); const g = cv.getContext('2d');
  g.fillStyle = '#f2efe8'; g.fillRect(0, 0, cv.width, cv.height);
  label(g, name, gutter, 50, 44, '#222'); lines.forEach((l, i) => label(g, l, gutter, 100 + i * 30, 24, '#444', { weight: 'normal' }));
  const m = phone(mapFn), f = phone(fightFn); const x2 = gutter * 2 + W * S;
  g.drawImage(m, gutter, top); g.drawImage(f, x2, top);
  g.lineWidth = 3; g.strokeStyle = '#222'; g.strokeRect(gutter, top, W * S, H * S); g.strokeRect(x2, top, W * S, H * S);
  label(g, 'The world map', gutter + W * S / 2, top + H * S + 26, 22, '#444', { align: 'center' }); label(g, 'A fight', x2 + W * S / 2, top + H * S + 26, 22, '#444', { align: 'center' });
  fs.writeFileSync(path.join(OUT, file), cv.toBuffer('image/png')); console.log('wrote', file);
}
function threeUp(title, items, file) {
  const gutter = 40, top = 110; const cv = createCanvas(W * S * 3 + gutter * 4, H * S + top + 50); const g = cv.getContext('2d');
  g.fillStyle = '#f2efe8'; g.fillRect(0, 0, cv.width, cv.height); label(g, title, gutter, 50, 40, '#222');
  items.forEach(([name, fn], i) => { const x = gutter + i * (W * S + gutter); g.drawImage(phone(fn), x, top); g.lineWidth = 3; g.strokeStyle = '#222'; g.strokeRect(x, top, W * S, H * S); label(g, name, x + W * S / 2, top + H * S + 26, 22, '#444', { align: 'center' }); });
  fs.writeFileSync(path.join(OUT, file), cv.toBuffer('image/png')); console.log('wrote', file);
}

twoUp('A. Sunny cel', ['A bright fantasy world in thick ink and two-tone colour, chibi heroes and round monsters,', 'cheerful by day: MapleStory\'s mood, made in Blender and rendered to sprites.'], mapA, fightA, 'A-sunny-cel.png');
twoUp('B. Ink and paper', ['The world is a board game on a table: a parchment map in ink, hexagon spaces, standees', 'and cards for the fights; one red wax accent. Drawn in code, almost no sprites.'], mapB, fightB, 'B-ink-and-paper.png');
twoUp('C. Pixel handheld', ['A 16-bit handheld RPG: small crisp pixel sprites, dithered ground, chunky menus;', 'the cheapest sheets there are, scaled up with hard pixels.'], mapC, fightC, 'C-pixel.png');
threeUp('The world map in each direction', [['A. Sunny cel', mapA], ['B. Ink and paper', mapB], ['C. Pixel handheld', mapC]], 'compare-maps.png');
threeUp('A fight in each direction', [['A. Sunny cel', fightA], ['B. Ink and paper', fightB], ['C. Pixel handheld', fightC]], 'compare-fights.png');
