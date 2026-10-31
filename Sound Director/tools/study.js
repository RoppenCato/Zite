#!/usr/bin/env node
// study: notes (from tools/transcribe.js) -> the piece's structure, as Sonic Pi code and a report.
//   node tools/study.js work/study/ellinia [--bpm 122] [--beats 4] [--split 56] [--offset SEC]
// Finds the tempo and the beat grid, quantises to sixteenths, splits bass and lead by register, names a chord for
// every bar, the key, and the repeated phrases; writes <dir>/<slug>.rb (a faithful playback plus the lines in the
// studio's notation) and <dir>/STUDY.md. The model hears pitches, not instruments, so "lead" means the highest voice.
'use strict';
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), dir = args.find(a => !a.startsWith('--'));
if (!dir) { console.error('usage: node tools/study.js DIR [--bpm N] [--beats 4] [--split 56] [--offset SEC]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const data = JSON.parse(fs.readFileSync(path.join(dir, 'notes.json'), 'utf8')), notes = data.notes, slug = path.basename(dir);
const BEATS = +opt('beats', 4), SPLIT = +opt('split', 52), LEADMIN = +opt('lead', 64);   // bass below E3; the lead from E4 up; the rest is the middle
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nameOf = (n, flats = true) => (flats ? NAMES : SHARP)[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);

// ---- tempo: autocorrelation of the onset signal over 80..200 bpm, then the beat phase ----
function tempo() {
  if (opt('bpm')) return +opt('bpm');
  const res = 0.005, len = Math.ceil(data.seconds / res) + 1, sig = new Float32Array(len);
  for (const n of notes) { const i = Math.round(n.t / res); if (i < len) sig[i] += n.v; }
  const sm = new Float32Array(len); for (let i = 0; i < len; i++) for (let k = -3; k <= 3; k++) sm[i] += (sig[i + k] || 0) * (1 - Math.abs(k) / 4);
  let best = 0, bestLag = 0;
  for (let bpm = 80; bpm <= 200; bpm += 0.25) {
    const lag = Math.round(60 / bpm / res); let s = 0;
    for (let i = 0; i + lag < len; i++) s += sm[i] * sm[i + lag];
    for (let i = 0; i + 2 * lag < len; i++) s += 0.5 * sm[i] * sm[i + 2 * lag];   // the second beat too, against half-time errors
    if (s > best) { best = s; bestLag = lag; }
  }
  return +(60 / (bestLag * res)).toFixed(2);
}
const bpm = tempo(), beat = 60 / bpm, step = beat / 4;
function phase() {
  if (opt('offset')) return +opt('offset');
  let best = -1, bestOff = 0;
  for (let off = 0; off < beat * BEATS; off += 0.01) {
    let s = 0;
    for (const n of notes) { const p = ((n.t - off) % (beat * BEATS) + beat * BEATS) % (beat * BEATS), q = p / beat; const dist = Math.min(q % 1, 1 - q % 1); if (dist < 0.08) s += n.v * (Math.round(q) % BEATS === 0 ? 1.6 : 1); }
    if (s > best) { best = s; bestOff = off; }
  }
  return +bestOff.toFixed(3);
}
const off = phase();

// ---- quantise to sixteenths ----
const q = notes.map(n => ({ s: Math.round((n.t - off) / step), l: Math.max(1, Math.round(n.d / step)), n: n.n, v: n.v })).filter(n => n.s >= 0).sort((a, b) => a.s - b.s || b.n - a.n);
const stepsPerBar = BEATS * 4, bars = Math.ceil((Math.max(...q.map(n => n.s + n.l)) + 1) / stepsPerBar);

// ---- voices: the lead is the highest note at each step above the split, the bass the lowest below it ----
const lead = [], bass = [], mid = [];
{ const byStart = new Map(); for (const n of q) { if (!byStart.has(n.s)) byStart.set(n.s, []); byStart.get(n.s).push(n); }
  for (const [s, ns] of [...byStart.entries()].sort((a, b) => a[0] - b[0])) {
    const hi = ns.filter(n => n.n >= LEADMIN).sort((a, b) => b.n - a.n)[0], lo = ns.filter(n => n.n < SPLIT).sort((a, b) => a.n - b.n)[0];
    if (hi) lead.push({ ...hi }); if (lo) bass.push({ ...lo });
    for (const n of ns) if (n.n >= SPLIT && n.n < LEADMIN) mid.push({ ...n });
  } }
function mono(v) { for (let i = 0; i < v.length - 1; i++) v[i].l = Math.max(1, Math.min(v[i].l, v[i + 1].s - v[i].s)); return v; }
mono(lead); mono(bass);

// ---- chords per bar: pitch-class weights against templates, the bass note favoured as root ----
const TEMPL = { '': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'sus': [0, 5, 7], 'dim': [0, 3, 6], '6': [0, 4, 7, 9] };
function chordOf(b) {
  const w = new Array(12).fill(0), s0 = b * stepsPerBar, s1 = s0 + stepsPerBar; let bassPc = null, bassW = 0;
  for (const n of q) { const a = Math.max(n.s, s0), e = Math.min(n.s + n.l, s1); if (e <= a) continue; const dur = e - a, wt = dur * (0.4 + n.v) * (n.n < SPLIT ? 1.6 : 1); w[n.n % 12] += wt; if (n.n < SPLIT && wt > bassW) { bassW = wt; bassPc = n.n % 12; } }
  const total = w.reduce((x, y) => x + y, 0); if (!total) return null;
  let best = null;
  for (let r = 0; r < 12; r++) for (const k in TEMPL) {
    const iv = TEMPL[k]; let score = 0; for (let p = 0; p < 12; p++) { const inC = iv.includes((p - r + 12) % 12); score += inC ? w[p] : -0.7 * w[p]; }
    score -= iv.length * 0.02 * total; if (k === 'sus' || k === '6' || k === 'dim') score -= 0.06 * total;   // plain triads and sevenths first
    if (bassPc === r) score += 0.25 * total; else if (bassPc != null && iv.includes((bassPc - r + 12) % 12)) score += 0.08 * total;
    if (!best || score > best.score) best = { score, sym: NAMES[r] + k, root: r };
  }
  return best.sym;
}
const chords = []; for (let b = 0; b < bars; b++) chords.push(chordOf(b) || 'r');

// ---- key: Krumhansl profiles on the whole piece ----
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const pcw = new Array(12).fill(0); for (const n of q) pcw[n.n % 12] += n.l * (0.4 + n.v);
function corr(a, b) { const ma = a.reduce((x, y) => x + y) / 12, mb = b.reduce((x, y) => x + y) / 12; let s = 0, sa = 0, sb = 0; for (let i = 0; i < 12; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); }
let key = { c: -2 }; for (let r = 0; r < 12; r++) { const rot = i => pcw[(i + r) % 12]; const vm = corr([...Array(12)].map((_, i) => rot(i)), MAJ), vn = corr([...Array(12)].map((_, i) => rot(i)), MIN); if (vm > key.c) key = { c: vm, name: NAMES[r] + ' major' }; if (vn > key.c) key = { c: vn, name: NAMES[r] + ' minor' }; }

// ---- phrases: bars grouped in fours, named by the lead's pitches and the chords; repeats get the same letter ----
function barSig(b) { const s0 = b * stepsPerBar; return lead.filter(n => n.s >= s0 && n.s < s0 + stepsPerBar).map(n => (n.s - s0) + ':' + n.n).join(' ') + '|' + chords[b]; }
// a phrase is the set of its lead notes as "step:pitch" tokens; two phrases are the same letter when they share
// more than half of their tokens (a machine transcription never repeats a passage exactly)
const phraseLen = 4, phrases = []; const seen = []; let letter = 0;
function tokensOf(p) { const s0 = p * phraseLen * stepsPerBar, s1 = s0 + phraseLen * stepsPerBar; return new Set(lead.filter(n => n.s >= s0 && n.s < s1).map(n => (n.s - s0) + ':' + n.n)); }
function similar(a, b) { if (!a.size || !b.size) return 0; let hit = 0; for (const t of a) if (b.has(t)) hit++; return hit / Math.max(a.size, b.size); }
for (let p = 0; p * phraseLen < bars; p++) {
  const toks = tokensOf(p);
  let idx = -1, best = 0; seen.forEach((s, i) => { const v = similar(s.toks, toks); if (v > best) { best = v; idx = i; } });
  const letterName = (i) => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) + 1 : '');   // A..Z, then A2..Z2
  if (best < 0.5) { idx = seen.length; seen.push({ toks, name: toks.size ? letterName(letter++) : '-' }); }
  phrases.push(seen[idx].name + (best >= 0.5 && best < 0.8 ? "'" : ''));   // a prime marks a varied repeat
}

