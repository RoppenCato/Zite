# Leather, Cloth and the wooden weapons

Mitch, AD, 2026-11-02. Designs mine, under Robin's permission of 2026-11-01; Robin has not judged them. Same 26 frames, pivots and `clips.json` as `hero_gear`. Files at 2x, facing left. `preview.jpg` shows each set on all four classes. Hide, Linen and the later sets are a new material and a few shape notes each, once you and Robin say these look right.

## One atlas per set: please load them when worn

| Atlas | Holds | Size | Decoded |
| --- | --- | --- | --- |
| `leather/leather` | `leather_hat`, `_coat`, `_coat_near`, `_gloves_near`, `_gloves_far`, `_boots`, `_cape`, `_charm`, `_shield` | 1024 by 2048 | 8 MB |
| `cloth/cloth` | the same pieces, `cloth_` | 1024 by 2048 | 8 MB |
| `wooden/wooden` | `wooden_stick`, `wooden_staff` | 1024 by 2048 | 8 MB |
| `icons` | 40 px icons of all the above | 256 by 512 | 0.5 MB |

**Why not add them to the family atlases:** those would double in size and grow with every later set, whoever wears what. This way a set costs nothing until a piece of it is worn. Your fall-back to Tin covers the moment while it loads, and when the last piece of a set comes off, its atlas can go.

So the texture for a piece comes from its first word: `leather_coat` is in `leather`, `tin_coat` stays in `coats`. The draw order is unchanged.

## Attack frames by class

A piece that follows a hand has a second clip for the classes whose hands differ:

- **`attack1_wizard`:** `<set>_gloves_near`, `wooden_stick`, `wooden_staff`.
- **`attack1_archer`:** `<set>_gloves_near`, `<set>_gloves_far`, `<set>_shield`, `wooden_stick`, `wooden_staff`.

For those classes, use that clip name if the frame exists, otherwise `attack1`. The Knight and the Trickster use plain `attack1`.

## The wooden weapons

**Yes, one drawing serves every class.** `wooden_stick` and `wooden_staff` are named for what they are, not the class's part, because the same drawing goes in any class's hand. So the item's name decides: "Wooden Stick" is `wooden_stick`, "Wooden Staff" is `wooden_staff`. The hand's `hand` or glove piece draws over the grip as usual, and the blow stays on frame 4.

## What the shapes are

- **Leather:** a cap with an ear flap and stitches, a laced jerkin, a plain cloak, a fang on a cord, a small round buckler.
- **Cloth:** a soft blue hood with a cream edge, a long cream robe with a blue hem and front, curled shoes, a short mantle, a round amulet, a tome carried in the off hand on the shield's layer.

## Not tested

Not seen in the game. A hood or cap replaces the hair, as every hat does. The Wizard's own body skirt sits under the robe, and I saw no conflict in the preview.
