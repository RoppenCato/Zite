// ink.js: the Warrior and the Slime drawn the way an illustrator inks (Mitch, AD, 2026-11-01), approach 1 of three.
// No rectangles, no circles: every form is a smooth closed spline through a few points, filled flat, with a soft painted
// shade and a TAPERED ink line whose weight grows toward the shadow side and thins toward the light, as a brush does.
// Inner lines (the hair's partings, the collar, the knee, the boot's cuff) are open strokes that taper to nothing. The
// figure is built from a skeleton of named points, so a pose moves the points and the same drawing is re-inked: every frame
// comes from the same construction and nothing flickers.
//   node tools/ink.js [out dir]   -> work/approaches/1-ink.png (the page), 1-hero.png, 1-slime.png (the figures alone at 2x)
const P = require('./paint.js'); const path = require('path');
const OUT = path.resolve(__dirname, '..', process.argv[2] || 'work/approaches');

// ---------------------------------------------------------------- splines and ribbons
// a Catmull-Rom spline through pts; a point marked sharp ([x, y, 1]) keeps its corner. Returns sampled points.
function spline(pts, closed = true, n = 10) {
  const Q = []; pts.forEach(p => { if (p[2]) { Q.push(p, p, p); } else Q.push(p); });   // a tripled point makes a corner
  const m = Q.length, out = [], get = i => Q[closed ? ((i % m) + m) % m : Math.max(0, Math.min(m - 1, i))];
  const segs = closed ? m : m - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  if (!closed) out.push([get(m - 1)[0], get(m - 1)[1]]);
  return out;
}
function pathOf(g, S, closed = true) { g.beginPath(); S.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (closed) g.closePath(); }
function fill(g, S, col) { pathOf(g, S); g.fillStyle = col; g.fill(); }
const LIGHT = [-0.55, -0.83];   // the light comes from the upper left; the ink thickens away from it
// a tapered ink ribbon along the samples S: the width at each point is base, thicker where the outward normal faces away
// from the light, tapering to nothing at the ends of an open stroke. Drawn as one filled polygon, so it is one stroke.
function ribbon(g, S, base, col, o = {}) {
  const closed = o.closed !== false, n = S.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    let ia = i, ib = i, a, b;
    do { ia = closed ? (ia - 1 + n) % n : Math.max(0, ia - 1); a = S[ia]; } while (Math.hypot(a[0] - S[i][0], a[1] - S[i][1]) < 0.05 && ia !== i && ia > 0);
    do { ib = closed ? (ib + 1) % n : Math.min(n - 1, ib + 1); b = S[ib]; } while (Math.hypot(b[0] - S[i][0], b[1] - S[i][1]) < 0.05 && ib !== i && ib < n - 1);
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; const nx = ty, ny = -tx;   // the outward normal of a clockwise loop
    const away = Math.max(0, -(nx * LIGHT[0] + ny * LIGHT[1]));
    let w = base * ((o.flat ? 1 : 0.5) + (o.flat ? 0 : 0.9) * away);
    if (!closed) { const t = i / (n - 1), e = Math.min(1, t / (o.taper || 0.25), (1 - t) / (o.taper2 || o.taper || 0.25)); w *= Math.sin(e * Math.PI / 2); }
    if (o.wave) w *= 1 + 0.18 * Math.sin(i * 0.9);
    const inside = o.inside === undefined ? 0.55 : o.inside;   // most of the line sits inside the form, as inked line art does
    L.push([S[i][0] + nx * w * (1 - inside), S[i][1] + ny * w * (1 - inside)]); R.push([S[i][0] - nx * w * inside, S[i][1] - ny * w * inside]);
  }
  g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); R.reverse().forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.fillStyle = col; g.fill();
}
// a soft painted shade inside a form: the shade shape drawn in steps of growing size at low alpha, so its edge is soft
function shade(g, form, shadeS, col, a = 0.9, steps = 4) {
  g.save(); pathOf(g, form); g.clip(); const cx = shadeS.reduce((s, p) => s + p[0], 0) / shadeS.length, cy = shadeS.reduce((s, p) => s + p[1], 0) / shadeS.length;
  for (let k = 0; k < steps; k++) { const s = 1 - 0.08 * (steps - 1 - k); g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy); g.globalAlpha = a / steps * 1.6; fill(g, shadeS, col); g.restore(); }
  g.restore();
}
function glint(g, form, S, col = '#ffffff', a = 0.55) { g.save(); pathOf(g, form); g.clip(); g.globalAlpha = a; fill(g, S, col); g.restore(); }
// a form: fill, shade, ink. pts are control points; shadePts a loop (in the same units) for the shade; inkW the base width
function form(g, pts, col, o = {}) {
  const S = spline(pts, true, o.n || 10); fill(g, S, col);
  if (o.shade) shade(g, S, spline(o.shade, true, 8), o.shadeCol || P.mix(P.darken(col, 0.22), '#4a3a8a', 0.25), o.shadeA || 0.9);
  if (o.glint) glint(g, S, spline(o.glint, true, 8), o.glintCol, o.glintA);
  if (o.ink !== null) ribbon(g, S, o.inkW || 2.2, o.ink || INK, { closed: true, inside: o.inside, flat: o.flat });
  return S;
}
function line(g, pts, w, col = INK, o = {}) { ribbon(g, spline(pts, false, o.n || 10), w, col, { closed: false, taper: o.taper, taper2: o.taper2, inside: 0.5, wave: o.wave, flat: o.flat }); }
const INK = '#2a2030';
const C = { skin: '#ffe2c2', skinShade: '#e8a888', hair: '#ff6b3a', hairShade: '#c8432a', hairLight: '#ffa070', tunic: '#3d7de4', tunicShade: '#2a56b0', tunicLight: '#7ab0ff', belt: '#8a5a3a', trousers: '#9a6a44', boots: '#5c3b2b', bootsShade: '#3a2418', steel: '#eef2f8', steelShade: '#9aa8bc', gold: '#f4c14a', iris: '#2d8f4e', slime: '#78dc52', slimeShade: '#3f9a3a', slimeLight: '#d8ff9e', mouth: '#8a2a3e', tongue: '#ff8aa0', cheek: '#ff8a7a' };

