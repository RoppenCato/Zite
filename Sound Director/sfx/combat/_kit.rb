# The combat sounds' kit (2026-10-15): the layers every strike is built from, after docs/sfx-notes.md. A strike is a
# transient (the first milliseconds), a body (what was hit), a sub (the weight, under its own low-pass), a detail that
# lands a little late (the edge, the bite, the grit) and no room tail (the hits come fast). No oscillator in a strike:
# samples and noise only. Times are in seconds (each sound runs at use_bpm 60). Load with
#   eval File.read("C:/dev/Zite/Sound Director/sfx/combat/_kit.rb")

# a whoosh: noise through a band-pass that sweeps from lo up to hi and back down, loudest at `peak` of the way through.
# Heavier weapons: lower, longer, brown noise. A high res makes a thin whistle (still noise, not a tone).
define :whoosh do |d, lo, hi, amp, res = 0.45, kind = :pnoise, peak = 0.55|
  in_thread do
    with_fx :bpf, centre: lo, res: res do |fx|
      synth kind, attack: d * peak, sustain: 0, release: d * (1 - peak), amp: amp
      control fx, centre: hi, centre_slide: d * peak
      sleep d * peak
      control fx, centre: lo + 4, centre_slide: d * (1 - peak)
      sleep d * (1 - peak) + 0.05
    end
  end
end

# the body of a hit on flesh or hide: a heavy kick drum tuned up, cut short, low-passed
define :flesh do |rate, amp, len, cut = 92|
  with_fx :lpf, cutoff: cut do
    sample :drum_heavy_kick, rate: rate, amp: amp, attack: 0, sustain: len * 0.3, release: len * 0.7
  end
end
# the skin's slap: the transient of a hit on flesh
define :slap do |rate, amp|
  sample :tabla_tas1, rate: rate, amp: amp, attack: 0, sustain: 0.006, release: 0.03
end
# the weight: a boom under its own low-pass (one layer owns the low end)
define :sub do |rate, amp, len, cut = 62|
  with_fx :lpf, cutoff: cut do
    sample :bd_boom, rate: rate, amp: amp, attack: 0, sustain: len * 0.3, release: len * 0.7
  end
end
# the bite: a burst of crackle through a band-pass
define :crunch do |centre, amp, len|
  with_fx :bpf, centre: centre, res: 0.35 do
    synth :cnoise, attack: 0.001, sustain: len * 0.3, release: len * 0.7, amp: amp
  end
end
# the edge: a thin band of noise just after the contact
define :slice do |centre, amp, len, delay = 0.004|
  in_thread do
    sleep delay
    with_fx :bpf, centre: centre, res: 0.6 do
      synth :pnoise, attack: 0.002, sustain: len * 0.2, release: len * 0.8, amp: amp
      sleep len + 0.05
    end
  end
end
# iron touching: a bell sample cut before it can ring
define :iron do |rate, amp, len = 0.015|
  sample :perc_bell, rate: rate, amp: amp, attack: 0, sustain: len * 0.4, release: len * 0.6
end
# a short metal ring under a low-pass, so it is bright but not glassy
define :metal do |name, rate, amp, len, cut = 118|
  with_fx :lpf, cutoff: cut do
    sample name, rate: rate, amp: amp, attack: 0, sustain: len * 0.25, release: len * 0.75
  end
end
# wood: the door sample as a thick wooden thunk (a shield, a haft)
define :wood do |rate, amp, len|
  sample :perc_door, rate: rate, amp: amp, attack: 0, sustain: len * 0.3, release: len * 0.7
end
# any sample, cut to a length with no tail
define :snd do |name, rate, amp, len|
  sample name, rate: rate, amp: amp, attack: 0, sustain: len * 0.3, release: len * 0.7
end
# a sample played backwards, its last `len` seconds before the attack, so it swells INTO its attack
define :swell do |name, rate, amp, len|
  f = [len * rate.abs / sample_duration(name), 1.0].min
  sample name, rate: -rate.abs, amp: amp, start: 0, finish: f
end
# chips, grit, cloth, rattle: a few grains of noise falling away
define :grains do |n, centre, amp, step = 0.02, delay = 0.02|
  in_thread do
    sleep delay
    with_fx :bpf, centre: centre, res: 0.3 do
      n.times { |i| synth :pnoise, attack: 0.002, sustain: 0.004, release: 0.025, amp: amp * (1 - i * 0.7 / n); sleep step + rrand(0, step * 0.6) }
      sleep 0.05
    end
  end
end
