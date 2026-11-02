# The Giants' Land, painted

Mitch, AD, 2026-11-02, for Miles, GD. Robin: "a snowy zone with mountains. And giants like yetis and snowmonsters", then yes to the map. In the form of The Pirate Isles: read `out/world_pirates/NOTES.md` for what it does not repeat here. All names, places and creatures are mine; stats are yours. **Not seen in the game or on a phone, and not run through your rules.**

## Copy these whole

`out/world_giants`, `out/board_giants`, `out/creatures_giants`, `out/giants_fight`, `out/journal_giants`.

## Over your world_moved files

- **The land's squares:** `ground_0_0.jpg` to `ground_3_3.jpg`, 16 files.
- **The pier past x 4096:** `ground_4_3.jpg`, `ground_4_4.jpg`, `ground_5_4.jpg`, `ground_4_5.jpg`, `ground_5_5.jpg`.
- **Overviews:** `overview_northwest.jpg`, and `overview_middle.jpg` and `overview_west.jpg`. **These two carry both piers, so they replace the copies from `world_pirates`.** Copy them last.

The veil, `fog_giants`, still fits.

## The layout: `giantsland.json`

| | |
| --- | --- |
| Area, theme | `giantsland`, `giants`, tier 7, levels 24 to 28, `bakedRoads: true`: do not stroke its roads or its entry road |
| Hubs, roads, spots | 15, 22, 129 with the entry road |
| Towns | Hearthhold (`hearthhold`), Lasthearth (`lasthearth`) |
| Shops | `bonesmith` arms, `snowwitch` magic |
| Church, board | `snowchapel`, `frost-board` |
| Boss, the Seal | `yeticrown`, `boss: "yeti-king"`, no `opens` |
| Grounds | The Yeti Dens `young-yeti`, The Great Snowfield `snow-monster`, The Icicle Caves `icicle-bat`, Ogre Ledge `frost-ogre`, levels 24 to 28 |
| Places | 7, in `places` |

**The way in, under `gate` and `entryRoad`:** a new Kingswood hub `gate-snowshoulder`, Snowshoulder's Jetty, at (5300, 5560), `kind: "boss"`, `boss: "old-snowshoulder"`, `opens: "giantsland"`; a new road `kw-nw` to `gate-snowshoulder`, stroked; `entryRoad` from `gate-snowshoulder` to `frost-board`, baked planks. Draw `gate_barred` or `gate_open` from `world_giants/board_places` at `foot`. `mob_old_snowshoulder` is in the same atlas; stand it with the hub.

One pair of road spots sits 69 apart beside the boss, on the two roads into `yeticrown`. Everything else is 78 or more.

## The creatures

| Id | Folder | Name | Scale | Blow frame | Skeleton |
| --- | --- | --- | --- | --- | --- |
| `young-yeti` | `young_yeti` | Young Yeti | 0.6667 | 7 | |
| `snow-monster` | `snow_monster` | Snow Monster | 0.6667 | 7 | |
| `frost-ogre` | `frost_ogre` | Frost Ogre | 0.6667 | 4 | The Knight's |
| `icicle-bat` | `icicle_bat` | Icicle Bat | 0.5 | 7 | |
| `old-snowshoulder` | `old_snowshoulder` | Old Snowshoulder | 1 | 7 | |
| `yeti-king` | `yeti_king`, then `yeti_king2` | The Yeti King | 1.3333 | 5 | Second phase: "the storm comes" |

## The fight: `giants_fight`

The fighters on the snow road, the way running back between ice spires to the Yeti King's seat, under great peaks, on Robin's road-to-the-mill idea. A new `giants` entry in `BACKDROPS`, about 6.3 MB decoded.

`sky: { top: 0x6fa4dc, bottom: 0xeaf2fa }`, `soil: 0xe8f0f6`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| clouds | `clouds.png` | 512 by 168 | -190 | 0.1 | 3 | 1 |
| far | `far.png` | 512 by 369 | 10 | 0.15 | 0 | 1 |
| mid | `mid.png` | 512 by 259 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 217 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

## Not in here

- **No Arena** and **no hidden places** yet, as with the Isles.
- **Sprites:** 249, at most 33 in a view at 0.8. **Ground:** 16 land squares, about 1.6 MB on disk.
- **Not checked:** the pier's join to the Kingswood's coast at phone zoom.

Tools: `tools/monsters/bigland.js giants`, `tools/world/giants_build.js`, `tools/kit/giants_battle.js`, `tools/world/land_faces.js giants`. Note that `giants_build.js` takes the two overviews from `out/world_pirates`.
