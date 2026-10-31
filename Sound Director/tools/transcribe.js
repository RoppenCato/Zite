#!/usr/bin/env node
// transcribe: audio (mp3/wav/ogg) -> notes, with Spotify's Basic Pitch model running in TensorFlow.js on the CPU.
//   node tools/transcribe.js "Inspiration/06 Ellinia.mp3" [--out work/study/<slug>] [--onset 0.5] [--frame 0.3] [--minlen 11]
// Writes <out>/notes.json ([{t, d, n, v}] in seconds and midi) and <out>/<slug>.mid (a standard MIDI file for a DAW).
// The model hears pitches, not instruments: every voice lands in one list. tools/study.js then pulls the structure out.
'use strict';
const fs = require('fs'), path = require('path');

const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--'));
if (!file) { console.error('usage: node tools/transcribe.js AUDIO [--out DIR] [--onset 0.5] [--frame 0.3] [--minlen 11]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const slug = path.basename(file).replace(/\.[^.]+$/, '').replace(/^\d+\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const outDir = opt('out', path.join(__dirname, '..', 'work', 'study', slug)); fs.mkdirSync(outDir, { recursive: true });
const MODEL = path.join(__dirname, '..', 'node_modules', '@spotify', 'basic-pitch', 'model');

if (args.includes('--midi-only')) {       // rebuild the .mid from an existing notes.json
  const d = JSON.parse(fs.readFileSync(path.join(outDir, 'notes.json'), 'utf8')); fs.writeFileSync(path.join(outDir, slug + '.mid'), writeMidi(d.notes)); console.log('wrote ' + path.join(outDir, slug + '.mid')); process.exit(0);
}

const tf = require('@tensorflow/tfjs');
const bp = require('@spotify/basic-pitch');
const wa = require('node-web-audio-api');

function loadModel() {                      // tfjs without tfjs-node has no file loader: hand it the json and the weights
  return tf.loadGraphModel({ load: async () => {
    const json = JSON.parse(fs.readFileSync(path.join(MODEL, 'model.json'), 'utf8'));
    const specs = [], bufs = [];
    for (const g of json.weightsManifest) { specs.push(...g.weights); for (const p of g.paths) bufs.push(fs.readFileSync(path.join(MODEL, p))); }
    const b = Buffer.concat(bufs);
    return { modelTopology: json.modelTopology, weightSpecs: specs, weightData: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), format: json.format, generatedBy: json.generatedBy, convertedBy: json.convertedBy };
  } });
}

// a standard MIDI file, format 0, 480 ticks a beat at 120 bpm (so a tick is 1/960 s), one note-on and note-off per note
function writeMidi(notes) {
  const vlq = (n) => { const b = [n & 0x7f]; n >>= 7; while (n > 0) { b.unshift((n & 0x7f) | 0x80); n >>= 7; } return b; };
  const ev = [];
  for (const n of notes) { const on = Math.round(n.t * 960), off = Math.max(on + 1, Math.round((n.t + n.d) * 960)), v = Math.max(1, Math.min(127, Math.round(n.v * 127)));
    ev.push([on, [0x90, n.n, v]]); ev.push([off, [0x80, n.n, 0]]); }
  ev.sort((a, b) => a[0] - b[0]);
  let bytes = [0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20, 0, 0xc0, 0], last = 0;
  for (const [t, b] of ev) { bytes = bytes.concat(vlq(t - last), b); last = t; }
  bytes = bytes.concat([0, 0xff, 0x2f, 0]);
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  return Buffer.from([].concat([77, 84, 104, 100], u32(6), [0, 0, 0, 1, 1, 224], [77, 84, 114, 107], u32(bytes.length), bytes));
}

(async () => {
  const t0 = Date.now();
  const raw = fs.readFileSync(file), ctx = new wa.OfflineAudioContext(1, 1, 44100);
  const buf = await ctx.decodeAudioData(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  console.log(`${file}: ${buf.duration.toFixed(1)} s, ${buf.sampleRate} Hz, ${buf.numberOfChannels} ch`);
  // to mono at 22050 Hz through an offline context, so the resampling is a real one
  const sr = 22050, off = new wa.OfflineAudioContext(1, Math.ceil(buf.duration * sr), sr), src = off.createBufferSource();
  src.buffer = buf; src.connect(off.destination); src.start(0);
  const mono = (await off.startRendering()).getChannelData(0);
  const model = new bp.BasicPitch(loadModel());
  const frames = [], onsets = [], contours = []; let last = -1;
  await model.evaluateModel(mono, (f, o, c) => { frames.push(...f); onsets.push(...o); contours.push(...c); }, (p) => { const q = Math.floor(p * 10); if (q !== last) { last = q; process.stdout.write(`  ${q * 10}%\r`); } });
  const events = bp.outputToNotesPoly(frames, onsets, +opt('onset', 0.5), +opt('frame', 0.3), +opt('minlen', 11));
  const notes = bp.noteFramesToTime(events).map(n => ({ t: +n.startTimeSeconds.toFixed(4), d: +n.durationSeconds.toFixed(4), n: n.pitchMidi, v: +n.amplitude.toFixed(3) })).sort((a, b) => a.t - b.t || a.n - b.n);
  fs.writeFileSync(path.join(outDir, 'notes.json'), JSON.stringify({ file: path.basename(file), seconds: buf.duration, notes }, null, 0));
  fs.writeFileSync(path.join(outDir, slug + '.mid'), writeMidi(notes));
  const lo = Math.min(...notes.map(n => n.n)), hi = Math.max(...notes.map(n => n.n));
  console.log(`\n${notes.length} notes, midi ${lo}..${hi}, in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${outDir}`);
})().catch(e => { console.error(e); process.exit(1); });
