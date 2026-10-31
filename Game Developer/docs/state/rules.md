# The rules (`rules/`)

The game as a pure function: `apply(state, action, rng, now) → { state, events }`. No screen, no socket, no clock of its
own (the holder passes `now` in milliseconds), no `Math.random`, no packages: the test `rules/test/purity.test.ts` reads
the source and refuses any of those. The state passed in is never changed; a new one comes back. The same code runs in
the browser (solo, `client/src/local-game.ts`) and in the server's region actor (`server/src/region-actor.ts`). Import
from `rules/src/index.ts`, never from the files inside.

| File | What it holds |
| --- | --- |
| `src/types.ts` | the state, the actions, the events, the reject reasons, `STATE_VERSION` (6) |
| `src/rng.ts` | the seeded random stream: `makeRng(seed)`, `resumeRng(state)`, `hashSeed` |
| `src/data.ts` | the numbers from `data/*.json`, typed |
| `src/world.ts` | `buildBoard(world)`: the board from the world's areas, hubs and roads (`docs/state/world.md`); `addArea`, `addRoad`, `setBounds`, `checkOpens` for the generator; `KIND_LETTERS`, `GROWN` |
| `src/generate.ts` | the world growing: `peekArea`, `generateArea`, `growBoard`, `cellFor`, `grownIndex`, `entryName` (`docs/state/world.md`) |
| `src/paths.ts` | `legalPaths`, `reachable`, `checkPath` (all taking the set of open areas), `nearestTown` |
| `src/gear.ts` | `stats` (the character with everything worn), `plainGear`, `rollGear`, `rollRarity`, `rankName`, `rankStat`, `rankPrice`, `describeGear` |
| `src/fight.ts` | `creature(id, bestiary)`, `makeEnemy`, `startFight`, `fightRound`: one round of the fight; a boss's fall grows the board |
| `src/common.ts` | gold, healing, mana, xp and levels (`levelFor`, `gainXp`), the bag, `sellPrice` |
| `src/hints.ts` | `hintFor(state, space, player, now)`: what touching a spot says; `countdown` |
| `src/game.ts` | `newGame`, `apply`, `makeBoard`, `makeCharacter`; the board, landing, the shop and the bag, dice cards, the gamble, the tick |
| `src/save.ts` | `migrate(raw)`: a stored state up to the current version (1 to 4 through 5, and 5 to 6), or null |
| `data/world.json` | the world: three hand-laid areas by tier, their hubs, roads and mobs; the passages between them; the Summit opens `gen-1` |
| `data/themes.json` | the grown areas: the eight themes with their names, adjectives and creatures, the words for places, the four creature shapes, the base numbers and the growth a tier, the cell |
| `data/spaces.json` | the kinds of spot: label, road letter, the hint, how long a used spot waits |
| `data/enemies.json` | every creature: level, role (mob, mini, boss), numbers, xp and gold, its moves |
| `data/classes.json` | each class: numbers, growth a level, the starting kit of abilities, the style line |
| `data/abilities.json` | every ability: class, mana, text, three ranks of effect |
| `data/gear.json` | ten ranks by tier and the growth beyond them, each slot's base and numbers, rarities, affixes, the proper names, drop and sell odds |
| `data/items.json` | the potion and the four dice cards: text and price |
| `data/surprises.json` | what a wild spot holds, as weights |
| `data/progression.json` | the xp table, crits, flee, death, charge, mana a round, the guards, chests, the gamble, spawns |
| `data/dice.json` | the die: 6 sides |
| `test/fixtures/ring.json`, `ring.ts` | the first twelve-spot ring in today's shape, kept as a test board: `ringBoard()` |
| `test/fixtures/grown.ts` | `grownWorld(seed, count)`: the world grown `count` areas, for the board checks |

## The state

