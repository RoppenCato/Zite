// doll.js: the Warrior, fresh from the start, built the way the reference builds its player (Perry, AD, 2026-11-01; Robin:
// "do a new fresh attempt where you create the maplestory referenced one from start"). What the reference's player is,
// measured from its own data (my scratch study of the client's character parts, never copied): a paper doll of a few
// painted parts, the feet as the origin, the body 21x31 under a head 39x35 (the head half the height and wider than the
// body), one slim arm hung on the navel, the sword as long as the body is tall held in that hand, hands as small balls,
// big boots; a face set low and forward on the head, both eyes seen on a side-on body; smooth soft shading, one thin dark
// line; few frames with strong poses: a slow 3-frame breath, a 4-frame stride, attacks that lunge half the body's height
// and hold the strike. This paints the same doll at our scale (65 reference px -> 200 px at 2x) in our own tones and
// shapes, from pose dictionaries in the reference's units (x forward is negative, y up is negative, the feet at 0,0).
// Robin, 2026-11-01: "you're building the body in lots of different parts, which makes it very doll-like": so the body
// (torso and both legs, the boots) is ONE unit, filled first and given one silhouette line round the whole, as the
// reference's body is one picture; the head with its hair is one unit, each arm with its fist one unit. Only a few thin
// inner lines (the near leg's edge, the hairline) sit inside a unit. Writes <act>_<nn>.png and meta.json for tools/pack.js.
//   node tools/doll.js <out dir> [--only stand,attack1] [--sheet work/doll/sheet.png]
const P = require('./paint.js'); const B = require('./brush.js'); const fs = require('fs'); const path = require('path');
const { alpha, mix } = P; const a = process.argv.slice(2); const OUT = a[0] || 'work/doll/paint'; const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const S = 200 / 65, W = 560, H = 340, OX = 300, OY = 310, INK = '#2b2320', LINE = 2.2;
const px = p => [OX + p[0] * S, OY + p[1] * S];
const v = (p, q) => [q[0] - p[0], q[1] - p[1]], len = d => Math.hypot(d[0], d[1]), unit = d => { const L = len(d) || 1; return [d[0] / L, d[1] / L]; }, ang = d => Math.atan2(d[1], d[0]);
const add = (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k], rad = deg => deg * Math.PI / 180;
// the tones: soft sets, light to dark (the reference's hand: smooth gradients, many colours, a dark line)
const SKIN = { light: '#fff1de', mid: '#fde0c0', dark: '#f0b98e', deep: '#c98a5e' }, HAIR = { light: '#ffb562', mid: '#ef7c36', dark: '#bf4f1c', deep: '#7c2f10' };
const TUNIC = { light: '#86bdf6', mid: '#4a8ade', dark: '#2d5fae', deep: '#1e417e' }, PANTS = { light: '#d9b47c', mid: '#b58c56', dark: '#7e5c36' }, BOOT = { light: '#c9583f', mid: '#9c3a2c', dark: '#5e2018' };   // tan trousers, red boots: the legs stay bright at phone size, as the reference keeps its shorts and shoes bright
const STEEL = { light: '#f7fafd', mid: '#c6d0dc', dark: '#8795a6' }, GOLD = { light: '#f8dc82', mid: '#d8a84c', dark: '#9a6c22' }, BELT = { mid: '#7a4a2a', dark: '#4a2a14' };
function ink(g, w = 2.5, al = 1) { g.lineWidth = w; g.strokeStyle = al < 1 ? alpha(INK, al) : INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
const inner = g => ink(g, 1.6, 0.5);   // a thin line inside a unit
// a unit: parts filled on their own canvas, then stamped onto the frame under ONE silhouette line round everything painted (brush.outline)
function stamp(g, draw) { const cv = P.createCanvas(W, H); draw(cv.getContext('2d')); g.drawImage(B.outline(cv, LINE), 0, 0); }
function smoothClosed(g, pts) {   // a closed curve through the points (quadratics through the midpoints)
  const n = pts.length; g.beginPath(); const m = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  g.moveTo(...m(0)); for (let i = 1; i <= n; i++) { const p = pts[i % n], q = m(i); g.quadraticCurveTo(p[0], p[1], q[0], q[1]); } g.closePath();
}
// a tube: a limb through a chain of points with a width at each, one closed path, lit across (the light from the upper left); no line of its own unless asked
function tube(g, pts, ws, t, o = {}) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const d = unit(v(pts[Math.max(0, i - 1)], pts[Math.min(n - 1, i + 1)])), nn = [-d[1], d[0]]; L.push(add(pts[i], nn, -ws[i] / 2)); R.push(add(pts[i], nn, ws[i] / 2)); }
  const path = () => { g.beginPath(); g.moveTo(...L[0]); for (let i = 1; i < n; i++) g.lineTo(...L[i]); const d1 = unit(v(pts[n - 2], pts[n - 1])); g.arc(pts[n - 1][0], pts[n - 1][1], ws[n - 1] / 2, ang(d1) - Math.PI / 2, ang(d1) + Math.PI / 2); for (let i = n - 1; i >= 0; i--) g.lineTo(...R[i]); const d0 = unit(v(pts[1], pts[0])); g.arc(pts[0][0], pts[0][1], ws[0] / 2, ang(d0) - Math.PI / 2, ang(d0) + Math.PI / 2); g.closePath(); };
  const d = unit(v(pts[0], pts[n - 1])), nn = [-d[1], d[0]], w = Math.max(...ws), c = pts[Math.floor(n / 2)], lightSide = (nn[0] + nn[1] * 0.5) < 0 ? -1 : 1;   // the normal toward the upper-left light
  path(); g.fillStyle = P.lin(g, c[0] - nn[0] * w / 2 * lightSide, c[1] - nn[1] * w / 2 * lightSide, c[0] + nn[0] * w / 2 * lightSide, c[1] + nn[1] * w / 2 * lightSide, [[0, t.light], [0.45, t.mid], [1, t.dark]]); g.fill();
  if (o.edge) { path(); inner(g); }
}
function bendPoint(A, B2, L, k) {   // the joint between A and B for two segments of length L, bent to side k of the A->B line
  const d = v(A, B2), D = len(d), m = [(A[0] + B2[0]) / 2, (A[1] + B2[1]) / 2], u = unit(d), nn = [-u[1], u[0]], h = Math.sqrt(Math.max(0, L * L - D * D / 4));
  return add(m, nn, k * h);
}
// ---- the body: ONE drawn contour from the neck round both legs and boots and back, painted inside, one line round it ----
// Robin, 2026-11-01: "the body doesn't look one form, arms and legs are still their own parts". So no torso shape with leg
// tubes under it: the contour below is a single closed path (shoulder, chest, the hem flaring over the front leg, down to
// the front boot, up to the crotch, down the back leg to its boot, up the back), filled once, the tunic and the boots
// painted inside it as colour zones, and the one line stroked round the whole. The legs are short straight stubs from the
// hips to the boots, as the reference's are; the knee is a bend in the contour, never a joint.
function body(g, F) {
  const N = px(F.neck), Hp = px(F.hips), up = unit(v(Hp, N)), side = [-up[1], up[0]], h = len(v(Hp, N)) / S;   // side = screen right = the back; h the torso's height in reference px
  const T = (x, y) => add(add(Hp, side, x * S), up, -y * S);                                                   // torso-local: x back-positive, y down-positive, in reference px
  const legOf = (ankle, foot, xTop, near) => {                                                                 // a leg's points from its top at the hips to its boot
    const t = T(xTop, 3), d = unit(v(t, ankle)), n = [-d[1], d[0]], f = unit(foot || [-1, 0]), u = [-f[1], f[0]];   // n points forward of the leg, u up from the sole
    const hwT = 4.2 * S, hwA = 3.6 * S, mid = add(t, v(t, ankle), 0.5), A = add(ankle, d, -4 * S);
    return { near, t, ankle, d, n, f, u,
      frontTop: add(t, n, hwT), frontMid: add(mid, n, (hwT + hwA) / 2), frontAnkle: add(A, n, hwA), backAnkle: add(A, n, -hwA), backMid: add(mid, n, -(hwT + hwA) / 2), backTop: add(t, n, -hwT),
      toeTop: add(add(ankle, f, 8.5 * S), u, 4.5 * S), toe: add(add(ankle, f, 11 * S), u, 0.5 * S), soleFront: add(add(ankle, f, 10 * S), u, -2 * S), soleBack: add(add(ankle, f, -3.5 * S), u, -2 * S), heel: add(add(ankle, f, -4.5 * S), u, 0.5 * S), heelTop: add(add(ankle, f, -3.6 * S), u, 4.5 * S) };
  };
  const nearLeg = legOf(px(F.ankleN), F.footN, -3, true), farLeg = legOf(px(F.ankleF), F.footF, 3, false);
  const [front, back] = nearLeg.ankle[0] <= farLeg.ankle[0] ? [nearLeg, farLeg] : [farLeg, nearLeg];           // the leg further forward leads the contour
  const round = L => [L.frontTop, L.frontMid, L.frontAnkle, L.toeTop, L.toe, L.toe, L.soleFront, L.soleBack, L.heel, L.heel, L.heelTop, L.backMid, L.backTop];   // doubled corners stay crisp
  const contour = () => smoothClosed(g, [T(-5, -h - 1), T(-10.5, -h + 2.5), T(-11.5, -h * 0.55), T(-11, -h * 0.2), T(-12, 1.5), ...round(front), T(0, 6.5), ...round(back), T(12, 1.5), T(11, -h * 0.2), T(11.5, -h * 0.55), T(10.5, -h + 2.5), T(5, -h - 1)]);
  const stripe = L => { g.beginPath(); [L.frontTop, L.frontMid, L.frontAnkle, L.backAnkle, L.backMid, L.backTop].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); };
  const boot = L => { g.beginPath(); [L.frontAnkle, L.toeTop, L.toe, L.soleFront, L.soleBack, L.heel, L.heelTop, L.backAnkle].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); };
  const across = (L, t) => P.lin(g, L.frontMid[0], L.frontMid[1], L.backMid[0], L.backMid[1], [[0, t.light], [0.5, t.mid], [1, t.dark]]);
  g.save(); contour(); g.clip();
  g.fillStyle = PANTS.mid; g.fillRect(0, 0, W, H);                                                                                        // the ground tone of the whole form
  for (const L of [farLeg, nearLeg]) {                                                                                                       // the far leg first, darker; the near leg over it
    const tp = L.near ? PANTS : { light: PANTS.mid, mid: PANTS.dark, dark: PANTS.dark }, tb = L.near ? BOOT : { light: BOOT.mid, mid: BOOT.dark, dark: BOOT.dark };
    stripe(L); g.fillStyle = across(L, tp); g.fill();
    boot(L); g.fillStyle = P.lin(g, L.ankle[0], L.ankle[1] - 5 * S, L.ankle[0], L.ankle[1] + 2 * S, [[0, tb.light], [0.45, tb.mid], [1, tb.dark]]); g.fill();
    g.beginPath(); g.moveTo(...add(L.heel, L.u, 1.5 * S)); g.lineTo(...add(L.toe, L.u, 1.5 * S)); g.lineWidth = 2.4; g.strokeStyle = alpha(tb.dark, 0.7); g.stroke();   // the sole's line
    if (L.near) { stripe(L); inner(g); boot(L); inner(g); }                                                                                 // a thin edge so the near leg reads in front of the far one
  }
  const tunic = () => { g.beginPath(); [T(-16, -h - 8), T(16, -h - 8), T(16, 1), T(-16, 1)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); };   // the tunic zone, cut by the contour
  g.save(); tunic(); g.clip(); const c = T(-3, -h * 0.6);
  g.fillStyle = P.rad(g, c[0], c[1], c[0] + side[0] * 4, c[1] + side[1] * 4, 30 * S, [[0, TUNIC.light], [0.5, TUNIC.mid], [1, TUNIC.dark]]); g.fillRect(0, 0, W, H);
  g.beginPath(); [T(-16, -2.5), T(16, -2.5), T(16, 0.6), T(-16, 0.6)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fillStyle = BELT.mid; g.fill();   // the belt
  g.beginPath(); [T(-16, 0), T(16, 0), T(16, 1), T(-16, 1)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fillStyle = BELT.dark; g.fill();
  const bk = T(-2, -1.2); g.beginPath(); g.ellipse(bk[0], bk[1], 2.6 * S, 2.2 * S, 0, 0, 7); g.fillStyle = GOLD.mid; g.fill(); ink(g, 1.4, 0.7);                                  // the buckle
  g.beginPath(); [T(-3.5, -h - 1), T(0, -h + 3), T(3.5, -h - 1)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fillStyle = TUNIC.deep; g.fill();   // the collar's V
  g.beginPath(); [T(-16, -4.5), T(0, -3), T(16, -4.5), T(16, -2.5), T(-16, -2.5)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fillStyle = alpha(TUNIC.deep, 0.35); g.fill();   // the hem's shade
  g.restore();
  g.beginPath(); [T(-16, 1), T(16, 1), T(16, 3.5), T(-16, 3.5)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fillStyle = alpha(INK, 0.18); g.fill();   // the tunic's shadow on the trousers
  g.restore();
  const nk = T(0, -h - 2); g.beginPath(); P.rr(g, nk[0] - 4 * S, nk[1] - 4 * S, 8 * S, 6 * S, 8); g.fillStyle = SKIN.dark; g.fill();                        // the neck, under the head
  contour(); ink(g);
}
// ---- an arm: ONE tapered form from the shoulder to the hand, the hand its rounded end (no separate fist), the sleeve a colour zone ----
function arm(g, shoulder, hand, near, o = {}) {
  const elbow = bendPoint(shoulder, hand, 25.5, o.bend === undefined ? -1 : o.bend), d = unit(v(elbow, hand));
  const wrist = add(hand, d, -7), tip = add(hand, d, 7), pts = [shoulder, elbow, wrist, tip], ws = [26, 21, 17, 23];
  const ts = near ? SKIN : { light: SKIN.mid, mid: SKIN.dark, dark: SKIN.deep }, tt = near ? TUNIC : { light: TUNIC.mid, mid: TUNIC.dark, dark: TUNIC.deep };
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const dd = unit(v(pts[Math.max(0, i - 1)], pts[Math.min(n - 1, i + 1)])), nn = [-dd[1], dd[0]]; L.push(add(pts[i], nn, -ws[i] / 2)); R.push(add(pts[i], nn, ws[i] / 2)); }
  const path = () => { g.beginPath(); g.moveTo(...L[0]); for (let i = 1; i < n; i++) g.lineTo(...L[i]); g.arc(tip[0], tip[1], ws[n - 1] / 2, ang(d) - Math.PI / 2, ang(d) + Math.PI / 2); for (let i = n - 1; i >= 0; i--) g.lineTo(...R[i]); const d0 = unit(v(pts[1], pts[0])); g.arc(pts[0][0], pts[0][1], ws[0] / 2, ang(d0) - Math.PI / 2, ang(d0) + Math.PI / 2); g.closePath(); };
  const dd = unit(v(shoulder, hand)), nn = [-dd[1], dd[0]], lightSide = (nn[0] + nn[1] * 0.5) < 0 ? -1 : 1, c = elbow;
  g.save(); path(); g.clip();
  g.fillStyle = P.lin(g, c[0] - nn[0] * 13 * lightSide, c[1] - nn[1] * 13 * lightSide, c[0] + nn[0] * 13 * lightSide, c[1] + nn[1] * 13 * lightSide, [[0, ts.light], [0.45, ts.mid], [1, ts.dark]]); g.fillRect(0, 0, W, H);
  const cuff = add(shoulder, v(shoulder, elbow), 0.75), du = unit(v(shoulder, elbow)), nu = [-du[1], du[0]];                                            // the sleeve: the upper arm to just above the elbow
  g.beginPath(); g.moveTo(...add(add(shoulder, du, -30), nu, -30)); g.lineTo(...add(cuff, nu, -30)); g.quadraticCurveTo(...add(cuff, du, 5), ...add(cuff, nu, 30)); g.lineTo(...add(add(shoulder, du, -30), nu, 30)); g.closePath();
  g.fillStyle = P.lin(g, c[0] - nn[0] * 13 * lightSide, c[1] - nn[1] * 13 * lightSide, c[0] + nn[0] * 13 * lightSide, c[1] + nn[1] * 13 * lightSide, [[0, tt.light], [0.45, tt.mid], [1, tt.dark]]); g.fill();
  g.beginPath(); g.moveTo(...add(cuff, nu, -14)); g.quadraticCurveTo(...add(cuff, du, 5), ...add(cuff, nu, 14)); inner(g);                             // the cuff's edge
  g.beginPath(); g.moveTo(...add(add(hand, d, -3), [-d[1], d[0]], -6)); g.quadraticCurveTo(...add(hand, d, 4), ...add(add(hand, d, -3), [-d[1], d[0]], 6)); inner(g);   // the fingers' curl
  g.restore(); path(); ink(g);
}
function sword(g, grip, deg) {   // from the grip point along the angle (0 forward, 90 up): pommel, grip, guard, the long slim blade (the reference's is as long as its body is tall); drawn with its own lines
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
  skull(); g.fillStyle = P.rad(g, -24, -28, -10, -6, 92, [[0, SKIN.light], [0.55, SKIN.mid], [1, SKIN.dark]]); g.fill();
  g.beginPath(); g.ellipse(54, 8, 8, 11, 0, 0, 7); g.fillStyle = SKIN.mid; g.fill(); inner(g); g.beginPath(); g.ellipse(54, 9, 4, 6, 0, 0, 7); ink(g, 1.5, 0.6);   // the ear
  // the face (the reference's layout, measured): both eyes in the front half, right beside each other, their tops at the head's middle; tall almond
  // eyes with a heavy, slanted upper lid; the iris filling the eye, dark above and lighter below, a big highlight at the top front; thick brows just
  // above the lids; a short mouth below, between the eyes; no nose. The far eye is the near one's MIRROR about the face's centre line, not a copy
  // (Robin, 2026-11-01: "like he's got two left eyes"): m flips each eye's shape, lid and brow; the iris's lean and the highlight keep the light's side
  const closed = mood === 'blink' || mood === 'hurt' || mood === 'dead', shock = mood === 'shock';
  for (const [ex, ey, rx, ry, m] of [[-33, 8, 12.5, 14, 1], [4, 7, 12.5, 14, -1]]) {   // Robin, 2026-11-01: the eyes smaller and the same size
    const X = dx => ex + m * dx;
    const eye = () => { g.beginPath(); g.moveTo(X(-rx), ey - ry + 9); g.quadraticCurveTo(X(-rx), ey - ry + 4, X(-rx * 0.5), ey - ry + 3); g.lineTo(X(rx * 0.55), ey - ry); g.quadraticCurveTo(X(rx), ey - ry - 1, X(rx), ey - ry + 4); g.lineTo(X(rx * 0.9), ey + ry * 0.45); g.quadraticCurveTo(X(rx * 0.7), ey + ry, X(-rx * 0.05), ey + ry); g.quadraticCurveTo(X(-rx * 0.75), ey + ry, X(-rx * 0.95), ey + ry * 0.5); g.closePath(); };
    if (closed) { g.beginPath(); if (mood === 'hurt' || mood === 'dead') { g.moveTo(X(-rx), ey - 6); g.lineTo(X(0), ey + 1); g.lineTo(X(rx), ey - 6); } else { g.moveTo(X(-rx), ey - 1); g.quadraticCurveTo(X(0), ey + 7, X(rx), ey - 1); } ink(g, 3.5); }
    else {
      eye(); g.fillStyle = '#fbf7ef'; g.fill();
      g.save(); eye(); g.clip(); const ir = shock ? 0.6 : 0.96;
      g.beginPath(); g.ellipse(ex - 2, ey + 2, rx * ir * 0.92, ry * ir, 0, 0, 7); g.fillStyle = P.lin(g, 0, ey - ry, 0, ey + ry, [[0, '#121820'], [0.5, '#1f2a36'], [1, '#4b6b8c']]); g.fill();   // the iris: near-black above, grey-blue below, leaning to the front
      g.beginPath(); g.ellipse(ex - 2, ey + 5, rx * 0.4, ry * 0.46, 0, 0, 7); g.fillStyle = '#0c1118'; g.fill();                                                      // the pupil
      g.beginPath(); g.ellipse(ex - rx * 0.38, ey - ry * 0.32, rx * 0.36, ry * 0.28, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.beginPath(); g.arc(ex + rx * 0.3, ey + ry * 0.5, 2.6, 0, 7); g.fill();   // the highlights, on the light's side
      g.restore(); eye(); ink(g, 1.2, 0.45);
      g.beginPath(); g.moveTo(X(-rx - 4), ey - ry + 12); g.quadraticCurveTo(X(-rx * 0.6), ey - ry + 2, X(rx * 0.5), ey - ry - 1); g.lineTo(X(rx), ey - ry + 3); ink(g, 4.5);   // the heavy upper lid, rising toward the face's centre
    }
    const bu = mood === 'grr' ? 5 : shock ? -7 : 0, bk = mood === 'grr' ? 1 : 0;   // the brow: thick, right above the lid; the inner end down when fierce
    g.beginPath(); g.moveTo(X(-rx - 3), ey - ry - 2 + bu - bk * 5); g.quadraticCurveTo(X(0), ey - ry - 10 + bu, X(rx + 2), ey - ry - 5 + bu + bk * 5); g.lineWidth = 5; g.strokeStyle = '#3a1a0c'; g.lineCap = 'round'; g.stroke();
  }
  const mx = -19, my = 37;
  if (mood === 'grr') { g.beginPath(); P.rr(g, mx - 9, my - 4, 18, 9, 3); g.fillStyle = '#6a2e2e'; g.fill(); ink(g, 1.8); g.fillStyle = '#fffaf0'; g.fillRect(mx - 6, my - 3, 12, 3); }
  else if (shock || mood === 'hurt') { g.beginPath(); g.ellipse(mx, my + 3, 8, 10, 0, 0, 7); g.fillStyle = '#5a2626'; g.fill(); ink(g, 2); g.beginPath(); g.ellipse(mx, my + 8, 4.5, 3.5, 0, 0, 7); g.fillStyle = '#e06a6a'; g.fill(); }
  else if (mood === 'dead') { g.beginPath(); g.moveTo(mx - 8, my + 2); g.quadraticCurveTo(mx - 4, my - 3, mx, my + 2); g.quadraticCurveTo(mx + 4, my + 7, mx + 8, my + 2); ink(g, 2.2); }
  else { g.beginPath(); g.moveTo(mx - 5, my); g.lineTo(mx + 5, my); ink(g, 2.4); }
  for (const [bx, by, w] of [[-50, 28, 10], [24, 26, 9]]) { g.beginPath(); g.ellipse(bx, by, w, 6, 0, 0, 7); g.fillStyle = alpha('#f3a060', 0.45); g.fill(); }
  // the hair: a cap over the skull with a swept fringe of pointed locks reaching the eyes (the reference's hairline sits on the eyes' tops), two short spikes at the crown, a tuft at the nape; a sheen along the top front; its own line is the hairline
  const hair = () => { g.beginPath(); g.moveTo(54, -2); g.lineTo(70, -10); g.lineTo(60, -28); g.quadraticCurveTo(62, -44, 42, -60); g.lineTo(28, -66); g.lineTo(20, -82); g.lineTo(8, -66); g.lineTo(-6, -80); g.lineTo(-18, -63);
    g.quadraticCurveTo(-44, -64, -60, -40); g.quadraticCurveTo(-70, -26, -68, -14); g.lineTo(-62, -8); g.lineTo(-54, -24); g.lineTo(-44, -10); g.lineTo(-34, -26); g.lineTo(-21, -8); g.lineTo(-12, -24); g.lineTo(2, -12); g.lineTo(14, -28); g.lineTo(27, -16); g.lineTo(38, -30); g.closePath(); };
  hair(); g.fillStyle = P.rad(g, -24, -52, -6, -30, 100, [[0, HAIR.light], [0.4, HAIR.mid], [1, HAIR.dark]]); g.fill();
  g.save(); hair(); g.clip();
  g.beginPath(); g.moveTo(28, -66); g.quadraticCurveTo(66, -36, 58, 10); g.lineTo(90, 10); g.lineTo(90, -90); g.closePath(); g.fillStyle = alpha(HAIR.deep, 0.5); g.fill();              // the back in shade
  g.beginPath(); g.moveTo(-76, -34); g.quadraticCurveTo(-10, -24, 60, -28); g.lineTo(60, 24); g.lineTo(-76, 24); g.closePath(); g.fillStyle = alpha(HAIR.deep, 0.32); g.fill();          // the fringe's underside, in shade over the brow
  g.beginPath(); g.moveTo(-62, -40); g.quadraticCurveTo(-20, -72, 36, -60); g.quadraticCurveTo(10, -58, -12, -52); g.quadraticCurveTo(-40, -46, -62, -40); g.closePath(); g.fillStyle = alpha('#ffe6b0', 0.8); g.fill();   // the sheen
  g.strokeStyle = alpha(HAIR.deep, 0.75); g.lineWidth = 2.2; g.lineCap = 'round'; for (const [x0, y0, x1, y1] of [[-62, -8, -56, -34], [-44, -10, -40, -36], [-21, -8, -19, -34], [2, -12, 2, -36], [27, -16, 25, -38], [20, -82, 17, -58], [-6, -80, -4, -56], [70, -10, 54, -22]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 - 4, (y0 + y1) / 2, x1, y1); g.stroke(); }   // strands from each lock's tip
  g.restore(); hair(); ink(g, 2);
  g.restore();
}
// ---- the poses, in the reference's units: x forward is negative, y up is negative, the feet at 0,0 ----
// fields: neck, hips, head (centre), tilt (degrees, positive leans the head back), handN, bendN (the elbow's side), ankleN, ankleF, footN/footF (the foot's direction),
// sword (degrees: 0 forward, 90 up) or null, swordZ ('front' over the body, 'back' behind it), handF (the far hand, drawn behind, or none), face, delay
const stand = (dy, face) => ({ neck: [-4, -32 - dy], hips: [-5, -21 - dy * 0.6], head: [-6, -47 - dy], tilt: 0, handN: [2, -14 - dy * 0.6], bendN: -1, ankleN: [-7, -2], ankleF: [2, -2], sword: -18, swordZ: 'front', face, delay: 350 });
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
// ---- a frame: back to front, the sword behind if the pose says, the far arm, the ONE body, the head, the sword, the near arm ----
function drawFrame(g, F) {
  const neck = px(F.neck), hips = px(F.hips), headC = px(F.head), handN = px(F.handN);
  const up = unit(v(hips, neck)), side = [-up[1], up[0]];                                   // 'side' points to screen right (the back) when the body is upright; forward is -side
  const shoulderN = add(add(neck, up, -8), side, 14), shoulderF = add(add(neck, up, -8), side, 6), hasSword = F.sword !== null && F.sword !== undefined;   // the shoulders in the torso's back half, where the reference hangs its arm
  if (F.swordFree) { const q = px(F.swordFree); sword(g, q, F.swordFree[2]); }                      // a dropped sword lies on the ground, behind everything
  if (hasSword && F.swordZ === 'back') sword(g, handN, F.sword);
  if (F.handF) arm(g, shoulderF, px(F.handF), false, { bend: 1 });
  body(g, F);
  stamp(g, h => head(h, headC, F.tilt, F.face));
  if (hasSword && F.swordZ !== 'back') sword(g, handN, F.sword);
  arm(g, shoulderN, handN, true, { bend: F.bendN });
  return { headTop: add(headC, [Math.sin(rad(F.tilt)) * 70, -Math.cos(rad(F.tilt)) * 70]), tip: hasSword ? add(handN, [-Math.cos(rad(F.sword)) * 128, -Math.sin(rad(F.sword)) * 128]) : null, shoulder: shoulderN };
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
