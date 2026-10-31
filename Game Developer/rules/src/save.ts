import { CLASS_DATA, DICE_DATA } from './data.ts';
import { makeBoard } from './game.ts';
import { STATE_VERSION, type Board, type Character, type GameState } from './types.ts';

/** A version-1 state: the same shape with the twelve-space ring as its board and no xp, level or fight. */
interface StateV1 {
  version: 1;
  seed: string;
  characters: Record<string, CharacterV2>;
  die: { sides: number; last: number | null };
}

/** A version-2 state: the island, but characters without xp, level or fight. */
interface StateV2 {
  version: 2;
  seed: string;
  board: Board;
  characters: Record<string, CharacterV2>;
  die: { sides: number; last: number | null };
}

type CharacterV2 = Omit<Character, 'xp' | 'level' | 'fight'>;

/**
 * Bring a stored state up to the current version, or null for a thing that is not a state we know, so the holder
 * starts a fresh game instead of crashing on it. Each step goes to the next version; a version-1 state takes both.
 *
 * 1 → 2 (2026-10-31): the ring became the island. The board is rebuilt; every character is kept (name, class, hp,
 * gold and the rest) but stands on the start space again with no roll owed, and the die is unrolled.
 * 2 → 3 (2026-10-31): the fight came. Every character gains xp 0, level 1 and no fight.
 */
export function migrate(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { version?: unknown };
  if (candidate.version === STATE_VERSION) return raw as GameState;
  if (candidate.version === 1) {
    const v2 = fromVersion1(raw as StateV1);
    return v2 ? fromVersion2(v2) : null;
  }
  if (candidate.version === 2) return fromVersion2(raw as StateV2);
  return null;
}

function fromVersion1(old: StateV1): StateV2 | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  const board = makeBoard();
  const characters: Record<string, CharacterV2> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    characters[id] = { ...c, id, space: board.start, steps: 0 };
  }
  const sides = typeof old.die?.sides === 'number' ? old.die.sides : DICE_DATA.sides;
  return { version: 2, seed: old.seed, board, characters, die: { sides, last: null } };
}

function fromVersion2(old: StateV2): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null || !old.board) return null;
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    characters[id] = { ...c, id, xp: 0, level: 1, fight: null };
  }
  return { version: STATE_VERSION, seed: old.seed, board: old.board, characters, die: old.die };
}
