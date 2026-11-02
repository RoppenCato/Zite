# The UI kit

Mitch, AD, 2026-11-01. Copy the whole folder. Design pixels; the files are 2x, so draw them at 0.5. `ui.png` + `ui.json` hold
everything inked (a palette PNG); `ui_soft.png` + `ui_soft.json` hold the two soft gradients, full colour, never shrunk. Each
nine-slice frame carries its corner as `nine` in `ui.json`, in file pixels.

## How it is meant to feel

- **The press:** swap `_idle` to `_pressed` on touch, squash the button to about 0.97 high, move its words down with the face,
  and pop back with a small overshoot on release. Play `fx_tap` at the finger, tinted to the button.
- **Choosing:** swap `_idle` to `_chosen`, with one `fx_spark` at the card's corner.
- **A lit spot tapped:** `fx_ripple` on the board at the spot, flat, under the token.
- **The die:** `die_blur` while it spins, turned in code; land on the face with a small overshoot, with `die_glow` tinted gold
  behind it, fading over about 400 ms.
- **Bars:** `bar_lost` sits behind the fill at the old value and drains to the new one, with `fx_tick` above the bar.

Banners: the ribbon's face is about 58 px tall inside the 80, from y 5 to y 63; centre the words at y 34.

Text colours: cream `#f7efdc` on wood and on the coloured buttons, ink `#2a2030` on parchment and on cards.

## Not done

**The two fonts.** My choice is Fredoka for titles and numbers and Nunito for lines, both from Google Fonts. The files are not
in this folder until they are downloaded. The wordmark, the app icon and the character-screen backdrop are the last drop.

Clips: `fx_tap` (5 frames), `fx_spark` (4 frames), `fx_ripple` (5 frames), `fx_tick` (3 frames); frames named `<clip>/0001`.

The rarity colours are read from the game's `layout.ts`: common #e8e4d8, uncommon #6fcf7a, rare #5aa9ff, epic #c084fc, legendary #ffb347, unique #ff9f43.

## The pieces

