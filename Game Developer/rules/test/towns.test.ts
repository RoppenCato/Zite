import { describe, expect, it } from 'vitest';
import { apply, ITEMS, makeRng, newGame, plainGear, shopOffer, shopStall, type GameState } from '../src/index.ts';

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
    for (const g of shopStall(s, s.characters.p1!)) expect(g.rank).toBe(offer.tier);
    expect(offer.tier).toBe(2);
  });
  it('a town still rests you, whatever its kind', () => {
    for (const id of ['ashford', 'millford']) {
      const s = at(id);
      expect(shopOffer(s, s.characters.p1!)?.items.some((i) => ITEMS[i]!.heal)).toBe(true);
    }
  });
});

describe('the master smith reforges (2026-11-03)', () => {
  const P = 'p1';
  const smith = (patch: Partial<GameState['characters'][string]>): GameState => {
    const s = newGame({ seed: 'reforge', player: P, name: 'Robin', classId: 'warrior' });
    return { ...s, characters: { [P]: { ...s.characters[P]!, space: 'millford', gold: 100000, ...patch } } };
  };
  const helm = (rarity: 'common' | 'epic', rank = 1) => ({ ...plainGear('h1', 'helm', rank), rarity }) as ReturnType<typeof plainGear>;
  it('raises a piece you love one rank, its numbers with it, for its new price', () => {
    const s = smith({ equipment: { ...newGame({ seed: 'x', player: P, name: 'R', classId: 'warrior' }).characters[P]!.equipment, helm: helm('epic') } });
    const r = apply(s, { type: 'buy', id: 'b', player: P, reforge: 'h1' }, makeRng('b'), 0);
    const up = r.state.characters[P]!.equipment.helm!;
    expect(up.rank).toBe(2);
    expect(up.stats.maxHp!).toBeGreaterThan(helm('epic').stats.maxHp!);
    expect(up.price).toBeGreaterThan(helm('epic').price);
    expect(r.state.characters[P]!.gold).toBe(100000 - up.price);
    expect(r.events[0]).toMatchObject({ type: 'bought', gear: { id: 'h1', rank: 2 }, price: up.price });
  });
  it('never a plain piece, never past the rank the smith makes, and only at a master smith', () => {
    const eq = newGame({ seed: 'x', player: P, name: 'R', classId: 'warrior' }).characters[P]!.equipment;
    expect(apply(smith({ equipment: { ...eq, helm: helm('common') } }), { type: 'buy', id: 'b', player: P, reforge: 'h1' }, makeRng('b'), 0).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(smith({ equipment: { ...eq, helm: helm('epic', 2) } }), { type: 'buy', id: 'b', player: P, reforge: 'h1' }, makeRng('b'), 0).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(smith({ space: 'ashford', equipment: { ...eq, helm: helm('epic') } }), { type: 'buy', id: 'b', player: P, reforge: 'h1' }, makeRng('b'), 0).events[0]).toMatchObject({ type: 'rejected' });
  });
});
