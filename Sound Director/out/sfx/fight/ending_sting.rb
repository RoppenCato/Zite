# crown_ending_sting: the Hollow King falls, the ending: a low chord that does not resolve, then a slow horn-less rise of bells to a clean D major, 2.5 s: an old thing laid down, sorrow and light.
# Written by sfx/lands/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: crown_ending_sting
# seconds: 3.9
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
define :cut do |path, rate, amp, len|          # a recording held to a length, high-passed at 330 Hz: a roar a phone can carry (196 Hz left Snowshoulder 86 to 94 % low)
  with_fx :hpf, cutoff: 64 do
    sample path, rate: rate, amp: amp, attack: 0, sustain: len * 0.65, release: len * 0.35
  end
end
define :coin do |rate, amp|
  sample K + "impactMetal_light_00#{rrand_i(0, 4)}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1
end
use_random_seed 7190
str 50, 0.05, 0.7, 0.4, 0.14; str 57, 0.05, 0.7, 0.4, 0.12; str 65, 0.05, 0.7, 0.4, 0.1
sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.75, amp: 0.8
at [0.8] do str 50, 0.2, 1.0, 0.6, 0.12; str 62, 0.2, 1.0, 0.6, 0.12; str 66, 0.25, 0.95, 0.6, 0.11; str 69, 0.3, 0.9, 0.6, 0.1 end
[[0.85, 86], [1.05, 90], [1.25, 93], [1.5, 98]].each { |t, n| at [t] do bell n, 0.65, 0.9 end }
sleep 3.4
