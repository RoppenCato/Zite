import { describe, expect, it } from 'vitest';
import { apply, hubOf, makeRng, newGame, PROGRESSION, strollPath, type Board, type GameState } from '../src/index.ts';
import { WORLD_DATA } from '../src/data.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;

/** A small city: gate g links out to s0; g, a, b inside the walls. */
function cityBoard(): Board {
  const b = ringBoard();
  const area = { ...Object.values(b.areas)[0]!, id: 'city', name: 'Town', city: true };
  const space = (id: string, links: string[], kind: 'normal' | 'shop' = 'normal') => ({ id, kind, name: kind === 'shop' ? 'Smith' : '', x: 0, y: 0, links, area: 'city' });
  const spaces = { ...b.spaces, g: space('g', ['a', 's0']), a: space('a', ['g', 'b']), b: space('b', ['a'], 'shop'), s0: { ...b.spaces.s0!, links: [...b.spaces.s0!.links, 'g'] } };
  return { ...b, spaces, areas: { ...b.areas, city: area } };
}
const at = (space: string): GameState => {
  const s = newGame({ seed: 'hub', player: P, name: 'Robin', classId: 'warrior', board: cityBoard() });
  return { ...s, characters: { [P]: { ...s.characters[P]!, space, opened: [...s.characters[P]!.opened, 'city'] } } };
};

describe('a city (Robin, 2026-11-02)', () => {
  it('is walked with no die and no fights', () => {
    const r = apply(at('g'), { type: 'stroll', id: 's', player: P, to: 'b' }, makeRng('s'), NOW);
    const me = r.state.characters[P]!;
    expect(me.space).toBe('b');
    expect(me.fight).toBeNull();
    expect(r.events.some((e) => e.type === 'moved')).toBe(true);
    const street = apply(at('b'), { type: 'stroll', id: 's', player: P, to: 'a' }, makeRng('s'), NOW);
    expect(street.state.characters[P]!.fight).toBeNull();
    expect(street.events.some((e) => e.type === 'fight')).toBe(false);
  });
  it('finds its way by its own streets, and only there', () => {
    const s = at('g');
    expect(strollPath(s, 'g', 'b')).toEqual(['a', 'b']);
    expect(strollPath(s, 'g', 's1')).toBeNull();
    expect(strollPath(s, 's1', 'g')).toBeNull();
    expect(apply(s, { type: 'stroll', id: 's', player: P, to: 's1' }, makeRng('s'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });
  it('takes the die only at a way out', () => {
    expect(apply(at('a'), { type: 'roll', id: 'r', player: P }, makeRng('r'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(at('g'), { type: 'roll', id: 'r', player: P }, makeRng('r'), NOW).events[0]).toMatchObject({ type: 'rolled' });
  });
});

describe('going home (Robin, 2026-11-02)', () => {
  const data = WORLD_DATA as unknown as { hub?: string };
  it('takes you to the hub from anywhere, with a wait, not in a fight', () => {
    const old = data.hub;
    data.hub = 'b';
    try {
      const s = at('s1');
      expect(hubOf(s, s.characters[P]!)).toBe('b');
      const r = apply(s, { type: 'home', id: 'h', player: P }, makeRng('h'), NOW);
      const me = r.state.characters[P]!;
      expect(me.space).toBe('b');
      expect(me.cooldowns.home).toBe(NOW + PROGRESSION.homeWaitMs);
      const back: GameState = { ...r.state, characters: { [P]: { ...me, space: 's1' } } };
      expect(apply(back, { type: 'home', id: 'i', player: P }, makeRng('i'), NOW + 1000).events[0]).toMatchObject({ type: 'rejected' });
      expect(apply(back, { type: 'home', id: 'j', player: P }, makeRng('j'), NOW + PROGRESSION.homeWaitMs + 1).state.characters[P]!.space).toBe('b');
      const closed: GameState = { ...s, characters: { [P]: { ...s.characters[P]!, opened: ['meadows'] } } };
      expect(apply(closed, { type: 'home', id: 'k', player: P }, makeRng('k'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    } finally {
      if (old === undefined) delete data.hub;
      else data.hub = old;
    }
  });
  it('is not there on a world with no hub', () => {
    const s = at('s1');
    if (!data.hub) expect(apply(s, { type: 'home', id: 'h', player: P }, makeRng('h'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });
});