// ---------------------------------------------------------------- the Warrior, side view facing right, 100 units tall, feet at 0,0
// The skeleton: every form is placed from these points, so a pose moves them and re-inks the same drawing.
const POSES = {
  stand: {},
  walk: { hip: [1, -30], neck: [6, -58], head: [7, -78], shF: [12, -54], elF: [23, -47], hF: [31, -41], hB: [-16, -38], elB: [-15, -46], kneeF: [15, -16], footF: [22, -2], kneeB: [-10, -16], footB: [-15, -3] },
  windup: { hip: [-2, -30], neck: [-1, -58], head: [-2, -79], shF: [6, -55], elF: [10, -66], hF: [0, -74], swordDir: [-0.45, -0.89], hB: [-12, -30], kneeF: [10, -18], footF: [15, -2], kneeB: [-9, -17], footB: [-9, -2] },
  strike: { hip: [6, -29], neck: [12, -56], head: [14, -76], shF: [18, -52], elF: [30, -46], hF: [40, -42], swordDir: [0.97, -0.24], hB: [-12, -34], elB: [-13, -44], kneeF: [22, -16], footF: [32, -2], kneeB: [-12, -14], footB: [-20, -2] },
};
function warriorPose(t = {}) {
  const base = { hip: [0, -30], neck: [3, -58], head: [3, -78], shF: [10, -54], elF: [19, -44], hF: [27, -37], shB: [-6, -54], elB: [-13, -44], hB: [-10, -33],
                 kneeF: [8, -18], footF: [12, -2], kneeB: [-6, -18], footB: [-4, -2], swordDir: [0.55, -0.83] };
  return { ...base, ...(typeof t === 'string' ? POSES[t] : t) };
}
function warrior(g, x, y, h, pose = warriorPose(), only = null) {
  const s = h / 100; g.save(); g.translate(x, y); g.scale(s, s); const w = 2.4;   // the ink's base width in figure units
  const J = pose; const on = k => !only || only.includes(k);
  // the far arm, behind everything: a bent sleeve to a fist
  if (on('farArm')) { const eb = J.elB, hb = J.hB, sb = J.shB;
  form(g, [[sb[0] - 5, sb[1] - 2], [sb[0] + 4, sb[1] + 1], [eb[0] + 5, eb[1] + 1], [hb[0] + 4, hb[1] - 2], [hb[0] - 5, hb[1] + 1], [eb[0] - 5, eb[1] - 1]], C.tunicShade, { inkW: w * 0.9 });
  form(g, [[hb[0] - 5, hb[1] - 3], [hb[0] + 5, hb[1] - 4], [hb[0] + 5, hb[1] + 4], [hb[0] - 4, hb[1] + 5]], C.skinShade, { inkW: w * 0.8 }); }
  // the legs: short, the far one in shade; the boots big with a rolled cuff
  for (const [knee, foot, far] of [[J.kneeB, J.footB, true], [J.kneeF, J.footF, false]]) { if (!on(far ? 'legB' : 'legF')) continue;
    const hx = far ? J.hip[0] - 3 : J.hip[0] + 4, hy = J.hip[1] + 2;
    form(g, [[hx - 6, hy], [hx + 6, hy], [knee[0] + 5.5, knee[1]], [foot[0] + 4, foot[1] - 7], [foot[0] - 4, foot[1] - 7], [knee[0] - 5.5, knee[1]]], far ? P.darken(C.trousers, 0.25) : C.trousers,
      { inkW: w * 0.9, shade: far ? null : [[knee[0] + 1, knee[1] - 6], [knee[0] + 6, knee[1]], [foot[0] + 4, foot[1] - 6], [foot[0] - 1, foot[1] - 8]] });
    form(g, [[foot[0] - 7, foot[1] - 10], [foot[0] + 6, foot[1] - 10], [foot[0] + 12, foot[1] - 6], [foot[0] + 13, foot[1] - 1], [foot[0] + 9, foot[1] + 1], [foot[0] - 7, foot[1] + 1], [foot[0] - 9, foot[1] - 4]], far ? C.bootsShade : C.boots,
      { inkW: w, shade: far ? null : [[foot[0] - 2, foot[1] - 5], [foot[0] + 12, foot[1] - 5], [foot[0] + 11, foot[1] + 1], [foot[0] - 6, foot[1] + 1]], glint: far ? null : [[foot[0] - 4, foot[1] - 9], [foot[0] + 3, foot[1] - 9], [foot[0] + 2, foot[1] - 7], [foot[0] - 4, foot[1] - 7]], glintA: 0.25 });
    if (!far) line(g, [[foot[0] - 7, foot[1] - 8], [foot[0] + 1, foot[1] - 9.5], [foot[0] + 7, foot[1] - 8]], w * 0.7);   // the cuff
    if (!far) line(g, [[knee[0] + 2, knee[1] - 3], [knee[0] + 4, knee[1] + 1]], w * 0.6);   // the knee
  }
  // the body: one bean from the neck to the hips, the tunic flaring a little at the hem
  const nk = J.neck, hp = J.hip; if (on('body')) {
  const body = [[nk[0] - 10, nk[1] + 1], [nk[0] + 9, nk[1]], [nk[0] + 14, nk[1] + 10], [hp[0] + 13, hp[1] - 6], [hp[0] + 15, hp[1] + 4], [hp[0] - 14, hp[1] + 4], [hp[0] - 13, hp[1] - 6], [nk[0] - 13, nk[1] + 10]];
  form(g, body, C.tunic, { inkW: w, shade: [[hp[0] + 2, nk[1] + 6], [hp[0] + 14, nk[1] + 12], [hp[0] + 15, hp[1] + 4], [hp[0] - 4, hp[1] + 4], [hp[0] - 2, hp[1] - 10]], glint: [[nk[0] - 9, nk[1] + 4], [nk[0] - 2, nk[1] + 3], [nk[0] - 6, nk[1] + 14], [nk[0] - 11, nk[1] + 12]], glintCol: C.tunicLight, glintA: 0.5 });
  line(g, [[nk[0] - 8, nk[1] + 3], [nk[0] + 1, nk[1] + 9], [nk[0] + 9, nk[1] + 3]], w * 0.7, INK, { taper: 0.2 });   // the collar's V
  form(g, [[hp[0] - 14, hp[1] - 3], [hp[0] + 14, hp[1] - 4], [hp[0] + 14, hp[1] + 1], [hp[0] - 14, hp[1] + 2]], C.belt, { inkW: w * 0.7 });
  form(g, [[hp[0] + 1, hp[1] - 4], [hp[0] + 6, hp[1] - 4], [hp[0] + 6, hp[1] + 1], [hp[0] + 1, hp[1] + 1]], C.gold, { inkW: w * 0.5 }); }
  // the near arm: a sleeve from the shoulder over the elbow to the wrist, one form, then the fist; the sword from the fist
  const sh = J.shF, el = J.elF, hd = J.hF; if (on('armF')) {
  form(g, [[sh[0] - 6, sh[1] - 3], [sh[0] + 5, sh[1] - 4], [el[0] + 5, el[1] - 2], [hd[0] + 3, hd[1] - 4], [hd[0] - 3, hd[1] + 4], [el[0] - 4, el[1] + 4], [sh[0] - 5, sh[1] + 6]], C.tunic, { inkW: w, shade: [[el[0] - 1, el[1] - 1], [el[0] + 5, el[1] - 1], [hd[0] + 3, hd[1] - 3], [hd[0] - 3, hd[1] + 4], [el[0] - 3, el[1] + 4]] });
  line(g, [[sh[0] - 4, sh[1] + 2], [sh[0] + 2, sh[1] + 6], [sh[0] + 6, sh[1] + 3]], w * 0.6, INK, { taper: 0.3 });   // the sleeve's cap
  const d = J.swordDir, px = -d[1], py = d[0];
  const grip = [hd[0] + d[0] * 2, hd[1] + d[1] * 2];
  form(g, [[grip[0] - px * 2.4 - d[0] * 6, grip[1] - py * 2.4 - d[1] * 6], [grip[0] + px * 2.4 - d[0] * 6, grip[1] + py * 2.4 - d[1] * 6], [grip[0] + px * 2.2 + d[0] * 6, grip[1] + py * 2.2 + d[1] * 6], [grip[0] - px * 2.2 + d[0] * 6, grip[1] - py * 2.2 + d[1] * 6]], C.belt, { inkW: w * 0.6 });
  const g0 = [grip[0] + d[0] * 6, grip[1] + d[1] * 6];
  form(g, [[g0[0] - px * 7, g0[1] - py * 7], [g0[0] + px * 7, g0[1] + py * 7], [g0[0] + px * 5 + d[0] * 4, g0[1] + py * 5 + d[1] * 4], [g0[0] - px * 5 + d[0] * 4, g0[1] - py * 5 + d[1] * 4]], C.gold, { inkW: w * 0.6, n: 6 });
  const b0 = [g0[0] + d[0] * 4, g0[1] + d[1] * 4], bl = 44;
  form(g, [[b0[0] - px * 4, b0[1] - py * 4], [b0[0] + px * 4, b0[1] + py * 4], [b0[0] + px * 3.4 + d[0] * bl * 0.8, b0[1] + py * 3.4 + d[1] * bl * 0.8], [b0[0] + d[0] * bl, b0[1] + d[1] * bl, 1], [b0[0] - px * 3.4 + d[0] * bl * 0.8, b0[1] - py * 3.4 + d[1] * bl * 0.8]], C.steel,
    { inkW: w * 0.8, n: 6, shade: [[b0[0] + px * 0.5, b0[1] + py * 0.5], [b0[0] + px * 4, b0[1] + py * 4], [b0[0] + px * 3.4 + d[0] * bl * 0.8, b0[1] + py * 3.4 + d[1] * bl * 0.8], [b0[0] + d[0] * bl, b0[1] + d[1] * bl], [b0[0] + px * 0.5 + d[0] * bl * 0.8, b0[1] + py * 0.5 + d[1] * bl * 0.8]], shadeCol: C.steelShade, shadeA: 0.8 });
  line(g, [[b0[0] + d[0] * 2, b0[1] + d[1] * 2], [b0[0] + d[0] * bl * 0.85, b0[1] + d[1] * bl * 0.85]], w * 0.45, INK, { taper: 0.1, taper2: 0.4 });   // the fuller
  form(g, [[hd[0] - 5, hd[1] - 5], [hd[0] + 4, hd[1] - 6], [hd[0] + 7, hd[1] - 1], [hd[0] + 5, hd[1] + 5], [hd[0] - 4, hd[1] + 5], [hd[0] - 7, hd[1]]], C.skin, { inkW: w * 0.9, shade: [[hd[0], hd[1]], [hd[0] + 7, hd[1] - 1], [hd[0] + 5, hd[1] + 5], [hd[0] - 3, hd[1] + 5]], shadeCol: C.skinShade, shadeA: 0.7 });
  line(g, [[hd[0] - 4, hd[1] + 1], [hd[0] + 1, hd[1] + 2], [hd[0] + 4, hd[1]]], w * 0.5, INK, { taper: 0.3 });   // the fingers' curl
  }
  // the neck, then the head: round, a little chin, the ear at the back
  const hc = J.head; if (on('head')) {
  form(g, [[nk[0] - 4, nk[1] - 4], [nk[0] + 5, nk[1] - 4], [nk[0] + 5, nk[1] + 3], [nk[0] - 4, nk[1] + 3]], C.skinShade, { inkW: w * 0.7 });
  const head = [[hc[0] - 23, hc[1] - 2], [hc[0] - 19, hc[1] - 16], [hc[0] - 6, hc[1] - 24], [hc[0] + 9, hc[1] - 23], [hc[0] + 21, hc[1] - 14], [hc[0] + 25, hc[1]], [hc[0] + 21, hc[1] + 14], [hc[0] + 9, hc[1] + 22], [hc[0] - 4, hc[1] + 21], [hc[0] - 16, hc[1] + 13]];
  form(g, head, C.skin, { inkW: w, shade: [[hc[0] - 10, hc[1] + 12], [hc[0] + 10, hc[1] + 12], [hc[0] + 22, hc[1] + 6], [hc[0] + 20, hc[1] + 16], [hc[0] + 9, hc[1] + 22], [hc[0] - 4, hc[1] + 21], [hc[0] - 16, hc[1] + 13]], shadeCol: C.skinShade, shadeA: 0.65 });
  form(g, [[hc[0] - 24, hc[1] + 1], [hc[0] - 20, hc[1] - 3], [hc[0] - 16, hc[1] + 1], [hc[0] - 18, hc[1] + 7], [hc[0] - 23, hc[1] + 7]], C.skin, { inkW: w * 0.8, shade: [[hc[0] - 21, hc[1] + 1], [hc[0] - 18, hc[1] + 1], [hc[0] - 19, hc[1] + 6], [hc[0] - 22, hc[1] + 5]], shadeCol: C.skinShade });   // the ear
  // the face, drawn before the hair so the fringe lies over the brow
  const ey = hc[1] + 1;
  for (const [ex, ew, eh, near] of [[hc[0] + 13, 5.4, 7.6, true], [hc[0] - 2, 4.6, 7, false]]) {
    const eye = [[ex - ew, ey], [ex - ew * 0.7, ey - eh * 0.9], [ex + ew * 0.3, ey - eh], [ex + ew, ey - eh * 0.4], [ex + ew * 0.9, ey + eh * 0.5], [ex + ew * 0.2, ey + eh], [ex - ew * 0.7, ey + eh * 0.7]];
    const S = form(g, eye, '#ffffff', { ink: null });
    g.save(); pathOf(g, S); g.clip(); fill(g, spline([[ex - ew * 0.5, ey - eh * 0.7], [ex + ew * 0.8, ey - eh * 0.7], [ex + ew * 0.8, ey + eh], [ex - ew * 0.5, ey + eh]]), C.iris);
    fill(g, spline([[ex - ew * 0.2, ey - eh * 0.4], [ex + ew * 0.7, ey - eh * 0.4], [ex + ew * 0.7, ey + eh], [ex - ew * 0.2, ey + eh]]), INK);
    g.fillStyle = P.alpha(INK, 0.35); g.fillRect(ex - ew, ey - eh, ew * 2, eh * 0.55);   // the lid's shadow over the eye
    fill(g, spline([[ex - ew * 0.3, ey - eh * 0.45], [ex + ew * 0.1, ey - eh * 0.5], [ex + ew * 0.1, ey - eh * 0.1], [ex - ew * 0.3, ey - eh * 0.05]]), '#ffffff'); g.restore();
    line(g, [[ex - ew * 1.1, ey - eh * 0.2], [ex - ew * 0.5, ey - eh * 1.05], [ex + ew * 0.5, ey - eh * 1.05], [ex + ew * 1.05, ey - eh * 0.3]], w * (near ? 1.1 : 0.9), INK, { taper: 0.15, taper2: 0.35 });   // the heavy upper lid
    line(g, [[ex - ew * 0.6, ey + eh * 0.9], [ex + ew * 0.5, ey + eh * 0.9]], w * 0.4, INK, { taper: 0.4 });   // the lower lid, faint
    line(g, [[ex - ew * 1.2, ey - eh * 1.7], [ex, ey - eh * 2.0], [ex + ew * 1.1, ey - eh * 1.6]], w * 0.8, C.hairShade, { taper: 0.3, taper2: 0.3 });   // the brow
  }
  line(g, [[hc[0] + 23, ey + 5], [hc[0] + 25, ey + 8]], w * 0.5, INK, { taper: 0.4 });   // the nose, a tick on the profile
  line(g, [[hc[0] + 10, hc[1] + 14], [hc[0] + 15, hc[1] + 16.5], [hc[0] + 20, hc[1] + 14]], w * 0.7, INK, { taper: 0.3 });   // the mouth
  g.save(); g.globalAlpha = 0.35; fill(g, spline([[hc[0] + 17, hc[1] + 8], [hc[0] + 24, hc[1] + 7], [hc[0] + 24, hc[1] + 12], [hc[0] + 17, hc[1] + 12]]), C.cheek); g.restore(); }
  // the hair: one mass, swept back in big uneven locks, the fringe falling over the brow in three locks, the ink thick in the parting
  if (on('hair')) { const H = hc, hair = [[H[0] + 24, H[1] - 8], [H[0] + 20, H[1] - 18], [H[0] + 10, H[1] - 26], [H[0] - 2, H[1] - 29], [H[0] - 14, H[1] - 27], [H[0] - 30, H[1] - 30, 1], [H[0] - 24, H[1] - 20], [H[0] - 38, H[1] - 16, 1], [H[0] - 26, H[1] - 10], [H[0] - 36, H[1] + 1, 1], [H[0] - 24, H[1] - 3], [H[0] - 20, H[1] - 8], [H[0] - 10, H[1] - 12], [H[0] - 4, H[1] - 6, 1], [H[0] + 1, H[1] - 13], [H[0] + 7, H[1] - 4, 1], [H[0] + 10, H[1] - 14], [H[0] + 18, H[1] - 5, 1], [H[0] + 20, H[1] - 12]];
  form(g, hair, C.hair, { inkW: w * 1.1, shade: [[H[0] - 30, H[1] - 24], [H[0] - 10, H[1] - 18], [H[0] + 8, H[1] - 14], [H[0] + 20, H[1] - 6], [H[0] + 14, H[1] - 2], [H[0] - 8, H[1] - 4], [H[0] - 36, H[1]]], shadeCol: C.hairShade, shadeA: 0.85, glint: [[H[0] - 10, H[1] - 26], [H[0] + 4, H[1] - 27], [H[0] + 6, H[1] - 23], [H[0] - 8, H[1] - 21]], glintCol: C.hairLight, glintA: 0.6 });
  line(g, [[H[0] + 2, H[1] - 25], [H[0] - 6, H[1] - 17], [H[0] - 16, H[1] - 12]], w * 0.8, C.hairShade, { taper: 0.2 });   // the parting
  line(g, [[H[0] + 12, H[1] - 24], [H[0] + 9, H[1] - 16]], w * 0.6, C.hairShade, { taper: 0.3 }); }
  g.restore();
}

