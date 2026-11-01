import { describe, expect, it } from 'vitest';
import { makeEnemy, startFight } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { plainGear } from '../src/gear.ts';
import { makeRng, type Rng } from '../src/rng.ts';
import type { Action, Character, ClassId, Enemy, FightMove, GameEvent, GameState, Guard } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const turn = (move: FightMove, guard: Guard = 'none', id = 'f1'): Action => ({ type: 'fight', id, player: P, move, guard });
const attack: FightMove = { kind: 'attack' };
const ability = (a: string): FightMove => ({ kind: 'ability', ability: a });
const me = (s: GameState): Character => s.characters[P]!;
type Brief = GameEvent extends infer E ? (E extends GameEvent ? Omit<E, 'action' | 'player'> : never) : never;
const brief = (e: GameEvent): Brief => {
  const { action: _a, player: _p, ...rest } = e;
  return rest;
};
/** The meter and the intent are bookkeeping every round carries; the pins below read the blows without them (they have their own tests). */
const blows = (e: GameEvent): boolean => e.type !== 'meter' && e.type !== 'intent';
const types = (events: GameEvent[]): string[] => events.filter(blows).map((e) => e.type);

/**
 * A character of `classId` on the ring's start with one step owed, walked onto s1 (the wilds) with the seed's stream:
 * for the seed ashford that is a Slime. The rounds then play from a fresh stream of the same seed.
 */
function begin(classId: ClassId, seed = 'ashford', patch: Partial<Character> = {}): { state: GameState; rng: Rng } {
  const s = newGame({ seed, player: P, name: 'Robin', classId, board: ringBoard() });
  const ready = { ...s, characters: { [P]: { ...me(s), steps: 1, ...patch } }, die: { ...s.die, last: 1 } };
  const state = apply(ready, { type: 'move', id: 'm', player: P, path: ['s1'] }, makeRng(seed), NOW).state;
  return { state, rng: makeRng(seed) };
}

/** A fight against a chosen enemy, set by hand, for the tests that need a particular foe or a near-dead one. */
function versus(classId: ClassId, enemy: string, patch: Partial<Character> = {}, enemyPatch: Partial<Enemy> = {}, space = 's1', spawn = false, world = false): GameState {
  const s = world ? newGame({ seed: 'w', player: P, name: 'Robin', classId }) : newGame({ seed: 'x', player: P, name: 'Robin', classId, board: ringBoard() });
  const c = startFight({ ...me(s), space, ...patch }, enemy, space, spawn);
  c.fight!.enemy = { ...c.fight!.enemy, ...enemyPatch };
  return { ...s, characters: { [P]: c } };
}

/** Play the plan round after round until the fight ends, collecting every round's events, stripped. */
function playOut(state: GameState, rng: Rng, plan: [FightMove, Guard][], max = 30): { state: GameState; rounds: Brief[][] } {
  const rounds: Brief[][] = [];
  for (let i = 0; i < max && me(state).fight; i++) {
    const [move, guard] = plan[i % plan.length]!;
    const r = apply(state, turn(move, guard, `f${i}`), rng, NOW);
    state = r.state;
    rounds.push(r.events.filter(blows).map(brief));
  }
  return { state, rounds };
}

