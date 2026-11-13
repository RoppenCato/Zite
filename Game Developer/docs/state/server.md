# The server (`server/`)

One Node process for Robin's PC, which stays on (Robin, 2026-10-31). It holds the world: the database, one region actor
for the one region there is today, the accounts, and the hub that speaks the protocol over a WebSocket
(`docs/state/protocol.md`, written first). The client talks to it when the page was opened once with `?server=wss://…`
(`docs/state/client.md`); until then the client plays alone. **Since 2026-11-13 the same world also runs on Cloudflare
Workers** (`server-workers/`, the section "The world on Cloudflare" below): always on, no PC, no tunnel. The Node server
stays until Robin switches; the import carries the world across once.

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

## The world online: play away from home (Robin, 2026-11-10)

Robin chose the free way first: a **Cloudflare quick tunnel** in front of the server, and Miles, GD hands him the link; a
stable address (Tailscale Funnel, or a named tunnel on a domain) is the next step when he wants it. No domain for now.

1. `cloudflared.exe` lives in `tools/bin/` (ignored by git; Robin puts it there from Cloudflare's GitHub release; no
   install). `CLOUDFLARED=<path>` points elsewhere.
2. **`npm run online`** (`tools/online.mjs`) starts the server and `cloudflared tunnel --url http://localhost:8787`,
   reads the `https://….trycloudflare.com` address from cloudflared's log, and prints the phone's link:
   `https://zite-game.pages.dev/?server=wss://….trycloudflare.com`. It writes `server/data/online.json` (`url`, `link`,
   `since`), so a session can read the link and send it to Robin. The tunnel is started again if it drops (a new
   address, written again); stopping the script stops the server too. `TUNNEL=none` runs the server alone; `SITE=`
   changes the client's address in the link.
3. **Autostart**: `tools/install-autostart.cmd` (Robin runs it once, no admin) makes the scheduled task "Zite world"
   at logon, running `tools/online-loop.cmd` hidden (`online-hidden.vbs`): `npm run online`, again after 15 s if it
   stops; the log is `server/data/online.log`. `schtasks /end /tn "Zite world"` pauses it; `/delete` removes it.
4. **The phone** opens the link once; the address is remembered (`serverUrl`) and the account token with it, so later
   opens connect on their own. When the address changes, the connect screen says after three tries that the world
   may have moved and the newest link is the way in; `?server=off` goes back to solo.
5. The public site is the client (Cloudflare Pages); the LAN link (`http://192.168.0.43:5173/`) still works at home.
   A second phone opens the same link with its own name; the same character on a second phone: Settings → Account →
   the code, typed on the other phone's character screen.

`node tools/drive-coop.mjs` does all of this headless with two phones and a server of its own (`docs/state/pages.md`).

## The world on Cloudflare (`server-workers/`, mine, 2026-11-13)

The way without a PC, which the brief planned the server's shape for (CLAUDE.md, "The server"): a Cloudflare Worker with
Durable Objects. The region actor, the accounts and the hub are the Node server's code written once more over a small
`Sql` interface, so the object's SQLite and better-sqlite3 in the tests run the same lines; the protocol is the one above,
unchanged, so the client only gets a new address: `?server=wss://<worker>.workers.dev`. Built and checked locally on
2026-11-13; Robin deploys it himself (below) and decides when the phones switch.

| File | What it does |
| --- | --- |
| `wrangler.jsonc` | the worker `zite-world`: the two object classes (SQLite-backed, the only kind the free plan has), the `SITE` var for the front page, dev on port 8787 |
| `src/index.ts` | the worker's routes; `RegionObject` (the actor, the hub, the hibernating sockets, the alarm, the import); `AccountsObject` (the accounts, asked by the region objects over RPC) |
| `src/region-actor.ts` | `RegionActor` as above, over `Sql`; `openRegionSchema`, `pruneResults`; `replaceWith` and `putResults` for the import |
| `src/accounts.ts` | `Accounts` as above, over `Sql` and the browser's crypto; `importRows` |
| `src/hub.ts` | `Hub` as above, over a `Socket` interface (send, close, the player kept with the socket, when it was last alive); `sweep` for dead phones; the object's hooks `beforeJoin` and `onIntent` |
| `src/sql.ts` | `Sql`: `exec(query, ...bindings) → rows` and `transaction(fn)` |
| `test/memory-sql.ts` | `Sql` over better-sqlite3 in memory, for the tests |
| `test/region-actor.test.ts`, `test/accounts.test.ts`, `test/hub.test.ts` | the Node server's tests adapted (fake sockets instead of a port), plus the import, the sweep, the hooks, and a hub built again over the same storage and sockets, as after a sleep |
| `tools/import-world.mjs` | `npm run world:import`: the Node database into the worker, once |
| `.dev.vars.example` | copied to `.dev.vars` (ignored by git) for `wrangler dev`: the import's secret |

### How it is cut

- **One Durable Object per region** (`REGIONS`, named by the region's id; `REGION_IDS` in `index.ts` says which exist,
  `region-0` today, and a socket to any other path is refused). A socket to the worker's root `/` (what `?server=wss://…`
  opens) goes to `region-0`; `/region/<id>` names one. The object accepts the socket with the **Hibernation API**: between
  frames the object leaves memory (after about 10 s of quiet) and costs nothing, the sockets stay open, and the next
  frame, alarm or request builds it again from its SQLite. What a socket must remember through that, its player, is kept
  on the socket itself (`serializeAttachment`); the hub finds its sockets again in the constructor.
