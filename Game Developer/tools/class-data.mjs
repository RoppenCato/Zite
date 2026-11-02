// The classes, their three trees and abilities, written out to rules/data as plain data. Balance by changing a number here and running
// this, then `node tools/sim-classes.ts`. Robin, 2026-11-02 gave the identities and specializations ("I was merely giving ideas"; "I saw it
// as picking down three different trees. But do it how you think it works best"); the numbers, the two extra Hunter trees and the abilities
// beyond his are mine (Miles, GD), tuned against the simulator. Each tree: an ability, the always-on rule, an ability, a signature ability.
//   node tools/class-data.mjs

import { readFileSync, writeFileSync } from 'node:fs';

/** Three ranks from a first rank and what each later rank adds to numbers. */
const up = (first, second, third) => [first, { ...first, ...second }, { ...first, ...second, ...third }];
/** A tree's always-on rule: one point, no button. */
const rule = (name, classId, text, traits) => ({ name, classId, text, mana: 0, level: 5, rule: traits, ranks: [{}] });

const A = {
  // ---- Warrior: guard well, build Valor, then decide: hold it for a harder swing, or spend it ------------------------------
  'heavy-blow': { name: 'Mighty Swing', classId: 'warrior', text: 'A crushing hit, harder for every point of Valor you are holding.', mana: 4, level: 1, ranks: up({ power: 1.3, perHeldMeter: 0.18 }, { power: 1.45, perHeldMeter: 0.2 }, { power: 1.6, perHeldMeter: 0.22 }) },
  execute: { name: 'Finishing Flourish', classId: 'warrior', text: 'Spend 3 Valor: a big hit, far harder on a foe under a third of its HP.', mana: 0, meter: 3, level: 1, ranks: up({ power: 2, executeBelow: 0.34, executePower: 3.2 }, { power: 2.3, executePower: 3.6 }, { power: 2.6, executePower: 4 }) },
  'shield-bash': { name: 'Shield Bonk', classId: 'warrior', text: 'A hit that breaks any wind-up it has gathered, and stuns a lesser foe.', mana: 6, level: 2, ranks: up({ power: 0.8, stun: 1, interrupt: true }, { power: 1 }, { power: 1.2, stun: 2 }) },
  'shield-wall': { name: 'Castle Stance', classId: 'warrior', text: 'Spend 2 Valor: a barrier worth a share of your HP.', mana: 2, meter: 2, level: 3, ranks: up({ barrierShare: 0.2 }, { barrierShare: 0.26 }, { barrierShare: 0.32 }) },
  // Paladin
  'holy-strike': { name: 'Holy Strike', classId: 'warrior', text: 'A hit that heals you for part of the damage.', mana: 5, level: 3, ranks: up({ power: 1.25, healDealt: 0.35 }, { power: 1.4, healDealt: 0.42 }, { power: 1.55, healDealt: 0.5 }) },
  'paladin-oath': rule('Blessed Guard', 'warrior', 'Each blow you Block heals you a little.', { blockHeal: 0.02 }),
  judgement: { name: 'Judgement', classId: 'warrior', text: 'A hit that weakens its blows and makes it take more damage.', mana: 7, level: 8, ranks: up({ power: 1, weaken: { rounds: 3, mult: 0.75 }, sunder: { rounds: 3, mult: 1.15 } }, { power: 1.15, sunder: { rounds: 3, mult: 1.2 } }, { power: 1.3, weaken: { rounds: 3, mult: 0.65 }, sunder: { rounds: 4, mult: 1.25 } }) },
  'last-light': { name: 'Last Light', classId: 'warrior', text: 'Spend 3 Valor: the next blow that would fell you leaves you standing instead. Once a fight.', mana: 4, meter: 3, oncePerFight: true, level: 12, ranks: up({ guardian: 0.3 }, { guardian: 0.4 }, { guardian: 0.5 }) },
  // Berserker
  reckless: { name: 'Reckless Swing', classId: 'warrior', text: 'A huge hit that costs you some of your own HP.', mana: 5, level: 3, ranks: up({ power: 2, selfHurt: 0.08 }, { power: 2.25 }, { power: 2.5 }) },
  'berserker-rage': rule('Rage', 'warrior', 'You deal more damage, and take more.', { damageDealt: 1.15, damageTaken: 1.1 }),
  'blood-price': { name: 'Blood Price', classId: 'warrior', text: 'Lose some of your HP: gain 2 Valor at once, and your hits land much harder for a few rounds.', mana: 0, level: 8, ranks: up({ selfHurt: 0.08, meterGain: 2, attackUp: { rounds: 3, mult: 1.35 } }, { attackUp: { rounds: 3, mult: 1.45 } }, { attackUp: { rounds: 4, mult: 1.55 } }) },
  bloodbath: { name: 'Bloodbath', classId: 'warrior', text: 'A hit that grows with all the HP you have lost: the nearer the end, the harder.', mana: 6, level: 12, ranks: up({ power: 1.5, missingPower: 1.5 }, { power: 1.7 }, { power: 1.9, missingPower: 1.8 }) },
  // Knight
  'shield-slam': { name: 'Shield Slam', classId: 'warrior', text: 'A hit that grows with your defense.', mana: 5, level: 3, ranks: up({ power: 1.1, defensePower: 1.4 }, { defensePower: 1.7 }, { defensePower: 2 }) },
  'knight-oath': rule('Armoured', 'warrior', 'A fifth more defense, and part of each blow goes back at whoever struck.', { defenseMult: 1.2, thorns: 0.15 }),
  'iron-retort': { name: 'Iron Retort', classId: 'warrior', text: 'Spend 2 Valor: for a few rounds, far more of each blow goes back.', mana: 3, meter: 2, level: 8, ranks: up({ thornsUp: { rounds: 3, share: 0.6 } }, { thornsUp: { rounds: 3, share: 0.8 } }, { thornsUp: { rounds: 4, share: 1 } }) },
  bulwark: { name: 'Unbreakable', classId: 'warrior', text: 'For a few rounds your Block stops almost everything.', mana: 5, level: 12, ranks: up({ blockUp: { rounds: 3, mult: 0.3 } }, { blockUp: { rounds: 3, mult: 0.22 } }, { blockUp: { rounds: 4, mult: 0.15 } }) },
  // ---- Magician: mana is health, damage and defense at once: what do you spend it on? --------------------------------------
  'arcane-bolt': { name: 'Arcane Bolt', classId: 'mage', text: 'A bolt of magic, stronger the more mana you still hold.', mana: 5, level: 1, ranks: up({ power: 1.2, manaPower: 0.7 }, { power: 1.35, manaPower: 0.8 }, { power: 1.5, manaPower: 0.9 }) },
  overflow: { name: 'Overflow', classId: 'mage', text: 'Spend all your Arcana: mana back for each point, and your next spell hits harder.', mana: 0, meterAll: true, level: 1, ranks: up({ manaPerMeter: 5, nextSpell: 1.3 }, { manaPerMeter: 6, nextSpell: 1.4 }, { manaPerMeter: 7, nextSpell: 1.5 }) },
  'arcane-shield': { name: 'Bubble Shield', classId: 'mage', text: 'A shimmering bubble worth a share of your HP that soaks the next damage.', mana: 7, level: 2, ranks: up({ barrierShare: 0.3 }, { barrierShare: 0.4 }, { barrierShare: 0.5 }) },
  'time-warp': { name: 'Pocket Watch', classId: 'mage', text: 'Spend 4 Arcana: stop the clock, the enemy loses its next turn, boss or not.', mana: 6, meter: 4, level: 3, ranks: up({ skip: 1 }, { power: 0.8 }, { skip: 2 }) },
  // Wizard
  fireball: { name: 'Firework', classId: 'mage', text: 'A burst of flame: a huge hit that leaves it burning.', mana: 8, level: 3, ranks: up({ power: 1.8, burn: { rounds: 3, power: 0.22 } }, { power: 2.05 }, { power: 2.3, burn: { rounds: 3, power: 0.26 } }) },
  'wizard-flame': rule('Kindled', 'mage', 'Your spells hit harder.', { spellPower: 1.2 }),
  detonate: { name: 'Detonate', classId: 'mage', text: 'Set off the fire: all the burning it has left lands at once, and stronger.', mana: 3, level: 8, ranks: up({ consume: { kind: 'burn', mult: 2.2 } }, { consume: { kind: 'burn', mult: 2.6 } }, { consume: { kind: 'burn', mult: 3 } }) },
  meteor: { name: 'Falling Star', classId: 'mage', text: 'Call down a star: it lands two rounds later for a huge hit, whatever you do meanwhile.', mana: 10, level: 12, ranks: up({ windup: 2, power: 3 }, { power: 3.4 }, { power: 3.8 }) },
  // Cleric
  smite: { name: 'Smite', classId: 'mage', text: 'Holy light: a strong hit that heals you a little.', mana: 6, level: 3, ranks: up({ power: 1.6, healDealt: 0.25 }, { power: 1.85 }, { power: 2.1, healDealt: 0.35 }) },
  'cleric-grace': rule('Grace', 'mage', 'Your healing is stronger, your defense too, and healing past full becomes a barrier.', { healPower: 1.25, defenseMult: 1.15, healOverflow: 0.5 }),
  mend: { name: 'Mend', classId: 'mage', text: 'Heal a share of your HP, and clear poison and weakness.', mana: 7, level: 8, ranks: up({ healShare: 0.28, cure: true }, { healShare: 0.35 }, { healShare: 0.42 }) },
  'judgement-day': { name: 'Judgement Day', classId: 'mage', text: 'A blast of light that grows with all you have healed this fight.', mana: 9, level: 12, ranks: up({ power: 1.2, healedPower: 0.5 }, { healedPower: 0.65 }, { power: 1.4, healedPower: 0.8 }) },
  // Spellsword
  'frost-blade': { name: 'Frost Blade', classId: 'mage', text: 'For a few rounds your attacks chill: harder, and its blows weaken.', mana: 6, level: 3, ranks: up({ infuse: { kind: 'ice', rounds: 4, power: 0.45, mult: 0.8 } }, { infuse: { kind: 'ice', rounds: 5, power: 0.5, mult: 0.75 } }, { infuse: { kind: 'ice', rounds: 6, power: 0.55, mult: 0.7 } }) },
  'spellsword-bond': rule('Spell and Steel', 'mage', 'Your plain attacks use your magic too, and you are as sturdy as a fighter.', { plainMagic: true, hpMult: 1.25, defenseMult: 1.3, damageDealt: 1.4 }),
  'storm-blade': { name: 'Storm Blade', classId: 'mage', text: 'For a few rounds lightning jumps from your attacks: much harder, and a chance of a second strike.', mana: 6, level: 8, ranks: up({ infuse: { kind: 'storm', rounds: 4, power: 0.6, chance: 0.3 } }, { infuse: { kind: 'storm', rounds: 5, power: 0.65, chance: 0.35 } }, { infuse: { kind: 'storm', rounds: 6, power: 0.7, chance: 0.4 } }) },
  'arc-slash': { name: 'Arc Slash', classId: 'mage', text: 'Three quick cuts, far harder while your blade is infused.', mana: 7, level: 12, ranks: up({ power: 0.9, hits: 3, split: true, melee: true, infuseBonus: 1.3 }, { power: 1 }, { power: 1.1 }) },
  // ---- Rogue: the chain: push your luck for one more hit, cash in, slip away ------------------------------------------------
  backstab: { name: 'Sneak Jab', classId: 'rogue', text: 'A hit that crits half the time.', mana: 4, level: 1, ranks: up({ power: 1.2, crit: 0.55 }, { power: 1.3, crit: 0.65 }, { power: 1.4, crit: 0.75 }) },
  eviscerate: { name: 'Grand Finale', classId: 'rogue', text: 'Spend all your Mischief: a hit that grows with every point.', mana: 2, meterAll: true, level: 1, ranks: up({ power: 0.8, perMeter: 0.4 }, { power: 0.9, perMeter: 0.45 }, { power: 1, perMeter: 0.5 }) },
  shadowstep: { name: 'Vanishing Act', classId: 'rogue', text: "Slip away: the enemy's next blows miss.", mana: 6, level: 2, ranks: up({ evade: 2 }, { power: 0.6 }, { evade: 3, power: 0.8 }) },
  pickpocket: { name: 'Sticky Fingers', classId: 'rogue', text: "A quick cut and a quicker hand: gold from the enemy's purse, once a fight.", mana: 3, oncePerFight: true, level: 3, ranks: up({ power: 0.5, steal: 0.5 }, { power: 0.6, steal: 0.75 }, { power: 0.7, steal: 1 }) },
  // Ninja
  shuriken: { name: 'Shuriken', classId: 'rogue', text: 'Four quick stars, each one a chance to crit.', mana: 5, level: 3, ranks: up({ power: 1.5, hits: 4, split: true }, { power: 1.7 }, { power: 1.9 }) },
  'ninja-step': rule('Light Feet', 'rogue', 'You strike first in every fight, and dodge more.', { firstStrike: true, dodge: 0.1 }),
  'smoke-escape': { name: 'Smoke Escape', classId: 'rogue', text: 'Gone in a puff: you always get away, even from a boss.', mana: 4, level: 8, ranks: [{ flee: true }] },
  clone: { name: 'Shadow Clone', classId: 'rogue', text: 'A copy of you joins in: for a few rounds every attack strikes again.', mana: 7, level: 12, ranks: up({ clone: { rounds: 3, power: 0.6 } }, { clone: { rounds: 4, power: 0.65 } }, { clone: { rounds: 5, power: 0.7 } }) },
  // Shadow
  'shadow-dance': { name: 'Shadow Dance', classId: 'rogue', text: "Drop your guard: take this round's blow in full, then almost nothing can touch you for two rounds.", mana: 5, level: 3, ranks: up({ dance: { rounds: 2, chance: 0.9 } }, { dance: { rounds: 2, chance: 0.95 } }, { dance: { rounds: 3, chance: 0.95 } }) },
  'shadow-pact': rule('Opportunist', 'rogue', 'After you dodge a blow, your next hit is a sure crit.', { dodgeCrit: true }),
  ambush: { name: 'Ambush', classId: 'rogue', text: 'A hard hit from the dark; far harder while you dance in shadow.', mana: 5, level: 8, ranks: up({ power: 1.2, danceBonus: 1.5 }, { power: 1.35 }, { power: 1.5, danceBonus: 1.7 }) },
  assassinate: { name: 'Assassinate', classId: 'rogue', text: 'Spend 3 Mischief: a sure crit, far harder on a foe under a third of its HP.', mana: 3, meter: 3, level: 12, ranks: up({ power: 1.3, sureCrit: 1, executeBelow: 0.34, executePower: 2.4 }, { power: 1.5, executePower: 2.8 }, { power: 1.7, executePower: 3.2 }) },
  // Alchemist
  'poison-coat': { name: 'Poison Coating', classId: 'rogue', text: 'Coat your blade: your next hits poison, and each one makes it worse.', mana: 5, level: 3, ranks: up({ coat: { hits: 6, power: 0.11, rounds: 3 } }, { coat: { hits: 8, power: 0.13, rounds: 3 } }, { coat: { hits: 9, power: 0.15, rounds: 4 } }) },
  'alchemist-brew': rule('Master Brewer', 'rogue', 'Poison hurts half as much again, and potions do too.', { poisonPower: 1.5, potionPower: 1.5 }),
  'caustic-flask': { name: 'Caustic Flask', classId: 'rogue', text: 'A thrown flask: it takes more damage for a few rounds.', mana: 6, level: 8, ranks: up({ power: 0.7, sunder: { rounds: 3, mult: 1.25 } }, { sunder: { rounds: 3, mult: 1.32 } }, { sunder: { rounds: 4, mult: 1.4 } }) },
  'bitter-end': { name: 'Bitter End', classId: 'rogue', text: 'All the poison in its veins lands at once, and stronger.', mana: 5, level: 12, ranks: up({ consume: { kind: 'poison', mult: 2 } }, { consume: { kind: 'poison', mult: 2.4 } }, { consume: { kind: 'poison', mult: 2.8 } }) },
  // ---- Hunter: read the next: line and answer it --------------------------------------------------------------------------
  volley: { name: 'Triple Shot', classId: 'ranger', text: 'Three quick arrows.', mana: 5, level: 1, ranks: up({ power: 2, hits: 3, split: true }, { power: 2.25 }, { power: 2.5 }) },
  'sure-shot': { name: 'Sure Shot', classId: 'ranger', text: 'Spend 2 Aim: an arrow that surely crits.', mana: 0, meter: 2, level: 1, ranks: up({ power: 1, sureCrit: 1 }, { power: 1.15 }, { power: 1.3 }) },
  'aimed-shot': { name: 'Bullseye', classId: 'ranger', text: 'One careful arrow, far harder on a foe that is winding up.', mana: 5, level: 2, ranks: up({ power: 1.4, windupBonus: 1.6 }, { power: 1.6 }, { power: 1.8, windupBonus: 1.8 }) },
  mark: { name: 'Painted Target', classId: 'ranger', text: 'Paint a target on the enemy: your next hits land harder.', mana: 4, level: 3, ranks: up({ mark: { hits: 3, mult: 1.3 } }, { mark: { hits: 3, mult: 1.4 } }, { mark: { hits: 4, mult: 1.5 } }) },
  // Ranger
  'quick-reflex': { name: 'Quick Reflexes', classId: 'ranger', text: 'For a few rounds you shoot back far more often.', mana: 5, level: 3, ranks: up({ counterUp: { rounds: 3, chance: 0.4 } }, { counterUp: { rounds: 3, chance: 0.55 } }, { counterUp: { rounds: 4, chance: 0.7 } }) },
  'ranger-eye': rule('Double Nock', 'ranger', 'Whenever you shoot back, you shoot twice.', { counterHits: 2 }),
  'rain-arrows': { name: 'Rain of Arrows', classId: 'ranger', text: 'Five arrows from above.', mana: 8, level: 8, ranks: up({ power: 2.8, hits: 5, split: true }, { power: 3.1 }, { power: 3.4 }) },
  'return-fire': { name: 'Overwatch', classId: 'ranger', text: 'Spend 2 Aim: for a few rounds you shoot back every time it strikes, hit or miss.', mana: 4, meter: 2, level: 12, ranks: up({ counterUp: { rounds: 2, chance: 1 } }, { counterUp: { rounds: 3, chance: 1 } }, { counterUp: { rounds: 4, chance: 1 } }) },
  // Beastmaster
  hawk: { name: 'Owl Friend', classId: 'ranger', text: 'Spend 2 Aim: your owl strikes on its own at the end of every round for a while.', mana: 4, meter: 2, level: 3, ranks: up({ companion: { rounds: 4, power: 0.5 } }, { companion: { rounds: 5, power: 0.55 } }, { companion: { rounds: 6, power: 0.6 } }) },
  'beast-bond': rule('Bonded', 'ranger', 'Your owl strikes harder.', { companionPower: 1.3 }),
  'owl-swoop': { name: 'Owl Swoop', classId: 'ranger', text: 'Spend 3 Aim: the owl dives, a big hit that ignores its defense.', mana: 3, meter: 3, level: 8, ranks: up({ power: 2.2, ignoreDefense: true }, { power: 2.5 }, { power: 2.8 }) },
  'great-owl': { name: 'Great Owl', classId: 'ranger', text: 'Spend 3 Aim: the owl strikes twice every round, for longer.', mana: 6, meter: 3, level: 12, ranks: up({ companion: { rounds: 5, power: 0.5, hits: 2 } }, { companion: { rounds: 6, power: 0.55, hits: 2 } }, { companion: { rounds: 7, power: 0.6, hits: 2 } }) },
  // Trapper
  trap: { name: 'Tripwire', classId: 'ranger', text: "Lay a tripwire: the enemy's next wind-up fails.", mana: 6, level: 3, ranks: up({ trap: 1 }, { trap: 1, power: 0.6 }, { trap: 2, power: 0.8 }) },
  'trapper-craft': rule('Cruel Traps', 'ranger', 'An enemy caught in your tripwire takes a hard hit.', { trapHit: 1.5 }),
  snare: { name: 'Pinning Shot', classId: 'ranger', text: 'A hit, and its next blows are much weaker.', mana: 5, level: 8, ranks: up({ power: 1, weaken: { rounds: 1, mult: 0.5 } }, { power: 1.15, weaken: { rounds: 2, mult: 0.5 } }, { power: 1.3, weaken: { rounds: 2, mult: 0.4 } }) },
  'spike-trap': { name: 'Killing Ground', classId: 'ranger', text: 'For a few rounds each blow it tries sets off spikes, and it takes more damage.', mana: 7, level: 12, ranks: up({ spike: { rounds: 3, power: 1 }, sunder: { rounds: 3, mult: 1.15 } }, { spike: { rounds: 4, power: 1.2 }, sunder: { rounds: 4, mult: 1.15 } }, { spike: { rounds: 5, power: 1.4 }, sunder: { rounds: 5, mult: 1.2 } }) },
};

