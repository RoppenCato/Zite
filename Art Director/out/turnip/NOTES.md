# The Turnip Grump: the Sunny Meadow's first monster

Perry, AD, 2026-10-31. Built as the pipeline trial (`docs/pipeline.md`) in the manner of `docs/direction.md` section 3:
painted, cute and chunky, outlined, as named actions with frame data, facing left. Robin had not picked from the list
below within the session, so the first one I recommended was built; the other four wait.

## The five candidates for the meadow (offered 2026-10-31)

1. **The Turnip Grump** (built). A round cream turnip with a violet crown, three leaves on top, heavy brows and a pout,
   stubby root feet; hops, slow and sulky. *The look:* a ball with a leaf tuft; at a hundred pixels the tuft over the round
   body carries it; the face is two big eyes under heavy brows; `hit1` flattens it, splays the leaves and pops the eyes.
   *The reference:* level 1 to 10 band (about 0.8 of the player); the Slime's squash and stretch for the hop, the Orange
   Mushroom's face for the character; ours because they have no vegetable in that band and its face is a sulk, not a smile.
   *Actions and cost:* stand 6, move 6, hit1 1, die1 8, attack1 12 = 33 frames, about 1 MB at 2x before optimising.
2. **The Puffwort.** A dandelion clock: a perfectly round white fluffy head on a chunky green stalk body with two leaf
   arms; hops. *The look:* the white puff on green; `hit1` puffs seeds off. *The reference:* the same band; the Slime for
   the hop; ours by the puff. *Cost:* the same five actions, plus a few seed frames; the thin stalk must be made chunky or
   it reads as a stick.
3. **The Bramble Bun.** A round bun of bramble with berry eyes and a grass tuft back; rolls to move. *The look:* a spiky
   ball; `hit1` sheds berries. *The reference:* the same band, the Snail for a slow mover. *Cost:* the same five.
4. **The Honey Bumble.** A fat round bee with tiny wings; flies. *The look:* stripes on a ball; `hit1` spins it. *The
   reference:* a flyer (fly 5 replaces stand and move). *Cost:* fly 5, hit1 1, die1 8, attack1 12 (a dive).
5. **The Sunny Snapper.** A sunflower with a mouth, planted, that snaps at what comes near. *The look:* a petal ring round
   a face on a stalk; `hit1` droops the petals. *The reference:* a stump type (the Stump: it does not move). *Cost:* stand 6,
   hit1 1, die1 8, attack1 12; no move.

First the Turnip Grump (it lives on the starting meadow, so it is on screen most, and a walker tests the pipeline's move
cycle), then the Puffwort (a second shape beside it).

## The concepts (2026-10-31)

Three visions as stills beside our player (`concepts.png`): A round and grumpy, B tall and leggy with a root tail, C squat
and wide with a grin. A was built (mine; Robin may ask for B or C instead: the same builder with other proportions).

## The design

- **The silhouette, side on, facing left:** a ball 0.76 m across on two root feet, a taproot point below, three leaves
  rising 0.3 m from the crown. About 0.8 of the player. The face is turned 58 degrees toward the camera, as the reference's
  monsters cheat theirs, so both eyes show.
- **The colours:** cream `#f3e9d2` with a violet crown `#9b5de5`, leaves `#5fb04a` and `#7ccf5a`, root `#e2cfa8`, eyes
  `#fff8f0` with `#2b2320` pupils, brows `#3d2e4f`, cheeks `#ff9a86`, mouth `#5a2a3a`; the line `#2b2320`. About 60 colours
  after the painted ramp.
- **The actions** (the reference's counts and delays):
  - `stand` 6 at 130 ms: a breath, the crown sways, a blink on the fifth frame.
  - `move` 6 at 140 ms: a hop in place: crouch, launch, air, fall, land, settle; the crown lags behind the body.
  - `hit1` 1 at 600 ms: the most exaggerated pose: flattened to 1.3 wide, knocked back, leaves splayed, eyes popped and
    spread, brows up, an O mouth.
  - `die1` 8 at 150 ms: a wobble, a nod, a lean back, the topple onto its back, a bounce, flat and fading (`a0`, `a1`
    from 255 to 0 over the last three frames).
  - `attack1` 12 at 120 ms: a headbutt: four frames of windup leaning back with angry brows, the launch, the lunge, the
    impact (eyes shut), a hold, four of recovery. The lunge travels 0.45 m toward its target; the hit box moves with it.
- **The data:** every frame's `origin` (the feet, centred), `delay`, `lt` and `rb` (the body's bounds, leaves included),
  `head` (the top of the hit box), `a0` and `a1` on the fade, written by the renderer and packed by `tools/pack.js` into
  `turnip.json` beside the atlas `turnip.png` (Phaser's atlas form with an `actions` block). Files at 2x.

## What the build taught (2026-10-31)

- The first full render had the eyes standing out of the face like eggs and ballooning on `hit1`: the face parts' thin
  axis pointed along the face instead of into it (a sign in the Euler turn). Fixed; every face part now lies flat on the
  ball, and the brows' slant turns about the face's normal.
- The lunge of `attack1` left the 1.6 m render frame; the frame is 2 m now, shifted 0.15 m toward the facing.

## The check (docs/direction.md section 9), answered

1. One silhouette at a quarter size, facing clear: yes; the leaf tuft over the ball; the feet and the eyes say left.
2. Painted, outlined, hard edges: yes (the ramp, the thin line, the packer's hardened edge).
3. Cute and chunky in its band's proportions: yes; 0.8 of the player, the reference's starter band; a head that is the
   whole body.
4. Lit from above: yes; the crown's top bright, the underside cool.
5. In its area's palette and idea: a vegetable on the meadow; the violet is the one accent (it is also the event kind's
   colour; a different violet if that confuses).
6. Belongs beside our player on its background: judged on the fight ground in `compare.png`; more saturated and outlined
   than the planes behind.
7. Data complete: yes.
8. Would sit in Maps/Places, and nothing of theirs: its own shape, face and colours; no turnip in their early band.

## Drop-in steps (for Miles, GD)

1. Copy `out/turnip/` into the game's assets: `turnip.png` (the atlas), `turnip.json`, `frames/` (the frames loose, for
   looking; the game needs only the atlas and its json).
2. Load the atlas (`this.load.atlas('turnip', 'turnip.png', 'turnip.json')`); for each action in `actions` make an
   Animation whose frames are the action's frame names with `duration` from each frame's `delay`; `loop` says which repeat.
3. Place by `origin` per frame (the feet; the origin moves between frames as the frames are trimmed), draw at half size,
   `flipX` to face right. The hit box (`lt`, `rb`) and `head` are relative to the origin at 2x: halve them.
4. On `die1` apply `a0` to `a1` as the frame's alpha.
5. On the board draw the `stand` action at 0.6.

## For Robin to decide

- Whether the Turnip Grump is the first monster, or B or C's proportions, or another of the five.
- Its numbers (level, health, where it lives) are the game's.
- The violet crown against the event kind's violet.
