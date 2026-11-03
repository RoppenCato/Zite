# impact_fire: a fire spell lands: a whoomp of air, the recorded fire's crackle, a dull knock. 0.45 s.
# Miles, GD, 2026-11-03 (Robin replaced the Pocket Watch with Magic Power; spells now fly as bolts). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: impact_fire
# seconds: 1.7
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
sample S + "combat/swish_axe_2.wav", rate: 1.4, amp: 0.6
sample S + "runes/fire_burn_man_a_1.wav", start: 0.35, amp: 0.9, attack: 0.005, sustain: 0.2, release: 0.2
sample S + "chapter1/hit_club_v_3.wav", rate: 1.1, amp: 0.55
sleep 1.2
