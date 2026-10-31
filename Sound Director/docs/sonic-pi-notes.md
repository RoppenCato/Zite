> Carried over from the Survival game's sound studio (C:\dev\SG\Sound Director) on 2026-10-31. The places and sounds named in it are that game's; the rules, the tools and what Robin's ear taught stand for the board world game too. Nigel, SD.

# Sonic Pi 5: what was learnt

Gathered 2026-10-14 from the installed tutorial (`C:\Program Files\Sonic Pi\etc\doc\tutorial`), the synth definitions
(`app\server\ruby\lib\sonicpi\synths\synthinfo.rb`), the v5 changelog and the community forum (in-thread.sonic-pi.net).
Sources at the end.

## How it is built, and how we drive it

- **v5.0.0 "SuperSonic" (August 2026)** replaced SuperCollider's scsynth with Sam Aaron's own port, SuperSonic. Audio
  settings change live; the engine here runs at **48 kHz**, block 128, on the Windows "Primary Sound Driver".
- Three processes: the **daemon** (`daemon.rb`, boots the rest, prints ports and a token to stdout, dies without a
  keep-alive every few seconds), the **spider** (the Ruby language server: receives `/run-code TOKEN CODE` over UDP, sends
  `/log/*`, `/error`, `/syntax_error` back) and **SuperSonic** (the engine, OSC over TCP; `/supersonic/record/start PATH wav 24`
  and `/supersonic/record/stop` record the main mix).
- Sonic Pi ships `headless_boot.rb` (boots all three and hands back OSC clients), `headless-run.rb` (muted test runs) and
  `headless-record.rb -o OUT.wav -d SECONDS -f FILE.rb [-s SEED]` (code in, 24-bit WAV out, **real time**: there is no
  faster-than-realtime render; the forum confirms non-realtime mode is unreachable from Sonic Pi).
- Code starts about half a second after the run message (the schedule-ahead time), so a recording has silence at the
  front. Our renderer finds the first onset and cuts from there.
- `set_volume!` is now 0 to 1 and sits after a **limiter**; `set_drive!` (0 = -12 dB, 0.5 unity, 1 = +12 dB) feeds the limiter.
  We never rely on the limiter: it changes the sound.

## The synths worth using for this game

| Role | Synth and opts | Notes |
| --- | --- | --- |
| Piano | `:piano, vel: 0.2..0.5, hard: 0.3..0.7, stereo_width:` | a real plucked model; `attack/sustain/release` only shorten the natural note; vary `vel` and `hard` per note |
| Electric piano | `:rhodey` (vel, mod_index), `:rodeo` (chorus, compressor built in) | a hall, a trader |
| Harp, lute | `:pluck, coef: 0.3, pluck_decay: 30, noise_amp: 0.8` | Karplus-Strong; whole tones only; `coef` higher is duller |
| Celesta, music box | `:pretty_bell`, `:dull_bell`; `:kalimba, clickiness:` | short release, an octave or two up |
| Flute, recorder | `:sine` + `:tri` an octave up at 0.25, slow attack, a touch of `:noise` through `:bpf` for breath; vibrato with `control ... note_slide` | no wind synth exists; the forum agrees it must be built |
| Clarinet | `:pulse, pulse_width: 0.5` through `:lpf cutoff: 90`, soft attack | odd harmonics as a clarinet |
| Strings | `:blade` (`vibrato_rate: 6, vibrato_depth: 0.15, vibrato_delay: 0.5`, `cutoff: 100`) or `:dsaw, detune: 0.1` through `:lpf cutoff: 80..95`, `attack: 0.3..0.6, release: 0.6` | `:blade` is the "Blade Runner strings" and fills a pad well |
| Bass | `:fm, depth: 0.5..1, divisor: 1..2` or `:sine` + `:tri` at 0.4, `release: 0.4`; `:bass_foundation, cutoff: 83` | keep it under C3 |
| Organ | `:organ_tonewheel` (drawbars `bass quint fundamental oct`, rotary speaker opts) | a church |
| Soft kick, snare, hats | samples `:bd_pure`, `:bd_sone`, `:bd_haus` (low `rate`), `:sn_dolf`, `:drum_cymbal_closed`, `:hat_tap`, `:hat_gem`, `:perc_snap`, `:elec_tick`; or the `:sc808_*` synths | 207 bundled samples at 44.1 kHz, all FLAC, loaded on first use (`load_samples` first) |
| Shaker | `:sc808_maracas, decay: 0.1, hpf: 113` or `:noise, release: 0.06` through `:hpf cutoff: 110` | |
| Rim | `:sc808_rimshot, decay: 0.07` or `:perc_snap` | |
| Pads, drones | `:dark_ambience`, `:hollow`, `:growl`, `:prophet`, `:tech_saws`, `:supersaw` | darker ones for the cave and the troll |
| Noise for SFX | `:noise`, `:pnoise`, `:bnoise`, `:gnoise`, `:cnoise`, `:chipnoise` | attack is 0; the hit lives in `release:` and `cutoff:` |

