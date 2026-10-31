#!/usr/bin/env node
// wavtool: measure and cut WAV files without any dependency (Node 24).
//   node tools/wavtool.js info FILE                       format, length, peak, RMS, DC, first/last sound
//   node tools/wavtool.js onset FILE [DB=-40]             first frame above DB (prints frame and seconds)
//   node tools/wavtool.js loopcut IN OUT LEN_SEC [DB]     cut the second pass [t0+L, t0+2L) from onset t0; 16-bit out
//   node tools/wavtool.js cut IN OUT START_SEC LEN_SEC    cut any range; 16-bit out
//   node tools/wavtool.js seam FILE                       the step across the loop seam (last frame -> first frame)
//   node tools/wavtool.js bars FILE BPM BARS [BEATS=4]    RMS of every bar, a small table
//   node tools/wavtool.js trim IN OUT [DB=-60] [PEAK_DB=-1]  trim silence both ends, normalise the peak (for SFX)
//   node tools/wavtool.js diff A B                        RMS of (A - B) relative to A, in dB (stems vs mix)
//   node tools/wavtool.js sum OUT A B C...                add files sample by sample (to compare with a mix)
'use strict';
const fs = require('fs');

function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error(file + ': not a WAV');
  let p = 12, fmt = null, data = null;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4), body = p + 8;
    if (id === 'fmt ') fmt = { tag: b.readUInt16LE(body), ch: b.readUInt16LE(body + 2), sr: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    else if (id === 'data') { data = { off: body, len: Math.min(n, b.length - body) }; }
    p = body + n + (n & 1);
  }
  if (!fmt || !data) throw new Error(file + ': missing fmt or data chunk');
  if (fmt.tag === 0xFFFE) fmt.tag = fmt.bits === 32 && b.readUInt16LE(data.off - 8 - 24 + 24) ? fmt.tag : fmt.tag; // extensible: fall through on bits
  const bps = fmt.bits / 8, frames = Math.floor(data.len / (bps * fmt.ch));
  const chans = []; for (let c = 0; c < fmt.ch; c++) chans.push(new Float32Array(frames));
  const o = data.off;
  for (let i = 0; i < frames; i++) for (let c = 0; c < fmt.ch; c++) {
    const q = o + (i * fmt.ch + c) * bps; let v;
    if (fmt.bits === 16) v = b.readInt16LE(q) / 32768;
    else if (fmt.bits === 24) v = b.readIntLE(q, 3) / 8388608;
    else if (fmt.bits === 32 && fmt.tag === 3) v = b.readFloatLE(q);
    else if (fmt.bits === 32) v = b.readInt32LE(q) / 2147483648;
    else if (fmt.bits === 8) v = (b.readUInt8(q) - 128) / 128;
    else throw new Error('unsupported bit depth ' + fmt.bits);
    chans[c][i] = v;
  }
  return { sr: fmt.sr, ch: fmt.ch, bits: fmt.bits, frames, chans, file };
}

function writeWav(file, w, bits) {
  bits = bits || 16; const bps = bits / 8, n = w.frames, ch = w.ch, out = Buffer.alloc(44 + n * ch * bps);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * ch * bps, 4); out.write('WAVE', 8); out.write('fmt ', 12); out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); out.writeUInt16LE(ch, 22); out.writeUInt32LE(w.sr, 24); out.writeUInt32LE(w.sr * ch * bps, 28); out.writeUInt16LE(ch * bps, 32); out.writeUInt16LE(bits, 34);
  out.write('data', 36); out.writeUInt32LE(n * ch * bps, 40);
  let q = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, w.chans[c][i]));
    if (bits === 16) { out.writeInt16LE(Math.round(v * 32767), q); q += 2; }
    else { out.writeIntLE(Math.round(v * 8388607), q, 3); q += 3; }
  }
  fs.writeFileSync(file, out);
}

