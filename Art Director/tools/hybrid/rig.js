// rig.js: the hybrid hero (Mitch, AD, 2026-11-01). ONE skeleton of named points; a clip is a list of poses of those points;
// a frame is the components of the worn SET drawn in depth order from the pose. A component is either PROCEDURAL (approach
// 1: splines, a tapered ink, a soft shade, drawn from the points) or RASTER (approach 3: a master picture placed at a joint
// with its pivot and turned with the limb). Every frame is the same skeleton and the same parts, so nothing flickers.
// Draws facing right in figure units (100 = the hair's top above the feet), flips at the frame so the files face LEFT as
// the game wants, at 3 file px per unit (the hero 150 CSS px tall in a fight at 2x). Writes frames and meta.json per set,
// then packs each set with tools/pack.js.
//   node tools/hybrid/rig.js [sets: tunic,plate,mage]   -> work/hybrid/<set>/render, work/hybrid/out/<set>/
const P = require('../paint.js'); const I = require('../ink.js'); const path = require('path'); const fs = require('fs'); const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'); const WORK = path.join(ROOT, 'work/hybrid');
const SETS = (process.argv[2] || 'tunic,plate,mage,axe,bow').split(',');
const INK = '#2a2030';
const C = { skin: '#ffe2c2', skinShade: '#e8a888', hair: '#ff6b3a', hairShade: '#c8432a', hairLight: '#ffa070', tunic: '#3d7de4', tunicShade: '#2a56b0', tunicLight: '#7ab0ff', belt: '#8a5a3a', trousers: '#9a6a44', boots: '#5c3b2b', bootsShade: '#3a2418',
            steel: '#eef2f8', steelShade: '#9aa8bc', gold: '#f4c14a', iris: '#2d8f4e', cheek: '#ff8a7a', robe: '#5a3fc8', robeShade: '#3a2890', robeLight: '#9a84f0', rope: '#d9b36a', shoe: '#2e2a5a', cape: '#c83a3a', capeShade: '#8a1e1e' };
const { form, line, spline, pathOf, fill } = I;

// ---------------------------------------------------------------- the skeleton and its poses
const BASE = { hip: [0, -32], neck: [3, -61], head: [3, -83], shF: [-12, -56], elF: [-16, -45], hF: [-13, -33], shB: [10, -57], elB: [14, -46], hB: [15, -35],
               kneeF: [-5, -19], footF: [-3, -2], kneeB: [6, -19], footB: [8, -3], dir: [0.72, 0.69], dirStaff: [-0.12, -0.993], dirOff: [0, -1], pullLocal: [0, 0], footAF: 0, footAB: 0, glow: 0, cape: 0, rot: 0, drop: 0, draw: 0, freeFar: 0, face: 'ok' };
// the poses, all in the three-quarter view: the near arm (his right) raises beside the head on the near side, never across the face
const vec = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
function lerp(A, B, k) { const J = {}; for (const key of Object.keys(A)) { const a = A[key], b = B[key] === undefined ? a : B[key]; J[key] = Array.isArray(a) ? vec(a, b, k) : typeof a === 'number' ? a + (b - a) * k : (k < 0.5 ? a : b); } for (const d of ['dir', 'dirStaff']) { const L = Math.hypot(J[d][0], J[d][1]) || 1; J[d] = [J[d][0] / L, J[d][1] / L]; } return J; }
const MAGE = { elF: [-14, -47], hF: [-13, -40] };
const UPPER = 13, FORE = 12;   // the arm's two bones, one length for every class and pose (Robin, 2026-11-02: fix the source)
function ik(sh, hd, L1 = UPPER, L2 = FORE, bend = 0) {   // a two-bone arm: the elbow for a shoulder, a hand and two lengths, bent downward and outward
  const dx = hd[0] - sh[0], dy = hd[1] - sh[1], L = Math.max(0.01, Math.min(L1 + L2 - 0.01, Math.hypot(dx, dy))), ux = dx / L, uy = dy / L;
  const a = (L1 * L1 - L2 * L2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const A = [sh[0] + ux * a - uy * h, sh[1] + uy * a + ux * h], B = [sh[0] + ux * a + uy * h, sh[1] + uy * a - ux * h];
  if (bend) return bend > 0 ? A : B;
  return (A[1] - A[0] * 0.7) >= (B[1] - B[0] * 0.7) ? A : B;   // back and down, never forward through the body
}
// the arm as the rig understands it: near is his right, at the torso's screen-left edge, drawn over the torso; far is his left, behind the torso unless the hand truly reaches forward or up
const solveArms = J => ({ ...J, elF: ik(J.shF, J.hF), elB: ik(J.shB, J.hB) });
const farInFront = J => (J.hB[0] > J.neck[0] + 15 && J.hB[1] < J.hip[1] - 7) || J.hB[1] < J.neck[1];
const shieldArm = J => { const hB = [J.shB[0] + 15, J.shB[1] + 9]; return { ...J, hB, elB: ik(J.shB, hB), farGrip: 1 }; };   // the mage carries the staff a little further out
const pose = (t, base = BASE) => ({ ...base, ...t });
function keys(base) {
  const B = pose({}, base);
  return {
    windup: pose({ hip: [-2, -32], neck: [0, -61], head: [0, -83], shF: [-11, -58], elF: [-20, -66], hF: [-16, -73], dir: [-0.35, -0.94], hB: [13, -33], kneeF: [-4, -19], footF: [-1, -2], kneeB: [5, -19], footB: [8, -3], cape: 0.4 }, base),
    top: pose({ hip: [0, -32], neck: [3, -61], head: [3, -83], shF: [-9, -58], elF: [-13, -70], hF: [-6, -82], dir: [0.5, -0.87], hB: [13, -34], cape: 0.6 }, base),
    strike: pose({ hip: [6, -31], neck: [11, -59], head: [12, -81], shF: [-1, -56], elF: [9, -50], hF: [18, -48], dir: [0.92, 0.4], shB: [16, -56], elB: [18, -46], hB: [16, -36], kneeF: [10, -18], footF: [14, -2], kneeB: [2, -19], footB: [-4, -3], footAB: -0.35, cape: 1 }, base),
    follow: pose({ hip: [5, -31], neck: [9, -60], head: [10, -82], shF: [-3, -56], elF: [6, -47], hF: [14, -37], dir: [0.85, 0.53], shB: [15, -56], elB: [17, -46], hB: [15, -36], kneeF: [9, -18], footF: [13, -2], kneeB: [2, -19], footB: [-3, -3], footAB: -0.3, cape: 0.7 }, base),
    pull: pose({ hip: [-1, -32], neck: [1, -61], head: [1, -83], shF: [-10, -57], elF: [-18, -50], hF: [-20, -42], dir: [-0.5, -0.87], cape: 0.3 }, base),
    raise: pose({ hip: [1, -32], neck: [4, -61], head: [4, -83], shF: [-9, -58], elF: [-17, -64], hF: [-17, -72], dir: [0.08, -0.997], cape: 0.5 }, base),
    base: B,
  };
}
const shiftShoulders = K0 => { for (const v of Object.values(K0)) if (v !== K0.base && v.shF) v.shF = [v.shF[0] - 3, v.shF[1] + 1]; return K0; };
function walk(t, base = BASE) {   // one stride; the near foot forward at t = 0.25; forward is screen-right in this view
  const s = Math.sin(t * 2 * Math.PI), c = Math.cos(t * 2 * Math.PI), bob = -2.2 * (1 - Math.abs(s)) + 0.5;
  const liftF = -5 * Math.max(0, c), liftB = -5 * Math.max(0, -c), B = pose({}, base), up = (p, dx = 0, dy = 0) => [p[0] + dx, p[1] + bob + dy];
  return pose({ hip: up(B.hip, 1), neck: up(B.neck, 2.5), head: up(B.head, 3), shF: up(B.shF, 2), elF: up(B.elF, 2 - 4 * s, -1), hF: up(B.hF, 2 - 7 * s, 1 * s), shB: up(B.shB, 2), elB: up(B.elB, 2 + 4 * s), hB: up(B.hB, 2 + 7 * s),
                footF: [B.footF[0] + 14 * s, -2 + liftF], kneeF: [B.kneeF[0] + 8 * s + 2 * Math.max(0, c), -19 + liftF * 0.6 + bob * 0.3], footB: [B.footB[0] - 14 * s, -3 + liftB], kneeB: [B.kneeB[0] - 8 * s + 2 * Math.max(0, -c), -19 + liftB * 0.6 + bob * 0.3],
                footAF: 0.35 * Math.max(0, c), footAB: 0.35 * Math.max(0, -c), cape: 0.3 + 0.1 * s }, base);
}
function clips(kind) {
  const base = kind === 'cast' ? { ...BASE, ...MAGE } : BASE, K = keys(base);
  const stand = [0, -1, -1.6, -0.8].map(dy => { const J = pose({}, base); for (const k of ['neck', 'head', 'shF', 'elF', 'hF', 'shB', 'elB', 'hB']) J[k] = [J[k][0], J[k][1] + dy]; return J; });
  const move = [0, 1, 2, 3, 4, 5].map(i => walk(i / 6, base));
  const attack1 = kind === 'cast'
    ? [K.pull, K.raise, { ...K.raise, glow: 0.5 }, { ...K.raise, glow: 1 }, { ...lerp(K.raise, K.base, 0.4), glow: 0.5 }, lerp(K.raise, K.base, 0.8)]
    : [lerp(K.base, K.windup, 0.6), K.windup, K.top, K.strike, K.follow, lerp(K.follow, K.base, 0.5)];
  return { stand: { delay: 150, frames: stand }, move: { delay: 100, frames: move }, attack1: { delay: 67, frames: attack1, delays: [67, 67, 67, 134, 67, 67] } };
}

// ---------------------------------------------------------------- the raster components (approach 3's path)
let MASTERS = {};
async function loadMasters() { const dir = path.join(WORK, 'masters'), list = JSON.parse(fs.readFileSync(path.join(dir, 'masters.json'), 'utf8')); for (const [k, m] of Object.entries(list)) MASTERS[k] = { ...m, im: await P.loadImage(path.join(dir, m.file)) }; }
function put(g, name, at, angle = 0, o = {}) {   // the master placed with its pivot at the joint, turned with the limb
  const m = MASTERS[name]; let im = m.im;
  if (o.darken) { const t = P.createCanvas(m.im.width, m.im.height), tg = t.getContext('2d'); tg.drawImage(m.im, 0, 0); tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = `rgba(20,16,40,${o.darken})`; tg.fillRect(0, 0, t.width, t.height); im = t; }   // a far part in shade, still opaque
  g.save(); g.translate(at[0], at[1]); g.rotate(angle); const k = (o.scale || 1) / m.px; g.scale(k, k); if (o.alpha) g.globalAlpha = o.alpha; g.drawImage(im, -m.pivot[0], -m.pivot[1]); g.restore();
}
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);

