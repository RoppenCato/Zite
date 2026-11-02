// Gear (Robin, 2026-10-31): a rank by tier (copper, iron, steel, …), a rarity from common to legendary with rolled
// numbers, named pieces with special effects, and uniques whose powers change how you play (Robin, 2026-10-31, the
// evening). What is worn adds to the character's base numbers; the powers are read by the fight and the board.

import { traitsOf } from './skills.ts';
import { CLASS_DATA, GEAR, PROGRESSION, UNIQUE_IDS, UNIQUES } from './data.ts';
import type { Rng } from './rng.ts';
import { RARITIES, SLOTS, type Affix, type AffixKind, type Character, type ClassId, type GearItem, type GearLine, type GearStat, type PowerKind, type Rarity, type Slot } from './types.ts';

/** The numbers a fight uses: the base from class and levels, plus everything worn, and the powers of the uniques worn. */
export interface Stats {
  attack: number;
  defense: number;
  maxHp: number;
  maxMana: number;
  /** Added to the attack behind an ability, never a plain hit. */
  magic: number;
  crit: number;
  dodge: number;
  lifesteal: number;
  thorns: number;
  powers: Partial<Record<PowerKind, number>>;
}

/** The powers of the uniques worn, by kind, with their values. Two of a kind add up. */
export function powers(c: Character): Partial<Record<PowerKind, number>> {
  const out: Partial<Record<PowerKind, number>> = {};
  for (const slot of SLOTS) {
    const g = c.equipment[slot];
    const u = g?.unique ? UNIQUES[g.unique] : undefined;
    if (u) out[u.power] = (out[u.power] ?? 0) + u.value;
  }
  return out;
}

export function stats(c: Character): Stats {
  const cls = CLASS_DATA[c.classId];
  let attack = c.attack;
  let defense = c.defense;
  let maxHp = c.maxHp;
  let maxMana = c.maxMana;
  let magic = 0;
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
    magic += g.stats.magic ?? 0;
    for (const affix of g.affixes ?? []) {
      switch (affix.kind) {
        case 'crit':
          crit += affix.value;
          break;
        case 'dodge':
          dodge += affix.value;
          break;
        case 'lifesteal':
          lifesteal += affix.value;
          break;
        case 'thorns':
          thorns += affix.value;
          break;
        case 'vigor':
          vigor += affix.value;
          break;
      }
    }
  }
  maxHp += c.elixirs?.vigor?.value ?? 0;
  magic += c.elixirs?.arcana?.value ?? 0;
  maxHp = Math.round(maxHp * (1 + vigor));
  const traits = traitsOf(c);
  magic += (cls?.magic ?? 0) + (cls?.growth.magic ?? 0) * (c.level - 1);
  crit += traits.crit ?? 0;
  dodge += traits.dodge ?? 0;
  thorns += traits.thorns ?? 0;
  if (traits.defenseMult) defense = Math.round(defense * traits.defenseMult);
  if (traits.hpMult) maxHp = Math.round(maxHp * traits.hpMult);
  const p = powers(c);
  if (p.bloodthirst) {
    // Gorefang: harder the more HP is missing, up to the value more.
    const missing = Math.min(1, Math.max(0, 1 - c.hp / Math.max(1, maxHp)));
    attack = Math.round(attack * (1 + p.bloodthirst * missing));
  }
  return { attack, defense, maxHp, maxMana, magic, crit, dodge, lifesteal, thorns, powers: p };
}

