---
name: new-area
description: Make the art kit for a new area of the board world (a mood, a region): its idea and palette, the board kit (ground tiles and edges, cliff faces, roads, spot markers, props seen a touch from above) and the fight kit (a side-view ground band, backdrop strips with scroll factors, props side on), previewed at phone size and delivered with data for the generator. Use when Robin or Miles, GD says "we need a desert area", "make the forest region's kit", "a background for the swamp", or names a region that has no art.
---

# A new area

The look is `docs/direction.md`; the pieces, counts and sizes the game needs are in its `docs/art-demands.md` (waves 1a and
1b for the first area). Never work in the game's folder.

## 1. The idea before any piece

- Find the region in the brief and the game's docs: what it is for, its level band, what the player does there, which
  monsters live there, what the regions next to it look like (so this one differs).
- Write in `work/<area>/NOTES.md`: the one idea of the area in a
  sentence, its palette (five or six colours: the sky, the far, the mid, the ground's top edge and body, the accent), what
  the near and the far planes hold, the kind of ground, the props that make it this place and no other.
- Decide the planes: two or three strips over a code-drawn sky, each with a scroll factor with clear gaps, what each holds,
  whether it repeats or is placed once, whether anything drifts.
- **One still first**: the fight screen of the area with our player and one monster standing in it, at phone size, before
  any kit piece is made. Robin agrees the look on that picture.

## 2. Make the kit

- **Two kits, one palette**: the board kit first, because the player sees it most.
- **The board kit**: ground tiles and edge pieces (the cliff faces where land steps, the shore of nothing at the map's
  edge), road pieces, spot markers for each kind, the closed-area cover, badges, the name plate and banner, horizon strips.
  Seen at 0.3 in the overview: broad shapes, little fine detail. Props seen a touch from above.
- **The fight kit**: the ground band with a bright top edge over a darker body, seamless sideways; the backdrop strips, far
  ones paler, hazier, less saturated, with an irregular upper edge; props side on, ten to twenty, more small than large, in
  groups; a few animated.
- **The fighters' band** is kept quiet: the fighters must separate from the planes at a glance.
- Tile every repeating piece 3 by 3 and look.

## 3. Judge

- Lay the kit as a place at phone size: the board with roads and spots, the fight with the planes stacked, props placed,
  our player and one monster in it. Pan the planes on a moving page and look at the left, middle and right.
- Check for gaps at the ends, hard bottom edges below the ground, planes that move at the same speed, a flat stack, a busy
  band behind the fighters, seams in the ground, pieces that look pasted on (no foot, no shadow).
- The check in `docs/direction.md`, point by point, in the notes.

## 4. Deliver

- `out/<area>/`: the board kit's atlas and the fight kit's atlas with their strips, and `kit.json` with every piece's data
  (size, origin, repeat type, scroll factor, drift, opacity, front, animation frames and delays), in the shape the game's
  `docs/state/art.md` names; the laid-out pictures; `NOTES.md` with the idea, the palette and the drop-in steps.
- Send the pictures and the moving page into the chat; add a line to `docs/log.md`; the area's rows in `docs/inventory.md`.
- Tell Robin what is his to decide (the palette, the idea, which props) and tell Miles, GD what the generator gets.
