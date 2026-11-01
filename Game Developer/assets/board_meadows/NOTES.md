# The Cloverfield Meadows board kit

Mitch, AD, 2026-11-01. Copy the whole folder. Sizes are design pixels (world pixels on the board); the files are 2x, so draw
them at 0.5. About 280 KB in all, against the area kit's 2.5 MB for board and fight together. Decoded: `board_props` 8 MB
(1024 by 2048), `board_ground` 4 MB, `cover` 1 MB.

`puddlewick.jpg`, `crossroads.jpg`, `church.jpg` and `whole.jpg` are this kit laid on your real graph by the studio's tool, from these same
atlases. They are not screenshots of the game.

## How to lay it

- **Ground:** `ground_a` to `ground_d` at random per 128 px cell from the world seed, mostly a and b. They share one base
  colour at their edges, so they mix without showing squares. Tiles are 1 px extruded.
- **Roads:** stroke the curve in code with three lines: 30 px `#b4935a`, 25 px `#d9bb7e`, 10 px `#ecd49c` at 0.8 alpha, round
  joins. Or repeat `road_straight` along the curve, turned to it, with `road_end` at each spot and `road_junction` at each hub.
- **Spots:** `spot_<kind>`, the pivot at the centre, where the token stands: wild 56 wide, town and shop 90, chest, spring,
  shrine and church 56, the gate 120. Clean plates with the kind in the rim's colour and nothing on them (Robin, 2026-11-01).
- **Props:** pivot at the foot, shadows baked in. Sort by the foot's y with the token in the same sort. Do not flip them: the
  shadow falls to the lower right on every piece. `clover`, `worn` and `hill` are flat: draw them before the roads.
- **The church:** `church` stands by `ravine`, Little Clover Church, on a `spot_church` plate with a rose rim (Robin, 2026-11-01: "a church somewhere on each map"). Placement has it, with the long hedge and the stile gone from that hub.
- **Placement:** `placement_cloverfield.json` lists every prop as `{ name, x, y, hub? }` in world pixels, ready to load. It keeps
  each piece's whole body clear of the roads and spots and inside the area's bounds as the game reports them (x 140 to 1240,
  stopping where Thornwood begins; y 2120 to 3592). The first version assumed the 1400 wide in `docs/art-demands.md` and put
  props past the edge; replace it. For grown areas the rule is in `tools/kit/board_test.js`.
- **The hill and the windmill:** draw `hill` flat; the windmill stands 40 px above the hill's foot, as in the file.
- **Cover:** `cover.png`, 256 square, seamless soft cloud, full colour.
- **Plates:** `name_plate.png` 120 by 28 and `area_banner.png` 400 by 60, for your words.
- **Not needed for now:** `cliff`, `rim_north`, `rim_south`, `road_bend`, `road_fork` (the world has no heights or coast).

## Not tested, and left out

The horizon strips are left out; `far.png` from the fight kit can stand in. The windmill's sails and the smoke do not move yet.
The cliff and the rims were checked as repeats only.

## The props and the spots (`board_props`, pivot at the foot)