describe('a fight', () => {
  it('begins on a wild spot against the area\'s creature drawn from the seed: a Slime for the seed ashford, on s1', () => {
    const { state } = begin('warrior');
    expect(me(state).fight).toEqual({
      enemy: { id: 'slime', name: 'Slime', level: 1, role: 'mob', hp: 40, maxHp: 40, attack: 10, defense: 2, xp: 5, gold: 6, moves: [{ name: 'Splat', power: 1, weight: 1 }], charged: null, stunned: 0, weakened: null, poison: null, next: { name: 'Splat', power: 1, weight: 1 }, armoured: null, evade: 0, phase: 1, phase2: null },
      round: 1,
      charged: false,
      attackUp: null,
      barrier: 0,
      evade: 0,
      space: 's1',
      spawn: false,
      meter: 0,
      strikes: 0,
      sureCrit: 0,
      windup: null,
      companion: null,
      mark: null,
      trap: 0,
      skip: 0,
      poisoned: null,
      weak: null,
      used: [],
    });
    expect(makeEnemy('briar-king')).toMatchObject({ role: 'boss', level: 10, hp: 935 });
    expect(() => makeEnemy('dragon')).toThrow(/no such enemy/);
  });

  it('plays the same way from the same seed, and never changes the state it was given', () => {
    const a = begin('warrior');
    const b = begin('warrior');
    const snapshot = structuredClone(a.state);
    const ra = apply(a.state, turn(attack, 'block'), a.rng, NOW);
    const rb = apply(b.state, turn(attack, 'block'), b.rng, NOW);
    expect(ra).toEqual(rb);
    expect(a.state).toEqual(snapshot);
    expect(ra.state).not.toBe(a.state);
    expect(ra.state.characters[P]!.fight!.enemy).not.toBe(a.state.characters[P]!.fight!.enemy);
  });

  it('Warrior, Attack and Block: a hit is attack less half the defense swung two either way; a block halves the blow', () => {
    const { state, rng } = begin('warrior');
    const { state: end, rounds } = playOut(state, rng, [[attack, 'block']]);
    expect(rounds).toEqual([
      [
        { type: 'hit', by: 'player', move: 'Attack', damage: 20, crit: true, hp: 20, absorbed: 0 },
        { type: 'guarded', guard: 'block' },
        { type: 'hit', by: 'enemy', move: 'Splat', damage: 4, crit: false, hp: 116, absorbed: 0 },
      ],
      [
        { type: 'hit', by: 'player', move: 'Attack', damage: 13, crit: false, hp: 7, absorbed: 0 },
        { type: 'guarded', guard: 'block' },
        { type: 'hit', by: 'enemy', move: 'Splat', damage: 3, crit: false, hp: 113, absorbed: 0 },
      ],
      [
        { type: 'hit', by: 'player', move: 'Attack', damage: 10, crit: false, hp: 0, absorbed: 0 },
        { type: 'won', xp: 5, gold: 6 },
      ],
    ]);
    expect(me(end)).toMatchObject({ hp: 113, mana: 20, gold: 56, xp: 5, level: 1, fight: null, space: 's1' });
  });

  it('Charge, then Heavy Blow: the charge doubles the next hit and is spent; a failed dodge takes the blow in full', () => {
    const { state, rng } = begin('warrior');
    const { rounds } = playOut(state, rng, [[{ kind: 'charge' }, 'dodge'], [ability('heavy-blow'), 'brace']]);
    expect(rounds.slice(0, 2)).toEqual([
      [
        { type: 'charged', by: 'player', move: 'Charge' },
        { type: 'guarded', guard: 'dodge' },
        { type: 'hit', by: 'enemy', move: 'Splat', damage: 10, crit: true, hp: 110, absorbed: 0 },
      ],
      [
        { type: 'mana', delta: -4, mana: 16 },
        { type: 'hit', by: 'player', move: 'Heavy Blow', damage: 39, crit: false, hp: 1, absorbed: 0 },
        { type: 'guarded', guard: 'brace' },
        { type: 'mana', delta: 4, mana: 20 },
        { type: 'hit', by: 'enemy', move: 'Splat', damage: 6, crit: false, hp: 104, absorbed: 0 },
      ],
    ]);
    expect(rounds[3]).toEqual([
      { type: 'mana', delta: -4, mana: 16 },
      { type: 'hit', by: 'player', move: 'Heavy Blow', damage: 36, crit: false, hp: 0, absorbed: 0 },
      { type: 'won', xp: 5, gold: 6 },
    ]);
    // Charging twice in a row is refused; the charge waits for a hit.
    const charged = apply(state, turn({ kind: 'charge' }), makeRng('x'), NOW).state;
    expect(me(charged).fight!.charged).toBe(true);
    expect(apply(charged, turn({ kind: 'charge' }, 'none', 'f2'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    const tough = versus('warrior', 'slime', {}, { hp: 500 });
    const after = apply(apply(tough, turn({ kind: 'charge' }), makeRng('c'), NOW).state, turn(attack, 'none', 'f2'), makeRng('c'), NOW);
    const hit = after.events[0];
    expect(hit).toMatchObject({ type: 'hit', by: 'player' });
    if (hit?.type === 'hit') expect(hit.damage).toBeGreaterThanOrEqual(18); // (11 - 2) times 2 at the least
    expect(me(after.state).fight!.charged).toBe(false);
  });

  it('Rogue, Poison Blade and Counter: the cut poisons for three rounds; a counter takes the blow and strikes back', () => {
    const { state, rng } = begin('rogue');
    const { state: end, rounds } = playOut(state, rng, [[ability('poison-blade'), 'counter'], [attack, 'counter']]);
    expect(rounds[0]).toEqual([
      { type: 'mana', delta: -5, mana: 20 },
      { type: 'hit', by: 'player', move: 'Poison Blade', damage: 10, crit: true, hp: 30, absorbed: 0 },
      { type: 'effect', target: 'enemy', kind: 'poison', rounds: 3 },
      { type: 'poisoned', target: 'enemy', damage: 5, hp: 25 },
      { type: 'guarded', guard: 'counter' },
      { type: 'hit', by: 'enemy', move: 'Splat', damage: 8, crit: false, hp: 92, absorbed: 0 },
      { type: 'countered', damage: 6, hp: 19 },
      { type: 'mana', delta: 2, mana: 22 },
    ]);
    expect(rounds[1]).toEqual([
      { type: 'hit', by: 'player', move: 'Attack', damage: 8, crit: false, hp: 11, absorbed: 0 },
      { type: 'poisoned', target: 'enemy', damage: 5, hp: 6 },
      { type: 'guarded', guard: 'counter' },
      { type: 'hit', by: 'enemy', move: 'Splat', damage: 7, crit: false, hp: 85, absorbed: 0 },
      { type: 'countered', damage: 3, hp: 3 },
      { type: 'mana', delta: 2, mana: 24 },
    ]);
    expect(rounds[2]).toContainEqual({ type: 'won', xp: 5, gold: 6 });
    expect(me(end)).toMatchObject({ hp: 85, mana: 19, gold: 66, xp: 5 });
  });

  it('Mage, Frost Bolt and Fireball: a chill that weakens the enemy, then a huge hit; mana trickles back each round', () => {
    const { state, rng } = begin('mage');
    const { state: end, rounds } = playOut(state, rng, [[ability('frost-bolt'), 'none'], [ability('fireball'), 'none']]);
    expect(rounds).toEqual([
      [
        { type: 'mana', delta: -6, mana: 34 },
        { type: 'hit', by: 'player', move: 'Frost Bolt', damage: 26, crit: true, hp: 14, absorbed: 0 },
        { type: 'effect', target: 'enemy', kind: 'weakened', rounds: 2 },
        { type: 'hit', by: 'enemy', move: 'Splat', damage: 6, crit: false, hp: 79, absorbed: 0 },
        { type: 'mana', delta: 2, mana: 36 },
      ],
      [
        { type: 'mana', delta: -8, mana: 28 },
        { type: 'hit', by: 'player', move: 'Fireball', damage: 29, crit: false, hp: 0, absorbed: 0 },
        { type: 'won', xp: 5, gold: 6 },
      ],
    ]);
    expect(me(end)).toMatchObject({ hp: 79, mana: 28, fight: null });
  });

  it('Ranger, Volley: three arrows, and the enemy does not strike back in the first round', () => {
    const { state, rng } = begin('ranger');
    const { state: end, rounds } = playOut(state, rng, [[ability('volley'), 'block']]);
    expect(rounds.slice(0, 2)).toEqual([
      [
        { type: 'mana', delta: -5, mana: 20 },
        { type: 'hit', by: 'player', move: 'Volley', damage: 8, crit: true, hp: 32, absorbed: 0 },
        { type: 'hit', by: 'player', move: 'Volley', damage: 6, crit: false, hp: 26, absorbed: 0 },
        { type: 'hit', by: 'player', move: 'Volley', damage: 7, crit: false, hp: 19, absorbed: 0 },
        { type: 'mana', delta: 2, mana: 22 },
      ],
      [
        { type: 'mana', delta: -5, mana: 17 },
        { type: 'hit', by: 'player', move: 'Volley', damage: 5, crit: false, hp: 14, absorbed: 0 },
        { type: 'hit', by: 'player', move: 'Volley', damage: 5, crit: false, hp: 9, absorbed: 0 },
        { type: 'hit', by: 'player', move: 'Volley', damage: 4, crit: false, hp: 5, absorbed: 0 },
        { type: 'guarded', guard: 'block' },
        { type: 'hit', by: 'enemy', move: 'Splat', damage: 3, crit: false, hp: 97, absorbed: 0 },
        { type: 'mana', delta: 2, mana: 19 },
      ],
    ]);
    expect(rounds[2]!.slice(0, 3)).toEqual([
      { type: 'mana', delta: -5, mana: 14 },
      { type: 'hit', by: 'player', move: 'Volley', damage: 7, crit: false, hp: 0, absorbed: 0 },
      { type: 'won', xp: 5, gold: 6 },
    ]);
    expect(me(end).hp).toBe(97);
    // Other classes take the first blow at once.
    const w = begin('warrior');
    expect(types(apply(w.state, turn(attack), w.rng, NOW).events)).toEqual(['hit', 'hit']);
  });

  it('Shield Bash stuns: the enemy loses its next turn', () => {
    const { state, rng } = begin('warrior');
    const { rounds } = playOut(state, rng, [[ability('shield-bash'), 'none']]);
    expect(rounds[0]).toEqual([
      { type: 'mana', delta: -6, mana: 14 },
      { type: 'hit', by: 'player', move: 'Shield Bash', damage: 16, crit: true, hp: 24, absorbed: 0 },
      { type: 'effect', target: 'enemy', kind: 'stunned', rounds: 1 },
      { type: 'skipped', by: 'enemy', reason: 'stunned' },
      { type: 'mana', delta: 2, mana: 16 },
    ]);
    expect(rounds[1]![3]).toEqual({ type: 'skipped', by: 'enemy', reason: 'stunned' });
    expect(rounds.at(-1)!.at(-1)).toEqual({ type: 'won', xp: 5, gold: 6 });
    // A boss shrugs a stun off.
    const boss = versus('warrior', 'thornwood-warden', { mana: 20 });
    const bashed = apply(boss, turn(ability('shield-bash'), 'block'), makeRng('x'), NOW);
    expect(bashed.events.find((e) => e.type === 'resisted')).toEqual({ type: 'resisted', action: 'f1', player: P, kind: 'stunned' });
    expect(bashed.events.find((e) => e.type === 'skipped')).toBeUndefined();
    expect(me(bashed.state).fight!.enemy.stunned).toBe(0);
  });

  it('a potion is the round: it heals, then the enemy strikes; none left is refused', () => {
    const { state, rng } = begin('warrior', 'ashford', { hp: 40, items: { potion: 1 } });
    const { rounds } = playOut(state, rng, [[{ kind: 'item', item: 'potion' }, 'block'], [attack, 'block']]);
    expect(rounds[0]).toEqual([
      { type: 'used', item: 'potion' },
      { type: 'healed', amount: 48, hp: 88 },
      { type: 'guarded', guard: 'block' },
      { type: 'hit', by: 'enemy', move: 'Splat', damage: 5, crit: true, hp: 83, absorbed: 0 },
    ]);
    expect(rounds[2]).toEqual([{ type: 'rejected', reason: 'none left' }]);
    expect(apply(state, turn({ kind: 'item', item: 'reroll' }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'none left' });
    expect(apply(state, turn({ kind: 'item', item: 'wand' }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
    const card = versus('warrior', 'slime', { items: { reroll: 1 } });
    expect(apply(card, turn({ kind: 'item', item: 'reroll' }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
  });

  it('the guards: block halves, brace takes three quarters and gives mana, dodge misses a third of the time, counter strikes back', () => {
    const tough = versus('warrior', 'slime', { mana: 10 }, { hp: 1000 });
    let misses = 0;
    for (let i = 0; i < 200; i++) {
      const seed = `guard-${i}`;
      const none = apply(tough, turn(attack, 'none'), makeRng(seed), NOW).events.find((e) => e.type === 'hit' && e.by === 'enemy');
      const block = apply(tough, turn(attack, 'block'), makeRng(seed), NOW).events.find((e) => e.type === 'hit' && e.by === 'enemy');
      const brace = apply(tough, turn(attack, 'brace'), makeRng(seed), NOW);
      const braced = brace.events.find((e) => e.type === 'hit' && e.by === 'enemy');
      const counter = apply(tough, turn(attack, 'counter'), makeRng(seed), NOW).events;
      if (none?.type === 'hit' && block?.type === 'hit' && braced?.type === 'hit') {
        expect(block.damage).toBe(Math.ceil(none.damage / 2));
        expect(braced.damage).toBe(Math.ceil(none.damage * 0.75));
      }
      expect(brace.events.find((e) => e.type === 'mana')).toMatchObject({ delta: 4, mana: 14 });
      expect(counter.find((e) => e.type === 'countered')).toBeDefined();
      const dodge = apply(tough, turn(attack, 'dodge'), makeRng(seed), NOW).events;
      if (dodge.some((e) => e.type === 'missed')) misses++;
    }
    expect(misses).toBeGreaterThan(45);
    expect(misses).toBeLessThan(95);
  });

  it('Shadowstep makes the next blows miss; Arcane Shield soaks a blow; War Cry lifts the next hits', () => {
    const rogue = versus('rogue', 'slime', { abilities: { backstab: 1, shadowstep: 1 } }, { hp: 1000 });
    const slipped = apply(rogue, turn(ability('shadowstep'), 'none'), makeRng('x'), NOW);
    expect(types(slipped.events)).toEqual(['mana', 'effect', 'missed', 'mana']);
    expect(me(slipped.state).fight!.evade).toBe(1);
    const next = apply(slipped.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(types(next.events)).toEqual(['hit', 'missed', 'mana']);
    expect(me(next.state).fight!.evade).toBe(0);

    const mage = versus('mage', 'slime', { abilities: { fireball: 1, 'arcane-shield': 1 } }, { hp: 1000 });
    const shielded = apply(mage, turn(ability('arcane-shield'), 'none'), makeRng('x'), NOW);
    expect(shielded.events[1]).toMatchObject({ type: 'effect', kind: 'barrier', rounds: 26 }); // three tenths of 85 HP
    const soaked = shielded.events.find((e) => e.type === 'hit' && e.by === 'enemy');
    expect(soaked).toMatchObject({ damage: 0, hp: 85 });
    if (soaked?.type === 'hit') expect(soaked.absorbed).toBeGreaterThan(0);
    expect(me(shielded.state).fight!.barrier).toBeLessThan(30);

    const warrior = versus('warrior', 'slime', { abilities: { 'heavy-blow': 1, 'war-cry': 1 } }, { hp: 1000 });
    const roared = apply(warrior, turn(ability('war-cry'), 'none'), makeRng('x'), NOW);
    expect(roared.events[1]).toMatchObject({ type: 'effect', kind: 'attackUp', rounds: 3 });
    expect(me(roared.state).fight!.attackUp).toEqual({ rounds: 2, mult: 1.3 });
    const swing = apply(roared.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW).events[0];
    if (swing?.type === 'hit') expect(swing.damage).toBeGreaterThanOrEqual(13);
  });

  it('abilities need mana and must be known', () => {
    const dry = versus('mage', 'slime', { mana: 3 });
    expect(apply(dry, turn(ability('fireball')), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough mana' });
    expect(apply(dry, turn(ability('heavy-blow')), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such ability' });
    expect(apply(dry, turn(ability('arcane-shield')), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such ability' });
    expect(apply(dry, turn(ability('nothing')), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such ability' });
  });

  it('a wind-up: the enemy spends a round charging, then its next blow carries the wind-up\'s name and hits twice as hard', () => {
    const alpha = versus('warrior', 'wolf-alpha', { hp: 1000, maxHp: 1000 }, { hp: 5000 });
    let seen = 0;
    for (let i = 0; i < 60 && seen < 3; i++) {
      const rng = makeRng(`alpha-${i}`);
      const first = apply(alpha, turn(attack, 'none'), rng, NOW);
      if (!first.events.some((e) => e.type === 'charged' && e.by === 'enemy')) continue;
      expect(me(first.state).fight!.enemy.charged).toBe('Howl');
      const second = apply(first.state, turn(attack, 'none', 'f2'), rng, NOW);
      const blow = second.events.find((e) => e.type === 'hit' && e.by === 'enemy');
      expect(blow).toMatchObject({ move: 'Howl' });
      if (blow?.type === 'hit') expect(blow.damage).toBeGreaterThanOrEqual(16);
      expect(me(second.state).fight!.enemy.charged).toBeNull();
      seen++;
    }
    expect(seen).toBe(3);
  });

  it('worn gear counts: lifesteal heals on a hit, thorns bite back on a blow', () => {
    const drinker = versus('warrior', 'slime', { hp: 100, equipment: { weapon: { ...plainGear('w', 'weapon', 1), affixes: [{ kind: 'lifesteal', value: 0.2 }] }, armour: { ...plainGear('a', 'armour', 1), affixes: [{ kind: 'thorns', value: 0.3 }] }, helm: null, boots: null, trinket: null } }, { hp: 1000 });
    const r = apply(drinker, turn(attack, 'none'), makeRng('x'), NOW);
    const seen = types(r.events);
    expect(seen[0]).toBe('hit');
    expect(seen[1]).toBe('healed');
    expect(seen).toContain('countered');
  });

  it('Flee: a coin from the stream; a failed try costs the blow, a lucky one ends the fight where you stand', () => {
    // A seed whose first coin fails and a later one works.
    let found: { rounds: Brief[][]; end: GameState } | null = null;
    for (let i = 0; i < 50 && !found; i++) {
      const { state, rng } = begin('warrior', `flee-${i}`);
      const { state: end, rounds } = playOut(state, rng, [[{ kind: 'flee' }, 'none']], 10);
      const first = rounds[0]?.[0];
      if (first?.type === 'fled' && !first.ok && !me(end).fight) found = { rounds, end };
    }
    expect(found).not.toBeNull();
    const { rounds, end } = found!;
    expect(rounds[0]!.map((e) => e.type).slice(0, 2)).toEqual(['fled', 'hit']);
    expect(rounds[0]![1]).toMatchObject({ type: 'hit', by: 'enemy' });
    expect(rounds.at(-1)).toEqual([{ type: 'fled', ok: true }]);
    expect(me(end)).toMatchObject({ fight: null, space: 's1', xp: 0 });
    let fled = 0;
    for (let i = 0; i < 200; i++) {
      const r = versus('warrior', 'slime');
      const e = apply(r, turn({ kind: 'flee' }), makeRng(`flee-${i}`), NOW).events[0];
      if (e?.type === 'fled' && e.ok) fled++;
    }
    expect(fled).toBeGreaterThan(70);
    expect(fled).toBeLessThan(130);
  });

  it('beaten: back on your feet in the nearest town with HP and mana full and a fifth of the gold gone, gear kept', () => {
    const doomed = versus('mage', 'bandit', { hp: 5, mana: 3, gold: 50, bag: [plainGear('b', 'boots', 1)], equipment: { weapon: plainGear('w', 'weapon', 1), armour: null, helm: null, boots: null, trinket: null } }, {}, 's7');
    const { state, events } = apply(doomed, turn(attack, 'none'), makeRng('x'), NOW);
    expect(events.at(-1)).toEqual({ type: 'died', action: 'f1', player: P, town: 's0', lostGold: 10 });
    expect(me(state)).toMatchObject({ hp: 85, mana: 40, gold: 40, space: 's0', steps: 0, fight: null, offer: null });
    expect(me(state).bag).toHaveLength(1);
    expect(me(state).equipment.weapon?.name).toBe('Copper Sword');
    expect(apply(state, { type: 'roll', id: 'r', player: P }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rolled' });
  });

  it('winning gives xp and the levels the table says: more HP, mana, attack and defense, the gains healed', () => {
    const almost = versus('warrior', 'slime', { xp: 26, hp: 100, mana: 10 }, { hp: 1 });
    const { state, events } = apply(almost, turn(attack, 'none'), makeRng('x'), NOW);
    expect(events[1]).toEqual({ type: 'won', action: 'f1', player: P, xp: 5, gold: 6 });
    expect(events[2]).toEqual({ type: 'levelled', action: 'f1', player: P, level: 2, maxHp: 132, maxMana: 22, attack: 14, defense: 9 });
    expect(me(state)).toMatchObject({ xp: 31, level: 2, hp: 112, mana: 12, maxHp: 132, maxMana: 22, attack: 14, defense: 9 });
  });

  it('loot: a mob drops gear now and then, a mini-boss often and never common, a boss always and rare or better; flasks and cards sometimes', () => {
    const count = (enemy: string, enemyPatch: object) => {
      const n = { gear: 0, common: 0, low: 0, potion: 0, card: 0 };
      for (let i = 0; i < 200; i++) {
        const r = apply(versus('warrior', enemy, {}, enemyPatch), turn(attack, 'none'), makeRng(`loot-${enemy}-${i}`), NOW);
        for (const e of r.events) {
          if (e.type === 'loot') {
            n.gear++;
            if (e.gear.rarity === 'common') n.common++;
            if (e.gear.rarity === 'common' || e.gear.rarity === 'uncommon') n.low++;
            expect(e.gear.rank).toBe(1);
          }
          if (e.type === 'found') {
            if (e.item === 'potion') n.potion++;
            else n.card++;
          }
        }
      }
      return n;
    };
    const mob = count('slime', { hp: 1 });
    expect(mob.gear).toBeGreaterThan(8);
    expect(mob.gear).toBeLessThan(50);
    expect(mob.potion).toBeGreaterThan(20);
    expect(mob.card).toBeGreaterThan(3);
    const mini = count('wolf-alpha', { hp: 1 });
    expect(mini.gear).toBeGreaterThan(70);
    expect(mini.common).toBe(0);
    const boss = count('thornwood-warden', { hp: 1 });
    expect(boss.gear).toBe(200);
    expect(boss.low).toBe(0);
  });

  it('a boss on the board: beaten, it opens the area beyond, goes away for five minutes, and counts its falls; beaten again later, it opens nothing new', () => {
    const atGate = versus('warrior', 'thornwood-warden', { opened: ['meadows'] }, { hp: 1 }, 'gate', false, true);
    const { state, events } = apply(atGate, turn(attack, 'none'), makeRng('x'), NOW);
    expect(events.map((e) => e.type).slice(0, 2)).toEqual(['hit', 'won']);
    expect(events.find((e) => e.type === 'loot')).toBeDefined();
    expect(events.find((e) => e.type === 'bossDown')).toEqual({ type: 'bossDown', action: 'f1', player: P, space: 'gate', until: NOW + 300000 });
    expect(events.find((e) => e.type === 'opened')).toEqual({ type: 'opened', action: 'f1', player: P, area: 'thornwood' });
    expect(me(state)).toMatchObject({ opened: ['meadows', 'thornwood'], cooldowns: { gate: NOW + 300000 }, bossKills: { gate: 1 }, fight: null });
    const again = versus('warrior', 'thornwood-warden', { ...me(state), space: 'gate', fight: null }, { hp: 1 }, 'gate', false, true);
    const second = apply(again, turn(attack, 'none', 'f2'), makeRng('y'), NOW + 400000);
    expect(second.events.find((e) => e.type === 'opened')).toBeUndefined();
    expect(me(second.state)).toMatchObject({ opened: ['meadows', 'thornwood'], bossKills: { gate: 2 }, cooldowns: { gate: NOW + 700000 } });
  });

  it('beaten next to a gate, wakes in a town of an open area, never behind the boss', () => {
    // The Briar Gate is five steps from Frosthold and eleven from Brambleford; Frostpeak is closed, so Brambleford it is.
    // The King may spend his first round winding up, so play until the blow lands.
    const fallTo = (opened: string[]) => {
      const start = versus('mage', 'briar-king', { hp: 1, opened }, {}, 'briar', false, true);
      const { state, rounds } = playOut(start, makeRng('x'), [[attack, 'none']], 6);
      return { state, last: rounds.at(-1)!.at(-1)! };
    };
    const closed = fallTo(['meadows', 'thornwood']);
    expect(closed.last).toMatchObject({ type: 'died', town: 'brambleford' });
    expect(me(closed.state).space).toBe('brambleford');
    expect(fallTo(['meadows', 'thornwood', 'frostpeak']).last).toMatchObject({ type: 'died', town: 'frosthold' });
  });

  it('a spawned mini-boss leaves the board when it falls', () => {
    const base = versus('warrior', 'wolf-alpha', {}, { hp: 1 }, 's1', true);
    const prowling = { ...base, spawns: { s1: { kind: 'miniboss' as const, enemy: 'wolf-alpha', until: NOW + 1000 }, s3: { kind: 'merchant' as const, enemy: null, until: NOW + 1000 } } };
    const { state, events } = apply(prowling, turn(attack, 'none'), makeRng('x'), NOW);
    expect(events.at(-1)).toEqual({ type: 'despawned', action: 'f1', player: P, space: 's1' });
    expect(Object.keys(state.spawns)).toEqual(['s3']);
  });

  it('refuses a round outside a fight, and the board\'s actions inside one', () => {
    const s = newGame({ seed: 'x', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
    const r = apply(s, turn(attack, 'block'), makeRng('x'), NOW);
    expect(r.events).toEqual([{ type: 'rejected', action: 'f1', player: P, reason: 'not in a fight' }]);
    expect(r.state).toBe(s);
    const fighting = versus('warrior', 'slime');
    expect(apply(fighting, { type: 'roll', id: 'r', player: P }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
    expect(apply(fighting, { type: 'buy', id: 'b', player: P, item: 'potion' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
    expect(apply(fighting, { type: 'equip', id: 'e', player: P, gear: 'g1' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
  });
});
