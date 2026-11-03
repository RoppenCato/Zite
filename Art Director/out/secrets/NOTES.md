# The hidden places

Mitch, AD, 2026-11-02, for Miles, GD. Robin picked side trails that only show once you stand close, each a short dead end with something at the end. All names, props and places are mine. Not in the game and not on a phone.

`sheet.jpg` shows all 21 as found, each with the Knight on its last spot, from the delivered ground, roads and sprites. It is drawn at zoom 0.62 so the whole trail fits, not at the game's 0.8.

## Files

- `secrets.json`: `{ trail, secrets }`.
- `secrets.png`, `secrets_atlas.json`: one shared atlas, 1024 by 512, 2 MB in memory, 39 KB on disk. 2x, draw at 0.5, each frame's `pivot` is its foot.

## The entries

21 trails, 42 spots: 4 each, and 5 in Wobblewood, since it has the most trees to hide things in. Every anchor is a wild road spot in today's `world.json`.

Each entry is in your form, with one field added: **`propAt`**, the world position of the sprite's foot. It stands about 74 px to the side of the last spot and 26 px behind it, so the player does not hide it. Draw it sorted by its foot.

| Id | Name | Kind | Mob | Prop | Spots |
| --- | --- | --- | --- | --- | --- |
| `sec-meadows-1` | The Hermit's Cache | chest | | `sec_stump` | 3 |
| `sec-meadows-2` | The Leaning Stone | spell | | `sec_stone` | 3 |
| `sec-meadows-3` | The Sprout Den | normal | `wolf` | `sec_den` | 3 |
| `sec-meadows-4` | The Wild Spring | potion | | `sec_spring` | 1 |
| `sec-thornwood-1` | The Hollow Stump | chest | | `sec_stump` | 2 |
| `sec-thornwood-2` | The Fairy Ring | spell | | `sec_ring` | 1 |
| `sec-thornwood-3` | The Tiny Door | gear | | `sec_door` | 1 |
| `sec-thornwood-4` | The Twig Den | normal | `spider` | `sec_den` | 1 |
| `sec-thornwood-5` | The Forgotten Spring | potion | | `sec_spring` | 1 |
| `sec-frostpeak-1` | The Forgotten Hive | normal | `frost-wisp` | `sec_hive` | 3 |
| `sec-frostpeak-2` | The Cider Cellar | potion | | `sec_cellar` | 3 |
| `sec-frostpeak-3` | The Scarecrow's Stash | chest | | `sec_stash` | 2 |
| `sec-frostpeak-4` | The Harvest Altar | spell | | `sec_altar` | 2 |
| `sec-bogglemire-1` | The Sunken Idol | spell | | `sec_idol` | 3 |
| `sec-bogglemire-2` | The Empty Hut | gear | | `sec_ruinhut` | 2 |
| `sec-bogglemire-3` | The Toad King's Lily | normal | `bog-toad` | `sec_lily` | 2 |
| `sec-bogglemire-4` | The Drifting Chest | chest | | `sec_float` | 1 |
| `sec-frostcrown-1` | The Lost Explorer's Tent | chest | | `sec_tent` | 2 |
| `sec-frostcrown-2` | The Ice Cave | normal | `frostling` | `sec_icecave` | 1 |
| `sec-frostcrown-3` | The Lonely Cairn | spell | | `sec_cairn` | 2 |
| `sec-frostcrown-4` | The Warm Vent | potion | | `sec_vent` | 3 |

`sec_glint`, a half-buried chest with a sparkle, is in the atlas unused, if you want it.

## The plate

`spot_secret`, purple rim and a "?", for the trail's end, in this atlas. I would use it for all of them, since the "?" is the point. Spots before the end take the land's `spot_wild`.

## The trail

Colours are in `trail`, one pair per area, each `[colour, width, alpha]` in world px. Stroke `outer` then `inner`, from the anchor through the spots. Straight lines between spots, as in the sheet. It is about a third of a road's width.

| Area | Outer | Inner |
| --- | --- | --- |
| `meadows` | `#8a7a4c`, 8, 0.5 | `#c8b888`, 4, 0.6 |
| `thornwood` | `#3f5e44`, 8, 0.55 | `#8fae88`, 4, 0.6 |
| `frostpeak` | `#94843c`, 8, 0.5 | `#dcc880`, 4, 0.6 |
| `bogglemire` | `#5c4e34`, 8, 0.6 | `#a4905e`, 4, 0.65 |
| `frostcrown` | `#8a8f9c`, 8, 0.42 | `#e4ead8`, 4, 0.5 |

## How they were placed

A search on the delivered ground, then my eye on the sheet.

- **Spots:** no water, no ink or slope at the foot, not under a trunk, at least 96 from any other spot and 66 to 104 from any road, depending on the land.
- **The end:** at least 84 from any road in the Meadows and Wobblewood, 118 elsewhere. Those two lands have trees close to their roads, so their trails are shorter and nearer.
- **Kept away from:** towns, shops, churches, boards, bosses, gates, Arenas and The Rootways' door.
- **Moved:** nothing that exists today.
- **Water:** only Bogglemire's trails may cross a little water, as the land is mostly water. Their spots stand on land.

**Known:**
- `sec-frostpeak-3`'s anchor is on the shore road, `summit-shoreend-4`. It is past `summit` on the way to the shore gate. Miles, GD read the rules: a player can reach it as soon as Honeyhill is open, before Queen Bumble falls. It stays.
- The closest pair in the Meadows is about 500 apart; The Frostcrown's about 460. The others are over 1000.
- `sec-meadows-1` and `sec-meadows-3` leave from the same road, `banditcamp-cairn`.

## Not tested

Not in the game and not on a phone. I looked at each one only in the sheet, not at the game's zoom. Spots are clear of what I could see and of `placement.json`; if your props have changed since, check for overlaps. No enemy here was checked against the level of the land it stands in, beyond being that land's own creature.

Tool: `tools/world/secrets.js`.
