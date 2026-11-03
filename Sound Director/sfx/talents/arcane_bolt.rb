# arcane_bolt: a bolt of magic: a quick run of bells and the recorded rune's front, a knock on arrival.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: arcane_bolt
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
use_random_seed 6240
[[0.0, 72], [0.04, 79], [0.08, 84], [0.12, 91]].each do |t, n|
  at [t] do bell n, 0.6, 0.22 end
end
sample S + "combat/swish_seax_1.wav", rate: 1.4, amp: 0.45
at [0.16] do sample S + "runes/rune_ready_a_1.wav", amp: 0.5, attack: 0, sustain: 0.2, release: 0.15; sample S + "chapter1/hit_club_v_1.wav", rate: 1.2, amp: 0.7 end
sleep 1.3
