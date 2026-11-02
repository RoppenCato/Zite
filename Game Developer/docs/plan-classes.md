# The classes and how abilities are earned

Miles, GD, 2026-11-02. **Built.** Robin's identities and paths are in the brief; he gave them as ideas and left the balance to me
(Robin, 2026-11-02: "You'll need to find a good way to balance it and so that it feels good and has good progression. I was merely giving ideas").
Below: what was built, how it is balanced, and what is mine. The data is written by `tools/class-data.mjs`.

## What was built

- **Four classes, each with its own four abilities and its own always-on rules.** Two abilities from the start, one of which spends the meter.
- **Three trees for each class,** read downwards (Robin, 2026-11-02: "picking down three different trees"): an ability from level 3, the tree's always-on rule at 5, an ability at 8, a signature ability at 12. Each node opens the next. Mine: nothing locks a tree, there are too few points to fill them, so where they go is the specialization; the title follows the tree with the most points.
- **Points:** one each level to 10, then every second level; one more for a region's boss the first time (mine). A point learns or raises an ability, three ranks each, or learns a rule.
- **Four carried into a fight,** chosen on the Skills screen, from Hero. **Free reset** in any town or church. Mine.
- **Abilities that change what you do, not only bigger numbers:** Mighty Swing grows with Valor held, so holding it fights spending it. Arcane Bolt grows with mana held, the same mana the shield needs. Shield Bonk breaks a boss's wind-up. Last Light stands you back up. Bloodbath is harder the nearer the end. Detonate and Bitter End cash in a burn or a poison. Judgement Day grows with all you healed. Shadow Clone doubles your attacks. Bullseye rewards reading a wind-up. Great Owl, Overwatch, Killing Ground.
- **Gone:** random picks at levels, the trainer in town, shrines teaching. A shrine now restores mana and some HP. Everyone's save got its points back to spend.
- **Mine, for Robin to change:** Beastmaster and Trapper for the Hunter; every ability beyond the ones he named.
- **For testing, to go before an Alpha:** Settings has "Test: class" and "Test: level".

## How it is balanced

`node tools/sim-classes.ts` plays every class and path with the real rules against each region's creatures, mini-boss and boss. Its player is sensible, not perfect: half its
gear slots filled at the region's rank, two potions, heals when low, keeps buffs going, guards as its class wants. Targets (mine): no creature a danger at the region's level; a boss won
most of the time, some builds sweating; a boss fight about 10 to 20 rounds; no path hopeless.

The latest table is what running it prints. The sim fights with one tree taken; two half trees are not tested yet. The creatures' numbers were not changed. **Numbers are for Robin to feel.**

## Why a small board and not a tree (the reasoning, kept)

### The options

| | Good | Bad on a phone game like this |
| --- | --- | --- |
| **Random picks** (today) | Simple, a little surprise | You can't plan, and characters are decided by luck |
| **Big branching tree** | Deep, a long goal | Doesn't fit a phone screen, one wrong choice can spoil a character, huge to balance |
| **Fixed unlocks by level** | Nothing to get wrong | No choices: every Knight is the same |
| **Only bought or found** | Rewards exploring | Bad luck can leave you weak, and nothing to look forward to on a level-up |
| **A small board with points** (my pick) | You choose, you see what is coming, every level gives something | A new screen to build |
