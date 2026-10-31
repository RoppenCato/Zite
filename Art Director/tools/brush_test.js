// brush_test.js: the brushes on one board, to judge them against the reference's pieces before any kit is repainted.
//   node tools/brush_test.js work/_test/brushes.png
const P = require('./paint.js'); const B = require('./brush.js');
const out = process.argv[2] || 'work/_test/brushes.png';
const cv = P.createCanvas(1500, 900), g = cv.getContext('2d'); g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, cv.width, cv.height);
// a tree: trunk and a canopy of clumps
B.trunk(g, 160, 420, 180, 44, 1); B.mass(g, 160, 230, 140, 100, 2, B.LEAF, { n: 9, r: 52 });
// a bush and a yellow bush
B.mass(g, 420, 400, 110, 55, 3, B.LEAF_DARK, { n: 6, r: 40 }); B.mass(g, 640, 400, 80, 45, 4, B.LEAF_YELLOW, { n: 5, r: 34 });
// tufts and flowers
for (let i = 0; i < 4; i++) B.tuft(g, 780 + i * 50, 420, 26 + i * 4, 10 + i);
B.flower(g, 1000, 420, 60, 20, 0); B.flower(g, 1060, 420, 50, 21, 1); B.flower(g, 1110, 420, 44, 22, 2);
// rocks, a pole, a dome
B.rock(g, 1250, 420, 70, 60, 30, B.STONE, { moss: true }); B.rock(g, 1380, 420, 40, 36, 31);
B.pole(g, 1250, 220, 160, 22, 40); B.pole(g, 1330, 140, 150, 18, 41, false);
B.dome(g, 1100, 200, 120, 70, '#e8503e', 50, { spots: 6 });
// the soil tile and the grass band, tiled twice to show the seam
const soil = P.createCanvas(276, 184), sg = soil.getContext('2d'); B.clods(sg, 0, 0, 276, 184, 60, B.SOIL, { wrapX: 276, wrapY: 184, stones: 3 });
g.drawImage(soil, 20, 480); g.drawImage(soil, 296, 480); g.drawImage(soil, 20, 664); g.drawImage(soil, 296, 664);
const band = P.createCanvas(276, 96), bg = band.getContext('2d'); bg.fillStyle = B.SOIL.dark; bg.fillRect(0, 60, 276, 36); B.grass(bg, 0, 276, 48, 70, 46, 61, B.LEAF, 0.5, 276);
g.drawImage(band, 600, 480); g.drawImage(band, 876, 480);
// the meadow plate, tiled
const plate = P.createCanvas(256, 256), pg = plate.getContext('2d'); B.meadow(pg, 0, 0, 256, 256, 70, B.LEAF, { wrapX: 256, wrapY: 256, flowers: 8 });
g.drawImage(plate, 600, 600); g.drawImage(plate, 856, 600);
// clouds on sky
g.fillStyle = '#4a9ee8'; g.fillRect(1130, 480, 350, 400); B.cloud(g, 1300, 600, 70, 80); B.cloud(g, 1230, 760, 45, 81);
P.save(cv, out); console.log('wrote', out);
