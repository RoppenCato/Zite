# Inventory: every asset of the game, where it lives, its state, what needs work

Kept by Perry, AD. State: **delivered** (in `out/`, waiting for the game to take it), **in the game** (taken), **work**.
Nothing is in the game yet (2026-10-31): the client draws shapes and labels.

## Areas

| Asset | Where | State | What needs work |
| --- | --- | --- | --- |
| Sunny Meadow, board kit | `out/meadow/board/`, `horizon/`, `objects/board/`, `kit.json` | delivered 2026-10-31 | the plateau's north, west and east edges are thin lips only; the shore corners and bridges unseen in a laid scene; a second house and more small props for a town |
| Sunny Meadow, fight kit | `out/meadow/tiles/`, `background/`, `objects/fight/`, `kit.json` | delivered 2026-10-31 | the slopes and end caps unseen in a laid scene; one animated plane (a sea sparkle, a bird) would add life; the treeline's trunks sit close above the fighters' heads |
| Sunny Meadow, the two screens | `out/meadow/board.png`, `fight.png`, `preview/` | delivered 2026-10-31 | the studio's layout, not the generator's |

## Monsters

| Asset | Where | State | What needs work |
| --- | --- | --- | --- |
| Turnip Grump (meadow, starter band) | `out/turnip/` (a Blender render with the painted ramp) | delivered 2026-10-31 | the one monster still in the 3D hand Robin turned down for the hero: repaint it as painted 2D like the three below so the meadow is one hand; its ringed eyes; the atlas not yet shrunk |
| Puffwort (meadow, starter band; hops) | `out/puffwort/` and in the game, commit b47c4fa (atlas 1024 by 2048 palette PNG, json, frames, sheet, compare, screen, gif, build) | in the game 2026-10-31 | the seed shapes are small at phone size; a seed could be fatter |
| Honey Bumble (meadow, starter band; flies) | `out/bumble/` and in the game, commit b47c4fa (atlas 1024 square, json, frames, sheet, compare, screen, gif, build) | in the game 2026-10-31 | the wings' beat is two positions; a third would smooth the hover |
| Bramble Bun (meadow, starter band; rolls) | `out/bramble/` and in the game, commit b47c4fa (atlas 1024 by 2048, json, frames, sheet, compare, screen, gif, build) | in the game 2026-10-31 | the roll turns the face too, which reads as rolling; if Robin wants the face upright, the roll becomes a bounce |

## Characters

| Asset | Where | State | What needs work |
| --- | --- | --- | --- |
| Warrior (the player's first class) | `out/warrior/` (atlas 1024 square, 100 KB; json; frames; sheet; compare; screen; gif; build) | in the game 2026-10-31 (commit 9681845, `Game Developer/assets/warrior`; not drawn until the board scene's rewrite lands) | the hair's locks; the far leg short in the walk's passing frames; a shield or gear layers later; Rogue, Mage and Ranger on the same rig (`tools/build/warrior_vol.py --skeleton` plus `tools/hero_puppet.js`) |
| Warrior, the fresh doll (2026-11-01) | `work/doll/` (paint, sheets, sheet, screen, compare; `tools/doll.js`) | shown to Robin 2026-11-01, not delivered; built the reference's way (docs/hero-iterations.md, the fresh attempt) | Robin's word; then shrink, deliver to `out/warrior/`, and the monsters' faces to the same rules if he wants them matched |

Our player in every judging picture is this atlas (`tools/player.js` loads `out/warrior`).

## Interface

The icons and the chrome are the game's placeholders (`client/public/`, `BoardScene.ts`); not touched.
