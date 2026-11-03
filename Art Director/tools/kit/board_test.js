// board_test.js: the board kit laid on the REAL Cloverfield graph (the game's rules/data/world.json hubs and roads, its
// curve formula), drawing only frames from the delivered atlases, as the game would (Mitch, AD, 2026-11-01). World pixels
// under a camera at 0.8, at 412 by 915 with the HUD's bands, centred where asked. Placement is seeded and deterministic and
// keeps clear of every spot and road: this is also the placement rule offered to Miles, GD.
//   node tools/kit/board_test.js  -> work/board_test/{puddlewick,crossroads,whole}.jpg
const P = require('../paint.js'); const R = require('../hybrid/rig.js'); const path = require('path'); const fs = require('fs');
const FOREST = process.argv[2] === 'forest'; if (FOREST) require('./wobblewood.js');
const IN = path.resolve(__dirname, FOREST ? '../../out/board_forest' : '../../out/board_meadows'), OUT = path.resolve(__dirname, FOREST ? '../../work/forest_test' : '../../work/board_test'); fs.mkdirSync(OUT, { recursive: true });
const WORLD = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../Game Developer/rules/data/world.json'), 'utf8')); const AREA = WORLD.areas[FOREST ? 1 : 0];
const KINDS = { n: 'wild', t: 'chest', p: 'spring', s: 'shrine' }, HUB = { town: 'town', shop: 'shop', normal: 'wild', potion: 'spring', chest: 'chest', spell: 'shrine', church: 'church', board: 'board', boss: 'gate' };
(async () => {
  await R.loadMasters();
  const load = async n => { const J = JSON.parse(fs.readFileSync(path.join(IN, n + '.json'), 'utf8')); return { J, im: await P.loadImage(path.join(IN, n + '.png')) }; };
  const A = await load('board_props'), G = await load('board_ground');
  const draw = (g, at, name, x, y, o = {}) => { const f = at.J.frames[name]; if (!f) throw new Error('no frame ' + name); const r = f.frame, k = (o.scale || 1) / 2; g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.flipY) g.scale(1, -1); g.drawImage(at.im, r.x, r.y, r.w, r.h, -f.pivot.x * r.w * k, -f.pivot.y * r.h * k, r.w * k, r.h * k); g.restore(); };
  // the graph
  const hubs = Object.fromEntries(AREA.hubs.map(h => [h.id, h])), cx = AREA.hubs.reduce((s, h) => s + h.x, 0) / AREA.hubs.length, cy = AREA.hubs.reduce((s, h) => s + h.y, 0) / AREA.hubs.length;
  const roads = AREA.roads.map(r => { const a = hubs[r.from], b = hubs[r.to], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; let px = -dy / L, py = dx / L; if (px * (mid.x - cx) + py * (mid.y - cy) < 0) { px = -px; py = -py; } const c = { x: mid.x + px * 2 * r.bow, y: mid.y + py * 2 * r.bow }, at = t => ({ x: (1 - t) * (1 - t) * a.x + 2 * t * (1 - t) * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * t * (1 - t) * c.y + t * t * b.y }); const n = r.kinds.length, spots = []; for (let i = 1; i <= n; i++) spots.push({ ...at(i / (n + 1)), kind: KINDS[r.kinds[i - 1]] || 'wild' }); const line = []; for (let i = 0; i <= 40; i++) line.push(at(i / 40)); return { ...r, line, spots }; });
  const spots = [...AREA.hubs.map(h => ({ x: h.x, y: h.y, kind: HUB[h.kind] || 'wild', hub: h })), ...roads.flatMap(r => r.spots)];
  const frameOf = name => A.J.frames[name].frame;
  const clearAt = (px, py, r) => { for (const s of spots) if (Math.hypot(s.x - px, s.y - py) < r + 34) return false; for (const rd of roads) for (const p of rd.line) if (Math.hypot(p.x - px, p.y - py) < r + 20) return false; return true; };
  // the area's real bounds, read from the running game (meadows: x 140, y 2120, 1120 by 1472; Thornwood begins at x 1240)
  const sx = spots.map(s => s.x), sy = spots.map(s => s.y), BX0 = FOREST ? Math.min(...sx) - 60 : 140, BX1 = FOREST ? Math.max(...sx) + 60 : 1240, BY0 = FOREST ? Math.min(...sy) - 60 : 2120, BY1 = FOREST ? Math.max(...sy) + 60 : 3592; if (FOREST) console.log('bounds', BX0, BX1, BY0, BY1);
  const clearBody = (name, x, y) => { const f = frameOf(name), w = f.w / 2, h = f.h / 2, r = Math.min(w * 0.3, 26); if (x - w * 0.5 < BX0 + 6 || x + w * 0.5 > BX1 - 6 || y + 6 > BY1 || y - h < BY0) return false; for (const k of [0, 0.25, 0.5, 0.75, 1]) for (const dx of (k > 0.2 ? [-w * 0.28, 0, w * 0.28] : [0])) if (!clearAt(x + dx, y - h * k * 0.9, r)) return false; return true; };
  const clear = (x, y, r) => clearAt(x, y, r);
  const roomy = (name, x, y) => placedNow.every(o => { if (o.name === 'hill' || name === 'hill' || (o.name === 'windmill' && name === 'sack')) return true; const a = frameOf(name), b = frameOf(o.name), need = (a.w + b.w) / 4 * 0.72; return Math.abs(o.x - x) > need || Math.abs(o.y - y) > 26; });
  const placedNow = [];
  const nudge = (name, x, y) => { if (clearBody(name, x, y) && roomy(name, x, y)) return [x, y]; for (let rr = 12; rr < 200; rr += 12) for (let a = 0; a < 16; a++) { const t = a / 16 * 6.283, nx = x + Math.cos(t) * rr, ny = y + Math.sin(t) * rr * 0.8; if (clearBody(name, nx, ny) && roomy(name, nx, ny)) return [nx, ny]; } return [x, y]; };
  // the landmarks, beside their hubs; offsets in world px, never on the spot
  const LANDMARK = { ashford: [['house_tile', -96, -34], ['house_loft', 92, -40], ['house_thatch', -118, 44], ['house_thatch', 112, 40], ['well', -66, 72], ['fence', -140, 74], ['barrel', 62, 66], ['sack', 76, 72], ['apple_a', 170, 72]], millford: [['old_mill', 86, -18], ['house_tile', -92, -24], ['rock_b', 150, 20]], crossroads: [['quest_board', 54, -24], ['gnarled_oak', -92, 26], ['flowers_a', 50, 28]], windy: [['apothecary', -82, -28], ['hill', 138, 40], ['sack', 170, 4], ['pine_a', 210, -30]], saltmarsh: [['pond', -4, 92], ['tuft_a', 66, 62], ['rock_a', -80, 70]], ravine: [['church', -46, -46], ['flowers_a', 46, -30], ['hedge_short', 62, 60], ['flowers_b', -20, 78]], tinker: [['barrel', 44, 14], ['sack', 56, 22], ['signpost_one', -44, 10]], hermit: [['apple_a', 66, -14], ['apple_b', 108, 14], ['apple_a', 60, 56], ['apple_b', -66, 6], ['spring', 0, 58]], cairn: [['rock_b', -60, 14], ['rock_a', 56, 22], ['mushrooms', 30, 40]], moon: [['shrine', 44, -8], ['flowers_a', -44, 18], ['pine_b', 96, -14]], gate: [['gate', 0, -46], ['rock_b', -86, 8], ['pine_a', 88, -6]] };
  if (FOREST) { for (const k of Object.keys(LANDMARK)) delete LANDMARK[k]; Object.assign(LANDMARK, {
    edge: [['quest_board', 54, -22], ['wobble_a', -88, -16], ['big_mush_c', 74, 34], ['fern_a', -46, 26]],
    thicket: [['apothecary', 70, -34], ['fungal_ring', -84, 10], ['bells', 54, 28], ['wobble_b', -118, -64]],
    briar: [['glade_gate', 0, -54], ['fir_a', -116, -8], ['fir_a', 112, -14], ['roots', -74, 34], ['roots', 76, 36]],
    elder: [['shrine', 54, -16], ['fern_b', -46, 18], ['tall_a', 104, -30], ['bells', 42, 28]],
    hollow: [['church', -96, -42], ['bells', 48, -26], ['fern_a', 54, 30]],
    pond: [['root_bridge', 78, 10], ['fern_b', -52, -24], ['big_mush_a', -66, 36]],
    mossy: [['hollow_log', -6, -56], ['barrel', 62, 12], ['sack', 74, 18], ['big_mush_a', -92, 22]],
    weaver: [['upside_tree', 66, -22], ['bells', -48, 18], ['fern_b', -56, -22]],
    brambleford: [['tumbletree', 4, -66], ['tree_house_a', -112, -30], ['tree_house_b', 262, -66], ['tree_house_c', -116, 66], ['tree_house_a', 6, 168], ['fence', -44, 84], ['barrel', 56, 62], ['sack', 68, 68], ['big_mush_c', -182, 18], ['big_mush_b', 186, 24]],
    dusk: [['spring', 44, -16], ['bells', -44, 18], ['big_mush_b', -70, -14], ['fern_a', 62, 24]],
    barrow: [['owl_tree', 62, -20], ['stump', -60, 18], ['fern_b', 30, 34]],
  }); }
  const placed = [];
  for (const [id, list] of Object.entries(LANDMARK)) for (const [name, dx, dy] of list) { const [x, y] = nudge(name, hubs[id].x + dx, hubs[id].y + dy); placed.push({ name, x: Math.round(x), y: Math.round(y), hub: id }); placedNow.push({ name, x, y }); if (name === 'hill') { placed.push({ name: 'windmill', x: Math.round(x), y: Math.round(y - 40), hub: id }); placedNow.push({ name: 'windmill', x, y: y - 40 }); } }
  const taken = () => placed.map(p => ({ x: p.x, y: p.y }));
  // the wild ground: clusters from a seed; each cluster a mix for its place, separated by calm space, kept off the roads
  const q = P.rng(FOREST ? 4711 : 2026), MINX = FOREST ? BX0 + 30 : 170, MAXX = FOREST ? BX1 - 30 : 1210, MINY = FOREST ? BY0 + 50 : 2170, MAXY = FOREST ? BY1 - 22 : 3570, MIX = FOREST ? [['wobble_a', 'wobble_b', 'fern_a', 'mushrooms'], ['wobble_b', 'bush_a', 'big_mush_a', 'tuft_a'], ['tall_a', 'roots', 'fern_b', 'bells'], ['tall_a', 'wobble_b', 'stump', 'fern_a'], ['fir_a', 'wobble_b', 'rock_a', 'fern_b'], ['big_mush_b', 'big_mush_c', 'bells', 'mushrooms'], ['log', 'fern_a', 'tuft_b', 'bells'], ['wobble_a', 'fir_a', 'bush_b', 'rock_b'], ['big_mush_a', 'stump', 'flowers_a', 'tuft_a']] : [['oak_a', 'oak_b', 'bush_a', 'mushrooms', 'tuft_a'], ['oak_c', 'bush_b', 'rock_a', 'tuft_b'], ['poplar_a', 'poplar_b', 'bush_a'], ['pine_a', 'pine_b', 'rock_b', 'tuft_a'], ['apple_a', 'apple_b', 'flowers_a', 'bush_b'], ['flowers_a', 'flowers_b', 'tuft_a', 'tuft_b', 'clover'], ['rock_a', 'rock_c', 'pebbles', 'tuft_b']];
  const clusters = []; for (let tries = 0; clusters.length < (FOREST ? 96 : 46) && tries < 1600; tries++) { const x = MINX + q() * (MAXX - MINX), y = MINY + q() * (MAXY - MINY); if (!clear(x, y, 30) || clusters.some(c => Math.hypot(c.x - x, c.y - y) < (FOREST ? 118 : 170)) || AREA.hubs.some(h => Math.hypot(h.x - x, h.y - y) < (h.kind === 'town' ? 240 : 190))) continue; clusters.push({ x, y }); const mix = MIX[Math.floor(q() * MIX.length)]; let n = 0; for (let i = 0; i < 6 && n < 4; i++) { const px = x + (q() - 0.5) * 90, py = y + (q() - 0.5) * 50; const nm = mix[n % mix.length]; if (!clearBody(nm, px, py) || taken().some(t => Math.hypot(t.x - px, t.y - py) < 26)) continue; placed.push({ name: nm, x: Math.round(px), y: Math.round(py) }); n++; } }
  { const ch = placed.find(p => p.name === 'church'); for (let i = placed.length - 1; i >= 0; i--) { const p = placed[i]; if (!p.hub && Math.abs(p.x - ch.x) < 130 && p.y > ch.y - 190 && p.y < ch.y + 50) placed.splice(i, 1); } }   // the church keeps its own sky: nothing wild grows behind it or on its steps
  if (FOREST) { const BIG = placed.filter(p => p.hub && /tree_house|tumbletree|hollow_log|owl_tree|upside_tree|glade_gate|church|root_bridge|fungal_ring|apothecary|quest_board/.test(p.name)); for (let i = placed.length - 1; i >= 0; i--) { const p = placed[i]; if (p.hub) continue; const a = frameOf(p.name); if (BIG.some(L => { const b = frameOf(L.name); return Math.abs(p.x - L.x) < (b.w + a.w) / 4 + 6 && p.y > L.y - b.h / 2 - 4 && p.y - a.h / 2 < L.y + 8; })) placed.splice(i, 1); } }   // a landmark is seen whole: nothing wild stands in front of it or grows out of it
  fs.writeFileSync(path.join(IN, FOREST ? 'placement_wobblewood.json' : 'placement_cloverfield.json'), JSON.stringify(placed, null, 0));
  const flats = placed.filter(p => p.name === 'clover' || p.name === 'worn' || p.name === 'hill'), upright = placed.filter(p => !flats.includes(p));
  // drawing the world under a camera
  function world(g, tx, ty, zoom, viewW, viewH) {
    g.save(); g.fillStyle = FOREST ? '#56ad72' : '#86cf5c'; g.fillRect(0, 0, viewW, viewH); g.scale(zoom, zoom); g.translate(-tx, -ty);
    const vx0 = tx, vy0 = ty, vx1 = tx + viewW / zoom, vy1 = ty + viewH / zoom, T = 128;
    for (let ix = Math.floor(vx0 / T); ix * T < vx1; ix++) for (let iy = Math.floor(vy0 / T); iy * T < vy1; iy++) { const h = ((ix * 7349 + iy * 9151) >>> 0) % 11; const name = h < 5 ? 'ground_a' : h < 8 ? 'ground_b' : h < 10 || FOREST ? 'ground_c' : 'ground_d'; const f = G.J.frames[name].frame; g.drawImage(G.im, f.x, f.y, f.w, f.h, ix * T, iy * T, T + 0.5, T + 0.5); }
    for (const id of FOREST ? ['brambleford', 'mossy', 'edge'] : ['ashford', 'crossroads', 'millford', 'windy']) draw(g, A, 'worn', hubs[id].x, hubs[id].y + 28, { scale: 2 });
    for (const f of flats) draw(g, A, f.name, f.x, f.y);
    // the roads: the straight piece repeated along the curve, turned to it; a round joint at each spot
    const SF = FOREST ? null : G.J.frames.road_straight.frame;
    if (FOREST) { for (const [lw, col] of [[30, '#7f6240'], [25, '#b58f5e'], [10, 'rgba(208,178,128,0.8)']]) { g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = col; for (const rd of roads) { g.beginPath(); rd.line.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke(); } } }
    if (!FOREST) for (const pass of [0, 1]) for (const rd of roads) { let run = 0; for (let i = 0; i < rd.line.length - 1; i++) { const a = rd.line[i], b = rd.line[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x); g.save(); g.translate(a.x, a.y); g.rotate(ang); let done = 0; while (done < L) { const u = (run % 64), step = Math.min(64 - u, L - done); const sy = pass ? 28 : 0, sh = pass ? 24 : 80, dy = pass ? -6 : -20, dh = pass ? 12 : 40; g.drawImage(G.im, SF.x + u * 2, SF.y + sy, step * 2, sh, done - (done + step >= L ? 0 : 0), dy, step + 0.6, dh); done += step; run += step; } g.restore(); } }
    if (!FOREST) for (const h of AREA.hubs) draw(g, G, 'road_junction', h.x, h.y);
    for (const s of [...spots].sort((a, b) => a.y - b.y)) draw(g, A, 'spot_' + s.kind, s.x, s.y);
    const items = upright.map(p => ({ y: p.y, fn: () => draw(g, A, p.name, p.x, p.y) }));
    items.push({ y: 0, fn: () => { const J = R.restPose(R.OUTFITS.tunic); g.save(); const x = TOKEN.x, y = TOKEN.y; g.fillStyle = 'rgba(28,38,70,0.3)'; g.beginPath(); g.ellipse(x, y, 13, 4.5, 0, 0, 7); g.fill(); g.translate(x, y); g.scale(0.55, 0.55); R.drawOutfit(g, J, R.OUTFITS.tunic); g.restore(); } });
    items[items.length - 1].y = TOKEN.y; items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
    for (const h of AREA.hubs) P.label(g, h.name, h.x, h.y + (h.kind === 'town' || h.kind === 'shop' ? 40 : h.kind === 'boss' ? 46 : 28), 13, '#fffaf0', { align: 'center', stroke: '#2a2436', strokeW: 3.5 });
    g.restore();
  }
  let TOKEN = { x: AREA.hubs[0].x, y: AREA.hubs[0].y };
  function screen(file, cxW, cyW, tok) {
    TOKEN = tok; const W = 412, H = 915, Y0 = 100, Y1 = 740, Z = 0.8, S = 2, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.fillStyle = '#1e1c26'; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.rect(0, Y0, W, Y1 - Y0); g.clip(); g.translate(0, Y0); world(g, cxW - W / 2 / Z, cyW - (Y1 - Y0) / 2 / Z, Z, W, Y1 - Y0); g.restore();
    P.label(g, 'Robin the Knight', 16, 24, 20, '#f4efe6'); P.label(g, 'Lv 2 · HP 46/120 · MP 20/20 · Gold 66', 16, 52, 13, '#b9b3c4', { weight: 'normal' }); P.label(g, AREA.name, 16, 76, 13, '#b9b3c4', { weight: 'normal' }); g.fillStyle = '#f4efe6'; g.beginPath(); P.rr(g, 336, 14, 56, 56, 10); g.fill(); P.label(g, '3', 364, 44, 26, '#1e1c26', { align: 'center' });
    P.label(g, 'Tap Roll to move Robin. Tap any spot to hear about it.', W / 2, 784, 12, '#e8e2d8', { align: 'center', weight: 'normal' }); [['Map', 58], ['World', 157], ['Bag', 255], ['Log', 353]].forEach(([t, x]) => { g.fillStyle = '#343044'; g.beginPath(); P.rr(g, x - 44, 818, 88, 36, 18); g.fill(); P.label(g, t, x, 836, 14, '#f4efe6', { align: 'center' }); }); g.fillStyle = '#4caf6e'; g.beginPath(); P.rr(g, 56, 860, 300, 50, 12); g.fill(); P.label(g, 'Roll', 206, 885, 20, '#f4efe6', { align: 'center' });
    fs.writeFileSync(path.join(OUT, file + '.png'), cv.toBuffer('image/png')); fs.writeFileSync(path.join(OUT, file + '.jpg'), cv.toBuffer('image/jpeg', 90));
  }
  if (FOREST) {
    screen('tumbletree', hubs.brambleford.x, hubs.brambleford.y - 100, { x: hubs.brambleford.x, y: hubs.brambleford.y });
    screen('glade', hubs.briar.x, hubs.briar.y + 110, { x: hubs.briar.x, y: hubs.briar.y });
    screen('oakshade', hubs.hollow.x - 20, hubs.hollow.y + 40, { x: hubs.hollow.x, y: hubs.hollow.y });
    { const Z = 0.33, W = 412, H = 640, S = 2, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; TOKEN = { x: hubs.brambleford.x, y: hubs.brambleford.y }; world(g, (BX0 + BX1) / 2 - W / 2 / Z, (BY0 + BY1) / 2 - H / 2 / Z, Z, W, H); fs.writeFileSync(path.join(OUT, 'whole.jpg'), cv.toBuffer('image/jpeg', 88)); }
    console.log('wrote', OUT, spots.length, 'spots', placed.length, 'props'); return;
  }
  screen('puddlewick', hubs.ashford.x, hubs.ashford.y - 170, { x: hubs.ashford.x, y: hubs.ashford.y });
  screen('crossroads', hubs.millford.x - 120, hubs.millford.y + 120, { x: hubs.crossroads.x, y: hubs.crossroads.y });
  screen('church', Math.min(hubs.ravine.x, 1240 - 412 / 2 / 0.8) , hubs.ravine.y - 80, { x: hubs.ravine.x, y: hubs.ravine.y });
  { const Z = 0.27, W = 412, H = 640, S = 2, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; TOKEN = { x: hubs.ashford.x, y: hubs.ashford.y }; world(g, 700 - W / 2 / Z, 2856 - H / 2 / Z, Z, W, H); fs.writeFileSync(path.join(OUT, 'whole.png'), cv.toBuffer('image/png')); fs.writeFileSync(path.join(OUT, 'whole.jpg'), cv.toBuffer('image/jpeg', 88)); }
  console.log('wrote', OUT, spots.length, 'spots', placed.length, 'props');
})();
