// The class kits (Robin, 2026-10-31: abilities that make the classes feel different and exciting): the meters, the
// abilities that spend them, and the pick of one ability in two at a level.
import { describe, expect, it } from 'vitest';
import { ABILITIES, PROGRESSION } from '../src/data.ts';
import { pickOptions, startFight } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { makeRng } from '../src/rng.ts';
import type { Action, Character, ClassId, Enemy, EnemyMove, FightMove, GameEvent, GameState, Guard } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const turn = (move: FightMove, guard: Guard = 'none', id = 'f1'): Action => ({ type: 'fight', id, player: P, move, guard });
const attack: FightMove = { kind: 'attack' };
const ability = (a: string): FightMove => ({ kind: 'ability', ability: a });
const me = (s: GameState): Character => s.characters[P]!;
const fight = (s: GameState) => me(s).fight!;
const types = (events: GameEvent[]): string[] => events.map((e) => e.type);
const hits = (events: GameEvent[], by: 'player' | 'enemy') => events.filter((e): e is Extract<GameEvent, { type: 'hit' }> => e.type === 'hit' && e.by === by);

/** A character of the class squared up to the enemy on the ring's wilds, with the fight and the enemy patched by hand. */
function versus(classId: ClassId, enemy: string, patch: Partial<Character> = {}, enemyPatch: Partial<Enemy> = {}, fightPatch: Partial<Character['fight'] & object> = {}): GameState {
  const s = newGame({ seed: 'kit', player: P, name: 'Robin', classId, board: ringBoard() });
  const c = startFight({ ...me(s), space: 's1', ...patch }, enemy, 's1', false);
  c.fight = { ...c.fight!, ...fightPatch, enemy: { ...c.fight!.enemy, ...enemyPatch } };
  return { ...s, characters: { [P]: c } };
}
const bite: EnemyMove = { name: 'Bite', power: 1, weight: 1 };

describe('the meters', () => {
  it('Valor builds from blows taken, two from a wound-up one, up to the cap, and shows as a meter event', () => {
    const w = versus('warrior', 'slime', {}, { hp: 1000, next: bite });
    const r = apply(w, turn(attack), makeRng('a'), NOW);
    expect(fight(r.state).meter).toBe(1);
    expect(r.events.find((e) => e.type === 'meter')).toMatchObject({ name: 'Valor', value: 1, max: PROGRESSION.meterMax });
    const heavy = apply(versus('warrior', 'slime', {}, { hp: 1000, charged: 'Howl', next: bite }), turn(attack), makeRng('a'), NOW);
    expect(fight(heavy.state).meter).toBe(2);
    const full = apply(versus('warrior', 'slime', {}, { hp: 1000, next: bite }, { meter: 5 }), turn(attack), makeRng('a'), NOW);
    expect(fight(full.state).meter).toBe(5);
    expect(full.events.some((e) => e.type === 'meter')).toBe(false);
  });

  it('Mischief builds from hits landed; Arcana a point a round; Aim from blows that miss and crits', () => {
    const rogue = apply(versus('rogue', 'slime', {}, { hp: 1000, next: bite }), turn(attack), makeRng('a'), NOW);
    expect(rogue.events.find((e) => e.type === 'meter')).toMatchObject({ name: 'Mischief', value: 1 });
    const mage = apply(versus('mage', 'slime', {}, { hp: 1000, next: bite }), turn(attack), makeRng('a'), NOW);
    expect(mage.events.find((e) => e.type === 'meter')).toMatchObject({ name: 'Arcana', value: 1 });
    const dodged = apply(versus('ranger', 'slime', {}, { hp: 1000, next: bite }, { evade: 1, round: 2 }), turn(attack), makeRng('a'), NOW);
    expect(dodged.events.find((e) => e.type === 'missed' && e.by === 'enemy')).toBeDefined();
    expect(dodged.events.find((e) => e.type === 'meter')).toMatchObject({ name: 'Aim', value: 1 });
    const crit = apply(versus('ranger', 'slime', {}, { hp: 1000, next: bite }, { sureCrit: 1, round: 2 }), turn(attack), makeRng('a'), NOW);
    expect(hits(crit.events, 'player')[0]?.crit).toBe(true);
    expect(crit.events.filter((e) => e.type === 'meter').length).toBeGreaterThanOrEqual(1);
  });
});

