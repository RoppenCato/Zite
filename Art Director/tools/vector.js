// vector.js: the cartoon-vector hand (Perry, AD, 2026-10-31, after Robin's reference picture: a night village of stone
// towers and round trees). What that hand is, read off the picture: no ink line; every shape is cut by its tone against the
// tone behind it; soft rounded forms; a base tone, a cool blue-violet shade on the side away from the light, and crisp
// lighter highlight patches (scalloped on foliage, flat on stone); saturated colour; shadows and far things pushed toward
// blue. These helpers make that: a tone set from one base colour, a shaded shape (base, a shade crescent away from the
// light, a highlight patch toward it) and the foliage mass with scalloped highlights.
const P = require('./paint.js');
const { mix, alpha, lighten } = P;
const SHADE_TINT = '#3a3c8a', LIGHT_TINT = '#fff6d8';
function tones(base, k = 1) { return { base, shade: mix(mix(base, '#000000', 0.22 * k), SHADE_TINT, 0.28 * k), deep: mix(mix(base, '#000000', 0.42 * k), SHADE_TINT, 0.34 * k), light: mix(lighten(base, 0.2 * k), LIGHT_TINT, 0.18 * k), hi: mix(lighten(base, 0.38 * k), LIGHT_TINT, 0.3 * k) }; }
const LIGHT = [-0.6, -0.8];   // the light's direction on screen: from the upper left
// a shaded shape: path() draws the outline; d is the shade's depth in px; the shade sits on the side away from the light
function shaded(g, path, t, d = 8, o = {}) {
  path(); g.fillStyle = t.shade; g.fill();
  g.save(); path(); g.clip(); g.translate(LIGHT[0] * d, LIGHT[1] * d); path(); g.fillStyle = t.base; g.fill(); g.restore();   // the base, shifted toward the light, leaves a shade crescent
  if (o.deep) { g.save(); path(); g.clip(); g.translate(-LIGHT[0] * d * 0.5, -LIGHT[1] * d * 0.5); g.globalCompositeOperation = 'source-over'; path(); g.fillStyle = 'rgba(0,0,0,0)'; g.restore(); }
  if (o.edge !== false) { path(); g.lineWidth = o.edge || 1.5; g.strokeStyle = alpha(t.deep, 0.45); g.lineJoin = 'round'; g.stroke(); }   // a faint edge of its own deep tone, never black
}
// a highlight patch: a soft-cornered blob of the light tone at (x, y), rx by ry, turned by a
function patch(g, x, y, rx, ry, col, a = 0) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fillStyle = col; g.fill(); g.restore(); }
// a scalloped highlight: a run of overlapping circles along an arc (the foliage's lit top, the hair's sheen)
function scallops(g, x, y, r, a0, a1, n, rr, col) { g.fillStyle = col; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, rr, 0, 7); g.fill(); } }
// a foliage mass: a scalloped silhouette in the deep tone, a base mass inset, scalloped light on the upper-left lobes
function foliage(g, x, y, rx, ry, seed, t, o = {}) {
  const rr = P.rng(seed), n = o.n || Math.max(7, Math.round((rx + ry) / 16)), lobes = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, w = 0.82 + rr() * 0.3; lobes.push([x + Math.cos(a) * rx * w, y + Math.sin(a) * ry * w, (rx + ry) / 2 * (0.22 + rr() * 0.14)]); }
  const path = k => { g.beginPath(); for (const [lx, ly, lr] of lobes) { g.moveTo(lx + lr * k, ly); g.arc(lx, ly, lr * k, 0, 7); } g.ellipse(x, y, rx * 0.8 * k, ry * 0.8 * k, 0, 0, 7); };
  path(1); g.fillStyle = t.deep; g.fill();
  g.save(); path(1); g.clip(); g.translate(LIGHT[0] * 6, LIGHT[1] * 8); path(1); g.fillStyle = t.shade; g.fill(); g.translate(LIGHT[0] * 6, LIGHT[1] * 8); path(0.96); g.fillStyle = t.base; g.fill();
  for (const [lx, ly, lr] of lobes) { const up = (y - ly) / ry - (lx - x) / rx * 0.5; if (up > 0.15) scallops(g, lx, ly, lr * 0.55, Math.PI * 1.05, Math.PI * 1.95, 3, lr * 0.42, t.light); if (up > 0.6) patch(g, lx - lr * 0.2, ly - lr * 0.3, lr * 0.4, lr * 0.25, t.hi); }
  g.restore();
}
// a stone block: a rounded rectangle in the stone's tones, a lighter top face, a darker joint line
function block(g, x, y, w, h, t, r = 6) {
  const path = () => { g.beginPath(); P.rr(g, x, y, w, h, r); };
  shaded(g, path, t, 4, { edge: 1.2 });
  g.beginPath(); P.rr(g, x + 3, y + 2, w - 6, Math.max(4, h * 0.32), r * 0.7); g.fillStyle = alpha(t.light, 0.8); g.fill();
}
module.exports = { tones, shaded, patch, scallops, foliage, block, LIGHT, SHADE_TINT };
