#!/usr/bin/env node
// sfx-level: make a delivered SFX set mono, hold every sound to its length, normalise each file's peak, and level the
// sounds against each other with a suggested gain per sound (2026-10-15, for the combat set).
//   node tools/sfx-level.js out/sfx/combat sfx/combat/_levels.json
// The spec: { "<name>": { "target": dB relative (the hit = 0), "max": seconds, "use": "what the game plays it for" } }.
// Loudness of a file = the loudest 50 ms of it (RMS), the right measure for short strikes. Gains: every sound's played
// loudness (its measured loudness plus its gain) lands on its target; the loudest target gets gain 1.0.
// Writes the WAVs back (16-bit mono), each <name>.json, and <set>.json with every sound, its files, lengths and gain.
'use strict';
const fs = require('fs'), path = require('path');
//   node tools/sfx-level.js out/sfx/combat sfx/combat/_levels.json --only raise,tele
// --only processes just those sounds' files; every other sound keeps its files and its measured loudness from the set's
// JSON, so adding a sound to a set the game already uses changes no existing file and (unless the new one sets a new
// top) no existing gain. The tool says if any existing gain moved.
//   node tools/sfx-level.js out/sfx/combat sfx/combat/_levels.json --only swish_axe,... --weighted --anchor sfx/combat/ref/swing_e.wav:0.21
// --weighted measures loudness as the ear does (2026-10-15, after plain RMS over-counted the low thumps): a high-pass at
// 100 Hz and a +4 dB shelf above 1.5 kHz before the loudest 50 ms, as the game's session levels its free sounds.
// --anchor FILE:GAIN sets each processed sound's gain against a reference the game already plays at GAIN: the sound's
// target is then in dB relative to that reference (0 = as loud as it), and no ladder top is involved.
const args = process.argv.slice(2), valued = new Set(['--only', '--anchor']);
const [dir, specFile] = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
if (!dir || !specFile) { console.error('usage: node tools/sfx-level.js OUT_DIR SPEC.json [--only a,b] [--weighted] [--anchor FILE:GAIN]'); process.exit(1); }
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const WEIGHTED = args.includes('--weighted');
const anchorArg = args.includes('--anchor') ? args[args.indexOf('--anchor') + 1] : null;
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const setName = Object.keys(spec).includes(path.basename(dir)) ? path.basename(dir) + '-set' : path.basename(dir);   // a sound named like its folder keeps its own <name>.json
const setFile = path.join(dir, setName + '.json');
const before = only ? JSON.parse(fs.readFileSync(setFile, 'utf8')).sounds : {};
const PEAK = Math.pow(10, -1 / 20);

function readWav(file) {
  const b = fs.readFileSync(file); let p = 12, fmt, data;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4), body = p + 8;
    if (id === 'fmt ') fmt = { ch: b.readUInt16LE(body + 2), sr: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    else if (id === 'data') data = { off: body, len: Math.min(n, b.length - body) };
    p = body + n + (n & 1);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error(file + ': expected 16-bit PCM');
  const frames = Math.floor(data.len / (2 * fmt.ch)), mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < fmt.ch; c++) s += b.readInt16LE(data.off + (i * fmt.ch + c) * 2) / 32768; mono[i] = s / fmt.ch; }
  return { sr: fmt.sr, x: mono };
}
function writeWav(file, sr, x) {
  const n = x.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}
