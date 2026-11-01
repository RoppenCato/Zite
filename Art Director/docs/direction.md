# The art direction: the shell, and the look

Robin, 2026-11-01: the art direction of 2026-10-31 is scrapped; the shell stays; the art starts again, with no reference
pictures carried over (MapleStory and the three example pictures are both out). Rewritten by Mitch, AD the same day. The game's own `docs/state/art.md` and `docs/art-demands.md`
are the authority on budgets, file form and what is needed; this sheet is what the studio builds to.

## The look (not decided)

To be written after the first still, with the date and Robin's words: one sentence for the look, then the colours, the
line, the light, the proportions, the sizes, and a short check. Until then nothing about the look is decided.

**Open with Robin:** what this game should look like and which references he loves (asked with pictures); the player's
height on screen (100 CSS px was Perry, AD's number; Robin's own sheet stood 118 and he liked its presence); the mood of
the first area; whether the hero's still is painted here or made with his image tool from a brief and then cut and
animated here.

## The world's form (Robin, 2026-10-31)

**The board is seen from a raised camera, in 2D.** Robin showed a Dokapon Kingdom board and asked for "like B but 2.5D":
the ground drawn from above at a tilt, with cliff faces where the land steps up; roads, rivers, shores and the spaces flat
on it; everything standing on it (trees, houses, castles, the players, the monsters) upright and sorted by depth; a horizon
band (sea, far islands, sky, drifting clouds) that moves less than the ground. The camera follows the token and can pull
back. `docs/pictures/world-form/C-diorama.png` is the picture.

**Fights are their own screen**: 2D, outside the world map, "an instanced version of where you are": a side-view scene
that looks like the place the token stands in, built from the area's kit: a ground band with a bright top edge, layered
planes behind, the area's props, the fighters big.

**So an area has two kits in one palette:** the **board kit** (ground tiles and edge pieces, cliff faces, road pieces, spot
markers, badges, the closed-area cover, horizon strips; props seen a touch from above) and the **fight kit** (a side-view
ground band, two or three backdrop strips over a code-drawn sky, props seen side on). They share the props' designs and the
monsters; they differ in camera. The exact pieces, counts and sizes are in the game's `docs/art-demands.md`.

## Scale (the game's numbers, `docs/state/art.md`)

The design size is 412 by 915 CSS pixels, portrait; files at 2x. On screen, in CSS pixels: a board token about 40 tall; in a
fight the player about 160 tall (to be reconfirmed with Robin), a monster 120 to 240, a boss up to 400. The board is drawn
at 0.8 and seen whole at 0.3, so board pieces are broad shapes with little fine detail.

## Monsters and characters: named actions with frame data

A monster is a set of named actions, each a list of frames with data. The counts are the game's budget (about 33 frames):

| Action | Frames | Rate | What it shows |
| --- | --- | --- | --- |
| `stand` | 6 | 10 a second, looped | idle: a bob or breathing |
| `move` | 6 | 10 a second, looped | walk or hop (`fly` for flyers, hovering above an origin that stays on the ground) |
| `hit1` | 1 | held | **the most exaggerated pose**: recoil, shock, pieces knocked loose; seen most |
| `die1` | 8 | 12 a second | collapse, squash or crumble, the last frames fading |
| `attack1` | 12 | 15 a second, two frames held | windup, the strike with a flash or lunge, recovery; the blow lands on the second held frame |

A class character: about 25 frames (stand 4, move 6, attack1 6, hit1 1, die1 6). A boss may add a second phase (a second
`stand` and `attack1`) if a second atlas fits.

**The motion rules:** change the silhouette between frames (shading alone does not read at this size); let attached parts
follow late; keep the feet at the same height unless the thing leaves the ground; the windup is the tell.

**Each frame carries its data:** `origin` at the feet, horizontally centred; `delay` in milliseconds; the hit box `lt`, `rb`
relative to the origin; `head`, the top of the head; optional `a0`, `a1` opacity for fades. Frames may differ in size; the
origin keeps the feet still. **Draw facing left**; the game flips.

## The atlas form and the budgets (Miles, GD, 2026-10-31; the game's `docs/state/art.md` is the authority)

Atlases only, Phaser 3 JSON hash, frame names `<sprite>/<action>/0001`, 2 px padding, the pivot at the feet per frame;
power-of-two sides up to 2048; a character or monster at most 1024 by 2048; a monster under 300 KB, a class character under
400 KB, an area's kit under 2.5 MB, the first load under 3.5 MB of art; at most 4 full-screen layers in a fight, 3 on the
board; a palette PNG wherever it holds (`tools/shrink.py`). `tools/pack.js` writes this form from frames and a meta.json.

## Backdrops: layers, never one picture

The sky is a gradient drawn by code; then two or three strips of at most 2048 by 1024 (2x) that tile or stretch; then the
ground. Each layer has a scroll factor with clear gaps between layers (a layer in front moves faster than those behind).
Far planes paler, hazier, less saturated, lower in contrast and detail, shifted toward the sky colour. Clouds drift. Keep
strong detail out of the band where the fighters stand.

## Before anything is handed over

1. Put it next to our player for scale.
2. Check it on the actual background of its area: edges and colours behave differently on busy art.
3. Tile ground pieces and repeating layers 3 by 3 and look for seams.
4. Play animation at the real delays; a moving origin jitters.
5. Hand over the art with its data (origin, delay, hit box, head; repeat type, scroll factor, drift, opacity, front), in
   the form the game needs, with a NOTES.md.

## The check

A new thing is right when:

1. it reads as **one silhouette at a quarter size** and shows which way it faces;
2. it is in **the look** (once decided), with chosen tones and one light over the whole form;
3. it is **lit from above**;
4. it sits in **its area's palette and idea**, and nothing in it burns but what should;
5. beside our player on its own background it **belongs**: scale, edge weight, saturation nearer than the background's;
6. nothing thin has gone black, nothing small has vanished, and repeats differ;
7. if it moves, it has been played at real delays, feet locked, frames not cut off;
8. its **data is complete**, and what was not tested is said.
