# The bottom bar: three options

Mitch, AD, 2026-11-02, for Robin to pick. Robin: "you will need to fix the bottom bar so it fits well with the new top bar."

`compare.jpg` shows the three under the slim top bar, on the game's map. `busy.jpg` shows the foot of each with dice cards up and a long message. `1_middle.jpg`, `2_right.jpg` and `3_rows.jpg` are one screen each at 824 by 1830. Mock-ups, with a stand-in font.

**My pick is 1, Roll in the middle.** Roll is what you press most, and the middle is where either thumb finds it. It is also the thinnest, and its big rounded button answers the round level medal at the top.

| Option | Height | Map gained, against today's 175 | Good | Less good |
| --- | --- | --- | --- | --- |
| **1. Roll in the middle** | 80 | 95 px less the sign | Thinnest, tall buttons with icons, Roll for either thumb | Roll is smaller than today |
| **2. Roll on the right** | 92 | 83 px less the sign | Roll is big and right-handed | The four small buttons are 36 tall, under the comfortable 44; awkward for a left thumb |
| **3. Two thin rows** | 112 | 63 px less the sign | The smallest change; widest Roll | The least map, and the small buttons are 36 tall |

## What is the same in all three

- **The message** moves onto a sign on two posts, standing just above the plank, so it matches the signs under the top bar and the map shows either side of it. It grows to two lines. The log button is the scroll inside its left end.
- **The dice cards** stand above the sign, as chips, where the map is.
- **New icons:** `icon_map`, `icon_hero`, `icon_quests`, `icon_settings`, 32 square, in `out/ui/` now.
- **The die on Roll** is a small touch: it can show the last roll, or simply a 4 at rest.

## What the game would change

The board's camera can run down to the plank's top, so `VIEW_HEIGHT` grows on the board only. Other sheets keep their size. Exact positions come when Robin picks.

## Not tested

Not in the game and not on a phone, and not with the game's own font.

# Robin's pick: 1, Roll in the middle (2026-11-02)

Robin: "Go for 1." Build this one. `1_middle.jpg` is the screen at 824 by 1830, and the left of `busy.jpg` is the foot with cards up and a long message. All pieces are in `out/ui/`.

Design px in the 412 column. On a wider screen, stretch the plank and keep the rest in the column.

| What | Piece | x | y | w | h |
| --- | --- | --- | --- | --- | --- |
| Plank | `panel_bottom` | 0 | 835 | 412 | 80 |
| Map: icon 31 px, centred at 40% of the button's height; label 10.5 px, 11 above its foot | `btn_plain_small`, `icon_map` | 8 | 846 | 64 | 60 |
| Hero | `btn_plain_small`, `icon_hero` | 76 | 846 | 64 | 60 |
| Quests | `btn_plain_small`, `icon_quests` | 272 | 846 | 64 | 60 |
| Settings | `btn_plain_small`, `icon_settings` | 340 | 846 | 64 | 60 |
| Roll, rising 11 px above the plank; `die_*` 34 px at (206, 852), `Roll` 19 px on y 887 | `btn_action_big` | 146 | 824 | 120 | 84 |
| Message sign, its foot at y 814: 38 tall for one line, 54 for two; it grows upward | `board_plain` | 14 | | 384 | 38 or 54 |
| Its parchment, inset 6 at the sides and 5 top and bottom | `board_slip` | 20 | | 372 | |
| Two posts, 8 wide, centres x 30 and 382, from 8 below the sign's top to y 828, drawn before the sign | drawn | | | | |
| Log button: `mark_scroll` 18 px, centre x 36, tap zone 36 wide, the sign's height | `mark_scroll` | | | | |
| Message, centred on x 212, wrap at 324 | | | | | |
| Dice cards: `chip_idle`, 34 tall, centred on x 206, their foot 4 above the sign's top | `chip_idle` | | | | |

**The posts' colours:** ink `#2a2030`, then 5 wide inside it in `#8a5a34`.

**The die on Roll:** the last roll's face, as the top bar's die has. At rest it can be any face. While a fight, a walk or a sheet is on and Roll is off, use `btn_action_big_dim`, as you do now, and dim the die to match.

**One logic note:** the top bar's die and this one show the same number. If you would rather keep only one, keep the top's and put a plain `Roll` here, bigger, 22 px: it costs nothing and I would not mind.

**The map:** the board's camera can run from y 74 to the plank's top at y 835, with the sign standing over it. The tappable map stops at 824 behind Roll's width and at the sign where it stands. Other screens' sheets stay as they are, from y 108 to 732, so they will have a little map showing under them, or you can let the dim run to the plank.

**The message's font:** the mock-up has 13 px. Keep `settings.font` as you have it, and grow the sign to fit if a larger font wraps.
