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
| `data/classes.json` | each class: numbers, growth a level, the starting kit of abilities, the style line, its meter (Valor, Mischief, Arcana, Aim) |
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
            items, equipment: { weapon, shield, helm, armour, gloves, boots, cape, trinket }, bag: GearItem[], abilities: { [id]: rank },
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
- **`equip { gear }`**, **`unequip { slot }`**, **`drop { gear }`**: the bag and the eight slots, not in a fight; what
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
- **`use { item: 'charm' }`**: no card but a worn Rabbit's Foot: the pending roll rolled again, once every five minutes
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

`data/items.json`: a **Honey Tonic** (25 gold, heals four tenths of max HP in a fight; drinking it is the round), a **Mana
Honey Tonic** (25, half the mana back) and four dice cards: **Do-Over**
(20), **+1** (12), **−1** (12, never below one), **Fairy Pick** (40). A dice card needs a roll pending and the board free
(`not now` otherwise): Do-Over draws `rng.int(sides)` again; +1 adds one (a walk of seven is allowed, no board has a dead
end that would strand it); −1 takes one; Fairy Pick sets `value`, a whole number from 1 to the die's sides (`bad value`).
Events `used { item }`, `steps { steps }`; the die shows the new number. One fewer each use; `none left`; `no such item`.
Potions and cards are also found in chests (a potion, a mana potion or a card: 40 / 20 / 40) and dropped by creatures
(`consumableDrop`); a spring gives one flask of each.

## Gear (Robin, 2026-10-31: randomized, tiered, named; five slots, and on 2026-11-01 shield, gloves and cape as well; numbers mine)

Slots, in the worn order: weapon (attack), shield (defense), helm (max HP), armour (defense), gloves (attack), boots (defense), cape (max HP), trinket (max mana); the shield, gloves and cape numbers are smaller than their neighbours' (shield 2/4/6 defense, gloves 2/3/5 attack, cape 8/16/26 HP by rank), first settings not yet run through the bots. A piece has a **rank** by tier (Tin 1, Copper 2, Iron 3, Silver 4,
Moonsilver 5, Sunsteel 6, Dragonscale 7, Starglass 8, Crownsteel 9, Everbright 10, then "Rank 11", …) and a **rarity**
(common, uncommon, rare, epic, legendary, weights 60 / 25 / 10 / 4 / 1), its one number from the slot's table times the
rarity's multiplier (1, 1.2, 1.45, 1.75, 2.2) swung 15 percent either way: weapon attack 4 / 8 / 13, armour defense
3 / 6 / 10, helm HP 12 / 24 / 40, boots defense 2 / 4 / 7, trinket mana 6 / 12 / 20, and past each table ×1.35 a
rank (`rankStat`), the price ×1.8 a rank (`rankPrice`). **Rare and up carry an affix**
(crit chance, lifesteal, dodge, thorns, vigor), **a legendary two**; **epic and legendary carry a proper name**
("Thistledown, iron sword"). Prices: the slot's price for the rank times the rarity's multiplier; shops sell the plain
common piece of their area's rank. **Drops** (Robin, 2026-10-31: bosses as such give better loot): a mob 12 percent, a
mini-boss 50 percent and **rare or better**, a boss always and **epic or better**; a chest 35 percent. The bag has no
limit yet.

**Uniques** (Robin, 2026-10-31: loot with effects that change how you play; the pieces are mine, `uniques.json`, 23 of
them): a rarity of their own, never rolled by chance, with a proper name, a unique's number (×1.9, swung), one affix and
a **power** the rules read by name. A fallen boss's drop is a unique half the time, a mini-boss's one in ten, from the
pool of every unique whose tier is the area's or lower, rolled at the area's rank. Weapons: **Twinstinger** (Attack strikes
twice at 0.6), **Hare's Edge** (the first hit of a fight is a sure crit and the enemy holds back that round),
**Icicle** (every hit chills: the enemy's next blow at 0.8), **Nettlefang** (every hit poisons two rounds at 0.3),
**Moonquill** (abilities cost half, hit at 0.8), **Grudgeblade** (up to 0.6 more attack as HP is missing), **Thunderclap**
(every third hit a sure crit), **Crownbreaker** (minis and bosses ×1.3). Armour: **Hedgehog Coat** (the first wound-up blow of a
fight misses), **Mirrorcoat** (a blocked blow throws half of what was blocked back), **Bramblehide** (blows 0.3 softer
under half HP). Helms: **Rooster's Crest** (once a fight, dropped under a quarter: healed 0.3), **Owl's Crown** (xp
×1.5), **Kettle Hat** (poison and weakening shrugged off, a crit only a hit). Boots: **Seven-League Boots** (a one is a two),
**Dancing Shoes** (the first blow of a fight misses), **Wanderers** (chests, springs, shrines give again in half the time).
Trinkets: **Dragon's Penny** (gold ×2, xp ÷2), **Honeycomb Heart** (a twentieth of HP back each round), **Moondrop** (+3
mana a round), **Rabbit's Foot** (a re-roll every five minutes), **Phoenix Feather** (when you would fall, up again with
half HP, once every half hour, `cooldowns.phoenix`), **Heartbeat Drum** (every meter point a one-in-four chance of a second).
`stats(c).powers` carries the worn powers to the fight and the board; `describeGear` says what a unique does.

