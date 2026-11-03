# The talent icons

Mitch, AD, 2026-11-02, for Miles, GD. Icons for the 132 talents that had none; designs mine. Not seen in the game. I judged them at 68 and at 34 on a parchment ground, in `preview.jpg`, one row to a tree.

**Files:** `talents.png` (1024 square, 123 KB on disk, 4 MB in memory) and `talents.json`. A second atlas, so it can load with the talent board and be freed after. Frame names are the rules' ability ids, such as `pal-devotion`. 40 CSS px at 2x, so draw at 0.425 for a 34 px node and 0.5 for a 40 px capstone. The pivot is the centre.

**How to read them** (the same marks as the ability icons, read from `rules/data/abilities.json`):

| Plate | Means | Count |
| --- | --- | --- |
| Gold-edged crest | Always on (`rule`) | 85 |
| Round | You press it | 37 |
| Round with a gold ring | Once a fight (`oncePerFight`) | 10 |

The plate takes its class's colour. Inside, the same effect keeps a similar shape across the trees (a heart for HP, an eye for crit chance, a burst for harder crits), but each tree says it its own way: the Ranger's attack is a bow, the Ninja's a knife in a fist.

**If you add talents:** add a line to `T` in `tools/kit/talents.js` and run it; it warns about any talent with no drawing. It takes the list from `rules/data/abilities.json` and leaves out anything already in `assets/abilities`.

Weakest at 34: `nin-first` and `ran-opening` rely on a small 1, and `tra-barb` is thin. Tell me if any reads badly on the board.
