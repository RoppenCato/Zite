// The world grown by the generator, for the tests: the hand-laid areas and then gen-1 … gen-count, laid from the seed
// as they would be when their bosses fall one after another.
import { makeBoard } from '../../src/game.ts';
import { growBoard } from '../../src/generate.ts';
import type { Board } from '../../src/types.ts';

export function grownWorld(seed = 'ashford', count = 10): Board {
  let board = makeBoard();
  for (let n = 1; n <= count; n++) board = growBoard(board, seed, `gen-${n}`);
  return board;
}
