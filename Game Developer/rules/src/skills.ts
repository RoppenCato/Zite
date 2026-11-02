// How a class grows (Robin, 2026-11-02: the classes and their paths; "You'll need to find a good way to balance it and so that it
// feels good and has good progression"). Mine: every level brings a point, every second one past ten, and a region's boss one more; a
// point learns an ability or raises its rank; at PATH_LEVEL the character takes one of its class's three paths, with an always-on
// rule and three abilities of its own; four abilities are carried into a fight; everything can be reset for free in a town.

import { ABILITIES, CLASS_DATA, type ClassTraits } from './data.ts';
import type { Character } from './types.ts';

export const PATH_LEVEL = 5;
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

/** The class's always-on rules, with its path's. */
export function traitsOf(c: Character): ClassTraits {
  const cls = CLASS_DATA[c.classId];
  return { ...cls?.traits, ...(c.path ? cls?.paths?.[c.path]?.passive : undefined) };
}

/** What the character could learn: the class's own abilities and its path's. */
export function abilitiesFor(c: Character): string[] {
  const cls = CLASS_DATA[c.classId];
  if (!cls) return [];
  return [...cls.core, ...(c.path ? (cls.paths[c.path]?.abilities ?? []) : [])];
}

export function canLearn(c: Character, ability: string): boolean {
  const a = ABILITIES[ability];
  if (!a || !abilitiesFor(c).includes(ability)) return false;
  return c.level >= a.level && (c.abilities[ability] ?? 0) < a.ranks.length && pointsFree(c) > 0;
}

/** Back to what the class starts with: the points are free again and the path can be chosen anew. */
export function resetSkills(c: Character): Character {
  const kit = CLASS_DATA[c.classId]?.kit ?? [];
  return { ...c, path: null, abilities: Object.fromEntries(kit.map((id) => [id, 1])), carried: [...kit] };
}
