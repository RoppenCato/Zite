// brush.js: the painterly brushes, rebuilt to docs/recipe.md (Perry, AD, 2026-10-31, after Colin, AD's review: one light
// over the whole form, three chosen tones in hard shapes, a dark quiet ground body under a bright lip, crisp edges, one
// ink line for everything near, nothing stamped). Every brush takes a seed so a piece is the same every run. Coordinates
// are in file pixels (2x). The first version (soft dabs, a gradient per lobe, a coloured edge per material) is gone.
const P = require('./paint.js');
const { lin, rad, alpha, mix, lighten, darken } = P;
const INK = '#2b2320', INK_W = 2.5, INNER_W = 1.5;   // the one line

// ---- the chosen tones (docs/recipe.md) ----
const LEAF = { hi: '#c2e860', light: '#86c93e', mid: '#4f9c2d', dark: '#2e6b21', deep: '#1a4518' };
const LEAF_YELLOW = { hi: '#e8ee80', light: '#b7d24c', mid: '#7ea838', dark: '#4f7a28', deep: '#2f5120' };
const LEAF_DARK = { hi: '#a8e05a', light: '#6fbd42', mid: '#419634', dark: '#276b25', deep: '#17461a' };
const LIP = { hi: '#d2f050', light: '#8fcc38', mid: '#5a9e2c', dark: '#376f1f', deep: '#1f4c15' };
const SOIL = { hi: '#8a7c48', light: '#6f6338', mid: '#554b28', dark: '#3b3418', deep: '#221e0c' };
const SOILSTONE = { hi: '#a89a74', light: '#857a5a', mid: '#625a40', dark: '#443e2a', deep: '#2a2618' };
const BARK = { hi: '#d9a86a', light: '#b07c44', mid: '#80562c', dark: '#55381a', deep: '#33200e' };
const STONE = { hi: '#e2e0d6', light: '#b9b8ae', mid: '#8c8d85', dark: '#5f615b', deep: '#3a3c38' };
const WOOD = { hi: '#e8c282', light: '#c99a52', mid: '#a3742f', dark: '#74501c', deep: '#4a300e' };
const SAND = { hi: '#fff3cf', light: '#eedfa8', mid: '#d6c288', dark: '#b39e62', deep: '#8a7744' };
const HAY = { hi: '#f6e080', light: '#d9bd4e', mid: '#b4962e', dark: '#86701c', deep: '#5a4a10' };
const CLOUD = { top: '#ffffff', under: '#b9cde6', deep: '#9ab3d4' };

// ---- the one line, the one light ----
function ink(g, w = INK_W, a = 1) { g.lineWidth = w; g.strokeStyle = a < 1 ? alpha(INK, a) : INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
// a stepped light over a whole form: light on top, mid, dark beneath, narrow transitions (rule 1 and 2)
function steps(g, x0, y0, x1, y1, t, bands = [0.34, 0.66]) { const [a, b] = bands; return lin(g, x0, y0, x1, y1, [[0, t.light], [a - 0.01, t.light], [a + 0.01, t.mid], [b - 0.01, t.mid], [b + 0.01, t.dark], [1, t.dark]]); }   // hard bands (Colin, AD: the soft band read as a ramp)
// a palette pushed toward a colour (haze toward the sky for far things)
function hazed(t, k, col = '#a8d4f2') { const o = {}; for (const n of Object.keys(t)) o[n] = mix(t[n], col, k); return o; }

// ---- paths ----
function scallop(g, x, y, r, seed, bumps, k = 0.22) {
  const rr = P.rng(seed), n = bumps || Math.max(6, Math.round(r / 5)); g.beginPath();
  for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, rb = r * (0.92 + rr() * 0.16); const bx = x + Math.cos(am) * rb, by = y + Math.sin(am) * rb, br = r * k * (0.8 + rr() * 0.5); i === 0 && g.moveTo(bx + Math.cos(am - 2.2) * br, by + Math.sin(am - 2.2) * br); g.arc(bx, by, br, am - 2.2, am + 2.2); }
  g.closePath();
}
function lump(g, x, y, rx, ry, seed, n = 9, k = 0.25) { const rr = P.rng(seed); g.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, w = 1 + (rr() - 0.5) * k; const px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry * w; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); }
function bladePath(g, x, y, h, w, lean) { g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x + lean * 0.35, y - h * 0.55, x + lean, y - h); g.quadraticCurveTo(x + lean * 0.45, y - h * 0.5, x + w / 2, y); g.closePath(); }
function leafPath(g, x, y, len, w, a) { const c = Math.cos(a), s = Math.sin(a); const tx = x + c * len, ty = y + s * len, nx = -s * w / 2, ny = c * w / 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + c * len * 0.45 + nx, y + s * len * 0.45 + ny, tx, ty); g.quadraticCurveTo(x + c * len * 0.45 - nx, y + s * len * 0.45 - ny, x, y); g.closePath(); }
// an outline round whatever is painted on a canvas: the painted alpha dilated in ink, laid under (a closed silhouette line with no inner arcs)
function outline(src, w = INK_W) {
  const o = P.createCanvas(src.width, src.height), g = o.getContext('2d'); const n = 12;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.drawImage(src, Math.cos(a) * w, Math.sin(a) * w); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = INK; g.fillRect(0, 0, o.width, o.height); g.globalCompositeOperation = 'source-over'; g.drawImage(src, 0, 0); return o;
}

