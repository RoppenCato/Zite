# The Arena

Mitch, AD, 2026-11-02, for Miles, GD. Robin: "The arena needs to be somewhere on its own place, with a big 'Arena building'." One round bowl in three materials, all my calls: pale stone in Cloverfield Meadows, a log palisade in Wobblewood, barn boards with a thatch rim in Honeyhill. Seats with a small crowd, a sand ring with crossed swords, a gate with a crest and two towers. Nothing is painted into the chunks. It is a sprite, so the three spots keep their roads.

`arena_all.jpg` shows all of it: open, closed, zoom 0.3. `open.jpg`, `closed.jpg`, `far.jpg`, `overview.jpg` and `gate_close.jpg` are the parts. Drawn from the delivered atlas on the delivered ground, without the game's chrome. Not yet seen in the game or on a phone.

## Files

- `arena.png`, `arena.json`: the atlas, 1024 square, 81 KB on disk, 4 MB in memory. Each frame's `pivot` is its origin.
- `arena_places.json`: where each building stands, and the numbers below.

## Drawing it

Files are at 1.5x, not the usual 2x. **Draw at scale 0.6667**, the `scale` in `arena_places.json`.

| Region | Spot, unchanged | Building origin, at the gate | Gate faces | Size in world px, with flags |
| --- | --- | --- | --- | --- |
| Meadows | `farrows` 3113,6979 | 3113,6919 | the camera | about 325 by 300 |
| Forest | `stumprise` 6920,4960 | 6920,4900 | the camera | about 325 by 300 |
| Honeyhill | `oldpress` 1760,2360 | 1736,2303 | lower right | about 325 by 300 |

**The ids:** `meadows`, `forest`, `harvest`. Frames are `arena_<id>`, `arena_doors_<id>`, `arena_flag_<id>`, `arena_far_<id>`.

**Open:** the body, plus `arena_flag_<id>` at each entry in `flags`, offsets from the building's origin in world px. They can wave with a small scaleX tween, with the origin at the pole.

**Closed:** the body plus `arena_doors_<id>` at the building's origin, and no flags. The poles stay bare, which is the banners down.

**Depth:** use `standingDepth(footY)` for the body and put the flags and doors just above it. `footY` is the wall's lowest point, so the player on the spot stands in front. Flags and doors use the same origin scale.

**Why Honeyhill's gate is turned (mine):** the `oldpress` road comes in from the upper right, so a gate facing the camera would put the building on top of the road. Turned, the ring stands up and to the left and the road stays clear. `oldpress` stays the spot; `fallow` has the same problem.

## Take these out of placement

They stand where the building now stands. `remove` in `arena_places.json` lists them.

- Meadows: `pine_b` 3053,6906
- Forest: `fir_a` 6809,4866 and `stump` 6978,4905
- Honeyhill: `barrel` 1789,2304 and `sack` 1703,2332

No spot or road runs under a ring. Baked trees under a ring are covered by it. Those behind it show above the far wall, which looks right.

## Far off

- It reads as a ring at zoom 0.12 as well as close up, in `overview.jpg`, as long as the sprite is drawn at every zoom. It is not in the overview pictures, so hide it there and it is gone.
- **Far frame:** in my pictures the big frame is smoothed well, but Phaser's plain scaling may sparkle when it is that small. `arena_far_<id>` is the same building with flags, at 0.3 file px per world px. Draw it at scale `farScale` (3.3333) with its own pivot, when the camera is under about 0.4 in design terms. Use it only if the big one sparkles. It has no closed version: dim it, or leave it.

## Not done

- Not in the game and not on a phone. Spot plates and sizes are from the delivered files; the token in the pictures is the Knight's stand.
- The fight backdrop stays the region's own, as you said.

Tool: `tools/world/arena.js`.
