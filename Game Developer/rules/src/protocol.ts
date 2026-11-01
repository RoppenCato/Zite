// Every message between the client and the server, as types (docs/state/protocol.md says when each is sent and what
// answers it). Both sides import these and the version, so a change here is felt on both. Nothing in here runs.

import type { Delta } from './delta.ts';
import type { Action, ClassId, GameEvent, GameState } from './types.ts';

export const PROTOCOL_VERSION = 1;

/** The most a client may send in one frame, in bytes. */
export const MAX_FRAME = 16 * 1024;
/** Intents allowed per socket inside the span; more are refused, and a socket that keeps flooding is closed. */
export const RATE = { intents: 30, windowMs: 10_000, closeAfter: 10 } as const;
/** How long the server gathers what others did before sending one `event` to a socket. */
export const BATCH_MS = 60;

/** An action as it travels: the rules' action without `player`, which the server stamps on from the account. */
export type WireAction = Action extends infer A ? (A extends Action ? Omit<A, 'player'> : never) : never;

export type ClientMessage =
  | { type: 'join'; protocol: number; token?: string; name?: string; classId?: ClassId; recover?: string }
  | { type: 'intent'; action: WireAction }
  | { type: 'leave' }
  | { type: 'ping' };

export type ServerMessage =
  | { type: 'snapshot'; version: number; serverTime: number; player: string; token?: string; recovery: string; state: GameState; online: string[] }
  | { type: 'result'; action: string; version: number; serverTime: number; events: GameEvent[]; replayed: boolean; delta?: Delta }
  | { type: 'event'; version: number; serverTime: number; events: GameEvent[]; delta?: Delta; online?: string[] }
  | { type: 'error'; reason: string; action?: string }
  | { type: 'pong'; serverTime: number };
