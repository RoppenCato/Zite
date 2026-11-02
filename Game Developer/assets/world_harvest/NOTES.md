# Honeyhill Fields in the real world

Mitch, AD, 2026-11-02, in Wobblewood's form. Copy these whole: `out/world_harvest`, `out/board_harvest`, `out/harvest_fight`, `out/creatures_harvest`. `check.json` holds the numbers.

## What is here

| File | What it is |
| --- | --- |
| `honeyhill.json` | `area` in the form of `world.json`, with `via` on every road. Also `entryRoad`, `exit`, `places` (shapes) and `spots` (every spot and the place it stands in) |
| `chunks.json`, `ground_<col>_<row>.jpg` | The baked ground. Rows 0 to 2 for columns 1 to 7, and row 3 for columns 1 and 2: 23 files, about 2.2 MB on disk |
| `overview.jpg`, `overview.json` | The whole world, replacing the forest's copy. **All three regions are now the real thing.** Same size and scale, no words |
| `placement.json` | The sprites, `{ name, x, y, hub? }`, drawn at 0.5 with no scale. Uses `board_harvest/board_props` and `board_places` here |
| `board_places.png`, `.json` | The new pieces, 2x, pivot at the foot. Same names as the other regions' where shared, so load by theme |
| `preview*.jpg`, `phone_*.jpg` | Pictures drawn only from these files, by the studio's tool. Not screenshots |

**Row 3 under the mountains:** `chunks.json` lists columns 3 to 7 of row 3 with `from: 'world_forest'`. Those are the forest's own files, unchanged, so nothing there needs recopying. Load them from where you already have them.

## The layout

- **19 hubs and 25 roads.** The 10 old ids are kept. New: `honeybell`, `honeypools`, `tallcorn`, `buzzwild`, `slyorchard`, `strawrows`, `fallow`, `oldpress`, `poppyrise`.
- **158 spots,** counting those of the entry road north of y 3072, against "about 170". No two closer than 78, no roads crossing, no spot in another ground's shape.
- **Kinds:** 2 towns, board, arms shop, magic shop, church, gate, 6 potions, 3 chests, 3 shrines, 6 gear, 133 wild.
- **A second town, `honeybell` (mine),** beside the church `ridge`, so the coach has two stops, as you kept Oakshade.
- **Grounds:** four, one mob each, names, trophies and drops unchanged, with `levels`. Hubs moved to each place's centre:

| Ground | Hub | Mob (art) | Levels |
| --- | --- | --- | --- |
| `honey-rows` | `honeypools` | `ice-wolf` (Honey Blob) | 8-9 |
| `corn-field` | `tallcorn` | `yeti` (Corn Goblin) | 9-10 |
| `buzz-meadow` | `buzzwild` | `frost-wisp` (Buzzbug) | 10-11 |
| `mimic-orchard` | `slyorchard` | `ice-golem` (Apple Mimic) | 11-12 |

- **Named wild places, no ground of their own:** Scarecrow Rows around `strawrows`, where `yeti-elder` still roams and the `mob_scarecrow` piece stands, and the hive around `summit`.
- **Spots by place:** 96 on open road, 13 in towns, the rest in places. `check.json` has the split.

## The two ways out

- **In over the pass:** `entryRoad` replaces your `briar` to `pass` road. It runs on the forest's `pass.path` to (4720, 3072), then on to the new `pass` hub at (4720, 2620), with 8 spots.
- **Out to `gen-1`:** `exit` has `hub: 'summit'`, a `path` east along the north shore, and a `foot` at (7040, 342), the coast. Draw `shore_barred` at `foot` until Queen Bumble falls, then `shore_open`, sorted by foot. I would like the generator's road to leave along that `path`, off the map's east edge, so the map's last gate stands where the land runs out. The path crosses no road. Beyond x 7400 it is yours.

## The ground

- **Clamp the camera** to x 1024 to 7400, y 0 to about 3300 while you are in Honeyhill.
- **Baked:** land, the patchwork fields, places' ground, mountains, and every piece more than 170 px from a road. The mountains follow the same sequence as the forest's, so those standing in row 3 carry on into row 2 with no seam.
- **About 4 MB decoded each,** so load only those near the camera, as you do now.

## Roads and sprites

- **Roads:** the Meadows' colours: 30 px `#b4935a`, 25 px `#d9bb7e`, 10 px `#ecd49c` at 0.8 alpha. Stroke `[from, ...via, to]` as a polyline, unsmoothed.
- **Sprites:** 525 in all. The most in a view at zoom 0.8 is 48, and 71 on a screen 600 wide, under your 150.
- **Flat, drawn before the roads:** `clover`, `worn`.

## Not tested

Not seen in the game or on a phone, and not run through your rules. The spots agree with `pointsAlong` only because I copied its formula. I checked it by eye at zoom 0.8 at about eleven places, not all 158 spots. One thing I left: the forest's trees start in a straight line at y 3300, which shows a little on the overview, under the mountains. Say if it bothers you when you see it and I will rebake that row.
