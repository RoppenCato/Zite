# sleep: the inn, a night's sleep: a sigh, then a music box's three falling notes and a soft low chord. 1.6 s.
# For the new Rogue and the day and night (Miles, GD, 2026-11-03). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: sleep
# seconds: 2.9
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
use_random_seed 8100
sample S + "runes/shadowstep_a_2.wav", rate: 0.65, amp: 0.5
[[0.4, 84], [0.65, 79], [0.9, 76]].each { |t, n| at [t] do synth :kalimba, note: n, clickiness: 0.2, amp: 0.7 end }
at [0.4] do str 60, 0.2, 0.7, 0.4, 0.08; str 64, 0.2, 0.7, 0.4, 0.07 end
sleep 2.4
