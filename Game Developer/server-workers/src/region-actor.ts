// The region actor on Cloudflare: the one owner of a region's state, the same shape as the Node server's
// (server/src/region-actor.ts) with SQLite reached through the small `Sql` interface instead of better-sqlite3, so the
// Durable Object (index.ts) and the tests (test/) run one and the same code. Actions go through the rules one at a
// time with the actor's own dice and clock, the state and the dice live in the object's SQLite, a repeated action id
// gets the stored answer, and every fresh answer carries its delta for the client's merge.

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
import type { Sql } from './sql.ts';

export const SCHEMA_VERSION = 2;

/** The region's tables: the same rows as the Node server's (docs/state/server.md, "SQLite"), so the import is a copy. */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS regions (
  id         TEXT PRIMARY KEY,
  version    INTEGER NOT NULL,
  state      TEXT NOT NULL,
  rng        INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS results (
  region_id  TEXT NOT NULL,
  action_id  TEXT NOT NULL,
  result     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (region_id, action_id)
);
`;

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

/** A region's row as the Node server stores it, and as the import brings it (tools/import-world.mjs). */
export interface RegionRow {
  id: string;
  version: number;
  /** The state as JSON, or already parsed. */
  state: string | GameState;
  rng: number;
  updated_at: number;
}

/** A stored answer as the Node server stores it. */
export interface ResultRow {
  action_id: string;
  result: string;
  created_at: number;
}

export interface RegionActorOptions {
  id: string;
  sql: Sql;
  /** The clock, injected so tests are fixed. Defaults to Date.now. */
  now?: () => number;
  /** How to make the region when the storage has none. Defaults to a fresh world seeded with the region's id. */
  create?: () => { seed: string; state: GameState };
}

interface StoredRegion {
  version: number;
  state: string;
  rng: number;
}

/** Make the tables (every statement is "if not exists") and check the schema's version; a newer one stops us. */
export function openRegionSchema(sql: Sql): void {
  sql.exec(SCHEMA);
  const row = sql.exec<{ value: string }>('SELECT value FROM meta WHERE key = ?', 'schema_version')[0];
  if (!row) sql.exec('INSERT INTO meta (key, value) VALUES (?, ?)', 'schema_version', String(SCHEMA_VERSION));
  else if (Number(row.value) > SCHEMA_VERSION) throw new Error(`storage is schema ${row.value}; this worker needs ${SCHEMA_VERSION} and cannot go down`);
  else if (Number(row.value) < SCHEMA_VERSION) sql.exec('UPDATE meta SET value = ? WHERE key = ?', String(SCHEMA_VERSION), 'schema_version');
}

/** Forget results older than `olderThanMs` (shared-world rule 3: ids expire after a few days); how many went. */
export function pruneResults(sql: Sql, now: number, olderThanMs: number): number {
  const before = now - olderThanMs;
  const n = sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM results WHERE created_at < ?', before)[0]?.n ?? 0;
  if (n) sql.exec('DELETE FROM results WHERE created_at < ?', before);
  return n;
}

export class RegionActor {
  readonly id: string;
  private readonly sql: Sql;
  private readonly now: () => number;
  private state: GameState;
  private rng: Rng;
  private version: number;
  private tail: Promise<unknown> = Promise.resolve();

  constructor(o: RegionActorOptions) {
    this.id = o.id;
    this.sql = o.sql;
    this.now = o.now ?? (() => Date.now());
    const row = this.sql.exec<StoredRegion>('SELECT version, state, rng FROM regions WHERE id = ?', this.id)[0];
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

  /** How many characters live in this region. */
  get playerCount(): number {
    return Object.keys(this.state.characters).length;
  }

  /** The characters, for the import's answer: who came across. */
  people(): { id: string; name: string; classId: string; level: number }[] {
    return Object.values(this.state.characters).map((c) => ({ id: c.id, name: c.name, classId: c.classId, level: c.level }));
  }

  /**
   * Take over a region's row from another server (the import, tools/import-world.mjs): its state, stepped up to today's
   * shape, its version and the position of its dice. What this actor held is gone.
   */
  replaceWith(row: RegionRow): void {
    const parsed: unknown = typeof row.state === 'string' ? JSON.parse(row.state) : row.state;
    const state = migrate(parsed);
    if (!state) throw new Error(`region ${this.id}: the imported state is not a version we can read`);
    this.state = state;
    this.rng = resumeRng(row.rng);
    this.version = row.version;
    this.persist();
  }

  /** Stored answers from another server, so a phone that retries an old action still gets its answer. An id already here keeps what it has. How many answers are stored now. */
  putResults(rows: ResultRow[]): number {
    this.sql.transaction(() => {
      for (const r of rows) this.sql.exec('INSERT OR IGNORE INTO results (region_id, action_id, result, created_at) VALUES (?, ?, ?, ?)', this.id, r.action_id, r.result, r.created_at);
    });
    return this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM results WHERE region_id = ?', this.id)[0]?.n ?? 0;
  }

  private handle(action: Action): ActionResult {
    const stored = this.sql.exec<{ result: string }>('SELECT result FROM results WHERE region_id = ? AND action_id = ?', this.id, action.id)[0];
    if (stored) return { ...(JSON.parse(stored.result) as ActionResult), replayed: true };

    const { state, events } = apply(this.state, action, this.rng, this.now());
    const delta = diffState(this.state, state);
    if (state !== this.state) {
      this.state = state;
      this.version += 1;
    }
    const result: ActionResult = { version: this.version, events, replayed: false };
    this.sql.transaction(() => {
      this.persist();
      this.sql.exec('INSERT INTO results (region_id, action_id, result, created_at) VALUES (?, ?, ?, ?)', this.id, action.id, JSON.stringify(result), this.now());
    });
    return { ...result, delta };
  }

  private persist(): void {
    this.sql.exec(
      `INSERT INTO regions (id, version, state, rng, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET version = excluded.version, state = excluded.state, rng = excluded.rng, updated_at = excluded.updated_at`,
      this.id,
      this.version,
      JSON.stringify(this.state),
      this.rng.state,
      this.now(),
    );
  }
}

function defaultRegion(id: string): { seed: string; state: GameState } {
  return { seed: id, state: newWorld({ seed: id }) };
}
