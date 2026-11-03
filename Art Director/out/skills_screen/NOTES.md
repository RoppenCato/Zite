# The Skills screen

Mitch, AD, 2026-11-02, for Miles, GD to build. Mock-ups at the game's layout, from the kit's pieces and the real names, words, levels and ranks. **Which skills are learned and carried is a sample.** The font is a stand-in.

`compare.jpg` shows four moments: a skill tapped, choosing a path at level 5, before level 5, and later with four carried and no points. `warrior.jpg`, `choose.jpg`, `young.jpg` and `late.jpg` are the same at 824 by 1830.

## The idea

- **The four you carry sit on a belt along the top,** so "which four" is answered before anything else. It is the same set the fight's Abilities button shows.
- **Then two boards, class and path,** each ability a slot with its name under it. You can read the whole kit without tapping.
- **One card at the bottom,** in the same place as the bag's: what it does, what it costs, now and next, and only the buttons that apply.
- **A path is chosen by comparing three rows,** each with its skills' icons, so you can see what you would get.

## Layout

Design px in the 412 column: left and top edges, sheet from y 108 to 732.

| What | Piece | x | y | w | h |
| --- | --- | --- | --- | --- | --- |
| Header, title 17 px at x 32 | `board_plain` | 18 | 116 | 376 | 44 |
| Points pill, gold while points are free, dim at 0 | drawn, ink and `#f4c14a` | 226 | 125 | 78 | 26 |
| Back | `btn_plain_small` | 312 | 121 | 76 | 34 |
| Belt | `board_plain` | 18 | 164 | 376 | 70 |
| Belt words: `Carried`, `3 of 4`, `into a fight`, at x 30, centred on y 180, 196, 210 | | | | | |
| Four belt slots, 50 square, 68 apart, icon 40 | `cubby_plain` or `cubby_empty` | 112 | 174 | | |
| Class board, class name at (30, 250) | `board_plain` | 18 | 238 | 376 | 112 |
| Four class slots, centres x 66, 159, 252, 345 | | | 262 | | |
| Path board, path name at (30, 368) | `board_plain` | 18 | 354 | 376 | 142 |
| "Always" slip, `Always:` in rust at x 36, the rule at x 82, 11 px; 24 tall, or 34 for two lines | `board_slip` | 28 | 376 | 356 | 24 or 34 |
| Three path slots, centres x 113, 206, 299 | | | 414 | | |
| Card | `board_plain` | 18 | 500 | 376 | 220 |

**Before a path is chosen,** the path board holds three `chip_idle` rows (`chip_chosen` for the tapped one) at x 28, y 378 + 39 × row, 356 by 36: the name 13 px, the path's words 10 px, and its three icons at 27 px, centres x 296, 327, 358. Before level 5 the title says `Your path comes at level 5` and the icons are at half strength. Tap a row and the card shows the path with `Be a <name>`: button at (96, 672), 220 by 40.

## A slot

46 square, centred on the x above, top at the y above.

- **Cubby:** `cubby_plain` when learned, `cubby_empty` when not. Icon 36 px: full when learned, 0.62 when it can be learned, 0.32 when locked.
- **Pips:** the rank's dots, 10 px, 12 apart, 8 below the cubby's bottom. None when locked.
- **Carried:** a 2.5 px gold ring `#f4c14a` inside the cubby, and `mark_star` at 15 px on its top right corner.
- **Can be learned:** a gold disc with `+`, 18 px, on the bottom right corner. New piece below.
- **Locked:** a dark pill with `Lv 12`, on the cubby's bottom edge.
- **Tapped:** a gold backing 3 px larger on each side, or `cubby_chosen`.
- **Name:** 10.5 px cream on the wood, 20 below the cubby, up to two lines at 84 wide.

## The card

- **A skill tapped:** `cubby` 58 square at (28, 508), icon 46. Name 16 px at x 96, cost and rank 11.5 px under it. Slip at (28, 572), 356 by 100: the ability's words 13 px, then `Now` and `Next` (or `First`), in rust with the numbers in dark, 12 px.
- **Buttons at y 678, 34 tall:** Learn or Raise at x 28, 186 wide, `btn_action_small`; Carry or Put down at x 222, 162 wide, `btn_plain_small`. With no points, or under the level, Raise goes to `btn_plain_small`. At full rank, no Raise. Unlearned, no Carry.
- **Nothing tapped:** `Your skills`, with `about`, the meter's words, and the line about points on the slip.
- **Reset all:** keep yours, in a town or a church, at the slip's bottom right, as a small `btn_danger_small`. I have not drawn it.

