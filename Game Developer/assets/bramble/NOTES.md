# The Bramble Bun: a bramble ball that rolls

Perry, AD, 2026-10-31 (Robin: "create three new monsters"). Painted 2D in the Warrior's hand: flat chosen tones, one ink
line, drawn in code (`build/bramble.js` through `build/monster_paint.js`, the studio's `tools/monster_paint.js`), each frame a
pose of a few numbers. A meadow monster of the starter band, well under the player's height.

## The look

A round bun of tangled bramble: dark green laced with brown twig lines, small thorns round the rim, three red berries, a leaf tuft on top, and a face with two eyes and a grin with two teeth. It rolls to move, the whole bun turning, face and all, with a squash at each contact. About 65 CSS px tall.

## The animations (the reference's counts; Miles, GD keeps the names and rates in data)

| Action | Frames | Delay per frame | Loop | What it shows |
| --- | --- | --- | --- | --- |
| `bramble/stand/0001..0006` | 6 | 100 ms | yes | a breath; frame 5 blinks |
| `bramble/move/0001..0006` | 6 | 100 ms | yes | a roll: a full turn in six frames with a squash at contact |
| `bramble/hit1/0001` | 1 | 600 ms | no | flattened wide, the berries popped off, the eyes shocked |
| `bramble/die1/0001..0008` | 8 | 83 ms | no | it unravels into a heap of twigs, the berries rolling away, then fades; `a0`/`a1` fade the last three frames |
| `bramble/attack1/0001..0012` | 12 | 67 ms (two frames held 134 ms) | no | rocks back, then rolls at the enemy in a spin and squashes on the impact (frame 8, held), then rolls back to its place |

Each frame's `delay`, `origin` (the feet, in the frame's own pixels), `lt`/`rb` (the painted bounds, relative to the origin)
and `head` (the top) are in `actions.<name>.frames[]` of `bramble.json`; the atlas frame carries the same point as `pivot`.

## Drawing it

- Files at 2x: draw at half size in CSS pixels. Drawn facing left (toward the player); `flipX` to face right.
- The game lays the contact shadow (a flat ellipse at the origin, about 70 by 20 CSS px at 0.22 black).
- On the board draw `stand` at 0.6.

## What is here

`bramble.png` (a 1024-wide palette atlas) and `bramble.json`; `frames/` loose for looking; `sheet.png`, `compare.png` (beside the
Warrior on the meadow, every action's key pose), `screen.png` (the full phone screen), `bramble.gif` (moving; a phone shows it as
a still: the moving page is https://claude.ai/artifact/5jqqUC9CzAgF8dzZLfZ4gz); `build/` how it is made.
