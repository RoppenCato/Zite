# The classes and how abilities are earned

Miles, GD, 2026-11-02. **Built.** Robin's identities and paths are in the brief; he gave them as ideas and left the balance to me
(Robin, 2026-11-02: "You'll need to find a good way to balance it and so that it feels good and has good progression. I was merely giving ideas").
Below: what was built, how it is balanced, and what is mine. The data is written by `tools/class-data.mjs`.

## What was built

- **Four classes, three paths each** (see the brief). A path is an always-on rule and three abilities, taken at level 5.
- **Abilities:** four for the class, two of them from the start, one of which spends the meter. Three ranks each.
- **Points:** one each level to 10, then every second level; one more for a region's boss the first time (mine). A point learns or raises an ability.
- **Four carried into a fight;** the Skills screen, from Hero, chooses them. **Free reset** in any town or church. Mine, not yet judged by Robin.
- **Gone:** random picks at levels, the trainer in town, shrines teaching. A shrine now restores mana and some HP. Everyone's save got its points back to spend.
- **Mine, for Robin to change:** Beastmaster and Trapper for the Hunter; every ability beyond the ones he named; path at level 5.

## How it is balanced

`node tools/sim-classes.ts` plays every class and path with the real rules against each region's creatures, mini-boss and boss. Its player is sensible, not perfect: half its
gear slots filled at the region's rank, two potions, heals when low, keeps buffs going, guards as its class wants. Targets (mine): no creature a danger at the region's level; a boss won
most of the time, some builds sweating; a boss fight about 10 to 20 rounds; no path hopeless.

Boss wins after tuning (of 150 fights), so far **not felt by anyone**: the Meadows' boss runs from about 65% (Berserker, Wizard, Shadow) to 100% (Paladin, Knight, Trapper); the Forest's and
the Fields' are mostly 85% to 100%, the Wizard lowest at about 65% and 85%. The Spellsword's fights run long, 20 rounds and up, in the first two regions. The creatures' numbers were not changed. **Numbers are for Robin to feel.**

## Why a small board and not a tree (the reasoning, kept)

### The options

| | Good | Bad on a phone game like this |
| --- | --- | --- |
| **Random picks** (today) | Simple, a little surprise | You can't plan, and characters are decided by luck |
| **Big branching tree** | Deep, a long goal | Doesn't fit a phone screen, one wrong choice can spoil a character, huge to balance |
| **Fixed unlocks by level** | Nothing to get wrong | No choices: every Knight is the same |
| **Only bought or found** | Rewards exploring | Bad luck can leave you weak, and nothing to look forward to on a level-up |
| **A small board with points** (my pick) | You choose, you see what is coming, every level gives something | A new screen to build |