## New kit pieces

Only one is worth adding, and I can draw it once you say this is right: `badge_plus`, the gold disc with `+`, 18 px. Everything else is in `out/ui/`.

## Not tested

Not in the game and not on a phone, and not with the game's own font. The names at 10.5 px are the thing to check, and long ones wrap to two lines.

# The trees (Robin's change, 2026-11-02)

This replaces the path board above, and shifts what sits over it: Robin: "picking down three different trees". `trees.jpg` shows today's screen beside three states, and `trees_hunter.jpg` one at 824 by 1830. The icons in the pictures are real; which are learned is a sample.

**What makes them read as trees (the bits to build):**
- A dark column for each tree, with its name on a slip at the crown.
- A branch running down between the nodes, which turns gold as far as you have gone, with a small leaf at each lit joint.
- The rule in its own crest, with no cubby: the shape says it is always on.
- The signature larger, at the foot, with a gold ring.

| What | Piece | x | y | w | h |
| --- | --- | --- | --- | --- | --- |
| Header, title 17 px, pill and Back as before, 3 px higher | `board_plain` | 18 | 116 | 376 | 40 |
| Belt, the words at x 30, y 180 and 197 | `board_plain` | 18 | 160 | 376 | 58 |
| Four belt slots, 44 square, 68 apart, icon 36, centre y 189 | `cubby_*` | 112 | | | |
| Class board. No label: the header says it. Four 40 px nodes, centres x 66, 159, 252, 345, y 257 | `board_plain` | 18 | 222 | 376 | 74 |
| Trees board | `board_plain` | 18 | 300 | 376 | 244 |
| Three columns, centres x 84, 206, 328, corner 8, fill `#7a5030` over a 1.5 px `#6a4628` edge | drawn | centre - 57 | 306 | 114 | 232 |
| Tree name, 12 px dark, 11 if over 10 letters | `board_slip` | centre - 52 | 310 | 104 | 22 |
| Nodes, centre y 352, 402, 452, then the signature at 508 | | | | | |
| Card | `board_plain` | 18 | 556 | 376 | 164 |

**Nodes:** moves 40 square in a cubby, icon 32. The rule is its crest at 42, with no cubby and no pips. The signature is 48 square in a cubby, icon 40. Pips are 7.5 px, 8.5 apart, just under the node, and only once learned.

**Strength of an icon:** full when learned, 0.76 when it is open and you have the level, 0.58 for a rule not reached, 0.4 for anything else. `badge_plus` at 17 px on the bottom right corner, and `Lv 12` in a small dark pill on the bottom edge when under the level.

**Draw a dim crest over a backing:** it has no cubby, so at 0.58 the branch shows through it. Put a crest-shaped `#7a5030` fill behind it, or dim it with a tint instead of alpha.

**The branch:** three points, from the slip's foot (y 332) to the first node and from node to node, bending 3 px to alternate sides so it is not a ruler line. An ink line 6.4 wide, then 3.6 wide in `#6a4630`, or gold `#f4c14a` where the node at its upper end is learned. It is simple enough to draw in code each refresh. A leaf at each lit segment's middle: `#7cc460`, 14 long, ink 1.

**The card,** at y 556: icon 52 at (28, 564). Name 15.5 px at x 90; cost, or `Always on`, at y 594; tree name and rank at y 608. Slip at (28, 620), 356 wide: 52 tall with buttons under it at y 678, 34 tall (Learn or Raise x 28, 186 wide; Carry or Put down x 222, 162 wide), and 90 tall for a rule, which has no buttons.

**The empty card, nothing tapped:** the same board, `Your skills`, with your words on the slip, 90 tall.

**What I think of today's screen:** it works and it is honest, so this is polish, not a fix. Three things it lacks: the trees look like a grid until the branch is there; the star tells you nothing about which rule it is, which the icons now fix; and the empty card takes more room than the words need, which is where the extra space for the trees comes from.
