# The Buried Crown: the last dungeon

Mitch, AD, 2026-11-02, for Miles, GD, on your brief of Robin's design ("you open up the final dungeon somewhere under the hub city"). The story, names, places and creatures are all mine; Robin has not judged them. Stats are yours. **Not seen in the game or on a phone, and not run through your rules.**

**The idea:** Crownhaven was built on top of an older kingdom. Under the castle lie its halls, its dead still on guard, its treasure still counted by the Last Steward. On the throne waits the Hollow King: an empty suit of armour, with a flame where his head was, under the old crown.

**Pictures:** `whole.jpg` is the whole dungeon. `preview.jpg` and `preview2.jpg` are six places at phone size. `door_outside.jpg` is the door, shut and open. `fight/screen.jpg` and `fight/matchups.jpg` are the fight. `out/creatures_crown/preview.jpg` is the creatures. All are my mock-ups from the delivered files.

## Copy these whole

`out/dungeon_crown` and `out/creatures_crown`, and `out/journal_crown` for the journal.

## 1. The door

- **The spot:** `city-castle`, as you planned. Make it the door to `bc-stair`, inside, with the name The Buried Crown.
- **Sprite:** `door_crown_barred` until all seven Seals are won, then `door_crown_open`, from `crown_places`, at `door.x`, `door.y` in `buried_crown.json`, scale 0.5, standing depth. Its seven sockets light together when it opens; lighting them one by one with each Seal would need seven frames, so say if you want that.
- **Plate:** `spot_door` from `crown_places`.

I placed it from the hub's position, not from a look at the city: please check it against the castle's gate.

## 2. The inside

- **Bounds:** x 13312 to 16384, y 8192 to 11264, in `bounds`. Off the map, in the empty sea east of the Wobblewood, on squares of its own. Show only these while inside; past the bounds is `fill`, `#141020`. Clamp the camera to `bounds`, as in The Rootways.
- **Chunks:** `chunks.json` and `crown_<c>_<r>.jpg`, 9 files, columns 13 to 15, rows 8 to 10. They share grid squares with the world's sea chunks, as The Rootways do, so they need their own keys.
- **Roads:** stroke them as usual, with `roadColours` from `buried_crown.json`. The carpet to the throne is painted under its road.
- **Placement:** `placement.json`, sprites from `crown_places`, drawn at 0.5, sorted by y. `mob_hollow_king` and `mob_last_steward` carry their hubs; hide each when beaten, if you like.
- **Plates:** the rest use `board_meadows/board_props`.

## 3. The layout: `buried_crown.json`

`area` is in the form of `world.json`: id `buried-crown`, theme `crown`, tier 8, levels 28 to 30, 11 hubs, 16 roads, 75 spots, none under 78 apart.

| Hub | Kind | Name |
| --- | --- | --- |
| `bc-stair` | `door` | The Long Stair, the way out |
| `bc-hall` | `normal` | The Hall of Kings |
| `bc-well` | `potion` | The Silver Well |
| `bc-peddler` | `shop`, `stock: "magic"` | The Ghost Peddler |
| `bc-vault` | `chest` | The Sealed Vault |
| `bc-crypts` | `normal` | The Long Crypts |
| `bc-gallery` | `normal` | The Gargoyle Gallery |
| `bc-chapel` | `church` | The Drowned Chapel |
| `bc-treasury` | `normal` | The Old Treasury |
| `bc-steward` | `boss`, `boss: "last-steward"` | The Steward's Door |
| `bc-throne` | `boss`, `boss: "hollow-king"` | The Hollow Throne |

- **The only way to the throne is through `bc-steward`,** by the carpet. Two roads reach him, from the treasury and the gallery. Please add `area.dungeon` or whatever your rules need, as for The Rootways.
- **Grounds:** `hall-of-kings` `crypt-guard`, `long-crypts` `gilded-wraith`, `gargoyle-gallery` `stone-gargoyle`, `old-treasury` `gold-mimic`.
- **A shop and a church** so a long last walk has a rest in it (mine). Drop them if you want it harder.

## 4. The creatures: `out/creatures_crown`

| Id | Folder | Name | Scale | Blow frame | Skeleton |
| --- | --- | --- | --- | --- | --- |
| `crypt-guard` | `crypt_guard` | Crypt Guard | 0.6667 | 4 | The Knight's |
| `gilded-wraith` | `gilded_wraith` | Gilded Wraith | 0.5714 | 7 | |
| `stone-gargoyle` | `stone_gargoyle` | Stone Gargoyle | 0.7273 | 7 | |
| `gold-mimic` | `gold_mimic` | Gold Mimic | 0.6154 | 7 | |
| `last-steward` | `last_steward` | The Last Steward | 0.8 | 4 | The Knight's |
| `hollow-king` | `hollow_king`, then `hollow_king2` | The Hollow King | 1.6 | 5 | Second phase: "the crown burns", from blue flame to gold |

The Hollow King is 450 tall against the Yeti King's 420, and broader. To fit his atlases he is drawn at 0.625, so he is softer than the others; on a phone it should not show, but check.

## 5. The fight: `fight/`

The fighters on the old kingdom's carpet, the way running back between pillars to the empty throne, on Robin's road-to-the-mill idea. A new `crown` entry in `BACKDROPS`, about 8 MB decoded, the largest. The throne stands empty behind the Hollow King too, which I like.

`sky: { top: 0x141020, bottom: 0x2a2440 }`, `soil: 0x5c5670`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| far | `far.png` | 512 by 352 | 10 | 0.15 | 0 | 1 |
| motes | `motes.png` | 512 by 285 | -20 | 0.3 | 3 | 1 |
| mid | `mid.png` | 512 by 283 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 385 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

Tools: `tools/monsters/bigland.js crown`, `tools/world/crown_build.js`, `tools/kit/crown_kit.js`, `tools/kit/crown_battle.js`, `tools/world/land_faces.js crown`.
