import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data.ts';
import { apply, newGame } from '../src/game.ts';
import { legalPaths } from '../src/paths.ts';
import { makeRng } from '../src/rng.ts';
import type { Action, Character, GameState } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
// The ring: s0 town, s1 battle, s2 Tinker Cart (shop), s3 event.
function at(space: string, patch: Partial<Character> = {}, last: number | null = null): GameState {
  const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
  return { ...s, characters: { [P]: { ...s.characters[P]!, space, ...patch } }, die: { ...s.die, last } };
}
const buy = (item: string, id = 'b1'): Action => ({ type: 'buy', id, player: P, item });
const use = (item: string, value?: number, id = 'u1'): Action => ({ type: 'use', id, player: P, item, ...(value !== undefined ? { value } : {}) });
const me = (s: GameState): Character => s.characters[P]!;

describe('the shop', () => {
  it('sells one of an item for its price when standing on a shop space', () => {
    const { state, events } = apply(at('s2', { gold: 50 }), buy('potion'), makeRng('x'));
    expect(events).toEqual([{ type: 'bought', action: 'b1', player: P, item: 'potion', price: 15, gold: 35 }]);
    expect(me(state)).toMatchObject({ gold: 35, items: { potion: 1 } });
    const again = apply(state, buy('potion', 'b2'), makeRng('x')).state;
    expect(me(again)).toMatchObject({ gold: 20, items: { potion: 2 } });
    const card = apply(again, buy('plus-one', 'b3'), makeRng('x')).state;
    expect(me(card)).toMatchObject({ gold: 8, items: { potion: 2, 'plus-one': 1 } });
  });

  it('refuses away from a shop, without the gold, for a thing it does not sell, and in a fight', () => {
    const away = apply(at('s0', { gold: 50 }), buy('potion'), makeRng('x'));
    expect(away.events).toEqual([{ type: 'rejected', action: 'b1', player: P, reason: 'not at a shop' }]);
    expect(apply(at('s2', { gold: 10 }), buy('potion'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough gold' });
    expect(apply(at('s2', { gold: 100 }), buy('sword'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
    const fighting = apply(at('s0', { steps: 1 }, 1), { type: 'move', id: 'm', player: P, path: ['s1'] }, makeRng('ashford')).state;
    const inFight = { ...fighting, characters: { [P]: { ...me(fighting), space: 's2' } } };
    expect(apply(inFight, buy('potion'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
  });

  it('prices every item and gives each one a use', () => {
    for (const [id, item] of Object.entries(ITEMS)) {
      expect(item.price, id).toBeGreaterThan(0);
      expect(Boolean(item.heal) !== Boolean(item.dice), `${id} is a potion or a dice card`).toBe(true);
    }
  });
});

describe('a potion', () => {
  const inFight = () => {
    const s = apply(at('s0', { steps: 1, hp: 50, items: { potion: 2 } }, 1), { type: 'move', id: 'm', player: P, path: ['s1'] }, makeRng('ashford')).state;
    return { state: s, rng: makeRng('ashford') };
  };

  it('heals in a fight and takes the turn: the enemy strikes back', () => {
    const { state, rng } = inFight();
    const { state: after, events } = apply(state, use('potion'), rng);
    expect(events[0]).toEqual({ type: 'used', action: 'u1', player: P, item: 'potion' });
    expect(events[1]).toEqual({ type: 'healed', action: 'u1', player: P, amount: 40, hp: 90 });
    expect(events[2]).toMatchObject({ type: 'hit', by: 'enemy', move: 'Moor Wolf' });
    expect(me(after).items).toEqual({ potion: 1 });
    expect(me(after).fight?.round).toBe(2);
    const last = apply(after, use('potion', undefined, 'u2'), rng).state;
    expect(me(last).items).toEqual({});
    expect(apply(last, use('potion', undefined, 'u3'), rng).events[0]).toMatchObject({ type: 'rejected', reason: 'none left' });
  });

  it('never heals above the maximum, and is refused outside a fight', () => {
    const { state, rng } = inFight();
    const full = { ...state, characters: { [P]: { ...me(state), hp: 110 } } };
    expect(apply(full, use('potion'), rng).events[1]).toMatchObject({ type: 'healed', amount: 10, hp: 120 });
    expect(apply(at('s0', { hp: 50, items: { potion: 1 } }), use('potion'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
  });
});

describe('the dice cards', () => {
  const pending = (items: Record<string, number>, steps = 3) => at('s0', { steps, items }, steps);

  it('Reroll rolls the die again from the stream and the die shows the new number', () => {
    const { state, events } = apply(pending({ reroll: 1 }), use('reroll'), makeRng('ashford')); // the seed's first roll is a 2
    expect(events).toEqual([
      { type: 'used', action: 'u1', player: P, item: 'reroll' },
      { type: 'steps', action: 'u1', player: P, steps: 2 },
    ]);
    expect(me(state)).toMatchObject({ steps: 2, items: {} });
    expect(state.die.last).toBe(2);
  });

  it('+1 and -1 step the roll by one; -1 never goes below one; a 6 plus one is a walk of seven', () => {
    const up = apply(pending({ 'plus-one': 1 }, 6), use('plus-one'), makeRng('x'));
    expect(up.events[1]).toMatchObject({ type: 'steps', steps: 7 });
    expect(legalPaths(up.state.board, 's0', 7).length).toBeGreaterThan(0);
    const walked = apply(up.state, { type: 'move', id: 'm', player: P, path: legalPaths(up.state.board, 's0', 7)[0]! }, makeRng('x'));
    expect(walked.events[0]).toMatchObject({ type: 'moved' });
    const down = apply(pending({ 'minus-one': 2 }, 1), use('minus-one'), makeRng('x'));
    expect(down.events[1]).toMatchObject({ type: 'steps', steps: 1 });
    expect(me(down.state).items).toEqual({ 'minus-one': 1 });
  });

  it('Exactly N walks the number chosen, inside the die', () => {
    const { state, events } = apply(pending({ exact: 1 }), use('exact', 5), makeRng('x'));
    expect(events[1]).toMatchObject({ type: 'steps', steps: 5 });
    expect(me(state)).toMatchObject({ steps: 5, items: {} });
    expect(state.die.last).toBe(5);
    for (const value of [0, 7, 2.5, undefined]) {
      const r = apply(pending({ exact: 1 }), use('exact', value), makeRng('x'));
      expect(r.events[0], String(value)).toMatchObject({ type: 'rejected', reason: 'bad value' });
      expect(me(r.state).items).toEqual({ exact: 1 });
    }
  });

  it('need a roll pending, no fight, and one in the bag', () => {
    expect(apply(at('s0', { items: { reroll: 1 } }), use('reroll'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    expect(apply(pending({}), use('reroll'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'none left' });
    expect(apply(pending({ reroll: 1 }), use('wand'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
    const fighting = apply(at('s0', { steps: 1, items: { reroll: 1 } }, 1), { type: 'move', id: 'm', player: P, path: ['s1'] }, makeRng('ashford')).state;
    const withSteps = { ...fighting, characters: { [P]: { ...me(fighting), steps: 3 } } };
    expect(apply(withSteps, use('reroll'), makeRng('x')).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
  });

  it('leave the state alone when refused, and never change the state they were given', () => {
    const s = pending({ 'plus-one': 1 });
    const snapshot = structuredClone(s);
    const refused = apply(s, use('exact', 3), makeRng('x'));
    expect(refused.state).toBe(s);
    const ok = apply(s, use('plus-one'), makeRng('x'));
    expect(ok.state).not.toBe(s);
    expect(s).toEqual(snapshot);
  });
});
