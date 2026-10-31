// The shape of the game. Nothing here renders, talks to a socket or reads a clock.

export const STATE_VERSION = 3;

export type SpaceKind = 'town' | 'battle' | 'shop' | 'event' | 'treasure' | 'quest' | 'bossgate' | 'shrine';

export type ClassId = 'warrior' | 'rogue' | 'mage' | 'ranger';

/**
 * One space on the board. `x` and `y` are world pixels inside the board's width and height (the camera follows the
 * character over them); `links` are the spaces one step away. A plain road space has the name "".
 */
export interface Space {
  id: string;
  kind: SpaceKind;
  name: string;
  x: number;
  y: number;
  links: string[];
}

/**
 * The board is a graph: spaces and the connections between them, never a grid. `width` and `height` are the world's
 * size in world pixels: the camera's bounds.
 */
export interface Board {
  start: string;
  width: number;
  height: number;
  spaces: Record<string, Space>;
}

export interface Character {
  id: string;
  name: string;
  classId: ClassId;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  gold: number;
  /** The space the character stands on. */
  space: string;
  /** Steps still to walk from the last roll; 0 means no roll is pending. */
  steps: number;
  xp: number;
  level: number;
  /** The fight the character is in, or null. While it lasts, roll and move are refused. */
  fight: Fight | null;
}

/** The enemy as it stands in a fight. */
export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  gold: number;
}

export interface Fight {
  enemy: Enemy;
  /** The round about to be fought, from 1. */
  round: number;
  /** True after a charging skill: the next hit is multiplied by the skill's power. */
  charged: boolean;
}

export interface Die {
  sides: number;
  /** The last value rolled, or null before the first roll. */
  last: number | null;
}

export interface GameState {
  version: typeof STATE_VERSION;
  seed: string;
  board: Board;
  characters: Record<string, Character>;
  die: Die;
}

/** What a player wants. Every action carries a client-made id so a retry never acts twice. */
export type Action =
  | { type: 'roll'; id: string; player: string }
  | { type: 'move'; id: string; player: string; path: string[] }
  /** In a fight: a plain hit, a guard that halves the enemy's next hit, the class's own move, or a try at running. */
  | { type: 'attack'; id: string; player: string }
  | { type: 'defend'; id: string; player: string }
  | { type: 'skill'; id: string; player: string }
  | { type: 'flee'; id: string; player: string };

export type RejectReason =
  | 'unknown player'
  | 'finish your move first'
  | 'roll first'
  | 'wrong number of steps'
  | 'no such space'
  | 'not connected'
  | 'no turning back'
  | 'finish the fight first'
  | 'not in a fight';

/** What happened. The client plays these back; the server will send them on. */
export type GameEvent =
  | { type: 'rolled'; action: string; player: string; value: number }
  | { type: 'moved'; action: string; player: string; from: string; path: string[] }
  | { type: 'landed'; action: string; player: string; space: string; kind: SpaceKind }
  /** Gold found (delta > 0) or lost (delta < 0); `gold` is the new total. */
  | { type: 'gold'; action: string; player: string; delta: number; gold: number }
  /** HP given back; `amount` is 0 when there was nothing to heal. `hp` is the new value. */
  | { type: 'healed'; action: string; player: string; amount: number; hp: number }
  /** The card an event space drew; what it did follows as gold or healed events. */
  | { type: 'event'; action: string; player: string; card: string; text: string }
  /** A fight began on a battle space, against this enemy. */
  | { type: 'fight'; action: string; player: string; enemy: Enemy }
  /** One hit landed; `hp` is what the one hit has left. `by` says who struck; `move` names the move. */
  | { type: 'hit'; action: string; player: string; by: 'player' | 'enemy'; move: string; damage: number; crit: boolean; hp: number }
  | { type: 'charged'; action: string; player: string }
  | { type: 'guarded'; action: string; player: string }
  | { type: 'fled'; action: string; player: string; ok: boolean }
  | { type: 'won'; action: string; player: string; xp: number; gold: number }
  | { type: 'levelled'; action: string; player: string; level: number; maxHp: number; attack: number; defense: number }
  /** Beaten: back on your feet in the nearest town, a share of the gold gone. */
  | { type: 'died'; action: string; player: string; town: string; lostGold: number }
  | { type: 'rejected'; action: string; player: string; reason: RejectReason };

export interface ApplyResult {
  state: GameState;
  events: GameEvent[];
}
