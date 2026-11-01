# Everything in the game that carries a name

Miles, GD, 2026-11-01. The world's names are the Enchanted Kingdoms' since the evening of 2026-11-01 (Robin: names yes,
order A; the catalogue is `docs/world-content.md`); the classes, gear, items and screen words are still the first names. Each lives in a data file under `rules/data/`, so a new name is an edit, not code;
the ids (`meadows`, `slime`, `warrior`) stay as they are and never show. Counts are at the end.

The world's kinds of place, in order outward from the start: Cloverfield Meadows, Wobblewood Forest, Honeyhill Fields (laid by
hand), then the nine grown archetypes Glimmerlake Shores, Moonwhisper Woods, Thunderstone Highlands, Sunfall Expanse,
Frostveil Peaks, Thornhollow Wilds, Starfall Dominion, Embercrown Mountains, The Shattered Crown, round and round. Each has
four creatures, a mini-boss and a boss. The four classes are still Warrior, Rogue, Mage and Ranger.

## 1. The world and its areas (`world.json`)

The world is called **Zite**, as the game is (Robin, 2026-11-01); **Enchanted Kingdoms** is the theme of the art and the
game's direction. The start is **Puddlewick Village**. Three areas are laid by hand; beyond them the world grows by theme
(section 2). Each area has eleven or so named places (hubs) joined by roads of unnamed wild spots; the names below are the
hubs, by kind. The names are the Enchanted Kingdoms' (Robin, 2026-11-01: names yes, order A; `docs/world-content.md`).

| Area (tier, levels; theme; kingdom) | Town | Shop | Spring | Shrine | Chest | Boss gate | Wild hubs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Cloverfield Meadows** (1, levels 1 to 4; meadow; Verdant Kingdom) | Puddlewick Village (the start), Old Mill | Merchant Cart | Abandoned Orchard | Forest Shrine | Slime Cave | King Goo's Gate (King Goo) | Clover Crossroads, Windmill Hill, Duck Pond, Hedgerow |
| **Wobblewood Forest** (2, levels 4 to 8; forest; Verdant Kingdom) | Tumbletree Village | Hollow Log Shop | Dewdrop Pool | Mossy Shrine | The Upside-Down Tree | Grumblebark's Glade (Grumblebark) | Wobblewood Edge, Fungal Ring, Leaning Oaks, Root Bridge, Owl Hollow |
| **Honeyhill Fields** (3, levels 8 to 12; harvest; Verdant Kingdom) | Goldencomb Farm | Harvest Market | Cider Well | Orchard Shrine | Windmill Cellar | Queen Bumble's Hive (Queen Bumble) | Honeyhill Pass, Orchard Maze, Wheat Rows, Empty Apiary |

The way into a grown area is "<Area> Pass"; the hand-laid ones enter at Wobblewood Edge and Honeyhill Pass.

## 2. The grown themes (`themes.json`)

Past Honeyhill Fields, each new area takes the next archetype of the Enchanted Kingdoms catalogue in order, round and
round: tier 4 Glimmerlake Shores … tier 12 The Shattered Crown, then Glimmerlake's second area name at tier 13, and so on
(order A, Robin, 2026-11-01). A theme carries: its kingdom, four area names (one per round), five adjectives that name its
places, four creatures, a mini-boss, a boss, the boss's rage line and move under half HP, and an event (section 7).

