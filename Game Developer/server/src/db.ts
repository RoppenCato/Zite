// SQLite for the world. One file on Robin's PC; a schema version from day one, and a migration for each step up.

import Database from 'better-sqlite3';

export type Db = Database.Database;

export const SCHEMA_VERSION = 1;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- One row per region actor: its state as JSON, its random stream's position, its version.
CREATE TABLE IF NOT EXISTS regions (
  id         TEXT PRIMARY KEY,
  version    INTEGER NOT NULL,
  state      TEXT NOT NULL,
  rng        INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
-- The answer given to each action id, so a retry gets the same answer (shared-world rule 3).
CREATE TABLE IF NOT EXISTS results (
  region_id  TEXT NOT NULL,
  action_id  TEXT NOT NULL,
  result     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (region_id, action_id)
);
`;

/** Open (or create) the database at `path`; ':memory:' for tests. */
export function openDb(path: string): Db {
  const db = new Database(path);
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as { value: string } | undefined;
  if (!row) {
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('schema_version', String(SCHEMA_VERSION));
  } else if (Number(row.value) !== SCHEMA_VERSION) {
    // When schema 2 comes, the step from 1 to 2 runs here before the server starts.
    throw new Error(`database is schema ${row.value}; this server needs ${SCHEMA_VERSION} and has no migration for that yet`);
  }
  return db;
}

/** Forget results older than `olderThanMs` (shared-world rule 3: ids expire after a few days). */
export function pruneResults(db: Db, now: number, olderThanMs: number): number {
  return db.prepare('DELETE FROM results WHERE created_at < ?').run(now - olderThanMs).changes;
}
