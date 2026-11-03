# grumblebark_die: Grumblebark falls: Robin's tree falling, cracking and crashing.
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: grumblebark_die
# seconds: 3.9
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
  sample "C:/dev/SG/Game Developer/assets/sfx/free/treefall_a_1.wav", amp: 1.0
  sample K + "creak1.ogg", rate: 0.6, amp: 0.5                   # bridges the recording's silences (the first render split into a 36 ms crack and the rest)
  at [0.5] do sample K + "creak3.ogg", rate: 0.6, amp: 0.4 end
end
1.times do |v|
  one v
  sleep 3.4
end
