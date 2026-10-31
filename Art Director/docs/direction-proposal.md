# The art direction: three proposals for Robin

Perry, AD, 2026-10-31. **Waiting for Robin's pick.** Nothing is drawn for the game until he has picked; then `docs/direction.md`
(the sentence, the rules, the numbers, the check) and `docs/pipeline.md` (the exact commands) are written from his choice.

What is decided (Robin, 2026-10-31): 2D, a MapleStory-like look, fast and snappy above everything, phone first (Android first,
iOS later), a big beautiful generated world map that is the thing the player looks at most, a fight background for every area,
four classes chosen at character creation that must feel different to play. He let the studio propose the direction.

**The pictures** are in `docs/pictures/direction/`: `A-sunny-cel.png`, `B-ink-and-paper.png`, `C-pixel.png`, and the three
side by side in `compare-maps.png` and `compare-fights.png`. They are mock-ups drawn in code (`tools/direction_mock.js`) with
no assets at all: they show the palette, the line, the shapes and the layout at phone size (412 by 915 CSS pixels, drawn at
2x), not finished art. The same board is in all three: fourteen spaces up the screen, the hero on the third, a roll of three
open, and the same fight against a slime, so only the direction differs.

## What is the same whatever Robin picks

- **The phone sets the sizes.** The design size is 412 by 915 CSS pixels (a common Android), assets drawn at 2x (824 pixels
  wide) and scaled to fit whatever phone; the browser gets the same screen, centred. Buttons at least 48 pixels tall; text at
  least 14. The sizes table is at the end.
- **The map is a board of pieces**: region plates, roads, spaces, town and landmark stamps, trees and rocks as set pieces,
  laid out by the generator. Never one painting.
- **Two facings** for anything that walks (one rendered, flipped for the other).
- **Budgets** (first numbers, mine): a class's sheets at most 1 MB, a monster 400 KB, a fight background 500 KB (two or
  three parallax layers), a region's map pieces 1 MB, the first load 4 MB; two or three texture atlases of 2048 by 2048 on
  screen at once (some Android GPUs stop at 4096); 60 fps on a middling phone, measured with the game's frame log.
- **The readability tests** of `docs/techniques.md` section 1 on everything: the silhouette at a quarter size, grayscale,
  the three reads (far: shape; middle: colour blocks; close: detail only on the face and the gear).

## A. Sunny cel

**The sentence:** *A bright fantasy world in thick ink and two-tone colour: chibi heroes, round monsters, cheerful by day;
MapleStory's mood without MapleStory's pixels.*

- **The look.** A warm dark outline, 3 pixels at 1x, heavier than the Survival game's; two tones per shape (the base and a
  cooler shadow) and one small highlight; saturated but few colours: one key per region and one accent that may burn (the
  hero's hair, a fire, a boss's eyes). Figures chibi, about two and a half heads tall, so the face and the gear read at a
  hundred pixels. Monsters are one or two big shapes with a face. The interface is cream panels with the same outline,
  rounded and chunky; the die and the Roll button are objects, not widgets.
- **The map.** Painted ground in the region's key (meadow green, deep forest green, desert ochre, snow blue-white), round
  trees and rocks as set pieces with a cast shadow, a road of spaces with icons, the hero as his own token. Regions differ
  by key colour, ground shape and set pieces.
- **The fight backgrounds.** Three layers per region (sky and far hills, the mid trees, the ground band), in the region's
  key, the fighters on the band. The monsters are big; the hero is a third of the screen.
