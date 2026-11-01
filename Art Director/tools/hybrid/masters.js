// masters.js: the RASTER components of the hybrid hero (Mitch, AD, 2026-11-01): the pieces that go through approach 3's
// path. In the real thing these are cut from an illustrator's master; here they are stand-ins painted once, at 8 px per
// figure unit, in a more painted hand than the rig's procedural parts (gradients, metal sheen, rivets, cloth folds) so the
// test shows whether a painted part and a procedural part match on the same figure. Each master is a PNG with its PIVOT
// at the canvas centre and faces right; the rig places it at a joint and turns it with the limb. masters.json lists them.
//   node tools/hybrid/masters.js [out dir]   -> work/hybrid/masters/*.png + masters.json
const P = require('../paint.js'); const I = require('../ink.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../..', process.argv[2] || 'work/hybrid/masters'); fs.mkdirSync(OUT, { recursive: true });
const PX = 8, INK = '#2a2030';
const list = {};
function master(name, w, h, draw) {   // w, h in units; the pivot at the centre
  const cv = P.createCanvas(w * PX, h * PX), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.translate(w * PX / 2, h * PX / 2); g.scale(PX, PX); draw(g); P.save(cv, path.join(OUT, name + '.png'));
  list[name] = { file: name + '.png', px: PX, pivot: [w * PX / 2, h * PX / 2] };
}
// a painted form: the spline filled by a function (gradients, sheen), then the same tapered ink as the rig's
function painted(g, pts, paint, o = {}) {
  const S = I.spline(pts, true, o.n || 10); g.save(); I.pathOf(g, S); g.clip(); paint(g, S); g.restore();
  if (o.ink !== null) I.ribbon(g, S, o.inkW || 2.4, o.ink || INK, { closed: true, inside: 0.55 });
  return S;
}
const steel = (g, x0, y0, x1, y1, dark = '#6f7f96', mid = '#b9c4d2', light = '#f2f6fa') => { g.fillStyle = P.lin(g, x0, y0, x1, y1, [[0, light], [0.35, mid], [0.75, dark], [1, P.darken(dark, 0.3)]]); g.fillRect(-200, -200, 400, 400); };
const sheen = (g, x, y, rx, ry, rot = -0.6, a = 0.55) => { g.fillStyle = P.alpha('#ffffff', a); g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); g.fill(); };
const rivet = (g, x, y, r = 1.3) => { g.fillStyle = '#4a4e5c'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#e8ecf2'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.5, 0, 7); g.fill(); };
const goldSheen = (g, x0, y0, x1, y1) => { g.fillStyle = P.lin(g, x0, y0, x1, y1, [[0, '#ffe28a'], [0.4, '#f0b93c'], [0.8, '#a8731a'], [1, '#6e4a10']]); g.fillRect(-200, -200, 400, 400); };

// ---------------------------------------------------------------- the helmet: an open-faced cap on a head of radius 22; pivot at the head's centre
master('helmet', 72, 72, g => {
  painted(g, [[23, -8], [23, -14], [15, -24], [1, -28], [-13, -26], [-23, -17], [-26, -6], [-26, 7], [-17, 9], [-14, -1], [-4, -4], [8, -4.5], [17, -5]], (g2) => { steel(g2, -22, -28, 20, 8); sheen(g2, -8, -19, 10, 3.5, -0.5, 0.55); for (const [x, y] of [[-21, -8], [-12, -20], [2, -25], [15, -19], [21, -9]]) rivet(g2, x, y, 1.2); g2.fillStyle = P.alpha('#2a2030', 0.2); g2.beginPath(); g2.ellipse(-2, -1, 24, 3, 0, 0, 7); g2.fill(); }, { inkW: 2.4 });
  painted(g, [[-24, -8], [-10, -5], [6, -5], [16, -6.5], [23, -10], [23, -5], [16, -1.5], [6, 0.5], [-10, 0.5], [-24, -2]], g2 => goldSheen(g2, 0, -8, 0, 1), { inkW: 1.6, n: 8 });   // the brow rim, wrapping the head and dipping at the face's centre line
  painted(g, [[-2, -28], [4, -32], [0, -38], [-10, -42], [-20, -40], [-26, -32], [-20, -26], [-12, -27]], (g2) => { g2.fillStyle = P.lin(g2, -26, -42, 0, -26, [[0, '#ff6a6a'], [0.5, '#d83a3a'], [1, '#8a1e1e']]); g2.fillRect(-200, -200, 400, 400); sheen(g2, -14, -37, 7, 2, -0.4, 0.3); }, { inkW: 2.0 });
});
// ---------------------------------------------------------------- the breastplate: the torso's own outline a little larger; pivot at the torso's centre
master('breastplate', 64, 64, g => {
  painted(g, [[-13, -12], [10, -12.5], [16, -5], [14.5, 4], [15.5, 12.5], [-15.5, 12.5], [-14.5, 4], [-16, -5]], (g2) => { steel(g2, -14, -13, 14, 13); sheen(g2, -6, -5, 4.5, 9, -0.2, 0.4); g2.fillStyle = P.alpha('#2a2030', 0.2); g2.beginPath(); g2.moveTo(4, -10); g2.quadraticCurveTo(7, 0, 5, 11); g2.lineTo(2.5, 11); g2.quadraticCurveTo(4.5, 0, 2, -10); g2.closePath(); g2.fill(); for (const [x, y] of [[-12, -7], [11, -8], [-13, 7], [13, 6]]) rivet(g2, x, y, 1.1); }, { inkW: 2.4 });
  painted(g, [[-13, -13], [10, -13.5], [11, -9], [-13, -8.5]], g2 => goldSheen(g2, 0, -13, 0, -8), { inkW: 1.5 });
  painted(g, [[-15, 12], [15, 12], [14, 18], [-14, 18]], g2 => { steel(g2, -12, 12, 12, 19, '#5c6a80', '#9fabbb', '#dfe6ee'); }, { inkW: 1.8 });
});
// ---------------------------------------------------------------- the pauldron: pivot at the shoulder
master('pauldron', 36, 36, g => {
  painted(g, [[-9.5, 2], [-8, -7], [0, -10.5], [8, -7], [10.5, 2], [7, 7], [-5, 7]], (g2) => { steel(g2, -9, -10, 7, 7); sheen(g2, -3.5, -5, 4, 2, -0.4, 0.5); rivet(g2, 0, -2.5, 1.1); g2.fillStyle = P.alpha('#2a2030', 0.2); g2.beginPath(); g2.ellipse(0, 3.5, 8.5, 1.8, 0, 0, 7); g2.fill(); }, { inkW: 2.2 });
});
// ---------------------------------------------------------------- the gauntlet: pivot at the hand, forward to the right
master('gauntlet', 32, 32, g => {
  painted(g, [[-8, -6], [6, -7], [10, -2], [9, 5], [2, 7], [-7, 6], [-10, 0]], (g2) => { steel(g2, -8, -7, 8, 7); sheen(g2, -3, -3, 3.5, 1.6, -0.3, 0.5); for (const x of [-3, 1, 5]) { g2.strokeStyle = P.alpha('#2a2030', 0.45); g2.lineWidth = 0.9; g2.beginPath(); g2.moveTo(x, 1); g2.lineTo(x + 1, 6.5); g2.stroke(); } }, { inkW: 2.2 });
  painted(g, [[-11, -7], [-6, -8], [-6, 6], [-11, 6]], g2 => goldSheen(g2, -11, -8, -6, 6), { inkW: 1.6 });   // the cuff
});
// ---------------------------------------------------------------- the plate boot: pivot at the sole under the ankle
master('bootPlate', 40, 28, g => {
  painted(g, [[-7, -11], [6, -11], [13, -6], [14, -1], [10, 1], [-7, 1], [-9, -4]], (g2) => { steel(g2, -8, -11, 10, 1, '#5c6a80', '#a9b5c4', '#eef2f7'); sheen(g2, -1, -8, 5, 1.6, -0.1, 0.45); g2.fillStyle = P.alpha('#2a2030', 0.25); g2.fillRect(-9, -2, 24, 3); rivet(g2, 8, -4, 1.1); }, { inkW: 2.3 });
  painted(g, [[-8, -12], [5, -12], [5, -8], [-8, -8]], g2 => goldSheen(g2, 0, -12, 0, -8), { inkW: 1.5 });
});
// ---------------------------------------------------------------- the shield: pivot at the grip; the long axis up
master('shield', 56, 64, g => {
  painted(g, [[-18, -22], [18, -22], [19, -4], [12, 14], [0, 24], [-12, 14], [-19, -4]], (g2) => { goldSheen(g2, -18, -22, 18, 24); }, { inkW: 2.6 });
  painted(g, [[-14, -18], [14, -18], [15, -5], [9, 10], [0, 18], [-9, 10], [-15, -5]], (g2) => { g2.fillStyle = P.lin(g2, -14, -18, 14, 18, [[0, '#6fa6ff'], [0.5, '#3d7de4'], [1, '#22448f']]); g2.fillRect(-200, -200, 400, 400); sheen(g2, -6, -10, 5, 9, -0.3, 0.3); }, { inkW: 1.6 });
  // the emblem: a white star
  const star = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.2 : 7.5; star.push([Math.cos(a) * r, -1 + Math.sin(a) * r, 1]); }
  painted(g, star, g2 => { g2.fillStyle = '#fff4d8'; g2.fillRect(-200, -200, 400, 400); }, { inkW: 1.3, n: 2 });
  for (const [x, y] of [[-16, -19], [16, -19], [-16, -2], [16, -2], [0, 21]]) rivet(g, x, y, 1.2);
});
// ---------------------------------------------------------------- the wizard's hat: pivot at the brim's centre, which sits round the crown of the head
master('hat', 80, 80, g => {
  painted(g, [[-14, -2], [-11, -16], [-7, -30], [-14, -42], [-23, -50, 1], [-10, -44], [0, -32], [8, -18], [14, -2]], (g2) => { g2.fillStyle = P.lin(g2, -16, -46, 16, 0, [[0, '#8a6ff0'], [0.4, '#5a3fc8'], [1, '#2e2272']]); g2.fillRect(-200, -200, 400, 400); sheen(g2, -2, -20, 3, 9, -0.1, 0.25); g2.fillStyle = P.alpha('#1a1040', 0.3); g2.beginPath(); g2.moveTo(-6, -6); g2.quadraticCurveTo(-4, -22, -12, -38); g2.lineTo(-8, -38); g2.quadraticCurveTo(0, -22, 2, -6); g2.closePath(); g2.fill(); }, { inkW: 2.4 });
  painted(g, [[-30, -1], [-24, -6], [0, -8.5], [24, -4], [31, 2], [25, 7.5], [0, 10], [-24, 5.5]], (g2) => { g2.fillStyle = P.lin(g2, 0, -8, 0, 9, [[0, '#7a5fe0'], [0.5, '#4a33b0'], [1, '#2a1e66']]); g2.fillRect(-200, -200, 400, 400); sheen(g2, -10, -3.5, 8, 1.5, 0, 0.3); }, { inkW: 2.4 });
  painted(g, [[-13, -5], [13, -5], [14, -1], [-13, -1]], g2 => goldSheen(g2, 0, -5, 0, -1), { inkW: 1.5 });
  const star = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.7 : 4; star.push([Math.cos(a) * r, -3 + Math.sin(a) * r, 1]); }
  painted(g, star, g2 => { g2.fillStyle = '#fff2b0'; g2.fillRect(-200, -200, 400, 400); }, { inkW: 1.1, n: 2 });
});
// ---------------------------------------------------------------- the staff: pivot at the grip; the crystal up (negative y)
master('staff', 36, 120, g => {
  painted(g, [[-2.6, 42], [2.6, 42], [2.2, -38], [-2.2, -38]], (g2) => { g2.fillStyle = P.lin(g2, -3, 0, 3, 0, [[0, '#d9a86a'], [0.4, '#a3703a'], [1, '#5c3a1c']]); g2.fillRect(-200, -200, 400, 400); for (let y = -30; y < 40; y += 9) { g2.fillStyle = P.alpha('#3a2410', 0.35); g2.fillRect(-2.6, y, 5.2, 0.9); } }, { inkW: 2.0, n: 4 });
  // the claw and the crystal
  painted(g, [[-6, -36], [-4, -48], [0, -40], [4, -48], [6, -36], [0, -32]], g2 => goldSheen(g2, -6, -48, 6, -32), { inkW: 1.8 });
  painted(g, [[0, -58], [5, -48], [3, -40], [-3, -40], [-5, -48]], (g2) => { g2.fillStyle = P.lin(g2, -5, -58, 5, -40, [[0, '#dcf6ff'], [0.4, '#6fd8ff'], [1, '#1f7fd0']]); g2.fillRect(-200, -200, 400, 400); sheen(g2, -1.5, -52, 1.2, 3.5, 0.2, 0.7); }, { inkW: 1.6 });
});
fs.writeFileSync(path.join(OUT, 'masters.json'), JSON.stringify(list, null, 1)); console.log('wrote', Object.keys(list).length, 'masters into', OUT);
