# The Pirate Isles, painted

Mitch, AD, 2026-11-02, for Miles, GD. Robin: "Southwest could be pirates", then yes to the map. In Bogglemire's form. All names, places and creatures are mine; stats are yours. **Not seen in the game or on a phone by me.** Rebuilt the same day to keep the Arena's and the hidden trails' ground clear: see `out/places_far/NOTES.md`.

## Copy these whole

| Folder | What |
| --- | --- |
| `out/world_pirates` | Layout, placement, `board_places`, chunks, overviews |
| `out/board_pirates` | `board_props`, `board_ground` |
| `out/creatures_pirates` | The six creatures, and Saltjaw's second atlas |
| `out/pirates_fight` | The fight backdrop, table below |
| `out/journal_pirates` | Journal faces |

## Over your world_moved files

- **The land's squares:** `ground_0_9.jpg` to `ground_3_12.jpg`, 16 files.
- **The pier past x 4096:** `ground_4_7.jpg`, `ground_5_7.jpg`, `ground_4_8.jpg`, `ground_5_8.jpg`, `ground_4_9.jpg`. These are your files with the pier painted on. `chunks.json` lists them in `replacesInWorldMoved`.
- **Overviews:** `overview_southwest.jpg`. Take `overview_middle.jpg` and `overview_west.jpg` from `out/world_giants`, which carry both piers.

The veil, `fog_pirates`, still fits.

## The layout: `pirateisles.json`

| | |
| --- | --- |
| Area, theme | `pirateisles`, `pirates`, tier 6, levels 20 to 24, `bakedRoads: true`: do not stroke its roads or its entry road |
| Hubs, roads, spots | 18, 24, 127 with the entry road |
| Towns | Saltwick (`saltwick`), Rum Cove (`rumcove`) |
| Shops | `ropeandsail` arms, `oldsalts` magic |
| Church, board | `sailorschapel`, `dock-board` |
| Boss, the Seal | `flagship`, `boss: "captain-saltjaw"`, no `opens` |
| Arena | `cutlassring` |
| Grounds | The Deckyards `deck-hand`, Crab Sands `scuttle-crab`, Parrot Grove `cheeky-parrot`, Buccaneer Fort `buccaneer`, levels 20 to 24 |

**The way in, under `gate` and `entryRoad`:** a new Kingswood hub `gate-redwake`, Redwake's Jetty, at (5230, 7960), `kind: "boss"`, `boss: "first-mate-redwake"`, `opens: "pirateisles"`; a road `kw-sw` to `gate-redwake`, stroked; `entryRoad` from `gate-redwake` to `dock-board`, baked planks. Draw `gate_barred` or `gate_open` from `board_places` at `foot`. `mob_first_mate_redwake` is in the same atlas; stand it with the hub.

## The creatures

| Id | Folder | Name | Scale | Blow frame | Skeleton |
| --- | --- | --- | --- | --- | --- |
| `deck-hand` | `deck_hand` | Deck Hand | 0.5 | 4 | The Knight's |
| `buccaneer` | `buccaneer` | Buccaneer | 0.5714 | 4 | The Knight's |
| `scuttle-crab` | `scuttle_crab` | Scuttle Crab | 0.6154 | 7 | |
| `cheeky-parrot` | `cheeky_parrot` | Cheeky Parrot | 0.5 | 7 | |
| `first-mate-redwake` | `first_mate_redwake` | First Mate Redwake | 0.8 | 4 | The Knight's |
| `captain-saltjaw` | `captain_saltjaw`, then `captain_saltjaw2` | Captain Saltjaw | 1.3333 | 5 | Second phase: "all guns" |

## The fight: `pirates_fight`

A new `pirates` entry in `BACKDROPS`, about 6.6 MB decoded. `sky: { top: 0x62b4ec, bottom: 0xfdf2d4 }`, `soil: 0xecd8a0`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| clouds | `clouds.png` | 512 by 170 | -190 | 0.1 | 3 | 1 |
| far | `far.png` | 512 by 216 | 10 | 0.15 | 0 | 1 |
| mid | `mid.png` | 512 by 289 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 256 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

**Sprites:** 277, at most 38 in a view at 0.8.

Tools: `tools/monsters/bigland.js pirates`, `tools/world/isles_build.js`, `tools/kit/isles_battle.js`, `tools/world/land_faces.js pirates`.
