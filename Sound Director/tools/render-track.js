#!/usr/bin/env node
// render-track: record a studio track's stems with Sonic Pi's headless recorder, cut the seamless loop, measure, manifest.
//   node tools/render-track.js music/day/meadow-day.rb [--stems full,base,calm,danger] [--quick] [--deliver] [--out DIR] [--audible]
// Renders are silent (the engine's outputs are off, see tools/record.rb --silent) unless --audible is given.
// The track's header comments carry the metadata:
//   # name: meadow-day      # bpm: 118      # bars: 40      # beats: 4      # stems: full base calm danger
// The track has the lines `STEM = :full` and `PASSES = 1`; the renderer rewrites them per stem (PASSES 2 for a loop cut).
// A loop render records two passes (2L + lead + tail seconds, real time), finds the marker click at the start of pass one
// and cuts pass two out, so the tails of the last bar lie under the first. --quick records one pass and cuts from the onset
// (not seamless; for listening and levels). Output: work/<name>/<stem>.wav (+ _raw.wav), manifest.json; --deliver copies
// to out/music/<name>/.
'use strict';
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const RUBY = 'C:/Program Files/Sonic Pi/app/server/native/ruby/bin/ruby.exe';
const REC = path.join(__dirname, 'record.rb');   // the studio's recorder (Sonic Pi's headless-record.rb writes nothing: see record.rb)
const WAVTOOL = path.join(__dirname, 'wavtool.js');
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2), file = args.find(x => !x.startsWith('--'));
if (!file) { console.error('usage: node tools/render-track.js FILE.rb [--stems a,b] [--quick] [--deliver] [--out DIR]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
const src = fs.readFileSync(file, 'utf8');
const meta = (k, d) => { const m = src.match(new RegExp('^#\\s*' + k + ':\\s*(.+)$', 'm')); return m ? m[1].trim() : d; };
const name = meta('name', path.basename(file, '.rb')), bpm = +meta('bpm', 120), bars = +meta('bars', 32), beats = +meta('beats', 4);
const stems = (opt('stems') || meta('stems', 'full base calm danger')).split(/[ ,]+/).filter(Boolean);
const L = bars * beats * 60 / bpm, quick = flag('quick'), lead = 2, tail = 3;
const outDir = opt('out', path.join(ROOT, 'work', name)); fs.mkdirSync(outDir, { recursive: true });
if (!/^STEM = :/m.test(src) || !/^PASSES = /m.test(src)) { console.error('the track needs the lines "STEM = :full" and "PASSES = 1"'); process.exit(1); }

console.log(`${name}: ${bpm} bpm, ${bars} bars of ${beats} = ${L.toFixed(3)} s a loop; stems ${stems.join(', ')}${quick ? ' (quick)' : ''}`);
const manifest = { name, bpm, bars, beats, loop_seconds: L, sample_rate: null, loop_frames: null, rendered: new Date().toISOString(), seamless: !quick, stems: {} };
const gains = { base: { peace: 1, danger: 1 }, calm: { peace: 1, danger: 0.15 }, danger: { peace: 0, danger: 1 }, full: { peace: 1, danger: 1 },
  bed: { peace: 1, danger: 1 }, tune: { peace: 1, danger: 0.15 } };   // bed/tune: the ambient tracks' always/peace stems
const run = (cmd, a) => { const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 30 }); if (r.stdout) process.stdout.write(r.stdout); if (r.stderr) process.stderr.write(r.stderr); return r.status; };

