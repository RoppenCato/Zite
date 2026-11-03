# Weapons and off-hands by class, the new Rogue, day and night

Mitch, AD, 2026-11-03, for Miles, GD, on Robin's "Weapons and off-hands by class" (the brief, 2026-11-03). How many looks, and drawings rather than tints, are mine. Not seen in the game. `preview.jpg` shows every new piece on its class, standing and at the blow; `rogue_v2.jpg` the blood, the talents and the sun and moon.

## Three looks for every new kind, drawn

| Look | For the ranks (mine) | What changes |
| --- | --- | --- |
| `plain` | Tin, Copper, Iron | Iron and plain wood, no gem |
| `fine` | Silver, Moonsilver, Sunsteel | Bright steel, blue cloth, a blue gem |
| `grand` | Dragonscale, Starglass, Crownsteel, Everbright | Gold, a red gem |

Piece names are `<look>_<kind>`, frames `<piece>/<clip>/<nnnn>`, with the same 26 frames, pivots and `clips.json` as `hero_gear`. Files at 2x, facing left. **One atlas per kind, or per look for the big ones,** so each costs nothing until worn: the texture is the atlas named in the tables.

## The weapons

| Class | Kind | Atlas | Pieces | Notes |
| --- | --- | --- | --- | --- |
| Warrior | `great` | `plain_great`, `fine_great`, `grand_great` | `plain_great` greatsword, `fine_great` great axe, `grand_great` maul | Two-handed, see below |
| Rogue | `sword` | `rogue_plain_sword`, `rogue_fine_sword`, `rogue_grand_sword` | `<look>_sword` | A slim curved blade, on the Rogue's own moves |
| Magician | `wand` | `wands` | `<look>_wand` | It sparks with the staff's `glow` |
| Hunter | `dagger` | `hunter_daggers` | `tin_dagger`, `copper_dagger`, `<look>_dagger` | On the Warrior's moves, with `hunter_body` |

**The great weapon, held in both hands.** The far hand grips the haft above the near hand, so the far arm changes. With a great weapon, draw `far_front_great` from `great_arm` **in place of both `far_back` and `far_front`**, and the gloves' `tin_gloves_far_great` or `copper_gloves_far_great` in place of `gloves_far`. Leather and Cloth gloves have no `_great` frame yet: show the bare hand in `far_front_great` with them, and I'll add them if you want. The weapon goes in the sword's place in the draw order. No shield.

**The Hunter with a dagger.** Her bow body holds the bow out in the far hand, which a dagger can't use. `hunter_body` is her body on the Warrior's moves, with the same frame names as her bow body: `far_back`, `far_front_shield`, `hand_open`, `body`, `far_front`, `head`, `hair`, `arm`, `hand`. Use it whenever she holds a dagger; her gloves and coats from `hero_gear` fit it, as on the Warrior.

## The off-hands

| Kind | Atlas | Pieces | Who |
| --- | --- | --- | --- |
| `buckler` | `shields_buckler` | `<look>_buckler`: small, all metal, at the fist | Warrior, Rogue, Hunter |
| `round` | `shields_round` | `<look>_round`: wood planks in `plain`, a cross in the others | Warrior, Rogue, Hunter |
| `kite` | `shields_kite` | `<look>_kite`: tall and pointed | Warrior, Rogue, Hunter |
| `tower` | `shields_tower` | `<look>_tower`: covers him from chin to knee | Warrior, Rogue, Hunter |
| orbs | `orbs` | `ward_orb` (steady blue, a turning ring), `mirror_orb` (silver, a glint), `blink_orb` (violet, motes circling), `storm_orb` (crackling) | Magician |

- **The size shows the balance:** the buckler is half the round shield's size and sits at the fist, while the tower hides most of the body.
- **One set of frames for all three classes:** the shield follows the far arm, and the Rogue's and the Hunter's far arms move as the Warrior's does. Draw with `far_front_shield` and `gloves_far_shield`, as today.
- **The orbs** float just above the Magician's free hand, also with her `far_front_shield`. They move frame by frame, like the legendary weapons' flames.

## The new Rogue: blood on the blade

`fx_blood.png` and `.json`. Clips `blood_1`, `blood_2` and `blood_3` are the red film up the blade as blood builds: a tip, half the blade, then the whole edge with drops. Each is drawn up from the grip, 50 px long at 0.5, pointing up from the pivot; turn it with the weapon and lay it on the blade. `blood_drip` (4 frames, pivot at the drop's top, spawn it at the blade's tip) and `blood_splash` (3 frames) work as the poison ones do.

## Talent icons: `talents_v2.png`, `.json`

`thousand-cuts`, `shadow-finale`, `toxic-jab`, `venom-finale`, `blood-on-the-blade`, `crimson-arc`, `bleed-out`, `red-mist`, `blood-finale` and `black-blood`. 40 px at 2x, on the Rogue's plates. The plate is my guess at each one's kind: a crest for always on (Blood on the Blade, Red Mist), a ring for the finales and Black Blood, round for the rest. Rename the frames to your ids if they differ; tell me if a kind is wrong.

## Day and night: `daynight.png`, `.json`

`icon_sun` and `icon_moon`, 20 px at 2x in a 24 px cell. Darken the map in code, as you planned. A painted night overview would double the overviews' memory for a small gain, so I'd leave it.

## New icons: `icons.png`, `.json`

All the new weapons, shields and orbs at 40 px, named by piece.

Tools: `tools/hybrid/weapons_v2.js`, `tools/kit/rogue_v2.js`. The `frames/` folder is the packer's; you need only the png and json files.
