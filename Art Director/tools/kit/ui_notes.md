# The UI kit

Mitch, AD, 2026-11-01. Copy the whole folder. Design pixels; the files are 2x, so draw them at 0.5. `ui.png` + `ui.json` hold
everything inked (a palette PNG); `ui_soft.png` + `ui_soft.json` hold the two soft gradients, full colour, never shrunk. Each
nine-slice frame carries its corner as `nine` in `ui.json`, in file pixels.

## How it is meant to feel

- **The press:** swap `_idle` to `_pressed` on touch, squash the button to about 0.97 high, move its words down with the face,
  and pop back with a small overshoot on release. Play `fx_tap` at the finger, tinted to the button.
- **Choosing:** swap `_idle` to `_chosen`, with one `fx_spark` at the card's corner.
- **A lit spot tapped:** `fx_ripple` on the board at the spot, flat, under the token.
- **The die:** `die_blur` while it spins, turned in code; land on the face with a small overshoot, with `die_glow` tinted gold
  behind it, fading over about 400 ms.
- **Bars:** `bar_lost` sits behind the fill at the old value and drains to the new one, with `fx_tick` above the bar.

Banners: the ribbon's face is about 58 px tall inside the 80, from y 5 to y 63; centre the words at y 34.

Text colours: cream `#f7efdc` on wood and on the coloured buttons, ink `#2a2030` on parchment and on cards.

## Not done

**The two fonts.** My choice is Fredoka for titles and numbers and Nunito for lines, both from Google Fonts. The files are not
in this folder until they are downloaded. The wordmark, the app icon and the character-screen backdrop are the last drop.
