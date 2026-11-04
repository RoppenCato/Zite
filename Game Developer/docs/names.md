# Everything in the game that carries a name

Miles, GD, 2026-11-01. The world's names are the Enchanted Kingdoms' since the evening of 2026-11-01 (Robin: names yes,
order A; the catalogue is `docs/world-content.md`); the classes, meters, abilities, gear ranks and proper names, uniques and items were themed the same evening (mine, at Robin's ask). Each lives in a data file under `rules/data/`, so a new name is an edit, not code;
the ids (`meadows`, `slime`, `warrior`) stay as they are and never show. Counts are at the end.

The world's kinds of place, in order outward from the start: Cloverfield Meadows, Wobblewood Forest, Honeyhill Fields (laid by
hand), then the nine grown archetypes Glimmerlake Shores, Moonwhisper Woods, Thunderstone Highlands, Sunfall Expanse,
Frostveil Peaks, Thornhollow Wilds, Starfall Dominion, Embercrown Mountains, The Shattered Crown, round and round. Each has
four creatures, a mini-boss and a boss. The four classes are the Warrior, the Magician, the Rogue and the Hunter (Robin, 2026-11-02), each with three trees.

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

| Tier | Theme | Kingdom | Area names, by round | Adjectives for places | Creatures | Mini-boss | Boss | Valor under half HP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | glimmerlake | Glimmerlake Marches | Glimmerlake Shores, Pearl Shallows, Reedwater Marches, Bellwater Coast | Glimmer, Reed, Pearl, Ripple, Coral | Bubble Imp, Shellback, River Sprite, Marsh Goblin | Crystal Crab | Lord Ripplefin | "Lord Ripplefin calls the lake to rise!", Undertow (weaken) |
| 5 | moonwhisper | Moonspire Kingdom | Moonwhisper Woods, Violet Hollow, Witchlight Glades, Silvermoss Vale | Moon, Violet, Lantern, Dream, Silver | Moon Moth, Lantern Wisp, Dream Fox, Hexcap | Spellbound Doll | Lady Nightbloom | "Lady Nightbloom weaves a dream round you!", Hex (drain) |
| 6 | thunderstone | Stormward Highlands | Thunderstone Highlands, Cracklepeak, Stormcairn Moors, Copperfell | Thunder, Slate, Tin, Storm, Boulder | Pebble Golem, Storm Bat, Rock Hopper, Spark Imp | Copper Goblin | Boulderbelly | "Boulderbelly's thunder crystal blazes!", Lightning |
| 7 | sunfall | Suncrest Kingdom | Sunfall Expanse, Sevensun Sands, Obelisk Reach, Goldarch Wastes | Sun, Dune, Obelisk, Gilded, Mirage | Sand Skitter, Scarab Guard, Dust Wraith, Relic Mimic | Sunstone Sentinel | Pharaoh Solmar | "Pharaoh Solmar calls a sandstorm!", Sandstorm (evade) |
| 8 | frostveil | Frostveil Kingdom | Frostveil Peaks, Glacier Hall, Icewind Shelf, Palewhite Crags | Frost, Icicle, Snowdrift, Pine, Glacier | Snow Puff, Icefang Wolf, Frost Spirit, Crystal Corn Goblin | Frozen Knight | Glaciorn | "Glaciorn breathes a blizzard!", Blizzard (weaken) |
| 9 | thornhollow | Thornhollow Wilds | Thornhollow Wilds, Rotwood Deep, Weeping Thickets, Heartroot Tangle | Thorn, Briar, Rotcap, Hollow, Weeping | Thornling, Briar Wolf, Rotcap, Shadow Wisp | Cursed Stag | The Briar Queen | "The Briar Queen grows back her wounds!", Regrow (heal) |
| 10 | starfall | Moonspire Kingdom | Starfall Dominion, Shardfall Crater, Astral Terraces, Lost Star Reach | Astral, Rune, Star, Void, Prism | Astral Wisp, Spell Eater, Rune Knight, Voidling | Arcane Construct | Archmage Veyra | "Archmage Veyra bends the stars!", Starfall |
| 11 | embercrown | Embercrown Range | Embercrown Mountains, Ashen Nest, Blackglass Heights, Forgefire Ridge | Ember, Obsidian, Molten, Ashen, Basalt | Emberling, Ash Drake, Magma Golem, Flamefang | Obsidian Guardian | Ignarox, the Crownfire Dragon | "Ignarox, the Crownfire Dragon burns brighter!", Immolate (poison) |
| 12 | shattered | The Shattered Crown | The Shattered Crown, Hall of Mirrors, Rift Crossing, The Broken Coronation | Acorncap, Rift, Mirror, Ivory, Hollow | Acorncap Knight, Royal Phantom, Mirror Beast, Celestial Sentinel | Rift Dragon | The Hollow King | "The Hollow King's crown shards whirl!", Crown Shards |

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

**The world bosses** (Robin, 2026-11-04: one per land; names mine), each met only as a world boss:

