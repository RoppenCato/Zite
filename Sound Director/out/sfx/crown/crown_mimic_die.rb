# crown_mimic_die: gold-mimic, die (The Buried Crown).
# Written by sfx/lands/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: crown_mimic_die
# seconds: 2.2
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
R = "C:/dev/SG/Sound Director/sfx/flesh/ref/"
A = R + "oga_creature1/files/"
B = R + "oga_creature2/files/"
V = R + "bsb_voices/"
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
define :cut do |path, rate, amp, len|          # a recording held to a length, and high-passed at 210 Hz: a roar a phone can carry
  with_fx :hpf, cutoff: 55 do
    sample path, rate: rate, amp: amp, attack: 0, sustain: len * 0.65, release: len * 0.35
  end
end
define :coin do |rate, amp|
  sample K + "impactMetal_light_00#{rrand_i(0, 4)}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1
end
use_random_seed 7110
sample W + "wood_hit_07.wav", rate: 0.9, amp: 0.8, attack: 0, sustain: 0.05, release: 0.08
[[0.06, 2.2], [0.12, 2.0], [0.2, 1.9], [0.3, 1.7], [0.42, 1.6]].each { |t, ra| at [t] do coin ra, 0.6 end }
sleep 1.7
