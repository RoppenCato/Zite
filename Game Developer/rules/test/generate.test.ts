import { describe, expect, it } from 'vitest';
import { ENEMIES, THEMES } from '../src/data.ts';
import { startFight } from '../src/fight.ts';
import { apply, makeBoard, newGame } from '../src/game.ts';
import { cellFor, generateArea, grownIndex, growBoard, peekArea } from '../src/generate.ts';
import { hintFor } from '../src/hints.ts';
import { legalPaths, nearestTown } from '../src/paths.ts';
import { makeRng } from '../src/rng.ts';
import type { Board, Character, GameEvent, GameState } from '../src/types.ts';
import { grownWorld } from './fixtures/grown.ts';

const P = 'p1';
const NOW = 1_000_000;
const me = (s: GameState): Character => s.characters[P]!;
const CELL = THEMES.cell;

describe('peeking at a grown area', () => {
  it('numbers them from 1, a tier each above Frostpeak, four levels a tier', () => {
    expect(peekArea('ashford', 1)).toEqual({ id: 'gen-1', name: 'Glimmerlake Shores', theme: 'glimmerlake', tier: 4, levels: [12, 16] });
    expect(peekArea('ashford', 2)).toMatchObject({ id: 'gen-2', theme: 'moonwhisper', tier: 5, levels: [16, 20] });
    expect(peekArea('ashford', 8)).toMatchObject({ theme: 'embercrown', tier: 11, levels: [40, 44] });
  });

  it('cycles the themes, taking a new name of the theme each round, the same for every seed', () => {
    expect(peekArea('ashford', 9)).toMatchObject({ theme: 'shattered', name: 'The Shattered Crown', tier: 12 });
    expect(peekArea('ashford', 17)).toMatchObject({ theme: 'embercrown', name: 'Ashen Nest' });
    expect(peekArea('moon', 9)).toEqual(peekArea('ashford', 9));
  });

  it('reads the number from a grown id and nothing from a hand-laid one', () => {
    expect(grownIndex('gen-1')).toBe(1);
    expect(grownIndex('gen-12')).toBe(12);
    expect(grownIndex('meadows')).toBeNull();
    expect(grownIndex('gen-')).toBeNull();
    expect(grownIndex('gen-1x')).toBeNull();
  });
});

describe('the cells', () => {
  it('snake east from the third column, two cells tall: down the even columns, up the odd ones', () => {
    expect(cellFor(1)).toEqual({ col: 6, row: 0, enterFrom: 'west', exitTo: 'south' });
    expect(cellFor(2)).toEqual({ col: 6, row: 1, enterFrom: 'north', exitTo: 'east' });
    expect(cellFor(3)).toEqual({ col: 7, row: 1, enterFrom: 'west', exitTo: 'north' });
    expect(cellFor(4)).toEqual({ col: 7, row: 0, enterFrom: 'south', exitTo: 'east' });
    expect(cellFor(5)).toEqual({ col: 8, row: 0, enterFrom: 'west', exitTo: 'south' });
  });

  it('never put two areas in one cell', () => {
    const seen = new Set<string>();
    for (let n = 1; n <= 40; n++) {
      const { col, row } = cellFor(n);
      expect(seen.has(`${col},${row}`), `area ${n}`).toBe(false);
      seen.add(`${col},${row}`);
      expect(row === 0 || row === 1).toBe(true);
    }
  });
});

