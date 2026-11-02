# The veils past the Meadows

Mitch, AD, 2026-11-02, for Miles, GD. Robin wants the lands past the Meadows dark until King Goo falls. Not seen in the game. `preview.jpg` is my mock-up of all three over the middle overview.

**Use all three, and drop the old veils.** The moved `fog_forest` and `fog_harvest` do not fit: the Wobblewood's old west coast ran through the Kingswood and darkened a wedge of it, and a wall of cloud ran along the old seam. These three share their edges, so nothing doubles and no ground shows between them.

| File | Covers | Its world box |
| --- | --- | --- |
| `fog_kingswood.png`, `.json` | The Kingswood and Crownhaven, and the ground up to the mountains' foot | x 4560, y 5120, 4440 by 3560 |
| `fog_wobblewood.png`, `.json` | The Wobblewood | x 8000, y 5100, 5300 by 5400 |
| `fog_honeyhill.png`, `.json` | Honeyhill, including its mountains | x 6200, y 1900, 6400 by 3900 |

Same form as `fog_swamp`. The Kingswood's veil stops on the neck at y 8335, in a straight edge, where the Meadows begin. The gap in the mountains belongs to the Kingswood's veil below the seam and Honeyhill's above it, so each land can be lifted alone.

Tool: `tools/world/kingswood_veil.js`.
