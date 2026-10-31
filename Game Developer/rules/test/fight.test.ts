import { describe, expect, it } from 'vitest';
import { apply, levelFor, newGame } from '../src/game.ts';
import { nearestTown } from '../src/paths.ts';
import { makeRng, type Rng } from '../src/rng.ts';
import type { Action, Character, ClassId, GameEvent, GameState } from '../src/types.ts';
import { buildBoard } from '../src/island.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const act = (type: Action['type'], id = 'a1'): Action => ({ type, id, player: P } as Action);

/**
 * A character of `classId` standing on the ring's start with one step owed, walked onto Moor Edge (s1, a battle) with the
 * seed's stream, so the fight has begun and the same stream carries on into the rounds.
 */
function begin(classId: ClassId, seed: string, patch: Partial<Character> = {}): { state: GameState; rng: Rng } {
  const s = newGame({ seed, player: P, name: 'Robin', classId, board: ringBoard() });
  const ready = { ...s, characters: { [P]: { ...s.characters[P]!, steps: 1, ...patch } }, die: { ...s.die, last: 1 } };
  const rng = makeRng(seed);
  return { state: apply(ready, { type: 'move', id: 'm', player: P, path: ['s1'] }, rng).state, rng };
}

/** Play the same action until the fight ends, collecting every event with its action and player stripped. */
function playOut(state: GameState, rng: Rng, type: Action['type'], rounds = 30): { state: GameState; rounds: Omit<GameEvent, 'action' | 'player'>[][] } {
  const out: Omit<GameEvent, 'action' | 'player'>[][] = [];
  for (let i = 0; i < rounds && state.characters[P]!.fight; i++) {
    const r = apply(state, act(type, `a${i}`), rng);
    state = r.state;
    out.push(r.events.map(({ action: _a, player: _p, ...rest }) => rest));
  }
  return { state, rounds: out };
}

const me = (s: GameState): Character => s.characters[P]!;

