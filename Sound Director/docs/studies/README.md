> Carried over from the Survival game's sound studio (C:\dev\SG\Sound Director) on 2026-10-31. The places and sounds named in it are that game's; the rules, the tools and what Robin's ear taught stand for the board world game too. Nigel, SD.

# Studies: the inspiration tracks taken apart

Robin's inspiration folder (`Inspiration/`, fourteen MapleStory tracks as MP3, 2026-10-14) is for learning how the
pieces are built: their tempo, key, chords, bass, lead and form. Nothing from them goes into the game; they are someone
else's music. Each study is a folder here with `STUDY.md` (the report and what it teaches), `<name>.rb` (a Sonic Pi
file: a faithful playback of every note the model heard, then the lead and bass lines in the studio's notation, eight
bars to a string) and `<name>.mid` (the same notes as a MIDI file for a DAW or the game's Song Editor).

## How a study is made

1. `node tools\transcribe.js "Inspiration\06 Ellinia.mp3"`: Spotify's Basic Pitch model (open source, run here in
   TensorFlow.js on the CPU, about two minutes a song) hears the pitches and writes `work/study/<slug>/notes.json` and
   the MIDI. It hears pitches, not instruments: every voice lands in one list, doublings and reverb tails can become
   extra notes. Options `--onset 0.5 --frame 0.3 --minlen 11` are the model's thresholds (lower onset for a quieter mix).
2. `node tools\study.js work\study\<slug> [--bpm N] [--beats 4]`: the tempo from an autocorrelation of the onsets (check
   it against the ear; `--bpm` overrides), the beat phase, everything quantised to sixteenths, the bass (below E3) and
   the lead (E4 and up, the highest voice) pulled out, a chord named for every bar from the notes sounding in it, the
   key from a Krumhansl profile, phrases of four bars named by their lead notes (the same letter when more than half the
   notes match, a prime for a varied repeat). Writes `<slug>.rb` and `STUDY.md`.
3. Read the report and write **What it teaches** under it: what the piece does that our themes could do. Copy the
   folder into `docs/studies/<slug>/`.
4. To hear what the model heard, `tools\sonicpi-play.cmd docs\studies\<slug>\<slug>.rb 60` (the playback thread: low
   notes on a bass synth, the rest on the piano), or render it to MP3 for the phone with `tools\record.rb` and `tools\mp3.js`.

## The studies

| Track | Key, tempo, bars | What it teaches, in one line |
| --- | --- | --- |
| [Ellinia](ellinia/STUDY.md) | Bb major, 120 bpm, 93 bars | a bass that arrives at bar 17, vi-IV-ii-I that never rests on I, one dotted rhythm doubled up an octave for lift, a seventy-bar density arc, the hook back after forty bars |
| [Login Screen](login-screen/STUDY.md) | Ab major, 125 bpm, 196 bars (6 min 17) | the longest piece: a hundred bars before the opening phrases come back, varied; a breakdown at bars 169 to 176 where the lead all but stops and the middle carries on |
| [Ellinia Forest](ellinia-forest/STUDY.md) | D major, 133 bpm, 87 bars | almost no bass at all (8 bass notes in the whole piece): a high piece of lead and middle voices, the fastest of the set |
| [Lith Harbor](lith-harbor/STUDY.md) | D major, 130 bpm, 147 bars (4 min 31) | sixteen bars on one chord with its sus before anything moves; the busiest middle voice of the set; the bass taking over the last forty bars |
| [Sleepywood](sleepywood/STUDY.md) | B major, about 90 bpm (the detector doubled it to 179), 124 bars | two chords for sixty bars, Bmaj7 to Ab7 (I to VI7), a dark lilt; a middle section on Emaj7 and Gb7; the lead sparse |
| [Ant Tunnel](ant-tunnel/STUDY.md) | D minor, 95 bpm, 102 bars | the only minor key in the set and the sparsest (5 notes a second): bass-led, long gaps, a few bright phrases, a dark place |
| [Nautilus Harbor](nautilus-harbor/STUDY.md) | G major, 81 bpm, 41 bars | the shortest loop: two chords, Csus and G7, a plagal swing; a bass-heavy slow rock, two minutes |
| [Florina Beach](florina-beach/STUDY.md) | C major, 103 bpm, 84 bars | the sparsest bright piece (4.8 notes a second): maj7 and m7 on everything, phrases that return, a breakdown of 33 notes at bars 73 to 80 |
| [Orbis](orbis/STUDY.md) | Db major, 135 bpm, 64 bars | I and ii (Dbmaj7, Ebm7) for most of the piece, the bass arriving slowly, the opening phrase repeated at once |
| [El Nath](el-nath/STUDY.md) | Bb major, 90 bpm, 57 bars | a slow bright piece in Ellinia's key: Bbmaj7, Ebmaj7, Dm7, Gm7, F7; density that only grows to the end |
| [Ludibrium](ludibrium/STUDY.md) | D major, 105 bpm, 65 bars | a bouncy piece on I and V sus (D, Asus) with the middle voice carrying it, a breakdown at bars 33 to 48 on Asus alone |
| [Path Of Time](path-of-time/STUDY.md) | C major with minor colour (Cm7, Eb, Bb borrowed), 125 bpm, 98 bars | a near-silent bridge (five bars of nothing at 60 to 64), the opening said twice, a modal piece |
| [Aquarium](aquarium/STUDY.md) | C major, 120 bpm, 72 bars | I, VI7, vi and V to IV in sevenths (Cmaj7, A7, Am7, G7, Fmaj7); every voice busy; the peak at bars 57 to 64 then a plain end on C |
| [Aqua Road](aqua-road/STUDY.md) | E major, 80 bpm, 45 bars | the slowest and the most chromatic: maj7 chords a tone apart (Dmaj7, Emaj7, Amaj7), the lead the busiest voice, density rising to the end |