describe("the Knight's kit", () => {
  it('Finishing Flourish spends 3 Valor for a hard hit, far harder on a foe under a third; short of Valor it is refused', () => {
    const ready = versus('warrior', 'slime', { abilities: { execute: 1 } }, { hp: 1000, maxHp: 1000, next: bite }, { meter: 3 });
    const r = apply(ready, turn(ability('execute')), makeRng('x'), NOW);
    const hit = hits(r.events, 'player')[0]!;
    expect(hit.move).toBe('Finishing Flourish');
    expect(hit.damage).toBeGreaterThanOrEqual(14); // 12 × 1.4 less 1, swung
    expect(hit.damage).toBeLessThanOrEqual(19);
    expect(r.events[0]).toMatchObject({ type: 'meter', value: 0 });
    expect(fight(r.state).meter).toBe(1); // spent to 0, then the enemy's blow landed: Valor 1
    const low = versus('warrior', 'slime', { abilities: { execute: 1 } }, { hp: 200, maxHp: 1000, next: bite }, { meter: 3 });
    const finisher = hits(apply(low, turn(ability('execute')), makeRng('x'), NOW).events, 'player')[0]!;
    expect(finisher.damage).toBeGreaterThanOrEqual(31); // 12 × 2.8 less 1, swung
    const short = versus('warrior', 'slime', { abilities: { execute: 1 } }, { hp: 1000 }, { meter: 2 });
    expect(apply(short, turn(ability('execute')), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough meter' });
  });

  it('Second Wind spends 3 Valor to heal an eighth and hit harder; Castle Stance raises a barrier worth a fifth of max HP', () => {
    const hurt = versus('warrior', 'slime', { abilities: { rally: 1, 'shield-wall': 1 }, hp: 50 }, { hp: 1000, next: bite }, { meter: 3 });
    const r = apply(hurt, turn(ability('rally')), makeRng('x'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'healed', amount: 14, hp: 64 }));
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'effect', kind: 'attackUp', rounds: 2 }));
    expect(r.events[1]).toMatchObject({ type: 'meter', value: 0 }); // the mana first, then the Valor spent
    const wall = apply(versus('warrior', 'slime', { abilities: { 'shield-wall': 1 } }, { hp: 1000, next: bite }), turn(ability('shield-wall')), makeRng('x'), NOW);
    expect(wall.events).toContainEqual(expect.objectContaining({ type: 'effect', kind: 'barrier', rounds: 24 }));
    expect(hits(wall.events, 'enemy')[0]?.absorbed).toBeGreaterThan(0);
  });
});

