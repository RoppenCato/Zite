# The server (`server/`)

One Node process for Robin's PC, which stays on (Robin, 2026-10-31). Today it is the shape only: the database, one region
actor, a WebSocket that answers pings. **The client is not wired to it**; that is MVP step 2, and `docs/state/protocol.md`
is written before the first intent travels (the skill `shared-world`, rule 8).

| File | What it does |
| --- | --- |
| `src/db.ts` | opens SQLite (`better-sqlite3`), creates the schema, checks the schema version, `pruneResults` |
| `src/region-actor.ts` | `RegionActor`: the owner of one region's state; a queue, the rules, SQLite |
| `src/index.ts` | `npm run server`: opens `server/data/world.db`, wakes `region-0`, ticks its world once a minute, listens on ws://localhost:8787 |
| `test/region-actor.test.ts` | the actor against an in-memory database |

Node 24 runs the TypeScript straight (`node server/src/index.ts`): no build step. That needs `.ts` in relative imports and
only erasable syntax (no enums, no parameter properties), which `tsconfig.json` enforces for the whole project.

## The region actor (mine, 2026-10-31, the shape of a Durable Object or a Colyseus room)

- `new RegionActor({ id, db, now?, create? })` loads its row from `regions` or, when there is none, makes a fresh game
  (`create`, or `newGame` seeded with the region's id) at version 0 and stores it.
- `submit(action)` queues the action behind every earlier one; each is applied through `apply(state, action, rng, now())`
  with the actor's own random stream and its own clock (so spots that give again, bosses' returns and spawns run on the
  server's time), so a region never needs a lock and two phones never roll the same die.
- **The world ticks on the server**: `index.ts` submits a `tick` action every minute (`TICK_MS`), whoever is connected;
  spawns come and go on the region's clock (shared-world rule 4: the world keeps moving when a player drops). A tick
  that changes nothing leaves the version alone.
- **A repeated action id gets the stored answer** (`results` table, keyed by region and action id) and is marked
  `replayed: true`; the rules are not run again, the dice are not spent again.
- An action that changes the state bumps `version` by one; a refused action is answered, stored, and leaves the version
  alone. `snapshot()` gives `{ version, state }`, what a client will get on join and reconnect.
- After every action the actor writes its row (state as JSON, the random stream's position, the version) and the answer in
  **one transaction**; a new actor on the same database carries on exactly, dice included (the test proves it).
- `pruneResults(db, now, olderThanMs)` forgets old answers. Nothing calls it on a timer yet; a few days is the plan.

## SQLite (schema 1)

```
meta     (key, value)                                   schema_version
regions  (id, version, state, rng, updated_at)          one row per region actor
results  (region_id, action_id, result, created_at)     the answer to each action id
```

WAL mode on a file database. A database of another schema version stops the server with a clear error; the migration from
1 to 2 goes in `openDb` the day schema 2 exists. The file is `server/data/world.db` (ignored by git); `DB_PATH` and `PORT`
in the environment override the path and the port.

## The socket today

`{ "type": "ping" }` → `{ "type": "pong", "serverTime": <ms> }`; anything else → `{ "type": "error", "reason": ... }`
pointing at the protocol doc. The server pings every client every 25 s and drops one that does not answer (the Cloudflare
proxy closes idle sockets; the heartbeat keeps them warm and finds phones that died silently). `npm run tunnel` runs
`cloudflared tunnel --url http://localhost:8787` once cloudflared is installed; nothing uses it yet.

## Not here yet

The protocol and the message handlers (join, intent, snapshot, event, leave), accounts and the save, the fight room, the
presence actor, the boss-window timer that survives a restart, rate limits per connection, a script in `tools/` that drives
two clients through the same actions and compares their states with the server's.
