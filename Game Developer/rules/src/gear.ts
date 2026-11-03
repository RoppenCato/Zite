// Gear (Robin, 2026-10-31): a rank by tier (copper, iron, steel, …), a rarity from common to legendary with rolled
// numbers, named pieces with special effects, and uniques whose powers change how you play (Robin, 2026-10-31, the
// evening). What is worn adds to the character's base numbers; the powers are read by the fight and the board.

import { traitsOf } from './skills.ts';
import { ABILITIES, CLASS_DATA, GEAR, PROGRESSION, SET_IDS, SETS, TRINKET_DATA, TRINKET_IDS, TRINKETS, UNIQUE_IDS, UNIQUES, type KindData } from './data.ts';
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
  /** The other suffixes worn, added up by kind. */
  bonus: Partial<Record<AffixKind, number>>;
  powers: Partial<Record<PowerKind, number>>;
}

/** The powers of the uniques worn, by kind, with their values. Two of a kind add up. */
export function powers(c: Character): Partial<Record<PowerKind, number>> {
  const out: Partial<Record<PowerKind, number>> = {};
  for (const slot of SLOTS) {
    const g = c.equipment[slot];
    const u = g?.unique ? UNIQUES[g.unique] : g?.trinket ? TRINKETS[g.trinket] : undefined;
    if (u?.power) out[u.power] = (out[u.power] ?? 0) + (u.value ?? 0);
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
  const bonus: Partial<Record<AffixKind, number>> = {};
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
        default:
          bonus[affix.kind] = (bonus[affix.kind] ?? 0) + affix.value;
      }
    }
  }
  maxHp += c.elixirs?.vigor?.value ?? 0;
  magic += c.elixirs?.arcana?.value ?? 0;
  maxHp = Math.round(maxHp * (1 + vigor));
  const traits = traitsOf(c);
  magic += (cls?.magic ?? 0) + (cls?.growth.magic ?? 0) * (c.level - 1);
  crit += traits.crit ?? 0;
  // Crit stops at 60% (Robin, 2026-11-03), a sure crit aside.
  crit = Math.min(PROGRESSION.critCap, crit);
  dodge += traits.dodge ?? 0;
  thorns += traits.thorns ?? 0;
  if (traits.defenseMult) defense = Math.round(defense * traits.defenseMult);
  if (bonus.turtle) defense = Math.round(defense * (1 + bonus.turtle));
  if (traits.hpMult) maxHp = Math.round(maxHp * traits.hpMult);
  if (traits.attackMult) attack = Math.round(attack * traits.attackMult);
  if (traits.manaMult) maxMana = Math.round(maxMana * traits.manaMult);
  const p = powers(c);
  if (p.bloodthirst) {
    // Gorefang: harder the more HP is missing, up to the value more.
    const missing = Math.min(1, Math.max(0, 1 - c.hp / Math.max(1, maxHp)));
    attack = Math.round(attack * (1 + p.bloodthirst * missing));
  }
  return { attack, defense, maxHp, maxMana, magic, crit, dodge, lifesteal, thorns, bonus, powers: p };
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

/**
 * A piece one rank up at a master smith (2026-11-03): each of its numbers grows as its slot's do from this rank to the
 * next, its price too; its rarity, affixes, set and power stay. Gear that is special to you (epic and up, and set pieces) only.
 */
export function reforged(g: GearItem): GearItem {
  const statUp = rankStat(g.slot, g.rank + 1) / rankStat(g.slot, g.rank);
  const priceUp = rankPrice(g.slot, g.rank + 1) / rankPrice(g.slot, g.rank);
  // Whole numbers grow by a point at least; a share (a crit chance) stays.
  const stats = Object.fromEntries(Object.entries(g.stats).map(([k, v]) => [k, Number.isInteger(v) && v ? Math.max(v + 1, Math.round(v * statUp)) : v]));
  return { ...g, rank: g.rank + 1, stats, price: Math.round(g.price * priceUp) };
}

