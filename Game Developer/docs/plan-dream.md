# The Dream: the plan (Robin's endgame, 2026-11-03)

Robin's design is in the brief ("The endgame: the Dream"). This is how it is built; every choice not his is marked mine.
Robin OK'd this plan on 2026-11-03 ("Go ahead with the Dream, but make the dungeon size bigger"), built locally.

## What Robin decided

- After the last boss, a small island with a small magical forest, reached by a **ferry from the hub**.
- There you enter **the Dream**: dungeons generated for that run only, fitting your level, a random theme recoloured,
  weapons and armour recoloured, bosses with random elements and colours.
- **Depths**: clearing one opens a harder one with better loot. **As often as you like.**
- **A fall**: you keep the gear and the Dreamdust, and lose the gold (the run's, my reading).
- **A merchant** outside: flasks and the like for gold; unique trinkets, weapons and armour for **Dreamdust**, which only
  the Dream drops.

## The shape (mine)

**The way there.** The Bank in Crownhaven (`city-bank`, a plain spot today) becomes **the Ferry**, a `door` that opens
once the Hollow King has fallen (`needs: 'hollow-king'`). It leads to **the Dreaming Isle**, a small off-map area like
the dungeons: a dock (the way back), a short path through a magical forest with a spring, **the camp** with the merchant,
and **the Dreamgate**, a spot of a new kind, `dream`.

**A run.** At the Dreamgate you pick a depth: any you have opened (the deepest cleared plus one). The run is an area made
from a seed and added to the board for you alone (`dream-<player>`, far off the map, seen and walked only by you), and
taken away when the run ends:

- **about 45 spots** (Robin, 2026-11-03: "make the dungeon size bigger. 18 spots isnt very big"; the number mine), on a
  winding road with four or five forks, some rejoining and some ending in a chest, walked by the die like any land: fights,
  two or three chests, two fountains that heal, two traps, a mini-boss a third of the way and another two thirds in, the
  boss at the end;
- a **theme** drawn from the lands with board kits (Meadows, forest, Honeyhill, Bogglemire, the Frostcrown, the Pirate
  Isles, the Giants' Land, the Crown, the Rootways): its ground, props, plates, fight backdrop and creatures;
- a **tint** from a palette, laid over the board, the backdrop and the creatures (a multiply tint: cheap, no filters);
- a **name**: "Depth 7: the Sunken Vault of Embers".

**Fights** scale to the fighter as the Arena's do (half the class's bare numbers at the level, half what is worn), then
grow with the depth (about 7% a depth). Creatures show as level 30 plus the depth. The boss takes an **element**:
fire (it burns you, its flame grows), ice (an ice shell), poison (fumes), storm (a bite through any guard), each with the
boss trick that already exists for it.

**Loot.** Drops as anywhere, ranked by the depth (rank 9 and up, growing past the table, so better gear never runs out),
named **Dream-touched** and **tinted** in the run's colour on the hero. Gold won goes into the run's purse; **Dreamdust**
drops from every fight, more from chests, the mini-boss and the boss, more the deeper you are.

**The end of a run.**

- *The boss falls*: the run is cleared, the next depth opens, the purse and the Dreamdust are banked, and you wake at the
  Dreamgate.
- *You fall*: the purse is lost; the gear and the Dreamdust are kept; you wake at the camp, with no other death cost.
- *You wake up* (a button, outside a fight): the purse and the Dreamdust are banked, the depth is not cleared. Push on
  for more, or wake up safe: that is the risk.

**The merchant** (the camp's shop): for gold, the best flasks and dice cards; for Dreamdust, the Dream's own trinkets
(new, only here), and a weapon or a piece of armour of your choice at the rank of your best depth, rolled legendary, in
the Dream's colours.

## The steps

1. **Rules**: `data/dream.json`; the Ferry and the Isle; the `dream` action (enter a depth, wake up); the run's board
   from its seed; fights and loot in the Dream; Dreamdust; the end of a run; the merchant's stock; the save's version.
   Tests for each.
2. **Client**: the Ferry and the Isle on the board (the forest's kit until Mitch, AD's art); the run's board drawn from
   its theme's kit with the tint; tinted creatures, backdrop and gear; the depth picker and the Wake up button;
   Dreamdust on the hero sheet and in the merchant's shop.
3. **Art and sound** (Mitch, AD; Nigel, SD): the Isle, the camp, the Dreamgate, the merchant, the Dreamdust icon, the
   Ferry in the city; whether a tint looks right or needs palettes; the Dream's music and its gate's sound.
4. **Balance**: the bots run the Dream from their level-30 end states: how deep a sensible hero gets, and how fast
   Dreamdust buys a piece.