/** A wardrobe with nothing in any slot. */
export function emptyEquipment(): Record<Slot, GearItem | null> {
  return Object.fromEntries(SLOTS.map((s) => [s, null])) as Record<Slot, GearItem | null>;
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

/** A table's number at a rank: the table while it lasts, then the last entry grown. */
function tableAt(table: number[], rank: number): number {
  return rank <= table.length ? table[rank - 1]! : Math.round(table[table.length - 1]! * Math.pow(GEAR.rankGrowth, rank - table.length));
}

/** The piece's word for a line and rank: Tin, Leather, Cloth, and on up. */
function lineWord(line: GearLine, rank: number): string {
  return GEAR.lines[line].words[rank - 1] ?? `Rank ${rank}`;
}

/** A piece's plain name: the weapon follows the class in heavy gear; the first light and magic weapons are wood. */
function pieceName(slot: Slot, rank: number, line: GearLine, classId: ClassId): string {
  const data = GEAR.lines[line];
  // A Hunter's weapon is a bow on every line (Robin, 2026-11-02).
  if (slot === 'weapon' && classId === 'ranger') return rank === 1 && data.firstWeapon ? 'Wooden Bow' : line === 'heavy' ? `${lineWord(line, rank)} Bow` : `${lineWord(line, rank)} Shortbow`;
  if (slot === 'weapon' && rank === 1 && data.firstWeapon) return data.firstWeapon;
  if (slot === 'weapon' && data.weaponByClass) return `${lineWord(line, rank)} ${data.weaponByClass[classId]}`;
  return `${lineWord(line, rank)} ${data.slots?.[slot].base ?? GEAR.slots[slot].base}`;
}

/** What a piece of this line adds at this rank, its numbers times `mult`, and the bonus it always carries. */
function lineNumbers(slot: Slot, rank: number, line: GearLine, mult: number): { stats: Partial<Record<GearStat, number>>; affixes: Affix[] } {
  const own = GEAR.lines[line].slots?.[slot];
  if (!own) return { stats: { [GEAR.slots[slot].stat]: Math.max(1, Math.round(rankStat(slot, rank) * mult)) }, affixes: [] };
  const stats: Partial<Record<GearStat, number>> = { [own.stat]: Math.max(1, Math.round(tableAt(own.perRank, rank) * mult)) };
  if (own.extra) stats[own.extra.stat] = Math.max(1, Math.round(tableAt(own.extra.perRank, rank) * mult));
  const affixes = own.affix ? [{ kind: own.affix.kind, value: own.affix.perRank[Math.min(rank, own.affix.perRank.length) - 1]! }] : [];
  return { stats, affixes };
}

/** A plain common piece of the rank and line: what a shop sells. */
export function plainGear(id: string, slot: Slot, rank: number, line: GearLine = 'heavy', classId: ClassId = 'warrior'): GearItem {
  const r = Math.max(1, Math.floor(rank));
  const name = pieceName(slot, r, line, classId);
  return { id, slot, rank: r, rarity: 'common', name, base: name.toLowerCase(), ...lineNumbers(slot, r, line, 1), price: Math.round(rankPrice(slot, r) * (GEAR.lines[line].priceMult ?? 1)), ...(line === 'heavy' ? {} : { line }) };
}

/**
 * A rarity by weight; `boost` skips that many of the lowest rarities (a mini-boss never drops common or uncommon, a boss
 * nothing under epic). Unique has no weight: it never comes up here.
 */
export function rollRarity(rng: Rng, boost: number): Rarity {
  const pool = RARITIES.filter((r) => GEAR.rarities[r].weight > 0).slice(Math.min(boost, RARITIES.length - 2));
  const total = pool.reduce((sum, r) => sum + GEAR.rarities[r].weight, 0);
  let pick = rng.next() * total;
  for (const r of pool) {
    pick -= GEAR.rarities[r].weight;
    if (pick < 0) return r;
  }
  return pool[pool.length - 1]!;
}

/** `count` affixes, all of different kinds, each with a value in its range. Two numbers from the stream each. */
function rollAffixes(count: number, rng: Rng): Affix[] {
  const kinds = Object.keys(GEAR.affixes) as AffixKind[];
  const out: Affix[] = [];
  for (let i = 0; i < count && kinds.length; i++) {
    const kind = kinds.splice(rng.int(kinds.length) - 1, 1)[0]!;
    const range = GEAR.affixes[kind];
    out.push({ kind, value: Math.round((range.min + rng.next() * (range.max - range.min)) * 100) / 100 });
  }
  return out;
}

/**
 * A rolled piece: the rarity, the rank's number times the rarity's multiplier swung by `roll` either way, the rarity's
 * affixes (a legendary carries two), a proper name when it is named. Four to eight numbers from the stream.
 */
export function rollGear(id: string, slot: Slot, rank: number, boost: number, rng: Rng, line: GearLine = 'heavy', classId: ClassId = 'warrior'): GearItem {
  const r = Math.max(1, Math.floor(rank));
  const rarity = rollRarity(rng, boost);
  const rar = GEAR.rarities[rarity];
  const swing = 1 + (rng.next() * 2 - 1) * GEAR.roll;
  const plain = pieceName(slot, r, line, classId);
  const numbers = lineNumbers(slot, r, line, rar.mult * swing);
  // A rolled bonus of the kind the line already carries adds to it.
  const affixes = [...numbers.affixes];
  for (const a of rollAffixes(rar.affixes, rng)) {
    const same = affixes.find((x) => x.kind === a.kind);
    if (same) same.value = Math.round((same.value + a.value) * 100) / 100;
    else affixes.push(a);
  }
  let name = plain;
  if (rar.named) {
    const names = GEAR.names[slot];
    name = names[rng.int(names.length) - 1]!;
  }
  return { id, slot, rank: r, rarity, name, base: plain.toLowerCase(), stats: numbers.stats, affixes, price: Math.round(rankPrice(slot, r) * (GEAR.lines[line].priceMult ?? 1) * rar.priceMult), ...(line === 'heavy' ? {} : { line }) };
}

/** The uniques a tier's bosses carry: every unique from that tier or an earlier one. */
export function uniquePool(tier: number): string[] {
  return UNIQUE_IDS.filter((u) => UNIQUES[u]!.tier <= tier);
}

/** The unique `uniqueId` at `rank`: its number as a unique's (the top multiplier, swung), one affix, its power. */
export function makeUnique(id: string, uniqueId: string, rank: number, rng: Rng): GearItem {
  const u = UNIQUES[uniqueId];
  if (!u) throw new Error(`no such unique: ${uniqueId}`);
  const r = Math.max(1, Math.floor(rank));
  const def = GEAR.slots[u.slot];
  const rar = GEAR.rarities.unique;
  const swing = 1 + (rng.next() * 2 - 1) * GEAR.roll;
  const value = Math.max(1, Math.round(rankStat(u.slot, r) * rar.mult * swing));
  const plain = `${rankName(r)} ${def.base}`;
  return { id, slot: u.slot, rank: r, rarity: 'unique', name: u.name, base: plain.toLowerCase(), stats: { [def.stat]: value }, affixes: rollAffixes(rar.affixes, rng), unique: uniqueId, price: Math.round(rankPrice(u.slot, r) * rar.priceMult) };
}

/** One of the tier's uniques at `rank`, or null when the tier has none. */
export function rollUnique(id: string, tier: number, rank: number, rng: Rng): GearItem | null {
  const pool = uniquePool(tier);
  if (!pool.length) return null;
  return makeUnique(id, pool[rng.int(pool.length) - 1]!, rank, rng);
}

/** One line on a piece: "Stormborn, iron sword · epic · +14 attack · +12% crit chance"; a unique adds what its power does. */
export function describeGear(g: GearItem): string {
  return [g.name === capitalise(g.base) ? g.name : `${g.name}, ${g.base}`, g.rarity, ...gearPowers(g)].join(' · ');
}

/** What a piece does, as short parts: "+3 attack", "+12% crits bleed", a unique's power. The loot card shows these under the name. */
export function gearPowers(g: GearItem): string[] {
  const parts: string[] = [];
  for (const [stat, value] of Object.entries(g.stats)) parts.push(`+${value} ${STAT_WORDS[stat] ?? stat}`);
  for (const affix of g.affixes ?? []) parts.push(`+${Math.round(affix.value * 100)}% ${GEAR.affixes[affix.kind].text}`);
  const u = g.unique ? UNIQUES[g.unique] : undefined;
  if (u) parts.push(u.text);
  return parts;
}

const STAT_WORDS: Record<string, string> = { attack: 'attack', defense: 'defense', maxHp: 'HP', maxMana: 'mana', magic: 'magic' };

function capitalise(s: string): string {
  return s.replace(/\b\w/g, (ch) => ch.toUpperCase());
}
