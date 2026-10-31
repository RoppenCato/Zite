// A contact sheet of a folder of pictures (2026-10-13): node tools/board.js <dir> <out.jpg> [columns] [cell px]
const { createCanvas, loadImage } = require('C:/dev/SG/Game Developer/node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
(async () => {
  const [dir, out, colsA, cellA] = process.argv.slice(2), cols = +colsA || 5, cell = +cellA || 360, pad = 10, cap = 22;
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('_')).sort();
  const rows = Math.ceil(files.length / cols), cv = createCanvas(cols * (cell + pad) + pad, rows * (cell + cap + pad) + pad), c = cv.getContext('2d');
  c.fillStyle = '#2b2420'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  for (let i = 0; i < files.length; i++) {
    const im = await loadImage(path.join(dir, files[i])), x = pad + (i % cols) * (cell + pad), y = pad + Math.floor(i / cols) * (cell + cap + pad);
    const k = Math.min(cell / im.width, cell / im.height), w = im.width * k, h = im.height * k;
    c.drawImage(im, x + (cell - w) / 2, y + (cell - h) / 2, w, h);
    c.fillStyle = '#f0e6cc'; c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText(files[i].replace(/\.(jpe?g|png)$/i, ''), x + cell / 2, y + cell + 15, cell);
  }
  fs.writeFileSync(out, cv.toBuffer('image/jpeg', 82)); console.log('wrote', out, files.length, 'pictures');
})();
