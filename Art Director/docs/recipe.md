# The paint recipe

Written by Perry, AD on 2026-10-31 after Colin, AD (the Survival game's Art Director) reviewed the first kit at Robin's
request: it read as glossy vector clip art, with every part lit on its own, soft edges, web-button gradients, a ground body
as loud as the fighters, and three different line hands. This is the one recipe every near piece follows from now on. It
comes from measuring the reference (`tools/measure.js` on a crop of the library's Forest West of Henesys, read where it is,
nothing copied) against our first pass:

| | The reference | Ours, first pass |
| --- | --- | --- |
| The whole fight scene: dark pixels (lightness under 0.22) | 33 percent | 2.5 percent |
| The soil body: lightness, dark share | 0.24, 50 percent | 0.42, 2 percent |
| The grass lip over it: lightness | 0.41 (1.7 times the body) | 0.46 (the same as the body) |
| Trees: lightness, saturation | 0.40, 0.65 | 0.56, 0.41 |
| A monster (their Orange Mushroom, our Turnip Grump): dark share | 11.5 percent | 10 percent |

## The rules

1. **One light over the whole form.** A crown, a bush, a haystack, a head of hair is one silhouette lit once: a light band
   on top, a mid band, a dark band beneath, with narrow transitions. The lobes and clumps are cut in afterwards with the same
   tones (a dark crevice under each lobe, a light edge on its lit side). Never a gradient per part.
2. **Three chosen tones per material, in hard shapes.** Light, mid and dark are picked, not computed, and laid as shapes
   with edges. No smooth ramps, no radial glow, no white shine on hard things. A highlight is a crescent in the light tone.
3. **A dark, quiet ground body under a thin bright lip.** The soil body around lightness 0.25 with half its pixels dark
   (clods with deep crevices); the grass lip around 0.4 and saturated; nothing in the body competes with the fighters.
4. **Crisp edges, drawn at the real size.** No blurred rims: tufts, flowers, rocks and clouds are hard shapes.
5. **One line.** Every near thing (the hero, the monsters, the props, the ground's edge) has the same ink `#2b2320` at
   2.5 px in the 2x file (1.25 CSS px), full strength on the silhouette, 1.5 px at half strength inside. The planes behind
   have none.
6. **Nothing stamped.** No two bushes from one cog; a bush and a haystack are different shapes, not one shape recoloured.
7. **The feet.** Every prop has something at its base: a cast shadow and foot grass, or roots, so it sits in the ground.
8. **Clusters, not confetti.** Richness is things overlapping: a bush at a tree's foot, flowers at the bush, a rock in the
   grass, never an even spread.
9. **Thin things get mass.** A lamp post, a stem, a blade at game size is fat enough to hold its colour, or it is cut.
10. **Judge on the real background at phone size beside the player, never on a grey sheet.** And ask of every piece: would
    it sit in `Maps/Places` without explaining? If it needs explaining it is not ready.

## The tones (chosen, mine; sampled against the reference's means)

| Material | light | mid | dark | deep | note |
| --- | --- | --- | --- | --- | --- |
| Leaf (trees, bushes) | `#86c93e` | `#4f9c2d` | `#2e6b21` | `#1a4518` | highlight `#c2e860`; mean about `#4d8a3a` |
| Leaf, yellow | `#b7d24c` | `#7ea838` | `#4f7a28` | `#2f5120` | highlight `#e8ee80` |
| Leaf, dark | `#62b03a` | `#38852b` | `#215f20` | `#143f17` | highlight `#9fd851` |
| Grass lip | `#8fcc38` | `#5a9e2c` | `#376f1f` | `#1f4c15` | highlight `#d2f050`; mean about `#5e9a38` |
| Soil | `#6f6338` | `#554b28` | `#3b3418` | `#221e0c` | highlight `#8a7c48`; mean about `#514d2a` |
| Bark | `#b07c44` | `#80562c` | `#55381a` | `#33200e` | highlight `#d9a86a` |
| Stone | `#b9b8ae` | `#8c8d85` | `#5f615b` | `#3a3c38` | highlight `#e2e0d6` |
| Wood | `#c99a52` | `#a3742f` | `#74501c` | `#4a300e` | highlight `#e8c282` |
| Sand | `#eedfa8` | `#d6c288` | `#b39e62` | `#8a7744` | highlight `#fff3cf` |
| Hay | `#d9bd4e` | `#b4962e` | `#86701c` | `#5a4a10` | highlight `#f6e080` |
| Sky | `#3f8fdc` at the top to `#a8d4f2` at the horizon | | | | the clouds flat white with a `#b9cde6` underside |

The monsters and the hero keep the Blender finish's ramp, which already lands on the reference's dark share; its shine is
kept small (`GLOSS` 0.35) and only on skins that should shine (a slime, a cap).

## What this changes in the tools

`tools/brush.js` is rebuilt to these rules: `crown` (one lit mass with cut-in lobes and a serrated edge, over the trunk with
no gap), `clods` (the quiet body), `grass` (the lip), `rock`, `tuft`, `flower`, `cloud`, `dome`, `pole` in hard shapes and
chosen tones, and one `ink` for everything near. The first thing made with it is one slice of the fight screen
(`tools/slice.js`): one tree, one bush, one ground piece, the hero and the Turnip Grump, measured against the reference
before anything else is repainted (Colin, AD, 2026-10-31).
