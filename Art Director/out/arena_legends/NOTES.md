# The Arena legendaries: a level 30 set for each land

Mitch, AD, 2026-11-03, for Miles, GD. Robin: "a legendary special weapon for each zone, it should be max level (30) so really good, and fit with the theme of that zone. One of each weapon type + different shields", to be won from each land's Arena on its hardest mode, which opens once every Seal is won, before the last dungeon; then "Do those 35. Miles will need to find a way to balance loot and to distribute loot in a good way in the game." **Their numbers, drops and how the Arena opens are yours.** Designs and names are mine. Not seen in the game. `preview.jpg` shows each on its class, standing and at the blow; the moving page is https://claude.ai/artifact/HydAy5QDMHiWkYHPUqXzWb

## The form

The same as `out/legends_2`: one atlas each, `<id>/<id>.png` and `.json`; frames `<id>_<kind>/<clip>/<nnnn>`, the same 26 frames and `clips.json`; icons in `icons.png` by `<id>_<kind>`. `arena_legends.json` lists each with its land, class, kind and atlas size. What moves is drawn fresh in each frame.

- **Great weapons** go with `weapons_v2/great_arm`. **The two Hunter daggers** go on `weapons_v2/hunter_body`.
- **Shields** sit on the far arm like the `weapons_v2` shields, with `far_front_shield` and `gloves_far_shield`, for the Warrior, Rogue and Hunter. **Orbs** sit on the Magician's `far_front_shield`.

## The sets

Each land has a weapon for each class and one off-hand. Across the seven lands that covers every weapon kind and every shield size, plus two orbs.

| Land | Warrior | Rogue | Magician | Hunter | Off-hand |
| --- | --- | --- | --- | --- | --- |
| Cloverfield Meadows | `millstone` great, The Millstone | `four_leaf` sword, Four-Leaf | `goo_sceptre` wand, King Goo's Sceptre | `sunfield` bow, Sunfield | `hedgerow` buckler, Hedgerow Buckler |
| Wobblewood | `briarthorn` sword, Briarthorn | `nightowl` dagger, Nightowl | `elderroot` staff, Elderroot | `stags_antler` dagger, Stag's Antler | `oakheart` round, Oakheart |
| Honeyhill | `queensting` great, Queensting | `waspknife` dagger, Waspknife | `harvest_moon` staff, Harvest Moon | `pollen_wind` bow, Pollen Wind | `honeycomb` kite, Honeycomb Kite |
| Bogglemire | `bog_anchor` great, Bog Anchor | `lanternlight` sword, Lanternlight | `witchs_reed` wand, Witch's Reed | `heronwing` bow, Heronwing | `will_o_wisp` orb, Will-o'-Wisp (a blink orb) |
| The Frostcrown | `frostbeards_hammer` great, Frostbeard's Hammer | `icicle` dagger, Icicle | `avalanche` staff, Avalanche | `goatsbane` dagger, Goatsbane | `summit_wall` tower, Summit Wall |
| The Pirate Isles | `saltjaws_cutlass` sword, Saltjaw's Cutlass | `black_tide` sword, Black Tide | `compass` wand, The Compass | `krakens_arm` bow, Kraken's Arm | `ships_wheel` buckler, Ship's Wheel |
| The Giants' Land | `crown_of_the_north` great, Crown of the North | `snowfang` dagger, Snowfang | `aurora` staff, Aurora | `northwind` bow, Northwind | `blizzard_orb` orb, Blizzard Orb (a storm orb) |

## Memory

35 atlases, 2.5 MB on disk, from 256 by 512 for the buckler to 1024 by 2048 for the great weapons and staffs. As with the other legendaries, load one when it's worn and free it after.

Tool: `tools/hybrid/arena_legends.js`.