/** Whether a smith whose gear is of rank `top` will reforge this piece. */
export function canReforge(g: GearItem | null | undefined, top: number): g is GearItem {
  return !!g && g.slot !== 'trinket' && (g.rarity === 'epic' || g.rarity === 'legendary' || g.rarity === 'unique' || !!g.set) && g.rank < top;
}

/** A table's number at a rank: the table while it lasts, then the last entry grown. */
function tableAt(table: number[], rank: number): number {
  return rank <= table.length ? table[rank - 1]! : Math.round(table[table.length - 1]! * Math.pow(GEAR.rankGrowth, rank - table.length));
}

/** A weapon's or an off-hand's type (Robin, 2026-11-03): the piece's own, or read from its name on pieces made before types. */
export function gearKind(g: GearItem | null | undefined): string | null {
  if (!g) return null;
  if (g.kind) return g.kind;
  const words = `${g.base} ${g.name}`.toLowerCase();
  if (g.slot === 'weapon') {
    if (/great|maul|halberd|\baxe\b/.test(words)) return 'great';
    if (/dagger|knife|fang|kunai/.test(words)) return 'dagger';
    if (/\bbow\b|shortbow/.test(words)) return 'bow';
    if (/\bwand\b/.test(words)) return 'wand';
    if (/staff/.test(words) || ((g.stats.magic ?? 0) > 0 && !g.stats.attack)) return 'staff';
    return 'sword';
  }
  if (g.slot === 'shield') {
    if (/buckler/.test(words)) return 'buckler';
    if (/tower/.test(words)) return 'tower';
    if (/kite/.test(words)) return 'kite';
    if (/tome|orb/.test(words)) return /mirror/.test(words) ? 'mirror_orb' : /blink/.test(words) ? 'blink_orb' : /storm/.test(words) ? 'storm_orb' : 'ward_orb';
    return 'round';
  }
  return null;
}

/** A kind's data, weapon or off-hand. */
export function kindData(slot: Slot, kind: string | null | undefined): KindData | undefined {
  if (!kind) return undefined;
  return slot === 'weapon' ? GEAR.kinds.weapon[kind] : slot === 'shield' ? GEAR.kinds.offhand[kind] : undefined;
}

/** A weapon that takes the off-hand away: a great weapon, a staff. A bow is held in both hands but keeps it. */
export function twoHanded(g: GearItem | null | undefined): boolean {
  const k = g?.slot === 'weapon' ? kindData('weapon', gearKind(g)) : undefined;
  return k?.hands === 2 && !k.keepsOffhand;
}

/** The kinds a class wields as its own: two weapons, its off-hands. */
export function classKinds(classId: ClassId, slot: Slot): string[] {
  const table = slot === 'weapon' ? GEAR.kinds.weapon : slot === 'shield' ? GEAR.kinds.offhand : {};
  const own = Object.keys(table).filter((k) => table[k]!.classes.includes(classId));
  // A class's main weapon first: a Hunter's bow before its dagger.
  const first = slot === 'weapon' ? (GEAR.kinds.firstKinds[classId] ?? []) : [];
  return [...first.filter((k) => own.includes(k)), ...own.filter((k) => !first.includes(k))];
}

/** A dropped piece's kind: three in four times the class's own, else another's to try or sell (mine). No stream: the first of the class's own. */
export function pickKind(slot: Slot, classId: ClassId, rng?: Rng): string | undefined {
  if (slot !== 'weapon' && slot !== 'shield') return undefined;
  const own = classKinds(classId, slot);
  if (!rng) return own[0];
  const all = Object.keys(slot === 'weapon' ? GEAR.kinds.weapon : GEAR.kinds.offhand);
  const others = all.filter((k) => !own.includes(k));
  const pool = rng.next() < GEAR.kinds.ownShare || !others.length ? own : others;
  return pool[rng.int(pool.length) - 1] ?? own[0];
}

/** The off-hand a shop's tab sells to this class. */
export function shopOffhand(classId: ClassId, line: GearLine): string {
  const orbs = classKinds(classId, 'shield').some((k) => k.endsWith('_orb'));
  return (orbs ? GEAR.kinds.shop.orbs : GEAR.kinds.shop.shields)[line] ?? classKinds(classId, 'shield')[0]!;
}

