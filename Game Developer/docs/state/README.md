# How each system stands

One file per system, created the day the system first exists (the skill `system-state` lists them: rules, client, server,
world, protocol, art, sound, pages). Read the file before changing its system; write what is true after.

| File | Since | Covers |
| --- | --- | --- |
| `rules.md` | 2026-10-31 | the pure rules: state (version 6), roll and move with closed areas, what each spot does, gear, the fight's rounds and abilities, the shop and the bag, the gamble, the tick, hints, the migrations, the tests |
| `client.md` | 2026-10-31 | the Phaser client: the character screen, the board (areas, covers, bosses, spawns, hints) and HUD scenes, the camera, the fight, shop and bag scenes, the save and the tick, the log, the PWA |
| `server.md` | 2026-10-31 | the Node server: the region actor, SQLite, the socket that only answers pings |
| `world.md` | 2026-10-31 | the world: areas by tier, hubs and roads, passages and bosses, the three hand-laid areas, the grown areas (themes, cells, shapes, creatures, passages), what is static and what is live |
| `pages.md` | 2026-10-31 | what the browser pane can open, how to drive the game from it, where every button sits, the headless driver |
| `art.md` | 2026-10-31 | no art yet; the budgets the Art Director builds to: 2x files, atlases, caps on disk and in memory |

Not yet: `protocol.md` (written before the first client-server message), `sound.md`.
