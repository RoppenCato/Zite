# arrow_rain: arrows from above: Robin's bow shot up, then five small thuds falling around.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: arrow_rain
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
use_random_seed 6320
sample S + "bow/shoot_b_1.wav", amp: 0.9
at [0.04] do sample S + "bow/shoot_b_2.wav", amp: 0.6 end
[[0.3, 2], [0.38, 1], [0.47, 3], [0.54, 2], [0.63, 1]].each do |t, f|
  at [t] do sample S + "chapter1/hit_club_v_#{f}.wav", rate: 1.5, amp: 0.55 end
end
sleep 1.6
