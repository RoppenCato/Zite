#!/usr/bin/env node
// render-sfx: record a sound-effect source once, split it at the silences into its variations, trim and normalise each.
//   node tools/render-sfx.js sfx/combat/hit_axe.rb [--deliver] [--out DIR]
// Header metadata: `# name: hit_axe`, `# seconds: 6`, `# count: 3`. Output: work/sfx/<category>/<name>_N.wav + manifest.json;
// --deliver copies into out/sfx/<category>/.
'use strict';
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const RUBY = 'C:/Program Files/Sonic Pi/app/server/native/ruby/bin/ruby.exe';
const REC = path.join(__dirname, 'record.rb'), WAVTOOL = path.join(__dirname, 'wavtool.js'), ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), file = args.find(x => !x.startsWith('--'));
if (!file) { console.error('usage: node tools/render-sfx.js FILE.rb [--deliver] [--out DIR]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const src = fs.readFileSync(file, 'utf8');
const meta = (k, d) => { const m = src.match(new RegExp('^#\\s*' + k + ':\\s*(\\S+)', 'm')); return m ? m[1] : d; };
const name = meta('name', path.basename(file, '.rb')), secs = +meta('seconds', 6), count = +meta('count', 3);
const category = path.basename(path.dirname(file));
const outDir = opt('out', path.join(ROOT, 'work', 'sfx', category)); fs.mkdirSync(outDir, { recursive: true });
const raw = path.join(outDir, `${name}_raw.wav`);
const run = (cmd, a) => { const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 30 }); if (r.stderr) process.stderr.write(r.stderr); return r; };
console.log(`${name} (${category}): recording ${secs + 2} s for ${count} variations ...`);
const rec = run(RUBY, ['-E', 'utf-8', REC, '-o', raw, '-d', String(secs + 2), '-f', file, ...(args.includes('--audible') ? [] : ['--silent'])]);
process.stdout.write(rec.stdout.split('\n').filter(l => /ERROR|WROTE|FAILED|LINE/.test(l)).join('\n') + '\n');
if (rec.status !== 0 || !fs.existsSync(raw)) { console.error('recording failed'); process.exit(2); }
const sp = run('node', [WAVTOOL, 'split', raw, path.join(outDir, name), '-50', '0.3', '-60', '-1']);
process.stdout.write(sp.stdout);
const files = fs.readdirSync(outDir).filter(f => new RegExp('^' + name + '_\\d+\\.wav$').test(f)).sort();
if (files.length !== count) console.warn(`expected ${count} variations, found ${files.length}`);
const manifest = { name, category, rendered: new Date().toISOString(), variations: files.map(f => {
  const info = run('node', [WAVTOOL, 'info', path.join(outDir, f)]).stdout;
  return { file: f, seconds: +(info.match(/= ([\d.]+) s/) || [])[1], peak_dbfs: +(info.match(/peak (-?[\d.]+)/) || [])[1] };
}) };
fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(manifest, null, 2));
console.log(`manifest ${path.join(outDir, name + '.json')}`);
if (args.includes('--deliver')) {
  const dst = path.join(ROOT, 'out', 'sfx', category); fs.mkdirSync(dst, { recursive: true });
  for (const f of files) fs.copyFileSync(path.join(outDir, f), path.join(dst, f));
  fs.copyFileSync(path.join(outDir, `${name}.json`), path.join(dst, `${name}.json`));
  fs.copyFileSync(file, path.join(dst, path.basename(file)));
  console.log(`delivered to ${dst}`);
}
