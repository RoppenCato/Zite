# arrive_boss: arriving at the boss's spot: a low note: a horn's C4 with a tom and a dark string; not a fanfare, a warning.
# The UI set's second half (Miles, GD's name ui/arrive-boss; docs/sound-demands.md, wave 1). Recorded wood, leather, water and metal from the Survival studio,
# bells and strings the studio's, in C pentatonic. Written by sfx/ui/_make2.py; change it there.
# name: arrive_boss
# seconds: 2.3
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
  sample K + "impactMetal_light_00#{rrand_i(0, 4)}.ogg", rate: rate, amp: amp, attack: 0, sustain: 0.03, release: 0.09
end
define :flip do |rate, amp|
  sample C + "bookFlip2.wav", rate: rate, amp: amp, attack: 0.005, sustain: 0.12, release: 0.08
end

use_random_seed 4860

horn 60, 0.5, 1.1
sample :drum_tom_mid_hard, rate: 0.85, amp: 0.5
str 55, 0.1, 0.4, 0.3, 0.14; str 63, 0.1, 0.4, 0.3, 0.1
sleep 1.8
