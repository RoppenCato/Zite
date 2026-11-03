# The bigger land: two stills and the map

Mitch, AD, 2026-11-02, for Robin to judge, through Miles, GD. Robin: "It makes it more interesting to 'enter the swamp' or 'go up in the mountains'." Nothing here goes into the game. The names, the look and the places are mine until Robin says.

`swamp.jpg` and `mountains.jpg` are the phone at zoom 0.8, with the game's real bars. `map.jpg` shows where they go; the two new lands on it are rough. The new props are drawn for the stills. The spot plates and the hero are the game's own.

## Bogglemire, the swamp, levels 12 to 16

Murky green water between low islands. **The road is a plank boardwalk on posts**, so you feel you are crossing the swamp, not walking beside it. Great mossy trees, huts on stilts, lanterns, reeds, water lilies, low mist. Its creature in the still is a Bog Toad.

## The Frostcrown, the mountains, levels 16 to 20

**You climb up the screen:** green foot, then bare rock, then snow, with a cliff and a turn in the road at each step. Stone huts under snow, prayer flags, great peaks either side, snow falling. Its creature in the still is a Snow Goat.

## Where they go

The land runs on east from Queen Bumble's gate, which already stands on Honeyhill's east shore.

- **Bogglemire:** about x 7900 to 11700, y 150 to 4600. It is the size of Wobblewood, and an old plank causeway crosses the strait from the gate.
- **The Frostcrown:** about x 12200 to 16000, y 200 to 5500. You enter at its south foot, by a causeway from the swamp's south-east, and the boss stands at the top.
- **Why east and not below the swamp (mine):** mountains under the swamp would have you enter at the top and walk down. East of it, you walk up.
- **The world** becomes about 16600 wide, and the height stays 9300. Grown lands start after that.

## The sea and coast

Same coast as now: sand, white foam, pale water. Between the lands is open sea, with a few islets.

## What stands in the way

**Mine to do:**

- **Column 7's chunks must be repainted.** Today's sea stops at about x 8000 and past that the files are black. No one sees it now, because the world ends at 7400.
- **New columns of sea.** Sea files are small, about 11 KB each.
- **The Arena** in each new material (planks and reeds; stone and snow) and the fog for the closed lands.

**Miles, GD's to do:**

- **The overview picture.** At today's scale, 16600 wide would make it about 3650 by 2046, about 30 MB in memory against today's 13. My proposal: keep today's file and add a second one for the east, about 1900 by 1250, about 10 MB, loaded only once the swamp is open.
- **World width,** and moving the grown lands' first column east of the mountains.
- **Memory, answered by Miles, GD (read from the code, not measured):** fight strips, other areas' creatures and chunks are already freed. Board atlases stay held all session: about 55 MB now, about 83 MB with two more regions, over the 64 MB cap in the game's `docs/state/art.md`. If Robin says yes, Miles, GD will change this before I paint, so a region's atlases load when you come near and go when you leave (his decision). Plan on one or two regions held at a time. No phone number is needed first.
- **Overview:** the second file for the east is agreed with Miles, GD.

## Not tested

Not in the game and not on a phone. The stills show one place each, not a whole region. The bars are cropped from a picture of the Meadows.
