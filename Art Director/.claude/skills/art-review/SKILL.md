---
name: art-review
description: Review the game's art and say what needs improvement, with reasons and pictures, ranked. Use when Robin asks "what needs improvement?", "review the art", "what looks wrong", or wants an opinion on the art direction itself.
---

# What needs improvement

An honest ranked list with pictures, not a wish list. Rank by how much of the screen a thing is on (the world map first, then
the fight screen, then the boards) and how far it sits from the direction (`docs/direction.md`), in that order.

## 1. Look, at phone size

- Open the game in the browser pane at a phone's size (`resize_window` preset mobile, or the width and height
  `docs/direction.md` names) and take screenshots of: the world map in two or three regions, a fight in each kind of
  background, a town, a shop, the title. Crop and look; never judge from a small sheet.
- The characters and monsters: one picture per family at game scale with the hero for size (the studio's compare tool from
  `docs/pipeline.md`). Read each picture.
- The references beside them: the library's `Maps/Places/` for the same mood and `Monsters/Sheets/` for the level band (`C:\dev\MapleStoryPlus\Settings\Inspiration`), and the sentence.

## 2. Judge

For every asset and every screen, the points of the check in `docs/direction.md`. Write only what fails, and why, against
which point. Note what is right too, in one line, so Robin knows what not to touch.

Look especially for: a silhouette that does not read at a quarter size; a windup that only changes colour; a background in
the fighters' values that swallows them; a map where the player cannot tell where he is, where he can go and what each space
is; a piece outside its area's palette; an outline missing or heavier than its neighbours'; shading flat or dithered where it should be painted; a far plane as sharp or as saturated as the near one; a thing that floats (no
shadow, no contact); a thing drawn in another hand than what stands beside it; interface pieces that do not belong to the
world; anything that costs frames (a huge sheet, a full-screen effect redrawn every frame: ask Miles, GD for the frame log).
Then the tests of `docs/techniques.md` section 1: grayscale, quarter size, the three reads.

## 3. Report

- `docs/inventory.md`: update every row's state and "what needs work"; renew "The first three jobs, by value".
- The reply to Robin: the ranked list, each item one or two sentences with the point it fails and the picture that shows it
  (sent into the chat); then, separately and clearly marked as suggestions, anything about the direction itself, with a
  reason. Robin decides.
- Add a line to `docs/log.md`.
