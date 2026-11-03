# boss_down: a boss falls. The biggest of the UI sounds: a horn's phrase, C5 G5 E5 then a long C6 (short short short long, the level up's cell inverted so the two are kin), strings under it, a low drum on the first and the last note, bells only on the last. 2 s, triumphant, not loud for long.
# Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/boss-down). Enchanted Kingdoms: storybook, wood and bells, short,
# never piercing. Recorded wood for every knock (sfx/ui/ref/README.md); bells are the studio's pretty bell, the one synth voice Robin
# has liked, in C pentatonic so they sit over any region's key. Written by sfx/ui/_make.py; change it there.
# name: boss_down
# seconds: 10.7
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
  use_random_seed 3730 + v
  r = 1 + rrand(-0.04, 0.04)

define :horn do |n, d, amp|
  with_fx :lpf, cutoff: 86 do
    synth :saw, note: n, attack: 0.04, sustain: d, release: 0.25, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.05, sustain: d, release: 0.25, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.12
  end
end

  [[0.0, 72], [0.2, 79], [0.4, 76]].each do |t, n|
    at [t + rrand(-0.006, 0.006)] do horn n, 0.14, 0.9 end
  end
  # the drum: bd_boom cut to half a second (its own tail runs for seconds and merged the variations in the first render)
  at [0.0] do sample :bd_boom, rate: 0.9 * r, amp: 0.4, attack: 0, sustain: 0.15, release: 0.3; sample :drum_tom_lo_hard, rate: 0.9 * r, amp: 0.45 end
  at [0.6] do
    horn 84, 0.9, 1.0; horn 72, 0.9, 0.6
    sample :bd_boom, rate: 0.85 * r, amp: 0.55, attack: 0, sustain: 0.2, release: 0.4; sample :drum_tom_lo_hard, rate: 0.85 * r, amp: 0.6
    bell 96, 0.6, 1.0; bell 91, 0.4, 0.9
    synth :blade, note: 67, attack: 0.1, sustain: 0.8, release: 0.5, cutoff: 92, vibrato_depth: 0.08, vibrato_delay: 0.3, amp: 0.16
    synth :blade, note: 60, attack: 0.12, sustain: 0.8, release: 0.5, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: 0.14
    synth :blade, note: 55, attack: 0.15, sustain: 0.75, release: 0.5, cutoff: 86, amp: 0.1
  end
  4.times do
    at [0.8 + rrand(0, 0.7)] do bell [98, 100, 103, 105][rrand_i(0, 3)], 0.07, 0.3 end
  end
end

3.times do |v|
  one v
  sleep 3.4
end
