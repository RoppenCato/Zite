import { describe, expect, it } from 'vitest';
import { BOARD_DATA, DICE_DATA, SPACE_KINDS } from '../src/data.ts';
import { makeBoard } from '../src/game.ts';
import { legalPaths } from '../src/paths.ts';

// The board data must stay a sound graph: the generator that replaces it later must pass these too.
describe('the board data', () => {
  const board = makeBoard();
  const ids = Object.keys(board.spaces);

  it('has twelve spaces with unique ids and a start that exists', () => {
    expect(BOARD_DATA.spaces).toHaveLength(12);
    expect(new Set(BOARD_DATA.spaces.map((s) => s.id)).size).toBe(12);
    expect(board.spaces[board.start]).toBeDefined();
  });

  it('only uses known space kinds', () => {
    for (const s of BOARD_DATA.spaces) expect(SPACE_KINDS).toContain(s.kind);
  });

  it('links both ways, never to itself, never to a space that is not there', () => {
    for (const id of ids) {
      const s = board.spaces[id]!;
      expect(new Set(s.links).size).toBe(s.links.length);
      for (const other of s.links) {
        expect(other).not.toBe(id);
        expect(board.spaces[other], `${id} links to ${other}`).toBeDefined();
        expect(board.spaces[other]!.links, `${other} should link back to ${id}`).toContain(id);
      }
    }
  });

  it('has no dead ends: every space has at least two ways on', () => {
    for (const id of ids) expect(board.spaces[id]!.links.length).toBeGreaterThanOrEqual(2);
  });

  it('can always use any roll of the die from any space', () => {
    for (const id of ids) {
      for (let steps = 1; steps <= DICE_DATA.sides; steps++) {
        expect(legalPaths(board, id, steps).length, `${id} with ${steps} steps`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every space inside the phone screen with room for the HUD and the Roll button', () => {
    for (const s of BOARD_DATA.spaces) {
      expect(s.x).toBeGreaterThanOrEqual(40);
      expect(s.x).toBeLessThanOrEqual(412 - 40);
      expect(s.y).toBeGreaterThanOrEqual(110);
      expect(s.y).toBeLessThanOrEqual(915 - 170);
    }
  });

  it('is copied into the state, not shared with the data', () => {
    const a = makeBoard();
    const b = makeBoard();
    a.spaces.s0!.links.push('s5');
    expect(b.spaces.s0!.links).not.toContain('s5');
    expect(BOARD_DATA.spaces[0]!.links).not.toContain('s5');
  });
});
