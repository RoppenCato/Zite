# Cloverfield Meadows, the board theme (2026-11-01)

**What it is.** `music/meadows-board`: what the player hears most, on the board of the first area. G major, 122 bpm, 72 bars, a loop of 2:22. Robin gave the studios the calls for now, so the key, the voices and the tune are mine, for his ear to overrule.

**The hook, to hum from the names:** D5 E5 G5, G5 A5 B5 | A5 G5 E5 D5 | D5 E5 G5, G5 A5 B5 | D6 B5 A5. Da-da DUM, da-da DUM; DUM da-da DUM. Said twice with a changed ending. A cell of its own (eighth, eighth, quarter), so it is not the Survival meadow's dotted tune.

**Where to listen.** On the phone page, the **Meadows** tab. The times to try:

| Time | Bars | What happens |
| --- | --- | --- |
| 0:00 | 1-4 | the walk alone: piano off-beats, a walking bass, shaker and rim; the full engine from the first bar |
| 0:08 | 5-12 | **the hook on the flute** |
| 0:24 | 13-20 | the hook again, bells doubling the phrase ends, a higher ending, a soft pad enters |
| 0:39 | 21-28 | the second tune: the clarinet, low and climbing in half notes |
| 0:55 | 29-36 | the hook an octave down on the clarinet, bells answering in its gaps |
| 1:11 | 37-44 | a piano melody on its own chords, the hook's cell with new pitches; one borrowed Bb at 1:23 |
| 1:27 | 45-52 | the breakdown: Dsus held, a harp running, the lead gone four bars, then fragments of the hook and a tom's fill |
| 1:42 | 53-60 | **the return: the hook with everything**, bells doubling it all |
| 1:58 | 61-68 | the second tune on the flute, an octave up |
| 2:14 | 69-72 | the tail: the hook's first bars, the bells' turn, a harp's run |

**The rules checked.** A hook heard five times in three colours; full from bar one; nothing calm by emptying: the piano and bass never stop, and the breakdown keeps its engine. No harp under the tune and no pad up front, since those voices together read as a lullaby (Robin, 2026-10-15).

**Measured.** Peak -1.3 dBFS. **-18.9 LUFS** integrated (Miles, GD's target about -18), loudness range 4.7 LU. Seam step 0.13 %FS. By section (RMS dBFS): the verses -21 to -22, the piano -23, the breakdown -25, the return -19.5. Three renders: the first peaked at -0.1 dBFS on the piano's off-beats (its velocity follows its amp, so it jumps faster than the mix) and the breakdown was a hole at -26. **I cannot hear it. These are measurements; the tune is for Robin's ear.**

**The phone.** The tune sits at D5 to E6 and the piano's off-beats in the middle, where a phone carries them. The phone loses most of the bass's fundamental (G2 is about 98 Hz) and keeps it as a line through its octave. Not yet heard on a phone.

**Files for the game.** `meadows-board.ogg`: OGG Vorbis quality 4, stereo, 48 kHz, 2.27 MB, 128 kbps (ceiling 2.5 MB), the sample count checked on the encoded file. `full.mp3`, 160 kbps, is for listening. The WAV master is in `work/meadows-board/full.wav` (git ignores it), `meadows-board.rb` the source. **Loop: 141.639 s, 6,798,689 samples at 48 kHz, whole file.** The first and last milliseconds are near silence (head -56 dB, tail -53 dB RMS), but the audio element's `loop` may leave a small gap on some browsers. Bar 1 is the thin walk, so a gap of a few milliseconds reads as a breath.

**For Robin to decide.** Does the hook stay in his head? Is 122 a stroll or a hurry? Are the flute's sine and the clarinet too soft for a phone, as the Survival game's first flute was? This is the theme the rest of the meadows' music will quote, so it is the one to change first.
