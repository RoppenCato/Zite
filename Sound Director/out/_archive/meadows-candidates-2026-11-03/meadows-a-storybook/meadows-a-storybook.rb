# Cloverfield Meadows, the board: candidate A, "storybook" (Robin, 2026-11-03: "Try making three different meadows candidates. Use different instruments. Around 1 min each.")
# name: meadows-a-storybook
# bpm: 126
# bars: 32
# beats: 4
# stems: full
#
# G major, 126 bpm, 32 bars = 61.0 s. Voices (mine, Robin gave the calls): a kalimba leads, a glockenspiel doubles and answers, a plucked guitar plays the
# off-beats, a plucked bass walks, a woodblock on 2 and 4, a shaker. No pad, no harp, no flute: toy-like and dry, a music box that walks.
# THE HOOK, cell quarter-eighth-eighth-quarter-quarter:  B4 D5 E5 G5 E5 | D5 B4 G4 | C5 E5 G5 A5 G5 | F#5   (da da-da DUM da | DUM-da DUM)
#   bars  1- 2  intro   the guitar's off-beats, bass, woodblock: the walk
#   bars  3-10  A       the hook on the kalimba
#   bars 11-18  A'      the hook again, the glockenspiel doubling it an octave up, a new ending
#   bars 19-26  B       the glockenspiel's own tune in half notes, the kalimba running eighths under it
#   bars 27-30  A       the hook's answer, both voices
#   bars 31-32  tail    the glockenspiel's turn, the last bar stops short for the loop

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")

STEM = :full
PASSES = 1
SEED = 3100
MASTER = 2.3                           # 0.6 measured -30.2 LUFS (the kalimba and plucks are quiet synths); +12 dB to about -18

use_bpm 126
set_sched_ahead_time! 1
BARS = 32
TOTAL = BARS * 4

CHORDS = %w[G G] + %w[G Em C D G Em D7 G] * 2 + %w[C Am D7 G Em C D7 D] + %w[G Em D7 G] + %w[G G]
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS
define :section do |b|
  if b <= 2 then :intro elsif b <= 10 then :a elsif b <= 18 then :a2 elsif b <= 26 then :b elsif b <= 30 then :a3 else :tail end
end

R1 = "r:w | "
H4 = "B4:q D5:e E5:e G5:q E5:q | D5:q. B4:e G4:h | C5:q E5:e G5:e A5:q G5:q | F#5:h. r:q | "
H8 = H4 + "B4:q D5:e E5:e G5:q E5:q | D5:q. B4:e G4:h | A4:q C5:e E5:e D5:q C5:q | G4:h. r:q | "
H8B = H4 + "B4:q D5:e E5:e G5:q E5:q | D5:q. B4:e G4:h | A4:q C5:e E5:e D5:q C5:q | A4:q B4:e D5:e G5:h | "
ANS = "B4:q D5:e E5:e G5:q E5:q | D5:q. B4:e G4:h | A4:q C5:e E5:e D5:q C5:q | G4:h. r:q | "
TUNE_B = "E5:h. D5:q | C5:h G4:h | D5:h. C5:q | B4:w | E5:h. F#5:q | G5:h E5:h | F#5:q E5:q D5:q C5:q | D5:w | "
TURN = "G5:e B5:e D6:e G6:e B6:h | G6:h. r:q | "

KALIMBA = lambda do |n, d, amp|
  next if amp <= 0
  synth :kalimba, note: n, clickiness: 0.35, amp: amp * 1.3
  synth :sine, note: n, attack: 0.003, release: [d * 0.5, 0.25].max, amp: amp * 0.18