| Piece | Belongs to | Size (design px) | Foot from the top left (design px) |
| --- | --- | --- | --- |
| `oak_a` | wild ground, copses | 82 by 93 | 44, 89 |
| `oak_b` | wild ground, copses | 86 by 97 | 46, 94 |
| `oak_c` | wild ground, copses | 105 by 119 | 56, 115 |
| `poplar_a` | wild ground, in pairs | 67 by 104 | 45, 99 |
| `poplar_b` | wild ground, in pairs | 80 by 121 | 53, 116 |
| `apple_a` | Abandoned Orchard, the village | 63 by 67 | 32, 65 |
| `apple_b` | Abandoned Orchard, the village | 72 by 78 | 37, 75 |
| `pine_a` | Windmill Hill, high ground | 70 by 81 | 44, 78 |
| `pine_b` | Windmill Hill, high ground | 61 by 74 | 40, 71 |
| `gnarled_oak` | Clover Crossroads, once per area | 159 by 166 | 84, 161 |
| `bush_a` | anywhere, at a tree's foot | 45 by 37 | 22, 29 |
| `bush_b` | anywhere, at a tree's foot | 54 by 34 | 27, 25 |
| `hedge_short` | Hedgerow, field edges | 114 by 30 | 64, 28 |
| `hedge_long` | Hedgerow, field edges | 178 by 28 | 105, 27 |
| `rock_a` | anywhere the ground breaks | 35 by 22 | 16, 15 |
| `rock_b` | anywhere the ground breaks | 38 by 20 | 19, 13 |
| `rock_c` | anywhere the ground breaks | 33 by 17 | 14, 10 |
| `tuft_a` | ground detail | 28 by 22 | 14, 20 |
| `tuft_b` | ground detail | 24 by 20 | 12, 18 |
| `flowers_a` | ground detail, in the lee of hedges | 34 by 21 | 18, 14 |
| `flowers_b` | ground detail, in the lee of hedges | 28 by 20 | 11, 14 |
| `clover` | ground detail, flat | 56 by 26 | 30, 18 |
| `worn` | ground detail, flat, round hubs and junctions | 142 by 65 | 77, 45 |
| `mushrooms` | at an oak's foot | 33 by 21 | 18, 17 |
| `pebbles` | along the roads | 19 by 9 | 6, 6 |
| `house_tile` | town hubs | 66 by 81 | 34, 76 |
| `house_thatch` | town hubs | 76 by 83 | 39, 78 |
| `house_loft` | town hubs | 69 by 90 | 37, 84 |
| `well` | Puddlewick Village, the square | 39 by 41 | 22, 39 |
| `fence` | town hubs, Windmill Hill | 59 by 17 | 30, 14 |
| `barrel` | town hubs | 18 by 20 | 8, 16 |
| `sack` | town hubs, Windmill Hill | 16 by 15 | 8, 13 |
| `signpost_one` | wild ground | 29 by 42 | 6, 38 |
| `signpost_three` | Clover Crossroads | 59 by 57 | 29, 51 |
| `stile` | Hedgerow | 22 by 21 | 11, 18 |
| `hill` | Windmill Hill, under the windmill; a flat piece, draw it before the roads; the windmill stands 40 design px above its foot | 167 by 85 | 77, 76 |
| `windmill` | Windmill Hill | 129 by 161 | 70, 149 |
| `old_mill` | Old Mill | 105 by 64 | 40, 57 |
| `pond` | Duck Pond | 164 by 106 | 83, 92 |
| `church` | Little Clover Church, one on each map, beside its church hub | 138 by 169 | 55, 162 |
| `spring` | Abandoned Orchard, a spring spot | 82 by 61 | 39, 45 |
| `shrine` | Forest Shrine, a shrine spot | 44 by 55 | 26, 52 |
| `chest` | Slime Cave, a chest spot (closed; the opening is the loot drop) | 39 by 33 | 19, 25 |
| `gate` | King Goo's Gate | 98 by 78 | 50, 70 |
| `spot_wild` | a wild spot (n) | 61 by 36 | the centre, where the token stands |
| `spot_town` | a town hub | 95 by 54 | the centre, where the token stands |
| `spot_shop` | a shop hub | 95 by 54 | the centre, where the token stands |
| `spot_chest` | a chest spot (t) | 61 by 36 | the centre, where the token stands |
| `spot_spring` | a spring spot (p) | 61 by 36 | the centre, where the token stands |
| `spot_shrine` | a shrine spot (s) | 61 by 36 | the centre, where the token stands |
| `spot_church` | a church hub, heals and clears poison | 61 by 36 | the centre, where the token stands |
| `spot_gate` | the boss hub | 125 by 71 | the centre, where the token stands |

## The ground (`board_ground`, 1 px extruded)

| Piece | What | Size (design px) |
| --- | --- | --- |
| `ground_a` | plain meadow | 128 by 128 |
| `ground_b` | plain meadow | 128 by 128 |
| `ground_c` | meadow with a clover patch | 128 by 128 |
| `ground_d` | meadow with a darker patch, under trees | 128 by 128 |
| `ground_worn` | meadow with a worn patch, round hubs | 128 by 128 |
| `road_straight` | repeats along its length; turn it to any angle | 64 by 40 |
| `road_end` | a round joint or end, centred on a spot | 40 by 40 |
| `road_junction` | a wider joint where three roads meet | 64 by 64 |
| `road_bend` | a quarter bend, enters at the left, leaves at the bottom | 64 by 64 |
| `road_fork` | a fork, enters at the left, leaves at the right and the bottom | 64 by 64 |
| `cliff` | the step where land rises; repeats sideways; its top meets the upper ground | 128 by 56 |
| `rim_north` | the map's far edge; repeats sideways; land at the bottom | 128 by 64 |
| `rim_south` | the map's near edge, with a low chalk face; draw it flipped vertically so land is at the top | 128 by 64 |
