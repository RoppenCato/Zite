# ability_meteor: Falling Star, the casting: bells falling from the top, a deep whoosh; the star lands two rounds later (a second name if the game wants one).
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: ability_meteor
# seconds: 2.3
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
  use_random_seed 5500 + v
  r = 1 + rrand(-0.03, 0.03)
  [[0.0, 103], [0.08, 100], [0.16, 96], [0.24, 91], [0.32, 88], [0.4, 84]].each do |t, n|
    at [t] do bell n, 0.45, 0.3 end
  end
  sample S + "combat/swish_greataxe_1.wav", rate: 0.8, amp: 0.8
  at [0.55] do sample S + "runes/rock_split_a_1.wav", rate: 0.8, amp: 0.7, attack: 0, sustain: 0.25, release: 0.2 end
end
1.times do |v|
  one v
  sleep 1.8
end
