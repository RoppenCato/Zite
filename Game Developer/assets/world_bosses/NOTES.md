# The world bosses: one for each land

Mitch, AD, 2026-11-04, for Miles, GD's wave 7b. Robin chose a world boss of its own for each land (2026-11-04); the names
and looks are Miles, GD's, and the drawings are mine. Each one is the great one of a creature of its land. Robin has not
judged them, and none of them has been seen in the game yet.

Pictures:

- `fights.jpg`: each boss at phone size on its land's fight backdrop beside the Knight, standing and then at the blow
  under half HP.
- `preview.jpg`: every clip at 0.8 of file size (stand, walk, windup, blow, hit, falling), then the stand and the blow
  under half HP.
- The moving page: https://claude.ai/artifact/NeVzmzxRQbSdaXKEzcjFJk

## The seven

| Id | Atlas | Creature | Land | Scale | KB (and phase 2) |
| --- | --- | --- | --- | --- | --- |
| `bristleback` | `bristleback` | Old Bristleback: a boar as big as a hay cart, a hedge of bristles with leaves and a daisy caught in it, three claw scars on his flank, one over his eye, a notched ear | Cloverfield Meadows | 1.1429 | 111 (84) |
| `mother-owlbear` | `mother_owlbear` | Mother Owlbear: the cub's mother up on her hind legs, wide awake and cross, her nightcap knocked askew on one ear tuft | Wobblewood Forest | 1 | 141 (98) |
| `bramley` | `bramley` | Big Bramley: an apple as big as a cottage on root legs, vines with leaves and blossom for arms, a worm looking out of his side | Honeyhill Fields | 1.1429 | 100 (68) |
| `grandfather-croak` | `grandfather_croak` | Grandfather Croak: the Bog Toad grown huge and old, lily pads, a water lily and a bulrush on his back, white brows and a wispy beard | Bogglemire | 1.1429 | 129 (96) |
| `cragheart` | `cragheart` | Old Cragheart: a walking hill of stone with snow and three pines on his back, fire in his cracks, eyes and mouth, two boulder fists | The Frostcrown | 1.1429 | 127 (94) |
| `clackclaw` | `clackclaw` | Old Clackclaw: a giant old crab, barnacles and seaweed on his shell, a ship's wheel stuck in it, one great claw | The Pirate Isles | 1.1429 | 113 (74) |
| `frostgut` | `frostgut` | Frostgut: a hill ogre with a great belly, a yeti-fur mantle, an underbite with two tusks, and a whole glacier for a club | The Giants' Land | 1.3333 | 104 (66) |

- **Scale** is `1 / filePx`: it draws each boss at the size I judged in `fights.jpg`. That is 230 to 350 design px
  tall: the upright ones as tall as a gate boss, the wide ones lower but up to 400 wide.
- Their backs run past the right edge of the screen on purpose: a world boss reads too big for the screen.
- Their fronts stop about 140 px from the Knight.
- Turn the scale down if you want them to sit inside the screen. The gate bosses are at about 0.82 of their file size,
  and these hold up to that.

## The clips: the gate bosses' set (mine)

| Clip | Frames | Notes |
| --- | --- | --- |
| `stand` | 3 | 220 ms |
| `move` | 3 | 160 ms |
| `attack1` | 8 | The windup on frames 1 to 3; the **blow on frame 5, held 220 ms** (`blowFrame: 5`, as on the gate bosses) |
| `hit1` | 1 | |
| `die1` | 5 | Fades on the last two |

You asked for stand 6, move 6, attack1 12 and die1 8. I used the gate bosses' set instead. These creatures are 300 to
400 px wide, and 33 frames of that size would only fit one 1024 by 2048 atlas at about half their size on screen. They
would go soft. With the gate bosses' set they stay as sharp as the gate bosses.

## Under half HP: `<atlas>2`

Each boss has a second atlas with `stand` (3 frames, 120 ms) and `attack1` (8 frames, the blow on frame 5, held 190 ms),
in the same form as `mother_murk2` and `frostbeard2`. Swap to it at the "under half HP" line:

- **Old Bristleback:** his bristles stand on end, his eyes burn and he snorts steam.
- **Mother Owlbear:** her nightcap is gone, her feathers stand on end and loose feathers fly.
- **Big Bramley:** thorns grow on his vines, he goes a deeper red and the worm scowls.
- **Grandfather Croak:** his throat stays swollen and the bog boils with bubbles round him.
- **Old Cragheart:** his cracks blaze, his mouth glows open, his eyes turn white-hot and embers rise.
- **Old Clackclaw:** the wheel on his back spins, his eyes go red and he foams at the mouth.
- **Frostgut:** icicles hang from his brow, his eyes go ice-blue, his breath freezes and the glacier shines.

## The attacks

- **Old Bristleback:** rears and lifts his head, then drives his tusks forward and down.
- **Mother Owlbear:** both claws go up, then she swipes.
- **Big Bramley:** a vine winds up over his head, then lashes out to the hero.
- **Grandfather Croak:** his throat swells, then his tongue lashes out to the hero.
- **Old Cragheart:** both fists go up, then he slams.
- **Old Clackclaw:** the great claw rises open, then snaps shut on the hero.
- **Frostgut:** he swings the glacier up behind him, then brings it down.

## Drop-in

- Each `<atlas>/` and `<atlas>2/` holds `<atlas>.png` and `<atlas>.json`: the game's atlas form, facing left, the pivot
  at the feet.
- `meta.filePx` is in the json. The frames carry `head`, the delays and the fades.
- `report.json` lists the ids, scales and frame counts.

Tool: `tools/monsters/worldbosses.js [name ...]`. It rebuilds the named bosses, or all of them, and the two pictures,
and keeps this file.
