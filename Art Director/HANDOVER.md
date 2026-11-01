# Handover: the art of Zite starts again

Perry, AD, 2026-11-01. For the next art session. Read this, then `CLAUDE.md`, then the brief at the root
(`C:\dev\Zite\board-world-game-brief.md`).

## Robin's decision (2026-11-01)

"Scrap the whole art direction, besides the shell (like 2.5D, fighting etc), and start from the beginning with the art."
Three example pictures of the look he wants are in `examples/` (Ex1, Ex2, Ex3). Everything drawn under the old direction
is removed from this studio (this commit); the game still holds copies, see below.

**The shell, kept:**

- The world's form: a board seen from a raised camera, in 2D; fights as their own side-view screen, an instance of where
  the token stands (Robin, 2026-10-31; `docs/direction.md`, "The world's form", and the mock-ups in `docs/pictures/world-form/`).
- Areas built from kits: a board kit (tilted ground plates, roads, shore, cliff faces, props seen a touch from above) and a
  fight kit (a side-view ground band, three to five planes with scroll factors, props side on). Everything is data: origin,
  delay, hit box, head; repeat type, scroll factor, drift, opacity, front (`docs/direction.md`, sections 4 to 6 and 8).
- Monsters and characters as named actions with frame data: stand, move, hit1, die1, attack1 (fly for flyers), drawn
  facing left, the game flips (`docs/direction.md`, section 3, the table).
- Miles, GD's budgets and the atlas form (`docs/direction.md`, section 7b): atlases only, Phaser 3 JSON hash, frame names
  `<sprite>/<action>/0001`, 2 px padding, the pivot at the feet per frame, power-of-two sides up to 2048, a character or
  monster at most 1024 by 2048; a monster under 300 KB, a class character under 400 KB, an area kit under 2.5 MB, the
  first load under 3.5 MB; rates stand and move 10 frames a second, attack 15, die 12, hit held; files at 2x of the phone
  design size (412 by 915 CSS px). `tools/pack.js` makes this form.
