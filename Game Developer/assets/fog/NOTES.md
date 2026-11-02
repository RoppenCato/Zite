# Closed lands: mist, silhouettes and "?"

Mitch, AD, 2026-11-02. Robin said yes to showing what's ahead, dim, with the boss's silhouette and its creatures as "?". `preview.jpg` shows the whole world at the start and after King Goo, drawn from these files over `world_harvest/overview.jpg`. `phone_start.jpg` is the start at phone size, and `pieces.jpg` shows the pieces. Mock-ups, not screenshots.

## The veils

`fog_forest.png` and `fog_harvest.png`, one per closed region. Each holds the dim, the mist and the cloud banks, cut to that region's coast, so **it replaces your dimming in code**. Lay it over the overview at the world box in its `.json` (`worldX`, `worldY`, `worldW`, `worldH`), scaled by your overview's scale. They are small on purpose, 0.11 file px per world px, about 100 KB each and 1 to 1.5 MB decoded. Full colour with soft alpha: do not put them through a palette.

- **When a region opens:** fade its veil out over a second or so. Nothing is baked into the overview, so nothing else changes.
- **The Meadows have no veil:** they are open from the start.
- **The seam:** both veils have a long bank of cloud along the mountains, so neither shows a straight edge, whether the other is there or not.

## The pieces

`fog_pieces.png`, 512 square, 2x, pivot at the foot:

| Piece | What | Where |
| --- | --- | --- |
| `silhouette_goo` | King Goo | at `gate`, if you show him |
| `silhouette_grumblebark` | Grumblebark | at `briar` |
| `silhouette_queen` | Queen Bumble | at `summit`, about 40 world px lower, so her crown stays on the map |
| `mark_unknown` | "?" for a creature not met | at each ground's hub |

**Why not tint the real sprite:** a tint would work, but it means loading each boss's whole atlas, up to 8 MB, for one small picture on the map. These are about 1 MB together, with a cold rim and two yellow eyes that a tint cannot give.

They are 96 tall at scale 0.5, and in the preview, on the overview at its full size, I drew them at 0.4. Keep them one size on screen as you zoom, as with your labels, if you prefer.

The silhouettes work for the journal too, for a boss not yet met. `mark_unknown` works for its creatures.

## Not tested

Not in the game and not on a phone. Only at overview size: at play zoom, closed lands across the water still show their baked ground, as they do now.
