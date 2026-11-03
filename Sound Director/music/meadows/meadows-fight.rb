# Cloverfield Meadows, a fight: music/meadows-fight (Miles, GD's name). Bouncy, a little urgent, never grim; 45 to 60 s (Miles, GD's budget).
# name: meadows-fight
# bpm: 140
# bars: 32
# beats: 4
# stems: full
#
# E minor, 140 bpm, 32 bars = 54.9 s. Mine, after Robin kept the board theme (2026-11-03: "keep what we had"): the same walking cell (eighth, eighth, quarter) in minor,
# so the fight is the meadows' own. Robin's fight rules (maple-guide section 7): drums from the first bar, a fill every four bars, no lyre and no plucked or short
# repeated synth note (the bass is the studio's FM bass, the drive is a low drum played fast), no relative-major chord (C and D, the minor's VI and VII, are heroic
# enough), the raised seventh at the cadence (B7). Lead: the war horn; strings double it.
# THE HOOK: B4 C5 E5, E5 F#5 G5 | F#5 E5 C5 B4 | ... | B5 G5 F#5   (the board's D5 E5 G5, G5 A5 B5 | A5 G5 E5 D5, turned to minor)
#   bars  1- 8  A        the hook on the horn, the war drum and the hand drum
#   bars  9-16  A'       the hook, the strings doubling it an octave up, the low drum running
#   bars 17-24  B        the horn's broad line in half notes on C D Am B7, the drums driving
#   bars 25-32  A        the hook with everything; the last bar stops short for the loop

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
eval File.read("C:/dev/Zite/Sound Director/music/_fight.rb")

STEM = :full
PASSES = 1
SEED = 4100
MASTER = 1.0                           # fight pieces at 1.0, then measure (2026-10-15)

use_bpm 140
set_sched_ahead_time! 1
BARS = 32
TOTAL = BARS * 4

A_CH = %w[Em Cmaj7 Em B7 Em Cmaj7 Am7 B7]
B_CH = %w[C D Am B7 C Am D B7]
CHORDS = A_CH + A_CH + B_CH + A_CH
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS
define :section do |b|
  if b <= 8 then :a elsif b <= 16 then :a2 elsif b <= 24 then :b else :a3 end
end

HOOK = "B4:e C5:e E5:q E5:e F#5:e G5:q | F#5:q E5:e C5:e B4:h | B4:e C5:e E5:q E5:e F#5:e G5:q | B5:q. G5:e F#5:q r:q | " +
       "B4:e C5:e E5:q E5:e F#5:e G5:q | F#5:q E5:e C5:e B4:h | A4:e B4:e C5:q E5:e D5:e C5:q | B4:h. r:q | "
HOOK_END = HOOK.sub("B4:h. r:q | ", "B4:h. r:q | ")
BROAD = "E5:h G5:h | F#5:h. D5:q | E5:h C5:h | B4:w | E5:h G5:h | A5:h. G5:q | F#5:q E5:q D5:q F#5:q | B4:w | "
STR_UP = lambda { |n, d, a| STRS.call(n + 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.06, tj = 0.006|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * 4}: #{str[0, 40]}" if (beats - bars * 4).abs > 0.001
  play_line str, inst, amp, aj, tj
end

define :part_horn do
  written HOOK, 8, WARHORN, 1.6 * MASTER
  written HOOK, 8, WARHORN, 1.6 * MASTER
  written BROAD, 8, WARHORN, 1.7 * MASTER
  written HOOK_END, 8, WARHORN, 1.7 * MASTER
end
define :part_strings do
  written "r:w | " * 8, 8, STRS, 0
  written HOOK, 8, STR_UP, 0.9 * MASTER
  written BROAD, 8, STRS, 1.0 * MASTER
  written HOOK_END, 8, STR_UP, 0.9 * MASTER
end
# the low bowed chord under everything, a bar at a time; the last bar two beats so nothing crosses the loop
define :part_bowl do
  (1..BARS).each do |b|
    ns = CH[b - 1][:notes]
    d = b == BARS ? 2 : 4
    m, _ = hum(0.05, 0.0)
    [ns[0] - 12, ns[1] - 12].each { |n| BOWL.call(n, d, 0.55 * MASTER * m) }
    sleep 4
  end
end
define :part_bass do
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})"
    steps = b == BARS ? [[r, 1], [r + 7, 1], [nil, 2]] : [[r, 1], [r, 0.5], [r + 7, 0.5], [r + 12, 1], [r + 7, 1]]
    steps.each do |n, d|
      m, dt = hum(0.04, 0.003)
      time_warp(dt) { BASS.call(n, d * 0.9, 0.9 * MASTER * m) } if n
      sleep d
    end
  end
end
# the drums: the war drum on 1, the low tom on 3, the hand drum on the off-beats; the low drum running in sixteenths from A'; a fill every fourth bar
define :part_drums do
  (1..BARS).each do |b|
    s = section(b)
    time_warp(3) { fk_roll(4, 0.3 * MASTER, 0.65 * MASTER) } if b % 4 == 0 && b != BARS   # the fill on the fourth beat, scheduled from the bar's start
    16.times do |i|
      m, dt = hum(0.06, 0.003)
      t = i * 0.25
      fill = (b % 4 == 0) && t >= 3
      unless b == BARS && t >= 3
        time_warp(dt) do
          fk_big(0.75 * MASTER * m) if i == 0
          fk_lo(0.6 * MASTER * m) if i == 8
          fk_hand(0.55 * MASTER * m) if [4, 12].include?(i) || (s == :b && [6, 14].include?(i))
          fk_rumble((i.even? ? 0.32 : 0.22) * MASTER * m) if s != :a && !fill
          fk_crash(0.5 * MASTER) if i == 0 && [9, 17, 25].include?(b)
        end
      end
      sleep 0.25
    end
  end
end

marker
in_thread(name: :room) do
  with_fx :reverb, mix: 0.22, room: 0.6, damp: 0.5 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_horn } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_strings } }
    in_thread { use_random_seed SEED + 3; PASSES.times { part_bowl } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 4; PASSES.times { part_bass } }
  in_thread { use_random_seed SEED + 5; PASSES.times { part_drums } }
end
