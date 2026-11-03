// before_after.js: each creature as the game had it beside the rebuilt one, standing, at real size (Mitch, AD, 2026-11-01). Reads the game's assets, never writes there.
//   node tools/monsters/before_after.js  -> out/creatures/before_after.jpg
const P = require('../paint.js'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '../..'), GAME = path.resolve(ROOT, '../Game Developer/assets');
const REPORT = JSON.parse(fs.readFileSync(path.join(ROOT, 'work/creatures/report.json'), 'utf8'));
const OLD = { slime: 2, sprout: 2, bandit: 2, bee: 2, muncher: 1.25, goo: 1, goo2: 1 }, NEW = { slime: 2, ...Object.fromEntries(REPORT.map(r => [r.name, r.px])) };
const load = async (dir, n) => { const f = path.join(dir, n + '.json'); if (!fs.existsSync(f)) return null; return { j: JSON.parse(fs.readFileSync(f, 'utf8')), im: await P.loadImage(path.join(dir, n + '.png')) }; };
const put = (g, A, n, a, i, x, y, k) => { const F = A.j.actions[a].frames[i], r = A.j.frames[F.name].frame; g.save(); g.translate(x, y); g.scale(k, k); g.drawImage(A.im, r.x, r.y, r.w, r.h, -F.origin.x, -F.origin.y, r.w, r.h); g.restore(); };
(async () => {
  const rows = [['slime', 'Jelly Slime', 180], ['sprout', 'Grumpy Sprout', 190], ['bandit', 'Meadow Bandit', 170], ['bee', 'Bumbling Bee', 240], ['muncher', 'Mushroom Muncher', 240], ['goo', 'King Goo', 360], ['goo2', 'King Goo, second phase', 360]];
  const cols = 2, W = 1560, H = 1172, cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.fillStyle = '#1c1a22'; g.fillRect(0, 0, W, H); P.label(g, 'Before and after, standing, at real size: before on the left of each pair', W / 2, 24, 22, '#f0e8d8', { align: 'center' });
  const place = [[12, 50, 'slime'], [790, 50, 'sprout'], [12, 248, 'bandit'], [790, 248, 'bee'], [12, 500, 'muncher'], [790, 500, 'goo2'], [12, 760, 'goo']];
  for (const [x, y, n] of place) { const R = rows.find(r => r[0] === n), h = n.startsWith('goo') ? 380 : R[2], w = 758; g.fillStyle = '#8fd164'; g.fillRect(x, y, w, n === 'goo' ? 400 : h); g.fillStyle = '#5f9a3e'; g.fillRect(x, y + (n === 'goo' ? 400 : h) - 14, w, 14); P.label(g, R[1], x + 10, y + 14, 14, '#2a2030'); const gy = y + (n === 'goo' ? 400 : h) - 12; const O = await load(path.join(GAME, n), n), N = await load(n === 'slime' ? path.join(ROOT, 'out/slime') : path.join(ROOT, 'out/creatures', n), n); if (O) put(g, O, n, 'stand', 0, x + w * 0.27, gy, 1 / OLD[n]); if (N) put(g, N, n, 'stand', 0, x + w * 0.73, gy, 1 / NEW[n]); }
  fs.writeFileSync(path.join(ROOT, 'out/creatures/before_after.jpg'), cv.toBuffer('image/jpeg', 90)); console.log('before_after written');
})();