FX (defaults): `:reverb mix: 0.4 room: 0.6 damp: 0.5`, `:gverb` (bigger, `room: 10 release: 3`), `:echo phase: 0.25 decay: 2`,
`:ping_pong`, `:compressor threshold: 0.2`, `:tremolo`, `:chorus`, `:lpf/:hpf/:rlpf`, `:eq`, `:band_eq`, `:pan`, `:level`,
`:pitch_shift`, `:octaver`, `:distortion`, `:bitcrusher`, `:krush`, `:tanh`.

## Techniques that matter here

- **Structure in bars first.** Plan a table of sections and which instrument enters where; then code. One `define` per
  instrument (so a voice is one place to fix), one `in_thread` per part, all started together so they share time.
  `use_bpm` once at the top; everything in beats. A `live_loop` is for performing; a finite piece uses `in_thread` and
  plain loops so it ends and so the renderer knows its length.
- **`play_pattern_timed`** stretches each note's `sustain:` to the next note (legato); pass `sustain: 0` for natural
  envelopes. It takes lists for per-note opts (`amp: [..]`) since v5. Rests are `:r` in rings.
- **`with_fx` outside the loop**, never inside a per-note loop (a new reverb per note eats CPU and sounds different);
  `reps:` repeats a block inside one FX. A chain `with_fx :reverb do with_fx :lpf do ... end end` is fine.
- **Chords and scales**: `chord(:f4, :major7)`, `chord_degree(2, :f, :major, 4)`, `scale(:f3, :major, num_octaves: 2)`,
  `.invert`, `.tick`/`.look` on rings, `ring.invert_around` (v5). New v5 chords: `:minor_major7`, `:maj13`, `9-5`, `7+9`.
- **Humanising.** Seeded (`use_random_seed`) so every render is the same. Velocity jitter of about 5 to 10 percent and
  timing of 5 to 15 ms (SD about 0.01 beat at 120 bpm) is what the forum settled on; built-in samples need more than MIDI
  instruments do, but too much sounds badly played. Drums and bass tight, the lead looser. `with_swing -0.08, 2` for a light
  shuffle on hats. Vary `vel:` and `hard:` on the piano note by note.
