// cut_sheet.js: Robin's own version of the Warrior sheet (2026-11-01, sent as a picture) cut back into frames the game can use.
// The picture keeps my sheet's grid (one row per action, 280 px cells at half size, the feet line 155 px down each row, the
// origin 150 px into each cell), scaled to 2000 by 754. Each cell is cut, scaled to the atlas's 2x size, the green keyed out
// by hue, the row labels and ground lines removed, and written as <act>_<nn>.png with meta.json in the studio's form.
//   node tools/cut_sheet.js <sheet.png> <out dir>   (then tools/pack.js as usual)
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const [src, OUT] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const ACTS = { stand: [300, 300, 300, 300], move: [110, 110, 110, 110, 110, 110], attack1: [180, 120, 60, 60, 160, 120, 100], hit1: [250, 200, 150], die1: [90, 90, 90, 90, 90, 90, 90, 90] };
const FADE = { die1: { 6: [255, 140], 7: [140, 0] } };
(async () => {
  const im = await P.loadImage(src), sx = im.width / 2250, sy = im.height / 850;
  const cellW = 280 * sx, rowH = 170 * sy, ox = 10 * sx, originX = 150 * sx, originY = 155 * sy, Z = 200 / (100 * sy);   // Z: his half-size figure up to the atlas's 2x
  const W = Math.round(cellW * Z), H = Math.round(rowH * Z), meta = { size: 100, px: 2, origin: [Math.round(originX * Z), Math.round(originY * Z)], actions: {} };
  const rows = Object.keys(ACTS); let ri = 0;
  for (const act of rows) {
    meta.actions[act] = { delay: ACTS[act][0], frames: [] };
    for (let i = 0; i < ACTS[act].length; i++) {
      const cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(im, ox + i * cellW, ri * rowH, cellW, rowH, 0, 0, W, H);
      const id = g.getImageData(0, 0, W, H), d = id.data;
      for (let p = 0; p < d.length; p += 4) {   // key the green by hue; the labels and the ground line are not green but sit where no figure is
        const r = d[p] / 255, gg = d[p + 1] / 255, b = d[p + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
        let hue = 0; if (mx !== mn) { if (mx === r) hue = ((gg - b) / (mx - mn)) % 6; else if (mx === gg) hue = (b - r) / (mx - mn) + 2; else hue = (r - gg) / (mx - mn) + 4; hue *= 60; if (hue < 0) hue += 360; }
        const green = hue > 62 && hue < 150 && sat > 0.28 && gg > 0.45;
        if (green) d[p + 3] = 0;
        else if (hue > 55 && hue < 160 && sat > 0.15) d[p + 3] = Math.round(d[p + 3] * Math.max(0, Math.min(1, (0.28 - sat) / 0.13 + 1)) * 0.6);   // a soft edge where the figure meets the green
      }
      g.putImageData(id, 0, 0);
      // the row label at the top left of the first column, the ground line's grey across the bottom of the row: wiped where no figure can be
      if (i === 0) g.clearRect(0, 0, 46 * Z, 20 * Z);
      const gy = Math.round(originY * Z); for (let y = gy - 2; y <= gy + 3; y++) for (let x = 0; x < W; x++) { const q = g.getImageData(x, y, 1, 1).data; if (q[3] && q[3] < 140) g.clearRect(x, y, 1, 1); }
      const file = `${act}_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(OUT, file)); const b = P.bounds(cv, 40) || { x: 0, y: 0, w: 1, h: 1 };
      const fr = { file, delay: ACTS[act][i], lt: [b.x, b.y], rb: [b.x + b.w, b.y + b.h], head: [meta.origin[0], b.y] };
      if (FADE[act] && FADE[act][i]) { fr.a0 = FADE[act][i][0]; fr.a1 = FADE[act][i][1]; }
      meta.actions[act].frames.push(fr);
    }
    ri++;
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1)); console.log('cut', rows.map(a => `${a} ${ACTS[a].length}`).join(', '), 'into', OUT, 'frame', W, H, 'origin', meta.origin);
})();
