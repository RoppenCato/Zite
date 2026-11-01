# Chapter 2, Tumbletree: the plan of implementation

Miles, GD, 2026-11-01, on Robin's word that evening: "Lay down a list for the next chapter and then get to work." The
chapter is Wobblewood Forest, levels 4 to 8, four classes; its "done when" is in `docs/chapters.md`. Built here, in the
local session, checked in the pane at phone size and on Robin's phone. The studios decide their own work (Robin,
2026-11-01); the order below is what the game can use soonest.

Chapter 1 stays open beside this one: the tunnel, the install page and Alpha 1 (its steps 11 and 12) wait on Robin's word, and
his verdict on King Goo's HP is pending.

## The steps

1. **Loading by area and by class** (mine). A new area's art and sound is added by listing it once, and loads when it is
   needed: only your class's hero, only the area's board, backdrop, creatures and music. *Done*: the meadows cost no more
   than today, and a forest drop needs one line each.
2. **Into the forest** (mine; Mitch, AD's kit and backdrop). Past King Goo, the opened-area moment, the banner, the
   board and fight backdrop from the forest's kit. *Done*: no shape left in the forest.
3. **The forest's creatures** (Mitch, AD; Nigel, SD's voices). Twigling, Moss Goblin, Sporeling, Nutkin Thief, Sleepy Owlbear
   Cub, Grumblebark with his second phase. *Done*: each fights with its five clips and its voice.
4. **Iron and Silver** (mine; Mitch, AD's pieces and icons). In the shop, on the hero, in the bag, and a reason to spend gold
   (Robin's playtest: it piles up after tin). *Done*: a piece bought in Tumbletree shows on the hero.
5. **The three classes** (mine; Mitch, AD; Nigel, SD). Trickster, Wizard and Archer drawn with their sets and weapons, their
   abilities and meters heard and read clearly; the character screen offers all four last. *Done*: each plays differently.
6. **Ability icons and fight effects** (Mitch, AD). 24 icons, about 14 effects, wired on the events.
7. **The second town** (mine). Tumbletree's errands, trainer, shop and a church work and read right, with no Puddlewick-only
   words left. *Done*: a level 5 Knight lives a loop there.
8. **The other players** (mine). Figures, marks and notes drawn with the kit instead of circles. *Done*: two windows see each
   other in their worn gear.
9. **The forest's sound** (Nigel, SD). Board, fight, Grumblebark and Tumbletree themes, the bed, steps on roots and moss.
10. **Balance** (mine). The bots for all four classes to Grumblebark, the walls retuned. *Done*: numbers in
    `docs/state/rules.md`.
11. **The playtest** (mine). Each class through the forest, trying to break it, as with King Goo.
12. **Alpha 2** (Robin and friends). Four phones clear Grumblebark over a weekend; `alpha-2` on main.

Every step runs on what exists until its drop lands, and a drop that comes early is wired the day it lands.
