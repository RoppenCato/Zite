# The fight's name board

Mitch, AD, 2026-11-02. Robin chose the short bars, then concept 1, The name board. His words on the text: "It doesnt look like its part of the board. Maybe its better with some sort of wooden board, where the hp, mp, valor etc are on the upper part, and text on the lower?"

`final.jpg` shows it three ways: with a word on the hero's slip, with no slip, and with long words. `final_phone.jpg` is one screen at 824 by 1830. They use only the delivered kit pieces at the numbers below, but the font is a stand-in, so they are mock-ups. `compare.jpg`, `busy.jpg` and `closeup.jpg` are the three concepts, kept for the record.

## The pieces: recopy `out/ui/` whole

All are in `ui.png` and `ui.json`, as nine-slices with `nine` in the json.

| Piece | Design size | What |
| --- | --- | --- |
| `board_plank` | 64 by 48 | The board under each fighter |
| `board_slip` | 48 by 24 | The parchment slip for the words |
| `bar_frame_s` | 48 by 11 | The MP frame |
| `bar_mp_s`, `bar_lost_s` | 24 by 7 | The MP fill, and its lost part |

HP uses the kit's `bar_frame`, `bar_hp` and `bar_lost` as now. The other frames in the atlas keep their names.

## The layout

Design px, in the 412 column, with the feet at y 536. These are left and top edges. All are drawn on a depth below the fighters' effects, as the bars are now.

**The hero**

| What | x | y | w | h |
| --- | --- | --- | --- | --- |
| Plank, no words | 6 | 552 | 134 | 49 |
| Plank, with words | 6 | 552 | 134 | 49 + lines × 14.5 + 9 |
| HP bar, number 11 px | 15 | 558 | 116 | 14 |
| MP bar, number 9.5 px | 15 | 573 | 116 | 11 |
| Meter's name, 10.5 px, centred on y 592 | 16 | | | |
| Five pips, 10 px with a gap of 2 | 73 | 587 | | |
| Slip, only when there are words | 12 | 599 | 122 | lines × 14.5 + 5 |
| Words, 12 px, wrap at 116, first line centred on y 608, centre x 73 | | | | |

**The enemy**

| What | x | y | w | h |
| --- | --- | --- | --- | --- |
| Plank | 232 | 552 | 172 | 35 + lines × 15 |
| HP bar, number 11 px | 241 | 558 | 154 | 14 |
| Slip | 238 | 577 | 160 | lines × 15 + 5 |
| Words, 12.5 px, wrap at 152, first line centred on y 586, centre x 318 | | | | |

The enemy's slip is always there: `next:` is nearly always showing. If it is ever empty, leave out the slip and make the plank 26 tall.

## The words

- **Colour:** dark `#3a2410` with no stroke, on the slip. They replace the outlined `#ffd166` and `#b8fff4`.
- **`next:`** is drawn in rust `#a23c2c`, then the move in the dark colour. It is two text objects, or one with a colour stop.
- **Line breaks:** if the words do not fit on one line, break at each ` · ` first, then wrap each part. No number is left alone on a line.
- **Room:** the hero fits 2 lines and the enemy 3 before reaching y 640. Beyond that, keep the first lines: the move matters most, so put it first, as you do now.
- **Meter's name** stays cream `#f7efdc` with a `#3a2410` stroke of 2.5, on the wood, and the pips and name replace the `Valor ●●○○○` text in the words.
- **Numbers in the bars** lose the `HP` and `MP` label: `46/120`. The colour and the place say which is which.

The bar's `bar_lost` drain stays as it is.

## Not tested

Not in the game and not on a phone, and not with the game's own font. A wider font may need the wrap widths brought in. The longest word on the slip is the thing to check.
