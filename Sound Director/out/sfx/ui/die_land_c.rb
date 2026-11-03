# die_land_c: the die landing on the board, candidate C. The lucky die: B with a small bright chime at the landing, the storybook sparkle of the moment (Miles, GD: the dopamine sound).
# Miles, GD's brief (docs/sound-demands.md, wave 1): the land is the beat of the game, one sound, bright, under 0.5 s; the game
# pitches it a little by the face. One of the four sounds that carry the game (Robin, 2026-11-01), so made new and ours.
# Recorded wood only (sfx/ui/ref/README.md: rubberduck's CC0 wood knocks, Kenney's light impact), layered as docs/sfx-notes.md
# says: the clack is the loudest moment, the body under it, bounces after, no room. No oscillator but the chime: one pretty bell, quiet and short, well above the knock.
# name: die_land_c
# seconds: 4.4
# count: 3

use_bpm 60                                   # times in seconds
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"

define :one do |v|
  use_random_seed 3300 + v
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
    # the chime: a high bell on the landing, the glint; it fades under the bounces. Notes by variation (G6, A6, B6), so the
    # three are not one pitch repeated; the game's own pitch-by-face shifts it a little more.
    at [0.004] do
      synth :pretty_bell, note: [91, 93, 95][v], attack: 0.002, sustain: 0.02, release: 0.3, amp: 0.16
      synth :sine, note: [91, 93, 95][v] + 12, attack: 0.002, sustain: 0.01, release: 0.12, amp: 0.03
    end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
