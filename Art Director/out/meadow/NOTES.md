# The Sunny Meadow: the first area's two kits

Perry, AD, 2026-10-31. The starting area: the meadow the first town stands in. Made as the pipeline trial
(`docs/pipeline.md`), in the manner of `docs/direction.md` and the library's sunny meadow and grassy fields moods, taking
nothing from them.

## The idea (mine)

A warm, open meadow by the sea under a big blue sky: bright grass, a sandy shore, round green trees, a mushroom house, a
signpost at the crossroads. Everything soft and round; nothing threatening. The first monsters are vegetables.

## The palette (mine; Robin may change any of it)

| What | Colour |
| --- | --- |
| The sky | `#4a9ee8` down to `#c3e8fb` at the horizon |
| The far planes (hills) | `#a9d1c1`, `#8fbcae`, hazed toward the sky |
| The mid plane (trees) | `#6fc25c`, light `#a8e37a`, shade `#44953e` |
| The ground's top edge (grass) | lip `#d6f98c`, grass `#8fd84a`, shade `#5fb04a`, deep `#3f8a2e` |
| The ground's body (earth) | `#a87c4c`, `#7d5532`, `#55381f` |
| The sea and the sand | `#2f86d0`, `#1f5fa8`; sand `#efdfae` |
| The road | `#dcbb74` with a dark edge `#6e4f2a` |
| The accents | the gold space `#f2c23a`, the red cap `#e8503e` |

The space kinds' discs (the game's kinds): town `#e08a3b`, battle `#e8503e`, shop `#ffcc33`, event `#9b5de5`, treasure
`#c98a3a`, quest `#4f8fe0`, boss `#3a3a3a`, shrine `#39b8a8` (mine, after the game's placeholder colours).

## What is in the kit (`kit.json` names every piece with its data)

**The board kit** (`board/`, `horizon/`, `objects/board/`), for the raised camera, at 0.6 of the fight's scale:

- `grass 0..2`: seamless 256 by 256 plates (the third has flowers); `plateau 0..1`: a touch lighter, for raised cells;
  `patch_light`, `patch_dark`, `patch_flowers`: soft overlays placed freely.
- `road_<mask>`: fifteen pieces on a 256 by 128 cell named by the open sides (N, E, S, W; `road_NESW` is the crossroads,
  `road_N` a dead end), plus `bridge_NS` and `bridge_EW`. The road is 40 px wide along the depth, 26 tall across it.
- `shore_<sides>`: the sand band with foam along the water, named by the water's sides (`n`, `e`, `s`, `w` and the four
  outer corners).
- `cliff_front 0..2` (its top at a raised cell's south edge: 14 px of lip, the face, a ragged foot and its shadow),
  `cliff_corner_sw`, `cliff_corner_se`, and the thin lips `cliff_edge_n`, `cliff_edge_w`, `cliff_edge_e` for the other edges
  (no face shows there from this camera).
- `space` (the gold plate; its origin is its centre on the ground; a token stands at it), `space_lit` (the ring that
  lights a reachable space), `disc_<kind>` (the inner disc per kind, laid on the plate).
- The horizon: `sky` (factor 0), `clouds` (type 4, drifting), `sea` (factor 0.3), `island_0`, `island_1` (accents placed
  once, two pictures in turn); all pinned to the top of the screen (`factorY` 0).
- Props from above: `tree`, `tree_small`, `bush`, `bush_wide`, `house` (the mushroom house), `signpost`, `fence` (1.2 m,
  pieces meet at the posts), `rock`, `stump`, `haystack`, `mushrooms`; each with `origin` (the centre) and `foot` (the
  base: the board sorts by its y), a contact shadow painted in.

**The fight kit** (`tiles/`, `background/`, `objects/fight/`), for the side-view fight screen at full scale:

- The grid pieces, 276 by 184: `bsc` 6 variants (the body, seamless both ways), `enH0` 3 (the grass top; the feet stand
  20 px below its top band), `enH1` 3 (the underside), `enV0` 2 and `enV1` 2 (the sides), `edU` and `edD` (left and
  right ends; flipping would move the lit side, so both are drawn), `slRU`, `slLU`, `slRD`, `slLD` (the slopes, rising one
  grid step over one width).
- Five planes, back to front: `sky` (factor 0), `clouds` (0.05, drifting), `hills_far` (0.2), `treeline` (0.5; its bottom
  270 px are plain grass so the fighters' band stays calm), `meadow_near` (0.8; tall grass just behind the ground). Each
  repeats sideways and is 1648 wide (two phone widths). `y` is where its top sits on the phone (in file pixels) with the
  ground's grid line at 1290.
- The same props, side on, at full scale.

## The check (docs/direction.md section 9), answered

1. Silhouettes: every prop reads as one shape at a quarter size; the house is a cap over a stem, the signpost a cross.
2. Painted: soft stepped shading, a thin dark line on the props and the fighters; the planes have no line.
3. Chunky: round trees, a bulging house, fat fence posts; the proportions are the reference's (a decoration about 1.5
   players tall; the big tree is two, as the reference's big trees are).
4. Lit from above: the tops bright, the undersides dark; the grass has a bright lip over a dark body.
5. One palette: every piece from the table above.
6. Beside our player: the fighters are the most saturated and the only outlined things near the ground; the planes get
   paler and softer with distance.
7. Data: every piece in `kit.json` with its size, origin, repeat, factor, drift, foot, layer.
8. Nothing of theirs: every piece painted or modelled here.

## What I would do next (not done)

- A second house (`basic` and `deco` parts) and a few more small props (a well, a cart, a flower bed): a town is many
  small pieces.
- An animated plane (the clouds drift already; a two-frame water sparkle on the sea at 250 ms).
- The shore's corners and the slopes have not been seen in a laid scene yet; the first generator run will show them.
- The board's plateau edges on the north, west and east are thin lips; a stronger step may want a small face there too.

## Drop-in steps (for Miles, GD)

1. Copy `out/meadow/` whole into the game's assets.
2. `kit.json` is in the shape `docs/state/art.md` names: `fight.tiles` (the grid pieces by name and variant), `fight.background`
   (the planes with `type`, `factor`, `drift`, `y`), `fight.objects` and `board.objects` (props with `origin`, `foot`,
   `layer`, `z`), `board.ground`, `board.plateau`, `board.patches`, `board.road` (by mask), `board.shore` (by water sides),
   `board.cliff`, `board.space` (plate, lit, discs), `board.horizon`.
3. Draw the board at 0.6 of the fight's scale: the board props are already rendered at that scale; the player's token and
   the monsters on the board are the fight sprites drawn at 0.6.
4. Files are at 2x: draw everything at half size in CSS pixels.
5. `board.png` and `fight.png` are the two screens laid from these pieces by `tools/meadow_scene.js`, the layout to match.

## For Robin to decide

- The palette and the idea (a meadow by the sea).
- Which props the first town needs beyond these eleven.
- Whether the board's props should be a touch smaller still (0.5) so more of the board shows.