- **The world's tick is the object's alarm**: every minute while someone plays (an intent in the last ten minutes with a
  socket open), every ten minutes otherwise (mine: every wake costs the free plan's duration, below). A player who joins
  after a quiet spell gets a tick first, so the world in the snapshot is today's. The alarm also drops sockets that have
  shown no life for 90 s, and once an hour forgets answers older than three days. If the alarm's work fails, the next
  alarm is set anyway.
- **The client's ping is answered by the runtime** without waking the object (`setWebSocketAutoResponse`), so the `pong`
  carries no `serverTime` from here; the client takes its clock from the snapshot, the results and the events. The runtime
  remembers when it last answered a socket, which is how a dead phone is told from a quiet one.
- **The accounts are one object** (`ACCOUNTS`, named `accounts`): the region objects ask it who a token or a code belongs
  to. The same rows, tokens and codes as the Node server's, stored as they are.
- **The same tables** in each object's SQLite (`meta`, `regions`, `results` in a region; `meta`, `accounts`, `tokens` in
  the accounts), schema 2, so the import is a copy and the actor's description above holds.
- `GET /` is a page with the link a phone opens once (built from the worker's own address and `SITE`); `GET /status` says
  each region's version, characters and players online, and how many accounts.

### What differs from the Node server

- The pong carries no `serverTime`; the server sends no WebSocket-level pings; a dead phone is noticed by the alarm (90 s,
  plus the alarm's spacing) instead of within 50 s.
- The world ticks every ten minutes, not every minute, once nobody has acted for ten minutes.
- Nothing lives only in memory: the rate limit's window and the bundling timer are the only in-memory things, both short;
  everything else is in the object's SQLite or on the socket.
- No file, no port, no process: the storage is the object's. `wrangler dev` keeps it in `server-workers/.wrangler/`
  (ignored by git), so a local world survives a restart of `wrangler dev` too.

### The import (once)

`tools/import-world.mjs` copies the three database files to a temporary folder (it never opens the live file), reads the
regions, the stored answers, the accounts and the tokens, and posts them to the worker with the import's secret:
`POST /import/region?region=<id>` (the state is stepped up to today's save version by `migrate`; refused with 409 when the
object already holds a played world, unless `--replace`), `/import/results` in batches of a thousand (an id already there
keeps its answer), `/import/accounts` (an account with the same id is replaced, a token already there is kept). Run twice,
it changes nothing but the refusal. The secret is `IMPORT_SECRET`: a Wrangler secret on the deployed worker,
`server-workers/.dev.vars` under `wrangler dev`; with no secret set the import is refused, and a wrong one gets 401. Stop
the Node server first, so the copy is whole. Answers older than three days go at the first hourly prune, as the rule says.

### Running it locally

`npm run world:dev` (wrangler dev on ws://localhost:8787, the Node server's port, so run one or the other). Then the client
at `http://localhost:5173/?server=ws://localhost:8787`, and a second window at `http://127.0.0.1:5173/…`: another origin,
so another storage and another account. Checked in the browser pane on 2026-11-13: two windows joined, saw each other
and the imported Robin on the board, one rolled, walked and fought a Jelly Slime while the other watched her mark move,
and a reload brought the same character back mid-fight; the import brought Robin the warrior across at version 3042 with
his 4,286 answers, and a second import was refused.

### Deploying it (Robin runs these; the AI holds no Cloudflare login)

1. `npx wrangler login` once: the browser opens on Cloudflare; the free plan is enough.
2. `npm run world:deploy`: the worker and its two object classes go up; the address printed is the world's:
   `https://zite-world.<account>.workers.dev`.
3. `npx wrangler secret put IMPORT_SECRET -c server-workers/wrangler.jsonc`, and type a secret of your own.
4. Stop the Node world (`tools/stop-world.cmd`, or `schtasks /end /tn "Zite world"`), then
   `npm run world:import -- --to https://zite-world.<account>.workers.dev --secret <that secret>`. It prints who came across.
5. On the phone, open `https://zite-world.<account>.workers.dev/` and tap the link, or open
   `https://zite-game.pages.dev/?server=wss://zite-world.<account>.workers.dev` once; the phone remembers it. The phone
   that made the account has its token and comes back as the same character; another phone types the recovery code.
6. `npm run world:tail` shows the worker's log live; `/status` is the quick look. A later `npm run world:deploy` keeps the
   objects' storage; renaming a class or changing a table needs a new entry under `migrations` in `wrangler.jsonc`. The
   autostart task on the PC can then be removed (`schtasks /delete /tn "Zite world"`).

### The free plan, and what it means for Zite

Cloudflare's numbers on 2026-11-13: 100,000 requests a day (a socket opening is one; incoming frames count twenty to a
request; outgoing frames and the runtime's pongs are free); 13,000 GB-seconds of duration a day, billed only while an
object is in memory (about 10 s after each wake, nothing while it sleeps); 5 million SQLite rows read and 100,000 written
a day; 5 GB stored; Workers Logs free up to 200,000 lines a day. Past a limit, that kind of operation fails until midnight
UTC. For Zite: an action writes two rows (the region's row and its answer) and a tick two more, so about 48,000 actions a
day fit, and a day of play by a few friends is a few thousand. Duration: a world awake all day would be 10,800 GB-s,
which is why the tick slows to ten minutes when nobody plays; two hours of play plus an idle day come to about 1,100.
The region's state is one row of 266 KB today (the board grows with the world; a row may hold 8 MB; a snapshot over the
socket is the same size). Past the free plan it is the Workers Paid plan at $5 a month.

## Not here yet

Many regions (the world is one region today, so one actor holds every character; on Cloudflare `REGION_IDS` grows with
them); the fight room; the presence actor, geohash and QR tokens; hashing the tokens; a script that compares two clients'
states with the server's beyond `drive-coop.mjs`, which still starts the Node server, not the worker. The world boss's
window is a deadline in the state (`spawn.until`), checked by the tick, which survives a restart with the state.
