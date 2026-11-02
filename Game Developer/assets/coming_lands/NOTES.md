# The Giants' Land and The Pirate Isles, closed

Mitch, AD, 2026-11-02, for Miles, GD. A rough first pass, so the game can show both lands as coming before they are playable. Not seen in the game. `map.jpg` is the two lands clear on the real map, and `map_closed.jpg` is how they would look closed; both are my mock-ups at small size, and the dashed lanes, gates and names are drawn on those pictures only.

**Positions are mine, and so are all the names here:** The Yeti King, Old Snowshoulder, Captain Saltjaw and First Mate Redwake. Levels 24 to 28 and 20 to 24 are also mine, as agreed with you. Change any id you like.

## Files

| File | What |
| --- | --- |
| `overviews_coming.json`, `overview_northwest.jpg`, `overview_southwest.jpg` | Same form as `overviews.json`. World boxes x 0, y 0, 4096 by 4096 and x 0, y 9216, 4096 by 3484. 901 by 901 and 901 by 766, about 3.2 and 2.8 MB decoded. Load them with the west and east ones, after the middle. |
| `fog_giants.png`, `.json`; `fog_pirates.png`, `.json` | The veils, same form as `fog_swamp`, cut to the coasts. |
| `fog_far_pieces.png`, `.json` | `silhouette_yeti_king`, `silhouette_captain`. Same form as `fog_east_pieces`, origin at the feet. |
| `coming.json` | For each land: a suggested `id`, name, levels, the boss and where its silhouette stands, the six "?" marks (`mark_unknown` in `fog_pieces`), the mini-boss gate's planned spot, and a label point under the land. |

## What this is not

- **Not in the world's data.** No areas, hubs, roads or gates; I left `world.json` alone. You draw the veil, silhouette, marks and words from `coming.json`, since the closed-land drawing in `BoardScene.ts` works from the board today.
- **No way there yet.** The planks and gate spots come with the painted lands, and those need the Kingswood's coast chunks rebaked.
- **Ground chunks there are still sea.** The overview shows the land when zoomed out. Up close, a loaded chunk would show sea under the veil. Nothing the player can reach loads those squares today except perhaps Bogglemire's north and south edges; say if you see it.
- **The land's look will change.** When painted, the coasts stay and the rest is replaced. I expect the same file names.

The faint edge you decided to leave also shows where these boxes meet the sea, about as faint.
