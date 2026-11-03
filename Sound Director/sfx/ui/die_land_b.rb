# die_land_b: the die landing on the board, candidate B. The die on the board: the clack with the board's body under it, two bounces getting smaller, a few grains as it settles.
# Miles, GD's brief (docs/sound-demands.md, wave 1): the land is the beat of the game, one sound, bright, under 0.5 s; the game
# pitches it a little by the face. One of the four sounds that carry the game (Robin, 2026-11-01), so made new and ours.
# Recorded wood only (sfx/ui/ref/README.md: rubberduck's CC0 wood knocks, Kenney's light impact), layered as docs/sfx-notes.md
# says: the clack is the loudest moment, the body under it, bounces after, no room. No oscillator.
# name: die_land_b
# seconds: 4.4
# count: 3

use_bpm 60                                   # times in seconds
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"

define :one do |v|
  use_random_seed 3200 + v
  r = 1 + rrand(-0.04, 0.04)
  with_fx :lpf, cutoff: 124 do                               # 8.9 kHz
    sample C + "wood_hit_06.wav", rate: 1.12 * r, amp: 1.0, attack: 0, sustain: 0.04, release: 0.06       # the clack: the front
    with_fx :hpf, cutoff: 62 do                              # 280 Hz: a board, not a floor
      sample C + "wood_hit_05.wav", rate: 1.05 * r, amp: 0.3, attack: 0, sustain: 0.03, release: 0.05     # the body: the board knocks
    end
    at [0.064 + rrand(-0.006, 0.006)] do
      sample C + "wood_hit_01.wav", rate: 1.3 * r, amp: 0.45, attack: 0, sustain: 0.025, release: 0.045   # bounce one, smaller
    end
    at [0.118 + rrand(-0.008, 0.008)] do
      sample C + "raise_e_1.wav", rate: 1.4 * r, amp: 0.25, attack: 0, sustain: 0.02, release: 0.04        # bounce two, lighter
    end
    at [0.15] do
      sample C + "wood_falling_02.wav", start: 0.08, rate: 1.25 * r, amp: 0.14, attack: 0, sustain: 0.06, release: 0.1   # the settle
    end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
