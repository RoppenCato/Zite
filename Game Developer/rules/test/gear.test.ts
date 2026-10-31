import { describe, expect, it } from 'vitest';
import { GEAR } from '../src/data.ts';
import { makeBoard, makeCharacter } from '../src/game.ts';
import { describeGear, plainGear, rankName, rankPrice, rankStat, rollGear, rollRarity, stats } from '../src/gear.ts';
import { makeRng } from '../src/rng.ts';
import { RARITIES, SLOTS, type Rarity } from '../src/types.ts';

describe('gear', () => {
  it('names ranks by tier, ten names and then "Rank n"', () => {
    expect([1, 2, 3, 4, 10, 11, 0].map(rankName)).toEqual(['Copper', 'Iron', 'Steel', 'Mithril', 'Sunmetal', 'Rank 11', 'Copper']);
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
    expect(plainGear('g1', 'weapon', 2)).toEqual({ id: 'g1', slot: 'weapon', rank: 2, rarity: 'common', name: 'Iron Sword', base: 'iron sword', stats: { attack: 8 }, affix: null, price: 90 });
    expect(plainGear('g2', 'helm', 1)).toMatchObject({ name: 'Copper Helm', stats: { maxHp: 12 }, price: 20 });
    expect(plainGear('g3', 'trinket', 3)).toMatchObject({ name: 'Steel Amulet', stats: { maxMana: 20 } });
  });

  it('rolls rarities by weight, and a boost skips the lowest', () => {
    const count = (boost: number) => {
      const n: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
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
      const g = rollGear(`g${i}`, slot, 2, 0, makeRng(`roll-${i}`));
      const def = GEAR.slots[slot];
      const rar = GEAR.rarities[g.rarity];
      const value = g.stats[def.stat]!;
      expect(value).toBeGreaterThanOrEqual(Math.floor(def.perRank[1]! * rar.mult * (1 - GEAR.roll)));
      expect(value).toBeLessThanOrEqual(Math.ceil(def.perRank[1]! * rar.mult * (1 + GEAR.roll)));
      expect(Object.keys(g.stats)).toEqual([def.stat]);
      expect(g.affix !== null).toBe(rar.affix);
      if (g.affix) {
        const range = GEAR.affixes[g.affix.kind];
        expect(g.affix.value).toBeGreaterThanOrEqual(range.min);
        expect(g.affix.value).toBeLessThanOrEqual(range.max);
      }
      if (rar.named) expect(GEAR.names[slot]).toContain(g.name);
      else expect(g.name).toBe(`Iron ${def.base}`);
      expect(g.base).toBe(`iron ${def.base.toLowerCase()}`);
      expect(g.price).toBe(Math.round(def.price[1]! * rar.priceMult));
    }
    expect(rollGear('x', 'weapon', 1, 0, makeRng('same'))).toEqual(rollGear('x', 'weapon', 1, 0, makeRng('same')));
  });

  it('describes a piece in one line', () => {
    expect(describeGear(plainGear('g', 'weapon', 1))).toBe('Copper Sword · common · +4 attack');
    const named = { ...plainGear('g', 'weapon', 2), name: 'Stormborn', rarity: 'epic' as const, stats: { attack: 14 }, affix: { kind: 'crit' as const, value: 0.12 } };
    expect(describeGear(named)).toBe('Stormborn, iron sword · epic · +14 attack · +12% crit chance');
  });

  it('adds what is worn to the base numbers: stats, crit, dodge, lifesteal, thorns, vigor', () => {
    const board = makeBoard();
    const c = makeCharacter('p', 'R', 'warrior', board);
    expect(stats(c)).toEqual({ attack: 12, defense: 8, maxHp: 120, maxMana: 20, crit: 0.1, dodge: 0, lifesteal: 0, thorns: 0 });
    const worn = {
      ...c,
      equipment: {
        weapon: { ...plainGear('w', 'weapon', 2), affix: { kind: 'crit' as const, value: 0.15 } },
        armour: { ...plainGear('a', 'armour', 1), affix: { kind: 'thorns' as const, value: 0.2 } },
        helm: { ...plainGear('h', 'helm', 1), affix: { kind: 'vigor' as const, value: 0.1 } },
        boots: { ...plainGear('b', 'boots', 1), affix: { kind: 'dodge' as const, value: 0.1 } },
        trinket: { ...plainGear('t', 'trinket', 1), affix: { kind: 'lifesteal' as const, value: 0.2 } },
      },
    };
    expect(stats(worn)).toEqual({ attack: 20, defense: 13, maxHp: Math.round(132 * 1.1), maxMana: 26, crit: 0.25, dodge: 0.1, lifesteal: 0.2, thorns: 0.2 });
    expect(RARITIES).toEqual(['common', 'uncommon', 'rare', 'epic', 'legendary']);
  });
});
