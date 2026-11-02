# The hub world, built: the moved world, Crownhaven and the Kingswood

Mitch, AD, 2026-11-02, for Miles, GD. Robin approved the map, the look, the names and your no-dice city ("Looks good", "1. Miles idea is good 2. Yeah 3. Yeah"), and asked: "Remember to not make paths and forests perfectly circular". One delivery, with no mix of old and new positions.

**Not in here:** The Pirate Isles and The Giants' Land. Those wait for Robin's verdict on their stills. Not seen in the game or on a phone, not run through your rules. `hub_preview.jpg` and `hub_phone.jpg` are my mock-ups from these files.

## What to swap in

| File | What |
| --- | --- |
| `world_moved.json` | Your current `world.json`, every position shifted, with the changes below. 17600 by 12700 |
| `chunks.json`, `ground_<col>_<row>.jpg` | **One set for the whole world:** 234 files, 18 columns by 13 rows, about 12 MB on disk. Each square has one file now, so nothing overlaps. Replaces the ground in `world_meadows`, `world_forest`, `world_harvest`, `world_west`, `world_swamp` and `world_frost` |
| `overviews.json`, `overview_middle.jpg`, `overview_west.jpg`, `overview_east.jpg` | See Overviews |
| `placement_<area>.json` | Every area's sprites, shifted. Kingswood's is new |
| `arena_places.json`, `arena_east_places.json` | Arena positions, shifted. Atlases unchanged |
| `rootways.json`, `placement_rootways.json`, `rootways_chunks.json` | The Rootways, shifted, and the door on the map. The chunk files are unchanged but now sit at columns 9 to 11, row 10: **rename `rootways_<c>_8.jpg` to `rootways_<c+5>_10.jpg`,** as `rootways_chunks.json` lists them |
| `secrets.json` | The hidden places, shifted |
| `fog_swamp.json`, `fog_frost.json` | The veils' new boxes. Pictures unchanged |
| `kingswood_places.png`, `.json` | One frame so far, `mob_outcast` |

Also copy `out/creatures_hub/city_outcast`. Atlases in `board_*` and each land's `board_places` are unchanged.

**Region freeing:** the Kingswood and Crownhaven use only the Meadows' always-held atlases, plus `kingswood_places`. The city is baked whole, with no sprites of its own.

## How far each moved

Whole squares, so pixels are kept. Added to every position:

| Area | x | y |
| --- | --- | --- |
| `meadows` | +5120 | +3072 |
| `thornwood`, `frostpeak`, The Rootways inside | +5120 | +2048 |
| `bogglemire` | -7168 | +4096 |
| `frostcrown` | +1024 | +2048 |

The Rootways' door moves with the Meadows.

## Spot ids

**Every existing hub keeps its id, except `shoreend`, which is gone.** `report.json` lists the 50 removed spot ids, in `removedSpotIds`: `summit-shoreend-*`, `shoreend`, `shoreend-mire-board-*`, `murkpool-frost-camp-*`, `gate-edge-*`. A save standing on one needs moving.

**New roads on the world's list (`W.roads`):**

| Road | Area |
| --- | --- |
| `gate` to `kw-se` | `kingswood`: the Meadows' way north |
| `kw-n` to `honeypools` | `frostpeak`, through the new gap in the mountains |
| `kw-e` to `edge` | `thornwood` |
| `kw-w` to `gate-bogsnapper` | `kingswood` |
| `weaver` to `gate-bighorn` | `thornwood` |
| `gate-bogsnapper` to `lanternhollow` | `bogglemire`, baked planks |
| `gate-bighorn` to `frost-camp` | `frostcrown`, baked planks, then baked road |
| `briar` to `pass` | Kept, a second way from Wobblewood to Honeyhill |

## What else changed in the data

