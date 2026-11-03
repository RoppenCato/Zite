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
  bloodbath: { name: 'Bloodbath', classId: 'warrior', text: 'A hit that grows with all the HP you have lost: the nearer the end, the harder.', mana: 6, level: 12, ranks: up({ power: 2.0, missingPower: 1.5 }, { power: 2.2, missingPower: 1.7 }, { power: 2.4, missingPower: 2.0 }) },
  // Knight
  'shield-slam': { name: 'Shield Slam', classId: 'warrior', text: 'A hit that grows with your defense.', mana: 5, level: 3, ranks: up({ power: 1.1, defensePower: 1.4 }, { defensePower: 1.7 }, { defensePower: 2 }) },
  'knight-oath': rule('Armoured', 'warrior', 'A fifth more defense, and part of each blow goes back at whoever struck.', { defenseMult: 1.2, thorns: 0.15 }),
  'iron-retort': { name: 'Iron Retort', classId: 'warrior', text: 'Spend 2 Valor: for a few rounds, far more of each blow goes back.', mana: 3, meter: 2, level: 8, ranks: up({ thornsUp: { rounds: 3, share: 0.6 } }, { thornsUp: { rounds: 3, share: 0.8 } }, { thornsUp: { rounds: 4, share: 1 } }) },
  bulwark: { name: 'Unbreakable', classId: 'warrior', text: 'For a few rounds your Block stops almost everything.', mana: 5, level: 12, ranks: up({ blockUp: { rounds: 3, mult: 0.3 } }, { blockUp: { rounds: 3, mult: 0.22 } }, { blockUp: { rounds: 4, mult: 0.15 } }) },
  // ---- Magician: mana is health, damage and defense at once: what do you spend it on? --------------------------------------
  'arcane-bolt': { name: 'Arcane Bolt', classId: 'mage', text: 'A bolt of magic, stronger the more mana you still hold.', mana: 5, level: 1, ranks: up({ power: 1.2, manaPower: 0.7 }, { power: 1.35, manaPower: 0.8 }, { power: 1.5, manaPower: 0.9 }) },
  overflow: { name: 'Overflow', classId: 'mage', text: 'Spend all your Arcana: mana back for each point, and your next spell hits harder.', mana: 0, meterAll: true, level: 1, ranks: up({ manaPerMeter: 8, nextSpell: 1.3 }, { manaPerMeter: 9, nextSpell: 1.4 }, { manaPerMeter: 7, nextSpell: 1.5 }) },
  'arcane-shield': { name: 'Bubble Shield', classId: 'mage', text: 'A shimmering bubble worth a share of your HP that soaks the next damage.', mana: 7, level: 2, ranks: up({ barrierShare: 0.3 }, { barrierShare: 0.4 }, { barrierShare: 0.5 }) },
  // Robin, 2026-11-03: "Magic power - increases magic damage by % over four turns." A full meter of Arcana (it tops out at 5).
  'magic-power': { name: 'Magic Power', classId: 'mage', text: 'Spend a full meter of Arcana: your spells hit harder for four rounds.', mana: 0, meter: 5, level: 3, ranks: up({ spellUp: { rounds: 4, mult: 1.4 } }, { spellUp: { rounds: 4, mult: 1.5 } }, { spellUp: { rounds: 4, mult: 1.6 } }) },
  // Wizard
  fireball: { name: 'Firework', classId: 'mage', text: 'A burst of flame: a huge hit that leaves it burning.', mana: 8, level: 3, ranks: up({ power: 1.8, burn: { rounds: 3, power: 0.22 } }, { power: 2.05 }, { power: 2.3, burn: { rounds: 3, power: 0.26 } }) },
  'wizard-flame': rule('Kindled', 'mage', 'Your spells hit harder.', { spellPower: 1.2 }),
  detonate: { name: 'Detonate', classId: 'mage', text: 'Set off the fire: all the burning it has left lands at once, and stronger.', mana: 3, level: 8, ranks: up({ consume: { kind: 'burn', mult: 2.2 } }, { consume: { kind: 'burn', mult: 2.6 } }, { consume: { kind: 'burn', mult: 3 } }) },
  meteor: { name: 'Falling Star', classId: 'mage', text: 'Call down a star: it lands two rounds later for a huge hit, whatever you do meanwhile.', mana: 10, level: 12, ranks: up({ windup: 2, power: 3 }, { power: 3.4 }, { power: 3.8 }) },
  // Cleric
  smite: { name: 'Smite', classId: 'mage', text: 'Holy light: a strong hit that heals you a little.', mana: 6, level: 3, ranks: up({ power: 1.6, healDealt: 0.25 }, { power: 1.85 }, { power: 2.1, healDealt: 0.35 }) },
  'cleric-grace': rule('Grace', 'mage', 'Your healing is stronger, your defense too, and healing past full becomes a barrier.', { healPower: 1.25, defenseMult: 1.15, healOverflow: 0.5 }),
  mend: { name: 'Mend', classId: 'mage', text: 'Heal a share of your HP, and clear poison and weakness.', mana: 7, level: 8, ranks: up({ healShare: 0.28, cure: true }, { healShare: 0.35 }, { healShare: 0.42 }) },
  'judgement-day': { name: 'Judgement Day', classId: 'mage', text: 'A blast of light that grows with all you have healed this fight.', mana: 9, level: 12, ranks: up({ power: 1.6, healedPower: 1.0 }, { power: 1.8, healedPower: 1.2 }, { power: 2.0, healedPower: 1.4 }) },
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
  'poison-coat': { name: 'Poison Coating', classId: 'rogue', text: 'Coat your blade: your next hits poison it, a steady sting that a fresh hit keeps going.', mana: 5, level: 3, ranks: up({ coat: { hits: 6, power: 0.3, rounds: 3 } }, { coat: { hits: 8, power: 0.34, rounds: 3 } }, { coat: { hits: 9, power: 0.38, rounds: 4 } }) },
  'alchemist-brew': rule('Master Brewer', 'rogue', 'Poison hurts half as much again, and potions do too.', { poisonPower: 1.5, potionPower: 1.5 }),
  'caustic-flask': { name: 'Caustic Flask', classId: 'rogue', text: 'A thrown flask: it takes more damage for a few rounds.', mana: 6, level: 8, ranks: up({ power: 0.7, sunder: { rounds: 3, mult: 1.25 } }, { sunder: { rounds: 3, mult: 1.32 } }, { sunder: { rounds: 4, mult: 1.4 } }) },
  'bitter-end': { name: 'Bitter End', classId: 'rogue', text: 'All the poison in its veins lands at once, and stronger.', mana: 5, level: 12, ranks: up({ consume: { kind: 'poison', mult: 2 } }, { consume: { kind: 'poison', mult: 2.4 } }, { consume: { kind: 'poison', mult: 2.8 } }) },
  // ---- Hunter: read the next: line and answer it --------------------------------------------------------------------------
  volley: { name: 'Triple Shot', classId: 'ranger', text: 'Three quick arrows.', mana: 5, level: 1, ranks: up({ power: 2, hits: 3, split: true }, { power: 2.25 }, { power: 2.5 }) },
  'sure-shot': { name: 'Sure Shot', classId: 'ranger', text: 'Spend 2 Aim: an arrow that surely crits.', mana: 0, meter: 2, level: 1, ranks: up({ power: 1, sureCrit: 1 }, { power: 1.15 }, { power: 1.3 }) },
  'aimed-shot': { name: 'Bullseye', classId: 'ranger', text: 'One careful arrow, far harder on a foe that is winding up.', mana: 5, level: 2, ranks: up({ power: 1.7, windupBonus: 1.6 }, { power: 1.9, windupBonus: 1.7 }, { power: 2.1, windupBonus: 1.8 }) },
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
    traits: { attackMult: 1.12 },
    kit: ['heavy-blow', 'execute'], core: ['heavy-blow', 'execute', 'shield-bash', 'shield-wall'],
    meter: { name: 'Valor', gain: 'block', text: 'Valor builds when you Block a blow, more from a wound-up one.' },
    trees: {
      paladin: { name: 'Paladin', text: 'Heals as it fights and wears the enemy down.', nodes: ['holy-strike', 'paladin-oath', 'judgement', 'last-light'] },
      berserker: { name: 'Berserker', text: 'Hits harder and takes more for it.', nodes: ['reckless', 'berserker-rage', 'blood-price', 'bloodbath'] },
      knight: { name: 'Knight', text: 'More defense, and what hits it gets hurt.', nodes: ['shield-slam', 'knight-oath', 'iron-retort', 'bulwark'] },
    },
  },
  mage: {
    name: 'Magician', style: 'Arcane Ward, Overflow for mana, strong spells.', about: 'Block is an Arcane Ward: it stops part of a blow and costs no mana. Spells are dear: Overflow turns Arcana into mana. Weak staff, strong spells.',
    hp: 90, mana: 40, attack: 7, magic: 6, defense: 4, gold: 50, growth: { hp: 9, mana: 4, attack: 1, magic: 1, defense: 1 },
    // The Ward costs no mana (Robin, 2026-11-03); Brace is as everyone's, Overflow is where the mana comes from.
    traits: { ward: true, attackMagic: 0.8 },
    kit: ['arcane-bolt', 'overflow'], core: ['arcane-bolt', 'overflow', 'arcane-shield', 'magic-power'],
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
    traits: { counterChance: 0.25, counterPower: 0.8 },
    kit: ['volley', 'sure-shot'], core: ['volley', 'sure-shot', 'aimed-shot', 'mark'],
    meter: { name: 'Aim', gain: 'miss', text: 'Aim builds when a blow misses you and when you crit.' },
    trees: {
      ranger: { name: 'Ranger', text: 'Every counterattack is two arrows.', nodes: ['quick-reflex', 'ranger-eye', 'rain-arrows', 'return-fire'] },
      beastmaster: { name: 'Beastmaster', text: 'Fights beside its owl.', nodes: ['hawk', 'beast-bond', 'owl-swoop', 'great-owl'] },
      trapper: { name: 'Trapper', text: 'Reads what comes next and has a trap waiting.', nodes: ['trap', 'trapper-craft', 'snare', 'spike-trap'] },
    },
  },
};

