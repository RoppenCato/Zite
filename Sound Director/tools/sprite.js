#!/usr/bin/env node
// sprite: pack a wave's short sounds into one audio sprite for the game (2026-11-01, Miles, GD's budgets in docs/game-notes.md):
// one 48 kHz mono WAV with 50 ms of silence between sounds, encoded to OGG Vorbis with ffmpeg (libvorbis, quality 4), and a
// spritemap JSON in the form the game loads straight: { "spritemap": { "ui/die-land-a-1": { "start": 0, "end": 0.13, "loop": false } } }.
//   node tools/sprite.js SPEC.json OUT_DIR
// SPEC.json: { "name": "ui", "gap": 0.05, "sounds": [ { "name": "ui/die-land-a-1", "file": "out/sfx/ui/die_land_a_1.wav", "gain": 1.0, "loop": false }, ... ] }
// Also encodes every sound on its own as OUT_DIR/<name with slashes as dashes>.ogg, for listening and for a game that wants loose files.
// Each sound is scaled by its gain (the set's levelling), then the whole sprite's peak is held at -3 dBFS (the game's rule for effects).
'use strict';
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const FFMPEG = fs.existsSync('C:/dev/ffmpeg/bin/ffmpeg.exe') ? 'C:/dev/ffmpeg/bin/ffmpeg.exe' : 'ffmpeg';
const [specFile, outDir] = process.argv.slice(2);
if (!specFile || !outDir) { console.error('usage: node tools/sprite.js SPEC.json OUT_DIR'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8')), SR = 48000, gap = Math.round((spec.gap == null ? 0.05 : spec.gap) * SR);
fs.mkdirSync(outDir, { recursive: true });

function readMono(file) {
  const b = fs.readFileSync(file); let p = 12, fmt, data;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4), body = p + 8;
    if (id === 'fmt ') fmt = { ch: b.readUInt16LE(body + 2), sr: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    else if (id === 'data') data = { off: body, len: Math.min(n, b.length - body) };
    p = body + n + (n & 1);
  }
  if (fmt.bits !== 16) throw new Error(file + ': expected 16-bit PCM');
  if (fmt.sr !== SR) throw new Error(file + ': expected 48 kHz, got ' + fmt.sr);
  const frames = Math.floor(data.len / (2 * fmt.ch)), x = new Float32Array(frames);
  for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < fmt.ch; c++) s += b.readInt16LE(data.off + (i * fmt.ch + c) * 2) / 32768; x[i] = s / fmt.ch; }
  return x;
}
function writeWav(file, x) {
  const b = Buffer.alloc(44 + x.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}
function fade(x, ms) { const n = Math.min(x.length >> 1, Math.round(SR * ms / 1000)); for (let i = 0; i < n; i++) { const g = i / n; x[i] *= g; x[x.length - 1 - i] *= g; } }
function ogg(wav, out, quality) {
  const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', String(quality), out], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.error); process.exit(2); }
  return fs.statSync(out).size;
}

const CEIL = Math.pow(10, -3 / 20);                         // effects peak at -3 dBFS (Miles, GD, 2026-11-01)
// a sound with a `length` (seconds) is padded with silence to exactly that length: a loop's wrap-around gap (the die's tumble)
const sounds = spec.sounds.map(s => { let x = readMono(s.file); const g = s.gain == null ? 1 : s.gain; for (let i = 0; i < x.length; i++) x[i] *= g; fade(x, 5);
  if (s.length && Math.round(s.length * SR) > x.length) { const y = new Float32Array(Math.round(s.length * SR)); y.set(x); x = y; }
  return { ...s, x }; });
let pk = 0; for (const s of sounds) for (const v of s.x) pk = Math.max(pk, Math.abs(v));
// one fixed scale for every sprite: a master at gain 1.0 peaks at -1 dBFS, so -2 dB puts the loudest possible sound at -3 dBFS. Fixed, not
// normalised per sprite, or a sprite of quiet sounds would be pushed up and the levels between sprites (all against the die's land) would break.
const scale = CEIL / Math.pow(10, -1 / 20);
if (pk * scale > CEIL * 1.001) { console.error(`a sound would peak over -3 dBFS (${(20 * Math.log10(pk * scale)).toFixed(1)}): check its master`); process.exit(3); }
console.log(`set peak ${(20 * Math.log10(pk * scale)).toFixed(1)} dBFS after the fixed ${(20 * Math.log10(scale)).toFixed(1)} dB`);
const total = sounds.reduce((n, s) => n + s.x.length + gap, 0), mix = new Float32Array(total), map = {};
let at = 0, rows = [];
for (const s of sounds) {
  for (let i = 0; i < s.x.length; i++) mix[at + i] = s.x[i] * scale;
  map[s.name] = { start: +(at / SR).toFixed(4), end: +((at + s.x.length) / SR).toFixed(4), loop: !!s.loop };
  const loose = path.join(outDir, s.name.replace(/\//g, '-') + '.ogg'), tmp = path.join(outDir, '_one.wav');
  writeWav(tmp, Float32Array.from(s.x, v => v * scale)); const size = ogg(tmp, loose, 4); fs.unlinkSync(tmp);
  rows.push(`${s.name.padEnd(24)} ${(s.x.length / SR).toFixed(3)} s  at ${map[s.name].start.toFixed(3)}  ${(size / 1024).toFixed(1)} KB ogg`);
  at += s.x.length + gap;
}
const wav = path.join(outDir, spec.name + '.wav'), og = path.join(outDir, spec.name + '.ogg');
writeWav(wav, mix); const size = ogg(wav, og, 4); fs.unlinkSync(wav);
fs.writeFileSync(path.join(outDir, spec.name + '.json'), JSON.stringify({ spritemap: map }, null, 2));
console.log(rows.join('\n'));
console.log(`${spec.name}.ogg ${(total / SR).toFixed(2)} s, ${(size / 1024).toFixed(1)} KB; ${spec.name}.json ${Object.keys(map).length} sounds`);
