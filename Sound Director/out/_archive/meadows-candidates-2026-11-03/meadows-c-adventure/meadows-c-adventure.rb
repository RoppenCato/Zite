# Cloverfield Meadows, the board: candidate C, "adventure" (Robin, 2026-11-03: three candidates, different instruments, about a minute each).
# name: meadows-c-adventure
# bpm: 120
# bars: 30
# beats: 4
# stems: full
#
# F major, 120 bpm, 30 bars = 60.0 s. Voices (mine), by Robin's own rule for adventure (2026-10-15, after the sea voyage, "more like Wind Waker"): a brass lead on a
# broad tune with big leaps and long notes, strings doubling it, an accompaniment that never stops running (bowed eighths), plucked bass, light timpani and harp
# sweeps at the turns. No flute, no bells: not a lullaby.
# THE HOOK, half notes and a leap:  C5 F5 G5 | A5 G5 | F5 E5 D5 C5 | E5   then   C5 F5 G5 | A5 C6 A5 | G5 F5 E5 G5 | F5
#   bars  1- 2  intro   the running strings and the timpani
#   bars  3-10  A       the hook on the horn
#   bars 11-18  A       the hook on the horn with the strings doubling it an octave up
#   bars 19-26  B       a second tune in quarters, horn and strings together, on Dm Bb F C
#   bars 27-30  A       the hook's second half, everything, home on F; the last bar stops short for the loop

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
eval File.read("C:/dev/Zite/Sound Director/music/_fight.rb")

STEM = :full
PASSES = 1
SEED = 3300
MASTER = 1.03                          # 0.6 measured -22.7 LUFS; +4.7 dB to about -18

use_bpm 120
set_sched_ahead_time! 1
BARS = 30
TOTAL = BARS * 4

A_CH = %w[F F Bb C F Dm C7 F]
B_CH = %w[Dm Bb F C Dm Bb Gm C7]
CHORDS = %w[F F] + A_CH * 2 + B_CH + %w[F Dm C7 F]
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS
define :section do |b|
  if b <= 2 then :intro elsif b <= 10 then :a elsif b <= 18 then :a2 elsif b <= 26 then :b else :a3 end
end

R1 = "r:w | "
HOOK = "C5:h F5:q. G5:e | A5:h. G5:q | F5:q E5:q D5:q C5:q | E5:w | C5:h F5:q. G5:e | A5:h C6:q A5:q | G5:q F5:q E5:q G5:q | F5:w | "
TUNE_B = "D5:q E5:q F5:q A5:q | Bb5:h. A5:q | A5:q G5:q F5:q C5:q | E5:w | D5:q E5:q F5:q A5:q | D6:h. C6:q | Bb5:q A5:q G5:q D5:q | E5:h. G5:q | "
LAST = "C5:h F5:q. G5:e | A5:h C6:q A5:q | G5:q F5:q E5:q G5:q | F5:h. r:q | "

HORN = WARHORN
STR_UP = lambda { |n, d, a| STRS.call(n + 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.06, tj = 0.008|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * 4}: #{str[0, 40]}" if (beats - bars * 4).abs > 0.001
  play_line str, inst, amp, aj, tj
end

# the horn carries the tune; a horn wants about 1.6 times a flute's amp (docs/sonic-pi-notes.md)
define :part_horn do
  # the intro: the horn's call over the running strings (the first render's intro was a 12 dB hole)
  written "C5:q. F5:e A5:h | C6:h. r:q | ", 2, HORN, 1.5 * MASTER
  written HOOK, 8, HORN, 1.7 * MASTER
  written HOOK, 8, HORN, 1.6 * MASTER
  written TUNE_B, 8, HORN, 1.6 * MASTER
  written LAST, 4, HORN, 1.75 * MASTER
end
# the strings double the horn: an octave up in A', in unison in B and the last bars (strings double, they do not lead alone)
define :part_strings do
  written R1 * 10, 10, STRS, 0
  written HOOK, 8, STR_UP, 0.9 * MASTER
  written TUNE_B, 8, STRS, 1.0 * MASTER
  written LAST, 4, STR_UP, 0.9 * MASTER
end

# the engine: bowed eighths on the chord in the middle register, never stopping, accented on the beat
define :part_ostinato do
  (1..BARS).each do |b|
    ns = CH[b - 1][:notes].map { |n| n > 65 ? n - 12 : n }
    pat = [ns[0], ns[2], ns[1] + 12, ns[2], ns[0] + 12, ns[2], ns[1] + 12, ns[2]]
    pat.each_with_index do |n, i|
      m, dt = hum(0.06, 0.005)
      if b == BARS && i >= 6
        sleep 0.5
        next
      end
      time_warp(dt) { SHORTBOW.call(n, 0.9 * MASTER * m * (i % 2 == 0 ? 1.1 : 0.8)) }
      sleep 0.5
    end
  end
end

define :part_bass do
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})"
    [[r, 2], [r + 7, 2]].each_with_index do |(n, d), i|
      m, dt = hum(0.05, 0.004)
      unless b == BARS && i == 1
        time_warp(dt) { synth :pluck, note: n, coef: 0.45, pluck_decay: 12, amp: 1.1 * MASTER * m; synth :sine, note: n + 12, attack: 0.005, release: 0.45, amp: 0.2 * MASTER * m }
      end
      sleep d
    end
  end
end

# timpani on one, a roll into each section; a harp's sweep on the last beat before A' and B
define :part_drums do
  (1..BARS).each do |b|
    m, dt = hum(0.06, 0.003)
    time_warp(dt) { fk_lo(0.55 * MASTER * m) }
    time_warp(2 + dt) { fk_hand(0.6 * MASTER * m) } unless b == BARS
    if [2, 10, 18, 26].include?(b)
      time_warp(3) { fk_roll(4, 0.25 * MASTER, 0.6 * MASTER) }
      ns = CH[b % BARS][:notes]
      time_warp(3) { 8.times { |i| time_warp(i * 0.12) { synth :pluck, note: ns[i % 3] + 12 * (1 + i / 3), coef: 0.25, pluck_decay: 25, amp: (0.3 + i * 0.05) * MASTER } } }
    end
    sleep 4
  end
end

marker
in_thread(name: :room) do
  with_fx :reverb, mix: 0.3, room: 0.75, damp: 0.5 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_horn } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_strings } }
    in_thread { use_random_seed SEED + 3; PASSES.times { part_drums } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :close) do
  with_fx :reverb, mix: 0.15, room: 0.5, damp: 0.6 do
    in_thread { use_random_seed SEED + 4; PASSES.times { part_ostinato } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 5; PASSES.times { part_bass } }
end
