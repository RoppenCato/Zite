// equip_test.js: the standardised equipment test (Mitch, AD, 2026-11-01): eight outfits on the same character in the
// neutral pose at 150 and 44 px, and a diagnostic row of every held item in its local frame with its grip point and axis,
// plus the figure with the attachment point marked.   node tools/hybrid/equip_test.js
const P = require('../paint.js'); const path = require('path'); const fs = require('fs'); const R = require('./rig.js');
const WORK = path.resolve(__dirname, '../../work/hybrid');
const ROW = [['1. tunic and sword', 'tunic'], ['2. sword and shield', 'shield'], ['3. one-handed axe', 'axe'], ['4. bow', 'bow'], ['5. staff', 'staff'], ['6. full plate and helmet', 'plate'], ['7. mixed pieces', 'mixed'], ['8. robe, another weapon', 'robebow']];
(async () => {
  await R.loadMasters();
  const S = 2, W = 1100, H = 1120, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, W, H); P.label(g, 'The equipment test: eight outfits on the one character, from the slot system', W / 2, 26, 18, '#f0e8d8', { align: 'center' });
  const strip = (x, y, w, h, gk) => { g.fillStyle = P.lin(g, 0, y, 0, y + h, [[0, '#62b8f0'], [1, '#cfe9fb']]); g.fillRect(x, y, w, h * gk); g.fillStyle = '#86d458'; g.fillRect(x, y + h * gk - 4, w, 4); g.fillStyle = '#5f9a3e'; g.fillRect(x, y + h * gk, w, h * (1 - gk)); };
  const shadow = (x, y, r) => { g.fillStyle = 'rgba(20,30,60,0.25)'; g.beginPath(); g.ellipse(x, y, r, r * 0.26, 0, 0, 7); g.fill(); };
  const draw = (set, x, y, h) => { const O = R.OUTFITS[set], J = R.restPose(O); const k = h / 100; g.save(); g.translate(x, y); g.scale(k, k); R.drawOutfit(g, J, O); g.restore(); return J; };
  // 1. at 150 px, two rows of four
  P.label(g, "At the fight's size (150 px)", 24, 54, 13, '#b8b0a4', { weight: 'normal' });
  for (let r = 0; r < 2; r++) { const y0 = 64 + r * 240; strip(24, y0, 1052, 232, 0.82); const gy = y0 + 232 * 0.82;
    for (let i = 0; i < 4; i++) { const [name, set] = ROW[r * 4 + i], x = 24 + 131 + i * 263; shadow(x, gy + 3, 42); draw(set, x, gy + 2, 150); P.label(g, name, x, gy + 26, 12, '#f0e8d8', { align: 'center', stroke: '#2a2436', strokeW: 3 }); } }
  // 2. on the board at 44 px
  P.label(g, 'On the board (44 px)', 24, 558, 13, '#b8b0a4', { weight: 'normal' });
  g.fillStyle = '#7ed957'; g.fillRect(24, 568, 1052, 76); g.fillStyle = '#f0d68f'; g.fillRect(24, 618, 1052, 16);
  ROW.forEach(([name, set], i) => { const x = 90 + i * 131; shadow(x, 629, 13); draw(set, x, 627, 44); });
  // 3. the diagnostic row: each held item in its local frame, the grip point (the red dot) and the length axis; then the figure with the hand marked and the axis drawn through it
  P.label(g, 'The attachments: each weapon in its own frame, the grip point (red) at the hand, its length along the axis; and the same axis on the figure', 24, 672, 13, '#b8b0a4', { weight: 'normal' });
  g.fillStyle = '#e9e2d4'; g.fillRect(24, 682, 1052, 420);
  [['sword', 'the fist closes on the handle; carried down and forward', 'tunic'], ['axe', 'the fist on the haft; carried down and forward, the edge turned down and back', 'axe'], ['bow', 'the off-hand holds the belly; the limbs bulge away, the string toward him', 'bow'], ['staff', 'the fist near the middle; upright beside him, the top clear of the face', 'staff']].forEach(([name, note, set], i) => {
    const x = 24 + 60 + i * 263; g.save(); g.translate(x, 812); g.scale(1.8, 1.8); R.diagnostic(g, name); g.restore();
    P.label(g, name, x + 40, 700, 13, '#2a2436', { align: 'center' });
    const fx = x + 150, fy = 1066, J = draw(set, fx, fy, 170); const it = R.ITEMS[name], hd = it.held === 'main' ? J.hF : J.hB, d = it.held === 'main' ? J.dir : (J.dirOff || it.rest), k = 1.7;
    g.save(); g.translate(fx, fy); g.scale(k, k); g.strokeStyle = '#ff2a4a'; g.fillStyle = '#ff2a4a'; g.lineWidth = 0.8; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(hd[0] - d[0] * 14, hd[1] - d[1] * 14); g.lineTo(hd[0] + d[0] * 60, hd[1] + d[1] * 60); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(hd[0], hd[1], 2.4, 0, 7); g.fill(); g.lineWidth = 1; g.strokeStyle = '#fff'; g.stroke(); g.restore();
    note.split('; ').forEach((t, j) => P.label(g, t, x + 70, 1076 + j * 13, 10, '#5a5048', { align: 'center', weight: 'normal' }));
  });
  P.label(g, 'Every item declares its slot, its anchor, its grip point and length axis, its rest pose for the hand that holds it, what it covers, and its layer. Mitch, AD, 2026-11-01.', W / 2, H - 8, 11, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.save(cv, path.join(WORK, 'equip.png')); fs.writeFileSync(path.join(WORK, 'equip.jpg'), cv.toBuffer('image/jpeg', 90)); console.log('wrote equip');
})();
