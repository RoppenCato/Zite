// Robin's first play notes, 2026-11-01: a church on every map that heals and takes off what a fight left on you; poison and
// weakness that outlast a fight; flasks drunk from the bag.

import { describe, expect, it } from 'vitest';
import { apply, growBoard, makeRng, migrate, newGame, startFight } from '../src/index.ts';
import type { Action, Character, GameState } from '../src/types.ts';

const P = 'p1';
const NOW = 1_000_000;
const world = (): GameState => newGame({ seed: 'church', player: P, name: 'R', classId: 'warrior' });
const me = (s: GameState): Character => s.characters[P]!;
const put = (s: GameState, patch: Partial<Character>): GameState => ({ ...s, characters: { ...s.characters, [P]: { ...me(s), ...patch } } });

describe('the church', () => {
  it('stands on every hand-laid map', () => {
    const { board } = world();
    for (const area of Object.values(board.areas).filter((a) => !a.dungeon)) {
      expect(Object.values(board.spaces).filter((s) => s.area === area.id && s.kind === 'church').length).toBe(1);
    }
  });

  it('heals you fully and takes off what you carry, every time you land on it', () => {
    const s = world();
    const church = Object.values(s.board.spaces).find((x) => x.kind === 'church' && x.area === 'meadows')!;
    const from = church.links[0]!;
    const hurt = put(s, { hp: 5, mana: 1, space: from, steps: 1, ailments: { poison: { rolls: 4, damage: 3 }, weak: { rounds: 2, mult: 0.7 } } });
    const landed = apply(hurt, { type: 'move', id: 'm', player: P, path: [church.id] } as Action, makeRng(1), NOW);
    expect(landed.events.map((e) => e.type)).toEqual(expect.arrayContaining(['rested', 'cured']));
    expect(me(landed.state).hp).toBe(me(s).hp);
    expect(me(landed.state).mana).toBe(me(s).mana);
    expect(me(landed.state).ailments).toEqual({});
    const again = apply(put(landed.state, { hp: 5, space: from, steps: 1 }), { type: 'move', id: 'm2', player: P, path: [church.id] } as Action, makeRng(1), NOW + 1);
    expect(me(again.state).hp).toBe(me(s).hp);
  });

  it('comes to a save from before churches, on the set hubs', () => {
    const s = world();
    const spaces = Object.fromEntries(Object.entries(s.board.spaces).map(([id, x]) => [id, x.kind === 'church' ? { ...x, kind: 'normal' as const, name: 'Old name' } : x]));
    const { ailments: _gone, ...c } = me(s);
    const old = { ...s, version: 12, board: { ...s.board, spaces }, characters: { [P]: c } };
    const up = migrate(old as unknown)!;
    expect(up.version).toBe(30);
    expect(up.board.spaces.ravine).toMatchObject({ kind: 'church', name: 'Little Clover Church' });
    expect(up.characters[P]!.ailments).toEqual({});
  });
});

describe('ailments outlasting a fight', () => {
  const inFight = (patch: Record<string, unknown>): GameState => {
    const s = world();
    const c = startFight(me(s), 'slime', me(s).space, false, {}, makeRng(1));
    return put(s, { fight: { ...c.fight!, ...patch } as Character['fight'] });
  };

  it('poison stings on each roll, never kills, and wears off', () => {
    const s = put(world(), { hp: 6, ailments: { poison: { rolls: 2, damage: 4 } } });
    const one = apply(s, { type: 'roll', id: 'r', player: P }, makeRng(1), NOW);
    expect(one.events).toContainEqual(expect.objectContaining({ type: 'stung', damage: 4, hp: 2, left: 1 }));
    const walked = put(one.state, { steps: 0 });
    const two = apply(walked, { type: 'roll', id: 'r2', player: P }, makeRng(2), NOW);
    expect(me(two.state).hp).toBe(1);
    expect(me(two.state).ailments.poison).toBeUndefined();
  });

  it('a fight fled poisoned and weakened carries both away', () => {
    let s = inFight({ poisoned: { rounds: 2, damage: 3 }, weak: { rounds: 2, mult: 0.7 } });
    for (let seed = 0; seed < 40 && me(s).fight; seed++) {
      s = apply(s, { type: 'fight', id: `f${seed}`, player: P, move: { kind: 'flee' }, guard: 'block' }, makeRng(seed), NOW).state;
    }
    expect(me(s).fight).toBeNull();
    // Got away on the first flee of a seed that lets it: what was left comes along.
    const firstAway = Array.from({ length: 60 }, (_, i) => i).map((seed) => apply(inFight({ poisoned: { rounds: 2, damage: 3 }, weak: { rounds: 2, mult: 0.7 } }), { type: 'fight', id: 'f', player: P, move: { kind: 'flee' }, guard: 'block' }, makeRng(seed), NOW)).find((r) => r.events.some((e) => e.type === 'fled' && e.ok))!;
    expect(me(firstAway.state).ailments.poison).toEqual({ rolls: 4, damage: 3 });
    expect(me(firstAway.state).ailments.weak).toEqual({ rounds: 2, mult: 0.7 });
  });

  it('weakness takes hold in the next fight and is used up by it', () => {
    const c = { ...me(world()), ailments: { weak: { rounds: 2, mult: 0.7 } } };
    const next = startFight(c, 'slime', c.space, false, {}, makeRng(1));
    expect(next.fight!.weak).toEqual({ rounds: 2, mult: 0.7 });
    expect(next.ailments).toEqual({});
  });
});

describe('a flask from the bag', () => {
  it('heals out of a fight, and is refused when it would do nothing', () => {
    const s = put(world(), { hp: 10, items: { potion: 2 } });
    const drunk = apply(s, { type: 'use', id: 'u', player: P, item: 'potion' }, makeRng(1), NOW);
    expect(drunk.events.map((e) => e.type)).toEqual(['used', 'healed']);
    expect(me(drunk.state).hp).toBeGreaterThan(10);
    expect(me(drunk.state).items.potion).toBe(1);
    const full = put(world(), { items: { potion: 1 } });
    expect(apply(full, { type: 'use', id: 'u2', player: P, item: 'potion' }, makeRng(1), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
  });
});

describe('a grown area', () => {
  it('has a church', () => {
    const { board } = world();
    const gate = Object.values(board.spaces).find((x) => x.kind === 'boss' && !x.opens) ?? Object.values(board.spaces).find((x) => x.kind === 'boss')!;
    const grown = growBoard(board, gate.id, 'gen-1');
    const fresh = Object.values(grown.areas).find((a) => !board.areas[a.id])!;
    expect(fresh).toBeDefined();
    expect(Object.values(grown.spaces).some((x) => x.area === fresh.id && x.kind === 'church')).toBe(true);
  });
});
