# impact_holy: a holy spell lands: a bright major chord of bells, strings flaring for a moment, a clean crack. 0.5 s.
# Miles, GD, 2026-11-03 (Robin replaced the Pocket Watch with Magic Power; spells now fly as bolts). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: impact_holy
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
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 92, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
use_random_seed 8300
sample S + "runes/guard_break_a_2.wav", rate: 1.4, amp: 0.4
bell 84, 0.6, 0.4; bell 88, 0.5, 0.4; bell 91, 0.5, 0.4; bell 96, 0.35, 0.35
str 72, 0.01, 0.15, 0.25, 0.1; str 76, 0.01, 0.15, 0.25, 0.09; str 79, 0.01, 0.15, 0.25, 0.08
sleep 1.3
