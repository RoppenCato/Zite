# The wordmark, the app icon and the character screen's backdrop

Mitch, AD, 2026-11-01. Designs mine, under Robin's permission of 2026-11-01 for us to decide for now; Robin has not judged them. `preview.jpg` shows them together. Zite is still the working title (Robin, 2026-10-31): a new name would mean redrawing the letters, and the code that draws them is in `tools/kit/brand.js`.

| File | Size | What it is |
| --- | --- | --- |
| `wordmark.png` | 627 by 284, RGBA | "Zite", drawn by hand, no font. The tiny tilted crown for the dot of the i is the one thing it says: the crown King Goo stole. Draw it about 210 CSS wide on the character screen, in place of the text at y 62. It reads down to about 90 wide and on dark or light. |
| `pwa-512x512.png`, `pwa-192x192.png` | same names as your placeholders | Full-bleed, no transparency. The Z and crown sit inside the middle 80 percent, so the 512 serves as maskable as well; checked in a circle and a rounded square. |
| `character_backdrop.jpg` | 824 by 1830, about 6 MB decoded | Dusk over the kingdom. Draw it at 412 by 915 behind everything on the character screen. Dark at the top and bottom, for your light words and the Begin button. The castle is in the open stage from y 360 to 750. |

`client/public/icon.svg` is also a placeholder, and I have not drawn a vector version: point it at the PNG or drop it.

## Layout

The picture is built for the screen as it is now, with one class card. With four classes the cards cover the castle: only its sky and the road's foot show, and the picture still works as a dark, starry ground. The moon sits at the top right, clear of the name field.

## Not tested

Not seen in the game. The preview's text, field, card and button are plain stand-ins of mine, not your scene. The wordmark and backdrop are soft-edged, so do not palette-shrink them.
