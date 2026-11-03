# The level 1 to 20 check (2026-11-02)

Robin: "Do the level 1 to 20 playthrough check." `tools/sim-journey.ts` plays the whole climb with the real rules, from a new character to Frostbeard's fall: all four classes, all three trees each. The player is sensible, not perfect, and does not chase the Arena, the Rootways or rumours. Times come from my guesses of seconds per action (a roll 7, a fight round 4), so trust them as comparisons, not as clock time.

    node tools/sim-journey.ts 10 quiet

## Before the changes: bosses tapped from anywhere (120 runs, none stuck)

| Land | Minutes | Fights | Deaths | Boss tries | Level in to out | Gold at the end |
| --- | --- | --- | --- | --- | --- | --- |
| Meadows | 18 | 31 | 0.9 | 1.0 | 1.0 to 6.2 | 491 |
| Wobblewood | 25 | 50 | 0.2 | 1.1 | 6.2 to 11.1 | 2918 |
| Honeyhill | 28 | 48 | 0.1 | 1.2 | 11.1 to 15.6 | 7115 |
| Bogglemire | 9 | 15 | 0.1 | 0.6 | 15.6 to 17.8 | 10200 |
| The Frostcrown | 15 | 24 | 0.3 | 1.0 | 17.8 to 21.4 | 14316 |

Whole climb 1.6 hours: Warrior 1.7, Magician 1.3, Rogue 1.6, Hunter 1.7.

## Before the changes: walking to each boss, landing exactly (72 runs, none stuck)

| Land | Minutes | Fights | Deaths | Level in to out |
| --- | --- | --- | --- | --- |
| Meadows | 22 | 40 | 0.9 | 1.0 to 6.6 |
| Wobblewood | 47 | 96 | 0.3 | 6.6 to 13.2 |
| Honeyhill | 84 | 141 | 0.1 | 13.2 to 20.1 |
| Bogglemire | 18 | 33 | 0.1 | 20.1 to 22.7 |
| The Frostcrown | 20 | 37 | 0.4 | 22.7 to 26.0 |

Whole climb 3.2 hours. Much of Honeyhill's time here is the wait for an exact roll onto the boss: the sim overlevels while it waits.

## What that showed

1. **Nobody gets stuck.** Every class and tree finishes, both ways.
2. **The two newest lands get skipped.** You reach each boss's level almost as you arrive, and the tap goes straight to it.
3. **You arrive strong.** Each land is entered near the top of its range: Honeyhill (8 to 12) at 11, Bogglemire (12 to 16) at 15.6.
4. **It stops being dangerous after the Meadows.** Deaths per land fall to 0.1 to 0.3, and bosses mostly fall at the first try.
5. **Gold has nothing to do.** 14,000 at the end, and from Wobblewood on, drops beat what shops sell.
6. **The classes are close over the whole climb.** The Magician is fastest. The Hunter is not ahead here, though it was in the Arena's own sim.

Not covered: how it feels, the Arena, the Rootways, rumours and hidden places as goals, and shared play.

## After Robin's yes (2026-11-02)

Robin: "Yes to all three. I think you can also be smart and softcap exp by zone, so that you need more exp to level up, and so you want to kill higher enemies. I think when i played before, gold came by way to fast also."

- **Bosses:** the first visit is on foot, the tap works after that, and a boss that is in stops a walk.
- **XP:** a longer level curve. A creature below you pays less per level, one above pays more, and past a land's top plus one its plain creatures pay half again. Boss XP is cut to 70%.
- **Bosses' strength:** King Goo softer, the others +25% HP and +10% attack.
- **Gold:** halved from creatures, chests, quests and events, and 30% less again in the two new lands. A master smith sells one fine piece a day at twice its price.

Old saves keep their level and how far along it they were.

## After the changes (120 runs, none stuck)

| Land | Minutes | Fights | Deaths | Boss tries | Level in to out | Gold at the end |
| --- | --- | --- | --- | --- | --- | --- |
| Meadows | 23 | 42 | 0.9 | 1.1 | 1.0 to 5.2 | 269 |
| Wobblewood | 41 | 83 | 0.3 | 1.2 | 5.2 to 9.6 | 1955 |
| Honeyhill | 28 | 57 | 0.1 | 1.2 | 9.6 to 12.7 | 4206 |
| Bogglemire | 37 | 66 | 0.3 | 1.2 | 12.7 to 16.1 | 8079 |
| The Frostcrown | 53 | 91 | 0.8 | 1.3 | 16.1 to 20.4 | 15828 |

