# morning: morning: bells rising (D5 F#5 A5 D6), a bright string chord opening, a wooden knock of a shutter. 1.6 s.
# For the new Rogue and the day and night (Miles, GD, 2026-11-03). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: morning
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
sample W + "wood_hit_07.wav", rate: 1.1, amp: 0.5, attack: 0, sustain: 0.04, release: 0.07
str 62, 0.2, 0.7, 0.5, 0.1; str 66, 0.25, 0.65, 0.5, 0.09; str 69, 0.3, 0.6, 0.5, 0.08
[[0.08, 74], [0.24, 78], [0.4, 81], [0.56, 86]].each { |t, n| at [t] do bell n, 0.55, 0.6 end }
sleep 2.4
