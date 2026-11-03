# impact_arcane: an arcane spell lands: a bright cluster of bells, the rune's front, a soft knock. 0.35 s.
# Miles, GD, 2026-11-03 (Robin replaced the Pocket Watch with Magic Power; spells now fly as bolts). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: impact_arcane
# seconds: 1.6
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
sample S + "runes/rune_ready_a_1.wav", amp: 0.6, attack: 0, sustain: 0.15, release: 0.12
bell 91, 0.6, 0.3; bell 98, 0.4, 0.25; bell 86, 0.35, 0.3
sample S + "chapter1/hit_club_v_1.wav", rate: 1.3, amp: 0.5
sleep 1.1
