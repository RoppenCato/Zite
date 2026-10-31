// vector_stage.js: a meadow stage in the cartoon-vector hand (Perry, AD, 2026-10-31), to judge the vector Warrior where he
// would stand: a day sky, far hills as flat rounded shapes pushed toward blue, round trees and bushes with scalloped lit
// tops, a flat green ground with lighter patches, a path of rounded stone blocks, the HUD and the panel. No ink anywhere.
//   node tools/vector_stage.js [--out work/vector/stage.png] [--night true]
const P = require('./paint.js'); const V = require('./vector.js'); const C = require('./chrome.js'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const OUT = path.resolve(ROOT, opt('out') || 'work/vector/stage.png'), W = 824, H = 1830, GY = 1290, night = !!opt('night');
const cv = P.createCanvas(W, H), g = cv.getContext('2d'), r = P.rng(11);
const SKY = night ? ['#17204a', '#2a3a7a'] : ['#3f8fdc', '#a8d8f4'], HILL = V.tones(night ? '#2f4d6e' : '#6fb08e'), HILL2 = V.tones(night ? '#3a5e7a' : '#8cc39a'), GRASS = V.tones(night ? '#2f6a3c' : '#5fb04a'), LEAF = V.tones(night ? '#2c6a3a' : '#4f9c3a'), LEAF2 = V.tones(night ? '#3a7a46' : '#6fb848'), STONE = V.tones(night ? '#6a7aa0' : '#9aa5b8'), BARK = V.tones('#8a5a3a');
g.fillStyle = P.lin(g, 0, 0, 0, 1100, [[0, SKY[0]], [1, SKY[1]]]); g.fillRect(0, 0, W, 1100);
if (night) { g.fillStyle = '#eaf2ff'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(r() * W, r() * 700, 1.5 + r() * 2, 0, 7); g.fill(); } g.beginPath(); g.arc(560, 260, 90, 0, 7); g.fillStyle = '#dfe9ff'; g.fill(); }
else for (const [x, y, s] of [[170, 330, 70], [540, 240, 52], [760, 430, 42]]) { g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + (i - 2) * s * 0.55, y - Math.sin(i / 4 * Math.PI) * s * 0.5, s * (0.35 + 0.3 * Math.sin(i / 4 * Math.PI)), 0, 7); g.fill(); } g.fillStyle = alpha2('#9fb6d8', 0.5); g.beginPath(); g.ellipse(x, y + s * 0.12, s * 1.25, s * 0.22, 0, 0, 7); g.fill(); }
function alpha2(h, a) { return P.alpha(h, a); }
// the far hills: flat rounded shapes, a lighter rim along the top, pushed toward the sky
for (const [t, y0, amps, ph] of [[HILL, 760, 60, 0.3], [HILL2, 860, 44, 1.9]]) { const ridge = x => y0 + amps * Math.sin(x / 150 + ph) + amps * 0.4 * Math.sin(x / 61 + ph * 2); g.beginPath(); g.moveTo(0, 1200); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge(x)); g.lineTo(W, 1200); g.closePath(); g.fillStyle = t.base; g.fill(); g.beginPath(); for (let x = 0; x <= W; x += 4) x ? g.lineTo(x, ridge(x)) : g.moveTo(x, ridge(x)); g.lineWidth = 10; g.strokeStyle = P.alpha(t.light, 0.7); g.stroke(); }
// the ground: flat green, a lighter band at the far edge, lighter patches
g.fillStyle = GRASS.base; g.fillRect(0, 960, W, 900); g.fillStyle = GRASS.light; g.beginPath(); g.moveTo(0, 1000); for (let x = 0; x <= W; x += 4) g.lineTo(x, 960 + 12 * Math.sin(x / 80)); g.lineTo(W, 960); g.lineTo(W, 1000); g.closePath(); g.fill();
for (let i = 0; i < 14; i++) V.patch(g, r() * W, 1020 + r() * 230, 50 + r() * 60, 14 + r() * 10, P.alpha(GRASS.light, 0.55));
// the tree line and bushes
for (let i = 0; i < 7; i++) { const x = 40 + i * 130 + (i % 2) * 30, y = 1010 + (i % 3) * 14, s = 0.8 + (i % 3) * 0.15; V.foliage(g, x, y - 90 * s, 70 * s, 54 * s, 300 + i, i % 2 ? LEAF2 : LEAF, { n: 8 }); }
for (let i = 0; i < 9; i++) { const x = i * 100 + 30, y = 1080 + (i % 2) * 20; V.foliage(g, x, y, 60, 34, 400 + i, i % 3 ? LEAF : LEAF2, { n: 7 }); }
// the near tree with a trunk, and a bush at its foot
V.shaded(g, () => { g.beginPath(); g.moveTo(96, 1286); g.quadraticCurveTo(112, 1180, 118, 1070); g.lineTo(150, 1070); g.quadraticCurveTo(156, 1180, 170, 1286); g.closePath(); }, BARK, 10);
V.foliage(g, 134, 960, 150, 112, 21, LEAF, { n: 10 }); V.foliage(g, 230, 1240, 90, 48, 22, LEAF2, { n: 7 });
// the path: rounded stone blocks laid along the walk line
for (let i = 0; i < 9; i++) { const x = 300 + i * 62 + (i % 2) * 8, y = 1300 + (i % 3) * 10, w = 52 + (i % 3) * 8, h = 22 + (i % 2) * 6; V.block(g, x, y, w, h, STONE, 8); }
for (let i = 0; i < 6; i++) { const x = 40 + i * 140, y = 1360 + (i % 2) * 30; V.block(g, x, y, 44 + (i % 3) * 10, 18, STONE, 7); }
// the soil band under the grass edge, as rounded dark earth with lighter clods
g.fillStyle = V.tones('#6b4a3a').shade; g.fillRect(0, GY + 30, W, H - GY); g.fillStyle = GRASS.base; g.beginPath(); g.moveTo(0, GY + 30); for (let x = 0; x <= W; x += 6) g.lineTo(x, GY + 30 - 10 - 8 * Math.abs(Math.sin(x / 22))); g.lineTo(W, GY + 30); g.closePath(); g.fill();
for (let i = 0; i < 30; i++) V.patch(g, r() * W, GY + 60 + r() * 400, 16 + r() * 22, 9 + r() * 8, P.alpha(V.tones('#6b4a3a').base, 0.9));
C.hud(g, night ? 'Moonlit Meadow' : 'Sunny Meadow'); C.fightUi(g);
P.save(cv, OUT); console.log('wrote', OUT);
