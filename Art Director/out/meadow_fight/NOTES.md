# The Cloverfield Meadows fight backdrop

Mitch, AD, 2026-11-02. Robin chose this one: "A, the road to the mill. Looks great!" It replaces the first pass, and the steps below are all data, in the `meadow` entry of `BACKDROPS`. About 5.5 MB decoded, against about 13 before.

`sky: { top: 0x55b2f2, bottom: 0xd4f0f6 }`, `soil: 0x86cf5c`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| clouds | `clouds.png` | 512 by 152 | -190 | 0.1 | 3 | 1 |
| far | `far.png` | 512 by 262 | 10 | 0.15 | 0 | 1 |
| mid | `mid.png` | 512 by 227 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 176 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

The strips in the table are in draw order, all before the fighters. Keep `groundY` 490, `stripY` 640, `heroX` 66 and `enemyX` 318.

- **`feet: 46`**, up from 14: the ground now runs behind the fighters as well as in front.
- **Only the clouds strip drifts.** `far` stays still.
- **Strips are 512 wide and composed for x 0 to 412.** Do not start one at a random offset, or the framing is lost.
- **Foreground accents are in `ground.png`**, below the fighters' feet. No new draw step.

`fight.jpg` is my mock-up at your layout, with stand-in bars and buttons, and `layers.jpg` shows each layer alone.

## Not tested

Not seen in the game or on a phone. The ability effects have not been checked over it, and a tall boss has not been tried against it. Memory is worked out from the file sizes.
