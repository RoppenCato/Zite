import { CLASS_DATA, DICE_DATA } from './data.ts';
import { makeBoard } from './game.ts';
import { STATE_VERSION, type Character, type GameState } from './types.ts';

/** What a version-1 state looked like: the same shape with the twelve-space ring as its board. */
interface StateV1 {
  version: 1;
  seed: string;
  characters: Record<string, Character>;
  die: { sides: number; last: number | null };
}

/**
 * Bring a stored state up to the current version, or null for a thing that is not a state we know, so the holder
 * starts a fresh game instead of crashing on it.
 *
 * 1 → 2 (2026-10-31): the ring became the island. The board is rebuilt; every character is kept (name, class, hp,
 * gold and the rest) but stands on the start space again with no roll owed, and the die is unrolled.
 */
export function migrate(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { version?: unknown };
  if (candidate.version === STATE_VERSION) return raw as GameState;
  if (candidate.version === 1) return fromVersion1(raw as StateV1);
  return null;
}

function fromVersion1(old: StateV1): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  const board = makeBoard();
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    characters[id] = { ...c, id, space: board.start, steps: 0 };
  }
  const sides = typeof old.die?.sides === 'number' ? old.die.sides : DICE_DATA.sides;
  return { version: STATE_VERSION, seed: old.seed, board, characters, die: { sides, last: null } };
}