// ---------------------------------------------------------------- the procedural components (approach 1's path), third construction (2026-11-01, after Robin's review of the view)
// ONE VIEW for everything: a three-quarter turn of 40 degrees from the front toward screen-right. The character's right side
// is nearer the viewer and on the screen's LEFT; his front faces screen-right. A point l to his left and d forward lands on
// screen at x = l * 0.77 + d * 0.64. So: the near shoulder (his right) is at the torso's left edge and fully seen, the far
// shoulder is at the right edge and foreshortened; the face's centre line sits at +0.55 of the head's radius with the
// near eye wide and the far eye narrow close to the edge; the collar's V, the buckle and the nose all stand on that line;
// the near arm hangs in front of the torso's left side, the far arm shows past its right side; both feet point screen-right.
const w = 2.4, wi = 1.3;
const S_ = (pts, n = 10) => spline(pts, true, n);
function formOpen(g, pts, col, a, b, o = {}) {   // a form inked over part of its outline only (sample points a..b)
  const n = 10, S = S_(pts, n); fill(g, S, col);
  if (o.shade) { const sh = o.shadeCol || P.mix(P.darken(col, 0.22), '#4a3a8a', 0.25); g.save(); pathOf(g, S); g.clip(); const SS = S_(o.shade, 8); const cx = SS.reduce((s, p) => s + p[0], 0) / SS.length, cy = SS.reduce((s, p) => s + p[1], 0) / SS.length; for (let k = 0; k < 4; k++) { const sc = 1 - 0.08 * (3 - k); g.save(); g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy); g.globalAlpha = 0.36; fill(g, SS, sh); g.restore(); } g.restore(); }
  I.ribbon(g, S.slice(a * n, b * n + 1), o.inkW || w, INK, { closed: false, taper: 0.06, taper2: 0.06, inside: 0.55 });
  return S;
}
const CL = 0.55;   // the face's centre line, as a share of the head's radius, right of the head's centre
function cape(g, J) {   // hangs from the far shoulder round the back, which is screen-left
  const nk = J.neck, k = J.cape, hem = [-22 - 12 * k, -8 + 4 * k], mid = [-19 - 8 * k, -36];
  form(g, [[nk[0] - 12, nk[1] + 2], [nk[0] + 8, nk[1] + 2], [nk[0] + 4, nk[1] + 12], [mid[0] + 8, mid[1]], [hem[0] + 8, hem[1]], [hem[0] - 6, hem[1] - 2], [hem[0] - 10, hem[1] - 12], [mid[0] - 6, mid[1] - 2], [nk[0] - 17, nk[1] - 1]], C.cape, { inkW: w, shade: [[mid[0] - 4, mid[1] - 2], [mid[0] + 6, mid[1] + 2], [hem[0] + 4, hem[1]], [hem[0] - 10, hem[1] - 12]], shadeCol: C.capeShade, shadeA: 0.8 });
}
function neck(g, J) { const nk = J.neck; form(g, [[nk[0] - 4, nk[1] - 9], [nk[0] + 6, nk[1] - 9], [nk[0] + 6.5, nk[1] + 4], [nk[0] - 4, nk[1] + 4]], C.skinShade, { inkW: wi, shade: false }); }
function armPts(sh, el, wr, k) {   // a limb round its joints: the shoulder's cap, the elbow, the wrist, each its own width, so it is one connected shape in any pose
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L, dx / L, dy / L]; }, [n1x, n1y, u1x, u1y] = nrm(sh, el), [n2x, n2y] = nrm(el, wr), nx = (n1x + n2x) / 2, ny = (n1y + n2y) / 2, a = 5.6 * k, b = 4.9 * k, c = 3.8 * k;
  return [[sh[0] - u1x * a * 0.8, sh[1] - u1y * a * 0.8], [sh[0] + n1x * a, sh[1] + n1y * a], [el[0] + nx * b, el[1] + ny * b], [wr[0] + n2x * c, wr[1] + n2y * c], [wr[0] - n2x * c, wr[1] - n2y * c], [el[0] - nx * b, el[1] - ny * b], [sh[0] - n1x * a, sh[1] - n1y * a]];
}
const wristOf = (hd, el) => { const L = Math.hypot(hd[0] - el[0], hd[1] - el[1]) || 1; return [hd[0] - (hd[0] - el[0]) / L * 3.2, hd[1] - (hd[1] - el[1]) / L * 3.2]; };
function mitt(g, hd, el, col, shade, grip, inkW = w * 0.85) {   // a hand in the forearm's direction: a wrist that enters the sleeve, a palm, a thumb on the forward side; closed round a grip, or relaxed and a little longer
  const a = Math.atan2(hd[1] - el[1], hd[0] - el[0]), side = Math.cos(a) * 1 >= 0 && Math.abs(Math.sin(a)) < 0.5 ? 1 : -1; g.save(); g.translate(hd[0], hd[1]); g.rotate(a);
  form(g, [[-5.4, -2.8], [-2.4, -3], [-2.4, 3], [-5.4, 2.8]], shade, { ink: null, shade: false, n: 4 });
  const pts = grip ? [[-3.4, -3.8], [1.6, -4.6], [4.6, -2.6], [4.8, 2], [1.8, 4.4], [-3.4, 3.8]] : [[-3.4, -3.5], [2.2, -3.9], [6.4, -2.2], [7.2, 1], [4.4, 3.6], [-3.4, 3.5]];
  form(g, pts, col, { inkW, shade: [[-1, 0.6], [4.6, 0.4], [grip ? 4.6 : 6.6, 2], [1.8, 4], [-3.2, 3.5]], shadeCol: shade, shadeA: 0.7 });
  form(g, [[-1.4, -3.6 * side], [2.2, -5.8 * side], [4.2, -4.8 * side], [2.8, -2.8 * side]], col, { inkW: inkW * 0.8, shade: false, n: 5 });
  if (grip) line(g, [[3.4, -2], [2.6, 0.5], [3.4, 2.6]], wi * 0.7, INK, { taper: 0.3 }); else line(g, [[3.6, -1.4], [5.8, -0.6]], wi * 0.6, INK, { taper: 0.3 });
  g.restore();
}
function farArm(g, J, wide) {   // his left arm: the same limb, one tone down; behind the torso unless it reaches
  const sb = J.shB, eb = J.elB, hb = J.hB, wr = wristOf(hb, eb), col = wide ? C.robeShade : C.tunicShade, k = wide ? 1.3 : 0.92, S_0 = armPts(sb, eb, wr, k); form(g, S_0, col, { inkW: w * 0.9, shade: false });
  mitt(g, hb, eb, C.skinShade, P.darken(C.skinShade, 0.12), !!J.farGrip);
}
function leg(g, J, far, col) {
  const knee = far ? J.kneeB : J.kneeF, foot = far ? J.footB : J.footF, hx = far ? J.hip[0] + 5 : J.hip[0] - 5, hy = J.hip[1] + 1;
  form(g, [[hx - 6, hy], [hx + 6, hy], [knee[0] + 5.5, knee[1]], [foot[0] + 4, foot[1] - 7], [foot[0] - 4, foot[1] - 7], [knee[0] - 5.5, knee[1]]], far ? P.darken(col, 0.18) : col,
    { inkW: w * 0.9, shade: [[knee[0] + 1, knee[1] - 6], [knee[0] + 6, knee[1]], [foot[0] + 4, foot[1] - 6], [foot[0] - 1, foot[1] - 8]], shadeCol: P.darken(col, 0.22) });
}
function bootLeather(g, J, far, col = C.boots, shadeCol = C.bootsShade) {   // both feet point screen-right; the far one a touch darker
  const foot = far ? J.footB : J.footF, a = far ? J.footAB : J.footAF; g.save(); g.translate(foot[0], foot[1]); g.rotate(a);
  form(g, [[-7, -9], [5, -9], [10, -6], [12, -1.5], [8, 1], [-7, 1], [-9, -4]], far ? P.darken(col, 0.18) : col, { inkW: w, shade: [[-2, -5], [11, -4], [9, 1], [-6, 1]], shadeCol: P.darken(col, 0.3) });
  line(g, [[-7, -7.5], [0, -8.5], [6, -7.5]], wi, INK, { taper: 0.3 }); g.restore();
}
function bootRaster(g, J, far) { const foot = far ? J.footB : J.footF; put(g, 'bootPlate', [foot[0] + 1, foot[1]], far ? J.footAB : J.footAF, far ? { darken: 0.22 } : {}); }
// the torso in the three-quarter view: the near shoulder full at the left, the far shoulder short at the right, the hem a little wider than the chest
const torsoPts = (nk, hp) => [[nk[0] - 13, nk[1] + 2], [nk[0] + 8, nk[1] + 1], [nk[0] + 13, nk[1] + 8], [hp[0] + 12, hp[1] - 8], [hp[0] + 13, hp[1] + 2], [hp[0] - 14, hp[1] + 2], [hp[0] - 14, hp[1] - 8], [nk[0] - 17, nk[1] + 9]];
function torsoTunic(g, J, col = C.tunic, shadeCol = C.tunicShade) {
  const nk = J.neck, hp = J.hip;
  form(g, torsoPts(nk, hp), col, { inkW: w, shade: [[hp[0] + 3, nk[1] + 8], [hp[0] + 13, nk[1] + 14], [hp[0] + 13, hp[1] + 2], [hp[0] + 1, hp[1] + 2], [hp[0] + 1, hp[1] - 12]], shadeCol });
  line(g, [[nk[0] - 2, nk[1] + 4], [nk[0] + 4, nk[1] + 9], [nk[0] + 9, nk[1] + 4]], wi, INK, { taper: 0.2 });   // the collar's V on the centre line
}
function belt(g, J) { const hp = J.hip; form(g, [[hp[0] - 14.5, hp[1] - 2], [hp[0] + 13.5, hp[1] - 3], [hp[0] + 13.5, hp[1] + 2.5], [hp[0] - 14.5, hp[1] + 3.5]], C.belt, { inkW: wi, shade: false }); form(g, [[hp[0] + 2, hp[1] - 3], [hp[0] + 7, hp[1] - 3], [hp[0] + 7, hp[1] + 2.5], [hp[0] + 2, hp[1] + 2.5]], C.gold, { inkW: wi, shade: false }); }
function robe(g, J) {
  const nk = J.neck, hp = J.hip, fx = (J.footF[0] + J.footB[0]) / 2;
  form(g, [[nk[0] - 13, nk[1] + 2], [nk[0] + 8, nk[1] + 1], [nk[0] + 13, nk[1] + 8], [hp[0] + 11, hp[1] - 6], [hp[0] + 16, hp[1] + 12], [fx + 19, -4], [fx + 10, -2], [fx - 12, -2], [fx - 21, -4], [hp[0] - 17, hp[1] + 12], [hp[0] - 13, hp[1] - 6], [nk[0] - 17, nk[1] + 9]], C.robe,
    { inkW: w, shade: [[hp[0] + 3, nk[1] + 8], [hp[0] + 13, nk[1] + 14], [fx + 19, -4], [fx + 5, -2], [hp[0] + 1, hp[1] - 12]], shadeCol: C.robeShade });
  line(g, [[hp[0] - 4, hp[1] + 8], [fx - 7, -14], [fx - 5, -3]], wi, C.robeShade, { taper: 0.3 });
  line(g, [[nk[0] - 2, nk[1] + 4], [nk[0] + 4, nk[1] + 9], [nk[0] + 9, nk[1] + 4]], wi, INK, { taper: 0.2 });
  form(g, [[hp[0] - 13, hp[1] - 2], [hp[0] + 12, hp[1] - 3], [hp[0] + 12, hp[1] + 1.5], [hp[0] - 13, hp[1] + 2.5]], C.rope, { inkW: wi, shade: false });
  line(g, [[hp[0] + 3, hp[1] + 1], [hp[0] + 7, hp[1] + 9], [hp[0] + 5, hp[1] + 15]], wi, C.rope, { taper: 0.3 });
}
function nearSleeve(g, J, wide) {   // his right arm, hanging at the torso's near edge: the shoulder's top blends into the torso, the rest is inked all round
  const sh = J.shF, el = J.elF, hd = J.hF, wr = wristOf(hd, el), col = wide ? C.robe : C.tunic, shd = wide ? C.robeShade : C.tunicShade, k = wide ? 1.35 : 1, pts = armPts(sh, el, wr, k), Sp = S_(pts, 10); fill(g, Sp, col);
  g.save(); pathOf(g, Sp); g.clip(); const SS = S_([pts[2], pts[3], pts[4], [el[0], el[1]]], 6); fill(g, SS, shd); g.restore();
  const n = Sp.length, from = Math.floor(n * 0.1), to = Math.floor(n * 0.98), rim = []; for (let i = from; i <= to; i++) rim.push(Sp[i % n]); g.beginPath(); rim.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.lineWidth = w * 0.95; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke();
  line(g, [[pts[3][0], pts[3][1]], [pts[4][0], pts[4][1]]], wi * 0.9, shd, { taper: 0.1 });
}
function fist(g, hd, d, el, grip = true) { mitt(g, hd, el || [hd[0], hd[1] - 10], C.skin, C.skinShade, grip); }
function hand(g, J) { fist(g, J.hF, J.dir, J.elF, !J.nearFree); }
function sword(g, J) {   // carried in the near hand, down and forward, the tip clear of the ground
  const hd = J.hF, d = J.dir, px = -d[1], py = d[0], grip = [hd[0] + d[0] * 1.5, hd[1] + d[1] * 1.5];
  form(g, [[grip[0] - px * 2.3 - d[0] * 8, grip[1] - py * 2.3 - d[1] * 8], [grip[0] + px * 2.3 - d[0] * 8, grip[1] + py * 2.3 - d[1] * 8], [grip[0] + px * 2.1 + d[0] * 7, grip[1] + py * 2.1 + d[1] * 7], [grip[0] - px * 2.1 + d[0] * 7, grip[1] - py * 2.1 + d[1] * 7]], C.belt, { inkW: wi, shade: false });
  form(g, [[grip[0] - px * 3 - d[0] * 11, grip[1] - py * 3 - d[1] * 11], [grip[0] + px * 3 - d[0] * 11, grip[1] + py * 3 - d[1] * 11], [grip[0] + px * 2.4 - d[0] * 7.5, grip[1] + py * 2.4 - d[1] * 7.5], [grip[0] - px * 2.4 - d[0] * 7.5, grip[1] - py * 2.4 - d[1] * 7.5]], C.gold, { inkW: wi, shade: false, n: 6 });
  const g0 = [grip[0] + d[0] * 7, grip[1] + d[1] * 7];
  form(g, [[g0[0] - px * 7, g0[1] - py * 7], [g0[0] + px * 7, g0[1] + py * 7], [g0[0] + px * 5 + d[0] * 4, g0[1] + py * 5 + d[1] * 4], [g0[0] - px * 5 + d[0] * 4, g0[1] - py * 5 + d[1] * 4]], C.gold, { inkW: wi, shade: false, n: 6 });
  const b0 = [g0[0] + d[0] * 4, g0[1] + d[1] * 4], bl = 42;
  form(g, [[b0[0] - px * 4, b0[1] - py * 4], [b0[0] + px * 4, b0[1] + py * 4], [b0[0] + px * 3.4 + d[0] * bl * 0.8, b0[1] + py * 3.4 + d[1] * bl * 0.8], [b0[0] + d[0] * bl, b0[1] + d[1] * bl, 1], [b0[0] - px * 3.4 + d[0] * bl * 0.8, b0[1] - py * 3.4 + d[1] * bl * 0.8]], C.steel,
    { inkW: w * 0.8, n: 6, shade: [[b0[0] + px * 0.5, b0[1] + py * 0.5], [b0[0] + px * 4, b0[1] + py * 4], [b0[0] + px * 3.4 + d[0] * bl * 0.8, b0[1] + py * 3.4 + d[1] * bl * 0.8], [b0[0] + d[0] * bl, b0[1] + d[1] * bl], [b0[0] + px * 0.5 + d[0] * bl * 0.8, b0[1] + py * 0.5 + d[1] * bl * 0.8]], shadeCol: C.steelShade, shadeA: 0.8 });
  line(g, [[b0[0] + d[0] * 2, b0[1] + d[1] * 2], [b0[0] + d[0] * bl * 0.85, b0[1] + d[1] * bl * 0.85]], wi * 0.8, INK, { taper: 0.1, taper2: 0.4 });
}
// the head in the same three-quarter turn: an egg whose chin sits under the face's centre line; the near ear at the left;
// the near eye wide on the left of the centre line, the far eye narrow on its right close to the edge; nose and mouth on the line
function headFace(g, J) {
  const hc = J.head, r = 22, cl = hc[0] + CL * r;
  form(g, [[hc[0] - 22, hc[1] + 1], [hc[0] - 19, hc[1] - 14], [hc[0] - 8, hc[1] - 21], [hc[0] + 6, hc[1] - 22], [hc[0] + 18, hc[1] - 15], [hc[0] + 23, hc[1] - 3], [hc[0] + 21, hc[1] + 10], [hc[0] + 13, hc[1] + 19], [hc[0], hc[1] + 20.5], [hc[0] - 14, hc[1] + 13]], C.skin,
    { inkW: w, shade: [[hc[0] - 12, hc[1] + 10], [hc[0] + 8, hc[1] + 10], [hc[0] + 21, hc[1] + 2], [hc[0] + 19, hc[1] + 13], [hc[0] + 13, hc[1] + 19], [hc[0], hc[1] + 20.5], [hc[0] - 14, hc[1] + 13]], shadeCol: C.skinShade, shadeA: 0.6 });
  form(g, [[hc[0] - 23.5, hc[1] + 1], [hc[0] - 21, hc[1] - 3.5], [hc[0] - 17, hc[1] + 0.5], [hc[0] - 18, hc[1] + 6], [hc[0] - 22.5, hc[1] + 6.5]], C.skin, { inkW: wi, shade: [[hc[0] - 22, hc[1] + 1], [hc[0] - 19, hc[1] + 1], [hc[0] - 20, hc[1] + 5], [hc[0] - 22, hc[1] + 5]], shadeCol: C.skinShade });   // the near ear
  const ey = hc[1] + 2;
  for (const [cx, ew, eh, near] of [[cl - 11, 5.8, 6.4, true], [cl + 5.5, 3.6, 6.0, false]]) {
    const lean = near ? 0 : 0.12;
    if (J.face === 'hurt') { line(g, [[cx - ew, ey - eh * 0.1], [cx, ey + eh * 0.45], [cx + ew * 0.95, ey - eh * 0.2]], w * (near ? 1.0 : 0.85), INK, { taper: 0.15, taper2: 0.2 }); line(g, [[cx - ew * 1.15, ey - eh * 1.5], [cx + ew * 0.05, ey - eh * 1.2], [cx + ew * 1.1, ey - eh * 1.5]], wi * 1.15, C.hairShade, { taper: 0.25, taper2: 0.25 }); continue; }
    if (J.face === 'dead') { line(g, [[cx - ew * 0.8, ey - eh * 0.7], [cx + ew * 0.8, ey + eh * 0.7]], w * 0.8, INK, { taper: 0.1 }); line(g, [[cx + ew * 0.8, ey - eh * 0.7], [cx - ew * 0.8, ey + eh * 0.7]], w * 0.8, INK, { taper: 0.1 }); continue; }   // the far eye follows the curve away: a touch narrower at its outer end
    const E = S_([[cx - ew, ey + eh * 0.15], [cx - ew * 0.6, ey - eh * 0.85], [cx + ew * 0.3, ey - eh], [cx + ew, ey - eh * (0.3 + lean)], [cx + ew * 0.8, ey + eh * 0.6], [cx, ey + eh * 0.95], [cx - ew * 0.7, ey + eh * 0.7]]);
    fill(g, E, '#ffffff'); g.save(); pathOf(g, E); g.clip();
    const ix = cx + ew * 0.2, iy = ey + eh * 0.1, ir = eh * 0.64;
    g.fillStyle = C.iris; g.beginPath(); g.ellipse(ix, iy, ir * (near ? 0.92 : 0.66), ir, 0, 0, 7); g.fill();
    g.fillStyle = INK; g.beginPath(); g.ellipse(ix + ew * 0.05, iy + eh * 0.05, ir * (near ? 0.5 : 0.36), ir * 0.55, 0, 0, 7); g.fill();
    g.fillStyle = P.alpha(INK, 0.22); g.fillRect(cx - ew - 1, ey - eh - 1, ew * 2 + 2, eh * 0.5);
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix - ir * 0.45, iy - ir * 0.5, ir * 0.22, ir * 0.26, 0, 0, 7); g.fill(); g.restore();
    line(g, [[cx - ew * 1.05, ey - eh * 0.05], [cx - ew * 0.5, ey - eh * 1.0], [cx + ew * 0.4, ey - eh * 1.05], [cx + ew * 1.0, ey - eh * (0.35 + lean)]], w * (near ? 1.0 : 0.85), INK, { taper: 0.12, taper2: 0.3 });
    line(g, [[cx - ew * 0.5, ey + eh * 0.85], [cx + ew * 0.6, ey + eh * 0.75]], wi * 0.7, INK, { taper: 0.45 });
    line(g, [[cx - ew * 1.15, ey - eh * 1.6], [cx + ew * 0.05, ey - eh * 1.95], [cx + ew * 1.1, ey - eh * (1.5 + lean)]], wi * 1.15, C.hairShade, { taper: 0.25, taper2: 0.25 });
  }
  line(g, [[cl + 0.5, hc[1] + 5], [cl + 2.5, hc[1] + 8.5], [cl + 0.5, hc[1] + 9.5]], wi * 0.8, INK, { taper: 0.35 });   // the nose on the centre line, its shadow side
  if (J.face === 'hurt' || J.face === 'dead') form(g, [[cl - 4, hc[1] + 12], [cl + 2, hc[1] + 12], [cl + 2.5, hc[1] + 17], [cl - 4, hc[1] + 17]], '#8a2a3e', { inkW: wi, shade: false, n: 6 });
  else line(g, [[cl - 6, hc[1] + 13.5], [cl - 1, hc[1] + 16], [cl + 4, hc[1] + 14]], wi, INK, { taper: 0.3 });   // the smile, centred on the line
  g.save(); g.globalAlpha = 0.26; fill(g, S_([[cl - 15, hc[1] + 8], [cl - 7, hc[1] + 7.5], [cl - 7, hc[1] + 12], [cl - 15, hc[1] + 12]]), C.cheek); fill(g, S_([[cl + 4, hc[1] + 7], [cl + 9, hc[1] + 6.5], [cl + 9, hc[1] + 10.5], [cl + 4, hc[1] + 10.5]]), C.cheek); g.restore();
}
function hair(g, J, under = false) {   // the parting on the centre line; the big locks sweep back over the near side (left); three fringe locks fall each way from the parting
  const H = J.head, cl = H[0] + CL * 22;
  const full = [[H[0] + 23, H[1] - 6], [H[0] + 22, H[1] - 15], [H[0] + 13, H[1] - 25], [H[0] + 1, H[1] - 28], [H[0] - 11, H[1] - 26], [H[0] - 25, H[1] - 26, 1], [H[0] - 19, H[1] - 16], [H[0] - 34, H[1] - 14, 1], [H[0] - 23, H[1] - 8], [H[0] - 31, H[1] + 1, 1], [H[0] - 21, H[1] - 3], [H[0] - 16, H[1] - 9], [H[0] - 6, H[1] - 12], [H[0] - 1, H[1] - 6.5, 1], [H[0] + 4, H[1] - 13], [H[0] + 10, H[1] - 6, 1], [H[0] + 14, H[1] - 14], [H[0] + 19, H[1] - 7.5, 1], [H[0] + 21, H[1] - 12]];
  const flat = [[H[0] + 23, H[1] - 6], [H[0] + 20, H[1] - 14], [H[0] + 8, H[1] - 18], [H[0] - 8, H[1] - 18], [H[0] - 21, H[1] - 16], [H[0] - 30, H[1] - 10, 1], [H[0] - 22, H[1] - 6], [H[0] - 29, H[1] + 2, 1], [H[0] - 21, H[1] - 2], [H[0] - 16, H[1] - 9], [H[0] - 6, H[1] - 12], [H[0] - 1, H[1] - 6.5, 1], [H[0] + 4, H[1] - 13], [H[0] + 10, H[1] - 6, 1], [H[0] + 14, H[1] - 14], [H[0] + 19, H[1] - 7.5, 1], [H[0] + 21, H[1] - 12]];
  form(g, under ? flat : full, C.hair, { inkW: w, shade: [[H[0] - 28, H[1] - 22], [H[0] - 10, H[1] - 17], [H[0] + 8, H[1] - 13], [H[0] + 20, H[1] - 6], [H[0] + 14, H[1] - 2], [H[0] - 8, H[1] - 4], [H[0] - 32, H[1]]], shadeCol: C.hairShade, shadeA: 0.8, glint: under ? null : [[H[0] - 9, H[1] - 25], [H[0] + 4, H[1] - 26], [H[0] + 6, H[1] - 22], [H[0] - 7, H[1] - 20]], glintCol: C.hairLight, glintA: 0.5 });
  if (!under) line(g, [[cl, H[1] - 23], [cl - 8, H[1] - 17], [cl - 17, H[1] - 12]], wi, C.hairShade, { taper: 0.25 });   // the parting, from the centre line back
}
function castGlow(g, J) {
  if (!J.glow) return; const hd = J.hF, d = J.dir, c = [hd[0] + d[0] * 52, hd[1] + d[1] * 52], k = J.glow;
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = P.rad(g, c[0], c[1], c[0], c[1], 22 * k, [[0, 'rgba(180,240,255,0.9)'], [0.4, 'rgba(110,200,255,0.5)'], [1, 'rgba(60,120,255,0)']]); g.beginPath(); g.arc(c[0], c[1], 22 * k, 0, 7); g.fill(); g.restore();
}
// the construction overlay: the head's egg with its centre line and eye line, the torso's box with its centre line, the
// shoulder and hip lines, the limbs as sticks, and the ground ellipse with the facing arrow
function overlay(g, J) {
  const hc = J.head, r = 22, cl = hc[0] + CL * r, nk = J.neck, hp = J.hip; const col = '#ff2a4a';
  g.save(); g.globalAlpha = 0.85; g.lineWidth = 0.9; g.strokeStyle = col; g.fillStyle = col; g.setLineDash([]);
  g.beginPath(); g.ellipse(hc[0], hc[1], 22.5, 22, 0, 0, 7); g.stroke();                                  // the head
  g.beginPath(); g.moveTo(cl - 4, hc[1] - 22); g.quadraticCurveTo(cl + 7, hc[1], cl - 1, hc[1] + 21); g.stroke();   // the face's centre line
  g.beginPath(); g.moveTo(hc[0] - 22, hc[1] + 4); g.quadraticCurveTo(hc[0] + 2, hc[1] - 1, hc[0] + 23, hc[1] + 1); g.stroke();   // the eye line
  g.setLineDash([2, 2]); g.beginPath(); g.moveTo(nk[0] - 13, nk[1] + 2); g.lineTo(nk[0] + 8, nk[1] + 1); g.stroke();   // the shoulder line
  g.beginPath(); g.moveTo(hp[0] - 12, hp[1]); g.lineTo(hp[0] + 11, hp[1] - 1); g.stroke();               // the hip line
  g.beginPath(); g.moveTo(nk[0] + 3, nk[1] + 2); g.quadraticCurveTo(hp[0] + 6, hp[1] - 16, hp[0] + 4, hp[1]); g.stroke();   // the torso's centre line
  g.setLineDash([]); g.lineWidth = 1.3;
  for (const [a, b] of [['shF', 'elF'], ['elF', 'hF'], ['shB', 'elB'], ['elB', 'hB'], ['neck', 'hip'], ['kneeF', 'footF'], ['kneeB', 'footB']]) { g.beginPath(); g.moveTo(J[a][0], J[a][1]); g.lineTo(J[b][0], J[b][1]); g.stroke(); }
  for (const [a, b] of [[[hp[0] - 5, hp[1]], 'kneeF'], [[hp[0] + 5, hp[1]], 'kneeB']]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(J[b][0], J[b][1]); g.stroke(); }
  for (const k of ['shF', 'elF', 'hF', 'shB', 'elB', 'hB', 'neck', 'hip', 'kneeF', 'kneeB', 'footF', 'footB']) { g.beginPath(); g.arc(J[k][0], J[k][1], 1.6, 0, 7); g.fill(); }
  g.lineWidth = 0.9; g.beginPath(); g.ellipse(2, 1, 22, 7, 0, 0, 7); g.stroke();                           // the ground, and the way he faces
  g.beginPath(); g.moveTo(2, 1); g.lineTo(22, -6); g.stroke(); g.beginPath(); g.moveTo(22, -6); g.lineTo(17, -7.5); g.lineTo(19.5, -3); g.closePath(); g.fill();
  g.restore();
}

