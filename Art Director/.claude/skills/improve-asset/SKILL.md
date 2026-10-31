---
name: improve-asset
description: Improve one of the game's art assets (a monster, a class character, a fight background, a map piece, a board or an icon). Use when Robin says "improve the slime", "make the forest background better", "fix the warrior", or names any asset of C:\dev\Zite\Game Developer to be improved. Copies the asset into work/, reworks it, and delivers a before/after into out/.
---

# Improve an asset

The copy-work-judge-deliver loop. Never touch `C:\dev\Zite\Game Developer`. The commands are in `docs/pipeline.md`.

## 1. Know what is wrong before touching anything

- Read the asset's row in `docs/inventory.md`.
- Look at it at phone size: copy it into `work/<name>/` with the game's version as `before/`, make `before.png` at game scale
  beside the hero, and Read the picture. Write down in `work/<name>/NOTES.md` three to five things that are wrong, each
  against a rule of the check in `docs/direction.md`. Lead with the silhouette.
- Look at the reference: a real animal's proportion for a beast, the board in `docs/reference/` for the style,
  `docs/techniques.md` section 4 for a gait. Say in the notes what the one thing is that carries its silhouette.
- Run the readability tests of `docs/techniques.md` section 1 on the before picture and write the answers down: grayscale,
  quarter size, the windup's silhouette against the idle's. The after must pass what the before failed.

## 2. Work on the copy

- Change the copy only. If the shared look (the toon file, the palette, the line) is the problem, change it and say so: it
  reaches every asset.
- If the fault is the construction (a doll of parts; a background that is one flat painting where pieces are needed), no
  finish pass will fix it: rebuild, and show concepts first.
- A quick check first (few frames, one facing), look, iterate; then the full set.

## 3. Judge

- `work/<name>/compare.png`: before and after at game scale on the real screen (the map, or the fight background it stands
  in) with the hero beside, then the clips at 2x. Read it. Then the check, each point answered in the notes, honestly.
- Shrink to a quarter (the thumbnail test) and look again.
- The weight: not heavier than before without a reason; within the budget in `docs/direction.md`.

## 4. Deliver

- `out/<name>/` with the changed sources, the sheets or pictures, `compare.png` and `NOTES.md`: what changed and why, in
  plain words with the date; the drop-in steps (which files go where in the game, what re-renders them); anything Robin must
  decide.
- Add a line to `docs/log.md` and update the asset's row in `docs/inventory.md`.
- Tell Robin: the picture (sent into the chat), what changed in three lines, the drop-in steps, and what is his to decide.
