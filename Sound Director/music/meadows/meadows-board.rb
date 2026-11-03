# Cloverfield Meadows, the board: the piece the player hears most. Strolling, cheerful, a tune to hum, the first place in the game.
# name: meadows-board
# bpm: 122
# bars: 72
# beats: 4
# stems: full
#
# G major, 122 bpm, 72 bars = 141.6 s a loop (Miles, GD's ceiling: 2.5 minutes, under 2.5 MB). Key and voices mine, 2026-11-01 (Robin gave the studios the
# calls for now). A new theme, so a new cell: the Survival meadow's hook was a dotted quarter and an eighth (F5:q. E5:e); this one is
# eighth-eighth-quarter, walking.
#
# THE HOOK, four bars, said twice with a changed ending, to hum from the names:
#   D5 E5 G5, G5 A5 B5 | A5 G5 E5 D5 | D5 E5 G5, G5 A5 B5 | D6 B5 A5 (a leap at the phrase's end)
#   da-da DUM, da-da DUM | DUM da-da DUM | da-da DUM, da-da DUM | DUUM-da DUM
#
# THE ENERGY in numbers, before any note (the new-track skill; a Maple-style day moves):
#   tempo 122; the lead 5 to 7 notes a bar in the hook; under a long note the piano's off-beats in eighths (4 chords a bar) and a bass walking in
#   quarters never stop; shaker in eighths and a rim on 2 and 4 in every bar but 45-48. Nothing is made calm by emptying it (Robin, 2026-10-14).
#   No harp arpeggios under the tune and no pad up front: flute, harp, bells and pad together read as a lullaby (Robin, 2026-10-15).
#
#   bars  1- 4  intro      the walk alone: piano off-beats, bass, shaker, rim; G and Gsus. The full engine from bar one
#   bars  5-12  A          the hook on the flute
#   bars 13-20  A'         the hook again, bells doubling the phrase ends an octave up, a pad enters, a higher ending
#   bars 21-28  B          the second tune, clarinet, low and climbing in half notes: a different cell and contour; Em7 C G D
#   bars 29-36  A clarinet the hook an octave down on the clarinet, bells answering in its gaps
#   bars 37-44  C          a piano melody on its own chords, the hook's cell with new pitches; one borrowed Bb in bar 43
#   bars 45-52  breakdown  Dsus held, the lead gone for four bars, the harp running, the bass on D, the rim out; fragments of the hook return, a tom's fill
#   bars 53-60  RETURN     the hook with everything: flute, bells doubling it all, the pad: the one big event
#   bars 61-68  B high     the second tune on the flute, an octave up
#   bars 69-72  tail       the hook's first bar and a half, the bells' turn, a harp's run; the last bar stops short for the loop
# One mix (Robin, 2026-10-14). The hook is heard five times in 2:22, in three colours.

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")

STEM = :full
PASSES = 1
SEED = 2100
MASTER = 0.56                          # place pieces at 0.6, then measure (2026-10-15): 0.6 peaked at -0.1 dBFS

use_bpm 122
set_sched_ahead_time! 1
BARS = 72
TOTAL = BARS * 4

HOOK_CH = %w[G C Em7 D7 G C Am7 G]
B_CH = %w[Em7 C G D Em7 C Am7 D7]
CHORDS = %w[G Gsus G Gsus] + HOOK_CH + HOOK_CH + B_CH + HOOK_CH + %w[Cmaj7 D7 Bm7 Em7 Cmaj7 D7 Bb D7] + %w[Dsus Dsus Dsus Dsus Dsus Dsus D7 D7] + HOOK_CH + B_CH + %w[G C G G]
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS

define :section do |b|
  if b <= 4 then :intro
  elsif b <= 20 then :a
  elsif b <= 28 then :b
  elsif b <= 36 then :a2
  elsif b <= 44 then :c
  elsif b <= 52 then :brk
  elsif b <= 60 then :ret
  elsif b <= 68 then :b2
  else :tail
  end
end

# ---- the written lines -----------------------------------------------------------------------------------------------------
R1 = "r:w | "
H1 = "D5:e E5:e G5:q G5:e A5:e B5:q | A5:q G5:e E5:e D5:h | "
HOOK_A = H1 + "D5:e E5:e G5:q G5:e A5:e B5:q | D6:q. B5:e A5:q r:q | " +
         H1 + "E5:e G5:e A5:q B5:e A5:e G5:q | G5:h. r:q | "