| Land | World boss | Level | The great one of (its look until drawn) | Moves | Trick |
| --- | --- | --- | --- | --- | --- |
| Cloverfield Meadows | Old Bristleback, a giant boar | 6 | Wild Tusker | Tusk Gore, Stampede; Mud Kick (weaken) | winds up a charge every third round |
| Wobblewood Forest | Mother Owlbear, the cub's mother | 10 | Sleepy Owlbear Cub | Maul, Great Hug; Feather Storm | a bear hug weakens you every third round |
| Honeyhill Fields | Big Bramley, the orchard's apple giant | 14 | Apple Mimic | Vine Lash, Windfall; Seed Spit (poison) | grows back each round unless burning or poisoned |
| Bogglemire | Grandfather Croak, a toad as big as a cottage | 17 | Bog Toad | Tongue Lash, Belly Bounce; Swamp Spit (poison) | the frogs of the bog gather: he hits harder each round |
| The Frostcrown | Old Cragheart, a walking hill of stone | 21 | Pebble Golem | Boulder Fist, Rockslide; Gravel Spray (weaken) | curls into a boulder every fourth round |
| The Pirate Isles | Old Clackclaw, a giant crab | 25 | Scuttle Crab | Pinch, Crushing Claw; Bubble Spray (weaken) | stinging brine poisons you every third round |
| The Giants' Land | Frostgut, a hill ogre | 29 | Frost Ogre | Glacier Club, Hill Fall; Frost Belch (weaken) | lifts his club for a big blow every third round |

Grown creatures use the four shapes' moves: Strike, Lunge, Venom; Swipe, Crush, …; the names are in `themes.json`
(`archetypes`) and can be themed per creature later.

## 4. The classes and their abilities (`classes.json`, `abilities.json`)

Themed on 2026-11-01 (mine, at Robin's ask). The ids (`warrior`, `heavy-blow`, …) are the first names and never show.

| Class | One line | Meter (fills in a fight) |
| --- | --- | --- |
| Warrior | Blocks to build Valor, then hits hard. Trees: Paladin, Berserker, Knight. | Valor: builds when you Block. |
| Magician | Mana Shield, weak staff, strong spells. Trees: Wizard, Cleric, Spellsword. | Arcana: builds a point every round. |
| Rogue | Three quick hits, crits that build. Trees: Ninja, Shadow, Alchemist. | Mischief: builds each time you attack. |
| Hunter | Bows only, strikes first, shoots back. Trees: Ranger, Beastmaster, Trapper. | Aim: builds when a blow misses you and when you crit. |

Six abilities a class; the first two are known from the start, the rest learnt at shrines, trainers and level picks.

| Class | Abilities (name: what it does) |
| --- | --- |
| Knight | Mighty Swing: one crushing hit. Shield Bonk: a hit that stuns: the enemy loses its next turn. Battle Hymn: your hits land harder for a few rounds. Finishing Flourish: spend 3 Valor: a flourish of a hit, far harder on a foe under a third of its HP. Second Wind: spend 3 Valor: heal a share of your HP and hit harder for two rounds. Castle Stance: stand like a castle wall: a barrier worth a share of your HP. |
| Trickster | Sneak Jab: a hit that crits half the time. Nettle Knife: a cut that stings like nettles: poison for three rounds. Vanishing Act: slip away: the enemy's next blows miss. Puff of Smoke: spend 3 Mischief: vanish, the next blow misses and your next hit is a sure crit. Sticky Fingers: a quick cut and a quicker hand: gold from the enemy's purse, once a fight. Grand Finale: spend all your Mischief: a hit that grows with every point. |
| Wizard | Firework: a burst of flame and sparks: a huge hit. Snowball Hex: a chill that weakens the enemy's blows. Bubble Shield: a shimmering bubble worth a share of your HP that soaks the next damage. Pocket Watch: spend 4 Arcana: stop the clock, the enemy loses its next turn, boss or not. Falling Star: call down a star: it lands two rounds later for a huge hit, whatever you do meanwhile. Moonlight Veil: turn all your mana into a veil of moonlight. |
| Archer | Triple Shot: three quick arrows. Bullseye: one careful arrow, often a crit. Net Toss: a net: the enemy loses its next turn. Tripwire: lay a tripwire: the enemy's next wind-up fails. Owl Friend: spend 2 Aim: your owl strikes on its own at the end of every round for a while. Painted Target: paint a target on the enemy: your next hits land harder. |

The fight's own words: the moves **Attack, Abilities, Charge, Honey Tonic, Flee**; the guards **Block, Dodge, Brace, Counter**.

## 5. Gear (`gear.json`, `uniques.json`)

- **Slots and their plain names**, in the worn order: weapon (Sword), shield (Shield), helm (Hat), armour (Coat), gloves (Gloves), boots (Boots), cape (Cape), trinket (Charm). Shield, gloves and cape came on 2026-11-01 (Robin); their proper names from epic up: shields Thornguard, Moonward, Sunbuckler, Turtleback; gloves Nimblefingers, Honeygrips, Frostmitts, Ironknuckles; capes Dandelion Cloak, Nightveil, Starcloak, Foxtail.
- **Ranks by level** (ten, then "Rank 11…"): Tin, Copper, Iron, Silver, Moonsilver, Sunsteel, Dragonscale, Starglass, Crownsteel, Everbright. A piece reads "Copper Sword", "Silver Boots".
- **Rarities**: common, uncommon, rare, epic, legendary. From epic up a piece gets a proper name in front:
  weapons Thistledown, Honeystinger, Moonpetal, Sunflare, Frostnip, Oathsworn, Briarsong, Starfallen; armour Oakheart, Cloverweave, Snugshell, Moonmantle, Sunwarden; helms Acorncap, Starbrow, Bumblecrest, Owlgaze; boots Puddlejumpers, Windhoppers, Tiptoes, Rootwalkers; trinkets Moontear, Firefly, Fourleaf, Dragonwink.
- **Affixes** (rare and up): crit chance, lifesteal, dodge chance, thorns, vigor.
- **The 23 uniques** (bosses drop them; each has a power): Twinstinger (attack strikes twice, each at six tenths), Hare's Edge (your first hit of a fight is a sure crit, and the enemy does not strike back that round), Icicle (every hit chills: the enemy's next blow lands at eight tenths), Nettlefang (every hit poisons for two rounds, at three tenths of your attack a round), Moonquill (abilities cost half their mana and hit at eight tenths), Grudgeblade (hits harder the more HP you are missing, up to six tenths more), Thunderclap (every third hit you land is a sure crit), Crownbreaker (hits mini-bosses and bosses three tenths harder), Hedgehog Coat (the first wound-up blow of every fight misses you), Mirrorcoat (a blow you Block throws half of what you blocked back at the enemy), Bramblehide (every blow you take is three tenths softer while your HP is under half), Rooster's Crest (once a fight, a blow that would drop you under a quarter HP heals you three tenths instead), Owl's Crown (half again the xp from every fight), Kettle Hat (poison and weakening cannot touch you, and a crit against you is only a hit), Seven-League Boots (a roll of one becomes two), Dancing Shoes (you start every fight with a step aside: the first blow at you misses), Wanderers (chests, springs and shrines give again to you in half the time), Dragon's Penny (twice the gold from every fight, half the xp), Honeycomb Heart (heals a twentieth of your HP at the end of every round in a fight), Moondrop (three more mana back every round of a fight), Rabbit's Foot (roll the die again once every five minutes: a Charm chip appears after a roll), Phoenix Feather (when you would fall, you rise where you stand with half your HP instead, once every half hour), Heartbeat Drum (every point of your meter has a one-in-four chance to bring a second).

