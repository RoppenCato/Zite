// The talents to level 30 that only show in a set moment: a block, a dodge, a win, a flask, a foe already hurting (Robin, 2026-11-02: "Try different specs and talents").
import { describe, expect, it } from 'vitest';
import { ABILITIES, apply, CLASS_DATA, makeRng, newGame, startFight, stats, type Character, type ClassId, type GameState } from '../src/index.ts';
import { baseNumbers } from '../src/skills.ts';

const P = 'p1';
const NOW = 1_000_000;

function fighter(classId: ClassId, talents: Record<string, number>, hpShare = 0.5): GameState {
  const s = newGame({ seed: 'talents', player: P, name: 'Robin', classId });
  const base: Character = { ...s.characters[P]!, level: 30, ...baseNumbers(classId, 30), abilities: { ...s.characters[P]!.abilities, ...talents }, items: { potion: 3 } };
  const st = stats(base);
  const c = startFight({ ...base, hp: Math.round(st.maxHp * hpShare), mana: Math.round(st.maxMana * 0.5) }, 'frostling', base.space, false);
  return { ...s, characters: { [P]: { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, hp: 5000, maxHp: 5000, attack: 60 } } } } };
}
const round = (s: GameState, guard: string, move: unknown = { kind: 'attack' }, seed = 'x') => apply(s, { type: 'fight', id: 'f', player: P, move, guard } as never, makeRng(seed), NOW);
const me = (s: GameState): Character => s.characters[P]!;
/** Over many seeds, for what a round's chance can hide. */
const total = (s: GameState, guard: string, read: (after: GameState) => number, move: unknown = { kind: 'attack' }): number => {
  let sum = 0;
  for (let i = 0; i < 60; i++) sum += read(round(s, guard, move, `s${i}`).state);
  return sum;
};

describe('the talents that wait for their moment', () => {
  it('Blessed Guard heals on a block', () => {
    const hp = (a: GameState) => me(a).hp;
    expect(total(fighter('warrior', { 'paladin-oath': 1 }), 'block', hp)).toBeGreaterThan(total(fighter('warrior', {}), 'block', hp));
  });
  it('Practised Guard stops more on a block', () => {
    const hp = (a: GameState) => me(a).hp;
    expect(total(fighter('warrior', { 'kni-guard': 3 }), 'block', hp)).toBeGreaterThan(total(fighter('warrior', {}), 'block', hp));
  });
  it('a win gives back: Heart of Flame mana, Blessed Rest HP', () => {
    const won = (classId: ClassId, talents: Record<string, number>) => {
      const s = fighter(classId, talents);
      const c = me(s);
      return round({ ...s, characters: { [P]: { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, hp: 1 } } } } }, 'none').state;
    };
    expect(me(won('mage', { 'wiz-heart': 3 })).mana).toBeGreaterThan(me(won('mage', {})).mana);
    expect(me(won('mage', { 'cle-rest': 3 })).hp).toBeGreaterThan(me(won('mage', {})).hp);
  });
  it('Surge and Cunning start a fight with a point of the meter', () => {
    expect(fighter('mage', { 'spl-surge': 2 }).characters[P]!.fight!.meter).toBe(2);
    expect(fighter('ranger', { 'tra-cunning': 2 }).characters[P]!.fight!.meter).toBe(2);
  });
  it('Better Flasks heal more', () => {
    const hp = (a: GameState) => me(a).hp;
    const drink = { kind: 'item', item: 'potion' };
    const off = (s: GameState): GameState => {
      const c = me(s);
      return { ...s, characters: { [P]: { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, attack: 1 } } } } };
    };
    expect(total(off(fighter('rogue', { 'alc-flask': 3 }, 0.2)), 'block', hp, drink)).toBeGreaterThan(total(off(fighter('rogue', {}, 0.2)), 'block', hp, drink));
  });
  it('Opportunist: after a dodge the next hit is a sure crit', () => {
    const crits = (a: GameState) => me(a).fight?.sureCrit ?? 0;
    expect(total(fighter('rogue', { 'shadow-pact': 1 }), 'dodge', crits)).toBeGreaterThan(total(fighter('rogue', {}), 'dodge', crits));
  });
  it('Barbs and Venom on the Spikes: a stunned or poisoned foe takes more', () => {
    const left = (a: GameState) => -(me(a).fight?.enemy.hp ?? 0);
    const on = (talents: Record<string, number>, foe: Record<string, unknown>): GameState => {
      const s = fighter('ranger', talents);
      const c = me(s);
      return { ...s, characters: { [P]: { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, ...foe } } } } };
    };
    const poisoned = { poison: { rounds: 5, damage: 1 } };
    expect(total(on({ 'tra-venom': 3 }, poisoned), 'none', left)).toBeGreaterThan(total(on({}, poisoned), 'none', left));
    const stunned = { stunned: 2 };
    expect(total(on({ 'tra-barb': 3 }, stunned), 'none', left)).toBeGreaterThan(total(on({}, stunned), 'none', left));
  });
});

describe('the talent data', () => {
  it("every class's window shows three talents of each of its trees, ones you press", () => {
    for (const cls of Object.values(CLASS_DATA)) {
      expect(cls.tagline.length, cls.name).toBeGreaterThan(20);
      expect(cls.story.length, cls.name).toBeGreaterThan(100);
      for (const [id, tree] of Object.entries(cls.trees)) {
        expect(cls.showcase[id], id).toHaveLength(3);
        for (const talent of cls.showcase[id]!) {
          expect(tree.nodes, talent).toContain(talent);
          expect(ABILITIES[talent]!.rule, talent).toBeFalsy();
        }
      }
    }
  });
  it('no two talents of a class share a name', () => {
    const names = new Set<string>();
    for (const a of Object.values(ABILITIES)) {
      const key = `${a.classId}:${a.name}`;
      expect(names.has(key), key).toBe(false);
      names.add(key);
    }
  });
  it('every class can spend its points to 30 and still not fill its trees', () => {
    for (const cls of Object.values(CLASS_DATA)) {
      const ranks = Object.values(cls.trees).flatMap((t) => t.nodes).reduce((sum, id) => sum + ABILITIES[id]!.ranks.length, 0);
      expect(ranks).toBeGreaterThan(29);
    }
  });
});
