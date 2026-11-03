# The legendary weapons, second set

Mitch, AD, 2026-11-03, for Miles, GD. Robin: "make some more cool looking weapons, try to make them look different than the ones you have already made, so they really stand out." Designs, names and tiers are mine; numbers and where they drop are yours. Not seen in the game. `preview.jpg` shows each on its class, standing and at the blow. The moving page now shows both sets: https://claude.ai/artifact/G5fLY7VdDmavpFRBRTXDob

Same form as `out/legends`: one atlas each, `<id>/<id>.png` and `.json`, frames `<prefix>/<clip>/<nnnn>`, the same 26 frames and `clips.json`, icons in `icons.png` by prefix. `legends.json` lists each with its class, tier, part and atlas size. What moves is drawn fresh each frame.

| Weapon | Id | Prefix | Class | Tier | Look |
| --- | --- | --- | --- | --- | --- |
| Tidecaller | `tidecaller` | `tidecaller_sword` | Warrior | 3 | A blade of sea water on a coral hilt, the edge rolling, bubbles rising |
| Crystal Cleaver | `crystal_cleaver` | `crystal_cleaver_sword` | Warrior | 5 | One purple crystal, all facets, a glint running up |
| Bonecrusher | `bonecrusher` | `bonecrusher_great` | Warrior | 4 | A two-handed bone maul, a skull for its head, green ghost fire |
| Kingslayer | `kingslayer` | `kingslayer_great` | Warrior | 7 | A black two-handed sword, jagged, red runes that burn and fade, a chain round the grip |
| Mothwing | `mothwing` | `mothwing_dagger` | Rogue | 3 | A pale knife with a moth's wings that beat, silver dust |
| Serpent's Kiss | `serpents_kiss` | `serpents_kiss_sword` | Rogue | 5 | A wavy green sword, a snake's head for a guard, its tongue flicking |
| Ghostblade | `ghostblade` | `ghostblade_sword` | Rogue | 7 | A pale hollow sword trailing wisps |
| The Clockwork Wand | `clockwork` | `clockwork_wand` | Magician | 4 | Brass, two gears turning at its head |
| Prism Spire | `prism_spire` | `prism_spire_staff` | Magician | 6 | A turning prism above a white staff, a fan of rainbow light |
| The Watcher's Eye | `watchers_eye` | `watchers_eye_staff` | Magician | 7 | A black claw holding an eye that looks about and blinks |
| Dragonbone | `dragonbone` | `dragonbone_bow` | Hunter | 7 | Bone, a dragon's skull at the top, embers from its jaws |
| Blossomstring | `blossomstring` | `blossomstring_bow` | Hunter | 4 | Pink wood in flower, petals falling |
| Wolf's Fang | `wolfs_fang` | `wolfs_fang_dagger` | Hunter | 5 | A great white fang, a fur grip, a paw for a pommel |

- **The two great weapons** go with `weapons_v2/great_arm`, as the new great weapons do: draw `far_front_great` instead of `far_back` and `far_front`.
- **Wolf's Fang** is the Hunter's dagger, on her melee body, `weapons_v2/hunter_body`.
- **The Rogue's two swords** and **the Clockwork Wand** use the new kinds from `weapons_v2`.

Tool: `tools/hybrid/legends2.js`.

## Also: the wands are brighter

Miles, GD's note: the wand vanished against the Magician's robe. `out/weapons_v2/wands` now has a pale rim round the shaft, a lighter shaft and a glow round the tip. Recopy `wands.png` and `.json`.
