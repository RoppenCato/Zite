# The Jelly Slime

Mitch, AD, 2026-11-01. The first meadows creature, level 1, 120 CSS px tall (240 in the file), in the look Robin approved
on 2026-11-01. One atlas (`slime.png` + `slime.json`, Phaser 3 JSON hash, pivot at the feet, the actions block), 106 KB.
Drawn facing LEFT; flip to face right. `sheet.png` is every frame on one page, for looking.

| Action | Frames | Delays | What happens |
| --- | --- | --- | --- |
| `slime/stand` | 6 | 130 ms, looped | a slow breath: it squashes and stretches a little, the drip wobbles |
| `slime/move` | 6 | 100 ms, looped | a hop: crouch, spring, air, fall, land, splat; the frames are in place, move the sprite about 60 px per loop toward the facing |
| `slime/attack1` | 12 | 67 ms, the 4th held 100, the 6th 50, **the 7th held 134** | it squashes back with an angry face, then lunges forward stretched; the blow lands on frame 7 |
| `slime/hit1` | 1 | held 600 ms | the splat: squashed wide, eyes shut, drops flying |
| `slime/die1` | 8 | 83 ms, the last three fading (`a0`, `a1`) | it sags, crosses its eyes, collapses into a puddle, and fades |

The `head` point in the actions block is the top of the body each frame, for a marker over it.
