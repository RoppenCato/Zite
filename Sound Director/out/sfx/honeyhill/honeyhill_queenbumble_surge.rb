# honeyhill_queenbumble_surge: Queen Bumble's hive answers, the swarm thickens: buzzes piling up and rising.
# Written by sfx/lands2/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: honeyhill_queenbumble_surge
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
use_random_seed 9180
[[0.0, 0.7], [0.1, 0.8], [0.2, 0.9], [0.32, 1.0], [0.45, 1.1]].each_with_index { |(t, ra), i| at [t] do sample C + "c2_bug_10.wav", rate: ra, amp: 0.45 + i * 0.1 end }
sample C + "c1_bug_04.wav", rate: 0.5, amp: 0.7
str 62, 0.4, 0.4, 0.3, 0.1
sleep 2.2
