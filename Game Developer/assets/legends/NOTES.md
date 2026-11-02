# The legendary weapons and six more flasks

Mitch, AD, 2026-11-02, for Miles, GD. Robin: "some weapons with unique cool looks that are rare to find or drop from bosses. Like a flaming sword or a massive shining axe, with epic names." The designs, names and tiers are mine; numbers and where they drop are yours. Not seen in the game. I checked them on the class in `preview.jpg`, at the stand and at the blow.

## The twelve

Copy the whole folder. Each has its own atlas, `out/legends/<id>/<id>.png` and `.json`, so it costs nothing until worn. Each is about 0.5 to 1 file of 1024 square when loaded; most are 1024 by 1024 or 1024 by 2048 (`legends.json` lists each size, class, tier and prefix). On disk they total about 0.7 MB.

| Weapon | Id | Frame prefix | Class | Tier | Look |
| --- | --- | --- | --- | --- | --- |
| Greenheart | `greenheart` | `greenheart_sword` | Warrior | 2 | Living wood, vines, leaves that stir |
| Emberbrand | `emberbrand` | `emberbrand_sword` | Warrior | 3 | The flaming sword |
| Winter's Edge | `winters_edge` | `winters_edge_sword` | Warrior | 5 | Old ice, shards, a cold glitter |
| Dawnbreaker | `dawnbreaker` | `dawnbreaker_sword` | Warrior | 7 | The massive shining axe, rays turning |
| Viperfang | `viperfang` | `viperfang_dagger` | Rogue | 2 | A curved green fang that drips |
| Nightsong | `nightsong` | `nightsong_dagger` | Rogue | 4 | Night-coloured, a slow glitter of stars |
| Redtide | `redtide` | `redtide_dagger` | Rogue | 6 | Red pirate steel, a wake of spray |
| Sunspire | `sunspire` | `sunspire_staff` | Mage | 3 | A small sun on a white staff |
| Stormcaller | `stormcaller` | `stormcaller_staff` | Mage | 5 | A caged storm, lightning |
| Worldkindle | `worldkindle` | `worldkindle_staff` | Mage | 7 | A gold ring round the first flame |
| Galewhisper | `galewhisper` | `galewhisper_bow` | Ranger | 3 | Green, white feathers, curling wind |
| Starfall | `starfall` | `starfall_bow` | Ranger | 7 | Gold and night, stars falling |

## How to wear them

- **Same frames and clips as the class's weapon:** `<prefix>/<clip>/<nnnn>`, the same 26 frames, the same pivots at the feet, read with the same `clips.json`, in the weapon's place in the draw order. Today's slot is `<rank>_<part>` on one atlas; these need that one lookup to take the weapon's own atlas instead.
- **What moves:** flames, sparks, rays and lightning differ in every frame, so they move with the clip by themselves. No code, and no extra frames. With `stand` at 4 frames of 150 ms the flicker is a little slow; you can run the weapon at a quicker rate than the body if you want a livelier flame. Tell me if you would rather have a separate glow layer.
- **The Warrior's axe sits in the sword slot,** with the sword's frames.
- **Icons:** `icons.png` and `icons.json`, frames named by the prefix, 40 px at 2x, the same drawing, to sit in a `frame_<rarity>`.

## The flasks

`out/flasks/flasks.png` and `.json` now also hold `potion-4`, `potion-5`, `mana-potion-4`, `mana-potion-5`, `elixir-vigor-2` and `elixir-arcana-2`, recopy both. Grand adds a jewel on the bottle, Royal adds a crown as well, and the Great elixirs have a crown and a stronger colour. `preview.jpg` beside them shows all 15.

I have not done the optional set-piece icon or tint.
