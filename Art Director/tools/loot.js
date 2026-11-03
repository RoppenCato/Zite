// loot.js: the chest and loot reveal pieces for Miles, GD's step 2 (Mitch, AD, 2026-11-01), in the hero's inked hand.
// Design pixels, files at 2x. The chest 160 wide, origin at its bottom centre; the opening clip of 10 frames with the lid
// flipping back and an inner light from the frame the lid is fully open; one white glow the game tints in the rarity's
// colour; the loot card 300 by 120 as a nine-slice plate with 16 px corners, a 56 square clear at the left for the icon,
// a neutral white rim the game tints; two particle sheets at 32 px frames, 6 frames each, white: a sparkle and a petal.
//   node tools/loot.js  -> work/loot/{chest,sparkle,petal}/render + meta.json, work/loot/glow.png, card.png, preview.png
const P = require('./paint.js'); const I = require('./ink.js'); const path = require('path'); const fs = require('fs'); const { spawnSync } = require('child_process');
const { form, line, spline, pathOf, fill } = I; const ROOT = path.resolve(__dirname, '..'); const WORK = path.join(ROOT, 'work/loot');
const INK = '#2a2030', C = { wood: '#b07a46', woodShade: '#7a5030', woodLight: '#d9a86a', band: '#f4c14a', bandShade: '#b8861e', inside: '#3a2648', light: '#fff3c4', iron: '#8a8f98' };
const S = 2;   // the file's scale
function canvas(w, h) { const cv = P.createCanvas(w * S, h * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; return [cv, g]; }
const easeOutBack = t => { const c = 1.6; return 1 + c * Math.pow(t - 1, 3) + (c + 1) * Math.pow(t - 1, 2) * (t - 1) * -1 * 0 + (1 + c) * Math.pow(t - 1, 3) * 0 + ((c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)); };
const ease = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };   // ease out with a little overshoot
// ---------------------------------------------------------------- the chest: a box seen a touch from above, a curved lid on a hinge at its back
function chest(g, open, lightK, part) {   // open 0..1: the lid's swing; lightK 0..1: the inner light; part 'body' leaves the lid off, part 'lid' draws the lid alone, shut, for the pop (Robin, 2026-11-01)
  const w = 68, h = 44, d = 14;   // half-width, the box's height, the top's depth seen from above
  if (part !== 'lid') { g.save(); g.fillStyle = 'rgba(28,38,70,0.22)'; g.beginPath(); g.ellipse(4, 2, w + 6, 9, 0, 0, 7); g.fill(); g.restore();
  // the box: the front face, the top rim
  form(g, [[-w, 0], [w, 0], [w, -h], [-w, -h]], C.wood, { ink: INK, inkW: 2.4, shade: [[w * 0.3, -h], [w, -h], [w, 0], [w * 0.3, 0]], shadeCol: C.woodShade, glint: [[-w + 4, -h + 4], [-w * 0.4, -h + 4], [-w * 0.5, -6], [-w + 4, -6]], glintCol: C.woodLight, glintA: 0.35 });
  for (const x of [-w * 0.55, w * 0.55]) { form(g, [[x - 7, 0], [x + 7, 0], [x + 7, -h], [x - 7, -h]], C.band, { ink: INK, inkW: 1.8, shade: [[x + 1, -h], [x + 7, -h], [x + 7, 0], [x + 1, 0]], shadeCol: C.bandShade }); for (const y of [-h + 8, -8]) { g.fillStyle = C.bandShade; g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); } }
  for (let i = 1; i < 4; i++) line(g, [[-w + 4, -h * i / 4], [w - 4, -h * i / 4]], 0.9, P.alpha(C.woodShade, 0.5), { taper: 0.03 });   // the planks
  // the inside, seen when the lid is up: dark with the light rising from it
  const inner = [[-w + 4, -h], [w - 4, -h], [w - 6, -h - d], [-w + 6, -h - d]];
  if (open > 0.05) { form(g, inner, C.inside, { ink: INK, inkW: 1.8, shade: false }); if (lightK > 0) { g.save(); pathOf(g, spline(inner, true, 4)); g.clip(); g.fillStyle = P.rad(g, 0, -h - d / 2, 0, -h - d / 2, w, [[0, P.alpha('#fffce8', lightK)], [0.45, P.alpha('#ffe27a', lightK)], [0.85, P.alpha('#f4a93a', 0.95 * lightK)], [1, P.alpha('#d8862a', 0.8 * lightK)]]); g.fillRect(-w, -h - d - 40, w * 2, d + 60); g.restore(); } }
  }
  // the lid: a curved slab on the hinge at the back-top; it flips up and back as open grows
  if (part !== 'body') {
  const a = -open * 2.0;   // radians: fully open leans back past vertical
  g.save(); g.translate(0, -h - d); g.rotate(a); g.translate(0, d);
  const lid = [[-w - 2, -d], [w + 2, -d], [w + 2, -d - 8], [w * 0.7, -d - 26], [0, -d - 32], [-w * 0.7, -d - 26], [-w - 2, -d - 8]];
  g.save(); g.translate(0, 7); form(g, lid, C.woodShade, { ink: INK, inkW: 2.2, shade: false }); g.restore();   // the lid's thickness: its underside, seen when it stands up
  form(g, lid, C.wood, { ink: INK, inkW: 2.4, shade: [[w * 0.2, -d - 30], [w + 2, -d - 8], [w + 2, -d], [w * 0.2, -d]], shadeCol: C.woodShade, glint: [[-w + 2, -d - 10], [-w * 0.5, -d - 24], [-w * 0.4, -d - 20], [-w + 4, -d - 8]], glintCol: C.woodLight, glintA: 0.4 });
  for (const x of [-w * 0.55, w * 0.55]) form(g, [[x - 7, -d], [x + 7, -d], [x + 7, -d - 8 - (1 - Math.abs(x) / w) * 24], [x - 7, -d - 8 - (1 - Math.abs(x) / w) * 24]], C.band, { ink: INK, inkW: 1.6, shade: false });
  form(g, [[-w + 6, -d], [w - 6, -d], [w - 6, -d - 5], [-w + 6, -d - 5]], C.bandShade, { ink: INK, inkW: 1.4, shade: false });   // the lid's rim
  g.restore();
  }
  if (part === 'lid') return;
  // the lock plate on the front, and the hasp that stays with the lid's rim
  form(g, [[-9, -h + 2], [9, -h + 2], [9, -h + 20], [0, -h + 25], [-9, -h + 20]], C.band, { ink: INK, inkW: 1.8, shade: [[1, -h + 2], [9, -h + 2], [9, -h + 20], [0, -h + 25], [1, -h + 24]], shadeCol: C.bandShade });
  g.fillStyle = INK; g.beginPath(); g.arc(0, -h + 11, 2.6, 0, 7); g.fill(); g.fillRect(-1.2, -h + 11, 2.4, 6);
}
function glow(w = 160, h = 160) { const [cv, g] = canvas(w, h); g.fillStyle = P.rad(g, w / 2, h / 2, w / 2, h / 2, w / 2, [[0, 'rgba(255,255,255,0.95)'], [0.35, 'rgba(255,255,255,0.55)'], [0.7, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, w, h); return cv; }
function card() {   // 300 by 120, a nine-slice plate with 16 px corners: a cream face, a white rim the game tints, the ink outside; a 56 square clear at the left for the icon
  const w = 300, h = 120, [cv, g] = canvas(w, h);
  g.fillStyle = INK; g.beginPath(); P.rr(g, 2, 2, w - 4, h - 4, 16); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); P.rr(g, 4.5, 4.5, w - 9, h - 9, 14); g.fill();   // the rim, white, tinted by the game
  g.fillStyle = '#f7efdc'; g.beginPath(); P.rr(g, 11, 11, w - 22, h - 22, 10); g.fill();
  g.fillStyle = '#ece2c8'; g.beginPath(); P.rr(g, 20, (h - 56) / 2, 56, 56, 8); g.fill(); g.strokeStyle = P.alpha(INK, 0.35); g.lineWidth = 1.2; g.stroke();   // the icon's square
  g.fillStyle = P.alpha(INK, 0.08); g.beginPath(); P.rr(g, 11, h - 22, w - 22, 11, 6); g.fill();   // a lower shade inside the face
  return cv;
}
function sparkle(g, t) {   // a four-point star that twinkles: it grows, turns a little and fades through six frames
  const k = Math.sin(t * Math.PI), r = 6 + 9 * k, a = t * 0.6; g.save(); g.translate(16, 16); g.rotate(a); g.globalAlpha = 0.35 + 0.65 * k;
  g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? r * 0.22 : r; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, 7); g.fill(); g.restore();
}
function petal(g, t) {   // a petal that tumbles: a rounded leaf shape turning over through six frames, its width squashing as it turns
  const a = t * Math.PI * 2, sq = Math.abs(Math.cos(a * 0.5)) * 0.8 + 0.2; g.save(); g.translate(16, 16); g.rotate(a * 0.5); g.scale(sq, 1);
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, -11); g.quadraticCurveTo(9, -4, 0, 11); g.quadraticCurveTo(-9, -4, 0, -11); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -8); g.lineTo(0, 8); g.stroke(); g.restore();
}
(async () => {
  fs.rmSync(WORK, { recursive: true, force: true });
  // the chest's clip: 10 frames, the lid fully open at frame 7 (the eighth), held
  const dir = path.join(WORK, 'chest/render'); fs.mkdirSync(dir, { recursive: true }); const FW = 200, FH = 180, OX = 100, OY = 160;
  const meta = { origin: [OX * S, OY * S], size: FW * S, px: 1, actions: { closed: { delay: 100, frames: [] }, open: { delay: 60, frames: [] }, opened: { delay: 100, frames: [] }, body: { delay: 100, frames: [] }, lid: { delay: 100, frames: [] } } };
  const swing = [0, 0.06, 0.2, 0.45, 0.75, 0.98, 1.12, 1.0, 1.0, 1.0], light = [0, 0, 0, 0, 0.15, 0.4, 0.7, 1, 1, 1], delays = [60, 60, 60, 60, 60, 60, 60, 100, 100, 200];
  const frameAt = (o, l) => { const [cv, g] = canvas(FW, FH); g.translate(OX, OY); chest(g, o, l); return cv; };
  for (let i = 0; i < 10; i++) { const f = `open_${String(i).padStart(2, '0')}.png`; P.save(frameAt(swing[i], light[i]), path.join(dir, f)); meta.actions.open.frames.push({ file: f, delay: delays[i] }); }
  P.save(frameAt(0, 0), path.join(dir, 'closed_00.png')); meta.actions.closed.frames.push({ file: 'closed_00.png', delay: 100 });
  P.save(frameAt(1, 1), path.join(dir, 'opened_00.png')); meta.actions.opened.frames.push({ file: 'opened_00.png', delay: 100 });
  { const [cv, g] = canvas(FW, FH); g.translate(OX, OY); chest(g, 1, 1, 'body'); P.save(cv, path.join(dir, 'body_00.png')); meta.actions.body.frames.push({ file: 'body_00.png', delay: 100 }); const [c2, g2] = canvas(FW, FH); g2.translate(OX, OY); chest(g2, 0, 0, 'lid'); P.save(c2, path.join(dir, 'lid_00.png')); meta.actions.lid.frames.push({ file: 'lid_00.png', delay: 100 }); }
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
  // the particles: 32 px frames at 2x (64), the origin at the frame's centre
  for (const [name, fn] of [['sparkle', sparkle], ['petal', petal]]) {
    const d2 = path.join(WORK, name, 'render'); fs.mkdirSync(d2, { recursive: true }); const m2 = { origin: [16 * S, 16 * S], size: 32 * S, px: 1, actions: { play: { delay: 70, frames: [] } } };
    for (let i = 0; i < 6; i++) { const [cv, g] = canvas(32, 32); fn(g, i / 6); const f = `play_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(d2, f)); m2.actions.play.frames.push({ file: f, delay: 70 }); }
    fs.writeFileSync(path.join(d2, 'meta.json'), JSON.stringify(m2, null, 1));
  }
  P.save(glow(), path.join(WORK, 'glow.png')); P.save(card(), path.join(WORK, 'card.png'));
  for (const n of ['chest', 'sparkle', 'petal']) { const r = spawnSync('node', [path.join(ROOT, 'tools/pack.js'), n, path.join(WORK, n, 'render'), path.join(WORK, 'out', n)], { stdio: 'inherit' }); if (r.status) throw new Error('pack ' + n); }
  // the preview: the clip's frames in a row, the glow tinted in the six colours behind an open chest, the card with sample text, the particles
  const [pv, g] = canvas(900, 540); g.fillStyle = '#1c1a22'; g.fillRect(0, 0, 900, 540); P.label(g, 'The chest and the loot reveal: the opening clip, the glow in six rarities, the card, the particles', 450, 22, 15, '#f0e8d8', { align: 'center' });
  g.fillStyle = '#7ed957'; g.fillRect(16, 36, 868, 110); for (let i = 0; i < 10; i++) { g.save(); g.translate(60 + i * 86, 130); g.scale(0.5, 0.5); chest(g, swing[i], light[i]); g.restore(); P.label(g, String(i + 1), 60 + i * 86, 140, 9, '#2a2436', { align: 'center', weight: 'normal' }); }
  const rar = [['common', '#b9c4d2'], ['uncommon', '#6fd86a'], ['rare', '#5aa9ff'], ['epic', '#c07aff'], ['legendary', '#ffb74a'], ['unique', '#ff8a4a']];
  g.fillStyle = '#4f8536'; g.fillRect(16, 156, 868, 130); const gl = glow();
  rar.forEach(([n, col], i) => { const x = 90 + i * 145; g.save(); g.globalCompositeOperation = 'source-over'; const t = P.createCanvas(gl.width, gl.height), tg = t.getContext('2d'); tg.drawImage(gl, 0, 0); tg.globalCompositeOperation = 'multiply'; tg.fillStyle = col; tg.fillRect(0, 0, t.width, t.height); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(gl, 0, 0); g.drawImage(t, x - 70, 165, 140, 140); g.restore(); g.save(); g.translate(x, 268); g.scale(0.55, 0.55); chest(g, 1, 1); g.restore(); P.label(g, n, x, 280, 10, '#f0e8d8', { align: 'center', stroke: '#2a2436', strokeW: 3 }); });
  const cd = card(); for (let i = 0; i < 2; i++) { const x = 30 + i * 440, y = 296, col = i ? rar[3][1] : rar[4][1]; const t = P.createCanvas(cd.width, cd.height), tg = t.getContext('2d'); tg.drawImage(cd, 0, 0); tg.globalCompositeOperation = 'multiply'; tg.fillStyle = col; tg.fillRect(0, 0, t.width, t.height); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(cd, 0, 0); g.drawImage(cd, x, y, 300, 120); g.save(); g.globalCompositeOperation = 'source-over'; g.restore(); g.drawImage(t, x, y, 300, 120); g.globalCompositeOperation = 'source-over';
    g.save(); g.fillStyle = '#f7efdc'; g.beginPath(); P.rr(g, x + 11, y + 11, 278, 98, 10); g.fill(); g.fillStyle = '#ece2c8'; g.beginPath(); P.rr(g, x + 20, y + 32, 56, 56, 8); g.fill(); g.strokeStyle = P.alpha(INK, 0.35); g.lineWidth = 1.2; g.stroke(); g.restore();
    P.label(g, i ? 'Moonsilver Sword' : 'Sunsteel Coat', x + 92, y + 46, 18, col); P.label(g, i ? '+14 attack · crits bleed' : '+22 defence · reflects a little', x + 92, y + 76, 13, '#5a5048', { weight: 'normal' }); }
  g.fillStyle = '#2f2a40'; g.fillRect(16, 430, 868, 80); for (let i = 0; i < 6; i++) { const [c2, g2] = canvas(32, 32); sparkle(g2, i / 6); g.drawImage(c2, 40 + i * 44, 440, 32, 32); const [c3, g3] = canvas(32, 32); petal(g3, i / 6); g.drawImage(c3, 340 + i * 44, 440, 32, 32); }
  P.label(g, 'the sparkle, 6 frames', 150, 496, 10, '#b8b0a4', { align: 'center', weight: 'normal' }); P.label(g, 'the petal, 6 frames', 450, 496, 10, '#b8b0a4', { align: 'center', weight: 'normal' }); P.label(g, 'white, for the game to tint', 700, 464, 11, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.label(g, 'Mitch, AD, 2026-11-01.', 450, 530, 10, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.save(pv, path.join(WORK, 'preview.png')); fs.writeFileSync(path.join(WORK, 'preview.jpg'), pv.toBuffer('image/jpeg', 90)); console.log('wrote', WORK);
})();
