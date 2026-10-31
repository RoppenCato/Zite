# The art direction

**Decided by Robin, 2026-10-31** ("you're gonna do the art a lot different"): the look follows the MapleStory reference
library at `C:\dev\MapleStoryPlus\Settings\Inspiration`, as its `Instructions.md` lays it out. That file is the source; this
one is the studio's working sheet drawn from it: what we keep, our own numbers, the pipeline, the check. Written by Perry, AD
the same day; the numbers marked "mine" are first settings for Robin to change.

**The rule of the library: learn from it, make our own.** It answers "how is this done?": layers, grids, frame counts,
timings, proportions, what makes motion read, how colour sets a mood. Never copy a picture from it into the game, never put
one in this repository (both repositories are public), never work inside that folder. Its numbers are a tested starting
point, not requirements; its proportions and timings carry over, its pixel sizes only by our scale below.

## The sentence

**MapleStory's world, drawn by us: painted, cute and chunky, outlined dark against soft layered backgrounds; every area one
idea and one palette; built from kits, the way MapleStory builds its places.**

## 1. The style (the reference's, kept whole)

- **Painted, not pixel art.** Soft shading and many colours: a monster about 60 colours, a tile about 80. No palette
  limits, no dithering.
- **Crisp sprite edges.** Monsters fully opaque with hard edges. Semi-transparency only for glows and effects, and in
  backgrounds.
- **Dark outlines.** A thin, dark outline on characters and monsters; about a fifth of a monster's pixels are dark. It is
  what separates them from a busy background.
