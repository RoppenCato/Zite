# The Enchanted Kingdoms catalogue, mapped onto the game as built

Miles, GD, 2026-11-01. `docs/world-content.md` is the catalogue (a proposal, prepared for Robin's theme). This file says
how it fits the game that exists, what would change where, and what Robin has to confirm before any name went into the
data. **Applied on 2026-11-01** (Robin: "names yes, order A"): the data, the docs and the tests carry the names below; the
ids (`meadows`, `slime`, `thornwood-warden`, …) are the first names and never show. The architecture does not change at all: the
world stays a seeded graph of spots and links, one area per tier outward from the start, the boss at the passage as the
gate (Robin, 2026-10-31).

## How the catalogue's words map onto the game's

| The catalogue says | The game has | Fit |
| --- | --- | --- |
| a region archetype (12) | a theme: meadow, forest, ice, then eight grown ones (11) | one to one; an archetype is a theme |
| a kingdom or territory | nothing | a label on an area, shown in the atlas and the hints; no mechanics |
| a tier band 1 to 4 with three regions each | one area per tier, tiers 1, 2, 3, then 4, 5, 6 … without end | see "The order" below |
| five regular monsters and a boss per region | four mobs, a mini-boss and a boss per area | the fifth regular monster (the biggest) is the mini-boss |
| a signature location | an area's town or a named landmark hub | one hub carries the name |
| other possible points of interest | the area's other hubs: a second town, the shop, the shrine, the chest, the spring, the wild landmarks | names for hubs the area already has |
| a dungeon entrance | nothing of the kind | the nearest things are the locked vault (its key dropped by the area's mini-boss) and a mini-boss lair spawn; "dungeon" = the vault for now |
| a shrine as "a short magical encounter or choice" | the shrine teaches an ability of your class or improves one, once in a while | keep the game's |
| flavour event ideas | one event per theme on a wild spot | one line each, the same slot |
| monster families (slimes, goblins, spirits, mimics, golems, beasts, living objects) | the generator's four shapes (skitterer, brute, wisp, stalker) | the families replace the shapes as the art's reuse plan; the rules' shapes stay the stat profiles |

## The order (mine: A; Robin decides)

**A. One archetype per tier, in the catalogue's order.** Keeps every decided thing: areas outward by tier, bosses as
gates, the three hand-laid areas re-dressed, the generator going on from the fourth. Each archetype gets its moment and
its boss opens the next. Levels are today's four a tier; the catalogue's "difficulty bands" are labels, not levels, and
the curve is mine to retune after the first play (the xp table reaches 30 and grows).

| Tier | Archetype | Levels today | Start or signature place | Mobs | Mini-boss (the fifth) | Boss, the gate to the next |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Cloverfield Meadows | 1 to 4 | Puddlewick Village (the start) | Jelly Slime, Grumpy Sprout, Bumbling Bee, Meadow Bandit | Mushroom Muncher | King Goo |
| 2 | Wobblewood Forest | 4 to 8 | The Upside-Down Tree | Twigling, Moss Goblin, Sporeling, Nutkin Thief | Sleepy Owlbear Cub | Grumblebark |
| 3 | Honeyhill Fields | 8 to 12 | Goldencomb Farm | Honey Blob, Corn Goblin, Apple Mimic, Buzzbug | Scarecrow Scrapper | Queen Bumble |
| 4 | Glimmerlake Shores | 12 to 16 | The Sunken Bell Tower | Bubble Imp, Shellback, River Sprite, Marsh Goblin | Crystal Crab | Lord Ripplefin |
| 5 | Moonwhisper Woods | 16 to 20 | The Witchlight Cottage | Moon Moth, Lantern Wisp, Dream Fox, Hexcap | Spellbound Doll | Lady Nightbloom |
| 6 | Thunderstone Highlands | 20 to 24 | Cracklepeak Mine | Pebble Golem, Storm Bat, Rock Hopper, Spark Imp | Iron Goblin | Boulderbelly |
| 7 | Sunfall Expanse | 24 to 28 | The Tomb of Seven Suns | Sand Skitter, Scarab Guard, Dust Wraith, Relic Mimic | Sunstone Sentinel | Pharaoh Solmar |
| 8 | Frostveil Peaks | 28 to 32 | The Shattered Ice Palace | Snow Puff, Icefang Wolf, Frost Spirit, Crystal Yeti | Frozen Knight | Glaciorn |
| 9 | Thornhollow Wilds | 32 to 36 | Heartroot Sanctuary | Thornling, Briar Wolf, Rotcap, Shadow Wisp | Cursed Stag | The Briar Queen |
| 10 | Starfall Dominion | 36 to 40 | The Observatory of Lost Stars | Astral Wisp, Spell Eater, Rune Knight, Voidling | Arcane Construct | Archmage Veyra |
| 11 | Embercrown Mountains | 40 to 44 | The Dragon King's Forge | Emberling, Ash Drake, Magma Golem, Flamefang | Obsidian Guardian | Ignarox, the Crownfire Dragon |
| 12 | The Shattered Crown | 44 to 48 | The Throne Beyond Time | Crownless Knight, Royal Phantom, Mirror Beast, Celestial Sentinel | Rift Dragon | The Hollow King |

Beyond the twelfth the world goes on (the brief: a forever game): the catalogue's future variants (Frost, Ember and Void
Slimes, a Meadow Wolf), second-round names, or new archetypes when they are written; until then the generator reuses
the twelve with new names, as it does today with eight.

**B. The catalogue's bands.** Three archetypes a band, the generator picking one per area within the band. A shorter
world (four areas to the Shattered Crown) with variety per seed; but one shared world has one seed, so nobody would see
the variety, and the design wants one area per tier. Not recommended.

## What changes where, once confirmed

- `rules/data/world.json`: the three hand-laid areas keep their layouts and become Cloverfield Meadows (the start town
  Puddlewick Village), Wobblewood Forest and Honeyhill Fields; their hubs take names from each entry's places. The meadows
  as the pattern: Puddlewick Village and the Old Mill (towns), the traveling merchant cart (shop), the Forest Shrine
  (shrine), the Slime Cave (chest), the abandoned orchard (spring), King Goo's gate (boss), and the wild landmarks.
- `rules/data/themes.json`: the eight grown themes become archetypes 4 to 12 (nine), each with its area names by round,
  its adjectives for place names (from the palette and props: Glimmer, Reed, Pearl …), its four mobs, mini-boss, boss,
  rage line and event.
- `rules/data/enemies.json`: the eighteen hand-laid creatures renamed; their moves re-flavoured where a name no longer
  fits (a Jelly Slime still Splats; a Grumpy Sprout does not Bite).
- `rules/data/events.json`, `quests.json`: the event lines per theme from the catalogue's ideas; the errands' words stay.
- A `kingdom` label per area (data plus two lines of client code for the atlas and the hints).
- Not changing: the rules, the generator's way of laying areas, the server, the saves (ids stay; a rename never breaks
  a save).

The names list `docs/names.md` gains a "proposed" column when Robin confirms, and then the data follows in one commit
with the tests run.

## For Robin to confirm (the catalogue's list, with the facts filled in)

1. **The names**: the twelve archetypes, their bosses, mini-bosses, mobs and places, as above. Yes, no, or edits.
2. **The order**: A or B.
3. **Kingdoms**: biome identities with a label is what the game can show today (mine); factions would need mechanics
   that do not exist and nothing in the brief asks for.
4. **Thornhollow as a fifth territory**: a label only; no effect on play.
5. **The Hollow King as the overarching villain**: lore only until there is a story; fine either way.
6. **The player's height on screen**: still Robin's (100 CSS px was the old number, his sheet's 118 had appeal).
7. **What the systems do today** (facts, no decision needed): towns rest you to full, give errands, hold a shop with a
   trainer; shrines teach or improve an ability; springs give a potion and a mana potion; chests give gold and gear, and a
   locked vault needs the key the mini-boss drops; the boss sits on the passage and opens the next area when it falls, back
   five minutes later; merchants and gamblers turn up on wild spots; dungeons do not exist.
