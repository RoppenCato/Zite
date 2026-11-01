# Everything in the game that carries a name

Miles, GD, 2026-11-01, for Robin's theme. Every name below is a placeholder (mine, or the cloud session's) so the game
could run; the theme replaces them. Each lives in a data file under `rules/data/`, so a new name is an edit, not code;
the ids (`meadows`, `slime`, `warrior`) stay as they are and never show. Counts are at the end.

What the theme decides first, because everything hangs on it: **the world's kinds of places** (today: meadow, forest, ice,
then fire, water, swamp, desert, crystal, shadow, sky, jungle, in that order outward from the start), **what lives in each**
(four creatures, a mini-boss, a boss), and **the four classes**. The rest follows.

## 1. The world and its areas (`world.json`)

The world is called **Zite** (the game's title, Robin, 2026-10-31). The start is **Ashford**. Three areas are laid by hand;
beyond them the world grows by theme (section 2). Each area has eleven or so named places (hubs) joined by roads of
unnamed wild spots; the names below are the hubs, by kind.

| Area (tier, levels) | Town | Shop | Spring | Shrine | Chest | Boss gate | Wild hubs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Ashford Meadows** (1, levels 1 to 4; meadow) | Ashford (the start), Millford | Tinker Cart | Hermit Hut | Moon Shrine | Old Cairn | Iron Gate (the Thornwood Warden) | Crossroads, Windy Ridge, Saltmarsh, Ravine |
| **Thornwood** (2, 4 to 8; forest) | Brambleford | Mossy Stall | Dusk Pool | Elder Stone | Weaver's Hoard | Briar Gate (the Briar King) | Thornwood Edge, Dark Thicket, Hollow Oak, Still Pond, Barrow Hill |
| **Frostpeak** (3, 8 to 12; ice) | Frosthold | Fur Trader | Hot Spring | Aurora Shrine | Frozen Cairn | The Summit (the Frost Matriarch) | Snowy Pass, Icefall, Glacier Tongue, Wind Ridge |

The way into an area is "<Area> Pass" (made by the generator for grown areas; the hand-laid ones enter at Thornwood Edge
and Snowy Pass).

## 2. The grown themes (`themes.json`)

Past Frostpeak, each new area takes the next theme round and round: tier 4 fire, 5 water, 6 swamp, 7 desert, 8 crystal,
9 shadow, 10 sky, 11 jungle, then fire again at tier 12 with the theme's second area name, and so on. A theme carries:
four area names (one per round), five adjectives that name its places, four creatures, a mini-boss, a boss, the boss's
rage line and move under half HP, and an event (section 7).

| Theme | Area names, by round | Adjectives for places | Creatures | Mini-boss | Boss | Rage under half HP |
| --- | --- | --- | --- | --- | --- | --- |
| fire | Emberfall, Ashen Reach, Cinder Wastes, Magma Fields | Ember, Ash, Cinder, Magma, Smoulder | Cinder Hound, Magma Crawler, Ash Wraith, Flame Imp | Ember Drake | Molten Tyrant | "The {boss} burns brighter!", Immolate (poison) |
| water | Mistwater, Tidehollow, Drowned Coast, Saltreach | Tide, Mist, Brine, Reef, Foam | Tide Crab, Drowned Sailor, Reef Serpent, Mist Siren | Kraken Spawn | Abyssal Leviathan | "The {boss} drags you under!", Undertow (weaken) |
| swamp | Murkfen, Rotmire, Bogwater, Sunken Marsh | Bog, Mire, Rot, Fen, Murk | Bog Leech, Mire Troll, Marsh Hag, Rot Stalker | Fen Hydra | Bog King | "The {boss} seeps rot into you!", Rot |
| desert | Sunscar, Dune Sea, Glassfields, Scorchland | Sand, Dune, Sun, Dust, Scorch | Sand Scarab, Dune Raider, Sun Scorpion, Dust Djinn | Sand Wyrm | Sun Pharaoh | (one line and one move each, in the file) |
| crystal | Glimmerdeep, Shardfall, Prism Vale, Geode Hollows | Shard, Prism, Glass, Geode, Glimmer | Shard Beetle, Prism Golem, Glass Wisp, Geode Lurker | Crystal Colossus | Prismatic Queen | |
| shadow | Duskmoor, Nightveil, Gloomhallow, Umbral Reach | Dusk, Night, Gloom, Umbral, Dread | Night Stalker, Umbral Wolf, Dread Shade, Void Imp | Shadow Fiend | Dusk Lord | |
| sky | Skyreach, Cloudrest, Stormcrown, Windward Heights | Storm, Cloud, Gale, Thunder, Sky | Storm Hawk, Cloud Ray, Gale Sprite, Thunder Ram | Roc | Storm Titan | |
| jungle | Verdant Tangle, Vinewood, Canopy Deep, Greenmaw | Vine, Fern, Canopy, Moss, Thorn | Vine Viper, Shadow Jaguar, Poison Frog, Ape Brute | Elder Ape | Jungle Idol | |

A grown area's places are "<Adjective> <Place word>": the place words by kind are **towns** Hold, Haven, Rest, Crossing,
Landing; **shops** Trader, Market, Cart, Stall; **shrines** Shrine, Stone, Altar; **chests** Hoard, Cache, Cairn; **springs**
Spring, Pool, Well; **wild hubs** Ridge, Hollow, Flats, Reach, Edge, Hill, Thicket, Crag; the locked chest "<Adjective>
Vault"; the way out "<Adjective> Gate"; the way in "<Area> Pass". The four creatures of a theme fill four shapes in
order: a skitterer (fast, venom), a brute (slow, hard), a wisp (drains mana, fades), a stalker (hits first).

## 3. The creatures of the hand-laid areas (`enemies.json`)

Each has moves with names the player reads a round ahead ("next: Spark"); an effect in brackets.

| Area | Creature | Role, level | Moves |
| --- | --- | --- | --- |
| Meadows | Slime | mob 1 | Splat |
| | Moor Wolf | mob 2 | Bite, Lunge |
| | Bandit | mob 3 | Slash, Cheap Shot, Dirty Trick (weaken) |
| | Marsh Wisp | mob 3 | Spark, Siphon (drains mana) |
| | Wolf Alpha | mini 5 | Bite, Howl, Savage Bite (poison) |
| | Thornwood Warden (at the Iron Gate) | boss 6 | Club, Smash; under half HP "The Warden's bark splits and thorns burst out!" and Thorns (poison) |
| Thornwood | Thorn Spider | mob 5 | Bite, Pounce, Venom Bite (poison) |
| | Old Treant | mob 6 | Branch, Root Slam, Regrow (heals itself) |
| | Outlaw Archer | mob 6 | Arrow, Barbed Arrow (poison) |
| | Wood Wraith | mob 7 | Touch, Fade (evades), Chill Touch (drains mana) |
| | Spider Queen | mini 9 | Fangs, Venom Lunge, Web (weaken) |
| | Briar King (at the Briar Gate) | boss 10 | Thorn Whip, Briar Crush; under half HP "The Briar King rages: the thorns close in!" and it regrows |
| Frostpeak | Ice Wolf | mob 9 | Bite, Frost Lunge (weaken) |
| | Yeti | mob 10 | Swipe, Boulder |
| | Frost Wisp | mob 10 | Chill, Siphon (drains mana) |
| | Ice Golem | mob 11 | Fist, Avalanche, Harden (armours itself) |
| | Yeti Elder | mini 13 | Swipe, Roar, Chill Howl (weaken) |
| | Frost Matriarch (at the Summit) | boss 14 | Ice Claw, Blizzard; under half HP "The Matriarch's heart freezes over!" |

Grown creatures use the four shapes' moves: Strike, Lunge, Venom; Swipe, Crush, …; the names are in `themes.json`
(`archetypes`) and can be themed per creature later.

## 4. The classes and their abilities (`classes.json`, `abilities.json`)

| Class | One line | Meter (fills in a fight) |
| --- | --- | --- |
| Warrior | Steady, high base damage, tough. | Rage, from blows taken |
| Rogue | Low base damage, chains crits, slips blows. | Combo, from hits landed |
| Mage | Big spells, thin robes. | Flow, a point a round |
| Ranger | Strikes first, many small hits. | Focus, from blows that miss and crits |

Six abilities a class; the first two are known from the start, the rest learnt at shrines, trainers and level picks.

| Class | Abilities (name: what it does) |
| --- | --- |
| Warrior | Heavy Blow: one crushing hit. Shield Bash: a hit that stuns. War Cry: your hits land harder for a few rounds. Execute (3 Rage): a brutal hit, far harder on a foe under a third. Rally (3 Rage): heal a share and hit harder for two rounds. Shield Wall: a barrier worth a share of your HP. |
| Rogue | Backstab: crits half the time. Poison Blade: poisons for three rounds. Shadowstep: the enemy's next blows miss. Smoke Bomb (3 Combo): vanish, the next blow misses and your next hit is a sure crit. Pickpocket: gold from the enemy's purse, once a fight. Eviscerate: spend all your Combo for a hit that grows with every point. |
| Mage | Fireball: a huge hit. Frost Bolt: weakens the enemy's blows. Arcane Shield: a barrier that soaks the next damage. Time Warp (4 Flow): the enemy loses its next turn, boss or not. Meteor: lands two rounds later for a huge hit. Mana Shield: all your mana into a barrier. |
| Ranger | Volley: three quick arrows. Aimed Shot: one careful arrow, often a crit. Snare: the enemy loses its next turn. Trap: the enemy's next wind-up fails. Hawk (2 Focus): strikes on its own at the end of every round for a while. Mark: your next hits land harder. |

The fight's own words: the moves **Attack, Abilities, Charge, Potion, Flee**; the guards **Block, Dodge, Brace, Counter**.

## 5. Gear (`gear.json`, `uniques.json`)

- **Slots and their plain names**: weapon (Sword), armour (Mail), helm (Helm), boots (Boots), trinket (Amulet).
- **Ranks by level** (ten, then "Rank 11…"): Copper, Iron, Steel, Mithril, Adamant, Runed, Dragonbone, Starforged,
  Voidsteel, Sunmetal. A piece reads "Iron Sword", "Mithril Boots".
- **Rarities**: common, uncommon, rare, epic, legendary. From epic up a piece gets a proper name in front:
  weapons Stormborn, Oathkeeper, Nightfang, Emberbite, Winterbite, Gravecall, Sunsplitter, Thornwhisper; armour
  Dawnbulwark, Ironheart, Wardweave, Stonehide, Mistmantle; helms Crownless, Skullward, Mindkeep, Starbrow; boots
  Swiftstep, Windrunners, Quietfall, Rootwalkers; trinkets Moontear, Everflame, Heartstone, Wyrmseye.
- **Affixes** (rare and up): crit chance, lifesteal, dodge chance, thorns, vigor.
- **The 23 uniques** (bosses drop them; each has a power): Twinfang (strikes twice), Quickdraw (crits first, holds the enemy
  back a round), Frostbrand (chills), Venomtooth (poisons), Mindshard (halves mana costs), Gorefang (grows as HP is
  missing), Stormcaller (crits every third hit), Sunblade (hits bosses harder); Wardweave (turns the first wound-up blow
  aside), Mirrormail (throws back half of what you block), Thornhide (softens blows under half HP); Phoenix Helm (catches
  a fall once a fight), Sage's Crown (half again the xp), Ironbrow (shrugs off poison, weakening and crits); Striders (a
  one becomes a two), Windstep (a step aside at every fight's start), Pathfinders (halve a spot's wait); Miser's Coin
  (double gold, half xp), Heartstone (heals every round), Sapphire Tear (mana back), Lucky Charm (re-rolls the die),
  Phoenix Feather (raises the fallen once every half hour), Wolf Totem (feeds the meter).

