// The Puffwort (Perry, AD, 2026-10-31): a dandelion clock that hops. A stout green stalk with a bulge, two serrated leaf arms,
// three root feet, and a big white seed-puff for a head with the face on it: two big eyes and a cheeky grin. The puff is its
// one thing: it loses seeds when hit and blows apart when it dies. Facing left, the feet at (0, 0), at 2x; about 80 CSS px tall.
// Actions at the reference's counts: stand 6, move 6 (a hop), hit1 1, die1 8, attack1 12 (a lean back and a headbutt that sprays seeds).
const P = require('../paint.js'); const B = require('../brush.js'); const { alpha } = P;
const STALK = { light: '#9ad457', mid: '#6cb33e', dark: '#4a8a2c', deep: '#2f6220' }, PUFF = { light: '#ffffff', mid: '#f1f3f6', dark: '#cfd6e0', deep: '#a9b4c2' }, LEAF = { light: '#86c93e', mid: '#4f9c2d', dark: '#2e6b21' };
const ink = (g, w = B.INK_W) => B.ink(g, w); const rad = d => d * Math.PI / 180;
function seed(g, x, y, s, a) {   // a loose seed: a tiny tuft on a stalk with a dark seed at the end
  g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = PUFF.deep; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, s); g.stroke();
  for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(k * s * 0.3, -s * 0.6); g.strokeStyle = PUFF.dark; g.lineWidth = 1.5; g.stroke(); }
  g.beginPath(); g.ellipse(0, s, 2.5, 4, 0, 0, 7); g.fillStyle = '#6a5030'; g.fill(); g.restore();
}
function leaf(g, x, y, len, w, a, flip) {   // a serrated leaf from (x, y) along angle a
  g.save(); g.translate(x, y); g.rotate(a); if (flip) g.scale(1, -1);
  g.beginPath(); g.moveTo(0, 0); for (let i = 1; i <= 6; i++) { const t = i / 6; g.lineTo(t * len, -w * Math.sin(t * Math.PI) * (i % 2 ? 1.0 : 0.7)); } g.lineTo(len, 0); for (let i = 5; i >= 1; i--) { const t = i / 6; g.lineTo(t * len, w * 0.5 * Math.sin(t * Math.PI) * (i % 2 ? 1.0 : 0.7)); } g.closePath();
  g.fillStyle = B.steps(g, 0, -w, 0, w, LEAF, [0.4, 0.75]); g.fill(); ink(g); g.strokeStyle = alpha(LEAF.dark, 0.7); g.lineWidth = 1.5; g.beginPath(); g.moveTo(4, 0); g.lineTo(len - 4, 0); g.stroke(); g.restore();
}
function draw(g, p, act, i) {
  const sx = p.sx || 1, sy = p.sy || 1, lean = p.lean || 0, droop = p.droop || 0, puff = p.puff === undefined ? 1 : p.puff;
  g.save(); g.translate(p.x || 0, -(p.z || 0)); g.rotate(rad(lean)); g.scale(sx, sy);
  // the root feet
  for (const [dx, a] of [[-14, 0.5], [0, 0], [14, -0.5]]) { g.save(); g.translate(dx, -2); g.rotate(a); g.beginPath(); g.moveTo(-6, -4); g.quadraticCurveTo(-4, 8, 0, 12); g.quadraticCurveTo(4, 8, 6, -4); g.closePath(); g.fillStyle = '#d8c89a'; g.fill(); ink(g, 2); g.restore(); }
  // the stalk: a tapered post with a bulge, bending by droop
  const top = -72; const bx = droop * 0.6;
  const stalk = () => { g.beginPath(); g.moveTo(-14, 0); g.quadraticCurveTo(-20 + bx * 0.3, -30, -11 + bx, top); g.lineTo(11 + bx, top); g.quadraticCurveTo(20 + bx * 0.3, -30, 14, 0); g.closePath(); };
  stalk(); g.fillStyle = B.steps(g, -18, 0, 18, 0, STALK, [0.38, 0.76]); g.fill(); ink(g);
  // the leaf arms
  leaf(g, -12, -34, 44, 12, rad(-150 + (p.leafL || 0)), false); leaf(g, 12, -30, 40, 11, rad(-30 + (p.leafR || 0)), true);
  // the puff: a fluffy ball on the stalk's top; spokes with tufts over a stepped white disc; the face on its front
  const cx = bx, cy = top - 46 * puff, R = 48 * puff;
  if (puff > 0.05) {
    g.save(); g.translate(cx, cy);
    g.beginPath(); g.arc(0, 0, R, 0, 7); g.fillStyle = B.steps(g, -R * 0.6, -R, R * 0.4, R, PUFF, [0.45, 0.8]); g.fill();
    const n = Math.max(10, Math.round(30 * puff)); for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + (i % 2) * 0.1, r1 = R * 0.35, r2 = R * (0.98 + (k % 3) * 0.05); g.strokeStyle = alpha(PUFF.deep, 0.5); g.lineWidth = 1.5; g.beginPath(); g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); g.stroke(); g.beginPath(); g.arc(Math.cos(a) * r2, Math.sin(a) * r2, 4, 0, 7); g.fillStyle = (Math.sin(a) < -0.2) ? PUFF.light : PUFF.mid; g.fill(); ink(g, 1.2, 0.6); }
    g.beginPath(); g.arc(0, 0, R * 0.9, 0, 7); ink(g, B.INK_W, 0.55);
    // the face: eyes to the facing side, a grin
    const ez = p.eyes === undefined ? 1 : p.eyes, shock = p.eyes === 'shock';
    for (const [ex, ey] of [[-R * 0.42, R * 0.05], [-R * 0.02, R * 0.08]]) {
      if (!shock && ez < 0.3) { g.beginPath(); g.moveTo(ex - 10, ey); g.quadraticCurveTo(ex, ey + 5, ex + 10, ey); ink(g, 3); continue; }
      const kx = shock ? 1.3 : 1, ky = shock ? 1.3 : ez; g.beginPath(); g.ellipse(ex, ey, 11 * kx, 14 * ky, 0, 0, 7); g.fillStyle = '#fffaf2'; g.fill(); ink(g, 1.5);
      if (shock) { g.beginPath(); g.arc(ex, ey + 2, 3.5, 0, 7); g.fillStyle = '#1e1612'; g.fill(); }
      else { g.beginPath(); g.ellipse(ex - 2, ey + 2, 6, 8 * ez, 0, 0, 7); g.fillStyle = '#2a3a22'; g.fill(); g.beginPath(); g.ellipse(ex - 2, ey + 3, 3.5, 4.5 * ez, 0, 0, 7); g.fillStyle = '#1a1210'; g.fill(); g.beginPath(); g.arc(ex - 5, ey - 4 * ez, 2.5, 0, 7); g.fillStyle = '#fff'; g.fill(); }
    }
    const m = p.mouth || 'grin', mx = -R * 0.24, my = R * 0.42;
    if (m === 'grin') { g.beginPath(); g.moveTo(mx - 12, my - 4); g.quadraticCurveTo(mx, my + 10, mx + 12, my - 4); g.quadraticCurveTo(mx, my + 2, mx - 12, my - 4); g.closePath(); g.fillStyle = '#5a2a3a'; g.fill(); ink(g, 2); g.fillStyle = '#fff'; g.fillRect(mx - 6, my - 2, 5, 3); g.fillRect(mx + 1, my - 2, 5, 3); }
    else if (m === 'o') { g.beginPath(); g.ellipse(mx, my, 6, 8, 0, 0, 7); g.fillStyle = '#5a2a3a'; g.fill(); ink(g, 2); }
    else if (m === 'big') { g.beginPath(); g.ellipse(mx, my + 2, 12, 13, 0, 0, 7); g.fillStyle = '#5a2a3a'; g.fill(); ink(g, 2); }
    else { g.beginPath(); g.moveTo(mx - 8, my); g.lineTo(mx + 8, my); ink(g, 2.5); }
    for (const bx2 of [-R * 0.62, R * 0.22]) { g.beginPath(); g.ellipse(bx2, R * 0.3, 7, 4, 0, 0, 7); g.fillStyle = alpha('#ff9a86', 0.7); g.fill(); }
    g.restore();
  }
  g.restore();
  // loose seeds: drawn outside the squash so they float free
  (p.seeds || []).forEach(([x, y, a]) => seed(g, x, y, 10, a));
}
const fly = (n, i, sp, r) => Array.from({ length: n }, (_, k) => { const a = k / n * Math.PI * 2 + k; return [Math.cos(a) * r * (0.6 + 0.4 * ((k * 7) % 5) / 5) - sp * i, -118 + Math.sin(a) * r * 0.8 - i * 6, a * 0.3]; });
const actions = {
  stand: { delay: 100, frames: [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2; return { sx: 1 + 0.025 * Math.sin(a), sy: 1 - 0.025 * Math.sin(a), leafL: 4 * Math.sin(a + 1), leafR: -4 * Math.sin(a + 1), droop: 3 * Math.sin(a), eyes: i === 4 ? 0.15 : 1 }; }) },
  move: { delay: 100, frames: [{ sx: 1.1, sy: 0.86, droop: -4, leafL: -10, leafR: 10 }, { sx: 0.92, sy: 1.14, z: 10, lean: -6, droop: 8, leafL: 14, leafR: -14 }, { sx: 0.96, sy: 1.06, z: 30, lean: -8, droop: 4 }, { sx: 1, sy: 1, z: 26, lean: -4, droop: -4, leafL: -8, leafR: 8 }, { sx: 1.12, sy: 0.84, droop: -8, leafL: -14, leafR: 14 }, { sx: 1.03, sy: 0.97, droop: -2 }] },
  hit1: { delay: 600, frames: [{ sx: 1.25, sy: 0.76, x: 14, lean: 14, droop: -14, leafL: 30, leafR: 30, eyes: 'shock', mouth: 'big', seeds: fly(7, 0, 0, 70) }] },
  die1: { delay: 83, frames: [{ sx: 1.05, sy: 0.95, lean: 6, eyes: 0.5, mouth: 'o' }, { lean: -6, droop: 6, eyes: 0.3, mouth: 'o', seeds: fly(4, 0, 0, 60) }, { sx: 1.1, sy: 0.9, lean: 12, droop: 10, puff: 0.8, eyes: 0.15, mouth: 'flat', seeds: fly(8, 1, 0, 75) },
    { sx: 1.15, sy: 0.84, lean: 18, droop: 18, puff: 0.55, eyes: 0.15, mouth: 'flat', seeds: fly(12, 2, 0, 90) }, { sx: 1.2, sy: 0.78, lean: 24, droop: 28, puff: 0.3, eyes: 0.15, mouth: 'flat', seeds: fly(14, 3, 0, 105) },
    { sx: 1.25, sy: 0.7, lean: 30, droop: 40, puff: 0.0, seeds: fly(14, 4, 0, 120) }, { sx: 1.25, sy: 0.66, lean: 34, droop: 48, puff: 0, seeds: fly(12, 5, 0, 135) }, { sx: 1.25, sy: 0.64, lean: 36, droop: 52, puff: 0, seeds: fly(8, 6, 0, 150) }], alpha: [255, 255, 255, 255, 255, 230, 160, 80, 0] },
  attack1: { delay: 67, frames: [{ lean: 6, x: 4, droop: 10, leafL: 10, leafR: -10, eyes: 1, mouth: 'grin' }, { lean: 12, x: 8, sx: 1.06, sy: 0.94, droop: 18, leafL: 16, leafR: -16 }, { lean: 18, x: 12, sx: 1.1, sy: 0.9, droop: 26, leafL: 22, leafR: -22 }, { lean: 22, x: 14, sx: 1.12, sy: 0.88, droop: 30, leafL: 26, leafR: -26, hold: 2 },
    { lean: -6, x: -4, sx: 0.9, sy: 1.14, droop: 10, leafL: -10, leafR: 10 }, { lean: -22, x: -36, sx: 0.96, sy: 1.06, droop: -20, leafL: -30, leafR: 30, mouth: 'big', seeds: fly(5, 0, 8, 50).map(s => [s[0] - 60, s[1] + 20, s[2]]) }, { lean: -30, x: -56, sx: 1.08, sy: 0.92, droop: -34, leafL: -40, leafR: 40, mouth: 'big', seeds: fly(8, 1, 8, 60).map(s => [s[0] - 90, s[1] + 20, s[2]]), hold: 2 },
    { lean: -24, x: -46, sx: 1.04, sy: 0.96, droop: -24, leafL: -30, leafR: 30, mouth: 'grin', seeds: fly(6, 2, 8, 70).map(s => [s[0] - 110, s[1] + 10, s[2]]) }, { lean: -14, x: -28, droop: -12, leafL: -16, leafR: 16 }, { lean: -6, x: -12, droop: -4, leafL: -6, leafR: 6 }, { lean: 0, x: -2, droop: 2 }, { lean: 0, x: 0 }] },
};
module.exports = { name: 'puffwort', W: 560, H: 400, origin: [320, 370], scale: 1.15, actions, draw };
