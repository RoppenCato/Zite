# The art

The board scene still draws shapes and labels (2026-10-31); four pieces of scrapped art sit in `assets/` as stand-ins and are
not drawn yet. This file says what art is in the game, and holds the budgets the Art Director (Perry, AD) builds to, set by me on
2026-10-31 when Perry asked, from Robin's rule that the art must stay small for the phone (Robin, 2026-10-31). Deliveries
arrive in `C:\dev\Zite\Art Director\out/<name>/` with a NOTES.md; the whole folder is copied into `assets/` and committed
here, so the game builds without the studios' folders. **What the game needs drawn, and in what order, is `docs/art-demands.md`.**

## What is in the game

| Folder | What | Since | Drawn by the client? |
| --- | --- | --- | --- |
| `assets/warrior/` | the Warrior, the player's first class character: `warrior.png` (1024 by 1024, palette PNG, 98 KB) and `warrior.json` (Phaser 3 JSON hash, 23 trimmed frames, pivot at the feet, plus an `actions` block with each frame's delay, origin, bounds and head); `frames/`, `sheet.png`, `compare.png`, `screen.png`, `warrior.gif` and `build/` are for looking and making | 2026-10-31 (Robin: "go with that for now; we can get back to it later") | not yet; scrapped art (Robin, 2026-11-01), kept as a stand-in until the new art lands |
| `assets/puffwort/` | the Puffwort, a meadow monster that hops: `puffwort.png` (1024 by 2048, 158 KB), `puffwort.json`, 33 frames | 2026-10-31 | not yet; scrapped art (Robin, 2026-11-01), kept as a stand-in until the new art lands |
| `assets/bumble/` | the Honey Bumble, a meadow monster that flies: it hovers about 50 CSS px above its origin, which stays on the ground: `bumble.png` (1024 by 1024, 103 KB), `bumble.json`, 33 frames | 2026-10-31 | not yet; scrapped art (Robin, 2026-11-01), kept as a stand-in until the new art lands |
| `assets/bramble/` | the Bramble Bun, a meadow monster that rolls: `bramble.png` (1024 by 2048, 134 KB), `bramble.json`, 33 frames | 2026-10-31 | not yet; scrapped art (Robin, 2026-11-01), kept as a stand-in until the new art lands |

The three monsters share one form (Perry, AD's NOTES.md in each folder): `<name>/stand` 6 frames at 100 ms looping,
`<name>/move` 6 at 100 ms looping, `<name>/hit1` 1 frame held 600 ms, `<name>/die1` 8 at 83 ms with the last three fading,
`<name>/attack1` 12 at 67 ms with frames 4 and 7 held 134 ms (4 and 8 for the Bramble Bun); the blow lands on the second
held frame. Drawn facing left, toward the player; `flipX` to face right; 2x files at half size; `stand` at 0.6 on the board;
the game lays the shadow. Each folder also carries the loose frames, sheets, a gif and the build scripts, for looking and
making.

The Warrior's animations (Perry, AD's NOTES.md; the names and rates go into data when he is wired in): `warrior/stand`
4 frames at 100 ms looping; `warrior/move` 6 at 100 ms looping, stride about 67 CSS px a second in a fight and 40 on the
board; `warrior/attack1` 6 at 67 ms with frames 2 and 4 held 134 ms, the blow landing on frame 4; `warrior/hit1` 1 frame
held 600 ms; `warrior/die1` 6 at 83 ms, the last three fading. Files are 2x: he stands 100 CSS px tall, drawn facing left
and flipped to face right, at 0.6 on the board; the game lays the contact shadow (an ellipse about 60 by 16 CSS px at 0.22
black). **Wiring him in** (the atlas loaded by the client, the board token and the fight sprite) goes ahead with these files as
stand-ins: the new art replaces the files, not the code, since the atlas form is unchanged.

## The art starts again (Robin, 2026-11-01)

Robin scrapped the whole art direction on 2026-11-01 and kept the shell: the board from a raised camera, side-view
fights, areas as kits of data, these budgets and the atlas form. Everything drawn under the old direction is gone from the
studio (the Turnip Grump and the meadow kits are not coming); the four pieces copied here stay as stand-ins. The new art
session starts from `C:devZiteArt DirectorHANDOVER.md`, which has three example pictures of the look Robin wants
(lush painted environments with depth, chunky friendly shapes, characters small against the scene). **The player's height
is to be reconfirmed with Robin**: 100 CSS px was Perry, AD's number with mine; Robin's own sheet stood 118 and he liked
its presence. What the game needs, in order, is `docs/art-demands.md`.

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