// ================================================================ the equipment system (2026-11-01, after Robin's review of the attachments)
// Every item declares: its SLOT; its ANCHOR (the joint it hangs from); for a held item its LOCAL frame (drawn with the grip
// point at the origin and its length along local -y, so it turns about the hand, never about its own middle), its REST
// direction and which HAND holds it; what it COVERS (hair, the hand's art, the base boot, the legs); and its LAYER. The
// figure is drawn from a fixed order of layers, each asking the worn items whether they go there. Adding an item means
// declaring these facts, not adjusting a picture.

// ---------------------------------------------------------------- held items, in their local frame: the grip at (0, 0), the length along -y, the business side on -x
function swordLocal(g) {
  form(g, [[-2.3, 7], [2.3, 7], [2.1, -7], [-2.1, -7]], C.belt, { inkW: wi, shade: false, n: 4 });                       // the handle through the fist
  form(g, [[-3, 11], [3, 11], [2.4, 7.5], [-2.4, 7.5]], C.gold, { inkW: wi, shade: false, n: 4 });                       // the pommel
  form(g, [[-7, -7], [7, -7], [5, -11], [-5, -11]], C.gold, { inkW: wi, shade: false, n: 4 });                           // the guard
  form(g, [[-4, -11], [4, -11], [3.4, -46], [0, -56, 1], [-3.4, -46]], C.steel, { inkW: w * 0.8, n: 6, shade: [[0.5, -11], [4, -11], [3.4, -46], [0, -56], [0.5, -46]], shadeCol: C.steelShade, shadeA: 0.8 });
  line(g, [[0, -13], [0, -48]], wi * 0.8, INK, { taper: 0.1, taper2: 0.4 });
}
function axeLocal(g) {   // a one-handed axe, carried down and forward like the sword; the blade on +x (Robin, 2026-11-01: the head turned round)
  form(g, [[-2.4, 12], [2.4, 12], [2.2, -32], [-2.2, -32]], C.belt, { inkW: wi, shade: false, n: 4 });
  for (const y of [8, -6]) form(g, [[-3, y], [3, y], [3, y - 3], [-3, y - 3]], C.gold, { inkW: wi * 0.8, shade: false, n: 3 });
  form(g, [[2, -18], [2, -30], [9, -34], [18, -32, 1], [20, -22], [17, -12, 1], [9, -14]], C.steel, { inkW: w * 0.8, shade: [[9, -24], [18, -32], [20, -22], [17, -12]], shadeCol: C.steelShade, shadeA: 0.8 });
  form(g, [[-2, -20], [-2, -28], [-8, -26], [-7, -22]], C.steelShade, { inkW: wi, shade: false });
}
function bowLocal(g, J) {   // the grip at the belly's apex; the limbs bulge to +x (away from the archer), the string is the chord at -x
  const limb = t => [10 - 10 * Math.cos(t * Math.PI / 2) * 1.0 - 10 * (1 - Math.cos(t * Math.PI / 2)), 0];   // unused helper kept simple below
  const pts = []; for (let i = 0; i <= 8; i++) { const t = -1 + i / 4, x = 11 * (1 - t * t) - 11, y = 42 * t; pts.push([x + 11, y]); }   // an arc from (0, -42) through (11, 0) to (0, 42)
  const outer = pts.map(([x, y]) => [x + 2.2, y]), inner = pts.map(([x, y]) => [x - 2.2, y]);
  form(g, [...outer, ...inner.reverse()], C.belt, { inkW: wi, shade: false, n: 4 });
  form(g, [[8, -6], [13.5, -6], [13.5, 6], [8, 6]], C.gold, { inkW: wi * 0.8, shade: false, n: 3 });   // the grip wrap
  const tip1 = [0, -42], tip2 = [0, 42], pull = J && J.draw ? J.pullLocal : null;
  g.save(); g.lineWidth = 0.9; g.strokeStyle = '#f2ead8'; g.beginPath(); g.moveTo(tip1[0], tip1[1]); if (pull) g.lineTo(pull[0], pull[1]); g.lineTo(tip2[0], tip2[1]); g.stroke(); g.lineWidth = 0.45; g.strokeStyle = INK; g.stroke(); g.restore();
  if (pull) { g.save(); g.lineWidth = 1.6; g.strokeStyle = C.belt; g.beginPath(); g.moveTo(pull[0], pull[1]); g.lineTo(26, 0); g.stroke(); g.fillStyle = C.steel; g.beginPath(); g.moveTo(26, 0); g.lineTo(21, -2); g.lineTo(21, 2); g.closePath(); g.fill(); g.restore(); }
}
function staffLocal(g) { const m = MASTERS.staff; const k = 1 / m.px; g.save(); g.scale(k, k); g.drawImage(m.im, -m.pivot[0], -m.pivot[1]); g.restore(); }   // the raster staff's pivot is already its grip, its length already along -y

