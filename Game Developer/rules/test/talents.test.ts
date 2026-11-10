// The talents to level 30 that only show in a set moment: a block, a dodge, a win, a flask, a foe already hurting (Robin, 2026-11-02: "Try different specs and talents").
import { describe, expect, it } from 'vitest';
import { ABILITIES, apply, CLASS_DATA, makeRng, migrate, newGame, pointsFree, startFight, stats, type Character, type ClassId, type GameState } from '../src/index.ts';
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
  // The Warlord and the Berserker without its healing (Robin, 2026-11-10).
  const use = (id: string) => ({ kind: 'ability', ability: id });
  it('a banner is planted for the fight, and another takes its place', () => {
    const s = fighter('warrior', { 'war-valor': 1, 'war-dread': 1 }, 1);
    const one = round(s, 'none', use('war-valor')).state;
    expect(me(one).fight!.banner).toMatchObject({ kind: 'valor' });
    expect(me(round(one, 'none', use('war-dread')).state).fight!.banner).toMatchObject({ kind: 'dread' });
  });
  it('Banner of Valor gives a point every second round, and the higher ranks some at once', () => {
    const s = withFight(fighter('warrior', {}, 1), { banner: { kind: 'valor', every: 2, age: 0 } });
    const one = round(s, 'none').state;
    expect(me(one).fight!.meter).toBe(0);
    expect(me(round(one, 'none').state).fight!.meter).toBe(1);
    expect(me(round(fighter('warrior', { 'war-valor': 3 }, 1), 'none', use('war-valor')).state).fight!.meter).toBe(2);
  });
  it('Banner of Dread: the foe hits softer and takes more; it counts as weakened', () => {
    const dreadBanner = { banner: { kind: 'dread', weaken: 0.82, sunder: 1.14, age: 0 } };
    const hp = (a: GameState) => me(a).hp;
    expect(total(withFight(fighter('warrior', {}), dreadBanner), 'none', hp)).toBeGreaterThan(total(fighter('warrior', {}), 'none', hp));
    expect(dealt(withFight(fighter('warrior', {}), dreadBanner))).toBeGreaterThan(dealt(fighter('warrior', {})) * 1.08);
    expect(dealt(withFight(fighter('warrior', { 'war-nerve': 3 }), dreadBanner))).toBeGreaterThan(dealt(withFight(fighter('warrior', {}), dreadBanner)) * 1.1);
  });
  it('Banner of War: harder every round it has stood, up to its cap', () => {
    const war = (age: number) => dealt(withFight(fighter('warrior', {}), { banner: { kind: 'war', grow: 0.05, cap: 0.5, age } }));
    expect(war(4)).toBeGreaterThan(war(0) * 1.12);
    expect(war(40)).toBeLessThan(war(0) * 1.6);
  });
  it('Standard Bearer, Seize the Moment, Old Campaigner and First Blood each pay in their moment, and only then', () => {
    const banner = { banner: { kind: 'valor', every: 2, age: 0 } };
    expect(dealt(withFight(fighter('warrior', { 'war-bearer': 3 }), banner))).toBeGreaterThan(dealt(withFight(fighter('warrior', {}), banner)) * 1.05);
    expect(dealt(fighter('warrior', { 'war-bearer': 3 }))).toBe(dealt(fighter('warrior', {})));
    const winding = { next: { name: 'Lunge', power: 2, weight: 1, charge: true } };
    expect(dealt(withFight(fighter('warrior', { 'war-seize': 3 }), {}, winding))).toBeGreaterThan(dealt(withFight(fighter('warrior', {}), {}, winding)) * 1.15);
    expect(dealt(withFight(fighter('warrior', { 'war-veteran': 3 }), { round: 5 }))).toBeGreaterThan(dealt(withFight(fighter('warrior', {}), { round: 5 })) * 1.08);
    expect(dealt(withFight(fighter('warrior', { 'war-veteran': 3 }), { round: 2 }))).toBe(dealt(withFight(fighter('warrior', {}), { round: 2 })));
    expect(dealt(fighter('warrior', { 'war-first': 3 }))).toBeGreaterThan(dealt(fighter('warrior', {})) * 1.2);
    expect(dealt(withFight(fighter('warrior', { 'war-first': 3 }), { strikes: 1 }))).toBe(dealt(withFight(fighter('warrior', {}), { strikes: 1 })));
  });
  it('War Cry: harder for three rounds; Long Breath a round more; Commanding Voice stronger', () => {
    const cry = (talents: Record<string, number>) => {
      const r = round(fighter('warrior', { 'war-cry': 1, ...talents }, 1), 'none', use('war-cry'));
      return r.events.find((e) => e.type === 'effect' && e.kind === 'attackUp') as { rounds: number };
    };
    expect(cry({}).rounds).toBe(3);
    expect(cry({ 'war-breath': 1 }).rounds).toBe(4);
    const after = (talents: Record<string, number>) => me(round(fighter('warrior', { 'war-cry': 1, ...talents }, 1), 'none', use('war-cry')).state).fight!.attackUp!.mult;
    expect(after({ 'war-voice': 3 })).toBeGreaterThan(after({}));
  });
  it('Hold the Line: a Block gives a point more Valor', () => {
    const meter = (a: GameState) => me(a).fight?.meter ?? 0;
    const held = withFight(fighter('warrior', {}, 1), { valorUp: { rounds: 3, extra: 1 } });
    expect(total(held, 'block', meter)).toBeGreaterThan(total(fighter('warrior', {}, 1), 'block', meter) * 1.8);
  });
  it('Terrifying Roar: a boss loses its turn, once a fight', () => {
    const boss = withFight(fighter('warrior', { 'war-roar': 1 }, 1), { meter: 5 }, { role: 'boss' });
    const one = round(boss, 'none', use('war-roar'));
    expect(one.events).toContainEqual(expect.objectContaining({ type: 'skipped', by: 'enemy' }));
    const two = round(one.state, 'none', use('war-roar'));
    expect(two.events).not.toContainEqual(expect.objectContaining({ type: 'skipped', by: 'enemy' }));
  });
  it('Field Tactics: the first banner goes up with an Attack, the second does not', () => {
    const s = fighter('warrior', { 'war-valor': 1, 'war-dread': 1, 'war-tactics': 1 }, 1);
    const one = round(s, 'none', use('war-valor'));
    expect(one.events.some((e) => e.type === 'hit' && e.by === 'player')).toBe(true);
    expect(round(one.state, 'none', use('war-dread')).events.some((e) => e.type === 'hit' && e.by === 'player')).toBe(false);
  });
  it('Raise Every Banner: all three at once for four rounds', () => {
    const s = withFight(fighter('warrior', { 'war-all': 1 }, 1), { meter: 5 });
    let after = round(s, 'none', use('war-all')).state;
    expect(me(after).fight!.allBanners).toMatchObject({ rounds: 3 });
    expect(dealt(after)).toBeGreaterThan(dealt(s) * 1.08);
    for (let i = 0; i < 3; i++) after = round(after, 'none').state;
    expect(me(after).fight!.allBanners ?? null).toBeNull();
  });
  it('Battle Rhythm: each hit in a row harder, and a Block ends it', () => {
    const s = fighter('warrior', { 'ber-fury': 3 }, 1);
    expect(dealt(withFight(s, { rhythm: 5 }))).toBeGreaterThan(dealt(s) * 1.2);
    expect(me(round(s, 'none').state).fight!.rhythm).toBe(1);
    expect(me(round(withFight(s, { rhythm: 4 }), 'block').state).fight!.rhythm).toBe(0);
  });
  it('Pain Feeds Anger: the hit after a blow taken lands harder, once', () => {
    const s = fighter('warrior', { 'ber-thirst': 3 }, 1);
    expect(dealt(withFight(s, { anger: true }))).toBeGreaterThan(dealt(s) * 1.08);
    expect(me(round(withFight(s, {}, { next: { name: 'Bite', power: 1, weight: 1 } }), 'none').state).fight!.anger).toBe(true);
  });
  it('Bloodied Edge and Drink Deep: a crit opens a bleed, and the bleed heals', () => {
    const crit = round(withFight(fighter('warrior', { 'ber-keen': 2 }, 1), { sureCrit: 1 }), 'none').state;
    expect(me(crit).fight!.enemy.bleed).toMatchObject({ rounds: 2 });
    expect(me(round(fighter('warrior', {}, 1), 'none').state).fight!.enemy.bleed ?? null).toBeNull();
    const bleeding = { bleed: { rounds: 3, damage: 200 } };
    const hp = (a: GameState) => me(a).hp;
    expect(total(withFight(fighter('warrior', { 'ber-drink': 3 }), {}, bleeding), 'none', hp)).toBeGreaterThan(total(withFight(fighter('warrior', {}), {}, bleeding), 'none', hp));
    // No bleed, no healing.
    expect(total(fighter('warrior', { 'ber-drink': 3 }), 'none', hp)).toBe(total(fighter('warrior', {}), 'none', hp));
  });
  it('a save from before the Warlord: the Paladin talents are forgotten and their points come back', () => {
    const s = newGame({ seed: 'talents', player: P, name: 'Robin', classId: 'warrior' });
    const c = { ...me(s), level: 20, abilities: { ...me(s).abilities, 'holy-strike': 3, 'pal-devotion': 3, 'paladin-oath': 1, reckless: 2 }, carried: ['heavy-blow', 'execute', 'holy-strike', 'reckless'] };
    const up = migrate(JSON.parse(JSON.stringify({ ...s, version: 45, characters: { [P]: c } })))!;
    expect(up.version).toBe(46);
    expect(Object.keys(me(up).abilities).sort()).toEqual(['execute', 'heavy-blow', 'reckless']);
    expect(me(up).carried).toEqual(['heavy-blow', 'execute', 'reckless']);
    expect(pointsFree(me(up))).toBe(19 - 2);
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
