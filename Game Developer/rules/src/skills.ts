// How a class grows (Robin, 2026-11-02: "think like how wow classic does it, where you mainly go down one tree, and take some in the others"; "enough points and abilities up to level 30"). A point a level, and a region's boss one more. The class's own four come free with the level; a point raises them. Each of the three trees has eight tiers: a tier asks for points already spent in that tree and a level, so a tree is walked down, and there are never enough points for all three. Five abilities can be carried from level 15, four before. Everything can be reset for free in a town.

import { ABILITIES, CLASS_DATA, SETS, TRINKETS, UNIQUES, type ClassTraits } from './data.ts';
import { SLOTS, type Character } from './types.ts';

export const MAX_CARRIED = 5;
/** Points a tier asks for already in its tree, a tier. */
export const TIER_POINTS = 3;

/** How many abilities go into a fight at this level. */
export function carriedLimit(level: number): number {
  return level >= 15 ? MAX_CARRIED : MAX_CARRIED - 1;
}

/** The points levels have brought by this level: one a level. */
export function pointsForLevel(level: number): number {
  return Math.max(0, level - 1);
}

/** Points spent: every rank known, but for the first rank of what the class starts with. */
export function pointsSpent(c: Character): number {
  const core = CLASS_DATA[c.classId]?.core ?? [];
  return Object.entries(c.abilities).reduce((sum, [id, rank]) => sum + rank - (core.includes(id) ? 1 : 0), 0);
}

export function pointsFree(c: Character): number {
  return pointsForLevel(c.level) + (c.bonusPoints ?? 0) - pointsSpent(c);
}

/** These multiply when two rules both have them; other numbers add. */
const MULTIPLIED = new Set(['attackMult', 'manaMult', 'lowHpDamage', 'highHpDamage', 'lowHpTaken', 'executeDamage', 'firstRoundDamage', 'burningDamage', 'poisonedDamage', 'weakenedDamage', 'stunnedDamage', 'burnPower', 'damageDealt', 'damageTaken', 'defenseMult', 'hpMult', 'spellPower', 'healPower', 'poisonPower', 'potionPower', 'companionPower']);

/** The class's always-on rules, with those of the tree rules it has learned. */
/** How many pieces of each set are worn. */
export function setsWorn(c: Character): Record<string, number> {
  const out: Record<string, number> = {};
  for (const slot of SLOTS) {
    const set = c.equipment[slot]?.set;
    if (set && SETS[set]) out[set] = (out[set] ?? 0) + 1;
  }
  return out;
}

export function traitsOf(c: Character): ClassTraits {
  const out: Record<string, number | boolean> = { ...CLASS_DATA[c.classId]?.traits };
  // What gear gives: a unique's traits, and each set's bonuses for the pieces worn. The same words as talents, helping the same way.
  const fromGear: Partial<ClassTraits>[] = [];
  for (const slot of SLOTS) {
    const u = c.equipment[slot]?.unique;
    if (u && UNIQUES[u]?.traits) fromGear.push(UNIQUES[u]!.traits!);
    const t = c.equipment[slot]?.trinket;
    if (t && TRINKETS[t]?.traits) fromGear.push(TRINKETS[t]!.traits!);
  }
  for (const [set, worn] of Object.entries(setsWorn(c))) {
    for (const [need, bonus] of Object.entries(SETS[set]!.bonuses)) if (worn >= Number(need)) fromGear.push(bonus.traits);
  }
  for (const traits of fromGear) {
    for (const [key, value] of Object.entries(traits)) {
      const had = out[key];
      if (typeof value === 'boolean') out[key] = value;
      else if (MULTIPLIED.has(key)) out[key] = (typeof had === 'number' ? had : 1) * (value as number);
      else out[key] = (typeof had === 'number' ? had : 0) + (value as number);
    }
  }
  for (const [id, rank] of Object.entries(c.abilities)) {
    for (const [key, value] of Object.entries(ABILITIES[id]?.rule ?? {})) {
      // A rank is another helping of the rule.
      const had = out[key];
      if (typeof value === 'boolean') out[key] = value;
      else if (MULTIPLIED.has(key)) out[key] = (typeof had === 'number' ? had : 1) * value ** rank;
      else out[key] = (typeof had === 'number' ? had : 0) + value * rank;
    }
  }
  return out as ClassTraits;
}