// ---------------------------------------------------------------- fitted armour, generated from the body's own outlines so it always covers what it should
const steelShade = (g, S, shadePts) => {};
function breastplateFit(g, J) {   // the torso's outline, a little larger, in steel: a gorget along the shoulder line, a ridge on the centre line
  const nk = J.neck, hp = J.hip, T = torsoPts(nk, hp), cx = (nk[0] + hp[0]) / 2, cy = (nk[1] + hp[1]) / 2 + 2;
  const grow = T.map(([x, y]) => [cx + (x - cx) * 1.09, cy + (y - cy) * 1.06]);
  form(g, grow, '#b9c4d2', { inkW: w, shade: [[cx + 3, nk[1] + 8], [hp[0] + 15, nk[1] + 14], [hp[0] + 15, hp[1] + 3], [hp[0] + 2, hp[1] + 3], [hp[0] + 1, hp[1] - 12]], shadeCol: '#6f7f96', shadeA: 0.9, glint: [[nk[0] - 10, nk[1] + 6], [nk[0] - 3, nk[1] + 5], [nk[0] - 7, nk[1] + 20], [nk[0] - 12, nk[1] + 18]], glintCol: '#f2f6fa', glintA: 0.55 });
  form(g, [[nk[0] - 13.5, nk[1] + 1], [nk[0] + 9, nk[1]], [nk[0] + 9.5, nk[1] + 5], [nk[0] - 13.5, nk[1] + 6]], C.gold, { inkW: wi, shade: false });   // the gorget on the shoulder line
  line(g, [[nk[0] + 4, nk[1] + 8], [hp[0] + 6, hp[1] - 14], [hp[0] + 4, hp[1] + 1]], wi, '#4a5668', { taper: 0.2 });   // the ridge on the centre line
  for (const [x, y] of [[nk[0] - 11, nk[1] + 12], [nk[0] + 10, nk[1] + 11], [hp[0] - 12, hp[1] - 4], [hp[0] + 11, hp[1] - 5]]) { g.fillStyle = '#4a4e5c'; g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill(); g.fillStyle = '#e8ecf2'; g.beginPath(); g.arc(x - 0.3, y - 0.4, 0.5, 0, 7); g.fill(); }
  form(g, [[hp[0] - 15, hp[1] + 1], [hp[0] + 14, hp[1] + 0], [hp[0] + 13, hp[1] + 7], [hp[0] - 14, hp[1] + 8]], '#9fabbb', { inkW: wi, shade: false });   // the tasset over the belt line
}
function helmetFit(g, J) {   // the head's own egg, grown, cut at the brow; the rim follows the face's curve and dips at its centre line; a nape guard behind
  const hc = J.head, cl = hc[0] + CL * 22;
  const cap = [[hc[0] - 25, hc[1] - 2], [hc[0] - 21, hc[1] - 16], [hc[0] - 9, hc[1] - 24], [hc[0] + 7, hc[1] - 25], [hc[0] + 20, hc[1] - 17], [hc[0] + 25.5, hc[1] - 5], [hc[0] + 24, hc[1] - 3], [cl, hc[1] - 5], [hc[0] - 12, hc[1] - 4], [hc[0] - 24, hc[1] - 1]];
  form(g, [[hc[0] - 25, hc[1] - 3], [hc[0] - 26, hc[1] + 8], [hc[0] - 17, hc[1] + 10], [hc[0] - 13, hc[1] - 2]], '#9fabbb', { inkW: w * 0.9, shade: false });   // the nape guard, behind the ear
  form(g, cap, '#b9c4d2', { inkW: w, shade: [[hc[0] - 10, hc[1] - 10], [hc[0] + 10, hc[1] - 12], [hc[0] + 25, hc[1] - 5], [hc[0] + 2, hc[1] - 4], [hc[0] - 12, hc[1] - 4]], shadeCol: '#6f7f96', shadeA: 0.85, glint: [[hc[0] - 12, hc[1] - 20], [hc[0] - 2, hc[1] - 22], [hc[0] + 2, hc[1] - 18], [hc[0] - 10, hc[1] - 16]], glintCol: '#f2f6fa', glintA: 0.6 });
  form(g, [[hc[0] - 24, hc[1] - 4], [hc[0] - 12, hc[1] - 3], [cl, hc[1] - 4.5], [hc[0] + 25, hc[1] - 7], [hc[0] + 25, hc[1] - 2], [cl, hc[1] + 0.5], [hc[0] - 12, hc[1] + 1], [hc[0] - 24, hc[1] + 1]], C.gold, { inkW: wi, shade: false, n: 8 });   // the brow rim
  for (const [x, y] of [[hc[0] - 20, hc[1] - 10], [hc[0] - 8, hc[1] - 20], [hc[0] + 8, hc[1] - 21], [hc[0] + 20, hc[1] - 12]]) { g.fillStyle = '#4a4e5c'; g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill(); g.fillStyle = '#e8ecf2'; g.beginPath(); g.arc(x - 0.3, y - 0.4, 0.5, 0, 7); g.fill(); }
  form(g, [[hc[0] - 2, hc[1] - 25], [hc[0] + 4, hc[1] - 29], [hc[0] - 2, hc[1] - 35], [hc[0] - 12, hc[1] - 38], [hc[0] - 22, hc[1] - 34], [hc[0] - 24, hc[1] - 27], [hc[0] - 16, hc[1] - 24]], C.cape, { inkW: w * 0.9, shade: [[hc[0] - 20, hc[1] - 30], [hc[0] - 4, hc[1] - 32], [hc[0] - 2, hc[1] - 25], [hc[0] - 16, hc[1] - 24]], shadeCol: C.capeShade });   // the crest
}
function hatFit(g, J) { put(g, 'hat', [J.head[0] + 2, J.head[1] - 15], -0.06); }   // the raster hat: its brim's centre sits on the crown; the brim's size was painted for this head
function shieldOn(g, J) {   // strapped to the far forearm: its centre a little outside the forearm's middle, its length along the forearm
  const m = vec(J.elB, J.hB, 0.55), a = ang(J.hB, J.elB) + Math.PI / 2; put(g, 'shield', [m[0] + 4, m[1] + 4], a, { scale: 0.8 });
}
function capeOn(g, J) {   // hung from the shoulder line, behind the body; seen past the back (screen-left) and below the hem
  const sF = J.shF, sB = J.shB, k = J.cape, hem = [-24 - 12 * k, -8 + 4 * k], mid = [-20 - 8 * k, -36];
  form(g, [[sF[0] - 4, sF[1] - 3], [sB[0] + 2, sB[1] - 2], [sB[0] - 2, sB[1] + 12], [mid[0] + 8, mid[1]], [hem[0] + 8, hem[1]], [hem[0] - 6, hem[1] - 2], [hem[0] - 10, hem[1] - 12], [mid[0] - 6, mid[1] - 2], [sF[0] - 9, sF[1] + 2]], C.cape, { inkW: w, shade: [[mid[0] - 4, mid[1] - 2], [mid[0] + 6, mid[1] + 2], [hem[0] + 4, hem[1]], [hem[0] - 10, hem[1] - 12]], shadeCol: C.capeShade, shadeA: 0.8 });
}

