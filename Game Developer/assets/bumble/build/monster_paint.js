// monster_paint.js: paints a monster's frames from a monster module (Perry, AD, 2026-10-31). A module (tools/monsters/<name>.js)
// exports name, W, H, origin, the actions {name: {delay, frames: [pose, ...], alpha?}} and draw(g, pose, action, i): the feet
// at (0, 0), facing left, at 2x. Every frame is trimmed by the packer; here each is painted whole with its data: origin,
// delay (a pose may carry hold, a multiple of the action's delay), the painted bounds as the hit box, the top as the head,
// a0/a1 for fades. Then tools/pack.js makes the atlas.
//   node tools/monster_paint.js <name> [--out work/<name>/paint]
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const name = a[0]; const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
if (!name) { console.log('usage: node tools/monster_paint.js <name>'); process.exit(1); }
const M = require(path.join(__dirname, 'monsters', name + '.js')); const OUT = path.resolve(ROOT, opt('out') || `work/${name}/paint`);
fs.mkdirSync(OUT, { recursive: true }); if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
const meta = { size: M.H / 2, px: 2, origin: [M.origin[0], M.origin[1]], actions: {} }; let n = 0;
for (const [act, A] of Object.entries(M.actions)) {
  meta.actions[act] = { delay: A.delay, frames: [] };
  A.frames.forEach((pose, i) => {
    const cv = P.createCanvas(M.W, M.H), g = cv.getContext('2d'); g.translate(M.origin[0], M.origin[1]); g.scale(M.scale || 1, M.scale || 1); M.draw(g, pose, act, i);   // scale: the module's size against the player
    const file = `${act}_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(OUT, file)); const b = P.bounds(cv) || { x: M.origin[0], y: M.origin[1], w: 1, h: 1 };
    const fr = { file, delay: A.delay * (pose.hold || 1), lt: [b.x, b.y], rb: [b.x + b.w, b.y + b.h], head: [M.origin[0] + (pose.headX || 0), b.y] };
    if (A.alpha) { fr.a0 = A.alpha[i]; fr.a1 = A.alpha[Math.min(i + 1, A.alpha.length - 1)]; }
    meta.actions[act].frames.push(fr); n++;
  });
}
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1)); console.log('painted', n, 'frames of the', M.name, 'into', OUT);
