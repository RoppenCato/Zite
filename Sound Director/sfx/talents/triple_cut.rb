# triple_cut: three quick cuts: the recorded riposte three times, a bright hit on the last; under 7 kHz (the first render centred at 5 kHz).
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: triple_cut
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
use_random_seed 6270
with_fx :lpf, cutoff: 112 do
  [[0.0, 1, 0.9], [0.12, 2, 0.95], [0.24, 3, 1.0]].each do |t, f, ra|
    at [t] do sample S + "runes/riposte_a_#{f}.wav", rate: ra, amp: 0.8 end
  end
  at [0.25] do sample S + "flesh/hit_w_4.wav", amp: 1.0 end
end
sleep 1.3
