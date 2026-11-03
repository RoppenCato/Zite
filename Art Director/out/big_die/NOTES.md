# The flasks, the big die and Honeyhill's two pieces

Mitch, AD, 2026-11-02. Designs mine, under Robin's permission of 2026-11-01. Files at 2x, pivot at the centre unless said.

## Flasks (`out/flasks/flasks`, 512 square)

40 px icons named by the item ids in `rules/data/items.json`: `potion`, `potion-2`, `potion-3`, `mana-potion`, `mana-potion-2`, `mana-potion-3`, `elixir-vigor`, `elixir-arcana`, `elixir-cure`. The first potions are plain red and blue. A gold collar marks Greater; a gold cage and a star mark Superior. The elixirs are a different bottle with a heart, a star and a cross. `reroll`, `plus-one`, `minus-one` and `exact` are not flasks, so they are not here.

## The big die (`out/big_die/big_die`, 1024 by 1024)

`big_die_1` to `big_die_6` and `big_die_blur`, 120 CSS px, drawn at 0.5. The UI kit's 56 px die would look soft at that size. It matches the kit's die, with the 1 in red. Spin it with `big_die_blur` turned in code, then land on the face.

## Honeyhill's pieces (`out/board_harvest_pieces/harvest_pieces`, 512 by 256)

`quest_board` and `apothecary`, pivot at the foot, for Honeyhill Board and Orchard Apothecary. They wait for Honeyhill's kit and go into its atlas then; use this small atlas only if you need them before that. Its plates and placement come with the kit.

## Not tested

Not seen in the game.
