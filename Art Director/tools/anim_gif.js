// anim_gif.js: a packed monster moving at its real delays (Perry, AD, 2026-10-31): every action in turn, on a piece of the
// meadow's fight screen, shown at phone size (the 2x frames halved), fades applied from a0 and a1. Writes a GIF through
// tools/gif.py (PIL).
//   node tools/anim_gif.js <atlas.json> <out.gif> [--bg work/meadow/fight.png] [--at 590,1270] [--size 560] [--actions stand,move,attack1,hit1,die1] [--loops 2]
const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process'); const P = require('./paint.js');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const [atlas, out] = a; const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
(async () => {
  const J = JSON.parse(fs.readFileSync(path.resolve(ROOT, atlas), 'utf8')), dir = path.dirname(path.resolve(ROOT, atlas));
  const bgFile = path.resolve(ROOT, opt('bg') || 'work/meadow/fight.png'), [ax, ay] = (opt('at') || '590,1270').split(',').map(Number), SZ = +(opt('size') || 560), loops = +(opt('loops') || 2);
  const bg = await P.loadImage(bgFile), cv = P.createCanvas(SZ, SZ), g = cv.getContext('2d'); const x0 = Math.round(ax - SZ / 2), y0 = Math.round(ay - SZ * 0.75);
  g.drawImage(bg, x0, y0, SZ, SZ, 0, 0, SZ, SZ); const tmp = path.dirname(path.resolve(ROOT, out)), bgCrop = path.join(tmp, '_gifbg.png'); P.save(cv, bgCrop);   // the scratch files beside the gif, not among the sheets
  const acts = (opt('actions') || 'stand,move,attack1,hit1,die1').split(',').filter(k => J.actions[k]); const frames = [];
  for (const act of acts) {
    const A = J.actions[act], n = A.loop ? loops : 1;
    for (let k = 0; k < n; k++) for (const F of A.frames) frames.push({ delay: F.delay, text: act, layers: [{ file: path.join(dir, 'frames', F.name + '.png'), x: ax - x0 - F.origin.x, y: ay - y0 - F.origin.y, alpha: F.a0 !== undefined ? Math.round((F.a0 + F.a1) / 2) : 255 }] });
  }
  const spec = { w: SZ, h: SZ, bg: bgCrop, scale: 0.5, frames }; const specFile = path.join(tmp, '_gif.json'); fs.writeFileSync(specFile, JSON.stringify(spec));
  const r = spawnSync('python', [path.join(__dirname, 'gif.py'), specFile, path.resolve(ROOT, out)], { stdio: 'inherit' }); if (r.status) process.exit(r.status);
})();
