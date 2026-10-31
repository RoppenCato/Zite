---
name: shared-world
description: The rules for any feature that touches the shared world or the network (the dice, a space, a fight, town HP, bosses, traces, inventory, gold, proximity, saves, any client-server message). Use before building or changing such a feature, in solo play too, so co-op never needs a rewrite. Drawn from the research in docs/coop-research.md (2026-10-31).
---

# Building for the shared world

The board world is one world for everybody: a town's HP, a boss's HP, a trace left on a space, a player's gold and level are
shared facts. These rules keep them true, cheap, and safe on a phone with a bad connection. They apply in solo play as well,
because solo play is the same code with the state held locally (`CLAUDE.md`, "The one idea").

## 1. The rules are a pure function

- Everything that decides an outcome lives in `rules/`: `apply(state, action, rng) → { state, events }`. No DOM, no socket,
  no `Math.random`, no `Date.now()` inside it; time and randomness come in as arguments. The same function runs in the
  browser (solo) and in the server's objects (shared), and in Node for the tests.
- Every new mechanic is a test first: given a state, an action and a seed, this is the state and these are the events. A
  random outcome is replayed from its seed.
- Numbers live in data (`rules/data/*.json`), not in code: balancing is editing numbers.

## 2. Intents, not results

- The client sends what the player wants: `roll`, `move` (to which space), `attack` (which move, which target), `buy`,
  `leave_trace`. It never sends what happened. Whatever holds the state rolls the dice and decides.
- The server validates every intent against the state: is it this player's turn, is the move legal from here, does he have
  the gold, is the cooldown over. An illegal intent is rejected with a reason; the client shows the reason and resyncs.
- The client may **show** a result early (the die spinning, a hit flashing) but never **grants** it.

## 3. Every action has an id

- The client makes an id for each action (a UUID) and sends it with the intent. The server stores `(player, actionId) →
  result` and answers a repeat with the stored result. A phone that lost the reply retries the same id and never rolls
  twice, never pays twice, never hits the boss twice. Ids expire after a few days.
- A reply carries the state version it produced, so the client knows what it has.

## 4. One owner per piece of state

- A region's spaces, towns, bosses and traces belong to that region's actor; a live fight to its room; a player's
  character to the account. An actor is a class with a queue and its own rows in SQLite, the same shape as a Cloudflare
  Durable Object or a Colyseus room, so the server can move off Robin's PC later without a rewrite. The owner applies actions one at a time, so there are no lost updates and no locks. Nothing is
  written to two owners in one action; a thing that crosses owners (a player moving from one region to the next) is two
  actions, each safe on its own.
- The world keeps moving when a player drops: a boss window ends on its alarm whoever is online.

## 5. Dice and randomness

- The server rolls every die that matters (movement, loot, crits, the event drawn). The client gets the result and plays it
  back. In solo play with no server, the local rules roll from a seed held in the save; when the account exists, the server
  holds the seed.
- Shared seeds are predictable to whoever knows them; a seed is never sent to a client before its roll is spent.

## 6. Time

- The server sends **deadlines** (a timestamp: "your turn ends at 12:03:40"), never countdowns. The client draws the
  countdown from its own clock; a backgrounded tab's timers run slow, a timestamp does not.
- A turn that reaches its deadline is auto-played by the server (defend, or pass). Out-of-turn and duplicate actions are
  rejected.
- A time window (a boss's 48 hours) is a deadline stored by its owner and checked by a timer that survives a restart of the
  server, not an in-memory countdown.

## 7. Connecting, dropping, coming back

- On join and on every reconnect the client gets a **full snapshot with a version**, then deltas. The client never trusts
  what it had before a reconnect.
- On `visibilitychange` (back after more than 5 seconds hidden) and `pageshow` (a page restored from the back-forward
  cache) the client reconnects and refetches; a heartbeat every 20 to 30 seconds finds a socket the phone killed without a
  close event (iOS does this; Android Chrome is gentler, but the same code covers both); a library's retry budget must never
  give up for good (make a fresh client instead).
- A dropped player keeps his seat in a live fight for a window (30 to 60 seconds); his turns are auto-played meanwhile; the
  fight ends without him when the window closes.
- Players who were offline catch up by fetching state when the app opens or comes to the foreground; push, if it exists,
  is only a nudge.

## 8. The protocol is written down

- Every message between client and server is in `docs/state/protocol.md` before it is built: its name, its fields, who
  sends it, when, and what answers it. The five kinds: join, intent, snapshot, event, leave.
- Small and few: batch events every 50 to 100 ms; a message stays well under 1,500 bytes; the whole state is never sent on a
  tick, only on a snapshot.
- A change to the protocol changes both sides and the doc in one commit, and bumps the snapshot version.

## 9. Test it as multiplayer from the first shared feature

- Two browser windows (one private) against the local server, every time: join, act, drop one, bring it back, act out of
  turn, retry an action with the same id, background the tab and return. Bots do not find these bugs.
- A script in `tools/` drives two clients through the same fight and compares their final state to the server's.

## 10. Never trust the client

- Nothing on the client decides a winner, a price, a drop, a position on the board or who is nearby. Proximity is computed
  on the server from coarse cells; positions are never sent to other players; a link is made only by a token both used.
- Rate-limit intents per connection (a sliding window, such as 30 in 10 seconds) and close a socket that floods.