/** The tree an ability sits in, and its tier; null for the class's own four. */
function placeInTree(c: Character, ability: string): { nodes: string[]; tier: number } | null {
  for (const tree of Object.values(CLASS_DATA[c.classId]?.trees ?? {})) {
    const tier = tree.tiers.findIndex((row) => row.includes(ability));
    if (tier >= 0) return { nodes: tree.nodes, tier };
  }
  return null;
}

/** Points spent in the tree an ability sits in. */
function pointsInTree(c: Character, nodes: string[]): number {
  return nodes.reduce((sum, id) => sum + (c.abilities[id] ?? 0), 0);
}

/** What still stands between you and an ability: the level, the points in its tree. */
export function needsFor(c: Character, ability: string): { level: number; points: number } {
  const a = ABILITIES[ability];
  const place = placeInTree(c, ability);
  return { level: Math.max(0, (a?.level ?? 0) - c.level), points: place ? Math.max(0, place.tier * TIER_POINTS - pointsInTree(c, place.nodes)) : 0 };
}

/** Everything the class can come to know. */
export function abilitiesFor(c: Character): string[] {
  const cls = CLASS_DATA[c.classId];
  if (!cls) return [];
  return [...cls.core, ...Object.values(cls.trees).flatMap((t) => t.nodes)];
}

/** Whether the way to this ability is open: its level reached, and the node above it in its tree known. */
export function isOpen(c: Character, ability: string): boolean {
  const a = ABILITIES[ability];
  if (!a || !abilitiesFor(c).includes(ability) || c.level < a.level) return false;
  const place = placeInTree(c, ability);
  return !place || pointsInTree(c, place.nodes) >= place.tier * TIER_POINTS;
}

export function canLearn(c: Character, ability: string): boolean {
  const a = ABILITIES[ability];
  return !!a && isOpen(c, ability) && (c.abilities[ability] ?? 0) < a.ranks.length && pointsFree(c) > 0;
}

/** The tree most points went into, for a title; null while none has any. */
export function specialization(c: Character): string | null {
  let best: string | null = null;
  let most = 0;
  for (const tree of Object.values(CLASS_DATA[c.classId]?.trees ?? {})) {
    const points = tree.nodes.reduce((sum, id) => sum + (c.abilities[id] ?? 0), 0);
    if (points > most) {
      most = points;
      best = tree.name;
    }
  }
  return best;
}

/** The class's own four, free as the level comes: first ranks known, carried while there is room. */
export function withCore(c: Character): Character {
  const cls = CLASS_DATA[c.classId];
  if (!cls) return c;
  const due = cls.core.filter((id) => !c.abilities[id] && (ABILITIES[id]?.level ?? 1) <= c.level);
  if (!due.length) return c;
  const carried = [...c.carried];
  for (const id of due) if (carried.length < carriedLimit(c.level)) carried.push(id);
  return { ...c, abilities: { ...c.abilities, ...Object.fromEntries(due.map((id) => [id, 1])) }, carried };
}

/** Back to the class's own four: the points are free again. */
export function resetSkills(c: Character): Character {
  return withCore({ ...c, abilities: {}, carried: [] });
}

/** The numbers a class has at a level, before gear. */
export function baseNumbers(classId: string, level: number): Pick<Character, 'maxHp' | 'maxMana' | 'attack' | 'defense'> {
  const cls = CLASS_DATA[classId as Character['classId']]!;
  const grown = level - 1;
  return { maxHp: cls.hp + cls.growth.hp * grown, maxMana: cls.mana + cls.growth.mana * grown, attack: cls.attack + cls.growth.attack * grown, defense: cls.defense + cls.growth.defense * grown };
}
