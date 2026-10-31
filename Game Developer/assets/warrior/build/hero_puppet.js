// hero_puppet.js: the Warrior as painted 2D parts moved by the Blender rig (Perry, AD, 2026-10-31; Robin: "your original
// art style but with his better skeleton; I don't like the 3D computer graphics look"). tools/build/warrior_vol.py
// --skeleton writes where every joint of Colin, AD's rig lands in each frame (pixels at 2x, and a depth); this paints my
// flat-toned, ink-lined parts between those joints: a tunic from the hips to the neck, the head and hair on the neck, each
// arm as a sleeved upper arm, a forearm and a fist between its joints, each leg as a trouser leg and a boot, the sword from
// the grip to the tip. Parts are drawn farthest first by the joints' depth, so the near arm covers the body and the far
// one shows behind it. Writes <clip>_<nn>.png and meta.json in the studio's form for tools/pack.js.
//   node tools/hero_puppet.js <skeleton.json> <out dir>
const P = require('./paint.js'); const B = require('./brush.js'); const fs = require('fs'); const path = require('path');
const { alpha } = P; const [skelFile, OUT] = process.argv.slice(2);
const SKIN = { light: '#ffe6c8', mid: '#f7d2a8', dark: '#dba77a', deep: '#b8805a' }, HAIR = { light: '#ffa864', mid: '#ee7638', dark: '#c0501e', deep: '#7e2f10' };
const TUNIC = { light: '#6ea4ee', mid: '#3f7fd8', dark: '#2a5aa8', deep: '#1c3f78' }, PANTS = { light: '#8a6650', mid: '#6b4a3a', dark: '#4a3028' }, BOOT = { light: '#7a4e30', mid: '#4e2f1c', dark: '#301c10' };
const STEEL = { light: '#f4f8fc', mid: '#c9d3de', dark: '#8d9aa8' }, GOLD = { light: '#f6d87a', mid: '#d9a84a', dark: '#9c6f22' };
const ink = (g, w = B.INK_W) => B.ink(g, w);
const v = (a, b) => [b[0] - a[0], b[1] - a[1]], len = d => Math.hypot(d[0], d[1]), unit = d => { const L = len(d) || 1; return [d[0] / L, d[1] / L]; }, ang = d => Math.atan2(d[1], d[0]);
// a limb: a rounded tapered shape from p0 to p1, lit across its width (the side toward the upper left light), the one ink line
function limb(g, p0, p1, w0, w1, t) {
  const d = unit(v(p0, p1)), n = [-d[1], d[0]], L = len(v(p0, p1)); const lightSide = (n[0] + n[1] * 0.4) < 0 ? 1 : -1;   // which normal points to the light
  g.save(); g.translate(p0[0], p0[1]); g.rotate(ang(d));
  const path = () => { g.beginPath(); g.moveTo(0, -w0 / 2); g.lineTo(L, -w1 / 2); g.arc(L, 0, w1 / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(0, w0 / 2); g.arc(0, 0, w0 / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); };
  const w = Math.max(w0, w1); path(); g.fillStyle = B.steps(g, 0, lightSide * w / 2, 0, -lightSide * w / 2, t, [0.42, 0.78]); g.fill(); ink(g); g.restore();
}
function fist(g, p, d, r, grips) {                            // at p, the knuckles along d
  g.save(); g.translate(p[0], p[1]); g.rotate(ang(d) - Math.PI / 2);
  g.beginPath(); P.rr(g, -r, -r * 0.9, r * 2, r * 1.8, r * 0.7); g.fillStyle = SKIN.light; g.fill(); ink(g);
  g.beginPath(); g.ellipse(-r * 0.55, -r * 0.1, r * 0.42, r * 0.34, -0.5, 0, 7); g.fillStyle = SKIN.light; g.fill(); ink(g, B.INNER_W);
  for (const y of [r * 0.15, r * 0.6]) { g.beginPath(); g.moveTo(-r * 0.3, y); g.lineTo(r * 0.85, y); ink(g, B.INNER_W, 0.7); }
  if (grips) { g.beginPath(); g.ellipse(0, r * 0.1, r * 0.85, r * 0.6, 0, 0, 7); g.lineWidth = 1.5; g.strokeStyle = alpha(SKIN.deep, 0.5); g.stroke(); }
  g.restore();
}
function sword(g, J) {                                         // the pommel, the grip, the guard and the blade along the rig's points (the blade's length as projected)
  const d = unit(v(J.guard, J.tip)), n = [-d[1], d[0]], Lb = len(v(J.guard, J.tip)), Lh = len(v(J.guard, J.pommel));
  g.save(); g.translate(J.guard[0], J.guard[1]); g.rotate(ang(d));
  g.beginPath(); g.arc(-Lh, 0, 6, 0, 7); g.fillStyle = GOLD.mid; g.fill(); ink(g, B.INNER_W);
  g.beginPath(); P.rr(g, -Lh + 2, -5, Lh - 2, 10, 3); g.fillStyle = '#6a4228'; g.fill(); ink(g, B.INNER_W);
  g.beginPath(); P.rr(g, -4, -14, 8, 28, 3); g.fillStyle = GOLD.mid; g.fill(); ink(g, B.INNER_W); g.fillStyle = GOLD.light; g.fillRect(-2, -11, 2, 10);
  if (Lb > 6) { g.beginPath(); g.moveTo(4, -7); g.lineTo(Lb - 10, -4); g.lineTo(Lb, 0); g.lineTo(Lb - 10, 4); g.lineTo(4, 7); g.closePath(); g.fillStyle = B.steps(g, 0, -7, 0, 7, STEEL, [0.4, 0.7]); g.fill(); ink(g); g.strokeStyle = alpha(STEEL.dark, 0.7); g.lineWidth = 1.5; g.beginPath(); g.moveTo(8, 0); g.lineTo(Lb - 14, 0); g.stroke(); }
  g.restore();
}
function boot(g, J, s, near) {
  const a = J['ankle' + s], toe = J['toe' + s], heel = J['heel' + s], t = near ? BOOT : { light: BOOT.mid, mid: BOOT.dark, dark: BOOT.dark };
  limb(g, [a[0], a[1] - 8], [a[0], a[1] + 6], 24, 24, near ? PANTS : { light: PANTS.mid, mid: PANTS.dark, dark: PANTS.dark });   // the cuff over the shaft
  g.beginPath(); g.moveTo(a[0] - 11, a[1] - 2); g.lineTo(heel[0] - 2, heel[1] - 4); g.quadraticCurveTo(heel[0] - 2, heel[1] + 6, heel[0] + 6, heel[1] + 6); g.lineTo(toe[0] + 4, toe[1] + 6); g.quadraticCurveTo(toe[0] - 10, toe[1] + 2, toe[0] - 6, toe[1] - 8); g.lineTo(a[0] + 11, a[1] - 2); g.closePath();
  g.fillStyle = t.mid; g.fill(); ink(g);
  g.beginPath(); g.moveTo(a[0] - 4, a[1] + 2); g.quadraticCurveTo((a[0] + toe[0]) / 2, (a[1] + toe[1]) / 2 - 4, toe[0] - 6, toe[1] - 4); g.lineWidth = 3; g.strokeStyle = t.light; g.stroke();
}
function head(g, J, mood, headR) {                            // the head on the neck, turned by the rig's head top; the face placed off the nose point; the hair a soft cap with fringe locks
  const c = J.headC, up = unit(v(c, J.headTop)), tilt = ang(up) + Math.PI / 2, R = headR * 200; const nose = v(c, J.nose);
  g.save(); g.translate(c[0], c[1]); g.rotate(tilt); const nx = nose[0] * Math.cos(-tilt) - nose[1] * Math.sin(-tilt), ny = nose[0] * Math.sin(-tilt) + nose[1] * Math.cos(-tilt);
  g.beginPath(); g.ellipse(0, 0, R * 1.02, R * 0.96, 0, 0, 7); g.fillStyle = B.steps(g, -R * 0.8, -R, R * 0.6, R, SKIN, [0.5, 0.86]); g.fill(); ink(g);
  g.beginPath(); g.ellipse(R * 0.92, ny * 0.4 + 6, 7, 9, 0, 0, 7); g.fillStyle = SKIN.mid; g.fill(); ink(g, 2);          // the far ear
  const hy = -R * 0.1; const fx = nx * 0.45;                                                                                // the face's centre line, shifted toward the nose
  // the hair: a cap set back so the forehead shows, four soft locks over the brow curling toward the facing, a swept tuft at the crown and the nape
  const hair = () => { g.beginPath(); g.moveTo(R * 0.9, R * 0.3); g.quadraticCurveTo(R * 1.25, -R * 0.1, R * 1.05, -R * 0.55); g.quadraticCurveTo(R * 1.3, -R * 0.75, R * 1.0, -R * 0.95); g.quadraticCurveTo(R * 0.5, -R * 1.25, -R * 0.3, -R * 1.1); g.quadraticCurveTo(-R * 0.9, -R * 1.05, -R * 1.08, -R * 0.55); g.quadraticCurveTo(-R * 1.15, -R * 0.2, -R * 1.0, R * 0.05);
    for (const [x, y] of [[-R * 0.85, R * 0.12], [-R * 0.72, -R * 0.32], [-R * 0.5, R * 0.1], [-R * 0.32, -R * 0.38], [-R * 0.1, R * 0.02], [R * 0.12, -R * 0.4], [R * 0.34, -R * 0.08], [R * 0.56, -R * 0.42], [R * 0.74, -R * 0.1]]) g.lineTo(x + fx * 0.3, y);   // the fringe's locks
    g.lineTo(R * 0.9, R * 0.3); g.closePath(); };
  hair(); g.fillStyle = HAIR.mid; g.fill();
  g.save(); hair(); g.clip(); g.beginPath(); g.moveTo(-R * 1.2, -R * 0.5); g.quadraticCurveTo(-R * 0.5, -R * 1.35, R * 0.7, -R * 1.1); g.quadraticCurveTo(R * 0.3, -R * 0.8, -R * 0.3, -R * 0.78); g.quadraticCurveTo(-R * 0.9, -R * 0.7, -R * 1.2, -R * 0.5); g.closePath(); g.fillStyle = HAIR.light; g.fill();
  g.beginPath(); g.moveTo(R * 0.6, -R * 0.9); g.quadraticCurveTo(R * 1.3, -R * 0.4, R * 1.1, R * 0.4); g.lineTo(R * 1.5, R * 0.4); g.lineTo(R * 1.5, -R * 1.2); g.closePath(); g.fillStyle = HAIR.dark; g.fill();
  g.beginPath(); g.moveTo(-R * 1.1, -R * 0.35); g.quadraticCurveTo(-R * 0.2, -R * 0.18, R * 0.9, -R * 0.3); g.lineTo(R * 0.9, R * 0.4); g.lineTo(-R * 1.1, R * 0.4); g.closePath(); g.fillStyle = HAIR.dark; g.fill();
  g.strokeStyle = HAIR.deep; g.lineWidth = 2.5; g.lineCap = 'round'; for (const [x0, y0, x1, y1] of [[-R * 0.72, -R * 0.32, -R * 0.8, -R * 0.05], [-R * 0.32, -R * 0.38, -R * 0.38, -R * 0.1], [R * 0.12, -R * 0.4, R * 0.06, -R * 0.14], [R * 0.56, -R * 0.42, R * 0.5, -R * 0.18], [R * 0.2, -R * 1.1, R * 0.35, -R * 0.7], [-R * 0.6, -R * 1.0, -R * 0.55, -R * 0.65]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 3, (y0 + y1) / 2, x1, y1); g.stroke(); }
  g.restore(); hair(); ink(g);
  // the face: both eyes the same size, placed either side of the nose line; a nose; the mouth by mood; blush
  const eyes = mood === 'shock' ? 'shock' : (mood === 'blink' || mood === 'dead') ? 0.15 : mood === 'hurt' ? 0.3 : 1, rx = R * 0.23, ry = R * 0.33, ey = hy + R * 0.28;
  for (const ex of [fx - R * 0.5, fx + R * 0.18]) {
    if (eyes !== 'shock' && eyes < 0.3) { g.beginPath(); g.moveTo(ex - rx, ey); g.quadraticCurveTo(ex, ey + (mood === 'dead' ? -6 : 6), ex + rx, ey); ink(g, 3); continue; }
    const shock = eyes === 'shock', kx = shock ? 1.25 : 1, ky = shock ? 1.2 : eyes;
    g.beginPath(); g.ellipse(ex, ey, rx * kx, ry * ky, 0, 0, 7); g.fillStyle = '#fffaf2'; g.fill(); ink(g, 1.2);
    if (shock) { g.beginPath(); g.ellipse(ex - 1, ey + 2, rx * 0.3, ry * 0.36, 0, 0, 7); g.fillStyle = '#1e1612'; g.fill(); }
    else { g.beginPath(); g.ellipse(ex - 3, ey + 2, rx * 0.5, ry * 0.56 * eyes, 0, 0, 7); g.fillStyle = '#3a2418'; g.fill(); g.beginPath(); g.ellipse(ex - 3, ey + 3, rx * 0.3, ry * 0.36 * eyes, 0, 0, 7); g.fillStyle = '#1a1210'; g.fill(); g.beginPath(); g.ellipse(ex - 6, ey - 3 * eyes, 3, 3.6, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill(); }
    const bu = mood === 'grr' ? 6 : shock ? -10 : 0; g.beginPath(); g.moveTo(ex - rx + 2, ey - ry - 4 + bu); g.quadraticCurveTo(ex, ey - ry - 7 + bu, ex + rx * 0.7, ey - ry - 4 + bu); g.lineWidth = 2.5; g.strokeStyle = HAIR.deep; g.stroke();
  }
  g.beginPath(); g.moveTo(fx - R * 0.12, hy + R * 0.5); g.quadraticCurveTo(fx - R * 0.2, hy + R * 0.6, fx - R * 0.08, hy + R * 0.62); ink(g, 2);     // the nose
  const mx = fx - R * 0.2, my = hy + R * 0.76;
  if (mood === 'open' || mood === 'blink') { g.beginPath(); g.arc(mx, my, 7, 0.3, Math.PI - 0.3); ink(g, 2.5); }
  else if (mood === 'hurt') { g.beginPath(); g.ellipse(mx, my + 2, 6, 8, 0, 0, 7); g.fillStyle = '#7a3a3a'; g.fill(); ink(g, 2); }
  else if (mood === 'shock') { g.beginPath(); g.ellipse(mx, my + 4, 12, 14, 0, 0, 7); g.fillStyle = '#5a2a2a'; g.fill(); ink(g, 2.5); g.beginPath(); g.ellipse(mx, my + 12, 7, 5, 0, 0, 7); g.fillStyle = '#e06a6a'; g.fill(); }
  else if (mood === 'grr') { g.beginPath(); P.rr(g, mx - 10, my - 4, 20, 8, 3); g.fillStyle = '#7a3a3a'; g.fill(); ink(g, 2); g.fillStyle = '#fffaf2'; g.fillRect(mx - 6, my - 3, 12, 3); }
  else { g.beginPath(); g.moveTo(mx - 8, my); g.lineTo(mx + 8, my); ink(g, 2.5); }
  for (const bx of [fx - R * 0.78, fx + R * 0.42]) { g.beginPath(); g.ellipse(bx, hy + R * 0.66, 8, 4.5, 0, 0, 7); g.fillStyle = alpha('#ff9a86', 0.75); g.fill(); }
  g.restore();
}
function torso(g, J) {                                         // the tunic from the hips to the neck, the belt near the hips, the collar
  const h = J.hips, n = J.neck, d = unit(v(h, n)), L = len(v(h, n)), s = L / 52;
  g.save(); g.translate(h[0], h[1] + 6); g.rotate(ang(d) + Math.PI / 2); g.scale(s, s);
  const path = () => { g.beginPath(); g.moveTo(-34, -50); g.quadraticCurveTo(-38, -22, -38, 4); g.quadraticCurveTo(-2, 12, 34, 4); g.quadraticCurveTo(36, -22, 30, -50); g.quadraticCurveTo(-2, -58, -34, -50); g.closePath(); };
  path(); g.fillStyle = B.steps(g, -38, 0, 34, 0, TUNIC, [0.4, 0.78]); g.fill();
  g.save(); path(); g.clip(); g.fillStyle = TUNIC.deep; g.fillRect(-46, 0, 92, 14); g.fillStyle = TUNIC.light; g.beginPath(); g.moveTo(-16, -52); g.lineTo(-4, -40); g.lineTo(10, -52); g.closePath(); g.fill();
  g.fillStyle = '#8a5a35'; g.fillRect(-46, -12, 92, 10); g.fillStyle = '#5a3a20'; g.fillRect(-46, -3, 92, 2); g.restore();
  path(); ink(g); g.beginPath(); P.rr(g, -16, -13, 13, 12, 2); g.fillStyle = GOLD.mid; g.fill(); ink(g, B.INNER_W); g.fillStyle = GOLD.light; g.fillRect(-14, -11, 5, 3);
  g.beginPath(); P.rr(g, -11, -62, 22, 16, 6); g.fillStyle = SKIN.dark; g.fill(); ink(g);   // the neck
  g.restore();
}
function cap(g, p, near) { g.beginPath(); g.ellipse(p[0], p[1], near ? 15 : 12, near ? 11 : 9, -0.3, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); g.fillStyle = near ? TUNIC.light : TUNIC.dark; g.fill(); ink(g); }
(async () => {
  const S = JSON.parse(fs.readFileSync(skelFile, 'utf8')); fs.mkdirSync(OUT, { recursive: true });
  const meta = { size: S.h / 2, px: 2, origin: S.origin, actions: {} };
  for (const [clip, C] of Object.entries(S.clips)) {
    meta.actions[clip] = { delay: C.delay, frames: [] };
    C.frames.forEach((F, i) => {
      const J = F.joints, cv = P.createCanvas(S.w, S.h), g = cv.getContext('2d');
      const depth = ks => ks.reduce((a, k) => a + J[k][2], 0) / ks.length;
      const swordSide = len(v(J.grip, J.fistF)) < len(v(J.grip, J.fistN)) ? 'F' : 'N';
      const parts = [];
      for (const s of 'NF') {
        const nearLeg = J['knee' + s][2] < J['knee' + (s === 'N' ? 'F' : 'N')][2], nearArm = J['elbow' + s][2] < J['elbow' + (s === 'N' ? 'F' : 'N')][2];
        parts.push({ z: depth(['hip' + s, 'knee' + s, 'ankle' + s]), draw: () => { limb(g, J['hip' + s], J['knee' + s], 26, 22, nearLeg ? PANTS : { light: PANTS.mid, mid: PANTS.dark, dark: PANTS.dark }); limb(g, J['knee' + s], J['ankle' + s], 22, 20, nearLeg ? PANTS : { light: PANTS.mid, mid: PANTS.dark, dark: PANTS.dark }); boot(g, J, s, nearLeg); } });
        parts.push({ z: depth(['shoulder' + s, 'elbow' + s, 'wrist' + s]), draw: () => {
          limb(g, J['shoulder' + s], J['elbow' + s], nearArm ? 22 : 18, nearArm ? 20 : 16, nearArm ? TUNIC : { light: TUNIC.mid, mid: TUNIC.dark, dark: TUNIC.deep }); limb(g, J['elbow' + s], J['wrist' + s], nearArm ? 19 : 16, nearArm ? 17 : 14, nearArm ? SKIN : { light: SKIN.mid, mid: SKIN.dark, dark: SKIN.deep });
          if (swordSide === s && !F.swordFree) sword(g, J); fist(g, J['fist' + s], v(J['elbow' + s], J['wrist' + s]), nearArm ? 13 : 11, swordSide === s && !F.swordFree); cap(g, J['shoulder' + s], nearArm); } });
      }
      parts.push({ z: depth(['hips', 'neck']), draw: () => torso(g, J) });
      parts.push({ z: depth(['headC']) - 0.02, draw: () => head(g, J, F.face, S.headR) });
      if (F.swordFree) parts.push({ z: 99, draw: () => sword(g, J) });                                   // a dropped sword lies on the ground, behind everything
      parts.sort((p, q) => q.z - p.z).forEach(p => p.draw());
      const file = `${clip}_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(OUT, file)); const b = P.bounds(cv) || { x: 0, y: 0, w: 1, h: 1 };
      const fr = { file, delay: C.delay * (F.hold || 1), lt: [b.x, b.y], rb: [b.x + b.w, b.y + b.h], head: [J.headTop[0], J.headTop[1]], tip: J.tip.slice(0, 2), shoulder: J['shoulder' + swordSide].slice(0, 2) };
      if (F.a0 !== undefined) { fr.a0 = F.a0; fr.a1 = F.a1; }
      meta.actions[clip].frames.push(fr);
    });
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1)); console.log('painted', Object.values(meta.actions).reduce((n, A) => n + A.frames.length, 0), 'puppet frames into', OUT);
})();
