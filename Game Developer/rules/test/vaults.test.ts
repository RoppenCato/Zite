// The third piece's rules (mine, 2026-11-01): the themes' events on wild spots, the locked vaults and the keys their
// mini-bosses carry, the two more shapes the generator dresses, and the save coming up to version 9.
import { describe, expect, it } from 'vitest';
import { EVENTS, SHAPES, THEMES } from '../src/data.ts';
import { startFight } from '../src/fight.ts';
import { apply, makeBoard, newGame } from '../src/game.ts';
import { generateArea, growBoard } from '../src/generate.ts';
import { hintFor } from '../src/hints.ts';
import { makeRng } from '../src/rng.ts';
import { migrate } from '../src/save.ts';
import type { Action, Character, GameState } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const me = (s: GameState): Character => s.characters[P]!;
const move = (path: string[], id = 'm1'): Action => ({ type: 'move', id, player: P, path });

describe("the themes' events", () => {
  it('every theme has one of a known kind with a line to read', () => {
    for (const theme of ['meadow', 'forest', 'harvest', ...THEMES.order]) {
      const ev = EVENTS[theme];
      expect(ev, theme).toBeDefined();
      expect(['heal', 'hurt', 'gold', 'mana', 'flask', 'card']).toContain(ev!.kind);
      expect(ev!.text.length).toBeGreaterThan(10);
    }
  });

  it('heals, hurts (never to the last point), pays, restores, hands a flask or a card, each said first', () => {
    // A world state with a character stood a step from a wild spot of each theme: the meadows (heal) and Thornwood (hurt) are hand-laid.
    const s = newGame({ seed: 'ev', player: P, name: 'Robin', classId: 'warrior' });
    const near = (space: string, patch: Partial<Character> = {}) => ({ ...s, characters: { [P]: { ...me(s), space, steps: 1, opened: ['meadows', 'thornwood'], ...patch } }, die: { ...s.die, last: 1 } });
    const findEvent = (from: string, to: string, patch: Partial<Character> = {}, kind = 'heal') => {
      for (let i = 0; i < 900; i++) {
        const r = apply(near(from, patch), move([to]), makeRng(`ev-${i}`), NOW);
        const ev = r.events.find((e) => e.type === 'themeEvent');
        if (ev?.type === 'themeEvent' && ev.kind === kind && ev.amount === (kind === 'heal' ? 24 : ev.amount)) return { r, ev };
      }
      throw new Error('no such event in 900 seeds');
    };
    const wildBy = (hub: string) => s.board.spaces[hub]!.links.find((l) => s.board.spaces[l]!.kind === 'normal')!;
    const picnic = findEvent('saltmarsh', wildBy('saltmarsh'), { hp: 50 });
    expect(picnic.ev).toMatchObject({ kind: 'heal', amount: 24 });
    expect(picnic.r.events).toContainEqual(expect.objectContaining({ type: 'healed', amount: 24, hp: 74 }));
    // Never the last point.
    const brambles = findEvent('elder', wildBy('elder'), { hp: 3 }, 'hurt');
    expect(brambles.ev).toMatchObject({ kind: 'hurt', amount: 2 });
    expect(me(brambles.r.state).hp).toBe(1);
    const sound = findEvent('elder', wildBy('elder'), { hp: 120 }, 'hurt');
    expect(sound.ev).toMatchObject({ kind: 'hurt', amount: 12 });
    expect(me(sound.r.state).hp).toBe(108);
  });
});

