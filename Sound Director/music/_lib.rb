# The studio's shared library: the instruments, the notation and the helpers every track uses.
# A track loads it with:   eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")
# (run_file would start it as a separate run, so its definitions would not be there in time.)
# Instruments follow the map in docs/sound-direction.md. Nothing in here draws random numbers: parts do that,
# through `hum`, so a stem's random stream is the same whether or not the part sounds.

# ---- stems ----------------------------------------------------------------------------------------------
# STEM is :full, :base, :calm or :danger (the renderer sets it). stem_on?(:calm) says whether a part sounds (on? is a built-in).
define :stem_on? do |tag|
  STEM == :full || STEM == tag
end

# a short marker click at the very start of pass one (outside every FX), so the renderer finds beat one exactly
define :marker do
  synth :beep, note: 96, release: 0.006, amp: 0.5
end

# ---- notation -------------------------------------------------------------------------------------------
# The game's notation: "F5:q. E5:e r:q Bb4+D5:h@70 | ..." -> [[notes or nil, beats, vel 0..1], ...]
# lengths w h q e s (4 2 1 0.5 0.25 beats), a dot is one and a half, r is a rest, + stacks a chord, @ is velocity 0..127
define :parse_notes do |str|
  lens = { "w" => 4.0, "h" => 2.0, "q" => 1.0, "e" => 0.5, "s" => 0.25 }
  out = []
  str.gsub("|", " ").split(/\s+/).each do |tk|
    next if tk.empty?
    m = tk.match(/\A([^:@]+):([whqes]\.?)(?:@(\d+))?\z/)
    next unless m
    d = lens[m[2][0]] * (m[2].length > 1 ? 1.5 : 1.0)
    v = m[3] ? m[3].to_i / 127.0 : 0.63
    ns = m[1] == "r" ? nil : m[1].split("+").map { |x| note(x.sub("#", "s").to_sym) }   # Sonic Pi writes sharps as s: Fs6
    out << [ns, d, v]
  end
  out
end

