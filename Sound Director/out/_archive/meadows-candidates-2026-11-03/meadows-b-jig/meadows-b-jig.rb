# Cloverfield Meadows, the board: candidate B, "the jig" (Robin, 2026-11-03: three candidates, different instruments, about a minute each).
# name: meadows-b-jig
# bpm: 168
# bars: 56
# beats: 3
# stems: full
#
# D major, six-eight: three quarter-beats a bar at 168, so a dotted quarter at 112; 56 bars = 60.0 s. Voices (mine): a fiddle and a tin whistle (with a grace note
# on its long notes) share the tunes, a strummed guitar, a plucked bass, a bodhran. The Celtic colour Robin asked for on the Survival game's mountains (Grizzly Hills).
# A different meter and cell from A and C, so the three are three themes, not one tune re-dressed (maple-guide section 7).
# THE HOOK, long-short twice a bar:  D5 F#5 A5 F#5 | G5 E5 C#5 A4 | D5 F#5 A5 D6 | C#6 A5
#   bars  1- 4  intro    guitar, bass, bodhran: the lilt
#   bars  5-12  A        the hook on the fiddle
#   bars 13-20  A        the hook on the whistle, the fiddle an octave under
#   bars 21-28  B        the second tune on the whistle, on Bm G D A
#   bars 29-36  B        the second tune on the fiddle, the whistle answering
#   bars 37-44  A        both together
#   bars 45-52  A        both, the fiddle up an octave: the top
#   bars 53-56  tail     the hook's first bar, the last bar stops short for the loop

eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")

STEM = :full
PASSES = 1
SEED = 3200
MASTER = 1.1                           # 0.6 measured -23.2 LUFS; +5 dB to about -18

use_bpm 168
set_sched_ahead_time! 1
BARS = 56
BB = 3                                  # beats a bar
TOTAL = BARS * BB

A_CH = %w[D A7 D A D G A7 D]
B_CH = %w[Bm G D A Bm G A D]
CHORDS = %w[D G A7 D] + A_CH * 2 + B_CH * 2 + A_CH * 2 + %w[D G D D]
CH = CHORDS.map { |s| sym_chord(s) }
puts "CHORD COUNT WRONG #{CHORDS.length}" if CHORDS.length != BARS
define :section do |b|
  if b <= 4 then :intro elsif b <= 20 then :a elsif b <= 36 then :b elsif b <= 44 then :a2 elsif b <= 52 then :a3 else :tail end
end

R3 = "r:q. r:q. | "
HOOK = "D5:q F#5:e A5:q F#5:e | G5:q E5:e C#5:q A4:e | D5:q F#5:e A5:q D6:e | C#6:q. A5:q. | " +
       "D5:q F#5:e A5:q F#5:e | G5:q B5:e D6:q B5:e | A5:q G5:e E5:q C#5:e | D5:q. r:q. | "
TUNE_B = "F#5:q D5:e B4:q D5:e | G5:q. B4:q. | A5:q F#5:e D5:q F#5:e | E5:q. C#5:q. | " +
         "F#5:q D5:e B4:q D5:e | G5:q B5:e D6:q B5:e | A5:q E5:e C#5:q E5:e | D5:q. r:q. | "
ANSW = "r:q. r:q. | r:q. D6:e C#6:e B5:e | r:q. r:q. | r:q. E6:e D6:e C#6:e | r:q. r:q. | r:q. r:q. | r:q. A5:e B5:e C#6:e | D6:q. r:q. | "
TAIL = "D5:q F#5:e A5:q F#5:e | G5:q B5:e D6:q B5:e | A5:q F#5:e D5:q F#5:e | D5:q. r:q. | "

# the fiddle: a darkened blade with a thread of saw for the bow's grit, vibrato that comes in late (docs/sonic-pi-notes.md: the blade is quiet, harsh when pushed)
FIDDLE = lambda do |n, d, amp|
  next if amp <= 0
  sus = [d - 0.12, 0.05].max
  synth :blade, note: n, attack: 0.04, sustain: sus, release: 0.12, cutoff: 98, vibrato_rate: 6, vibrato_depth: 0.14, vibrato_delay: 0.25, amp: amp * 0.75
  with_fx :lpf, cutoff: 84 do
    synth :saw, note: n, attack: 0.04, sustain: sus, release: 0.1, amp: amp * 0.12
  end
end
# the tin whistle: a sine and a breath, a grace note from a step above on the long notes
WHISTLE = lambda do |n, d, amp|
  next if amp <= 0
  sus = [d - 0.08, 0.04].max
  s = synth :sine, note: (d >= 1 ? n + 2 : n), attack: 0.02, sustain: sus, release: 0.1, amp: amp * 0.5, note_slide: 0.05
  control s, note: n if d >= 1
  synth :tri, note: n + 12, attack: 0.02, sustain: sus, release: 0.08, amp: amp * 0.05
  with_fx :bpf, centre: n + 12, res: 0.5 do
    synth :noise, attack: 0.01, sustain: 0.04, release: 0.05, amp: amp * 0.06
  end
end
FIDDLE_LOW = lambda { |n, d, a| FIDDLE.call(n - 12, d, a) }
FIDDLE_UP = lambda { |n, d, a| FIDDLE.call(n + 12, d, a) }

