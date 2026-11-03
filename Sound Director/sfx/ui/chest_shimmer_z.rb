# chest_shimmer_z: the chest building, candidate Z (Robin, 2026-11-03: "I would love to hear you make something that's closer to Zelda opening chests").
# The Zelda chest's shape, not its notes: strings shivering on a chord that creeps up a half step at a time (C, Db, D, Eb), a timpani roll swelling under,
# a harp sweeping up into the lid. 1.5 s, the game's shimmer length; it can be cut anywhere by the game's fade. Pairs with chest_reveal_z.
# name: chest_shimmer_z
# seconds: 2.4
# count: 1

use_bpm 60
define :trem do |notes, d, amp|                # string tremolo: the blade through a fast tremolo, the shiver
  with_fx :tremolo, phase: 0.06, depth: 0.7, wave: 1 do
    notes.each { |n| synth :blade, note: n, attack: 0.05, sustain: d, release: 0.06, cutoff: 96, vibrato_depth: 0.05, amp: amp }
  end
end
[[0.0, [72, 76, 79]], [0.3, [73, 77, 80]], [0.6, [74, 78, 81]], [0.9, [75, 79, 82]]].each_with_index do |(t, ch), i|   # an octave up (the first render was 68 % under 250 Hz)
  at [t] do trem ch + [ch[0] - 12], (i == 3 ? 0.4 : 0.28), 0.16 + 0.04 * i end
end
26.times do |i|                                 # the timpani roll: a drum played soft and fast, swelling, under the strings
  at [i * 0.05] do sample :drum_tom_lo_soft, rate: 1.15, amp: 0.05 + i * 0.008, finish: 0.3 end
end
[63, 67, 70, 75, 79, 82, 87, 91].each_with_index do |n, i|   # the harp's sweep up, last 0.3 s
  at [1.0 + i * 0.04] do synth :pluck, note: n, coef: 0.25, pluck_decay: 25, amp: 0.35 + i * 0.04 end
end
sleep 2.4
