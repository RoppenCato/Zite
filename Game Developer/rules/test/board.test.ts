import { describe, expect, it } from 'vitest';
import { DICE_DATA, ENEMIES, SPACE_KINDS, WORLD_DATA } from '../src/data.ts';
import { makeBoard } from '../src/game.ts';
import { legalPaths } from '../src/paths.ts';
import type { Board } from '../src/types.ts';
import { GROWN } from '../src/world.ts';
import { grownWorld } from './fixtures/grown.ts';
import { ringBoard } from './fixtures/ring.ts';

// Every board the game can play on must be a sound graph and drawable: these checks run over the ring fixture and the
// built world alike, and the generator that comes later must pass them too.
const MIN_LINK = 60; // linked spaces closer than this overlap on the screen
const MAX_LINK = 200; // further apart than this, a step looks like a jump
const MIN_APART = 55; // any two spaces, linked or not
const MARGIN = 40; // from the board's edge, so a space and its ring are never cut off


const boards: { name: string; board: Board; maxLink: number }[] = [
  // The ring's chord across the middle is 300 pixels long: it is the fork test, not a map to draw, so it alone may be long.
  { name: 'the twelve-space ring (the test fixture)', board: ringBoard(), maxLink: 300 },
  { name: 'the world (built from rules/data/world.json)', board: makeBoard(), maxLink: MAX_LINK },
  // The generator must pass every check the hand-laid world does: ten grown areas, more than one round of the themes.
  { name: 'the world grown ten areas (the generator, seed ashford)', board: grownWorld('ashford', 10), maxLink: MAX_LINK },
  { name: 'the world grown ten areas (the generator, seed moon)', board: grownWorld('moon', 10), maxLink: MAX_LINK },
];

