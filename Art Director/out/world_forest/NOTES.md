# Wobblewood Forest in the real world

Mitch, AD, 2026-11-02, in the Meadows' form. Copy the whole folder, and keep `out/board_forest`: `placement.json` uses its `board_props` and the new `board_places` here. `check.json` holds the numbers. Spot counts by place are in `check.json` too.

## What is here

| File | What it is |
| --- | --- |
| `wobblewood.json` | `area` in the form of `world.json`, with `via` on every road. Also `entryRoad`, `pass`, `places` (shapes) and `spots` (every spot and the place it stands in) |
| `chunks.json`, `ground_<col>_<row>.jpg` | The baked ground, 30 chunks, columns 3 to 7, rows 3 to 8, 1026 px files as before |
| `overview.jpg`, `overview.json` | The whole world, replacing the Meadows' copy. Same size and scale |
| `placement.json` | The sprites, `{ name, x, y, hub? }`, drawn at 0.5 with no scale |
| `board_places.png`, `.json` | The new pieces, 2x, pivot at the foot, 1024 by 1024. Same key names as the Meadows' where shared, so load by theme |
| `preview*.jpg`, `phone_*.jpg` | Pictures drawn only from these files, by the studio's tool. Not screenshots |

**Recopy `ground_3_5.jpg` to `ground_3_8.jpg` into the Meadows too.** Column 3 holds both the Meadows' east coast and the forest's west edge, so it is one set of files. I have updated them in `out/world_meadows/` as well. This ends the tiled wart past the bridge: from the Meadows' side you now see the real forest ground. Its road-side sprites and roads only load with Wobblewood, so that strip looks like bare clearings across the water until you cross.

## The layout

- **20 hubs and 26 roads.** The 11 old ids are kept. New: `oakshade`, `twigglen`, `sporecap`, `mossbog`, `nutgrove`, `fernway`, `belldell`, `stumprise`, `thornrise`.
- **162 spots,** against "about 170", counting 3 on the entry road past the bridge. No two closer than 78, no roads crossing, no spot in another ground's shape.
- **Kinds:** 2 towns, board, arms shop, magic shop, church, gate, 6 potions, 3 chests, 3 shrines, 7 gear, 136 wild. Road letters are yours: `h` is a shrine.
- **A second town, `oakshade` (mine):** so the coach has two stops, as in the Meadows. It sits by the church, `hollow`. If you would rather not add a town, tell me and I will make it a plain spot: the art stays.
- **Grounds:** four, one mob each, names, trophies and drops unchanged, with `levels`. Hubs moved so each is at its place's centre:

| Ground | Hub | Mob (art) | Levels |
| --- | --- | --- | --- |
| `twig-hollow` | `twigglen` | `spider` (Twigling) | 4-5 |
| `spore-ring` | `sporecap` | `outlaw` (Sporeling) | 5-6 |
| `mossy-reach` | `mossbog` | `treant` (Moss Goblin) | 6-7 |
| `nutkin-wood` | `nutgrove` | `wraith` (Nutkin) | 7-8 |

- **Owl Hollow** is a place you can see, around `barrow`, with no ground of its own. `spider-queen` (the Owlbear) still roams; the `mob_owlbear` piece stands there. Spots inside its shape fight the nearest ground's creature under your rule, so tell me if you want it treated differently.
- **Open road:** 105 spots keep the nearest place's creature, as Robin decided for the Meadows. 14 spots stand in towns, for your townsfolk moments.

## The two ways out

- **In from the Meadows:** `entryRoad` replaces your `gate` to `edge` road. It has the same two bridge points, then runs to the new `edge`, with 5 spots. No stroke on the deck, as before.
- **North to Honeyhill:** `pass` has `hub: 'briar'`, the road's `path` and a `foot`. Draw `pass_barred` at `foot` until Grumblebark falls, then `pass_open`. Sort it by foot. The road goes through the gate and off the chunks at y 3072: Honeyhill is not painted, so clamp the camera there and leave your `briar` to `pass` road on its waiting position until it is. Your call how that road runs until then.

## The ground

- **Grid:** the same global grid. Clamp the camera to x 3072 to 7400, y 3072 to 8400: the land ends about y 8150, and column 7 is mostly sea.
- **Size:** about 2.9 MB on disk for all 30, about 4 MB decoded each, so load only those near the camera as you do now. It is heavier on disk than the Meadows' 1.1 MB because of the dense trees.
- **Baked:** land, rivers, plank decks, places' ground, mountains, and every piece more than 170 px from a road.
- **Rivers and decks:** where a road crosses a river, a plank deck is baked, wider than the road, so your stroke runs along it and its rails show either side. Nothing to do. Some spots stand on a deck.

## Roads and sprites

- **Roads:** the forest's colours as before: 30 px `#7f6240`, 25 px `#b58f5e`, 10 px `#d0b280` at 0.8 alpha. Stroke `[from, ...via, to]` as a polyline, unsmoothed.
- **Sprites:** 364 in all. The most in a view at zoom 0.8 is 35, and 48 on a screen 600 wide, well under your 150.
- **`placement.json` replaces `placement_wobblewood.json`,** and the tiled ground is no longer used here.
- **Landmarks** keep their hubs, as in `board_forest`'s notes. New: `coach_stop` at both towns, `arch_twig`, `arch_spore`, `arch_bog`, `arch_grove` on the road at each ground's edge, and `mob_*` as still pieces.

## The overview

The Meadows and now the forest are real. **Honeyhill and the mountains in it are still the concept.** No words on it.

## Not tested

Not seen in the game or on a phone, and not run through your rules. The spots agree with `pointsAlong` only because I copied its formula. I checked it by eye at zoom 0.8 at about fifteen places, not all 162 spots.
