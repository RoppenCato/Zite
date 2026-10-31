// The numbers live in rules/data/*.json; this file gives them types. Balancing is editing those files.

import worldJson from '../data/world.json' with { type: 'json' };
import diceJson from '../data/dice.json' with { type: 'json' };
import classesJson from '../data/classes.json' with { type: 'json' };
import spacesJson from '../data/spaces.json' with { type: 'json' };
import enemiesJson from '../data/enemies.json' with { type: 'json' };
import progressionJson from '../data/progression.json' with { type: 'json' };
import itemsJson from '../data/items.json' with { type: 'json' };
import abilitiesJson from '../data/abilities.json' with { type: 'json' };
import gearJson from '../data/gear.json' with { type: 'json' };
import surprisesJson from '../data/surprises.json' with { type: 'json' };
import themesJson from '../data/themes.json' with { type: 'json' };
import type { World } from './world.ts';
import type { AffixKind, ClassId, EnemyData, EnemyMove, Rarity, Slot, SpaceKind } from './types.ts';

export interface ClassData {
  name: string;
  /** One line on how it plays, shown when choosing. */
  style: string;
  hp: number;
  mana: number;
  attack: number;
  defense: number;
  gold: number;
  /** The class's own crit chance and dodge chance, in place of or on top of the base; left out, the base and none. */
  crit?: number;
  dodge?: number;
  /** What a level brings. */
  growth: { hp: number; mana: number; attack: number; defense: number };
  /** The abilities known from the start, at rank 1. */
  kit: string[];
  /** The enemy does not strike back in the first round (the Ranger). */
  firstStrike?: boolean;
}

/** One rank of an ability: what it does. Fields left out do nothing. */
export interface AbilityRank {
  power?: number;
  hits?: number;
  crit?: number;
  stun?: number;
  attackUp?: { rounds: number; mult: number };
  weaken?: { rounds: number; mult: number };
  poison?: { rounds: number; power: number };
  barrier?: number;
  evade?: number;
}

export interface AbilityData {
  name: string;
  classId: ClassId;
  text: string;
  mana: number;
  ranks: AbilityRank[];
}

/** A kind of spot and what landing on it does; the hint the player sees when touching one. */
export interface SpaceKindData {
  label: string;
  letter: string;
  hint: string;
  /** How long the spot gives nothing after it gave, in ms. */
  cooldownMs?: number;
}

/** A thing to carry: a potion, or a dice card that changes a pending roll. */
export interface ItemData {
  name: string;
  text: string;
  price: number;
  heal?: number;
  dice?: 'reroll' | 'plus' | 'minus' | 'exact';
}

export interface GearData {
  /** The rank names by tier, from 1; beyond the names a rank is "Rank n". */
  ranks: string[];
  /** How much each rank beyond the tables multiplies the last table entry's number and price. */
  rankGrowth: number;
  priceGrowth: number;
  slots: Record<Slot, { base: string; stat: 'attack' | 'defense' | 'maxHp' | 'maxMana'; perRank: number[]; price: number[] }>;
  rarities: Record<Rarity, { mult: number; weight: number; priceMult: number; affix: boolean; named: boolean }>;
  /** The spread of a roll round the rank's number, as a share. */
  roll: number;
  affixes: Record<AffixKind, { text: string; min: number; max: number }>;
  names: Record<Slot, string[]>;
  dropChance: Record<'mob' | 'mini' | 'boss', number>;
  rarityBoost: Record<'mob' | 'mini' | 'boss', number>;
  consumableDrop: { potion: number; card: number };
  sellShare: number;
}

/** What the generator draws from to grow an area: its theme's names and creatures, the shapes of creatures, the cell grid. */
export interface ThemesData {
  order: string[];
  themes: Record<string, { areas: string[]; adjectives: string[]; mobs: string[]; mini: string; boss: string }>;
  places: Record<string, string[]>;
  archetypes: { hp: number; attack: number; defense: number; moves: EnemyMove[] }[];
  base: Record<'mob' | 'mini' | 'boss', { hp: number; attack: number; defense: number; xp: number; gold: number }>;
  perTier: { hp: number; attack: number; defense: number; reward: number };
  cell: { width: number; height: number; firstColumn: number };
}

export interface ProgressionData {
  /** Total xp needed to be at level n + 1, by index; the last entry is the top level. */
  xpForLevel: number[];
  baseCrit: number;
  critPower: number;
  fleeChance: number;
  /** The share of gold lost on death. */
  deathGoldLoss: number;
  /** What a charge multiplies the next hit by, for the player and for an enemy's wind-up. */
  charge: number;
  enemyCharge: number;
  manaPerRound: number;
  guards: { block: number; dodge: number; brace: number; braceMana: number; counter: number };
  chest: { gold: [number, number]; gearChance: number; consumableChance: number };
  gamble: { stakePerTier: number };
  spawns: { cap: number; chancePerTick: number; lifeMs: number; miniboss: number };
}

/** The world the game plays on: areas, hubs and roads; `buildBoard` lays the spots. */
export const WORLD_DATA = worldJson as World;
export const DICE_DATA: { sides: number } = diceJson;
export const CLASS_DATA = classesJson as Record<ClassId, ClassData>;
export const ABILITIES = abilitiesJson as Record<string, AbilityData>;
export const SPACE_KIND_DATA = spacesJson as Record<SpaceKind, SpaceKindData>;
export const ENEMIES = enemiesJson as Record<string, EnemyData>;
export const PROGRESSION = progressionJson as ProgressionData;
export const ITEMS = itemsJson as Record<string, ItemData>;
export const GEAR = gearJson as GearData;
/** The odds of what a normal spot holds, as weights. */
export const SURPRISES = surprisesJson as Record<'fight' | 'chest' | 'merchant' | 'gamble' | 'miniboss', number>;
export const THEMES = themesJson as ThemesData;

export const SPACE_KINDS = Object.keys(SPACE_KIND_DATA) as SpaceKind[];
export const CLASS_IDS = Object.keys(CLASS_DATA) as ClassId[];
export const ITEM_IDS = Object.keys(ITEMS);
