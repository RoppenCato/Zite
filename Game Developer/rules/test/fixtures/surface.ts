import type { Board } from '../../src/types.ts';

/** The board without its dungeons: the open land the world's checks are about. A dungeon's dead ends and short walks are its own (dungeon.test.ts). */
export function surface(board: Board): Board {
  const areas = Object.fromEntries(Object.entries(board.areas).filter(([, a]) => !a.dungeon));
  const spaces = Object.fromEntries(Object.entries(board.spaces).filter(([, s]) => areas[s.area]));
  return { ...board, areas, spaces };
}
