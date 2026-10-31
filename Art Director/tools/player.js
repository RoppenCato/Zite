// player.js: our player, for scale in every judging picture (Perry, AD, 2026-10-31). The built Warrior's atlas when it
// exists (out/warrior, else work/warrior/sheets), drawn by its origin at the feet; before that the mock-ups' code-drawn
// figure (Robin, 2026-10-31: it looked awful; it stays only as the fallback). Call `await load()` once, then player() is
// synchronous: feet at (x, y), s the scale (1 is 100 CSS px tall when drawn on a canvas in CSS units; the atlas is at 2x).
//   const { player, load } = require('./player.js'); await load(); player(g, x, y, 1, { frame: 'stand_00', flip: false });
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const { INK, lin, rad, ink, rr } = P; const ROOT = path.resolve(__dirname, '..');
let atlas = null;
async function load(file) {   // file: an atlas json to use instead of the studio's current Warrior
  for (const j of (file ? [path.resolve(ROOT, file)] : [path.join(ROOT, 'out', 'warrior', 'warrior.json'), path.join(ROOT, 'work', 'warrior', 'sheets', 'warrior.json')])) {
    const dir = path.dirname(j); if (!fs.existsSync(j)) continue;
    const J = JSON.parse(fs.readFileSync(j, 'utf8')); const im = await P.loadImage(path.join(dir, J.meta.image)); atlas = { J, im, dir }; return atlas;
  }
  return null;
}
function fallback(g, x, y, s, o) {
  s = s * 100 / 104; g.save(); g.translate(x, y); g.scale(s, s);
  if (o.shadow !== false) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 2, 22, 6, 0, 0, 7); g.fill(); }
  g.beginPath(); rr(g, -12, -18, 10, 18, 3); rr(g, 2, -18, 10, 18, 3); g.fillStyle = '#3a2d2a'; g.fill(); ink(g, 2.5);
  g.beginPath(); rr(g, -13, -50, 26, 34, 8); g.fillStyle = lin(g, -13, 0, 13, 0, [[0, '#2f5fb8'], [0.5, '#5590e6'], [1, '#2a4f9a']]); g.fill(); ink(g, 2.5);
  g.fillStyle = '#8a5a35'; g.fillRect(-13, -24, 26, 5);
  g.beginPath(); rr(g, 16, -66, 6, 42, 2); g.fillStyle = lin(g, 16, 0, 22, 0, [[0, '#f4f7fa'], [1, '#aeb9c6']]); g.fill(); ink(g, 2);
  g.beginPath(); g.arc(0, -76, 25, 0, 7); g.fillStyle = rad(g, -8, -86, 0, -76, 25, [[0, '#ffe8cc'], [1, '#e8b68c']]); g.fill(); ink(g, 2.5);
  g.beginPath(); g.moveTo(-26, -80); g.quadraticCurveTo(-20, -112, 0, -106); g.quadraticCurveTo(22, -112, 26, -80); g.lineTo(20, -88); g.lineTo(12, -82); g.lineTo(4, -90); g.lineTo(-4, -82); g.lineTo(-12, -90); g.lineTo(-20, -84); g.closePath();
  g.fillStyle = rad(g, -6, -102, 0, -94, 30, [[0, '#ff9a66'], [1, '#c23f2a']]); g.fill(); ink(g, 2.5);
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-9, -72, 5, 7, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(9, -72, 5, 7, 0, 0, 7); g.fill();
  g.fillStyle = INK; g.beginPath(); g.ellipse(-8, -71, 3, 5, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(10, -71, 3, 5, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(0, -62, 5, 0.2, Math.PI - 0.2); ink(g, 2); g.restore();
}
function player(g, x, y, s = 1, o = {}) {
  if (!atlas) return fallback(g, x, y, s, o);
  const name = o.frame || atlas.J.actions.stand.frames[0].name, fr = atlas.J.frames[name].frame, data = Object.values(atlas.J.actions).flatMap(A => A.frames).find(f => f.name === name);
  g.save(); g.translate(x, y); g.scale((o.flip ? -1 : 1) * s / 2, s / 2);     // the atlas is at 2x; s = 1 draws it at 1x CSS
  if (o.shadow !== false) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 4, 48, 12, 0, 0, 7); g.fill(); }
  g.drawImage(atlas.im, fr.x, fr.y, fr.w, fr.h, -data.origin.x, -data.origin.y, fr.w, fr.h); g.restore();
}
module.exports = { player, load, HEIGHT: 100, WIDTH: 62 };