/** A kind's plain name at a rank: Tin Sword, Wooden Bow, Glass Ward Orb. */
function kindName(slot: Slot, rank: number, kind: string): string {
  const k = kindData(slot, kind)!;
  const word = kind.endsWith('_orb') ? (GEAR.kinds.orbWords[rank - 1] ?? `Rank ${rank}`) : rank === 1 && ['bow', 'staff', 'wand'].includes(kind) ? 'Wooden' : lineWord('heavy', rank);
  return `${word} ${k.name}`;
}

/** What a kind adds at this rank, times `mult`, and the crit a quick weapon carries. */
function kindNumbers(slot: Slot, rank: number, kind: string, mult: number): { stats: Partial<Record<GearStat, number>>; affixes: Affix[] } {
  const k = kindData(slot, kind)!;
  const base = rankStat(slot, rank);
  const stats: Partial<Record<GearStat, number>> = { [k.stat]: Math.max(1, Math.round(base * k.mult * mult)) };
  if (k.extra) stats[k.extra.stat] = (stats[k.extra.stat] ?? 0) + Math.max(1, Math.round(base * k.extra.mult * mult));
  return { stats, affixes: k.crit ? [{ kind: 'crit', value: k.crit }] : [] };
}

/** What a shield or an orb gives the guards (Robin, 2026-11-03): a bigger shield stops more of a blow and dodges less; quality and rank add a little to both. */
export function offhandGuard(g: GearItem | null | undefined): { block: number; dodge: number; mana: number | null; mirror: number; brace: number; shield: boolean } {
  const bare = GEAR.kinds.bare;
  const kind = gearKind(g);
  const d = kindData('shield', kind);
  if (!g || !d) return { block: bare.block, dodge: bare.dodge, mana: null, mirror: 0, brace: 1, shield: false };
  const lift = GEAR.kinds.qualityStep * Math.min(4, RARITIES.indexOf(g.rarity)) + GEAR.kinds.rankStep * (g.rank - 1);
  return {
    block: d.block !== undefined ? Math.min(0.85, d.block + lift) : bare.block,
    dodge: Math.min(0.75, (d.dodge ?? bare.dodge) + lift),
    mana: d.mana !== undefined ? Math.min(0.9, d.mana + lift) : null,
    mirror: d.mirror ?? 0,
    brace: d.brace ?? 1,
    // A shield, not an orb: shield skills ask for one (an orb wards since 2026-11-03).
    shield: d.block !== undefined && !kind!.endsWith('_orb'),
  };
}

/** The guards as the hands give them: the off-hand's, or with none a two-hander's own (a great weapon blocks less and dodges more, Robin, 2026-11-03), or bare. */
export function guardOf(c: Character): ReturnType<typeof offhandGuard> {
  if (c.equipment.shield) {
    const o = offhandGuard(c.equipment.shield);
    // A shield wards less in a Magician's hands than an orb (Robin, 2026-11-03: "Orbs ward better than shields").
    return o.shield && traitsOf(c).ward ? { ...o, block: o.block * GEAR.kinds.shieldInWard } : o;
  }
  const w = kindData('weapon', gearKind(c.equipment.weapon));
  const bare = offhandGuard(null);
  // A two-hander guards its own way: a great weapon dodges, a bow keeps its distance, a staff wards like bare hands (2026-11-03).
  return w && (w.block !== undefined || w.dodge !== undefined || w.mana !== undefined) ? { ...bare, block: w.block ?? bare.block, dodge: w.dodge ?? bare.dodge, mana: w.mana ?? bare.mana } : bare;
}

/** What is held allows this: any one of `needs`, a kind, `shield` (not an orb) or `blade` (a sword or a dagger). */
export function holdsFor(c: Character, needs: readonly string[] | undefined): boolean {
  if (!needs?.length) return true;
  const w = gearKind(c.equipment.weapon);
  const o = gearKind(c.equipment.shield);
  return needs.some((n) => (n === 'shield' ? !!o && !o.endsWith('_orb') : n === 'blade' ? w === 'dagger' || w === 'sword' : n === w));
}

