import type { Board } from './types.ts';

export type PathProblem = 'wrong number of steps' | 'no such space' | 'not connected' | 'no turning back';

/**
 * Every walk of exactly `steps` steps from `from`, never stepping straight back to the space just left
 * (mine, 2026-10-31: the Dokapon rule; it keeps the die meaningful). Each path lists the spaces stepped on,
 * in order, ending on the landing space. The rules use it to check a move; the client uses it to offer the choices.
 */
export function legalPaths(board: Board, from: string, steps: number): string[][] {
  if (steps <= 0) return [];
  const out: string[][] = [];
  const walk = (here: string, cameFrom: string | null, path: string[]): void => {
    if (path.length === steps) {
      out.push(path);
      return;
    }
    const space = board.spaces[here];
    if (!space) return;
    for (const next of space.links) {
      if (next === cameFrom) continue;
      walk(next, here, [...path, next]);
    }
  };
  walk(from, null, []);
  return out;
}

/** Why `path` is not a legal walk of `steps` steps from `from`, or null when it is. */
export function checkPath(board: Board, from: string, steps: number, path: string[]): PathProblem | null {
  if (path.length !== steps) return 'wrong number of steps';
  let here = from;
  let cameFrom: string | null = null;
  for (const next of path) {
    const space = board.spaces[here];
    if (!space || !board.spaces[next]) return 'no such space';
    if (!space.links.includes(next)) return 'not connected';
    if (next === cameFrom) return 'no turning back';
    cameFrom = here;
    here = next;
  }
  return null;
}
