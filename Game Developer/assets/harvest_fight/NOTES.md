# The Honeyhill Fields fight backdrop

Mitch, AD, 2026-11-02, on the idea Robin chose for the Meadows ("Apply the same idea to the others moving forward"): the fighters on the region's own road, in a worn clearing, with the way running back to Goldencomb's great barn, the harvest rows and a far windmill behind, and the Queen's hive on the skyline. It is a new `harvest` entry in `BACKDROPS`, all data. About 5.3 MB decoded.

`sky: { top: 0x6fb8ec, bottom: 0xfbeec0 }`, `soil: 0xc8cc6a`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| clouds | `clouds.png` | 512 by 157 | -190 | 0.1 | 3 | 1 |
| far | `far.png` | 512 by 254 | 10 | 0.15 | 0 | 1 |
| mid | `mid.png` | 512 by 212 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 165 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

The strips in the table are in draw order, all before the fighters. Only the clouds drift. Strips are 512 wide and composed for x 0 to 412, kept at the strip's x 0 as with the other two.

`fight.jpg` is my mock-up at your layout, with stand-in bars and buttons, from before the name board. `matchups.jpg` shows other classes and creatures, and `layers.jpg` each layer alone.

## Not tested

Not seen in the game or on a phone. Effects have not been tried over it. Memory is worked out from the file sizes.
