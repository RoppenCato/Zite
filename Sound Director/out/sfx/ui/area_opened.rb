# area_opened: a new area opens: the cover lifts. A swell, softer than the banners: strings rising from a low C to a wide C major with the ninth over 1.2 s, bells shimmering up through it late, no knock, no drum, a long tail. 2 s.
# Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/area-opened). Enchanted Kingdoms: storybook, wood and bells, short,
# never piercing. Recorded wood for every knock (sfx/ui/ref/README.md); bells are the studio's pretty bell, the one synth voice Robin
# has liked, in C pentatonic so they sit over any region's key. Written by sfx/ui/_make.py; change it there.
# name: area_opened
# seconds: 8.9
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
  use_random_seed 3740 + v
  r = 1 + rrand(-0.04, 0.04)

  synth :blade, note: 48, attack: 0.6, sustain: 0.6, release: 0.7, cutoff: 84, vibrato_depth: 0.05, vibrato_delay: 0.5, amp: 0.14
  at [0.3] do synth :blade, note: 55, attack: 0.5, sustain: 0.6, release: 0.7, cutoff: 86, vibrato_depth: 0.05, amp: 0.12 end
  at [0.55] do synth :blade, note: 64, attack: 0.45, sustain: 0.55, release: 0.7, cutoff: 88, vibrato_depth: 0.06, amp: 0.1 end
  at [0.75] do synth :blade, note: 74, attack: 0.4, sustain: 0.5, release: 0.7, cutoff: 90, vibrato_depth: 0.06, amp: 0.07 end
  [[0.8, 84], [0.95, 88], [1.1, 91], [1.25, 93], [1.4, 96]].each do |t, n|
    at [t + rrand(-0.01, 0.01)] do bell n, 0.25 + 0.05 * (n - 84) / 3, 0.6 end
  end
  3.times do
    at [1.3 + rrand(0, 0.4)] do bell [98, 100, 103][rrand_i(0, 2)], 0.06, 0.3 end
  end
end

3.times do |v|
  one v
  sleep 2.8
end
