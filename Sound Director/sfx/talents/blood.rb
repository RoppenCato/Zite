# blood: a wet slash, Crimson Arc and Bleed Out: the riposte's edge, Robin's slap and a wet splat, the drip after.
# For the new Rogue and the day and night (Miles, GD, 2026-11-03). Recordings from the Survival studio (CC0); bells and strings the studio's.
# name: blood
# seconds: 1.9
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
sample S + "runes/riposte_a_1.wav", amp: 0.9
at [0.03] do sample S + "flesh/hit_w_2.wav", amp: 0.9; sample "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_squish/files/impactsplat03.mp3.flac", rate: 1.2, amp: 0.6 end
at [0.12] do sample S + "runes/blood_drip_a_1.wav", rate: 1.2, amp: 0.5, attack: 0, sustain: 0.2, release: 0.15 end
sleep 1.4
