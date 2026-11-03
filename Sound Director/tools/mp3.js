#!/usr/bin/env node
// mp3: encode a WAV to MP3 with lamejs (pure JavaScript), for listening on a phone or in the chat.
//   node tools/mp3.js IN.wav [OUT.mp3] [KBPS=160]
// A 3-minute stereo track is about 3.5 MB at 160 kbps instead of 37 MB as WAV. MP3 adds a few ms of silence at the start
// and is not sample-exact, so it is for listening; the game's loops are the WAVs.
'use strict';
const fs = require('fs'), path = require('path');
// 2026-11-01: lamejs is not installed in this studio; with ffmpeg on the PC (C:/dev/ffmpeg, Robin's yes of 2026-11-01) the encode
// goes through its libmp3lame instead, same arguments, same result for listening.
{
  const FF = 'C:/dev/ffmpeg/bin/ffmpeg.exe';
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules', 'lamejs')) && fs.existsSync(FF)) {
    const [inp, outArg, kbpsArg] = process.argv.slice(2);
    if (!inp) { console.error('usage: node tools/mp3.js IN.wav [OUT.mp3] [KBPS]'); process.exit(1); }
    const out = outArg || inp.replace(/.wav$/i, '') + '.mp3', kbps = +(kbpsArg || 160);
    const r = require('child_process').spawnSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-i', inp, '-c:a', 'libmp3lame', '-b:a', kbps + 'k', out], { encoding: 'utf8' });
    if (r.status !== 0) { console.error(r.stderr); process.exit(2); }
    console.log(out + ' ' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB (ffmpeg, ' + kbps + ' kbps)');
    process.exit(0);
  }
}
// lamejs 1.2.1's own entry misses three globals (a known bug: `MPEGMode is not defined`); supply them, then load it
const lameDir = path.join(__dirname, '..', 'node_modules', 'lamejs', 'src', 'js');
global.MPEGMode = require(path.join(lameDir, 'MPEGMode.js')); global.Lame = require(path.join(lameDir, 'Lame.js')); global.BitStream = require(path.join(lameDir, 'BitStream.js'));
const lamejs = require(path.join(__dirname, '..', 'node_modules', 'lamejs'));

function readWav(file) {
  const b = fs.readFileSync(file);
  let p = 12, fmt = null, data = null;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4), body = p + 8;
    if (id === 'fmt ') fmt = { tag: b.readUInt16LE(body), ch: b.readUInt16LE(body + 2), sr: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    else if (id === 'data') data = { off: body, len: Math.min(n, b.length - body) };
    p = body + n + (n & 1);
  }
  const bps = fmt.bits / 8, frames = Math.floor(data.len / (bps * fmt.ch)), chans = [];
  for (let c = 0; c < fmt.ch; c++) chans.push(new Int16Array(frames));
  for (let i = 0; i < frames; i++) for (let c = 0; c < fmt.ch; c++) {
    const q = data.off + (i * fmt.ch + c) * bps; let v;
    if (fmt.bits === 16) v = b.readInt16LE(q); else if (fmt.bits === 24) v = b.readIntLE(q, 3) >> 8;
    else if (fmt.bits === 32 && fmt.tag === 3) v = Math.round(Math.max(-1, Math.min(1, b.readFloatLE(q))) * 32767); else v = b.readInt32LE(q) >> 16;
    chans[c][i] = v;
  }
  return { sr: fmt.sr, ch: fmt.ch, frames, chans };
}

const [inp, outArg, kbpsArg] = process.argv.slice(2);
if (!inp) { console.error('usage: node tools/mp3.js IN.wav [OUT.mp3] [KBPS]'); process.exit(1); }
const out = outArg || inp.replace(/\.wav$/i, '') + '.mp3', kbps = +(kbpsArg || 160);
const w = readWav(inp), enc = new lamejs.Mp3Encoder(w.ch, w.sr, kbps), parts = [], block = 1152;
for (let i = 0; i < w.frames; i += block) {
  const l = w.chans[0].subarray(i, i + block), r = w.ch > 1 ? w.chans[1].subarray(i, i + block) : null;
  const d = w.ch > 1 ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l);
  if (d.length) parts.push(Buffer.from(d));
}
const end = enc.flush(); if (end.length) parts.push(Buffer.from(end));
fs.writeFileSync(out, Buffer.concat(parts));
console.log(`${out}: ${(fs.statSync(out).size / 1048576).toFixed(2)} MB, ${kbps} kbps, ${(w.frames / w.sr).toFixed(1)} s`);