## 6. Items (`items.json`)

Potion (heals four tenths), Mana Potion (half the mana back), the dice cards Reroll, +1, −1, Exactly N; the vault key
an area's mini-boss drops; gold.

## 7. The spots, the surprises, the events, the errands, the notes (`spaces.json`, `surprises.json`, `events.json`, `quests.json`, `traces.json`)

- **Kinds of spot and their words**: Town ("Rest here: HP and mana back to full. A shop inside."), Shop, Wilds, Chest,
  Spring, Shrine, Boss. Each has a one-line hint the player reads on a tap.
- **Surprises on a wild spot**: a fight (70 in 100), a chest, a wandering merchant, a gambler (double or nothing on a die,
  high or low), a mini-boss, the area's event.
- **Events, one per theme**: meadow "A quiet picnic spot in the sun: you rest a while."; forest "Brambles snag you on the
  way through."; ice "The cold bites: frostbite."; fire "A crack in the ground spits lava: you jump, not quite in time.";
  water "The tide leaves a drowned purse on the shingle."; swamp "A will-o'-the-wisp leads you to a lost flask."; desert
  "An oasis: water, shade, and a moment's peace."; crystal "The crystals hum: your mind clears."; shadow "Something in the
  dark drinks your strength."; sky "A storm rolls in and throws your die about."; jungle "Ripe fruit hangs within reach."
