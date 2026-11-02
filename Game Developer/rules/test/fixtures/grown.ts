// The world grown by the generator, for the tests: the hand-laid areas and then gen-1 … gen-count, laid from the seed
// as they would be when their bosses fall one after another.
import { makeBoard } from '../../src/game.ts';
import { growBoard } from '../../src/generate.ts';
import type { Board } from '../../src/types.ts';

/** Grown lands are off for now (Robin, 2026-11-02): this gives Frostbeard the way on they would use. */
export function growable(): Board {
  const board = makeBoard();
  return { ...board, spaces: { ...board.spaces, frostseat: { ...board.spaces.frostseat!, opens: 'gen-1' } } };
}

export function grownWorld(seed = 'ashford', count = 10): Board {
  let board = growable();
  for (let n = 1; n <= count; n++) board = growBoard(board, seed, `gen-${n}`);
  return board;
}
