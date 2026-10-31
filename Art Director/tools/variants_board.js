// variants_board.js: the three Warrior variants on one board for Robin (Perry, AD, 2026-10-31): per variant a column with
// the rest, the walk, the strike and the hit at 2x, the rest at phone size beside the Turnip Grump on the fight ground, and a
// caption. Reads each variant's packed atlas (tools/pack.js) so what is shown is what the game would get.
//   node tools/variants_board.js <out.png> A=work/hero_vol/A/sheets/warrior.json "caption A" B=... "caption B" C=... "caption C"
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const out = a[0]; const items = [];
for (let i = 1; i < a.length; i += 2) { const [name, file] = a[i].split('='); items.push({ name, file: path.resolve(ROOT, file), caption: a[i + 1] || '' }); }
const KEY = [['stand', 0], ['move', 3], ['attack1', 3], ['hit1', 0]];
(async () => {
  for (const it of items) { it.J = JSON.parse(fs.readFileSync(it.file, 'utf8')); it.im = await P.loadImage(path.join(path.dirname(it.file), it.J.meta.image)); }
  const scene = await P.loadImage(path.resolve(ROOT, 'work/slice/slice.png'));
  const COL = 720, W = 40 + items.length * COL, H = 1000, cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.fillStyle = '#8fd84a'; g.fillRect(0, 0, W, H); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = 'rgba(248,236,198,0.95)'; g.fillRect(0, 0, W, 50); P.label(g, 'The Warrior as volumes, three looks to pick from (Perry, AD, 2026-10-31)', 16, 26, 20, P.INK);
  const draw = (it, act, i, x, y, s) => { const F = it.J.actions[act].frames[i], fr = it.J.frames[F.name].frame; g.drawImage(it.im, fr.x, fr.y, fr.w, fr.h, x - F.origin.x * s, y - F.origin.y * s, fr.w * s, fr.h * s); };
  items.forEach((it, k) => {
    const x0 = 20 + k * COL;
    P.tag(g, it.name, x0 + 8, 70, 22);
    g.strokeStyle = 'rgba(43,35,32,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, 400); g.lineTo(x0 + COL - 10, 400); g.stroke();
    KEY.forEach(([act, i], n) => draw(it, act, i, x0 + 90 + n * 160, 400, 0.8));                                   // the four poses at 1.6x
    P.tag(g, 'rest, walk, strike, hit at 1.6x', x0 + 8, 420, 12);
    // the rest at phone size on the fight ground beside the turnip (a cut of the laid screen, halved)
    g.save(); g.beginPath(); g.rect(x0, 450, COL - 10, 330); g.clip(); g.drawImage(scene, 120, 820, 824, 660, x0, 450, 412, 330); g.restore();
    g.save(); g.beginPath(); g.rect(x0, 450, COL - 10, 330); g.clip(); draw(it, 'stand', 0, x0 + 150, 450 + (1270 - 820) / 2, 0.5); g.restore();
    P.tag(g, 'at phone size, beside the Turnip Grump', x0 + 8, 470, 12);
    g.save(); g.font = 'bold 15px Arial'; g.fillStyle = P.INK; const words = it.caption.split(' '); let line = '', ly = 810; for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > COL - 40) { g.fillText(line, x0 + 10, ly); line = wd; ly += 20; } else line = t; } g.fillText(line, x0 + 10, ly); g.restore();
  });
  P.save(cv, path.resolve(ROOT, out)); console.log('wrote', out);
})();
