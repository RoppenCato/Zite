# The protocol (`docs/state/protocol.md`)

Every message between the client and the server, written before it was built (the skill `shared-world`, rule 8). One
WebSocket per client, JSON text frames, one message a frame, a `type` in each. Protocol version **1** (mine, 2026-11-01).
A change here changes both sides (`client/src/remote-game.ts`; `server/src/hub.ts` and `server-workers/src/hub.ts`) in
the same commit and bumps `PROTOCOL_VERSION` in `rules/src/protocol.ts`, which all import.

The server is the one owner of the world's state: it rolls every die, it applies every action, it answers with what
happened. The client sends intents, never results. Solo play is the same client with `LocalGame` holding the state instead
(`docs/state/client.md`); the scenes cannot tell the two apart.

## The five kinds

| Kind | Who sends it | When | What answers it |
| --- | --- | --- | --- |
| `join` | client | once, right after the socket opens (and again on every new socket) | `snapshot`, or `error` |
| `intent` | client | whenever the player acts | `result` to the sender; `event` to everyone else on the region |
| `snapshot` | server | after a `join` | — |
| `event` | server | when another player or the world changed the state, or someone came or went | — |
| `leave` | client | when the player signs out on purpose | the server closes the socket |

And two small ones: `ping` (client) → `pong { serverTime? }` (server; the Node server puts its time in, the Cloudflare
runtime answers in the object's sleep without it, 2026-11-13); `error` (server) for anything refused.

## Identity: the account is the save

An **account** is a row in SQLite (`accounts`): its id is the `player` the state keys characters by (`p-` and ten
characters), its **token** is the secret the device keeps (a UUID, in `localStorage` under `boardworld.account`), its
**recovery code** is three groups of four letters and digits (`KPM4-R7QX-2HJD`, no 0/O/1/I) that a player types on a new
phone to get the same character. One account, one character, in the one region there is today (`region-0`). The token
and the code are stored as they are, on Robin's PC; hashing them is a step for a public server, not for a game among friends
(mine, 2026-11-01). A solo save is not uploaded: the server never takes a state from a client (rule 10); the account starts
at the start, the solo save stays for offline play.

## Messages from the client

```
join    { type: 'join', protocol: 1, token?: string, name?: string, classId?: ClassId, recover?: string }
intent  { type: 'intent', action: { id: string, type: string, ...the action's fields } }
leave   { type: 'leave' }
ping    { type: 'ping' }
```

- `join` with a `token`: resume that account. With `recover`: the account that code belongs to; the answer carries a
  fresh `token` for this device (the old device's token still works: one account, many phones). With `name` and
  `classId` and nothing else: a new account and its character, placed at the start by the rules' `join` action. A socket
  joins once; a second `join` is an error. A wrong `protocol` is refused with `protocol 1 needed`, and the client reloads.
- `intent.action` is the rules' action **without `player`**: the server stamps the account's id on it and never believes
  one sent by the client. `id` is a UUID the client made (rule 3): a retry sends the same id and gets the stored answer.
  The kinds a client may send: roll, move, fight, buy, sell, equip, unequip, drop, use, gamble, pick, quest, keep, trace;
  `tick` and `join` are the server's own and are refused from a client (`not yours to send`); anything else is
  `unknown action`.
- Before `join`, only `ping` is answered; an `intent` gets `error 'join first'`.

## Messages from the server

```
snapshot { type: 'snapshot', version, serverTime, player, token?, recovery, state, online: string[] }
result   { type: 'result', action: string, version, serverTime, events, replayed: boolean, delta? }
event    { type: 'event', version, serverTime, events, delta?, online? }
error    { type: 'error', reason: string, action?: string }
pong     { type: 'pong', serverTime? }
```

- `snapshot` is the **whole state** with its **version** (the region's action counter), the player's own id, the
  recovery code, and who is online. The client throws away what it had and starts from this (rule 7): after every new
  socket, never only on the first. `token` is in it only when the account was just made or just recovered.
- `result` answers one `intent` by its action id: the version it produced, the events (a refused action has one
  `rejected` event with the reason), `replayed` when the id had been answered before, and the **delta** when the answer is
  fresh and the state changed. A replayed answer carries no delta: the client that retries has just rejoined and holds a
  snapshot at least as new; it plays the events and keeps its state.
- `event` carries what others and the world did since the last one, **batched**: at most one every 60 ms a socket, the
  deltas merged, the events in order, the version the latest. `online` is in it when someone came or went. Only the
  events worth a line travel to others: joined, moved, won, died, opened, bossDown, levelled, spawned, despawned,
  questDone, traced, worldBossDown, bossLeft; a fight's blows stay with the fighter (the delta carries the pieces).
- `serverTime` is in every answer (but a pong from Cloudflare) so the client can draw its countdowns (spawns leave at
  `until`, spots give again at their time) from the server's clock, never from a countdown sent down (rule 6). There are no turn deadlines yet: no
  fight is timed (the brief: no timers, no punishment for being away).

## The delta

```
delta { characters?: { [id]: Character }, spawns?: { [space]: Spawn }, board?: Board, die?: Die, nextItem?: number,
        traces?: { [space]: Trace[] } }
```

A part is present only when it changed, found by reference (`rules/src/delta.ts`, `diffState`): the rules never change a
state in place, so an unchanged character is the same object as before and is left out. `characters` holds **whole**
characters (a few kilobytes with gear and errands), `spawns` the whole map (small), `board` the whole board when it grew or a
vault opened (rare, and big: tens of kilobytes). The client folds a delta in with `mergeDelta`. That is the one place the
"well under 1,500 bytes" rule bends: events stay small; a whole character, the board and the snapshot are the full objects.
A test drives the rules through hundreds of random actions and checks that a client folding deltas ends with exactly the
server's state, so a mutation in place would be caught the day it is written.

## Connecting, dropping, coming back

- The client opens `wss://<host>` (the tunnel) or `ws://localhost:8787`, sends `join`, waits for `snapshot`, then plays.
  Its intents go one at a time: the scenes are busy until the `result` comes (the Roll button dims, the fight's buttons
  wait), so at most one intent is ever in flight.
- Every 20 s the client sends `ping`; no `pong` within 10 s, or a close, and it reconnects: a new socket after 1 s, then
  2, 4, 8, up to 15 s between tries, forever (rule 7: never give up for good). On `visibilitychange` back to visible and on
  `pageshow` it does the same at once. After the snapshot it resends the intent that was in flight, same id: the server
  answers from its store if it had already applied it.
- The Node server pings every socket every 25 s at the WebSocket level and drops one that does not answer; the Cloudflare
  world answers the client's pings in its sleep and its alarm drops a socket silent for 90 s. A dropped socket takes the
  player off `online` and the others hear it in an `event`.
- The world keeps moving while nobody is connected: the Node server ticks its region once a minute (`index.ts`); the
  Cloudflare world once a minute while someone plays and every ten minutes otherwise, with a tick before each join
  (`docs/state/server.md`, "The world on Cloudflare").

## Limits

- 30 intents in any 10 seconds per socket; more get `error 'too fast'`, and a socket that keeps flooding is closed.
- A frame over 16 KB is refused (`error 'too big'`); nothing a client sends is near that.
- Unknown `type`, a frame that is not JSON, an action with no `id` or no `type`: `error` with the reason, the socket stays.

## Not here yet

Many regions (the world is one region today, so one actor holds every character); a fight room for live joint fights;
presence by place (the geohash cell) and QR tokens; push; deltas smaller than a whole character. A world boss and the
notes on spots travel inside the state (spawns and traces), with no message of their own.

The `quest` intent gained `index` (which of the board's quests) and `drop` (drop the one under way); `buy` gained `line`. The offer `quest` became `board`. Events added: `personFound`.

The `try` intent answers the offer `roll`; it gives the event `tried`.

The `travel` intent (`to`) gives the event `traveled`.

The `pick` intent is gone (2026-11-02); `skill`, with `op` learn, carry, reset, or for testing testClass and testLevel, is new. Nothing else about the wire changed.

## Links (2026-11-02)

`link` is an ordinary action: `offer` gives a six-letter code good for 60 seconds, `accept` with a friend's code links both for 30 minutes, `join` enters the world boss a linked friend is fighting. It runs on the region's state, so the server rolls the code. QR and GPS come when the tunnel gives HTTPS. Live joint battles wait on Robin (the brief's open question 1).
