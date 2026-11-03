# The title: music/title (Miles, GD's name), the character screen, the first music heard; 30 to 45 s and under 1 MB (Miles, GD's budget). It ends on the Begin overture.
# name: title
# bpm: 108
# bars: 16
# beats: 4
# stems: full
#
# G major, 108 bpm, 16 bars = 35.6 s. The game's hook is the board theme's, which Robin kept (2026-11-03), so the title states it plainly and grandly: the theme every
# region's music can quote. A horn on the hook, strings under it and answering it, a piano running eighths as the middle voice, the FM bass, a hand drum on one.
#   bars  1- 8  the hook on the horn, the piano running, the strings holding the chords
#   bars  9-14  the board's second tune on the strings, the horn under it
#   bars 15-16  the hook's first bar again, home on G; the last bar stops short for the loop

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
eval File.read("C:/dev/Zite/Sound Director/music/_fight.rb")

STEM = :full
PASSES = 1
SEED = 4300
MASTER = 0.95                          # 0.75 measured -20.0 LUFS; +2 dB

use_bpm 108
set_sched_ahead_time! 1
BARS = 16
TOTAL = BARS * 4

CHORDS = %w[G C Em7 D7 G C Am7 G] + %w[Em7 C G D Am7 D7] + %w[G G]
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS

H1 = "D5:e E5:e G5:q G5:e A5:e B5:q | A5:q G5:e E5:e D5:h | "
HOOK = H1 + "D5:e E5:e G5:q G5:e A5:e B5:q | D6:q. B5:e A5:q r:q | " + H1 + "E5:e G5:e A5:q B5:e A5:e G5:q | G5:h. r:q | "
TUNE_B = "E5:h G5:q B5:q | C6:h. B5:e A5:e | B5:h D6:q G5:q | A5:w | E5:h G5:q B5:q | A5:h. r:q | "
TAIL = "D5:e E5:e G5:q G5:e A5:e B5:q | G5:h. r:q | "
R1 = "r:w | "
HORN_LOW = lambda { |n, d, a| WARHORN.call(n - 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.06, tj = 0.008|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * 4}: #{str[0, 40]}" if (beats - bars * 4).abs > 0.001
  play_line str, inst, amp, aj, tj
end

define :part_horn do
  written HOOK, 8, WARHORN, 1.6 * MASTER
  written TUNE_B, 6, HORN_LOW, 1.2 * MASTER
  written TAIL, 2, WARHORN, 1.6 * MASTER
end
define :part_strings do
  written R1 * 8, 8, STRS, 0
  written TUNE_B, 6, STRS, 1.4 * MASTER
  written R1 * 2, 2, STRS, 0
end
define :part_pad do
  (1..BARS).each do |b|
    c = CH[b - 1]
    d = b == BARS ? 2 : 4
    m, _ = hum(0.05, 0.0)
    [c[:notes][0] - 12, c[:notes][1], c[:notes][2]].each { |n| STRINGS.call(n, d, 0.7 * MASTER * m) } unless b >= 9 && b <= 14
    sleep 4
  end
end
define :part_piano do
  (1..BARS).each do |b|
    ns = CH[b - 1][:notes].map { |n| n > 67 ? n - 12 : n }
    pat = [ns[0], ns[2], ns[1] + 12, ns[2], ns[0] + 12, ns[2], ns[1] + 12, ns[2]]
    pat.each_with_index do |n, i|
      m, dt = hum(0.08, 0.008)
      time_warp(dt) { PIANO.call(n, 0.5, 0.5 * MASTER * m * (i % 2 == 0 ? 1.0 : 0.8)) } unless b == BARS && i >= 4
      sleep 0.5
    end
  end
end
define :part_bass do
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]}"
    [[r, 2], [r + 7, 2]].each_with_index do |(n, d), i|
      m, dt = hum(0.04, 0.004)
      time_warp(dt) { BASS.call(n, d * 0.9, 0.85 * MASTER * m) } unless b == BARS && i == 1
      sleep d
    end
  end
end
define :part_drum do
  (1..BARS).each do |b|
    m, dt = hum(0.05, 0.003)
    time_warp(dt) { fk_hand(0.5 * MASTER * m) } unless b == BARS
    time_warp(2 + dt) { fk_hand(0.35 * MASTER * m) } unless b == BARS
    sleep 4
  end
end

marker
in_thread(name: :room) do
  with_fx :reverb, mix: 0.3, room: 0.75, damp: 0.5 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_horn } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_strings } }
    in_thread { use_random_seed SEED + 3; PASSES.times { part_drum } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :close) do
  with_fx :reverb, mix: 0.16, room: 0.5, damp: 0.6 do
    in_thread { use_random_seed SEED + 4; PASSES.times { part_piano } }
    in_thread { use_random_seed SEED + 5; PASSES.times { part_pad } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 6; PASSES.times { part_bass } }
end
