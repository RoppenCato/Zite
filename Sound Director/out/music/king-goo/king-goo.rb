# King Goo's fight: music/king-goo (Miles, GD's name). The meadows' boss, an enormous slime in a tiny stolen crown: bigger, comic, a tuba somewhere (Miles, GD's brief).
# name: king-goo
# bpm: 132
# bars: 46
# beats: 3
# stems: full
#
# C minor, three-four, 132 bpm, 46 bars = 62.7 s (the boss budget: 60 to 90 s). Mine: an oompah, the tuba (a low horn) on one and short bowed chords on two and three,
# a horn tune that marches up and wobbles back, a chromatic slither on the bells for the slime. Drums from the first bar, as every fight (maple-guide section 7).
#   bars  1- 4  oompah    the tuba and the pah-pahs alone, the war drum on one: the king arrives
#   bars  5-20  A         the horn's tune, sixteen bars
#   bars 21-28  B         the bells' chromatic slither, the strings under them, the oompah on
#   bars 29-44  A         the tune again with the strings an octave up and the bells, the drums bigger
#   bars 45-46  tail      the tuba's last oom; the last bar stops short for the loop

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
eval File.read("C:/dev/Zite/Sound Director/music/_fight.rb")

STEM = :full
PASSES = 1
SEED = 4200
MASTER = 1.0

use_bpm 132
set_sched_ahead_time! 1
BARS = 46
BB = 3
TOTAL = BARS * BB

A_CH = %w[Cm Cm G7 G7 Cm Cm Fm G7 Ab Ab Fm Fm Cm G7 Cm Cm]
B_CH = %w[Ab Ab Bb Bb Ab G7 G7 G7]
CHORDS = %w[Cm Cm G7 Cm] + A_CH + B_CH + A_CH + %w[Cm Cm]
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS
define :section do |b|
  if b <= 4 then :intro elsif b <= 20 then :a elsif b <= 28 then :b elsif b <= 44 then :a2 else :tail end
end

R3 = "r:h. | "
TUNE = "C5:q Eb5:q G5:q | C6:h. | B4:q D5:q F5:q | G5:h. | Eb5:q D5:q C5:q | G5:h G4:q | Ab4:q C5:q F5:q | D5:h. | " +
       "C5:q Eb5:q Ab5:q | G5:h F5:q | F5:q Ab5:q C6:q | Bb5:h Ab5:q | G5:q Eb5:q C5:q | D5:q F5:q B4:q | C5:h. | r:h. | "
SLITHER = "Eb6:q D6:q Eb6:q | C6:h. | D6:q C#6:q D6:q | Bb5:h. | C6:q B5:q C6:q | B5:q D6:q F6:q | G6:h. | r:h. | "
TUBA = lambda { |n, d, a| WARHORN.call(n, d, a) }
STR_UP = lambda { |n, d, a| STRS.call(n + 12, d, a) }
BELL_UP = lambda { |n, d, a| BELL.call(n + 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.06, tj = 0.008|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * BB}: #{str[0, 40]}" if (beats - bars * BB).abs > 0.001
  play_line str, inst, amp, aj, tj
end

define :part_horn do
  # the arrival call and the closing phrase (the first render's intro and tail were 7 to 8 dB holes)
  written "G4:q C5:q Eb5:q | G5:h. | F5:q Eb5:q D5:q | G4:h. | ", 4, WARHORN, 1.6 * MASTER
  written TUNE, 16, WARHORN, 1.7 * MASTER
  written "C5:h. | C5:h. | D5:h. | D5:h. | C5:h. | B4:h. | B4:h. | D5:h. | ", 8, WARHORN, 1.2 * MASTER   # the slither's held line under the bells
  written TUNE, 16, WARHORN, 1.8 * MASTER
  written "C5:q G4:q Eb5:q | C5:h r:q | ", 2, WARHORN, 1.6 * MASTER
end
define :part_upper do
  written R3 * 20, 20, BELL, 0
  written SLITHER, 8, BELL, 1.4 * MASTER
  written TUNE, 16, BELL_UP, 0.45 * MASTER
  written R3 * 2, 2, BELL, 0
end
define :part_strings do
  written R3 * 20, 20, STRS, 0
  written SLITHER.gsub(/([A-G][#b]?)6/, '\\15'), 8, STRS, 1.3 * MASTER
  written TUNE, 16, STR_UP, 0.85 * MASTER
  written R3 * 2, 2, STRS, 0
end
# the oompah: the tuba's root (a low horn, about twice a flute's amp: docs/sonic-pi-notes.md) on one, short bowed chords on two and three
define :part_oompah do
  (1..BARS).each do |b|
    c = CH[b - 1]
    r = c[:bass] - 12
    r += 12 if r < 36
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})"
    m, dt = hum(0.04, 0.003)
    time_warp(dt) { TUBA.call(r, 0.8, 2.0 * MASTER * m) }
    unless b == BARS
      [1, 2].each do |k|
        time_warp(k + dt) { c[:notes].map { |n| n > 67 ? n - 12 : n }.each { |n| SHORTBOW.call(n, 0.5 * MASTER * m) } }
      end
    end
    sleep BB
  end
end
define :part_drums do
  (1..BARS).each do |b|
    s = section(b)
    m, dt = hum(0.05, 0.003)
    unless b == BARS
      time_warp(dt) { (s == :a2 ? fk_big(0.8 * MASTER * m) : fk_lo(0.65 * MASTER * m)) }
      time_warp(1 + dt) { fk_hand(0.45 * MASTER * m) }
      time_warp(2 + dt) { fk_hand(0.4 * MASTER * m) }
      fk_crash(0.45 * MASTER) if [5, 21, 29].include?(b)
      time_warp(2) { fk_roll(4, 0.25 * MASTER, 0.55 * MASTER) } if b % 4 == 0 && b < 44
    end
    sleep BB
  end
end

marker
in_thread(name: :room) do
  with_fx :reverb, mix: 0.24, room: 0.65, damp: 0.5 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_horn } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_upper } }
    in_thread { use_random_seed SEED + 3; PASSES.times { part_strings } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 4; PASSES.times { part_oompah } }
  in_thread { use_random_seed SEED + 5; PASSES.times { part_drums } }
end
