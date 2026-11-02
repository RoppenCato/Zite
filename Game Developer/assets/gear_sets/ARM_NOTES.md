# The corrected arm: what changes for you

Mitch, AD, 2026-11-02. Robin approved the fix. Recopy `hero_gear`, `hero_classes`, `gear_sets`, `creatures` (the Bandit changes) and `creatures_forest` (the Moss Goblin changes) whole. Frame counts, delays and blow frames are the same.

## The draw order

Cape, **`far_back`**, `body`, boots, coat, `far_front`, gloves far, charm, `head`, `hair` or hat, `arm`, coat near, weapon, `hand` or gloves near, shield.

`body` no longer holds the far arm. `far_back` is new, and is drawn before `body`. Both `far_back` and `far_front` are nearly empty in many frames: draw them always.

## Pick the piece by what is held

| Situation | Use |
| --- | --- |
| A shield worn, Knight, Trickster, Wizard | Skip `far_back`. Use `far_front_shield` in place of `far_front`, and `<rank>_gloves_far_shield` in place of `<rank>_gloves_far` |
| No weapon held, Knight, Trickster, Wizard | `hand_open` in place of `hand`, `<rank>_gloves_near_open` in place of `<rank>_gloves_near` |
| Archer with a bow | `hand` is already open, except where the near hand draws |
| Archer with a wooden weapon | `hand_grip` in place of `hand` |
| Archer with a shield | No arm change: it hangs on the bow arm, drawn from the class's or set's Archer frames |

`far_front_shield` and `hand_open` are in the body atlases of the Knight, Trickster and Wizard. `hand_grip` is in the Archer's.

## Where class frames live

- **Tin and Copper:** look in the class's `body` atlas first, as now. The Wizard has both gloves there in `attack1`. **The Archer has a new atlas, `archer/gear_over`, holding gloves and shield for every clip: look there first, and load it only for the Archer.**
- **Sets (`leather`, `cloth`):** a class's frames are in a clip named for the class. The Wizard uses `attack1_wizard` for gloves, in the set's own atlas. **The Archer holding a bow uses `<clip>_archer` for gloves and shield in every clip, from a separate atlas, `<set>/<set>_archer`, loaded only for an Archer wearing that set.** Everything else uses the plain clip.
- **Wooden weapons:** `attack1_wizard` and `attack1_archer`, as before.

## The Archer's bow

It is in the far hand in all clips, and the near hand draws. The weapon stays in the same layer. The blow is on frame 4 and the arrow leaves there.

## The Bandit and the Moss Goblin

They hang their arms the same way. Their names, scales and blow frames are unchanged.

## Not tested

Not seen in the game. I checked stand, walk, hit and attack frames on the diagnostic, and the stacks from the delivered atlases on each folder's preview.
