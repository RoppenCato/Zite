# pet_wolf: the wolf bites: a snarl, the jaws snapping, a slap. Short, it sounds most turns.
# Written by sfx/lands2/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: pet_wolf
# seconds: 3.6
# count: 3

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
use_random_seed 10540
3.times do |v|
  use_random_seed 10540 + v
  r = 1 + rrand(-0.04, 0.04)
  sample A + "barking_02.ogg", rate: r * 1.15, amp: 0.4, attack: 0, sustain: 0.06, release: 0.05
  at [0.04] do sample S + "runes/trap_snap_a_#{v + 1}.wav", rate: r * 1.3, amp: 0.7; sample S + "flesh/hit_w_#{v + 1}.wav", rate: r, amp: 0.6 end
  sleep 0.7
end
sleep 0.1
