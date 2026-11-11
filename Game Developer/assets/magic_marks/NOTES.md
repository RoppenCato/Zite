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
  - The stance badge sits in the same place, because a hero never has both.
- **The swap:** when the stance changes, swap the frame. A small pop would help: scale 1.3 back to 1 over about 120 ms.

Tool: `tools/kit/magic_marks.js`.
