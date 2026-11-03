# The bigger land: Bogglemire and The Frostcrown, painted

Mitch, AD, 2026-11-02, for Miles, GD. Robin: "Go for both, names are fine, paint them." In Honeyhill's form. Names, places, creatures and numbers not marked as Robin's are mine. Stats are yours. Not seen in the game or on a phone, and not run through your rules.

## Copy these whole

| Folder | What |
| --- | --- |
| `out/world_swamp`, `out/board_swamp`, `out/creatures_swamp`, `out/swamp_fight` | Bogglemire |
| `out/world_frost`, `out/board_frost`, `out/creatures_frost`, `out/frost_fight` | The Frostcrown |
| `out/arena_east` | The two new Arenas |
| `out/overview_east` | The overview for the east, loaded once the swamp is open |
| `out/fog_east` | The veils over the closed lands, and the bosses' silhouettes |
| `out/journal_east` | Journal faces for the 12 new creatures, and for Glowcap and Old Rootbeard |

## The old world's files that change

**Recopy column 7:** today's sea stopped at x 7700 and past that the files were black. West of x 7390 they are the old pixels, unchanged; from there to x 7680 they blend into the new sea, so no seam shows. The causeway is painted on top from `shoreend` (7300, 360).

| From | Over |
| --- | --- |
| `world_swamp/ground_7_0.jpg` to `ground_7_2.jpg` | `assets/world_harvest/`, same names |
| `world_swamp/ground_7_3.jpg` to `ground_7_8.jpg` | `assets/world_forest/`, same names |

**Column 11 is in both new folders; use `world_frost`'s.** Its files hold the swamp's side and the mountains' side. `world_swamp`'s copies have only the swamp's side.

`world_swamp/chunks.json` also lists `ground_7_5` to `ground_7_8` with `seaOnly: true`. They belong to the Forest's list, not the swamp's.

## The world

- **Width 16600, height 9300.** Rows below the two lands have no painted chunks. Clamp the camera to `camera` in each region's json, so no one reaches them.
- **Grown lands** must start east of x 16600, or below y 6144.
- **Levels:** Bogglemire 12 to 16, tier 4. The Frostcrown 16 to 20, tier 5.

## How the lands join

| What | Where | Holds |
| --- | --- | --- |
| Honeyhill's `exit` | today's `exit`; change `opens` to `bogglemire` | Queen Bumble's gate at (7040, 342) stays as it is |
| New hub `shoreend` and road `summit` to `shoreend` | `shoreRoad` in `bogglemire.json` | In `frostpeak`, stroked in Honeyhill's colours as usual, 15 spots, 190 apart |
| Road `shoreend` to `mire-board` | `entryRoad` in `bogglemire.json` | The plank causeway, baked, 8 spots |
| The swamp's `exit` | `exit` in `bogglemire.json`, hub `murkpool`, opens `frostcrown` | Draw `gate_barred` or `gate_open` from `world_swamp/board_places` at (11560, 4522) |
| Road `murkpool` to `frost-camp` | `entryRoad` in `frostcrown.json` | Area `frostcrown`, baked, 21 spots |
| The mountains' `exit` | `exit` in `frostcrown.json`, hub `frostseat`, opens `gen-1` | `gate_barred` or `gate_open` from `world_frost/board_places` at (15866, 610). Its `path` runs off the coast to (16200, 760); carry on from there to the grown land |

**The roads are baked.** `bakedRoads: true` in both jsons. Do not stroke the roads of these two areas or their entry roads, or you will cover the planks and the snow. Spot plates still go on top. I checked that no spot on these long roads stands under 78 from another, across the seams too.

## The layouts

| | Bogglemire | The Frostcrown |
| --- | --- | --- |
| File | `world_swamp/bogglemire.json` | `world_frost/frostcrown.json` |
| Area id, theme | `bogglemire`, `swamp` | `frostcrown`, `mountain` |
| Hubs, roads | 19, 25 | 19, 26 |
| Spots, not counting the entry road's where stated in `check.json` | 168 | 185 |
| Towns | Stiltwick, Lanternhollow | Pinefoot, Snowgate |
| Arena spot, a dead end | `mudarena` | `stonering` |
| Boss hub | `murkpool`, `boss: "mother-murk"` | `frostseat`, `boss: "frostbeard"` |
| Spacing | 138 | 155, to stay near 170 |
| Sprites, most in a view at 0.8 | 315, 31 | 359, 35 |
| Ground on disk | 2.4 MB | 2.7 MB |

