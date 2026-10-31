// pack.js: turns a monster's render into what the game draws (Perry, AD, 2026-10-31): every frame trimmed to its painted
// pixels (1 px of air), its edge hardened (fully opaque, hard edges: docs/direction.md section 1), packed into one atlas
// PNG, and <name>.json beside it in Phaser's atlas form (frames by name) with an 'actions' block carrying each frame's
// data in the reference's terms: origin (the feet, in the frame's own pixels), delay, lt and rb (the hit box, relative to
// the origin), head (the top of the head, relative to the origin), a0 and a1 for fades. Files are at 2x; the game draws
// them at half size in CSS pixels.
//   node tools/pack.js <name> <render dir> <out dir>
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const [name, dir, out] = process.argv.slice(2);
if (!name || !dir || !out) { console.log('usage: node tools/pack.js <name> <render dir> <out dir>'); process.exit(1); }
(async () => {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), O = meta.origin;
  const frames = [], actions = {};
  for (const [act, A] of Object.entries(meta.actions)) {
    actions[act] = { delay: A.delay, loop: act === 'stand' || act === 'move' || act === 'fly', frames: [] };
    for (let i = 0; i < A.frames.length; i++) {
      const F = A.frames[i], im = await P.loadImage(path.join(dir, F.file)), cv = P.createCanvas(im.width, im.height); cv.getContext('2d').drawImage(im, 0, 0);
      P.harden(cv); const t = P.trim(cv, 1);
      const key = `${act}_${String(i).padStart(2, '0')}`, origin = { x: Math.round(O[0] - t.x), y: Math.round(O[1] - t.y) };
      const rel = p => ({ x: Math.round(p[0] - O[0]), y: Math.round(p[1] - O[1]) });
      const fr = { name: key, w: t.cv.width, h: t.cv.height, origin, delay: F.delay, lt: rel(F.lt), rb: rel(F.rb), head: rel(F.head) };
      if (F.a0 !== undefined) { fr.a0 = F.a0; fr.a1 = F.a1; }
      actions[act].frames.push(fr); frames.push({ key, cv: t.cv });
    }
  }
  // a shelf atlas: rows of frames, each row as tall as its tallest frame, at most 2048 wide
  const MAXW = 2048; let x = 0, y = 0, rowH = 0, W = 0; const places = [];
  for (const f of frames) { if (x + f.cv.width > MAXW) { x = 0; y += rowH; rowH = 0; } places.push({ f, x, y }); x += f.cv.width; rowH = Math.max(rowH, f.cv.height); W = Math.max(W, x); }
  const H = y + rowH, atlas = P.createCanvas(W, H), g = atlas.getContext('2d'); const json = { frames: {}, meta: { image: name + '.png', size: { w: W, h: H }, scale: 2, facing: 'left', app: 'Art Director/tools/pack.js' }, actions };
  for (const p of places) { g.drawImage(p.f.cv, p.x, p.y); json.frames[p.f.key] = { frame: { x: p.x, y: p.y, w: p.f.cv.width, h: p.f.cv.height }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: p.f.cv.width, h: p.f.cv.height }, sourceSize: { w: p.f.cv.width, h: p.f.cv.height } }; }
  fs.mkdirSync(path.join(out, 'frames'), { recursive: true }); P.save(atlas, path.join(out, name + '.png')); fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(json, null, 1));
  for (const p of places) P.save(p.f.cv, path.join(out, 'frames', p.f.key + '.png'));
  const kb = Math.round(fs.statSync(path.join(out, name + '.png')).size / 1024);
  console.log('packed', frames.length, 'frames of', name, 'into', out, `(${W}x${H}, ${kb} KB)`);
})();
