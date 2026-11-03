// brand.js: the Zite wordmark, the app icon and the character screen's backdrop (Mitch, AD, 2026-11-01).
// The letters are drawn by hand as splines, no font. The one thing the mark says: a tiny tilted crown for the dot of the i, the crown that
// King Goo stole. The backdrop is dusk over the kingdom: dark at the top and the bottom, where the screen's light words and buttons sit, and the
// castle in the open stage between them, about y 360 to 750 with one class card.
//   node tools/kit/brand.js  -> out/brand/
const P = require('../paint.js'); const I = require('../ink.js'); const path = require('path'); const fs = require('fs');
const { form, spline, fill } = I; const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'out/brand');
const OUTLINE = '#1d1a44', DEEP = '#3a2a7a';
const LETTERS = {
  Z: [[6, 6, 1], [80, 0, 1], [84, 22, 1], [42, 74, 1], [86, 70, 1], [90, 98, 1], [2, 106, 1], [0, 84, 1], [42, 32, 1], [8, 34, 1]],
  i: [[104, 42, 1], [130, 38, 1], [132, 100], [118, 106], [104, 100, 1]],
  t: [[150, 10, 1], [174, 4, 1], [174, 36, 1], [190, 34, 1], [192, 56, 1], [174, 58, 1], [174, 80], [182, 84], [192, 80, 1], [198, 98, 1], [178, 106], [158, 104], [150, 86], [150, 58, 1], [136, 60, 1], [134, 38, 1], [150, 36, 1]],
  e: [[208, 72], [218, 44], [248, 32], [276, 44], [288, 74, 1], [234, 76, 1], [242, 86], [256, 86], [276, 76, 1], [284, 94], [256, 108], [224, 102]],
};
const E_HOLE = [[234, 62, 1], [240, 53], [250, 50], [258, 54], [262, 62, 1]];
const CROWN = [[-16, 11, 1], [16, 11, 1], [21, -12, 1], [9, -2, 1], [0, -19, 1], [-9, -2, 1], [-21, -12, 1]];
function ringed(mask, W, H, o) {   // the mask's shape with its deep block, its outline, its gradient and its top light
  { const c = mask.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); const d = c.getImageData(0, 0, W, H); for (let i = 3; i < d.data.length; i += 4) if (d.data[i] < 110) d.data[i] = 0; c.putImageData(d, 0, 0); }
  const cv = P.createCanvas(W, H), g = cv.getContext('2d'), ring = (r, dy, col) => { const t = P.createCanvas(W, H), q = t.getContext('2d'); q.drawImage(mask, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = col; q.fillRect(0, 0, W, H); for (let a = 0; a < 32; a++) g.drawImage(t, Math.cos(a / 32 * 6.283) * r, Math.sin(a / 32 * 6.283) * r + dy); };
  ring(o.r, o.drop, o.deep); ring(o.r, 0, o.line);
  const f = P.createCanvas(W, H), q = f.getContext('2d'); q.drawImage(mask, 0, 0); q.globalCompositeOperation = 'source-in'; const gr = q.createLinearGradient(0, o.y0, 0, o.y1); o.stops.forEach(([s, c]) => gr.addColorStop(s, c)); q.fillStyle = gr; q.fillRect(0, 0, W, H);
  q.globalCompositeOperation = 'source-atop'; q.fillStyle = 'rgba(255,255,255,0.5)'; q.save(); q.translate(0, o.y0); q.beginPath(); q.moveTo(0, 0); q.lineTo(W, 0); q.lineTo(W, (o.y1 - o.y0) * 0.26); q.bezierCurveTo(W * 0.66, (o.y1 - o.y0) * 0.36, W * 0.33, (o.y1 - o.y0) * 0.2, 0, (o.y1 - o.y0) * 0.32); q.closePath(); q.fill(); q.restore();
  g.drawImage(f, 0, 0); return cv;
}
function crown(g, x, y, k, tilt, gem = '#e8345a') {   // drawn on its own so it keeps its own gold whatever the letters are
  const W = 200 * k | 0, cv = P.createCanvas(W, W), m = cv.getContext('2d'); m.translate(W / 2, W / 2); m.scale(k, k); fill(m, spline(CROWN), '#000'); for (const [px, py, r] of [[-21, -13, 3.4], [0, -21, 3.8], [21, -13, 3.4]]) { m.fillStyle = '#000'; m.beginPath(); m.arc(px, py, r, 0, 7); m.fill(); }
  const R = ringed(cv, W, W, { r: 4.2 * k, drop: 2.2 * k, deep: DEEP, line: OUTLINE, y0: W / 2 - 22 * k, y1: W / 2 + 12 * k, stops: [[0, '#fff0a0'], [0.5, '#ffc93a'], [1, '#e8922a']] }), t = R.getContext('2d'); t.fillStyle = gem; t.beginPath(); t.ellipse(W / 2, W / 2 + 3 * k, 4 * k, 3.4 * k, 0, 0, 7); t.fill(); t.lineWidth = 1 * k; t.strokeStyle = OUTLINE; t.stroke(); t.fillStyle = '#ffd0da'; t.beginPath(); t.arc(W / 2 - 1.2 * k, W / 2 + 2 * k, 1.1 * k, 0, 7); t.fill();
  g.save(); g.translate(x, y); g.rotate(tilt); g.drawImage(R, -W / 2, -W / 2); g.restore();
}
const LETTER_STOPS = [[0, '#ffffff'], [0.45, '#e6f8ff'], [1, '#6fc4f4']];
function wordmark() {
  const k = 2.1, W = 700, H = 330, ox = 40, oy = 74, m = P.createCanvas(W, H), g = m.getContext('2d'); g.translate(ox, oy); g.scale(k, k);
  for (const pts of Object.values(LETTERS)) fill(g, spline(pts), '#000'); g.globalCompositeOperation = 'destination-out'; fill(g, spline(E_HOLE), '#000'); g.globalCompositeOperation = 'source-over';
  const R = ringed(m, W, H, { r: 8.5, drop: 8, deep: DEEP, line: OUTLINE, y0: oy, y1: oy + 108 * k, stops: LETTER_STOPS }), q = R.getContext('2d'); crown(q, ox + 118 * k, oy + 12 * k, k * 0.98, -0.2); return P.trim(R, 2).cv;
}
function icon(S) {
  const W = 1024, cv = P.createCanvas(W, W), g = cv.getContext('2d'), sky = g.createLinearGradient(0, 0, 0, W); sky.addColorStop(0, '#2a2c78'); sky.addColorStop(0.55, '#6a3f9e'); sky.addColorStop(0.82, '#f08a6a'); sky.addColorStop(1, '#ffd08a'); g.fillStyle = sky; g.fillRect(0, 0, W, W);
  const q = P.rng(5); for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,250,220,${0.4 + q() * 0.5})`; g.beginPath(); g.arc(q() * W, q() * W * 0.55, 2 + q() * 4, 0, 7); g.fill(); }
  fill(g, spline([[-60, 900], [260, 800], [620, 860], [1090, 770], [1090, 1090], [-60, 1090]]), '#2f8a5a'); fill(g, spline([[-60, 960], [340, 900], [760, 950], [1090, 900], [1090, 1090], [-60, 1090]]), '#1f6a4a');
  const m = P.createCanvas(W, W), t = m.getContext('2d'); t.translate(512 - 45 * 5, 310); t.scale(5, 5); fill(t, spline(LETTERS.Z), '#000'); const R = ringed(m, W, W, { r: 18, drop: 16, deep: DEEP, line: OUTLINE, y0: 310, y1: 310 + 106 * 5, stops: LETTER_STOPS }); g.drawImage(R, 0, 0); crown(g, 650, 296, 3.8, 0.26);
  const out = P.createCanvas(S, S), o = out.getContext('2d'); o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high'; o.drawImage(cv, 0, 0, S, S); return out;
}
function backdrop() {
  const cv = P.createCanvas(824, 1830), g = cv.getContext('2d'); g.scale(2, 2); g.imageSmoothingQuality = 'high'; const flat = (pts, col) => form(g, pts, col, { ink: null, shade: false });
  const glow = (x, y, r, col, a) => { const G = g.createRadialGradient(x, y, 0, x, y, r); G.addColorStop(0, P.alpha(col, a)); G.addColorStop(1, P.alpha(col, 0)); g.fillStyle = G; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const sky = g.createLinearGradient(0, 0, 0, 610); [[0, '#14173c'], [0.32, '#27276a'], [0.58, '#5a3a94'], [0.78, '#b5588f'], [0.92, '#f08a6a'], [1, '#ffcf8a']].forEach(([s, c]) => sky.addColorStop(s, c)); g.fillStyle = sky; g.fillRect(0, 0, 412, 915);
  const q = P.rng(21); for (let i = 0; i < 90; i++) { const y = q() * 380, a = (0.3 + q() * 0.7) * (1 - y / 460), r = 0.4 + q() * 0.8; g.fillStyle = `rgba(255,250,225,${a})`; g.beginPath(); g.arc(q() * 412, y, r, 0, 7); g.fill(); }
  for (const [x, y, r] of [[34, 118, 5], [384, 208, 6], [22, 268, 4], [392, 44, 5], [60, 30, 4], [28, 410, 4], [386, 400, 3.5]]) { flat([[x - r, y, 1], [x - r * 0.18, y - r * 0.18, 1], [x, y - r, 1], [x + r * 0.18, y - r * 0.18, 1], [x + r, y, 1], [x + r * 0.18, y + r * 0.18, 1], [x, y + r, 1], [x - r * 0.18, y + r * 0.18, 1]], '#fff4c8'); glow(x, y, r * 2.6, '#fff4c8', 0.3); }
  glow(352, 110, 66, '#ffeec0', 0.22); { const mc = P.createCanvas(120, 120), mg = mc.getContext('2d'); mg.fillStyle = '#fff2c8'; mg.beginPath(); mg.arc(60, 60, 42, 0, 7); mg.fill(); mg.globalCompositeOperation = 'destination-out'; mg.beginPath(); mg.arc(78, 48, 36, 0, 7); mg.fill(); g.drawImage(mc, 322, 80, 60, 60); }
  for (const [x, y, s] of [[70, 470, 1], [340, 440, 0.8]]) flat([[x - 62 * s, y + 8 * s], [x - 34 * s, y - 6 * s], [x - 8 * s, y - 16 * s], [x + 22 * s, y - 8 * s], [x + 60 * s, y + 8 * s], [x, y + 13 * s]], '#c977a0');
  glow(286, 610, 250, '#ffc47a', 0.35);
  flat([[-40, 625], [-10, 548], [44, 510], [92, 550], [132, 520], [186, 566], [262, 590], [340, 550], [382, 524], [452, 575], [452, 640], [-40, 640]], '#8a5aa6');
  flat([[-40, 640], [24, 586], [92, 596], [160, 572], [232, 610], [452, 604], [452, 660], [-40, 660]], '#6a4c94');
  // the castle on its hill, lit from the sunset at the left, its windows warm
  flat([[110, 708], [168, 640], [226, 606], [282, 594], [336, 610], [392, 648], [452, 690], [452, 760], [110, 760]], '#3f3f7c');
  const STONE = '#6a5a9c', LIT = '#a783b4', DARK = '#4a4080', ROOF = '#34306e', ROOFL = '#c8586c';
  const tower = (x, w, top, base, roof = 26) => { flat([[x - w / 2, base, 1], [x - w / 2, top, 1], [x + w / 2, top, 1], [x + w / 2, base, 1]], STONE); flat([[x - w / 2, base, 1], [x - w / 2, top, 1], [x - w * 0.18, top, 1], [x - w * 0.18, base, 1]], LIT); flat([[x + w * 0.22, base, 1], [x + w * 0.22, top, 1], [x + w / 2, top, 1], [x + w / 2, base, 1]], DARK); flat([[x - w * 0.68, top + 1, 1], [x, top - roof, 1], [x + w * 0.68, top + 1, 1]], ROOF); flat([[x - w * 0.68, top + 1, 1], [x, top - roof, 1], [x - w * 0.12, top + 1, 1]], ROOFL); g.strokeStyle = '#2c2860'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x, top - roof); g.lineTo(x, top - roof - 9); g.stroke(); flat([[x, top - roof - 9, 1], [x + 10, top - roof - 6, 1], [x, top - roof - 3, 1]], '#f4c14a'); };
  const win = (x, y, w = 3.4, h = 6) => { glow(x, y, 11, '#ffc25a', 0.5); flat([[x - w / 2, y + h / 2, 1], [x - w / 2, y - h / 3, 1], [x, y - h / 2, 1], [x + w / 2, y - h / 3, 1], [x + w / 2, y + h / 2, 1]], '#ffe29a'); };
  tower(238, 20, 522, 610, 24); tower(330, 18, 534, 610, 22); tower(284, 30, 484, 600, 36);
  flat([[220, 612, 1], [220, 554, 1], [348, 554, 1], [348, 612, 1]], STONE); flat([[220, 612, 1], [220, 554, 1], [252, 554, 1], [252, 612, 1]], LIT); flat([[318, 612, 1], [318, 554, 1], [348, 554, 1], [348, 612, 1]], DARK); for (let x = 220; x < 346; x += 11) flat([[x, 555, 1], [x, 548, 1], [x + 6, 548, 1], [x + 6, 555, 1]], x < 252 ? LIT : x > 316 ? DARK : STONE);
  tower(202, 24, 562, 630, 28); tower(366, 24, 570, 636, 26); flat([[272, 612, 1], [272, 590, 1], [284, 578, 1], [296, 590, 1], [296, 612, 1]], '#2c2860'); flat([[276, 612, 1], [276, 592, 1], [284, 584, 1], [292, 592, 1], [292, 612, 1]], '#ffb54a');
  [[284, 504], [284, 526], [238, 540], [330, 550], [202, 584], [366, 592], [242, 575], [264, 568], [306, 568], [326, 578]].forEach(([x, y]) => win(x, y));
  // the hills in front, the road winding up to the gate, the trees, the lanterns
  flat([[-40, 690], [44, 640], [120, 650], [196, 628], [288, 616], [360, 640], [452, 626], [452, 800], [-40, 800]], '#2e6a5e');
  flat([[-40, 742], [70, 700], [170, 712], [282, 684], [372, 698], [452, 676], [452, 840], [-40, 840]], '#1f5450');
  const ROAD = [[284, 616], [262, 642], [316, 672], [354, 694], [262, 722], [150, 752], [214, 800], [300, 860], [250, 930]], side = 1; { const L = spline(ROAD, false, 14), wide = i => 2.5 + Math.pow(i / L.length, 1.6) * 32; const ptsA = L.map((p, i) => [p[0] - wide(i), p[1]]), ptsB = L.map((p, i) => [p[0] + wide(i), p[1]]).reverse(); g.fillStyle = '#d8a878'; g.beginPath(); [...ptsA, ...ptsB].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); g.fillStyle = 'rgba(30,24,70,0.28)'; g.beginPath(); [...L.map((p, i) => [p[0], p[1]]), ...ptsB].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); }
  const tree = (x, y, s, c, d) => { flat([[x - 2 * s, y - 3 * s, 1], [x - 1.4 * s, y - 16 * s, 1], [x + 1.4 * s, y - 16 * s, 1], [x + 2 * s, y - 3 * s, 1]], '#173c3e'); flat([[x - 18 * s, y - 16 * s], [x - 16 * s, y - 34 * s], [x - 3 * s, y - 44 * s], [x + 13 * s, y - 38 * s], [x + 19 * s, y - 20 * s], [x + 6 * s, y - 10 * s], [x - 8 * s, y - 11 * s]], d); flat([[x - 18 * s, y - 18 * s], [x - 15 * s, y - 34 * s], [x - 3 * s, y - 43 * s], [x + 4 * s, y - 36 * s], [x - 5 * s, y - 24 * s]], c); };
  const fir = (x, y, s, c, d) => { for (const [t, wd] of [[0, 14], [15, 11], [28, 8]]) { flat([[x - wd * s, y - t * s, 1], [x, y - (t + 26) * s, 1], [x + wd * s, y - t * s, 1]], d); flat([[x - wd * s, y - t * s, 1], [x, y - (t + 26) * s, 1], [x - 1 * s, y - t * s, 1]], c); } };
  tree(44, 666, 0.9, '#3f8a6e', '#2a6a5c'); tree(88, 662, 0.7, '#3f8a6e', '#2a6a5c'); fir(150, 650, 0.7, '#3a7a6c', '#245a52'); fir(388, 650, 0.9, '#3a7a6c', '#245a52'); tree(414, 648, 0.8, '#3f8a6e', '#2a6a5c');
  fir(26, 744, 1.5, '#2c6a5c', '#174842'); tree(80, 730, 1.15, '#2f7a60', '#1b5a4c'); tree(382, 736, 1.6, '#2f7a60', '#1b5a4c'); fir(428, 750, 1.5, '#2c6a5c', '#174842');
  const lantern = (x, y, s) => { g.strokeStyle = '#1a1838'; g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(x, y + 18 * s); g.lineTo(x, y - 6 * s); g.stroke(); glow(x, y - 9 * s, 26 * s, '#ffc25a', 0.55); flat([[x - 3 * s, y - 5 * s, 1], [x - 3.6 * s, y - 12 * s, 1], [x + 3.6 * s, y - 12 * s, 1], [x + 3 * s, y - 5 * s, 1]], '#ffe29a'); flat([[x - 5 * s, y - 12 * s, 1], [x, y - 17 * s, 1], [x + 5 * s, y - 12 * s, 1]], '#1a1838'); };
  lantern(226, 708, 0.6); lantern(340, 668, 0.45); lantern(112, 742, 0.85); lantern(296, 780, 1.1); lantern(158, 816, 1.2);
  const qq = P.rng(9); for (let i = 0; i < 26; i++) { const x = qq() * 412, y = 660 + qq() * 150; glow(x, y, 6, '#ffef8a', 0.7); g.fillStyle = '#fff6b8'; g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); }
  // the dark bank the Begin button sits on
  const bank = g.createLinearGradient(0, 770, 0, 915); bank.addColorStop(0, '#123a3e'); bank.addColorStop(1, '#0c1626'); flat([[-40, 806], [70, 776], [150, 792], [240, 834], [330, 812], [452, 782], [452, 960], [-40, 960]], '#12383c'); g.fillStyle = bank; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(-10, 800); g.bezierCurveTo(90, 770, 150, 790, 240, 834); g.bezierCurveTo(300, 820, 360, 800, 422, 782); g.lineTo(422, 915); g.lineTo(-10, 915); g.closePath(); g.fill(); g.globalAlpha = 1;
  g.lineWidth = 1.1; g.lineCap = 'round'; for (let i = 0; i < 90; i++) { const x = qq() * 412, y = 800 + qq() * 110, h = 4 + qq() * 7; g.strokeStyle = qq() < 0.5 ? '#1f5a50' : '#2a6a5c'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 1, y - h * 0.6, x + (qq() - 0.5) * 6, y - h); g.stroke(); }
  return cv;
}
(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const W = wordmark(), I512 = icon(512), I192 = icon(192), B = backdrop();
  P.save(W, path.join(OUT, 'wordmark.png')); P.save(I512, path.join(OUT, 'pwa-512x512.png')); P.save(I192, path.join(OUT, 'pwa-192x192.png')); fs.writeFileSync(path.join(OUT, 'character_backdrop.jpg'), B.toBuffer('image/jpeg', 88));
  // the judging picture: the screen at phone size with plain stand-ins for its text and card, the mark on dark and light, the icon at its sizes and in a circle
  const cv = P.createCanvas(1240, 915), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.fillStyle = '#1c1a22'; g.fillRect(0, 0, 1240, 915); g.drawImage(B, 0, 0, 412, 915);
  const mw = 210, mh = mw * W.height / W.width; g.drawImage(W, 206 - mw / 2, 66 - mh / 2 - 4, mw, mh); P.label(g, 'Your name', 56, 148, 15, '#cfd4e4'); g.fillStyle = '#121521'; g.beginPath(); P.rr(g, 56, 158, 300, 44, 8); g.fill(); P.label(g, 'Your class, for now.', 206, 238, 15, '#cfd4e4', { align: 'center' }); g.fillStyle = '#e8d6ae'; g.beginPath(); P.rr(g, 36, 252, 340, 104, 12); g.fill(); P.label(g, 'Knight (a plain stand-in for the card)', 56, 280, 15, '#2a2030'); g.fillStyle = '#e8a53a'; g.beginPath(); P.rr(g, 96, 779, 220, 66, 14); g.fill(); P.label(g, 'Begin', 206, 818, 24, '#2a2030', { align: 'center' });
  const px = 440; g.fillStyle = '#8fd164'; g.fillRect(px, 20, 780, 220); g.drawImage(W, px + 20, 40, 350, 350 * W.height / W.width); g.fillStyle = '#f4ead2'; g.fillRect(px + 390, 20, 390, 220); g.drawImage(W, px + 410, 40, 350, 350 * W.height / W.width); P.label(g, 'The mark at 150, 90 wide:', px, 268, 14, '#f0e8d8'); g.fillStyle = '#20245a'; g.fillRect(px, 280, 300, 90); g.drawImage(W, px + 16, 296, 150, 150 * W.height / W.width); g.drawImage(W, px + 186, 304, 90, 90 * W.height / W.width);
  P.label(g, 'The icon at 192, 96, 48, and masked to a circle of 80 percent:', px, 410, 14, '#f0e8d8'); g.drawImage(I192, px, 424, 192, 192); g.drawImage(I512, px + 208, 424, 96, 96); g.drawImage(I512, px + 208, 532, 48, 48); g.save(); g.beginPath(); g.arc(px + 450, 520, 96, 0, 7); g.clip(); g.drawImage(I512, px + 450 - 120, 520 - 120, 240, 240); g.restore(); g.save(); g.beginPath(); P.rr(g, px + 580, 424, 192, 192, 44); g.clip(); g.drawImage(I192, px + 580, 424, 192, 192); g.restore();
  P.label(g, 'The backdrop alone, with four class cards it would be covered from y 252 to about 700.', px, 650, 14, '#f0e8d8'); g.drawImage(B, 0, 0, 824, 1830, px, 664, 113, 251); g.drawImage(B, 0, 700, 824, 840, px + 130, 664, 548, 250 * 1);
  fs.writeFileSync(path.join(OUT, 'preview.jpg'), cv.toBuffer('image/jpeg', 90));
  fs.copyFileSync(path.join(__dirname, 'brand_notes.md'), path.join(OUT, 'NOTES.md')); for (const f of fs.readdirSync(OUT)) console.log(f, Math.round(fs.statSync(path.join(OUT, f)).size / 1024) + ' KB'); console.log('wordmark', W.width, W.height);
})();