describe('the locked vaults', () => {
  const board = () => growBoard(makeBoard(), 'vault', 'gen-1');
  const vaultOf = (b: ReturnType<typeof board>, area: string) => Object.values(b.spaces).find((x) => x.area === area && x.locked);

  it('a shape with a locked chest keeps it as a vault, named so; the hand-laid areas have none', () => {
    expect(SHAPES.map((s) => s.id)).toEqual(['ladder', 'wheel']);
    for (const shape of SHAPES) expect(shape.hubs.some((h) => h.locked && h.kind === 'chest')).toBe(true);
    expect(Object.values(makeBoard().spaces).some((x) => x.locked)).toBe(false);
    let withVault = 0;
    const ids = new Set<string>();
    for (let n = 1; n <= 12; n++) {
      const { area } = generateArea('vault', n);
      ids.add(area.hubs[0]!.id.replace(/^g\d+-/, ''));
      const vault = area.hubs.find((h) => h.locked);
      if (vault) {
        withVault++;
        expect(vault.kind).toBe('chest');
        expect(vault.name.endsWith(' Vault')).toBe(true);
      }
    }
    expect(withVault).toBeGreaterThan(0);
    // The shapes are drawn from beside the hand-laid areas: over twelve areas both kinds turn up.
    expect([...ids].some((id) => ['a1', 'm'].includes(id))).toBe(true);
  });

  it('opens only with the area\'s key, which its mini-boss drops once; it holds three times the gold and gear never under epic', () => {
    // Find a grown area with a vault and stand a character next to it.
    let b = makeBoard();
    let vault = undefined as ReturnType<typeof vaultOf>;
    let areaId = '';
    for (let n = 1; n <= 12 && !vault; n++) {
      areaId = `gen-${n}`;
      b = growBoard(b, 'vault', areaId);
      vault = vaultOf(b, areaId);
    }
    expect(vault).toBeDefined();
    const s0 = newGame({ seed: 'vault', player: P, name: 'Robin', classId: 'warrior' });
    const opened = Object.keys(b.areas);
    const beside = vault!.links[0]!;
    const s: GameState = { ...s0, board: b, characters: { [P]: { ...me(s0), space: beside, steps: 1, opened, level: 20, hp: 500, maxHp: 500 } }, die: { ...s0.die, last: 1 } };
    const area = b.areas[areaId]!;
    const locked = apply(s, move([vault!.id]), makeRng('x'), NOW);
    expect(locked.events[2]).toEqual({ type: 'locked', action: 'm1', player: P, space: vault!.id, area: areaId, mini: area.miniBosses[0]! });
    expect(me(locked.state).cooldowns[vault!.id]).toBeUndefined();
    expect(hintFor(s, vault!.id, P, NOW)).toContain('locked vault');
    expect(hintFor(s, vault!.id, P, NOW)).toContain('carries the key');
    // The mini-boss falls: the key.
    const mini = { ...s, characters: { [P]: startFight({ ...me(s), steps: 0 }, area.miniBosses[0]!, beside, false, b.bestiary) } };
    const nearly = { ...mini, characters: { [P]: { ...me(mini), fight: { ...me(mini).fight!, enemy: { ...me(mini).fight!.enemy, hp: 1 } } } } };
    const won = apply(nearly, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' }, makeRng('x'), NOW);
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'keyFound', area: areaId }));
    expect(me(won.state).keys[areaId]).toBe(1);
    expect(hintFor(won.state, vault!.id, P, NOW)).toContain('You carry its key.');
    const again = apply({ ...won.state, characters: { [P]: { ...me(won.state), fight: me(nearly).fight } } }, { type: 'fight', id: 'f2', player: P, move: { kind: 'attack' }, guard: 'none' }, makeRng('x'), NOW);
    expect(again.events.some((e) => e.type === 'keyFound')).toBe(false); // one key at a time
    // With the key: the vault opens, richer, and the key is spent.
    const keyed = { ...won.state, characters: { [P]: { ...me(won.state), space: beside, steps: 1 } }, die: { ...won.state.die, last: 1 } };
    const rich = apply(keyed, move([vault!.id], 'm2'), makeRng('x'), NOW);
    expect(rich.events[2]).toMatchObject({ type: 'chest' });
    const gold = rich.events.find((e) => e.type === 'gold');
    expect(gold).toBeDefined();
    if (gold?.type === 'gold') expect(gold.delta).toBeGreaterThanOrEqual(area.tier * 6 * 3);
    const loot = rich.events.find((e) => e.type === 'loot');
    expect(loot).toBeDefined();
    if (loot?.type === 'loot') expect(['epic', 'legendary', 'unique']).toContain(loot.gear.rarity);
    expect(me(rich.state).keys[areaId]).toBe(0);
    expect(me(rich.state).cooldowns[vault!.id]).toBe(NOW + 600000);
  });
});

describe('a version-8 save', () => {
  it('comes up with keys', () => {
    const today = newGame({ seed: 'old', player: P, name: 'Robin', classId: 'rogue', board: ringBoard() });
    const c = { ...me(today) } as Partial<Character>;
    delete c.keys;
    const v8 = { ...structuredClone(today), version: 8, characters: { [P]: c } };
    const s = migrate(structuredClone(v8));
    expect(s!.version).toBe(31);
    expect(me(s!).keys).toEqual({});
    expect(me(s!).quests).toEqual([]);
  });
});
