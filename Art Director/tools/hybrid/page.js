// page.js: the still of the hybrid test, drawn from the PACKED atlases (what the game would draw), at the fight's size and
// the board's (Mitch, AD, 2026-11-01).   node tools/hybrid/page.js  -> work/hybrid/hybrid.png / .jpg
const P = require('../paint.js'); const path = require('path'); const fs = require('fs');
const WORK = path.resolve(__dirname, '../../work/hybrid'); const SETS = ['tunic', 'plate', 'mage'], NAMES = { tunic: '1. Tunic and sword', plate: '2. Plate, helmet, sword and shield', mage: '3. Mage robe and staff' };
(async () => {
  const A = {};
  for (const s of SETS) { const J = JSON.parse(fs.readFileSync(path.join(WORK, 'out', s, `hero_${s}.json`), 'utf8')); A[s] = { J, im: await P.loadImage(path.join(WORK, 'out', s, J.meta.image)) }; }
  // a frame drawn with its feet at (x, y), facing right (the files face left: flipped back), at k of the file's size
  function draw(g, s, act, i, x, y, k) { const { J, im } = A[s], F = J.actions[act].frames[i], fr = J.frames[F.name].frame; g.save(); g.translate(x, y); g.scale(-k, k); g.drawImage(im, fr.x, fr.y, fr.w, fr.h, -F.origin.x, -F.origin.y, fr.w, fr.h); g.restore(); }
  const S = 2, W = 900, H = 1330, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, W, H); P.label(g, 'The hybrid hero: one skeleton, three equipment sets, from the packed atlases', W / 2, 26, 19, '#f0e8d8', { align: 'center' });
  const strip = (x, y, w, h) => { g.fillStyle = P.lin(g, 0, y, 0, y + h, [[0, '#62b8f0'], [1, '#cfe9fb']]); g.fillRect(x, y, w, h * 0.74); g.fillStyle = '#86d458'; g.fillRect(x, y + h * 0.74 - 5, w, 5); g.fillStyle = '#5f9a3e'; g.fillRect(x, y + h * 0.74, w, h * 0.26); };
  const shadow = (x, y, r) => { g.fillStyle = 'rgba(20,30,60,0.25)'; g.beginPath(); g.ellipse(x, y, r, r * 0.26, 0, 0, 7); g.fill(); };
  // 1. the fight's size: the three sets standing
  P.label(g, "At the fight's size (150 px): standing", 24, 56, 13, '#b8b0a4', { weight: 'normal' });
  strip(24, 66, 852, 230); const gy = 66 + 230 * 0.74;
  SETS.forEach((s, i) => { const x = 160 + i * 290; shadow(x, gy + 4, 44); draw(g, s, 'stand', 0, x, gy + 2, 0.5); P.label(g, NAMES[s], x, gy + 40, 12, '#f0e8d8', { align: 'center', stroke: '#2a2436', strokeW: 3 }); });
  // 2. the board's size
  P.label(g, 'On the board (44 px)', 24, 322, 13, '#b8b0a4', { weight: 'normal' });
  g.fillStyle = '#7ed957'; g.fillRect(24, 332, 852, 90); g.fillStyle = '#f0d68f'; g.fillRect(24, 390, 852, 20);
  SETS.forEach((s, i) => { const x = 120 + i * 120; shadow(x, 402, 13); draw(g, s, 'stand', 0, x, 400, 0.147); });
  [['move', 1], ['attack1', 3]].forEach(([act, f], j) => SETS.forEach((s, i) => { const x = 520 + j * 170 + i * 50; shadow(x, 402, 13); draw(g, s, act, f, x, 400, 0.147); }));
  P.label(g, 'standing', 240, 416, 10, '#2a2436', { align: 'center', weight: 'normal' }); P.label(g, 'walking', 570, 416, 10, '#2a2436', { align: 'center', weight: 'normal' }); P.label(g, 'striking or casting', 740, 416, 10, '#2a2436', { align: 'center', weight: 'normal' });
  // 3. the key poses at the fight's size: walk mid-stride, windup, strike (or pull, raise, cast)
  P.label(g, "The key poses at the fight's size: mid-stride, the windup, the strike or the cast", 24, 448, 13, '#b8b0a4', { weight: 'normal' });
  SETS.forEach((s, r) => { const y0 = 460 + r * 280; strip(24, y0, 852, 270); const fy = y0 + 270 * 0.82;
    [['move', 1, 'walk'], ['move', 4, 'walk'], ['attack1', 1, s === 'mage' ? 'raise' : 'windup'], ['attack1', 2, s === 'mage' ? 'charge' : 'top'], ['attack1', 3, s === 'mage' ? 'cast' : 'strike'], ['attack1', 4, s === 'mage' ? 'release' : 'follow']].forEach(([act, f, name], i) => { const x = 90 + i * 140; shadow(x, fy + 4, 40); draw(g, s, act, f, x, fy + 2, 0.5); P.label(g, name, x, fy + 30, 11, '#f0e8d8', { align: 'center', stroke: '#2a2436', strokeW: 3 }); });
    P.label(g, NAMES[s], 860, y0 + 16, 12, '#f0e8d8', { align: 'right' }); });
  P.label(g, 'Procedural parts (approach 1): body, legs, tunic, robe, cape, sword, hands, face, hair.', W / 2, H - 26, 11, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.label(g, 'Raster parts (approach 3, stand-ins painted here): helmet, breastplate, pauldron, gauntlet, plate boots, shield, hat, staff. Mitch, AD, 2026-11-01.', W / 2, H - 10, 11, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.save(cv, path.join(WORK, 'hybrid.png')); fs.writeFileSync(path.join(WORK, 'hybrid.jpg'), cv.toBuffer('image/jpeg', 88)); console.log('wrote hybrid page');
})();
