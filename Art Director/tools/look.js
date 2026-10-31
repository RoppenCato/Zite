// look.js: a quick judging picture (Perry, AD, 2026-10-31): pictures stood on a ground line beside our player, at the real
// size (2x files shown at 1x CSS, like the phone) and at a zoom, on a flat colour or on a background picture.
//   node tools/look.js <out.png> [--bg #8fd84a|file.png] [--zoom 2] [--origin feet|centre] <pic.png> [<pic.png> ...]
// Each picture's origin is its bottom centre (feet) unless --origin centre. Files at 2x are halved on the way in (--px 2).
const P = require('./paint.js'); const { player } = require('./player.js'); const fs = require('fs'); const path = require('path');
(async () => {
  const args = process.argv.slice(2); const out = args.shift(); const opt = { bg: '#8fd84a', zoom: '2', origin: 'feet', px: '2' }; const pics = [];
  for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) { opt[args[i].slice(2)] = args[++i]; } else pics.push(args[i]); }
  const PX = +opt.px, Z = +opt.zoom, ims = []; for (const p of pics) ims.push(await P.loadImage(p));
  const gap = 24, rowH = Math.max(140, ...ims.map(i => i.height / PX)) + 60;
  const W = Math.max(412, 80 + ims.reduce((a, i) => a + i.width / PX + gap, 0) + 60), H = rowH + rowH * Z + 20;
  const cv = P.createCanvas(Math.round(W * 2), Math.round(H * 2)), g = cv.getContext('2d'); g.scale(2, 2); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  if (opt.bg.endsWith('.png')) { const b = await P.loadImage(opt.bg); g.drawImage(b, 0, 0, W, H); } else { g.fillStyle = opt.bg; g.fillRect(0, 0, W, H); }
  const row = (y, s) => {
    g.save(); g.translate(0, y); g.scale(s, s);
    g.strokeStyle = 'rgba(43,35,32,0.35)'; g.lineWidth = 1 / s; g.beginPath(); g.moveTo(0, 0); g.lineTo(W / s, 0); g.stroke();
    player(g, 40, 0, 1); let x = 90;
    for (const im of ims) { const w = im.width / PX, h = im.height / PX; const ox = x + w / 2, oy = opt.origin === 'centre' ? -h / 2 : 0; g.drawImage(im, ox - w / 2, oy - h / 2 - (opt.origin === 'centre' ? 0 : h / 2), w, h); x += w + gap; }
    g.restore();
  };
  row(rowH - 30, 1); P.tag(g, 'at phone size (1x CSS)', 8, 14); row(rowH + rowH * Z - 40, Z); P.tag(g, Z + 'x zoom', 8, rowH + 14);
  P.save(cv, out); console.log('wrote', out);
})();
