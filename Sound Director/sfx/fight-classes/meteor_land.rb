# meteor_land: Falling Star lands, two rounds after the cast (fight/meteor-land): a rush down, a crack and the heavy split, bells scattering. The biggest of the Wizard's.
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: meteor_land
# seconds: 2.7
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
  use_random_seed 5510 + v
  r = 1 + rrand(-0.03, 0.03)
  sample S + "combat/swish_greataxe_2.wav", rate: 0.9, amp: 0.7
  at [0.18] do
    sample S + "runes/guard_break_a_1.wav", rate: 0.9, amp: 0.9
    sample S + "runes/rock_split_a_1.wav", rate: 0.8, amp: 0.9, attack: 0, sustain: 0.3, release: 0.25
    sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.85, amp: 0.8
    str 60, 0.02, 0.4, 0.4, 0.14; str 67, 0.02, 0.4, 0.4, 0.12
  end
  6.times do
    at [0.25 + rrand(0, 0.5)] do bell [91, 93, 96, 98, 100, 103][rrand_i(0, 5)], 0.25, 0.3 end
  end
end
1.times do |v|
  one v
  sleep 2.2
end