HOOK_A2 = H1 + "D5:e E5:e G5:q G5:e A5:e B5:q | D6:q. E6:e D6:q B5:q | " +
          H1 + "E5:e G5:e A5:q B5:e A5:e G5:q | A5:q B5:e A5:e G5:h | "
TUNE_B = "E4:h G4:q B4:q | C5:h. B4:e A4:e | B4:h D5:q G4:q | A4:w | " +
         "E4:h G4:q B4:q | C5:h E5:q D5:e C5:e | C5:q B4:q A4:q C5:q | D5:h. r:q | "
TUNE_C = "E5:e G5:e B5:q G5:e E5:e C5:q | D5:e F#5:e A5:q C6:h | B4:e D5:e F#5:q A5:e F#5:e D5:q | E5:h. r:q | " +
         "E5:e G5:e B5:q G5:e E5:e C5:q | D5:e F#5:e A5:q C6:h | D5:e F5:e Bb5:q A5:e F5:e D5:q | A5:h F#5:q E5:e D5:e | "
FRAGS = R1 * 4 + "r:h D5:e E5:e G5:q | " + R1 + "r:h G5:e A5:e B5:q | D6:h. r:q | "
TAIL = "D5:e E5:e G5:q G5:e A5:e B5:q | A5:q G5:e E5:e G5:h | " + R1 + R1

BELL_A2 = R1 * 2 + "D6:e E6:e G6:q G6:e A6:e B6:q | D7:q. E7:e D7:q B6:q | " + R1 * 2 + "E6:e G6:e A6:q B6:e A6:e G6:q | A6:q B6:e A6:e G6:h | "
BELL_ANS = R1 + "r:h D6:e E6:e G6:q | " + R1 + "r:h. A6:q | " + R1 + "r:h E6:e G6:e A6:q | " + R1 + "r:h D6:q G6:q | "
BELL_TAIL = R1 * 2 + "G5:e B5:e D6:e G6:e B6:h | G6:h. r:q | "

# octave shifts of a voice
CLAR_LOW = lambda { |n, d, a| CLARINET.call(n - 12, d, a) }
FLUTE_UP = lambda { |n, d, a| FLUTE.call(n + 12, d, a) }
BELL_UP = lambda { |n, d, a| BELL.call(n + 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.08, tj = 0.012|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * 4}: #{str[0, 40]}" if (beats - bars * 4).abs > 0.001
  play_line str, inst, amp, aj, tj
end

# ---- the parts ------------------------------------------------------------------------------------------------------------------
define :part_lead do
  a = 1.0 * MASTER
  written R1 * 4, 4, FLUTE, a
  written HOOK_A, 8, FLUTE, a
  written HOOK_A2, 8, FLUTE, a
  written TUNE_B, 8, CLARINET, 0.9 * MASTER
  written HOOK_A, 8, CLAR_LOW, 0.95 * MASTER
  written TUNE_C, 8, PIANO, 0.82 * MASTER, 0.08, 0.01   # 1.0 measured -17.5 dB, 0.62 -24.5: the piano's velocity follows its amp
  written FRAGS, 8, FLUTE, 1.0 * MASTER
  written HOOK_A2, 8, FLUTE, 1.05 * MASTER
  written TUNE_B, 8, FLUTE_UP, 1.0 * MASTER
  written TAIL, 4, FLUTE, 0.9 * MASTER
end

define :part_bell do
  a = 0.8 * MASTER
  written R1 * 12, 12, BELL, a
  written BELL_A2, 8, BELL, a
  written R1 * 8, 8, BELL, a
  written BELL_ANS, 8, BELL, a
  written R1 * 16, 16, BELL, a
  written HOOK_A2, 8, BELL_UP, 0.75 * MASTER
  written R1 * 8, 8, BELL, a
  written BELL_TAIL, 4, BELL, a
end

# the engine: the piano's off-beats, a chord in the middle register on every "and"; louder before the bar line
define :part_comp do
  (1..BARS).each do |b|
    ns = CH[b - 1][:notes].map { |n| n > 67 ? n - 12 : n }
    s = section(b)
    lvl = { intro: 0.68, a: 0.6, b: 0.66, a2: 0.66, c: 0.5, brk: 0.58, ret: 0.72, b2: 0.72, tail: 0.66 }[s] * MASTER
    4.times do |i|
      sleep 0.5
      m, dt = hum(0.1, 0.008)
      time_warp(dt) { ns.each { |n| PIANO.call(n, 0.4, lvl * m * (i == 3 ? 1.1 : 0.9)) } }
      sleep 0.5
    end
  end
end

# the walk: root, fifth, octave, then the fifth under the next chord; a pedal in the breakdown's first bars. Nothing crosses the loop point
define :part_bass do
  a = 0.95 * MASTER
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    rn = CH[b % BARS][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})"
    if b >= 45 && b <= 50
      [[r, 1.5], [r, 0.5], [r, 1.0], [r + 7, 1.0]].each do |n, d|
        m, dt = hum(0.05, 0.005)
        time_warp(dt) { BASS.call(n, d, a * m * 1.0) }
        sleep d
      end
    elsif b == BARS
      m, dt = hum(0.05, 0.005)
      BASS.call(r, 1, a * m)
      sleep 4
    else
      appr = rn == r ? r + 7 : rn - 5
      appr += 12 if appr < 36
      [r, r + 7, r + 12, appr].each_with_index do |n, i|
        m, dt = hum(0.05, 0.005)
        time_warp(dt) { BASS.call(n, 1, a * m * (i == 0 ? 1.0 : 0.82)) }
        sleep 1
      end
    end
  end