- **Shaping a line.** Louder at the top of a phrase, softer at its end; a pickup into a section; the fifth of the next chord
  just before a change leads the ear. Repeat the hook with a new ending (A, A') before the B section.
- **Controlling running synths.** `s = play ...; control s, note: 65, note_slide: 0.2` for slides and vibrato; `with_fx :lpf
  do |fx| control fx, cutoff_slide: 4, cutoff: 110 ... end` for filter sweeps (danger swells, a cave opening).
- **Samples**: `sample :bd_pure, amp: 0.8, rate: 0.9`; `rate:` changes pitch and length; `start:`/`finish:` slice; the
  envelope can only shorten. `sample_duration`. Load them up front with `load_samples [...]`.
- **Random melodies on demand**: a seeded `.shuffle` of a scale, `one_in(2)` for rhythm; a way to find material, not to
  ship it. We write the tunes.
- **Limits.** Sonic Pi plays very evenly (a wooden Debussy); there is no convincing wind or sax; the `:piano` and `:pluck`
  envelopes cannot be lengthened; `:pluck` only plays whole tones; renders are real time.
- **The `:blade` fiddle is quiet as a lead (measured 2026-10-15).** Worked back from two renders of the sea voyage's
  reel (amp 1.0 then 1.9, the section rising only 1.2 dB): at the same amp the blade fiddle carries about 10 dB less
  power than the flute's sine. A fiddle line that leads alone wants about 3.5 to 4.5 times the flute's amp; in unison
  with the horn 1.0 is enough.
  But pushed that hard it turns harsh: Robin heard the sea voyage's intro call at 3.5 times as "too noisy" (2026-10-15).
  Where a section is quiet, give the line to a voice that is naturally present (the bells, the flute) rather than
  boosting the fiddle; if the fiddle must lead loud, darken it first (a lower cutoff, no saw layer).
- **The saw horn reads quiet too (measured 2026-10-15, three times).** Through its low-pass, the war horn at the
  flute's amp sits 4 to 6 dB under it in the mix (Shield wall v3, the title's horn verse, the serpent's keel). A horn
  carrying a tune wants about 1.6 times the flute's amp; a low horn (octave 3) about 2 times. Measure every new
  section's bars against the section before it; a "lift" that measures quieter is a hole.

## Our tools (see docs/pipeline.md)

`tools\sonicpi-play.cmd` (hear a file on the speakers), `tools\sonicpi-gui.cmd` (send into Robin's open app),
`node tools\render-track.js` (record stems, cut the loop, manifest), `node tools\wavtool.js` (measure a WAV).

## Sources

- Sonic Pi v5 release: https://in-thread.sonic-pi.net/t/sonic-pi-v5-released/10033 and the changelog
  https://raw.githubusercontent.com/sonic-pi-net/sonic-pi/dev/CHANGELOG.md
- The installed tutorial, especially 5.4 Threads, 5.7 Cue and Sync, 6.2 FX in Practice, 7.3 Sliding, 8.2 Chords, 8.3 Scales,
  9.4 Ticking, A.1 Tips, A.4 Synth Riffs, A.18 Additive and A.19 Subtractive Synthesis; the examples `sorcerer/bach.rb`
  (a written piece in threads), `illusionist/ocean.rb` (noise beds), `magician/ambient.rb`.
- Structuring songs: https://in-thread.sonic-pi.net/t/best-practices-for-structuring-songs-in-sonic-pi/7501,
  https://in-thread.sonic-pi.net/t/sections-song-structure-definition/5792
- Humanisation: https://in-thread.sonic-pi.net/t/humanisation-in-sonic-pi/2393
- Piano sound: https://in-thread.sonic-pi.net/t/how-can-i-get-this-kind-of-piano-sound/4735
- Recording from code: https://in-thread.sonic-pi.net/t/recording-sonic-pi-output-into-wav-files-programatically/949,
  https://in-thread.sonic-pi.net/t/export-to-wav-with-command-line/4674
- Live-coding techniques (mixer, sync): https://magpi.raspberrypi.com/articles/sonic-pi-techniques
- Synth design in SuperCollider (for custom synthdefs, not used yet): https://github.com/joearms/sonic-pi/blob/master/SYNTH_DESIGN.md

## What others say and do (research, 2026-10-22; the whole of it in `docs/research-tools.md`)

- **Acoustic sounds come from samples.** The built-in synths lean electronic; people who want a piano, a flute or strings
  play recorded samples: the nearest recorded note pitched the rest of the way (`rpitch:`), a velocity layer per dynamic
  (one user: eight dynamics from the loudest layers, a low-pass for the soft ones). For a wind, one sample and `rpitch:`
  is said to be enough. VSCO 2 Community Edition (CC0) is the free orchestra for it. Others send `midi` out to FluidSynth.
- **No faster-than-real-time render** exists inside Sonic Pi; recording is real time. SuperCollider's own NRT mode is.
- **FX cost:** a `with_fx :reverb` inside a fast loop makes a new reverb each pass, kept alive for its tail (a big room:
  about ten seconds, so dozens at once). Wrap the whole part instead. `use_debug false` helps "can't keep up". CPU power
  saving can glitch real-time audio.
- **Code models handle Sonic Pi better than other music languages** (arXiv 2508.05473), but a small code change moves the
  sound unpredictably, and a model judges its candidates by how the code reads: measure the render, always.
- **Sam Aaron's warning:** Sonic Pi runs Ruby, so code it evaluates can do anything on the machine. The studio runs only
  its own files.
- **Claude's own taste is slow and ambient** (a study of models evolving a piece): name a piece's energy in numbers before
  writing it (the `new-track` skill).