const db = (x) => x > 0 ? (20 * Math.log10(x)).toFixed(1) : '-inf';
function stats(w, from, to) {
  from = from || 0; to = to == null ? w.frames : to; let peak = 0, sq = 0, dc = 0, n = 0;
  for (let c = 0; c < w.ch; c++) { const d = w.chans[c]; for (let i = from; i < to; i++) { const v = d[i], a = Math.abs(v); if (a > peak) peak = a; sq += v * v; dc += v; n++; } }
  return { peak, rms: n ? Math.sqrt(sq / n) : 0, dc: n ? dc / n : 0 };
}
function firstAbove(w, thr, from) { for (let i = from || 0; i < w.frames; i++) for (let c = 0; c < w.ch; c++) if (Math.abs(w.chans[c][i]) > thr) return i; return -1; }
function lastAbove(w, thr) { for (let i = w.frames - 1; i >= 0; i--) for (let c = 0; c < w.ch; c++) if (Math.abs(w.chans[c][i]) > thr) return i; return -1; }
function slice(w, from, len) {
  const chans = []; for (let c = 0; c < w.ch; c++) { const d = new Float32Array(len); for (let i = 0; i < len; i++) { const j = from + i; d[i] = j >= 0 && j < w.frames ? w.chans[c][j] : 0; } chans.push(d); }
  return { sr: w.sr, ch: w.ch, bits: w.bits, frames: len, chans };
}
function seam(w) {
  let worst = 0; const parts = [];
  for (let c = 0; c < w.ch; c++) { const d = w.chans[c], step = Math.abs(d[w.frames - 1] - d[0]); parts.push(step); if (step > worst) worst = step; }
  const ms = Math.round(w.sr * 0.01), head = stats(w, 0, ms), tail = stats(w, w.frames - ms, w.frames);
  return { step: worst, steps: parts, headRms: head.rms, tailRms: tail.rms };
}

