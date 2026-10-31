// hero_vector.js: the Warrior in the cartoon-vector hand (Perry, AD, 2026-10-31; Robin: "rethink the whole art direction;
// try creating a hero in this art style", with a picture of a night village in that hand). Same parts and rig as the
// puppet (tools/hero_puppet.js on work/puppet/skeleton.json), painted with tools/vector.js: no ink, a base tone with a
// cool shade crescent away from the light and crisp lighter patches toward it, rounded forms, saturated colour.
//   node tools/hero_vector.js <skeleton.json> <out dir>
const P = require('./paint.js'); const V = require('./vector.js'); const fs = require('fs'); const path = require('path');
const { alpha } = P; const [skelFile, OUT] = process.argv.slice(2);
const SKIN = V.tones('#f6c9a0', 0.9), HAIR = V.tones('#f07a2a'), TUNIC = V.tones('#2e8fd6'), PANTS = V.tones('#7a5a44'), BOOT = V.tones('#5a3a26'), STEEL = V.tones('#cfd9e4', 0.8), GOLD = V.tones('#e6b23a'), BELT = V.tones('#8a5a35');
const v = (a, b) => [b[0] - a[0], b[1] - a[1]], len = d => Math.hypot(d[0], d[1]), unit = d => { const L = len(d) || 1; return [d[0] / L, d[1] / L]; }, ang = d => Math.atan2(d[1], d[0]);
function capsule(g, p0, p1, w0, w1, t, d = 6) {
  const dir = unit(v(p0, p1)), L = len(v(p0, p1)); g.save(); g.translate(p0[0], p0[1]); g.rotate(ang(dir));
  const path = () => { g.beginPath(); g.moveTo(0, -w0 / 2); g.lineTo(L, -w1 / 2); g.arc(L, 0, w1 / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(0, w0 / 2); g.arc(0, 0, w0 / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); };
  // the light's direction in this capsule's frame
  const c = Math.cos(-ang(dir)), s = Math.sin(-ang(dir)), lx = V.LIGHT[0] * c - V.LIGHT[1] * s, ly = V.LIGHT[0] * s + V.LIGHT[1] * c;
  path(); g.fillStyle = t.shade; g.fill(); g.save(); path(); g.clip(); g.translate(lx * d, ly * d); path(); g.fillStyle = t.base; g.fill(); g.restore();
  g.save(); path(); g.clip(); V.patch(g, L * 0.35 + lx * d * 1.2, ly * Math.max(w0, w1) * 0.22, L * 0.22, Math.max(w0, w1) * 0.14, t.light, 0); g.restore();
  path(); g.lineWidth = 1.5; g.strokeStyle = alpha(t.deep, 0.4); g.stroke(); g.restore();
}
function fist(g, p, dir, r, grips) {
  g.save(); g.translate(p[0], p[1]); g.rotate(ang(dir) - Math.PI / 2);
  V.shaded(g, () => { g.beginPath(); P.rr(g, -r, -r * 0.9, r * 2, r * 1.8, r * 0.7); }, SKIN, 5); V.patch(g, -r * 0.35, -r * 0.35, r * 0.4, r * 0.25, SKIN.light);
  V.shaded(g, () => { g.beginPath(); g.ellipse(-r * 0.55, -r * 0.1, r * 0.42, r * 0.34, -0.5, 0, 7); }, SKIN, 3);
  g.restore();
}
function sword(g, J) {
  const d = unit(v(J.guard, J.tip)), Lb = len(v(J.guard, J.tip)), Lh = len(v(J.guard, J.pommel));
  g.save(); g.translate(J.guard[0], J.guard[1]); g.rotate(ang(d));
  V.shaded(g, () => { g.beginPath(); g.arc(-Lh, 0, 6, 0, 7); }, GOLD, 3);
  V.shaded(g, () => { g.beginPath(); P.rr(g, -Lh + 2, -5, Lh - 2, 10, 3); }, V.tones('#6a4228'), 3);
  V.shaded(g, () => { g.beginPath(); P.rr(g, -4, -14, 8, 28, 3); }, GOLD, 3);
  if (Lb > 6) { V.shaded(g, () => { g.beginPath(); g.moveTo(4, -7); g.lineTo(Lb - 10, -4); g.lineTo(Lb, 0); g.lineTo(Lb - 10, 4); g.lineTo(4, 7); g.closePath(); }, STEEL, 4); g.beginPath(); g.moveTo(8, -2); g.lineTo(Lb - 14, -1); g.lineWidth = 2.5; g.strokeStyle = STEEL.hi; g.stroke(); }
  g.restore();
}
function boot(g, J, s, near) {
  const a = J['ankle' + s], toe = J['toe' + s], heel = J['heel' + s], t = near ? BOOT : V.tones('#4a2f1e');
  capsule(g, [a[0], a[1] - 8], [a[0], a[1] + 6], 24, 24, near ? PANTS : V.tones('#5e4434'), 4);
  V.shaded(g, () => { g.beginPath(); g.moveTo(a[0] - 11, a[1] - 2); g.lineTo(heel[0] - 2, heel[1] - 4); g.quadraticCurveTo(heel[0] - 2, heel[1] + 6, heel[0] + 6, heel[1] + 6); g.lineTo(toe[0] + 4, toe[1] + 6); g.quadraticCurveTo(toe[0] - 10, toe[1] + 2, toe[0] - 6, toe[1] - 8); g.lineTo(a[0] + 11, a[1] - 2); g.closePath(); }, t, 5);
  V.patch(g, (a[0] + toe[0]) / 2, (a[1] + toe[1]) / 2 - 3, 10, 4, t.light, ang(v(a, toe)));
}
function head(g, J, mood, headR) {
  const c = J.headC, up = unit(v(c, J.headTop)), tilt = ang(up) + Math.PI / 2, R = headR * 200; const nose = v(c, J.nose);
  g.save(); g.translate(c[0], c[1]); g.rotate(tilt); const nx = nose[0] * Math.cos(-tilt) - nose[1] * Math.sin(-tilt), fx = nx * 0.45, hy = -R * 0.1;
  V.shaded(g, () => { g.beginPath(); g.ellipse(0, 0, R * 1.02, R * 0.96, 0, 0, 7); }, SKIN, 10);
  V.patch(g, -R * 0.45, -R * 0.2, R * 0.3, R * 0.22, SKIN.light, -0.4);                                                    // the lit cheek
  V.shaded(g, () => { g.beginPath(); g.ellipse(R * 0.92, 6, 7, 9, 0, 0, 7); }, SKIN, 3);                                   // the far ear
  // the hair: one rounded mass, scalloped lighter patches on the lit crown, locks over the brow as rounded tongues
  const hair = () => { g.beginPath(); g.moveTo(R * 0.9, R * 0.3); g.quadraticCurveTo(R * 1.25, -R * 0.1, R * 1.05, -R * 0.55); g.quadraticCurveTo(R * 1.3, -R * 0.75, R * 1.0, -R * 0.95); g.quadraticCurveTo(R * 0.5, -R * 1.25, -R * 0.3, -R * 1.1); g.quadraticCurveTo(-R * 0.9, -R * 1.05, -R * 1.08, -R * 0.55); g.quadraticCurveTo(-R * 1.15, -R * 0.2, -R * 1.0, R * 0.05);
    for (const [x, y, r] of [[-R * 0.78, -R * 0.02, R * 0.22], [-R * 0.42, -R * 0.06, R * 0.22], [-R * 0.06, -R * 0.08, R * 0.22], [R * 0.3, -R * 0.12, R * 0.2], [R * 0.66, -R * 0.18, R * 0.18]]) g.arc(x + fx * 0.3, y, r, Math.PI, 0, true);   // the locks: rounded tongues
    g.closePath(); };
  V.shaded(g, hair, HAIR, 12);
  g.save(); hair(); g.clip(); V.scallops(g, -R * 0.1, -R * 0.3, R * 0.75, Math.PI * 1.08, Math.PI * 1.72, 5, R * 0.2, HAIR.light); V.scallops(g, -R * 0.2, -R * 0.35, R * 0.62, Math.PI * 1.15, Math.PI * 1.55, 3, R * 0.14, HAIR.hi); g.restore();
  // the face: eyes with a coloured iris, no ring; thin brows; a small nose; the mouth by mood; blush
  const eyes = mood === 'shock' ? 'shock' : (mood === 'blink' || mood === 'dead') ? 0.15 : mood === 'hurt' ? 0.3 : 1, rx = R * 0.22, ry = R * 0.3, ey = hy + R * 0.3;
  for (const ex of [fx - R * 0.48, fx + R * 0.16]) {
    if (eyes !== 'shock' && eyes < 0.3) { g.beginPath(); g.moveTo(ex - rx, ey); g.quadraticCurveTo(ex, ey + (mood === 'dead' ? -6 : 6), ex + rx, ey); g.lineWidth = 3; g.strokeStyle = HAIR.deep; g.stroke(); continue; }
    const shock = eyes === 'shock', kx = shock ? 1.25 : 1, ky = shock ? 1.2 : eyes;
    g.beginPath(); g.ellipse(ex, ey, rx * kx, ry * ky, 0, 0, 7); g.fillStyle = '#fffaf2'; g.fill();
    g.beginPath(); g.ellipse(ex, ey - ry * ky * 0.45, rx * kx, ry * ky * 0.5, 0, Math.PI, 0); g.fillStyle = alpha(V.SHADE_TINT, 0.18); g.fill();   // the lid's shadow
    if (shock) { g.beginPath(); g.ellipse(ex - 1, ey + 2, rx * 0.3, ry * 0.36, 0, 0, 7); g.fillStyle = '#1e1612'; g.fill(); }
    else { g.beginPath(); g.ellipse(ex - 3, ey + 2, rx * 0.55, ry * 0.6 * eyes, 0, 0, 7); g.fillStyle = '#2f6fb8'; g.fill(); g.beginPath(); g.ellipse(ex - 3, ey + 3, rx * 0.32, ry * 0.38 * eyes, 0, 0, 7); g.fillStyle = '#152238'; g.fill(); g.beginPath(); g.ellipse(ex - 7, ey - 3 * eyes, 3.2, 3.8, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill(); }
    const bu = mood === 'grr' ? 6 : shock ? -10 : 0; g.beginPath(); g.moveTo(ex - rx + 2, ey - ry - 5 + bu); g.quadraticCurveTo(ex, ey - ry - 8 + bu, ex + rx * 0.7, ey - ry - 5 + bu); g.lineWidth = 3; g.strokeStyle = HAIR.deep; g.stroke();
  }
  g.beginPath(); g.moveTo(fx - R * 0.12, hy + R * 0.5); g.quadraticCurveTo(fx - R * 0.2, hy + R * 0.6, fx - R * 0.08, hy + R * 0.62); g.lineWidth = 2; g.strokeStyle = SKIN.deep; g.stroke();
  const mx = fx - R * 0.2, my = hy + R * 0.76; g.strokeStyle = SKIN.deep; g.fillStyle = '#7a3540';
  if (mood === 'open' || mood === 'blink') { g.beginPath(); g.arc(mx, my, 7, 0.3, Math.PI - 0.3); g.lineWidth = 2.5; g.stroke(); }
  else if (mood === 'hurt') { g.beginPath(); g.ellipse(mx, my + 2, 6, 8, 0, 0, 7); g.fill(); }
  else if (mood === 'shock') { g.beginPath(); g.ellipse(mx, my + 4, 12, 14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(mx, my + 12, 7, 5, 0, 0, 7); g.fillStyle = '#e06a6a'; g.fill(); }
  else if (mood === 'grr') { g.beginPath(); P.rr(g, mx - 10, my - 4, 20, 8, 3); g.fill(); g.fillStyle = '#fffaf2'; g.fillRect(mx - 6, my - 3, 12, 3); }
  else { g.beginPath(); g.moveTo(mx - 8, my); g.lineTo(mx + 8, my); g.lineWidth = 2.5; g.stroke(); }
  for (const bx of [fx - R * 0.78, fx + R * 0.42]) V.patch(g, bx, hy + R * 0.66, 8, 4.5, alpha('#ff8f86', 0.6));
  g.restore();
}
function torso(g, J) {
  const h = J.hips, n = J.neck, d = unit(v(h, n)), L = len(v(h, n)), s = L / 52;
  g.save(); g.translate(h[0], h[1] + 6); g.rotate(ang(d) + Math.PI / 2); g.scale(s, s);
  V.shaded(g, () => { g.beginPath(); P.rr(g, -11, -62, 22, 16, 6); }, SKIN, 4);
  const tunic = () => { g.beginPath(); g.moveTo(-34, -50); g.quadraticCurveTo(-38, -22, -38, 4); g.quadraticCurveTo(-2, 12, 34, 4); g.quadraticCurveTo(36, -22, 30, -50); g.quadraticCurveTo(-2, -58, -34, -50); g.closePath(); };
  V.shaded(g, tunic, TUNIC, 9); g.save(); tunic(); g.clip(); V.patch(g, -16, -30, 12, 20, TUNIC.light, 0.2); g.fillStyle = TUNIC.light; g.beginPath(); g.moveTo(-16, -52); g.lineTo(-4, -40); g.lineTo(10, -52); g.closePath(); g.fill(); g.restore();
  V.shaded(g, () => { g.beginPath(); P.rr(g, -40, -12, 80, 10, 3); }, BELT, 3); V.shaded(g, () => { g.beginPath(); P.rr(g, -16, -13, 13, 12, 2); }, GOLD, 3);
  g.restore();
}
function cap(g, p, near) { V.shaded(g, () => { g.beginPath(); g.ellipse(p[0], p[1], near ? 15 : 12, near ? 11 : 9, -0.3, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); }, TUNIC, 4); }
(async () => {
  const S = JSON.parse(fs.readFileSync(skelFile, 'utf8')); fs.mkdirSync(OUT, { recursive: true });
  const meta = { size: S.h / 2, px: 2, origin: S.origin, actions: {} };
  for (const [clip, C] of Object.entries(S.clips)) {
    meta.actions[clip] = { delay: C.delay, frames: [] };
    C.frames.forEach((F, i) => {
      const J = F.joints, cv = P.createCanvas(S.w, S.h), g = cv.getContext('2d');
      const depth = ks => ks.reduce((a, k) => a + J[k][2], 0) / ks.length, swordSide = len(v(J.grip, J.fistF)) < len(v(J.grip, J.fistN)) ? 'F' : 'N', parts = [];
      for (const s of 'NF') {
        const o = s === 'N' ? 'F' : 'N', nearLeg = J['knee' + s][2] < J['knee' + o][2], nearArm = J['elbow' + s][2] < J['elbow' + o][2];
        parts.push({ z: depth(['hip' + s, 'knee' + s, 'ankle' + s]), draw: () => { const t = nearLeg ? PANTS : V.tones('#5e4434'); capsule(g, J['hip' + s], J['knee' + s], 26, 22, t); capsule(g, J['knee' + s], J['ankle' + s], 22, 20, t); boot(g, J, s, nearLeg); } });
        parts.push({ z: depth(['shoulder' + s, 'elbow' + s, 'wrist' + s]), draw: () => {
          capsule(g, J['shoulder' + s], J['elbow' + s], nearArm ? 22 : 18, nearArm ? 20 : 16, nearArm ? TUNIC : V.tones('#2270ad')); capsule(g, J['elbow' + s], J['wrist' + s], nearArm ? 19 : 16, nearArm ? 17 : 14, nearArm ? SKIN : V.tones('#dcae86', 0.9));
          if (swordSide === s && !F.swordFree) sword(g, J); fist(g, J['fist' + s], v(J['elbow' + s], J['wrist' + s]), nearArm ? 13 : 11, swordSide === s); cap(g, J['shoulder' + s], nearArm); } });
      }
      parts.push({ z: depth(['hips', 'neck']), draw: () => torso(g, J) }); parts.push({ z: depth(['headC']) - 0.02, draw: () => head(g, J, F.face, S.headR) });
      if (F.swordFree) parts.push({ z: 99, draw: () => sword(g, J) });
      parts.sort((p, q) => q.z - p.z).forEach(p => p.draw());
      const file = `${clip}_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(OUT, file)); const b = P.bounds(cv) || { x: 0, y: 0, w: 1, h: 1 };
      const fr = { file, delay: C.delay * (F.hold || 1), lt: [b.x, b.y], rb: [b.x + b.w, b.y + b.h], head: [J.headTop[0], J.headTop[1]], tip: J.tip.slice(0, 2), shoulder: J['shoulder' + swordSide].slice(0, 2) };
      if (F.a0 !== undefined) { fr.a0 = F.a0; fr.a1 = F.a1; } meta.actions[clip].frames.push(fr);
    });
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1)); console.log('painted the vector Warrior into', OUT);
})();
