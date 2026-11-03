# cleave: wild swings: the recorded sweep and two heavy hits close together.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: cleave
# seconds: 2.0
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
use_random_seed 6230
sample S + "runes/sweep_a_1.wav", rate: 1.15, amp: 0.8
at [0.14] do sample S + "flesh/heavyhit_x_2.wav", amp: 1.0; sample S + "flesh/hit_w_2.wav", amp: 0.5 end
at [0.34] do sample S + "flesh/heavyhit_x_3.wav", rate: 0.95, amp: 1.0; sample S + "flesh/hit_w_3.wav", amp: 0.5 end
sleep 1.5
