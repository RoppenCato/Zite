# How each system stands

One file per system, created the day the system first exists (the skill `system-state` lists them: rules, client, server,
world, protocol, art, sound, pages). Read the file before changing its system; write what is true after.

| File | Since | Covers |
| --- | --- | --- |
| `rules.md` | 2026-10-31 | the pure rules: state, roll and move, the die, the data, the tests |
| `client.md` | 2026-10-31 | the Phaser client: the board scene, the save, the log, the PWA |
| `server.md` | 2026-10-31 | the Node server: the region actor, SQLite, the socket that only answers pings |
| `pages.md` | 2026-10-31 | what the browser pane can open and how to drive the game from it |

Not yet: `world.md` (the generator), `protocol.md` (written before the first client-server message), `art.md`,
`sound.md`.