// ---- the studio's notation from a monophonic quantised voice ----
const LEN = [[16, 'w'], [12, 'h.'], [8, 'h'], [6, 'q.'], [4, 'q'], [3, 'e.'], [2, 'e'], [1, 's']];
function spell(steps, note) { const out = []; let left = steps; while (left > 0) { const u = LEN.find(([n]) => n <= left); out.push(note + ':' + u[1]); left -= u[0]; } return out; }
function notate(voice, b0, b1) {
  // walk the steps; every rest or note is cut at the bar line (the notation has no ties, so a held note repeats)
  const s0 = b0 * stepsPerBar, s1 = b1 * stepsPerBar, ev = voice.filter(n => n.s >= s0 && n.s < s1); const out = []; let pos = s0;
  const emit = (steps, name) => { let left = steps; while (left > 0) { const room = stepsPerBar - ((pos - s0) % stepsPerBar), take = Math.min(left, room); out.push(...spell(take, name)); pos += take; left -= take; if ((pos - s0) % stepsPerBar === 0) out.push('|'); } };
  for (const n of ev) { if (n.s > pos) emit(n.s - pos, 'r'); const l = Math.min(n.l, s1 - n.s); if (l > 0) emit(l, nameOf(n.n)); }
  if (pos < s1) emit(s1 - pos, 'r');
  return out.join(' ');
}

