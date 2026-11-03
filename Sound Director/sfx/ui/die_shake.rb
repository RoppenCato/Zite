# die_shake: the die shaken in a cupped hand. Five or six small knocks of the die against the fingers in 0.35 s, muffled by the hand (a low-pass at 2.8 kHz), getting a touch quicker toward the throw, with a faint rustle of skin under them.
# Miles, GD's brief (docs/sound-demands.md, wave 1): the roll is the die picked up and shaken (0.4 s), the tumble (a 0.6 s loop while
# it rolls), the land (delivered as die_land_a/b/c). Built in B's family: the same recorded wood (sfx/ui/ref/README.md), no oscillator.
# name: die_shake
# seconds: 4.4
# count: 3

use_bpm 60                                   # times in seconds
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"

# the knocks' times by variation (seconds from the start): a hand shakes unevenly
TIMES = [[0.0, 0.07, 0.125, 0.19, 0.245, 0.3], [0.0, 0.06, 0.135, 0.2, 0.25, 0.31, 0.355], [0.0, 0.08, 0.14, 0.21, 0.26, 0.315]]

define :one do |v|
  use_random_seed 3400 + v
  r = 1 + rrand(-0.04, 0.04)
  with_fx :lpf, cutoff: 95 do                                # 2.8 kHz: inside a hand
    TIMES[v].each_with_index do |t, i|
      at [t + rrand(-0.004, 0.004)] do
        a = 0.55 + rrand(-0.1, 0.1)
        if i.even?
          sample C + "wood_hit_05.wav", rate: (1.3 + rrand(-0.08, 0.08)) * r, amp: a, attack: 0, sustain: 0.02, release: 0.04        # the die on a finger: warm
        else
          sample C + "raise_e_1.wav", rate: (1.5 + rrand(-0.08, 0.08)) * r, amp: a * 0.8, attack: 0, sustain: 0.015, release: 0.035   # on a knuckle: lighter
        end
      end
    end
    with_fx :hpf, cutoff: 80 do                              # the rustle of skin: grains of wood settling, very quiet, high-passed
      sample C + "wood_falling_02.wav", start: 0.05, rate: 0.9 * r, amp: 0.1, attack: 0.02, sustain: 0.2, release: 0.12
    end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
