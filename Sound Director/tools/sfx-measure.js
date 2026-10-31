#!/usr/bin/env node
// sfx-measure: the numbers a strike is judged by (2026-10-16, for the hit redo): length, attack (from the first sound,
// 40 dB under the peak, to the first sample within 3 dB of the peak: in a layered sound a later sum can edge past it), the time to fall 30 dB (5 ms windows, from the loudest one), the spectral
// centre and the energy shares under 250 Hz, 250 Hz to 1 kHz, 1 to 4 kHz and over 4 kHz (a Welch spectrum over the whole
// sound), and the hearing-weighted loudness of the loudest 50 ms (a high-pass at 100 Hz, +4 dB above 1.5 kHz, as
// tools/sfx-level.js --weighted).   node tools/sfx-measure.js FILE...   (16-bit WAV)
'use strict';
const fs = require('fs');
function read(f) {
  const b = fs.readFileSync(f); let p = 12, fmt, data;
  while (p + 8 <= b.length) { const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4), body = p + 8;
    if (id === 'fmt ') fmt = { ch: b.readUInt16LE(body + 2), sr: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) }; else if (id === 'data') data = { off: body, len: Math.min(n, b.length - body) }; p = body + n + (n & 1); }
  const bps = fmt.bits / 8, fr = Math.floor(data.len / (bps * fmt.ch)), x = new Float32Array(fr);
  for (let i = 0; i < fr; i++) { let s = 0; for (let c = 0; c < fmt.ch; c++) { const q = data.off + (i * fmt.ch + c) * bps; s += fmt.bits === 16 ? b.readInt16LE(q) / 32768 : b.readIntLE(q, 3) / 8388608; } x[i] = s / fmt.ch; }
  return { x, sr: fmt.sr };
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), s = Math.sin(a * k), h = i + k + len / 2;
      const tr = re[h] * c - im[h] * s, ti = re[h] * s + im[h] * c; re[h] = re[i + k] - tr; im[h] = im[i + k] - ti; re[i + k] += tr; im[i + k] += ti; } }
}
function biquad(x, b0, b1, b2, a1, a2) { const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; } return y; }
function weigh(x, sr) {
  let w0 = 2 * Math.PI * 100 / sr, c = Math.cos(w0), al = Math.sin(w0) / (2 * 0.7071), a0 = 1 + al;
  const y = biquad(x, (1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0, -2 * c / a0, (1 - al) / a0);
  const A = Math.pow(10, 4 / 40); w0 = 2 * Math.PI * 1500 / sr; c = Math.cos(w0); al = Math.sin(w0) / 2 * Math.SQRT2; const sq = 2 * Math.sqrt(A) * al, s0 = (A + 1) - (A - 1) * c + sq;
  return biquad(y, A * ((A + 1) + (A - 1) * c + sq) / s0, -2 * A * ((A - 1) + (A + 1) * c) / s0, A * ((A + 1) + (A - 1) * c - sq) / s0, 2 * ((A - 1) - (A + 1) * c) / s0, ((A + 1) - (A - 1) * c - sq) / s0);
}
console.log('file'.padEnd(24) + 'len ms  attack ms  -30dB at ms  centre Hz  <250  250-1k  1-4k  >4k   loud(w) dB');
for (const f of process.argv.slice(2)) {
  const { x, sr } = read(f), n = x.length;
  let pk = 0, pi = 0; for (let i = 0; i < n; i++) if (Math.abs(x[i]) > pk) { pk = Math.abs(x[i]); pi = i; }
  let on = 0; while (on < n && Math.abs(x[on]) < pk * 0.01) on++;
  let a3 = on; while (a3 < n && Math.abs(x[a3]) < pk * 0.708) a3++;              // the attack as heard: to within 3 dB of the peak
  const w5 = Math.round(sr * 0.005), env = []; for (let s = 0; s < n; s += w5) { let e = 0; for (let i = s; i < Math.min(s + w5, n); i++) e += x[i] * x[i]; env.push(e / w5); }
  let top = 0, ti = 0; env.forEach((e, i) => { if (e > top) { top = e; ti = i; } });
  let k = ti; while (k < env.length && 10 * Math.log10(env[k] / top + 1e-20) > -30) k++;
  const down = (k * w5 - on) / sr * 1000;
  const N = 1024, hop = 512, ps = new Float64Array(N / 2);
  for (let s = on; s < n; s += hop) { const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = (s + i < n ? x[s + i] : 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))); fft(re, im);
    for (let b = 1; b < N / 2; b++) ps[b] += re[b] * re[b] + im[b] * im[b]; }
  let tot = 0, cen = 0; const sh = [0, 0, 0, 0];
  for (let b = 1; b < N / 2; b++) { const hz = b * sr / N, p = ps[b]; if (hz < 30) continue; tot += p; cen += p * hz; sh[hz < 250 ? 0 : hz < 1000 ? 1 : hz < 4000 ? 2 : 3] += p; }
  const y = weigh(x, sr), w = Math.round(sr * 0.05); let best = 0;
  for (let s = 0; s + w <= Math.max(n, w); s += Math.round(sr * 0.005)) { let e = 0; for (let i = s; i < Math.min(s + w, n); i++) e += y[i] * y[i]; best = Math.max(best, e / w); }
  const name = f.split(/[\\/]/).pop();
  console.log(name.padEnd(24) + String(Math.round((n - on) / sr * 1000)).padEnd(8) + ((a3 - on) / sr * 1000).toFixed(1).padEnd(11) + String(Math.round(down)).padEnd(13) +
    String(Math.round(cen / tot)).padEnd(11) + sh.map(v => String(Math.round(100 * v / tot)).padStart(4)).join('  ') + '   ' + (10 * Math.log10(best + 1e-20)).toFixed(1));
}