const [cmd, ...a] = process.argv.slice(2);
function sec(f, w) { return (f / w.sr).toFixed(4); }
try {
  if (cmd === 'info') {
    const w = readWav(a[0]), s = stats(w), thr = Math.pow(10, -60 / 20), f0 = firstAbove(w, thr), f1 = lastAbove(w, thr);
    console.log(`${a[0]}\n  ${w.sr} Hz, ${w.ch} ch, ${w.bits} bit, ${w.frames} frames = ${sec(w.frames, w)} s`);
    console.log(`  peak ${db(s.peak)} dBFS, rms ${db(s.rms)} dBFS, dc ${(s.dc * 100).toFixed(3)} %FS`);
    console.log(`  first sound (-60 dB) at ${f0 < 0 ? 'none' : sec(f0, w) + ' s'}, last at ${f1 < 0 ? 'none' : sec(f1, w) + ' s'}`);
  } else if (cmd === 'onset') {
    const w = readWav(a[0]), thr = Math.pow(10, (a[1] == null ? -40 : +a[1]) / 20), f = firstAbove(w, thr);
    console.log(f < 0 ? 'no onset' : `${f} ${sec(f, w)}`);
  } else if (cmd === 'loopcut') {
    const w = readWav(a[0]), L = +a[2], thr = Math.pow(10, (a[3] == null ? -40 : +a[3]) / 20), t0 = firstAbove(w, thr);
    if (t0 < 0) throw new Error('no onset found');
    const len = Math.round(L * w.sr), from = t0 + len;
    if (from + len > w.frames) throw new Error(`file too short: need ${sec(from + len, w)} s, have ${sec(w.frames, w)} s`);
    const cut = slice(w, from, len);
    // the seam: blend the loop's last 40 ms toward the end of pass one, which runs straight into the loop's first sample,
    // so whatever still sounds across the bar line (a bass release, a pad tail) joins without a step
    const xf = Math.min(Math.round(w.sr * 0.04), len >> 2);
    for (let c = 0; c < w.ch; c++) for (let k = 0; k < xf; k++) { const g = (k + 1) / (xf + 1), i = len - xf + k; cut.chans[c][i] = cut.chans[c][i] * (1 - g) + w.chans[c][from - xf + k] * g; }
    writeWav(a[1], cut, 16);
    const s = stats(cut), sm = seam(cut);
    console.log(`onset ${sec(t0, w)} s; cut ${sec(from, w)}..${sec(from + len, w)} s -> ${a[1]} (${len} frames, ${L} s, ${(xf / w.sr * 1000).toFixed(0)} ms crossfade at the seam)`);
    console.log(`  peak ${db(s.peak)} dBFS, rms ${db(s.rms)} dBFS; seam step ${(sm.step * 100).toFixed(3)} %FS, head rms ${db(sm.headRms)}, tail rms ${db(sm.tailRms)}`);
  } else if (cmd === 'cut') {
    const w = readWav(a[0]), from = Math.round(+a[2] * w.sr), len = Math.round(+a[3] * w.sr); writeWav(a[1], slice(w, from, len), 16); console.log(`wrote ${a[1]} (${len} frames)`);
  } else if (cmd === 'seam') {
    const w = readWav(a[0]), sm = seam(w);
    console.log(`seam step ${(sm.step * 100).toFixed(3)} %FS (${sm.steps.map(x => (x * 100).toFixed(3)).join(' / ')}); head 10 ms rms ${db(sm.headRms)} dBFS, tail ${db(sm.tailRms)} dBFS`);
  } else if (cmd === 'bars') {
    const w = readWav(a[0]), bpm = +a[1], bars = +a[2], beats = +(a[3] || 4), bl = beats * 60 / bpm * w.sr; const row = [];
    for (let b = 0; b < bars; b++) { const s = stats(w, Math.round(b * bl), Math.min(w.frames, Math.round((b + 1) * bl))); row.push(`${String(b + 1).padStart(2)}:${db(s.rms).padStart(6)}`); }
    for (let i = 0; i < row.length; i += 8) console.log('  ' + row.slice(i, i + 8).join('  '));
  } else if (cmd === 'trim') {
    const w = readWav(a[0]), thr = Math.pow(10, (a[2] == null ? -60 : +a[2]) / 20), target = Math.pow(10, (a[3] == null ? -1 : +a[3]) / 20);
    const f0 = Math.max(0, firstAbove(w, thr) - Math.round(w.sr * 0.002)), f1 = lastAbove(w, thr) + Math.round(w.sr * 0.01);
    const cut = slice(w, f0, Math.min(w.frames, f1) - f0), s = stats(cut), g = s.peak > 0 ? target / s.peak : 1;
    for (let c = 0; c < cut.ch; c++) for (let i = 0; i < cut.frames; i++) cut.chans[c][i] *= g;
    writeWav(a[1], cut, 16); console.log(`${a[1]}: ${sec(cut.frames, cut)} s, gain ${db(g)} dB, peak now ${db(stats(cut).peak)} dBFS`);
  } else if (cmd === 'split') {
    // split IN OUTPREFIX [DB=-50] [GAP_SEC=0.3] [TRIM_DB=-60] [PEAK_DB=-1]: regions above DB separated by GAP of quiet
    const w = readWav(a[0]), thr = Math.pow(10, (a[2] == null ? -50 : +a[2]) / 20), gap = Math.round((a[3] == null ? 0.3 : +a[3]) * w.sr);
    const tthr = Math.pow(10, (a[4] == null ? -60 : +a[4]) / 20), target = Math.pow(10, (a[5] == null ? -1 : +a[5]) / 20);
    const loud = new Uint8Array(w.frames); for (let c = 0; c < w.ch; c++) for (let i = 0; i < w.frames; i++) if (Math.abs(w.chans[c][i]) > thr) loud[i] = 1;
    const regions = []; let start = -1, quiet = 0;
    for (let i = 0; i < w.frames; i++) {
      if (loud[i]) { if (start < 0) start = i; quiet = 0; }
      else if (start >= 0 && ++quiet > gap) { regions.push([start, i - quiet]); start = -1; }
    }
    if (start >= 0) regions.push([start, w.frames]);
    regions.forEach(([s, e], k) => {
      let f0 = s, f1 = e;                                             // trim to the quieter threshold with small margins
      while (f0 > 0 && !(Math.abs(w.chans[0][f0]) > tthr || (w.ch > 1 && Math.abs(w.chans[1][f0]) > tthr))) f0++;
      f0 = Math.max(0, f0 - Math.round(w.sr * 0.002)); f1 = Math.min(w.frames, e + Math.round(w.sr * 0.01));
      const cut = slice(w, f0, f1 - f0), st = stats(cut), g = st.peak > 0 ? target / st.peak : 1;
      for (let c = 0; c < cut.ch; c++) for (let i = 0; i < cut.frames; i++) cut.chans[c][i] *= g;
      const out = `${a[1]}_${k + 1}.wav`; writeWav(out, cut, 16);
      console.log(`${out}: ${sec(cut.frames, cut)} s from ${sec(f0, w)} s, gain ${db(g)} dB`);
    });
    if (!regions.length) console.log('no sound found');
  } else if (cmd === 'diff') {
    const A = readWav(a[0]), B = readWav(a[1]), n = Math.min(A.frames, B.frames); let sa = 0, sd = 0;
    for (let c = 0; c < A.ch; c++) for (let i = 0; i < n; i++) { const x = A.chans[c][i], y = B.chans[c][i]; sa += x * x; sd += (x - y) * (x - y); }
    console.log(`difference ${db(Math.sqrt(sd / Math.max(sa, 1e-20)))} dB relative to ${a[0]} over ${sec(n, A)} s`);
  } else if (cmd === 'mix') {
    // mix OUT A GAIN_A B GAIN_B ...: a weighted sum, e.g. the game's fight state: base 1 calm 0.15 danger 1
    const pairs = []; for (let i = 1; i < a.length; i += 2) pairs.push([readWav(a[i]), +a[i + 1]]);
    const n = Math.min(...pairs.map(p => p[0].frames)), out = slice(pairs[0][0], 0, n);
    for (let c = 0; c < out.ch; c++) for (let i = 0; i < n; i++) { let v = 0; for (const [w, g] of pairs) v += w.chans[c][i] * g; out.chans[c][i] = v; }
    writeWav(a[0], out, 16); const s = stats(out); console.log(`wrote ${a[0]}: peak ${db(s.peak)} dBFS, rms ${db(s.rms)} dBFS`);
  } else if (cmd === 'concat') {
    // concat OUT A B C...: one file after another (for a listening copy of an intro followed by its loop)
    const ws = a.slice(1).map(readWav), total = ws.reduce((n, w) => n + w.frames, 0), out = slice(ws[0], 0, 0); out.frames = total;
    out.chans = []; for (let c = 0; c < ws[0].ch; c++) { const d = new Float32Array(total); let p = 0; for (const w of ws) { d.set(w.chans[Math.min(c, w.ch - 1)], p); p += w.frames; } out.chans.push(d); }
    writeWav(a[0], out, 16); console.log(`wrote ${a[0]}: ${sec(total, out)} s from ${ws.length} files`);
  } else if (cmd === 'sum') {
    const ws = a.slice(1).map(readWav), n = Math.min(...ws.map(w => w.frames)), out = slice(ws[0], 0, n);
    for (let k = 1; k < ws.length; k++) for (let c = 0; c < out.ch; c++) for (let i = 0; i < n; i++) out.chans[c][i] += ws[k].chans[c][i];
    writeWav(a[0], out, 16); const s = stats(out); console.log(`wrote ${a[0]}: peak ${db(s.peak)} dBFS, rms ${db(s.rms)} dBFS`);
  } else { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 12).join('\n')); process.exit(cmd ? 1 : 0); }
} catch (e) { console.error('wavtool: ' + e.message); process.exit(1); }
