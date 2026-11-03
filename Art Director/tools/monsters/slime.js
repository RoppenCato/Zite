// slime.js: the Jelly Slime (Mitch, AD, 2026-11-01), the first meadows creature, in the inked hand Robin approved: one
// drop-shaped body with a huge face, drawn from a pose of a few numbers (squash, lean, lift, the face's state), so every
// frame is the same creature. Five clips in the hero's form: stand 6, move 6 (a hop), attack1 12 (a wound-up lunge with
// the blow on the held frame), hit1 1 (the splat), die1 8 (the collapse into a puddle, fading). Faces LEFT in the files;
// 120 CSS px tall in a fight (240 in the file, 2 file px per unit at 120 units).
//   node tools/monsters/slime.js  -> work/slime/render + meta.json, packed to work/slime/out, a sheet
const P = require('../paint.js'); const I = require('../ink.js'); const path = require('path'); const fs = require('fs'); const { spawnSync } = require('child_process');
const { form, line, spline, pathOf, fill } = I; const ROOT = path.resolve(__dirname, '../..'); const WORK = path.join(ROOT, 'work/slime');
const INK = '#2a2030', C = { body: '#78dc52', shade: '#3f9a3a', light: '#d8ff9e', mouth: '#8a2a3e', tongue: '#ff8aa0', cheek: '#ff8a7a', drop: '#9ff07a' };
const w = 2.6;
// the pose: sx, sy squash the body (volume kept by the caller); lean tilts it; lift raises it off the ground; face: ok, angry, hurt, dead, shut
function slime(g, J) {
  const { sx = 1, sy = 1, lean = 0, lift = 0, face = 'ok', drip = 1, flat = 0 } = J;
  g.save(); g.translate(0, -lift); g.rotate(lean); g.scale(sx, sy);
  const h = 90, k = 1 - flat * 0.75;   // flat: the puddle at the end of the death
  const body = [[-52, -2], [-56, -30 * k], [-40, -66 * k], [-16, -86 * k], [0, -84 * k], [10 * drip, -94 * k * drip, 1], [14, -82 * k], [40, -68 * k], [54, -32 * k], [50, -2], [0, 2]];
  const S = form(g, body, C.body, { inkW: w, shade: [[-20, -30 * k], [20, -46 * k], [50, -34 * k], [52, -2], [0, 2], [-30, -2]], shadeCol: C.shade, shadeA: 0.9, glint: [[-40, -58 * k], [-24, -74 * k], [-8, -78 * k], [-14, -66 * k], [-30, -52 * k]], glintCol: C.light, glintA: 0.7 });
  g.save(); pathOf(g, S); g.clip(); g.globalAlpha = 0.5; fill(g, spline([[-44, -24 * k], [-36, -40 * k], [-24, -44 * k], [-24, -28 * k], [-36, -18 * k]]), C.light); g.restore();
  if (flat < 0.6) {
    const cl = -15, ey = -50 * k, my = -29 * k, mood = face === 'ok' ? 'ok' : face; require('./face.js').eyes(g, cl, ey, 1.6, { mood, iris: '#1f6a5a', lid: C.body, brow: '#2a7a3a' });
    if (face === 'angry') { const M = form(g, [[cl - 13, my - 2], [cl + 1, my + 2], [cl + 16, my - 3], [cl + 14, my + 8], [cl + 1, my + 11], [cl - 11, my + 6]], C.mouth, { inkW: w * 0.8, shade: false }); g.fillStyle = '#ffffff'; for (const tx of [cl - 7, cl + 1, cl + 9]) { g.beginPath(); g.moveTo(tx - 2.2, my + 1); g.lineTo(tx + 2.2, my + 1); g.lineTo(tx, my + 5); g.closePath(); g.fill(); } }
    else if (face === 'hurt' || face === 'dead' || face === 'shut') form(g, [[cl - 6, my], [cl + 6, my - 1], [cl + 7, my + 5], [cl - 5, my + 7]], C.mouth, { inkW: w * 0.8, n: 5, shade: false });
    else { const M = form(g, [[cl - 10, my + 1], [cl + 1, my + 3], [cl + 13, my], [cl + 10, my + 9], [cl + 1, my + 12], [cl - 8, my + 8]], C.mouth, { inkW: w * 0.8, shade: false }); g.save(); pathOf(g, M); g.clip(); fill(g, spline([[cl - 5, my + 13], [cl + 1, my + 7], [cl + 8, my + 13]]), C.tongue); g.restore(); }
    g.save(); g.globalAlpha = 0.4; fill(g, spline([[cl + 19, my - 5], [cl + 30, my - 6], [cl + 30, my], [cl + 19, my]]), C.light); g.restore();
  }
  g.restore();
}
function drops(g, J) { if (!J.drops) return; const q = P.rng(J.drops); for (let i = 0; i < 5; i++) { const x = -40 + q() * 80, y = -60 - q() * 30 - (J.lift || 0), r = 2 + q() * 3; form(g, [[x - r, y], [x, y - r * 1.6], [x + r, y], [x, y + r]], C.drop, { inkW: 1.2, ink: INK, shade: false, n: 4 }); } }
const pose = t => ({ sx: 1, sy: 1, lean: 0, lift: 0, face: 'ok', drip: 1, ...t });
function clips() {
  const stand = [0, 1, 2, 3, 4, 5].map(i => { const t = i / 6, b = Math.sin(t * 6.283); return pose({ sx: 1 + 0.03 * b, sy: 1 - 0.03 * b, drip: 1 + 0.08 * b }); });   // a slow breath
  const move = [pose({ sx: 1.15, sy: 0.82 }), pose({ sx: 0.9, sy: 1.18, lift: 8, lean: 0.06 }), pose({ sx: 0.85, sy: 1.22, lift: 26, lean: 0.1, drip: 1.2 }), pose({ sx: 0.9, sy: 1.12, lift: 22, lean: 0.08, drip: 1.1 }), pose({ sx: 1.05, sy: 0.95, lift: 6 }), pose({ sx: 1.22, sy: 0.76 })];   // the hop: crouch, spring, air, fall, land, splat
  const A = [pose({ sx: 1.05, sy: 0.95, face: 'angry' }), pose({ sx: 1.15, sy: 0.85, lean: 0.12, face: 'angry' }), pose({ sx: 1.25, sy: 0.78, lean: 0.2, face: 'angry' }), pose({ sx: 1.28, sy: 0.76, lean: 0.22, face: 'angry' }),
             pose({ sx: 0.8, sy: 1.3, lean: -0.3, lift: 14, face: 'angry', drip: 1.3 }), pose({ sx: 0.7, sy: 1.4, lean: -0.5, lift: 24, face: 'angry', drip: 1.4 }), pose({ sx: 0.72, sy: 1.36, lean: -0.5, lift: 22, face: 'angry', drip: 1.4 }),
             pose({ sx: 1.0, sy: 1.0, lean: -0.3, lift: 10, face: 'angry' }), pose({ sx: 1.2, sy: 0.8, lean: -0.1, face: 'angry' }), pose({ sx: 1.1, sy: 0.9, face: 'ok' }), pose({ sx: 0.97, sy: 1.03, face: 'ok' }), pose({ sx: 1, sy: 1, face: 'ok' })];   // the windup leans back squashed, the lunge stretches forward and lands on frame 7 (held)
  const hit1 = [pose({ sx: 1.35, sy: 0.7, lean: 0.25, face: 'hurt', drops: 3 })];
  const die1 = [pose({ sx: 1.1, sy: 0.9, face: 'hurt' }), pose({ sx: 1.2, sy: 0.8, lean: 0.1, face: 'hurt', drops: 5 }), pose({ sx: 1.3, sy: 0.65, face: 'dead' }), pose({ sx: 1.45, sy: 0.5, face: 'dead', flat: 0.3 }), pose({ sx: 1.6, sy: 0.38, face: 'dead', flat: 0.6 }), pose({ sx: 1.7, sy: 0.3, flat: 0.9 }), pose({ sx: 1.7, sy: 0.3, flat: 0.9 }), pose({ sx: 1.7, sy: 0.3, flat: 0.9 })];
  return { stand: { delay: 130, frames: stand }, move: { delay: 100, frames: move }, attack1: { delay: 67, frames: A, delays: [67, 67, 67, 100, 67, 50, 134, 67, 67, 67, 67, 67] }, hit1: { delay: 600, frames: hit1 }, die1: { delay: 83, frames: die1, fades: [[255, 255], [255, 255], [255, 255], [255, 255], [255, 255], [255, 170], [170, 80], [80, 0]] } };
}
const UNIT = 2, FW = 440, FH = 360, OX = 220, OY = 330;
function frame(J) { const cv = P.createCanvas(FW, FH), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.translate(OX, OY); g.scale(UNIT, UNIT); slime(g, J); drops(g, J); return cv; }
module.exports = { slime, pose, clips, frame };
if (require.main === module) {
  const dir = path.join(WORK, 'render'); fs.rmSync(WORK, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const meta = { origin: [OX, OY], size: FW, px: 1, actions: {} }, CL = clips();
  for (const [act, A] of Object.entries(CL)) { meta.actions[act] = { delay: A.delay, frames: [] }; A.frames.forEach((J, i) => { const file = `${act}_${String(i).padStart(2, '0')}.png`; P.save(frame(J), path.join(dir, file)); const F = { file, delay: (A.delays || [])[i] || A.delay, head: [OX, OY - (90 * (J.sy || 1) * (1 - (J.flat || 0) * 0.75) + (J.lift || 0)) * UNIT] }; if (A.fades) { F.a0 = A.fades[i][0]; F.a1 = A.fades[i][1]; } meta.actions[act].frames.push(F); }); }
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
  let r = spawnSync('node', [path.join(ROOT, 'tools/pack.js'), 'slime', dir, path.join(WORK, 'out')], { stdio: 'inherit' }); if (r.status) throw new Error('pack');
  r = spawnSync('node', [path.join(ROOT, 'tools/sheet.js'), dir, path.join(WORK, 'sheet.png'), '330'], { stdio: 'inherit' });
}
