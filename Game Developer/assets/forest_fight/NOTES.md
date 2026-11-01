# The Wobblewood Forest fight backdrop

Mitch, AD, 2026-11-01. Designs mine, under Robin's permission of 2026-11-01. The same layers as the meadows, each tiling sideways. `fight.jpg` is my own composite at your layout, with the Knight at x 66 and a Grumpy Sprout at x 318, not a screenshot.

**One change for your `Backdrop` class: `far` and `mid` are 1x in the file**, because they are soft and sit behind the fighters. That cuts them to 3.1 MB decoded, where 2x would cost 12.6 MB. Your `setTileScale(0.5)` needs to become 1 for those two strips, so a per-strip scale.

| Strip | File | Design size | File px | Scale | Bottom | Scroll | Drift |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Far | `far.png` | 1024 by 300 | 1024 by 300 | tile scale 1 | 40 | 0.15 | 2 |
| Mid | `mid.png` | 1024 by 470 | 1024 by 470 | tile scale 1 | 24 | 0.45 | 0 |
| Near | `near.png` | 1024 by 140 | 2048 by 280 | tile scale 0.5 | 8 | 0.8 | 0 |
| Ground | `ground.png` | 512 by 120 | 1024 by 240 | tile scale 0.5 | 120 | 1 | 0 |

- **Sky, in code:** top `#8ed2b4`, bottom `#f0f6c8`.
- **Soil:** `#3a3a34`. Feet: 14.
- **The mid strip is taller than the meadows'** so its leaves hang from the very top of the band. Its top edge is above the HUD's bottom at your ground line of 540.

Decoded in all: about 3.1 MB for far and mid, 2.3 MB for near and 1 MB for ground, about 6.4 MB against the meadows' 11 MB or so.

## Not tested

Not seen in the game, and no phone check of the softness of the 1x strips.
