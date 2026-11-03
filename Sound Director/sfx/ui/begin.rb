# begin: Begin: a short overture: C5 E5 G5, then A5 G5 and a held C6, on bells and a horn with strings. 2 s. A stand-in for the game's hook until the title theme is written; it will quote the same notes.
# The UI set's second half (Miles, GD's name ui/begin; docs/sound-demands.md, wave 1). Recorded wood, leather, water and metal from the Survival studio,
# bells and strings the studio's, in C pentatonic. Written by sfx/ui/_make2.py; change it there.
# name: begin
# seconds: 3.4
# count: 1

use_bpm 60                                   # times in seconds
S = "C:/dev/SG/Sound Director/out/sfx/"
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
define :horn do |n, d, amp|
  with_fx :lpf, cutoff: 86 do
    synth :saw, note: n, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.05, sustain: d, release: 0.2, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.04, sustain: d, release: 0.18, amp: amp * 0.12
  end
end
define :knock do |piece, rate, amp|           # a recorded knock cut with no tail
  sample C + piece, rate: rate, amp: amp, attack: 0, sustain: 0.03, release: 0.05
end
define :coin do |rate, amp|                   # a coin: Kenney's light metal impact pitched up and cut before it rings
  sample K + "impactMetal_light_00#{rrand_i(0, 4)}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1   # 0.62: the first render centred at 7 kHz, piercing
end
define :flip do |rate, amp|
  sample C + "bookFlip2.wav", rate: rate, amp: amp, attack: 0.005, sustain: 0.12, release: 0.08
end

use_random_seed 5120

[[0.0, 72], [0.16, 76], [0.32, 79], [0.56, 81], [0.72, 79]].each do |t, n|
  at [t] do bell n + 12, 0.7, 0.3; horn n, 0.08, 0.7 end
end
at [0.96] do
  bell 96, 1.0, 1.0; bell 91, 0.5, 0.9; horn 84, 0.7, 0.9; horn 72, 0.7, 0.5
  str 60, 0.03, 0.7, 0.4, 0.13; str 64, 0.03, 0.7, 0.4, 0.11; str 67, 0.03, 0.7, 0.4, 0.1
  sample :drum_tom_mid_hard, rate: 1.0, amp: 0.4
end
sleep 2.9
