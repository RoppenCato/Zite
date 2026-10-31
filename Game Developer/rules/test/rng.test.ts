import { describe, expect, it } from 'vitest';
import { hashSeed, makeRng, resumeRng } from '../src/rng.ts';

describe('the seeded random stream', () => {
  it('turns a seed string into a fixed starting state', () => {
    expect(hashSeed('ashford')).toBe(1586598026);
    expect(hashSeed('ashford')).toBe(hashSeed('ashford'));
    expect(hashSeed('ashford')).not.toBe(hashSeed('ashforD'));
  });

  it('gives the same dice from the same seed, every time', () => {
    const a = makeRng('ashford');
    const b = makeRng('ashford');
    const rollsA = Array.from({ length: 8 }, () => a.int(6));
    const rollsB = Array.from({ length: 8 }, () => b.int(6));
    expect(rollsA).toEqual([2, 1, 5, 6, 6, 6, 6, 4]);
    expect(rollsB).toEqual(rollsA);
    expect(Array.from({ length: 5 }, () => makeRng(12345).int(6))[0]).toBe(6);
  });

  it('picks up where it left off from a stored state', () => {
    const a = makeRng('ashford');
    a.int(6);
    expect(a.state).toBe(3418163839);
    const b = resumeRng(a.state);
    expect(Array.from({ length: 7 }, () => b.int(6))).toEqual([1, 5, 6, 6, 6, 6, 4]);
    expect(Array.from({ length: 7 }, () => a.int(6))).toEqual([1, 5, 6, 6, 6, 6, 4]);
  });

  it('rolls every face of a die, and nothing off it', () => {
    const r = makeRng('faces');
    const counts = new Map<number, number>();
    for (let i = 0; i < 6000; i++) {
      const v = r.int(6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const n of counts.values()) expect(n).toBeGreaterThan(700);
  });

  it('keeps next() inside [0, 1)', () => {
    const r = makeRng(7);
    for (let i = 0; i < 10000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