- The player 100 CSS px tall (my number with Miles, GD, not Robin's): **reconfirm with Robin**; his own sheet stood 118 and
  he liked its presence.

**Scrapped:** the MapleStory-referenced painted look (`docs/direction.md` section 1, `docs/recipe.md`), the ink hand, the
Warrior in every version, the Puffwort, Honey Bumble, Bramble Bun and Turnip Grump, the Sunny Meadow kits, and the tools
that painted them. The records stay in `docs/` (see "The record" below) so nothing is relearnt the hard way.

## The three examples (`examples/`)

Screenshots of a published game: the look to aim for, never copied, never into the repo as art (both repositories are
public).

- **Ex1**: a forest of giant trees, the camera inside the canopy; rope bridges and rope ladders between the trunks;
  platforms with bright grass lips; the trunks painted with bark folds and knots; a pale, hazy far plane of more trunks.
- **Ex2**: a village in daylight: mushroom-cap houses, a round tree, a huge "Market Place" sign of painted letters, a
  bench, baskets, a sunflower, a hay bale, a wooden ladder; a stone-block ground with a grass lip; big soft white clouds on
  a blue sky, a far hill in haze.
- **Ex3**: a dark forest: a tangle of roots and vines as the ground's body, a house with a leaf roof and lit round windows,
  a ruined stone gate wrapped in vines, a fairy, a huge pink flower, a rope ladder, a sign.

What they share, measured by eye: full painted environments with real depth (several planes, the far ones paler and
hazier); saturated greens and warm browns; soft painted shading with dark edges, nothing flat and nothing pixel; chunky,
rounded, friendly shapes with many small details (knots, leaves, ropes, lamps); the ground a dark textured body under a
bright grass lip; props everywhere, each a kit piece (ladder, sign, bench, basket, flower); characters small against the
scene. This is a richer target than the old "every area one idea and one palette" rule: the areas should be lush.

## What the game holds right now

`C:\dev\Zite\Game Developer\assets\` has copies of the scrapped **warrior, puffwort, bumble, bramble** (Miles, GD copied them
on 2026-10-31; commits 9681845 and b47c4fa). Miles, GD was told on 2026-11-01 that they are scrapped and can be dropped or
left as stand-ins until the new art lands. The studio never edits the game's folder.

## The reference library, still the structural reference

`C:\dev\MapleStoryPlus\Settings\Inspiration` (monsters, maps, tiles, backgrounds, objects, with `Instructions.md` on how
they are built: grids, planes, frame counts, timings). The playable character is NOT there: it is in the client's
`Client\MapleStory\Character.wz`; a study export (MapleLib, the way `Settings\Scripts\Export-Inspiration.ps1` reads the
client) is described in `docs/pipeline.md` ("The fresh Warrior doll"), and its construction numbers are in
`docs/hero-iterations.md`. **Study, never copy; never write into that folder; never put a piece of it in this repo.**

## What is in this studio now

- `examples/` the three pictures.
- `docs/direction.md` the old direction; sections 2 to 6, 7b, 8 and "The world's form" are the shell and still hold;
  sections 1, 7, 7c and 9 are of the scrapped look.
- `docs/pipeline.md` the old commands; the packer, the shrink, the pages and the sheet tools still apply.
- `docs/hero-iterations.md` the whole hero story with every one of Robin's notes: read it before drawing a character.
- `docs/log.md` what was done, by date. `docs/inventory.md`: empty now.
- `docs/techniques.md` the craft notes from the Survival game (readability, sprites, gaits): still good.
- `docs/direction-proposal.md`, `docs/recipe.md`: records of the scrapped look.
- `docs/reference/README.md`: the studio's own reference board, empty.
- `.claude/skills/` new-monster, new-area, improve-asset, art-review: the process is sound (candidates, Robin picks,
  concepts as stills before any build, judge at phone size), but every one of them names the scrapped look: revise before use.
- `tools/` kept: `pack.js` (frames to the atlas form), `smear.js` (a strike's trail), `shrink.py` (palette PNG, the size
  cut), `gif.py` and `anim_gif.js` (a GIF of an atlas moving), `cut_sheet.js` (a sheet in the studio's grid back into
  frames, with green keyed out) and `fix_sheet.js` (frames grounded, anchored, one head on a walk, hard edges), `paint.js`
  (canvas helpers), `chrome.js` (the HUD and panel for judging pictures), `player.js` (loads an atlas as "our player" for
  scale), `look.js`, `sheet.js`, `compare.js`, `board.js` (judging pictures; they expect an atlas and a ground),
  `blender.js` (runs Blender headless), `world_form_mock.js` and `diorama_mock.js` (the shell's mock-ups).
  Node 24 with `@napi-rs/canvas` from `C:\dev\SG\Game Developer\node_modules`; Python 3.14 with PIL; Blender 5.2.
- `work/` is git-ignored and empty.

## What moves on the phone

GIFs show as stills on Robin's phone. Anything animated goes on an artifact page that draws the atlas at its delays on a
stage picture (the vector, meadow and knight pages were that; the last one, with a switch between two atlases:
https://claude.ai/artifact/2jcNKzX951moJpQFBaGBYQ). Its HTML is simple: fetch the json, draw frames by origin at delay,
loop the actions; keep a copy in the next session's scratch folder.

## Lessons, so the next pass converges

1. **One still first.** Agree the look on a single finished picture (the hero on the ground beside one monster, at phone
   size) before anything moves. Words and written review lists did not converge; every round moved proportions,
   construction and style to answer the last note.
2. **Code-painted characters hit a ceiling.** Shapes drawn in canvas read as a doll of parts however much anatomy is
   added (Robin: "doll-like", "a midget", "two left eyes"). They are fine for props, ground and planes; not for the hero's face.
3. **AI-made sheets look right and flicker.** Robin's own sheet had the look he wanted but no two frames agreed (face,
   sword, size, position). `fix_sheet.js` grounds, anchors and pastes one head; it cannot make the frames one character.
4. **The join is a paper doll from one approved painting.** Cut the approved still into parts (head, torso, arms, legs,
   weapon) and animate the parts from pose data, the way the reference animates its player. Painted look, every frame the
   same character, hard edges, atlas at budget. Not tried yet; it is the recommended first build.
5. **Judge at phone size, on the real ground, beside the player.** Never from a sheet. Zoom only to find a fault.
6. **Keep files small.** Soft keyed edges doubled an atlas; harden edges, shrink to a palette PNG at delivery.
7. **The review loop with Colin, AD is off** unless Robin asks (Robin, 2026-10-31).
8. **Robin's decisions carry the date and his name; mine say "mine".** Plain words, short sentences.

## The first steps for the next session

1. Ask Robin: the player's height on the phone (100 CSS px, or bigger); which example's mood is the first area; whether
   the hero's still is painted here or made with his image tool from a brief and then cut and animated here.
2. Make the one still: the hero standing on that area's ground beside one monster, at phone size, with the chrome on.
   Iterate on that picture only, until Robin says it is the look.
3. Cut it into parts and build the paper doll; show stand and walk moving on a page; then the rest of the action set.
4. The area kit in the same look, each piece a still first; then the monsters, each a still first.
5. Deliver into `out/<name>/` with data and a `NOTES.md`; a picture into the chat every time; tell Miles, GD.

## The sessions

Miles, GD (the game): session `local_f0d94ba4-03bc-451d-a056-8ae18c1ab498`, "Game Developer: build the skeleton".
Colin, AD (the Survival game's art): `local_e79c1336-b538-42a3-85d1-22390336dfd4`. Every mention of a session carries its
name and tag ("Miles, GD"). Sign "Perry, AD" or whatever name the next session takes.
