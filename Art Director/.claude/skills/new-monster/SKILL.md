---
name: new-monster
description: Suggest and then build a new monster (or a new character, boss or fight background) for an area of the board world. Use when Robin says "a new monster for the swamp", "what should live in the mountains", "we need a boss for the first gate", or names a creature to be designed or modelled.
---

# A new monster

Two halves: the list to pick from, then the build. Stop after the list unless Robin has already picked.

## 1. The list (what Robin picks from)

- Read the brief and the game's docs for the area (its look, its danger, its fight background, what lives there already:
  `docs/inventory.md` and the game's `docs/`), and the game's idea bank for monsters Robin has noted.
- Offer five to eight. For each, in four lines:
  1. **Name and what it is**, in one sentence. What it does in a fight is Miles, GD's; say only what the look promises (slow
     and heavy, quick and spiky, a caster).
  2. **The look**: one sentence of silhouette, and the one thing that carries it at a hundred pixels tall.
  3. **The reference**: a real animal's proportion, a public-domain picture from `docs/reference/`, or a game studied (how it
     solves the problem, never its asset).
  4. **How it would be built** in the chosen pipeline, what is new (a body plan, a special clip), and the cost (frames, sheet
     weight).
- Say which one or two you would do first and why (how much it will be on screen, what it unlocks, how it fits the area).
  Then stop and let Robin pick.

## 2. The build (after the pick)

- Write the design in `work/<name>/NOTES.md` first: the silhouette side on, the colours (the area's key, the one accent if it
  has one), the clips it needs (idle, attack, hit, death at least; a windup that changes the shape) and what each pose is.
- **Concepts first** (Robin, 2026-10-14, kept from the Survival game: a new creature must be its own idea, not an old one
  changed a bit): two or three distinct visions as stills on one board with captions, sent into the chat, before any rig or
  clip is made.
- Build, quick render, look; iterate; full set; compare against the hero and the nearest existing monster in its own fight
  background.
- The check, the notes, deliver, the log, the inventory. Tell Robin the picture, what is his to decide (where it lives, its
  numbers: those are the game's), and how the game would draw it (a new key and a sheet folder; Miles, GD wires it).