/** "a shield", "a bow", "a wand or a sword": for a skill that cannot be used with what is held. */
export function needsWords(needs: readonly string[] | undefined): string {
  return (needs ?? []).map((n) => `a ${n === 'great' ? 'great weapon' : n === 'blade' ? 'blade' : n}`).join(' or ');
}

/** How many times a plain Attack strikes: a Rogue's three only with a blade or bare hands (mine, from Robin's 2026-11-03 weapon choices). */
export function attackHitsOf(c: Character): number | undefined {
  const hits = traitsOf(c).attackHits;
  if (!hits) return undefined;
  const w = gearKind(c.equipment.weapon);
  return !w || w === 'dagger' || w === 'sword' ? hits : undefined;
}

/** The piece's word for a line and rank: Tin, Leather, Cloth, and on up. */
function lineWord(line: GearLine, rank: number): string {
  return GEAR.lines[line].words[rank - 1] ?? `Rank ${rank}`;
}

/** A piece's plain name: the weapon follows the class in heavy gear; the first light and magic weapons are wood. */
function pieceName(slot: Slot, rank: number, line: GearLine, classId: ClassId, kind?: string): string {
  if (kind && kindData(slot, kind)) return kindName(slot, rank, kind);
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
/**
 * How far a class's own mana has grown since level 1 (Robin, 2026-11-03: "Spells cost more later"): an ability costs this many
 * times its listed mana, and a round gives back this many times its mana, so mana is a budget at every level, as at level 1.
 * Mana from gear still buys more casts.
 */
export function manaScale(c: Pick<Character, 'classId' | 'level'>): number {
  const d = CLASS_DATA[c.classId];
  if (!d?.mana) return 1;
  return (d.mana + d.growth.mana * Math.max(0, c.level - 1)) / d.mana;
}

/** What an ability costs this character now: its listed mana grown with the level, less for the Arcane and Focus. */
export function manaCost(c: Character, abilityId: string): number {
  const a = ABILITIES[abilityId];
  if (!a?.mana) return 0;
  const s = stats(c);
  return Math.ceil(a.mana * manaScale(c) * (s.powers.arcane ?? 1) * (1 - (s.bonus.focus ?? 0)));
}

/** A trinket as a piece to carry (Robin, 2026-11-03): no numbers of its own, only its passive. */
export function makeTrinket(id: string, trinketId: string): GearItem {
  const t = TRINKETS[trinketId];
  if (!t) throw new Error(`no such trinket: ${trinketId}`);
  const price = Math.round(TRINKET_DATA.price.base * t.tier * (TRINKET_DATA.price.rarity[t.rarity] ?? 1));
  return { id, slot: 'trinket', rank: t.tier, rarity: t.rarity, name: t.name, base: 'trinket', stats: {}, affixes: (t.affixes ?? []).map((a) => ({ ...a })), trinket: trinketId, price };
}

/**
 * A trinket found in a land of this tier at this rarity: one whose tier the land has reached, the land's own tier and the
 * two before it the likelier; with none of that rarity yet, the next rarity down.
 */
export function rollTrinket(id: string, tier: number, rarity: Rarity, rng: Rng): GearItem {
  const order: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  const want = rarity === 'unique' ? 'legendary' : rarity;
  for (const r of order.slice(order.indexOf(want))) {
    const pool = TRINKET_IDS.filter((t) => TRINKETS[t]!.rarity === r && TRINKETS[t]!.tier <= tier && !TRINKETS[t]!.dream);
    if (!pool.length) continue;
    const weight = (t: string): number => (TRINKETS[t]!.tier >= tier - TRINKET_DATA.nearTiers ? TRINKET_DATA.nearWeight : 1);
    let pick = rng.next() * pool.reduce((n, t) => n + weight(t), 0);
    for (const t of pool) {
      pick -= weight(t);
      if (pick < 0) return makeTrinket(id, t);
    }
    return makeTrinket(id, pool[pool.length - 1]!);
  }
  return makeTrinket(id, TRINKET_IDS[0]!);
}

/** The plainest trinket of a land: its newest common one. */
function plainTrinket(id: string, tier: number): GearItem {
  const commons = TRINKET_IDS.filter((t) => TRINKETS[t]!.rarity === 'common' && TRINKETS[t]!.tier <= tier && !TRINKETS[t]!.dream);
  return makeTrinket(id, commons[commons.length - 1] ?? TRINKET_IDS[0]!);
}

export function plainGear(id: string, slot: Slot, rank: number, line: GearLine = 'heavy', classId: ClassId = 'warrior', kind?: string): GearItem {
  if (slot === 'trinket') return plainTrinket(id, rank);
  const r = Math.max(1, Math.floor(rank));
  const k = kind ?? pickKind(slot, classId);
  const name = pieceName(slot, r, line, classId, k);
  const kd = kindData(slot, k);
  return { id, slot, rank: r, rarity: 'common', name, base: name.toLowerCase(), ...(kd ? kindNumbers(slot, r, k!, 1) : lineNumbers(slot, r, line, 1)), ...(kd ? { kind: k } : {}), price: Math.round(rankPrice(slot, r) * (kd ? (kd.price ?? 1) : (GEAR.lines[line].priceMult ?? 1))), ...(line === 'heavy' ? {} : { line }) };
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

/** Suffixes for a slot, rolled at the piece's rank and rarity: the number grows with the rank, so an old piece is always outgrown. */
function rollAffixes(count: number, slot: Slot, rank: number, rarityMult: number, rng: Rng): { affixes: Affix[]; words: string[]; stats: Partial<Record<GearStat, number>> } {
  const kinds = (Object.keys(GEAR.affixes) as AffixKind[]).filter((k) => GEAR.affixes[k].slots.includes(slot));
  const affixes: Affix[] = [];
  const words: string[] = [];
  const added: Partial<Record<GearStat, number>> = {};
  for (let i = 0; i < count && kinds.length; i++) {
    const kind = kinds.splice(rng.int(kinds.length) - 1, 1)[0]!;
    const def = GEAR.affixes[kind];
    const atRank = Math.min(def.max, def.base + def.step * (rank - 1));
    const raw = atRank * (1 + (rarityMult - 1) * 0.4) * (0.85 + rng.next() * 0.3);
    const value = Math.min(def.max, raw);
    words.push(def.suffix);
    if (def.stat) added[def.stat] = (added[def.stat] ?? 0) + Math.max(1, Math.round(value));
    else affixes.push({ kind, value: def.flat ? Math.max(1, Math.round(value)) : Math.round(value * 1000) / 1000 });
  }
  return { affixes, words, stats: added };
}

/**
 * A rolled piece: the rarity, the rank's number times the rarity's multiplier swung by `roll` either way, the rarity's
 * affixes (a legendary carries two), a proper name when it is named. Four to eight numbers from the stream.
 */
export function rollGear(id: string, slot: Slot, rank: number, boost: number, rng: Rng, line: GearLine = 'heavy', classId: ClassId = 'warrior', kind?: string): GearItem {
  const r = Math.max(1, Math.floor(rank));
  const rarity = rollRarity(rng, boost);
  // The trinket slot holds trinkets now (Robin, 2026-11-03).
  if (slot === 'trinket') return rollTrinket(id, r, rarity, rng);
  const rar = GEAR.rarities[rarity];
  const swing = 1 + (rng.next() * 2 - 1) * GEAR.roll;
  const k = kind ?? pickKind(slot, classId, rng);
  const kd = kindData(slot, k);
  const plain = pieceName(slot, r, line, classId, k);
  const numbers = kd ? kindNumbers(slot, r, k!, rar.mult * swing) : lineNumbers(slot, r, line, rar.mult * swing);
  // A rolled bonus of the kind the line already carries adds to it.
  const affixes = [...numbers.affixes];
  const rolled = rollAffixes(rar.affixes, slot, r, rar.mult, rng);
  for (const a of rolled.affixes) {
    const same = affixes.find((x) => x.kind === a.kind);
    if (same) same.value = Math.round((same.value + a.value) * 1000) / 1000;
    else affixes.push(a);
  }
  const stats = { ...numbers.stats };
  for (const [stat, n] of Object.entries(rolled.stats) as [GearStat, number][]) stats[stat] = (stats[stat] ?? 0) + n;
  // The name says what it does (Robin, 2026-11-02): a prefix for a plain lift, a suffix for what it is good for.
  let core = plain;
  if (rar.named) {
    const names = GEAR.names[slot];
    core = names[rng.int(names.length) - 1]!;
  }
  let prefix = '';
  if (rar.prefix) {
    const pool = GEAR.prefixes.filter((p) => p.slots.includes(slot));
    const p = pool[rng.int(pool.length) - 1];
    if (p) {
      prefix = `${p.word} `;
      stats[p.stat] = (stats[p.stat] ?? 0) + p.perRank * r;
    }
  }
  const name = `${prefix}${core}${rolled.words[0] ? ` ${rolled.words[0]}` : ''}`;
  return { id, slot, rank: r, rarity, name, base: plain.toLowerCase(), stats, affixes, ...(kd ? { kind: k } : {}), price: Math.round(rankPrice(slot, r) * (kd ? (kd.price ?? 1) : (GEAR.lines[line].priceMult ?? 1)) * rar.priceMult), ...(line === 'heavy' ? {} : { line }) };
}

/** The uniques a tier's bosses carry: every unique from that tier or an earlier one. */
export function uniquePool(tier: number): string[] {
  return UNIQUE_IDS.filter((u) => UNIQUES[u]!.tier <= tier && !UNIQUES[u]!.legend);
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
  const plain = u.kind ?? `${rankName(r)} ${def.base}`;
  return { id, slot: u.slot, rank: r, rarity: 'unique', name: u.name, base: plain.toLowerCase(), stats: { [u.stat ?? def.stat]: value }, affixes: [...rollAffixes(rar.affixes, u.slot, r, rar.mult, rng).affixes, ...(u.affix ? [u.affix] : [])], unique: uniqueId, price: Math.round(rankPrice(u.slot, r) * rar.priceMult) };
}

/** A legendary weapon for this class that has come in by this tier, or null (Robin, 2026-11-02: "rare to find or drop from bosses"). */
export function rollLegend(id: string, tier: number, rng: Rng, classId: ClassId): GearItem | null {
  const pool = UNIQUE_IDS.filter((u) => UNIQUES[u]!.legend && !UNIQUES[u]!.arena && UNIQUES[u]!.classId === classId && UNIQUES[u]!.tier <= tier);
  if (!pool.length) return null;
  return makeUnique(id, pool[rng.int(pool.length) - 1]!, tier, rng);
}

/** One of the tier's uniques at `rank`, or null when the tier has none. */
export function rollUnique(id: string, tier: number, rank: number, rng: Rng): GearItem | null {
  const pool = uniquePool(tier);
  if (!pool.length) return null;
  return makeUnique(id, pool[rng.int(pool.length) - 1]!, rank, rng);
}

/** A set's piece for this land's tier (Robin, 2026-11-02), at least a rare one, or null when none has come in yet. */
/** The kind of gear a class wears best: a set of that line counts double when one is found. */
export const CLASS_LINE: Record<ClassId, GearLine> = { warrior: 'heavy', mage: 'magic', rogue: 'light', ranger: 'light' };

export function rollSetPiece(id: string, tier: number, rank: number, rng: Rng, classId: ClassId = 'warrior', worn?: Partial<Record<Slot, GearItem | null>>): GearItem | null {
  const pool = SET_IDS.filter((s) => SETS[s]!.tier <= tier);
  if (!pool.length) return null;
  // A land's own set three times as often, your class's kind twice (2026-11-03: the bots found 13 pieces a run, scattered over nine sets, and wore none).
  const newest = Math.max(...pool.map((s) => SETS[s]!.tier));
  // A set you wear comes again (2026-11-03): each piece of it worn, `GEAR.setLean` times more.
  const have = (s: string): number => Object.values(worn ?? {}).filter((g) => g?.set === s).length;
  const weight = (s: string): number => (SETS[s]!.tier === newest ? 3 : 1) * (SETS[s]!.line === CLASS_LINE[classId] ? 2 : 1) * (1 + GEAR.setLean * have(s));
  let pick = rng.next() * pool.reduce((n, s) => n + weight(s), 0);
  const setId = pool.find((s) => (pick -= weight(s)) < 0) ?? pool[pool.length - 1]!;
  const set = SETS[setId]!;
  // In a slot of the set not yet worn, when there is one.
  const open = set.slots.filter((x) => worn?.[x]?.set !== setId);
  const slots = open.length ? open : set.slots;
  const slot = slots[rng.int(slots.length) - 1]!;
  const piece = rollGear(id, slot, rank, GEAR.rarityBoost.boss, rng, set.line, classId);
  return { ...piece, name: `${set.word} ${GEAR.slots[slot].base}`, set: setId };
}

/** One line on a piece: "Stormborn, iron sword · epic · +14 attack · +12% crit chance"; a unique adds what its power does. */
export function describeGear(g: GearItem): string {
  return [g.name === capitalise(g.base) ? g.name : `${g.name}, ${g.base}`, g.rarity, ...gearPowers(g)].join(' · ');
}

/** What a piece does, as short parts: "+3 attack", "+12% crits bleed", a unique's power. The loot card shows these under the name. */
export function gearPowers(g: GearItem): string[] {
  // A trinket is its passive, said once (Robin, 2026-11-03).
  if (g.trinket && TRINKETS[g.trinket]) return [TRINKETS[g.trinket]!.text];
  const parts: string[] = [];
  // What its kind means for the guards and the hands (Robin, 2026-11-03).
  const w = g.slot === 'weapon' ? kindData('weapon', gearKind(g)) : undefined;
  if (w?.hands === 2) {
    const guards = w.block !== undefined ? `Block stops ${Math.round(w.block * 100)}%, Dodge ${Math.round((w.dodge ?? 0) * 100)}%` : '';
    parts.push(w.keepsOffhand ? `keeps a shield on the bow arm${guards ? `; with none, ${guards}` : ''}` : `two-handed${guards ? `: ${guards}` : ''}`);
  }
  if (g.slot === 'shield' && kindData('shield', gearKind(g))) {
    const o = offhandGuard(g);
    parts.push(o.shield ? `Block stops ${Math.round(o.block * 100)}%, Dodge ${Math.round(o.dodge * 100)}%` : `Ward stops ${Math.round(o.block * 100)}%, Dodge ${Math.round(o.dodge * 100)}%${o.mirror ? `, ${Math.round(o.mirror * 100)}% of it turned back` : ''}${o.brace > 1 ? `, Channel gives ${Math.round((o.brace - 1) * 100)}% more mana` : ''}`);
  }
  for (const [stat, value] of Object.entries(g.stats)) parts.push(`+${value} ${STAT_WORDS[stat] ?? stat}`);
  for (const affix of g.affixes ?? []) {
    const def = GEAR.affixes[affix.kind];
    parts.push(def?.flat ? `+${affix.value} ${def.text}` : `+${affix.value < 0.05 ? Math.round(affix.value * 1000) / 10 : Math.round(affix.value * 100)}% ${def?.text ?? affix.kind}`);
  }
  const u = g.unique ? UNIQUES[g.unique] : undefined;
  if (u) parts.push(u.text);
  const set = g.set ? SETS[g.set] : undefined;
  if (set) parts.push(`Set: ${set.name}`);
  return parts;
}

const STAT_WORDS: Record<string, string> = { attack: 'attack', defense: 'defense', maxHp: 'HP', maxMana: 'mana', magic: 'magic' };

function capitalise(s: string): string {
  return s.replace(/\b\w/g, (ch) => ch.toUpperCase());
}
