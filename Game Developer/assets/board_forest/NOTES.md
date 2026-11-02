# The Wobblewood Forest board kit

Mitch, AD, 2026-11-01. Designs mine, under Robin's permission of 2026-11-01 for the studios to decide. Copy the whole folder. Same form as the meadows: sizes are world pixels, files at 2x, drawn at 0.5. `whole.jpg`, `tumbletree.jpg`, `glade.jpg` and `oakshade.jpg` are this kit laid on your real graph by my tool, not screenshots of the game.

## Your kit entry (theme `forest`, area id `thornwood`)

- **Atlases:** `board_props` (1024 by 2048, 8 MB decoded) and `board_ground` (1024 by 512, 2 MB). That is 2 MB less than the meadows' ground, because the game strokes its roads in code and I left out road, cliff and rim pieces.
- **Shared with the meadows:** `cover.png`, `name_plate.png` and `area_banner.png`. Keep loading those from `board_meadows`; there is no forest copy.
- **Tiles:** `ground_a` 40, `ground_b` 40, `ground_c` 20, at 128.
- **Road, outer first:** 30 px `#7f6240`, 25 px `#b58f5e`, 10 px `#d0b280` at 0.8 alpha.
- **Flat props, drawn before the roads:** `clover`, `worn`.
- **Placements:** `placement_wobblewood.json` under `thornwood`, in world pixels. Props stay clear of every road and spot and inside the area's bounds, which I worked out by your rule of the spots plus a margin of 60.
- **Plates:** the same `spot_*` names as the meadows, all eight kinds, in `board_props`.

## New on 2026-11-02

`spot_board` (a teal rim), `quest_board` by `edge`, `apothecary` by `thicket`, a mushroom house with a flask sign. `fir_b` and `signpost_one` left the atlas to make room; placement no longer uses them.

## The landmarks

| Hub | Piece |
| --- | --- |
| `edge` Wobblewood Board | `quest_board` |
| `thicket` Fungal Apothecary | `apothecary`, with `fungal_ring` beside it |
| `briar` Grumblebark's Glade | `glade_gate`, two old trees bent into a scowling arch |
| `elder` Mossy Shrine | `shrine` |
| `hollow` Oakshade Church | `church`, the same church under an oak, with moss and ivy |
| `pond` Root Bridge | `root_bridge` |
| `mossy` Hollow Log Shop | `hollow_log` |
| `weaver` The Upside-Down Tree | `upside_tree` |
| `brambleford` Tumbletree Village | `tumbletree` and the `tree_house_*` |
| `dusk` Dewdrop Pool | `spring` |
| `barrow` Owl Hollow | `owl_tree` |

## Not tested

Not seen in the game. The first map test used my own road curve, which follows the same formula as the meadows' test, so a prop could sit closer to your straight links than I see. Send a shot and I will move it.

## The props and the spots (`board_props`, pivot at the foot)

| Piece | Belongs to | Size (design px) | Foot from the top left (design px) |
| --- | --- | --- | --- |
| `wobble_a` | wild ground, leaning right | 106 by 118 | 47, 113 |
| `wobble_b` | wild ground, leaning left | 91 by 117 | 56, 112 |
| `tall_a` | wild ground, old giants, few | 110 by 160 | 58, 154 |
| `fir_a` | wild ground, dark corners | 73 by 86 | 46, 82 |
| `big_mush_a` | anywhere, magenta | 69 by 69 | 30, 65 |
| `big_mush_b` | anywhere, teal | 72 by 80 | 43, 74 |
| `big_mush_c` | anywhere, orange | 56 by 57 | 25, 53 |
| `log` | wild ground | 122 by 44 | 53, 39 |
| `stump` | wild ground | 60 by 31 | 30, 27 |
| `roots` | wild ground, near old trees | 90 by 36 | 44, 29 |
| `fern_a` | ground detail | 49 by 41 | 25, 35 |
| `fern_b` | ground detail | 39 by 32 | 20, 28 |
| `bells` | ground detail | 35 by 21 | 17, 19 |
| `bush_a` | at a tree's foot | 45 by 37 | 22, 29 |
| `bush_b` | at a tree's foot | 54 by 34 | 27, 25 |
| `rock_a` | where the ground breaks | 35 by 22 | 16, 15 |
| `rock_b` | where the ground breaks | 38 by 20 | 19, 13 |
| `tuft_a` | ground detail | 28 by 22 | 14, 20 |
| `tuft_b` | ground detail | 24 by 20 | 12, 18 |
| `flowers_a` | ground detail | 34 by 21 | 18, 14 |
| `clover` | moss, flat | 56 by 26 | 30, 18 |
| `worn` | trodden ground, flat, round hubs | 142 by 65 | 77, 45 |
| `mushrooms` | at a tree's foot | 33 by 21 | 18, 17 |
| `pebbles` | along the roads | 19 by 9 | 6, 6 |
| `fence` | Tumbletree | 59 by 17 | 30, 14 |
| `barrel` | Tumbletree, the shop | 18 by 20 | 8, 16 |
| `sack` | Tumbletree, the shop | 16 by 15 | 8, 13 |
| `quest_board` | Wobblewood Board | 68 by 65 | 34, 63 |
| `apothecary` | Fungal Apothecary | 93 by 81 | 46, 77 |
| `tree_house_a` | Tumbletree Village | 87 by 112 | 44, 107 |
| `tree_house_b` | Tumbletree Village | 87 by 112 | 44, 107 |
| `tree_house_c` | Tumbletree Village | 87 by 112 | 44, 107 |
| `tumbletree` | Tumbletree Village, its great tree | 192 by 227 | 63, 220 |
| `hollow_log` | Hollow Log Shop | 188 by 73 | 91, 65 |
| `upside_tree` | The Upside-Down Tree | 133 by 180 | 68, 160 |
| `fungal_ring` | Fungal Ring | 120 by 75 | 62, 72 |
| `root_bridge` | Root Bridge | 155 by 69 | 72, 56 |
| `owl_tree` | Owl Hollow | 131 by 167 | 65, 161 |
| `glade_gate` | Grumblebark's Glade | 157 by 174 | 74, 166 |
| `church` | Oakshade Church, under its oak | 164 by 178 | 50, 172 |
| `shrine` | Mossy Shrine | 44 by 55 | 26, 52 |
| `spring` | Dewdrop Pool | 82 by 61 | 39, 45 |
| `spot_wild` | a wild spot | 61 by 36 | the centre, where the token stands |
| `spot_town` | a town hub | 95 by 57 | the centre, where the token stands |
| `spot_shop` | a shop hub | 95 by 73 | the centre, where the token stands |
| `spot_chest` | a chest spot | 61 by 39 | the centre, where the token stands |
| `spot_spring` | a spring spot | 61 by 42 | the centre, where the token stands |
| `spot_shrine` | a shrine spot | 61 by 42 | the centre, where the token stands |
| `spot_board` | a quest board hub | 61 by 41 | the centre, where the token stands |
| `spot_gear` | a loot spot, roll for basic gear | 61 by 39 | the centre, where the token stands |
| `spot_shop_magic` | a magic shop hub | 95 by 74 | the centre, where the token stands |
| `spot_church` | a church hub | 61 by 42 | the centre, where the token stands |
| `spot_gate` | the boss hub | 125 by 87 | the centre, where the token stands |