const db = (v) => 20 * Math.log10(Math.max(v, 1e-9));
function biquad(x, b0, b1, b2, a1, a2) {         // a direct-form-I biquad (coefficients already divided by a0)
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
function weigh(x, sr) {                          // RBJ cookbook: a high-pass at 100 Hz (Q 0.707), a high shelf +4 dB at 1.5 kHz
  let w0 = 2 * Math.PI * 100 / sr, c = Math.cos(w0), al = Math.sin(w0) / (2 * 0.7071), a0 = 1 + al;
  let y = biquad(x, (1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0, -2 * c / a0, (1 - al) / a0);
  const A = Math.pow(10, 4 / 40); w0 = 2 * Math.PI * 1500 / sr; c = Math.cos(w0); al = Math.sin(w0) / 2 * Math.SQRT2; const sq = 2 * Math.sqrt(A) * al;
  const s0 = (A + 1) - (A - 1) * c + sq;
  return biquad(y, A * ((A + 1) + (A - 1) * c + sq) / s0, -2 * A * ((A - 1) + (A + 1) * c) / s0, A * ((A + 1) + (A - 1) * c - sq) / s0,
    2 * ((A - 1) - (A + 1) * c) / s0, ((A + 1) - (A - 1) * c - sq) / s0);
}
function loudest(x, sr) {                       // the loudest 50 ms window's RMS, stepped by 5 ms (weighted with --weighted)
  if (WEIGHTED) x = weigh(x, sr);
  const w = Math.round(sr * 0.05), hop = Math.round(sr * 0.005); let best = 0;
  for (let s = 0; s + w <= Math.max(x.length, w); s += hop) { let e = 0; for (let i = s; i < Math.min(s + w, x.length); i++) e += x[i] * x[i]; best = Math.max(best, e / w); }
  return db(Math.sqrt(best));
}

const out = {}, missing = [];
for (const [name, sp] of Object.entries(spec)) {
  if (only && !only.has(name)) {
    if (!before[name]) { missing.push(name); continue; }
    out[name] = { files: before[name].files, seconds: before[name].seconds, loud_db: before[name].loud_db, target_db: sp.target, use: sp.use };
    continue;
  }
  const files = fs.readdirSync(dir).filter(f => new RegExp('^' + name + '_\\d+\\.wav$').test(f)).sort();
  if (!files.length) { missing.push(name); continue; }
  const lens = [], louds = [];
  let sr = 48000;
  for (const f of files) {
    const w = readWav(path.join(dir, f)); sr = w.sr; let x = w.x;
    const max = Math.round(sp.max * sr);
    if (x.length > max) x = x.slice(0, max);
    const fin = Math.min(Math.round(sr * 0.001), x.length), fout = Math.min(Math.round(sr * (x.length >= max ? 0.03 : 0.008)), x.length);
    for (let i = 0; i < fin; i++) x[i] *= i / fin;                                  // no click in, no click out
    for (let i = 0; i < fout; i++) x[x.length - 1 - i] *= i / fout;
    let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v));
    const g = pk > 0 ? PEAK / pk : 1; for (let i = 0; i < x.length; i++) x[i] *= g;
    writeWav(path.join(dir, f), sr, x);
    lens.push(+(x.length / sr).toFixed(3)); louds.push(loudest(x, sr));
  }
  out[name] = { files, seconds: lens, loud_db: +(louds.reduce((a, b) => a + b, 0) / louds.length).toFixed(1), target_db: sp.target, use: sp.use };
}
if (anchorArg) {                                // gains against a reference the game already plays
  const [af, ag] = [anchorArg.slice(0, anchorArg.lastIndexOf(':')), +anchorArg.slice(anchorArg.lastIndexOf(':') + 1)];
  const aw = readWav(af), La = loudest(aw.x, aw.sr);
  console.log(`anchor ${path.basename(af)} at gain ${ag}: loudness ${La.toFixed(1)} dB${WEIGHTED ? ' (weighted)' : ''}`);
  for (const [name, o] of Object.entries(out)) {
    if (only && !only.has(name)) { o.gain = before[name].gain; continue; }
    o.gain = +Math.min(1, ag * Math.pow(10, (La + o.target_db - o.loud_db) / 20)).toFixed(3);
    o.loudness = WEIGHTED ? 'weighted' : 'plain'; o.anchor = `${path.basename(af)} at gain ${ag}; target ${o.target_db} dB relative to it`;
  }
} else {
  const C = Math.min(...Object.values(out).map(o => o.loud_db - o.target_db));
  for (const o of Object.values(out)) o.gain = +Math.min(1, Math.pow(10, (o.target_db + C - o.loud_db) / 20)).toFixed(3);
}
const moved = Object.entries(before).filter(([n, b]) => out[n] && Math.abs(out[n].gain - b.gain) > 0.0015).map(([n, b]) => `${n} ${b.gain} -> ${out[n].gain}`);
if (moved.length) console.log('EXISTING GAINS MOVED (tell the game): ' + moved.join(', '));
else if (only) console.log('no existing gain moved');
const set = path.basename(dir);
fs.writeFileSync(setFile, JSON.stringify({
  about: `The ${set} sounds: 48 kHz 16-bit mono WAVs, every file's peak at -1 dBFS. Play a sound at its "gain" (multiply) so the set is levelled against itself: ` +
    `swings under hits, hits under heavy hits, the finishing blow the loudest. Pick one of the files at random each time. loud_db: the loudest 50 ms of the file before the gain; target_db: where it should sit (the sword's hit = about 0).`,
  sample_rate: 48000, channels: 1, peak_dbfs: -1, made: new Date().toISOString(), sounds: out }, null, 2));
for (const [name, o] of Object.entries(out)) {
  if (only && !only.has(name)) continue;
  fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify({ name, category: set, gain: o.gain, use: o.use, variations: o.files.map((f, i) => ({ file: f, seconds: o.seconds[i], peak_dbfs: -1 })) }, null, 2));
}
console.log('sound'.padEnd(20) + 'files  seconds              loud   target  gain');
for (const [name, o] of Object.entries(out)) console.log(name.padEnd(20) + String(o.files.length).padEnd(7) + o.seconds.join(' ').padEnd(21) + String(o.loud_db).padStart(6) + String(o.target_db).padStart(8) + String(o.gain).padStart(7));
if (missing.length) console.log('MISSING: ' + missing.join(' '));
