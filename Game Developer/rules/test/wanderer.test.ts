import { describe, expect, it } from 'vitest';
import { apply, makeRng, newGame, PROGRESSION, type GameEvent, type GameState } from '../src/index.ts';

const NOW = 1_000_000;

describe('wanderers (Robin, 2026-11-02)', () => {
  const W = PROGRESSION.wanderer;
  const roll = (s: GameState, n: number) => {
    const rng = makeRng('wander');
    let at = s;
    const seen: GameEvent[] = [];
    for (let i = 0; i < n; i++) {
      const r = apply(at, { type: 'tick', id: 't' + i, player: 'world' }, rng, NOW + i);
      at = r.state;
      seen.push(...r.events);
    }
    return { at, seen };
  };
  it('turns up in the land someone stands in, its level above that land, and walks', () => {
    const { at, seen } = roll(newGame({ seed: 'wander', player: 'p1', name: 'Robin', classId: 'warrior' }), 400);
    const first = seen.find((e) => e.type === 'spawned' && e.spawn.kind === 'wanderer');
    expect(first).toBeTruthy();
    if (first?.type !== 'spawned') return;
    const area = at.board.areas[at.board.spaces[first.space]!.area]!;
    expect(first.spawn.level).toBe(area.levels[1] + W.levelsOver);
    expect(seen.filter((e) => e.type === 'spawned' && e.spawn.kind === 'wanderer').length).toBeGreaterThan(1);
    expect(Object.values(at.spawns).filter((s) => s.kind === 'wanderer').length).toBeLessThanOrEqual(1);
  });
  it('does not come for one who has outgrown the land', () => {
    const s = newGame({ seed: 'wander', player: 'p1', name: 'Robin', classId: 'warrior' });
    const me = Object.values(s.characters)[0]!;
    const { seen } = roll({ ...s, characters: { [me.id]: { ...me, level: 40 } } }, 200);
    expect(seen.some((e) => e.type === 'spawned' && e.spawn.kind === 'wanderer')).toBe(false);
  });
});
