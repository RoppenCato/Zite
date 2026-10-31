import { describe, expect, it } from 'vitest';
import { DICE_DATA, ISLAND_DATA, SPACE_KINDS } from '../src/data.ts';
import { makeBoard } from '../src/game.ts';
import { legalPaths } from '../src/paths.ts';
import type { Board } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

// Every board the game can play on must be a sound graph and drawable: these checks run over the ring fixture and the
// built island alike, and the generator that comes later must pass them too.
const MIN_LINK = 60; // linked spaces closer than this overlap on the screen
const MAX_LINK = 200; // further apart than this, a step looks like a jump
const MIN_APART = 55; // any two spaces, linked or not
const MARGIN = 40; // from the board's edge, so a space and its ring are never cut off

const boards: { name: string; board: Board; maxLink: number }[] = [
  // The ring's chord across the middle is 300 pixels long: it is the fork test, not a map to draw, so it alone may be long.
  { name: 'the twelve-space ring (the test fixture)', board: ringBoard(), maxLink: 300 },
  { name: 'Ashford Isle (built from rules/data/board.json)', board: makeBoard(), maxLink: MAX_LINK },
];

describe.each(boards)('$name', ({ board, maxLink }) => {
  const spaces = Object.values(board.spaces);
  const ids = Object.keys(board.spaces);

  it('has unique ids and a start that exists', () => {
    for (const id of ids) expect(board.spaces[id]!.id).toBe(id);
    expect(new Set(spaces.map((s) => s.id)).size).toBe(spaces.length);
    expect(board.spaces[board.start]).toBeDefined();
  });

  it('only uses known space kinds', () => {
    for (const s of spaces) expect(SPACE_KINDS).toContain(s.kind);
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

  it('has no dead ends: every space has at least two ways on', () => {
    for (const s of spaces) expect(s.links.length, s.id).toBeGreaterThanOrEqual(2);
  });

  it('can always use any roll of the die from any space', () => {
    for (const id of ids) {
      for (let steps = 1; steps <= DICE_DATA.sides; steps++) {
        expect(legalPaths(board, id, steps).length, `${id} with ${steps} steps`).toBeGreaterThan(0);
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

  it(`keeps every space at least ${MARGIN} pixels inside the board`, () => {
    expect(board.width).toBeGreaterThan(0);
    expect(board.height).toBeGreaterThan(0);
    for (const s of spaces) {
      expect(s.x, `${s.id} x`).toBeGreaterThanOrEqual(MARGIN);
      expect(s.x, `${s.id} x`).toBeLessThanOrEqual(board.width - MARGIN);
      expect(s.y, `${s.id} y`).toBeGreaterThanOrEqual(MARGIN);
      expect(s.y, `${s.id} y`).toBeLessThanOrEqual(board.height - MARGIN);
    }
  });
});

describe('the island', () => {
  it('is Ashford Isle: about sixty spaces, eleven of them named hubs, starting in a town', () => {
    const board = makeBoard();
    const spaces = Object.values(board.spaces);
    expect(ISLAND_DATA.name).toBe('Ashford Isle');
    expect(board.start).toBe('ashford');
    expect(board.spaces.ashford).toMatchObject({ kind: 'town', name: 'Ashford' });
    expect(spaces.length).toBeGreaterThanOrEqual(55);
    expect(spaces.length).toBeLessThanOrEqual(70);
    expect(spaces.filter((s) => s.name !== '')).toHaveLength(ISLAND_DATA.hubs.length);
    expect(board.width).toBe(ISLAND_DATA.width);
    expect(board.height).toBe(ISLAND_DATA.height);
  });

  it('forks at its hubs: six hubs with three or more ways on, the rest corners with two; a road space has exactly two', () => {
    const board = makeBoard();
    const forks = ISLAND_DATA.hubs.filter((hub) => board.spaces[hub.id]!.links.length >= 3).map((hub) => hub.id);
    expect(forks).toEqual(['ashford', 'millford', 'crossroads', 'windy', 'tinker', 'moon']);
    expect(board.spaces.millford!.links).toHaveLength(5); // the central town, the hub of the four loops
    for (const s of Object.values(board.spaces)) {
      if (s.name === '') expect(s.links, s.id).toHaveLength(2);
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
  it('is the first board: twelve spaces round the phone screen, starting at s0', () => {
    const ring = ringBoard();
    expect(Object.keys(ring.spaces)).toHaveLength(12);
    expect(ring.start).toBe('s0');
    expect(ring).toMatchObject({ width: 412, height: 915 });
    const again = ringBoard();
    ring.spaces.s0!.links.push('s5');
    expect(again.spaces.s0!.links).not.toContain('s5');
  });
});
