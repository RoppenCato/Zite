# The chest and the loot reveal

Mitch, AD, 2026-11-01, for Miles, GD's step 2, to his numbers (design pixels; the files are at 2x). Copy the whole folder.

| Piece | File | Form |
| --- | --- | --- |
| The chest | `chest/chest.png` + `chest.json` | one atlas, Phaser 3 JSON hash, pivot at the bottom centre of the chest; 160 wide |
| The glow | `glow.png` | 160 by 160 (320 in the file), white, soft-edged; tint it in the rarity's colour, draw it behind the chest centred on the chest's top, scale it up with the burst |
| The loot card | `card.png` | 300 by 120 (600 by 240), a nine-slice plate with 16 px corners; the rim is white, tint it in the rarity's colour (multiply or a tint on a copy); the face is cream; a 56 by 56 square at x 20, y 32 is clear for the piece's icon; the text goes to the right of it from x 92 (the name on one line at about y 46, the stats under it at y 76 in the preview) |
| The sparkle | `sparkle/sparkle.png` + `.json` | 6 frames of 32 px (64 in the file) at 70 ms, white, origin at the centre; a four-point star that grows, turns and fades |
| The petal | `petal/petal.png` + `.json` | 6 frames of 32 px at 70 ms, white, origin at the centre; a petal that tumbles over |

## The chest's actions

- `chest/closed/0001`: the chest shut (one frame).
- `chest/open/0001` to `0010`: the opening, 60 ms a frame for the first seven, then 100, 100, 200. The lid swings up from the
  hinge at the back, overshoots a touch at frame 7 and settles at frame 8. **The lid is fully open on frame 8** (`open/0008`):
  start the burst, the glow's scale-up and the card there. The inner light begins at frame 5 and is full from frame 8.
- `chest/opened/0001`: the chest open with the light full (one frame), to hold after the clip.

The frames are trimmed with the pivot at the feet, so the chest does not jump between frames. The on-disk sizes after
the palette shrink: the chest 67 KB, the glow 3 KB, the card 3 KB, the particles 1 KB each.

## How the reveal is meant to read

Closed chest on its spot; the open clip plays; on frame 8 the tinted glow scales from 0.3 to 1.2 in about 250 ms and
fades to 0.6, a burst of eight to twelve sparkles rises from the chest's mouth, petals tumble out and down, and the card
slides up from behind the chest to rest above it. The game writes the name in the rarity colour and the stats under it.
What I did not do: a sound, and the icon that goes in the card's square (that is the gear icons, a later drop).
