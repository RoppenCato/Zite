# The studio's fight kit (2026-10-15): the voices and drums the raid pieces share. Load it after _lib.rb:
#   eval File.read("C:/dev/Zite/Sound Director/music/_fight.rb")
# Built from Robin's takes (docs/maple-guide.md section 7): no drum-machine samples (bd_haus, sn_dolf, the hats), no
# pulsing detuned saws ("80s retro cyber"), no triangle leads (they read as a flute), no flute, bells or harp (lullaby).
# The blade synth carries about 10 dB less than a saw or a sine at the same amp, and turns harsh when pushed: strings
# double the horn, they do not lead alone.

# the war horn: two saws a hair apart and a triangle an octave below, through a low-pass that opens with the pitch
WARHORN = lambda do |n, d, amp|
  next if amp <= 0
  sus = [d - 0.25, 0.1].max
  with_fx :lpf, cutoff: 82 + [(n - 50) * 0.5, 0].max do
    synth :saw, note: n, attack: 0.08, sustain: sus, release: 0.28, amp: amp * 0.34
    synth :saw, note: n + 0.1, attack: 0.1, sustain: sus, release: 0.28, amp: amp * 0.2
    synth :tri, note: n - 12, attack: 0.08, sustain: sus, release: 0.24, amp: amp * 0.14
  end
end
# a second horn a fixed interval away (parallel fifths or fourths: the old organum sound)
define :horn_at do |shift|
  lambda { |n, d, amp| WARHORN.call(n + shift, d, amp) }
end

# strings doubling a line: two smooth blades a hair apart, a darker cutoff, no saw layer
STRS = lambda do |n, d, amp|
  next if amp <= 0
  sus = [d - 0.15, 0.05].max
  synth :blade, note: n - 0.05, attack: 0.05, sustain: sus, release: 0.25, cutoff: 96, vibrato_rate: 5.5, vibrato_depth: 0.12, vibrato_delay: 0.25, amp: amp * 0.3
  synth :blade, note: n + 0.05, attack: 0.06, sustain: sus, release: 0.25, cutoff: 96, vibrato_rate: 5.2, vibrato_depth: 0.12, vibrato_delay: 0.3, amp: amp * 0.3
end

# the low bowed chord under everything
BOWL = lambda do |n, d, amp|
  next if amp <= 0
  sus = [d - 0.35, 0.1].max
  synth :blade, note: n, attack: 0.1, sustain: sus, release: 0.3, cutoff: 92, vibrato_rate: 4.5, vibrato_depth: 0.06, vibrato_delay: 0.5, amp: amp * 0.3
end

# a short bowed note: the string section's drive in eighths
SHORTBOW = lambda do |n, amp|
  next if amp <= 0
  synth :blade, note: n, attack: 0.02, sustain: 0.12, release: 0.15, cutoff: 86, vibrato_depth: 0.02, amp: amp * 0.32
end

# the lyre: a low plucked string, dark and dry. NOT FOR FIGHTS (Robin, 2026-10-15: "I don't like the lyre for fighting",
# after it drove Shield wall v2, v3, A, B and C). Kept only so those archived sources still render.
LYRE = lambda do |n, amp|
  next if amp <= 0
  synth :pluck, note: n, coef: 0.32, pluck_decay: 10, noise_amp: 0.85, release: 0.3, amp: amp * 0.9
end

# ---- the drums: real drums and wood only ------------------------------------------------------------------
define :fk_big do |amp|                 # the war drum: a boom and a low tom struck together
  if amp > 0
    sample :bd_boom, amp: amp * 0.6, rate: 0.85
    sample :drum_tom_lo_hard, amp: amp * 0.7, rate: 0.9
  end
end
define :fk_lo do |amp|
  sample :drum_tom_lo_hard, amp: amp * 0.55, rate: 1.05 if amp > 0
end
define :fk_mid do |amp|
  sample :drum_tom_mid_hard, amp: amp * 0.55, rate: 0.95 if amp > 0
end
define :fk_hi do |amp|
  sample :drum_tom_hi_hard, amp: amp * 0.45, rate: 0.95 if amp > 0
end
define :fk_rumble do |amp|              # a low drum played soft and fast: the running engine, in place of the lyre
  sample :drum_tom_lo_soft, amp: amp * 0.5, rate: 0.9 if amp > 0
end
define :fk_hand do |amp|                # a frame drum, struck with the hand
  sample :drum_tom_mid_soft, amp: amp * 0.3, rate: 1.35 if amp > 0
end
define :fk_shield do |amp|              # shields knocking: wood on wood with a dull impact under it
  if amp > 0
    sample :elec_wood, amp: amp * 0.5, rate: 0.55
    sample :perc_impact2, amp: amp * 0.3, rate: 1.2, finish: 0.2
  end
end
define :fk_slam do |amp|                # the shield wall closing: shields, a hard snare and an impact at once
  if amp > 0
    fk_shield(amp)
    sample :drum_snare_hard, amp: amp * 0.35, rate: 0.85
    sample :perc_impact1, amp: amp * 0.25, rate: 1.1, finish: 0.25
  end
end
define :fk_crash do |amp|               # the arrival of a section: a deep impact and an open cymbal, short
  if amp > 0
    sample :perc_impact1, amp: amp * 0.45, rate: 0.8
    sample :drum_cymbal_open, amp: amp * 0.22, rate: 0.9, finish: 0.55
  end
end
# a roll over `steps` sixteenths from lo to hi level, toms alternating (the hi tom in the last four when hi_end)
define :fk_roll do |steps, lo, hi, hi_end = true|
  steps.times do |j|
    m, dt = hum(0.05, 0.003)
    lvl = lo + (hi - lo) * j / [steps - 1, 1].max.to_f
    time_warp(dt) do
      if hi_end && j >= steps - 4 then fk_hi(lvl * m)
      elsif j.even? then fk_mid(lvl * m)
      else fk_lo(lvl * m)
      end
    end
    sleep 0.25
  end
end
