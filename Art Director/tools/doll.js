// doll.js: the Warrior, fresh from the start, built the way the reference builds its player (Perry, AD, 2026-11-01; Robin:
// "do a new fresh attempt where you create the maplestory referenced one from start"). What the reference's player is,
// measured from its own data (my scratch study of the client's character parts, never copied): a paper doll of a few
// painted parts, the feet as the origin, the body 21x31 under a head 39x35 (the head half the height and wider than the
// body), one slim arm hung on the navel, the sword as long as the body is tall held in that hand, hands as small balls,
// big boots; a face set low and forward on the head, both eyes seen on a side-on body, the far one narrower; smooth soft
// shading, one thin dark line; few frames with strong poses: a slow 3-frame breath, a 4-frame stride, attacks that lunge
// half the body's height and hold the strike. This paints the same doll at our scale (65 reference px -> 200 px at 2x) in
// our own tones and shapes, from pose dictionaries in the reference's units (x forward is negative, y up is negative, the
// feet at 0,0). Writes <act>_<nn>.png and meta.json for tools/pack.js.
//   node tools/doll.js <out dir> [--only stand,attack1] [--sheet work/doll/sheet.png]
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const { alpha, mix } = P; const a = process.argv.slice(2); const OUT = a[0] || 'work/doll/paint'; const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const S = 200 / 65, W = 560, H = 340, OX = 300, OY = 310, INK = '#2b2320';
const px = p => [OX + p[0] * S, OY + p[1] * S];
const v = (p, q) => [q[0] - p[0], q[1] - p[1]], len = d => Math.hypot(d[0], d[1]), unit = d => { const L = len(d) || 1; return [d[0] / L, d[1] / L]; }, ang = d => Math.atan2(d[1], d[0]);
const add = (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k], rad = deg => deg * Math.PI / 180;
// the tones: soft sets, light to dark (the reference's hand: smooth gradients, many colours, a dark line)
const SKIN = { light: '#fff1de', mid: '#fde0c0', dark: '#f0b98e', deep: '#c98a5e' }, HAIR = { light: '#ffb562', mid: '#ef7c36', dark: '#bf4f1c', deep: '#7c2f10' };
const TUNIC = { light: '#86bdf6', mid: '#4a8ade', dark: '#2d5fae', deep: '#1e417e' }, PANTS = { light: '#d9b47c', mid: '#b58c56', dark: '#7e5c36' }, BOOT = { light: '#c9583f', mid: '#9c3a2c', dark: '#5e2018' };   // tan trousers, red boots: the legs stay bright at phone size, as the reference keeps its shorts and shoes bright
const STEEL = { light: '#f7fafd', mid: '#c6d0dc', dark: '#8795a6' }, GOLD = { light: '#f8dc82', mid: '#d8a84c', dark: '#9a6c22' }, BELT = { mid: '#7a4a2a', dark: '#4a2a14' };
function ink(g, w = 2.5, al = 1) { g.lineWidth = w; g.strokeStyle = al < 1 ? alpha(INK, al) : INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function smoothClosed(g, pts, k = 0.5) {   // a closed curve through the points (quadratics through the midpoints)
  const n = pts.length; g.beginPath(); const m = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  g.moveTo(...m(0)); for (let i = 1; i <= n; i++) { const p = pts[i % n], q = m(i); g.quadraticCurveTo(p[0], p[1], q[0], q[1]); } g.closePath();
}
// a tube: a limb through a chain of points with a width at each, one closed path, lit across (the light from the upper left)
function tube(g, pts, ws, t, o = {}) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const d = unit(v(pts[Math.max(0, i - 1)], pts[Math.min(n - 1, i + 1)])), nn = [-d[1], d[0]]; L.push(add(pts[i], nn, -ws[i] / 2)); R.push(add(pts[i], nn, ws[i] / 2)); }
  const path = () => { g.beginPath(); g.moveTo(...L[0]); for (let i = 1; i < n; i++) g.lineTo(...L[i]); const d1 = unit(v(pts[n - 2], pts[n - 1])); g.arc(pts[n - 1][0], pts[n - 1][1], ws[n - 1] / 2, ang(d1) - Math.PI / 2, ang(d1) + Math.PI / 2); for (let i = n - 1; i >= 0; i--) g.lineTo(...R[i]); const d0 = unit(v(pts[1], pts[0])); g.arc(pts[0][0], pts[0][1], ws[0] / 2, ang(d0) - Math.PI / 2, ang(d0) + Math.PI / 2); g.closePath(); };
  const d = unit(v(pts[0], pts[n - 1])), nn = [-d[1], d[0]], w = Math.max(...ws), c = pts[Math.floor(n / 2)], lightSide = (nn[0] + nn[1] * 0.5) < 0 ? -1 : 1;   // the normal toward the upper-left light
  path(); g.fillStyle = P.lin(g, c[0] - nn[0] * w / 2 * lightSide, c[1] - nn[1] * w / 2 * lightSide, c[0] + nn[0] * w / 2 * lightSide, c[1] + nn[1] * w / 2 * lightSide, [[0, t.light], [0.45, t.mid], [1, t.dark]]); g.fill();
  if (o.ink !== false) { path(); ink(g, o.w || 2.5); }
}
function bendPoint(A, B, L, k) {   // the joint between A and B for two segments of length L, bent to side k of the A->B line
  const d = v(A, B), D = len(d), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], u = unit(d), nn = [-u[1], u[0]], h = Math.sqrt(Math.max(0, L * L - D * D / 4));
  return add(m, nn, k * h);
}
// ---- the parts, each in frame pixels ----
function torso(g, hips, neck, near) {   // the tunic from the hips to the neck, a short skin neck, the belt at the hem
  const d = unit(v(hips, neck)), L = len(v(hips, neck)); g.save(); g.translate(hips[0], hips[1]); g.rotate(ang(d) + Math.PI / 2); const s = L / 100;
  g.beginPath(); P.rr(g, -14, -112 * s, 28, 26 * s, 8); g.fillStyle = SKIN.dark; g.fill(); ink(g);                                                 // the neck
  const body = () => smoothClosed(g, [[-31, -96 * s], [-34, -60 * s], [-36, -14 * s], [-32, 6], [0, 10], [32, 6], [36, -14 * s], [34, -60 * s], [30, -96 * s], [0, -102 * s]]);
  body(); g.fillStyle = P.rad(g, -22, -70 * s, -8, -50 * s, 86, [[0, TUNIC.light], [0.5, TUNIC.mid], [1, TUNIC.dark]]); g.fill();
  g.save(); body(); g.clip(); g.fillStyle = BELT.mid; g.fillRect(-40, -16 * s, 80, 14); g.fillStyle = BELT.dark; g.fillRect(-40, -4 * s, 80, 4);   // the belt
  g.beginPath(); P.rr(g, -8, -17 * s, 16, 15, 3); g.fillStyle = GOLD.mid; g.fill(); ink(g, 1.5); g.fillStyle = GOLD.light; g.fillRect(-6, -15 * s, 5, 4);
  g.beginPath(); g.moveTo(-12, -98 * s); g.lineTo(0, -82 * s); g.lineTo(12, -98 * s); g.closePath(); g.fillStyle = TUNIC.deep; g.fill();                  // the collar's V
  g.beginPath(); g.moveTo(-36, -30 * s); g.quadraticCurveTo(0, -22 * s, 36, -30 * s); g.lineTo(36, 10); g.lineTo(-36, 10); g.closePath(); g.fillStyle = alpha(TUNIC.deep, 0.35); g.fill();   // the hem's shade
  g.restore(); body(); ink(g); g.restore();
}
function leg(g, hip, ankle, near, o = {}) {   // thigh and shin as one tube, the knee bent forward, the boot at the ankle with its toe forward
  const knee = bendPoint(hip, ankle, 30, o.kneeSide || 1), t = near ? PANTS : { light: PANTS.mid, mid: PANTS.dark, dark: PANTS.dark }, b = near ? BOOT : { light: BOOT.mid, mid: BOOT.dark, dark: BOOT.dark };
  tube(g, [hip, knee, ankle], [26, 23, 21], t);
  const d = unit(v(knee, ankle)), f = o.foot || [-1, 0];   // the foot's direction (forward, flat), or as the pose says
  const toe = add(ankle, f, 30), heel = add(ankle, f, -10), up = [-f[1], f[0]];                                             // 'up' is the normal to the foot, pointing up when flat
  g.beginPath(); g.moveTo(...add(ankle, d, -12)); g.lineTo(...add(add(ankle, [-d[1] * 13, d[0] * 13]), d, -10)); g.lineTo(...add(heel, up, -2)); g.quadraticCurveTo(...add(heel, up, 10), ...add(toe, up, 8));
  g.quadraticCurveTo(...add(toe, up, 14), ...add(toe, up, 4)); g.lineTo(...add(add(ankle, [d[1] * 13, -d[0] * 13]), d, -10)); g.closePath();
  g.fillStyle = P.lin(g, ankle[0], ankle[1] - 16, ankle[0], ankle[1] + 12, [[0, b.light], [0.5, b.mid], [1, b.dark]]); g.fill(); ink(g);
  g.beginPath(); g.moveTo(...add(heel, up, 9)); g.lineTo(...add(toe, up, 8)); g.lineWidth = 2.5; g.strokeStyle = alpha(b.dark, 0.7); g.stroke();   // the sole's line
}
function arm(g, shoulder, hand, near, o = {}) {   // sleeve, forearm, fist; the elbow bent to the side the pose says
  const elbow = bendPoint(shoulder, hand, 25.5, o.bend === undefined ? -1 : o.bend), tt = near ? TUNIC : { light: TUNIC.mid, mid: TUNIC.dark, dark: TUNIC.deep }, ts = near ? SKIN : { light: SKIN.mid, mid: SKIN.dark, dark: SKIN.deep };
  tube(g, [elbow, hand], [18, 16], ts); tube(g, [shoulder, elbow], [22, 19], tt);
}
function fist(g, p, dir, near, grips) {   // a ball of a hand, the thumb toward the sword
  const t = near ? SKIN : { light: SKIN.mid, mid: SKIN.dark, dark: SKIN.deep }; g.save(); g.translate(p[0], p[1]); g.rotate(ang(dir));
  g.beginPath(); g.ellipse(0, 0, 13, 11.5, 0, 0, 7); g.fillStyle = P.rad(g, -4, -4, 0, 0, 15, [[0, t.light], [0.6, t.mid], [1, t.dark]]); g.fill(); ink(g);
  g.beginPath(); g.ellipse(7, -6, 5, 4, 0.4, 0, 7); g.fillStyle = t.light; g.fill(); ink(g, 1.5);
  if (grips) { g.beginPath(); g.moveTo(-5, -6); g.quadraticCurveTo(2, -1, -5, 5); ink(g, 1.5, 0.6); }
  g.restore();
}
function sword(g, grip, deg) {   // from the grip point along the angle (0 forward, 90 up): pommel, grip, guard, the long slim blade (the reference's is as long as its body is tall)
  g.save(); g.translate(grip[0], grip[1]); g.rotate(rad(deg) + Math.PI);   // the blade runs toward screen left at 0 degrees, up at 90
  g.beginPath(); g.arc(-16, 0, 6, 0, 7); g.fillStyle = GOLD.mid; g.fill(); ink(g, 1.8);
  g.beginPath(); P.rr(g, -15, -4.5, 30, 9, 4); g.fillStyle = '#5a3a24'; g.fill(); ink(g, 1.8);
  g.beginPath(); P.rr(g, 13, -14, 8, 28, 3); g.fillStyle = P.lin(g, 0, -14, 0, 14, [[0, GOLD.light], [0.5, GOLD.mid], [1, GOLD.dark]]); g.fill(); ink(g, 1.8);
  const Lb = 112; g.beginPath(); g.moveTo(20, -7.5); g.lineTo(Lb - 24, -7.5); g.quadraticCurveTo(Lb - 6, -5, Lb, 0); g.quadraticCurveTo(Lb - 6, 5, Lb - 24, 7.5); g.lineTo(20, 7.5); g.closePath();
  g.fillStyle = P.lin(g, 0, -7.5, 0, 7.5, [[0, STEEL.light], [0.48, STEEL.light], [0.52, STEEL.mid], [1, STEEL.dark]]); g.fill(); ink(g, 2.2);
  g.beginPath(); g.moveTo(24, 0); g.lineTo(Lb - 20, 0); g.lineWidth = 1.4; g.strokeStyle = alpha(STEEL.dark, 0.6); g.stroke();
  g.beginPath(); g.moveTo(28, -4.5); g.lineTo(Lb - 32, -4.5); g.lineWidth = 1.8; g.strokeStyle = '#ffffff'; g.stroke();
  g.restore();
}
function head(g, c, tiltDeg, mood) {   // the skull, the ear, the face laid out as the reference lays it, the hair as a cap with a swept fringe down to the eyes
  const tilt = rad(tiltDeg); g.save(); g.translate(c[0], c[1]); g.rotate(tilt);   // positive leans the head back (its top toward screen right)
  const skull = () => smoothClosed(g, [[0, -54], [-40, -47], [-58, -6], [-50, 34], [-22, 54], [16, 54], [50, 28], [56, -16], [40, -44]]);
  skull(); g.fillStyle = P.rad(g, -24, -28, -10, -6, 92, [[0, SKIN.light], [0.55, SKIN.mid], [1, SKIN.dark]]); g.fill(); ink(g);
  g.beginPath(); g.ellipse(54, 8, 8, 11, 0, 0, 7); g.fillStyle = SKIN.mid; g.fill(); ink(g, 2); g.beginPath(); g.ellipse(54, 9, 4, 6, 0, 0, 7); ink(g, 1.5, 0.6);   // the ear
  // the face (the reference's layout, measured): both eyes in the front half, the far one narrower and right beside the near one, their tops at the
  // head's middle; tall almond eyes with a heavy, nearly flat upper lid; the iris filling the eye, dark above and lighter below, a big highlight at the
  // top front; thick brows just above the lids; a short mouth below, between the eyes; no nose
  const closed = mood === 'blink' || mood === 'hurt' || mood === 'dead', shock = mood === 'shock';
  for (const [ex, ey, rx, ry] of [[-33, 8, 12.5, 14], [4, 7, 12.5, 14]]) {   // Robin, 2026-11-01: the eyes smaller and the same size
    const eye = () => { g.beginPath(); g.moveTo(ex - rx, ey - ry + 9); g.quadraticCurveTo(ex - rx, ey - ry + 4, ex - rx * 0.5, ey - ry + 3); g.lineTo(ex + rx * 0.55, ey - ry); g.quadraticCurveTo(ex + rx, ey - ry - 1, ex + rx, ey - ry + 4); g.lineTo(ex + rx * 0.9, ey + ry * 0.45); g.quadraticCurveTo(ex + rx * 0.7, ey + ry, ex - rx * 0.05, ey + ry); g.quadraticCurveTo(ex - rx * 0.75, ey + ry, ex - rx * 0.95, ey + ry * 0.5); g.closePath(); };
    if (closed) { g.beginPath(); if (mood === 'hurt' || mood === 'dead') { g.moveTo(ex - rx, ey - 6); g.lineTo(ex, ey + 1); g.lineTo(ex + rx, ey - 6); } else { g.moveTo(ex - rx, ey - 1); g.quadraticCurveTo(ex, ey + 7, ex + rx, ey - 1); } ink(g, 3.5); }
    else {
      eye(); g.fillStyle = '#fbf7ef'; g.fill();
      g.save(); eye(); g.clip(); const ir = shock ? 0.6 : 0.96;
      g.beginPath(); g.ellipse(ex - 2, ey + 2, rx * ir * 0.92, ry * ir, 0, 0, 7); g.fillStyle = P.lin(g, 0, ey - ry, 0, ey + ry, [[0, '#121820'], [0.5, '#1f2a36'], [1, '#4b6b8c']]); g.fill();   // the iris: near-black above, grey-blue below
      g.beginPath(); g.ellipse(ex - 2, ey + 5, rx * 0.4, ry * 0.46, 0, 0, 7); g.fillStyle = '#0c1118'; g.fill();                                                      // the pupil
      g.beginPath(); g.ellipse(ex - rx * 0.38, ey - ry * 0.32, rx * 0.36, ry * 0.28, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.beginPath(); g.arc(ex + rx * 0.3, ey + ry * 0.5, 2.6, 0, 7); g.fill();   // the highlights
      g.restore(); eye(); ink(g, 1.2, 0.45);
      g.beginPath(); g.moveTo(ex - rx - 4, ey - ry + 12); g.quadraticCurveTo(ex - rx * 0.6, ey - ry + 2, ex + rx * 0.5, ey - ry - 1); g.lineTo(ex + rx, ey - ry + 3); ink(g, 4.5);   // the heavy upper lid, slanted, a touch past the front corner
    }
    const bu = mood === 'grr' ? 5 : shock ? -7 : 0, bk = mood === 'grr' ? 1 : 0;   // the brow: thick, right above the lid; the inner end down when fierce
    g.beginPath(); g.moveTo(ex - rx - 3, ey - ry - 2 + bu - bk * 5); g.quadraticCurveTo(ex, ey - ry - 10 + bu, ex + rx + 2, ey - ry - 5 + bu + bk * 5); g.lineWidth = 5; g.strokeStyle = '#3a1a0c'; g.lineCap = 'round'; g.stroke();
  }
  const mx = -19, my = 37;
  if (mood === 'grr') { g.beginPath(); P.rr(g, mx - 9, my - 4, 18, 9, 3); g.fillStyle = '#6a2e2e'; g.fill(); ink(g, 1.8); g.fillStyle = '#fffaf0'; g.fillRect(mx - 6, my - 3, 12, 3); }
  else if (shock || mood === 'hurt') { g.beginPath(); g.ellipse(mx, my + 3, 8, 10, 0, 0, 7); g.fillStyle = '#5a2626'; g.fill(); ink(g, 2); g.beginPath(); g.ellipse(mx, my + 8, 4.5, 3.5, 0, 0, 7); g.fillStyle = '#e06a6a'; g.fill(); }
  else if (mood === 'dead') { g.beginPath(); g.moveTo(mx - 8, my + 2); g.quadraticCurveTo(mx - 4, my - 3, mx, my + 2); g.quadraticCurveTo(mx + 4, my + 7, mx + 8, my + 2); ink(g, 2.2); }
  else { g.beginPath(); g.moveTo(mx - 5, my); g.lineTo(mx + 5, my); ink(g, 2.4); }
  for (const [bx, by, w] of [[-50, 28, 10], [24, 26, 9]]) { g.beginPath(); g.ellipse(bx, by, w, 6, 0, 0, 7); g.fillStyle = alpha('#f3a060', 0.45); g.fill(); }
  // the hair: a cap over the skull with a swept fringe of pointed locks reaching the eyes (the reference's hairline sits on the eyes' tops), two short spikes at the crown, a tuft at the nape; a sheen along the top front
  const hair = () => { g.beginPath(); g.moveTo(54, -2); g.lineTo(70, -10); g.lineTo(60, -28); g.quadraticCurveTo(62, -44, 42, -60); g.lineTo(28, -66); g.lineTo(20, -82); g.lineTo(8, -66); g.lineTo(-6, -80); g.lineTo(-18, -63);
    g.quadraticCurveTo(-44, -64, -60, -40); g.quadraticCurveTo(-70, -26, -68, -14); g.lineTo(-62, -8); g.lineTo(-54, -24); g.lineTo(-44, -10); g.lineTo(-34, -26); g.lineTo(-21, -8); g.lineTo(-12, -24); g.lineTo(2, -12); g.lineTo(14, -28); g.lineTo(27, -16); g.lineTo(38, -30); g.closePath(); };
  hair(); g.fillStyle = P.rad(g, -24, -52, -6, -30, 100, [[0, HAIR.light], [0.4, HAIR.mid], [1, HAIR.dark]]); g.fill();
  g.save(); hair(); g.clip();
  g.beginPath(); g.moveTo(28, -66); g.quadraticCurveTo(66, -36, 58, 10); g.lineTo(90, 10); g.lineTo(90, -90); g.closePath(); g.fillStyle = alpha(HAIR.deep, 0.5); g.fill();              // the back in shade
  g.beginPath(); g.moveTo(-76, -34); g.quadraticCurveTo(-10, -24, 60, -28); g.lineTo(60, 24); g.lineTo(-76, 24); g.closePath(); g.fillStyle = alpha(HAIR.deep, 0.32); g.fill();          // the fringe's underside, in shade over the brow
  g.beginPath(); g.moveTo(-62, -40); g.quadraticCurveTo(-20, -72, 36, -60); g.quadraticCurveTo(10, -58, -12, -52); g.quadraticCurveTo(-40, -46, -62, -40); g.closePath(); g.fillStyle = alpha('#ffe6b0', 0.8); g.fill();   // the sheen
  g.strokeStyle = alpha(HAIR.deep, 0.75); g.lineWidth = 2.2; g.lineCap = 'round'; for (const [x0, y0, x1, y1] of [[-62, -8, -56, -34], [-44, -10, -40, -36], [-21, -8, -19, -34], [2, -12, 2, -36], [27, -16, 25, -38], [20, -82, 17, -58], [-6, -80, -4, -56], [70, -10, 54, -22]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 - 4, (y0 + y1) / 2, x1, y1); g.stroke(); }   // strands from each lock's tip
  g.restore(); hair(); ink(g);
  g.restore();
}
// ---- the poses, in the reference's units: x forward is negative, y up is negative, the feet at 0,0 ----
// fields: neck, hips, head (centre), tilt (degrees, positive leans the head back), handN, bendN (the elbow's side), ankleN, ankleF, footN/footF (the foot's direction),
// sword (degrees: 0 forward, 90 up) or null, swordZ ('front' over the body, 'back' behind it), handF (the far hand, drawn behind, or none), face, delay
const stand = (dy, face) => ({ neck: [-4, -32 - dy], hips: [-5, -21 - dy * 0.6], head: [-6, -47 - dy], tilt: 0, handN: [2, -14 - dy * 0.6], bendN: -1, ankleN: [-9, -2], ankleF: [1, -2], sword: -18, swordZ: 'front', face, delay: 350 });
function walk(i, n) {   // a stride: the near leg forward at 0, the far leg half a cycle on; a lifted foot while it swings forward
  const t = i / n, c = Math.cos(2 * Math.PI * t), s = Math.sin(2 * Math.PI * t), c2 = -c, s2 = -s;
  const lift = sv => Math.min(0, sv) * 8, bob = Math.abs(s) * 1.2;
  return { neck: [-6, -31 - bob], hips: [-5, -20 - bob], head: [-9, -46 - bob], tilt: -5, handN: [-3 + 4 * c, -15 - bob], bendN: -1, ankleN: [-14 * c - 3, -2 + lift(s)], ankleF: [-14 * c2 - 3, -2 + lift(s2)], footN: [-1, lift(s) * 0.03], footF: [-1, lift(s2) * 0.03], sword: 4, swordZ: 'front', face: 'open', delay: 120 };
}
const ACTIONS = {
  stand: [stand(0, 'open'), stand(0.6, 'open'), stand(1.2, 'blink'), stand(0.6, 'open')],
  move: [0, 1, 2, 3, 4, 5].map(i => walk(i, 6)),
  attack1: [
    { neck: [1, -30], hips: [1, -20], head: [-1, -45], tilt: 8, handN: [7, -37], bendN: -1, ankleN: [-7, -2], ankleF: [9, -2], sword: 150, swordZ: 'back', face: 'grr', delay: 200 },
    { neck: [-2, -31], hips: [-1, -20.5], head: [-4, -46], tilt: 4, handN: [-5, -42], bendN: -1, ankleN: [-9, -2], ankleF: [9, -2], sword: 105, swordZ: 'back', face: 'grr', delay: 100 },
    { neck: [-14, -28], hips: [-9, -19], head: [-17, -43], tilt: -8, handN: [-24, -32], bendN: 1, ankleN: [-26, -2], ankleF: [8, -2], sword: 45, swordZ: 'front', face: 'grr', delay: 67, smear: true },
    { neck: [-21, -26], hips: [-13, -18], head: [-25, -41], tilt: -12, handN: [-33, -15], bendN: 1, ankleN: [-30, -2], ankleF: [10, -2], sword: -8, swordZ: 'front', face: 'grr', delay: 150, smear: true },
    { neck: [-20, -26], hips: [-13, -18], head: [-24, -41], tilt: -10, handN: [-32, -14], bendN: 1, ankleN: [-30, -2], ankleF: [10, -2], sword: -18, swordZ: 'front', face: 'grr', delay: 150 },
    { neck: [-9, -30], hips: [-7, -20], head: [-12, -45], tilt: -4, handN: [-8, -15], bendN: -1, ankleN: [-16, -2], ankleF: [4, -2], sword: -24, swordZ: 'front', face: 'open', delay: 100 },
  ],
  hit1: [{ neck: [6, -29], hips: [3, -20], head: [8, -43], tilt: 16, handN: [-6, -27], bendN: 1, ankleN: [-11, -2], ankleF: [12, -2], sword: 62, swordZ: 'front', handF: [12, -22], face: 'hurt', delay: 600 }],
  die1: [
    { neck: [8, -28], hips: [4, -20], head: [10, -42], tilt: 22, handN: [-8, -26], bendN: 1, ankleN: [-12, -2], ankleF: [13, -2], sword: 70, swordZ: 'front', handF: [14, -22], face: 'hurt', delay: 83 },
    { neck: [10, -22], hips: [3, -14], head: [13, -36], tilt: 30, handN: [-9, -18], bendN: 1, ankleN: [-16, -2], ankleF: [11, -2], footF: [-0.3, -1], sword: null, swordZ: 'front', handF: [14, -16], face: 'hurt', delay: 83, swordFree: [-16, 0, 6] },
    { neck: [18, -12], hips: [6, -9], head: [24, -24], tilt: 55, handN: [-2, -12], bendN: 1, ankleN: [-18, -1], ankleF: [8, -3], footF: [-0.6, -0.8], sword: null, handF: [20, -8], face: 'dead', delay: 83, swordFree: [-16, 0, 6] },
    { neck: [26, -5], hips: [8, -5], head: [38, -8], tilt: 82, handN: [6, -10], bendN: 1, ankleN: [-18, -1], ankleF: [-8, -2], footN: [-1, 0], footF: [-0.9, -0.4], sword: null, handF: [24, -3], face: 'dead', delay: 83, swordFree: [-16, 0, 6] },
    { neck: [26, -5], hips: [8, -5], head: [38, -8], tilt: 82, handN: [6, -10], bendN: 1, ankleN: [-18, -1], ankleF: [-8, -2], footN: [-1, 0], footF: [-0.9, -0.4], sword: null, handF: [24, -3], face: 'dead', delay: 83, swordFree: [-16, 0, 6], a0: 255, a1: 150 },
    { neck: [26, -5], hips: [8, -5], head: [38, -8], tilt: 82, handN: [6, -10], bendN: 1, ankleN: [-18, -1], ankleF: [-8, -2], footN: [-1, 0], footF: [-0.9, -0.4], sword: null, handF: [24, -3], face: 'dead', delay: 83, swordFree: [-16, 0, 6], a0: 150, a1: 0 },
  ],
};
// ---- a frame: the parts placed from the pose and drawn back to front ----
function drawFrame(g, F) {
  const neck = px(F.neck), hips = px(F.hips), headC = px(F.head), handN = px(F.handN), ankleN = px(F.ankleN), ankleF = px(F.ankleF);
  const up = unit(v(hips, neck)), side = [-up[1], up[0]];                                   // 'side' points to screen right (the back) when the body is upright; forward is -side
  const shoulderN = add(add(neck, up, -7), side, 16), shoulderF = add(add(neck, up, -7), side, 8);   // the shoulders at the torso's back half, where the reference hangs its arm
  const hipN = add(hips, side, -5), hipF = add(hips, side, 5);
  if (F.swordFree) { const q = px(F.swordFree); sword(g, q, F.swordFree[2]); }                      // a dropped sword lies on the ground, behind everything
  if (F.sword !== null && F.sword !== undefined && F.swordZ === 'back') sword(g, handN, F.sword);
  if (F.handF) { const hf = px(F.handF); arm(g, shoulderF, hf, false, { bend: 1 }); fist(g, hf, v(shoulderF, hf), false, false); }
  leg(g, hipF, ankleF, false, { foot: F.footF, kneeSide: 1 });
  torso(g, hips, neck, true);
  leg(g, hipN, ankleN, true, { foot: F.footN, kneeSide: 1 });
  head(g, headC, F.tilt, F.face);
  if (F.sword !== null && F.sword !== undefined && F.swordZ !== 'back') sword(g, handN, F.sword);
  arm(g, shoulderN, handN, true, { bend: F.bendN });
  fist(g, handN, F.sword === null ? v(shoulderN, handN) : [Math.cos(rad(F.sword)) * -1, -Math.sin(rad(F.sword))], true, F.sword !== null);
  return { headTop: add(headC, [Math.sin(rad(F.tilt)) * 70, -Math.cos(rad(F.tilt)) * 70]), tip: F.sword === null ? null : add(handN, [-Math.cos(rad(F.sword)) * 128, -Math.sin(rad(F.sword)) * 128]), shoulder: shoulderN };
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); const only = opt('only') ? opt('only').split(',') : Object.keys(ACTIONS);
  const meta = { size: 100, px: 2, origin: [OX, OY], actions: {} }, sheetRows = [];
  for (const act of only) {
    const frames = ACTIONS[act]; meta.actions[act] = { delay: frames[0].delay, frames: [] }; const row = [];
    frames.forEach((F, i) => {
      const cv = P.createCanvas(W, H), g = cv.getContext('2d'); const marks = drawFrame(g, F);
      const file = `${act}_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(OUT, file)); const b = P.bounds(cv) || { x: 0, y: 0, w: 1, h: 1 };
      const fr = { file, delay: F.delay, lt: [b.x, b.y], rb: [b.x + b.w, b.y + b.h], head: marks.headTop, tip: marks.tip, shoulder: marks.shoulder, smear: !!F.smear };
      if (F.a0 !== undefined) { fr.a0 = F.a0; fr.a1 = F.a1; }
      meta.actions[act].frames.push(fr); row.push(cv);
    });
    sheetRows.push({ act, row });
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
  if (opt('sheet')) {   // a contact sheet at half size (phone pixels), each action a row on grass
    const sc = 0.5, cw = W * sc, ch = H * sc, maxN = Math.max(...sheetRows.map(r => r.row.length)), cv = P.createCanvas(maxN * cw + 10, sheetRows.length * ch), g = cv.getContext('2d');
    g.fillStyle = '#8fd84a'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#2b2320'; g.font = 'bold 13px Arial';
    sheetRows.forEach((r, ri) => { g.fillStyle = alpha('#2b2320', 0.25); g.fillRect(0, ri * ch + OY * sc, cv.width, 1); g.fillStyle = '#2b2320'; g.fillText(r.act, 6, ri * ch + 16); r.row.forEach((c, i) => g.drawImage(c, i * cw + 10, ri * ch, cw, ch)); });
    P.save(cv, opt('sheet')); console.log('wrote', opt('sheet'));
  }
  console.log('painted', only.map(k => `${k} ${ACTIONS[k].length}`).join(', '), 'into', OUT);
})();