// ---- the Sonic Pi study file ----
const beatsOf = s => +(s / 4).toFixed(3);
let rb = `# ${data.file}: a transcription for study (Basic Pitch -> tools/study.js, ${new Date().toISOString().slice(0, 10)}).
# Not for the game: this is someone else's piece, taken apart to learn from. The model hears pitches, not instruments,
# so the lines below are the highest and lowest voices; chords are named from the notes sounding in each bar.
# bpm ${bpm} (beat phase ${off} s), ${BEATS}/4, ${bars} bars, key ${key.name}. Phrases of four bars: ${phrases.join(' ')}
# Run it to hear the transcription on a piano and a bass; the lines in the studio's notation are below it.

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
STEM = :full
use_bpm ${bpm}
set_sched_ahead_time! 1

# every note the model heard: [start in beats, length in beats, midi, loudness]
NOTES = [
${q.map(n => `  [${beatsOf(n.s)}, ${beatsOf(n.l)}, ${n.n}, ${n.v}]`).join(',\n')}
]

CHORDS = %w[${chords.join(' ')}]

in_thread do                              # the faithful playback: low notes on the bass, the rest on the piano
  with_fx :reverb, mix: 0.25, room: 0.6 do
    t = 0
    NOTES.each do |s, l, n, v|
      sleep s - t if s > t
      t = s
      if n < ${SPLIT}
        synth :fm, note: n, depth: 0.6, divisor: 1, sustain: [l - 0.1, 0.05].max, release: 0.2, amp: 0.35 + v * 0.3
      else
        synth :piano, note: n, vel: 0.15 + v * 0.35, hard: 0.5, release: [l, 0.4].max, amp: 0.55
      end
    end
  end
end

in_thread do                              # the bar counter, with the chord the model heard
  CHORDS.each_with_index { |c, i| puts "bar #{i + 1} #{c} (#{%w[${phrases.join(' ')}][i / ${phraseLen}]})"; sleep ${BEATS} }
end

# ---- the lines in the studio's notation (name+octave:length; w h q e s, dotted with .) -------------------
# Play one with: play_line LEAD_1, FLUTE, 0.8  (comment the playback thread above out first)
`;
for (let b = 0; b < bars; b += 8) {
  const b1 = Math.min(bars, b + 8);
  rb += `\n# bars ${b + 1}-${b1}: ${chords.slice(b, b1).join(' ')}   (${phrases.slice(b / 4, b1 / 4).join(' ')})\n`;
  rb += `LEAD_${b / 8 + 1} = "${notate(lead, b, b1)}"\n`;
  rb += `BASS_${b / 8 + 1} = "${notate(bass, b, b1)}"\n`;
}
fs.writeFileSync(path.join(dir, slug + '.rb'), rb);

