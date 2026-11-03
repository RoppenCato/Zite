# die_tumble: the die tumbling over the board (a loop). Six bright clacks in 0.6 s, uneven as a die rolls, none louder than the land's; the last one's tail is gone before the loop point so it repeats cleanly. The game loops it while the die rolls and stops it at the land.
# Miles, GD's brief (docs/sound-demands.md, wave 1): the roll is the die picked up and shaken (0.4 s), the tumble (a 0.6 s loop while
# it rolls), the land (delivered as die_land_a/b/c). Built in B's family: the same recorded wood (sfx/ui/ref/README.md), no oscillator.
# name: die_tumble
# seconds: 5.0
# count: 3

use_bpm 60                                   # times in seconds
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"

# clacks per variation: time, which piece (0 the bright clack, 1 the smaller one, 2 the light knock), level
HITS = [[[0.0, 0, 0.7], [0.085, 1, 0.5], [0.19, 2, 0.45], [0.3, 0, 0.6], [0.395, 1, 0.5], [0.49, 2, 0.4]],
        [[0.0, 1, 0.6], [0.11, 0, 0.65], [0.2, 2, 0.4], [0.285, 1, 0.55], [0.4, 0, 0.6], [0.5, 2, 0.4]],
        [[0.0, 0, 0.65], [0.095, 2, 0.4], [0.175, 1, 0.55], [0.29, 0, 0.6], [0.41, 2, 0.45], [0.495, 1, 0.5]]]
PIECE = ["wood_hit_06.wav", "wood_hit_01.wav", "raise_e_1.wav"]
RATE = [1.2, 1.4, 1.5]

define :one do |v|
  use_random_seed 3500 + v
  r = 1 + rrand(-0.04, 0.04)
  with_fx :lpf, cutoff: 124 do                               # 8.9 kHz, as the land
    HITS[v].each do |t, k, a|
      at [t] do
        sample C + PIECE[k], rate: (RATE[k] + rrand(-0.06, 0.06)) * r, amp: a, attack: 0, sustain: 0.015, release: 0.035
      end
    end
  end
end

3.times do |v|
  one v
  sleep 1.5
end