## 6. Items (`items.json`)

Honey Tonic (heals four tenths of your HP. Drink it in a fight; it takes your turn); Moon Dew (gives back half your mana. Drink it in a fight; it takes your turn); Do-Over (roll the die again before you walk); Hop (one more step: a hop); Hold (hold back one step, never below one); Fairy Pick (the fairy picks the number you ask for: walk exactly that); the vault key an area's mini-boss drops; gold.

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

## Suffixes and prefixes (Robin, 2026-11-02; words mine)

- **of Sharpness**: crit chance. weapon.
- **of the Leech**: of damage dealt back as HP. weapon.
- **of Cruelty**: harder crits. weapon.
- **of Haste**: chance to strike again. weapon.
- **of Venom**: chance to poison. weapon.
- **of Embers**: chance to burn. weapon.
- **of Frost**: chance to weaken. weapon.
- **of the Giant**: more damage to bosses and rare foes. weapon.
- **of the Hunter**: more damage to ordinary foes. weapon.
- **of Ruin**: of its defense ignored. weapon.
- **of the Magus**: magic. weapon.
- **of Focus**: less mana for abilities. weapon.
- **of the Bear**: more HP. armour, shield, helm, gloves, boots, cape.
- **of Thorns**: of damage taken dealt back. armour, shield, helm, gloves, boots, cape.
- **of Evasion**: dodge chance. armour, shield, helm, gloves, boots, cape.
- **of the Turtle**: more defense. armour, shield, helm, gloves, boots, cape.
- **of the Wall**: more stopped by Block. armour, shield, helm, gloves, boots, cape.
- **of Mending**: of HP back each round. armour, shield, helm, gloves, boots, cape.
- **of Clarity**: mana back each round. armour, shield, helm, gloves, boots, cape.
- **of Warding**: less from the first wind-up. armour, shield, helm, gloves, boots, cape.
- **of Resolve**: chance of an extra meter point. armour, shield, helm, gloves, boots, cape.
- **of Fortune**: more gold. boots, cape, trinket.
- **of Wisdom**: more XP. boots, cape, trinket.
- **of the Scavenger**: better chance of gear drops. boots, cape, trinket.
- **of the Explorer**: more surprises on plain spots. boots, cape.
- **of Luck**: chance of +1 on a roll for a prize. trinket.
- **of the Road**: of HP back each time you roll. boots.
- **of Plenty**: stronger potions. trinket.

Prefixes, a plain lift that grows with rank: Fierce (attack), Arcane (magic), Sturdy (defense), Hearty (maxHp), Clever (maxMana).
