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

## Every rank, 2026-11-03

Robin chose "fill the holes" and "polish and looks". Miles, GD found that every rank past Tin and Copper, Leather and Cloth was drawn as Tin, so "a level-25 hero still looks like a beginner". Now every rank has its own atlas in the same form as `leather` and `cloth`. Designs mine; Robin has not judged them. Not seen in the game.

Each line has **four looks**, drawn once and recoloured across its ranks. The shape changes every two or three ranks and the colour every rank:

| Line | Look | Ranks |
| --- | --- | --- |
| Heavy | kettle cap and plate | Tin, Copper (in `hero_gear`), Iron, Silver |
| Heavy | knight's helm with a plume, tabard, big pauldron | Moonsilver, Sunsteel |
| Heavy | horned dragon helm, scale coat, spiked pauldron | Dragonscale, Starglass |
| Heavy | winged helm with a crown, royal tabard with a sun, gold-trimmed cape | Crownsteel, Everbright |
| Light | leather cap and jerkin; Hide adds a fur trim, Studded adds studs | Leather, Hide, Studded |
| Light | ranger's cowl, scarf and bandolier, a shoulder plate | Drakeskin, Nightskin |
| Light | head-wrap with a feather, fringed jerkin and crossed belts | Sunskin, Wyrmskin |
| Light | plumed hat, long coat with tails and gold buttons | Starskin, Crownskin, Everskin |
| Magic | hood and robe | Cloth, Linen, Silk |
| Magic | pointed wizard hat with a star, starry robe | Moonweave, Starweave, Sunweave |
| Magic | turban with a plume and a gem, high collar and sash | Dreamweave, Aetherweave |
| Magic | crowned mitre, robe with a gold stole | Crownweave, Everweave |

- **Atlases:** `<rank>/<rank>.png` and `.json`, plus `<rank>/<rank>_archer` for the Hunter's gloves and shield. These are the same frame names as Leather's, `<rank>_hat`, `_coat`, `_coat_near`, `_gloves_near`, `_gloves_far`, `_gloves_far_shield`, `_gloves_near_open`, `_boots`, `_cape`, `_charm`, `_shield`, with the same `attack1_wizard` and `_archer` clips. The rank id is the rules' name in lower case.
- **Size:** each is 1024 by 2048 or 2048 by 2048 (the tall hats and plumes take room), 150 to 300 KB on disk. Load one when worn, as with Leather.
- **Icons:** every rank's slot icons are in `icons.png`. That atlas is now 1024 by 2048.
- **Pictures:**
  - `ranks.jpg`: all thirty ranks, line by line, on the Knight.
  - `ranks_classes.jpg`: each new rank from its atlas, on the four classes in turn.
  - `ranks_icons.jpg`: their icons.

Tools: `tools/hybrid/ranks.js` has the looks and colours; `tools/hybrid/sets.js` draws and packs them.
