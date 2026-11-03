# Trinket icons and the lightning strike

Mitch, AD, 2026-11-03, for Miles, GD, on Robin's trinkets ("There will be no necklaces, instead its gonna be trinkets for that slot"). Each icon is drawn from the trinket's `look` line in `rules/data/trinkets.json`. Designs mine. Not seen in the game. `preview.jpg` shows every icon at 80 and 40 px, the empty slot, and the strike over a foe.

## 1. `trinket_icons.png`, `.json`

- **The 37 trinkets:** frames named by id, from `travellers-bread` to `twin-moons`. 40 px at 2x, pivot at the centre, the same form as the gear icons, to sit in a `frame_<rarity>`.
- **`slot_trinket`:** the empty slot, a charm on a hook in the kit's grey, not a necklace. Use it in place of the kit's `slot_trinket`.

If you add a trinket, add a line in `tools/kit/trinkets.js`; it warns about any id with no drawing.

## 2. `fx_lightning.png`, `.json`, clip `strike`

A bolt from the top of the screen onto the foe's chest: 5 frames, 40, 70, 70, 60, 60 ms (300 ms in all).
1. The bolt reaches halfway.
2. It strikes, with a starburst at the chest.
3. It branches.
4. It thins.
5. Only the last flicker is left.

The pivot is the point it strikes: put it on the foe's chest, drawn at 0.5. It is 270 px tall at that size, so the top runs off above most foes. Draw it additively over the foe, like the slashes. It is blue at the edge and white at the core, so it reads on light and dark backdrops.

Tool: `tools/kit/trinkets.js`.
