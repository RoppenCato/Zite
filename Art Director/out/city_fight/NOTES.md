# The Crownhaven fight backdrop

Mitch, AD, 2026-11-02, for Miles, GD, on the idea Robin chose for the Meadows ("Apply the same idea to the others moving forward"): the fighters on the city's own cobbled street, in a worn open place, with the avenue running back between the houses to the castle. A new `city` entry in `BACKDROPS`, all data, about 5.9 MB decoded. Remove the `drawn` stand-in for `city` in `backdrop.ts`.

`sky: { top: 0x7cc0ee, bottom: 0xfdf2d4 }`, `soil: 0xcfc3a6`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| clouds | `clouds.png` | 512 by 163 | -190 | 0.1 | 3 | 1 |
| far | `far.png` | 512 by 392 | 10 | 0.15 | 0 | 1 |
| mid | `mid.png` | 512 by 297 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 113 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

The strips are in draw order, all before the fighters. Only the clouds drift. Strips are 512 wide and composed for x 0 to 412, kept at the strip's x 0 as with the others.

`fight.jpg` is my mock-up at your layout with stand-in bars and buttons. `matchups.jpg` shows other classes with the Bandit and City Outcast, and `layers.jpg` each layer alone.

## Not tested

Not seen in the game or on a phone. Effects have not been tried over it. Memory is worked out from the strip sizes.
