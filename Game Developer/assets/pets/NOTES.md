# The Hunter's pets and the trap

Mitch, AD, 2026-11-12, for Miles, GD, after Robin's Hunter rebuild (his design, his "Yes" to the talent list). The designs and the places are mine. Not seen in the game yet, and Robin hasn't judged them.

**Pictures:**
- `preview.jpg`: the fight at phone size on the meadow road, the Knight standing in for the Hunter at heroX 66, a boar at 318.
- `frames.jpg`: every frame of every clip.
- The moving page: https://claude.ai/artifact/NHnKLAVJKvCnnEfZCYWeZF

## The pets

| Atlas | What it is | Size in the fight |
| --- | --- | --- |
| `wolf/` | A grey wolf, pale chest and muzzle, ears up, a bushy tail | 67 design px tall, 96 long with the tail |
| `bear/` | A brown bear, round and heavy, a tan muzzle | 67 tall, 89 long |
| `viper/` | A green viper with dark diamonds, coiled, the neck an S | 61 tall, 72 wide |

- **Built like the owl.** Each atlas has the owl's two clips at the owl's own delays, so `Owl`'s timing serves them all:
  - `stand`: 4 frames, loops.
  - `attack1`: 6 frames at 80, 90, 50, 120, 70, 80 ms. The blow lands on frame 4, as with the owl.
- **The strikes:**
  - The wolf crouches, leaps and bites.
  - The bear rears with a swipe of its paw, then bites.
  - The viper draws back and strikes.
- **Facing and flipping:** they face left in the file and are flipped, like every figure (`setFlipX(true)`). Files are at 2x (`filePx` 2). The origin is the feet.
- **Faces:** on the Knight's eye construction (`tools/monsters/face.js`). Calm while standing, angry in the strike.

## Where they stand (mine)

The owl keeps its place in the air (heroX + 84, 70 up). Ground pets take two places on the ground, in the order they were called:

| Place | x | y | Drawn |
| --- | --- | --- | --- |
| First ground pet | heroX + 56 | feet + 6 | in front of the hero |
| Second ground pet | heroX + 104 | feet - 2 | behind the first, in front of the hero |

So the owl with any one ground pet uses the air and the first place. Two ground pets use both places.

**The strike:** the owl's dash suits them too. Tween x to about enemyX - 62 with Quad.easeIn over the first three frames, hold 60, then yoyo back. The second pet can follow 90 ms after the first, so two pets don't move as one.

## The trap

`trap/`: an iron jaw trap half hidden in grass. One picture serves all five traps.
- `wait`: 4 frames at 200 ms, loops; a glint on the third.
- `spring`: 5 frames at 50, 60, 120, 90, 120 ms. The jaws snap up and shut in an orange burst, then it is gone.
- **Place (mine):** on the ground in front of the foe, at about enemyX - 70 and feet + 8. It is 60 design px wide, 22 tall.
- **Two traps (Second Trap):** put the second 22 px nearer the hero.

Tool: `tools/monsters/pets.js`.
