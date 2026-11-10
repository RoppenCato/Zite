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
  // The bridges between trees (mine, 2026-11-10): a passive in one tree pays for what another tree does.
  const dealt = (s: GameState, move: unknown = { kind: 'attack' }) => total(s, 'none', (a) => 5000 - (me(a).fight?.enemy.hp ?? 0), move);
  const withFight = (s: GameState, f: Record<string, unknown>, enemy: Record<string, unknown> = {}): GameState => ({ ...s, characters: { [P]: { ...me(s), fight: { ...me(s).fight!, ...f, enemy: { ...me(s).fight!.enemy, ...enemy } } } } });
  it('Bastion and Enchanted Mail: more dealt while a barrier holds, and only then', () => {
    for (const [classId, talent] of [['warrior', 'kni-bastion'], ['mage', 'spl-plate']] as const) {
      const bare = fighter(classId, {});
      const has = fighter(classId, { [talent]: 3 });
      expect(dealt(withFight(has, { barrier: 500 })), talent).toBeGreaterThan(dealt(withFight(bare, { barrier: 500 })));
      expect(dealt(withFight(has, { barrier: 0 })), talent).toBe(dealt(withFight(bare, { barrier: 0 })));
    }
  });
  it('Patient Blade: a bleeding foe takes more', () => {
    const bleed = { bleed: { rounds: 3, damage: 1 } };
    // Its growing crit chance is the same for both, so only the bleed tells them apart.
    const has = fighter('rogue', { 'sha-streak': 3 });
    expect(dealt(withFight(has, {}, bleed))).toBeGreaterThan(dealt(withFight(has, {}, {})) + 60 * 3);
  });
  it('Hunting Pair: your own arrows hit harder while the owl is out', () => {
    const owl = { companion: { name: 'Owl Friend', rounds: 5, power: 0.6 } };
    expect(dealt(withFight(fighter('ranger', { 'bea-pack': 3 }), owl))).toBeGreaterThan(dealt(withFight(fighter('ranger', {}), owl)));
    expect(dealt(fighter('ranger', { 'bea-pack': 3 }))).toBe(dealt(fighter('ranger', {})));
  });
  it('the owl strikes harder at a foe that takes more', () => {
    const owl = { companion: { name: 'Owl Friend', rounds: 5, power: 0.6 } };
    const owlHits = (s: GameState) => { let sum = 0; for (let i = 0; i < 40; i++) for (const e of round(s, 'none', { kind: 'attack' }, `o${i}`).events) if (e.type === 'hit' && e.by === 'player' && e.move === 'Owl Friend') sum += e.damage; return sum; };
    expect(owlHits(withFight(fighter('ranger', {}), owl, { sunder: { rounds: 3, mult: 1.5 } }))).toBeGreaterThan(owlHits(withFight(fighter('ranger', {}), owl)) * 1.3);
  });
  it('Venom on the Spikes: a tripwire that catches and spikes that go off poison; without it they do not', () => {
    const lunge = { next: { name: 'Lunge', power: 2, weight: 1, charge: true } };
    const caught = (talents: Record<string, number>) => me(round(withFight(fighter('ranger', talents), { trap: 1, round: 2 }, lunge), 'none').state).fight!.enemy.poison;
    expect(caught({ 'tra-venom': 2 })).toBeTruthy();
    expect(caught({})).toBeFalsy();
    const spiked = (talents: Record<string, number>) => me(round(withFight(fighter('ranger', talents), { spike: { rounds: 3, power: 1 }, round: 2 }, { next: { name: 'Bite', power: 1, weight: 1 } }), 'none').state).fight!.enemy.poison;
    expect(spiked({ 'tra-venom': 3 })).toBeTruthy();
    expect(spiked({})).toBeFalsy();
    // A rank is another helping.
    expect(spiked({ 'tra-venom': 3 })!.damage).toBeGreaterThan(spiked({ 'tra-venom': 1 })!.damage);
  });
  it('Taunting Shout hits as well as weakens', () => {
    const r = round(fighter('warrior', { 'kni-taunt': 1 }, 1), 'none', { kind: 'ability', ability: 'kni-taunt' });
    expect(r.events.some((e) => e.type === 'hit' && e.by === 'player')).toBe(true);
    expect(me(r.state).fight!.enemy.weakened).toBeTruthy();
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
