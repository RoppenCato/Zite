// chrome.js: the game's chrome drawn plainly for judging pictures (Perry, AD, 2026-10-31): the HUD, the title pill, the
// Roll button, the fight panel, at the game's layout (docs/state/client.md), so a picture reads as the phone screen and
// the art is judged by what the panel leaves visible. The chrome itself is the game's; this is a stand-in. Draw on a 2x
// canvas: each function scales by 2 itself.
const P = require('./paint.js');
function hud(g, title, gold = 120) {
  g.save(); g.scale(2, 2); g.fillStyle = 'rgba(248,236,198,0.95)'; g.beginPath(); P.rr(g, 14, 14, 384, 62, 14); g.fill(); P.ink(g, 3);
  P.label(g, 'Robin  Lv 4', 70, 36, 16, P.INK); g.fillStyle = '#fff'; g.beginPath(); P.rr(g, 70, 48, 150, 12, 6); g.fill(); P.ink(g, 1.5); g.fillStyle = '#6ed34a'; g.beginPath(); P.rr(g, 72, 50, 110, 8, 4); g.fill();
  g.beginPath(); g.arc(300, 44, 8, 0, 7); g.fillStyle = '#ffcc33'; g.fill(); P.ink(g, 1.5); P.label(g, String(gold), 316, 44, 16, P.INK);   // the coin before the number, so no digit is covered
  g.fillStyle = 'rgba(248,236,198,0.92)'; g.beginPath(); P.rr(g, 120, 90, 172, 28, 14); g.fill(); P.ink(g, 2.5); P.label(g, title, 206, 104, 15, P.INK, { align: 'center' }); g.restore();
}
function roll(g) { g.save(); g.scale(2, 2); g.beginPath(); g.arc(206, 850, 44, 0, 7); g.fillStyle = P.rad(g, 192, 834, 206, 850, 44, [[0, '#ffe680'], [0.6, '#ffcc33'], [1, '#d99a12']]); g.fill(); P.ink(g, 3.5); P.label(g, 'ROLL', 206, 852, 22, P.INK, { align: 'center' }); g.restore(); }
function fightUi(g) {
  g.save(); g.scale(2, 2); g.fillStyle = 'rgba(248,236,198,0.95)'; g.beginPath(); P.rr(g, 14, 696, 384, 190, 16); g.fill(); P.ink(g, 3);
  [['ATTACK', 24, 710, '#e8503e'], ['SKILL', 210, 710, '#3f7fd8'], ['ITEM', 24, 800, '#6ab85a'], ['DEFEND', 210, 800, '#8a8f98']].forEach(([t, x, y, c]) => { g.beginPath(); P.rr(g, x, y, 178, 76, 14); g.fillStyle = c; g.fill(); P.ink(g, 3); P.label(g, t, x + 89, y + 40, 20, '#fff', { align: 'center', stroke: P.INK, strokeW: 5 }); });
  g.restore();
}
module.exports = { hud, roll, fightUi };
