> Carried over from the Survival game's art studio (C:\dev\SG\Art Director) on 2026-10-31. Section 1 (readability) holds for any sprite on a phone; sections 2 to 4 matter if Blender is the pipeline; sections 5 and 6 are that game's. Perry, AD.

# Techniques: what the guides and the forums teach, checked against our pipeline

Robin, 2026-10-13: *look online for Blender guides and 2D graphic guides similar to what we are doing; learn best practices and
useful tips; search Reddit too.* **Reddit could not be read**: it blocks both the search tool and the studio's browser, so the
practitioner threads below are from Blender Artists, Polycount, Blender Stack Exchange and the Klei forums. Each item says where
it came from, and what it means for us (marked **Ours:**). Things I add from my own knowledge are marked as such.

## 1. Readability (what makes a sprite read in a game)

From the Dota 2 character art guide (Valve; the standard everyone cites), RocketBrush's shape-language article, and the Bugnet
piece on readable game art:

- **Silhouette first.** A character must be identifiable at a glance, and the silhouette must show which way it faces. Role
  shows in shape: wide and blocky with a low centre for the heavy, sharp and leaning for the fast, round and upright for the
  gentle. If a thing only reads by its colour, its shape is too weak.
- **The three reads.** Far: the silhouette alone (icon scale). Middle: the big colour blocks (squint distance). Close: detail,
  only where it strengthens the first two. Detail is a spending decision; spend it where the eye should go (for us: the face,
  the gear, the one thing of the beast).
- **Value gradient.** The Dota guide's rule (as commonly summarised; I could not open the PDF here): lightest values high on the
  body, toward the face and the hands; darker toward the feet, so the figure stands on the ground and the eye goes to the head.
  Saturation belongs to the focal point; the rest sits muted.
- **States change shape, not just colour.** A charging enemy shifts its outline (wind-up, scale, spikes), because shape reads
  through chaos and tint does not. **Ours:** the boar's windup drops the head and scrapes; the bear rears; the Gape's lid lifts.
  Every windup should be a different silhouette from the walk at quarter size.
- **Tests:** grayscale (does it still read?), distance (shrink to a quarter), motion (play the clip), low light (the night
  scene), blockout (the roles distinct before any detail), and compare the finished model back to the first silhouette to
  catch over-complication.
- **Value is most readability problems.** A background in the same mid-tones as the actors swallows them; push the background
  back in value and saturation first. **Ours:** the day island is a mid green; the beasts' base colours sit close to it in
  value (the boar especially). A lit side (the sun fix) separates them more than any outline.
- The "70 percent silhouette, 30 percent detail" rule of thumb goes round; nobody sources it. Treat it as folklore that
  happens to be right.

## 2. Rendering sprites from Blender

