# Honeyhill's creatures

Mitch, AD, 2026-11-02. Designs mine, under Robin's permission of 2026-11-01; Robin has not judged them. Built on the Knight's eye and three-quarter construction, with the human shapes on his skeleton. Files face left, pivot at the feet. Copy each folder.

## For `CREATURES`

| Enemy id | Name | Folder | Scale | Blow frame | Height (CSS px) | Frames |
| --- | --- | --- | --- | --- | --- | --- |
| `ice-wolf` | Honey Blob | `honey_blob` | 0.6154 | 7 | 130 | 33 |
| `yeti` | Corn Goblin | `corn_goblin` | 0.5 | 4 | 140 | 24 |
| `frost-wisp` | Buzzbug, `hovers: true` | `buzzbug` | 0.5 | 7 | 110 | 33 |
| `ice-golem` | Apple Mimic | `apple_mimic` | 0.5 | 7 | 120 | 33 |
| `yeti-elder` | Scarecrow Scrapper | `scarecrow` | 0.7273 | 4 | 220 | 24 |
| `frost-matriarch` | Queen Bumble, `hovers: true` | `queen_bumble` | 1.3333 | 5 | 400 | 20 |
| `frost-matriarch`, second phase | Queen Bumble, the swarm thickens | `queen_bumble2` | 1.3333 | 5 | 400 | 11 |

Every atlas is a palette PNG of at most 1024 by 2048, under 150 KB on disk.

## The clips

- **Honey Blob, Buzzbug, Apple Mimic:** stand 6, move 6, attack1 12, hit1 1, die1 8.
- **Corn Goblin, Scarecrow Scrapper:** the Knight's skeleton and clips without defend: stand 4, move 6, attack1 6, hit1 2, die1 6.
- **Queen Bumble:** stand 3, move 3, attack1 8, hit1 1, die1 5.
- **`queen_bumble2`:** holds only `stand` and `attack1` (3 and 8), for the second phase, as with `goo2`. Her eyes go red and little bees fly round her, drawn into the frames. Keep `move`, `hit1` and `die1` from `queen_bumble`.

## Where they stand

Queen Bumble is set forward of her pivot. At `enemyX` 318 she spans about x 130 to 430 at rest, so her wing tip passes the 412 column's edge on a narrow screen. Her sting swings forward and down on the blow, and it reaches the ground.

## What is drawn into the blow

Nothing is drawn for Glue Down, Cob Toss, Frantic Drone, Shut Tight, Crow Call, Straw Choke, Swarm or Royal Jelly: those wait for the fight effects. The Apple Mimic's mouth opens on its blow, which also serves Core Crunch.

## Not tested

Not seen in the game. Queen Bumble at 0.75x may look softer than the 2x figures on a sharp phone. Your `Figure` decides how the hover sits.