describe.each(boards)('$name', ({ board, maxLink }) => {
  const spaces = Object.values(board.spaces);
  const ids = Object.keys(board.spaces);

  it('has unique ids, a start that exists, and an area for every space', () => {
    for (const id of ids) expect(board.spaces[id]!.id).toBe(id);
    expect(new Set(spaces.map((s) => s.id)).size).toBe(spaces.length);
    expect(board.spaces[board.start]).toBeDefined();
    for (const s of spaces) expect(board.areas[s.area], `${s.id} lies in ${s.area}`).toBeDefined();
  });

  it('only uses known space kinds, and every boss spot names a boss that exists', () => {
    for (const s of spaces) {
      expect(SPACE_KINDS).toContain(s.kind);
      if (s.kind === 'boss') {
        expect(s.boss && (board.bestiary[s.boss] ?? ENEMIES[s.boss])?.role, `${s.id} names a boss`).toBe('boss');
        if (s.opens) expect(!!board.areas[s.opens] || GROWN.test(s.opens), `${s.id} opens ${s.opens}`).toBe(true);
      } else {
        expect(s.boss).toBeUndefined();
      }
    }
  });

  it('links both ways, never to itself, never to a space that is not there', () => {
    for (const s of spaces) {
      expect(new Set(s.links).size).toBe(s.links.length);
      for (const other of s.links) {
        expect(other).not.toBe(s.id);
        expect(board.spaces[other], `${s.id} links to ${other}`).toBeDefined();
        expect(board.spaces[other]!.links, `${other} should link back to ${s.id}`).toContain(s.id);
      }
    }
  });

  it('has no dead ends, except a boss spot at the end of the world with nothing beyond it laid yet', () => {
    for (const s of spaces) {
      if (s.kind === 'boss' && (!s.opens || !board.areas[s.opens])) expect(s.links.length, s.id).toBeGreaterThanOrEqual(1);
      // A painted map may end a side road at a place of its own: a landing there walks back the way it came.
      else if (!board.areas[s.area]?.places) expect(s.links.length, s.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('can always use any roll of the die from any space, with every area open', () => {
    for (const id of ids) {
      for (let steps = 1; steps <= DICE_DATA.sides; steps++) {
        expect(legalPaths(board, id, steps).length, `${id} with ${steps} steps`).toBeGreaterThan(0);
      }
    }
  });

  it('can always use any roll from any space of an area with only that area and the ones before it open', () => {
    const areas = Object.values(board.areas).sort((a, b) => a.tier - b.tier);
    const open = new Set<string>();
    for (const area of areas) {
      open.add(area.id);
      for (const s of spaces.filter((x) => x.area === area.id)) {
        for (let steps = 1; steps <= DICE_DATA.sides; steps++) {
          expect(legalPaths(board, s.id, steps, open).length, `${s.id} with ${steps} steps, ${[...open].join('+')} open`).toBeGreaterThan(0);
        }
      }
    }
  });

  it(`keeps linked spaces between ${MIN_LINK} and ${maxLink} pixels apart`, () => {
    for (const s of spaces) {
      for (const other of s.links) {
        const o = board.spaces[other]!;
        const d = Math.hypot(s.x - o.x, s.y - o.y);
        expect(d, `${s.id} to ${other} is ${d.toFixed(1)} apart`).toBeGreaterThanOrEqual(MIN_LINK);
        expect(d, `${s.id} to ${other} is ${d.toFixed(1)} apart`).toBeLessThanOrEqual(maxLink);
      }
    }
  });

  it(`keeps every two spaces at least ${MIN_APART} pixels apart`, () => {
    for (const a of spaces) {
      for (const b of spaces) {
        if (a.id >= b.id) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d, `${a.id} and ${b.id} are ${d.toFixed(1)} apart`).toBeGreaterThanOrEqual(MIN_APART);
      }
    }
  });

  it(`keeps every space at least ${MARGIN} pixels inside the board, and inside its area's bounds`, () => {
    expect(board.width).toBeGreaterThan(0);
    expect(board.height).toBeGreaterThan(0);
    for (const s of spaces) {
      expect(s.x, `${s.id} x`).toBeGreaterThanOrEqual(MARGIN);
      expect(s.x, `${s.id} x`).toBeLessThanOrEqual(board.width - MARGIN);
      expect(s.y, `${s.id} y`).toBeGreaterThanOrEqual(MARGIN);
      expect(s.y, `${s.id} y`).toBeLessThanOrEqual(board.height - MARGIN);
      const b = board.areas[s.area]!.bounds;
      expect(s.x >= b.x && s.x <= b.x + b.width && s.y >= b.y && s.y <= b.y + b.height, `${s.id} inside ${s.area}`).toBe(true);
    }
  });
});

describe('the world', () => {
  const board = makeBoard();
  const spaces = Object.values(board.spaces);

  it('is Zite: three areas by tier, about 180 spots, starting in the town Ashford in the meadows', () => {
    expect(WORLD_DATA.name).toBe('Zite');
    expect(board.start).toBe('ashford');
    expect(board.spaces.ashford).toMatchObject({ kind: 'town', name: 'Puddlewick Village', area: 'meadows' });
    expect(Object.values(board.areas).map((a) => [a.id, a.tier])).toEqual([
      ['meadows', 1],
      ['thornwood', 2],
      ['frostpeak', 3],
    ]);
    expect(spaces.length).toBeGreaterThanOrEqual(150);
    expect(spaces.length).toBeLessThanOrEqual(520);
    expect(board).toMatchObject({ width: 7400, height: 9300 });
  });

  it('keeps each area to its own mobs, every mob of the area within its levels', () => {
    for (const area of Object.values(board.areas)) {
      expect(area.mobs.length).toBeGreaterThanOrEqual(3);
      for (const id of [...area.mobs, ...area.miniBosses]) {
        const e = ENEMIES[id];
        expect(e, `${area.id} has ${id}`).toBeDefined();
        if (area.mobs.includes(id)) {
          expect(e!.level, `${id} in ${area.id}`).toBeGreaterThanOrEqual(area.levels[0]);
          expect(e!.level, `${id} in ${area.id}`).toBeLessThanOrEqual(area.levels[1]);
          expect(e!.role).toBe('mob');
        } else {
          expect(e!.role).toBe('mini');
        }
      }
    }
  });

  it('passes from area to area over a boss spot: the Copper Gate opens Thornwood, the Briar Gate opens Frostpeak, the Summit the first grown area', () => {
    expect(board.spaces.gate).toMatchObject({ kind: 'boss', area: 'meadows', boss: 'thornwood-warden', opens: 'thornwood' });
    expect(board.spaces.briar).toMatchObject({ kind: 'boss', area: 'thornwood', boss: 'briar-king', opens: 'frostpeak' });
    expect(board.spaces.summit).toMatchObject({ kind: 'boss', area: 'frostpeak', boss: 'frost-matriarch', opens: 'gen-1' });
    // The road beyond a gate belongs to the next area, so it is closed until the gate's boss falls.
    expect(board.spaces['gate-edge-1']).toMatchObject({ area: 'thornwood', kind: 'normal' });
    expect(board.spaces['briar-pass-1']).toMatchObject({ area: 'frostpeak' });
    // Every area but the first is opened by exactly one boss.
    for (const area of Object.values(board.areas)) {
      const gates = spaces.filter((s) => s.opens === area.id);
      expect(gates.length, area.id).toBe(area.tier === 1 ? 0 : 1);
    }
  });

  it('gives every area a town, a shop, a shrine, chests and springs', () => {
    for (const area of Object.values(board.areas)) {
      const own = spaces.filter((s) => s.area === area.id);
      const count = (kind: string) => own.filter((s) => s.kind === kind).length;
      expect(count('town'), `${area.id} towns`).toBeGreaterThanOrEqual(1);
      expect(count('shop'), `${area.id} shops`).toBeGreaterThanOrEqual(1);
      expect(count('spell'), `${area.id} shrines`).toBeGreaterThanOrEqual(1);
      expect(count('chest'), `${area.id} chests`).toBeGreaterThanOrEqual(2);
      expect(count('potion'), `${area.id} springs`).toBeGreaterThanOrEqual(2);
      expect(count('normal') / own.length, `${area.id} is mostly wilds`).toBeGreaterThan(0.6);
    }
  });

  it('is built fresh for each game, never shared', () => {
    const a = makeBoard();
    const b = makeBoard();
    a.spaces.ashford!.links.push('moon');
    expect(b.spaces.ashford!.links).not.toContain('moon');
    expect(makeBoard()).toEqual(b);
  });
});

describe('the ring fixture', () => {
  it('is the first board in the shape of today: twelve spaces in one area, a boss spot with nothing beyond, starting at s0', () => {
    const ring = ringBoard();
    expect(Object.keys(ring.spaces)).toHaveLength(12);
    expect(ring.start).toBe('s0');
    expect(ring).toMatchObject({ width: 412, height: 915 });
    expect(ring.spaces.s10).toMatchObject({ kind: 'boss', boss: 'thornwood-warden', opens: null });
    expect(Object.keys(ring.areas)).toEqual(['ring']);
    const again = ringBoard();
    ring.spaces.s0!.links.push('s5');
    expect(again.spaces.s0!.links).not.toContain('s5');
  });
});
