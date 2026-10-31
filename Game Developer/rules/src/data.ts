// The numbers live in rules/data/*.json; this file gives them types. Balancing is editing those files.

import boardJson from '../data/board.json' with { type: 'json' };
import diceJson from '../data/dice.json' with { type: 'json' };
import classesJson from '../data/classes.json' with { type: 'json' };
import spacesJson from '../data/spaces.json' with { type: 'json' };
import eventsJson from '../data/events.json' with { type: 'json' };
import type { Island } from './island.ts';
import type { ClassId, SpaceKind } from './types.ts';

export interface ClassData {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  gold: number;
}

/** A kind of space and what landing on it does. A kind with neither `heal` nor `gold` does nothing yet. */
export interface SpaceKindData {
  label: string;
  /** HP given back on landing: a number, or 'full' for all of it. */
  heal?: number | 'full';
  /** Gold found on landing, drawn from the random stream between min and max. */
  gold?: { min: number; max: number };
}

/** One card an event space can draw: its text, and what it does to gold or HP. */
export interface EventCardData {
  id: string;
  text: string;
  gold?: number;
  heal?: number;
}

/** The island the game plays on (hubs and roads; `buildBoard` lays the spaces). */
export const ISLAND_DATA = boardJson as Island;
export const DICE_DATA: { sides: number } = diceJson;
export const CLASS_DATA = classesJson as Record<ClassId, ClassData>;
export const SPACE_KIND_DATA = spacesJson as Record<SpaceKind, SpaceKindData>;
export const EVENT_CARDS = eventsJson as EventCardData[];

export const SPACE_KINDS = Object.keys(SPACE_KIND_DATA) as SpaceKind[];
export const CLASS_IDS = Object.keys(CLASS_DATA) as ClassId[];
