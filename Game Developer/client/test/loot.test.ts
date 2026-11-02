// The loot reveal's pure parts: which prizes a landing's or a fight's events put on cards, the colour a reveal glows in,
// and the words on a card. The scene itself is judged in the browser pane.

import { describe, expect, it } from 'vitest';
import { makeRng, makeUnique, plainGear, UNIQUE_IDS, type GameEvent, type GearItem } from '../../rules/src/index.ts';
import { cardWords, gearIn, prizesIn, tierOf } from '../src/loot.ts';

const action = 'a1';
const player = 'p1';
const sword = plainGear('g1', 'weapon', 1);
const rareBoots: GearItem = { ...plainGear('g2', 'boots', 2), rarity: 'rare', name: 'Quickstep', affixes: [{ kind: 'dodge', value: 0.08 }] };
const unique = makeUnique('g3', UNIQUE_IDS[0]!, 3, makeRng(7));

describe('prizesIn', () => {
  it('puts everything a chest held on cards, in order', () => {
    const events: GameEvent[] = [
      { type: 'chest', action, player },
      { type: 'gold', action, player, delta: 30, gold: 130 },
      { type: 'loot', action, player, gear: sword },
      { type: 'found', action, player, item: 'potion', count: 1 },
    ];
    expect(prizesIn(events)).toEqual([
      { kind: 'gold', amount: 30 },
      { kind: 'gear', gear: sword, sold: null },
      { kind: 'item', item: 'potion', count: 1 },
    ]);
  });

  it('marks a piece the full bag sold at once, and keeps one left to the keep-or-sell question', () => {
    const sold: GameEvent[] = [
      { type: 'chest', action, player },
      { type: 'loot', action, player, gear: sword },
      { type: 'bagFull', action, player, gear: sword, sold: 12 },
    ];
    expect(prizesIn(sold)).toEqual([{ kind: 'gear', gear: sword, sold: 12 }]);
    const asked: GameEvent[] = [
      { type: 'loot', action, player, gear: sword },
      { type: 'bagFull', action, player, gear: sword, sold: null },
    ];
    expect(prizesIn(asked)).toEqual([{ kind: 'gear', gear: sword, sold: null }]);
  });

  it('without a chest, only gear is a prize: gold and flasks from elsewhere stay in the message line', () => {
    const events: GameEvent[] = [
      { type: 'gold', action, player, delta: 8, gold: 108 },
      { type: 'found', action, player, item: 'potion', count: 1 },
      { type: 'loot', action, player, gear: rareBoots },
    ];
    expect(prizesIn(events)).toEqual([{ kind: 'gear', gear: rareBoots, sold: null }]);
    expect(prizesIn([{ type: 'gold', action, player, delta: 8, gold: 108 }])).toEqual([]);
  });

  it('a fight reveals its drop and nothing else', () => {
    const events: GameEvent[] = [
      { type: 'won', action, player, xp: 20, gold: 9 },
      { type: 'gold', action, player, delta: 9, gold: 109 },
      { type: 'loot', action, player, gear: rareBoots },
      { type: 'found', action, player, item: 'potion', count: 1 },
    ];
    expect(gearIn(events)).toEqual([{ kind: 'gear', gear: rareBoots, sold: null }]);
  });
});

describe('tierOf', () => {
  it('is the best rarity among the gear, or gold without gear', () => {
    expect(tierOf([{ kind: 'gear', gear: sword, sold: null }, { kind: 'gear', gear: rareBoots, sold: null }])).toBe('rare');
    expect(tierOf([{ kind: 'gear', gear: unique, sold: null }, { kind: 'gear', gear: rareBoots, sold: null }])).toBe('unique');
    expect(tierOf([{ kind: 'gold', amount: 5 }, { kind: 'item', item: 'potion', count: 1 }])).toBe('gold');
  });
});

describe('cardWords', () => {
  it('a plain piece: its name, its rarity and its numbers', () => {
    const w = cardWords({ kind: 'gear', gear: sword, sold: null });
    expect(w.name).toBe(sword.name);
    expect(w.power.startsWith('Common · +')).toBe(true);
    expect(w.square).toBe('Weapon');
    expect(w.tier).toBe('common');
  });

  it('a named piece says what it is under the name; a unique says only that it is one', () => {
    const boots = cardWords({ kind: 'gear', gear: rareBoots, sold: null });
    expect(boots.power.startsWith('Rare copper boots · ')).toBe(true);
    expect(boots.power).toContain('%');
    const u = cardWords({ kind: 'gear', gear: unique, sold: null });
    expect(u.name).toBe(unique.name);
    expect(u.power.startsWith('Unique ')).toBe(true);
    expect(u.tier).toBe('unique');
  });

  it('a piece sold for lack of room says so; gold and items have their own words', () => {
    expect(cardWords({ kind: 'gear', gear: sword, sold: 12 }).power.endsWith('no room: sold for 12 gold')).toBe(true);
    expect(cardWords({ kind: 'gold', amount: 48 })).toMatchObject({ name: '48 gold', tier: 'gold', square: 'Gold' });
    expect(cardWords({ kind: 'item', item: 'potion', count: 2 })).toMatchObject({ name: '2 Health Potion', square: 'Flask', tier: 'gold' });
    expect(cardWords({ kind: 'item', item: 'reroll', count: 1 })).toMatchObject({ name: 'Do-Over', square: 'Card' });
  });
});
