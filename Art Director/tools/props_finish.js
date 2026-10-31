// props_finish.js: finishes the Blender props into kit pieces (Perry, AD, 2026-10-31): each render trimmed to its painted
// pixels, its edge hardened, a soft contact shadow laid at the foot (a piece without one sits on the ground like a sticker:
// the Survival game's lesson of 2026-10-21), then written into the kit as objects/fight/<name>.png (side on) and
// objects/board/<name>.png (a touch from above) with their data: size, origin (the centre), foot (the base, where the
// board sorts it by depth), layer and z. Reads and rewrites kit.json.
//   node tools/props_finish.js [--render work/meadow/props/render] [--kit work/meadow/kit]
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const RENDER = path.resolve(ROOT, opt('render') || 'work/meadow/props/render'), KIT = path.resolve(ROOT, opt('kit') || 'work/meadow/kit');
const LAYER = { tree: [2, 0], tree_small: [2, 0], bush: [3, 0], bush_wide: [3, 0], house: [2, 0], signpost: [3, 1], fence: [3, 0], rock: [3, 0], stump: [3, 0], haystack: [2, 0], mushrooms: [4, 0] };
(async () => {
  const meta = JSON.parse(fs.readFileSync(path.join(RENDER, 'meta.json'), 'utf8')), kit = JSON.parse(fs.readFileSync(path.join(KIT, 'kit.json'), 'utf8'));
  kit.fight.objects = kit.fight.objects.filter(o => !meta[o.name]); kit.board.objects = kit.board.objects.filter(o => !meta[o.name]);
  for (const [name, spec] of Object.entries(meta)) {
    for (const view of ['side', 'board']) {
      const V = spec[view]; if (!V) continue;
      const im = await P.loadImage(path.join(RENDER, V.file)), cv = P.createCanvas(im.width, im.height); cv.getContext('2d').drawImage(im, 0, 0);
      P.harden(cv, 110); const t = P.trim(cv, 2); const fx = V.foot[0] - t.x, fy = V.foot[1] - t.y;
      // the contact shadow: wider and rounder from above, a thin sliver side on; the canvas grows to hold it
      const rx = Math.round(t.cv.width * (view === 'board' ? 0.42 : 0.40)), ry = view === 'board' ? Math.round(rx * 0.38) : 7;
      const padL = Math.max(0, rx - fx), padR = Math.max(0, fx + rx - t.cv.width), padB = Math.max(0, fy + ry + 2 - t.cv.height);
      const out = P.createCanvas(t.cv.width + padL + padR, t.cv.height + padB), g = out.getContext('2d'), sx = fx + padL, sy = fy;
      g.fillStyle = P.rad(g, sx, sy, sx, sy, rx, [[0, 'rgba(20,30,10,0.30)'], [0.7, 'rgba(20,30,10,0.22)'], [1, 'rgba(20,30,10,0)']]); g.save(); g.translate(sx, sy); g.scale(1, ry / rx); g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore();
      g.drawImage(t.cv, padL, 0);
      const file = `objects/${view === 'side' ? 'fight' : 'board'}/${name}.png`; P.save(out, path.join(KIT, file));
      const [layer, z] = LAYER[name] || [3, 0];
      (view === 'side' ? kit.fight.objects : kit.board.objects).push({ name, file, w: out.width, h: out.height, origin: [Math.round(out.width / 2), Math.round(out.height / 2)], foot: [Math.round(sx), Math.round(sy)], layer, z, view: view === 'side' ? 'side on' : 'a touch from above (30 degrees)' });
    }
  }
  fs.writeFileSync(path.join(KIT, 'kit.json'), JSON.stringify(kit, null, 1));
  console.log('finished', Object.keys(meta).length, 'props into', KIT, '(objects/fight, objects/board)');
})();