describe('a fight', () => {
  it('begins on a battle space against an enemy drawn from the seed: a Moor Wolf for the seed ashford', () => {
    const { state } = begin('warrior', 'ashford');
    expect(me(state).fight).toEqual({
      enemy: { id: 'wolf', name: 'Moor Wolf', hp: 45, maxHp: 45, attack: 9, defense: 3, xp: 10, gold: 12 },
      round: 1,
      charged: false,
    });
  });

  it('plays the same way from the same seed, and never changes the state it was given', () => {
    const a = begin('warrior', 'ashford');
    const b = begin('warrior', 'ashford');
    const snapshot = structuredClone(a.state);
    const ra = apply(a.state, act('attack'), a.rng);
    const rb = apply(b.state, act('attack'), b.rng);
    expect(ra).toEqual(rb);
    expect(a.state).toEqual(snapshot);
    expect(ra.state).not.toBe(a.state);
    expect(ra.state.characters[P]!.fight!.enemy).not.toBe(a.state.characters[P]!.fight!.enemy);
  });

  it('Warrior, Attack: a hit is attack less half the defense, with a swing of two either way; the enemy strikes back', () => {
    const { state, rng } = begin('warrior', 'ashford');
    const { state: end, rounds } = playOut(state, rng, 'attack');
    // 12 attack less 1 (half of 3) is 11, swung -2..+2: 9, 13, 11, 10, and a crit for 18. The wolf's 9 less 4 is 5: 7, 5, 4, 5.
    expect(rounds).toEqual([
      [{ type: 'hit', by: 'player', move: 'Attack', damage: 9, crit: false, hp: 36 }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 7, crit: false, hp: 113 }],
      [{ type: 'hit', by: 'player', move: 'Attack', damage: 13, crit: false, hp: 23 }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 5, crit: false, hp: 108 }],
      [{ type: 'hit', by: 'player', move: 'Attack', damage: 11, crit: false, hp: 12 }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 4, crit: false, hp: 104 }],
      [{ type: 'hit', by: 'player', move: 'Attack', damage: 10, crit: false, hp: 2 }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 5, crit: false, hp: 99 }],
      [{ type: 'hit', by: 'player', move: 'Attack', damage: 18, crit: true, hp: 0 }, { type: 'won', xp: 10, gold: 12 }],
    ]);
    expect(me(end)).toMatchObject({ hp: 99, gold: 62, xp: 10, level: 1, fight: null, space: 's1' });
  });

  it('Warrior, Heavy Blow: 1.6 times the attack, so the wolf falls in three', () => {
    const { state, rng } = begin('warrior', 'ashford');
    const { state: end, rounds } = playOut(state, rng, 'skill');
    expect(rounds.map((r) => r[0])).toEqual([
      { type: 'hit', by: 'player', move: 'Heavy Blow', damage: 16, crit: false, hp: 29 },
      { type: 'hit', by: 'player', move: 'Heavy Blow', damage: 20, crit: false, hp: 9 },
      { type: 'hit', by: 'player', move: 'Heavy Blow', damage: 18, crit: false, hp: 0 },
    ]);
    expect(rounds[2]![1]).toEqual({ type: 'won', xp: 10, gold: 12 });
    expect(me(end)).toMatchObject({ hp: 108, gold: 62, xp: 10 });
  });

  it('Rogue, Backstab: 1.2 times the attack with a crit half the time', () => {
    const { state, rng } = begin('rogue', 'ashford');
    const { rounds } = playOut(state, rng, 'skill');
    expect(rounds.map((r) => r[0])).toEqual([
      { type: 'hit', by: 'player', move: 'Backstab', damage: 8, crit: false, hp: 37 },
      { type: 'hit', by: 'player', move: 'Backstab', damage: 12, crit: false, hp: 25 },
      { type: 'hit', by: 'player', move: 'Backstab', damage: 20, crit: true, hp: 5 },
      { type: 'hit', by: 'player', move: 'Backstab', damage: 18, crit: true, hp: 0 },
    ]);
  });

  it('Mage, Charge: a round spent charging while the enemy still strikes, then a hit three times as strong', () => {
    const { state, rng } = begin('mage', 'ashford');
    const { state: end, rounds } = playOut(state, rng, 'skill');
    expect(rounds).toEqual([
      [{ type: 'charged' }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 5, crit: false, hp: 75 }],
      [{ type: 'hit', by: 'player', move: 'Charge', damage: 43, crit: false, hp: 2 }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 9, crit: false, hp: 66 }],
      [{ type: 'charged' }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 7, crit: false, hp: 59 }],
      [{ type: 'hit', by: 'player', move: 'Charge', damage: 41, crit: false, hp: 0 }, { type: 'won', xp: 10, gold: 12 }],
    ]);
    expect(me(end)).toMatchObject({ hp: 59, gold: 62, xp: 10, fight: null });
  });

  it('a held charge goes into a plain Attack too, and is spent by it', () => {
    const { state, rng } = begin('mage', 'ashford');
    const charged = apply(state, act('skill'), rng).state;
    expect(me(charged).fight!.charged).toBe(true);
    const { state: after, events } = apply(charged, act('attack', 'a2'), rng);
    const hit = events[0];
    expect(hit).toMatchObject({ type: 'hit', by: 'player', move: 'Attack' });
    if (hit?.type === 'hit') expect(hit.damage).toBeGreaterThanOrEqual(36); // 14 times 3 less 1, swung, at the least 36 without a crit
    expect(me(after).fight!.charged).toBe(false);
  });

  it('Ranger, Volley: three small hits, and the enemy does not strike back in the first round', () => {
    const { state, rng } = begin('ranger', 'ashford');
    const first = apply(state, act('skill'), rng);
    expect(first.events.map((e) => e.type)).toEqual(['hit', 'hit', 'hit']);
    expect(first.events.every((e) => e.type === 'hit' && e.by === 'player' && e.move === 'Volley' && e.damage >= 1 && e.damage <= 14)).toBe(true);
    expect(me(first.state)).toMatchObject({ hp: 95 });
    expect(me(first.state).fight!.round).toBe(2);
    const second = apply(first.state, act('attack', 'a2'), rng);
    expect(second.events.map((e) => e.type)).toEqual(['hit', 'hit']);
    expect(second.events[1]).toMatchObject({ type: 'hit', by: 'enemy', move: 'Moor Wolf' });
    // Other classes take the first blow at once.
    const warrior = begin('warrior', 'ashford');
    expect(apply(warrior.state, act('attack'), warrior.rng).events.map((e) => e.type)).toEqual(['hit', 'hit']);
  });

  it('a volley stops at the kill and never hits a fallen enemy', () => {
    const { state, rng } = begin('ranger', 'ashford');
    const weak = { ...state, characters: { [P]: { ...me(state), fight: { ...me(state).fight!, enemy: { ...me(state).fight!.enemy, hp: 1 } } } } };
    const { events } = apply(weak, act('skill'), rng);
    expect(events.map((e) => e.type)).toEqual(['hit', 'won']);
  });

  it('Defend: the enemy\'s hit is halved, rounded up', () => {
    const { state, rng } = begin('warrior', 'ashford');
    const { events } = apply(state, act('defend'), rng);
    expect(events).toEqual([
      { type: 'guarded', action: 'a1', player: P },
      { type: 'hit', action: 'a1', player: P, by: 'enemy', move: 'Moor Wolf', damage: 2, crit: false, hp: 118 },
    ]);
    // The same blow unguarded, from the same point in the stream, is 3 or 4.
    const raw = apply(state, act('attack'), makeRng('ashford')).events[1];
    expect(raw).toMatchObject({ type: 'hit', by: 'enemy' });
  });

  it('Flee: half the time it works; a failed try costs the enemy\'s blow', () => {
    const { state, rng } = begin('warrior', 'flee');
    const { state: end, rounds } = playOut(state, rng, 'flee');
    expect(rounds).toEqual([
      [{ type: 'fled', ok: false }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 5, crit: false, hp: 115 }],
      [{ type: 'fled', ok: false }, { type: 'hit', by: 'enemy', move: 'Moor Wolf', damage: 7, crit: false, hp: 108 }],
      [{ type: 'fled', ok: true }],
    ]);
    expect(me(end)).toMatchObject({ fight: null, space: 's1', hp: 108, xp: 0, gold: 50 });
    let fled = 0;
    for (let i = 0; i < 200; i++) {
      const r = begin('warrior', `flee-${i}`);
      const e = apply(r.state, act('flee'), r.rng).events[0];
      if (e?.type === 'fled' && e.ok) fled++;
    }
    expect(fled).toBeGreaterThan(70);
    expect(fled).toBeLessThan(130);
  });

  it('beaten: back on your feet in the nearest town with a fifth of the gold gone, the fight over', () => {
    const { state, rng } = begin('mage', 'bandits', { hp: 9 });
    expect(me(state).fight!.enemy.name).toBe('Marsh Wisp');
    const { state: end, events } = apply(state, act('attack'), rng);
    expect(events).toEqual([
      { type: 'hit', action: 'a1', player: P, by: 'player', move: 'Attack', damage: 14, crit: false, hp: 21 },
      { type: 'hit', action: 'a1', player: P, by: 'enemy', move: 'Marsh Wisp', damage: 12, crit: false, hp: 0 },
      { type: 'died', action: 'a1', player: P, town: 's0', lostGold: 10 },
    ]);
    expect(me(end)).toMatchObject({ hp: 80, maxHp: 80, gold: 40, space: 's0', steps: 0, fight: null, xp: 0 });
    // The board is open again.
    expect(apply(end, act('roll', 'r1'), rng).events[0]).toMatchObject({ type: 'rolled' });
  });

  it('winning gives xp, and a level when the table says so: more HP, attack and defense, the HP gained healed', () => {
    const { state, rng } = begin('warrior', 'ashford', { xp: 15 });
    const { state: end, rounds } = playOut(state, rng, 'attack');
    expect(rounds[4]).toEqual([
      { type: 'hit', by: 'player', move: 'Attack', damage: 18, crit: true, hp: 0 },
      { type: 'won', xp: 10, gold: 12 },
      { type: 'levelled', level: 2, maxHp: 132, attack: 14, defense: 9 },
    ]);
    expect(me(end)).toMatchObject({ xp: 25, level: 2, hp: 111, maxHp: 132, attack: 14, defense: 9 });
    // Two levels at once when the xp jumps past two lines of the table.
    const big = begin('warrior', 'ashford', { xp: 48 });
    const bigEnd = playOut(big.state, big.rng, 'attack');
    expect(bigEnd.rounds[4]!.slice(1)).toEqual([
      { type: 'won', xp: 10, gold: 12 },
      { type: 'levelled', level: 2, maxHp: 132, attack: 14, defense: 9 },
      { type: 'levelled', level: 3, maxHp: 144, attack: 16, defense: 10 },
    ]);
    expect(me(bigEnd.state)).toMatchObject({ xp: 58, level: 3 });
  });

  it('reads the level from the xp table', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(19)).toBe(1);
    expect(levelFor(20)).toBe(2);
    expect(levelFor(49)).toBe(2);
    expect(levelFor(50)).toBe(3);
    expect(levelFor(540)).toBe(10);
    expect(levelFor(99999)).toBe(10);
  });

  it('refuses a fight action outside a fight, and the board\'s actions inside one', () => {
    const s = newGame({ seed: 'x', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
    for (const type of ['attack', 'defend', 'skill', 'flee'] as const) {
      const r = apply(s, act(type), makeRng('x'));
      expect(r.events).toEqual([{ type: 'rejected', action: 'a1', player: P, reason: 'not in a fight' }]);
      expect(r.state).toBe(s);
    }
    const { state } = begin('warrior', 'ashford');
    expect(apply(state, act('roll'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
  });
});

describe('the nearest town', () => {
  it('is the closest by steps, the start when there is none', () => {
    const ring = ringBoard();
    expect(nearestTown(ring, 's0')).toBe('s0');
    expect(nearestTown(ring, 's7')).toBe('s0');
    const island = newGame({ seed: 'x', player: P, name: 'R', classId: 'mage' }).board;
    expect(nearestTown(island, 'ashford-millford-1')).toBe('ashford');
    expect(nearestTown(island, 'ashford-millford-6')).toBe('millford');
    expect(nearestTown(island, 'millford-moon-1')).toBe('millford');
    expect(nearestTown(island, 'crossroads')).toBe('millford');
    const noTown = buildBoard({
      name: 'No Town',
      width: 500,
      height: 500,
      start: 'a',
      hubs: [
        { id: 'a', kind: 'event', name: 'A', x: 100, y: 250 },
        { id: 'b', kind: 'shrine', name: 'B', x: 400, y: 250 },
      ],
      roads: [
        { from: 'a', to: 'b', kinds: 'bb', bow: 40 },
        { from: 'b', to: 'a', kinds: 'bb', bow: 40 },
      ],
    });
    expect(nearestTown(noTown, 'b')).toBe('a');
  });
});
