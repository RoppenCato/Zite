---
name: improve-track
description: Improve or lengthen one of the game's tracks (one already in this studio) by rewriting it in Sonic Pi. Use when Robin says "improve the forest theme", "make it longer", "it gets too happy at 44 seconds", "redo X". Keeps the hook recognisable, pins the version he liked, compares at matched loudness, says what changed.
---

# Improve a track

Never touch `C:\dev\Zite\Game Developer`. Read `docs/sound-direction.md`, `docs/maple-guide.md` section 7 and
`docs/feedback.md` (the piece's row: Robin's words so far) first.

## 1. Know what is there

- **Pin the original:** the version Robin liked is the fixed reference for every round; name each change against it, never
  against the last draft (research, 2026-10-22: revising from the latest draft drifts away from what was liked).
- Transcribe the hook and the form into the new file's header comment. The hook stays recognisable unless he says otherwise.
- Write down what is weak, each point against his words or a rule of `docs/sound-direction.md`. A time he names ("from
  1:14", "around 44 seconds") is found in the per-bar table and the source before anything is changed.

## 2. Rewrite

- Follow `new-track` steps 2 and 3, keeping key, tempo and bar count unless there is a reason to change them (say it).
- A long version: the theme returns in new colours with new sections between; never emptied (`docs/maple-guide.md` §7).

## 3. Compare and deliver

- **Compare at matched loudness:** when Robin hears the old and the new, both play at the same loudness, or the louder one
  wins whatever it is.
- As in `new-track` step 4, with a **Before and after** section in `NOTES.md`: what was weak, what was done about each
  point, what was kept on purpose.
