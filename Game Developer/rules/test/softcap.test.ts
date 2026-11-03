import { describe, expect, it } from 'vitest';
import { softcap } from '../src/common.ts';
import { apply, dailyPiece, makeRng, newGame, type GameState } from '../src/index.ts';
import { migrate } from '../src/save.ts';

const P = 'p1';
const DAY = Date.UTC(2026, 10, 3, 12);
const at = (space: string, extra: object = {}): GameState => {
  const s = newGame({ seed: 'soft', player: P, name: 'Robin', classId: 'warrior' });
  return { ...s, characters: { [P]: { ...s.characters[P]!, space, gold: 100000, ...extra } } };
};

describe('the softcap (Robin, 2026-11-02)', () => {
  it('pays more for what is above you, less for what is below, and less again past the land', () => {
    expect(softcap(5, 5, 8, false)).toEqual({ xp: 1, gold: 1 });
    expect(softcap(5, 8, 8, false).xp).toBeCloseTo(1.3);
    expect(softcap(5, 12, 12, false).xp).toBeCloseTo(1.3);
    expect(softcap(5, 8, 8, false).gold).toBe(1);
    expect(softcap(6, 5, 8, false).xp).toBeCloseTo(0.85);
    expect(softcap(9, 5, 8, false).xp).toBeCloseTo(0.4);
    // Two past the land's top: half again, but not for its boss.
    expect(softcap(10, 8, 8, false).xp).toBeCloseTo(0.35);
    expect(softcap(10, 8, 8, true).xp).toBeCloseTo(0.7);
    expect(softcap(30, 1, 4, false).xp).toBeCloseTo(0.1);
  });
});

describe("the smith's fine piece", () => {
  it('is one a day, the same all day, rare or better, and dear', () => {
    const s = at('millford');
    const piece = dailyPiece(s, s.characters[P]!, DAY)!;
    expect(piece).toBeTruthy();
    expect(['rare', 'epic', 'legendary', 'uncommon']).toContain(piece.rarity);
    expect(dailyPiece(s, s.characters[P]!, DAY + 1000)).toEqual(piece);
    const r = apply(s, { type: 'buy', id: 'b', player: P, daily: true }, makeRng('b'), DAY);
    const me = r.state.characters[P]!;
    expect(me.gold).toBe(100000 - piece.price);
    expect(me.bag.at(-1)!.name).toBe(piece.name);
    expect(apply(r.state, { type: 'buy', id: 'c', player: P, daily: true }, makeRng('c'), DAY).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(r.state, { type: 'buy', id: 'd', player: P, daily: true }, makeRng('d'), DAY + 86_400_000).state.characters[P]!.bag.length).toBe(me.bag.length + 1);
  });
  it('a herbalist has none', () => {
    const s = at('ashford');
    expect(dailyPiece(s, s.characters[P]!, DAY)).toBeNull();
  });
});

describe('the new level curve', () => {
  it('keeps your level and how far along it you were', () => {
    // Level 4 on the old curve, halfway from 160 to 280.
    const old = { ...at('ashford', { level: 4, xp: 220 }), version: 28 };
    const up = migrate(JSON.parse(JSON.stringify(old)))!;
    const c = up.characters[P]!;
    expect(c.level).toBe(4);
    expect(up.version).toBe(41);
    expect(c.xp).toBeGreaterThan(230);
    expect(c.xp).toBeLessThan(410);
  });
});