Each json holds `area` with `via` on every road, `places` with shapes, and `spots`. `check.json` has the counts. Neither has crossing roads or spots closer than 78.

**Grounds:**

| Ground | Hub | Mob | Levels |
| --- | --- | --- | --- |
| `toad-pools` | `toadpools` | `bog-toad` | 12-13 |
| `mudflats` | `mudflats` | `mudling` | 13-14 |
| `wisp-fen` | `wispfen` | `lantern-wisp` | 14-15 |
| `reed-beds` | `reedbeds` | `reed-witch` | 15-16 |
| `goat-rocks` | `goatrocks` | `snow-goat` | 16-17 |
| `crag-camp` | `cragcamp` | `crag-goblin` | 17-18 |
| `boulder-slope` | `boulderslope` | `pebble-golem` | 18-19 |
| `frostling-hollow` | `frosthollow` | `frostling` | 19-20 |

The wild places with no ground of their own are `snapperhole` (`bogsnapper`) and `bighornledge` (`old-bighorn`). These are the two mini-bosses in `miniBosses`, as `yeti-elder` was at Scarecrow Rows. The hubs' names are in the json.

## The board kits

`board_swamp` and `board_frost`, each `board_props` (1024 by 2048) and `board_ground`. `world_*/board_places` holds the arches, gates and small mobs. All 2x, drawn at 0.5, with the same plate names as the other regions.

`placement.json` is `{ name, x, y, hub? }`, sorted by foot. There are no flat pieces.

## The creatures

Files face left, pivot at the feet. Copy each folder.

| Enemy id, new | Name | Folder | Scale | Blow frame | Height (CSS px) | Frames |
| --- | --- | --- | --- | --- | --- | --- |
| `bog-toad` | Bog Toad | `creatures_swamp/bog_toad` | 0.5714 | 7 | 130 | 33 |
| `mudling` | Mudling | `creatures_swamp/mudling` | 0.6667 | 7 | 140 | 33 |
| `lantern-wisp` | Lantern Wisp, `hovers: true` | `creatures_swamp/lantern_wisp` | 0.5714 | 7 | 130 | 33 |
| `reed-witch` | Reed Witch | `creatures_swamp/reed_witch` | 0.5714 | 4 | 150 | 24 |
| `bogsnapper` | Bogsnapper | `creatures_swamp/bogsnapper` | 1.1429 | 7 | 170 | 33 |
| `mother-murk` | Old Mother Murk | `creatures_swamp/mother_murk` | **1.1** | 5 | 330 | 20 |
| `mother-murk`, second phase | Old Mother Murk, the bog boils | `creatures_swamp/mother_murk2` | **1.1** | 5 | 330 | 11 |
| `snow-goat` | Snow Goat | `creatures_frost/snow_goat` | 0.7273 | 7 | 130 | 33 |
| `crag-goblin` | Crag Goblin | `creatures_frost/crag_goblin` | 0.5333 | 4 | 145 | 24 |
| `pebble-golem` | Pebble Golem | `creatures_frost/pebble_golem` | 0.8 | 7 | 160 | 33 |
| `frostling` | Frostling | `creatures_frost/frostling` | 0.5 | 7 | 120 | 33 |
| `old-bighorn` | Old Bighorn | `creatures_frost/old_bighorn` | 1 | 7 | 220 | 33 |
| `frostbeard` | Frostbeard | `creatures_frost/frostbeard` | **1.1** | 5 | 345 | 20 |
| `frostbeard`, second phase | Frostbeard, the blizzard comes | `creatures_frost/frostbeard2` | **1.1** | 5 | 345 | 11 |

