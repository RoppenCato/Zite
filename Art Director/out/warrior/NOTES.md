# The Warrior: the player's first class character

Perry, AD, 2026-10-31. **Robin, 2026-10-31: "Let's go with that for now. We can get back to it later."** The painted look on
Colin, AD's rig: flat chosen tones, one ink line, drawn as 2D parts between the joints a Blender rig places in each frame,
so the arms, legs and neck stay connected and the three-quarter view holds in every pose. The road here is in
`docs/hero-iterations.md` (three rounds with Colin, AD, Robin's own notes, the volume variants Robin turned down for their
3D look).

## What is here

- `warrior.png`, `warrior.json`: the atlas (1024 by 1024, a palette PNG) and its Phaser 3 JSON hash with an `actions` block.
- `frames/`: the 23 frames loose, for looking; the game needs only the atlas and its json.
- `sheet.png`, `compare.png`, `screen.png`, `warrior.gif`: the frames, the key poses beside the Turnip Grump, the full phone
  screen, and the clips moving (the gif shows as a still on a phone; the moving page is https://claude.ai/artifact/TqWpdjSd5KNgJqhVPng1Ae).
- `build/`: how it is made. `warrior_vol.py --skeleton` writes the joints per frame from the rig, `hero_puppet.js` paints
  the parts between them, `smear.js` adds the strike's trail. The exact commands are in `docs/pipeline.md`.

## The animations (Miles, GD keeps the names and rates in data)

| Action | Frames | Delay per frame | Loop | Note |
| --- | --- | --- | --- | --- |
| `warrior/stand/0001..0004` | 4 | 100 ms | yes | a breath; frame 3 blinks |
| `warrior/move/0001..0006` | 6 | 100 ms | yes | a walk in place; the stride is about 0.2 m a step (two steps a cycle, 0.6 s), so the feet keep up at about 0.67 m a second: 67 CSS px a second at the fight's scale, 40 on the board |
| `warrior/attack1/0001..0006` | 6 | 67 ms; frames 2 and 4 held 134 ms | no | the overhead cut; the blow lands on frame 4 (the held strike), where the hit window goes |
| `warrior/hit1/0001` | 1 | 600 ms | no | the knock-back, held |
| `warrior/die1/0001..0006` | 6 | 83 ms | no | onto the back, the sword dropped; `a0`/`a1` fade the last three frames (220, 120, 0) |

Each frame's `delay` is in `actions.<name>.frames[]` beside its `origin` (the feet, in the frame's own pixels), `lt`/`rb`
(the painted bounds, relative to the origin) and `head` (the top of the head). The atlas frame has the same point as `pivot`
(0 to 1 of the frame), at the feet, so trimmed frames do not jump.

## Drawing it

- Files are at 2x: draw at half size in CSS pixels. He stands 100 CSS px to the top of the hair.
- Drawn facing left; `flipX` to face right. In a fight he stands on the left facing the monster on the right, so he is flipped there.
- On the board draw `stand` at 0.6.
- The game lays the contact shadow (a flat ellipse at the feet, about 60 by 16 CSS px at 0.22 black).

## What is not final (Robin: we get back to it later)

- The hair is a plain soft cap with fringe locks; the locks can be shaped more.
- The far leg reads a little short in the walk's passing frames.
- The Turnip Grump's ringed eyes do not match the hero's; a change in its builder.
- The other three classes (Rogue, Mage, Ranger) go on the same rig with their own weapons and poses.
