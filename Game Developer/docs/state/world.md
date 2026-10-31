# The world (`rules/data/world.json`, `rules/src/world.ts`)

One big continuous map, no islands and no water, in **areas by tier** (Robin, 2026-10-31: like Breath of the Wild's, each
area with its own theme; mobs live in their own parts of the map; bosses stand on the spots that lead to the next area).
Today three areas are laid by hand; the generator that lays areas without a hand comes later (`docs/idea-bank.md`).

## The description

```
{ "name": "Zite", "width": 2800, "height": 3800, "start": "ashford",
  "areas": [ { "id": "meadows", "name": "Ashford Meadows", "theme": "meadow", "tier": 1, "levels": [1, 4],
               "mobs": ["slime", "wolf", "bandit", "wisp"], "miniBosses": ["wolf-alpha"],
               "hubs": [ { "id": "ashford", "kind": "town", "name": "Ashford", "x": 700, "y": 3510 }, … ],
               "roads": [ { "from": "ashford", "to": "millford", "kinds": "nnptnn", "bow": 0 }, … ] }, … ],
  "roads": [ { "from": "gate", "to": "edge", "kinds": "nn", "bow": 0, "area": "thornwood" }, … ] }
```

- An **area** has a theme (the ground's colour until the art comes), a **tier**, the **levels** of what lives there, its
  **mobs** and **mini-bosses** (ids in `enemies.json`), its hubs and its roads.
- A **hub** is a named spot at a fixed position. A **boss hub** (`kind: "boss"`) names its **boss** and the area it
  **opens** (`null` when nothing lies beyond yet).
- A **road** joins two hubs with `kinds.length` plain spots between them, one letter per spot: **n** wilds, **t** chest,
  **p** spring, **h** shrine, **s** shop, **w** town (**g** boss is for hubs only). `bow` curves it: the spots lie on a
  quadratic Bezier whose middle is `bow` pixels off the straight line, positive away from the area's centre (loops bulge
  outward), negative inward, 0 straight; evenly spaced in the curve's parameter, rounded to whole pixels.
- The world's own **roads** are the passages: from a boss hub into the next area, their spots in that area (`area`), so
  they are closed until the boss falls.

`buildBoard(world)` lays it out, pure and deterministic. Road spot ids are `from-to-n` from 1, named `""`, chained hub →
1 → 2 → … → hub both ways; a hub gains its links in road order, its own area's roads first, then the passages. Every spot
carries its `area`. Each area's `bounds` (the box round its spots with a 60-pixel margin) is computed for the camera. A
clear Error names an unknown hub, letter, area or boss, a duplicate id, a boss on a road, or a start that is no hub.

## The three areas (mine, 2026-10-31: first layouts; names are placeholders Robin may change)

| Area | Tier | Levels | Where | Mobs | Mini-boss | Boss and what it opens |
| --- | --- | --- | --- | --- | --- | --- |
| Ashford Meadows (meadow) | 1 | 1 to 4 | south-west, the start: Ashford and Millford, four loops | Slime, Moor Wolf, Bandit, Marsh Wisp | Wolf Alpha | Thornwood Warden at the Iron Gate → Thornwood |
| Thornwood (forest) | 2 | 4 to 8 | east: Brambleford, Hollow Oak, Still Pond, Barrow Hill | Thorn Spider, Old Treant, Outlaw Archer, Wood Wraith | Spider Queen | Briar King at the Briar Gate → Frostpeak |
| Frostpeak (ice) | 3 | 8 to 12 | north-east: Frosthold, Icefall, Glacier Tongue, Wind Ridge | Ice Wolf, Yeti, Frost Wisp, Ice Golem | Yeti Elder | Frost Matriarch at the Summit → nothing yet |

182 spots: 149 wilds, 10 chests, 9 springs, 3 shrines, 4 shops, 4 towns, 3 bosses. Every area has a town, a shop, a
shrine, chests and springs; more than six in ten of its spots are wilds. The north-west quarter of the map is empty, for
the fire area to come. The Summit is the one dead end on the map, allowed only because it is a boss spot with nothing
beyond; when the fourth area is laid, a road leads on from it.

`rules/test/board.test.ts` keeps both boards (this world and the ring fixture) sound and drawable: links both ways, no
dead ends but that one, every roll of the die usable from every spot with every area open **and** with only the areas up
to its own open (so a closed border never strands anyone), known kinds, bosses that exist, unique ids, linked spots 60 to
200 pixels apart, no two spots closer than 55, every spot 40 pixels inside the map and inside its area's bounds, each
area's mobs within its levels. `rules/test/world.test.ts` covers `buildBoard` itself.

## What is static and what is live

The map is static: the client builds the same board from the data. What moves lives in the state: which areas a character
has opened, the spots it has used up for a while (`cooldowns`), its boss kills, and the world's **spawns** (a mini-boss
prowling or a merchant camped on a wild spot, from the `tick` action; `docs/state/rules.md`). With the server, the spawns
and the clock move to the region actor; the opened areas and the cooldowns stay with the character.
