# blade_charge: a blade charged with frost or storm: a small recorded lightning under rising bells and a string's edge.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: blade_charge
# seconds: 2.1
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
use_random_seed 6260
sample S + "runes/lightning_small_a_1.wav", rate: 1.2, amp: 0.7
sample S + "runes/rune_ready_a_2.wav", amp: 0.7
[[0.05, 79], [0.13, 86], [0.21, 91], [0.29, 98]].each do |t, n|
  at [t] do bell n, 0.45, 0.3 end
end
str 67, 0.2, 0.3, 0.25, 0.1
sleep 1.6