// ---- The talent trees (Robin, 2026-11-02: "think like how wow classic does it, where you mainly go down one tree, and take some in the others"; "enough points and abilities up to level 30"; "classes to feel different").
// Eight tiers a tree; each asks for points already in that tree and a level. Mine: every name, number and pairing. Passives scale by rank.
const pas = (name, text, traits, n = 3) => ({ name, text, mana: 0, rule: traits, ranks: Array.from({ length: n }, () => ({})) });
const act = (name, text, mana, ranks, extra = {}) => ({ name, text, mana, ranks, ...extra });
const TALENTS = {
  warrior: {
    paladin: [
      ['holy-strike', 'pal-devotion'], ['paladin-oath', 'pal-steadfast'], ['judgement', 'pal-mercy'], ['pal-consecrate', 'pal-wrath'], ['last-light', 'pal-aura'], ['pal-avenger', 'pal-faith'], ['pal-exorcism', 'pal-zeal'], ['pal-miracle'],
    ],
    berserker: [
      ['reckless', 'ber-fury'], ['berserker-rage', 'ber-thirst'], ['blood-price', 'ber-savage'], ['ber-cleave', 'ber-wounds'], ['bloodbath', 'ber-keen'], ['ber-frenzy', 'ber-drink'], ['ber-rampage', 'ber-iron'], ['ber-deathwish'],
    ],
    knight: [
      ['shield-slam', 'kni-plate'], ['knight-oath', 'kni-guard'], ['iron-retort', 'kni-spikes'], ['kni-taunt', 'kni-resolve'], ['bulwark', 'kni-bastion'], ['kni-charge', 'kni-mail'], ['kni-rampart', 'kni-riposte'], ['kni-fortress'],
    ],
  },
  mage: {
    wizard: [
      ['fireball', 'wiz-ember'], ['wizard-flame', 'wiz-focus'], ['detonate', 'wiz-well'], ['wiz-scorch', 'wiz-kindling'], ['meteor', 'wiz-clarity'], ['wiz-pillar', 'wiz-sear'], ['wiz-firestorm', 'wiz-heart'], ['wiz-phoenix'],
    ],
    cleric: [
      ['smite', 'cle-prayer'], ['cleric-grace', 'cle-calm'], ['mend', 'cle-halo'], ['cle-renew', 'cle-radiance'], ['judgement-day', 'cle-ward'], ['cle-lance', 'cle-rest'], ['cle-sanctuary', 'cle-zeal'], ['cle-ascend'],
    ],
    spellsword: [
      ['frost-blade', 'spl-edge'], ['spellsword-bond', 'spl-plate'], ['storm-blade', 'spl-eye'], ['spl-thrust', 'spl-flow'], ['arc-slash', 'spl-parry'], ['spl-whirl', 'spl-surge'], ['spl-tempest', 'spl-hunger'], ['spl-avatar'],
    ],
  },
  rogue: {
    ninja: [
      ['blood-on-the-blade', 'nin-hands'], ['ninja-step', 'blood-finale'], ['smoke-escape', 'nin-first'], ['crimson-arc', 'red-mist'], ['clone', 'nin-edge'], ['nin-vanish', 'nin-grip'], ['bleed-out', 'black-blood'], ['nin-army'],
    ],
    shadow: [
      ['shadow-dance', 'sha-dark'], ['shadow-pact', 'shadow-finale'], ['ambush', 'thousand-cuts'], ['sha-cut', 'sha-streak'], ['assassinate', 'sha-finish'], ['sha-blind', 'sha-sight'], ['sha-gloom', 'sha-feed'], ['sha-reaper'],
    ],
    alchemist: [
      ['poison-coat', 'alc-toxin'], ['alchemist-brew', 'alc-flask'], ['caustic-flask', 'alc-fumes'], ['toxic-jab', 'venom-finale'], ['bitter-end', 'alc-mend'], ['alc-bomb', 'alc-salve'], ['alc-plague', 'alc-tonic'], ['alc-philosopher'],
    ],
  },
  ranger: {
    ranger: [
      ['quick-reflex', 'ran-draw'], ['ranger-eye', 'ran-hawkeye'], ['rain-arrows', 'ran-quick'], ['ran-pin', 'ran-steady'], ['return-fire', 'ran-lethal'], ['ran-snipe', 'ran-reflex'], ['ran-barrage', 'ran-opening'], ['ran-master'],
    ],
    beastmaster: [
      ['hawk', 'bea-bond'], ['beast-bond', 'bea-feathers'], ['owl-swoop', 'bea-keen'], ['bea-call', 'bea-pack'], ['great-owl', 'bea-mend'], ['bea-stoop', 'bea-fierce'], ['bea-flock', 'bea-care'], ['bea-king'],
    ],
    trapper: [
      ['trap', 'tra-wire'], ['trapper-craft', 'tra-read'], ['snare', 'tra-barb'], ['tra-pit', 'tra-prepared'], ['spike-trap', 'tra-cunning'], ['tra-net', 'tra-venom'], ['tra-mine', 'tra-patient'], ['tra-master'],
    ],
  },
};
const NEW = {
  // Warrior / Paladin: heals through it, and wears the enemy down. Pairs with Knight's blocks and Berserker's last stand.
  'pal-devotion': pas('Devotion', 'Your healing is 6% stronger a rank.', { healPower: 1.06 }),
  'pal-steadfast': pas('Steadfast', '3% more HP a rank.', { hpMult: 1.03 }),
  'pal-mercy': pas('Mercy', 'Each win heals 5% of your HP a rank.', { winHeal: 0.05 }),
  'pal-consecrate': act('Holy Ground', 'A hit that leaves you healing each round for a while.', 6, up({ power: 0.9, regen: { rounds: 4, share: 0.04 } }, { power: 1, regen: { rounds: 4, share: 0.05 } }, { power: 1.1, regen: { rounds: 5, share: 0.06 } })),
  'pal-wrath': pas('Righteous Wrath', 'A weakened foe takes 6% more a rank.', { weakenedDamage: 1.06 }),
  'pal-aura': pas('Warm Aura', 'You heal 1% of your HP each round, a rank.', { hpRegen: 0.01 }, 2),
  'pal-avenger': act('Avenging Strike', 'Spend 2 Valor: a heavy hit that heals you for much of it.', 6, up({ power: 2, healDealt: 0.5 }, { power: 2.3 }, { power: 2.6, healDealt: 0.6 }), { meter: 2 }),
  'pal-faith': pas('Shield of Faith', 'Start each fight with a barrier of 5% of your HP, a rank.', { barrierStart: 0.05 }),
  'pal-exorcism': act('Exorcism', 'A blast of light that leaves the foe taking more damage.', 9, up({ power: 2.4, sunder: { rounds: 3, mult: 1.2 } }, { power: 2.7 }, { power: 3, sunder: { rounds: 4, mult: 1.25 } })),
  'pal-zeal': pas('Zeal', 'Above 80% HP you deal 5% more a rank.', { highHpDamage: 1.05 }),
  'pal-miracle': act('Miracle', 'Once a fight: back to most of your HP, cured of everything.', 8, [{ healShare: 0.7, cure: true }], { oncePerFight: true }),
  // Warrior / Berserker: the nearer the end, the harder it hits.
  'ber-fury': pas('Bloodlust', 'With a great weapon, your hits heal you 3% of the damage they deal, a rank.', { greatLifesteal: 0.03 }),
  'ber-thirst': pas('Blood Thirst', 'Each win heals 4% of your HP a rank.', { winHeal: 0.04 }),
  'ber-savage': pas('Savage Hits', 'Your crits hit 10% harder a rank.', { critPower: 0.1 }),
  'ber-cleave': act('Cleave', 'Two wild hits.', 6, up({ power: 1.9, hits: 2, split: true }, { power: 2.2 }, { power: 2.5 })),
  'ber-wounds': pas('Open Wounds', 'Under a third of your HP you deal 6% more a rank.', { lowHpDamage: 1.06 }),
  'ber-keen': pas('Second Wind', 'Once a fight, when a blow leaves you under a quarter of your HP, you get back 8% of it, a rank.', { secondWind: 0.08 }),
  'ber-frenzy': act('Frenzy', 'Lose some HP: your hits land far harder for a few rounds.', 4, up({ selfHurt: 0.1, attackUp: { rounds: 3, mult: 1.4 } }, { attackUp: { rounds: 3, mult: 1.5 } }, { attackUp: { rounds: 4, mult: 1.6 } })),
  'ber-drink': pas('Drink Deep', 'A crit heals you 2% of your HP, a rank.', { critHeal: 0.02 }),
  'ber-rampage': act('Rampage', 'Four huge swings, at a cost.', 8, up({ power: 3, hits: 4, split: true, selfHurt: 0.08 }, { power: 3.4 }, { power: 3.8 })),
  'ber-iron': pas('Iron Will', 'Under a third of your HP you take 7% less a rank.', { lowHpTaken: 0.93 }),
  'ber-deathwish': pas('Death Wish', 'Under a third of your HP: a quarter more damage dealt, 15% less taken.', { lowHpDamage: 1.25, lowHpTaken: 0.85 }, 1),
  // Warrior / Knight: stands there, and what hits it gets hurt.
  'kni-plate': pas('Heavy Plate', '4% more defense a rank.', { defenseMult: 1.04 }),
  'kni-guard': pas('Practised Guard', 'A Block stops 5% more a rank.', { blockPower: 0.05 }),
  'kni-spikes': pas('Spiked Plate', '5% more of each blow goes back, a rank.', { thorns: 0.05 }),
  'kni-taunt': act('Taunting Shout', 'The foe swings wild: its blows are weaker for a few rounds.', 4, up({ weaken: { rounds: 3, mult: 0.75 } }, { weaken: { rounds: 3, mult: 0.7 } }, { weaken: { rounds: 4, mult: 0.65 } })),
  'kni-resolve': pas('Resolve', 'Start each fight with a point of Valor, a rank.', { meterStart: 1 }, 2),
  'kni-bastion': pas('Bastion', 'Start each fight with a barrier of 6% of your HP, a rank.', { barrierStart: 0.06 }),
  'kni-charge': act('Shield Charge', 'A hit that grows with your defense and stuns a lesser foe.', 7, up({ power: 1.4, defensePower: 1.2, stun: 1 }, { defensePower: 1.5 }, { defensePower: 1.8 })),
  'kni-mail': pas('Layered Mail', '4% more HP a rank.', { hpMult: 1.04 }),
  'kni-rampart': act('Rampart', 'Spend 3 Valor: a great barrier, and far more of each blow goes back.', 6, up({ barrierShare: 0.4, thornsUp: { rounds: 3, share: 0.3 } }, { barrierShare: 0.5 }, { barrierShare: 0.6, thornsUp: { rounds: 4, share: 0.4 } }), { meter: 3 }),
  'kni-riposte': pas('Riposte', 'A 5% chance a rank to strike back when hit.', { counterChance: 0.05 }),
  'kni-fortress': act('Living Fortress', 'Once a fight: a huge barrier, and for a while your Block stops nearly all.', 8, [{ barrierShare: 0.6, blockUp: { rounds: 5, mult: 0.15 } }], { oncePerFight: true }),
  // Magician / Wizard: fire and huge hits, and a mana problem.
  'wiz-ember': pas('Embers', 'Your burns hurt 8% more a rank.', { burnPower: 1.08 }),
  'wiz-focus': pas('Focus', 'Your spells are 3% stronger a rank.', { spellPower: 1.03 }),
  'wiz-well': pas('Deep Well', '5% more mana and 4% more HP a rank.', { manaMult: 1.05, hpMult: 1.04 }),
  'wiz-scorch': act('Scorch', 'A cheap, quick flame that sets it burning.', 4, up({ power: 0.9, burn: { rounds: 3, power: 0.25 } }, { power: 1 }, { power: 1.1, burn: { rounds: 4, power: 0.3 } })),
  'wiz-kindling': pas('Kindling', 'A burning foe takes 6% more a rank.', { burningDamage: 1.06 }),
  'wiz-clarity': pas('Clarity', 'You regain 1% of your mana each round, a rank.', { manaRegen: 0.01 }),
  'wiz-pillar': act('Pillar of Fire', 'Three bursts of flame.', 12, up({ power: 2.4, hits: 3, split: true, burn: { rounds: 3, power: 0.3 } }, { power: 2.8 }, { power: 3.2 })),
  'wiz-sear': pas('Searing Crits', 'Your crits hit 10% harder a rank.', { critPower: 0.1 }),
  'wiz-firestorm': act('Firestorm', 'A round to call it, then the sky falls and the ground burns.', 16, up({ windup: 1, power: 5.6, burn: { rounds: 3, power: 0.3 } }, { power: 6.4 }, { power: 7.2, burn: { rounds: 3, power: 0.35 } })),
  'wiz-heart': pas('Heart of Flame', 'Each win gives back 5% of your mana a rank.', { winMana: 0.05 }),
  'wiz-phoenix': act('Phoenix', 'Once a fight: a great blast, and the next blow that would fell you leaves you standing.', 14, [{ power: 2.5, guardian: 0.4, burn: { rounds: 4, power: 0.4 } }], { oncePerFight: true }),
  // Magician / Cleric: outlasts everything with holy light.
  'cle-prayer': pas('Prayer', 'Your healing is 6% stronger a rank.', { healPower: 1.06 }),
  'cle-calm': pas('Calm Mind', 'You regain 1% of your mana each round, a rank.', { manaRegen: 0.01 }),
  'cle-halo': pas('Halo', 'Start each fight with a barrier of 5% of your HP, a rank.', { barrierStart: 0.05 }),
  'cle-renew': act('Renew', 'You heal a share of your HP each round for a while.', 7, up({ regen: { rounds: 5, share: 0.05 } }, { regen: { rounds: 5, share: 0.06 } }, { regen: { rounds: 6, share: 0.07 } })),
  'cle-radiance': pas('Radiance', 'Above 80% HP you deal 4% more a rank.', { highHpDamage: 1.04 }),
  'cle-ward': pas('Holy Ward', 'You take 3% less a rank.', { damageTaken: 0.97 }),
  'cle-lance': act('Lance of Light', 'A beam that heals you for part of it.', 9, up({ power: 2.1, healDealt: 0.4 }, { power: 2.4 }, { power: 2.7, healDealt: 0.5 })),
  'cle-rest': pas('Blessed Rest', 'Each win heals 5% of your HP a rank.', { winHeal: 0.05 }),
  'cle-sanctuary': act('Sanctuary', 'A great barrier, and cured of everything.', 12, up({ barrierShare: 0.45, cure: true }, { barrierShare: 0.55 }, { barrierShare: 0.65 })),
  'cle-zeal': pas('Holy Zeal', 'Your spells are 3% stronger a rank.', { spellPower: 1.03 }),
  'cle-ascend': act('Ascension', 'Once a fight: healed of most wounds, and your hits land far harder for a while.', 12, [{ healShare: 0.7, attackUp: { rounds: 4, mult: 1.35 } }], { oncePerFight: true }),
  // Magician / Spellsword: a mage in the thick of it, with a blade.
  'spl-edge': pas('Honed Edge', '3% more attack a rank.', { attackMult: 1.03 }),
  'spl-plate': pas('Enchanted Mail', '4% more defense a rank.', { defenseMult: 1.04 }),
  'spl-eye': pas('Duelling Eye', '2% more crit a rank.', { crit: 0.02 }),
  'spl-thrust': act('Spell Thrust', 'A clean thrust, charged with whatever the blade holds.', 5, up({ power: 1.7, melee: true }, { power: 1.95 }, { power: 2.2 })),
  'spl-flow': pas('Flow', 'A crit gives back 2% of your mana, a rank.', { critMana: 0.02 }),
  'spl-parry': pas('Parry', '2% more dodge a rank.', { dodge: 0.02 }),
  'spl-whirl': act('Blade Whirl', 'Three quick cuts, all charged.', 9, up({ power: 2.2, hits: 3, split: true, melee: true }, { power: 2.5 }, { power: 2.8 })),
  'spl-surge': pas('Surge', 'Start each fight with a point of Arcana, a rank.', { meterStart: 1 }, 2),
  'spl-tempest': act('Tempest Blade', 'The blade holds the storm longer, and bites harder.', 10, up({ infuse: { kind: 'storm', rounds: 6, power: 0.5 } }, { infuse: { kind: 'storm', rounds: 6, power: 0.6 } }, { infuse: { kind: 'storm', rounds: 7, power: 0.7 } })),
  'spl-hunger': pas('Hungry Blade', 'A crit heals you 2% of your HP, a rank.', { critHeal: 0.02 }),
  'spl-avatar': act('Avatar of War', 'Once a fight: for a while, every hit lands far harder.', 12, [{ attackUp: { rounds: 5, mult: 1.6 } }], { oncePerFight: true }),
  // Rogue / Ninja: swords and daggers, and blood (Robin, 2026-11-03: "its main thing being blood. Blood is an effect where your blade gets bloody after you have attacked").
  'blood-on-the-blade': pas('Blood on the Blade', 'With a blade, each attack that lands leaves a drop of blood on it, up to three. Ninja skills spend it.', { blood: 3 }, 1),
  'blood-finale': pas('Blood Finale', 'Grand Finale spends your blood: each drop opens a bleed of 12% of your attack for three rounds, a rank.', { bloodFinale: 0.12 }),
  'red-mist': pas('Red Mist', 'Spending blood heals you 2% of your HP a drop, a rank.', { redMist: 0.02 }),
  'crimson-arc': act('Crimson Arc', 'A cut that spends all your blood: harder for every drop.', 6, up({ power: 1.3, perBlood: 0.45, spendBlood: true }, { power: 1.45, perBlood: 0.5 }, { power: 1.6, perBlood: 0.55 }), { needs: ['blade'] }),
  'bleed-out': act('Bleed Out', 'A deep cut that bleeds for three rounds, more for every drop of blood it spends.', 8, up({ power: 1, bleed: { rounds: 3, power: 0.3, perBlood: 0.15 }, spendBlood: true }, { power: 1.15, bleed: { rounds: 3, power: 0.34, perBlood: 0.17 } }, { power: 1.3, bleed: { rounds: 4, power: 0.38, perBlood: 0.2 } }), { needs: ['blade'] }),
  'black-blood': pas('Black Blood', 'A foe both bleeding and poisoned takes each sting twice.', { blackBlood: true }, 1),
  'nin-hands': pas('Quick Hands', '2% more crit a rank.', { crit: 0.02 }),
  'nin-fleet': pas('Fleet', '2% more dodge a rank.', { dodge: 0.02 }),
  'nin-first': pas('First Blood', 'In the first round you deal 10% more a rank.', { firstRoundDamage: 1.1 }),
  'nin-kunai': act('Kunai Storm', 'Five thrown blades, each with its own chance to crit.', 7, up({ power: 1.8, hits: 5, split: true }, { power: 2.1 }, { power: 2.4 })),
  'nin-calm': pas('Still Water', 'A dodge heals you 2% of your HP, a rank.', { dodgeHeal: 0.02 }),
  'nin-edge': pas('Razor Edge', 'Your crits hit 10% harder a rank.', { critPower: 0.1 }),
  'nin-vanish': act('Vanish', 'The next two blows miss, and your next hit is a sure crit.', 7, up({ evade: 2, sureCrit: 1 }, { evade: 2, sureCrit: 2 }, { evade: 3, sureCrit: 2 })),
  'nin-grip': pas('Sure Grip', '3% more attack a rank.', { attackMult: 1.03 }),
  'nin-lotus': act('Falling Lotus', 'Seven strikes too fast to follow.', 11, up({ power: 3, hits: 7, split: true }, { power: 3.4 }, { power: 3.8 })),
  'nin-feint': pas('Feint', 'After a dodge your next hit is a sure crit.', { dodgeCrit: true }, 1),
  'nin-army': act('Army of One', 'Once a fight: copies of you join in, and every attack strikes again and again.', 10, [{ clone: { rounds: 6, power: 0.9 } }], { oncePerFight: true }),
  // Rogue / Shadow: daggers and crits, many small hits (Robin, 2026-11-03).
  'thousand-cuts': act('Thousand Cuts', 'Six quick cuts, each with its own chance to crit.', 6, up({ power: 1.5, hits: 6, split: true }, { power: 1.7 }, { power: 1.9 }), { needs: ['dagger'] }),
  'shadow-finale': pas('Shadow Finale', 'Grand Finale strikes three times, and each point of Mischief adds 4% to its crit chance, a rank.', { shadowFinale: 0.04 }),
  'sha-dark': pas('Cruel Edge', 'Your crits hit 10% harder a rank.', { critPower: 0.1 }),
  'sha-cover': pas('Cover of Dark', '2% more dodge a rank.', { dodge: 0.02 }),
  'sha-opening': pas('From Behind', 'In the first round you deal 10% more a rank.', { firstRoundDamage: 1.1 }),
  'sha-cut': act('Crippling Cut', 'A hit that weakens its blows.', 5, up({ power: 1.5, weaken: { rounds: 3, mult: 0.75 } }, { power: 1.7 }, { power: 1.9, weaken: { rounds: 3, mult: 0.7 } })),
  'sha-streak': pas('Patient Blade', 'Every hit adds 1% more to your growing crit chance, a rank.', { critStreak: 0.01 }),
  'sha-finish': pas('Finisher', 'A foe under a third of its HP takes 8% more a rank.', { executeDamage: 1.08 }),
  'sha-blind': act('Blinding Powder', 'The enemy loses its next turn, boss or not.', 8, [{ skip: 1 }, { skip: 1, sureCrit: 1 }]),
  'sha-sight': pas('Dark Sight', '2% more crit a rank.', { crit: 0.02 }),
  'sha-gloom': act('Night Cut', 'A sure crit from nowhere.', 9, up({ power: 2.6, sureCrit: 1 }, { power: 3 }, { power: 3.4 })),
  'sha-feed': pas('Feed on Fear', 'A crit heals you 2% of your HP, a rank.', { critHeal: 0.02 }),
  'sha-reaper': act('Reaper', 'A hard cut, and a killing one on a foe under 40% of its HP.', 12, [{ power: 2.2, executeBelow: 0.4, executePower: 5.5 }]),
  // Rogue / Alchemist: poison set up, then cashed in (Robin, 2026-11-03: "other skills you want to use that gets benefits from the target being poisoned").
  'toxic-jab': act('Toxic Jab', 'A quick stab, far harder on a poisoned foe.', 4, up({ power: 1.1, vsPoisoned: 1.7 }, { power: 1.2, vsPoisoned: 1.8 }, { power: 1.3, vsPoisoned: 1.9 }), { needs: ['dagger'] }),
  'venom-finale': pas('Venom Finale', "Grand Finale on a poisoned foe bursts the poison too: half its sting for each point of Mischief, a rank.", { venomFinale: 0.5 }),
  'alc-toxin': pas('Stronger Toxin', 'Your poison hurts 8% more a rank.', { poisonPower: 1.08 }),
  'alc-flask': pas('Better Flasks', 'Your flasks work 10% better a rank.', { potionPower: 1.1 }),
  'alc-fumes': pas('Fumes', 'A poisoned foe takes 5% more a rank.', { poisonedDamage: 1.05 }),
  'alc-vitriol': act('Vitriol', 'A splash that eats on for rounds.', 5, up({ power: 0.8, poison: { rounds: 4, power: 0.35 } }, { poison: { rounds: 4, power: 0.42 } }, { poison: { rounds: 5, power: 0.5 } })),
  'alc-tough': pas('Tough Gut', 'You take 3% less a rank.', { damageTaken: 0.97 }),
  'alc-mend': pas('Slow Mend', 'You heal 1% of your HP each round, a rank.', { hpRegen: 0.01 }, 2),
  'alc-bomb': act('Fire Flask', 'A burst of flame that leaves it burning.', 8, up({ power: 2, burn: { rounds: 3, power: 0.35 } }, { power: 2.3 }, { power: 2.6 })),
  'alc-salve': pas('Salve', 'Each win heals 5% of your HP a rank.', { winHeal: 0.05 }),
  'alc-plague': act('Plague Cloud', 'A choking cloud: long poison, and weaker blows.', 10, up({ poison: { rounds: 6, power: 0.55 }, weaken: { rounds: 3, mult: 0.8 } }, { poison: { rounds: 6, power: 0.65 } }, { poison: { rounds: 7, power: 0.75 } })),
  'alc-tonic': pas('Tonic', 'You regain 1% of your mana each round, a rank.', { manaRegen: 0.01 }),
  'alc-philosopher': act("Philosopher's Draught", 'Once a fight: most of your wounds healed, and your hits land harder for a while.', 8, [{ healShare: 0.6, cure: true, attackUp: { rounds: 4, mult: 1.3 } }], { oncePerFight: true }),
  // Hunter / Ranger: shoots back, and back again.
  'ran-draw': pas('Strong Draw', '3% more attack a rank.', { attackMult: 1.03 }),
  'ran-hawkeye': pas('Hawk Eye', '2% more crit a rank.', { crit: 0.02 }),
  'ran-quick': pas('Quick Nock', 'A 3% better chance a rank to shoot back.', { counterChance: 0.03 }),
  'ran-pin': act('Hobbling Shot', 'A shot that stuns a lesser foe.', 5, up({ power: 1.3, stun: 1 }, { power: 1.5 }, { power: 1.7 })),
  'ran-steady': pas('Steady Return', 'Your shots back are 6% stronger a rank.', { counterPower: 0.06 }),
  'ran-lethal': pas('Lethal Shots', 'Your crits hit 10% harder a rank.', { critPower: 0.1 }),
  'ran-snipe': act('Long Shot', 'A round to aim, then a very hard shot.', 8, up({ windup: 1, power: 3.2 }, { power: 3.7 }, { power: 4.2 })),
  'ran-reflex': pas('Light Step', '2% more dodge a rank.', { dodge: 0.02 }),
  'ran-barrage': act('Barrage', 'Six arrows at once.', 10, up({ power: 3, hits: 6, split: true }, { power: 3.4 }, { power: 3.8 })),
  'ran-opening': pas('Opening Shot', 'In the first round you deal 12% more a rank.', { firstRoundDamage: 1.12 }),
  'ran-master': act('Master Archer', 'Once a fight: for a while you shoot back at nearly everything, and shoot harder.', 8, [{ counterUp: { rounds: 6, chance: 0.5 }, attackUp: { rounds: 6, mult: 1.3 } }], { oncePerFight: true }),
  // Hunter / Beastmaster: the owl does half the work.
  'bea-bond': pas('Close Bond', 'Your owl hits 8% harder a rank.', { companionPower: 1.08 }),
  'bea-feathers': pas('Thick Coat', '3% more HP a rank.', { hpMult: 1.03 }),
  'bea-keen': pas('Keen Sight', '2% more crit a rank.', { crit: 0.02 }),
  'bea-call': act('Call the Owl', 'The owl comes for a long while, no Aim asked.', 6, up({ companion: { rounds: 5, power: 0.6 } }, { companion: { rounds: 5, power: 0.7 } }, { companion: { rounds: 6, power: 0.8 } })),
  'bea-pack': pas('Hunting Pair', '3% more attack a rank.', { attackMult: 1.03 }),
  'bea-mend': pas('Preening', 'You heal 1% of your HP each round, a rank.', { hpRegen: 0.01 }, 2),
  'bea-stoop': act('Stoop', 'The owl dives with your arrow: a very hard hit.', 8, up({ power: 2.4 }, { power: 2.8 }, { power: 3.2 })),
  'bea-fierce': pas('Fierce Owl', 'Your owl hits 8% harder a rank.', { companionPower: 1.08 }),
  'bea-flock': act('The Flock', 'Three strikes from the owl every round, for a while.', 11, up({ companion: { rounds: 4, power: 0.6, hits: 3 } }, { companion: { rounds: 4, power: 0.7, hits: 3 } }, { companion: { rounds: 5, power: 0.75, hits: 3 } })),
  'bea-care': pas('Kindly Care', 'Each win heals 5% of your HP a rank.', { winHeal: 0.05 }),
  'bea-king': act('King of the Air', 'Once a fight: the greatest owl there is, hitting twice a round, for a long while.', 10, [{ companion: { rounds: 8, power: 1.3, hits: 2 } }], { oncePerFight: true }),
  // Hunter / Trapper: knows what comes next.
  'tra-wire': pas('Barbed Wire', 'A foe caught by a trap also takes 15% of your attack, a rank.', { trapHit: 0.15 }),
  'tra-read': pas('Read the Ground', '2% more dodge a rank.', { dodge: 0.02 }),
  'tra-barb': pas('Barbs', 'A stunned foe takes 6% more a rank.', { stunnedDamage: 1.06 }),
  'tra-pit': act('Pit', 'It falls in: stunned for two rounds, if it is a lesser foe.', 6, up({ power: 0.6, stun: 2 }, { power: 0.8 }, { power: 1 })),
  'tra-prepared': pas('Prepared', 'In the first round you deal 10% more a rank.', { firstRoundDamage: 1.1 }),
  'tra-cunning': pas('Cunning', 'Start each fight with a point of Aim, a rank.', { meterStart: 1 }, 2),
  'tra-net': act('Weighted Net', 'It loses its next turn and hits weaker after.', 8, [{ skip: 1 }, { skip: 1, weaken: { rounds: 3, mult: 0.75 } }]),
  'tra-venom': pas('Venom on the Spikes', 'A poisoned foe takes 5% more a rank.', { poisonedDamage: 1.05 }),
  'tra-mine': act('Fire Pot', 'A buried pot goes off: a hard blast that leaves it burning.', 10, up({ power: 2.6, burn: { rounds: 3, power: 0.35 } }, { power: 3 }, { power: 3.4 })),
  'tra-patient': pas('Patient', 'A 3% better chance a rank to shoot back.', { counterChance: 0.03 }),
  'tra-master': act('Master of Snares', 'Once a fight: its next three wind-ups fail, and it loses its next turn.', 9, [{ trap: 3, skip: 1 }], { oncePerFight: true }),
};
const TIER_LEVELS = [2, 5, 9, 13, 17, 21, 25, 30];
for (const [classId, trees] of Object.entries(TALENTS)) {
  for (const [tree, tiers] of Object.entries(trees)) {
    C[classId].trees[tree].tiers = tiers;
    C[classId].trees[tree].nodes = tiers.flat();
    tiers.forEach((row, i) => {
      for (const id of row) {
        if (!A[id] && !NEW[id]) throw new Error(`no such talent: ${id}`);
        A[id] = { ...(A[id] ?? NEW[id]), classId, level: TIER_LEVELS[i] };
      }
    });
  }
}

