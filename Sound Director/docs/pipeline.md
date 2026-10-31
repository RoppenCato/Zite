> Carried over from the Survival game's sound studio (C:\dev\SG\Sound Director) on 2026-10-31. The places and sounds named in it are that game's; the rules, the tools and what Robin's ear taught stand for the board world game too. Nigel, SD.

# Pipeline: how a piece is made, rendered, checked and delivered

Set up 2026-10-14. Sonic Pi 5.0.0 at `C:\Program Files\Sonic Pi`, its own Ruby at `app\server\native\ruby\bin\ruby.exe`,
the engine at 48 kHz. Node 24 for the tools. Nothing here touches `C:\dev\Zite\Game Developer`.

## The tools

| Command | What it does |
| --- | --- |
| `tools\sonicpi-play.cmd FILE.rb [SECONDS]` | boots a headless engine, plays the file **audibly** for N seconds (default 20), prints every log and error line, shuts down; exit 1 on any error. `-e "play 60"` for inline code, `-` for stdin. |
| `tools\sonicpi-gui.cmd FILE.rb` / `-e CODE` / `--stop` | sends code into Robin's **open Sonic Pi app** (ports and token read from `~\.sonic-pi\log\gui.log`); the output shows in the app's log pane. Use this instead of the player while the app is open: two engines fight over the sound device. |
| `tools\sonicpi-record.cmd OUT.wav SECONDS FILE.rb [SEED]` | records a file to 48 kHz 24-bit WAV in real time through `tools\record.rb`. |
| `node tools\render-track.js FILE.rb [--stems a,b] [--quick] [--deliver] [--out DIR]` | the track renderer: records each stem, cuts the seamless loop, measures, writes `manifest.json`; `--quick` is one pass and no seam (for levels and listening); `--deliver` copies into `out/music/<name>/`. |
| `node tools\render-sfx.js FILE.rb [--deliver]` | records a sound file, splits it at the silences into its variations, trims and normalises each, writes `<name>_N.wav` and a manifest. |
| `node tools\wavtool.js info\|onset\|loopcut\|cut\|seam\|bars\|trim\|split\|diff\|sum ...` | the measurements (run it without arguments for the list). |

