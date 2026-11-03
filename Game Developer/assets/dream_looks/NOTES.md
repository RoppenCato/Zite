# How a Dream run should look: the colour matrix, palettes and an overlay

Mitch, AD, 2026-11-03, for Miles, GD's questions 5 and 6 on the Dream. My calls, from pictures, not seen in the game.

The pictures use the same maths as Phaser's ColorMatrix (`hue`, then `saturate`, then `brightness`) and its multiply tint:

- **`looks.jpg`**: six lands' fight backdrops, as they are, under `setTint` and under the colour matrix in each palette.
- **`creatures.jpg`**: five creatures the same way.
- **`gear.jpg`**: the top ranks of armour under `setTint`.
- **`overlay.jpg`**: the forest backdrop as it is, and as a Dream run with the matrix and the overlay.

## The answer

1. **Boards and fight backdrops: the colour matrix, not `setTint`.** A multiply can only darken. A green meadow under a lilac tint goes grey-olive and muddy (the second column of `looks.jpg`). The matrix turns the hue, so grass becomes lilac or teal and stays bright and clean.
   - Put one ColorMatrix on the board camera and one on the fight backdrop's layer. That is one pass each, and cheap.
2. **Creatures: the colour matrix too.** They read as new kin: a lilac goo, a teal Owlbear, a rose Frostling. Under `setTint` they only go dull.
   - Put the foe (with the backdrop) in a layer that carries the matrix, and keep the hero outside it.
3. **Worn gear: `setTint` is enough.** On the pale top ranks (Everbright, Everskin, Everweave, Crownsteel) a pastel multiply gives a clear lilac, teal, rose or gold piece. It is free, so there is no pass for each of the hero's ten or so pieces. Dark ranks (Nightskin, Starweave) barely change; that is fine, as they look dreamy already. Tint only the Dream-touched pieces, never the body.
4. **On top of the board and the fight, the Dream's overlay**:
   - **`dream_vignette.png`**: a soft white vignette, 412 by 540, full colour, not palette. Stretch it over the screen, tint it with the palette's `tint`, and draw it at alpha 0.5 to 0.6.
   - **`dream_motes`**: four small star frames. Run 15 to 20 at a time, drifting up 10 to 20 px a second with a slight sway, at scale 1 to 2 and alpha 0.5 to 0.9, tinted the palette's `tint` or `#fff6c8`. Respawn each at the bottom.

## The palettes: `palettes.json`

Apply as `hue(deg)`, then `saturate(sat, true)`, then `brightness(bright, true)`. `tint` is for the vignette, the motes and the gear.

| Id | Name | Hue | Saturate | Brightness | Tint |
| --- | --- | --- | --- | --- | --- |
| `lilac` | Lilac Dusk | 150 | -0.1 | 1.04 | `0xc8b0ff` |
| `teal` | Moonlit Teal | 45 | 0 | 0.98 | `0x9ae0e0` |
| `rose` | Rose Dream | 200 | -0.3 | 1.03 | `0xffb0d8` |
| `gold` | Golden Haze | -55 | 0.05 | 1.06 | `0xffe0a0` |
| `ember` | Ember Night | -105 | -0.1 | 0.94 | `0xffa080` |
| `frost` | Pale Frost | 80 | -0.45 | 1.08 | `0xd0e4ff` |

## Kits that take some palettes badly

Pick the run's palette from those that suit its theme:

| Theme | Good | Avoid |
| --- | --- | --- |
| Meadows | lilac, teal, rose, gold, ember | |
| Forest | lilac, teal, rose, ember | gold (olive) |
| Bogglemire | lilac, teal, rose | gold, ember (brown and murky) |
| Frostcrown, Giants' Land | all six (the Giants' Land is not pictured; it is close kin) | |
| Pirate Isles | teal, frost | lilac, rose, gold, ember: the sea and sky turn red, green or pink |
| Crownhaven, the Crown, the Rootways | lilac, teal, frost (only the city is pictured) | the pale and dark stones barely change, so the vignette and motes carry those |
| Honeyhill | lilac, teal, rose (not pictured, my guess) | gold (it already is) |

Tool: `tools/kit/dream_looks.js`.
