# A bigger world of real places: the proposal and what it costs

Mitch, AD, 2026-11-02, for Robin to judge. All numbers are rough estimates from the concept painting, not measurements. The picture is `out/world_concept/zones.jpg`. Its map is a proposal: its roads are not the game's graph yet, and I did not check them for crossings.

## The proposal

| | Today | The concept |
| --- | --- | --- |
| Spots in the three regions | 187 | about 450 |
| Places you can see | a few landmarks | 24 |
| Places in a region | none as such | 8: 1 or 2 towns, 4 or 5 hunting grounds, a mini-boss place, a boss place |
| Spots in a place | none as such | about 8 of its own, plus 3 to 8 on each road between places |
| Land | 2800 by 3800 | 7400 by 9300 |

Each later region would add about 150 spots.

**How the land connects:** Cloverfield is an island with one barred bridge. Wobblewood and Honeyhill share the mainland, divided by mountains with one barred pass. Inside a region, places join by two or three roads each, so you can go round without doubling back.

**How a place reads:** its own ground colour and shape, its own edge (a palisade, a fence, a hedge, a ring of mushrooms, dead trees), a coloured arch where each road enters, its creatures standing on it, and its name and level range on the map.

## Three zooms on a phone

| Zoom | What you see | Labels |
| --- | --- | --- |
| Whole world | Regions as colour, places as patches | Region and place names |
| One region | Each place's shape and character, the roads between | Place names and levels |
| Playing | Spots, symbols, tents, creatures | Place name near its edge |

## One problem it creates

At about 3.5 spots a roll, crossing one region is about 9 rolls, and the world is about 40 end to end. That is good for feeling large, but tiresome once you have seen it, so **it needs a way to travel**. Miles, GD has already raised this. I would add one piece per town: a ferry, a cart stop or a waystone. That is Robin's and Miles, GD's decision; the art is small either way.

## What it costs in art (rough)

| Item | Count for the three regions | Memory |
| --- | --- | --- |
| Honeyhill's creatures, owed anyway | 6 | one 8 MB atlas, only in that fight |
| New creature for Duck Marsh | 1 | as above |
| Colour variants, so a second creature can share a place | 8 to 12, if Robin wants more than one per place | one atlas each, only in that fight, or a code tint at no memory |
| Place pieces (tents, stakes, dead trees, arches, hives, bog pools and so on) | about 40 to 70, many shared | one or two extra 8 MB atlases per region |
| Honeyhill's kit and backdrop, owed anyway | 1 kit | as the forest's |
| Baked ground for each region | 3 | 4 to 16 MB each, only the region you are in |
| The whole world as one picture, for the zoomed-out view | 1 | about 5 MB |

**What keeps this cheap on a phone:**
- Load only the region you are in, as the game already does by area.
- Draw zoomed out from one baked picture, not thousands of sprites. The concept holds several thousand props, far too many to draw at once. Up close, a screen shows perhaps 30 to 80.
- Each creature's atlas loads only for its fight, which is already how it works.

**On disk:** the concept's kind of art has been running at 100 to 200 KB an atlas, so I expect a few more MB of download in all. None of this has been measured on a phone, and the baked ground is the part I am least sure of.
