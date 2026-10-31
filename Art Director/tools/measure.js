// measure.js: numbers to paint by (Perry, AD, 2026-10-31, on Colin, AD's advice: measure the reference and ours before
// painting). For a picture and named rectangles: the share of dark pixels (lightness under 0.22), the mean saturation and
// lightness (HSL), and the mean colour, so a ground body can be set against its lip and our greens against theirs. Reads
// a picture where it is and copies nothing.
//   node tools/measure.js <pic.png> name=x,y,w,h [name=x,y,w,h ...]
const P = require('./paint.js');
(async () => {
  const [file, ...rects] = process.argv.slice(2); const im = await P.loadImage(file); const cv = P.createCanvas(im.width, im.height), g = cv.getContext('2d'); g.drawImage(im, 0, 0);
  console.log(file, im.width + 'x' + im.height);
  for (const r of rects.length ? rects : ['all=0,0,' + im.width + ',' + im.height]) {
    const [name, box] = r.split('='); const [x, y, w, h] = box.split(',').map(Number); const d = g.getImageData(x, y, w, h).data;
    let n = 0, dark = 0, sat = 0, lig = 0, R = 0, G = 0, B = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const rr = d[i] / 255, gg = d[i + 1] / 255, bb = d[i + 2] / 255, max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb), l = (max + min) / 2, s = max === min ? 0 : (l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)); n++; if (l < 0.22) dark++; sat += s; lig += l; R += d[i]; G += d[i + 1]; B += d[i + 2]; }
    console.log(`  ${name.padEnd(12)} dark ${(dark / n * 100).toFixed(1)}%  sat ${(sat / n).toFixed(2)}  light ${(lig / n).toFixed(2)}  mean ${P.rgb2hex(R / n, G / n, B / n)}  (${n} px)`);
  }
})();
