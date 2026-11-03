// loot_pop.js: finishes the two chest frames for the pop (Robin, 2026-11-01: "the chest animation should pop and the lid should blow upwards") and draws the idea as a strip (Mitch, AD).
// Run after tools/loot.js. Renames the frames to Miles, GD's `chest/body` and `chest/lid`, gives the lid its own pivot at its centre so it can spin, copies the chest into out/loot/chest.
//   node tools/loot_pop.js  -> out/loot/chest/chest.{png,json}, out/loot/pop.jpg
const P = require('./paint.js'); const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), SRC = path.join(ROOT, 'work/loot/out/chest'), OUT = path.join(ROOT, 'out/loot/chest');
(async () => {
  const j = JSON.parse(fs.readFileSync(path.join(SRC, 'chest.json'), 'utf8'));
  for (const n of ['body', 'lid']) { const old = `chest/${n}/0001`, neu = `chest/${n}`; j.frames[neu] = j.frames[old]; delete j.frames[old]; j.actions[n].frames[0].name = neu; }
  const L = j.actions.lid.frames[0], off = { x: L.lt.x + L.w / 2, y: L.lt.y + L.h / 2 };   // the lid's centre from the chest's pivot, file px
  L.origin = { x: L.w / 2, y: L.h / 2 }; L.lt = { x: -L.w / 2, y: -L.h / 2 }; L.rb = { x: L.w / 2, y: L.h / 2 }; L.head = { x: 0, y: -L.h / 2 }; if (j.frames['chest/lid'].pivot) j.frames['chest/lid'].pivot = { x: 0.5, y: 0.5 };
  fs.mkdirSync(OUT, { recursive: true }); fs.copyFileSync(path.join(SRC, 'chest.png'), path.join(OUT, 'chest.png')); fs.writeFileSync(path.join(OUT, 'chest.json'), JSON.stringify(j, null, 1));
  spawnSync('python', [path.join(ROOT, 'tools/shrink.py'), OUT], { stdio: 'inherit' }); console.log('lid centre from the chest pivot, file px', off, 'body', j.actions.body.frames[0].origin, 'kb', Math.round(fs.statSync(path.join(OUT, 'chest.png')).size / 1024));
  // the strip: the same sprites as the game would draw them, at 0.5 of the file (design size is 160 wide), with the glow behind
  const im = await P.loadImage(path.join(OUT, 'chest.png')), glow = await P.loadImage(path.join(ROOT, 'out/loot/glow.png'));
  const fr = n => j.frames[n].frame, or = (a, i = 0) => j.actions[a].frames[i].origin, W = 1560, H = 360, cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.fillStyle = '#2f2a40'; g.fillRect(0, 0, W, H); g.fillStyle = '#4f8536'; g.fillRect(0, 300, W, 60);
  const sprite = (name, a, x, y, rot = 0, sx = 1, sy = 1) => { const r = fr(name), o = or(a); g.save(); g.translate(x, y); g.rotate(rot); g.scale(0.5 * sx, 0.5 * sy); g.drawImage(im, r.x, r.y, r.w, r.h, -o.x, -o.y, r.w, r.h); g.restore(); };
  // [squash x, squash y, lid rise in design px, lid turn, glow]
  const STEPS = [[1, 1, 0, 0, 0], [1.1, 0.86, 0, 0, 0], [0.94, 1.1, 34, -0.25, 0.5], [1.02, 0.98, 110, -0.8, 0.9], [1, 1, 190, -1.7, 1.1], [1, 1, 240, -2.9, 1]];
  STEPS.forEach(([sx, sy, up, rot, gl], i) => { const x = 130 + i * 260, y = 310; if (gl) { g.save(); g.globalAlpha = 0.85; const sz = 240 * gl; g.drawImage(glow, x - sz / 2, y - 50 - sz / 2, sz, sz); g.restore(); } if (i === 0) { const r = fr('chest/closed/0001'), o = or('closed'); g.save(); g.translate(x, y); g.scale(0.5, 0.5); g.drawImage(im, r.x, r.y, r.w, r.h, -o.x, -o.y, r.w, r.h); g.restore(); } else { sprite('chest/body', 'body', x, y, 0, sx, sy); sprite('chest/lid', 'lid', x + off.x * 0.5, y + off.y * 0.5 * sy - up, rot); } P.label(g, String(i + 1), x, 340, 14, '#f0e8d8', { align: 'center' }); });
  fs.writeFileSync(path.join(ROOT, 'out/loot/pop.jpg'), cv.toBuffer('image/jpeg', 90)); console.log('pop written');
})();
