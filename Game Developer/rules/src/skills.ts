// How a class grows (Robin, 2026-11-02: "the 4 main classes have their different things, and then you can specialize down into those sub
// classes"; "picking down three different trees"). Mine: every level brings a point, every second one past ten, and a region's boss one more.
// A point learns an ability or raises its rank: the class's own four, or a node in any of its three trees, top to bottom, each node opening
// the next. The second node of a tree is its always-on rule. Nothing locks a tree; there are too few points to fill them all, so where they
// go is the specialization. Four abilities are carried into a fight; everything can be reset for free in a town.

import { ABILITIES, CLASS_DATA, type ClassTraits } from './data.ts';
import type { Character } from './types.ts';

export const MAX_CARRIED = 4;

/** The points levels have brought by this level: one a level to ten, then one every second level. */
export function pointsForLevel(level: number): number {
  return Math.max(0, Math.min(level, 10) - 1) + Math.max(0, Math.floor((level - 10) / 2));
}

/** Points spent: every rank known, but for the first rank of what the class starts with. */
export function pointsSpent(c: Character): number {
  const kit = CLASS_DATA[c.classId]?.kit ?? [];
  return Object.entries(c.abilities).reduce((sum, [id, rank]) => sum + rank - (kit.includes(id) ? 1 : 0), 0);
}

export function pointsFree(c: Character): number {
  return pointsForLevel(c.level) + (c.bonusPoints ?? 0) - pointsSpent(c);
}

/** These multiply when two rules both have them; other numbers add. */
const MULTIPLIED = new Set(['damageDealt', 'damageTaken', 'defenseMult', 'hpMult', 'spellPower', 'healPower', 'poisonPower', 'potionPower', 'companionPower']);

/** The class's always-on rules, with those of the tree rules it has learned. */
export function traitsOf(c: Character): ClassTraits {
  const out: Record<string, number | boolean> = { ...CLASS_DATA[c.classId]?.traits };
  for (const id of Object.keys(c.abilities)) {
    for (const [key, value] of Object.entries(ABILITIES[id]?.rule ?? {})) {
      const had = out[key];
      if (typeof value === 'boolean' || had === undefined) out[key] = value;
      else out[key] = MULTIPLIED.has(key) ? (had as number) * value : (had as number) + value;
    }
  }
  return out as ClassTraits;
}

/** The tree an ability sits in, and where; null for the class's own four. */
function placeInTree(c: Character, ability: string): { nodes: string[]; at: number } | null {
  for (const tree of Object.values(CLASS_DATA[c.classId]?.trees ?? {})) {
    const at = tree.nodes.indexOf(ability);
    if (at >= 0) return { nodes: tree.nodes, at };
  }
  return null;
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
  return !place || place.at === 0 || !!c.abilities[place.nodes[place.at - 1]!];
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

/** Back to what the class starts with: the points are free again. */
export function resetSkills(c: Character): Character {
  const kit = CLASS_DATA[c.classId]?.kit ?? [];
  return { ...c, abilities: Object.fromEntries(kit.map((id) => [id, 1])), carried: [...kit] };
}

/** The numbers a class has at a level, before gear. */
export function baseNumbers(classId: string, level: number): Pick<Character, 'maxHp' | 'maxMana' | 'attack' | 'defense'> {
  const cls = CLASS_DATA[classId as Character['classId']]!;
  const grown = level - 1;
  return { maxHp: cls.hp + cls.growth.hp * grown, maxMana: cls.mana + cls.growth.mana * grown, attack: cls.attack + cls.growth.attack * grown, defense: cls.defense + cls.growth.defense * grown };
}
