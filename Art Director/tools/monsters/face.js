// face.js: the Knight's eyes for everyone (Mitch, AD, 2026-11-01, after Robin's note that the creatures repeat the hero's first mistake). Same construction as
// headFace in tools/hybrid/rig.js, same numbers: about as wide as tall, the NEAR eye wide on the body's side of the face's centre line, the FAR eye narrow close to
// the silhouette's edge, an iris with a pupil looking the way the creature faces, an upper lid line, a brow. dir -1 faces screen-left (the creatures' files),
// +1 faces screen-right (inside the rig's own flipped space). cl and ey are the centre line and the eye line; s scales it to the head it sits on.
const P = require('../paint.js'); const I = require('../ink.js'); const { line, spline, pathOf, fill } = I;
const INK = '#2a2030', w = 2.4, wi = 1.3;
function eyes(g, cl, ey, s, o = {}) {
  const { mood = 'ok', iris = '#2d8f4e', lid = '#ffffff', brow = INK, dir = -1, col = INK } = o;
  g.save(); g.translate(cl, ey); g.scale(dir * s, s);
  for (const [cx, ew, eh, near] of [[-11, 5.8, 6.4, true], [5.5, 3.6, 6.0, false]]) {
    const lean = near ? 0 : 0.12, wn = near ? 1 : 0.85;
    if (mood === 'hurt' || mood === 'shut') { line(g, [[cx - ew, -eh * 0.1], [cx, eh * 0.45], [cx + ew * 0.95, -eh * 0.2]], w * wn, col, { taper: 0.15, taper2: 0.2 }); if (mood === 'hurt') line(g, near ? [[cx - ew * 1.15, -eh * 1.3], [cx + ew * 1.1, -eh * 1.7]] : [[cx - ew * 1.1, -eh * 1.7], [cx + ew * 1.15, -eh * 1.3]], wi * 1.2, brow === INK ? col : brow, { taper: 0.25, taper2: 0.25 }); continue; }
    if (mood === 'dead') { line(g, [[cx - ew * 0.8, -eh * 0.7], [cx + ew * 0.8, eh * 0.7]], w * 0.8, col, { taper: 0.1 }); line(g, [[cx + ew * 0.8, -eh * 0.7], [cx - ew * 0.8, eh * 0.7]], w * 0.8, col, { taper: 0.1 }); continue; }
    const E = spline([[cx - ew, eh * 0.15], [cx - ew * 0.6, -eh * 0.85], [cx + ew * 0.3, -eh], [cx + ew, -eh * (0.3 + lean)], [cx + ew * 0.8, eh * 0.6], [cx, eh * 0.95], [cx - ew * 0.7, eh * 0.7]]);
    fill(g, E, '#ffffff'); g.save(); pathOf(g, E); g.clip();
    const ix = cx + ew * 0.2, iy = eh * 0.1, ir = eh * 0.64;
    g.fillStyle = iris; g.beginPath(); g.ellipse(ix, iy, ir * (near ? 0.92 : 0.66), ir, 0, 0, 7); g.fill();
    g.fillStyle = INK; g.beginPath(); g.ellipse(ix + ew * 0.05, iy + eh * 0.05, ir * (near ? 0.5 : 0.36), ir * 0.55, 0, 0, 7); g.fill();
    g.fillStyle = P.alpha(INK, 0.22); g.fillRect(cx - ew - 1, -eh - 1, ew * 2 + 2, eh * 0.5);
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix - ir * 0.45, iy - ir * 0.5, ir * 0.22, ir * 0.26, 0, 0, 7); g.fill();
    // the lid comes down over the eye for a mood: slanting to the centre line when angry, flat when smug, in the colour of the skin
    let lidLine = [[cx - ew * 1.05, -eh * 0.05], [cx - ew * 0.5, -eh], [cx + ew * 0.4, -eh * 1.05], [cx + ew, -eh * (0.35 + lean)]];
    if (mood === 'angry') { const a = near ? -eh * 0.86 : -eh * 0.42, b = near ? -eh * 0.42 : -eh * 0.86; g.fillStyle = lid; g.beginPath(); g.moveTo(cx - ew - 1, -eh - 2); g.lineTo(cx + ew + 1, -eh - 2); g.lineTo(cx + ew + 1, b); g.lineTo(cx - ew - 1, a); g.closePath(); g.fill(); lidLine = [[cx - ew * 1.05, a], [cx + ew * 1.05, b]]; }
    if (mood === 'smug') { g.fillStyle = lid; g.fillRect(cx - ew - 1, -eh - 2, ew * 2 + 2, eh * 0.72 + 2); lidLine = [[cx - ew * 1.02, -eh * 0.28], [cx + ew * 1.02, -eh * 0.3]]; }
    g.restore();
    line(g, lidLine, w * wn, INK, { taper: 0.12, taper2: 0.3 });
    line(g, [[cx - ew * 0.5, eh * 0.85], [cx + ew * 0.6, eh * 0.75]], wi * 0.7, INK, { taper: 0.45 });
    if (mood === 'angry') line(g, near ? [[cx - ew * 1.2, -eh * 1.6], [cx + ew * 1.15, -eh * 0.85]] : [[cx - ew * 1.15, -eh * 0.85], [cx + ew * 1.2, -eh * 1.6]], wi * 1.5, brow, { taper: 0.2, taper2: 0.15 });
    else line(g, [[cx - ew * 1.15, -eh * 1.6], [cx + ew * 0.05, -eh * 1.95], [cx + ew * 1.1, -eh * (1.5 + lean)]], wi * 1.15, brow, { taper: 0.25, taper2: 0.25 });
  }
  g.restore();
}
module.exports = { eyes };
