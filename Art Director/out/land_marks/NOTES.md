# Each land's banner and cover, and plates for the city and the dungeons

**In use (Miles, GD, 2026-11-03):** the two dungeon banners (`rootways`, `buried-crown`) and all three plate sets. The world lands' banners and every cover are kept but not drawn: on the painted map a land's name is words over the map, and Robin wants closed land shown as sea (2026-11-02).

Mitch, AD, 2026-11-03, for Miles, GD. Robin chose "fill the holes" and "polish and looks". Miles, GD found that every land used the Meadows' banner and cover, and that Crownhaven, the Buried Crown and the Rootways used the Meadows' plates. Designs mine. Not seen in the game. `preview.jpg` shows each banner with its name over its own cover, then the three plate sets.

## Banners: `banner_<area>.png`

Each is the Meadows' size, 400 by 60 at 0.5 (800 by 120 in the file). The middle is clear for the name, as before. Each land has its own rim colour and its sign at both ends:

| Area id | Rim | Sign |
| --- | --- | --- |
| `meadows` | green | a clover |
| `thornwood` | forest green | a leaf |
| `frostpeak` | honey gold | honeycomb |
| `bogglemire` | marsh green | a lily pad and reeds |
| `frostcrown` | ice blue | a snowflake |
| `crownhaven` | royal purple | a crown |
| `kingswood` | deep green | a pine with a gold star |
| `pirateisles` | sea blue | an anchor |
| `giantsland` | slate | a snowy peak |
| `rootways` | earth brown | a root and a red mushroom |
| `buried-crown` | crypt purple | a broken crown |

The ids are the areas' ids in `rules/data/world.json`, plus `rootways` and `buried-crown` for the dungeons. Your name text goes on top as now.

## Covers: `cover_<area>.png`

Each is the Meadows' form: 256 square, seamless soft cloud, full colour, for the tile sprite over a closed land. Each land has its own haze: green mist on the woods, golden on Honeyhill, murky green and violet on Bogglemire, white-blue on the Frostcrown, sea mist on the Isles, cold grey on the Giants' Land, earth on the Rootways and dark violet on the Buried Crown. Your 0.3 dark wash on top still suits all of them.

## Plates: `plates_city`, `plates_crown`, `plates_dungeon` (`.png` and `.json`)

Each atlas has the Meadows' eleven frames under the same names, sizes and pivots:

- `spot_wild`, `spot_town`, `spot_shop`, `spot_shop_magic`, `spot_chest`, `spot_spring`
- `spot_shrine`, `spot_board`, `spot_gear`, `spot_church`, `spot_gate`

The rims and symbols are the same, so a kind reads the same everywhere. What changes is the stone:

- **City:** pale cobble grey on a cobble path.
- **Crown:** crypt lilac on dark stone.
- **Dungeon:** root-worn tan on earth.

Use `plates_city` for Crownhaven, `plates_crown` for the Buried Crown and `plates_dungeon` for the Rootways and any dungeon after it. A kind not in an atlas, such as `spot_door` or `spot_secret`, stays where it is now.

Tool: `tools/kit/land_marks.js`.
