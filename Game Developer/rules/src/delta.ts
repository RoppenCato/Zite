// What changed between two states, found by reference: the rules never change a state in place, so a part that is the
// same object as before is unchanged and stays out. The server sends a delta after each action (docs/state/protocol.md)
// and the client folds it in with mergeDelta. A test plays hundreds of random actions through diffState and mergeDelta
// and checks the client's state is the server's, so a change in place would be caught the day it is written.

import type { Board, Character, Die, GameState, Spawn, Trace } from './types.ts';

export interface Delta {
  /** Whole characters, by id: only those that changed. */
  characters?: Record<string, Character>;
  /** The whole map of spawns, when it changed. */
  spawns?: Record<string, Spawn>;
  /** The whole board, when it grew (rare and big). */
  board?: Board;
  die?: Die;
  nextItem?: number;
  /** The whole map of notes, when it changed. */
  traces?: Record<string, Trace[]>;
}

/** The parts of `after` that are not the same objects as in `before`; null when nothing changed. */
export function diffState(before: GameState, after: GameState): Delta | null {
  if (before === after) return null;
  const delta: Delta = {};
  let any = false;
  if (before.characters !== after.characters) {
    const changed: Record<string, Character> = {};
    for (const [id, c] of Object.entries(after.characters)) {
      if (before.characters[id] !== c) {
        changed[id] = c;
        any = true;
      }
    }
    if (any) delta.characters = changed;
  }
  if (before.spawns !== after.spawns) {
    delta.spawns = after.spawns;
    any = true;
  }
  if (before.board !== after.board) {
    delta.board = after.board;
    any = true;
  }
  if (before.die !== after.die) {
    delta.die = after.die;
    any = true;
  }
  if (before.nextItem !== after.nextItem) {
    delta.nextItem = after.nextItem;
    any = true;
  }
  if (before.traces !== after.traces) {
    delta.traces = after.traces;
    any = true;
  }
  return any ? delta : null;
}

/** The state with the delta folded in. */
export function mergeDelta(state: GameState, delta: Delta): GameState {
  return {
    ...state,
    characters: delta.characters ? { ...state.characters, ...delta.characters } : state.characters,
    spawns: delta.spawns ?? state.spawns,
    board: delta.board ?? state.board,
    die: delta.die ?? state.die,
    nextItem: delta.nextItem ?? state.nextItem,
    traces: delta.traces ?? state.traces,
  };
}

/** Two deltas in a row as one: the later wins each part, characters by id. The server bundles with it. */
export function mergeDeltas(first: Delta, second: Delta): Delta {
  const out: Delta = { ...first, ...second };
  if (first.characters && second.characters) out.characters = { ...first.characters, ...second.characters };
  return out;
}
