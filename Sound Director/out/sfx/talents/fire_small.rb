# fire_small: a quick flame: a rush, the recorded fire arrow, a crackle.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: fire_small
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
use_random_seed 6250
with_fx :hpf, cutoff: 52 do sample S + "runes/fire_arrow_a_2.wav", rate: 1.25, amp: 1.0 end
at [0.1] do sample S + "runes/fire_burn_man_a_1.wav", start: 0.3, amp: 0.9, attack: 0.02, sustain: 0.25, release: 0.2 end
sleep 1.3
