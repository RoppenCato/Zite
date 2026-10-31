# <Place, state>: what the piece is for, in one line.
# name: <place-name>
# bpm: 110
# bars: 16
# beats: 4
# stems: full
#
# <Key>, <bpm>, <bars> bars = <seconds> a loop. The form:
#   bars  1- 4  intro    ...
#   bars  5-12  A        the hook: <note names> ...
#   bars 13-16  B        ...
# One mix (no danger layer: Robin, 2026-10-14). Parts keep :base/:calm tags so stems could be rendered apart if ever asked.

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")

STEM = :full
PASSES = 1
SEED = 1000
MASTER = 0.55                          # set by measurement: peak under -1 dBFS, full RMS -22 to -16

use_bpm 110
set_sched_ahead_time! 1               # a second of headroom for the scheduler: many parts start at once (a render, not a performance)
BARS = 16
TOTAL = BARS * 4

CHORDS = %w[F Bb F C  F Dm7 Bb C F Am7 Bb C7  Gm7 C7 F F]
CH = CHORDS.map { |s| sym_chord(s) }

define :section do |b|
  if b <= 4 then :intro
  elsif b <= 12 then :a
  else :b
  end
end

# ---- the written lines (the game's notation; eight bars to a string) --------------------------------------
R1 = "r:w | "
LEAD_A = "F5:q. E5:e D5:q C5:q | D5:q. C5:e A4:h | Bb4:e C5:e D5:q F5:q D5:q | C5:h. r:q | " +
         "F5:e E5:e F5:q G5:e F5:e E5:q | E5:q C5:e A4:e C5:h | D5:q. C5:e Bb4:q A4:q | F4:w | "

define :written do |str, bars, inst, amp, aj = 0.08, tj = 0.012|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * 4}: #{str[0, 40]}" if (beats - bars * 4).abs > 0.001
  play_line str, inst, amp, aj, tj
end

# ---- the parts: all bars of one pass each; hum for every event; sound only when the stem is on ---------
define :part_lead do
  a = stem_on?(:calm) ? 0.9 * MASTER : 0
  written R1 * 4, 4, FLUTE, a
  written LEAD_A, 8, FLUTE, a
  written R1 * 4, 4, FLUTE, a
end

define :part_harp do
  a = stem_on?(:calm) ? 0.75 * MASTER : 0
  (1..BARS).each do |b|
    n0, n1, n2 = CH[b - 1][:notes][0], CH[b - 1][:notes][1], CH[b - 1][:notes][2]
    [n0, n1, n2, n0 + 12, n1 + 12, n0 + 12, n2, n1].each_with_index do |n, i|
      m, dt = hum(0.1, 0.01)
      time_warp(dt) { HARP.call(n, 0.5, a * m * (i % 4 == 0 ? 0.9 : 0.65)) }
      sleep 0.5
    end
  end
end

define :part_pad do
  a = stem_on?(:base) ? 0.8 * MASTER : 0
  (1..BARS).each do |b|
    c = CH[b - 1]
    m, dt = hum(0.05, 0.0)
    [c[:notes][0] - 12, c[:notes][1], c[:notes][2]].each { |n| STRINGS.call(n, 4, a * m) }
    sleep 4
  end
end

define :part_bass do
  a = stem_on?(:base) ? 0.85 * MASTER : 0
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    rn = CH[b % BARS][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})" if STEM == :full || STEM == :base
    last = rn != r ? (rn > r ? rn - 1 : rn + 1) : r
    [[0, 1.5, r, 1.0], [1.5, 0.5, r, 0.7], [2, 1, r + 7, 0.9], [3, 0.5, r + 7, 0.7], [3.5, 0.5, last, 0.75]].each do |at, d, n, v|
      m, dt = hum(0.05, 0.005)
      time_warp(dt) { BASS.call(n, d, a * m * v) } if section(b) != :intro
      sleep d
    end
  end
end

define :part_perc do
  as = stem_on?(:calm) ? 0.7 * MASTER : 0
  ar = stem_on?(:base) ? 0.7 * MASTER : 0
  (1..BARS).each do |b|
    8.times do |i|
      m, dt = hum(0.1, 0.006)
      if section(b) != :intro
        time_warp(dt) { shaker(as * m * (i.odd? ? 0.9 : 0.6)) }
        rim(ar) if i == 2 || i == 6
      end
      sleep 0.5
    end
  end
end

# ---- the piece -----------------------------------------------------------------------------------------
marker                                # beat one of pass one, for the renderer

in_thread(name: :room) do
  with_fx :reverb, mix: 0.3, room: 0.72, damp: 0.45 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_lead } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_harp } }
    in_thread { use_random_seed SEED + 3; PASSES.times { part_perc } }
    sleep PASSES * TOTAL + 8
  end
end

in_thread(name: :close) do
  with_fx :reverb, mix: 0.18, room: 0.5, damp: 0.6 do
    in_thread { use_random_seed SEED + 4; PASSES.times { part_pad } }
    sleep PASSES * TOTAL + 8
  end
end

in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 5; PASSES.times { part_bass } }
end
