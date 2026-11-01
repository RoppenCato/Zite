// combos.js: the slots swapped one at a time on the same figure, standing, drawn straight from the rig (Mitch, AD,
// 2026-11-01): the proof that any piece changes without the rest being rebuilt.   node tools/hybrid/combos.js
const P = require('../paint.js'); const path = require('path'); const fs = require('fs'); const R = require('./rig.js');
const WORK = path.resolve(__dirname, '../../work/hybrid');
const T = R.OUTFITS.tunic;
const COMBOS = [
  ['the base', T],
  ['+ helmet', { ...T, head: 'helmet' }],
  ['+ breastplate', { ...T, torso: 'plate' }],
  ['+ gauntlets', { ...T, hands: 'gauntlet' }],
  ['+ plate boots', { ...T, boots: 'plate' }],
  ['+ shield', { ...T, offhand: 'shield' }],
  ['+ cape', { ...T, back: 'cape' }],
  ['axe', { ...T, weapon: 'axe' }],
  ['bow', { ...T, weapon: 'bow' }],
  ['staff', { ...T, weapon: 'staff' }],
  ['hat and plate', { ...T, head: 'hat', torso: 'plate', hands: 'gauntlet' }],
  ['robe and helmet', { ...T, head: 'helmet', torso: 'robe', boots: 'shoe', weapon: 'axe' }],
  ['full plate, bow', { ...R.OUTFITS.plate, weapon: 'bow', offhand: null }],
  ['full plate, staff', { ...R.OUTFITS.plate, weapon: 'staff' }],
  ['mage, shield', { ...R.OUTFITS.mage, offhand: 'shield', weapon: 'sword' }],
];
(async () => {
  await R.loadMasters();
  const S = 2, cols = 5, cw = 170, ch = 200, W = 24 * 2 + cols * cw, rows = Math.ceil(COMBOS.length / cols), H = 60 + rows * ch + 30;
  const cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, W, H); P.label(g, 'One figure, the slots swapped one at a time: head, torso, hands, boots, off-hand, back, weapon', W / 2, 26, 17, '#f0e8d8', { align: 'center' });
  COMBOS.forEach(([name, O], i) => {
    const x = 24 + (i % cols) * cw, y = 50 + Math.floor(i / cols) * ch; g.fillStyle = '#e9e2d4'; g.fillRect(x + 4, y, cw - 8, ch - 8); g.fillStyle = '#9ccf6a'; g.fillRect(x + 4, y + ch - 36, cw - 8, 28);
    const base = { ...R.BASE }; const Wp = R.WEAPONS[O.weapon]; if (Wp && Wp.rest) base.dir = Wp.rest; if (O.weapon === 'staff') Object.assign(base, { elF: [-14, -47], hF: [-13, -40] }); if (O.weapon === 'bow') Object.assign(base, { hF: [-2, -40], elF: [-12, -47] }); if (O.weapon === 'axe') Object.assign(base, { hF: [-4, -42], elF: [-13, -48] });
    const J = R.pose({}, base); g.fillStyle = 'rgba(20,30,60,0.22)'; g.beginPath(); g.ellipse(x + cw / 2, y + ch - 34, 40, 10, 0, 0, 7); g.fill();
    g.save(); g.translate(x + cw / 2, y + ch - 36); g.scale(1.4, 1.4); R.drawOutfit(g, J, O); g.restore();
    P.label(g, name, x + cw / 2, y + ch - 20, 12, '#2a2436', { align: 'center' });
  });
  P.label(g, 'Drawn from the rig at 140 px; every figure is the same skeleton and pose, only the named slot differs. Mitch, AD, 2026-11-01.', W / 2, H - 10, 11, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.save(cv, path.join(WORK, 'combos.png')); fs.writeFileSync(path.join(WORK, 'combos.jpg'), cv.toBuffer('image/jpeg', 88)); console.log('wrote combos');
})();
