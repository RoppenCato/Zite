# die_land_a: the die landing on the board, candidate A. A plain clack: the die's corner on the board, one bounce. The nearest thing to a bare recording.
# Miles, GD's brief (docs/sound-demands.md, wave 1): the land is the beat of the game, one sound, bright, under 0.5 s; the game
# pitches it a little by the face. One of the four sounds that carry the game (Robin, 2026-11-01), so made new and ours.
# Recorded wood only (sfx/ui/ref/README.md: rubberduck's CC0 wood knocks, Kenney's light impact), layered as docs/sfx-notes.md
# says: the clack is the loudest moment, the body under it, bounces after, no room. No oscillator.
# name: die_land_a
# seconds: 4.4
# count: 3

use_bpm 60                                   # times in seconds
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"

define :one do |v|
  use_random_seed 3100 + v
  r = 1 + rrand(-0.04, 0.04)
  with_fx :lpf, cutoff: 124 do                               # 8.9 kHz: bright, never glassy
    sample C + "wood_hit_06.wav", rate: 1.12 * r, amp: 1.0, attack: 0, sustain: 0.04, release: 0.06       # the clack
    at [0.068 + rrand(-0.008, 0.008)] do
      sample C + "wood_hit_01.wav", rate: 1.3 * r, amp: 0.45, attack: 0, sustain: 0.025, release: 0.05    # the bounce, smaller
    end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
