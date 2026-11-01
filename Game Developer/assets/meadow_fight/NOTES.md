# The Cloverfield Meadows fight backdrop

Mitch, AD, 2026-11-01. Layers, never one picture; design pixels, the files at 2x; every strip tiles sideways without a
seam (checked 3 by 3). `fight.jpg` is the layout as I composed it at 412 by 915 with the Knight at 150 and the slime at
120, for reference: the real layout is yours.

| Layer | File | Size (design px) | Scroll factor | Where it sits |
| --- | --- | --- | --- | --- |
| The sky | code | the band | 0 | a vertical gradient from `#5fb0ec` at the top to `#cdebfb` at the ground line |
| The far hills | `far.png` | 1024 by 300 | 0.15 | its bottom about 40 px below the ground line, behind the tree line; clouds in its upper part; a far windmill and village as silhouettes; full-colour PNG (it carries a haze gradient) |
| The tree line | `mid.png` | 1024 by 300 | 0.45 | its bottom 24 px below the ground line, so its grass meets the near strip; hazed toward the sky |
| The hedge and grass | `near.png` | 1024 by 140 | 0.8 | its bottom 8 px below the ground line, behind the fighters' feet |
| The ground band | `ground.png` | 512 by 120 | 1 | its top AT the ground line; the fighters' feet stand **14 px below the strip's top** (on the grass lip); below the strip, fill with the soil colour `#5c4a30` |

Draw order: sky, far, mid, near, the fighters and their contact shadows, ground is drawn before the fighters (they stand on
it). The fighters' band (the 160 px above the ground line) is kept quiet: the hedge and tufts are low and the trees' detail
sits above the slime's head. On disk: far 48 KB, mid 33, near 14, ground 20.

What I did not do: a cloud layer of its own that drifts (the clouds are in the far strip at 0.15, which reads as drift
enough when the camera shakes), and the time of day (one noon palette for now).
