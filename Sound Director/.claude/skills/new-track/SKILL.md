---
name: new-track
description: Compose a new music track for the board world game in Sonic Pi (a region of the world map, a town, a fight in a region, a boss, the title, the shop). Use when Robin says "make a track for X", "compose the forest theme", "we need boss music", or names a place of the game that has no music. Writes the Sonic Pi source under music/, renders one mix to out/music/<name>/ and delivers with notes, an MP3 and the phone page.
---

# A new track

Never touch `C:\dev\Zite\Game Developer`. Read `docs/sound-direction.md`, `docs/maple-guide.md` (section 7 is Robin's own
rules from his verdicts) and `docs/pipeline.md` first.

## 1. The place before the notes

- Find the place and state in `docs/game-notes.md` and the game's docs (ask Miles, GD what the place is like); note what the player is doing there
  and for how long (a fight is a minute or two; the map is looked at for long stretches). Only places the game has or builds next.
- Choose tempo and key against the tracks of the same place in `docs/catalog.md` (a shared key family; dusk slower than day).
- **Name the energy in numbers before any note** (research, 2026-10-22: Claude's own taste drifts to slow, gentle, ambient
  counterpoint; Robin heard it as "too much lullaby"): the tempo; the notes per bar in the busiest part; what moves under a
  long melody note (a figure in eighths, a bass that walks, a drum); which bars have percussion. A Maple-style day or an
  adventure moves; only night and rest may be still. If Robin names a game as the reference, the arrangement follows it.
- Write the plan into the header comment: a table of sections in bars, the instrument that leads each, what B changes,
  where the percussion drops out. Then the hook as note names, four bars at most. If it cannot be hummed from the names, it
  is not a hook yet.
- **Cap the parts:** one lead, one accompaniment figure, bass, light percussion, a pad. More layers do not make it better;
  they make parts inaudible.

## 2. Write it in the template

- Copy `music/_template.rb` to `music/<place>/<name>.rb`; load `music/_lib.rb` (and `music/_fight.rb` for a fight). Keep
  `PASSES` as it is: the renderer rewrites it. One mix, no layers (Robin, 2026-10-14).
- Instruments from `_lib.rb`; parts one `in_thread` each; every part takes `b` (the bar number); every part lasts exactly the
  piece's total beats per pass. Heavy FX (reverb) wrap a whole part, never inside a fast loop.
- Humanise from the seeded stream (`use_random_seed` once at the top); drums tight, the lead loose.

## 3. Hear and measure

- `tools\sonicpi-play.cmd music\<place>\<name>.rb 30 --silent` to check for errors (audible only when Robin wants to hear).
- `node tools\render-track.js music\<place>\<name>.rb` renders the mix and prints the per-bar loudness. A section quieter
  than its neighbours is a hole; a peak over -1 dBFS or a seam click goes back to step 2. Check the energy numbers of
  step 1 against what was written.

## 4. Deliver

- `--deliver` copies `full.wav` and `manifest.json` into `out/music/<name>/`; encode `full.mp3` (`tools\mp3.js`).
- `NOTES.md`: what it is for, the form and the hook in words, the loop length in seconds and samples, the measurements,
  what is Robin's to decide. Send the MP3 into the chat; add it to Robin's phone page (`viewer/listen.html`, published by
  its URL); log, catalog, feedback.
- **Tell Robin where to hear it** (his rule, 2026-10-23): the phone page's tab and the row's title, and what to listen for
  (a time, a section). When a version is turned down or replaced, move its folder to `out/_archive/` and take its row off the
  page and out of `out/music/catalog.json`.