describe("the Trickster's kit", () => {
  it('Grand Finale spends all the Mischief and grows with it; Puff of Smoke makes the next blow miss and the next hit a sure crit', () => {
    const r = apply(versus('rogue', 'slime', { abilities: { eviscerate: 1 } }, { hp: 1000, next: bite }, { meter: 3 }), turn(ability('eviscerate')), makeRng('x'), NOW);
    const hit = hits(r.events, 'player')[0]!;
    expect(hit.damage).toBeGreaterThanOrEqual(14); // 9 × (0.6 + 3 × 0.45) less 1, swung
    expect(fight(r.state).meter).toBe(1); // spent to 0, then the hit landed: Mischief 1
    expect(apply(versus('rogue', 'slime', { abilities: { eviscerate: 1 } }, { hp: 1000 }, { meter: 0 }), turn(ability('eviscerate')), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough meter' });
    const smoke = apply(versus('rogue', 'slime', { abilities: { 'smoke-bomb': 1 } }, { hp: 1000, next: bite }, { meter: 3 }), turn(ability('smoke-bomb')), makeRng('x'), NOW);
    expect(types(smoke.events)).toContain('missed');
    expect(fight(smoke.state).sureCrit).toBe(1);
    const next = apply(smoke.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(hits(next.events, 'player')[0]?.crit).toBe(true);
    expect(fight(next.state).sureCrit).toBe(0);
  });

  it('Sticky Fingers lifts a share of the enemy\'s purse, once a fight', () => {
    const r = apply(versus('rogue', 'slime', { abilities: { pickpocket: 1 }, gold: 10 }, { hp: 1000, next: bite }), turn(ability('pickpocket')), makeRng('x'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'stolen', gold: 3, total: 13 }));
    expect(fight(r.state).used).toContain('pickpocket');
    expect(apply(r.state, turn(ability('pickpocket'), 'none', 'f2'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'already used' });
  });
});

describe("the Wizard's kit", () => {
  it('Pocket Watch spends 4 Arcana and the enemy loses its turn, boss or not; Falling Star lands two rounds later, whatever is done meanwhile', () => {
    const warp = apply(versus('mage', 'thornwood-warden', { abilities: { 'time-warp': 1 } }, { hp: 5000, next: bite }, { meter: 4 }), turn(ability('time-warp')), makeRng('x'), NOW);
    expect(warp.events).toContainEqual(expect.objectContaining({ type: 'effect', kind: 'skip', rounds: 1 }));
    expect(warp.events).toContainEqual(expect.objectContaining({ type: 'skipped', reason: 'warped' }));
    expect(hits(warp.events, 'enemy')).toHaveLength(0);
    const called = apply(versus('mage', 'slime', { abilities: { meteor: 1 } }, { hp: 5000, next: bite }), turn(ability('meteor')), makeRng('x'), NOW);
    expect(called.events).toContainEqual(expect.objectContaining({ type: 'effect', kind: 'windup', rounds: 2 }));
    expect(hits(called.events, 'player')).toHaveLength(0);
    expect(fight(called.state).windup).toMatchObject({ name: 'Falling Star', rounds: 2 });
    const waiting = apply(called.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(hits(waiting.events, 'player').map((h) => h.move)).toEqual(['Attack']);
    const landing = apply(waiting.state, turn(attack, 'none', 'f3'), makeRng('x'), NOW);
    const moves = hits(landing.events, 'player').map((h) => h.move);
    expect(moves).toEqual(['Falling Star', 'Attack']);
    expect(hits(landing.events, 'player')[0]!.damage).toBeGreaterThanOrEqual(53); // 14 × 4 less 1, swung
    expect(fight(landing.state).windup).toBeNull();
  });

  it('Moonlight Veil turns all the mana into a barrier', () => {
    const r = apply(versus('mage', 'slime', { abilities: { 'mana-shield': 1 } }, { hp: 1000, next: bite }), turn(ability('mana-shield')), makeRng('x'), NOW);
    expect(r.events[0]).toMatchObject({ type: 'mana', delta: -40, mana: 0 });
    expect(r.events[1]).toMatchObject({ type: 'effect', kind: 'barrier', rounds: 60 });
  });
});

describe("the Archer's kit", () => {
  it('Tripwire makes the next wind-up fail; Owl Friend strikes at the end of every round; Painted Target makes the next hits land harder', () => {
    const trapped = apply(versus('ranger', 'wolf-alpha', { abilities: { trap: 1 } }, { hp: 5000, next: { name: 'Howl', power: 2, weight: 1, charge: true } }, { round: 2 }), turn(ability('trap')), makeRng('x'), NOW);
    expect(trapped.events).toContainEqual(expect.objectContaining({ type: 'skipped', reason: 'trapped' }));
    expect(fight(trapped.state).enemy.charged).toBeNull();
    expect(fight(trapped.state).trap).toBe(0);
    const hawk = apply(versus('ranger', 'slime', { abilities: { hawk: 1 } }, { hp: 5000, next: bite }, { meter: 2, round: 2 }), turn(ability('hawk')), makeRng('x'), NOW);
    expect(hits(hawk.events, 'player').map((h) => h.move)).toEqual(['Owl Friend']);
    expect(fight(hawk.state).companion).toMatchObject({ name: 'Owl Friend', rounds: 2 });
    const marked = apply(versus('ranger', 'slime', { abilities: { mark: 1 } }, { hp: 5000, next: bite }, { round: 2 }), turn(ability('mark')), makeRng('x'), NOW);
    expect(fight(marked.state).mark).toEqual({ hits: 3, mult: 1.3 });
    const swing = apply(marked.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(hits(swing.events, 'player')[0]!.damage).toBeGreaterThanOrEqual(7); // 8 × 1.3 less 1, swung
    expect(fight(swing.state).mark).toEqual({ hits: 2, mult: 1.3 });
  });
});

describe('the pick of one ability in two', () => {
  it('offers two unknown abilities of the class, then ones with a rank to gain, then nothing', () => {
    const s = newGame({ seed: 'pick', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
    const two = pickOptions(me(s), makeRng('p'));
    expect(two).toHaveLength(2);
    for (const a of two) {
      expect(ABILITIES[a]!.classId).toBe('warrior');
      expect(me(s).abilities[a]).toBeUndefined();
    }
    const warrior = Object.keys(ABILITIES).filter((a) => ABILITIES[a]!.classId === 'warrior');
    const known = { ...me(s), abilities: Object.fromEntries(warrior.map((a) => [a, 1])) };
    expect(pickOptions(known, makeRng('p'))).toHaveLength(2);
    const master = { ...me(s), abilities: Object.fromEntries(warrior.map((a) => [a, 3])) };
    expect(pickOptions(master, makeRng('p'))).toEqual([]);
  });

  it('is asked when a fight ends past a pick level, answered with pick, and takes no gamble answer', () => {
    const xp = PROGRESSION.xpForLevel[3]! - 1; // one short of level 4
    const s = versus('warrior', 'slime', { xp, level: 3 }, { hp: 1 });
    const won = apply(s, turn(attack), makeRng('x'), NOW);
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'levelled', level: 4 }));
    const options = me(won.state).picks[0]!;
    expect(options).toHaveLength(2);
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'pickOwed', options, level: 4 }));
    expect(apply(won.state, { type: 'roll', id: 'r', player: P }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'answer first' });
    expect(apply(won.state, { type: 'gamble', id: 'g', player: P, choice: 'high' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'nothing to answer' });
    expect(apply(won.state, { type: 'pick', id: 'p', player: P, ability: 'fireball' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such ability' });
    const chosen = options[1]!;
    const picked = apply(won.state, { type: 'pick', id: 'p', player: P, ability: chosen }, makeRng('x'), NOW);
    expect(picked.events[0]).toEqual({ type: 'picked', action: 'p', player: P, ability: chosen, rank: 1 });
    expect(me(picked.state).abilities[chosen]).toBe(1);
    expect(me(picked.state).picks).toEqual([]);
    expect(apply(picked.state, { type: 'pick', id: 'p2', player: P, ability: chosen }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'nothing to answer' });
  });
});