// The skills tied to a weapon (Robin, 2026-11-03: "Skills that are obvious weapon focused ... only usable when correct weapon equipped").
const NEEDS = { shield: ['shield-bash', 'shield-wall', 'shield-slam', 'kni-charge', 'kni-rampart'], staff: ['meteor', 'wiz-firestorm'], bow: ['volley', 'aimed-shot', 'rain-arrows', 'ran-pin', 'ran-snipe', 'ran-barrage', 'snare'], dagger: ['poison-coat'] };
for (const [need, ids] of Object.entries(NEEDS)) for (const id of ids) A[id] = { ...A[id], needs: [need] };
for (const id of ['frost-blade', 'storm-blade', 'spl-thrust', 'arc-slash', 'spl-whirl', 'spl-tempest']) A[id] = { ...A[id], needs: ['wand', 'sword'] };
delete A.shuriken;
// Spells cost more, so Overflow is how a Magician keeps casting (Robin, 2026-11-03: "make spells cost more to encourage using the
// overflow to get mana back"): half as much again, Overflow itself free.
const MAGE_COST = 1.5;
for (const a of Object.values(A)) if (a.classId === 'mage' && a.mana) a.mana = Math.ceil(a.mana * MAGE_COST);

const json = (x) => `${JSON.stringify(x, null, 2)}\n`;
writeFileSync('rules/data/abilities.json', json(A));
const old = JSON.parse(readFileSync('rules/data/classes.json', 'utf8'));
// What the character screen says of each class (Robin, 2026-11-02: "better overarching descriptions... some examples of what the class can do").
const WORDS = {
  "warrior": {
    "tagline": "Takes the hits up front. Every blow it blocks comes back harder.",
    "story": "The hardest class to knock down, with the most HP and armour. Its power comes from the fight itself: block a blow to build Valor, then spend it on a huge swing or a wall of steel. For you if you like to stand your ground and outlast anything.",
    "showcase": {
      "paladin": [
        "holy-strike",
        "last-light",
        "pal-miracle"
      ],
      "berserker": [
        "reckless",
        "blood-price",
        "ber-rampage"
      ],
      "knight": [
        "shield-slam",
        "iron-retort",
        "kni-fortress"
      ]
    }
  },
  "mage": {
    "tagline": "The strongest spells of all, and very little to stand on.",
    "story": "Fragile, with a weak staff, but nothing hits harder than its spells. Mana is everything, and it all goes to your magic: your Ward stops blows for free, spells are dear, and Overflow turns your Arcana back into mana. For you if you like to plan ahead and end fights fast.",
    "showcase": {
      "wizard": [
        "fireball",
        "detonate",
        "meteor"
      ],
      "cleric": [
        "smite",
        "mend",
        "cle-ascend"
      ],
      "spellsword": [
        "frost-blade",
        "storm-blade",
        "spl-avatar"
      ]
    }
  },
  "rogue": {
    "tagline": "Quick, slippery and lucky. Hits three times while others swing once.",
    "story": "Its Attack strikes three times, and each hit makes a crit more likely until one lands. It dodges often but takes more when caught, so it wins by not being hit. Every attack builds Mischief for its finishing moves. For you if you like fast fights and big numbers.",
    "showcase": {
      "ninja": [
        "crimson-arc",
        "clone",
        "nin-army"
      ],
      "shadow": [
        "shadow-dance",
        "assassinate",
        "sha-reaper"
      ],
      "alchemist": [
        "poison-coat",
        "bitter-end",
        "alc-philosopher"
      ]
    }
  },
  "ranger": {
    "tagline": "Strikes first and shoots back. Enemies pay for every swing they take.",
    "story": "Bows only. It acts first in every fight and often shoots back when struck, so the fight is half won before it reaches you. Aim builds when a blow misses you and when you crit. For you if you like to read the fight and let it come to you.",
    "showcase": {
      "ranger": [
        "quick-reflex",
        "rain-arrows",
        "ran-master"
      ],
      "beastmaster": [
        "hawk",
        "great-owl",
        "bea-king"
      ],
      "trapper": [
        "trap",
        "spike-trap",
        "tra-master"
      ]
    }
  }
};
for (const [id, words] of Object.entries(WORDS)) Object.assign(C[id], words);
writeFileSync('rules/data/classes.json', json(old.classes ? { ...old, classes: C } : C));
console.log(`${Object.keys(A).length} abilities, ${Object.keys(C).length} classes`);
