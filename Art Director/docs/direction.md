# The art direction: the shell, and the look

Robin, 2026-11-01: the art direction of 2026-10-31 is scrapped; the shell stays; the art starts again, with no reference
pictures carried over (MapleStory and the three example pictures are both out). Rewritten by Mitch, AD the same day. The game's own `docs/state/art.md` and `docs/art-demands.md`
are the authority on budgets, file form and what is needed; this sheet is what the studio builds to.

## The look (a draft, mine, 2026-11-01; to be checked against the first still and then rewritten in Robin's words)

**What Robin has said** (2026-11-01): an Enchanted Kingdoms theme, simple graphics, bright and playful mixed with magical
and adventurous (from the conversation behind `ART_DIRECTION.md`); "people not animals"; "I think I actually really like
the simple MapleStory graphics that you see in the other examples." And: the MapleStory project on this PC (the extracted
library) is not used; MapleStory as a general reference is fine. The heroes are painted here in code (Robin, 2026-11-01).
The pictures are in `Examples/`:

- **Ex1** (a raised-camera cartoon beach from a published game): the board's camera. Flat fills, a thick warm dark line,
  one long flat cast shadow per upright thing, a quiet ground. Study for the board kit's camera and shadows, not for the
  characters (animals, and flatter than Robin wants).
- **Ex2** (key art of two chibi heroes, a swordsman and a witch): the heroes. People, about two and a half heads tall, a
  big head, big eyes with a coloured iris and a highlight, spiky hair, a big hat, simple clothes in two or three colours.
- **Ex3** (a painted hillside village of mushroom houses, round trees, a grass lip over a cliff body, mushrooms in the
  grass): the places. Lush and soft, no outline on the far planes, paler with distance, floating islands and clouds.
- **Ex4** (a poster of four round monsters: a snail, a mushroom, a pig, a slime in a wizard's hat): the monsters, and the
  simplicity Robin means. One clean black line of even weight, flat bright fills with one soft shade, a huge simple face
  on the front of one round shape.

**The sentence (mine):** *A bright storybook fantasy drawn simply: round chunky shapes with one clean dark line, flat
saturated colour with one soft shade, big simple faces; chibi people as heroes; lush soft places behind them; the board
seen from above with everything standing on it and casting a shadow.*

- **Colour.** Bright and saturated, chosen, never computed: the fill, one shade a step darker and cooler, and a small
  highlight only on things that shine (a slime, a cap, an eye). No gradients beyond that shade, no grey, no texture on the
  near things. Each area one palette; the magical areas add violet, cyan and glow.
- **Line.** One clean dark line of even weight round every near thing (near-black on the monsters and heroes, a warm
  dark brown on props and ground pieces so they sit back); thinner inside; none on the far planes. Tested at the real
  size on the phone, never zoomed.
- **Light.** From above: the top edge bright, the shade underneath, the shadow cooler than the light. On the board every
  upright thing casts one flat shadow in the same direction.
- **Shapes.** Round and chunky; a monster is one shape with a face taking most of its front; a hero is a big head on a
  compact body with one garment, one class shape and one weapon; props are simple and fat; nothing thin, nothing fussy.
- **Places.** Lush behind, quiet underfoot: a bright grass lip over a darker cliff body; mushroom houses, round trees,
  soft far planes without line; props everywhere in clusters, every repeat its own size and lean.
- **Sizes.** The game's numbers above; the player's height is open (show two sizes in the first still).
- **Check.** Reads as one shape at a quarter size; the line even and clean at phone size; one light; nothing grey;
  nothing thin gone black; beside the hero on its ground with a shadow at its foot it belongs.

`ART_DIRECTION.md` is read beside this sheet; where it names classes or regions, the game's own names win. Since the
evening of 2026-11-01 those are the Enchanted Kingdoms' (the game's `docs/names.md`): the classes are the Knight, the
Trickster, the Wizard and the Archer; the first areas Cloverfield Meadows, Wobblewood Forest and Honeyhill Fields, the start
Puddlewick Village; the gear ranks run Tin to Everbright. The hybrid test's sets were named before this (tunic, plate, mage).