// ---- the report ----
const density = []; for (let b = 0; b < bars; b++) density.push(q.filter(n => Math.floor(n.s / stepsPerBar) === b).length);
const regs = (b0, b1) => { const inb = n => n.s >= b0 * stepsPerBar && n.s < b1 * stepsPerBar; return `${bass.filter(inb).length} / ${mid.filter(inb).length} / ${lead.filter(inb).length}`; };
const leadRange = lead.length ? `${nameOf(Math.min(...lead.map(n => n.n)))} to ${nameOf(Math.max(...lead.map(n => n.n)))}` : 'none';
const bassRange = bass.length ? `${nameOf(Math.min(...bass.map(n => n.n)))} to ${nameOf(Math.max(...bass.map(n => n.n)))}` : 'none';
const prog = []; for (let p = 0; p * 8 < bars; p++) prog.push(`| ${p * 8 + 1}-${Math.min(bars, p * 8 + 8)} | ${phrases.slice(p * 2, p * 2 + 2).join(' ')} | ${chords.slice(p * 8, p * 8 + 8).join(' · ')} | ${density.slice(p * 8, p * 8 + 8).reduce((x, y) => x + y, 0)} | ${regs(p * 8, Math.min(bars, p * 8 + 8))} |`);
const md = `# ${data.file}: study

Transcribed with Basic Pitch (Spotify's open model, run here in TensorFlow.js) and taken apart by \`tools/study.js\`
on ${new Date().toISOString().slice(0, 10)}. A machine transcription: the pitches are mostly right, the instruments are
unknown, doublings and reverb tails can become extra notes, and chord names are a best fit per bar. Read it as a map,
not a score. Nothing of it goes into the game; it is here to learn how the piece is built.

| | |
| --- | --- |
| Length | ${data.seconds.toFixed(1)} s, ${bars} bars of ${BEATS} at ${bpm} bpm |
| Key | ${key.name} (profile match ${key.c.toFixed(2)}) |
| Notes heard | ${notes.length} (${(notes.length / data.seconds).toFixed(1)} a second) |
| Lead range (E4 and up, the highest voice) | ${leadRange} |
| Bass range (below E3, the lowest voice) | ${bassRange} |
| Notes by register | bass ${bass.length}, middle ${mid.length}, lead ${lead.length} |
| Phrases (4 bars each) | ${phrases.join(' ')} |

## The chords, eight bars at a time

| Bars | Phrases | Chords | Notes | bass / middle / lead |
| --- | --- | --- | --- | --- |
${prog.join('\n')}

## What to look at

- The phrase letters: a letter that comes back is a hook; look at its bars in the lead line of the study file.
- The chord column: which degrees carry the piece, where it leaves the key, whether the bass walks (the bass line in the file).
- The note count per eight bars: where the arrangement thickens and thins.
- Open \`${slug}.mid\` in a DAW or the Song Editor to see the same notes as a piano roll.
`;
fs.writeFileSync(path.join(dir, 'STUDY.md'), md);
console.log(`${slug}: ${bpm} bpm, phase ${off} s, ${bars} bars, key ${key.name}, phrases ${phrases.join(' ')}\n  lead ${lead.length} notes (${leadRange}), bass ${bass.length} notes (${bassRange})\n  -> ${path.join(dir, slug + '.rb')}, STUDY.md`);
