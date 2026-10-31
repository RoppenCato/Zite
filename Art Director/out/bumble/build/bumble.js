// The Honey Bumble (Perry, AD, 2026-10-31): a fat round bee that flies. A striped yellow body with a fuzzy top, a round head
// with big eyes and two bobbled antennae, two blurred wings that beat, a small stinger, four dangling legs. It hovers about
// 50 CSS px off the ground; the origin stays at the ground under it, as the reference does for flyers. Facing left, at 2x;
// about 60 CSS px across. Actions: stand 6 (the hover; 'fly' in the reference), move 6 (flying forward, leaning), hit1 1
// (squashed, spun), die1 8 (spins and drops, bounces, fades), attack1 12 (pulls back, dives with the stinger, returns).
const P = require('../paint.js'); const B = require('../brush.js'); const { alpha } = P;
const BODY = { light: '#ffe06a', mid: '#f2c23a', dark: '#c9931e', deep: '#8a5f10' }, BLACK = { light: '#4a4238', mid: '#2e2820', dark: '#1a1610' }, WING = 'rgba(214,236,255,0.55)';
const ink = (g, w = B.INK_W) => B.ink(g, w); const rad = d => d * Math.PI / 180;
function draw(g, p, act, i) {
  const hover = p.z === undefined ? 100 : p.z, sx = p.sx || 1, sy = p.sy || 1, lean = p.lean || 0, spin = p.spin || 0, wing = p.wing === undefined ? (i % 2) : p.wing;
  g.save(); g.translate(p.x || 0, -hover); g.rotate(rad(lean + spin)); g.scale(sx, sy);
  // the legs: four little dangling hooks
  for (const [x, a] of [[-14, 0.2], [-4, 0.1], [8, -0.1], [18, -0.2]]) { g.save(); g.translate(x, 22); g.rotate(a + (p.legs || 0)); g.strokeStyle = BLACK.mid; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2, 10, -3, 16); g.stroke(); g.restore(); }
  // the stinger at the back
  g.beginPath(); g.moveTo(34, 6); g.lineTo(52, 10); g.lineTo(34, 16); g.closePath(); g.fillStyle = BLACK.mid; g.fill(); ink(g, 2);
  // the body: an ellipse, striped, with a fuzzy scalloped top
  const body = () => { g.beginPath(); g.ellipse(6, 2, 40, 30, 0, 0, 7); };
  body(); g.fillStyle = B.steps(g, -20, -30, 20, 30, BODY, [0.4, 0.78]); g.fill();
  g.save(); body(); g.clip(); for (const x of [0, 22]) { g.fillStyle = BLACK.mid; g.fillRect(x, -40, 11, 80); g.fillStyle = BLACK.light; g.fillRect(x, -40, 11, 14); } g.restore();
  g.save(); body(); g.clip(); for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI, x = 6 + Math.cos(a) * 40, y = 2 + Math.sin(a) * 30; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fillStyle = (k > 1 && k < 4) || (k > 5 && k < 8) ? BLACK.light : BODY.light; g.fill(); } g.restore();   // the fuzz along the top
  body(); ink(g);
  // the wings: two translucent ovals, up or down with the beat, over the back
  for (const [dx, k] of [[12, 1], [26, 0.85]]) { g.save(); g.translate(dx, -24); g.rotate(rad(wing ? -40 : -10) * (k === 1 ? 1 : 0.8)); g.beginPath(); g.ellipse(-4, -14 * k, 11 * k, 22 * k, 0, 0, 7); g.fillStyle = WING; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(80,110,150,0.6)'; g.stroke(); g.beginPath(); g.moveTo(-4, -4); g.lineTo(-4, -30 * k); g.strokeStyle = 'rgba(80,110,150,0.4)'; g.lineWidth = 1.5; g.stroke(); g.restore(); }
  // the head: a round ball at the front with big eyes, a small smile, blush, two antennae with bobbles
  const hx = -36, hy = -6;
  for (const [ax, tx, ty] of [[-10, -30, -46], [4, -8, -52]]) { g.strokeStyle = BLACK.mid; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + ax, hy - 20); g.quadraticCurveTo(hx + ax - 4, hy - 36, hx + tx, hy + ty + (p.antenna || 0)); g.stroke(); g.beginPath(); g.arc(hx + tx, hy + ty + (p.antenna || 0), 4.5, 0, 7); g.fillStyle = BLACK.mid; g.fill(); }
  g.beginPath(); g.arc(hx, hy, 26, 0, 7); g.fillStyle = B.steps(g, hx - 18, hy - 26, hx + 12, hy + 26, BODY, [0.42, 0.8]); g.fill(); ink(g);
  const ez = p.eyes === undefined ? 1 : p.eyes, shock = ez === 'shock', xeyes = ez === 'x';
  for (const [ex, ey] of [[hx - 12, hy - 2], [hx + 8, hy - 2]]) {
    if (xeyes) { g.beginPath(); g.moveTo(ex - 6, ey - 6); g.lineTo(ex + 6, ey + 6); g.moveTo(ex + 6, ey - 6); g.lineTo(ex - 6, ey + 6); ink(g, 3); continue; }
    if (!shock && ez < 0.3) { g.beginPath(); g.moveTo(ex - 8, ey); g.quadraticCurveTo(ex, ey + 5, ex + 8, ey); ink(g, 3); continue; }
    const kx = shock ? 1.3 : 1, ky = shock ? 1.3 : ez; g.beginPath(); g.ellipse(ex, ey, 9 * kx, 12 * ky, 0, 0, 7); g.fillStyle = '#fffaf2'; g.fill(); ink(g, 1.5);
    if (shock) { g.beginPath(); g.arc(ex, ey + 2, 3, 0, 7); g.fillStyle = '#1e1612'; g.fill(); }
    else { g.beginPath(); g.ellipse(ex - 2, ey + 2, 5.5, 7.5 * ez, 0, 0, 7); g.fillStyle = '#3a2a18'; g.fill(); g.beginPath(); g.ellipse(ex - 2, ey + 3, 3, 4 * ez, 0, 0, 7); g.fillStyle = '#1a1210'; g.fill(); g.beginPath(); g.arc(ex - 4, ey - 3 * ez, 2.2, 0, 7); g.fillStyle = '#fff'; g.fill(); }
  }
  const m = p.mouth || 'smile', mx = hx - 4, my = hy + 12;
  if (m === 'smile') { g.beginPath(); g.arc(mx, my, 6, 0.3, Math.PI - 0.3); ink(g, 2.5); }
  else if (m === 'grr') { g.beginPath(); P.rr(g, mx - 8, my - 2, 16, 6, 2); g.fillStyle = '#5a2a3a'; g.fill(); ink(g, 2); g.fillStyle = '#fff'; g.fillRect(mx - 5, my - 1, 10, 2.5); }
  else if (m === 'big') { g.beginPath(); g.ellipse(mx, my + 2, 9, 10, 0, 0, 7); g.fillStyle = '#5a2a3a'; g.fill(); ink(g, 2); }
  else { g.beginPath(); g.moveTo(mx - 6, my); g.lineTo(mx + 6, my); ink(g, 2.5); }
  for (const bx of [hx - 22, hx + 16]) { g.beginPath(); g.ellipse(bx, hy + 8, 6, 3.5, 0, 0, 7); g.fillStyle = alpha('#ff9a86', 0.7); g.fill(); }
  g.restore();
  if (p.lines) for (const [x, y, l] of p.lines) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }   // speed lines
}
const actions = {
  stand: { delay: 100, frames: [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2; return { z: 100 + 8 * Math.sin(a), lean: 2 * Math.sin(a), antenna: 3 * Math.sin(a + 1), legs: 0.1 * Math.sin(a), eyes: i === 4 ? 0.15 : 1 }; }) },
  move: { delay: 100, frames: [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2; return { z: 104 + 6 * Math.sin(a), lean: -14 + 3 * Math.sin(a), antenna: 6, legs: -0.25, lines: i % 2 ? [[70, -112, 26], [82, -96, 18]] : [[76, -104, 20]] }; }) },
  hit1: { delay: 600, frames: [{ z: 92, x: 18, sx: 1.25, sy: 0.78, lean: 22, spin: 10, eyes: 'shock', mouth: 'big', antenna: -8, legs: 0.5, wing: 1 }] },
  die1: { delay: 83, frames: [{ z: 96, lean: 10, eyes: 'x', mouth: 'flat', antenna: -6 }, { z: 88, spin: 40, eyes: 'x', mouth: 'flat' }, { z: 70, spin: 110, eyes: 'x', mouth: 'flat' }, { z: 46, spin: 180, eyes: 'x', mouth: 'flat' }, { z: 22, spin: 210, eyes: 'x', mouth: 'flat', sx: 1.1, sy: 0.9 },
    { z: 30, spin: 200, sx: 1.15, sy: 0.85, eyes: 'x', mouth: 'flat' }, { z: 30, spin: 196, sx: 1.2, sy: 0.8, eyes: 'x', mouth: 'flat' }, { z: 30, spin: 196, sx: 1.2, sy: 0.8, eyes: 'x', mouth: 'flat' }], alpha: [255, 255, 255, 255, 255, 230, 150, 70, 0] },
  attack1: { delay: 67, frames: [{ z: 104, x: 6, lean: 8, antenna: -4, mouth: 'grr' }, { z: 108, x: 14, lean: 14, antenna: -6, mouth: 'grr' }, { z: 112, x: 22, lean: 20, antenna: -8, mouth: 'grr', legs: 0.3 }, { z: 114, x: 26, lean: 24, antenna: -8, mouth: 'grr', legs: 0.3, hold: 2 },
    { z: 100, x: 0, lean: -10, sx: 1.08, sy: 0.94, mouth: 'grr', lines: [[60, -100, 22]] }, { z: 80, x: -40, lean: -36, sx: 1.14, sy: 0.9, mouth: 'grr', legs: -0.4, lines: [[20, -84, 30], [30, -70, 22]] }, { z: 62, x: -72, lean: -50, sx: 1.18, sy: 0.88, mouth: 'grr', legs: -0.5, lines: [[-10, -70, 34], [0, -54, 24]], hold: 2 },
    { z: 66, x: -64, lean: -44, sx: 1.1, sy: 0.92, mouth: 'grr', legs: -0.4 }, { z: 80, x: -44, lean: -26, mouth: 'smile' }, { z: 94, x: -26, lean: -12 }, { z: 100, x: -10, lean: -4 }, { z: 100, x: 0 }] },
};
module.exports = { name: 'bumble', W: 560, H: 400, origin: [320, 370], scale: 1.3, actions, draw };