| Tier | Theme | Kingdom | Area names, by round | Adjectives for places | Creatures | Mini-boss | Boss | Rage under half HP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | glimmerlake | Glimmerlake Marches | Glimmerlake Shores, Pearl Shallows, Reedwater Marches, Bellwater Coast | Glimmer, Reed, Pearl, Ripple, Coral | Bubble Imp, Shellback, River Sprite, Marsh Goblin | Crystal Crab | Lord Ripplefin | "Lord Ripplefin calls the lake to rise!", Undertow (weaken) |
| 5 | moonwhisper | Moonspire Kingdom | Moonwhisper Woods, Violet Hollow, Witchlight Glades, Silvermoss Vale | Moon, Violet, Lantern, Dream, Silver | Moon Moth, Lantern Wisp, Dream Fox, Hexcap | Spellbound Doll | Lady Nightbloom | "Lady Nightbloom weaves a dream round you!", Hex (drain) |
| 6 | thunderstone | Stormward Highlands | Thunderstone Highlands, Cracklepeak, Stormcairn Moors, Copperfell | Thunder, Slate, Copper, Storm, Boulder | Pebble Golem, Storm Bat, Rock Hopper, Spark Imp | Iron Goblin | Boulderbelly | "Boulderbelly's thunder crystal blazes!", Lightning |
| 7 | sunfall | Suncrest Kingdom | Sunfall Expanse, Sevensun Sands, Obelisk Reach, Goldarch Wastes | Sun, Dune, Obelisk, Gilded, Mirage | Sand Skitter, Scarab Guard, Dust Wraith, Relic Mimic | Sunstone Sentinel | Pharaoh Solmar | "Pharaoh Solmar calls a sandstorm!", Sandstorm (evade) |
| 8 | frostveil | Frostveil Kingdom | Frostveil Peaks, Glacier Hall, Icewind Shelf, Palewhite Crags | Frost, Icicle, Snowdrift, Pine, Glacier | Snow Puff, Icefang Wolf, Frost Spirit, Crystal Corn Goblin | Frozen Knight | Glaciorn | "Glaciorn breathes a blizzard!", Blizzard (weaken) |
| 9 | thornhollow | Thornhollow Wilds | Thornhollow Wilds, Rotwood Deep, Weeping Thickets, Heartroot Tangle | Thorn, Briar, Rotcap, Hollow, Weeping | Thornling, Briar Wolf, Rotcap, Shadow Wisp | Cursed Stag | The Briar Queen | "The Briar Queen grows back her wounds!", Regrow (heal) |
| 10 | starfall | Moonspire Kingdom | Starfall Dominion, Shardfall Crater, Astral Terraces, Lost Star Reach | Astral, Rune, Star, Void, Prism | Astral Wisp, Spell Eater, Rune Knight, Voidling | Arcane Construct | Archmage Veyra | "Archmage Veyra bends the stars!", Starfall |
| 11 | embercrown | Embercrown Range | Embercrown Mountains, Ashen Nest, Blackglass Heights, Forgefire Ridge | Ember, Obsidian, Molten, Ashen, Basalt | Emberling, Ash Drake, Magma Golem, Flamefang | Obsidian Guardian | Ignarox, the Crownfire Dragon | "Ignarox, the Crownfire Dragon burns brighter!", Immolate (poison) |
| 12 | shattered | The Shattered Crown | The Shattered Crown, Hall of Mirrors, Rift Crossing, The Broken Coronation | Crownless, Rift, Mirror, Ivory, Hollow | Crownless Knight, Royal Phantom, Mirror Beast, Celestial Sentinel | Rift Dragon | The Hollow King | "The Hollow King's crown shards whirl!", Crown Shards |

A grown area's places are "<Adjective> <Place word>": the place words by kind are **towns** Hold, Haven, Rest, Crossing, Landing;
**shops** Trader, Market, Cart, Stall; **shrines** Shrine, Stone, Altar; **chests** Hoard, Cache, Cairn; **springs**
Spring, Pool, Well; **wild hubs** Ridge, Hollow, Flats, Reach, Edge, Hill, Thicket, Crag; the locked chest "<Adjective>
Vault"; the way out "<Adjective> Gate"; the way in "<Area> Pass". The four creatures of a theme fill four shapes in
order: a skitterer (fast, venom), a brute (slow, hard), a wisp (drains mana, fades), a stalker (hits first).

## 3. The creatures of the hand-laid areas (`enemies.json`)

Each has moves with names the player reads a round ahead ("next: Sting"); an effect in brackets. The ids in the file
(`slime`, `thornwood-warden`, …) are the first names and never show.

