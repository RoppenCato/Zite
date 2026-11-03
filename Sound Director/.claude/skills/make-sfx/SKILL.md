---
name: make-sfx
description: Make a sound effect for the board world game (the die rolled and landing, a step on the board, an attack, a spell, a hit, a monster's cry, a pickup, a UI tap, a town freed, a boss), from recordings where possible, layered and rendered in Sonic Pi. Use when Robin or Miles, GD says "make a sound for X", "the hit needs more weight", "we need a dragon roar". Writes the source under sfx/<category>/, renders variations to out/sfx/<category>/ with gains, notes and a preview.
---

# A sound effect

Never touch `C:\dev\Zite\Game Developer`. Read section 5 of `docs/sound-direction.md`, `docs/sfx-notes.md` (sections 6 to 12
are what Robin's verdicts taught) and `docs/pipeline.md` first.

## 0. The Survival game's library first (Robin, 2026-11-01)

Before anything is made, look for the sound in `C:\dev\SG\Sound Director\out\sfx\` and the Survival game's
`C:\dev\SG\Game Developer\assets\sfx\` (`keep.txt` there is what Robin picked by ear; `docs/survival-library.md` lists
the sets). A sound that fits is **copied**, not remade: into `out/sfx/<category>/` under this game's name, re-levelled to this
game's set, with its origin, Robin's verdict on it and its licence in `NOTES.md`. Say in the notes which sounds came from the
library and which were made new. Only what the library lacks goes on to step 1.

## 1. What the sound must do, and its reference

- Find the game's own version, if it has one (ask Miles, GD where the sounds live), and
  **say why it misses** from its code (a low-passed thud, a filter sweep, a sine slide). Write it in the source's header:
  what happens on screen, when the game plays it (at the blow, at a landing: a tree's crash lands 0.95 s after the felling
  blow), how long it may be, what must be heard first.
- **From a reference, always** (since 2026-10-15): a recording Robin likes, or candidates for him to pick from. Synthesis
  from Sonic Pi's built-ins alone missed every time it had no reference.
- If nothing on disk fits, look online for free recordings (CC0 first: Kenney, OpenGameArt, BigSoundBank; the itch.io pack
  that allows use in games). **List each download for Robin (name, source, licence, size) and wait for his yes.** Each pack
  goes into its own new folder under `sfx/<category>/ref/`, unchanged, with a credits README.

## 2. Get the recordings ready

- **Sonic Pi plays WAV, FLAC and OGG** as samples; **not MP3** on this machine. Windows' own `tar` opens `.7z`.
- **Decode to measure:** play the files one by one on a slot grid in a small file under `work/decode/` (`load_sample` them
  first, `sleep 1`, then `at [k * slot]`), render it with `render-sfx.js`, label the pieces with `work/decode/label.js`.
- **Cut the hits you will layer** from that decode into `ref/cut/` (each piece starts at its own sound and is
  peak-normalised). **Do not use Sonic Pi's `onset:`** to pick a hit (it can choose a near-silent sliver), and do not trust
  a file's head: some start with 20 to 70 ms of silence.
- Know the material: Kenney's "heavy" impacts are low thumps (98 to 133 Hz, a 15 ms swell); an axe into a standing trunk is
  60 to 80 % under 250 Hz; recorded levels differ by 30 dB between packs.

## 3. Build it in layers

- One `define :one do |v|` per sound, variations by seed (`use_random_seed`, a small `rate:` nudge). Three or four
  variations, as the game's brief says.
- Layers each with one job, attacks in the same millisecond: the **front** (the crack, the slap, the knock: under 10 ms,
  above 1 kHz) is the loudest moment; the **body** under it; **weight** only on heavy ones and never leading; a tiny
  **tail**. High-pass the low layers (150 to 200 Hz) on light sounds; a plain low-pass at 6.6 to 9 kHz keeps it from hiss.
- Short and dry; reverb only where the place has it. No limiter.

## 4. Render, measure, fix

- `node tools\render-sfx.js sfx\<category>\<name>.rb` (silent), then `node tools\sfx-measure.js work\sfx\<category>\<name>_*.wav`:
  length, attack, -30 dB time, centre, the four bands, weighted loudness. Read them against the brief (a slap: attack under
  5 ms, centre 1 to 2.5 kHz, under a fifth below 250 Hz, under 300 ms).
- A slow attack with a fast front means a low layer's peak is louder than the knock: turn it down, do not shift starts.
  A second peak 10 ms later is a flam: one layer starts late (its file's head, or a late-peaking splat).
- Times that matter to the game (a crash at 0.95 s) are checked on the delivered file by its loudest 10 ms, not its peak sample.

## 5. Deliver

- **Sizes are Miles, GD's to confirm** (Robin, 2026-11-01): the format, a sprite's size and the first load's weight
  come from the game's `docs/sound-demands.md`, confirmed 2026-11-01 and written in `docs/game-notes.md`; ask before any
  delivery that would not fit. Short sounds go to the game as an audio sprite (one OGG and a `spritemap` JSON) per wave; the
  WAV masters stay in `work/`.
- Copy to `out/sfx/<category>/`, write the level spec (`sfx/<category>/_levels.json`: targets in dB against the hit) and
  run `node tools\sfx-level.js out\sfx\<category> sfx\<category>\_levels.json --weighted` (the first set delivered becomes the anchor later sets are levelled against with `--anchor`; write which in `docs/pipeline.md`).
- A preview on a timeline (`sfx/<category>/_tour.json`, `tools\sfx-preview.js`, `tools\mp3.js`) in the order the game would
  play them; `NOTES.md` with why, the layers, the measurements, the gains, the game's use, what is for Robin's ear.
- Send the preview and notes into the chat; add the sounds to Robin's phone page (`viewer/listen.html`, published to his
  saved address by its URL); tell Miles, GD the paths and gains; log, catalog, feedback.
- **Tell Robin how to test it** (his rule, 2026-10-23): the phone page's tab and row; then, once Miles, GD has the row up,
  the game's sound panel (Miles, GD says where), the
  "Choose ..." row by its name, the letters to try, and **Copy** beside "Your picks, as text".
- **Clear what he turns down:** the unpicked candidates move to `out/_archive/` and off the phone page once his picks are in.
- **The game bundles only what plays** (its `assets/sfx/keep.txt`): never move or rename a file in `out/sfx/` that the
  keep-list names without telling Miles, GD first.
