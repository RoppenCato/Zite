// sheet.js: a contact sheet of a monster's render (Perry, AD, 2026-10-31; after the Survival game's): a row per action, a
// column per frame, each frame cut round the origin so the feet line up, the origin marked, on the meadow's green. For a
// look at every frame at once; the judgement is made at phone size in compare.js, never from this sheet.
//   node tools/sheet.js <render dir> <out.png> [crop px at 2x, default the frame]
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
(async () => {
  const [dir, out, cropA] = process.argv.slice(2);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), FS = meta.size * meta.px, acts = Object.keys(meta.actions);
  const first = await P.loadImage(path.join(dir, meta.actions[acts[0]].frames[0].file)), crop = +cropA || Math.max(first.width, first.height), K = Math.min(0.65, 260 / crop), cell = Math.round(crop * K), maxF = Math.max(...acts.map(a => meta.actions[a].frames.length));   // the window takes the frame's larger side, so a wide fall is not cut
  const cx = meta.origin[0], cy = meta.origin[1] - crop * 0.30;   // the window round the origin: the feet at four fifths of the cell, room above for a hop
  const cv = P.createCanvas(maxF * cell + 100, acts.length * cell), c = cv.getContext('2d'); c.fillStyle = '#8fd84a'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  let row = 0;
  for (const a of acts) {
    const A = meta.actions[a], y0 = row * cell, yo = y0 + (meta.origin[1] - (cy - crop / 2)) * K;
    c.strokeStyle = 'rgba(43,35,32,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(100, yo); c.lineTo(cv.width, yo); c.stroke();
    for (let f = 0; f < A.frames.length; f++) {
      const im = await P.loadImage(path.join(dir, A.frames[f].file)); const x0 = 100 + f * cell;
      c.drawImage(im, cx - crop / 2, cy - crop / 2, crop, crop, x0, y0, cell, cell);
    }
    P.tag(c, `${a}  ${A.frames.length} x ${A.delay} ms`, 6, y0 + 14, 12); row++;
  }
  P.save(cv, out); console.log('wrote', out, cv.width + 'x' + cv.height, '(' + acts.length + ' actions)');
})();
