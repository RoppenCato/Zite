---
name: system-state
description: Before changing any system of the game (the rules, the client, the server, the world generator, the protocol, art, sound, a page or test scene), read how it stands now in docs/state/<system>.md, and after the change update that file (what is true now, Robin's decisions marked as his). Use whenever a game system is worked on.
---

# How each system stands

`CLAUDE.md` keeps the direction, Robin's decisions and the rules for working. How each system is built now lives in
`docs/state/`, one file per system, so no session has to read everything to change one thing (the Survival game's CLAUDE.md
reached 253k characters before it was split; this project starts split):

| File | What it covers |
| --- | --- |
| `docs/state/rules.md` | `rules/`: the state shape, the actions, the dice and dice cards, the spaces, the fights and classes, items, death, progression gates; its tests |
| `docs/state/client.md` | the Phaser client: scenes, the map view, the fight screen, boards, input, the frame log and error log, the PWA |
| `docs/state/server.md` | the Node server on Robin's PC: each actor (region, fight room, presence), SQLite, accounts, the save, the tunnel |
| `docs/state/world.md` | the world generator: seeds, chunks, regions, spaces and paths, difficulty, what is static and what is live |
| `docs/state/protocol.md` | every message between client and server: name, fields, who sends it, when; the snapshot and its version |
| `docs/state/art.md` | what art is in the game, where it lives, how it is drawn, the budgets |
| `docs/state/sound.md` | what music and sounds are in the game, where they live, when they play |
| `docs/state/pages.md` | every page, test scene and tool the browser pane can open |

1. Read the file for the system before changing it (search it for the function or name first), and `CLAUDE.md` for what
   else the change touches (the protocol, the save's version, the shared-world rules).
2. After the change, write what is now true there, in the same voice: what it does, its numbers, whose decision (Robin's,
   or "mine"). Remove what describes something gone; no dated paragraphs appended.
3. A change to how systems connect goes in the map in `CLAUDE.md`. A change to the direction, Robin's decisions or the
   rules for working still goes in `CLAUDE.md`.
4. A file that does not exist yet is created the day its system first exists.
