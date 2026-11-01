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

9. **The world's form**: decided (Robin, 2026-10-31): (c) the board seen from a raised camera in 2D, and fights on their
   own 2D screen as an instance of where you stand. In the brief and `Art Director/docs/direction.md`.

## Open after the decisions of 2026-10-31 (`docs/decisions-2026-10-31.md`)

10. ~~Quest givers~~: built as the towns' errands (2026-11-01, `docs/state/rules.md`); a quest giver as a spot of its
    own is still open.
11. ~~A bag limit~~: twelve, with sell or leave (2026-11-01).
12. ~~Mana potions~~: built (2026-11-01); a mana spot of its own is still open (the spring gives both flasks).
13. ~~Trainers in towns~~: built (2026-11-01), in the town's shop under Train.
14. **Shared bosses**: a boss's 5-minute return is per character now (mine, for solo play); with the server, is a boss one
    creature for everyone or one per player?
15. ~~The fourth area and the generator~~: built (2026-10-31, `docs/state/world.md`); the fourth area is the first
    grown one, fire. Two more shapes and the themes' events came 2026-11-01; more shapes are always welcome.
16. **The far tiers' curve** (mine, 2026-10-31): the grown creatures grow ×1.25 HP a tier and gear ×1.35 a rank past the
    tables, so the bots' walls, flat at about nine wins in ten from tier 4 to 9, ease towards ten in ten past tier 10.
    Either gear slows (×1.3) or the creatures' growth climbs after tier 9; to be felt first, there is a long way to tier
    10.

## Ideas noted in the brief, not decided

- Guilds: a shared home town that members upgrade together.
- Town liberation and occupied towns: out (Robin, 2026-10-31: no Dokapon-style liberation).
- A "camp" bonus aura, IRL-only trading and friendly duels for linked players.
- Real places (OpenStreetMap) as shrines giving dice cards when visited.

## Ideas from the research (mine, 2026-10-31)

- A six-letter link code typed by hand, beside the QR, for phones with no camera permission.
- A "fewer effects" switch in the settings for weak phones.
- A downloadable frame log and error log in the game (the Survival game's Admin pattern), since a phone has no console.
- Push as a nudge only ("the boss window closes in two hours"), never as the only way to learn something.