- **The characters.** One body, four classes as layered gear and a weapon (the Survival game's `people_build` pattern), a
  Blender model each, cel-rendered, two facings. Clips: idle, walk, attack, skill, hit, death, win: about seven clips of
  eight frames, 56 frames at 160 by 160 at 2x, which fits one atlas with room to spare; about 600 KB a class. A monster:
  four clips, about 30 frames, 200 to 300 KB.
- **The pipeline: the Survival game's, turned sideways.** Scripted Blender models (reproducible, never hand-edited),
  `toon.py` re-tuned for this look (the thicker line, brighter bases, the sun at 3.0 so every figure has a lit side), the
  renderer with two directions instead of eight (a quarter of the frames), the same packer; set pieces rendered in Blender
  and finished in Node; the map, the panels and the interface drawn in code from pieces. The studio runs this today. What
  changes is the look file and the camera (side on, a few degrees above). Costs: a monster about an hour of studio work and
  under a minute of rendering (0.3 s a frame); a class an afternoon; a region's set pieces a day.
- **Risks.** Cel-shaded models read as "3D pretending" when their shapes are not simplified: the Survival game's doll
  lesson. Figures must be built as a few big volumes, not many small parts. The thick line and the chibi proportions must be
  judged on a real phone before the first batch.

## B. Ink and paper

**The sentence:** *The world is a board game on a wooden table: a parchment map drawn in ink, hexagon spaces, standees and
cards; one red wax accent.*

- **The look.** An ink line of 1.6 pixels, paper fills with grain, washes in two or three paper tones, one accent (wax red)
  and one second colour (teal); serif type; everything flat; depth from the drop shadows of paper pieces and the wooden
  table. The interface is the table: tokens, stamps, cards, a wax seal to roll.
- **The map.** A region is a sheet of parchment with its own tint and ink motifs (hatched hills, lollipop trees, waves,
  dunes); spaces are hexes; towns are stamps; the hero is a standee on a wooden base. The generator lays sheets, paths and
  stamps, which it does well.
- **The fights.** On the table: the monster is an illustrated card, the hero a standee, attacks are cards played; damage is
  red ink. A boss is a bigger card and a darker mat.
- **The characters.** No walk cycles: a standee hops, squashes and flips by tween; a card turns. Classes differ by the
  standee's picture, the card back and the ink colour of their skills. That is why it is cheap, and also why it is less alive.
- **The pipeline.** Drawn in code: Phaser graphics at runtime or PNG pieces pre-rendered from Node canvas, plus a handful of
  ink illustrations as PNGs (monster cards, standees, stamps). Those come from Blender's line render (Freestyle only, no
  fill), which makes a real ink drawing of a model, or are drawn in code. No sprite sheets to speak of (a monster card under
  50 KB). The cheapest on a phone, the most consistent, the easiest for the generator, the quickest to make.
- **Risks.** It is the furthest from "MapleStory-like". A tabletop can feel cold, and the signature moves (a Mage's charged
  blast, a Rogue's chain of crits) have to be sold with card motion and ink splashes instead of a figure doing them.

## C. Pixel handheld

**The sentence:** *A 16-bit handheld RPG: small crisp sprites, dithered ground, chunky menus; the game you played on the bus.*

- **The look.** A pixel grid at a quarter of the CSS size (103 by 229 pixels, scaled 4x on the phone), a palette of about
  32 colours, one-pixel dark outlines, dithering for shade; the hero 8 by 11 pixels on the map and 24 by 33 in a fight.
- **The map.** Eight-pixel tiles of ground kinds, path tiles, tree stamps, spaces as tiles with a coloured face.
- **The fights.** Banded backgrounds in a region's palette, sprites at 3x the map size.
- **The pipeline.** Either Blender renders downscaled to a quarter and quantised to the palette (reproducible, the studio
  can run it, and how several modern pixel games are made), or hand-made pixel art in Aseprite, which needs a pixel artist's
  hand the studio does not have. Sheets of 30 to 60 KB a character.
- **Risks.** Scaling. The pixels are crisp only at whole-number zooms, and phones come in every width: the game must
  letterbox or accept uneven pixels. The least MapleStory of the three. Small sprites hide the gear that tells the classes
  apart. Text needs a pixel font.

## The sizes (all directions, in CSS pixels; assets at 2x)

| Thing | On screen | In the asset (2x) |
| --- | --- | --- |
| The phone | 412 by 915 | 824 by 1830 |
| The hero on the map | 44 tall | 88 |
| The hero in a fight | 110 tall | 220 |
| A monster | 90 to 160 tall | 180 to 320 |
| A boss | up to 300 tall | 600 |
| A space | 30 to 38 across | 60 to 76 |
| A map tile or plate unit | 64 | 128 |
| A button | 182 by 72 | 364 by 144 |
| Text | 14 and up | |

## My recommendation (mine, 2026-10-31)

**A, Sunny cel, with the map built the way B builds it.** The map as a board of pieces (plates, roads, spaces, stamps) in
A's bright palette and thick line, so the generator has parts to lay and the map still looks painted. Why A: it is the
closest to what Robin asked for; the studio already has the pipeline and the hard-won lessons; two facings make it cheap
enough for a phone; the four classes show in the figure itself, which is where "feel different to play" is seen. B is the
fallback if the frame rate or the sheet budgets bite on a real phone, or if Robin wants something nobody else has. C only if
Robin loves it, because the scaling problem is real on phones of every width.

**For Robin to decide:** A, B or C, or a mix; the sentence; chibi (two and a half heads) or taller figures (four heads); the
first region's key colour. Then `docs/direction.md` and `docs/pipeline.md` follow, and the first real asset is the hero of one
class, judged on Robin's phone.
