# How to build a co-op game like this: the research

Robin, 2026-10-31: "Do research online, look at at least 20 sources, for how to make coop game like this (even with claude)
and how to make it work well, like choice of tools to use, code etc. Update your skills with what you find." Read the same
day: 28 pages fetched and 14 searches. What it changed is in `CLAUDE.md` ("The technical direction") and the skill
`shared-world`. Each source below has one line of what it taught; the decisions drawn from them are at the end, marked mine.

## Architecture: who owns the truth

1. [Nakama: authoritative multiplayer](https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/llm.md): the
   match handler's loop runs at a tick rate you choose (1 a second for turn-based); four patterns, among them **passive
   turn-based** (a match spanning hours to weeks: the server validates an input, stores it, broadcasts to whoever is
   connected, and stops the loop until the next turn); a match keeps running after everyone leaves; one message per tick
   per player; payloads well under 1,500 bytes; one 1,000-byte message a second beats five of 200.
2. [What is an authoritative game server (Crux)](https://crux.supercraft.host/blog/what-is-an-authoritative-game-server/):
   decide which process may change each piece of state; **clients send requests, not results** ("fire weapon A at input N",
   never "I dealt 100 damage"); final outcomes are applied once by the durable backend, protected against duplicates; for a
   turn-based or async game a plain HTTP backend can be the authority and a ticking simulation is not needed; authority is
   not complete anti-cheat.
3. [How to make a multiplayer browser game (2026)](https://app.cinevva.com/guides/multiplayer-browser-game): WebSockets with
   an authoritative server is the practical default; **start without netcode and build the single-player core first**; keep
   game logic separate from transport so switching hosts is a migration, not a rewrite; costs scale with concurrency and
   bandwidth; Hathora shut down in May 2026, which is why room logic must be portable; a table of backends and their prices.
4. [Building a multiplayer board game with JavaScript and WebSockets](https://dev.to/krishanvijay/building-a-multiplayer-board-game-with-javascript-and-websockets-4fae):
   one room per game, the server the only source of truth, the message set (joinRoom, playerMove, moveMade, invalidMove,
   newTurn, rejoin), a rejoin carrying the game and player ids, Redis pub/sub only when there are several server instances.
5. [Unity: turn change notification patterns](https://docs.unity.com/en-us/cloud-code/3.0.0/modules/stateful-cloud-code/turn-change-notification-patterns.md):
   the mover gets the result in the call's reply; connected players get a push; **players who were offline fetch the state
   when the app opens or returns to the foreground**; combine both so every player is covered.
6. [SmartFoxServer forum: a turn-based game's requirements](https://forums.smartfoxserver.com/viewtopic.php?p=112583): a
   server-authoritative state machine with one turn timer that auto-plays on expiry; reject out-of-turn and duplicate
   actions; send the deadline, not ticks, because a background tab's timers run slow; a snapshot on reconnect carries the
   phase, whose turn, the scores and the timer's end.
7. [Colyseus: Making multiplayer games with Node and TypeScript (talk)](https://gitnation.com/contents/making-multiplayer-games-with-colyseus-nodejs-and-typescript):
   a seat reservation over HTTP, then the WebSocket; the full state before any patches; only the server mutates state;
   50 to 100 connections a room; keep room state small.
8. [Colyseus: the Room API](https://docs.colyseus.io/room): lifecycle hooks (onCreate, onAuth, onJoin, onDrop, onReconnect,
   onLeave, onDispose), `allowReconnection` for a dropped client within a window, `patchRate` 50 ms by default, a seat held
   15 s, `maxClients`, payload validation with Zod that disconnects on failure.
9. [Socket.IO: connection state recovery](https://socket.io/docs/v4/connection-state-recovery): on reconnect the client
   sends its session id and last processed offset and the server replays what it missed; it "will not always be successful",
   so the client still needs a full resync path.

## Hosting: where the server runs

10. [Cloudflare Durable Objects: WebSockets and hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/):
    `acceptWebSocket` lets an object sleep with its sockets open; pings are answered without waking it; `setTimeout` and
    `setInterval` prevent hibernation, alarms do not; `serializeAttachment` keeps 16 KB per connection across sleeps; batch
    small messages every 50 to 100 ms.
11. [Cloudflare Durable Objects: pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/): free plan
    100,000 requests and 13,000 GB-s a day, 5 GB stored; paid from $5 a month with 1 million requests and 400,000 GB-s;
    the worked example: sockets held open all month $419, the same with hibernation $20.
12. [Cloudflare Durable Objects: limits](https://developers.cloudflare.com/durable-objects/platform/limits/): a soft limit
    of 1,000 requests a second per object (an overloaded object returns an error: shard by region, not one world object);
    10 GB of SQLite per object on the paid plan; 30 s CPU per event; unlimited objects.
13. [Cloudflare Durable Objects game server setup (2026)](https://tech-insider.org/cloudflare-durable-objects-game-server-setup-2026/):
    one object per room by `idFromName`, a tick by re-armed alarm, a 30-messages-per-10-seconds rate limit that closes the
    socket with 1008, only `ctx.storage` survives eviction, objects cannot read each other (shared results go to D1),
    `accept()` instead of `acceptWebSocket()` silently kills hibernation and the bill.
14. [Cloudflare: WebSockets through the proxy](https://developers.cloudflare.com/network/websockets/): on by default on
    every plan (so a Cloudflare Tunnel carries them); idle connections are closed, so keep a client heartbeat; a release can
    restart a connection.
15. [PartyKit docs](https://docs.partykit.io/): **the hosted PartyKit platform shuts down on 23 October 2026**; the way on is
    PartyServer on Durable Objects. Do not build on PartyKit.
16. [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits): free 200 concurrent connections, 100
    messages a second, presence 20 messages a second and 5 calls per client per 30 s, 10 keys per presence object;
    Pro 500 connections and 500 messages a second.
17. [Supabase Realtime: the three ways (issoh)](https://www.issoh.co.jp/tech/details/17058/): Broadcast for fast transient
    state, Presence for who is online (never on every input), Postgres Changes scale with subscribers not writes (a poor fit
    for many clients watching one row).
18. [SpacetimeDB: building with Claude Code](https://spacetimedb.com/blog/building-with-claude-code): logic as reducers
    inside the database, clients subscribe to tables; a working template in the same stack is what let Claude build a game
    in a few prompts. Another road; noted, not taken.

## Correctness on a bad connection

19. [Idempotency keys (brandur)](https://brandur.org/idempotency-keys): a client-made key per request, stored with the
    response; a retry gets the stored response; a lock while in progress; a reaper after about 72 hours; multi-step work split
    at every foreign side effect with a recovery point.
20. [Optimistic locking in Postgres (oneuptime)](https://oneuptime.com/blog/post/2026-01-30-optimistic-locking-implementation/view)
    and [curatedsql](https://curatedsql.com/2024/07/30/optimistic-locking-in-postgres/): a version column catches lost
    updates, but under heavy contention (a boss everyone hits) retries cost more than a single owner applying actions in
    order. Our answer is the owner, not the lock.
21. [Wildfire Games: simulation requirements](https://trac.wildfiregames.com/wiki/SimulationRequirements) (via search; the
    page was down): a deterministic simulation gives the same outcome whatever the timing or hardware; replace `Math.random`
    with a seeded stream; it is for sync and replay, not for trust.
22. [Wesnoth forum: multiplayer and RNG cheating](https://wesnoth.org/forum/viewtopic.php?p=130621) (via search): a shared
    seed is predictable to whoever knows it; roll on the server, or commit-and-reveal.
23. [Claude skill: game security and anti-cheat](https://skillsmp.com/creators/lebobo88/rlm-gaming/claude-skills-game-security-and-anticheat):
    the server simulates or validates, the client only requests; outcome-affecting RNG is server-seeded and server-rolled.

## Phones: the PWA, backgrounding, the camera

24. [PWA iOS limitations and Safari support (MagicBell)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide):
    install is manual (Share, Add to Home Screen; no `beforeinstallprompt`); **cached data is gone after 7 days unused**, and
    about 50 MB; push from iOS 16.4 for installed apps; no background sync of any kind: sync on `online` and when the page
    becomes visible. It says EU phones lost standalone web apps in iOS 17.4; Apple announced in March 2024 that it kept
    them. Test on a real iPhone.
25. [Firtman: PWAs on iOS](https://firt.dev/ios-pwa/) (2018, the baseline): no code runs in the background; a backgrounded
    app can come back as a white screen and restart; geolocation, camera and WebRTC work; no orientation lock.
26. [Flarum PR 4590: recover WebSockets after iOS backgrounding](https://github.com/flarum/framework/pull/4590): iOS
    closes the socket **without firing close**; the fix is `visibilitychange` (reconnect if hidden more than 5 s),
    `pageshow` with `persisted` (the back-forward cache return does not fire visibilitychange), an explicit disconnect, a
    100 ms wait, connect, then a refetch only after `connected`; its follow-up ([issue 4597](https://github.com/flarum/framework/issues/4597))
    found the library's retry budget giving up for good after a few cycles.
27. [Apple forums: WebSocket closed when Safari goes to the background](https://developer.apple.com/forums/thread/696310)
    and [Socket.IO issue 2924](https://www.github.com/socketio/socket.io/issues/2924): the same, from the other side;
    timeouts and a visibility-based reconnect are the fixes people land on.
28. [Barcode scanning on iOS, the missing API](https://eringen.substack.com/p/barcode-scanning-on-ios-the-missing):
    Safari and every iOS browser lack `BarcodeDetector`; ZBar compiled to WASM scans QR at near-native speed (a loop every
    150 ms, a hit within a couple of frames on a modern iPhone); pure JS decoders drop frames on older phones; mind memory
    ownership across the WASM bridge (a use-after-free after 70 s of scanning).
29. [What PWA can do today: barcode](https://whatpwacando.today/barcode) and
    [WebKit bug 281848](https://bugs.webkit.org/show_bug.cgi?id=281848): the Shape Detection flag in Safari is unreliable
    and broke in 17.6; not for production. Feature-detect, then fall back.
30. [Geohashes (Movable Type)](https://www.movable-type.co.uk/scripts/geohash.html): 7 characters is about 153 m by 153 m,
    8 is 38 m by 19 m; a proximity search checks the cell and its eight neighbours, because two points 30 km apart can
    differ in their first character while two neighbours share none.

## The client

31. [Phaser vs PixiJS (generalistprogrammer)](https://generalistprogrammer.com/comparisons/phaser-vs-pixijs): Phaser about
    1.2 MB with scenes, input, physics, audio and tweens built in; PixiJS about 450 KB, rendering only; pick Phaser for a
    complete 2D game, Pixi for a custom engine.
32. [html5gamedevs: how much faster is Phaser 3](https://html5gamedevs.com/topic/42001-how-much-faster-is-phaser3) and
    [Phaser issue 1815](https://github.com/photonstorm/phaser/issues/1815): benchmarks conflict and depend on the setup;
    asset size, texture memory and draw calls decide the frame rate on a phone, not the library.
33. [Phaser 4.2.0 "Giedi"](https://phaser.io/download/release/v4.2.0) (19 June 2026; 4.0.0 on 10 April 2026): Phaser 4 is
    the current line.

## The world

34. [Generating world maps for Unexplored 2](https://www.gamedeveloper.com/design/generating-world-maps-for-unexplored-2):
    80 Voronoi cells as a graph; regions as the design unit; difficulty from distance to start and goal; rivers and mountains
    split nodes and get bridge nodes; **the world is not continuous: nodes and connections say where you can go**; the pretty
    detail (about 1,200 fine cells) is laid on afterwards.
35. [Generating the maps of Trollskog](https://www.moddb.com/news/generating-the-maps-of-trollskog) (via search; the page
    was blocked): a map of chunks with towns and highlighted connections; a graph gives chokepoints and easy navigation.

## Building it with Claude

36. [Claude Code best practices](https://code.claude.com/docs/en/best-practices): tell Claude what it cannot see from the
    code (the deploy, the rules, the budget) in CLAUDE.md; give it a check to run (tests, a screenshot) before anything
    counts as done; enforce the rules that can have no exceptions.
37. [Building a multiplayer Risk game with Claude](https://medium.com/@roger.torres/building-a-multiplayer-risk-game-with-claude-what-worked-what-broke-and-why-4d86fd990b3b)
    (via search; the page was blocked): bots made the game feel multiplayer, so **every real multi-client bug waited until
    production**; real-time state sync was the hardest part and the least documented.
38. [How I built a multiplayer game from scratch with AI](https://devyogi.substack.com/p/how-i-built-a-multiplayer-game-from)
    and [I built a game with Claude Code](https://medium.com/@agbi.ikode/i-built-a-game-with-claude-code-6f533170eb1d) (via
    search): do not make Claude hold the whole game in one conversation; a cleanup that deletes code loses the context later
    refactors need; architecture is a different skill from writing code, and matters more when AI writes most of it.
39. [How to speedrun a multiplayer prototype with Claude Code](https://www.chatprd.ai/how-i-ai/workflows/how-to-speedrun-a-3d-multiplayer-game-prototype-in-15-minutes-with-claude-code-cli):
    get single-player controls right before networking; define the message types and a thin join, input, state, disconnect
    protocol before building more features.
40. [Multiplayer Agent: a game with Claude Code](https://multiplayeragent.com/guides/multiplayer-game-with-claude-code):
    review by asking whether the winner is decided on the server and whether the client can edit the score; test with two
    browsers, one of them private; a client that does not leave the room on unload leaves ghosts.

## What was decided from it (mine, 2026-10-31; Robin confirms or changes)

- **The rules as a pure, deterministic, tested function** that runs on the client for solo and on the server for co-op
  (1, 2, 3, 21, 36, 39). It is the cheapest way to "solo first with co-op in mind": the same code, a different holder.
- **Intents, action ids, server-rolled dice, deadlines, snapshot plus version** (2, 6, 9, 19, 22, 23): the `shared-world`
  skill.
- **A Node server on Robin's PC behind a Cloudflare Tunnel** (Robin, 2026-10-31: the PC may stay on, with the option of
  moving later; 14 says the tunnel carries WebSockets), built as one actor per region and per live fight: a single owner
  applying actions in order replaces locks (2, 12, 13). The actors take the shape of a Cloudflare Durable Object (10 to 13:
  hibernation makes idle rooms free, HTTPS comes with it, nothing has to stay on) and of a Colyseus room (7, 8), so either
  can take over later. Supabase stays a candidate for the database and auth, not for the rooms (16, 17). PartyKit is out (15).
- **Phaser 4 as the client** (31 to 33): the full framework saves writing scenes, input and audio; the frame rate is won in
  the assets, not the library.
- **Android first** (Robin, 2026-10-31) and the phone rules (24 to 30): the account is the save, reconnect on visibility,
  feature-detect the scanner with a typed code beside the QR, coarse cells and neighbour lookup for proximity. Chrome on
  Android has `BarcodeDetector`, the install prompt and no 7-day eviction; the iOS-only work (a WASM scanner, the eviction,
  the silent socket drops) waits in the skill for when iOS comes.
- **A graph world from a seed** (34, 35): spaces and paths, regions as the unit, difficulty by distance, detail last.
- **Two windows from the first shared feature, the protocol written first, small verified steps** (36 to 40).