// ---------------------------------------------------------------- the registry
// held: hand 'main' (the near hand) or 'off' (the far hand); rest: the length's direction at rest; restHand: where that hand
// rests for this weapon (so an axe, a bow and a staff are not forced into the sword's position); grip: 'fist' closes on the
// handle (drawn over it), 'hold' wraps the bow's grip
const ITEMS = {
  hair: { slot: 'head', draw: (g, J, O) => hair(g, J, false) },
  helmet: { slot: 'head', covers: ['hair'], draw: helmetFit },
  hat: { slot: 'head', covers: ['hairTop'], draw: (g, J) => { hair(g, J, true); hatFit(g, J); } },
  tunic: { slot: 'torso', draw: (g, J) => { torsoTunic(g, J); belt(g, J); } },
  plate: { slot: 'torso', draw: (g, J) => { torsoTunic(g, J); breastplateFit(g, J); }, pauldrons: true },
  robe: { slot: 'torso', covers: ['legs'], wideSleeves: true, draw: robe },
  bare: { slot: 'hands', drawHand: (g, hd, d) => fist(g, hd, d) },
  gauntlet: { slot: 'hands', covers: ['hand'], drawHand: (g, hd, d, far) => put(g, 'gauntlet', hd, Math.atan2(d[1], d[0]), far ? { darken: 0.1 } : {}) },
  leather: { slot: 'boots', draw: (g, J, far) => bootLeather(g, J, far) },
  shoe: { slot: 'boots', draw: (g, J, far) => bootLeather(g, J, far, C.shoe, P.darken(C.shoe, 0.3)) },
  plateBoots: { slot: 'boots', covers: ['boot'], draw: (g, J, far) => bootRaster(g, J, far) },
  cape: { slot: 'back', anchor: 'shoulders', layer: 'behind', draw: capeOn },
  shield: { slot: 'offhand', anchor: 'farForearm', draw: shieldOn, restHand: [25, -48] },
  sword: { slot: 'weapon', held: 'main', local: swordLocal, rest: [0.72, 0.69], restHand: [-13, -33], restElbow: [-16, -45], grip: 'fist', clip: 'cut' },
  axe: { slot: 'weapon', held: 'main', local: axeLocal, rest: [0.72, 0.69], restHand: [-13, -33], restElbow: [-16, -45], grip: 'fist', clip: 'cut' },   // carried down and forward like the sword, the head turned round (Robin, 2026-11-01)
  staff: { slot: 'weapon', held: 'main', local: staffLocal, rest: [-0.4, -0.92], restHand: [-13, -35], restElbow: [-16, -45], grip: 'fist', clip: 'cast' },
  bow: { slot: 'weapon', held: 'off', local: bowLocal, rest: [0.3, -0.954], restHand: [16, -36], restElbow: [14, -46], grip: 'hold', clip: 'shoot', mainRest: [-13, -33], mainElbow: [-16, -45] },
};
const OUTFITS = {
  tunic: { head: 'hair', torso: 'tunic', hands: 'bare', boots: 'leather', back: null, weapon: 'sword', offhand: null },
  shield: { head: 'hair', torso: 'tunic', hands: 'bare', boots: 'leather', back: null, weapon: 'sword', offhand: 'shield' },
  axe: { head: 'hair', torso: 'tunic', hands: 'bare', boots: 'leather', back: null, weapon: 'axe', offhand: null },
  bow: { head: 'hair', torso: 'tunic', hands: 'bare', boots: 'leather', back: null, weapon: 'bow', offhand: null },
  staff: { head: 'hair', torso: 'tunic', hands: 'bare', boots: 'leather', back: null, weapon: 'staff', offhand: null },
  plate: { head: 'helmet', torso: 'plate', hands: 'gauntlet', boots: 'plateBoots', back: 'cape', weapon: 'sword', offhand: 'shield' },
  mixed: { head: 'hat', torso: 'plate', hands: 'bare', boots: 'plateBoots', back: 'cape', weapon: 'axe', offhand: null },
  mage: { head: 'hat', torso: 'robe', hands: 'bare', boots: 'shoe', back: null, weapon: 'staff', offhand: null },
  robebow: { head: 'hat', torso: 'robe', hands: 'bare', boots: 'shoe', back: null, weapon: 'bow', offhand: null },
};
// the rest pose for an outfit: the weapon decides where each hand rests and which way its length points
function restPose(O, base = BASE) {
  const Wp = ITEMS[O.weapon], J = { ...base };
  if (Wp) { if (Wp.held === 'main') { J.hF = Wp.restHand; J.elF = Wp.restElbow; J.dir = Wp.rest; } else { J.hB = Wp.restHand; J.elB = Wp.restElbow; J.dirOff = Wp.rest; J.hF = Wp.mainRest; J.elF = Wp.mainElbow; } }
  if (O.offhand === 'shield' && !(Wp && Wp.held === 'off')) { J.hB = ITEMS.shield.restHand; J.elB = ik(J.shB, J.hB); }
  return J;
}
// a held item placed on its hand: the grip at the hand, the length along the direction; then the hand closes over it
function held(g, J, O, name, hand) {
  const it = ITEMS[name], hd = hand === 'main' ? J.hF : J.hB, d = hand === 'main' ? J.dir : (J.dirOff || it.rest);
  g.save(); g.translate(hd[0], hd[1]); g.rotate(Math.atan2(d[1], d[0]) + Math.PI / 2); it.local(g, J); g.restore();
  ITEMS[O.hands].drawHand(g, hd, d, hand === 'off');
}
// the draw order: a fixed list of layers, each filled from the worn items' facts
function drawOutfit(g, J0, O) {
  const J = { ...J0 }, Wp = ITEMS[O.weapon], torso = ITEMS[O.torso], head = ITEMS[O.head], wide = !!torso.wideSleeves;
  if (J.dirOff === undefined && Wp && Wp.held === 'off') J.dirOff = Wp.rest;
  const offHeld = Wp && Wp.held === 'off', farFront = J.hB[0] > J.hip[0] + 6 || J.hB[1] < J.neck[1] || offHeld;
  const farArmLayer = () => { farArm(g, J, wide); };
  if (O.back && ITEMS[O.back].layer === 'behind') ITEMS[O.back].draw(g, J);        // 1 behind the body
  if (!farFront) { farArmLayer(); if (O.offhand === 'shield') ITEMS.shield.draw(g, J); }   // 2 the far arm at the far side, its shield on it
  const legsHidden = (torso.covers || []).includes('legs'); const legCol = legsHidden ? C.shoe : C.trousers;   // 3 the legs and their footwear (a robe covers the legs; the skeleton underneath is unchanged)
  leg(g, J, true, legCol); ITEMS[O.boots].draw(g, J, true); leg(g, J, false, legCol); ITEMS[O.boots].draw(g, J, false);
  neck(g, J); torso.draw(g, J);                                                     // 4 the neck and the torso with its armour over it
  if (torso.pauldrons) put(g, 'pauldron', [J.shB[0] + 2, J.shB[1] - 1], 0.1, { scale: 0.8, darken: 0.15 });
  if (farFront) { farArmLayer(); if (O.offhand === 'shield') ITEMS.shield.draw(g, J); }  // 5 the far arm in front when it reaches forward or holds something
  headFace(g, J); head.draw(g, J, O);                                               // 6 the head, then what it wears (a helmet covers the hair, a hat flattens it)
  nearSleeve(g, J, wide); if (torso.pauldrons) put(g, 'pauldron', [J.shF[0] - 2, J.shF[1] - 2], -0.1);   // 7 the near arm, its pauldron on its cap
  if (Wp && Wp.held === 'main') held(g, J, O, O.weapon, 'main'); else ITEMS[O.hands].drawHand(g, J.hF, [0.3, 0.95]);   // 8 the main hand's weapon, then the hand over its grip
  if (offHeld) held(g, J, O, O.weapon, 'off');                                      // 9 the off-hand's weapon (a bow) and the hand over its grip
  if (J.draw && Wp && Wp.held === 'off') ITEMS[O.hands].drawHand(g, J.hF, [1, 0]);  // the drawing hand on the string
  castGlow(g, J);
}
const SETDEF = Object.fromEntries(Object.entries(OUTFITS).map(([k, O]) => [k, { kind: (ITEMS[O.weapon] || {}).clip || 'cut', outfit: O, draw: (g, J) => drawOutfit(g, J, O) }]));
const WEAPONS = ITEMS;

