# Art: how the art is built, and the data the client must carry

Written by Perry, AD on 2026-10-31 for Miles, GD, from Robin's decision of the same day: the art follows the MapleStory
reference library (`C:\dev\MapleStoryPlus\Settings\Inspiration\Instructions.md`; the studio's `Art Director/docs/direction.md`
is the direction drawn from it). Nothing of the library is in the game; this is the data model the deliveries use. Miles, GD
owns how the client reads it; keep this file true as the loader is built.

## The scale

Assets are drawn at 2x CSS pixels. The player is 100 CSS pixels tall on the 412 by 915 phone (200 in the file); monsters,
bosses, ground and props follow the reference's ratios (`direction.md` section 2). One row of ground is 138 by 92 CSS (276 by
184 in the file).

## A monster or a character: actions with frame data

A sprite is a set of named actions (`stand`, `move`, `fly`, `jump`, `hit1`, `die1`, `attack1`, `attack2`, `skill1`), each a
list of frames. Each frame has: `origin` (the point placed at the sprite's position: at the feet, horizontally centred),
`delay` (ms on screen), `lt` and `rb` (the hit box, relative to the origin), `head` (the top of the head, for things placed
above it), optional `a0` and `a1` (opacity at the frame's start and end, 0 to 255, for fades). Frames may differ in size.
**Drawn facing left; the game flips to face right.** In Phaser: a texture atlas per sprite, an Animation per action with
per-frame `duration` from `delay`, `setOrigin` per frame from `origin` (or a custom origin per frame in the atlas JSON),
`flipX` for right, the hit box kept in data for the rules, not read from the texture.

## Ground: tile kits on a grid

A set is named pieces on a grid of 138 by 92 CSS: `bsc` (the body, seamless both ways, origin top left), `enH0` (the top
surface above the grid line, origin bottom left), `enH1` (the underside below the line, origin top left), `enV0` and `enV1`
(the sides; origin top right and top left), `edU` and `edD` (end caps), `slLU`, `slRU`, `slLD`, `slRD` (slopes rising one
grid step over one width; origin at the corner). Each main piece has variants (6, 3, 3, 2, 1) chosen by the generator so
ground is not stamped. Draw order: caps, then edges and slopes, then sides, then the body on top. The walking line is data,
not art: feet stand a few pixels into the top edge.

## Backgrounds: layers with a scroll factor

A background is a stack of layers, back to front. Each layer: `file`, `type` (0 placed once; 1 repeats sideways; 2 up and
down; 3 both; 4 repeats sideways and drifts sideways; 5 repeats up and down and drifts; 6 and 7 both and drift), `x`, `y`,
`factor` (the scroll factor, 0 far to 1 locked to the ground; on drifting types the drift speed instead), `cx`, `cy`
(spacing when repeating; 0 is the image's size), `a` (opacity), `front` (1 draws over the characters), `ani` (frames and
delays). In Phaser: `setScrollFactor(factor)`, `TileSprite` for repeating layers, `tilePositionX` for drift, depth above
the characters for `front`. The screen size decides what shows: far layers repeat; a placed picture must leave no gap.

## Objects: props placed freely

Each prop: `file`, `origin` (the centre, so the base is computed), `layer` (0 to 7; objects then tiles per layer), `z`
(order within the layer), optional animation (frames, delays). Kits per area; many small props per large one.

## The delivery shape

`Art Director/out/<area>/kit.json` holds every piece of an area with the data above; `out/<monster>/<monster>.json` holds
a sprite's actions and frame data beside its atlas. The game copies a drop as the whole folder into `assets/` and commits it.

## Not decided (2026-10-31)

Whether the world itself is a side-view place built from these kits with the board's spaces along its ground, or a top-down
world map with side-view fight scenes: `Art Director/docs/direction.md`, "Open, for Robin". The data above serves both.