- **Errands from towns** (four kinds): "Thin the {creature}: beat {count} of them."; "Open {count} chests in {area}.";
  "Hunt down the {mini-boss} prowling the wilds."; "Bring down {boss}."
- **Notes left on spots** (four set lines): Danger!, Loot here, Boss near, Help!
- **The first minutes' tips** and the hints are sentences in `client/src/tips.ts` and `rules/src/hints.ts`; they take the
  names from the data, so they follow a rename.

## 8. The screen's own words (`client/`)

The title **Zite**; the character screen (Your name, Pick a class, Begin, "I have a code from another phone"); the HUD's
line (Lv, HP, MP, Gold; the place "Area · Spot · with Name"); the buttons **Roll, Map, Back, World, Bag, Log**; the atlas
("The world", Go, Settings, Close); the shop (Buy, Sell, Train, Leave); the bag (Wear, Take off, Drop, Close); the fight
(Round n · your move, Continue); the link under the die (solo, online · n here, reconnecting); the default name Robin.

## 9. What a theme decides beyond the names

- The **kinds of place** and their order by tier (today eleven: meadow, forest, ice, fire, water, swamp, desert, crystal,
  shadow, sky, jungle). Fewer or other kinds are fine; each needs its four creatures, a mini-boss, a boss, an event and a
  look.
