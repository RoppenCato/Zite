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
  it('Surge starts a fight with a point of the meter', () => {
    expect(fighter('mage', { 'spl-surge': 2 }).characters[P]!.fight!.meter).toBe(2);
  });
  it('Opportunist: after a dodge the next hit is a sure crit', () => {
    const crits = (a: GameState) => me(a).fight?.sureCrit ?? 0;
    expect(total(fighter('rogue', { 'shadow-pact': 1 }), 'dodge', crits)).toBeGreaterThan(total(fighter('rogue', {}), 'dodge', crits));
  });
  it('Barbs: a stunned foe takes more', () => {
    const left = (a: GameState) => -(me(a).fight?.enemy.hp ?? 0);
    const on = (talents: Record<string, number>, foe: Record<string, unknown>): GameState => {
      const s = fighter('ranger', talents);
      const c = me(s);
      return { ...s, characters: { [P]: { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, ...foe } } } } };
    };
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
    expect(up.version).toBe(49);
    expect(Object.keys(me(up).abilities).sort()).toEqual(['execute', 'heavy-blow', 'reckless']);
    expect(me(up).carried).toEqual(['heavy-blow', 'execute', 'reckless']);
    expect(pointsFree(me(up))).toBe(19 - 2);
  });

  // The Magician: timing, Light and two stances (Robin, 2026-11-11).
  const ICE = { kind: 'ice', stance: true, rounds: 0, power: 0.25, mult: 0.8, barrier: 0.03 };
  const STORM = { kind: 'storm', stance: true, rounds: 0, power: 0.45, chance: 0.3 };
  it('two spells can be in the air, and land in the same round', () => {
    const s0 = withFight(fighter('mage', { meteor: 1, 'wiz-firestorm': 1 }), { meter: 5 });
    const s = { ...s0, characters: { [P]: { ...me(s0), mana: stats(me(s0)).maxMana, equipment: { ...me(s0).equipment, weapon: { ...me(s0).equipment.weapon!, kind: 'staff' }, shield: null } } } };
    const one = round(s, 'none', use('meteor')).state;
    const twoR = round(one, 'none', use('wiz-firestorm'));
    const two = twoR.state;
    expect(me(two).fight!.windup).toMatchObject({ name: 'Falling Star', rounds: 1 });
    expect(me(two).fight!.air).toMatchObject([{ name: 'Firestorm', rounds: 1 }]);
    const landed = round(two, 'none').events.filter((e) => e.type === 'hit' && e.by === 'player').map((e) => (e as { move: string }).move);
    expect(landed).toEqual(expect.arrayContaining(['Falling Star', 'Firestorm']));
  });
  it('Conjunction: two landing together hit harder, one alone does not', () => {
    const both = { windup: { name: 'A', power: 2, rounds: 1 }, air: [{ name: 'B', power: 2, rounds: 1 }] };
    const alone = { windup: { name: 'A', power: 2, rounds: 1 } };
    expect(dealt(withFight(fighter('mage', { 'wiz-conjunction': 3 }), both))).toBeGreaterThan(dealt(withFight(fighter('mage', {}), both)) * 1.1);
    expect(dealt(withFight(fighter('mage', { 'wiz-conjunction': 3 }), alone))).toBe(dealt(withFight(fighter('mage', {}), alone)));
    // A spell cast as one lands counts as the second.
    const cast = withFight(fighter('mage', { 'wiz-conjunction': 3, fireball: 1 }), alone);
    expect(dealt(cast, use('fireball'))).toBeGreaterThan(dealt(withFight(fighter('mage', { fireball: 1 }), alone), use('fireball')) * 1.1);
  });
  it('Combust: the fire burns twice as hard and two rounds longer, for 2 Arcana', () => {
    const s = withFight(fighter('mage', { 'wiz-combust': 1 }), { meter: 2 }, { burn: { rounds: 3, damage: 100 } });
    const after = me(round(s, 'none', use('wiz-combust')).state).fight!;
    expect(after.enemy.burn).toMatchObject({ damage: 200, rounds: 4 });
    expect(round(withFight(s, { meter: 1 }), 'none', use('wiz-combust')).events.some((e) => e.type === 'rejected')).toBe(true);
  });
  it('Ward of Ash: the Ward stops more while the foe burns, and only then', () => {
    const hp = (a: GameState) => me(a).hp;
    const burning = { burn: { rounds: 3, damage: 1 } };
    expect(total(withFight(fighter('mage', { 'wiz-ash': 3 }), {}, burning), 'block', hp)).toBeGreaterThan(total(withFight(fighter('mage', {}), {}, burning), 'block', hp));
    expect(total(fighter('mage', { 'wiz-ash': 3 }), 'block', hp)).toBe(total(fighter('mage', {}), 'block', hp));
  });
  it('Hot Streak: a spell that crits makes the next one cheaper', () => {
    const s = withFight(fighter('mage', { 'wiz-streak': 2, fireball: 1 }), { sureCrit: 1 });
    const paid = (r: { events: { type: string }[] }) => -(r.events.find((e) => e.type === 'mana') as unknown as { delta: number }).delta;
    const first = round(s, 'none', use('fireball'));
    expect(me(first.state).fight!.cheap).toBeCloseTo(0.3);
    const second = round(withFight(first.state, { sureCrit: 0 }), 'none', use('fireball'));
    expect(paid(second)).toBeLessThan(paid(first));
  });
  it('Light: a heal charges it, a holy hit spends it and lands harder', () => {
    const s = fighter('mage', { mend: 1, smite: 1 });
    expect(me(round(s, 'none', use('mend')).state).fight!.light).toBe(1);
    expect(dealt(withFight(s, { light: 3 }), use('smite'))).toBeGreaterThan(dealt(s, use('smite')) * 1.35);
    expect(me(round(withFight(s, { light: 3 }), 'none', use('smite')).state).fight!.light).toBe(0);
    // Bright Light: each charge worth more.
    expect(dealt(withFight(fighter('mage', { smite: 1, 'cle-bright': 3 }), { light: 3 }), use('smite'))).toBeGreaterThan(dealt(withFight(s, { light: 3 }), use('smite')) * 1.08);
  });
  it('Brimming: healing past full is a second charge', () => {
    const full = fighter('mage', { mend: 1, 'cle-brimming': 3 }, 1);
    expect(me(round(withFight(full, { skip: 1 }), 'none', use('mend')).state).fight!.light).toBe(2);
  });
  it('Shielded Faith: less taken behind a barrier', () => {
    const left = (a: GameState) => me(a).fight?.barrier ?? 0;
    const behind = { barrier: 5000 };
    expect(total(withFight(fighter('mage', { 'cle-faith': 3 }), behind), 'none', left)).toBeGreaterThan(total(withFight(fighter('mage', {}), behind), 'none', left));
  });
  it('a stance stands for the whole fight, and the other takes its place', () => {
    const s = fighter('mage', { 'frost-blade': 1, 'storm-blade': 1 });
    let after = round(s, 'none', use('frost-blade')).state;
    for (let i = 0; i < 8; i++) after = round(withFight(after, {}, { hp: 5000 }), 'block', { kind: 'attack' }, 'r' + i).state;
    expect(me(after).fight!.infuse).toMatchObject({ kind: 'ice', stance: true });
    expect(me(round(after, 'none', use('storm-blade')).state).fight!.infuse).toMatchObject({ kind: 'storm', stance: true });
  });
  it('Frost gives a little barrier a hit, and Rime one a Block, up to a share of HP', () => {
    const s = withFight(fighter('mage', { 'spl-rime': 3 }), { infuse: ICE, skip: 1 });
    const maxHp = stats(me(s)).maxHp;
    expect(me(round(s, 'block').state).fight!.barrier).toBe(Math.round(maxHp * 0.09) + Math.round(maxHp * 0.03));
    expect(me(round(withFight(s, { barrier: Math.round(maxHp * 0.3) }), 'block').state).fight!.barrier).toBe(Math.round(maxHp * 0.3));
  });
  it('Shift: leaving Frost stuns a lesser foe, leaving Storm lands far harder', () => {
    const s = (blade: unknown) => withFight(fighter('mage', { 'spl-shift': 1, 'frost-blade': 1 }), { meter: 2, infuse: blade });
    const fromFrost = round(s(ICE), 'none', use('spl-shift'));
    expect(me(fromFrost.state).fight!.infuse).toMatchObject({ kind: 'storm' });
    expect(fromFrost.events.some((e) => e.type === 'skipped' && e.reason === 'stunned')).toBe(true);
    expect(me(round(s(STORM), 'none', use('spl-shift')).state).fight!.infuse).toMatchObject({ kind: 'ice' });
    expect(dealt(s(STORM), use('spl-shift'))).toBeGreaterThan(dealt(s(null), use('spl-shift')) * 1.15);
  });
  it('Changing Winds, Static and Grounded', () => {
    expect(dealt(withFight(fighter('mage', { 'spl-winds': 3 }), { shifted: true }))).toBeGreaterThan(dealt(withFight(fighter('mage', {}), { shifted: true })) * 1.2);
    expect(dealt(withFight(fighter('mage', { 'spl-static': 3 }), { infuse: STORM }))).toBeGreaterThan(dealt(withFight(fighter('mage', {}), { infuse: STORM })));
    const sure = { infuse: { ...STORM, chance: 1 } };
    expect(me(round(withFight(fighter('mage', { 'spl-grounded': 1 }), sure), 'none').state).fight!.meter).toBe(2);
    expect(me(round(withFight(fighter('mage', {}), sure), 'none').state).fight!.meter).toBe(1);
  });
  it('Avatar of War: both stances at once for five rounds', () => {
    const s = fighter('mage', { 'spl-avatar': 1 });
    expect(me(round(s, 'none', use('spl-avatar')).state).fight!.both).toEqual({ rounds: 4 });
    expect(dealt(withFight(s, { both: { rounds: 3 } }))).toBeGreaterThan(dealt(withFight(s, { infuse: STORM })) * 1.15);
  });
  it('a save from before the new Magician: the talents that went give their points back', () => {
    const s = newGame({ seed: 'talents', player: P, name: 'Robin', classId: 'mage' });
    const c = { ...me(s), level: 20, abilities: { ...me(s).abilities, fireball: 2, 'wiz-focus': 3, 'spl-tempest': 2 }, carried: ['arcane-bolt', 'overflow', 'fireball', 'spl-tempest'] };
    const up = migrate(JSON.parse(JSON.stringify({ ...s, version: 46, characters: { [P]: c } })))!;
    expect(up.version).toBe(49);
    expect(me(up).abilities['wiz-focus']).toBeUndefined();
    expect(me(up).abilities['spl-tempest']).toBeUndefined();
    expect(me(up).abilities.fireball).toBe(2);
    expect(me(up).carried).toEqual(['arcane-bolt', 'overflow', 'fireball']);
  });

  // The Rogue: blood held or spent, the dark, flasks that react (Robin, 2026-11-11).
  const ninja = (talents: Record<string, number>) => fighter('rogue', { 'blood-on-the-blade': 1, ...talents });
  const full = (s: GameState): GameState => ({ ...s, characters: { [P]: { ...me(s), mana: 999 } } });
  it('blood held sharpens the blade, and Wet Blade more', () => {
    expect(dealt(withFight(ninja({}), { blood: 3 }))).toBeGreaterThan(dealt(withFight(fighter('rogue', {}), { blood: 3 })));
    expect(dealt(withFight(ninja({ 'nin-wet': 3 }), { blood: 3 }))).toBeGreaterThan(dealt(withFight(ninja({}), { blood: 3 })) * 1.1);
  });
  it('First Blood starts a fight with drops, and Deep Cup holds more', () => {
    expect(me(ninja({ 'nin-start': 2 })).fight!.blood).toBe(2);
    expect(me(round(withFight(ninja({ 'nin-cup': 2 }), { blood: 4 }), 'none').state).fight!.blood).toBe(5);
    expect(me(round(withFight(ninja({}), { blood: 3 }), 'none').state).fight!.blood).toBe(3);
  });
  it('Bloodthirst: a crit leaves a second drop', () => {
    expect(me(round(withFight(ninja({ 'nin-thirst': 3 }), { sureCrit: 1 }), 'none').state).fight!.blood).toBeGreaterThan(1);
    expect(me(round(withFight(ninja({}), { sureCrit: 1 }), 'none').state).fight!.blood).toBe(1);
  });
  it('Vanish spends the blood for sure crits, and the Army of One keeps it', () => {
    const s = full(withFight(ninja({ 'nin-vanish': 1, 'crimson-arc': 1 }), { blood: 3 }));
    const gone = me(round(s, 'none', use('nin-vanish')).state).fight!;
    expect(gone.blood).toBe(0);
    expect(gone.sureCrit).toBe(4);
    const army = withFight(s, { clone: { rounds: 5, power: 0.9, keepBlood: true } });
    expect(me(round(army, 'none', use('crimson-arc')).state).fight!.blood).toBe(3);
  });
  it('the dark: Ambush lands harder from it, however you got there', () => {
    const s = full(fighter('rogue', { ambush: 1 }));
    expect(dealt(withFight(s, { dark: 1 }), use('ambush'))).toBeGreaterThan(dealt(s, use('ambush')) * 1.3);
    expect(dealt(withFight(s, { dance: { exposed: false, rounds: 2, chance: 0.9 } }), use('ambush'))).toBeGreaterThan(dealt(s, use('ambush')) * 1.3);
    // The round Shadow Dance is pressed is not yet the dark.
    expect(dealt(withFight(s, { dance: { exposed: true, rounds: 2, chance: 0.9 } }), use('ambush'))).toBe(dealt(s, use('ambush')));
  });
  it('Assassinate costs no Mischief from the dark', () => {
    const s = full(withFight(fighter('rogue', { assassinate: 1 }), { meter: 0 }));
    expect(round(s, 'none', use('assassinate')).events.some((e) => e.type === 'rejected')).toBe(true);
    expect(round(withFight(s, { dark: 1 }), 'none', use('assassinate')).events.some((e) => e.type === 'rejected')).toBe(false);
    expect(me(round(withFight(s, { dark: 1, meter: 3 }), 'none', use('assassinate')).state).fight!.meter).toBeGreaterThanOrEqual(3);
  });
  it('Night Cut: in the dark for the next round, and no longer', () => {
    const s = full(fighter('rogue', { 'sha-gloom': 1 }));
    const cut = round(s, 'none', use('sha-gloom')).state;
    expect(me(cut).fight!.dark).toBe(1);
    expect(me(round(cut, 'none').state).fight!.dark).toBe(0);
  });
  it('Thousand Cuts: outside the dark a crit is a point of Mischief', () => {
    const s = full(withFight(fighter('rogue', { 'thousand-cuts': 1 }), { sureCrit: 6, meter: 0 }));
    expect(me(round(s, 'none', use('thousand-cuts')).state).fight!.meter).toBe(5);
    expect(me(round(withFight(s, { dark: 1 }), 'none', use('thousand-cuts')).state).fight!.meter).toBe(1);
  });
  it('Lurk: a round in the dark without a strike makes the next hit harder', () => {
    const s = full(fighter('rogue', { 'sha-lurk': 3, 'poison-coat': 1 }));
    const waited = round(withFight(s, { dark: 2 }), 'none', use('poison-coat')).state;
    expect(me(waited).fight!.lurk).toBeCloseTo(0.45);
    expect(me(round(waited, 'none').state).fight!.lurk).toBe(0);
    expect(me(round(s, 'none', use('poison-coat')).state).fight!.lurk ?? 0).toBe(0);
    expect(me(round(withFight(s, { dark: 2 }), 'none').state).fight!.lurk ?? 0).toBe(0);
  });
  it('Dark Sight crits more in the dark; Reaper kills under half from it', () => {
    const crits = (s: GameState) => total(s, 'none', (a) => 5000 - (me(a).fight?.enemy.hp ?? 0));
    expect(crits(withFight(fighter('rogue', { 'sha-sight': 3 }), { dark: 1 }))).toBeGreaterThan(crits(withFight(fighter('rogue', {}), { dark: 1 })));
    const s = full(withFight(fighter('rogue', { 'sha-reaper': 1 }), {}, { hp: 2400 }));
    const cut = (a: GameState) => total(a, 'none', (after) => 2400 - (me(after).fight?.enemy.hp ?? 0), use('sha-reaper'));
    expect(cut(withFight(s, { dark: 1 }))).toBeGreaterThan(cut(s) * 1.5);
  });
  it('Fire Flask on a poisoned foe: the poison stings half again as hard while it burns', () => {
    const s = full(withFight(fighter('rogue', { 'alc-bomb': 1 }), {}, { poison: { rounds: 5, damage: 100 } }));
    const thrown = round(s, 'none', use('alc-bomb'));
    expect(me(thrown.state).fight!.enemy.burn!.kindles).toBeCloseTo(1.5);
    expect(thrown.events.some((e) => e.type === 'poisoned' && e.target === 'enemy' && !e.burn && e.damage === 150)).toBe(true);
    expect(thrown.events.some((e) => e.type === 'effect' && e.kind === 'reaction')).toBe(true);
  });
  it('Caustic Flask on a burning foe: the fire bursts at once, harder with Volatile', () => {
    const burst = (talents: Record<string, number>) => {
      const s = full(withFight(fighter('rogue', { 'caustic-flask': 1, ...talents }), {}, { burn: { rounds: 3, damage: 100 } }));
      const thrown = round(s, 'none', use('caustic-flask'));
      expect(me(thrown.state).fight!.enemy.burn).toBeNull();
      return (thrown.events.find((e) => e.type === 'countered') as unknown as { damage: number }).damage;
    };
    expect(burst({})).toBe(300);
    expect(burst({ 'alc-volatile': 3 })).toBe(435);
  });
  it('Plague Cloud on a foe under Caustic: the Caustic lasts as long as the cloud', () => {
    const s = full(withFight(fighter('rogue', { 'alc-plague': 1 }), {}, { sunder: { rounds: 2, mult: 1.25 } }));
    const e = me(round(s, 'none', use('alc-plague')).state).fight!.enemy;
    expect(e.sunder!.rounds).toBe(e.poison!.rounds);
  });
  it('Reagents and Lingering', () => {
    const poisoned = { poison: { rounds: 5, damage: 1 } };
    const meter = (talents: Record<string, number>) => me(round(full(withFight(fighter('rogue', { 'alc-bomb': 1, ...talents }), { meter: 0 }, poisoned)), 'none', use('alc-bomb')).state).fight!.meter;
    expect(meter({ 'alc-reagents': 3 })).toBe(meter({}) + 1);
    const lasts = (talents: Record<string, number>) => me(round(full(fighter('rogue', { 'caustic-flask': 1, ...talents })), 'none', use('caustic-flask')).state).fight!.enemy.sunder!.rounds;
    expect(lasts({ 'alc-linger': 2 })).toBe(lasts({}) + 2);
  });
  it('Fumes: a poisoned foe sometimes misses', () => {
    const misses = (s: GameState) => {
      let n = 0;
      for (let i = 0; i < 200; i++) n += round(s, 'none', { kind: 'attack' }, 'm' + i).events.filter((e) => e.type === 'missed' && e.by === 'enemy').length;
      return n;
    };
    const poisoned = { poison: { rounds: 5, damage: 1 } };
    expect(misses(withFight(fighter('rogue', { 'alc-fumes': 3 }), {}, poisoned))).toBeGreaterThan(5);
    expect(misses(withFight(fighter('rogue', {}), {}, poisoned))).toBe(0);
    expect(misses(fighter('rogue', { 'alc-fumes': 3 }))).toBe(0);
  });
  it('a save from before the new Rogue: the talents that went give their points back', () => {
    const s = newGame({ seed: 'talents', player: P, name: 'Robin', classId: 'rogue' });
    const c = { ...me(s), level: 20, abilities: { ...me(s).abilities, 'nin-hands': 3, 'alc-salve': 2, 'sha-sight': 2 } };
    const up = migrate(JSON.parse(JSON.stringify({ ...s, version: 47, characters: { [P]: c } })))!;
    expect(up.version).toBe(49);
    expect(me(up).abilities['nin-hands']).toBeUndefined();
    expect(me(up).abilities['alc-salve']).toBeUndefined();
    expect(me(up).abilities['sha-sight']).toBe(2);
  });

  // The Hunter (Robin, 2026-11-12): crits that bleed, pets that stay, traps that wait.
  const hunter = (talents: Record<string, number>) => full(fighter('ranger', talents));
  const wolf = { kind: 'wolf', name: 'Wolf', power: 0.45 };
  const owl = { kind: 'owl', name: 'Owl', power: 0.3, crit: 0.08 };
  const bite = { next: { name: 'Bite', power: 1, weight: 1 } };
  const by = (events: { type: string }[], name: string) => (events as { type: string; by?: string; move?: string; damage: number }[]).filter((e) => e.type === 'hit' && e.by === 'player' && e.move === name);
  const foe = (s: GameState) => me(s).fight!.enemy;
  it('Open Wound: a crit bleeds for a quarter of the hit over two rounds, and not without it', () => {
    const r = round(withFight(hunter({ 'ran-wound': 1 }), { sureCrit: 1 }), 'none');
    const crits = (r.events as { type: string; by?: string; crit?: boolean; damage: number }[]).filter((e) => e.type === 'hit' && e.by === 'player' && e.crit);
    const quarter = crits.reduce((sum, e) => sum + e.damage, 0) * 0.25;
    // One of its two rounds has stung already.
    expect(foe(r.state).bleed!.rounds).toBe(1);
    expect(Math.abs(foe(r.state).bleed!.damage - quarter / 2)).toBeLessThanOrEqual(crits.length);
    expect(r.events.some((e) => e.type === 'poisoned' && e.target === 'enemy' && e.bleed)).toBe(true);
    expect(foe(round(withFight(hunter({}), { sureCrit: 1 }), 'none').state).bleed ?? null).toBeNull();
  });
  it('a new bleed adds to the old one; Deep Cuts is stronger; Long Bleed a round longer', () => {
    const old = { bleed: { rounds: 2, damage: 500 } };
    const added = foe(round(withFight(hunter({ 'ran-wound': 1 }), { sureCrit: 1 }, old), 'none').state).bleed!;
    expect(added.damage).toBeGreaterThan(500);
    const sting = (talents: Record<string, number>) => foe(round(withFight(hunter({ 'ran-wound': 1, ...talents }), { sureCrit: 1 }), 'none', { kind: 'attack' }, 'one').state).bleed!;
    expect(sting({ 'ran-deep': 3 }).damage).toBeGreaterThan(sting({}).damage * 1.1);
    expect(sting({ 'ran-long': 1 }).rounds).toBe(2);
  });
  it('Steady Breath: a Brace makes the next arrow a sure crit', () => {
    expect(me(round(hunter({ 'ran-breath': 1 }), 'brace').state).fight!.sureCrit).toBe(1);
    expect(me(round(hunter({ 'ran-breath': 1 }), 'block').state).fight!.sureCrit).toBe(0);
    expect(me(round(hunter({}), 'brace').state).fight!.sureCrit).toBe(0);
  });
  it('Hamstrung: a bleeding foe hits weaker', () => {
    const bleeding = { bleed: { rounds: 9, damage: 1 }, ...bite };
    const hp = (a: GameState) => me(a).hp;
    expect(total(withFight(hunter({ 'ran-hamstrung': 3 }), { round: 2 }, bleeding), 'none', hp)).toBeGreaterThan(total(withFight(hunter({}), { round: 2 }, bleeding), 'none', hp));
    expect(total(withFight(hunter({ 'ran-hamstrung': 3 }), { round: 2 }, bite), 'none', hp)).toBe(total(withFight(hunter({}), { round: 2 }, bite), 'none', hp));
  });
  it('Rend bleeds for four rounds, with or without Open Wound; Bleed Dry lands all the bleeding at once, doubled', () => {
    const rent = foe(round(withFight(hunter({ 'ran-rend': 1 }), { meter: 2 }), 'none', use('ran-rend')).state).bleed!;
    expect(rent.rounds).toBe(3);
    const dry = round(withFight(hunter({ 'ran-bleed-dry': 1 }), {}, { bleed: { rounds: 3, damage: 100 } }), 'none', use('ran-bleed-dry'));
    expect(by(dry.events, 'Bleed Dry')[0]!.damage).toBe(600);
    expect(foe(dry.state).bleed ?? null).toBeNull();
  });
  it('a pet stays for the fight, strikes when the Hunter does damage, and a new one sends it away', () => {
    const s = hunter({ hawk: 1, 'bea-wolf': 1 });
    const called = round(s, 'none', use('hawk'));
    expect(me(called.state).fight!.pets!.map((x) => x.kind)).toEqual(['owl']);
    // It strikes as it arrives.
    expect(by(called.events, 'Owl')).toHaveLength(1);
    let after = called.state;
    for (let i = 0; i < 3; i++) after = round(after, 'block', { kind: 'attack' }, 'r' + i).state;
    expect(me(after).fight!.pets!.map((x) => x.kind)).toEqual(['owl']);
    expect(by(round(after, 'none').events, 'Owl')).toHaveLength(1);
    expect(me(round(after, 'none', use('bea-wolf')).state).fight!.pets!.map((x) => x.kind)).toEqual(['wolf']);
  });
  it('Pack of Two: two pets at once, and a third sends the oldest away', () => {
    const s = withFight(hunter({ hawk: 1, 'bea-wolf': 1, 'bea-bear': 1, 'bea-two': 1 }), { pets: [owl] });
    const two = round(s, 'none', use('bea-wolf')).state;
    expect(me(two).fight!.pets!.map((x) => x.kind)).toEqual(['owl', 'wolf']);
    expect(me(round(two, 'none', use('bea-bear')).state).fight!.pets!.map((x) => x.kind)).toEqual(['wolf', 'bear']);
    const both = round(two, 'none');
    expect(by(both.events, 'Owl')).toHaveLength(1);
    expect(by(both.events, 'Wolf')).toHaveLength(1);
  });
  it('a pet strikes for its share of a plain hit; Close Bond and a foe that takes more make it harder', () => {
    const bites = (s: GameState) => { let sum = 0; for (let i = 0; i < 40; i++) for (const e of by(round(s, 'none', { kind: 'attack' }, 'w' + i).events, 'Wolf')) sum += e.damage; return sum; };
    const plain = bites(withFight(hunter({}), { pets: [wolf] }));
    const shots = (() => { let sum = 0; for (let i = 0; i < 40; i++) for (const e of by(round(hunter({}), 'none', { kind: 'attack' }, 'w' + i).events, 'Attack')) sum += e.damage; return sum; })();
    expect(plain / shots).toBeGreaterThan(0.35);
    expect(plain / shots).toBeLessThan(0.55);
    expect(bites(withFight(hunter({ 'bea-bond': 3 }), { pets: [wolf] }))).toBeGreaterThan(plain * 1.2);
    expect(bites(withFight(hunter({}), { pets: [wolf] }, { sunder: { rounds: 3, mult: 1.5 } }))).toBeGreaterThan(plain * 1.3);
  });
  it('Hunting Pair: your own arrows hit harder with a pet out, and only then', () => {
    const arrows = (s: GameState) => { let sum = 0; for (let i = 0; i < 40; i++) for (const e of by(round(s, 'none', { kind: 'attack' }, 'a' + i).events, 'Attack')) sum += e.damage; return sum; };
    expect(arrows(withFight(hunter({ 'bea-pack': 3 }), { pets: [wolf] }))).toBeGreaterThan(arrows(withFight(hunter({}), { pets: [wolf] })));
    expect(arrows(hunter({ 'bea-pack': 3 }))).toBe(arrows(hunter({})));
  });
  it('the gifts: the bear takes part of each blow, the viper poisons and weakens, Well Fed makes a gift stronger', () => {
    const hp = (a: GameState) => me(a).hp;
    const bear = { kind: 'bear', name: 'Bear', power: 0.25, taken: 0.15 };
    const viper = { kind: 'viper', name: 'Viper', power: 0.2, weaken: 0.1, poison: 0.12 };
    const struck = (talents: Record<string, number>, pets: unknown[]) => total(withFight(hunter(talents), { round: 2, pets }, bite), 'none', hp);
    expect(struck({}, [bear])).toBeGreaterThan(struck({}, []));
    expect(struck({ 'bea-fed': 3 }, [bear])).toBeGreaterThan(struck({}, [bear]));
    expect(struck({}, [viper])).toBeGreaterThan(struck({}, []));
    expect(foe(round(withFight(hunter({}), { pets: [viper] }), 'none').state).poison).toBeTruthy();
  });
  it('Kill Command needs a pet, and its strike is far harder; Stoop: the pets strike twice; Stampede: twice for a while', () => {
    const s = withFight(hunter({ 'bea-kill': 1, 'bea-stoop': 1, 'bea-stampede': 1 }), { meter: 2 });
    expect(round(s, 'none', use('bea-kill')).events.some((e) => e.type === 'rejected')).toBe(true);
    const pack = withFight(s, { pets: [wolf] });
    const command = by(round(pack, 'none', use('bea-kill')).events, 'Wolf');
    expect(command).toHaveLength(1);
    expect(command[0]!.damage).toBeGreaterThan(by(round(pack, 'none').events, 'Wolf')[0]!.damage * 2);
    expect(by(round(pack, 'none', use('bea-stoop')).events, 'Wolf')).toHaveLength(2);
    const run = round(pack, 'none', use('bea-stampede'));
    expect(by(run.events, 'Wolf')).toHaveLength(2);
    expect(me(run.state).fight!.stampede).toBe(2);
    expect(by(round(run.state, 'none').events, 'Wolf')).toHaveLength(2);
  });
  it('a trap waits for an attack: not sprung in the first round or by a wind-up, sprung by the next blow', () => {
    const s = hunter({ 'spike-trap': 1 });
    const laid = round(s, 'none', use('spike-trap'));
    expect(me(laid.state).fight!.traps).toEqual([{ ability: 'spike-trap', rank: 1, age: 1 }]);
    const winding = round(withFight(s, { round: 2 }, { next: { name: 'Lunge', power: 2, weight: 1, charge: true } }), 'none', use('spike-trap'));
    expect(me(winding.state).fight!.traps).toHaveLength(1);
    const sprung = round(withFight(s, { round: 2 }, bite), 'none', use('spike-trap'));
    expect(me(sprung.state).fight!.traps).toHaveLength(0);
    expect(sprung.events.some((e) => e.type === 'effect' && e.kind === 'sprung')).toBe(true);
    expect((sprung.events.find((e) => e.type === 'countered') as unknown as { damage: number }).damage).toBe(Math.round(stats(me(s)).attack * 1.8));
  });
  it('one trap lies at a time, two with Second Trap, and each attack springs one', () => {
    const lunge = { charged: null, next: { name: 'Lunge', power: 2, weight: 1, charge: true } };
    const s = hunter({ 'spike-trap': 1, snare: 1 });
    const one = round(withFight(round(s, 'none', use('spike-trap')).state, {}, lunge), 'none', use('snare')).state;
    expect(me(one).fight!.traps!.map((x) => x.ability)).toEqual(['snare']);
    const t = hunter({ 'spike-trap': 1, snare: 1, 'tra-second': 1 });
    const two = round(withFight(round(t, 'none', use('spike-trap')).state, {}, lunge), 'none', use('snare')).state;
    expect(me(two).fight!.traps!.map((x) => x.ability)).toEqual(['spike-trap', 'snare']);
    const after = round(withFight(two, { round: 4 }, { charged: null, ...bite }), 'none').state;
    expect(me(after).fight!.traps!.map((x) => x.ability)).toEqual(['snare']);
  });
  it('Snare: the blow that springs it misses and the next are weaker; the Net costs it its next turn', () => {
    const s = withFight(hunter({ snare: 1, 'tra-net': 1 }), { round: 2 }, bite);
    const snared = round(s, 'none', use('snare'));
    expect(snared.events.some((e) => e.type === 'missed' && e.by === 'enemy')).toBe(true);
    expect(snared.events.some((e) => e.type === 'hit' && e.by === 'enemy')).toBe(false);
    expect(foe(snared.state).weakened).toMatchObject({ rounds: 2, mult: 0.75 });
    expect(me(round(s, 'none', use('tra-net')).state).fight!.skip).toBe(1);
  });
  it('Fire Pot burns and the Venom Trap poisons, and the foe takes more', () => {
    const s = withFight(hunter({ 'tra-mine': 1, 'tra-venom': 1 }), { round: 2 }, bite);
    expect(foe(round(s, 'none', use('tra-mine')).state).burn).toBeTruthy();
    const venom = foe(round(s, 'none', use('tra-venom')).state);
    expect(venom.poison!.rounds).toBe(4);
    expect(venom.sunder).toMatchObject({ rounds: 4, mult: 1.1 });
  });
  it('the passives: Cruel Traps, Cunning, Follow Up, Barbed, Patient, Prepared', () => {
    const sprung = (talents: Record<string, number>, round_ = 2) => round(withFight(hunter({ 'spike-trap': 1, ...talents }), { round: round_, meter: 0 }, bite), 'none', use('spike-trap'));
    const hit = (r: { events: { type: string }[] }) => (r.events.find((e) => e.type === 'countered') as unknown as { damage: number }).damage;
    expect(foe(sprung({ 'trapper-craft': 1 }).state).sunder).toMatchObject({ rounds: 2, mult: 1.15 });
    expect(me(sprung({ 'tra-aim': 1 }).state).fight!.meter).toBeGreaterThanOrEqual(1);
    expect(me(sprung({}).state).fight!.follow ?? 0).toBe(0);
    expect(me(sprung({ 'tra-follow': 3 }).state).fight!.follow).toBeCloseTo(0.3);
    expect(hit(sprung({ 'tra-wire': 3 }))).toBeGreaterThan(hit(sprung({})) * 1.15);
    // Patient: only a trap that has waited a round.
    expect(hit(sprung({ 'tra-patient': 3 }))).toBe(hit(sprung({})));
    const ready = fighter('ranger', { 'spike-trap': 2, 'tra-ready': 1, 'tra-patient': 3 });
    expect(me(ready).fight!.traps).toEqual([{ ability: 'spike-trap', rank: 2, age: 0 }]);
    const waited = round(round(ready, 'none').state, 'none');
    const plain = round(withFight(fighter('ranger', { 'spike-trap': 2 }), { round: 2, traps: [{ ability: 'spike-trap', rank: 2, age: 0 }] }, bite), 'none');
    expect(hit(waited)).toBeGreaterThan(hit(plain) * 1.25);
  });
  it('Master of Snares lays every trap known at once', () => {
    const s = hunter({ 'spike-trap': 1, snare: 1, 'tra-mine': 1, 'tra-master': 1 });
    expect(me(round(s, 'none', use('tra-master')).state).fight!.traps!.map((x) => x.ability).sort()).toEqual(['snare', 'spike-trap', 'tra-mine']);
  });
  it('a save from before the new Hunter: the talents that went give their points back', () => {
    const s = newGame({ seed: 'talents', player: P, name: 'Robin', classId: 'ranger' });
    const c = { ...me(s), level: 20, abilities: { ...me(s).abilities, 'quick-reflex': 3, 'great-owl': 2, hawk: 2 } };
    const up = migrate(JSON.parse(JSON.stringify({ ...s, version: 48, characters: { [P]: c } })))!;
    expect(up.version).toBe(49);
    expect(me(up).abilities['quick-reflex']).toBeUndefined();
    expect(me(up).abilities['great-owl']).toBeUndefined();
    expect(me(up).abilities.hawk).toBe(2);
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
