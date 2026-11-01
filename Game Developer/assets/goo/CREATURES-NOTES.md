# The rest of the meadows' creatures

Mitch, AD, 2026-11-01. Five creatures and King Goo's second phase, all in the slime's form, facing left, the pivot at the feet. Copy
each folder to `assets/<folder>/`. `fights.jpg` shows each one standing against the Knight at your layout, `preview.jpg` their poses at
real size. Their designs are mine, under Robin's permission of 2026-11-01 for us to decide for now; Robin has not seen them yet.

## For `CREATURES`

**The scale is not 0.5 on every creature.** Take it from this table, because the two largest are drawn at fewer pixels to stay in the budget.

| Enemy id | Name | Folder | Scale | Blow frame | Height (CSS px) | Frames |
| --- | --- | --- | --- | --- | --- | --- |
| `wolf` | Grumpy Sprout | `sprout` | 0.5 | 7 | 130 | 33 |
| `bandit` | Meadow Bandit | `bandit` | 0.5 | 7 | 110 | 33 |
| `wisp` | Bumbling Bee | `bee` | 0.5 | 7 | 120, and hovers about 55 above its ground point | 33 |
| `wolf-alpha` | Mushroom Muncher | `muncher` | 0.8 | 5 | 190 | 23 |
| `thornwood-warden` | King Goo | `goo` | 1 | 5 | 300 | 23 |
| `thornwood-warden`, under half HP | King Goo, second phase | `goo2` | 1 | 5 | 300 and swollen a little | 12 |

Every atlas is a palette PNG of 1024 by 2048, so 8 MB decoded, and under 140 KB on disk. Frame names are `<folder>/<action>/<nnnn>`, as on the slime.

## The clips

- **Sprout, Bandit, Bee:** stand 6, move 6, attack1 12, hit1 1, die1 8, as on the slime.
- **Muncher and King Goo:** stand 4, move 4, attack1 8, hit1 1, die1 6. They are heavy and slow, and this is what keeps them in one atlas each.
- **`goo2`** holds only `stand` and `attack1`. For the second phase, draw those from `goo2` and keep `move`, `hit1` and `die1` from `goo`. The crown has slipped and he is angry, so the change shows even without a tint.
- **The Muncher's Spore Puff and Toxic Nibble, the Bandit's Dirty Trick and the Bee's Pollen Daze** use the same `attack1`. No puff, cloud or sparkle is drawn: tell me if you want those as effects.

## Where they stand, and three things only you can decide

- **King Goo's body is set forward of his pivot.** At `enemyX` 300 he spans about 165 to 408, so he clears the Knight's shield and stays on the screen. He is 300 tall, the low end of the 300 to 400 you listed, because any taller would be wider than the room between the Knight and the screen's edge.
- **The shadow's width.** You draw it 96 wide at `enemyX`. It wants about 180 at x 293 for the Muncher and about 244 at x 286 for King Goo.
- **The head-top for the bars.** The `head` in each frame is the painted top. On the Bee that includes the wings, so its bar sits above its hover.

## Not tested

Not yet seen in the game; `fights.jpg` is my own composite of your layout, with the backdrop's layers and the Knight in Copper. Hit boxes are the painted bounds. King Goo at 1x and the Muncher at 1.25x will look a little softer than the 2x figures on a sharp phone: at phone size on my pictures it did not show, but judge it there. Memory has not been measured on a phone.
