# thrown: thrown stars: four thin whooshes and little metal ticks.
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: thrown
# seconds: 1.8
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
use_random_seed 6280
[0.0, 0.09, 0.18, 0.27].each_with_index do |t, i|
  at [t] do
    sample S + "combat/swish_seax_#{(i % 3) + 1}.wav", rate: 1.7, amp: 0.6
    sample S + "combat/tele_#{(i % 3) + 1}.wav", rate: 1.0 - i * 0.05, amp: 0.5
  end
end
sleep 1.3
