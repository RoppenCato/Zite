import { describe, expect, it } from 'vitest';
import { apply, legalPaths, makeRng, newGame, RUMOURS, walkable, type GameState, type Rumour } from '../src/index.ts';
import { withSecrets } from '../src/world.ts';

const P = 'p1';
const NOW = 1_000_000;
const start = (extra: object = {}): GameState => {
  const s = newGame({ seed: 'rumour', player: P, name: 'Robin', classId: 'warrior' });
  return { ...s, characters: { [P]: { ...s.characters[P]!, ...extra } } };
};
/** Step one link onto a spot, as a roll of one would. */
const stepOn = (s: GameState, to: string, seed = 'r') => {
  const me = s.characters[P]!;
  const from = s.board.spaces[to]!.links[0]!;
  return apply({ ...s, characters: { [P]: { ...me, space: from, steps: 1, offer: null } } }, { type: 'move', id: 'm', player: P, path: [to] }, makeRng(seed), NOW);
};
const heard = (seed = 'r') => stepOn(start(), 'ashford', seed);

describe('rumours (Robin, 2026-11-02)', () => {
  it('a town tells you one, in its own land, once in a while', () => {
    const r = heard();
    const me = r.state.characters[P]!;
    expect(me.rumours).toHaveLength(1);
    expect(r.events.some((e) => e.type === 'rumour')).toBe(true);
    const space = r.state.board.spaces[me.rumours![0]!.space]!;
    expect(space.area).toBe('meadows');
    expect(me.rumours![0]!.text).not.toContain('{');
    const again = stepOn(r.state, 'ashford', 'q');
    expect(again.state.characters[P]!.rumours).toHaveLength(1);
    expect(again.state.characters[P]!.hp).toBeGreaterThan(0);
  });
  it('holds no more than its limit', () => {
    const full = Array.from({ length: RUMOURS.max }, (_, i): Rumour => ({ kind: 'stash', space: `x${i}`, text: 't' }));
    const r = stepOn(start({ rumours: full }), 'ashford');
    expect(r.state.characters[P]!.rumours).toHaveLength(RUMOURS.max);
  });
  it('a stash pays on landing and the mark goes', () => {
    const base = start();
    const target = Object.values(base.board.spaces).find((s) => s.area === 'meadows' && s.kind === 'normal' && !s.name && s.links.length === 2)!;
    const r = stepOn(start({ rumours: [{ kind: 'stash', space: target.id, text: 't' }] }), target.id);
    const me = r.state.characters[P]!;
    expect(me.rumours).toEqual([]);
    expect(r.events.some((e) => e.type === 'rumourDone')).toBe(true);
    expect(r.events.some((e) => e.type === 'chest')).toBe(true);
    expect(me.fight ?? null).toBeNull();
  });
  it('a beast is a fight bigger than the creature, and a mark on the way stops the walk', () => {
    const base = start();
    const target = Object.values(base.board.spaces).find((s) => s.area === 'meadows' && s.kind === 'normal' && !s.name && s.links.length === 2)!;
    const r = stepOn(start({ rumours: [{ kind: 'beast', mob: 'slime', space: target.id, text: 't' }] }), target.id);
    const e = r.state.characters[P]!.fight!.enemy;
    expect(e.name).toContain('Huge');
    expect(e.wanderer).toBe(true);
    const from = target.links[0]!;
    const beyond = target.links[1]!;
    const me = base.characters[P]!;
    const walk = apply({ ...base, characters: { [P]: { ...me, space: from, steps: 2, rumours: [{ kind: 'stash', space: target.id, text: 't' }] } } }, { type: 'move', id: 'w', player: P, path: [target.id, beyond] }, makeRng('w'), NOW);
    expect(walk.state.characters[P]!.space).toBe(target.id);
  });
});

describe('hidden places (Robin, 2026-11-02)', () => {
  const base = start();
  const town = base.board.spaces.ashford!;
  const anchor = Object.values(base.board.spaces).find((s) => s.area === 'meadows' && s.kind === 'normal' && !s.name && s.links.length === 2 && Math.hypot(s.x - town.x, s.y - town.y) > 800)!;
  const trail = { id: 'sec-test', area: 'meadows', anchor: anchor.id, spots: [{ x: anchor.x + 100, y: anchor.y }, { x: anchor.x + 200, y: anchor.y, name: 'The Test Hole', kind: 'chest' }] };
  const board = withSecrets(base.board, [trail]);
  const withTrail: GameState = { ...base, board };
  it('are not walked until found', () => {
    const me = withTrail.characters[P]!;
    const paths = legalPaths(board, anchor.id, 1, walkable(me));
    expect(paths.flat()).not.toContain('sec-test-1');
    const open = legalPaths(board, anchor.id, 1, walkable({ ...me, found: ['sec-test-1', 'sec-test-2'] }));
    expect(open.flat()).toContain('sec-test-1');
  });
  it('show when you stand close, and only then', () => {
    const r = stepOn(withTrail, anchor.id);
    expect(r.state.characters[P]!.found).toEqual(['sec-test-1', 'sec-test-2']);
    expect(r.events.filter((e) => e.type === 'secretFound')).toHaveLength(1);
    const far = stepOn(withTrail, 'ashford');
    expect(far.state.characters[P]!.found ?? []).toEqual([]);
  });
  it('give their treasure once, then only what the spot gives', () => {
    const s: GameState = { ...withTrail, characters: { [P]: { ...withTrail.characters[P]!, found: ['sec-test-1', 'sec-test-2'], space: 'sec-test-1', steps: 1, gold: 0 } } };
    const r = apply(s, { type: 'move', id: 'm', player: P, path: ['sec-test-2'] }, makeRng('t'), NOW);
    expect(r.events.some((e) => e.type === 'secretTreasure')).toBe(true);
    expect(r.state.characters[P]!.foundDone).toEqual(['sec-test-2']);
    const me = r.state.characters[P]!;
    const again = apply({ ...r.state, characters: { [P]: { ...me, offer: null, space: 'sec-test-1', steps: 1 } } }, { type: 'move', id: 'n', player: P, path: ['sec-test-2'] }, makeRng('u'), NOW + 1e9);
    expect(again.events.some((e) => e.type === 'secretTreasure')).toBe(false);
  });
  it('a town can send you to one', () => {
    let saw = false;
    for (let i = 0; i < 20 && !saw; i++) {
      const r = stepOn(withTrail, 'ashford', 's' + i);
      saw = r.state.characters[P]!.rumours?.some((x) => x.kind === 'secret' && x.space === anchor.id) ?? false;
    }
    expect(saw).toBe(true);
  });
});
