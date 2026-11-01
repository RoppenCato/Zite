# The server (`server/`)

One Node process for Robin's PC, which stays on (Robin, 2026-10-31). It holds the world: the database, one region actor
for the one region there is today, the accounts, and the hub that speaks the protocol over a WebSocket
(`docs/state/protocol.md`, written first). The client talks to it when the page was opened once with `?server=wss://…`
(`docs/state/client.md`); until then the client plays alone.

| File | What it does |
| --- | --- |
| `src/db.ts` | opens SQLite (`better-sqlite3`), creates the schema (2), steps an older database up, `pruneResults` |
| `src/region-actor.ts` | `RegionActor`: the owner of one region's state; a queue, the rules, SQLite, the delta of each action |
| `src/accounts.ts` | `Accounts`: the rows the save lives under; tokens for devices, a recovery code per character |
| `src/hub.ts` | `Hub`: the sockets; join, intent, snapshot, result, event, leave; the rate limit; the bundling of what others hear |
| `src/index.ts` | `npm run server`: opens `server/data/world.db`, wakes `region-0`, ticks its world once a minute, forgets old answers, listens on ws://localhost:8787 |
| `test/region-actor.test.ts` | the actor against an in-memory database |
| `test/hub.test.ts` | the hub with real sockets on a free port: two players joining, acting, replaying, reconnecting, recovering, flooding, leaving; the tick reaching everyone |

Node 24 runs the TypeScript straight (`node server/src/index.ts`): no build step. That needs `.ts` in relative imports and
only erasable syntax (no enums, no parameter properties), which `tsconfig.json` enforces for the whole project.

## The region actor (mine, 2026-10-31, the shape of a Durable Object or a Colyseus room)

- `new RegionActor({ id, db, now?, create? })` loads its row from `regions` or, when there is none, makes a fresh world
  with nobody in it (`create`, or `newWorld` seeded with the region's id) at version 0 and stores it. Players arrive with
  the rules' `join` action.
- `submit(action)` queues the action behind every earlier one; each is applied through `apply(state, action, rng, now())`
  with the actor's own random stream and its own clock (so spots that give again, bosses' returns and spawns run on the
  server's time), so a region never needs a lock and two phones never roll the same die.
- **The world ticks on the server**: `index.ts` submits a `tick` action every minute (`TICK_MS`) through the hub, whoever
  is connected; spawns come and go on the region's clock (shared-world rule 4: the world keeps moving when a player
  drops). A tick that changes nothing leaves the version alone.
- **A repeated action id gets the stored answer** (`results` table, keyed by region and action id) and is marked
  `replayed: true`; the rules are not run again, the dice are not spent again.
- An action that changes the state bumps `version` by one; a refused action is answered, stored, and leaves the version
  alone. Every fresh answer carries the **delta** (`diffState`, `docs/state/protocol.md`): what changed, by reference, for
  the client's merge; a replayed answer carries none. `snapshot()` gives `{ version, state }`; `currentVersion` the
  number alone.
- After every action the actor writes its row (state as JSON, the random stream's position, the version) and the answer in
  **one transaction**; a new actor on the same database carries on exactly, dice included (the test proves it).
- `pruneResults(db, now, olderThanMs)` forgets old answers; `index.ts` calls it once an hour, keeping three days.

## The accounts (mine, 2026-11-01: the save is the account)

- `Accounts.create({ name, classId, regionId })` makes a row with a fresh id (`p-` and ten hex characters: the player id
  the state keys the character by), a **recovery code** (twelve letters from an alphabet without 0, O, 1 and I, shown as
  `KPM4-R7QX-2HJD`) and a first **token** (a UUID the device keeps). `byToken`, `byRecovery` (however the code was typed),
  `newToken(accountId)` for another phone (the old tokens stay good: one account, many phones), `touch`, `count`.
- Token and code are stored as they are, on Robin's PC; hashing them is a step for a public server, not a game among
  friends. A solo save is never taken from a client (rule 10): a new account starts at the start.

## The hub (mine, 2026-11-01)

- `attach(ws)` takes a socket; every frame is read as JSON (`not JSON`, `too big` over 16 KB, `unknown message`).
- **`join`**: with a `token` → the account, or `unknown account`; with `recover` → the account and a new token, or
  `unknown code`; with `name` and `classId` → a new account, then the rules' `join` action into the region (the others hear
  the newcomer as an event). The wrong `protocol` is `protocol 1 needed`; a second join on one socket `already joined`.
  Then the **snapshot**: the whole state, the version, the player's id, the recovery code, the token when new, who is
  online; and the others hear the new online list.
