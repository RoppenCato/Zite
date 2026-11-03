# The Kingswood: Hollybrook, its store, the Outlaw King, and creatures of its own

Mitch, AD, 2026-11-03, for Miles, GD. Robin chose "fill the holes"; Miles, GD asked for "a small village with a shop drawn into its board, two or three creatures of its own and a boss (it gets a Seal)". Names, places and designs are mine. None of it is seen in the game. `creatures.jpg` shows the creatures.

## 1. The village and the hall: `hubs.json`, `placement_kingswood.json`, `kingswood_village.png/.json`

`preview.jpg` shows both places at phone zoom on the real ground. The roads are drawn in the Meadows' colours, and Snowshoulder's Jetty and its gate are in the picture.

- **Hollybrook** is a little village of six cottages, a well, fences, barrels and flowers. It sits **on the road to Snowshoulder's Jetty**, the last village before the Giants' Land. I moved it there on 2026-11-03: Miles, GD found my first place on the jetty road, which the Giants' Land drop had laid and my first preview did not show.
- **Hollybrook Store** is a timber shop with a green-striped awning and a sign with crossed swords, on its own short lane north-east of the village.
- **The Outlaw King's Hall** is in the woods north-east of the walls, off Old Toll Oak (`kw-ne`). It is a long timber hall inside a ring of stakes, with antlers on the gable, green banners with a gold crown, torches and a campfire.

**`hubs.json`** holds three hubs for the area `kingswood`, in world px:

| Hub | Kind | Name | At |
| --- | --- | --- | --- |
| `kw-village` | `town` | Hollybrook | 5560, 5790 |
| `kw-store` | `shop` | Hollybrook Store | 5700, 5690 |
| `gate-outlaw` | `boss`, `boss: "outlaw-king"` | The Outlaw King's Hall | 7900, 5560 |

**The jetty road changes.** `removeRoads` lists `kw-nw` to `gate-snowshoulder` (four spots, straight). In its place:

- `kw-nw` to `kw-village`: one spot, straight.
- `kw-village` to `gate-snowshoulder`: one spot, straight. The jetty and its gate art stay where they are.

The other roads are:

- `kw-village` to `kw-store`: no spot, 172 px.
- `kw-ne` to `gate-outlaw`: three spots, with `via` points.

Every spot, with the halfway spots, is at least 156 px from the next. What the store sells and the Seal are yours.

**`placement_kingswood.json`** is the whole of the Kingswood's placement, with the new pieces added:

- 371 of the 374 old pieces are kept; the three that stood in the way are gone.
- Nothing old sits on the new roads, and nothing new stands on a road, a spot or the jetty's gate.
- 22 new pieces: mostly the Meadows' always-held props (`house_thatch`, `house_tile`, `house_loft`, `well`, `fence`, `barrel`, `sack`, `worn`, `flowers_*`), plus `campfire` and `stake` from `world_meadows`.
- Three frames from the new atlas `kingswood_village`: `kw_store`, `kw_hall` and `mob_outlaw_king`. The boss on the map stands by his hall; hide it when he is beaten, as with Old Rootbeard. `hubs.json` carries `sprites.mob_outlaw_king.hub`.

The hall's pieces are the same as in the first drop. `kingswood_village` is 512 by 512; load it with the Kingswood.

## 2. The creatures: `out/creatures_kingswood`

One folder each, in the usual form: files face left, pivot at the feet, and `preview.jpg` there shows every clip.

| Id | Name | Folder | Scale | Blow | Tall | Body |
| --- | --- | --- | --- | --- | --- | --- |
| `poacher` | Poacher | `poacher` | 0.5333 | 4 | 145 | the Knight's skeleton: a green hood with a red feather, a crossbow |
| `hedge-knight` | Hedge Knight | `hedge_knight` | 0.5714 | 4 | 155 | the Knight's skeleton: a dented helm with a sprig of leaves, a green tabard with an acorn, a long sword |
| `tusker` | Wild Tusker | `tusker` | 0.6667 | 7 | 125 | a bristly wild boar with tusks, on the goats' four legs |
| `outlaw-king` | The Outlaw King | `outlaw_king` | 1.6 | 4 | 290 | the Knight's skeleton at twice the size: an antler crown, a red beard, a leaf-green cloak, a thorned sword |
| `outlaw-king, second phase` | The Outlaw King, cloak cast off | `outlaw_king2` | 1.6 | 4 | 290 | the same, the cloak gone, a red tunic, gold eyes and a gold blade |

- **The Poacher and the Hedge Knight** are kin of the bandit and the Isles' crew.
- **The Wild Tusker** is new, drawn on the goats' four-legged body.
- **The Outlaw King** is a person, like the Isles' First Mate, so his clips are the Knight's (stand 4, move 6, attack1 6, hit1 2, die1 6), not a big boss's.
- **Stats, grounds, levels and drops are yours.** My suggestion:
  - Poachers and Tuskers in the woods.
  - Hedge Knights near the King's Road.
  - The bandit and the City Outcast keep their camps.
- **Fights** still use `meadow_fight`; say if the Kingswood wants its own.

Tools:

- `tools/world/kingswood_village.js` (the village, the hall, the hubs and the placement)
- `tools/monsters/bigland.js kingswood` (the creatures)