**Open with Robin:** what this game should look like and which references he loves (asked with pictures); the player's
height on screen (100 CSS px was Perry, AD's number; Robin's own sheet stood 118 and he liked its presence); the mood of
the first area; whether the hero's still is painted here or made with his image tool from a brief and then cut and
animated here.

## Equipment shows on the character (Robin, 2026-11-01)

"Visible equipment progression is extremely important for this game. Players must be able to wear different armor sets,
helmets, gloves, boots, and capes, and wield different weapons and shields. All of these must remain visible during
animation." So a class character is one skeleton with slots (head, torso, hips, boots, hands, back, near arm, far arm,
weapon, off-hand), each filled by a procedural part (drawn from the skeleton's points) or a raster part (a master picture
placed at a joint with its pivot and turned with the limb); every frame is the same skeleton and parts, so nothing
flickers. The test of this is in `docs/log.md` (2026-11-01, the hybrid hero) and `tools/hybrid/`. This overrides the Game
Developer's note of 2026-11-01 that gear does not show on the character; Miles, GD is told.

## The world's form (Robin, 2026-10-31)

**The board is seen from a raised camera, in 2D.** Robin showed a Dokapon Kingdom board and asked for "like B but 2.5D":
the ground drawn from above at a tilt, with cliff faces where the land steps up; roads, rivers, shores and the spaces flat
on it; everything standing on it (trees, houses, castles, the players, the monsters) upright and sorted by depth; a horizon
band (sea, far islands, sky, drifting clouds) that moves less than the ground. The camera follows the token and can pull
back. `docs/pictures/world-form/C-diorama.png` is the picture.

**Fights are their own screen**: 2D, outside the world map, "an instanced version of where you are": a side-view scene
that looks like the place the token stands in, built from the area's kit: a ground band with a bright top edge, layered
planes behind, the area's props, the fighters big.

**So an area has two kits in one palette:** the **board kit** (ground tiles and edge pieces, cliff faces, road pieces, spot
markers, badges, the closed-area cover, horizon strips; props seen a touch from above) and the **fight kit** (a side-view
ground band, two or three backdrop strips over a code-drawn sky, props seen side on). They share the props' designs and the
monsters; they differ in camera. The exact pieces, counts and sizes are in the game's `docs/art-demands.md`.

## Scale (the game's numbers, `docs/state/art.md`)

The design size is 412 by 915 CSS pixels, portrait; files at 2x. On screen, in CSS pixels: a board token about 40 tall; in a
fight the player about 160 tall (to be reconfirmed with Robin), a monster 120 to 240, a boss up to 400. The board is drawn
at 0.8 and seen whole at 0.3, so board pieces are broad shapes with little fine detail.

## Monsters and characters: named actions with frame data

A monster is a set of named actions, each a list of frames with data. The counts are the game's budget (about 33 frames):

| Action | Frames | Rate | What it shows |
| --- | --- | --- | --- |
| `stand` | 6 | 10 a second, looped | idle: a bob or breathing |
| `move` | 6 | 10 a second, looped | walk or hop (`fly` for flyers, hovering above an origin that stays on the ground) |
| `hit1` | 1 | held | **the most exaggerated pose**: recoil, shock, pieces knocked loose; seen most |
| `die1` | 8 | 12 a second | collapse, squash or crumble, the last frames fading |
| `attack1` | 12 | 15 a second, two frames held | windup, the strike with a flash or lunge, recovery; the blow lands on the second held frame |

A class character: about 25 frames (stand 4, move 6, attack1 6, hit1 1, die1 6). A boss may add a second phase (a second
`stand` and `attack1`) if a second atlas fits.

**The motion rules:** change the silhouette between frames (shading alone does not read at this size); let attached parts
follow late; keep the feet at the same height unless the thing leaves the ground; the windup is the tell.

**Each frame carries its data:** `origin` at the feet, horizontally centred; `delay` in milliseconds; the hit box `lt`, `rb`
relative to the origin; `head`, the top of the head; optional `a0`, `a1` opacity for fades. Frames may differ in size; the
origin keeps the feet still. **Draw facing left**; the game flips.