```
GameState { version: 6, seed, board, characters: { [id]: Character }, die, spawns: { [space]: Spawn }, nextItem }
Board     { start, width, height, spaces: { [id]: Space }, areas: { [id]: Area }, bestiary: { [id]: EnemyData } }
Space     { id, kind, name, x, y, links, area, boss?, opens? }   x, y in world pixels; a road spot's name is ""
Area      { id, name, theme, tier, levels: [lo, hi], mobs, miniBosses, bounds }
Character { id, name, classId, level, xp, gold, hp, mana, maxHp, maxMana, attack, defense, space, steps, fight,
            items, equipment: { weapon, armour, helm, boots, trinket }, bag: GearItem[], abilities: { [id]: rank },
            opened: area ids, cooldowns: { [space]: until }, bossKills: { [space]: n }, offer }
GearItem  { id, slot, rank, rarity, name, base, stats, affix, price }
Fight     { enemy, round, charged, attackUp, barrier, evade, space, spawn }
Enemy     { id, name, level, role, hp, maxHp, attack, defense, xp, gold, moves, charged, stunned, weakened, poison }
Spawn     { kind: miniboss | merchant, enemy, until }
Die       { sides, last }
```

`steps` is what the character still owes from the last roll; 0 means no roll is pending. `maxHp`, `maxMana`, `attack`
and `defense` are the **base** from the class and the levels; `stats(character)` adds what is worn (and the affixes:
crit, dodge, lifesteal, thorns, vigor). The random stream is **not** in the state: whoever holds the state holds the
stream (shared-world rule 5). `seed` is the world's seed: the grown areas are laid from it. The board grows with the
game (`docs/state/world.md`); `bestiary` holds the grown areas' creatures, beside `enemies.json`. `nextItem` numbers the
gear.

**Versions.** 2 (2026-10-31) replaced the ring with an island; 3 brought the fight; 4 brought the bag;
**5 (2026-10-31) replaced the island with the world in areas** and brought bosses on the board, gear, mana and
abilities. `migrate` takes any older state up: the board is rebuilt, every character keeps its name, class, level, xp,
gold and consumables, stands on the start again with full HP and mana, nothing worn, its class's starting kit, and only
the first area open. **6 (2026-10-31) made the world grow**: the board is rebuilt from today's data (the Summit now
leads on) and the areas each character had opened are laid again; a character stays where it stood if that spot is
still there and in an open area, else goes to the start; the rest is kept as it was. A state missing its seed or
characters, or with a character of an unknown class, gives null; so does anything that is not a state we know. The holder
then starts a fresh game.

## The actions

Every action carries `id` (made by the client, a UUID) and `player`. A repeat of an id is the holder's business (the
region actor stores answers by id). A refused action returns the **same** state object and one
`rejected { action, player, reason }` event. Nothing throws.

