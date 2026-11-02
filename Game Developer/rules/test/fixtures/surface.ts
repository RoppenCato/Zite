import type { Board } from '../../src/types.ts';

/** The board without its dungeons and its city (whose streets are tapped, not rolled): the open land the world's checks are about. A dungeon's dead ends and short walks are its own (dungeon.test.ts). */
export function surface(board: Board): Board {
  const areas = Object.fromEntries(Object.entries(board.areas).filter(([, a]) => !a.dungeon && !a.city));
  const hidden = new Set(Object.values(board.spaces).filter((s) => s.hidden || !areas[s.area]).map((s) => s.id));
  const spaces = Object.fromEntries(Object.entries(board.spaces).filter(([, s]) => areas[s.area] && !s.hidden).map(([id, s]) => [id, { ...s, links: s.links.filter((l) => !hidden.has(l)) }]));
  return { ...board, areas, spaces };
}
