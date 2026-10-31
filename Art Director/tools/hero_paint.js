// hero_paint.js: the Warrior painted in 2D parts on a rig (Perry, AD, 2026-10-31; rebuilt after Robin's notes of the same
// day and three rounds with Colin, AD, the Survival game's Art Director). One clean three-quarter view, facing left: the
// body's front shows, both legs apart, both arms shown (a shoulder cap, an upper arm, an elbow, a forearm and a fist each),
// the hilt through the near fist with the guard above and the pommel below, both eyes the same size, the head half the
// height with the hair a cap of four uneven tufts sweeping back. Painted at 2x, the feet at the origin, about 210 px to the
// hair's top. Clips at Miles, GD's rates (stand and move 10 a second, attack 15 with the strike held a beat, die 12);
// hit1 held 600 ms as the library does. Each frame's delay may be a multiple of the clip's (hold).
//   node tools/hero_paint.js [--out work/hero/paint] [--only stand]
const P = require('./paint.js'); const B = require('./brush.js'); const fs = require('fs'); const path = require('path');
const { alpha } = P; const ROOT = path.resolve(__dirname, '..'); const a = process.argv.slice(2); const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const OUT = path.resolve(ROOT, opt('out') || 'work/hero/paint');
const SKIN = { light: '#ffe6c8', mid: '#f7d2a8', dark: '#dba77a', deep: '#b8805a' }, HAIR = { light: '#ffa864', mid: '#ee7638', dark: '#c0501e', deep: '#7e2f10' };
const TUNIC = { light: '#6ea4ee', mid: '#3f7fd8', dark: '#2a5aa8', deep: '#1c3f78' }, PANTS = { light: '#8a6650', mid: '#6b4a3a', dark: '#4a3028' }, BOOT = { light: '#7a4e30', mid: '#4e2f1c', dark: '#301c10' };
const STEEL = { light: '#f4f8fc', mid: '#c9d3de', dark: '#8d9aa8' }, GOLD = { light: '#f6d87a', mid: '#d9a84a', dark: '#9c6f22' };
const ink = (g, w = B.INK_W) => B.ink(g, w);
const rad = d => d * Math.PI / 180;
// ---- the parts ----
function leg(g, near, swing) {                                  // the hip at (0, 0); + swings the foot forward (left)
  g.save(); g.rotate(rad(swing));
  g.beginPath(); P.rr(g, -12, -6, 24, 40, 8); g.fillStyle = near ? PANTS.mid : PANTS.dark; g.fill(); ink(g);
  g.beginPath(); g.moveTo(-12, 28); g.quadraticCurveTo(-30, 30, -32, 42); g.quadraticCurveTo(-30, 49, -20, 49); g.lineTo(12, 49); g.quadraticCurveTo(16, 44, 13, 28); g.closePath(); g.fillStyle = near ? BOOT.mid : BOOT.dark; g.fill(); ink(g);   // the toe forward, a flat sole
  g.beginPath(); g.moveTo(-12, 31); g.quadraticCurveTo(-24, 33, -26, 40); g.lineWidth = 3; g.strokeStyle = BOOT.light; g.stroke(); g.restore();
}
function body(g, hem = 0) {                                     // the hips at (0, 0), the tunic up to the shoulders at -50, flaring at the hem
  const path = () => { g.beginPath(); g.moveTo(-34, -50); g.quadraticCurveTo(-38, -22, -38 + hem, 4); g.quadraticCurveTo(-2 + hem, 12, 34 + hem, 4); g.quadraticCurveTo(36, -22, 30, -50); g.quadraticCurveTo(-2, -58, -34, -50); g.closePath(); };
  path(); g.fillStyle = B.steps(g, -38, 0, 34, 0, TUNIC, [0.4, 0.78]); g.fill();
  g.save(); path(); g.clip(); g.fillStyle = TUNIC.deep; g.fillRect(-46, 0, 92, 14); g.fillStyle = TUNIC.light; g.beginPath(); g.moveTo(-16, -52); g.lineTo(-4, -40); g.lineTo(10, -52); g.closePath(); g.fill();
  g.fillStyle = '#8a5a35'; g.fillRect(-46, -12, 92, 10); g.fillStyle = '#5a3a20'; g.fillRect(-46, -3, 92, 2); g.restore();
  path(); ink(g);
  g.beginPath(); P.rr(g, -16, -13, 13, 12, 2); g.fillStyle = GOLD.mid; g.fill(); ink(g, B.INNER_W); g.fillStyle = GOLD.light; g.fillRect(-14, -11, 5, 3);
}
// an arm from the shoulder at (0, 0): the upper arm swung a1 (+ forward), bent at the elbow by bend (+ forward), a fist at the
// wrist; the near arm gets the sword (hilt through the fist) when sword is a number
function arm(g, near, a1, bend, sword) {
  const U = near ? 26 : 24, F = near ? 24 : 22, wU = near ? 22 : 18, wF = near ? 19 : 16, T = near ? TUNIC.mid : TUNIC.dark, S = near ? SKIN.mid : SKIN.dark;
  g.save(); g.rotate(rad(a1));
  g.beginPath(); P.rr(g, -wU / 2, -4, wU, U + 6, wU / 2); g.fillStyle = T; g.fill(); ink(g);                 // the upper arm, sleeved
  g.translate(0, U); g.rotate(rad(bend));
  g.beginPath(); P.rr(g, -wF / 2, -2, wF, F + 2, wF / 2); g.fillStyle = S; g.fill(); ink(g);               // the forearm
  g.beginPath(); g.arc(0, 0, wF / 2 + 1, 0, 7); g.fillStyle = S; g.fill(); g.beginPath(); g.arc(0, 0, wF / 2 + 1, Math.PI * 1.1, Math.PI * 1.9); ink(g, B.INNER_W);   // the elbow and its crease
  g.translate(0, F);
  if (near && typeof sword === 'number') { g.save(); g.rotate(rad(sword)); blade(g); g.restore(); }       // the sword: hilt at the wrist, guard above the fist, blade beyond
  fist(g, near, typeof sword === 'number');
  g.restore();
}
function fist(g, near, grips) {                                 // the wrist at (0, 0); a rounded fist, the thumb on the blade's side, two knuckle creases
  const r = near ? 13 : 11, S = near ? SKIN.light : SKIN.mid;
  g.beginPath(); P.rr(g, -r, -2, r * 2, r * 1.8, r * 0.7); g.fillStyle = S; g.fill(); ink(g);
  g.beginPath(); g.ellipse(-r * 0.55, r * 0.15, r * 0.42, r * 0.34, -0.5, 0, 7); g.fillStyle = S; g.fill(); ink(g, B.INNER_W);
  for (const y of [r * 0.75, r * 1.25]) { g.beginPath(); g.moveTo(-r * 0.3, y); g.lineTo(r * 0.85, y); ink(g, B.INNER_W, 0.7); }
  if (grips) { g.beginPath(); g.ellipse(0, r * 0.9, r * 0.85, r * 0.6, 0, 0, 7); g.lineWidth = 1.5; g.strokeStyle = alpha(SKIN.deep, 0.5); g.stroke(); }
}
function blade(g) {                                             // the hilt's middle at (0, 0), the blade along +y: pommel at -y, grip, the guard, the blade
  g.beginPath(); g.arc(0, -16, 6, 0, 7); g.fillStyle = GOLD.mid; g.fill(); ink(g, B.INNER_W);
  g.beginPath(); P.rr(g, -5, -12, 10, 24, 3); g.fillStyle = '#6a4228'; g.fill(); ink(g, B.INNER_W);
  g.beginPath(); P.rr(g, -14, 10, 28, 8, 3); g.fillStyle = GOLD.mid; g.fill(); ink(g, B.INNER_W); g.fillStyle = GOLD.light; g.fillRect(-11, 12, 10, 2);
  g.beginPath(); g.moveTo(-7, 18); g.lineTo(7, 18); g.lineTo(4, 88); g.lineTo(0, 98); g.lineTo(-4, 88); g.closePath(); g.fillStyle = B.steps(g, -7, 0, 7, 0, STEEL, [0.4, 0.7]); g.fill(); ink(g); g.strokeStyle = alpha(STEEL.dark, 0.7); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 22); g.lineTo(0, 84); g.stroke();
}
function head(g, p) {                                           // the neck at (0, 0); the head above; p: eyes 1 open .. 0.15 shut or 'shock'; mouth smile|o|big|grr|flat; tilt; brow; hairLag
  g.save(); g.rotate(rad(p.tilt || 0)); const hy = -58, lag = p.hairLag || 0;
  g.beginPath(); P.rr(g, -11, -14, 22, 20, 6); g.fillStyle = SKIN.dark; g.fill(); ink(g);   // the neck
  g.beginPath(); g.ellipse(0, hy, 52, 46, 0, 0, 7); g.fillStyle = B.steps(g, -40, hy - 46, 30, hy + 46, SKIN, [0.5, 0.86]); g.fill(); ink(g);
  g.beginPath(); g.ellipse(48, hy + 8, 7, 9, 0, 0, 7); g.fillStyle = SKIN.mid; g.fill(); ink(g, 2);          // the far ear
  // the hair: a cap with four big uneven tufts sweeping back, the leading edges curved; three locks over the brow; one mass lit from the upper left
  const hair = () => { g.beginPath(); g.moveTo(50, hy + 16); g.quadraticCurveTo(66, hy + 2, 60, hy - 16);
    g.quadraticCurveTo(76, hy - 24, 86, hy - 40); g.quadraticCurveTo(70, hy - 40, 56, hy - 44);                // tuft 1, back, pointing back
    g.quadraticCurveTo(66, hy - 54, 56, hy - 66); g.quadraticCurveTo(46, hy - 58, 34, hy - 56);                // tuft 2, back-up
    g.quadraticCurveTo(32, hy - 72, 12, hy - 74); g.quadraticCurveTo(2, hy - 64, -10, hy - 60);                // tuft 3, the top, swept back
    g.quadraticCurveTo(-26, hy - 74, -50, hy - 64); g.quadraticCurveTo(-54, hy - 52, -58, hy - 42);            // tuft 4, front, curling forward
    g.quadraticCurveTo(-64, hy - 24, -60, hy - 6);
    g.lineTo(-48 + lag, hy - 2); g.lineTo(-36 + lag * 0.8, hy - 16); g.lineTo(-14 + lag * 0.8, hy); g.lineTo(2 + lag * 0.6, hy - 16); g.lineTo(18 + lag * 0.6, hy - 6); g.lineTo(30, hy - 18); g.lineTo(42, hy - 8); g.closePath(); };   // the locks end above the eyes
  hair(); g.fillStyle = HAIR.mid; g.fill();
  g.save(); hair(); g.clip();
  g.beginPath(); g.moveTo(-66, hy - 36); g.quadraticCurveTo(-30, hy - 84, 30, hy - 70); g.quadraticCurveTo(10, hy - 56, -20, hy - 50); g.quadraticCurveTo(-50, hy - 42, -66, hy - 36); g.closePath(); g.fillStyle = HAIR.light; g.fill();   // the light on the crown's near side
  g.beginPath(); g.moveTo(34, hy - 46); g.quadraticCurveTo(72, hy - 26, 60, hy + 20); g.lineTo(90, hy + 20); g.lineTo(90, hy - 60); g.closePath(); g.fillStyle = HAIR.dark; g.fill();   // the shade at the back
  g.beginPath(); g.moveTo(-62, hy - 16); g.quadraticCurveTo(-10, hy - 4, 44, hy - 12); g.lineTo(44, hy + 20); g.lineTo(-62, hy + 20); g.closePath(); g.fillStyle = HAIR.dark; g.fill();   // the shade under the fringe
  g.strokeStyle = HAIR.deep; g.lineWidth = 2.5; g.lineCap = 'round';
  for (const [x0, y0, x1, y1] of [[56, hy - 44, 42, hy - 22], [34, hy - 60, 26, hy - 34], [-10, hy - 66, -8, hy - 38], [-36 + lag * 0.8, hy - 16, -42 + lag, hy - 6], [2 + lag * 0.6, hy - 16, -6 + lag * 0.7, hy - 6]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 4, (y0 + y1) / 2, x1, y1); g.stroke(); }   // the partings
  g.restore(); hair(); ink(g);
  // the face: both eyes the same size, a little apart, both looking the way he faces; a catchlight each; brows; a mouth; blush
  const ez = p.eyes === undefined ? 1 : p.eyes, shock = ez === 'shock', rx = 12, ry = 17;
  for (const [ex, ey] of [[-34, hy + 12], [2, hy + 12]]) {
    if (!shock && ez < 0.3) { g.beginPath(); g.moveTo(ex - rx, ey); g.quadraticCurveTo(ex, ey + 6, ex + rx, ey); ink(g, 3); continue; }
    const kx = shock ? 1.25 : 1, ky = shock ? 1.2 : ez;
    g.beginPath(); g.ellipse(ex, ey, rx * kx, ry * ky, 0, 0, 7); g.fillStyle = '#fffaf2'; g.fill(); ink(g, 1.2);
    if (shock) { g.beginPath(); g.ellipse(ex - 1, ey + 2, rx * 0.3, ry * 0.36, 0, 0, 7); g.fillStyle = '#1e1612'; g.fill(); }
    else { g.beginPath(); g.ellipse(ex - 3, ey + 2, rx * 0.5, ry * 0.56 * ez, 0, 0, 7); g.fillStyle = '#3a2418'; g.fill(); g.beginPath(); g.ellipse(ex - 3, ey + 3, rx * 0.3, ry * 0.36 * ez, 0, 0, 7); g.fillStyle = '#1a1210'; g.fill(); g.beginPath(); g.ellipse(ex - 6, ey - 3 * ez, 3, 3.6, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill(); }   // a white eye with a dark pupil, as Robin's example
    const bu = (p.brow || 0) + (shock ? -10 : 0); g.beginPath(); g.moveTo(ex - rx + 2, ey - ry - 4 + bu); g.quadraticCurveTo(ex, ey - ry - 7 + bu, ex + rx * 0.7, ey - ry - 4 + bu); g.lineWidth = 2.5; g.strokeStyle = HAIR.deep; g.stroke();
  }
  g.beginPath(); g.moveTo(-14, hy + 22); g.quadraticCurveTo(-18, hy + 27, -12, hy + 28); ink(g, 2);   // a small nose
  const m = p.mouth || 'smile', mx = -18;
  if (m === 'smile') { g.beginPath(); g.arc(mx, hy + 34, 7, 0.3, Math.PI - 0.3); ink(g, 2.5); }
  else if (m === 'o') { g.beginPath(); g.ellipse(mx, hy + 36, 6, 8, 0, 0, 7); g.fillStyle = '#7a3a3a'; g.fill(); ink(g, 2); }
  else if (m === 'big') { g.beginPath(); g.ellipse(mx, hy + 38, 12, 14, 0, 0, 7); g.fillStyle = '#5a2a2a'; g.fill(); ink(g, 2.5); g.beginPath(); g.ellipse(mx, hy + 46, 7, 5, 0, 0, 7); g.fillStyle = '#e06a6a'; g.fill(); }
  else if (m === 'grr') { g.beginPath(); P.rr(g, mx - 10, hy + 30, 20, 8, 3); g.fillStyle = '#7a3a3a'; g.fill(); ink(g, 2); g.fillStyle = '#fffaf2'; g.fillRect(mx - 6, hy + 31, 12, 3); }
  else { g.beginPath(); g.moveTo(mx - 8, hy + 36); g.lineTo(mx + 8, hy + 36); ink(g, 2.5); }
  for (const bx of [-48, 16]) { g.beginPath(); g.ellipse(bx, hy + 32, 8, 4.5, 0, 0, 7); g.fillStyle = alpha('#ff9a86', 0.75); g.fill(); }
  g.restore();
}
// the smear: a pale, part-transparent trail behind the blade's tip, widest at the blade and tapering to nothing at the tail,
// stopping at the ground (angles from the shoulder, 0 down, + forward; the sweep goes from a0 at the tail to a1 at the blade)
function smear(g, sx, sy, a0, a1, R, ground) {
  const t0 = rad(a0) + Math.PI / 2, t1 = rad(a1) + Math.PI / 2, n = 24, outer = [], inner = [];
  for (let i = 0; i <= n; i++) { const k = i / n, t = t0 + (t1 - t0) * k, w = 0.3 * k * k; outer.push([sx + Math.cos(t) * R, sy + Math.sin(t) * R]); inner.push([sx + Math.cos(t) * R * (1 - w), sy + Math.sin(t) * R * (1 - w)]); }
  g.save(); g.beginPath(); g.rect(-400, -400, 800, 400 + ground); g.clip();
  g.beginPath(); outer.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); inner.reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath();
  g.fillStyle = 'rgba(255,244,196,0.42)'; g.fill();
  g.beginPath(); outer.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,236,0.6)'; g.stroke();
  g.restore();
}
// ---- the rig ----
// pose: x, y (the feet's shift), lean (+ back), bob (the body up, the feet stay), legs [near, far], arms [near, far] (the
// shoulder swings), elbows [near, far], sword (the blade's angle to the forearm), eyes, mouth, tilt, brow, hairLag, hem,
// lying (turned onto the back), squash, swordLoose [x, y] (dropped), flash [a0, a1], hold (a multiple of the clip's delay)
function drawPose(g, p) {
  const hipY = -52, shY = -96, L = p.legs || [0, 0], A = p.arms || [0, 0], E = p.elbows || [40, 8], SW = p.sword === undefined ? 30 : p.sword;
  g.save(); g.translate(p.x || 0, p.y || 0);
  if (p.lying) { g.translate(60, 0); g.rotate(rad(p.lying)); }
  if (p.squash) g.scale(1, p.squash);
  g.rotate(rad(p.lean || 0));
  g.save(); g.translate(14, hipY); leg(g, false, L[1]); g.restore();           // the far leg
  g.save(); g.translate(-16, hipY); leg(g, true, L[0]); g.restore();           // the near leg
  g.translate(0, -(p.bob || 0));                                                  // the body rises, the feet do not
  g.save(); g.translate(0, hipY); body(g, p.hem || 0); g.restore();
  g.save(); g.translate(28, shY + 4); arm(g, false, A[1], E[1], null); g.beginPath(); g.ellipse(0, 0, 12, 9, 0.3, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); g.fillStyle = TUNIC.dark; g.fill(); ink(g); g.restore();   // the far arm, along the far side of the body, its shoulder cap on top
  const nearArm = () => { g.save(); g.translate(-30, shY + 6); arm(g, true, A[0], E[0], p.swordLoose ? null : SW); g.beginPath(); g.ellipse(0, 0, 14, 10, -0.3, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); g.fillStyle = TUNIC.light; g.fill(); ink(g); g.restore(); };
  if (p.flash) smear(g, -30, shY + 4, p.flash[0], p.flash[1], 146, (p.bob || 0) - 2);
  if (A[0] < -100) nearArm();                                                   // raised behind: the arm and the sword go behind the head
  g.save(); g.translate(-6, shY + 2); head(g, p); g.restore();
  if (A[0] >= -100) nearArm();
  g.restore();
  if (p.swordLoose) { g.save(); g.translate((p.x || 0) + p.swordLoose[0], (p.y || 0) + p.swordLoose[1]); g.rotate(rad(78)); blade(g); g.restore(); }
}
// ---- the clips ----
// REST: feet apart, the near foot forward, a slight lean; the near elbow bent so the fist sits before the chest and the blade
// rises up and forward, clear of the body (Robin's first example); the far arm bent along the far side with its fist at the hip
const REST = { legs: [12, -10], arms: [2, -4], elbows: [84, 8], lean: -3, sword: 60 };
const CLIPS = {
  stand: { delay: 100, frames: [{ ...REST, bob: 0 }, { ...REST, bob: 3, arms: [4, -4], tilt: 1, hairLag: 1, hem: 1 }, { ...REST, bob: 6, arms: [6, -5], tilt: 2, hairLag: 2, hem: 2 }, { ...REST, bob: 3, arms: [4, -4], tilt: 1, hairLag: 1, hem: 1 }] },
  // the walk against the Mixamo guide (work/hero/guide/walk): thighs about 30 degrees each way, hips lowest at contact and
  // highest at the passing step, the arms counter-swinging; the sword arm keeps its bend so the blade stays up and forward
  move: { delay: 100, frames: [
    { legs: [40, -40], arms: [-18, 28], elbows: [84, 8], lean: -5, bob: 0, tilt: 2, hairLag: 3, hem: -3, sword: 60 }, { legs: [18, -18], arms: [-8, 12], elbows: [84, 8], lean: -5, bob: 5, hairLag: 1, sword: 60 }, { legs: [-6, 6], arms: [2, -4], elbows: [84, 8], lean: -5, bob: 9, tilt: -2, hem: 3, sword: 60 },
    { legs: [-40, 40], arms: [22, -30], elbows: [84, 8], lean: -5, bob: 0, tilt: 2, hairLag: 3, hem: 3, sword: 60 }, { legs: [-18, 18], arms: [12, -16], elbows: [84, 8], lean: -5, bob: 5, hairLag: 1, sword: 60 }, { legs: [6, -6], arms: [-2, 4], elbows: [84, 8], lean: -5, bob: 9, tilt: -2, hem: -3, sword: 60 }] },
  // the overhead cut against the guide (work/hero/guide/mine): the windup twice as long as the cut, the blade standing clear
  // above the hair; then the arm comes over straight and ends low in front with the body bent forward and the front leg lunging;
  // the strike frame held two beats so the blow lands
  attack1: { delay: 67, frames: [
    { lean: 8, x: 4, arms: [-100, 30], elbows: [-30, 40], sword: 0, legs: [22, -16], tilt: -6, hairLag: -5, hem: 4, mouth: 'grr', brow: 6 },
    { lean: 12, x: 8, arms: [-178, 36], elbows: [0, 40], sword: -6, legs: [26, -20], tilt: -4, hairLag: -8, hem: 6, mouth: 'grr', brow: 6 },
    { lean: -20, x: -24, arms: [130, -14], elbows: [10, 30], sword: 0, legs: [34, -24], tilt: 6, hairLag: 6, hem: -6, mouth: 'grr', brow: 6, flash: [-175, 128] },
    { lean: -30, x: -40, arms: [86, -24], elbows: [6, 30], sword: 6, legs: [40, -30], tilt: 4, hairLag: 10, hem: -9, mouth: 'grr', brow: 6, flash: [128, 56], hold: 2 },
    { lean: -22, x: -30, arms: [62, -22], elbows: [20, 30], sword: 10, legs: [34, -26], tilt: -2, hairLag: 6, hem: -5, mouth: 'flat' },
    { ...REST, lean: -8, x: -12, arms: [30, -10], elbows: [60, 30], sword: 20, hairLag: 2 }] },
  hit1: { delay: 600, frames: [{ lean: 22, x: 18, y: -14, legs: [36, -30], arms: [120, -110], elbows: [10, 10], sword: 20, tilt: 18, eyes: 'shock', mouth: 'big', hairLag: -12, hem: 10 }] },
  // the death: a stumble, the knees going, onto the back with a squash and a bounce, the sword dropping away, the arms laid
  // beside him, nothing below the ground (the frames are lifted to the line after drawing), then the fade (a0, a1)
  die1: { delay: 83, frames: [
    { lean: 12, x: 8, arms: [10, -10], elbows: [40, 30], sword: 30, eyes: 0.5, mouth: 'o', tilt: -4 },
    { lean: 26, x: 14, bob: -10, legs: [24, 24], arms: [-30, -20], elbows: [30, 30], sword: 30, tilt: -8, eyes: 0.3, mouth: 'o', hairLag: -6 },
    { lying: 55, x: 22, y: -8, arms: [-40, -30], elbows: [40, 30], legs: [28, 24], sword: 20, tilt: 10, hairLag: -8, eyes: 0.15, mouth: 'flat' },
    { lying: 90, x: 34, squash: 0.9, arms: [-20, -20], elbows: [60, 50], legs: [34, 30], swordLoose: [-86, -4], eyes: 0.15, mouth: 'flat', hairLag: 6, floor: true },
    { lying: 90, x: 34, arms: [-20, -20], elbows: [60, 50], legs: [36, 32], swordLoose: [-88, -4], eyes: 0.15, mouth: 'flat', floor: true },
    { lying: 90, x: 34, arms: [-20, -20], elbows: [60, 50], legs: [36, 32], swordLoose: [-88, -4], eyes: 0.15, mouth: 'flat', floor: true }], alpha: [255, 255, 255, 255, 220, 120, 0] },
};
(async () => {
  const W = 640, H = 440, ox = 300, oy = 360; fs.mkdirSync(OUT, { recursive: true }); const only = opt('only');
  const meta = { size: 220, px: 2, origin: [ox, oy], actions: {} };
  for (const [name, C] of Object.entries(CLIPS)) {
    if (only && name !== only) continue; meta.actions[name] = { delay: C.delay, frames: [] };
    C.frames.forEach((p, i) => {
      let cv = P.createCanvas(W, H), g = cv.getContext('2d'); g.translate(ox, oy); drawPose(g, p);
      if (p.floor) { const b0 = P.bounds(cv); const lift = b0.y + b0.h - oy; if (lift > 0) { cv = P.createCanvas(W, H); g = cv.getContext('2d'); g.translate(ox, oy - lift); drawPose(g, p); } }   // a lying frame: the lowest painted point on the ground line
      const file = `${name}_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(OUT, file)); const b = P.bounds(cv) || { x: ox, y: oy, w: 1, h: 1 };
      const fr = { file, delay: C.delay * (p.hold || 1), lt: [b.x, b.y], rb: [b.x + b.w, b.y + b.h], head: [ox, b.y] };
      if (C.alpha) { fr.a0 = C.alpha[i]; fr.a1 = C.alpha[Math.min(i + 1, C.alpha.length - 1)]; }
      meta.actions[name].frames.push(fr);
    });
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1)); console.log('painted', Object.values(meta.actions).reduce((n, A) => n + A.frames.length, 0), 'frames into', OUT);
})();
