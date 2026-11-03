# ability_eviscerate: Grand Finale: a whirl of three cuts and the heavy hit, a bell's flourish on top.
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: ability_eviscerate
# seconds: 2.2
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
  use_random_seed 5450 + v
  r = 1 + rrand(-0.03, 0.03)
  sample S + "runes/whirl_a_1.wav", rate: 1.1, amp: 0.7
  [0.12, 0.26].each do |t|
    at [t] do sample S + "runes/riposte_a_#{t < 0.2 ? 1 : 2}.wav", amp: 0.85 end
  end
  at [0.42] do sample S + "flesh/heavyhit_x_3.wav", amp: 1.0; sample S + "flesh/hit_w_2.wav", amp: 0.8; bell 91, 0.5, 0.5; bell 84, 0.4, 0.5 end
end
1.times do |v|
  one v
  sleep 1.7
end
