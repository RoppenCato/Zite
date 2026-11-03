# chest_reveal_z: the lid open, candidate Z (Robin, 2026-11-03, Zelda's chest as the reference). The tension of chest_shimmer_z ends on Eb; the reveal lands on
# G major, a bright step away: a quick pickup G4 B4 D5 into a held G chord on horn, strings and bells, a soft cymbal and the lid's wooden pop under it. 1.4 s.
# Own notes; the shape of an item reveal, not Zelda's tune. For every rarity at first; the rarities could later differ by how long the chord holds.
# name: chest_reveal_z
# seconds: 2.5
# count: 1

use_bpm 60
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
define :horn do |n, d, amp|
  with_fx :lpf, cutoff: 88 do
    synth :saw, note: n, attack: 0.03, sustain: d, release: 0.25, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.04, sustain: d, release: 0.25, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.03, sustain: d, release: 0.2, amp: amp * 0.12
  end
end
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
sample W + "wood_hit_07.wav", rate: 1.15, amp: 0.9, attack: 0, sustain: 0.04, release: 0.08     # the lid
[[0.0, 67], [0.08, 71], [0.16, 74]].each do |t, n|
  at [t] do horn n, 0.05, 0.9; synth :pluck, note: n, coef: 0.25, pluck_decay: 25, amp: 0.4 end
end
at [0.25] do
  horn 79, 0.9, 1.3; horn 71, 0.9, 0.7; horn 67, 0.9, 0.6
  [55, 62, 67, 71, 74].each { |n| synth :blade, note: n, attack: 0.03, sustain: 0.85, release: 0.4, cutoff: 98, vibrato_depth: 0.07, vibrato_delay: 0.3, amp: 0.12 }
  bell 91, 0.8, 1.0; bell 86, 0.5, 0.9; bell 83, 0.4, 0.8
  sample :drum_splash_soft, rate: 0.9, amp: 0.25, finish: 0.5
  sample :drum_tom_lo_hard, rate: 0.9, amp: 0.35
end
sleep 2.5
