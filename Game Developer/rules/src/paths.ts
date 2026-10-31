import type { Board } from './types.ts';

export type PathProblem = 'wrong number of steps' | 'no such space' | 'not connected' | 'no turning back' | 'that way is closed';

/** A step may land on a space only when its area is open (or when no `open` set is given: the whole board). */
function allowed(board: Board, id: string, open: ReadonlySet<string> | null): boolean {
  const space = board.spaces[id];
  return !!space && (open === null || open.has(space.area));
}

/**
 * Every walk of exactly `steps` steps from `from`, never stepping straight back to the space just left
 * (mine, 2026-10-31: the Dokapon rule; it keeps the die meaningful) and never into an area that is not open.
 * Each path lists the spaces stepped on, in order, ending on the landing space. The rules use it to check a move;
 * the client uses it to offer the choices.
 */
export function legalPaths(board: Board, from: string, steps: number, open: ReadonlySet<string> | null = null): string[][] {
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
      if (next === cameFrom || !allowed(board, next, open)) continue;
      walk(next, here, [...path, next]);
    }
  };
  walk(from, null, []);
  return out;
}

export interface Reach {
  /** A space the roll can end on. */
  space: string;
  /** The first walk (in link order) that gets there. */
  path: string[];
}

/**
 * Where a roll can end: each landing space once, with the first walk that reaches it. The client lights these up and
 * the player taps one (mine, 2026-10-31: the choice is the destination, one tap, not a turn at every fork).
 */
export function reachable(board: Board, from: string, steps: number, open: ReadonlySet<string> | null = null): Reach[] {
  const out: Reach[] = [];
  const seen = new Set<string>();
  for (const path of legalPaths(board, from, steps, open)) {
    const space = path[path.length - 1]!;
    if (seen.has(space)) continue;
    seen.add(space);
    out.push({ space, path });
  }
  return out;
}

/** Why `path` is not a legal walk of `steps` steps from `from`, or null when it is. */
export function checkPath(board: Board, from: string, steps: number, path: string[], open: ReadonlySet<string> | null = null): PathProblem | null {
  if (path.length !== steps) return 'wrong number of steps';
  let here = from;
  let cameFrom: string | null = null;
  for (const next of path) {
    const space = board.spaces[here];
    if (!space || !board.spaces[next]) return 'no such space';
    if (!space.links.includes(next)) return 'not connected';
    if (next === cameFrom) return 'no turning back';
    if (!allowed(board, next, open)) return 'that way is closed';
    cameFrom = here;
    here = next;
  }
  return null;
}

/** The nearest town by steps from `from` (the first found at the shortest distance, in link order), or the start. */
export function nearestTown(board: Board, from: string): string {
  const seen = new Set<string>([from]);
  let frontier = [from];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      const space = board.spaces[id];
      if (!space) continue;
      if (space.kind === 'town') return id;
      for (const link of space.links) {
        if (!seen.has(link)) {
          seen.add(link);
          next.push(link);
        }
      }
    }
    frontier = next;
  }
  return board.start;
}
