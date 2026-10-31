// deliver_area.js: an area's kit from work/ into out/ (Perry, AD, 2026-10-31): the kit's folders and kit.json (not the
// seam checks), the two laid screens, the parallax preview and NOTES.md.
//   node tools/deliver_area.js meadow
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const area = process.argv[2]; if (!area) { console.log('usage: node tools/deliver_area.js <area>'); process.exit(1); }
const W = path.join(ROOT, 'work', area), OUT = path.join(ROOT, 'out', area);
const cpdir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { if (f.startsWith('_')) continue; const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? cpdir(s, d) : fs.copyFileSync(s, d); } };
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
cpdir(path.join(W, 'kit'), OUT);
for (const f of ['board.png', 'fight.png', 'NOTES.md', 'fight-layers.tsv']) if (fs.existsSync(path.join(W, f))) fs.copyFileSync(path.join(W, f), path.join(OUT, f));
if (fs.existsSync(path.join(W, 'preview'))) cpdir(path.join(W, 'preview'), path.join(OUT, 'preview'));
let n = 0; const count = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? count(p) : n++; } }; count(OUT);
console.log('delivered', area, 'into', OUT, '(' + n + ' files). The game copies the folder whole into its assets.');
