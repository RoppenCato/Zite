# The Trickster, the Wizard and the Archer

Mitch, AD, 2026-11-01. Designs mine, under Robin's permission of 2026-11-01; Robin has not judged them. Same form as the Knight in `out/hero_gear`: files at 2x, facing left, pivot at the feet, frame names `<piece>/<clip>/<nnnn>`, and the same 26 frames with the same `clips.json`.

## Gear is shared

**Yes: all four classes wear the same `capes`, `boots`, `coats`, `gloves`, `hats`, `charms` and `shields` atlases from `out/hero_gear`.** Their bodies, legs and shoulders are the Knight's own in every frame, so those pieces fit unchanged. Copper and Tin need no redraw per class, and later ranks need none either.

## What each class has of its own

Each folder replaces the Knight's `body` and `swords`, so only one class counts against memory.

| Class | Folder | Body atlas | Weapon atlas | Weapon pieces |
| --- | --- | --- | --- | --- |
| Trickster | `trickster` | 1024 by 2048 | 512 by 1024 | `tin_dagger`, `copper_dagger` |
| Wizard | `wizard` | 1024 by 2048 | 1024 by 2048 | `tin_staff`, `copper_staff` |
| Archer | `archer` | 1024 by 2048 | 1024 by 2048 | `tin_bow`, `copper_bow` |

`icons.png` in each folder holds its two weapon icons, 40 square, as in the Knight's icons.

## The one rule to add

**For any frame, look in the class's `body` atlas first, then in the shared atlas.** The Wizard's near hand and the Archer's two hands move differently in `attack1`, so their gloves, and the Archer's shield, must follow those hands. Those frames live in the class's `body` atlas under the same names, such as `tin_gloves_near/attack1/0003`.

## The draw order

As the Knight, with the weapon in the sword's place: cape, `body`, boots, coat, `far_front`, gloves far, charm, `head`, `hair` or hat, `arm`, coat near, weapon, `hand` or gloves near, shield.

## The attacks

The blow lands on frame 4 for all of them, as for the Knight.

- **Trickster:** the Knight's cut, with a dagger.
- **Wizard:** raises the staff, then thrusts it forward on the blow, with sparks round its gem in the weapon's own frames.
- **Archer:** draws at chest height. The arrow is in the bow on frames 2 and 3 and gone on frame 4, so the arrow in flight is yours or the effects strip's.

## How they differ, and the limit of sharing

Bare, each class has its own colours, hair and iris. **A hat replaces the hair and a coat covers the tunic, so in full gear of one rank the classes differ mainly by weapon and eye colour.** That is the price of sharing, and it is cheap to change later: a class-coloured cape trim or sash would be one small piece.

## Not tested

Not seen in the game. A shield on a Wizard or Archer is drawn on the forearm like the Knight's, and I have not judged how often it will be seen. The Owl Friend, the Falling Star and the Bubble Shield come with the effects strip.
