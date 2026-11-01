# The world (`rules/data/world.json`, `rules/src/world.ts`, `rules/data/themes.json`, `rules/src/generate.ts`)

One big continuous map, no islands and no water, in **areas by tier** (Robin, 2026-10-31: like Breath of the Wild's, each
area with its own theme; mobs live in their own parts of the map; bosses stand on the spots that lead to the next area).
Three areas are laid by hand; **beyond them the world grows** (mine, 2026-10-31, from the brief's forever game): when
the boss at the end of the last area falls, the generator lays the next area from the world's seed, with a theme, a
tier, its own creatures and gear of its rank, and a boss of its own at the far end that opens the one after. There is no
last area.

## The description

```
{ "name": "Zite", "width": 2800, "height": 3800, "start": "ashford",
  "areas": [ { "id": "meadows", "name": "Cloverfield Meadows", "theme": "meadow", "kingdom": "Verdant Kingdom", "tier": 1, "levels": [1, 4],
               "mobs": ["slime", "wolf", "bandit", "wisp"], "miniBosses": ["wolf-alpha"],
               "hubs": [ { "id": "ashford", "kind": "town", "name": "Puddlewick Village", "x": 700, "y": 3510 }, … ],
               "roads": [ { "from": "ashford", "to": "millford", "kinds": "nnptnn", "bow": 0 }, … ] }, … ],
  "roads": [ { "from": "gate", "to": "edge", "kinds": "nn", "bow": 0, "area": "thornwood" }, … ] }
```

- An **area** has a theme (the ground's colour until the art comes), a **kingdom** (a label for the atlas and the hints, from the Enchanted Kingdoms catalogue), a **tier**, the **levels** of what lives there, its
  **mobs** and **mini-bosses** (ids in `enemies.json`, or in the board's own bestiary for a grown area), its hubs and its
  roads.
- A **hub** is a named spot at a fixed position. A **boss hub** (`kind: "boss"`) names its **boss** and the area it
  **opens**: an area of the file, or a grown one by its id (`"gen-1"`), laid when the boss falls; `null` means nothing
  lies beyond (no hand-laid boss says so any more).
- A **road** joins two hubs with `kinds.length` plain spots between them, one letter per spot: **n** wilds, **t** chest,
  **p** spring, **h** shrine, **s** shop, **w** town (**g** boss is for hubs only). `bow` curves it: the spots lie on a
  quadratic Bezier whose middle is `bow` pixels off the straight line, positive away from the area's centre (loops bulge
  outward), negative inward, 0 straight; evenly spaced in the curve's parameter, rounded to whole pixels.
- The world's own **roads** are the passages: from a boss hub into the next area, their spots in that area (`area`), so
  they are closed until the boss falls.

`buildBoard(world)` lays it out, pure and deterministic, with `addArea`, `addRoad` and `setBounds`, which the generator
uses too. Road spot ids are `from-to-n` from 1, named `""`, chained hub → 1 → 2 → … → hub both ways; a hub gains its
links in road order, its own area's roads first, then the passages. Every spot carries its `area`. Each area's `bounds`
(the box round its spots with a 60-pixel margin) is computed for the camera. A clear Error names an unknown hub, letter,
area or boss, a duplicate id, a boss on a road, a start that is no hub, or a boss that opens an area that is neither in
the file nor a grown id.

## The three hand-laid areas (layouts mine, 2026-10-31; the names are the Enchanted Kingdoms' since 2026-11-01: Robin, "names yes, order A"; `docs/world-content.md`, `docs/world-content-mapping.md`)

The ids (`meadows`, `thornwood`, `frostpeak`, `ashford`, `thornwood-warden`, …) are the first names and never show; a rename never breaks a save.

| Area | Tier | Levels | Where | Mobs | Mini-boss | Boss and what it opens |
| --- | --- | --- | --- | --- | --- | --- |
| Cloverfield Meadows (meadow; Verdant Kingdom) | 1 | 1 to 4 | south-west, the start: Puddlewick Village and the Old Mill, four loops | Jelly Slime, Grumpy Sprout, Meadow Bandit, Bumbling Bee | Mushroom Muncher | King Goo at King Goo's Gate → Wobblewood Forest |
| Wobblewood Forest (forest; Verdant Kingdom) | 2 | 4 to 8 | east: Tumbletree Village, Leaning Oaks, Root Bridge, Owl Hollow | Twigling, Moss Goblin, Sporeling, Nutkin Thief | Sleepy Owlbear Cub | Grumblebark at Grumblebark's Glade → Honeyhill Fields |
| Honeyhill Fields (harvest; Verdant Kingdom) | 3 | 8 to 12 | north-east: Goldencomb Farm, Orchard Maze, Wheat Rows, Empty Apiary | Honey Blob, Corn Goblin, Buzzbug, Apple Mimic | Scarecrow Scrapper | Queen Bumble at Queen Bumble's Hive → the first grown area |

187 spots: 154 wilds, 10 chests, 9 springs, 3 shrines, 4 shops, 4 towns, 3 bosses. Every area has a town, a shop, a
shrine, chests and springs; more than six in ten of its spots are wilds. Queen Bumble's Hive stands in Honeyhill Fields' north-east
corner, reached from the Empty Apiary and the Orchard Shrine, so the passage east into the first grown area is short. The
north-west quarter of the map stays empty: the grown areas go east.

## The grown areas (mine, 2026-10-31)

The cells are 1400 by 1900 pixels, the size of a hand-laid area's cell. The hand-laid areas take the first two columns
(Cloverfield Meadows at column 0 row 1, Wobblewood Forest at column 1 row 1, Honeyhill Fields at column 1 row 0); the grown areas **snake
east from column 2**, two cells tall: down the even columns, up the odd ones (gen-1 at column 2 row 0, gen-2 under it,
gen-3 at column 3 row 1, gen-4 above it, gen-5 at column 4 row 0, …). The board widens by a column every two areas;
its height stays 3800. `cellFor(n)` says which cell, which side the area is entered from and which side its boss leaves
by.

**What the n-th area is** (`peekArea(seed, n)`, no laying needed; the hints use it): id `gen-n`, **tier 3 + n**,
**levels 4·tier − 4 to 4·tier** (gen-1: tier 4, levels 12 to 16), its **theme** the n-th of the nine in
`themes.json`, the Enchanted Kingdoms' archetypes in the catalogue's order (glimmerlake, moonwhisper, thunderstone, sunfall,
frostveil, thornhollow, starfall, embercrown, shattered) round and round, and its **name** the theme's first name the first
time round, the second the second time (Glimmerlake Shores, Moonwhisper Woods, Thunderstone Highlands, Sunfall Expanse,
Frostveil Peaks, Thornhollow Wilds, Starfall Dominion, Embercrown Mountains, The Shattered Crown; then Pearl Shallows,
Violet Hollow, …). Each theme carries its **kingdom** (Glimmerlake Marches, Moonspire Kingdom, Stormward Highlands,
Suncrest Kingdom, Frostveil Kingdom, Thornhollow Wilds, Moonspire Kingdom, Embercrown Range, The Shattered Crown).

**Its shape** (`generateArea(seed, n)`, from the stream `hashSeed("seed:area:n")`, so the same for every player and
whatever else is on the board): one of five templates, the three hand-laid areas and the two shapes of `shapes.json`
(the **ladder**, two columns with rungs; the **wheel**, a hub with six spokes), its hubs and roads moved into the
cell, a hub with only one road dropped (no dead ends), its boss hub turned to wilds. A shape's **locked vault** stays
one (named "<Adjective> Vault"): it opens only with the area's key, which the area's mini-boss drops once, and holds
three times the gold, a piece never under epic and a unique three times in ten (`docs/state/rules.md`). The **way in** is the hub nearest the entry
side whose straight approach from the opener (Queen Bumble's Hive, or the area before's gate: a pure function of the seed too)
keeps clear of the area's other spots, named "**<Area> Pass**", plain wilds; the **way out** is the hub nearest the exit
side chosen the same way, the area's boss hub, named "<Adjective> Gate", opening `gen-(n+1)`. The template's kinds are
kept, and then the area is made to have a town, a shop, a shrine, two chests and two springs, taking spare wilds hubs
first and then wilds spots on the roads. Hubs are named from the theme's adjectives and a word for the kind (Glimmer
Hold, Reed Trader, Pearl Shrine, Ripple Cache, Coral Pool, Glimmer Ridge). Bows of 20 pixels or more swing by up to 10.

**Its creatures** go on the board's **bestiary** (`board.bestiary`, by id, beside `enemies.json`): four **mobs** of the
theme's names at the area's levels (lo, lo + 1, lo + 2, lo + 3) in four shapes (plain; tough and slow with a wind-up;
glass cannon; a wall with a wind-up), a **mini-boss** at hi + 1 and the **boss** at hi + 2. The numbers are
Honeyhill Fields's (`themes.json` `base`: mob 260 HP, 38 attack, 11 defense, 42 xp, 48 gold; mini 700 / 48 / 16; boss 1200 /
46 / 15, 700 xp, 600 gold) grown a tier at a time: **HP ×1.25, attack ×1.15, defense ×1.12, xp and gold ×1.3** (the
bots' walls set these: `docs/state/rules.md`, Balance). Gen-1's Lord Ripplefin has 1650 HP; gen-8's Ignarox about 7900. **Under half its HP a grown boss rages in its theme's way**
(`themes.json` `rage`): a line ("Lord Ripplefin calls the lake to rise!") and one more move with the theme's effect (Glimmerlake and
Frostveil weaken, Moonwhisper drains mana, Sunfall fades, Thornhollow regrows, Embercrown poisons, Thunderstone, Starfall
and the Shattered Crown strike harder). The area's **gear rank is its tier**: the ten named ranks
(Tin, Copper, Iron, Silver, Moonsilver, Sunsteel, Dragonscale, Starglass, Crownsteel, Everbright) and then "Rank 11", …;
beyond the slot tables a rank's number grows ×1.35 and its price ×1.8 (`gear.json` `rankGrowth`, `priceGrowth`).

