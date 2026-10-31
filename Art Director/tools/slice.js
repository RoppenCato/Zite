// slice.js: the fight screen painted straight with the brushes, as the full phone (Perry, AD, 2026-10-31; Colin, AD: build
// one thing to the end first, and show the full phone screen with the panel on, since half the soil sits under the
// buttons). The sky, far hills, a hazed tree line, a mid plane of bushes, the near plane, ONE tree with ONE bush at its
// foot, the ground (a dark quiet body under a bright lip), our player facing the fight, the Turnip Grump, the HUD and the
// panel. Not from the kit, so what is judged is the recipe.
//   node tools/slice.js [--out work/slice/slice.png] [--monster work/turnip/sheets/turnip.json]
const P = require('./paint.js'); const B = require('./brush.js'); const C = require('./chrome.js'); const { player, load } = require('./player.js'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const OUT = path.resolve(ROOT, opt('out') || 'work/slice/slice.png'), W = 824, H = 1830, GY = 1290, WALK = GY - 20;
const wave = (x, W, amps) => amps.reduce((s, [n, am, ph]) => s + am * Math.sin(2 * Math.PI * n * x / W + ph), 0);
(async () => {
  await load(opt('player') || undefined);
  const cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(5);
  // the sky and the clouds (flat puffs, shaded low, no line)
  g.fillStyle = P.lin(g, 0, 0, 0, 1100, [[0, '#4a98e2'], [1, '#a8d4f2']]); g.fillRect(0, 0, W, 1100);
  B.cloud(g, 150, 330, 64, 1); B.cloud(g, 540, 250, 50, 2); B.cloud(g, 760, 420, 40, 3); B.cloud(g, 360, 520, 34, 4);
  // the far hills: pale, hazed, an uneven ridge; nothing on them (Colin, AD: the dark blotches read as stains); raised so the sky band is not empty
  const ridge = x => 700 + wave(x, W, [[1.3, 36, 0.4], [3.1, 16, 1], [7, 6, 2]]); g.beginPath(); g.moveTo(0, 1100); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge(x)); g.lineTo(W, 1100); g.closePath(); g.fillStyle = '#a3c6b8'; g.fill();
  const ridge2 = x => 780 + wave(x, W, [[1.7, 30, 2.1], [4.2, 12, 0.3]]); g.beginPath(); g.moveTo(0, 1100); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge2(x)); g.lineTo(W, 1100); g.closePath(); g.fillStyle = '#95bda9'; g.fill();
  // the tree line: a wall of overlapping crowns, hazed, their trunks hidden behind a band of bushes at their feet (no tombstones)
  const line = x => 920 + wave(x, W, [[2.2, 14, 0.2], [5, 7, 1.4]]); g.beginPath(); g.moveTo(0, 1300); for (let x = 0; x <= W; x += 4) g.lineTo(x, line(x)); g.lineTo(W, 1300); g.closePath(); g.fillStyle = P.lin(g, 0, 900, 0, 1300, [[0, '#86c05a'], [1, '#5fa83c']]); g.fill();
  const far = [[-20, 0.8, B.LEAF], [90, 1.0, B.LEAF_YELLOW], [200, 0.7, B.LEAF_DARK], [290, 0.95, B.LEAF], [410, 0.75, B.LEAF_YELLOW], [520, 1.05, B.LEAF_DARK], [640, 0.8, B.LEAF], [750, 0.9, B.LEAF_YELLOW], [850, 0.7, B.LEAF_DARK]];
  // the tree line: hazed crowns sitting in one soft band of foliage (no trunks, no floating bottoms), a row of bushes before it
  const band = x => line(x) - 10 + wave(x, W, [[3, 8, 0.7], [7, 4, 2.2]]); g.beginPath(); g.moveTo(0, 1300); for (let x = 0; x <= W; x += 4) g.lineTo(x, band(x)); g.lineTo(W, 1300); g.closePath(); g.fillStyle = B.hazed(B.LEAF, 0.35).dark; g.fill();
  for (let i = 0; i < far.length; i++) { const [x, s, t] = far[i], y = line(x) - 10 + (i % 3) * 6, k = 0.4; B.crown(g, x, y - 50 * s, 66 * s, 50 * s, 210 + i, B.hazed(t, k), { n: 4 + (i % 3), r: 28 * s, ink: false }); }
  for (let i = 0; i < 12; i++) { const x = -20 + i * 80 + (i % 2) * 26, y = line(x) + 14 + (i % 3) * 8, s = 0.85 + (i % 4) * 0.14, t = [B.LEAF_DARK, B.LEAF, B.LEAF_YELLOW][i % 3]; B.crown(g, x, y, 64 * s, 32 * s, 300 + i, B.hazed(t, 0.3), { n: 4, r: 26 * s, ink: false }); }   // the bushes at their feet
  g.fillStyle = P.lin(g, 0, 660, 0, 1200, [[0, 'rgba(168,212,242,0)'], [0.3, 'rgba(168,212,242,0.22)'], [1, 'rgba(168,212,242,0)']]); g.fillRect(0, 660, W, 540);   // the haze, fading in and out: no edge
  // the near plane: low grass just behind the ground
  B.grass(g, 0, W, 1262, 10, 28, 7, B.LIP, 0.14);
  // the ground: the soil body, quiet and darker going down; the lip's blades rooted below the walk line and rising to it; grass and roots hanging over the join
  B.clods(g, 0, GY + 20, W, H - GY - 20, 9, B.SOIL, { stones: 3, cell: 170 });
  g.fillStyle = B.SOIL.dark; g.fillRect(0, GY - 6, W, 30); B.clods(g, 0, GY - 10, W, 34, 10, B.SOIL, { base: false, cell: 130, fade: 0 });
  B.grass(g, 0, W, GY + 4, 22, 52, 11, B.LIP, 0.6); B.grass(g, 0, W, GY + 10, 12, 30, 12, { ...B.LIP, dark: B.LIP.mid, deep: B.LIP.dark, hiShare: 0.05 }, 0.28);   // shorter in front of the fighters' feet
  for (let i = 0; i < 40; i++) { const x = r() * W, h = 10 + r() * 20; B.bladePath(g, x, GY + 24, h, 6, (r() - 0.5) * 16); g.fillStyle = r() > 0.5 ? B.LIP.deep : B.LIP.dark; g.save(); g.translate(x, GY + 24); g.scale(1, -1); g.translate(-x, -(GY + 24)); g.fill(); g.restore(); }   // blades hanging down over the soil
  for (const x of [120, 470, 700]) { g.strokeStyle = B.SOIL.deep; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, GY + 18); g.quadraticCurveTo(x + (r() - 0.5) * 14, GY + 36, x + (r() - 0.5) * 20, GY + 44 + r() * 22); g.stroke(); }   // three roots, uneven
  // ONE tree and ONE bush at its foot; a flower, a rock, tufts: a cluster, not confetti
  B.trunk(g, 130, WALK + 6, 230, 46, 21); B.crown(g, 130, WALK - 320, 150, 112, 22, B.LEAF, { n: 9, r: 56 });
  B.crown(g, 230, WALK - 40, 88, 46, 23, B.LEAF_DARK, { n: 6, r: 38 });
  B.tuft(g, 60, WALK + 8, 28, 24); B.tuft(g, 300, WALK + 8, 22, 25, B.LEAF_YELLOW); B.flower(g, 282, WALK + 6, 44, 26, 0); B.rock(g, 720, WALK + 6, 42, 36, 27);
  B.tuft(g, 760, WALK + 8, 26, 28); B.tuft(g, 470, WALK + 8, 20, 29, B.LEAF_DARK);
  // our player, facing the fight (the game flips him), and the monster; both with the ground's shadow the game lays
  if (!opt('empty')) { g.save(); g.scale(2, 2); player(g, 200, WALK / 2, 1, { flip: true }); g.restore(); }   // --empty: the stage alone, for pages and gifs that draw the fighters themselves
  const mj = opt('monster') || 'work/turnip/sheets/turnip.json'; if (!opt('empty') && fs.existsSync(path.resolve(ROOT, mj))) { const J = JSON.parse(fs.readFileSync(path.resolve(ROOT, mj), 'utf8')), im = await P.loadImage(path.join(path.dirname(path.resolve(ROOT, mj)), J.meta.image)), F = J.actions.stand.frames[0], fr = J.frames[F.name].frame; g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(600, WALK + 8, 80, 22, 0, 0, 7); g.fill(); g.drawImage(im, fr.x, fr.y, fr.w, fr.h, 600 - F.origin.x, WALK - F.origin.y, fr.w, fr.h); }
  C.hud(g, 'Sunny Meadow'); C.fightUi(g);
  P.save(cv, OUT); console.log('wrote', OUT);
})();