# a chord symbol as the game writes it: F, Dm7, Bb, C7, Fmaj7, Gsus, F6, F/A  -> { root:, notes: [midi...], bass: }
define :sym_chord do |sym|
  m = sym.match(/\A([A-G][#b]?)(maj7|m7|m|7|sus|dim|6)?(?:\/([A-G][#b]?))?\z/)
  r = note((m[1].sub("#", "s") + "4").to_sym)
  q = m[2] || ""
  iv = [0, 4, 7]
  iv[1] = 3 if q == "m" || q == "m7"
  if q == "dim" then iv[1] = 3; iv[2] = 6 end
  iv[1] = 5 if q == "sus"
  iv << 10 if q == "7" || q == "m7"
  iv << 11 if q == "maj7"
  iv << 9 if q == "6"
  bass = m[3] ? note((m[3].sub("#", "s") + "3").to_sym) : r - 12
  { root: r, notes: iv.map { |i| r + i }, bass: bass }
end

# ---- humanising ------------------------------------------------------------------------------------------
# hum(amp_jitter, time_jitter_beats) -> [amp multiplier, time offset]. Always called, even for a silent stem.
define :hum do |aj = 0.08, tj = 0.012|
  [1.0 + rrand(-aj, aj), rrand(-tj, tj)]
end

# phrase shaping: louder toward the top of a line. n the midi note, lo..hi the line's range, floor and spr the amps
# (names such as `spread` and `line` are Sonic Pi functions and may not be used as variables)
define :shape do |n, lo, hi, floor = 0.8, spr = 0.35|
  hi == lo ? floor : floor + spr * (n - lo).to_f / (hi - lo)
end

# play a written line with an instrument: inst is a lambda |note, beats, amp|; the line's range shapes the loudness
define :play_line do |str, inst, amp = 1.0, aj = 0.08, tj = 0.012|
  evs = parse_notes(str)
  pitches = evs.select { |e| e[0] }.flat_map { |e| e[0] }
  lo = pitches.min || 60
  hi = pitches.max || 72
  evs.each do |ns, d, v|
    a, dt = hum(aj, tj)
    if ns
      ns.each do |n|
        time_warp dt do
          inst.call(n, d, amp * a * shape(n, lo, hi) * (v / 0.63))
        end
      end
    end
    sleep d
  end
end

# ---- the instruments -------------------------------------------------------------------------------------
# each is a lambda |note, beats, amp| so it can be handed to play_line; amp 0 plays nothing.
# Envelope times are in BEATS (Sonic Pi scales them by the bpm): 0.12 at 118 bpm is about 60 ms.

# flute: a sine with a triangle an octave up, a soft attack, a slow vibrato that comes in late, a breath of noise
FLUTE = lambda do |n, d, amp|
  next if amp <= 0
  sus = [d - 0.1, 0.05].max
  s = synth :sine, note: n, attack: 0.12, sustain: sus, release: 0.25, amp: amp * 0.55, note_slide: 0.09
  synth :tri, note: n + 12, attack: 0.14, sustain: sus, release: 0.2, amp: amp * 0.09
  with_fx :bpf, centre: n, res: 0.6, amp: 1 do
    synth :noise, attack: 0.02, sustain: 0.06, release: 0.08, amp: amp * 0.05
  end
  if d >= 0.9
    in_thread do
      sleep 0.3
      steps = ((d - 0.4) / 0.18).floor
      steps.times do |i|
        control s, note: n + (i.even? ? 0.12 : -0.12)
        sleep 0.18
      end
      control s, note: n
    end
  end
end

# clarinet: a half-width pulse through a low-pass, soft attack
CLARINET = lambda do |n, d, amp|
  next if amp <= 0
  with_fx :lpf, cutoff: 92 do
    synth :pulse, note: n, pulse_width: 0.5, attack: 0.1, sustain: [d - 0.15, 0.05].max, release: 0.12, amp: amp * 0.42
  end
end

# piano: Sonic Pi's piano model; vel and hard follow the amp so loud notes are harder
PIANO = lambda do |n, d, amp|
  next if amp <= 0
  v = [[0.18 + amp * 0.3, 0.12].max, 0.7].min
  synth :piano, note: n, vel: v, hard: 0.35 + v * 0.5, stereo_width: 0.3, release: [d * 1.2, 0.6].max, amp: amp * 0.9
end

# bell: pretty_bell an octave up with a sine shimmer two octaves up
BELL = lambda do |n, d, amp|
  next if amp <= 0
  synth :pretty_bell, note: n, release: 1.1, amp: amp * 0.5
  synth :sine, note: n + 12, release: 0.5, amp: amp * 0.08
end

# harp: a plucked string with a soft sine behind it for warmth
HARP = lambda do |n, d, amp|
  next if amp <= 0
  synth :pluck, note: n.round, coef: 0.25, pluck_decay: 30, noise_amp: 0.8, release: [d * 1.5, 1.2].max, amp: amp * 0.8
  synth :sine, note: n, attack: 0.005, release: 0.45, amp: amp * 0.12
end

# strings: the blade (filtered saws with vibrato), slow in, slow out, quiet; a pad never leads
STRINGS = lambda do |n, d, amp|
  next if amp <= 0
  synth :blade, note: n, attack: 0.7, sustain: [d - 0.8, 0.1].max, release: 1.4, cutoff: 88, vibrato_rate: 5, vibrato_depth: 0.08, vibrato_delay: 0.8, amp: amp * 0.22
end

# bass: fm with a sine an octave up for the round front
BASS = lambda do |n, d, amp|
  next if amp <= 0
  synth :fm, note: n, depth: 0.6, divisor: 1, attack: 0.005, sustain: [d - 0.25, 0.08].max, release: 0.3, amp: amp * 0.55
  synth :sine, note: n + 12, attack: 0.005, sustain: [d - 0.3, 0.05].max, release: 0.2, amp: amp * 0.12
end

# percussion, all dry
define :shaker do |amp|
  synth :sc808_maracas, decay: 0.09, hpf: 115, amp: amp * 0.45 if amp > 0
end
define :rim do |amp|
  synth :sc808_rimshot, decay: 0.06, amp: amp * 0.35 if amp > 0
end
define :kick do |amp|
  sample :bd_pure, amp: amp * 0.9, rate: 0.95 if amp > 0
end