- The **look of each kind**: the board's ground and props, the fight's backdrop (`docs/art-demands.md` has the sizes).
- The **four classes'** silhouettes and weapons, and whether their names stay.
- The **shapes of the creatures** (skitterer, brute, wisp, stalker) or other families.
- Whether the **world has a name** apart from the game's title, and what the **people** are called (the player's name is
  typed; towns have no people yet; errands come from "the town").

## Counts

| | Named today | Where |
| --- | --- | --- |
| Areas | 3 hand-laid + 8 themes × 4 round names = 35 | `world.json`, `themes.json` |
| Named places in the hand-laid areas | 32 hubs | `world.json` |
| Place words for grown areas | 8 themes × 5 adjectives, 27 place words | `themes.json` |
| Creatures | 18 hand-laid (12 mobs, 3 minis, 3 bosses) + 8 themes × 6 = 66 | `enemies.json`, `themes.json` |
| Creature moves | about 50 names | `enemies.json`, `themes.json` |
| Classes and abilities | 4 classes, 4 meters, 24 abilities, 5 moves, 4 guards | `classes.json`, `abilities.json` |
| Gear | 5 slot names, 10 ranks, 5 rarities, 25 proper names, 5 affixes, 23 uniques | `gear.json`, `uniques.json` |
| Items | 6 | `items.json` |
| Spot kinds, events, errands, notes | 7, 11, 4, 4 | `spaces.json`, `events.json`, `quests.json`, `traces.json` |
