# night_falls: night falls: a slow falling of soft bells (A5 F5 D5), a low warm string chord, a single far owl's hoot. 1.8 s.
# For the new Rogue and the day and night (Miles, GD, 2026-11-03). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: night_falls
# seconds: 3.1
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
str 50, 0.3, 0.9, 0.6, 0.12; str 57, 0.35, 0.85, 0.6, 0.1; str 65, 0.4, 0.8, 0.6, 0.08
[[0.0, 81], [0.3, 77], [0.6, 74]].each { |t, n| at [t] do bell n, 0.5, 0.7 end }
at [1.0] do synth :sine, note: 64, attack: 0.05, sustain: 0.12, release: 0.15, amp: 0.25; synth :sine, note: 60, attack: 0.05, sustain: 0.25, release: 0.2, amp: 0.22 end
sleep 2.6