// ---------------------------------------------------------------- the Slime, facing left, h tall (the body; the drip adds a little)
function slime(g, x, y, h, t = {}) {
  const s = h / 90; g.save(); g.translate(x, y); g.scale(s, s); const w = 2.6, sq = t.squash || 0;
  const body = [[-52 - sq * 6, -2], [-56 - sq * 6, -30 + sq * 8], [-40, -66 + sq * 14], [-16, -86 + sq * 18], [0, -84 + sq * 18], [10, -94 + sq * 16, 1], [14, -82 + sq * 18], [40, -68 + sq * 14], [54 + sq * 6, -32 + sq * 8], [50 + sq * 6, -2], [0, 2]];
  const S = form(g, body, C.slime, { inkW: w, shade: [[-20, -30], [20, -46], [50, -34], [52, -2], [0, 2], [-30, -2]], shadeCol: C.slimeShade, shadeA: 0.9, glint: [[-40, -58], [-24, -74], [-8, -78], [-14, -66], [-30, -52]], glintCol: C.slimeLight, glintA: 0.7 });
  g.save(); pathOf(g, S); g.clip(); g.globalAlpha = 0.5; fill(g, spline([[-44, -24], [-36, -40], [-24, -44], [-24, -28], [-36, -18]]), C.slimeLight); g.restore();   // a second, smaller glint
  for (const [ex, ew] of [[-28, 10], [4, 8.5]]) {
    const eh = ew * 1.35, eye = [[ex - ew, -46], [ex - ew * 0.6, -46 - eh * 0.9], [ex + ew * 0.4, -46 - eh], [ex + ew, -46 - eh * 0.3], [ex + ew * 0.8, -46 + eh * 0.6], [ex, -46 + eh], [ex - ew * 0.8, -46 + eh * 0.6]];
    const E = form(g, eye, '#ffffff', { ink: null }); g.save(); pathOf(g, E); g.clip();
    fill(g, spline([[ex - ew * 0.9, -46 - eh * 0.5], [ex + ew * 0.3, -46 - eh * 0.6], [ex + ew * 0.5, -46 + eh], [ex - ew * 0.9, -46 + eh]]), INK);
    fill(g, spline([[ex - ew * 0.7, -46 - eh * 0.55], [ex - ew * 0.2, -46 - eh * 0.6], [ex - ew * 0.1, -46 - eh * 0.05], [ex - ew * 0.7, -46 - eh * 0.1]]), '#ffffff'); g.restore();
    ribbon(g, E, w * 0.8, INK, { closed: true, inside: 0.5 });
  }
  const mouth = [[-32, -28], [-16, -14], [2, -12], [10, -26], [-10, -22]];
  const M = form(g, mouth, C.mouth, { inkW: w * 0.8 }); g.save(); pathOf(g, M); g.clip(); fill(g, spline([[-22, -16], [-6, -12], [2, -12], [-8, -20]]), C.tongue); g.restore();
  g.save(); g.globalAlpha = 0.4; fill(g, spline([[-48, -34], [-38, -36], [-36, -30], [-46, -29]]), C.cheek); fill(g, spline([[14, -34], [24, -36], [26, -30], [16, -29]]), C.cheek); g.restore();
  g.restore();
}

