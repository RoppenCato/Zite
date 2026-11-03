# flask: a flask thrown and broken: the recorded poison pot, a wet splat, the hiss.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: flask
# seconds: 1.9
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
use_random_seed 6310
sample S + "combat/swish_seax_2.wav", rate: 1.2, amp: 0.4
at [0.1] do sample S + "runes/trap_poison_a_2.wav", amp: 1.0, attack: 0, sustain: 0.4, release: 0.2 end
sleep 1.4
