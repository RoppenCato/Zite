// What the scenes need from whatever holds the state: the local game (solo, the state in the browser) or the remote one
// (the server holds it; docs/state/protocol.md). The scenes cannot tell the two apart. `act` answers later in both, so
// a scene waits the same way whether the dice roll here or on Robin's PC.

import type { Action, Character, GameEvent, GameState } from '../../rules/src/index.ts';

/** An action without its id: the holder adds the id (shared-world rule 3). */
export type Intent = Action extends infer A ? (A extends Action ? Omit<A, 'id'> : never) : never;

/** How the holder stands: solo, or connected, or trying to connect. */
export type Link = { kind: 'solo' } | { kind: 'online'; online: number } | { kind: 'connecting'; tries: number; reason: string };

export interface GameHolder {
  state: GameState;
  readonly player: string;
  readonly me: Character;
  /** Apply what the player wants; the events say what happened. */
  act(intent: Intent): Promise<GameEvent[]>;
  /** The world moves: spawns come and go. The page calls it on load and every minute (the server ticks on its own). */
  tick(): Promise<GameEvent[]>;
  /** Throw the save (or the device's account token) away; the next load shows the character screen. */
  reset(): void;
  /** The holder's clock, in ms: the server's when there is one. */
  now(): number;
  /** The link to the world, for the HUD. */
  link(): Link;
  /** The recovery code of the account, when there is one, for the settings screen. */
  recovery(): string | null;
  /** Called after every action that changed the world's spawns, so the board can redraw its markers. */
  onSpawns: (() => void) | null;
  /** The other players connected right now (none in solo play). */
  onlinePlayers(): string[];
  /** Called when the state changed under the player: another player moved, the world ticked, a reconnect brought a snapshot. */
  onChange: ((what: WorldChange) => void) | null;
}

/** What changed under the player, and the events the others made that are worth a line. */
export interface WorldChange {
  others: boolean;
  me: boolean;
  board: boolean;
  spawns: boolean;
  traces: boolean;
  link: boolean;
  events: GameEvent[];
}
