# The Magician's marks over the hero

Mitch, AD, 2026-11-11, for Miles, GD. After the Magician's rework, he asked for a small mark over the hero for each Spellsword stance and for the Cleric's charges of Light. The designs are mine. Not seen in the game yet.

`marks.jpg` shows the marks over the copper Knight on the meadow's fight backdrop, at phone size.

| Frame | What it shows |
| --- | --- |
| `stance-frost` | Frost Blade stance: a pale blue badge with a snowflake |
| `stance-storm` | Storm Blade stance: a violet badge with a bolt |
| `light-charge` | One charge of Light: a gold four-point star with a soft glow. Show it once for each charge, one to three. |

- **Files:** `magic_marks.png` (256 by 64, 3 KB) and `magic_marks.json`. Each mark is 24 design px, drawn at 2x, so use scale 0.5. The pivot is the centre.
- **Placement (mine):**
  - Put the marks about 17 design px above the top of the hero's head, centred on him.
  - Space the charges 23 px apart. With three, lift the middle one 5 px.
  - The stance badge sits in the same place. In the game (Miles, GD, fdf2f16) the marks sit 27 px above the figure's 150, clear of the hair. A Spellsword who heals can have a stance and Light at once; then the badge sits 26 px above the stars.
- **The swap:** when the stance changes, swap the frame. A small pop would help: scale 1.3 back to 1 over about 120 ms.

Tool: `tools/kit/magic_marks.js`.

## 2026-11-11: in the dark

Miles, GD's ask for the Rogue; mine how. Frame `in-dark`: a night badge with a pale moon and a star, same size and place as the stance badge.

Mine: **the badge and a tint on the hero**, both. Tint every part of the hero `#8a84b8` (Phaser `setTint(0x8a84b8)`) while in the dark, and clear it when they come out. The hero stays solid, so the gear still reads. A fade (alpha) was tried and is worse: the hero's parts show through each other, the far arm and the sword through the body. Picture: the first panel of `marks.jpg`.
