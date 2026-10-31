---
name: new-monster
description: Suggest and then build a new monster (or a boss, or a class character) for an area of the board world, in the reference library's manner: painted, cute and chunky, outlined, as named actions with frame data. Use when Robin says "a new monster for the swamp", "what should live in the mountains", "we need a boss for the first gate", or names a creature to be designed or modelled.
---

# A new monster

Two halves: the list to pick from, then the build. Stop after the list unless Robin has already picked. The manner is
`docs/direction.md` sections 1 to 3; the library's `Instructions.md` ("How monsters are made") is the source.

## 1. The list (what Robin picks from)

- Read the brief and the game's docs for the area (its mood, its level band, its background, what lives there already:
  `docs/inventory.md` and the game's `docs/`), and the game's idea bank for monsters Robin has noted.
- Look at the library: `Monsters/Sheets/Level ... .png` for the level band (how big, how simple, how many colours), two or
  three of `Monsters/Animations/` for the motion of that kind (a hopper, a walker, a flyer, a stump), and `Maps/Places/` to
  see such monsters in their home. Learn the proportions and the motion; take nothing.
- Offer five to eight. For each, in four lines:
  1. **Name and what it is**, in one sentence. What it does in a fight is Miles, GD's; say only what the look promises
     (slow and heavy, quick and bouncy, a caster with a glow).
  2. **The look**: one sentence of silhouette, the one thing that carries it at a hundred pixels, the face, and the one
     exaggeration `hit1` will make.
  3. **The reference** for proportion and motion: which level band's typical size, which animation sheet shows the kind of
     motion (the Slime's squash, the Mushroom's face), and what of ours makes it unmistakably not theirs.
  4. **The actions and the cost**: `stand`, `move` (or `fly`), `hit1`, `die1`, and `attack1` or `skill1` if it fights with
     one; the frame counts from the table; the file size.
- Say which one or two you would do first and why (how much it will be on screen, what it unlocks, how it fits the area).
  Then stop and let Robin pick.

## 2. The build (after the pick)

- Write the design in `work/<name>/NOTES.md` first: the silhouette side on, facing left; the proportions against the player
  (section 2 of the direction); the colours (the area's palette, about 60 colours, a thin dark outline); every action with
  what each pose is (the windup is the tell; `hit1` the most exaggerated; the feet at one height; parts that follow late).
- **Concepts first** (Robin, 2026-10-14, kept from the Survival game: a new creature must be its own idea, not an old one
  changed a bit): two or three distinct visions as stills on one board with captions, next to our player for scale, sent
  into the chat, before any rig or clip.
- Build, quick render (one action, a few frames), look; iterate; the full set; pack; the frame data (origin at the feet,
  delay, hit box, head, fades) written by the renderer.
- Judge: next to our player and a reference monster of its band for scale (never one of theirs in the picture that goes to
  the game: a studio compare only); on its own area's background; the animation at real delays in the viewer; the check.
- The notes, deliver with the data, the log, the inventory. Tell Robin the picture and the moving version, what is his to
  decide (where it lives, its numbers: those are the game's), and how the game draws it (a new key, a sheet folder and its
  frame data; Miles, GD wires it).