| Piece | What | Size (design px) | Nine-slice corner |
| --- | --- | --- | --- |
| `panel_hud` | the HUD band; text cream #f7efdc | 64 by 64 | 16 px |
| `panel_bottom` | the bottom band under the board; text cream | 64 by 64 | 16 px |
| `panel_message` | the message box; text ink #2a2030 | 64 by 64 | 16 px |
| `panel_sheet` | a modal sheet (shop, bag, atlas, settings): parchment in a wood frame; text ink | 64 by 64 | 16 px |
| `card_class_idle` | a class card on the character screen, idle | 96 by 64 | 16 px |
| `card_class_chosen` | a class card on the character screen, chosen | 96 by 64 | 16 px |
| `row_shop_idle` | a shop row, idle | 96 by 56 | 16 px |
| `row_shop_chosen` | a shop row, chosen | 96 by 56 | 16 px |
| `row_bag_idle` | a bag row, idle | 96 by 56 | 16 px |
| `row_bag_chosen` | a bag row, chosen | 96 by 56 | 16 px |
| `row_atlas_idle` | an atlas row, idle | 96 by 56 | 16 px |
| `row_atlas_chosen` | an atlas row, chosen | 96 by 56 | 16 px |
| `chip_idle` | a chip in the row under the board, idle | 64 by 40 | 16 px |
| `chip_chosen` | a chip in the row under the board, chosen | 64 by 40 | 16 px |
| `btn_action_big_idle` | the big action: Roll, Begin, Continue, idle; words sit 3 px above centre | 72 by 66 | 22 px |
| `btn_action_big_pressed` | the big action: Roll, Begin, Continue, pushed in: the lip gone, the face lower and darker; words sit 3 px below centre | 72 by 66 | 22 px |
| `btn_action_big_dim` | the big action: Roll, Begin, Continue, dim | 72 by 66 | 22 px |
| `btn_action_small_idle` | the big action: Roll, Begin, Continue, idle; words sit 3 px above centre | 56 by 50 | 18 px |
| `btn_action_small_pressed` | the big action: Roll, Begin, Continue, pushed in: the lip gone, the face lower and darker; words sit 3 px below centre | 56 by 50 | 18 px |
| `btn_action_small_dim` | the big action: Roll, Begin, Continue, dim | 56 by 50 | 18 px |
| `btn_plain_big_idle` | plain: Map, World, Bag, Log, Back, Close, idle; words sit 3 px above centre | 72 by 66 | 22 px |
| `btn_plain_big_pressed` | plain: Map, World, Bag, Log, Back, Close, pushed in: the lip gone, the face lower and darker; words sit 3 px below centre | 72 by 66 | 22 px |
| `btn_plain_big_dim` | plain: Map, World, Bag, Log, Back, Close, dim | 72 by 66 | 22 px |
| `btn_plain_small_idle` | plain: Map, World, Bag, Log, Back, Close, idle; words sit 3 px above centre | 56 by 50 | 18 px |
| `btn_plain_small_pressed` | plain: Map, World, Bag, Log, Back, Close, pushed in: the lip gone, the face lower and darker; words sit 3 px below centre | 56 by 50 | 18 px |
| `btn_plain_small_dim` | plain: Map, World, Bag, Log, Back, Close, dim | 56 by 50 | 18 px |
| `btn_danger_big_idle` | danger: Drop, Flee, idle; words sit 3 px above centre | 72 by 66 | 22 px |
| `btn_danger_big_pressed` | danger: Drop, Flee, pushed in: the lip gone, the face lower and darker; words sit 3 px below centre | 72 by 66 | 22 px |
| `btn_danger_big_dim` | danger: Drop, Flee, dim | 72 by 66 | 22 px |
| `btn_danger_small_idle` | danger: Drop, Flee, idle; words sit 3 px above centre | 56 by 50 | 18 px |
| `btn_danger_small_pressed` | danger: Drop, Flee, pushed in: the lip gone, the face lower and darker; words sit 3 px below centre | 56 by 50 | 18 px |
| `btn_danger_small_dim` | danger: Drop, Flee, dim | 56 by 50 | 18 px |
| `fx_tap/0001` | the tap ring: 5 frames, 40 ms | 64 by 64 |  |
| `fx_spark/0001` | a small sparkle for a chosen card or chip: 4 frames, 50 ms | 32 by 32 |  |
| `fx_ripple/0001` | the ripple for a lit spot tapped, flat to the board: 5 frames, 50 ms | 64 by 64 |  |
| `fx_tick/0001` | a tick for a bar that moved: 3 frames, 60 ms; rises and fades | 32 by 32 |  |
| `die_1` | the die's faces; 56 square | 56 by 56 |  |
| `die_blur` | the die spinning: swap it with the faces, turning it in code | 56 by 56 |  |
| `bar_frame` | the bar's frame, 160 by 14 when stretched | 48 by 14 | 7 px |
| `bar_hp` | the HP fill | 24 by 10 | 5 px |
| `bar_mp` | the MP fill | 24 by 10 | 5 px |
| `bar_lost` | the part just lost, behind the fill, draining away | 24 by 10 | 5 px |
| `board_plank` | the fight's name board under each fighter; stretch it to size | 64 by 48 | 12 px |
| `board_plain` | a plank with no grain, for wide boards where stretched grain would show | 64 by 48 | 12 px |
| `cubby_plain` | a bag slot holding a flask or a card | 52 by 52 |  |
| `cubby_empty` | an empty bag slot, 52 square; scale it for the worn slots at 46 | 52 by 52 |  |
| `cubby_common` | a bag slot holding common gear | 52 by 52 |  |
| `cubby_uncommon` | a bag slot holding uncommon gear | 52 by 52 |  |
| `cubby_rare` | a bag slot holding rare gear | 52 by 52 |  |
| `cubby_epic` | a bag slot holding epic gear | 52 by 52 |  |
| `cubby_legendary` | a bag slot holding legendary gear | 52 by 52 |  |
| `cubby_unique` | a bag slot holding unique gear | 52 by 52 |  |
| `cubby_chosen` | the gold ring round the tapped slot, drawn over it | 58 by 58 |  |
| `badge_count` | the count on a slot, words in cream at 10.5 px | 22 by 15 | 7 px |
| `badge_plus` | a gold + on a skill that can be learned | 18 by 18 |  |
| `board_slip` | the parchment slip on the name board; words in dark ink, no outline | 48 by 24 | 8 px |
| `bar_frame_s` | the small bar frame, for MP on the name board, 11 tall | 48 by 11 | 5 px |
| `bar_mp_s` | the MP fill for the small frame, 7 tall | 24 by 7 | 3 px |
| `bar_lost_s` | the part just lost, for the small frame, 7 tall | 24 by 7 | 3 px |
| `pip_empty` | the class meter, empty | 12 by 12 |  |
| `pip_full` | the class meter, full | 12 by 12 |  |
| `slot_weapon` | an empty weapon slot | 40 by 40 |  |
| `slot_shield` | an empty shield slot | 40 by 40 |  |
| `slot_helm` | an empty helm slot | 40 by 40 |  |
| `slot_armour` | an empty armour slot | 40 by 40 |  |
| `slot_gloves` | an empty gloves slot | 40 by 40 |  |
| `slot_boots` | an empty boots slot | 40 by 40 |  |
| `slot_cape` | an empty cape slot | 40 by 40 |  |
| `slot_trinket` | an empty trinket slot | 40 by 40 |  |
| `item_honey_tonic` | Honey Tonic | 40 by 40 |  |
| `item_moon_dew` | Moon Dew | 40 by 40 |  |
| `item_do_over` | Do-Over | 40 by 40 |  |
| `item_hop` | Hop | 40 by 40 |  |
| `item_hold` | Hold | 40 by 40 |  |
| `item_fairy_pick` | Fairy Pick | 40 by 40 |  |
| `item_gold` | a gold coin | 40 by 40 |  |
| `item_key` | a vault key | 40 by 40 |  |
| `spot_wild` | wilds | 32 by 32 |  |
| `spot_town` | a town | 32 by 32 |  |
| `spot_shop` | a shop | 32 by 32 |  |
| `spot_chest` | a chest | 32 by 32 |  |
| `spot_spring` | a spring | 32 by 32 |  |
| `spot_shrine` | a shrine | 32 by 32 |  |
| `spot_boss` | the boss | 32 by 32 |  |
| `frame_common` | rarity frames round a 32 px icon space; the middle is clear; common, uncommon, rare, epic, legendary, unique | 48 by 48 |  |
| `mark_lock` | a lock (a vault, a closed area) | 32 by 32 |  |
| `mark_clock` | a clock (a cooldown) | 32 by 32 |  |
| `mark_star` | a star (xp) | 24 by 24 |  |
| `mark_heart` | a heart | 24 by 24 |  |
| `mark_drop` | a drop of mana | 24 by 24 |  |
| `mark_online` | an online dot | 24 by 24 |  |
| `mark_scroll` | a note left on a spot | 32 by 32 |  |
| `mark_alert` | a "!" badge (a mini-boss) | 40 by 40 |  |
| `mark_dollar` | a "$" badge (a merchant) | 40 by 40 |  |
| `mark_ring` | a tap ring, static, white | 40 by 40 |  |
| `banner_level` | a level-up banner, 360 by 80 when stretched (nine-slice, stretch it sideways only); words in ink | 120 by 80 | 48 px |
| `banner_boss` | a boss-defeated banner, the same; words in cream | 120 by 80 | 48 px |
| `banner_area` | an area-opened banner, the same; words in cream | 120 by 80 | 48 px |
| `die_glow` | the settled glow behind the die, white; tint it gold | 96 by 96 |  |
| `burst_levelup` | the level-up burst, white; tint gold, scale up and fade in code | 256 by 256 |  |
