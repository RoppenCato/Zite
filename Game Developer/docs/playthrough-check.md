# The level 1 to 20 check (2026-11-02)

Robin: "Do the level 1 to 20 playthrough check." `tools/sim-journey.ts` plays the whole climb with the real rules, from a new character to Frostbeard's fall: all four classes, all three trees each. The player is sensible, not perfect, and does not chase the Arena, the Rootways or rumours. Times come from my guesses of seconds per action (a roll 7, a fight round 4), so trust them as comparisons, not as clock time.

    node tools/sim-journey.ts 10 quiet        bosses tapped from anywhere, as the game is now
    node tools/sim-journey.ts 6 quiet walk    bosses must be walked to, landing exactly

## As the game is now (120 runs, none stuck)

| Land | Minutes | Fights | Deaths | Boss tries | Level in to out | Gold at the end |
| --- | --- | --- | --- | --- | --- | --- |
| Meadows | 18 | 31 | 0.9 | 1.0 | 1.0 to 6.2 | 491 |
| Wobblewood | 25 | 50 | 0.2 | 1.1 | 6.2 to 11.1 | 2918 |
| Honeyhill | 28 | 48 | 0.1 | 1.2 | 11.1 to 15.6 | 7115 |
| Bogglemire | 9 | 15 | 0.1 | 0.6 | 15.6 to 17.8 | 10200 |
| The Frostcrown | 15 | 24 | 0.3 | 1.0 | 17.8 to 21.4 | 14316 |

Whole climb 1.6 hours: Warrior 1.7, Magician 1.3, Rogue 1.6, Hunter 1.7.

## Walking to each boss (72 runs, none stuck)

| Land | Minutes | Fights | Deaths | Level in to out |
| --- | --- | --- | --- | --- |
| Meadows | 22 | 40 | 0.9 | 1.0 to 6.6 |
| Wobblewood | 47 | 96 | 0.3 | 6.6 to 13.2 |
| Honeyhill | 84 | 141 | 0.1 | 13.2 to 20.1 |
| Bogglemire | 18 | 33 | 0.1 | 20.1 to 22.7 |
| The Frostcrown | 20 | 37 | 0.4 | 22.7 to 26.0 |

Whole climb 3.2 hours. Much of Honeyhill's time here is the wait for an exact roll onto the boss: the sim overlevels while it waits.

## What it shows

1. **Nobody gets stuck.** Every class and tree finishes, both ways.
2. **The two newest lands get skipped.** You reach each boss's level almost as you arrive, and the tap goes straight to it.
3. **You arrive strong.** Each land is entered near the top of its range: Honeyhill (8 to 12) at 11, Bogglemire (12 to 16) at 15.6.
4. **It stops being dangerous after the Meadows.** Deaths per land fall to 0.1 to 0.3, and bosses mostly fall at the first try.
5. **Gold has nothing to do.** 14,000 at the end, and from Wobblewood on, drops beat what shops sell.
6. **The classes are close over the whole climb.** The Magician is fastest. The Hunter is not ahead here, though it was in the Arena's own sim.

Not covered: how it feels, the Arena, the Rootways, rumours and hidden places as goals, and shared play.
