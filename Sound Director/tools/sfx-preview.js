#!/usr/bin/env node
// sfx-preview: lay a delivered SFX set's sounds on a timeline at their manifest gains, for listening (2026-10-15).
//   node tools/sfx-preview.js out/sfx/combat out/sfx/combat/combat-tour.wav sfx/combat/_tour.json
// TIMELINE.json: [[seconds, "name", variation (1..3), extra gain (optional)], ...]. Writes a 48 kHz 16-bit stereo WAV
// (the same signal on both sides) with 0.5 s of silence at the end; the peak is checked, never limited.
'use strict';
const fs = require('fs'), path = require('path');
const [dir, outFile, tlFile] = process.argv.slice(2);
const setPath = ['-set.json', '.json'].map(e => path.join(dir, path.basename(dir) + e)).find(f => fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf8')).sounds);
const set = JSON.parse(fs.readFileSync(setPath, 'utf8')).sounds;
const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
function readMono(file) {
  const b = fs.readFileSync(file); let p = 12, fmt, data;
  while (p + 8 <= b.length) { const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4), body = p + 8;
    if (id === 'fmt ') fmt = { ch: b.readUInt16LE(body + 2), sr: b.readUInt32LE(body + 4) }; else if (id === 'data') data = { off: body, len: n }; p = body + n + (n & 1); }
  const frames = Math.floor(data.len / (2 * fmt.ch)), x = new Float32Array(frames);
  for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < fmt.ch; c++) s += b.readInt16LE(data.off + (i * fmt.ch + c) * 2) / 32768; x[i] = s / fmt.ch; }
  if (fmt.sr === 48000) return x;
  const r = fmt.sr / 48000, y = new Float32Array(Math.floor(frames / r));        // another rate (a reference file): resample, linear
  for (let i = 0; i < y.length; i++) { const p = i * r, k = Math.floor(p), f = p - k; y[i] = x[k] * (1 - f) + (k + 1 < frames ? x[k + 1] : 0) * f; }
  return y;
}
// a fifth element, cut (seconds into the file), fades the sound out over 30 ms from there and drops the rest: the game
// cuts a swing at the hit (2026-10-15). A name with a slash is a file outside the set (a reference): its gain is the
// fourth element itself.
const SR = 48000, events = tl.map(([t, name, v, g, cut]) => {
  const ext = /[\\/]/.test(name);
  if (!ext && !set[name]) throw new Error('no sound ' + name);
  let x = readMono(ext ? name : path.join(dir, set[name].files[(v || 1) - 1]));
  if (cut != null) {
    const c = Math.round(cut * SR), f = Math.round(0.03 * SR);
    x = x.slice(0, Math.min(x.length, c + f));
    for (let i = c; i < x.length; i++) x[i] *= Math.max(0, 1 - (i - c) / f);
  }
  return { at: Math.round(t * SR), x, g: ext ? (g == null ? 1 : g) : set[name].gain * (g == null ? 1 : g) };
});
const len = Math.max(...events.map(e => e.at + e.x.length)) + SR / 2, mix = new Float32Array(len);
for (const e of events) for (let i = 0; i < e.x.length; i++) mix[e.at + i] += e.x[i] * e.g;
let pk = 0; for (const v of mix) pk = Math.max(pk, Math.abs(v));
const CEIL = Math.pow(10, -1 / 20), scale = pk > CEIL ? CEIL / pk : 1;      // overlapping sounds may sum over -1 dBFS: scale the whole preview down
if (scale < 1) { for (let i = 0; i < len; i++) mix[i] *= scale; console.log(`scaled by ${(20 * Math.log10(scale)).toFixed(1)} dB to keep the peak at -1 dBFS`); pk = CEIL; }
const b = Buffer.alloc(44 + len * 4);
b.write('RIFF', 0); b.writeUInt32LE(36 + len * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(len * 4, 40);
for (let i = 0; i < len; i++) { const v = Math.max(-32768, Math.min(32767, Math.round(mix[i] * 32767))); b.writeInt16LE(v, 44 + i * 4); b.writeInt16LE(v, 46 + i * 4); }
fs.writeFileSync(outFile, b);
console.log(`${outFile}: ${(len / SR).toFixed(2)} s, ${events.length} sounds, peak ${(20 * Math.log10(pk)).toFixed(1)} dBFS`);
