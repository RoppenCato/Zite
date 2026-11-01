// Solo play: the state and the random stream live here, in the browser, saved to localStorage.
// This is the only place in the client that calls the rules. When the server comes (MVP step 2), a second holder
// sends the same intents over a socket instead; the scenes do not change.

import {
  apply,
  makeRng,
  migrate,
  newGame,
  resumeRng,
  type Action,
  type Character,
  type ClassId,
  type GameEvent,
  type GameState,
  type Rng,
} from '../../rules/src/index.ts';

import { tips } from './tips.ts';

export const SAVE_KEY = 'boardworld.save';
export const SAVE_VERSION = 1;
/** The one local player. Accounts come with the server. */
export const PLAYER = 'local';
/** How often the world ticks (spawns come and go) while the page is open. */
export const TICK_MS = 60_000;

interface Save {
  version: typeof SAVE_VERSION;
  state: GameState;
  /** The random stream's position, so a reload carries on with the same dice. */
  rng: number;
}

/** An action without its id: the holder adds the id (shared-world rule 3). */
type Intent = Action extends infer A ? (A extends Action ? Omit<A, 'id'> : never) : never;

export class LocalGame {
  state: GameState;
  readonly player = PLAYER;
  private rng: Rng;
  private readonly storage: Storage | null;
  /** Called after every action that changed the world's spawns, so the board can redraw its markers. */
  onSpawns: (() => void) | null = null;

  private constructor(state: GameState, rng: Rng, storage: Storage | null) {
    this.state = state;
    this.rng = rng;
    this.storage = storage;
  }

  /** The saved game if there is one we understand; null when there is none (or it is broken), so the character screen comes up. */
  static load(storage: Storage | null): LocalGame | null {
    try {
      const raw = storage?.getItem(SAVE_KEY);
      if (raw) {
        const save = JSON.parse(raw) as Partial<Save>;
        const state = save.version === SAVE_VERSION ? migrate(save.state) : null;
        if (state && typeof save.rng === 'number') return new LocalGame(state, resumeRng(save.rng), storage);
      }
    } catch {
      // A broken save: start fresh.
    }
    return null;
  }

  /** A fresh game for the character the player made, saved at once. */
  static create(storage: Storage | null, o: { name: string; classId: ClassId; seed?: string }): LocalGame {
    const seed = o.seed ?? newSeed();
    const game = new LocalGame(newGame({ seed, player: PLAYER, name: o.name, classId: o.classId }), makeRng(seed), storage);
    game.save();
    return game;
  }

  get me(): Character {
    return this.state.characters[PLAYER]!;
  }

  /** The holder's clock: the rules never read one themselves. */
  now(): number {
    return Date.now();
  }

  /** Apply what the player wants and save. Returns what happened. */
  act(intent: Intent): GameEvent[] {
    const action = { ...intent, id: newId() } as Action;
    const result = apply(this.state, action, this.rng, this.now());
    const spawnsBefore = this.state.spawns;
    this.state = result.state;
    this.save();
    if (this.state.spawns !== spawnsBefore) this.onSpawns?.();
    return result.events;
  }

  /** The world moves: spawns come and go. The page calls it on load and every minute. */
  tick(): GameEvent[] {
    return this.act({ type: 'tick', player: 'world' });
  }

  /** Throw the save away; the next load has no game and shows the character screen. */
  /** Throw the save away (and the first minutes' tips with it): the next load is the character screen. */
  reset(): void {
    tips.clear();
    try {
      this.storage?.removeItem(SAVE_KEY);
    } catch {
      // Storage blocked: nothing to throw away.
    }
  }

  private save(): void {
    try {
      const save: Save = { version: SAVE_VERSION, state: this.state, rng: this.rng.state };
      this.storage?.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Storage full or blocked: the game goes on, unsaved.
    }
  }
}

function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function newSeed(): string {
  return newId();
}
