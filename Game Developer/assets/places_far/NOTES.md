# Arenas and hidden places for The Pirate Isles and The Giants' Land

Mitch, AD, 2026-11-02, for Miles, GD, as you asked. All names, props and places are mine. **Not seen in the game or on a phone.** I checked each in `sheet.jpg` and `arena/open.jpg`, my mock-ups from the delivered files.

## First: both lands have changed, so recopy them

To keep the ground clear for these, I rebuilt both lands, and the Arena hubs need new roads. **Recopy from `out/world_pirates` and `out/world_giants`, as their NOTES say:** all land chunks, `placement.json`, `pirateisles.json`, `giantsland.json`, and the overviews (the middle and west from `world_giants`, last). **`board_props` is unchanged in look; recopy `out/board_pirates` and `out/board_giants` too, since they were re-packed.**

- **What moved:** trees, rocks and other sprites away from these places. No hub moved and no existing spot id changed.
- **What is new in the layouts:** hub `cutlassring`, The Cutlass Ring, and a road `crabsands` to `cutlassring`; hub `icering`, The Ice Ring, and a road `yetidens` to `icering`. Spots are now 127 and 132 with the entry roads.
- **Your edits:** if you changed either json by hand, keep those. The gate name is right in both now.

## The Arenas: `arena/`

The same form as `arena_east`: `arena.png`, `arena.json`, and `arena_places.json` with both buildings, each with `spot`, `x`, `y`, frames, `flags`, `centre` and `footY`. Draw at `scale`, as with the others.

| Land | `arena.json` spot | Building |
| --- | --- | --- |
| `pirateisles` | `cutlassring` | Ship's timbers and rope, black flags with a white stripe |
| `giantsland` | `icering` | Blocks of ice, pale blue flags |

`remove` is empty for both, as the ground was kept clear.

## The hidden places

`far_secrets.json` in the form of `secrets.json`, `{ trail, secrets }`, for you to add to it. Six trails, three a land. `far_secrets.png` and `far_secrets_atlas.json` hold the props, 2x, draw at 0.5, pivot at the foot. The trail's end uses your `spot_secret`; the spots before it use the land's `spot_wild`.

| Id | Land | End | Kind | Anchor | Prop |
| --- | --- | --- | --- | --- | --- |
| `sec-pirateisles-1` | The Pirate Isles | The Buried Chest | chest | `dock-board-ropeandsail-1` | `sec_x_marks` |
| `sec-pirateisles-2` | The Pirate Isles | The Lost Rum | potion | `crabsands-cutlassring-2` | `sec_rum_boat` |
| `sec-pirateisles-3` | The Pirate Isles | The Old Idol | spell | `southpier-parrotgrove-1` | `sec_idol` |
| `sec-giantsland-1` | The Giants' Land | The Frozen Chest | chest | `frost-board-hearthhold-1` | `sec_ice_chest` |
| `sec-giantsland-2` | The Giants' Land | The Warm Pool | potion | `frozenmine-snowwitch-1` | `sec_warm_pool` |
| `sec-giantsland-3` | The Giants' Land | The Old Giant | spell | `yetidens-giantcairn-2` | `sec_giant_bones` |

Each trail has 3 spots, 124 apart, on land and clear of roads, spots and places. **Please check:** your rule on anchors, as each anchor is a wild road spot in the new layouts; and spot counts on roads, since I read them from the rebuilt files.

`trail` holds the two lands' colours, stroked as in the others.

Tools: `tools/world/arena.js far`, `tools/world/places_far.js`; the builders keep the ground clear.
