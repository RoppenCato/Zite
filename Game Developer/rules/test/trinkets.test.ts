// Trinkets (Robin, 2026-11-03: "There will be no necklaces, instead its gonna be trinkets for that slot"): each a passive of its
// own; Robin's five examples one by one, how they are found, and old saves' necklaces turned into trinkets.
import { describe, expect, it } from 'vitest';
import { GEAR, TRINKET_IDS, TRINKETS } from '../src/data.ts';
import { startFight } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { gearPowers, makeTrinket, rollGear, stats } from '../src/gear.ts';
import { makeRng } from '../src/rng.ts';
import { migrate } from '../src/save.ts';
import type { Action, Character, ClassId, Enemy, GameEvent, GameState, GearItem } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const me = (s: GameState): Character => s.characters[P]!;
const attack: Action = { type: 'fight', id: 'f1', player: P, move: { kind: 'attack' }, guard: 'none' } as Action;
const playerHits = (events: GameEvent[]) => events.filter((e): e is Extract<GameEvent, { type: 'hit' }> => e.type === 'hit' && e.by === 'player');

/** A character wearing this trinket alone (or nothing), at the ring's first spot. */
function wearing(trinket: string | null, classId: ClassId = 'warrior', patch: Partial<Character> = {}): GameState {
  const s = newGame({ seed: 't', player: P, name: 'Robin', classId, board: ringBoard() });
  const c = { ...me(s), equipment: { ...me(s).equipment, trinket: trinket ? makeTrinket('t1', trinket) : null }, ...patch };
  return { ...s, characters: { [P]: c } };
}
/** That character in a fight with a slime, patched. */
function versus(s: GameState, enemy: Partial<Enemy> = {}): GameState {
  const fighting = startFight({ ...me(s), space: 's1' }, 'slime', 's1', false);
  fighting.fight = { ...fighting.fight!, enemy: { ...fighting.fight!.enemy, hp: 100000, maxHp: 100000, attack: 0, ...enemy } };
  return { ...s, characters: { [P]: fighting } };
}