end

# the pad: from A' on, quiet; a pad never leads
define :part_pad do
  a = 0.55 * MASTER
  (1..BARS).each do |b|
    c = CH[b - 1]
    if b >= 13 && b != BARS
      m, _ = hum(0.05, 0.0)
      lv = (section(b) == :ret || section(b) == :b2) ? 1.2 : 0.85
      [c[:notes][0] - 12, c[:notes][1], c[:notes][2]].each { |n| STRINGS.call(n, 4, a * m * lv) }
    end
    sleep 4
  end
end

# the harp: only in the breakdown and the tail (with the flute and the bells under the tune it reads as a lullaby)
define :part_harp do
  a = 1.0 * MASTER                      # 0.8 left the breakdown at -26 dB, a hole; 1.25 put it over the return
  (1..BARS).each do |b|
    s = section(b)
    ns = CH[b - 1][:notes]
    if s == :brk
      [ns[0], ns[1], ns[2], ns[0] + 12, ns[1] + 12, ns[0] + 12, ns[2], ns[1]].each_with_index do |n, i|
        m, dt = hum(0.1, 0.01)
        time_warp(dt) { HARP.call(n, 0.5, a * m * (i % 4 == 0 ? 0.95 : 0.7)) }
        sleep 0.5
      end
    elsif b == 71
      [ns[0], ns[1], ns[2], ns[0] + 12, ns[1] + 12, ns[2] + 12, ns[0] + 24, ns[2] + 12].each do |n|
        m, dt = hum(0.1, 0.01)
        time_warp(dt) { HARP.call(n, 0.5, a * m * 0.7) }
        sleep 0.5
      end
    else
      sleep 4
    end
  end
end

define :part_perc do
  as = 0.8 * MASTER
  ar = 0.8 * MASTER
  (1..BARS).each do |b|
    s = section(b)
    8.times do |i|
      m, dt = hum(0.1, 0.006)
      time_warp(dt) { shaker(as * m * (i.odd? ? 0.95 : 0.6)) }
      rim(ar * (s == :ret ? 1.15 : 1.0)) if (i == 2 || i == 6) && !(b >= 45 && b <= 48)
      if b == 52 && i >= 4                       # a tom's fill into the return, light, never a kick
        sample :drum_tom_mid_soft, rate: 1.1 + (i - 4) * 0.12, amp: (0.25 + (i - 4) * 0.07) * MASTER * 1.3
      end
      sleep 0.5
    end
  end
end

# ---- the piece -----------------------------------------------------------------------------------------------------------------
marker

in_thread(name: :room) do
  with_fx :reverb, mix: 0.28, room: 0.7, damp: 0.5 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_lead } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_bell } }
    in_thread { use_random_seed SEED + 3; PASSES.times { part_harp } }
    in_thread { use_random_seed SEED + 4; PASSES.times { part_perc } }
    sleep PASSES * TOTAL + 8
  end
end

in_thread(name: :close) do
  with_fx :reverb, mix: 0.16, room: 0.5, damp: 0.6 do
    in_thread { use_random_seed SEED + 5; PASSES.times { part_comp } }
    in_thread { use_random_seed SEED + 6; PASSES.times { part_pad } }
    sleep PASSES * TOTAL + 8
  end
end

in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 7; PASSES.times { part_bass } }
end
