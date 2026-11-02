# The meadows' creatures, rebuilt on the Knight's construction

Mitch, AD, 2026-11-01. Robin, on seeing King Goo: "Seems AD is doing same mistake with eyes and proportions on the enemy models as he did with the hero." He was right, on all of them, the Jelly Slime too. `before_after.jpg` shows each one. Same folder names, the pivot still at the feet, so they drop in; **the table below has changed, so take the scale, blow frame and frames from it.**

## What was wrong and what changed

- **The eyes were the hero's first mistake:** large separate upright ovals stuck on, and the eye nearer the front was the bigger one, which is backwards. All now use the Knight's eye (`tools/monsters/face.js`): the near eye wide, the far eye narrow against the edge, an iris and a small pupil looking forward, an upper lid, a brow, with the face's centre line turned off-centre and the mouth on it.
- **Meadow Bandit:** a separate doll with a head half his height. He is now the Knight's own skeleton and clips, in a hood, a mask, a tunic, a sack and a knife. So he has 24 frames and his blow is on frame 4.
- **Mushroom Muncher:** its eyes were on the cap and its mouth on the stem. The stem is now its body and carries the whole face under the brim, with stub arms.
- **Bumbling Bee:** one ball with a face. It is now a head, a fuzzy thorax, a striped abdomen and legs. It stings by curling the abdomen under, and its head stays up.
- **Grumpy Sprout:** a potato. It is now a turnip, broad at the shoulders and narrowing down, on root legs with root arms.
- **King Goo and the Jelly Slime:** the shade is now along the back and foot, not a stain on the belly, and the brown cheek is gone. King Goo's features are small and high, which is what makes him look huge; the Slime's are larger, which keeps it small and friendly.

## For `CREATURES`

| Enemy id | Name | Folder | Scale | Blow frame | Height (CSS px) | Frames |
| --- | --- | --- | --- | --- | --- | --- |
| `slime` | Jelly Slime | `out/slime` | 0.5 | 7 | 120 | 33 |
| `wolf` | Grumpy Sprout | `sprout` | 0.5 | 7 | 130 | 33 |
| `bandit` | Meadow Bandit | `bandit` | 0.5 | 4 | 110 | 24 |
| `wisp` | Bumbling Bee | `bee` | 0.5333 | 7 | 120 | 33 |
| `wolf-alpha` | Mushroom Muncher | `muncher` | 0.7273 | 5 | 190 | 23 |
| `thornwood-warden` | King Goo | `goo` | 1 | 5 | 300 | 23 |
| `thornwood-warden`, under half HP | King Goo, second phase | `goo2` | 1 | 5 | 300 | 12 |

The Bee hovers about 55 CSS px above its ground point. Every atlas is a palette PNG at most 1024 by 2048, so at most 8 MB decoded.

## The clips

- **Sprout, Bee, Slime:** stand 6, move 6, attack1 12, hit1 1, die1 8.
- **Bandit:** the Knight's clips without defend: stand 4, move 6, attack1 6, hit1 2, die1 6.
- **Muncher and King Goo:** stand 4, move 4, attack1 8, hit1 1, die1 6.
- **`goo2`** holds only `stand` and `attack1`. Keep `move`, `hit1` and `die1` from `goo`.

## Not tested

Judged on my own composite of your layout (`fights.jpg`) and the poses at real size (`preview.jpg`), not yet in the game. No effects are drawn for the status moves. Memory has not been measured on a phone.
