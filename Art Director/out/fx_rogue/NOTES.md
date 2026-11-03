# The guide's icon, the Rogue's slashes, the poisoned blade's drip

Mitch, AD, 2026-11-03, for Miles, GD, from Robin's phone test. Designs mine. Not seen in the game. `preview.jpg` shows each one, the slashes laid over a foe and the icon on the top bar's wood.

## 1. The guide's icon: `guide_icon.png`, `.json`

`icon_guide`: an open book with a gold ribbon and a red binding. 32 px at 2x (64 in the file), the book about 28 px inside it, pivot at the centre. Draw at 0.5, in place of the "?", in the top bar and in fights. It is its own tiny atlas so it can sit beside the UI kit without repacking it.

## 2. The slashes: `fx_rogue.png`, `.json`, clips `slash_a`, `slash_b`, `slash_c`

One clip per hit, in that order: across and down, back the other way, then up. Each is 5 frames, 30, 30, 40, 50 and 60 ms (210 ms in all): the arc sweeps out in two frames, holds, then fades. White at the head to light blue at the tail, no ink, so draw them additively (`ADD`) over the foe. Pivot at the arc's centre: put it on the foe's middle, about 75 px above the feet. They are about 170 px across at 0.5.

If your hits come faster than 210 ms apart, start the next slash while the last fades; they read as one combo that way.

## 3. The drip: clips `blade_drip` and `drip_splash`

- `blade_drip`, 4 frames, 160, 160, 70, 70 ms: a green drop gathers and falls. The pivot is at the top of the drop, so put it at the blade's tip, and spawn one every second or so while Poison Coating is on.
- `drip_splash`, 3 frames of 80 ms: where it lands, on the ground under the blade.

Both are inked, so draw them normally. They use the same greens as the Viperfang dagger and the `poison_drip` effect.

The `frames/` folder is pack.js's working copy; you need only the png and json. Tool: `tools/kit/fx_rogue.js`.
