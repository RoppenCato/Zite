// meadow_scene.js: lays the Sunny Meadow's kits as the two screens, at phone size (Perry, AD, 2026-10-31): the board
// (the raised camera: horizon, shore, plates, a plateau with cliff faces, roads from the mask pieces, the gold spaces, props
// from above, our player and the monster upright and sorted by depth) and the fight (the planes stacked, the ground band
// from the grid pieces, props side on, our player and the monster on the walk line). Also writes the layer file the parallax
// preview reads. Everything comes from kit.json and the kit's files, so what is judged is what the game would lay.
//   node tools/meadow_scene.js [--kit work/meadow/kit] [--out work/meadow] [--monster out/turnip/turnip.json] [--frame stand_00]
const P = require('./paint.js'); const { player, load } = require('./player.js'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const KIT = path.resolve(ROOT, opt('kit') || 'work/meadow/kit'), OUT = path.resolve(ROOT, opt('out') || 'work/meadow'), W = 824, H = 1830;   // the phone at 2x
const kit = JSON.parse(fs.readFileSync(path.join(KIT, 'kit.json'), 'utf8')); const cache = {}; const img = async f => cache[f] || (cache[f] = await P.loadImage(path.join(KIT, f)));
const rng = P.rng(3);
async function monster() {   // the monster's atlas, if there is one yet: a frame drawn by its origin
  const j = opt('monster'); if (!j) return null; const J = JSON.parse(fs.readFileSync(path.resolve(ROOT, j), 'utf8')), im = await P.loadImage(path.join(path.dirname(path.resolve(ROOT, j)), J.meta.image));
  const name = opt('frame') || J.actions.stand.frames[0].name, fr = J.frames[name].frame, data = Object.values(J.actions).flatMap(A => A.frames).find(f => f.name === name);
  return { draw: (g, x, y, flip, s = 1) => { g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.drawImage(im, fr.x, fr.y, fr.w, fr.h, -data.origin.x, -data.origin.y, fr.w, fr.h); g.restore(); }, w: fr.w, h: fr.h };
}
function hud(g, title) {   // the game's chrome, drawn plainly so the picture reads as a screen (the chrome itself is the game's)
  g.save(); g.scale(2, 2); g.fillStyle = 'rgba(248,236,198,0.95)'; g.beginPath(); P.rr(g, 14, 14, 384, 62, 14); g.fill(); P.ink(g, 3); P.label(g, 'Robin  Lv 4', 70, 36, 16, P.INK); g.fillStyle = '#fff'; g.beginPath(); P.rr(g, 70, 48, 150, 12, 6); g.fill(); P.ink(g, 1.5); g.fillStyle = '#6ed34a'; g.beginPath(); P.rr(g, 72, 50, 110, 8, 4); g.fill(); P.label(g, '120', 330, 44, 16, P.INK); g.beginPath(); g.arc(360, 44, 8, 0, 7); g.fillStyle = '#ffcc33'; g.fill(); P.ink(g, 1.5);
  g.fillStyle = 'rgba(248,236,198,0.92)'; g.beginPath(); P.rr(g, 120, 90, 172, 28, 14); g.fill(); P.ink(g, 2.5); P.label(g, title, 206, 104, 15, P.INK, { align: 'center' }); g.restore();
}
function roll(g) { g.save(); g.scale(2, 2); g.beginPath(); g.arc(206, 850, 44, 0, 7); g.fillStyle = P.rad(g, 192, 834, 206, 850, 44, [[0, '#ffe680'], [0.6, '#ffcc33'], [1, '#d99a12']]); g.fill(); P.ink(g, 3.5); P.label(g, 'ROLL', 206, 852, 22, P.INK, { align: 'center' }); g.restore(); }
function fightUi(g) { g.save(); g.scale(2, 2); g.fillStyle = 'rgba(248,236,198,0.95)'; g.beginPath(); P.rr(g, 14, 696, 384, 190, 16); g.fill(); P.ink(g, 3); [['ATTACK', 24, 710, '#e8503e'], ['SKILL', 210, 710, '#3f7fd8'], ['ITEM', 24, 800, '#6ab85a'], ['DEFEND', 210, 800, '#8a8f98']].forEach(([t, x, y, c]) => { g.beginPath(); P.rr(g, x, y, 178, 76, 14); g.fillStyle = c; g.fill(); P.ink(g, 3); P.label(g, t, x + 89, y + 40, 20, '#fff', { align: 'center', stroke: P.INK, strokeW: 5 }); }); g.restore(); }
const pick = arr => arr[Math.floor(rng() * arr.length)];

async function fight() {
  const cv = P.createCanvas(W, H), g = cv.getContext('2d'), M = await monster();
  for (const L of kit.fight.background) { const im = await img(L.file); if (L.type === 0) { g.drawImage(im, L.x || 0, L.y); continue; } for (let x = 0; x < W; x += im.width) g.drawImage(im, x, L.y); }
  const T = kit.fight.tiles, GY = 1290, cols = Math.ceil(W / kit.grid.w) + 1;
  for (let c = 0; c < cols; c++) { const x = c * kit.grid.w - 100; const e = pick(T.enH0); g.drawImage(await img(e.file), x, GY - e.h); for (let r = 0; r < 3; r++) { const b = pick(T.bsc); g.drawImage(await img(b.file), x, GY + r * kit.grid.h); } }
  const walk = GY - 20, objs = Object.fromEntries(kit.fight.objects.map(o => [o.name, o]));
  const place = async (name, x, y, s = 1) => { const o = objs[name]; if (!o) return; const im = await img(o.file); g.drawImage(im, x - o.foot[0] * s, y - o.foot[1] * s, im.width * s, im.height * s); };
  for (const [n, x, y] of [['tree', 110, walk - 6], ['bush_yellow', 20, walk + 2], ['signpost', 40, walk - 2], ['fence', 790, walk - 8], ['bush', 840, walk + 2], ['rock_small', 420, walk + 2], ['mushrooms', 470, walk + 4], ['flowers', 360, walk + 4], ['grass_tuft', 200, walk + 6], ['grass_tuft2', 540, walk + 6], ['grass_tuft3', 700, walk + 6], ['flowers3', 760, walk + 6]]) await place(n, x, y);
  g.save(); g.scale(2, 2); player(g, 125, walk / 2, 1); g.restore();
  if (M) M.draw(g, 590, walk, false); else { P.tag(g, 'the monster stands here', 520, walk - 40, 18); }
  hud(g, 'Sunny Meadow'); fightUi(g);
  P.save(cv, path.join(OUT, 'fight.png'));
  // the layer file for the parallax preview (its columns: file type x y rx ry cx cy a front ox oy; rx = -100 * factor; y places the layer's top with the camera at 0)
  const rows = ['file\ttype\tx\ty\trx\try\tcx\tcy\ta\tfront\tox\toy'];
  for (const L of kit.fight.background) rows.push([path.join(KIT, L.file).replace(/\\/g, '/'), L.type === 4 ? 1 : L.type, 0, L.y - H / 2, -100 * L.factor, 0, 0, 0, 255, 0, 0, 0].join('\t'));
  fs.writeFileSync(path.join(OUT, 'fight-layers.tsv'), rows.join('\n') + '\n');
  console.log('wrote', path.join(OUT, 'fight.png'), 'and fight-layers.tsv');
}

async function board() {
  const cv = P.createCanvas(W, H), g = cv.getContext('2d'), B = kit.board, M = await monster();
  // the horizon: the sky, the clouds, the sea, the islands; all pinned to the top of the screen
  for (const L of B.horizon) { const im = await img(L.file); if (L.type === 0) { g.drawImage(im, L.name === 'island_1' ? 520 : 40, L.y); continue; } for (let x = 0; x < W; x += im.width) g.drawImage(im, x, L.y, im.width, L.name === 'sky' ? 460 : im.height); }
  // the land: plates on the grid from the shore row down
  const LAND = 464, cw = 256, ch = 128, rows = Math.ceil((H - LAND) / 256) + 1, colsN = Math.ceil(W / 256) + 1;
  for (let r = 0; r < rows; r++) for (let c = 0; c < colsN; c++) { const p = pick(B.ground); g.drawImage(await img(p.file), c * 256 - 64, LAND + r * 256); }
  for (const [k, x, y] of [['light', 300, 900], ['dark', 620, 1200], ['flowers', 150, 1500], ['light', 700, 1600], ['flowers', 560, 760], ['dirt', 424, 880], ['dirt', 560, 1310], ['dark', 140, 1100], ['flowers', 700, 1680], ['light', 120, 1700]]) { const p = B.patches.find(q => q.file.includes(k)); const im = await img(p.file); g.drawImage(im, x - im.width / 2, y - im.height / 2); }
  for (let c = -1; c < colsN; c++) g.drawImage(await img(B.shore.n.file), c * cw + 40, LAND);
  // the plateau: cells (col 1 to 2, rows 2 to 3) raised one step; its plates stay where they are, the cliff faces below its front edge sell the step
  const PX0 = 40 + 1 * cw, PY0 = LAND + 2 * ch, PW = 1 * cw, PH = 2 * ch;   // one cell wide, two deep: the hill the house stands on
  g.save(); g.beginPath(); g.rect(PX0, PY0, PW, PH); g.clip(); g.drawImage(await img(B.plateau[0].file), PX0, PY0); g.restore();
  g.drawImage(await img(B.cliff.edge_n.file), PX0, PY0 - 10, PW, 28); for (let y = PY0; y < PY0 + PH; y += 128) { g.drawImage(await img(B.cliff.edge_w.file), PX0 - 10, y); g.drawImage(await img(B.cliff.edge_e.file), PX0 + PW, y); }
  g.drawImage(await img(B.cliff.front[0].file), PX0, PY0 + PH - 14);
  g.drawImage(await img(B.cliff.corner_sw.file), PX0 - 96 + 8, PY0 + PH - 14); g.drawImage(await img(B.cliff.corner_se.file), PX0 + PW - 8, PY0 + PH - 14);
  // the roads: a path of cells with their masks, from the bottom left up past the hill to the shore; the spaces at some cells
  const cells = [[0, 9, 'E'], [1, 9, 'NW'], [1, 8, 'NS'], [1, 7, 'NS'], [1, 6, 'NS'], [1, 5, 'ES'], [2, 5, 'NW'], [2, 4, 'NS'], [2, 3, 'NS'], [2, 2, 'NS'], [2, 1, 'S']];
  const at = (c, r) => [40 + c * cw, LAND + r * ch];
  for (const [c, r, m] of cells) { const [x, y] = at(c, r); g.drawImage(await img(B.road[m].file), x, y); }
  const spaces = [[0, 9, 'shop'], [1, 8, null], [1, 7, 'battle'], [1, 5, 'event'], [2, 4, null], [2, 3, 'town'], [2, 2, 'treasure'], [2, 1, 'boss']];
  const plate = await img(B.space.plate.file), lit = await img(B.space.lit.file);
  const sp = []; for (const [c, r, k] of spaces) { const [x, y] = at(c, r); sp.push([x + cw / 2, y + ch / 2, k]); }
  for (const [x, y, k] of sp) { g.drawImage(plate, x - B.space.plate.origin[0], y - B.space.plate.origin[1]); if (k) { const d = B.space.discs[k]; const im = await img(d.file); g.drawImage(im, x - d.origin[0], y - d.origin[1]); } }
  for (const i of [2, 3]) g.drawImage(lit, sp[i][0] - B.space.lit.origin[0], sp[i][1] - B.space.lit.origin[1]);
  // the upright things, sorted by the foot's y: props from above, the player, the monster
  const objs = Object.fromEntries(B.objects.map(o => [o.name, o])), items = [];
  const prop = (name, x, y, s = 1) => { const o = objs[name]; if (o) items.push({ y, draw: async () => { const im = await img(o.file); g.drawImage(im, x - o.foot[0] * s, y - o.foot[1] * s, im.width * s, im.height * s); } }); };
  [['tree', 90, 620], ['tree_round', 250, 570], ['tree', 770, 600], ['tree_small', 60, 1040], ['tree', 790, 1000], ['tree_round', 780, 1340], ['tree', 720, 1720], ['tree_small', 120, 1770], ['tree', 40, 1420], ['tree_small', 560, 1810]].forEach(([n, x, y]) => prop(n, x, y));
  for (const [n, x, y] of [['house', 424, 850], ['signpost', 300, 1120], ['well', 560, 1290], ['lamp', 560, 1130], ['crates', 200, 1300], ['barrel', 262, 1332], ['fence', 120, 1470], ['fence', 264, 1470], ['bench', 120, 1560], ['haystack', 560, 1600], ['log', 280, 1600], ['stump', 120, 1640],
    ['rock', 720, 1180], ['rock_small', 150, 960], ['rocks', 780, 1540], ['rock_small', 600, 560], ['bush', 200, 1180], ['bush_wide', 120, 1250], ['bush_yellow', 760, 880], ['bush', 740, 1440], ['mushrooms', 200, 950], ['mushrooms', 640, 1500],
    ['grass_tuft', 100, 700], ['grass_tuft2', 300, 640], ['grass_tuft3', 600, 700], ['grass_tuft', 760, 760], ['grass_tuft2', 80, 880], ['grass_tuft3', 200, 1060], ['grass_tuft', 360, 1080], ['grass_tuft2', 540, 1000], ['grass_tuft3', 760, 1120], ['grass_tuft', 100, 1360], ['grass_tuft2', 520, 1440], ['grass_tuft3', 340, 1500], ['grass_tuft', 600, 1700], ['grass_tuft2', 240, 1740], ['grass_tuft3', 700, 1600], ['grass_tuft', 440, 1240],
    ['flowers', 150, 760], ['flowers2', 620, 640], ['flowers3', 260, 1000], ['flowers', 720, 1300], ['flowers2', 80, 1540], ['flowers3', 480, 1500], ['flowers', 360, 1700], ['flowers2', 560, 1760], ['flowers3', 700, 1000]]) prop(n, x, y);
  items.push({ y: sp[3][1] + 1, draw: async () => { g.save(); g.scale(2, 2); player(g, sp[3][0] / 2, sp[3][1] / 2 + 2, 0.6); g.restore(); } });   // the board's scale is 0.6 of the fight's
  if (M) items.push({ y: sp[2][1] + 1, draw: async () => M.draw(g, sp[2][0], sp[2][1] + 2, false, 0.6) });
  items.sort((p, q) => p.y - q.y); for (const it of items) await it.draw();
  hud(g, 'Sunny Meadow'); roll(g);
  P.save(cv, path.join(OUT, 'board.png')); console.log('wrote', path.join(OUT, 'board.png'));
}
(async () => { await load(); await fight(); await board(); })();
