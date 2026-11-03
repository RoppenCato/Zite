# shrine_teach: the shrine teaches: a chime with a lift: two bells rising a fourth, strings opening.
# The UI set's second half (Miles, GD's name ui/shrine-teach; docs/sound-demands.md, wave 1). Recorded wood, leather, water and metal from the Survival studio,
# bells and strings the studio's, in C pentatonic. Written by sfx/ui/_make2.py; change it there.
# name: shrine_teach
# seconds: 2.0
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

use_random_seed 4880

bell 79, 0.7, 0.4
at [0.17] do bell 84, 0.8, 0.6; bell 91, 0.3, 0.5 end
str 60, 0.08, 0.3, 0.25, 0.1; str 67, 0.1, 0.25, 0.25, 0.09
sleep 1.5
