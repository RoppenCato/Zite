# Compact fight bars: three options

Mitch, AD, 2026-11-02, for Robin to pick. Robin: "maybe the health/mana bar in combat should be made a little more compact?" and "healthbars etc should be under the characters when fighting."

`compare.jpg` shows a calm fight. `busy.jpg` shows the worst case: long words and several effects at once. Both are mock-ups on the road-to-the-mill backdrop at the game's layout, with the bars starting at y 552 (16 px under the feet). The font is a stand-in, and the fills are drawn in the kit's colours by my tool.

**My pick is 1, Slim.** It takes the least ground and gives the eye one thing to read: how full the bar is. The number is still there, just outside the bar.

| Option | Hero | Enemy | Height, calm | What you would change |
| --- | --- | --- | --- | --- |
| **1. Slim** | HP 92 by 10 with the number beside it, MP 92 by 8, pips under | HP 92 by 10 with the number beside it, next move under | Hero 33, enemy 31 | `Bar` takes smaller frames and puts its number beside the bar. I add small frames to the UI kit once picked: the `bar_frame` nine-slice has a 7 px corner and cannot go below 14 tall |
| **2. The plate** | A card 130 by 44 with heart and drop icons, both bars, numbers, pips | A card 150 wide with HP and the next move | Hero 44, enemy 36 | The same `Bar` change, plus a plate piece from me. `mark_heart` and `mark_drop` are already in the kit |
| **3. Short bars** | HP 112 by 14 with the number inside, MP 112 by 11, pips under | HP 112 by 14 with the number inside, next move under | Hero 39, enemy 37 | `barW` to 112 and a smaller font. No new art: MP would stay at the kit's 14 tall frame unless I add a smaller one |

Keep the `bar_lost` drain and the pips in all three. Pips are drawn at 10 px, from `pip_full` and `pip_empty`. Status words go under the pips in 12 px, as in `busy.jpg`: long ones wrap to two lines.

## Not tested

Not in the game and not on a phone, and I have not tried them with the game's own font. The numbers at 11 and 12 px are the part most worth checking on a real phone.
