#!/usr/bin/env node
// recreate: a study's notes -> a Sonic Pi file that plays them with the studio's voices by register, to hear how
// close a transcription is and how the voices compare.   node tools/recreate.js work/study/ellinia [--bpm 120]
// Not for the game: a recreation of someone else's piece, for study only.
'use strict';
const fs = require('fs'), path = require('path');
const dir = process.argv[2]; if (!dir) { console.error('usage: node tools/recreate.js DIR [--bpm N]'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(path.join(dir, 'notes.json'), 'utf8')), slug = path.basename(dir);
const i = process.argv.indexOf('--bpm'), bpm = i >= 0 ? +process.argv[i + 1] : 120, bars = Math.ceil(data.seconds * bpm / 60 / 4);
const notes = data.notes;
const rb = `# ${data.file}: a recreation from the transcription, with the studio's voices by register (tools/recreate.js, ${new Date().toISOString().slice(0, 10)}).
# For study only (someone else's piece). Bass below E3 on the FM bass, the middle on the piano, the lead (E5 and up,
# or loud notes from E4) on the flute, with the room from the meadow tracks. Every note the model heard, at its own time.
# name: ${slug}-recreation
# bpm: ${bpm}
# bars: ${bars}
# beats: 4
# stems: full

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
STEM = :full
PASSES = 1
MASTER = 0.6
use_bpm ${bpm}
set_sched_ahead_time! 1

require "json"
# the notes are read at run time: inline they would not fit the engine's message size (a UDP datagram, about 64 KB)
RAW = JSON.parse(File.read("${path.resolve(dir).split(path.sep).join('/')}/notes.json"))["notes"]
NOTES = RAW.map { |n| [(n["t"] * ${bpm} / 60.0), [n["d"] * ${bpm} / 60.0, 0.1].max, n["n"], n["v"]] }.sort_by { |x| x[0] }

marker

in_thread do
  with_fx :reverb, mix: 0.28, room: 0.7, damp: 0.5 do
    t = 0
    NOTES.each do |s, l, n, v|
      sleep s - t if s > t
      t = s
      a = (0.35 + v * 0.65) * MASTER
      if n < 52
        BASS.call(n, l, a * 0.9)
      elsif n >= 76 || (n >= 64 && v >= 0.55)
        FLUTE.call(n, l, a * 0.8)
      else
        PIANO.call(n, l, a * 0.75)
      end
    end
  end
end

in_thread do
  (1..${bars}).each { |b| puts "bar #{b}"; sleep 4 }
end
`;
fs.writeFileSync(path.join(dir, slug + '-recreation.rb'), rb);
console.log(`${path.join(dir, slug + '-recreation.rb')}: ${notes.length} notes, ${bars} bars at ${bpm} bpm`);
