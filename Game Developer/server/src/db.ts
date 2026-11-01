// SQLite for the world. One file on Robin's PC; a schema version from day one, and a migration for each step up.

import Database from 'better-sqlite3';

export type Db = Database.Database;

export const SCHEMA_VERSION = 2;

// Schema 1: the regions and the answers. Schema 2 adds the accounts and their tokens. Every statement is "if not
// exists", so running them all is also the step up from 1 to 2; a later step that changes a table goes in `upgrade`.
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
-- One account per character: its id is the player id in the region's state; the code is what a player types on a new phone.
CREATE TABLE IF NOT EXISTS accounts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  class_id   TEXT NOT NULL,
  region_id  TEXT NOT NULL,
  recovery   TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);
-- The secrets devices hold: one account, many phones.
CREATE TABLE IF NOT EXISTS tokens (
  token      TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  created_at INTEGER NOT NULL
);
`;

/** Open (or create) the database at `path`; ':memory:' for tests. */
export function openDb(path: string): Db {
  const db = new Database(path);
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as { value: string } | undefined;
  const found = row ? Number(row.value) : null;
  if (found === null) {
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('schema_version', String(SCHEMA_VERSION));
  } else if (found < SCHEMA_VERSION) {
    upgrade(db, found);
    db.prepare('UPDATE meta SET value = ? WHERE key = ?').run(String(SCHEMA_VERSION), 'schema_version');
  } else if (found !== SCHEMA_VERSION) {
    throw new Error(`database is schema ${row!.value}; this server needs ${SCHEMA_VERSION} and cannot go down`);
  }
  return db;
}

/** The steps from an older schema to this one, in order. From 1: nothing beyond the new tables `SCHEMA` already made. */
function upgrade(_db: Db, from: number): void {
  if (from < 1) throw new Error(`database is schema ${from}; that was never written`);
}

/** Forget results older than `olderThanMs` (shared-world rule 3: ids expire after a few days). */
export function pruneResults(db: Db, now: number, olderThanMs: number): number {
  return db.prepare('DELETE FROM results WHERE created_at < ?').run(now - olderThanMs).changes;
}
