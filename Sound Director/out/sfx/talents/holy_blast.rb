# holy_blast: a blast of light: strings opening fast, bells running up, a soft crack.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: holy_blast
# seconds: 2.2
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
use_random_seed 6210
str 60, 0.08, 0.45, 0.4, 0.15; str 67, 0.08, 0.45, 0.4, 0.13; str 76, 0.1, 0.4, 0.4, 0.11
[[0.0, 79], [0.07, 84], [0.14, 88], [0.21, 91], [0.28, 96]].each do |t, n|
  at [t] do bell n, 0.6, 0.45 end
end
at [0.26] do sample S + "runes/guard_break_a_2.wav", rate: 1.3, amp: 0.45 end
sleep 1.7
