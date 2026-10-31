# The Puffwort: a dandelion clock that hops

Perry, AD, 2026-10-31 (Robin: "create three new monsters"). Painted 2D in the Warrior's hand: flat chosen tones, one ink
line, drawn in code (`build/puffwort.js` through `build/monster_paint.js`, the studio's `tools/monster_paint.js`), each frame a
pose of a few numbers. A meadow monster of the starter band, well under the player's height.

## The look

A stout green stalk with a bulge, two serrated leaf arms, three root feet, and a big white seed-puff for a head with the face on it: two big eyes and a cheeky grin. Its one thing is the puff: it loses seeds when hit and blows apart when it dies. About 80 CSS px tall.

## The animations (the reference's counts; Miles, GD keeps the names and rates in data)

| Action | Frames | Delay per frame | Loop | What it shows |
| --- | --- | --- | --- | --- |
| `puffwort/stand/0001..0006` | 6 | 100 ms | yes | a breath; frame 5 blinks |
| `puffwort/move/0001..0006` | 6 | 100 ms | yes | a hop (crouch, launch, air, land, settle) |
| `puffwort/hit1/0001` | 1 | 600 ms | no | flattened and knocked back, the eyes popped, seeds flying |
| `puffwort/die1/0001..0008` | 8 | 83 ms | no | the stalk droops and the puff blows apart seed by seed, then fades; `a0`/`a1` fade the last three frames |
| `puffwort/attack1/0001..0012` | 12 | 67 ms (two frames held 134 ms) | no | a lean back, then a headbutt that sprays seeds forward; the butt lands on frame 7 (held) |

Each frame's `delay`, `origin` (the feet, in the frame's own pixels), `lt`/`rb` (the painted bounds, relative to the origin)
and `head` (the top) are in `actions.<name>.frames[]` of `puffwort.json`; the atlas frame carries the same point as `pivot`.

## Drawing it

- Files at 2x: draw at half size in CSS pixels. Drawn facing left (toward the player); `flipX` to face right.
- The game lays the contact shadow (a flat ellipse at the origin, about 70 by 20 CSS px at 0.22 black).
- On the board draw `stand` at 0.6.

## What is here

`puffwort.png` (a 1024-wide palette atlas) and `puffwort.json`; `frames/` loose for looking; `sheet.png`, `compare.png` (beside the
Warrior on the meadow, every action's key pose), `screen.png` (the full phone screen), `puffwort.gif` (moving; a phone shows it as
a still: the moving page is https://claude.ai/artifact/5jqqUC9CzAgF8dzZLfZ4gz); `build/` how it is made.
