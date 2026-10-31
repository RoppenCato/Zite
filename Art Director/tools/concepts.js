// concepts.js: a concept board (Perry, AD, 2026-10-31): stills side by side on the meadow's green at phone size and at a
// zoom, our player at the left for scale, a caption under each. For Robin to pick from before any rig.
//   node tools/concepts.js <out.png> <title> <pic.png> "<caption>" [<pic.png> "<caption>" ...]
const P = require('./paint.js'); const { player } = require('./player.js');
(async () => {
  const [out, title, ...rest] = process.argv.slice(2); const items = []; for (let i = 0; i < rest.length; i += 2) items.push({ file: rest[i], caption: rest[i + 1] || '' });
  for (const it of items) { const im = await P.loadImage(it.file); const cv = P.createCanvas(im.width, im.height); cv.getContext('2d').drawImage(im, 0, 0); P.harden(cv, 110); it.cv = P.trim(cv, 2).cv; it.foot = [im.width / 2 - P.trim(cv, 2).x, im.height - 24 - P.trim(cv, 2).y]; }
  const COLW = 230, W = 100 + items.length * COLW, Z = 2.2, H = 60 + 170 + 40 + 170 * Z + 70;
  const cv = P.createCanvas(W * 2, Math.round(H * 2)), g = cv.getContext('2d'); g.scale(2, 2); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#8fd84a'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(248,236,198,0.9)'; g.fillRect(0, 0, W, 44); P.label(g, title, 14, 22, 18, P.INK);
  const row = (y, s, caption) => {
    g.save(); g.translate(0, y); g.scale(s, s); g.strokeStyle = 'rgba(43,35,32,0.35)'; g.lineWidth = 1 / s; g.beginPath(); g.moveTo(0, 0); g.lineTo(W / s, 0); g.stroke(); player(g, 50 / s, 0, 1);
    items.forEach((it, i) => { const x = (100 + i * COLW + COLW / 2) / s, w = it.cv.width / 2, h = it.cv.height / 2; g.drawImage(it.cv, x - it.foot[0] / 2, -it.foot[1] / 2, w, h); });
    g.restore();
    if (caption) items.forEach((it, i) => { const x = 100 + i * COLW + 10; g.save(); g.font = 'bold 13px Arial'; g.fillStyle = P.INK; const words = it.caption.split(' '); let line = '', ly = y + 18; for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > COLW - 20) { g.fillText(line, x, ly); line = wd; ly += 16; } else line = t; } g.fillText(line, x, ly); g.restore(); });
  };
  P.tag(g, 'at phone size', 8, 58); row(60 + 160, 1, false); P.tag(g, Z + 'x', 8, 60 + 190); row(60 + 170 + 40 + 170 * Z - 30, Z, true);
  P.save(cv, out); console.log('wrote', out);
})();
