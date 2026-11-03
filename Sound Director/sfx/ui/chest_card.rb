# chest_card: a card slides out of the chest. Kenney's page flip played a third faster and cut to 0.35 s, under a 7 kHz low-pass: paper and card, nothing more.
# Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/chest-card). Enchanted Kingdoms: storybook, wood and bells, short,
# never piercing. Recorded wood for every knock (sfx/ui/ref/README.md); bells are the studio's pretty bell, the one synth voice Robin
# has liked, in C pentatonic so they sit over any region's key. Written by sfx/ui/_make.py; change it there.
# name: chest_card
# seconds: 3.8
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
  use_random_seed 3630 + v
  r = 1 + rrand(-0.04, 0.04)

  with_fx :lpf, cutoff: 119 do                               # 7 kHz
    sample C + "bookFlip2.wav", rate: (1.3 + rrand(-0.05, 0.05)) * r, amp: 1.0, attack: 0.005, sustain: 0.2, release: 0.1
  end
end

3.times do |v|
  one v
  sleep 1.1
end
