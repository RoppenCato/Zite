# level_up: a level gained. A short tune to hum, not a run: G5 C6 E6 then a held G6 (short short short long), on bells with strings doubling and a swell under, a sprinkle of glitter on the held note. 1.5 s. The rhythm is the level up's own; the chest's bursts run, this one sings.
# Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/level-up). Enchanted Kingdoms: storybook, wood and bells, short,
# never piercing. Recorded wood for every knock (sfx/ui/ref/README.md); bells are the studio's pretty bell, the one synth voice Robin
# has liked, in C pentatonic so they sit over any region's key. Written by sfx/ui/_make.py; change it there.
# name: level_up
# seconds: 7.1
# count: 3

use_bpm 60                                   # times in seconds
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
define :bell do |n, amp, rel|                 # a small bright bell: pretty_bell with a sine an octave up for the shimmer
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :pop do |r, amp|                       # the lid: a hollow wooden knock, a warm knock under it, the latch's thin click on top
  sample C + "wood_hit_07.wav", rate: 1.15 * r, amp: amp * 0.9, attack: 0, sustain: 0.04, release: 0.08
  sample C + "wood_hit_05.wav", rate: 1.0 * r, amp: amp * 0.5, attack: 0, sustain: 0.03, release: 0.06
  sample C + "wood_hit_02.wav", rate: 1.1 * r, amp: amp * 0.35, attack: 0, sustain: 0.01, release: 0.03
end

define :one do |v|
  use_random_seed 3720 + v
  r = 1 + rrand(-0.04, 0.04)

define :horn do |n, d, amp|
  with_fx :lpf, cutoff: 86 do
    synth :saw, note: n, attack: 0.04, sustain: d, release: 0.25, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.05, sustain: d, release: 0.25, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.12
  end
end

  [[0.0, 79], [0.17, 84], [0.34, 88]].each do |t, n|
    at [t + rrand(-0.006, 0.006)] do bell n, 0.75, 0.45; synth :blade, note: n - 12, attack: 0.02, sustain: 0.12, release: 0.15, cutoff: 92, amp: 0.1 end
  end
  at [0.51] do
    bell 91, 1.0, 1.0; bell 84, 0.5, 0.9                       # the held note, with its octave below
    synth :blade, note: 79, attack: 0.05, sustain: 0.6, release: 0.4, cutoff: 92, vibrato_depth: 0.08, vibrato_delay: 0.3, amp: 0.14
    synth :blade, note: 72, attack: 0.08, sustain: 0.6, release: 0.4, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: 0.12
    synth :blade, note: 64, attack: 0.1, sustain: 0.55, release: 0.4, cutoff: 88, amp: 0.1
  end
  5.times do
    at [0.6 + rrand(0, 0.6)] do bell [96, 98, 100, 103][rrand_i(0, 3)], 0.08, 0.3 end
  end
end

3.times do |v|
  one v
  sleep 2.2
end