describe('the trinkets', () => {
  it('a bunch of them, every land and every rarity, each with its words and a look for the icon', () => {
    expect(TRINKET_IDS.length).toBeGreaterThanOrEqual(30);
    for (let tier = 1; tier <= 8; tier++) expect(TRINKET_IDS.some((id) => TRINKETS[id]!.tier === tier), `tier ${tier}`).toBe(true);
    for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary']) expect(TRINKET_IDS.some((id) => TRINKETS[id]!.rarity === r), r).toBe(true);
    for (const id of TRINKET_IDS) {
      const t = TRINKETS[id]!;
      expect(t.power || t.traits || t.affixes, id).toBeTruthy();
      expect(t.text.length, id).toBeGreaterThan(8);
      expect(t.look.length, id).toBeGreaterThan(3);
    }
  });
  it('a trinket is its passive and nothing else: no numbers, its words once', () => {
    const g = makeTrinket('x', 'travellers-bread');
    expect(g).toMatchObject({ slot: 'trinket', rarity: 'common', trinket: 'travellers-bread', stats: {} });
    expect(gearPowers(g)).toEqual([TRINKETS['travellers-bread']!.text]);
  });
  it('found where the land has reached its tier, never sold on the shelves', () => {
    for (let i = 0; i < 300; i++) {
      const tier = 1 + (i % 8);
      const g = rollGear(`g${i}`, 'trinket', tier, i % 4, makeRng(`t${i}`));
      expect(g.trinket, `${i}`).toBeTruthy();
      expect(TRINKETS[g.trinket!]!.tier).toBeLessThanOrEqual(tier);
    }
    const s = wearing(null);
    const town = Object.values(s.board.spaces).find((x) => x.kind === 'town')!;
    const at = { ...s, characters: { [P]: { ...me(s), space: town.id, gold: 100000 } } };
    expect(apply(at, { type: 'buy', id: 'b', player: P, slot: 'trinket' } as Action, makeRng('b'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });
});

describe("Robin's five", () => {
  it("Traveller's Bread: 10 HP after a fight won out in the world", () => {
    const won = (trinket: string | null) => {
      const s = versus(wearing(trinket, 'warrior', { hp: 50 }), { hp: 1, maxHp: 1 });
      return apply(s, attack, makeRng('w'), NOW);
    };
    const plain = won(null);
    const fed = won('travellers-bread');
    expect(me(fed.state).hp).toBe(me(plain.state).hp + 10);
    expect(fed.events.some((e) => e.type === 'healed' && e.amount === 10)).toBe(true);
  });
  it('Twin Fangs: twice the hits at half the damage, so a Rogue strikes six times', () => {
    const swing = (trinket: string | null, classId: ClassId) => playerHits(apply(versus(wearing(trinket, classId)), attack, makeRng('a'), NOW).events).filter((h) => h.move === 'Attack');
    expect(swing(null, 'warrior')).toHaveLength(1);
    expect(swing('twin-fangs', 'warrior')).toHaveLength(2);
    expect(swing(null, 'rogue')).toHaveLength(3);
    expect(swing('twin-fangs', 'rogue')).toHaveLength(6);
    const total = (hs: { damage: number; crit: boolean }[]) => hs.filter((h) => !h.crit).reduce((n, h) => n + h.damage, 0) / Math.max(1, hs.filter((h) => !h.crit).length);
    expect(total(swing('twin-fangs', 'warrior'))).toBeLessThan(total(swing(null, 'warrior')) * 0.7);
  });
  it("Gambler's Die: a 5 may be walked as 4, 5 or 6; without it, only 5", () => {
    const s = wearing(null);
    const path = (n: number): string[] => {
      const out: string[] = [];
      let here = me(s).space;
      let back: string | null = null;
      for (let i = 0; i < n; i++) {
        const next = s.board.spaces[here]!.links.find((l) => l !== back)!;
        out.push(next);
        back = here;
        here = next;
      }
      return out;
    };
    const walk = (trinket: string | null, n: number) => {
      const w = wearing(trinket, 'warrior', { steps: 5 });
      return apply(w, { type: 'move', id: 'm', player: P, path: path(n) } as Action, makeRng('m'), NOW).events[0];
    };
    expect(walk(null, 4)).toMatchObject({ type: 'rejected' });
    expect(walk(null, 6)).toMatchObject({ type: 'rejected' });
    for (const n of [4, 5, 6]) expect(walk('gamblers-die', n), `${n}`).not.toMatchObject({ type: 'rejected' });
    expect(walk('gamblers-die', 3)).toMatchObject({ type: 'rejected' });
    expect(walk('seven-league-pebble', 3)).not.toMatchObject({ type: 'rejected' });
  });
  it('Sapphire Tear: three more mana each round', () => {
    const round = (trinket: string | null) => me(apply(versus(wearing(trinket, 'mage', { mana: 0 })), { ...attack, guard: 'none' } as Action, makeRng('r'), NOW).state).mana;
    expect(round('sapphire-tear')).toBe(round(null) + 3);
  });
  it('Storm Charm: now and then an Attack calls down lightning; an ordinary creature loses its next move, a boss does not', () => {
    let struck: GameEvent[] | null = null;
    for (let i = 0; i < 400 && !struck; i++) {
      const r = apply(versus(wearing('storm-charm')), attack, makeRng(`l${i}`), NOW);
      if (playerHits(r.events).some((h) => h.move === 'Lightning')) struck = r.events;
    }
    expect(struck).not.toBeNull();
    expect(struck!.some((e) => e.type === 'effect' && e.kind === 'stunned')).toBe(true);
    let boss: GameEvent[] | null = null;
    for (let i = 0; i < 400 && !boss; i++) {
      const r = apply(versus(wearing('storm-charm'), { role: 'boss' }), attack, makeRng(`b${i}`), NOW);
      if (playerHits(r.events).some((h) => h.move === 'Lightning')) boss = r.events;
    }
    expect(boss!.some((e) => e.type === 'resisted' && e.kind === 'stunned')).toBe(true);
  });
});

describe('the rest, and old saves', () => {
  it('the Owl Feather: at night the wild is no stronger against you, and still pays more', () => {
    const s = newGame({ seed: 'night', player: P, name: 'Robin', classId: 'warrior' });
    const space = Object.values(s.board.spaces).find((x) => x.area === 'meadows' && x.kind === 'normal' && x.links.length)!;
    const met = (trinket: string | null): Enemy | null => {
      const c = { ...s.characters[P]!, clock: 25, space: space.links[0]!, steps: 1, equipment: { ...s.characters[P]!.equipment, trinket: trinket ? makeTrinket('t', trinket) : null } };
      for (let i = 0; i < 400; i++) {
        const r = apply({ ...s, characters: { [P]: c } }, { type: 'move', id: 'm', player: P, path: [space.id] } as Action, makeRng(`owl-${i}`), 0);
        const f = r.state.characters[P]!.fight;
        if (f && f.enemy.role === 'mob') return f.enemy;
      }
      return null;
    };
    const plain = met(null)!;
    const owl = met('owl-feather')!;
    expect(owl.id).toBe(plain.id);
    expect(owl.attack).toBeLessThan(plain.attack);
    expect(owl.xp).toBe(plain.xp);
  });
  it('a stat-free trinket leaves the numbers as they were; a King’s Seal lifts them', () => {
    const bare = stats(me(wearing(null)));
    expect(stats(me(wearing('travellers-bread'))).maxHp).toBe(bare.maxHp);
    expect(stats(me(wearing('kings-seal'))).maxHp).toBeGreaterThan(bare.maxHp);
  });
  it('an old save: a unique charm becomes its trinket, a plain necklace a trinket of its rarity, the same each time', () => {
    const s = newGame({ seed: 'old', player: P, name: 'Robin', classId: 'warrior' });
    const necklace: GearItem = { id: 'n1', slot: 'trinket', rank: 3, rarity: 'rare', name: 'Iron Charm of Luck', base: 'iron charm', stats: { maxHp: 34 }, affixes: [{ kind: 'luck', value: 0.2 }], price: 180 };
    const heart: GearItem = { id: 'n2', slot: 'trinket', rank: 2, rarity: 'unique', name: 'Heartstone', base: 'copper charm', stats: { maxHp: 30 }, affixes: [], unique: 'heartstone', price: 400 };
    const old = { ...s, version: 39, characters: { [P]: { ...me(s), equipment: { ...me(s).equipment, trinket: necklace }, bag: [heart] } } };
    const up = migrate(JSON.parse(JSON.stringify(old)))!;
    const c = up.characters[P]!;
    expect(up.version).toBe(41);
    expect(c.equipment.trinket).toMatchObject({ id: 'n1', rarity: 'rare', stats: {} });
    expect(TRINKETS[c.equipment.trinket!.trinket!]!.rarity).toBe('rare');
    expect(TRINKETS[c.equipment.trinket!.trinket!]!.tier).toBeLessThanOrEqual(3);
    expect(c.bag[0]).toMatchObject({ id: 'n2', trinket: 'heartstone', rarity: 'epic' });
    expect(c.bag[0]!.unique).toBeUndefined();
    expect(migrate(JSON.parse(JSON.stringify(old)))!.characters[P]!.equipment.trinket!.trinket).toBe(c.equipment.trinket!.trinket);
    void GEAR;
  });
});
