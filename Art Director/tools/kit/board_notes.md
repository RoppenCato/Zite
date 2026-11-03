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
- **Board and apothecary:** `spot_board` (56, a teal rim), `quest_board` by `crossroads`, `apothecary` by `windy`, a green-thatched cottage (2026-11-02). `hedge_long` and `stile` are gone from the atlas: nothing placed them.
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

