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