- **`roll`**: refused with `finish the fight first`, `answer first` (the gambler's question is open) or `finish your move
  first`. Otherwise `rng.int(die.sides)`; `die.last` and `steps` become the value; event `rolled { value }`.
- **`move { path }`**: every spot stepped on, in order, ending on the landing spot. Refused when the board is not free,
  with `roll first` when `steps` is 0, `wrong number of steps`, `no such space`, `not connected`, `no turning back` (mine:
  the Dokapon rule, so a roll cannot be wasted by shuffling back and forth), and **`that way is closed`** when a step
  enters an area the character has not opened. On success: `moved { from, path }`, `landed { space, kind }`, then what
  the spot does (below), all in the one action. `legalPaths`, `reachable` and `checkPath` take the set of open areas.
- **`fight { move, guard }`**: one round (below).
- **`buy { item }` or `buy { slot }`**, **`sell { gear }`**: at a shop (standing on a shop or a town, or where a merchant
  has camped), not in a fight. A consumable for its price; the **plain common piece of the area's rank** for a slot;
  a piece from the bag sold for half its worth (`sellShare`). Refused with `not at a shop`, `not enough gold`, `no such
  item`, `no such gear`.
- **`equip { gear }`**, **`unequip { slot }`**, **`drop { gear }`**: the bag and the five slots, not in a fight; what
  was worn goes back to the bag; HP and mana are capped at the new maximum. `no such gear` otherwise.
- **`use { item, value? }`**: a dice card while a roll is pending and the board is free (below). A potion is not used
  here: it is the fight's `item` move.
- **`gamble { choice }`**: `high`, `low` or `pass`, answering a gambler's offer (below); `nothing to answer` otherwise.
- **`tick`**: the world moves (below); sent by whoever holds the state, not by a player.

## What landing does (mine, 2026-10-31, after Robin's spot list of the same day)

| Kind | On landing | Events after `landed` |
| --- | --- | --- |
| town | HP and mana back to full; the shop is open while you stand there | `rested { hp, mana }` |
| shop | nothing by itself; the shop is open while you stand there | none |
| normal (the wilds) | what has spawned there, else a roll by `surprises.json`: a **fight** with one of the area's mobs (70), a **chest** (10), a **merchant** (8), a **gamble** (7), one of the area's **mini-bosses** (5) | `fight`, or `chest …`, `merchant`, `offer` |
| chest | gold (`chest.gold` times the tier), gear of the tier's rank with a chance, a potion or a card with a chance; then empty for 5 minutes | `chest`, `gold`, `loot`, `found`; later `empty { until }` |
| potion (spring) | one potion; then dry for 3 minutes | `found`; later `empty` |
| spell (shrine) | a new ability of the class, else a rank for one known (up to 3), else nothing; then quiet for 10 minutes | `learned { ability, rank }` or `nothing`; later `empty` |
| boss | the boss fight, unless the boss is away (5 minutes after it fell, per character) | `fight`, or `nothing` |

A chest found in the wilds does not empty a spot. A gamble: the stake is `stakePerTier` times the tier, or all the gold
if less; nobody bothers the broke. **The gamble** is answered with `gamble`: a die, **high** (4 to 6) or **low** (1 to
3), double or nothing on the stake (`gambled { choice, roll, won, delta, gold }`), or `pass` (`nothing`). Until it is
answered the board waits. Every draw comes from the stream, so a walk that lands on one shifts the dice that follow.

## Items: the shop, the potion, the dice cards (the brief's dice cards, "found or bought")

`data/items.json`: a **Potion** (25 gold, heals 50 in a fight; drinking it is the round) and four dice cards: **Reroll**
(20), **+1** (12), **−1** (12, never below one), **Exactly N** (40). A dice card needs a roll pending and the board free
(`not now` otherwise): Reroll draws `rng.int(sides)` again; +1 adds one (a walk of seven is allowed, no board has a dead
end that would strand it); −1 takes one; Exactly N sets `value`, a whole number from 1 to the die's sides (`bad value`).
Events `used { item }`, `steps { steps }`; the die shows the new number. One fewer each use; `none left`; `no such item`.
Potions and cards are also found in chests and dropped by creatures (`consumableDrop`).

## Gear (Robin, 2026-10-31: randomized, tiered, named; five slots; numbers mine)

Slots: weapon, armour, helm, boots, trinket. A piece has a **rank** by tier (Copper 1, Iron 2, Steel 3, Mithril 4,
Adamant 5, Runed 6, Dragonbone 7, Starforged 8, Voidsteel 9, Sunmetal 10, then "Rank 11", …) and a **rarity**
(common, uncommon, rare, epic, legendary, weights 60 / 25 / 10 / 4 / 1), its one number from the slot's table times the
rarity's multiplier (1, 1.2, 1.45, 1.75, 2.2) swung 15 percent either way: weapon attack 4 / 8 / 13, armour defense
3 / 6 / 10, helm HP 12 / 24 / 40, boots defense 2 / 4 / 7, trinket mana 6 / 12 / 20, and past each table ×1.35 a
rank (`rankStat`), the price ×1.8 a rank (`rankPrice`). **Rare and up carry an affix**
(crit chance, lifesteal, dodge, thorns, vigor); **epic and legendary carry a proper name** ("Stormborn, iron sword").
Prices: the slot's price for the rank times the rarity's multiplier; shops sell the plain common piece of their area's
rank. Drops: a mob 12 percent, a mini-boss 50 percent and never common, a boss always and never under rare; a chest 35
percent. The bag has no limit yet.

## The fight (Robin, 2026-10-31: a turn-based RPG with a defensive choice; moves, guards and numbers mine)

A fight is one character against one creature, held on the character as `fight` until it ends. A round is one
`fight { move, guard }`: **the player's move, then the enemy's poison bites, then the enemy's turn**, unless it is dead,
the player got away, it is stunned, or it is the first round against a class that strikes first (the Ranger). The guard
is read when the blow comes. Effects count down at the end; `manaPerRound` (2) trickles back.

- **A hit**: `round(attack × power) − floor(defense / 2)`, at least 1, plus a swing of −2 to +2 from the stream, doubled
  on a crit (the class's crit, else `baseCrit` 0.1, plus the gear's; `critPower` 2), never under 1.
  `hit { by, move, damage, crit, hp, absorbed }`.
- **The moves**: `attack` (power 1); `charge` (anyone: the next hit of any kind lands `charge` 2 times as hard, then the
  charge is spent; charging twice is `not now`); `ability { ability }` (below; `not enough mana`, `no such ability`);
  `item { item }` (a potion: `used`, `healed`, then the enemy's turn); `flee` (`fleeChance` 0.5; `fled { ok }`; a failed
  try costs the blow).
- **The guards**, chosen before the blow: `block` halves it (`guards.block` 0.5); `dodge` misses it `guards.dodge` 0.3
  plus the class's and the gear's dodge of the time (`missed`), else full (the Rogue's 0.25 makes dodging its guard);
  `brace` takes three quarters and gives `braceMana` 4; `counter` takes it in full and strikes back at `guards.counter`
  0.5 (`countered { damage, hp }`); `none` for a script. A barrier soaks first (`absorbed`); thorns bite back a share of
  what landed.
- **The enemy's turn**: a move by weight from `enemies.json`. A move marked `charge` is a **wind-up**: no blow this
  round (`charged { by: 'enemy', move }`), and the next blow carries that move's name and hits `enemyCharge` 2.5 times
  as hard. Every mini-boss and boss has one; read the status and block it. A stunned enemy skips (`skipped`); a weakened
  one hits for `mult` of its power. **Mini-bosses and bosses shrug off stuns** (`resisted`): the simulation found a
  Shield Bash every other round robbed the Warden of the fight.
- **Abilities** (`abilities.json`, three ranks each; the class's kit at rank 1 from the start, the rest learned at
  shrines): Warrior **Heavy Blow** (1.6 / 1.85 / 2.1, 4 mana), **Shield Bash** (0.8 and a stun on a mob, 6), **War Cry**
  (hits harder ×1.3 for 3 rounds, 5); Rogue **Backstab** (1.2 with a 60 percent crit, 4), **Poison Blade** (0.8 and a
  poison of 0.5 of the attack for 3 rounds, 5), **Shadowstep** (the next two blows miss, 6); Mage **Fireball** (2.0 /
  2.3 / 2.6, 8), **Frost Bolt** (1.1 and weakens to 0.7 for 2 rounds, 6), **Arcane Shield** (a barrier of 30, 7); Ranger
  **Volley** (three arrows at 0.7, 5), **Aimed Shot** (1.5 with a 35 percent crit, 5), **Snare** (a stun on a mob, 6). Events
  `mana { delta, mana }`, `effect { target, kind, rounds }`, `poisoned`.
- **Winning**: `won { xp, gold }`; the levels the xp table gives (`levelled`: the class's growth to HP, mana, attack and
  defense, the gains healed); the loot (above: `loot { gear }`, `found { item }`). A **boss on its spot**: `bossDown
  { space, until }` (5 minutes, per character), `bossKills` counted, and the area it opens added to `opened` with
  `opened { area }` the first time. A **spawned** mini-boss leaves the board (`despawned`).
- **Being beaten**: `died { town, lostGold }`: back on your feet in the nearest town by steps **through open areas**
  (the simulation found a character waking behind the Briar Gate), HP and mana full, a fifth of the gold gone
  (`deathGoldLoss`), gear kept (the brief's rule).

## The world's tick (Robin, 2026-10-31: random mini-bosses and events spawn from time to time)

`tick` is sent by the holder (the client once a minute and when the page comes back; the region actor on a timer). Spawns
past their time leave (`despawned`); with fewer than `spawns.cap` (2) on the board, a coin of `chancePerTick` (0.5) puts
one on a free wild spot of an open area nobody stands on: a mini-boss of the area (`miniboss` 0.7) or a merchant, for
`lifeMs` (10 minutes); `spawned { space, spawn }`. Landing there meets it. A tick that changes nothing gives the same
state back, so the actor's version does not move.

## Hints (Robin, 2026-10-31: touching a spot tells what you could meet, not everything)

`hintFor(state, space, player, now)`: the spot's name and area; the wilds say the levels, which creatures roam there and
that gear of the rank turns up now and then, and whether something prowls or camps there; a chest, a spring or a shrine
say what they give and how long until they give again; a boss says its name and level, what it opens, and when it is
back; a closed area says which boss opens it. What a wild spot holds this time is never told.

## The die and the random stream

mulberry32: a 32-bit state, `next()` in [0, 1), `int(sides)` from 1 to `sides`. `makeRng('ashford')` rolls 2, 1, 5, 6, 6, 6,
6, 4 on a six-sided die; the tests pin these. `rng.state` is the position, one integer, so the client's save and the server's
SQLite row can store it and `resumeRng` carries on with the same dice. A string seed is hashed with FNV-1a.

## The classes (mine, 2026-10-31: first settings)

| Class | HP | Mana | Attack | Defense | Crit | Dodge | Gold | A level brings | Kit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warrior | 120 | 20 | 12 | 8 | 10 % | – | 50 | +12 HP, +2 mana, +2 attack, +1 defense | Heavy Blow, Shield Bash |
| Rogue | 100 | 25 | 9 | 6 | 25 % | 25 % | 60 | +10, +3, +2, +1 | Backstab, Poison Blade |
| Mage | 85 | 40 | 14 | 4 | 10 % | – | 50 | +9, +5, +2, +1 | Fireball, Frost Bolt |
| Ranger | 100 | 25 | 8 | 6 | 15 % | 5 % | 50 | +10, +3, +2, +1 | Volley, Aimed Shot; strikes first |

Levels: 2 at 30 xp, 3 at 80, 4 at 160, 5 at 280, 6 at 440, 7 at 650, 8 at 920, 9 at 1250, 10 at 1650, up to 15 at 4900.

## Balance (mine, 2026-10-31, from `tools/simulate.ts`)

`node tools/simulate.ts [turns] [seeds]` plays a bot of each class from Ashford under a plain policy (fight, rest when
worn, buy the plain gear of the area, learn at shrines) and then throws each class at each boss, the three hand-laid
and the first three grown, level by level, in the plain gear of the rank with two potions. It found the first numbers
far too easy (no deaths, the level cap in a hundred turns, a level-one character beating the Warden) and a stun-lock;
the numbers above are the retune. Where it stands:

- A bot reaches level 5 around turn 55 and level 8 around turn 160; a careful bot rarely dies in the wilds of its own
  level and leaves a level-appropriate fight with nine tenths of its HP.
- **The Thornwood Warden** (level 6): nobody wins at level 1 or 2; at level 4 in copper the Warrior and the Mage win
  nine times in ten, the Ranger four, the Rogue three; at level 5 everyone but the Rogue wins nine in ten, the Rogue eight.
  Without gear at level 6 the Warrior and the Mage still win; the Rogue and the Ranger win three in ten.
- **The Briar King** (level 10): at level 9 in iron the Warrior, the Mage and the Ranger win six to nine in ten, the
  Rogue two; the Rogue catches up at 11.
- **The Frost Matriarch** (level 14): at level 14 in steel the Warrior, the Mage and the Ranger win eight to nine in
  ten, the Rogue four. The Rogue is the weakest against bosses and the safest in the wilds; a thing to feel, not to fix
  from a table.
- **The grown bosses** (the Molten Tyrant at 18, the Abyssal Leviathan at 22, the Bog King at 26, from the seed `sim`):
  at the boss's own level in the rank's plain gear (mithril, adamant, runed) the Warrior, the Mage and the Ranger win
  nine in ten, the Rogue about half; two levels under, half to eight in ten. **The growth a tier** in `themes.json`
  (HP ×1.25, attack ×1.15, defense ×1.12) was set by this wall: at ×1.3 / ×1.18 / ×1.15 the same fight fell from nine in
  ten at tier 4 to four in ten at tier 6 and one in ten at tier 8; at the numbers kept it stays level through tier 9
  and then eases, because gear past the tables grows ×1.35 a rank (`docs/idea-bank.md`, 16).
- **The pace**: a bot reaches level 8 around turn 170, level 10 around 280 and level 14 around 350 to 400; in 500
  turns three bots in thirty-two beat the Matriarch and walked into Emberfall, two of those on into Mistwater. A bot in
  a grown area at its level dies about as rarely as in Frostpeak and leaves a fight with six tenths of its HP.

Nothing here has been played; these are the first numbers to be felt and changed in `rules/data`.

## The tests (`npm test`, Vitest, in Node)

| File | Covers |
| --- | --- |
| `test/rng.test.ts` | the pinned sequences, resume from a stored state, every face comes up, `next()` stays in [0, 1) |
| `test/world.test.ts` | `buildBoard`: ids and chaining, link order, straight roads, the bow and its direction, the letters, passage roads and area bounds, every error, determinism |
| `test/board.test.ts` | the ring, the world and two worlds grown ten areas, sound and drawable (`docs/state/world.md`); the world's shape; the ring fixture |
| `test/generate.test.ts` | the grown areas: the peek, the cells, an area's shape, names and creatures, growth by tier, growing the board, the hints, a boss's fall laying the next area in play |
| `test/gear.test.ts` | rank names and the growth past the tables, plain pieces, rarity odds and the boost, rolled pieces within their bounds, `describeGear`, `stats` with every affix |
| `test/game.test.ts` | new games; roll, move and every refusal including a closed area; landing on every kind with its cooldown; the surprises' odds; the gamble; spawns on tick; `legalPaths` and `reachable`; three turns from a seed, whatever turns up; `migrate` from versions 1 to 5 |
| `test/fight.test.ts` | a round pinned from one seed for each class's kit; charge; the guards' arithmetic and the dodge's odds; shadowstep, barrier, war cry; mana and unknown abilities; wind-ups; lifesteal and thorns; flee; death with gear kept, waking only in an open area; levels; loot by role; a boss opening an area and counting its falls; a spawn cleared; the refusals |
| `test/items.test.ts` | the shop (consumables, plain gear by rank, towns and merchants, refusals), selling, equip, unequip, drop, the dice cards |
| `test/purity.test.ts` | no `Math.random`, `Date`, timers, DOM, storage, network, console or package imports in `rules/src` |

Every new mechanic starts with a test of this shape: given a state, an action, a seed and a clock, this is the state and
these are the events (the skill `shared-world`).