// ---------------------------------------------------------------- the diagnostic view: a held item alone in its local frame, its grip point and its length axis
function diagnostic(g, name, J) {
  const it = ITEMS[name]; g.save(); it.local(g, J || { draw: 0 }); g.restore();
  g.save(); g.strokeStyle = '#ff2a4a'; g.fillStyle = '#ff2a4a'; g.lineWidth = 0.8; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(0, 14); g.lineTo(0, -62); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(0, -62); g.lineTo(-2.5, -56); g.lineTo(2.5, -56); g.closePath(); g.fill();
  g.beginPath(); g.arc(0, 0, 2.2, 0, 7); g.fill(); g.lineWidth = 1; g.strokeStyle = '#fff'; g.stroke();
  g.strokeStyle = '#ff2a4a'; g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.stroke(); g.restore();
}

// ---------------------------------------------------------------- the clips per weapon kind (unchanged in method; the rest pose now comes from the item)
function clipsFor(O) { const C0 = clipsRaw(O); for (const A of Object.values(C0)) A.frames = A.frames.map(solveArms); return C0; }
function clipsRaw(O) {
  const Wp = ITEMS[O.weapon] || ITEMS.sword, kind = Wp.clip, base = restPose(O);
  const K = shiftShoulders(keys(base)), B = K.base;
  const stand = [0, -1, -1.6, -0.8].map(dy => { const J = pose({}, base); for (const k of ['neck', 'head', 'shF', 'elF', 'hF', 'shB', 'elB', 'hB']) J[k] = [J[k][0], J[k][1] + dy]; return J; });
  const move = [0, 1, 2, 3, 4, 5].map(i => walk(i / 6, base));
  let attack1;
  if (kind === 'cast') attack1 = [K.pull, K.raise, { ...K.raise, glow: 0.5 }, { ...K.raise, glow: 1 }, { ...lerp(K.raise, B, 0.4), glow: 0.5 }, lerp(K.raise, B, 0.8)];
  else if (kind === 'shoot') {   // the bow arm (the off-hand) out, the main hand nocks, draws to the cheek, looses
    const out = pose({ shB: [10, -57], elB: [16, -56], hB: [26, -54], dirOff: [0, -1], hF: [14, -54], draw: 0 }, base);
    const drawn = pose({ hip: [-1, -32], neck: [1, -61], head: [1, -83], shB: [10, -57], elB: [17, -56], hB: [28, -55], dirOff: [0, -1], hF: [-2, -58], elF: [-12, -52], draw: 1, pullLocal: [-30, -3] }, base);
    const loosed = pose({ shB: [10, -57], elB: [17, -56], hB: [28, -55], dirOff: [0, -1], hF: [-12, -60], elF: [-14, -52], draw: 0 }, base);
    attack1 = [lerp(B, out, 0.6), out, lerp(out, drawn, 0.5), drawn, loosed, lerp(loosed, B, 0.5)];
  } else attack1 = [lerp(B, K.windup, 0.6), K.windup, K.top, K.strike, K.follow, lerp(K.follow, B, 0.5)];
  const brace = pose({ hip: [-2, -31], neck: [-1, -60], head: [-2, -82], shF: [-11, -56], elF: [-6, -50], hF: [4, -52], dir: kind === 'cast' ? base.dir : [0.95, -0.3], hB: [14, -50], elB: [16, -49], kneeF: [-7, -18], footF: [-6, -2], kneeB: [8, -18], footB: [10, -3], cape: 0.2 }, base);
  const defend = [lerp(B, brace, 0.5), brace];
  const hit1 = [pose({ rot: -14, drop: 1, face: 'hurt', cape: 0.6 }, base), pose({ rot: -7, face: 'hurt', cape: 0.3 }, base)];
  const die1 = [pose({ rot: -10, face: 'hurt', cape: 0.5 }, base), pose({ rot: -24, drop: 1, face: 'hurt', kneeF: [-7, -14], kneeB: [5, -14], cape: 0.7 }, base), pose({ rot: -58, drop: -12, face: 'hurt', cape: 0, lying: 0.5 }, base),
                pose({ rot: -88, drop: -24, face: 'dead', cape: 0, lying: 1 }, base), pose({ rot: -90, drop: -21, face: 'dead', cape: 0, lying: 1 }, base), pose({ rot: -90, drop: -21, face: 'dead', cape: 0, lying: 1 }, base)];   // a negative drop lifts him: he turns about his feet, so lying flat he must rise by the head's radius to rest on the ground, not in it
  return { stand: { delay: 150, frames: stand }, move: { delay: 100, frames: move }, attack1: { delay: 67, frames: attack1, delays: [67, 67, 67, 134, 67, 67] }, defend: { delay: 100, frames: defend }, hit1: { delay: 150, frames: hit1, delays: [150, 120] }, die1: { delay: 90, frames: die1, fades: [[255, 255], [255, 255], [255, 255], [255, 255], [255, 140], [140, 0]] } };
}
function clips(kind) { return clipsFor(Object.values(OUTFITS).find(O => (ITEMS[O.weapon] || {}).clip === kind) || OUTFITS.tunic); }

