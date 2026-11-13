# effect_stampede: Stampede, once a fight: running feet quickening, the howl, the roar and the hiss over them, then the blows land together.
# Written by sfx/lands2/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: effect_stampede
# seconds: 2.1
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
use_random_seed 10530
[0, 0.09, 0.17, 0.24, 0.31, 0.38, 0.45, 0.52, 0.6, 0.68].each_with_index do |t, i|
  at [t] do with_fx :hpf, cutoff: 68 do sample :drum_tom_mid_hard, rate: 1.6 + (i % 2) * 0.15, amp: 0.55 + i * 0.05 end end
end
at [0.05] do sample A + "howl.ogg", rate: 1.05, amp: 0.55, attack: 0, sustain: 0.3, release: 0.2 end
at [0.25] do cut B + "roar_04.ogg", 1.05, 0.6, 0.4 end
at [0.45] do sample S + "flesh/pain_snake_w_1.wav", amp: 0.5 end
at [0.72] do sample S + "runes/trap_snap_a_2.wav", rate: 1.3, amp: 0.7; sample S + "combat/swish_axe_1.wav", rate: 0.9, amp: 0.5; with_fx :hpf, cutoff: 60 do sample S + "flesh/heavyhit_x_1.wav", amp: 0.9 end; sample S + "flesh/hit_w_2.wav", amp: 0.7 end
sleep 1.6
