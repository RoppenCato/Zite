# The rules (`rules/`)

The game as a pure function: `apply(state, action, rng) → { state, events }`. No screen, no socket, no clock, no
`Math.random`, no packages: the test `rules/test/purity.test.ts` reads the source and refuses any of those. The state passed
in is never changed; a new one comes back. The same code runs in the browser (solo, `client/src/local-game.ts`) and in the
server's region actor (`server/src/region-actor.ts`). Import from `rules/src/index.ts`, never from the files inside.

| File | What it holds |
| --- | --- |
| `src/types.ts` | the state, the actions, the events, the reject reasons, `STATE_VERSION` (1) |
| `src/rng.ts` | the seeded random stream: `makeRng(seed)`, `resumeRng(state)`, `hashSeed` |
| `src/data.ts` | the numbers from `data/*.json`, typed |
| `src/paths.ts` | `legalPaths` (every walk a roll allows) and `checkPath` (why a walk is not allowed) |
| `src/game.ts` | `newGame`, `apply`, `makeBoard`, `makeCharacter` |
| `src/save.ts` | `migrate(raw)`: a stored state up to the current version, or null |
| `data/board.json` | the first board: twelve spaces, the start, the links, the design-pixel positions |
| `data/dice.json` | the die: 6 sides |
| `data/classes.json` | each class's hp, attack, defense and starting gold |
| `data/spaces.json` | the kinds of space and their labels |

## The state

```
GameState { version: 1, seed, board, characters: { [id]: Character }, die }
Board     { start, spaces: { [id]: Space } }          a graph: spaces and links, never a grid
Space     { id, kind, name, x, y, links: string[] }   x, y in design pixels (412 by 915, portrait)
Character { id, name, classId, hp, maxHp, attack, defense, gold, space, steps }
Die       { sides, last }                              last: the value rolled, null before the first roll
```

`steps` is what the character still owes from the last roll; 0 means no roll is pending. The random stream is **not** in the
state: whoever holds the state holds the stream (shared-world rule 5: a seed is never sent to a client before its roll is
spent). `seed` in the state is the world's seed, for the generator to come.

## The actions and what they do

Every action carries `id` (made by the client, a UUID) and `player`. A repeat of an id is the holder's business
(the region actor stores answers by id; the solo client does not need to).

- **`roll`**: refused with `finish your move first` while `steps > 0`. Otherwise `rng.int(die.sides)`; `die.last` and
  `steps` become the value; event `rolled { value }`.
- **`move { path }`**: `path` is every space stepped on, in order, ending on the landing space. Refused with `roll first`
  when `steps` is 0; `wrong number of steps` when `path.length ≠ steps`; `no such space`; `not connected` when two
  consecutive spaces are not linked; `no turning back` when a step goes straight back to the space just left (mine,
  2026-10-31: the Dokapon rule, so a roll cannot be wasted by shuffling back and forth). On success the character stands on
  the last space, `steps` is 0, events `moved { from, path }` then `landed { space, kind }`.
- Any action for a player not in the game: `unknown player`.

A refused action returns the **same** state object and one `rejected { action, player, reason }` event. Nothing throws.

**One intent per roll** (mine, 2026-10-31): the whole walk goes in one `move`, so a phone sends one message per turn and the
server checks the walk in one go. Forks are expressed by the path; `legalPaths(board, from, steps)` lists every allowed walk
in link order, and the client offers (today: picks) one of them.

**Landing does nothing yet.** `landed` says the kind of space; what a battle, shop, event, treasure, quest, boss gate or
shrine does comes with MVP step 1's next pieces.

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

Attack and defense are not used by any action yet; they are there so the fight can be written against them.

The board: a ring of twelve spaces round the middle of the phone screen, plus one chord across the middle between the two
event spaces (Crossroads and Windy Ridge), so there are two forks and the board is a graph, not a loop. Clockwise from the
start: Ashford (town, the start), Moor Edge (battle), Tinker Cart (shop), Crossroads (event), Thornwood (battle), Old Cairn
(treasure), Moon Shrine (shrine), Fen Path (battle), Hermit Hut (quest), Windy Ridge (event), Iron Gate (boss gate), Ravine
(battle). The names are placeholder lore (mine). The kinds are the brief's eight (Robin, 2026-10-31).

`rules/test/board.test.ts` keeps the board sound: links both ways, no dead ends, every roll usable from every space, every
space inside the screen with room for the HUD and the Roll button. The generator that replaces this file must pass the same
tests.

## The tests (`npm test`, Vitest, in Node)

| File | Covers |
| --- | --- |
| `test/rng.test.ts` | the pinned sequences, resume from a stored state, every face comes up, `next()` stays in [0, 1) |
| `test/game.test.ts` | a new game; roll and its refusals; a roll replays from its seed; move, each refusal, the state untouched when refused; `legalPaths` agrees with `move`; three turns from one seed always play the same; `migrate` |
| `test/board.test.ts` | the board data, above |
| `test/purity.test.ts` | no `Math.random`, `Date`, timers, DOM, storage, network, console or package imports in `rules/src` |

Every new mechanic starts with a test of this shape: given a state, an action and a seed, this is the state and these are the
events (the skill `shared-world`).
