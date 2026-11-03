# roar: a berserk's roar and a hit of the blood: the recorded roar, the drip.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: roar
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
use_random_seed 6220
sample S + "runes/berserk_roar_a_1.wav", amp: 0.9, attack: 0, sustain: 0.45, release: 0.25
at [0.04] do sample S + "runes/blood_drip_a_1.wav", amp: 0.5, attack: 0, sustain: 0.2, release: 0.15 end
sleep 1.5
