// fix_robin.js: Robin's frames cleaned up (2026-11-01, "clean it up and fix it, make it more smooth and snappy"): every frame
// grounded on its lowest painted row; the stand and walk anchored on the hair's centre so the head does not wander, the
// attack and hit on the feet's centre; the walk frames (drawn 3 percent taller) scaled to the stand's height; the walk's
// heads replaced by the stand's head so the face does not flicker; the keyed edges hardened; snappier delays; the blade's
// tip and the shoulder written for the trail. Reads work/robin-sheet/paint, writes work/robin-sheet/fixed.
const fs = require('fs'); const path = require('path'); const P = require('./paint.js');
const SRC = path.resolve(__dirname, '..', process.argv[2] || 'work/robin-sheet/paint'), OUT = path.resolve(__dirname, '..', process.argv[3] || 'work/robin-sheet/fixed');
const meta = JSON.parse(fs.readFileSync(SRC + '/meta.json', 'utf8')), [OX, OY] = meta.origin, W = 561, H = 340;
const DELAYS = { stand: [280, 280, 280, 280], move: [95, 95, 95, 95, 95, 95], attack1: [150, 90, 50, 50, 130, 90, 80], hit1: [180, 140, 110], die1: [80, 80, 80, 80, 80, 80, 80, 80] };
function hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0; let h = 0; if (mx !== mn) { if (mx === r) h = ((g - b) / (mx - mn)) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360; } return [h, s, mx]; }
function measure(cv) {
  const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; const pts = [];
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) { const i = (y * cv.width + x) * 4; if (d[i + 3] < 128) continue; pts.push([x, y, d[i], d[i + 1], d[i + 2]]); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const hair = pts.filter(p => p[1] < y0 + (y1 - y0) * 0.45).filter(p => { const [h, s, v] = hsv(p[2], p[3], p[4]); return h > 14 && h < 34 && s > 0.62 && v > 0.72; });
  const feet = pts.filter(p => p[1] > y1 - 8), mean = a => a.reduce((s, p) => s + p[0], 0) / (a.length || 1);
  const hx = mean(hair), hy = hair.reduce((s, p) => s + p[1], 0) / (hair.length || 1);
  const steel = pts.filter(p => { const [h, s, v] = hsv(p[2], p[3], p[4]); return s < 0.14 && v > 0.62 && !(p[0] > hx - 70 && p[0] < hx + 70 && p[1] > hy - 60 && p[1] < hy + 90); });
  let tip = null; if (steel.length > 40) { let best = -1; for (const p of steel) { const dd = (p[0] - hx) ** 2 + (p[1] - hy) ** 2; if (dd > best) { best = dd; tip = [p[0], p[1]]; } } }   // the blade's tip: the steel pixel farthest from the head
  return { x0, x1, y0, y1, height: y1 - y0, hairX: hx, hairY: hy, hairN: hair.length, feetX: mean(feet), tip };
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const frames = {}; for (const [act, A] of Object.entries(meta.actions)) for (const F of A.frames) { const im = await P.loadImage(path.join(SRC, F.file)); const cv = P.createCanvas(W, H); cv.getContext('2d').drawImage(im, 0, 0); frames[F.file] = { act, cv, m: measure(cv) }; }
  const S0 = frames['stand_00.png'].m, standH = S0.height, headRX = 66, headRY = 76, headDY = 28;   // the head's mask: an ellipse about the hair's centre, a little below it
  const out = { size: 100, px: 2, origin: [OX, OY], actions: {} }; let log = '';
  for (const [act, A] of Object.entries(meta.actions)) {
    out.actions[act] = { delay: DELAYS[act][0], frames: [] };
    A.frames.forEach((F, i) => {
      const f = frames[F.file], m = f.m, lying = act === 'die1' && i >= 3;
      const s = act === 'move' ? standH / m.height : 1;                                                                           // the walk back to the stand's height
      let ax, tx; if (act === 'stand' || act === 'move') { ax = m.hairX; tx = S0.hairX; } else if (act === 'attack1' || act === 'hit1') { ax = m.feetX; tx = S0.feetX; } else { ax = OX; tx = OX; }
      const cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.imageSmoothingQuality = 'high';
      const dx = tx - ax * s, dy = OY - 1 - m.y1 * s;                                                                              // the feet on the ground, the anchor where the stand's is
      g.setTransform(s, 0, 0, s, dx, dy); g.drawImage(f.cv, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
      const hx = m.hairX * s + dx, hy = m.hairY * s + dy;
      if (act === 'move') {                                                                                                         // the stand's head on every walk frame: one face, no flicker
        g.save(); g.beginPath(); g.ellipse(hx, hy + headDY, headRX, headRY, 0, 0, 7); g.clip(); g.clearRect(0, 0, W, H);
        g.translate(hx - S0.hairX, hy - S0.hairY); g.drawImage(frames['stand_00.png'].cv, 0, 0); g.restore();
      }
      P.harden(cv, 110);
      const b = P.bounds(cv, 40) || { x: 0, y: 0, w: 1, h: 1 }, tip = m.tip ? [m.tip[0] * s + dx, m.tip[1] * s + dy] : null;
      P.save(cv, path.join(OUT, F.file));
      const fr = { file: F.file, delay: DELAYS[act][i], lt: [b.x, b.y], rb: [b.x + b.w, b.y + b.h], head: [Math.round(hx), b.y], tip, shoulder: [Math.round(hx + 10), Math.round(hy + 95)] };
      if (F.a0 !== undefined) { fr.a0 = F.a0; fr.a1 = F.a1; }
      out.actions[act].frames.push(fr); log += `${F.file} s ${s.toFixed(3)} dx ${dx.toFixed(0)} dy ${dy.toFixed(0)} hair (${m.hairX.toFixed(0)},${m.hairY.toFixed(0)}) n ${m.hairN} feetX ${m.feetX.toFixed(0)} tip ${tip ? tip.map(v => v.toFixed(0)) : '-'}\n`;
    });
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(out, null, 1)); console.log(log + 'fixed into ' + OUT);
})();