- **`intent`**: `join first` before a join; the action must have a string `id` and a known `type` (`tick` and `join` are
  `not yours to send`; the rest `unknown action`); the hub **stamps the account's id** as `player` whatever the client
  wrote; **30 intents in any 10 s** per socket, more are `too fast`, and after ten more the socket is cut off: the intents the actor already took are still answered, then the socket is closed (1008). The
  answer is a **`result`** with the events, `replayed` and the delta; everyone else on the region is owed an **`event`**.
- **Bundling**: what a socket is owed is gathered for `BATCH_MS` (60 ms) and sent as one `event`: deltas merged
  (`mergeDeltas`), the events in order (only the shared ones: joined, moved, won, died, opened, bossDown, levelled,
  spawned, despawned, questDone, traced, worldBossDown, bossLeft; a fight's blows stay with the fighter), the version the
  latest, the online list when it changed.
- **`leave`** and a closed socket drop the player from `online`; the others hear it. `tick()` runs the world's tick and
  tells everyone what spawned or left. `close()` ends every socket when the server stops.
- A thrown error inside the rules (a malformed action) answers `that could not be done` and is logged; the actor's state
  is untouched and the queue goes on.

## SQLite (schema 2)

```
meta     (key, value)                                     schema_version
regions  (id, version, state, rng, updated_at)            one row per region actor
results  (region_id, action_id, result, created_at)       the answer to each action id
accounts (id, name, class_id, region_id, recovery, created_at, last_seen)
tokens   (token, account_id, created_at)                  the devices' secrets
```

WAL mode on a file database. Every statement is "if not exists", so opening a schema-1 database makes the two new tables
and writes 2; a database of a newer schema stops the server with a clear error. The file is `server/data/world.db`
(ignored by git); `DB_PATH` and `PORT` in the environment override the path and the port.

## The socket

The protocol is `docs/state/protocol.md`. The server pings every client every 25 s at the WebSocket level and drops one
that does not answer (the Cloudflare proxy closes idle sockets; the heartbeat keeps them warm and finds phones that died
silently); `maxPayload` is 1 MB. `npm run tunnel` runs `cloudflared tunnel --url http://localhost:8787` once cloudflared
is installed; the address it prints (`https://….trycloudflare.com`) is opened on the phone as
`https://<the client's host>/?server=wss://….trycloudflare.com`.

## Running it for friends (how Robin tests it)

1. `npm run server` on the PC (the database is made on the first run).
2. `npm run tunnel` in a second window; copy the `https://….trycloudflare.com` address.
3. Serve the built client (`npm run build && npm run preview` on the PC and a second tunnel to port 4173, or Cloudflare
   Pages later), and open it on the phone once as `…/?server=wss://<the server's tunnel address>`. The character screen
   says "the world at …"; Begin makes the account; the address is remembered, so later opens connect on their own.
4. A second phone does the same with its own name: both see each other on the board. The same character on a second
   phone: Settings → Account → the code, typed on the other phone's character screen ("I have a code from another phone").
5. `node tools/drive-coop.mjs` does all of this headless with two phones and a server of its own (`docs/state/pages.md`).

## Not here yet

Many regions (the world is one region today, so one actor holds every character); the fight room; the presence actor,
geohash and QR tokens; hashing the tokens; a script that compares two clients' states with the server's beyond
`drive-coop.mjs`. The world boss's window is a deadline in the state (`spawn.until`), checked by the minute's tick,
which survives a restart with the state.
