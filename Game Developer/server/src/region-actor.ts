// A region actor: the one owner of a region's state. It takes actions one at a time through the same rules the
// client runs (with its own clock passed in, for spots that give again and for spawns), keeps its state and its dice
// in SQLite, answers a repeated action id with the stored answer, and says what each action changed (the delta).
// The shape of a Cloudflare Durable Object or a Colyseus room (CLAUDE.md), so the server can move later.

import {
  apply,
  diffState,
  makeRng,
  migrate,
  newWorld,
  resumeRng,
  type Action,
  type Delta,
  type GameEvent,
  type GameState,
  type Rng,
} from '../../rules/src/index.ts';
import type { Db } from './db.ts';

export interface ActionResult {
  /** The state version this action produced (unchanged when the action was refused). */
  version: number;
  events: GameEvent[];
  /** True when this action id had been answered before and the stored answer was returned. */
  replayed: boolean;
  /** What the action changed, for the client's merge: null when nothing did; not kept, so absent on a replayed answer. */
  delta?: Delta | null;
}

export interface Snapshot {
  version: number;
  state: GameState;
}

export interface RegionActorOptions {
  id: string;
  db: Db;
  /** The clock, injected so tests are fixed. Defaults to Date.now. */
  now?: () => number;
  /** How to make the region when the database has none. Defaults to a fresh game seeded with the region's id. */
  create?: () => { seed: string; state: GameState };
}

interface RegionRow {
  version: number;
  state: string;
  rng: number;
}

export class RegionActor {
  readonly id: string;
  private readonly db: Db;
  private readonly now: () => number;
  private state: GameState;
  private rng: Rng;
  private version: number;
  private tail: Promise<unknown> = Promise.resolve();
  private readonly getResult;
  private readonly putResult;
  private readonly putRegion;

  constructor(o: RegionActorOptions) {
    this.id = o.id;
    this.db = o.db;
    this.now = o.now ?? (() => Date.now());
    this.getResult = this.db.prepare('SELECT result FROM results WHERE region_id = ? AND action_id = ?');
    this.putResult = this.db.prepare('INSERT INTO results (region_id, action_id, result, created_at) VALUES (?, ?, ?, ?)');
    this.putRegion = this.db.prepare(
      `INSERT INTO regions (id, version, state, rng, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET version = excluded.version, state = excluded.state, rng = excluded.rng, updated_at = excluded.updated_at`,
    );

    const row = this.db.prepare('SELECT version, state, rng FROM regions WHERE id = ?').get(this.id) as RegionRow | undefined;
    if (row) {
      const state = migrate(JSON.parse(row.state));
      if (!state) throw new Error(`region ${this.id}: stored state is not a version we can read`);
      this.state = state;
      this.rng = resumeRng(row.rng);
      this.version = row.version;
    } else {
      const made = o.create?.() ?? defaultRegion(this.id);
      this.state = made.state;
      this.rng = makeRng(made.seed);
      this.version = 0;
      this.persist();
    }
  }

  /** Queue an action. Actions are applied strictly one after another, in the order they arrive. */
  submit(action: Action): Promise<ActionResult> {
    const run = this.tail.then(() => this.handle(action));
    this.tail = run.catch(() => undefined);
    return run;
  }

  /** The whole state with its version: what a client gets on join and on reconnect. */
  snapshot(): Snapshot {
    return { version: this.version, state: structuredClone(this.state) };
  }

  /** The version alone, without copying the state. */
  get currentVersion(): number {
    return this.version;
  }

  private handle(action: Action): ActionResult {
    const stored = this.getResult.get(this.id, action.id) as { result: string } | undefined;
    if (stored) return { ...(JSON.parse(stored.result) as ActionResult), replayed: true };

    const { state, events } = apply(this.state, action, this.rng, this.now());
    const delta = diffState(this.state, state);
    if (state !== this.state) {
      this.state = state;
      this.version += 1;
    }
    const result: ActionResult = { version: this.version, events, replayed: false };
    this.db.transaction(() => {
      this.persist();
      this.putResult.run(this.id, action.id, JSON.stringify(result), this.now());
    })();
    return { ...result, delta };
  }

  private persist(): void {
    this.putRegion.run(this.id, this.version, JSON.stringify(this.state), this.rng.state, this.now());
  }
}

function defaultRegion(id: string): { seed: string; state: GameState } {
  return { seed: id, state: newWorld({ seed: id }) };
}