describe('a grown area', () => {
  const first = generateArea('ashford', 1);

  it('is the same every time from the same seed, and another from another seed', () => {
    expect(generateArea('ashford', 1)).toEqual(first);
    const other = generateArea('moon', 1);
    expect(other.area.hubs.map((h) => h.name)).not.toEqual(first.area.hubs.map((h) => h.name));
  });

  it('is laid in its cell, the way in a wilds hub named "<Area> Pass" near the side it is entered from, the boss gate on the way out opening the next', () => {
    const { area, entry } = first;
    expect(area).toMatchObject({ id: 'gen-1', name: 'Glimmerlake Shores', theme: 'glimmerlake', tier: 4, levels: [12, 16] });
    for (const h of area.hubs) {
      expect(h.x, h.id).toBeGreaterThanOrEqual(6 * CELL.width);
      expect(h.x, h.id).toBeLessThan(7 * CELL.width);
      expect(h.y, h.id).toBeGreaterThanOrEqual(0);
      expect(h.y, h.id).toBeLessThan(CELL.height);
      expect(h.id.startsWith('g1-')).toBe(true);
    }
    const pass = area.hubs.find((h) => h.name === 'Glimmerlake Shores Pass')!;
    expect(pass).toMatchObject({ id: entry, kind: 'normal' });
    expect(pass.x - 6 * CELL.width).toBeLessThan(CELL.width / 2);
    expect(area.hubs.filter((h) => h.name.endsWith(' Pass'))).toHaveLength(1);
    const gates = area.hubs.filter((h) => h.kind === 'boss');
    expect(gates).toHaveLength(1);
    expect(gates[0]).toMatchObject({ boss: 'g1-boss', opens: 'gen-2' });
    expect(gates[0]!.name.endsWith(' Gate')).toBe(true);
    expect(gates[0]!.x - 6 * CELL.width).toBeGreaterThan(CELL.width / 4);
    expect(gates[0]!.y).toBeGreaterThan(CELL.height / 2);
  });

  it('brings four creatures of its theme at its levels, a mini-boss and a boss above them, scaled to its tier', () => {
    const { area, bestiary } = first;
    expect(area.mobs).toEqual(['g1-mob-1', 'g1-mob-2', 'g1-mob-3', 'g1-mob-4']);
    expect(area.miniBosses).toEqual(['g1-mini']);
    expect(area.mobs.map((id) => bestiary[id]!.name)).toEqual(['Bubble Imp', 'Shellback', 'River Sprite', 'Marsh Goblin']);
    for (const id of area.mobs) {
      const m = bestiary[id]!;
      expect(m.role).toBe('mob');
      expect(m.level).toBeGreaterThanOrEqual(area.levels[0]);
      expect(m.level).toBeLessThanOrEqual(area.levels[1]);
      expect(m.moves.length).toBeGreaterThan(0);
    }
    expect(bestiary['g1-mini']).toMatchObject({ name: 'Crystal Crab', role: 'mini', level: 17 });
    expect(bestiary['g1-boss']).toMatchObject({ name: 'Lord Ripplefin', role: 'boss', level: 18 });
    // One tier above Frostpeak: the plain creature is the Frostpeak numbers grown by a tier.
    const plain = bestiary['g1-mob-1']!;
    expect(plain.hp).toBe(Math.round(THEMES.base.mob.hp * THEMES.perTier.hp));
    expect(plain.attack).toBe(Math.round(THEMES.base.mob.attack * THEMES.perTier.attack));
    expect(plain.hp).toBeGreaterThan(ENEMIES['ice-wolf']!.hp);
    expect(bestiary['g1-boss']!.hp).toBeGreaterThan(ENEMIES['frost-matriarch']!.hp);
  });

  it('grows stronger area by area, in hp, attack, defense and reward', () => {
    let last = first.bestiary['g1-boss']!;
    for (let n = 2; n <= 12; n++) {
      const boss = generateArea('ashford', n).bestiary[`g${n}-boss`]!;
      expect(boss.hp, `area ${n}`).toBeGreaterThan(last.hp);
      expect(boss.attack, `area ${n}`).toBeGreaterThan(last.attack);
      expect(boss.defense, `area ${n}`).toBeGreaterThanOrEqual(last.defense);
      expect(boss.xp, `area ${n}`).toBeGreaterThan(last.xp);
      expect(boss.gold, `area ${n}`).toBeGreaterThan(last.gold);
      expect(boss.level).toBe(4 * (3 + n) + 2);
      last = boss;
    }
  });

  it('gives every grown area a town, a shop, a shrine, two chests, two springs, mostly wilds', () => {
    const board = grownWorld('ashford', 10);
    const spaces = Object.values(board.spaces);
    for (let n = 1; n <= 10; n++) {
      const own = spaces.filter((s) => s.area === `gen-${n}`);
      const count = (kind: string) => own.filter((s) => s.kind === kind).length;
      expect(count('town'), `gen-${n} towns`).toBeGreaterThanOrEqual(1);
      expect(count('shop'), `gen-${n} shops`).toBeGreaterThanOrEqual(1);
      expect(count('spell'), `gen-${n} shrines`).toBeGreaterThanOrEqual(1);
      expect(count('chest'), `gen-${n} chests`).toBeGreaterThanOrEqual(2);
      expect(count('potion'), `gen-${n} springs`).toBeGreaterThanOrEqual(2);
      expect(count('boss'), `gen-${n} bosses`).toBe(1);
      expect(count('normal') / own.length, `gen-${n} is mostly wilds`).toBeGreaterThan(0.6);
      expect(own.length, `gen-${n} size`).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('growing the board', () => {
  it('lays the area into a copy, widening the board, and leaves the old board as it was', () => {
    const before = makeBoard();
    const frozen = structuredClone(before);
    const after = growBoard(before, 'ashford', 'gen-1');
    expect(before).toEqual(frozen);
    expect(after.width).toBe(9800);
    expect(after.height).toBe(9300);
    expect(after.areas['gen-1']).toMatchObject({ id: 'gen-1', name: 'Glimmerlake Shores', tier: 4 });
    expect(after.areas['gen-1']!.bounds.x).toBeGreaterThan(4000);
    expect(after.areas['gen-1']!.bounds.x + after.areas['gen-1']!.bounds.width).toBeLessThanOrEqual(after.width);
    // The Summit now leads on: its last link is the first spot of the passage, wilds in the new area a step apart up to the pass.
    const summit = after.spaces.summit!;
    expect(summit.links.length).toBe(before.spaces.summit!.links.length + 1);
    let step = after.spaces[summit.links[summit.links.length - 1]!]!;
    let count = 0;
    while (step.name === '') {
      expect(step).toMatchObject({ area: 'gen-1', kind: 'normal' });
      count++;
      step = after.spaces[step.links[1]!]!;
    }
    expect(step.name).toBe('Glimmerlake Shores Pass');
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(40);
    expect(Object.keys(after.bestiary)).toEqual(['g1-mob-1', 'g1-mob-2', 'g1-mob-3', 'g1-mob-4', 'g1-mini', 'g1-boss']);
  });

  it('does nothing for an area already laid or an id that is not a grown one', () => {
    const one = growBoard(makeBoard(), 'ashford', 'gen-1');
    expect(growBoard(one, 'ashford', 'gen-1')).toBe(one);
    expect(growBoard(one, 'ashford', 'meadows')).toBe(one);
    expect(growBoard(one, 'ashford', 'nowhere')).toBe(one);
  });

  it('lays the same area whether it comes first or after others, so every player sees one world', () => {
    const straight = growBoard(growBoard(makeBoard(), 'ashford', 'gen-1'), 'ashford', 'gen-2');
    const skipped = growBoard(growBoard(makeBoard(), 'ashford', 'gen-2'), 'ashford', 'gen-1');
    const own = (b: Board, area: string) => Object.values(b.spaces).filter((s) => s.area === area).map((s) => ({ ...s, links: [...s.links].sort() }));
    expect(own(skipped, 'gen-1')).toEqual(own(straight, 'gen-1'));
    expect(own(skipped, 'gen-2')).toEqual(own(straight, 'gen-2'));
    expect(skipped.areas).toEqual(straight.areas);
  });

  it('keeps growing: twenty areas, each reachable from the last over its passage, the board as wide as its last column', () => {
    const board = grownWorld('ashford', 20);
    expect(Object.keys(board.areas).filter((id) => !board.areas[id]!.dungeon)).toHaveLength(23);
    expect(board.width).toBe((cellFor(20).col + 1) * CELL.width);
    for (let n = 1; n <= 20; n++) {
      const gate = Object.values(board.spaces).find((s) => s.opens === `gen-${n}`)!;
      expect(gate, `gate into gen-${n}`).toBeDefined();
      const open = new Set(Object.keys(board.areas));
      const into = legalPaths(board, gate.id, 6, open).filter((path) => board.spaces[path[path.length - 1]!]!.area === `gen-${n}`);
      expect(into.length, `six steps from ${gate.id} into gen-${n}`).toBeGreaterThan(0);
    }
  });
});

describe('in play', () => {
  /** A character on the Summit, every hand-laid area open, with the Frost Matriarch at one hp. */
  function atTheSummit(): GameState {
    const s = newGame({ seed: 'w', player: P, name: 'Robin', classId: 'warrior' });
    const c = startFight({ ...me(s), space: 'summit', opened: ['meadows', 'thornwood', 'frostpeak'] }, 'frost-matriarch', 'summit', false);
    c.fight!.enemy = { ...c.fight!.enemy, hp: 1 };
    return { ...s, characters: { [P]: c } };
  }

  it('hints at what lies beyond the Summit before it is laid, and names the area once it is', () => {
    const s = atTheSummit();
    expect(hintFor(s, 'summit', P, NOW)).toContain('Beat it to open Glimmerlake Shores (tier 4).');
    const grown = { ...s, board: growBoard(s.board, s.seed, 'gen-1') };
    expect(hintFor(grown, 'summit', P, NOW)).toContain('Beat it to open Glimmerlake Shores.');
    const pass = Object.values(grown.board.spaces).find((x) => x.name === 'Glimmerlake Shores Pass')!;
    expect(hintFor(grown, pass.id, P, NOW)).toBe(`Glimmerlake Shores (tier 4, levels 12 to 16): closed. Beat Queen Bumble at Queen Bumble's Hive to open it.`);
  });

  it('lays the first grown area when the Frost Matriarch falls, opens it, and the next when its boss falls', () => {
    const { state, events } = apply(atTheSummit(), { type: 'fight', id: 'f1', player: P, move: { kind: 'attack' }, guard: 'none' }, makeRng('w'), NOW);
    expect(events.find((e) => e.type === 'opened')).toEqual({ type: 'opened', action: 'f1', player: P, area: 'gen-1' });
    expect(me(state).opened).toEqual(['meadows', 'thornwood', 'frostpeak', 'gen-1']);
    expect(state.board.areas['gen-1']).toMatchObject({ name: 'Glimmerlake Shores', tier: 4 });
    expect(state.board.width).toBe(9800);
    expect(state.board.bestiary['g1-boss']).toMatchObject({ name: 'Lord Ripplefin' });
    // It plays on from the Summit into the pass.
    const picked = { state, events: [] as GameEvent[] };
    const rolled = apply({ ...picked.state, characters: { [P]: { ...me(picked.state), steps: 0 } } }, { type: 'roll', id: 'r1', player: P }, makeRng('w'), NOW).state;
    const open = new Set(me(rolled).opened);
    const paths = legalPaths(rolled.board, 'summit', rolled.die.last!, open);
    expect(paths.some((p) => rolled.board.spaces[p[p.length - 1]!]!.area === 'gen-1')).toBe(true);

    // The Molten Tyrant, from the board's bestiary, lays the second.
    const gate = Object.values(state.board.spaces).find((x) => x.opens === 'gen-2')!;
    const c = startFight({ ...me(state), space: gate.id, fight: null }, gate.boss!, gate.id, false, state.board.bestiary);
    expect(c.fight!.enemy).toMatchObject({ id: 'g1-boss', name: 'Lord Ripplefin', role: 'boss' });
    c.fight!.enemy = { ...c.fight!.enemy, hp: 1 };
    const second = apply({ ...state, characters: { [P]: c } }, { type: 'fight', id: 'f2', player: P, move: { kind: 'attack' }, guard: 'none' }, makeRng('w'), NOW);
    expect(second.events.find((e) => e.type === 'opened')).toMatchObject({ area: 'gen-2' });
    expect(second.state.board.areas['gen-2']).toMatchObject({ name: 'Moonwhisper Woods', tier: 5 });
    expect(second.state.board.height).toBe(9300);
    expect(me(second.state).bossKills[gate.id]).toBe(1);
  });

  it('sends a fallen character to a town of an open area, never into one not yet opened', () => {
    const s = atTheSummit();
    const grown = growBoard(s.board, s.seed, 'gen-1');
    const gate = Object.values(grown.spaces).find((x) => x.opens === 'gen-2')!;
    expect(grown.spaces[nearestTown(grown, 'summit', new Set(['meadows', 'thornwood', 'frostpeak']))]!).toMatchObject({ kind: 'town', area: 'frostpeak' });
    expect(grown.spaces[nearestTown(grown, gate.id, new Set(['meadows', 'thornwood', 'frostpeak', 'gen-1']))]!).toMatchObject({ kind: 'town', area: 'gen-1' });
    // From the Summit with the first grown area open, whichever town is nearer by steps, it is in an open area.
    expect(['frostpeak', 'gen-1']).toContain(grown.spaces[nearestTown(grown, 'summit', new Set(['meadows', 'thornwood', 'frostpeak', 'gen-1']))]!.area);
  });
});
