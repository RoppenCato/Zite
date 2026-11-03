import { describe, expect, it } from 'vitest';
import type { AffixKind, Slot } from '../src/types.ts';
import { emptyEquipment, kindData } from '../src/index.ts';
import { GEAR } from '../src/data.ts';
import { makeBoard, makeCharacter } from '../src/game.ts';
import { describeGear, plainGear, rankName, rankPrice, rankStat, rollGear, rollRarity, stats } from '../src/gear.ts';
import { makeRng } from '../src/rng.ts';
import { RARITIES, SLOTS, type Rarity } from '../src/types.ts';

describe('gear', () => {
  it('names ranks by tier, ten names and then "Rank n"', () => {
    expect([1, 2, 3, 4, 10, 11, 0].map(rankName)).toEqual(['Tin', 'Copper', 'Iron', 'Silver', 'Everbright', 'Rank 11', 'Tin']);
  });

  it('grows a slot\'s number and price past the table by the growth a rank, so grown areas have gear of their rank', () => {
    const n = GEAR.slots.weapon.perRank.length;
    expect(rankStat('weapon', n)).toBe(GEAR.slots.weapon.perRank[n - 1]);
    expect(rankStat('weapon', n + 1)).toBe(Math.round(GEAR.slots.weapon.perRank[n - 1]! * GEAR.rankGrowth));
    expect(rankStat('weapon', n + 3)).toBe(Math.round(GEAR.slots.weapon.perRank[n - 1]! * GEAR.rankGrowth ** 3));
    expect(rankPrice('weapon', n + 1)).toBe(Math.round(GEAR.slots.weapon.price[n - 1]! * GEAR.priceGrowth));
    expect(plainGear('g9', 'weapon', n + 1)).toMatchObject({ rank: n + 1, name: `${rankName(n + 1)} Sword`, stats: { attack: rankStat('weapon', n + 1) }, price: rankPrice('weapon', n + 1) });
    for (let r = 1; r < 15; r++) expect(rankStat('armour', r + 1), `rank ${r}`).toBeGreaterThan(rankStat('armour', r));
  });

  it('a plain piece is the common rank item of its slot, priced from the table', () => {
    expect(plainGear('g1', 'weapon', 2)).toEqual({ id: 'g1', slot: 'weapon', rank: 2, rarity: 'common', name: 'Copper Sword', base: 'copper sword', kind: 'sword', stats: { attack: 8 }, affixes: [], price: 90 });
    expect(plainGear('g2', 'helm', 1)).toMatchObject({ name: 'Tin Hat', stats: { maxHp: 14 }, price: 32 });
    expect(plainGear('g3', 'trinket', 3)).toMatchObject({ name: 'Iron Charm', stats: { maxHp: 34 } });
  });

  it('rolls rarities by weight, and a boost skips the lowest', () => {
    const count = (boost: number) => {
      const n: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, unique: 0 };
      for (let i = 0; i < 4000; i++) n[rollRarity(makeRng(i), boost)]++;
      return n;
    };
    const plain = count(0);
    expect(plain.common).toBeGreaterThan(2000);
    expect(plain.legendary).toBeGreaterThan(10);
    expect(plain.legendary).toBeLessThan(100);
    const mini = count(1);
    expect(mini.common).toBe(0);
    expect(mini.uncommon).toBeGreaterThan(2000);
    const boss = count(2);
    expect(boss.common + boss.uncommon).toBe(0);
    expect(boss.rare).toBeGreaterThan(2000);
    expect(count(99).legendary).toBe(4000);
  });

  it('a rolled piece swings round the rank times the rarity, affixes rare and up, names epic and up', () => {
    for (let i = 0; i < 300; i++) {
      const slot = SLOTS[i % SLOTS.length]!;
      // A weapon and an off-hand by their kind (2026-11-03): a sword and a kite shield, near the slot's own number.
      const kind = slot === 'weapon' ? 'sword' : slot === 'shield' ? 'kite' : undefined;
      const g = rollGear(`g${i}`, slot, 2, 0, makeRng(`roll-${i}`), 'heavy', 'warrior', kind);
      const def = GEAR.slots[slot];
      const rar = GEAR.rarities[g.rarity];
      const k = kindData(slot, kind)?.mult ?? 1;
      const value = g.stats[def.stat]!;
      expect(value).toBeGreaterThanOrEqual(Math.floor(def.perRank[1]! * k * rar.mult * (1 - GEAR.roll)));
      if (!rar.prefix) expect(value).toBeLessThanOrEqual(Math.ceil(def.perRank[1]! * k * rar.mult * (1 + GEAR.roll)));
      expect(new Set(g.affixes.map((a) => a.kind)).size).toBe(g.affixes.length);
      for (const affix of g.affixes) {
        const range = GEAR.affixes[affix.kind];
        expect(range.slots).toContain(g.slot);
        expect(affix.value).toBeLessThanOrEqual(range.max);

      }
      expect(g.rarity).not.toBe('unique');
      if (rar.named) expect(GEAR.names[slot].some((n) => g.name.includes(n))).toBe(true);
      // A weapon and an off-hand say their kind: Copper Sword, Copper Kite Shield (2026-11-03).
      const word = kind ? (kindData(slot, kind)!.name) : def.base;
      if (!rar.named) expect(g.name).toContain(`Copper ${word}`);
      expect(g.base).toBe(`copper ${word.toLowerCase()}`);
      expect(g.price).toBe(Math.round(def.price[1]! * (kindData(slot, kind)?.price ?? 1) * rar.priceMult));
    }
    expect(rollGear('x', 'weapon', 1, 0, makeRng('same'))).toEqual(rollGear('x', 'weapon', 1, 0, makeRng('same')));
  });

  it('describes a piece in one line', () => {
    expect(describeGear(plainGear('g', 'weapon', 1))).toBe('Tin Sword · common · +4 attack');
    const named = { ...plainGear('g', 'weapon', 2), name: 'Thistledown', rarity: 'epic' as const, stats: { attack: 14 }, affixes: [{ kind: 'crit' as const, value: 0.12 }] };
    expect(describeGear(named)).toBe('Thistledown, copper sword · epic · +14 attack · +12% crit chance');
  });

  it('adds what is worn to the base numbers: stats, crit, dodge, lifesteal, thorns, vigor', () => {
    const board = makeBoard();
    const c = { ...makeCharacter('p', 'R', 'warrior', board), equipment: emptyEquipment() };
    expect(stats(c)).toEqual({ attack: 13, defense: 8, maxHp: 120, maxMana: 20, magic: 0, crit: 0.1, dodge: 0, lifesteal: 0, thorns: 0, bonus: {}, powers: {} });
    const worn = {
      ...c,
      equipment: {
        shield: null,
        gloves: null,
        cape: null,
        weapon: { ...plainGear('w', 'weapon', 2), affixes: [{ kind: 'crit' as const, value: 0.15 }] },
        armour: { ...plainGear('a', 'armour', 1), affixes: [{ kind: 'thorns' as const, value: 0.2 }] },
        helm: { ...plainGear('h', 'helm', 1), affixes: [{ kind: 'vigor' as const, value: 0.1 }] },
        boots: { ...plainGear('b', 'boots', 1), affixes: [{ kind: 'dodge' as const, value: 0.1 }] },
        trinket: { ...plainGear('t', 'trinket', 1), affixes: [{ kind: 'lifesteal' as const, value: 0.2 }] },
      },
    };
    expect(stats(worn)).toEqual({ attack: 22, defense: 14, maxHp: Math.round(144 * 1.1), maxMana: 20, magic: 0, crit: 0.25, dodge: 0.1, lifesteal: 0.2, thorns: 0.2, bonus: {}, powers: {} });
    expect(RARITIES).toEqual(['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique']);
  });
});

