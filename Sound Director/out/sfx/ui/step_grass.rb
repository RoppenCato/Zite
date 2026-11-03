# step_grass: a step on the board's grass. Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/step-grass-1..3): one per
# step of a walk, 260 ms a step, so 0.25 s at most, two or three variants, soft. Robin's rule (2026-11-01): the library first. These are
# Kenney's grass footsteps (Impact Sounds / RPG Audio packs on this PC, CC0; the Survival game's C:\dev\SG\Sound Director\sfx\world\ref\kenney\)
# played as recorded, cut to 0.24 s with a short fade, under a 7 kHz low-pass so the grass rustles without hissing. Three of the five.
# name: step_grass
# seconds: 4.4
# count: 3

use_bpm 60                                   # times in seconds
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
FILES = ["footstep_grass_000.ogg", "footstep_grass_002.ogg", "footstep_grass_004.ogg"]

define :one do |v|
  use_random_seed 3800 + v
  r = 1 + rrand(-0.03, 0.03)
  with_fx :lpf, cutoff: 119 do                               # 7 kHz
    sample K + FILES[v], rate: r, amp: 1.0, attack: 0, sustain: 0.17, release: 0.07
  end
end

3.times do |v|
  one v
  sleep 1.3
end
