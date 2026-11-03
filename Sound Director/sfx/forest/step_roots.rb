# step_roots: a step on roots: a recorded wooden knock, dull and light.
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: step_roots
# seconds: 3.5
# count: 3

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
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
define :coin do |rate, amp|
  sample K + "impactMetal_light_00#{rrand_i(0, 4)}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1
end
define :one do |v|
  use_random_seed 5580 + v
  r = 1 + rrand(-0.03, 0.03)
  with_fx :lpf, cutoff: 98 do                       # Kenney's wood footsteps are 99 % under 250 Hz, gone on a phone: recorded knocks instead
    sample W + ["wood_hit_05.wav", "wood_hit_07.wav", "wood_hit_05.wav"][v], rate: [0.85, 0.95, 1.0][v] * r, amp: 1.0, attack: 0, sustain: 0.03, release: 0.06
  end
end
3.times do |v|
  one v
  sleep 1.0
end
