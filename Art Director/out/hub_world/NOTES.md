# The hub world: the proposal

**Approved by Robin, 2026-11-02, and built:** see `out/world_moved/NOTES.md`.

Mitch, AD, 2026-11-02, for Robin to judge, through Miles, GD. Nothing here is painted or in the game. Robin's design is in the brief, under "The hub world". The map, the name and the look of the city are my proposals until he says.

`map.jpg` is the whole world, drawn from the real lands, with the new land and the roads laid on it. `city_square.jpg` is the phone at zoom 0.8 with the game's real bars, cropped from an earlier screenshot. `city_whole.jpg` is the city in its woods at map zoom.

## Second version (2026-11-02)

Robin: "Can we have new zones up northwest and southwest too? Southwest could be pirates and northwest giants." "I think the city should be big and walkable, with stores, blacksmith etc." "the forest around the city should look kinda like meadows, and be around lvl 5. You should be able to walk around it and enter the city from all sides. The mobs should be bandits and city outcasts, with camps a little everywhere."

The pictures are redrawn for this. `city_plan.jpg` names the city's places, `city_smith.jpg` is the phone on the shop street, and `kingswood.jpg` is the phone at a camp.

## The map

| Order | Land | Levels | From the hub | Entrance |
| --- | --- | --- | --- | --- |
| 1 | Cloverfield Meadows | 1 to 4 | South | The start. Its first boss opens the road straight north |
| 2 | The Kingswood, round the city | about 5 | All round | Open. New |
| 3 | Wobblewood | 4 to 8 | East | Open |
| 4 | Honeyhill | 8 to 12 | North | Open, through a new gap in the mountains |
| 5 | Bogglemire | 12 to 16 | West | **Gated** |
| 6 | The Frostcrown | 16 to 20 | Far east, through Wobblewood | **Gated** |
| 7 | The Pirate Isles | 20 to 24 | South-west | **Gated.** New |
| 8 | The Giants' Land | 24 to 28 | North-west | **Gated.** New |

**The levels of the two new lands, and all the names here, are mine.** Robin named pirates and giants and where they go. Robin, later the same day, on the giants: "a snowy zone with mountains. And giants like yetis and snowmonsters". The Frostcrown is also snow at its top, so The Giants' Land is snow from shore to shore, with far bigger peaks, ice and yetis.

**The way through (mine):** east, north, back across to the west, far out east, then the two corners. Not a line and not a ring.

## How big the world becomes

**About 17600 by 12700.** Today it is 16600 by 9300. The new height is what fits three lands on the west side.

All lands shift so the west and north have room: x by whole columns, y by whole rows.

| Land | Moves by, from today | New box, about |
| --- | --- | --- |
| Wobblewood, Honeyhill | x +5120, y +2048 | as today, shifted |
| Cloverfield Meadows | x +5120, y +3072 (one row further south, for the Kingswood) | x 5420 to 8520, y 8370 to 11770 |
| Crownhaven and the Kingswood | new | x 4800 to 8760, y 5300 to 8300 |
| Bogglemire | x -7168, y +4096 | x 732 to 4532, y 4246 to 8696 |
| The Frostcrown | x +1024, y +2048 | x 13224 to 17074, y 2248 to 7598 |
| The Giants' Land | new | x 1700 to 5500, y 200 to 3600 |
| The Pirate Isles | new | x 1900 to 5600, y 9000 to 12400 |

## What it costs

| What | Cost |
| --- | --- |
| Meadows, Wobblewood, Honeyhill: about 70 chunks | **Kept.** Renamed by whole columns and rows, pixels unchanged, apart from the rows below |
| Crownhaven and the Kingswood, and where they join their neighbours | **New: about 16 chunks**, the city's pieces, the Kingswood's places |
| The gap in Honeyhill's mountains for the north road | **Repaint 2 or 3 chunks** |
| Bogglemire, The Frostcrown | **Rerun my tool** at their new places. No hand work |
| The Pirate Isles, The Giants' Land | **Two whole new lands:** each a kit, ground, creatures, boss, fight backdrop and Arena, as Bogglemire was. One still of each comes first |
| The City Outcast | **One new creature.** The Bandit exists already. The hooded figure in `kingswood.jpg` is a stand-in |
| Arenas, The Rootways, the hidden places | **Kept.** Their numbers shift |
| Fog, overview | **Redo by tool** |
| Honeyhill's shore gate and road, the Meadows' bridge | **Gone** |

No drawing already approved is lost.

## The Kingswood (name mine)

Robin: "kinda like meadows", around level 5, bandits and city outcasts, "camps a little everywhere". It is the Meadows' trees and grass, open and walkable, with a road round the walls, four roads in to the city's four gates, and about ten camps of tents, stakes and a fire. Its ground uses the Meadows' pieces, so it adds little.

## The city: Crownhaven (name mine)

- **Named places:** Master Smith and Armoury on the shop street with the Magic Shop and Potions, the Inn and the Bank on the avenue, the Quest Hall, the Cathedral, the Coach, the Great Square. The Castle at the north end, with the last dungeon beneath it.
- **Walkable (mine):** a house hides what lies up to about 165 px behind its foot, so a house in front of a street would hide the player. Houses stand only where they hide no street. Two wide avenues, the shop street and four long north-south streets stay clear; the rest is packed rows.
- **Walk:** gate to gate about 10 to 15 spots.
- **Budget:** still planned as one land's: 8 MB props, 4 MB places, and the chunks in view. Worked out, not measured, and not counted for sprites.

**Open question:** whether "walkable" means rolling the die as everywhere else, or walking freely inside the walls. Miles, GD recommends to Robin no die and no fights inside the walls, tapping a spot to go there. Robin decides. The art is the same either way.

**For the build (Miles, GD):** spots along the clear streets only, with each shop, the smith and the rest as a named spot at its door. Grown lands stay off for now, so nothing is planned around where they start.

## Agreed with Miles, GD, if Robin says yes (2026-11-02)

- **Shift:** by whole columns and rows, never negative x. First agreed as 5120 east; the second version above adds the rows.
- **Spot ids** stay exactly as they are. Any I rename or remove, I tell him.
- **One delivery:** moved layouts, `secrets.json`, Arena and door positions and chunks arrive together, never a mix of old and new.
- **Dropped:** the Meadows' bridge and Honeyhill's shore road.
- **Guards:** Bogsnapper and Old Bighorn stand at their entrances as real gate spots; he sets their strength. Wobblewood's way to The Frostcrown stays closed until Old Bighorn falls, Bogglemire's until Bogsnapper does.
- **Their old places (mine):** `snapperhole` and `bighornledge` keep their ids and names and become plain wild spots with no mini-boss. The `mob_bogsnapper` and `mob_old_bighorn` pieces move to the gates.

## Not tested

Not in the game, not on a phone. The map's roads are drawn by hand to show the idea, not laid out. All sizes and costs are worked out, not measured.

Tool: `tools/world/hub_stills.js`.