const C = {
  warrior: {
    name: 'Warrior', style: 'Blocks to build Valor, then hits hard.', about: 'Blocks to build Valor, then spends it on hard hits and walls of steel, or holds it for a harder swing.',
    hp: 120, mana: 20, attack: 12, defense: 8, gold: 50, growth: { hp: 12, mana: 2, attack: 2, defense: 1 },
    kit: ['heavy-blow', 'execute'], core: ['heavy-blow', 'execute', 'shield-bash', 'shield-wall'],
    meter: { name: 'Valor', gain: 'block', text: 'Valor builds when you Block a blow, more from a wound-up one.' },
    trees: {
      paladin: { name: 'Paladin', text: 'Heals as it fights and wears the enemy down.', nodes: ['holy-strike', 'paladin-oath', 'judgement', 'last-light'] },
      berserker: { name: 'Berserker', text: 'Hits harder and takes more for it.', nodes: ['reckless', 'berserker-rage', 'blood-price', 'bloodbath'] },
      knight: { name: 'Knight', text: 'More defense, and what hits it gets hurt.', nodes: ['shield-slam', 'knight-oath', 'iron-retort', 'bulwark'] },
    },
  },
  mage: {
    name: 'Magician', style: 'Mana Shield, weak staff, strong spells.', about: 'Block is a Mana Shield: half of each blow is paid in mana. Weak staff, strong magic, and mana is everything.',
    hp: 90, mana: 40, attack: 7, magic: 6, defense: 4, gold: 50, growth: { hp: 9, mana: 4, attack: 1, magic: 1, defense: 1 },
    traits: { shieldMana: 0.5 },
    kit: ['arcane-bolt', 'overflow'], core: ['arcane-bolt', 'overflow', 'arcane-shield', 'time-warp'],
    meter: { name: 'Arcana', gain: 'round', text: 'Arcana builds a point every round.' },
    trees: {
      wizard: { name: 'Wizard', text: 'Fire: huge hits that leave the target burning.', nodes: ['fireball', 'wizard-flame', 'detonate', 'meteor'] },
      cleric: { name: 'Cleric', text: 'Heals itself and strikes with holy light.', nodes: ['smite', 'cleric-grace', 'mend', 'judgement-day'] },
      spellsword: { name: 'Spellsword', text: 'Ice or lightning in every melee hit.', nodes: ['frost-blade', 'spellsword-bond', 'storm-blade', 'arc-slash'] },
    },
  },
  rogue: {
    name: 'Rogue', style: 'Three quick hits, and crits that build.', about: 'Quick and fragile. Attack strikes three times, and every hit raises the crit chance until it crits.',
    hp: 95, mana: 25, attack: 10, defense: 5, gold: 60, crit: 0.15, dodge: 0.25, growth: { hp: 10, mana: 3, attack: 2, defense: 1 },
    traits: { attackHits: 3, critStreak: 0.05, damageTaken: 1.1 },
    kit: ['backstab', 'eviscerate'], core: ['backstab', 'eviscerate', 'shadowstep', 'pickpocket'],
    meter: { name: 'Mischief', gain: 'hit', text: 'Mischief builds each time you attack.' },
    trees: {
      ninja: { name: 'Ninja', text: 'Strikes first and can always get away.', nodes: ['shuriken', 'ninja-step', 'smoke-escape', 'clone'] },
      shadow: { name: 'Shadow', text: 'Takes one blow in full, then almost nothing can touch it.', nodes: ['shadow-dance', 'shadow-pact', 'ambush', 'assassinate'] },
      alchemist: { name: 'Alchemist', text: 'Poison on the blade, and better potions.', nodes: ['poison-coat', 'alchemist-brew', 'caustic-flask', 'bitter-end'] },
    },
  },
  ranger: {
    name: 'Hunter', style: 'Bows only, strikes first, shoots back.', about: 'Bows only. Often shoots back when struck, strikes first, and is at its best when it reads what comes next.',
    hp: 100, mana: 25, attack: 10, defense: 6, gold: 50, crit: 0.15, dodge: 0.05, firstStrike: true, growth: { hp: 10, mana: 3, attack: 2, defense: 1 },
    traits: { counterChance: 0.25, counterPower: 0.8, rangedOnly: true },
    kit: ['volley', 'sure-shot'], core: ['volley', 'sure-shot', 'aimed-shot', 'mark'],
    meter: { name: 'Aim', gain: 'miss', text: 'Aim builds when a blow misses you and when you crit.' },
    trees: {
      ranger: { name: 'Ranger', text: 'Every counterattack is two arrows.', nodes: ['quick-reflex', 'ranger-eye', 'rain-arrows', 'return-fire'] },
      beastmaster: { name: 'Beastmaster', text: 'Fights beside its owl.', nodes: ['hawk', 'beast-bond', 'owl-swoop', 'great-owl'] },
      trapper: { name: 'Trapper', text: 'Reads what comes next and has a trap waiting.', nodes: ['trap', 'trapper-craft', 'snare', 'spike-trap'] },
    },
  },
};

const json = (x) => `${JSON.stringify(x, null, 2)}\n`;
writeFileSync('rules/data/abilities.json', json(A));
const old = JSON.parse(readFileSync('rules/data/classes.json', 'utf8'));
writeFileSync('rules/data/classes.json', json(old.classes ? { ...old, classes: C } : C));
console.log(`${Object.keys(A).length} abilities, ${Object.keys(C).length} classes`);