- **The bosses' scale:** the atlas's own number is 1.3333, and `matchups.jpg` shows them at that size, too big for the 412 column. I chose 1.1 without seeing it. Move it if they sit wrong.
- **The clips:** most: stand 6, move 6, attack1 12, hit1 1, die1 8. Reed Witch and Crag Goblin: the Knight's skeleton without defend: stand 4, move 6, attack1 6, hit1 2, die1 6. The two bosses: stand 3, move 3, attack1 8, hit1 1, die1 5.
- **Second phases** hold only `stand` and `attack1` (3 and 8), as with `queen_bumble2`. Keep `move`, `hit1` and `die1` from the first atlas.
- **On the blow:** the Bog Toad's tongue shoots out; the Bogsnapper's beak opens; the Lantern Wisp spits flame; the bosses bring the ladle and the hammer down.
- **Names you may want for moves:** Bog Toad: Long Tongue. Mudling: Mud Fist. Lantern Wisp: Ember Spit. Reed Witch: Dragonfly Hex. Bogsnapper: Snap. Mother Murk: Ladle Slam, Boiling Bog. Snow Goat: Horn Charge. Crag Goblin: Pick Swing. Pebble Golem: Rock Fist. Frostling: Icicle Jab. Old Bighorn: Great Charge. Frostbeard: Ice Hammer, Blizzard.

## The fight backdrops

Five strips each, in the regions' form. Keep `groundY` 490, `stripY` 640, `heroX` 66, `enemyX` 318, `feet: 46`. `matchups.jpg` and `screen.jpg` are my mock-ups.

**Bogglemire**, `swamp_fight`: `sky: { top: 0x7fb4a4, bottom: 0xdcecc8 }`, `soil: 0x66884f`. The boardwalk back to Stiltwick.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| far | `far.png` | 512 by 378 | 10 | 0.15 | 0 | 1 |
| motes | `motes.png` | 512 by 284 | -20 | 0.3 | 3 | 1 |
| mid | `mid.png` | 512 by 296 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 324 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

**The Frostcrown**, `frost_fight`: `sky: { top: 0x7fb0dc, bottom: 0xe8f2fa }`, `soil: 0xe8f0f6`. The road up, Frostbeard's seat small on the far peak.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| clouds | `clouds.png` | 512 by 162 | -190 | 0.1 | 3 | 1 |
| far | `far.png` | 512 by 350 | 10 | 0.15 | 0 | 1 |
| mid | `mid.png` | 512 by 256 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 174 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

## The Arenas

`arena_east`, in the form of `out/arena`, one 1024 atlas, the same frames and the same rules: draw at 0.6667, `flags` when open, doors when closed. Ids `swamp` and `frost`.

- **`swamp`:** origin (11370, 1170) for `mudarena`. Remove `cypress_b` (11407, 1101), `reeds_a` (11318, 1163), `reeds_b` (11290, 1228).
- **`frost`:** origin (15620, 4320) for `stonering`. Remove `boulder_b` (15614, 4267), `pine_b` (15552, 4333).

The `remove` lists are in `arena_places.json`. Make the two hubs `kind: "arena"` as you did the others.

## The overview

`overview_east.jpg`, 2024 by 1352, about 11 MB in memory, 639 KB on disk. `overview_east.json` gives its world box: x 7400, y 0, 9200 by 6144, at 0.22, the same scale as today's. Today's file stays as it is.

## The fog

`fog_swamp.png` and `fog_frost.png`, in `fog_forest`'s form, each with a `.json` giving its world box. `fog_east_pieces`: `silhouette_murk` at `murkpool`, `silhouette_frostbeard` at `frostseat`, 40 world px lower. `mark_unknown` stays in `out/fog`.

**Known:** a few tree tops and two peaks on the north coast stand past the coast's outline, so they stay bright above the veil. See `preview.jpg`.

## The journal

`journal_faces_east`, frames named by enemy id, 88 px cells as before, used the same way as `journal_faces`. It covers these 12 and `glowcap` and `old-rootbeard`, which had no faces. The two bosses are small in their cells, whole, not cut to the head.

## Not tested

Not in the game or on a phone. I looked by eye at nine places in each region at zoom 0.8 and at the whole of each, not at every spot. The boss scale of 1.1 is unseen. The fight effects have not been checked over these backdrops. Memory assumes your freeing of regions is in; each region adds 8 MB of props, 4 MB of places and about 8 MB of fight strips.

Tools: `tools/world/land_data.js`, `land_build.js`, `bigland_extras.js`, `arena.js east`; `tools/kit/bigland_kit.js`, `bigland_battle.js`; `tools/monsters/bigland.js`.
