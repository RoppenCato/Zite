# The Pirate Isles, painted

Mitch, AD, 2026-11-02, for Miles, GD. Robin: "Southwest could be pirates", then yes to the map. In Bogglemire's form. All names, places and creatures are mine; stats are yours. **Not seen in the game or on a phone, and not run through your rules.**

## Copy these whole

| Folder | What |
| --- | --- |
| `out/world_pirates` | Layout, placement, `board_places`, chunks, overviews |
| `out/board_pirates` | `board_props`, `board_ground` |
| `out/creatures_pirates` | The six creatures, and Saltjaw's second atlas |
| `out/pirates_fight` | The fight backdrop, table below |
| `out/journal_pirates` | Journal faces |

## Over your world_moved files

Copy over the same names in `assets/world_moved`:

- **The land's squares:** `ground_0_9.jpg` to `ground_3_12.jpg`, 16 files.
- **The pier past x 4096:** `ground_4_7.jpg`, `ground_5_7.jpg`, `ground_4_8.jpg`, `ground_5_8.jpg`, `ground_4_9.jpg`. These are your files with the pier painted on. `chunks.json` lists them in `replacesInWorldMoved`.
- **Overviews:** `overview_southwest.jpg` (same box as the closed look), `overview_middle.jpg`, `overview_west.jpg`, each with the pier on.

The veil, `fog_pirates`, still fits: the coasts have not changed.

## The layout: `pirateisles.json`

| | |
| --- | --- |
| Area, theme | `pirateisles`, `pirates`, tier 6, levels 20 to 24, `bakedRoads: true`: do not stroke its roads or its entry road |
| Hubs, roads, spots | 17, 23, 124 with the entry road |
| Towns | Saltwick (`saltwick`), Rum Cove (`rumcove`) |
| Shops | `ropeandsail` arms, `oldsalts` magic |
| Church, board | `sailorschapel`, `dock-board` |
| Boss, the Seal | `flagship`, `boss: "captain-saltjaw"`, no `opens` |
| Grounds | The Deckyards `deck-hand`, Crab Sands `scuttle-crab`, Parrot Grove `cheeky-parrot`, Buccaneer Fort `buccaneer`, levels 20 to 24 |
| Places | 7, in `places` |

**The way in, under `gate` and `entryRoad` in the json:**
- A new hub for the Kingswood: `gate-redwake`, Redwake's Jetty, at (5230, 7960), `kind: "boss"`, `boss: "first-mate-redwake"`, `opens: "pirateisles"`.
- A new road `kw-sw` to `gate-redwake`, area `kingswood`, stroked like the Kingswood's other roads. I have given no spots or via; lay it as you like.
- `entryRoad`: `gate-redwake` to `dock-board`, baked planks, area `pirateisles`.
- The gate's picture: `gate_barred` or `gate_open` from `world_pirates/board_places`, at the `foot` in the json. `mob_first_mate_redwake` is in the same atlas; I have not placed it at the gate, so please stand it with the hub, as with Bogsnapper.
- A `W.gates` entry with `theme: "pirates"`.

Please check the new road and jetty against the Kingswood's trees. I have not re-placed them around it.

## The creatures

| Id | Folder | Name | Scale | Blow frame | Skeleton |
| --- | --- | --- | --- | --- | --- |
| `deck-hand` | `deck_hand` | Deck Hand | 0.5 | 4 | The Knight's |
| `buccaneer` | `buccaneer` | Buccaneer | 0.5714 | 4 | The Knight's |
| `scuttle-crab` | `scuttle_crab` | Scuttle Crab | 0.6154 | 7 | |
| `cheeky-parrot` | `cheeky_parrot` | Cheeky Parrot | 0.5 | 7 | |
| `first-mate-redwake` | `first_mate_redwake` | First Mate Redwake | 0.8 | 4 | The Knight's |
| `captain-saltjaw` | `captain_saltjaw`, then `captain_saltjaw2` | Captain Saltjaw | 1.3333 | 5 | Second phase: "all guns" |

`report.json` in the folder has the frames and sizes.

## The fight: `pirates_fight`

The fighters on the isles' sandy path, the way running back to the pier and a ship in the bay, on Robin's road-to-the-mill idea. A new `pirates` entry in `BACKDROPS`, about 6.6 MB decoded.

`sky: { top: 0x62b4ec, bottom: 0xfdf2d4 }`, `soil: 0xecd8a0`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| clouds | `clouds.png` | 512 by 170 | -190 | 0.1 | 3 | 1 |
| far | `far.png` | 512 by 216 | 10 | 0.15 | 0 | 1 |
| mid | `mid.png` | 512 by 289 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 256 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

## Not in here

- **No Arena** and **no hidden places** in this land yet. Say if you want them.
- **Sprites:** 280, at most 38 in a view at 0.8.
- **Not checked:** the pier's join to the Kingswood's coast at phone zoom.

Tools: `tools/monsters/bigland.js pirates`, `tools/world/isles_build.js`, `tools/kit/isles_battle.js`, `tools/world/land_faces.js pirates`.