// ---------------------------------------------------------------- the frames and the pack
const UNIT = 3, FW = 640, FH = 500, OX = 320, OY = 460;   // 3 file px per unit; the feet at (320, 460), facing left
function frame(set, J) {
  const cv = P.createCanvas(FW, FH), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.translate(OX, OY); g.scale(-UNIT, UNIT);
  if (J.rot || J.drop) { g.translate(0, J.drop || 0); g.rotate((J.rot || 0) * Math.PI / 180); }
  SETDEF[set].draw(g, J); return cv;
}
async function build(set) {
  const dir = path.join(WORK, set, 'render'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const meta = { origin: [OX, OY], size: FW, px: 1, actions: {} }, CL = clipsFor(SETDEF[set].outfit);
  for (const [act, A] of Object.entries(CL)) {
    meta.actions[act] = { delay: A.delay, frames: [] };
    A.frames.forEach((J, i) => { const file = `${act}_${String(i).padStart(2, '0')}.png`; P.save(frame(set, J), path.join(dir, file)); const F = { file, delay: (A.delays || [])[i] || A.delay }; if (!J.rot) F.head = [OX - J.head[0] * UNIT, OY + (J.head[1] - 26) * UNIT]; if (A.fades) { F.a0 = A.fades[i][0]; F.a1 = A.fades[i][1]; } meta.actions[act].frames.push(F); });
  }
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
  const out = path.join(WORK, 'out', set); fs.rmSync(out, { recursive: true, force: true });
  const r = spawnSync('node', [path.join(ROOT, 'tools/pack.js'), 'hero_' + set, dir, out], { stdio: 'inherit' }); if (r.status) throw new Error('pack failed for ' + set);
}
// the per-part layers (the alignment test): each draws one layer of an outfit from the same pose; drawn in this order they equal drawOutfit for a sword on the near hand
const LAYERS = {
  body: (g, J, O) => { const wide = !!ITEMS[O.torso].wideSleeves; const front = J.hB[0] > J.hip[0] + 6 || J.hB[1] < J.neck[1]; if (!front) farArm(g, J, wide); leg(g, J, true, C.trousers); ITEMS[O.boots].draw(g, J, true); leg(g, J, false, C.trousers); ITEMS[O.boots].draw(g, J, false); neck(g, J); torsoTunic(g, J); },
  coat: (g, J) => { breastplateFit(g, J); put(g, 'pauldron', [J.shB[0] + 2, J.shB[1] - 1], 0.1, { scale: 0.8, darken: 0.15 }); },
  far_front: (g, J, O) => { if (J.hB[0] > J.hip[0] + 6 || J.hB[1] < J.neck[1]) farArm(g, J, !!ITEMS[O.torso].wideSleeves); },   // the far arm crosses in front of the coat when it reaches forward or up; the frame decides, the layer is empty otherwise
  head: (g, J) => headFace(g, J),
  hat: (g, J) => { hair(g, J, true); hatFit(g, J); },
  arm: (g, J) => { nearSleeve(g, J, false); put(g, 'pauldron', [J.shF[0] - 2, J.shF[1] - 2], -0.1); },
  sword: (g, J) => { const hd = J.hF, d = J.dir; g.save(); g.translate(hd[0], hd[1]); g.rotate(Math.atan2(d[1], d[0]) + Math.PI / 2); swordLocal(g); g.restore(); },
  hand: (g, J) => fist(g, J.hF, J.dir),
};
module.exports = { parts: { farArm, leg, neck, torsoTunic, belt, headFace, hair, nearSleeve, fist, mitt, solveArms, farInFront, shieldArm, armPts, wristOf, bootLeather, torsoPts, CL, form, line, C, ink: INK, vec, ang, ik }, LAYERS, SETDEF, OUTFITS, ITEMS, WEAPONS, drawOutfit, restPose, diagnostic, clipsFor, clips, frame, loadMasters, BASE, walk, lerp, pose, UNIT, overlay };
if (require.main === module) (async () => { await loadMasters(); for (const s of SETS) await build(s); console.log('done', SETS.join(', ')); })();
