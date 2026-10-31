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
  type GameEvent,
  type GameState,
  type Rng,
} from '../../rules/src/index.ts';

export const SAVE_KEY = 'boardworld.save';
export const SAVE_VERSION = 1;
/** The one local player. Accounts come with the server. */
export const PLAYER = 'local';

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

  private constructor(state: GameState, rng: Rng, storage: Storage | null) {
    this.state = state;
    this.rng = rng;
    this.storage = storage;
  }

  /** The saved game if there is one we understand, otherwise a fresh game from a new seed. */
  static load(storage: Storage | null, seed: string = newSeed()): LocalGame {
    try {
      const raw = storage?.getItem(SAVE_KEY);
      if (raw) {
        const save = JSON.parse(raw) as Partial<Save>;
        const state = save.version === SAVE_VERSION ? migrate(save.state) : null;
        if (state && typeof save.rng === 'number') return new LocalGame(state, resumeRng(save.rng), storage);
      }
    } catch {
      // A broken save: start fresh below.
    }
    const game = new LocalGame(newGame({ seed, player: PLAYER, name: 'Robin', classId: 'warrior' }), makeRng(seed), storage);
    game.save();
    return game;
  }

  get me(): Character {
    return this.state.characters[PLAYER]!;
  }

  /** Apply what the player wants and save. Returns what happened. */
  act(intent: Intent): GameEvent[] {
    const action = { ...intent, id: newId() } as Action;
    const result = apply(this.state, action, this.rng);
    this.state = result.state;
    this.save();
    return result.events;
  }

  /** Throw the save away and start again. */
  reset(seed: string = newSeed()): void {
    this.state = newGame({ seed, player: PLAYER, name: 'Robin', classId: 'warrior' });
    this.rng = makeRng(seed);
    this.save();
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
