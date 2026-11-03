# The Cloverfield Meadows fight backdrop, second pass

Mitch, AD, 2026-11-02, from Robin's note: "make combat feel like a real scene from Enchanted Kingdoms, not a prototype battle layer with placeholder scenery."

**Three directions for Robin to compare. Wire none of them until he picks.** My pick is A. Copy the chosen folder over `assets/meadow_fight/`.

## The directions

| | What it is | Its one idea |
| --- | --- | --- |
| **A. The road to the mill** | The two stand on the world's own road, in a worn clearing. It runs back to a windmill on a hill, with a far castle beyond | You stopped on the road, partway somewhere |
| **B. The patchwork** | A high horizon, little sky, farm fields and hedges down the hills, stepping stones between the fighters | The richest depth and the busiest |
| **C. The old stones** | An oak frames the top, standing stones with faint runes on a mound, a mushroom ring on the lawn | The most magical, and the least like the map |

## Why A (mine)

- It uses the overworld's road colours, so the fight reads as a place on the map you just left.
- The road gives the fighters a clear floor, and it sets feet apart from grass better than the lawns of B and C.
- The hills, the mill and the castle give it depth without crowding the fighters.

## What changes in the game

No code, only the `meadow` entry in `BACKDROPS` (`client/src/backdrop.ts`). The numbers for each direction are at the end of this file.

- **`feet` goes from 14 to 46.** This is the biggest change to how they sit: the ground now runs behind them as well as in front. It also gives a tall boss 32 px more room.
- **The ground line stays at 490 and the band's bottom at 640.** `heroX` and `enemyX` stay at 66 and 318: I kept the spacing Robin asked for.
- **The soil colour changes to grass**, in case anything shows past a strip.
- **The strips are 512 wide, not 1024.** Only x 0 to 412 shows, and I composed for that window, so tiling starts at x 0 as it does now. Do not start a strip at a random offset, or the framing is lost.
- **Clouds are a strip of their own, and they are the only thing that drifts.** Today's far strip drifts its hills too, so set `far` to `drift: 0`.
- **Foreground accents are part of `ground.png`.** They sit below the fighters' feet, so nothing passes in front of the fighters and no new draw step is needed.

## Keeping it readable

- Nothing tall stands near either fighter. The field edge behind them stays below their knees, except for the framing trees at the screen's sides.
- The small grass tufts and pebbles stay clear of where feet land.
- Things get paler with distance, ink included. Only the near layers and the ground have full-strength ink.
- There are no gradients except the sky you already draw.

## Not tested

- **Not seen in the game or on a phone.** `screen.jpg` is a mock-up: the panels are the UI kit's and the layout is the game's numbers, but the bars, buttons and words are drawn by my tool.
- **Creature sizes and positions in the pictures are the atlas's own.** Your `Figure` may scale or lift them differently, especially the Bee.
- **Effects:** I have not checked the ability effects over these backgrounds.
- **The memory figures below are worked out from the file sizes,** not measured on a phone.
