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
      const key = `${name}/${act}/${String(i + 1).padStart(4, '0')}`, origin = { x: Math.round(O[0] - t.x), y: Math.round(O[1] - t.y) };   // Miles, GD's names (2026-10-31): <sprite>/<action>/<0001>
      const rel = p => ({ x: Math.round(p[0] - O[0]), y: Math.round(p[1] - O[1]) });
      const lt = F.lt || [t.x, t.y], rb = F.rb || [t.x + t.cv.width, t.y + t.cv.height], hd = F.head || [O[0], t.y];   // a builder that gives no box gets the painted bounds
      const fr = { name: key, w: t.cv.width, h: t.cv.height, origin, delay: F.delay, lt: rel(lt), rb: rel(rb), head: rel(hd) };
      if (F.a0 !== undefined) { fr.a0 = F.a0; fr.a1 = F.a1; }
      actions[act].frames.push(fr); frames.push({ key, cv: t.cv, origin });
    }
  }
  // a shelf atlas with 2 px of padding, on power-of-two sides (Miles, GD: mipmaps on the board's zoom), 1024 wide unless it would run past 2048 tall
  const PAD = 2, pot = v => 1 << Math.ceil(Math.log2(Math.max(1, v)));
  const order = [...frames].sort((a, b) => b.cv.height - a.cv.height);   // tallest first, so the short frames share short rows
  const shelf = (MAXW) => { let x = PAD, y = PAD, rowH = 0; const places = []; for (const f of order) { if (x + f.cv.width + PAD > MAXW) { x = PAD; y += rowH + PAD; rowH = 0; } places.push({ f, x, y }); x += f.cv.width + PAD; rowH = Math.max(rowH, f.cv.height); } return { places, H: y + rowH + PAD }; };
  let W = 1024, { places, H } = shelf(W); if (H > 2048) { W = 2048; ({ places, H } = shelf(W)); } H = pot(H);
  if (H > 2048) console.warn('!! the atlas runs past 2048 by 2048: fewer or smaller frames, or a second atlas');
  const atlas = P.createCanvas(W, H), g = atlas.getContext('2d'); const json = { frames: {}, meta: { image: name + '.png', size: { w: W, h: H }, scale: '1', format: 'RGBA8888', app: 'Art Director/tools/pack.js', facing: 'left', filePx: 2 }, actions };
  for (const p of places) { g.drawImage(p.f.cv, p.x, p.y); json.frames[p.f.key] = { frame: { x: p.x, y: p.y, w: p.f.cv.width, h: p.f.cv.height }, rotated: false, trimmed: true, spriteSourceSize: { x: 0, y: 0, w: p.f.cv.width, h: p.f.cv.height }, sourceSize: { w: p.f.cv.width, h: p.f.cv.height }, pivot: { x: +(p.f.origin.x / p.f.cv.width).toFixed(4), y: +(p.f.origin.y / p.f.cv.height).toFixed(4) } }; }   // the pivot at the feet, so trimmed frames do not jump
  fs.mkdirSync(path.join(out, 'frames'), { recursive: true }); P.save(atlas, path.join(out, name + '.png')); fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(json, null, 1));
  for (const p of places) P.save(p.f.cv, path.join(out, 'frames', p.f.key.split('/').slice(1).join('_') + '.png'));
  const kb = Math.round(fs.statSync(path.join(out, name + '.png')).size / 1024);
  console.log('packed', frames.length, 'frames of', name, 'into', out, `(${W}x${H}, ${kb} KB)`);
})();