## The atlas form and the budgets (Miles, GD, 2026-10-31; the game's `docs/state/art.md` is the authority)

Atlases only, Phaser 3 JSON hash, frame names `<sprite>/<action>/0001`, 2 px padding, the pivot at the feet per frame;
power-of-two sides up to 2048; a character or monster at most 1024 by 2048; a monster under 300 KB, a class character under
400 KB, an area's kit under 2.5 MB, the first load under 3.5 MB of art; at most 4 full-screen layers in a fight, 3 on the
board; a palette PNG wherever it holds (`tools/shrink.py`). `tools/pack.js` writes this form from frames and a meta.json.

## Backdrops: layers, never one picture

The sky is a gradient drawn by code; then two or three strips of at most 2048 by 1024 (2x) that tile or stretch; then the
ground. Each layer has a scroll factor with clear gaps between layers (a layer in front moves faster than those behind).
Far planes paler, hazier, less saturated, lower in contrast and detail, shifted toward the sky colour. Clouds drift. Keep
strong detail out of the band where the fighters stand.

**The fight backdrop's idea (Robin, 2026-11-02: "A, the road to the mill. Looks great! Apply the same idea to the others moving forward").** Every region's fight, the same way:

- The fighters stand on the region's own road, in a worn clearing, with their feet 46 px into the ground. Never on a separate band of soil.
- The way runs back to that region's landmark: the mill in the Meadows, Tumbletree in Wobblewood.
- Sky about a third of the band at most. Far, mid and near get paler with distance, ink included, in flat shapes. A gradient only for the sky.
- Framing at the screen's sides only; nothing tall near a fighter; the field edge behind them stays below their knees.
- Foreground accents below their feet. One thin strip drifts, nothing else. Strips 512 wide, composed for x 0 to 412.
- Tools: `tools/kit/meadow_battle.js` is the engine, `tools/kit/forest_battle.js` the model for a new region.

**The fight's name board (Robin, 2026-11-02: short bars, then "1", from three concepts).** Under each fighter's feet, a wooden plank with HP, MP and the class meter on the upper part, and the words on a parchment slip below, dark with no outline. Details in `out/fight_boards/NOTES.md`.

**The inventory (Robin, 2026-11-02: "2. the hero", then "A").** The hero in what they wear, with slots either side and all seven stats beside the picture, dimmed at 0. Flasks, cards and gear lie in slots with a wood recess; tapping says what a thing does; buttons only when they apply. Details in `out/bag_options/NOTES.md`.

**The top bar (Robin, 2026-11-02: "The slim bar, 3").** A thin plank with a level medal, HP, MP, gold, the die and XP along its foot; place and goal hang under it as two small signs. Details in `out/top_bar/NOTES.md`.

**The bottom bar (Robin, 2026-11-02: "Go for 1").** A thin plank, Roll in the middle rising above it, two icon buttons either side, the message on a sign standing above. Details in `out/bottom_bar/NOTES.md`.

## Before anything is handed over

1. Put it next to our player for scale.
2. Check it on the actual background of its area: edges and colours behave differently on busy art.
3. Tile ground pieces and repeating layers 3 by 3 and look for seams.
4. Play animation at the real delays; a moving origin jitters.
5. Hand over the art with its data (origin, delay, hit box, head; repeat type, scroll factor, drift, opacity, front), in
   the form the game needs, with a NOTES.md.

## The check

A new thing is right when:

1. it reads as **one silhouette at a quarter size** and shows which way it faces;
2. it is in **the look** (once decided), with chosen tones and one light over the whole form;
3. it is **lit from above**;
4. it sits in **its area's palette and idea**, and nothing in it burns but what should;
5. beside our player on its own background it **belongs**: scale, edge weight, saturation nearer than the background's;
6. nothing thin has gone black, nothing small has vanished, and repeats differ;
7. if it moves, it has been played at real delays, feet locked, frames not cut off;
8. its **data is complete**, and what was not tested is said.
