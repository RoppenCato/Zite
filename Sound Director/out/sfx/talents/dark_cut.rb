# dark_cut: a hard cut from the dark: a breath drawn, the heavy hit and the edge.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: dark_cut
# seconds: 1.8
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
use_random_seed 6300
sample S + "runes/shadowstep_a_2.wav", rate: 1.4, amp: 0.6
at [0.16] do
  sample S + "runes/riposte_a_2.wav", rate: 0.9, amp: 0.9
  sample S + "flesh/heavyhit_x_1.wav", amp: 0.9
  sample S + "combat/crit_2.wav", amp: 0.7
end
sleep 1.3
