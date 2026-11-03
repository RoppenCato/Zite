# choice: a lit spot tapped, the way chosen. Two bright ticks rising, 45 ms apart, the second higher: a small lift, recorded wood only.
# Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/choice). Enchanted Kingdoms: storybook, wood and bells, short,
# never piercing. Recorded wood for every knock (sfx/ui/ref/README.md); bells are the studio's pretty bell, the one synth voice Robin
# has liked, in C pentatonic so they sit over any region's key. Written by sfx/ui/_make.py; change it there.
# name: choice
# seconds: 3.5
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
  use_random_seed 3620 + v
  r = 1 + rrand(-0.04, 0.04)

  with_fx :lpf, cutoff: 118 do                               # 6.6 kHz
    sample C + "wood_hit_01.wav", rate: 1.25 * r, amp: 0.8, attack: 0, sustain: 0.02, release: 0.04
    at [0.045 + rrand(-0.004, 0.004)] do
      sample C + "raise_e_1.wav", rate: 1.7 * r, amp: 0.7, attack: 0, sustain: 0.02, release: 0.05
    end
  end
end

3.times do |v|
  one v
  sleep 1.0
end
