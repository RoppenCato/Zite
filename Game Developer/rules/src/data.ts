// The numbers live in rules/data/*.json; this file gives them types. Balancing is editing those files.

import boardJson from '../data/board.json' with { type: 'json' };
import diceJson from '../data/dice.json' with { type: 'json' };
import classesJson from '../data/classes.json' with { type: 'json' };
import spacesJson from '../data/spaces.json' with { type: 'json' };
import type { Island } from './island.ts';
import type { ClassId, SpaceKind } from './types.ts';

export interface ClassData {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  gold: number;
}

export interface SpaceKindData {
  label: string;
}

/** The island the game plays on (hubs and roads; `buildBoard` lays the spaces). */
export const ISLAND_DATA = boardJson as Island;
export const DICE_DATA: { sides: number } = diceJson;
export const CLASS_DATA = classesJson as Record<ClassId, ClassData>;
export const SPACE_KIND_DATA = spacesJson as Record<SpaceKind, SpaceKindData>;

export const SPACE_KINDS = Object.keys(SPACE_KIND_DATA) as SpaceKind[];
export const CLASS_IDS = Object.keys(CLASS_DATA) as ClassId[];
