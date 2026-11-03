# The Wobblewood Forest fight backdrop

Mitch, AD, 2026-11-02, on the idea Robin chose for the Meadows ("Apply the same idea to the others moving forward"): the fighters on the region's own road, in a worn clearing, with the way running back to Tumbletree. It replaces the first pass, and the steps below are all data, in the `forest` entry of `BACKDROPS`. About 8.0 MB decoded, against about 6.2 before: the tall framing trunks cost it.

`sky: { top: 0x8ed2b4, bottom: 0xf0f6c8 }`, `soil: 0x6fb478`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| far | `far.png` | 512 by 400 | 10 | 0.15 | 0 | 1 |
| motes | `motes.png` | 512 by 272 | -20 | 0.3 | 3 | 1 |
| mid | `mid.png` | 512 by 244 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 410 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

The strips in the table are in draw order, all before the fighters. Keep `groundY` 490, `stripY` 640, `heroX` 66 and `enemyX` 318.

- **`feet: 46`**, up from 14: the ground now runs behind the fighters as well as in front.
- **Only the motes strip drifts.** `far` stays still.
- **Strips are 512 wide and composed for x 0 to 412.** Do not start one at a random offset, or the framing is lost.
- **Foreground accents are in `ground.png`**, below the fighters' feet. No new draw step.

`fight.jpg` is my mock-up at your layout, with stand-in bars and buttons, and `layers.jpg` shows each layer alone.

## Not tested

Not seen in the game or on a phone. The ability effects have not been checked over it, and a tall boss has not been tried against it. Memory is worked out from the file sizes.
