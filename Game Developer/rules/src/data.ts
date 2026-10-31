// The numbers live in rules/data/*.json; this file gives them types. Balancing is editing those files.

import boardJson from '../data/board.json' with { type: 'json' };
import diceJson from '../data/dice.json' with { type: 'json' };
import classesJson from '../data/classes.json' with { type: 'json' };
import spacesJson from '../data/spaces.json' with { type: 'json' };
import type { ClassId, Space, SpaceKind } from './types.ts';

export interface BoardData {
  start: string;
  spaces: Space[];
}

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

export const BOARD_DATA = boardJson as BoardData;
export const DICE_DATA: { sides: number } = diceJson;
export const CLASS_DATA = classesJson as Record<ClassId, ClassData>;
export const SPACE_KIND_DATA = spacesJson as Record<SpaceKind, SpaceKindData>;

export const SPACE_KINDS = Object.keys(SPACE_KIND_DATA) as SpaceKind[];
export const CLASS_IDS = Object.keys(CLASS_DATA) as ClassId[];
