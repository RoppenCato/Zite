# Cloverfield Meadows in the real world

Mitch, AD, 2026-11-02. Robin: "yes keep the look, go with about 400 spots"; "yes build it, start with one creature per place". Copy the whole folder. It needs `out/board_meadows` too: `placement.json` uses both `board_props` and the new `board_places`. The numbers below are in `check.json`, except the spot counts by place, which come from `spots` in `meadows.json`.

## What is here

| File | What it is |
| --- | --- |
| `meadows.json` | `area` is in the form of `world.json`, with `via` on every road. Also `places` (shapes), `bridge` and `spots` (every spot and the place it stands in) |
| `chunks.json`, `ground_<col>_<row>.jpg` | The baked ground, 16 chunks |
| `overview.json`, `overview.jpg` | The whole world for the zoomed-out view |
| `placement.json` | The sprites: `{ name, x, y, hub? }`, drawn at 0.5 with no scale |
| `board_places.png`, `.json` | The new pieces, 2x, pivot at the foot, 1024 by 1024 |
| `check.json` | The checks |
| `preview.jpg`, `preview2.jpg`, `phone_*.jpg` | Pictures drawn only from these files, by the studio's tool. Not screenshots |

## The layout

- **17 hubs and 20 roads.** The 11 old hub ids are kept. New: `sproutfield`, `banditcamp`, `reedbank`, `farrows`, `lookout`, `beehives`.
- **87 spots, not "near 60".** At 138 world px apart, this is what the land holds without bare stretches. If you want fewer, tell me the number and I will space them wider. It is one number in the data.
- **Checks:** no two spots closer than 78, no roads crossing, no spot inside another ground's shape.
- **Kinds:** 2 towns, board, arms shop, magic shop, church, gate, 4 potions, 2 chests, 2 shrines, 3 gear, 69 wild.
- **Grounds:** four, one mob each, with `levels`: `jelly-shallows` (slime, 1-2), `sprout-patch` (wolf, 2-3), `bandit-thicket` (bandit, 3-4), `buzzing-orchard` (wisp, 3-4). Hubs moved: `sprout-patch` to `sproutfield`, `bandit-thicket` to `banditcamp`.
- **Duck Marsh** is not a ground of its own: it is part of The Jelly Shallows, around the Duck Pond, so no new creature is owed (mine). `wolf-alpha` still roams, with no ground of its own.

## The nearest-hub problem: your call

`groundAt` takes the nearest ground hub. On this map, of 87 spots:

| Where the spot stands | Spots |
| --- | --- |
| In a hunting ground's shape | 26 |
| In a town's shape (Puddlewick 7, Old Mill 6) | 13, of which 11 are wild |
| In no shape, on the open road | 48 |

So a wild spot on the open road, or inside a town wall, still fights the nearest ground's creature. That sits badly with Robin's "creatures only in their own place".

**What I would try (mine):** a wild spot inside a town's shape fights nothing, and open-road spots keep the nearest ground until Robin has played it. `places[].shape` in `meadows.json` and `spots[].place` give you what you need. Rules are yours, so I changed none.

## The ground

- **Grid:** global, 1024 world px a chunk, 1 file px to 1 world px. Columns 0 to 3, rows 5 to 8, so x 0 to 4096, y 5120 to 9216. World size for the overview's scale is 7400 by 9300. Clamp the camera to the chunks while only the Meadows exist.
- **The gutter differs from what we agreed:** each file is **1026 px**, with 1 px extra on every side. Without it the seams show under the zoom. Place each image at its `x`, `y` from `chunks.json` (which already include the 1 px) with its origin at the top left, at full size. Draw order among chunks does not matter.
- **Zoomed far out:** the 1 px gutter hides the seams at 0.8, but faint lines show at 0.145 (`phone_region.jpg`). Use `overview.jpg` at that zoom. I have not found the zoom where the seams begin.
- **Size:** about 1.1 MB on disk for all 16. Each decodes to about 4 MB, so load only those near the camera. I have not measured this on a phone.
- **Baked into the ground:** land, sea, the places' ground, every piece more than 170 px from a road, and the forest beyond the bridge, which stands in until Wobblewood is painted.

## Roads and sprites

- **Roads** stay yours: stroke `[from, ...via, to]` as a polyline with round joins, three lines as before. There are nine `via` points to a road, so it reads as a curve. Do not smooth it: the rules' `pointsAlong` runs on the polyline, so a smoothed road pulls away from its spots.
- **Sprites:** 317 in all. The most in one phone view is 57 at zoom 0.8 and 77 at 0.6, well under your 150. Sort by foot y with the token. A `hub` on an entry says what it belongs to.
- **Hub pieces:** `merchant_cart` at `tinker`, `coach_stop` at each town, `apothecary` and `windmill` at `windy`, `quest_board` at `crossroads`, `church` at `ravine`, `cave` and `chest` at `cairn`, `spring` at `hermit`, `shrine` at `moon`, `pond` at `saltmarsh`. The hill under the windmill is baked into the ground.
- **Arches:** `arch_marsh`, `arch_patch`, `arch_camp` and `arch_orchard` stand on the road where it enters a ground. The token walks through them, sorted by foot.
- **Creatures on the map:** `mob_slime`, `mob_sprout`, `mob_bandit`, `mob_bee` are still, small pieces so a place shows who lives there without loading a fight atlas. Remove them from the list if you want your own.

## King Goo's bridge

`bridge` in `meadows.json` has `hub: 'gate'`, the deck's two ends `from` and `to`, and `foot`, where the gate stands.

- The stone deck is baked into the ground.
- Stroke the road from `gate` to `from`, then **no stroke on the deck**.
- Draw `bridge_goo_barred` at `foot` until the boss falls, then `bridge_goo_open`. Sort it by foot with the token.

## The overview

`overview.jpg` is 1628 by 2046 at 0.22 file px per world px, about 670 KB, with no words on it, so labels stay one size on screen. The Meadows are the real thing. **Wobblewood and Honeyhill in it are still the concept**, with its proposed places and roads: they get replaced as each is painted, so do not place today's forest or honey hubs on it as if they matched.

## Not tested

Not seen in the game or on a phone. Nothing here has been run through your rules or tests: the spots agree with `pointsAlong` only because I copied its formula. No sound or movement yet: the windmill's sails stand still. The token in the pictures is a stand-in still.
