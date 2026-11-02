// Sets, and uniques that work by traits (Robin, 2026-11-02: "a few set bonuses, with 2(set), 4(set) so you can mix if you like").
import { describe, expect, it } from 'vitest';
import { GEAR, ITEMS, makeRng, makeUnique, newGame, plainGear, rollLegend, rollSetPiece, SET_IDS, SETS, setsWorn, SLOTS, stats, traitsOf, UNIQUE_IDS, UNIQUES, uniquePool, type Character, type GearItem } from '../src/index.ts';

const hero = (): Character => newGame({ seed: 's', player: 'p', name: 'R', classId: 'warrior' }).characters.p!;
const piece = (set: string, slot: (typeof SLOTS)[number]): GearItem => ({ ...plainGear(`${set}-${slot}`, slot, 2), set });
const wearing = (...pieces: GearItem[]): Character => {
  const c = hero();
  return { ...c, equipment: { ...c.equipment, ...Object.fromEntries(pieces.map((g) => [g.slot, g])) } };
};

describe('sets', () => {
  it('each has five pieces, no weapon, and a bonus at 2 and at 4', () => {
    expect(SET_IDS.length).toBeGreaterThanOrEqual(5);
    for (const id of SET_IDS) {
      const set = SETS[id]!;
      expect(new Set(set.slots).size, id).toBe(5);
      expect(set.slots, id).not.toContain('weapon');
      expect(Object.keys(set.bonuses).sort(), id).toEqual(['2', '4']);
    }
  });
  it('one piece gives nothing; two give the first bonus; four give both', () => {
    const base = stats(hero()).defense;
    const one = wearing(piece('warden', 'helm'));
    expect(traitsOf(one).defenseMult).toBeUndefined();
    const two = wearing(piece('warden', 'helm'), piece('warden', 'gloves'));
    expect(traitsOf(two).defenseMult).toBeCloseTo(1.08);
    expect(traitsOf(two).blockPower).toBeUndefined();
    const four = wearing(piece('warden', 'helm'), piece('warden', 'gloves'), piece('warden', 'boots'), piece('warden', 'shield'));
    expect(traitsOf(four).blockPower).toBeCloseTo(0.1);
    expect(setsWorn(four).warden).toBe(4);
    expect(stats(four).defense).toBeGreaterThan(base);
  });
  it('two sets can be mixed, two pieces each', () => {
    const mixed = wearing(piece('warden', 'helm'), piece('warden', 'boots'), piece('thornkeeper', 'armour'), piece('thornkeeper', 'cape'));
    const t = traitsOf(mixed);
    expect(t.defenseMult).toBeCloseTo(1.08);
    expect(t.thorns).toBeCloseTo(0.08);
  });
  it('a piece drops only from a set that has come in by that tier, and carries its name', () => {
    for (let i = 0; i < 200; i++) {
      const g = rollSetPiece('g', 1, 1, makeRng(`${i}`))!;
      expect(g.set).toBe('warden');
      expect(g.name.startsWith("Warden's")).toBe(true);
    }
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(rollSetPiece('g', 7, 7, makeRng(`x${i}`))!.set!);
    expect(seen.size).toBe(SET_IDS.length);
  });
});

describe('the legendary weapons (Robin, 2026-11-02)', () => {
  it('every class has some, early and late, each with its own art', () => {
    for (const classId of ['warrior', 'rogue', 'mage', 'ranger']) {
      const own = UNIQUE_IDS.filter((id) => UNIQUES[id]!.legend && UNIQUES[id]!.classId === classId);
      expect(own.length, classId).toBeGreaterThanOrEqual(2);
      for (const id of own) expect(UNIQUES[id]!.art, id).toBeTruthy();
    }
  });
  it('are never drawn as a plain unique, and only for their own class and tier', () => {
    for (const id of uniquePool(7)) expect(UNIQUES[id]!.legend, id).toBeFalsy();
    for (let i = 0; i < 100; i++) {
      const g = rollLegend('g', 3, makeRng(`l${i}`), 'warrior')!;
      expect(UNIQUES[g.unique!]!.classId).toBe('warrior');
      expect(UNIQUES[g.unique!]!.tier).toBeLessThanOrEqual(3);
    }
    expect(rollLegend('g', 1, makeRng('x'), 'warrior')).toBeNull();
  });
  it('a magic staff adds magic, and its special affix comes with it', () => {
    const g = makeUnique('s', 'legend-worldkindle', 7, makeRng('m'));
    expect(g.stats.magic).toBeGreaterThan(0);
    expect(g.stats.attack).toBeUndefined();
    expect(g.affixes.some((a) => a.kind === 'embers')).toBe(true);
  });
});

describe('the gear to level 30', () => {
  it('every slot has uniques, early and late', () => {
    for (const slot of SLOTS) {
      const tiers = UNIQUE_IDS.filter((id) => UNIQUES[id]!.slot === slot).map((id) => UNIQUES[id]!.tier);
      expect(tiers.length, slot).toBeGreaterThanOrEqual(3);
    }
    expect(UNIQUE_IDS.filter((id) => UNIQUES[id]!.tier >= 6).length).toBeGreaterThanOrEqual(8);
  });
  it('a unique with traits works when worn', () => {
    const c = hero();
    const worn = { ...c, equipment: { ...c.equipment, gloves: makeUnique('u', 'knucklebells', 2, makeRng('u')) } };
    expect(traitsOf(worn).critPower).toBeCloseTo(0.3);
  });
  it('flasks climb with the lands, and rank names reach past the last land', () => {
    expect(ITEMS['potion-5']!.heal).toBeGreaterThan(ITEMS['potion-4']!.heal!);
    expect(ITEMS['potion-4']!.heal).toBeGreaterThan(ITEMS['potion-3']!.heal!);
    expect(GEAR.ranks.length).toBeGreaterThanOrEqual(8);
  });
});
