// art.js: the studio's runner for a monster or a character (Perry, AD, 2026-10-31; after the Survival game's): the builder
// copied into work/<name>/, built, rendered, packed, looked at, compared beside our player on its area's ground, moved, and
// delivered into out/<name>/. Never writes into the game's folder.
//
//   node tools/art.js <name> copy       work/<name>/build (the builder, toon.py, render.py), before/ (the game's current sprite, if any), NOTES.md
//   node tools/art.js <name> build      the builder -> work/<name>/source/<blend>
//   node tools/art.js <name> render     render.py -> work/<name>/render (--quick: stand and hit1 only; --actions a,b; --keep)
//   node tools/art.js <name> pack       tools/pack.js -> work/<name>/sheets/<name>.png + .json (the atlas with the frame data)
//   node tools/art.js <name> sheet      tools/sheet.js -> work/<name>/sheet.png (every frame)
//   node tools/art.js <name> compare    tools/compare.js -> work/<name>/compare.png (beside our player on the area's fight ground; key poses)
//   node tools/art.js <name> gif        tools/anim_gif.js -> work/<name>/<name>.gif (every action at its real delays)
//   node tools/art.js <name> scene      the area's two screens laid again with this monster in them (work/<area>/fight.png, board.png)
//   node tools/art.js <name> deliver    out/<name>/: build/*.py, the atlas and its json, frames/, sheet.png, compare.png, the gif, NOTES.md
//   node tools/art.js <name> all        build, render, pack, sheet, scene, compare, gif
//
// <name> is a key of tools/recipes.json. The builders import toon.py from their own folder, so work/<name>/build/ holds the
// copies that are edited; deliver copies them into out/<name>/build/ and back into tools/build/ (the studio's source).
const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process'); const B = require('./blender.js');
const GAME = 'C:/dev/Zite/Game Developer', ROOT = path.resolve(__dirname, '..');
const [name, cmd, ...rest] = process.argv.slice(2);
const R = JSON.parse(fs.readFileSync(path.join(__dirname, 'recipes.json'), 'utf8'));
if (!name || !cmd || !R[name]) { console.log('usage: node tools/art.js <' + Object.keys(R).filter(k => k[0] !== '_').join('|') + '> copy|build|render|pack|sheet|compare|gif|scene|deliver|all [--quick] [--actions a,b] [--keep]'); process.exit(1); }
const rec = R[name], W = path.join(ROOT, 'work', name), OUT = path.join(ROOT, 'out', name), AREA = path.join(ROOT, 'work', rec.area || 'meadow');
const opt = k => { const i = rest.indexOf('--' + k); return i >= 0 ? (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true) : null; };
const cpdir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? cpdir(s, d) : fs.copyFileSync(s, d); } };
const node = (args, cwd) => { const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: cwd || ROOT }); if (r.status) process.exit(r.status); };
const need = (p, what) => { if (!fs.existsSync(p)) { console.error('missing ' + what + ': ' + p); process.exit(1); } };
const atlas = () => path.join(W, 'sheets', name + '.json');
function copy() {
  const bd = path.join(W, 'build'); fs.mkdirSync(bd, { recursive: true });
  for (const f of [rec.builder, 'toon.py', 'render.py']) { const s = path.join(__dirname, 'build', f); need(s, 'the studio\'s script'); fs.copyFileSync(s, path.join(bd, f)); }
  const before = [path.join(GAME, 'client', 'public', 'assets', name), path.join(GAME, 'assets', name)].find(p => fs.existsSync(p));
  if (before) cpdir(before, path.join(W, 'before')); else console.log('(the game has no sprite for ' + name + ' yet: no before/)');
  const notes = path.join(W, 'NOTES.md');
  if (!fs.existsSync(notes)) fs.writeFileSync(notes, `# ${name}\n\nStarted ${new Date().toISOString().slice(0, 10)}.\n\n## The design\n\n\n## The check (docs/direction.md section 9), answered\n\n1. One silhouette at a quarter size, facing clear: \n2. Painted, outlined, hard edges: \n3. Cute and chunky, in its band's proportions: \n4. Lit from above: \n5. In its area's palette and idea: \n6. Belongs beside our player on its background: \n7. Data complete: \n8. Would sit in Maps/Places, and nothing of theirs: \n\n## Drop-in steps\n\n\n## For Robin to decide\n\n`);
  console.log('copied into ' + W + ': build/ (' + rec.builder + ', toon.py, render.py), ' + (before ? 'before/, ' : '') + 'NOTES.md');
}
function build() { const s = path.join(W, 'build', rec.builder); need(s, 'the builder (run copy first)'); const code = B.run(s, [path.join(W, 'source', rec.blend)], W); if (code) process.exit(code); need(path.join(W, 'source', rec.blend), 'the built model'); }
function render() {
  const blend = path.join(W, 'source', rec.blend); need(blend, 'the model (run build first)');
  const args = rec.render.split(/\s+/); const acts = opt('quick') ? 'stand,hit1' : opt('actions'); if (acts && acts !== true) args.push('--actions', acts);
  const out = path.join(W, 'render'); if (!opt('keep') && fs.existsSync(out)) fs.rmSync(out, { recursive: true });
  const code = B.run(path.join(W, 'build', 'render.py'), [blend, out, ...args, ...(opt('keep') ? ['--keep', '1'] : [])], W); if (code) process.exit(code);
}
function pack() { need(path.join(W, 'render', 'meta.json'), 'a render (run render first)'); node([path.join(__dirname, 'pack.js'), name, path.join(W, 'render'), path.join(W, 'sheets')]); }
function sheet() { need(path.join(W, 'render', 'meta.json'), 'a render'); node([path.join(__dirname, 'sheet.js'), path.join(W, 'render'), path.join(W, 'sheet.png')]); }
function scene() { need(atlas(), 'packed sheets (run pack first)'); node([path.join(__dirname, rec.area + '_scene.js'), '--monster', atlas(), '--frame', 'stand_00']); }
function compare() { need(atlas(), 'packed sheets (run pack first)'); const before = fs.existsSync(path.join(W, 'before', name + '.json')) ? ['--before', path.join(W, 'before')] : []; node([path.join(__dirname, 'compare.js'), atlas(), path.join(W, 'compare.png'), '--scene', path.join(AREA, 'fight.png'), '--at', rec.at || '590,1270', ...before]); }
function gif() { need(atlas(), 'packed sheets (run pack first)'); node([path.join(__dirname, 'anim_gif.js'), atlas(), path.join(W, name + '.gif'), '--bg', path.join(AREA, 'fight.png'), '--at', rec.at || '590,1270']); }
function deliver() {
  fs.mkdirSync(path.join(OUT, 'build'), { recursive: true });
  for (const f of fs.readdirSync(path.join(W, 'build')).filter(f => f.endsWith('.py'))) { fs.copyFileSync(path.join(W, 'build', f), path.join(OUT, 'build', f)); fs.copyFileSync(path.join(W, 'build', f), path.join(__dirname, 'build', f)); }
  if (fs.existsSync(path.join(W, 'sheets'))) cpdir(path.join(W, 'sheets'), OUT);
  for (const f of ['compare.png', 'sheet.png', 'NOTES.md', name + '.gif']) if (fs.existsSync(path.join(W, f))) fs.copyFileSync(path.join(W, f), path.join(OUT, f));
  console.log('delivered into ' + OUT + ' (build/, ' + name + '.png, ' + name + '.json, frames/, sheet.png, compare.png, ' + name + '.gif, NOTES.md). The game copies the folder into its assets.');
}
const steps = { copy, build, render, pack, sheet, compare, gif, scene, deliver, all: () => { build(); render(); pack(); sheet(); scene(); compare(); gif(); } };
if (!steps[cmd]) { console.error('unknown command ' + cmd); process.exit(1); }
steps[cmd]();