- **Your form, your message of 2026-11-02:** `crownhaven` has `city: true`, `W.hub` is `city-square`. `gate` (Thornwood Warden) `opens: 'kingswood'`; `crownhaven`, `thornwood` and `frostpeak` have `openWith: 'kingswood'`; the two gate spots have `kind: 'boss'`, `boss` and `opens`. Bogglemire and The Frostcrown open only at their gates. Big bosses have no `opens`.
- **`W.gates`** repeats the two mini-boss gates for the art, with `hub`, `boss`, `foot` and `opens`: `gate-bogsnapper` (`bogsnapper`, opens `bogglemire`) and `gate-bighorn` (`old-bighorn`, opens `frostcrown`). `gate_barred` and `gate_open` are in those lands' `board_places`. Their strength is yours.
- **Removed:** `W.bridge`, `W.pass`, `W.exit`, and `opens` on every hub. `briar`'s pass is open; if you still draw `pass_barred`, stop.
- **`mob_bogsnapper`, `mob_old_bighorn`** stand at their gates, tagged `hub`. Their old hubs `snapperhole` and `bighornledge` keep ids and names and are plain.
- **Fog:** I left only the two gated lands' veils, since the others are open from the start.
- **`sec-frostpeak-3`, The Scarecrow's Stash, has moved** to a new anchor, `frosthold-icefall-4`, as its shore road has gone. The other 20 are only shifted.

## Crownhaven

- **Area `crownhaven`:** `city: true`, `bakedRoads: true`: don't stroke its roads, the streets are painted. 21 hubs, 20 roads, 45 spots.
- **`role` on each named hub:** `square`, `smith`, `armoury`, `magic`, `potions`, `inn`, `bank`, `quests`, `church`, `coach`, `castle`, `gate`. `kind` and `stock` are my guesses for your shop code; change them freely. The castle is the door to the last dungeon.
- **Kinds:** all road letters are `n`, but you said no fights inside the walls, so treat them as plain.
- **Four pairs sit 63 apart and one 43, under the usual 78:** around the Inn, the Bank and the square's north-east. Plates don't overlap badly, and no one rolls here. Tell me if a tap needs more room.
- **The North Gate stands east of the castle, on the street at x +315.** Straight north it would stand behind the castle and hide the player.

## The Kingswood

- **Area `kingswood`:** `levels: [4, 6]`, `mobs: ['bandit', 'city-outcast']`, theme `meadow`, 18 hubs, 21 roads, 114 spots. Stroke its roads in the Meadows' colours.
- **Camps:** 9 hubs `kw-camp-1` to `9`, with `places` shapes. Their grounds are `kings-road` and `outcast-camps`; give each camp whichever you like.
- **The road round the walls** is uneven and so are the woods: clumps and glades, as Robin asked.
- **New enemy:** `city-outcast`, City Outcast, folder `city_outcast`, scale 0.5, blow frame 4, 145 CSS px, the Knight's skeleton: stand 4, move 6, attack1 6, hit1 2, die1 6. Stats are yours.
- **Fights:** use `meadow_fight`. Say if you want its own backdrop.
- **Sprites:** 374, all near the roads. I have not counted the most in one view here.
- **Near the shore:** five camps were pulled inland, some only a little. Three stay on the coast, The Tin Camp, Mudcart Camp and The Outcasts' Fire, with their ground cut at the shore. No camp piece stands in the water.
- **The Wobblewood's edge** wanders now, with its own trees along the join. They are baked, so they need no forest atlas here. Where the road `kw-e` to `edge` crosses, I left a gap free of trees, and a few faded trees still show there.

## Overviews

| File | World box | Size | Memory |
| --- | --- | --- | --- |
| `overview_middle.jpg` | x 4096, y 0, 8704 by 12288 | 1915 by 2703 | about 21 MB |
| `overview_west.jpg` | x 0, y 4096, 5120 by 5120 | 1126 by 1126 | about 5 MB |
| `overview_east.jpg` | x 12288, y 2048, 5312 by 6144 | 1169 by 1352 | about 6 MB |

All at 0.22. Middle is bigger than today's 13 MB, and I would load the two others only when near or open. Anything outside them is plain sea: `#2878b8` to `#3a9ad4`.

## For later

**The north-west and south-west corners are empty sea,** kept for The Giants' Land and The Pirate Isles. When they are painted, only the files for those squares change.

**Grown lands** are off, as you said; nothing assumes where they start.

## Not tested

Not in the game, not on a phone, not run through your rules. I checked by eye the whole world at small size, the hub at 0.3, four places at phone zoom, all nine camps, and the two joins on the Kingswood's north and east. A test found no Kingswood sprite off the land. I did not check the join of every other land's coast up close, or Bogglemire's and The Frostcrown's gates at phone zoom.

Tool: `tools/world/hub_move.js`. Its header gives the steps.
