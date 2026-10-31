// The game as a pure function: apply(state, action, rng) -> { state, events }.
// The state passed in is never changed; a new one comes back.

import { CLASS_DATA, DICE_DATA, ISLAND_DATA } from './data.ts';
import { buildBoard } from './island.ts';
import { checkPath } from './paths.ts';
import type { Rng } from './rng.ts';
import {
  STATE_VERSION,
  type Action,
  type ApplyResult,
  type Board,
  type Character,
  type ClassId,
  type GameEvent,
  type GameState,
  type RejectReason,
} from './types.ts';

export interface NewGameOptions {
  seed: string;
  player: string;
  name: string;
  classId: ClassId;
  /** The board to play on. Left out, the island from rules/data/board.json; the tests pass the small ring. */
  board?: Board;
}

type MoveAction = Extract<Action, { type: 'move' }>;

/** The island from rules/data/board.json, built fresh so the state owns it. */
export function makeBoard(): Board {
  return buildBoard(ISLAND_DATA);
}

export function makeCharacter(id: string, name: string, classId: ClassId, space: string): Character {
  const c = CLASS_DATA[classId];
  return {
    id,
    name,
    classId,
    hp: c.hp,
    maxHp: c.hp,
    attack: c.attack,
    defense: c.defense,
    gold: c.gold,
    space,
    steps: 0,
  };
}

/** A fresh game: the board, one character on the start space, the die unrolled. */
export function newGame(o: NewGameOptions): GameState {
  const board = o.board ?? makeBoard();
  return {
    version: STATE_VERSION,
    seed: o.seed,
    board,
    characters: { [o.player]: makeCharacter(o.player, o.name, o.classId, board.start) },
    die: { sides: DICE_DATA.sides, last: null },
  };
}

export function apply(state: GameState, action: Action, rng: Rng): ApplyResult {
  const character = state.characters[action.player];
  if (!character) return reject(state, action, 'unknown player');
  switch (action.type) {
    case 'roll':
      return roll(state, action, character, rng);
    case 'move':
      return move(state, action, character);
  }
}

function reject(state: GameState, action: Action, reason: RejectReason): ApplyResult {
  return { state, events: [{ type: 'rejected', action: action.id, player: action.player, reason }] };
}

function withCharacter(state: GameState, character: Character): GameState {
  return { ...state, characters: { ...state.characters, [character.id]: character } };
}

function roll(state: GameState, action: Action, character: Character, rng: Rng): ApplyResult {
  if (character.steps > 0) return reject(state, action, 'finish your move first');
  const value = rng.int(state.die.sides);
  const next = withCharacter({ ...state, die: { ...state.die, last: value } }, { ...character, steps: value });
  return { state: next, events: [{ type: 'rolled', action: action.id, player: action.player, value }] };
}

function move(state: GameState, action: MoveAction, character: Character): ApplyResult {
  if (character.steps === 0) return reject(state, action, 'roll first');
  const problem = checkPath(state.board, character.space, character.steps, action.path);
  if (problem) return reject(state, action, problem);
  const landing = action.path[action.path.length - 1]!;
  const space = state.board.spaces[landing]!;
  const next = withCharacter(state, { ...character, space: landing, steps: 0 });
  const events: GameEvent[] = [
    { type: 'moved', action: action.id, player: action.player, from: character.space, path: [...action.path] },
    { type: 'landed', action: action.id, player: action.player, space: landing, kind: space.kind },
  ];
  return { state: next, events };
}
