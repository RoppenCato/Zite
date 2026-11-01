# Wobblewood's creatures

Mitch, AD, 2026-11-01. Designs mine, under Robin's permission of 2026-11-01; Robin has not judged them. Built on the Knight's eye and three-quarter construction from the start (Robin's correction, 2026-11-01). Files face left, pivot at the feet. Copy each folder. `fights.jpg` shows each one standing against the Knight at your layout (ground line 490, Knight at x 66, enemy at x 318), on the forest backdrop; it is my composite, not a screenshot. `preview.jpg` shows their poses at real size.

## For `CREATURES`

| Enemy id | Name | Folder | Scale | Blow frame | Height (CSS px) | Frames |
| --- | --- | --- | --- | --- | --- | --- |
| `spider` | Twigling | `twigling` | 0.5 | 7 | 120 | 33 |
| `treant` | Moss Goblin | `moss_goblin` | 0.5 | 4 | 130 | 24 |
| `outlaw` | Sporeling | `sporeling` | 0.5 | 7 | 100 | 33 |
| `wraith` | Nutkin Thief | `nutkin` | 0.5 | 7 | 110 | 33 |
| `spider-queen` | Sleepy Owlbear Cub | `owlbear` | 0.7273 | 5 | 200 | 23 |
| `briar-king` | Grumblebark | `grumblebark` | 1.1429 | 5 | 350 | 18 |
| `briar-king`, under half HP | Grumblebark, fully awake | `grumblebark2` | 1.1429 | 5 | 350 | 10 |

Every atlas is a palette PNG of at most 1024 by 2048, so at most 8 MB decoded, and under 130 KB on disk.

## The clips

- **Twigling, Sporeling, Nutkin Thief:** stand 6, move 6, attack1 12, hit1 1, die1 8.
- **Moss Goblin:** the Knight's skeleton and clips without defend: stand 4, move 6, attack1 6, hit1 2, die1 6.
- **Sleepy Owlbear Cub:** stand 4, move 4, attack1 8, hit1 1, die1 6.
- **Grumblebark:** stand 3, move 3, attack1 7, hit1 1, die1 4. He is slow, and this is what keeps him in one atlas. He does not fall flat: he sags and leans as he fades.
- **`grumblebark2`:** holds only `stand` and `attack1` (3 and 7), for under half HP, as with `goo2`. His eyes burn orange, his bark reddens and his crown thrashes. Keep `move`, `hit1` and `die1` from `grumblebark`. The forest shaking is yours, in the camera.

## Where they stand

Grumblebark's body is set forward of his pivot. At `enemyX` 318 he spans about x 140 to 410 at rest, and his arm reaches further on the blow.

## What is drawn into the blow

The Sporeling's blow carries its spore cloud in the frames. The Owlbear's mouth opens on its blow, which also serves Yawning Roar. No effect is drawn for Splinter, Moss Patch, Scamper, Nut Snatch, Root Grip or Regrow: those wait for the fight effects strip.

## Not tested

Not seen in the game. Grumblebark at 0.875x and the Owlbear at 1.375x may look softer than the 2x figures on a sharp phone. Memory has not been measured on a phone.
