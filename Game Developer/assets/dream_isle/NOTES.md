# The Dreaming Isle, the Ferry, the merchant and Dreamdust

Mitch, AD, 2026-11-03, for Miles, GD, for Robin's endgame, the Dream (the brief, "The endgame: the Dream"; your `docs/plan-dream.md`). Names, places and designs are mine; Robin has not judged them. None of it is seen in the game.

Pictures:

- `preview.jpg`: the whole isle with its names.
- `phone.jpg`: the gate and the camp, and the path from the dock, at phone zoom.
- `ferry.jpg`: the Ferry in Crownhaven, barred and open.
- `merchant.jpg`: the merchant's clips.
- `dreamdust.jpg`: the icon at its sizes.

## 1. The Dreaming Isle: an off-map area like the Rootways

**Where:** the free north sea, squares 8 and 9 across, 0 and 1 down.

- **Bounds:** `{ x: 8192, y: 0, width: 2048, height: 2048 }`.
- **Painted floor:** `dream_8_0.jpg`, `dream_9_0.jpg`, `dream_8_1.jpg` and `dream_9_1.jpg`. They are 1026 px with a 1 px gutter, like every chunk, and `chunks.json` lists them.
- **The sea:** the world's own sea gradient. So if you draw the isle on the world map too, it sits in the sea as a real island; if not, it only shows when you're there.

**The look:** a small, uneven island (no circles), foam and sand round a lumpy shore, and grass with lilac clover and flowers. Across the middle is a little magic forest of lilac, teal and pink trees with glowing motes. At the south end a wooden dock runs out with the ferry boat moored at its end. On the north side is a moonstone court with the Dreamgate and its crystals.

**`dream_isle.json`**: `area` (id `dream-isle`, theme `dream`, `safe: true`, no mobs, hubs, roads), `bounds`, `fill` (the sea's colour), `roadColours` (pale lilac stone), `shore` (the outline, if you want it) and `spots`, each with its plate:

| Hub | Kind | Name | At |
| --- | --- | --- | --- |
| `di-dock` | `door` | The Dreamer's Dock | 9200, 1680 |
| `di-glade` | `normal` | Moonleaf Glade | 9020, 1380 |
| `di-spring` | `potion` | The Wishing Spring | 9360, 1150 |
| `di-camp` | `shop` | The Wanderer's Camp | 9020, 880 |
| `di-gate` | `dream` | The Dreamgate | 9250, 520 |

The roads run dock to glade (one spot), glade to spring (two), spring to camp (two) and camp to gate (two), each with `via` points. Linked spots are 141 to 179 px apart. The level, tier and the rest of `area` are placeholders for you.

**`placement.json`**: 152 pieces, sorted by foot.

- From the new atlas `dream_places`: the trees `dtree_*`, `dbush_*`, `crystal_a/b`, `dreamgate` (with `hub: "di-gate"`), `dream_tent`, `mob_dream_merchant` and `ferry_boat`.
- The Meadows' `spring` and `signpost_one`, and `merchant_cart` and `campfire` from `world_meadows`.
- The `door` plate is the Rootways' `spot_door`.

**`dream_places`** is 1024 by 1024. Load it on the isle; the Ferry's frames are in it too (part 2).

### The `dream` plate: `spot_dream`

`spot_dream` is in `dream_places`. It is the size of the gate plate: a lilac rim, the pale stone face, a lilac crescent and a gold star. Its pivot is the plate's middle, as with the others.

## 2. The Ferry in Crownhaven

Three frames in `dream_places`:

- **`ferry_barred`** and **`ferry_open`**: a post with a boat-shaped sign and a crescent, and a lantern. Barred, a chain hangs across with a crossed-out board and the lantern is dark. Open, the lantern is lit and a lilac pennant flies. Stand it beside the spot, about 66 px right of and 22 px above `city-bank` (7380, 6832); `ferry.jpg` shows both on the real street.
- **`ferry_badge`**: a lilac badge with a little boat. Hang it at about 7293, 6749 to cover the Bank's gold coin on its wall, so the building reads as the Ferry's office.

The spot itself takes the `door` plate.

## 3. The merchant

**The Dream Merchant**: a wanderer in an indigo hood with gold stars and a white beard, a pack of curios on his back and a lantern on a crook. He has a friendly face.

- **On the map:** `mob_dream_merchant` in `dream_places`, standing beside his tent in the camp.
- **His full clips:** `out/creatures_dream/dream_merchant`, on the Knight's skeleton, if you ever want him in a scene.

## 4. Dreamdust

A glowing lilac star in a ring of teal and pink dust, with sparkles. It reads apart from the gold coin at every size.

- `dreamdust.png`: 80 px, for 40 on the hero sheet and in the shop.
- `dreamdust_small.png`: 32 px, for 16 in the loot pop-ups. It drops the outer sparkles so it stays clear.

Pivot at the middle.

Tool: `tools/world/dream_isle.js` (the merchant is `tools/monsters/bigland.js dream`).