| Area | Creature | Role, level | Moves |
| --- | --- | --- | --- |
| Cloverfield Meadows | Jelly Slime | mob 1 | Splat |
|  | Grumpy Sprout | mob 2 | Root Whip, Headbutt |
|  | Meadow Bandit | mob 3 | Slash, Cheap Shot, Dirty Trick (weaken) |
|  | Bumbling Bee | mob 3 | Sting, Pollen Daze (drains mana) |
|  | Mushroom Muncher | mini 5 | Chomp, Spore Puff, Toxic Nibble (poison) |
|  | King Goo (at King Goo's Gate) | boss 6 | Squish, Belly Flop; under half HP "King Goo wobbles with rage: the tiny crown slips and the goo surges!" and Acid Splash (poison) |
| Wobblewood Forest | Twigling | mob 5 | Poke, Snap, Splinter (poison) |
|  | Moss Goblin | mob 6 | Club, Mossy Tackle, Moss Patch (heals itself) |
|  | Sporeling | mob 6 | Puff, Spore Cloud (poison) |
|  | Nutkin Thief | mob 7 | Scratch, Scamper (evades), Nut Snatch (drains mana) |
|  | Sleepy Owlbear Cub | mini 9 | Swipe, Pounce, Yawning Roar (weaken) |
|  | Grumblebark (at Grumblebark's Glade) | boss 10 | Branch Swipe, Trunk Slam; under half HP "Grumblebark wakes fully: the whole forest shakes!" and Root Grip (weaken), Regrow (heals itself) |
| Honeyhill Fields | Honey Blob | mob 9 | Sticky Slap, Glue Down (weaken) |
|  | Corn Goblin | mob 10 | Stalk Whack, Cob Toss |
|  | Buzzbug | mob 10 | Buzz Sting, Frantic Drone (drains mana) |
|  | Apple Mimic | mob 11 | Chomp, Core Crunch, Shut Tight (armours itself) |
|  | Scarecrow Scrapper | mini 13 | Rake Swing, Crow Call, Straw Choke (weaken) |
|  | Queen Bumble (at Queen Bumble's Hive) | boss 14 | Royal Sting, Swarm; under half HP "Queen Bumble's hive answers: the swarm thickens!" and Royal Jelly (armours itself), Hive Swarm |

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
- **Events, one per theme**: meadow "A quiet picnic spot in the clover: you rest a while."; forest "A leaning tree shakes a shower of acorns onto your head."; harvest "A jar of enchanted honey left on a fence post: sweet relief."; glimmerlake "The sunken bell rings under the water, and a drowned purse washes up."; moonwhisper "A moonlit witch swaps your voice for a moment; when it comes back, your mind is clear."; thunderstone "Storm crystals crackle underfoot: a shock."; sunfall "A mirrored oasis: water, shade, and a moment of peace."; frostveil "A frozen statue speaks a warning too late: the cold bites."; thornhollow "The fae have turned the signposts round; beside the wrong path lies a lost flask."; starfall "A falling star rattles your die about."; embercrown "A crack in the black rock spits lava: you jump, not quite in time."; shattered "A royal mirror repeats your last boast, and something behind it drinks your strength.".
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
| Areas | 3 hand-laid + 9 themes × 4 round names = 39 | `world.json`, `themes.json` |
| Named places in the hand-laid areas | 32 hubs | `world.json` |
| Place words for grown areas | 9 themes × 5 adjectives, 27 place words | `themes.json` |
| Creatures | 18 hand-laid (12 mobs, 3 minis, 3 bosses) + 9 themes × 6 = 72 | `enemies.json`, `themes.json` |
| Creature moves | about 50 names | `enemies.json`, `themes.json` |
| Classes and abilities | 4 classes, 4 meters, 24 abilities, 5 moves, 4 guards | `classes.json`, `abilities.json` |
| Gear | 5 slot names, 10 ranks, 5 rarities, 25 proper names, 5 affixes, 23 uniques | `gear.json`, `uniques.json` |
| Items | 6 | `items.json` |
| Spot kinds, events, errands, notes | 7, 12, 4, 4 | `spaces.json`, `events.json`, `quests.json`, `traces.json` |