// ---------------------------------------------------------------- the page: at the fight's size, as the board token, and enlarged
function groundStrip(g, w, h) { g.fillStyle = P.lin(g, 0, 0, 0, h, [[0, '#62b8f0'], [1, '#cfe9fb']]); g.fillRect(0, 0, w, h * 0.72); g.fillStyle = '#5f9a3e'; g.fillRect(0, h * 0.72, w, h * 0.28); g.fillStyle = '#86d458'; g.fillRect(0, h * 0.72 - 6, w, 6); g.fillStyle = '#4f7f33'; g.fillRect(0, h * 0.72 + 30, w, h); }
function page(title, drawHero, drawSlime, note) {
  const S = 2, cv = P.createCanvas(900 * S, 740 * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, 900, 740); P.label(g, title, 450, 26, 20, '#f0e8d8', { align: 'center' });
  // 1. the fight's size on a phone-width strip: the hero 150 CSS px, the slime 110
  P.label(g, 'At the fight\'s size (the hero 150 px, the slime 110, on a 412 px wide phone)', 24, 58, 13, '#b8b0a4', { weight: 'normal' });
  g.save(); g.translate(24, 70); g.beginPath(); g.rect(0, 0, 412, 230); g.clip(); groundStrip(g, 412, 230); const gy = 230 * 0.72;
  g.fillStyle = 'rgba(20,30,60,0.25)'; g.beginPath(); g.ellipse(120, gy + 6, 44, 11, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(300, gy + 6, 52, 13, 0, 0, 7); g.fill();
  drawHero(g, 120, gy + 3, 150); drawSlime(g, 300, gy + 3, 110); g.restore();
  // 2. the board token at 44 px, and the slime at 32
  P.label(g, 'On the board (44 px)', 470, 58, 13, '#b8b0a4', { weight: 'normal' });
  g.save(); g.translate(470, 70); g.fillStyle = '#7ed957'; g.fillRect(0, 0, 160, 110); g.fillStyle = '#f0d68f'; g.fillRect(0, 70, 160, 22); g.fillStyle = 'rgba(20,30,60,0.25)'; g.beginPath(); g.ellipse(50, 84, 14, 4, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(112, 84, 15, 4, 0, 0, 7); g.fill();
  drawHero(g, 50, 82, 44); drawSlime(g, 112, 82, 32); g.restore();
  // 3. enlarged, three times, for the drawing itself
  P.label(g, 'Three times, for the drawing', 24, 324, 13, '#b8b0a4', { weight: 'normal' });
  g.save(); g.translate(24, 336); g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, 852, 360); g.fillStyle = '#9ccf6a'; g.fillRect(0, 330, 852, 30);
  g.fillStyle = 'rgba(20,30,60,0.2)'; g.beginPath(); g.ellipse(230, 332, 120, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(620, 332, 150, 30, 0, 0, 7); g.fill();
  drawHero(g, 230, 326, 300); drawSlime(g, 620, 326, 220); g.restore();
  if (note) P.label(g, note, 450, 722, 12, '#b8b0a4', { align: 'center', weight: 'normal' });
  return cv;
}
function posesPage() {
  const S = 2, cv = P.createCanvas(900 * S, 420 * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, 900, 420); P.label(g, 'Approach 1 animated: the same drawing re-inked from its skeleton, four poses', 450, 26, 18, '#f0e8d8', { align: 'center' });
  g.save(); g.translate(24, 50); g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, 852, 300); g.fillStyle = '#9ccf6a'; g.fillRect(0, 270, 852, 30);
  ['stand', 'walk', 'windup', 'strike'].forEach((k, i) => { const x = 100 + i * 205; g.fillStyle = 'rgba(20,30,60,0.2)'; g.beginPath(); g.ellipse(x + 6, 272, 70, 15, 0, 0, 7); g.fill(); warrior(g, x, 268, 220, warriorPose(k)); P.label(g, k, x, 292, 13, '#2a2436', { align: 'center' }); });
  g.restore();
  P.label(g, 'Every form is placed from named points (hip, neck, head, shoulder, elbow, hand, knee, foot). A clip moves the points; the ink and the shade are drawn again from them.', 450, 372, 12, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.label(g, 'So each frame is the same character by construction: no frame is drawn on its own, and nothing can flicker. Mitch, AD, 2026-11-01.', 450, 392, 12, '#b8b0a4', { align: 'center', weight: 'normal' });
  return cv;
}
function rigPage() {
  const S = 2, cv = P.createCanvas(900 * S, 500 * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#1c1a22'; g.fillRect(0, 0, 900, 500); P.label(g, 'Approach 3: a master illustration from outside the code, cut into parts and rigged', 450, 26, 18, '#f0e8d8', { align: 'center' });
  g.save(); g.translate(24, 50); g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, 852, 380);
  P.label(g, 'The master (a stand-in: yours replaces it)', 150, 20, 13, '#2a2436', { align: 'center' });
  const J = warriorPose(); const X = 150, Y = 330, h = 260, s = h / 100; warrior(g, X, Y, h);
  for (const k of ['shF', 'elF', 'hF', 'neck', 'hip', 'kneeF', 'footF']) { const p = J[k]; g.fillStyle = '#ff2a4a'; g.beginPath(); g.arc(X + p[0] * s, Y + p[1] * s, 4, 0, 7); g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#fff'; g.stroke(); }
  P.label(g, 'red dots: the pivots', 150, 362, 11, '#2a2436', { align: 'center', weight: 'normal' });
  P.label(g, 'The parts, each its own picture with its pivot', 580, 20, 13, '#2a2436', { align: 'center' });
  const OFF = { hair: [-3, 78], head: [-3, 78], body: [0, 44], armF: [-20, 50], legF: [-10, 12], legB: [4, 12], farArm: [10, 44] };
  const parts = [['hair', 'hair', 330, 150], ['head', 'head', 430, 160], ['body', 'torso and belt', 540, 170], ['armF', 'arm and sword', 660, 150], ['legF', 'near leg', 760, 190], ['legB', 'far leg', 820, 190], ['farArm', 'far arm', 350, 300]];
  for (const [k, name, px, py] of parts) { const off = OFF[k]; warrior(g, px + off[0] * 1.6, py + off[1] * 1.6, 160, J, [k]); P.label(g, name, px, py + 50, 11, '#2a2436', { align: 'center', weight: 'normal' }); }
  g.restore();
  P.label(g, 'The master is painted once, outside the code: your image tool from my brief, or a hired illustrator.', 450, 448, 12, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.label(g, 'I cut it into these parts, give each a pivot, and pose the parts from the same clip data as approach 1.', 450, 466, 12, '#b8b0a4', { align: 'center', weight: 'normal' });
  P.label(g, "Every frame is the master's own pixels moved, never redrawn: the face, the sword and the colours cannot change between frames. Mitch, AD, 2026-11-01.", 450, 484, 12, '#b8b0a4', { align: 'center', weight: 'normal' });
  return cv;
}
module.exports = { posesPage, rigPage, warrior, slime, warriorPose, page, spline, form, line, ribbon, pathOf, fill };
if (require.main === module) {
  const cv = page('Approach 1: inked vector, drawn in code as an illustrator inks', (g, x, y, h) => warrior(g, x, y, h), (g, x, y, h) => slime(g, x, y, h), 'Smooth splines, a tapered ink that thickens on the shadow side, a soft painted shade. Mitch, AD, 2026-11-01.');
  const fs = require('fs'); const put = (name, c) => { P.save(c, path.join(OUT, name + '.png')); fs.writeFileSync(path.join(OUT, name + '.jpg'), c.toBuffer('image/jpeg', 88)); };
  put('1-ink', cv); put('1-poses', posesPage()); put('3-rig', rigPage()); console.log('wrote', OUT);
}
