import { describe, expect, it } from 'vitest';
import { apply, ITEMS, makeRng, newGame, shopOffer, type GameState } from '../src/index.ts';

const at = (space: string): GameState => {
  const s = newGame({ seed: 'towns', player: 'p1', name: 'Robin', classId: 'warrior' });
  return { ...s, characters: { p1: { ...s.characters.p1!, space, gold: 5000 } } };
};

describe('towns that differ (Robin, 2026-11-02)', () => {
  it('the herbalist halves the flasks and charges for them so', () => {
    const s = at('ashford');
    const offer = shopOffer(s, s.characters.p1!)!;
    expect(offer.town?.name).toBe('Herbalist');
    expect(offer.price('potion')).toBe(Math.round(ITEMS.potion!.price / 2));
    expect(offer.price('reroll')).toBe(ITEMS.reroll!.price);
    const r = apply(s, { type: 'buy', id: 'b', player: 'p1', item: 'potion' }, makeRng(1));
    expect(r.state.characters.p1!.gold).toBe(5000 - offer.price('potion'));
  });
  it('the master smith sells gear a rank above this land', () => {
    const s = at('millford');
    const offer = shopOffer(s, s.characters.p1!)!;
    expect(offer.lines).toEqual(['light', 'heavy', 'magic']);
    const r = apply(s, { type: 'buy', id: 'b', player: 'p1', slot: 'helm', line: 'heavy' }, makeRng(1));
    const worn = Object.values(r.state.characters.p1!.equipment).find((g) => g?.slot === 'helm');
    expect(worn?.rank ?? r.state.characters.p1!.bag.at(-1)?.rank).toBe(offer.tier);
    expect(offer.tier).toBe(2);
  });
  it('a town still rests you, whatever its kind', () => {
    for (const id of ['ashford', 'millford']) {
      const s = at(id);
      expect(shopOffer(s, s.characters.p1!)?.items.some((i) => ITEMS[i]!.heal)).toBe(true);
    }
  });
});
