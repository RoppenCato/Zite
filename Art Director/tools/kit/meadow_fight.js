// meadow_fight.js: the Cloverfield Meadows fight backdrop as layers (Mitch, AD, 2026-11-01), in the board kit's hand:
// the sky is a code gradient (the colours in NOTES.md); three strips that tile sideways, each seamless; the ground band
// the fighters stand on. Design pixels, files at 2x. Far hills 1024 by 220 at scroll 0.15; the mid tree line 1024 by 300
// at 0.45; the near grass and hedge 1024 by 140 at 0.8 (drawn behind the fighters' feet); the ground band 512 by 160 at 1.
//   node tools/kit/meadow_fight.js  -> work/meadow_fight/{far,mid,near,ground}.png + fight.png (the composed phone screen)
const P = require('../paint.js'); const I = require('../ink.js'); const K = require('./cloverfield.js'); const path = require('path'); const fs = require('fs');
const { form, line, spline, pathOf, fill } = I; const C = K.C, PROP = K.PROP; const OUT = path.resolve(__dirname, '../../work/meadow_fight'); fs.mkdirSync(OUT, { recursive: true });
const S = 2;
function strip(w, h, draw) { const cv = P.createCanvas(w * S, h * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; P.wrapped(g, w, 0, () => draw(g, w, h)); return cv; }   // drawn at the wrapped offsets too, so the strip tiles
const SKY = ['#5fb0ec', '#cdebfb'], HAZE = '#cfe6f3';
function far(g, w, h) {   // rolling hills in haze, paler and bluer than the meadow, no line; a far windmill and a far village as silhouettes
  const q = P.rng(31);
  for (const [cx, rx, ry, col, seed] of [[160, 320, 120, '#b9dcc2', 1], [560, 360, 150, '#a9d3b4', 2], [900, 300, 110, '#b9dcc2', 3], [360, 240, 80, '#9fcba8', 4], [760, 220, 76, '#9fcba8', 5], [1100, 260, 100, '#a9d3b4', 6]]) { const L = []; for (let i = 0; i < 16; i++) { const t = i / 16 * 6.283; L.push([cx + Math.cos(t) * rx * (1 + (q() - 0.5) * 0.08), h - 30 + Math.sin(t) * ry * (1 + (q() - 0.5) * 0.08)]); } fill(g, spline(L, true, 6), col); }
  for (const [cx, cy, sc] of [[120, 50, 1.1], [420, 30, 1.4], [700, 70, 0.9], [940, 40, 1.2]]) { g.save(); g.translate(cx, cy); g.scale(sc, sc); const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([-40 + t * 80, -Math.sin(t * Math.PI) * (14 + 7 * Math.sin(t * 9))]); } pts.push([40, 5], [-40, 5]); form(g, pts, '#ffffff', { inkW: 1.1, ink: P.alpha(PROP, 0.3), shade: [[-40, 0], [40, 0], [40, 5], [-40, 5]], shadeCol: '#d6e6f2', shadeA: 0.9 }); g.restore(); }   // clouds, high in the strip
  g.fillStyle = '#8fbf9c'; for (const [x, s] of [[220, 0.5], [640, 0.6], [900, 0.45]]) { g.save(); g.translate(x, h - 56); g.scale(s, s); g.fillRect(-7, -30, 14, 30); g.beginPath(); g.moveTo(-9, -30); g.lineTo(0, -40); g.lineTo(9, -30); g.closePath(); g.fill(); g.save(); g.translate(0, -34); g.rotate(0.4); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(-1.5, -24, 3, 24); } g.restore(); g.restore(); }
  g.fillStyle = P.lin(g, 0, h - 120, 0, h, [[0, P.alpha(HAZE, 0)], [1, P.alpha(HAZE, 0.7)]]); g.fillRect(0, h - 120, w, 120);   // the haze at the hills' feet
}
function mid(g, w, h) {   // the tree line: oaks, poplars and apple trees in clusters with bushes at their feet, lighter and bluer than the near trees
  const hazed = { ...C, leaf: P.mix(C.leaf, HAZE, 0.3), leafShade: P.mix(C.leafShade, HAZE, 0.3), leafLight: P.mix(C.leafLight, HAZE, 0.3), leaf2: P.mix(C.leaf2, HAZE, 0.3), leaf2Shade: P.mix(C.leaf2Shade, HAZE, 0.3), leaf2Light: P.mix(C.leaf2Light, HAZE, 0.3), apple: P.mix(C.apple, HAZE, 0.3), appleShade: P.mix(C.appleShade, HAZE, 0.3), trunk: P.mix(C.trunk, HAZE, 0.3), trunkShade: P.mix(C.trunkShade, HAZE, 0.3), bush: P.mix(C.bush, HAZE, 0.3), bushShade: P.mix(C.bushShade, HAZE, 0.3), bushLight: P.mix(C.bushLight, HAZE, 0.3) };
  Object.assign(C, hazed);   // the kit draws with its palette; swap it for the hazed one while this strip is drawn
  const ground = h - 24; g.fillStyle = P.mix(C.meadow, HAZE, 0.25); g.fillRect(0, ground - 10, w, 40);
  const row = [[40, 'oak', 1.3, 11], [120, 'poplar', 1.3, 12], [150, 'bush', 1.2, 13], [230, 'apple', 1.2, 14], [300, 'oak', 1.5, 15], [360, 'bush', 1.1, 16], [430, 'poplar', 1.2, 17], [470, 'poplar', 1.4, 18], [560, 'oak', 1.25, 19], [620, 'apple', 1.1, 20], [680, 'bush', 1.3, 21], [760, 'oak', 1.45, 22], [850, 'poplar', 1.3, 23], [900, 'apple', 1.2, 24], [980, 'oak', 1.3, 25]];
  for (const [x, kind, s, seed] of row) { const y = ground + ((seed % 3) - 1) * 6; if (kind === 'bush') K.bush(g, x, y, s, seed, seed % 2); else K.TREES[kind](g, x, y, s, seed); }
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = P.alpha(HAZE, 0.22); g.fillRect(-w, 0, w * 3, h); g.restore();
}
function near(g, w, h) {   // the hedge and the grass behind the fighters' feet: saturated, lined, but kept quiet in the band
  const ground = h - 8; g.fillStyle = C.meadow; g.fillRect(0, ground - 6, w, 20);
  K.hedgeRow(g, 60, ground, 180, 1.6, 41); K.hedgeRow(g, 420, ground + 2, 140, 1.5, 42); K.hedgeRow(g, 760, ground, 200, 1.6, 43);
  for (const [x, s, seed] of [[300, 1.8, 44], [330, 1.4, 45], [600, 1.6, 46], [640, 1.3, 47], [990, 1.5, 48]]) K.tuft(g, x, ground + 2, s, seed);
  K.rock(g, 380, ground + 2, 1.6, 49, 1); K.rock(g, 700, ground + 3, 1.3, 50, 0); K.flowers(g, 250, ground - 2, 51, 1.6, 7); K.flowers(g, 560, ground - 2, 52, 1.6, 6); K.flowers(g, 940, ground - 2, 53, 1.6, 6);
}
function ground(g, w, h) {   // the band the fighters stand on: a bright grass lip with tufts over a dark soil body with clods and roots; the walking line is 14 px down from the top
  const lip = 14; g.fillStyle = '#5c4a30'; g.fillRect(0, lip, w, h - lip);
  const q = P.rng(61); for (let i = 0; i < 40; i++) { const x = q() * w, y = lip + 14 + q() * (h - lip - 24), rx = 10 + q() * 22, ry = 5 + q() * 8; form(g, [[x - rx, y], [x - rx * 0.5, y - ry], [x + rx * 0.4, y - ry * 1.1], [x + rx, y - ry * 0.2], [x + rx * 0.6, y + ry * 0.8], [x - rx * 0.6, y + ry]], i % 3 ? '#6d5a3a' : '#4e3d26', { ink: P.alpha('#2a1e10', 0.7), inkW: 1.1, shade: [[x, y - ry * 0.4], [x + rx, y - ry * 0.2], [x + rx * 0.6, y + ry * 0.8], [x - rx * 0.2, y + ry]], shadeCol: '#4a3822' }); }
  for (let i = 0; i < 6; i++) { const x = 60 + i * 170 + q() * 60; line(g, [[x, lip + 2], [x + 8 + q() * 10, lip + 30 + q() * 20], [x + 20, lip + 60 + q() * 30]], 2.2, '#4a3822', { taper: 0.05, taper2: 0.6 }); }   // roots
  const edge = []; for (let x = 0; x <= w; x += 16) edge.push([x, lip + ((x / 16) % 2 ? 3 : -2)]); const L = [[0, 0], ...edge, [w, 0]];
  form(g, L, C.meadow, { ink: PROP, inkW: 1.6, shade: false, n: 4 }); g.fillStyle = C.clover; g.fillRect(0, 0, w, 4);
  for (let x = 10; x < w; x += 26) K.tuft(g, x + (q() - 0.5) * 10, lip + 1, 0.9 + q() * 0.5, 70 + x);
  K.pebbles(g, 200, lip + 24, 81, 4); K.pebbles(g, 700, lip + 30, 82, 3); K.mushroom(g, 460, lip + 36, 1.3, 83);
}
const LAYERS = [['far', 1024, 300, far, 0.15], ['mid', 1024, 300, mid, 0.45], ['near', 1024, 140, near, 0.8], ['ground', 512, 120, ground, 1]];
module.exports = { LAYERS, SKY, strip };
if (require.main === module) {
  const saved = { ...C }; const cvs = {};
  for (const [name, w, h, fn, sc] of LAYERS) { cvs[name] = strip(w, h, fn); Object.assign(C, saved); P.save(cvs[name], path.join(OUT, name + '.png')); }
  // the composed phone screen: the sky, the layers at their places, the Knight and the slime at their sizes
  const R = require('../hybrid/rig.js'), SL = require('../monsters/slime.js');
  (async () => { await R.loadMasters();
    const W = 412, H = 915, Y0 = 100, Y1 = 740, cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = '#1e1c26'; g.fillRect(0, 0, W, H); g.save(); g.beginPath(); g.rect(0, Y0, W, Y1 - Y0); g.clip();
    const groundTop = Y0 + 430; g.fillStyle = P.lin(g, 0, Y0, 0, groundTop, [[0, SKY[0]], [1, SKY[1]]]); g.fillRect(0, Y0, W, groundTop - Y0);
    const put = (name, y, off = 0) => { const c = cvs[name], w = c.width / S, h = c.height / S; for (let x = -w + ((off % w) + w) % w - w; x < W + w; x += w) g.drawImage(c, x, y, w, h); };
    put('far', groundTop - 300 - 40, 40); put('mid', groundTop - 300 + 24, 120); put('near', groundTop - 140 + 8, 60); put('ground', groundTop, 0); g.fillStyle = '#5c4a30'; g.fillRect(0, groundTop + 120, W, Y1 - groundTop - 120);
    const feet = groundTop + 14;
    g.fillStyle = 'rgba(20,30,60,0.25)'; g.beginPath(); g.ellipse(110, feet + 4, 44, 11, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(300, feet + 4, 56, 13, 0, 0, 7); g.fill();
    g.save(); g.translate(110, feet); g.scale(1.5, 1.5); R.drawOutfit(g, R.restPose(R.OUTFITS.tunic), R.OUTFITS.tunic); g.restore();
    g.save(); g.translate(300, feet); g.scale(120 / 90, 120 / 90); SL.slime(g, SL.pose({})); g.restore();
    g.restore();
    P.label(g, 'Robin the Knight', 16, 24, 20, '#f4efe6'); P.label(g, 'Lv 2 · HP 46/120 · MP 20/20 · Gold 66', 16, 52, 13, '#b9b3c4', { weight: 'normal' }); P.label(g, 'Cloverfield Meadows · a fight', 16, 76, 13, '#b9b3c4', { weight: 'normal' });
    g.fillStyle = 'rgba(30,28,38,0.0)'; P.label(g, 'Jelly Slime · level 1', W / 2, Y0 + 28, 16, '#f4efe6', { align: 'center', stroke: '#2a2436', strokeW: 4 }); g.fillStyle = '#e8503e'; g.beginPath(); P.rr(g, 76, Y0 + 40, 260, 14, 7); g.fill(); P.label(g, 'HP 40/40', W / 2, Y0 + 47, 11, '#fff', { align: 'center' });
    g.fillStyle = '#252330'; g.fillRect(0, Y1, W, 60); P.label(g, 'The slime winds up a bounce.', W / 2, 770, 12, '#e8e2d8', { align: 'center', weight: 'normal' });
    [['Attack', 14, 790, '#4caf6e'], ['Abilities', 210, 790, '#8a5fd8'], ['Charge', 14, 846, '#e6a820'], ['Flee', 210, 846, '#343044']].forEach(([t, x, y, c]) => { g.fillStyle = c; g.beginPath(); P.rr(g, x, y, 188, 46, 12); g.fill(); P.label(g, t, x + 94, y + 24, 16, '#f4efe6', { align: 'center' }); });
    P.save(cv, path.join(OUT, 'fight.png')); fs.writeFileSync(path.join(OUT, 'fight.jpg'), cv.toBuffer('image/jpeg', 90)); console.log('wrote', OUT);
  })();
}