**Laying it** (`growBoard(board, seed, areaId)`): a new board (the old one untouched), wider if the cell asks, the area
added, the **passage** from the boss that opens it to the Pass laid as wilds spots a step (120 pixels) apart, bowed as
little as it can be (0, ±70, ±140, … up to ±350) so that every passage spot keeps 60 pixels from every other spot on
the board; the passage spots belong to the new area, so they are closed until the boss falls. If the area after is
already on the board (a save that opened areas out of order), the passage on from the new gate is laid too. The rules
grow the board in `win()`, the moment a boss whose `opens` is not laid yet falls, before the area is added to the
character's `opened`; the `opened` event follows. A grown area is 57 to 70 spots.

**Tests.** `rules/test/board.test.ts` runs every soundness and drawability check over the hand-laid world, the ring
fixture **and two worlds grown ten areas** (seeds ashford and moon): links both ways, no dead ends but a boss with
nothing laid beyond, every roll usable from every spot with every area open **and** with only the areas up to its own
open, known kinds, bosses that exist (in `enemies.json` or the bestiary), unique ids, linked spots 60 to 200 pixels
apart, no two spots closer than 55, every spot 40 pixels inside the map and inside its area's bounds.
`rules/test/generate.test.ts` pins the peek, the cells, the first area's shape, names and creatures, the growth tier by
tier, every grown area's kinds, growing the board (a copy, idempotent, the same whatever the order, twenty areas each
reachable over its passage), the hints before and after, and Queen Bumble's fall laying and opening gen-1 in
play, then gen-1's boss laying gen-2. `rules/test/world.test.ts` covers `buildBoard` itself.

## What is static and what is live

The hand-laid map is static: the client builds the same board from the data. **The board is part of the state and
grows**: a save carries its grown areas, and a version-5 save is brought up by laying again the areas its characters had
opened. What else moves lives in the state: which areas a character has opened, the spots it has used up for a while
(`cooldowns`), its boss kills, and the world's **spawns** (a mini-boss prowling or a merchant camped on a wild spot, from
the `tick` action; `docs/state/rules.md`). With the server, the spawns and the clock move to the region actor, which lays
the same grown areas from the same seed; the opened areas and the cooldowns stay with the character.