Whole climb 3.0 hours: Warrior 3.4, Magician 2.7, Rogue 2.9, Hunter 3.1. The sim skips the Arena, the Rootways, rumours and looking around, and buys no fine pieces, so real play is longer and gold lower. The aim is 4 to 6 hours of real play (Robin's yes, 2026-11-02), not yet measured.

Still true: Honeyhill is the safest land, and gold still climbs late.

## The whole game to level 30 (Robin, 2026-11-02)

Robin: "Level up each class naturally all the way to 30. Try different specs and talents. Try fighting with different tactics. Kill all the bosses. Do quests, buy stuff etc etc. Try everything and see what needs fixing. Tune the balance after every playthrough."

    node tools/sim-full.ts 1 warrior --tactics     one class; leave the class off for all four; --to 21 stops at Frostbeard
    node tools/sim-summary.mjs <the text files>    the table
    node tools/sim-talents.ts 40                   each talent taken away: does a fight change?
    node tools/sim-monkey.ts 20000                 everything tapped in no order
    node tools/enemy-curve.mjs                     enemies.json from enemy-base.json and the curve

Twelve playthroughs, nine builds a class: each tree alone, each with a second tree, and four tactics (sensible, all in, careful, Attack only). Each plays with an hour and a half a day on the calendar: every boss, quest boards, shops and the smith's fine piece, the Arena on its days, the Rootways, rumours, hidden places, the coach, Home, a respec at 15. These are rules played by a script, with time guessed from taps: how it feels is still Robin's to say.

### Found and fixed

- A Hunter could not wear a rare or better bow: the check read the name, and those names have no "bow" in them. Nor a unique. **The Hunter's best weapons were refused, with no message.**
- The city's quest board gave errands in the city's streets, which have no creatures: they could never be finished. It now sends you to the land that suits you.
- Crownhaven's Journal page could never fill, for the same reason.
- HP or mana could stay above the maximum after a respec, after buying gear or when an elixir ran out.
- A level 45 Dread could walk into the city (fixed before this run).
- The Arena's flask limit: the buttons stayed lit and did nothing. They dim now.
- About 90 pressed talents made no sound. They borrow the swing until Nigel, SD has made theirs.
- Two pairs of talents shared a name.
- The hub's shops sold tier 2 gear for ever. They now keep up with the furthest land you have opened.
- The skill board wore a level tag on every talent: one a tier now, on the branch.

### Tuned (numbers mine)

| What | Before | After |
| --- | --- | --- |
| Creatures from level 7 up: attack, by level over 6 | as first set | +6.5% a level, HP +2% |
| Mini-bosses | | attack +5%, HP +3% a level, HP x1.15 |
| Bosses | | attack +4%, HP +4% a level, attack x1.1 |
| What a shop pays | half | a fifth |
| Flask from a creature | 20% | 8% |
| The Warrior's attack | | x1.12: it killed slowest |
| Wizard's Deep Well | 5% mana a rank | also 4% HP a rank |

### Where it stands (sensible player, hours to reach a level)

| Class | Level 10 | Level 20 | Level 30 | Deaths |
| --- | --- | --- | --- | --- |
| Warrior | 1.0 | 4.3 | 14.7 | 2 |
| Magician | 1.3 | 4.0 | 12.2 | 15 |
| Rogue | 0.9 | 3.4 | 12.2 | 2 |
| Hunter | 0.9 | 3.6 | 12.9 | 1 |

A creature at your level costs about 5% of your HP in 3 to 5 rounds. Bosses take 11 to 25 rounds and up to 3 flasks; most fall on the first or second try, Frostbeard takes a Magician about three. Before tuning, nothing after level 10 cost more than 2 to 4% HP and most bosses fell first try with no flask. All in dies about ten times as often as careful, so tactics matter.

### Still open

- **Level 21 to 30 is 8 to 10 hours in The Frostcrown.** The world ends at 20, so nothing is a danger there (2 to 3% HP a fight) and gold piles up to about 100,000 with nothing to buy. The Pirate Isles and The Giants' Land are the answer.
- **The Magician dies most**, the pure Wizard and Spellsword above all (28 to 33 deaths against 0 to 4 for most builds). Read as a glass cannon for now.
- **A Magician who only taps Attack does not get through:** stuck at level 17 with six bosses left.
- Not played by this: two players at once, and the screens at length. The pane saw character making, the board, the Hero sheet, the skill board, the Journal, the quest board, a shop, the Arena's door, a fight and its abilities list, the map.

### With sets, more uniques and the bosses' tricks (one seed a build, to level 30)

Level 20 takes 2.8 to 5.5 hours for most builds, about as before. Grumblebark is the hardest early boss: 21 to 28 rounds. By level 30 a player has found about 22 set pieces and 11 uniques; the sim wears few of them, because it judges gear by its plain numbers, so sets have not been felt in these runs. One build stands out: Warrior Berserker with Knight took 11.7 hours to level 20 and 35 to 30, not looked into yet.



### With the Pirate Isles (one seed a build)

Level 30 now takes 7 to 13 hours for most builds, down from 12 to 15: the isles pay full XP from level 20 to 24. About 5 hours are spent there, since the Giants' Land is not in yet. Captain Saltjaw: 13 to 25 rounds, up to 3 tries.

### With the Giants' Land (six seeds a build, all tactics)

The whole world, every boss down. Median hours to level 30, by the sensible player: Warrior 9.3, Rogue 7.7, Magician 8.1, Hunter 7.3; to level 20: 3.5 to 4.1. Old Snowshoulder falls at level 24 in about 1.1 tries, The Yeti King at level 28, softened once from attack 136 to 120: Warrior 1.1 tries, Rogue 2.5, Hunter 4.2, Magician 5.2, across all tactics, against 1.1 to 2.3 for Captain Saltjaw. The last boss is meant to be the hardest. Careful play is the fastest or close to it. Still slow or stuck: Berserker+Knight Warrior (up to 24 hours), the Ninja who only presses Attack (40 hours, 9 bosses left), the Wizard who only presses Attack (never past level 20). These are bots; nothing here is felt.

### With the Buried Crown (three seeds a build, all tactics)

The whole game, all 14 bosses. Median hours to level 30, sensible player: Warrior 8.6, Rogue 7.8, Magician 7.2, Hunter 6.9. The Hollow King (level 31, attack 130, HP 7200, 14 to 33 rounds) falls in one try for most, up to about 25 for the reckless. 105 of 108 runs finish everything; the 3 left are the Wizard who never opens Abilities, who now reaches level 27 to 30 in 40 hours, not 15 to 20. The bots used to give up on a boss for good after a loss at the cap; fixed. These are bots; nothing here is felt.

### With the weapons, the new Rogue and day and night (2026-11-03, three seeds a build, all tactics)

Median hours to level 30, sensible player: Warrior 8.4, Rogue 8.2, Magician 7.1, Hunter 6.5; to level 20: 3.3 to 4.0. 102 of 108 runs finish all 14 bosses; the 6 left are the Wizard who never opens Abilities (3, as before), the Ninja who only presses Attack (2) and one sensible Wizard seed that keeps losing to Old Snowshoulder. Every boss after the Yeti King falls in a median of one try. On the way there, three fixes: a bow keeps its off-hand (Hunters had lost a whole piece of gear and their guard: 16 of 27 runs stuck); found loot no longer slips an orb on beside a staff (a staff Magician wore both, and the bot's bag filled with orbs it could not put on: 14 of 27 stuck); and a dungeon has no night. A great weapon blocks 35% and dodges 45%, with 1.35 times a sword's attack; the bots take one only as a Berserker. The Hollow King: attack 118, HP 6600. These are bots; nothing here is felt.

### With trinkets (2026-11-03, three seeds a build, all tactics)

The trinket slot holds trinkets: no HP of its own, a passive instead. The bots wear the trinket of the highest land and rarity they find (they cannot judge a passive). Median hours to level 30, sensible player: Warrior 9.0, Rogue 8.4, Magician 8.1, Hunter 6.5, close to before. 100 of 108 runs finish everything; the 8 left are the Wizard who never opens Abilities (3), the Ninja who only presses Attack (3) and two Berserker+Knight Warriors who wander the Kingswood, the build the bots have always played worst.
