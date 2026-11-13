# The board world game: the game code

Robin's co-op board world game (working title to come). The design is `../board-world-game-brief.md`; how we work and the
technical direction are in `CLAUDE.md`; how each system stands is in `docs/state/`.

Three packages in one npm project:

- `rules/`: the game as a pure function, `apply(state, action, rng) → { state, events }`, numbers in `rules/data/*.json`
- `client/`: the Phaser 4 PWA for phones (TypeScript, Vite)
- `server/`: the Node server for Robin's PC (`ws`, SQLite): one region actor, the accounts, the hub speaking `docs/state/protocol.md`
- `server-workers/`: the same world on Cloudflare Workers with Durable Objects, always on, no PC: the same actor, accounts
  and hub over the object's SQLite, the same protocol

## Run it

Needs Node 22.12 or newer (built with 24). `better-sqlite3` builds a native module on install; `package.json` already
allows its install script.

```bash
npm install
```

```bash
npm test
```

runs every test (the rules and the server) headless in Node.

```bash
npm run dev
```

serves the game at http://localhost:5173/ (and on the LAN at the address Vite prints, for a phone on the same Wi-Fi). Open
it at phone size: in the Claude desktop app, the browser pane with its mobile preset, through `.claude/launch.json`
(entry `game`) when the session's folder is this one. The first time, the character screen asks for a name and a class.
Tap **Roll**: the die rolls; with more than one place to go the
camera frames the lit spaces and you tap one; the character walks and the camera follows. A battle space opens the fight
screen: Attack, your class's move, Defend, Flee or a Potion, one round a tap. A shop sells potions and dice cards; a dice
card held shows as a chip under the board while a roll is pending. Drag to look around, pinch to zoom; **Map** shows the
whole island and **Back** returns to the character. **Log** downloads the frame log and error log as a text file.

```bash
npm run build && npm run preview
```

builds the PWA into `dist/` (manifest, icons, service worker) and serves it at http://localhost:4173/. This is the build
that Chrome on Android installs; it needs HTTPS or localhost.

```bash
npm run server
```

starts the world's server on ws://localhost:8787 with its database in `server/data/world.db`. Open the client once as
`http://localhost:4173/?server=ws://localhost:8787` (or the dev address) and the character screen says "the world at …":
Begin makes your account on the server, the address is remembered, and every later open connects on its own. A second
window (a private one, so it has storage of its own) with the same address is a second player: both stand on the board.
Settings (World → Settings) show the account's code; typed on another phone's character screen it brings the same
character there. `?server=off` goes back to solo play. For phones: `npm run tunnel` in front of the server and the
`wss://….trycloudflare.com` address it prints as the `?server=` (`docs/state/server.md`, "Running it for friends").

```bash
node tools/drive-coop.mjs
```

plays two headless phones against a server of its own (needs the built client at http://localhost:4173/).

```bash
npm run world:dev
```

runs the world on Cloudflare locally (`wrangler dev`, ws://localhost:8787, the Node server's port: run one or the other).
The same client addresses work against it; a second window on `http://127.0.0.1:5173/?server=ws://localhost:8787` is a
second account, since it is another origin. `npm run world:deploy` puts it on Robin's Cloudflare account (after `npx
wrangler login`); `npm run world:import -- --to <worker url> --secret <IMPORT_SECRET>` carries `server/data/world.db`
across once; the phones then open `https://zite-game.pages.dev/?server=wss://<worker>.workers.dev`. The steps, the
secret and the free plan's limits are in `docs/state/server.md`, "The world on Cloudflare".

Also: `npm run typecheck` (TypeScript, strict, all three configs), `npm run icons` (remakes the placeholder icons),
`npm run tunnel` (cloudflared, once installed), `npm run world:tail` (the worker's log).

## Where things are

```
rules/src        types, rng, data, world, generate, paths, gear, fight, quests, common, hints, game, save, delta, protocol, index
rules/data       world.json (areas, hubs, roads), themes, shapes, dice, classes, abilities, spaces, enemies, gear, uniques, items, quests, surprises, events, progression
rules/test       rng, game, fight, kits, enemies, uniques, quests, vaults, items, gear, board, world, generate, shared, purity; fixtures/ring, grown
client/src       main, layout, ui, game-holder, local-game, remote-game, game-log, tips, settings, scenes/CreateScene, ConnectScene, play, BoardScene, HudScene, FightScene, ShopScene, BagScene, AtlasScene
client/public    icon.svg, pwa-192x192.png, pwa-512x512.png
server/src       db, region-actor, accounts, hub, index
server/test      region-actor, hub
server-workers/  wrangler.jsonc; src: sql, region-actor, accounts, hub, index (the worker and its two objects); test: memory-sql, region-actor, accounts, hub
tools/           make-icons.mjs, drive-board.mjs (the headless check of the client at phone size), drive-coop.mjs (two phones and a server), import-world.mjs (the Node database into the worker), simulate.ts (the balance bots)
docs/state/      rules.md, world.md, client.md, server.md, protocol.md, pages.md, art.md
```
