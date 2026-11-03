# chest_shimmer: the glow builds before the lid moves. A rising run of small bells in C pentatonic over 1.4 s, each a little louder, glitter above them, a soft string swell under: a build with no event at its end, so the game's fade on a tap can cut it anywhere, and the game may stretch it by rarity.
# Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/chest-shimmer). Enchanted Kingdoms: storybook, wood and bells, short,
# never piercing. Recorded wood for every knock (sfx/ui/ref/README.md); bells are the studio's pretty bell, the one synth voice Robin
# has liked, in C pentatonic so they sit over any region's key. Written by sfx/ui/_make.py; change it there.
# name: chest_shimmer
# seconds: 7.7
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
  use_random_seed 3650 + v
  r = 1 + rrand(-0.04, 0.04)

  notes = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98]
  notes.each_with_index do |n, i|
    at [i * 0.115 + rrand(-0.006, 0.006)] do
      bell n, 0.1 + 0.02 * i, 0.4
    end
  end
  8.times do |i|                                             # glitter: tiny high bells scattered through the second half
    at [0.5 + rrand(0, 0.9)] do
      bell [96, 98, 100, 103, 105][rrand_i(0, 4)], 0.05, 0.25
    end
  end
  synth :blade, note: 60, attack: 1.0, sustain: 0.25, release: 0.3, cutoff: 86, vibrato_depth: 0.05, amp: 0.1   # the swell under
  synth :blade, note: 67, attack: 1.1, sustain: 0.2, release: 0.3, cutoff: 86, vibrato_depth: 0.05, amp: 0.07
end

3.times do |v|
  one v
  sleep 2.4
end
