---
name: new-monster
description: Suggest and then build a new monster (or a boss, or a class character) for an area of the board world, as named actions with frame data in the game's atlas form. Use when Robin says "a new monster for the swamp", "what should live in the mountains", "we need a boss for the first gate", or names a creature to be designed or modelled.
---

# A new monster

Two halves: the list to pick from, then the build. Stop after the list unless Robin has already picked. The look is
`docs/direction.md`; the game's `docs/art-demands.md` says which creatures are needed, at what size and in what order.

## 1. The list (what Robin picks from)

- Read the brief and the game's docs for the area (its mood, its level band, what lives there already:
  `docs/inventory.md` and the game's `docs/art-demands.md`), and the game's idea bank for monsters Robin has noted.
- Offer five to eight, **each with a picture**: a quick still of the silhouette and colour beside our player, on one board
  with a caption each. Robin picks from pictures, never from names. For each, in three lines:
  1. **Name and what it is**, in one sentence. What it does in a fight is Miles, GD's; say only what the look promises
     (slow and heavy, quick and bouncy, a caster with a glow).
  2. **The look**: the one thing that carries the silhouette at a hundred pixels, the face, and the one exaggeration
     `hit1` will make.
  3. **The actions and the cost**: `stand`, `move` (or `fly`), `hit1`, `die1`, `attack1`; the frame counts from
     `docs/direction.md`; the file size.
- Say which one or two you would do first and why. Then stop and let Robin pick.

## 2. The build (after the pick)

- Write the design in `work/<name>/NOTES.md` first: the silhouette side on, facing left; the proportions against the player;
  the colours (the area's palette, a dark edge); every action with what each pose is (the windup is the tell; `hit1` the
  most exaggerated; the feet at one height; parts that follow late).
- **Concepts first** (Robin, 2026-10-14, kept from the Survival game: a new creature must be its own idea, not an old one
  changed a bit): two or three distinct visions as stills on one board with captions, next to our player for scale, sent
  into the chat, before any rig or clip. If they are rejected, ask Robin for references.
- Build, quick check (one action, a few frames), look; iterate; the full set; pack with `tools/pack.js`; the frame data
  (origin at the feet, delay, hit box, head, fades) in the meta.json.
- Judge: next to our player for scale; on its own area's background; the animation at real delays on a moving page; the
  check in `docs/direction.md`.
- The notes, deliver into `out/<name>/` with the data, the log, the inventory. Tell Robin with the picture and the moving
  version, what is his to decide, and tell Miles, GD how the game draws it (a new key, the atlas and its frame data).
