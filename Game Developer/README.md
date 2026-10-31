# The board world game: the game code

Robin's co-op board world game (working title to come). The design is `../board-world-game-brief.md`; how we work and the
technical direction are in `CLAUDE.md`; how each system stands is in `docs/state/`.

Three packages in one npm project:

- `rules/`: the game as a pure function, `apply(state, action, rng) → { state, events }`, numbers in `rules/data/*.json`
- `client/`: the Phaser 4 PWA for phones (TypeScript, Vite)
- `server/`: the Node server for Robin's PC (`ws`, SQLite), one region actor; not wired to the client yet

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

starts the WebSocket server on ws://localhost:8787 with its database in `server/data/world.db`. It answers
`{"type":"ping"}` and nothing else yet.

Also: `npm run typecheck` (TypeScript, strict, both configs), `npm run icons` (remakes the placeholder icons),
`npm run tunnel` (cloudflared, once installed and once the server has a protocol).

## Where things are

```
rules/src        types, rng, data, world, paths, gear, fight, common, hints, game, save, index
rules/data       world.json (areas, hubs, roads), dice, classes, abilities, spaces, enemies, gear, items, surprises, progression
rules/test       rng, game, fight, items, gear, board, world, purity; fixtures/ring (the first twelve-spot board)
client/src       main, layout, ui, local-game, game-log, scenes/CreateScene, play, BoardScene, HudScene, FightScene, ShopScene, BagScene
client/public    icon.svg, pwa-192x192.png, pwa-512x512.png
server/src       db, region-actor, index
server/test      region-actor
tools/           make-icons.mjs, drive-board.mjs (the headless check of the client at phone size), simulate.ts (the balance bots)
docs/state/      rules.md, world.md, client.md, server.md, pages.md
```
