# magic_power: Magic Power: a rising, charging swell: strings climbing from low C, bells running up through two octaves faster and faster, the recorded rune waking at the top, a bright chord held. 1.3 s.
# Miles, GD, 2026-11-03 (Robin replaced the Pocket Watch with Magic Power; spells now fly as bolts). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: magic_power
# seconds: 2.7
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
with_fx :hpf, cutoff: 55 do sample S + "runes/storm_gather_a_1.wav", start: 0.3, finish: 0.59, amp: 0.6, attack: 0.1, release: 0.05 end
str 48, 0.8, 0.3, 0.3, 0.12; str 55, 0.85, 0.25, 0.3, 0.11; str 64, 0.9, 0.2, 0.3, 0.1
[[0.0, 60], [0.14, 64], [0.26, 67], [0.37, 72], [0.47, 76], [0.56, 79], [0.64, 84], [0.71, 88], [0.77, 91], [0.82, 96]].each_with_index do |(t, n), i|
  at [t] do bell n, 0.18 + i * 0.05, 0.3 end
end
at [0.86] do
  sample S + "runes/rune_wake_a_1.wav", amp: 0.5, attack: 0, sustain: 0.3, release: 0.2
  bell 96, 0.8, 0.6; bell 91, 0.5, 0.55; bell 88, 0.4, 0.5
  str 72, 0.02, 0.3, 0.25, 0.1; str 79, 0.02, 0.3, 0.25, 0.09
end
sleep 2.2
