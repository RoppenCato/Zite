# The top bar: three options

Mitch, AD, 2026-11-02, for Robin to pick. Robin: "have AD redesign the top bar so it looks better." It holds everything Miles, GD listed, including the new XP bar and a "next goal" line.

`compare.jpg` shows the three on the game's band and bottom panel. `closeup.jpg` shows the top of each, once as it stands and once at its worst: a big gold number, low HP, a long goal. `1_tidy.jpg`, `2_portrait.jpg` and `3_slim.jpg` are one screen each at 824 by 1830. Mock-ups, with a stand-in font.

**My pick is 2, The Portrait.** It gives the bar a face, and that face changes with what you wear, which suits Robin's "equipment must show" (2026-11-01).

| Option | What it is | Good | Less good |
| --- | --- | --- | --- |
| **1. Tidied** | Today's plank in clear rows: name and level, HP and MP side by side, XP full width, gold and place | The smallest change | Plain, and the most small words |
| **2. The Portrait** | The hero's head in a round frame with the level on it; three bars stacked; place and goal on one ribbon | Most character, easiest to read the bars | Long place names and goals will need trimming on the ribbon |
| **3. The Slim Bar** | A level medal, thinner plank, XP along its foot; place and goal as two small hanging signs | 28 px more map | Everything is smaller, and the signs sit over the map |

## Height

**100 stays.** Options 1 and 2 keep it, and their sign or ribbon hangs about 20 to 27 px over the map, so nothing else moves. Option 3 draws only 74 of the 100, so the map shows behind the rest. No screen has to shift.

## The next goal

**Keep it at the top, not in the bottom panel.** The bottom panel is the game talking to you and it changes all the time. A goal is a standing note about what you are working towards, so it belongs with your status. All three hang it from the bar.

`Next:` in rust, then the goal in dark, on `board_slip`, 12 px.

## What the game would change

Once Robin picks, I will send exact positions and these new pieces: `bar_xp` (the gold fill, as `bar_mp_s`), and for option 2 the round portrait frame and level badge. The hero's head in option 2 is the same stack as the Hero sheet's, clipped to a circle, and redrawn only when gear changes.

## Not tested

Not in the game and not on a phone, and not with the game's own font. On option 2 the XP percentage inside the bar is very small, 7.5 px, and can go.

# Robin's pick: 3, The Slim Bar (2026-11-02)

Robin: "The slim bar, 3." Build this one. Recopy `out/ui/` for the new pieces: `medal_level`, `bar_frame_xp`, `bar_xp`. `bottom_bar/compare.jpg` shows it drawn from those pieces.

Design px in the 412 column. On a wider screen, stretch the plank and keep the rest in the column.

| What | Piece | x | y | w | h |
| --- | --- | --- | --- | --- | --- |
| Plank | `panel_hud` | 0 | 0 | 412 | 74 |
| Level medal, centre (34, 30). `Lv` 9.5 px on y 22, the number 17 px on y 34, both dark `#3a2410` | `medal_level` | | | 48 | 48 |
| Name and title, 14.5 px, centred on y 13 | | 66 | | | |
| HP bar, number 10.5 px | `bar_frame`, `bar_hp` | 66 | 23 | 158 | 14 |
| MP bar, number 9.5 px | `bar_frame_s`, `bar_mp_s` | 66 | 38 | 158 | 12 |
| Gold coin 18 px, centre (240, 22); the number 15.5 px from x 253 | `item_gold` | | | | |
| Link status, 11 px, on y 44 | | 240 | | | |
| Die, centre (370, 30), 46 px, in a 52 square dark box at (344, 4) | `die_*` | | | | |
| XP frame | `bar_frame_xp` | 12 | 57 | 388 | 9 |
| XP fill | `bar_xp` | 14 | 58.5 | 384 × share | 6 |
| Place sign, the region's name 11.5 px at x 24 | `board_slip` | 12 | 76 | 184 | 24 |
| Goal sign, `Next:` in rust at x 252, the goal in dark, 12 px | `board_slip` | 240 | 76 | 160 | 24 |
| Ropes, two for each sign, at x 34, 150, 262, 378, from y 72 to 80 | drawn | | | | |

**The map:** the plank is 74 and the signs reach to y 100. So the board's camera can start at y 74, with 26 px more map, and the signs hang over it. Other screens keep `HUD_HEIGHT` 100: their sheets and the fight can draw over the plank's foot as they do now, or start at 74 if you prefer. Your call.

**The fight:** the same bar. The signs can go, since the fight has its own title: show the plank alone.

**Place names:** only the region fits the sign. `Cloverfield Meadows`, not the spot's name. Say if you would rather have the spot.

**Long goals:** the goal sign holds about 20 letters at 12 px. "1 skill point waiting" only just fits, so keep them short or grow the sign leftward.

## Seen in the game (2026-11-02)

`in_game.jpg` and `in_game_top.jpg`, at 412 by 915 with the XP bar at 67%. A fresh server, with a copy of the pane's save and test XP. Also looked at 600 wide: the plank stretches, the rest stays in the column, as planned. The fill's length matches the XP. Not seen on a phone, and a fight not looked at.

**Two changes I asked for:** `Lv` to y 20 and the number to y 35, so they stop touching; the message text bold, like the signs (mine).
