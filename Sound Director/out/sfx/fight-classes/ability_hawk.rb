# ability_hawk: Owl Friend: a soft hoot, two notes, and wings (Robin's sail flap, quick).
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: ability_hawk
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
  use_random_seed 5570 + v
  r = 1 + rrand(-0.03, 0.03)
  [[0.0, 69, 0.14], [0.26, 65, 0.24]].each do |t, n, d|
    at [t] do
      synth :sine, note: n, attack: 0.05, sustain: d, release: 0.1, amp: 0.45
      synth :tri, note: n + 12, attack: 0.05, sustain: d, release: 0.08, amp: 0.05
    end
  end
  at [0.5] do sample S + "ships/sail_flap_b_1.wav", rate: 1.6, amp: 0.8, attack: 0, sustain: 0.2, release: 0.15 end
end
1.times do |v|
  one v
  sleep 1.5
end
