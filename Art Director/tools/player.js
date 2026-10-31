// player.js: our player, drawn in code, for scale in every judging picture (Perry, AD, 2026-10-31). The same figure as the
// world-form mock-ups: feet at (x, y), 100 CSS pixels tall at s = 1, the head half the height, facing the camera. It stands
// in for the class characters until they are built; it is never delivered to the game.
const { INK, lin, rad, ink, rr } = require('./paint.js');
function player(g, x, y, s = 1, o = {}) {
  s = s * 100 / 104;                                   // the mock's figure is 104 tall at s = 1; ours is 100
  g.save(); g.translate(x, y); g.scale(s, s);
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
  g.beginPath(); g.arc(0, -62, 5, 0.2, Math.PI - 0.2); ink(g, 2);
  g.restore();
}
module.exports = { player, HEIGHT: 100, WIDTH: 62 };
