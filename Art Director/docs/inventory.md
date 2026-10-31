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
| Turnip Grump (meadow, level 1 to 10 band) | `out/turnip/` (atlas, json, frames, sheet, compare, gif, build) | delivered 2026-10-31 | the atlas is about 1 MB at 2x: a pngquant pass; `attack1` has no flash or dust at the impact; the four other meadow candidates wait for Robin's pick |

## Characters

| Asset | Where | State | What needs work |
| --- | --- | --- | --- |
| Warrior (the player's first class) | `out/warrior/` (atlas 1024 square, 100 KB; json; frames; sheet; compare; screen; gif; build) | in the game 2026-10-31 (commit 9681845, `Game Developer/assets/warrior`; not drawn until the board scene's rewrite lands) | the hair's locks; the far leg short in the walk's passing frames; a shield or gear layers later; Rogue, Mage and Ranger on the same rig (`tools/build/warrior_vol.py --skeleton` plus `tools/hero_puppet.js`) |

Our player in every judging picture is this atlas (`tools/player.js` loads `out/warrior`).

## Interface

The icons and the chrome are the game's placeholders (`client/public/`, `BoardScene.ts`); not touched.
