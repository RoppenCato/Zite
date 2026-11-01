import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data.ts';
import { apply, newGame } from '../src/game.ts';
import { plainGear, stats } from '../src/gear.ts';
import { legalPaths } from '../src/paths.ts';
import { makeRng } from '../src/rng.ts';
import type { Action, Character, GameState, Slot } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
// The ring: s0 town, s1 wilds, s2 Tinker Cart (shop), s3 wilds.
function at(space: string, patch: Partial<Character> = {}, last: number | null = null): GameState {
  const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
  return { ...s, characters: { [P]: { ...s.characters[P]!, space, ...patch } }, die: { ...s.die, last } };
}
const buy = (what: { item?: string; slot?: Slot }, id = 'b1'): Action => ({ type: 'buy', id, player: P, ...what });
const use = (item: string, value?: number, id = 'u1'): Action => ({ type: 'use', id, player: P, item, ...(value !== undefined ? { value } : {}) });
const me = (s: GameState): Character => s.characters[P]!;

describe('the shop', () => {
  it('sells a consumable for its price and the plain gear of its area\'s rank for a slot, when standing on a shop or in a town', () => {
    const { state, events } = apply(at('s2', { gold: 200 }), buy({ item: 'potion' }), makeRng('x'), NOW);
    expect(events).toEqual([{ type: 'bought', action: 'b1', player: P, item: 'potion', gear: null, price: 25, gold: 175 }]);
    expect(me(state)).toMatchObject({ gold: 175, items: { potion: 1 } });
    const sword = apply(state, buy({ slot: 'weapon' }, 'b2'), makeRng('x'), NOW);
    // The weapon's slot is empty: it goes straight on (Robin, 2026-11-01). A second one goes into the bag.
    expect(sword.events).toEqual([
      { type: 'bought', action: 'b2', player: P, item: null, gear: plainGear('g1', 'weapon', 1), price: 30, gold: 145 },
      { type: 'equipped', action: 'b2', player: P, gear: plainGear('g1', 'weapon', 1), replaced: null },
    ]);
    expect(me(sword.state).bag).toEqual([]);
    expect(me(sword.state).equipment.weapon).toEqual(plainGear('g1', 'weapon', 1));
    expect(sword.state.nextItem).toBe(2);
    const second = apply(sword.state, buy({ slot: 'weapon' }, 'b3'), makeRng('x'), NOW);
    expect(me(second.state).bag).toEqual([plainGear('g2', 'weapon', 1)]);
    expect(me(second.state).equipment.weapon?.id).toBe('g1');
    const inTown = apply(at('s0', { gold: 200 }), buy({ slot: 'helm' }), makeRng('x'), NOW);
    expect(inTown.events[0]).toMatchObject({ type: 'bought', gear: expect.objectContaining({ name: 'Tin Hat' }), price: 20 });
    const camped = { ...at('s1', { gold: 200 }), spawns: { s1: { kind: 'merchant' as const, enemy: null, until: NOW + 1 } } };
    expect(apply(camped, buy({ item: 'reroll' }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'bought', item: 'reroll', price: 20 });
  });

  it('refuses away from a shop, without the gold, for a thing it does not sell, and in a fight', () => {
    expect(apply(at('s1', { gold: 50 }), buy({ item: 'potion' }), makeRng('x'), NOW).events).toEqual([{ type: 'rejected', action: 'b1', player: P, reason: 'not at a shop' }]);
    expect(apply(at('s2', { gold: 10 }), buy({ item: 'potion' }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough gold' });
    expect(apply(at('s2', { gold: 10 }), buy({ slot: 'weapon' }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough gold' });
    expect(apply(at('s2', { gold: 100 }), buy({ item: 'sword' }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
    expect(apply(at('s2', { gold: 100 }), buy({}), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
    expect(apply(at('s2', { gold: 100 }), buy({ slot: 'hat' as Slot }), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
  });

  it('buys back what you carry for half its worth, at a shop, never what you wear', () => {
    const sword = plainGear('g9', 'weapon', 2);
    const { state, events } = apply(at('s2', { gold: 10, bag: [sword] }), { type: 'sell', id: 's1', player: P, gear: 'g9' }, makeRng('x'), NOW);
    expect(events).toEqual([{ type: 'sold', action: 's1', player: P, gear: sword, price: 45, gold: 55 }]);
    expect(me(state).bag).toEqual([]);
    expect(apply(at('s2', { bag: [sword] }), { type: 'sell', id: 's1', player: P, gear: 'nope' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such gear' });
    expect(apply(at('s1', { bag: [sword] }), { type: 'sell', id: 's1', player: P, gear: 'g9' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not at a shop' });
    const worn = at('s2', { equipment: { weapon: sword, shield: null, helm: null, armour: null, gloves: null, boots: null, cape: null, trinket: null } });
    expect(apply(worn, { type: 'sell', id: 's1', player: P, gear: 'g9' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such gear' });
  });

  it('prices every item and gives each one a use', () => {
    for (const [id, item] of Object.entries(ITEMS)) {
      expect(item.price, id).toBeGreaterThan(0);
      expect(Boolean(item.healShare || item.manaShare) !== Boolean(item.dice), `${id} is a potion or a dice card`).toBe(true);
    }
  });
});

describe('the wardrobe', () => {
  const sword = plainGear('g1', 'weapon', 1);
  const better = { ...plainGear('g2', 'weapon', 2), rarity: 'rare' as const, affixes: [{ kind: 'crit' as const, value: 0.1 }] };
  const helm = plainGear('g3', 'helm', 1);

  it('equips from the bag into the piece\'s slot, swapping out what was worn; the numbers follow', () => {
    const start = at('s1', { bag: [sword, better, helm] });
    expect(stats(me(start)).attack).toBe(12);
    const one = apply(start, { type: 'equip', id: 'e1', player: P, gear: 'g1' }, makeRng('x'), NOW);
    expect(one.events).toEqual([{ type: 'equipped', action: 'e1', player: P, gear: sword, replaced: null }]);
    expect(me(one.state).equipment.weapon).toEqual(sword);
    expect(me(one.state).bag.map((g) => g.id)).toEqual(['g2', 'g3']);
    expect(stats(me(one.state)).attack).toBe(16);
    const two = apply(one.state, { type: 'equip', id: 'e2', player: P, gear: 'g2' }, makeRng('x'), NOW);
    expect(two.events).toEqual([{ type: 'equipped', action: 'e2', player: P, gear: better, replaced: sword }]);
    expect(me(two.state).bag.map((g) => g.id)).toEqual(['g3', 'g1']);
    expect(stats(me(two.state))).toMatchObject({ attack: 20, crit: 0.2 });
    const three = apply(two.state, { type: 'equip', id: 'e3', player: P, gear: 'g3' }, makeRng('x'), NOW);
    expect(stats(me(three.state)).maxHp).toBe(132);
    expect(me(three.state).hp).toBe(120); // worn, not healed
  });

  it('unequips into the bag and caps HP and mana at the new maximum', () => {
    const worn = at('s1', { hp: 132, maxHp: 120, mana: 26, maxMana: 20, equipment: { shield: null, gloves: null, cape: null, weapon: null, armour: null, helm, boots: null, trinket: plainGear('g4', 'trinket', 1) } });
    const bare = apply(worn, { type: 'unequip', id: 'u1', player: P, slot: 'helm' }, makeRng('x'), NOW);
    expect(bare.events).toEqual([{ type: 'unequipped', action: 'u1', player: P, gear: helm }]);
    expect(me(bare.state)).toMatchObject({ hp: 120, mana: 26 });
    expect(me(bare.state).bag).toEqual([helm]);
    const barer = apply(bare.state, { type: 'unequip', id: 'u2', player: P, slot: 'trinket' }, makeRng('x'), NOW);
    expect(me(barer.state).mana).toBe(20);
    expect(apply(barer.state, { type: 'unequip', id: 'u3', player: P, slot: 'trinket' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such gear' });
    expect(apply(barer.state, { type: 'equip', id: 'e', player: P, gear: 'nope' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such gear' });
  });

  it('drops a piece from the bag for good', () => {
    const { state, events } = apply(at('s1', { bag: [sword, helm] }), { type: 'drop', id: 'd1', player: P, gear: 'g1' }, makeRng('x'), NOW);
    expect(events).toEqual([{ type: 'dropped', action: 'd1', player: P, gear: sword }]);
    expect(me(state).bag).toEqual([helm]);
    expect(apply(state, { type: 'drop', id: 'd2', player: P, gear: 'g1' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such gear' });
  });
});

describe('the dice cards', () => {
  const pending = (items: Record<string, number>, steps = 3) => at('s0', { steps, items }, steps);

  it('Do-Over rolls the die again from the stream and the die shows the new number', () => {
    const { state, events } = apply(pending({ reroll: 1 }), use('reroll'), makeRng('ashford'), NOW); // the seed's first roll is a 2
    expect(events).toEqual([
      { type: 'used', action: 'u1', player: P, item: 'reroll' },
      { type: 'steps', action: 'u1', player: P, steps: 2 },
    ]);
    expect(me(state)).toMatchObject({ steps: 2, items: {} });
    expect(state.die.last).toBe(2);
  });

  it('+1 and -1 step the roll by one; -1 never goes below one; a 6 plus one is a walk of seven', () => {
    const up = apply(pending({ 'plus-one': 1 }, 6), use('plus-one'), makeRng('x'), NOW);
    expect(up.events[1]).toMatchObject({ type: 'steps', steps: 7 });
    expect(legalPaths(up.state.board, 's0', 7).length).toBeGreaterThan(0);
    const walked = apply(up.state, { type: 'move', id: 'm', player: P, path: legalPaths(up.state.board, 's0', 7)[0]! }, makeRng('x'), NOW);
    expect(walked.events[0]).toMatchObject({ type: 'moved' });
    const down = apply(pending({ 'minus-one': 2 }, 1), use('minus-one'), makeRng('x'), NOW);
    expect(down.events[1]).toMatchObject({ type: 'steps', steps: 1 });
    expect(me(down.state).items).toEqual({ 'minus-one': 1 });
  });

  it('Fairy Pick walks the number chosen, inside the die', () => {
    const { state, events } = apply(pending({ exact: 1 }), use('exact', 5), makeRng('x'), NOW);
    expect(events[1]).toMatchObject({ type: 'steps', steps: 5 });
    expect(me(state)).toMatchObject({ steps: 5, items: {} });
    expect(state.die.last).toBe(5);
    for (const value of [0, 7, 2.5, undefined]) {
      const r = apply(pending({ exact: 1 }), use('exact', value), makeRng('x'), NOW);
      expect(r.events[0], String(value)).toMatchObject({ type: 'rejected', reason: 'bad value' });
      expect(me(r.state).items).toEqual({ exact: 1 });
    }
  });

  it('need a roll pending, the board free, and one in the bag; a potion is no card', () => {
    expect(apply(at('s0', { items: { reroll: 1 } }), use('reroll'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    expect(apply(pending({}), use('reroll'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'none left' });
    expect(apply(pending({ reroll: 1 }), use('wand'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
    expect(apply(pending({ potion: 1 }), use('potion'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    const asked = pending({ reroll: 1 });
    expect(apply({ ...asked, characters: { [P]: { ...me(asked), offer: { kind: 'gamble', stake: 5 } } } }, use('reroll'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'answer first' });
    const fighting = apply(at('s0', { steps: 1, items: { reroll: 1 } }, 1), { type: 'move', id: 'm', player: P, path: ['s1'] }, makeRng('ashford'), NOW).state;
    const withSteps = { ...fighting, characters: { [P]: { ...me(fighting), steps: 3 } } };
    expect(apply(withSteps, use('reroll'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
  });

  it('leave the state alone when refused, and never change the state they were given', () => {
    const s = pending({ 'plus-one': 1 });
    const snapshot = structuredClone(s);
    const refused = apply(s, use('exact', 3), makeRng('x'), NOW);
    expect(refused.state).toBe(s);
    const ok = apply(s, use('plus-one'), makeRng('x'), NOW);
    expect(ok.state).not.toBe(s);
    expect(s).toEqual(snapshot);
  });
});