From Blender Artists ("Quality of rendered sprites (2.8)", "2D sprites with 3D Blender?"), Polycount ("Pre-rendered
character sprites with changing weapons and gear", "sprites from 3d art", "Convincing 3D that looks like 2D"), the Pre Render
Creator and Sprite Render Kit add-on notes, and GameFromScratch's sprite tutorial:

- **One fixed light rig in the world; turn the model, not the sun.** Then the lit side is always the same side of the frame
  whatever the character faces, as a drawn sprite's would be. **Ours:** `render.py` turns the rig under the sun; right.
- **Small, hard lights.** Big soft lights wash out the forms; a sun with angle 0 gives the hard cel step. **Ours:** right,
  except the sun is too weak to step at all (`docs/pipeline.md`, fault 1).
- **Render larger, scale down with a smooth filter.** The thread found a pixel filter width of about 0.7 to 1.0 sharper than
  1.4; linear resampling on the way down. **Ours:** rendered at 2x, halved with a smooth filter, filter size 1.2: worth a
  test at 0.9 to see if the line crispens without aliasing.
- **Outlines: the silhouette in ink.** The forum's post-process (select transparent, shrink by one pixel, fill with the line
  colour) is exactly what the game's prop packer does with the silhouette offsets, heavy toward the lower right; Freestyle
  does it in the render for the models. Keep the two at the same weight at game scale (the inventory notes the models' line is
  heavier and more even than the props'). Freestyle's relative thickness keeps weight steady if a model is ever rendered at
  another size; keep the crease angle the same for every model so inner lines match.
- **Layers by mattes.** Render the body as an invisible occluder and the weapon normally, so the game stacks body and weapon;
  the biggest problem is hand placement differing per weapon. **Ours:** the holdout material in `render.py` is this. The
  thread's further trick, **separate passes for legs and upper body**, halves the frames when many upper-body clips share
  one walk: an option for the people if their sheets grow again.
- **Fewer frames where nobody looks.** Add-ons ship a "frames reducer": the idle at a low rate, the hit at few frames.
  **Ours:** the moose's 16-frame idle in eight directions is a third of its 17 MB; 8 frames at 4 fps would read the same.
- **PNG for soft alpha; a PNG optimiser after.** Never JPEG between steps.
- **Normal maps rendered beside the colour** are what let Dead Cells and Graveyard Keeper light sprites by a moving light at
  run time. Free from Blender, useless on a 2D canvas without shaders: noted in the game's `docs/lighting.md` as the first
  thing to do if drawing ever moves to WebGL.
- **A good 3D model is not a good sprite** (a pixel artist on Polycount): the sprite needs a darker tone of its own colour at
  the edge instead of black, fewer colours, flatter planes. **Ours:** the warm brown-black line, two tones plus grain, is this.
- **BlazBlue's hybrid** (pose a 3D model, trace a 2D line from it, shade by hand) is the other road: more character, no
  reproducibility. Not ours while everything must be rebuilt from scripts.

## 3. The hand-drawn look in Blender (NPR)

From the Blender Artists NPR threads, the Blender Nation EEVEE NPR note, the NPR Shader Kit documentation, and the Blender
manual on Freestyle:

- **Shader to RGB, then a constant Color Ramp** is the standard cel: the diffuse value quantised into two or three bands, the
  shadow band its own colour (ours: the base times the scene's cool blue), never the base darkened. **Ours:** `toon.py` does
  it with math nodes; same thing. Shader to RGB is EEVEE only; never Cycles.
- **Watercolour:** noise in the light value so the band's edge is uneven; a mottle multiplied into the fill; pigment pooling
  at the edges by a Layer Weight; a paper texture over the composite. **Ours:** the `painted` style in `toon.py` has all four;
  Robin chose cel. The mottle at low strength could still go into the cel fill as the "grain in every fill" rule asks (we
  use fine noise; a second, larger mottle at 3 percent would read more like paper).
- **Outlines:** Freestyle (view-dependent, calligraphy modifier for thick-thin, round caps, chaining) or an **inverted hull**
  (a Solidify modifier with negative thickness, backface culling, an emission material; 0.01 to 0.03 thick for most assets).
  The hull is cheap and never misses an edge but has no thick-thin; Freestyle gives the ink weight. **Ours:** Freestyle with
  calligraphy at 45 degrees. A hull under Freestyle would give a guaranteed closed silhouette where Freestyle sometimes breaks
  a chain at a sharp overlap.
- **The line on its own pass** (Freestyle "as render pass") lets the compositor recolour or soften it without re-rendering.
- **Hatching** in the shadow band by a Wave texture mixed in Linear Light: Don't Starve's shadows are hatched this way. Not
  the art direction's (flat with grain), but the cave's rock could carry a faint hatch.
- **Colour management Standard, not Filmic or AgX**, or the chosen colours shift. **Ours:** Standard; right.
- **Film transparent; render the figure alone;** the ground's contact shadow is the game's job (it knows the hour).

## 4. Animating four-legged beasts

From Cathy Feraday Miller's "Animating four-legged beasts" (Game Developer), Toon Boom's four-legged walk module, Animation
Mentor, and Muybridge's plates (now in `docs/reference/`):

- **Footfall.** Walk: left hind, left fore, right hind, right fore (a four-beat, three feet always down). **Ours:** `WALK_OFF`
  in `quad_build.py` is hL 0, fL 0.25, hR 0.5, fR 0.75: right. Gallop: the **rotary** gallop (left hind, right hind, right
  fore, left fore) is what most animals do in footage; horses often run the transverse one. **Ours:** `RUN_OFF` is hL, hR,
  fL, fR, which is transverse. Try the rotary order for the wolf, the boar and the deer (after hR comes **fR** then fL): the
  diagonal twist it gives the spine is what makes a running dog look like a running dog.
- **The body is two bouncing balls** (hips and chest, offset) **and the head a third**, following with overlap. In the walk the
  body rises as the forelegs pass under and falls as they reach. Spine shape is what makes a cat not a horse; a gallop's speed
  comes from how far the spine gathers before the stretch. **Ours:** `flex` in `run()` gathers and stretches; the walk has
  only a bob and a pitch. A hips-and-chest offset of a quarter cycle in the walk would add weight.
- **Keys:** four main keys (two stride, two passing), symmetrical or the animal limps; feet on arcs, never straight lines in
  the air; flat tangents make the motion stall at the top. A slow walk at about 40 frames; a gallop 12 to 16.
- **Order of work:** legs first as a vanilla gait per gait, then body bounce, head, tail last (one axis at a time), toes and
  ears after. Reuse one base cycle across similar bodies and adjust for shape, which is what one rig for all five species
  already does.
- **Reference:** Muybridge's walk, trot and gallop plates, side on and end on; the boar plates of 1881 are the boar's own.
  Watch footage at quarter speed; a biped's timing on a dog looks wrong at once.

## 5. Lighting and night (already in the game's `docs/lighting.md`)

Graveyard Keeper's shadow sprites turned toward each light, a light behind a thing leaving it dark with a lit rim, fog in height
layers, and colour tables by hour; Factorio's night as a colder palette, not a black sheet; the painters' rule of warm light,
cool shadow, a rim only on the edges that face the fire. The game built nine switches from these in 2026-10-12; nothing to
add from this round.

## 6. What the illustrators' own methods say

- **Bauer** worked in watercolour with indian ink and heightening white, sometimes tempera; the Nationalmuseum notes he took
  his cue from Rackham's colour illustrations. His thumbnail sheet (`bauer-four-big-trolls-william`) shows twenty stamp-sized
  compositions before one picture: **silhouette and composition at stamp size first.**
- **Rackham**: a pen line, then a wash; everything, clouds and flames included, is a drawn shape with a wobble.
- **Bilibin**: an even outline that could go straight to a printing plate, flat colour inside; the lubok and the woodcut.
- **Nielsen**: two values and pattern; black as a shape.
- **Kittelsen** and **Werenskiold**: pen and hatching; the people real and poor; the trolls half landscape.
- **Egerkrans** (no process account found online beyond an ImagineFX cover feature, issue 210, 2022, and a publisher's video on
  the Idunn picture): from the pictures themselves, an ink line of varying weight and flat digital colour with a paper grain;
  Bauer's palette with one hot accent. The game's own notes (`docs/reference/egerkrans/README.md`) stand.

## Sources

Readability: the Dota 2 Workshop Character Art Guide (Valve, PDF via Steam support); RocketBrush, "Shape language in game
character design"; Bugnet, "Readable game art: why clarity beats detail". Sprites from Blender: Blender Artists threads
"Quality of rendered sprites (2.8)" (1156814) and "2d Sprites with 3d Blender??" (344080); Polycount threads 165034, 69360,
121144; Pre Render Creator FAQ (Blender Market); Sprite Render Kit (blurymind); GameFromScratch, "Easy sprite art in Blender";
Blender Nation, "Technique to create pre-rendered sprites in Blender and how to use them in Godot" (Linko, 2018). NPR:
Blender Artists "NPR cell shading 2D style rendering wanted" (1103124); Blender Nation "EEVEE NPR, Blender 2.8 Code Quest";
NPR Shader Kit docs (Superhive); the Blender manual, Freestyle line style thickness. Animals: Game Developer, "Animating
four-legged beasts" and "A quick guide to animating animals" (Cathy Feraday Miller); Toon Boom Learn, four-legged walk cycle;
School of Motion, walk cycle reference list. Dead Cells: coverage of Thomas Vasseur's pipeline (wnhub, itch posts). Games:
Game Developer "Road to the IGF" (Stoic; Red Hook), Killscreen on The Banner Saga, 80.lv on Darkest Dungeon.