- **Cute and chunky.** Big heads (a character's head is half its height), simple faces with large eyes, rounded shapes,
  readable silhouettes. Even scary monsters stay a little comic. Features are exaggerated: a hit changes the whole face.
- **Saturated foreground, softer background.** Near art bright and outlined; far layers lighter, hazier, with no hard
  outlines, so play stays readable.
- **Light from above.** Highlights on top, darker undersides. Ground has a bright grassy or stony top edge above a darker
  body.
- **Each area has one clear idea and palette.** Pick the mood first (the mood table in `Instructions.md`; sample a picture
  in `Maps/Places/` for its palette) and keep every piece to it.
- **Draw at real size**, PNG with transparency. Never draw large and shrink without checking the detail survives.

## 2. Our scale (the ratios are the reference's; the pixels are ours, mine)

The reference draws a player 65 pixels tall on an 800 by 600 screen: 11 percent of the screen's height. Ours: **the player
is 100 CSS pixels tall on the 412 by 915 phone**, drawn at 2x in the file (200 pixels) for the phone's pixel ratio. So one
reference pixel is about 1.5 CSS pixels and about 3 file pixels. Everything else follows the reference's ratios:

| Thing | The reference | Ours on screen (CSS px) | In the file (2x) |
| --- | --- | --- | --- |
| The player | 65 tall, 40 wide; head 39 by 35 over a 21 by 31 body | 100 tall, 62 wide; the head half the height | 200 by 124 |
| A monster up to level 60 | 64 by 58 typical | about the player's height | about 200 |
| A monster around level 100 | 112 by 140 | about twice the player | about 400 tall |
| A typical boss | 152 by 142 | twice as tall, four times as wide | about 450 by 440 |
| The biggest boss | 827 by 561 | 8 to 9 players tall | made of parts |
| One row of ground (the grid) | 90 by 60 | 138 by 92: about the player's height | 276 by 184 |
| A decoration | about 1.5 players tall | 150 | 300 |

The screen is portrait and narrower than the reference's: it shows about six player-widths across. Everything must read in
that slice: a boss is met in parts, a town is a few houses deep.

## 3. Monsters

A monster is a set of named actions, each a list of frames with data. Most have `stand`, `move`, `hit1`, `die1`; about half
an attack.

| Action | Frames | Time a frame | What it shows |
| --- | --- | --- | --- |
| `stand` | 6 (1 to 12; simple ones 2 or 3) | 130 ms | idle: a bob or breathing, looped |
| `move` | 6 (3 to 8) | 140 ms | walk or hop, looped |
| `fly` | 5 (2 to 8) | 120 ms | replaces stand and move on flyers |
| `jump` | 1 | held | one pose in the air |
| `hit1` | 1 | 600 ms | **the most exaggerated pose**: recoil, shock, pieces knocked loose; seen most, held longest |
| `die1` | 8 (3 to 15) | 150 ms | collapse, squash or crumble, fading at the end |
| `attack1`, `attack2` | 12 to 15 (6 to 23) | 120 ms | windup, the strike with a flash or lunge, recovery |
| `skill1` | 12 (5 to 18) | 120 ms | charging and releasing, usually a glow on a still body |

**The motion rules:** change the silhouette between frames (shading alone does not read at this size); let attached parts
follow late (the Slime's antenna); keep the feet at the same height unless the monster leaves the ground; the Slime for
squash and stretch, the Orange Mushroom for character from few frames, the Stone Golem for a hit that knocks parts apart.

**Each frame carries its data:** `origin` at the feet, horizontally centred (x half the width, y the height); `delay` in
milliseconds; the hit box `lt`, `rb` relative to the origin; `head`, the top of the head; optional `a0`, `a1` opacity for
fades. Frames may differ in size; the origin keeps the feet still. **Draw facing left**; the game flips.

Our monsters are our own creatures in this manner: our slime is not their Slime. Where a kind is universal (a slime, a
mushroom, a snail, a stump) ours must differ in shape, face and colour, not only in name.

## 4. Ground: the tile kit

A set is pieces on a grid (the reference's 90 by 60; ours 138 by 92 CSS, 276 by 184 in the file), the same names in every
set so the generator can lay any of them:

| Piece | What | Origin |
| --- | --- | --- |
| `bsc` | the body; repeats seamlessly in all directions | top left |
| `enH0` | the top surface (grass, stone lip) above the grid line | bottom left |
| `enH1` | the underside edge below the grid line | top left |
| `enV0`, `enV1` | the left and right side edges | `enV0` top right, `enV1` top left |
| `edU`, `edD` | rounded end caps at the top and bottom corners | varies |
| `slLU`, `slRU`, `slLD`, `slRD` | slopes rising one grid step over one width; top surface and underside | the corner |

Several variants of the main pieces (commonly 6 `bsc`, 3 `enH0`, 3 `enH1`, 2 `enV0`, 1 `edU`), so long ground is not stamped;
every variant's left edge matches the right at the same height. Draw order: caps, then edges and slopes, then sides, the body
last on top. The walking line is not the art: feet stand a few pixels into the top edge (the reference: 7), so the top edge
is designed for that.

## 5. Backgrounds: the layer stack

A background is a stack of separate layers, back to front:

1. A flat colour or gradient, tiled (can be tiny).
2. Far scenery (sky, clouds, a skyline) tiled sideways, seamless.
3. Mid scenery (hills, tree lines) with a transparent top and an irregular upper edge.
4. Single accents (one big tree) placed once, widely spaced, two or three pictures in turn.
5. Optional front overlays (light shafts, mist), about one layer in ten, subtle: they cover the player.

**Parallax is the depth.** Each layer has a scroll factor: 0 the sky; 0.05 to 0.2 far mountains; 0.3 to 0.5 hills; 0.6 to
0.8 near scenery; 1 locked to the ground. Three to five planes with clear gaps between them (layers at nearly the same factor
read as one sheet; a layer drawn in front must move faster than those behind it). Far planes paler, hazier, less saturated,
lower in contrast and detail, shifted toward the sky colour, smaller. A layer slides less than the camera, so its width is
`screen width + (world width - screen width) * factor`, or it repeats. Clouds drift (a small drift plus a low factor keeps
them far). About one layer in seven is animated: two frames, 250 ms, or slow changes up to 3 s. Keep strong detail out of
the band where the fighters stand.

## 6. Objects: the prop kits

Trees, houses, signs, lamps, grass, fences, market stalls: placed freely, in kits per area (nature, props, houses with
`basic` and `deco` parts, signs, doors, ladders). Typical size 123 by 101 reference pixels (about 190 by 150 CSS). Origin at
the centre, so the base is computed when placing. About one in eight animated at 150 ms (lamps, water, flags), few frames.
Many small props per large one: a place's richness is many small pieces. Henesys is mostly reusable props from two kits.

## 7. How we make it (the pipeline, mine; the exact commands go in `docs/pipeline.md` once tried)

- **Monsters and characters: Blender, painted.** Models built by scripts (reproducible, never hand-edited), rendered with a
  painted look rather than the Survival game's cel: soft shading with many steps, a thin dark line (Freestyle), light from
  above, hard edges; facing left, at file size, action by action with the frame counts above; the renderer writes each
  frame's origin, delay, hit box and head. The first trial is one monster of ours beside our player, judged on the phone
  against a reference monster's proportions.
- **Ground, backgrounds, objects: painted in code and rendered in Blender.** Tile kits and background planes painted in
  Node canvas (layered gradients, soft brushes, noise, a bright top edge) with seamless edges checked by tiling; trees,
  rocks and houses as Blender renders where a form helps, finished to kit pieces. Every piece delivered with its data.
- **The generator lays kits.** The studio delivers kits (a tile set, three to five background planes, ten to twenty
  objects per area) with their data; Miles, GD's generator lays them. The layer and frame data model is in the game's
  `docs/state/art.md`.
- **Preview before delivery.** `python Settings/Scripts/Preview-Parallax.py --layers my-layers.tsv --span <width>` from
  `C:\dev\MapleStoryPlus` shows a layer stack panning (it reads our files where they are and copies nothing); the phone's
  size with `--width 412 --height 915`.

## 8. Before anything is handed over (the reference's list, kept)

1. Put it next to our player for scale, and beside a similar reference piece for proportion and motion.
2. Check it on the actual background of its area: outlines and colours behave differently on busy art.
3. Tile ground pieces and repeating layers 3 by 3 and look for seams.
4. Play animation at the real delays; a moving origin jitters.
5. Hand over the art with its data (origin, delay, hit box, head; repeat type, scroll factor, drift, opacity, front), in
   the form the game needs.

## 9. The check

A new thing is right when:

1. it reads as **one silhouette at a quarter size** and shows which way it faces;
2. it is **painted**: soft shading, many colours, a thin dark outline, hard edges, no dither;
3. it is **cute and chunky** in the reference's proportions (a head half the height; a monster of its level band's size);
4. it is **lit from above**;
5. it sits in **its area's palette and idea**, and nothing in it burns but what should;
6. beside our player on its own background it **belongs**: scale by the ratios, outline weight, saturation nearer than the
   background's;
7. its **data is complete**;
8. it **would not look out of place in `Maps/Places/`, and no piece of it is theirs.**

## The world's form (decided: Robin, 2026-10-31)

**(c) The board is seen from a raised camera, in 2D.** Robin showed a Dokapon Kingdom board and asked for "like B but 2.5D":
the ground drawn from above at a tilt, with cliff faces where the land steps up; roads, rivers, shores and the gold spaces flat
on it; everything standing on it (trees, houses, castles, the players, the monsters) upright and sorted by depth; a horizon
band (sea, far islands, sky, drifting clouds) that moves less than the ground. The camera follows the token and can pull back.
`docs/pictures/world-form/C-diorama.png` is the picture; (a) and (b) beside it are kept as the record.

**Fights are their own screen** (Robin, 2026-10-31): 2D, outside the world map, "an instanced version of where you are": a
side-view scene that looks like the place the token stands in, built from the area's kit: a ground band with a bright top
edge, three to five parallax planes, the area's props, the fighters big. This is where the library's background and parallax
rules (sections 5 and 6) apply whole.

**So an area has two kits in one palette:** the **board kit** (ground plates of its kind of ground, road pieces: straight,
bend, fork, bridge; shore; cliff faces for a step up, painted like the fight ground's top edge over its body; the gold space
plate; props seen a touch from above) and the **fight kit** (the side-view ground pieces of section 4, the planes, props seen
side on). They share the props' models and the monsters; they differ in camera. The board kit's pieces are new to us and get
their names and origins in `docs/pipeline.md` when the first area is made; the board kit comes first, because the player sees
it most.
