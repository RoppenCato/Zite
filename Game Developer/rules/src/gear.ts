// Gear (Robin, 2026-10-31): a rank by tier (copper, iron, steel), a rarity from common to legendary with rolled
// numbers, and named pieces with a special effect. What is worn adds to the character's base numbers.

import { CLASS_DATA, GEAR, PROGRESSION } from './data.ts';
import type { Rng } from './rng.ts';
import { RARITIES, SLOTS, type AffixKind, type Character, type GearItem, type Rarity, type Slot } from './types.ts';

/** The numbers a fight uses: the base from class and levels, plus everything worn. */
export interface Stats {
  attack: number;
  defense: number;
  maxHp: number;
  maxMana: number;
  crit: number;
  dodge: number;
  lifesteal: number;
  thorns: number;
}

export function stats(c: Character): Stats {
  const cls = CLASS_DATA[c.classId];
  let attack = c.attack;
  let defense = c.defense;
  let maxHp = c.maxHp;
  let maxMana = c.maxMana;
  let crit = cls?.crit ?? PROGRESSION.baseCrit;
  let dodge = cls?.dodge ?? 0;
  let lifesteal = 0;
  let thorns = 0;
  let vigor = 0;
  for (const slot of SLOTS) {
    const g = c.equipment[slot];
    if (!g) continue;
    attack += g.stats.attack ?? 0;
    defense += g.stats.defense ?? 0;
    maxHp += g.stats.maxHp ?? 0;
    maxMana += g.stats.maxMana ?? 0;
    if (g.affix) {
      switch (g.affix.kind) {
        case 'crit':
          crit += g.affix.value;
          break;
        case 'dodge':
          dodge += g.affix.value;
          break;
        case 'lifesteal':
          lifesteal += g.affix.value;
          break;
        case 'thorns':
          thorns += g.affix.value;
          break;
        case 'vigor':
          vigor += g.affix.value;
          break;
      }
    }
  }
  return { attack, defense, maxHp: Math.round(maxHp * (1 + vigor)), maxMana, crit, dodge, lifesteal, thorns };
}

/** The rank's name for a tier: Copper for 1, Iron for 2, …; "Rank n" beyond the names. */
export function rankName(rank: number): string {
  const r = Math.max(1, Math.floor(rank));
  return GEAR.ranks[r - 1] ?? `Rank ${r}`;
}

/** A slot's number at a rank: the table while it lasts, then the last entry grown by `rankGrowth` a rank. */
export function rankStat(slot: Slot, rank: number): number {
  const def = GEAR.slots[slot];
  const r = Math.max(1, Math.floor(rank));
  const n = def.perRank.length;
  return r <= n ? def.perRank[r - 1]! : Math.round(def.perRank[n - 1]! * Math.pow(GEAR.rankGrowth, r - n));
}

/** A slot's plain price at a rank: the table, then grown by `priceGrowth` a rank. */
export function rankPrice(slot: Slot, rank: number): number {
  const def = GEAR.slots[slot];
  const r = Math.max(1, Math.floor(rank));
  const n = def.price.length;
  return r <= n ? def.price[r - 1]! : Math.round(def.price[n - 1]! * Math.pow(GEAR.priceGrowth, r - n));
}

/** A plain common piece of the rank: what a shop sells. */
export function plainGear(id: string, slot: Slot, rank: number): GearItem {
  const r = Math.max(1, Math.floor(rank));
  const def = GEAR.slots[slot];
  const base = `${rankName(r)} ${def.base}`;
  return { id, slot, rank: r, rarity: 'common', name: base, base: base.toLowerCase(), stats: { [def.stat]: rankStat(slot, r) }, affix: null, price: rankPrice(slot, r) };
}

/** A rarity by weight; `boost` skips that many of the lowest rarities (a mini-boss never drops common, a boss nothing under rare). */
export function rollRarity(rng: Rng, boost: number): Rarity {
  const pool = RARITIES.slice(Math.min(boost, RARITIES.length - 1));
  const total = pool.reduce((sum, r) => sum + GEAR.rarities[r].weight, 0);
  let pick = rng.next() * total;
  for (const r of pool) {
    pick -= GEAR.rarities[r].weight;
    if (pick < 0) return r;
  }
  return pool[pool.length - 1]!;
}

/**
 * A rolled piece: the rarity, the rank's number times the rarity's multiplier swung by `roll` either way, an affix
 * when the rarity has one, a proper name when it is named. Four to six numbers from the stream.
 */
export function rollGear(id: string, slot: Slot, rank: number, boost: number, rng: Rng): GearItem {
  const r = Math.max(1, Math.floor(rank));
  const def = GEAR.slots[slot];
  const rarity = rollRarity(rng, boost);
  const rar = GEAR.rarities[rarity];
  const swing = 1 + (rng.next() * 2 - 1) * GEAR.roll;
  const value = Math.max(1, Math.round(rankStat(slot, r) * rar.mult * swing));
  const plain = `${rankName(r)} ${def.base}`;
  let affix: GearItem['affix'] = null;
  if (rar.affix) {
    const kinds = Object.keys(GEAR.affixes) as AffixKind[];
    const kind = kinds[rng.int(kinds.length) - 1]!;
    const range = GEAR.affixes[kind];
    affix = { kind, value: Math.round((range.min + rng.next() * (range.max - range.min)) * 100) / 100 };
  }
  let name = plain;
  if (rar.named) {
    const names = GEAR.names[slot];
    name = names[rng.int(names.length) - 1]!;
  }
  return { id, slot, rank: r, rarity, name, base: plain.toLowerCase(), stats: { [def.stat]: value }, affix, price: Math.round(rankPrice(slot, r) * rar.priceMult) };
}

/** One line on a piece: "Stormborn, iron sword · epic · +14 attack · +12% crit chance". */
export function describeGear(g: GearItem): string {
  const parts = [g.name === capitalise(g.base) ? g.name : `${g.name}, ${g.base}`, g.rarity];
  for (const [stat, value] of Object.entries(g.stats)) parts.push(`+${value} ${STAT_WORDS[stat] ?? stat}`);
  if (g.affix) parts.push(`+${Math.round(g.affix.value * 100)}% ${GEAR.affixes[g.affix.kind].text}`);
  return parts.join(' · ');
}

const STAT_WORDS: Record<string, string> = { attack: 'attack', defense: 'defense', maxHp: 'HP', maxMana: 'mana' };

function capitalise(s: string): string {
  return s.replace(/\b\w/g, (ch) => ch.toUpperCase());
}