`tools\record.rb` exists because Sonic Pi's own `headless-record.rb` writes nothing on this machine: it sends the record
command to the engine over UDP, which SuperSonic ignores (the spider talks to it over TCP). Ours asks the spider to record
the way the GUI's Rec button does (`/start-recording`, `/stop-recording`, `/save-recording PATH`). The sound starts about
0.9 s into the file (1.4 s with `set_sched_ahead_time! 1`, which the tracks set so a heavy first bar is not late). After
the stop the engine takes a few seconds to close a big take (a 200 s loop is 58 MB); the recorder waits three seconds and
then asks for the save again every few seconds until the file is there (a save asked too early found nothing and the
ambient track's first render was lost that way).

**Silence (Robin, 2026-10-14: no sound while the studio works).** `--silent` on `record.rb` and `sonicpi-play.rb` (the
renderers pass it by default; `--audible` to hear a render) mutes the engine's own Windows audio session, the per-app
volume of the Volume Mixer, right after boot (`tools\appmute.ps1 mute "Sonic Pi - SuperSonic"`) and unmutes it when the run
ends. Nothing else on the PC is touched. The record tap sits before that mute, so the file is unaffected. Windows remembers
an app's mute, so a run that died before unmuting leaves Sonic Pi's engine silent until `tools\unmute.cmd` is run with an
engine running. Tried and rejected first: `enable_outputs = false` in a studio-owned audio settings file (recorded fine,
still audible) and `num_outputs = 0` (a capture-only device: nothing to record). The studio's own Sonic Pi home
(`work/sp-home`, via `SONIC_PI_HOME`) is still used for silent runs so their logs stay apart from Robin's.

## A track

The source is `music/<place>/<name>.rb`, started from `music/_template.rb`. Its shape:

1. **A header** in comments: the place and what the piece is for, then the metadata lines the renderer reads
   (`# name:`, `# bpm:`, `# bars:`, `# beats:`, `# stems:`), then the form as a table of bars, the hook as note names,
   and what changed from any earlier version.
2. `eval File.read("C:/dev/Zite/Sound Director/music/_lib.rb")` loads the shared library: the instruments (`FLUTE`, `CLARINET`,
   `PIANO`, `BELL`, `HARP`, `STRINGS`, `BASS` as lambdas `|note, beats, amp|`; `shaker`, `rim`, `kick`), the notation
   (`parse_notes` for the game's `F5:q. E5:e r:e Bb4+D5:h@70` strings, `sym_chord` for `Dm7`, `F/A`, `C7`), `hum` (seeded
   jitter), `shape` (phrase loudness), `play_line`, `stem_on?` and `marker`. `run_file` cannot be used for this: it starts the
   library as a separate run and the definitions are not there in time.
3. `STEM = :full` and `PASSES = 1`, exactly so: the renderer rewrites them. `SEED`, `MASTER` (the whole mix's level),
   `use_bpm`, `BARS`, `TOTAL`, the chord list, `section(b)`.
4. **The written lines** as strings in the game's notation, eight bars to a string, and `written STR, BARS, INST, AMP`
   which checks the length (a wrong bar count prints `LINE LENGTH` in the log and would drift every part after it).
5. **The parts**: `part_flute`, `part_bass` ... Each runs all the bars of one pass, computes everything and calls `hum`
   for every event it could play, and sounds only when `stem_on?(:tag)` (its amp is 0 otherwise). That keeps the random
   stream identical in every stem, so the stems sum to the mix. The bass part prints `bar N` to the log.
6. **The piece**: `marker` (a 6 ms click at beat one of pass one, outside every FX, the renderer's anchor), then three
   threads that each open an FX room and start their parts inside it and sleep until the end (an FX block that returns
   tears its reverb down under the parts). Parts loop `PASSES.times`.

Conventions learnt the hard way: envelope times are in **beats** (`attack: 0.12` at 118 bpm is 60 ms); sharps are `Fs6`
(the parser turns `F#6` into it); `line`, `spread`, `on?` and every other Sonic Pi function name may not be a variable or a
define (the preparser refuses the whole run); `:piano`, `:pluck` and `:kalimba` envelopes only shorten; the first use of a
sample loads it (a hitch unless `load_samples` runs first); `play 60` at amp 1 records at about -13 dBFS peak, so levels
are set by measurement, not by the numbers.

## Rendering a loop

`node tools\render-track.js music\day\meadow-day.rb` for each stem in the header: rewrites `STEM` and `PASSES = 2`,
records `2L + 5` seconds to `work/<name>/<stem>_raw.wav`, finds the marker (first sample above -40 dBFS) and cuts the
second pass `[t0 + L, t0 + 2L)` to `work/<name>/<stem>.wav` as 16-bit, so the tails of the last bar lie under the first
bar and the seam is clean. It prints peak, RMS, the seam step, the loudness of every bar of `full`, and the difference
between the summed stems and the mix. Two passes of an 81-second loop take about three minutes a stem; four stems about
twelve minutes, in real time, audibly. Run it in the background and read `work/<name>/render.log`.

The numbers to pass (docs/sound-direction.md section 4): peak under -1 dBFS (the first Meadow render hit -0.1 and was
pulled down 5 dB with `MASTER`), full RMS -22 to -16 dBFS, seam step under 0.5 %FS, stems quieter than the mix, the
summed stems within a few dB of the mix (a large difference means a part draws random numbers it should not), the bar
table showing the form (intro quiet, A, A' louder, B loudest, the bridge quiet, A again).

**The seam.** Two renders never match sample for sample, so a bass release or a pad tail sounding across the bar line
stepped by up to 5.6 %FS at the join (the ambient track's first render). Since 2026-10-14 `loopcut` blends the loop's
last 40 ms toward the end of pass one, which runs straight into the loop's first sample, and the step is under 0.1 %FS
whatever is sounding. Still, write the last bar so nothing with a strong fundamental crosses the loop point: the last
note of a line as `h. r:q` rather than `w`, the pad's last chord two beats, no bass approach note in the last bar.
Renders are muted since 2026-10-14 (`--silent`), audible only with `--audible`.

`--quick` renders one pass and cuts from the onset: for a first listen and the levels, in half the time. Not seamless.

### Many renders in a row: the queue (2026-10-15)

Only one engine can run at a time. `work/queue.sh` runs the lines of `work/queue.txt` one after another and stops at a
line `END`; lines can be added while it runs (insert before `END`). Start it in the background with its log:

```
printf '%s
' "node tools/render-track.js music/sea/sea-voyage.rb --deliver" END > work/queue.txt
bash work/queue.sh > work/queue.log 2>&1
```

Read each finished job's bar table before writing its notes: a new section that measures quieter than the one before
it is a hole, and goes back into the queue with its levels changed (the fiddle needed this three times; see
`docs/sonic-pi-notes.md`).

### Fight pieces: the kit and a ramp-plus-loop delivery (2026-10-15)

`music/_fight.rb` holds the shared fight voices (the war horn, smooth strings, the lyre, the bowed chord) and drums
(`fk_big`, `fk_lo`, `fk_mid`, `fk_hi`, `fk_hand`, `fk_shield`, `fk_slam`, `fk_crash`, `fk_roll`); a piece loads it after
`_lib.rb`. A raid piece is a ramp (`<name>-intro.rb`, rendered with `--quick --out work/<name>-intro`) and a loop
(`<name>.rb`, rendered with `--deliver`); then `bash work/assemble-intro.sh <name>` copies the ramp in and makes
`intro.mp3`, `full.mp3` and `listen.mp3` (the ramp, then the loop twice).

## A sound effect

The source is `sfx/<category>/<name>.rb` from `sfx/_template.rb`: a `define` per sound taking a variation number, three
layers at most, and at the bottom the variations played in a row with a second of silence between them. The header has
`# name:`, `# seconds:` (the whole run) and `# count:`. `node tools\render-sfx.js FILE.rb` records it once, splits at
the silences (regions above -50 dBFS separated by at least 0.3 s), trims each to -60 dBFS with 2 ms before and 10 ms after,
normalises the peak to -1 dBFS and writes `work/sfx/<category>/<name>_N.wav` with a manifest; `--deliver` copies to
`out/sfx/<category>/`.

### A set of sounds levelled against itself (2026-10-15, the combat set)

`sfx/combat/_make.py` writes every source of the set from one spec (the same header, kit and variation loop); the layers
are in `sfx/combat/_kit.rb`. Render each with `node tools/render-sfx.js sfx/combat/<name>.rb --deliver` (the queue does
all of them). Then `node tools/sfx-level.js out/sfx/combat sfx/combat/_levels.json` makes the files mono, holds each sound
to its length (a fade at the cut), normalises every file to -1 dBFS and writes a **gain per sound** into
`out/sfx/combat/combat.json`: each sound's loudest 50 ms set against a ladder of targets, the top target at gain 1.0.
`node tools/sfx-preview.js DIR OUT.wav TIMELINE.json` lays the sounds on a timeline at those gains for listening
(`sfx/combat/_tour.json`, `_fight.json`).

## Delivery

```
out/music/<name>/
  full.wav  base.wav  calm.wav  danger.wav     48 kHz 16-bit stereo, each exactly loop_frames long
  manifest.json                                 bpm, bars, beats, loop_seconds, loop_frames, sample_rate, per stem: peak, rms, gains
  <name>.rb                                     the source, so the Song Editor's text view has something to show
  NOTES.md                                      what it is, what changed, how the game plays it, the drop-in steps, Robin's decisions
```

The game plays the stems as three looping buffers started together through three gains (base 1; calm 1 or 0.15; danger
0 or 1, faded over 1.2 s in, 4 s out), as `Music.setLayer` does now. The notes say so each time, with the loop length in
samples. Whether the game loads WAV or converts to OGG is Robin's session's choice; a WAV stem of 81 s is 15.6 MB.

**What the game actually loads (2026-10-15):** the MP3 from `tools/mp3.js` (lamejs, 160 kbps), not the WAV. Chrome
keeps the encoder's 1105 samples of delay at the head, so the game loops from 1105 to 1105 + `loop_frames` (see
`docs/game-notes.md`). A re-render of a piece in the game keeps its file name and its encoder, and the game's session
is told the new `loop_frames`. The WAV stays the master copy and the measuring copy.

Every delivery is **sent into the chat** (SendUserFile) so Robin hears it wherever he is. Then `docs/log.md` and
`docs/catalog.md`.

## Studies of the inspiration tracks

`node tools	ranscribe.js "Inspiration\<file>.mp3"` then `node tools\study.js work\study\<slug>`: see `docs/studies/README.md`.
Transcription runs on the CPU without the engine (about two minutes a song); do not run it beside a render, which needs
the CPU to keep time.

## The viewer (Robin's listening page)

`tools\viewer.cmd` (or `node tools\serve.js`) serves `viewer/index.html` on http://localhost:8778/ with everything under
`out/`. Every track with a `manifest.json` is listed; opening one loads its stems and plays them exactly as the game would:
the three stems looping in sync through three gains, **Peace / Danger** crossfading them with the game's timings (calm to
0.15 and danger to 1 over 1.2 s; back over 4 s), **Studio / Game** switching to the game's own render (`before.wav` and
`before_danger.wav`, if the delivery has them), the bar and loop count, the per-bar loudness from the notes, the notes and
the source. Every sound with a `<name>.json` is listed with a button per variation. The browser pane can open it too
(`.claude/launch.json`, name `viewer`). A delivery is complete when it shows there.

**The pages are grouped (2026-10-14, Robin: no scrolling through everything).** The server reads `out/music/catalog.json`,
the studio's own notes on each delivery (group, title, status: current, kept, candidate, archived, test; verdict; a
line), kept by hand with every delivery; the viewer shows the tracks by place with a status pill and the older versions
folded away. The phone page (`viewer/listen.html`, the artifact) carries the same list in its own script, as tabs by
place with one player fixed at the bottom. Update both when a delivery is added or judged.

## Known faults and open questions

- **Long tracks and the renderer's buffer.** Sonic Pi logs every synth call; a 96-bar track with many parts writes more than
  1 MB of log, which was Node's default `spawnSync` buffer, and the recorder was killed mid-take ("exit null"). Since
  2026-10-14 the renderers allow 1 GB. If a render dies with no error in the log, look here first.

- **No playback device, no engine.** The only playback device here is the monitor's audio; when the display sleeps,
  Windows has no playback device, DirectSound's "Primary Sound Driver" reports "No driver", the engine boots headless and
  the spider dies waiting for it. Renders then fail with "the engine did not come up" (the recorder gives the boot 45 s;
  the renderer pauses and tries once more). The screen must be awake for a render, until the PC has a playback device
  that never sleeps (another enabled output, or a virtual audio cable: Robin's call).

- Sonic Pi's `headless-record.rb` writes nothing (see above); `tools\record.rb` is used instead.
- A render plays through the speakers while it records; there is no silent render. Robin can turn the speakers down,
  the file is unaffected (the record tap sits before the device).
- `--quick` and the full render start from different onsets (onset against marker), so quick files are not comparable
  sample for sample with seamless ones.
- No OGG encoder here; deliveries are WAV. If Robin wants OGG from the studio, `ffmpeg` would have to be installed.

**The levelling reference after the clean-up (2026-10-20).** Every sound set since 2026-10-15 was levelled with
`tools/sfx-level.js --weighted --anchor` against the first combat hit, `hit_1.wav`, at its game gain 0.417. That hit is no
longer played (Robin picked the flesh set's `hit_w`) and now lives in `out/_archive/sfx-unpicked-2026-10-20/combat/hit_1.wav`;
keep levelling against it there (`--anchor out/_archive/sfx-unpicked-2026-10-20/combat/hit_1.wav:0.417`), so a new sound sits
where the game's mix already is. The game builds its bundle only from what plays (its `assets/sfx/keep.txt`): a sound in
`out/sfx/` that the keep-list names must stay where it is.

**Two faults met on 2026-10-23.**
- **The engine needs a playback device, even for silent renders.** With no active output (the monitor's speakers shown as
  "Unknown" in Windows, only a virtual microphone working), SuperSonic logs `Error opening Primary Sound Driver: "No driver"`
  and never answers the boot handshake; `record.rb` fails after 45 s with "the engine did not come up". Robin has to turn on
  or plug in an output (the monitor, headphones); nothing in the studio can fix it. Check with
  `Get-PnpDevice -Class AudioEndpoint` (an output must show `OK`) and `work/sp-home/.sonic-pi/log/supersonic.log`.
- **A very long take may not save.** A 555 s recording (160 MB) ran to the end and then failed to save ("no output written");
  the earlier silent one of the same length saved. Keep a take under about 200 s and decode long sources in several takes.

**Scratch (2026-10-24).** `work/` is scratch: renders, takes and logs can always be made again from the sources. When it
grows, gather what is finished into `work/_old-renders-<date>/` (with a README of what is in it) for Robin to delete; keep
`work/sp-home/` (the studio's Sonic Pi home), `work/queue.sh`, the scripts, and the decode takes of any set still being picked.

