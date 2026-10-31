import { describe, expect, it } from 'vitest';
import { apply, makeBoard, newGame } from '../src/game.ts';
import { legalPaths, reachable } from '../src/paths.ts';
import { makeRng } from '../src/rng.ts';
import { migrate } from '../src/save.ts';
import type { Action, GameState } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';

/** A game on the twelve-space ring, so the paths below stay short. The real game plays on the island. */
function fresh(seed = 'ashford'): GameState {
  return newGame({ seed, player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
}

const roll = (id = 'r1'): Action => ({ type: 'roll', id, player: P });
const move = (path: string[], id = 'm1'): Action => ({ type: 'move', id, player: P, path });

describe('a new game', () => {
  it('plays on the island unless given a board: Ashford Isle, starting in the town Ashford', () => {
    const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior' });
    expect(s.version).toBe(2);
    expect(s.board).toEqual(makeBoard());
    expect(s.board.start).toBe('ashford');
    expect(s.board.spaces.ashford).toMatchObject({ kind: 'town', name: 'Ashford' });
    expect(Object.keys(s.board.spaces).length).toBeGreaterThanOrEqual(55);
    expect(Object.keys(s.board.spaces).length).toBeLessThanOrEqual(70);
    expect(s.board).toMatchObject({ width: 1400, height: 1850 });
    expect(s.characters[P]).toMatchObject({ space: 'ashford', steps: 0 });
  });

  it('takes the small ring when a test asks: one warrior on the start space and an unrolled die', () => {
    const s = fresh();
    expect(s.version).toBe(2);
    expect(s.seed).toBe('ashford');
    expect(Object.keys(s.board.spaces)).toHaveLength(12);
    expect(s.board.start).toBe('s0');
    expect(s.board).toMatchObject({ width: 412, height: 915 });
    expect(s.board.spaces.s0).toMatchObject({ kind: 'town', name: 'Ashford', links: ['s11', 's1'] });
    expect(s.characters[P]).toEqual({
      id: P,
      name: 'Robin',
      classId: 'warrior',
      hp: 120,
      maxHp: 120,
      attack: 12,
      defense: 8,
      gold: 50,
      space: 's0',
      steps: 0,
    });
    expect(s.die).toEqual({ sides: 6, last: null });
  });

  it('gives each class its own numbers from the data', () => {
    expect(newGame({ seed: 'x', player: P, name: 'R', classId: 'mage' }).characters[P]).toMatchObject({ hp: 80, attack: 14, defense: 4, gold: 50 });
    expect(newGame({ seed: 'x', player: P, name: 'R', classId: 'rogue' }).characters[P]).toMatchObject({ hp: 90, gold: 60 });
    expect(newGame({ seed: 'x', player: P, name: 'R', classId: 'ranger' }).characters[P]).toMatchObject({ hp: 95, attack: 8 });
  });
});

describe('roll', () => {
  it('rolls the die from the seed and leaves that many steps to walk', () => {
    const before = fresh();
    const snapshot = structuredClone(before);
    const { state, events } = apply(before, roll(), makeRng('ashford'));
    expect(events).toEqual([{ type: 'rolled', action: 'r1', player: P, value: 2 }]);
    expect(state.die.last).toBe(2);
    expect(state.characters[P]?.steps).toBe(2);
    expect(state.characters[P]?.space).toBe('s0');
    expect(before).toEqual(snapshot);
    expect(state).not.toBe(before);
  });

  it('replays the same roll from the same seed', () => {
    const a = apply(fresh(), roll(), makeRng('ashford'));
    const b = apply(fresh(), roll(), makeRng('ashford'));
    expect(a).toEqual(b);
    const c = apply(fresh(), roll(), makeRng(12345));
    expect(c.events).toEqual([{ type: 'rolled', action: 'r1', player: P, value: 6 }]);
  });

  it('is refused while a move is still owed', () => {
    const rng = makeRng('ashford');
    const first = apply(fresh(), roll('r1'), rng);
    const second = apply(first.state, roll('r2'), rng);
    expect(second.events).toEqual([{ type: 'rejected', action: 'r2', player: P, reason: 'finish your move first' }]);
    expect(second.state).toBe(first.state);
  });

  it('is refused for a player who is not in the game', () => {
    const { state, events } = apply(fresh(), { type: 'roll', id: 'r1', player: 'nobody' }, makeRng('ashford'));
    expect(events).toEqual([{ type: 'rejected', action: 'r1', player: 'nobody', reason: 'unknown player' }]);
    expect(state.die.last).toBeNull();
  });
});

describe('move', () => {
  const rolled = () => apply(fresh(), roll(), makeRng('ashford')).state; // two steps owed from s0

  it('walks the path and lands on the last space', () => {
    const { state, events } = apply(rolled(), move(['s1', 's2']), makeRng('ashford'));
    expect(events).toEqual([
      { type: 'moved', action: 'm1', player: P, from: 's0', path: ['s1', 's2'] },
      { type: 'landed', action: 'm1', player: P, space: 's2', kind: 'shop' },
    ]);
    expect(state.characters[P]).toMatchObject({ space: 's2', steps: 0 });
    expect(state.die.last).toBe(2);
  });

  it('may go either way round from the start', () => {
    const { state, events } = apply(rolled(), move(['s11', 's10']), makeRng('ashford'));
    expect(events[1]).toEqual({ type: 'landed', action: 'm1', player: P, space: 's10', kind: 'bossgate' });
    expect(state.characters[P]?.space).toBe('s10');
  });

  it('is refused before a roll', () => {
    const { state, events } = apply(fresh(), move(['s1']), makeRng('ashford'));
    expect(events).toEqual([{ type: 'rejected', action: 'm1', player: P, reason: 'roll first' }]);
    expect(state.characters[P]?.space).toBe('s0');
  });

  it('must use exactly the steps rolled', () => {
    expect(apply(rolled(), move(['s1']), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'wrong number of steps' });
    expect(apply(rolled(), move(['s1', 's2', 's3']), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'wrong number of steps' });
    expect(apply(rolled(), move([]), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'wrong number of steps' });
  });

  it('must follow the connections', () => {
    expect(apply(rolled(), move(['s1', 's5']), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'not connected' });
    expect(apply(rolled(), move(['s2', 's3']), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'not connected' });
  });

  it('may not turn straight back', () => {
    expect(apply(rolled(), move(['s1', 's0']), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'no turning back' });
  });

  it('refuses a space that does not exist', () => {
    expect(apply(rolled(), move(['s1', 'nowhere']), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'no such space' });
  });

  it('leaves the state alone when refused', () => {
    const s = rolled();
    const snapshot = structuredClone(s);
    const { state } = apply(s, move(['s1', 's0']), makeRng('x'));
    expect(state).toBe(s);
    expect(s).toEqual(snapshot);
  });
});

describe('the legal paths', () => {
  it('lists every walk of the rolled length, in link order, never turning back', () => {
    const { board } = fresh();
    expect(legalPaths(board, 's0', 1)).toEqual([['s11'], ['s1']]);
    expect(legalPaths(board, 's0', 2)).toEqual([['s11', 's10'], ['s1', 's2']]);
    expect(legalPaths(board, 's0', 3)).toEqual([['s11', 's10', 's9'], ['s1', 's2', 's3']]);
    // s3 and s9 are the forks: the ring goes on, or the chord crosses the middle.
    expect(legalPaths(board, 's3', 1)).toEqual([['s2'], ['s4'], ['s9']]);
    expect(legalPaths(board, 's0', 4)).toHaveLength(4);
    expect(legalPaths(board, 's0', 0)).toEqual([]);
  });

  it('lists where a roll can end, each space once, with the first walk there', () => {
    const { board } = fresh();
    expect(reachable(board, 's0', 2)).toEqual([
      { space: 's10', path: ['s11', 's10'] },
      { space: 's2', path: ['s1', 's2'] },
    ]);
    // A 6 from the start: six walks, but two of them end on Moon Shrine, so five places to tap.
    const six = reachable(board, 's0', 6);
    expect(legalPaths(board, 's0', 6)).toHaveLength(6);
    expect(six.map((r) => r.space)).toEqual(['s6', 's1', 's5', 's7', 's11']);
    expect(six[0]?.path).toEqual(['s11', 's10', 's9', 's8', 's7', 's6']);
    expect(reachable(board, 's0', 0)).toEqual([]);
  });

  it('agrees with move: every legal path is accepted', () => {
    const { state } = apply(fresh(), roll(), makeRng(12345)); // a 6
    const paths = legalPaths(state.board, 's0', 6);
    expect(paths.length).toBeGreaterThan(2);
    for (const path of paths) {
      const result = apply(state, move(path), makeRng('x'));
      expect(result.events[1]).toMatchObject({ type: 'landed', space: path[5] });
    }
    expect(paths).toContainEqual(['s1', 's2', 's3', 's9', 's10', 's11']);
    expect(paths).toContainEqual(['s1', 's2', 's3', 's4', 's5', 's6']);
  });
});

describe('a few turns from one seed', () => {
  it('always play out the same way', () => {
    const play = () => {
      const rng = makeRng('ashford');
      let state = fresh();
      const rolls: number[] = [];
      for (let i = 0; i < 3; i++) {
        const r = apply(state, roll(`r${i}`), rng);
        state = r.state;
        if (r.events[0]?.type === 'rolled') rolls.push(r.events[0].value);
        const me = state.characters[P]!;
        const path = legalPaths(state.board, me.space, me.steps)[0]!;
        state = apply(state, move(path, `m${i}`), rng).state;
      }
      return { rolls, space: state.characters[P]?.space };
    };
    const a = play();
    expect(a.rolls).toEqual([2, 1, 5]);
    expect(play()).toEqual(a);
  });
});

describe('a stored state', () => {
  it('passes through at the current version and is refused when it is nothing we know', () => {
    const s = fresh();
    expect(migrate(structuredClone(s))).toEqual(s);
    expect(migrate(null)).toBeNull();
    expect(migrate('junk')).toBeNull();
    expect(migrate({ version: 3 })).toBeNull();
    expect(migrate({ version: 0 })).toBeNull();
    expect(migrate({})).toBeNull();
  });

  // A version-1 state as the first builds saved it: the ring as its board, a character mid-walk.
  const versionOne = () => ({
    version: 1,
    seed: 'old-seed',
    board: {
      start: 's0',
      spaces: {
        s0: { id: 's0', kind: 'town', name: 'Ashford', x: 206, y: 715, links: ['s11', 's1'] },
        s1: { id: 's1', kind: 'battle', name: 'Moor Edge', x: 131, y: 677, links: ['s0', 's2'] },
      },
    },
    characters: {
      p1: { id: 'p1', name: 'Robin', classId: 'warrior', hp: 77, maxHp: 120, attack: 12, defense: 8, gold: 95, space: 's7', steps: 3 },
      p2: { id: 'p2', name: 'Ann', classId: 'mage', hp: 80, maxHp: 80, attack: 14, defense: 4, gold: 12, space: 's2', steps: 0 },
    },
    die: { sides: 6, last: 3 },
  });

  it('brings a version-1 state to version 2: the island, every character kept and stood on the start, the die unrolled', () => {
    const old = versionOne();
    const s = migrate(structuredClone(old));
    expect(s).not.toBeNull();
    expect(s!.version).toBe(2);
    expect(s!.seed).toBe('old-seed');
    expect(s!.board).toEqual(makeBoard());
    expect(s!.characters.p1).toEqual({ ...old.characters.p1, space: 'ashford', steps: 0 });
    expect(s!.characters.p2).toEqual({ ...old.characters.p2, space: 'ashford', steps: 0 });
    expect(s!.die).toEqual({ sides: 6, last: null });
    // And it plays on: a roll from the start of the island.
    const { state, events } = apply(s!, roll(), makeRng('ashford'));
    expect(events).toEqual([{ type: 'rolled', action: 'r1', player: P, value: 2 }]);
    expect(reachable(state.board, 'ashford', 2).map((r) => r.space)).toEqual(['ashford-millford-2', 'ashford-saltmarsh-2', 'ashford-ravine-2']);
  });

  it('refuses a version-1 state it cannot carry over', () => {
    const noSeed = versionOne() as Record<string, unknown>;
    delete noSeed.seed;
    expect(migrate(noSeed)).toBeNull();
    const oddClass = versionOne();
    oddClass.characters.p2.classId = 'bard';
    expect(migrate(oddClass)).toBeNull();
    expect(migrate({ version: 1, seed: 'x', characters: 'none' })).toBeNull();
  });
});
