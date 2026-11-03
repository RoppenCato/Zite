# The journal

Mitch, AD, 2026-11-02, for Miles, GD to build. `journal.jpg` shows three pages, and `journal_page.jpg` is one at 824 by 1830. Mock-ups, with a stand-in font; who has been met is a sample.

## Portraits: use this small atlas, not the creatures' first frames

**A creature's first frame is the right picture but the wrong file:** it would mean loading up to 18 atlases of 8 MB each to show one page. `journal_faces` holds all 18 in one 512 square, about 1 MB decoded, under 100 KB on disk.

- **Frame names are the rules' enemy ids:** `slime`, `wolf`, `bandit`, `wisp`, `wolf-alpha`, `thornwood-warden`, `spider`, `treant`, `outlaw`, `wraith`, `spider-queen`, `briar-king`, `ice-wolf`, `yeti`, `frost-wisp`, `ice-golem`, `yeti-elder`, `frost-matriarch`.
- **Size:** 88 px cells at 2x, so 44 in design px. Tall creatures are cut to head and shoulders. They come from the delivered stand frames, so they match.
- **Not met:** the same frame, tinted to `0x2a2640`, with a `?` over it. It costs no art, and guessing who it is from the shape is half the fun. Use `mark_unknown` for a grown creature with no frame yet.

## The page

Design px in the 412 column, sheet from y 108 to 732.

| What | Piece | x | y | w | h |
| --- | --- | --- | --- | --- | --- |
| Header, `Journal` 18 px, Back | `board_plain` | 18 | 116 | 376 | 40 |
| Region tabs, equal widths, one not open says `? ? ?` | `chip_*` | 18 | 160 | 376 | 34 |
| The page | `board_slip` | 18 | 198 | 376 | 524 |
| Region name 16 px at y 216, `3 of 6 met` right, at x 380 | | 32 | | | |
| Progress bar, gold `#f4c14a` on `#d9c8a6` | drawn | 32 | 228 | 348 | 8 |
| Creature rows, 62 apart | | | 242 | | |
| Places found: 13.5 px, count right, then a green bar `#58b84f`, 8 tall, at 18 below | | 32 | after the rows + 12 | 348 | |
| The prize line: `badge_plus`, then your words, 12.5 px | | 32 | 34 below that | | |

**A row:** a cubby, 52 square, centred on x 58, at the row's y + 28, with the portrait at 44 over it. `cubby_plain` once met, `cubby_empty` before. Name 14.5 px at x 94, centred on the row's y + 28 with no tag. `beaten 34` right, at x 380, in `#8a7458`, 12.5 px. A hairline `rgba(122,100,70,0.25)` under the row from x 94 to 380.

**A rare creature or a boss:** a backing `#f0e0b8` at x 26, 360 by 58, corner 8, and `cubby_legendary`. The name moves up to y + 19, with a pill under it at y + 31, 16 tall: `Rare` in `#8a5ad0`, `Boss` in `#a23c2c`, white 10 px.

## Not tested

Not in the game and not on a phone, and not with the game's own font. A grown region with more than six creatures needs the page to scroll or page, and I have not drawn that.
