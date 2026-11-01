// approach2_page.js: the page for approach 2 (the one-skin Blender figures) in the same layout as approach 1's, from the
// renders in work/approaches/blender (Mitch, AD, 2026-11-01).   node tools/approach2_page.js
const P = require('./paint.js'); const path = require('path'); const fs = require('fs'); const { page } = require('./ink.js');
const DIR = path.resolve(__dirname, '..', 'work/approaches');
(async () => {
  const load = async n => { const im = await P.loadImage(path.join(DIR, 'blender', n + '.png')); const cv = P.createCanvas(im.width, im.height); cv.getContext('2d').drawImage(im, 0, 0); const b = P.bounds(cv); return { im, b }; };
  const W = await load('warrior'), S = await load('slime');
  // draw a render with its feet at (x, y) and its painted height scaled to h
  const draw = R => (g, x, y, h) => { const k = h / R.b.h; g.drawImage(R.im, R.b.x, R.b.y, R.b.w, R.b.h, x - R.b.w * k / 2, y - h, R.b.w * k, h); };
  const cv = page('Approach 2: one-skin figures in Blender, flat two-tone, a tapered Freestyle line', draw(W), draw(S), 'A stick skeleton with a radius at every joint sculpted into one surface; two chosen tones; the line thick-thin like a nib. Mitch, AD, 2026-11-01.');
  P.save(cv, path.join(DIR, '2-blender.png')); fs.writeFileSync(path.join(DIR, '2-blender.jpg'), cv.toBuffer('image/jpeg', 88)); console.log('wrote 2-blender');
})();
