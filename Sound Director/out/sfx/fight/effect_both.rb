# effect_both: both blades at once, the Spellsword's once-a-fight moment: frost falling in bells while the storm rises, a wide chord.
# Written by sfx/lands2/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: effect_both
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
use_random_seed 10230
Z = "C:/dev/Zite/Sound Director/out/sfx/fight/"   # the game's own lightning (sfx/fight/lightning.rb): the library's lightning is thunder a phone loses
sample S + "runes/storm_rise_a_1.wav", rate: 1.2, amp: 0.6, attack: 0, sustain: 0.4, release: 0.25
at [0.04] do sample Z + "lightning_1.wav", rate: 1.05, amp: 0.5 end
[[0, 98], [0.06, 91], [0.12, 86], [0.18, 79]].each do |t, n|
  at [t] do bell n, 0.4, 0.35 end
end
at [0.24] do str 62, 0.02, 0.3, 0.35, 0.12; str 69, 0.02, 0.3, 0.35, 0.1; str 74, 0.02, 0.3, 0.35, 0.09; bell 86, 0.35, 0.5; bell 93, 0.3, 0.5 end
sleep 1.4
