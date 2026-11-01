# How each system stands

One file per system, created the day the system first exists (the skill `system-state` lists them: rules, client, server,
world, protocol, art, sound, pages). Read the file before changing its system; write what is true after.

| File | Since | Covers |
| --- | --- | --- |
| `rules.md` | 2026-10-31 | the pure rules: state (version 9), joining, roll and move with closed areas, what each spot does, gear, the fight's rounds and abilities, the shop and the bag, the gamble, the tick, hints, the delta, the migrations, the tests |
| `client.md` | 2026-10-31 | the Phaser client: the two holders (solo and the server), the character and connect screens, the board (areas, covers, bosses, spawns, other players, hints, culling) and HUD scenes, the camera, the fight, shop, bag and atlas scenes, the tips and the settings, the save and the account, the log, the PWA |
| `server.md` | 2026-10-31 | the Node server: the region actor, the accounts, the hub, SQLite (schema 2), running it for friends |
| `protocol.md` | 2026-11-01 | every message between the client and the server: join, intent, snapshot, result, event, leave; the delta; reconnecting; the limits |
| `world.md` | 2026-10-31 | the world: areas by tier, hubs and roads, passages and bosses, the three hand-laid areas, the grown areas (themes, cells, shapes, creatures, passages), what is static and what is live |
| `pages.md` | 2026-10-31 | what the browser pane can open, how to drive the game from it, where every button sits, the headless driver |
| `art.md` | 2026-10-31 | no art yet; the budgets the Art Director builds to: 2x files, atlases, caps on disk and in memory |

Not yet: `sound.md`.