## The fight (Robin, 2026-10-31: a turn-based RPG with a defensive choice; moves, guards and numbers mine)

A fight is one character against one creature, held on the character as `fight` until it ends. A round is one
`fight { move, guard }`: **a spell in the air lands, the player's move, then the enemy's poison bites, then the enemy's
turn**, unless it is dead, the player got away, it is stunned, caught in time, or it is the first round against a class
(or a Hare's Edge) that strikes first. The guard is read when the blow comes. Then the companion strikes, the player's
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
  (`skipped { reason }`: stunned, warped by Pocket Watch, trapped); a weakened one hits for `mult` of its power.
  **Mini-bosses and bosses shrug off stuns** (`resisted`): the simulation found a Shield Bonk every other round robbed
  King Goo of the fight. **A boss under half its HP enters its second phase** (`phase { text }`): new moves with the
  theme's twist (King Goo's thorns burst, the Grumblebark regrows, Queen Bumble's heart freezes over; a grown boss
  takes its theme's rage move), once a fight.
- **The meter** (`fight.meter`, `meter { name, value, max }`): the class's resource, filled by its rule (the classes
  table), spent by the abilities marked `meter` or `meterAll` (`not enough meter`); a Heartbeat Drum adds a point now and
  then. **Once-a-fight** abilities and powers are remembered in `fight.used` (`already used`).
