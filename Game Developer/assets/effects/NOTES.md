# The fight effects and the Archer's owl

Mitch, AD, 2026-11-02. Designs mine, under Robin's permission of 2026-11-01. Inked and flat, the pivot at each effect's centre. `preview.jpg` shows each clip at real size on a dark and a light ground.

## The files

| Atlas | Folder | Holds | File scale, for `setScale` |
| --- | --- | --- | --- |
| `effects` | this folder | everything below except the bubble | 0.5 |
| `bubble` | `bubble/` | `bubble_shield`, `bubble_pop`, the only large ones | 1 |
| `owl` | `owl/` | `stand`, `attack1` | 0.5, flip it like the hero |

Frame names are `<atlas>/<clip>/<nnnn>`, with an `actions` block like a creature's: delays and a `loop` flag per clip.

## The clips

| Clip | Use | Loops |
| --- | --- | --- |
| `hit_spark` | a plain hit | no |
| `crit_burst` | a crit | no |
| `block_shield` | a block | no |
| `dodge_whoosh` | a dodge or a miss | no |
| `counter_flash` | a counter | no |
| `charge_glow` | Charge, while it holds | yes |
| `poison_drip` | poisoned, over the figure | yes |
| `chill` | chilled | yes |
| `burn` | burning, at the feet | yes |
| `weaken` | weakened | yes |
| `heal_glow` | a heal, also the church | no |
| `mana_sparkle` | mana back | no |
| `windup_tell` | the wind-up tell over an enemy's head | yes |
| `levelup_burst` | level up | no |
| `arrow` | the Archer's arrow in flight: tween it across, it points right in the file | yes |
| `falling_star` | the Falling Star coming down: tween it, or play it at the target | no |
| `star_impact` | its landing | no |

`bubble_shield` is about 180 CSS px wide, a thin ring that holds round the figure while the barrier lasts, and `bubble_pop` ends it.

## The owl

About 55 CSS px tall, hovering about 26 above its pivot. `stand` is 4 frames, `attack1` is 6 with **the blow on frame 4**, when it dives lowest. It swoops in its frames; move it across to the enemy in code.

## Not drawn

Not seen in the game. The moves not named above (Net Toss, Tripwire, Nettle Knife and so on) can use these clips: `weaken` for a snare, `poison_drip` for the knife. Say if one wants its own.
