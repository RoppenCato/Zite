# The Honey Bumble: a fat round bee that flies

Perry, AD, 2026-10-31 (Robin: "create three new monsters"). Painted 2D in the Warrior's hand: flat chosen tones, one ink
line, drawn in code (`build/bumble.js` through `build/monster_paint.js`, the studio's `tools/monster_paint.js`), each frame a
pose of a few numbers. A meadow monster of the starter band, well under the player's height.

## The look

A striped yellow body with a fuzzy top, a round head with big eyes and two bobbled antennae, two blurred wings that beat, a small stinger, four dangling legs. It hovers about 50 CSS px off the ground; the origin stays at the ground under it, as the reference does for flyers. About 60 CSS px across.

## The animations (the reference's counts; Miles, GD keeps the names and rates in data)

| Action | Frames | Delay per frame | Loop | What it shows |
| --- | --- | --- | --- | --- |
| `bumble/stand/0001..0006` | 6 | 100 ms | yes | a breath; frame 5 blinks |
| `bumble/move/0001..0006` | 6 | 100 ms | yes | flying forward with a lean and speed lines ('stand' is the hover; the reference's 'fly' is these two) |
| `bumble/hit1/0001` | 1 | 600 ms | no | squashed and spun, the eyes popped |
| `bumble/die1/0001..0008` | 8 | 83 ms | no | the eyes go to crosses, it spins and drops, bounces on the ground, fades; `a0`/`a1` fade the last three frames |
| `bumble/attack1/0001..0012` | 12 | 67 ms (two frames held 134 ms) | no | pulls back and up, then dives forward with the stinger; the dive lands on frame 7 (held), then it returns |

Each frame's `delay`, `origin` (the feet, in the frame's own pixels), `lt`/`rb` (the painted bounds, relative to the origin)
and `head` (the top) are in `actions.<name>.frames[]` of `bumble.json`; the atlas frame carries the same point as `pivot`.

## Drawing it

- Files at 2x: draw at half size in CSS pixels. Drawn facing left (toward the player); `flipX` to face right.
- The game lays the contact shadow (a flat ellipse at the origin, about 70 by 20 CSS px at 0.22 black).
- On the board draw `stand` at 0.6.

## What is here

`bumble.png` (a 1024-wide palette atlas) and `bumble.json`; `frames/` loose for looking; `sheet.png`, `compare.png` (beside the
Warrior on the meadow, every action's key pose), `screen.png` (the full phone screen), `bumble.gif` (moving; a phone shows it as
a still: the moving page is https://claude.ai/artifact/5jqqUC9CzAgF8dzZLfZ4gz); `build/` how it is made.
