# ability_arcane_shield: Bubble Shield: recorded drops rising as bubbles, a string swell closing round.
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: ability_arcane_shield
# seconds: 2.0
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
define :coin do |rate, amp|
  sample K + "impactMetal_light_00#{rrand_i(0, 4)}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1
end
define :one do |v|
  use_random_seed 5480 + v
  r = 1 + rrand(-0.03, 0.03)
  [[0.0, 1.0], [0.1, 1.25], [0.2, 1.55]].each do |t, ra|
    at [t] do sample S + "fishing/fish_bite_a_1.wav", rate: ra, amp: 0.65, attack: 0, sustain: 0.06, release: 0.05 end
  end
  str 67, 0.2, 0.25, 0.3, 0.12; str 74, 0.25, 0.2, 0.3, 0.1
  at [0.3] do bell 86, 0.4, 0.4 end
end
1.times do |v|
  one v
  sleep 1.5
end