describe('suffixes and prefixes', () => {
  const many = (slot: Slot, rank: number, boost: number) => Array.from({ length: 300 }, (_, i) => rollGear(`g${i}`, slot, rank, boost, makeRng(`${slot}${rank}${i}`), 'heavy', 'warrior', slot === 'weapon' ? 'sword' : undefined));

  it('a piece says what it does: rare and up carry a suffix, uncommon and epic and up a prefix; a slot rolls only what suits it', () => {
    for (const g of many('weapon', 2, 0)) {
      if (g.rarity === 'common') expect(g.name).toBe('Copper Sword');
      if (g.rarity === 'rare' || g.rarity === 'epic' || g.rarity === 'legendary') expect(g.name).toMatch(/ of /);
      if (g.rarity === 'uncommon') expect(g.name).toMatch(/^(Fierce|Arcane) /);
      for (const a of g.affixes) expect(GEAR.affixes[a.kind].slots).toContain('weapon');
    }
    for (const g of many('boots', 2, 2)) expect(g.name).not.toMatch(/of Ruin|of Luck|of Haste/);
  });

  it('an old piece is outgrown: the same suffix is far stronger at a higher rank', () => {
    const best = (rank: number, kind: AffixKind): number => Math.max(0, ...many('boots', rank, 2).flatMap((g) => g.affixes.filter((a) => a.kind === kind).map((a) => a.value)));
    expect(best(1, 'wisdom')).toBeLessThan(0.04);
    expect(best(3, 'wisdom')).toBeGreaterThan(best(1, 'wisdom') * 2);
    expect(best(10, 'wisdom')).toBeLessThanOrEqual(GEAR.affixes.wisdom.max);
  });
});
