# The art

The board scene still draws shapes and labels (2026-10-31); the first delivered piece sits in `assets/` and is not drawn
yet. This file says what art is in the game, and holds the budgets the Art Director (Perry, AD) builds to, set by me on
2026-10-31 when Perry asked, from Robin's rule that the art must stay small for the phone (Robin, 2026-10-31). Deliveries
arrive in `C:\dev\Zite\Art Director\out/<name>/` with a NOTES.md; the whole folder is copied into `assets/` and committed
here, so the game builds without the studios' folders.

## What is in the game

| Folder | What | Since | Drawn by the client? |
| --- | --- | --- | --- |
| `assets/warrior/` | the Warrior, the player's first class character: `warrior.png` (1024 by 1024, palette PNG, 98 KB) and `warrior.json` (Phaser 3 JSON hash, 23 trimmed frames, pivot at the feet, plus an `actions` block with each frame's delay, origin, bounds and head); `frames/`, `sheet.png`, `compare.png`, `screen.png`, `warrior.gif` and `build/` are for looking and making | 2026-10-31 (Robin: "go with that for now; we can get back to it later") | not yet |

The Warrior's animations (Perry, AD's NOTES.md; the names and rates go into data when he is wired in): `warrior/stand`
4 frames at 100 ms looping; `warrior/move` 6 at 100 ms looping, stride about 67 CSS px a second in a fight and 40 on the
board; `warrior/attack1` 6 at 67 ms with frames 2 and 4 held 134 ms, the blow landing on frame 4; `warrior/hit1` 1 frame
held 600 ms; `warrior/die1` 6 at 83 ms, the last three fading. Files are 2x: he stands 100 CSS px tall, drawn facing left
and flipped to face right, at 0.6 on the board; the game lays the contact shadow (an ellipse about 60 by 16 CSS px at 0.22
black). **Wiring him in** (the atlas loaded by the client, the board token and the fight sprite) waits for the camera
branch to land, since both change `BoardScene.ts`.

## What is coming

Perry, AD builds to these budgets since 2026-10-31: the packer writes the Phaser 3 JSON hash with names
`<sprite>/<action>/0001`, 2 px padding, a pivot at the feet per frame, power-of-two sides; every delivery goes through a
palette shrink. The first drops will be the **Turnip Grump** (the first monster), the **Warrior** and the **meadow's fight
kit** (one atlas of tiles and props plus three background strips, the sky left to code), after a repaint pass to a stricter
recipe; the board kit comes as one atlas plus horizon strips. **The files in the Art Director's `out/` on 2026-10-31 are
not those drops and are not to be copied**; Perry, AD messages when a drop is ready.

## Where art lives and how it reaches the phone

Art never goes through the game server. It is static files next to the client, served by the PWA host and kept on the
phone by the service worker after the first load, so a kit is downloaded once. The only sizes that matter are the first
load and what one scene holds in memory. Later areas load when the player enters them, never at start.

## Scale

The design size is 412 by 915 CSS pixels, portrait. Files are made at **2x** of design pixels; the canvas renders at 2x on
phones whose pixel ratio is 2 or more (most Android phones are 2.6 to 3), so 2x files draw one to one. No 1.5x. A "fewer
effects" switch may render at 1x on weak phones later; it needs no extra files.

## Atlases

- Always atlases, never loose PNGs: one per monster, one per class character, one for an area's board kit, one for its
  fight kit, one for UI and icons. Multi-pack only when a cap forces it.
- Format: TexturePacker "Phaser 3" JSON hash (free-tex-packer gives the same). Trimming on, rotation off, padding 2,
  extrude 1 (no bleeding when the camera zooms). Frame names `<thing>/<animation>/<nnnn>` with four digits, so the loader
  builds animations by name. Pivot at the feet (bottom centre) for every character and monster frame, so trimmed frames
  do not jump; for a board piece, the point that sits on the space.
- Sides are powers of two (512, 1024, 2048), never over 2048 by 2048. Only power-of-two textures get mipmaps, and the board
  camera zooms out to about 0.3 to show a whole island; anything else shimmers when small.
- Characters and monsters: at most 1024 by 2048 each.

## Budgets

| What | On disk | Decoded (width × height × 4 bytes, whatever the PNG does) |
| --- | --- | --- |
| One monster (about 33 frames: stand 6, move 6, hit 1, die 8, attack 12) | 300 KB | 8 MB (1024 by 2048) |
| One class character (about 25 frames) | 400 KB | 8 MB |
| One area's kit, board plus fight (about 100 pieces) | 2.5 MB, aim for 2 | board kit 16 MB; fight kit at most 2 atlases, 32 MB |
| The first load: code (Phaser is 0.4 MB compressed), the meadow kit, the Warrior, one monster, the icons | 4 MB in all, so art under 3.5 MB | |
| One scene in memory | | aim for 48 MB, hard cap 64 MB |

- No single piece over 2048 on a side. Fight backgrounds are layers, not one picture: a sky gradient drawn by code, two or
  three strips of at most 2048 by 1024 that tile or stretch, then the ground. At most 4 full-screen layers in a fight and 3
  on the board (fill rate on a middling phone).
- Sizes on screen, in design pixels (double for the files): a board token about 40 tall; in a fight the player about 160
  tall, a monster 120 to 240, a boss up to 400 (a boss may take two atlases). Board pieces are seen at 30 percent in the
  overview: strong silhouettes, little fine detail.
- Frame rates: stand and move 10 a second, attack 15, die 12, hit one frame held 150 ms. The names and rates of each
  drop's animations are in its NOTES.md and go into data here.
- PNG-8 palette where it holds up, PNG-32 where gradients band; WebP (Chrome on Android reads it) if a kit will not fit.
