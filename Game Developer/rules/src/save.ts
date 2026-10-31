import { CLASS_DATA, DICE_DATA } from './data.ts';
import { makeBoard, makeCharacter } from './game.ts';
import { STATE_VERSION, type Board, type Character, type GameState } from './types.ts';

/** The older shapes, as far as the migrations need them. */
interface StateV1 {
  version: 1;
  seed: string;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
interface StateV2 {
  version: 2;
  seed: string;
  board: Board;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
interface StateV3 {
  version: 3;
  seed: string;
  board: Board;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
interface StateV4 {
  version: 4;
  seed: string;
  board: Board;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
/** What every version before 5 had on a character that version 5 keeps. */
interface OldCharacter {
  id: string;
  name: string;
  classId: Character['classId'];
  hp: number;
  gold: number;
  xp?: number;
  level?: number;
  items?: Record<string, number>;
  [key: string]: unknown;
}

/**
 * Bring a stored state up to the current version, or null for a thing that is not a state we know, so the holder
 * starts a fresh game instead of crashing on it. Each step goes to the next version; an older state takes them all.
 *
 * 1 → 2 (2026-10-31): the ring became the island. 2 → 3: the fight came (xp, level, fight). 3 → 4: items came (the bag).
 * 4 → 5 (2026-10-31): the island became the world in areas, with bosses, gear, mana and abilities. The board is
 * rebuilt; every character keeps its name, class, level, xp, gold and consumables, stands on the start again with full
 * HP and mana, an empty wardrobe, its class's starting abilities and only the first area open.
 */
export function migrate(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { version?: unknown };
  if (candidate.version === STATE_VERSION) return raw as GameState;
  if (candidate.version === 1 || candidate.version === 2 || candidate.version === 3 || candidate.version === 4) {
    return fromOlder(raw as StateV1 | StateV2 | StateV3 | StateV4);
  }
  return null;
}

function fromOlder(old: StateV1 | StateV2 | StateV3 | StateV4): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  const board = makeBoard();
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    const fresh = makeCharacter(id, typeof c.name === 'string' ? c.name : id, c.classId, board);
    const level = Math.max(1, Math.floor(typeof c.level === 'number' ? c.level : 1));
    const growth = CLASS_DATA[c.classId].growth;
    const grown: Character = {
      ...fresh,
      level,
      xp: typeof c.xp === 'number' ? c.xp : 0,
      gold: typeof c.gold === 'number' ? Math.max(0, c.gold) : fresh.gold,
      items: typeof c.items === 'object' && c.items !== null ? { ...c.items } : {},
      maxHp: fresh.maxHp + growth.hp * (level - 1),
      maxMana: fresh.maxMana + growth.mana * (level - 1),
      attack: fresh.attack + growth.attack * (level - 1),
      defense: fresh.defense + growth.defense * (level - 1),
    };
    characters[id] = { ...grown, hp: grown.maxHp, mana: grown.maxMana };
  }
  const sides = typeof old.die?.sides === 'number' ? old.die.sides : DICE_DATA.sides;
  return { version: STATE_VERSION, seed: old.seed, board, characters, die: { sides, last: null }, spawns: {}, nextItem: 1 };
}
