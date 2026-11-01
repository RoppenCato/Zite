// still.js: the three sets standing, drawn straight from the rig (no animation): at the fight's 150 px, on the board at 44,
// three times for the construction, and the faces at six times (Mitch, AD, 2026-11-01).   node tools/hybrid/still.js [name]
const P = require('../paint.js'); const path = require('path'); const fs = require('fs'); const R = require('./rig.js');
const WORK = path.resolve(__dirname, '../../work/hybrid'); const NAME = process.argv[2] || 'still';
const SETS = ['tunic', 'plate', 'mage'], NAMES = { tunic: '1. The Warrior', plate: '2. In plate and helmet', mage: '3. In the mage outfit' };
(async () => {
  await R.loadMasters(); const J = R.pose({});
  const draw = (g, s, x, y, h) => { const k = h / 100; g.save(); g.translate(x, y); g.scale(k, k); R.SETDEF[s].draw(g, J); g.restore(); };
  const S = 2, W = 900, H = 1180, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, W, H); P.label(g, 'The Warrior in one three-quarter view, facing screen-right: three outfits, standing', W / 2, 26, 19, '#f0e8d8', { align: 'center' });
  const strip = (x, y, w, h, gk = 0.74) => { g.fillStyle = P.lin(g, 0, y, 0, y + h, [[0, '#62b8f0'], [1, '#cfe9fb']]); g.fillRect(x, y, w, h * gk); g.fillStyle = '#86d458'; g.fillRect(x, y + h * gk - 5, w, 5); g.fillStyle = '#5f9a3e'; g.fillRect(x, y + h * gk, w, h * (1 - gk)); };
  const shadow = (x, y, r) => { g.fillStyle = 'rgba(20,30,60,0.25)'; g.beginPath(); g.ellipse(x, y, r, r * 0.26, 0, 0, 7); g.fill(); };
  P.label(g, "At the fight's size (150 px)", 24, 56, 13, '#b8b0a4', { weight: 'normal' });
  strip(24, 66, 852, 250, 0.8); const gy = 66 + 250 * 0.8;
  SETS.forEach((s, i) => { const x = 160 + i * 290; shadow(x, gy + 4, 44); draw(g, s, x, gy + 2, 150); P.label(g, NAMES[s], x, gy + 32, 12, '#f0e8d8', { align: 'center', stroke: '#2a2436', strokeW: 3 }); });
  P.label(g, 'On the board (44 px)', 24, 340, 13, '#b8b0a4', { weight: 'normal' });
  g.fillStyle = '#7ed957'; g.fillRect(24, 350, 852, 80); g.fillStyle = '#f0d68f'; g.fillRect(24, 400, 852, 18);
  SETS.forEach((s, i) => { const x = 300 + i * 150; shadow(x, 412, 13); draw(g, s, x, 410, 44); });
  P.label(g, 'Three times, with the construction in red: the head, its centre line and eye line; the shoulder, hip and torso lines; the limbs; the ground and the facing', 24, 456, 13, '#b8b0a4', { weight: 'normal' });
  g.fillStyle = '#e9e2d4'; g.fillRect(24, 466, 852, 380); g.fillStyle = '#9ccf6a'; g.fillRect(24, 816, 852, 30);
  SETS.forEach((s, i) => { const x = 160 + i * 290; shadow(x, 818, 110); draw(g, s, x, 814, 300); g.save(); g.translate(x, 814); g.scale(3, 3); R.overlay(g, J); g.restore(); });
  P.label(g, 'The faces, six times', 24, 870, 13, '#b8b0a4', { weight: 'normal' });
  g.fillStyle = '#e9e2d4'; g.fillRect(24, 880, 852, 280);
  SETS.forEach((s, i) => { const x = 160 + i * 290; g.save(); g.beginPath(); g.rect(x - 140, 880, 280, 280); g.clip(); draw(g, s, x - 20, 880 + 280 + 6 * 55, 600); g.restore(); });
  P.label(g, 'Mitch, AD, 2026-11-01.', W / 2, H - 8, 11, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.save(cv, path.join(WORK, NAME + '.png')); fs.writeFileSync(path.join(WORK, NAME + '.jpg'), cv.toBuffer('image/jpeg', 90)); console.log('wrote', NAME);
})();
