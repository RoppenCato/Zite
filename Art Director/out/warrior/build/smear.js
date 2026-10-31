// smear.js: paints the strike's trail onto rendered frames (Perry, AD, 2026-10-31): for each frame of an action that has
// a 'tip' and a 'shoulder' in meta.json, a pale, part-transparent band swept from the previous frame's tip to this one's
// about the shoulder, widest at the blade and tapering to nothing at the tail, stopping at the ground (the origin's y).
// Only frames named in --frames get one (the two cut frames); the files are repainted in place, so run it once.
//   node tools/smear.js <render dir> [--action attack1] [--frames 2,3]
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const a = process.argv.slice(2); const dir = a[0]; const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const act = opt('action') || 'attack1', which = (opt('frames') || '2,3').split(',').map(Number);
(async () => {
  const mp = path.join(dir, 'meta.json'), meta = JSON.parse(fs.readFileSync(mp, 'utf8')), A = meta.actions[act]; if (!A) { console.log('no', act); return; }
  const ground = meta.origin[1];
  for (const i of which) {
    const F = A.frames[i], Pv = A.frames[i - 1]; if (!F || !Pv || !F.tip || !Pv.tip) continue;
    const im = await P.loadImage(path.join(dir, F.file)), cv = P.createCanvas(im.width, im.height), g = cv.getContext('2d');
    const [sx, sy] = F.shoulder, t1 = Math.atan2(F.tip[1] - sy, F.tip[0] - sx), r1 = Math.hypot(F.tip[0] - sx, F.tip[1] - sy);
    let t0 = Math.atan2(Pv.tip[1] - sy, Pv.tip[0] - sx); const r0 = Math.hypot(Pv.tip[0] - sx, Pv.tip[1] - sy);
    while (t1 - t0 > Math.PI) t0 += 2 * Math.PI; while (t0 - t1 > Math.PI) t0 -= 2 * Math.PI;   // the shorter way round
    const n = 24, outer = [], inner = [];
    for (let k = 0; k <= n; k++) { const u = k / n, t = t0 + (t1 - t0) * u, R = r0 + (r1 - r0) * u, w = 0.3 * u * u; outer.push([sx + Math.cos(t) * R, sy + Math.sin(t) * R]); inner.push([sx + Math.cos(t) * R * (1 - w), sy + Math.sin(t) * R * (1 - w)]); }
    g.save(); g.beginPath(); g.rect(0, 0, im.width, ground - 2); g.clip();
    g.beginPath(); outer.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); inner.reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fillStyle = 'rgba(255,244,196,0.42)'; g.fill();
    g.beginPath(); outer.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,236,0.6)'; g.stroke(); g.restore();
    g.drawImage(im, 0, 0);                                                                        // the figure over the trail
    P.save(cv, path.join(dir, F.file)); console.log('trail on', F.file);
  }
})();