define :written do |str, bars, inst, amp, aj = 0.08, tj = 0.01|
  beats = parse_notes(str).map { |e| e[1] }.sum
  puts "LINE LENGTH #{beats} beats, wanted #{bars * BB}: #{str[0, 40]}" if (beats - bars * BB).abs > 0.001
  play_line str, inst, amp, aj, tj
end

define :part_fiddle do
  written R3 * 4, 4, FIDDLE, 0
  written HOOK, 8, FIDDLE, 1.6 * MASTER
  written HOOK, 8, FIDDLE_LOW, 1.1 * MASTER
  written R3 * 8, 8, FIDDLE, 0
  written TUNE_B, 8, FIDDLE, 1.6 * MASTER
  written HOOK, 8, FIDDLE, 1.4 * MASTER
  written HOOK, 8, FIDDLE_UP, 1.15 * MASTER
  written TAIL, 4, FIDDLE, 1.3 * MASTER
end

define :part_whistle do
  # the intro: the whistle plays the hook's second half alone over the strum (the first render's intro was a 9 dB hole)
  written "D5:q F#5:e A5:q F#5:e | G5:q B5:e D6:q B5:e | A5:q G5:e E5:q C#5:e | D5:q. r:q. | ", 4, WHISTLE, 0.9 * MASTER
  written R3 * 8, 8, WHISTLE, 0
  written HOOK, 8, WHISTLE, 1.0 * MASTER
  written TUNE_B, 8, WHISTLE, 1.05 * MASTER
  written ANSW, 8, WHISTLE, 0.85 * MASTER
  written HOOK, 8, WHISTLE, 0.8 * MASTER
  written HOOK, 8, WHISTLE, 0.85 * MASTER
  written R3 * 4, 4, WHISTLE, 0
end

# the guitar: a strum on each dotted beat (down), a lighter one on the eighth before the next (up)
define :part_guitar do
  (1..BARS).each do |b|
    ns = CH[b - 1][:notes].map { |n| n > 66 ? n - 12 : n }
    [[0, 1.0, 1], [1.0, 0.5, -1], [1.5, 1.0, 1], [2.5, 0.5, -1]].each do |at_b, lvl, dir|
      m, dt = hum(0.1, 0.006)
      unless b == BARS && at_b > 0
        order = dir > 0 ? ns : ns.reverse
        time_warp(at_b + dt) { order.each_with_index { |n, k| time_warp(k * 0.03) { synth :pluck, note: n, coef: 0.32, pluck_decay: 18, noise_amp: 0.7, amp: 0.55 * MASTER * m * (dir > 0 ? 1.0 : 0.6) } } }
      end
    end
    sleep BB
  end
end

define :part_bass do
  (1..BARS).each do |b|
    r = CH[b - 1][:bass] - 12
    puts "bar #{b} #{CHORDS[b - 1]} (#{section(b)})"
    m, dt = hum(0.05, 0.004)
    time_warp(dt) { synth :pluck, note: r, coef: 0.45, pluck_decay: 12, amp: 1.1 * MASTER * m; synth :sine, note: r + 12, attack: 0.005, release: 0.4, amp: 0.2 * MASTER * m }
    time_warp(1.5 + dt) { synth :pluck, note: r + 7, coef: 0.45, pluck_decay: 12, amp: 0.9 * MASTER * m; synth :sine, note: r + 19, attack: 0.005, release: 0.4, amp: 0.16 * MASTER * m } unless b == BARS
    sleep BB
  end
end

# the bodhran: a low frame drum on the dotted beats, a lighter tap on the last eighth, a roll into the top
define :part_drum do
  (1..BARS).each do |b|
    [[0, 0.75, :drum_tom_lo_soft, 0.9], [1.0, 0.3, :drum_tom_mid_soft, 1.3], [1.5, 0.6, :drum_tom_lo_soft, 0.95], [2.5, 0.35, :drum_tom_mid_soft, 1.3]].each do |at_b, a, smp, ra|
      m, dt = hum(0.08, 0.004)
      time_warp(at_b + dt) { sample smp, rate: ra, amp: a * MASTER * m } unless b == BARS && at_b > 0
    end
    if b == 44
      6.times { |i| time_warp(i * 0.5) { sample :drum_tom_mid_soft, rate: 1.2 + i * 0.05, amp: (0.25 + i * 0.06) * MASTER } }
    end
    sleep BB
  end
end

marker
in_thread(name: :room) do
  with_fx :reverb, mix: 0.24, room: 0.6, damp: 0.5 do
    in_thread { use_random_seed SEED + 1; PASSES.times { part_fiddle } }
    in_thread { use_random_seed SEED + 2; PASSES.times { part_whistle } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :close) do
  with_fx :reverb, mix: 0.12, room: 0.4, damp: 0.6 do
    in_thread { use_random_seed SEED + 3; PASSES.times { part_guitar } }
    in_thread { use_random_seed SEED + 4; PASSES.times { part_drum } }
    sleep PASSES * TOTAL + 8
  end
end
in_thread(name: :dry) do
  in_thread { use_random_seed SEED + 5; PASSES.times { part_bass } }
end
