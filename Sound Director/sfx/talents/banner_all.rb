# banner_all: Raise Every Banner, the capstone: three banners planted one after another, the cloth snapping wide, a horn chord rising over them. 1.3 s.
# Written by sfx/lands2/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: banner_all
# seconds: 2.7
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
use_random_seed 10130
define :horn do |n, d, amp|
  with_fx :lpf, cutoff: 88 do
    synth :saw, note: n, attack: 0.03, sustain: d, release: 0.2, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.03, sustain: d, release: 0.18, amp: amp * 0.12
  end
end
[0.0, 0.22, 0.44].each_with_index do |t, i|
  at [t] do knock "wood_hit_05.wav", 0.8 + i * 0.05, 0.9; sample S + "ships/sail_flap_b_#{i + 1}.wav", rate: 1.2, amp: 0.7, attack: 0, sustain: 0.2, release: 0.15 end
end
at [0.55] do horn 67, 0.5, 1.1; horn 71, 0.5, 0.7; horn 74, 0.5, 0.7; sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.9, amp: 0.6; str 55, 0.05, 0.5, 0.35, 0.12 end
sleep 2.2
