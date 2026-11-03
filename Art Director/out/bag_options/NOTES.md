# The inventory: three options

Mitch, AD, 2026-11-02, for Robin to pick. Robin: "The icons for potions etc doesnt really look like something you have, it just looks like some notification. They also dont really tell you what they do when you press them." "I think the inventory could do with an overhaul to make it more practical and visually better."

These are mock-ups at the game's layout: the HUD, the 640 tall sheet and the bottom band as they are now, in the 412 column. Atlases and panels are the kit's, and flask and card words are the real ones from `items.json`. **The gear's names, numbers and comparisons are samples.** The font is a stand-in.

| File | Shows |
| --- | --- |
| `compare.jpg` | The three with a Health Potion tapped |
| `gear.jpg` | The three with a sword tapped: what it does and how it compares with what you wear |
| `little.jpg` | The three carrying little, nothing tapped, as in Robin's screenshot |
| `1_pack.jpg`, `2_hero.jpg`, `3_ledger.jpg` | One screen each, 824 by 1830 |

## The options

| | **1. The Pack** | **2. The Hero** (my pick) | **3. The Ledger** |
| --- | --- | --- | --- |
| Idea | Everything on one page, in wooden slots | See the hero in what they wear, with slots either side | A list that says what each thing does, with its button on the row |
| Good | No tabs, you see all you own at once | The most pleasure: gear changes the picture. Robin, 2026-11-01: equipment must show | No tapping to find out; easiest to read |
| Less good | Busiest; the worn slots are small; the hero is not shown | Gear and flasks are on separate tabs | The least like a game; long gear lists need scrolling; worn slots go on a tab of their own, which I have not drawn |

## What all three solve

- **Flasks and cards read as things you own.** They lie in slots with a count, the same as gear, in a wood border. Empty slots show how much room is left.
- **Tapping tells you what it does**, in the item's own words. Gear says how it compares with what you wear. Cards say when they work.
- **Buttons only when they apply:** Drink for a flask, Wear and Drop for gear, none for a card. With nothing tapped, in 1 and 2, the plate says "Tap anything to see what it does."
- **The empty middle is gone.** The space is shared out, so carrying little looks tidy.

## What the game would change

- **BagScene:** rebuilt to the pick, including tapping a worn piece, which would offer Take off. If a flask would do nothing, I would keep your line, "You are full: it would do nothing now", on the slip and dim Drink.
- **Stats:** as a plank with HP and MP bars and three numbers, in place of the sentence.
- **Option 2 only:** the hero's stack as in the fight, at scale 0.5, redrawn when gear changes, over a crop of the current area's fight `background.jpg`. It adds that picture to what the bag loads, unless the fight's strips are used.
- **Flasks and cards together:** all 13 kinds fit only if a page of 12 can scroll, and nobody is likely to hold every kind at once. Your call.

## New kit pieces

- **`board_plain`** is in `out/ui/` now: a plank with no grain, for wide boards where stretched grain would show.
- **A `cubby`,** the slot: a wood border, a recess, with a coloured border by rarity. I would draw it once picked. In the pictures it is drawn by my tool, in place of the `frame_*` pieces.
- **A count badge,** the small dark pill with ×2. I would draw it too.
- **Unchanged:** `chip_idle` and `chip_chosen` for tabs, `slot_*` as the faint shape in an empty slot, flasks, cards, gear icons, the small buttons, and the name board's bars.

## Not tested

Not in the game and not on a phone, and not with the game's own font.

## Robin's pick: 2, The Hero (2026-11-02)

Robin: "2. the hero. But shouldnt you see more stats like crit etc? How do we fit that so it looks good?" `stats.jpg` answers with two ways to show all seven: attack, magic, defense, thorns, crit, dodge, lifesteal, the game's real list beyond HP and mana. **Robin chose A (2026-11-02).** Ignore the "Hero's picture, B" row below.

- **A, beside the hero:** all seven always in view, in the gaps between the slots and the hero's picture. A stat at 0 is dimmed, so what you do have stands out. Tap one, and the card says what it does.
- **B, a Stats tab:** three beside the hero, and all seven on a third tab. Calmer, but one tap away.

The words for each stat in the pictures are mine and first drafts: please correct them to what the rules do. Special powers from unique gear stay on the gear's own card.

**New kit pieces, in `out/ui/` now:** `cubby_empty`, `cubby_plain`, `cubby_common`, `cubby_uncommon`, `cubby_rare`, `cubby_epic`, `cubby_legendary`, `cubby_unique` (52 square, drawn at 46 for worn slots), `cubby_chosen` (58 square, over the tapped slot), `badge_count` (nine-slice, 22 by 15, ×2 in cream at 10.5 px), `board_plain`. The pictures were drawn with stand-in slots of the same shape.

**The layout, design px in the 412 column** (left and top edges, sheet from y 108 to 732):

| What | x | y | w | h |
| --- | --- | --- | --- | --- |
| Header `board_plain`, title and Close | 18 | 116 | 376 | 44 |
| Hero block `board_plain` | 18 | 164 | 376 | 214 |
| Left slots: helm, armour, gloves, boots, 46 square, 50 apart | 30 | 172 | | |
| Right slots: weapon, shield, cape, trinket, 46 square, 50 apart | 336 | 172 | | |
| Hero's picture, A | 132 | 172 | 148 | 198 |
| Hero's picture, B | 126 | 172 | 160 | 198 |
| Hero's feet, centre of the picture | | 352 | | |
| Stats A, centred: x 104 attack, magic, defense, thorns; x 308 crit, dodge, lifesteal. Number on y 188 + 50 × row at 14.5 px, name 15 below at 9 px | | | | |
| Bars `board_plain` | 18 | 382 | 376 | 30 |
| HP bar, MP bar | 28, 238 | 390, 391 | 200, 146 | 14, 11 |
| Tabs `chip_*`, two at 186 wide, 190 apart | 18 | 416 | 186 | 32 |
| Slots: 6 by 2, 52 square, 56 down, across x 28 to 384 | 28 | 454 | | |
| Card `board_plain` | 18 | 568 | 376 | 152 |
