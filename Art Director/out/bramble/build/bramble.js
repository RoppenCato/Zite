// The Bramble Bun (Perry, AD, 2026-10-31): a round bun of tangled bramble that rolls. A dark green ball laced with brown twig
// lines, small thorns round the rim, three red berries, a leaf tuft on top, and a face: two eyes and a grin with two teeth. It
// rolls to move, the whole bun turning, face and all, with a squash at each contact; a hit flattens it and pops the berries;
// it dies by unravelling into a heap of twigs. Facing left, at 2x; about 60 CSS px tall. Actions: stand 6, move 6, hit1 1,
// die1 8, attack1 12 (rocks back, then rolls at the enemy in a spin, bounces off, rolls back).
const P = require('../paint.js'); const B = require('../brush.js'); const { alpha } = P;
const BUN = { light: '#6fae4a', mid: '#3f7f32', dark: '#275a24', deep: '#163d18' }, TWIG = '#6a4a28', BERRY = { light: '#ff7a86', mid: '#d8323c', dark: '#8a1a22' }, LEAF = { light: '#9bd455', mid: '#5fa83a', dark: '#3a7a28' };
const ink = (g, w = B.INK_W) => B.ink(g, w); const rad = d => d * Math.PI / 180;
const R = 56;
function draw(g, p, act, i) {
  const sx = p.sx || 1, sy = p.sy || 1, rot = p.rot || 0, flat = p.flat || 0;   // flat: 0 a ball .. 1 a heap
  g.save(); g.translate(p.x || 0, -(p.z || 0)); g.scale(sx, sy);
  // loose berries and twigs (outside the roll)
  (p.loose || []).forEach(([x, y, k]) => { if (k === 't') { g.strokeStyle = TWIG; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y - 6); g.stroke(); } else { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fillStyle = B.steps(g, x - 6, y - 6, x + 6, y + 6, BERRY, [0.4, 0.75]); g.fill(); ink(g, 1.5); } });
  g.translate(0, -R * (1 - flat) - 6 * flat); g.rotate(rad(rot));
  const ry = R * (1 - flat * 0.75), rx = R * (1 + flat * 0.6);
  const bun = () => { g.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2, w = 1 + 0.06 * Math.sin(a * 7 + 1); const x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
  // the thorns round the rim
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + 0.2; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-5, 0); g.lineTo(9, -2); g.lineTo(-5, 5); g.closePath(); g.fillStyle = TWIG; g.fill(); ink(g, 1.5); g.restore(); }
  bun(); g.fillStyle = B.steps(g, -rx * 0.6, -ry, rx * 0.4, ry, BUN, [0.4, 0.76]); g.fill();
  g.save(); bun(); g.clip();                                                                         // the twigs: curving brown lines laced over the ball
  for (let k = 0; k < 9; k++) { const a0 = k / 9 * Math.PI * 2, a1 = a0 + 2.2; g.strokeStyle = alpha(TWIG, 0.85); g.lineWidth = 3; g.beginPath(); g.moveTo(Math.cos(a0) * rx * 0.95, Math.sin(a0) * ry * 0.95); g.quadraticCurveTo(Math.cos(a0 + 1.1) * rx * 0.2, Math.sin(a0 + 1.1) * ry * 0.2, Math.cos(a1) * rx * 0.95, Math.sin(a1) * ry * 0.95); g.stroke(); }
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.6, x = Math.cos(a) * rx * 0.55, y = Math.sin(a) * ry * 0.55; g.beginPath(); g.ellipse(x, y, 6, 4, a, 0, 7); g.fillStyle = BUN.light; g.fill(); }   // small leaves in the tangle
  g.restore(); bun(); ink(g);
  // the berries
  for (const [bx, by] of [[rx * 0.5, -ry * 0.45], [-rx * 0.6, ry * 0.5], [rx * 0.25, ry * 0.7]]) { if (p.berries === false) continue; g.beginPath(); g.arc(bx, by, 7, 0, 7); g.fillStyle = B.steps(g, bx - 7, by - 7, bx + 7, by + 7, BERRY, [0.4, 0.75]); g.fill(); ink(g, 1.5); g.beginPath(); g.arc(bx - 2.5, by - 2.5, 1.8, 0, 7); g.fillStyle = '#fff'; g.fill(); }
  // the leaf tuft on top (rotates with the bun)
  for (const [a, l] of [[-100, 22], [-80, 26], [-62, 18]]) { g.save(); g.rotate(rad(a + (p.tuft || 0))); g.translate(ry * 0.9, 0); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, -6, l, 0); g.quadraticCurveTo(l * 0.5, 6, 0, 0); g.closePath(); g.fillStyle = B.steps(g, 0, -6, 0, 6, LEAF, [0.4, 0.75]); g.fill(); ink(g, 2); g.restore(); }
  // the face (rotates with the bun)
  if (flat < 0.6) {
    const ez = p.eyes === undefined ? 1 : p.eyes, shock = ez === 'shock', xeyes = ez === 'x';
    for (const [ex, ey] of [[-rx * 0.46, -ry * 0.1], [-rx * 0.08, -ry * 0.06]]) {
      if (xeyes) { g.beginPath(); g.moveTo(ex - 6, ey - 6); g.lineTo(ex + 6, ey + 6); g.moveTo(ex + 6, ey - 6); g.lineTo(ex - 6, ey + 6); ink(g, 3); continue; }
      if (!shock && ez < 0.3) { g.beginPath(); g.moveTo(ex - 9, ey); g.quadraticCurveTo(ex, ey + 5, ex + 9, ey); ink(g, 3); continue; }
      const kx = shock ? 1.3 : 1, ky = shock ? 1.3 : ez; g.beginPath(); g.ellipse(ex, ey, 10 * kx, 12 * ky, 0, 0, 7); g.fillStyle = '#fffaf2'; g.fill(); ink(g, 1.5);
      if (shock) { g.beginPath(); g.arc(ex, ey + 2, 3, 0, 7); g.fillStyle = '#1e1612'; g.fill(); }
      else { g.beginPath(); g.ellipse(ex - 2, ey + 2, 6, 7.5 * ez, 0, 0, 7); g.fillStyle = '#4a1a22'; g.fill(); g.beginPath(); g.ellipse(ex - 2, ey + 3, 3.2, 4 * ez, 0, 0, 7); g.fillStyle = '#1a1210'; g.fill(); g.beginPath(); g.arc(ex - 4.5, ey - 3 * ez, 2.2, 0, 7); g.fillStyle = '#fff'; g.fill(); }
    }
    const m = p.mouth || 'grin', mx = -rx * 0.28, my = ry * 0.3;
    if (m === 'grin') { g.beginPath(); g.moveTo(mx - 14, my - 4); g.quadraticCurveTo(mx, my + 12, mx + 14, my - 4); g.quadraticCurveTo(mx, my + 2, mx - 14, my - 4); g.closePath(); g.fillStyle = '#4a1a22'; g.fill(); ink(g, 2); g.fillStyle = '#fff'; g.fillRect(mx - 9, my - 2, 6, 5); g.fillRect(mx + 3, my - 2, 6, 5); }
    else if (m === 'big') { g.beginPath(); g.ellipse(mx, my + 2, 12, 12, 0, 0, 7); g.fillStyle = '#4a1a22'; g.fill(); ink(g, 2); g.fillStyle = '#fff'; g.fillRect(mx - 8, my - 8, 5, 5); g.fillRect(mx + 3, my - 8, 5, 5); }
    else if (m === 'grr') { g.beginPath(); P.rr(g, mx - 12, my - 3, 24, 8, 3); g.fillStyle = '#4a1a22'; g.fill(); ink(g, 2); g.fillStyle = '#fff'; g.fillRect(mx - 9, my - 2, 18, 3); }
    else { g.beginPath(); g.moveTo(mx - 8, my); g.lineTo(mx + 8, my); ink(g, 2.5); }
  }
  g.restore();
}
const pop = (n, k) => Array.from({ length: n }, (_, j) => [-60 + j * 32 + (j % 2) * 10, -70 - k * 14 - (j % 3) * 18, j % 2 ? 'b' : 't']);
const actions = {
  stand: { delay: 100, frames: [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2; return { sx: 1 + 0.03 * Math.sin(a), sy: 1 - 0.03 * Math.sin(a), tuft: 5 * Math.sin(a + 1), eyes: i === 4 ? 0.15 : 1 }; }) },
  move: { delay: 100, frames: [0, 1, 2, 3, 4, 5].map(i => ({ rot: -i * 60, sx: 1 + 0.06 * (i % 2), sy: 1 - 0.06 * (i % 2), x: 0 })) },
  hit1: { delay: 600, frames: [{ sx: 1.35, sy: 0.7, x: 16, rot: 15, eyes: 'shock', mouth: 'big', berries: false, loose: [[-40, -110, 'b'], [20, -124, 'b'], [50, -100, 'b'], [-70, -90, 't'], [70, -84, 't']] }] },
  die1: { delay: 83, frames: [{ sx: 1.05, sy: 0.95, rot: -8, eyes: 0.5, mouth: 'flat' }, { sx: 1.1, sy: 0.9, rot: 8, eyes: 0.3, mouth: 'flat', loose: [[50, -70, 'b']] }, { flat: 0.2, rot: -4, eyes: 'x', mouth: 'flat', loose: pop(3, 0) }, { flat: 0.4, rot: 0, eyes: 'x', mouth: 'flat', berries: false, loose: pop(4, 1) },
    { flat: 0.6, berries: false, loose: pop(5, 2) }, { flat: 0.8, berries: false, loose: pop(5, 3) }, { flat: 0.95, berries: false, loose: pop(4, 4) }, { flat: 1.0, berries: false, loose: pop(3, 5) }], alpha: [255, 255, 255, 255, 255, 230, 160, 80, 0] },
  attack1: { delay: 67, frames: [{ rot: 6, x: 4, mouth: 'grr' }, { rot: 14, x: 10, mouth: 'grr' }, { rot: 22, x: 16, sx: 1.04, sy: 0.96, mouth: 'grr' }, { rot: 28, x: 20, sx: 1.06, sy: 0.94, mouth: 'grr', hold: 2 },
    { rot: 0, x: 0, sx: 0.96, sy: 1.04, mouth: 'grr' }, { rot: -60, x: -36, z: 6, mouth: 'grr' }, { rot: -130, x: -70, z: 10, mouth: 'grr' }, { rot: -200, x: -92, sx: 1.2, sy: 0.84, mouth: 'big', hold: 2 },
    { rot: -230, x: -80, z: 14, sx: 0.96, sy: 1.04, mouth: 'grin' }, { rot: -280, x: -54, z: 8 }, { rot: -330, x: -24, z: 2 }, { rot: -360, x: 0 }] },
};
module.exports = { name: 'bramble', W: 560, H: 400, origin: [320, 370], scale: 1.3, actions, draw };
