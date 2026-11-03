# The Magician casts: her cast pose, spell effects, Magic Power

Mitch, AD, 2026-11-03, for Miles, GD. Robin, after playing the Magician: "when casting spells there should be a casting animation and spell cast, not hitting melee. We need effects for spells." Designs mine. Not seen in the game. `preview.jpg` shows each school on the Meadows' fight backdrop, then each burst frame by frame, then Magic Power on her. The moving page shows her casting each school at the phone's size: https://claude.ai/artifact/PWa2vyPSM9i4vSfTUWcGzh

## 1. The cast: the Magician's `attack1` is now a cast

She no longer swings the staff. She stands, raises the staff upright, and on **frame 0004 (134 ms)** the staff head flares and her free hand is thrown forward. That is the moment the spell leaves. Then she recovers.

So for the Magician, `cast` = `attack1`. Every atlas that holds her frames has been rebuilt with the new pose, so **recopy all of these**:

- `out/hero_classes/wizard`
- `out/gear_sets`
- `out/weapons_v2` (wands, orbs)
- `out/legends`
- `out/legends_2`
- `out/arena_legends`

Also recopy `out/weapons_v2`'s blood, talents and day/night. They were rebuilt but have not changed.

**Her free hand on frame 0004** is about 50 px in front of her feet and 80 px up, at 0.5, facing right. Launch the bolt from there. The staff's gem is about 8 px behind her feet and 188 px up, if you'd rather the flare sat there.

### Her worn pieces during the cast

The cast is her standing frame with only the arms moving, so her body never leans. Worn pieces drawn on `attack1` follow the Knight's lunge and slide off her: the hat tips, and the coat and cape lean. So **while she casts, draw these on `stand/0001`**: coat, `coat_near`, hat, boots, cape and charm.

These keep their attack frames:

- Gloves: `attack1_wizard` where it exists.
- Her staff, wand or orb: `attack1`.
- Her body atlas: `attack1`.

### Her melee swing: `melee`

Miles, GD's question, 2026-11-03: the Spellsword still steps in with a sword, and the cast looked wrong for that. Her body atlas, `hero_classes/wizard/body`, now has a clip `melee`. It is the Knight's sword swing in her colours, 6 frames, the same pivots and the same delays as `attack1`, blow on 0004.

When she swings a sword, draw her body layers on `melee` and everything else on plain `attack1`: the sword, gloves (not the `_wizard` ones), coat, hat, boots and cape. They all follow the Knight's swing, so they fit. Use it for her plain Attack with a sword, Spell Thrust, Arc Slash and Blade Whirl. A staff or wand never swings.

## 2. The spells: `fx_spells.png`, `.json`

Three schools: `arcane` (violet), `fire` and `holy` (gold-white). Each has three clips:

| Clip | Frames | Delays (ms) | Pivot | Use |
| --- | --- | --- | --- | --- |
| `<school>_flare` | 4 | 40 40 50 60 | centre | At her hand on frame 0004, as the spell leaves |
| `<school>_bolt` | 4 | 50 each, **loop** | the bolt's head | Flies from her hand to the foe. Drawn pointing right: rotate it to the line from hand to foe. About 60 px long |
| `<school>_burst` | 6 | 40 40 50 60 70 80 | arcane and fire: where it hits, the foe's middle. **holy: the foe's feet** | Where it lands. Holy is a beam of light from above with a ring on the ground |

**Magic Power** has two clips, both pivoted at the Magician's feet. Draw them behind her.

| Clip | Frames | Delays (ms) | Use |
| --- | --- | --- | --- |
| `power_on` | 6 | 50 50 60 70 80 90 | Violet flames rise round her and a gold ring spreads, when the meter is spent |
| `power_aura` | 8 | 90 each, **loop** | While the four rounds last: a turning ring of dashes at her feet, motes and two small flames rising |

**How to draw them.** No ink and no soft edges. Each piece has a deep rim, a bright middle and a white core, so **draw them normally**, not additively; they read on the bright sky and on dark caves alike. They fade by breaking up and shrinking. `loop` is set on the bolts and `power_aura` in the json's actions.

**Which school for which spell is yours.** My suggestion:

- **Arcane:** Arcane Bolt, Arc Slash and the plain cast.
- **Fire:** Firework (`fireball`), Falling Star (`meteor`), Detonate and Kindled.
- **Holy:** Smite, Judgement Day, Mend and Grace.

For a heal, play the holy burst on the one healed. A bolt flies at about 600 px a second, which is about half a second across the fight screen. Fire's burst is the biggest at about 150 px across; holy's beam is about 190 px tall.

Atlas 2048 by 2048, 56 frames, under 0.5 MB on disk. Load it when a Magician is in the fight.

## 3. The Magic Power icon: `out/abilities`

`magic-power` is a charged violet gem with rays and two gold chevrons going up, on the Magician's blue plate. It is in `abilities.png`, the same atlas, so recopy that and its json. Replacing the Pocket Watch (`time-warp`) on the button is your code. The Pocket Watch (`time-warp`) is now out of the atlas, as you said it could go.

Tools: `tools/kit/fx_spells.js`, `tools/hybrid/classes.js` (the cast pose), `tools/kit/abilities.js`.
