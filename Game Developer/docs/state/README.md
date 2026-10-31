# How each system stands

One file per system, created the day the system first exists (the skill `system-state` lists them: rules, client, server,
world, protocol, art, sound, pages). Read the file before changing its system; write what is true after.

| File | Since | Covers |
| --- | --- | --- |
| `rules.md` | 2026-10-31 | the pure rules: state (version 4), roll and move, the island and `buildBoard`, what landing does, the fight, the shop and items, the migrations, the tests |
| `client.md` | 2026-10-31 | the Phaser client: the character screen, the board and HUD scenes, the camera and its gestures, the fight and shop scenes, the save, the log, the PWA |
| `server.md` | 2026-10-31 | the Node server: the region actor, SQLite, the socket that only answers pings |
| `pages.md` | 2026-10-31 | what the browser pane can open, how to drive the game from it, where every button sits, the headless driver |

Not yet: `world.md` (the generator), `protocol.md` (written before the first client-server message), `art.md`,
`sound.md`.
