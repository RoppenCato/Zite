---
name: new-area
description: Make the art kit for a new area of the board world (a mood, a region): its palette, a ground tile kit, three to five background planes with scroll factors, ten to twenty props, previewed panning at phone size and delivered with data for the generator. Use when Robin or Miles, GD says "we need a desert area", "make the forest region's kit", "a background for the swamp", or names a region that has no art.
---

# A new area

The manner is `docs/direction.md` sections 1, 2 and 4 to 7; the library's `Instructions.md` ("Places and their art", "How
tiles work", "How backgrounds work", "Parallax", "How objects work") is the source. Never work in the game's folder; never
copy a piece of the library.

## 1. The mood before any piece

- Find the region in the brief and the game's docs: what it is for, its level band, what the player does there, which
  monsters live there, what the regions next to it look like (so this one differs).
- Pick the closest mood in the library's table and open its pictures: `Maps/Places/` for the whole, then the
  `_Overview` sheets of its background, tile and object sets. Write in `work/<area>/NOTES.md`: the one idea of the area in a
  sentence, its palette (five or six colours: the sky, the far, the mid, the ground's top edge and body, the accent), what
  the near and the far planes hold, the kind of ground, the props that make it this place and no other.
- Decide the planes: three to five, each with a scroll factor with clear gaps (0; 0.1; 0.3 to 0.5; 0.7; 1), what each holds,
  whether it repeats or is placed once, whether anything drifts or animates.

## 2. Make the kit

- **The ground**: the named pieces of the grid (`bsc`, `enH0`, `enH1`, `enV0`, `enV1`, `edU`, `edD`, the four slopes), with
  variants (6, 3, 3, 2, 1), seamless at matched edges, a bright top edge above a darker body, light from above. Painted in
  Node canvas, or a Blender render finished in Node where a form helps (rock). Tile each piece 3 by 3 and look.
- **The planes**: far ones paler, hazier, less saturated, lower in contrast and detail, shifted toward the sky, smaller;
  near ones saturated and sharp; an irregular upper edge with transparency; a seamless sideways repeat where it repeats;
  the width from the formula where it does not. Clouds or mist as a drifting layer; one animated layer at most to start.
- **The props**: ten to twenty, more small than large, in groups (nature, props, a house kit with basic and deco parts,
  signs); origin at the centre; a few animated at 150 ms. Blender renders finished in Node, or painted in Node.
- **The monsters' band** is drawn on the ground in the picture that judges it: the fighters must separate from the planes
  at a glance, so the strong detail stays out of that band.

## 3. Judge

- Lay the kit as a place: ground laid with variants, the planes stacked, props placed, our player and one monster standing
  in it, at phone size. Preview it panning with `Preview-Parallax.py` (from `C:\dev\MapleStoryPlus`, reading our files where
  they are) at `--width 412 --height 915`; look at the left, middle and right, and the gif.
- Check for gaps at the ends, hard bottom edges below the ground, planes that move at the same speed, a flat stack, a busy
  band behind the fighters, seams in the ground.
- The check in `docs/direction.md`, point by point, in the notes.

## 4. Deliver

- `out/<area>/`: `tiles/` (the pieces by name and variant), `background/` (the planes), `objects/` (the props), and
  `kit.json` with every piece's data (size, origin, repeat type, scroll factor, drift, opacity, front, animation frames and
  delays), in the shape the game's `docs/state/art.md` names; the laid-out picture and the panning gif; `NOTES.md` with the
  idea, the palette and the drop-in steps.
- Send the picture and the gif into the chat; add a line to `docs/log.md`; the area's rows in `docs/inventory.md`.
- Tell Robin what is his to decide (the palette, the idea, which props) and tell Miles, GD what the generator gets.