// ---- foliage ----
// a crown or a bush: ONE mass of lobes, lit once from the top, the lobes cut in with a dark crevice and a light edge, a
// serrated leaf edge, the one ink line round the whole. Returns nothing; paints at (x, y) the mass's centre.
function crown(g, x, y, rx, ry, seed, t = LEAF, o = {}) {
  const rr = P.rng(seed), n = o.n || Math.max(5, Math.round((rx + ry) / 24)), lobes = [];
  for (let i = 0; i < n; i++) { const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * 0.72; lobes.push({ x: x + Math.cos(a) * rx * d, y: y + Math.sin(a) * ry * d, r: (o.r || Math.min(rx, ry) * 0.6) * (0.7 + rr() * 0.5), s: Math.floor(rr() * 1e6) }); }
  lobes.push({ x, y: y - ry * 0.15, r: (o.r || Math.min(rx, ry) * 0.6) * 1.2, s: seed + 7 });
  const top = y - ry - 10, bot = y + ry + 10, W = Math.ceil(rx * 2.6) + 40, H = Math.ceil(ry * 2.6) + 40, ox = x - W / 2, oy = y - H / 2;
  const m = P.createCanvas(W, H), mg = m.getContext('2d'); mg.translate(-ox, -oy);
  lobes.sort((a, b) => a.y - b.y);
  const band = l => { const u = (l.y - top) / (bot - top); return u < 0.33 ? t.light : u < 0.64 ? t.mid : t.dark; };   // the one light, by lobe: light on top, mid, dark beneath; the band's edge follows the lobes, never a straight line
  for (const l of lobes) { scallop(mg, l.x, l.y, l.r, l.s, Math.max(8, Math.round(l.r / 4)), 0.2); mg.fillStyle = band(l); mg.fill(); }
  mg.globalCompositeOperation = 'source-atop';
  for (const l of lobes) {                                                                                                                      // the lobes cut in: a crevice under and right, a light edge up and left; a few clusters of leaves, bigger toward the edge, quiet between
    const cy = l.y + l.r * 0.12, lt = band(l); mg.save(); scallop(mg, l.x, l.y, l.r, l.s, Math.max(8, Math.round(l.r / 4)), 0.2); mg.clip();
    mg.beginPath(); mg.arc(l.x + l.r * 0.1, cy + l.r * 0.1, l.r * 1.02, 0.2, 2.2); mg.lineWidth = l.r * 0.22; mg.strokeStyle = alpha(t.deep, 0.7); mg.stroke();
    mg.beginPath(); mg.arc(l.x - l.r * 0.08, cy - l.r * 0.1, l.r * 0.78, 3.4, 5.6); mg.lineWidth = l.r * 0.16; mg.strokeStyle = lt === t.light ? t.hi : lt === t.mid ? t.light : t.mid; mg.stroke();
    const k = Math.max(1, Math.round(l.r / 22));
    for (let i = 0; i < k; i++) {                                                                                                                 // a clump: a few fat leaf shapes side by side near the lobe's edge, quiet elsewhere (Colin, AD: the fans read as spidery stars)
      const a = rr() * Math.PI * 2, d = (0.55 + rr() * 0.35) * l.r, cx = l.x + Math.cos(a) * d, cyy = l.y + Math.sin(a) * d, up = (l.y - cyy) / l.r + (l.x - cx) / l.r * 0.4;
      const col = up > 0.45 ? (lt === t.light ? t.hi : t.light) : up > -0.3 ? (lt === t.dark ? t.mid : lt) : (lt === t.light ? t.mid : t.deep), n = 2 + Math.floor(rr() * 2), len = l.r * 0.3, w = len * 0.7;
      for (let j = 0; j < n; j++) { const la = a + (j - (n - 1) / 2) * 0.7, bx = cx + Math.cos(la + Math.PI / 2) * w * (j - (n - 1) / 2) * 0.9, by = cyy + Math.sin(la + Math.PI / 2) * w * (j - (n - 1) / 2) * 0.9; leafPath(mg, bx + 1.5, by + 2, len, w, la); mg.fillStyle = t.deep; mg.fill(); leafPath(mg, bx, by, len, w, la); mg.fillStyle = col; mg.fill(); }
    }
    mg.restore();
  }
  mg.globalCompositeOperation = 'source-over';
  g.drawImage(o.ink === false ? m : outline(m), ox, oy);   // a plane's crown has no line
}
// a trunk: a flared, tapered post lit once across, bark strokes, roots; the crown overlaps its top so nothing floats
function trunk(g, x, y, h, w, seed, t = BARK, o = {}) {
  const rr = P.rng(seed), top = y - h, flare = o.flare === undefined ? w * 0.7 : o.flare;
  const path = () => { g.beginPath(); g.moveTo(x - w / 2 - flare, y); g.quadraticCurveTo(x - w / 2, y - h * 0.22, x - w * 0.42, top + h * 0.3); g.lineTo(x - w * 0.36, top); g.lineTo(x + w * 0.36, top); g.lineTo(x + w * 0.42, top + h * 0.3); g.quadraticCurveTo(x + w / 2, y - h * 0.22, x + w / 2 + flare, y); g.closePath(); };
  if (o.fork !== false) for (const [dx, dy, bw] of [[-w * 1.3, -h * 0.42, w * 0.4], [w * 1.1, -h * 0.36, w * 0.36]]) {   // a fork: two branches up into the crown (no lollipop)
    g.beginPath(); g.moveTo(x - w * 0.3, top + h * 0.12); g.quadraticCurveTo(x + dx * 0.4, top - h * 0.1, x + dx, top + dy); g.lineTo(x + dx + bw * 0.6, top + dy + bw * 0.3); g.quadraticCurveTo(x + dx * 0.5, top + h * 0.02, x + w * 0.3, top + h * 0.14); g.closePath(); g.fillStyle = dx < 0 ? t.mid : t.dark; g.fill(); ink(g);
  }
  path(); g.fillStyle = steps(g, x - w * 0.6, 0, x + w * 0.6, 0, t, [0.3, 0.66]); g.fill();
  g.save(); path(); g.clip();
  for (let i = 0; i < Math.round(h / 9); i++) { const sx = x - w * 0.45 + rr() * w * 0.9, sy = top + rr() * h, len = 10 + rr() * h * 0.35; g.strokeStyle = rr() > 0.65 ? t.hi : t.deep; g.lineWidth = 1 + rr() * 1.5; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + (rr() - 0.5) * 4, sy + len / 2, sx + (rr() - 0.5) * 3, sy + len); g.stroke(); }
  g.fillStyle = t.deep; g.globalAlpha = 0.35; g.fillRect(x - w * 2, y - h * 0.18, w * 4, h * 0.18); g.globalAlpha = 1;
  g.restore();
  for (let i = 0; i < 3; i++) { const rx_ = x + (i - 1) * w * 0.5, ry_ = y - 2; g.beginPath(); g.ellipse(rx_, ry_, w * 0.32, w * 0.16, 0, 0, 7); g.fillStyle = i === 1 ? t.light : t.mid; g.fill(); ink(g, INNER_W, 0.6); }
  path(); ink(g);
}
// a tuft of grass: blades fanning from the base, light tips; hard edges
function tuft(g, x, y, s, seed, t = LIP, n = 9) {
  const rr = P.rng(seed);
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) { const lean = (i / (n - 1) - 0.5) * s * 1.6 + (rr() - 0.5) * s * 0.3, h = s * (0.7 + rr() * 0.6) * (pass ? 0.72 : 1), w = s * 0.2; bladePath(g, x + (rr() - 0.5) * s * 0.3, y, h, w, lean); g.fillStyle = pass ? (rr() > 0.5 ? t.hi : t.light) : (rr() > 0.5 ? t.dark : t.mid); g.fill(); }
}
// dense grass along a band: blades rooted at y0 (a number or a function of x) down to y0 + depth, rising h; seamless in wrap
function grass(g, x0, x1, y0, depth, h, seed, t = LIP, density = 0.5, wrap = 0) {
  const rr = P.rng(seed), n = Math.round((x1 - x0) * density), base = typeof y0 === 'function' ? y0 : () => y0;
  const one = (col, hk) => { const x = x0 + rr() * (x1 - x0), y = base(x) + rr() * depth, hh = h * (0.55 + rr() * 0.6) * hk, w = 4 + rr() * 4, lean = (rr() - 0.5) * h * 0.7; const d = () => { bladePath(g, x, y, hh, w, lean); g.fillStyle = col; g.fill(); }; wrap ? P.wrapped(g, wrap, 0, d) : d(); };
  for (let i = 0; i < n; i++) one(rr() > 0.5 ? t.deep : t.dark, 1.0);
  for (let i = 0; i < n; i++) one(rr() > 0.5 ? t.mid : t.dark, 0.95);
  for (let i = 0; i < n * 0.6; i++) one(rr() > 0.5 ? t.light : t.mid, 0.8);
  for (let i = 0; i < n * (o_hi(t)); i++) one(t.hi, 0.6);                        // the brightest blades few (Colin, AD: the lip was the loudest thing at the fighters' feet)
}
function o_hi(t) { return t.hiShare === undefined ? 0.12 : t.hiShare; }
// a flower: a stem, two leaves, petals and a centre in flat tones with the one line
function flower(g, x, y, s, seed, kind = 0) {
  const rr = P.rng(seed), petals = [['#ffd84a', '#d9961c'], ['#ff9fbb', '#d4557a'], ['#fff4e4', '#cfc2a8']][kind % 3];
  g.strokeStyle = LEAF.dark; g.lineWidth = Math.max(3, s * 0.14); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 0.15, y - s * 0.5, x, y - s); g.stroke();
  for (const side of [-1, 1]) { leafPath(g, x, y - s * (0.3 + 0.2 * (side + 1)), s * 0.45, s * 0.22, side > 0 ? -0.6 : Math.PI + 0.6); g.fillStyle = LEAF.mid; g.fill(); ink(g, INNER_W, 0.7); }
  const hx = x, hy = y - s, pr = s * 0.3;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + rr() * 0.3; g.beginPath(); g.ellipse(hx + Math.cos(a) * pr * 0.75, hy + Math.sin(a) * pr * 0.75, pr * 0.5, pr * 0.32, a, 0, 7); g.fillStyle = i % 2 ? petals[0] : lighten(petals[0], 0.25); g.fill(); g.lineWidth = INNER_W; g.strokeStyle = petals[1]; g.stroke(); }
  g.beginPath(); g.arc(hx, hy, pr * 0.32, 0, 7); g.fillStyle = '#b8601a'; g.fill(); ink(g, INNER_W, 0.7);
}
// ---- hard things ----
// a rock: a lumpy shape in three tones as shapes (the dark body, a mid face, a light facet), cracks, the line, a cast shadow
function rock(g, x, y, rx, ry, seed, t = STONE, o = {}) {
  const rr = P.rng(seed);
  if (o.shadow !== false) { g.beginPath(); g.ellipse(x + rx * 0.05, y, rx * 1.05, ry * 0.3, 0, 0, 7); g.fillStyle = 'rgba(20,30,10,0.35)'; g.fill(); }
  const cy = y - ry * 0.55;
  lump(g, x, cy, rx, ry * 0.75, seed, 10, 0.22); g.fillStyle = t.dark; g.fill();
  g.save(); lump(g, x, cy, rx, ry * 0.75, seed, 10, 0.22); g.clip();
  lump(g, x - rx * 0.08, cy - ry * 0.2, rx * 0.92, ry * 0.6, seed + 1, 9, 0.25); g.fillStyle = t.mid; g.fill();
  lump(g, x - rx * 0.3, cy - ry * 0.32, rx * 0.45, ry * 0.28, seed + 2, 7, 0.3); g.fillStyle = t.light; g.fill();
  lump(g, x - rx * 0.38, cy - ry * 0.4, rx * 0.2, ry * 0.12, seed + 3, 6, 0.3); g.fillStyle = t.hi; g.fill();
  for (let i = 0; i < 2; i++) { const cx = x + (rr() - 0.5) * rx, cyy = cy + (rr() - 0.5) * ry * 0.6; g.strokeStyle = t.deep; g.lineWidth = INNER_W; g.beginPath(); g.moveTo(cx, cyy); g.lineTo(cx + (rr() - 0.5) * rx * 0.6, cyy + rr() * ry * 0.5); g.lineTo(cx + (rr() - 0.5) * rx * 0.8, cyy + rr() * ry * 0.8); g.stroke(); }
  if (o.moss) { lump(g, x - rx * 0.1, cy - ry * 0.55, rx * 0.6, ry * 0.28, seed + 4, 8, 0.4); g.fillStyle = LEAF.light; g.fill(); ink(g, INNER_W, 0.6); }
  g.restore();
  lump(g, x, cy, rx, ry * 0.75, seed, 10, 0.22); ink(g);
}
// a round-ended wooden pole, lit once across, grain, the line
function pole(g, x, y, len, w, seed, vertical = true, t = WOOD) {
  const rr = P.rng(seed); g.save(); g.translate(x, y); if (!vertical) g.rotate(Math.PI / 2);
  g.beginPath(); P.rr(g, -w / 2, -len, w, len, w / 2); g.fillStyle = vertical ? steps(g, -w / 2, 0, w / 2, 0, t, [0.3, 0.66]) : steps(g, w / 2, 0, -w / 2, 0, t, [0.3, 0.66]); g.fill();
  g.save(); g.beginPath(); P.rr(g, -w / 2, -len, w, len, w / 2); g.clip(); for (let i = 0; i < len / 14; i++) { const gx = -w / 2 + rr() * w, gy = -rr() * len, gl = 6 + rr() * 14; g.strokeStyle = rr() > 0.5 ? t.deep : t.hi; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + (rr() - 0.5) * 2, gy + gl); g.stroke(); } g.restore();
  g.beginPath(); g.ellipse(0, -len + w * 0.5, w * 0.5, w * 0.28, 0, 0, 7); g.fillStyle = t.light; g.fill(); ink(g, INNER_W, 0.7);
  g.beginPath(); P.rr(g, -w / 2, -len, w, len, w / 2); ink(g); g.restore();
}
// a dome (a mushroom cap, a roof): three tones in bands over a half ellipse, a crescent in the light tone, spots, a dark rim band
function dome(g, x, y, rx, ry, col, seed, o = {}) {
  const rr = P.rng(seed), t = { light: lighten(col, 0.22), mid: col, dark: mix(darken(col, 0.35), '#3a2040', 0.2) };
  const path = () => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, 0); g.quadraticCurveTo(x + rx * 0.5, y + ry * 0.22, x, y + ry * 0.22); g.quadraticCurveTo(x - rx * 0.5, y + ry * 0.22, x - rx, y); g.closePath(); };
  path(); g.fillStyle = steps(g, x - rx * 0.4, y - ry, x + rx * 0.3, y + ry * 0.2, t, [0.32, 0.72]); g.fill();
  g.save(); path(); g.clip();
  g.beginPath(); g.ellipse(x - rx * 0.28, y - ry * 0.48, rx * 0.42, ry * 0.3, -0.35, 0, 7); g.fillStyle = lighten(col, 0.38); g.fill();            // the crescent of light
  g.beginPath(); g.ellipse(x - rx * 0.22, y - ry * 0.4, rx * 0.4, ry * 0.3, -0.35, 0, 7); g.fillStyle = t.light; g.fill();
  if (o.spots) for (let i = 0; i < o.spots; i++) { const a = rr() * Math.PI, d = 0.2 + rr() * 0.7, sx = x + Math.cos(a) * rx * d * 0.95, sy = y - Math.sin(a) * ry * d * 0.9, sr = rx * (0.07 + rr() * 0.07); g.beginPath(); g.ellipse(sx, sy, sr, sr * (0.5 + 0.5 * Math.abs(Math.sin(a))), 0, 0, 7); g.fillStyle = o.spotCol || '#fff3dc'; g.fill(); g.lineWidth = INNER_W; g.strokeStyle = alpha(t.dark, 0.5); g.stroke(); }
  g.fillStyle = t.dark; g.fillRect(x - rx, y + ry * 0.02, rx * 2, ry * 0.3);                                                                   // the rim band
  g.restore(); path(); ink(g);
}
// a cumulus: a serrated top on a flat base, flat white, a hard blue-grey underside shape; no soft edges
function cloud(g, x, y, s, seed) {
  const rr = P.rng(seed), n = 6 + Math.floor(rr() * 4), puffs = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1), lift = Math.sin(t * Math.PI); puffs.push({ x: x + (t - 0.5) * s * 2.2 + (rr() - 0.5) * s * 0.2, y: y - lift * s * 0.6 + (rr() - 0.5) * s * 0.1, r: s * (0.32 + 0.5 * lift) * (0.85 + rr() * 0.3) }); }
  const all = () => { g.beginPath(); for (const p of puffs) { g.moveTo(p.x + p.r, p.y); g.arc(p.x, p.y, p.r, 0, 7); } g.rect(x - s * 1.25, y - s * 0.1, s * 2.5, s * 0.16); };
  all(); g.fillStyle = CLOUD.top; g.fill();
  g.save(); all(); g.clip();                                                      // flat puffs with one flat low shade along the base, its top edge uneven; no line (far things have none)
  g.beginPath(); g.moveTo(x - s * 1.5, y + s); for (let i = 0; i <= 12; i++) { const t = i / 12, px = x - s * 1.4 + t * s * 2.8; g.lineTo(px, y - s * 0.08 - Math.abs(Math.sin(t * 9 + seed)) * s * 0.22); } g.lineTo(x + s * 1.5, y + s); g.closePath(); g.fillStyle = CLOUD.under; g.fill(); g.restore();
}
// the soil: a dark quiet body of clods with deep crevices (lightness about 0.25, half the pixels dark); seamless when wrapped
function clods(g, x0, y0, W, H, seed, t = SOIL, o = {}) {
  // Colin, AD (2026-10-31): big quiet areas, clods of several sizes, less defined going down, a few larger stones far apart
  const rr = P.rng(seed), wrapX = o.wrapX || 0, wrapY = o.wrapY || 0, n = Math.round(W * H / (o.cell || 150)), fade = o.fade === undefined ? 1 : o.fade;
  if (o.base !== false) { g.fillStyle = t.dark; g.fillRect(x0, y0, W, H); }
  const quiet = (x, y) => Math.sin(x / 97 + seed) + Math.sin(y / 61 + seed * 0.7) + Math.sin((x + y) / 140) > 1.1;   // where no clods are drawn
  const one = (cx, cy, rx, ry, s, u) => { const deep = u > 0.55 * fade;   // u: how far down (0 top .. 1 bottom); lower clods lose their light and their edge
    lump(g, cx, cy, rx, ry, s, 8, 0.35); g.fillStyle = deep ? t.deep : t.dark; g.fill(); g.save(); lump(g, cx, cy, rx, ry, s, 8, 0.35); g.clip();
    lump(g, cx - rx * 0.1, cy - ry * 0.35, rx * 0.85, ry * 0.7, s + 1, 7, 0.3); g.fillStyle = deep ? t.dark : t.mid; g.fill();
    if (!deep) { lump(g, cx - rx * 0.3, cy - ry * 0.5, rx * 0.4, ry * 0.3, s + 2, 6, 0.3); g.fillStyle = u < 0.3 ? t.light : t.mid; g.fill(); } g.restore(); };
  for (let i = 0; i < n; i++) { const cx = x0 + rr() * W, cy = y0 + rr() * H, big = rr() < 0.18, rx = big ? 14 + rr() * 16 : 5 + rr() * 9, ry = rx * (0.55 + rr() * 0.25), s = Math.floor(rr() * 1e6); if (quiet(cx, cy) && !big) continue; const d = () => one(cx, cy, rx, ry, s, (cy - y0) / H); (wrapX || wrapY) ? P.wrapped(g, wrapX, wrapY, d) : d(); }
  if (o.stones) for (let i = 0; i < o.stones; i++) { const cx = x0 + (i + 0.5) * W / o.stones + (rr() - 0.5) * W / o.stones * 0.6, cy = y0 + H * (0.2 + rr() * 0.6), rx = 14 + rr() * 16; const d = () => rock(g, cx, cy + rx * 0.5, rx, rx * 0.8, Math.floor(rr() * 1e6), SOILSTONE, { shadow: false }); (wrapX || wrapY) ? P.wrapped(g, wrapX, wrapY, d) : d(); }
}
// a meadow from above: a mid base, hard patches of light and dark, dense short blades, clover, tufts, flowers; seamless when wrapped
function meadow(g, x0, y0, W, H, seed, t = LEAF, o = {}) {
  const rr = P.rng(seed), wrapX = o.wrapX || 0, wrapY = o.wrapY || 0, W_ = (fn) => (wrapX || wrapY) ? P.wrapped(g, wrapX, wrapY, fn) : fn();
  if (o.base !== false) { g.fillStyle = t.mid; g.fillRect(x0, y0, W, H); }
  for (let i = 0; i < W * H / 1400; i++) { const cx = x0 + rr() * W, cy = y0 + rr() * H, r = 18 + rr() * 34, col = i % 3 === 0 ? t.light : i % 3 === 1 ? t.dark : LEAF_YELLOW.mid, s = Math.floor(rr() * 1e6); W_(() => { lump(g, cx, cy, r, r * 0.6, s, 9, 0.5); g.fillStyle = col; g.fill(); }); }
  const n = Math.round(W * H / (o.cell || 40));
  for (let i = 0; i < n; i++) { const x = x0 + rr() * W, y = y0 + rr() * H, h = 5 + rr() * 9, lean = (rr() - 0.5) * 6, col = [t.dark, t.mid, t.light, t.hi, t.deep][Math.floor(rr() * 5)]; W_(() => { bladePath(g, x, y, h, 2.5, lean); g.fillStyle = col; g.fill(); }); }
  for (let i = 0; i < W * H / 2800; i++) { const x = x0 + rr() * W, y = y0 + rr() * H, s = 7 + rr() * 8, sd = Math.floor(rr() * 1e6); W_(() => tuft(g, x, y, s, sd, t, 7)); }
  for (let i = 0; i < W * H / 5000; i++) { const x = x0 + rr() * W, y = y0 + rr() * H; W_(() => { for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + (k - 1) * 3, y - (k % 2) * 2.5, 2.6, 0, 7); g.fillStyle = t.deep; g.fill(); } }); }
  if (o.flowers) for (let i = 0; i < o.flowers; i++) { const x = x0 + rr() * W, y = y0 + rr() * H, k = Math.floor(rr() * 3); W_(() => { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fillStyle = ['#ffd84a', '#ff9fbb', '#fff4e4'][k]; g.fill(); g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fillStyle = '#b8601a'; g.fill(); }); }
}
module.exports = { INK, INK_W, INNER_W, LEAF, LEAF_YELLOW, LEAF_DARK, LIP, SOIL, SOILSTONE, BARK, STONE, WOOD, SAND, HAY, CLOUD, ink, steps, hazed, scallop, lump, bladePath, leafPath, outline, crown, trunk, tuft, grass, flower, rock, pole, dome, cloud, clods, meadow };