end
GLOCK = lambda { |n, d, a| BELL.call(n + 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.07, tj = 0.008|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * 4}: #{str[0, 40]}" if (beats - bars * 4).abs > 0.001
  play_line str, inst, amp, aj, tj
end

define :part_lead do
  # the intro: the kalimba already running on G (the first render's intro was a 6 dB hole)
  [1, 2].each do |b|
    ns = CH[b - 1][:notes]
    [ns[0], ns[1], ns[2], ns[1] + 12, ns[0] + 12, ns[2], ns[1], ns[2]].each_with_index do |n, i|
      m, dt = hum(0.08, 0.008)
      time_warp(dt) { KALIMBA.call(n, 0.5, 0.62 * MASTER * m * (i % 2 == 0 ? 1.0 : 0.8)) }
      sleep 0.5
    end
  end
  written H8, 8, KALIMBA, 1.0 * MASTER
  written H8B, 8, KALIMBA, 1.0 * MASTER
  # B: the kalimba runs eighths on the chord under the glockenspiel's tune
  (19..26).each do |b|
    ns = CH[b - 1][:notes]
    [ns[0], ns[1], ns[2], ns[1] + 12, ns[0] + 12, ns[2], ns[1], ns[2]].each_with_index do |n, i|
      m, dt = hum(0.08, 0.008)
      time_warp(dt) { KALIMBA.call(n, 0.5, 0.62 * MASTER * m * (i % 2 == 0 ? 1.0 : 0.8)) }
      sleep 0.5
    end
  end
  written ANS, 4, KALIMBA, 1.0 * MASTER
  written R1 * 2, 2, KALIMBA, 0
end

define :part_glock do
  written R1 * 10, 10, GLOCK, 0
  written H8B, 8, GLOCK, 0.55 * MASTER
  written TUNE_B, 8, GLOCK, 0.8 * MASTER
  written ANS, 4, GLOCK, 0.5 * MASTER
  written TURN, 2, GLOCK, 0.7 * MASTER
end

# the guitar: a plucked chord on every off-beat, a strum (12 ms between strings), louder on the "and" of 4
define :part_guitar do
  (1..BARS).each do |b|
    ns = CH[b - 1][:notes].map { |n| n > 67 ? n - 12 : n }
    4.times do |i|
      sleep 0.5
      m, dt = hum(0.1, 0.006)
      if b == BARS && i == 3
        sleep 0.5
        next
      end
      time_warp(dt) do
        ns.each_with_index { |n, k| time_warp(k * 0.025) { synth :pluck, note: n, coef: 0.3, pluck_decay: 20, noise_amp: 0.6, amp: 0.5 * MASTER * m * (i == 3 ? 1.1 : 0.9) } }
      end
      sleep 0.5
    end
  end
end

# the bass: a plucked string, root on 1, fifth on 3, a step into the next bar
define :part_bass do
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    rn = CH[b % BARS][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})"
    steps = b == BARS ? [[r, 2], [nil, 2]] : [[r, 1.5], [r, 0.5], [r + 7, 1.5], [rn == r ? r + 7 : rn - 5 + (rn - 5 < 36 ? 12 : 0), 0.5]]
    steps.each do |n, d|
      m, dt = hum(0.05, 0.004)
      time_warp(dt) { synth :pluck, note: n, coef: 0.45, pluck_decay: 12, noise_amp: 0.5, amp: 1.1 * MASTER * m } if n
      time_warp(dt) { synth :sine, note: n + 12, attack: 0.005, release: 0.35, amp: 0.2 * MASTER * m } if n
      sleep d
    end
  end
end

define :part_perc do
  (1..BARS).each do |b|
    8.times do |i|
      m, dt = hum(0.1, 0.005)
      time_warp(dt) { shaker(0.55 * MASTER * m * (i.odd? ? 0.9 : 0.55)) } unless section(b) == :intro && b == 1
      sample :elec_wood, rate: 1.6, amp: 0.45 * MASTER * m if i == 2 || i == 6
      sleep 0.5
    end
  end
end

marker
in_thread(name: :room) do
  with_fx :reverb, mix: 0.25, room: 0.6, damp: 0.5 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_lead } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_glock } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :close) do
  with_fx :reverb, mix: 0.12, room: 0.4, damp: 0.6 do
    in_thread { use_random_seed SEED + 3; PASSES.times { part_guitar } }
    in_thread { use_random_seed SEED + 4; PASSES.times { part_perc } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 5; PASSES.times { part_bass } }
end
