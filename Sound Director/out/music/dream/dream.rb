# The Dream: music/dream, one tune for the Dreaming Isle and for a run (Miles, GD allowed one for both, 2026-11-03). Calm and magical, a little eerie in the middle.
# name: dream
# bpm: 96
# bars: 32
# beats: 4
# stems: full
#
# D Lydian (the raised fourth, G#, is the magic), 96 bpm, 32 bars = 80.0 s. Mine. The board theme's walking cell (eighth, eighth, quarter) carries the tune, so the Dream is
# still Zite. Against the lullaby (Robin, 2026-10-15: flute, harp, bells and pad together read as one): the lead is a clarinet, the piano runs in eighths under it as the
# middle voice, a hand drum on one and three keeps it moving; bells only answer. The eerie part is a borrowed Bb and C over a low bowed line, then home.
# THE HOOK: A4 B4 D5, D5 E5 F#5 | G#5 F#5 E5 B4 | A4 B4 D5, D5 E5 A5 | G#5
#   bars  1- 8  A   the clarinet's hook over Dmaj7 E/D, Bm7 Gmaj7 Em7 A7
#   bars  9-16  A'  the bells take the hook an octave up, the clarinet answers under them
#   bars 17-24  B   the eerie stretch: Bb C D, strings broad and low, the bells shimmering, the piano still running
#   bars 25-32  A   the hook on the clarinet with the bells doubling, home; the last bar stops short for the loop

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
eval File.read("C:/dev/Zite/Sound Director/music/_fight.rb")

STEM = :full
PASSES = 1
SEED = 4400
MASTER = 1.0                           # 0.75 measured -20.7 LUFS

use_bpm 96
set_sched_ahead_time! 1
BARS = 32
TOTAL = BARS * 4

A_CH = %w[Dmaj7 E/D Dmaj7 E/D Bm7 Gmaj7 Em7 A7]
B_CH = %w[Bb C Dmaj7 Dmaj7 Bb C Asus A7]
CHORDS = A_CH + A_CH + B_CH + A_CH
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS
define :section do |b|
  if b <= 8 then :a elsif b <= 16 then :a2 elsif b <= 24 then :b else :a3 end
end

HOOK = "A4:e B4:e D5:q D5:e E5:e F#5:q | G#5:q F#5:e E5:e B4:h | A4:e B4:e D5:q D5:e E5:e A5:q | G#5:h. r:q | " +
       "F#5:q D5:e B4:e D5:q F#5:q | B5:h A5:q F#5:q | G5:q F#5:e E5:e D5:q B4:q | C#5:h. r:q | "
ANSWER = "r:w | r:h B4:e C#5:e E5:q | r:w | r:h A4:e B4:e C#5:q | r:w | r:h D5:e E5:e F#5:q | r:w | r:h E5:e D5:e C#5:q | "
BROAD = "D5:w | E5:w | F#5:h. A5:q | F#5:w | D5:w | E5:h. G5:q | E5:w | C#5:w | "
LAST = HOOK.sub("C#5:h. r:q | ", "C#5:h. r:q | ")
R1 = "r:w | "
BELL_UP = lambda { |n, d, a| BELL.call(n + 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.07, tj = 0.01|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * 4}: #{str[0, 40]}" if (beats - bars * 4).abs > 0.001
  play_line str, inst, amp, aj, tj
end

define :part_clarinet do
  written HOOK, 8, CLARINET, 1.2 * MASTER
  written ANSWER, 8, CLARINET, 1.0 * MASTER
  written R1 * 8, 8, CLARINET, 0
  written LAST, 8, CLARINET, 1.2 * MASTER
end
define :part_bells do
  written R1 * 8, 8, BELL, 0
  written HOOK, 8, BELL_UP, 0.95 * MASTER   # 0.6 left A' 3 dB under A
  # the eerie stretch: single high bells on the chord tones, slow
  (17..24).each do |b|
    ns = CH[b - 1][:notes]
    [[0, ns[2] + 24], [1.5, ns[1] + 24], [3, ns[0] + 24]].each do |t, n|
      m, dt = hum(0.08, 0.01)
      time_warp(t + dt) { BELL.call(n, 1, 0.5 * MASTER * m) }
    end
    sleep 4
  end
  written LAST, 8, BELL_UP, 0.4 * MASTER
end
define :part_strings do
  written R1 * 16, 16, STRS, 0
  written BROAD, 8, STRS, 1.9 * MASTER
  written R1 * 8, 8, STRS, 0
end
define :part_pad do
  (1..BARS).each do |b|
    c = CH[b - 1]
    d = b == BARS ? 2 : 4
    m, _ = hum(0.05, 0.0)
    [c[:notes][0] - 12, c[:notes][1], c[:notes][2]].each { |n| STRINGS.call(n, d, 0.55 * MASTER * m) }
    sleep 4
  end
end
# the middle voice: the piano running eighths on the chord, never stopping
define :part_piano do
  (1..BARS).each do |b|
    ns = CH[b - 1][:notes].map { |n| n > 66 ? n - 12 : n }
    pat = [ns[0], ns[2], ns[1] + 12, ns[2], ns[0] + 12, ns[2], ns[1] + 12, (ns[3] || ns[2])]
    pat.each_with_index do |n, i|
      m, dt = hum(0.08, 0.008)
      time_warp(dt) { PIANO.call(n, 0.5, 0.48 * MASTER * m * (i % 2 == 0 ? 1.0 : 0.78)) } unless b == BARS && i >= 4
      sleep 0.5
    end
  end
end
define :part_bass do
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})"
    [[r, 2], [r + 7, 2]].each_with_index do |(n, d), i|
      m, dt = hum(0.04, 0.004)
      time_warp(dt) { BASS.call(n, d * 0.9, 0.8 * MASTER * m) } unless b == BARS && i == 1
      sleep d
    end
  end
end
define :part_drum do
  (1..BARS).each do |b|
    m, dt = hum(0.06, 0.004)
    unless b == BARS
      time_warp(dt) { fk_hand(0.45 * MASTER * m) }
      time_warp(2 + dt) { fk_hand(0.3 * MASTER * m) }
    end
    sleep 4
  end
end

marker
in_thread(name: :room) do
  with_fx :reverb, mix: 0.38, room: 0.85, damp: 0.45 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_clarinet } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_bells } }
    in_thread { use_random_seed SEED + 3; PASSES.times { part_strings } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :close) do
  with_fx :reverb, mix: 0.2, room: 0.6, damp: 0.5 do
    in_thread { use_random_seed SEED + 4; PASSES.times { part_piano } }
    in_thread { use_random_seed SEED + 5; PASSES.times { part_pad } }
    in_thread { use_random_seed SEED + 6; PASSES.times { part_drum } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 7; PASSES.times { part_bass } }
end
