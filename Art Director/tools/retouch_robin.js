// retouch_robin.js: small, local corrections on Robin's own sprite frames (Robin, 2026-11-01: "stop redesigning the character,
// correct Robin's existing sprite": his frames are the character; only the chest's rounded shading and the arms' connections
// change, nothing else). Works on the cleaned frames (work/robin-sheet/fixed), writes work/robin-sheet/retouched.
//   node tools/retouch_robin.js [--only stand] [--src work/robin-sheet/fixed] [--out work/robin-sheet/retouched]
// The corrections, in frame pixels (the frames are aligned on the hair, so one set of coordinates serves a whole action):
//   chest: the blue inside a box, below the collar and above the belt, flattened toward one gentle top-to-bottom gradient
//   sleeve: the sword arm's upper arm as a mirrored copy of his own far sleeve set on the front shoulder, then a short soft
//           forearm in his skin to the existing hand; the hand itself untouched
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const a = process.argv.slice(2); const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const ROOT = path.resolve(__dirname, '..'), SRC = path.resolve(ROOT, opt('src') || 'work/robin-sheet/fixed'), OUT = path.resolve(ROOT, opt('out') || 'work/robin-sheet/retouched');
const only = opt('only') ? opt('only').split(',') : null;
const FIX = {
  stand: { chest: { x0: 249, x1: 304, y0: 184, y1: 216, keep: 0.25, collar: [257, 278, 178, 197] }, sleeve: { farSleeve: [303, 177, 34, 38], at: [257, 196], hand: [252, 219], w: 9, skinAt: [330, 222], lineAt: [318, 206] } },
};
function hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0; let h = 0; if (mx !== mn) { if (mx === r) h = ((g - b) / (mx - mn)) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360; } return [h, s, mx]; }
function flattenChest(g, W, H, c) {
  const id = g.getImageData(0, 0, W, H), d = id.data; let sr = 0, sg = 0, sb = 0, n = 0;
  const inBox = (x, y) => x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1 && !(x >= c.collar[0] && x <= c.collar[1] && y >= c.collar[2] && y <= c.collar[3]);
  const isTunic = i => { const [h, s, v] = hsv(d[i], d[i + 1], d[i + 2]); return d[i + 3] > 128 && h > 195 && h < 240 && s > 0.3 && v > 0.3; };
  for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) { const i = (y * W + x) * 4; if (inBox(x, y) && isTunic(i)) { const [, , v] = hsv(d[i], d[i + 1], d[i + 2]); if (v > 0.45) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; } } }
  if (!n) return; const mr = sr / n, mg = sg / n, mb = sb / n;
  for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) {
    const i = (y * W + x) * 4; if (!inBox(x, y) || !isTunic(i)) continue;
    const t = (y - c.y0) / (c.y1 - c.y0), k = 1.06 - 0.12 * t;                                           // one gentle gradient, a touch lighter at the top
    const edge = Math.min(x - c.x0, c.x1 - x, y - c.y0, c.y1 - y), w = Math.min(1, edge / 4) * (1 - c.keep);   // soft at the box's edges, so nothing shows a seam
    d[i] = d[i] * (1 - w) + mr * k * w; d[i + 1] = d[i + 1] * (1 - w) + mg * k * w; d[i + 2] = d[i + 2] * (1 - w) + mb * k * w;
  }
  g.putImageData(id, 0, 0);
}
function sample(g, x, y) { const q = g.getImageData(x, y, 1, 1).data; return [q[0], q[1], q[2]]; }
function paintSleeve(g, src, W, H, s) {
  // the sword arm's upper arm: the sprite's OWN far sleeve, copied and mirrored onto the front shoulder (so the shading, the cuff band and the line are his);
  // then a short, soft forearm in his skin down to the hand; the hand and everything below it exactly as it was
  const [fx0, fy0, fw, fh] = s.farSleeve, [cx, cy] = s.at, [hx, hy] = s.hand, skin = sample(src, ...s.skinAt), line = sample(src, ...s.lineAt);
  const col = c => `rgb(${c.map(v => Math.round(v)).join(',')})`;
  const piece = P.createCanvas(fw, fh), pg = piece.getContext('2d'); pg.translate(fw, 0); pg.scale(-1, 1); pg.drawImage(src.canvas, fx0, fy0, fw, fh, 0, 0, fw, fh);
  const pd = pg.getImageData(0, 0, fw, fh), d = pd.data;                                                                           // a feathered edge, so the piece melts into the sprite
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4, e = Math.min(x, fw - 1 - x, y, fh - 1 - y); if (e < 3) d[i + 3] = Math.round(d[i + 3] * (e + 1) / 4); }
  pg.setTransform(1, 0, 0, 1, 0, 0); pg.putImageData(pd, 0, 0);
  g.drawImage(piece, Math.round(cx - fw / 2), Math.round(cy - fh / 2));
  const tmp = P.createCanvas(W, H), tg = tmp.getContext('2d');                                                                         // the forearm, soft like the rest
  tg.beginPath(); tg.moveTo(cx - 2, cy + fh / 2 - 6); tg.lineTo(hx + 2, hy + 2); tg.lineWidth = s.w + 3; tg.lineCap = 'round'; tg.strokeStyle = col(line); tg.stroke();
  tg.beginPath(); tg.moveTo(cx - 2, cy + fh / 2 - 6); tg.lineTo(hx + 2, hy + 2); tg.lineWidth = s.w; tg.strokeStyle = col(skin); tg.stroke();
  try { g.filter = 'blur(0.8px)'; } catch (e) {} g.drawImage(tmp, 0, 0); try { g.filter = 'none'; } catch (e) {}
  const keep = src.getImageData(hx - 30, hy, 60, 60), kd = keep.data; for (let i = 3; i < kd.length; i += 4) if (kd[i] < 128) kd[i] = 0;   // the hand back on top, hard
  const hp = P.createCanvas(60, 60); hp.getContext('2d').putImageData(keep, 0, 0); g.drawImage(hp, hx - 30, hy);
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); const meta = JSON.parse(fs.readFileSync(path.join(SRC, 'meta.json'), 'utf8'));
  for (const [act, A] of Object.entries(meta.actions)) {
    const fx = FIX[act];
    for (const F of A.frames) {
      const im = await P.loadImage(path.join(SRC, F.file)), cv = P.createCanvas(im.width, im.height), g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      if (fx && (!only || only.includes(act))) {
        const src = P.createCanvas(im.width, im.height); src.getContext('2d').drawImage(im, 0, 0);
        if (fx.chest) flattenChest(g, cv.width, cv.height, fx.chest);
        if (fx.sleeve) paintSleeve(g, src.getContext('2d'), cv.width, cv.height, fx.sleeve);
      }
      P.save(cv, path.join(OUT, F.file));
    }
  }
  fs.copyFileSync(path.join(SRC, 'meta.json'), path.join(OUT, 'meta.json')); console.log('retouched into', OUT);
})();
