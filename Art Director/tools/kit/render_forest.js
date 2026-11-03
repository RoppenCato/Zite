// render_forest.js: the Wobblewood Forest board kit into the game's form (Mitch, AD, 2026-11-01). Lighter than the meadows' on purpose: the game strokes its roads in code and the
// cover and banner are shared, so this is one 512 square ground atlas and one props atlas. Same frame names as the meadows wherever a piece is the same kind.
//   node tools/kit/render_forest.js  -> out/board_forest/, then node tools/kit/board_test.js forest
const P = require('../paint.js'); const I = require('../ink.js'); const K = require('./cloverfield.js'); const W = require('./wobblewood.js'); const path = require('path'); const fs = require('fs');
const C = K.C, OUT = path.resolve(__dirname, '../../out/board_forest'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const FILE = 2, PROPS = 1.3, MARK = 1.6;
function piece(w, h, ox, oy, draw) { const cv = P.createCanvas(w * FILE, h * FILE), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.scale(FILE, FILE); g.translate(ox, oy); draw(g); const t = P.trim(cv, 1, 2); return { cv: t.cv, foot: [ox * FILE - t.x, oy * FILE - t.y] }; }
const prop = (fn, k = PROPS, w = 300, h = 320) => piece(w, h, w / 2, h - 30, g => { g.scale(k, k); fn(g); });
const PIECES = [
  ['wobble_a', 'wild ground, leaning right', prop(g => W.wobble(g, 0, 0, 1, 1, 1))], ['wobble_b', 'wild ground, leaning left', prop(g => W.wobble(g, 0, 0, 1, 2, -1))],
  ['tall_a', 'wild ground, old giants, few', prop(g => W.tall(g, 0, 0, 1, 3), 1.2)],
  ['fir_a', 'wild ground, dark corners', prop(g => K.pine(g, 0, 0, 1.05, 4))],
  ['big_mush_a', 'anywhere, magenta', prop(g => W.bigMush(g, 0, 0, 1, 0, 11))], ['big_mush_b', 'anywhere, teal', prop(g => W.bigMush(g, 0, 0, 1.15, 1, 12))], ['big_mush_c', 'anywhere, orange', prop(g => W.bigMush(g, 0, 0, 0.82, 2, 13))],
  ['log', 'wild ground', prop(g => W.log(g, 0, 0, 1, 21))], ['stump', 'wild ground', prop(g => W.stump(g, 0, 0, 1, 22))], ['roots', 'wild ground, near old trees', prop(g => W.roots(g, 0, 0, 1, 23))],
  ['fern_a', 'ground detail', prop(g => W.fern(g, 0, 0, 1, 24))], ['fern_b', 'ground detail', prop(g => W.fern(g, 0, 0, 0.78, 25))], ['bells', 'ground detail', prop(g => W.bells(g, 0, 0, 26, 1.1))],
  ['bush_a', 'at a tree\'s foot', prop(g => K.bush(g, 0, 0, 1, 6, 0))], ['bush_b', 'at a tree\'s foot', prop(g => K.bush(g, 0, 0, 1, 7, 1))],
  ['rock_a', 'where the ground breaks', prop(g => K.rock(g, 0, 0, 1, 9, 0))], ['rock_b', 'where the ground breaks', prop(g => K.rock(g, 0, 0, 1, 10, 1))],
  ['tuft_a', 'ground detail', prop(g => K.tuft(g, 0, 0, 1.2, 12))], ['tuft_b', 'ground detail', prop(g => K.tuft(g, 0, 0, 1, 22))], ['flowers_a', 'ground detail', prop(g => K.flowers(g, 0, -3, 13, 1.3, 6))],
  ['clover', 'moss, flat', prop(g => K.cloverPatch(g, 0, -4, 1.2, 14))], ['worn', 'trodden ground, flat, round hubs', prop(g => K.wornPatch(g, 0, -10, 40, 18, 11, C.worn))],
  ['mushrooms', 'at a tree\'s foot', prop(g => { K.mushroom(g, -5, 0, 1.1, 15); K.mushroom(g, 5, 2, 0.9, 16); })], ['pebbles', 'along the roads', prop(g => K.pebbles(g, 0, -2, 17, 5))],
  ['fence', 'Tumbletree', prop(g => K.fence(g, -20, 0, 40, 1))], ['barrel', 'Tumbletree, the shop', prop(g => K.barrel(g, 0, 0, 1))], ['sack', 'Tumbletree, the shop', prop(g => K.sack(g, 0, 0, 1))], ['quest_board', 'Wobblewood Board', prop(g => K.questBoard(g, 0, 0, 1), MARK)], ['apothecary', 'Fungal Apothecary', prop(g => K.apothecary(g, 0, 0, 1, 1), 1.45)],
  ['tree_house_a', 'Tumbletree Village', prop(g => W.treeHouse(g, 0, 0, 1, 0, 31), MARK)], ['tree_house_b', 'Tumbletree Village', prop(g => W.treeHouse(g, 0, 0, 1, 1, 32), MARK)], ['tree_house_c', 'Tumbletree Village', prop(g => W.treeHouse(g, 0, 0, 1, 2, 33), MARK)],
  ['tumbletree', 'Tumbletree Village, its great tree', prop(g => W.tumbletree(g, 0, 0, 1), 1.4, 340, 340)], ['hollow_log', 'Hollow Log Shop', prop(g => W.hollowLog(g, 0, 0, 1), MARK)], ['upside_tree', 'The Upside-Down Tree', prop(g => W.upsideTree(g, 0, 0, 1), 1.45)],
  ['fungal_ring', 'Fungal Ring', prop(g => W.fungalRing(g, 0, 0, 1), MARK)], ['root_bridge', 'Root Bridge', prop(g => W.rootBridge(g, 0, 0, 1), MARK)], ['owl_tree', 'Owl Hollow', prop(g => W.owlTree(g, 0, 0, 1), 1.45)], ['glade_gate', 'Grumblebark\'s Glade', prop(g => W.gladeGate(g, 0, 0, 1), 1.45, 340, 340)],
  ['church', 'Oakshade Church, under its oak', prop(g => W.chapel(g, 0, 0, 1), 1.45, 340, 340)], ['shrine', 'Mossy Shrine', prop(g => K.shrine(g, 0, 0, 1.2), MARK)], ['spring', 'Dewdrop Pool', prop(g => K.spring(g, 0, 0, 1.2), MARK)],
];
const SPOTS = [['wild', 56, 'a wild spot'], ['town', 90, 'a town hub'], ['shop', 90, 'a shop hub'], ['chest', 56, 'a chest spot'], ['spring', 56, 'a spring spot'], ['shrine', 56, 'a shrine spot'], ['board', 56, 'a quest board hub'], ['gear', 56, 'a loot spot, roll for basic gear'], ['shop_magic', 90, 'a magic shop hub'], ['church', 56, 'a church hub'], ['gate', 120, 'the boss hub']];
const BASE = { wild: 24, town: 44, shop: 24, chest: 24, spring: 24, shrine: 24, church: 24, board: 24, gear: 24, shop_magic: 24, gate: 36 };
for (const [kind, width, what] of SPOTS) PIECES.push([`spot_${kind}`, what, piece(width + 30, width + 30, (width + 30) / 2, (width + 30) / 2, g => { g.scale(2, 2); K.plate(g, 0, 0, kind, width / (BASE[kind] * 2)); }), { center: true }]);
function tile(w, h, draw) { const cv = P.createCanvas(w * FILE, h * FILE), g = cv.getContext('2d'); g.scale(FILE, FILE); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.fillStyle = C.meadow; g.fillRect(0, 0, w, h); P.wrapped(g, w, h, () => draw(g, w, h)); return cv; }
const soft = (g, x, y, rx, ry, col, seed, a = 0.3) => { const q = P.rng(seed), L = []; for (let i = 0; i < 10; i++) { const t = i / 10 * 6.283; L.push([x + Math.cos(t) * rx * (1 + (q() - 0.5) * 0.4), y + Math.sin(t) * ry * (1 + (q() - 0.5) * 0.4)]); } for (let k = 2; k >= 0; k--) { g.save(); g.globalAlpha = a; const c = 1 + k * 0.1; g.translate(x, y); g.scale(c, c); g.translate(-x, -y); I.fill(g, I.spline(L), col); g.restore(); } };
const leaves = (g, seed, n) => { const q = P.rng(seed); for (let i = 0; i < n; i++) { const x = 8 + q() * 112, y = 8 + q() * 112, a = q() * 6.283; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = ['#e8b84a', '#d8843e', '#8fd070'][i % 3]; g.beginPath(); g.ellipse(0, 0, 2.4, 1.2, 0, 0, 7); g.fill(); g.restore(); } };
const GROUND = [
  ['ground_a', 'plain moss', tile(128, 128, g => { soft(g, 40, 50, 30, 13, C.clover, 1, 0.16); soft(g, 96, 100, 26, 11, C.meadowShade, 2, 0.12); })],
  ['ground_b', 'plain moss', tile(128, 128, g => { soft(g, 90, 30, 28, 12, C.meadowShade, 3, 0.12); soft(g, 28, 92, 26, 11, C.clover, 4, 0.16); })],
  ['ground_c', 'moss with fallen leaves', tile(128, 128, g => { soft(g, 64, 64, 38, 18, C.clover, 5, 0.18); leaves(g, 6, 7); })],
];
function pack(name, items, extrude, MAXW) {
  const PAD = 3, pot = v => 1 << Math.ceil(Math.log2(Math.max(1, v))); const order = [...items].sort((a, b) => b.cv.height - a.cv.height);
  const shelf = W0 => { let x = PAD, y = PAD, rh = 0; const pl = []; for (const f of order) { if (x + f.cv.width + PAD > W0) { x = PAD; y += rh + PAD; rh = 0; } pl.push({ f, x, y }); x += f.cv.width + PAD; rh = Math.max(rh, f.cv.height); } return { pl, H: y + rh + PAD }; };
  const s = shelf(MAXW); if (s.H > 2048) console.warn('!! the atlas runs past 2048 for', name); const H = pot(s.H), cv = P.createCanvas(MAXW, H), g = cv.getContext('2d'), json = { frames: {}, meta: { image: name + '.png', size: { w: MAXW, h: H }, scale: '1', format: 'RGBA8888', app: 'Art Director/tools/kit/render_forest.js', filePx: 2 } };
  for (const { f, x, y } of s.pl) { if (extrude) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(f.cv, x + dx, y + dy); g.drawImage(f.cv, x, y); const w = f.cv.width, h = f.cv.height, foot = f.foot || [w / 2, h / 2]; json.frames[f.name] = { frame: { x, y, w, h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w, h }, sourceSize: { w, h }, pivot: { x: +(foot[0] / w).toFixed(4), y: +(foot[1] / h).toFixed(4) } }; }
  P.save(cv, path.join(OUT, name + '.png')); fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(json, null, 1)); console.log(name, MAXW + 'x' + H, items.length, 'pieces', Math.round(s.H / H * 100) + '% of its height used'); return cv;
}
const propItems = PIECES.map(([name, what, p, o]) => ({ name, what, cv: p.cv, foot: p.foot, center: o && o.center })), groundItems = GROUND.map(([name, what, cv]) => ({ name, what, cv }));
pack('board_props', propItems, false, 1024); pack('board_ground', groundItems, true, 1024);
const dsg = v => Math.round(v / FILE), lines = propItems.map(f => `| \`${f.name}\` | ${f.what} | ${dsg(f.cv.width)} by ${dsg(f.cv.height)} | ${f.center ? 'the centre, where the token stands' : `${dsg(f.foot[0])}, ${dsg(f.foot[1])}`} |`);
fs.writeFileSync(path.join(OUT, 'NOTES.md'), fs.readFileSync(path.join(__dirname, 'forest_notes.md'), 'utf8') + `\n## The props and the spots (\`board_props\`, pivot at the foot)\n\n| Piece | Belongs to | Size (design px) | Foot from the top left (design px) |\n| --- | --- | --- | --- |\n${lines.join('\n')}\n`);
console.log('wrote', OUT);
