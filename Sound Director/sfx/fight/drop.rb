# drop: a drop rolling onto the card: three light knocks slowing down, then the card's page flip.
# The fight sprite (Miles, GD's name fight/drop). Layers from the Survival game's recordings, its picks first (docs/survival-library.md);
# the bells and strings are the studio's. Written by sfx/fight/_make.py; change it there.
# name: drop
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
  use_random_seed 4090 + v
  r = 1 + rrand(-0.03, 0.03)

  [[0.0, 0.8], [0.09, 0.65], [0.21, 0.5]].each do |t, a|
    at [t] do sample C + "raise_e_1.wav", rate: 1.5, amp: a, attack: 0, sustain: 0.02, release: 0.04 end
  end
  at [0.27] do sample C + "bookFlip2.wav", rate: 1.3, amp: 0.7, attack: 0.005, sustain: 0.14, release: 0.08 end
end

1.times do |v|
  one v
  sleep 1.3
end