for (const stem of stems) {
  const code = src.replace(/^STEM = :\w+/m, `STEM = :${stem}`).replace(/^PASSES = \d+/m, `PASSES = ${quick ? 1 : 2}`);
  const tmp = path.join(outDir, `_${stem}.rb`), raw = path.join(outDir, `${stem}_raw.wav`), wav = path.join(outDir, `${stem}.wav`);
  fs.writeFileSync(tmp, code);
  const dur = (quick ? L : 2 * L) + lead + tail;
  console.log(`\n== ${stem}: recording ${dur.toFixed(1)} s ...`);
  // the engine needs a moment to give the audio device back between two boots; a failed boot is tried once more
  let st = -1;
  for (let attempt = 1; attempt <= 2 && !(st === 0 && fs.existsSync(raw)); attempt++) {
    if (attempt > 1) console.log('  the engine did not come up; trying once more in 8 s');
    spawnSync('node', ['-e', 'setTimeout(()=>{}, ' + (attempt > 1 ? 8000 : 4000) + ')']);
    st = run(RUBY, ['-E', 'utf-8', REC, '-o', raw, '-d', String(dur), '-f', tmp, ...(flag('audible') ? [] : ['--silent'])]);
  }
  if (st !== 0 || !fs.existsSync(raw)) { console.error(`recording ${stem} failed (exit ${st})`); process.exit(2); }
  if (quick) {
    const on = spawnSync('node', [WAVTOOL, 'onset', raw, '-40'], { encoding: 'utf8' }).stdout.trim().split(' ')[1];
    run('node', [WAVTOOL, 'cut', raw, wav, on, String(L)]);
  } else if (run('node', [WAVTOOL, 'loopcut', raw, wav, String(L), '-40']) !== 0) process.exit(3);
  const info = spawnSync('node', [WAVTOOL, 'info', wav], { encoding: 'utf8' }).stdout;
  const peak = +(info.match(/peak (-?[\d.]+|-inf)/) || [])[1], rms = +(info.match(/rms (-?[\d.]+|-inf)/) || [])[1], sr = +(info.match(/(\d+) Hz/) || [])[1], frames = +(info.match(/(\d+) frames/) || [])[1];
  manifest.sample_rate = sr; manifest.loop_frames = frames;
  manifest.stems[stem] = { file: `${stem}.wav`, peak_dbfs: peak, rms_dbfs: rms, gain_peace: gains[stem] ? gains[stem].peace : 1, gain_danger: gains[stem] ? gains[stem].danger : 1 };
  if (stem === 'full') { console.log('  loudness by bar (RMS dBFS):'); run('node', [WAVTOOL, 'bars', wav, String(bpm), String(bars), String(beats)]); }
}
const parts = ['base', 'calm', 'danger', 'bed', 'tune'].filter(s => stems.includes(s));
if (stems.includes('full') && parts.length === 3) {
  // the stems summed should match the mix in peak and RMS (within about 1 dB). A sample-by-sample difference says
  // nothing here: every render starts its oscillators and reverbs at other phases, so even two renders of the same
  // code differ sample for sample while sounding the same.
  const sum = path.join(outDir, '_sum.wav');
  process.stdout.write('  the stems summed:  '); run('node', [WAVTOOL, 'sum', sum, ...parts.map(s => path.join(outDir, s + '.wav'))]);
  const f = manifest.stems.full; console.log(`  the mix itself:    peak ${f.peak_dbfs} dBFS, rms ${f.rms_dbfs} dBFS`);
}
// the seam: the loop end and start carry the same tails (both passes are seeded alike) but not the same sample values,
// so a step of about 1 %FS (-40 dBFS) is normal and sits under the attack on beat one; above 2 %FS look for a part that
// sounds at the very end of the last bar.
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nmanifest ${path.join(outDir, 'manifest.json')}`);
if (flag('deliver')) {
  const dst = path.join(ROOT, 'out', 'music', name); fs.mkdirSync(dst, { recursive: true });
  for (const s of stems) fs.copyFileSync(path.join(outDir, s + '.wav'), path.join(dst, s + '.wav'));
  fs.copyFileSync(path.join(outDir, 'manifest.json'), path.join(dst, 'manifest.json'));
  fs.copyFileSync(file, path.join(dst, path.basename(file)));
  console.log(`delivered to ${dst}`);
}
