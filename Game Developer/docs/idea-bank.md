# Idea bank: undecided ideas and open questions

Nothing here is decided. A thing Robin decides moves to the brief (`C:\dev\Zite\board-world-game-brief.md`) with his name and
the date, and comes off this list.

## Open questions (from the brief, 2026-10-31)

1. **Loot:** Dokapon-like (few clear items) or Diablo-like (random stats, rarity colours)?
2. **Boss battles when not physically together:** live (everyone online at once) or async (turns within a time window)?
   The research says the server can do both with the same rules: a live fight is a room with short deadlines; an async one is
   the same room with deadlines of hours (`docs/coop-research.md`, Nakama's "passive turn-based").
3. **Long-term goal:** max level, a story to finish, or seasons where the world resets?
4. **Board size and sharding:** one global board, or regional shards so it does not feel empty? (Technically: one actor per
   region either way; a shard is a second copy of a region's live state.)
5. **Each class's own skills and spells** (Robin, 2026-10-31: the class is chosen at character creation and the classes must feel different to play): which moves each class has, how they fit the fight's turn, and what "defend" is for each.
6. **Working title.**
7. **The names of the three sessions** (Miles, GD; Perry, AD; Nigel, SD are mine, 2026-10-31).
8. **The technical direction** in `CLAUDE.md` (Phaser 4, the pure rules package, a Node server on Robin's PC behind a
   Cloudflare Tunnel): mine, for Robin to confirm or change. Decided by Robin on 2026-10-31: the PC may stay on, with the
   option of moving the server later; Android first, iOS later.

9. **The world's form** (Perry, AD, 2026-10-31, after Robin's art decision): (a) the world itself a side-view
   MapleStory-like place generated from kits, the board's spaces along its ground, the camera following the token, fights
   where the token stands, an overview map screen for the big picture; or (b) a top-down painted world map of spaces and
   paths with side-view fight scenes. Perry, AD recommends (a). Robin decides.

## Ideas noted in the brief, not decided

- Guilds: a shared home town that members upgrade together.
- A "camp" bonus aura, IRL-only trading and friendly duels for linked players.
- Real places (OpenStreetMap) as shrines giving dice cards when visited.

## Ideas from the research (mine, 2026-10-31)

- A six-letter link code typed by hand, beside the QR, for phones with no camera permission.
- A "fewer effects" switch in the settings for weak phones.
- A downloadable frame log and error log in the game (the Survival game's Admin pattern), since a phone has no console.
- Push as a nudge only ("the boss window closes in two hours"), never as the only way to learn something.