- **Abilities** (`abilities.json`, three ranks each, six a class; the class's kit at rank 1 from the start, the rest
  from shrines and the levels' picks). Knight: **Mighty Swing** (1.6 / 1.85 / 2.1, 4 mana), **Shield Bonk** (0.8 and a
  stun on a mob, 6), **Battle Hymn** (hits harder ×1.3 for 3 rounds, 5), **Finishing Flourish** (3 Valor: 1.4, or 3.2 on a foe under a
  third), **Second Wind** (2 Valor, 4 mana: heal a fifth of max HP and ×1.2 for 2 rounds), **Castle Stance** (5: a barrier worth
  a quarter of max HP). Trickster: **Sneak Jab** (1.2 with a 60 percent crit, 4), **Nettle Knife** (0.8 and a poison of 0.5
  of the attack for 3 rounds, 5), **Vanishing Act** (the next two blows miss, 6), **Puff of Smoke** (3 Mischief, 3 mana: the
  next blow misses, the next hit a sure crit), **Sticky Fingers** (3, once a fight: 0.5 and half the enemy's purse,
  `stolen { gold, total }`), **Grand Finale** (all the Mischief, 2 mana: 0.6 plus 0.45 a point). Wizard: **Firework** (2.0 /
  2.3 / 2.6, 8), **Snowball Hex** (1.1 and weakens to 0.7 for 2 rounds, 6), **Bubble Shield** (a barrier of 30, 7),
  **Pocket Watch** (3 Arcana, 6 mana: the enemy loses its next turn, boss or not), **Falling Star** (10: lands two rounds later at
  4.0, whatever is done meanwhile; `fight.windup`), **Moonlight Veil** (all the mana into a barrier at 1.5 a point).
  Archer: **Triple Shot** (three arrows at 0.7, 5), **Bullseye** (1.5 with a 35 percent crit, 5), **Net Toss** (a stun on a
  mob, 6), **Tripwire** (5: the enemy's next wind-up fails), **Owl Friend** (2 Aim, 6 mana: a hawk strikes at 0.4 at the end of
  every round for 3 rounds; `fight.companion`), **Painted Target** (4: the next 3 hits ×1.5; `fight.mark`). Events `mana { delta,
  mana }`, `meter`, `effect { target, kind, rounds }` (kinds: attackUp, weakened, stunned, poison, barrier, evade,
  armoured, mark, companion, windup, skip, trap, sureCrit), `poisoned { target }`, `drained`, `enemyHealed`,
  `revived { by }` (the Rooster's Crest, the Phoenix Feather).
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
| Knight | 120 | 20 | 12 | 8 | 10 % | – | 50 | +12 HP, +2 mana, +2 attack, +1 defense | Mighty Swing, Shield Bonk | **Valor**: a point for every blow taken, two for a wound-up one |
| Trickster | 100 | 25 | 9 | 6 | 25 % | 25 % | 60 | +10, +3, +2, +1 | Sneak Jab, Nettle Knife | **Mischief**: a point for every hit landed |
| Wizard | 85 | 40 | 14 | 4 | 10 % | – | 50 | +9, +5, +2, +1 | Firework, Snowball Hex | **Arcana**: a point every round |
| Archer | 100 | 25 | 8 | 6 | 15 % | 5 % | 50 | +10, +3, +2, +1 | Triple Shot, Bullseye; strikes first | **Aim**: a point for every blow that misses you and every crit |

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
- **The King Goo** (level 6): nobody wins at level 1 or 2; at level 4 in copper the Knight and the Wizard win
  nine times in ten, the Archer four, the Trickster three; at level 5 everyone but the Trickster wins nine in ten, the Trickster eight.
  Without gear at level 6 the Knight and the Wizard still win; the Trickster and the Archer win three in ten.
- **The Grumblebark** (level 10): at level 9 in iron the Knight, the Wizard and the Archer win six to nine in ten, the
  Trickster two; the Trickster catches up at 11.
- **The Queen Bumble** (level 14): at level 14 in steel the Knight, the Wizard and the Archer win eight to nine in
  ten, the Trickster four. The Trickster is the weakest against bosses and the safest in the wilds; a thing to feel, not to fix
  from a table.
- **The grown bosses** (the Lord Ripplefin at 18, the Abyssal Leviathan at 22, the Bog King at 26, from the seed `sim`):
  at the boss's own level in the rank's plain gear (mithril, adamant, runed) the Knight, the Wizard and the Archer win
  nine in ten, the Trickster about half; two levels under, half to eight in ten. **The growth a tier** in `themes.json`
  (HP ×1.25, attack ×1.15, defense ×1.12) was set by this wall: at ×1.3 / ×1.18 / ×1.15 the same fight fell from nine in
  ten at tier 4 to four in ten at tier 6 and one in ten at tier 8; at the numbers kept it stays level through tier 9
  and then eases, because gear past the tables grows ×1.35 a rank (`docs/idea-bank.md`, 16).
- **The pace**: a bot reaches level 8 around turn 160, level 10 around 260 and level 14 around 300 to 400; in 500
  turns a few bots in thirty-two beat Queen Bumble and walk into Glimmerlake Shores. A bot in a grown area at its level dies
  about as rarely as in Honeyhill Fields and leaves a fight with six tenths of its HP.
- **With the kits, the uniques and the readable enemies (2026-11-01)** the wall was run again with what a character of
  the level would have: every ability of its class, at rank 2 from level 8 and rank 3 from 16 (picks and shrines). The
  first kits were far too strong (a Second Wind every two Valor healed a warrior through anything: nine in ten at the
  Queen Bumble five levels under); the kits were reined in (Second Wind and Finishing Flourish cost 3 Valor, Pocket Watch 4 Arcana, Tripwire and
  Castle Stance more mana, Painted Target and the Owl Friend softer) and **the bosses grew a tenth in HP** (`enemies.json`, `themes.json`:
  King Goo 550, Grumblebark 935, Queen Bumble 1320, grown base 1320; minis a tenth too). Where it stands at the boss's own
  level in the rank's plain gear: King Goo 100 / 93 / 97 / 80 (Knight / Trickster / Wizard / Archer), the Grumblebark
  97 / 90 / 78 / 65, Queen Bumble 98 / 90 / 95 / 95, the Tyrant 98 / 88 / 75 / 100, the Leviathan 98 / 98 / 92 / 100,
  the Bog King 98 / 100 / 85 / 100; two levels under, half to eight in ten; four under, only the Knight. The Ranger's
  rank-3 kit (a Painted Target on a four-arrow Triple Shot, a Tripwire for every wind-up) makes it the strongest past tier 4 and the Wizard
  the softest: a thing to feel before it is tuned from a table.
- **With the eight slots (2026-11-01, chapter 1 step 10)** the wall was run again: three more pieces (a shield, gloves, a
  cape) made King Goo a level-3 fight for the Knight in tin with two potions (90 % at level 3, 100 % at 4), against the
  plan's "by level 5 or 6 in the area's gear" (Robin's chapter 1, `docs/chapters.md`). **King Goo grew to 700 HP, 30
  attack, 11 defense** (from 550 / 26 / 9, `enemies.json`): now the Knight wins 27 % at level 4, **92 % at level 5**,
  100 % at 6; the Trickster 32 / 72 / 95 at 5 / 6 / 7, the Wizard 45 / 75 / 95, the Archer 35 at 6 and 93 at 7 (they
  come in chapter 2 and get their own look then). Bots reach level 5 around turn 55 as before, so the gate opens where
  the chapter says. The Grumblebark and the later bosses were left alone: their walls moved little (the Knight 57 % at
  level 6 against the Grumblebark, 97 % at 8) and their chapters are not built yet.
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
| `test/enemies.test.ts` | the intent told at the start and every round and used the round after; a wind-up told as one; every effect (poison and Kettle Hat, drain, weaken, armour, evade, heal); every family has something to read; the bosses' second phases, hand-laid and grown |
| `test/uniques.test.ts` | every unique's shape and every power's unique; making one; a legendary's two affixes; what bosses, minis and mobs drop; every power in play; a version-6 save coming up to date |
| `test/quests.test.ts` | the errands: offered, every kind drawn, taken and declined with the town's wait, moved along by fights and chests, paid in town; the trainer's prices and refusals; the bag's limit, its question and the sale on the spot; the flasks by share and the spring's two |
| `test/vaults.test.ts` | every theme's event and what it does (a hurt never to the last point); the two shapes with their vaults among the generator's; a vault locked, its key from the mini-boss once, its richer loot with the key spent; a version-8 save coming up |
| `test/items.test.ts` | the shop (consumables, plain gear by rank, towns and merchants, refusals), selling, equip, unequip, drop, the dice cards |
| `test/coop.test.ts` | the world boss: coming with a tick in the highest open area with HP for a crowd and only one at a time; fought together with the HP read and written back and the damage tallied; paid by share with the floor when it falls, fights ended, spot cleared; leaving on time; a round against one already gone; the hint. The notes: left, replaced, capped, faded, refused, read on a tap, in the delta. A version-9 save coming up |
| `test/shared.test.ts` | joining (a second character at the start, the refusals, two players rolling from one stream); the delta (null when nothing changed, the acting character and the die after a roll, the spawns after a tick, the whole board when a boss lays an area, bundling); two bots playing six hundred actions on the world with ticks between, a client folding every delta ending with exactly the server's state |
| `test/purity.test.ts` | no `Math.random`, `Date`, timers, DOM, storage, network, console or package imports in `rules/src` |

Every new mechanic starts with a test of this shape: given a state, an action, a seed and a clock, this is the state and
these are the events (the skill `shared-world`).

## Robin's first play notes (2026-11-01)

- **Gear puts itself on.** A piece found or bought goes straight on when its slot is empty (`addLoot`, `buy`: an `equipped` event after `loot` or `bought`); only then the bag.
- **A church on every map** (Robin; `SpaceKind` `church`, letter `c`): full HP and mana and every ailment gone, free, no cooldown. Little Clover Church (hub `ravine`, was Hedgerow), Oakshade Church (`hollow`, was Leaning Oaks), Honeybell Church (`ridge`, was Empty Apiary); the generator gives every grown area one.
- **Ailments outlast a fight** (mine, so a church has something to cure; `Character.ailments`): poison left when you win or flee stings on each roll for twice its rounds, never below 1 HP (`stung`); weakness left takes hold in the next fight and is used up there. A fall clears both. A town rests but does not cure.
- **Flasks from the bag**: `use` on a Honey Tonic or Moon Dew outside a fight; refused when it would do nothing.
- **A merchant met by chance camps on the spot**, so his shop sells.
- State version 13: every character gains `ailments`; `withChurches` turns the set hubs (or a grown area's first named wild hub) into churches.
- **King Goo stays at 700 / 30 / 11 for now.** Robin found the bosses "very overtuned? But maybe they should be for a bit". The wall above assumes all eight slots in tin at level 5 or 6; without gear it is 5% at his own level. Before auto-equip a player easily met him unworn, so this is to be felt again before any number moves.

- State version 14: every character gains `questsDone`, the errands finished, the last twenty kept for the quest log (Robin, 2026-11-01).

- **The Archer's starting attack is 10, was 8** (mine, 2026-11-01): the bots won 35% against King Goo at level 6 and now 65%, in line with the Trickster and the Wizard (72%, 75%). Against Grumblebark at level 8 in Copper: Knight 97%, Trickster 85%, Wizard 85%, Archer 92%. A first setting; nobody has felt these classes.

## Robin's notes after chapter 1 (2026-11-02), in the rules

State version 15. **Hunting grounds** (`grounds.ts`, `world.json`): each map has four round named spots; a wild fight is the ground's own creature three times in four, and a piece found there takes one of its two slots 65% of the time (mine). Grown areas make theirs from their spots and creatures. **The quest board** (`quests.ts`, `quests.json`, spot kind `board`, offer `board`): three kinds drawn from kill, loot, mini, find; one at a time; finished, it pays at once: xp, gold and a chest better than common. Loot drops 50% a kill; a mini-boss turns up 20% of wild landings in its area; a person 25% on their own ground (mine). The towns' errands are gone; a save's finished errands pay their gold, the rest go. **Gear lines** (`gear.json`): heavy Tin and on up for defense and HP; light Leather, Hide, Studded for attack, crits and dodge, 0.7 of the price; magic Cloth, Linen, Silk for mana and the new `magic` stat, 0.9 of the price. Magic adds to the attack behind abilities only. Weapons: Wooden Stick and Wooden Staff first; heavy ones named by class. **Shops** (`shopOffer`): arms sells light and heavy with health flasks and the Elixir of Vigor; magic sells cloth with mana flasks, Arcana and Cure; a town sells flasks and cards only; a merchant all of it. Shops sell only common. Found pieces can be any line and any rarity. **Flasks** are set amounts: Health 50, Greater 90, Superior 160; Mana 25, 45, 80 (Robin's 50 and 25, the rest mine). **Elixirs** last three fights. **Brace** gives the larger of 10 mana or 20% of your mana (Robin: at least 10). The first-tier numbers against King Goo at level 6 in the bots: Knight 100%, Trickster 58%, Wizard 50%, Archer 70%; against Grumblebark at level 8: 98%, 95%, 92%, 100%. First settings.

- **Walking past the quest board** with no quest stops the walk there to choose; the rest of the walk is kept in `Character.walking` and finished after the answer, whatever it is (Robin, 2026-11-02). With a quest under way you walk past undisturbed; landing exactly still asks to keep or drop it.
- **King Goo's HP is 500, was 700** (Robin, 2026-11-02).

## Robin's second set of notes (2026-11-02)

**King Goo is 600 HP** (Robin). **Less loot and gold** (his: chests constantly, the whole leather set in a minute): a wild spot is a chest 3 times in 100 (was 10), a fight 82; chests give 6 to 18 gold a tier (was 15 to 40), gear a quarter of the time, and fill in ten minutes; first-tier gear costs about 1.6 times what it did; quest gold is down by about 40%. **Spots you roll for**: `potion` and the new `gear` ask for a roll (`offer` `roll`, intent `try`): 4 or better wins a flask of the tier, or a plain piece worth a fifth of its price so it cannot be farmed; five minutes, win or lose. Numbers mine.

- **A creature lives only in its own hunting ground** (Robin, 2026-11-02); the 75% share is gone.

- **The coach** (mine, 2026-11-02, with Robin's bigger world): in a town, go to any town you have stood in for 15 gold a tier of where you are going, and land there rested (`travel`, `travelOptions`, `Character.visited`). State version 17. **Roads may carry `via`**, points they pass through, so they can wander.

- **The Meadows are Mitch, AD's layout** (2026-11-02): 87 spots, 17 hubs, 4 grounds with `levels`, four side roads that end in a place. Areas carry `places`, outlines: a spot in a ground's outline belongs to it; **a wild spot inside a town's outline fights nothing** (his suggestion, mine to try); open road takes the nearest ground until Robin has played it. State version 18 lays the board again; a character on a road spot that no longer exists goes to the start.

## Classes, paths and skills (2026-11-02)

`rules/src/skills.ts` holds points, trees, traits and resets; `classes.json` and `abilities.json` are written by `tools/class-data.mjs`; `tools/sim-classes.ts` is the balance table. State version 22 resets everyone to their class's start with points to spend. `plan-classes.md` says why.

## Suffixes and prefixes (2026-11-02)

`gear.json` `affixes` and `prefixes`. A suffix's number is base + step per rank, capped, so old gear is outgrown. Uncommon has a prefix, rare a suffix, epic both, legendary a prefix and two suffixes (the name shows the first). `stats().bonus` adds up the suffixes that are not stats; fight and board rules read it.

## Wanderers and towns (Robin, 2026-11-02)

A **wanderer** is a spawn outside the cap: one at a time, in land where someone stands who is under its level, the land's top level plus `progression.wanderer.levelsOver`. It walks up to three spots along the road on some ticks and shows its level on the map. Its fight is a `Dread` creature with `wanderer`: rich, and it always drops at a boss's rarity.

**Towns** all rest you. `data/towns.json` gives each a kind: herbalist (flasks half price), master smith (all three lines a rank above the land), card seller (cards half price). `shopOffer` carries the town, its tier and its prices.

## The week and the Arena (Robin, 2026-11-02)

`rules/src/calendar.ts` and `data/calendar.json`: real days, the same for everyone. An event names its days; `isOn(event, now)` answers. The Arena is the first event.

The Arena is a spot of its own at a road's end in each region, kind `arena` (`data/arena.json`, set by `withArenas`, save version 24). Three modes, once each per open day, whatever came of it. Each pays a fee, then waves. Waves are numbered from the fighter, half the class's bare numbers at that level and half what is worn, so coming back strong does not make it easy. A wave's pay goes in `character.arena`, and an `arena` offer asks take or go on; a fall or a flee loses the pot and only the pot. Pay is a share of a whole: gold by the fee, xp by the level's bar, cut for one far above the land. Before wave 3 the pot is worth less than the fee. `tools/sim-arena.ts` plays it. `op: 'test'` opens it whatever the day and lifts the once-a-day, a Settings switch to go before Alpha.

## Dungeons (Robin, 2026-11-02)

`data/dungeons.json`: an area with `dungeon: true`, off the map, reached by a `door` spot at a road's end (`withDungeons`, save version 26). `door` moves you through and opens the land beyond. No spawns in it and no walking straight to its boss. Falling inside wakes in the town nearest its door. The Rootways are the first, under the Meadows, with Old Rootbeard at the far end.

A road's end stops a walk, whatever is left of the roll (`legalPaths`, `checkPath`).

## Five hand-laid lands (Robin, 2026-11-02)

Bogglemire (tier 4, levels 12 to 16) and The Frostcrown (tier 5, 16 to 20) follow Honeyhill; Mitch, AD's layouts are in `world.json`, stats mine. Queen Bumble opens the swamp, Old Mother Murk the mountains, Frostbeard the first grown land, whose first column moves east to 12 and whose tiers start at 6. Save version 27: anyone already in a grown land has the two opened.

## Rumours and hidden places (Robin, 2026-11-02)

`data/rumours.json`: landing in a town may tell you a rumour about its land, at most `max` held, each town again after `cooldownMs`. A stash pays on landing, a beast is a fight with a sure drop, a secret points to where a hidden trail leaves the road. A rumour's spot stops a walk.

`data/secrets.json`: hidden trails, `withSecrets`. A spot with `hidden` is walkable only with its id in `Character.found` (`walkable`). You notice a trail on landing within `SECRET_NOTICE` of its anchor. Its named end gives a first treasure once (`foundDone`), then what its kind gives.

## XP, gold and bosses after the climb check (Robin, 2026-11-02)

`softcap` in `common.ts`, numbers in `progression.softcap`. `bossKnown`: a boss can be gone straight to only once walked to or beaten. A boss not on cooldown stops a walk. `dailyPiece`: a master smith's piece of the day, per town, class and day, bought with `buy { daily: true }`. Save version 29 keeps level and share of the level across the new curve. `tools/sim-journey.ts` is how the climb is checked: see `docs/playthrough-check.md`.

## The hub's rules (Robin, 2026-11-02)

Ready before the map lands. `Area.city`: `stroll { to }` walks its own streets with no die, its plain spots do nothing, and `roll` works only on a spot that leads out. `home`: to `world.hub` from anywhere outside a fight, once the hub is open, then a wait of `homeWaitMs`. A mini-boss on a `boss` spot with `opens` guards a gate like a boss. `Area.openWith`: a land with no gate opens when that land does. Bosses stop opening lands by the data: drop their `opens`.

## The talent trees (Robin, 2026-11-02)

`tools/class-data.mjs` writes them. Twelve trees of eight tiers: a tier asks for `TIER_POINTS` x its number of points in that tree, and a level (2, 5, 9, 13, 17, 21, 25, 30). A point a level; the class's four come free (`withCore`). A rule's numbers apply once a rank. Passives read in `gear.ts` (attackMult, manaMult) and `fight.ts`. `carriedLimit`: four carried, five from level 15. Save version 30 gives every point back.

## The hub world's data (Robin, 2026-11-02)

`world.json` is Mitch, AD's moved world: 17600 by 12700, hub `city-square` in `crownhaven`. King Goo's `gate` opens the Kingswood, and Crownhaven, Wobblewood and Honeyhill `openWith` it. `gate-bogsnapper` opens Bogglemire, `gate-bighorn` The Frostcrown. No other boss opens anything, and grown lands are off. Save version 31 opens the new lands for anyone past King Goo.

## Balance tools (2026-11-02)

`tools/enemy-base.json` holds every creature as first set; `tools/enemy-curve.mjs` writes `rules/data/enemies.json` from it. Change creatures in the base, or the curve, and run it: never edit enemies.json by hand. `docs/playthrough-check.md` says what the sims do and where the numbers stand.

Save version 32 lays the board again. A city has no creatures, no spawns and no rumours. Its board sends you to the land that suits your level, and its shops stock the tier of the furthest land you have opened.

## Sets, uniques and tricks (Robin, 2026-11-02)

`rules/data/sets.json`: nine sets of five pieces, no weapons, tier 1 to 7 (the last two wait for their lands), a bonus at 2 and at 4. A piece has `set`; `rollSetPiece` makes one; `GEAR.setChance` says how often. A unique has either a `power` or `traits`. Bonuses and `traits` use the same words as talents, read in `traitsOf`, so no new rule is needed for a new set or unique. 46 uniques, all slots. Flasks climb to strength 5 (`flaskTier`).

A boss's `trick` in `tools/enemy-base.json`, done at a round's end in `bossTrick`: Grumblebark regrows unless burning or poisoned, Queen Bumble's attack grows, Old Mother Murk's fumes poison, Frostbeard's ice shell, Bogsnapper's death roll weakens, Old Bighorn winds up. King Goo and Old Rootbeard have none: the first bosses stay plain.

Waiting: Mitch, AD's signature weapons, each a unique with its own art.



## The Buried Crown (Mitch, AD, 2026-11-02)

The last dungeon, in `dungeons.json`: tier 8, levels 28 to 30, off the map. `city-castle` is its door, `sealed`: `door` refuses until `sealsAllWon`. The Last Steward (a mini-boss, counted like a gate since `area.dungeon`) stands before The Hollow King (`FINAL_BOSS`), whose first fall sends `gameWon`. State version 36. Numbers mine.

## Links (2026-11-02)

`link` action: `offer`, `accept`, `join`, on `Character.link` and `linkCode`; numbers in `PROGRESSION.link`. See `protocol.md`.

## The Giants’ Land (Mitch, AD, 2026-11-02)

Area `giantsland`, tier 7, levels 24 to 28, baked roads. `gate-snowshoulder` stands on the Kingswood's coast past `kw-nw`, opens it; Old Snowshoulder lifts a boulder (`charger`). The Yeti King holds the seventh Seal; his trick is `storm`: every third round 8% of your HP, through any guard, never the last blow. `SEALS_COMING` is empty. State version 34. All numbers mine.

## Legendary weapons (2026-11-02)

Twenty-five `legend-<art>` entries in `uniques.json` (the second thirteen, Mitch, AD's looks of 2026-11-03, powers mine, made only of traits the rules already had; a legend's `kind` is its base, so a `great maul` is a great weapon), each with `classId`, `art`, `kind`, and sometimes `stat` and `affix`. `rollLegend` draws only for the character's class, up to the land's tier; never from `uniquePool`. `GEAR.legendChance`: mob 0.05%, mini-boss 1%, boss 5%, rich chest 2% (mine).

## The Pirate Isles (Mitch, AD, 2026-11-02)

Area `pirateisles`, tier 6, levels 20 to 24, baked roads. `gate-redwake` stands in the Kingswood past `kw-camp-9`, opens it. Its `lookout` hub is `crowsnest` here, since the Rootways has a `lookout`. Boss `captain-saltjaw` at `flagship`, with a Seal. No Arena or hidden places yet.

## Weapons and off-hands by class (Robin, 2026-11-03)

`GEAR.kinds` in `gear.json`: a weapon or off-hand has a `kind` (`gearKind(g)` reads it from the name for older items). Weapons: sword, great (two-handed), dagger, bow (two-handed), staff (two-handed), wand. Off-hands: buckler, round, kite, tower (Warrior only), and four orbs for the Magician (ward, mirror, blink, storm). Each kind has `mult` (its attack against the slot's base), and an off-hand or a two-hander has `block` (the share a block stops), `dodge`, and an orb `mana` (the share of a hit paid from mana) with its own extra: mirror sends a share back, storm braces harder. Bigger shields stop more and dodge less: buckler stops 30% and dodges 50%, tower 72% and 15% (Robin's buckler example). A two-handed weapon blocks less and dodges more than a shield (great 35% and 45%, Robin, 2026-11-03: "he needs to block less damage, but be more swift"). Bare hands 45% and 30%.

`guardOf(c)` is what guards: the off-hand, else a two-hander's own numbers, else bare. `firstKinds` is each class's two weapons (Warrior sword and great, Rogue dagger and sword, Magician staff and wand, Hunter bow and dagger); shops and drops follow them. Any class can wear any kind with no penalty (Robin). A shield while a staff or great weapon is worn is refused (`two hands`), found loot never slips into that off-hand, and putting one on moves the off-hand to the bag (version 39 repairs a save that had both). A bow is held in both hands but keeps its off-hand (`keepsOffhand`, mine: the proposal's quiver, a shield now that Robin gave Hunters shields). An ability with `needs` (shield, staff, bow, dagger, blade, wand or sword) refuses without it (`wrong weapon`); `holdsFor`, `needsWords`. The Rogue's attack hits three times only with a blade or bare hands (`attackHitsOf`). Crits stop at `PROGRESSION.critCap` 0.6. The Berserker's Bloodlust (`greatLifesteal`) and Second Wind (`secondWind`) keep a two-handed Warrior alive.

## The new Rogue (Robin, 2026-11-03)

Three trees, each its own way to fight, written in `tools/class-data.mjs`. Poison holds steady (a new coat sets the larger sting, it never adds). Alchemist: Toxic Jab (far harder on a poisoned foe), Venom Finale. Shadow: Thousand Cuts, Shadow Finale (Grand Finale strikes three times, a crit for each Mischief). Ninja, no shuriken: Blood on the Blade (each attack leaves `fight.blood`, up to 3), Crimson Arc (harder for each drop, spends it), Bleed Out (`enemy.bleed`), Red Mist (heals for the blood spent), Blood Finale, Black Blood (a foe both bleeding and poisoned takes both stings twice). Version 38 renames the old talents in a save.

## Day and night (Robin, 2026-11-03: 20 rolls a day, 10 a night)

`daynight.ts`: `Character.clock` counts the rolls; `clockOf`, `isNight`, `nextMorning`. `PROGRESSION.dayNight`. At night a wild creature (not a boss, not in a dungeon) has ×1.15 its numbers and pays ×1.2; a town's shop is the night merchant; rumours come without their wait; the `sleep` action in a town skips to morning. A `daybreak` event marks each morning. Version 37 adds `Character.seen`, the lands whose veil is lifted: only the lands you have stood in or walked through, and the next one a gate opens.

## The Arena legends (Robin, 2026-11-03, through Mitch, AD)

35 `arena-<art>` entries in `uniques.json` with `arena: <area>`: for each of the seven Arenas a weapon for each class and one off-hand (an orb in the Bogglemire and the Giants' Land). Never dropped (`rollLegend` skips them). `ARENA.modes.legend`: opens with every Seal (`arenaModeOpen`), the same fee everywhere (`feeTier`). Taking the pot after a full clear wins `arenaPrize`: your class's weapon from that land, then the off-hand that suits you (an orb for a Magician, a shield for the rest), each once (`Character.arenaLegends`), made at `ARENA.legendRank` 9. With both, a clear pays as Nightmare does. Powers mine. `tools/sim-arena-end.ts` puts the full sim's finished heroes (`ENDSTATE=1`) through every way: A class's handicap (`ARENA.classes`) slides from its early number (set at levels 4 and 12) to its `top` at level 30, starting at level 10. With Legend at 2.1 times a wave's HP and blow, a level-30 hero clears it about a third of the time on average (Hunter 21%, Rogue 28%, Warrior 38%, Magician 40%), Nightmare about half the time, Normal three or four times in five; gear and uniques matter more than class, so one hero may always clear and another never.

## Trinkets (Robin, 2026-11-03: "There will be no necklaces, instead its gonna be trinkets for that slot")

`data/trinkets.json`: 37 trinkets, tier 1 to 8, common to legendary, each a passive and nothing else (no numbers of their own): `traits` (the talents' words, read by `traitsOf`), a unique-style `power` (read by `powers`), or fixed `affixes`. A piece is `makeTrinket` (`GearItem.trinket`, rank = its tier). `rollGear` for the trinket slot calls `rollTrinket`: the rolled rarity (stepping down when the land has none of it yet), a tier the land has reached, the land's own tier and the two before it three times as likely. Shops do not sell them (`buy` refuses the slot); a town's fine piece of the day can be one. The twelve unique charms moved here with their powers; the four sets with a trinket took the slot they lacked. New traits: `wildHeal` (flat HP after a fight won outside the Arena), `twinStrikes` (Attack's hits doubled and split, so a Rogue strikes six times), `stride` (a roll walked that many fewer or more, `stepChoices`, checked in `move`), `lightning` (the chance an Attack calls down a bolt of `TRINKET_DATA.lightning.power` of a blow, once an Attack; a mob loses its next move, minis and bosses resist) and `nightOwl` (night's pay without its strength). Version 40 turns every old piece in the slot into a trinket: a unique charm into its own, any other into one of its rarity where its rank was, seeded by its id. `testTrinket` (Settings, Testing) wears the next one.
