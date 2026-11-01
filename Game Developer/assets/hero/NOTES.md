# The hero: five test sets from the hybrid rig

Mitch, AD, 2026-11-01. A production test, not final art: the same hero in five outfits, each one atlas in the game's form,
for Miles, GD to wire into the board and the fight so Robin can see it at 412 by 915 with the real UI. Copy a whole set's
folder into `assets/`. The files face LEFT; flip to face right.

| Set | Outfit | Weapon clip | Atlas | On disk | Decoded |
| --- | --- | --- | --- | --- | --- |
| `tunic` | hair, tunic, bare hands, leather boots, sword | the cut | 2048 by 2048 | 159 KB | 16 MB |
| `plate` | helmet, breastplate and pauldrons, gauntlets, plate boots, cape, sword, shield | the cut | 2048 by 2048 | 230 KB | 16 MB |
| `mage` | hat, robe, bare hands, shoes, staff | the cast | 2048 by 2048 | 166 KB | 16 MB |
| `mix` | helmet, tunic, gauntlets, plate boots, cape, two-handed axe | the chop | 2048 by 2048 | 214 KB | 16 MB |
| `archer` | hair, tunic, bare hands, leather boots, bow | the shot | 1024 by 2048 | 144 KB | 8 MB |

Every set has 26 frames: `stand` 4 at 150 ms (looped), `move` 6 at 100 (looped), `attack1` 6 at 67 with the fourth held
134, `defend` 2 at 100 (hold the last), `hit1` 2 at 150 and 120, `die1` 6 at 90 with the last two fading (`a0`, `a1` in
the actions block). Frame names `hero_<set>/<action>/0001`, the pivot at the feet, 2 px padding, palette PNG. The hero
stands 150 CSS px tall in a fight (300 in the file) and is drawn at 0.3 on the board (44 px).

## The one budget line missed

`docs/state/art.md` asks for a class character in one atlas of at most 1024 by 2048 with about 25 frames. At 2x the
hero's frames are about 260 by 330 px trimmed, and 26 of them need about 2.2 million px; 1024 by 2048 holds 2.1 million.
So four of the five sets packed to 2048 by 2048, 16 MB decoded each, and the on-disk size is well under the 400 KB line.
The ways out, for Miles, GD and Robin to choose between:

1. **Accept 2048 by 2048 for a class character** (16 MB decoded; one hero on screen at a time, so a fight scene with the
   hero and one monster stays under the 48 MB aim).
2. **Two atlases per set** (the fight's clips in one, the board's stand and move in the other), each within 1024 by 2048.
3. **Files at 1.5x** for the hero (225 px tall): everything fits 1024 by 2048 at the cost of a softer hero on phones with
   a pixel ratio of 3.

## The slots and what the game needs to know

A set is one skeleton with a part in each slot: head (hair, helmet, hat), torso (tunic, plate, robe), hands (bare,
gauntlets), boots (leather, plate, shoes), back (none, cape), weapon (sword, axe, staff, bow), off-hand (none, shield). Any
part swaps without touching the rest (the studio's `work/hybrid/combos.jpg`). Today each worn combination is rendered as
its own atlas; that is simplest for the loader and costs one atlas per combination the game allows. The other way, one
atlas per PART with the game layering them in the same pose, keeps the download small for many combinations but needs the
client to draw layers in order with the same frame timing; the rig can write either. Which one is a decision for Miles, GD
and Robin once the number of combinations is known.

The rules have five gear slots (weapon, armour, helm, boots, trinket); gloves, capes and shields are in the art but not yet
in the rules (Miles, GD put that to Robin on 2026-11-01).

## Not tested

The sets have not been seen inside the game yet; that is this delivery's purpose. No sound, no effects beyond the cast's
glow. The axe's and the bow's art are placeholders that prove the grips, not finished weapons.
