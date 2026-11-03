# ability_shield_bash: Shield Bonk: a comic bonk: the club's knock, a tom pitched up hard, the shield's wood bouncing twice.
# The fight sprite (Miles, GD's name fight/ability-shield-bash). Layers from the Survival game's recordings, its picks first (docs/survival-library.md);
# the bells and strings are the studio's. Written by sfx/fight/_make.py; change it there.
# name: ability_shield_bash
# seconds: 1.8
# count: 1

use_bpm 60                                   # times in seconds
S = "C:/dev/SG/Sound Director/out/sfx/"
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
GRUNT = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/3grunt1.wav"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :horn do |n, d, amp|                   # saws through a low-pass: a triangle reads as a flute (docs/maple-guide.md)
  with_fx :lpf, cutoff: 86 do
    synth :saw, note: n, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.05, sustain: d, release: 0.2, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.04, sustain: d, release: 0.18, amp: amp * 0.12
  end
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
define :cut do |path, rate, amp, len, st = 0|  # a recording cut to a length with no tail
  sample path, rate: rate, amp: amp, start: st, attack: 0, sustain: len * 0.6, release: len * 0.4
end

define :one do |v|
  use_random_seed 4170 + v
  r = 1 + rrand(-0.03, 0.03)

  sample S + "chapter1/hit_club_v_3.wav", rate: 1.1, amp: 0.8
  sample :drum_tom_hi_hard, rate: 1.7, amp: 0.8
  at [0.1] do sample C + "wood_hit_07.wav", rate: 1.5, amp: 0.5, attack: 0, sustain: 0.03, release: 0.05 end
  at [0.17] do sample C + "wood_hit_07.wav", rate: 1.9, amp: 0.3, attack: 0, sustain: 0.02, release: 0.04 end
end

1.times do |v|
  one v
  sleep 1.3
end
