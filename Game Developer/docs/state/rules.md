# The rules (`rules/`)

The game as a pure function: `apply(state, action, rng) → { state, events }`. No screen, no socket, no clock, no
`Math.random`, no packages: the test `rules/test/purity.test.ts` reads the source and refuses any of those. The state passed
in is never changed; a new one comes back. The same code runs in the browser (solo, `client/src/local-game.ts`) and in the
server's region actor (`server/src/region-actor.ts`). Import from `rules/src/index.ts`, never from the files inside.

| File | What it holds |
| --- | --- |
| `src/types.ts` | the state, the actions, the events, the reject reasons, `STATE_VERSION` (4) |
| `src/rng.ts` | the seeded random stream: `makeRng(seed)`, `resumeRng(state)`, `hashSeed` |
| `src/data.ts` | the numbers from `data/*.json`, typed: `ISLAND_DATA`, `DICE_DATA`, `CLASS_DATA`, `SPACE_KIND_DATA`, `EVENT_CARDS`, `ENEMIES`, `PROGRESSION`, `ITEMS` |
| `src/island.ts` | `buildBoard(island)`: the board from an island description (hubs and roads); `KIND_LETTERS`, `roadSpaceId` |
| `src/paths.ts` | `legalPaths` (every walk a roll allows), `reachable` (where it can end, each space once), `checkPath` (why a walk is not allowed), `nearestTown` |
| `src/game.ts` | `newGame`, `apply` (roll, move and what landing does, the fight's four actions, buy, use), `makeBoard` (the island), `makeCharacter`, `levelFor` |
| `src/save.ts` | `migrate(raw)`: a stored state up to the current version (1 → 2 → 3 → 4 are written), or null |
| `data/board.json` | the island: Ashford Isle, 1400 by 1850, eleven hubs and fifteen roads |
| `data/dice.json` | the die: 6 sides |
| `data/classes.json` | each class's hp, attack, defense, starting gold, its own move, and what a level brings |
| `data/enemies.json` | the enemies a battle space can draw: hp, attack, defense, the xp and gold for beating them |
| `data/progression.json` | the xp table for levels, the crit chance and power, the flee chance, the share of gold lost on death |
| `data/items.json` | what a shop sells: the potion and the four dice cards, with text and price |
| `data/spaces.json` | the kinds of space, their labels, and what landing does (heal, gold) |
| `data/events.json` | the cards an event space can draw: text, gold, heal |
| `test/fixtures/ring.json`, `ring.ts` | the first twelve-space ring, kept as a test board: `ringBoard()` |

## The state

```
GameState { version: 4, seed, board, characters: { [id]: Character }, die }
Board     { start, width, height, spaces: { [id]: Space } }   a graph: spaces and links, never a grid
Space     { id, kind, name, x, y, links: string[] }           x, y in world pixels inside width by height; a road space's name is ""
Character { id, name, classId, hp, maxHp, attack, defense, gold, space, steps, xp, level, fight, items }
Fight     { enemy, round, charged }                            null on the character when there is none
Enemy     { id, name, hp, maxHp, attack, defense, xp, gold }  as it stands now
Die       { sides, last }                                      last: the value rolled (or set by a dice card), null before the first roll
```

`items` is the bag: item id to count, from `data/items.json`.

`steps` is what the character still owes from the last roll; 0 means no roll is pending. The random stream is **not** in the
state: whoever holds the state holds the stream (shared-world rule 5: a seed is never sent to a client before its roll is
spent). `seed` in the state is the world's seed, for the generator to come. `width` and `height` are the world's size: the
client's camera is bounded by them.

**Versions.** 2 (2026-10-31) replaced the ring with the island: `migrate` rebuilds the board from the island, keeps every
character (name, class, hp, gold and the rest) but stands it on the start space with `steps` 0, and unrolls the die.
3 (2026-10-31) brought the fight: every character gains `xp` 0, `level` 1 and `fight` null. 4 (2026-10-31) brought
items: every character gains an empty bag. An older state takes every step up. A state missing its seed or characters, or with a character of an unknown class, gives null, as does anything that is
not a state we know; the holder then starts a fresh game.

## The actions and what they do

Every action carries `id` (made by the client, a UUID) and `player`. A repeat of an id is the holder's business
(the region actor stores answers by id; the solo client does not need to).

- **`roll`**: refused with `finish your move first` while `steps > 0`. Otherwise `rng.int(die.sides)`; `die.last` and
  `steps` become the value; event `rolled { value }`.
- **`move { path }`**: `path` is every space stepped on, in order, ending on the landing space. Refused with `roll first`
  when `steps` is 0; `wrong number of steps` when `path.length ≠ steps`; `no such space`; `not connected` when two
  consecutive spaces are not linked; `no turning back` when a step goes straight back to the space just left (mine,
  2026-10-31: the Dokapon rule, so a roll cannot be wasted by shuffling back and forth). On success the character stands on
  the last space, `steps` is 0, events `moved { from, path }` then `landed { space, kind }`, then what the space does
  (below), all in the one action.
- **`attack`, `defend`, `skill`, `flee`**: one round of a fight (below). Refused with `not in a fight` otherwise; and
  `roll` and `move` are refused with `finish the fight first` while a fight lasts.
- **`buy { item }`**: at a shop (below). **`use { item, value? }`**: a potion in a fight, a dice card on a pending roll.
- Any action for a player not in the game: `unknown player`.

A refused action returns the **same** state object and one `rejected { action, player, reason }` event. Nothing throws.

**One intent per roll** (mine, 2026-10-31): the whole walk goes in one `move`, so a phone sends one message per turn and the
server checks the walk in one go. Forks are expressed by the path; `legalPaths(board, from, steps)` lists every allowed walk
in link order, and `reachable(board, from, steps)` lists where those walks end, each space once with the first walk that
gets there. The client lights those spaces and the player taps one: the choice is the destination, one tap, not a turn at
every fork (mine, 2026-10-31). Two walks to the same space: the first in link order is taken.

## What landing does (mine, 2026-10-31: first settings, nothing played yet)

The landing is resolved inside `move`, with the same random stream, so the holder of the state decides (shared-world
rule 5). The numbers live in `data/spaces.json` and `data/events.json`.

| Kind | On landing | Events after `landed` |
| --- | --- | --- |
| battle | an enemy drawn from the stream (`ENEMIES`, evenly); the fight begins | `fight { enemy }` |
| treasure | gold found, drawn from the stream between 10 and 40 | `gold { delta, gold }` |
| town | HP back to full | `healed { amount, hp }` (amount 0 when already full) |
| shrine | 30 HP back, never above the maximum | `healed { amount, hp }` |
| event | one card drawn from the stream (`EVENT_CARDS`): a purse (+15 gold), a merchant (+25), a spring (+20 HP), a quiet road (nothing), a toll (−10 gold), a pickpocket (−15) | `event { card, text }`, then `gold` or `healed` if the card has one |
| shop | nothing on landing; the shop is open while the character stands there (`buy`) | none |
| quest, boss gate | nothing yet: quests and the gate are the next pieces | none |

Gold never goes below 0 (a loss takes what there is; `delta` says what was taken) and HP never above `maxHp`. An event's
card draw, a treasure's amount and a battle's enemy each take one number from the stream, so a walk that lands on one
shifts the dice that follow; the tests pin that.

## Items: the shop, the potion, the dice cards (mine, 2026-10-31; the brief's dice cards, "found or bought")

`data/items.json` holds what a shop sells, with a price (first settings): a **Potion** (15 gold, heals 40 in a fight),
and four dice cards: **Reroll** (20), **+1** (12), **−1** (12), **Exactly N** (40). Nothing is found yet; the shop is
the one source.

- **`buy { item }`**: standing on a shop space and not in a fight, one of the item for its price; event
  `bought { item, price, gold }`. Refused with `no such item`, `finish the fight first`, `not at a shop`, `not enough gold`.
- **`use { item }` with a potion**: in a fight only (`not now` otherwise). Drinking it is the round: event `used`, then
  `healed { amount, hp }` (never above the maximum), then the enemy strikes back as after any move.
- **`use { item, value? }` with a dice card**: a roll must be pending and no fight on (`not now` otherwise). It changes
  the steps owed and the die shows the new number: **Reroll** draws `rng.int(sides)` again; **+1** adds one (a 6 becomes
  a walk of 7, which every board allows); **−1** takes one, never below 1; **Exactly N** sets `value`, which must be a
  whole number from 1 to the die's sides (`bad value`). Events `used { item }`, `steps { steps }`.
- One fewer of the item each use; a count of 0 leaves the bag. `none left` when there is none, `no such item` when the id
  is unknown.

## The fight (Robin, 2026-10-31: turn-based, choices among attacks, spells and defending; the moves and numbers are mine)

A fight is one character against one enemy, held on the character as `fight` until it ends. Each action is one round:
**the player acts (a move, a guard, a potion), then the enemy strikes back**, unless it is dead, the player got away, or
it is the first round against a class that strikes first. All in one `apply`, every number from the stream.

- **A hit**: `round(attack × power) − floor(defense / 2)`, at least 1, plus a swing of −2 to +2 from the stream, doubled on
  a crit (`baseCrit` 0.1, `critPower` 2), never under 1. Two numbers from the stream per hit: the swing, then the crit.
  Event `hit { by: player | enemy, move, damage, crit, hp }` where `hp` is what the one hit has left.
- **`attack`**: one hit at power 1.
- **`defend`**: event `guarded`; the enemy's hit this round is halved, rounded up.
- **`skill`**, the class's own move (`classes.json`): Warrior **Heavy Blow**, one hit at 1.6; Rogue **Backstab**, one hit at
  1.2 with a crit chance of 0.5; Mage **Charge**, the first use charges (event `charged`, the enemy still strikes) and the
  next hit of any kind, `attack` or `skill`, is 3 times as strong and spends the charge; Ranger **Volley**, three hits at
  0.7 each, stopping at the kill, and the Ranger **strikes first**: the enemy does not strike back in round 1.
- **`flee`**: `fleeChance` 0.5 from the stream; event `fled { ok }`. Got away: the fight ends, the character stays on the
  space. Failed: the enemy's blow lands.
- **Winning** (the enemy's hp 0): event `won { xp, gold }`, both added. Then every level the xp table gives (`levelFor`:
  level 2 at 20 xp, 3 at 50, 4 at 90, 5 at 140, 6 at 200, 7 at 270, 8 at 350, 9 at 440, 10 at 540, the top) comes with
  `levelled { level, maxHp, attack, defense }`: the class's `growth` added to maxHp, attack and defense, and the HP gained
  healed.
- **Being beaten** (the character's hp 0): event `died { town, lostGold }`: back on your feet in the nearest town by steps
  (`nearestTown`; the start when a board has none), HP full, a fifth of the gold gone (`deathGoldLoss` 0.2, rounded
  down), no roll owed, no fight. Gear is kept (there is none yet).

The enemies (first settings): Slime 30 hp, 6 attack, 2 defense, 6 xp, 8 gold; Moor Wolf 45 / 9 / 3, 10 xp, 12 gold; Marsh
Wisp 35 / 12 / 1, 12 xp, 10 gold; Bandit 60 / 11 / 5, 15 xp, 20 gold. Drawn evenly; difficulty by distance comes with the
generator. The classes' growth a level: Warrior +12 hp, +2 attack, +1 defense; Rogue +8, +2, +1; Mage +7, +3, +1; Ranger
+9, +2, +1.

## The board: an island of hubs and roads

**The world is one big connected map with many paths, and the die gives the choice of where to go** (Robin, 2026-10-31:
like Dokapon Kingdom's board). The first piece of it is **Ashford Isle**, hand-laid in `data/board.json` as a short
description rather than sixty spaces by hand:

```
{ "name": "Ashford Isle", "width": 1400, "height": 1850, "start": "ashford",
  "hubs":  [ { "id": "ashford", "kind": "town", "name": "Ashford", "x": 700, "y": 1560 }, … ],
  "roads": [ { "from": "ashford", "to": "millford", "kinds": "bebtbb", "bow": 0 }, … ] }
```

- A **hub** is a named space at a fixed position: a town, a shrine, a gate, a fork or a corner in the road.
- A **road** joins two hubs with `kinds.length` plain spaces between them, one letter per space: **b** battle, **e** event,
  **t** treasure, **s** shop, **q** quest, **h** shrine, **g** boss gate, **w** town (`KIND_LETTERS`). `bow` curves it: the
  spaces lie on a quadratic Bezier whose middle is `bow` pixels off the straight line, **positive away from the map's
  centre** (the perpendicular is flipped if it points toward the centre), so loops bulge outward; 0 is straight. The spaces
  are evenly spaced in the curve's parameter and rounded to whole pixels.
- `buildBoard(island)` (`src/island.ts`) lays it out, pure and deterministic. Road space ids are `from-to-n` with `n`
  from 1 (`roadSpaceId`), their name is `""` (the client shows the kind instead), and they are chained hub → 1 → 2 → … →
  hub, linked both ways; a hub gains its links in road order. An unknown hub id, an unknown kind letter, a duplicate id,
  an unknown hub kind or a start that is no hub throws a clear Error. `makeBoard()` in `src/game.ts` builds the island;
  `newGame` takes an optional `board` so a test can play on something smaller.

The layout (mine, 2026-10-31; first settings, nothing played yet): four loops round the central town Millford, forks at six
hubs, corners at the other five, no dead ends. Eleven hubs: Ashford (town, the start, at the bottom), Millford (town, the
middle), Crossroads and Windy Ridge (events, left and right of the start road), Tinker Cart (shop) and Hermit Hut (quest)
at the sides, Old Cairn (treasure), Moon Shrine (shrine) and Iron Gate (boss gate) across the top, Saltmarsh (event) and
Ravine (battle) at the bottom corners. Fifteen roads of three to six spaces each: 49 road spaces, 60 spaces in all, linked
spaces 94 to 120 pixels apart. The names are placeholder lore (mine). The kinds are the brief's eight (Robin, 2026-10-31).

**The twelve-space ring** that was the first board lives on as `test/fixtures/ring.json` (412 by 915, the phone screen it
was drawn for) with `ringBoard()` in `ring.ts`. The game tests and the server test play on it so their paths stay short;
nothing in the game uses it.

`rules/test/board.test.ts` keeps both boards sound, and the generator that comes later must pass the same checks: links
both ways, no self links, no dead ends (two links at least), every roll of the die usable from every space, known kinds,
unique ids; and drawable: linked spaces 60 to 200 pixels apart (the ring's chord across the middle, 300, is the one allowed
exception: it is the fork test, not a map to draw), no two spaces closer than 55, every space at least 40 pixels inside the
board's width and height.

## The die and the random stream

mulberry32: a 32-bit state, `next()` in [0, 1), `int(sides)` from 1 to `sides`. `makeRng('ashford')` rolls 2, 1, 5, 6, 6, 6,
6, 4 on a six-sided die; the tests pin these. `rng.state` is the position, one integer, so the client's save and the server's
SQLite row can store it and `resumeRng` carries on with the same dice. A string seed is hashed with FNV-1a.

## The data (mine, 2026-10-31: first settings, nothing played yet)

| Class (Robin, 2026-10-31: four classes, chosen at creation) | HP | Attack | Defense | Gold |
| --- | --- | --- | --- | --- |
| Warrior | 120 | 12 | 8 | 50 |
| Rogue | 90 | 9 | 5 | 60 |
| Mage | 80 | 14 | 4 | 50 |
| Ranger | 95 | 8 | 6 | 50 |

Each class's own move and growth are under the fight, above.

## The tests (`npm test`, Vitest, in Node)

| File | Covers |
| --- | --- |
| `test/rng.test.ts` | the pinned sequences, resume from a stored state, every face comes up, `next()` stays in [0, 1) |
| `test/game.test.ts` | a new game on the island and on the ring; roll and its refusals; a roll replays from its seed; move, each refusal, the state untouched when refused; landing on each kind (the battle's enemy and the board refusing while it lasts, the treasure's draw, the town's and shrine's heal, the event's card and every card over many seeds, gold never below 0, the stream spent); `legalPaths` agrees with `move`; three turns from one seed always play the same; `migrate`, with hand-made version-1, version-2 and version-3 states |
| `test/items.test.ts` | the shop (a buy, its refusals, every item priced and either a potion or a dice card); the potion in a fight (the heal, the enemy's blow, the count down to none, the cap, refused outside a fight); each dice card (Reroll from the seed, +1 to a walk of seven that `move` accepts, −1 never below one, Exactly N and its bad values), their refusals, the state untouched |
| `test/fight.test.ts` | a fight from the seed, pinned round by round for each class's move; a held charge into a plain attack; a volley stopping at the kill; defend halving the blow; flee, failed and not, and its odds over 200 seeds; death to the nearest town with the gold lost; xp and one or two levels at once; `levelFor`; the refusals in and out of a fight; `nearestTown` on both boards and on a board with no town |
| `test/board.test.ts` | the checks above over the ring fixture and the built island; the island's shape (hubs, forks, fresh copies) |
| `test/island.test.ts` | `buildBoard`: ids and chaining, link order at hubs, a straight road, the bow and its direction, the kind letters, the errors, determinism |
| `test/purity.test.ts` | no `Math.random`, `Date`, timers, DOM, storage, network, console or package imports in `rules/src` |

Every new mechanic starts with a test of this shape: given a state, an action and a seed, this is the state and these are the
events (the skill `shared-world`).
