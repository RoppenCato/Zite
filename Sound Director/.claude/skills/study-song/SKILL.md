---
name: study-song
description: Take an inspiration track (an MP3 in C:\dev\Zite\Sound Director\Inspiration, or in the Survival game's C:\dev\SG\Sound Director\Inspiration) apart to learn how it is built: transcribe it with Basic Pitch, analyse tempo, key, chords, bass, lead and phrases into Sonic Pi code and a report, and write what it teaches. Use when Robin says "study X", "convert X to Sonic Pi", "how is Lith Harbor built", or names a track in the Inspiration folder.
---

# Study a song

Never put any of it in the game: these are other people's pieces, taken apart to learn from. Read `docs/studies/README.md`.

1. `node tools\transcribe.js "Inspiration\<file>.mp3"` (about two minutes; no Sonic Pi engine needed), then
   `node tools\study.js work\study\<slug>`. Read the printed tempo and key; if the tempo is a half or double of what the
   track plainly is, rerun with `--bpm`.
2. Read `STUDY.md` and the lines in `<slug>.rb`: where the bass enters, the chord loop and what degree bar one sits on,
   the lead's rhythm and range, the density arc, which phrases return and when, what the cadences do.
3. Write **What it teaches** under the report: five or six numbered points, each a thing the piece does and what it
   means for our themes. Say what is a guess (instruments always are).
4. Copy the folder to `docs/studies/<slug>/`, add the row to the table in `docs/studies/README.md`, a line to `docs/log.md`.
5. If Robin wants to hear the transcription: `tools\sonicpi-play.cmd` the `.rb` (audible), or record it with
   `tools\record.rb --silent` and `tools\mp3.js` and send the MP3 into the chat.
