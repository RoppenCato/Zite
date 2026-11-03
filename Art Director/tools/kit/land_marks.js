// land_marks.js: each land's own name banner and closed-land cover, and spot plates for Crownhaven, the Buried Crown and the Rootways (Mitch, AD, 2026-11-03).
// Robin chose "fill the holes" and "polish and looks"; Miles, GD: every land used the Meadows' banner and cover, and the city and dungeons the Meadows' plates. Designs mine.
//   node tools/kit/land_marks.js  -> out/land_marks/{banner_<area>.png, cover_<area>.png, plates_<place>.png/.json, preview.jpg}
// Banners keep the Meadows' size (400 by 60 design px, 800 by 120 in the file) with a clear middle for the name; each end carries its land's sign.
// Covers keep its form: 256 square design px, seamless soft cloud, in the land's own haze. Plates keep the Meadows' kinds, sizes and rims, on each place's own stone.
const P = require('../paint.js'); const CF = require('./cloverfield.js'); const G = require('../hybrid/gear.js'); const path = require('path'); const fs = require('fs');
const { C } = CF, I = require('../ink.js'), { form, line } = I, INK = '#2a2030', FILE = 2, ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'out/land_marks');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const disc = (g, x, y, r, c, ink = 1.2) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = c; g.fill(); if (ink) { g.lineWidth = ink; g.strokeStyle = INK; g.stroke(); } };
const poly = (g, pts, c, ink = 1.2) => form(g, pts.map(p => [p[0], p[1], 1]), c, { inkW: ink, shade: false, n: 3 });
// ---------------------------------------------------------------- each land's sign, about 30 design px, drawn at the banner's ends
const SIGN = {
  meadows: g => { line(g, [[0, 4], [2, 13]], 2.6, '#3f8a3a', { taper: 0.1 }); for (const a of [-2.2, -0.95, 0.3]) disc(g, Math.cos(a - 0.4) * 6.5, Math.sin(a - 0.4) * 6.5 - 1, 6, '#6cc04a'); disc(g, 0, -1, 2, '#f4f0d0', 0); },
  thornwood: g => { form(g, [[0, 12], [-9, 3], [-11, -5], [-6, -8], [-8, -13], [0, -16, 1], [8, -13], [6, -8], [11, -5], [9, 3]], '#5aa04a', { inkW: 1.2, shade: false, n: 6 }); line(g, [[0, 13], [0, -12]], 1.2, '#2e6a2a', { taper: 0.2 }); },
  frostpeak: g => { for (const [x, y] of [[0, 0], [-9, -5], [9, -5], [-9, 5], [9, 5], [0, -10], [0, 10]].slice(0, 5)) { const pts = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; pts.push([x + Math.cos(a) * 5.4, y + Math.sin(a) * 5.4]); } poly(g, pts, '#f4c14a', 1.1); } disc(g, 0, 0, 2, '#c88a2a', 0); },
  bogglemire: g => { g.save(); g.scale(1, 0.55); disc(g, -2, 12, 11, '#5a9a4a'); g.restore(); g.fillStyle = '#e8eedc'; g.beginPath(); g.moveTo(-2, 6.6); g.lineTo(9, 3); g.lineTo(9, 9); g.fill(); for (const x of [4, 9]) { line(g, [[x, 4], [x + 1, -14]], 1.6, '#6a7a3a', { taper: 0.1 }); g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(x + 1, -12 + (x - 4), 2.2, 4.6, 0, 0, 7); g.fill(); g.lineWidth = 1; g.strokeStyle = INK; g.stroke(); } },
  frostcrown: g => { for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); line(g, [[0, 0], [0, -13]], 4.2, INK, { taper: 0.05 }); line(g, [[0, 0], [0, -13]], 2.4, '#bfe4ff', { taper: 0.05 }); for (const d of [-1, 1]) { line(g, [[0, -7], [d * 4.5, -10.5]], 3.4, INK, { taper: 0.1 }); line(g, [[0, -7], [d * 4.5, -10.5]], 1.8, '#bfe4ff', { taper: 0.1 }); } g.restore(); } disc(g, 0, 0, 2.6, '#ffffff', 1); },
  crownhaven: g => { poly(g, [[-12, 8], [-14, -7], [-7, -1], [0, -11], [7, -1], [14, -7], [12, 8]], '#f4c14a', 1.4); poly(g, [[-12, 8], [12, 8], [12, 11], [-12, 11]], '#c88a2a', 1.2); disc(g, 0, 3, 2.4, '#e8345a', 1); },
  kingswood: g => { for (const [y, wd] of [[-12, 6], [-5, 9], [2, 12]]) poly(g, [[0, y - 8], [wd, y + 5], [-wd, y + 5]], '#3f8a4a', 1.2); poly(g, [[-2, 7], [2, 7], [2, 13], [-2, 13]], '#8a5a34', 1); disc(g, 0, -20, 2.4, '#f4c14a', 1); },
  pirateisles: g => { g.lineCap = 'round'; for (const [wd, c] of [[4.4, INK], [2.6, '#c8d0d8']]) { g.lineWidth = wd; g.strokeStyle = c; g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 12); g.moveTo(-7, -5); g.lineTo(7, -5); g.moveTo(-11, 5); g.quadraticCurveTo(0, 17, 11, 5); g.stroke(); } disc(g, 0, -13, 3.2, '#c8d0d8', 1.2); },
  giantsland: g => { poly(g, [[-15, 11], [-4, -12], [3, -2], [7, -8], [16, 11]], '#8a96a8', 1.3); poly(g, [[-9, -1], [-4, -12], [1, -4], [-3, -6]], '#ffffff', 0.9); poly(g, [[5, -5], [7, -8], [10, -3]], '#ffffff', 0.9); },
  rootways: g => { g.lineCap = 'round'; for (const [wd, c] of [[5, INK], [3, '#9a6a3a']]) { g.lineWidth = wd; g.strokeStyle = c; g.beginPath(); g.moveTo(0, -14); g.bezierCurveTo(-2, -4, 8, -2, 4, 6); g.bezierCurveTo(1, 12, -8, 10, -7, 4); g.stroke(); } g.save(); g.translate(8, 6); disc(g, 0, 4, 2.4, '#efe4d0'); g.beginPath(); g.ellipse(0, 1, 6, 4, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#d8443c'; g.fill(); g.lineWidth = 1.1; g.strokeStyle = INK; g.stroke(); g.restore(); },
  'buried-crown': g => { poly(g, [[-12, 8], [-14, -7], [-7, -1], [-2, -8], [1, -3], [-1, 2], [3, 8]], '#b8a870', 1.4); poly(g, [[5, 8], [7, 0], [10, -6], [14, -7], [12, 8]], '#b8a870', 1.4); poly(g, [[-12, 8], [12, 8], [12, 11], [-12, 11]], '#8a7a4a', 1.2); disc(g, -6, 3, 2, '#6a5aa0', 1); },
};
// rim, face, the name's land
const LAND = {
  meadows: { name: 'Cloverfield Meadows', rim: '#6aa84f', face: '#f7efdc', cover: ['#b4c0d0', '#d4dde8', '#a3b0c2'] },
  thornwood: { name: 'Wobblewood Forest', rim: '#3f7a3a', face: '#eef0d8', cover: ['#9fb89a', '#c4d8bc', '#869e82'] },
  frostpeak: { name: 'Honeyhill Fields', rim: '#d8981e', face: '#fbf0d0', cover: ['#d4c08c', '#ecdcae', '#bea86e'] },
  bogglemire: { name: 'Bogglemire', rim: '#5a7a5a', face: '#e8eedc', cover: ['#8f9a86', '#b2bca6', '#7a7290'] },
  frostcrown: { name: 'The Frostcrown', rim: '#5a9ad0', face: '#f0f6fc', cover: ['#c8d8e8', '#eef4fa', '#aabccc'] },
  crownhaven: { name: 'Crownhaven', rim: '#7a4aa8', face: '#f7efdc', cover: ['#c4bcb4', '#e0dad2', '#a89f96'] },
  kingswood: { name: 'The Kingswood', rim: '#2e6a3e', face: '#eef2dc', cover: ['#8faa8a', '#b4c8ac', '#768e72'] },
  pirateisles: { name: 'The Pirate Isles', rim: '#2a7a9a', face: '#f4ecd8', cover: ['#9cc4cc', '#c8e4e8', '#7ea8b2'] },
  giantsland: { name: 'The Giants’ Land', rim: '#6a7a8e', face: '#eef0f4', cover: ['#b8bec8', '#dadfe6', '#9aa2ae'] },
  rootways: { name: 'The Rootways', rim: '#7a5a3a', face: '#efe4d0', cover: ['#8a7a68', '#ab9c88', '#6e6052'] },
  'buried-crown': { name: 'The Buried Crown', rim: '#4a3a6a', face: '#e4e0ec', cover: ['#6e6884', '#8e88a4', '#56506c'] },
};
function banner(id, L) { const w = 400, h = 60, r = 16, cv = P.createCanvas(w * FILE, h * FILE), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.scale(FILE, FILE);
  g.fillStyle = INK; g.beginPath(); P.rr(g, 1, 1, w - 2, h - 2, r); g.fill(); g.fillStyle = L.rim; g.beginPath(); P.rr(g, 3, 3, w - 6, h - 6, r - 2); g.fill(); g.fillStyle = INK; g.beginPath(); P.rr(g, 7, 7, w - 14, h - 14, r - 6); g.fill(); g.fillStyle = L.face; g.beginPath(); P.rr(g, 8.5, 8.5, w - 17, h - 17, r - 7); g.fill(); g.fillStyle = 'rgba(42,32,48,0.08)'; g.beginPath(); P.rr(g, 8.5, h - 16, w - 17, 7.5, 4); g.fill();
  for (const [x, flip] of [[34, 1], [w - 34, -1]]) { g.save(); g.translate(x, h / 2 + 1); g.scale(flip * 0.92, 0.92); SIGN[id](g); g.restore(); for (const dx of [26, 34]) { g.fillStyle = L.rim; g.beginPath(); g.arc(x + flip * dx, h / 2, dx === 26 ? 1.8 : 1.2, 0, 7); g.fill(); } }
  P.save(cv, path.join(OUT, `banner_${id}.png`)); return cv; }
function cover(id, L) { const w = 256, [base, light, dark] = L.cover, cv = P.createCanvas(w * FILE, w * FILE), g = cv.getContext('2d'); g.scale(FILE, FILE); g.fillStyle = base; g.fillRect(0, 0, w, w); P.wrapped(g, w, w, () => { const qq = P.rng(41 + id.length); for (let i = 0; i < 14; i++) { const x = qq() * w, y = qq() * w, r = 30 + qq() * 34, col = i % 3 ? light : dark; g.fillStyle = P.rad(g, x, y, x, y, r, [[0, P.alpha(col, 0.9)], [0.6, P.alpha(col, 0.5)], [1, P.alpha(col, 0)]]); g.beginPath(); g.ellipse(x, y, r * 1.3, r * 0.8, 0, 0, 7); g.fill(); } }); P.save(cv, path.join(OUT, `cover_${id}.png`)); return cv; }
// ---------------------------------------------------------------- the plates: the Meadows' kinds and sizes, each place's own stone
const SPOTS = [['wild', 56], ['town', 90], ['shop', 90], ['chest', 56], ['spring', 56], ['shrine', 56], ['board', 56], ['gear', 56], ['shop_magic', 90], ['church', 56], ['gate', 120]];
const BASE = { wild: 24, town: 44, shop: 24, chest: 24, spring: 24, shrine: 24, church: 24, board: 24, gear: 24, shop_magic: 24, gate: 36 };
const STONE = {
  city: { name: 'Crownhaven, cobbles', plate: '#e4e4ea', plateShade: '#b0b2c0', path: '#cfc8ba', pathEdge: '#8f897c' },
  crown: { name: 'The Buried Crown, crypt stone', plate: '#c8c2da', plateShade: '#8a84a0', path: '#8a84a0', pathEdge: '#4a4460' },
  dungeon: { name: 'The Rootways, root-worn stone', plate: '#dccaa0', plateShade: '#a88c60', path: '#a8885e', pathEdge: '#6a5034' },
};
function plates(id, S) { const keep = { plate: C.plate, plateShade: C.plateShade, path: C.path, pathEdge: C.pathEdge }; Object.assign(C, S); const frames = []; for (const [kind, width] of SPOTS) { const cv = P.createCanvas((width + 30) * FILE, (width + 30) * FILE), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.scale(FILE, FILE); g.translate((width + 30) / 2, (width + 30) / 2); g.scale(2, 2); CF.plate(g, 0, 0, kind, width / (BASE[kind] * 2)); g.setTransform(1, 0, 0, 1, 0, 0); P.harden(cv); const t = P.trim(cv, 1); frames.push({ key: `spot_${kind}`, cv: t.cv, origin: [(width + 30) * FILE / 2 - t.x, (width + 30) * FILE / 2 - t.y] }); } Object.assign(C, keep); const a = G.atlas(`plates_${id}`, frames, OUT); return { a, frames }; }
(async () => {
  const B = {}, CV = {}; for (const [id, L] of Object.entries(LAND)) { B[id] = banner(id, L); CV[id] = cover(id, L); }
  const PL = {}; for (const [id, S] of Object.entries(STONE)) PL[id] = plates(id, S);
  // the picture: each banner with its name over its own cover, as the board shows a closed land; then the three plate sets on their stone
  const ids = Object.keys(LAND), cv = P.createCanvas(1640, 120 + Math.ceil(ids.length / 2) * 150 + 3 * 150), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.fillStyle = '#1c1a22'; g.fillRect(0, 0, cv.width, cv.height); P.label(g, 'Each land\'s banner over its own cover, at the board\'s size; then the plates of Crownhaven, the Buried Crown and the Rootways', 820, 26, 20, '#f7efdc', { align: 'center' });
  ids.forEach((id, n) => { const x = 20 + (n % 2) * 810, y = 60 + Math.floor(n / 2) * 150; const pat = g.createPattern(CV[id], 'repeat'); g.save(); g.translate(x, y); g.scale(0.5, 0.5); g.fillStyle = pat; g.fillRect(0, 0, 1580, 270); g.fillStyle = 'rgba(11,13,20,0.3)'; g.fillRect(0, 0, 1580, 270); g.restore(); g.drawImage(B[id], x + 195, y + 35, 400, 60); P.label(g, LAND[id].name, x + 395, y + 66, 22, '#fff8e6', { align: 'center', stroke: '#4a3a22', strokeW: 3 }); });
  let y0 = 60 + Math.ceil(ids.length / 2) * 150 + 10; for (const [id, S] of Object.entries(STONE)) { g.fillStyle = S.path; g.fillRect(20, y0, 1600, 130); let x = 70; for (const f of PL[id].frames) { const k = 0.5; g.drawImage(f.cv, x - f.origin[0] * k, y0 + 65 - f.origin[1] * k, f.cv.width * k, f.cv.height * k); x += f.cv.width * k + 22; } P.label(g, S.name, 30, y0 + 16, 15, '#1c1a22'); y0 += 150; }
  fs.writeFileSync(path.join(OUT, 'preview.jpg'), cv.toBuffer('image/jpeg', 88)); console.log('written');
})();
