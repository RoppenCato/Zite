# How an asset is made: the pipeline, with the commands that work

Written by Perry, AD on 2026-10-31 with the first area (the Sunny Meadow) and the first monster (the Turnip Grump). The
Survival game's pipeline (`C:\dev\SG\Art Director\docs\pipeline.md`) is the parent; what changed is the finish (painted, not
cel), the cameras (side on for fight sprites, a touch from above for board props), and the data every frame and piece
carries (the reference library's: `docs/direction.md` sections 3 to 6). Every command runs from `C:\dev\Zite\Art Director`.

```
monsters:  tools/build/<name>_build.py -> work/<name>/source/<name>.blend -> tools/build/render.py -> work/<name>/render/*.png + meta.json
           -> tools/pack.js -> work/<name>/sheets/<name>.png + <name>.json (the atlas with every frame's origin, delay, hit box, head)
           -> sheet, scene, compare, gif -> out/<name>/
areas:     tools/<area>_kit.js (Node canvas paints the ground pieces, plates, roads, shore, cliffs, space plates, planes)
           + tools/build/props_build.py -> props_render.py (Blender, two cameras) -> tools/props_finish.js
           -> work/<area>/kit/ with kit.json -> tools/<area>_scene.js lays the two screens -> out/<area>/
```

## The look: `tools/build/toon.py`

One file every builder imports. A material only remembers its colour (`hex`); at render time `restyle()` builds its nodes:
the diffuse light as one value, through a colour ramp with eased stops so there are five soft plateaus (deep shade, shade,
base, light, highlight; the shades cooler, the lights warmer, every tone chosen from the base), a faint mottle in the fill,
a darkening toward the silhouette so round things look round, and the thin dark Freestyle line (an outer contour a little
heavier, an inner line at silhouettes, borders and where two colours meet; none on the creases of a smooth blob). The sun
points down and a little to the right and away, so the light comes from the upper left in front: tops bright, undersides
dark. Materials are unlit (emission): the colours on the sheet are the colours chosen. `flat=True` gives one tone with no
shading (eye whites, glows); `matte=True` no highlight.

The numbers (mine, 2026-10-31, from the first trial): `SUN_ENERGY 3.3` (a face square to the sun reads 1.0), `AMBIENT
(0.26, 0.27, 0.32)`, `STEPS` deep -0.24, shade -0.12, light +0.10, highlight +0.19 of lightness (the highlight was +0.24 and
the red cap's top went pastel), `MOTTLE 0.05`, `TURN 0.14`, the contour 1.35 px and the inner line 0.95 px at 1x (times the
file's 2). Changing the finish of everything means changing this file and re-rendering.

**Blender 5.2 notes:** the engine is `BLENDER_EEVEE` (EEVEE Next); Freestyle works with it; `use_auto_smooth` is gone
(shade smooth is enough); `scene.eevee.taa_render_samples` sets the samples.

## A monster

The builder makes the model from primitives (spheres, cones, boxes with a bevel), parented to empties that pose it, and
keys every action frame by frame on the timeline. No armature for a blob creature: the whole thing squashes, leans and hops
through its root empty, the crown lags through its own, the face parts scale. It leaves on the scene `clips` (a JSON of
`{action: {start, frames, delay, alpha?}}`), `head` (the part whose top is the head, or `*` for the top of the hit box)
and optionally `body` (the parts that make the hit box; otherwise every mesh not named `fx*`). The model stands on z = 0
at the origin, facing -X (screen left), a metre being our player's height; the face is turned about 58 degrees toward the
camera, as the reference's monsters cheat theirs (at 35 the eyes hung on the silhouette's edge).

```
node tools/art.js turnip copy        work/turnip/build (the builder, toon.py, render.py), before/ if the game has the sprite, NOTES.md
node tools/art.js turnip build       -> work/turnip/source/turnip.blend
node tools/art.js turnip render      -> work/turnip/render  (--quick: stand and hit1 only; --actions a,b; --keep)
node tools/art.js turnip pack        -> work/turnip/sheets/turnip.png + turnip.json
node tools/art.js turnip sheet       -> work/turnip/sheet.png (every frame, the feet on one line)
node tools/art.js turnip scene       the meadow's two screens laid again with the turnip in them
node tools/art.js turnip compare     -> work/turnip/compare.png (beside our player on the meadow's fight ground, the key poses)
node tools/art.js turnip gif         -> work/turnip/turnip.gif (every action at its real delays, on the fight ground)
node tools/art.js turnip deliver     -> out/turnip/
node tools/art.js turnip all         build, render, pack, sheet, scene, compare, gif
```

`turnip` is a key of `tools/recipes.json`: the builder, the blend, the renderer's arguments (`--size 200 --px 2 --elev 0
--ortho 2.0 --aim 0.55 --aimx -0.15`: a 200 CSS frame, 400 px in the file, side on, 2 m wide so the lunge stays inside,
centred 0.55 m up and 0.15 m toward the facing), the area and where the monster stands in the area's fight picture. A new
monster is a new key and a new builder. The frame's size does not reach the game: the packer trims every frame.

**The renderer** (`tools/build/render.py`) renders every frame of every action and writes `meta.json` with, per frame, the
origin (where the world origin lands: the feet), the delay, the hit box (the body's bounds) and the head, in the render's
pixels. **The packer** (`tools/pack.js`) hardens each frame's edge (fully opaque, hard edges), trims it to its painted pixels
with one pixel of air, packs an atlas, and writes `<name>.json` in Phaser's atlas form with an `actions` block: for every
frame its `name`, `w`, `h`, `origin` (in the frame's own pixels), `delay`, `lt`, `rb` and `head` relative to the origin, and
`a0`, `a1` where the action fades. Loops: `stand`, `move`, `fly`. The game draws the file at half size.

A full render of the Turnip Grump's 33 frames takes about two minutes; the atlas is about 1 MB at 2x before any
optimising (a `pngquant` pass would halve it; not done yet).

## An area

1. **Paint the pieces in code:** `node tools/meadow_kit.js` writes `work/meadow/kit/`: `tiles/` (the fight grid's pieces,
   276 by 184: `bsc` 6, `enH0` 3, `enH1` 3, `enV0` 2, `enV1` 2, `edU` left and right, `edD` left and right, the four slopes),
   `background/` (the planes), `board/` (plates, plateau plates, patches, `road_<NESW mask>`, the bridges, `shore_<water
   sides>`, the cliff pieces, the space plate, the lit ring, the kind discs), `horizon/` (the board's sky, clouds, sea,
   islands), `kit.json`, and `_check/` (the 3 by 3 seam checks). Seamless pieces are painted with every brush drawn at the
   wrapped offsets too, and the strokes near an edge come from one shared seed, so every variant meets every other.
2. **Build and render the props in Blender:**
   ```
   node tools/blender.js tools/build/props_build.py -- work/meadow/props/props.blend
   node tools/blender.js tools/build/props_render.py -- work/meadow/props/props.blend work/meadow/props/render
   ```
   One collection per prop; each rendered side on (`side`, elevation 0, for the fight kit) and a touch from above
   (`board`, elevation 30, for the board kit) at `--boardscale 0.6` of the fight's scale (the board's camera is pulled back;
   the mock-up had the same ratio). About a minute for eleven props.
3. **Finish the props into the kit:** `node tools/props_finish.js` trims, hardens, lays a soft contact shadow at the foot
   (without one a piece sits on the ground like a sticker) and writes `objects/fight/<name>.png` and
   `objects/board/<name>.png` into the kit with `origin` (the centre), `foot` (the base, for the board's depth sort), `layer`
   and `z`. Run it after the kit painter, which rewrites `kit.json` from scratch.
4. **Lay the two screens:** `node tools/meadow_scene.js [--monster out/turnip/turnip.json]` writes `work/meadow/fight.png`
   and `board.png` at phone size (824 by 1830 in the file) from the kit's own files, and `fight-layers.tsv` for the preview.
5. **Preview the planes panning** (from `C:\dev\MapleStoryPlus`; it reads our files where they are):
   ```
   python Settings/Scripts/Preview-Parallax.py --layers "C:/dev/Zite/Art Director/work/meadow/fight-layers.tsv" --span 3000 --width 824 --height 1830 --out "C:/dev/Zite/Art Director/work/meadow/preview"
   ```
   `parallax.png` is the left, middle and right of the span; `parallax.gif` pans. The ground is not drawn there.
6. **Deliver:** `node tools/deliver_area.js meadow` copies `work/meadow/kit/` (without `_check/`) to `out/meadow/` with the
   two screens, the preview and `NOTES.md`.

## The second pass (2026-10-31, after Colin, AD's review and Miles, GD's budgets)

- **The recipe** is `docs/recipe.md`; the brushes in `tools/brush.js` follow it (`crown`, `trunk`, `clods`, `grass`, `rock`,
  `tuft`, `flower`, `pole`, `dome`, `cloud`, `meadow`), with one `ink` for everything near.
- **Measure first:** `node tools/measure.js <pic.png> name=x,y,w,h ...` gives the dark share, saturation and lightness of
  any rectangle. The reference's crops are read where they are; nothing is copied.
- **One slice before a kit:** `node tools/slice.js` paints one fight slice straight with the brushes (one tree, one bush,
  the ground, our player and the Turnip Grump) into `work/slice/slice.png`; measure it against the reference before
  repainting anything else.
- **The player is painted 2D parts on Colin, AD's rig (the puppet, 2026-10-31 night):** `node tools/blender.js tools/build/warrior_vol.py -- work/puppet all --variant A --skeleton work/puppet/skeleton.json` writes the joints of every frame, `node tools/hero_puppet.js work/puppet/skeleton.json work/puppet/paint` paints the parts between them, `node tools/smear.js work/puppet/paint --frames 2,3` adds the strike trail, then pack, slice --player, compare and anim_gif as below. The earlier hand-posed version: `node tools/hero_paint.js` paints the Warrior's stand (head, hair, face, body, legs,
  arms, sword as separate functions, so a rig moves them later) and writes a `meta.json` the packer reads; `node
  tools/pack.js warrior work/hero/paint work/warrior/sheets` makes its atlas, and `tools/player.js` draws it in every
  picture from then on. The Blender ways (`warrior_build.py` on primitives, `hero_skin_build.py` on `skin.py`) are kept as
  the record of the two-ways board.
- **The packer writes Miles, GD's form:** names `<sprite>/<action>/0001`, 2 px padding, a pivot at the feet per frame,
  power-of-two sides up to 1024 by 2048 (`tools/pack.js`); the loose frames in `frames/` are named `<action>_0001.png`.
- **Shrink before delivery:** `python tools/shrink.py out/<name>` turns every PNG into a 255-colour palette PNG with its
  transparency (the Turnip Grump's atlas: 1.3 MB to 196 KB). Run it on `out/`, never on `work/`.

## A monster painted in code (2026-10-31, the three meadow monsters)

A blob creature needs no rig: `tools/monsters/<name>.js` exports its size, origin and actions as lists of poses (a few numbers
each: squash, lean, lift, part angles, the face's mood, loose pieces) and a `draw(g, pose)` in the painted hand (brush.js
tones, the one ink line). `node tools/monster_paint.js <name>` paints every frame with its data into `work/<name>/paint`;
then `pack.js`, `sheet.js`, `slice.js --monster <atlas.json>`, `compare.js`, `anim_gif.js` as for the hero, and
`tools/shrink.py out/<name>`. `slice.js --empty true` paints the stage with no fighters, for pages and gifs that draw them.

## Looking

- `node tools/look.js <out.png> [--bg #hex|file.png] [--zoom 2] <pic.png> ...`: pictures on a ground line beside our player at
  phone size and at a zoom (the first check of any render).
- `node tools/board.js <dir> <out.jpg> [columns] [cell]`: a contact sheet of a folder.
- `node tools/concepts.js <out.png> "<title>" <pic> "<caption>" ...`: a concept board beside our player.
- `python tools/gif.py spec.json out.gif`: frames at real delays (PIL is the one image library this Python has).
- `tools/player.js` is our player drawn in code (100 CSS px tall, the mock-ups' figure), for scale only; never delivered.

## What the trial taught (2026-10-31)

- Judge at phone size: the test blob's highlight looked fine at 2x and pastel at 1x.
- The board needs its own scale (0.6 of the fight's): at the fight's scale a house filled a third of the board screen.
- A road piece on the tilted ground: 40 px wide along the depth, 26 tall across it (the tilt halves the near-far axis).
- The face of a side-on monster must be cheated toward the camera, about 58 degrees, or the eyes sit on the edge.
- A flattened ball used as an eye, a brow or a mouth must have its thin axis along the face's normal: the part's Euler Z
  is the face angle plus pi (so its local x points into the face), and its slant goes in Euler X, which Blender applies
  first. With the sign wrong the eyes stood out of the face like eggs and ballooned on `hit1`.
- Popped eyes on `hit1` need spreading as well as enlarging, or they overlap.
- A lunge or a knock-back can leave the render frame: give the frame room on the facing side (`--aimx`).
- Read the origin's pixel only after a view-layer update: a camera just made still has an identity transform, and the
  first packs put the feet 55 CSS px too low (seen in the compare picture, where the feet were not on our player's line).
  `--keep 1` recomputes the data without re-rendering.
- `@napi-rs/canvas` reads straight (unpremultiplied) pixels: the edge hardening in `paint.js` rescales colour by alpha,
  which is right for an opaque figure over a dark line and leaves no fringe on the renders so far.

## The fresh Warrior doll (2026-11-01)

The playable character is studied from the client, since the library holds only monsters and maps. The study export lives
in my scratch folder, never the repo (both repositories are public): `Export-Character.ps1` reads `Client/MapleStory/Character.wz`
with MapleLib (`Tools/HaRepacker-4.1.0/AnyCPU/MapleLib.dll`) the way `Settings/Scripts/Export-Inspiration.ps1` does, saving
each part's picture once and `parts.json` (per part, action and frame: delay, every canvas with its z, origin and map
points); `assemble.js <parts>` builds whole frames the game's way (body at the feet, arm on the navel, head on the neck,
face and hair on the brow, weapon in the hand, the zmap's order) into a 4x sheet; `measure_ref.js` prints the joints,
stride and sword angle per frame. If the scratch folder is gone, they are quick to rewrite from this description.

The doll itself:

    node tools/doll.js work/doll/paint --sheet work/doll/sheet.png      # the frames and meta.json from the pose dictionaries
    node tools/smear.js work/doll/paint --action attack1 --frames 2,3    # the strike's trail on the two cut frames
    node tools/pack.js warrior work/doll/paint work/doll/sheets           # the atlas (1024 by 2048 before shrinking)
    node tools/slice.js --player work/doll/sheets/warrior.json --monster out/bramble/bramble.json --out work/doll/screen.png
    node tools/slice.js --empty true --out work/doll/stage.png            # the stage alone, for the moving page

Judge on the phone screen, in the before/after (`work/doll/compare.png`), and head to head beside the reference at the same
height (scratch only). The page is the vector page's with the new atlas.
