# The talent icons

Mitch, AD, 2026-11-02, for Miles, GD. Icons for the 132 talents that had none; designs mine. Not seen in the game. I judged them at 68 and at 34 on a parchment ground, in `preview.jpg`, one row to a tree.

**Files:** `talents.png` (1024 square, 123 KB on disk, 4 MB in memory) and `talents.json`. A second atlas, so it can load with the talent board and be freed after. Frame names are the rules' ability ids, such as `pal-devotion`. 40 CSS px at 2x, so draw at 0.425 for a 34 px node and 0.5 for a 40 px capstone. The pivot is the centre.

**How to read them** (the same marks as the ability icons, read from `rules/data/abilities.json`):

| Plate | Means | Count |
| --- | --- | --- |
| Gold-edged crest | Always on (`rule`) | 85 |
| Round | You press it | 37 |
| Round with a gold ring | Once a fight (`oncePerFight`) | 10 |

The plate takes its class's colour. Inside, the same effect keeps a similar shape across the trees (a heart for HP, an eye for crit chance, a burst for harder crits), but each tree says it its own way: the Ranger's attack is a bow, the Ninja's a knife in a fist.

**If you add talents:** add a line to `T` in `tools/kit/talents.js` and run it; it warns about any talent with no drawing. It takes the list from `rules/data/abilities.json` and leaves out anything already in `assets/abilities`.

Weakest at 34: `nin-first` and `ran-opening` rely on a small 1, and `tra-barb` is thin. Tell me if any reads badly on the board.

## 2026-11-10: the Warlord, and three Berserker talents redrawn

Robin's "Yes" through Miles, GD. The Warlord's 15 in the Paladin's place: banners and shouts. The three banners are one shape told apart by cloth and emblem, none of them red, so they read on the Warrior's red plate. Berserker: `ber-fury`, `ber-thirst` and `ber-keen` redrawn. Picture: `warrior.jpg`. In the game (Miles, GD, bcef0fc).

## 2026-11-11: the Magician's 12

Robin's "Yes" through Miles, GD. Wizard 4, Cleric 3, Spellsword 5, in place of the 12 retired ones. Frost is pale blue, storm violet, Light gold. Picture: `magician.jpg`. In the game (Miles, GD, fdf2f16).

## 2026-11-11: the Rogue's 8, and two redrawn

Robin's yes to the Rogue's new talents, through Miles, GD. Designs mine. Picture: `rogue.jpg`, at 68 and at 34 and 28 on light and dark grounds.

| Id | Talent | The picture |
| --- | --- | --- |
| `nin-wet` | Wet Blade | a kunai with blood on its tip, drops falling |
| `nin-start` | First Blood | a kunai and one big drop |
| `nin-thirst` | Bloodthirst | a crit's burst with two drops |
| `nin-cup` | Deep Cup | a steel goblet full of blood, drops falling in |
| `sha-lurk` | Lurk | two eyes in a black shadow under the moon, an hourglass |
| `sha-sight` | Dark Sight (redrawn) | the violet eye under a moon, a crit's spark |
| `sha-gloom` | Night Cut (redrawn) | a white slash and a puff of smoke |
| `alc-volatile` | Volatile | two flasks meeting in a red burst |
| `alc-linger` | Lingering | a green pool with fumes, an hourglass |
| `alc-reagents` | Reagents | a reaction's burst giving a gold pip (Mischief) and a blue drop (mana) |

The retired ids (`nin-hands`, `nin-first`, `nin-edge`, `nin-grip`, `sha-finish`, `alc-flask`, `alc-salve`, `alc-tonic`) are no longer in the atlas, since the tool only draws what `abilities.json` lists. Still 127 frames, 1024 square, 122 KB.

## 2026-11-12: the Hunter's 20, and two redrawn

Robin's design and his "Yes" to the talent list, through Miles, GD. Designs mine. Picture: `hunter.jpg`.

- **Ranger, crits that bleed:** the arrow and red drops.
  - Open Wound: an arrow into a burst, dripping.
  - Steady Breath: a target, an arrow and a breath.
  - Deep Cuts: a drop and an up arrow.
  - Hamstrung: a sword, a drop and a down arrow.
  - Rend: an arrow trailing drops.
  - Blood Scent: a red eye and a drop.
  - Long Bleed: a drop and an hourglass.
  - Bleed Dry: a red burst spraying drops.
- **Beastmaster, pets that stay:**
  - Wolf, Bear and Viper: each pet's head, the same three as in the fight.
  - Kill Command: a paw and three claw marks.
  - Keen Beasts: a paw and sparks.
  - Well Fed: a joint of meat and a heart.
  - Pack of Two: two paws.
  - Stampede: a trail of paws.
- **Survival, traps:** the spike trap with a mark.
  - Prepared: sparks.
  - Cunning: a target, which is Aim.
  - Follow Up: an arrow over it.
  - Second Trap: two traps.
  - Barbed (redrawn, was a tripwire): an up arrow.
  - Patient (redrawn, was a bare hourglass): an hourglass over the trap.
- **Kept as they are:** Owl, Spike Trap, Snare and Venom Trap (in `assets/abilities`), and Stoop. They still read right with the new meanings.
- **The atlas:** 134 frames, 1024 square, 128 KB. The retired ids are no longer in it.
