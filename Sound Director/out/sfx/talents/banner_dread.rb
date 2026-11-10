# banner_dread: a banner of dread planted: the pole knocked in, the cloth snapping, a dark low string.
# Written by sfx/lands2/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: banner_dread
# seconds: 1.9
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
R = "C:/dev/SG/Sound Director/sfx/flesh/ref/"
A = R + "oga_creature1/files/"
B = R + "oga_creature2/files/"
V = R + "bsb_voices/"
WET = R + "oga_wet_squish/files/impsplat/"
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
define :cut do |path, rate, amp, len|          # held to a length and high-passed at 330 Hz: a roar a phone can carry (docs/sfx-notes.md section 15)
  with_fx :hpf, cutoff: 64 do
    sample path, rate: rate, amp: amp, attack: 0, sustain: len * 0.65, release: len * 0.35
  end
end
define :knock do |piece, rate, amp|
  sample W + piece, rate: rate, amp: amp, attack: 0, sustain: 0.03, release: 0.05
end
use_random_seed 10110
knock "wood_hit_05.wav", 0.85, 0.9
at [0.12] do knock "wood_hit_05.wav", 0.75, 1.0; sample S + "chapter1/hit_club_v_1.wav", rate: 0.9, amp: 0.5 end
at [0.2] do sample S + "ships/sail_flap_b_1.wav", rate: 1.3, amp: 0.8, attack: 0, sustain: 0.2, release: 0.15 end
at [0.22] do str 50, 0.03, 0.3, 0.25, 0.14; str 56, 0.03, 0.3, 0.25, 0.11 end
sleep 1.4
