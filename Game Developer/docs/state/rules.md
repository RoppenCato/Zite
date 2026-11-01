# The rules (`rules/`)

The game as a pure function: `apply(state, action, rng, now) → { state, events }`. No screen, no socket, no clock of its
own (the holder passes `now` in milliseconds), no `Math.random`, no packages: the test `rules/test/purity.test.ts` reads
the source and refuses any of those. The state passed in is never changed; a new one comes back. The same code runs in
the browser (solo, `client/src/local-game.ts`) and in the server's region actor (`server/src/region-actor.ts`). Import
from `rules/src/index.ts`, never from the files inside. The delta between two states and the protocol's message types live
here too, so the client and the server share them (`docs/state/protocol.md`).

| File | What it holds |
| --- | --- |
| `src/types.ts` | the state, the actions, the events, the reject reasons, `STATE_VERSION` (10) |
| `src/rng.ts` | the seeded random stream: `makeRng(seed)`, `resumeRng(state)`, `hashSeed` |
| `src/data.ts` | the numbers from `data/*.json`, typed |
| `src/world.ts` | `buildBoard(world)`: the board from the world's areas, hubs and roads (`docs/state/world.md`); `addArea`, `addRoad`, `setBounds`, `checkOpens` for the generator; `KIND_LETTERS`, `GROWN` |
| `src/generate.ts` | the world growing: `peekArea`, `generateArea`, `growBoard`, `cellFor`, `grownIndex`, `entryName` (`docs/state/world.md`) |
| `src/paths.ts` | `legalPaths`, `reachable`, `checkPath` (all taking the set of open areas), `nearestTown` |
| `src/gear.ts` | `stats` (the character with everything worn, and the powers of the uniques worn), `powers`, `plainGear`, `rollGear`, `rollRarity`, `makeUnique`, `rollUnique`, `uniquePool`, `rankName`, `rankStat`, `rankPrice`, `describeGear` |
| `src/fight.ts` | `creature(id, bestiary)`, `makeEnemy`, `startFight`, `freshFight`, `pickMove`, `intentEvent`, `pickOptions`, `fightRound`: one round of the fight; a boss's fall grows the board |
| `src/common.ts` | gold, healing, mana, xp and levels (`levelFor`, `gainXp`), the bag, `sellPrice` |
| `src/hints.ts` | `hintFor(state, space, player, now)`: what touching a spot says; `countdown` |
| `src/quests.ts` | the towns' errands: `newQuest`, `questProgress`, `questLine` |
| `src/game.ts` | `newGame`, `newWorld` (nobody in it yet), `apply`, `makeBoard`, `makeCharacter`, `MAX_NAME` (12); joining, the board, landing, the shop and the bag, dice cards, the gamble, the tick |
| `src/delta.ts` | `diffState(before, after)`: what changed, by reference, or null; `mergeDelta`, `mergeDeltas` |
| `src/protocol.ts` | `PROTOCOL_VERSION` (1), `MAX_FRAME`, `RATE`, `BATCH_MS`, and the message types both sides import (`docs/state/protocol.md`) |
| `src/save.ts` | `migrate(raw)`: a stored state up to the current version (1 to 4 through 5, then 6, 7, 8, 9, 10), or null |
| `data/world.json` | the world: three hand-laid areas by tier, their hubs, roads and mobs; the passages between them; Queen Bumble's Hive opens `gen-1` |
| `data/themes.json` | the grown areas: the eight themes with their names, adjectives and creatures, the words for places, the four creature shapes, the base numbers and the growth a tier, the cell |
| `data/spaces.json` | the kinds of spot: label, road letter, the hint, how long a used spot waits |
| `data/enemies.json` | every creature: level, role (mob, mini, boss), numbers, xp and gold, its moves (with effects to read), a boss's second phase |
| `data/classes.json` | each class: numbers, growth a level, the starting kit of abilities, the style line, its meter (Rage, Combo, Flow, Focus) |
| `data/abilities.json` | every ability (six a class): class, mana, meter cost, text, three ranks of effect |
| `data/gear.json` | ten ranks by tier and the growth beyond them, each slot's base and numbers, rarities (with their affix counts; unique never rolled), affixes, the proper names, drop, unique and sell odds, the bag's limit (12) |
| `data/uniques.json` | the uniques: slot, earliest tier, power, value, text |
| `data/items.json` | the potion (four tenths of max HP), the mana potion (half the mana) and the four dice cards: text and price |
| `data/quests.json` | the errands: how many are carried, the town's wait, the four kinds with their counts, pay and unique chance |
| `data/surprises.json` | what a wild spot holds, as weights (a fight, a chest, a merchant, a gamble, a mini-boss, the theme's event) |
| `data/events.json` | the themes' events on wild spots: a line and what it does |
| `data/shapes.json` | two more shapes for the generator, each with a locked vault |
| `data/progression.json` | the xp table, crits, flee, death, charge, mana a round, the guards, chests, the gamble, spawns, the world boss, the notes |
| `data/traces.json` | the four notes a player may leave on a spot |
| `data/dice.json` | the die: 6 sides |
| `test/fixtures/ring.json`, `ring.ts` | the first twelve-spot ring in today's shape, kept as a test board: `ringBoard()` |
| `test/fixtures/grown.ts` | `grownWorld(seed, count)`: the world grown `count` areas, for the board checks |

## The state

```
GameState { version: 10, seed, board, characters: { [id]: Character }, die, spawns: { [space]: Spawn }, nextItem,
            traces: { [space]: Trace[] } }
Board     { start, width, height, spaces: { [id]: Space }, areas: { [id]: Area }, bestiary: { [id]: EnemyData } }
Space     { id, kind, name, x, y, links, area, boss?, opens?, locked? }   x, y in world pixels; a road spot's name is ""
Area      { id, name, theme, tier, levels: [lo, hi], mobs, miniBosses, bounds }
Character { id, name, classId, level, xp, gold, hp, mana, maxHp, maxMana, attack, defense, space, steps, fight,
            items, equipment: { weapon, armour, helm, boots, trinket }, bag: GearItem[], abilities: { [id]: rank },
            opened: area ids, cooldowns: { [space]: until } (also charm, phoenix, quest:<town>), bossKills: { [space]: n },
            offer, quests: Quest[], picks: string[][], keys: { [area]: n } }
GearItem  { id, slot, rank, rarity, name, base, stats, affixes: Affix[], unique?, price }
Fight     { enemy, round, charged, attackUp, barrier, evade, space, spawn, shared?, meter, strikes, sureCrit, windup, companion,
            mark, trap, skip, poisoned, weak, used }
Enemy     { id, name, level, role, hp, maxHp, attack, defense, xp, gold, moves, charged, stunned, weakened, poison, next,
            armoured, evade, phase, phase2 }
Offer     { kind: 'gamble', stake } | { kind: 'quest', quest } | { kind: 'loot', gear }
Quest     { id (the town's space), kind: cull | chests | hunt | boss, town, area, target, count, done, gold, xp, unique, text }
Spawn     { kind: miniboss | merchant | worldboss, enemy, until, hp?, maxHp?, hitters?: { [player]: damage } }
Trace     { player, name, text, at }
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
the first area open. **6 (2026-10-31) made the world grow**: the board is rebuilt from today's data (Queen Bumble's Hive now
leads on) and the areas each character had opened are laid again; a character stays where it stood if that spot is
still there and in an open area, else goes to the start; the rest is kept as it was. **7 (2026-11-01) brought the
uniques, the meters and the intents**: a piece's one `affix` becomes its `affixes`, a fight in progress gains the
fields it did not have (meter 0, nothing in the air, the enemy's next move unknown until the round ends). **8
(2026-11-01) brought the errands, the trainer and the bag's limit**: a character gains `quests` and `picks`; a pick
that sat in `offer` moves to `picks`. **9 (2026-11-01) brought the locked vaults**: a character gains `keys`. A state
missing its seed or characters, or with a character of an unknown class, gives null; so does anything that is not a
state we know. The holder then starts a fresh game.

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
- **`pick { ability }`**: the answer to a level's pick of one ability in two (`picks[0]`, owed when a fight or an
  errand's pay crosses a level in `pickLevels`: 4, 8, 12, …; `pickOwed { options, level }`): the one chosen is learned,
  or gains a rank; the other waits for a shrine. `picked { ability, rank }`; `nothing to answer`, `no such ability`.
  The board waits with `answer first` while picks are owed, as for an offer.
- **`quest { accept }`**: the answer to a town's errand (`offer.kind === 'quest'`): taken (`questTaken`) into `quests`,
  or declined (`questDeclined`), and the town waits `cooldownMs` (10 minutes) before asking again.
- **`keep { choice: 'sell' | 'drop' }`**: the answer for a piece that found no room in the bag (`offer.kind ===
  'loot'`): sold for half its worth (`sold`) or left (`dropped`).
- **`buy { ability }`**: the trainer, standing in a **town**: an ability of the class not yet known for
  `training.learn` (60) times the tier, a rank for one known for `training.rank` (80) times the tier times the rank it
  has; `trained { ability, rank, price, gold }`; `not in a town`, `no such ability`, `not now` at the top rank, `not
  enough gold`.
- **`use { item: 'charm' }`**: no card but a worn Lucky Charm: the pending roll rolled again, once every five minutes
  (`cooldowns.charm`); `used`, `steps`; `not now` while it is spent, `no such item` without the charm.
- **`use { item, value? }`**: a dice card while a roll is pending and the board is free (below). A potion is not used
  here: it is the fight's `item` move.
- **`gamble { choice }`**: `high`, `low` or `pass`, answering a gambler's offer (below); `nothing to answer` otherwise.
- **`join { name, classId }`**: a new character for `player` at the start, the way `newGame` makes the first; `joined {
  name, classId, space }`. Sent by whoever makes accounts (the server; `newGame` for the solo game), never by a player.
  `already here` for a player who exists; `bad value` for an empty name (names are trimmed to `MAX_NAME`, 12) or an
  unknown class.
- **`trace { text }`**: a note on the spot the character stands on, one of the four lines in `traces.json` (`bad value`
  otherwise; `finish the fight first` in a fight): `traced { space, trace }`. One a player a spot (a new one replaces
  yours), newest first, three a spot at most; they fade after a day (the tick).
- **`tick`**: the world moves (below); sent by whoever holds the state, not by a player.

## What landing does (mine, 2026-10-31, after Robin's spot list of the same day)

| Kind | On landing | Events after `landed` |
| --- | --- | --- |
| town | HP and mana back to full; the shop and the trainer are open while you stand there; an errand paid, told or offered (below) | `rested { hp, mana }`, then `questDone`, `nothing { text }` or `offer` |
| shop | nothing by itself; the shop is open while you stand there | none |
| normal (the wilds) | what has spawned there, else a roll by `surprises.json`: a **fight** with one of the area's mobs (70), a **chest** (10), a **merchant** (8), a **gamble** (7), one of the area's **mini-bosses** (5), **the theme's event** (8, `events.json`: a line, then a share of HP or mana, gold by the tier, a flask or a card; a hurt never takes the last point) | `fight`, or `chest …`, `merchant`, `offer`, `themeEvent { text, kind, amount }` and what followed |
| chest | gold (`chest.gold` times the tier), gear of the tier's rank with a chance, a potion or a card with a chance; then empty for 5 minutes | `chest`, `gold`, `loot`, `found`; later `empty { until }` |
| potion (spring) | one potion and one mana potion; then dry for 3 minutes | `found`, `found`; later `empty` |
| chest, locked (a grown area's vault) | with the area's key (its mini-boss drops one, `keyFound`): the key spent, three times the gold, a piece never under epic, a unique three times in ten; without: `locked { mini }` and nothing | `locked`, or as a chest |
| spell (shrine) | a new ability of the class, else a rank for one known (up to 3), else nothing; then quiet for 10 minutes | `learned { ability, rank }` or `nothing`; later `empty` |
| boss | the boss fight, unless the boss is away (5 minutes after it fell, per character) | `fight`, or `nothing` |

A chest found in the wilds does not empty a spot. A gamble: the stake is `stakePerTier` times the tier, or all the gold
if less; nobody bothers the broke. **The gamble** is answered with `gamble`: a die, **high** (4 to 6) or **low** (1 to
3), double or nothing on the stake (`gambled { choice, roll, won, delta, gold }`), or `pass` (`nothing`). Until it is
answered the board waits. Every draw comes from the stream, so a walk that lands on one shifts the dice that follow.

## The towns' errands (mine, 2026-11-01, from Robin's list: quests in towns give direction between bosses)

`quests.json`. **Landing in a town** with no errand from it, none owed from a decline or a turn-in in the last ten
minutes, fewer than `maxActive` (3) carried and nothing else pending, offers one: **cull** (thin a creature of the area,
3 to 5 of them), **chests** (open 2 or 3 in the area), **hunt** (the area's mini-boss), **boss** (the area's boss), by
weight 50 / 25 / 15 / 10; a kind the area cannot give falls back to culling. It pays the kind's gold and xp times the
tier times the count (a cull of four Slimes in the meadows: 48 gold, 32 xp), and a hunt or a boss adds a unique of the
tier one time in four or one in two. **Progress** is counted where it happens: a creature beaten in any fight
(`questProgress`), a chest opened in the area (a chest spot or a wild spot's chest). **Back in the town** with it done:
`questDone`, the gold, the xp (with its levels and picks), the loot; then the town waits ten minutes before asking
again. Unfinished, the town says how it stands (`nothing { text }`); the hint on the town does too. One errand a town,
kept by the town's space id.

## Items: the shop, the potions, the dice cards (the brief's dice cards, "found or bought")

`data/items.json`: a **Potion** (25 gold, heals four tenths of max HP in a fight; drinking it is the round), a **Mana
Potion** (25, half the mana back) and four dice cards: **Reroll**
(20), **+1** (12), **−1** (12, never below one), **Exactly N** (40). A dice card needs a roll pending and the board free
(`not now` otherwise): Reroll draws `rng.int(sides)` again; +1 adds one (a walk of seven is allowed, no board has a dead
end that would strand it); −1 takes one; Exactly N sets `value`, a whole number from 1 to the die's sides (`bad value`).
Events `used { item }`, `steps { steps }`; the die shows the new number. One fewer each use; `none left`; `no such item`.
Potions and cards are also found in chests (a potion, a mana potion or a card: 40 / 20 / 40) and dropped by creatures
(`consumableDrop`); a spring gives one flask of each.

## Gear (Robin, 2026-10-31: randomized, tiered, named; five slots; numbers mine)

Slots: weapon, armour, helm, boots, trinket. A piece has a **rank** by tier (Copper 1, Iron 2, Steel 3, Mithril 4,
Adamant 5, Runed 6, Dragonbone 7, Starforged 8, Voidsteel 9, Sunmetal 10, then "Rank 11", …) and a **rarity**
(common, uncommon, rare, epic, legendary, weights 60 / 25 / 10 / 4 / 1), its one number from the slot's table times the
rarity's multiplier (1, 1.2, 1.45, 1.75, 2.2) swung 15 percent either way: weapon attack 4 / 8 / 13, armour defense
3 / 6 / 10, helm HP 12 / 24 / 40, boots defense 2 / 4 / 7, trinket mana 6 / 12 / 20, and past each table ×1.35 a
rank (`rankStat`), the price ×1.8 a rank (`rankPrice`). **Rare and up carry an affix**
(crit chance, lifesteal, dodge, thorns, vigor), **a legendary two**; **epic and legendary carry a proper name**
("Stormborn, iron sword"). Prices: the slot's price for the rank times the rarity's multiplier; shops sell the plain
common piece of their area's rank. **Drops** (Robin, 2026-10-31: bosses as such give better loot): a mob 12 percent, a
mini-boss 50 percent and **rare or better**, a boss always and **epic or better**; a chest 35 percent. The bag has no
limit yet.

**Uniques** (Robin, 2026-10-31: loot with effects that change how you play; the pieces are mine, `uniques.json`, 23 of
them): a rarity of their own, never rolled by chance, with a proper name, a unique's number (×1.9, swung), one affix and
a **power** the rules read by name. A fallen boss's drop is a unique half the time, a mini-boss's one in ten, from the
pool of every unique whose tier is the area's or lower, rolled at the area's rank. Weapons: **Twinfang** (Attack strikes
twice at 0.6), **Quickdraw** (the first hit of a fight is a sure crit and the enemy holds back that round),
**Frostbrand** (every hit chills: the enemy's next blow at 0.8), **Venomtooth** (every hit poisons two rounds at 0.3),
**Mindshard** (abilities cost half, hit at 0.8), **Gorefang** (up to 0.6 more attack as HP is missing), **Stormcaller**
(every third hit a sure crit), **Sunblade** (minis and bosses ×1.3). Armour: **Wardweave** (the first wound-up blow of a
fight misses), **Mirrormail** (a blocked blow throws half of what was blocked back), **Thornhide** (blows 0.3 softer
under half HP). Helms: **Phoenix Helm** (once a fight, dropped under a quarter: healed 0.3), **Sage's Crown** (xp
×1.5), **Ironbrow** (poison and weakening shrugged off, a crit only a hit). Boots: **Striders** (a one is a two),
**Windstep** (the first blow of a fight misses), **Pathfinders** (chests, springs, shrines give again in half the time).
Trinkets: **Miser's Coin** (gold ×2, xp ÷2), **Heartstone** (a twentieth of HP back each round), **Sapphire Tear** (+3
mana a round), **Lucky Charm** (a re-roll every five minutes), **Phoenix Feather** (when you would fall, up again with
half HP, once every half hour, `cooldowns.phoenix`), **Wolf Totem** (every meter point a one-in-four chance of a second).
`stats(c).powers` carries the worn powers to the fight and the board; `describeGear` says what a unique does.

## The fight (Robin, 2026-10-31: a turn-based RPG with a defensive choice; moves, guards and numbers mine)

A fight is one character against one creature, held on the character as `fight` until it ends. A round is one
`fight { move, guard }`: **a spell in the air lands, the player's move, then the enemy's poison bites, then the enemy's
turn**, unless it is dead, the player got away, it is stunned, caught in time, or it is the first round against a class
(or a Quickdraw) that strikes first. The guard is read when the blow comes. Then the companion strikes, the player's
poison bites, effects count down, the meter and the mana move (`manaPerRound` 2), and **the enemy's next move is chosen
and told** (`intent { move, effect, charge }`, also on `enemy.next`), so the guard of the next round is chosen for
something (Robin, 2026-10-31: enemies that ask for the guard choice).

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
- **The enemy's turn**: the move it told (the first chosen when the fight begins on the board, else by weight from
  `enemies.json` or the bestiary). A move marked `charge` is a **wind-up**: no blow this round (`charged { by: 'enemy',
  move }`), and the next blow carries that move's name and hits `enemyCharge` 2.5 times as hard. Every mini-boss and
  boss has one; read the intent and block it. A move with an **effect** does it when its blow lands (a move of power 0
  is all effect, no blow): **poison** (the player bitten at each round's end for 3 rounds at 0.25 of the enemy's
  attack), **drain** (6 mana), **weaken** (the player's hits at 0.7 for 2 rounds), **armour** (the enemy's defense
  ×1.5 for 2 rounds), **evade** (the player's next hit misses), **heal** (a tenth of its HP). A stunned enemy skips
  (`skipped { reason }`: stunned, warped by Time Warp, trapped); a weakened one hits for `mult` of its power.
  **Mini-bosses and bosses shrug off stuns** (`resisted`): the simulation found a Shield Bash every other round robbed
  King Goo of the fight. **A boss under half its HP enters its second phase** (`phase { text }`): new moves with the
  theme's twist (King Goo's thorns burst, the Grumblebark regrows, Queen Bumble's heart freezes over; a grown boss
  takes its theme's rage move), once a fight.
- **The meter** (`fight.meter`, `meter { name, value, max }`): the class's resource, filled by its rule (the classes
  table), spent by the abilities marked `meter` or `meterAll` (`not enough meter`); a Wolf Totem adds a point now and
  then. **Once-a-fight** abilities and powers are remembered in `fight.used` (`already used`).
- **Abilities** (`abilities.json`, three ranks each, six a class; the class's kit at rank 1 from the start, the rest
  from shrines and the levels' picks). Warrior: **Heavy Blow** (1.6 / 1.85 / 2.1, 4 mana), **Shield Bash** (0.8 and a
  stun on a mob, 6), **War Cry** (hits harder ×1.3 for 3 rounds, 5), **Execute** (3 Rage: 1.4, or 3.2 on a foe under a
  third), **Rally** (2 Rage, 4 mana: heal a fifth of max HP and ×1.2 for 2 rounds), **Shield Wall** (5: a barrier worth
  a quarter of max HP). Rogue: **Backstab** (1.2 with a 60 percent crit, 4), **Poison Blade** (0.8 and a poison of 0.5
  of the attack for 3 rounds, 5), **Shadowstep** (the next two blows miss, 6), **Smoke Bomb** (3 Combo, 3 mana: the
  next blow misses, the next hit a sure crit), **Pickpocket** (3, once a fight: 0.5 and half the enemy's purse,
  `stolen { gold, total }`), **Eviscerate** (all the Combo, 2 mana: 0.6 plus 0.45 a point). Mage: **Fireball** (2.0 /
  2.3 / 2.6, 8), **Frost Bolt** (1.1 and weakens to 0.7 for 2 rounds, 6), **Arcane Shield** (a barrier of 30, 7),
  **Time Warp** (3 Flow, 6 mana: the enemy loses its next turn, boss or not), **Meteor** (10: lands two rounds later at
  4.0, whatever is done meanwhile; `fight.windup`), **Mana Shield** (all the mana into a barrier at 1.5 a point).
  Ranger: **Volley** (three arrows at 0.7, 5), **Aimed Shot** (1.5 with a 35 percent crit, 5), **Snare** (a stun on a
  mob, 6), **Trap** (5: the enemy's next wind-up fails), **Hawk** (2 Focus, 6 mana: a hawk strikes at 0.4 at the end of
  every round for 3 rounds; `fight.companion`), **Mark** (4: the next 3 hits ×1.5; `fight.mark`). Events `mana { delta,
  mana }`, `meter`, `effect { target, kind, rounds }` (kinds: attackUp, weakened, stunned, poison, barrier, evade,
  armoured, mark, companion, windup, skip, trap, sureCrit), `poisoned { target }`, `drained`, `enemyHealed`,
  `revived { by }` (the Phoenix Helm, the Phoenix Feather).
- **Winning**: `won { xp, gold }`; the levels the xp table gives (`levelled`: the class's growth to HP, mana, attack and
  defense, the gains healed); the loot (above: `loot { gear }`, `found { item }`). A **boss on its spot**: `bossDown
  { space, until }` (5 minutes, per character), `bossKills` counted, and the area it opens added to `opened` with
  `opened { area }` the first time. A **spawned** mini-boss leaves the board (`despawned`).
- **Being beaten**: `died { town, lostGold }`: back on your feet in the nearest town by steps **through open areas**
  (the simulation found a character waking behind the Grumblebark's Glade), HP and mana full, a fifth of the gold gone
  (`deathGoldLoss`), gear kept (the brief's rule).

## The world's tick (Robin, 2026-10-31: random mini-bosses and events spawn from time to time)

`tick` is sent by the holder (the client once a minute and when the page comes back; the region actor on a timer). Spawns
past their time leave (`despawned`); with fewer than `spawns.cap` (2) on the board, a coin of `chancePerTick` (0.5) puts
one on a free wild spot of an open area nobody stands on: a mini-boss of the area (`miniboss` 0.7) or a merchant, for
`lifeMs` (10 minutes); `spawned { space, spawn }`. Landing there meets it. A tick that changes nothing gives the same
state back, so the actor's version does not move.

### The world boss (mine, 2026-11-01, from Robin's list: shared bosses; the gate bosses stay each player's own)

Now and then a tick (`worldBoss.chancePerTick`, 2 in 100, so about once in fifty minutes) when none is about brings
**the boss of the highest area anyone has opened** onto a free wild spot of that area, with **HP for a crowd**
(`hpMult` 2.5 times the boss's) and a window (`lifeMs`, 30 minutes): `spawned` with `kind: 'worldboss'`, `hp`, `maxHp`
and an empty tally of `hitters`. **Everyone who lands there fights the same beast**: the fight is the usual one
(`fight.shared`), but each round reads the HP from the spawn first (others may have hit it since) and writes it back
after, with the damage dealt added to the player's tally; a round against a beast already gone ends the fight with
`nothing: "The beast is gone."`. **When it falls**, everyone in the tally is paid **by their share of the damage**, never
under `minShare` (a quarter): xp and gold of the boss times the share, and a boss's drop roll each (a unique half the
time), the picks owed by the levels crossed; the one who struck the last blow gets the usual `won` and loot events, the
others' pieces change in the same action and their fights on it end; `worldBossDown { space, enemy, shares }` and
`despawned`. **When its time is up** the tick takes it away and lets go whoever was still fighting it (`bossLeft { space,
enemy, players }`). The bots meet it like any spawn. In solo play it comes just the same, a big fight for one.

## Hints (Robin, 2026-10-31: touching a spot tells what you could meet, not everything)

A wild spot with a world boss says so with its HP left and its time; **every spot's hint ends with the notes left there**
(`traceLine`: who, what, how long ago).

`hintFor(state, space, player, now)`: the spot's name and area; the wilds say the levels, which creatures roam there and
that gear of the rank turns up now and then, and whether something prowls or camps there; a chest, a spring or a shrine
say what they give and how long until they give again; a boss says its name and level, what it opens, and when it is
back; a closed area says which boss opens it. What a wild spot holds this time is never told.

## The die and the random stream

mulberry32: a 32-bit state, `next()` in [0, 1), `int(sides)` from 1 to `sides`. `makeRng('ashford')` rolls 2, 1, 5, 6, 6, 6,
6, 4 on a six-sided die; the tests pin these. `rng.state` is the position, one integer, so the client's save and the server's
SQLite row can store it and `resumeRng` carries on with the same dice. A string seed is hashed with FNV-1a.

## The classes (mine, 2026-10-31: first settings)

| Class | HP | Mana | Attack | Defense | Crit | Dodge | Gold | A level brings | Kit from the start | Meter (`meterMax` 5) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warrior | 120 | 20 | 12 | 8 | 10 % | – | 50 | +12 HP, +2 mana, +2 attack, +1 defense | Heavy Blow, Shield Bash | **Rage**: a point for every blow taken, two for a wound-up one |
| Rogue | 100 | 25 | 9 | 6 | 25 % | 25 % | 60 | +10, +3, +2, +1 | Backstab, Poison Blade | **Combo**: a point for every hit landed |
| Mage | 85 | 40 | 14 | 4 | 10 % | – | 50 | +9, +5, +2, +1 | Fireball, Frost Bolt | **Flow**: a point every round |
| Ranger | 100 | 25 | 8 | 6 | 15 % | 5 % | 50 | +10, +3, +2, +1 | Volley, Aimed Shot; strikes first | **Focus**: a point for every blow that misses you and every crit |

Six abilities a class (Robin, 2026-10-31: kits that feel different and exciting; the kits are mine): the two of the
start, the rest from shrines and from **the pick of one in two at levels 4, 8, 12, 16, 20, 24 and 28**, so two
characters of a class grow apart. Levels: 2 at 30 xp, 3 at 80, 4 at 160, 5 at 280, 6 at 440, 7 at 650, 8 at 920, 9 at
1250, 10 at 1650, 15 at 4900, up to 30 at 29650.

## Balance (mine, 2026-10-31, from `tools/simulate.ts`)

`node tools/simulate.ts [turns] [seeds]` plays a bot of each class from Puddlewick Village under a plain policy (fight, rest when
worn, buy the plain gear of the area, learn at shrines) and then throws each class at each boss, the three hand-laid
and the first three grown, level by level, in the plain gear of the rank with two potions. It found the first numbers
far too easy (no deaths, the level cap in a hundred turns, a level-one character beating King Goo) and a stun-lock;
the numbers above are the retune. Where it stands:

- A bot reaches level 5 around turn 55 and level 8 around turn 160; a careful bot rarely dies in the wilds of its own
  level and leaves a level-appropriate fight with nine tenths of its HP.
- **The King Goo** (level 6): nobody wins at level 1 or 2; at level 4 in copper the Warrior and the Mage win
  nine times in ten, the Ranger four, the Rogue three; at level 5 everyone but the Rogue wins nine in ten, the Rogue eight.
  Without gear at level 6 the Warrior and the Mage still win; the Rogue and the Ranger win three in ten.
- **The Grumblebark** (level 10): at level 9 in iron the Warrior, the Mage and the Ranger win six to nine in ten, the
  Rogue two; the Rogue catches up at 11.
- **The Queen Bumble** (level 14): at level 14 in steel the Warrior, the Mage and the Ranger win eight to nine in
  ten, the Rogue four. The Rogue is the weakest against bosses and the safest in the wilds; a thing to feel, not to fix
  from a table.
- **The grown bosses** (the Lord Ripplefin at 18, the Abyssal Leviathan at 22, the Bog King at 26, from the seed `sim`):
  at the boss's own level in the rank's plain gear (mithril, adamant, runed) the Warrior, the Mage and the Ranger win
  nine in ten, the Rogue about half; two levels under, half to eight in ten. **The growth a tier** in `themes.json`
  (HP ×1.25, attack ×1.15, defense ×1.12) was set by this wall: at ×1.3 / ×1.18 / ×1.15 the same fight fell from nine in
  ten at tier 4 to four in ten at tier 6 and one in ten at tier 8; at the numbers kept it stays level through tier 9
  and then eases, because gear past the tables grows ×1.35 a rank (`docs/idea-bank.md`, 16).
- **The pace**: a bot reaches level 8 around turn 160, level 10 around 260 and level 14 around 300 to 400; in 500
  turns a few bots in thirty-two beat Queen Bumble and walk into Glimmerlake Shores. A bot in a grown area at its level dies
  about as rarely as in Honeyhill Fields and leaves a fight with six tenths of its HP.
- **With the kits, the uniques and the readable enemies (2026-11-01)** the wall was run again with what a character of
  the level would have: every ability of its class, at rank 2 from level 8 and rank 3 from 16 (picks and shrines). The
  first kits were far too strong (a Rally every two Rage healed a warrior through anything: nine in ten at the
  Queen Bumble five levels under); the kits were reined in (Rally and Execute cost 3 Rage, Time Warp 4 Flow, Trap and
  Shield Wall more mana, Mark and the Hawk softer) and **the bosses grew a tenth in HP** (`enemies.json`, `themes.json`:
  King Goo 550, Grumblebark 935, Queen Bumble 1320, grown base 1320; minis a tenth too). Where it stands at the boss's own
  level in the rank's plain gear: King Goo 100 / 93 / 97 / 80 (Warrior / Rogue / Mage / Ranger), the Grumblebark
  97 / 90 / 78 / 65, Queen Bumble 98 / 90 / 95 / 95, the Tyrant 98 / 88 / 75 / 100, the Leviathan 98 / 98 / 92 / 100,
  the Bog King 98 / 100 / 85 / 100; two levels under, half to eight in ten; four under, only the Warrior. The Ranger's
  rank-3 kit (a Mark on a four-arrow Volley, a Trap for every wind-up) makes it the strongest past tier 4 and the Mage
  the softest: a thing to feel before it is tuned from a table.
- **With the errands and the trainer (2026-11-01)** the bots take every errand and sell what the bag cannot hold; the
  errands' xp brings level 8 around turn 140 and level 14 around 300, and three bots in thirty-two beat Queen Bumble
  in 500 turns. The bots do not train yet.

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
| `test/kits.test.ts` | the four meters and what fills them; every new ability of every class; the pick of one in two: its options, when it is asked, how it is answered and refused |
| `test/enemies.test.ts` | the intent told at the start and every round and used the round after; a wind-up told as one; every effect (poison and Ironbrow, drain, weaken, armour, evade, heal); every family has something to read; the bosses' second phases, hand-laid and grown |
| `test/uniques.test.ts` | every unique's shape and every power's unique; making one; a legendary's two affixes; what bosses, minis and mobs drop; every power in play; a version-6 save coming up to date |
| `test/quests.test.ts` | the errands: offered, every kind drawn, taken and declined with the town's wait, moved along by fights and chests, paid in town; the trainer's prices and refusals; the bag's limit, its question and the sale on the spot; the flasks by share and the spring's two |
| `test/vaults.test.ts` | every theme's event and what it does (a hurt never to the last point); the two shapes with their vaults among the generator's; a vault locked, its key from the mini-boss once, its richer loot with the key spent; a version-8 save coming up |
| `test/items.test.ts` | the shop (consumables, plain gear by rank, towns and merchants, refusals), selling, equip, unequip, drop, the dice cards |
| `test/coop.test.ts` | the world boss: coming with a tick in the highest open area with HP for a crowd and only one at a time; fought together with the HP read and written back and the damage tallied; paid by share with the floor when it falls, fights ended, spot cleared; leaving on time; a round against one already gone; the hint. The notes: left, replaced, capped, faded, refused, read on a tap, in the delta. A version-9 save coming up |
| `test/shared.test.ts` | joining (a second character at the start, the refusals, two players rolling from one stream); the delta (null when nothing changed, the acting character and the die after a roll, the spawns after a tick, the whole board when a boss lays an area, bundling); two bots playing six hundred actions on the world with ticks between, a client folding every delta ending with exactly the server's state |
| `test/purity.test.ts` | no `Math.random`, `Date`, timers, DOM, storage, network, console or package imports in `rules/src` |

Every new mechanic starts with a test of this shape: given a state, an action, a seed and a clock, this is the state and
these are the events (the skill `shared-world`).
